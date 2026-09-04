'use strict'

const crypto = require('crypto')
const db = require('../config/database')
const { config } = require('../config/env')
const ApiResponse = require('../utils/ApiResponse')
const { sendMail } = require('../services/mailer')
const mailTemplates = require('../services/mailTemplates')
const { GRACE_PERIOD_DAYS } = require('../services/accountDeletion')

// Work that runs on a clock rather than on a person.
//
// Nothing in this process schedules itself. Render's free tier puts the service to
// sleep when it is idle, so an in-process timer would simply not fire on a quiet day —
// and a deletion notice that silently skips a day is worse than none, because staff
// would come to trust it. These endpoints are poked from outside instead (cron-job.org
// or anything equivalent), which also has the useful side effect of waking the service.
//
// Every job here must be safe to call twice, and safe to miss: the admin console's
// Deleted filter is the record of what is due, and these only ever remind someone to
// go and look at it.

// A shared secret in a header, not an admin session: the caller is a cron service that
// cannot log in. Compared in constant time, and over digests so that two secrets of
// different lengths do not fail early and leak that difference.
function requireJobSecret(req, res, next) {
  if (!config.jobsSecret) {
    // Refuse rather than run: an unset secret must not quietly mean "open to everyone".
    return ApiResponse.error(res, 'Scheduled jobs are not configured on this server.', 503)
  }
  const given = crypto.createHash('sha256').update(String(req.get('X-Job-Secret') || '')).digest()
  const want = crypto.createHash('sha256').update(String(config.jobsSecret)).digest()
  if (!crypto.timingSafeEqual(given, want)) {
    return ApiResponse.error(res, 'Not authorised.', 401)
  }
  return next()
}

// POST /api/jobs/deletion-digest
//
// "These accounts have sat out their grace period; someone should remove them."
async function deletionDigest(req, res, next) {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, name, email, deleted_at AS "deletedAt",
              FLOOR(EXTRACT(EPOCH FROM (now() - deleted_at)) / 86400)::int AS "daysWaiting"
         FROM "users"
        WHERE is_deleted
          AND deleted_at <= now() - make_interval(days => $1::int)
        ORDER BY deleted_at ASC`,
      GRACE_PERIOD_DAYS,
    )

    // Nothing due is the normal case on most days. Sending "0 accounts are ready" every
    // morning is the fastest way to teach someone to filter these out of their inbox,
    // and then to miss the one that matters.
    if (!rows.length) {
      return ApiResponse.success(res, { due: 0, emailed: false }, 'Nothing is due for deletion.')
    }

    // Awaited, unlike the student-facing mail: the caller here is a cron service, and
    // whether the send worked is the only thing it can usefully be told.
    const result = await sendMail({
      to: config.adminAlertEmail,
      ...mailTemplates.adminDigest({ rows }),
    })

    return ApiResponse.success(
      res,
      { due: rows.length, emailed: result.ok, reason: result.error },
      `${rows.length} account${rows.length === 1 ? '' : 's'} due for deletion.`,
    )
  } catch (err) {
    next(err)
  }
}

module.exports = { requireJobSecret, deletionDigest }
