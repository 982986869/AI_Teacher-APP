'use strict'

const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const { getSubtopics, getTest, getChapterTest, submit, getProgress } = require('../controllers/mcqPractice.controller')

const router = Router()

// All MCQ Practice routes require a valid JWT.
router.use(authenticate)

// Subtopics of a chapter (with question counts)
router.get('/:subjectSlug/:chapterSlug/subtopics', getSubtopics)

// Per-user progress for a chapter (each subtopic: answered/total/score)
router.get('/:subjectSlug/:chapterSlug/progress', getProgress)

// Start a test: all questions for a subtopic
router.get('/subtopic/:subtopicId', getTest)

// Chapter-level test: all MCQs of a chapter (across its subtopics)
router.get('/:subjectSlug/:chapterSlug/test', getChapterTest)

// Submit answers → { total, attempted, correct, accuracy, completion, score, results }
router.post('/submit', submit)

module.exports = router
