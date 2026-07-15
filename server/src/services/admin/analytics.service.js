'use strict'

// Analytics aggregate service — the SINGLE source of truth for platform analytics.
// Both the Reports controller and the Analytics controller consume these functions, so
// the underlying business logic is defined once. Every metric is real (drawn from the
// live tables); a query that fails degrades to empty rather than breaking the response.
//
// Filters (all optional): { days, klass, board, school, subject }. `days` is a validated
// int inlined into the interval; every user-supplied string is bound as a parameter.

const db = require('../../config/database')

const num = (v) => (v == null ? 0 : Number(v) || 0)
const q = (sql, ...p) => db.$queryRawUnsafe(sql, ...p).catch((err) => {
  console.error('[analytics] query failed:', err && err.message ? err.message : err, '\n  SQL:', String(sql).replace(/\s+/g, ' ').trim().slice(0, 140))
  return []
})
const one = async (sql, ...p) => { const r = await q(sql, ...p); return (r && r[0]) || {} }
const clampDays = (d) => Math.min(Math.max(parseInt(d, 10) || 30, 7), 180)

// Build the user-cohort conditions (class/board/school) against a users alias.
function cohortConds(filters, alias, bind) {
  const c = []
  if (filters.klass) c.push(`(${alias}.grade = ${bind(filters.klass)} OR ${alias}.grade = ${bind('Class ' + filters.klass)})`)
  if (filters.board) c.push(`${alias}.board = ${bind(filters.board)}`)
  if (filters.school) c.push(`${alias}.school = ${bind(filters.school)}`)
  return c
}
// `userId IN (cohort)` fragment for activity tables. Returns '' when no cohort filter set.
function userInCohort(filters, bind, col = '"userId"') {
  const params = []
  const localBind = (v) => { params.push(v); return bind(v) }
  const c = cohortConds(filters, 'u', localBind)
  return c.length ? `AND ${col} IN (SELECT id FROM "users" u WHERE ${c.join(' AND ')})` : ''
}

// ─── Filter facets ────────────────────────────────────────────────────────────
async function facets() {
  const [classes, boards, schools, subjects] = await Promise.all([
    q(`SELECT DISTINCT grade FROM "users" WHERE grade IS NOT NULL AND grade <> '' ORDER BY grade`),
    q(`SELECT DISTINCT board FROM "users" WHERE board IS NOT NULL AND board <> '' ORDER BY board`),
    q(`SELECT DISTINCT school FROM "users" WHERE school IS NOT NULL AND school <> '' ORDER BY school LIMIT 200`),
    q(`SELECT DISTINCT subject FROM "lessons" WHERE subject IS NOT NULL AND subject <> '' ORDER BY subject LIMIT 100`),
  ])
  return {
    classes: classes.map((r) => r.grade),
    boards: boards.map((r) => r.board),
    schools: schools.map((r) => r.school),
    subjects: subjects.map((r) => r.subject),
  }
}

