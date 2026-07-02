'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import CLASS 6 SCIENCE textbook Q&A (Exemplar + Revised) into Supabase, in the
// generic section model the app's Exemplar/NCERT tiles already read:
//
//   subject('Science (OLD)', class_level=6)
//     -> chapter -> section('exemplar_notes') -> questions   (Exemplar book)
//                -> section('ncert2')          -> questions   (Revised book)
//
// Source: server/Class06_Science_Textbooks/{Exemplar,Revised}/NN_<chapter>.json
//   { chapter_name, chapter_uuid, exercises:[{ name, uuid, questions:[raw] }] }
//
// Chapters are matched to the EXISTING db chapters by slug (created by the
// practice/notes import). Textbook chapters with no matching db chapter are
// skipped and logged (e.g. Revised's renamed "Living Organisms" node).
//
//   node scripts/importClass6ScienceTextbooks.js          # DRY RUN
//   node scripts/importClass6ScienceTextbooks.js --live    # insert
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'server', 'Class06_Science_Textbooks')
const LIVE = process.argv.includes('--live')
const SUBJECT_SLUG = 'science-old'
const CLASS_LEVEL = 6
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

const BOOKS = [
  { dir: 'Exemplar', type_key: 'exemplar_notes', position: 2 },
  { dir: 'Revised', type_key: 'ncert2', position: 5 },
]

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const files = (dir) => fs.readdirSync(dir).filter((f) => /^\d\d_.*\.json$/.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
const firstNonEmpty = (...v) => { for (const x of v) if (x && String(x).trim()) return String(x); return null }

// Map one raw textbook question → the `questions` table shape.
function mapQ(q, pos) {
  const opts = Array.isArray(q.options_data) ? q.options_data : []
  const is_mcq = opts.length > 0
  let options = null
  let correct_option = null
  if (is_mcq) {
    options = opts.map((o, i) => {
      const idx = LETTERS[i] || String(i + 1)
      if (o.is_correct && !correct_option) correct_option = idx
      return { idx, html: o.option || '', is_correct: !!o.is_correct }
    })
  }
  const correctOpt = opts.find((o) => o.is_correct)
  const solution_html = firstNonEmpty(
    q.solution_data && q.solution_data[0] && q.solution_data[0].solution,
    q.alternate_solutions_data && q.alternate_solutions_data[0] && q.alternate_solutions_data[0].solution,
    q.num_solutions_data && q.num_solutions_data[0] && q.num_solutions_data[0].solution,
    correctOpt && correctOpt.explanation,
  )
  return {
    q_number: q.name || null,
    year: null,
    question_html: q.question || '',
    is_mcq,
    options,
    correct_option,
    solution_html,
    position: pos,
  }
}

// Collect { book, chapters: [{ chapterName, slug, questions }] }
function collect() {
  return BOOKS.map((book) => {
    const dir = path.join(DATA, book.dir)
    const chapters = files(dir).map((f) => {
      const j = loadJson(path.join(dir, f))
      const flat = []
      for (const ex of j.exercises || [])
        for (const q of ex.questions || []) flat.push(q)
      return {
        chapterName: j.chapter_name,
        slug: slugify(j.chapter_name),
        questions: flat.map((q, i) => mapQ(q, i + 1)),
      }
    })
    return { ...book, chapters }
  })
}

function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

async function insertQuestions(client, sectionId, questions) {
  if (!questions.length) return
  const tuples = [], params = []
  questions.forEach((q, i) => {
    const b = i * 9
    tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9})`)
    params.push(sectionId, q.q_number, q.year, q.question_html, q.is_mcq, q.options ? JSON.stringify(q.options) : null, q.correct_option, q.solution_html, q.position)
  })
  await client.query(
    `insert into questions (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position) values ${tuples.join(',')}`,
    params
  )
}

async function main() {
  const data = collect()
  console.log('\n=== CLASS 6 SCIENCE TEXTBOOKS — PARSE REPORT ===')
  for (const book of data) {
    const q = book.chapters.reduce((s, c) => s + c.questions.length, 0)
    console.log(`\n### ${book.dir} → section '${book.type_key}': ${book.chapters.length} chapters, ${q} questions`)
    book.chapters.forEach((c) => console.log(`   ${c.slug.padEnd(42)} ${String(c.questions.length).padStart(3)} q`))
  }

  if (!LIVE) { console.log('\n[DRY RUN] Kuch insert nahi hua. Live: node scripts/importClass6ScienceTextbooks.js --live\n'); return }

  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected to Supabase.')
  try {
    const subject = (await client.query('select id from subjects where slug=$1', [SUBJECT_SLUG])).rows[0]
    if (!subject) throw new Error(`subject ${SUBJECT_SLUG} not found — run importClass6Science.js first`)

    // db chapters by slug (only those that already exist)
    const chRows = (await client.query('select id, slug from chapters where subject_id=$1 and class_level=$2', [subject.id, CLASS_LEVEL])).rows
    const chBySlug = new Map(chRows.map((r) => [r.slug, r.id]))

    for (const book of data) {
      let inserted = 0, skipped = []
      for (const c of book.chapters) {
        const chapterId = chBySlug.get(c.slug)
        if (!chapterId) { skipped.push(c.slug); continue }
        const secId = (await client.query(
          `insert into sections (chapter_id, type_key, position) values ($1,$2,$3)
           on conflict (chapter_id, type_key) do update set position = excluded.position returning id`,
          [chapterId, book.type_key, book.position]
        )).rows[0].id
        await client.query('delete from questions where section_id = $1', [secId])
        await insertQuestions(client, secId, c.questions)
        inserted++
      }
      console.log(`   ✓ ${book.dir} → ${book.type_key}: ${inserted} chapters inserted${skipped.length ? `, skipped(no db chapter): ${skipped.join(', ')}` : ''}`)
    }
    console.log('\n✓ Textbooks import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
