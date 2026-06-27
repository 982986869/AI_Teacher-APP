'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import CLASS 12 CHEMISTRY resources into Supabase, mapped into the structured
// schema (supabase/schema.sql) — the SAME shape the Class 12 Physics importer
// uses, so the generic /content + /notes APIs serve them unchanged:
//
//   subject(Chemistry) -> chapter(class_level=12) -> section(type) -> questions/notes
//
//   • exemplar_notes  (questions) ← src/data/chemistry12Exemplar/*.json  (16 ch)
//   • revision_notes  (notes)     ← src/notes/chemistry12/*.json          (10 ch)
//
// Both sources are clean per-chapter JSON (same format as the Physics set), so we
// map DIRECTLY. Math stays as {tex}…{/tex}; images keep their remote src.
//
// Usage:
//   node scripts/importChemistry12.js          # DRY RUN (parse + report, no writes)
//   node scripts/importChemistry12.js --live    # actually insert into Supabase
//
// DB connection is read from server/.env (DATABASE_URL). Re-runnable: each
// section's rows are cleared before re-insert.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'src', 'data')
const NOTES = path.join(ROOT, 'src', 'notes', 'chemistry12')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 12

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

// ── Helpers ──────────────────────────────────────────────────────────────────
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const trim = (s) => (s == null ? '' : String(s)).trim()
const firstNonEmpty = (...vals) => { for (const v of vals) if (trim(v)) return trim(v); return null }
const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

// List a directory's *.json files sorted by their leading "NN " number.
function jsonFiles(dir) {
  return fs.readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => path.join(dir, f))
}

const hasOptions = (q) => Array.isArray(q.options) && q.options.some((o) => trim(o.html) || trim(o.text))
const optionHtml = (o) => trim(o.html) || (trim(o.text) ? `<p style="display:inline">${trim(o.text)}</p>` : '')

// ── Map one raw question object → a `questions` row ──────────────────────────
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
  // Exemplar MCQs carry the worked solution on the correct option's explanation.
  const correctOpt = mcq ? q.options.find((o) => o.is_correct) : null
  const solution_html = firstNonEmpty(
    q.solution_html, q.solution, q.explanation,
    q.solution_text, q.numeric_solution_html, q.numeric_solution_text,
    correctOpt && correctOpt.explanation
  )
  const q_number = q.q_no != null && trim(q.q_no) ? `Q${trim(q.q_no)}` : null
  return {
    q_number,
    year: null, // exemplar has no year/weightage badge
    question_html: firstNonEmpty(q.question_html, q.question_text) || '',
    is_mcq: mcq,
    options,
    correct_option,
    solution_html,
    position,
  }
}

// ── Flashcards → notes (intro + blocks grouped by topic) ─────────────────────
function cardsToNote(cards) {
  const order = []
  const byTopic = {}
  cards.forEach((card) => {
    const topic = trim(card.topic) || 'Notes'
    if (!byTopic[topic]) { byTopic[topic] = []; order.push(topic) }
    byTopic[topic].push(card)
  })
  const blocks = order.map((topic) => ({
    title: topic,
    html: byTopic[topic]
      .map((c) => `<div class="card">${firstNonEmpty(c.text_html, c.text) || ''}</div>`)
      .join(''),
  }))
  return { intro: 'Revision Notes — Flashcards', blocks }
}

// ── Collect the two section sources, keyed by chapter name ───────────────────
function collect() {
  const questionDir = (dir) => {
    const byChapter = {}
    for (const file of jsonFiles(dir)) {
      const arr = loadJson(file)
      if (!Array.isArray(arr) || !arr.length || !arr[0].chapter) continue
      const chapter = trim(arr[0].chapter) // chem data has stray trailing spaces
      byChapter[chapter] = arr.map((q, i) => mapQuestion(q, i + 1))
    }
    return byChapter
  }

  const notesDir = () => {
    const byChapter = {}
    for (const file of jsonFiles(NOTES)) {
      const arr = loadJson(file)
      if (!Array.isArray(arr) || !arr.length || !arr[0].chapter) continue
      byChapter[trim(arr[0].chapter)] = cardsToNote(arr)
    }
    return byChapter
  }

  // Canonical chapter order comes from the exemplar files (16 chapters, NCERT
  // numbering encoded in the filenames). Notes are a subset of these.
  const exemplar = questionDir(path.join(DATA, 'chemistry12Exemplar'))
  const canonicalOrder = Object.keys(exemplar)

  const sections = [
    { type: 'revision_notes', position: 3, kind: 'notes',     byChapter: notesDir() },
    { type: 'exemplar_notes', position: 4, kind: 'questions', byChapter: exemplar },
  ]

  // Fold any chapters that only appear in notes into the order (shouldn't happen).
  for (const s of sections) {
    for (const ch of Object.keys(s.byChapter)) {
      if (!canonicalOrder.includes(ch)) canonicalOrder.push(ch)
    }
  }

  return { canonicalOrder, sections }
}

