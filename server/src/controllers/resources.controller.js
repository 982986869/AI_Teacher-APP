'use strict'

const ApiResponse = require('../utils/ApiResponse')
const svc = require('../services/resources.service')

async function getSubjects(req, res, next) {
  try {
    return ApiResponse.success(res, await svc.listSubjects())
  } catch (err) { next(err) }
}

async function getChapters(req, res, next) {
  try {
    const data = await svc.listChapters(req.params.subjectSlug)
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
    const data = await svc.getQuestionsByPath(subjectSlug, chapterSlug, sectionType)
    if (!data) return ApiResponse.error(res, 'Section not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

module.exports = { getSubjects, getChapters, getSections, getQuestions, getQuestionsByPath }
