'use strict'

const db = require('../config/database')

// AI Teacher session retention: a lesson (finished or abandoned mid-way) stays
// resumable via "Continue" for 7 days after it was last touched, then is hard-
// deleted so generated content doesn't pile up forever. "Last touched" is
// GREATEST(lesson.updatedAt, progress.updatedAt) — progress bumps on every 15s
// flush while studying and on completion, so an in-progress lesson's clock keeps
// resetting for as long as the student keeps returning to it; only a genuinely
// abandoned or finished-and-never-revisited lesson ages out.
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000

async function cleanupExpiredLessons() {
  const cutoff = new Date(Date.now() - RETENTION_MS)

  const expired = await db.$queryRaw`
    SELECT l.id
    FROM lessons l
    LEFT JOIN lesson_progress lp ON lp."lessonId" = l.id
    WHERE GREATEST(l."updatedAt", COALESCE(lp."updatedAt", l."updatedAt")) < ${cutoff}`

  const ids = expired.map((r) => r.id)
  if (!ids.length) return { deleted: 0 }

  await db.$transaction([
    db.$executeRaw`DELETE FROM lesson_progress WHERE "lessonId" = ANY(${ids}::uuid[])`,
    // Slides/doubtSessions cascade at the DB level (ON DELETE CASCADE on the FK).
    db.$executeRaw`DELETE FROM lessons WHERE id = ANY(${ids}::uuid[])`,
  ])

  return { deleted: ids.length }
}

module.exports = { cleanupExpiredLessons, RETENTION_MS }
