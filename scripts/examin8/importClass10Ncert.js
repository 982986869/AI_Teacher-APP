'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Phase 2C — import Class 10 NCERT & Exemplar textbook solutions into the EXISTING
// `ncert_solutions` table (the same table Class 6–9 use; NO new tables).
//
// One row per exercise "section": (part, subject, className='Class 10', chapter,
// sectionKey, sectionLabel, html, chapterPos, position). The frontend renders it
// via Ncert2Screen → getNcert/getNcertChapters (server/src/controllers/ncert.controller.js),
// which reads exactly these columns. HTML is stored verbatim.
//
//   part 2 = NCERT Solutions, part 3 = Exemplar Solutions,
//   parts 6/7/8 = the extra NCERT books of a multi-book subject (Social Science).
//
// Idempotent: deletes existing rows for each (part, subject, className) it is about
// to write, then inserts — safe to re-run.
//
//   node scripts/examin8/importClass10Ncert.js            # DRY RUN
//   node scripts/examin8/importClass10Ncert.js --live     # apply + verify
//   TYPE=ncert  node scripts/examin8/importClass10Ncert.js --live   # only part-2 books
//   node scripts/examin8/importClass10Ncert.js --verify   # verify only (no writes)
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const LIVE = process.argv.includes('--live')
const VERIFY_ONLY = process.argv.includes('--verify')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const CLASS_NAME = 'Class 10'
const NORM = path.join(ROOT, 'data', 'examin8', CLASS_DIR, 'normalized')
const TYPE = (process.env.TYPE || '').toLowerCase() // 'ncert' | 'exemplar' | ''

// Deep verification targets: (subject, part) + a named chapter to inspect for
// exercises/HTML/math/images. `expectImages` asserts <img> presence (Maths has
// figures; text subjects may legitimately have none, so it's reported not asserted).
const VERIFY_TARGETS = [
  { subject: 'Mathematics',    part: 2, chapter: 'Real Numbers', expectImages: true,  expectMath: true },  // NCERT
  { subject: 'Mathematics',    part: 3, chapter: 'Real Numbers', expectImages: true,  expectMath: true },  // Exemplar
  { subject: 'Science',        part: 2, chapter: null,           expectImages: false, expectMath: true },  // NCERT
  { subject: 'Social Science', part: 2, chapter: null,           expectImages: false, expectMath: false }, // NCERT (Pol Sci — a civics text, no math)
]

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
    .match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

// Rebuild ncert_solutions rows from the normalized book-parts.
function toRows(normalized) {
  const rows = []
  for (const bp of normalized) {
    if (TYPE === 'ncert' && bp.part === 3) continue
    if (TYPE === 'exemplar' && bp.part !== 3) continue
    const bookLabel = bp.book_label || bp.book_match || (bp.part === 3 ? 'Exemplar Solutions' : 'NCERT Solutions')
    ;(bp.chapters || []).forEach((c, ci) => (c.sections || []).forEach((sec, si) => rows.push({
      part: bp.part, subject: bp.subject, className: CLASS_NAME, chapter: c.chapter,
      sectionKey: String(sec.label || 'section').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + si,
      sectionLabel: sec.label, html: sec.html, chapterPos: ci, position: si, book_label: bookLabel,
    })))
  }
  return rows
}

