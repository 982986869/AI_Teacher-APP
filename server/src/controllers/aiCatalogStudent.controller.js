'use strict'

// Student-facing browse of the admin-authored AI Teacher catalog. READ-ONLY and PUBLISHED-only:
// only subjects/chapters that are published (not archived, not deleted) AND actually contain a
// published, non-deleted lesson FOR THIS STUDENT'S CLASS are returned, so students never hit an
// empty branch. Playing a lesson reuses the frozen LiveTeachingPlayer on the exact stored slides.
// This does NOT touch the per-student generated-lesson flow (those have catalog_status IS NULL).

const db = require('../config/database')
const ApiResponse = require('../utils/ApiResponse')
const { AppError } = require('../middleware/errorHandler')

const int = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null }

// Class match for a lesson (alias `l`). A lesson with no/blank grade = "all classes" (always
// shown); otherwise the digits of gradeLevel must equal the student's class. `cls` is a validated
// integer (safe to inline). null → no class filter (show every class).
function classMatch(cls) {
  if (cls == null) return 'TRUE'
  return `(l."gradeLevel" IS NULL OR btrim(l."gradeLevel") = '' OR NULLIF(regexp_replace(l."gradeLevel", '\\D', '', 'g'), '')::int = ${cls})`
}
// A publishable lesson can lose all its slides after publishing (slide deletes aren't blocked in
// draft). Never surface/open a slide-less lesson — the player needs ≥1 slide. Alias: `l`.
const HAS_SLIDES = `EXISTS (SELECT 1 FROM slides sx WHERE sx."lessonId" = l.id)`

async function subjects(req, res, next) {
  try {
    const cls = int(req.query.class)
    const cm = classMatch(cls)
    const rows = await db.$queryRawUnsafe(
      `SELECT s.id::text AS id, s.name, s.emoji,
              (SELECT count(*)::int FROM "lessons" l WHERE l.catalog_subject_id = s.id AND l.catalog_status = 'published' AND l.deleted_at IS NULL AND ${HAS_SLIDES} AND ${cm}) AS "lessonCount"
         FROM ai_lesson_subjects s
        WHERE s.deleted_at IS NULL AND s.status = 'published'
          AND EXISTS (SELECT 1 FROM "lessons" l WHERE l.catalog_subject_id = s.id AND l.catalog_status = 'published' AND l.deleted_at IS NULL AND ${HAS_SLIDES} AND ${cm})
        ORDER BY s.position ASC, s.id ASC`)
    return ApiResponse.success(res, { rows })
  } catch (e) { next(e) }
}

async function chapters(req, res, next) {
  try {
    const subjectId = int(req.params.subjectId)
    const cm = classMatch(int(req.query.class))
    const rows = await db.$queryRawUnsafe(
      `SELECT c.id::text AS id, c.name,
              (SELECT count(*)::int FROM "lessons" l WHERE l.catalog_chapter_id = c.id AND l.catalog_status = 'published' AND l.deleted_at IS NULL AND ${HAS_SLIDES} AND ${cm}) AS "lessonCount"
         FROM ai_lesson_chapters c
        WHERE c.subject_id = $1 AND c.deleted_at IS NULL AND c.status = 'published'
          AND EXISTS (SELECT 1 FROM "lessons" l WHERE l.catalog_chapter_id = c.id AND l.catalog_status = 'published' AND l.deleted_at IS NULL AND ${HAS_SLIDES} AND ${cm})
        ORDER BY c.position ASC, c.id ASC`, subjectId)
    return ApiResponse.success(res, { rows })
  } catch (e) { next(e) }
}

