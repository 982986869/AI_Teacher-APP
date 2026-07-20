'use strict'

const jwt = require('jsonwebtoken')
const db = require('../config/database')
const { config } = require('../config/env')
const { AppError } = require('./errorHandler')
const { isAdminRole, hasPermission, permissionsFor } = require('../services/admin/permissions')

// Admin portal auth — deliberately separate from the student `authenticate` middleware.
// The token is the same JWT (same secret/flow), but here we additionally require the
// user to carry an `admin_role`. A student token therefore cannot reach any /api/admin
// route even though it is a valid JWT.
async function adminAuthenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401))
  }
  const token = header.slice(7)

  let decoded
  try {
    decoded = jwt.verify(token, config.auth.jwtSecret)
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AppError('Session expired, please sign in again', 401))
    return next(new AppError('Invalid authentication token', 401))
  }

  let user
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT id, name, email, phone, role::text AS role,
              admin_role, is_active
         FROM "users" WHERE id = $1::uuid LIMIT 1`,
      decoded.sub,
    )
    user = rows && rows[0]
  } catch (err) {
    return next(new AppError('Service temporarily unavailable. Please try again.', 503))
  }

  if (!user) return next(new AppError('User no longer exists', 401))
  if (!isAdminRole(user.admin_role)) return next(new AppError('Admin access required', 403))
  if (user.is_active === false) return next(new AppError('This admin account has been deactivated', 403))

  req.admin = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.admin_role,
    permissions: permissionsFor(user.admin_role),
  }
  next()
}

// Route guard factory: requirePermission('users.edit'). Must run after adminAuthenticate.
function requirePermission(permission) {
  return function (req, res, next) {
    if (!req.admin) return next(new AppError('Authentication required', 401))
    if (!hasPermission(req.admin.role, permission)) {
      return next(new AppError('You do not have permission to perform this action', 403))
    }
    next()
  }
}

module.exports = { adminAuthenticate, requirePermission }
