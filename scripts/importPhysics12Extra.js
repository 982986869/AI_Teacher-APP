'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import the REMAINING Class 12 Physics resources into Supabase, so they can be
// served from the API instead of bundled static files:
//
//   • ncert1       (questions)  ← src/data/physics12Ncert1/*.json   (8 chapters)
//   • ncert2       (questions)  ← src/data/physics12Ncert2/*.json   (6 chapters)
//   • online_test  (questions)  ← extraction pkg Physics_Online_Tests_all.json (14 ch)
//   • mock tests   (mock_tests + mock_test_questions, class_level=12)
//   • papers       (papers table — full board paper + answer key HTML)
//
// ncert1/ncert2/online_test reuse the chapter→section→questions schema (the same
// generic /content API already serves them). Mock tests reuse the existing
// mock_tests raw-SQL tables (a new class_level column separates Class 12 from the
// Class 11 rows). Papers get a new subject-level `papers` table.
//
// Re-runnable; dry-run by default, --live to insert. DB from server/.env.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const { ENSURE_PAPERS_EXT_UID, UPSERT_PAPER_SQL, upsertParams } = require('./lib/papersSchema')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'src', 'data')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 12

// Online-test questions are NOT bundled in the app (the app fetches them from the
// DB via the API). The seed source is the raw extraction package in the sibling
// data-extraction repo. Override with ONLINE_TESTS_SRC=<path> if it moves.
const ONLINE_TESTS_SRC = process.env.ONLINE_TESTS_SRC ||
  'F:/dataExtraction-Class12/scripts/examin8_output/packages/Physics_Online_Tests/Physics_Online_Tests_all.json'

