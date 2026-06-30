'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import CLASS 12 MATHEMATICS NCERT Solutions (Part-I & Part-II) into Supabase,
// mapped into the structured schema (supabase/schema.sql) — the SAME generic
// questions table the Class 12 Physics NCERT importer uses, so the generic
// /content API + the MathJax-card renderer serve them unchanged:
//
//   subject(Mathematics) -> chapter(class_level=12) -> section(ncert1|ncert2) -> questions
//
//   • ncert1 (questions) ← src/data/maths12Ncert1/*.json  (Part-I,  8 files)
//   • ncert2 (questions) ← src/data/maths12Ncert2/*.json  (Part-II, 7 files)
//
// Source is clean per-chapter NCERT JSON (same format as the exemplar set):
// question_html, solution_html, options[] (with is_correct), q_no, etc. We map
// DIRECTLY. Math stays as {tex}…{/tex}; images keep their remote src.
//
// Chapter positions follow the shared canonical order (NCERT 1–13, Design of QP
// 14–15, Appendices 16–17) so the notes / exemplar / ncert imports never reorder
// each other.
//
// Usage:
//   node scripts/importMaths12Ncert.js          # DRY RUN (parse + report)
//   node scripts/importMaths12Ncert.js --live    # actually insert into Supabase
//
// DB connection is read from server/.env (DATABASE_URL). Re-runnable: each
// section's questions are cleared before re-insert.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 12
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

const SOURCES = [
  { type: 'ncert1', position: 1, dir: path.join(ROOT, 'src', 'data', 'maths12Ncert1') },
  { type: 'ncert2', position: 2, dir: path.join(ROOT, 'src', 'data', 'maths12Ncert2') },
]

// Shared canonical chapter order → `position` (matches importMaths12Exemplar).
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

const hasOptions = (q) => Array.isArray(q.options) && q.options.some((o) => trim(o.html) || trim(o.text))
const optionHtml = (o) => trim(o.html) || (trim(o.text) ? `<p style="display:inline">${trim(o.text)}</p>` : '')

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

function collect(dir) {
  const byChapter = {}
  for (const file of jsonFiles(dir)) {
    const arr = loadJson(file)
    if (!Array.isArray(arr) || !arr.length || !arr[0].chapter) continue
    const chapter = trim(arr[0].chapter)
    byChapter[chapter] = arr.map((q, i) => mapQuestion(q, i + 1))
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
  const parsed = SOURCES.map((s) => ({ ...s, ...collect(s.dir) }))

  console.log('\n=== CLASS 12 MATHEMATICS — NCERT PARSE REPORT ===')
  let grand = 0
  for (const s of parsed) {
    let total = 0
    console.log(`\n### ${s.type} (Part-${s.type === 'ncert1' ? 'I' : 'II'})`)
    for (const ch of s.order) {
      total += s.byChapter[ch].length
      console.log(`   #${String(positionOf(ch)).padStart(2)} ${ch.padEnd(34)} ${String(s.byChapter[ch].length).padStart(4)} q`)
    }
    grand += total
    console.log(`   — ${total} questions across ${s.order.length} chapters`)
  }
  console.log(`\nGRAND TOTAL: ${grand} questions (Class 12 Mathematics NCERT Part-I + Part-II)`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Nothing inserted. Live: node scripts/importMaths12Ncert.js --live\n')
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

    for (const s of parsed) {
      let chapters = 0, items = 0
      for (const name of s.order) {
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
          [chapterId, s.type, s.position]
        )).rows[0].id

        await client.query('delete from questions where section_id = $1', [sectionId])
        await insertQuestions(client, sectionId, s.byChapter[name])
        chapters++
        items += s.byChapter[name].length
      }
      console.log(`   ✓ ${s.type.padEnd(8)} ${chapters} chapters, ${items} questions (class_level=12)`)
    }
    console.log('\n✓ Class 12 Mathematics NCERT import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
