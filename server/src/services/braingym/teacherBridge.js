'use strict'

// ─── AI Teacher ↔ BrainGym bridge ───────────────────────────────────────────
// Connects a finished lesson to BrainGym practice and feeds the results back into
// the EXISTING AI-Teacher student model (memory.service + mastery.service) — no
// duplicate student model is created here.
//
//   recommendPractice()    after a lesson → "do this BrainGym drill" (matched to
//                          the student's class, current mastery, and weakest concept)
//   recordLessonPractice() after the drill → write each result into teacher memory
//                          (per-chapter) and concept mastery (per-concept EWMA)
//
// Dependencies are injected (default = the real services) so this is unit-testable.

const bgMasteryDefault = require('./mastery')
const { difficultyToLevel } = require('./difficulty')
const { parseGrade } = require('./grade')

function resolveDeps(over = {}) {
  return {
    teacherMemory: over.teacherMemory || require('../memory.service'),
    teacherMastery: over.teacherMastery || require('../mastery.service'),
    bgMastery: over.bgMastery || bgMasteryDefault,
  }
}

// BrainGym is a numeric cognitive gym (reasoning / application / understanding /
// fluency), independent of subject. "application" (word problems that APPLY a
// concept) is the best default for reinforcing a just-taught chapter.
function categoryForLesson(/* { subject, weakConcept } */) {
  return 'application'
}

// Recommend a BrainGym practice set after a lesson. Difficulty comes from the
// student's BrainGym mastery (always within their class); the theme/focus comes
// from their weakest concept in this subject (the AI-Teacher model). Read-only.
async function recommendPractice(db, { userId, subject, chapter, grade }, over = {}) {
  const d = resolveDeps(over)
  const category = categoryForLesson({ subject })
  const difficulty = await d.bgMastery.getTargetDifficulty(db, { userId, category, grade })

  // Forgetting-curve scheduling: a concept whose retention has decayed takes
  // priority — BrainGym occasionally schedules revision automatically.
  let revisionConcept = null
  try {
    if (typeof d.teacherMastery.pickRevisionConcept === 'function') {
      revisionConcept = await d.teacherMastery.pickRevisionConcept(userId, { subject })
    }
  } catch { revisionConcept = null }

  let weak = []
  try { weak = await d.teacherMastery.getWeakConcepts(userId, { subject, limit: 1 }) } catch { weak = [] }

  const isRevision = !!revisionConcept
  const focusConcept = (revisionConcept && revisionConcept.concept) || (weak[0] && weak[0].concept) || chapter || null

  return {
    practice: 'braingym',
    mode: isRevision ? 'revision' : 'reinforcement',
    category,
    difficulty,
    level: difficultyToLevel(difficulty),
    grade: parseGrade(grade).className,
    subject: subject || null,
    chapter: chapter || null,
    focusConcept,
    revision: isRevision
      ? { concept: revisionConcept.concept, state: revisionConcept.state, retention: revisionConcept.retention, daysSincePractice: revisionConcept.daysSincePractice }
      : null,
    reason: isRevision
      ? `It's been ${revisionConcept.daysSincePractice ?? 'a while'} days since you practised "${revisionConcept.concept}". A quick ${category} drill will refresh it.`
      : focusConcept
        ? `You looked a little shaky on "${focusConcept}". A quick ${category} drill at ${difficulty} level will lock it in.`
        : `Reinforce ${chapter || subject || 'today’s lesson'} with a quick ${category} drill.`,
    cta: 'Open Brain Gym',
  }
}

// Fold a BrainGym session (launched from a lesson) back into the AI-Teacher model.
// items: [{ isCorrect }] — per-question results. Best-effort per write so a single
// failure never aborts the rest.
async function recordLessonPractice({ userId, subject, chapter, conceptId, items = [] }, over = {}) {
  const d = resolveDeps(over)
  let correct = 0
  let memoryWrites = 0
  let masteryWrites = 0

  for (const it of items) {
    const ok = !!it.isCorrect
    if (ok) correct++

    if (subject) {
      try {
        await d.teacherMemory.recordEvent({ userId, type: 'quiz', subject, chapter, detail: { correct: ok, source: 'braingym' } })
        memoryWrites++
      } catch { /* non-fatal */ }
    }
    if (conceptId) {
      try {
        await d.teacherMastery.updateMastery({ userId, conceptId, signal: ok ? 'quiz_correct' : 'quiz_wrong' })
        masteryWrites++
      } catch { /* non-fatal */ }
    }
  }

  return { recorded: items.length, correct, memoryWrites, masteryWrites }
}

const CATEGORY_LABEL = { reasoning: 'Reasoning', application: 'Application', understanding: 'Understanding', fluency: 'Fluency' }

// ALWAYS-ON skill signal: every BrainGym round (teacher-linked or not) reveals the
// student's strength/weakness in a cognitive skill. Record it into the AI-Teacher
// memory under a synthetic "BrainGym" subject so the teacher can reference it
// ("your reasoning is improving") — independent of any lesson topic.
async function recordBrainGymSkill({ userId, category, items = [] }, over = {}) {
  const d = resolveDeps(over)
  const chapter = CATEGORY_LABEL[category] || category
  let written = 0
  for (const it of items) {
    try {
      await d.teacherMemory.recordEvent({ userId, type: 'quiz', subject: 'BrainGym', chapter, detail: { correct: !!it.isCorrect, source: 'braingym', category } })
      written++
    } catch { /* non-fatal */ }
  }
  return { written }
}

// Turn per-category BrainGym mastery rows into human learning signals the teacher
// can speak. Pure — takes the rows, returns phrasings + weak/strong lists.
function summariseSkills(rows = []) {
  const strong = []
  const weak = []
  const phrasings = []
  for (const r of rows) {
    const label = CATEGORY_LABEL[r.category] || r.category
    const acc = Number(r.accuracy) || 0
    if ((r.attempts || 0) < 4) continue // not enough evidence to comment yet
    if (acc >= 0.7) {
      strong.push(r.category)
      phrasings.push(`Your ${label.toLowerCase()} is improving — you're at ${Math.round(acc * 100)}% accuracy.`)
    } else if (acc < 0.5) {
      weak.push(r.category)
      phrasings.push(`You struggled with ${label.toLowerCase()} questions — let's revise this weak area.`)
    }
  }
  return { phrasings, weakCategories: weak, strongCategories: strong }
}

// Load the student's BrainGym per-category mastery and summarise it for the teacher.
async function getBrainGymSkillSummary(db, userId, { subject = 'Mental Math' } = {}) {
  let rows = []
  try { rows = await db.student_mastery.findMany({ where: { userId, subject } }) } catch { rows = [] }
  return summariseSkills(rows)
}

module.exports = {
  recommendPractice, recordLessonPractice, categoryForLesson,
  recordBrainGymSkill, summariseSkills, getBrainGymSkillSummary,
}