// ─── Overview + engagement ────────────────────────────────────────────────────
async function summary(filters = {}) {
  const days = clampDays(filters.days)
  const activeUnion = (since, extraCohort) => {
    // distinct active users (brain gym ∪ events ∪ lessons), optionally cohort-filtered
    const p = []
    const bind = (v) => { p.push(v); return `$${p.length}` }
    const cg = userInCohort(filters, bind, 'bg."userId"')
    const ce = userInCohort(filters, bind, 'se."userId"')
    const cl = userInCohort(filters, bind, 'l."userId"')
    return {
      sql: `SELECT COUNT(DISTINCT u)::int AS n FROM (
              SELECT bg."userId" u FROM "brain_gym_sessions" bg WHERE bg."createdAt" >= ${since} ${cg}
              UNION SELECT se."userId" FROM "student_events" se WHERE se."createdAt" >= ${since} ${ce}
              UNION SELECT l."userId" FROM "lessons" l WHERE l."createdAt" >= ${since} ${cl}) s`,
      params: p,
    }
  }
  const aToday = activeUnion(`date_trunc('day', now())`)
  const aWeek = activeUnion(`now() - interval '7 days'`)
  const aMonth = activeUnion(`now() - interval '30 days'`)

  const [users, today, week, month, lp, bg, practice, mock, aiLessons, doubts, sessDur] = await Promise.all([
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = cohortConds(filters, 'users', b); const w = c.length ? 'AND ' + c.join(' AND ') : ''
      return one(`SELECT COUNT(*) FILTER (WHERE COALESCE(account_type,'student')='student')::int AS students,
                COUNT(*) FILTER (WHERE account_type='parent')::int AS parents,
                COUNT(*) FILTER (WHERE account_type='teacher')::int AS teachers,
                COUNT(*) FILTER (WHERE "createdAt" >= now() - interval '${days} days')::int AS new_registrations,
                COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('day', now()))::int AS new_today
           FROM "users" WHERE true ${w}`, ...p) })(),
    one(aToday.sql, ...aToday.params),
    one(aWeek.sql, ...aWeek.params),
    one(aMonth.sql, ...aMonth.params),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'lp."userId"'); return one(`SELECT COUNT(*) FILTER (WHERE lp."completedAt" IS NOT NULL)::int AS completed, COUNT(*)::int AS started FROM "lesson_progress" lp WHERE true ${c}`, ...p) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'bg."userId"'); return one(`SELECT COUNT(*)::int AS sessions, COALESCE(SUM(bg."correctCount"),0)::int AS correct, COALESCE(SUM(bg."totalQuestions"),0)::int AS total FROM "brain_gym_sessions" bg WHERE bg."createdAt" >= now() - interval '${days} days' ${c}`, ...p) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'qa."userId"'); return one(`SELECT COUNT(*)::int AS n FROM "question_attempts" qa WHERE qa."createdAt" >= now() - interval '${days} days' ${c}`, ...p) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'a.user_id'); const sub = filters.subject ? `AND m.subject = ${b(filters.subject)}` : ''; return one(`SELECT COUNT(*)::int AS n FROM "mock_test_attempts" a JOIN "mock_tests" m ON m.id=a.test_id WHERE a.created_at >= now() - interval '${days} days' ${c} ${sub}`, ...p) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'l."userId"'); const sub = filters.subject ? `AND l.subject = ${b(filters.subject)}` : ''; return one(`SELECT COUNT(*)::int AS n FROM "lessons" l WHERE l."createdAt" >= now() - interval '${days} days' ${c} ${sub}`, ...p) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'ds."userId"'); return one(`SELECT COUNT(*)::int AS n FROM "doubt_sessions" ds WHERE ds."createdAt" >= now() - interval '${days} days' ${c}`, ...p).catch(() => ({ n: 0 })) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'bg."userId"'); return one(`SELECT COALESCE(AVG(bg."timeTakenSec") FILTER (WHERE bg."timeTakenSec" > 0), 0)::int AS avg_sec FROM "brain_gym_sessions" bg WHERE bg."createdAt" >= now() - interval '${days} days' ${c}`, ...p) })(),
  ])

  const students = num(users.students)
  const completionRate = num(lp.started) > 0 ? Math.round((num(lp.completed) / num(lp.started)) * 100) : null
  const accuracy = num(bg.total) > 0 ? Math.round((num(bg.correct) / num(bg.total)) * 100) : null
  const weeklyEngagement = students > 0 ? Math.round((num(week.n) / students) * 100) : null
  const monthlyEngagement = students > 0 ? Math.round((num(month.n) / students) * 100) : null

  return {
    window: { days },
    totalStudents: students,
    totalParents: num(users.parents),
    totalTeachers: num(users.teachers),
    activeToday: num(today.n),
    activeThisWeek: num(week.n),
    activeThisMonth: num(month.n),
    newRegistrations: num(users.new_registrations),
    newToday: num(users.new_today),
    lessonCompletionRate: completionRate,
    lessonsCompleted: num(lp.completed),
    brainGymSessions: num(bg.sessions),
    brainGymAccuracy: accuracy,
    practiceAttempts: num(practice.n) + num(mock.n),
    aiTeacherSessions: num(aiLessons.n),
    doubtsAsked: num(doubts.n),
    avgSessionDuration: num(sessDur.avg_sec), // seconds (from timed Brain Gym sessions)
    weeklyEngagement,
    monthlyEngagement,
  }
}

// Dense daily series helper: fill gaps with 0 across `days`.
function densify(rows, days, valueKey = 'n') {
  const byDay = {}
  for (const r of rows || []) byDay[new Date(r.d).toISOString().slice(0, 10)] = num(r[valueKey])
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(); dt.setUTCHours(0, 0, 0, 0); dt.setUTCDate(dt.getUTCDate() - i)
    const key = dt.toISOString().slice(0, 10)
    out.push({ date: key, value: byDay[key] || 0 })
  }
  return out
}

