'use strict'

// Ticket lifecycle against the real DB. Skips without DATABASE_URL. Every ticket this
// file creates is deleted in teardown.

try { require('dotenv').config() } catch (_) { /* dotenv optional */ }
const test = require('node:test')
const assert = require('node:assert')

const hasDb = !!process.env.DATABASE_URL
const db = hasDb ? require('../src/config/database') : null
const svc = hasDb ? require('../src/services/support/support.service') : null

const ctx = { skip: !hasDb, ids: [] }
const USER = '00000000-0000-4000-8000-00000000f001'
const STAFF = '00000000-0000-4000-8000-00000000f002'

// A ticket carrying one user message — the shape everything downstream assumes.
async function makeTicket(status = 'open') {
  const rows = await db.$queryRawUnsafe(
    `INSERT INTO "support_tickets"
       ("ref","userId","role","topicId","topicLabel","team","status")
     VALUES ('TEST-' || nextval('support_ticket_ref_seq'), $1::uuid, 'student',
             'billing', 'Billing', 'Accounts team', $2)
     RETURNING *`,
    USER, status,
  )
  const t = rows[0]
  ctx.ids.push(t.id)
  await db.$executeRawUnsafe(
    `INSERT INTO "support_messages" ("ticketId","authorId","authorRole","text")
     VALUES ($1::uuid, $2::uuid, 'user', 'paise do baar cut gaye')`,
    t.id, USER,
  )
  return t
}

const read = async (id) => (await db.$queryRawUnsafe(
  `SELECT * FROM "support_tickets" WHERE id = $1::uuid`, id,
))[0]

test('resolve moves a ticket to pending_confirmation and stamps autoCloseAt', { skip: ctx.skip }, async () => {
  const t = await makeTicket('assigned')
  await svc.resolveTicket({ ticketId: t.id, summary: 'Refund raised', byName: 'Saurabh' })
  const after = await read(t.id)
  assert.equal(after.status, 'pending_confirmation')
  assert.equal(after.resolutionSummary, 'Refund raised')
  assert.equal(after.resolvedByName, 'Saurabh')
  assert.ok(after.autoCloseAt > after.resolvedAt, 'autoCloseAt is in the future')
})

test('the user closing a pending ticket closes it as `user`', { skip: ctx.skip }, async () => {
  const t = await makeTicket('assigned')
  await svc.resolveTicket({ ticketId: t.id, summary: 'done', byName: 'Saurabh' })
  await svc.closeTicket({ ticketId: t.id, userId: USER })
  const after = await read(t.id)
  assert.equal(after.status, 'closed')
  assert.equal(after.closedBy, 'user')
  assert.ok(after.closedAt)
})

test('reopen works from pending_confirmation AND from closed', { skip: ctx.skip }, async () => {
  const a = await makeTicket('assigned')
  await svc.resolveTicket({ ticketId: a.id, summary: 'done', byName: 'S' })
  await svc.reopenTicket({ ticketId: a.id, userId: USER })
  assert.equal((await read(a.id)).status, 'open')

  const b = await makeTicket('assigned')
  await svc.resolveTicket({ ticketId: b.id, summary: 'done', byName: 'S' })
  await svc.closeTicket({ ticketId: b.id, userId: USER })
  await svc.reopenTicket({ ticketId: b.id, userId: USER })
  const after = await read(b.id)
  assert.equal(after.status, 'open', 'a closed ticket can still be reopened')
  assert.equal(after.closedAt, null, 'reopening clears the close stamps')
})

test('reopen appends an event message so the thread shows why it came back', { skip: ctx.skip }, async () => {
  const t = await makeTicket('assigned')
  await svc.resolveTicket({ ticketId: t.id, summary: 'done', byName: 'S' })
  await svc.reopenTicket({ ticketId: t.id, userId: USER })
  const msgs = await db.$queryRawUnsafe(
    `SELECT "kind" FROM "support_messages" WHERE "ticketId" = $1::uuid AND "kind" = 'event'`, t.id,
  )
  assert.equal(msgs.length, 1)
})

test('autoCloseExpired closes an overdue pending ticket and leaves a fresh one alone', { skip: ctx.skip }, async () => {
  const stale = await makeTicket('assigned')
  await svc.resolveTicket({ ticketId: stale.id, summary: 'done', byName: 'S' })
  await db.$executeRawUnsafe(
    `UPDATE "support_tickets" SET "autoCloseAt" = now() - interval '1 hour' WHERE id = $1::uuid`,
    stale.id,
  )
  const fresh = await makeTicket('assigned')
  await svc.resolveTicket({ ticketId: fresh.id, summary: 'done', byName: 'S' })

  await svc.autoCloseExpired()

  const s = await read(stale.id)
  assert.equal(s.status, 'closed')
  assert.equal(s.closedBy, 'auto')
  assert.equal((await read(fresh.id)).status, 'pending_confirmation', 'not yet due')
})

test('autoCloseExpired never touches an open ticket', { skip: ctx.skip }, async () => {
  const t = await makeTicket('open')
  await db.$executeRawUnsafe(
    `UPDATE "support_tickets" SET "autoCloseAt" = now() - interval '9 days' WHERE id = $1::uuid`, t.id,
  )
  await svc.autoCloseExpired()
  assert.equal((await read(t.id)).status, 'open')
})

test('logCall writes a call message with its outcome in its own column', { skip: ctx.skip }, async () => {
  const t = await makeTicket('assigned')
  await svc.logCall({
    ticketId: t.id, authorId: STAFF, authorName: 'Saurabh',
    outcome: 'no_answer', note: 'ring hui, uthaya nahi',
  })
  const rows = await db.$queryRawUnsafe(
    `SELECT * FROM "support_messages" WHERE "ticketId" = $1::uuid AND "kind" = 'call'`, t.id,
  )
  assert.equal(rows.length, 1)
  assert.equal(rows[0].callOutcome, 'no_answer')
  assert.equal(rows[0].authorName, 'Saurabh')
  assert.equal(rows[0].text, 'ring hui, uthaya nahi')
})

test('logCall rejects an outcome outside the allowed set', { skip: ctx.skip }, async () => {
  const t = await makeTicket('assigned')
  await assert.rejects(
    () => svc.logCall({ ticketId: t.id, authorId: STAFF, authorName: 'S', outcome: 'maybe', note: '' }),
    /outcome/i,
  )
})

test('markRead stamps the right side only', { skip: ctx.skip }, async () => {
  const t = await makeTicket('open')
  await svc.markRead({ ticketId: t.id, as: 'staff' })
  const after = await read(t.id)
  assert.ok(after.staffReadAt)
  assert.equal(after.userReadAt, null)
})

test('teardown: delete every row this file created', { skip: ctx.skip }, async () => {
  for (const id of ctx.ids) {
    await db.$executeRawUnsafe(`DELETE FROM "support_messages" WHERE "ticketId" = $1::uuid`, id)
    await db.$executeRawUnsafe(`DELETE FROM "support_tickets" WHERE id = $1::uuid`, id)
  }
  const left = await db.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS n FROM "support_tickets" WHERE "userId" = $1::uuid`, USER,
  )
  assert.equal(left[0].n, 0)
})
