'use strict'

// Support tickets — what the in-app support chat writes to. The user picks a department
// on the topic-select screen, writes their issue, and this creates a ticket against that
// team. A member of the team then picks it up from the queue and calls the number on the
// ticket. WhatsApp/email remain the user's alternative contact routes, not the delivery
// path.
//
// Tables: prisma/sql/support_tickets.sql (tickets, messages, attachments, agents).
// The ref (#AL-2291) comes from a Postgres sequence, not the device — the app used to
// mint it locally, which collides across phones and produces a number that exists
// nowhere.

const { validationResult } = require('express-validator')
const db = require('../config/database')
const ApiResponse = require('../utils/ApiResponse')
const { uploadFile } = require('../services/storage')
const { userHasPermission } = require('../services/admin/permissions')
const svc = require('../services/support/support.service')
const { emitToTicket, emitToStaffQueue } = require('../realtime')

const MAX_TEXT = 4000

// Staff = "may see support tickets", not "carries any admin_role". `admin_role` answers
// the wrong question — content_manager IS an admin role but was deliberately withheld
// support.view (Task 4), so an isAdminRole/truthy check would let it read (and browse)
// any family's ticket, including staff-only call logs. userHasPermission is the same gate
// the realtime layer (server/src/realtime/index.js) already uses.
//
// userHasPermission, not hasPermission(admin_role, …), because the ROLE is only half the
// answer: deactivating an account (admin/users.controller.js setStatus) flips is_active
// and deliberately leaves admin_role alone, and the web portal only enforces that switch
// at its own login — which a phone already holding an app JWT never reaches again. On the
// role alone, an agent who left the company kept reading every family's ticket, name and
// phone number from the app until their token expired.
const staffCan = (req, permission) => userHasPermission(req.user, permission)
const isStaff = (req) => staffCan(req, 'support.view')

// Pick the active member of this team carrying the fewest open tickets. Returns null when
// the team has nobody registered — which is the honest default, and what the app renders
// as "team ka member aapse contact karega" rather than naming an invented agent.
//
// "Load" is LIVE work only. This used to read `status <> 'resolved'`, but the v2 migration
// (prisma/sql/support_tickets.sql) rewrote every `resolved` row to `closed` and nothing
// writes `resolved` any more — so that predicate excluded nothing and counted every ticket
// the agent had ever been assigned, closed ones included. A lifetime counter never goes
// down, so the moment a second member joins a team the incumbent's count stays permanently
// higher and every new ticket routes to the newcomer forever. The three live statuses are
// the only ones that represent work still on someone's desk.
async function pickAgent(team) {
  const rows = await db.$queryRawUnsafe(
    `SELECT a."userId", a."name",
            (SELECT COUNT(*) FROM "support_tickets" t
              WHERE t."assignedToId" = a."userId"
                AND t."status" IN ('open', 'assigned', 'pending_confirmation')) AS "load"
       FROM "support_agents" a
      WHERE a."team" = $1 AND a."active" = true
      ORDER BY "load" ASC, a."createdAt" ASC
      LIMIT 1`,
    team,
  )
  return rows && rows.length ? rows[0] : null
}

function shape(t) {
  return {
    id: t.id,
    ref: t.ref,
    status: t.status,
    team: t.team,
    topicId: t.topicId,
    topicLabel: t.topicLabel,
    createdAt: t.createdAt,
    assignedTo: t.assignedToName ? { name: t.assignedToName, team: t.team } : null,
    resolution: t.resolvedAt
      ? { summary: t.resolutionSummary || '', at: t.resolvedAt, by: t.resolvedByName || null }
      : null,
    updatedAt: t.updatedAt,
    // The user's CSAT, echoed back so the Resolved screen can show what they already gave
    // instead of resetting to zero stars every time they reopen the thread.
    rating: t.rating || null,
    ratedAt: t.ratedAt || null,
    staffReadAt: t.staffReadAt || null,
    autoCloseAt: t.autoCloseAt || null,
    unread: !!(t.updatedAt && (!t.userReadAt || t.userReadAt < t.updatedAt)),
  }
}

// Only the person who raised it, or a member of staff, may read a ticket. Without this a
// sequential ref would let anyone enumerate other families' billing complaints.
async function loadOwned(req, ticketId) {
  const rows = await db.$queryRawUnsafe(
    `SELECT * FROM "support_tickets" WHERE id = $1::uuid LIMIT 1`,
    ticketId,
  )
  if (!rows || !rows.length) return { error: ['Ticket not found.', 404] }
  const t = rows[0]
  const staff = isStaff(req)
  if (t.userId !== req.user.id && !staff) return { error: ['Ticket not found.', 404] }
  return { ticket: t }
}