// ─── Trend series ─────────────────────────────────────────────────────────────
async function trends(filters = {}) {
  const days = clampDays(filters.days)
  const daily = (table, dateCol, userCol, extraJoin = '', extraWhere = '') => {
    const p = []
    const b = (v) => { p.push(v); return `$${p.length}` }
    const cohort = userInCohort(filters, b, userCol)
    return q(`SELECT ((${dateCol} AT TIME ZONE 'UTC')::date) AS d, COUNT(*)::int AS n
                FROM ${table} ${extraJoin}
               WHERE ${dateCol} >= now() - interval '${days} days' ${cohort} ${extraWhere}
               GROUP BY d ORDER BY d`, ...p)
  }
  const subjLesson = filters.subject ? { extra: '', where: '' } : { extra: '', where: '' }

  const [dau, lessonsCompleted, brainGym, practiceQ, mockA, aiLessons, parentSignups, wau] = await Promise.all([
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }
      const cg = userInCohort(filters, b, 'bg."userId"'); const ce = userInCohort(filters, b, 'se."userId"'); const cl = userInCohort(filters, b, 'l."userId"')
      return q(`SELECT d, COUNT(DISTINCT u)::int AS n FROM (
                 SELECT ((bg."createdAt" AT TIME ZONE 'UTC')::date) d, bg."userId" u FROM "brain_gym_sessions" bg WHERE bg."createdAt" >= now() - interval '${days} days' ${cg}
                 UNION SELECT ((se."createdAt" AT TIME ZONE 'UTC')::date), se."userId" FROM "student_events" se WHERE se."createdAt" >= now() - interval '${days} days' ${ce}
                 UNION SELECT ((l."createdAt" AT TIME ZONE 'UTC')::date), l."userId" FROM "lessons" l WHERE l."createdAt" >= now() - interval '${days} days' ${cl}) s GROUP BY d ORDER BY d`, ...p) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'lp."userId"'); return q(`SELECT ((lp."completedAt" AT TIME ZONE 'UTC')::date) AS d, COUNT(*)::int AS n FROM "lesson_progress" lp WHERE lp."completedAt" >= now() - interval '${days} days' ${c} GROUP BY d ORDER BY d`, ...p) })(),
    daily('"brain_gym_sessions" bg', 'bg."createdAt"', 'bg."userId"'),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'qa."userId"'); return q(`SELECT ((qa."createdAt" AT TIME ZONE 'UTC')::date) AS d, COUNT(*)::int AS n FROM "question_attempts" qa WHERE qa."createdAt" >= now() - interval '${days} days' ${c} GROUP BY d ORDER BY d`, ...p) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'a.user_id'); const sub = filters.subject ? `AND m.subject = ${b(filters.subject)}` : ''; return q(`SELECT ((a.created_at AT TIME ZONE 'UTC')::date) AS d, COUNT(*)::int AS n FROM "mock_test_attempts" a JOIN "mock_tests" m ON m.id=a.test_id WHERE a.created_at >= now() - interval '${days} days' ${c} ${sub} GROUP BY d ORDER BY d`, ...p) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'l."userId"'); const sub = filters.subject ? `AND l.subject = ${b(filters.subject)}` : ''; return q(`SELECT ((l."createdAt" AT TIME ZONE 'UTC')::date) AS d, COUNT(*)::int AS n FROM "lessons" l WHERE l."createdAt" >= now() - interval '${days} days' ${c} ${sub} GROUP BY d ORDER BY d`, ...p) })(),
    q(`SELECT (("createdAt" AT TIME ZONE 'UTC')::date) AS d, COUNT(*)::int AS n FROM "users" WHERE account_type='parent' AND "createdAt" >= now() - interval '${days} days' GROUP BY d ORDER BY d`),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }
      const cg = userInCohort(filters, b, 'bg."userId"'); const ce = userInCohort(filters, b, 'se."userId"'); const cl = userInCohort(filters, b, 'l."userId"')
      return q(`SELECT date_trunc('week', d) AS d, COUNT(DISTINCT u)::int AS n FROM (
                 SELECT bg."createdAt" d, bg."userId" u FROM "brain_gym_sessions" bg WHERE bg."createdAt" >= now() - interval '${days} days' ${cg}
                 UNION SELECT se."createdAt", se."userId" FROM "student_events" se WHERE se."createdAt" >= now() - interval '${days} days' ${ce}
                 UNION SELECT l."createdAt", l."userId" FROM "lessons" l WHERE l."createdAt" >= now() - interval '${days} days' ${cl}) s GROUP BY 1 ORDER BY 1`, ...p) })(),
  ])

  // Practice trend = question attempts + mock attempts merged per day.
  const practiceMap = {}
  for (const r of practiceQ) practiceMap[new Date(r.d).toISOString().slice(0, 10)] = num(r.n)
  for (const r of mockA) { const k = new Date(r.d).toISOString().slice(0, 10); practiceMap[k] = (practiceMap[k] || 0) + num(r.n) }
  const practiceRows = Object.entries(practiceMap).map(([d, n]) => ({ d, n }))

  return {
    window: { days },
    dailyActiveUsers: densify(dau, days),
    weeklyActiveUsers: (wau || []).map((r) => ({ date: new Date(r.d).toISOString().slice(0, 10), value: num(r.n) })),
    lessonCompletion: densify(lessonsCompleted, days),
    brainGym: densify(brainGym, days),
    practice: densify(practiceRows, days),
    aiTeacher: densify(aiLessons, days),
    parentEngagement: densify(parentSignups, days),
  }
}

