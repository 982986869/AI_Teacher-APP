'use strict'

// ─── Mastery Lifecycle (pure) ───────────────────────────────────────────────
// Long-term learning intelligence layered ON TOP of the existing per-concept
// mastery engine (mastery.service). This module holds only pure functions — the
// forgetting curve, the state machine, and teacher-facing phrasings — so the
// lifecycle is fully testable and the DB engine stays the single source of truth.
//
// Key idea: practice raises MASTERY (durable, learned level). Time without
// practice lowers RETENTION (currently-accessible level) FIRST — mastery itself
// is not punished. When retention falls far enough the concept needs revision,
// then is treated as forgotten.

const DAY = 86400000
const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0))

// Memory stability (in days): how slowly a concept decays. Strong, streak-backed,
// well-practised concepts are far more durable than freshly-seen ones.
function stabilityDays({ mastery = 0, streak = 0, evidenceCount = 0 } = {}) {
  return 2 + clamp01(mastery) * 28 + Math.min(streak, 12) * 2 + Math.min(evidenceCount, 20) * 0.4
}

// Forgetting curve (Ebbinghaus): retention = mastery × e^(−Δdays / stability).
// Δ≈0 (just practised) ⇒ retention ≈ mastery (full access). Returns 0..1.
function computeRetention({ mastery = 0, lastSeen, streak = 0, evidenceCount = 0, now = Date.now() } = {}) {
  const m = clamp01(mastery)
  if (m <= 0) return 0
  if (!lastSeen) return m
  const days = Math.max(0, (now - new Date(lastSeen).getTime()) / DAY)
  const S = stabilityDays({ mastery: m, streak, evidenceCount })
  return clamp01(m * Math.exp(-days / S))
}

const STATES = ['New', 'Learning', 'Improving', 'Strong', 'Mastered', 'Needs Revision', 'Forgotten']

// Lifecycle state from current mastery/confidence/retention. Forgetting takes
// precedence (only concepts that were once learned, mastery ≥ 0.5, can fade).
function classifyState({ mastery = 0, confidence = 0, retention, evidenceCount = 0 } = {}) {
  const m = clamp01(mastery)
  const c = clamp01(confidence)
  const r = retention == null ? m : clamp01(retention)
  if (evidenceCount < 1) return 'New'
  if (m >= 0.5) {
    if (r < 0.25) return 'Forgotten'
    if (r < 0.5) return 'Needs Revision'
  }
  if (m >= 0.85 && c >= 0.6) return 'Mastered'
  if (m >= 0.7) return 'Strong'
  if (m >= 0.4) return 'Improving'
  return 'Learning'
}

function daysSince(lastSeen, now = Date.now()) {
  if (!lastSeen) return null
  return Math.max(0, Math.floor((now - new Date(lastSeen).getTime()) / DAY))
}

function humanGap(days) {
  if (days == null) return ''
  if (days >= 60) return `${Math.round(days / 30)} months`
  if (days >= 30) return 'a month'
  if (days >= 14) return `${Math.round(days / 7)} weeks`
  if (days >= 7) return 'a week'
  if (days >= 2) return `${days} days`
  return 'recently'
}

// Natural teacher line for a concept's state (used by the AI Teacher).
function statePhrasing(state, name, { lastSeen, now = Date.now() } = {}) {
  const gap = humanGap(daysSince(lastSeen, now))
  switch (state) {
    case 'Mastered': return `You have mastered ${name}.`
    case 'Strong': return `You're strong at ${name}.`
    case 'Improving': return `${name} is improving — keep it up.`
    case 'Learning': return `You're still learning ${name}.`
    case 'Needs Revision': return `It's been ${gap} since you practised ${name}. Let's revise.`
    case 'Forgotten': return `${name} has faded — it's been ${gap}. Time for a refresher.`
    case 'New':
    default: return `You haven't started ${name} yet.`
  }
}

// Normalised answer speed (0..1): fast ⇒ 1, slow ⇒ 0. null when no timing.
function speedFromTime(ms, { fast = 5000, slow = 45000 } = {}) {
  const t = Number(ms)
  if (!t || t <= 0) return null
  if (t <= fast) return 1
  if (t >= slow) return 0
  return clamp01((slow - t) / (slow - fast))
}

// Convenience: enrich a raw student_concept row with live retention + state.
function deriveLifecycle(row, { now = Date.now() } = {}) {
  const mastery = clamp01(row.mastery)
  const confidence = clamp01(row.confidence)
  const evidenceCount = Number(row.evidenceCount) || 0
  const streak = Number(row.streak) || 0
  const retention = computeRetention({ mastery, lastSeen: row.lastSeen, streak, evidenceCount, now })
  const state = classifyState({ mastery, confidence, retention, evidenceCount })
  return { retention, state, daysSince: daysSince(row.lastSeen, now) }
}

module.exports = {
  STATES, DAY, clamp01, stabilityDays, computeRetention, classifyState,
  daysSince, humanGap, statePhrasing, speedFromTime, deriveLifecycle,
}
