'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Phase 2B — Examin8 Last Year Papers extractor (DRY-RUN / read-only; no DB writes).
//
// The website's "Last Year Papers" for a subject come from TWO endpoints:
//
//   1) LIST (PUBLIC — no login):
//        GET /v1/content/category/{subjectCategoryId}/type/3/
//        → { previous_year_papers:[ { uuid, name, year, code, set, title } ],
//            content:[ … downloadable PDF papers … ], name, type, … }
//      The `previous_year_papers[]` array is the HTML-snapshot papers (incl. 2025).
//
//   2) SNAPSHOT (SESSION-GATED — 401 without a login):
//        GET /v1/previous_year_question/paper/data/{uuid}/
//        → { name, year, code, set, has_subscription, is_solution_available,
//            snapshot, answer_snapshot }
//      `snapshot`        = the FULL question-paper HTML (questions, options,
//                          images, marks, {tex}…{/tex} / <span class="math-tex">).
//      `answer_snapshot` = the solution/answer-key HTML.
//
// The snapshot endpoint needs a browser session — provide EXAMIN8_COOKIE +
// EXAMIN8_CSRF (same creds used for revision notes / scripts/buildClass7.js).
// The LIST endpoint is public, so a run WITHOUT creds still discovers every
// paper's metadata (written to the catalog) — it just fetches no snapshot HTML.
//
// HTML is preserved EXACTLY — snapshot/answer_snapshot are stored byte-for-byte
// (no trim, no tag stripping, no image removal, {tex}…{/tex} kept as-is).
//
// Input : data/examin8/class{N}/normalized/subjects.json
// Output: data/examin8/class{N}/raw/last-year-papers/subject-{id}.json  (verbatim list)
//         data/examin8/class{N}/raw/last-year-papers/paper-{uuid}.json  (verbatim snapshot)
//         data/examin8/class{N}/normalized/last-year-papers.json         (import-ready: html papers)
//         data/examin8/class{N}/normalized/last-year-papers-catalog.json (every discovered paper)
//
// Resume: a subject list / paper snapshot whose raw file already exists is not
// re-fetched (unless --force). Cached snapshots keep their HTML across runs.
//
//   EXAMIN8_COOKIE='…' EXAMIN8_CSRF='…' node scripts/examin8/fetchClass10LastYearPapers.js
//   ONLY=mathematics,science node scripts/examin8/fetchClass10LastYearPapers.js --force
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const B = 'https://web.examin8.com/v1'
const DELAY = 130
const FORCE = process.argv.includes('--force')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const OUT = path.join(ROOT, 'data', 'examin8', CLASS_DIR)
const RAW = path.join(OUT, 'raw', 'last-year-papers')
const NORM = path.join(OUT, 'normalized')
const PAPER_TYPE_ID = 3 // examin8 content type for "Last Year Papers"

const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// trim() is used ONLY on short metadata (name/code/title). Snapshot/answer HTML
// is NEVER trimmed or altered — it is stored exactly as the API returns it.
const trim = (s) => (s == null ? '' : String(s)).trim()
const num = (v) => (v == null || v === '' ? null : Number(v))

const log = {
  subjectsScanned: 0, subjectsWithPapers: 0, papersDiscovered: 0,
  snapshotsFetched: 0, importable: 0, skippedNoSnapshot: 0, forbidden: 0, errors: [],
}

async function api(url) {
  const headers = { accept: 'application/json', referer: 'https://web.examin8.com/' }
  if (CSRF) headers['x-csrftoken'] = CSRF
  if (COOKIE) headers.cookie = COOKIE
  const r = await fetch(url, { headers })
  if (r.status === 401 || r.status === 403) {
    const e = new Error(`HTTP ${r.status} (login required — set EXAMIN8_COOKIE/EXAMIN8_CSRF)`); e.forbidden = true; throw e
  }
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

// The subject's Last Year Papers list. PUBLIC — cached; resume reuses raw.
async function fetchPaperList(subjectId) {
  const p = path.join(RAW, `subject-${subjectId}.json`)
  if (!FORCE && fs.existsSync(p)) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch (_) { /* refetch */ }
  }
  const json = await api(`${B}/content/category/${subjectId}/type/${PAPER_TYPE_ID}/`)
  fs.writeFileSync(p, JSON.stringify(json, null, 2))
  await sleep(DELAY)
  return json
}

