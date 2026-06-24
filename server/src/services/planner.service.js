'use strict'

const db = require('../config/database')
const memory = require('./memory.service')
const mastery = require('./mastery.service')
const { canonicalSubject } = require('./retriever.service')

const REVISE_THRESHOLD = 3      // chapter-weakness score above which we prioritise revision
// Concept-mastery thresholds: a concept with enough evidence (getWeakConcepts already
// filters confidence > 0.2), low mastery AND high recency-weighted weakness is the
// single best thing to revise next.
const MASTERY_FLOOR = 0.6       // below this mastery → not yet learned
const CONCEPT_WEAKNESS_FLOOR = 0.5

// Shape mastery rows for the client: expose a 0–100 score the UI can render directly.
function shapeConcepts(weakConcepts) {
  return weakConcepts.map((c) => ({
    subject: c.subject,
    chapter: c.chapter,
    concept: c.concept,
    masteryPct: Math.round((c.mastery || 0) * 100),
    weakness: c.weakness,
    quizCorrect: c.quizCorrect,
    quizTotal: c.quizTotal,
  }))
}

// Decide what the student should do next. Priority order:
//   1) MASTERY-DRIVEN — the weakest specific concept (student_concepts) the student
//      has real evidence on but hasn't mastered. This is the precise, adaptive signal.
//   2) chapter-level weakness (student_memory) — broader fallback when there isn't
//      enough per-concept evidence yet.
//   3) the next un-studied chapter in syllabus order.
//   4) review — everything touched, keep tightening weak spots.
async function recommendNext(userId, subject) {
  const subj = subject ? canonicalSubject(subject) : null
  // Concept mastery is the brain; chapter aggregates are the safety net. Read both
  // in parallel — both are indexed by userId and cheap.
  const [weakConceptsRaw, weak] = await Promise.all([
    mastery.getWeakConcepts(userId, { subject: subj, limit: 8 }).catch(() => []),
    memory.getWeakChapters(userId, { subject: subj, limit: 5 }),
  ])
  const weakConcepts = shapeConcepts(weakConceptsRaw)

  // 1) MASTERY-DRIVEN: the weakest under-mastered concept with real evidence.
  const focus = weakConceptsRaw.find(
    (c) => c.weakness >= CONCEPT_WEAKNESS_FLOOR && c.mastery < MASTERY_FLOOR
  )
  if (focus) {
    const pct = Math.round((focus.mastery || 0) * 100)
    return {
      action: 'revise',
      driver: 'mastery',
      subject: focus.subject,
      chapter: focus.chapter,
      concept: focus.concept,
      masteryPct: pct,
      reason: `Your mastery of ${focus.concept} (${focus.chapter}) is ${pct}% — let's revise it before moving on.`,
      weakChapters: weak,
      weakConcepts,
    }
  }

  // 2) A clearly weak chapter? Revise it first.
  if (weak.length && weak[0].weakness >= REVISE_THRESHOLD) {
    const w = weak[0]
    return {
      action: 'revise',
      driver: 'chapter',
      subject: w.subject,
      chapter: w.chapter,
      reason: `You've struggled here — ${w.mistakes} mistake(s)`
        + (w.quizTotal ? `, quiz ${w.quizCorrect}/${w.quizTotal}` : '')
        + `, ${w.doubts} doubt(s). Revise before moving on.`,
      weakChapters: weak,
      weakConcepts,
    }
  }

  // 3) Otherwise the next un-studied chapter in syllabus order.
  const engaged = new Set((await memory.getEngagedChapters(userId)).map((e) => `${e.subject}|${e.chapter}`))
  const rows = await db.$queryRawUnsafe(
    `SELECT s.name subject, c.name chapter
     FROM chapters c JOIN subjects s ON s.id = c.subject_id`
     + (subj ? ' WHERE s.name = $1' : '')
     + ' ORDER BY s.position, c.position',
    ...(subj ? [subj] : [])
  )
  const next = rows.find((r) => !engaged.has(`${r.subject}|${r.chapter}`))
  if (next) {
    return {
      action: 'learn',
      driver: 'syllabus',
      subject: next.subject,
      chapter: next.chapter,
      reason: "Next chapter in the syllabus you haven't started yet.",
      weakChapters: weak,
      weakConcepts,
    }
  }

  // 4) Everything touched — keep tightening weak spots.
  return {
    action: 'review',
    driver: 'review',
    subject: subj,
    chapter: weak[0] ? weak[0].chapter : null,
    reason: "You've engaged with every chapter — keep revising your weakest areas.",
    weakChapters: weak,
    weakConcepts,
  }
}

module.exports = { recommendNext }
