'use strict'

const db = require('../config/database')

const num = (v) => (typeof v === 'bigint' ? Number(v) : v)
const LETTERS = 'ABCDEFGHIJ'.split('')

// ─── Subtopics of a chapter (with question counts) ────────────────────────────
async function listSubtopics(subjectSlug, chapterSlug, classLevel = null) {
  const subject = await db.subjects.findUnique({ where: { slug: subjectSlug } })
  if (!subject) return null
  const chapter = await db.chapters.findFirst({
    where: { slug: chapterSlug, subject_id: subject.id, class_level: classLevel },
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

// ─── All MCQs of a chapter (across its subtopics) — chapter-level test ────────
async function getChapterTest(subjectSlug, chapterSlug, classLevel = null) {
  const subject = await db.subjects.findUnique({ where: { slug: subjectSlug } })
  if (!subject) return null
  const chapter = await db.chapters.findFirst({
    where: { slug: chapterSlug, subject_id: subject.id, class_level: classLevel },
  })
  if (!chapter) return null
  const rows = await db.mcq_questions.findMany({
    where: { subtopics: { chapter_id: chapter.id } },
    orderBy: [{ subtopic_id: 'asc' }, { position: 'asc' }],
  })
  return { chapter: { id: num(chapter.id), name: chapter.name }, questions: rows.map(shapeQuestion) }
}

// ─── Submit + PERSIST attempts (per user) ────────────────────────────────────
// Grades the answers, saves each answered question to mcq_attempts (upsert),
// and returns the score breakdown.
async function submitTest(userId, subtopicId, answers) {
  const graded = await gradeSubmission(subtopicId, answers)
  if (!graded) return null
  const attempted = graded.results.filter((r) => r.selectedOptionId != null)
  if (userId && attempted.length) {
    const tuples = []
    const params = []
    attempted.forEach((r, i) => {
      const b = i * 5
      tuples.push(`($${b + 1}::uuid,$${b + 2}::bigint,$${b + 3}::bigint,$${b + 4}::bigint,$${b + 5}::boolean,now())`)
      params.push(userId, r.questionId, subtopicId, r.selectedOptionId, r.isCorrect)
    })
    await db.$executeRawUnsafe(
      `insert into mcq_attempts (user_id, question_id, subtopic_id, selected_option_id, is_correct, updated_at)
       values ${tuples.join(',')}
       on conflict (user_id, question_id) do update set
         selected_option_id = excluded.selected_option_id,
         is_correct = excluded.is_correct,
         subtopic_id = excluded.subtopic_id,
         updated_at = now()`,
      ...params
    )
  }
  return graded
}

// ─── Per-user progress for a chapter: each subtopic's answered/total/score ────
async function getProgress(subjectSlug, chapterSlug, userId, classLevel = null) {
  const rows = await db.$queryRawUnsafe(
    `select st.id::text as id, st.name, st.position,
       count(mq.id) as total,
       count(a.id) as answered,
       count(a.id) filter (where a.is_correct) as correct
     from subtopics st
     join chapters ch on ch.id = st.chapter_id
     join subjects sub on sub.id = ch.subject_id
     left join mcq_questions mq on mq.subtopic_id = st.id
     left join mcq_attempts a on a.question_id = mq.id and a.user_id = $1::uuid
     where sub.slug = $2 and ch.slug = $3 and ch.class_level = $4
     group by st.id, st.name, st.position
     order by st.position`,
    userId, subjectSlug, chapterSlug, classLevel
  )
  if (!rows.length) return null
  const pct = (n, d) => (d ? Math.round((n / d) * 10000) / 100 : 0)
  const subtopics = rows.map((r) => {
    const total = Number(r.total), answered = Number(r.answered), correct = Number(r.correct)
    return { id: Number(r.id), name: r.name, total, answered, score: pct(correct, answered) }
  })
  const total = subtopics.reduce((a, s) => a + s.total, 0)
  const answered = subtopics.reduce((a, s) => a + s.answered, 0)
  const correct = rows.reduce((a, r) => a + Number(r.correct), 0)
  return { chapter: { total, answered, score: pct(correct, answered) }, subtopics }
}

module.exports = { listSubtopics, getSubtopicTest, getChapterTest, gradeSubmission, submitTest, getProgress }
