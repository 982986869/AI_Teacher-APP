'use strict'

require('dotenv').config()

const { validateEnv } = require('./config/env')
validateEnv() // Fail fast — crash on missing env vars before anything else starts

const path = require('path')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const { config } = require('./config/env')
const db = require('./config/database')
const routes = require('./routes')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const { cleanupExpiredLessons } = require('./services/retention.service')

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

// ─── Response compression ────────────────────────────────────────────────────
// gzip JSON responses (a real 10-slide lesson is ~21KB → ~6.6KB, -69%). SSE must
// NOT be compressed — buffering breaks the live token stream — so the /api/ai/ask
// stream (text/event-stream) is explicitly skipped; TTS audio/PDFs are skipped by
// compressible content-type. Transparent to clients; no contract change.
app.use(
  compression({
    filter: (req, res) => {
      const ct = res.getHeader('Content-Type')
      if (ct && String(ct).includes('text/event-stream')) return false
      return compression.filter(req, res)
    },
  })
)

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Static PDFs (Class 6 Science NCERT / Worksheets / Notes) ─────────────────
// Public (no auth) so the app's WebView can open them directly. Permissive CORP
// so helmet's default same-origin policy doesn't block cross-origin loads.
app.use('/pdfs', express.static(path.join(__dirname, '..', 'public', 'pdfs'), {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Content-Type', 'application/pdf')
  },
}))

// ─── Static vendor JS (MathJax, mirrored locally) ─────────────────────────────
// The Resources/NCERT WebViews render formulas with MathJax, previously loaded
// from cdn.jsdelivr.net — external CDNs aren't reachable on every network (seen
// on-device: the script silently never loads and raw LaTeX source shows instead
// of the rendered formula). Serving our own copy means it only ever depends on
// reaching this server, which every other API call already proves it can.
app.use('/vendor', express.static(path.join(__dirname, '..', 'public', 'vendor'), {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable') // versionless static libs — a week is safe
  },
}))

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

    // AI Teacher session retention: hard-delete lessons untouched for 7+ days.
    // A daily interval is plenty for a cleanup job — no cron dependency needed.
    // Fire once shortly after boot (not immediately, so it never competes with
    // the startup request burst), then every 24h.
    const DAY_MS = 24 * 60 * 60 * 1000
    const runCleanup = () => {
      cleanupExpiredLessons()
        .then(({ deleted }) => { if (deleted) console.log(`[retention] deleted ${deleted} expired lesson(s)`) })
        .catch((err) => console.error('[retention] cleanup failed:', err && err.message ? err.message : err))
    }
    setTimeout(runCleanup, 60 * 1000)
    setInterval(runCleanup, DAY_MS)
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
// An uncaught exception leaves the process in an undefined state — the connection
// pool, any open transaction and every in-flight request may be inconsistent. Keeping
// it alive serves corrupted responses, so log loudly and exit; the supervisor
// (Render/systemd) restarts a clean process. Unlike the rejection handler above, this
// is never a routine transient failure.
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException] shutting down —', err && err.stack ? err.stack : err)
  db.$disconnect()
    .catch(() => {})
    .finally(() => process.exit(1))
  // Hard backstop: never hang if $disconnect stalls.
  setTimeout(() => process.exit(1), 3000).unref()
})

start()

module.exports = app
