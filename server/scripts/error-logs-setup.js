'use strict'

/**
 * Error-logs schema setup. Idempotent — safe to re-run. Applies
 * prisma/sql/error_logs.sql (creates the error_logs table and its indexes).
 *
 * Usage:  node scripts/error-logs-setup.js   (or: npm run logs:setup)
 *
 * Why a script and not a migration: this project does not run prisma migrate. The
 * Render build is `npm ci && npx prisma generate` — it never touches the schema — so
 * every file in prisma/sql/ is applied by hand, once, against whichever database you
 * point DATABASE_URL at. Skipping this one is silent: the logger is best-effort, so a
 * missing table means nothing is ever recorded, which looks exactly like "no errors".
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()
const SQL_PATH = path.join(__dirname, '..', 'prisma', 'sql', 'error_logs.sql')

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

  // Prove it, rather than trusting that CREATE TABLE IF NOT EXISTS did anything —
  // the whole failure mode this guards against is a silent no-op.
  const [{ n }] = await db.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS n FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'error_logs'`,
  )
  if (!n) throw new Error('error_logs still does not exist after applying the SQL')

  const [{ rows }] = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS rows FROM "error_logs"`)
  console.log(`✓ error_logs ready (${rows} row${rows === 1 ? '' : 's'})`)
}

main()
  .catch((err) => { console.error('Error-logs setup failed:', err); process.exitCode = 1 })
  .finally(async () => { await db.$disconnect() })
