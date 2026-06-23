'use strict'

const db = require('../config/database')

// Lesson progress: how far through a lesson the student is. Raw SQL, no regen.
// slidesCompleted only ever increases (max of prior and the furthest slide seen).
async function updateProgress({ userId, lessonId, slideIndex, total }) {
  const reached = Math.max(0, (Number(slideIndex) || 0) + 1)
  const t = total != null ? Math.max(0, Number(total) || 0) : 0

  await db.$executeRaw`
    INSERT INTO lesson_progress ("userId", "lessonId", "slidesTotal", "lastSlideIndex", "slidesCompleted", "completedAt", "updatedAt")
    VALUES (${userId}::uuid, ${lessonId}::uuid, ${t}, ${Number(slideIndex) || 0}, ${reached},
            CASE WHEN ${t} > 0 AND ${reached} >= ${t} THEN now() ELSE NULL END, now())
    ON CONFLICT ("userId", "lessonId") DO UPDATE SET
      "slidesTotal"     = GREATEST(lesson_progress."slidesTotal", ${t}),
      "lastSlideIndex"  = ${Number(slideIndex) || 0},
      "slidesCompleted" = GREATEST(lesson_progress."slidesCompleted", ${reached}),
      "completedAt"     = CASE
        WHEN lesson_progress."completedAt" IS NOT NULL THEN lesson_progress."completedAt"
        WHEN GREATEST(lesson_progress."slidesTotal", ${t}) > 0
             AND GREATEST(lesson_progress."slidesCompleted", ${reached}) >= GREATEST(lesson_progress."slidesTotal", ${t})
        THEN now() ELSE NULL END,
      "updatedAt"       = now()`

  return getProgress(userId, lessonId)
}

async function getProgress(userId, lessonId) {
  const rows = await db.$queryRaw`
    SELECT "slidesTotal", "lastSlideIndex", "slidesCompleted", "completedAt", "updatedAt"
    FROM lesson_progress WHERE "userId" = ${userId}::uuid AND "lessonId" = ${lessonId}::uuid`
  if (!rows.length) {
    return { lessonId, slidesTotal: 0, lastSlideIndex: 0, slidesCompleted: 0, percent: 0, completed: false }
  }
  const r = rows[0]
  const total = Number(r.slidesTotal) || 0
  const done = Number(r.slidesCompleted) || 0
  return {
    lessonId,
    slidesTotal: total,
    lastSlideIndex: Number(r.lastSlideIndex) || 0,
    slidesCompleted: done,
    percent: total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0,
    completed: !!r.completedAt,
    completedAt: r.completedAt || null,
  }
}

module.exports = { updateProgress, getProgress }
