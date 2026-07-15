'use strict'

const db = require('../../config/database')

const num = (v) => Number(v) || 0

// Shared learner progress snapshot — the single source used by BOTH the Users detail
// and the Parents child view, so there's no duplicated snapshot logic. Best-effort per
// query: a missing table degrades to empty rather than failing the whole response.
async function studentSnapshot(userId) {
  const q = (sql) => db.$queryRawUnsafe(sql, userId).catch(() => [])
  const oneOf = async (sql) => { const r = await q(sql); return (r && r[0]) || {} }

  const [bg, lessons, mistakes, attempts, parents, recent] = await Promise.all([
    oneOf(`SELECT COUNT(*)::int AS plays, COALESCE(SUM("xpEarned"),0)::int AS xp,
                  COALESCE(SUM("correctCount"),0)::int AS correct, COALESCE(SUM("totalQuestions"),0)::int AS total
             FROM "brain_gym_sessions" WHERE "userId" = $1::uuid`),
    oneOf(`SELECT COUNT(*)::int AS total FROM "lessons" WHERE "userId" = $1::uuid`),
    oneOf(`SELECT COUNT(*) FILTER (WHERE status='unresolved')::int AS open, COUNT(*)::int AS total
             FROM "mistake_book" WHERE "userId" = $1::uuid`),
    oneOf(`SELECT COUNT(*)::int AS total FROM "question_attempts" WHERE "userId" = $1::uuid`),
    q(`SELECT id::text AS id, name, email FROM "users" WHERE linked_student_id = $1::uuid LIMIT 5`),
    q(`SELECT type, subject, chapter, "createdAt" AS at FROM "student_events"
         WHERE "userId" = $1::uuid ORDER BY "createdAt" DESC LIMIT 10`),
  ])

  const accuracy = num(bg.total) > 0 ? Math.round((num(bg.correct) / num(bg.total)) * 100) : null
  return {
    progress: {
      brainGymPlays: num(bg.plays), xp: num(bg.xp), accuracy,
      lessons: num(lessons.total), openMistakes: num(mistakes.open), totalMistakes: num(mistakes.total),
      practiceAttempts: num(attempts.total),
    },
    linkedParents: parents || [],
    recentActivity: recent || [],
  }
}

module.exports = { studentSnapshot }
