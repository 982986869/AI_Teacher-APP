'use strict'

const { config } = require('../config/env')

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
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

  res.status(statusCode).json({
    success: false,
    error: isOperational ? err.message : 'Internal server error',
    ...(config.isDev && !isOperational && { stack: err.stack }),
  })
}

module.exports = { AppError, notFound, errorHandler }
