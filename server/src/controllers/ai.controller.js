'use strict'

const { validationResult } = require('express-validator')
const aiService = require('../services/ai.service')
const teachingModes = require('../services/teachingModes')
const agentService = require('../services/agent.service')
const memoryService = require('../services/memory.service')
const plannerService = require('../services/planner.service')
const sessionService = require('../services/session.service')
const progressService = require('../services/progress.service')
const lessonService = require('../services/lesson.service')
const ApiResponse = require('../utils/ApiResponse')
const { AppError } = require('../middleware/errorHandler')

// The AI Teacher only ever knows the student's OWN class/stream (from req.scope) —
// never a client-supplied gradeLevel. Returns the class string or null.
// NOTE: the AI Teacher ALWAYS teaches the asked topic — it never refuses a question as
// "out of syllabus". Only the explanation DEPTH changes with the class (see the
// class-level guidance in lessonGeneration.prompt.js / the agent). Content restriction
// by class/stream applies to Practice/Resources/BrainGym, NOT to what the teacher will
// explain when a student asks.
const scopeGrade = (req) => (req.scope && req.scope.classNum ? String(req.scope.classNum) : null)

// ─── POST /api/ai/lesson/generate ────────────────────────────────────────────

async function generateLesson(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { topic, subject } = req.body
    // The AI always teaches at the student's OWN class — never asks, never higher,
    // never a client-supplied grade.
    const grade = scopeGrade(req)
    if (!grade) return ApiResponse.error(res, 'Complete your class profile to start lessons.', 422, 'PROFILE_INCOMPLETE')

    // Optional teaching mode (the "how"): honour a valid explicit choice, else null so
    // the service auto-selects from the learner's mastery. Invalid values are ignored
    // (never an error) — the API stays backward compatible.
    const mode = teachingModes.isMode(req.body.mode) ? req.body.mode : null

    const lesson = await aiService.generateLesson({
      userId: req.user.id,
      topic,
      subject,
      gradeLevel: grade,
      board: req.scope && req.scope.board,
      stream: req.scope && req.scope.stream,
      language: req.scope && req.scope.language,
      mode,
      prefs: req.body.prefs, // learner preferences (sanitised in the service)
    })

    return ApiResponse.created(
      res,
      { lessonId: lesson.id, lesson },
      'Lesson generated successfully'
    )
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/ai/lesson/:lessonId ─────────────────────────────────────────────

async function getLesson(req, res, next) {
  try {
    const lesson = await lessonService.getLessonWithSlides(req.params.lessonId, req.user.id)
    if (!lesson) throw new AppError('Lesson not found', 404)
    return ApiResponse.success(res, { lesson })
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/ai/lessons ──────────────────────────────────────────────────────

async function getLessons(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20))
    const result = await lessonService.getUserLessons(req.user.id, { page, limit })
    return ApiResponse.success(res, result)
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /api/ai/lesson/:lessonId ──────────────────────────────────────────

async function deleteLesson(req, res, next) {
  try {
    const deleted = await lessonService.deleteLesson(req.params.lessonId, req.user.id)
    if (!deleted) throw new AppError('Lesson not found', 404)
    return ApiResponse.success(res, { lessonId: req.params.lessonId }, 'Lesson deleted')
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/ai/lesson/:lessonId/doubt ──────────────────────────────────────

async function askDoubt(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { question, slideIndex } = req.body

    const result = await aiService.answerDoubt({
      userId: req.user.id,
      lessonId: req.params.lessonId,
      question,
      slideIndex: slideIndex !== undefined ? Number(slideIndex) : undefined,
    })

    return ApiResponse.success(res, result)
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/ai/lesson/:lessonId/doubts ──────────────────────────────────────

async function getDoubts(req, res, next) {
  try {
    const result = await lessonService.getDoubtHistory(req.params.lessonId, req.user.id)
    return ApiResponse.success(res, result)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/ai/ask  (unified AI Teacher agent) ─────────────────────────────
// Intent → RAG retrieve → grounded teacher response → quality guard → resume cue.
async function ask(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { text, subject, lessonId, slideIndex, history, level, pending } = req.body
    const grade = scopeGrade(req)
    if (!grade) return ApiResponse.error(res, 'Complete your class profile to use the AI Teacher.', 422, 'PROFILE_INCOMPLETE')

    const result = await agentService.ask({
      userId: req.user.id,
      text,
      subject,
      gradeLevel: grade,
      lessonId,
      slideIndex: slideIndex !== undefined && slideIndex !== null ? Number(slideIndex) : undefined,
      history,
      level,
      pending,
    })

    return ApiResponse.success(res, result)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/ai/ask/stream  (Server-Sent Events) ────────────────────────────
// Streams the teacher answer: `meta` event first, then `delta` chunks, then
// `done` with the full guarded result (intent, source, pending, resumeCue…).
async function askStream(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

  const { text, subject, lessonId, slideIndex, history, level, pending } = req.body
  // Need the class to know WHICH LEVEL to teach at — but we never refuse the topic.
  const grade = scopeGrade(req)
  if (!grade) return ApiResponse.error(res, 'Complete your class profile to use the AI Teacher.', 422, 'PROFILE_INCOMPLETE')

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  if (res.flushHeaders) res.flushHeaders()
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

  try {
    const final = await agentService.askStream(
      {
        userId: req.user.id, text, subject, gradeLevel: grade, lessonId,
        slideIndex: slideIndex !== undefined && slideIndex !== null ? Number(slideIndex) : undefined,
        history, level, pending,
      },
      { onMeta: (m) => send('meta', m), onDelta: (t) => send('delta', { t }) }
    )
    send('done', final)
  } catch (err) {
    send('error', { error: err && err.message ? err.message : 'stream failed' })
  }
  res.end()
}

// ─── POST /api/ai/revision  (weak-topic revision mode) ────────────────────────
async function startRevision(req, res, next) {
  try {
    const result = await agentService.startRevision({ userId: req.user.id, subject: req.body.subject })
    return ApiResponse.success(res, result)
  } catch (err) {
    next(err)
  }
}

// ─── Lesson progress tracking ─────────────────────────────────────────────────
async function updateProgress(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)
    const result = await progressService.updateProgress({
      userId: req.user.id,
      lessonId: req.params.lessonId,
      slideIndex: Number(req.body.slideIndex),
      total: req.body.total !== undefined ? Number(req.body.total) : undefined,
      studyTimeSeconds: req.body.studyTimeSeconds !== undefined ? Number(req.body.studyTimeSeconds) : undefined,
      concept: req.body.concept,
    })
    return ApiResponse.success(res, result)
  } catch (err) {
    next(err)
  }
}

async function getProgress(req, res, next) {
  try {
    const result = await progressService.getProgress(req.user.id, req.params.lessonId)
    return ApiResponse.success(res, result)
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/ai/lessons/progress ─────────────────────────────────────────────
// The user's lessons merged with their progress (for "completed lessons" + resume).
async function getLessonsProgress(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 30))
    const { lessons, total, totalPages } = await lessonService.getUserLessons(req.user.id, { page, limit })
    const progressById = await progressService.getProgressForLessons(req.user.id, lessons.map((l) => l.id))
    const merged = lessons.map((l) => {
      const p = progressById[l.id] || null
      return {
        ...l,
        percent: p ? p.percent : 0,
        completed: p ? p.completed : false,
        lastSlideIndex: p ? p.lastSlideIndex : 0,
        studyTimeSeconds: p ? p.studyTimeSeconds : 0,
        currentConcept: p ? p.currentConcept : null,
      }
    })
    return ApiResponse.success(res, { lessons: merged, total, page, totalPages })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/ai/memory/event ────────────────────────────────────────────────
// Record a learning signal: { type: 'doubt'|'mistake'|'quiz', subject, chapter, detail }
async function recordMemory(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)
    const { type, subject, chapter, detail } = req.body
    const result = await memoryService.recordEvent({ userId: req.user.id, type, subject, chapter, detail })
    return ApiResponse.success(res, result)
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/ai/memory/summary ───────────────────────────────────────────────
async function getMemorySummary(req, res, next) {
  try {
    const summary = await memoryService.getSummary(req.user.id)
    return ApiResponse.success(res, summary)
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/ai/chapters/progress ────────────────────────────────────────────
// Chapter-based learning view: per-chapter completion %, completed/in-progress,
// weak/strong flags, and the recommended next chapter. Composes existing systems.
async function getChaptersProgress(req, res, next) {
  try {
    const subject = req.query.subject
    const [chapters, weak, strong, plan] = await Promise.all([
      progressService.getChapterProgress(req.user.id, subject),
      memoryService.getWeakChapters(req.user.id, { subject, limit: 50 }),
      memoryService.getStrongChapters(req.user.id, { limit: 50 }),
      plannerService.recommendNext(req.user.id, subject).catch(() => ({})),
    ])
    const weakSet = new Set(weak.filter((w) => w.weakness > 0).map((w) => w.chapter))
    const strongSet = new Set(strong.map((s) => s.chapter))
    const enriched = chapters.map((c) => ({ ...c, weak: weakSet.has(c.chapter), strong: strongSet.has(c.chapter) }))
    return ApiResponse.success(res, {
      chapters: enriched,
      weakChapters: weak.filter((w) => w.weakness > 0),
      strongChapters: strong,
      recommendedChapter: plan && plan.chapter
        ? { subject: plan.subject, chapter: plan.chapter, concept: plan.concept || null, reason: plan.reason, action: plan.action }
        : null,
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/ai/plan ─────────────────────────────────────────────────────────
async function getPlan(req, res, next) {
  try {
    const plan = await plannerService.recommendNext(req.user.id, req.query.subject)
    return ApiResponse.success(res, plan)
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/ai/session/resume ───────────────────────────────────────────────
// "Welcome back" continuity: what we studied last + the weak concept to continue.
async function getResume(req, res, next) {
  try {
    const resume = await sessionService.getResumeContext(req.user.id, {
      subject: req.query.subject,
      user: req.user,
    })
    return ApiResponse.success(res, resume)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  generateLesson, getLesson, getLessons, deleteLesson, askDoubt, getDoubts,
  ask, askStream, startRevision, updateProgress, getProgress, getLessonsProgress,
  getChaptersProgress, recordMemory, getMemorySummary, getPlan, getResume,
}
