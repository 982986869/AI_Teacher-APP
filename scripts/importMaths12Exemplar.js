'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import CLASS 12 MATHEMATICS Exemplar Solutions into Supabase, mapped into the
// structured schema (supabase/schema.sql) — the SAME shape the Class 12 Physics
// & Chemistry exemplar importers use, so the generic /content API serves them
// unchanged:
//
//   subject(Mathematics) -> chapter(class_level=12) -> section(exemplar_notes) -> questions
//
//   • exemplar_notes (questions) ← src/data/maths12Exemplar/*.json  (15 files)
//
// Source is clean per-chapter exemplar JSON (same format as the Physics /
// Chemistry sets): each question carries question_html, solution_html, options[]
// (with is_correct), correct_option_text, etc. We map DIRECTLY. Math stays as
// {tex}…{/tex}; images keep their remote src.
//
// Chapter positions follow NCERT order (1–13); the two "Design of QP" sample
// papers are seeded after (14–15) — they have exemplar data but are not listed
// in the app's Class 12 Maths chapter list, so they stay hidden, harmless.
//
// Usage:
//   node scripts/importMaths12Exemplar.js          # DRY RUN (parse + report)
//   node scripts/importMaths12Exemplar.js --live    # actually insert into Supabase
//
// DB connection is read from server/.env (DATABASE_URL). Re-runnable: each
// section's questions are cleared before re-insert.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'src', 'data', 'maths12Exemplar')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 12
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

// Canonical NCERT Class 12 Maths chapter order → chapter `position`. Keeps the
// 6 chapters already seeded by importMaths12.js (revision notes) at the same
// positions so the two imports don't reorder each other.
const NCERT_ORDER = [
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
]
const positionOf = (name) => {
  const i = NCERT_ORDER.indexOf(name)
  return i >= 0 ? i + 1 : NCERT_ORDER.length + 1
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

const hasOptions = (q) => Array.isArray(q.options) && q.options.some((o) => trim(o.html) || trim(o.text))
const optionHtml = (o) => trim(o.html) || (trim(o.text) ? `<p style="display:inline">${trim(o.text)}</p>` : '')

// ── Map one raw exemplar question → a `questions` row ─────────────────────────
function mapQuestion(q, position) {
  const mcq = hasOptions(q)
  let options = null
  let correct_option = null
  if (mcq) {
    options = q.options.map((o, i) => {
      const idx = LETTERS[i] || String(i + 1)
      if (o.is_correct && !correct_option) correct_option = idx
      return { idx, html: optionHtml(o), is_correct: !!o.is_correct }
    })
  }
  // MCQs carry the worked solution on the correct option's explanation; the
  // descriptive questions carry it in solution_html.
  const correctOpt = mcq ? q.options.find((o) => o.is_correct) : null
  const solution_html = firstNonEmpty(
    q.solution_html, q.solution, q.explanation,
    q.solution_text, q.numeric_solution_html, q.numeric_solution_text,
    correctOpt && correctOpt.explanation
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

// ── Collect questions keyed by chapter name ──────────────────────────────────
function collect() {
  const byChapter = {}
  for (const file of jsonFiles(DATA)) {
    const arr = loadJson(file)
    if (!Array.isArray(arr) || !arr.length || !arr[0].chapter) continue
    const chapter = trim(arr[0].chapter)
    byChapter[chapter] = arr.map((q, i) => mapQuestion(q, i + 1))
  }
  // Order chapters by NCERT position so the report and inserts are stable.
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

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { order, byChapter } = collect()

  console.log('\n=== CLASS 12 MATHEMATICS — EXEMPLAR PARSE REPORT ===')
  let grandQ = 0, grandMcq = 0
  for (const ch of order) {
    const arr = byChapter[ch]
    const mcq = arr.filter((q) => q.is_mcq).length
    grandQ += arr.length; grandMcq += mcq
    console.log(`   #${String(positionOf(ch)).padStart(2)} ${ch.padEnd(36)} ${String(arr.length).padStart(4)} q (${mcq} mcq)`)
  }
  console.log(`\nGRAND TOTAL: ${grandQ} questions (${grandMcq} mcq) across ${order.length} chapters (Class 12 Mathematics exemplar)`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Nothing inserted. Live: node scripts/importMaths12Exemplar.js --live\n')
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
    console.log('✓ Schema ensured.')

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
        [chapterId, 'exemplar_notes', 4]
      )).rows[0].id

      await client.query('delete from questions where section_id = $1', [sectionId])
      await insertQuestions(client, sectionId, byChapter[name])
      chapters++
      items += byChapter[name].length
    }
    console.log(`   ✓ exemplar_notes       ${chapters} chapters, ${items} questions (class_level=12)`)
    console.log('\n✓ Class 12 Mathematics exemplar import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
