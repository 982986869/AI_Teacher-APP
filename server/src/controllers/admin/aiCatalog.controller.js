'use strict'

// AI Teacher — admin-authored lesson CATALOG (Subjects → Chapters → Lessons → Slides).
// Phase 1 here: the Subjects + Chapters taxonomy (real CRUD). Lessons + slides CRUD follow in
// the same controller. Everything is raw SQL over ai_lesson_subjects / ai_lesson_chapters /
// lessons(+catalog columns) / slides. Soft-delete (deleted_at) everywhere so nothing is lost
// and parents hide their children by a deleted_at join; "archive" is a separate status flip.

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const audit = require('../../services/admin/audit.service')
const aiService = require('../../services/ai.service')

const int = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null }
const STATUSES = ['published', 'archived']

// ─── Subjects ────────────────────────────────────────────────────────────────
async function listSubjects(req, res, next) {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT s.id::text AS id, s.name, s.emoji, s.position, s.status,
              (SELECT count(*)::int FROM ai_lesson_chapters c WHERE c.subject_id = s.id AND c.deleted_at IS NULL) AS "chapterCount",
              (SELECT count(*)::int FROM "lessons" l WHERE l.catalog_subject_id = s.id AND l.catalog_status IS NOT NULL AND l.deleted_at IS NULL) AS "lessonCount"
         FROM ai_lesson_subjects s
        WHERE s.deleted_at IS NULL
        ORDER BY s.position ASC, s.id ASC`)
    return ApiResponse.success(res, { rows })
  } catch (e) { next(e) }
}

async function createSubject(req, res, next) {
  try {
    const name = String(req.body.name || '').trim()
    if (!name) throw new AppError('A subject name is required', 422)
    const emoji = req.body.emoji ? String(req.body.emoji).trim() : null
    const [{ pos }] = await db.$queryRawUnsafe(`SELECT COALESCE(max(position), 0) + 1 AS pos FROM ai_lesson_subjects WHERE deleted_at IS NULL`)
    const [row] = await db.$queryRawUnsafe(
      `INSERT INTO ai_lesson_subjects (name, emoji, position) VALUES ($1, $2, $3) RETURNING id::text AS id, name, emoji, position, status`,
      name, emoji, int(pos) || 1)
    await audit.record(req, { module: 'aiteacher', action: 'subject.create', targetType: 'ai_subject', targetId: row.id, targetLabel: name })
    return ApiResponse.created(res, { subject: { ...row, chapterCount: 0, lessonCount: 0 } })
  } catch (e) { next(e) }
}

async function updateSubject(req, res, next) {
  try {
    const id = int(req.params.id)
    const sets = []; const p = []; const bind = (v) => { p.push(v); return `$${p.length}` }
    if (req.body.name !== undefined) { const n = String(req.body.name).trim(); if (!n) throw new AppError('Name cannot be empty', 422); sets.push(`name = ${bind(n)}`) }
    if (req.body.emoji !== undefined) sets.push(`emoji = ${bind(req.body.emoji ? String(req.body.emoji).trim() : null)}`)
    if (!sets.length) throw new AppError('Nothing to update', 422)
    sets.push('updated_at = now()')
    const rows = await db.$queryRawUnsafe(
      `UPDATE ai_lesson_subjects SET ${sets.join(', ')} WHERE id = ${bind(id)} AND deleted_at IS NULL RETURNING id::text AS id, name, emoji, position, status`, ...p)
    if (!rows.length) throw new AppError('Subject not found', 404)
    await audit.record(req, { module: 'aiteacher', action: 'subject.update', targetType: 'ai_subject', targetId: String(id), targetLabel: rows[0].name })
    return ApiResponse.success(res, { subject: rows[0] })
  } catch (e) { next(e) }
}

async function setSubjectStatus(req, res, next) {
  try {
    const id = int(req.params.id)
    const status = String(req.body.status || '')
    if (!STATUSES.includes(status)) throw new AppError(`status must be one of ${STATUSES.join(', ')}`, 422)
    const rows = await db.$queryRawUnsafe(
      `UPDATE ai_lesson_subjects SET status = $2, updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id::text AS id, name, status`, id, status)
    if (!rows.length) throw new AppError('Subject not found', 404)
    await audit.record(req, { module: 'aiteacher', action: `subject.${status}`, targetType: 'ai_subject', targetId: String(id), targetLabel: rows[0].name })
    return ApiResponse.success(res, { subject: rows[0] })
  } catch (e) { next(e) }
}

async function reorderSubjects(req, res, next) {
  try {
    const ids = Array.isArray(req.body.orderedIds) ? req.body.orderedIds.map(int).filter((n) => n != null) : []
    await db.$transaction(ids.map((id, i) => db.$executeRawUnsafe(`UPDATE ai_lesson_subjects SET position = $2, updated_at = now() WHERE id = $1`, id, i + 1)))
    return ApiResponse.success(res, { ok: true })
  } catch (e) { next(e) }
}

// Soft delete — the subject (and, via the deleted_at join, its chapters + lessons) disappear
// from the catalog but nothing is destroyed. Reversible by clearing deleted_at.
async function deleteSubject(req, res, next) {
  try {
    const id = int(req.params.id)
    const rows = await db.$queryRawUnsafe(`UPDATE ai_lesson_subjects SET deleted_at = now(), updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING name`, id)
    if (!rows.length) throw new AppError('Subject not found', 404)
    await audit.record(req, { module: 'aiteacher', action: 'subject.delete', targetType: 'ai_subject', targetId: String(id), targetLabel: rows[0].name })
    return ApiResponse.success(res, { ok: true })
  } catch (e) { next(e) }
}

// ─── Chapters ────────────────────────────────────────────────────────────────
async function listChapters(req, res, next) {
  try {
    const subjectId = int(req.params.subjectId)
    const rows = await db.$queryRawUnsafe(
      `SELECT c.id::text AS id, c.subject_id::text AS "subjectId", c.name, c.position, c.status,
              (SELECT count(*)::int FROM "lessons" l WHERE l.catalog_chapter_id = c.id AND l.catalog_status IS NOT NULL AND l.deleted_at IS NULL) AS "lessonCount"
         FROM ai_lesson_chapters c
        WHERE c.subject_id = $1 AND c.deleted_at IS NULL
        ORDER BY c.position ASC, c.id ASC`, subjectId)
    return ApiResponse.success(res, { rows })
  } catch (e) { next(e) }
}

async function createChapter(req, res, next) {
  try {
    const subjectId = int(req.params.subjectId)
    const [subj] = await db.$queryRawUnsafe(`SELECT id FROM ai_lesson_subjects WHERE id = $1 AND deleted_at IS NULL`, subjectId)
    if (!subj) throw new AppError('Subject not found', 404)
    const name = String(req.body.name || '').trim()
    if (!name) throw new AppError('A chapter name is required', 422)
    const [{ pos }] = await db.$queryRawUnsafe(`SELECT COALESCE(max(position), 0) + 1 AS pos FROM ai_lesson_chapters WHERE subject_id = $1 AND deleted_at IS NULL`, subjectId)
    const [row] = await db.$queryRawUnsafe(
      `INSERT INTO ai_lesson_chapters (subject_id, name, position) VALUES ($1, $2, $3) RETURNING id::text AS id, subject_id::text AS "subjectId", name, position, status`,
      subjectId, name, int(pos) || 1)
    await audit.record(req, { module: 'aiteacher', action: 'chapter.create', targetType: 'ai_chapter', targetId: row.id, targetLabel: name })
    return ApiResponse.created(res, { chapter: { ...row, lessonCount: 0 } })
  } catch (e) { next(e) }
}

async function updateChapter(req, res, next) {
  try {
    const id = int(req.params.id)
    const name = String(req.body.name || '').trim()
    if (!name) throw new AppError('Name cannot be empty', 422)
    const rows = await db.$queryRawUnsafe(
      `UPDATE ai_lesson_chapters SET name = $2, updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id::text AS id, subject_id::text AS "subjectId", name, position, status`, id, name)
    if (!rows.length) throw new AppError('Chapter not found', 404)
    await audit.record(req, { module: 'aiteacher', action: 'chapter.update', targetType: 'ai_chapter', targetId: String(id), targetLabel: name })
    return ApiResponse.success(res, { chapter: rows[0] })
  } catch (e) { next(e) }
}

async function setChapterStatus(req, res, next) {
  try {
    const id = int(req.params.id)
    const status = String(req.body.status || '')
    if (!STATUSES.includes(status)) throw new AppError(`status must be one of ${STATUSES.join(', ')}`, 422)
    const rows = await db.$queryRawUnsafe(
      `UPDATE ai_lesson_chapters SET status = $2, updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id::text AS id, name, status`, id, status)
    if (!rows.length) throw new AppError('Chapter not found', 404)
    await audit.record(req, { module: 'aiteacher', action: `chapter.${status}`, targetType: 'ai_chapter', targetId: String(id), targetLabel: rows[0].name })
    return ApiResponse.success(res, { chapter: rows[0] })
  } catch (e) { next(e) }
}

// Move a chapter to another subject (keeps its lessons — they reference the chapter id).
async function moveChapter(req, res, next) {
  try {
    const id = int(req.params.id)
    const subjectId = int(req.body.subjectId)
    const [subj] = await db.$queryRawUnsafe(`SELECT id FROM ai_lesson_subjects WHERE id = $1 AND deleted_at IS NULL`, subjectId)
    if (!subj) throw new AppError('Target subject not found', 404)
    const [{ pos }] = await db.$queryRawUnsafe(`SELECT COALESCE(max(position), 0) + 1 AS pos FROM ai_lesson_chapters WHERE subject_id = $1 AND deleted_at IS NULL`, subjectId)
    const rows = await db.$queryRawUnsafe(
      `UPDATE ai_lesson_chapters SET subject_id = $2, position = $3, updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id::text AS id, name`, id, subjectId, int(pos) || 1)
    if (!rows.length) throw new AppError('Chapter not found', 404)
    // Keep the lessons' catalog_subject_id in sync with their chapter's new subject.
    await db.$executeRawUnsafe(`UPDATE "lessons" SET catalog_subject_id = $2, "updatedAt" = now() WHERE catalog_chapter_id = $1`, id, subjectId)
    await audit.record(req, { module: 'aiteacher', action: 'chapter.move', targetType: 'ai_chapter', targetId: String(id), targetLabel: rows[0].name, after: { subjectId } })
    return ApiResponse.success(res, { chapter: rows[0] })
  } catch (e) { next(e) }
}

async function reorderChapters(req, res, next) {
  try {
    const ids = Array.isArray(req.body.orderedIds) ? req.body.orderedIds.map(int).filter((n) => n != null) : []
    await db.$transaction(ids.map((id, i) => db.$executeRawUnsafe(`UPDATE ai_lesson_chapters SET position = $2, updated_at = now() WHERE id = $1`, id, i + 1)))
    return ApiResponse.success(res, { ok: true })
  } catch (e) { next(e) }
}

async function deleteChapter(req, res, next) {
  try {
    const id = int(req.params.id)
    const rows = await db.$queryRawUnsafe(`UPDATE ai_lesson_chapters SET deleted_at = now(), updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING name`, id)
    if (!rows.length) throw new AppError('Chapter not found', 404)
    await audit.record(req, { module: 'aiteacher', action: 'chapter.delete', targetType: 'ai_chapter', targetId: String(id), targetLabel: rows[0].name })
    return ApiResponse.success(res, { ok: true })
  } catch (e) { next(e) }
}

// ─── Lessons (authored catalog lessons live in the `lessons` table; catalog_status marks them) ──
const LESSON_STATUSES = ['draft', 'published', 'archived']
const VISUAL_TYPES = ['DIAGRAM', 'CHART', 'EXAMPLE', 'ANALOGY', 'FORMULA', 'NONE']

const LESSON_COLS = `l.id::text AS id, l."lessonTitle" AS title, l.summary, l."estimatedDuration" AS "estimatedDuration",
  l."keyTerms" AS "keyTerms", l."gradeLevel" AS "gradeLevel", l.subject, l.catalog_status AS status, l.difficulty,
  l.catalog_position AS position, l.catalog_chapter_id::text AS "chapterId", l.catalog_subject_id::text AS "subjectId"`

async function listLessons(req, res, next) {
  try {
    const chapterId = int(req.params.chapterId)
    const rows = await db.$queryRawUnsafe(
      `SELECT ${LESSON_COLS}, (SELECT count(*)::int FROM slides s WHERE s."lessonId" = l.id) AS "slideCount"
         FROM "lessons" l
        WHERE l.catalog_chapter_id = $1 AND l.catalog_status IS NOT NULL AND l.deleted_at IS NULL
        ORDER BY l.catalog_position ASC, l."createdAt" ASC`, chapterId)
    return ApiResponse.success(res, { rows })
  } catch (e) { next(e) }
}

// Create an EMPTY authored lesson (status draft, READY generation-state, no slides). The admin
// fills title/slides in the editor. userId = the admin's own user id (a valid users FK).
async function createLesson(req, res, next) {
  try {
    const chapterId = int(req.params.chapterId)
    const [chap] = await db.$queryRawUnsafe(
      `SELECT c.subject_id::text AS "subjectId", s.name AS "subjectName"
         FROM ai_lesson_chapters c JOIN ai_lesson_subjects s ON s.id = c.subject_id
        WHERE c.id = $1 AND c.deleted_at IS NULL`, chapterId)
    if (!chap) throw new AppError('Chapter not found', 404)
    const title = (String(req.body.title || req.body.lessonTitle || '').trim()) || 'Untitled lesson'
    const grade = req.body.gradeLevel ? String(req.body.gradeLevel).trim() : ''
    const duration = req.body.estimatedDuration ? String(req.body.estimatedDuration).trim() : '5 min'
    const difficulty = req.body.difficulty ? String(req.body.difficulty).trim() : null
    const [{ pos }] = await db.$queryRawUnsafe(
      `SELECT COALESCE(max(catalog_position), 0) + 1 AS pos FROM "lessons" WHERE catalog_chapter_id = $1 AND catalog_status IS NOT NULL AND deleted_at IS NULL`, chapterId)
    const [row] = await db.$queryRawUnsafe(
      `INSERT INTO "lessons"
         (id, "userId", topic, subject, "gradeLevel", "lessonTitle", "estimatedDuration", summary, "keyTerms", status,
          catalog_subject_id, catalog_chapter_id, catalog_status, catalog_position, difficulty, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $2, $5, '', ARRAY[]::text[], 'READY'::"LessonStatus",
          $6, $7, 'draft', $8, $9, now(), now())
       RETURNING id::text AS id`,
      req.admin.id, title, chap.subjectName, grade, duration, int(chap.subjectId), chapterId, int(pos) || 1, difficulty)
    await audit.record(req, { module: 'aiteacher', action: 'lesson.create', targetType: 'ai_lesson', targetId: row.id, targetLabel: title })
    return ApiResponse.created(res, { lesson: { id: row.id, title, summary: '', estimatedDuration: duration, keyTerms: [], gradeLevel: grade, status: 'draft', difficulty, position: int(pos) || 1, chapterId: String(chapterId), subjectId: chap.subjectId, slideCount: 0 } })
  } catch (e) { next(e) }
}

async function getLesson(req, res, next) {
  try {
    const id = String(req.params.id)
    const [lesson] = await db.$queryRawUnsafe(
      `SELECT ${LESSON_COLS} FROM "lessons" l WHERE l.id = $1::uuid AND l.catalog_status IS NOT NULL AND l.deleted_at IS NULL`, id)
    if (!lesson) throw new AppError('Lesson not found', 404)
    const slides = await db.$queryRawUnsafe(
      `SELECT id::text AS id, "slideNumber" AS "slideNumber", "slideTitle" AS "slideTitle", explanation,
              "narrationText" AS "narrationText", "visualType" AS "visualType", "visualData" AS "visualData",
              "voiceCue" AS "voiceCue"
         FROM slides WHERE "lessonId" = $1::uuid ORDER BY "slideNumber" ASC`, id)
    return ApiResponse.success(res, { lesson, slides })
  } catch (e) { next(e) }
}

async function updateLesson(req, res, next) {
  try {
    const id = String(req.params.id)
    const sets = []; const p = []; const bind = (v) => { p.push(v); return `$${p.length}` }
    if (req.body.title !== undefined) { const t = String(req.body.title).trim(); if (!t) throw new AppError('Title cannot be empty', 422); sets.push(`"lessonTitle" = ${bind(t)}`); sets.push(`topic = ${bind(t)}`) }
    if (req.body.summary !== undefined) sets.push(`summary = ${bind(String(req.body.summary || ''))}`)
    if (req.body.estimatedDuration !== undefined) sets.push(`"estimatedDuration" = ${bind(String(req.body.estimatedDuration || '').trim() || '5 min')}`)
    if (req.body.gradeLevel !== undefined) sets.push(`"gradeLevel" = ${bind(String(req.body.gradeLevel || '').trim())}`)
    if (req.body.difficulty !== undefined) sets.push(`difficulty = ${bind(req.body.difficulty ? String(req.body.difficulty).trim() : null)}`)
    if (req.body.keyTerms !== undefined) { const kt = Array.isArray(req.body.keyTerms) ? req.body.keyTerms.map((s) => String(s).trim()).filter(Boolean) : []; sets.push(`"keyTerms" = ${bind(kt)}`) }
    if (!sets.length) throw new AppError('Nothing to update', 422)
    sets.push('"updatedAt" = now()')
    const rows = await db.$queryRawUnsafe(
      `UPDATE "lessons" l SET ${sets.join(', ')} WHERE l.id = ${bind(id)}::uuid AND l.catalog_status IS NOT NULL AND l.deleted_at IS NULL RETURNING ${LESSON_COLS}`, ...p)
    if (!rows.length) throw new AppError('Lesson not found', 404)
    await audit.record(req, { module: 'aiteacher', action: 'lesson.update', targetType: 'ai_lesson', targetId: id, targetLabel: rows[0].title })
    return ApiResponse.success(res, { lesson: rows[0] })
  } catch (e) { next(e) }
}

async function setLessonStatus(req, res, next) {
  try {
    const id = String(req.params.id)
    const status = String(req.body.status || '')
    if (!LESSON_STATUSES.includes(status)) throw new AppError(`status must be one of ${LESSON_STATUSES.join(', ')}`, 422)
    // Never publish an empty lesson — a student opening a slide-less lesson would crash the player.
    if (status === 'published') {
      const [c] = await db.$queryRawUnsafe(`SELECT count(*)::int AS n FROM slides WHERE "lessonId" = $1::uuid`, id)
      if (!c || c.n < 1) throw new AppError('Add at least one slide before publishing.', 422)
    }
    const rows = await db.$queryRawUnsafe(
      `UPDATE "lessons" SET catalog_status = $2, "updatedAt" = now() WHERE id = $1::uuid AND catalog_status IS NOT NULL AND deleted_at IS NULL RETURNING id::text AS id, "lessonTitle" AS title, catalog_status AS status`, id, status)
    if (!rows.length) throw new AppError('Lesson not found', 404)
    await audit.record(req, { module: 'aiteacher', action: `lesson.${status}`, targetType: 'ai_lesson', targetId: id, targetLabel: rows[0].title })
    return ApiResponse.success(res, { lesson: rows[0] })
  } catch (e) { next(e) }
}

async function reorderLessons(req, res, next) {
  try {
    const ids = Array.isArray(req.body.orderedIds) ? req.body.orderedIds.map(String) : []
    await db.$transaction(ids.map((id, i) => db.$executeRawUnsafe(`UPDATE "lessons" SET catalog_position = $2, "updatedAt" = now() WHERE id = $1::uuid`, id, i + 1)))
    return ApiResponse.success(res, { ok: true })
  } catch (e) { next(e) }
}

async function deleteLesson(req, res, next) {
  try {
    const id = String(req.params.id)
    const rows = await db.$queryRawUnsafe(`UPDATE "lessons" SET deleted_at = now(), "updatedAt" = now() WHERE id = $1::uuid AND catalog_status IS NOT NULL AND deleted_at IS NULL RETURNING "lessonTitle" AS title`, id)
    if (!rows.length) throw new AppError('Lesson not found', 404)
    await audit.record(req, { module: 'aiteacher', action: 'lesson.delete', targetType: 'ai_lesson', targetId: id, targetLabel: rows[0].title })
    return ApiResponse.success(res, { ok: true })
  } catch (e) { next(e) }
}

// Duplicate the lesson AND its slides as a new draft at the end of the chapter.
async function duplicateLesson(req, res, next) {
  try {
    const id = String(req.params.id)
    const [src] = await db.$queryRawUnsafe(`SELECT * FROM "lessons" WHERE id = $1::uuid AND catalog_status IS NOT NULL AND deleted_at IS NULL`, id)
    if (!src) throw new AppError('Lesson not found', 404)
    const [{ pos }] = await db.$queryRawUnsafe(`SELECT COALESCE(max(catalog_position), 0) + 1 AS pos FROM "lessons" WHERE catalog_chapter_id = $1 AND catalog_status IS NOT NULL AND deleted_at IS NULL`, src.catalog_chapter_id)
    const [row] = await db.$queryRawUnsafe(
      `INSERT INTO "lessons"
         (id, "userId", topic, subject, chapter, "gradeLevel", "lessonTitle", "estimatedDuration", summary, "keyTerms", status,
          catalog_subject_id, catalog_chapter_id, catalog_status, catalog_position, difficulty, "createdAt", "updatedAt")
       SELECT gen_random_uuid(), $2::uuid, topic, subject, chapter, "gradeLevel", "lessonTitle" || ' (copy)', "estimatedDuration", summary, "keyTerms", 'READY'::"LessonStatus",
          catalog_subject_id, catalog_chapter_id, 'draft', $3, difficulty, now(), now()
         FROM "lessons" WHERE id = $1::uuid
       RETURNING id::text AS id, "lessonTitle" AS title`,
      id, req.admin.id, int(pos) || 1)
    await db.$executeRawUnsafe(
      `INSERT INTO slides ("id", "lessonId", "slideNumber", "slideTitle", explanation, "narrationText", "visualType", "visualData", "animationSteps", "animationType", "highlightTargets", "subtitleChunks", "visualSequence", "voiceCue")
       SELECT gen_random_uuid(), $2::uuid, "slideNumber", "slideTitle", explanation, "narrationText", "visualType", "visualData", "animationSteps", "animationType", "highlightTargets", "subtitleChunks", "visualSequence", "voiceCue"
         FROM slides WHERE "lessonId" = $1::uuid`, id, row.id)
    await audit.record(req, { module: 'aiteacher', action: 'lesson.duplicate', targetType: 'ai_lesson', targetId: row.id, targetLabel: row.title })
    return ApiResponse.created(res, { lesson: { id: row.id, title: row.title } })
  } catch (e) { next(e) }
}

// Generate a lesson (+ slides) from a topic via the SAME pipeline students use (mock or real
// LLM), then "adopt" it into this chapter as a draft the admin curates and publishes. Long-
// running (LLM up to ~90s) — the admin client uses an extended timeout.
async function generateLessonFromTopic(req, res, next) {
  try {
    const chapterId = int(req.params.chapterId)
    const [chap] = await db.$queryRawUnsafe(
      `SELECT c.subject_id::text AS "subjectId", s.name AS "subjectName"
         FROM ai_lesson_chapters c JOIN ai_lesson_subjects s ON s.id = c.subject_id
        WHERE c.id = $1 AND c.deleted_at IS NULL`, chapterId)
    if (!chap) throw new AppError('Chapter not found', 404)
    const topic = String(req.body.topic || '').trim()
    if (!topic) throw new AppError('A topic is required', 422)
    const cls = int(req.body.classLevel)
    const grade = cls != null ? String(cls) : ''
    // Generate (userId = admin, so it's a valid users FK; gradeLevel drives the LLM's level —
    // default to 10 for tone when the admin left class as "all").
    const lesson = await aiService.generateLesson({ userId: req.admin.id, topic, subject: chap.subjectName, gradeLevel: grade || '10' })
    const [{ pos }] = await db.$queryRawUnsafe(
      `SELECT COALESCE(max(catalog_position), 0) + 1 AS pos FROM "lessons" WHERE catalog_chapter_id = $1 AND catalog_status IS NOT NULL AND deleted_at IS NULL`, chapterId)
    // Adopt into the catalog as a draft; gradeLevel = the admin's class choice ('' = all classes).
    await db.$executeRawUnsafe(
      `UPDATE "lessons" SET catalog_subject_id = $2, catalog_chapter_id = $3, catalog_status = 'draft', catalog_position = $4, "gradeLevel" = $5, "updatedAt" = now() WHERE id = $1::uuid`,
      lesson.id, int(chap.subjectId), chapterId, int(pos) || 1, grade)
    await audit.record(req, { module: 'aiteacher', action: 'lesson.generate', targetType: 'ai_lesson', targetId: lesson.id, targetLabel: lesson.lessonTitle || topic })
    return ApiResponse.created(res, { lesson: { id: lesson.id, title: lesson.lessonTitle || topic } })
  } catch (e) { next(e) }
}

// ─── Slides ──────────────────────────────────────────────────────────────────
async function loadCatalogLessonOr404(id) {
  const [l] = await db.$queryRawUnsafe(`SELECT id FROM "lessons" WHERE id = $1::uuid AND catalog_status IS NOT NULL AND deleted_at IS NULL`, id)
  if (!l) throw new AppError('Lesson not found', 404)
  return l
}
const slideOut = (s) => ({ id: s.id, slideNumber: s.slideNumber, slideTitle: s.slideTitle, explanation: s.explanation, narrationText: s.narrationText, visualType: s.visualType, visualData: s.visualData, voiceCue: s.voiceCue })

async function addSlide(req, res, next) {
  try {
    const lessonId = String(req.params.id)
    await loadCatalogLessonOr404(lessonId)
    const title = (String(req.body.slideTitle || '').trim()) || 'New slide'
    const [{ n }] = await db.$queryRawUnsafe(`SELECT COALESCE(max("slideNumber"), 0) + 1 AS n FROM slides WHERE "lessonId" = $1::uuid`, lessonId)
    const [row] = await db.$queryRawUnsafe(
      `INSERT INTO slides ("id", "lessonId", "slideNumber", "slideTitle", explanation, "narrationText", "visualType", "visualData", "subtitleChunks")
       VALUES (gen_random_uuid(), $1::uuid, $2, $3, '', '', 'NONE'::"VisualType", '{}'::jsonb, ARRAY[]::text[])
       RETURNING id::text AS id, "slideNumber" AS "slideNumber", "slideTitle" AS "slideTitle", explanation, "narrationText" AS "narrationText", "visualType" AS "visualType", "visualData" AS "visualData", "voiceCue" AS "voiceCue"`,
      lessonId, int(n) || 1, title)
    await db.$executeRawUnsafe(`UPDATE "lessons" SET "updatedAt" = now() WHERE id = $1::uuid`, lessonId)
    return ApiResponse.created(res, { slide: slideOut(row) })
  } catch (e) { next(e) }
}

async function updateSlide(req, res, next) {
  try {
    const slideId = String(req.params.slideId)
    const sets = []; const p = []; const bind = (v) => { p.push(v); return `$${p.length}` }
    if (req.body.slideTitle !== undefined) sets.push(`"slideTitle" = ${bind(String(req.body.slideTitle || '').trim() || 'Untitled slide')}`)
    if (req.body.explanation !== undefined) sets.push(`explanation = ${bind(String(req.body.explanation || ''))}`)
    if (req.body.narrationText !== undefined) sets.push(`"narrationText" = ${bind(String(req.body.narrationText || ''))}`)
    if (req.body.voiceCue !== undefined) sets.push(`"voiceCue" = ${bind(req.body.voiceCue ? String(req.body.voiceCue) : null)}`)
    if (req.body.visualType !== undefined) { const vt = String(req.body.visualType || 'NONE').toUpperCase(); if (!VISUAL_TYPES.includes(vt)) throw new AppError('Invalid visualType', 422); sets.push(`"visualType" = '${vt}'::"VisualType"`) }
    if (req.body.visualData !== undefined) sets.push(`"visualData" = ${bind(JSON.stringify(req.body.visualData || {}))}::jsonb`)
    if (!sets.length) throw new AppError('Nothing to update', 422)
    const rows = await db.$queryRawUnsafe(
      `UPDATE slides SET ${sets.join(', ')} WHERE id = ${bind(slideId)}::uuid
       RETURNING id::text AS id, "slideNumber" AS "slideNumber", "slideTitle" AS "slideTitle", explanation, "narrationText" AS "narrationText", "visualType" AS "visualType", "visualData" AS "visualData", "voiceCue" AS "voiceCue"`, ...p)
    if (!rows.length) throw new AppError('Slide not found', 404)
    return ApiResponse.success(res, { slide: slideOut(rows[0]) })
  } catch (e) { next(e) }
}

async function duplicateSlide(req, res, next) {
  try {
    const slideId = String(req.params.slideId)
    const [src] = await db.$queryRawUnsafe(`SELECT * FROM slides WHERE id = $1::uuid`, slideId)
    if (!src) throw new AppError('Slide not found', 404)
    const [{ n }] = await db.$queryRawUnsafe(`SELECT COALESCE(max("slideNumber"), 0) + 1 AS n FROM slides WHERE "lessonId" = $1::uuid`, src.lessonId)
    const [row] = await db.$queryRawUnsafe(
      `INSERT INTO slides ("id", "lessonId", "slideNumber", "slideTitle", explanation, "narrationText", "visualType", "visualData", "animationSteps", "animationType", "highlightTargets", "subtitleChunks", "visualSequence", "voiceCue")
       SELECT gen_random_uuid(), "lessonId", $2, "slideTitle" || ' (copy)', explanation, "narrationText", "visualType", "visualData", "animationSteps", "animationType", "highlightTargets", "subtitleChunks", "visualSequence", "voiceCue"
         FROM slides WHERE id = $1::uuid
       RETURNING id::text AS id, "slideNumber" AS "slideNumber", "slideTitle" AS "slideTitle", explanation, "narrationText" AS "narrationText", "visualType" AS "visualType", "visualData" AS "visualData", "voiceCue" AS "voiceCue"`,
      slideId, int(n) || 1)
    return ApiResponse.created(res, { slide: slideOut(row) })
  } catch (e) { next(e) }
}

async function deleteSlide(req, res, next) {
  try {
    const slideId = String(req.params.slideId)
    const r = await db.$executeRawUnsafe(`DELETE FROM slides WHERE id = $1::uuid`, slideId)
    if (!r) throw new AppError('Slide not found', 404)
    return ApiResponse.success(res, { ok: true })
  } catch (e) { next(e) }
}

// Reorder slides via a two-phase renumber (negative temp → final) so the (lessonId, slideNumber)
// unique constraint is never transiently violated.
async function reorderSlides(req, res, next) {
  try {
    const lessonId = String(req.params.id)
    const ids = Array.isArray(req.body.orderedIds) ? req.body.orderedIds.map(String) : []
    if (!ids.length) throw new AppError('orderedIds must be a non-empty array', 422)
    await db.$transaction([
      ...ids.map((sid, i) => db.$executeRawUnsafe(`UPDATE slides SET "slideNumber" = $2 WHERE id = $1::uuid AND "lessonId" = $3::uuid`, sid, -(i + 1), lessonId)),
      ...ids.map((sid, i) => db.$executeRawUnsafe(`UPDATE slides SET "slideNumber" = $2 WHERE id = $1::uuid AND "lessonId" = $3::uuid`, sid, i + 1, lessonId)),
    ])
    await db.$executeRawUnsafe(`UPDATE "lessons" SET "updatedAt" = now() WHERE id = $1::uuid`, lessonId)
    return ApiResponse.success(res, { ok: true })
  } catch (e) { next(e) }
}

module.exports = {
  listSubjects, createSubject, updateSubject, setSubjectStatus, reorderSubjects, deleteSubject,
  listChapters, createChapter, updateChapter, setChapterStatus, moveChapter, reorderChapters, deleteChapter,
  listLessons, createLesson, generateLessonFromTopic, getLesson, updateLesson, setLessonStatus, reorderLessons, deleteLesson, duplicateLesson,
  addSlide, updateSlide, duplicateSlide, deleteSlide, reorderSlides,
}
