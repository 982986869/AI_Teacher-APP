'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import CLASS 12 CHEMISTRY *Practice Questions* (MCQ practice) into Supabase,
// into the SAME tables the Class 11 / Class 12 Physics practice use
// (scripts/importMcqPractice.js, scripts/importPhysics12Practice.js):
//
//   subject(Chemistry) -> chapter(class_level=12) -> subtopic(topic) -> mcq_question
//
// Source: the bundled per-chapter files the app renders today —
//   src/data/chemistry12Practice/ch01..ch10.json   (arrays of MCQs)
//   src/data/chemistry12Practice/answer_key.json    (question_id -> { correctAnswer,
//                                                     correctOptionId, explanation })
// The per-chapter rows carry correct_option_id = null; the real key lives in
// answer_key.json (same split the local module uses), so we JOIN on question_id.
//
// Re-runnable: each subtopic's mcq_questions are cleared before re-insert. Chapter
// rows are shared with the other Class 12 importers (positions preserved).
//
//   node scripts/importChemistry12Practice.js            # DRY RUN (report)
//   node scripts/importChemistry12Practice.js --live      # insert into Supabase
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DIR = path.join(ROOT, 'src', 'data', 'chemistry12Practice')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 12
const SUBJECT = { name: 'Chemistry', slug: 'chemistry' }

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const trim = (s) => (s == null ? '' : String(s)).trim()

// Same tables/shape as scripts/importMcqPractice.js (idempotent).
const SCHEMA = `
create table if not exists subtopics (
  id          bigint generated always as identity primary key,
  chapter_id  bigint not null references chapters(id) on delete cascade,
  name        text not null,
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (chapter_id, name)
);
create table if not exists mcq_questions (
  id                bigint generated always as identity primary key,
  subtopic_id       bigint not null references subtopics(id) on delete cascade,
  source_id         bigint,
  question_html     text not null,
  difficulty        text,
  options           jsonb not null,
  correct_option_id bigint,
  explanation_html  text,
  position          int not null default 0,
  created_at        timestamptz not null default now()
);
create index if not exists idx_subtopics_chapter     on subtopics(chapter_id);
create index if not exists idx_mcq_questions_subtopic on mcq_questions(subtopic_id);
`

function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

function jsonFiles(dir) {
  return fs.readdirSync(dir)
    .filter((f) => /^ch\d+\.json$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => path.join(dir, f))
}

// Read each ch file (NCERT order) → ordered chapters → ordered subtopics(topic) →
// questions, joining the answer key by question_id.
function collect() {
  const answerKey = JSON.parse(fs.readFileSync(path.join(DIR, 'answer_key.json'), 'utf8'))
  const chapters = [] // { name, topics: Map(topicName -> { questions }) }

  for (const file of jsonFiles(DIR)) {
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (!Array.isArray(rows) || !rows.length) continue
    const chName = trim(rows[0].chapter)
    const topics = new Map()
    for (const r of rows) {
      const topicName = trim(r.topic) || 'General'
      if (!topics.has(topicName)) topics.set(topicName, [])
      const ak = answerKey[r.question_id] || answerKey[String(r.question_id)] || {}
      topics.get(topicName).push({
        source_id: r.question_id != null ? r.question_id : null,
        question_html: trim(r.question_html) || trim(r.question_text) || '',
        difficulty: trim(r.difficulty) || null,
        options: (Array.isArray(r.options) ? r.options : []).map((o) => ({ id: o.id, html: o.html || o.text || '' })),
        correct_option_id: r.correct_option_id != null ? r.correct_option_id
          : (ak.correctOptionId != null ? ak.correctOptionId : null),
        explanation_html: trim(r.explanation) || trim(ak.explanation) || null,
      })
    }
    chapters.push({ name: chName, subtopics: [...topics.entries()].map(([name, questions]) => ({ name, questions })) })
  }
  return chapters
}

async function insertQuestions(client, subtopicId, questions) {
  if (!questions.length) return
  const cols = 7
  const tuples = []
  const params = []
  questions.forEach((q, i) => {
    const b = i * cols
    tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},${i + 1})`)
    params.push(
      subtopicId, q.source_id, q.question_html, q.difficulty,
      JSON.stringify(q.options), q.correct_option_id, q.explanation_html
    )
  })
  await client.query(
    `insert into mcq_questions
     (subtopic_id, source_id, question_html, difficulty, options, correct_option_id, explanation_html, position)
     values ${tuples.join(',')}`,
    params
  )
}

async function main() {
  const chapters = collect()
  let totalSub = 0, totalQ = 0, totalAns = 0

  console.log('\n=== CLASS 12 CHEMISTRY — PRACTICE QUESTIONS PARSE REPORT ===')
  for (const ch of chapters) {
    const sub = ch.subtopics.length
    const q = ch.subtopics.reduce((a, s) => a + s.questions.length, 0)
    const ans = ch.subtopics.reduce((a, s) => a + s.questions.filter((x) => x.correct_option_id != null).length, 0)
    totalSub += sub; totalQ += q; totalAns += ans
    console.log(`   ${ch.name.padEnd(42)} ${String(sub).padStart(3)} subtopics, ${String(q).padStart(5)} q (${ans} keyed)`)
  }
  console.log(`\nTOTAL: ${chapters.length} chapters, ${totalSub} subtopics, ${totalQ} questions (${totalAns} with answer-key)`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Nothing inserted. Live: node scripts/importChemistry12Practice.js --live\n')
    return
  }

  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected. Ensuring schema...')
  try {
    await client.query(SCHEMA)
    const subjectId = (await client.query(
      `insert into subjects (name, slug) values ($1,$2)
       on conflict (slug) do update set name = excluded.name returning id`,
      [SUBJECT.name, SUBJECT.slug]
    )).rows[0].id

    let cpos = 0
    for (const ch of chapters) {
      cpos++
      const chapterId = (await client.query(
        `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
         on conflict (subject_id, class_level, slug) do update set name = excluded.name returning id`,
        [subjectId, ch.name, slugify(ch.name), CLASS_LEVEL, cpos]
      )).rows[0].id

      let spos = 0
      for (const st of ch.subtopics) {
        spos++
        const subtopicId = (await client.query(
          `insert into subtopics (chapter_id, name, position) values ($1,$2,$3)
           on conflict (chapter_id, name) do update set position = excluded.position returning id`,
          [chapterId, st.name, spos]
        )).rows[0].id
        await client.query('delete from mcq_questions where subtopic_id = $1', [subtopicId])
        await insertQuestions(client, subtopicId, st.questions)
      }
      console.log(`   ✓ ${ch.name.padEnd(42)} ${ch.subtopics.length} subtopics`)
    }
    console.log(`\n✓ Class 12 Chemistry practice import complete (${totalQ} questions).`)
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
