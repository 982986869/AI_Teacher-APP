'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Consolidate every Class 8 Hindi subject row into the one the app can reach.
//
// WHY
//   Class 8 Hindi is spread across FOUR subject rows, because two different
//   slugify implementations ran over the same Devanagari names:
//
//     156  uidbx0g       हिंदी (मल्हार)   1,423 important
//     493  hindi-malhar  हिंदी (मल्हार)   2,751 practice
//     177  old           Old - हिंदी      1,682 important
//     496  old-hindi     Old - हिंदी      2,464 practice
//
//   The client slugifies a name with no ASCII characters to a stable hash, so it
//   asks the API for "uidbx0g" — and only row 156 answers. The other 6,897
//   questions are stored under slugs nothing ever requests: present in the
//   database, invisible in the app, and impossible to spot from a row count.
//
//   examin8 lists one Hindi subject for Class 8, हिंदी (मल्हार), so that is what
//   the app now shows and what everything is merged into.
//
// HOW
//   A chapter that already exists in the target by slug is merged rather than
//   duplicated: its sections move across, and where the target already has a
//   section of that type the questions move into it, so a chapter never ends up
//   with two "practice" sections. The emptied chapter is then removed.
//   A chapter with no counterpart simply changes subject.
//
//   Nothing is deleted except chapters and sections left empty by the move:
//   question rows are only ever re-pointed, and the run asserts the total is
//   unchanged before it commits.
//
//   node server/scripts/mergeClass8Hindi.js          # dry-run (default)
//   node server/scripts/mergeClass8Hindi.js --live   # apply
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')

const TARGET = 156          // uidbx0g — the slug the client computes
const SOURCES = [493, 177, 496]
const CLASS_LEVEL = 8

function getDbUrl() {
  let u = (process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '')
  if (!u) {
    const envPath = path.join(ROOT, '.env')
    const m = fs.readFileSync(envPath, 'utf8').match(/^DATABASE_URL=(.*)$/m)
    if (!m) throw new Error('No DATABASE_URL')
    u = m[1].trim().replace(/^["']|["']$/g, '')
  }
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}
function dbSsl() {
  try {
    const h = new URL(getDbUrl()).hostname
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return false
  } catch (_) {}
  return { rejectUnauthorized: false }
}
const dbLabel = () => {
  try { const x = new URL(getDbUrl()); return x.hostname + (x.port ? ':' + x.port : '') + x.pathname }
  catch (_) { return '(unparseable)' }
}

const countHindiQuestions = async (c) => Number((await c.query(
  `SELECT count(q.id) AS n FROM chapters ch
     JOIN sections s ON s.chapter_id = ch.id
     JOIN questions q ON q.section_id = s.id
    WHERE ch.class_level = $1 AND ch.subject_id = ANY($2::bigint[])`,
  [CLASS_LEVEL, [TARGET, ...SOURCES]])).rows[0].n)

async function main() {
  const { Client } = require('pg')
  const c = new Client({ connectionString: getDbUrl(), ssl: dbSsl() })
  await c.connect()

  console.log(`\nMerge Class ${CLASS_LEVEL} Hindi → subject ${TARGET}`)
  console.log(`  database : ${dbLabel()}`)
  console.log(`  mode     : ${LIVE ? 'LIVE' : 'DRY-RUN'}`)

  const before = await countHindiQuestions(c)
  console.log(`  questions across all four rows, before: ${before}\n`)

  const stat = { chaptersMoved: 0, chaptersMerged: 0, sectionsMoved: 0, sectionsMerged: 0, chaptersDropped: 0 }

  await c.query('BEGIN')
  try {
    for (const src of SOURCES) {
      const { rows: chapters } = await c.query(
        `SELECT id, slug, name FROM chapters WHERE subject_id = $1 AND class_level = $2 ORDER BY id`,
        [src, CLASS_LEVEL])
      const { rows: srcRow } = await c.query('SELECT slug FROM subjects WHERE id = $1', [src])
      console.log(`  source ${src} (${srcRow[0] ? srcRow[0].slug : '?'}): ${chapters.length} chapters`)

      for (const ch of chapters) {
        const { rows: hit } = await c.query(
          `SELECT id FROM chapters WHERE subject_id = $1 AND class_level = $2 AND slug = $3 LIMIT 1`,
          [TARGET, CLASS_LEVEL, ch.slug])

        if (!hit.length) {
          // No counterpart — the chapter itself changes subject.
          await c.query('UPDATE chapters SET subject_id = $1 WHERE id = $2', [TARGET, ch.id])
          stat.chaptersMoved += 1
          continue
        }

        const tgtChapter = hit[0].id
        const { rows: sections } = await c.query(
          'SELECT id, type_key FROM sections WHERE chapter_id = $1', [ch.id])

        for (const s of sections) {
          const { rows: same } = await c.query(
            'SELECT id FROM sections WHERE chapter_id = $1 AND type_key = $2 LIMIT 1',
            [tgtChapter, s.type_key])
          if (same.length) {
            // Target already has this section type — move the questions into it so
            // the chapter never ends up with two sections of the same kind.
            await c.query('UPDATE questions SET section_id = $1 WHERE section_id = $2', [same[0].id, s.id])
            await c.query('UPDATE notes SET section_id = $1 WHERE section_id = $2', [same[0].id, s.id])
            await c.query('DELETE FROM sections WHERE id = $1', [s.id])
            stat.sectionsMerged += 1
          } else {
            await c.query('UPDATE sections SET chapter_id = $1 WHERE id = $2', [tgtChapter, s.id])
            stat.sectionsMoved += 1
          }
        }
        // The source chapter is now empty of sections; drop it.
        await c.query('DELETE FROM chapters WHERE id = $1', [ch.id])
        stat.chaptersMerged += 1
        stat.chaptersDropped += 1
      }
    }

    const after = await countHindiQuestions(c)
    console.log(`\n  questions after: ${after}`)
    if (after !== before) {
      throw new Error(`question count changed (${before} → ${after}) — rolling back`)
    }

    if (!LIVE) { await c.query('ROLLBACK'); console.log('\n[DRY] rolled back. Add --live to apply.') }
    else { await c.query('COMMIT'); console.log('\n✓ committed') }
  } catch (e) {
    await c.query('ROLLBACK')
    console.error('ROLLED BACK:', e.message)
    process.exitCode = 1
  }

  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Chapters re-pointed (no counterpart) : ${stat.chaptersMoved}`)
  console.log(`  Chapters merged into an existing one : ${stat.chaptersMerged}`)
  console.log(`  Sections moved                       : ${stat.sectionsMoved}`)
  console.log(`  Sections merged (same type both ends): ${stat.sectionsMerged}`)
  console.log(`  Empty source chapters removed        : ${stat.chaptersDropped}`)

  await c.end()
}

main().catch((e) => { console.error('FAILED:', e && e.message ? e.message : e); process.exit(1) })
