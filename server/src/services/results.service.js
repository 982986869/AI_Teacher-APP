'use strict'

// Composed "My Progress" dashboard for the authenticated student. All data is REAL,
// pulled from existing attempt/study tables — no new tracking is introduced:
//   • mock_test_attempts  → mock tests: count, subject breakdown, recent, time
//   • brain_gym_sessions  → quizzes: count, recent, time, XP
//   • mcq_attempts        → MCQ practice: per-subject questions answered/correct
//   • lesson_progress     → lesson study time (hours)
// Everything is scoped to the user; subject breakdown is scoped to the student's
// own class (classLevel from req.scope, never the client).
//
// period + offset drive a moving window:
//   week  → rolling 7-day window (offset shifts by 7 days), chart = 7 daily bars
//   month → a full calendar year (offset shifts by 1 year), chart = 12 monthly bars (Jan–Dec)

const db = require('../config/database')

const WEEKDAY3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

function fmtRange(a, b) {
  return `${a.getDate()} ${MONTH[a.getMonth()]} – ${b.getDate()} ${MONTH[b.getMonth()]} ${b.getFullYear()}`
}

// Resolve the concrete window (date bounds + chart bucketing) for period/offset.
function computeWindow(period, offset) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === 'month') {
    // A calendar year (Jan–…); offset steps back one year. One bar per month, each
    // = that month's hours; stats cover the year. For the CURRENT year only months
    // up to the current one are shown (future months are hidden); past years show 12.
    const curYear = todayStart.getFullYear()
    const year = curYear - offset
    const start = new Date(year, 0, 1)
    const endEx = new Date(year + 1, 0, 1)
    const bins = year === curYear ? todayStart.getMonth() + 1 : 12
    return { start, endEx, chartStart: start, chartEnd: endEx, unit: 'month', bins, rangeLabel: String(year), canGoNext: offset > 0 }
  }

  // week: rolling 7-day window; offset steps back 7 days. 7 daily bars.
  const tomorrow = addDays(todayStart, 1)
  const endEx = addDays(tomorrow, -offset * 7)
  const start = addDays(endEx, -7)
  const lastDay = addDays(endEx, -1)
  return { start, endEx, chartStart: start, chartEnd: endEx, unit: 'day', bins: 7, rangeLabel: fmtRange(start, lastDay), canGoNext: offset > 0 }
}

// Bucket a flat [{ date, secs }] list into the chart's bars for the window.
function buildBuckets(events, win) {
  const cs = new Date(win.chartStart.getFullYear(), win.chartStart.getMonth(), win.chartStart.getDate())
  const bars = Array.from({ length: win.bins }, (_, i) => {
    let label = '', sub = ''
    if (win.unit === 'day') { const d = addDays(cs, i); label = String(d.getDate()); sub = WEEKDAY3[d.getDay()] }
    else if (win.unit === 'week') { const d = addDays(cs, i * 7); label = String(d.getDate()); sub = '' }
    else { const d = new Date(cs.getFullYear(), cs.getMonth() + i, 1); label = MONTH[d.getMonth()]; sub = '' }
    return { label, sub, secs: 0 }
  })

  for (const ev of events) {
    const d = new Date(ev.date)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    let idx
    if (win.unit === 'day') idx = Math.floor((day - cs) / 86400000)
    else if (win.unit === 'week') idx = Math.floor((day - cs) / (86400000 * 7))
    else idx = (day.getFullYear() - cs.getFullYear()) * 12 + (day.getMonth() - cs.getMonth())
    if (idx >= 0 && idx < win.bins) bars[idx].secs += Number(ev.secs || 0)
  }
  return bars
}

