'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Remove ALL existing Class 6 content from the DB so it can be rebuilt fresh.
// Class 6 lives under TWO models:
//   • ncert_solutions  (keyed by "className" = 'Class 6')  — Textbook/Revision/Exemplar
//   • structured schema (keyed by chapters.class_level = 6) — IQ / MCQ / notes
//   • ot_tests         (class_level = 6)                    — Online Tests
// The `subjects` rows are SHARED with Class 7/8/9 (same slug, different class_level),
// so we do NOT delete subjects — only the class_level=6 chapters (which cascade to
// sections→questions/notes and subtopics→mcq_questions).
//
//   node scripts/wipeClass6.js          # DRY — just count what would be deleted
//   node scripts/wipeClass6.js --live    # actually delete
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function count(client, sql, params) {
  try { return (await client.query(sql, params)).rows[0].n } catch (e) { return `n/a (${e.message})` }
}

async function main() {
  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('✓ Connected.', LIVE ? '(LIVE)' : '(DRY)')
  try {
    const ns = await count(client, `select count(*)::int n from ncert_solutions where "className" = 'Class 6'`)
    const chap = await count(client, `select count(*)::int n from chapters where class_level = 6`)
    const secs = await count(client, `select count(*)::int n from sections where chapter_id in (select id from chapters where class_level = 6)`)
    const subs = await count(client, `select count(*)::int n from subtopics where chapter_id in (select id from chapters where class_level = 6)`)
    const ot = await count(client, `select count(*)::int n from ot_tests where class_level = 6`)
    let exemplar = 0
    try { exemplar = (await client.query(`select count(*)::int n from exemplar_solutions where "className" = 'Class 6'`)).rows[0].n } catch (_) { exemplar = 'n/a' }
    console.log('\nCurrent Class 6 footprint:')
    console.log(`  ncert_solutions (className='Class 6') : ${ns}`)
    console.log(`  chapters (class_level=6)              : ${chap}   (→ ${secs} sections, ${subs} subtopics cascade)`)
    console.log(`  ot_tests (class_level=6)              : ${ot}`)
    console.log(`  exemplar_solutions (className='Class 6'): ${exemplar}`)

    if (!LIVE) { console.log('\n[DRY] add --live to delete the above.'); return }

    await client.query('begin')
    const d1 = await client.query(`delete from ncert_solutions where "className" = 'Class 6'`)
    const d2 = await client.query(`delete from chapters where class_level = 6`) // cascades sections/subtopics/questions/notes/mcq_questions
    let d3 = { rowCount: 0 }
    try { d3 = await client.query(`delete from ot_tests where class_level = 6`) } catch (_) {}
    try { await client.query(`delete from exemplar_solutions where "className" = 'Class 6'`) } catch (_) {}
    await client.query('commit')
    console.log(`\n✓ Deleted: ${d1.rowCount} ncert_solutions rows, ${d2.rowCount} chapters (+cascade), ${d3.rowCount} ot_tests.`)
    console.log('  (subjects rows preserved — shared with Class 7/8/9.)')
  } catch (e) {
    try { await client.query('rollback') } catch (_) {}
    throw e
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
