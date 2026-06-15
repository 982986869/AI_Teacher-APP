'use strict'

const jwt = require('jsonwebtoken')
const db = require('../config/database')
const { config } = require('../config/env')
const { AppError } = require('./errorHandler')

/**
 * Verifies the Bearer token and attaches req.user.
 * Returns 401 for missing/invalid/expired tokens.
 */
async function authenticate(req, res, next) {
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

  const user = await db.user.findUnique({
    where: { id: decoded.sub },
    select: { id: true, name: true, email: true, phone: true, grade: true, role: true },
  })

  if (!user) {
    return next(new AppError('User no longer exists', 401))
  }

  req.user = user
  next()
}

module.exports = { authenticate }
