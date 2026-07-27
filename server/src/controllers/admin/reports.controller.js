'use strict'

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')

// Per-widget resilience, but failures are LOGGED (never silently swallowed) so a real
// schema/query error surfaces in the backend logs instead of showing an empty chart.
const q = (sql, ...p) => db.$queryRawUnsafe(sql, ...p).catch((err) => {
  console.error('[reports] query failed:', err && err.message ? err.message : err,
    '\n  SQL:', String(sql).replace(/\s+/g, ' ').trim().slice(0, 160))
  return []
})
const one = async (sql, ...p) => { const r = await q(sql, ...p); return (r && r[0]) || {} }
const num = (v) => Number(v) || 0

// GET /api/admin/reports?days=30 — learning analytics over a window. Every series is
// real; a missing table degrades to an empty array so a chart shows an empty state.
async function analytics(req, res, next) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 180)
    const interval = `${days} days`

    const [
      completion, accuracyDaily, usageDaily, weakTopics, bgByCategory, practiceBySubject, retention,
    ] = await Promise.all([
      one(`SELECT
             (SELECT COUNT(*) FROM "lesson_progress")::int AS started,
             (SELECT COUNT(*) FROM "lesson_progress" WHERE "completedAt" IS NOT NULL)::int AS completed`),
      q(`SELECT (("createdAt" AT TIME ZONE 'UTC')::date) AS d,
                COALESCE(SUM("correctCount"),0)::int AS correct, COALESCE(SUM("totalQuestions"),0)::int AS total
           FROM "brain_gym_sessions" WHERE "createdAt" >= now() - interval '${interval}'
          GROUP BY d ORDER BY d`),
      q(`SELECT d, COUNT(DISTINCT u)::int AS users FROM (
             SELECT (("createdAt" AT TIME ZONE 'UTC')::date) d, "userId" u FROM "brain_gym_sessions" WHERE "createdAt" >= now() - interval '${interval}'
             UNION SELECT (("createdAt" AT TIME ZONE 'UTC')::date) d, "userId" u FROM "student_events" WHERE "createdAt" >= now() - interval '${interval}'
             UNION SELECT (("createdAt" AT TIME ZONE 'UTC')::date) d, "userId" u FROM "lessons" WHERE "createdAt" >= now() - interval '${interval}'
           ) s GROUP BY d ORDER BY d`),
      // Weak topics — highest unresolved-mistake concentration.
      q(`SELECT subject, chapter, COUNT(*)::int AS mistakes, COUNT(DISTINCT "userId")::int AS students
           FROM "mistake_book" WHERE status='unresolved' AND chapter <> ''
          GROUP BY subject, chapter ORDER BY mistakes DESC LIMIT 12`),
      // brain_gym_sessions groups by `skill` (reasoning/application/understanding/
      // fluency) — there is NO `category` column. Alias it so the output shape is
      // unchanged for the client.
      q(`SELECT skill AS category, COUNT(*)::int AS plays,
                COALESCE(SUM("correctCount"),0)::int AS correct, COALESCE(SUM("totalQuestions"),0)::int AS total
           FROM "brain_gym_sessions" WHERE "createdAt" >= now() - interval '${interval}'
          GROUP BY skill ORDER BY plays DESC`),
      q(`SELECT m.subject, COUNT(a.id)::int AS attempts,
                COALESCE(AVG(CASE WHEN a.total > 0 THEN a.score::float/a.total ELSE NULL END),0)::float AS avg
           FROM "mock_test_attempts" a JOIN "mock_tests" m ON m.id = a.test_id
          WHERE a.created_at >= now() - interval '${interval}'
          GROUP BY m.subject ORDER BY attempts DESC`),
      // Retention: of users active last week, how many returned this week.
      one(`SELECT
             (SELECT COUNT(DISTINCT "userId") FROM "brain_gym_sessions"
                WHERE "createdAt" >= now() - interval '14 days' AND "createdAt" < now() - interval '7 days')::int AS prior,
             (SELECT COUNT(DISTINCT "userId") FROM "brain_gym_sessions" bg2
                WHERE bg2."createdAt" >= now() - interval '7 days'
                  AND EXISTS (SELECT 1 FROM "brain_gym_sessions" bg1
                              WHERE bg1."userId" = bg2."userId"
                                AND bg1."createdAt" >= now() - interval '14 days' AND bg1."createdAt" < now() - interval '7 days'))::int AS returned`),
    ])

    const completionRate = num(completion.started) > 0
      ? Math.round((num(completion.completed) / num(completion.started)) * 100) : null
    const retentionRate = num(retention.prior) > 0
      ? Math.round((num(retention.returned) / num(retention.prior)) * 100) : null

    return ApiResponse.success(res, {
      window: { days },
      completion: { started: num(completion.started), completed: num(completion.completed), rate: completionRate },
      retention: { prior: num(retention.prior), returned: num(retention.returned), rate: retentionRate },
      accuracyOverTime: accuracyDaily.map((r) => ({
        date: new Date(r.d).toISOString().slice(0, 10),
        accuracy: num(r.total) > 0 ? Math.round((num(r.correct) / num(r.total)) * 100) : null,
      })),
      activeUsersOverTime: usageDaily.map((r) => ({ date: new Date(r.d).toISOString().slice(0, 10), users: num(r.users) })),
      weakTopics: weakTopics.map((t) => ({ subject: t.subject, chapter: t.chapter, mistakes: num(t.mistakes), students: num(t.students) })),
      brainGym: bgByCategory.map((c) => ({
        category: c.category, plays: num(c.plays),
        accuracy: num(c.total) > 0 ? Math.round((num(c.correct) / num(c.total)) * 100) : null,
      })),
      practiceBySubject: practiceBySubject.map((s) => ({ subject: s.subject, attempts: num(s.attempts), avgScore: Math.round(num(s.avg) * 100) })),
    })
  } catch (err) { next(err) }
}

module.exports = { analytics }
