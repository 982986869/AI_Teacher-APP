'use strict'

/**
 * Live-sessions schema setup. Idempotent — safe to re-run. Applies prisma/sql/sessions.sql
 * (creates the "sessions" table if missing, and adds the recording_url column to older
 * databases). No data is seeded — the admin publishes sessions from the portal.
 *
 * Usage:  node scripts/sessions-setup.js   (or: npm run sessions:setup)
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()
const SQL_PATH = path.join(__dirname, '..', 'prisma', 'sql', 'sessions.sql')

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
  console.log('✓ Sessions schema ready (sessions + recording_url)')
}

main()
  .catch((err) => { console.error('Sessions setup failed:', err); process.exitCode = 1 })
  .finally(async () => { await db.$disconnect() })
