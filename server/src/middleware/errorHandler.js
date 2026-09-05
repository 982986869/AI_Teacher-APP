'use strict'

const { config } = require('../config/env')
const errorLog = require('../services/errorLog.service')

class AppError extends Error {
  // `code` is optional and machine-readable — set it when the CLIENT has to branch on
  // WHY, not just on the status. The paywall is the first such case: a 403 that means
  // "locked" raises an unlock sheet, and a 403 that means anything else must not.
  // Sniffing the message string would break the first time someone reworded it.
  constructor(message, statusCode = 500, code = null) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    if (code) this.code = code
    Error.captureStackTrace(this, this.constructor)
  }
}

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404))
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500
  const isOperational = err.isOperational === true

  if (config.isDev) {
    console.error(`[${statusCode}] ${err.message}`, err.stack)
  } else if (statusCode >= 500) {
    console.error(`[${statusCode}] ${err.message}`)
  }

  // Persist the 5xx to error_logs so it outlives the Render log buffer (which the
  // free plan rotates, and which nobody reads until something is already reported).
  // 4xx is deliberately excluded: a wrong password or an expired token is the API
  // working, and logging it would bury the real faults under thousands of rows we
  // have no disk budget for. Not awaited and never able to reject — the response
  // must not wait on a log write, and a failed log must not replace the real error.
  if (statusCode >= 500) {
    errorLog.record({
      source: 'server',
      level: 'error',
      site: `${req.method} ${req.route?.path || req.originalUrl || ''}`.trim(),
      message: err.message,
      stack: err.stack,
      context: { statusCode, url: req.originalUrl, operational: isOperational },
      userId: req.user?.id || req.admin?.id || null,
      userRole: req.admin?.role || req.user?.role || null,
    })
  }

  res.status(statusCode).json({
    success: false,
    error: isOperational ? err.message : 'Internal server error',
    // Only for operational errors: an unexpected crash must not leak an internal
    // code the client would then start branching on.
    ...(isOperational && err.code && { code: err.code }),
    ...(config.isDev && !isOperational && { stack: err.stack }),
  })
}

module.exports = { AppError, notFound, errorHandler }
