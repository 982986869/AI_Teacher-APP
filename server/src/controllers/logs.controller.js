'use strict'

// Client error ingest — the app end of bug list item 15.
//
// The app's reportError() buffers whatever its former `catch {}` blocks swallowed and
// flushes a batch here. Behind `authenticate` on purpose: an anonymous endpoint that
// writes rows into a database with 17 MB of headroom is a denial-of-service invitation,
// and every device that has an error to report is signed in anyway.
//
// This endpoint NEVER fails the client. A device whose logging call errors would retry,
// and a retry storm on an error path is how a small fault becomes an outage — so every
// outcome here is a 200 with a count.

const ApiResponse = require('../utils/ApiResponse')
const errorLog = require('../services/errorLog.service')

// A device with a bug can loop. Cap what one account may write per window, and drop
// the rest silently — the app must not learn that it is being throttled, or it will
// treat that as another error to report.
const MAX_PER_WINDOW = 60
const WINDOW_MS = 60 * 60 * 1000
// Per-process and deliberately not in the database: this is spam control, not
// accounting, and Render runs one instance. Bounded below so it cannot grow forever.
const MAX_TRACKED_USERS = 5000
const buckets = new Map()

function takeQuota(userId, want) {
  const now = Date.now()
  let b = buckets.get(userId)
  if (!b || now - b.start > WINDOW_MS) {
    b = { start: now, used: 0 }
    if (buckets.size >= MAX_TRACKED_USERS) buckets.clear()
    buckets.set(userId, b)
  }
  const allowed = Math.max(0, Math.min(want, MAX_PER_WINDOW - b.used))
  b.used += allowed
  return allowed
}

// Batches are capped here as well as in the app, because the app is not the only thing
// that can call this.
const MAX_BATCH = 20

async function ingest(req, res) {
  try {
    const raw = Array.isArray(req.body?.entries) ? req.body.entries : []
    const batch = raw.slice(0, MAX_BATCH).filter((e) => e && typeof e === 'object')
    if (!batch.length) return ApiResponse.success(res, { accepted: 0 })

    const allowed = takeQuota(req.user?.id || 'anonymous', batch.length)
    if (!allowed) return ApiResponse.success(res, { accepted: 0 })

    const device = req.body?.device || {}
    const accepted = await errorLog.recordMany(
      batch.slice(0, allowed).map((e) => ({
        // source is forced, not read from the body: a client cannot file a report as
        // though it came from the server.
        source: 'app',
        level: e.level,
        site: e.site,
        message: e.message,
        stack: e.stack,
        context: e.context,
        userId: req.user?.id || null,
        userRole: req.user?.role || null,
        appVersion: device.appVersion,
        platform: device.platform,
        osVersion: device.osVersion,
      })),
    )
    return ApiResponse.success(res, { accepted })
  } catch (err) {
    // Swallowing here is the correct behaviour, not an oversight — see the header.
    console.error('[logs] client ingest failed:', err && err.message)
    return ApiResponse.success(res, { accepted: 0 })
  }
}

module.exports = { ingest, MAX_BATCH, MAX_PER_WINDOW }
