'use strict'

// Admin management of live sessions — the real records the Student "Sessions" tab reads.
// Soft-delete + status workflow (scheduled → completed / cancelled / archived). Audited.

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const audit = require('../../services/admin/audit.service')

const STATUSES = ['scheduled', 'completed', 'cancelled', 'archived']
const COLS = `id::text AS id, title, subject, chapter, class_level AS "classLevel", board, teacher_name AS "teacherName",
  starts_at AS "startsAt", duration_min AS "durationMin", mode, meeting_link AS "meetingLink", location, capacity,
  description, status, created_by_name AS "createdByName", created_at AS "createdAt", updated_at AS "updatedAt"`

const int = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : parseInt(v, 10))

async function loadOr404(id) {
  const r = await db.$queryRawUnsafe(`SELECT * FROM "sessions" WHERE id = $1::uuid AND deleted_at IS NULL LIMIT 1`, id)
  if (!r[0]) throw new AppError('Session not found', 404)
  return r[0]
}

// GET /api/admin/sessions
async function list(req, res, next) {
  try {
    const { status, subject } = req.query
    const cls = int(req.query.class)
    const conds = ['deleted_at IS NULL']
    const p = []; const bind = (v) => { p.push(v); return `$${p.length}` }
    if (status && STATUSES.includes(status)) conds.push(`status = ${bind(status)}`)
    if (subject) conds.push(`subject ILIKE ${bind(`%${subject}%`)}`)
    if (cls != null) conds.push(`class_level = ${bind(cls)}`)
    const rows = await db.$queryRawUnsafe(`SELECT ${COLS} FROM "sessions" WHERE ${conds.join(' AND ')} ORDER BY starts_at ASC`, ...p)
    return ApiResponse.success(res, { rows })
  } catch (e) { next(e) }
}

// GET /api/admin/sessions/:id
async function get(req, res, next) {
  try {
    await loadOr404(req.params.id)
    const r = await db.$queryRawUnsafe(`SELECT ${COLS} FROM "sessions" WHERE id = $1::uuid`, req.params.id)
    return ApiResponse.success(res, { session: r[0] })
  } catch (e) { next(e) }
}

// POST /api/admin/sessions
async function create(req, res, next) {
  try {
    const b = req.body || {}
    if (!b.title || !String(b.title).trim()) throw new AppError('A session title is required', 422)
    if (!b.startsAt) throw new AppError('A start date and time is required', 422)
    const rows = await db.$queryRawUnsafe(
      `INSERT INTO "sessions" (title, subject, chapter, class_level, board, teacher_name, starts_at, duration_min,
                               mode, meeting_link, location, capacity, description, created_by, created_by_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7::timestamptz,$8,$9,$10,$11,$12,$13,$14::uuid,$15) RETURNING ${COLS}`,
      String(b.title).trim(), b.subject || '', b.chapter || '', int(b.classLevel), b.board || null, b.teacherName || '',
      b.startsAt, int(b.durationMin) || 60, b.mode === 'offline' ? 'offline' : 'online', b.meetingLink || null,
      b.location || null, int(b.capacity), b.description || '', req.admin.id, req.admin.name,
    )
    await audit.record(req, { module: 'sessions', action: 'create', targetType: 'session', targetId: rows[0].id, targetLabel: rows[0].title, after: rows[0] })
    return ApiResponse.created(res, { session: rows[0] })
  } catch (e) { next(e) }
}

// PATCH /api/admin/sessions/:id  (also used for reschedule — just send startsAt)
async function update(req, res, next) {
  try {
    const cur = await loadOr404(req.params.id)
    const map = { title: 'title', subject: 'subject', chapter: 'chapter', board: 'board', teacherName: 'teacher_name', mode: 'mode', meetingLink: 'meeting_link', location: 'location', description: 'description' }
    const sets = []; const p = []; const bind = (v) => { p.push(v); return `$${p.length}` }
    for (const [k, col] of Object.entries(map)) if (req.body[k] !== undefined) sets.push(`${col} = ${bind(req.body[k])}`)
    if (req.body.classLevel !== undefined) sets.push(`class_level = ${bind(int(req.body.classLevel))}`)
    if (req.body.durationMin !== undefined) sets.push(`duration_min = ${bind(int(req.body.durationMin) || 60)}`)
    if (req.body.capacity !== undefined) sets.push(`capacity = ${bind(int(req.body.capacity))}`)
    if (req.body.startsAt !== undefined) sets.push(`starts_at = ${bind(req.body.startsAt)}::timestamptz`)
    if (req.body.title !== undefined && !String(req.body.title).trim()) throw new AppError('Title cannot be empty', 422)
    if (!sets.length) throw new AppError('Nothing to update', 400)
    sets.push('updated_at = now()')
    const rows = await db.$queryRawUnsafe(`UPDATE "sessions" SET ${sets.join(', ')} WHERE id = ${bind(req.params.id)}::uuid RETURNING ${COLS}`, ...p)
    await audit.record(req, { module: 'sessions', action: 'update', targetType: 'session', targetId: cur.id, targetLabel: cur.title, after: rows[0] })
    return ApiResponse.success(res, { session: rows[0] })
  } catch (e) { next(e) }
}

// POST /api/admin/sessions/:id/status  { status }
async function transition(req, res, next) {
  try {
    const cur = await loadOr404(req.params.id)
    const status = String(req.body.status || '')
    if (!STATUSES.includes(status)) throw new AppError(`status must be one of ${STATUSES.join(', ')}`, 422)
    const rows = await db.$queryRawUnsafe(`UPDATE "sessions" SET status = $2, updated_at = now() WHERE id = $1::uuid RETURNING ${COLS}`, cur.id, status)
    await audit.record(req, { module: 'sessions', action: `status.${status}`, targetType: 'session', targetId: cur.id, targetLabel: cur.title, before: { status: cur.status }, after: { status } })
    return ApiResponse.success(res, { session: rows[0] }, `Session ${status}`)
  } catch (e) { next(e) }
}

// DELETE /api/admin/sessions/:id  (soft delete — history is preserved)
async function remove(req, res, next) {
  try {
    const cur = await loadOr404(req.params.id)
    await db.$executeRawUnsafe(`UPDATE "sessions" SET deleted_at = now() WHERE id = $1::uuid`, cur.id)
    await audit.record(req, { module: 'sessions', action: 'remove', targetType: 'session', targetId: cur.id, targetLabel: cur.title })
    return ApiResponse.success(res, { id: cur.id }, 'Removed')
  } catch (e) { next(e) }
}

module.exports = { list, get, create, update, transition, remove }
