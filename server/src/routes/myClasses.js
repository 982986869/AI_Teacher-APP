'use strict'
// /api/my-classes — a student's live classes with their teachers: teacher, subject, the
// pair's room link and the next class (the Join card on Home). Only their own pairs.
// Not behind the paywall: these are the classes the family pays the teacher for.

const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const ctrl = require('../controllers/teaching.controller')

const router = Router()
router.get('/', authenticate, ctrl.myClasses)

module.exports = router