// One paper's snapshot (question + answer HTML). SESSION-GATED — cached; resume
// reuses raw, so HTML survives across runs even if a later run has no creds.
async function fetchSnapshot(uuid) {
  const p = path.join(RAW, `paper-${uuid}.json`)
  if (!FORCE && fs.existsSync(p)) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch (_) { /* refetch */ }
  }
  const json = await api(`${B}/previous_year_question/paper/data/${uuid}/`)
  fs.writeFileSync(p, JSON.stringify(json, null, 2))
  await sleep(DELAY)
  return json
}

// Build one normalized paper row. HTML fields are copied verbatim (no trim).
// Shape matches scripts/lib/papersSchema.js (ext_uid identity) so importClass10
// can UPSERT it straight into the existing `papers` table.
function normalizePaper(listItem, snapshot, position) {
  const s = snapshot || {}
  const qHtml = s.snapshot != null ? String(s.snapshot) : null            // verbatim
  const aHtml = s.answer_snapshot != null ? String(s.answer_snapshot) : null // verbatim
  const code = trim(listItem.code) || trim(s.code) || null
  return {
    ext_uid: trim(listItem.uuid),
    paper_format: 'html',
    code,
    year: num(listItem.year) != null ? num(listItem.year) : num(s.year),
    set_label: trim(listItem.set) || trim(s.set) || (code ? code.split('/').pop() : null),
    region: null,
    name: trim(listItem.name) || trim(s.name) || null,
    paper_title: trim(listItem.title) || null,
    pdf_file: null,
    question_paper_html: qHtml && qHtml.length ? qHtml : null,
    answer_key_html: aHtml && aHtml.length ? aHtml : null,
    position,
  }
}

