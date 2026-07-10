'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Phase 2F — Examin8 Practice Questions extractor for Class 10 (ANSWER-LESS).
//
// examin8's Practice bank is an adaptive attempt engine: the paginated list
// exposes the question + options but NO correct answer / solution — those are only
// revealed by SUBMITTING each question (PRACTICE_ATTEMPT), which mutates the account
// and, done in bulk, means thousands of writes. We deliberately DO NOT do that.
//
// So Practice is imported as read-only practice MCQs: question HTML, options, images,
// math, ordering — preserved verbatim — with NO correct answer (correct_option=null,
// no is_correct flag, no solution). The app shows them; scoring is disabled.
//
//   list (paginated, READ-ONLY, non-destructive):
//     GET /v1/practice/question/category/{chapterCategoryId}/paginate/?limit&offset
//       → { data:[{ id, question, question_hindi, options:[{id,option}], difficulty_label }],
//           next, total_questions, has_subscription }
//
// Output is the SAME normalized shape importClass10Questions.js consumes, so the
// import reuses the EXISTING sections + questions tables (type_key='practice').
//
//   raw : data/examin8/class10/raw/practice/subject-{subjectId}-ch-{chapterId}.json
//   norm: data/examin8/class10/normalized/practice.json
//   Resume: a chapter whose raw file exists is not re-fetched (unless --force).
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/examin8/fetchClass10Practice.js
//   ONLY=mathematics node scripts/examin8/fetchClass10Practice.js --force
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const B = 'https://web.examin8.com/v1'
const DELAY = 120
const PAGE = 50
const FORCE = process.argv.includes('--force')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const OUT = path.join(ROOT, 'data', 'examin8', CLASS_DIR)
const RAW = path.join(OUT, 'raw', 'practice')
const NORM = path.join(OUT, 'normalized')

const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF

const SUBJECTS = null // null → every subject with chapters (dynamic); ONLY=… to restrict
const IDX = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()

const log = { chapters: 0, withQ: 0, questions: 0, mcq: 0, empty: 0, forbidden: 0, errors: [] }

