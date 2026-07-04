'use strict'

// Parent intelligence — turns the child's REAL learning signals (BrainGym, Arena,
// AI-Teacher lessons/doubts, mistakes, memory) into parent-facing blocks. Pure and
// deterministic (rule-based, no paid AI calls, no DB): the controller gathers the
// raw rows and hands them here, so this is trivially unit-testable. NEVER fabricates
// data — every number traces back to a real row; missing data yields empty/zero.

const WEEKLY_TARGETS = { activeDays: 4, quizzes: 5, xp: 100 }

const fmtDay = (d) => {
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const x = new Date(d)
  return `${M[x.getMonth()]} ${x.getDate()}`
}
const acc = (correct, total) => (total > 0 ? Math.round((correct / total) * 100) : null)
const dir = (v, p) => (v > p ? 'up' : v < p ? 'down' : 'flat')

// ── Phase 4: achievements (badges from real milestones) ─────────────────────────
function buildAchievements({ quizzes, xp, streak, accuracy, lessons, doubts, arenaWins }) {
  const defs = [
    { id: 'first_quiz', icon: 'sparkle', title: 'First steps', desc: 'Completed the first quiz', at: quizzes, goal: 1 },
    { id: 'ten_quizzes', icon: 'dumbbell', title: 'Getting stronger', desc: '10 quizzes done', at: quizzes, goal: 10 },
    { id: 'xp_100', icon: 'zap', title: 'Century', desc: 'Earned 100 XP', at: xp, goal: 100 },
    { id: 'xp_500', icon: 'trophy', title: 'High scorer', desc: 'Earned 500 XP', at: xp, goal: 500 },
    { id: 'streak_3', icon: 'flame', title: 'On a roll', desc: '3-day streak', at: streak, goal: 3 },
    { id: 'streak_7', icon: 'flame', title: 'Unstoppable', desc: '7-day streak', at: streak, goal: 7 },
    { id: 'sharp', icon: 'target', title: 'Sharp shooter', desc: '80%+ accuracy', at: accuracy >= 80 && quizzes >= 3 ? 1 : 0, goal: 1 },
    { id: 'first_lesson', icon: 'book', title: 'Curious mind', desc: 'Watched a lesson', at: lessons, goal: 1 },
    { id: 'inquisitive', icon: 'message', title: 'Great questions', desc: 'Asked 5 doubts', at: doubts, goal: 5 },
    { id: 'arena_win', icon: 'swords', title: 'Champion', desc: 'Won an Arena match', at: arenaWins, goal: 1 },
  ]
  const items = defs.map((d) => ({
    id: d.id, icon: d.icon, title: d.title, desc: d.desc,
    unlocked: d.at >= d.goal,
    progress: Math.max(0, Math.min(1, d.goal ? d.at / d.goal : 0)),
  }))
  return { total: items.length, unlockedCount: items.filter((i) => i.unlocked).length, items }
}

// ── Phase 5: weekly goals ───────────────────────────────────────────────────────
function buildWeeklyGoals(weeklySummary) {
  const s = weeklySummary || { activeDays: 0, quizzes: 0, xp: 0 }
  const goals = [
    { id: 'active', label: 'Active days', value: s.activeDays || 0, target: WEEKLY_TARGETS.activeDays, unit: 'days' },
    { id: 'quizzes', label: 'Quizzes', value: s.quizzes || 0, target: WEEKLY_TARGETS.quizzes, unit: '' },
    { id: 'xp', label: 'XP', value: s.xp || 0, target: WEEKLY_TARGETS.xp, unit: 'XP' },
  ].map((g) => ({ ...g, pct: Math.max(0, Math.min(1, g.target ? g.value / g.target : 0)), done: g.value >= g.target }))
  const overall = Math.round((goals.reduce((a, g) => a + g.pct, 0) / goals.length) * 100)
  return { goals, overall, metCount: goals.filter((g) => g.done).length }
}

// ── Phase 6: smart recommendations (ranked, explanatory) ────────────────────────
function buildRecommendations({ first, quizzes, mistakes, weak, streak, accuracy, lessons, todayQuizzes }) {
  const recs = []
  if (quizzes === 0) recs.push({ id: 'start', icon: 'dumbbell', tone: 'green', title: 'Start the first set', why: `${first} hasn't practised yet.`, do: 'A 5-minute AI Gym set builds the habit.' })
  if (mistakes > 0) recs.push({ id: 'mistakes', icon: 'alert', tone: 'peach', title: 'Clear the Mistake Book', why: `${mistakes} question${mistakes > 1 ? 's' : ''} still open.`, do: 'Redo a couple together today.' })
  if (weak && weak.length) recs.push({ id: 'weak', icon: 'target', tone: 'blue', title: `Revisit ${weak[0]}`, why: 'This concept needs reinforcement.', do: 'Ask the AI teacher to re-explain it.' })
  if (quizzes > 0 && streak === 0 && todayQuizzes === 0) recs.push({ id: 'streak', icon: 'flame', tone: 'gold', title: 'Restart the streak', why: 'No practice logged today.', do: 'One quick set keeps momentum going.' })
  if (lessons === 0) recs.push({ id: 'lesson', icon: 'book', tone: 'violet', title: 'Try an AI Teacher lesson', why: 'Guided lessons explain concepts step by step.', do: `Explore a topic ${first} finds tricky.` })
  if (accuracy >= 80 && quizzes >= 3) recs.push({ id: 'arena', icon: 'swords', tone: 'blue', title: 'Level up in Arena', why: `Accuracy is strong at ${accuracy}%.`, do: 'A harder challenge keeps it exciting.' })
  return recs.slice(0, 3)
}

