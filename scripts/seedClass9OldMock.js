'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Fetch Class 9 "Old - Maths" Mock Tests from examin8 and seed into the
// pre-existing mock_tests / mock_test_questions tables (class_level=9), the SAME
// tables the Class 11/12 mock importers use (served by /api/mock-tests).
//
// Requires a SUBSCRIBED examin8 session.
//   GET  /v1/mock-test/category/1234/            -> { data:[{ id, name, instruction }] }
//   POST /v1/mock-test/testpaper/:id/start/      -> { testDuration, noOfQuestions,
//        testPaperInstruction, sections:[{ questions:[{ questionID, questionMark,
//        question, options:[{ optionID, option }] }] }] }
//   answer reveal: POST /v1/practice/attempted/  { question, option, time_taken,
//        category:1234 } -> { correct_option, explanation }   (mock qs span chapters,
//        so category = the subject id 1234)
//
// Synthetic ids avoid colliding with the Class 11/12 mock seed:
//   mock_tests.id          = 5900 + examin8 mock id
//   mock_test_questions.id = 93_000_000 + running counter
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass9MathsOldMock.js          # FETCH (dry)
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass9MathsOldMock.js --live    # + seed
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const B = 'https://web.examin8.com/v1'
const CLASS_LEVEL = 9
const DELAY = 130
// Synthetic ids: test id = res*1000 + examin8 mock id (unique per subject); question
// ids start at 94_000_000 (Old-Maths mock used the 93M range → no collision).
const Q_ID_BASE = 94000000
const CACHE_DIR = path.join(ROOT, 'src', 'data', 'class9OldMock')

// Class 9 OLD subjects with mock tests. `res` = examin8 content/category id.
const SUBJECTS = [
  { name: 'Old - Science',   slug: 'old-science',   res: '1218', full: 'CBSE > Class 09 > Old - Science' },
  { name: 'Old - Social Sc', slug: 'old-social-sc', res: '1895', full: 'CBSE > Class 09 > Old - Social Sc' },
  { name: 'Old - Eng Lang',  slug: 'old-eng-lang',  res: '1902', full: 'CBSE > Class 09 > Old - Eng Lang' },
  { name: 'Old - हिंदी ए',    slug: 'old-hindi-a',   res: '1904', full: 'CBSE > Class 09 > Old - हिंदी ए' },
  { name: 'Old - हिंदी ब',    slug: 'old-hindi-b',   res: '1906', full: 'CBSE > Class 09 > Old - हिंदी ब' },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const stripTags = (s) => trim(s).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

function headers(json) {
  const h = { Accept: 'application/json, text/plain, */*', 'X-CSRFToken': CSRF, Cookie: COOKIE, Origin: 'https://web.examin8.com', Referer: 'https://web.examin8.com/' }
  if (json) h['Content-Type'] = 'application/json'
  return h
}
async function apiGet(url, tries = 4) {
  for (let a = 1; a <= tries; a++) {
    try {
      const r = await fetch(url, { headers: headers(false) })
      if (r.status === 401 || r.status === 403) throw Object.assign(new Error('AUTH ' + r.status), { fatal: true })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      return await r.json()
    } catch (e) { if (e.fatal) throw e; if (a === tries) throw e; await sleep(DELAY * a * 2) }
  }
}
async function apiPost(url, body, tries = 4) {
  for (let a = 1; a <= tries; a++) {
    try {
      const r = await fetch(url, { method: 'POST', headers: headers(true), body: JSON.stringify(body) })
      if (r.status === 401 || r.status === 403) throw Object.assign(new Error('AUTH ' + r.status), { fatal: true })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      return await r.json()
    } catch (e) { if (e.fatal) throw e; if (a === tries) throw e; await sleep(DELAY * a * 2) }
  }
}

async function reveal(questionId, optionId, cache) {
  if (cache.has(questionId)) return cache.get(questionId)
  let out = { correctOptionId: null, explanation: '' }
  try {
    const j = await apiPost(`${B}/practice/attempted/`, { question: questionId, option: optionId, time_taken: 4, category: RES })
    out = { correctOptionId: j.correct_option != null ? j.correct_option : null, explanation: trim(j.explanation) || '' }
  } catch (e) { if (e.fatal) throw e }
  cache.set(questionId, out)
  await sleep(DELAY)
  return out
}

async function fetchMock(m, answerCache) {
  const start = await apiPost(`${B}/mock-test/testpaper/${m.id}/start/`, {})
  const sections = []
  let qCount = 0
  for (const sec of (start.sections || [])) {
    const secName = trim(sec.section_name || sec.name) || `Section ${sections.length + 1}`
    const questions = []
    for (const q of (sec.questions || [])) {
      const opts = (q.options || []).map((o) => ({ id: o.optionID, html: trim(o.option), text: stripTags(o.option) }))
      const ans = opts.length ? await reveal(q.questionID, opts[0].id, answerCache) : { correctOptionId: null, explanation: '' }
      const ci = ans.correctOptionId != null ? opts.findIndex((o) => o.id === ans.correctOptionId) : -1
      questions.push({
        extQuestionId: q.questionID,
        question: trim(q.question) || '',
        marks: parseFloat(q.questionMark) || 1,
        options: opts.map((o) => ({ id: o.id, text: o.text, html: o.html, is_correct: o.id === ans.correctOptionId })),
        correctOptionId: ans.correctOptionId,
        correctIndex: ci,
        explanation: ans.explanation || '',
      })
      qCount++
    }
    sections.push({ name: secName, questions })
  }
  return {
    extId: m.id,
    name: trim(m.name),
    instruction: trim(start.testPaperInstruction || m.instruction) || '',
    durationMin: parseInt(start.testDuration, 10) || 0,
    noOfQuestions: parseInt(start.noOfQuestions, 10) || qCount,
    sectionCount: sections.length,
    sections,
  }
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function seedSubject(client, subj, mocks) {
  const res = parseInt(subj.res, 10)
  // Clean slate for this subject's Class 9 mocks.
  await client.query('delete from mock_test_questions where test_id in (select id from mock_tests where class_level=$1 and subject=$2)', [CLASS_LEVEL, subj.name])
  await client.query('delete from mock_tests where class_level=$1 and subject=$2', [CLASS_LEVEL, subj.name])
  for (const mk of mocks) {
    const testId = res * 1000 + mk.extId          // unique per subject+mock
    const qTotal = mk.sections.reduce((n, s) => n + s.questions.length, 0)
    await client.query(
      `insert into mock_tests (id, subject, name, category_full_name, duration_min, no_of_questions, instruction, section_count, question_count, class_level)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [testId, subj.name, mk.name, subj.full, mk.durationMin, mk.noOfQuestions, mk.instruction, mk.sectionCount, qTotal, CLASS_LEVEL])
    let order = 0
    for (let si = 0; si < mk.sections.length; si++) {
      const sec = mk.sections[si]
      for (const q of sec.questions) {
        order++
        const qid = testId * 1000 + order          // unique per question
        await client.query(
          `insert into mock_test_questions (id, test_id, order_index, section_id, section_name, question, question_raw, options, correct_option_ids, correct_index, explanation)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [qid, testId, order, si + 1, sec.name, q.question, q.question,
           JSON.stringify(q.options), JSON.stringify(q.correctOptionId != null ? [q.correctOptionId] : []), q.correctIndex, q.explanation || null])
      }
    }
  }
  const totQ = mocks.reduce((n, m) => n + m.sections.reduce((a, s) => a + s.questions.length, 0), 0)
  console.log(`  ✓ ${subj.name}: ${mocks.length} mocks, ${totQ} questions`)
}

