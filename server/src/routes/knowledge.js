'use strict'

const { Router } = require('express')
const multer = require('multer')
const { body } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const { config } = require('../config/env')
const {
  uploadKnowledge,
  listSources,
  searchKnowledge,
} = require('../controllers/knowledge.controller')

const router = Router()

// In-memory upload (text/markdown only; small files). Size capped by config.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.rag.maxUploadBytes, files: 1 },
})

// Every knowledge route requires a valid JWT.
router.use(authenticate)

// ─── Validation rules ─────────────────────────────────────────────────────────

const uploadRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('title is required')
    .isLength({ max: 200 }).withMessage('title must be 200 characters or fewer'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('subject').optional().trim().isLength({ max: 100 }),
  body('gradeLevel').optional().trim().isLength({ max: 20 }),
  body('text').optional().isString(),
]

const searchRules = [
  body('query')
    .trim()
    .notEmpty().withMessage('query is required')
    .isLength({ max: 1000 }).withMessage('query must be 1000 characters or fewer'),
  body('topK').optional().isInt({ min: 1, max: 20 }).toInt(),
  body('subject').optional().trim().isLength({ max: 100 }),
  body('gradeLevel').optional().trim().isLength({ max: 20 }),
  body('sourceIds').optional().isArray().withMessage('sourceIds must be an array'),
]

// ─── Routes ───────────────────────────────────────────────────────────────────

// Upload is restricted to teachers/admins. Accepts multipart (file) OR JSON (text).
router.post('/upload', requireRole('TEACHER', 'ADMIN'), upload.single('file'), uploadRules, uploadKnowledge)

// Read endpoints are open to any authenticated user.
router.get('/sources', listSources)
router.post('/search', searchRules, searchKnowledge)

module.exports = router
