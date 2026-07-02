'use strict'

const { Router } = require('express')
const { body } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const { linkChild, report } = require('../controllers/parent.controller')

const router = Router()
router.use(authenticate)

router.post('/link-child', [
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('phone').optional({ checkFalsy: true }).isString(),
], linkChild)
router.get('/report', report)

module.exports = router
