'use strict'

// Mock tests live in raw-SQL tables (mock_tests / mock_test_questions /
// mock_test_attempts), accessed via parameterized $queryRawUnsafe — like the
// pgvector knowledge layer. No Prisma models / migrations.

const db = require('../config/database')
const { AppError } = require('../middleware/errorHandler')

// Source instruction: "equal marks, no negative marking".
const POINTS_PER_CORRECT = 1
const NEGATIVE = 0

// classLevel (the student's saved class) scopes the mocks. null → empty (never a
// fallback class); the controller passes the authoritative class from req.scope.
async function listTests({ subject, classLevel = null } = {}) {
  return db.$queryRawUnsafe(
    `SELECT id, subject, name,
            category_full_name AS "categoryFullName",
            duration_min       AS "durationMin",
            no_of_questions    AS "noOfQuestions",
            section_count      AS "sectionCount",
            question_count     AS "questionCount"
       FROM mock_tests
      WHERE ($1::text IS NULL OR subject = $1) AND class_level = $2
        AND status = 'published' AND deleted_at IS NULL
      ORDER BY id`,
    subject || null, classLevel,
  )
}

// Lightweight class/subject lookup so the controller can enforce that a student only
// opens tests for their own class + syllabus (the by-id endpoints are otherwise open).
async function getTestMeta(id) {
  const [row] = await db.$queryRawUnsafe(
    `SELECT class_level AS "classLevel", subject FROM mock_tests WHERE id = $1 AND status = 'published' AND deleted_at IS NULL`,
    id,
  )
  return row || null
}

async function getTest(id) {
  const [test] = await db.$queryRawUnsafe(
    `SELECT id, subject, name, category_full_name AS "categoryFullName",
            duration_min AS "durationMin", no_of_questions AS "noOfQuestions",
            section_count AS "sectionCount", question_count AS "questionCount", instruction
       FROM mock_tests WHERE id = $1 AND status = 'published' AND deleted_at IS NULL`,
    id,
  )
  if (!test) throw new AppError('Mock test not found.', 404)
  const sections = await db.$queryRawUnsafe(
    `SELECT section_id AS "sectionId", section_name AS "sectionName", count(*)::int AS count
       FROM mock_test_questions WHERE test_id = $1
      GROUP BY section_id, section_name ORDER BY min(order_index)`,
    id,
  )
  return { ...test, sections }
}

// Questions shaped for the existing McqTestScreen: options as plain strings +
// a `correct` index. (Practice MCQs — answer key client-side is fine; /submit
// also scores authoritatively on the server.)
async function getQuestions(id) {
  const [test] = await db.$queryRawUnsafe(
    `SELECT id, name, duration_min AS "durationMin", question_count AS "questionCount", instruction FROM mock_tests WHERE id = $1 AND status = 'published' AND deleted_at IS NULL`,
    id,
  )
  if (!test) throw new AppError('Mock test not found.', 404)

  const rows = await db.$queryRawUnsafe(
    `SELECT id, order_index AS "orderIndex", section_id AS "sectionId", section_name AS "sectionName",
            question, options, correct_index AS "correctIndex", explanation
       FROM mock_test_questions WHERE test_id = $1 ORDER BY order_index`,
    id,
  )

  // Sections, in question order, with per-section "Attempt any N" parsed from the
  // test instruction (e.g. "Section A ... Attempt any 20 questions"). The Nth
  // "attempt any <num>" maps to the Nth section.
  const attempts = test.instruction
    ? [...String(test.instruction).matchAll(/attempt\s*any\s*(\d+)/gi)].map((m) => parseInt(m[1], 10))
    : []
  const sections = []
  const byKey = new Map()
  for (const r of rows) {
    const key = `${r.sectionId}|${r.sectionName}`
    let s = byKey.get(key)
    if (!s) {
      s = { sectionId: r.sectionId, sectionName: r.sectionName || 'Section', sectionOrder: sections.length, count: 0 }
      byKey.set(key, s)
      sections.push(s)
    }
    s.count += 1
  }
  sections.forEach((s, i) => { s.attemptAny = Number.isInteger(attempts[i]) ? attempts[i] : null })

  // Per-question numbering: section-local (1-based within its section) + global.
  const localCounters = new Map()
  const questions = rows.map((r, idx) => {
    const key = `${r.sectionId}|${r.sectionName}`
    const sec = byKey.get(key)
    const local = (localCounters.get(key) || 0) + 1
    localCounters.set(key, local)
    const opts = Array.isArray(r.options) ? r.options : []
    return {
      id: r.id,
      question: r.question,
      // Option text plus its image (if any) as an <img> the runner renders. Question
      // already carries its image embedded in the question column.
      options: opts.map((o) => {
        const text = o && o.text != null ? String(o.text) : ''
        const image = o && o.image ? String(o.image) : ''
        return image ? `${text}<img src="${image}" />` : text
      }),
      correct: r.correctIndex != null ? r.correctIndex : -1,
      cat: r.sectionName || 'MCQ',
      explanation: r.explanation || '',
      sectionName: r.sectionName || 'Section',
      sectionID: r.sectionId,
      sectionOrder: sec ? sec.sectionOrder : 0,
      sectionLocalNumber: local,
      globalNumber: idx + 1,
    }
  })

  return { test, questions, sections, total: questions.length }
}

// Per-test attempt summary for a user (best score), optionally filtered by subject.
// Used to show "Attempted · Score x/total" in the mock-test list.
async function listAttempts({ subject, userId, classLevel = null }) {
  if (!userId) return []
  return db.$queryRawUnsafe(
    `SELECT a.test_id AS "testId", count(*)::int AS attempts,
            max(a.score)::int AS "bestScore", max(a.total)::int AS total
       FROM mock_test_attempts a
       JOIN mock_tests t ON t.id = a.test_id
      WHERE a.user_id = $1::uuid AND ($2::text IS NULL OR t.subject = $2) AND t.class_level = $3
        AND t.status = 'published' AND t.deleted_at IS NULL
      GROUP BY a.test_id`,
    userId, subject || null, classLevel,
  )
}

// Authoritative server-side scoring. answers = { "<questionId>": <selectedIndex> }.
async function submit({ id, userId, answers = {}, timeTakenSec = 0 }) {
  // Never score an attempt against a draft/archived/removed test.
  const [t] = await db.$queryRawUnsafe(`SELECT status, deleted_at FROM mock_tests WHERE id = $1`, id)
  if (!t || t.status !== 'published' || t.deleted_at) throw new AppError('Mock test not found.', 404)
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

  try {
    await db.$executeRawUnsafe(
      `INSERT INTO mock_test_attempts (user_id, test_id, answers, total, attempted, correct_count, wrong_count, score, time_taken_sec)
       VALUES ($1::uuid,$2,$3::jsonb,$4,$5,$6,$7,$8,$9)`,
      userId || null, id, JSON.stringify(answers || {}), total, attempted, correct, wrong, score, timeTakenSec || 0,
    )
  } catch (e) { /* non-fatal — score still returned */ }

  return { total, attempted, correct, wrong, skipped: total - attempted, score, pointsPerCorrect: POINTS_PER_CORRECT, negative: NEGATIVE }
}

module.exports = { listTests, getTest, getTestMeta, getQuestions, submit, listAttempts }
