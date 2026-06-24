'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import MCQ Practice content into Supabase:
//   subject -> chapter -> subtopic -> mcq_question
// Source: src/data/chemistry_questions/*.by_topic.json
//   { chapter_id, chapter_name, topics: [{ topicId, topicName, count,
//       questions: [{ id, question, difficulty, options:[{id, option}],
//                     correctOptionId, correctAnswer, explanation }] }] }
//
// Creates the `subtopics` and `mcq_questions` tables (idempotent), links to the
// existing `subjects`/`chapters`. Re-runnable per subtopic.
//
//   node scripts/importMcqPractice.js          # DRY RUN (parse + report)
//   node scripts/importMcqPractice.js --live    # insert into Supabase
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
// --only=<slug> imports just that subject (e.g. --only=mathematics). Default: all.
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1] || null

// Subjects whose subtopic-grouped exports exist (answer-key present).
const SOURCES = [
  { subject: 'Chemistry', slug: 'chemistry', dir: 'chemistry_questions' },
  // Maths activates once maths_questions/*.by_topic.json exist
  // (note: maths subtopic ids return wrong content on the live API — disabled).
  { subject: 'Mathematics', slug: 'mathematics', dir: 'maths_questions' },
  // Biology: from biology_practice.zip (subtopics + answers already present).
  { subject: 'Biology', slug: 'biology', dir: 'biology_practice' },
  // Physics: subtopics from physics_practice + answers merged from answer_key
  // (run scripts/mergePhysicsAnswers.js first).
  { subject: 'Physics', slug: 'physics', dir: 'physics_practice' },
]

const slugify = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

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
  options           jsonb not null,        -- [{ id, html }]
  correct_option_id bigint,                -- matches an option's id
  explanation_html  text,
  position          int not null default 0,
  created_at        timestamptz not null default now()
);
create table if not exists mcq_attempts (
  id                 bigint generated always as identity primary key,
  user_id            uuid not null references users(id) on delete cascade,
  question_id        bigint not null references mcq_questions(id) on delete cascade,
  subtopic_id        bigint not null references subtopics(id) on delete cascade,
  selected_option_id bigint,
  is_correct         boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, question_id)
);
create index if not exists idx_subtopics_chapter      on subtopics(chapter_id);
create index if not exists idx_mcq_questions_subtopic  on mcq_questions(subtopic_id);
create index if not exists idx_mcq_attempts_user_sub   on mcq_attempts(user_id, subtopic_id);
`

function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

// Collect subject -> [{ chapter, subtopics: [{ name, questions: [...] }] }]
function collect() {
  const srcs = ONLY ? SOURCES.filter((s) => s.slug === ONLY) : SOURCES
  return srcs.map((src) => {
    const dir = path.join(ROOT, 'src', 'data', src.dir)
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.by_topic.json'))
    const chapters = files.map((f) => {
      const j = require(path.join(dir, f))
      const subtopics = (j.topics || []).map((t) => ({
        name: t.topicName,
        questions: (t.questions || []).map((q) => ({
          source_id: q.id,
          question_html: q.question || '',
          difficulty: q.difficulty || null,
          // option text field varies by source: chem/maths use `option`,
          // physics_practice uses `text`/`html`.
          options: (q.options || []).map((o) => ({ id: o.id, html: o.option || o.text || o.html || '' })),
          correct_option_id: q.correctOptionId != null ? q.correctOptionId : null,
          explanation_html: q.explanation || null,
        })),
      }))
      return { chapter: j.chapter_name, subtopics }
    })
    return { ...src, chapters }
  })
}

// Bulk-insert a subtopic's questions in one round-trip.
async function insertQuestions(client, subtopicId, questions) {
  if (!questions.length) return
  const cols = 7
  const tuples = []
  const params = []
  questions.forEach((q, i) => {
    const b = i * cols
    tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7})`)
    params.push(
      subtopicId, q.source_id, q.question_html, q.difficulty,
      JSON.stringify(q.options), q.correct_option_id, q.explanation_html
    )
  })
  // position = ordinal within the batch
  const withPos = tuples.map((t, i) => t.replace(/\)$/, `,${i + 1})`))
  await client.query(
    `insert into mcq_questions
     (subtopic_id, source_id, question_html, difficulty, options, correct_option_id, explanation_html, position)
     values ${withPos.join(',')}`,
    params
  )
}

async function main() {
  const data = collect()

  let totalSub = 0, totalQ = 0, totalWithAns = 0
  for (const src of data) {
    let q = 0, sub = 0, ans = 0
    for (const ch of src.chapters) {
      for (const st of ch.subtopics) {
        sub++
        for (const question of st.questions) {
          q++
          if (question.correct_option_id != null) ans++
        }
      }
    }
    totalSub += sub; totalQ += q; totalWithAns += ans
    console.log(`\n### ${src.subject}: ${src.chapters.length} chapters, ${sub} subtopics, ${q} questions (${ans} with answer)`)
  }
  console.log(`\nTOTAL: ${totalSub} subtopics, ${totalQ} questions, ${totalWithAns} with answer-key`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Kuch insert nahi hua. Live: node scripts/importMcqPractice.js --live\n')
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
    for (const src of data) {
      const subRes = await client.query(
        `insert into subjects (name, slug) values ($1,$2)
         on conflict (slug) do update set name = excluded.name returning id`,
        [src.subject, src.slug]
      )
      const subjectId = subRes.rows[0].id
      console.log(`\n--- ${src.subject} ---`)
      let cpos = 0
      for (const ch of src.chapters) {
        cpos++
        const chRes = await client.query(
          `insert into chapters (subject_id, name, slug, position) values ($1,$2,$3,$4)
           on conflict (subject_id, slug) do update set name = excluded.name returning id`,
          [subjectId, ch.chapter, slugify(ch.chapter), cpos]
        )
        const chapterId = chRes.rows[0].id
        let spos = 0
        for (const st of ch.subtopics) {
          spos++
          const stRes = await client.query(
            `insert into subtopics (chapter_id, name, position) values ($1,$2,$3)
             on conflict (chapter_id, name) do update set position = excluded.position returning id`,
            [chapterId, st.name, spos]
          )
          const subtopicId = stRes.rows[0].id
          await client.query('delete from mcq_questions where subtopic_id = $1', [subtopicId])
          await insertQuestions(client, subtopicId, st.questions)
        }
        console.log(`   ✓ ${ch.chapter}: ${ch.subtopics.length} subtopics`)
      }
    }
    console.log('\n✓ MCQ Practice import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
