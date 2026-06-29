'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import CLASS 12 CHEMISTRY question-bank sections (PYQ + Important Questions)
// into Supabase, into the SAME structured schema the exemplar/notes importer
// (scripts/importChemistry12.js) and the Class 12 Physics set already use:
//
//   subject(Chemistry) -> chapter(class_level=12) -> section(type_key) -> questions
//
//   • pyq                 (type_key) ← src/data/chemistry12Pyq/ch01..ch10.json
//   • important_questions (type_key) ← src/data/chemistry12Important/ch01..ch10.json
//
// These are the SAME bundled JSON files the app currently renders locally, so
// the DB content is byte-for-byte the same questions. The generic resources API
// (getQuestionsByPath → buildFragmentFromQuestions) then serves them unchanged.
//
// Math stays as {tex}…{/tex}; option/solution HTML is preserved. The "badge"
// shown top-right of each card (questions.year, free text) carries the PYQ years
// ("2025, 2023") or the Important weightage ("VSA (Very Short Answer)").
//
// Usage:
//   node scripts/importChemistry12Questions.js            # DRY RUN (parse + report)
//   node scripts/importChemistry12Questions.js --live      # insert into Supabase
//
// DB connection is read from server/.env (DATABASE_URL). Re-runnable: each
// section's rows are cleared before re-insert. Chapter rows are shared with the
// other Class 12 importers (positions preserved on conflict).
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'src', 'data')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 12
const SUBJECT = { name: 'Chemistry', slug: 'chemistry' }

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

// ── Helpers ──────────────────────────────────────────────────────────────────
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const trim = (s) => (s == null ? '' : String(s)).trim()
const firstNonEmpty = (...vals) => { for (const v of vals) if (trim(v)) return trim(v); return null }
const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

// List ./<dir>/*.json sorted by their leading "chNN"/"NN" number.
function jsonFiles(dir) {
  return fs.readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => path.join(dir, f))
}

const hasOptions = (q) => Array.isArray(q.options) && q.options.some((o) => trim(o.html) || trim(o.text))
const optionHtml = (o) => trim(o.html) || (trim(o.text) ? `<p style="display:inline">${trim(o.text)}</p>` : '')

// ── Map one raw question object → a `questions` row ──────────────────────────
// `badge` is the per-section text dropped into questions.year (the top-right
// chip): PYQ → joined years, Important → weightage.
function mapQuestion(q, position, badge) {
  const mcq = hasOptions(q)
  let options = null
  let correct_option = null
  if (mcq) {
    const correctIds = Array.isArray(q.correct_option_ids) ? q.correct_option_ids : []
    options = q.options.map((o, i) => {
      const idx = LETTERS[i] || String(i + 1)
      const isCorrect = !!o.is_correct || (o.id != null && correctIds.includes(o.id))
      if (isCorrect && !correct_option) correct_option = idx
      return { idx, html: optionHtml(o), is_correct: isCorrect }
    })
  }
  const correctOpt = mcq ? q.options.find((o, i) => options[i] && options[i].is_correct) : null
  const solution_html = firstNonEmpty(
    q.solution_html, q.solution, q.explanation,
    correctOpt && correctOpt.explanation
  )
  return {
    q_number: null, // PYQ/Important carry no q_no; the year/weightage chip is the badge
    year: badge,
    question_html: firstNonEmpty(q.question_html, q.question_text) || '',
    is_mcq: mcq,
    options,
    correct_option,
    solution_html,
    position,
  }
}

const pyqBadge = (q) => (Array.isArray(q.years) && q.years.length ? q.years.join(', ') : null)
const importantBadge = (q) => firstNonEmpty(q.weightage)

// ── Collect the two sections, keyed by chapter name (file order = position) ──
function collectSection(dir, badgeOf) {
  const chapters = [] // { name, questions }
  for (const file of jsonFiles(dir)) {
    const arr = loadJson(file)
    if (!Array.isArray(arr) || !arr.length || !arr[0].chapter) continue
    const name = trim(arr[0].chapter)
    chapters.push({ name, questions: arr.map((q, i) => mapQuestion(q, i + 1, badgeOf(q))) })
  }
  return chapters
}

function collect() {
  return [
    { type: 'pyq', label: 'Previous Year Questions', position: 1, chapters: collectSection(path.join(DATA, 'chemistry12Pyq'), pyqBadge) },
    { type: 'important_questions', label: 'Important Questions', position: 2, chapters: collectSection(path.join(DATA, 'chemistry12Important'), importantBadge) },
  ]
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

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const sections = collect()

  console.log('\n=== CLASS 12 CHEMISTRY — PYQ + IMPORTANT PARSE REPORT ===')
  let grandQ = 0
  for (const s of sections) {
    let total = 0, mcq = 0, withAns = 0
    console.log(`\n### ${s.type}`)
    for (const ch of s.chapters) {
      const q = ch.questions.length
      const m = ch.questions.filter((x) => x.is_mcq).length
      const a = ch.questions.filter((x) => x.is_mcq && x.correct_option).length
      total += q; mcq += m; withAns += a
      console.log(`   ${ch.name.padEnd(45)} ${String(q).padStart(4)} q  (${m} mcq, ${a} keyed)`)
    }
    grandQ += total
    console.log(`   ── ${s.chapters.length} chapters, ${total} questions (${mcq} mcq, ${withAns} with answer-key)`)
  }
  console.log(`\nGRAND TOTAL: ${grandQ} questions (Class 12 Chemistry PYQ + Important)`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Nothing inserted. Live: node scripts/importChemistry12Questions.js --live\n')
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
      `insert into subjects (name, slug) values ($1,$2)
       on conflict (slug) do update set name = excluded.name returning id`,
      [SUBJECT.name, SUBJECT.slug]
    )).rows[0].id

    // Make sure the section types exist (idempotent).
    await client.query(
      `insert into section_types (key, label, position) values ('pyq',$1,1),('important_questions',$2,2)
       on conflict (key) do nothing`,
      ['Previous Year Questions', 'Important Questions']
    )

    for (const s of sections) {
      let chapters = 0, items = 0
      for (let i = 0; i < s.chapters.length; i++) {
        const ch = s.chapters[i]
        // Upsert chapter by (subject, class_level, slug) WITHOUT clobbering the
        // position another Class 12 importer may have set (insert sets it; on
        // conflict only the name is refreshed).
        const chapterId = (await client.query(
          `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
           on conflict (subject_id, class_level, slug) do update set name = excluded.name
           returning id`,
          [subjectId, ch.name, slugify(ch.name), CLASS_LEVEL, i + 1]
        )).rows[0].id

        const sectionId = (await client.query(
          `insert into sections (chapter_id, type_key, position) values ($1,$2,$3)
           on conflict (chapter_id, type_key) do update set position = excluded.position
           returning id`,
          [chapterId, s.type, s.position]
        )).rows[0].id

        await client.query('delete from questions where section_id = $1', [sectionId])
        await insertQuestions(client, sectionId, ch.questions)
        chapters++; items += ch.questions.length
      }
      console.log(`   ✓ ${s.type.padEnd(20)} ${chapters} chapters, ${items} questions`)
    }
    console.log('\n✓ Class 12 Chemistry PYQ + Important import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
