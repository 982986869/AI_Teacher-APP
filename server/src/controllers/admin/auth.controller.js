'use strict'

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../../config/database')
const { config } = require('../../config/env')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const { isAdminRole, permissionsFor, ROLE_LABELS } = require('../../services/admin/permissions')
const audit = require('../../services/admin/audit.service')

function signToken(userId) {
  return jwt.sign({ sub: userId }, config.auth.jwtSecret, { expiresIn: config.auth.jwtExpiresIn })
}

function shape(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.admin_role,
    roleLabel: ROLE_LABELS[user.admin_role] || user.admin_role,
    permissions: permissionsFor(user.admin_role),
  }
}

// POST /api/admin/auth/login  { email, password }
// Reuses the exact bcrypt/JWT flow the student app uses — the only difference is the
// hard requirement that the account carries an admin_role and is active.
async function login(req, res, next) {
  try {
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : ''
    const password = req.body.password || ''
    if (!email || !password) throw new AppError('Email and password are required', 422)

    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, name, email, "passwordHash", admin_role, is_active
         FROM "users" WHERE lower(email) = $1 LIMIT 1`,
      email,
    )
    const user = rows && rows[0]

    // Unified message prevents enumeration of admin accounts.
    const invalid = new AppError('Invalid email or password', 401)
    if (!user || !user.passwordHash) return next(invalid)

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return next(invalid)

    if (!isAdminRole(user.admin_role)) return next(new AppError('This account does not have admin access', 403))
    if (user.is_active === false) return next(new AppError('This admin account has been deactivated', 403))

    // Best-effort login audit (actor context assembled inline since middleware hasn't run).
    req.admin = { id: user.id, name: user.name, email: user.email, role: user.admin_role }
    await audit.record(req, { module: 'auth', action: 'login', targetType: 'admin', targetId: user.id, targetLabel: user.email })

    return ApiResponse.success(res, { token: signToken(user.id), admin: shape(user) })
  } catch (err) { next(err) }
}

// GET /api/admin/auth/me
async function me(req, res) {
  return ApiResponse.success(res, { admin: req.admin })
}

module.exports = { login, me }
