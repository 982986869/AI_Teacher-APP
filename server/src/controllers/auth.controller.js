'use strict'

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const db = require('../config/database')
const { config } = require('../config/env')
const { AppError } = require('../middleware/errorHandler')
const ApiResponse = require('../utils/ApiResponse')

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

    return ApiResponse.created(res, { token: signToken(user.id), user }, 'Account created')
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

    return ApiResponse.success(res, { token: signToken(user.id), user: safeUser })
  } catch (err) {
    next(err)
  }
}

// ─── Me ──────────────────────────────────────────────────────────────────────

async function me(req, res) {
  return ApiResponse.success(res, { user: req.user })
}

module.exports = { register, login, me }
