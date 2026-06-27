'use strict'

const { Router } = require('express')
const { body } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const {
  submitResult, getProgress, getLeaderboard, getQuestions, submitAttempts,
  getAdaptiveQuestions, submitAdaptive, recommend,
} = require('../controllers/braingym.controller')

const router = Router()

// Every Brain Gym route requires a valid JWT.
router.use(authenticate)

const resultRules = [
  body('skill').optional().isString(),
  body('level').isInt({ min: 1, max: 3 }).withMessage('level must be 1-3').toInt(),
  body('totalQuestions').isInt({ min: 1, max: 50 }).withMessage('totalQuestions is invalid').toInt(),
  body('correctCount').isInt({ min: 0, max: 50 }).withMessage('correctCount is invalid').toInt(),
  body('wrongCount').optional().isInt({ min: 0, max: 50 }).toInt(),
  body('timeTakenSec').optional().isInt({ min: 0, max: 36000 }).toInt(),
]

const questionRules = [
  body('skill').optional().isString(),
  body('category').optional().isString(),
  body('count').optional().isInt({ min: 1, max: 20 }).toInt(),
]

const attemptsRules = [
  body('items').isArray({ min: 1, max: 50 }).withMessage('items must be a non-empty array'),
  body('sessionId').optional().isUUID(),
]

const adaptiveSubmitRules = [
  body('category').optional().isString(),
  body('skill').optional().isString(),
  body('items').optional().isArray({ max: 50 }),
  body('questions').optional().isArray({ max: 50 }),
  body('answers').optional().isArray({ max: 50 }),
  body('timeMs').optional().isInt({ min: 0, max: 3600000 }).toInt(),
]

router.post('/results', resultRules, submitResult)
router.post('/questions', questionRules, getQuestions)   // adaptive retrieval (POST alias)
router.post('/attempts', attemptsRules, submitAttempts)  // per-question attempt logging
router.get('/progress', getProgress)
router.get('/leaderboard', getLeaderboard)

// Spec-named adaptive endpoints (reuse the same pipeline/mastery services).
router.get('/adaptive/questions', getAdaptiveQuestions)
router.post('/adaptive/submit', adaptiveSubmitRules, submitAdaptive)

// AI Teacher ↔ BrainGym: post-lesson practice recommendation.
router.get('/recommend', recommend)

module.exports = router
