'use strict'

const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const { listChapters, listTests, getQuestions, submit } = require('../controllers/onlineTest.controller')

const router = Router()

// All online-test routes require a valid JWT (consistent with mock tests).
router.use(authenticate)

router.get('/chapters', listChapters)                       // /api/online-tests/chapters?subject=Physics
router.get('/chapters/:chapterId/tests', listTests)         // /api/online-tests/chapters/:chapterId/tests
router.get('/tests/:testId/questions', getQuestions)        // /api/online-tests/tests/:testId/questions
router.post('/tests/:testId/submit', submit)                // /api/online-tests/tests/:testId/submit

module.exports = router
