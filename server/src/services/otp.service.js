'use strict'

const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const db = require('../config/database')
const { AppError } = require('../middleware/errorHandler')
const sms = require('../providers/sms')

const OTP_TTL_MS = 5 * 60 * 1000 // 5 minutes
const MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_MS = 30 * 1000 // min gap between requests for a phone
const MAX_PER_HOUR = 5 // abuse cap per phone per hour

// Public, password-free fields returned to the client.
const USER_PUBLIC = {
  id: true,
  name: true,
  email: true,
  phone: true,
  grade: true,
  role: true,
  provider: true,
  createdAt: true,
}

function normalizePhone(raw) {
  return String(raw || '').trim().replace(/\s+/g, '')
}

function generateOtp() {
  // 6-digit, cryptographically random, zero-padded.
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0')
}

// ─── Request an OTP ────────────────────────────────────────────────────────────
async function requestOtp({ phone }) {
  const normPhone = normalizePhone(phone)

  // Abuse cap: max N requests/hour for this phone.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentCount = await db.phoneOtp.count({
    where: { phone: normPhone, createdAt: { gte: oneHourAgo } },
  })
  if (recentCount >= MAX_PER_HOUR) {
    throw new AppError('Too many OTP requests. Please try again later.', 429)
  }

  // Cooldown: don't allow rapid re-requests.
  const lastActive = await db.phoneOtp.findFirst({
    where: { phone: normPhone, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  })
  if (lastActive && Date.now() - new Date(lastActive.createdAt).getTime() < RESEND_COOLDOWN_MS) {
    throw new AppError('Please wait a few seconds before requesting another OTP.', 429)
  }

  // LOGIN if the phone already has an account, otherwise SIGNUP.
  const existing = await db.user.findUnique({ where: { phone: normPhone }, select: { id: true } })
  const purpose = existing ? 'LOGIN' : 'SIGNUP'

  const otp = generateOtp()
  const otpHash = await bcrypt.hash(otp, 10)
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  // Invalidate all previous active OTPs, then store the new one.
  await db.$transaction([
    db.phoneOtp.updateMany({
      where: { phone: normPhone, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    db.phoneOtp.create({ data: { phone: normPhone, otpHash, purpose, expiresAt } }),
  ])

  await sms.sendOtp(normPhone, otp)

  // `otp` is returned to the caller (controller) which exposes it as devOtp ONLY
  // in development. It is never persisted in plain text.
  return { phone: normPhone, purpose, otp, expiresInSeconds: Math.floor(OTP_TTL_MS / 1000) }
}

// ─── Verify an OTP → login or create the user ──────────────────────────────────
async function verifyOtp({ phone, otp, name, grade }) {
  const normPhone = normalizePhone(phone)

  const record = await db.phoneOtp.findFirst({
    where: { phone: normPhone, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  })
  if (!record) {
    throw new AppError('No active OTP found. Please request a new one.', 400)
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    await db.phoneOtp.update({ where: { id: record.id }, data: { consumedAt: new Date() } })
    throw new AppError('Your OTP has expired. Please request a new one.', 400)
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await db.phoneOtp.update({ where: { id: record.id }, data: { consumedAt: new Date() } })
    throw new AppError('Too many incorrect attempts. Please request a new OTP.', 429)
  }

  const match = await bcrypt.compare(String(otp), record.otpHash)
  if (!match) {
    const attempts = record.attempts + 1
    await db.phoneOtp.update({
      where: { id: record.id },
      data: { attempts, ...(attempts >= MAX_ATTEMPTS ? { consumedAt: new Date() } : {}) },
    })
    const left = Math.max(0, MAX_ATTEMPTS - attempts)
    throw new AppError(
      left > 0 ? `Incorrect OTP. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Incorrect OTP. Please request a new one.',
      400
    )
  }

  // Correct — consume this OTP so it can't be reused.
  await db.phoneOtp.update({ where: { id: record.id }, data: { consumedAt: new Date() } })

  // Login if the user exists, otherwise create a phone-based account.
  let user = await db.user.findUnique({ where: { phone: normPhone }, select: USER_PUBLIC })
  let isNewUser = false
  if (!user) {
    user = await db.user.create({
      data: {
        name: (name && String(name).trim()) || 'Student',
        phone: normPhone,
        grade: grade ? String(grade).trim() : null,
        provider: 'PHONE',
      },
      select: USER_PUBLIC,
    })
    isNewUser = true
  }

  return { user, isNewUser }
}

module.exports = { requestOtp, verifyOtp, normalizePhone }
