'use strict'

const db = require('../../config/database')
const { config } = require('../../config/env')
const ApiResponse = require('../../utils/ApiResponse')

// Every widget is derived from real tables. Each query is wrapped so a missing table
// or transient error degrades to a null/empty widget (the client renders an honest
// empty / "Pending Backend" state) instead of failing the whole dashboard. Metrics
// that have no server source yet are returned as `null` and the client labels them
// "Pending Backend" — never faked.
// Per-widget resilience: a single failing query degrades that widget to empty rather
// than 500-ing the whole dashboard. The failure is LOGGED (never silent) so a real
// schema mismatch surfaces in the backend logs instead of masquerading as a zero.
const q = (sql, ...params) => db.$queryRawUnsafe(sql, ...params).catch((err) => {
  console.error('[dashboard] query failed:', err && err.message ? err.message : err,
    '\n  SQL:', String(sql).replace(/\s+/g, ' ').trim().slice(0, 160))
  return []
})
const one = async (sql, ...params) => { const r = await q(sql, ...params); return (r && r[0]) || {} }
const num = (v) => (v === null || v === undefined ? 0 : Number(v) || 0)

// "Active" = any signal in brain_gym_sessions, student_events or lessons.
const ACTIVE_UNION = (since) => `
  SELECT "userId" u FROM "brain_gym_sessions" WHERE "createdAt" >= ${since}
  UNION SELECT "userId" u FROM "student_events" WHERE "createdAt" >= ${since}
  UNION SELECT "userId" u FROM "lessons" WHERE "createdAt" >= ${since}`

