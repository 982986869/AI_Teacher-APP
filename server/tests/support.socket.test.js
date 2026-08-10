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
const { attachRealtime } = hasDb ? require('../src/realtime') : {}
const { io: ioClient } = hasDb ? require('socket.io-client') : {}

const ctx = { skip: !hasDb, server: null, url: '', ticketId: null, ownerId: null, otherId: null }

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

test('teardown', { skip: ctx.skip }, async () => {
  if (ctx.ticketId) {
    await db.$executeRawUnsafe(`DELETE FROM "support_tickets" WHERE id = $1::uuid`, ctx.ticketId)
  }
  if (ctx.server) await new Promise((r) => ctx.server.close(r))
  assert.ok(true)
})
