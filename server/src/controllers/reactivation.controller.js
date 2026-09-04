'use strict'

const { validationResult } = require('express-validator')
const db = require('../config/database')
const { config } = require('../config/env')
const ApiResponse = require('../utils/ApiResponse')
const { sendMail } = require('../services/mailer')
const mailTemplates = require('../services/mailTemplates')
const {
  TOKEN_TTL_HOURS, MAX_CODE_ATTEMPTS, hashSecret, secretMatches, issue, isExpired,
} = require('../services/accountReactivation')
const { GRACE_PERIOD_DAYS, daysLeft } = require('../services/accountDeletion')

// Bringing a soft-deleted account back, at the request of the person who deleted it.
//
// Two ways in, one outcome. The emailed LINK is the easy path; the emailed CODE is what
// works when the mail is opened on a different device from the one the app is on. Both
// spend the same single-use row.
//
// Neither path signs anyone in. Restoring the account and getting into it are separate
// steps on purpose: six digits is a weaker secret than the password, so minting a
// session from one would make the code a way *around* the password rather than a way
// back to a deactivated account. After either path the student signs in normally.

// The same answer whether or not the address has an account here. Anyone can type any
// address into this endpoint, so a truthful "no such account" would turn it into a tool
// for finding out who has one.
const GENERIC_REQUEST_REPLY =
  'If that address has a deactivated account, an email is on its way with a link to restore it.'

// ─── Shared queries ──────────────────────────────────────────────────────────

async function findDeletedByEmail(email) {
  const rows = await db.$queryRawUnsafe(
    `SELECT id::text AS id, name, email, deleted_at
       FROM "users" WHERE email = $1 AND is_deleted LIMIT 1`,
    email,
  )
  return rows && rows[0]
}

// Within the grace period the account is still the student's to reclaim. Past it, it is
// sitting in the admin console's queue waiting to be purged, and the email they were
// sent named that date — letting them take it back afterwards would contradict both.
const isReclaimable = (user) => !!user && daysLeft(user.deleted_at) > 0

// Claim the row for this one use. Conditional on used_at IS NULL and atomic, so two
// clicks on the same link — or a link and a code arriving together — cannot both win.
async function claimToken(id) {
  const rows = await db.$queryRawUnsafe(
    `UPDATE "account_reactivation_tokens" SET used_at = now()
      WHERE id = $1::uuid AND used_at IS NULL
      RETURNING user_id::text AS user_id`,
    id,
  )
  return rows && rows[0]
}

async function restoreUser(userId) {
  // deleted_at goes back to NULL rather than being left behind: it is what the admin
  // console's deletion queue is built from, and a restored account has to drop out of
  // that queue completely.
  await db.$executeRawUnsafe(
    `UPDATE "users" SET is_deleted = false, deleted_at = NULL WHERE id = $1::uuid`,
    userId,
  )
}

// ─── POST /api/auth/reactivate/request ───────────────────────────────────────

