'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import CLASS 11 CHEMISTRY NCERT Solutions (Part-I) into Supabase, mapped into
// the structured schema (supabase/schema.sql) — the SAME generic questions table
// the Class 12 Chemistry / Physics NCERT importers use, so the generic /content
// API + the MathJax card renderer serve them unchanged:
//
//   subject(Chemistry) -> chapter(class_level=11) -> section(ncert1) -> questions
//
//   • ncert1 (questions) ← src/data/chemistry11Ncert1/*.json  (Part-I, 6 files)
//
// Source is the Examin8 per-chapter JSON (identical format to chemistry12Ncert1):
// question_html, solution_html, options[] (with is_correct / explanation), q_no,
// exercise ("Examples" / "Chapter-end"), chapter. We map DIRECTLY via the same
// mapQuestion shape as importChemistry12Extra.js — exercise label is kept in the
// q-number chip ("Examples · Q1"). Math stays {tex}…{/tex}; images keep src.
//
// The Class 11 Chemistry chapters ALREADY EXIST in the DB (created by the
// exemplar / pyq / important importers). This script ATTACHES an ncert1 section
// to those existing chapters by slug — it does NOT reorder them: chapter
// position/name are left untouched on conflict. The book's "Thermodynamics"
// chapter is remapped to the existing "Chemical Thermodynamics" chapter so it
// lands on the right row instead of creating a duplicate.
//
// Usage:
//   node scripts/importChemistry11Ncert.js          # DRY RUN (parse + report)
//   node scripts/importChemistry11Ncert.js --live    # actually insert into Supabase
//
// DB connection is read from server/.env (DATABASE_URL). Re-runnable: each
// section's questions are cleared before re-insert.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'src', 'data')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 11
const SUBJECT = { name: 'Chemistry', slug: 'chemistry' }
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

// ncert1 lives at section_types.position 5 (see supabase/schema.sql).
const SECTION = { type: 'ncert1', position: 5, dir: path.join(DATA, 'chemistry11Ncert1') }

// Book chapter → existing DB chapter name. Only Thermodynamics differs (the DB
// chapter is "Chemical Thermodynamics"); the rest match by slug verbatim.
const NAME_MAP = { Thermodynamics: 'Chemical Thermodynamics' }

// ── Helpers ──────────────────────────────────────────────────────────────────
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const trim = (s) => (s == null ? '' : String(s)).trim()
const firstNonEmpty = (...v) => { for (const x of v) if (trim(x)) return trim(x); return null }
const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const jsonFiles = (dir) => fs.readdirSync(dir)
  .filter((f) => f.toLowerCase().endsWith('.json'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((f) => path.join(dir, f))

const isCorrectOpt = (o, q) =>
  !!o.is_correct ||
  (Array.isArray(q.correct_option_ids) && o.id != null && q.correct_option_ids.includes(o.id))
const hasOptions = (q) => Array.isArray(q.options) && q.options.some((o) => trim(o.html) || trim(o.text))
const optionHtml = (o) => trim(o.html) || (trim(o.text) ? `<p style="display:inline">${trim(o.text)}</p>` : '')

// Map a raw question → a `questions` row (twin of importChemistry12Extra.js).
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

// Each file is an array of questions for one chapter. Preserve file (book) order.
function collect(dir) {
  const order = []
  const byChapter = {}
  for (const file of jsonFiles(dir)) {
    const arr = loadJson(file)
    if (!Array.isArray(arr) || !arr.length || !arr[0].chapter) continue
    const raw = trim(arr[0].chapter)
    const name = NAME_MAP[raw] || raw
    order.push(name)
    byChapter[name] = arr.map((q, i) => mapQuestion(q, i + 1))
  }
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
  const { order, byChapter } = collect(SECTION.dir)

  console.log('\n=== CLASS 11 CHEMISTRY — NCERT PART-I PARSE REPORT ===')
  let grand = 0
  for (const ch of order) {
    const n = byChapter[ch].length
    const mcq = byChapter[ch].filter((q) => q.is_mcq).length
    grand += n
    console.log(`   ${ch.padEnd(52)} ${String(n).padStart(4)} q  (${mcq} mcq)`)
  }
  console.log(`\nGRAND TOTAL: ${grand} questions across ${order.length} chapters (Class 11 Chemistry NCERT Part-I)`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Nothing inserted. Live: node scripts/importChemistry11Ncert.js --live\n')
    return
  }

  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected to Supabase.')
  try {
    const subjectId = (await client.query(
      `insert into subjects (name, slug) values ($1,$2)
       on conflict (slug) do update set name = excluded.name returning id`,
      [SUBJECT.name, SUBJECT.slug]
    )).rows[0].id

    let chapters = 0, items = 0
    for (const name of order) {
      // Attach to the EXISTING chapter by slug. On conflict keep its current
      // position/name untouched (no-op update just to RETURN the id). New rows
      // (none expected) get position = book order.
      const chapterId = (await client.query(
        `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
         on conflict (subject_id, class_level, slug) do update set name = chapters.name
         returning id`,
        [subjectId, name, slugify(name), CLASS_LEVEL, order.indexOf(name) + 1]
      )).rows[0].id

      const sectionId = (await client.query(
        `insert into sections (chapter_id, type_key, position) values ($1,$2,$3)
         on conflict (chapter_id, type_key) do update set position = excluded.position
         returning id`,
        [chapterId, SECTION.type, SECTION.position]
      )).rows[0].id

      await client.query('delete from questions where section_id = $1', [sectionId])
      await insertQuestions(client, sectionId, byChapter[name])
      chapters++
      items += byChapter[name].length
      console.log(`   ✓ ${name.padEnd(52)} ${String(byChapter[name].length).padStart(4)} q`)
    }
    console.log(`\n✓ Class 11 Chemistry NCERT Part-I import complete — ${chapters} chapters, ${items} questions (class_level=11).`)
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
