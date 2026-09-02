'use strict'

const jwt = require('jsonwebtoken')
const db = require('../config/database')
const { config } = require('../config/env')
const { AppError } = require('./errorHandler')
const { deriveScope } = require('../services/personalization/scope')

/**
 * Verifies the Bearer token and attaches req.user (incl. personalization fields) and
 * req.scope (normalized role/class/stream/subjects used to personalize + enforce).
 * Returns 401 for missing/invalid/expired tokens.
 */
async function authenticate(req, res, next) {
  // Idempotent. Most routers call this themselves, but the paywall has to run AFTER
  // it and is mounted a level up in routes/index.js — so on a gated route this runs
  // twice. Without this guard that would be two identical user lookups on every
  // single content request.
  if (req.user) return next()

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401))
  }

  const token = authHeader.slice(7)

  let decoded
  try {
    decoded = jwt.verify(token, config.auth.jwtSecret)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Session expired, please log in again', 401))
    }
    return next(new AppError('Invalid authentication token', 401))
  }

  let user
  try {
    // Raw select so we get the personalization columns without needing a Prisma client
    // regen; role::text avoids enum-value surprises. These feed req.scope below.
    const rows = await db.$queryRawUnsafe(
      // admin_role rides along so non-/api/admin routes can tell staff from students
      // without a second query — /api/support uses it to expose a team's ticket queue to
      // staff while keeping students scoped to their own tickets. It stays null for
      // every normal account, so nothing else changes.
      //
      // is_active comes with it because admin_role on its own overstates access:
      // deactivating an account leaves the role in place (admin/users.controller.js
      // setStatus), and the web portal only enforces the switch at ITS login, which an app
      // token never goes through. Without this column /api/support and /me would keep
      // treating a locked-out agent as staff until their JWT expired.
      // access_level rides along for the same reason as is_active: it is read on
      // essentially every request (requireFullAccess below), and a second query per
      // request to fetch one text column would be a poor trade.
      // date_of_birth / parent_email / learning_prefs are here rather than in a second
      // query because GET /api/auth/me answers straight from req.user — the app calls it
      // on every launch, and without these three the Edit Profile and Learning
      // Preferences forms would open blank until the student's next save. Three more
      // columns off a row this query already fetches costs nothing extra.
      `SELECT id, name, email, phone, grade, role::text AS role, admin_role, is_active, is_deleted, access_level,
              board, stream, language, school, account_type, linked_student_id, photo_url AS "photoUrl",
              to_char("date_of_birth", 'YYYY-MM-DD') AS "dateOfBirth",
              parent_email AS "parentEmail", learning_prefs AS "learningPrefs"
         FROM "users" WHERE id = $1::uuid LIMIT 1`,
      decoded.sub,
    )
    user = rows && rows[0]
  } catch (err) {
    // Transient DB issue (e.g. Supabase pooler connection reset / P1001). Surface a
    // clean 503 instead of letting the rejection crash the whole server.
    return next(new AppError('Service temporarily unavailable. Please try again.', 503))
  }

  if (!user) {
    return next(new AppError('User no longer exists', 401))
  }

  // A deleted account must not keep working on the strength of a token issued before
  // it was deleted. The archived email already stops a fresh sign-in, but tokens
  // outlive that, so the check has to be here — this is the point every authenticated
  // request passes through.
  if (user.is_deleted) {
    return next(new AppError('This account has been deleted', 401))
  }

  req.user = user
  req.scope = deriveScope(user)
  next()
}

/**
 * Gate a route to ADMIN users only. Must run after `authenticate`.
 * Used for destructive content-management endpoints (e.g. importing /
 * deleting Last Year Papers) that students must never reach.
 */
function requireAdmin(req, res, next) {
  if (!req.user) return next(new AppError('Authentication required', 401))
  if (req.user.role !== 'ADMIN') {
    return next(new AppError('Admin access required', 403))
  }
  next()
}

/**
 * Gate a route to accounts with FULL content access. Must run after `authenticate`.
 *
 * This is the paywall. The app draws locks and a request sheet, but the app is not
 * the enforcement — a token plus curl would otherwise pull the entire syllabus. Every
 * content router goes through here; Brain Gym, the Arena, support, auth and config
 * deliberately do not (see routes/index.js).
 *
 * The 403 carries `code: 'LOCKED'` because the app has to tell this apart from an
 * expired session: one raises the unlock sheet, the other logs the student out. A
 * bare 403 cannot say which, and guessing from the message text would break the
 * first time someone reworded it.
 *
 * Staff and testers never reach the failure branch — deriveScope already resolves
 * them to 'full'.
 */
function requireFullAccess(req, res, next) {
  if (!req.user) return next(new AppError('Authentication required', 401))
  if (req.scope && req.scope.accessLevel === 'full') return next()
  return next(new AppError('This content is locked', 403, 'LOCKED'))
}

module.exports = { authenticate, requireAdmin, requireFullAccess }
