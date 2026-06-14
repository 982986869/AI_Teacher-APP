'use strict'

const { Router } = require('express')
const db = require('../config/database')

const router = Router()

router.get('/', async (req, res) => {
  let dbStatus = 'connected'
  try {
    await db.$queryRaw`SELECT 1`
  } catch {
    dbStatus = 'disconnected'
  }

  res.json({
    success: true,
    data: {
      status: 'ok',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    },
  })
})

module.exports = router