async function overview(req, res, next) {
  try {
    const [
      users,          // 0  user counts
      activeToday,    // 1
      activeWeek,     // 2
      returning,      // 3
      lessonsAgg,     // 4  lessons: today / failed / avg gen ms
      doubts,         // 5
      lp,             // 6  lesson_progress: completion
      bank,           // 7  generated_questions status counts
      streakUsers,    // 8
      gym,            // 9  brain_gym_sessions
      practice,       // 10 question_attempts
      mock,           // 11 mock_test_attempts
      mockSubjects,   // 12 mock attempts by subject
      arena,          // 13 arena_matches counts
      arenaRating,    // 14 rating histogram
      arenaActive,    // 15 distinct active players
      content,        // 16 catalog counts
      missing,        // 17 chapters with no sections
      feed,           // 18 activity feed (merged in JS)
      health,         // 19 SELECT 1
      signupTrend,    // 20
      activeTrend,    // 21
    ] = await Promise.all([
      one(`SELECT
             COUNT(*) FILTER (WHERE COALESCE(account_type,'student') = 'student')::int AS students,
             COUNT(*) FILTER (WHERE account_type = 'parent')::int  AS parents,
             COUNT(*) FILTER (WHERE account_type = 'teacher')::int AS teachers,
             COUNT(*) FILTER (WHERE admin_role IS NOT NULL)::int   AS admins,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('day', now()))::int AS new_today,
             COUNT(*) FILTER (WHERE "createdAt" >= now() - interval '7 days')::int AS new_week
           FROM "users"`),
      one(`SELECT COUNT(DISTINCT u)::int AS n FROM (${ACTIVE_UNION("date_trunc('day', now())")}) s`),
      one(`SELECT COUNT(DISTINCT u)::int AS n FROM (${ACTIVE_UNION("now() - interval '7 days'")}) s`),
      one(`WITH act AS (
             SELECT "userId" u, "createdAt" c FROM "brain_gym_sessions" WHERE "createdAt" >= now() - interval '14 days'
             UNION ALL SELECT "userId", "createdAt" FROM "student_events" WHERE "createdAt" >= now() - interval '14 days'
             UNION ALL SELECT "userId", "createdAt" FROM "lessons" WHERE "createdAt" >= now() - interval '14 days')
           SELECT COUNT(*)::int AS n FROM (
             SELECT u FROM act WHERE c >= now() - interval '7 days' GROUP BY u
             INTERSECT
             SELECT u FROM act WHERE c >= now() - interval '14 days' AND c < now() - interval '7 days' GROUP BY u
           ) x`),

      one(`SELECT
             COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('day', now()))::int AS today,
             COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed,
             COALESCE(AVG("generationTimeMs") FILTER (WHERE "generationTimeMs" IS NOT NULL), 0)::int AS avg_gen_ms
           FROM "lessons"`),
      one(`SELECT
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('day', now()))::int AS today
           FROM "student_events" WHERE type = 'doubt'`),
      one(`SELECT
             COUNT(*) FILTER (WHERE "completedAt" IS NOT NULL)::int AS completed_total,
             COUNT(*) FILTER (WHERE "completedAt" >= date_trunc('day', now()))::int AS completed_today,
             COUNT(*)::int AS started,
             COALESCE(AVG(CASE WHEN "slidesTotal" > 0 THEN "slidesCompleted"::float / "slidesTotal" END), 0)::float AS avg_completion
           FROM "lesson_progress"`),
      one(`SELECT
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('day', now()))::int AS today,
             COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS accepted,
             COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejected,
             COUNT(*) FILTER (WHERE status = 'DRAFT')::int AS draft
           FROM "generated_questions"`),
      one(`SELECT COUNT(*)::int AS n FROM (
             SELECT "userId" FROM "brain_gym_sessions" WHERE "createdAt" >= date_trunc('day', now())
             INTERSECT
             SELECT "userId" FROM "brain_gym_sessions"
               WHERE "createdAt" >= date_trunc('day', now()) - interval '1 day' AND "createdAt" < date_trunc('day', now())
           ) x`),
      one(`SELECT
             COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('day', now()))::int AS today,
             COALESCE(SUM("correctCount"), 0)::int AS correct,
             COALESCE(SUM("totalQuestions"), 0)::int AS total
           FROM "brain_gym_sessions"`),

      one(`SELECT
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('day', now()))::int AS today
           FROM "question_attempts"`),
      one(`SELECT
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS today,
             COALESCE(AVG(CASE WHEN total > 0 THEN score::float / total END), 0)::float AS avg_score
           FROM "mock_test_attempts"`),
      q(`SELECT m.subject,
                COUNT(a.id)::int AS attempts,
                COALESCE(AVG(CASE WHEN a.total > 0 THEN a.score::float / a.total END), 0)::float AS avg
           FROM "mock_test_attempts" a JOIN "mock_tests" m ON m.id = a.test_id
          GROUP BY m.subject HAVING COUNT(a.id) > 0 ORDER BY attempts DESC`),

      one(`SELECT
             COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('day', now()))::int AS today,
             COUNT(*) FILTER (WHERE status = 'abandoned')::int AS abandoned,
             COUNT(*) FILTER (WHERE status = 'abandoned' AND "createdAt" >= date_trunc('day', now()))::int AS abandoned_today
           FROM "arena_matches"`),
      one(`SELECT
             COUNT(*) FILTER (WHERE r < 900)::int AS b1,
             COUNT(*) FILTER (WHERE r >= 900  AND r < 1000)::int AS b2,
             COUNT(*) FILTER (WHERE r >= 1000 AND r < 1100)::int AS b3,
             COUNT(*) FILTER (WHERE r >= 1100 AND r < 1200)::int AS b4,
             COUNT(*) FILTER (WHERE r >= 1200)::int AS b5
           FROM (SELECT DISTINCT ON ("userId") "ratingAfter" r FROM "arena_matches" ORDER BY "userId", "createdAt" DESC) t`),
      one(`SELECT COUNT(DISTINCT "userId")::int AS n FROM "arena_matches" WHERE "createdAt" >= now() - interval '7 days'`),

      one(`SELECT
             (SELECT COUNT(*) FROM "subjects")::int AS subjects,
             (SELECT COUNT(*) FROM "chapters")::int AS chapters,
             (SELECT COUNT(*) FROM "notes")::int AS notes,
             (SELECT COUNT(*) FROM "mcq_questions")::int AS mcqs,
             (SELECT COUNT(*) FROM "mock_tests")::int AS mock_tests`),
      one(`SELECT COUNT(*)::int AS n FROM "chapters" c WHERE NOT EXISTS (SELECT 1 FROM "sections" s WHERE s.chapter_id = c.id)`),

      recentActivity(),

      one(`SELECT 1 AS ok`),

      q(`SELECT (("createdAt" AT TIME ZONE 'UTC')::date) AS d, COUNT(*)::int AS n
           FROM "users" WHERE "createdAt" >= now() - interval '13 days' GROUP BY d`),
      q(`SELECT d, COUNT(DISTINCT u)::int AS n FROM (
             SELECT (("createdAt" AT TIME ZONE 'UTC')::date) d, "userId" u FROM "brain_gym_sessions" WHERE "createdAt" >= now() - interval '13 days'
             UNION SELECT (("createdAt" AT TIME ZONE 'UTC')::date) d, "userId" u FROM "student_events" WHERE "createdAt" >= now() - interval '13 days'
             UNION SELECT (("createdAt" AT TIME ZONE 'UTC')::date) d, "userId" u FROM "lessons" WHERE "createdAt" >= now() - interval '13 days'
           ) s GROUP BY d`),
    ])

    // "Resources" = downloadable/solution assets. All three tables exist in the real
    // schema; a failure is logged by one() rather than silently swallowed.
    const [papers, ncert, exemplar] = await Promise.all([
      one(`SELECT COUNT(*)::int AS n FROM "papers"`),
      one(`SELECT COUNT(*)::int AS n FROM "ncert_solutions"`),
      one(`SELECT COUNT(*)::int AS n FROM "exemplar_solutions"`),
    ])

    const bgTotal = num(gym.total)
    const bgAccuracy = bgTotal > 0 ? Math.round((num(gym.correct) / bgTotal) * 100) : null
    const completionPct = lp.avg_completion != null ? Math.round(num(lp.avg_completion) * 100) : null

    const subjectsSorted = (mockSubjects || []).map((s) => ({ subject: s.subject, attempts: num(s.attempts), avgScore: Math.round(num(s.avg) * 100) }))
    const mostAttempted = subjectsSorted[0] || null
    const lowest = subjectsSorted.length ? [...subjectsSorted].sort((a, b) => a.avgScore - b.avgScore)[0] : null

    return ApiResponse.success(res, {
      generatedAt: new Date().toISOString(),

      overview: {
        totalStudents: num(users.students),
        activeToday: num(activeToday.n),
        activeThisWeek: num(activeWeek.n),
        parents: num(users.parents),
        teachers: num(users.teachers),
        admins: num(users.admins),
        newRegistrationsToday: num(users.new_today),
        newRegistrationsWeek: num(users.new_week),
        returningUsers: num(returning.n),
      },

      aiTeacher: {
        lessonsGeneratedToday: num(lessonsAgg.today),
        lessonsCompleted: num(lp.completed_total),
        lessonsCompletedToday: num(lp.completed_today),
        averageCompletion: completionPct,
        doubtsAsked: num(doubts.total),
        doubtsToday: num(doubts.today),
        aiFailures: num(lessonsAgg.failed),
        avgGenerationMs: num(lessonsAgg.avg_gen_ms),
        pendingReview: num(lessonsAgg.failed),
      },

      brainGym: {
        sessionsToday: num(gym.today),
        questionsGenerated: num(bank.total),
        questionsGeneratedToday: num(bank.today),
        questionsAccepted: num(bank.accepted),
        questionsRejected: num(bank.rejected),
        averageAccuracy: bgAccuracy,
        activeStreakUsers: num(streakUsers.n),
      },

      practice: {
        practiceAttempts: num(practice.total),
        practiceToday: num(practice.today),
        mockAttempts: num(mock.total),
        mockToday: num(mock.today),
        averageScore: num(mock.total) > 0 ? Math.round(num(mock.avg_score) * 100) : null,
        mostAttemptedSubject: mostAttempted,
        lowestPerformingSubject: lowest,
      },

      arena: {
        matchesToday: num(arena.today),
        activePlayers: num(arenaActive.n),
        abandonedMatches: num(arena.abandoned),
        abandonedToday: num(arena.abandoned_today),
        ratingDistribution: [
          { label: '<900', count: num(arenaRating.b1) },
          { label: '900–1k', count: num(arenaRating.b2) },
          { label: '1k–1.1k', count: num(arenaRating.b3) },
          { label: '1.1k–1.2k', count: num(arenaRating.b4) },
          { label: '1.2k+', count: num(arenaRating.b5) },
        ],
      },

      content: {
        subjects: num(content.subjects),
        chapters: num(content.chapters),
        notes: num(content.notes),
        mcqs: num(content.mcqs),
        mockTests: num(content.mock_tests),
        resources: num(papers.n) + num(ncert.n) + num(exemplar.n),
        missingContent: num(missing.n),
        // Catalog draft/published workflow ships in Phase 3 (status columns). Until
        // then these are honestly Pending rather than faked.
        draftContent: null,
        publishedContent: null,
      },

      activity: feed,

      platform: {
        api: 'ok',
        database: num(health.ok) === 1 ? 'ok' : 'degraded',
        backgroundJobs: null, // no job runner yet → Pending Backend
        lastBackup: null,     // no backup telemetry yet → Pending Backend
        serverTime: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
        node: process.version,
      },

      trends: {
        signups: fillTrend(signupTrend),
        activeUsers: fillTrend(activeTrend),
      },
    })
  } catch (err) { next(err) }
}

