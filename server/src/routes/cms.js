'use strict'

const { Router } = require('express')
const { published } = require('../controllers/admin/cms.controller')

const router = Router()

// Public, Published-only content tree for the Student app (drafts can never leak).
router.get('/published', published)

module.exports = router
