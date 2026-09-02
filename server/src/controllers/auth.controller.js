'use strict'

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const { OAuth2Client } = require('google-auth-library')
const { default: normalizeEmail } = require('validator/lib/normalizeEmail')
const db = require('../config/database')
const { config } = require('../config/env')
const { AppError } = require('../middleware/errorHandler')
const ApiResponse = require('../utils/ApiResponse')
const { deriveScope } = require('../services/personalization/scope')
const { permissionsForUser } = require('../services/admin/permissions')
const { validateProfilePatch } = require('../services/personalization/validateProfile')
const { uploadImage, isConfigured: storageConfigured } = require('../services/storage')
const { archiveEmail, archivePhone } = require('../services/accountDeletion')

// Full personalization row (raw — these columns live outside the generated client).
async function fetchScopeUser(id) {
  const rows = await db.$queryRawUnsafe(
    // admin_role rides along because login/register hand this whole row back as `user`
    // and derive its `permissions` field from it — without the column here that field
    // would silently be [] for every admin/support account, no matter their real role.
    // is_active is the other half of that derivation (see permissionsForUser): a
    // deactivated account keeps its admin_role, so the role alone would still grant a
    // locked-out agent the Support tab on the app.
    // date_of_birth / parent_email / learning_prefs (prisma/sql/user_profile_fields.sql)
    // ride along so Edit Profile and Learning Preferences can prefill from `user` on
    // the very first render, without a second round trip of their own.
    `SELECT id, name, email, phone, grade, role::text AS role, admin_role, is_active,
            board, stream, language, school, account_type, linked_student_id, photo_url AS "photoUrl",
            to_char("date_of_birth", 'YYYY-MM-DD') AS "dateOfBirth",
            parent_email AS "parentEmail", learning_prefs AS "learningPrefs"
       FROM "users" WHERE id = $1::uuid LIMIT 1`,
    id,
  )
  return rows && rows[0]
}

// A student who never picks a profile photo still gets a real, distinct-looking
// avatar instead of a bare initial — a free deterministic avatar image, seeded by
// the user's own id (stable forever, no account lookup needed to regenerate it).
const defaultAvatarUrl = (userId) => `https://api.dicebear.com/9.x/adventurer/png?seed=${userId}`

// Backfill a missing photoUrl (new account, or an older account from before this
// feature existed) once, in place, so every response from here on already has one.
async function ensurePhoto(user) {
  if (user && !user.photoUrl) {
    const url = defaultAvatarUrl(user.id)
    await db.$executeRawUnsafe(`UPDATE "users" SET "photo_url" = $1 WHERE id = $2::uuid`, url, user.id)
    user.photoUrl = url
  }
  return user
}

// No client secret: this only ever verifies ID-token signatures against Google's
// public keys, which the library fetches and caches itself.
const googleClient = new OAuth2Client()

function signToken(userId) {
  return jwt.sign({ sub: userId }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  })
}

// Fields returned on every user response — never expose passwordHash
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  grade: true,
  provider: true,
  createdAt: true,
}

// ─── Register ────────────────────────────────────────────────────────────────

async function register(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, errors.array()[0].msg, 422)
    }

    const { name, email, phone, password, grade } = req.body

    if (!email && !phone) {
      throw new AppError('Either email or phone number is required', 422)
    }

    // Duplicate check
    const orConditions = []
    if (email) orConditions.push({ email })
    if (phone) orConditions.push({ phone })

    const existing = await db.user.findFirst({ where: { OR: orConditions } })
    if (existing) {
      throw new AppError('An account with this email or phone already exists', 409)
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const created = await db.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        passwordHash,
        grade: grade || null,
        provider: 'EMAIL',
      },
      select: { id: true },
    })

    const user = await ensurePhoto(await fetchScopeUser(created.id))

    return ApiResponse.created(res, {
      token: signToken(user.id), user, scope: deriveScope(user),
      permissions: permissionsForUser(user),
    }, 'Account created')
  } catch (err) {
    next(err)
  }
}

// ─── Login ───────────────────────────────────────────────────────────────────

