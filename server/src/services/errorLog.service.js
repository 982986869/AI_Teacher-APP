'use strict'

// The swallowed-error trail (bug list item 15). Two producers write here:
//   1. middleware/errorHandler.js  — every 5xx the API returns
//   2. POST /api/logs/client       — batches from the app, where the empty
//                                    `catch {}` blocks used to be
// One consumer reads: the admin-only Error Logs screen.
//
// EVERY WRITE IS BEST-EFFORT AND MUST STAY THAT WAY. A logger that can throw turns
// one broken feature into a broken request, and a logger that logs its own failures
// loops forever. So record() swallows — deliberately, and to console.error, which is
// the one place that cannot recurse.
//
// Requires prisma/sql/error_logs.sql to have been run by hand. If it has not, every
// write no-ops and the admin screen reports the missing table rather than an empty
// list — otherwise a forgotten migration is indistinguishable from "no errors".

const crypto = require('crypto')
const db = require('../config/database')

// ─── Size budget ──────────────────────────────────────────────────────────────
// The database sits at ~482 MB of the free tier's 500 MB, and that headroom is
// spoken for by the pending content imports. So this table is capped by row count,
// not just by age: ~5,000 rows x ~500 B is a hard ~2.5 MB ceiling. Raise MAX_ROWS to
// 20000 once the Supabase plan is upgraded — it is the only number to change.
const MAX_ROWS = 5000
const RETENTION_DAYS = 14
// Trimming is a DELETE with a subquery; doing it on every insert would cost more than
// the logging. Amortize it, and never more than once per TRIM_MIN_INTERVAL_MS.
const TRIM_EVERY = 200
const TRIM_MIN_INTERVAL_MS = 10 * 60 * 1000

const MAX_MESSAGE = 500
const MAX_STACK = 1200
const MAX_SITE = 200
const MAX_CONTEXT_CHARS = 1000

// ─── PII scrubbing ────────────────────────────────────────────────────────────
// An error message or a stack frame can carry a student's email or phone (a failed
// signup echoing its input, a URL with a query param). Most of these users are
// children; none of it belongs in a log an admin browses. Stripped before insert, so
// it is never written rather than merely never displayed.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
// Indian mobile numbers, optionally +91-prefixed. Deliberately narrower than "ten
// digits": that would also redact epoch timestamps, which are worth keeping.
const PHONE_RE = /(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)/g

function scrub(text) {
  if (text == null) return null
  return String(text).replace(EMAIL_RE, '[email]').replace(PHONE_RE, '[phone]')
}

function truncate(text, max) {
  if (text == null) return null
  const s = String(text)
  return s.length <= max ? s : s.slice(0, max - 1) + '…'
}

// Stable identity for "the same fault happening again": ids, line offsets and
// timestamps vary between occurrences, so they are flattened out before hashing.
function fingerprint(source, site, message) {
  const norm = String(message || '')
    .toLowerCase()
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '#')
    .replace(/\d+/g, '#')
    .trim()
    .slice(0, 200)
  return crypto.createHash('sha1').update(`${source}|${site}|${norm}`).digest('hex').slice(0, 16)
}

// Context is an admin-facing breadcrumb, not a payload dump. Anything that does not
// serialize, or serializes big, is dropped rather than truncated mid-JSON.
function normalizeContext(context) {
  if (!context || typeof context !== 'object') return null
  try {
    const json = JSON.stringify(context)
    if (!json || json === '{}') return null
    return json.length > MAX_CONTEXT_CHARS ? JSON.stringify({ truncated: true }) : scrub(json)
  } catch {
    return null
  }
}

// One entry, shaped and bounded. Exported for the tests and for the client-ingest
// controller, which validates against exactly this before touching the database.
function normalizeEntry(raw = {}) {
  const source = raw.source === 'server' ? 'server' : 'app'
  const level = raw.level === 'warn' ? 'warn' : 'error'
  const site = truncate(String(raw.site || 'unknown'), MAX_SITE)
  const message = truncate(scrub(raw.message), MAX_MESSAGE)
  return {
    source,
    level,
    site,
    message,
    stack: truncate(scrub(raw.stack), MAX_STACK),
    context: normalizeContext(raw.context),
    userId: raw.userId || null,
    userRole: raw.userRole ? truncate(String(raw.userRole), 40) : null,
    appVersion: raw.appVersion ? truncate(String(raw.appVersion), 40) : null,
    platform: raw.platform ? truncate(String(raw.platform), 40) : null,
    osVersion: raw.osVersion ? truncate(String(raw.osVersion), 60) : null,
    fingerprint: fingerprint(source, site, message),
  }
}

// Postgres "relation does not exist" — the forgotten-migration case, which we report
// rather than retry.
const isMissingTable = (err) =>
  err?.code === '42P01' || /relation .*error_logs.* does not exist/i.test(err?.message || '')

let tableMissing = false
let sinceTrim = 0
let lastTrimAt = 0

async function maybeTrim() {
  sinceTrim += 1
  if (sinceTrim < TRIM_EVERY) return
  if (Date.now() - lastTrimAt < TRIM_MIN_INTERVAL_MS) return
  sinceTrim = 0
  lastTrimAt = Date.now()
  try {
    await db.$executeRawUnsafe(
      `DELETE FROM "error_logs" WHERE created_at < now() - interval '${RETENTION_DAYS} days'`,
    )
    // The row cap is the part that actually protects the disk quota: age alone lets a
    // single error storm write unbounded rows inside the retention window.
    await db.$executeRawUnsafe(
      `DELETE FROM "error_logs" WHERE id IN (
         SELECT id FROM "error_logs" ORDER BY created_at DESC OFFSET ${MAX_ROWS}
       )`,
    )
  } catch (err) {
    console.error('[errorLog] trim failed:', err && err.message)
  }
}