// ─── POST /api/support/tickets ────────────────────────────────────────────────
async function create(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { topicId, topicLabel, team, message, phone, childName } = req.body
    const role = req.scope && req.scope.role === 'parent' ? 'parent' : 'student'
    const text = String(message || '').trim().slice(0, MAX_TEXT)

    const agent = await pickAgent(team)

    const rows = await db.$queryRawUnsafe(
      `INSERT INTO "support_tickets"
         ("ref", "userId", "role", "topicId", "topicLabel", "team", "status",
          "phone", "childName", "assignedToId", "assignedToName", "assignedAt")
       VALUES ('AL-' || nextval('support_ticket_ref_seq'), $1::uuid, $2, $3, $4, $5,
               CASE WHEN $8::uuid IS NULL THEN 'open' ELSE 'assigned' END,
               $6, $7, $8::uuid, $9,
               CASE WHEN $8::uuid IS NULL THEN NULL ELSE now() END)
       RETURNING *`,
      req.user.id,
      role,
      String(topicId),
      String(topicLabel || ''),
      String(team),
      phone ? String(phone).trim() : null,
      childName ? String(childName).trim() : null,
      agent ? agent.userId : null,
      agent ? agent.name : null,
    )
    const ticket = rows[0]

    if (text) {
      await db.$executeRawUnsafe(
        `INSERT INTO "support_messages" ("ticketId", "authorId", "authorRole", "text")
         VALUES ($1::uuid, $2::uuid, 'user', $3)`,
        ticket.id, req.user.id, text,
      )
    }

    emitToStaffQueue('ticket:new', shape(ticket))

    return ApiResponse.created(res, shape(ticket), 'Ticket raised')
  } catch (err) {
    return next(err)
  }
}

// ─── POST /api/support/tickets/:id/messages ───────────────────────────────────
async function addMessage(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { ticket, error } = await loadOwned(req, req.params.id)
    if (error) return ApiResponse.error(res, error[0], error[1])

    // loadOwned already proved this caller is either the owner or a support.view holder.
    // Replying as staff is a further, narrower grant — support.view lets you watch a
    // queue, it does not by itself let you speak into someone's thread.
    const isOwner = ticket.userId === req.user.id
    if (!isOwner && !staffCan(req, 'support.reply')) {
      return ApiResponse.error(res, 'You do not have permission to reply to tickets.', 403)
    }

    const text = String(req.body.text || '').trim().slice(0, MAX_TEXT)
    if (!text) return ApiResponse.error(res, 'Message cannot be empty.', 422)

    const authorRole = isOwner ? 'user' : 'agent'
    const authorName = isOwner ? null : (req.user.name || 'Support')
    const rows = await db.$queryRawUnsafe(
      `INSERT INTO "support_messages" ("ticketId","authorId","authorRole","authorName","text")
       VALUES ($1::uuid, $2::uuid, $3, $4, $5) RETURNING id, "createdAt"`,
      ticket.id, req.user.id, authorRole, authorName, text,
    )
    // A reply does NOT reopen a closed ticket. It used to, which meant a user's "thank
    // you" pushed every just-closed ticket back into the queue. Reopening is the
    // Reopen button's job and nothing else's.
    await db.$executeRawUnsafe(
      `UPDATE "support_tickets" SET "updatedAt" = now() WHERE id = $1::uuid`, ticket.id,
    )

    emitToTicket(ticket.id, 'message', {
      id: rows[0].id, ticketId: ticket.id, authorRole, authorName,
      kind: 'text', text, createdAt: rows[0].createdAt,
    })
    emitToStaffQueue('ticket:touched', { id: ticket.id })

    return ApiResponse.created(res, { id: rows[0].id, at: rows[0].createdAt }, 'Message added')
  } catch (err) {
    return next(err)
  }
}

