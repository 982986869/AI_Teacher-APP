'use strict'

const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const ctrl = require('../controllers/sessions.controller')

const router = Router()

// Student-facing: the sessions for my class. Auth attaches req.scope (class).
router.get('/', authenticate, ctrl.forStudent)

module.exports = router