// ─── Top lists ────────────────────────────────────────────────────────────────
async function top(filters = {}) {
  const days = clampDays(filters.days)
  const [topStudents, atRisk, weakSubjects, weakChapters, topLessons, topBrainGym] = await Promise.all([
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = cohortConds(filters, 'u', b); const w = c.length ? 'AND ' + c.join(' AND ') : ''
      return q(`SELECT u.id::text AS id, u.name, u.grade, COALESCE(SUM(bg."xpEarned"),0)::int AS xp,
                       COALESCE(SUM(bg."correctCount"),0)::int AS correct, COALESCE(SUM(bg."totalQuestions"),0)::int AS total, COUNT(bg.id)::int AS sessions
                  FROM "brain_gym_sessions" bg JOIN "users" u ON u.id=bg."userId"
                 WHERE bg."createdAt" >= now() - interval '${days} days' ${w}
                 GROUP BY u.id ORDER BY xp DESC LIMIT 10`, ...p) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = cohortConds(filters, 'u', b); const w = c.length ? 'AND ' + c.join(' AND ') : ''
      return q(`SELECT u.id::text AS id, u.name, u.grade,
                       COALESCE(SUM(bg."correctCount"),0)::int AS correct, COALESCE(SUM(bg."totalQuestions"),0)::int AS total, COUNT(bg.id)::int AS sessions,
                       (SELECT COUNT(*) FROM "mistake_book" mb WHERE mb."userId"=u.id AND mb.status='unresolved')::int AS open_mistakes
                  FROM "brain_gym_sessions" bg JOIN "users" u ON u.id=bg."userId"
                 WHERE bg."createdAt" >= now() - interval '${days} days' ${w}
                 GROUP BY u.id HAVING COUNT(bg.id) >= 3 AND COALESCE(SUM(bg."totalQuestions"),0) > 0
                    AND (COALESCE(SUM(bg."correctCount"),0)::float / NULLIF(SUM(bg."totalQuestions"),0)) < 0.5
                 ORDER BY (COALESCE(SUM(bg."correctCount"),0)::float / NULLIF(SUM(bg."totalQuestions"),0)) ASC LIMIT 10`, ...p) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'mb."userId"'); return q(`SELECT subject, COUNT(*)::int AS mistakes, COUNT(DISTINCT mb."userId")::int AS students FROM "mistake_book" mb WHERE status='unresolved' AND subject <> '' ${c} GROUP BY subject ORDER BY mistakes DESC LIMIT 8`, ...p) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'mb."userId"'); const sub = filters.subject ? `AND subject = ${b(filters.subject)}` : ''; return q(`SELECT subject, chapter, COUNT(*)::int AS mistakes, COUNT(DISTINCT mb."userId")::int AS students FROM "mistake_book" mb WHERE status='unresolved' AND chapter <> '' ${sub} ${c} GROUP BY subject, chapter ORDER BY mistakes DESC LIMIT 10`, ...p) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'l."userId"'); const sub = filters.subject ? `AND l.subject = ${b(filters.subject)}` : ''; return q(`SELECT l."lessonTitle" AS title, l.subject, COUNT(*)::int AS count FROM "lessons" l WHERE l."createdAt" >= now() - interval '${days} days' AND l."lessonTitle" <> '' ${sub} ${c} GROUP BY l."lessonTitle", l.subject ORDER BY count DESC LIMIT 10`, ...p) })(),
    (() => { const p = []; const b = (v) => { p.push(v); return `$${p.length}` }; const c = userInCohort(filters, b, 'bg."userId"'); return q(`SELECT bg.skill AS activity, COUNT(*)::int AS count, COALESCE(AVG(CASE WHEN bg."totalQuestions">0 THEN bg."correctCount"::float/bg."totalQuestions" END),0)::float AS accuracy FROM "brain_gym_sessions" bg WHERE bg."createdAt" >= now() - interval '${days} days' ${c} GROUP BY bg.skill ORDER BY count DESC LIMIT 8`, ...p) })(),
  ])

  return {
    topStudents: topStudents.map((s) => ({ id: s.id, name: s.name, grade: s.grade, xp: num(s.xp), sessions: num(s.sessions), accuracy: num(s.total) > 0 ? Math.round((num(s.correct) / num(s.total)) * 100) : null })),
    studentsAtRisk: atRisk.map((s) => ({ id: s.id, name: s.name, grade: s.grade, accuracy: num(s.total) > 0 ? Math.round((num(s.correct) / num(s.total)) * 100) : null, openMistakes: num(s.open_mistakes), sessions: num(s.sessions) })),
    weakSubjects: weakSubjects.map((r) => ({ subject: r.subject, mistakes: num(r.mistakes), students: num(r.students) })),
    weakChapters: weakChapters.map((r) => ({ subject: r.subject, chapter: r.chapter, mistakes: num(r.mistakes), students: num(r.students) })),
    mostUsedLessons: topLessons.map((r) => ({ title: r.title, subject: r.subject, count: num(r.count) })),
    mostUsedBrainGym: topBrainGym.map((r) => ({ activity: r.activity, count: num(r.count), accuracy: Math.round(num(r.accuracy) * 100) })),
  }
}

