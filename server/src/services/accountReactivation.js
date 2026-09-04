'use strict'

// The secrets that let a student bring their own deleted account back.
//
// Pure crypto and pure rules — no database import — so every property below can be
// tested directly (tests/accountReactivation.test.js). The queries that store and
// spend these live in controllers/reactivation.controller.js.

const crypto = require('crypto')

// Long enough that a restore link left sitting in an inbox is not worth guessing at,
// short enough that a student who asks at bedtime can still act on it after school.
const TOKEN_TTL_HOURS = 24

const CODE_LENGTH = 6

// How many wrong codes one issued token tolerates before it is spent.
//
// Six digits is a million possibilities — trivial to walk through if each token
// accepts unlimited guesses, and an IP rate limit alone only slows that down rather
// than bounding it. Five caps the value of any single token at 5 in 1,000,000.
const MAX_CODE_ATTEMPTS = 5

// 32 bytes of randomness, hex-encoded. Goes in a URL, so it must survive being
// copied out of a mail client — hex has no characters that need escaping and none
// that a reader can confuse (no +/ as in base64).
const newToken = () => crypto.randomBytes(32).toString('hex')

// The code a student types into the app instead of following the link.
//
// randomInt, not Math.random(): this is a credential. And not `% 1000000` on random
// bytes either — that skews the low codes, because 2^k is not a multiple of a million.
// Padded so that 42 is '000042' and every code is the same six characters long.
const newCode = () => String(crypto.randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0')

// Only hashes are ever stored. Anyone who can read the table — a backup, a support
// query, a leaked dump — must not be able to restore an account with what they find.
// A plain sha256 is right here and bcrypt would be wrong: these are 256 bits of
// randomness with a 24-hour life, not a human-chosen password to be slowed down.
const hashSecret = (value) => crypto.createHash('sha256').update(String(value)).digest('hex')

// Constant-time comparison. The code is only six digits, so a timing side channel is
// worth closing: the app hands it back to us and a fast reject on the first wrong
// character would leak how much of a guess was right.
function secretMatches(value, storedHash) {
  if (!value || !storedHash) return false
  const a = Buffer.from(hashSecret(value), 'utf8')
  const b = Buffer.from(String(storedHash), 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

const expiresAt = (from = new Date()) => new Date(from.getTime() + TOKEN_TTL_HOURS * 3600000)

const isExpired = (expiry, now = new Date()) => !expiry || new Date(expiry).getTime() <= now.getTime()

// Everything needed to send one restore email and to store its row. The raw token and
// code are returned ONCE, to the caller that is about to put them in the message; only
// the hashes are ever written down.
function issue() {
  const token = newToken()
  const code = newCode()
  return {
    token, code,
    tokenHash: hashSecret(token),
    codeHash: hashSecret(code),
    expiresAt: expiresAt(),
  }
}

module.exports = {
  TOKEN_TTL_HOURS, CODE_LENGTH, MAX_CODE_ATTEMPTS,
  newToken, newCode, hashSecret, secretMatches, expiresAt, isExpired, issue,
}
