'use strict'

const { AppError } = require('./errorHandler')

// Route guard factory: requireRole('TEACHER', 'ADMIN'). Must run AFTER `authenticate`
// (which sets req.user with a normalized `role` text field). Any user whose role is
// not in the allowed list is rejected with a 403.
function requireRole(...roles) {
  const allowed = roles.map((r) => String(r).toUpperCase())
  return function (req, res, next) {
    if (!req.user) return next(new AppError('Authentication required', 401))
    const role = String(req.user.role || '').toUpperCase()
    if (!allowed.includes(role)) {
      return next(new AppError('You do not have permission to perform this action', 403))
    }
    next()
  }
}

module.exports = { requireRole }