// ── Phase 8: notification center (real events → parent-friendly cards) ───────────
function buildNotifications({ first, streak, mistakes, weak, strong, todayQuizzes, lessonsThisWeek, doubtsThisWeek, lastActiveAt }) {
  const n = []
  if ([3, 7, 14, 30, 50, 100].includes(streak)) n.push({ id: 'streak', tone: 'gold', icon: 'flame', title: `${streak}-day streak! 🔥`, body: `${first} has practised ${streak} days in a row.` })
  if (strong && strong.length) n.push({ id: 'improve', tone: 'green', icon: 'trending', title: 'Great progress', body: `${first} is improving in ${strong[0]}.` })
  if (lessonsThisWeek > 0) n.push({ id: 'lessons', tone: 'violet', icon: 'book', title: 'Lessons watched', body: `${lessonsThisWeek} AI Teacher lesson${lessonsThisWeek > 1 ? 's' : ''} this week.` })
  if (doubtsThisWeek > 0) n.push({ id: 'doubts', tone: 'blue', icon: 'message', title: 'Curious this week', body: `${first} asked ${doubtsThisWeek} question${doubtsThisWeek > 1 ? 's' : ''} to the AI teacher.` })
  if (mistakes > 0) n.push({ id: 'mistakes', tone: 'peach', icon: 'alert', title: 'Mistakes to review', body: `${mistakes} question${mistakes > 1 ? 's' : ''} waiting in the Mistake Book.` })
  if (weak && weak.length) n.push({ id: 'weak', tone: 'peach', icon: 'target', title: 'Needs a little help', body: `${weak[0]} could use more practice.` })
  if (todayQuizzes === 0 && lastActiveAt) n.push({ id: 'nudge', tone: 'blue', icon: 'clock', title: 'No practice yet today', body: `A quick set keeps ${first}'s streak alive.` })
  return { unread: n.length, items: n.slice(0, 6) }
}

// ── Phase 9: AI-generated learning summary (rule-based) ─────────────────────────
function buildLearningSummary({ first, weeklySummary, improving, weak, recommendation, hasAny }) {
  if (!hasAny) return `${first} hasn't started practising yet. Once they do, you'll get a weekly summary of what's going well and what to focus on.`
  const s = weeklySummary || {}
  const days = s.activeDays || 0
  const q = s.quizzes || 0
  let out = ''
  if (q > 0) {
    out += `This week, ${first} practised on ${days} day${days === 1 ? '' : 's'}, completed ${q} quiz${q === 1 ? '' : 'zes'}`
    out += s.xp ? ` and earned ${s.xp} XP` : ''
    out += s.accuracy != null ? ` at ${s.accuracy}% accuracy. ` : '. '
  } else {
    out += `${first} hasn't practised yet this week. `
  }
  if (improving && improving.length) out += `They're getting stronger in ${improving.slice(0, 2).join(' and ')}. `
  if (weak && weak.length) out += `${weak.slice(0, 2).join(' and ')} could use more practice. `
  if (recommendation) out += recommendation
  return out.trim()
}

// ── Phase 10: child growth (this week vs last week) ─────────────────────────────
function buildGrowth({ first, thisWeek, lastWeek }) {
  const tw = thisWeek || {}; const lw = lastWeek || {}
  const twAcc = acc(tw.correct, tw.total); const lwAcc = acc(lw.correct, lw.total)
  const items = [
    { id: 'quizzes', label: 'Quizzes', value: tw.quizzes || 0, prev: lw.quizzes || 0, unit: '', dir: dir(tw.quizzes || 0, lw.quizzes || 0) },
    { id: 'accuracy', label: 'Accuracy', value: twAcc, prev: lwAcc, unit: '%', dir: dir(twAcc || 0, lwAcc || 0) },
    { id: 'xp', label: 'XP', value: tw.xp || 0, prev: lw.xp || 0, unit: '', dir: dir(tw.xp || 0, lw.xp || 0) },
    { id: 'active', label: 'Active days', value: tw.activeDays || 0, prev: lw.activeDays || 0, unit: '', dir: dir(tw.activeDays || 0, lw.activeDays || 0) },
  ]
  let headline
  if ((lw.quizzes || 0) === 0 && (tw.quizzes || 0) === 0) headline = `A fresh week — encourage ${first} to get started.`
  else if (twAcc != null && lwAcc != null && twAcc > lwAcc) headline = `Accuracy is up ${twAcc - lwAcc}% vs last week — nice progress! 📈`
  else if ((tw.quizzes || 0) > (lw.quizzes || 0)) headline = `More practice than last week — momentum is building.`
  else if ((tw.quizzes || 0) < (lw.quizzes || 0) && (lw.quizzes || 0) > 0) headline = `A little quieter than last week — a gentle nudge helps.`
  else headline = `Steady week — keeping the routine going.`
  return { headline, items }
}

