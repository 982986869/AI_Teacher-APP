'use strict'

const { Router } = require('express')
const multer = require('multer')
const { body } = require('express-validator')
const { register, login, googleAuth, me, updateProfile, uploadPhoto, deleteAccount } = require('../controllers/auth.controller')
const { authenticate } = require('../middleware/auth')

const router = Router()
const photoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } })

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

// Every field is optional: this is a PATCH, and three different screens send different
// subsets of it (CompleteProfile sends the class/board/stream set, Edit Profile sends
// the identity set, Learning Preferences sends only learningPrefs).
//
// `email` is deliberately NOT here. It is the login identity and is UNIQUE — letting a
// PATCH move it would need re-verification and a uniqueness-collision path, which is a
// flow of its own. The Edit Profile screen shows it read-only for the same reason.
const profileRules = [
  body('name').optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 80 }),
  body('grade').optional().trim().isLength({ max: 20 }),
  body('board').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  body('stream').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  body('language').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  body('school').optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
  body('accountType').optional().isIn(['student', 'parent', 'teacher']).withMessage('Invalid account type'),
  // A student's own DOB. Date-only (the column is DATE) — an ISO datetime would be
  // accepted by isISO8601 and then silently truncated by Postgres, so pin the format.
  body('dateOfBirth').optional({ checkFalsy: true })
    .isISO8601({ strict: true }).withMessage('Date of birth must be YYYY-MM-DD')
    .isLength({ min: 10, max: 10 }).withMessage('Date of birth must be YYYY-MM-DD'),
  // The parent's contact address. Unrelated to `linked_student_id`, which is the real
  // account link and is set elsewhere — this is just a way to reach the guardian.
  body('parentEmail').optional({ checkFalsy: true }).trim().isEmail().withMessage('Enter a valid parent email')
    .isLength({ max: 160 }).normalizeEmail(),
  // The Learning Preferences screen's answer sheet. Validated for shape here rather
  // than trusted, because it lands in a JSONB column that nothing else type-checks.
  body('learningPrefs').optional().custom((v) => {
    if (v === null) return true                                   // null clears it
    if (typeof v !== 'object' || Array.isArray(v)) throw new Error('Invalid preferences')
    const strList = (x) => Array.isArray(x) && x.length <= 20
      && x.every((s) => typeof s === 'string' && s.length > 0 && s.length <= 60)
    const str = (x) => typeof x === 'string' && x.length <= 60
    if (v.goals !== undefined && !strList(v.goals)) throw new Error('Invalid learning goals')
    if (v.subjects !== undefined && !strList(v.subjects)) throw new Error('Invalid favourite subjects')
    if (v.style !== undefined && v.style !== null && !str(v.style)) throw new Error('Invalid learning style')
    if (v.difficulty !== undefined && v.difficulty !== null && !str(v.difficulty)) throw new Error('Invalid difficulty')
    return true
  }),
]

const googleRules = [
  body('idToken')
    .trim()
    .notEmpty().withMessage('Google idToken is required'),
]

router.post('/register', registerRules, register)
router.post('/login',    loginRules,    login)
router.post('/google',   googleRules,   googleAuth)
router.get('/me',        authenticate,  me)
router.patch('/profile', authenticate,  profileRules, updateProfile)
router.post('/photo',    authenticate,  photoUpload.single('file'), uploadPhoto)
// Account deletion. DELETE on /me because it acts on the caller and nobody else —
// there is no :id form, so one student can never delete another's account.
router.delete('/me',     authenticate,  deleteAccount)

module.exports = router