async function main() {
  fs.mkdirSync(RAW, { recursive: true })
  const subjectsPath = path.join(NORM, 'subjects.json')
  if (!fs.existsSync(subjectsPath)) {
    console.error(`Missing ${subjectsPath}. Run fetchClass10Metadata.js first.`); process.exit(1)
  }
  let subjects = JSON.parse(fs.readFileSync(subjectsPath, 'utf8'))
  // ONLY=<substr> restricts to matching subject(s), e.g. ONLY=mathematics,science.
  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  if (ONLY.length) subjects = subjects.filter((s) => ONLY.some((t) => String(s.name).toLowerCase().includes(t) || String(s.slug).includes(t)))

  console.log(`\nLast Year Papers fetch — ${CLASS_DIR}${FORCE ? ' (force)' : ''}${ONLY.length ? ` (ONLY: ${ONLY.join(',')})` : ''}`)
  if (!COOKIE || !CSRF) {
    console.log('  ⚠ No EXAMIN8_COOKIE/EXAMIN8_CSRF — the paper LIST is public and will be catalogued,')
    console.log('    but the per-paper snapshot HTML is login-gated and will be skipped.')
    console.log('    To fetch snapshots: EXAMIN8_COOKIE=\'…\' EXAMIN8_CSRF=\'…\' node scripts/examin8/fetchClass10LastYearPapers.js')
  }

  const out = []        // import-ready (papers with question_paper_html)
  const catalog = []    // every discovered paper (metadata + has_snapshot flag)
  for (const subj of subjects) {
    log.subjectsScanned += 1
    let listJson
    try { listJson = await fetchPaperList(subj.category_id) }
    catch (e) { log.errors.push(`list ${subj.name} (${subj.category_id}): ${e.message}`); continue }

    const list = (listJson && Array.isArray(listJson.previous_year_papers)) ? listJson.previous_year_papers : []
    if (!list.length) continue
    log.subjectsWithPapers += 1
    log.papersDiscovered += list.length

    const papers = []
    const catalogPapers = []
    let pos = 0
    for (const item of list) {
      pos += 1
      const uuid = trim(item.uuid)
      if (!uuid) continue
      let snapshot = null
      try { snapshot = await fetchSnapshot(uuid) }
      catch (e) {
        if (e.forbidden) log.forbidden += 1
        else log.errors.push(`snapshot ${subj.name} ${item.year}/${item.code}: ${e.message}`)
      }
      if (snapshot) log.snapshotsFetched += 1
      const p = normalizePaper(item, snapshot, pos)
      catalogPapers.push({
        ext_uid: p.ext_uid, year: p.year, code: p.code, set_label: p.set_label,
        name: p.name, title: p.paper_title, has_snapshot: !!p.question_paper_html,
        has_solution: !!p.answer_key_html,
      })
      if (p.question_paper_html) { papers.push(p); log.importable += 1 }
      else log.skippedNoSnapshot += 1
    }

    catalog.push({ subject: subj.name, subject_slug: subj.slug, subject_category_id: subj.category_id, class_level: num(subj.class_level), papers: catalogPapers })
    if (papers.length) {
      out.push({ subject: subj.name, subject_slug: subj.slug, subject_category_id: subj.category_id, class_level: num(subj.class_level), papers })
      console.log(`  • ${subj.name}: ${papers.length}/${list.length} papers with snapshot HTML`)
    } else {
      console.log(`  • ${subj.name}: ${list.length} papers discovered, 0 snapshots (${COOKIE && CSRF ? 'paid/forbidden' : 'no creds'})`)
    }
  }

  // Merge by subject_slug so a partial run (ONLY=…) refreshes just those subjects
  // without dropping the rest. Cached raw snapshots keep HTML across runs.
  const outPath = path.join(NORM, 'last-year-papers.json')
  const mergeBySlug = (prevArr, nextArr) => {
    const bySlug = new Map((Array.isArray(prevArr) ? prevArr : []).map((s) => [s.subject_slug, s]))
    for (const s of nextArr) bySlug.set(s.subject_slug, s)
    return Array.from(bySlug.values())
  }
  let mergedOut = out
  try { mergedOut = mergeBySlug(JSON.parse(fs.readFileSync(outPath, 'utf8')), out) } catch (_) { /* fresh */ }
  fs.writeFileSync(outPath, JSON.stringify(mergedOut, null, 2))

  const catPath = path.join(NORM, 'last-year-papers-catalog.json')
  let mergedCat = catalog
  try { mergedCat = mergeBySlug(JSON.parse(fs.readFileSync(catPath, 'utf8')), catalog) } catch (_) { /* fresh */ }
  fs.writeFileSync(catPath, JSON.stringify(mergedCat, null, 2))

  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Subjects scanned     : ${log.subjectsScanned}`)
  console.log(`  Subjects with papers : ${log.subjectsWithPapers}`)
  console.log(`  Papers discovered    : ${log.papersDiscovered}`)
  console.log(`  Snapshots fetched    : ${log.snapshotsFetched}`)
  console.log(`  Importable (w/ HTML) : ${log.importable}`)
  console.log(`  Skipped (no snapshot): ${log.skippedNoSnapshot}${log.forbidden ? ` (login-gated: ${log.forbidden})` : ''}`)
  console.log(`  Errors               : ${log.errors.length}`)
  log.errors.slice(0, 8).forEach((e) => console.log(`     ! ${e}`))
  if (log.errors.length > 8) console.log(`     … +${log.errors.length - 8} more`)
  console.log(`\n  ✓ normalized/last-year-papers.json (${mergedOut.length} subjects; ${out.length} refreshed this run)`)
  console.log(`  ✓ normalized/last-year-papers-catalog.json (${mergedCat.length} subjects — all discovered papers)`)
  console.log(`  Raw: data/examin8/${CLASS_DIR}/raw/last-year-papers/`)
  console.log(`  Next: node scripts/examin8/importClass10LastYearPapers.js --live`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
