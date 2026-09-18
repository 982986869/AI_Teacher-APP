'use strict'

// Free demo-class booking from the parent app. The row in trial_bookings is the record;
// the two emails (parent confirmation, team copy) are built from it and sent from
// kids@. Mail failure is recorded on the row, not surfaced as a failed booking — the
// slot is taken either way, and the team copy or the admin can chase a lost email.

const db = require('../config/database')
const { config } = require('../config/env')
const ApiResponse = require('../utils/ApiResponse')
const mailer = require('../services/mailer')
const { trialBooked, trialBookedTeam } = require('../services/mailTemplates')
const { validateBookingInput, DURATION_MIN, toApi } = require('../services/trialBooking')

// Swappable for tests, which must not open SMTP.
const _deps = { sendMail: (m) => mailer.sendMail(m) }

// The user's one booking that is still ahead of them: booked, and its class has not
// ended. "Ended" rather than "started" so the Join button stays until the class is over.
async function findUpcoming(userId) {
  const rows = await db.$queryRawUnsafe(
    `SELECT * FROM "trial_bookings"
      WHERE user_id = $1::uuid AND status = 'booked'
        AND slot_at + make_interval(mins => duration_min) > now()
      ORDER BY slot_at ASC LIMIT 1`,
    userId,
  )
  return rows[0] || null
}

// POST /api/parent/trial-bookings
async function createTrialBooking(req, res, next) {
  try {
    const meetLink = config.trial.meetLink
    if (!meetLink) return ApiResponse.error(res, 'Demo booking is not set up yet — please try again later.', 503)

    const v = validateBookingInput(req.body)
    if (!v.ok) return ApiResponse.error(res, v.error, 422)

    if (await findUpcoming(req.user.id)) {
      return ApiResponse.error(res, 'You already have a demo booked. Cancel it first to pick another slot.', 409)
    }

    const { parentName, parentEmail, parentPhone, childName, childClass, board, subject, slotAt } = v.value
    const inserted = await db.$queryRawUnsafe(
      `INSERT INTO "trial_bookings"
         (user_id, parent_name, parent_email, parent_phone, child_name, child_class, board, subject, slot_at, duration_min, meet_link)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::int, $11)
       RETURNING *`,
      req.user.id, parentName, parentEmail, parentPhone, childName, childClass, board, subject,
      slotAt.toISOString(), DURATION_MIN, meetLink,
    )
    let row = inserted[0]

    const facts = { parentName, parentEmail, parentPhone, childName, childClass, board, subject, slotAt, durationMin: DURATION_MIN, meetLink, bookingId: row.id }
    // No `from` unless TRIAL_MAIL_FROM is set: sendMail then uses MAIL_FROM, the one
    // sender Brevo already accepts (the forgot-password mails go out from it).
    const from = config.trial.mailFrom || undefined
    const [toParent, toTeam] = await Promise.all([
      _deps.sendMail({ to: parentEmail, from, ...trialBooked(facts) }),
      // The team copy reads as coming from the parent: their name in From, and
      // Reply-To set so answering it from the kids@ inbox goes to them.
      _deps.sendMail({
        to: config.trial.notifyEmail, from,
        fromName: `${parentName} via Ailernova`, replyTo: `${parentName} <${parentEmail}>`,
        ...trialBookedTeam(facts),
      }),
    ])
    // The parent's copy is the one that matters for status; a lost team copy is a
    // nuisance, a lost parent copy is a no-show.
    const mailStatus = toParent.ok ? 'sent' : 'failed'
    if (!toTeam.ok) console.error(`[trial] team copy failed for ${row.id}: ${toTeam.error}`)
    const updated = await db.$queryRawUnsafe(
      `UPDATE "trial_bookings" SET mail_status = $2 WHERE id = $1::uuid RETURNING *`, row.id, mailStatus,
    )
    row = updated[0]

    return ApiResponse.created(res, { booking: toApi(row), mailSent: toParent.ok }, 'Demo booked')
  } catch (err) { next(err) }
}

// GET /api/parent/trial-bookings/upcoming
async function upcomingTrialBooking(req, res, next) {
  try {
    const row = await findUpcoming(req.user.id)
    return ApiResponse.success(res, { booking: row ? toApi(row) : null })
  } catch (err) { next(err) }
}

// POST /api/parent/trial-bookings/:id/cancel
async function cancelTrialBooking(req, res, next) {
  try {
    const id = String(req.params.id || '')
    if (!/^[0-9a-f-]{36}$/i.test(id)) return ApiResponse.error(res, 'Booking not found.', 404)
    const rows = await db.$queryRawUnsafe(
      `UPDATE "trial_bookings" SET status = 'cancelled', cancelled_at = now()
        WHERE id = $1::uuid AND user_id = $2::uuid AND status = 'booked'
        RETURNING *`,
      id, req.user.id,
    )
    if (!rows[0]) return ApiResponse.error(res, 'Booking not found.', 404)
    return ApiResponse.success(res, { booking: toApi(rows[0]) }, 'Demo cancelled')
  } catch (err) { next(err) }
}

module.exports = { createTrialBooking, upcomingTrialBooking, cancelTrialBooking, _deps }
