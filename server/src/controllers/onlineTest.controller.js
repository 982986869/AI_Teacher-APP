'use strict'

const ApiResponse = require('../utils/ApiResponse')
const svc = require('../services/onlineTest.service')
const { resolveClassNum } = require('../services/personalization/enforce')
const { isAllowedSubject } = require('../services/personalization/subjects')

// Authoritative class for this request. resolveClassNum is the ONLY place allowed to
// honour ?class=, and it does so exclusively for allowlisted tester accounts. This
// controller used to read req.query.class directly for everyone, which let any student
// browse another class's tests just by changing the URL.
const classOf = (req) => resolveClassNum(req)

// A student may only open a test that belongs to their own class + syllabus. Prevents
// fetching another class's test (answer key included) by guessing its id. Mirrors
// mockTest.controller.assertTestInScope.
async function assertTestInScope(req, testId) {
  const meta = await svc.getTestMeta(testId)
  if (!meta) return null
  if (req.scope && req.scope.role === 'student') {
    const cls = classOf(req)
    if (!cls || Number(meta.classLevel) !== Number(cls)) {
      return { forbidden: 'This test is not available for your class.' }
    }
    // Subject gating only applies to senior classes (11/12), where streams restrict
    // subjects. Class ≤10 has no streams — every subject with a class_level test is in
    // the student's syllabus, and the class check above already blocks other classes.
    if (meta.subject && Number(req.scope.classNum) > 10 && !isAllowedSubject(meta.subject, req.scope.classNum, req.scope.stream)) {
      return { forbidden: 'This test is not part of your syllabus.' }
    }
  }
  return { meta }
}

async function getChapters(req, res, next) {
  try {
    const data = await svc.listChapters(req.params.subjectSlug, classOf(req))
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

async function getTests(req, res, next) {
  try {
    const data = await svc.listTests(req.params.subjectSlug, req.params.chapterSlug, classOf(req))
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

async function getTest(req, res, next) {
  try {
    // Reject a malformed id up front — BigInt() would otherwise throw a SyntaxError
    // that surfaces as a 500 rather than a clean 400.
    if (svc.parseTestId(req.params.testId) == null) {
      return ApiResponse.error(res, 'Invalid test id', 400)
    }
    const scoped = await assertTestInScope(req, req.params.testId)
    if (!scoped) return ApiResponse.error(res, 'Test not found', 404)
    if (scoped.forbidden) return ApiResponse.error(res, scoped.forbidden, 403)

    const data = await svc.getTest(req.params.testId)
    if (!data) return ApiResponse.error(res, 'Test not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

module.exports = { getChapters, getTests, getTest }