// ─── Realtime activity feeds ──────────────────────────────────────────────────
async function activity() {
  const [signups, lessons, ai, parents] = await Promise.all([
    q(`SELECT id::text AS id, name, COALESCE(email, phone) AS detail, grade, "createdAt" AS at FROM "users" WHERE COALESCE(account_type,'student')='student' ORDER BY "createdAt" DESC LIMIT 12`),
    q(`SELECT lp.id::text AS id, l."lessonTitle" AS title, u.name AS student, lp."completedAt" AS at FROM "lesson_progress" lp JOIN "lessons" l ON l.id=lp."lessonId" JOIN "users" u ON u.id=lp."userId" WHERE lp."completedAt" IS NOT NULL ORDER BY lp."completedAt" DESC LIMIT 12`),
    q(`SELECT l.id::text AS id, l."lessonTitle" AS title, l.subject, u.name AS student, l.status, l."createdAt" AS at FROM "lessons" l JOIN "users" u ON u.id=l."userId" ORDER BY l."createdAt" DESC LIMIT 12`),
    q(`SELECT id::text AS id, name, COALESCE(email, phone) AS detail, linked_student_id::text AS "linkedStudentId", "createdAt" AS at FROM "users" WHERE account_type='parent' ORDER BY "createdAt" DESC LIMIT 12`),
  ])
  return {
    recentSignups: signups.map((r) => ({ id: r.id, name: r.name, detail: r.detail, grade: r.grade, at: r.at })),
    recentLessons: lessons.map((r) => ({ id: r.id, title: r.title, student: r.student, at: r.at })),
    recentAiTeacher: ai.map((r) => ({ id: r.id, title: r.title, subject: r.subject, student: r.student, status: r.status, at: r.at })),
    recentParents: parents.map((r) => ({ id: r.id, name: r.name, detail: r.detail, linked: !!r.linkedStudentId, at: r.at })),
  }
}

module.exports = { facets, summary, trends, top, activity, clampDays }
