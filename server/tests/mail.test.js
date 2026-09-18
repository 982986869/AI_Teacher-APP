'use strict'

const test = require('node:test')
const assert = require('node:assert')

const { accountDeleted, reactivate, adminDigest } = require('../src/services/mailTemplates')
const { GRACE_PERIOD_DAYS } = require('../src/services/accountDeletion')

const DUE = new Date('2026-10-03T10:00:00Z')

// Every message must work as plain text too — a lot of people read mail that way, and
// a body that only makes sense in HTML reads to them as an empty envelope.
const bothParts = (m) => `${m.text}\n${m.html}`

// ─── You deleted your account ────────────────────────────────────────────────

test('the deletion email names the deadline as a date, not a timestamp', () => {
  const m = accountDeleted({ name: 'Asha', purgeDueAt: DUE })
  assert.match(m.text, /3 October 2026/)
  assert.match(m.html, /3 October 2026/)
  // The raw ISO form would be unreadable as a deadline.
  assert.ok(!bothParts(m).includes('2026-10-03T'))
})

test('the deletion email says the account can still be brought back', () => {
  const m = accountDeleted({ name: 'Asha', purgeDueAt: DUE })
  assert.match(m.text, /bring it back/i)
  // ...and that it will not be, after the date.
  assert.match(m.text, /cannot be recovered/i)
})

test('a student with no name still gets a sensible greeting', () => {
  const m = accountDeleted({ name: null, purgeDueAt: DUE })
  assert.match(m.text, /^Hi,/)
  assert.ok(!m.text.includes('null'))
  assert.ok(!m.text.includes('undefined'))
})

// ─── Restore your account ────────────────────────────────────────────────────

test('the restore email carries both the link and the code', () => {
  const m = reactivate({
    name: 'Asha', link: 'https://api.example.com/api/auth/reactivate?token=abc', code: '482913',
    expiresInHours: 24,
  })
  assert.ok(m.text.includes('https://api.example.com/api/auth/reactivate?token=abc'))
  assert.ok(m.text.includes('482913'))
  assert.ok(m.html.includes('href="https://api.example.com/api/auth/reactivate?token=abc"'))
  assert.ok(m.html.includes('482913'))
})

test('the restore email says it expires and works only once', () => {
  const m = reactivate({ name: 'Asha', link: 'https://x/y', code: '482913', expiresInHours: 24 })
  assert.match(m.text, /once/i)
  assert.match(m.text, /24 hours/)
})

test('the restore email tells a stranger they can safely ignore it', () => {
  // This message can land in the inbox of someone who did not ask for it, because
  // anyone can type an address into the request endpoint.
  const m = reactivate({ name: 'Asha', link: 'https://x/y', code: '482913', expiresInHours: 24 })
  assert.match(m.text, /ignore this email/i)
  assert.match(m.text, /stays deactivated/i)
})

// ─── Daily digest for staff ──────────────────────────────────────────────────

const row = (over) => ({
  id: 'u1', email: 'asha@example.com', name: 'Asha',
  deletedAt: new Date('2026-08-04T10:00:00Z'), daysWaiting: 30, ...over,
})

test('the digest subject counts the accounts and reads correctly for one', () => {
  assert.match(adminDigest({ rows: [row()] }).subject, /^1 Ailernova account is ready/)
  assert.match(adminDigest({ rows: [row(), row({ id: 'u2' })] }).subject, /^2 Ailernova accounts are ready/)
})

test('the digest lists each account with how long it has waited', () => {
  const m = adminDigest({ rows: [row()] })
  assert.ok(m.text.includes('asha@example.com'))
  assert.match(m.text, /30 days ago/)
  assert.match(m.text, new RegExp(`${GRACE_PERIOD_DAYS}-day grace period`))
})

test('the digest says the console is the record and it is only a reminder', () => {
  // Staff must not come to rely on the mail: if one morning's send fails, the queue
  // in the console still holds every account. Saying so is what stops that habit.
  const m = adminDigest({ rows: [row()] })
  assert.match(m.text, /source of truth/i)
  assert.match(m.text, /reminder only/i)
})

test('an account with no email is still identifiable in the digest', () => {
  // Phone-path accounts have no address; the row must not render as "undefined".
  const m = adminDigest({ rows: [row({ email: null })] })
  assert.ok(m.text.includes('Asha'))
  assert.ok(!m.text.includes('undefined'))
})

// ─── Free demo class booked ──────────────────────────────────────────────────

const { trialBooked, trialBookedTeam } = require('../src/services/mailTemplates')

const SLOT = new Date('2026-09-19T10:30:00Z') // Sat 19 Sep 2026, 4:00 PM IST
const MEET = 'https://meet.google.com/abc-defg-hij'
const booking = {
  parentName: 'Meera', parentEmail: 'meera@example.com', parentPhone: '9876543210',
  childName: 'Aarav', childClass: 'Class 8', board: 'CBSE', subject: 'Maths',
  slotAt: SLOT, durationMin: 45, meetLink: MEET, bookingId: 'b1',
}

test('the parent email carries the Meet link in both parts', () => {
  const m = trialBooked(booking)
  assert.ok(m.text.includes(MEET))
  assert.ok(m.html.includes(`href="${MEET}"`))
})

test('the parent email says the day and the time in IST, not UTC', () => {
  const m = trialBooked(booking)
  assert.match(m.subject, /19 Sep/)
  assert.match(m.subject, /4:00 PM/)
  assert.match(m.text, /Saturday, 19 September 2026/)
  assert.match(m.text, /4:00 – 4:45 PM/)
  assert.ok(!bothParts(m).includes('10:30'))
})

test('the parent email names the child, class, board and subject', () => {
  const m = trialBooked(booking)
  assert.match(m.text, /Maths for Aarav, Class 8 \(CBSE\)/)
  assert.match(trialBookedTeam(booking).text, /Class 8 \(CBSE\)/)
})

test('the parent email works without a child name', () => {
  const m = trialBooked({ ...booking, childName: null })
  assert.match(m.text, /^Hi Meera,/)
  assert.ok(!bothParts(m).includes('null'))
  assert.ok(!bothParts(m).includes('undefined'))
})

test('the parent email tells them where to write back', () => {
  assert.match(trialBooked(booking).text, /kids@ailernova\.com/)
})

test('the team copy has the contact details the parent email does not', () => {
  const m = trialBookedTeam(booking)
  assert.match(m.subject, /^New demo booking: Maths/)
  assert.match(m.subject, /Meera/)
  assert.match(m.text, /meera@example\.com/)
  assert.match(m.text, /9876543210/)
  assert.match(m.text, /Sat/)
  assert.ok(m.text.includes(MEET))
  assert.ok(m.text.includes('b1'))
})

// ─── Sender line construction (mailer) ───────────────────────────────────────

test('the bare address is pulled out of a "Name <addr>" sender, or taken as is', () => {
  const { bareAddress } = require('../src/services/mailer')
  assert.equal(bareAddress('Ailernova <noreply@ailernova.com>'), 'noreply@ailernova.com')
  assert.equal(bareAddress('saurabh@ailernova.com'), 'saurabh@ailernova.com')
  assert.equal(bareAddress(''), '')
})
