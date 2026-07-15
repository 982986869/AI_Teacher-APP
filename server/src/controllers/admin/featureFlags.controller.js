'use strict'

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const audit = require('../../services/admin/audit.service')
const configCache = require('../config.controller')

const ENVIRONMENTS = ['all', 'production', 'development']
const ROLLOUT_SCOPES = ['global'] // extensible later (per-class, percentage, …)

function shape(f) {
  return {
    key: f.key, label: f.label, description: f.description, enabled: f.enabled,
    environment: f.environment, rolloutScope: f.rollout_scope, version: f.version,
    updatedByName: f.updated_by_name, updatedAt: f.updated_at,
  }
}

// GET /api/admin/feature-flags  (flags.view)
async function list(req, res, next) {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT key, label, description, enabled, environment, rollout_scope, version,
              updated_by_name, updated_at
         FROM "feature_flags" ORDER BY position, key`,
    )
    return ApiResponse.success(res, {
      flags: rows.map(shape),
      meta: { environments: ENVIRONMENTS, rolloutScopes: ROLLOUT_SCOPES },
    })
  } catch (err) { next(err) }
}

// PATCH /api/admin/feature-flags/:key  { enabled?, description?, environment?, rolloutScope?, expectedVersion? }  (flags.edit)
async function update(req, res, next) {
  try {
    const key = req.params.key
    const rows = await db.$queryRawUnsafe(`SELECT * FROM "feature_flags" WHERE key = $1 LIMIT 1`, key)
    const cur = rows && rows[0]
    if (!cur) throw new AppError('Feature flag not found', 404)

    const { enabled, description, environment, rolloutScope, expectedVersion } = req.body

    // ── validation ──────────────────────────────────────────────────────────
    if (enabled !== undefined && typeof enabled !== 'boolean') throw new AppError('enabled must be a boolean', 422)
    if (environment !== undefined && !ENVIRONMENTS.includes(environment)) throw new AppError(`environment must be one of ${ENVIRONMENTS.join(', ')}`, 422)
    if (rolloutScope !== undefined && !ROLLOUT_SCOPES.includes(rolloutScope)) throw new AppError(`rolloutScope must be one of ${ROLLOUT_SCOPES.join(', ')}`, 422)
    if (description !== undefined && (typeof description !== 'string' || description.length > 300)) throw new AppError('description must be a string of 300 characters or fewer', 422)

    // ── optimistic concurrency ────────────────────────────────────────────────
    if (expectedVersion !== undefined && Number(expectedVersion) !== cur.version) {
      throw new AppError('This flag was changed by someone else. Reload and try again.', 409, 'VERSION_CONFLICT')
    }

    const sets = []
    const params = []
    const bind = (v) => { params.push(v); return `$${params.length}` }
    if (enabled !== undefined) sets.push(`enabled = ${bind(enabled)}`)
    if (description !== undefined) sets.push(`description = ${bind(description)}`)
    if (environment !== undefined) sets.push(`environment = ${bind(environment)}`)
    if (rolloutScope !== undefined) sets.push(`rollout_scope = ${bind(rolloutScope)}`)
    if (!sets.length) throw new AppError('Nothing to update', 400)

    sets.push(`version = version + 1`, `updated_by = ${bind(req.admin.id)}::uuid`, `updated_by_name = ${bind(req.admin.name)}`, `updated_at = now()`)
    // Compare-and-swap on the version we read — guards the read→write race even when
    // the client sends no expectedVersion.
    const keyBind = bind(key)
    const verBind = bind(cur.version)
    const updated = await db.$queryRawUnsafe(
      `UPDATE "feature_flags" SET ${sets.join(', ')} WHERE key = ${keyBind} AND version = ${verBind} RETURNING *`,
      ...params,
    )
    if (!updated || !updated[0]) {
      throw new AppError('This flag was changed by someone else. Reload and try again.', 409, 'VERSION_CONFLICT')
    }

    configCache.invalidate() // propagate to /api/config immediately
    await audit.record(req, {
      module: 'settings', action: 'flag.update', targetType: 'feature_flag', targetId: key, targetLabel: cur.label,
      before: shape(cur), after: shape(updated[0]),
    })
    return ApiResponse.success(res, { flag: shape(updated[0]) }, 'Feature flag updated')
  } catch (err) { next(err) }
}

module.exports = { list, update }
