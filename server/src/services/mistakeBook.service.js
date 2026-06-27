'use strict'

// Personal Mistake Book. Wrong questions are captured automatically (from BrainGym
// / homework attempts) and surfaced for revision. Enriches each entry from the
// generated_questions bank or the offline seed bank so the book has the full
// question text + correct answer + explanation. Raw SQL (no model accessors) so it
// needs no Prisma client regeneration — same style as memory/mastery services.

const db = require('../config/database')

let SEED_BY_ID = null
function seedById(seedId) {
  if (!SEED_BY_ID) {
    SEED_BY_ID = new Map()
    try {
      const seed = require('../data/brainGymSeed.json')
      for (const s of seed) SEED_BY_ID.set(s.seedId, s)
    } catch { /* no seed file */ }
  }
  return SEED_BY_ID.get(seedId) || null
}

// Record (or bump) a wrong answer. Best-effort and idempotent per (user, item):
// re-missing the same question increments timesWrong and re-opens it.
async function addMistake({ userId, source = 'braingym', questionId = null, seedId = null, category = null, grade = null, difficulty = null, studentAnswer = null }) {
  if (!userId || (!questionId && !seedId)) return { ok: false }
  const itemKey = questionId || `seed:${seedId}`
  const sAns = studentAnswer != null ? String(studentAnswer) : null

  // Enrich from the canonical source of truth.
  let subject = 'Mental Math', chapter = '', concept = '', questionText = '', correctAnswer = null, explanation = ''
  try {
    if (questionId) {
      const rows = await db.$queryRaw`
        SELECT subject, chapter, concept, "questionText", answer, explanation, difficulty, category, grade
        FROM generated_questions WHERE id = ${questionId}::uuid`
      if (rows.length) {
        const r = rows[0]
        subject = r.subject || subject; chapter = r.chapter || ''; concept = r.concept || ''
        questionText = r.questionText || ''; correctAnswer = r.answer != null ? String(r.answer) : null
        explanation = r.explanation || ''
        difficulty = difficulty || r.difficulty || null; category = category || r.category || null; grade = grade || r.grade || null
      }
    } else if (seedId) {
      const s = seedById(seedId)
      if (s) {
        questionText = s.q || ''
        correctAnswer = s.answer != null ? String(s.answer) : null
        category = category || s.skill || null
      }
    }
  } catch { /* enrichment is best-effort */ }

  try {
    // `${questionId}::uuid` is null-safe — Prisma binds NULL when questionId is null.
    await db.$executeRaw`
      INSERT INTO mistake_book ("userId", "itemKey", source, "questionId", "seedId", subject, chapter, concept, category, grade, difficulty, "questionText", "studentAnswer", "correctAnswer", explanation, status, "timesWrong", "createdAt", "lastWrongAt")
      VALUES (${userId}::uuid, ${itemKey}, ${source}, ${questionId}::uuid, ${seedId}, ${subject}, ${chapter}, ${concept}, ${category}, ${grade}, ${difficulty}, ${questionText}, ${sAns}, ${correctAnswer}, ${explanation}, 'unresolved', 1, now(), now())
      ON CONFLICT ("userId", "itemKey") DO UPDATE SET
        "timesWrong"    = mistake_book."timesWrong" + 1,
        "studentAnswer" = COALESCE(${sAns}, mistake_book."studentAnswer"),
        status          = 'unresolved',
        "lastWrongAt"   = now(),
        "resolvedAt"    = NULL`
    return { ok: true, itemKey }
  } catch (err) {
    console.warn('[MistakeBook] add skipped:', err.message)
    return { ok: false }
  }
}

// Bulk helper: capture all wrong items from a recorded attempt batch. Best-effort.
async function captureWrong({ userId, source = 'braingym', grade = null, items = [] }) {
  let added = 0
  for (const it of items) {
    if (it.isCorrect) continue
    const r = await addMistake({
      userId, source, grade,
      questionId: it.source === 'generated' ? (it.id || it.questionId || null) : null,
      seedId: it.source === 'seed' ? (it.seedId || null) : null,
      category: it.category || null, difficulty: it.difficulty || null,
      studentAnswer: it.answerGiven != null ? it.answerGiven : null,
    })
    if (r.ok) added += 1
  }
  return { added }
}

const shape = (r) => ({
  id: r.id, source: r.source, subject: r.subject, chapter: r.chapter, concept: r.concept,
  category: r.category, grade: r.grade, difficulty: r.difficulty,
  questionText: r.questionText, studentAnswer: r.studentAnswer, correctAnswer: r.correctAnswer,
  explanation: r.explanation, status: r.status, timesWrong: Number(r.timesWrong),
  lastWrongAt: r.lastWrongAt, createdAt: r.createdAt, resolvedAt: r.resolvedAt,
})

// Conditional fetch using Prisma tagged templates (parameterised, no string building).
async function listMistakes(userId, { status, subject, limit = 50 } = {}) {
  const lim = Math.min(200, Math.max(1, limit))
  let rows
  if (status && subject) {
    rows = await db.$queryRaw`SELECT * FROM mistake_book WHERE "userId" = ${userId}::uuid AND status = ${status} AND subject = ${subject} ORDER BY "lastWrongAt" DESC LIMIT ${lim}`
  } else if (status) {
    rows = await db.$queryRaw`SELECT * FROM mistake_book WHERE "userId" = ${userId}::uuid AND status = ${status} ORDER BY "lastWrongAt" DESC LIMIT ${lim}`
  } else if (subject) {
    rows = await db.$queryRaw`SELECT * FROM mistake_book WHERE "userId" = ${userId}::uuid AND subject = ${subject} ORDER BY "lastWrongAt" DESC LIMIT ${lim}`
  } else {
    rows = await db.$queryRaw`SELECT * FROM mistake_book WHERE "userId" = ${userId}::uuid ORDER BY "lastWrongAt" DESC LIMIT ${lim}`
  }
  return rows.map(shape)
}

async function getUnresolved(userId, { subject, limit = 20 } = {}) {
  return listMistakes(userId, { status: 'unresolved', subject, limit })
}

async function resolveMistake(userId, id) {
  await db.$executeRaw`
    UPDATE mistake_book SET status = 'resolved', "resolvedAt" = now()
    WHERE id = ${id}::uuid AND "userId" = ${userId}::uuid`
  return { ok: true }
}

async function countOpen(userId) {
  const rows = await db.$queryRaw`SELECT count(*)::int AS n FROM mistake_book WHERE "userId" = ${userId}::uuid AND status = 'unresolved'`
  return rows.length ? Number(rows[0].n) : 0
}

module.exports = { addMistake, captureWrong, listMistakes, getUnresolved, resolveMistake, countOpen }
