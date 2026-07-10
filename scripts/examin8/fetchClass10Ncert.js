'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Phase 2C — Examin8 NCERT & Exemplar "textbook" solutions extractor (Class 10).
//
// Same architecture as Class 7/8/9 (scripts/buildClass9.js): each subject's
// textbook is a tree — book → chapters → exercise nodes → questions+solutions —
// fetched from the /textbook API and seeded into the EXISTING `ncert_solutions`
// table (one row per exercise "section", HTML blob), which Ncert2Screen renders.
//
//   book chapters : GET /v1/textbook/{bookUuid}/dashboard/chapters/
//                     → { chapters:[{name, uuid}], book_name }
//   exercises     : GET /v1/textbook/chapter/{chapterUuid}/exercises/
//                     → { exercise_nodes:[{uuid, name}], chapter_name }
//   questions     : GET /v1/textbook/chapter/{exerciseNodeUuid}/questions/?p=1
//                     → paginated { results:[{ question, solution_data:[{solution}],
//                       options_data, order, name, marks }], next }
//
// The book UUIDs are read from normalized/resources.json (textbook_data) — NOT
// hardcoded. Each book maps to a `part` number so it renders as its own tile:
//   part 2 = NCERT Solutions, part 3 = Exemplar Solutions,
//   parts 6/7/8 = the extra NCERT books of a multi-book subject (Social Science).
//
// SESSION-GATED (needs EXAMIN8_COOKIE + EXAMIN8_CSRF — same as revision notes).
// HTML/math/images/tables are preserved EXACTLY (question & solution copied verbatim;
// only wrapped in the card markup Ncert2Screen expects, identical to Class 9).
//
// Output: data/examin8/class10/raw/ncert/{part}-{subjectSlug}-{chapterSlug}-{nodeSlug}.json
//         data/examin8/class10/normalized/ncert-solutions.json   (import-ready rows)
// Resume: a node whose raw file exists is not re-fetched (unless --force).
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/examin8/fetchClass10Ncert.js
//   ONLY=mathematics node scripts/examin8/fetchClass10Ncert.js --force
//   TYPE=exemplar    node scripts/examin8/fetchClass10Ncert.js   # only part-3 books
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const B = 'https://web.examin8.com/v1'
const DELAY = 140
const FORCE = process.argv.includes('--force')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const CLASS_NAME = 'Class 10'
const OUT = path.join(ROOT, 'data', 'examin8', CLASS_DIR)
const RAW = path.join(OUT, 'raw', 'ncert')
const NORM = path.join(OUT, 'normalized')

const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF

