'use strict'

/**
 * Seeds Online Tests (Practice → Online Tests) into Postgres/Supabase from the
 * extracted examin8 JSON under src/data/examin8_<subject>_online_tests/.
 *
 *  - Creates the tables via prisma/sql/online_tests.sql (idempotent, no reset).
 *  - Upserts every test paper + question (ON CONFLICT DO UPDATE) so re-running is
 *    safe and preserves all questions exactly.
 *  - Verifies JSON count == DB count per subject and prints a summary.
 *
 * Usage:
 *   npm run db:online:setup            (seeds ALL four subjects)
 *   node scripts/seed-online-tests.js Physics   (seed one subject)
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

const SQL_PATH = path.join(__dirname, '..', 'prisma', 'sql', 'online_tests.sql')
// Repo root is two levels up from server/scripts.
const DATA_ROOT = path.join(__dirname, '..', '..', 'src', 'data')

// subject display name -> folder key
const SUBJECTS = [
  { subject: 'Physics',     key: 'physics' },
  { subject: 'Chemistry',   key: 'chemistry' },
  { subject: 'Mathematics', key: 'mathematics' },
  { subject: 'Biology',     key: 'biology' },
]

function jsonDir(key) {
  return path.join(DATA_ROOT, `examin8_${key}_online_tests`, `examin8_${key}_online_tests`, 'json')
}

function splitStatements(sql) {
  return sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function ensureTables() {
  const sql = fs.readFileSync(SQL_PATH, 'utf8')
  for (const stmt of splitStatements(sql)) await db.$executeRawUnsafe(stmt)
  console.log('✓ Tables ready (online_tests, online_test_questions)')
}

const TEST_UPSERT = `
  INSERT INTO online_tests (id, subject, chapter_id, chapter_name, name, category_full_name, no_of_questions, question_count, source_extracted_at, updated_at)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
  ON CONFLICT (id) DO UPDATE SET
    subject=EXCLUDED.subject, chapter_id=EXCLUDED.chapter_id, chapter_name=EXCLUDED.chapter_name,
    name=EXCLUDED.name, category_full_name=EXCLUDED.category_full_name,
    no_of_questions=EXCLUDED.no_of_questions, question_count=EXCLUDED.question_count,
    source_extracted_at=EXCLUDED.source_extracted_at, updated_at=now()
`

const QUESTION_UPSERT = `
  INSERT INTO online_test_questions (id, test_id, order_index, section_name, question, question_raw, options, correct_index, explanation)
  VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)
  ON CONFLICT (test_id, id) DO UPDATE SET
    order_index=EXCLUDED.order_index, section_name=EXCLUDED.section_name,
    question=EXCLUDED.question, question_raw=EXCLUDED.question_raw,
    options=EXCLUDED.options, correct_index=EXCLUDED.correct_index, explanation=EXCLUDED.explanation
`

// Normalize one examin8 chapter file into canonical tests.
//   file: { id, name, full_name, tests:[{ testPaperID, testPaperName, category_full_name,
//            noOfQuestions, sections:[{ sectionName, questions:[{ questionID, question,
//            question_raw, options:[{label,id,text,is_correct}], correct_option_labels, explanation }] }] }] }
function normalizeChapter(file) {
  const chapterId = file.id
  const chapterName = file.name || `Chapter ${chapterId}`
  const tests = (Array.isArray(file.tests) ? file.tests : []).map((t) => {
    const questions = []
    let order = 0
    for (const s of (Array.isArray(t.sections) ? t.sections : [])) {
      for (const q of (Array.isArray(s.questions) ? s.questions : [])) {
        const options = (Array.isArray(q.options) ? q.options : []).map((o) => ({
          id: o.id,
          text: o.text != null ? String(o.text) : '',
          is_correct: o.is_correct === true,
        }))
        let correctIndex = options.findIndex((o) => o.is_correct === true)
        // Fallback: derive from correct_option_labels (e.g. ["A"]) if no is_correct flag.
        if (correctIndex < 0 && Array.isArray(q.correct_option_labels) && q.correct_option_labels.length) {
          const letter = String(q.correct_option_labels[0]).trim().toUpperCase()
          const idx = 'ABCDEFGHIJ'.indexOf(letter)
          if (idx >= 0 && idx < options.length) correctIndex = idx
        }
        questions.push({
          id: q.questionID,
          orderIndex: order++,
          sectionName: s.sectionName || 'General',
          question: q.question || '',
          questionRaw: q.question_raw || null,
          options,
          correctIndex: correctIndex >= 0 ? correctIndex : null,
          explanation: q.explanation || null,
        })
      }
    }
    return {
      id: t.testPaperID,
      chapterId,
      chapterName,
      name: t.testPaperName || `Test ${t.testPaperID}`,
      categoryFull: t.category_full_name || file.full_name || null,
      noOfQuestions: t.noOfQuestions != null ? t.noOfQuestions : questions.length,
      questions,
    }
  })
  return tests
}

async function seedSubject({ subject, key }) {
  const dir = jsonDir(key)
  if (!fs.existsSync(dir)) {
    console.log(`\n⚠ ${subject}: no data folder at ${dir} — skipped`)
    return { subject, jsonTests: 0, jsonQuestions: 0, dbTests: 0, dbQuestions: 0, failures: 0 }
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
  console.log(`\n=== ${subject} (${files.length} chapter files) ===`)

  let jsonTests = 0
  let jsonQuestions = 0
  let failures = 0

  for (const f of files) {
    let file
    try { file = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }
    catch (e) { console.log(`  ✗ ${f}: invalid JSON — ${e.message}`); failures++; continue }

    for (const t of normalizeChapter(file)) {
      try {
        await db.$executeRawUnsafe(
          TEST_UPSERT,
          t.id, subject, t.chapterId, t.chapterName, t.name,
          t.categoryFull, t.noOfQuestions, t.questions.length, file.full_name || null,
        )
        jsonTests += 1
        for (const q of t.questions) {
          await db.$executeRawUnsafe(
            QUESTION_UPSERT,
            q.id, t.id, q.orderIndex, q.sectionName, q.question, q.questionRaw,
            JSON.stringify(q.options), q.correctIndex, q.explanation,
          )
          jsonQuestions += 1
        }
      } catch (e) {
        failures += 1
        console.log(`  ✗ test ${t.id} (${t.name}): ${e.message}`)
      }
    }
  }

  const [{ count: dbTests }] = await db.$queryRawUnsafe('SELECT count(*)::int AS count FROM online_tests WHERE subject = $1', subject)
  const [{ count: dbQuestions }] = await db.$queryRawUnsafe(
    'SELECT count(*)::int AS count FROM online_test_questions q JOIN online_tests t ON t.id = q.test_id WHERE t.subject = $1', subject,
  )
  const [{ count: dbChapters }] = await db.$queryRawUnsafe(
    'SELECT count(DISTINCT chapter_id)::int AS count FROM online_tests WHERE subject = $1', subject,
  )

  console.log(`  chapters imported: ${dbChapters}`)
  console.log(`  tests     (json/db): ${jsonTests} / ${dbTests}`)
  console.log(`  questions (json/db): ${jsonQuestions} / ${dbQuestions}`)
  console.log(`  failures: ${failures}`)
  console.log(jsonTests === dbTests && jsonQuestions === dbQuestions && failures === 0 ? '  ✓ MATCH' : '  ✗ MISMATCH')

  return { subject, jsonTests, jsonQuestions, dbTests, dbQuestions, failures }
}

async function main() {
  const only = process.argv[2]
  const list = only ? SUBJECTS.filter((s) => s.subject.toLowerCase() === only.toLowerCase()) : SUBJECTS
  if (!list.length) throw new Error(`Unknown subject "${only}". Use one of: ${SUBJECTS.map((s) => s.subject).join(', ')}`)

  await ensureTables()

  const results = []
  for (const s of list) results.push(await seedSubject(s))

  console.log('\n──────── SEED SUMMARY ────────')
  let ok = true
  for (const r of results) {
    const match = r.jsonTests === r.dbTests && r.jsonQuestions === r.dbQuestions && r.failures === 0
    if (!match) ok = false
    console.log(`${r.subject.padEnd(12)} tests ${r.jsonTests}/${r.dbTests}  questions ${r.jsonQuestions}/${r.dbQuestions}  failures ${r.failures}  ${match ? '✓' : '✗'}`)
  }
  console.log(ok ? '\n✓ All subjects seeded — counts MATCH' : '\n✗ One or more subjects MISMATCH — check logs')
}

main()
  .catch((err) => { console.error('\n✗ Seed failed:\n', err); process.exitCode = 1 })
  .finally(() => db.$disconnect())
