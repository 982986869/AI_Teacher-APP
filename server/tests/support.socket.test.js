'use strict'

// The socket is a second front door onto ticket data and shares none of the Express
// middleware, so its auth is tested separately. Skips without DATABASE_URL.

try { require('dotenv').config() } catch (_) { /* dotenv optional */ }
const test = require('node:test')
const assert = require('node:assert')
const http = require('http')

const hasDb = !!process.env.DATABASE_URL
const db = hasDb ? require('../src/config/database') : null
const jwt = hasDb ? require('jsonwebtoken') : null
const { config } = hasDb ? require('../src/config/env') : { config: null }
const { attachRealtime, emitToStaffQueue } = hasDb ? require('../src/realtime') : {}
const ctrl = hasDb ? require('../src/controllers/support.controller') : null
const { io: ioClient } = hasDb ? require('socket.io-client') : {}

const ctx = {
  skip: !hasDb, server: null, url: '', ticketId: null, ownerId: null, otherId: null,
  otherOriginalRole: undefined,
}

// Minimal Express doubles, same pattern as support.access.test.js — the controller is
// called directly so the real emitToTicket/emitToStaffQueue it imports run against the
// same io instance this file already attached.
function fakeRes() {
  const r = { statusCode: 0, body: null }
  r.status = (c) => { r.statusCode = c; return r }
  r.json = (b) => { r.body = b; return r }
  return r
}

const connect = (token) => ioClient(ctx.url, {
  auth: token ? { token } : {}, path: '/socket.io', transports: ['websocket'],
  reconnection: false, timeout: 4000,
})

test('setup: boot a realtime server and make a ticket', { skip: ctx.skip }, async () => {
  const users = await db.$queryRawUnsafe('SELECT id FROM "users" ORDER BY "createdAt" LIMIT 2')
  if (users.length < 2) { ctx.skip = true; return }
  ctx.ownerId = users[0].id
  ctx.otherId = users[1].id

  const rows = await db.$queryRawUnsafe(
    `INSERT INTO "support_tickets" ("ref","userId","role","topicId","topicLabel","team")
     VALUES ('TEST-' || nextval('support_ticket_ref_seq'), $1::uuid, 'student',
             'billing','Billing','Accounts team') RETURNING id`,
    ctx.ownerId,
  )
  ctx.ticketId = rows[0].id

  ctx.server = http.createServer()
  attachRealtime(ctx.server)
  await new Promise((r) => ctx.server.listen(0, r))
  ctx.url = `http://localhost:${ctx.server.address().port}`
  assert.ok(ctx.url)
})

test('a connection without a token is refused', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const sock = connect(null)
  const err = await new Promise((resolve) => {
    sock.on('connect_error', resolve)
    sock.on('connect', () => resolve(null))
  })
  sock.close()
  assert.ok(err, 'an anonymous socket must never connect')
})

test('a garbage token is refused', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const sock = connect('not.a.jwt')
  const err = await new Promise((resolve) => {
    sock.on('connect_error', resolve)
    sock.on('connect', () => resolve(null))
  })
  sock.close()
  assert.ok(err)
})

test('a user cannot join another user’s ticket room', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const token = jwt.sign({ sub: ctx.otherId }, config.auth.jwtSecret, { expiresIn: '5m' })
  const sock = connect(token)
  await new Promise((r) => sock.on('connect', r))
  const ack = await new Promise((r) => sock.emit('ticket:join', ctx.ticketId, r))
  sock.close()
  assert.equal(ack.ok, false, 'a ticket id must not be enough to read someone else’s thread')
})

test('the owner can join their own ticket room', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const token = jwt.sign({ sub: ctx.ownerId }, config.auth.jwtSecret, { expiresIn: '5m' })
  const sock = connect(token)
  await new Promise((r) => sock.on('connect', r))
  const ack = await new Promise((r) => sock.emit('ticket:join', ctx.ticketId, r))
  sock.close()
  assert.equal(ack.ok, true)
})

test('a call log never reaches the ticket room, but still reaches staff:queue', { skip: ctx.skip }, async () => {
  if (ctx.skip) return

  // Promote otherId to a real staff role for this test only — a socket only ends up in
  // staff:queue via identify()'s own DB lookup, so this is the only way to prove the
  // fix reaches a *real* staff socket, not just that the controller intends to.
  const before = await db.$queryRawUnsafe(`SELECT "admin_role" FROM "users" WHERE id = $1::uuid`, ctx.otherId)
  ctx.otherOriginalRole = before[0] ? before[0].admin_role : null
  await db.$executeRawUnsafe(`UPDATE "users" SET "admin_role" = 'support' WHERE id = $1::uuid`, ctx.otherId)

  const ownerToken = jwt.sign({ sub: ctx.ownerId }, config.auth.jwtSecret, { expiresIn: '5m' })
  const staffToken = jwt.sign({ sub: ctx.otherId }, config.auth.jwtSecret, { expiresIn: '5m' })

  const ownerSock = connect(ownerToken)
  await new Promise((r) => ownerSock.on('connect', r))
  const joinAck = await new Promise((r) => ownerSock.emit('ticket:join', ctx.ticketId, r))
  assert.equal(joinAck.ok, true)

  const staffSock = connect(staffToken)
  await new Promise((r) => staffSock.on('connect', r))

  const ownerMessages = []
  ownerSock.on('message', (m) => ownerMessages.push(m))
  const staffGotMessage = new Promise((resolve) => staffSock.on('message', resolve))

  const res = fakeRes()
  const req = {
    user: { id: ctx.otherId, name: 'Staff Test', admin_role: 'support' },
    params: { id: ctx.ticketId },
    body: { outcome: 'no_answer', note: 'ring hui, uthaya nahi' },
  }
  await ctrl.callLog(req, res, (err) => { if (err) throw err })
  assert.equal(res.statusCode, 201, 'callLog wrote the row')
  ctx.callMessageId = res.body && res.body.data && res.body.data.id

  const staffMsg = await Promise.race([
    staffGotMessage,
    new Promise((r) => setTimeout(() => r(null), 1500)),
  ])
  // Give the owner socket the same grace window before declaring it silent.
  await new Promise((r) => setTimeout(r, 300))

  ownerSock.close()
  staffSock.close()

  await db.$executeRawUnsafe(`UPDATE "users" SET "admin_role" = $1 WHERE id = $2::uuid`, ctx.otherOriginalRole, ctx.otherId)

  assert.equal(ownerMessages.length, 0, 'the ticket room (owner + staff) must never see a staff call log')
  assert.ok(staffMsg, 'staff:queue must still receive the call log')
  assert.equal(staffMsg.kind, 'call')
  assert.equal(staffMsg.callOutcome, 'no_answer')
})

