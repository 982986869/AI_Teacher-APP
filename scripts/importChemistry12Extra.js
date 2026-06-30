'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import the REMAINING Class 12 CHEMISTRY resources into Supabase, so they can be
// served from the API instead of bundled static files — the exact twin of
// scripts/importPhysics12Extra.js, minus online_test (Chemistry Online Tests stay
// local for now):
//
//   • ncert1   (questions)               ← src/data/chemistry12Ncert1/*.json (5 ch)
//   • ncert2   (questions)               ← src/data/chemistry12Ncert2/*.json (5 ch)
//   • mock     (mock_tests + questions)  ← src/data/chemistry12MockTests/ch*.json (10)
//   • papers   (papers table)            ← src/data/chemistry12Papers/*.json  (~109)
//
// ncert1/ncert2 reuse the chapter→section→questions schema (generic /content API).
// Mock tests reuse the mock_tests raw-SQL tables (class_level=12 separates them
// from Class 11 + the subject column separates them from Physics). Papers use the
// subject-level `papers` table, keyed by (subject, class_level, code).
//
//   node scripts/importChemistry12Extra.js            # DRY RUN (report)
//   node scripts/importChemistry12Extra.js --live      # insert into Supabase
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const { ENSURE_PAPERS_EXT_UID, UPSERT_PAPER_SQL, upsertParams } = require('./lib/papersSchema')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'src', 'data')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 12
const SUBJECT = { name: 'Chemistry', slug: 'chemistry' }

// Distinct id bases from the Physics importer (5000 / 90000000) so the two
// subjects' mock rows never collide on the integer primary keys.
const MOCK_TEST_ID_BASE = 6000
const MOCK_Q_ID_BASE = 92000000

// Canonical NCERT chapter order (matches the PYQ/Important/Practice file order),
// so a chapter's `position` is the same no matter which importer creates it.
const CANON_ORDER = [
  'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'The d- and f- Block Elements',
  'Coordination Compounds', 'Haloalkanes and Haloarenes', 'Alcohols Phenols and Ethers',
  'Aldehydes Ketones and Carboxylic Acids', 'Amines', 'Biomolecules',
]

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const trim = (s) => (s == null ? '' : String(s)).trim()
const firstNonEmpty = (...v) => { for (const x of v) if (trim(x)) return trim(x); return null }
const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const jsonFiles = (dir, re) => fs.readdirSync(dir)
  .filter((f) => f.toLowerCase().endsWith('.json') && (!re || re.test(f)))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((f) => path.join(dir, f))

const CANON_POS = new Map(CANON_ORDER.map((n, i) => [slugify(n), i + 1]))
const chapterPosition = (name) => CANON_POS.get(slugify(name)) || (CANON_ORDER.length + 1)

const isCorrectOpt = (o, q) =>
  !!o.is_correct ||
  (Array.isArray(q.correct_option_ids) && o.id != null && q.correct_option_ids.includes(o.id))
const hasOptions = (q) => Array.isArray(q.options) && q.options.some((o) => trim(o.html) || trim(o.text))
const optionHtml = (o) => trim(o.html) || (trim(o.text) ? `<p style="display:inline">${trim(o.text)}</p>` : '')

// Map a raw question (ncert1/ncert2) → a `questions` row. Keeps the exercise label
// in the q-number chip ("Examples · Q1") to match the bundled NCERT rendering.
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
  const ex = trim(q.exercise)
  const qno = trim(q.q_no)
  const q_number = qno ? (ex ? `${ex} · Q${qno}` : `Q${qno}`) : (ex || null)
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

// ── Question sources keyed by chapter ────────────────────────────────────────
function collectQuestionSources() {
  // ncert1/ncert2: each file is an array of questions for one chapter.
  const fromDir = (dir) => {
    const byChapter = {}
    for (const file of jsonFiles(dir)) {
      const arr = loadJson(file)
      if (!Array.isArray(arr) || !arr.length || !arr[0].chapter) continue
      byChapter[trim(arr[0].chapter)] = arr.map((q, i) => mapQuestion(q, i + 1))
    }
    return byChapter
  }
  // online_test: each file is { chapter, tests:[{ questions:[...] }] }. The named
  // test groupings + paid flags don't fit the generic questions table, so we
  // FLATTEN every chapter's tests into one question list — OnlineTestsScreen then
  // splits it into 5 generic tests (same as Class 12 Physics).
  const fromOnlineDir = (dir) => {
    const byChapter = {}
    for (const file of jsonFiles(dir, /^ch\d+\.json$/i)) {
      const raw = loadJson(file)
      if (!raw || !raw.chapter || !Array.isArray(raw.tests)) continue
      const qs = raw.tests.flatMap((t) => (Array.isArray(t.questions) ? t.questions : []))
      if (!qs.length) continue
      byChapter[trim(raw.chapter)] = qs.map((q, i) => mapQuestion(q, i + 1))
    }
    return byChapter
  }
  return [
    { type: 'ncert1', position: 5, byChapter: fromDir(path.join(DATA, 'chemistry12Ncert1')) },
    { type: 'ncert2', position: 6, byChapter: fromDir(path.join(DATA, 'chemistry12Ncert2')) },
    { type: 'online_test', position: 7, byChapter: fromOnlineDir(path.join(DATA, 'chemistry12OnlineTests')) },
  ]
}

