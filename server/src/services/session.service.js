'use strict'

const db = require('../config/database')
const mastery = require('./mastery.service')
const { canonicalSubject } = require('./retriever.service')

// Session continuity ("Welcome back"). Assembles, from data the app already records
// (student_events + student_concepts), what the teacher should remember when a
// student returns: what we studied last, how long ago, and the specific concept
// they were struggling with — so the teacher can offer to continue instead of
// asking a cold "How can I help?". Pure read; no LLM, so it's instant and reliable.

const DAY_MS = 24 * 60 * 60 * 1000

// Most recent learning event → what we were last working on.
async function lastEvent(userId, subject) {
  const subj = subject ? canonicalSubject(subject) : null
  const rows = subj
    ? await db.$queryRaw`
        SELECT subject, chapter, type, "createdAt"
        FROM student_events WHERE "userId" = ${userId}::uuid AND subject = ${subj}
        ORDER BY "createdAt" DESC LIMIT 1`
    : await db.$queryRaw`
        SELECT subject, chapter, type, "createdAt"
        FROM student_events WHERE "userId" = ${userId}::uuid
        ORDER BY "createdAt" DESC LIMIT 1`
  return rows.length ? rows[0] : null
}

// The most recent distinct doubts (for "you asked about …").
async function recentDoubts(userId, subject, limit = 3) {
  const subj = subject ? canonicalSubject(subject) : null
  const rows = subj
    ? await db.$queryRaw`
        SELECT DISTINCT ON (chapter) chapter, "createdAt"
        FROM student_events WHERE "userId" = ${userId}::uuid AND type = 'doubt' AND subject = ${subj} AND chapter <> ''
        ORDER BY chapter, "createdAt" DESC`
    : await db.$queryRaw`
        SELECT DISTINCT ON (chapter) chapter, "createdAt"
        FROM student_events WHERE "userId" = ${userId}::uuid AND type = 'doubt' AND chapter <> ''
        ORDER BY chapter, "createdAt" DESC`
  return rows.slice(0, limit).map((r) => r.chapter)
}

// Build a resume snapshot. `user` is the authenticated user ({ name, grade }).
async function getResumeContext(userId, { subject, user } = {}) {
  const [last, weakConcepts, doubts] = await Promise.all([
    lastEvent(userId, subject),
    mastery.getWeakConcepts(userId, { subject: subject ? canonicalSubject(subject) : undefined, limit: 1 }).catch(() => []),
    recentDoubts(userId, subject).catch(() => []),
  ])

  const firstName = (user && user.name ? String(user.name).trim().split(/\s+/)[0] : '') || null

  if (!last) {
    // No history yet → a clean first-time greeting, no fake continuity.
    return {
      hasHistory: false,
      name: firstName,
      grade: (user && user.grade) || null,
      daysSince: null,
      last: null,
      focusConcept: null,
      recentDoubts: [],
      greeting: firstName ? `Hi ${firstName}! Ready to start learning?` : 'Ready to start learning?',
      suggestion: null,
    }
  }

  const lastAt = new Date(last.createdAt)
  const daysSince = Math.max(0, Math.floor((Date.now() - lastAt.getTime()) / DAY_MS))
  const wc = weakConcepts[0] || null
  const focusConcept = wc
    ? { concept: wc.concept, chapter: wc.chapter, subject: wc.subject, masteryPct: Math.round((wc.mastery || 0) * 100) }
    : null

  // Deterministic, warm, data-driven copy. The client can re-localise from the
  // structured fields; this default keeps the API usable on its own.
  const whenPhrase = daysSince === 0 ? 'earlier today'
    : daysSince === 1 ? 'yesterday'
    : `${daysSince} days ago`
  // Talk like a teacher who remembers — never expose the internal mastery number.
  const topic = last.chapter || last.subject
  const greeting = firstName
    ? `Welcome back, ${firstName}! ${daysSince <= 1 ? '' : 'It’s been a little while. '}Last time we were working on ${topic}.`
    : `Welcome back! Last time we were working on ${topic}.`
  const suggestion = focusConcept
    ? `We paused around ${focusConcept.concept} — shall we pick up there, or is something else on your mind?`
    : `Shall we continue with ${topic}, or is there something you'd like to ask?`

  return {
    hasHistory: true,
    name: firstName,
    grade: (user && user.grade) || null,
    daysSince,
    last: { subject: last.subject, chapter: last.chapter || null, at: lastAt.toISOString() },
    focusConcept,
    recentDoubts: doubts,
    greeting,
    suggestion,
  }
}

module.exports = { getResumeContext }
