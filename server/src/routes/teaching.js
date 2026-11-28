'use strict'
// /api/teaching — the human teacher's dashboard. Teachers only (made by an admin).
// Not under /api/teacher: that path is the AI Teacher's avatar identity (teacherIdentity.js).

const { Router } = require('express')
const { authenticate, requireTeacher } = require('../middleware/auth')
const ctrl = require('../controllers/teaching.controller')

const router = Router()
router.use(authenticate, requireTeacher)

router.get('/dashboard', ctrl.dashboard)        // next lesson, today, this week, my students
router.get('/class', ctrl.myClass)              // each pair with its homework counts
router.get('/homework', ctrl.listHomework)      // ?assignmentId= for one student
router.post('/homework', ctrl.giveHomework)     // { assignmentId, title, details, dueOn }
router.patch('/homework/:id', ctrl.editHomework) // { title?, details?, dueOn?, images? } or { delete: true }
router.post('/homework/:id/check', ctrl.checkHomework) // { comment } | { uncheck: true }

module.exports = router
