'use strict'

const db = require('../config/database')
const memory = require('./memory.service')
const { canonicalSubject } = require('./retriever.service')

const REVISE_THRESHOLD = 3 // weakness score above which we prioritise revision

// Decide what the student should do next: revise a weak chapter, or learn the
// next un-studied chapter in syllabus order.
async function recommendNext(userId, subject) {
  const subj = subject ? canonicalSubject(subject) : null
  const weak = await memory.getWeakChapters(userId, { subject: subj, limit: 5 })

  // 1) A clearly weak chapter? Revise it first.
  if (weak.length && weak[0].weakness >= REVISE_THRESHOLD) {
    const w = weak[0]
    return {
      action: 'revise',
      subject: w.subject,
      chapter: w.chapter,
      reason: `You've struggled here — ${w.mistakes} mistake(s)`
        + (w.quizTotal ? `, quiz ${w.quizCorrect}/${w.quizTotal}` : '')
        + `, ${w.doubts} doubt(s). Revise before moving on.`,
      weakChapters: weak,
    }
  }

  // 2) Otherwise the next un-studied chapter in syllabus order.
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
      subject: next.subject,
      chapter: next.chapter,
      reason: "Next chapter in the syllabus you haven't started yet.",
      weakChapters: weak,
    }
  }

  // 3) Everything touched — keep tightening weak spots.
  return {
    action: 'review',
    subject: subj,
    chapter: weak[0] ? weak[0].chapter : null,
    reason: "You've engaged with every chapter — keep revising your weakest areas.",
    weakChapters: weak,
  }
}

module.exports = { recommendNext }
