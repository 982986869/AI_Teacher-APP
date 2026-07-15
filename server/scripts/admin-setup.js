'use strict'

/**
 * Admin Portal setup + Super Admin seed. Idempotent — safe to re-run.
 *
 *   1. Applies prisma/sql/admin_portal.sql (adds users.admin_role/is_active/…,
 *      creates audit_logs / announcements / app_settings — all IF NOT EXISTS).
 *   2. Seeds default app_settings (feature flags, maintenance, academic year).
 *   3. Ensures a Super Admin exists, reading credentials from env (never hardcoded
 *      in any client). Password is bcrypt-hashed with the same cost as register.
 *
 * Credentials (env, with dev-only fallbacks):
 *   ADMIN_SEED_EMAIL     (default: saurabh@ailernova.com)
 *   ADMIN_SEED_PASSWORD  (default: pwd123  — DEV ONLY; set a strong value in prod)
 *   ADMIN_SEED_NAME      (default: Saurabh)
 *
 * If a user with that email already exists it is *elevated* to super_admin (its
 * learner data is untouched). The dev password is (re)set only outside production,
 * or when ADMIN_SEED_FORCE_PASSWORD=true.
 *
 * Usage:  node scripts/admin-setup.js       (or: npm run admin:setup)
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()
const SQL_PATH = path.join(__dirname, '..', 'prisma', 'sql', 'admin_portal.sql')

function splitStatements(sql) {
  return sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function applySchema() {
  const sql = fs.readFileSync(SQL_PATH, 'utf8')
  for (const stmt of splitStatements(sql)) await db.$executeRawUnsafe(stmt)
  console.log('✓ Admin schema ready (users.admin_role, audit_logs, announcements, app_settings)')
}

// Default settings — created only if absent, so admin edits are never overwritten.
const DEFAULT_SETTINGS = [
  { key: 'academic_year', category: 'academics', label: 'Academic year', description: 'Current academic session', value: { year: '2025-2026' } },
  { key: 'supported_classes', category: 'academics', label: 'Supported classes', description: 'Classes the platform serves', value: { classes: [6, 7, 8, 9, 10, 11, 12] } },
  { key: 'maintenance_mode', category: 'system', label: 'Maintenance mode', description: 'Show a maintenance banner and pause new sessions', value: { enabled: false, message: 'We\'ll be back shortly.' } },
  { key: 'app_version', category: 'system', label: 'App version', description: 'Version shown to users', value: { version: '1.0.0' } },
  { key: 'mobile_release', category: 'system', label: 'Mobile release', description: 'Per-platform minimum versions, store URLs, force-update and release notes served to the apps', value: { minAndroidVersion: '1.0.0', minIosVersion: '1.0.0', forceUpdate: false, androidStoreUrl: '', iosStoreUrl: '', releaseNotes: '' } },
  { key: 'platform_config', category: 'system', label: 'Platform configuration', description: 'Core platform switches', value: { signupsEnabled: true, leaderboardEnabled: true } },
  { key: 'contact_email', category: 'general', label: 'Contact email', description: 'Support contact address', value: { email: 'support@ailernova.com' } },
  { key: 'default_student_experience', category: 'general', label: 'Default student experience', description: 'Experience new students get by default', value: { experience: 'standard' } },
]

// The 8 product feature flags (dedicated table; per-flag metadata + audit).
const FEATURE_FLAGS = [
  { key: 'ai_teacher', label: 'AI Teacher', description: 'AI-generated lessons, doubts and live teaching' },
  { key: 'brain_gym', label: 'Brain Gym', description: 'Adaptive practice games and skill drills' },
  { key: 'arena', label: 'Arena', description: '1v1 async battles and leaderboards' },
  { key: 'practice', label: 'Practice', description: 'MCQ practice, mock tests and online tests' },
  { key: 'resources', label: 'Resources', description: 'Notes, NCERT/Exemplar solutions and last-year papers' },
  { key: 'parent_app', label: 'Parent App', description: 'Parent dashboard and child linking' },
  { key: 'notifications', label: 'Notifications', description: 'Push and email notifications' },
  { key: 'experimental', label: 'Experimental Features', description: 'Early-access features under active development', enabled: false },
]

async function seedSettings() {
  for (const s of DEFAULT_SETTINGS) {
    await db.$executeRawUnsafe(
      `INSERT INTO "app_settings" (key, value, category, label, description)
       VALUES ($1, $2::jsonb, $3, $4, $5)
       ON CONFLICT (key) DO NOTHING`,
      s.key, JSON.stringify(s.value), s.category, s.label, s.description,
    )
  }
  // Legacy keys superseded by the dedicated feature_flags table + flag model.
  await db.$executeRawUnsafe(`DELETE FROM "app_settings" WHERE key IN ('feature_flags', 'notifications')`)
  // Backfill mobile_release with any new per-platform keys without clobbering edits
  // (defaults fill gaps; existing values win on overlap).
  await db.$executeRawUnsafe(`UPDATE "app_settings"
      SET value = '{"minAndroidVersion":"1.0.0","minIosVersion":"1.0.0","forceUpdate":false,"androidStoreUrl":"","iosStoreUrl":"","releaseNotes":""}'::jsonb || value
    WHERE key = 'mobile_release'`)
  console.log(`✓ Default settings ensured (${DEFAULT_SETTINGS.length} keys; legacy blob removed)`)
}

async function seedFeatureFlags() {
  let pos = 0
  for (const f of FEATURE_FLAGS) {
    await db.$executeRawUnsafe(
      `INSERT INTO "feature_flags" (key, label, description, enabled, position)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (key) DO NOTHING`,
      f.key, f.label, f.description, f.enabled !== false, pos++,
    )
  }
  console.log(`✓ Feature flags ensured (${FEATURE_FLAGS.length})`)
}

async function seedSuperAdmin() {
  const email = (process.env.ADMIN_SEED_EMAIL || 'saurabh@ailernova.com').trim().toLowerCase()
  const password = process.env.ADMIN_SEED_PASSWORD || 'pwd123'
  const name = process.env.ADMIN_SEED_NAME || 'Saurabh'
  const isProd = process.env.NODE_ENV === 'production'
  const forcePw = process.env.ADMIN_SEED_FORCE_PASSWORD === 'true'

  if (isProd && !process.env.ADMIN_SEED_PASSWORD) {
    console.warn('⚠  NODE_ENV=production but ADMIN_SEED_PASSWORD is not set — refusing to seed the dev password. Set ADMIN_SEED_PASSWORD and re-run.')
    return
  }

  const existingRows = await db.$queryRawUnsafe(
    `SELECT id::text AS id, admin_role, "passwordHash" FROM "users" WHERE lower(email) = $1 LIMIT 1`,
    email,
  )
  const existing = existingRows && existingRows[0]

  if (existing) {
    const setPw = forcePw || !isProd || !existing.passwordHash
    if (setPw) {
      const hash = await bcrypt.hash(password, 12)
      await db.$executeRawUnsafe(
        `UPDATE "users" SET admin_role = 'super_admin', is_active = true, "passwordHash" = $2, role = 'ADMIN' WHERE id = $1::uuid`,
        existing.id, hash,
      )
      console.log(`✓ Existing user ${email} elevated to super_admin (password ${forcePw || !isProd ? 'set to seed value' : 'kept'})`)
    } else {
      await db.$executeRawUnsafe(
        `UPDATE "users" SET admin_role = 'super_admin', is_active = true, role = 'ADMIN' WHERE id = $1::uuid`,
        existing.id,
      )
      console.log(`✓ Existing user ${email} elevated to super_admin (existing password kept)`)
    }
    return
  }

  const hash = await bcrypt.hash(password, 12)
  await db.$executeRawUnsafe(
    `INSERT INTO "users" (id, name, email, "passwordHash", role, provider, admin_role, is_active, "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, 'ADMIN', 'EMAIL', 'super_admin', true, now(), now())`,
    name, email, hash,
  )
  console.log(`✓ Super Admin created: ${email}`)
  if (!isProd) console.log(`  (dev password: ${password})`)
}

async function main() {
  await db.$connect()
  await applySchema()
  await seedSettings()
  await seedFeatureFlags()
  await seedSuperAdmin()
  console.log('\nAdmin portal setup complete.')
}

main()
  .catch((err) => { console.error('Admin setup failed:', err); process.exitCode = 1 })
  .finally(async () => { await db.$disconnect() })
