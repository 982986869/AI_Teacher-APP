'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Phase 2E — Examin8 Mock Tests extractor for Class 10.
//
// examin8 serves mock tests through an interactive attempt flow. Three endpoints:
//   list   : GET  /v1/mock-test/category/{subjectCategoryId}/   → { data:[{id,name,instruction,is_paid}] }
//   start  : POST /v1/mock-test/testpaper/{id}/start/           → creates an attempt (sections meta)
//   result : GET  /v1/mock-test/testpaper/{id}/result/          → the graded review:
//              { sections:[{ test_section_name, section_id,
//                  questions:[{ question_id, question(html),
//                    options:[{option_id, option(html), is_correct, selected}],
//                    explanation(html), solutions }] }],
//                test_duration, no_of_questions, test_paper_name, test_paper_instruction }
//
// The RESULT (post-attempt) is the only place correct answers + explanations are
// exposed, so we: (cached result? use it) else start → result. This creates one
// attempt per test on the logged-in account (authorised).
//
// Output is the SAME shape server/scripts/seed-physics-mock-tests.js consumes
// (category_name / mock_tests[]), so it imports into the EXISTING mock_tests +
// mock_test_questions tables. HTML/math/images/options preserved verbatim.
//
//   raw     : data/examin8/class10/raw/mock-tests/{subjectSlug}-tp-{examin8Id}.json
//   norm    : data/examin8/class10/normalized/mock-tests.json  (array of subject packs)
//   Resume  : a testpaper whose raw result is cached is not re-fetched (unless --force).
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/examin8/fetchClass10MockTests.js
//   ONLY=mathematics node scripts/examin8/fetchClass10MockTests.js --force
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const B = 'https://web.examin8.com/v1'
const DELAY = 160
const FORCE = process.argv.includes('--force')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const OUT = path.join(ROOT, 'data', 'examin8', CLASS_DIR)
const RAW = path.join(OUT, 'raw', 'mock-tests')
const NORM = path.join(OUT, 'normalized')

const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF

// Class 10 subjects with mock tests, and their examin8 subject category_id (from
// subjects.json — resolved at runtime, not hardcoded). Default = every subject whose
// resources.json advertises a mock_quiz (free or paid); ONLY=… to restrict.
const SUBJECT_SLUGS = null // null → all mock_quiz subjects (dynamic)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const num = (v) => (v == null || v === '' ? null : Number(v))

const log = { subjects: 0, tests: 0, started: 0, cached: 0, questions: 0, withCorrect: 0, paidLocked: 0, errors: [] }

function headers() {
  const h = { accept: 'application/json', referer: 'https://web.examin8.com/' }
  if (CSRF) h['x-csrftoken'] = CSRF
  if (COOKIE) h.cookie = COOKIE
  return h
}
async function apiGet(url) {
  const r = await fetch(url, { headers: headers() })
  if (r.status === 401 || r.status === 403) { const e = new Error(`HTTP ${r.status}`); e.forbidden = true; throw e }
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}
async function apiPost(url) {
  const r = await fetch(url, { method: 'POST', headers: headers() })
  if (!r.ok && r.status !== 400) throw new Error('POST HTTP ' + r.status)
  return r.json().catch(() => ({}))
}

const hasQs = (res) => res && Array.isArray(res.sections) && res.sections.some((s) => (s.questions || []).length)

// A test's graded review. examin8 only exposes answers via the RESULT of a
// completed attempt, so: read result → if empty, POST start → wait → read result,
// retrying a few times (a freshly-started attempt isn't queryable instantly, and
// rapid calls get throttled). Resume: reuse cached raw result unless --force.
async function fetchResult(subjectSlug, tpId) {
  const p = path.join(RAW, `${subjectSlug}-tp-${tpId}.json`)
  if (!FORCE && fs.existsSync(p)) {
    try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); if (hasQs(j)) { log.cached += 1; return j } } catch (_) { /* refetch */ }
  }
  let res = null
  let startedThis = false
  for (let i = 0; i < 5; i++) {
    res = await apiGet(`${B}/mock-test/testpaper/${tpId}/result/`).catch(() => null)
    if (hasQs(res)) break
    try { await apiPost(`${B}/mock-test/testpaper/${tpId}/start/`); if (!startedThis) { log.started += 1; startedThis = true } }
    catch (e) { /* may already be started / transient */ }
    // A freshly-started attempt isn't queryable instantly (~3s observed).
    await sleep(3000 + 700 * i)
  }
  if (hasQs(res)) { fs.writeFileSync(p, JSON.stringify(res)); await sleep(DELAY); return res }
  return null
}

