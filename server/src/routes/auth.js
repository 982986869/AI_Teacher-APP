'use strict'

const { Router } = require('express')
const { body } = require('express-validator')
const { register, login, me, updateProfile } = require('../controllers/auth.controller')
const { authenticate } = require('../middleware/auth')

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

const profileRules = [
  body('grade').optional().trim().isLength({ max: 20 }),
  body('board').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  body('stream').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  body('language').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  body('school').optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
  body('accountType').optional().isIn(['student', 'parent', 'teacher']).withMessage('Invalid account type'),
]

router.post('/register', registerRules, register)
router.post('/login',    loginRules,    login)
router.get('/me',        authenticate,  me)
router.patch('/profile', authenticate,  profileRules, updateProfile)

module.exports = router
