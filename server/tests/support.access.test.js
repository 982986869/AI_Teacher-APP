'use strict'

// Who may read and change what. These are the rules that keep one family's billing
// complaint out of another family's app, so they are tested at the controller layer
// with fake req/res objects rather than through the service.

try { require('dotenv').config() } catch (_) { /* dotenv optional */ }
const test = require('node:test')
const assert = require('node:assert')

const hasDb = !!process.env.DATABASE_URL
const db = hasDb ? require('../src/config/database') : null
const ctrl = hasDb ? require('../src/controllers/support.controller') : null

const ctx = { skip: !hasDb, ids: [] }
const OWNER = '00000000-0000-4000-8000-00000000e001'
const OTHER = '00000000-0000-4000-8000-00000000e002'

// Minimal Express doubles: capture what the controller answered.
function fakeRes() {
  const r = { statusCode: 0, body: null }
  r.status = (c) => { r.statusCode = c; return r }
  r.json = (b) => { r.body = b; return r }
  return r
}
const fakeReq = (user, over = {}) => ({ user, params: {}, query: {}, body: {}, scope: {}, ...over })

async function makeTicket(status = 'open', withMessage = true) {
  const rows = await db.$queryRawUnsafe(
    `INSERT INTO "support_tickets" ("ref","userId","role","topicId","topicLabel","team","status")
     VALUES ('TEST-' || nextval('support_ticket_ref_seq'), $1::uuid, 'student',
             'billing','Billing','Accounts team', $2) RETURNING *`,
    OWNER, status,
  )
  const t = rows[0]
  ctx.ids.push(t.id)
  if (withMessage) {
    await db.$executeRawUnsafe(
      `INSERT INTO "support_messages" ("ticketId","authorId","authorRole","text")
       VALUES ($1::uuid, $2::uuid, 'user', 'test message')`,
      t.id, OWNER,
    )
  }
  return t
}

test('a student token is refused the staff queue', { skip: ctx.skip }, async () => {
  const res = fakeRes()
  await ctrl.queue(fakeReq({ id: OWNER, admin_role: null }), res, () => {})
  assert.equal(res.statusCode, 403)
})

test('a stale admin_role string is refused — isStaff, not a truthy check', { skip: ctx.skip }, async () => {
  const res = fakeRes()
  await ctrl.queue(fakeReq({ id: OWNER, admin_role: 'superadmin' }), res, () => {})
  assert.equal(res.statusCode, 403, "'superadmin' is not a role; only the exact names count")
})

test('a real staff role reaches the queue', { skip: ctx.skip }, async () => {
  await makeTicket('open')
  const res = fakeRes()
  await ctrl.queue(fakeReq({ id: OTHER, admin_role: 'support' }), res, () => {})
  assert.equal(res.statusCode, 200)
  assert.ok(Array.isArray(res.body.data.tickets))
  assert.equal(typeof res.body.data.unreadCount, 'number')
})

test('a user cannot close someone else’s ticket', { skip: ctx.skip }, async () => {
  const t = await makeTicket('pending_confirmation')
  const res = fakeRes()
  await ctrl.close(fakeReq({ id: OTHER, admin_role: null }, { params: { id: t.id } }), res, () => {})
  assert.equal(res.statusCode, 404, 'not 403 — an outsider must not learn the ticket exists')
  const after = await db.$queryRawUnsafe(`SELECT status FROM "support_tickets" WHERE id=$1::uuid`, t.id)
  assert.equal(after[0].status, 'pending_confirmation')
})

test('a user message no longer reopens a closed ticket', { skip: ctx.skip }, async () => {
  const t = await makeTicket('closed')
  const res = fakeRes()
  await ctrl.addMessage(
    fakeReq({ id: OWNER, admin_role: null }, { params: { id: t.id }, body: { text: 'thank you' } }),
    res, () => {},
  )
  const after = await db.$queryRawUnsafe(`SELECT status FROM "support_tickets" WHERE id=$1::uuid`, t.id)
  assert.equal(after[0].status, 'closed', 'only the Reopen button reopens')
})

test('a ticket with no user message shows in neither queue nor listMine', { skip: ctx.skip }, async () => {
  const t = await makeTicket('open', false)

  const q = fakeRes()
  await ctrl.queue(fakeReq({ id: OTHER, admin_role: 'support' }), q, () => {})
  assert.ok(!q.body.data.tickets.some((x) => x.id === t.id), 'browsing a department is not a ticket')

  const m = fakeRes()
  await ctrl.listMine(fakeReq({ id: OWNER, admin_role: null }), m, () => {})
  assert.ok(!m.body.data.tickets.some((x) => x.id === t.id))
})

test('teardown', { skip: ctx.skip }, async () => {
  for (const id of ctx.ids) {
    await db.$executeRawUnsafe(`DELETE FROM "support_messages" WHERE "ticketId" = $1::uuid`, id)
    await db.$executeRawUnsafe(`DELETE FROM "support_tickets" WHERE id = $1::uuid`, id)
  }
  assert.ok(true)
})
