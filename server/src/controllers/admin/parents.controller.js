'use strict'

// Parents management — a parent-centric lens over the same `users` table + the same
// learner services the Users module uses (no parallel system, no duplicated snapshot
// logic). A parent links to ONE child; admins can view the child's progress and
// manage the linkage.

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const audit = require('../../services/admin/audit.service')
const { studentSnapshot } = require('../../services/admin/studentSnapshot')

const num = (v) => Number(v) || 0

async function loadParentOr404(id) {
  const rows = await db.$queryRawUnsafe(
    `SELECT id::text AS id, name, email, phone, linked_student_id::text AS "linkedStudentId"
       FROM "users" WHERE id = $1::uuid AND account_type = 'parent' LIMIT 1`, id)
  const p = rows && rows[0]
  if (!p) throw new AppError('Parent not found', 404)
  return p
}

// GET /api/admin/parents?search=&status=&page=&pageSize=
async function list(req, res, next) {
  try {
    const { search, status } = req.query
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 20, 1), 100)
    const conds = [`p.account_type = 'parent'`]
    const params = []
    const bind = (v) => { params.push(v); return `$${params.length}` }
    if (search) {
      const s = bind(`%${String(search).trim()}%`)
      conds.push(`(p.name ILIKE ${s} OR p.email ILIKE ${s} OR p.phone ILIKE ${s} OR c.name ILIKE ${s})`)
    }
    if (status === 'linked') conds.push('p.linked_student_id IS NOT NULL')
    else if (status === 'unlinked') conds.push('p.linked_student_id IS NULL')
    else if (status === 'active') conds.push('p.is_active = true')
    else if (status === 'deactivated') conds.push('p.is_active = false')
    const where = 'WHERE ' + conds.join(' AND ')
    const offset = (page - 1) * pageSize

    const countRow = await db.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS n FROM "users" p LEFT JOIN "users" c ON c.id = p.linked_student_id ${where}`, ...params)
    const total = num(countRow && countRow[0] && countRow[0].n)
    const rows = await db.$queryRawUnsafe(
      `SELECT p.id::text AS id, p.name, p.email, p.phone, p.is_active AS "isActive", p."createdAt",
              c.id::text AS "childId", c.name AS "childName", c.grade AS "childGrade"
         FROM "users" p LEFT JOIN "users" c ON c.id = p.linked_student_id
        ${where} ORDER BY p."createdAt" DESC LIMIT ${pageSize} OFFSET ${offset}`,
      ...params,
    )
    return ApiResponse.success(res, { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) })
  } catch (err) { next(err) }
}

// GET /api/admin/parents/:id — parent + linked child + child progress snapshot.
async function detail(req, res, next) {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, name, email, phone, is_active AS "isActive", language, school,
              linked_student_id::text AS "linkedStudentId", "createdAt"
         FROM "users" WHERE id = $1::uuid AND account_type = 'parent' LIMIT 1`, req.params.id)
    const parent = rows && rows[0]
    if (!parent) throw new AppError('Parent not found', 404)

    let child = null
    let snapshot = null
    if (parent.linkedStudentId) {
      const cr = await db.$queryRawUnsafe(
        `SELECT id::text AS id, name, email, phone, grade, board, stream,
                is_active AS "isActive", "createdAt"
           FROM "users" WHERE id = $1::uuid LIMIT 1`, parent.linkedStudentId)
      child = cr && cr[0] ? cr[0] : null
      if (child) snapshot = await studentSnapshot(child.id)
    }
    return ApiResponse.success(res, { parent, child, snapshot })
  } catch (err) { next(err) }
}

// POST /api/admin/parents/:id/link  { childId? | email? | phone? }  (users.edit)
async function link(req, res, next) {
  try {
    const parent = await loadParentOr404(req.params.id)
    const childId = req.body.childId ? String(req.body.childId).trim() : null
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : null
    const phone = req.body.phone ? String(req.body.phone).trim() : null
    if (!childId && !email && !phone) throw new AppError('Provide a child id, email or phone', 422)

    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, name, COALESCE(account_type,'student') AS "accountType" FROM "users"
        WHERE ($1::uuid IS NOT NULL AND id = $1::uuid)
           OR ($2::text IS NOT NULL AND lower(email) = $2)
           OR ($3::text IS NOT NULL AND phone = $3)
        LIMIT 1`,
      childId, email, phone,
    )
    const child = rows && rows[0]
    if (!child) throw new AppError('No student found with those details', 404)
    if (child.accountType !== 'student') throw new AppError('That account is not a student', 422)
    if (child.id === parent.id) throw new AppError('A parent cannot be linked to themselves', 422)

    await db.$executeRawUnsafe(`UPDATE "users" SET linked_student_id = $2::uuid WHERE id = $1::uuid`, parent.id, child.id)
    await audit.record(req, {
      module: 'users', action: 'parent.link', targetType: 'user', targetId: parent.id, targetLabel: parent.email || parent.name,
      before: { linkedStudentId: parent.linkedStudentId }, after: { linkedStudentId: child.id, childName: child.name },
    })
    return ApiResponse.success(res, { childId: child.id, childName: child.name }, 'Child linked')
  } catch (err) { next(err) }
}

// POST /api/admin/parents/:id/unlink  (users.edit)
async function unlink(req, res, next) {
  try {
    const parent = await loadParentOr404(req.params.id)
    if (!parent.linkedStudentId) throw new AppError('This parent has no linked child', 400)
    await db.$executeRawUnsafe(`UPDATE "users" SET linked_student_id = NULL WHERE id = $1::uuid`, parent.id)
    await audit.record(req, {
      module: 'users', action: 'parent.unlink', targetType: 'user', targetId: parent.id, targetLabel: parent.email || parent.name,
      before: { linkedStudentId: parent.linkedStudentId }, after: { linkedStudentId: null },
    })
    return ApiResponse.success(res, { id: parent.id }, 'Child unlinked')
  } catch (err) { next(err) }
}

module.exports = { list, detail, link, unlink }
