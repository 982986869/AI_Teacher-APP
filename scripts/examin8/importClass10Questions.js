'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Phase 2D — import Class 10 chapter question banks (Important Questions / PYQ)
// into the EXISTING sections + questions tables. NO new tables.
//
//   chapter → section(type_key=SECTION) → questions[]  (what getQuestionsByPath reads)
//   SECTION = 'important_questions' | 'pyq'
//
// questions row: q_number, year, question_html, is_mcq, options (jsonb
// [{idx,html,is_correct}]), correct_option, solution_html, position — the exact shape
// buildFragmentFromQuestions() renders. HTML/math/images stored verbatim.
//
// Idempotent: upserts subject/chapter/section, then replaces that section's questions.
//
//   SECTION=important_questions node scripts/examin8/importClass10Questions.js          # DRY
//   SECTION=important_questions node scripts/examin8/importClass10Questions.js --live    # apply + verify
//   SECTION=pyq node scripts/examin8/importClass10Questions.js --verify
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const LIVE = process.argv.includes('--live')
const VERIFY_ONLY = process.argv.includes('--verify')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const NORM = path.join(ROOT, 'data', 'examin8', CLASS_DIR, 'normalized')
const CLASS_LEVEL = 10

const SECTION_META = {
  important_questions: { label: 'Important Questions', position: 5 },
  pyq:                 { label: 'Previous Year Questions', position: 6 },
  practice:            { label: 'Practice Questions', position: 7 },
}
const SECTION = (process.env.SECTION || 'important_questions').toLowerCase()
if (!SECTION_META[SECTION]) { console.error(`SECTION must be: ${Object.keys(SECTION_META).join(', ')}`); process.exit(1) }

const VERIFY_TARGETS = [
  { slug: 'mathematics',    name: 'Mathematics',    chapter: 'real-numbers' },
  { slug: 'science',        name: 'Science',        chapter: null },
  { slug: 'social-science', name: 'Social Science', chapter: null },
]

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
    .match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function pickChapterWithQs(client, subjectSlug) {
  const q = await client.query(
    `select ch.slug from sections se
       join chapters ch on ch.id = se.chapter_id
       join subjects su on su.id = ch.subject_id
       join questions qn on qn.section_id = se.id
      where se.type_key = $1 and su.slug = $2 and ch.class_level = $3
      group by ch.slug, ch.position order by ch.position limit 1`,
    [SECTION, subjectSlug, CLASS_LEVEL])
  return q.rows.length ? q.rows[0].slug : null
}

async function verifyChapter(client, subjectSlug, chapterSlug) {
  const q = await client.query(
    `select count(*)::int n, count(*) filter (where qn.is_mcq)::int mcq
       from sections se
       join chapters ch on ch.id = se.chapter_id
       join subjects su on su.id = ch.subject_id
       join questions qn on qn.section_id = se.id
      where se.type_key = $1 and su.slug = $2 and ch.slug = $3 and ch.class_level = $4`,
    [SECTION, subjectSlug, chapterSlug, CLASS_LEVEL])
  return q.rows[0] || { n: 0, mcq: 0 }
}

async function runVerify(client) {
  console.log('\n── VERIFY ─────────────────────────────')
  for (const t of VERIFY_TARGETS) {
    const chapter = t.chapter || await pickChapterWithQs(client, t.slug)
    if (!chapter) { console.log(`  ✗ ${t.name}: no chapter with ${SECTION}`); continue }
    const r = await verifyChapter(client, t.slug, chapter)
    console.log(`  ${r.n > 0 ? '✓' : '✗'} ${t.name} → ${chapter} → ${SECTION}: ${r.n} questions (${r.mcq} MCQ)`)
  }
}

