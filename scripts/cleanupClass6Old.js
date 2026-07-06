'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Delete PRE-EXISTING (legacy-model) Class 6 OLD-subject data before reseeding
// under the shared "Old - X" rows. Removes:
//   1. subject 144 "Science (OLD)" — its class_level=6 chapters (cascades
//      sections/questions/subtopics/mcq_questions). Old science content is
//      reseeded under subject 155 "Old - Science".
//   2. ncert_solutions rows for className='Class 6' whose `subject` is a legacy
//      "(OLD)" name ('Maths (OLD)','Science (OLD)') — reseeded as 'Old - Maths'
//      / 'Old - Science'. New-syllabus rows (English (Poorvi), Science
//      (Curiosity), …) are left untouched.
//   3. ot_tests / mock_tests at class_level=6 for the old subjects (defensive —
//      currently none, but keeps re-runs idempotent).
//
//   node scripts/cleanupClass6Old.js            # DRY (report only)
//   node scripts/cleanupClass6Old.js --live     # delete
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 6
const CLASS_NAME = 'Class 6'
const LEGACY_NCERT_SUBJECTS = ['Maths (OLD)', 'Science (OLD)']
const OLD_SLUGS = ['old-maths', 'old-science', 'old-social-sc', 'old-english', 'old']

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function main() {
  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('✓ Connected.', LIVE ? '(LIVE)' : '(DRY)')
  try {
    // 1. Legacy subject 144 "Science (OLD)" — count + delete its class_level=6 chapters.
    const legacy = await client.query(
      `select ch.id from chapters ch join subjects s on s.id=ch.subject_id
       where ch.class_level=$1 and s.slug='science-old'`, [CLASS_LEVEL])
    console.log(`  subject 'science-old' class6 chapters: ${legacy.rows.length}`)
    if (LIVE && legacy.rows.length) {
      const r = await client.query(
        `delete from chapters where class_level=$1
         and subject_id in (select id from subjects where slug='science-old')`, [CLASS_LEVEL])
      console.log(`    → deleted ${r.rowCount} chapters (sections/questions/subtopics/mcq cascade)`)
    }

    // 2. Legacy ncert_solutions rows (Class 6, "(OLD)" subject names).
    const ns = await client.query(
      `select subject, count(*) n from ncert_solutions where "className"=$1 and subject = any($2) group by subject`,
      [CLASS_NAME, LEGACY_NCERT_SUBJECTS])
    ns.rows.forEach((r) => console.log(`  ncert_solutions legacy '${r.subject}': ${r.n} rows`))
    if (LIVE && ns.rows.length) {
      const r = await client.query(
        `delete from ncert_solutions where "className"=$1 and subject = any($2)`,
        [CLASS_NAME, LEGACY_NCERT_SUBJECTS])
      console.log(`    → deleted ${r.rowCount} ncert_solutions rows`)
    }

    // 3. Defensive: ot_tests / mock_tests at class 6 for the old slugs.
    const ot = await client.query(`select count(*) n from ot_tests where class_level=$1 and subject_slug = any($2)`, [CLASS_LEVEL, OLD_SLUGS])
    console.log(`  ot_tests class6 old: ${ot.rows[0].n} rows`)
    if (LIVE && Number(ot.rows[0].n)) {
      const r = await client.query(`delete from ot_tests where class_level=$1 and subject_slug = any($2)`, [CLASS_LEVEL, OLD_SLUGS])
      console.log(`    → deleted ${r.rowCount} ot_tests`)
    }

    if (!LIVE) console.log('\n[DRY] add --live to delete.')
    else console.log('\n✓ Cleanup complete.')
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
