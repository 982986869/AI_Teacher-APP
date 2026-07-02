'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import CLASS 6 SCIENCE (OLD) content into Supabase, following the existing
// structured schema + importers:
//
//   subject('Science', class_level=6)
//     -> chapter (16)
//         -> subtopic('Practice') -> mcq_questions   (Practice preview MCQs)
//         -> section('revision_notes') -> notes       (Flashcards, topic-grouped)
//         -> section('online_test')   -> questions    (Online test questions)
//
// Source: server/Class06_Science_OLD_1595/{Practice,Flashcards,Online_Tests}/*.json
// (fetched from web.examin8.com; practice is a ~10/chapter FREE preview.)
//
//   node scripts/importClass6Science.js          # DRY RUN (parse + report)
//   node scripts/importClass6Science.js --live    # insert into Supabase
//
// DB connection from server/.env (DATABASE_URL). Re-runnable: each section /
// subtopic is cleared before re-insert. Secret never printed.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'server', 'Class06_Science_OLD_1595')
const LIVE = process.argv.includes('--live')
// Matches the frontend Class-6 tile "Science (OLD)" (slugify → 'science-old'),
// so /content, /notes and /mcq-practice resolve by the same slug the app sends.
const SUBJECT = { name: 'Science (OLD)', slug: 'science-old' }
const CLASS_LEVEL = 6
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const jsonFiles = (dir) =>
  fs.readdirSync(dir).filter((f) => /^\d\d_.*\.json$/.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

// ── Build one record per chapter, merging the three sections ─────────────────
function collect() {
  const chapters = new Map() // chapter_id -> record
  const get = (id, name, pos) => {
    if (!chapters.has(id)) chapters.set(id, { id, name, position: pos, mcqs: [], note: null, online: [] })
    return chapters.get(id)
  }

  // Source-"(Deleted)" chapters are stale/incomplete — keep them out of the app.
  const isDeleted = (name) => /\(deleted\)/i.test(name)

  // Practice → mcq_questions
  let pos = 0
  jsonFiles(path.join(DATA, 'Practice')).forEach((f) => {
    const j = loadJson(path.join(DATA, 'Practice', f))
    if (isDeleted(j.chapter_name)) return
    const rec = get(j.chapter_id, j.chapter_name, ++pos)
    rec.mcqs = (j.questions || []).map((q) => ({
      source_id: q.id,
      question_html: q.question_html || q.question || '',
      difficulty: q.difficulty || null,
      options: (q.options || []).map((o) => ({ id: o.id, html: o.html || o.text || '' })),
      correct_option_id: q.correct_option_id != null ? q.correct_option_id : null,
      explanation_html: q.explanation || null,
    }))
  })

  // Flashcards → revision_notes (blocks = [{ title: topic, html }])
  jsonFiles(path.join(DATA, 'Flashcards')).forEach((f) => {
    const j = loadJson(path.join(DATA, 'Flashcards', f))
    if (isDeleted(j.chapter_name) || !chapters.has(j.chapter_id)) return
    const rec = chapters.get(j.chapter_id)
    const blocks = (j.topics || []).map((t) => ({
      title: t.topic_name,
      html: (t.cards || []).map((c) => renderCard(c)).join('\n'),
    })).filter((b) => b.html.trim())
    if (blocks.length) rec.note = { intro: null, blocks }
  })

  // Online tests → online_test questions (matched to chapter by category_id)
  const otDir = path.join(DATA, 'Online_Tests')
  if (fs.existsSync(otDir)) {
    for (const sub of fs.readdirSync(otDir)) {
      const subPath = path.join(otDir, sub)
      if (!fs.statSync(subPath).isDirectory()) continue
      for (const tf of fs.readdirSync(subPath).filter((x) => x.endsWith('.json'))) {
        const t = loadJson(path.join(subPath, tf))
        const rec = chapters.get(t.category_id)
        if (!rec) continue // chapter must exist from Practice pass
        ;(t.questions || []).forEach((q) => {
          const options = (q.options || []).map((o, i) => ({ idx: LETTERS[i], html: o.text || '', is_correct: !!o.is_correct }))
          const correct = options.find((o) => o.is_correct)
          rec.online.push({
            q_number: null, year: t.name || null,
            question_html: q.question_html || q.question || '',
            is_mcq: options.length > 0,
            options: options.length ? options : null,
            correct_option: correct ? correct.idx : null,
            solution_html: q.explanation_html || q.explanation || null,
          })
        })
      }
    }
  }

  return [...chapters.values()].sort((a, b) => a.position - b.position)
}

function renderCard(c) {
  const t = c.type
  if (t === 2) return `<div class="fc-card"><p class="fc-q"><b>Q.</b> ${c.text_html || ''}</p><p class="fc-a"><b>Ans.</b> ${c.answer_html || ''}</p></div>`
  if (t === 3) return `<div class="fc-card">${c.text_html || ''}<p class="fc-a"><b>Ans.</b> ${c.answer_html || ''}</p></div>`
  return `<div class="fc-card">${c.text_html || ''}</div>`
}

function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

async function insertMcqs(client, subtopicId, mcqs) {
  if (!mcqs.length) return
  const tuples = [], params = []
  mcqs.forEach((q, i) => {
    const b = i * 7
    tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},${i + 1})`)
    params.push(subtopicId, q.source_id, q.question_html, q.difficulty, JSON.stringify(q.options), q.correct_option_id, q.explanation_html)
  })
  await client.query(
    `insert into mcq_questions (subtopic_id, source_id, question_html, difficulty, options, correct_option_id, explanation_html, position) values ${tuples.join(',')}`,
    params
  )
}

async function insertQuestions(client, sectionId, questions) {
  if (!questions.length) return
  const tuples = [], params = []
  questions.forEach((q, i) => {
    const b = i * 9
    tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9})`)
    params.push(sectionId, q.q_number, q.year, q.question_html, q.is_mcq, q.options ? JSON.stringify(q.options) : null, q.correct_option, q.solution_html, i + 1)
  })
  await client.query(
    `insert into questions (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position) values ${tuples.join(',')}`,
    params
  )
}

