'use strict'
// Fetches mock-test data from web.examin8.com and saves the raw JSON to disk.
//
// For each category it pulls the listing (/v1/mock-test/category/{id}/), then
// walks every test in `data[]` and pulls the full question paper. Nothing is
// transformed — files land verbatim under data/examin8/ so ingestion can be a
// separate, re-runnable step. Already-downloaded files are skipped (resume).
//
// Auth: the API is cookie-gated. Put the FULL `Cookie:` header value (copied
// from your browser's request) into server/.env as EXAMIN8_COOKIE.
//
// Usage:
//   node scripts/scrape-examin8.js 1340                 # one category
//   node scripts/scrape-examin8.js 1340 1341 1342       # several
//   node scripts/scrape-examin8.js 1340 --force         # re-download existing
//   node scripts/scrape-examin8.js 1340 --listing-only  # skip question papers
//
// Requires Node 20+ (global fetch).
require('dotenv').config()
const fs = require('fs')
const path = require('path')

const BASE = process.env.EXAMIN8_BASE || 'https://web.examin8.com'
const COOKIE = process.env.EXAMIN8_COOKIE || ''

// URL template for a single question paper. {id} is replaced with testPaperID.
// Override in .env via EXAMIN8_PAPER_URL if the path differs.
// >>> Confirm this against the real Network-tab request before relying on it. <<<
const PAPER_URL_TEMPLATE =
  process.env.EXAMIN8_PAPER_URL || `${BASE}/v1/mock-test/test-paper/{id}/`

const OUT_DIR = path.resolve(__dirname, '..', 'data', 'examin8')
const THROTTLE_MS = Number(process.env.EXAMIN8_THROTTLE_MS || 600)

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const LISTING_ONLY = args.includes('--listing-only')
const categoryIds = args.filter((a) => /^\d+$/.test(a))

if (!COOKIE) {
  console.error('Missing EXAMIN8_COOKIE in server/.env (the full Cookie header value).')
  process.exit(1)
}
if (!categoryIds.length) {
  console.error('Pass at least one numeric category id, e.g. node scripts/scrape-examin8.js 1340')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const HEADERS = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
  cookie: COOKIE,
  referer: `${BASE}/`,
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS })
  const body = await res.text()
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}\n${body.slice(0, 300)}`)
  }
  try {
    return JSON.parse(body)
  } catch {
    throw new Error(`Non-JSON response from ${url} (status ${res.status}): ${body.slice(0, 200)}`)
  }
}

function save(relPath, data) {
  const full = path.join(OUT_DIR, relPath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, JSON.stringify(data, null, 2))
  return full
}

function exists(relPath) {
  return fs.existsSync(path.join(OUT_DIR, relPath))
}

async function scrapeCategory(categoryId) {
  console.log(`\n== Category ${categoryId} ==`)
  const listing = await fetchJson(`${BASE}/v1/mock-test/category/${categoryId}/`)
  save(`category-${categoryId}.json`, listing)
  const tests = Array.isArray(listing.data) ? listing.data : []
  console.log(`  listing saved — ${tests.length} tests (${listing.name || ''})`)

  if (LISTING_ONLY) return { tests: tests.length, papers: 0, skipped: 0, failed: 0 }

  let papers = 0
  let skipped = 0
  let failed = 0
  for (const t of tests) {
    const rel = `category-${categoryId}/paper-${t.id}.json`
    if (!FORCE && exists(rel)) {
      skipped += 1
      continue
    }
    const url = PAPER_URL_TEMPLATE.replace('{id}', t.id)
    try {
      const paper = await fetchJson(url)
      save(rel, paper)
      papers += 1
      console.log(`  paper ${t.id} (${t.name}) saved`)
    } catch (e) {
      failed += 1
      console.error(`  paper ${t.id} (${t.name}) FAILED: ${e.message.split('\n')[0]}`)
    }
    await sleep(THROTTLE_MS)
  }
  return { tests: tests.length, papers, skipped, failed }
}

;(async () => {
  console.log(`Scraping ${categoryIds.length} category(ies) -> ${OUT_DIR}`)
  console.log(`Paper URL template: ${PAPER_URL_TEMPLATE}`)
  const totals = { tests: 0, papers: 0, skipped: 0, failed: 0 }
  for (const id of categoryIds) {
    const r = await scrapeCategory(id)
    for (const k of Object.keys(totals)) totals[k] += r[k]
  }
  console.log(
    `\nDONE. tests=${totals.tests} papers=${totals.papers} skipped=${totals.skipped} failed=${totals.failed}`
  )
})().catch((e) => {
  console.error('SCRAPE ERROR:', e.message)
  process.exit(1)
})
