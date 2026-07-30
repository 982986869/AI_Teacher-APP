'use strict'

// Parent experience — read-only. A parent links to ONE child (by email/phone), then
// sees the child's progress. Parents can never attempt student content (enforced via
// req.scope.role across the student write endpoints).

const db = require('../config/database')
const ApiResponse = require('../utils/ApiResponse')
const braingym = require('../services/braingym.service')
const arena = require('../services/arena/arena.service')
const memory = require('../services/memory.service')
const { buildIntelligence } = require('../services/parent/insights')
const { deriveScope } = require('../services/personalization/scope')

const onlyParent = (req) => req.scope && req.scope.role === 'parent'

// The report is a ~20-query aggregate that backs the Home screen and refetches on
// focus. Progress does not change second-to-second, so a short per-child in-memory
// cache collapses bursts (rapid tab-hops, parent+student both viewing) into ONE
// recompute. TTL is small enough that a just-finished lesson still shows on return.
// Per server instance; a shared Redis cache would extend this horizontally.
const REPORT_CACHE = new Map()
const REPORT_TTL_MS = 15000
const REPORT_CACHE_MAX = 5000
function getCachedReport(childId) {
  const hit = REPORT_CACHE.get(childId)
  if (hit && Date.now() - hit.at < REPORT_TTL_MS) return hit.payload
  return null
}
function setCachedReport(childId, payload) {
  REPORT_CACHE.set(childId, { at: Date.now(), payload })
  if (REPORT_CACHE.size > REPORT_CACHE_MAX) REPORT_CACHE.delete(REPORT_CACHE.keys().next().value)
}

// POST /api/parent/link-child  { email? , phone? }
async function linkChild(req, res, next) {
  try {
    if (!onlyParent(req)) return ApiResponse.error(res, 'Only a parent account can link a child.', 403)
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : null
    const phone = req.body.phone ? String(req.body.phone).trim() : null
    if (!email && !phone) return ApiResponse.error(res, 'Child email or phone is required.', 422)

    const rows = await db.$queryRawUnsafe(
      `SELECT id, name, grade, stream, account_type FROM "users"
        WHERE ($1::text IS NOT NULL AND lower(email) = $1) OR ($2::text IS NOT NULL AND phone = $2)
        LIMIT 1`,
      email, phone,
    )
    const child = rows && rows[0]
    if (!child) return ApiResponse.error(res, 'No student found with those details.', 404)
    if (String(child.account_type || 'student') !== 'student') return ApiResponse.error(res, 'That account is not a student.', 422)
    if (child.id === req.user.id) return ApiResponse.error(res, 'You cannot link yourself.', 422)

    await db.$executeRawUnsafe(`UPDATE "users" SET "linked_student_id" = $1::uuid WHERE id = $2::uuid`, child.id, req.user.id)
    return ApiResponse.success(res, { child: { id: child.id, name: child.name, grade: child.grade } }, 'Child linked')
  } catch (err) { next(err) }
}

