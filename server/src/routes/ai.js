'use strict'

const { Router } = require('express')
const { body } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const {
  generateLesson,
  getLesson,
  getLessons,
  deleteLesson,
  askDoubt,
  getDoubts,
} = require('../controllers/ai.controller')
const { knowledgeAnswer } = require('../controllers/knowledge.controller')

const router = Router()

// Every AI route requires a valid JWT.
router.use(authenticate)

// ─── Validation rules ─────────────────────────────────────────────────────────

const generateRules = [
  body('topic')
    .trim()
    .notEmpty().withMessage('topic is required')
    .isLength({ max: 200 }).withMessage('topic must be 200 characters or fewer'),
  body('subject')
    .trim()
    .notEmpty().withMessage('subject is required')
    .isLength({ max: 100 }).withMessage('subject must be 100 characters or fewer'),
  body('gradeLevel')
    .trim()
    .notEmpty().withMessage('gradeLevel is required')
    .isLength({ max: 20 }).withMessage('gradeLevel must be 20 characters or fewer'),
]

const doubtRules = [
  body('question')
    .trim()
    .notEmpty().withMessage('question is required')
    .isLength({ max: 1000 }).withMessage('question must be 1000 characters or fewer'),
  body('slideIndex')
    .optional()
    .isInt({ min: 0 }).withMessage('slideIndex must be a non-negative integer')
    .toInt(),
]

const knowledgeAnswerRules = [
  body('question')
    .trim()
    .notEmpty().withMessage('question is required')
    .isLength({ max: 1000 }).withMessage('question must be 1000 characters or fewer'),
  body('topK').optional().isInt({ min: 1, max: 20 }).toInt(),
  body('subject').optional().trim().isLength({ max: 100 }),
  body('gradeLevel').optional().trim().isLength({ max: 20 }),
  body('sourceIds').optional().isArray().withMessage('sourceIds must be an array'),
]

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/lesson/generate',        generateRules, generateLesson)
router.get('/lessons',                               getLessons)
router.get('/lesson/:lessonId',                      getLesson)
router.delete('/lesson/:lessonId',                   deleteLesson)
router.post('/lesson/:lessonId/doubt', doubtRules,   askDoubt)
router.get('/lesson/:lessonId/doubts',               getDoubts)

// RAG grounded answer — any authenticated user.
router.post('/knowledge-answer',       knowledgeAnswerRules, knowledgeAnswer)

module.exports = router
