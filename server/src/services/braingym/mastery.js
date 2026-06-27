'use strict'

// Adaptive engine — per-category, per-student mastery (DB-backed). Each function
// takes the Prisma client as `db` so it can be unit-tested with an in-memory fake.

const { recomputeMastery, classifyDifficulty } = require('./difficulty')
const { parseGrade } = require('./grade')

function defaultMastery(grade) {
  return {
    attempts: 0, correct: 0, accuracy: 0, streak: 0, masteryScore: 0,
    currentDifficulty: 'easy', hiAccuracySessions: 0, recentFails: 0,
    grade: parseGrade(grade).className,
  }
}

// Prisma exposes the compound unique by its FIELD name (userId_category_subject);
// the `map:` only renames the DB constraint, not the client key.
const masteryWhere = (userId, category, subject) => ({ userId_category_subject: { userId, category, subject } })

async function getMasteryRow(db, { userId, category, subject = 'Mental Math' }) {
  try {
    return await db.student_mastery.findUnique({ where: masteryWhere(userId, category, subject) })
  } catch {
    return null
  }
}

// The difficulty this student should be served next for a category (within class).
async function getTargetDifficulty(db, { userId, category, subject = 'Mental Math', grade }) {
  const row = await getMasteryRow(db, { userId, category, subject })
  if (!row) return 'easy'
  return classifyDifficulty(row)
}

// Apply a completed session (correct/total) → upsert the mastery row.
// The read-modify-write (rolling EMA depends on the prior row) runs inside a
// transaction so the read and the write commit atomically. In practice a single
// student plays quizzes sequentially on one device, so concurrent sessions for
// the same (user, category) are vanishingly rare; the transaction guarantees the
// write is never partially applied.
async function applySessionResult(db, { userId, category, subject = 'Mental Math', grade, correct, total }) {
  const className = parseGrade(grade).className

  const run = async (tx) => {
    const prev = (await getMasteryRow(tx, { userId, category, subject })) || defaultMastery(grade)
    const next = recomputeMastery(prev, { correct, total })
    const data = {
      attempts: next.attempts, correct: next.correct, accuracy: next.accuracy,
      streak: next.streak, masteryScore: next.masteryScore,
      currentDifficulty: next.currentDifficulty,
      hiAccuracySessions: next.hiAccuracySessions, recentFails: next.recentFails,
      lastSeen: new Date(), updatedAt: new Date(),
    }
    await tx.student_mastery.upsert({
      where: masteryWhere(userId, category, subject),
      update: data,
      create: { userId, category, subject, grade: className, ...data },
    })
    return { ...next, grade: className }
  }

  // Use a transaction when the client supports it; degrade gracefully otherwise.
  if (typeof db.$transaction === 'function') return db.$transaction(run)
  return run(db)
}

module.exports = { defaultMastery, getMasteryRow, getTargetDifficulty, applySessionResult }
