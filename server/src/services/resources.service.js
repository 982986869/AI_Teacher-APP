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

// ─── Last Year Papers (papers table, raw SQL — not a Prisma model) ────────────
// List: metadata only (no heavy HTML). Detail: one paper's question + answer HTML.
async function listPapers(subjectSlug, classLevel = 12) {
  return db.$queryRawUnsafe(
    `SELECT p.ext_uid AS "extUid", p.code, p.year, p.set_label AS "setLabel",
            p.region, p.name, p.paper_title AS "paperTitle",
            p.pdf_file AS "pdfFile", p.paper_format AS "format", p.position
       FROM papers p JOIN subjects s ON s.id = p.subject_id
      WHERE s.slug = $1 AND p.class_level = $2
      ORDER BY p.position`,
    subjectSlug, classLevel,
  )
}

// A paper is identified by its stable `ext_uid` (uuid for HTML papers,
// 'pdf:<id>' for PDF papers). For older clients we still accept code (+year):
// CBSE reuses a code across years, so we pick the most recent unless year is given.
async function getPaper(subjectSlug, classLevel, { extUid, code, year } = {}) {
  let where = 's.slug = $1 AND p.class_level = $2'
  const params = [subjectSlug, classLevel]
  if (extUid != null && extUid !== '') {
    params.push(String(extUid)); where += ` AND p.ext_uid = $${params.length}`
  } else if (code != null && code !== '') {
    params.push(String(code)); where += ` AND p.code = $${params.length}`
    if (year != null && year !== '') { params.push(parseInt(year, 10)); where += ` AND p.year = $${params.length}` }
  } else {
    return null
  }
  const [row] = await db.$queryRawUnsafe(
    `SELECT p.ext_uid AS "extUid", p.code, p.year, p.set_label AS "setLabel",
            p.region, p.name, p.paper_title AS "paperTitle",
            p.pdf_file AS "pdfFile", p.paper_format AS "format",
            p.question_paper_html AS "questionPaperHtml", p.answer_key_html AS "answerKeyHtml"
       FROM papers p JOIN subjects s ON s.id = p.subject_id
      WHERE ${where}
      ORDER BY p.year DESC NULLS LAST
      LIMIT 1`,
    ...params,
  )
  return row || null
}

// ─── Last Year Papers: write side (admin) ─────────────────────────────────────
// `papers` is not a Prisma model — it is managed with raw SQL (see listPapers).
// A paper's identity is its stable `ext_uid` (uuid for HTML, 'pdf:<id>' for PDF).

// Normalize one incoming paper into the DB column shape. Accepts the raw
// extraction JSON ({ uuid, set, question_paper_html, ... }), a PDF index entry
// ({ id, title, file_name }), or an already-mapped shape ({ extUid, setLabel }).
function normalizePaper(p, index) {
  const year = p.year != null && p.year !== '' ? parseInt(p.year, 10) : null
  const code = p.code != null ? String(p.code) : null
  const setLabel =
    p.setLabel != null ? String(p.setLabel)
    : p.set != null ? String(p.set)
    : (code ? code.split('/').pop() : null)
  const pdfFile = p.pdfFile || p.pdf_file || p.file_name || null
  // Derive a stable identity: explicit extUid → uuid → 'pdf:<id>' → code|year|set.
  const extUid =
    p.extUid || p.ext_uid || p.uuid ||
    (p.id != null ? `pdf:${p.id}` : null) ||
    (code && year != null ? `${code}|${year}|${setLabel || ''}` : null)
  return {
    ext_uid: extUid,
    code,
    year,
    set_label: setLabel,
    region: p.region || null,
    name: p.name || null,
    paper_title: p.paperTitle || p.paper_title || p.title || null,
    pdf_file: pdfFile,
    paper_format: p.format || p.paper_format || (pdfFile && !(p.questionPaperHtml || p.question_paper_html) ? 'pdf' : 'html'),
    question_paper_html: p.questionPaperHtml || p.question_paper_html || null,
    answer_key_html: p.answerKeyHtml || p.answer_key_html || null,
    position: Number.isFinite(p.position) ? p.position : index + 1,
  }
}

// Bulk upsert papers for one subject+class. When `replace` is true, every
// existing paper for that subject+class is deleted first (clean re-import).
// Returns { inserted, deleted }.
async function upsertPapers(subjectSlug, classLevel, rawPapers, { replace = false } = {}) {
  const subject = await db.subjects.findUnique({ where: { slug: subjectSlug } })
  if (!subject) return null

  const papers = (Array.isArray(rawPapers) ? rawPapers : [])
    .map(normalizePaper)
    .filter((p) => p.ext_uid)

  return db.$transaction(async (tx) => {
    let deleted = 0
    if (replace) {
      deleted = await tx.$executeRawUnsafe(
        'DELETE FROM papers WHERE subject_id = $1 AND class_level = $2',
        subject.id, classLevel,
      )
    }
    for (const p of papers) {
      await tx.$executeRawUnsafe(
        `INSERT INTO papers
           (subject_id, class_level, ext_uid, year, code, set_label, region, name,
            paper_title, pdf_file, question_paper_html, answer_key_html, paper_format, position)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (subject_id, class_level, ext_uid)
         DO UPDATE SET year = EXCLUDED.year, code = EXCLUDED.code, set_label = EXCLUDED.set_label,
           region = EXCLUDED.region, name = EXCLUDED.name, paper_title = EXCLUDED.paper_title,
           pdf_file = EXCLUDED.pdf_file, question_paper_html = EXCLUDED.question_paper_html,
           answer_key_html = EXCLUDED.answer_key_html, paper_format = EXCLUDED.paper_format,
           position = EXCLUDED.position`,
        subject.id, classLevel, p.ext_uid, p.year, p.code, p.set_label, p.region, p.name,
        p.paper_title, p.pdf_file, p.question_paper_html, p.answer_key_html, p.paper_format, p.position,
      )
    }
    return { inserted: papers.length, deleted: Number(deleted) || 0 }
  })
}

// Delete papers for a subject+class. If `code` (and optionally `year`) is given,
// only that paper is removed; otherwise ALL papers for the subject+class go.
// Returns { deleted } or null when the subject does not exist.
async function deletePapers(subjectSlug, classLevel, { extUid, code, year } = {}) {
  const subject = await db.subjects.findUnique({ where: { slug: subjectSlug } })
  if (!subject) return null

  let sql = 'DELETE FROM papers WHERE subject_id = $1 AND class_level = $2'
  const params = [subject.id, classLevel]
  if (extUid != null && extUid !== '') {
    params.push(String(extUid))
    sql += ` AND ext_uid = $${params.length}`
  } else {
    if (code != null && code !== '') {
      params.push(String(code))
      sql += ` AND code = $${params.length}`
    }
    if (year != null && year !== '') {
      params.push(parseInt(year, 10))
      sql += ` AND year = $${params.length}`
    }
  }
  const deleted = await db.$executeRawUnsafe(sql, ...params)
  return { deleted: Number(deleted) || 0 }
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
  listPapers,
  getPaper,
  upsertPapers,
  deletePapers,
  getMcqByPath,
}
