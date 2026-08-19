'use strict'

// Support tickets — mounted at /api/support. Every route needs a signed-in user; the
// staff-only ones (queue, resolve) additionally check admin_role inside the controller,
// so a student token can reach its own tickets and nothing else.

const { Router } = require('express')
const multer = require('multer')
const { body } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const ctrl = require('../controllers/support.controller')

const router = Router()
router.use(authenticate)

// 10 MB, one file — matches the cap the app enforces before it even opens the picker
// (src/components/support/pickAttachment.js), so the two can't disagree.
const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
})

router.get('/tickets', ctrl.listMine)
router.get('/queue', ctrl.queue)

router.post('/tickets', [
  body('topicId').isString().trim().notEmpty().withMessage('A topic is required.'),
  body('team').isString().trim().notEmpty().withMessage('A team is required.'),
  body('topicLabel').optional({ checkFalsy: true }).isString(),
  body('message').optional({ checkFalsy: true }).isString(),
  body('phone').optional({ checkFalsy: true }).isString(),
  body('childName').optional({ checkFalsy: true }).isString(),
], ctrl.create)

router.get('/tickets/:id', ctrl.getOne)

router.post('/tickets/:id/messages', [
  body('text').isString().trim().notEmpty().withMessage('Message cannot be empty.'),
], ctrl.addMessage)

// Multer aborts an oversize upload with its own terse error; the app already refuses
// >10 MB up front, so this is the backstop for anything that slips past.
router.post('/tickets/:id/attachments', (req, res, next) => {
  attachmentUpload.single('file')(req, res, (err) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, error: 'That file is over the 10 MB limit.' })
    }
    if (err) return next(err)
    return next()
  })
}, ctrl.addAttachment)

router.patch('/tickets/:id/resolve', [
  body('summary').isString().trim().notEmpty().withMessage('A resolution summary is required.'),
], ctrl.resolve)

router.post('/tickets/:id/close', ctrl.close)
router.post('/tickets/:id/reopen', ctrl.reopen)

// The owner's 1–5. Range-checked in the controller (and again by a CHECK constraint on the
// column), so no validator here beyond "something was sent".
router.post('/tickets/:id/rating', [
  body('rating').exists().withMessage('A rating is required.'),
], ctrl.rate)
router.post('/tickets/:id/read', ctrl.markRead)

router.post('/tickets/:id/call-log', [
  body('outcome').isString().trim().notEmpty().withMessage('Pick a call outcome.'),
  body('note').optional({ checkFalsy: true }).isString(),
], ctrl.callLog)

module.exports = router
