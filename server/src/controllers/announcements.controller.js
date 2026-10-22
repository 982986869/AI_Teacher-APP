'use strict'

// The reader half of announcements. Admins write them through /api/admin/announcements;
// this is the only way one reaches a student, parent or teacher.
//
// Not behind the paid gate. An announcement is how the app tells someone the syllabus
// changed, a holiday moved, or new content landed — withholding that from a free
// account would make the feature useless exactly where it matters most.
//
// Four filters decide what a given person sees, and all four are applied in SQL so the
// app never receives an announcement meant for someone else:
//
//   status     only 'published' — a draft or an archived one is invisible
//   audience   'all', or the caller's own role, or their class
//   window     starts_at/ends_at, when set, bound when it is live
//   order      pinned first, then newest published

const db = require('../config/database')
const ApiResponse = require('../utils/ApiResponse')

const MAX = 20

// `audience` is one of all | students | parents | teachers | class. A role maps to its
// plural bucket; 'class' is matched separately against the caller's class number.
const BUCKET = { student: 'students', parent: 'parents', teacher: 'teachers', admin: 'teachers' }

// GET /api/announcements
// Returns [{ id, title, body, pinned, publishedAt }] — everything a banner needs and
// nothing it does not. Audience and status are deliberately NOT returned: they are how
// the decision was made, not information for the reader.
async function list(req, res, next) {
  try {
    const scope = req.scope || {}
    const bucket = BUCKET[scope.role] || 'students'
    // A tester or any-class browser reads their picked class; everyone else their own.
    const classNum = scope.classNum ?? null

    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, title, body, pinned, published_at
         FROM "announcements"
        WHERE status = 'published'
          AND (audience = 'all'
               OR audience = $1
               OR (audience = 'class' AND $2::int IS NOT NULL AND class_level = $2::int))
          AND (starts_at IS NULL OR starts_at <= now())
          AND (ends_at   IS NULL OR ends_at   >  now())
        ORDER BY pinned DESC, published_at DESC NULLS LAST, created_at DESC
        LIMIT ${MAX}`,
      bucket, classNum,
    )

    return ApiResponse.success(res, rows.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body || '',
      pinned: !!a.pinned,
      publishedAt: a.published_at,
    })))
  } catch (err) { return next(err) }
}

module.exports = { list }
