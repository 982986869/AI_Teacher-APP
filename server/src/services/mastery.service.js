'use strict'

const db = require('../config/database')
const lifecycle = require('./masteryLifecycle')

const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const round = (x) => Math.round(Number(x) * 100) / 100

// How each learning signal moves the estimate. `target` = where this signal pulls
// mastery; `alpha` = how hard. ONLY assessment moves the skill estimate:
//   - quiz_correct / quiz_wrong: real evidence of skill (strong alpha).
//   - understood / not_understood: the student's own confirmation (medium alpha).
// `doubt` (merely ASKING/engaging) is NOT assessment — asking a question is no
// evidence that you are weak (or average) at a topic. With alpha 0.12 toward 0.4 it
// used to regress every student toward the mean, silently demoting a quiz-proven
// strong student from advanced to intermediate after just two questions. So `doubt`
// now records engagement (dDoubt) and recency WITHOUT moving the mastery estimate
// (alpha 0). Skill changes only when the student is actually assessed.
const SIGNALS = {
  quiz_correct:   { target: 1.0, alpha: 0.35, dCorrect: 1, dTotal: 1, failDelta: -1, dDoubt: 0 },
  quiz_wrong:     { target: 0.0, alpha: 0.35, dCorrect: 0, dTotal: 1, failDelta: 1, dDoubt: 0 },
  understood:     { target: 0.8, alpha: 0.25, dCorrect: 0, dTotal: 0, failDelta: -1, dDoubt: 0 },
  not_understood: { target: 0.2, alpha: 0.30, dCorrect: 0, dTotal: 0, failDelta: 1, dDoubt: 0 },
  doubt:          { target: 0.4, alpha: 0.0,  dCorrect: 0, dTotal: 0, failDelta: 0, dDoubt: 1 },
}

async function getStudentConcept(userId, conceptId) {
  const rows = await db.$queryRaw`
    SELECT mastery, confidence, weakness, "evidenceCount", "quizCorrect", "quizTotal", doubts, "recentFails",
           "speedScore", "retentionScore", streak, "revisionCount", "lastSeen"
    FROM student_concepts WHERE "userId" = ${userId}::uuid AND concept_id = ${conceptId}::uuid`
  if (!rows.length) return null
  const r = rows[0]
  return {
    mastery: Number(r.mastery), confidence: Number(r.confidence), weakness: Number(r.weakness),
    evidenceCount: Number(r.evidenceCount), quizCorrect: Number(r.quizCorrect),
    quizTotal: Number(r.quizTotal), doubts: Number(r.doubts), recentFails: Number(r.recentFails),
    speedScore: Number(r.speedScore), retentionScore: Number(r.retentionScore),
    streak: Number(r.streak), revisionCount: Number(r.revisionCount), lastSeen: r.lastSeen,
  }
}