// examin8 result → seed-physics-mock-tests.js input shape (one mock_tests[] item).
function normalizeTest(tp, res) {
  const sections = (res.sections || []).map((s) => ({
    sectionName: trim(s.test_section_name) || 'Section',
    sectionID: num(s.section_id),
    questions: (s.questions || []).map((q) => {
      const options = (q.options || []).map((o) => ({
        id: num(o.option_id),
        text: o.option != null ? String(o.option) : '', // verbatim HTML/math
        is_correct: o.is_correct === true,
      }))
      const correct = options.filter((o) => o.is_correct)
      const solHtml = Array.isArray(q.solutions) ? q.solutions.map((x) => trim(x.solution || x)).filter(Boolean).join('\n') : ''
      return {
        questionID: num(q.question_id),
        question: q.question != null ? String(q.question) : '',       // verbatim HTML/math
        question_raw: q.question != null ? String(q.question) : '',   // archival HTML
        options,
        correct_option_ids: correct.map((o) => o.id),
        correct_option_texts: correct.map((o) => o.text),
        explanation: trim(q.explanation) || solHtml || '',            // verbatim
      }
    }),
  }))
  const qCount = sections.reduce((n, s) => n + s.questions.length, 0)
  return {
    testPaperID: num(tp.id),
    testPaperName: trim(tp.name) || res.test_paper_name || `Mock Test ${tp.id}`,
    category_full_name: trim(res.category_full_name) || null,
    testDuration_min: num(res.test_duration) || num(tp.testDuration) || null,
    noOfQuestions: num(res.no_of_questions) || qCount,
    instruction: trim(tp.instruction) || trim(res.test_paper_instruction) || '',
    sections,
    _questionCount: qCount,
    _withCorrect: sections.reduce((n, s) => n + s.questions.filter((q) => q.correct_option_ids.length).length, 0),
  }
}

async function main() {
  fs.mkdirSync(RAW, { recursive: true })
  if (!COOKIE || !CSRF) { console.error('  ✗ EXAMIN8_COOKIE and EXAMIN8_CSRF are required (mock endpoints are session-gated).'); process.exit(1) }

  const subjects = JSON.parse(fs.readFileSync(path.join(NORM, 'subjects.json'), 'utf8'))
  const bySlug = Object.fromEntries(subjects.map((s) => [s.slug, s]))
  // Dynamic default: every subject whose resources.json lists a mock_quiz.
  const resources = JSON.parse(fs.readFileSync(path.join(NORM, 'resources.json'), 'utf8'))
  const mockSlugs = SUBJECT_SLUGS || resources
    .filter((r) => (r.content_types || []).some((t) => t.type === 'mock_quiz' && ((t.free && t.free > 0) || (t.paid && t.paid > 0))))
    .map((r) => r.slug)
  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  const slugs = mockSlugs.filter((sl) => !ONLY.length || ONLY.some((t) => sl.includes(t)))

  console.log(`\nMock Tests fetch — ${CLASS_DIR}${FORCE ? ' (force)' : ''}${ONLY.length ? ` (ONLY: ${ONLY.join(',')})` : ''}`)

  const out = []
  for (const slug of slugs) {
    const subj = bySlug[slug]
    if (!subj) { log.errors.push(`no subjects.json entry for ${slug}`); continue }
    log.subjects += 1
    let list
    try { list = await apiGet(`${B}/mock-test/category/${subj.category_id}/`) }
    catch (e) { log.errors.push(`list ${slug}: ${e.message}`); continue }
    const testpapers = Array.isArray(list) ? list : (list.data || list.results || [])
    const tests = []
    for (const tp of testpapers) {
      if (!tp || tp.id == null) continue
      log.tests += 1
      let res
      try { res = await fetchResult(slug, tp.id) }
      catch (e) { if (e.forbidden) log.paidLocked += 1; log.errors.push(`${slug} tp${tp.id} (${tp.name}): ${e.message}`); continue }
      if (!res) { log.errors.push(`${slug} tp${tp.id} (${tp.name}): no questions (paid/locked?)`); log.paidLocked += 1; continue }
      const t = normalizeTest(tp, res)
      if (!t._questionCount) { log.errors.push(`${slug} tp${tp.id}: 0 questions`); continue }
      log.questions += t._questionCount; log.withCorrect += t._withCorrect
      delete t._questionCount; delete t._withCorrect
      tests.push(t)
    }
    if (tests.length) {
      out.push({ category_name: subj.name, subject_slug: slug, mock_tests: tests })
      console.log(`  • ${subj.name}: ${tests.length} tests, ${tests.reduce((n, t) => n + t.sections.reduce((m, s) => m + s.questions.length, 0), 0)} questions`)
    }
  }

  // Merge by subject_slug so partial runs don't drop other subjects.
  const outPath = path.join(NORM, 'mock-tests.json')
  let merged = out
  try {
    const prev = JSON.parse(fs.readFileSync(outPath, 'utf8'))
    const map = new Map((Array.isArray(prev) ? prev : []).map((s) => [s.subject_slug, s]))
    for (const s of out) map.set(s.subject_slug, s)
    merged = Array.from(map.values())
  } catch (_) { /* fresh */ }
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2))

  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Subjects scanned  : ${log.subjects}`)
  console.log(`  Tests scanned     : ${log.tests}`)
  console.log(`  Attempts started  : ${log.started} (cached: ${log.cached})`)
  console.log(`  Questions         : ${log.questions} (${log.withCorrect} with correct answer)`)
  console.log(`  Paid/locked/none  : ${log.paidLocked}`)
  console.log(`  Errors            : ${log.errors.length}`)
  log.errors.slice(0, 10).forEach((e) => console.log(`     ! ${e}`))
  console.log(`\n  ✓ normalized/mock-tests.json (${merged.length} subjects; ${out.length} this run)`)
  console.log(`  Next: node scripts/examin8/importClass10MockTests.js --live`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
