'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Phase 2B — import Examin8 Last Year Papers into the EXISTING `papers` table.
//
// The `papers` table already backs Class 12 Last Year Papers (see
// scripts/migratePapers.js + scripts/lib/papersSchema.js). We reuse it verbatim —
// NO new tables. Each paper is UPSERTed by its stable identity
// (subject_id, class_level, ext_uid) where ext_uid = the examin8 paper uuid.
//
//   ext_uid              = uuid                (stable per paper)
//   class_level          = 10
//   question_paper_html  = snapshot            (verbatim — {tex}, math-tex, images kept)
//   answer_key_html      = answer_snapshot     (verbatim)
//   code / year / set_label / name / paper_title / paper_format='html'
//
// Pure UPSERT (no delete) so re-runs are resumable and never drop rows a partial
// fetch hasn't refreshed yet. Papers with no question_paper_html are SKIPPED
// (the login-gated snapshot wasn't fetched) — nothing empty is ever written.
//
// The frontend fetches these from the DB via the existing Last Year Papers flow
// (ResourcesScreen 'papers' tile → /api/resources/papers/:slug?class=10). Enabling
// the Class 10 tile is a one-line, data-only gate in ResourcesScreen (see README).
//
//   node scripts/examin8/importClass10LastYearPapers.js            # DRY RUN
//   node scripts/examin8/importClass10LastYearPapers.js --live     # apply + verify
//   node scripts/examin8/importClass10LastYearPapers.js --verify   # verify only (no writes)
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const { ENSURE_PAPERS_EXT_UID, UPSERT_PAPER_SQL, upsertParams } = require('../lib/papersSchema')

const ROOT = path.join(__dirname, '..', '..')
const LIVE = process.argv.includes('--live')
const VERIFY_ONLY = process.argv.includes('--verify')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const NORM = path.join(ROOT, 'data', 'examin8', CLASS_DIR, 'normalized')
const CLASS_LEVEL_DEFAULT = 10

// Subjects to spot-check after import (subject slug → required minimum year).
// Math must show the 2025 paper; Science / Social Science show papers if the API
// returned any (they may have fewer years than Math).
const VERIFY_TARGETS = [
  { slug: 'mathematics',    name: 'Mathematics',    requireYear: 2025 },
  { slug: 'science',        name: 'Science',        requireYear: null },
  { slug: 'social-science', name: 'Social Science', requireYear: null },
]

function readJson(file) {
  const p = path.join(NORM, file)
  if (!fs.existsSync(p)) return null
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
    .match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

// Mirror of resources.service.listPapers — confirm papers resolve for a subject.
async function verifySubject(client, slug, classLevel, requireYear) {
  const q = await client.query(
    `select count(*)::int n, max(p.year) as maxyear,
            count(*) filter (where p.year = $3)::int hasyear
       from papers p join subjects s on s.id = p.subject_id
      where s.slug = $1 and p.class_level = $2 and p.paper_format = 'html'`,
    [slug, classLevel, requireYear])
  const row = q.rows[0] || { n: 0, maxyear: null, hasyear: 0 }
  const ok = row.n > 0 && (requireYear == null || row.hasyear > 0)
  return { ok, count: row.n, maxYear: row.maxyear, hasYear: row.hasyear }
}

async function runVerify(client, classLevel) {
  console.log('\n── VERIFY ─────────────────────────────')
  for (const t of VERIFY_TARGETS) {
    const r = await verifySubject(client, t.slug, classLevel, t.requireYear)
    const detail = r.count
      ? `${r.count} papers (latest ${r.maxYear}${t.requireYear ? `; ${t.requireYear} present: ${r.hasYear ? 'yes' : 'NO'}` : ''})`
      : 'no papers in DB'
    console.log(`  ${r.ok ? '✓' : '✗'} ${t.name} → Last Year Papers: ${detail}`)
  }
}

async function main() {
  const data = readJson('last-year-papers.json') || []
  const subjects = readJson('subjects.json') || []
  const classBySlug = Object.fromEntries(subjects.map((s) => [s.slug, Number(s.class_level)]))

  if (VERIFY_ONLY) {
    const { Client } = require('pg')
    const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
    await client.connect()
    try { await runVerify(client, CLASS_LEVEL_DEFAULT) } finally { await client.end() }
    return
  }

  let totPapers = 0, totWithHtml = 0
  for (const s of data) for (const p of s.papers) { totPapers++; if (p.question_paper_html) totWithHtml++ }
  console.log(`\nImport Last Year Papers → papers table (class_level=${CLASS_LEVEL_DEFAULT}) — ${CLASS_DIR}`)
  console.log(`  subjects=${data.length}  papers=${totPapers}  with snapshot HTML=${totWithHtml}`)
  if (!totWithHtml) {
    console.log('  (no snapshot HTML yet — run fetchClass10LastYearPapers.js with EXAMIN8_COOKIE/CSRF first.)')
  }
  if (!LIVE) { console.log('\n[DRY] add --live to write to the DB.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')

  const stat = { subjectsScanned: 0, papersFetched: 0, inserted: 0, updated: 0, skippedNoHtml: 0, errors: [] }
  try {
    // Existing table (Class 12 uses it). ENSURE is idempotent — adds nothing new
    // if the columns/constraints are already present; creates it only on a fresh DB.
    await client.query(ENSURE_PAPERS_EXT_UID)
    console.log('✓ papers schema ensured (identity = subject, class, ext_uid).')

    for (const s of data) {
      stat.subjectsScanned += 1
      const classLevel = classBySlug[s.subject_slug] || Number(s.class_level) || CLASS_LEVEL_DEFAULT
      const sub = await client.query(
        `insert into subjects (name, slug) values ($1,$2)
         on conflict (slug) do update set name = excluded.name returning id`,
        [s.subject, s.subject_slug])
      const subjectId = sub.rows[0].id

      let subInserted = 0, subUpdated = 0
      for (const p of s.papers) {
        stat.papersFetched += 1
        if (!p.question_paper_html) { stat.skippedNoHtml += 1; continue }
        try {
          const r = await client.query(
            `${UPSERT_PAPER_SQL} returning (xmax = 0) as inserted`,
            upsertParams(subjectId, classLevel, p))
          if (r.rows[0].inserted) { stat.inserted++; subInserted++ } else { stat.updated++; subUpdated++ }
        } catch (e) {
          stat.errors.push(`${s.subject} ${p.year}/${p.code} (${p.ext_uid}): ${e.message}`)
        }
      }
      console.log(`  ✓ ${s.subject}: ${subInserted} new, ${subUpdated} updated (class_level=${classLevel})`)
    }

    console.log('\n── LOG ────────────────────────────────')
    console.log(`  Subjects scanned      : ${stat.subjectsScanned}`)
    console.log(`  Papers fetched (json) : ${stat.papersFetched}`)
    console.log(`  Papers imported       : ${stat.inserted} new, ${stat.updated} updated`)
    console.log(`  Skipped (no snapshot) : ${stat.skippedNoHtml}`)
    console.log(`  Errors                : ${stat.errors.length}`)
    stat.errors.slice(0, 20).forEach((e) => console.log(`     ! ${e}`))

    await runVerify(client, CLASS_LEVEL_DEFAULT)
  } finally { await client.end() }

  console.log('\n✓ Last Year Papers imported into the papers table (class_level=10).')
  console.log('  DISPLAY: enable the Class 10 "Last Year Papers" tile — a data-only gate in')
  console.log('  src/screens/ResourcesScreen.js (getResourceTypes + isDbPapers). See scripts/examin8/README.md.')
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
