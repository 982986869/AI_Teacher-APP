'use strict'

const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const {
  getSubjects,
  getChapters,
  getSections,
  getQuestions,
  getQuestionsByPath,
  getMcqByPath,
} = require('../controllers/resources.controller')

const router = Router()

// All resources routes require a valid JWT.
router.use(authenticate)

// ─── Granular (REST) ──────────────────────────────────────────────────────────
router.get('/subjects',                          getSubjects)
router.get('/subjects/:subjectSlug/chapters',    getChapters)
router.get('/chapters/:chapterId/sections',      getSections)
router.get('/sections/:sectionId/questions',     getQuestions)

// ─── Convenience: questions straight from slugs (matches the UI flow) ──────────
router.get('/content/:subjectSlug/:chapterSlug/:sectionType', getQuestionsByPath)

// ─── MCQ Practice: all MCQs for a chapter, ready for the test screen ───────────
router.get('/mcq/:subjectSlug/:chapterSlug', getMcqByPath)

module.exports = router
