'use strict'

const test = require('node:test')
const assert = require('node:assert')

const {
  archiveEmail, archivePhone, isArchivedEmail, isArchivedPhone, originalEmail, originalPhone,
} = require('../src/services/accountDeletion')

const UID = '11111111-2222-3333-4444-555555555555'

test('archiving frees the unique slot and keeps the original readable', () => {
  const archived = archiveEmail('asha@example.com', UID)
  assert.notEqual(archived, 'asha@example.com')
  assert.equal(originalEmail(archived), 'asha@example.com')
  assert.ok(isArchivedEmail(archived))
})

test('the same address deleted twice by different users does not collide', () => {
  const a = archiveEmail('asha@example.com', UID)
  const b = archiveEmail('asha@example.com', '99999999-8888-7777-6666-555555555555')
  assert.notEqual(a, b)
})

test('archiving is idempotent — re-deleting does not double-wrap', () => {
  const once = archiveEmail('asha@example.com', UID)
  assert.equal(archiveEmail(once, UID), once)
  const p = archivePhone('9876543210', UID)
  assert.equal(archivePhone(p, UID), p)
})

test('phones round-trip too', () => {
  const archived = archivePhone('9876543210', UID)
  assert.notEqual(archived, '9876543210')
  assert.equal(originalPhone(archived), '9876543210')
  assert.ok(isArchivedPhone(archived))
})

test('a plus-addressed signup survives the round trip', () => {
  // asha+study@example.com already contains the separator we use.
  const archived = archiveEmail('asha+study@example.com', UID)
  assert.equal(originalEmail(archived), 'asha+study@example.com')
})

test('null email and phone stay null rather than becoming the string "null"', () => {
  assert.equal(archiveEmail(null, UID), null)
  assert.equal(archivePhone(undefined, UID), null)
})

test('a live address is returned unchanged by the original() helpers', () => {
  assert.equal(originalEmail('asha@example.com'), 'asha@example.com')
  assert.equal(originalPhone('9876543210'), '9876543210')
})
