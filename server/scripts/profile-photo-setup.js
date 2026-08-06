'use strict'

/**
 * Profile-photo schema setup. Idempotent — safe to re-run. Applies
 * prisma/sql/profile_photo.sql (adds the photo_url column to users).
 *
 * Usage:  node scripts/profile-photo-setup.js   (or: npm run profile-photo:setup)
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()
const SQL_PATH = path.join(__dirname, '..', 'prisma', 'sql', 'profile_photo.sql')

function splitStatements(sql) {
  return sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function main() {
  await db.$connect()
  const sql = fs.readFileSync(SQL_PATH, 'utf8')
  for (const stmt of splitStatements(sql)) await db.$executeRawUnsafe(stmt)
  console.log('✓ Profile photo schema ready (users.photo_url)')
}

main()
  .catch((err) => { console.error('Profile photo setup failed:', err); process.exitCode = 1 })
  .finally(async () => { await db.$disconnect() })
