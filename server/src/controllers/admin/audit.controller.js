'use strict'

const ApiResponse = require('../../utils/ApiResponse')
const audit = require('../../services/admin/audit.service')

// GET /api/admin/audit?page=&pageSize=&module=&action=&actorId=&search=
async function list(req, res, next) {
  try {
    const result = await audit.list({
      page: req.query.page, pageSize: req.query.pageSize,
      module: req.query.module, action: req.query.action,
      actorId: req.query.actorId, search: req.query.search,
    })
    return ApiResponse.success(res, result)
  } catch (err) { next(err) }
}

// GET /api/admin/audit/facets — distinct modules/actions for filters.
async function facets(req, res, next) {
  try {
    return ApiResponse.success(res, await audit.facets())
  } catch (err) { next(err) }
}

module.exports = { list, facets }
