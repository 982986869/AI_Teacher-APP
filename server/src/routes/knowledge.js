'use strict'

const { Router } = require('express')
const multer = require('multer')
const { body } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const { config } = require('../config/env')
const ApiResponse = require('../utils/ApiResponse')
const {
  uploadKnowledge,
  listSources,
  deleteSource,
  searchKnowledge,
  solvePhoto,
} = require('../controllers/knowledge.controller')

const router = Router()

// In-memory upload (text/markdown only; small files). Size capped by config.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.rag.maxUploadBytes, files: 1 },
})

// Photo-solve gets a roomier limit (a phone photo can exceed the 5 MB doc cap)
// and turns multer's abrupt oversize error into a clean, readable 413 instead of
// a reset connection (which the app would otherwise show as "Network error").
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
})
function handlePhotoUpload(req, res, next) {
  photoUpload.single('file')(req, res, (err) => {
    if (!err) return next()
    const msg = err.code === 'LIMIT_FILE_SIZE'
      ? 'That photo is too large. Try a closer or lower-resolution photo.'
      : 'Could not read the uploaded photo. Please try again.'
    return ApiResponse.error(res, msg, 413)
  })
}

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

// Upload is open to ANY authenticated user (students upload their own material,
// teachers/admins upload shared class material). Accepts multipart (file) OR JSON (text).
router.post('/upload', upload.single('file'), uploadRules, uploadKnowledge)

// Solve a homework question from a photo (multipart image + optional `hint` text).
router.post('/solve-photo', handlePhotoUpload, solvePhoto)

// Read endpoints are open to any authenticated user. Scoping (students see only
// their own uploads; teachers/admins see all) is enforced in the controller.
router.get('/sources', listSources)
router.post('/search', searchRules, searchKnowledge)

// Delete: a user may delete their OWN source; teachers/admins may delete any.
// Ownership is enforced in the controller — no blanket role gate here.
router.delete('/sources/:id', deleteSource)

module.exports = router
