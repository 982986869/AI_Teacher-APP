'use strict'

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const db = require('../config/database')
const { config } = require('../config/env')
const { AppError } = require('../middleware/errorHandler')
const ApiResponse = require('../utils/ApiResponse')
const { deriveScope } = require('../services/personalization/scope')
const { validateProfilePatch } = require('../services/personalization/validateProfile')

// Full personalization row (raw — these columns live outside the generated client).
async function fetchScopeUser(id) {
  const rows = await db.$queryRawUnsafe(
    `SELECT id, name, email, phone, grade, role::text AS role,
            board, stream, language, school, account_type, linked_student_id
       FROM "users" WHERE id = $1::uuid LIMIT 1`,
    id,
  )
  return rows && rows[0]
}

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

    const user = await db.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        passwordHash,
        grade: grade || null,
        provider: 'EMAIL',
      },
      select: USER_SELECT,
    })

    return ApiResponse.created(res, { token: signToken(user.id), user, scope: deriveScope(user) }, 'Account created')
  } catch (err) {
    next(err)
  }
}

// ─── Login ───────────────────────────────────────────────────────────────────

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
    const full = (await fetchScopeUser(user.id)) || safeUser

    return ApiResponse.success(res, { token: signToken(user.id), user: full, scope: deriveScope(full) })
  } catch (err) {
    next(err)
  }
}

// ─── Me ──────────────────────────────────────────────────────────────────────

async function me(req, res) {
  return ApiResponse.success(res, { user: req.user, scope: req.scope })
}

// ─── Update profile (migration / complete-profile) ─────────────────────────────

async function updateProfile(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { grade, board, stream, language, school } = req.body

    // Role/class/stream validation — the backend is the authority, not the client.
    const v = validateProfilePatch(req.body, req.user)
    if (v.error) return ApiResponse.error(res, v.error, 422)
    const { normalizedAccount } = v

    const sets = []
    const vals = []
    const add = (col, val) => { sets.push(`"${col}" = $${sets.length + 1}`); vals.push(val) }
    if (grade !== undefined) add('grade', grade || null)
    if (board !== undefined) add('board', board || null)
    if (stream !== undefined) add('stream', stream || null)
    if (language !== undefined) add('language', language || null)
    if (school !== undefined) add('school', school || null)
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

module.exports = { register, login, me, updateProfile }
