'use strict'

const { Router } = require('express')
const multer = require('multer')
const { body } = require('express-validator')
const { register, login, googleAuth, me, updateProfile, uploadPhoto, deleteAccount } = require('../controllers/auth.controller')
const { authenticate } = require('../middleware/auth')
const rateLimit = require('express-rate-limit')
const ApiResponse = require('../utils/ApiResponse')
const reactivation = require('../controllers/reactivation.controller')

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

// normalizeEmail() on both, matching registerRules and loginRules above. Without it a
// student who signed up as "First.Last@gmail.com" — stored dot-stripped — would type
// the address they remember and never be found by the lookup here.
const reactivateRequestRules = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
]

const reactivateConfirmRules = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('code')
    .trim()
    .matches(/^[0-9]{6}$/).withMessage('Enter the 6-digit code from your email'),
]

// ─── Rate limits ─────────────────────────────────────────────────────────────
//
// These two endpoints are unauthenticated and both cost something real: one sends mail
// to an address the caller chose, the other guesses at a six-digit code. Nothing else
// on this server is limited yet, so these limiters are deliberately local to the two
// routes rather than global — this is not the place to start rate-limiting sign-in.

const limited = (windowMs, limit, message) => rateLimit({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  // The default handler answers in plain text, which every other error on this server
  // does not — the app parses JSON and would show a blank message.
  handler: (req, res) => ApiResponse.error(res, message, 429),
})

// Five an hour per address is far more than a real person needs (the mail arrives on
// the first) and far too few to flood someone's inbox with.
const requestLimit = limited(
  60 * 60 * 1000, 5,
  'Too many restore emails requested. Please try again in an hour.',
)

// The per-token attempt counter is the real bound on guessing a code; this only stops
// someone burning through freshly issued tokens quickly.
const confirmLimit = limited(
  15 * 60 * 1000, 10,
  'Too many attempts. Please try again in a few minutes.',
)

router.post('/register', registerRules, register)
router.post('/login',    loginRules,    login)
router.post('/google',   googleRules,   googleAuth)
router.get('/me',        authenticate,  me)
router.patch('/profile', authenticate,  profileRules, updateProfile)
router.post('/photo',    authenticate,  photoUpload.single('file'), uploadPhoto)
// Account deletion. DELETE on /me because it acts on the caller and nobody else —
// there is no :id form, so one student can never delete another's account.
router.delete('/me',     authenticate,  deleteAccount)

// Undoing that deletion, within the grace period. All three are deliberately public:
// the whole point is that the caller cannot sign in, so requiring a token would make
// them unreachable.
router.post('/reactivate/request', requestLimit, reactivateRequestRules, reactivation.request)
router.post('/reactivate/confirm', confirmLimit, reactivateConfirmRules, reactivation.confirmByCode)
// GET, because this one is opened from a link in an email. It answers with a page.
router.get('/reactivate',          confirmLimit, reactivation.confirmByLink)

module.exports = router
