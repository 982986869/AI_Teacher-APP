'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 7 "Important Questions" for the two remaining subjects
// (Reasoning & Mental Ability, Old - English) into the generic Practice/Resources
// model:  subjects → chapters(class_level=7) → sections(type_key='important_questions')
//         → questions
//
// Reads LOCAL JSON exported under the repo root (NOT examin8):
//   reason_mental_ability/important_questions/{index.json, <topic>.json}
//   old_english/important_questions/{index.json, <topic>.json}
//
//   node scripts/seedClass7LocalIQ.js            # DRY  — reads files, prints counts, no DB
//   node scripts/seedClass7LocalIQ.js --live     # seed — writes to DATABASE_URL (server/.env)
//   ONLY=old node scripts/seedClass7LocalIQ.js --live   # seed only matching subject(s)
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 7
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f']

// mcqOnly: keep only questions that have options+answers (drops the source's
// answerless subjective VSA/SA/LA stems, e.g. Old-English Writing/Reading tasks).
const SUBJECTS = [
  { name: 'Reasoning & Mental Ability', dir: 'reason_mental_ability' },
  { name: 'Old - English',              dir: 'old_english', mcqOnly: true },
]

const trim = (s) => (s == null ? '' : String(s)).trim()
const norm = (s) => trim(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
const esc = (s) => trim(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// MUST stay byte-identical to the client slugify (src/screens/PracticeScreen.js).
const slugify = (s) => {
  const base = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base) return base
  let h = 5381
  const str = String(s)
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  return 'u' + h.toString(36)
}

// image url → absolute (source arrays are usually already absolute S3 urls)
const absUrl = (u, base) => { u = trim(u); if (!u) return ''; return /^https?:\/\//.test(u) ? u : (trim(base) + u) }
const imgs = (arr, base) => (Array.isArray(arr) ? arr : []).map((u) => `<img src="${absUrl(u, base)}" alt="" />`).join('')

// Map one source IQ (local export shape) → questions-table row.
function mapQ(q, i, base) {
  const opts = Array.isArray(q.options) ? q.options : []
  const mcq = opts.length > 0
  let options = null, correct_option = null
  if (mcq) {
    options = opts.map((o, k) => {
      const idx = LETTERS[k] || String(k + 1)
      if (o.is_correct && !correct_option) correct_option = idx
      const html = esc(o.text) + imgs(o.option_images, base)
      return { idx, html, is_correct: !!o.is_correct }
    })
  }
  const question_html = esc(q.question_text) + imgs(q.question_images, base)
  let solution_html = esc(q.explanation_text) + imgs(q.explanation_images, base)
  if (!trim(q.explanation_text) && q.correct_answer != null) solution_html = esc(q.correct_answer) + imgs(q.explanation_images, base)
  const badge = trim(q.type).split('(')[0].trim() || null   // "VSA (Very Short Answer)" → "VSA"
  return { q_number: `Q${i + 1}`, year: badge, question_html, is_mcq: mcq, options, correct_option, solution_html, position: i }
}

// Read a subject's local important_questions folder → { chapterName: {position, questions[]} }
function readSubject(s) {
  const dir = path.join(ROOT, s.dir, 'important_questions')
  const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'))
  const base = index.media_base_url || ''
  const topics = index.topics || []
  const byChapter = {}
  let pos = 0
  for (const t of topics) {
    const file = t.file || `${t.id}_${slugify(t.name)}.json`
    const fp = path.join(dir, file)
    if (!fs.existsSync(fp)) { console.warn(`  ! missing topic file: ${file}`); continue }
    const td = JSON.parse(fs.readFileSync(fp, 'utf8'))
    let qsrc = td.questions || []
    if (s.mcqOnly) qsrc = qsrc.filter((q) => Array.isArray(q.options) && q.options.length > 0)
    const questions = qsrc.map((q, i) => mapQ(q, i, base))
    if (questions.length) byChapter[norm(t.name)] = { position: pos++, questions }
  }
  return { subjectId: index.subject_id, grade: index.grade, byChapter }
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
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
    params)
}

async function main() {
  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  const subjects = ONLY.length ? SUBJECTS.filter((s) => ONLY.some((t) => s.name.toLowerCase().includes(t) || s.dir.includes(t))) : SUBJECTS

  const data = []
  console.log(`\nClass ${CLASS_LEVEL} local Important-Questions import (${LIVE ? 'LIVE' : 'DRY'})\n`)
  for (const s of subjects) {
    const { grade, byChapter } = readSubject(s)
    const chapters = Object.keys(byChapter)
    const total = chapters.reduce((n, c) => n + byChapter[c].questions.length, 0)
    const mcq = chapters.reduce((n, c) => n + byChapter[c].questions.filter((q) => q.is_mcq).length, 0)
    const withSol = chapters.reduce((n, c) => n + byChapter[c].questions.filter((q) => trim(q.solution_html)).length, 0)
    console.log(`  ${s.name.padEnd(30)} slug=${slugify(s.name).padEnd(26)} [${grade || '?'}]`)
    console.log(`    ${chapters.length} chapters · ${total} questions · ${mcq} MCQ · ${withSol} with solution`)
    data.push({ ...s, byChapter })
  }

  if (!LIVE) { console.log('\n[DRY] No DB written. Add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected to DB.')
  try {
    for (const s of data) {
      const sub = await client.query(
        `insert into subjects (name, slug) values ($1,$2) on conflict (slug) do update set name = excluded.name returning id`,
        [s.name, slugify(s.name)])
      const subjectId = sub.rows[0].id
      // clean slate for THIS subject's Class 7 chapters (cascades sections/questions)
      await client.query('delete from chapters where subject_id = $1 and class_level = $2', [subjectId, CLASS_LEVEL])
      let ci = 0, items = 0
      for (const chName of Object.keys(s.byChapter)) {
        const info = s.byChapter[chName]
        const chp = await client.query(
          `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
           on conflict (subject_id, class_level, slug) do update set name = excluded.name, position = excluded.position returning id`,
          [subjectId, chName, slugify(chName), CLASS_LEVEL, info.position])
        const chapterId = chp.rows[0].id
        const sec = await client.query(
          `insert into sections (chapter_id, type_key, position) values ($1,'important_questions',6)
           on conflict (chapter_id, type_key) do update set position = excluded.position returning id`,
          [chapterId])
        const sectionId = sec.rows[0].id
        await client.query('delete from questions where section_id = $1', [sectionId])
        await insertQuestions(client, sectionId, info.questions)
        ci++; items += info.questions.length
      }
      console.log(`  ✓ ${s.name}: ${ci} chapters, ${items} questions (class_level=${CLASS_LEVEL})`)
    }
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
