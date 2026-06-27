'use strict'

// Adaptive difficulty engine (pure logic). All difficulty movement stays WITHIN
// the student's class — these functions choose a band (easy/medium/hard/challenge),
// never a different syllabus. "challenge" is the hardest band of the same class.

const { DIFFICULTIES, DIFFICULTY_LEVEL, ADAPT } = require('./constants')

const IDX = Object.fromEntries(DIFFICULTIES.map((d, i) => [d, i])) // easy:0 … challenge:3

function clampBand(i) {
  return DIFFICULTIES[Math.max(0, Math.min(DIFFICULTIES.length - 1, i))]
}

function stepBand(difficulty, delta) {
  const i = IDX[difficulty] ?? 0
  return clampBand(i + delta)
}

function difficultyToLevel(difficulty) {
  return DIFFICULTY_LEVEL[difficulty] || 1
}

// Decide the difficulty a student should be served next, from their mastery row.
// mastery: { accuracy(0..1), attempts, currentDifficulty, hiAccuracySessions, recentFails }
function classifyDifficulty(mastery = {}) {
  const {
    accuracy = 0,
    attempts = 0,
    currentDifficulty = 'easy',
    hiAccuracySessions = 0,
    recentFails = 0,
  } = mastery

  // 1. Repeated struggle overrides everything → step down one band automatically.
  if (recentFails >= ADAPT.STRUGGLE_FAILS) {
    return stepBand(currentDifficulty, -1)
  }

  // 2. Not enough evidence yet → hold the current band (cold-start = easy).
  if (attempts < ADAPT.MIN_ATTEMPTS_TO_ADAPT) {
    return currentDifficulty || 'easy'
  }

  // 3. Accuracy-banded placement (all within the same class).
  if (accuracy < ADAPT.EASY_BELOW) return 'easy'
  if (accuracy < ADAPT.MEDIUM_BELOW) return 'medium'
  if (accuracy < ADAPT.HARD_BELOW) return 'hard'

  // 4. ≥85% — promote to challenge only after sustained high accuracy.
  if (hiAccuracySessions >= ADAPT.CHALLENGE_SESSIONS) return 'challenge'
  return 'hard'
}

// Recompute a mastery row after a completed quiz session of `total` questions
// with `correct` right. Pure: returns the NEW mastery fields; the DB layer saves.
function recomputeMastery(prev = {}, { correct, total }) {
  const t = Math.max(1, Number(total) || 0)
  const c = Math.max(0, Math.min(t, Number(correct) || 0))
  const sessionAcc = c / t

  const prevAttempts = Number(prev.attempts) || 0
  const prevCorrect = Number(prev.correct) || 0
  const attempts = prevAttempts + t
  const correctTotal = prevCorrect + c

  // Rolling accuracy: EMA so recent performance drives difficulty, with a true
  // cold-start (first session seeds the average directly).
  const prevAcc = prevAttempts === 0 ? sessionAcc : (Number(prev.accuracy) || 0)
  const accuracy = prevAttempts === 0 ? sessionAcc : +(0.6 * prevAcc + 0.4 * sessionAcc).toFixed(4)

  // Streak = consecutive correct answers (carried across sessions).
  let streak = Number(prev.streak) || 0
  streak = c === t ? streak + c : 0

  // Sustained-high-accuracy counter (for challenge promotion) and struggle counter.
  const hiAccuracySessions = sessionAcc >= ADAPT.CHALLENGE_AT
    ? (Number(prev.hiAccuracySessions) || 0) + 1
    : 0
  const recentFails = sessionAcc < ADAPT.EASY_BELOW
    ? (Number(prev.recentFails) || 0) + 1
    : 0

  const next = {
    attempts,
    correct: correctTotal,
    accuracy,
    streak,
    hiAccuracySessions,
    recentFails,
    masteryScore: +(accuracy).toFixed(4),
  }
  next.currentDifficulty = classifyDifficulty({
    accuracy,
    attempts,
    currentDifficulty: prev.currentDifficulty || 'easy',
    hiAccuracySessions,
    recentFails,
  })
  return next
}

module.exports = {
  classifyDifficulty, recomputeMastery, difficultyToLevel, stepBand, clampBand,
}
