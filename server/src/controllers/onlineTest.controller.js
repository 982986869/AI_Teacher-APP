'use strict'

const onlineTestService = require('../services/onlineTest.service')
const ApiResponse = require('../utils/ApiResponse')
const { AppError } = require('../middleware/errorHandler')

function parseId(raw, label = 'id') {
  const id = parseInt(raw, 10)
  if (!Number.isInteger(id) || id <= 0) throw new AppError(`Invalid ${label}.`, 400)
  return id
}

// GET /api/online-tests/chapters?subject=Physics
async function listChapters(req, res, next) {
  try {
    const subject = req.query.subject ? String(req.query.subject) : undefined
    const chapters = await onlineTestService.listChapters({ subject })
    return ApiResponse.success(res, { chapters, total: chapters.length })
  } catch (err) { next(err) }
}

// GET /api/online-tests/chapters/:chapterId/tests
async function listTests(req, res, next) {
  try {
    const tests = await onlineTestService.listTestsByChapter(parseId(req.params.chapterId, 'chapter id'))
    return ApiResponse.success(res, { tests, total: tests.length })
  } catch (err) { next(err) }
}

// GET /api/online-tests/tests/:testId/questions
async function getQuestions(req, res, next) {
  try {
    const result = await onlineTestService.getQuestions(parseId(req.params.testId, 'test id'))
    return ApiResponse.success(res, result)
  } catch (err) { next(err) }
}

// POST /api/online-tests/tests/:testId/submit   body: { answers: { [questionId]: <letter> } }
async function submit(req, res, next) {
  try {
    const testId = parseId(req.params.testId, 'test id')
    const answers = (req.body && typeof req.body.answers === 'object' && req.body.answers) || {}
    const result = await onlineTestService.submit({ testId, answers })
    return ApiResponse.success(res, result, 'Submitted')
  } catch (err) { next(err) }
}

module.exports = { listChapters, listTests, getQuestions, submit }
