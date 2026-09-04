'use strict'

const { Router } = require('express')
const { requireJobSecret, deletionDigest } = require('../controllers/jobs.controller')

const router = Router()

// Deliberately NOT behind adminAuthenticate: the caller is an external scheduler with
// no account and no session. The shared secret below is the whole gate, so it is applied
// to the router rather than to each route — a job added here cannot forget it.
router.use(requireJobSecret)

// POST, not GET: it sends mail. A GET would be fetched by link previewers and crawlers.
router.post('/deletion-digest', deletionDigest)

module.exports = router
