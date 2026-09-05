'use strict'

// errorLog.service — the rules that make it safe to call from an error path.
//
// No database here on purpose. The whole point of this service is that it behaves
// correctly when the database is broken or the table is missing, so the interesting
// cases are precisely the ones a real connection would prevent us from reaching. The
// Prisma client is stubbed into require.cache before the service is loaded.

const test = require('node:test')
const assert = require('node:assert')
const path = require('node:path')

const DB_PATH = require.resolve(path.join(__dirname, '..', 'src', 'config', 'database.js'))

const calls = []
let executeImpl = async () => 1
let queryImpl = async () => []

require.cache[DB_PATH] = {
  id: DB_PATH,
  filename: DB_PATH,
  loaded: true,
  exports: {
    $executeRawUnsafe: async (sql, ...params) => { calls.push({ kind: 'execute', sql, params }); return executeImpl(sql, ...params) },
    $queryRawUnsafe: async (sql, ...params) => { calls.push({ kind: 'query', sql, params }); return queryImpl(sql, ...params) },
  },
}

const svc = require('../src/services/errorLog.service')

function reset() {
  calls.length = 0
  executeImpl = async () => 1
  queryImpl = async () => []
  svc.__resetState()
}

const missingTableError = () => Object.assign(new Error('relation "error_logs" does not exist'), { code: '42P01' })

// ─── PII scrubbing ────────────────────────────────────────────────────────────

test('scrub removes email addresses', () => {
  assert.strictEqual(svc.scrub('failed for aarav.sharma@gmail.com'), 'failed for [email]')
})

test('scrub removes Indian mobile numbers, with or without +91', () => {
  assert.strictEqual(svc.scrub('otp to 9876543210'), 'otp to [phone]')
  assert.strictEqual(svc.scrub('otp to +91 9876543210'), 'otp to [phone]')
  assert.strictEqual(svc.scrub('otp to 91-9876543210'), 'otp to [phone]')
})

test('scrub keeps epoch timestamps — they are worth reading', () => {
  // A ten-digit rule would eat this. The phone pattern requires a 6-9 leading digit.
  assert.strictEqual(svc.scrub('expired at 1756944000'), 'expired at 1756944000')
})

test('scrub passes null through rather than stringifying it', () => {
  assert.strictEqual(svc.scrub(null), null)
  assert.strictEqual(svc.scrub(undefined), null)
})

// ─── Bounding ─────────────────────────────────────────────────────────────────

test('truncate caps length and marks the cut', () => {
  assert.strictEqual(svc.truncate('abcdef', 4), 'abc…')
  assert.strictEqual(svc.truncate('abc', 10), 'abc')
})

test('normalizeEntry truncates an oversize message to the message cap', () => {
  const e = svc.normalizeEntry({ site: 'x', message: 'y'.repeat(5000) })
  assert.strictEqual(e.message.length, svc.MAX_MESSAGE)
})

test('normalizeEntry truncates an oversize stack to the stack cap', () => {
  const e = svc.normalizeEntry({ site: 'x', stack: 'z'.repeat(9000) })
  assert.strictEqual(e.stack.length, svc.MAX_STACK)
})

test('normalizeContext drops oversize context instead of writing partial JSON', () => {
  const big = svc.normalizeContext({ blob: 'q'.repeat(4000) })
  assert.strictEqual(big, JSON.stringify({ truncated: true }))
})

test('normalizeContext returns null for empty and non-objects', () => {
  assert.strictEqual(svc.normalizeContext({}), null)
  assert.strictEqual(svc.normalizeContext(null), null)
  assert.strictEqual(svc.normalizeContext('screen=Home'), null)
})

test('normalizeContext scrubs PII inside the context bag too', () => {
  assert.match(svc.normalizeContext({ email: 'a@b.com' }), /\[email\]/)
})

// ─── Shaping ──────────────────────────────────────────────────────────────────

test('normalizeEntry defaults source to app and level to error', () => {
  const e = svc.normalizeEntry({ site: 'utils/sound.js:playTap' })
  assert.strictEqual(e.source, 'app')
  assert.strictEqual(e.level, 'error')
})

test('normalizeEntry only accepts the two known levels and two known sources', () => {
  assert.strictEqual(svc.normalizeEntry({ level: 'warn' }).level, 'warn')
  // A client could post anything; unknown values collapse to the safe default rather
  // than reaching the insert.
  assert.strictEqual(svc.normalizeEntry({ level: 'fatal' }).level, 'error')
  assert.strictEqual(svc.normalizeEntry({ source: 'hacker' }).source, 'app')
  assert.strictEqual(svc.normalizeEntry({ source: 'server' }).source, 'server')
})

test('normalizeEntry falls back to a named site rather than writing NULL', () => {
  // site is NOT NULL in the table; an entry with no site must still be insertable.
  assert.strictEqual(svc.normalizeEntry({}).site, 'unknown')
})

