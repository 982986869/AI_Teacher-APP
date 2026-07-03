'use strict'

const ApiResponse = require('../utils/ApiResponse')
const svc = require('../services/onlineTest.service')
const { resolveClassNum } = require('../services/personalization/enforce')

// Browsable across classes via the class picker: honor ?class=, fall back to the
// student's own class. (Matches the resources / mcq-practice flow.)
const classOf = (req) => {
  const m = String(req.query.class || '').match(/\d{1,2}/)
  return m ? parseInt(m[0], 10) : resolveClassNum(req)
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
    const data = await svc.getTest(req.params.testId)
    if (!data) return ApiResponse.error(res, 'Test not found', 404)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

module.exports = { getChapters, getTests, getTest }
