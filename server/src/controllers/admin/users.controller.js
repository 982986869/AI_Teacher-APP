'use strict'

const bcrypt = require('bcryptjs')
const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const audit = require('../../services/admin/audit.service')
const { ROLES, ROLE_LABELS, hasPermission } = require('../../services/admin/permissions')
const { studentSnapshot } = require('../../services/admin/studentSnapshot')

const num = (v) => Number(v) || 0
const SORTABLE = { createdAt: '"createdAt"', name: 'name', email: 'email', grade: 'grade' }

// GET /api/admin/users?search=&role=&class=&status=&page=&pageSize=&sort=&dir=
async function list(req, res, next) {
  try {
    const { search, role, class: klass, status, sort = 'createdAt', dir = 'desc' } = req.query
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 20, 1), 100)

    const conds = []
    const params = []
    const bind = (v) => { params.push(v); return `$${params.length}` }

    if (search) {
      const p = bind(`%${String(search).trim()}%`)
      conds.push(`(name ILIKE ${p} OR email ILIKE ${p} OR phone ILIKE ${p})`)
    }
    // role filter maps to account_type; 'admin' means any admin_role.
    if (role === 'admin') conds.push('admin_role IS NOT NULL')
    else if (role === 'student') conds.push(`COALESCE(account_type,'student') = 'student'`)
    else if (role === 'parent' || role === 'teacher') conds.push(`account_type = ${bind(role)}`)

    if (klass) conds.push(`grade = ${bind(String(klass))}`)
    if (status === 'active') conds.push('is_active = true')
    else if (status === 'deactivated') conds.push('is_active = false')

    const whereSql = conds.length ? 'WHERE ' + conds.join(' AND ') : ''
    const orderCol = SORTABLE[sort] || '"createdAt"'
    const orderDir = String(dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC'
    const offset = (page - 1) * pageSize

    const countRow = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "users" ${whereSql}`, ...params)
    const total = num(countRow && countRow[0] && countRow[0].n)

    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, name, email, phone, grade, board, stream,
              COALESCE(account_type,'student') AS "accountType", role::text AS role,
              admin_role AS "adminRole", is_active AS "isActive",
              linked_student_id::text AS "linkedStudentId", "createdAt"
         FROM "users" ${whereSql}
        ORDER BY ${orderCol} ${orderDir} NULLS LAST
        LIMIT ${pageSize} OFFSET ${offset}`,
      ...params,
    )

    return ApiResponse.success(res, {
      rows,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    })
  } catch (err) { next(err) }
}

