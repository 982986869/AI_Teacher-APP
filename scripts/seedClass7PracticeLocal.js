'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 7 MCQ Practice for Reasoning & Old-English from LOCAL practice data
// into the DB-backed MCQ model:
//   subjects → chapters(class_level=7) → subtopics → mcq_questions
// (same model/columns as scripts/seedClass7McqPractice.js).
//
// Source: <dir>/practice_questions/<id>_<slug>/questions.json
//   question shape: { id, difficulty, question_text, question_images,
//     options:[{id,label,text,option_images,is_correct}], correct_option_id, solution }
//
// Clean slate: deletes ALL existing subtopics (→ mcq_questions) for each subject's
// class-7 chapters before seeding, so pre-existing MCQ-practice data is replaced.
// Important-Questions sections are in a different table and are NOT touched.
//
//   node scripts/seedClass7PracticeLocal.js            # DRY (build + checkpoints, no DB)
//   node scripts/seedClass7PracticeLocal.js --live     # seed DATABASE_URL (server/.env)
//   ONLY=old-english node scripts/seedClass7PracticeLocal.js --live   # one subject
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 7
const CACHE = path.join(ROOT, 'src', 'data', 'class7Practice')

const SUBJECTS = [
  { name: 'Reasoning & Mental Ability', slug: 'reasoning-mental-ability', dir: 'reason_mental_ability' },
  { name: 'Old - English',              slug: 'old-english',              dir: 'old_english' },
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
const numPrefix = (name) => { const m = String(name).match(/^(\d+)/); return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER }

function build(s) {
  const base = path.join(ROOT, s.dir, 'practice_questions')
  const entries = fs.readdirSync(base)
    .filter((e) => e !== 'index.json' && fs.existsSync(path.join(base, e, 'questions.json')))
    .sort((a, b) => numPrefix(a) - numPrefix(b))
  const chapters = []
  entries.forEach((e, ci) => {
    const cd = JSON.parse(fs.readFileSync(path.join(base, e, 'questions.json'), 'utf8'))
    const questions = (cd.questions || []).map((q) => ({
      id: q.id,
      question: esc(q.question_text) + imgs(q.question_images),
      difficulty: trim(q.difficulty) || null,
      options: (q.options || []).map((o) => ({ id: o.id, option: esc(o.text) + imgs(o.option_images) })),
      correctOptionId: q.correct_option_id != null ? q.correct_option_id : null,
      explanation: trim(q.solution) ? esc(q.solution) : '',
    })).filter((q) => q.options.length && q.correctOptionId != null) // answered-only (all are, here)
    if (!questions.length) return
    chapters.push({ id: cd.chapter_id, name: trim(cd.chapter_name) || e, position: ci, subtopics: [{ topicId: cd.chapter_id, name: 'Practice Questions', questions }] })
  })
  return { name: s.name, slug: s.slug, res: null, chapters }
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
  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  const subjects = ONLY.length ? SUBJECTS.filter((s) => ONLY.some((t) => s.slug.includes(t) || s.name.toLowerCase().includes(t))) : SUBJECTS

  console.log(`\nClass 7 MCQ Practice — local (${LIVE ? 'LIVE' : 'DRY'})\n`)
  fs.mkdirSync(CACHE, { recursive: true })
  const docs = subjects.map((s) => {
    const doc = build(s)
    const totQ = doc.chapters.reduce((n, c) => n + c.subtopics[0].questions.length, 0)
    console.log(`  ${doc.name.padEnd(30)} slug=${slugify(doc.name).padEnd(26)} ${doc.chapters.length} chapters · ${totQ} questions (all answered)`)
    fs.writeFileSync(path.join(CACHE, s.slug + '.json'), JSON.stringify(doc, null, 2))
    return doc
  })
  console.log('\n  ✓ checkpoints written to src/data/class7Practice/')

  if (!LIVE) { console.log('\n[DRY] add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')
  try {
    for (const doc of docs) {
      const sub = await client.query(`insert into subjects (name, slug) values ($1,$2) on conflict (slug) do update set name = excluded.name returning id`, [doc.name, slugify(doc.name)])
      const subjectId = sub.rows[0].id
      // Clean slate: drop ALL existing MCQ-practice (subtopics → mcq_questions) for
      // this subject's class-7 chapters, replacing any pre-existing practice data.
      await client.query('delete from subtopics where chapter_id in (select id from chapters where subject_id = $1 and class_level = $2)', [subjectId, CLASS_LEVEL])
      let cpos = 0, seeded = 0
      for (const ch of doc.chapters) {
        cpos++
        const chp = await client.query(`insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5) on conflict (subject_id, class_level, slug) do update set name = excluded.name, position = excluded.position returning id`, [subjectId, ch.name, slugify(ch.name), CLASS_LEVEL, cpos])
        const chapterId = chp.rows[0].id
        let spos = 0
        for (const st of ch.subtopics) {
          spos++
          const str = await client.query(`insert into subtopics (chapter_id, name, position) values ($1,$2,$3) on conflict (chapter_id, name) do update set position = excluded.position returning id`, [chapterId, st.name, spos])
          await insertQuestions(client, str.rows[0].id, st.questions)
          seeded += st.questions.length
        }
      }
      console.log(`  ✓ ${doc.name}: ${doc.chapters.length} chapters, ${seeded} MCQ questions (class_level=7)`)
    }
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
