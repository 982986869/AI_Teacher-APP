'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Phase 2D — Examin8 chapter-level QUESTION banks for Class 10:
//   • Important Questions   GET /v1/question/important-questions/{chapterId}/
//   • Previous Year Qs (PYQ) GET /v1/question/previous_year_questions/{chapterId}/
//
// Both return the SAME shape (paginated under `data`):
//   { data:{ results:[ { id, question, option:[{option,is_correct,explanation}],
//            solution:[{solution}], alt_solution, years:[…] } ], count, next } }
//
// They map onto the EXISTING sections + questions tables (type_key=
// 'important_questions' / 'pyq') — the same model Class 11/12 use and that the app's
// getQuestionsByPath() reads. NO new tables. HTML/math/images preserved verbatim.
//
// chapterId = the chapter's examin8 category_id, read from normalized/chapters.json
// (NOT hardcoded). Output raw pages + normalized rows per (subject, section).
//
// SESSION-GATED (EXAMIN8_COOKIE + EXAMIN8_CSRF).
//
// Output: data/examin8/class10/raw/{section}/subject-{subjectId}-ch-{chapterId}.json
//         data/examin8/class10/normalized/{section}.json
// Resume: a chapter whose raw file exists is not re-fetched (unless --force).
//
//   SECTION=important_questions EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/examin8/fetchClass10Questions.js
//   SECTION=pyq ONLY=mathematics node scripts/examin8/fetchClass10Questions.js --force
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const B = 'https://web.examin8.com/v1'
const DELAY = 130
const FORCE = process.argv.includes('--force')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const OUT = path.join(ROOT, 'data', 'examin8', CLASS_DIR)
const NORM = path.join(OUT, 'normalized')

const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF

const SECTIONS = {
  important_questions: { path: 'question/important-questions', contentName: 'important-questions', hasYears: false },
  pyq:                 { path: 'question/previous_year_questions', contentName: 'pyq', hasYears: true },
}
const SECTION = (process.env.SECTION || 'important_questions').toLowerCase()
if (!SECTIONS[SECTION]) { console.error(`SECTION must be one of: ${Object.keys(SECTIONS).join(', ')}`); process.exit(1) }
const RAW = path.join(OUT, 'raw', SECTION)

// Which subjects to pull. Default = EVERY subject that has chapters in chapters.json
// (dynamic — nothing hardcoded); restrict with ONLY=<substr>,… when needed.
const SUBJECTS = null // null → all subjects with chapters

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const num = (v) => (v == null || v === '' ? null : Number(v))
const IDX = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
// Byte-identical to the app's slugify: if a name has any non-ASCII (Devanagari)
// char, append a stable hash so numeric-/marker-prefixed names ("1 विकास") stay
// unique instead of collapsing to "1".
const slugify = (s) => {
  const str = String(s).replace(/[–—­‑]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  const base = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base && !/[^\x00-\x7F]/.test(str)) return base
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  const hash = 'u' + h.toString(36)
  return base ? base + '-' + hash : hash
}

const log = { chapters: 0, withQ: 0, questions: 0, mcq: 0, empty: 0, forbidden: 0, errors: [] }

