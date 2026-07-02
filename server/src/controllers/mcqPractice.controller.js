'use strict'

const ApiResponse = require('../utils/ApiResponse')
const svc = require('../services/mcqPractice.service')
const { resolveClassNum, assertSubjectAllowed } = require('../services/personalization/enforce')

// Authoritative class — the student's own class overrides any ?class= param.
const classOf = (req) => resolveClassNum(req)
const deslug = (s) => String(s || '').replace(/-/g, ' ')
const guardSubject = (req) => assertSubjectAllowed(req, deslug(req.params.subjectSlug))

async function getChaptersWithContent(req, res, next) {
  try {
    const data = await svc.listChaptersWithContent(req.params.subjectSlug, classOf(req))
    if (!data) return ApiResponse.error(res, 'Subject not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

async function getSubtopics(req, res, next) {
  try {
    guardSubject(req)
    const data = await svc.listSubtopics(req.params.subjectSlug, req.params.chapterSlug, classOf(req))
    if (!data) return ApiResponse.error(res, 'Chapter not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) {
    if (err.status) return ApiResponse.error(res, err.message, err.status)
    next(err)
  }
}

async function getTest(req, res, next) {
  try {
    const data = await svc.getSubtopicTest(req.params.subtopicId)
    if (!data) return ApiResponse.error(res, 'Subtopic not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

async function getChapterTest(req, res, next) {
  try {
    const data = await svc.getChapterTest(req.params.subjectSlug, req.params.chapterSlug, classOf(req))
    if (!data) return ApiResponse.error(res, 'Chapter not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

async function submit(req, res, next) {
  try {
    if (req.scope && req.scope.role !== 'student') return ApiResponse.error(res, 'Only students can attempt this.', 403)
    const { subtopicId, answers } = req.body
    if (!subtopicId) return ApiResponse.error(res, 'subtopicId is required', 422)
    const data = await svc.submitTest(req.user.id, subtopicId, answers)
    if (!data) return ApiResponse.error(res, 'Subtopic not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

async function getProgress(req, res, next) {
  try {
    const { subjectSlug, chapterSlug } = req.params
    const data = await svc.getProgress(subjectSlug, chapterSlug, req.user.id, classOf(req))
    if (!data) return ApiResponse.error(res, 'Chapter not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

module.exports = { getChaptersWithContent, getSubtopics, getTest, getChapterTest, submit, getProgress }
