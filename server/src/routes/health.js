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
      // WHICH COMMIT IS ACTUALLY RUNNING. `version` comes from package.json and
      // has read 1.0.0 through every deploy, so it could never answer "did my
      // change go out?" — the question that matters after every push. Render
      // injects RENDER_GIT_COMMIT; locally there is none, hence 'local'.
      //
      //   curl -s https://ailernova-api.onrender.com/api/health | jq -r .data.commit
      //   git log --oneline -1 <that sha>
      commit: (process.env.RENDER_GIT_COMMIT || 'local').slice(0, 7),
      branch: process.env.RENDER_GIT_BRANCH || null,
      // Uptime doubles as a deploy clock: a few seconds means it has just
      // restarted, which on the free plan is either a deploy or a cold start.
      uptimeSec: Math.round(process.uptime()),
    },
  })
})

module.exports = router
