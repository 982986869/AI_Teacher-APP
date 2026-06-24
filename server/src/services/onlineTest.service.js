'use strict'

// Online Tests live in raw-SQL tables (online_tests / online_test_questions),
// accessed via parameterized $queryRawUnsafe — same approach as mock tests.
// Chapter list is DERIVED (GROUP BY chapter_id); scoring is client-side, so the
// question payload includes the correct-answer letter.

const db = require('../config/database')
const { AppError } = require('../middleware/errorHandler')

const LETTERS = 'ABCDEFGHIJ'.split('')

// Chapter list for a subject — derived from online_tests (one row per test paper).
async function listChapters({ subject } = {}) {
  return db.$queryRawUnsafe(
    `SELECT chapter_id   AS "chapterId",
            chapter_name AS "chapterName",
            count(*)::int           AS "testCount",
            coalesce(sum(question_count),0)::int AS "questionCount"
       FROM online_tests
      WHERE ($1::text IS NULL OR subject = $1)
      GROUP BY chapter_id, chapter_name
      ORDER BY min(id)`,
    subject || null,
  )
}

// The test papers within one chapter (the 5 "Test 0N" cards).
async function listTestsByChapter(chapterId) {
  return db.$queryRawUnsafe(
    `SELECT id, name, question_count AS "questionCount", no_of_questions AS "noOfQuestions"
       FROM online_tests WHERE chapter_id = $1 ORDER BY id`,
    chapterId,
  )
}

// Questions for one test, shaped EXACTLY as TestQuestionScreen + computeMockResult
// consume them: { id, text, options:[{ key, label }], correctAnswer:<letter> }.
async function getQuestions(testId) {
  const [test] = await db.$queryRawUnsafe(
    `SELECT id, subject, chapter_id AS "chapterId", chapter_name AS "chapterName",
            name, question_count AS "questionCount"
       FROM online_tests WHERE id = $1`,
    testId,
  )
  if (!test) throw new AppError('Online test not found.', 404)

  const rows = await db.$queryRawUnsafe(
    `SELECT id, order_index AS "orderIndex", section_name AS "sectionName",
            question, options, correct_index AS "correctIndex", explanation
       FROM online_test_questions WHERE test_id = $1 ORDER BY order_index`,
    testId,
  )

  const questions = rows.map((r) => {
    const opts = Array.isArray(r.options) ? r.options : []
    return {
      id: r.id,
      text: r.question,
      options: opts.map((o, i) => ({ key: LETTERS[i], label: o && o.text != null ? String(o.text) : '' })),
      correctAnswer: r.correctIndex != null && r.correctIndex >= 0 ? LETTERS[r.correctIndex] : null,
      explanation: r.explanation || '',
    }
  })

  return { test, questions, total: questions.length }
}

// Light server-side scoring (no attempt recording). answers = { [questionId]: <letter> }.
// The UI also computes the result client-side; this endpoint is provided for parity.
async function submit({ testId, answers = {} }) {
  const rows = await db.$queryRawUnsafe(
    `SELECT id, correct_index AS "correctIndex" FROM online_test_questions WHERE test_id = $1`,
    testId,
  )
  if (!rows.length) throw new AppError('Online test not found.', 404)

  const total = rows.length
  let attempted = 0
  let correct = 0
  for (const r of rows) {
    const picked = answers[r.id] != null ? answers[r.id] : answers[String(r.id)]
    if (picked == null) continue
    attempted += 1
    const correctLetter = r.correctIndex != null && r.correctIndex >= 0 ? LETTERS[r.correctIndex] : null
    if (correctLetter && String(picked).toUpperCase() === correctLetter) correct += 1
  }
  return { total, attempted, correct, wrong: attempted - correct, skipped: total - attempted, score: correct }
}

module.exports = { listChapters, listTestsByChapter, getQuestions, submit }
