'use strict'

const mockTestService = require('../services/mockTest.service')
const ApiResponse = require('../utils/ApiResponse')
const { AppError } = require('../middleware/errorHandler')
const { resolveClassNum, assertSubjectAllowed } = require('../services/personalization/enforce')
const { isAllowedSubject } = require('../services/personalization/subjects')

function parseId(raw) {
  const id = parseInt(raw, 10)
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Invalid mock test id.', 400)
  return id
}

// Authoritative class — the student's own saved class (from JWT). Never a ?class= param.
const classOf = (req) => resolveClassNum(req)

// A student may only open/attempt a test that belongs to their own class + syllabus.
// Prevents fetching another class's test by guessing its id. Non-students fall through
// to the assertStudent checks on write paths.
async function assertTestInScope(req, id) {
  const meta = await mockTestService.getTestMeta(id)
  if (!meta) throw new AppError('Mock test not found.', 404)
  if (req.scope && req.scope.role === 'student') {
    const cls = classOf(req)
    if (!cls || Number(meta.classLevel) !== Number(cls)) {
      throw new AppError('This test is not available for your class.', 403)
    }
    if (meta.subject && !isAllowedSubject(meta.subject, req.scope.classNum, req.scope.stream)) {
      throw new AppError('This test is not part of your syllabus.', 403)
    }
  }
  return meta
}

// GET /api/mock-tests?subject=Physics&class=12
async function listTests(req, res, next) {
  try {
    const subject = req.query.subject ? String(req.query.subject) : undefined
    if (subject) assertSubjectAllowed(req, subject) // PCM student can't list Biology tests
    const tests = await mockTestService.listTests({ subject, classLevel: classOf(req) })
    return ApiResponse.success(res, { tests, total: tests.length })
  } catch (err) {
    if (err.status) return ApiResponse.error(res, err.message, err.status)
    next(err)
  }
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
    const id = parseId(req.params.id)
    await assertTestInScope(req, id)
    const test = await mockTestService.getTest(id)
    return ApiResponse.success(res, { test })
  } catch (err) {
    if (err.status) return ApiResponse.error(res, err.message, err.status)
    next(err)
  }
}

// GET /api/mock-tests/:id/questions
async function getQuestions(req, res, next) {
  try {
    const id = parseId(req.params.id)
    await assertTestInScope(req, id)
    const result = await mockTestService.getQuestions(id)
    return ApiResponse.success(res, result)
  } catch (err) {
    if (err.status) return ApiResponse.error(res, err.message, err.status)
    next(err)
  }
}

// POST /api/mock-tests/:id/submit   body: { answers: { [questionId]: selectedIndex }, timeTakenSec }
async function submit(req, res, next) {
  try {
    if (req.scope && req.scope.role !== 'student') return ApiResponse.error(res, 'Only students can attempt this.', 403)
    const id = parseId(req.params.id)
    await assertTestInScope(req, id)
    const answers = (req.body && typeof req.body.answers === 'object' && req.body.answers) || {}
    const timeTakenSec = Number(req.body && req.body.timeTakenSec) || 0
    const result = await mockTestService.submit({ id, userId: req.user && req.user.id, answers, timeTakenSec })
    return ApiResponse.success(res, result, 'Submitted')
  } catch (err) { next(err) }
}

module.exports = { listTests, getAttempts, getTest, getQuestions, submit }
