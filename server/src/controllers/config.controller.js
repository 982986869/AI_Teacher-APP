'use strict'

// Public runtime configuration for the Student & Parent apps. Assembles ONLY whitelisted,
// client-safe values from the SAME feature_flags / app_settings tables the admin portal
// writes. Never exposes admin identity, audit data, secrets, env vars or internal keys.
//
// Caching: one DB read path, an in-process cache (short TTL) + a content-hash config
// version used as an ETag so clients get 304 Not Modified when nothing changed. Admin
// flag/setting writes call invalidate(), so an emergency maintenance toggle propagates
// on the next request (no long cache).

const crypto = require('crypto')
const db = require('../config/database')
const { config } = require('../config/env')
const ApiResponse = require('../utils/ApiResponse')

const CACHE_TTL_MS = 30 * 1000 // short, safe TTL — keeps maintenance toggles responsive
let cache = { at: 0, payload: null, etag: null }

// feature_flags keys are snake_case in the DB; the apps consume camelCase.
const FLAG_CAMEL = {
  ai_teacher: 'aiTeacher', brain_gym: 'brainGym', arena: 'arena', practice: 'practice',
  resources: 'resources', parent_app: 'parentApp', notifications: 'notifications', experimental: 'experimental',
}

const SEMVER = /^\d+\.\d+\.\d+$/
const safeVersion = (v) => (typeof v === 'string' && SEMVER.test(v) ? v : '0.0.0')
const safeStr = (v, max = 500) => (typeof v === 'string' ? v.slice(0, max) : '')
const safeBool = (v) => v === true

async function build() {
  const env = config.nodeEnv
  const [flags, settings] = await Promise.all([
    db.$queryRawUnsafe(`SELECT key, enabled, environment FROM "feature_flags"`).catch(() => []),
    db.$queryRawUnsafe(`SELECT key, value, updated_at FROM "app_settings"
                          WHERE key IN ('maintenance_mode','platform_config','mobile_release',
                                        'supported_classes','academic_year','default_student_experience','app_version')`).catch(() => []),
  ])

  // A flag is live when enabled AND its environment matches (all = every env).
  const featureFlags = {}
  for (const f of flags) {
    const camel = FLAG_CAMEL[f.key]
    if (!camel) continue // whitelist: ignore unknown flag keys
    featureFlags[camel] = safeBool(f.enabled) && (f.environment === 'all' || f.environment === env)
  }

  const byKey = Object.fromEntries(settings.map((s) => [s.key, (s.value && typeof s.value === 'object') ? s.value : {}]))
  const maintenance = byKey.maintenance_mode || {}
  const mobile = byKey.mobile_release || {}
  const platform = byKey.platform_config || {}
  const updatedAt = settings.reduce((max, s) => (s.updated_at > max ? s.updated_at : max), new Date(0))

  const EXPERIENCES = ['standard', 'guided', 'exam']
  const experience = EXPERIENCES.includes(byKey.default_student_experience?.experience)
    ? byKey.default_student_experience.experience : 'standard'

  // Deterministic, whitelisted payload (excludes cachedAt so the hash is stable).
  const stable = {
    featureFlags,
    maintenance: { enabled: safeBool(maintenance.enabled), message: safeStr(maintenance.message, 280) },
    platformConfig: {
      signupsEnabled: platform.signupsEnabled !== false,
      leaderboardEnabled: platform.leaderboardEnabled !== false,
    },
    supportedClasses: Array.isArray(byKey.supported_classes?.classes)
      ? byKey.supported_classes.classes.filter((c) => Number.isInteger(c) && c >= 1 && c <= 12) : [],
    academicYear: safeStr(byKey.academic_year?.year, 20),
    defaultStudentExperience: experience,
    appVersion: safeStr(byKey.app_version?.version, 30) || '1.0.0',
    minAndroidVersion: safeVersion(mobile.minAndroidVersion),
    minIosVersion: safeVersion(mobile.minIosVersion),
    forceUpdate: safeBool(mobile.forceUpdate),
    androidStoreUrl: safeStr(mobile.androidStoreUrl, 300),
    iosStoreUrl: safeStr(mobile.iosStoreUrl, 300),
    releaseNotes: safeStr(mobile.releaseNotes, 2000),
    updatedAt: updatedAt.toISOString(),
  }
  const configVersion = crypto.createHash('sha1').update(JSON.stringify(stable)).digest('hex').slice(0, 16)
  return { payload: { ...stable, configVersion }, etag: `"cfg-${configVersion}"` }
}

// Invalidate the cache (called by admin flag/setting writes so changes propagate fast).
function invalidate() { cache = { at: 0, payload: null, etag: null } }

// GET /api/config — public, cached, ETag/304.
async function get(req, res, next) {
  try {
    const now = Date.now()
    if (!cache.payload || now - cache.at > CACHE_TTL_MS) {
      const built = await build()
      cache = { at: now, payload: built.payload, etag: built.etag }
    }
    res.set('Cache-Control', `public, max-age=${CACHE_TTL_MS / 1000}, must-revalidate`)
    res.set('ETag', cache.etag)

    // Conditional request: unchanged config → 304 Not Modified (no body).
    const inm = req.headers['if-none-match']
    if (inm && inm === cache.etag) return res.status(304).end()

    return ApiResponse.success(res, { ...cache.payload, cachedAt: new Date(cache.at).toISOString() })
  } catch (err) { next(err) }
}

module.exports = { get, invalidate }