// GET /api/parent/report — progress summary (read-only).
// Two callers, one endpoint:
//   • parent account  → their linked child (no link yet → { linked:false } → LinkChild)
//   • student account → their OWN progress, so the SAME login can flip into the parent
//     dashboard ("view as parent") without a separate parent account.
async function report(req, res, next) {
  try {
    const role = (req.scope && req.scope.role) || 'student'
    let childId
    if (role === 'parent') {
      childId = req.user.linked_student_id
      if (!childId) return ApiResponse.success(res, { linked: false })
    } else if (role === 'student') {
      childId = req.user.id
    } else {
      return ApiResponse.error(res, 'Only a parent or student account can view this.', 403)
    }

    // Short-lived cache: collapse rapid refetches (focus/tab-hops) into one recompute.
    // Pull-to-refresh (?fresh=1) always bypasses it for guaranteed-live data.
    if (req.query.fresh !== '1') {
      const cached = getCachedReport(childId)
      if (cached) return ApiResponse.success(res, cached)
    }

    const rows = await db.$queryRawUnsafe(
      `SELECT id, name, grade, stream, board, account_type FROM "users" WHERE id = $1::uuid LIMIT 1`,
      childId,
    )
    const child = rows && rows[0]
    if (!child) return ApiResponse.success(res, { linked: false })

    // Pull the child's progress from the existing services (best-effort each — a
    // failing signal never breaks the report; the client renders an empty state).
    const [progress, arenaHist, weakAreas, improving, recentActivity, weekRows,
      lessonRows, recentLessonRows, doubtRows, journeyRows, calendarRows, twRows, lwRows] = await Promise.all([
      braingym.getProgress(childId).catch(() => null),
      arena.history({ userId: childId, limit: 10 }).catch(() => null),
      memory.getWeakChapters(childId, { limit: 4 }).catch(() => []),
      memory.getStrongChapters(childId, { limit: 3 }).catch(() => []),
      memory.getRecentActivity(childId, { limit: 8 }).catch(() => []),
      db.$queryRawUnsafe(
        `SELECT (("createdAt" AT TIME ZONE 'UTC')::date) AS d,
                COUNT(*)::int AS quizzes, COALESCE(SUM("xpEarned"),0)::int AS xp,
                COALESCE(SUM("correctCount"),0)::int AS correct,
                COALESCE(SUM("totalQuestions"),0)::int AS total
           FROM "brain_gym_sessions"
          WHERE "userId" = $1::uuid AND "createdAt" >= now() - interval '13 days'
          GROUP BY d`,
        childId,
      ).catch(() => []),
      // AI Teacher lessons (Phase 1)
      db.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE "createdAt" >= now() - interval '7 days')::int AS this_week,
                COUNT(DISTINCT subject)::int AS subjects
           FROM "lessons" WHERE "userId" = $1::uuid`,
        childId,
      ).catch(() => [{ total: 0, this_week: 0, subjects: 0 }]),
      db.$queryRawUnsafe(
        `SELECT "lessonTitle" AS title, subject, "createdAt" AS at
           FROM "lessons" WHERE "userId" = $1::uuid ORDER BY "createdAt" DESC LIMIT 3`,
        childId,
      ).catch(() => []),
      // AI Teacher doubts asked (Phase 1)
      db.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE "createdAt" >= now() - interval '7 days')::int AS this_week
           FROM "student_events" WHERE "userId" = $1::uuid AND type = 'doubt'`,
        childId,
      ).catch(() => [{ total: 0, this_week: 0 }]),
      // Weekly XP trend for the learning journey (Phase 3)
      db.$queryRawUnsafe(
        `SELECT date_trunc('week', "createdAt") AS wk, COALESCE(SUM("xpEarned"),0)::int AS xp, COUNT(*)::int AS quizzes
           FROM "brain_gym_sessions" WHERE "userId" = $1::uuid AND "createdAt" >= now() - interval '42 days'
          GROUP BY wk ORDER BY wk`,
        childId,
      ).catch(() => []),
      // Per-day activity for the calendar (Phase 7): quizzes + XP per day, plus whether
      // the day had any activity (session OR event), over the last ~6 weeks.
      db.$queryRawUnsafe(
        `SELECT d, COALESCE(SUM(q),0)::int AS quizzes, COALESCE(SUM(xp),0)::int AS xp, BOOL_OR(evt) AS evt
           FROM (
             SELECT (("createdAt" AT TIME ZONE 'UTC')::date) d, 1 AS q, "xpEarned" AS xp, false AS evt
               FROM "brain_gym_sessions" WHERE "userId" = $1::uuid AND "createdAt" >= now() - interval '41 days'
             UNION ALL
             SELECT (("createdAt" AT TIME ZONE 'UTC')::date) d, 0 AS q, 0 AS xp, true AS evt
               FROM "student_events" WHERE "userId" = $1::uuid AND "createdAt" >= now() - interval '41 days'
           ) u GROUP BY d`,
        childId,
      ).catch(() => []),
      // This-week vs last-week aggregates for growth (Phase 10)
      db.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS quizzes, COALESCE(SUM("xpEarned"),0)::int AS xp,
                COALESCE(SUM("correctCount"),0)::int AS correct, COALESCE(SUM("totalQuestions"),0)::int AS total,
                COUNT(DISTINCT ("createdAt" AT TIME ZONE 'UTC')::date)::int AS active_days
           FROM "brain_gym_sessions" WHERE "userId" = $1::uuid AND "createdAt" >= date_trunc('week', now())`,
        childId,
      ).catch(() => [{}]),
      db.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS quizzes, COALESCE(SUM("xpEarned"),0)::int AS xp,
                COALESCE(SUM("correctCount"),0)::int AS correct, COALESCE(SUM("totalQuestions"),0)::int AS total,
                COUNT(DISTINCT ("createdAt" AT TIME ZONE 'UTC')::date)::int AS active_days
           FROM "brain_gym_sessions" WHERE "userId" = $1::uuid
            AND "createdAt" >= date_trunc('week', now()) - interval '7 days' AND "createdAt" < date_trunc('week', now())`,
        childId,
      ).catch(() => [{}]),
    ])
    let mistakes = 0
    try {
      const mc = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "mistake_book" WHERE "userId" = $1::uuid AND status = 'unresolved'`, childId)
      mistakes = (mc && mc[0] && mc[0].n) || 0
    } catch (_) { /* table may not exist in some envs */ }

    // Child's BrainGym leaderboard standing — reuses the existing leaderboard service
    // (no duplication) so the parent's AI Gym view can show real rank. Best-effort.
    let leaderboard = null
    try {
      const lb = await braingym.getLeaderboard({ period: 'all', userId: childId, limit: 1 })
      if (lb && lb.me) leaderboard = { rank: lb.me.rank, xp: lb.me.xp, totalPlayers: lb.totalPlayers }
    } catch (_) { /* leaderboard is optional */ }

    // Weekly activity — a real Sun→Sat bar series for THIS week (quizzes + XP per day).
    const byDay = {}
    for (const r of (weekRows || [])) {
      byDay[new Date(r.d).toISOString().slice(0, 10)] = {
        quizzes: Number(r.quizzes) || 0, xp: Number(r.xp) || 0,
        correct: Number(r.correct) || 0, total: Number(r.total) || 0,
      }
    }
    const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay())
    const weeklyActivity = []
    const wk = { quizzes: 0, xp: 0, correct: 0, total: 0, activeDays: 0 }
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + i)
      const cell = byDay[d.toISOString().slice(0, 10)] || { quizzes: 0, xp: 0, correct: 0, total: 0 }
      weeklyActivity.push({
        day: DOW[d.getDay()], date: d.getDate(), quizzes: cell.quizzes, xp: cell.xp,
        isToday: d.getTime() === today.getTime(), isFuture: d.getTime() > today.getTime(),
      })
      wk.quizzes += cell.quizzes; wk.xp += cell.xp; wk.correct += cell.correct; wk.total += cell.total
      if (cell.quizzes > 0) wk.activeDays += 1
    }
    const todayCell = weeklyActivity.find((w) => w.isToday) || { quizzes: 0, xp: 0 }

    const sc = deriveScope(child)
    const bg = progress || { totalXp: 0, quizzesCompleted: 0, accuracy: 0, currentStreak: 0 }

    const first = child.name ? String(child.name).split(' ')[0] : 'your child'
    const weak = Array.isArray(weakAreas) ? weakAreas : []
    const strong = Array.isArray(improving) ? improving : []
    const timeline = Array.isArray(recentActivity) ? recentActivity : []
    const quizzesDone = Number(bg.quizzesCompleted) || 0
    const accuracy = Number(bg.accuracy) || 0
    const streak = Number(bg.currentStreak) || 0
    const hasAny = quizzesDone > 0 || timeline.length > 0

    // ── Weekly summary (Phase 3) — real numbers for the current Sun→Sat week ──────
    const weeklySummary = {
      quizzes: wk.quizzes,
      xp: wk.xp,
      activeDays: wk.activeDays,
      accuracy: wk.total > 0 ? Math.round((wk.correct / wk.total) * 100) : null,
      conceptsImproved: strong.map((s) => s.chapter || s.subject).filter(Boolean).slice(0, 3),
      weakConcepts: weak.map((w) => w.chapter || w.subject).filter(Boolean).slice(0, 3),
    }

    // ── Learning timeline (Phase 4) — parent-friendly labels over the raw feed ────
    const TL_LABEL = { quiz: 'Practice quiz', doubt: 'Asked the AI teacher', mistake: 'Added to Mistake Book', lesson: 'Watched a lesson', arena: 'Arena match' }
    const learningTimeline = timeline.slice(0, 8).map((a) => ({
      type: a.type,
      title: TL_LABEL[a.type] || 'Learning activity',
      subject: a.subject || null,
      chapter: a.chapter || null,
      correct: typeof a.correct === 'boolean' ? a.correct : null,
      at: a.at,
    }))

    // ── Recommended next step (Phase 5) — one structured, deterministic action ────
    let recommendedNextStep
    if (quizzesDone === 0) recommendedNextStep = { action: 'braingym', title: 'Start the first set', subtitle: `A 5-minute AI Gym set gets ${first} going.` }
    else if (mistakes > 0) recommendedNextStep = { action: 'mistakes', title: 'Review mistakes', subtitle: `${mistakes} item${mistakes > 1 ? 's' : ''} in the Mistake Book to revise.` }
    else if (weak.length) recommendedNextStep = { action: 'weak', title: `Revisit ${weak[0].chapter || weak[0].subject}`, subtitle: 'A quick refresher will lift confidence.' }
    else if (accuracy >= 80) recommendedNextStep = { action: 'arena', title: 'Try an Arena challenge', subtitle: `Accuracy is strong at ${accuracy}% — time to stretch.` }
    else recommendedNextStep = { action: 'braingym', title: "Keep today's streak", subtitle: 'One short AI Gym set keeps momentum.' }

    // Keep the plain-text suggestion (used by existing cards) aligned to the step.
    const suggestion = `${recommendedNextStep.title} — ${recommendedNextStep.subtitle}`

    // ── Assemble the parent-intelligence blocks (deterministic, real data only) ───
    const arenaOut = arenaHist
      ? { rating: arenaHist.rating, played: arenaHist.played, wins: arenaHist.wins, losses: arenaHist.losses }
      : { rating: 1000, played: 0, wins: 0, losses: 0 }
    const one = (rows, dflt) => (Array.isArray(rows) && rows[0]) || dflt || {}
    const lRow = one(lessonRows, { total: 0, this_week: 0, subjects: 0 })
    const dRow = one(doubtRows, { total: 0, this_week: 0 })
    const twRow = one(twRows); const lwRow = one(lwRows)
    const intel = buildIntelligence({
      first, bg, arena: arenaOut, mistakes,
      weakChapters: weak, strongChapters: strong, weeklySummary,
      todayQuizzes: todayCell.quizzes || 0, recommendationText: recommendedNextStep.subtitle,
      lessonAgg: { total: Number(lRow.total) || 0, thisWeek: Number(lRow.this_week) || 0, subjects: Number(lRow.subjects) || 0 },
      doubtsAgg: { total: Number(dRow.total) || 0, thisWeek: Number(dRow.this_week) || 0 },
      recentLessons: (recentLessonRows || []).map((r) => ({ title: r.title, subject: r.subject, at: r.at })),
      journeyRows: journeyRows || [],
      calDays: (calendarRows || []).map((r) => ({ d: r.d, quizzes: Number(r.quizzes) || 0, xp: Number(r.xp) || 0, active: (Number(r.quizzes) || 0) > 0 || r.evt === true })),
      thisWeek: { quizzes: Number(twRow.quizzes) || 0, xp: Number(twRow.xp) || 0, correct: Number(twRow.correct) || 0, total: Number(twRow.total) || 0, activeDays: Number(twRow.active_days) || 0 },
      lastWeek: { quizzes: Number(lwRow.quizzes) || 0, xp: Number(lwRow.xp) || 0, correct: Number(lwRow.correct) || 0, total: Number(lwRow.total) || 0, activeDays: Number(lwRow.active_days) || 0 },
      lastActiveAt: (timeline[0] && timeline[0].at) || null,
    })

    // ── Parent insight (Phase 1) — a human summary from real signals only ─────────
    let parentInsight
    if (!hasAny) {
      parentInsight = `${first}'s learning insights will appear here once they start practising — we'll spot what's going well and what needs a little help.`
    } else {
      const bits = []
      if ((todayCell.quizzes || 0) > 0) bits.push(`${first} practised today`)
      else if (streak > 0) bits.push(`${first} is on a ${streak}-day streak`)
      else bits.push(`${first} has been learning recently`)
      if (strong.length) bits.push(`and is improving in ${strong[0].chapter || strong[0].subject}`)
      let s = bits.join(' ') + '.'
      if (weak.length) s += ` ${weak[0].chapter || weak[0].subject} still needs some revision.`
      s += ` ${recommendedNextStep.title} is recommended next.`
      parentInsight = s
    }

    // ── Action cards (Phase 2) — real-data-driven guidance for the parent ─────────
    const actionCards = [
      { id: 'mistakes', icon: 'alert', tone: 'peach', title: 'Review mistakes', subtitle: mistakes > 0 ? `${mistakes} open to revise` : 'All caught up 🎉', available: mistakes > 0 },
      { id: 'braingym', icon: 'dumbbell', tone: 'green', title: 'Encourage AI Gym', subtitle: (todayCell.quizzes || 0) > 0 ? 'Practised today ✓' : streak > 0 ? `Keep the ${streak}-day streak` : 'Build a daily habit', available: true },
      { id: 'weak', icon: 'target', tone: 'blue', title: 'Revisit a concept', subtitle: weak.length ? `${weak[0].chapter || weak[0].subject}` : 'No weak spots right now', available: weak.length > 0 },
      { id: 'ai-teacher', icon: 'spark', tone: 'violet', title: 'Ask the AI teacher', subtitle: 'Get help on any topic, anytime', available: true },
      { id: 'tutor', icon: 'video', tone: 'gold', title: 'Book a tutor session', subtitle: 'Coming soon', available: false, comingSoon: true },
    ]

    // Offline events carousel — every section is DB-driven (see seed-offline-events.js).
    const q = (sql) => db.$queryRawUnsafe(sql).catch(() => [])
    const [eventRows, storeRows, skillRows, galleryRows] = await Promise.all([
      q(`SELECT id::text AS id, title, duration, grades, city, badge, image_url, cta_label, cta_url, learn_label, learn_url, event_date, event_time, is_free FROM offline_events WHERE active ORDER BY position, id`),
      q(`SELECT id::text AS id, label, body, image_url FROM event_store_slides WHERE active ORDER BY position, id`),
      q(`SELECT id::text AS id, title, body, color, emoji FROM event_skills WHERE active ORDER BY position, id`),
      // name/rating land with the learner-story seed; fall back to photo-only rows
      // on a DB that has not run seed-offline-events.js yet.
      q(`SELECT id::text AS id, image_url, caption, name, rating FROM event_gallery WHERE active ORDER BY position, id`)
        .then((r) => (r.length ? r : q(`SELECT id::text AS id, image_url, caption FROM event_gallery WHERE active ORDER BY position, id`))),
    ])
    const eventsOut = eventRows.map((e) => ({
      id: e.id, title: e.title, duration: e.duration, grades: e.grades, city: e.city, badge: e.badge,
      image: e.image_url, ctaLabel: e.cta_label, ctaUrl: e.cta_url, learnLabel: e.learn_label, learnUrl: e.learn_url,
      date: e.event_date, time: e.event_time, free: e.is_free,
    }))
    const storeOut = storeRows.map((s) => ({ id: s.id, label: s.label, body: s.body, image: s.image_url }))
    const skillsOut = skillRows.map((s) => ({ id: s.id, title: s.title, body: s.body, color: s.color, emoji: s.emoji }))
    const galleryOut = galleryRows.map((g) => ({ id: g.id, image: g.image_url, caption: g.caption, name: g.name || null, rating: Number(g.rating) || 0 }))

    const payload = {
      linked: true,
      child: { id: child.id, name: child.name, firstName: first, className: sc.className, stream: sc.stream, board: sc.board, subjects: sc.subjects },
      brainGym: bg,
      arena: arenaOut,
      openMistakes: mistakes,
      leaderboard,
      today: { quizzes: todayCell.quizzes, xp: todayCell.xp },
      weeklyActivity,
      weakAreas: weak,
      improving: strong,
      recentActivity: timeline,
      suggestion,
      // Phase 1–5 intelligence (deterministic — no paid AI calls):
      parentInsight,
      actionCards,
      weeklySummary,
      learningTimeline,
      recommendedNextStep,
      // Premium learning-companion intelligence (all rule-based, real data only):
      aiTeacher: intel.aiTeacher,             // AI Teacher analytics
      learningJourney: intel.learningJourney, // weekly XP trend + totals
      achievements: intel.achievements,       // badges from real milestones
      weeklyGoals: intel.weeklyGoals,         // targets vs this week
      recommendations: intel.recommendations, // ranked smart recommendations
      calendar: intel.calendar,               // activity heatmap
      notifications: intel.notifications,     // notification center feed
      learningSummary: intel.learningSummary, // rule-based weekly summary
      growth: intel.growth,                   // this week vs last week
      // Future-ready flags — every one is a real backend switch. While false, the
      // client shows a "Coming soon" state instead of any fake data. Flip to true
      // once the matching backend ships (sessions, chat, classes, trial, events).
      events: eventsOut,
      eventStore: storeOut,
      eventSkills: skillsOut,
      eventGallery: galleryOut,
      features: { sessions: false, tutorChat: false, classes: false, trialBooking: false, events: eventsOut.length > 0 },
    }
    setCachedReport(childId, payload)
    return ApiResponse.success(res, payload)
  } catch (err) { next(err) }
}

