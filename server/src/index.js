'use strict'

require('dotenv').config()

const { validateEnv } = require('./config/env')
validateEnv() // Fail fast — crash on missing env vars before anything else starts

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { config } = require('./config/env')
const db = require('./config/database')
const routes = require('./routes')
const { notFound, errorHandler } = require('./middleware/errorHandler')

const app = express()

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet())

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  })
)

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', routes)

// ─── Error handling (must come last) ─────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ─── Start ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    await db.$connect()
    console.log('✓ Database connected')

    app.listen(config.port, () => {
      console.log(
        `✓ Server running on http://localhost:${config.port} [${config.nodeEnv}]`
      )
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    await db.$disconnect()
    process.exit(1)
  }
}

// ─── Graceful shutdown ───────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully`)
  await db.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Last-resort guards: a transient async failure (e.g. a Supabase pooler
// connection reset surfacing as an unhandled rejection) should be logged, not
// crash the whole server. Requests still fail individually via the error handler.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason && reason.message ? reason.message : reason)
})
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.message ? err.message : err)
})

start()

module.exports = app
