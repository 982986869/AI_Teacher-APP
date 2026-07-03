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

module.exports = { listChapters, listTests, getTest }
