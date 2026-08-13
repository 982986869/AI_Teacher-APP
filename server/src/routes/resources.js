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
  getChapterProgress,
  setQuestionProgress,
  setQuestionBookmark,
  listBookmarks,
  getNotesByPath,
  listPapers,
  getPaper,
  importPapers,
  deletePapers,
  getMcqByPath,
  getClasses,
  getResourceMenu,
} = require('../controllers/resources.controller')
const { getExemplar } = require('../controllers/exemplar.controller')
const { getNcert, getNcertChapters } = require('../controllers/ncert.controller')

const router = Router()

// All resources routes require a valid JWT.
router.use(authenticate)

// â”€â”€â”€ Which classes have content (drives the "ready vs coming-soon" gate) â”€â”€â”€â”€â”€â”€â”€
router.get('/classes',                           getClasses)
// â”€â”€â”€ DB-derived subject grid (Class 9 feature flags + Class 10) + Class 10 tabs â”€
router.get('/class-subjects',                    getClassSubjects)
router.get('/menu/:subjectSlug',                 getResourceMenu)

// â”€â”€â”€ Granular (REST) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/subjects',                          getSubjects)
router.get('/subjects/:subjectSlug/chapters',    getChapters)
router.get('/chapters/:chapterId/sections',      getSections)
router.get('/sections/:sectionId/questions',     getQuestions)

// â”€â”€â”€ Convenience: questions straight from slugs (matches the UI flow) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/content/:subjectSlug/:chapterSlug/:sectionType', getQuestionsByPath)

// â”€â”€â”€ Revision Notes for a chapter (notes table; ?class=) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€â”€ Per-student chapter progress (drives the chapter screen's real numbers) â”€â”€â”€
router.get('/progress/:subjectSlug/:chapterSlug/:sectionType', getChapterProgress)
router.post('/questions/:questionId/progress',                setQuestionProgress)
router.post('/questions/:questionId/bookmark',                setQuestionBookmark)
router.get('/bookmarks',                                      listBookmarks)

router.get('/notes/:subjectSlug/:chapterSlug', getNotesByPath)

// â”€â”€â”€ MCQ Practice: all MCQs for a chapter, ready for the test screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/mcq/:subjectSlug/:chapterSlug', getMcqByPath)

// â”€â”€â”€ Last Year Papers (papers table; ?class=) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/papers/:subjectSlug', listPapers)            // list (metadata)
router.get('/paper/:subjectSlug', getPaper)               // one paper: ?code=55/1/1

// â”€â”€â”€ Last Year Papers: admin write/delete (ADMIN role only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST   /papers/:subjectSlug?class=12&replace=true   bulk import/upsert
// DELETE /papers/:subjectSlug?class=12[&code=&year=]   delete all / one
router.post('/papers/:subjectSlug',   requireAdmin, importPapers)
router.delete('/papers/:subjectSlug', requireAdmin, deletePapers)

// â”€â”€â”€ Exemplar / NCERT (DEPRECATED) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// These read the legacy standalone tables (exemplar_solutions / ncert_solutions),
// which only ever held Class 11. Exemplar/NCERT are now consolidated into the
// section model for ALL classes â€” use the generic content endpoints instead:
//   /content/:subjectSlug/:chapterSlug/exemplar_notes?class=
//   /content/:subjectSlug/:chapterSlug/ncert1?class=   (and ncert2)
// Kept here only for backward-compatibility; remove once no client calls them.
router.get('/exemplar', getExemplar)
router.get('/ncert/chapters', getNcertChapters)
router.get('/ncert', getNcert)

module.exports = router

