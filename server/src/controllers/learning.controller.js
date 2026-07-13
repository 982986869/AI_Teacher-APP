'use strict'

// Mastery Lifecycle read APIs. Thin controllers over mastery.service (the existing
// per-concept engine) — no new student model. All routes require auth; the user
// comes from req.user (never the client).

const ApiResponse = require('../utils/ApiResponse')
const db = require('../config/database')
const mastery = require('../services/mastery.service')
const memory = require('../services/memory.service')
const mistakeBook = require('../services/mistakeBook.service')
const braingym = require('../services/braingym.service')
const teacherBridge = require('../services/braingym/teacherBridge')
const resultsService = require('../services/results.service')

const subjectOf = (req) => (req.query.subject ? String(req.query.subject) : undefined)
const limitOf = (req, def) => Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || def))

// GET /api/learning/profile
async function profile(req, res, next) {
  try {
    return ApiResponse.success(res, await mastery.getLearningProfile(req.user.id, { subject: subjectOf(req) }))
  } catch (err) { next(err) }
}

// GET /api/learning/timeline
async function timeline(req, res, next) {
  try {
    const data = await mastery.getMasteryTimeline(req.user.id, { subject: subjectOf(req), limit: limitOf(req, 30) })
    return ApiResponse.success(res, { timeline: data })
  } catch (err) { next(err) }
}

// GET /api/learning/weak
async function weak(req, res, next) {
  try {
    const data = await mastery.getWeakConcepts(req.user.id, { subject: subjectOf(req), limit: limitOf(req, 8) })
    return ApiResponse.success(res, { weak: data })
  } catch (err) { next(err) }
}

// GET /api/learning/strong
async function strong(req, res, next) {
  try {
    const data = await mastery.getStrongConcepts(req.user.id, { subject: subjectOf(req), limit: limitOf(req, 8) })
    return ApiResponse.success(res, { strong: data })
  } catch (err) { next(err) }
}

// GET /api/learning/revision
async function revision(req, res, next) {
  try {
    const data = await mastery.getConceptsNeedingRevision(req.user.id, { subject: subjectOf(req), limit: limitOf(req, 8) })
    return ApiResponse.success(res, { needsRevision: data })
  } catch (err) { next(err) }
}

// GET /api/learning/revision-calendar — spaced-repetition due + upcoming reviews.
async function revisionCalendar(req, res, next) {
  try {
    return ApiResponse.success(res, await mastery.getRevisionCalendar(req.user.id, { subject: subjectOf(req) }))
  } catch (err) { next(err) }
}

// GET /api/learning/mistakes — personal mistake book.
async function mistakes(req, res, next) {
  try {
    const status = req.query.status === 'resolved' || req.query.status === 'unresolved' ? req.query.status : undefined
    const data = await mistakeBook.listMistakes(req.user.id, { status, subject: subjectOf(req), limit: limitOf(req, 50) })
    return ApiResponse.success(res, { mistakes: data })
  } catch (err) { next(err) }
}

// POST /api/learning/mistakes/:id/resolve — mark a mistake reviewed/resolved.
async function resolveMistake(req, res, next) {
  try {
    await mistakeBook.resolveMistake(req.user.id, req.params.id)
    return ApiResponse.success(res, { ok: true })
  } catch (err) { next(err) }
}

// GET /api/learning/analytics — one composed study-analytics payload (Phase 7).
// Pure composition over EXISTING services — no new aggregation engine.
async function analytics(req, res, next) {
  try {
    const userId = req.user.id
    const [summary, profile_, revisionCal, skills, bgProgress, openMistakes] = await Promise.all([
      memory.getSummary(userId).catch(() => ({})),
      mastery.getLearningProfile(userId).catch(() => ({})),
      mastery.getRevisionCalendar(userId).catch(() => ({ dueCount: 0, due: [] })),
      teacherBridge.getBrainGymSkillSummary(db, userId).catch(() => ({ phrasings: [], weakCategories: [], strongCategories: [] })),
      braingym.getProgress(userId).catch(() => ({})),
      mistakeBook.countOpen(userId).catch(() => 0),
    ])
    return ApiResponse.success(res, {
      // chapters (from lesson/quiz memory)
      weakChapters: summary.weakChapters || [],
      strongChapters: summary.strongChapters || [],
      // concept lifecycle
      conceptStates: profile_.byState || {},
      mastered: profile_.mastered || [],
      forgotten: (profile_.needsRevision || []).filter((c) => c.state === 'Forgotten'),
      revisionDue: revisionCal.due || [],
      revisionDueCount: revisionCal.dueCount || 0,
      // engagement
      studyStreak: summary.learningStreak || 0,
      studySeconds: summary.studySeconds || 0,
      lessonsCompleted: summary.lessonsCompleted || 0,
      averageAccuracy: summary.quizAccuracy != null ? Math.round(summary.quizAccuracy * 100) : null,
      // BrainGym
      brainGym: {
        totalXp: bgProgress.totalXp || 0,
        quizzes: bgProgress.quizzesCompleted || 0,
        accuracy: bgProgress.accuracy || 0,
        streak: bgProgress.currentStreak || 0,
        skillSignals: skills.phrasings || [],
        weakSkills: skills.weakCategories || [],
        strongSkills: skills.strongCategories || [],
      },
      // mistake book
      openMistakes,
      // a ready next step for the student
      recommendedNext: revisionCal.dueCount
        ? { type: 'revision', concept: revisionCal.due[0]?.concept, reason: revisionCal.due[0]?.phrasing }
        : (profile_.needsRevision && profile_.needsRevision[0])
          ? { type: 'revision', concept: profile_.needsRevision[0].concept, reason: profile_.needsRevision[0].phrasing }
          : { type: 'practice', reason: 'Keep your streak going with a quick Brain Gym round.' },
    })
  } catch (err) { next(err) }
}

// GET /api/learning/results — composed Results-dashboard payload (overview, daily
// activity hours, per-subject test breakdown, recent tests). Real data only.
async function results(req, res, next) {
  try {
    // The student's own class scopes the subject breakdown; never trust the client.
    const classLevel = req.scope && req.scope.classNum != null ? req.scope.classNum : null
    const period = ['week', 'month'].includes(req.query.period) ? req.query.period : 'week'
    const offset = Math.max(0, Math.min(520, parseInt(req.query.offset, 10) || 0))
    const data = await resultsService.getResults(req.user.id, classLevel, period, offset)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

// GET /api/learning/results/attempt/:id — section-wise breakdown for one mock
// attempt (owned by the user). Quizzes have no sections → empty array.
async function attemptDetail(req, res, next) {
  try {
    const sections = await resultsService.getAttemptSections(req.user.id, req.params.id)
    return ApiResponse.success(res, { sections })
  } catch (err) { next(err) }
}

module.exports = { profile, timeline, weak, strong, revision, revisionCalendar, mistakes, resolveMistake, analytics, results, attemptDetail }