// ─── Day view ────────────────────────────────────────────────────────────────
// GET /api/parent/progress/day?date=YYYY-MM-DD — everything the child actually did
// on ONE calendar day. Only real activity is returned: nothing happened → empty
// arrays, and the client shows its "No Activity" state. There is no daily target
// or plan behind this, so there is no "x of y" denominator to report.

const SKILL_LABEL = { fluency: 'Fluency', understanding: 'Understanding', application: 'Application', reasoning: 'Reasoning' }

// `date` names an IST calendar day; the DB stores UTC. Resolve the day to a UTC
// half-open range here rather than converting per-column in SQL — brain_gym_sessions
// stores a naive timestamp while the other tables are timestamptz, so a single SQL
// timezone expression cannot be correct for all of them.
const IST_OFFSET_MIN = 330
function istDayRangeUtc(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number)
  const startMs = Date.UTC(y, m - 1, d) - IST_OFFSET_MIN * 60000
  return { start: new Date(startMs).toISOString(), end: new Date(startMs + 86400000).toISOString() }
}

// Every source that counts as "the child did something on this day", and the column
// each one is bucketed on. This list must stay in step with progressDay: a day whose
// panel shows activity has to light its calendar dot too, otherwise a child who only
// takes tests looks idle all month.
// brain_gym_sessions stores a naive UTC timestamp; every other column is timestamptz,
// so the cast differs. Each is shifted to IST before being reduced to a date.
const ACTIVITY_SOURCES = [
  { table: '"brain_gym_sessions"', user: '"userId"', at: '"createdAt"', naive: true },
  { table: '"student_events"', user: '"userId"', at: '"createdAt"' },
  // One row per lesson, updated in place — so a lesson marks the last day it was
  // touched rather than every day it was worked on. Same caveat as progressDay.
  { table: '"lesson_progress"', user: '"userId"', at: '"updatedAt"' },
  { table: '"arena_matches"', user: '"userId"', at: '"createdAt"', where: "status = 'done'" },
  { table: '"mistake_book"', user: '"userId"', at: '"createdAt"' },
  { table: '"mock_test_attempts"', user: 'user_id', at: 'created_at' },
  // created_at, not updated_at: the table upserts on re-answer, and updated_at would
  // drag a question first answered weeks ago onto today.
  { table: '"mcq_attempts"', user: 'user_id', at: 'created_at' },
  { table: '"ot_attempts"', user: 'user_id', at: 'created_at' },
  { table: '"offline_test_attempts"', user: 'user_id', at: 'created_at' },
]