// GET /api/admin/users/:id — profile + progress snapshot (reuses learner tables).
async function detail(req, res, next) {
  try {
    const id = req.params.id
    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, name, email, phone, grade, board, stream, language, school,
              COALESCE(account_type,'student') AS "accountType", role::text AS role,
              admin_role AS "adminRole", is_active AS "isActive", deactivated_at AS "deactivatedAt",
              linked_student_id::text AS "linkedStudentId", provider::text AS provider, "createdAt"
         FROM "users" WHERE id = $1::uuid LIMIT 1`,
      id,
    )
    const user = rows && rows[0]
    if (!user) throw new AppError('User not found', 404)

    // Progress snapshot via the shared helper (same logic the Parents view uses).
    const snap = await studentSnapshot(id)
    return ApiResponse.success(res, { user, ...snap })
  } catch (err) { next(err) }
}

async function loadUserOr404(id) {
  const rows = await db.$queryRawUnsafe(
    `SELECT id::text AS id, name, email, role::text AS role, admin_role AS "adminRole", is_active AS "isActive"
       FROM "users" WHERE id = $1::uuid LIMIT 1`, id)
  const user = rows && rows[0]
  if (!user) throw new AppError('User not found', 404)
  return user
}

// PATCH /api/admin/users/:id/role  { adminRole: null | 'admin' | ... }  (users.role)
async function setRole(req, res, next) {
  try {
    const target = await loadUserOr404(req.params.id)
    let { adminRole } = req.body
    if (adminRole === '' || adminRole === undefined) adminRole = null
    if (adminRole !== null && !ROLES.includes(adminRole)) throw new AppError('Invalid admin role', 422)

    // Only super_admin may grant/revoke super_admin, or manage other admins' roles.
    if ((adminRole === 'super_admin' || target.adminRole === 'super_admin') && req.admin.role !== 'super_admin') {
      throw new AppError('Only a Super Admin can manage Super Admin roles', 403)
    }
    if (target.id === req.admin.id && adminRole !== 'super_admin' && target.adminRole === 'super_admin') {
      throw new AppError('You cannot remove your own Super Admin role', 422)
    }

    // $2 is cast to ::text explicitly: when revoking (adminRole = null) Postgres
    // otherwise cannot infer the parameter's type (42P08) since it appears both as an
    // assignment value and inside CASE WHEN $2 IS NOT NULL.
    await db.$executeRawUnsafe(
      `UPDATE "users" SET admin_role = $2::text, role = CASE WHEN $2::text IS NOT NULL THEN 'ADMIN'::"UserRole" ELSE role END
         WHERE id = $1::uuid`,
      target.id, adminRole,
    )
    await audit.record(req, {
      module: 'users', action: 'role.change', targetType: 'user', targetId: target.id, targetLabel: target.email,
      before: { adminRole: target.adminRole }, after: { adminRole },
    })
    return ApiResponse.success(res, { id: target.id, adminRole }, 'Role updated')
  } catch (err) { next(err) }
}

// POST /api/admin/users/:id/reset-password  { password? }  (users.password)
async function resetPassword(req, res, next) {
  try {
    const target = await loadUserOr404(req.params.id)
    const password = req.body.password && String(req.body.password)
    if (password && password.length < 8) throw new AppError('Password must be at least 8 characters', 422)

    // If no password supplied, generate a temporary one and return it once.
    const temp = password || Math.random().toString(36).slice(2, 10) + 'A1'
    const hash = await bcrypt.hash(temp, 12)
    await db.$executeRawUnsafe(`UPDATE "users" SET "passwordHash" = $2 WHERE id = $1::uuid`, target.id, hash)

    await audit.record(req, {
      module: 'users', action: 'password.reset', targetType: 'user', targetId: target.id, targetLabel: target.email,
    })
    return ApiResponse.success(res, { id: target.id, temporaryPassword: password ? undefined : temp }, 'Password reset')
  } catch (err) { next(err) }
}

// PATCH /api/admin/users/:id/status  { isActive: bool }  (users.edit)
async function setStatus(req, res, next) {
  try {
    const target = await loadUserOr404(req.params.id)
    const isActive = req.body.isActive === true || req.body.isActive === 'true'

    if (target.id === req.admin.id && !isActive) throw new AppError('You cannot deactivate your own account', 422)
    if (target.adminRole === 'super_admin' && !isActive && req.admin.role !== 'super_admin') {
      throw new AppError('Only a Super Admin can deactivate a Super Admin', 403)
    }

    await db.$executeRawUnsafe(
      `UPDATE "users" SET is_active = $2, deactivated_at = CASE WHEN $2 THEN NULL ELSE now() END WHERE id = $1::uuid`,
      target.id, isActive,
    )
    await audit.record(req, {
      module: 'users', action: isActive ? 'reactivate' : 'deactivate', targetType: 'user',
      targetId: target.id, targetLabel: target.email, before: { isActive: target.isActive }, after: { isActive },
    })
    return ApiResponse.success(res, { id: target.id, isActive }, isActive ? 'User reactivated' : 'User deactivated')
  } catch (err) { next(err) }
}

// DELETE /api/admin/users/:id  (users.delete)
async function remove(req, res, next) {
  try {
    const target = await loadUserOr404(req.params.id)
    if (target.id === req.admin.id) throw new AppError('You cannot delete your own account', 422)
    if (target.adminRole === 'super_admin') throw new AppError('A Super Admin account cannot be deleted', 403)

    // FK cascades (lessons, brain_gym_sessions, …) remove owned learner data.
    await db.$executeRawUnsafe(`DELETE FROM "users" WHERE id = $1::uuid`, target.id)
    await audit.record(req, {
      module: 'users', action: 'delete', targetType: 'user', targetId: target.id, targetLabel: target.email,
      before: { name: target.name, email: target.email },
    })
    return ApiResponse.success(res, { id: target.id }, 'User deleted')
  } catch (err) { next(err) }
}

// GET /api/admin/users/meta — filter facets (classes, roles) for the UI.
async function meta(req, res, next) {
  try {
    const grades = await db.$queryRawUnsafe(
      `SELECT DISTINCT grade FROM "users" WHERE grade IS NOT NULL AND grade <> '' ORDER BY grade`,
    ).catch(() => [])
    return ApiResponse.success(res, {
      classes: grades.map((g) => g.grade),
      adminRoles: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
      accountTypes: ['student', 'parent', 'teacher'],
    })
  } catch (err) { next(err) }
}

module.exports = { list, detail, setRole, resetPassword, setStatus, remove, meta }
