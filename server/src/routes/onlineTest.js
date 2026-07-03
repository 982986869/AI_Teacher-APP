'use strict'

const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const { getChapters, getTests, getTest } = require('../controllers/onlineTest.controller')

const router = Router()

// All online-test routes require a valid JWT.
router.use(authenticate)

// Chapters of a subject that have online tests (with per-chapter test counts)
router.get('/:subjectSlug/chapters', getChapters)

// Tests within a chapter: [{ id, name, durationMin, questionCount, totalMarks }]
router.get('/:subjectSlug/:chapterSlug/tests', getTests)

// Full test: { name, instructionHtml, durationMin, questions:[…] }
router.get('/test/:testId', getTest)

module.exports = router
