'use strict'

// Read side of the swallowed-error trail. Admin-only, and narrower than most admin
// modules: stack traces name internal files, routes and query shapes, so this is
// granted to super_admin and admin but withheld from support and content_manager.

const ApiResponse = require('../../utils/ApiResponse')
const errorLog = require('../../services/errorLog.service')
const audit = require('../../services/admin/audit.service')

// GET /api/admin/error-logs?page=&pageSize=&source=&level=&search=
async function list(req, res, next) {
  try {
    const result = await errorLog.list({
      page: req.query.page,
      pageSize: req.query.pageSize,
      source: req.query.source,
      level: req.query.level,
      search: req.query.search,
    })
    return ApiResponse.success(res, result)
  } catch (err) { next(err) }
}

// GET /api/admin/error-logs/facets — filter options plus how full the capped table is.
async function facets(req, res, next) {
  try {
    return ApiResponse.success(res, await errorLog.facets())
  } catch (err) { next(err) }
}

// DELETE /api/admin/error-logs — empty the table.
// Audited, because "the logs are empty" should never be an unexplained state: without
// this entry, a purge and a missing migration look identical from the outside.
async function purge(req, res, next) {
  try {
    const result = await errorLog.purge()
    await audit.record(req, {
      module: 'logs', action: 'purge', targetType: 'error_logs',
      before: { rows: result.deleted }, after: { rows: 0 },
    })
    return ApiResponse.success(res, result)
  } catch (err) { next(err) }
}

module.exports = { list, facets, purge }
