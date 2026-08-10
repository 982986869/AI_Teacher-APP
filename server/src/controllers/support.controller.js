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
const { isAdminRole } = require('../services/admin/permissions')

const MAX_TEXT = 4000

// Staff = anyone carrying a portal role. `admin_role` is a free-text column, so a
// truthy check would let a stale or misspelled value through; isAdminRole is the same
// gate /api/admin uses.
const isStaff = (req) => isAdminRole(req.user && req.user.admin_role)

// Pick the active member of this team carrying the fewest open tickets. Returns null when
// the team has nobody registered — which is the honest default, and what the app renders
// as "team ka member aapse contact karega" rather than naming an invented agent.
async function pickAgent(team) {
  const rows = await db.$queryRawUnsafe(
    `SELECT a."userId", a."name",
            (SELECT COUNT(*) FROM "support_tickets" t
              WHERE t."assignedToId" = a."userId" AND t."status" <> 'resolved') AS "load"
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
  const isStaff = !!req.user.admin_role
  if (t.userId !== req.user.id && !isStaff) return { error: ['Ticket not found.', 404] }
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

    const text = String(req.body.text || '').trim().slice(0, MAX_TEXT)
    if (!text) return ApiResponse.error(res, 'Message cannot be empty.', 422)

    const authorRole = req.user.admin_role ? 'agent' : 'user'
    const rows = await db.$queryRawUnsafe(
      `INSERT INTO "support_messages" ("ticketId", "authorId", "authorRole", "text")
       VALUES ($1::uuid, $2::uuid, $3, $4) RETURNING id, "createdAt"`,
      ticket.id, req.user.id, authorRole, text,
    )
    // A reply reopens a resolved ticket — otherwise a follow-up disappears into a closed
    // thread nobody is watching.
    await db.$executeRawUnsafe(
      `UPDATE "support_tickets"
          SET "updatedAt" = now(),
              "status" = CASE WHEN "status" = 'resolved' AND $2 = 'user' THEN 'open' ELSE "status" END
        WHERE id = $1::uuid`,
      ticket.id, authorRole,
    )

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
    const { ticket, error } = await loadOwned(req, req.params.id)
    if (error) return ApiResponse.error(res, error[0], error[1])

    const messages = await db.$queryRawUnsafe(
      `SELECT id, "authorRole", "text", "createdAt"
         FROM "support_messages" WHERE "ticketId" = $1::uuid ORDER BY "createdAt" ASC`,
      ticket.id,
    )
    const attachments = await db.$queryRawUnsafe(
      `SELECT id, "name", "url", "mimeType" FROM "support_attachments"
        WHERE "ticketId" = $1::uuid ORDER BY "createdAt" ASC`,
      ticket.id,
    )
    return ApiResponse.success(res, { ...shape(ticket), messages, attachments })
  } catch (err) {
    return next(err)
  }
}

// ─── GET /api/support/tickets — the user's own tickets ────────────────────────
async function listMine(req, res, next) {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT * FROM "support_tickets" WHERE "userId" = $1::uuid
        ORDER BY "createdAt" DESC LIMIT 50`,
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
    if (!req.user.admin_role) return ApiResponse.error(res, 'Staff access required.', 403)
    const team = req.query.team ? String(req.query.team) : null
    const status = req.query.status ? String(req.query.status) : 'open'
    const rows = await db.$queryRawUnsafe(
      `SELECT t.*, u."name" AS "raisedByName", u."phone" AS "raisedByPhone"
         FROM "support_tickets" t
         JOIN "users" u ON u.id = t."userId"
        WHERE ($1::text IS NULL OR t."team" = $1)
          AND ($2::text = 'all' OR t."status" = $2)
          -- A ticket is created the moment someone opens a department, so that the ref
          -- on their screen is real. Plenty of those are just browsing and never write
          -- anything. Only tickets carrying an actual message reach the team's queue.
          AND EXISTS (SELECT 1 FROM "support_messages" m
                       WHERE m."ticketId" = t.id AND m."authorRole" = 'user')
        ORDER BY t."createdAt" ASC LIMIT 200`,
      team, status,
    )
    return ApiResponse.success(res, {
      tickets: rows.map((t) => ({
        ...shape(t),
        raisedBy: { name: t.raisedByName, phone: t.phone || t.raisedByPhone },
        childName: t.childName,
      })),
    })
  } catch (err) {
    return next(err)
  }
}

// ─── PATCH /api/support/tickets/:id/resolve — staff only ──────────────────────
async function resolve(req, res, next) {
  try {
    if (!req.user.admin_role) return ApiResponse.error(res, 'Staff access required.', 403)
    const summary = String(req.body.summary || '').trim().slice(0, 500)
    if (!summary) return ApiResponse.error(res, 'A resolution summary is required.', 422)

    const rows = await db.$queryRawUnsafe(
      `UPDATE "support_tickets"
          SET "status" = 'resolved', "resolutionSummary" = $2,
              "resolvedByName" = $3, "resolvedAt" = now(), "updatedAt" = now()
        WHERE id = $1::uuid RETURNING *`,
      req.params.id, summary, req.user.name || 'Support',
    )
    if (!rows || !rows.length) return ApiResponse.error(res, 'Ticket not found.', 404)
    return ApiResponse.success(res, shape(rows[0]), 'Ticket resolved')
  } catch (err) {
    return next(err)
  }
}

module.exports = { create, addMessage, addAttachment, getOne, listMine, queue, resolve }
