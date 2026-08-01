'use strict'

const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const ApiResponse = require('../utils/ApiResponse')
const svc = require('../services/offlineTest.service')

const router = Router()
router.use(authenticate)

// POST /api/offline-tests/submit
// Records an online test taken from the app's bundled question bank (Classes
// 10/11/12). Graded server-side against offline_answer_keys.
router.post('/submit', async (req, res, next) => {
  try {
    if (req.scope && req.scope.role !== 'student') {
      return ApiResponse.error(res, 'Only students can attempt this.', 403)
    }
    const b = req.body || {}
    const data = await svc.submit({
      userId: req.user.id,
      classLevel: b.classLevel,
      subject: b.subject,
      chapter: b.chapter,
      testLabel: b.testLabel,
      answers: (b.answers && typeof b.answers === 'object') ? b.answers : {},
      questionIds: Array.isArray(b.questionIds) ? b.questionIds : [],
      timeTakenSec: b.timeTakenSec,
    })
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
})

module.exports = router
