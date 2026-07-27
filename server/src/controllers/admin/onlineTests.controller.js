'use strict'

// Admin management of ONLINE Tests (ot_tests — imported examin8 MCQ tests, organized
// class → subject → chapter → test). These are the tests students see in the Online Tests card;
// classes 6–9 have them (mock_tests only exist for 9–12), so this is where those classes' test
// content is managed. Read-heavy: browse + reorder-within-chapter + delete (imported content has
// no draft/publish lifecycle — there's no status column). All raw SQL over ot_tests /
// online_test_questions. ids are bigint.

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const audit = require('../../services/admin/audit.service')

const int = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null }

// Distinct classes that actually have online tests.
async function classes(req, res, next) {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT DISTINCT class_level::int AS n FROM ot_tests WHERE class_level BETWEEN 1 AND 12 ORDER BY n`)
    return ApiResponse.success(res, { classes: rows.map((r) => r.n) })
  } catch (e) { next(e) }
}

// Subjects (for a class) that have online tests + per-subject test/chapter counts.
async function subjects(req, res, next) {
  try {
    const cls = int(req.query.class)
    if (cls == null) throw new AppError('class is required', 422)
    const rows = await db.$queryRawUnsafe(
      `SELECT subject_slug AS slug, subject_name AS name,
              COUNT(*)::int AS "testCount",
              COUNT(DISTINCT chapter_slug)::int AS "chapterCount"
         FROM ot_tests WHERE class_level = $1
        GROUP BY subject_slug, subject_name
        ORDER BY subject_name ASC`, cls)
    return ApiResponse.success(res, { subjects: rows })
  } catch (e) { next(e) }
}

// Chapters (for a subject + class) that have online tests, in chapter order, with test counts.
async function chapters(req, res, next) {
  try {
    const cls = int(req.query.class)
    const slug = String(req.params.slug || '')
    if (cls == null) throw new AppError('class is required', 422)
    const rows = await db.$queryRawUnsafe(
      `SELECT chapter_slug AS slug, chapter_name AS name, MIN(chapter_pos)::int AS pos, COUNT(*)::int AS "testCount"
         FROM ot_tests WHERE class_level = $1 AND subject_slug = $2
        GROUP BY chapter_slug, chapter_name
        ORDER BY MIN(chapter_pos) ASC, chapter_name ASC`, cls, slug)
    return ApiResponse.success(res, { chapters: rows })
  } catch (e) { next(e) }
}

// Tests within a chapter (subject + class + chapter), in display order.
async function tests(req, res, next) {
  try {
    const cls = int(req.query.class)
    const slug = String(req.query.subject || '')
    const chapter = String(req.query.chapter || '')
    if (cls == null) throw new AppError('class is required', 422)
    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, name, duration_min AS "durationMin", total_marks AS "totalMarks", is_paid AS "isPaid", position,
              (SELECT count(*)::int FROM ot_questions q WHERE q.ot_test_id = t.id) AS "questionCount"
         FROM ot_tests t
        WHERE class_level = $1 AND subject_slug = $2 AND chapter_slug = $3
        ORDER BY position ASC, id ASC`, cls, slug, chapter)
    return ApiResponse.success(res, { rows })
  } catch (e) { next(e) }
}

// One test + its questions (question, options, correct index, explanation) for the detail view.
async function test(req, res, next) {
  try {
    const id = int(req.params.id)
    if (id == null) throw new AppError('Invalid id', 422)
    const [t] = await db.$queryRawUnsafe(
      `SELECT id::text AS id, name, subject_name AS "subjectName", class_level AS "classLevel", chapter_name AS "chapterName",
              instruction_html AS "instructionHtml", duration_min AS "durationMin", total_marks AS "totalMarks", is_paid AS "isPaid"
         FROM ot_tests WHERE id = $1::bigint`, id)
    if (!t) throw new AppError('Test not found', 404)
    const questions = await db.$queryRawUnsafe(
      `SELECT id::text AS id, question_html AS "questionHtml", options, correct_option_id::text AS "correctOptionId",
              explanation_html AS "explanationHtml", marks::int AS marks, position::int AS position
         FROM ot_questions WHERE ot_test_id = $1::bigint ORDER BY position ASC, id ASC`, id)
    return ApiResponse.success(res, { test: t, questions })
  } catch (e) { next(e) }
}

// Reorder tests within a chapter by rewriting position (imported ids stay put).
async function reorder(req, res, next) {
  try {
    const ids = Array.isArray(req.body.orderedIds) ? req.body.orderedIds.map(int).filter((n) => n != null) : []
    if (!ids.length) throw new AppError('orderedIds must be a non-empty array', 422)
    await db.$transaction(ids.map((id, i) => db.$executeRawUnsafe(`UPDATE ot_tests SET position = $2 WHERE id = $1::bigint`, id, i)))
    return ApiResponse.success(res, { reordered: ids.length }, 'Order updated')
  } catch (e) { next(e) }
}

// Delete a test and its questions (hard delete — imported content, no soft-delete column).
async function remove(req, res, next) {
  try {
    const id = int(req.params.id)
    if (id == null) throw new AppError('Invalid id', 422)
    const [t] = await db.$queryRawUnsafe(`SELECT name FROM ot_tests WHERE id = $1::bigint`, id)
    if (!t) throw new AppError('Test not found', 404)
    await db.$transaction([
      db.$executeRawUnsafe(`DELETE FROM ot_questions WHERE ot_test_id = $1::bigint`, id),
      db.$executeRawUnsafe(`DELETE FROM ot_tests WHERE id = $1::bigint`, id),
    ])
    await audit.record(req, { module: 'tests', action: 'online.delete', targetType: 'online_test', targetId: String(id), targetLabel: t.name })
    return ApiResponse.success(res, { id: String(id) }, 'Test removed')
  } catch (e) { next(e) }
}

module.exports = { classes, subjects, chapters, tests, test, reorder, remove }
