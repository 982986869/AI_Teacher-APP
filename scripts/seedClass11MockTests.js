'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Class 11 Mock Tests (non-PCMB subjects, examin8 batch 24889) → mock_tests +
// mock_test_questions, class_level = 11. Same flow as scripts/examin8/
// fetchClass10MockTests.js: answers only exist in the RESULT of an attempt, so
// for each test: GET result → if empty POST start → wait → GET result. The owner
// OK'd recording these attempts on the examin8 account (2026-11-01).
//
// Test list comes from the raw cache (src/data/class11Examin8/<res>/mock/list.json,
// written by fetchClass11Examin8.js). Results are checkpointed per test to
// src/data/class11Mock/<res>-tp-<id>.json, so a re-run never re-starts a test.
//
// Ids: mock_tests.id = 200_000_000 + examin8 testpaper id (Class 10 uses 100M).
// mock_test_questions.id is a global int with no default and examin8 question ids
// can repeat across tests/classes, so Class 11 questions take ids from a private
// range starting at 1_950_000_000 (stable per run order; rows are rewritten per test).
//
//   node scripts/seedClass11MockTests.js                # fetch (+checkpoint)
//   node scripts/seedClass11MockTests.js --seed --live  # seed from checkpoints
//   ONLY=1411,1423 …
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
// CLASS=3 → Class 3 cache, subjects and id ranges (default Class 11).
const CLASS = process.env.CLASS || '11'
const RAW = path.join(ROOT, 'src', 'data', `class${CLASS}Examin8`)
const CACHE = path.join(ROOT, 'src', 'data', `class${CLASS}Mock`)
const B = 'https://web.examin8.com/v1'
const LIVE = process.argv.includes('--live')
const SEED_ONLY = process.argv.includes('--seed')
const CLASS_LEVEL = Number(CLASS)
const TEST_ID_OFFSET = CLASS === '3' ? 300000000 : 200000000
const Q_ID_BASE = CLASS === '3' ? 1960000000 : 1950000000
const DELAY = 200
const SUBJECTS = CLASS === '3' ? [{ res: '21467', name: 'Maths Olympiad' }] : [
  { res: '4787', name: 'Applied Maths' },
  { res: '1411', name: 'Accountancy' },
  { res: '1423', name: 'Economics' },
  { res: '1740', name: 'Business Studies' },
  { res: '1856', name: 'English Core' },
  { res: '1866', name: 'हिंदी कोर' },
]
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean)

const env = fs.readFileSync(path.join(ROOT, 'server', '.env.examin8'), 'utf8')
const COOKIE = process.env.EXAMIN8_COOKIE || env.match(/^EXAMIN8_COOKIE=(.*)$/m)[1].trim()
const CSRF = process.env.EXAMIN8_CSRF || env.match(/^EXAMIN8_CSRF=(.*)$/m)[1].trim()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const num = (v) => (v == null || v === '' || isNaN(Number(v)) ? null : Number(v))
const clean = (v) => (typeof v === 'string' ? v.replace(/\u0000/g, '') : v)
const headers = () => ({ accept: 'application/json', referer: 'https://web.examin8.com/', 'x-csrftoken': CSRF, cookie: COOKIE })

async function apiGet(url) {
  const r = await fetch(url, { headers: headers() })
  if (r.status === 401) { const e = new Error('AUTH 401'); e.fatal = true; throw e }
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}
async function apiPost(url) {
  const r = await fetch(url, { method: 'POST', headers: headers() })
  if (r.status === 401) { const e = new Error('AUTH 401'); e.fatal = true; throw e }
  return r.json().catch(() => ({}))
}
const hasQs = (res) => res && Array.isArray(res.sections) && res.sections.some((s) => (s.questions || []).length)

async function fetchResult(res, tpId) {
  const p = path.join(CACHE, `${res}-tp-${tpId}.json`)
  if (fs.existsSync(p)) { try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); if (hasQs(j)) return { j, cached: true } } catch (_) {} }
  let out = null
  for (let i = 0; i < 5; i++) {
    out = await apiGet(`${B}/mock-test/testpaper/${tpId}/result/`).catch((e) => { if (e.fatal) throw e; return null })
    if (hasQs(out)) break
    await apiPost(`${B}/mock-test/testpaper/${tpId}/start/`).catch((e) => { if (e.fatal) throw e })
    await sleep(3000 + 700 * i)
  }
  if (!hasQs(out)) return { j: null }
  fs.writeFileSync(p + '.tmp', JSON.stringify(out)); fs.renameSync(p + '.tmp', p)
  await sleep(DELAY)
  return { j: out, cached: false }
}

