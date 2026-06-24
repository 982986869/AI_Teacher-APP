'use strict'

const ApiResponse = require('../utils/ApiResponse')
const svc = require('../services/mcqPractice.service')

async function getSubtopics(req, res, next) {
  try {
    const data = await svc.listSubtopics(req.params.subjectSlug, req.params.chapterSlug)
    if (!data) return ApiResponse.error(res, 'Chapter not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
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
    const data = await svc.getChapterTest(req.params.subjectSlug, req.params.chapterSlug)
    if (!data) return ApiResponse.error(res, 'Chapter not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

async function submit(req, res, next) {
  try {
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
    const data = await svc.getProgress(subjectSlug, chapterSlug, req.user.id)
    if (!data) return ApiResponse.error(res, 'Chapter not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

module.exports = { getSubtopics, getTest, getChapterTest, submit, getProgress }
