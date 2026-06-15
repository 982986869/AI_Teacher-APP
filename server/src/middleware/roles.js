'use strict'

const { AppError } = require('./errorHandler')

/**
 * Route guard that allows only the given roles. Must run AFTER authenticate
 * (which attaches req.user, including req.user.role).
 *
 * Usage: router.post('/x', requireRole('TEACHER', 'ADMIN'), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Authentication required', 401))
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403))
    }
    next()
  }
}

module.exports = { requireRole }
