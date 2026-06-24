'use strict'

const db = require('../config/database')
const progress = require('./progress.service')

// Student Memory — per-chapter aggregates + an event log. Raw SQL (no model
// accessors), so it needs no Prisma client regeneration. userId is stored loosely
// (no FK) and a bad/non-uuid id simply no-ops via the caller's try/catch.

// Record one learning signal: 'doubt' (engagement), 'mistake', or 'quiz' result.
async function recordEvent({ userId, type, subject, chapter, detail }) {
  const ch = (chapter || '').trim()
  const delta = { doubts: 0, mistakes: 0, quizCorrect: 0, quizTotal: 0 }
  if (type === 'doubt') delta.doubts = 1
  else if (type === 'mistake') delta.mistakes = 1
  else if (type === 'quiz') { delta.quizTotal = 1; delta.quizCorrect = detail && detail.correct ? 1 : 0 }

  await db.$executeRaw`
    INSERT INTO student_events ("userId", type, subject, chapter, detail)
    VALUES (${userId}::uuid, ${type}, ${subject || null}, ${chapter || null}, ${JSON.stringify(detail || {})}::jsonb)`

  if (subject) {
    await db.$executeRaw`
      INSERT INTO student_memory ("userId", subject, chapter, doubts, mistakes, "quizCorrect", "quizTotal", "lastSeen", "updatedAt")
      VALUES (${userId}::uuid, ${subject}, ${ch}, ${delta.doubts}, ${delta.mistakes}, ${delta.quizCorrect}, ${delta.quizTotal}, now(), now())
      ON CONFLICT ("userId", subject, chapter) DO UPDATE SET
        doubts        = student_memory.doubts + ${delta.doubts},
        mistakes      = student_memory.mistakes + ${delta.mistakes},
        "quizCorrect" = student_memory."quizCorrect" + ${delta.quizCorrect},
        "quizTotal"   = student_memory."quizTotal" + ${delta.quizTotal},
        "lastSeen"    = now(),
        "updatedAt"   = now()`
  }
  return { ok: true }
}

// Weakness score: mistakes and wrong quiz answers hurt most; doubts are a mild
// signal; correct answers reduce it. Higher = weaker = revise sooner.
const WEAKNESS_SQL = `(mistakes * 2 + ("quizTotal" - "quizCorrect") * 2 + doubts * 1 - "quizCorrect" * 0.5)`

async function getWeakChapters(userId, { subject, limit = 5 } = {}) {
  // WEAKNESS_SQL is a fixed constant (no user input), so $queryRawUnsafe is safe;
  // userId/limit/subject are bound as parameters.
  const sql =
    `SELECT subject, chapter, doubts, mistakes, "quizCorrect", "quizTotal",
            ${WEAKNESS_SQL} AS weakness,
            CASE WHEN "quizTotal" > 0 THEN round("quizCorrect"::numeric / "quizTotal", 2) ELSE NULL END AS accuracy
     FROM student_memory
     WHERE "userId" = $1::uuid AND chapter <> ''` + (subject ? ' AND subject = $3' : '') + `
     ORDER BY weakness DESC LIMIT $2`
  const params = subject ? [userId, limit, subject] : [userId, limit]
  const rows = await db.$queryRawUnsafe(sql, ...params)
  return rows.map((r) => ({
    subject: r.subject, chapter: r.chapter,
    doubts: Number(r.doubts), mistakes: Number(r.mistakes),
    quizCorrect: Number(r.quizCorrect), quizTotal: Number(r.quizTotal),
    accuracy: r.accuracy != null ? Number(r.accuracy) : null,
    weakness: Math.round(Number(r.weakness) * 10) / 10,
  }))
}

// One chapter's record for this student (used to auto-pick quiz difficulty).
async function getChapterStat(userId, subject, chapter) {
  if (!userId || !subject || !chapter) return null
  const rows = await db.$queryRaw`
    SELECT doubts, mistakes, "quizCorrect", "quizTotal"
    FROM student_memory WHERE "userId" = ${userId}::uuid AND subject = ${subject} AND chapter = ${chapter}`
  if (!rows.length) return null
  const r = rows[0]
  const quizTotal = Number(r.quizTotal)
  return {
    doubts: Number(r.doubts), mistakes: Number(r.mistakes),
    quizCorrect: Number(r.quizCorrect), quizTotal,
    accuracy: quizTotal > 0 ? Number(r.quizCorrect) / quizTotal : null,
  }
}

// ── Preferred language ────────────────────────────────────────────────────────
// Remember the language the student MOSTLY uses (rolling counts), so the teacher
// can greet/address them in it even when a single message is ambiguous ("hi").
const LANG_COL = { en: 'langEn', hi: 'langHi', hinglish: 'langHing' }

async function recordLanguage(userId, language) {
  if (!userId || !LANG_COL[language]) return
  const col = LANG_COL[language] // fixed whitelist → safe to inline
  await db.$executeRawUnsafe(
    `INSERT INTO student_prefs ("userId", "${col}", language, "updatedAt")
     VALUES ($1::uuid, 1, $2, now())
     ON CONFLICT ("userId") DO UPDATE SET "${col}" = student_prefs."${col}" + 1, "updatedAt" = now()`,
    userId, language,
  )
  // Recompute the dominant language (most-used wins; ties favour the richer mix).
  await db.$executeRawUnsafe(
    `UPDATE student_prefs SET language = CASE
       WHEN "langHing" >= "langHi" AND "langHing" >= "langEn" AND "langHing" > 0 THEN 'hinglish'
       WHEN "langHi" >= "langEn" AND "langHi" > 0 THEN 'hi'
       ELSE 'en' END
     WHERE "userId" = $1::uuid`, userId,
  )
}

