'use strict'

const { booksService } = require('../services/books.service')
const ApiResponse = require('../utils/ApiResponse')
const { browsingClass } = require('../services/browsingClass')

// The class being browsed (?class= from the home page's chip, else the profile class).
const classOf = browsingClass

// GET /api/books?subject=   → the student's class's books; [] when the class has none
// (the app hides its textbook card on an empty list — this is never a 404).
async function listBooks(req, res, next) {
  try {
    const classLevel = classOf(req)
    if (!classLevel) return ApiResponse.success(res, [])
    const subject = req.query.subject ? String(req.query.subject).slice(0, 100) : undefined
    return ApiResponse.success(res, await booksService.listBooks({ classLevel, subject }))
  } catch (err) {
    // A missing table (SQL not applied in this environment yet) must not take the
    // AI Teacher home down — log, answer empty.
    if (err && err.code === 'P2021') { console.error('[books] tables missing — run prisma/sql/textbooks.sql'); return ApiResponse.success(res, []) }
    next(err)
  }
}

// GET /api/books/:bookId/chapters
async function listChapters(req, res, next) {
  try {
    return ApiResponse.success(res, await booksService.listChapters({ bookId: Number(req.params.bookId) }))
  } catch (err) { next(err) }
}

// GET /api/books/chapters/:chapterId → topics (titles only)
async function getChapter(req, res, next) {
  try {
    return ApiResponse.success(res, await booksService.getChapter({ chapterId: Number(req.params.chapterId) }))
  } catch (err) { next(err) }
}

module.exports = { listBooks, listChapters, getChapter }