async function api(url) {
  const headers = { accept: 'application/json', referer: 'https://web.examin8.com/' }
  if (CSRF) headers['x-csrftoken'] = CSRF
  if (COOKIE) headers.cookie = COOKIE
  const r = await fetch(url, { headers })
  if (r.status === 401 || r.status === 403) { const e = new Error(`HTTP ${r.status} (login required)`); e.forbidden = true; throw e }
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

// Fetch every page for one chapter (raw cached → resume).
async function fetchChapter(subjectId, chapterId) {
  const rawFile = path.join(RAW, `subject-${subjectId}-ch-${chapterId}.json`)
  let pages
  if (!FORCE && fs.existsSync(rawFile)) {
    try { pages = JSON.parse(fs.readFileSync(rawFile, 'utf8')) } catch (_) { pages = null }
  }
  if (!pages) {
    pages = []
    let url = `${B}/${SECTIONS[SECTION].path}/${chapterId}/`
    while (url) {
      const j = await api(url)
      pages.push(j)
      const d = j.data || j
      url = (d && d.next) || null
      if (url) await sleep(DELAY)
    }
    fs.writeFileSync(rawFile, JSON.stringify(pages))
    await sleep(DELAY)
  }
  const seen = new Set(); const out = []
  for (const j of pages) {
    const d = j.data || j
    for (const q of (d.results || [])) {
      if (q.id != null) { if (seen.has(q.id)) continue; seen.add(q.id) }
      out.push(q)
    }
  }
  return out
}

// examin8 question → questions-table row (options [{idx,html,is_correct}]).
function normalizeQuestion(q, i) {
  const opts = Array.isArray(q.option) ? q.option : []
  const isMcq = opts.length > 0
  const options = isMcq ? opts.map((o, k) => ({ idx: IDX[k] || String(k + 1), html: trim(o.option), is_correct: !!o.is_correct })) : null
  const correctIdx = isMcq ? (options.find((o) => o.is_correct) || {}).idx || null : null
  // Solution: the solution[] array, else alt_solution, else the correct option's
  // explanation (MCQ). All copied verbatim.
  const solArr = Array.isArray(q.solution) ? q.solution.map((s) => trim(s.solution)).filter(Boolean) : []
  const altArr = Array.isArray(q.alt_solution) ? q.alt_solution.map((s) => trim(s.solution || s)).filter(Boolean) : []
  let solutionHtml = solArr.concat(altArr).join('\n')
  if (!solutionHtml && isMcq) {
    const corr = opts.find((o) => o.is_correct)
    if (corr && trim(corr.explanation)) solutionHtml = trim(corr.explanation)
  }
  const years = Array.isArray(q.years) ? q.years.filter((y) => y != null) : []
  return {
    ext_id: q.id != null ? Number(q.id) : null,
    q_number: `Q${i + 1}`,
    year: (SECTIONS[SECTION].hasYears && years.length) ? years.join(', ') : null,
    question_html: q.question || q.question_html || '', // verbatim
    is_mcq: isMcq,
    options,
    correct_option: correctIdx,
    solution_html: solutionHtml || null,
    position: i,
  }
}

// The CORRECT per-resource chapter list — Examin8's own list for this content type
// (content_name endpoint), which can differ from the generic category children in
// chapters.json (e.g. Reasoning IQ has Mirror/Embedded/Figure/Water Images that the
// children endpoint omits). Cached for resume. Falls back to chapters.json on miss.
async function fetchChapterList(subjectCategoryId) {
  const p = path.join(RAW, `chapters-subject-${subjectCategoryId}.json`)
  let json
  if (!FORCE && fs.existsSync(p)) { try { json = JSON.parse(fs.readFileSync(p, 'utf8')) } catch (_) { json = null } }
  if (!json) {
    json = await api(`${B}/content/category/${subjectCategoryId}/type/0/content_name/${SECTIONS[SECTION].contentName}/`)
    fs.writeFileSync(p, JSON.stringify(json))
    await sleep(DELAY)
  }
  const children = (json && (json.children || json.results)) || []
  return children
    .map((c, i) => ({ category_id: num(c.id), name: trim(c.name), slug: slugify(c.name), position: i }))
    .filter((c) => c.category_id && c.name)
}

async function main() {
  fs.mkdirSync(RAW, { recursive: true })
  if (!COOKIE || !CSRF) { console.error(`  ✗ EXAMIN8_COOKIE and EXAMIN8_CSRF are required.`); process.exit(1) }

  const chaptersBySubject = JSON.parse(fs.readFileSync(path.join(NORM, 'chapters.json'), 'utf8'))
  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  const subjects = chaptersBySubject.filter((s) =>
    (s.chapters || []).length &&
    (!SUBJECTS || SUBJECTS.includes(s.slug)) &&
    (!ONLY.length || ONLY.some((t) => s.slug.includes(t) || String(s.subject).toLowerCase().includes(t))))

  console.log(`\n${SECTION} fetch — ${CLASS_DIR}${FORCE ? ' (force)' : ''}${ONLY.length ? ` (ONLY: ${ONLY.join(',')})` : ''}`)

  const out = []
  for (const s of subjects) {
    const chaptersOut = []
    // Prefer Examin8's per-resource chapter list; fall back to metadata chapters.
    let chapters = null
    try { chapters = await fetchChapterList(s.subject_category_id) } catch (e) { if (e.forbidden) log.forbidden += 1 }
    if (!chapters || !chapters.length) chapters = (s.chapters || [])
    for (const ch of chapters) {
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

  // Merge by subject_slug so partial runs don't drop other subjects.
  const outPath = path.join(NORM, `${SECTION}.json`)
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
  console.log(`  Questions         : ${log.questions} (${log.mcq} MCQ)`)
  console.log(`  Empty chapters    : ${log.empty}`)
  console.log(`  Errors            : ${log.errors.length}${log.forbidden ? ` (403 login-gated: ${log.forbidden})` : ''}`)
  log.errors.slice(0, 8).forEach((e) => console.log(`     ! ${e}`))
  console.log(`\n  ✓ normalized/${SECTION}.json (${merged.length} subjects; ${out.length} this run)`)
  console.log(`  Next: SECTION=${SECTION} node scripts/examin8/importClass10Questions.js --live`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
