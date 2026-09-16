'use strict'

// Chapter activities — a team board game for the classroom and solo missions for a
// student on their own, both assembled from the chapter's question banks.
//
// Mounted behind `paid` in routes/index.js, like the practice and resource routes it
// draws its questions from: an activity is those same questions in a different shape,
// so it cannot be more open than they are.

const { Router } = require('express')
const { subjects, chapters, activity, result } = require('../controllers/activities.controller')

const router = Router()

router.get('/subjects', subjects)
router.get('/:subjectSlug/chapters', chapters)
// ?mode=board | missions (default)
router.get('/chapter/:chapterId', activity)
router.post('/chapter/:chapterId/result', result)

module.exports = router
