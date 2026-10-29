'use strict'

/**
 * Copies every image the database loads from another site (myCBSEguide's S3, imgur,
 * dicebear, the WordPress site, …) onto this server's disk and points the database
 * at our copy, so no content image depends on a third party.
 *
 * Finds image URLs in src="…" attributes (HTML / JSON blocks) and in image-like
 * columns (image_url, photo_url, …). Each file is saved under uploads/ext/<host>/…;
 * uploads/ext/manifest.json maps original URL → saved file. Only responses that are
 * really images (or PDFs) are kept. Failures go to uploads/ext/failed.txt and their
 * URLs are left as they are. The rewrite is one transaction.
 * Re-runnable: anything already in the manifest is not downloaded again.
 *
 * Usage:  node scripts/localize-external-images.js             (dry run — counts only)
 *         node scripts/localize-external-images.js --download  (download, DB untouched)
 *         node scripts/localize-external-images.js --apply     (download + rewrite DB)
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')
const { config } = require('../src/config/env')
const { UPLOAD_DIR } = require('../src/services/storage')

const APPLY = process.argv.includes('--apply')
const DOWNLOAD = APPLY || process.argv.includes('--download')
const OUR_HOST = new URL(config.publicUrl).host
const EXT_DIR = path.join(UPLOAD_DIR, 'ext')
const MANIFEST = path.join(EXT_DIR, 'manifest.json')
const CONCURRENCY = 8

const URL_CHARS = `[^\\s"'<>)\\\\&]+`
const SRC_RE = new RegExp(`src=(?:\\\\?"|&quot;|')(https?://${URL_CHARS})`, 'g')
const ANY_RE = new RegExp(`https?://${URL_CHARS}`, 'g')
const IMAGE_COL = /(image|photo|avatar|logo|icon|thumb|banner|cover|attachment)|^url$/i
const EXT_BY_TYPE = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/pjpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/bmp': 'bmp', 'image/x-icon': 'ico', 'application/pdf': 'pdf' }
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'pdf']

// File extension for a response, or null if it isn't an image. S3 buckets often send
// non-standard types (image/jpg) or a generic octet-stream for a .png key.
function extFor(type, u) {
  if (EXT_BY_TYPE[type]) return EXT_BY_TYPE[type]
  if (type.startsWith('image/')) return type.slice(6).replace(/[^a-z0-9]/g, '') || null
  const fromPath = path.extname(new URL(u).pathname).slice(1).toLowerCase()
  if (/octet-stream$/.test(type) && IMAGE_EXTS.includes(fromPath)) return fromPath === 'jpeg' ? 'jpg' : fromPath
  return null
}

const db = new PrismaClient()
const q = (id) => `"${id.replace(/"/g, '""')}"`
const isForeign = (u) => { try { return new URL(u).host !== OUR_HOST } catch { return false } }

async function columns() {
  return db.$queryRawUnsafe(`
    SELECT c.table_name AS t, c.column_name AS c, c.udt_name AS typ
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public'
      AND c.data_type IN ('text', 'character varying', 'json', 'jsonb', 'ARRAY')`)
}

// Image URLs in one cell value.
function imageUrls(col, v) {
  const out = [...v.matchAll(SRC_RE)].map((m) => m[1])
  if (IMAGE_COL.test(col)) out.push(...(v.match(ANY_RE) || []))
  return out.filter(isForeign)
}

// Saved file path (relative to uploads/) for a URL + its content type.
function localPath(u, ext) {
  const { host, pathname, search } = new URL(u)
  let p = pathname.replace(/[^A-Za-z0-9._/-]/g, '_').replace(/\.\.+/g, '.').replace(/^\/+|\/+$/g, '') || 'index'
  if (search) p += '_' + crypto.createHash('sha1').update(search).digest('hex').slice(0, 10)
  if (path.extname(p).slice(1).toLowerCase() !== ext && !(ext === 'jpg' && /\.jpe?g$/i.test(p))) p += '.' + ext
  return `ext/${host.replace(/[^A-Za-z0-9.-]/g, '_')}/${p}`
}

async function fetchOne(u, manifest) {
  // Some hosts (Wikimedia) reject requests that don't identify themselves.
  const res = await fetch(u, { signal: AbortSignal.timeout(20000), redirect: 'follow', headers: { 'User-Agent': 'AilernovaImageCopy/1.0 (+https://ailernova.in)' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  const ext = extFor(type, u)
  if (!ext) throw new Error(`not an image (${type || 'no content-type'})`)
  const rel = localPath(u, ext)
  const dest = path.resolve(UPLOAD_DIR, rel)
  if (!dest.startsWith(EXT_DIR + path.sep)) throw new Error('bad path')
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
  manifest[u] = rel
}

async function main() {
  console.log(`rewrite to: ${config.publicUrl}/uploads/ext/…\n`)
  if (APPLY && /localhost|127\.0\.0\.1|onrender\.com/.test(config.publicUrl)) {
    throw new Error(`APP_PUBLIC_URL is ${config.publicUrl} — set it to the public API URL first.`)
  }

  // 1. Find every foreign image URL.
  const cols = await columns()
  const urls = new Map() // url → number of cells using it
  const hitCols = []
  for (const { t, c, typ } of cols) {
    const rows = await db.$queryRawUnsafe(`SELECT ${q(c)}::text AS v FROM ${q(t)} WHERE strpos(${q(c)}::text, 'http') > 0`)
    let n = 0
    for (const { v } of rows) {
      const found = imageUrls(c, v)
      if (found.length) n++
      for (const u of found) urls.set(u, (urls.get(u) || 0) + 1)
    }
    if (n) hitCols.push({ t, c, typ, n })
  }
  const byHost = {}
  for (const u of urls.keys()) { const h = new URL(u).host; byHost[h] = (byHost[h] || 0) + 1 }
  for (const h of hitCols) console.log(`${h.t}.${h.c}: ${h.n} row(s)`)
  console.log('\ndistinct files per host:')
  for (const [h, n] of Object.entries(byHost).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(6)}  ${h}`)
  console.log(`\n${urls.size} distinct image URL(s)`)
  if (!DOWNLOAD) return console.log('\nDry run — nothing changed. Re-run with --download, then --apply.')

  // 2. Download what isn't in the manifest yet.
  fs.mkdirSync(EXT_DIR, { recursive: true })
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {}
  const todo = [...urls.keys()].filter((u) => !manifest[u])
  const FAILED = path.join(EXT_DIR, 'failed.txt')
  fs.writeFileSync(FAILED, '')
  let failed = 0
  let done = 0
  const save = () => fs.writeFileSync(MANIFEST, JSON.stringify(manifest))
  async function worker() {
    while (todo.length) {
      const u = todo.shift()
      try { await fetchOne(u, manifest) } catch (e) { failed++; fs.appendFileSync(FAILED, `${u}\t${e.message}\n`) }
      if (++done % 100 === 0) save()
      if (done % 1000 === 0) console.log(`  ${done}/${urls.size - n0} tried, ${failed} failed`)
    }
  }
  const n0 = urls.size - todo.length
  console.log(`\ndownloading ${todo.length} (${urls.size - todo.length} already on disk)…`)
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  save()
  console.log(`done. ${Object.keys(manifest).length} on disk, ${failed} failed → uploads/ext/failed.txt`)
  if (!APPLY) return console.log('\nDatabase NOT changed. Re-run with --apply to rewrite URLs.')

  // 3. Rewrite every saved URL, anywhere in the hit columns, in one transaction.
  const prefix = `${config.publicUrl}/uploads/`
  let changed = 0
  await db.$transaction(async (tx) => {
    for (const { t, c, typ } of hitCols) {
      const rows = await tx.$queryRawUnsafe(`SELECT ctid::text AS id, ${q(c)}::text AS v FROM ${q(t)} WHERE strpos(${q(c)}::text, 'http') > 0`)
      for (const { id, v } of rows) {
        const nv = v.replace(ANY_RE, (u) => (manifest[u] ? prefix + manifest[u] : u))
        if (nv === v) continue
        await tx.$executeRawUnsafe(`UPDATE ${q(t)} SET ${q(c)} = $1::${q(typ)} WHERE ctid = $2::tid`, nv, id)
        changed++
      }
    }
  }, { timeout: 60 * 60 * 1000, maxWait: 60 * 1000 })
  console.log(`\nrewrote ${changed} cell(s).`)
}

main()
  .catch((e) => { console.error(e.message); process.exitCode = 1 })
  .finally(() => db.$disconnect())
