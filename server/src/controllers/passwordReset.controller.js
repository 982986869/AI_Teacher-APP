'use strict'

// Self-service password reset: request a link by email, then set a new password.
//
// Flow: POST /forgot-password -> mail with a one-time link
//    -> GET  /reset-password?token=…  -> the form (served here, so the link works
//       from any mail client without an app install or a separate web deploy)
//    -> POST /reset-password          -> password changed
//
// The token is random, 32 bytes, and stored only as a SHA-256 hash. Losing the
// table therefore does not hand anyone an account.

const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const db = require('../config/database')
const ApiResponse = require('../utils/ApiResponse')
const { sendMail, resetPasswordEmail } = require('../services/mailer')

const TOKEN_TTL_MIN = 30
const MIN_PASSWORD = 8
// Wrong guesses allowed against the 6-digit code before the row is spent. A code
// is a million combinations against the token's 2^256, so this limit is the only
// thing keeping it honest — without it, exhausting the space is minutes of
// scripting. Five is generous for someone reading a code off their phone.
const MAX_CODE_ATTEMPTS = 5
// Requests allowed per account per hour. Generous enough that a person retrying is
// never blocked, low enough that the address cannot be used as a mail cannon.
const MAX_PER_HOUR = 5

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')

function baseUrl(req) {
  if (process.env.APP_PUBLIC_URL) return String(process.env.APP_PUBLIC_URL).replace(/\/+$/, '')
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https'
  return `${proto}://${req.get('host')}`
}

// POST /api/auth/forgot-password  { email }
//
// Always answers the same way. Whether the address exists, has no password because
// it is a Google account, or is rate limited, the response is identical — otherwise
// this endpoint becomes a way to ask "does this person have an account here", which
// for a children's education app is a real disclosure and not a theoretical one.
async function forgotPassword(req, res, next) {
  const generic = 'If that email is registered, a reset link is on its way.'
  try {
    const email = String((req.body && req.body.email) || '').trim().toLowerCase()
    if (!email || !email.includes('@')) {
      return ApiResponse.error(res, 'A valid email is required', 422)
    }

    const rows = await db.$queryRawUnsafe(
      `SELECT id, name, email, "passwordHash", provider::text AS provider, is_deleted
         FROM "users" WHERE lower(email) = $1 LIMIT 1`,
      email,
    )
    const user = rows && rows[0]

    // Every early return below is the SAME response as success.
    if (!user || user.is_deleted) return ApiResponse.success(res, null, generic)

    // A Google account has no password to reset. Mailing a reset link would let the
    // holder of the inbox set one and convert it into an email login, which is a
    // change of how the account signs in, not a recovery of it.
    if (!user.passwordHash) {
      console.log(`[reset] ${email} has no password (provider=${user.provider}) — no mail sent`)
      return ApiResponse.success(res, null, generic)
    }

    const recent = await db.$queryRawUnsafe(
      `SELECT count(*)::int AS n FROM "password_reset_tokens"
        WHERE "userId" = $1::uuid AND "createdAt" > now() - interval '1 hour'`,
      user.id,
    )
    if (recent && recent[0] && recent[0].n >= MAX_PER_HOUR) {
      console.warn(`[reset] rate limit hit for ${email}`)
      return ApiResponse.success(res, null, generic)
    }

    // Any earlier link stops working the moment a new one is issued: two live links
    // means the older mail still works after the user asked for a fresh one.
    await db.$executeRawUnsafe(
      `UPDATE "password_reset_tokens" SET "usedAt" = now()
        WHERE "userId" = $1::uuid AND "usedAt" IS NULL AND "expiresAt" > now()`,
      user.id,
    )

    const token = crypto.randomBytes(32).toString('hex')
    // A code for the app and a link for everywhere else, from one request. The
    // student on a phone types six digits and never leaves the app; the same mail
    // opened on a desktop still has a link that works. randomInt is rejection-
    // sampled, so every code is equally likely — Math.random would not be.
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0')
    await db.$executeRawUnsafe(
      `INSERT INTO "password_reset_tokens" ("userId", "tokenHash", "expiresAt", "requestIp", "codeHash")
       VALUES ($1::uuid, $2, now() + ($3 || ' minutes')::interval, $4, $5)`,
      user.id, sha256(token), String(TOKEN_TTL_MIN), req.ip || null, sha256(code),
    )

    const link = `${baseUrl(req)}/api/auth/reset-password?token=${token}`
    const { subject, html, text } = resetPasswordEmail({
      name: (user.name || '').split(' ')[0], link, code, minutes: TOKEN_TTL_MIN,
    })
    // Not awaited into the response path: a slow provider must not hold the request
    // open, and its outcome must not change what the caller is told.
    sendMail({ to: user.email, subject, html, text })
      .then((r) => { if (!r.ok) console.error(`[reset] mail not sent to ${email}: ${r.error}`) })
      .catch(() => {})

    return ApiResponse.success(res, null, generic)
  } catch (err) { return next(err) }
}

