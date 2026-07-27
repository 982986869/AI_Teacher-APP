'use strict'

const { validationResult } = require('express-validator')
const knowledgeService = require('../services/knowledge.service')
const ApiResponse = require('../utils/ApiResponse')
const { AppError } = require('../middleware/errorHandler')
const { isSupportedUpload, classifyUpload, extractText } = require('../utils/extractText')

// Material visibility: teachers/admins see ALL uploaded material (shared class
// content); every other user (students) is scoped to the material THEY uploaded.
// Returns the userId to filter by, or null for "see everything".
function scopeOwnerId(req) {
  const role = String(req.user?.role || '').toUpperCase()
  return role === 'TEACHER' || role === 'ADMIN' ? null : req.user.id
}

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
      const meta = { mimeType: req.file.mimetype, filename: req.file.originalname }
      if (!isSupportedUpload(meta)) {
        throw new AppError('Unsupported file type. Upload a .txt, .md, .pdf, or an image (jpg/png/webp), or send raw text.', 415)
      }
      // PDFs/images are transcribed via the AI provider — this can take a few seconds.
      text = await extractText(req.file.buffer, meta)
      originalFilename = req.file.originalname
      mimeType = req.file.mimetype
      type = classifyUpload(meta) // 'text' | 'markdown' | 'pdf' | 'image'
    } else if (typeof req.body.text === 'string' && req.body.text.trim()) {
      text = req.body.text
      type = req.body.type === 'markdown' ? 'markdown' : 'text'
    } else {
      throw new AppError('Provide a file (.txt/.md) or a non-empty "text" field.', 422)
    }

    if (!text || !text.trim()) throw new AppError('The uploaded content is empty.', 422)

    // Auto-tag the subject when the uploader didn't set one (common for file
    // uploads), so the material is filterable and the subject chips are useful.
    // Best-effort only — never blocks or fails the upload.
    let finalSubject = subject
    if (!finalSubject || !String(finalSubject).trim()) {
      try {
        const { getAIProvider } = require('../providers')
        const provider = getAIProvider()
        if (typeof provider.classifySubject === 'function') {
          const guessed = await provider.classifySubject(text)
          if (guessed) finalSubject = guessed
        }
      } catch (_) { /* keep subject unset on any failure */ }
    }

    const source = await knowledgeService.ingestSource({
      userId: req.user.id,
      title,
      description,
      subject: finalSubject,
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
      ownerId: scopeOwnerId(req),
    })
    return ApiResponse.success(res, { sources, total: sources.length })
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /api/knowledge/sources/:id  (TEACHER/ADMIN) ───────────────────────
async function deleteSource(req, res, next) {
  try {
    const result = await knowledgeService.deleteSource(req.params.id, {
      userId: req.user.id,
      role: String(req.user?.role || '').toUpperCase(),
    })
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
    const results = await knowledgeService.searchChunks({
      query, topK, subject, gradeLevel, sourceIds, ownerId: scopeOwnerId(req),
    })
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

    const { question, topK, subject, gradeLevel, sourceIds, history } = req.body
    const result = await knowledgeService.answerFromKnowledge({
      question,
      topK,
      subject,
      gradeLevel,
      sourceIds,
      history,
      ownerId: scopeOwnerId(req),
    })
    return ApiResponse.success(res, result)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/ai/knowledge-answer/structured ─────────────────────────────────
// Grounded answer as a structured "teaching" object (intro, steps, formula,
// diagram, gaps) so the app can draw a whiteboard diagram + render math.
async function knowledgeAnswerStructured(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { question, topK, subject, gradeLevel, sourceIds, history } = req.body
    const result = await knowledgeService.answerStructured({
      question, topK, subject, gradeLevel, sourceIds, history, ownerId: scopeOwnerId(req),
    })
    return ApiResponse.success(res, result)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/ai/knowledge-answer/extend ─────────────────────────────────────
// On-demand gap-filling: general knowledge IS allowed here (worked example /
// full solution / who-gave-this) when the material lacks it. The app labels the
// reply clearly as "beyond your material". `gapKind` steers the task.
async function knowledgeAnswerExtend(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { question, gapKind, topK, subject, gradeLevel, sourceIds, history } = req.body
    const result = await knowledgeService.answerExtended({
      question, gapKind, topK, subject, gradeLevel, sourceIds, history, ownerId: scopeOwnerId(req),
    })
    return ApiResponse.success(res, result)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/knowledge/solve-photo  (multipart) ─────────────────────────────
// Reads a homework question from an uploaded photo and returns a step-by-step
// solution as a structured teaching object.
async function solvePhoto(req, res, next) {
  try {
    if (!req.file) throw new AppError('Attach a photo of the question.', 422)
    const { mimetype, originalname, buffer } = req.file
    if (!/^image\//.test(mimetype || '')) {
      throw new AppError('Please attach an image (JPG, PNG, or WEBP) of the question.', 415)
    }
    const result = await knowledgeService.solvePhoto({
      buffer, mimeType: mimetype, filename: originalname, hint: req.body.hint,
    })
    return ApiResponse.success(res, result)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/ai/knowledge-answer/stream  (SSE) ──────────────────────────────
// Streams the grounded answer token-by-token so the UI can reveal it live.
async function knowledgeAnswerStream(req, res) {
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

  try {
    const { question, topK, subject, gradeLevel, sourceIds, history } = req.body
    const final = await knowledgeService.answerFromKnowledgeStream(
      { question, topK, subject, gradeLevel, sourceIds, history, ownerId: scopeOwnerId(req) },
      { onMeta: (m) => send('meta', m), onDelta: (t) => send('delta', { t }) },
    )
    send('done', final)
  } catch (err) {
    send('error', { error: err && err.message ? err.message : 'stream failed' })
  }
  res.end()
}

module.exports = {
  uploadKnowledge,
  listSources,
  deleteSource,
  searchKnowledge,
  knowledgeAnswer,
  knowledgeAnswerStructured,
  knowledgeAnswerExtend,
  knowledgeAnswerStream,
  solvePhoto,
}
