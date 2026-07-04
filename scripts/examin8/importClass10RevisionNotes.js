'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Phase 2A — import Examin8 Revision Notes into the EXISTING schema (no new tables).
//
// Maps each chapter's flash-card topics to the app's Revision Notes model, which
// is what getNotesByPath() reads (type_key='revision_notes' → { intro, blocks }):
//   chapter → sections(type_key='revision_notes') → notes.blocks:[{ title, html }]
//   one block per topic; block.html = the topic's cards concatenated verbatim.
//
// Math/HTML preserved EXACTLY: {tex}…{/tex} and <span class="math-tex"> are stored
// unchanged (the client converts {tex}→$ at render time, not us).
//
// Pure UPSERT — sections unique (chapter_id, type_key); notes unique (section_id).
// Reuses subjects/chapters from importClass10Metadata.js (upserts defensively).
//
//   node scripts/examin8/importClass10RevisionNotes.js            # DRY RUN
//   node scripts/examin8/importClass10RevisionNotes.js --live     # apply + verify
//   node scripts/examin8/importClass10RevisionNotes.js --verify   # verify only (no writes)
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const LIVE = process.argv.includes('--live')
const VERIFY_ONLY = process.argv.includes('--verify')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const NORM = path.join(ROOT, 'data', 'examin8', CLASS_DIR, 'normalized')
const TYPE_KEY = 'revision_notes'
const SECTION_POSITION = 3 // section_types 'revision_notes' ordering
const CLASS_LEVEL_DEFAULT = 10

// Chapters to spot-check after import (subject slug → chapter slug).
const VERIFY_TARGETS = [
  { subject: 'mathematics', chapter: 'real-numbers' },
  { subject: 'science', chapter: null },        // null → first chapter that has notes
  { subject: 'social-science', chapter: null },
]

const trim = (s) => (s == null ? '' : String(s)).trim()

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

// One topic → one notes block. block.html = each card's text (verbatim HTML/math),
// with any non-empty answer shown beneath it. card.text already contains block-level
// HTML (<p>, <span class="math-tex">…), so wrap in <div> (nesting in <p> is invalid).
function cardHtml(c) {
  const text = trim(c.text)
  const ans = trim(c.answer)
  return (text ? `<div class="fc-card">${text}</div>` : '') +
         (ans ? `<div class="fc-answer"><b>Answer:</b> ${ans}</div>` : '')
}
const topicToBlock = (t) => ({ title: trim(t.topic_name) || 'Revision', html: (t.cards || []).map(cardHtml).join('\n') })

// Mirror of resources.service.getNotesByPath — confirms a chapter's notes resolve.
async function verifyChapter(client, subjectSlug, chapterSlug, classLevel) {
  const q = await client.query(
    `select n.id, n.blocks
       from sections se
       join chapters ch on ch.id = se.chapter_id
       join subjects su on su.id = ch.subject_id
       left join notes n on n.section_id = se.id
      where se.type_key = $1 and su.slug = $2 and ch.slug = $3 and ch.class_level = $4
      limit 1`,
    [TYPE_KEY, subjectSlug, chapterSlug, classLevel])
  if (!q.rows.length) return { ok: false, reason: 'no revision_notes section' }
  const row = q.rows[0]
  if (!row.id) return { ok: false, reason: 'section exists but no notes row' }
  const blocks = Array.isArray(row.blocks) ? row.blocks : []
  return { ok: blocks.length > 0, blocks: blocks.length, reason: blocks.length ? '' : 'notes row empty' }
}

async function pickChapterWithNotes(client, subjectSlug, classLevel) {
  const q = await client.query(
    `select ch.slug from sections se
       join chapters ch on ch.id = se.chapter_id
       join subjects su on su.id = ch.subject_id
       join notes n on n.section_id = se.id
      where se.type_key = $1 and su.slug = $2 and ch.class_level = $3
        and jsonb_array_length(coalesce(n.blocks,'[]'::jsonb)) > 0
      order by ch.position limit 1`,
    [TYPE_KEY, subjectSlug, classLevel])
  return q.rows.length ? q.rows[0].slug : null
}

async function runVerify(client, classLevel) {
  console.log('\n── VERIFY ─────────────────────────────')
  for (const t of VERIFY_TARGETS) {
    let chapter = t.chapter || await pickChapterWithNotes(client, t.subject, classLevel)
    if (!chapter) { console.log(`  ✗ ${t.subject}: no chapter with revision_notes`); continue }
    const r = await verifyChapter(client, t.subject, chapter, classLevel)
    console.log(`  ${r.ok ? '✓' : '✗'} ${t.subject} → ${chapter} → Revision Notes: ${r.ok ? `${r.blocks} blocks` : r.reason}`)
  }
}

