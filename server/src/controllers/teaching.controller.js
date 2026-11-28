'use strict'
// The human teacher's dashboard (/api/teaching) and the student's homework (/api/homework).
// Thin: the service owns the queries and the ownership rules.

const ApiResponse = require('../utils/ApiResponse')
const { AppError } = require('../middleware/errorHandler')
const { teachingService } = require('../services/teaching/teaching.service')
const { uploadImage } = require('../services/storage')

// Photos a phone camera or gallery gives us. (HEIC is converted to JPEG by the picker.)
const PHOTO_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

const wrap = (fn) => async (req, res, next) => {
  try { return await fn(req, res) } catch (e) { return next(e) }
}

// ── teacher ─────────────────────────────────────────────────────────────────────
const dashboard = wrap(async (req, res) =>
  ApiResponse.success(res, await teachingService.dashboard(req.user.id)))

const myClass = wrap(async (req, res) =>
  ApiResponse.success(res, { students: await teachingService.myClass(req.user.id) }))

const listHomework = wrap(async (req, res) =>
  ApiResponse.success(res, { homework: await teachingService.listHomework(req.user.id, { assignmentId: req.query.assignmentId }) }))

const giveHomework = wrap(async (req, res) =>
  ApiResponse.created(res, { homework: await teachingService.giveHomework(req.user.id, req.body) }, 'Homework given.'))

const editHomework = wrap(async (req, res) =>
  ApiResponse.success(res, { homework: await teachingService.editHomework(req.user.id, req.params.id, req.body) }))

// { comment } marks it checked; { uncheck: true } takes the check back.
const checkHomework = wrap(async (req, res) =>
  ApiResponse.success(res, { homework: await teachingService.checkHomework(req.user.id, req.params.id, req.body) }))

// ── student ─────────────────────────────────────────────────────────────────────
// The student's own classes: teacher, subject, room link and next class (Join on Home).
const myClasses = wrap(async (req, res) =>
  ApiResponse.success(res, { classes: await teachingService.studentClasses(req.user.id) }))

const myHomework = wrap(async (req, res) =>
  ApiResponse.success(res, { homework: await teachingService.studentHomework(req.user.id) }))

// { note, images } — hands the work in (and marks it done).
const submitHomework = wrap(async (req, res) =>
  ApiResponse.success(res, { homework: await teachingService.submitHomework(req.user.id, req.params.id, req.body) }, 'Homework submitted.'))

// One photo (multipart `file`) → { url }, for homework (a teacher's worksheet or a
// student's work). Teachers, and students who have a teacher, only.
const uploadPhoto = wrap(async (req, res) => {
  if (!req.file) throw new AppError('Choose a photo to upload.', 422)
  const mime = String(req.file.mimetype || '').toLowerCase()
  if (!PHOTO_MIME.has(mime)) throw new AppError('Only JPG, PNG or WebP photos can be added.', 415)
  const role = req.scope && req.scope.role
  if (!(await teachingService.mayUpload(req.user.id, role))) throw new AppError('Photos can be added to homework from a teacher only.', 403)
  const url = await uploadImage(req.file.buffer, { contentType: mime, originalName: req.file.originalname, folder: 'homework' })
  return ApiResponse.created(res, { url }, 'Photo added.')
})

const markDone = wrap(async (req, res) =>
  ApiResponse.success(res, { homework: await teachingService.markHomework(req.user.id, req.params.id, true) }))

const markNotDone = wrap(async (req, res) =>
  ApiResponse.success(res, { homework: await teachingService.markHomework(req.user.id, req.params.id, false) }))

module.exports = { dashboard, myClass, listHomework, giveHomework, editHomework, checkHomework, myClasses, myHomework, submitHomework, uploadPhoto, markDone, markNotDone }
