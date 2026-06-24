'use strict'

const db = require('../config/database')

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

async function getEngagedChapters(userId) {
  const rows = await db.$queryRaw`SELECT DISTINCT subject, chapter FROM student_memory WHERE "userId" = ${userId}::uuid AND chapter <> ''`
  return rows.map((r) => ({ subject: r.subject, chapter: r.chapter }))
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
  const weak = await getWeakChapters(userId, { limit: 5 })
  const accuracy = a.quizTotal > 0 ? Math.round((a.quizCorrect / a.quizTotal) * 100) / 100 : null
  return {
    chaptersEngaged: Number(a.chapters || 0),
    totalDoubts: Number(a.doubts || 0),
    totalMistakes: Number(a.mistakes || 0),
    quizAccuracy: accuracy,
    quiz: { correct: Number(a.quizCorrect || 0), total: Number(a.quizTotal || 0) },
    weakChapters: weak.filter((w) => w.weakness > 0),
  }
}

module.exports = { recordEvent, getWeakChapters, getEngagedChapters, getChapterStat, getSummary }
