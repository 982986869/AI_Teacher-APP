'use strict'

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const audit = require('../../services/admin/audit.service')

const AUDIENCES = ['all', 'students', 'parents', 'teachers', 'class']
const STATUSES = ['draft', 'published', 'archived']

async function loadOr404(id) {
  const rows = await db.$queryRawUnsafe(`SELECT * FROM "announcements" WHERE id = $1::uuid LIMIT 1`, id)
  const a = rows && rows[0]
  if (!a) throw new AppError('Announcement not found', 404)
  return a
}

function shape(a) {
  return {
    id: a.id, title: a.title, body: a.body, audience: a.audience, classLevel: a.class_level,
    status: a.status, pinned: a.pinned, startsAt: a.starts_at, endsAt: a.ends_at,
    createdByName: a.created_by_name, publishedAt: a.published_at, createdAt: a.created_at, updatedAt: a.updated_at,
  }
}

// GET /api/admin/announcements?status=&search=
async function list(req, res, next) {
  try {
    const { status, search } = req.query
    const conds = []
    const params = []
    const bind = (v) => { params.push(v); return `$${params.length}` }
    if (status) conds.push(`status = ${bind(status)}`)
    if (search) conds.push(`(title ILIKE ${bind(`%${search}%`)} OR body ILIKE ${bind(`%${search}%`)})`)
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : ''
    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, title, body, audience, class_level, status, pinned,
              starts_at, ends_at, created_by_name, published_at, created_at, updated_at
         FROM "announcements" ${where} ORDER BY pinned DESC, created_at DESC LIMIT 200`,
      ...params,
    )
    return ApiResponse.success(res, { rows: rows.map(shape) })
  } catch (err) { next(err) }
}

// POST /api/admin/announcements
async function create(req, res, next) {
  try {
    const { title, body = '', audience = 'all', classLevel = null, status = 'draft', pinned = false, startsAt = null, endsAt = null } = req.body
    if (!title || !String(title).trim()) throw new AppError('Title is required', 422)
    if (!AUDIENCES.includes(audience)) throw new AppError('Invalid audience', 422)
    if (!STATUSES.includes(status)) throw new AppError('Invalid status', 422)

    const rows = await db.$queryRawUnsafe(
      `INSERT INTO "announcements" (title, body, audience, class_level, status, pinned, starts_at, ends_at,
                                    created_by, created_by_name, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::timestamptz,$8::timestamptz,$9::uuid,$10, CASE WHEN $5='published' THEN now() ELSE NULL END)
       RETURNING *`,
      String(title).trim(), body, audience, classLevel ? parseInt(classLevel, 10) : null, status, !!pinned,
      startsAt || null, endsAt || null, req.admin.id, req.admin.name,
    )
    const created = rows[0]
    await audit.record(req, { module: 'announcements', action: 'create', targetType: 'announcement', targetId: created.id, targetLabel: created.title, after: shape(created) })
    return ApiResponse.created(res, { announcement: shape(created) })
  } catch (err) { next(err) }
}

// PATCH /api/admin/announcements/:id
async function update(req, res, next) {
  try {
    const before = await loadOr404(req.params.id)
    const fields = { title: 'title', body: 'body', audience: 'audience', classLevel: 'class_level', pinned: 'pinned', startsAt: 'starts_at', endsAt: 'ends_at' }
    const sets = []
    const params = []
    for (const [key, col] of Object.entries(fields)) {
      if (req.body[key] !== undefined) {
        let v = req.body[key]
        if (col === 'audience' && !AUDIENCES.includes(v)) throw new AppError('Invalid audience', 422)
        if (col === 'class_level') v = v ? parseInt(v, 10) : null
        // Coerce empty-string dates to NULL (clear the schedule), mirroring create();
        // otherwise `''::timestamptz` raises a 500 (invalid timestamp input).
        if ((col === 'starts_at' || col === 'ends_at') && !v) v = null
        // Prisma binds string params as `text`; assigning to a timestamptz column
        // without a cast fails with 42804. Cast the date columns explicitly.
        const cast = (col === 'starts_at' || col === 'ends_at') ? '::timestamptz' : ''
        params.push(v); sets.push(`"${col}" = $${params.length}${cast}`)
      }
    }
    if (!sets.length) throw new AppError('Nothing to update', 400)
    params.push(req.params.id)
    const rows = await db.$queryRawUnsafe(
      `UPDATE "announcements" SET ${sets.join(', ')}, updated_at = now() WHERE id = $${params.length}::uuid RETURNING *`,
      ...params,
    )
    const after = rows[0]
    await audit.record(req, { module: 'announcements', action: 'update', targetType: 'announcement', targetId: after.id, targetLabel: after.title, before: shape(before), after: shape(after) })
    return ApiResponse.success(res, { announcement: shape(after) })
  } catch (err) { next(err) }
}

// POST /api/admin/announcements/:id/transition  { status: draft|published|archived }
async function transition(req, res, next) {
  try {
    const before = await loadOr404(req.params.id)
    const status = String(req.body.status || '')
    if (!STATUSES.includes(status)) throw new AppError('Invalid status', 422)
    const rows = await db.$queryRawUnsafe(
      `UPDATE "announcements"
          SET status = $2, updated_at = now(),
              published_at = CASE WHEN $2='published' AND published_at IS NULL THEN now() ELSE published_at END
        WHERE id = $1::uuid RETURNING *`,
      req.params.id, status,
    )
    const after = rows[0]
    await audit.record(req, { module: 'announcements', action: `status.${status}`, targetType: 'announcement', targetId: after.id, targetLabel: after.title, before: { status: before.status }, after: { status } })
    return ApiResponse.success(res, { announcement: shape(after) }, `Announcement ${status}`)
  } catch (err) { next(err) }
}

// DELETE /api/admin/announcements/:id
async function remove(req, res, next) {
  try {
    const before = await loadOr404(req.params.id)
    await db.$executeRawUnsafe(`DELETE FROM "announcements" WHERE id = $1::uuid`, req.params.id)
    await audit.record(req, { module: 'announcements', action: 'delete', targetType: 'announcement', targetId: before.id, targetLabel: before.title, before: shape(before) })
    return ApiResponse.success(res, { id: before.id }, 'Announcement deleted')
  } catch (err) { next(err) }
}

module.exports = { list, create, update, transition, remove }
