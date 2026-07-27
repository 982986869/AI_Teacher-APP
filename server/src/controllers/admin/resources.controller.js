'use strict'

// Admin management of the REAL resource records students read: browse subjects, manage
// chapters (create / rename / reorder / hide-show / archive / delete-if-empty) and manage
// Previous-Year Papers (list / reorder / delete). Chapters carry an admin-only
// status/deleted_at (gated in resources.service.listChapters), so hiding a chapter removes
// it from the student chapter lists while its data is preserved. Authoring HTML/PDF content
// (notes, NCERT, questions, paper bodies) needs an editor + upload service and is out of
// scope — no fake authoring endpoints here.

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const audit = require('../../services/admin/audit.service')

const CH_STATUS = ['published', 'hidden', 'archived']
const int = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : parseInt(v, 10))
const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'chapter'
const isUnique = (e) => String(e && e.message || '').includes('23505')

// ─── GET /api/admin/resources/subjects?class=&search= ─────────────────────────
// Class-scoped: with ?class, only subjects that have chapters OR papers for THAT class, and
// chapter/hidden/paper counts scoped to that class (never global). Without ?class → global.
async function subjects(req, res, next) {
  try {
    const p = []; const bind = (v) => { p.push(v); return `$${p.length}` }
    const search = req.query.search ? `%${String(req.query.search).trim()}%` : null
    const cls = int(req.query.class)
    const searchCond = search ? `s.name ILIKE ${bind(search)}` : 'TRUE'
    const chClass = cls != null ? `AND c.class_level = ${bind(cls)}` : ''
    const paClass = cls != null ? `AND p.class_level = ${bind(cls)}` : ''
    const hasContent = cls != null
      ? `AND (EXISTS (SELECT 1 FROM chapters c WHERE c.subject_id = s.id AND c.deleted_at IS NULL AND c.class_level = ${bind(cls)})
             OR EXISTS (SELECT 1 FROM papers p WHERE p.subject_id = s.id AND p.class_level = ${bind(cls)}))`
      : ''
    const rows = await db.$queryRawUnsafe(
      `SELECT s.id::text AS id, s.name, s.slug, s.position,
              (SELECT count(*) FROM chapters c WHERE c.subject_id = s.id AND c.deleted_at IS NULL ${chClass})::int AS "chapterCount",
              (SELECT count(*) FROM chapters c WHERE c.subject_id = s.id AND c.deleted_at IS NULL AND c.status <> 'published' ${chClass})::int AS "hiddenCount",
              (SELECT count(*) FROM papers p WHERE p.subject_id = s.id ${paClass})::int AS "paperCount"
         FROM subjects s
        WHERE ${searchCond} ${hasContent}
        ORDER BY s.position ASC, s.name ASC`, ...p)
    return ApiResponse.success(res, { rows })
  } catch (e) { next(e) }
}

