'use strict'

const ApiResponse = require('../utils/ApiResponse')
const svc = require('../services/resources.service')
const { resolveClassNum } = require('../services/personalization/enforce')
const { isAllowedSubject } = require('../services/personalization/subjects')

// Authoritative class — the student's own class overrides any ?class= param.
const classOf = (req) => resolveClassNum(req)

async function getSubjects(req, res, next) {
  try {
    const all = await svc.listSubjects()
    // Students only see the subjects in their syllabus (class + stream).
    const sc = req.scope
    const list = (sc && sc.role === 'student' && sc.classNum && Array.isArray(all))
      ? all.filter((s) => isAllowedSubject(s.name || s.title || s, sc.classNum, sc.stream))
      : all
    return ApiResponse.success(res, list)
  } catch (err) { next(err) }
}

async function getChapters(req, res, next) {
  try {
    const data = await svc.listChapters(req.params.subjectSlug, req.query.section, classOf(req))
    if (!data) return ApiResponse.error(res, 'Subject not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

async function getSections(req, res, next) {
  try {
    return ApiResponse.success(res, await svc.listSections(req.params.chapterId))
  } catch (err) { next(err) }
}

async function getQuestions(req, res, next) {
  try {
    return ApiResponse.success(res, await svc.listQuestions(req.params.sectionId))
  } catch (err) { next(err) }
}

async function getQuestionsByPath(req, res, next) {
  try {
    const { subjectSlug, chapterSlug, sectionType } = req.params
    const data = await svc.getQuestionsByPath(subjectSlug, chapterSlug, sectionType, classOf(req))
    if (!data) return ApiResponse.error(res, 'Section not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

async function getNotesByPath(req, res, next) {
  try {
    const { subjectSlug, chapterSlug } = req.params
    const data = await svc.getNotesByPath(subjectSlug, chapterSlug, classOf(req))
    if (!data) return ApiResponse.error(res, 'Notes not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

async function getMcqByPath(req, res, next) {
  try {
    const { subjectSlug, chapterSlug } = req.params
    const data = await svc.getMcqByPath(subjectSlug, chapterSlug, classOf(req))
    if (!data) return ApiResponse.error(res, 'Chapter not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

// GET /api/resources/papers/:subjectSlug?class=12  → [{ code, year, setLabel, name }]
async function listPapers(req, res, next) {
  try {
    return ApiResponse.success(res, await svc.listPapers(req.params.subjectSlug, classOf(req)))
  } catch (err) { next(err) }
}

// GET /api/resources/paper/:subjectSlug?class=12&code=55/1/1&year=2020 → one paper
// code is a query param so its slashes don't break route matching. `year`
// disambiguates the code (CBSE reuses it across years); omit → latest year.
async function getPaper(req, res, next) {
  try {
    const data = await svc.getPaper(req.params.subjectSlug, classOf(req), {
      extUid: req.query.extUid || req.query.ext_uid,
      code: req.query.code,
      year: req.query.year,
    })
    if (!data) return ApiResponse.error(res, 'Paper not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

// POST /api/resources/papers/:subjectSlug?class=12&replace=true
// Body: { papers: [ ...rawExtractionJson | mappedPaper ] } (or a bare array).
// `replace=true` wipes existing papers for the subject+class before inserting.
async function importPapers(req, res, next) {
  try {
    const papers = Array.isArray(req.body) ? req.body : req.body?.papers
    if (!Array.isArray(papers) || papers.length === 0) {
      return ApiResponse.error(res, 'Body must include a non-empty `papers` array', 400)
    }
    const replace = req.query.replace === 'true' || req.query.replace === '1'
    const result = await svc.upsertPapers(req.params.subjectSlug, classOf(req), papers, { replace })
    if (!result) return ApiResponse.error(res, 'Subject not found', 404)
    return ApiResponse.success(res, result, 'Papers imported', 201)
  } catch (err) { next(err) }
}

// DELETE /api/resources/papers/:subjectSlug?class=12[&code=56/1/1&year=2019]
// Without code → deletes ALL papers for the subject+class.
async function deletePapers(req, res, next) {
  try {
    const result = await svc.deletePapers(req.params.subjectSlug, classOf(req), {
      extUid: req.query.extUid || req.query.ext_uid,
      code: req.query.code,
      year: req.query.year,
    })
    if (!result) return ApiResponse.error(res, 'Subject not found', 404)
    return ApiResponse.success(res, result, 'Papers deleted')
  } catch (err) { next(err) }
}

// GET /api/resources/classes → { classes: ['Class 6','Class 11','Class 12'] }
// Which classes currently have content — the app uses this instead of a hardcoded
// list, so adding content to the DB automatically unlocks that class.
async function getClasses(req, res, next) {
  try {
    const classes = await svc.listContentClasses()
    return ApiResponse.success(res, { classes })
  } catch (err) { next(err) }
}

module.exports = { getSubjects, getChapters, getSections, getQuestions, getQuestionsByPath, getNotesByPath, listPapers, getPaper, importPapers, deletePapers, getMcqByPath, getClasses }
