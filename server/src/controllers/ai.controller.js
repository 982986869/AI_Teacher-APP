'use strict'

const { validationResult } = require('express-validator')
const aiService = require('../services/ai.service')
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

module.exports = { generateLesson, getLesson, getLessons, deleteLesson, askDoubt, getDoubts }
