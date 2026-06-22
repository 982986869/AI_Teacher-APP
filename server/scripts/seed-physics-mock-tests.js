'use strict'

/**
 * Seeds Physics mock tests into Postgres/Supabase from the extracted JSON.
 *
 *  - Creates the tables via prisma/sql/mock_tests.sql (idempotent, no reset).
 *  - Upserts every test + question (ON CONFLICT DO UPDATE) so re-running is safe
 *    and preserves all questions exactly.
 *
 * Usage:
 *   npm run db:mock:setup                      (uses scripts/data/physics_mock_tests.json)
 *   node scripts/seed-physics-mock-tests.js <path-to-json>
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

const JSON_PATH = process.argv[2] || path.join(__dirname, 'data', 'physics_mock_tests.json')
const SQL_PATH = path.join(__dirname, '..', 'prisma', 'sql', 'mock_tests.sql')

// Split a .sql file into individual statements (drops `-- ...` comment lines).
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
  for (const stmt of splitStatements(sql)) {
    await db.$executeRawUnsafe(stmt)
  }
  console.log('✓ Tables ready (mock_tests, mock_test_questions, mock_test_attempts)')
}

const TEST_UPSERT = `
  INSERT INTO mock_tests (id, subject, name, category_full_name, duration_min, no_of_questions, instruction, section_count, question_count, source_extracted_at, updated_at)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
  ON CONFLICT (id) DO UPDATE SET
    subject=EXCLUDED.subject, name=EXCLUDED.name, category_full_name=EXCLUDED.category_full_name,
    duration_min=EXCLUDED.duration_min, no_of_questions=EXCLUDED.no_of_questions, instruction=EXCLUDED.instruction,
    section_count=EXCLUDED.section_count, question_count=EXCLUDED.question_count,
    source_extracted_at=EXCLUDED.source_extracted_at, updated_at=now()
`

const QUESTION_UPSERT = `
  INSERT INTO mock_test_questions (id, test_id, order_index, section_name, section_id, question, question_raw, options, correct_option_ids, correct_option_texts, correct_index, explanation)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12)
  ON CONFLICT (id) DO UPDATE SET
    test_id=EXCLUDED.test_id, order_index=EXCLUDED.order_index, section_name=EXCLUDED.section_name,
    section_id=EXCLUDED.section_id, question=EXCLUDED.question, question_raw=EXCLUDED.question_raw,
    options=EXCLUDED.options, correct_option_ids=EXCLUDED.correct_option_ids,
    correct_option_texts=EXCLUDED.correct_option_texts, correct_index=EXCLUDED.correct_index, explanation=EXCLUDED.explanation
`

async function main() {
  if (!fs.existsSync(JSON_PATH)) {
    throw new Error(`JSON not found at ${JSON_PATH}. Pass a path: node scripts/seed-physics-mock-tests.js <file>`)
  }
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))
  const subject = data.category_name || 'Physics'
  const extractedAt = data.extracted_at || null
  const tests = Array.isArray(data.mock_tests) ? data.mock_tests : []

  await ensureTables()

  let testCount = 0
  let questionCount = 0

  for (const t of tests) {
    const sections = Array.isArray(t.sections) ? t.sections : []
    const sectionCount = sections.length
    const qCount = sections.reduce((n, s) => n + ((s.questions && s.questions.length) || 0), 0)

    await db.$executeRawUnsafe(
      TEST_UPSERT,
      t.testPaperID, subject, t.testPaperName || `Mock Test ${t.testPaperID}`,
      t.category_full_name || null, t.testDuration_min || null, t.noOfQuestions || qCount,
      t.instruction || null, sectionCount, qCount, extractedAt,
    )
    testCount += 1

    let order = 0
    for (const s of sections) {
      for (const q of (s.questions || [])) {
        const options = Array.isArray(q.options) ? q.options : []
        const correctIndex = options.findIndex((o) => o && o.is_correct === true)
        await db.$executeRawUnsafe(
          QUESTION_UPSERT,
          q.questionID, t.testPaperID, order, s.sectionName || null, s.sectionID || null,
          q.question || '', q.question_raw || null,
          JSON.stringify(options),
          JSON.stringify(q.correct_option_ids || []),
          JSON.stringify(q.correct_option_texts || []),
          correctIndex >= 0 ? correctIndex : null,
          q.explanation || null,
        )
        order += 1
        questionCount += 1
      }
    }
    console.log(`  • ${t.testPaperName} — ${qCount} questions`)
  }

  // Verify against DB row counts.
  const [{ count: dbTests }] = await db.$queryRawUnsafe('SELECT count(*)::int AS count FROM mock_tests WHERE subject = $1', subject)
  const [{ count: dbQuestions }] = await db.$queryRawUnsafe(
    'SELECT count(*)::int AS count FROM mock_test_questions q JOIN mock_tests t ON t.id = q.test_id WHERE t.subject = $1', subject,
  )

  console.log('\n──────── SEED SUMMARY ────────')
  console.log(`Subject:            ${subject}`)
  console.log(`Tests (json/db):    ${testCount} / ${dbTests}`)
  console.log(`Questions (json/db):${questionCount} / ${dbQuestions}`)
  console.log(dbTests === testCount && dbQuestions === questionCount ? '✓ Row counts MATCH' : '✗ MISMATCH — check logs')
}

main()
  .catch((err) => { console.error('\n✗ Seed failed:\n', err); process.exitCode = 1 })
  .finally(() => db.$disconnect())
