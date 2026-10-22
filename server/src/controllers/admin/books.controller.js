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
const bookConcepts = require('../../services/bookConcepts.service')
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

// Options the upload form needs. Subjects carry their concept count, because the
// subject is the filter the concept matcher searches within — not just a label.
async function meta(req, res, next) {
  try {
    return ApiResponse.success(res, { subjects: await books.subjectOptions() })
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

// Save a hand-corrected version of a generated piece.
//
// Re-validated against the same shape check generation uses: content edited into
// a shape the student app cannot render would fail silently on a phone, which is
// a far worse place to find out than here. Editing forces the row back to draft —
// a correction is a change students should not receive until someone re-reads it.
async function updateContent(req, res, next) {
  try {
    if (!isUuid(req.params.id)) throw new AppError('Invalid content', 400)
    const row = await books.getContent(req.params.id)
    if (!row) throw new AppError('Not found', 404)

    let payload = req.body.payload
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload) } catch { throw new AppError('That is not valid JSON', 422) }
    }
    try { generator.validate(row.kind, payload) }
    catch (e) { throw new AppError(String(e.message || e), 422) }

    await books.updateContentPayload(req.params.id, payload)
    await books.setContentStatus(req.params.id, 'draft')
    audit.record(req, { module: 'content', action: 'book.content.edit', targetType: 'book', after: { id: req.params.id, kind: row.kind } }).catch(() => {})
    return ApiResponse.success(res, { id: req.params.id, status: 'draft' }, 'Saved as draft — publish it when you are happy')
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

// Release (or withdraw) one chapter. Audited like the other two gates, because
// "who made this visible to students, and when" is the question asked after
// something wrong reaches a class.
async function setChapterVisible(req, res, next) {
  try {
    if (!isUuid(req.params.chapterId)) throw new AppError('Invalid chapter', 400)
    const visible = req.body.visible === true || req.body.visible === 'true'
    const ok = await books.setChapterVisible(req.params.chapterId, visible)
    if (!ok) throw new AppError('Chapter not found', 404)
    audit.record(req, { module: 'content', action: 'book.chapter.visible', targetType: 'book', after: { chapterId: req.params.chapterId, visible } }).catch(() => {})
    return ApiResponse.success(res, { id: req.params.chapterId, visible },
      visible ? 'Chapter is visible to students' : 'Chapter hidden from students')
  } catch (e) { return next(e) }
}

// What a chapter was matched to, and a way to redo it. Inspectable on purpose:
// the links drive what students are shown first, so an admin has to be able to
// see them and correct a bad match rather than wonder why an odd chapter leads.
async function concepts(req, res, next) {
  try {
    if (!isUuid(req.params.chapterId)) throw new AppError('Invalid chapter', 400)
    return ApiResponse.success(res, await bookConcepts.chapterConcepts(req.params.chapterId))
  } catch (e) { return next(e) }
}

async function relinkConcepts(req, res, next) {
  try {
    if (!isUuid(req.params.chapterId)) throw new AppError('Invalid chapter', 400)
    const out = await bookConcepts.linkChapter(req.params.chapterId, { force: true })
    audit.record(req, { module: 'content', action: 'book.chapter.relink', targetType: 'book', after: { chapterId: req.params.chapterId, ...out } }).catch(() => {})
    return ApiResponse.success(res, out, out.linked ? `Matched ${out.linked} concept${out.linked === 1 ? '' : 's'}` : 'No concept matched closely enough')
  } catch (e) { return next(e) }
}

// Rename / merge / split a chapter. The repair for bad auto-detection — a book
// here produced one chapter spanning pages 39-150, and with the PDF deleted
// after extraction these rows are the only copy of its text.
//
// Chapter text is the input to generation AND to concept matching, so editing it
// invalidates both. The concept links are redone in the background; existing
// generated content is deliberately left alone rather than wiped, because it may
// have been reviewed and corrected by hand.
async function editChapter(req, res, next) {
  try {
    if (!isUuid(req.params.chapterId)) throw new AppError('Invalid chapter', 400)
    const op = String(req.body.op || '')
    let out

    if (op === 'rename') {
      await books.renameChapter(req.params.chapterId, req.body.title)
      out = { op, title: req.body.title }
    } else if (op === 'merge-up') {
      out = { op, ...(await books.mergeChapterUp(req.params.chapterId)) }
    } else if (op === 'split') {
      out = { op, ...(await books.splitChapter(req.params.chapterId, req.body.offset, req.body.title)) }
    } else {
      throw new AppError('op must be rename, merge-up or split', 422)
    }

    if (op !== 'rename') bookConcepts.linkChapter(req.params.chapterId, { force: true }).catch(() => {})
    audit.record(req, { module: 'content', action: 'book.chapter.' + op, targetType: 'book', after: { chapterId: req.params.chapterId, ...out } }).catch(() => {})
    return ApiResponse.success(res, out, 'Chapter updated')
  } catch (e) {
    // Service-level guards ("this is the first chapter", "too short to split") are
    // the admin's answer, not a 500 — relay them as the 422s they are.
    if (e && !e.statusCode && /chapter|split|title/i.test(String(e.message))) return next(new AppError(String(e.message), 422))
    return next(e)
  }
}

// The chapter's extracted text, so an admin can find where a real chapter starts
// before splitting. Capped: these run to 146k characters.
async function chapterText(req, res, next) {
  try {
    if (!isUuid(req.params.chapterId)) throw new AppError('Invalid chapter', 400)
    const ch = await books.chapterText(req.params.chapterId)
    if (!ch) throw new AppError('Chapter not found', 404)
    const full = String(ch.text || '')
    return ApiResponse.success(res, {
      id: ch.id, title: ch.title, length: full.length, text: full.slice(0, 20000),
      truncated: full.length > 20000,
    })
  } catch (e) { return next(e) }
}

// Who has actually opened this book's content. Generation costs model spend per
// chapter per kind, and without this there is no way to tell content that gets
// read from content nobody has ever opened.
async function reads(req, res, next) {
  try {
    if (!isUuid(req.params.id)) throw new AppError('Invalid book', 400)
    return ApiResponse.success(res, await books.readStats(req.params.id))
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

module.exports = { list, meta, upload, updateContent, editChapter, chapterText, reads, chapters, generate, content, setStatus, setChapterVisible, concepts, relinkConcepts, publish, update, remove }
