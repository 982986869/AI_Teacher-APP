'use strict'

/**
 * CMS schema setup (Phase 1). Idempotent — safe to re-run. Applies prisma/sql/cms.sql
 * (cms_nodes / cms_versions / cms_content_items). No content is seeded — the admin
 * builds the hierarchy from the portal.
 *
 * Usage:  node scripts/cms-setup.js   (or: npm run cms:setup)
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()
const SQL_PATH = path.join(__dirname, '..', 'prisma', 'sql', 'cms.sql')

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
  console.log('✓ CMS schema ready (cms_nodes, cms_versions, cms_content_items)')
}

main()
  .catch((err) => { console.error('CMS setup failed:', err); process.exitCode = 1 })
  .finally(async () => { await db.$disconnect() })