// Which textbook books each subject exposes, and the `part` each maps to. The
// UUIDs are resolved from resources.json textbook_data by matching `match` in the
// book name. Nothing hardcoded — the PLAN is built dynamically from resources.json
// textbook_data for EVERY subject. `part` is assigned deterministically so the seed
// and the frontend agree: Exemplar → 3; the 1st NCERT book → 2; further NCERT books
// of a multi-book subject → 6,7,8,9 (3=Exemplar and 4=Revision-Notes are reserved).
function buildPlan(resources) {
  return (resources || [])
    .filter((r) => (r.textbook_data || []).length)
    .map((r) => {
      let ncertSeen = 0
      const books = (r.textbook_data || []).map((b) => {
        const isEx = /exemplar/i.test(b.name || '')
        let part
        if (isEx) part = 3
        else { part = ncertSeen === 0 ? 2 : (5 + ncertSeen); ncertSeen += 1 } // 2, 6, 7, 8…
        return { name: trim(b.name), uuid: b.uuid, part, isEx }
      }).filter((b) => b.uuid)
      return { subject: r.name, slug: r.slug, books }
    })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const normApos = (s) => trim(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
const slugify = (s) => normApos(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const log = { books: 0, chapters: 0, sections: 0, questions: 0, empty: 0, forbidden: 0, errors: [] }

async function api(url) {
  const headers = { accept: 'application/json', referer: 'https://web.examin8.com/' }
  if (CSRF) headers['x-csrftoken'] = CSRF
  if (COOKIE) headers.cookie = COOKIE
  const r = await fetch(url, { headers })
  if (r.status === 401 || r.status === 403) { const e = new Error(`HTTP ${r.status} (login required)`); e.forbidden = true; throw e }
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url)
  return r.json()
}

// Card markup identical to scripts/buildClass9.js so Ncert2Screen renders it the
// same way. question/solution HTML is inserted VERBATIM (math-tex, {tex}, <img>,
// <table> untouched).
function ncertCard(q, i) {
  const qh = trim(q.question_html)
  const sh = trim(q.solution_html)
  const sol = sh ? `<div class="answer-section"><div class="solution-block"><div class="label">Solution</div><div>${sh}</div></div></div>` : ''
  return `<div class="question-card"><div class="question-header"><span class="q-number">Q ${i + 1}</span></div><div class="question-body"><div class="question-text">${qh}</div></div>${sol}</div>`
}
const qs2html = (qs) => qs.map((q, i) => ncertCard(q, i)).join('\n')

// One exercise node's questions (paginated). Raw cached per node → resume.
async function fetchNode(nodeUuid, rawFile) {
  let pages
  if (!FORCE && fs.existsSync(rawFile)) {
    try { pages = JSON.parse(fs.readFileSync(rawFile, 'utf8')) } catch (_) { pages = null }
  }
  if (!pages) {
    pages = []
    let url = `${B}/textbook/chapter/${nodeUuid}/questions/?p=1`
    while (url) {
      const j = await api(url)
      pages.push(j)
      url = j.next || null
      if (url) await sleep(DELAY)
    }
    fs.writeFileSync(rawFile, JSON.stringify(pages))
    await sleep(DELAY)
  }
  const seen = new Set(); const out = []
  for (const j of pages) for (const q of (j.results || [])) {
    if (q.id != null) { if (seen.has(q.id)) continue; seen.add(q.id) }
    const sol = (Array.isArray(q.solution_data) && q.solution_data.length)
      ? q.solution_data.map((s) => trim(s.solution)).filter(Boolean).join('\n')
      : trim(q.solution_html || q.solution || '')
    out.push({ order: q.order != null ? q.order : out.length + 1, question_html: q.question || q.question_html || '', solution_html: sol || '' })
  }
  out.sort((a, b) => a.order - b.order)
  return out
}

// One book: chapters → exercise nodes → question cards. Returns [{chapter, sections}].
async function fetchBook(bookUuid, part, subjectSlug) {
  let meta
  try { meta = await api(`${B}/textbook/${bookUuid}/dashboard/chapters/`) }
  catch (e) { if (e.forbidden) log.forbidden += 1; log.errors.push(`book ${bookUuid}: ${e.message}`); return [] }
  log.books += 1
  const chapters = Array.isArray(meta) ? meta : (meta.chapters || meta.results || [])
  const out = []
  for (const ch of chapters) {
    const chUuid = ch.uuid || ch.id
    const chName = normApos(ch.chapter_name || ch.name)
    let ex
    try { ex = await api(`${B}/textbook/chapter/${chUuid}/exercises/`) }
    catch (e) { log.errors.push(`exercises ${subjectSlug}/${chName}: ${e.message}`); await sleep(DELAY); continue }
    const sections = []
    for (const node of (ex.exercise_nodes || [])) {
      const rawFile = path.join(RAW, `${part}-${subjectSlug}-${slugify(chName)}-${slugify(node.name)}.json`)
      let qs = []
      try { qs = await fetchNode(node.uuid, rawFile) }
      catch (e) { if (e.forbidden) log.forbidden += 1; log.errors.push(`node ${subjectSlug}/${chName}/${node.name}: ${e.message}`); qs = [] }
      if (qs.length) { sections.push({ label: normApos(node.name), html: qs2html(qs), count: qs.length }); log.questions += qs.length }
      await sleep(DELAY)
    }
    log.chapters += 1
    if (sections.length) { out.push({ chapter: chName, sections }); log.sections += sections.length }
    else log.empty += 1
    await sleep(DELAY)
  }
  return out
}

async function main() {
  fs.mkdirSync(RAW, { recursive: true })
  if (!COOKIE || !CSRF) {
    console.error('  ✗ EXAMIN8_COOKIE and EXAMIN8_CSRF are required (the /textbook endpoints 401 without a session).')
    process.exit(1)
  }
  const resources = JSON.parse(fs.readFileSync(path.join(NORM, 'resources.json'), 'utf8'))
  const PLAN = buildPlan(resources)

  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  const TYPE = (process.env.TYPE || '').toLowerCase() // 'ncert' | 'exemplar' | ''
  console.log(`\nNCERT/Exemplar textbook fetch — ${CLASS_DIR}${FORCE ? ' (force)' : ''}${ONLY.length ? ` (ONLY: ${ONLY.join(',')})` : ''}${TYPE ? ` (TYPE: ${TYPE})` : ''}`)

  const rows = []           // ncert_solutions rows
  const normalized = []     // per subject/part, for the JSON file
  for (const p of PLAN) {
    if (ONLY.length && !ONLY.some((t) => p.slug.includes(t) || p.subject.toLowerCase().includes(t))) continue
    for (const bk of p.books) {
      if (TYPE === 'ncert' && bk.isEx) continue
      if (TYPE === 'exemplar' && !bk.isEx) continue
      console.log(`  • ${p.subject} · part ${bk.part} (${bk.name}) …`)
      const chapters = await fetchBook(bk.uuid, bk.part, p.slug)
      normalized.push({ subject: p.subject, subject_slug: p.slug, part: bk.part, book_match: bk.name, book_uuid: bk.uuid, book_label: bk.name, chapters })
      chapters.forEach((c, ci) => c.sections.forEach((sec, si) => rows.push({
        part: bk.part, subject: p.subject, className: CLASS_NAME, chapter: c.chapter,
        sectionKey: slugify(sec.label) + '-' + si, sectionLabel: sec.label,
        html: sec.html, chapterPos: ci, position: si,
      })))
      console.log(`    → ${chapters.length} chapters, ${chapters.reduce((n, c) => n + c.sections.length, 0)} sections`)
    }
  }

  // Merge into any existing ncert-solutions.json by (subject|part) so partial runs
  // (ONLY/TYPE) refresh just those books without dropping the rest.
  const outPath = path.join(NORM, 'ncert-solutions.json')
  const key = (o) => `${o.subject_slug}|${o.part}`
  let mergedNorm = normalized
  try {
    const prev = JSON.parse(fs.readFileSync(outPath, 'utf8'))
    const map = new Map((Array.isArray(prev) ? prev : []).map((o) => [key(o), o]))
    for (const o of normalized) map.set(key(o), o)
    mergedNorm = Array.from(map.values())
  } catch (_) { /* fresh */ }
  fs.writeFileSync(outPath, JSON.stringify(mergedNorm, null, 2))

  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Books fetched     : ${log.books}`)
  console.log(`  Chapters scanned  : ${log.chapters}`)
  console.log(`  Sections (exers.) : ${log.sections}`)
  console.log(`  Questions         : ${log.questions}`)
  console.log(`  Empty chapters    : ${log.empty}`)
  console.log(`  Errors            : ${log.errors.length}${log.forbidden ? ` (403 login-gated: ${log.forbidden})` : ''}`)
  log.errors.slice(0, 8).forEach((e) => console.log(`     ! ${e}`))
  console.log(`\n  ✓ normalized/ncert-solutions.json (${mergedNorm.length} book-parts; ${rows.length} rows this run)`)
  console.log(`  Raw: data/examin8/${CLASS_DIR}/raw/ncert/`)
  console.log(`  Next: node scripts/examin8/importClass10Ncert.js --live`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
