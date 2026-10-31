'use strict'

const test = require('node:test')
const assert = require('node:assert')

const {
  CLASSES, SUBJECTS, BOARDS, DURATION_MIN,
  validateBookingInput, istDate, istTime, istRange, bookingEndsAt, toApi,
} = require('../src/services/trialBooking')

const NOW = new Date('2026-09-18T06:00:00Z') // 11:30 AM IST
const inThreeHours = new Date(NOW.getTime() + 3 * 3600000).toISOString()

const good = () => ({
  parentName: ' Meera Sharma ', parentEmail: 'MEERA@example.com ', parentPhone: '+91 98765-43210',
  childName: 'Aarav', childClass: 'Class 8', board: 'CBSE', subject: 'Maths', slotAt: inThreeHours,
})

// ─── Validation ──────────────────────────────────────────────────────────────

test('a complete booking is accepted and normalised', () => {
  const r = validateBookingInput(good(), NOW)
  assert.equal(r.ok, true)
  assert.equal(r.value.parentName, 'Meera Sharma')
  assert.equal(r.value.parentEmail, 'meera@example.com')
  assert.equal(r.value.parentPhone, '+91 98765-43210')
  assert.equal(r.value.childName, 'Aarav')
  assert.equal(r.value.childClass, 'Class 8')
  assert.equal(r.value.board, 'CBSE')
  assert.equal(r.value.subject, 'Maths')
  assert.ok(r.value.slotAt instanceof Date)
  assert.equal(r.value.slotAt.toISOString(), inThreeHours)
})

// Required since the testing doc (2026-10-31, item 6): the mentor needs to know who
// they are teaching, and a blank name left the team copy saying "your child".
test('child name is required', () => {
  const r = validateBookingInput({ ...good(), childName: '   ' }, NOW)
  assert.equal(r.ok, false)
  assert.match(r.error, /child's name/i)
})

test('a phone with fewer than 10 digits is rejected', () => {
  const r = validateBookingInput({ ...good(), parentPhone: '98765' }, NOW)
  assert.equal(r.ok, false)
  assert.match(r.error, /phone/i)
})

test('a malformed email is rejected', () => {
  const r = validateBookingInput({ ...good(), parentEmail: 'not-an-email' }, NOW)
  assert.equal(r.ok, false)
  assert.match(r.error, /email/i)
})

test('a class outside the list is rejected', () => {
  const r = validateBookingInput({ ...good(), childClass: 'Class 3' }, NOW)
  assert.equal(r.ok, false)
  assert.match(r.error, /class/i)
})

test('a board outside the list, or none, is rejected', () => {
  assert.match(validateBookingInput({ ...good(), board: 'Cambridge' }, NOW).error, /board/i)
  assert.match(validateBookingInput({ ...good(), board: '' }, NOW).error, /board/i)
})

test('a subject outside the list is rejected', () => {
  const r = validateBookingInput({ ...good(), subject: 'Sanskrit' }, NOW)
  assert.equal(r.ok, false)
  assert.match(r.error, /subject/i)
})

test('a slot less than two hours away is rejected', () => {
  const soon = new Date(NOW.getTime() + 90 * 60000).toISOString()
  const r = validateBookingInput({ ...good(), slotAt: soon }, NOW)
  assert.equal(r.ok, false)
  assert.match(r.error, /2 hours/i)
})

test('a slot in the past or unparseable is rejected', () => {
  assert.equal(validateBookingInput({ ...good(), slotAt: '2020-01-01T10:00:00Z' }, NOW).ok, false)
  assert.equal(validateBookingInput({ ...good(), slotAt: 'tomorrow-ish' }, NOW).ok, false)
  assert.equal(validateBookingInput({ ...good(), slotAt: undefined }, NOW).ok, false)
})

test('the allowed lists match the app', () => {
  assert.deepEqual(CLASSES, ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'])
  assert.deepEqual(SUBJECTS, ['Maths', 'Physics', 'Chemistry', 'Biology', 'Science', 'English'])
  assert.deepEqual(BOARDS, ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB'])
  assert.equal(DURATION_MIN, 45)
})

// ─── IST formatting (Render runs in UTC) ─────────────────────────────────────

test('dates and times render in IST regardless of the process timezone', () => {
  const d = new Date('2026-09-19T10:30:00Z') // 4:00 PM IST
  assert.equal(istDate(d), 'Saturday, 19 September 2026')
  assert.equal(istTime(d), '4:00 PM')
  assert.equal(istRange(d, 45), '4:00 – 4:45 PM')
})

test('a range that crosses noon shows both meridiems', () => {
  const d = new Date('2026-09-19T06:00:00Z') // 11:30 AM IST
  assert.equal(istRange(d, 45), '11:30 AM – 12:15 PM')
})

// ─── Row helpers ─────────────────────────────────────────────────────────────

test('bookingEndsAt adds the duration to the slot', () => {
  const row = { slot_at: new Date('2026-09-19T10:30:00Z'), duration_min: 45 }
  assert.equal(bookingEndsAt(row).toISOString(), '2026-09-19T11:15:00.000Z')
})

test('toApi maps a DB row to the camelCase shape the app reads', () => {
  const row = {
    id: 'b1', user_id: 'u1', parent_name: 'Meera', parent_email: 'm@x.com', parent_phone: '9876543210',
    child_name: 'Aarav', child_class: 'Class 8', board: 'CBSE', subject: 'Maths',
    slot_at: new Date('2026-09-19T10:30:00Z'), duration_min: 45,
    meet_link: 'https://meet.google.com/abc-defg-hij', status: 'booked', mail_status: 'sent',
    created_at: new Date('2026-09-18T06:00:00Z'), cancelled_at: null,
  }
  assert.deepEqual(toApi(row), {
    id: 'b1', parentName: 'Meera', parentEmail: 'm@x.com', parentPhone: '9876543210',
    childName: 'Aarav', childClass: 'Class 8', board: 'CBSE', subject: 'Maths',
    slotAt: '2026-09-19T10:30:00.000Z', durationMin: 45,
    meetLink: 'https://meet.google.com/abc-defg-hij', status: 'booked', mailStatus: 'sent',
    createdAt: '2026-09-18T06:00:00.000Z',
  })
})