// ─── GET /api/admin/resources/classes — classes that actually have chapters/papers ──
async function classesList(req, res, next) {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT n FROM (
         SELECT DISTINCT class_level::int AS n FROM chapters WHERE deleted_at IS NULL AND class_level IS NOT NULL
         UNION
         SELECT DISTINCT class_level::int AS n FROM papers WHERE class_level IS NOT NULL
       ) x WHERE n BETWEEN 1 AND 12 ORDER BY n`)
    return ApiResponse.success(res, { classes: rows.map((r) => r.n) })
  } catch (e) { next(e) }
}

// ─── PATCH /api/admin/resources/subjects/:id (rename display name) ────────────
async function renameSubject(req, res, next) {
  try {
    const name = String(req.body.name || '').trim()
    if (!name) throw new AppError('A subject name is required', 422)
    const r = await db.$executeRawUnsafe(`UPDATE subjects SET name = $2 WHERE id = $1::bigint`, req.params.id, name)
    if (!r) throw new AppError('Subject not found', 404)
    await audit.record(req, { module: 'resources', action: 'subject.rename', targetType: 'subject', targetId: String(req.params.id), targetLabel: name })
    return ApiResponse.success(res, { id: req.params.id, name })
  } catch (e) { next(e) }
}

// ─── GET /api/admin/resources/subjects/:slug/chapters?class= ──────────────────
async function chapters(req, res, next) {
  try {
    const cls = int(req.query.class)
    const [s] = await db.$queryRawUnsafe(`SELECT id::text AS id, name, slug FROM subjects WHERE slug = $1 LIMIT 1`, req.params.slug)
    if (!s) throw new AppError('Subject not found', 404)
    const rows = await db.$queryRawUnsafe(
      `SELECT c.id::text AS id, c.name, c.slug, c.class_level AS "classLevel", c.position, c.status,
              (EXISTS (SELECT 1 FROM sections se WHERE se.chapter_id = c.id)
               OR EXISTS (SELECT 1 FROM subtopics su WHERE su.chapter_id = c.id)) AS "hasContent"
         FROM chapters c
        WHERE c.subject_id = $1::bigint AND c.deleted_at IS NULL ${cls != null ? 'AND c.class_level = $2' : ''}
        ORDER BY c.position ASC, c.name ASC`, ...(cls != null ? [s.id, cls] : [s.id]))
    return ApiResponse.success(res, { subject: s, rows })
  } catch (e) { next(e) }
}

async function loadChapterOr404(id) {
  const [c] = await db.$queryRawUnsafe(`SELECT * FROM chapters WHERE id = $1::bigint AND deleted_at IS NULL LIMIT 1`, id)
  if (!c) throw new AppError('Chapter not found', 404)
  return c
}
async function chapterHasContent(id) {
  const [r] = await db.$queryRawUnsafe(
    `SELECT (EXISTS (SELECT 1 FROM sections WHERE chapter_id = $1::bigint) OR EXISTS (SELECT 1 FROM subtopics WHERE chapter_id = $1::bigint)) AS has`, id)
  return !!(r && r.has)
}

// ─── POST /api/admin/resources/subjects/:slug/chapters ────────────────────────
async function createChapter(req, res, next) {
  try {
    const [s] = await db.$queryRawUnsafe(`SELECT id::text AS id FROM subjects WHERE slug = $1 LIMIT 1`, req.params.slug)
    if (!s) throw new AppError('Subject not found', 404)
    const name = String(req.body.name || '').trim()
    if (!name) throw new AppError('A chapter name is required', 422)
    const cls = int(req.body.classLevel)
    if (cls == null) throw new AppError('A class is required', 422)
    const slug = slugify(req.body.slug || name)
    const [posr] = await db.$queryRawUnsafe(`SELECT COALESCE(MAX(position),-1)+1 AS pos FROM chapters WHERE subject_id = $1::bigint AND class_level = $2 AND deleted_at IS NULL`, s.id, cls)
    let row
    try {
      row = await db.$queryRawUnsafe(
        `INSERT INTO chapters (subject_id, name, slug, class_level, position, status)
         VALUES ($1::bigint,$2,$3,$4,$5,'published') RETURNING id::text AS id, name, slug, class_level AS "classLevel", position, status`,
        s.id, name, slug, cls, (posr && posr.pos) || 0)
    } catch (e) { if (isUnique(e)) throw new AppError(`A chapter with slug "${slug}" already exists in this class`, 409, 'DUPLICATE_SLUG'); throw e }
    await audit.record(req, { module: 'resources', action: 'chapter.create', targetType: 'chapter', targetId: row[0].id, targetLabel: name })
    return ApiResponse.created(res, { chapter: row[0] })
  } catch (e) { next(e) }
}

// ─── PATCH /api/admin/resources/chapters/:id ──────────────────────────────────
async function updateChapter(req, res, next) {
  try {
    const c = await loadChapterOr404(req.params.id)
    const sets = []; const p = []; const bind = (v) => { p.push(v); return `$${p.length}` }
    if (req.body.name !== undefined) { if (!String(req.body.name).trim()) throw new AppError('Name cannot be empty', 422); sets.push(`name = ${bind(String(req.body.name).trim())}`) }
    if (req.body.slug !== undefined) sets.push(`slug = ${bind(slugify(req.body.slug))}`)
    if (req.body.classLevel !== undefined) sets.push(`class_level = ${bind(int(req.body.classLevel))}`)
    if (!sets.length) throw new AppError('Nothing to update', 400)
    try { await db.$executeRawUnsafe(`UPDATE chapters SET ${sets.join(', ')} WHERE id = ${bind(c.id)}::bigint`, ...p) }
    catch (e) { if (isUnique(e)) throw new AppError('That slug is already used in this class', 409, 'DUPLICATE_SLUG'); throw e }
    await audit.record(req, { module: 'resources', action: 'chapter.update', targetType: 'chapter', targetId: String(c.id), targetLabel: c.name })
    const [row] = await db.$queryRawUnsafe(`SELECT id::text AS id, name, slug, class_level AS "classLevel", position, status FROM chapters WHERE id = $1::bigint`, c.id)
    return ApiResponse.success(res, { chapter: row })
  } catch (e) { next(e) }
}

// ─── POST /api/admin/resources/chapters/:id/status  { status } ────────────────
async function chapterStatus(req, res, next) {
  try {
    const c = await loadChapterOr404(req.params.id)
    const status = String(req.body.status || '')
    if (!CH_STATUS.includes(status)) throw new AppError(`status must be one of ${CH_STATUS.join(', ')}`, 422)
    await db.$executeRawUnsafe(`UPDATE chapters SET status = $2 WHERE id = $1::bigint`, c.id, status)
    await audit.record(req, { module: 'resources', action: `chapter.${status}`, targetType: 'chapter', targetId: String(c.id), targetLabel: c.name, before: { status: c.status }, after: { status } })
    return ApiResponse.success(res, { id: String(c.id), status }, `Chapter ${status}`)
  } catch (e) { next(e) }
}

// ─── POST /api/admin/resources/chapters/reorder  { subjectSlug, classLevel, orderedIds } ──
async function reorderChapters(req, res, next) {
  try {
    const { orderedIds } = req.body
    if (!Array.isArray(orderedIds) || !orderedIds.length) throw new AppError('orderedIds must be a non-empty array', 422)
    await db.$transaction(orderedIds.map((id, i) => db.$executeRawUnsafe(`UPDATE chapters SET position = $2 WHERE id = $1::bigint AND deleted_at IS NULL`, int(id), i)))
    await audit.record(req, { module: 'resources', action: 'chapter.reorder', targetType: 'chapter', targetId: 'batch', targetLabel: `reordered ${orderedIds.length}` })
    return ApiResponse.success(res, { reordered: orderedIds.length }, 'Order updated')
  } catch (e) { next(e) }
}

// ─── DELETE /api/admin/resources/chapters/:id (soft; blocked if it has content) ─
async function deleteChapter(req, res, next) {
  try {
    const c = await loadChapterOr404(req.params.id)
    if (await chapterHasContent(c.id)) {
      throw new AppError('This chapter has content (notes / questions). Archive it instead of deleting.', 409, 'HAS_CONTENT')
    }
    await db.$executeRawUnsafe(`UPDATE chapters SET deleted_at = now() WHERE id = $1::bigint`, c.id)
    await audit.record(req, { module: 'resources', action: 'chapter.delete', targetType: 'chapter', targetId: String(c.id), targetLabel: c.name })
    return ApiResponse.success(res, { id: String(c.id) }, 'Removed')
  } catch (e) { next(e) }
}

// ─── Chapter revision NOTES (the actual content students read) ─────────────────
// A chapter's notes = one `sections` row (type_key='revision_notes') + one `notes` row
// (intro + blocks[{title,content}]). Read by the student via resources.service.getNotesByPath.
async function chapterNotes(req, res, next) {
  try {
    const c = await loadChapterOr404(req.params.id)
    const sec = await db.$queryRawUnsafe(`SELECT id FROM sections WHERE chapter_id = $1::bigint AND type_key = 'revision_notes' LIMIT 1`, c.id)
    if (!sec.length) return ApiResponse.success(res, { intro: '', blocks: [] })
    const note = await db.$queryRawUnsafe(`SELECT intro, blocks FROM notes WHERE section_id = $1::bigint LIMIT 1`, sec[0].id)
    const n = note[0] || {}
    return ApiResponse.success(res, { intro: n.intro || '', blocks: Array.isArray(n.blocks) ? n.blocks : [] })
  } catch (e) { next(e) }
}

async function saveChapterNotes(req, res, next) {
  try {
    const c = await loadChapterOr404(req.params.id)
    const intro = String(req.body.intro || '').trim()
    // Blocks are { title, html } — the student notes renderer reads block.html (see
    // ResourcesScreen). The client sends html it either preserved (unchanged block) or
    // generated from the admin's text, so existing formatting is never silently wiped.
    const blocks = (Array.isArray(req.body.blocks) ? req.body.blocks : [])
      .map((b) => ({ title: String(b && b.title || '').trim(), html: String(b && b.html || '') }))
      .filter((b) => b.title || String(b.html).replace(/<[^>]*>/g, '').trim())
    // Make sure the section type exists, then upsert the section + the notes row.
    await db.$executeRawUnsafe(`INSERT INTO section_types (key, label) VALUES ('revision_notes', 'Revision Notes') ON CONFLICT (key) DO NOTHING`)
    let sec = await db.$queryRawUnsafe(`SELECT id FROM sections WHERE chapter_id = $1::bigint AND type_key = 'revision_notes' LIMIT 1`, c.id)
    if (!sec.length) sec = await db.$queryRawUnsafe(`INSERT INTO sections (chapter_id, type_key, position) VALUES ($1::bigint, 'revision_notes', 0) RETURNING id`, c.id)
    const secId = sec[0].id
    await db.$executeRawUnsafe(
      `INSERT INTO notes (section_id, intro, blocks) VALUES ($1::bigint, $2, $3::jsonb)
       ON CONFLICT (section_id) DO UPDATE SET intro = EXCLUDED.intro, blocks = EXCLUDED.blocks`,
      secId, intro, JSON.stringify(blocks))
    await audit.record(req, { module: 'resources', action: 'chapter.notes.save', targetType: 'chapter', targetId: String(c.id), targetLabel: c.name, after: { blocks: blocks.length } })
    return ApiResponse.success(res, { intro, blocks }, 'Notes saved')
  } catch (e) { next(e) }
}

// ─── Chapter QUESTION content (Important Questions / PYQ / Practice) ───────────
// A question section = one `sections` row (type_key) + `questions` rows (question_html +
// solution_html [+ mcq options]). Q&A types here store question + solution. Read by students
// via resources.service.getQuestionsByPath.
const QTYPES = { important_questions: 'Important Questions', pyq: 'Previous Year Questions', practice: 'Practice Questions' }

async function chapterQuestions(req, res, next) {
  try {
    const c = await loadChapterOr404(req.params.id)
    const type = String(req.params.type || '')
    if (!QTYPES[type]) throw new AppError('Invalid content type', 422)
    const sec = await db.$queryRawUnsafe(`SELECT id FROM sections WHERE chapter_id = $1::bigint AND type_key = $2 LIMIT 1`, c.id, type)
    if (!sec.length) return ApiResponse.success(res, { questions: [] })
    const qs = await db.$queryRawUnsafe(
      `SELECT q_number AS "qNumber", question_html AS "questionHtml", solution_html AS "solutionHtml",
              is_mcq AS "isMcq", options, correct_option AS "correctOption"
         FROM questions WHERE section_id = $1::bigint ORDER BY position ASC, id ASC`, sec[0].id)
    return ApiResponse.success(res, { questions: qs })
  } catch (e) { next(e) }
}

async function saveChapterQuestions(req, res, next) {
  try {
    const c = await loadChapterOr404(req.params.id)
    const type = String(req.params.type || '')
    if (!QTYPES[type]) throw new AppError('Invalid content type', 422)
    // Letters label MCQ options the same way imported content does (idx: 'A'|'B'|…),
    // so student-authored MCQs render identically to extracted ones (resources.service.toMcq).
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
    const items = (Array.isArray(req.body.questions) ? req.body.questions : [])
      .map((q, i) => {
        // Normalize MCQ options → [{ idx:'A', html, is_correct }]; drop empty bodies.
        const options = (Array.isArray(q && q.options) ? q.options : [])
          .map((o, j) => ({
            idx: (o && o.idx && String(o.idx).trim()) || LETTERS[j] || String(j + 1),
            html: String((o && o.html) || ''),
            is_correct: Boolean(o && (o.isCorrect || o.is_correct)),
          }))
          .filter((o) => o.html.replace(/<[^>]*>/g, '').trim())
        // A row is a real MCQ only with ≥2 options and exactly one marked correct.
        const isMcq = Boolean(q && q.isMcq) && options.length >= 2 && options.filter((o) => o.is_correct).length === 1
        const correctOption = isMcq ? (options.find((o) => o.is_correct) || {}).idx || null : null
        return {
          qNumber: q && q.qNumber ? String(q.qNumber).slice(0, 40) : `Q${i + 1}`,
          questionHtml: String(q && q.questionHtml || ''),
          solutionHtml: String(q && q.solutionHtml || ''),
          isMcq,
          options: isMcq ? options : null,
          correctOption,
        }
      })
      .filter((q) => q.questionHtml.replace(/<[^>]*>/g, '').trim())
    await db.$executeRawUnsafe(`INSERT INTO section_types (key, label) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`, type, QTYPES[type])
    let sec = await db.$queryRawUnsafe(`SELECT id FROM sections WHERE chapter_id = $1::bigint AND type_key = $2 LIMIT 1`, c.id, type)
    if (!sec.length) sec = await db.$queryRawUnsafe(`INSERT INTO sections (chapter_id, type_key, position) VALUES ($1::bigint, $2, 0) RETURNING id`, c.id, type)
    const secId = sec[0].id
    // Full replace: clear and re-insert (simplest correct "save" for the editor).
    await db.$transaction([
      db.$executeRawUnsafe(`DELETE FROM questions WHERE section_id = $1::bigint`, secId),
      ...items.map((q, i) => db.$executeRawUnsafe(
        `INSERT INTO questions (section_id, q_number, question_html, is_mcq, options, correct_option, solution_html, position)
         VALUES ($1::bigint, $2, $3, $4, $5::jsonb, $6, $7, $8)`,
        secId, q.qNumber, q.questionHtml, q.isMcq, q.options != null ? JSON.stringify(q.options) : null, q.correctOption, q.solutionHtml, i)),
    ])
    await audit.record(req, { module: 'resources', action: 'chapter.questions.save', targetType: 'chapter', targetId: String(c.id), targetLabel: c.name, after: { type, count: items.length } })
    return ApiResponse.success(res, { count: items.length }, 'Saved')
  } catch (e) { next(e) }
}

// ─── Papers (self-contained table; reorder/delete reflect on the student side) ──
async function papers(req, res, next) {
  try {
    const cls = int(req.query.class)
    const [s] = await db.$queryRawUnsafe(`SELECT id::text AS id, name FROM subjects WHERE slug = $1 LIMIT 1`, req.params.slug)
    if (!s) throw new AppError('Subject not found', 404)
    const rows = await db.$queryRawUnsafe(
      `SELECT ext_uid AS "extUid", year, code, set_label AS "setLabel", region, name, paper_title AS "paperTitle", paper_format AS "paperFormat", position
         FROM papers WHERE subject_id = $1::bigint ${cls != null ? 'AND class_level = $2' : ''} ORDER BY position ASC, year DESC NULLS LAST`,
      ...(cls != null ? [s.id, cls] : [s.id]))
    return ApiResponse.success(res, { subject: s, rows })
  } catch (e) { next(e) }
}
async function reorderPapers(req, res, next) {
  try {
    const cls = int(req.body.classLevel)
    const [s] = await db.$queryRawUnsafe(`SELECT id::text AS id FROM subjects WHERE slug = $1 LIMIT 1`, req.params.slug)
    if (!s) throw new AppError('Subject not found', 404)
    const ids = req.body.orderedExtUids
    if (!Array.isArray(ids) || !ids.length) throw new AppError('orderedExtUids must be a non-empty array', 422)
    await db.$transaction(ids.map((ext, i) => db.$executeRawUnsafe(
      `UPDATE papers SET position = $3 WHERE subject_id = $1::bigint AND ext_uid = $2 ${cls != null ? 'AND class_level = $4' : ''}`,
      ...(cls != null ? [s.id, String(ext), i, cls] : [s.id, String(ext), i]))))
    await audit.record(req, { module: 'resources', action: 'paper.reorder', targetType: 'paper', targetId: s.id, targetLabel: `reordered ${ids.length}` })
    return ApiResponse.success(res, { reordered: ids.length }, 'Order updated')
  } catch (e) { next(e) }
}
async function deletePaper(req, res, next) {
  try {
    const cls = int(req.query.class)
    const [s] = await db.$queryRawUnsafe(`SELECT id::text AS id FROM subjects WHERE slug = $1 LIMIT 1`, req.params.slug)
    if (!s) throw new AppError('Subject not found', 404)
    const ext = String(req.query.extUid || '')
    if (!ext) throw new AppError('extUid is required', 422)
    const r = await db.$executeRawUnsafe(
      `DELETE FROM papers WHERE subject_id = $1::bigint AND ext_uid = $2 ${cls != null ? 'AND class_level = $3' : ''}`,
      ...(cls != null ? [s.id, ext, cls] : [s.id, ext]))
    if (!r) throw new AppError('Paper not found', 404)
    await audit.record(req, { module: 'resources', action: 'paper.delete', targetType: 'paper', targetId: ext, targetLabel: ext })
    return ApiResponse.success(res, { extUid: ext }, 'Paper removed')
  } catch (e) { next(e) }
}

// Fetch ONE paper with its full HTML bodies, for the admin editor.
async function paperOne(req, res, next) {
  try {
    const [s] = await db.$queryRawUnsafe(`SELECT id::text AS id, name FROM subjects WHERE slug = $1 LIMIT 1`, req.params.slug)
    if (!s) throw new AppError('Subject not found', 404)
    const ext = String(req.params.extUid || '')
    const [p] = await db.$queryRawUnsafe(
      `SELECT ext_uid AS "extUid", class_level AS "classLevel", year, code, set_label AS "setLabel", region, name,
              paper_title AS "paperTitle", paper_format AS "paperFormat",
              question_paper_html AS "questionPaperHtml", answer_key_html AS "answerKeyHtml", position
         FROM papers WHERE subject_id = $1::bigint AND ext_uid = $2 LIMIT 1`, s.id, ext)
    if (!p) throw new AppError('Paper not found', 404)
    return ApiResponse.success(res, { subject: s, paper: p })
  } catch (e) { next(e) }
}

// Shared field extraction for create/update. Metadata + the two HTML bodies (students render
// question_paper_html / answer_key_html in a MathJax WebView — {tex}…{/tex} → \(…\)).
function paperFields(body) {
  const str = (v, n) => (v == null ? null : String(v).slice(0, n))
  const yr = body.year != null && String(body.year).trim() ? parseInt(String(body.year).replace(/\D/g, ''), 10) : null
  return {
    year: Number.isFinite(yr) ? yr : null,
    code: str(body.code, 60),
    setLabel: str(body.setLabel, 60),
    name: str(body.name, 200),
    paperTitle: str(body.paperTitle, 200),
    region: str(body.region, 120),
    questionPaperHtml: body.questionPaperHtml != null ? String(body.questionPaperHtml) : '',
    answerKeyHtml: body.answerKeyHtml != null ? String(body.answerKeyHtml) : '',
  }
}

async function updatePaper(req, res, next) {
  try {
    const [s] = await db.$queryRawUnsafe(`SELECT id::text AS id FROM subjects WHERE slug = $1 LIMIT 1`, req.params.slug)
    if (!s) throw new AppError('Subject not found', 404)
    const ext = String(req.params.extUid || '')
    const [exists] = await db.$queryRawUnsafe(`SELECT ext_uid FROM papers WHERE subject_id = $1::bigint AND ext_uid = $2 LIMIT 1`, s.id, ext)
    if (!exists) throw new AppError('Paper not found', 404)
    const f = paperFields(req.body)
    await db.$executeRawUnsafe(
      `UPDATE papers SET year = $3, code = $4, set_label = $5, name = $6, paper_title = $7, region = $8,
              question_paper_html = $9, answer_key_html = $10, paper_format = 'html'
         WHERE subject_id = $1::bigint AND ext_uid = $2`,
      s.id, ext, f.year, f.code, f.setLabel, f.name, f.paperTitle, f.region, f.questionPaperHtml, f.answerKeyHtml)
    await audit.record(req, { module: 'resources', action: 'paper.update', targetType: 'paper', targetId: ext, targetLabel: f.paperTitle || f.name || ext })
    return ApiResponse.success(res, { extUid: ext }, 'Saved')
  } catch (e) { next(e) }
}

async function createPaper(req, res, next) {
  try {
    const [s] = await db.$queryRawUnsafe(`SELECT id::text AS id FROM subjects WHERE slug = $1 LIMIT 1`, req.params.slug)
    if (!s) throw new AppError('Subject not found', 404)
    const cls = int(req.body.classLevel)
    if (cls == null) throw new AppError('classLevel is required', 422)
    const f = paperFields(req.body)
    if (!f.paperTitle && !f.name) throw new AppError('A paper title or name is required', 422)
    const [pos] = await db.$queryRawUnsafe(`SELECT COALESCE(MAX(position), -1) + 1 AS n FROM papers WHERE subject_id = $1::bigint AND class_level = $2`, s.id, cls)
    const [row] = await db.$queryRawUnsafe(
      `INSERT INTO papers (subject_id, class_level, year, code, set_label, name, paper_title, region, paper_format, question_paper_html, answer_key_html, position, ext_uid)
       VALUES ($1::bigint, $2, $3, $4, $5, $6, $7, $8, 'html', $9, $10, $11, gen_random_uuid()::text)
       RETURNING ext_uid AS "extUid"`,
      s.id, cls, f.year, f.code, f.setLabel, f.name, f.paperTitle, f.region, f.questionPaperHtml, f.answerKeyHtml, Number(pos.n))
    await audit.record(req, { module: 'resources', action: 'paper.create', targetType: 'paper', targetId: row.extUid, targetLabel: f.paperTitle || f.name || row.extUid })
    return ApiResponse.success(res, { extUid: row.extUid }, 'Paper added')
  } catch (e) { next(e) }
}

module.exports = { subjects, classesList, renameSubject, chapters, createChapter, updateChapter, chapterStatus, reorderChapters, deleteChapter, chapterNotes, saveChapterNotes, chapterQuestions, saveChapterQuestions, papers, paperOne, updatePaper, createPaper, reorderPapers, deletePaper }
