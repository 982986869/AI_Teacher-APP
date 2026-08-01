'use strict'

const { Router } = require('express')
const { body } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const {
  knowledgeAnswer,
  knowledgeAnswerStructured,
  knowledgeAnswerExtend,
  knowledgeAnswerStream,
} = require('../controllers/knowledge.controller')
const {
  generateLesson,
  getLesson,
  getLessons,
  deleteLesson,
  askDoubt,
  getDoubts,
  ask,
  askStream,
  startRevision,
  updateProgress,
  getProgress,
  getLessonsProgress,
  getChaptersProgress,
  recordMemory,
  recordCheck,
  getMemorySummary,
  getPlan,
  getResume,
} = require('../controllers/ai.controller')

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

const askRules = [
  body('text')
    .trim()
    .notEmpty().withMessage('text is required')
    .isLength({ max: 1000 }).withMessage('text must be 1000 characters or fewer'),
  body('subject').optional().isLength({ max: 100 }),
  body('gradeLevel').optional().isLength({ max: 20 }),
  body('lessonId').optional().isString(),
  body('slideIndex').optional().isInt({ min: 0 }).toInt(),
  body('history').optional().isArray({ max: 20 }).withMessage('history must be an array'),
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('invalid level'),
  body('mode').optional().isString().isLength({ max: 40 }),
  body('pending').optional().isObject(),
]

const progressRules = [
  body('slideIndex').isInt({ min: 0 }).withMessage('slideIndex required').toInt(),
  body('total').optional().isInt({ min: 0 }).toInt(),
  body('studyTimeSeconds').optional().isInt({ min: 0, max: 3600 }).toInt(),
  body('concept').optional().isString().isLength({ max: 200 }),
]

const checkRules = [
  body('slideIndex').isInt({ min: 0 }).withMessage('slideIndex required').toInt(),
  body('correct').isBoolean().withMessage('correct must be a boolean').toBoolean(),
  body('concept').optional().isString().isLength({ max: 200 }),
  body('conceptId').optional().isUUID().withMessage('conceptId must be a UUID'),
  body('firstTry').optional().isBoolean().toBoolean(),
  body('timeMs').optional().isInt({ min: 0, max: 600000 }).toInt(),
]

// ─── Routes ───────────────────────────────────────────────────────────────────

const memoryRules = [
  body('type').isIn(['doubt', 'mistake', 'quiz']).withMessage('type must be doubt|mistake|quiz'),
  body('subject').optional().isLength({ max: 100 }),
  body('chapter').optional().isLength({ max: 200 }),
  body('detail').optional().isObject(),
]

// Grounded RAG answer over the student's / teacher's uploaded material. The app
// calls this from the "Ask the Material" screen.
const knowledgeAnswerRules = [
  body('question')
    .trim()
    .notEmpty().withMessage('question is required')
    .isLength({ max: 1000 }).withMessage('question must be 1000 characters or fewer'),
  body('subject').optional().trim().isLength({ max: 100 }),
  body('gradeLevel').optional().trim().isLength({ max: 20 }),
  body('topK').optional().isInt({ min: 1, max: 20 }).toInt(),
  body('sourceIds').optional().isArray().withMessage('sourceIds must be an array'),
  // Prior chat turns, so the AI can ask + resolve clarifying questions.
  body('history').optional().isArray({ max: 20 }).withMessage('history must be an array'),
]

// Extend adds an optional gapKind that steers the general-knowledge task.
const knowledgeExtendRules = [
  ...knowledgeAnswerRules,
  body('gapKind').optional().trim().isIn(['example', 'solution', 'origin'])
    .withMessage('gapKind must be example, solution, or origin'),
]

router.post('/knowledge-answer',            knowledgeAnswerRules, knowledgeAnswer)
router.post('/knowledge-answer/structured', knowledgeAnswerRules, knowledgeAnswerStructured)
router.post('/knowledge-answer/extend',     knowledgeExtendRules, knowledgeAnswerExtend)
router.post('/knowledge-answer/stream',     knowledgeAnswerRules, knowledgeAnswerStream)
router.post('/ask',                    askRules,     ask)
router.post('/ask/stream',             askRules,     askStream)
router.post('/revision',                             startRevision)
router.post('/memory/event',           memoryRules,  recordMemory)
router.get('/memory/summary',                        getMemorySummary)
router.get('/plan',                                  getPlan)
router.get('/chapters/progress',                     getChaptersProgress)
router.get('/session/resume',                        getResume)
router.post('/lesson/generate',        generateRules, generateLesson)
router.post('/lesson/:lessonId/progress', progressRules, updateProgress)
router.post('/lesson/:lessonId/check',    checkRules,   recordCheck)
router.get('/lesson/:lessonId/progress',               getProgress)
router.get('/lessons/progress',                      getLessonsProgress)
router.get('/lessons',                               getLessons)
router.get('/lesson/:lessonId',                      getLesson)
router.delete('/lesson/:lessonId',                   deleteLesson)
router.post('/lesson/:lessonId/doubt', doubtRules,   askDoubt)
router.get('/lesson/:lessonId/doubts',               getDoubts)

module.exports = router
