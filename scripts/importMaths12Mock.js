'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import CLASS 12 MATHEMATICS Mock Tests into Supabase (mock_tests +
// mock_test_questions raw-SQL tables, class_level=12) — the SAME tables the
// Class 12 Physics mock importer uses, so the DB-backed mock-test API
// (mockTestsApi) can serve them.
//
//   • mock_tests (10 papers) + mock_test_questions (50 MCQ each)
//       ← src/data/maths12MockTests/*.json   (the same JSON the bundled
//         src/data/maths12MockTests.js module imports)
//
// These mocks ALSO ship bundled locally (PracticeScreen reads them offline for
// Class 12 Mathematics). Seeding the DB gives Maths the same DB-backed shape as
// Class 12 Physics so the data is available via the API too.
//
// IDs: the source `mock_id` (219..228) overlaps existing mock_tests ids, so —
// exactly like the Physics importer — we assign safe synthetic ids from a high
// base that can't collide with existing rows OR with the Physics-seeded ids
// (Physics used 5000.. / 90000000..).
//
// Section split follows each paper's instruction: A=20 (attempt 16),
// B=20 (attempt 16), C=10 (attempt 8) → 50 questions.
//
// Usage:
//   node scripts/importMaths12Mock.js          # DRY RUN (parse + report)
//   node scripts/importMaths12Mock.js --live    # actually insert into Supabase
//
// DB connection is read from server/.env (DATABASE_URL). Re-runnable: each test's
// rows (and its questions) are cleared before re-insert.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'src', 'data', 'maths12MockTests')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 12

// Safe id bases — distinct from existing rows and from the Physics seed
// (Physics: mock_tests 5000.., mock_test_questions 90000000..).
const MOCK_TEST_ID_BASE = 5100
const MOCK_Q_ID_BASE = 91000000

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

// 50-question Maths mock → three CBSE sections (else one flat list).
const SECTION_SPLIT = [
  { id: 1, name: 'Section A', count: 20 },
  { id: 2, name: 'Section B', count: 20 },
  { id: 3, name: 'Section C', count: 10 },
]
const MOCK_INSTRUCTION =
  'Section A has 20 questions, attempt any 16. Section B has 20 questions, ' +
  'attempt any 16. Section C has 10 questions, attempt any 8. Each question ' +
  'carries equal marks; no negative marking.'
const SECTION_TOTAL = SECTION_SPLIT.reduce((n, s) => n + s.count, 0) // 50

function sectionOf(orderIndex1Based, total) {
  if (total !== SECTION_TOTAL) return { id: 1, name: 'Section A' }
  let acc = 0
  for (const s of SECTION_SPLIT) { acc += s.count; if (orderIndex1Based <= acc) return { id: s.id, name: s.name } }
  return { id: 3, name: 'Section C' }
}

function collectMockTests() {
  const out = []
  jsonFiles(DATA).forEach((file, ti) => {
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
        correct_index: correctIndex,
        explanation: firstNonEmpty(raw.explanation, raw.solution) || '',
      }
    })
    out.push({
      id: testId,
      subject: 'Mathematics',
      name: m.name || `Mock Test ${ti + 1}`,
      duration_min: 90,
      no_of_questions: total,
      instruction: firstNonEmpty(m.instruction) || MOCK_INSTRUCTION,
      section_count: total === SECTION_TOTAL ? SECTION_SPLIT.length : 1,
      question_count: total,
      questions,
    })
  })
  return out
}

function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

async function main() {
  const mocks = collectMockTests()

  console.log('\n=== CLASS 12 MATHEMATICS — MOCK TESTS PARSE REPORT ===')
  let grand = 0
  mocks.forEach((m) => {
    grand += m.questions.length
    console.log(`   #${m.id}  "${m.name}"  ${m.questions.length} q  (sections: ${m.section_count})`)
  })
  console.log(`\nGRAND TOTAL: ${mocks.length} mock tests, ${grand} questions (Class 12 Mathematics)`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Nothing inserted. Live: node scripts/importMaths12Mock.js --live\n')
    return
  }

  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected to Supabase.')
  try {
    // mock_tests/mock_test_questions are pre-existing raw-SQL tables; ensure the
    // class_level column exists (idempotent, same as the Physics importer).
    await client.query('alter table mock_tests add column if not exists class_level int not null default 11')
    console.log('✓ Schema ensured (mock_tests.class_level).')

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
    console.log(`   ✓ mock_tests   ${mocks.length} tests, ${grand} questions (class_level=12)`)
    console.log('\n✓ Class 12 Mathematics mock-tests import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
