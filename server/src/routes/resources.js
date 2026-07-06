'use strict'

const { Router } = require('express')
const { authenticate, requireAdmin } = require('../middleware/auth')
const {
  getSubjects,
  getClassSubjects,
  getChapters,
  getSections,
  getQuestions,
  getQuestionsByPath,
  getNotesByPath,
  listPapers,
  getPaper,
  importPapers,
  deletePapers,
  getMcqByPath,
  getClasses,
} = require('../controllers/resources.controller')
const { getExemplar } = require('../controllers/exemplar.controller')
const { getNcert, getNcertChapters } = require('../controllers/ncert.controller')

const router = Router()

// All resources routes require a valid JWT.
router.use(authenticate)

// ─── Which classes have content (drives the "ready vs coming-soon" gate) ───────
router.get('/classes',                           getClasses)

// ─── Subjects available for a class + their feature flags (DB-derived) ─────────
router.get('/class-subjects',                    getClassSubjects)

// ─── Granular (REST) ──────────────────────────────────────────────────────────
router.get('/subjects',                          getSubjects)
router.get('/subjects/:subjectSlug/chapters',    getChapters)
router.get('/chapters/:chapterId/sections',      getSections)
router.get('/sections/:sectionId/questions',     getQuestions)

// ─── Convenience: questions straight from slugs (matches the UI flow) ──────────
router.get('/content/:subjectSlug/:chapterSlug/:sectionType', getQuestionsByPath)

// ─── Revision Notes for a chapter (notes table; ?class=) ───────────────────────
router.get('/notes/:subjectSlug/:chapterSlug', getNotesByPath)

// ─── MCQ Practice: all MCQs for a chapter, ready for the test screen ───────────
router.get('/mcq/:subjectSlug/:chapterSlug', getMcqByPath)

// ─── Last Year Papers (papers table; ?class=) ──────────────────────────────────
router.get('/papers/:subjectSlug', listPapers)            // list (metadata)
router.get('/paper/:subjectSlug', getPaper)               // one paper: ?code=55/1/1

// ─── Last Year Papers: admin write/delete (ADMIN role only) ────────────────────
// POST   /papers/:subjectSlug?class=12&replace=true   bulk import/upsert
// DELETE /papers/:subjectSlug?class=12[&code=&year=]   delete all / one
router.post('/papers/:subjectSlug',   requireAdmin, importPapers)
router.delete('/papers/:subjectSlug', requireAdmin, deletePapers)

// ─── Exemplar / NCERT (DEPRECATED) ─────────────────────────────────────────────
// These read the legacy standalone tables (exemplar_solutions / ncert_solutions),
// which only ever held Class 11. Exemplar/NCERT are now consolidated into the
// section model for ALL classes — use the generic content endpoints instead:
//   /content/:subjectSlug/:chapterSlug/exemplar_notes?class=
//   /content/:subjectSlug/:chapterSlug/ncert1?class=   (and ncert2)
// Kept here only for backward-compatibility; remove once no client calls them.
router.get('/exemplar', getExemplar)
router.get('/ncert/chapters', getNcertChapters)
router.get('/ncert', getNcert)

module.exports = router
