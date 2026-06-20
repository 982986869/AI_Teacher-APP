'use strict'

const { validationResult } = require('express-validator')
const knowledgeService = require('../services/knowledge.service')
const ApiResponse = require('../utils/ApiResponse')
const { AppError } = require('../middleware/errorHandler')
const { isSupportedUpload, extractText } = require('../utils/extractText')

// ─── POST /api/knowledge/upload  (TEACHER/ADMIN) ──────────────────────────────
async function uploadKnowledge(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { title, description, subject, gradeLevel } = req.body
    let text
    let type
    let originalFilename = null
    let mimeType = null

    if (req.file) {
      if (!isSupportedUpload({ mimeType: req.file.mimetype, filename: req.file.originalname })) {
        throw new AppError('Unsupported file type. Upload a .txt or .md file, or send raw text.', 415)
      }
      text = extractText(req.file.buffer)
      originalFilename = req.file.originalname
      mimeType = req.file.mimetype
      type = /\.(md|markdown)$/i.test(req.file.originalname) ? 'markdown' : 'text'
    } else if (typeof req.body.text === 'string' && req.body.text.trim()) {
      text = req.body.text
      type = req.body.type === 'markdown' ? 'markdown' : 'text'
    } else {
      throw new AppError('Provide a file (.txt/.md) or a non-empty "text" field.', 422)
    }

    if (!text || !text.trim()) throw new AppError('The uploaded content is empty.', 422)

    const source = await knowledgeService.ingestSource({
      userId: req.user.id,
      title,
      description,
      subject,
      gradeLevel,
      type,
      originalFilename,
      mimeType,
      text,
    })

    return ApiResponse.created(res, { source }, 'Knowledge uploaded and indexed')
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/knowledge/sources ───────────────────────────────────────────────
async function listSources(req, res, next) {
  try {
    const sources = await knowledgeService.listSources({
      subject: req.query.subject,
      gradeLevel: req.query.gradeLevel,
    })
    return ApiResponse.success(res, { sources, total: sources.length })
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /api/knowledge/sources/:id  (TEACHER/ADMIN) ───────────────────────
async function deleteSource(req, res, next) {
  try {
    const result = await knowledgeService.deleteSource(req.params.id)
    return ApiResponse.success(res, result, 'Knowledge source deleted')
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/knowledge/search ───────────────────────────────────────────────
async function searchKnowledge(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { query, topK, subject, gradeLevel, sourceIds } = req.body
    const results = await knowledgeService.searchChunks({ query, topK, subject, gradeLevel, sourceIds })
    return ApiResponse.success(res, { results, total: results.length })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/ai/knowledge-answer ────────────────────────────────────────────
async function knowledgeAnswer(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { question, topK, subject, gradeLevel, sourceIds } = req.body
    const result = await knowledgeService.answerFromKnowledge({
      question,
      topK,
      subject,
      gradeLevel,
      sourceIds,
    })
    return ApiResponse.success(res, result)
  } catch (err) {
    next(err)
  }
}

module.exports = { uploadKnowledge, listSources, deleteSource, searchKnowledge, knowledgeAnswer }