// ── Mock tests (flat question list → CBSE 25/24/6 section split) ─────────────
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
  const dir = path.join(DATA, 'chemistry12MockTests')
  const out = []
  jsonFiles(dir, /^ch\d+\.json$/i).forEach((file, ti) => {
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
      subject: SUBJECT.name,
      name: m.name || `Mock Test ${ti + 1}`,
      duration_min: 90,
      no_of_questions: total,
      instruction: m.instruction || MOCK_INSTRUCTION,
      section_count: total === 55 ? 3 : 1,
      question_count: total,
      questions,
    })
  })
  return out
}

// ── Papers (subject-level board papers + answer-key HTML) ────────────────────
// NOTE: the papers table is keyed by (subject, class_level, code, YEAR). CBSE
// reuses the same `code` (e.g. 56/1/1) every year, so a paper is identified by
// code+year — keying on code alone collapsed 7 years into one row (only 27 of
// 109 files survived). We dedup on `code|year`; a genuine same-code-same-year
// dupe (a few exist) keeps the later file. Counts are reported in the dry run.
function collectPapers() {
  const dir = path.join(DATA, 'chemistry12Papers')
  const seen = new Map()
  let dupes = 0
  const papers = jsonFiles(dir).map((file, i) => {
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
  }).filter((p) => p.ext_uid && p.year != null)
  for (const p of papers) { const k = `${p.code}|${p.year}`; if (seen.has(k)) dupes++; seen.set(k, true) }
  return { papers, distinct: seen.size, dupes }
}

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
  const { papers, distinct, dupes } = collectPapers()

  console.log('\n=== CLASS 12 CHEMISTRY — EXTRA RESOURCES PARSE REPORT ===')
  for (const s of qSources) {
    const chs = Object.keys(s.byChapter)
    const total = chs.reduce((a, c) => a + s.byChapter[c].length, 0)
    console.log(`\n### ${s.type}: ${chs.length} chapters, ${total} questions`)
    for (const c of chs) console.log(`   ${c.padEnd(45)} ${String(s.byChapter[c].length).padStart(4)} q  (pos ${chapterPosition(c)})`)
  }
  console.log(`\n### mock_tests: ${mocks.length} tests`)
  mocks.forEach((m) => console.log(`   #${m.id} ${m.name.padEnd(20)} ${m.questions.length} q (${m.section_count} sec)`))
  console.log(`\n### papers: ${papers.length} files → ${distinct} distinct papers (code+year) (${dupes} same-code+year dupes collapse)`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Live: node scripts/importChemistry12Extra.js --live\n')
    return
  }

  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected to Supabase.')
  try {
    await client.query(fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8'))
    await client.query('alter table mock_tests add column if not exists class_level int not null default 11')
    // `papers` identity is the source ext_uid (uuid), not code+year (idempotent).
    await client.query(ENSURE_PAPERS_EXT_UID)
    console.log('✓ Schema ensured (section_types, papers(code,year), mock_tests.class_level).')

    const subjectId = (await client.query(
      `insert into subjects (name, slug) values ($1,$2)
       on conflict (slug) do update set name = excluded.name returning id`,
      [SUBJECT.name, SUBJECT.slug])).rows[0].id

    // ── Questions: ncert1 / ncert2 ──────────────────────────────────────────
    for (const src of qSources) {
      for (const chapter of Object.keys(src.byChapter)) {
        const chId = (await client.query(
          `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
           on conflict (subject_id, class_level, slug) do update set name = excluded.name returning id`,
          [subjectId, chapter, slugify(chapter), CLASS_LEVEL, chapterPosition(chapter)])).rows[0].id
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
    console.log(`   ✓ mock_tests   ${mocks.length} tests (subject=Chemistry, class_level=12)`)

    // ── Papers ──────────────────────────────────────────────────────────────
    // Upsert-only (no delete): the canonical full Chemistry set (188 incl. PDFs)
    // is owned by scripts/migrateChemistry12Papers.js — don't wipe it here.
    for (const p of papers) {
      await client.query(UPSERT_PAPER_SQL, upsertParams(subjectId, CLASS_LEVEL, p))
    }
    console.log(`   ✓ papers       ${distinct} HTML papers upserted (full set: migrateChemistry12Papers.js)`)
    console.log('\n✓ Class 12 Chemistry extra import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