async function api(url) {
  const headers = { accept: 'application/json', referer: 'https://web.examin8.com/' }
  if (CSRF) headers['x-csrftoken'] = CSRF
  if (COOKIE) headers.cookie = COOKIE
  const r = await fetch(url, { headers })
  if (r.status === 401 || r.status === 403) { const e = new Error(`HTTP ${r.status}`); e.forbidden = true; throw e }
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

// All practice questions for one chapter (paginated, READ-ONLY). Raw cached → resume.
async function fetchChapter(subjectId, chapterId) {
  const rawFile = path.join(RAW, `subject-${subjectId}-ch-${chapterId}.json`)
  let pages
  if (!FORCE && fs.existsSync(rawFile)) {
    try { pages = JSON.parse(fs.readFileSync(rawFile, 'utf8')) } catch (_) { pages = null }
  }
  if (!pages) {
    pages = []
    let url = `${B}/practice/question/category/${chapterId}/paginate/?limit=${PAGE}&offset=0`
    let guard = 0
    while (url && guard < 200) {
      const j = await api(url)
      pages.push(j)
      url = j && j.next ? j.next : null
      guard += 1
      if (url) await sleep(DELAY)
    }
    fs.writeFileSync(rawFile, JSON.stringify(pages))
    await sleep(DELAY)
  }
  const seen = new Set(); const out = []
  for (const j of pages) for (const q of ((j && j.data) || [])) {
    if (q.id != null) { if (seen.has(q.id)) continue; seen.add(q.id) }
    out.push(q)
  }
  return out
}

// examin8 practice question → questions-table row shape (import-compatible). NO
// correct answer is known, so correct_option=null and every option is_correct=false.
function normalizeQuestion(q, i) {
  const opts = Array.isArray(q.options) ? q.options : (Array.isArray(q.option) ? q.option : [])
  const options = opts.map((o, k) => ({ idx: IDX[k] || String(k + 1), html: String(o.option != null ? o.option : (o.text != null ? o.text : '')), is_correct: false }))
  return {
    ext_id: q.id != null ? Number(q.id) : null,
    q_number: `Q${i + 1}`,
    year: null,
    question_html: q.question != null ? String(q.question) : '',   // verbatim HTML/math/images
    is_mcq: options.length > 0,
    options: options.length ? options : null,
    correct_option: null,      // unknown — never faked
    solution_html: null,       // not exposed by the practice API
    position: i,
    difficulty: trim(q.difficulty_label) || null,
  }
}

async function main() {
  fs.mkdirSync(RAW, { recursive: true })
  if (!COOKIE || !CSRF) { console.error('  ✗ EXAMIN8_COOKIE and EXAMIN8_CSRF are required.'); process.exit(1) }

  const chaptersBySubject = JSON.parse(fs.readFileSync(path.join(NORM, 'chapters.json'), 'utf8'))
  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  const subjects = chaptersBySubject.filter((s) =>
    (s.chapters || []).length &&
    (!SUBJECTS || SUBJECTS.includes(s.slug)) &&
    (!ONLY.length || ONLY.some((t) => s.slug.includes(t) || String(s.subject).toLowerCase().includes(t))))

  console.log(`\nPractice Questions fetch (answer-less) — ${CLASS_DIR}${FORCE ? ' (force)' : ''}${ONLY.length ? ` (ONLY: ${ONLY.join(',')})` : ''}`)

  const out = []
  for (const s of subjects) {
    const chaptersOut = []
    for (const ch of (s.chapters || [])) {
      if (!ch.category_id) continue
      log.chapters += 1
      let raw
      try { raw = await fetchChapter(s.subject_category_id, ch.category_id) }
      catch (e) { if (e.forbidden) log.forbidden += 1; log.errors.push(`${s.slug}/${ch.name}: ${e.message}`); continue }
      const questions = raw.map((q, i) => normalizeQuestion(q, i)).filter((q) => q.question_html)
      if (!questions.length) { log.empty += 1; continue }
      log.withQ += 1; log.questions += questions.length; log.mcq += questions.filter((q) => q.is_mcq).length
      chaptersOut.push({ chapter: ch.name, chapter_slug: ch.slug, chapter_category_id: ch.category_id, position: ch.position || 0, questions })
    }
    if (chaptersOut.length) {
      out.push({ subject: s.subject, subject_slug: s.slug, subject_category_id: s.subject_category_id, chapters: chaptersOut })
      console.log(`  • ${s.subject}: ${chaptersOut.length} chapters, ${chaptersOut.reduce((n, c) => n + c.questions.length, 0)} questions`)
    }
  }

  const outPath = path.join(NORM, 'practice.json')
  let merged = out
  try {
    const prev = JSON.parse(fs.readFileSync(outPath, 'utf8'))
    const map = new Map((Array.isArray(prev) ? prev : []).map((s) => [s.subject_slug, s]))
    for (const s of out) map.set(s.subject_slug, s)
    merged = Array.from(map.values())
  } catch (_) { /* fresh */ }
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2))

  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Chapters scanned  : ${log.chapters}`)
  console.log(`  Chapters with Qs  : ${log.withQ}`)
  console.log(`  Questions         : ${log.questions} (${log.mcq} MCQ) — NO answers (read-only)`)
  console.log(`  Empty chapters    : ${log.empty}`)
  console.log(`  Errors            : ${log.errors.length}${log.forbidden ? ` (403: ${log.forbidden})` : ''}`)
  log.errors.slice(0, 8).forEach((e) => console.log(`     ! ${e}`))
  console.log(`\n  ✓ normalized/practice.json (${merged.length} subjects; ${out.length} this run)`)
  console.log(`  Next: SECTION=practice node scripts/examin8/importClass10Questions.js --live`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