async function main() {
  const outPath = path.join(NORM, `${SECTION}.json`)
  const data = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : []

  if (VERIFY_ONLY) {
    const { Client } = require('pg')
    const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
    await client.connect()
    try { await runVerify(client) } finally { await client.end() }
    return
  }

  let totCh = 0, totQ = 0
  for (const s of data) for (const ch of s.chapters) { totCh++; totQ += ch.questions.length }
  console.log(`\nImport ${SECTION} → sections + questions (class_level=${CLASS_LEVEL}) — ${CLASS_DIR}`)
  console.log(`  subjects=${data.length}  chapters=${totCh}  questions=${totQ}`)
  if (!totQ) console.log(`  (nothing to import — run SECTION=${SECTION} fetchClass10Questions.js first.)`)
  if (!LIVE) { console.log('\n[DRY] add --live to write to the DB.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')

  const stat = { chapters: 0, inserted: 0, replaced: 0, errors: [] }
  try {
    await client.query(
      `insert into section_types (key, label, position) values ($1,$2,$3) on conflict (key) do nothing`,
      [SECTION, SECTION_META[SECTION].label, SECTION_META[SECTION].position])

    for (const s of data) {
      const sub = await client.query(
        `insert into subjects (name, slug) values ($1,$2)
         on conflict (slug) do update set name = excluded.name returning id`,
        [s.subject, s.subject_slug])
      const subjectId = sub.rows[0].id

      for (const ch of s.chapters) {
        stat.chapters += 1
        try {
          const chp = await client.query(
            `insert into chapters (subject_id, name, slug, class_level, position)
             values ($1,$2,$3,$4,$5)
             on conflict (subject_id, class_level, slug) do update set name = excluded.name returning id`,
            [subjectId, ch.chapter, ch.chapter_slug, CLASS_LEVEL, ch.position || 0])
          const chapterId = chp.rows[0].id

          const sec = await client.query(
            `insert into sections (chapter_id, type_key, position) values ($1,$2,$3)
             on conflict (chapter_id, type_key) do update set position = excluded.position returning id`,
            [chapterId, SECTION, SECTION_META[SECTION].position])
          const sectionId = sec.rows[0].id

          const del = await client.query('delete from questions where section_id = $1', [sectionId])
          if (del.rowCount) stat.replaced += del.rowCount
          // Dedup by question text: examin8 sometimes returns the same question under
          // different ids (so the fetch's ext_id dedup misses it). Keep the first,
          // re-number positions so the chapter shows each question exactly once.
          const seenHtml = new Set()
          const uniq = []
          for (const q of ch.questions) {
            const key = String(q.question_html || '').replace(/\s+/g, ' ').trim()
            if (key && seenHtml.has(key)) continue
            if (key) seenHtml.add(key)
            uniq.push({ ...q, position: uniq.length, q_number: `Q${uniq.length + 1}` })
          }
          // Batch inserts (one multi-row INSERT per ~200 questions) — far fewer
          // round-trips than one query per question, so a big chapter doesn't drop
          // the pooled connection mid-import. 9 params/row (Postgres cap 65535).
          const BATCH = 200
          for (let b = 0; b < uniq.length; b += BATCH) {
            const slice = uniq.slice(b, b + BATCH)
            const values = []
            const params = []
            slice.forEach((q, k) => {
              const o = k * 9
              values.push(`($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6}::jsonb,$${o + 7},$${o + 8},$${o + 9})`)
              params.push(sectionId, q.q_number, q.year, q.question_html, !!q.is_mcq,
                q.options ? JSON.stringify(q.options) : null, q.correct_option, q.solution_html, q.position || 0)
            })
            await client.query(
              `insert into questions (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position)
               values ${values.join(',')}`, params)
            stat.inserted += slice.length
          }
        } catch (e) { stat.errors.push(`${s.subject}/${ch.chapter}: ${e.message}`) }
      }
      console.log(`  ✓ ${s.subject}: ${s.chapters.length} chapters`)
    }

    console.log('\n── LOG ────────────────────────────────')
    console.log(`  Chapters scanned  : ${stat.chapters}`)
    console.log(`  Questions inserted: ${stat.inserted}`)
    console.log(`  Old replaced      : ${stat.replaced}`)
    console.log(`  Errors            : ${stat.errors.length}`)
    stat.errors.slice(0, 12).forEach((e) => console.log(`     ! ${e}`))

    await runVerify(client)
  } finally { await client.end() }

  console.log(`\n✓ ${SECTION} imported into sections + questions (Class 10).`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
