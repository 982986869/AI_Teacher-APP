'use strict'

const { Router } = require('express')
const { body } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const { linkChild, report, progressDay, progressCalendar } = require('../controllers/parent.controller')

const router = Router()
router.use(authenticate)

router.post('/link-child', [
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('phone').optional({ checkFalsy: true }).isString(),
], linkChild)
router.get('/report', report)
router.get('/progress/day', progressDay)
router.get('/progress/calendar', progressCalendar)

module.exports = router
