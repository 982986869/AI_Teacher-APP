'use strict'

// The booking endpoints against the real DB. Skips without DATABASE_URL. Every row
// this file creates is deleted in teardown. Mail is stubbed — no SMTP here.

try { require('dotenv').config() } catch (_) { /* dotenv optional */ }
const test = require('node:test')
const assert = require('node:assert')

const hasDb = !!process.env.DATABASE_URL
const db = hasDb ? require('../src/config/database') : null
const ctrl = hasDb ? require('../src/controllers/trialBooking.controller') : null
const { config } = require('../src/config/env')

const USER = '00000000-0000-4000-8000-00000000f101'
const OTHER = '00000000-0000-4000-8000-00000000f102'

const inThreeHours = () => new Date(Date.now() + 3 * 3600000).toISOString()
const body = (over = {}) => ({
  parentName: 'Meera', parentEmail: 'meera@example.com', parentPhone: '9876543210',
  childName: 'Aarav', childClass: 'Class 8', subject: 'Maths', slotAt: inThreeHours(), ...over,
})

// A minimal res that records what the controller answered.
function fakeRes() {
  const r = { code: 200, body: null }
  r.status = (c) => { r.code = c; return r }
  r.json = (b) => { r.body = b; return r }
  return r
}
async function call(fn, { userId = USER, reqBody = {}, params = {} } = {}) {
  const res = fakeRes()
  let thrown = null
  await fn({ user: { id: userId }, body: reqBody, params }, res, (e) => { thrown = e })
  if (thrown) throw thrown
  return res
}

let sent = []
const stubOk = async (m) => { sent.push(m); return { ok: true, id: 'stub' } }
const cleanup = () => db.$executeRawUnsafe(`DELETE FROM "trial_bookings" WHERE user_id IN ($1::uuid, $2::uuid)`, USER, OTHER)

test.before(() => {
  if (!hasDb) return
  config.trial.meetLink = 'https://meet.google.com/test-link-xyz'
  ctrl._deps.sendMail = stubOk
})
test.beforeEach(async () => {
  sent = []
  if (hasDb) await cleanup()
})
test.after(async () => {
  if (!hasDb) return
  await cleanup()
  await db.$disconnect()
})

test('booking stores the row, emails parent and team, and answers 201', { skip: !hasDb }, async () => {
  const res = await call(ctrl.createTrialBooking, { reqBody: body() })
  assert.equal(res.code, 201, JSON.stringify(res.body))
  const b = res.body.data.booking
  assert.equal(b.status, 'booked')
  assert.equal(b.meetLink, 'https://meet.google.com/test-link-xyz')
  assert.equal(b.mailStatus, 'sent')
  assert.equal(res.body.data.mailSent, true)
  assert.equal(sent.length, 2)
  const toParent = sent.find((m) => m.to === 'meera@example.com')
  const toTeam = sent.find((m) => m.to === config.trial.notifyEmail)
  assert.ok(toParent && toTeam)
  // No sender override by default — sendMail falls back to MAIL_FROM, the verified one.
  assert.equal(toParent.from, config.trial.mailFrom || undefined)
  assert.ok(toParent.text.includes('https://meet.google.com/test-link-xyz'))
})

test('a second active booking is refused with 409', { skip: !hasDb }, async () => {
  await call(ctrl.createTrialBooking, { reqBody: body() })
  const res = await call(ctrl.createTrialBooking, { reqBody: body() })
  assert.equal(res.code, 409)
  assert.match(res.body.error, /already/i)
})

test('bad input is 422 and nothing is stored or sent', { skip: !hasDb }, async () => {
  const res = await call(ctrl.createTrialBooking, { reqBody: body({ parentPhone: '123' }) })
  assert.equal(res.code, 422)
  assert.equal(sent.length, 0)
  const rows = await db.$queryRawUnsafe(`SELECT id FROM "trial_bookings" WHERE user_id = $1::uuid`, USER)
  assert.equal(rows.length, 0)
})

test('without a Meet link configured the endpoint answers 503', { skip: !hasDb }, async () => {
  const saved = config.trial.meetLink
  config.trial.meetLink = ''
  try {
    const res = await call(ctrl.createTrialBooking, { reqBody: body() })
    assert.equal(res.code, 503)
    assert.equal(sent.length, 0)
  } finally { config.trial.meetLink = saved }
})

test('a mail failure still saves the row, with mailStatus failed and mailSent false', { skip: !hasDb }, async () => {
  ctrl._deps.sendMail = async () => ({ ok: false, error: 'boom' })
  try {
    const res = await call(ctrl.createTrialBooking, { reqBody: body() })
    assert.equal(res.code, 201)
    assert.equal(res.body.data.mailSent, false)
    assert.equal(res.body.data.booking.mailStatus, 'failed')
  } finally {
    ctrl._deps.sendMail = stubOk
  }
})

test('upcoming returns the booking, and null after it is cancelled', { skip: !hasDb }, async () => {
  const made = await call(ctrl.createTrialBooking, { reqBody: body() })
  const id = made.body.data.booking.id

  let res = await call(ctrl.upcomingTrialBooking)
  assert.equal(res.code, 200)
  assert.equal(res.body.data.booking.id, id)

  res = await call(ctrl.cancelTrialBooking, { params: { id } })
  assert.equal(res.code, 200)
  assert.equal(res.body.data.booking.status, 'cancelled')

  res = await call(ctrl.upcomingTrialBooking)
  assert.equal(res.body.data.booking, null)

  // …and the slot is free to book again.
  res = await call(ctrl.createTrialBooking, { reqBody: body() })
  assert.equal(res.code, 201)
})

test('cancelling somebody else\'s booking is 404', { skip: !hasDb }, async () => {
  const made = await call(ctrl.createTrialBooking, { reqBody: body() })
  const res = await call(ctrl.cancelTrialBooking, { userId: OTHER, params: { id: made.body.data.booking.id } })
  assert.equal(res.code, 404)
})

test('a booking whose class has ended no longer counts as upcoming', { skip: !hasDb }, async () => {
  await db.$executeRawUnsafe(
    `INSERT INTO "trial_bookings" (user_id, parent_name, parent_email, parent_phone, child_class, subject, slot_at, meet_link, mail_status)
     VALUES ($1::uuid, 'M', 'm@x.com', '9876543210', 'Class 8', 'Maths', now() - interval '2 hours', 'https://meet.google.com/x', 'sent')`,
    USER,
  )
  const res = await call(ctrl.upcomingTrialBooking)
  assert.equal(res.body.data.booking, null)
  const made = await call(ctrl.createTrialBooking, { reqBody: body() })
  assert.equal(made.code, 201)
})
