'use strict'

// Question retrieval (DB-injected). Implements the unseen-first filters used by
// the pipeline's priority ladder. Always filters by grade + subject + category +
// difficulty and avoids questions attempted within the recent window.

const { DIFFICULTIES, RECENT_WINDOW_DAYS } = require('./constants')
const { parseGrade } = require('./grade')

// Set of questionIds + seedIds the student has attempted in the last `days`.
async function recentlyAttempted(db, userId, days = RECENT_WINDOW_DAYS) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  let rows = []
  try {
    rows = await db.question_attempts.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { questionId: true, seedId: true },
    })
  } catch { rows = [] }
  return {
    questionIds: new Set(rows.map((r) => r.questionId).filter(Boolean)),
    seedIds: new Set(rows.map((r) => r.seedId).filter(Boolean)),
  }
}

// Priority 1: unseen ACTIVE generated questions at the target difficulty.
// Served least-served-first (spreads exposure), then highest quality.
async function unseenGenerated(db, { grade, subject = 'Mental Math', category, difficulty, limit, excludeIds = new Set() }) {
  const className = parseGrade(grade).className
  try {
    return await db.generated_questions.findMany({
      where: {
        grade: className, subject, category, difficulty, status: 'ACTIVE',
        id: { notIn: [...excludeIds] },
      },
      orderBy: [{ timesServed: 'asc' }, { qualityScore: 'desc' }],
      take: limit,
    })
  } catch { return [] }
}

// Priority 3: oldest unseen questions at a NEARBY difficulty (one band away).
async function nearbyGenerated(db, { grade, subject = 'Mental Math', category, difficulty, limit, excludeIds = new Set() }) {
  const className = parseGrade(grade).className
  const i = DIFFICULTIES.indexOf(difficulty)
  const neighbours = [DIFFICULTIES[i - 1], DIFFICULTIES[i + 1]].filter(Boolean)
  if (!neighbours.length) return []
  try {
    return await db.generated_questions.findMany({
      where: {
        grade: className, subject, category, status: 'ACTIVE',
        difficulty: { in: neighbours },
        id: { notIn: [...excludeIds] },
      },
      orderBy: [{ createdAt: 'asc' }], // oldest first
      take: limit,
    })
  } catch { return [] }
}

// Teacher SOFT boost: unseen questions in the wheel category whose concept/topic/
// chapter mentions the lesson concept. Same class + difficulty guardrails apply —
// this only re-ranks WITHIN the allowed pool, it never widens it.
async function conceptMatchedGenerated(db, { grade, subject = 'Mental Math', category, concept, difficulty, limit, excludeIds = new Set() }) {
  if (!concept) return []
  const className = parseGrade(grade).className
  try {
    return await db.generated_questions.findMany({
      where: {
        grade: className, subject, category, difficulty, status: 'ACTIVE',
        id: { notIn: [...excludeIds] },
        OR: [
          { concept: { contains: concept, mode: 'insensitive' } },
          { topic: { contains: concept, mode: 'insensitive' } },
          { chapter: { contains: concept, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ timesServed: 'asc' }, { qualityScore: 'desc' }],
      take: limit,
    })
  } catch { return [] }
}

// Concepts (within a category) the student has been getting WRONG recently — the
// "weak area" signal for the selection policy. Derived from generated-question
// attempts joined to their concept; accuracy < 0.6 over the window marks a weakness.
// Uses the query builder (not raw SQL) so it works with the test fake DB too.
async function weakConceptsFor(db, userId, { category, days = RECENT_WINDOW_DAYS } = {}) {
  if (!userId) return new Set()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  let attempts = []
  try {
    attempts = await db.question_attempts.findMany({
      where: { userId, category, source: 'generated', createdAt: { gte: since } },
    })
  } catch { return new Set() }
  const ids = [...new Set(attempts.map((a) => a.questionId).filter(Boolean))]
  if (!ids.length) return new Set()

  let rows = []
  try { rows = await db.generated_questions.findMany({ where: { id: { in: ids } } }) } catch { return new Set() }
  const conceptById = new Map(rows.map((r) => [r.id, String(r.concept || '').trim().toLowerCase()]))

  const agg = new Map() // concept -> { correct, total }
  for (const a of attempts) {
    const c = conceptById.get(a.questionId)
    if (!c) continue
    const e = agg.get(c) || { correct: 0, total: 0 }
    e.total += 1
    if (a.isCorrect) e.correct += 1
    agg.set(c, e)
  }
  const weak = new Set()
  for (const [c, e] of agg) if (e.total >= 1 && e.correct / e.total < 0.6) weak.add(c)
  return weak
}

// How many ACTIVE generated questions exist for a bucket (drives background top-up).
async function bucketCount(db, { grade, subject = 'Mental Math', category, difficulty }) {
  const className = parseGrade(grade).className
  try {
    return await db.generated_questions.count({
      where: { grade: className, subject, category, difficulty, status: 'ACTIVE' },
    })
  } catch { return 0 }
}

module.exports = { recentlyAttempted, unseenGenerated, nearbyGenerated, conceptMatchedGenerated, weakConceptsFor, bucketCount }
