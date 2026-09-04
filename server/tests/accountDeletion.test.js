'use strict'

const test = require('node:test')
const assert = require('node:assert')

const {
  GRACE_PERIOD_DAYS, purgeDueAt, daysLeft,
  isArchivedEmail, isArchivedPhone, originalEmail, originalPhone,
} = require('../src/services/accountDeletion')

const DAY = 86400000
const ago = (days) => new Date(Date.now() - days * DAY)

// ─── The grace period ────────────────────────────────────────────────────────

test('an account just deleted has the full grace period left', () => {
  assert.equal(daysLeft(new Date()), GRACE_PERIOD_DAYS)
})

test('the countdown falls by a day for each day that has passed', () => {
  assert.equal(daysLeft(ago(1)), GRACE_PERIOD_DAYS - 1)
  assert.equal(daysLeft(ago(29)), 1)
})

test('day 30 reads as 0 — due now, which the console shows as READY', () => {
  assert.equal(daysLeft(ago(GRACE_PERIOD_DAYS)), 0)
})

test('an overdue account never reports a negative countdown', () => {
  // Left sitting for a year because no staff member got to it. Still 0, not -335.
  assert.equal(daysLeft(ago(365)), 0)
})

test('the purge date is the deletion date plus the grace period', () => {
  const deletedAt = new Date('2026-09-03T10:00:00Z')
  assert.equal(purgeDueAt(deletedAt).toISOString(), '2026-10-03T10:00:00.000Z')
})

test('a row that was never deleted has no purge date and no countdown', () => {
  assert.equal(purgeDueAt(null), null)
  assert.equal(daysLeft(null), null)
})

test('an unparseable timestamp yields null rather than an Invalid Date', () => {
  assert.equal(purgeDueAt('not a date'), null)
  assert.equal(daysLeft('not a date'), null)
})

// ─── Reading rows left archived by the previous release ──────────────────────
//
// That release is deployed and rewrote email/phone on delete. Anything it archived
// between then and this release has to be recognised and undone once — see
// prisma/sql/account_reactivation.sql. These readers are what does the recognising.

const UID = '11111111-2222-3333-4444-555555555555'

test('an archived email is recognised and its original recovered', () => {
  const archived = `deleted+${UID}+asha@example.com`
  assert.ok(isArchivedEmail(archived))
  assert.equal(originalEmail(archived), 'asha@example.com')
})

test('a plus-addressed signup survives being un-archived', () => {
  // asha+study@example.com already contains the separator the archive format used.
  assert.equal(originalEmail(`deleted+${UID}+asha+study@example.com`), 'asha+study@example.com')
})

test('an archived phone is recognised and its original recovered', () => {
  const archived = `del:${UID}:9876543210`
  assert.ok(isArchivedPhone(archived))
  assert.equal(originalPhone(archived), '9876543210')
})

test('a live address is returned unchanged and is not mistaken for archived', () => {
  assert.equal(originalEmail('asha@example.com'), 'asha@example.com')
  assert.equal(originalPhone('9876543210'), '9876543210')
  assert.equal(isArchivedEmail('asha@example.com'), false)
  assert.equal(isArchivedPhone('9876543210'), false)
})

test('null and undefined are not mistaken for archived values', () => {
  assert.equal(isArchivedEmail(null), false)
  assert.equal(isArchivedPhone(undefined), false)
})
