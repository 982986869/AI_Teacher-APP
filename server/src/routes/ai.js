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
  ask,
  askStream,
  startRevision,
  updateProgress,
  getProgress,
  getLessonsProgress,
  getChaptersProgress,
  recordMemory,
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
  body('pending').optional().isObject(),
]

const progressRules = [
  body('slideIndex').isInt({ min: 0 }).withMessage('slideIndex required').toInt(),
  body('total').optional().isInt({ min: 0 }).toInt(),
  body('studyTimeSeconds').optional().isInt({ min: 0, max: 3600 }).toInt(),
  body('concept').optional().isString().isLength({ max: 200 }),
]

// ─── Routes ───────────────────────────────────────────────────────────────────

const memoryRules = [
  body('type').isIn(['doubt', 'mistake', 'quiz']).withMessage('type must be doubt|mistake|quiz'),
  body('subject').optional().isLength({ max: 100 }),
  body('chapter').optional().isLength({ max: 200 }),
  body('detail').optional().isObject(),
]

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
router.get('/lesson/:lessonId/progress',               getProgress)
router.get('/lessons/progress',                      getLessonsProgress)
router.get('/lessons',                               getLessons)
router.get('/lesson/:lessonId',                      getLesson)
router.delete('/lesson/:lessonId',                   deleteLesson)
router.post('/lesson/:lessonId/doubt', doubtRules,   askDoubt)
router.get('/lesson/:lessonId/doubts',               getDoubts)

// Browse the admin-authored, PUBLISHED lesson catalog (Subjects → Chapters → Lessons → play).
const catalog = require('../controllers/aiCatalogStudent.controller')
router.get('/catalog/resume',                         catalog.resume)
router.get('/catalog/subjects',                       catalog.subjects)
router.get('/catalog/subjects/:subjectId/chapters',   catalog.chapters)
router.get('/catalog/chapters/:chapterId/lessons',    catalog.lessons)
router.get('/catalog/lessons/:id',                    catalog.lesson)

module.exports = router