// ─── POST /api/support/tickets/:id/attachments  (multipart, field `file`) ─────
async function addAttachment(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) return ApiResponse.error(res, 'No file was uploaded.', 400)

    const { ticket, error } = await loadOwned(req, req.params.id)
    if (error) return ApiResponse.error(res, error[0], error[1])

    // Same gate as addMessage/callLog. Uploading a file onto someone else's thread is a
    // write into their conversation, so support.view — which only grants watching a queue
    // — must not be enough; without this a view-only role could push a file into any
    // family's ticket.
    const isOwner = ticket.userId === req.user.id
    if (!isOwner && !staffCan(req, 'support.reply')) {
      return ApiResponse.error(res, 'You do not have permission to reply to tickets.', 403)
    }

    const url = await uploadFile(req.file.buffer, {
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      folder: 'support',
    })

    const rows = await db.$queryRawUnsafe(
      `INSERT INTO "support_attachments" ("ticketId", "name", "url", "mimeType", "sizeBytes")
       VALUES ($1::uuid, $2, $3, $4, $5) RETURNING id, "name", "url"`,
      ticket.id,
      String(req.file.originalname || 'attachment').slice(0, 200),
      url,
      req.file.mimetype || null,
      req.file.size || null,
    )
    await db.$executeRawUnsafe(`UPDATE "support_tickets" SET "updatedAt" = now() WHERE id = $1::uuid`, ticket.id)

    return ApiResponse.created(res, rows[0], 'Attachment uploaded')
  } catch (err) {
    return next(err)
  }
}

// ─── GET /api/support/tickets/:id ─────────────────────────────────────────────
async function getOne(req, res, next) {
  try {
    await svc.autoCloseExpired()

    const { ticket, error } = await loadOwned(req, req.params.id)
    if (error) return ApiResponse.error(res, error[0], error[1])

    // Call logs now reach the owner too — a missed call with no trace looks like nobody
    // tried — but the agent's free-text note stays staff-only. The blanking happens in
    // SQL, not in application code after the fact, so there is no path where the note is
    // selected into a JS object and merely forgotten before the response is sent: for a
    // non-staff caller the "text" column of a `kind = 'call'` row is replaced with '' at
    // the query itself, while callOutcome/authorName/kind/createdAt pass through intact.
    const staff = isStaff(req)
    const messages = await db.$queryRawUnsafe(
      `SELECT id, "authorRole", "authorName", "kind", "callOutcome",
              CASE WHEN "kind" = 'call' AND NOT $2::boolean THEN '' ELSE "text" END AS "text",
              "createdAt"
         FROM "support_messages"
        WHERE "ticketId" = $1::uuid
        ORDER BY "createdAt" ASC`,
      ticket.id, staff,
    )
    const attachments = await db.$queryRawUnsafe(
      `SELECT id, "name", "url", "mimeType" FROM "support_attachments"
        WHERE "ticketId" = $1::uuid ORDER BY "createdAt" ASC`,
      ticket.id,
    )
    // The thread header needs the caller's name and number. Only staff get it; for the
    // owner it is their own contact detail and simply noise.
    let raisedBy = null
    if (staff) {
      const u = await db.$queryRawUnsafe(
        `SELECT u."name", u."phone", u."access_level" AS "accessLevel" FROM "users" u WHERE u.id = $1::uuid LIMIT 1`,
        ticket.userId,
      )
      // id and accessLevel are staff-only, like the rest of raisedBy. They let the
      // console grant access from an unlock ticket instead of sending the agent to
      // People to search for the same student by name.
      raisedBy = {
        id: ticket.userId,
        name: u[0] ? u[0].name : 'Unknown',
        phone: ticket.phone || (u[0] && u[0].phone) || null,
        accessLevel: u[0] ? u[0].accessLevel : null,
      }
    }
    return ApiResponse.success(res, {
      ...shape(ticket), messages, attachments, raisedBy, childName: ticket.childName,
    })
  } catch (err) {
    return next(err)
  }
}

// ─── GET /api/support/tickets — the user's own tickets ────────────────────────
async function listMine(req, res, next) {
  try {
    await svc.autoCloseExpired()

    const rows = await db.$queryRawUnsafe(
      `SELECT * FROM "support_tickets" t
        WHERE t."userId" = $1::uuid
          -- Opening a department creates the ticket so the ref on screen is real. Ones
          -- nobody ever wrote in are not tickets; they must not fill this list either.
          AND EXISTS (SELECT 1 FROM "support_messages" m
                       WHERE m."ticketId" = t.id AND m."authorRole" = 'user')
        ORDER BY t."createdAt" DESC LIMIT 50`,
      req.user.id,
    )
    return ApiResponse.success(res, { tickets: rows.map(shape) })
  } catch (err) {
    return next(err)
  }
}

