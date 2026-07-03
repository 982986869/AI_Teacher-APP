'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 7 "Old - हिंदी" MCQ Practice from LOCAL practice data into the
// DB-backed MCQ model:  subjects → chapters(class_level=7) → subtopics → mcq_questions
// (same model/columns as scripts/seedClass7McqPractice.js, but sourced from
// old_hindi/practice_questions/*.json instead of examin8).
//
// Also writes the checkpoint src/data/class7Practice/old-hindi.json so the subject
// matches the rest of the Class 7 MCQ-Practice system.
//
//   node scripts/seedClass7OldHindiPractice.js            # DRY (build + checkpoint, no DB)
//   node scripts/seedClass7OldHindiPractice.js --live     # seed DATABASE_URL (server/.env)
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 7
const SUBJECT = 'Old - हिंदी'
const SRC = path.join(ROOT, 'old_hindi', 'practice_questions')
const CACHE = path.join(ROOT, 'src', 'data', 'class7Practice')

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

// Build the checkpoint doc (same shape as class7Practice/<slug>.json).
function build() {
  const idx = JSON.parse(fs.readFileSync(path.join(SRC, 'index.json'), 'utf8'))
  const chapters = []
  ;(idx.chapters || []).forEach((ch, ci) => {
    const cf = path.join(SRC, ch.file)
    if (!fs.existsSync(cf)) { console.warn('  ! missing practice file:', ch.file); return }
    const cd = JSON.parse(fs.readFileSync(cf, 'utf8'))
    const questions = (cd.questions || []).map((q) => ({
      id: q.id,
      question: esc(q.question) + imgs(q.images),
      difficulty: trim(q.difficulty_label || q.difficulty) || null,
      options: (q.options || []).map((o) => ({ id: o.id, option: esc(o.text) + imgs(o.images) })),
      correctOptionId: q.correct_option_id != null ? q.correct_option_id : null,
      explanation: trim(q.solution) ? esc(q.solution) : '',
    })).filter((q) => q.options.length)
    if (!questions.length) return
    chapters.push({ id: ch.chapter_id, name: trim(ch.chapter_name), position: ci, subtopics: [{ topicId: ch.chapter_id, name: 'Practice Questions', questions }] })
  })
  return { name: SUBJECT, slug: 'old-hindi', res: idx.subject_id, chapters }
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function insertQuestions(client, subtopicId, questions) {
  if (!questions.length) return
  const tuples = [], params = []
  questions.forEach((q, i) => {
    const b = i * 8
    tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8})`)
    params.push(subtopicId, q.id, q.question, q.difficulty, JSON.stringify((q.options || []).map((o) => ({ id: o.id, html: o.option }))), q.correctOptionId, q.explanation || null, i + 1)
  })
  await client.query(`insert into mcq_questions (subtopic_id, source_id, question_html, difficulty, options, correct_option_id, explanation_html, position) values ${tuples.join(',')}`, params)
}

async function main() {
  const doc = build()
  const totQ = doc.chapters.reduce((n, c) => n + c.subtopics[0].questions.length, 0)
  const ans = doc.chapters.reduce((n, c) => n + c.subtopics[0].questions.filter((q) => q.correctOptionId != null).length, 0)
  console.log(`\nClass 7 "Old - हिंदी" MCQ Practice (${LIVE ? 'LIVE' : 'DRY'})`)
  console.log(`  ${doc.chapters.length} chapters · ${totQ} questions · ${ans} answered · slug=${slugify(SUBJECT)}\n`)

  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(path.join(CACHE, 'old-hindi.json'), JSON.stringify(doc, null, 2))
  console.log('  ✓ checkpoint written: src/data/class7Practice/old-hindi.json')

  if (!LIVE) { console.log('\n[DRY] add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')
  try {
    const sub = await client.query(`insert into subjects (name, slug) values ($1,$2) on conflict (slug) do update set name = excluded.name returning id`, [doc.name, slugify(doc.name)])
    const subjectId = sub.rows[0].id
    let cpos = 0, seeded = 0
    for (const ch of doc.chapters) {
      cpos++
      const chp = await client.query(`insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5) on conflict (subject_id, class_level, slug) do update set name = excluded.name, position = excluded.position returning id`, [subjectId, ch.name, slugify(ch.name), CLASS_LEVEL, cpos])
      const chapterId = chp.rows[0].id
      await client.query('delete from subtopics where chapter_id = $1', [chapterId])
      let spos = 0
      for (const st of ch.subtopics) {
        spos++
        const str = await client.query(`insert into subtopics (chapter_id, name, position) values ($1,$2,$3) on conflict (chapter_id, name) do update set position = excluded.position returning id`, [chapterId, st.name, spos])
        await insertQuestions(client, str.rows[0].id, st.questions)
        seeded += st.questions.length
      }
    }
    console.log(`  ✓ ${doc.name}: ${doc.chapters.length} chapters, ${seeded} MCQ questions (class_level=7)`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
