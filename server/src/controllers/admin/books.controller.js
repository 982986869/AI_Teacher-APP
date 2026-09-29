'use strict'

// Admin side of uploaded books: upload a PDF, see what was extracted, generate
// content per chapter, review it, and decide what students may see.
//
// Every write here is admin-only. The student side (routes/books.js) has read verbs
// only — a student cannot edit because there is no endpoint to call, not because a
// button is hidden.

const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const books = require('../../services/books.service')
const generator = require('../../services/bookGenerate.service')
const audit = require('../../services/admin/audit.service')

const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ''))

async function list(req, res, next) {
  try {
    return ApiResponse.success(res, await books.list({ search: req.query.search, status: req.query.status }))
  } catch (e) { return next(e) }
}

async function upload(req, res, next) {
  try {
    if (!req.file) throw new AppError('Choose a PDF to upload.', 422)
    if (req.file.mimetype !== 'application/pdf' && !/\.pdf$/i.test(req.file.originalname || '')) {
      throw new AppError('Only PDF files can be uploaded.', 415)
    }
    const title = String(req.body.title || req.file.originalname || 'Untitled').replace(/\.pdf$/i, '').trim()

    const out = await books.ingest(req.file.buffer, {
      title,
      subjectId: req.body.subjectId || null,
      classLevel: req.body.classLevel ? parseInt(req.body.classLevel, 10) : null,
      filename: req.file.originalname,
      userId: req.user && req.user.id,
      userName: req.user && req.user.name,
    })

    // A file we already hold is not an error — it is the fingerprint doing its job,
    // and the admin should be told which book it matched rather than shown a failure.
    if (out.duplicate) {
      return ApiResponse.success(res, { duplicate: true, book: out.book },
        `Already uploaded as "${out.book.title}" — nothing was re-processed.`)
    }

    audit.record(req, { module: 'content', action: 'book.upload', targetType: 'book', after: { bookId: out.bookId, title, pages: out.pages, chapters: out.chapters } }).catch(() => {})
    return ApiResponse.created(res, out, `Extracted ${out.pages} pages into ${out.chapters} chapter${out.chapters === 1 ? '' : 's'}.`)
  } catch (e) { return next(e) }
}

async function chapters(req, res, next) {
  try {
    if (!isUuid(req.params.id)) throw new AppError('Invalid book', 400)
    return ApiResponse.success(res, await books.chapters(req.params.id))
  } catch (e) { return next(e) }
}

// Generate one kind for one chapter. Deliberately one at a time: each call costs
// money, and an admin who wants four presses four buttons and sees four results.
async function generate(req, res, next) {
  try {
    if (!isUuid(req.params.chapterId)) throw new AppError('Invalid chapter', 400)
    const kind = String(req.body.kind || '')
    if (!books.KINDS.includes(kind)) throw new AppError(`kind must be one of: ${books.KINDS.join(', ')}`, 422)
    const out = await generator.generate(req.params.chapterId, kind)
    audit.record(req, { module: 'content', action: 'book.generate', targetType: 'book', after: { chapterId: req.params.chapterId, kind } }).catch(() => {})
    return ApiResponse.created(res, out, `${kind} generated — review it before publishing.`)
  } catch (e) { return next(e) }
}

async function content(req, res, next) {
  try {
    if (!isUuid(req.params.id)) throw new AppError('Invalid content', 400)
    const row = await books.getContent(req.params.id)
    if (!row) throw new AppError('Not found', 404)
    return ApiResponse.success(res, row)
  } catch (e) { return next(e) }
}

async function setStatus(req, res, next) {
  try {
    if (!isUuid(req.params.id)) throw new AppError('Invalid content', 400)
    const status = String(req.body.status || '')
    if (!['draft', 'published'].includes(status)) throw new AppError('status must be draft or published', 422)
    await books.setContentStatus(req.params.id, status)
    audit.record(req, { module: 'content', action: 'book.content.status', targetType: 'book', after: { id: req.params.id, status } }).catch(() => {})
    return ApiResponse.success(res, { id: req.params.id, status }, status === 'published' ? 'Published to students' : 'Moved back to draft')
  } catch (e) { return next(e) }
}

async function publish(req, res, next) {
  try {
    if (!isUuid(req.params.id)) throw new AppError('Invalid book', 400)
    const published = req.body.published === true || req.body.published === 'true'
    await books.setBookPublished(req.params.id, published)
    audit.record(req, { module: 'content', action: 'book.publish', targetType: 'book', after: { id: req.params.id, published } }).catch(() => {})
    return ApiResponse.success(res, { id: req.params.id, published },
      published ? 'Book is visible to students' : 'Book hidden from students')
  } catch (e) { return next(e) }
}

async function update(req, res, next) {
  try {
    if (!isUuid(req.params.id)) throw new AppError('Invalid book', 400)
    await books.updateBook(req.params.id, {
      title: req.body.title,
      subjectId: req.body.subjectId,
      classLevel: req.body.classLevel ? parseInt(req.body.classLevel, 10) : null,
    })
    return ApiResponse.success(res, { id: req.params.id }, 'Saved')
  } catch (e) { return next(e) }
}

async function remove(req, res, next) {
  try {
    if (!isUuid(req.params.id)) throw new AppError('Invalid book', 400)
    await books.remove(req.params.id)
    audit.record(req, { module: 'content', action: 'book.delete', targetType: 'book', after: { id: req.params.id } }).catch(() => {})
    return ApiResponse.success(res, null, 'Book deleted')
  } catch (e) { return next(e) }
}

module.exports = { list, upload, chapters, generate, content, setStatus, publish, update, remove }