async function getPreferredLanguage(userId) {
  if (!userId) return null
  const rows = await db.$queryRaw`SELECT language FROM student_prefs WHERE "userId" = ${userId}::uuid`
  return rows.length ? (rows[0].language || null) : null
}

// Consecutive days (ending today or yesterday) with any learning activity.
async function getLearningStreak(userId) {
  const rows = await db.$queryRaw`
    SELECT DISTINCT (("createdAt" AT TIME ZONE 'UTC')::date) d
    FROM student_events WHERE "userId" = ${userId}::uuid ORDER BY d DESC`
  if (!rows.length) return 0
  const days = rows.map((r) => new Date(r.d))
  const today = new Date(); today.setUTCHours(0, 0, 0, 0)
  const MS = 86400000
  // A streak only counts if the latest activity was today or yesterday.
  if (Math.round((today.getTime() - days[0].getTime()) / MS) > 1) return 0
  let streak = 1
  for (let i = 1; i < days.length; i++) {
    if (Math.round((days[i - 1].getTime() - days[i].getTime()) / MS) === 1) streak++
    else break
  }
  return streak
}

async function getEngagedChapters(userId) {
  const rows = await db.$queryRaw`SELECT DISTINCT subject, chapter FROM student_memory WHERE "userId" = ${userId}::uuid AND chapter <> ''`
  return rows.map((r) => ({ subject: r.subject, chapter: r.chapter }))
}

// Strong chapters = chapters the student has answered well on (>=70% quiz accuracy
// over at least 2 attempts). Mirror image of getWeakChapters — same table, no new
// data, just surfaced for the progress view. Highest accuracy first.
async function getStrongChapters(userId, { limit = 5 } = {}) {
  const rows = await db.$queryRaw`
    SELECT subject, chapter, doubts, mistakes, "quizCorrect", "quizTotal",
           round("quizCorrect"::numeric / "quizTotal", 2) AS accuracy
    FROM student_memory
    WHERE "userId" = ${userId}::uuid AND chapter <> ''
      AND "quizTotal" >= 2 AND ("quizCorrect"::numeric / "quizTotal") >= 0.7
    ORDER BY accuracy DESC, "quizTotal" DESC
    LIMIT ${limit}`
  return rows.map((r) => ({
    subject: r.subject, chapter: r.chapter,
    doubts: Number(r.doubts), mistakes: Number(r.mistakes),
    quizCorrect: Number(r.quizCorrect), quizTotal: Number(r.quizTotal),
    accuracy: r.accuracy != null ? Number(r.accuracy) : null,
  }))
}

// Recent activity feed = the latest learning events (doubt / mistake / quiz) from
// the event log already written by recordEvent. Read-only; no new logging.
async function getRecentActivity(userId, { limit = 8 } = {}) {
  const rows = await db.$queryRaw`
    SELECT type, subject, chapter, detail, "createdAt"
    FROM student_events
    WHERE "userId" = ${userId}::uuid
    ORDER BY "createdAt" DESC
    LIMIT ${limit}`
  return rows.map((r) => ({
    type: r.type,
    subject: r.subject || null,
    chapter: r.chapter || null,
    correct: r.detail && typeof r.detail.correct === 'boolean' ? r.detail.correct : null,
    at: r.createdAt,
  }))
}

async function getSummary(userId) {
  const agg = await db.$queryRaw`
    SELECT count(*)::int chapters,
           coalesce(sum(doubts),0)::int doubts,
           coalesce(sum(mistakes),0)::int mistakes,
           coalesce(sum("quizCorrect"),0)::int "quizCorrect",
           coalesce(sum("quizTotal"),0)::int "quizTotal"
    FROM student_memory WHERE "userId" = ${userId}::uuid AND chapter <> ''`
  const a = agg[0] || {}
  const [weak, strong, recentActivity, studyStats, streak] = await Promise.all([
    getWeakChapters(userId, { limit: 5 }),
    getStrongChapters(userId, { limit: 5 }),
    getRecentActivity(userId, { limit: 8 }),
    progress.getStudyStats(userId).catch(() => ({ studySeconds: 0, lessonsCompleted: 0, lessonsStarted: 0, lessonsInProgress: 0 })),
    getLearningStreak(userId).catch(() => 0),
  ])
  const accuracy = a.quizTotal > 0 ? Math.round((a.quizCorrect / a.quizTotal) * 100) / 100 : null
  return {
    chaptersEngaged: Number(a.chapters || 0),
    totalDoubts: Number(a.doubts || 0),
    totalMistakes: Number(a.mistakes || 0),
    quizAccuracy: accuracy,
    quiz: { correct: Number(a.quizCorrect || 0), total: Number(a.quizTotal || 0) },
    weakChapters: weak.filter((w) => w.weakness > 0),
    strongChapters: strong,
    recentActivity,
    // Lesson study stats (Phase 2 Study Insights tiles).
    studySeconds: studyStats.studySeconds,
    lessonsCompleted: studyStats.lessonsCompleted,
    lessonsStarted: studyStats.lessonsStarted,
    lessonsInProgress: studyStats.lessonsInProgress,
    learningStreak: streak,
  }
}

module.exports = {
  recordEvent, getWeakChapters, getStrongChapters, getEngagedChapters,
  getChapterStat, getRecentActivity, getSummary, getLearningStreak,
  recordLanguage, getPreferredLanguage,
}
