'use strict'

const test = require('node:test')
const assert = require('node:assert')

const {
  TOKEN_TTL_HOURS, CODE_LENGTH,
  newToken, newCode, hashSecret, secretMatches, expiresAt, isExpired, issue,
} = require('../src/services/accountReactivation')

// ─── The code a student types in ─────────────────────────────────────────────

test('every code is exactly six digits, including the ones that start with zero', () => {
  // The padding is the point: an unpadded 42 would be a 2-character code, and the
  // app's six-box input would never accept it.
  for (let i = 0; i < 2000; i++) {
    const code = newCode()
    assert.equal(code.length, CODE_LENGTH, `got "${code}"`)
    assert.match(code, /^[0-9]{6}$/)
  }
})

test('codes are not all the same', () => {
  const seen = new Set(Array.from({ length: 200 }, newCode))
  assert.ok(seen.size > 150, `only ${seen.size} distinct codes in 200 draws`)
})

// ─── The token in the link ───────────────────────────────────────────────────

test('a token is 64 hex characters and safe to drop into a URL unescaped', () => {
  const token = newToken()
  assert.match(token, /^[0-9a-f]{64}$/)
  assert.equal(encodeURIComponent(token), token)
})

test('tokens do not repeat', () => {
  const seen = new Set(Array.from({ length: 500 }, newToken))
  assert.equal(seen.size, 500)
})

// ─── Hashing ─────────────────────────────────────────────────────────────────

test('the stored hash is not the secret itself', () => {
  const token = newToken()
  assert.notEqual(hashSecret(token), token)
  assert.ok(!hashSecret(token).includes(token))
})

test('hashing is stable, so a secret can be checked against what was stored', () => {
  assert.equal(hashSecret('482913'), hashSecret('482913'))
  assert.notEqual(hashSecret('482913'), hashSecret('482914'))
})

test('a secret matches its own hash and nothing else', () => {
  const h = hashSecret('482913')
  assert.equal(secretMatches('482913', h), true)
  assert.equal(secretMatches('482914', h), false)
  assert.equal(secretMatches('', h), false)
})

test('a missing secret or a missing hash never matches', () => {
  // A row with no stored hash must not be a skeleton key.
  assert.equal(secretMatches(null, hashSecret('x')), false)
  assert.equal(secretMatches('x', null), false)
  assert.equal(secretMatches(null, null), false)
})

// ─── Expiry ──────────────────────────────────────────────────────────────────

test('a fresh token expires the configured number of hours out', () => {
  const from = new Date('2026-09-03T10:00:00Z')
  assert.equal(expiresAt(from).toISOString(), '2026-09-04T10:00:00.000Z')
  assert.equal(TOKEN_TTL_HOURS, 24)
})

test('expiry is inclusive — a token is dead the instant it is due, not a moment after', () => {
  const at = new Date('2026-09-04T10:00:00Z')
  assert.equal(isExpired(at, at), true)
  assert.equal(isExpired(at, new Date('2026-09-04T09:59:59Z')), false)
  assert.equal(isExpired(at, new Date('2026-09-04T10:00:01Z')), true)
})

test('a row with no expiry is treated as expired, not as eternal', () => {
  assert.equal(isExpired(null), true)
  assert.equal(isExpired(undefined), true)
})

// ─── Issuing one ─────────────────────────────────────────────────────────────

test('issue hands back the secrets once and the hashes that will be stored', () => {
  const t = issue()
  assert.equal(secretMatches(t.token, t.tokenHash), true)
  assert.equal(secretMatches(t.code, t.codeHash), true)
  // What gets written down must not be what gets emailed.
  assert.notEqual(t.tokenHash, t.token)
  assert.notEqual(t.codeHash, t.code)
})

test('the code cannot be used in place of the token, or the other way round', () => {
  const t = issue()
  assert.equal(secretMatches(t.code, t.tokenHash), false)
  assert.equal(secretMatches(t.token, t.codeHash), false)
})

test('an issued token is not already expired', () => {
  assert.equal(isExpired(issue().expiresAt), false)
})