// Safe id bases (existing mock_tests maxid 243, mock_test_questions maxid ~606k).
const MOCK_TEST_ID_BASE = 5000
const MOCK_Q_ID_BASE = 90000000

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const trim = (s) => (s == null ? '' : String(s)).trim()
const firstNonEmpty = (...v) => { for (const x of v) if (trim(x)) return trim(x); return null }
const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const jsonFiles = (dir) => fs.readdirSync(dir)
  .filter((f) => f.toLowerCase().endsWith('.json'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((f) => path.join(dir, f))

// Correct-ness of an option: explicit flag, else membership in correct_option_ids.
const isCorrectOpt = (o, q) =>
  !!o.is_correct ||
  (Array.isArray(q.correct_option_ids) && o.id != null && q.correct_option_ids.includes(o.id))

const hasOptions = (q) => Array.isArray(q.options) && q.options.some((o) => trim(o.html) || trim(o.text))
const optionHtml = (o) => trim(o.html) || (trim(o.text) ? `<p style="display:inline">${trim(o.text)}</p>` : '')

// Map a raw question (ncert1/ncert2/online) → a `questions` row.
function mapQuestion(q, position) {
  const mcq = hasOptions(q)
  let options = null
  let correct_option = null
  if (mcq) {
    options = q.options.map((o, i) => {
      const idx = LETTERS[i] || String(i + 1)
      if (isCorrectOpt(o, q) && !correct_option) correct_option = idx
      return { idx, html: optionHtml(o), is_correct: isCorrectOpt(o, q) }
    })
  }
  const correctOpt = mcq ? q.options.find((o) => isCorrectOpt(o, q)) : null
  const solution_html = firstNonEmpty(
    q.solution_html, q.solution, q.solution_text,
    q.numeric_solution_html, q.numeric_solution_text,
    q.explanation, correctOpt && correctOpt.explanation
  )
  const q_number = q.q_no != null && trim(q.q_no) ? `Q${trim(q.q_no)}` : null
  return {
    q_number,
    year: null,
    question_html: firstNonEmpty(q.question_html, q.question_text) || '',
    is_mcq: mcq,
    options,
    correct_option,
    solution_html,
    position,
  }
}

// Data chapter name → canonical UI chapter name (matches ResourcesScreen's
// Class-12 list, so every section attaches to the same chapter row).
const NAME_ALIAS = {
  'Semiconductor Electronics: Materials, Devices and Simple Circuits': 'Electronic Devices',
  'Ray Optics and Optical': 'Ray Optics and Optical Instruments',
}
const alias = (name) => NAME_ALIAS[name] || name

// ── Collect question sources keyed by chapter ────────────────────────────────
function collectQuestionSources() {
  const fromDir = (dir, flatten) => {
    const byChapter = {}
    for (const file of jsonFiles(dir)) {
      const raw = loadJson(file)
      const arr = flatten ? flatten(raw) : raw
      if (!Array.isArray(arr) || !arr.length) continue
      const chapter = (raw && raw.chapter) || arr[0].chapter
      if (!chapter) continue
      byChapter[alias(chapter)] = arr.map((q, i) => mapQuestion(q, i + 1))
    }
    return byChapter
  }
  // Online tests come from the extraction package's single array file
  // ([{ chapter, tests:[{ questions }] }, …]); flatten each chapter's tests
  // into one question list. (Not bundled in the app — DB is the runtime source.)
  const fromOnlineTestsFile = (file) => {
    const byChapter = {}
    const arr = fs.existsSync(file) ? loadJson(file) : []
    for (const c of Array.isArray(arr) ? arr : []) {
      const qs = (c.tests || []).flatMap((t) => t.questions || [])
      if (!c.chapter || !qs.length) continue
      byChapter[alias(c.chapter)] = qs.map((q, i) => mapQuestion(q, i + 1))
    }
    return byChapter
  }
  return [
    { type: 'ncert1', position: 5, byChapter: fromDir(path.join(DATA, 'physics12Ncert1')) },
    { type: 'ncert2', position: 6, byChapter: fromDir(path.join(DATA, 'physics12Ncert2')) },
    { type: 'online_test', position: 7, byChapter: fromOnlineTestsFile(ONLINE_TESTS_SRC) },
  ]
}

// ── Collect mock tests ───────────────────────────────────────────────────────
const SECTION_SPLIT = [
  { id: 1, name: 'Section A', count: 25 },
  { id: 2, name: 'Section B', count: 24 },
  { id: 3, name: 'Section C', count: 6 },
]
const MOCK_INSTRUCTION =
  'Section A has 25 questions, attempt any 20. Section B has 24 questions, ' +
  'attempt any 20. Section C has 6 questions, attempt any 5. Each question carries equal marks; no negative marking.'

function sectionOf(orderIndex1Based, total) {
  if (total !== 55) return { id: 1, name: 'Section A' }
  let acc = 0
  for (const s of SECTION_SPLIT) { acc += s.count; if (orderIndex1Based <= acc) return { id: s.id, name: s.name } }
  return { id: 3, name: 'Section C' }
}

function collectMockTests() {
  const dir = path.join(DATA, 'physics12MockTests')
  const out = []
  jsonFiles(dir).forEach((file, ti) => {
    const m = loadJson(file)
    if (!m || !Array.isArray(m.questions) || !m.questions.length) return
    const testId = MOCK_TEST_ID_BASE + ti + 1
    const total = m.questions.length
    const questions = m.questions.map((raw, qi) => {
      const opts = Array.isArray(raw.options) ? raw.options : []
      let correctIndex = opts.findIndex((o) => isCorrectOpt(o, raw))
      if (correctIndex < 0) correctIndex = 0
      const sec = sectionOf(qi + 1, total)
      return {
        id: MOCK_Q_ID_BASE + testId * 100 + qi + 1,
        test_id: testId,
        order_index: qi + 1,
        section_id: sec.id,
        section_name: sec.name,
        question: firstNonEmpty(raw.question_text, raw.question_html) || '',
        options: opts.map((o) => ({ id: o.id, text: o.text || '', html: o.html || '', is_correct: isCorrectOpt(o, raw) })),
        correct_option_ids: Array.isArray(raw.correct_option_ids) ? raw.correct_option_ids : [],
        correct_option_texts: raw.correct_option_text ? [raw.correct_option_text] : [],
        correct_index: correctIndex,
        explanation: firstNonEmpty(raw.explanation, raw.solution) || '',
      }
    })
    out.push({
      id: testId,
      subject: 'Physics',
      name: m.name || `Mock Test ${ti + 1}`,
      duration_min: 90,
      no_of_questions: total,
      instruction: MOCK_INSTRUCTION,
      section_count: total === 55 ? 3 : 1,
      question_count: total,
      questions,
    })
  })
  return out
}

// ── Collect papers ───────────────────────────────────────────────────────────
function collectPapers() {
  const dir = path.join(DATA, 'physics12Papers')
  return jsonFiles(dir).map((file, i) => {
    const p = loadJson(file)
    return {
      ext_uid: p.uuid,
      paper_format: 'html',
      code: p.code,
      year: p.year != null ? parseInt(p.year, 10) : null,
      set_label: p.set != null ? String(p.set) : (p.code ? String(p.code).split('/').pop() : null),
      name: p.name || null,
      question_paper_html: p.question_paper_html || null,
      answer_key_html: p.answer_key_html || null,
      position: i + 1,
    }
  }).filter((p) => p.code)
}

// ── DB helpers ───────────────────────────────────────────────────────────────
function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

async function insertQuestions(client, sectionId, questions) {
  if (!questions.length) return
  const tuples = []
  const params = []
  questions.forEach((q, i) => {
    const b = i * 9
    tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9})`)
    params.push(sectionId, q.q_number, q.year, q.question_html, q.is_mcq,
      q.options ? JSON.stringify(q.options) : null, q.correct_option, q.solution_html, q.position)
  })
  await client.query(
    `insert into questions (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position)
     values ${tuples.join(',')}`, params)
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const qSources = collectQuestionSources()
  const mocks = collectMockTests()
  const papers = collectPapers()

  console.log('\n=== CLASS 12 PHYSICS — EXTRA RESOURCES PARSE REPORT ===')
  for (const s of qSources) {
    const chs = Object.keys(s.byChapter)
    const total = chs.reduce((a, c) => a + s.byChapter[c].length, 0)
    console.log(`\n### ${s.type}: ${chs.length} chapters, ${total} questions`)
    for (const c of chs) console.log(`   ${c.padEnd(45)} ${String(s.byChapter[c].length).padStart(4)} q`)
  }
  console.log(`\n### mock_tests: ${mocks.length} tests`)
  mocks.forEach((m) => console.log(`   #${m.id} ${m.name.padEnd(20)} ${m.questions.length} q`))
  console.log(`\n### papers: ${papers.length}`)
  papers.forEach((p) => console.log(`   ${p.code.padEnd(10)} ${p.year} set ${p.set_label}  QP=${(p.question_paper_html || '').length}b AK=${(p.answer_key_html || '').length}b`))

  if (!LIVE) {
    console.log('\n[DRY RUN] Live: node scripts/importPhysics12Extra.js --live\n')
    return
  }

  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected to Supabase.')
  try {
    // Schema (idempotent: seeds new section_types + papers table) + mock class col.
    await client.query(fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8'))
    await client.query('alter table mock_tests add column if not exists class_level int not null default 11')
    // `papers` identity is the source ext_uid (uuid), not code+year (idempotent).
    await client.query(ENSURE_PAPERS_EXT_UID)
    console.log('✓ Schema ensured (section_types, papers(ext_uid), mock_tests.class_level).')

    const subjectId = (await client.query(
      `insert into subjects (name, slug) values ('Physics','physics')
       on conflict (slug) do update set name = excluded.name returning id`)).rows[0].id

    // ── Questions: ncert1 / ncert2 / online_test ────────────────────────────
    for (const src of qSources) {
      let pos = 0
      for (const chapter of Object.keys(src.byChapter)) {
        const chId = (await client.query(
          `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
           on conflict (subject_id, class_level, slug) do update set name = excluded.name returning id`,
          [subjectId, chapter, slugify(chapter), CLASS_LEVEL, ++pos])).rows[0].id
        const secId = (await client.query(
          `insert into sections (chapter_id, type_key, position) values ($1,$2,$3)
           on conflict (chapter_id, type_key) do update set position = excluded.position returning id`,
          [chId, src.type, src.position])).rows[0].id
        await client.query('delete from questions where section_id = $1', [secId])
        await insertQuestions(client, secId, src.byChapter[chapter])
      }
      const n = Object.values(src.byChapter).reduce((a, q) => a + q.length, 0)
      console.log(`   ✓ ${src.type.padEnd(12)} ${Object.keys(src.byChapter).length} chapters, ${n} questions`)
    }

    // ── Mock tests (re-runnable: clear this run's ids first) ─────────────────
    for (const m of mocks) {
      await client.query('delete from mock_test_questions where test_id = $1', [m.id])
      await client.query('delete from mock_tests where id = $1', [m.id])
      await client.query(
        `insert into mock_tests (id, subject, name, duration_min, no_of_questions, instruction, section_count, question_count, class_level)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [m.id, m.subject, m.name, m.duration_min, m.no_of_questions, m.instruction, m.section_count, m.question_count, CLASS_LEVEL])
      // Batch the questions for this test in one insert.
      const tuples = []
      const params = []
      m.questions.forEach((q, i) => {
        const b = i * 10
        tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7}::jsonb,$${b + 8}::jsonb,$${b + 9},$${b + 10})`)
        params.push(q.id, q.test_id, q.order_index, q.section_id, q.section_name, q.question,
          JSON.stringify(q.options), JSON.stringify(q.correct_option_ids), q.correct_index, q.explanation)
      })
      await client.query(
        `insert into mock_test_questions (id, test_id, order_index, section_id, section_name, question, options, correct_option_ids, correct_index, explanation)
         values ${tuples.join(',')}`, params)
    }
    console.log(`   ✓ mock_tests   ${mocks.length} tests (class_level=12)`)

    // ── Papers (upsert-only, no delete) ──────────────────────────────────────
    // The canonical FULL set (109 HTML) is owned by scripts/migratePapers.js
    // (--subject=physics). This in-repo set is a subset, so upsert-only refreshes
    // those rows without wiping the full set.
    for (const p of papers) {
      await client.query(UPSERT_PAPER_SQL, upsertParams(subjectId, CLASS_LEVEL, p))
    }
    console.log(`   ✓ papers       ${papers.length} HTML papers upserted (full set: migratePapers.js)`)
    console.log('\n✓ Extra import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