// ─── GET /api/support/queue — staff only ──────────────────────────────────────
// The team-facing view. This is what makes "the ticket reaches the team" true; an admin
// UI on top of it is the next step.
async function queue(req, res, next) {
  try {
    await svc.autoCloseExpired()
    if (!isStaff(req)) return ApiResponse.error(res, 'Staff access required.', 403)
    const team = req.query.team ? String(req.query.team) : null
    const status = req.query.status ? String(req.query.status) : 'open'
    // `open` here means WORK NOT YET RESOLVED — 'open' OR 'assigned' — not the literal
    // status string. A ticket is created as 'assigned' the moment pickAgent finds anyone
    // on the team (see create, above), and support-agents-setup.js seeds all eight teams,
    // so in practice every real ticket is born 'assigned'. Matching the literal 'open'
    // therefore showed the console an empty queue and a zero badge for every genuine
    // ticket, forever. 'all', 'pending_confirmation' and 'closed' still match exactly.
    const rows = await db.$queryRawUnsafe(
      `SELECT t.*, u."name" AS "raisedByName", u."phone" AS "raisedByPhone"
         FROM "support_tickets" t
         JOIN "users" u ON u.id = t."userId"
        WHERE ($1::text IS NULL OR t."team" = $1)
          AND ($2::text = 'all'
               OR ($2::text = 'open' AND t."status" IN ('open', 'assigned'))
               OR ($2::text <> 'open' AND t."status" = $2))
          -- A ticket is created the moment someone opens a department, so that the ref
          -- on their screen is real. Plenty of those are just browsing and never write
          -- anything. Only tickets carrying an actual message reach the team's queue.
          AND EXISTS (SELECT 1 FROM "support_messages" m
                       WHERE m."ticketId" = t.id AND m."authorRole" = 'user')
        ORDER BY t."createdAt" ASC LIMIT 200`,
      team, status,
    )
    // Counted off the SAME rows the caller just asked for, so the sidebar badge (which
    // fetches with status=open) counts exactly the tickets the Open tab lists — including
    // the 'assigned' ones. Deriving it from a second, differently-filtered query is how
    // the two drifted apart in the first place.
    const unreadCount = rows.filter((t) => !t.staffReadAt || t.staffReadAt < t.updatedAt).length
    return ApiResponse.success(res, {
      tickets: rows.map((t) => ({
        ...shape(t),
        raisedBy: { name: t.raisedByName, phone: t.phone || t.raisedByPhone },
        childName: t.childName,
      })),
      unreadCount,
    })
  } catch (err) {
    return next(err)
  }
}

// ─── PATCH /api/support/tickets/:id/resolve — staff only ──────────────────────
async function resolve(req, res, next) {
  try {
    if (!staffCan(req, 'support.resolve')) {
      return ApiResponse.error(res, 'You do not have permission to resolve tickets.', 403)
    }
    const summary = String(req.body.summary || '').trim().slice(0, 500)
    if (!summary) return ApiResponse.error(res, 'A resolution summary is required.', 422)

    const ticket = await svc.resolveTicket({
      ticketId: req.params.id, summary, byName: req.user.name || 'Support',
    })
    if (!ticket) return ApiResponse.error(res, 'Ticket not found.', 404)
    emitToTicket(ticket.id, 'status', shape(ticket))
    emitToStaffQueue('ticket:touched', { id: ticket.id })
    return ApiResponse.success(res, shape(ticket), 'Ticket resolved')
  } catch (err) {
    return next(err)
  }
}

// ─── POST /api/support/tickets/:id/close — the owner confirming ───────────────
// Staff cannot call this. The whole point of the two-sided close is that the last word
// is the user's; a staff-side close would put it back where it started.
async function close(req, res, next) {
  try {
    const { ticket, error } = await loadOwned(req, req.params.id)
    if (error) return ApiResponse.error(res, error[0], error[1])
    if (ticket.userId !== req.user.id) return ApiResponse.error(res, 'Ticket not found.', 404)

    const updated = await svc.closeTicket({ ticketId: ticket.id, userId: req.user.id })
    if (!updated) return ApiResponse.error(res, 'This ticket is not awaiting your confirmation.', 409)
    emitToTicket(updated.id, 'status', shape(updated))
    emitToStaffQueue('ticket:touched', { id: updated.id })
    return ApiResponse.success(res, shape(updated), 'Ticket closed')
  } catch (err) {
    return next(err)
  }
}

// ─── POST /api/support/tickets/:id/reopen — "abhi bhi problem hai" ────────────
async function reopen(req, res, next) {
  try {
    const { ticket, error } = await loadOwned(req, req.params.id)
    if (error) return ApiResponse.error(res, error[0], error[1])
    if (ticket.userId !== req.user.id) return ApiResponse.error(res, 'Ticket not found.', 404)

    const updated = await svc.reopenTicket({ ticketId: ticket.id, userId: req.user.id })
    if (!updated) return ApiResponse.error(res, 'This ticket is already open.', 409)
    emitToTicket(updated.id, 'status', shape(updated))
    emitToStaffQueue('ticket:touched', { id: updated.id })
    return ApiResponse.success(res, shape(updated), 'Ticket reopened')
  } catch (err) {
    return next(err)
  }
}

