'use strict'

const db = require('../config/database')

const num = (v) => (typeof v === 'bigint' ? Number(v) : v)
const LETTERS = 'ABCDEFGHIJ'.split('')

// ─── Chapters of a subject that have online tests (with test counts) ──────────
async function listChapters(subjectSlug, classLevel = 7) {
  const rows = await db.ot_tests.findMany({
    where: { subject_slug: subjectSlug, class_level: classLevel },
    orderBy: [{ chapter_pos: 'asc' }, { position: 'asc' }],
    select: { chapter_name: true, chapter_slug: true, chapter_pos: true },
  })
  if (!rows.length) return []
  // Group by chapter, preserving first-seen order, counting tests.
  const byChapter = new Map()
  for (const r of rows) {
    const cur = byChapter.get(r.chapter_slug)
    if (cur) cur.testCount++
    else byChapter.set(r.chapter_slug, { name: r.chapter_name, slug: r.chapter_slug, chapterPos: r.chapter_pos, testCount: 1 })
  }
  return [...byChapter.values()].sort((a, b) => a.chapterPos - b.chapterPos)
}

// ─── Tests within a chapter ───────────────────────────────────────────────────
async function listTests(subjectSlug, chapterSlug, classLevel = 7) {
  const rows = await db.ot_tests.findMany({
    where: { subject_slug: subjectSlug, class_level: classLevel, chapter_slug: chapterSlug },
    orderBy: { position: 'asc' },
    include: { _count: { select: { questions: true } } },
  })
  return rows.map((t) => ({
    id: num(t.id),
    name: t.name,
    durationMin: t.duration_min,
    totalMarks: t.total_marks,
    questionCount: t._count.questions,
    isPaid: t.is_paid,
  }))
}

// Shape a question row for the runner: options keyed A/B/C…, correctAnswer = key.
// The answer travels with the payload — grading + review happen client-side, exactly
// like MCQ Practice.
function shapeQuestion(q) {
  const options = (Array.isArray(q.options) ? q.options : []).map((o, i) => ({
    key: LETTERS[i],
    label: o.html,
    optionId: o.id,
  }))
  const correct = options.find((o) => String(o.optionId) === String(q.correct_option_id))
  return {
    id: num(q.id),
    text: q.question_html,
    options,
    correctAnswer: correct ? correct.key : null,
    correctOptionId: q.correct_option_id != null ? num(q.correct_option_id) : null,
    explanation: q.explanation_html,
    marks: q.marks,
  }
}

// ─── Full test (instruction + questions) ──────────────────────────────────────
async function getTest(testId) {
  const test = await db.ot_tests.findUnique({
    where: { id: BigInt(testId) },
    include: { questions: { orderBy: { position: 'asc' } } },
  })
  if (!test) return null
  return {
    id: num(test.id),
    name: test.name,
    subjectName: test.subject_name,
    chapterName: test.chapter_name,
    instructionHtml: test.instruction_html || '',
    durationMin: test.duration_min,
    totalMarks: test.total_marks,
    questionCount: test.questions.length,
    questions: test.questions.map(shapeQuestion),
  }
}

// ─── Submit ──────────────────────────────────────────────────────────────────
// Authoritative server-side scoring, mirroring mockTest.service.submit. The client
// still receives the correct answers with the test (it renders the review screen
// instantly), so this is not an anti-cheat measure — it is what keeps the STORED
// score consistent with the STORED answers, which is what later features
// (mistake book, weak areas) have to be able to trust.
// answers = { "<questionId>": <selectedOptionId> } — absent questions count as skipped.
async function submit({ testId, userId, answers = {}, timeTakenSec = 0 }) {
  const rows = await db.ot_questions.findMany({
    where: { ot_test_id: BigInt(testId) },
    select: { id: true, correct_option_id: true, marks: true },
  })
  if (!rows.length) return null

  const total = rows.length
  let attempted = 0
  let correct = 0
  let score = 0
  for (const r of rows) {
    const sel = answers[String(r.id)] != null ? answers[String(r.id)] : answers[num(r.id)]
    if (sel == null) continue
    attempted += 1
    if (r.correct_option_id != null && String(sel) === String(r.correct_option_id)) {
      correct += 1
      score += Number(r.marks) || 1
    }
  }
  const wrong = attempted - correct

  // Persist best-effort: the student's result must still come back even if the
  // write fails, exactly like the mock-test path.
  try {
    await db.$executeRawUnsafe(
      `INSERT INTO ot_attempts (user_id, ot_test_id, answers, total, attempted, correct_count, wrong_count, score, time_taken_sec)
       VALUES ($1::uuid,$2::bigint,$3::jsonb,$4,$5,$6,$7,$8,$9)`,
      userId || null, String(testId), JSON.stringify(answers || {}),
      total, attempted, correct, wrong, score, Number(timeTakenSec) || 0,
    )
  } catch (e) { console.warn('[OnlineTest] attempt save skipped:', e.message) }

  return { total, attempted, correct, wrong, skipped: total - attempted, score }
}

module.exports = { listChapters, listTests, getTest, submit }
