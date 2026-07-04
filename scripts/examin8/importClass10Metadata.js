'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import Examin8 class metadata (subjects + chapters) into the EXISTING schema.
// Phase 1 only: no resources/questions yet. Pure UPSERT — safe to re-run.
//
// Reads the normalized JSON produced by fetchClass10Metadata.js:
//   data/examin8/class{N}/normalized/{subjects,chapters}.json
//
// Writes to existing tables only (NO new tables):
//   subjects  — upsert by slug (shared across classes)
//   chapters  — upsert by (subject_id, class_level, slug); class_level from the
//               subject's parsed class number. Inserting chapters here flips the
//               class from "coming soon" to live (resources.service scans
//               chapters.class_level) — no server/frontend change needed.
//
// Resume / skip: idempotent. RETURNING (xmax = 0) tells us insert vs. update, so
// re-runs report already-imported rows as "skipped" instead of re-inserting.
//
//   node scripts/examin8/importClass10Metadata.js            # DRY RUN (no writes)
//   node scripts/examin8/importClass10Metadata.js --live     # apply
//   CLASS_DIR=class10 node scripts/examin8/importClass10Metadata.js --live
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const LIVE = process.argv.includes('--live')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const NORM = path.join(ROOT, 'data', 'examin8', CLASS_DIR, 'normalized')

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

async function main() {
  const subjects = readJson('subjects.json')
  const chaptersBySubject = readJson('chapters.json')
  if (!subjects || !subjects.length) {
    console.error(`No normalized/subjects.json in data/examin8/${CLASS_DIR}. Run fetchClass10Metadata.js first.`)
    process.exit(1)
  }
  const chBySlug = Object.fromEntries((chaptersBySubject || []).map((c) => [c.slug, c.chapters || []]))

  console.log(`\nImport Class metadata — ${CLASS_DIR} — ${subjects.length} subjects`)
  for (const s of subjects) {
    const ch = chBySlug[s.slug] || []
    console.log(`  ${String(s.name).padEnd(34)} slug=${String(s.slug).padEnd(30)} class_level=${s.class_level}  ${ch.length} chapters`)
  }
  if (!LIVE) { console.log('\n[DRY] add --live to write to the DB.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')

  const stat = { subjectsInserted: 0, subjectsSkipped: 0, chaptersInserted: 0, chaptersSkipped: 0, noChapters: 0, errors: [] }
  try {
    for (const s of subjects) {
      const classLevel = Number(s.class_level)
      if (!classLevel) { stat.errors.push(`${s.name}: no class_level`); continue }
      // A subject with no chapters can't be browsed and wouldn't flip the class
      // live — keep it in the JSON, but don't add a bare row to the shared table.
      if (!(chBySlug[s.slug] || []).length) { stat.noChapters++; console.log(`  – ${s.name}: 0 chapters, skipped`); continue }
      try {
        // subject — upsert by slug
        const sub = await client.query(
          `insert into subjects (name, slug) values ($1,$2)
           on conflict (slug) do update set name = excluded.name
           returning id, (xmax = 0) as inserted`,
          [s.name, s.slug])
        const subjectId = sub.rows[0].id
        sub.rows[0].inserted ? stat.subjectsInserted++ : stat.subjectsSkipped++

        // chapters — upsert by (subject_id, class_level, slug)
        const chapters = chBySlug[s.slug] || []
        for (const c of chapters) {
          const r = await client.query(
            `insert into chapters (subject_id, name, slug, class_level, position)
             values ($1,$2,$3,$4,$5)
             on conflict (subject_id, class_level, slug)
             do update set name = excluded.name, position = excluded.position
             returning (xmax = 0) as inserted`,
            [subjectId, c.name, c.slug, classLevel, c.position || 0])
          r.rows[0].inserted ? stat.chaptersInserted++ : stat.chaptersSkipped++
        }
        console.log(`  ✓ ${s.name}: subject#${subjectId}, ${chapters.length} chapters (class_level=${classLevel})`)
      } catch (e) {
        stat.errors.push(`${s.name}: ${e.message}`)
        console.log(`  ! ${s.name}: ${e.message}`)
      }
    }
  } finally { await client.end() }

  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Subjects imported : ${stat.subjectsInserted} new, ${stat.subjectsSkipped} already present, ${stat.noChapters} skipped (0 chapters)`)
  console.log(`  Chapters imported : ${stat.chaptersInserted} new, ${stat.chaptersSkipped} already present`)
  console.log(`  Resources         : 0 (Phase 2)`)
  console.log(`  Questions         : 0 (Phase 2)`)
  console.log(`  Errors            : ${stat.errors.length}`)
  stat.errors.forEach((e) => console.log(`     ! ${e}`))
  console.log('\n✓ Class metadata imported. It shows live via the existing screens (no UI change).')
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
