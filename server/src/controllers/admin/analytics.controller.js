'use strict'

// Analytics dashboard — thin controller over analytics.service (the single source of
// aggregate logic). Read-only; gated by reports.view. Split into focused endpoints so
// the dashboard loads each section progressively with its own skeleton.

const ApiResponse = require('../../utils/ApiResponse')
const svc = require('../../services/admin/analytics.service')

// Filters come from the query string; empty values become undefined (no filter).
function filtersFrom(req) {
  const s = (v) => (v && String(v).trim() ? String(v).trim() : undefined)
  return {
    days: req.query.days,
    klass: s(req.query.class),
    board: s(req.query.board),
    school: s(req.query.school),
    subject: s(req.query.subject),
  }
}

async function summary(req, res, next) { try { return ApiResponse.success(res, await svc.summary(filtersFrom(req))) } catch (e) { next(e) } }
async function trends(req, res, next) { try { return ApiResponse.success(res, await svc.trends(filtersFrom(req))) } catch (e) { next(e) } }
async function top(req, res, next) { try { return ApiResponse.success(res, await svc.top(filtersFrom(req))) } catch (e) { next(e) } }
async function activity(req, res, next) { try { return ApiResponse.success(res, await svc.activity()) } catch (e) { next(e) } }
async function facets(req, res, next) { try { return ApiResponse.success(res, await svc.facets()) } catch (e) { next(e) } }

module.exports = { summary, trends, top, activity, facets }
