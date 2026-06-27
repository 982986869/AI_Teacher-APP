'use strict'

const mockTestService = require('../services/mockTest.service')
const ApiResponse = require('../utils/ApiResponse')
const { AppError } = require('../middleware/errorHandler')

function parseId(raw) {
  const id = parseInt(raw, 10)
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Invalid mock test id.', 400)
  return id
}

// Class/grade from ?class=12 (9–12). Defaults to 11 for back-compat.
const classOf = (req) => parseInt(req.query.class, 10) || 11

// GET /api/mock-tests?subject=Physics&class=12
async function listTests(req, res, next) {
  try {
    const subject = req.query.subject ? String(req.query.subject) : undefined
    const tests = await mockTestService.listTests({ subject, classLevel: classOf(req) })
    return ApiResponse.success(res, { tests, total: tests.length })
  } catch (err) { next(err) }
}

// GET /api/mock-tests/attempts?subject=Physics&class=12  → per-test best-score summary
async function getAttempts(req, res, next) {
  try {
    const subject = req.query.subject ? String(req.query.subject) : undefined
    const attempts = await mockTestService.listAttempts({ subject, userId: req.user && req.user.id, classLevel: classOf(req) })
    return ApiResponse.success(res, { attempts })
  } catch (err) { next(err) }
}

// GET /api/mock-tests/:id
async function getTest(req, res, next) {
  try {
    const test = await mockTestService.getTest(parseId(req.params.id))
    return ApiResponse.success(res, { test })
  } catch (err) { next(err) }
}

// GET /api/mock-tests/:id/questions
async function getQuestions(req, res, next) {
  try {
    const result = await mockTestService.getQuestions(parseId(req.params.id))
    return ApiResponse.success(res, result)
  } catch (err) { next(err) }
}

// POST /api/mock-tests/:id/submit   body: { answers: { [questionId]: selectedIndex }, timeTakenSec }
async function submit(req, res, next) {
  try {
    const id = parseId(req.params.id)
    const answers = (req.body && typeof req.body.answers === 'object' && req.body.answers) || {}
    const timeTakenSec = Number(req.body && req.body.timeTakenSec) || 0
    const result = await mockTestService.submit({ id, userId: req.user && req.user.id, answers, timeTakenSec })
    return ApiResponse.success(res, result, 'Submitted')
  } catch (err) { next(err) }
}

module.exports = { listTests, getAttempts, getTest, getQuestions, submit }
