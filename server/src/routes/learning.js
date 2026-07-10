'use strict'

const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const {
  profile, timeline, weak, strong, revision,
  revisionCalendar, mistakes, resolveMistake, analytics, results, attemptDetail,
} = require('../controllers/learning.controller')

const router = Router()
router.use(authenticate)

router.get('/profile', profile)              // learning profile (state histogram + highlights)
router.get('/timeline', timeline)            // mastery timeline (by recency)
router.get('/weak', weak)                    // weakest concepts
router.get('/strong', strong)                // strongest concepts
router.get('/revision', revision)            // concepts needing revision (forgetting curve)
router.get('/revision-calendar', revisionCalendar) // spaced-repetition due + upcoming
router.get('/analytics', analytics)          // composed study analytics (Phase 7)
router.get('/results', results)              // Results dashboard (overview, daily hours, subjects, recent tests)
router.get('/results/attempt/:id', attemptDetail) // section-wise breakdown for one mock attempt
router.get('/mistakes', mistakes)            // personal mistake book
router.post('/mistakes/:id/resolve', resolveMistake)

module.exports = router
