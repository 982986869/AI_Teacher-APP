'use strict'

const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const { getSubtopics, getTest, submit } = require('../controllers/mcqPractice.controller')

const router = Router()

// All MCQ Practice routes require a valid JWT.
router.use(authenticate)

// Subtopics of a chapter (with question counts)
router.get('/:subjectSlug/:chapterSlug/subtopics', getSubtopics)

// Start a test: all questions for a subtopic
router.get('/subtopic/:subtopicId', getTest)

// Submit answers → { total, attempted, correct, accuracy, completion, score, results }
router.post('/submit', submit)

module.exports = router