// Write a 'login' row to student_events — the same log the activity dashboard reads
// for note/solution/lesson views, so "when did they last sign in" and "what did they
// study" come from one place and sort together on one timeline.
//
// Best-effort by design: swallowed errors, never awaited. A failed analytics insert
// must not turn a valid sign-in into an error the student sees.
function recordLogin(userId, method) {
  db.$executeRaw`
    INSERT INTO student_events ("userId", type, detail)
    VALUES (${userId}::uuid, 'login', ${JSON.stringify({ method })}::jsonb)`
    .catch(() => {})
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, errors.array()[0].msg, 422)
    }

    const { email, password } = req.body

    // Fetch including passwordHash for comparison
    const user = await db.user.findUnique({
      where: { email },
      select: { ...USER_SELECT, passwordHash: true },
    })

    // Unified message prevents user enumeration
    const invalid = new AppError('Invalid email or password', 401)

    if (!user || !user.passwordHash) return next(invalid)

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return next(invalid)

    const { passwordHash: _omit, ...safeUser } = user
    const full = await ensurePhoto((await fetchScopeUser(user.id)) || safeUser)

    // Login history for the activity dashboard. Recorded HERE rather than from the
    // client so it cannot be skipped, replayed or backdated by the app — the server
    // is the only thing that knows a login actually succeeded. Fire-and-forget and
    // deliberately not awaited: an analytics write must never fail a sign-in.
    recordLogin(user.id, 'password')

    return ApiResponse.success(res, {
      token: signToken(user.id), user: full, scope: deriveScope(full),
      permissions: permissionsForUser(full),
    })
  } catch (err) {
    next(err)
  }
}

// ─── Google ──────────────────────────────────────────────────────────────────

// Verified against every configured client ID at once: Android returns an idToken
// audienced to the *web* client, iOS to the iOS client.
async function googleAuth(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, errors.array()[0].msg, 422)
    }

    if (!config.google.clientIds.length) {
      throw new AppError('Google sign-in is not configured on this server', 503)
    }

    const { idToken } = req.body

    let payload
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: config.google.clientIds,
      })
      payload = ticket.getPayload()
    } catch (err) {
      throw new AppError('Invalid Google token', 401)
    }

    // Google only omits email when the token lacks the email scope; an unverified
    // address must never be trusted to match an existing account.
    if (!payload || !payload.email) {
      throw new AppError('Google account did not return an email address', 422)
    }
    if (payload.email_verified === false) {
      throw new AppError('This Google email address is not verified', 403)
    }

    // Must match how /register stores addresses, or a Gmail user who signed up with
    // "First.Last@gmail.com" (stored dot-stripped as "firstlast@gmail.com") would miss
    // their own account here and get a second one.
    const email = normalizeEmail(payload.email) || payload.email.toLowerCase()
    let user = await db.user.findUnique({ where: { email }, select: USER_SELECT })
    let isNewUser = false

    if (!user) {
      isNewUser = true
      user = await db.user.create({
        data: {
          name: payload.name || payload.given_name || email.split('@')[0],
          email,
          provider: 'GOOGLE',
        },
        select: USER_SELECT,
      })
    }

    const full = await ensurePhoto((await fetchScopeUser(user.id)) || user)

    // Same login history as the password path — without this, every Google user
    // shows a blank sign-in record on the activity dashboard. `isNewUser` separates
    // a first-ever signup from a returning sign-in, which the dashboard needs to
    // avoid counting account creation as a study session.
    recordLogin(user.id, isNewUser ? 'google-signup' : 'google')

    // `permissions` must ride along here exactly as it does on login/register. The app
    // stores whatever signIn() is handed and never re-fetches /me until the next cold
    // start, so omitting it costs a support agent who taps "Continue with Google" their
    // Support tab for the entire session.
    return ApiResponse.success(
      res,
      {
        token: signToken(user.id), user: full, scope: deriveScope(full), isNewUser,
        permissions: permissionsForUser(full),
      },
      isNewUser ? 'Account created' : 'Signed in',
    )
  } catch (err) {
    next(err)
  }
}

// ─── Me ──────────────────────────────────────────────────────────────────────

async function me(req, res) {
  const user = await ensurePhoto(req.user)
  // The app gates its Support tab and its reply/resolve buttons on this list. It is the
  // server's copy of the role map, never a second one kept in the app — a new role or a
  // regranted permission must not need an app release.
  return ApiResponse.success(res, {
    user, scope: req.scope, permissions: permissionsForUser(user),
  })
}

// ─── Update profile (migration / complete-profile) ─────────────────────────────

