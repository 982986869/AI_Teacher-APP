'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import CLASS 12 MATHEMATICS revision notes into Supabase, mapped into the
// structured schema (supabase/schema.sql) — the SAME shape the Class 12 Physics
// & Chemistry importers use, so the generic /notes API serves them unchanged:
//
//   subject(Mathematics) -> chapter(class_level=12) -> section(revision_notes) -> notes
//
//   • revision_notes (notes) ← src/notes/maths12/*.json   (6 chapters, 118 cards)
//
// The source is clean per-chapter flashcard JSON (same format as the Physics /
// Chemistry sets): each card has { chapter, topic, text, text_html }. We group
// cards by topic into note "blocks" and map DIRECTLY. Math stays as {tex}…{/tex};
// images keep their remote src. Files are numbered in NCERT chapter order, which
// becomes each chapter's `position`.
//
// Usage:
//   node scripts/importMaths12.js          # DRY RUN (parse + report, no writes)
//   node scripts/importMaths12.js --live    # actually insert into Supabase
//
// DB connection is read from server/.env (DATABASE_URL). Re-runnable: each
// section's notes row is cleared before re-insert.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const NOTES = path.join(ROOT, 'src', 'notes', 'maths12')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 12

// ── Helpers ──────────────────────────────────────────────────────────────────
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const trim = (s) => (s == null ? '' : String(s)).trim()
const firstNonEmpty = (...vals) => { for (const v of vals) if (trim(v)) return trim(v); return null }
const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

// List a directory's *.json files sorted by their leading "NN " number.
function jsonFiles(dir) {
  return fs.readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => path.join(dir, f))
}

// ── Flashcards → note (intro + blocks grouped by topic) ──────────────────────
function cardsToNote(cards) {
  const order = []
  const byTopic = {}
  cards.forEach((card) => {
    const topic = trim(card.topic) || 'Notes'
    if (!byTopic[topic]) { byTopic[topic] = []; order.push(topic) }
    byTopic[topic].push(card)
  })
  const blocks = order.map((topic) => ({
    title: topic,
    html: byTopic[topic]
      .map((c) => `<div class="card">${firstNonEmpty(c.text_html, c.text) || ''}</div>`)
      .join(''),
  }))
  return { intro: 'Revision Notes — Flashcards', blocks }
}

// ── Collect notes, keyed by chapter name, in file (NCERT) order ──────────────
function collect() {
  const order = []
  const byChapter = {}
  for (const file of jsonFiles(NOTES)) {
    const arr = loadJson(file)
    if (!Array.isArray(arr) || !arr.length || !arr[0].chapter) continue
    const chapter = trim(arr[0].chapter)
    if (!byChapter[chapter]) order.push(chapter)
    byChapter[chapter] = cardsToNote(arr)
  }
  return { canonicalOrder: order, byChapter }
}

// ── DATABASE_URL from server/.env (no secret printed) ────────────────────────
function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

async function insertNote(client, sectionId, note) {
  if (!note) return
  await client.query(
    `insert into notes (section_id, intro, blocks) values ($1,$2,$3)`,
    [sectionId, note.intro || null, note.blocks ? JSON.stringify(note.blocks) : null]
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { canonicalOrder, byChapter } = collect()

  console.log('\n=== CLASS 12 MATHEMATICS — PARSE REPORT ===')
  console.log(`Chapters with notes: ${canonicalOrder.length}`)
  let grandBlocks = 0
  for (const ch of canonicalOrder) {
    const n = byChapter[ch].blocks.length
    grandBlocks += n
    console.log(`   ${ch.padEnd(40)} ${String(n).padStart(3)} blocks`)
  }
  console.log(`\nGRAND TOTAL: ${canonicalOrder.length} note-chapters, ${grandBlocks} blocks (Class 12 Mathematics)`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Nothing inserted. Live: node scripts/importMaths12.js --live\n')
    return
  }

  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected to Supabase.')
  try {
    await client.query(fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8'))
    console.log('✓ Schema ensured.')

    const subjectId = (await client.query(
      `insert into subjects (name, slug) values ('Mathematics','mathematics')
       on conflict (slug) do update set name = excluded.name returning id`
    )).rows[0].id

    let chapters = 0, blocks = 0
    for (let i = 0; i < canonicalOrder.length; i++) {
      const name = canonicalOrder[i]
      const note = byChapter[name]
      const chapterId = (await client.query(
        `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
         on conflict (subject_id, class_level, slug) do update set name = excluded.name, position = excluded.position
         returning id`,
        [subjectId, name, slugify(name), CLASS_LEVEL, i + 1]
      )).rows[0].id

      const sectionId = (await client.query(
        `insert into sections (chapter_id, type_key, position) values ($1,$2,$3)
         on conflict (chapter_id, type_key) do update set position = excluded.position
         returning id`,
        [chapterId, 'revision_notes', 3]
      )).rows[0].id

      await client.query('delete from notes where section_id = $1', [sectionId])
      await insertNote(client, sectionId, note)
      chapters++
      blocks += note.blocks.length
    }
    console.log(`   ✓ revision_notes      ${chapters} chapters, ${blocks} blocks (class_level=12)`)
    console.log('\n✓ Class 12 Mathematics revision-notes import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