async function request(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { email } = req.body
    const user = await findDeletedByEmail(email)

    if (isReclaimable(user)) {
      // Any earlier unused token dies here. Asking again because the first mail went
      // astray must not leave two live links sitting in two inboxes.
      await db.$executeRawUnsafe(
        `UPDATE "account_reactivation_tokens" SET used_at = now()
          WHERE user_id = $1::uuid AND used_at IS NULL`,
        user.id,
      )

      const t = issue()
      await db.$executeRawUnsafe(
        `INSERT INTO "account_reactivation_tokens" (user_id, token_hash, code_hash, expires_at)
         VALUES ($1::uuid, $2, $3, $4::timestamptz)`,
        user.id, t.tokenHash, t.codeHash, t.expiresAt.toISOString(),
      )

      // Not awaited, and that is a security property rather than a performance one:
      // waiting for SMTP would make this endpoint answer measurably slower for an
      // address that has an account than for one that does not — exactly the
      // difference the generic reply above exists to hide.
      sendMail({
        to: user.email,
        ...mailTemplates.reactivate({
          name: user.name,
          link: `${config.publicUrl}/api/auth/reactivate?token=${t.token}`,
          code: t.code,
          expiresInHours: TOKEN_TTL_HOURS,
        }),
      })
    }

    return ApiResponse.success(res, null, GENERIC_REQUEST_REPLY)
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/auth/reactivate?token=… ────────────────────────────────────────
//
// Opened from an email, in whatever browser the reader happens to have. It answers with
// a page rather than JSON because there is no app on the other end of it.

async function confirmByLink(req, res, next) {
  try {
    const token = String(req.query.token || '')
    if (!token) return res.status(400).type('html').send(failurePage('That link is incomplete.'))

    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, user_id::text AS user_id, used_at, expires_at
         FROM "account_reactivation_tokens" WHERE token_hash = $1 LIMIT 1`,
      hashSecret(token),
    )
    const row = rows && rows[0]

    // An unknown token is the only thing that fails outright here. Everything else has
    // to look at the ACCOUNT first — see below.
    if (!row) {
      return res.status(400).type('html').send(failurePage(
        `That link is not valid. Restore links last ${TOKEN_TTL_HOURS} hours — you can ask for a new one from the app.`,
      ))
    }

    const users = await db.$queryRawUnsafe(
      `SELECT id::text AS id, deleted_at, is_deleted FROM "users" WHERE id = $1::uuid LIMIT 1`,
      row.user_id,
    )
    const user = users && users[0]

    // The account is already back: this is a second click on a link that worked, or the
    // code was used instead. Checked BEFORE used_at and expiry, deliberately — a spent
    // token is exactly what a working link leaves behind, and people re-open emails.
    // Telling them "this link did not work" when their account is sitting there restored
    // is both frightening and false.
    if (!user || !user.is_deleted) {
      return res.status(200).type('html').send(successPage())
    }

    // From here the account really is still deleted, so the token has to be good.
    // One message for "already used" and "expired" alike: a visitor holding a link they
    // should not have learns nothing from it either way.
    if (row.used_at || isExpired(row.expires_at)) {
      return res.status(400).type('html').send(failurePage(
        `That link has already been used, or it has expired. Restore links last ${TOKEN_TTL_HOURS} hours — you can ask for a new one from the app.`,
      ))
    }

    if (!isReclaimable(user)) {
      return res.status(400).type('html').send(failurePage(
        `This account has passed its ${GRACE_PERIOD_DAYS}-day window and can no longer be restored.`,
      ))
    }

    const claimed = await claimToken(row.id)
    if (!claimed) {
      // Lost the race to a second click, which is restoring the account right now. From
      // the reader's point of view that is a success, so say so.
      return res.status(200).type('html').send(successPage())
    }

    await restoreUser(claimed.user_id)
    return res.status(200).type('html').send(successPage())
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/auth/reactivate/confirm ───────────────────────────────────────
//
// The in-app path: the student types the six digits from the email.

async function confirmByCode(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { email, code } = req.body

    // One message for every failure below, for the same reason the link path has one: a
    // wrong code, a spent code and an address with no account here must all be
    // indistinguishable from outside.
    const reject = () => ApiResponse.error(res, 'That code is not valid, or it has expired.', 400)

    const user = await findDeletedByEmail(email)
    if (!isReclaimable(user)) return reject()

    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, code_hash, expires_at, attempts
         FROM "account_reactivation_tokens"
        WHERE user_id = $1::uuid AND used_at IS NULL
        ORDER BY created_at DESC LIMIT 1`,
      user.id,
    )
    const row = rows && rows[0]
    if (!row || isExpired(row.expires_at) || row.attempts >= MAX_CODE_ATTEMPTS) return reject()

    if (!secretMatches(code, row.code_hash)) {
      // Count the guess, and burn the row once it has had its share of them. Without
      // this the six digits could be walked through at whatever rate the request
      // limiter allows; with it, one emailed code is worth at most five attempts.
      await db.$executeRawUnsafe(
        `UPDATE "account_reactivation_tokens"
            SET attempts = attempts + 1,
                used_at  = CASE WHEN attempts + 1 >= $2 THEN now() ELSE used_at END
          WHERE id = $1::uuid`,
        row.id, MAX_CODE_ATTEMPTS,
      )
      return reject()
    }

    const claimed = await claimToken(row.id)
    if (!claimed) return reject()

    await restoreUser(claimed.user_id)

    // No session token here — see the note at the top of this file. The app still has
    // the password the student typed at the sign-in screen, and retries with it.
    return ApiResponse.success(res, { restored: true }, 'Your account has been restored. You can sign in now.')
  } catch (err) {
    next(err)
  }
}

// ─── The pages the link lands on ─────────────────────────────────────────────
//
// Self-contained: inline styles, no images, no script. This is opened from an email in
// an unknown browser, often on a phone with a poor connection, and it has exactly one
// job — say what happened.

function page({ accent, title, body, extra = '' }) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · Ailernova</title>
</head>
<body style="margin:0;padding:24px;min-height:100vh;box-sizing:border-box;background:#f4f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;display:flex;align-items:center;justify-content:center;">
  <div style="max-width:440px;width:100%;background:#ffffff;border-radius:16px;padding:40px 32px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="font-size:18px;font-weight:700;color:#5b3df5;margin-bottom:28px;">Ailernova</div>
    <div style="font-size:40px;line-height:1;margin-bottom:20px;">${accent}</div>
    <h1 style="font-size:21px;font-weight:700;margin:0 0 12px;">${title}</h1>
    <p style="font-size:15px;line-height:1.6;color:#4a4a55;margin:0 0 24px;">${body}</p>
${extra}
  </div>
</body></html>`
}

function successPage() {
  return page({
    accent: '✅',
    title: 'Your account is back',
    body: 'Everything is where you left it — your lessons, your progress and your notes. Open Ailernova and sign in as usual.',
    // A custom scheme, so this only does anything once the app declares one and a build
    // carrying that declaration is installed (app.json). Until then it is a dead button
    // on a page that has already done the real work, which is why the line below tells
    // the reader to open the app themselves either way.
    extra: `    <a href="ailernova://" style="display:inline-block;background:#5b3df5;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">Open the Ailernova app</a>
    <p style="font-size:13px;color:#8a8a94;margin:20px 0 0;">If that button does nothing, just open the app from your home screen.</p>`,
  })
}

function failurePage(reason) {
  return page({
    accent: '⚠️',
    title: 'This link did not work',
    body: reason,
  })
}

module.exports = { request, confirmByLink, confirmByCode }
