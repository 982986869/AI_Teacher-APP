'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 7 "Old - हिंदी" — Phase 1: Important Questions + NCERT book solutions.
//   • Important Questions  → Model B (subjects/chapters(class_level=7)/
//                            sections type_key='important_questions'/questions)
//   • NCERT Solutions      → Model A (ncert_solutions, ncert2 flow, className='Class 7')
//        - वसंत भाग-२          → part 2   (15 chapters)
//        - बाल महाभारत कथा     → part 6   (1 chapter)   ← separate tile
//
// Reads LOCAL old_hindi/ exports (shape: question/options[{text,is_correct,
// explanation,images}]/solution/images — all absolute URLs).
//
//   node scripts/seedClass7OldHindi.js            # DRY (build + report, no DB)
//   node scripts/seedClass7OldHindi.js --live     # seed DATABASE_URL (server/.env)
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
const SUBJECT = 'Old - हिंदी'
const CLASS_NAME = 'Class 7'
const CLASS_LEVEL = 7
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f']

const NCERT_BOOKS = [
  { folder: 'class-07-हिंदी-वसंत-भाग-२-revised',        part: 2, label: 'वसंत भाग-२' },
  { folder: 'class-07-हिंदी-बाल-महाभारत-कथा-revised',   part: 6, label: 'बाल महाभारत कथा' },
]

const trim = (s) => (s == null ? '' : String(s)).trim()
const esc = (s) => trim(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const slugify = (s) => {
  const base = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base) return base
  let h = 5381; const str = String(s)
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  return 'u' + h.toString(36)
}
const imgs = (arr) => (Array.isArray(arr) ? arr : []).map((u) => `<img src="${trim(u)}" alt="" />`).join('')

// ── Model B mapping (Important Questions) ───────────────────────────────────
function mapIQ(q, i) {
  const opts = Array.isArray(q.options) ? q.options : []
  const mcq = opts.length > 0
  let options = null, correct_option = null
  if (mcq) {
    options = opts.map((o, k) => {
      const idx = LETTERS[k] || String(k + 1)
      if (o.is_correct && !correct_option) correct_option = idx
      return { idx, html: esc(o.text) + imgs(o.images), is_correct: !!o.is_correct }
    })
  }
  let solution_html = trim(q.solution) ? esc(q.solution) : ''
  if (!solution_html) { const co = opts.find((o) => o.is_correct); if (co && trim(co.explanation)) solution_html = esc(co.explanation) }
  return { q_number: `Q${i + 1}`, year: null, question_html: esc(q.question) + imgs(q.images), is_mcq: mcq, options, correct_option, solution_html, position: i }
}

// ── Model A card (NCERT Solutions) — matches Ncert2Screen WebView CSS ────────
function ncertCard(q, i) {
  const qh = `<p>${esc(q.question)}</p>` + imgs(q.images)
  const sh = trim(q.solution) ? `<p>${esc(q.solution)}</p>` : ''
  const sol = sh ? `<div class="answer-section"><div class="solution-block"><div class="label">Solution</div><div>${sh}</div></div></div>` : ''
  return `<div class="question-card"><div class="question-header"><span class="q-number">Q ${i + 1}</span></div><div class="question-body"><div class="question-text">${qh}</div></div>${sol}</div>`
}

function readIQ() {
  const dir = path.join(ROOT, 'old_hindi', 'important_questions')
  const idx = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'))
  const byChapter = {}
  let pos = 0
  for (const t of (idx.topics || [])) {
    const fp = path.join(dir, t.file)
    if (!fs.existsSync(fp)) { console.warn('  ! missing IQ file:', t.file); continue }
    const td = JSON.parse(fs.readFileSync(fp, 'utf8'))
    const questions = (td.questions || []).map((q, i) => mapIQ(q, i))
    if (questions.length) byChapter[trim(t.topic_name)] = { position: pos++, questions }
  }
  return byChapter
}