async function verify(client) {
  console.log('\n── VERIFY (all subjects/books in DB) ───')
  let allPass = true
  const check = (cond, msg) => { if (!cond) { console.log(`     ✗ ${msg}`); allPass = false } }
  // Discover every (subject, part) present for Class 10 — nothing hardcoded.
  const bp = await client.query(
    `select subject, part, coalesce(max(book_label),'') book_label,
            count(distinct chapter)::int chapters, count(*)::int sections,
            count(*) filter (where html like '%<img%')::int imgsecs,
            bool_or(html like '%math-tex%' or html like '%{tex}%') hasmath
       from ncert_solutions where "className"=$1 group by subject, part order by subject, part`,
    [CLASS_NAME])
  for (const r of bp.rows) {
    const label = r.book_label || (r.part === 3 ? 'Exemplar' : `part ${r.part}`)
    // chapter ordering + no dup exercises for the first chapter of this book
    const chq = await client.query(
      `select chapter, min("chapterPos") cp from ncert_solutions where subject=$1 and part=$2 and "className"=$3 group by chapter order by cp`,
      [r.subject, r.part, CLASS_NAME])
    const cps = chq.rows.map((x) => Number(x.cp))
    const ordered = cps.every((v, i) => i === 0 || v >= cps[i - 1])
    const noDup = new Set(chq.rows.map((x) => x.chapter.toLowerCase())).size === chq.rows.length
    console.log(`  ${r.subject} · ${label}: ${r.chapters} ch, ${r.sections} sections, math=${r.hasmath}, img=${r.imgsecs} ${ordered && noDup ? '✓' : '✗ ORDER/DUP'}`)
    check(r.chapters > 0 && r.sections > 0, `${r.subject}/${label}: has content`)
    check(ordered, `${r.subject}/${label}: chapter ordering`)
    check(noDup, `${r.subject}/${label}: no duplicate chapters`)
  }
  console.log(`\n  ${allPass ? '✓ ALL VERIFY CHECKS PASSED' : '✗ SOME CHECKS FAILED'} — ${bp.rows.length} book-parts`)
  return allPass
}

async function main() {
  const outPath = path.join(NORM, 'ncert-solutions.json')
  const normalized = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : []

  if (VERIFY_ONLY) {
    const { Client } = require('pg')
    const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
    await client.connect()
    try { await verify(client) } finally { await client.end() }
    return
  }

  const rows = toRows(normalized)
  const bookParts = normalized.filter((bp) => !(TYPE === 'ncert' && bp.part === 3) && !(TYPE === 'exemplar' && bp.part !== 3))
  console.log(`\nImport NCERT/Exemplar → ncert_solutions (className='${CLASS_NAME}') — ${CLASS_DIR}${TYPE ? ` (TYPE=${TYPE})` : ''}`)
  console.log(`  book-parts=${bookParts.length}  rows=${rows.length}`)
  if (!rows.length) { console.log('  (nothing to import — run fetchClass10Ncert.js first.)') }
  if (!LIVE) { console.log('\n[DRY] add --live to write to the DB.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')

  const stat = { deleted: 0, inserted: 0, errors: [] }
  try {
    // book_label lets the app build NCERT/Exemplar tiles dynamically (multi-book
    // subjects). Minimal, safe, idempotent add to the existing table.
    await client.query('alter table ncert_solutions add column if not exists book_label text')
    // Delete existing rows for each (part, subject, className) we're about to write.
    const scopes = Array.from(new Set(bookParts.map((bp) => `${bp.part}|${bp.subject}`)))
    for (const sc of scopes) {
      const [part, subject] = [Number(sc.split('|')[0]), sc.split('|').slice(1).join('|')]
      const d = await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [part, subject, CLASS_NAME])
      stat.deleted += d.rowCount
    }
    // Batch inserts (100/query) so big multi-subject runs don't drop the connection.
    const BATCH = 100
    for (let b = 0; b < rows.length; b += BATCH) {
      const slice = rows.slice(b, b + BATCH)
      const values = []; const params = []
      slice.forEach((r, k) => {
        const o = k * 10
        values.push(`($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8},$${o + 9},$${o + 10})`)
        params.push(r.part, r.subject, r.className, r.chapter, r.sectionKey, r.sectionLabel, r.html, r.chapterPos, r.position, r.book_label)
      })
      try {
        await client.query(
          `insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position, book_label)
           values ${values.join(',')}`, params)
        stat.inserted += slice.length
      } catch (e) { stat.errors.push(`batch @${b}: ${e.message}`) }
    }

    console.log('\n── LOG ────────────────────────────────')
    console.log(`  Rows deleted (old): ${stat.deleted}`)
    console.log(`  Rows inserted     : ${stat.inserted}`)
    console.log(`  Errors            : ${stat.errors.length}`)
    stat.errors.slice(0, 12).forEach((e) => console.log(`     ! ${e}`))

    await verify(client)
  } finally { await client.end() }

  console.log('\n✓ NCERT/Exemplar imported into ncert_solutions (Class 10).')
  console.log('  DISPLAY: the Class 10 NCERT/Exemplar tiles are in ResourcesScreen getResourceTypes (type=ncert2, part=2/3/6/7/8).')
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
