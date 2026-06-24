'use strict'

const db = require('../config/database')

// Lesson progress: how far through a lesson the student is, how long they've spent,
// and the concept they're currently on. Raw SQL, no regen. slidesCompleted only
// ever increases; studyTimeSeconds accumulates.
async function updateProgress({ userId, lessonId, slideIndex, total, studyTimeSeconds, concept }) {
  const reached = Math.max(0, (Number(slideIndex) || 0) + 1)
  const t = total != null ? Math.max(0, Number(total) || 0) : 0
  const addSecs = Math.max(0, Math.min(3600, Number(studyTimeSeconds) || 0)) // clamp a single report to 1h
  const conceptVal = concept ? String(concept).slice(0, 200) : null

  await db.$executeRaw`
    INSERT INTO lesson_progress ("userId", "lessonId", "slidesTotal", "lastSlideIndex", "slidesCompleted",
                                 "studyTimeSeconds", "currentConcept", "completedAt", "startedAt", "updatedAt")
    VALUES (${userId}::uuid, ${lessonId}::uuid, ${t}, ${Number(slideIndex) || 0}, ${reached},
            ${addSecs}, ${conceptVal},
            CASE WHEN ${t} > 0 AND ${reached} >= ${t} THEN now() ELSE NULL END, now(), now())
    ON CONFLICT ("userId", "lessonId") DO UPDATE SET
      "slidesTotal"      = GREATEST(lesson_progress."slidesTotal", ${t}),
      "lastSlideIndex"   = ${Number(slideIndex) || 0},
      "slidesCompleted"  = GREATEST(lesson_progress."slidesCompleted", ${reached}),
      "studyTimeSeconds" = lesson_progress."studyTimeSeconds" + ${addSecs},
      "currentConcept"   = COALESCE(${conceptVal}, lesson_progress."currentConcept"),
      "completedAt"      = CASE
        WHEN lesson_progress."completedAt" IS NOT NULL THEN lesson_progress."completedAt"
        WHEN GREATEST(lesson_progress."slidesTotal", ${t}) > 0
             AND GREATEST(lesson_progress."slidesCompleted", ${reached}) >= GREATEST(lesson_progress."slidesTotal", ${t})
        THEN now() ELSE NULL END,
      "updatedAt"        = now()`

  return getProgress(userId, lessonId)
}

function shape(r, lessonId) {
  const total = Number(r.slidesTotal) || 0
  const done = Number(r.slidesCompleted) || 0
  return {
    lessonId: lessonId || r.lessonId,
    slidesTotal: total,
    lastSlideIndex: Number(r.lastSlideIndex) || 0,
    slidesCompleted: done,
    studyTimeSeconds: Number(r.studyTimeSeconds) || 0,
    currentConcept: r.currentConcept || null,
    percent: total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0,
    completed: !!r.completedAt,
    completedAt: r.completedAt || null,
  }
}

async function getProgress(userId, lessonId) {
  const rows = await db.$queryRaw`
    SELECT "slidesTotal", "lastSlideIndex", "slidesCompleted", "studyTimeSeconds", "currentConcept", "completedAt", "updatedAt"
    FROM lesson_progress WHERE "userId" = ${userId}::uuid AND "lessonId" = ${lessonId}::uuid`
  if (!rows.length) {
    return { lessonId, slidesTotal: 0, lastSlideIndex: 0, slidesCompleted: 0, studyTimeSeconds: 0, currentConcept: null, percent: 0, completed: false }
  }
  return shape(rows[0], lessonId)
}

// Progress rows for a set of lessons (for the "your lessons" / completed list).
async function getProgressForLessons(userId, lessonIds) {
  if (!Array.isArray(lessonIds) || !lessonIds.length) return {}
  const rows = await db.$queryRawUnsafe(
    `SELECT "lessonId", "slidesTotal", "lastSlideIndex", "slidesCompleted", "studyTimeSeconds", "currentConcept", "completedAt"
     FROM lesson_progress WHERE "userId" = $1::uuid AND "lessonId" = ANY($2::uuid[])`,
    userId, lessonIds,
  )
  const out = {}
  for (const r of rows) out[r.lessonId] = shape(r, r.lessonId)
  return out
}

// Aggregate study stats for the Study Insights screen.
async function getStudyStats(userId) {
  const rows = await db.$queryRaw`
    SELECT coalesce(sum("studyTimeSeconds"),0)::int "studySeconds",
           count(*) FILTER (WHERE "completedAt" IS NOT NULL)::int "lessonsCompleted",
           count(*)::int "lessonsStarted"
    FROM lesson_progress WHERE "userId" = ${userId}::uuid`
  const a = rows[0] || {}
  return {
    studySeconds: Number(a.studySeconds || 0),
    lessonsCompleted: Number(a.lessonsCompleted || 0),
    lessonsStarted: Number(a.lessonsStarted || 0),
    lessonsInProgress: Math.max(0, Number(a.lessonsStarted || 0) - Number(a.lessonsCompleted || 0)),
  }
}

// Per-chapter rollup of the student's lessons (Phase 2 — chapter-based learning).
// A chapter is "completed" when every lesson the student made for it is finished;
// percent is the average lesson completion across the chapter.
async function getChapterProgress(userId, subject) {
  const rows = await db.$queryRawUnsafe(
    `SELECT l.subject, l.chapter,
            count(*)::int started,
            count(*) FILTER (WHERE lp."completedAt" IS NOT NULL)::int completed,
            coalesce(sum(lp."studyTimeSeconds"),0)::int "studySeconds",
            coalesce(round(avg(CASE WHEN lp."slidesTotal" > 0
                 THEN least(100, lp."slidesCompleted" * 100.0 / lp."slidesTotal") ELSE 0 END)), 0)::int percent
     FROM lesson_progress lp JOIN lessons l ON l.id = lp."lessonId"
     WHERE lp."userId" = $1::uuid AND l.chapter IS NOT NULL`
     + (subject ? ' AND l.subject = $2' : '')
     + ` GROUP BY l.subject, l.chapter ORDER BY percent DESC, l.chapter`,
    ...(subject ? [userId, subject] : [userId]),
  )
  return rows.map((r) => {
    const started = Number(r.started) || 0
    const completed = Number(r.completed) || 0
    return {
      subject: r.subject,
      chapter: r.chapter,
      lessonsStarted: started,
      lessonsCompleted: completed,
      studySeconds: Number(r.studySeconds) || 0,
      percent: Number(r.percent) || 0,
      completed: started > 0 && completed >= started,
      inProgress: started > completed,
    }
  })
}

module.exports = { updateProgress, getProgress, getProgressForLessons, getStudyStats, getChapterProgress }