const istDateExpr = (s) => (s.naive
  ? `(((${s.at} AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata')::date)`
  : `((${s.at} AT TIME ZONE 'Asia/Kolkata')::date)`)
const tsCast = (s) => (s.naive ? 'timestamp' : 'timestamptz')
const andWhere = (s) => (s.where ? ` AND ${s.where}` : '')

async function progressDay(req, res, next) {
  try {
    const role = (req.scope && req.scope.role) || 'student'
    let childId
    if (role === 'parent') {
      childId = req.user.linked_student_id
      if (!childId) return ApiResponse.success(res, { linked: false })
    } else if (role === 'student') {
      childId = req.user.id
    } else {
      return ApiResponse.error(res, 'Only a parent or student account can view this.', 403)
    }

    const date = String(req.query.date || '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return ApiResponse.error(res, 'A date in YYYY-MM-DD form is required.', 422)
    const { start, end } = istDayRangeUtc(date)

    const [sessionRows, lessonRows, doubtRows, arenaRows, mistakeRows, mockRows, practiceRows,
      onlineRows, offlineRows] = await Promise.all([
      // Each BrainGym set, with the set's dominant topic when we can reach it.
      // The topic only resolves for AI-generated questions whose attempts carried a
      // sessionId — seed questions have no topic at all, so `topic` is often null and
      // the client falls back to the skill name.
      db.$queryRawUnsafe(
        `SELECT s.id, s.skill, s.level, s."correctCount" AS correct, s."totalQuestions" AS total,
                s."xpEarned" AS xp, s."timeTakenSec" AS time_sec, s."createdAt" AS at, t.topic
           FROM "brain_gym_sessions" s
           LEFT JOIN LATERAL (
             SELECT gq.topic
               FROM "question_attempts" qa
               JOIN "generated_questions" gq ON gq.id = qa."questionId"
              WHERE qa."sessionId" = s.id AND gq.topic <> ''
              GROUP BY gq.topic ORDER BY COUNT(*) DESC LIMIT 1
           ) t ON true
          WHERE s."userId" = $1::uuid AND s."createdAt" >= $2::timestamp AND s."createdAt" < $3::timestamp
          ORDER BY s."createdAt"`,
        childId, start, end,
      ).catch(() => []),
      // lesson_progress holds ONE row per lesson, updated in place — so a lesson only
      // appears on the last day it was touched, not on every day it was worked on.
      db.$queryRawUnsafe(
        `SELECT lp."lessonId" AS lesson_id, lp."slidesCompleted" AS done, lp."slidesTotal" AS total,
                lp."completedAt" AS completed_at, lp."updatedAt" AS at,
                l."lessonTitle" AS title, l.subject
           FROM "lesson_progress" lp
           LEFT JOIN "lessons" l ON l.id = lp."lessonId"
          WHERE lp."userId" = $1::uuid AND lp."updatedAt" >= $2::timestamptz AND lp."updatedAt" < $3::timestamptz
          ORDER BY lp."updatedAt"`,
        childId, start, end,
      ).catch(() => []),
      // Doubts are logged per question asked — roll them up per chapter so one study
      // session does not flood the day with near-identical rows.
      db.$queryRawUnsafe(
        `SELECT subject, chapter, COUNT(*)::int AS count, MAX("createdAt") AS at
           FROM "student_events"
          WHERE "userId" = $1::uuid AND type = 'doubt'
            AND "createdAt" >= $2::timestamptz AND "createdAt" < $3::timestamptz
          GROUP BY subject, chapter ORDER BY MAX("createdAt")`,
        childId, start, end,
      ).catch(() => []),
      // Arena, for this day only. Rating is a running value, so the day's movement is
      // the first match's "before" against the last match's "after".
      db.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS played,
                COUNT(*) FILTER (WHERE result = 'win')::int AS wins,
                COUNT(*) FILTER (WHERE result = 'loss')::int AS losses,
                COALESCE(SUM("xpEarned"), 0)::int AS xp,
                (array_agg("ratingBefore" ORDER BY "createdAt" ASC))[1]::int AS rating_before,
                (array_agg("ratingAfter" ORDER BY "createdAt" DESC))[1]::int AS rating_after
           FROM "arena_matches"
          WHERE "userId" = $1::uuid AND status = 'done'
            AND "createdAt" >= $2::timestamptz AND "createdAt" < $3::timestamptz`,
        childId, start, end,
      ).catch(() => []),
      // Questions that went into the Mistake Book on this day, grouped so the card can
      // name what to revise rather than just count.
      db.$queryRawUnsafe(
        `SELECT COALESCE(NULLIF(chapter, ''), NULLIF(concept, ''), subject) AS label,
                COUNT(*)::int AS count,
                COUNT(*) FILTER (WHERE status = 'unresolved')::int AS open
           FROM "mistake_book"
          WHERE "userId" = $1::uuid
            AND "createdAt" >= $2::timestamptz AND "createdAt" < $3::timestamptz
          GROUP BY 1 ORDER BY 2 DESC`,
        childId, start, end,
      ).catch(() => []),
      // Mock tests taken on this day. Scored server-side at submit time, so these
      // numbers are authoritative rather than client-reported.
      db.$queryRawUnsafe(
        `SELECT a.id, a.score, a.total, a.attempted, a.correct_count AS correct,
                a.wrong_count AS wrong, a.time_taken_sec AS time_sec, a.created_at AS at,
                t.name, t.subject
           FROM "mock_test_attempts" a
           LEFT JOIN "mock_tests" t ON t.id = a.test_id
          WHERE a.user_id = $1::uuid
            AND a.created_at >= $2::timestamptz AND a.created_at < $3::timestamptz
          ORDER BY a.created_at`,
        childId, start, end,
      ).catch(() => []),
      // MCQ practice is stored one row per question, so roll it up per subtopic —
      // otherwise a single 20-question set would fill the day with 20 rows.
      // Bucketed on created_at (first answered): the table upserts on re-answer, so
      // updated_at would drag an old question onto today.
      db.$queryRawUnsafe(
        `SELECT st.name AS subtopic, ch.name AS chapter, sub.name AS subject,
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE a.is_correct)::int AS correct,
                MAX(a.created_at) AS at
           FROM "mcq_attempts" a
           JOIN "subtopics" st ON st.id = a.subtopic_id
           JOIN "chapters" ch ON ch.id = st.chapter_id
           JOIN "subjects" sub ON sub.id = ch.subject_id
          WHERE a.user_id = $1::uuid
            AND a.created_at >= $2::timestamptz AND a.created_at < $3::timestamptz
          GROUP BY st.id, st.name, ch.name, sub.name
          ORDER BY MAX(a.created_at)`,
        childId, start, end,
      ).catch(() => []),
      // Online tests, also scored server-side at submit time.
      db.$queryRawUnsafe(
        `SELECT a.id, a.total, a.attempted, a.correct_count AS correct, a.wrong_count AS wrong,
                a.score, a.time_taken_sec AS time_sec, a.created_at AS at,
                t.name, t.subject_name AS subject, t.chapter_name AS chapter
           FROM "ot_attempts" a
           LEFT JOIN "ot_tests" t ON t.id = a.ot_test_id
          WHERE a.user_id = $1::uuid
            AND a.created_at >= $2::timestamptz AND a.created_at < $3::timestamptz
          ORDER BY a.created_at`,
        childId, start, end,
      ).catch(() => []),
      // Online tests taken from the app's bundled bank (Classes 10/11/12). Also
      // graded server-side, but graded_count can be 0 when no answer key exists for
      // that subject — the client must not present those as a real score.
      db.$queryRawUnsafe(
        `SELECT id, class_level, subject, chapter, test_label, total, attempted,
                correct_count AS correct, wrong_count AS wrong, graded_count AS graded,
                time_taken_sec AS time_sec, created_at AS at
           FROM "offline_test_attempts"
          WHERE user_id = $1::uuid
            AND created_at >= $2::timestamptz AND created_at < $3::timestamptz
          ORDER BY created_at`,
        childId, start, end,
      ).catch(() => []),
    ])

    const workout = (sessionRows || []).map((r) => {
      const total = Number(r.total) || 0
      const correct = Number(r.correct) || 0
      return {
        id: r.id,
        skill: r.skill,
        skillLabel: SKILL_LABEL[r.skill] || r.skill,
        topic: r.topic || null,
        correct,
        total,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : null,
        xp: Number(r.xp) || 0,
        timeSec: Number(r.time_sec) || 0,
        at: r.at,
      }
    })

    const lessons = (lessonRows || []).map((r) => ({
      lessonId: r.lesson_id,
      title: r.title || 'Lesson',
      subject: r.subject || null,
      slidesDone: Number(r.done) || 0,
      slidesTotal: Number(r.total) || 0,
      completed: !!r.completed_at,
      at: r.at,
    }))

    const mockTests = (mockRows || []).map((r) => ({
      id: r.id,
      name: r.name || 'Mock test',
      subject: r.subject || null,
      correct: Number(r.correct) || 0,
      wrong: Number(r.wrong) || 0,
      attempted: Number(r.attempted) || 0,
      total: Number(r.total) || 0,
      score: Number(r.score) || 0,
      timeSec: Number(r.time_sec) || 0,
      at: r.at,
    }))

    const onlineTests = (onlineRows || []).map((r) => ({
      id: Number(r.id),
      name: r.name || 'Online test',
      subject: r.subject || null,
      chapter: r.chapter || null,
      correct: Number(r.correct) || 0,
      wrong: Number(r.wrong) || 0,
      attempted: Number(r.attempted) || 0,
      total: Number(r.total) || 0,
      // ot_tests questions always carry an answer key, so everything attempted is graded.
      graded: Number(r.attempted) || 0,
      score: Number(r.score) || 0,
      timeSec: Number(r.time_sec) || 0,
      at: r.at,
    }))

    // Both online-test sources land in one list — a parent has no reason to care
    // which bank the questions came from.
    const offlineTests = (offlineRows || []).map((r) => ({
      id: `off-${r.id}`,
      name: r.chapter || 'Online test',
      subject: r.subject || null,
      chapter: null,
      correct: Number(r.correct) || 0,
      wrong: Number(r.wrong) || 0,
      attempted: Number(r.attempted) || 0,
      total: Number(r.total) || 0,
      graded: Number(r.graded) || 0,
      timeSec: Number(r.time_sec) || 0,
      at: r.at,
    }))

    const practice = (practiceRows || []).map((r) => {
      const total = Number(r.total) || 0
      const c = Number(r.correct) || 0
      return {
        subtopic: r.subtopic || null,
        chapter: r.chapter || null,
        subject: r.subject || null,
        correct: c,
        total,
        accuracy: total > 0 ? Math.round((c / total) * 100) : null,
        at: r.at,
      }
    })

    const doubts = (doubtRows || []).map((r) => ({
      subject: r.subject || null,
      chapter: r.chapter || null,
      count: Number(r.count) || 0,
      at: r.at,
    }))

    // BrainGym rolled up for the day — the same numbers as the all-time widget, but
    // scoped to this date.
    const correct = workout.reduce((n, w) => n + w.correct, 0)
    const questions = workout.reduce((n, w) => n + w.total, 0)
    const brainGym = {
      sets: workout.length,
      correct,
      questions,
      accuracy: questions > 0 ? Math.round((correct / questions) * 100) : null,
      xp: workout.reduce((n, w) => n + w.xp, 0),
      timeSec: workout.reduce((n, w) => n + w.timeSec, 0),
    }

    const a = (arenaRows && arenaRows[0]) || {}
    const played = Number(a.played) || 0
    const arenaDay = {
      played,
      wins: Number(a.wins) || 0,
      losses: Number(a.losses) || 0,
      xp: Number(a.xp) || 0,
      ratingDelta: played > 0 ? (Number(a.rating_after) || 0) - (Number(a.rating_before) || 0) : 0,
    }

    const mItems = (mistakeRows || []).map((r) => ({
      label: r.label || 'Practice',
      count: Number(r.count) || 0,
      open: Number(r.open) || 0,
    }))
    const mistakesDay = {
      added: mItems.reduce((n, m) => n + m.count, 0),
      open: mItems.reduce((n, m) => n + m.open, 0),
      items: mItems.slice(0, 3),
    }

    return ApiResponse.success(res, {
      linked: true,
      date,
      workout,
      lessons,
      doubts,
      mockTests,
      onlineTests: [...onlineTests, ...offlineTests].sort((a, b) => new Date(a.at) - new Date(b.at)),
      practice,
      brainGym,
      arena: arenaDay,
      mistakes: mistakesDay,
      totals: {
        activities: workout.length + lessons.length + doubts.length + mockTests.length
          + onlineTests.length + offlineTests.length + practice.length + played,
        practiceSec: brainGym.timeSec
          + mockTests.reduce((n, m) => n + m.timeSec, 0)
          + onlineTests.reduce((n, o) => n + o.timeSec, 0)
          + offlineTests.reduce((n, o) => n + o.timeSec, 0),
        xp: brainGym.xp + arenaDay.xp,
      },
    })
  } catch (err) { next(err) }
}

// GET /api/parent/progress/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive)
// Which days in the visible range had ANY activity — the dots under the date strip
// and the month grid. Deliberately range-based rather than month-based: a week strip
// can straddle two months, and the month grid shows leading/trailing days too.
// Days are bucketed by IST, matching progressDay.
async function progressCalendar(req, res, next) {
  try {
    const role = (req.scope && req.scope.role) || 'student'
    let childId
    if (role === 'parent') {
      childId = req.user.linked_student_id
      if (!childId) return ApiResponse.success(res, { linked: false })
    } else if (role === 'student') {
      childId = req.user.id
    } else {
      return ApiResponse.error(res, 'Only a parent or student account can view this.', 403)
    }

    const from = String(req.query.from || '').trim()
    const to = String(req.query.to || '').trim()
    const ok = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s)
    if (!ok(from) || !ok(to)) return ApiResponse.error(res, 'from and to dates in YYYY-MM-DD form are required.', 422)
    if (from > to) return ApiResponse.error(res, 'from must not be after to.', 422)
    // Guard the window so a crafted range cannot ask for years of scanning.
    if ((Date.parse(to) - Date.parse(from)) / 86400000 > 400) return ApiResponse.error(res, 'Range is too large.', 422)

    const start = istDayRangeUtc(from).start
    const end = istDayRangeUtc(to).end

    // One query per source rather than a single UNION: the attempt tables ship as plain
    // SQL files, so a deployment that has not run them yet would otherwise fail the
    // whole statement and blank every dot on the calendar. Here a missing table just
    // drops out.
    const dayRows = await Promise.all(ACTIVITY_SOURCES.map((s) => db.$queryRawUnsafe(
      `SELECT DISTINCT to_char(${istDateExpr(s)}, 'YYYY-MM-DD') AS key
         FROM ${s.table}
        WHERE ${s.user} = $1::uuid
          AND ${s.at} >= $2::${tsCast(s)} AND ${s.at} < $3::${tsCast(s)}${andWhere(s)}`,
      childId, start, end,
    ).catch(() => [])))
    const days = [...new Set(dayRows.flat().map((r) => r.key).filter(Boolean))].sort()

    // The child's very first activity, in IST. The month picker runs from this month
    // up to the current one — so past years stay reachable and future months only
    // appear once they actually arrive.
    const firstRows = await Promise.all(ACTIVITY_SOURCES.map((s) => db.$queryRawUnsafe(
      `SELECT to_char(min(${istDateExpr(s)}), 'YYYY-MM-DD') AS first
         FROM ${s.table} WHERE ${s.user} = $1::uuid${andWhere(s)}`,
      childId,
    ).catch(() => [])))
    const firstActivity = firstRows.flat().map((r) => r && r.first).filter(Boolean).sort()[0] || null

    return ApiResponse.success(res, {
      linked: true,
      from,
      to,
      days,
      firstActivity,
    })
  } catch (err) { next(err) }
}

module.exports = { linkChild, report, progressDay, progressCalendar }
