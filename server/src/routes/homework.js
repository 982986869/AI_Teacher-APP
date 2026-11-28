'use strict'
// /api/homework — a student's homework from their teachers. Only their own (the service
// filters by student). Not behind the paywall: homework from a teacher is part of the
// classes the family already pays for, not app content.

const { Router } = require('express')
const multer = require('multer')
const { authenticate } = require('../middleware/auth')
const ctrl = require('../controllers/teaching.controller')

// One photo per request, 8 MB at most (phone photos; the app shrinks them first).
const photo = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } })

const router = Router()
router.use(authenticate)

router.get('/', ctrl.myHomework)
// A homework photo (teacher's worksheet or student's work) → { url }. Mounted here for
// both roles; the controller checks the caller is a teacher or a student with a teacher.
router.post('/upload', photo.single('file'), ctrl.uploadPhoto)
router.post('/:id/submit', ctrl.submitHomework)   // { note, images }
router.post('/:id/done', ctrl.markDone)
router.post('/:id/undo', ctrl.markNotDone)

module.exports = router
