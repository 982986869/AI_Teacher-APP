'use strict'

// Student read of live sessions — only active rows (scheduled/completed). Two kinds:
//   • class sessions: for the student's class (or class-agnostic) — what an admin
//     publishes in the Sessions manager;
//   • the student's OWN lessons with their teacher (a teacher↔student pair). These carry
//     the pair's permanent room link and the teacher's name. A pair lesson is private:
//     it is returned only to the student of that pair, never to the rest of the class.
// Cancelled / archived / soft-deleted never surface.

const db = require('../config/database')
const ApiResponse = require('../utils/ApiResponse')

// A pair lesson is titled from the STUDENT's side ("Science with Ms. Rao"); the stored
// title is the teacher's view ("Science with Aarav").
const COLS = `s.id::text AS id,
  CASE WHEN s.assignment_id IS NOT NULL THEN COALESCE(NULLIF(s.subject, ''), 'Class') || ' with ' || COALESCE(t.name, s.teacher_name, 'your teacher')
       ELSE s.title END AS title,
  s.subject, s.chapter, s.class_level AS "classLevel", s.board,
  COALESCE(t.name, s.teacher_name) AS "teacherName",
  s.starts_at AS "startsAt", s.duration_min AS "durationMin", s.mode,
  COALESCE(ta.room_link, s.meeting_link) AS "meetingLink", s.recording_url AS "recordingUrl",
  s.location, s.capacity, s.description, s.status,
  (s.assignment_id IS NOT NULL) AS "private"`

async function forStudent(req, res, next) {
  try {
    const cls = req.scope && req.scope.classNum ? req.scope.classNum : null
    const p = []; const bind = (v) => { p.push(v); return `$${p.length}` }
    const clsCond = cls != null ? `(s.class_level IS NULL OR s.class_level = ${bind(cls)})` : 's.class_level IS NULL'
    const me = bind(req.user && req.user.id)
    const rows = await db.$queryRawUnsafe(
      `SELECT ${COLS}
         FROM "sessions" s
         LEFT JOIN teacher_assignments ta ON ta.id = s.assignment_id
         LEFT JOIN users t ON t.id = s.teacher_id
        WHERE s.deleted_at IS NULL AND s.status IN ('scheduled', 'completed')
          AND (
                (s.assignment_id IS NULL AND ${clsCond})                                   -- the class's sessions
             OR (ta.student_id = ${me}::uuid AND ta.status = 'active' AND s.teacher_id = ta.teacher_id) -- my own lessons
          )
        ORDER BY s.starts_at ASC`,
      ...p,
    )
    return ApiResponse.success(res, { sessions: rows })
  } catch (e) { next(e) }
}

module.exports = { forStudent }
