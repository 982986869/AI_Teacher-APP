'use strict'

const db = require('../config/database')

// Prisma returns BigInt for these tables' ids — convert to Number for JSON.
const num = (v) => (typeof v === 'bigint' ? Number(v) : v)

// Question/option bodies are stored as HTML. The MCQ test screen renders plain
// text, so flatten to readable text: keep exponents (^) and subscripts (_),
// drop the rest of the markup, and decode common entities.
function htmlToText(html) {
  if (!html) return ''
  return String(html)
    // Inline math is wrapped as {tex}…{/tex}; drop the delimiters (the LaTeX
    // inside still isn't pretty in plain text — see McqTestScreen math note).
    .replace(/\{tex\}/gi, '')
    .replace(/\{\/tex\}/gi, '')
    .replace(/<sup[^>]*>(.*?)<\/sup>/gis, '^$1')
    .replace(/<sub[^>]*>(.*?)<\/sub>/gis, '_$1')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

// Map a DB question row to the shape McqTestScreen expects, or null if it is
// not a usable MCQ (no options / no identifiable correct answer). Question and
// option bodies are returned as raw HTML + {tex} LaTeX so the client can render
// them with MathText (MathJax); `questionText` is a plain-text fallback.
function toMcq(q) {
  const opts = Array.isArray(q.options) ? q.options : []
  if (opts.length < 2) return null
  let correct = opts.findIndex((o) => o.is_correct)
  if (correct < 0 && q.correct_option) {
    correct = opts.findIndex((o) => o.idx === q.correct_option)
  }
  if (correct < 0) return null
  return {
    cat: q.year || q.q_number || 'MCQ',
    question: q.question_html || '',
    questionText: htmlToText(q.question_html),
    options: opts.map((o) => o.html || ''),
    correct,
  }
}

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
// If sectionType is given, only chapters that actually have that section.
async function listChapters(subjectSlug, sectionType, classLevel = 11) {
  const subject = await db.subjects.findUnique({ where: { slug: subjectSlug } })
  if (!subject) return null
  const where = { subject_id: subject.id, class_level: classLevel }
  if (sectionType) where.sections = { some: { type_key: sectionType } }
  const rows = await db.chapters.findMany({ where, orderBy: { position: 'asc' } })
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
async function getQuestionsByPath(subjectSlug, chapterSlug, sectionType, classLevel = 11) {
  const section = await db.sections.findFirst({
    where: {
      type_key: sectionType,
      chapters: { slug: chapterSlug, class_level: classLevel, subjects: { slug: subjectSlug } },
    },
  })
  if (!section) return null
  return listQuestions(section.id)
}

// ─── Revision Notes for a chapter (notes table, by slugs) ─────────────────────
// Returns { intro, blocks } for the chapter's revision_notes section, or null.
async function getNotesByPath(subjectSlug, chapterSlug, classLevel = 11) {
  const section = await db.sections.findFirst({
    where: {
      type_key: 'revision_notes',
      chapters: { slug: chapterSlug, class_level: classLevel, subjects: { slug: subjectSlug } },
    },
  })
  if (!section) return null
  const note = await db.notes.findUnique({ where: { section_id: section.id } })
  if (!note) return null
  return { intro: note.intro, blocks: Array.isArray(note.blocks) ? note.blocks : [] }
}

// ─── MCQ questions for a chapter (across all its sections) ────────────────────
// MCQs aren't a section type of their own — they live inside pyq /
// important_questions flagged is_mcq. Gather all of them for the chapter.
async function getMcqByPath(subjectSlug, chapterSlug, classLevel = 11) {
  const subject = await db.subjects.findUnique({ where: { slug: subjectSlug } })
  if (!subject) return null
  const chapter = await db.chapters.findFirst({
    where: { slug: chapterSlug, subject_id: subject.id, class_level: classLevel },
  })
  if (!chapter) return null
  const rows = await db.questions.findMany({
    where: { is_mcq: true, sections: { chapter_id: chapter.id } },
    orderBy: [{ section_id: 'asc' }, { position: 'asc' }],
  })
  return rows.map(toMcq).filter(Boolean)
}

module.exports = {
  listSubjects,
  listChapters,
  listSections,
  listQuestions,
  getQuestionsByPath,
  getNotesByPath,
  getMcqByPath,
}