async function lessons(req, res, next) {
  try {
    const chapterId = int(req.params.chapterId)
    const cm = classMatch(int(req.query.class))
    // LEFT JOIN this student's own progress row (lesson_progress is keyed by userId+lessonId, so a
    // shared catalog lesson still gets per-student resume/completion) for library badges.
    const rows = await db.$queryRawUnsafe(
      `SELECT l.id::text AS id, l."lessonTitle" AS title, l.summary, l."estimatedDuration" AS "estimatedDuration", l.difficulty,
              (SELECT count(*)::int FROM slides s WHERE s."lessonId" = l.id) AS "slideCount",
              COALESCE(lp."lastSlideIndex", 0) AS "lastSlideIndex",
              COALESCE(lp."slidesCompleted", 0) AS "slidesCompleted",
              (lp."completedAt" IS NOT NULL) AS completed,
              (lp."lessonId" IS NOT NULL) AS started
         FROM "lessons" l
         LEFT JOIN lesson_progress lp ON lp."lessonId" = l.id AND lp."userId" = $2::uuid
        WHERE l.catalog_chapter_id = $1 AND l.catalog_status = 'published' AND l.deleted_at IS NULL AND ${HAS_SLIDES} AND ${cm}
        ORDER BY l.catalog_position ASC, l."createdAt" ASC`, chapterId, req.user.id)
    return ApiResponse.success(res, { rows })
  } catch (e) { next(e) }
}

// One published lesson + its slides, shaped for the player. Class-gated too, so a student can't
// open another class's lesson by id.
async function lesson(req, res, next) {
  try {
    const id = String(req.params.id)
    const cm = classMatch(int(req.query.class))
    const [l] = await db.$queryRawUnsafe(
      `SELECT l.id::text AS id, l."lessonTitle" AS "lessonTitle", l.subject, l."gradeLevel" AS "gradeLevel",
              l."keyTerms" AS "keyTerms", l.summary, l.difficulty,
              COALESCE(lp."lastSlideIndex", 0) AS "lastSlideIndex",
              (lp."completedAt" IS NOT NULL) AS completed
         FROM "lessons" l
         LEFT JOIN lesson_progress lp ON lp."lessonId" = l.id AND lp."userId" = $2::uuid
        WHERE l.id = $1::uuid AND l.catalog_status = 'published' AND l.deleted_at IS NULL AND ${HAS_SLIDES} AND ${cm}`, id, req.user.id)
    if (!l) throw new AppError('Lesson not found', 404)
    const slides = await db.$queryRawUnsafe(
      `SELECT "slideNumber", "slideTitle", explanation, "narrationText", "visualType", "visualData",
              "animationSteps", "animationType", "highlightTargets", "subtitleChunks", "visualSequence", "voiceCue"
         FROM slides WHERE "lessonId" = $1::uuid ORDER BY "slideNumber" ASC`, id)
    return ApiResponse.success(res, { lesson: { ...l, slides } })
  } catch (e) { next(e) }
}

// The student's in-progress (started, not finished) published catalog lessons for their class,
// most-recent first — powers the library's "Jump back in" rail.
async function resume(req, res, next) {
  try {
    const cm = classMatch(int(req.query.class))
    const rows = await db.$queryRawUnsafe(
      `SELECT l.id::text AS id, l."lessonTitle" AS title, l.subject, ch.name AS "chapterName",
              COALESCE(lp."lastSlideIndex", 0) AS "lastSlideIndex",
              (SELECT count(*)::int FROM slides s WHERE s."lessonId" = l.id) AS "slideCount"
         FROM lesson_progress lp
         JOIN "lessons" l ON l.id = lp."lessonId"
         LEFT JOIN ai_lesson_chapters ch ON ch.id = l.catalog_chapter_id
        WHERE lp."userId" = $1::uuid AND lp."completedAt" IS NULL
          AND l.catalog_status = 'published' AND l.deleted_at IS NULL AND ${HAS_SLIDES} AND ${cm}
        ORDER BY lp."updatedAt" DESC
        LIMIT 5`, req.user.id)
    return ApiResponse.success(res, { rows })
  } catch (e) { next(e) }
}

module.exports = { subjects, chapters, lessons, lesson, resume }
