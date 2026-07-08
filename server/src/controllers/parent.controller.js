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

    return ApiResponse.success(res, {
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
      features: { sessions: false, tutorChat: false, classes: false, trialBooking: false, events: false },
    })
  } catch (err) { next(err) }
}

module.exports = { linkChild, report }