async function updateProfile(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { name, grade, board, stream, language, school, dateOfBirth, parentEmail, learningPrefs } = req.body

    // Role/class/stream validation — the backend is the authority, not the client.
    const v = validateProfilePatch(req.body, req.user)
    if (v.error) return ApiResponse.error(res, v.error, 422)
    const { normalizedAccount } = v

    const sets = []
    const vals = []
    // `cast` matters for the two non-text columns. Every value crosses the wire as a
    // string, and Postgres will not put text into a DATE or a JSONB on its own — the
    // update fails with "column is of type date but expression is of type text" unless
    // the placeholder says what it is. The TEXT columns pass no cast and are unchanged.
    const add = (col, val, cast = '') => {
      sets.push(`"${col}" = $${sets.length + 1}${cast}`)
      vals.push(val)
    }
    // `name` is NOT NULL on the table, so an empty string here would be a way to erase
    // a display name into a blank row — the validator's min:1 already rejects that, and
    // this skips it a second time rather than writing '' if the rule ever loosens.
    if (name !== undefined && String(name).trim()) add('name', String(name).trim())
    if (grade !== undefined) add('grade', grade || null)
    if (board !== undefined) add('board', board || null)
    if (stream !== undefined) add('stream', stream || null)
    if (language !== undefined) add('language', language || null)
    if (school !== undefined) add('school', school || null)
    if (dateOfBirth !== undefined) add('date_of_birth', dateOfBirth || null, '::date')
    if (parentEmail !== undefined) add('parent_email', parentEmail || null)
    // Written whole: the Learning Preferences screen always sends the complete sheet,
    // so a partial merge here would only be able to disagree with what the user sees.
    if (learningPrefs !== undefined) {
      add('learning_prefs', learningPrefs === null ? null : JSON.stringify(learningPrefs), '::jsonb')
    }
    if (normalizedAccount !== undefined) add('account_type', normalizedAccount)
    if (!sets.length) return ApiResponse.error(res, 'Nothing to update', 400)

    vals.push(req.user.id)
    await db.$executeRawUnsafe(`UPDATE "users" SET ${sets.join(', ')} WHERE id = $${vals.length}::uuid`, ...vals)

    const user = await fetchScopeUser(req.user.id)
    return ApiResponse.success(res, { user, scope: deriveScope(user) }, 'Profile updated')
  } catch (err) {
    next(err)
  }
}

// ─── Upload / change profile photo ──────────────────────────────────────────
// Used both right after signup (if the student picked a photo) and later from
// the Profile screen ("change photo"). Same storage bucket the admin content-
// image upload uses, just its own `avatars/` folder within it.

const PHOTO_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

async function uploadPhoto(req, res, next) {
  try {
    if (!storageConfigured()) return ApiResponse.error(res, 'Image storage is not configured on the server.', 503)
    if (!req.file || !req.file.buffer) return ApiResponse.error(res, 'No photo was uploaded.', 400)
    const mime = String(req.file.mimetype || '').toLowerCase()
    if (!PHOTO_MIME.has(mime)) return ApiResponse.error(res, 'Only JPG, PNG or WebP images are allowed.', 415)

    const url = await uploadImage(req.file.buffer, { contentType: mime, originalName: req.file.originalname, folder: 'avatars' })
    await db.$executeRawUnsafe(`UPDATE "users" SET "photo_url" = $1 WHERE id = $2::uuid`, url, req.user.id)

    const user = await fetchScopeUser(req.user.id)
    return ApiResponse.success(res, { user, scope: deriveScope(user) }, 'Profile photo updated')
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/auth/me — the account holder deletes their own account.
 *
 * This is a SOFT delete: the row and everything hanging off it stay in the database.
 * What changes is that the person can never sign in to it again. Removing the data
 * for good is a separate, staff-triggered action from the admin console.
 *
 * The email and phone are archived rather than left in place because both columns are
 * UNIQUE. Left alone they would block the same person from ever registering again —
 * and registering again is exactly what they are told to do. See services/accountDeletion.
 *
 * is_active is deliberately NOT touched: that column means "staff suspended this
 * person", and a student deleting their own account is not that.
 */
async function deleteAccount(req, res, next) {
  try {
    const rows = await db.$queryRawUnsafe(
      'SELECT id::text AS id, email, phone, is_deleted FROM "users" WHERE id = $1::uuid LIMIT 1',
      req.user.id,
    )
    const user = rows && rows[0]
    if (!user) return next(new AppError('User no longer exists', 401))
    if (user.is_deleted) return next(new AppError('This account is already deleted', 409))

    await db.$executeRawUnsafe(
      'UPDATE "users" SET is_deleted = true, deleted_at = now(), email = $2, phone = $3 WHERE id = $1::uuid',
      user.id, archiveEmail(user.email, user.id), archivePhone(user.phone, user.id),
    )

    // 200 with no body: the app signs out on success, so there is nothing to render.
    return ApiResponse.success(res, null, 'Account deleted')
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, googleAuth, me, updateProfile, uploadPhoto, deleteAccount }
