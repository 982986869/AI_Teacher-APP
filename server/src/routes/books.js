'use strict'

const { Router } = require('express')
const { param, validationResult } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const ApiResponse = require('../utils/ApiResponse')
const { listBooks, listChapters, getChapter } = require('../controllers/books.controller')

const router = Router()
router.use(authenticate)

// A non-numeric id is a 422, not a Prisma error.
const checkParams = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)
  next()
}

router.get('/', listBooks)
router.get('/chapters/:chapterId', param('chapterId').isInt({ min: 1 }).withMessage('chapterId must be a positive integer').toInt(), checkParams, getChapter)
router.get('/:bookId/chapters', param('bookId').isInt({ min: 1 }).withMessage('bookId must be a positive integer').toInt(), checkParams, listChapters)

module.exports = router