async function fetchSubject(subj) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  const cacheFile = path.join(CACHE_DIR, subj.slug + '.json')
  const list = await apiGet(`${B}/mock-test/category/${subj.res}/`)
  const mockList = (list.data || [])
  console.log(`\n=== ${subj.name} (res ${subj.res}) — ${mockList.length} mock tests ===`)
  const answerCache = new Map()
  const mocks = []
  for (const m of mockList) {
    try {
      const mk = await fetchMock(m, answerCache)
      const q = mk.sections.reduce((n, s) => n + s.questions.length, 0)
      const ans = mk.sections.reduce((n, s) => n + s.questions.filter((x) => x.correctOptionId != null).length, 0)
      console.log(`  + ${mk.name}: ${q}q (${ans} answered), ${mk.sectionCount} sections`)
      mocks.push(mk)
      fs.writeFileSync(cacheFile, JSON.stringify(mocks, null, 2))
    } catch (e) { console.error(`  ! ${m.name} failed: ${e.message}`); if (e.fatal) { console.error('  (auth/subscription — refresh session)'); process.exit(1) } }
    await sleep(DELAY)
  }
  return mocks
}

const SEED_ONLY = process.argv.includes('--seed') // seed from checkpoints, no fetch

function loadCheckpoint(subj) {
  const f = path.join(CACHE_DIR, subj.slug + '.json')
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : []
}

async function main() {
  const bySubject = []
  if (SEED_ONLY) {
    for (const subj of SUBJECTS) bySubject.push({ subj, mocks: loadCheckpoint(subj) })
  } else {
    if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
    for (const subj of SUBJECTS) bySubject.push({ subj, mocks: await fetchSubject(subj) })
  }
  const grand = bySubject.reduce((n, x) => n + x.mocks.reduce((a, m) => a + m.sections.reduce((b, s) => b + s.questions.length, 0), 0), 0)
  console.log(`\nTOTAL: ${bySubject.reduce((n, x) => n + x.mocks.length, 0)} mocks, ${grand} questions across ${SUBJECTS.length} subjects`)
  if (!LIVE) { console.log('[DRY] add --live to seed.'); return }
  const { Client } = require('pg')
  // Seed each subject on its own connection so a dropped socket doesn't abort the rest.
  for (const { subj, mocks } of bySubject) {
    if (!mocks.length) { console.log(`  ~ ${subj.name}: 0 mocks (skip)`); continue }
    for (let attempt = 1; attempt <= 3; attempt++) {
      const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
      try { await client.connect(); await seedSubject(client, subj, mocks); break }
      catch (e) { console.error(`  ! ${subj.name} seed attempt ${attempt} failed: ${e.message}`); if (attempt === 3) throw e; await sleep(1500) }
      finally { try { await client.end() } catch (_) {} }
    }
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
