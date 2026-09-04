'use strict'

const test = require('node:test')
const assert = require('node:assert')

const { accountDeleted, reactivate, adminDigest } = require('../src/services/mail/templates')
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
