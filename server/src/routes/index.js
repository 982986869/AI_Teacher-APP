'use strict'

const { Router } = require('express')
const healthRouter = require('./health')

const router = Router()

router.use('/health',    healthRouter)
router.use('/auth',      require('./auth'))
router.use('/ai',        require('./ai'))
router.use('/tts',       require('./tts'))
router.use('/resources', require('./resources'))
router.use('/mock-tests', require('./mockTests'))
router.use('/online-tests', require('./onlineTests'))

module.exports = router
