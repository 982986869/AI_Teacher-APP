'use strict'

// Per-module counts for the Admin Home "manage" cards — one lightweight call over the real
// tables (mock_tests / subjects+chapters / sessions). Only the modules that have a real
// native Manage destination are reported; nothing here is a dashboard metric wall.

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')

async function overview(req, res, next) {
  try {
    const [tests] = await db.$queryRawUnsafe(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE status='draft')::int AS draft,
              count(*) FILTER (WHERE status='published')::int AS published,
              count(*) FILTER (WHERE status='archived')::int AS archived
         FROM mock_tests WHERE deleted_at IS NULL`)
    const [resources] = await db.$queryRawUnsafe(
      `SELECT (SELECT count(*)::int FROM subjects) AS subjects,
              (SELECT count(*)::int FROM chapters WHERE deleted_at IS NULL) AS chapters,
              (SELECT count(*)::int FROM chapters WHERE deleted_at IS NULL AND status <> 'published') AS hidden`)
    const [sessions] = await db.$queryRawUnsafe(
      `SELECT count(*) FILTER (WHERE status='scheduled')::int AS upcoming,
              count(*) FILTER (WHERE status='scheduled' AND starts_at::date = now()::date)::int AS today,
              count(*) FILTER (WHERE status='completed')::int AS completed,
              count(*)::int AS total
         FROM sessions WHERE deleted_at IS NULL`)
    return ApiResponse.success(res, { tests, resources, sessions })
  } catch (e) { next(e) }
}

module.exports = { overview }
