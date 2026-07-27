'use strict'

// Admin "view any student's Results" — returns the SAME payload shape the student's own
// /api/learning/results returns, but scoped to an arbitrary student id. The admin UI renders
// the identical <ResultsView>, so this MUST reuse the same results.service the student uses
// (no parallel analytics). The target student's own class scopes their subject breakdown —
// derived server-side from their profile, never from the client.

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const resultsService = require('../../services/results.service')
const { normalizeClass } = require('../../services/personalization/scope')

// Load the target student's id (validated as a real user) + their class number.
async function loadStudent(id) {
  const [row] = await db.$queryRawUnsafe(
    `SELECT id::text AS id, grade FROM "users" WHERE id = $1::uuid LIMIT 1`, id)
  if (!row) throw new AppError('Student not found', 404)
  return { id: row.id, classNum: normalizeClass(row.grade) }
}

// GET /api/admin/students/:id/results?period=&offset=
async function results(req, res, next) {
  try {
    const student = await loadStudent(req.params.id)
    const period = ['week', 'month'].includes(req.query.period) ? req.query.period : 'week'
    const offset = Math.max(0, Math.min(520, parseInt(req.query.offset, 10) || 0))
    const data = await resultsService.getResults(student.id, student.classNum, period, offset)
    return ApiResponse.success(res, data)
  } catch (err) { next(err) }
}

// GET /api/admin/students/:id/results/attempt/:attemptId — section-wise breakdown for one
// mock attempt owned by that student.
async function attemptDetail(req, res, next) {
  try {
    const student = await loadStudent(req.params.id)
    const sections = await resultsService.getAttemptSections(student.id, req.params.attemptId)
    return ApiResponse.success(res, { sections })
  } catch (err) { next(err) }
}

module.exports = { results, attemptDetail }