test('typing cannot be spoofed into a room this socket never joined', { skip: ctx.skip }, async () => {
  if (ctx.skip) return

  const ownerToken = jwt.sign({ sub: ctx.ownerId }, config.auth.jwtSecret, { expiresIn: '5m' })
  const otherToken = jwt.sign({ sub: ctx.otherId }, config.auth.jwtSecret, { expiresIn: '5m' })

  const ownerSock = connect(ownerToken)
  await new Promise((r) => ownerSock.on('connect', r))
  const ack = await new Promise((r) => ownerSock.emit('ticket:join', ctx.ticketId, r))
  assert.equal(ack.ok, true)

  // otherSock deliberately never calls ticket:join for ctx.ticketId — it must not be
  // able to make its typing indicator show up there anyway.
  const otherSock = connect(otherToken)
  await new Promise((r) => otherSock.on('connect', r))

  const typingEvents = []
  ownerSock.on('typing', (p) => typingEvents.push(p))

  otherSock.emit('typing', { ticketId: ctx.ticketId })

  await new Promise((r) => setTimeout(r, 500))

  ownerSock.close()
  otherSock.close()

  assert.equal(typingEvents.length, 0, 'typing must not reach a room the sender never joined')
})

test('content_manager does not receive staff:queue broadcasts; a support role does', { skip: ctx.skip }, async () => {
  if (ctx.skip) return

  // content_manager IS an admin role but was deliberately not granted support.view
  // (Task 4) — staff:queue membership must key off that permission, not off "carries
  // any admin_role". Promote two real users temporarily (one to each role) and always
  // restore both, even if an assertion throws.
  const ownerBefore = await db.$queryRawUnsafe(`SELECT "admin_role" FROM "users" WHERE id = $1::uuid`, ctx.ownerId)
  const otherBefore = await db.$queryRawUnsafe(`SELECT "admin_role" FROM "users" WHERE id = $1::uuid`, ctx.otherId)
  const ownerOriginalRole = ownerBefore[0] ? ownerBefore[0].admin_role : null
  const otherOriginalRole = otherBefore[0] ? otherBefore[0].admin_role : null

  await db.$executeRawUnsafe(`UPDATE "users" SET "admin_role" = 'support' WHERE id = $1::uuid`, ctx.ownerId)
  await db.$executeRawUnsafe(`UPDATE "users" SET "admin_role" = 'content_manager' WHERE id = $1::uuid`, ctx.otherId)

  try {
    const supportToken = jwt.sign({ sub: ctx.ownerId }, config.auth.jwtSecret, { expiresIn: '5m' })
    const cmToken = jwt.sign({ sub: ctx.otherId }, config.auth.jwtSecret, { expiresIn: '5m' })

    const supportSock = connect(supportToken)
    await new Promise((r) => supportSock.on('connect', r))
    const cmSock = connect(cmToken)
    await new Promise((r) => cmSock.on('connect', r))

    const supportEvents = []
    const cmEvents = []
    supportSock.on('ticket:new', (p) => supportEvents.push(p))
    cmSock.on('ticket:new', (p) => cmEvents.push(p))

    emitToStaffQueue('ticket:new', { id: 'test-broadcast', ref: 'AL-TEST' })

    await new Promise((r) => setTimeout(r, 500))

    supportSock.close()
    cmSock.close()

    assert.equal(supportEvents.length, 1, 'a support.view holder must still receive the queue broadcast')
    assert.equal(cmEvents.length, 0, 'content_manager (no support.view) must not receive it')
  } finally {
    await db.$executeRawUnsafe(`UPDATE "users" SET "admin_role" = $1 WHERE id = $2::uuid`, ownerOriginalRole, ctx.ownerId)
    await db.$executeRawUnsafe(`UPDATE "users" SET "admin_role" = $1 WHERE id = $2::uuid`, otherOriginalRole, ctx.otherId)
  }
})

test('teardown', { skip: ctx.skip }, async () => {
  if (ctx.otherOriginalRole !== undefined) {
    await db.$executeRawUnsafe(`UPDATE "users" SET "admin_role" = $1 WHERE id = $2::uuid`, ctx.otherOriginalRole, ctx.otherId)
  }
  if (ctx.ticketId) {
    await db.$executeRawUnsafe(`DELETE FROM "support_messages" WHERE "ticketId" = $1::uuid`, ctx.ticketId)
    await db.$executeRawUnsafe(`DELETE FROM "support_tickets" WHERE id = $1::uuid`, ctx.ticketId)
  }
  if (ctx.server) await new Promise((r) => ctx.server.close(r))
  assert.ok(true)
})
