'use strict'

const { Router } = require('express')
const { body } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const { submitResult, getProgress, getLeaderboard } = require('../controllers/braingym.controller')

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

router.post('/results', resultRules, submitResult)
router.get('/progress', getProgress)
router.get('/leaderboard', getLeaderboard)

module.exports = router
