'use strict'

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const { config } = require('../../config/env')
const audit = require('../../services/admin/audit.service')
const configCache = require('../config.controller')

function shape(r) {
  return { key: r.key, value: r.value, category: r.category, label: r.label, description: r.description, version: r.version, updatedAt: r.updated_at }
}

// Targeted validation for the known settings (real checks, not just presence).
function validateSetting(key, value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError('value must be an object', 422)
  }
  if (key === 'contact_email' && value.email !== undefined) {
    if (typeof value.email !== 'string' || !/^\S+@\S+\.\S+$/.test(value.email)) throw new AppError('Invalid contact email', 422)
  }
  if (key === 'supported_classes' && value.classes !== undefined) {
    if (!Array.isArray(value.classes) || value.classes.some((c) => !Number.isInteger(c) || c < 1 || c > 12)) {
      throw new AppError('classes must be an array of integers 1–12', 422)
    }
  }
  if (key === 'maintenance_mode') {
    if (value.enabled !== undefined && typeof value.enabled !== 'boolean') throw new AppError('enabled must be a boolean', 422)
    if (value.message !== undefined && (typeof value.message !== 'string' || value.message.length > 280)) throw new AppError('message must be ≤ 280 characters', 422)
  }
  if (key === 'default_student_experience' && value.experience !== undefined) {
    if (!['standard', 'guided', 'exam'].includes(value.experience)) throw new AppError('Invalid experience (standard | guided | exam)', 422)
  }
  if (key === 'academic_year' && value.year !== undefined && (typeof value.year !== 'string' || value.year.length > 20)) {
    throw new AppError('year must be a string ≤ 20 characters', 422)
  }
  if (key === 'app_version' && value.version !== undefined && (typeof value.version !== 'string' || value.version.length > 30)) {
    throw new AppError('version must be a string ≤ 30 characters', 422)
  }
  if (key === 'mobile_release') {
    const semver = /^\d+\.\d+\.\d+$/
    for (const vk of ['minAndroidVersion', 'minIosVersion']) {
      if (value[vk] !== undefined && (typeof value[vk] !== 'string' || !semver.test(value[vk]))) {
        throw new AppError(`${vk} must be a semver string like 1.2.3`, 422)
      }
    }
    if (value.forceUpdate !== undefined && typeof value.forceUpdate !== 'boolean') throw new AppError('forceUpdate must be a boolean', 422)
    for (const uk of ['androidStoreUrl', 'iosStoreUrl']) {
      if (value[uk] !== undefined && (typeof value[uk] !== 'string' || value[uk].length > 300)) throw new AppError(`${uk} must be a string ≤ 300 characters`, 422)
    }
    if (value.releaseNotes !== undefined && (typeof value.releaseNotes !== 'string' || value.releaseNotes.length > 2000)) {
      throw new AppError('releaseNotes must be a string ≤ 2000 characters', 422)
    }
  }
}

// GET /api/admin/settings — all settings + read-only version info.
async function list(req, res, next) {
  try {
    const rows = await db.$queryRawUnsafe(
      // Legacy blob keys are superseded by the feature_flags table — never surface them.
      `SELECT key, value, category, label, description, version, updated_at
         FROM "app_settings" WHERE key NOT IN ('feature_flags', 'notifications')
        ORDER BY category, key`,
    ).catch(() => [])
    return ApiResponse.success(res, {
      settings: rows.map(shape),
      version: {
        apiVersion: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
        node: process.version,
      },
    })
  } catch (err) { next(err) }
}

// PATCH /api/admin/settings/:key  { value, expectedVersion? }  (settings.edit)
async function update(req, res, next) {
  try {
    const key = req.params.key
    if (req.body.value === undefined) throw new AppError('value is required', 422)
    validateSetting(key, req.body.value)

    const existing = await db.$queryRawUnsafe(`SELECT value, version FROM "app_settings" WHERE key = $1 LIMIT 1`, key)
    const cur = existing && existing[0]

    let rows
    if (cur) {
      // Optimistic concurrency: reject a stale write.
      if (req.body.expectedVersion !== undefined && Number(req.body.expectedVersion) !== cur.version) {
        throw new AppError('This setting was changed by someone else. Reload and try again.', 409, 'VERSION_CONFLICT')
      }
      rows = await db.$queryRawUnsafe(
        `UPDATE "app_settings" SET value = $1::jsonb, version = version + 1, updated_by = $2::uuid, updated_at = now()
           WHERE key = $3 AND version = $4
         RETURNING key, value, category, label, description, version, updated_at`,
        JSON.stringify(req.body.value), req.admin.id, key, cur.version,
      )
      if (!rows || !rows[0]) throw new AppError('This setting was changed by someone else. Reload and try again.', 409, 'VERSION_CONFLICT')
    } else {
      rows = await db.$queryRawUnsafe(
        `INSERT INTO "app_settings" (key, value, updated_by, updated_at, version)
         VALUES ($1, $2::jsonb, $3::uuid, now(), 1)
         RETURNING key, value, category, label, description, version, updated_at`,
        key, JSON.stringify(req.body.value), req.admin.id,
      )
    }
    configCache.invalidate() // propagate to /api/config immediately
    await audit.record(req, {
      module: 'settings', action: 'update', targetType: 'setting', targetId: key, targetLabel: key,
      before: cur ? cur.value : null, after: req.body.value,
    })
    return ApiResponse.success(res, { setting: shape(rows[0]) }, 'Setting saved')
  } catch (err) { next(err) }
}

module.exports = { list, update }
