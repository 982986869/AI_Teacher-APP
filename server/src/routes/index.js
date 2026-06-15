'use strict'

const { Router } = require('express')
const healthRouter = require('./health')

const router = Router()

router.use('/health',    healthRouter)
router.use('/auth',      require('./auth'))
router.use('/ai',        require('./ai'))
router.use('/knowledge', require('./knowledge'))

module.exports = router
