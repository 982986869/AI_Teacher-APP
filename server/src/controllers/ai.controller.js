'use strict'

const { validationResult } = require('express-validator')
const aiService = require('../services/ai.service')
const agentService = require('../services/agent.service')
const memoryService = require('../services/memory.service')
const plannerService = require('../services/planner.service')
const progressService = require('../services/progress.service')
const lessonService = require('../services/lesson.service')
const ApiResponse = require('../utils/ApiResponse')
const { AppError } = require('../middleware/errorHandler')

// ─── POST /api/ai/lesson/generate ────────────────────────────────────────────

async function generateLesson(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { topic, subject, gradeLevel } = req.body

    const lesson = await aiService.generateLesson({
      userId: req.user.id,
      topic,
      subject,
      gradeLevel,
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

    const { text, subject, gradeLevel, lessonId, slideIndex, history, level, pending } = req.body

    const result = await agentService.ask({
      userId: req.user.id,
      text,
      subject,
      gradeLevel,
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

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  if (res.flushHeaders) res.flushHeaders()
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

  const { text, subject, gradeLevel, lessonId, slideIndex, history, level, pending } = req.body
  try {
    const final = await agentService.askStream(
      {
        userId: req.user.id, text, subject, gradeLevel, lessonId,
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

// ─── GET /api/ai/plan ─────────────────────────────────────────────────────────
async function getPlan(req, res, next) {
  try {
    const plan = await plannerService.recommendNext(req.user.id, req.query.subject)
    return ApiResponse.success(res, plan)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  generateLesson, getLesson, getLessons, deleteLesson, askDoubt, getDoubts,
  ask, askStream, startRevision, updateProgress, getProgress,
  recordMemory, getMemorySummary, getPlan,
}
