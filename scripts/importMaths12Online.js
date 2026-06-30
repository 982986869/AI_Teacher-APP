'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import CLASS 12 MATHEMATICS Online Tests into Supabase, mapped into the
// structured schema (supabase/schema.sql) — the SAME generic questions table +
// `online_test` type_key the Class 12 Physics online-test importer uses, so the
// generic /content API serves them unchanged:
//
//   subject(Mathematics) -> chapter(class_level=12) -> section(online_test) -> questions
//
//   • online_test ← src/data/maths12OnlineTests/*.json   (per chapter: tests[] → questions[])
//
// The DB online-test model is FLAT (one bank of questions per chapter — the API
// returns them and OnlineTestsScreen splits into 5), so we flatten every test's
// questions for a chapter into one section. The named test groupings (free/paid)
// are preserved only in the LOCAL bundle (src/data/maths12OnlineTests.js), which
// currently drives the UI. Seeding the DB gives Class 12 Maths the same DB-backed
// online_test shape as Class 12 Physics so the data is available via the API too.
//
// Source is the SAME per-chapter JSON the bundled module imports. We map DIRECTLY;
// math stays as {tex}…{/tex}, images keep their remote src. Chapter positions
// follow the shared canonical NCERT order so this import never reorders the
// notes / exemplar / ncert / pyq / important chapters.
//
// Usage:
//   node scripts/importMaths12Online.js          # DRY RUN (parse + report)
//   node scripts/importMaths12Online.js --live    # actually insert into Supabase
//
// DB connection is read from server/.env (DATABASE_URL). Re-runnable: the
// online_test section's questions are cleared before re-insert.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'src', 'data', 'maths12OnlineTests')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 12
const TYPE_KEY = 'online_test'
const SECTION_POSITION = 7
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

// Shared canonical chapter order → `position` (matches the other Maths importers).
const ORDER = [
  'Relations and Functions',
  'Inverse Trigonometric Functions',
  'Matrices',
  'Determinants',
  'Continuity and Differentiability',
  'Application of Derivatives',
  'Integrals',
  'Application of Integrals',
  'Differential Equations',
  'Vector Algebra',
  'Three Dimensional Geometry',
  'Linear Programming',
  'Probability',
  'Design of QP Set-1',
  'Design of QP Set-2',
  'Appendix 1',
  'Appendix 2',
]
const positionOf = (name) => {
  const i = ORDER.indexOf(name)
  return i >= 0 ? i + 1 : ORDER.length + 1
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const trim = (s) => (s == null ? '' : String(s)).trim()
const firstNonEmpty = (...vals) => { for (const v of vals) if (trim(v)) return trim(v); return null }
const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

function jsonFiles(dir) {
  return fs.readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => path.join(dir, f))
}

const isCorrectOpt = (o, q) =>
  !!o.is_correct ||
  (Array.isArray(q.correct_option_ids) && o.id != null && q.correct_option_ids.includes(o.id))

const hasOptions = (q) => Array.isArray(q.options) && q.options.some((o) => trim(o.html) || trim(o.text))
const optionHtml = (o) => trim(o.html) || (trim(o.text) ? `<p style="display:inline">${trim(o.text)}</p>` : '')

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
    q.solution_html, q.solution, q.explanation,
    correctOpt && correctOpt.explanation
  )
  return {
    q_number: null,
    year: null,
    question_html: firstNonEmpty(q.question_html, q.question_text) || '',
    is_mcq: mcq,
    options,
    correct_option,
    solution_html,
    position,
  }
}

// Flatten each chapter's tests[] → one ordered question bank.
function collect() {
  const byChapter = {}
  for (const file of jsonFiles(DATA)) {
    const c = loadJson(file)
    if (!c || !Array.isArray(c.tests) || !c.chapter) continue
    const flat = []
    c.tests.forEach((t) => {
      if (!Array.isArray(t.questions)) return
      t.questions.forEach((q) => { if (hasOptions(q)) flat.push(q) })
    })
    if (!flat.length) continue
    byChapter[trim(c.chapter)] = flat.map((q, i) => mapQuestion(q, i + 1))
  }
  const order = Object.keys(byChapter).sort((a, b) => positionOf(a) - positionOf(b))
  return { order, byChapter }
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
    params.push(
      sectionId, q.q_number, q.year, q.question_html, q.is_mcq,
      q.options ? JSON.stringify(q.options) : null, q.correct_option, q.solution_html, q.position
    )
  })
  await client.query(
    `insert into questions
     (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position)
     values ${tuples.join(',')}`,
    params
  )
}

async function main() {
  const { order, byChapter } = collect()

  console.log('\n=== CLASS 12 MATHEMATICS — ONLINE TESTS PARSE REPORT ===')
  let grand = 0
  for (const ch of order) {
    grand += byChapter[ch].length
    console.log(`   #${String(positionOf(ch)).padStart(2)} ${ch.padEnd(34)} ${String(byChapter[ch].length).padStart(4)} q`)
  }
  console.log(`\nGRAND TOTAL: ${grand} questions across ${order.length} chapters (Class 12 Mathematics online_test)`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Nothing inserted. Live: node scripts/importMaths12Online.js --live\n')
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
    console.log('✓ Schema ensured (section_types incl. online_test).')

    const subjectId = (await client.query(
      `insert into subjects (name, slug) values ('Mathematics','mathematics')
       on conflict (slug) do update set name = excluded.name returning id`
    )).rows[0].id

    let chapters = 0, items = 0
    for (const name of order) {
      const chapterId = (await client.query(
        `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
         on conflict (subject_id, class_level, slug) do update set name = excluded.name, position = excluded.position
         returning id`,
        [subjectId, name, slugify(name), CLASS_LEVEL, positionOf(name)]
      )).rows[0].id

      const sectionId = (await client.query(
        `insert into sections (chapter_id, type_key, position) values ($1,$2,$3)
         on conflict (chapter_id, type_key) do update set position = excluded.position
         returning id`,
        [chapterId, TYPE_KEY, SECTION_POSITION]
      )).rows[0].id

      await client.query('delete from questions where section_id = $1', [sectionId])
      await insertQuestions(client, sectionId, byChapter[name])
      chapters++
      items += byChapter[name].length
    }
    console.log(`   ✓ ${TYPE_KEY.padEnd(20)} ${chapters} chapters, ${items} questions (class_level=12)`)
    console.log('\n✓ Class 12 Mathematics online-tests import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
