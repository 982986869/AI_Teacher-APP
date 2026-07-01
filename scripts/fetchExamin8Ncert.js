'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Fetch NCERT textbook solutions from examin8 and write per-chapter JSON in the
// SAME shape the importers use (exercise / chapter / question_html / solution_html),
// splitting each chapter's exercise nodes into "Examples" and "Chapter-end".
//
// examin8 pipeline (verified):
//   GET /v1/textbook/chapter/{chUuid}/exercises/
//        -> { chapter_name, exercise_nodes:[{uuid,name}] }   (Examples, Chapter-end)
//   GET /v1/textbook/chapter/{chUuid}/questions/?exercise={nodeUuid}
//        -> { count, next, results:[{ question, solution_data:[{solution}], ... }] }  (paginated)
//
// The chapter LIST endpoint is teacher-only (403 for student accounts), so you
// must supply the chapter UUIDs yourself (from the app / your pipeline).
//
// Config via env (no secrets hardcoded):
//   EXAMIN8_COOKIE  = 'mcsrftoken=...; msessionid=...'
//   EXAMIN8_CSRF    = '<mcsrftoken value>'
//   CHAPTERS_JSON   = path to a JSON file: [{ "uuid":"...", "name":"..." }, ...]
//                     (name optional — the API returns chapter_name)
//   OUT_DIR         = output dir under src/data (e.g. maths6Ncert1)   [required]
//
//   node scripts/fetchExamin8Ncert.js
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const CHAPTERS_JSON = process.env.CHAPTERS_JSON
const OUT_DIR = process.env.OUT_DIR
const BASE = 'https://web.examin8.com/v1/textbook'
const DELAY_MS = 250

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()

async function api(url) {
  const r = await fetch(url, {
    headers: {
      accept: 'application/json',
      'x-csrftoken': CSRF,
      referer: 'https://web.examin8.com/',
      cookie: COOKIE,
    },
  })
  if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url)
  return r.json()
}

// All questions for one exercise node (follows pagination).
async function fetchNodeQuestions(chUuid, nodeUuid) {
  const out = []
  let url = `${BASE}/chapter/${chUuid}/questions/?exercise=${nodeUuid}`
  while (url) {
    const j = await api(url)
    for (const q of (j.results || [])) out.push(q)
    url = j.next || null
    if (url) await sleep(DELAY_MS)
  }
  return out
}

// Section name → normalized bucket: "Examples" or "Chapter-end".
function sectionOf(nodeName) {
  return /example/i.test(nodeName) ? 'Examples' : 'Chapter-end'
}

async function fetchChapter(ch) {
  const meta = await api(`${BASE}/chapter/${ch.uuid}/exercises/`)
  const chapterName = trim(meta.chapter_name) || trim(ch.name) || ch.uuid
  const rows = []
  for (const node of (meta.exercise_nodes || [])) {
    const bucket = sectionOf(node.name)          // Examples | Chapter-end
    const qs = await fetchNodeQuestions(ch.uuid, node.uuid)
    qs.forEach((q, i) => {
      const sol = Array.isArray(q.solution_data) && q.solution_data[0]
        ? q.solution_data[0].solution : (q.solution_html || q.solution || '')
      rows.push({
        exercise: bucket,                        // what the importer splits on
        node_name: trim(node.name),              // original ("Examples ", "Exercise 1.1"…)
        subject: 'Mathematics',                  // override per run if needed
        chapter: chapterName,
        question_id: q.id,
        q_no: q.order != null ? q.order : i + 1,
        question_html: q.question || '',
        solution_html: sol || '',
        options: q.options_data || [],
      })
    })
    await sleep(DELAY_MS)
  }
  return { chapterName, rows }
}

async function main() {
  if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
  if (!OUT_DIR) { console.error('Set OUT_DIR (e.g. maths6Ncert1).'); process.exit(1) }
  if (!CHAPTERS_JSON || !fs.existsSync(CHAPTERS_JSON)) {
    console.error('Set CHAPTERS_JSON to a file: [{ "uuid":"...", "name":"..." }, ...]')
    process.exit(1)
  }
  const chapters = JSON.parse(fs.readFileSync(CHAPTERS_JSON, 'utf8'))
  const outDir = path.join(ROOT, 'src', 'data', OUT_DIR)
  fs.mkdirSync(outDir, { recursive: true })

  let idx = 0, grand = 0
  for (const ch of chapters) {
    idx++
    try {
      const { chapterName, rows } = await fetchChapter(ch)
      const file = path.join(outDir, 'ch' + String(idx).padStart(2, '0') + '.json')
      fs.writeFileSync(file, JSON.stringify(rows))
      const ex = rows.filter((r) => r.exercise === 'Examples').length
      const ce = rows.length - ex
      grand += rows.length
      console.log(`  ch${String(idx).padStart(2, '0')}  ${chapterName.padEnd(38)} ${rows.length} q (Examples ${ex}, Chapter-end ${ce})`)
    } catch (e) {
      console.log(`  ch${String(idx).padStart(2, '0')}  ${(ch.name || ch.uuid)}  FAILED: ${e.message}`)
    }
    await sleep(DELAY_MS)
  }
  console.log(`\nDone: ${idx} chapters, ${grand} questions → src/data/${OUT_DIR}/`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
