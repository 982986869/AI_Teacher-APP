'use strict'

const db = require('../config/database')

const num = (v) => (typeof v === 'bigint' ? Number(v) : v)
const LETTERS = 'ABCDEFGHIJ'.split('')

// ─── Subtopics of a chapter (with question counts) ────────────────────────────
async function listSubtopics(subjectSlug, chapterSlug) {
  const subject = await db.subjects.findUnique({ where: { slug: subjectSlug } })
  if (!subject) return null
  const chapter = await db.chapters.findFirst({
    where: { slug: chapterSlug, subject_id: subject.id },
  })
  if (!chapter) return null
  const rows = await db.subtopics.findMany({
    where: { chapter_id: chapter.id },
    orderBy: { position: 'asc' },
    include: { _count: { select: { mcq_questions: true } } },
  })
  return rows.map((s) => ({
    id: num(s.id),
    name: s.name,
    questionCount: s._count.mcq_questions,
  }))
}

// Shape a DB row for the test screen: options keyed A/B/C…, correctAnswer = key.
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
    difficulty: q.difficulty,
    options,
    correctAnswer: correct ? correct.key : null, // 'A' | 'B' | … | null
    correctOptionId: q.correct_option_id != null ? num(q.correct_option_id) : null,
    explanation: q.explanation_html,
  }
}

// ─── Start test: all questions for a subtopic ─────────────────────────────────
async function getSubtopicTest(subtopicId) {
  const subtopic = await db.subtopics.findUnique({ where: { id: BigInt(subtopicId) } })
  if (!subtopic) return null
  const rows = await db.mcq_questions.findMany({
    where: { subtopic_id: BigInt(subtopicId) },
    orderBy: { position: 'asc' },
  })
  return {
    subtopic: { id: num(subtopic.id), name: subtopic.name },
    questions: rows.map(shapeQuestion),
  }
}

// ─── Submit: grade answers → accuracy / completion / score ────────────────────
// answers = [{ questionId, optionId }]
async function gradeSubmission(subtopicId, answers) {
  const rows = await db.mcq_questions.findMany({
    where: { subtopic_id: BigInt(subtopicId) },
    select: { id: true, correct_option_id: true },
  })
  if (!rows.length) return null
  const correctMap = new Map(
    rows.map((r) => [String(r.id), r.correct_option_id != null ? String(r.correct_option_id) : null])
  )
  const total = rows.length
  let attempted = 0
  let correct = 0
  const results = (answers || []).map((a) => {
    const qid = String(a.questionId)
    const sel = a.optionId != null ? String(a.optionId) : null
    if (sel != null) attempted++
    const correctId = correctMap.get(qid)
    const isCorrect = sel != null && correctId != null && sel === correctId
    if (isCorrect) correct++
    return {
      questionId: Number(qid),
      selectedOptionId: a.optionId != null ? Number(a.optionId) : null,
      correctOptionId: correctId != null ? Number(correctId) : null,
      isCorrect,
    }
  })
  const pct = (n, d) => (d ? Math.round((n / d) * 10000) / 100 : 0)
  return {
    total,
    attempted,
    correct,
    accuracy: pct(correct, attempted),   // % of attempted that were right
    completion: pct(attempted, total),   // % of questions attempted
    score: pct(correct, total),          // % of all questions right
    results,
  }
}

module.exports = { listSubtopics, getSubtopicTest, gradeSubmission }