// ─── Fingerprinting ───────────────────────────────────────────────────────────

test('fingerprint is stable across varying ids and numbers', () => {
  const a = svc.fingerprint('app', 'ResourcesScreen', 'chapter 412 not found')
  const b = svc.fingerprint('app', 'ResourcesScreen', 'chapter 998 not found')
  assert.strictEqual(a, b)
})

test('fingerprint separates different sites', () => {
  const a = svc.fingerprint('app', 'ResourcesScreen', 'boom')
  const b = svc.fingerprint('app', 'Ncert2Screen', 'boom')
  assert.notStrictEqual(a, b)
})

// ─── Never throwing ───────────────────────────────────────────────────────────

test('record resolves rather than rejecting when the insert fails', async () => {
  reset()
  executeImpl = async () => { throw new Error('connection reset by peer') }
  // If this rejected, every catch block that calls it would turn one swallowed error
  // into an unhandled rejection — strictly worse than the `catch {}` it replaced.
  const n = await svc.record({ site: 'x', message: 'boom' })
  assert.strictEqual(n, 0)
})

test('record resolves when the entry itself is malformed', async () => {
  reset()
  const circular = {}
  circular.self = circular
  const n = await svc.record({ site: 'x', message: 'boom', context: circular })
  assert.strictEqual(n, 1)
})

test('recordMany with nothing to write touches the database at all', async () => {
  reset()
  assert.strictEqual(await svc.recordMany([]), 0)
  assert.strictEqual(calls.length, 0)
})

// ─── Missing migration ────────────────────────────────────────────────────────

test('isMissingTable recognises the relation-does-not-exist failure', () => {
  assert.ok(svc.isMissingTable(missingTableError()))
  assert.ok(svc.isMissingTable({ message: 'relation "error_logs" does not exist' }))
  assert.ok(!svc.isMissingTable(new Error('connection reset')))
})

test('a missing table latches, so one forgotten migration is not a console flood', async () => {
  reset()
  executeImpl = async () => { throw missingTableError() }
  await svc.record({ site: 'a' })
  const afterFirst = calls.length
  await svc.record({ site: 'b' })
  await svc.record({ site: 'c' })
  // Only the first attempt reached the database; the rest short-circuited.
  assert.strictEqual(calls.length, afterFirst)
})

test('list reports a missing table instead of an empty list', async () => {
  reset()
  queryImpl = async () => { throw missingTableError() }
  const res = await svc.list({})
  assert.strictEqual(res.tableMissing, true)
  assert.deepStrictEqual(res.rows, [])
})

test('list still throws on a real database failure', async () => {
  reset()
  queryImpl = async () => { throw new Error('connection reset') }
  await assert.rejects(() => svc.list({}), /connection reset/)
})

test('facets reports a missing table and still returns the size budget', async () => {
  reset()
  queryImpl = async () => { throw missingTableError() }
  const res = await svc.facets()
  assert.strictEqual(res.tableMissing, true)
  assert.strictEqual(res.maxRows, svc.MAX_ROWS)
  assert.strictEqual(res.retentionDays, svc.RETENTION_DAYS)
})

// ─── The insert itself ────────────────────────────────────────────────────────

test('recordMany writes a batch as ONE insert, not one per entry', async () => {
  reset()
  await svc.recordMany([{ site: 'a' }, { site: 'b' }, { site: 'c' }])
  const inserts = calls.filter((c) => /INSERT INTO "error_logs"/.test(c.sql))
  assert.strictEqual(inserts.length, 1)
  // 12 columns x 3 rows.
  assert.strictEqual(inserts[0].params.length, 36)
  assert.match(inserts[0].sql, /\$36\)/)
})

test('recordMany binds values as parameters, never interpolated into the SQL', async () => {
  reset()
  await svc.record({ site: "x'; DROP TABLE users; --", message: 'boom' })
  const [insert] = calls.filter((c) => /INSERT INTO/.test(c.sql))
  assert.ok(!insert.sql.includes('DROP TABLE'))
  assert.ok(insert.params.includes("x'; DROP TABLE users; --"))
})

test('list caps pageSize so one request cannot pull the whole table', async () => {
  reset()
  queryImpl = async (sql) => (/COUNT/.test(sql) ? [{ n: 0 }] : [])
  const res = await svc.list({ pageSize: 100000 })
  assert.strictEqual(res.pageSize, 100)
})

test('list search filters on site and message via a bound parameter', async () => {
  reset()
  queryImpl = async (sql) => (/COUNT/.test(sql) ? [{ n: 0 }] : [])
  await svc.list({ search: 'sound', source: 'app' })
  const [count] = calls
  assert.match(count.sql, /source = \$1/)
  assert.match(count.sql, /site ILIKE \$2 OR message ILIKE \$2/)
  assert.deepStrictEqual(count.params, ['app', '%sound%'])
})
