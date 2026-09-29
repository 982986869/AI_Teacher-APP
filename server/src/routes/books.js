'use strict'

// Uploaded books, student side. READ ONLY — there is deliberately no POST, PATCH or
// DELETE here. A student cannot upload or edit a book because no such endpoint
// exists for them, not because the app hides a button; authoring lives entirely
// under /api/admin/books behind content permissions.
//
// Behind `authenticate` but not the paid gate at this level: the service only ever
// returns books an admin has published for the caller's class, and a student who
// has been given a book should be able to read it.

const { Router } = require('express')
const ApiResponse = require('../utils/ApiResponse')
const books = require('../services/books.service')
const { resolveClassNum } = require('../services/personalization/enforce')

const router = Router()
const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ''))
const classOf = (req) => {
  const m = String(req.query.class || '').match(/\d{1,2}/)
  return m ? parseInt(m[0], 10) : resolveClassNum(req)
}

// Books published for this student's class.
router.get('/', async (req, res, next) => {
  try { return ApiResponse.success(res, await books.visibleBooks(classOf(req))) } catch (e) { next(e) }
})

// Chapters that actually have something published — a chapter whose notes are still
// in draft is not worth a row a student can tap into an empty screen.
router.get('/:id/chapters', async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) return ApiResponse.error(res, 'Invalid book', 400)
    return ApiResponse.success(res, await books.visibleChapters(req.params.id))
  } catch (e) { next(e) }
})

// One piece: notes | quiz | practice | resource. Re-checks published state on both
// the content row and its book, so un-publishing a book closes every deep link.
router.get('/chapter/:chapterId/:kind', async (req, res, next) => {
  try {
    if (!isUuid(req.params.chapterId)) return ApiResponse.error(res, 'Invalid chapter', 400)
    if (!books.KINDS.includes(req.params.kind)) return ApiResponse.error(res, 'Unknown section', 400)
    const row = await books.visibleContent(req.params.chapterId, req.params.kind)
    if (!row) return ApiResponse.error(res, 'Not available', 404)
    return ApiResponse.success(res, row)
  } catch (e) { next(e) }
})

module.exports = router