async function main() {
  const chapters = collect()

  console.log('\n=== CLASS 6 SCIENCE — IMPORT PARSE REPORT ===')
  let tMcq = 0, tNotes = 0, tOnline = 0
  for (const c of chapters) {
    tMcq += c.mcqs.length; tNotes += c.note ? c.note.blocks.length : 0; tOnline += c.online.length
    console.log(`  #${String(c.position).padStart(2)} ${c.name.slice(0, 38).padEnd(38)} mcq:${String(c.mcqs.length).padStart(3)}  noteBlocks:${String(c.note ? c.note.blocks.length : 0).padStart(2)}  online:${String(c.online.length).padStart(3)}`)
  }
  console.log(`\nTOTAL: ${chapters.length} chapters | ${tMcq} practice MCQs | ${tNotes} note-blocks | ${tOnline} online-test questions`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Kuch insert nahi hua. Live: node scripts/importClass6Science.js --live\n')
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
      `insert into subjects (name, slug) values ($1,$2) on conflict (slug) do update set name = excluded.name returning id`,
      [SUBJECT.name, SUBJECT.slug]
    )).rows[0].id

    for (const c of chapters) {
      const chapterId = (await client.query(
        `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
         on conflict (subject_id, class_level, slug) do update set name = excluded.name, position = excluded.position returning id`,
        [subjectId, c.name, slugify(c.name), CLASS_LEVEL, c.position]
      )).rows[0].id

      // Practice → subtopic + mcq_questions
      if (c.mcqs.length) {
        const stId = (await client.query(
          `insert into subtopics (chapter_id, name, position) values ($1,'Practice',1)
           on conflict (chapter_id, name) do update set position = 1 returning id`,
          [chapterId]
        )).rows[0].id
        await client.query('delete from mcq_questions where subtopic_id = $1', [stId])
        await insertMcqs(client, stId, c.mcqs)
      }

      // Flashcards → revision_notes section + notes
      if (c.note) {
        const secId = (await client.query(
          `insert into sections (chapter_id, type_key, position) values ($1,'revision_notes',3)
           on conflict (chapter_id, type_key) do update set position = 3 returning id`,
          [chapterId]
        )).rows[0].id
        await client.query('delete from notes where section_id = $1', [secId])
        await client.query('insert into notes (section_id, intro, blocks) values ($1,$2,$3)',
          [secId, c.note.intro, JSON.stringify(c.note.blocks)])
      }

      // Online tests → online_test section + questions
      if (c.online.length) {
        const secId = (await client.query(
          `insert into sections (chapter_id, type_key, position) values ($1,'online_test',7)
           on conflict (chapter_id, type_key) do update set position = 7 returning id`,
          [chapterId]
        )).rows[0].id
        await client.query('delete from questions where section_id = $1', [secId])
        await insertQuestions(client, secId, c.online)
      }
      console.log(`   ✓ #${String(c.position).padStart(2)} ${c.name}`)
    }
    console.log('\n✓ Class 6 Science import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