// Merge the five activity sources in JS so a missing table never breaks the feed.
async function recentActivity() {
  const [signups, lessons, mocks, gym, admin] = await Promise.all([
    q(`SELECT id::text AS ref, name AS title, COALESCE(email, phone) AS subtitle, name AS actor, "createdAt" AS at, NULL::int AS score, NULL::int AS total, NULL::text AS module
         FROM "users" ORDER BY "createdAt" DESC LIMIT 8`),
    q(`SELECT lp.id::text AS ref, l."lessonTitle" AS title, u.name AS subtitle, u.name AS actor, lp."completedAt" AS at, NULL::int AS score, NULL::int AS total, NULL::text AS module
         FROM "lesson_progress" lp JOIN "lessons" l ON l.id = lp."lessonId" JOIN "users" u ON u.id = lp."userId"
        WHERE lp."completedAt" IS NOT NULL ORDER BY lp."completedAt" DESC LIMIT 8`),
    q(`SELECT a.id::text AS ref, m.name AS title, COALESCE(u.name,'A student') AS subtitle, COALESCE(u.name,'—') AS actor, a.created_at AS at, a.score, a.total, NULL::text AS module
         FROM "mock_test_attempts" a JOIN "mock_tests" m ON m.id = a.test_id LEFT JOIN "users" u ON u.id = a.user_id
        ORDER BY a.created_at DESC LIMIT 8`),
    q(`SELECT s.id::text AS ref, s.skill AS title, u.name AS subtitle, u.name AS actor, s."createdAt" AS at, s.score, NULL::int AS total, NULL::text AS module
         FROM "brain_gym_sessions" s JOIN "users" u ON u.id = s."userId" ORDER BY s."createdAt" DESC LIMIT 8`),
    q(`SELECT id::text AS ref, action AS title, COALESCE(target_label, module) AS subtitle, actor_name AS actor, created_at AS at, NULL::int AS score, NULL::int AS total, module
         FROM "audit_logs" ORDER BY created_at DESC LIMIT 8`),
  ])
  const tag = (rows, type) => (rows || []).map((r) => ({ ...r, type }))
  const merged = [
    ...tag(signups, 'signup'),
    ...tag(lessons, 'lesson_completed'),
    ...tag(mocks, 'mock_submitted'),
    ...tag(gym, 'braingym_completed'),
    ...tag(admin, 'admin_action'),
  ].filter((r) => r.at)
  merged.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  return merged.slice(0, 18).map((r, i) => ({
    id: `${r.type}-${r.ref || i}`,
    type: r.type,
    title: r.title,
    subtitle: r.subtitle,
    actor: r.actor,
    at: r.at,
    meta: r.score != null && r.total != null ? `${r.score}/${r.total}` : r.score != null ? `${r.score} pts` : r.module || null,
  }))
}

// Dense 14-day series for a sparkline, filling gaps with 0.
function fillTrend(rows) {
  const byDay = {}
  for (const r of rows || []) byDay[new Date(r.d).toISOString().slice(0, 10)] = num(r.n)
  const out = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    out.push({ date: key, count: byDay[key] || 0 })
  }
  return out
}

module.exports = { overview }