// ─── POST /api/support/tickets/:id/rating — the owner scoring the support ─────
// Staff cannot call this, for the same reason they cannot close a ticket: a CSAT the team
// can write is not a CSAT. loadOwned admits staff (they must be able to READ any ticket),
// so the ownership test below is what actually keeps them out.
async function rate(req, res, next) {
  try {
    const { ticket, error } = await loadOwned(req, req.params.id)
    if (error) return ApiResponse.error(res, error[0], error[1])
    if (ticket.userId !== req.user.id) return ApiResponse.error(res, 'Ticket not found.', 404)

    // Number() so '4' from a JSON body passes, Number.isInteger so 4.5 and NaN do not.
    // The database carries the same 1–5 range as a CHECK constraint; this is the friendly
    // half of that pair, not a replacement for it.
    const rating = Number(req.body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return ApiResponse.error(res, 'A rating from 1 to 5 is required.', 422)
    }

    const updated = await svc.rateTicket({ ticketId: ticket.id, userId: req.user.id, rating })
    // Null means the status predicate refused it — the ticket is still being worked on.
    if (!updated) return ApiResponse.error(res, 'This ticket cannot be rated yet.', 409)

    // The queue only; there is no ticket-room event for this. A score is for the team to
    // see in the console, not something to drop into the conversation as if it were said.
    emitToStaffQueue('ticket:touched', { id: updated.id })
    return ApiResponse.success(res, shape(updated), 'Thanks for the feedback')
  } catch (err) {
    return next(err)
  }
}

// ─── POST /api/support/tickets/:id/call-log — staff only ──────────────────────
async function callLog(req, res, next) {
  try {
    // Logging a call is a reply-shaped write (it lands in support_messages, same as
    // addMessage) — gated the same way, on support.reply rather than the broader
    // support.view.
    if (!staffCan(req, 'support.reply')) {
      return ApiResponse.error(res, 'You do not have permission to reply to tickets.', 403)
    }
    const { outcome, note } = req.body
    if (!svc.CALL_OUTCOMES.includes(outcome)) {
      return ApiResponse.error(res, 'Pick a call outcome.', 422)
    }
    const { ticket, error } = await loadOwned(req, req.params.id)
    if (error) return ApiResponse.error(res, error[0], error[1])

    const row = await svc.logCall({
      ticketId: ticket.id, authorId: req.user.id,
      authorName: req.user.name || 'Support', outcome, note,
    })
    // Staff get the full note, live, exactly as before.
    emitToStaffQueue('message', {
      id: row.id, ticketId: ticket.id, authorRole: 'agent', authorName: row.authorName,
      kind: 'call', callOutcome: row.callOutcome, text: row.text, createdAt: row.createdAt,
    })
    // The owner's open thread also gets a live update now — but outcome only. This
    // payload never carries `row.text`; it hardcodes '' so there is no path (a future
    // edit to `row`, a copy-paste from the staff emit above) that lets the note leak into
    // the ticket room, which is where the owner's socket actually listens.
    emitToTicket(ticket.id, 'message', {
      id: row.id, ticketId: ticket.id, authorRole: 'agent', authorName: row.authorName,
      kind: 'call', callOutcome: row.callOutcome, text: '', createdAt: row.createdAt,
    })
    return ApiResponse.created(res, { id: row.id, at: row.createdAt }, 'Call logged')
  } catch (err) {
    return next(err)
  }
}

// ─── POST /api/support/tickets/:id/read ───────────────────────────────────────
async function markRead(req, res, next) {
  try {
    const { ticket, error } = await loadOwned(req, req.params.id)
    if (error) return ApiResponse.error(res, error[0], error[1])
    await svc.markRead({ ticketId: ticket.id, as: isStaff(req) ? 'staff' : 'user' })
    return ApiResponse.success(res, { ok: true })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  create, addMessage, addAttachment, getOne, listMine, queue, resolve,
  close, reopen, rate, callLog, markRead,
  // Not routed — exported so tests/support.access.test.js can assert the load predicate
  // directly. Routing silently to the wrong person is invisible from the outside, which
  // is exactly why it went unnoticed until a whole-branch read.
  pickAgent,
}
