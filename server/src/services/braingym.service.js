'use strict'

const db = require('../config/database')

const XP_PER_CORRECT = 10
const SKILLS = ['reasoning', 'application', 'understanding', 'fluency']

// NOTE: questions are local to the frontend (src/data/brainGymQuestions.js).
// The backend only stores results and aggregates progress.

function clampLevel(level) {
  const n = parseInt(level, 10)
  return n >= 1 && n <= 3 ? n : 1
}

function normalizeSkill(skill) {
  return SKILLS.includes(skill) ? skill : 'reasoning'
}

// ─── Save a result ────────────────────────────────────────────────────────────
async function saveResult({ userId, skill, level, totalQuestions, correctCount, wrongCount, timeTakenSec }) {
  const lvl = clampLevel(level)
  const total = Math.max(0, parseInt(totalQuestions, 10) || 0)
  let correct = Math.max(0, parseInt(correctCount, 10) || 0)
  let wrong = Math.max(0, parseInt(wrongCount, 10) || 0)
  if (correct > total) correct = total
  if (wrong > total) wrong = total
  if (correct + wrong > total) wrong = Math.max(0, total - correct)

  const xpEarned = correct * XP_PER_CORRECT

  const session = await db.brainGymSession.create({
    data: {
      userId,
      skill: normalizeSkill(skill),
      level: lvl,
      totalQuestions: total,
      correctCount: correct,
      wrongCount: wrong,
      score: correct,
      xpEarned,
      timeTakenSec: Math.max(0, parseInt(timeTakenSec, 10) || 0),
    },
  })

  return { session, xpEarned }
}

// ─── Progress aggregation ──────────────────────────────────────────────────────
function computeStreak(dates) {
  if (!dates.length) return 0
  const days = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)))
  const key = (d) => d.toISOString().slice(0, 10)

  const cursor = new Date()
  // The streak may start today or yesterday.
  if (!days.has(key(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(key(cursor))) return 0
  }
  let streak = 0
  while (days.has(key(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

async function getProgress(userId) {
  const sessions = await db.brainGymSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, skill: true, level: true, score: true,
      totalQuestions: true, correctCount: true, xpEarned: true, createdAt: true,
    },
  })

  const totalXp = sessions.reduce((a, s) => a + s.xpEarned, 0)
  const quizzesCompleted = sessions.length
  const totalCorrect = sessions.reduce((a, s) => a + s.correctCount, 0)
  const totalQuestions = sessions.reduce((a, s) => a + s.totalQuestions, 0)
  const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const currentStreak = computeStreak(sessions.map((s) => s.createdAt))

  const recent = sessions.slice(0, 10).map((s) => ({
    id: s.id,
    skill: s.skill,
    level: s.level,
    score: s.score,
    totalQuestions: s.totalQuestions,
    xpEarned: s.xpEarned,
    createdAt: s.createdAt,
  }))

  return { totalXp, quizzesCompleted, totalCorrect, totalQuestions, accuracy, currentStreak, recent }
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function startOfPeriod(period) {
  const now = new Date()
  if (period === 'weekly') {
    const d = new Date(now)
    const dow = (d.getUTCDay() + 6) % 7 // Monday = 0
    d.setUTCDate(d.getUTCDate() - dow)
    d.setUTCHours(0, 0, 0, 0)
    return d
  }
  if (period === 'monthly') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  }
  return null // all-time
}

// Ranking is total XP only. Quizzes / accuracy / streak do not affect rank.
async function getLeaderboard({ period = 'all', userId, limit = 50 }) {
  const start = startOfPeriod(period)
  const where = start ? { createdAt: { gte: start } } : {}

  const grouped = await db.brainGymSession.groupBy({
    by: ['userId'],
    where,
    _sum: { xpEarned: true, correctCount: true, totalQuestions: true },
    _count: { _all: true },
  })

  const entries = grouped.map((g) => {
    const xp = g._sum.xpEarned || 0
    const correct = g._sum.correctCount || 0
    const total = g._sum.totalQuestions || 0
    const quizzes = g._count._all || 0
    const accuracy = total ? Math.round((correct / total) * 100) : 0
    return { userId: g.userId, xp, quizzes, accuracy }
  })
  // Sort by total XP descending only.
  entries.sort((a, b) => b.xp - a.xp)
  entries.forEach((e, i) => { e.rank = i + 1 })

  const ids = new Set(entries.slice(0, limit).map((e) => e.userId))
  ids.add(userId)
  const users = await db.user.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, name: true, grade: true },
  })
  const byId = Object.fromEntries(users.map((u) => [u.id, u]))
  const decorate = (e) => ({
    rank: e.rank,
    userId: e.userId,
    name: byId[e.userId]?.name || 'Student',
    grade: byId[e.userId]?.grade || null,
    xp: e.xp,
    quizzes: e.quizzes,
    accuracy: e.accuracy,
    isMe: e.userId === userId,
  })

  const top = entries.slice(0, limit).map(decorate)
  const meEntry = entries.find((e) => e.userId === userId)
  const me = meEntry
    ? decorate(meEntry)
    : { rank: null, userId, name: byId[userId]?.name || 'You', grade: byId[userId]?.grade || null, xp: 0, quizzes: 0, accuracy: 0, isMe: true }

  return { period, totalPlayers: entries.length, me, top }
}

module.exports = { saveResult, getProgress, getLeaderboard, SKILLS, XP_PER_CORRECT }
