'use strict'

/**
 * One-time move of uploaded files off Supabase Storage onto this server's disk.
 *
 * Scans every text / json / array column in schema public for Supabase public
 * storage URLs, downloads each file into server/uploads/ (same path as in the
 * bucket), then rewrites the URL prefix to APP_PUBLIC_URL/uploads/ in one
 * transaction. If any download fails it stops before touching the database.
 * Re-runnable: files already on disk are not downloaded again.
 *
 * Usage:  node scripts/migrate-supabase-storage.js           (dry run — changes nothing)
 *         node scripts/migrate-supabase-storage.js --apply
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const { config } = require('../src/config/env')
const { UPLOAD_DIR } = require('../src/services/storage')

const APPLY = process.argv.includes('--apply')
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '')
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'content-images'
const OLD = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`
const NEW = `${config.publicUrl}/uploads/`

const db = new PrismaClient()
const q = (id) => `"${id.replace(/"/g, '""')}"`
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

async function main() {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL is not set in .env')
  console.log(`from: ${OLD}\nto:   ${NEW}\n`)

  const cols = await db.$queryRawUnsafe(`
    SELECT c.table_name AS t, c.column_name AS c
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public'
      AND c.data_type IN ('text', 'character varying', 'json', 'jsonb', 'ARRAY')`)

  const hits = [] // columns that contain at least one old URL
  const files = new Set()
  const re = new RegExp(escapeRe(OLD) + '([A-Za-z0-9_\\-./]+)', 'g')
  for (const { t, c } of cols) {
    const rows = await db.$queryRawUnsafe(
      `SELECT ${q(c)}::text AS v FROM ${q(t)} WHERE strpos(${q(c)}::text, $1) > 0`, OLD)
    if (!rows.length) continue
    hits.push({ t, c, rows: rows.length })
    for (const { v } of rows) for (const m of v.matchAll(re)) files.add(m[1])
  }

  for (const h of hits) console.log(`${h.t}.${h.c}: ${h.rows} row(s)`)
  console.log(`\n${files.size} distinct file(s) referenced`)
  if (!APPLY) return console.log('\nDry run — nothing changed. Re-run with --apply.')
  if (/localhost|127\.0\.0\.1/.test(NEW)) throw new Error('APP_PUBLIC_URL points at localhost — set it to the public API URL first.')

  // 1. Download. Any failure → stop before the database is touched.
  const failed = []
  let n = 0
  for (const rel of files) {
    const dest = path.resolve(UPLOAD_DIR, rel)
    if (!dest.startsWith(UPLOAD_DIR + path.sep)) { failed.push(`${rel} (bad path)`); continue }
    n++
    if (fs.existsSync(dest)) continue
    try {
      const res = await fetch(OLD + rel)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
      console.log(`  ${n}/${files.size} ${rel}`)
    } catch (e) {
      failed.push(`${rel} (${e.message})`)
    }
  }
  if (failed.length) {
    console.error(`\n${failed.length} download(s) failed — database NOT changed:\n  ${failed.join('\n  ')}`)
    process.exitCode = 1
    return
  }

  // 2. Rewrite the prefix everywhere, all or nothing.
  await db.$transaction(async (tx) => {
    for (const { t, c } of hits) {
      const [{ type }] = await tx.$queryRawUnsafe(
        `SELECT format_type(atttypid, atttypmod) AS type FROM pg_attribute
         WHERE attrelid = $1::regclass AND attname = $2`, `public.${q(t)}`, c)
      const count = await tx.$executeRawUnsafe(
        `UPDATE ${q(t)} SET ${q(c)} = replace(${q(c)}::text, $1, $2)::${type}
         WHERE strpos(${q(c)}::text, $1) > 0`, OLD, NEW)
      console.log(`  updated ${t}.${c}: ${count}`)
    }
  }, { timeout: 10 * 60 * 1000 })
  console.log('\nDone. All files on disk, all URLs rewritten.')
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