function normalize(tp, res) {
  const sections = (res.sections || []).map((s) => ({
    name: trim(s.test_section_name) || 'Section',
    id: num(s.section_id),
    questions: (s.questions || []).map((q) => {
      const options = (q.options || []).map((o) => ({ id: num(o.option_id), text: o.option != null ? String(o.option) : '', is_correct: o.is_correct === true }))
      const sol = Array.isArray(q.solutions) ? q.solutions.map((x) => trim(x.solution || x)).filter(Boolean).join('\n') : ''
      return { question: q.question != null ? String(q.question) : '', options, explanation: trim(q.explanation) || sol || '' }
    }),
  }))
  return {
    tpId: num(tp.id),
    name: trim(tp.name) || trim(res.test_paper_name) || `Mock Test ${tp.id}`,
    category: trim(res.category_full_name) || null,
    duration: num(res.test_duration) || num(tp.testDuration) || null,
    instruction: trim(tp.instruction) || trim(res.test_paper_instruction) || '',
    sections,
  }
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); for (const k of [...x.searchParams.keys()]) x.searchParams.delete(k); u = x.toString() } catch (_) {}
  return u
}

async function main() {
  fs.mkdirSync(CACHE, { recursive: true })
  const subjects = SUBJECTS.filter((s) => !ONLY.length || ONLY.includes(s.res))
  const plan = []
  for (const s of subjects) {
    const list = JSON.parse(fs.readFileSync(path.join(RAW, s.res, 'mock', 'list.json'), 'utf8'))
    const tps = (list.data || list.results || []).slice().sort((a, b) => a.id - b.id)
    const tests = []
    let started = 0, missing = 0
    for (const tp of tps) {
      let r
      if (SEED_ONLY) {
        const p = path.join(CACHE, `${s.res}-tp-${tp.id}.json`)
        r = { j: fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null, cached: true }
      } else {
        r = await fetchResult(s.res, tp.id)
      }
      if (!r.j) { missing++; continue }
      if (!r.cached) started++
      tests.push(normalize(tp, r.j))
    }
    const q = tests.reduce((n, t) => n + t.sections.reduce((a, x) => a + x.questions.length, 0), 0)
    const ans = tests.reduce((n, t) => n + t.sections.reduce((a, x) => a + x.questions.filter((y) => y.options.some((o) => o.is_correct)).length, 0), 0)
    console.log(`${s.name.padEnd(18)} ${tests.length}/${tps.length} tests, ${q} q (${ans} with answer), ${started} newly attempted${missing ? `, ${missing} MISSING` : ''}`)
    plan.push({ ...s, tests })
  }
  if (!LIVE) { console.log('\n[DRY] add --seed --live to write.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl() })
  await client.connect()
  try {
    let qid = Q_ID_BASE
    // Clear this script's id range first so re-runs are idempotent.
    await client.query('BEGIN')
    // Upper bound: other classes hold ranges above and below this one.
    await client.query('delete from mock_test_questions where id >= $1 and id < $2', [Q_ID_BASE, Q_ID_BASE + 10000000])
    for (const s of plan) {
      await client.query('delete from mock_test_questions where test_id in (select id from mock_tests where subject=$1 and class_level=$2)', [s.name, CLASS_LEVEL])
      await client.query('delete from mock_tests where subject=$1 and class_level=$2', [s.name, CLASS_LEVEL])
      let nq = 0
      for (const t of s.tests) {
        const testId = TEST_ID_OFFSET + t.tpId
        const qCount = t.sections.reduce((n, x) => n + x.questions.length, 0)
        await client.query(
          `insert into mock_tests (id, subject, name, category_full_name, duration_min, no_of_questions, instruction, section_count, question_count, class_level, status, created_at, updated_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'published', now(), now())`,
          [testId, s.name, clean(t.name), t.category, t.duration, qCount, clean(t.instruction), t.sections.length, qCount, CLASS_LEVEL])
        let order = 0
        for (const sec of t.sections) {
          for (const q of sec.questions) {
            const correct = q.options.filter((o) => o.is_correct)
            const ci = q.options.findIndex((o) => o.is_correct)
            await client.query(
              `insert into mock_test_questions (id, test_id, order_index, section_name, section_id, question, question_raw, options, correct_option_ids, correct_option_texts, correct_index, explanation)
               values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12)`,
              [qid++, testId, order++, sec.name, sec.id, clean(q.question), clean(q.question), clean(JSON.stringify(q.options)).replace(/\\u0000/g, ''),
                JSON.stringify(correct.map((o) => o.id)), clean(JSON.stringify(correct.map((o) => o.text))).replace(/\\u0000/g, ''), ci >= 0 ? ci : null, clean(q.explanation)])
            nq++
          }
        }
      }
      console.log(`  ✓ ${s.name}: ${s.tests.length} tests, ${nq} questions`)
    }
    await client.query('COMMIT')
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