async function main() {
  const data = readJson('revision-notes.json')
  const subjects = readJson('subjects.json') || []
  if (!data && !VERIFY_ONLY) {
    console.error(`No revision-notes.json in data/examin8/${CLASS_DIR}. Run fetchClass10RevisionNotes.js first.`)
    process.exit(1)
  }
  const classBySlug = Object.fromEntries(subjects.map((s) => [s.slug, Number(s.class_level)]))

  if (VERIFY_ONLY) {
    const { Client } = require('pg')
    const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
    await client.connect()
    try { await runVerify(client, CLASS_LEVEL_DEFAULT) } finally { await client.end() }
    return
  }

  let totCh = 0, totTopics = 0, totCards = 0
  for (const s of data) for (const ch of s.chapters) { totCh++; totTopics += ch.topics.length; totCards += ch.card_count }
  console.log(`\nImport Revision Notes → sections('${TYPE_KEY}') + notes — ${CLASS_DIR}`)
  console.log(`  subjects=${data.length}  chapters=${totCh}  topics=${totTopics}  cards=${totCards}`)
  if (!data.length) console.log('  (revision-notes.json is empty — fetch with EXAMIN8_COOKIE/CSRF first.)')
  if (!LIVE) { console.log('\n[DRY] add --live to write to the DB.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')

  const stat = { chaptersScanned: 0, notesInserted: 0, notesUpdated: 0, topics: 0, cards: 0, skippedEmpty: 0, errors: [] }
  try {
    await client.query(
      `insert into section_types (key, label, position) values ($1,'Revision Notes',$2) on conflict (key) do nothing`,
      [TYPE_KEY, SECTION_POSITION])

    for (const s of data) {
      const classLevel = classBySlug[s.subject_slug] || CLASS_LEVEL_DEFAULT
      const sub = await client.query(
        `insert into subjects (name, slug) values ($1,$2)
         on conflict (slug) do update set name = excluded.name returning id`,
        [s.subject, s.subject_slug])
      const subjectId = sub.rows[0].id

      for (const ch of s.chapters) {
        stat.chaptersScanned++
        try {
          const blocks = (ch.topics || []).map(topicToBlock).filter((b) => b.html)
          if (!blocks.length) { stat.skippedEmpty++; continue }

          const chp = await client.query(
            `insert into chapters (subject_id, name, slug, class_level, position)
             values ($1,$2,$3,$4,$5)
             on conflict (subject_id, class_level, slug) do update set name = excluded.name returning id`,
            [subjectId, ch.chapter, ch.chapter_slug, classLevel, ch.position || 0])
          const chapterId = chp.rows[0].id

          const sec = await client.query(
            `insert into sections (chapter_id, type_key, position) values ($1,$2,$3)
             on conflict (chapter_id, type_key) do update set position = excluded.position returning id`,
            [chapterId, TYPE_KEY, SECTION_POSITION])
          const sectionId = sec.rows[0].id

          const note = await client.query(
            `insert into notes (section_id, intro, blocks) values ($1,$2,$3::jsonb)
             on conflict (section_id) do update set intro = excluded.intro, blocks = excluded.blocks
             returning (xmax = 0) as inserted`,
            [sectionId, null, JSON.stringify(blocks)])
          note.rows[0].inserted ? stat.notesInserted++ : stat.notesUpdated++
          stat.topics += blocks.length
          stat.cards += ch.card_count
        } catch (e) {
          stat.errors.push(`${s.subject} / ${ch.chapter}: ${e.message}`)
        }
      }
      console.log(`  ✓ ${s.subject}: ${s.chapters.length} chapters`)
    }

    console.log('\n── LOG ────────────────────────────────')
    console.log(`  Chapters scanned  : ${stat.chaptersScanned}`)
    console.log(`  Topics found      : ${stat.topics}`)
    console.log(`  Cards imported    : ${stat.cards}`)
    console.log(`  Notes             : ${stat.notesInserted} new, ${stat.notesUpdated} updated`)
    console.log(`  Skipped (empty)   : ${stat.skippedEmpty}`)
    console.log(`  Errors            : ${stat.errors.length}`)
    stat.errors.slice(0, 20).forEach((e) => console.log(`     ! ${e}`))

    await runVerify(client, CLASS_LEVEL_DEFAULT)
  } finally { await client.end() }

  console.log(`\n✓ Revision Notes imported as '${TYPE_KEY}'.`)
  console.log('  NOTE: to DISPLAY them for Class 10, add Class 10 to the isDbNotes gate')
  console.log('  in src/screens/ResourcesScreen.js (~line 1018) — a data-only frontend line.')
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