function readBook(book) {
  const dir = path.join(ROOT, 'old_hindi', 'ncert_solutions', book.folder)
  const idx = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'))
  const rows = []
  let totalQ = 0, withSol = 0
  ;(idx.chapters || []).forEach((ch, ci) => {
    const cf = path.join(dir, ch.file)
    if (!fs.existsSync(cf)) { console.warn('  ! missing chapter file:', ch.file); return }
    const cd = JSON.parse(fs.readFileSync(cf, 'utf8'))
    ;(cd.exercises || []).forEach((ex, si) => {
      const qs = ex.questions || []
      const cards = qs.map((q, i) => { if (trim(q.solution)) withSol++; totalQ++; return ncertCard(q, i) })
      if (!cards.length) return
      rows.push({
        part: book.part, subject: SUBJECT, className: CLASS_NAME,
        chapter: trim(ch.chapter_name),
        sectionKey: slugify(ex.exercise_name || 'section') + '-' + si,
        sectionLabel: trim(ex.exercise_name || 'Questions'),
        html: cards.join('\n'), chapterPos: ci, position: si,
      })
    })
  })
  return { rows, chapters: (idx.chapters || []).length, totalQ, withSol }
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
  await client.query(`insert into questions (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position) values ${tuples.join(',')}`, params)
}

async function main() {
  console.log(`\nClass 7 "Old - हिंदी" — IQ + NCERT books (${LIVE ? 'LIVE' : 'DRY'})\n`)

  const iq = readIQ()
  const iqChapters = Object.keys(iq)
  const iqTotal = iqChapters.reduce((n, c) => n + iq[c].questions.length, 0)
  console.log(`  Important Questions:  ${iqChapters.length} chapters · ${iqTotal} questions (slug=${slugify(SUBJECT)})`)

  const books = NCERT_BOOKS.map((b) => ({ book: b, ...readBook(b) }))
  books.forEach((b) => console.log(`  NCERT ${b.book.label.padEnd(18)} part=${b.book.part}  ${b.chapters} ch · ${b.rows.length} sections · ${b.totalQ} Q · ${b.withSol} with solution`))
  const ncertRows = books.flatMap((b) => b.rows)

  if (!LIVE) { console.log(`\n[DRY] IQ:${iqTotal}Q  NCERT:${ncertRows.length} rows. Add --live to seed.`); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected to DB.')
  try {
    // ── Model B: Important Questions ──
    const sub = await client.query(`insert into subjects (name, slug) values ($1,$2) on conflict (slug) do update set name = excluded.name returning id`, [SUBJECT, slugify(SUBJECT)])
    const subjectId = sub.rows[0].id
    await client.query('delete from chapters where subject_id = $1 and class_level = $2', [subjectId, CLASS_LEVEL])
    let ci = 0, items = 0
    for (const chName of Object.keys(iq)) {
      const info = iq[chName]
      const chp = await client.query(`insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5) on conflict (subject_id, class_level, slug) do update set name = excluded.name, position = excluded.position returning id`, [subjectId, chName, slugify(chName), CLASS_LEVEL, info.position])
      const sec = await client.query(`insert into sections (chapter_id, type_key, position) values ($1,'important_questions',6) on conflict (chapter_id, type_key) do update set position = excluded.position returning id`, [chp.rows[0].id])
      await client.query('delete from questions where section_id = $1', [sec.rows[0].id])
      await insertQuestions(client, sec.rows[0].id, info.questions)
      ci++; items += info.questions.length
    }
    console.log(`  ✓ Important Questions: ${ci} chapters, ${items} questions (class_level=7)`)

    // ── Model A: NCERT book solutions ──
    for (const b of NCERT_BOOKS) await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [b.part, SUBJECT, CLASS_NAME])
    for (const r of ncertRows) {
      await client.query(`insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [r.part, r.subject, r.className, r.chapter, r.sectionKey, r.sectionLabel, r.html, r.chapterPos, r.position])
    }
    console.log(`  ✓ NCERT Solutions: ${ncertRows.length} ncert_solutions rows`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