// Apply one signal to a concept's per-student state (EWMA). Returns the new state.
// `timeMs` (optional) feeds the speed score; `isRevision` (optional) marks this as
// a scheduled-revision practice (bumps revisionCount). Both default off so the
// existing callers (agent.service) are unaffected.
async function updateMastery({ userId, conceptId, signal, timeMs = null, isRevision = false }) {
  if (!userId || !conceptId) return null
  const S = SIGNALS[signal]
  if (!S) return null
  const cur = (await getStudentConcept(userId, conceptId)) ||
    { mastery: 0, confidence: 0, weakness: 0, evidenceCount: 0, quizCorrect: 0, quizTotal: 0, doubts: 0, recentFails: 0, speedScore: 0, streak: 0, revisionCount: 0 }

  const evidenceCount = cur.evidenceCount + 1
  const mastery = clamp(cur.mastery + S.alpha * (S.target - cur.mastery), 0, 1)
  const recentFails = clamp(cur.recentFails + S.failDelta, 0, 5)
  const confidence = 1 - Math.exp(-evidenceCount / 3)            // grows with evidence
  const weakness = clamp(0.6 * (1 - mastery) + 0.4 * Math.min(1, recentFails / 3), 0, 1)
  const quizCorrect = cur.quizCorrect + S.dCorrect
  const quizTotal = cur.quizTotal + S.dTotal
  const doubts = cur.doubts + S.dDoubt

  // ── Lifecycle fields ──
  // streak: consecutive correct answers (only assessment signals move it).
  let streak = Number(cur.streak) || 0
  if (signal === 'quiz_correct') streak += 1
  else if (signal === 'quiz_wrong' || signal === 'not_understood') streak = 0
  // speed: rolling 0..1 from answer time (only when timed).
  const sp = lifecycle.speedFromTime(timeMs)
  const speedScore = sp == null
    ? (Number(cur.speedScore) || 0)
    : clamp((cur.evidenceCount ? 0.7 * (Number(cur.speedScore) || 0) + 0.3 * sp : sp), 0, 1)
  // retention: practising refreshes it to the (new) mastery level; it then decays
  // with time on READ via the forgetting curve.
  const retentionScore = mastery
  const revisionCount = (Number(cur.revisionCount) || 0) + (isRevision ? 1 : 0)

  await db.$executeRaw`
    INSERT INTO student_concepts ("userId", concept_id, mastery, confidence, weakness, "evidenceCount", "quizCorrect", "quizTotal", doubts, "recentFails", "speedScore", "retentionScore", streak, "revisionCount", "lastSeen", "updatedAt")
    VALUES (${userId}::uuid, ${conceptId}::uuid, ${mastery}, ${confidence}, ${weakness}, ${evidenceCount}, ${quizCorrect}, ${quizTotal}, ${doubts}, ${recentFails}, ${speedScore}, ${retentionScore}, ${streak}, ${revisionCount}, now(), now())
    ON CONFLICT ("userId", concept_id) DO UPDATE SET
      mastery = ${mastery}, confidence = ${confidence}, weakness = ${weakness}, "evidenceCount" = ${evidenceCount},
      "quizCorrect" = ${quizCorrect}, "quizTotal" = ${quizTotal}, doubts = ${doubts}, "recentFails" = ${recentFails},
      "speedScore" = ${speedScore}, "retentionScore" = ${retentionScore}, streak = ${streak}, "revisionCount" = ${revisionCount},
      "lastSeen" = now(), "updatedAt" = now()`

  return { mastery: round(mastery), confidence: round(confidence), weakness: round(weakness), evidenceCount, streak, speedScore: round(speedScore) }
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

// ─── Lifecycle read layer ───────────────────────────────────────────────────
// Loads the student's concept rows (joined to concept metadata) and enriches each
// with LIVE retention + lifecycle state (the forgetting curve is applied at read
// time — no cron needed). Reuses the same student_concepts table as the engine.
async function loadConcepts(userId, { subject } = {}) {
  const rows = subject
    ? await db.$queryRaw`
        SELECT c.id AS concept_id, c.subject, c.chapter, c.name,
               sc.mastery, sc.confidence, sc.weakness, sc."evidenceCount", sc."quizCorrect", sc."quizTotal",
               sc.doubts, sc."recentFails", sc."speedScore", sc."retentionScore", sc.streak, sc."revisionCount", sc."lastSeen"
        FROM student_concepts sc JOIN concepts c ON c.id = sc.concept_id
        WHERE sc."userId" = ${userId}::uuid AND c.subject = ${subject}`
    : await db.$queryRaw`
        SELECT c.id AS concept_id, c.subject, c.chapter, c.name,
               sc.mastery, sc.confidence, sc.weakness, sc."evidenceCount", sc."quizCorrect", sc."quizTotal",
               sc.doubts, sc."recentFails", sc."speedScore", sc."retentionScore", sc.streak, sc."revisionCount", sc."lastSeen"
        FROM student_concepts sc JOIN concepts c ON c.id = sc.concept_id
        WHERE sc."userId" = ${userId}::uuid`
  const now = Date.now()
  return rows.map((r) => {
    const { retention, state, daysSince } = lifecycle.deriveLifecycle(r, { now })
    const pct = (x) => Math.round(Number(x) * 100)
    return {
      conceptId: r.concept_id, subject: r.subject, chapter: r.chapter, concept: r.name,
      state,
      mastery: pct(r.mastery), confidence: pct(r.confidence), retention: pct(retention),
      speed: pct(r.speedScore), weakness: pct(r.weakness),
      attempts: Number(r.evidenceCount), streak: Number(r.streak), revisionCount: Number(r.revisionCount),
      lastPracticed: r.lastSeen, daysSincePractice: daysSince,
      phrasing: lifecycle.statePhrasing(state, r.name, { lastSeen: r.lastSeen, now }),
    }
  })
}

// Whole-student learning profile: state histogram + notable concept lists.
async function getLearningProfile(userId, { subject } = {}) {
  let all = []
  try { all = await loadConcepts(userId, { subject }) } catch { all = [] }
  const byState = Object.fromEntries(lifecycle.STATES.map((s) => [s, 0]))
  for (const c of all) byState[c.state] = (byState[c.state] || 0) + 1

  const inState = (...s) => all.filter((c) => s.includes(c.state))
  const mastered = inState('Mastered').sort((a, b) => b.mastery - a.mastery)
  const strong = inState('Strong', 'Mastered').sort((a, b) => b.mastery - a.mastery)
  const needsRevision = inState('Needs Revision', 'Forgotten').sort((a, b) => a.retention - b.retention)
  const weak = [...all].sort((a, b) => b.weakness - a.weakness).slice(0, 5)
  const avg = (k) => (all.length ? Math.round(all.reduce((s, c) => s + c[k], 0) / all.length) : 0)

  return {
    totalConcepts: all.length,
    averageMastery: avg('mastery'),
    averageRetention: avg('retention'),
    byState,
    mastered: mastered.slice(0, 8),
    strong: strong.slice(0, 8),
    needsRevision: needsRevision.slice(0, 8),
    weak,
    // a few ready-to-speak lines for the AI Teacher
    highlights: [...mastered.slice(0, 2), ...needsRevision.slice(0, 2)].map((c) => c.phrasing),
  }
}

// Concepts ordered by most-recent practice — a lifecycle "timeline".
async function getMasteryTimeline(userId, { subject, limit = 30 } = {}) {
  let all = []
  try { all = await loadConcepts(userId, { subject }) } catch { all = [] }
  return all
    .sort((a, b) => new Date(b.lastPracticed || 0) - new Date(a.lastPracticed || 0))
    .slice(0, limit)
}

// Strongest concepts (Strong/Mastered) for the progress view + teacher praise.
async function getStrongConcepts(userId, { subject, limit = 8 } = {}) {
  let all = []
  try { all = await loadConcepts(userId, { subject }) } catch { all = [] }
  return all.filter((c) => c.state === 'Strong' || c.state === 'Mastered')
    .sort((a, b) => b.mastery - a.mastery).slice(0, limit)
}

// Concepts whose retention has decayed enough to need revision (forgetting curve).
async function getConceptsNeedingRevision(userId, { subject, limit = 8 } = {}) {
  let all = []
  try { all = await loadConcepts(userId, { subject }) } catch { all = [] }
  return all.filter((c) => c.state === 'Needs Revision' || c.state === 'Forgotten')
    .sort((a, b) => a.retention - b.retention).slice(0, limit)
}

// One concept BrainGym/Teacher should schedule for revision next (lowest retention).
async function pickRevisionConcept(userId, { subject } = {}) {
  const list = await getConceptsNeedingRevision(userId, { subject, limit: 1 })
  return list[0] || null
}

// Spaced-repetition revision calendar. A concept is DUE when its scheduled review
// date has passed (expanding 1/3/7/14/30-day intervals) OR its retention has
// decayed into Needs Revision / Forgotten. Combines schedule + forgetting curve.
async function getRevisionCalendar(userId, { subject } = {}) {
  const schedule = require('./revisionSchedule')
  let all = []
  try { all = await loadConcepts(userId, { subject }) } catch { all = [] }
  const now = Date.now()

  const enriched = all.map((c) => {
    const nextDue = schedule.nextDueDate(c.lastPracticed, c.revisionCount)
    const daysUntilDue = schedule.daysUntilDue(c.lastPracticed, c.revisionCount, now)
    const decayed = c.state === 'Needs Revision' || c.state === 'Forgotten'
    const scheduledDue = schedule.isDue(c.lastPracticed, c.revisionCount, now)
    return { ...c, nextDue, daysUntilDue, due: decayed || scheduledDue }
  })

  const due = enriched.filter((c) => c.due).sort((a, b) => a.retention - b.retention)
  const upcoming = enriched.filter((c) => !c.due)
    .sort((a, b) => (a.daysUntilDue ?? 1e9) - (b.daysUntilDue ?? 1e9))

  return {
    intervals: schedule.INTERVALS,
    dueCount: due.length,
    due: due.slice(0, 20),
    upcoming: upcoming.slice(0, 20),
  }
}

module.exports = {
  updateMastery, getStudentConcept, getWeakConcepts,
  loadConcepts, getLearningProfile, getMasteryTimeline,
  getStrongConcepts, getConceptsNeedingRevision, pickRevisionConcept,
  getRevisionCalendar,
}
