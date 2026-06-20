'use strict'

const db = require('../config/database')

// Prisma returns BigInt for these tables' ids — convert to Number for JSON.
const num = (v) => (typeof v === 'bigint' ? Number(v) : v)

function mapQuestion(q) {
  return {
    id: num(q.id),
    qNumber: q.q_number,
    year: q.year,
    questionHtml: q.question_html,
    isMcq: q.is_mcq,
    options: q.options, // JSON: [{ idx, html, is_correct }]
    correctOption: q.correct_option,
    solutionHtml: q.solution_html,
    position: q.position,
  }
}

// ─── Subjects ────────────────────────────────────────────────────────────────
async function listSubjects() {
  const rows = await db.subjects.findMany({ orderBy: { position: 'asc' } })
  return rows.map((s) => ({ id: num(s.id), name: s.name, slug: s.slug, position: s.position }))
}

// ─── Chapters of a subject (by slug) ──────────────────────────────────────────
async function listChapters(subjectSlug) {
  const subject = await db.subjects.findUnique({ where: { slug: subjectSlug } })
  if (!subject) return null
  const rows = await db.chapters.findMany({
    where: { subject_id: subject.id },
    orderBy: { position: 'asc' },
  })
  return rows.map((c) => ({ id: num(c.id), name: c.name, slug: c.slug, position: c.position }))
}

// ─── Sections of a chapter ────────────────────────────────────────────────────
async function listSections(chapterId) {
  const rows = await db.sections.findMany({
    where: { chapter_id: BigInt(chapterId) },
    orderBy: { position: 'asc' },
    include: { section_types: true },
  })
  return rows.map((s) => ({
    id: num(s.id),
    type: s.type_key,
    label: s.section_types ? s.section_types.label : s.type_key,
    position: s.position,
  }))
}

// ─── Questions of a section ───────────────────────────────────────────────────
async function listQuestions(sectionId) {
  const rows = await db.questions.findMany({
    where: { section_id: BigInt(sectionId) },
    orderBy: { position: 'asc' },
  })
  return rows.map(mapQuestion)
}

// ─── Convenience: questions by subject/chapter/section-type slugs ─────────────
async function getQuestionsByPath(subjectSlug, chapterSlug, sectionType) {
  const section = await db.sections.findFirst({
    where: {
      type_key: sectionType,
      chapters: { slug: chapterSlug, subjects: { slug: subjectSlug } },
    },
  })
  if (!section) return null
  return listQuestions(section.id)
}

module.exports = {
  listSubjects,
  listChapters,
  listSections,
  listQuestions,
  getQuestionsByPath,
}