// Look up a presented token. Returns the row, or null for anything unusable —
// unknown, already used, or expired all collapse to the same answer.
async function findToken(raw) {
  if (!raw || typeof raw !== 'string' || raw.length < 32) return null
  const rows = await db.$queryRawUnsafe(
    `SELECT t.id, t."userId", t."usedAt", t."expiresAt", u.email, u.name
       FROM "password_reset_tokens" t JOIN "users" u ON u.id = t."userId"
      WHERE t."tokenHash" = $1 LIMIT 1`,
    sha256(raw),
  )
  const t = rows && rows[0]
  if (!t || t.usedAt || new Date(t.expiresAt) < new Date()) return null
  return t
}


// POST /api/auth/reset-password/code  { email, code, password }
//
// The in-app half of the reset: the student types the six digits from the email
// and their new password, and never leaves the app. The link path stays for mail
// opened on a desktop; both are issued by the same request.
//
// Answers are deliberately vague about WHICH part was wrong. "That code is not
// right" for an unknown email, an expired row and a wrong code alike — otherwise
// the endpoint tells an attacker whether an address is registered, and this one
// takes an email as input, so it would be an unusually direct oracle.
async function resetWithCode(req, res, next) {
  const generic = 'That code is not right, or it has expired. Request a new one.'
  try {
    const email = String((req.body && req.body.email) || '').trim().toLowerCase()
    const code = String((req.body && req.body.code) || '').trim()
    const password = String((req.body && req.body.password) || '')

    if (!/^\d{6}$/.test(code)) return ApiResponse.error(res, generic, 400)
    if (password.length < MIN_PASSWORD) {
      return ApiResponse.error(res, `Use at least ${MIN_PASSWORD} characters.`, 422)
    }

    const rows = await db.$queryRawUnsafe(
      `SELECT t.id, t."userId", t."codeHash", t."attempts", u.email
         FROM "password_reset_tokens" t JOIN "users" u ON u.id = t."userId"
        WHERE lower(u.email) = $1 AND t."usedAt" IS NULL AND t."expiresAt" > now()
          AND t."codeHash" IS NOT NULL
        ORDER BY t."createdAt" DESC LIMIT 1`,
      email,
    )
    const row = rows && rows[0]
    if (!row) return ApiResponse.error(res, generic, 400)

    if (row.attempts >= MAX_CODE_ATTEMPTS) {
      // Spend the row rather than leaving it to be ground down slowly.
      await db.$executeRawUnsafe(`UPDATE "password_reset_tokens" SET "usedAt" = now() WHERE id = $1::uuid`, row.id)
      return ApiResponse.error(res, generic, 400)
    }

    // timingSafeEqual over the hashes: comparing with === leaks how much of the
    // code matched, which turns six digits into six one-digit problems.
    const given = Buffer.from(sha256(code))
    const stored = Buffer.from(String(row.codeHash))
    const match = given.length === stored.length && crypto.timingSafeEqual(given, stored)

    if (!match) {
      // Count the miss and, on the one that reaches the limit, spend the row in the
      // same statement. Doing it in two steps would leave the row briefly at the
      // limit but still live, and two requests racing there both get a guess.
      await db.$executeRawUnsafe(
        `UPDATE "password_reset_tokens"
            SET "attempts" = "attempts" + 1,
                "usedAt" = CASE WHEN "attempts" + 1 >= $2 THEN now() ELSE "usedAt" END
          WHERE id = $1::uuid`, row.id, MAX_CODE_ATTEMPTS)
      return ApiResponse.error(res, generic, 400)
    }

    // Burn first, and only where it is still unused, so two submissions of the
    // same code cannot both succeed.
    const burned = await db.$executeRawUnsafe(
      `UPDATE "password_reset_tokens" SET "usedAt" = now()
        WHERE id = $1::uuid AND "usedAt" IS NULL AND "expiresAt" > now()`, row.id)
    if (!burned) return ApiResponse.error(res, generic, 400)

    const hash = await bcrypt.hash(password, 12)   // same cost as registration
    await db.$executeRawUnsafe(
      `UPDATE "users" SET "passwordHash" = $1, "updatedAt" = now() WHERE id = $2::uuid`, hash, row.userId)
    // Any other live reset for this account dies with the change.
    await db.$executeRawUnsafe(
      `UPDATE "password_reset_tokens" SET "usedAt" = now()
        WHERE "userId" = $1::uuid AND "usedAt" IS NULL`, row.userId)

    console.log(`[reset] password changed by code for ${row.email}`)
    return ApiResponse.success(res, null, 'Password changed')
  } catch (err) { return next(err) }
}

module.exports = { forgotPassword, resetWithCode, findToken, sha256, TOKEN_TTL_MIN, MIN_PASSWORD, baseUrl }
