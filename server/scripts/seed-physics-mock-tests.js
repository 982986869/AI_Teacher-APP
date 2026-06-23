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
  ON CONFLICT (test_id, id) DO UPDATE SET
    order_index=EXCLUDED.order_index, section_name=EXCLUDED.section_name,
    section_id=EXCLUDED.section_id, question=EXCLUDED.question, question_raw=EXCLUDED.question_raw,
    options=EXCLUDED.options, correct_option_ids=EXCLUDED.correct_option_ids,
    correct_option_texts=EXCLUDED.correct_option_texts, correct_index=EXCLUDED.correct_index, explanation=EXCLUDED.explanation
`

// Normalize either dataset shape into one canonical structure:
//   Physics:   { category_name, mock_tests:[{ testPaperID, testPaperName, testDuration_min, noOfQuestions,
//                  sections:[{ sectionName, sectionID, questions:[{ questionID, question, question_raw,
//                  options:[{id,text,is_correct}], correct_option_ids, correct_option_texts, explanation }] }] }] }
//   Chemistry: { subject, tests:[{ test_id, test_name, duration_min, no_of_questions,
//                  sections:[{ section_name, section_id, questions:[{ id, question, question_html,
//                  options:[{id,text,html,is_correct}], correct_options, explanation }] }] }] }
function normalize(data) {
  const subject = data.category_name || data.subject || 'Unknown'
  const extractedAt = data.extracted_at || null
  const rawTests = Array.isArray(data.mock_tests) ? data.mock_tests : (Array.isArray(data.tests) ? data.tests : [])
  const pick = (...vals) => vals.find((v) => v !== undefined && v !== null)
  const tests = rawTests.map((t) => {
    const tid = pick(t.testPaperID, t.test_id)
    return {
      id: tid,
      name: pick(t.testPaperName, t.test_name) || `Mock Test ${tid}`,
      categoryFull: t.category_full_name || null,
      durationMin: pick(t.testDuration_min, t.duration_min) ?? null,
      noOfQuestions: pick(t.noOfQuestions, t.no_of_questions) ?? null,
      instruction: t.instruction || null,
      sections: (Array.isArray(t.sections) ? t.sections : []).map((s) => ({
        sectionName: pick(s.sectionName, s.section_name) ?? null,
        sectionId: pick(s.sectionID, s.section_id) ?? null,
        questions: (Array.isArray(s.questions) ? s.questions : []).map((q) => {
          const options = (Array.isArray(q.options) ? q.options : []).map((o) => ({
            id: o.id, text: pick(o.text, o.html) ?? '', is_correct: o.is_correct === true,
          }))
          return {
            id: pick(q.questionID, q.id),
            question: q.question || '',
            questionRaw: pick(q.question_raw, q.question_html) ?? null,
            options,
            correctOptionIds: Array.isArray(q.correct_option_ids) ? q.correct_option_ids : options.filter((o) => o.is_correct).map((o) => o.id),
            correctOptionTexts: Array.isArray(q.correct_option_texts) ? q.correct_option_texts : (Array.isArray(q.correct_options) ? q.correct_options : []),
            explanation: q.explanation || null,
          }
        }),
      })),
    }
  })
  return { subject, extractedAt, tests }
}

async function main() {
  if (!fs.existsSync(JSON_PATH)) {
    throw new Error(`JSON not found at ${JSON_PATH}. Pass a path: node scripts/seed-physics-mock-tests.js <file>`)
  }
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))
  const { subject, extractedAt, tests } = normalize(data)

  await ensureTables()

  let testCount = 0
  let questionCount = 0

  for (const t of tests) {
    const sectionCount = t.sections.length
    const qCount = t.sections.reduce((n, s) => n + s.questions.length, 0)

    await db.$executeRawUnsafe(
      TEST_UPSERT,
      t.id, subject, t.name,
      t.categoryFull, t.durationMin, t.noOfQuestions != null ? t.noOfQuestions : qCount,
      t.instruction, sectionCount, qCount, extractedAt,
    )
    testCount += 1

    let order = 0
    for (const s of t.sections) {
      for (const q of s.questions) {
        const correctIndex = q.options.findIndex((o) => o.is_correct === true)
        await db.$executeRawUnsafe(
          QUESTION_UPSERT,
          q.id, t.id, order, s.sectionName, s.sectionId,
          q.question, q.questionRaw,
          JSON.stringify(q.options),
          JSON.stringify(q.correctOptionIds),
          JSON.stringify(q.correctOptionTexts),
          correctIndex >= 0 ? correctIndex : null,
          q.explanation,
        )
        order += 1
        questionCount += 1
      }
    }
    console.log(`  • ${t.name} — ${qCount} questions`)
  }

  const [{ count: dbTests }] = await db.$queryRawUnsafe('SELECT count(*)::int AS count FROM mock_tests WHERE subject = $1', subject)
  const [{ count: dbQuestions }] = await db.$queryRawUnsafe(
    'SELECT count(*)::int AS count FROM mock_test_questions q JOIN mock_tests t ON t.id = q.test_id WHERE t.subject = $1', subject,
  )

  console.log('\n──────── SEED SUMMARY ────────')
  console.log(`Subject:             ${subject}`)
  console.log(`Tests (json/db):     ${testCount} / ${dbTests}`)
  console.log(`Questions (json/db): ${questionCount} / ${dbQuestions}`)
  console.log(dbTests === testCount && dbQuestions === questionCount ? '✓ Row counts MATCH' : '✗ MISMATCH — check logs')
}

main()
  .catch((err) => { console.error('\n✗ Seed failed:\n', err); process.exitCode = 1 })
  .finally(() => db.$disconnect())
