'use strict'

const { Router } = require('express')
const { body } = require('express-validator')
const { register, login, me, requestPhoneOtp, verifyPhoneOtp } = require('../controllers/auth.controller')
const { authenticate } = require('../middleware/auth')

// E.164-ish: optional +, leading non-zero, 9–14 more digits.
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/

const router = Router()

// ─── Validation rules ────────────────────────────────────────────────────────

const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isMobilePhone().withMessage('Invalid phone number'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('grade')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Grade must be 20 characters or fewer'),
]

const loginRules = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
]

// ─── Routes ──────────────────────────────────────────────────────────────────

const requestOtpRules = [
  body('phone')
    .trim()
    .matches(PHONE_REGEX).withMessage('Enter a valid phone number'),
]

const verifyOtpRules = [
  body('phone')
    .trim()
    .matches(PHONE_REGEX).withMessage('Enter a valid phone number'),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must be numeric'),
  body('name').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('grade').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
]

router.post('/register', registerRules, register)
router.post('/login',    loginRules,    login)
router.get('/me',        authenticate,  me)

router.post('/phone/request-otp', requestOtpRules, requestPhoneOtp)
router.post('/phone/verify-otp',  verifyOtpRules,  verifyPhoneOtp)

module.exports = router