async function getResults(userId, classLevel = null, period = 'week', offset = 0) {
  const win = computeWindow(period, offset)
  const { start, endEx, chartStart, chartEnd } = win

  const [overviewRows, chartRows, mockSubjectRows, mcqSubjectRows, recentRows, classSubjectRows, streakRows] = await Promise.all([
    // ── Overview totals (within window) ───────────────────────────────────────
    db.$queryRawUnsafe(
      `SELECT
         (SELECT count(*)::int FROM mock_test_attempts
            WHERE user_id = $1::uuid AND ($2::timestamptz IS NULL OR (created_at >= $2 AND created_at < $3))) AS "mockCount",
         (SELECT coalesce(sum(CASE WHEN total > 0 THEN score * 100.0 / total END), 0) FROM mock_test_attempts
            WHERE user_id = $1::uuid AND ($2::timestamptz IS NULL OR (created_at >= $2 AND created_at < $3))) AS "mockPctSum",
         (SELECT count(*)::int FROM brain_gym_sessions
            WHERE "userId" = $1::uuid AND ($2::timestamptz IS NULL OR ("createdAt" >= $2 AND "createdAt" < $3))) AS "quizCount",
         (SELECT coalesce(sum(CASE WHEN "totalQuestions" > 0 THEN "correctCount" * 100.0 / "totalQuestions" END), 0) FROM brain_gym_sessions
            WHERE "userId" = $1::uuid AND ($2::timestamptz IS NULL OR ("createdAt" >= $2 AND "createdAt" < $3))) AS "quizPctSum",
         (SELECT coalesce(sum("xpEarned"), 0)::int FROM brain_gym_sessions
            WHERE "userId" = $1::uuid AND ($2::timestamptz IS NULL OR ("createdAt" >= $2 AND "createdAt" < $3))) AS "xp",
         (
           (SELECT coalesce(sum(time_taken_sec), 0)::int FROM mock_test_attempts
              WHERE user_id = $1::uuid AND ($2::timestamptz IS NULL OR (created_at >= $2 AND created_at < $3)))
         + (SELECT coalesce(sum("timeTakenSec"), 0)::int FROM brain_gym_sessions
              WHERE "userId" = $1::uuid AND ($2::timestamptz IS NULL OR ("createdAt" >= $2 AND "createdAt" < $3)))
         + (SELECT coalesce(sum("studyTimeSeconds"), 0)::int FROM lesson_progress
              WHERE "userId" = $1::uuid AND ($2::timestamptz IS NULL OR ("updatedAt" >= $2 AND "updatedAt" < $3)))
         ) AS "studySeconds"`,
      userId, start, endEx,
    ),

    // ── Chart events (mock + quiz + lesson study), within the chart window ─────
    db.$queryRawUnsafe(
      `SELECT created_at::date AS "date", time_taken_sec AS "secs"
         FROM mock_test_attempts WHERE user_id = $1::uuid AND created_at >= $2::timestamptz AND created_at < $3::timestamptz
       UNION ALL
       SELECT "createdAt"::date AS "date", "timeTakenSec" AS "secs"
         FROM brain_gym_sessions WHERE "userId" = $1::uuid AND "createdAt" >= $2::timestamptz AND "createdAt" < $3::timestamptz
       UNION ALL
       SELECT "updatedAt"::date AS "date", "studyTimeSeconds" AS "secs"
         FROM lesson_progress WHERE "userId" = $1::uuid AND "updatedAt" >= $2::timestamptz AND "updatedAt" < $3::timestamptz`,
      userId, chartStart, chartEnd,
    ),

    // ── Subject breakdown — mock tests (class-scoped, within window) ───────────
    db.$queryRawUnsafe(
      `SELECT t.subject AS "name", count(*)::int AS "tests",
              coalesce(sum(CASE WHEN a.total > 0 THEN a.score * 100.0 / a.total END), 0) AS "pctSum",
              count(*) FILTER (WHERE a.total > 0)::int AS "scored"
         FROM mock_test_attempts a JOIN mock_tests t ON t.id = a.test_id
        WHERE a.user_id = $1::uuid AND ($4::int IS NULL OR t.class_level = $4)
          AND ($2::timestamptz IS NULL OR (a.created_at >= $2 AND a.created_at < $3))
        GROUP BY t.subject`,
      userId, start, endEx, classLevel,
    ),

    // ── Subject breakdown — MCQ practice (class-scoped, within window) ─────────
    db.$queryRawUnsafe(
      `SELECT sub.name AS "name", count(a.id)::int AS "answered",
              count(a.id) FILTER (WHERE a.is_correct)::int AS "correct"
         FROM mcq_attempts a
         JOIN subtopics st ON st.id = a.subtopic_id
         JOIN chapters ch ON ch.id = st.chapter_id
         JOIN subjects sub ON sub.id = ch.subject_id
        WHERE a.user_id = $1::uuid AND ($4::int IS NULL OR ch.class_level = $4)
          AND ($2::timestamptz IS NULL OR (a.updated_at >= $2 AND a.updated_at < $3))
        GROUP BY sub.name`,
      userId, start, endEx, classLevel,
    ),

    // ── Recent tests — mock + quiz, unified & time-ordered (within window) ─────
    db.$queryRawUnsafe(
      `SELECT * FROM (
         SELECT 'Mock' AS "type", a.id::text AS "id", t.subject AS "subject", t.name AS "topic",
                a.score::int AS "score", a.total::int AS "total",
                a.correct_count::int AS "correct", a.wrong_count::int AS "wrong",
                a.attempted::int AS "attempted", a.time_taken_sec::int AS "timeSec",
                0 AS "xp",
                (SELECT count(*)::int FROM mock_test_attempts x WHERE x.user_id = a.user_id AND x.test_id = a.test_id) AS "attemptCount",
                (SELECT count(*)::int FROM mock_test_attempts x WHERE x.user_id = a.user_id AND x.test_id = a.test_id AND x.created_at <= a.created_at) AS "attemptNumber",
                a.created_at AS "createdAt"
           FROM mock_test_attempts a JOIN mock_tests t ON t.id = a.test_id
          WHERE a.user_id = $1::uuid AND ($2::timestamptz IS NULL OR (a.created_at >= $2 AND a.created_at < $3))
         UNION ALL
         SELECT 'Quiz' AS "type", s.id::text AS "id", 'Brain Gym' AS "subject", s.skill AS "topic",
                s."correctCount"::int AS "score", s."totalQuestions"::int AS "total",
                s."correctCount"::int AS "correct", (s."totalQuestions" - s."correctCount")::int AS "wrong",
                s."totalQuestions"::int AS "attempted", s."timeTakenSec"::int AS "timeSec",
                s."xpEarned"::int AS "xp",
                (SELECT count(*)::int FROM brain_gym_sessions y WHERE y."userId" = s."userId" AND y.skill = s.skill) AS "attemptCount",
                (SELECT count(*)::int FROM brain_gym_sessions y WHERE y."userId" = s."userId" AND y.skill = s.skill AND y."createdAt" <= s."createdAt") AS "attemptNumber",
                s."createdAt"::timestamptz AS "createdAt"
           FROM brain_gym_sessions s
          WHERE s."userId" = $1::uuid AND ($2::timestamptz IS NULL OR (s."createdAt" >= $2 AND s."createdAt" < $3))
       ) u
       ORDER BY "createdAt" DESC
       LIMIT 15`,
      userId, start, endEx,
    ),

    // ── All subjects of the student's class (DB-derived) so the breakdown lists
    //    every subject, even ones with no attempts yet. null class → none. ──────
    classLevel != null
      ? db.$queryRawUnsafe(
          `SELECT DISTINCT s.name AS "name"
             FROM subjects s JOIN chapters ch ON ch.subject_id = s.id
            WHERE ch.class_level = $1`,
          classLevel,
        )
      : Promise.resolve([]),

    // ── Distinct activity days (last 45d) for the study streak — period-independent ──
    db.$queryRawUnsafe(
      `SELECT DISTINCT d FROM (
         SELECT created_at::date d FROM mock_test_attempts WHERE user_id = $1::uuid AND created_at >= now() - interval '45 days'
         UNION SELECT "createdAt"::date FROM brain_gym_sessions WHERE "userId" = $1::uuid AND "createdAt" >= now() - interval '45 days'
         UNION SELECT "updatedAt"::date FROM lesson_progress WHERE "userId" = $1::uuid AND "updatedAt" >= now() - interval '45 days'
       ) x`,
      userId,
    ),
  ])

  // Study streak: consecutive days (ending today, or yesterday if today is idle)
  // with any activity, plus the last 7 days' active/idle flags for the dots.
  const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const activeSet = new Set(streakRows.map((r) => dayKey(new Date(r.d))))
  const nowD = new Date()
  const t0 = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate())
  const todayActive = activeSet.has(dayKey(t0))
  let streak = 0
  const cur = new Date(t0)
  if (!activeSet.has(dayKey(cur))) cur.setDate(cur.getDate() - 1) // streak stays alive through yesterday
  while (activeSet.has(dayKey(cur))) { streak += 1; cur.setDate(cur.getDate() - 1) }
  const streakDays = []
  for (let i = 6; i >= 0; i -= 1) { const d = new Date(t0); d.setDate(d.getDate() - i); streakDays.push(activeSet.has(dayKey(d))) }

  const o = overviewRows[0] || {}
  const mockCount = Number(o.mockCount || 0)
  const quizCount = Number(o.quizCount || 0)
  const testsTaken = mockCount + quizCount
  const pctSum = Number(o.mockPctSum || 0) + Number(o.quizPctSum || 0)
  const avgScore = testsTaken > 0 ? Math.round(pctSum / testsTaken) : 0
  const studySeconds = Number(o.studySeconds || 0)

  // Merge mock + MCQ per subject (unit-weighted accuracy: each mock test and each
  // MCQ question counts as one unit). Seed with every class subject first.
  const bySubject = new Map()
  for (const r of classSubjectRows) {
    if (!bySubject.has(r.name)) bySubject.set(r.name, { name: r.name, tests: 0, mcqs: 0, pctSum: 0, units: 0 })
  }
  for (const r of mockSubjectRows) {
    const cur = bySubject.get(r.name) || { name: r.name, tests: 0, mcqs: 0, pctSum: 0, units: 0 }
    cur.tests += Number(r.tests || 0)
    cur.pctSum += Number(r.pctSum || 0)
    cur.units += Number(r.scored || 0)
    bySubject.set(r.name, cur)
  }
  for (const r of mcqSubjectRows) {
    const answered = Number(r.answered || 0)
    const correct = Number(r.correct || 0)
    const cur = bySubject.get(r.name) || { name: r.name, tests: 0, mcqs: 0, pctSum: 0, units: 0 }
    cur.mcqs += answered
    cur.pctSum += correct * 100
    cur.units += answered
    bySubject.set(r.name, cur)
  }
  const subjects = [...bySubject.values()]
    .map((s) => ({ name: s.name, tests: s.tests, mcqs: s.mcqs, score: s.units > 0 ? Math.round(s.pctSum / s.units) : 0 }))
    .sort((a, b) => (b.tests + b.mcqs) - (a.tests + a.mcqs) || a.name.localeCompare(b.name))

  return {
    period,
    offset,
    rangeLabel: win.rangeLabel,
    canGoPrev: true,
    canGoNext: win.canGoNext,
    streak,
    streakDays,
    todayActive,
    overview: {
      testsTaken,
      mocks: mockCount,
      quizzes: quizCount,
      avgScore,
      studySeconds,
      studyHours: Math.round((studySeconds / 3600) * 10) / 10,
      xp: Number(o.xp || 0),
    },
    daily: buildBuckets(chartRows, win).map((b) => ({
      day: b.label,
      sub: b.sub,
      secs: b.secs,
      hours: Math.round((b.secs / 3600) * 10) / 10,
      minutes: Math.round(b.secs / 60),
    })),
    subjects,
    recent: recentRows.map((r) => ({
      type: r.type,
      id: r.id,
      subject: r.subject,
      topic: r.topic,
      score: Number(r.score || 0),
      total: Number(r.total || 0),
      correct: Number(r.correct || 0),
      wrong: Number(r.wrong || 0),
      attempted: Number(r.attempted || 0),
      timeSec: Number(r.timeSec || 0),
      xp: Number(r.xp || 0),
      attemptCount: Number(r.attemptCount || 1),
      attemptNumber: Number(r.attemptNumber || 1),
      createdAt: r.createdAt,
    })),
  }
}

// Section-wise breakdown for one mock-test attempt (owned by the user). Joins the
// attempt's saved answers (jsonb: { questionId: selectedIndex }) against the test's
// questions to score each section. Quizzes have no sections → empty array.
async function getAttemptSections(userId, attemptId) {
  const rows = await db.$queryRawUnsafe(
    `SELECT q.section_name AS "section",
            count(*)::int AS "total",
            count(*) FILTER (WHERE (att.answers ->> q.id::text) IS NOT NULL)::int AS "attempted",
            count(*) FILTER (WHERE (att.answers ->> q.id::text)::int = q.correct_index)::int AS "correct"
       FROM mock_test_attempts att
       JOIN mock_test_questions q ON q.test_id = att.test_id
      WHERE att.id = $1::uuid AND att.user_id = $2::uuid
      GROUP BY q.section_name, q.section_id
      ORDER BY min(q.order_index)`,
    attemptId, userId,
  )
  return rows.map((r) => {
    const total = Number(r.total || 0)
    const attempted = Number(r.attempted || 0)
    const correct = Number(r.correct || 0)
    return {
      section: r.section || 'Section',
      total, attempted, correct,
      wrong: attempted - correct,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
    }
  })
}

module.exports = { getResults, getAttemptSections }
