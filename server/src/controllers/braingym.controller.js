'use strict'

const { validationResult } = require('express-validator')
const braingym = require('../services/braingym.service')
const ApiResponse = require('../utils/ApiResponse')
const db = require('../config/database')
const pipeline = require('../services/braingym/pipeline')
const masteryEngine = require('../services/braingym/mastery')
const teacherBridge = require('../services/braingym/teacherBridge')
const mistakeBook = require('../services/mistakeBook.service')
const { CATEGORIES } = require('../services/braingym/constants')

const normCategory = (s) => (CATEGORIES.includes(s) ? s : 'reasoning')

// ─── POST /api/brain-gym/results ──────────────────────────────────────────────
async function submitResult(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { skill, level, totalQuestions, correctCount, wrongCount, timeTakenSec } = req.body
    const { session, xpEarned } = await braingym.saveResult({
      userId: req.user.id,
      skill,
      level,
      totalQuestions,
      correctCount,
      wrongCount,
      timeTakenSec,
    })

    // Update adaptive mastery for this category (drives next round's difficulty).
    // Never let this break the result save.
    try {
      await masteryEngine.applySessionResult(db, {
        userId: req.user.id,
        category: normCategory(skill),
        grade: req.user.grade,
        correct: session.correctCount,
        total: session.totalQuestions,
      })
    } catch (e) {
      console.warn('[BrainGym] mastery update skipped:', e.message)
    }

    const progress = await braingym.getProgress(req.user.id)
    console.log('[BrainGym] result saved', { userId: req.user.id, xpEarned, totalXp: progress.totalXp })
    return ApiResponse.created(res, { session, xpEarned, progress }, 'Result saved')
  } catch (err) {
    console.error('[BrainGym] result save failed', err.code || '', err.message)
    next(err)
  }
}

