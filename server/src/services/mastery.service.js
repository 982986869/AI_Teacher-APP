'use strict'

const db = require('../config/database')

const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const round = (x) => Math.round(Number(x) * 100) / 100

// How each learning signal moves the estimate. `target` = where this signal pulls
// mastery; `alpha` = how hard (strong for quiz, soft for a doubt).
const SIGNALS = {
  quiz_correct:   { target: 1.0, alpha: 0.35, dCorrect: 1, dTotal: 1, failDelta: -1, dDoubt: 0 },
  quiz_wrong:     { target: 0.0, alpha: 0.35, dCorrect: 0, dTotal: 1, failDelta: 1, dDoubt: 0 },
  understood:     { target: 0.8, alpha: 0.25, dCorrect: 0, dTotal: 0, failDelta: -1, dDoubt: 0 },
  not_understood: { target: 0.2, alpha: 0.30, dCorrect: 0, dTotal: 0, failDelta: 1, dDoubt: 0 },
  doubt:          { target: 0.4, alpha: 0.12, dCorrect: 0, dTotal: 0, failDelta: 0, dDoubt: 1 },
}

async function getStudentConcept(userId, conceptId) {
  const rows = await db.$queryRaw`
    SELECT mastery, confidence, weakness, "evidenceCount", "quizCorrect", "quizTotal", doubts, "recentFails"
    FROM student_concepts WHERE "userId" = ${userId}::uuid AND concept_id = ${conceptId}::uuid`
  if (!rows.length) return null
  const r = rows[0]
  return {
    mastery: Number(r.mastery), confidence: Number(r.confidence), weakness: Number(r.weakness),
    evidenceCount: Number(r.evidenceCount), quizCorrect: Number(r.quizCorrect),
    quizTotal: Number(r.quizTotal), doubts: Number(r.doubts), recentFails: Number(r.recentFails),
  }
}

// Apply one signal to a concept's per-student state (EWMA). Returns the new state.
async function updateMastery({ userId, conceptId, signal }) {
  if (!userId || !conceptId) return null
  const S = SIGNALS[signal]
  if (!S) return null
  const cur = (await getStudentConcept(userId, conceptId)) ||
    { mastery: 0, confidence: 0, weakness: 0, evidenceCount: 0, quizCorrect: 0, quizTotal: 0, doubts: 0, recentFails: 0 }

  const evidenceCount = cur.evidenceCount + 1
  const mastery = clamp(cur.mastery + S.alpha * (S.target - cur.mastery), 0, 1)
  const recentFails = clamp(cur.recentFails + S.failDelta, 0, 5)
  const confidence = 1 - Math.exp(-evidenceCount / 3)            // grows with evidence
  const weakness = clamp(0.6 * (1 - mastery) + 0.4 * Math.min(1, recentFails / 3), 0, 1)
  const quizCorrect = cur.quizCorrect + S.dCorrect
  const quizTotal = cur.quizTotal + S.dTotal
  const doubts = cur.doubts + S.dDoubt

  await db.$executeRaw`
    INSERT INTO student_concepts ("userId", concept_id, mastery, confidence, weakness, "evidenceCount", "quizCorrect", "quizTotal", doubts, "recentFails", "lastSeen", "updatedAt")
    VALUES (${userId}::uuid, ${conceptId}::uuid, ${mastery}, ${confidence}, ${weakness}, ${evidenceCount}, ${quizCorrect}, ${quizTotal}, ${doubts}, ${recentFails}, now(), now())
    ON CONFLICT ("userId", concept_id) DO UPDATE SET
      mastery = ${mastery}, confidence = ${confidence}, weakness = ${weakness}, "evidenceCount" = ${evidenceCount},
      "quizCorrect" = ${quizCorrect}, "quizTotal" = ${quizTotal}, doubts = ${doubts}, "recentFails" = ${recentFails},
      "lastSeen" = now(), "updatedAt" = now()`

  return { mastery: round(mastery), confidence: round(confidence), weakness: round(weakness), evidenceCount }
}

// Weakest concepts the student has shown enough evidence on (for tracking/planner).
async function getWeakConcepts(userId, { subject, limit = 8 } = {}) {
  const rows = subject
    ? await db.$queryRaw`
        SELECT c.subject, c.chapter, c.name, sc.mastery, sc.confidence, sc.weakness, sc."quizCorrect", sc."quizTotal", sc.doubts
        FROM student_concepts sc JOIN concepts c ON c.id = sc.concept_id
        WHERE sc."userId" = ${userId}::uuid AND c.subject = ${subject} AND sc.confidence > 0.2
        ORDER BY sc.weakness DESC LIMIT ${limit}`
    : await db.$queryRaw`
        SELECT c.subject, c.chapter, c.name, sc.mastery, sc.confidence, sc.weakness, sc."quizCorrect", sc."quizTotal", sc.doubts
        FROM student_concepts sc JOIN concepts c ON c.id = sc.concept_id
        WHERE sc."userId" = ${userId}::uuid AND sc.confidence > 0.2
        ORDER BY sc.weakness DESC LIMIT ${limit}`
  return rows.map((r) => ({
    subject: r.subject, chapter: r.chapter, concept: r.name,
    mastery: round(r.mastery), confidence: round(r.confidence), weakness: round(r.weakness),
    quizCorrect: Number(r.quizCorrect), quizTotal: Number(r.quizTotal), doubts: Number(r.doubts),
  }))
}

module.exports = { updateMastery, getStudentConcept, getWeakConcepts }
