'use strict'

const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const {
  getSubjects,
  getChapters,
  getSections,
  getQuestions,
  getQuestionsByPath,
} = require('../controllers/resources.controller')
const { getExemplar } = require('../controllers/exemplar.controller')
const { getNcert, getNcertChapters } = require('../controllers/ncert.controller')

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

// ─── Exemplar Solutions (DB-backed; ?subject=&class=&chapter=) ─────────────────
router.get('/exemplar', getExemplar)

// ─── NCERT Solutions Part-I/II (DB-backed; ?part=&subject=&class=&chapter=) ─────
router.get('/ncert/chapters', getNcertChapters)
router.get('/ncert', getNcert)

module.exports = router
