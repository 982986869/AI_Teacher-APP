'use strict'

// Client error ingest. Free tier, deliberately: a free account's app swallows exactly
// the same errors a paid one does, and putting this behind the paywall would blind us
// to every bug a new user hits before they pay.

const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const logsCtrl = require('../controllers/logs.controller')

const router = Router()

router.post('/client', authenticate, logsCtrl.ingest)

module.exports = router
