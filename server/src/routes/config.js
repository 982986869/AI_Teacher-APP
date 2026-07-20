'use strict'

const { Router } = require('express')
const { get } = require('../controllers/config.controller')

const router = Router()

// Public — the apps fetch this at startup / on resume, before (or without) auth.
router.get('/', get)

module.exports = router
