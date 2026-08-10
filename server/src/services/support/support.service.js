'use strict'

// Support ticket lifecycle. Lives outside the controller so it can be tested directly
// against the DB the way arena.service is, and because auto-close is needed by three
// different reads.
//
// The rule the whole file exists to enforce: STAFF DO NOT CLOSE TICKETS. Staff propose
// a resolution; the ticket closes when the user confirms, or when three silent days
// pass. See docs/superpowers/specs/2026-08-10-support-ticket-console-design.md.

const db = require('../../config/database')

const STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  PENDING: 'pending_confirmation',
  CLOSED: 'closed',
}

const CALL_OUTCOMES = ['talked', 'no_answer', 'callback']

// How long a user has to confirm before the ticket closes itself.
const AUTO_CLOSE_DAYS = 3

// No scheduler is installed, and adding one for this would be a dependency for a single
// three-line UPDATE. Instead every read calls this first: a ticket nobody looks at can
// sit past its deadline in the table, because the moment anyone looks it is closed. The
// state is therefore never observably wrong.
async function autoCloseExpired() {
  return db.$executeRawUnsafe(
    `UPDATE "support_tickets"
        SET "status" = $1, "closedAt" = now(), "closedBy" = 'auto', "updatedAt" = now()
      WHERE "status" = $2
        AND "autoCloseAt" IS NOT NULL
        AND "autoCloseAt" <= now()`,
    STATUS.CLOSED, STATUS.PENDING,
  )
}

// Staff marking an issue done. Deliberately NOT `closed` — this is a proposal the user
// still has to accept. Only valid from `open`/`assigned` — a ticket already `closed` (or
// already `pending_confirmation`) must go through reopenTicket/stay put instead, so the
// audit trail (the reopened-event message) isn't bypassed.
async function resolveTicket({ ticketId, summary, byName }) {
  const rows = await db.$queryRawUnsafe(
    `UPDATE "support_tickets"
        SET "status" = $2,
            "resolutionSummary" = $3,
            "resolvedByName" = $4,
            "resolvedAt" = now(),
            "autoCloseAt" = now() + ($5 || ' days')::interval,
            "closedAt" = NULL, "closedBy" = NULL,
            "updatedAt" = now()
      WHERE id = $1::uuid AND "status" IN ($6, $7)
      RETURNING *`,
    ticketId, STATUS.PENDING, String(summary), String(byName || 'Support'), String(AUTO_CLOSE_DAYS),
    STATUS.OPEN, STATUS.ASSIGNED,
  )
  return rows[0] || null
}

// The user pressing "Issue Resolved". Only valid from `pending_confirmation` — a user
// cannot close a ticket nobody has answered yet, or the team would never see it.
async function closeTicket({ ticketId, userId }) {
  const rows = await db.$queryRawUnsafe(
    `UPDATE "support_tickets"
        SET "status" = $3, "closedAt" = now(), "closedBy" = 'user', "updatedAt" = now()
      WHERE id = $1::uuid AND "userId" = $2::uuid AND "status" = $4
      RETURNING *`,
    ticketId, userId, STATUS.CLOSED, STATUS.PENDING,
  )
  return rows[0] || null
}

// "Abhi bhi problem hai" — valid from `pending_confirmation` AND from `closed`, because
// auto-close can beat the user to it and they must still have a way back in.
async function reopenTicket({ ticketId, userId }) {
  const rows = await db.$queryRawUnsafe(
    `UPDATE "support_tickets"
        SET "status" = $3,
            "closedAt" = NULL, "closedBy" = NULL, "autoCloseAt" = NULL,
            "resolvedAt" = NULL, "resolutionSummary" = NULL, "resolvedByName" = NULL,
            "staffReadAt" = NULL,
            "updatedAt" = now()
      WHERE id = $1::uuid AND "userId" = $2::uuid AND "status" IN ($4, $5)
      RETURNING *`,
    ticketId, userId, STATUS.OPEN, STATUS.PENDING, STATUS.CLOSED,
  )
  if (!rows[0]) return null
  await db.$executeRawUnsafe(
    `INSERT INTO "support_messages" ("ticketId", "authorId", "authorRole", "kind", "text")
     VALUES ($1::uuid, $2::uuid, 'system', 'event', 'User reopened this ticket')`,
    ticketId, userId,
  )
  return rows[0]
}

// A call is staff-facing detail, stored in the same table as messages. The controller is
// responsible for withholding it from the ticket owner.
async function logCall({ ticketId, authorId, authorName, outcome, note }) {
  if (!CALL_OUTCOMES.includes(outcome)) {
    throw new Error(`Unknown call outcome: ${outcome}`)
  }
  const rows = await db.$queryRawUnsafe(
    `INSERT INTO "support_messages"
       ("ticketId","authorId","authorRole","authorName","kind","callOutcome","text")
     VALUES ($1::uuid, $2::uuid, 'agent', $3, 'call', $4, $5)
     RETURNING *`,
    ticketId, authorId, String(authorName || 'Support'), outcome, String(note || '').slice(0, 500),
  )
  await db.$executeRawUnsafe(
    `UPDATE "support_tickets" SET "updatedAt" = now() WHERE id = $1::uuid`, ticketId,
  )
  return rows[0]
}

async function markRead({ ticketId, as }) {
  const column = as === 'staff' ? 'staffReadAt' : 'userReadAt'
  await db.$executeRawUnsafe(
    `UPDATE "support_tickets" SET "${column}" = now() WHERE id = $1::uuid`, ticketId,
  )
}

module.exports = {
  STATUS, CALL_OUTCOMES, AUTO_CLOSE_DAYS,
  autoCloseExpired, resolveTicket, closeTicket, reopenTicket, logCall, markRead,
}