// ─── GET /api/brain-gym/progress ──────────────────────────────────────────────
async function getProgress(req, res, next) {
  try {
    const progress = await braingym.getProgress(req.user.id)
    return ApiResponse.success(res, progress)
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/brain-gym/leaderboard?period= ───────────────────────────────────
async function getLeaderboard(req, res, next) {
  try {
    const period = ['weekly', 'monthly', 'all'].includes(req.query.period) ? req.query.period : 'all'
    const data = await braingym.getLeaderboard({ period, userId: req.user.id })
    return ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/brain-gym/questions ────────────────────────────────────────────
// Adaptive question retrieval for a wheel category. The student's class (grade)
// comes from their authenticated profile — never from the client — so the
// class-level guardrail cannot be bypassed.
async function getQuestions(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const category = normCategory(req.body.skill || req.body.category)
    const count = Math.min(20, Math.max(1, parseInt(req.body.count, 10) || 5))
    const grade = req.user.grade || 'Class 9'
    const teacherConcept = req.body.teacherConcept || req.body.topic || req.body.concept || null

    const { questions, difficulty, level } = await pipeline.getQuestions(db, {
      userId: req.user.id, grade, category, count, teacherConcept,
    })

    // Expose only what the numeric quiz needs (+ ids for attempt logging).
    // `answer` is numeric so the existing keypad comparison works unchanged.
    const payload = questions.map((q) => ({
      id: q.id || null,
      seedId: q.seedId || null,
      source: q.source,
      category: q.category,
      difficulty: q.difficulty || difficulty,
      q: q.q,
      answer: q.answerValue != null ? q.answerValue : Number(q.answer),
      options: q.options || null,
    }))

    return ApiResponse.success(res, { questions: payload, difficulty, level, category })
  } catch (err) {
    console.error('[BrainGym] getQuestions failed', err.message)
    next(err)
  }
}

// ─── POST /api/brain-gym/attempts ─────────────────────────────────────────────
// Records per-question attempts (feeds mastery + per-question performance). Best
// effort: a failure here must never block the quiz UX.
async function submitAttempts(req, res, next) {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 50) : []
    const result = await pipeline.recordAttempts(db, {
      userId: req.user.id,
      sessionId: req.body.sessionId || null,
      grade: req.user.grade,
      items,
    })
    // Capture wrong answers into the personal mistake book (best-effort).
    mistakeBook.captureWrong({ userId: req.user.id, source: 'braingym', grade: req.user.grade, items })
      .catch((e) => console.warn('[BrainGym] mistake capture skipped:', e.message))
    return ApiResponse.success(res, result)
  } catch (err) {
    console.error('[BrainGym] submitAttempts failed', err.message)
    next(err)
  }
}

// Shared: shape served questions for the numeric quiz (+ ids for telemetry).
function shapeQuestions(questions, difficulty) {
  return questions.map((q) => ({
    id: q.id || null,
    seedId: q.seedId || null,
    source: q.source,
    category: q.category,
    skill: q.category,
    level: q.level != null ? q.level : undefined,
    difficulty: q.difficulty || difficulty,
    q: q.q,
    answer: q.answerValue != null ? q.answerValue : Number(q.answer),
    options: q.options || null,
  }))
}

// ─── GET /api/brain-gym/adaptive/questions ────────────────────────────────────
// Same adaptive retrieval as POST /questions, exposed as GET with query params.
// Grade is taken from the authenticated profile (authoritative) — a client-sent
// `grade` is only a fallback when the profile has none, so the class guardrail
// cannot be bypassed by the client.
async function getAdaptiveQuestions(req, res, next) {
  try {
    const category = normCategory(req.query.category || req.query.skill)
    const count = Math.min(20, Math.max(1, parseInt(req.query.count, 10) || 5))
    // Grade is server-authoritative (from the authenticated profile). A
    // client-supplied grade is NEVER trusted — that would let a student request
    // higher-class questions and bypass the guardrail.
    const grade = req.user.grade || 'Class 9'
    const subject = req.query.subject || 'Mental Math'
    // Optional SOFT teacher boost (from a lesson hand-off). Absent = pure mixed practice.
    const teacherConcept = req.query.teacherConcept || req.query.topic || req.query.concept || null

    const { questions, difficulty, level } = await pipeline.getQuestions(db, {
      userId: req.user.id, grade, category, subject, count, teacherConcept,
    })
    return ApiResponse.success(res, { questions: shapeQuestions(questions, difficulty), difficulty, level, category })
  } catch (err) {
    console.error('[BrainGym] getAdaptiveQuestions failed', err.message)
    next(err)
  }
}

// ─── POST /api/brain-gym/adaptive/submit ──────────────────────────────────────
// One-call completion: grade the round server-side, record per-question attempts,
// update per-category mastery (difficulty/accuracy/streak/recentFails), and return
// the score + the adapted difficulty for next time. This is the canonical adaptive
// submit; it does NOT also POST /results (XP), so clients pick one path and mastery
// is never double-counted.
async function submitAdaptive(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const category = normCategory(req.body.category || req.body.skill)
    const grade = req.user.grade || 'Class 9' // server-authoritative; client grade ignored
    const subject = req.body.subject || 'Mental Math'
    const totalTimeMs = Math.max(0, parseInt(req.body.timeMs, 10) || 0)

    // Accept either { items:[{...}] } directly, or { questions:[...], answers:[...] }.
    let items = []
    if (Array.isArray(req.body.items) && req.body.items.length) {
      items = req.body.items
    } else {
      const questions = Array.isArray(req.body.questions) ? req.body.questions : []
      const answers = Array.isArray(req.body.answers) ? req.body.answers : []
      items = questions.map((q, i) => {
        const given = answers[i]
        const correctVal = q.answer != null ? q.answer : q.answerValue
        return {
          id: q.id || null,
          seedId: q.seedId || null,
          source: q.source || (q.id ? 'generated' : 'seed'),
          category: q.category || category,
          difficulty: q.difficulty || null,
          isCorrect: given != null && Number(given) === Number(correctVal),
          answerGiven: given != null ? String(given) : null,
        }
      })
    }
    items = items.slice(0, 50)
    const perQ = items.length ? Math.round(totalTimeMs / items.length) : 0
    items = items.map((it) => ({ ...it, timeMs: it.timeMs != null ? it.timeMs : perQ }))

    const total = items.length
    const correct = items.filter((it) => it.isCorrect).length
    const accuracy = total ? Math.round((correct / total) * 100) : 0

    // 1. per-question attempts + question performance counters
    await pipeline.recordAttempts(db, { userId: req.user.id, grade, items })
    mistakeBook.captureWrong({ userId: req.user.id, source: 'braingym', grade, items })
      .catch((e) => console.warn('[BrainGym] mistake capture skipped:', e.message))

    // 2. per-category mastery + adapted difficulty
    let mastery = null
    try {
      mastery = await masteryEngine.applySessionResult(db, {
        userId: req.user.id, category, subject, grade, correct, total,
      })
    } catch (e) {
      console.warn('[BrainGym] mastery update skipped:', e.message)
    }

    const newDifficulty = mastery?.currentDifficulty || 'easy'
    const nextRecommendation = {
      category,
      difficulty: newDifficulty,
      message: accuracy >= 85
        ? 'Great accuracy — stepping you up within your class.'
        : accuracy < 40
          ? 'Let’s reinforce the basics at an easier level.'
          : 'Keep going — difficulty tuned to your performance.',
    }

    // ALWAYS fold the BrainGym result into the AI-Teacher model as a SKILL signal —
    // not because it was a teacher topic, but because it reveals cognitive
    // strength/weakness ("your reasoning is improving"). Best-effort.
    try {
      await teacherBridge.recordBrainGymSkill({ userId: req.user.id, category, items })
    } catch (e) {
      console.warn('[BrainGym] skill signal skipped:', e.message)
    }

    // If this drill was launched FROM a lesson (subject/chapter provided), ALSO
    // fold it into that lesson's concept mastery. Optional — never required.
    if (req.body.subject) {
      try {
        await teacherBridge.recordLessonPractice({
          userId: req.user.id,
          subject: req.body.subject,
          chapter: req.body.chapter || null,
          conceptId: req.body.conceptId || null,
          items,
        })
      } catch (e) {
        console.warn('[BrainGym] teacher memory writeback skipped:', e.message)
      }
    }

    return ApiResponse.success(res, {
      score: correct, total, accuracy, newDifficulty, mastery, nextRecommendation,
    })
  } catch (err) {
    console.error('[BrainGym] submitAdaptive failed', err.message)
    next(err)
  }
}

// ─── GET /api/brain-gym/recommend ─────────────────────────────────────────────
// After a lesson, recommend a BrainGym drill matched to the student's class,
// current mastery, and weakest concept in the lesson's subject. Read-only.
async function recommend(req, res, next) {
  try {
    const grade = req.user.grade || 'Class 9'
    const subject = req.query.subject || null
    const chapter = req.query.chapter || null
    const rec = await teacherBridge.recommendPractice(db, { userId: req.user.id, subject, chapter, grade })
    return ApiResponse.success(res, rec)
  } catch (err) {
    console.error('[BrainGym] recommend failed', err.message)
    next(err)
  }
}

module.exports = {
  submitResult, getProgress, getLeaderboard,
  getQuestions, submitAttempts,
  getAdaptiveQuestions, submitAdaptive, recommend,
}