// Write one or more entries. Never throws, never rejects — callers are error paths.
async function recordMany(rawEntries = []) {
  if (tableMissing) return 0
  const entries = (Array.isArray(rawEntries) ? rawEntries : [rawEntries])
    .filter(Boolean)
    .map(normalizeEntry)
  if (!entries.length) return 0

  const cols = 12
  const params = []
  const tuples = entries.map((e, i) => {
    const b = i * cols
    params.push(
      e.source, e.level, e.site, e.message, e.stack, e.context,
      e.userId, e.userRole, e.appVersion, e.platform, e.osVersion, e.fingerprint,
    )
    return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6}::jsonb,` +
           `$${b + 7}::uuid,$${b + 8},$${b + 9},$${b + 10},$${b + 11},$${b + 12})`
  })

  try {
    await db.$executeRawUnsafe(
      `INSERT INTO "error_logs"
         (source, level, site, message, stack, context,
          user_id, user_role, app_version, platform, os_version, fingerprint)
       VALUES ${tuples.join(',')}`,
      ...params,
    )
  } catch (err) {
    if (isMissingTable(err)) {
      // Latch it: without this every subsequent error would also try, and fail, and
      // print — turning one missing migration into a console flood.
      tableMissing = true
      console.error('[errorLog] table "error_logs" is missing — run prisma/sql/error_logs.sql')
      return 0
    }
    console.error('[errorLog] insert failed:', err && err.message)
    return 0
  }

  await maybeTrim()
  return entries.length
}

const record = (entry) => recordMany([entry])

// ─── Read side (admin only) ───────────────────────────────────────────────────
async function list({ page = 1, pageSize = 25, source, level, search } = {}) {
  const params = []
  const conds = []
  if (source) { params.push(source); conds.push(`source = $${params.length}`) }
  if (level) { params.push(level); conds.push(`level = $${params.length}`) }
  if (search) {
    params.push(`%${search}%`)
    const i = params.length
    conds.push(`(site ILIKE $${i} OR message ILIKE $${i})`)
  }
  const whereSql = conds.length ? 'WHERE ' + conds.join(' AND ') : ''

  const size = Math.min(Math.max(parseInt(pageSize, 10) || 25, 1), 100)
  const pg = Math.max(parseInt(page, 10) || 1, 1)
  const offset = (pg - 1) * size

  try {
    const countRows = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "error_logs" ${whereSql}`, ...params)
    const total = (countRows && countRows[0] && countRows[0].n) || 0
    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, source, level, site, message, stack, context,
              user_id::text AS "userId", user_role AS "userRole",
              app_version AS "appVersion", platform, os_version AS "osVersion",
              fingerprint, created_at AS "createdAt"
         FROM "error_logs" ${whereSql}
        ORDER BY created_at DESC
        LIMIT ${size} OFFSET ${offset}`,
      ...params,
    )
    return { rows, total, page: pg, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)), tableMissing: false }
  } catch (err) {
    if (isMissingTable(err)) {
      // An empty list would read as "nothing has gone wrong", which is the exact
      // false negative this whole feature exists to remove. Say it out loud instead.
      return { rows: [], total: 0, page: pg, pageSize: size, totalPages: 1, tableMissing: true }
    }
    throw err
  }
}

// Counts for the filter chips, plus what the table is costing us — the row cap is a
// real constraint, so the admin reading this screen should see how close it is.
async function facets() {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT source, level, COUNT(*)::int AS n FROM "error_logs" GROUP BY source, level`,
    )
    const totalRows = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "error_logs"`)
    const oldestRows = await db.$queryRawUnsafe(`SELECT MIN(created_at) AS oldest FROM "error_logs"`)
    return {
      sources: [...new Set(rows.map((r) => r.source))].sort(),
      levels: [...new Set(rows.map((r) => r.level))].sort(),
      counts: rows,
      total: (totalRows && totalRows[0] && totalRows[0].n) || 0,
      oldest: (oldestRows && oldestRows[0] && oldestRows[0].oldest) || null,
      maxRows: MAX_ROWS,
      retentionDays: RETENTION_DAYS,
      tableMissing: false,
    }
  } catch (err) {
    if (isMissingTable(err)) {
      return { sources: [], levels: [], counts: [], total: 0, oldest: null, maxRows: MAX_ROWS, retentionDays: RETENTION_DAYS, tableMissing: true }
    }
    throw err
  }
}

async function purge() {
  const n = await db.$executeRawUnsafe(`DELETE FROM "error_logs"`)
  return { deleted: Number(n) || 0 }
}

// Test seam: the module latches `tableMissing` and counts inserts between trims, so a
// test that exercises both paths needs a way back to a known state.
function __resetState() {
  tableMissing = false
  sinceTrim = 0
  lastTrimAt = 0
}

module.exports = {
  record, recordMany, list, facets, purge,
  // exported for tests
  scrub, truncate, fingerprint, normalizeEntry, normalizeContext, isMissingTable, __resetState,
  MAX_ROWS, RETENTION_DAYS, MAX_MESSAGE, MAX_STACK,
}
