'use strict'

// Student read of live sessions — only active rows (scheduled/completed) for the student's
// class (or class-agnostic sessions). Cancelled / archived / soft-deleted never surface.
// This is the SAME table the admin manages, so publishing a session in Admin shows it here.

const db = require('../config/database')
const ApiResponse = require('../utils/ApiResponse')

const COLS = `id::text AS id, title, subject, chapter, class_level AS "classLevel", board, teacher_name AS "teacherName",
  starts_at AS "startsAt", duration_min AS "durationMin", mode, meeting_link AS "meetingLink", location, capacity,
  description, status`

async function forStudent(req, res, next) {
  try {
    const cls = req.scope && req.scope.classNum ? req.scope.classNum : null
    const p = []; const bind = (v) => { p.push(v); return `$${p.length}` }
    const clsCond = cls != null ? `(class_level IS NULL OR class_level = ${bind(cls)})` : 'class_level IS NULL'
    const rows = await db.$queryRawUnsafe(
      `SELECT ${COLS} FROM "sessions"
        WHERE deleted_at IS NULL AND status IN ('scheduled', 'completed') AND ${clsCond}
        ORDER BY starts_at ASC`,
      ...p,
    )
    return ApiResponse.success(res, { sessions: rows })
  } catch (e) { next(e) }
}

module.exports = { forStudent }