// ── Phase 1: AI Teacher analytics ───────────────────────────────────────────────
function buildAiTeacher({ lessons, lessonsThisWeek, subjectsCovered, doubts, doubtsThisWeek, recentLessons }) {
  return {
    lessons: lessons || 0,
    lessonsThisWeek: lessonsThisWeek || 0,
    subjectsCovered: subjectsCovered || 0,
    doubtsAsked: doubts || 0,
    doubtsThisWeek: doubtsThisWeek || 0,
    recentLessons: (recentLessons || []).map((l) => ({ title: l.title, subject: l.subject || null, at: l.at })),
  }
}

// ── Phase 3: learning journey (weekly XP trend + totals) ────────────────────────
function buildJourney({ journeyRows, totalXp, totalQuizzes, totalLessons, streak }) {
  const weeks = (journeyRows || []).map((r) => ({ label: fmtDay(r.wk), xp: Number(r.xp) || 0, quizzes: Number(r.quizzes) || 0 }))
  return { weeks, totalXp: totalXp || 0, totalQuizzes: totalQuizzes || 0, totalLessons: totalLessons || 0, streak: streak || 0 }
}

// ── Phase 7: activity calendar (last 5 weeks heatmap, per-day quizzes/XP) ────────
function buildCalendar({ calDays }) {
  const map = {}
  for (const r of (calDays || [])) {
    map[new Date(r.d).toISOString().slice(0, 10)] = { quizzes: r.quizzes || 0, xp: r.xp || 0, active: !!r.active }
  }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  // Align to a Sun→Sat grid ending this week (5 weeks = 35 cells).
  const end = new Date(today); end.setDate(today.getDate() + (6 - today.getDay()))
  const days = []
  let activeCount = 0
  for (let i = 34; i >= 0; i--) {
    const d = new Date(end); d.setDate(end.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const s = map[key] || { quizzes: 0, xp: 0, active: false }
    if (s.active) activeCount += 1
    days.push({
      date: d.getDate(), key, active: s.active, quizzes: s.quizzes, xp: s.xp,
      isToday: d.getTime() === today.getTime(), isFuture: d.getTime() > today.getTime(),
    })
  }
  return { days, activeCount }
}

// Assemble every block from the raw context the controller gathered.
function buildIntelligence(ctx) {
  const {
    first, bg, arena, mistakes, weakChapters, strongChapters, weeklySummary,
    todayQuizzes, recommendationText, lessonAgg, doubtsAgg, recentLessons,
    journeyRows, calDays, thisWeek, lastWeek, lastActiveAt,
  } = ctx

  const weak = (weakChapters || []).map((w) => w.chapter || w.subject).filter(Boolean)
  const strong = (strongChapters || []).map((s) => s.chapter || s.subject).filter(Boolean)
  const quizzes = Number(bg.quizzesCompleted) || 0
  const xp = Number(bg.totalXp) || 0
  const streak = Number(bg.currentStreak) || 0
  const accuracy = Number(bg.accuracy) || 0
  const hasAny = quizzes > 0 || (lessonAgg && lessonAgg.total > 0) || (doubtsAgg && doubtsAgg.total > 0)

  return {
    aiTeacher: buildAiTeacher({
      lessons: lessonAgg && lessonAgg.total, lessonsThisWeek: lessonAgg && lessonAgg.thisWeek,
      subjectsCovered: lessonAgg && lessonAgg.subjects, doubts: doubtsAgg && doubtsAgg.total,
      doubtsThisWeek: doubtsAgg && doubtsAgg.thisWeek, recentLessons,
    }),
    learningJourney: buildJourney({ journeyRows, totalXp: xp, totalQuizzes: quizzes, totalLessons: lessonAgg && lessonAgg.total, streak }),
    achievements: buildAchievements({ quizzes, xp, streak, accuracy, lessons: (lessonAgg && lessonAgg.total) || 0, doubts: (doubtsAgg && doubtsAgg.total) || 0, arenaWins: (arena && arena.wins) || 0 }),
    weeklyGoals: buildWeeklyGoals(weeklySummary),
    recommendations: buildRecommendations({ first, quizzes, mistakes, weak, streak, accuracy, lessons: (lessonAgg && lessonAgg.total) || 0, todayQuizzes }),
    calendar: buildCalendar({ calDays }),
    notifications: buildNotifications({ first, streak, mistakes, weak, strong, todayQuizzes, lessonsThisWeek: (lessonAgg && lessonAgg.thisWeek) || 0, doubtsThisWeek: (doubtsAgg && doubtsAgg.thisWeek) || 0, lastActiveAt }),
    learningSummary: buildLearningSummary({ first, weeklySummary, improving: strong, weak, recommendation: recommendationText, hasAny }),
    growth: buildGrowth({ first, thisWeek, lastWeek }),
  }
}

module.exports = { buildIntelligence, WEEKLY_TARGETS }
