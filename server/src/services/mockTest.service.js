'use strict'

// Mock tests live in raw-SQL tables (mock_tests / mock_test_questions /
// mock_test_attempts), so all access here is via parameterized $queryRawUnsafe —
// exactly like the pgvector knowledge layer. No Prisma models / migrations.

const db = require('../config/database')
const { AppError } = require('../middleware/errorHandler')

// Marking: the source instruction says "equal marks, no negative marking".
const POINTS_PER_CORRECT = 1
const NEGATIVE = 0

async function listTests({ subject } = {}) {
  const rows = await db.$queryRawUnsafe(
    `SELECT id, subject, name,
            category_full_name AS "categoryFullName",
            duration_min       AS "durationMin",
            no_of_questions    AS "noOfQuestions",
            section_count      AS "sectionCount",
            question_count     AS "questionCount"
       FROM mock_tests
      WHERE ($1::text IS NULL OR subject = $1)
      ORDER BY id`,
    subject || null,
  )
  return rows
}

async function getTest(id) {
  const [test] = await db.$queryRawUnsafe(
    `SELECT id, subject, name,
            category_full_name AS "categoryFullName",
            duration_min       AS "durationMin",
            no_of_questions    AS "noOfQuestions",
            section_count      AS "sectionCount",
            question_count     AS "questionCount",
            instruction
       FROM mock_tests WHERE id = $1`,
    id,
  )
  if (!test) throw new AppError('Mock test not found.', 404)

  const sections = await db.$queryRawUnsafe(
    `SELECT section_id AS "sectionId", section_name AS "sectionName", count(*)::int AS count
       FROM mock_test_questions WHERE test_id = $1
      GROUP BY section_id, section_name
      ORDER BY min(order_index)`,
    id,
  )
  return { ...test, sections }
}

// Questions shaped for the existing McqTestScreen: options as plain strings +
// `correct` index. These are practice MCQs, so the answer key is fine client-side;
// the /submit endpoint also scores authoritatively on the server.
async function getQuestions(id) {
  const [test] = await db.$queryRawUnsafe(
    `SELECT id, name, duration_min AS "durationMin", question_count AS "questionCount" FROM mock_tests WHERE id = $1`,
    id,
  )
  if (!test) throw new AppError('Mock test not found.', 404)

  const rows = await db.$queryRawUnsafe(
    `SELECT id, order_index AS "orderIndex", section_name AS "sectionName",
            question, options, correct_index AS "correctIndex", explanation
       FROM mock_test_questions WHERE test_id = $1 ORDER BY order_index`,
    id,
  )

  const questions = rows.map((r) => {
    const opts = Array.isArray(r.options) ? r.options : []
    return {
      id: r.id,
      question: r.question,
      options: opts.map((o) => (o && o.text != null ? String(o.text) : '')),
      correct: r.correctIndex != null ? r.correctIndex : -1,
      cat: r.sectionName || 'MCQ',
      explanation: r.explanation || '',
    }
  })
  return { test, questions, total: questions.length }
}

// Authoritative server-side scoring. answers = { "<questionId>": <selectedIndex> }.
async function submit({ id, userId, answers = {}, timeTakenSec = 0 }) {
  const rows = await db.$queryRawUnsafe(
    `SELECT id, correct_index AS "correctIndex" FROM mock_test_questions WHERE test_id = $1`,
    id,
  )
  if (!rows.length) throw new AppError('Mock test not found.', 404)

  const total = rows.length
  let attempted = 0
  let correct = 0
  for (const r of rows) {
    const sel = answers[r.id] != null ? answers[r.id] : answers[String(r.id)]
    if (sel == null) continue
    attempted += 1
    if (Number(sel) === r.correctIndex) correct += 1
  }
  const wrong = attempted - correct
  const score = correct * POINTS_PER_CORRECT - wrong * NEGATIVE

  // Persist the attempt (best-effort; never blocks the score).
  try {
    await db.$executeRawUnsafe(
      `INSERT INTO mock_test_attempts (user_id, test_id, answers, total, attempted, correct_count, wrong_count, score, time_taken_sec)
       VALUES ($1::uuid,$2,$3::jsonb,$4,$5,$6,$7,$8,$9)`,
      userId || null, id, JSON.stringify(answers || {}), total, attempted, correct, wrong, score, timeTakenSec || 0,
    )
  } catch (e) {
    // non-fatal — scoring is still returned
  }

  return { total, attempted, correct, wrong, skipped: total - attempted, score, pointsPerCorrect: POINTS_PER_CORRECT, negative: NEGATIVE }
}

module.exports = { listTests, getTest, getQuestions, submit }
