'use strict'

const db = require('../config/database')
const ApiResponse = require('../utils/ApiResponse')

// NCERT Solutions (Part-I / Part-II), DB-backed. Uses raw SQL so it works without
// regenerating the Prisma client (the ncert_solutions model exists in schema.prisma
// for future typed use). Response shapes mirror the old static helpers exactly:
//   getNcert2Sections() -> [{ key, label, html }]
//   getNcert2Chapters() -> [chapterName, ...]

// GET /api/resources/ncert?part=2&subject=Mathematics&class=Class%2011&chapter=Sets
async function getNcert(req, res, next) {
  try {
    const part = parseInt(req.query.part, 10) || 2
    const subject = String(req.query.subject || '').trim()
    const className = String(req.query.class || req.query.className || 'Class 11').trim()
    const chapter = String(req.query.chapter || '').trim()

    if (!subject || !chapter) {
      return ApiResponse.error(res, 'subject and chapter are required', 400)
    }

    const rows = await db.$queryRaw`
      SELECT "sectionKey", "sectionLabel", html
      FROM ncert_solutions
      WHERE part = ${part} AND subject = ${subject} AND "className" = ${className} AND chapter = ${chapter}
      ORDER BY position ASC`

    const sections = rows.map((r) => ({
      key: r.sectionKey,
      label: r.sectionLabel,
      html: r.html == null ? null : String(r.html),
    }))

    return ApiResponse.success(res, { part, subject, className, chapter, sections })
  } catch (err) {
    next(err)
  }
}

// GET /api/resources/ncert/chapters?part=2&subject=Mathematics&class=Class%2011
// Returns chapter names (registry order) that have content — replaces getNcert2Chapters().
async function getNcertChapters(req, res, next) {
  try {
    const part = parseInt(req.query.part, 10) || 2
    const subject = String(req.query.subject || '').trim()
    const className = String(req.query.class || req.query.className || 'Class 11').trim()

    if (!subject) {
      return ApiResponse.error(res, 'subject is required', 400)
    }

    const rows = await db.$queryRaw`
      SELECT chapter
      FROM ncert_solutions
      WHERE part = ${part} AND subject = ${subject} AND "className" = ${className}
      GROUP BY chapter
      ORDER BY MIN("chapterPos") ASC`

    return ApiResponse.success(res, { part, subject, className, chapters: rows.map((r) => r.chapter) })
  } catch (err) {
    next(err)
  }
}

module.exports = { getNcert, getNcertChapters }