// ── DATABASE_URL from server/.env (no secret printed) ────────────────────────
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

async function insertNote(client, sectionId, note) {
  if (!note) return
  await client.query(
    `insert into notes (section_id, intro, blocks) values ($1,$2,$3)`,
    [sectionId, note.intro || null, note.blocks ? JSON.stringify(note.blocks) : null]
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { canonicalOrder, sections } = collect()

  console.log('\n=== CLASS 12 CHEMISTRY — PARSE REPORT ===')
  console.log(`Chapters (canonical order): ${canonicalOrder.length}`)
  let grandQ = 0, grandNotes = 0
  for (const s of sections) {
    if (s.kind === 'notes') {
      const n = Object.keys(s.byChapter).length
      grandNotes += n
      console.log(`\n### ${s.type}: ${n} chapters (notes)`)
      for (const ch of canonicalOrder) {
        if (s.byChapter[ch]) console.log(`   ${ch.padEnd(45)} ${s.byChapter[ch].blocks.length} blocks`)
      }
    } else {
      let total = 0, mcq = 0
      for (const ch of canonicalOrder) {
        const arr = s.byChapter[ch]
        if (arr) { total += arr.length; mcq += arr.filter((q) => q.is_mcq).length }
      }
      grandQ += total
      console.log(`\n### ${s.type}: ${total} questions (${mcq} mcq)`)
      for (const ch of canonicalOrder) {
        const arr = s.byChapter[ch]
        if (arr) console.log(`   ${ch.padEnd(45)} ${String(arr.length).padStart(4)} q`)
      }
    }
  }
  console.log(`\nGRAND TOTAL: ${grandQ} questions, ${grandNotes} note-chapters (Class 12 Chemistry)`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Nothing inserted. Live: node scripts/importChemistry12.js --live\n')
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
      `insert into subjects (name, slug) values ('Chemistry','chemistry')
       on conflict (slug) do update set name = excluded.name returning id`
    )).rows[0].id

    const chapterId = {}
    for (let i = 0; i < canonicalOrder.length; i++) {
      const name = canonicalOrder[i]
      chapterId[name] = (await client.query(
        `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
         on conflict (subject_id, class_level, slug) do update set name = excluded.name, position = excluded.position
         returning id`,
        [subjectId, name, slugify(name), CLASS_LEVEL, i + 1]
      )).rows[0].id
    }
    console.log(`✓ ${canonicalOrder.length} chapters upserted (class_level=12).`)

    for (const s of sections) {
      let chapters = 0, items = 0
      for (const name of canonicalOrder) {
        const content = s.byChapter[name]
        if (!content) continue
        const sectionId = (await client.query(
          `insert into sections (chapter_id, type_key, position) values ($1,$2,$3)
           on conflict (chapter_id, type_key) do update set position = excluded.position
           returning id`,
          [chapterId[name], s.type, s.position]
        )).rows[0].id

        if (s.kind === 'notes') {
          await client.query('delete from notes where section_id = $1', [sectionId])
          await insertNote(client, sectionId, content)
          items += content.blocks.length
        } else {
          await client.query('delete from questions where section_id = $1', [sectionId])
          await insertQuestions(client, sectionId, content)
          items += content.length
        }
        chapters++
      }
      console.log(`   ✓ ${s.type.padEnd(20)} ${chapters} chapters, ${items} ${s.kind === 'notes' ? 'blocks' : 'questions'}`)
    }
    console.log('\n✓ Class 12 Chemistry import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
