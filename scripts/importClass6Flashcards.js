'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import Class 6 "Revision Notes" (examin8 flash cards) into ncert_solutions as
// part=4 (2=textbook, 3=exemplar). Rendered by Ncert2Screen's WebView via the
// Class 6 "Revision Notes" tile — HTML note cards, grouped by topic.
//
// Source: src/data/class6Flashcards/<slug>/chNN.json  (fetchClass6Flashcards.js)
//   { chapter, chapterId, isFree, topics:[{ topic, cards:[{ type, text, answer }] }] }
//
// Sections: one per topic (label = topic name); single-topic chapters use the
// label "Revision Notes".
//
//   node scripts/importClass6Flashcards.js          # DRY RUN
//   node scripts/importClass6Flashcards.js --live    # insert
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DIR = path.join(ROOT, 'src', 'data', 'class6Flashcards')
const LIVE = process.argv.includes('--live')
const CLASS_NAME = 'Class 6'
const PART = 4

// slug -> exact subject name in SUBJECTS_CLASS6 (must match for the API query).
const SUBJECTS = {
  'science-curiosity': 'Science (Curiosity)',
  'english-poorvi': 'English (Poorvi)',
  'science-old': 'Science (OLD)',
}

const trim = (s) => (s == null ? '' : String(s)).trim()
const num = (f) => { const m = String(f).match(/(\d+)/); return m ? parseInt(m[1], 10) : 999 }
const slugify = (s) => trim(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
// Normalize curly quotes → straight so DB chapter names match the UI list exactly.
const normApos = (s) => trim(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')

// One flash card as an html note block.
function cardHtml(c, i) {
  const body = trim(c.text) || ''
  const ans = trim(c.answer)
  const ansBlock = ans
    ? `<div class="answer-section"><div class="solution-block"><div class="label">Answer</div><div>${ans}</div></div></div>`
    : ''
  return `<div class="question-card"><div class="question-body"><div class="question-text">${body}</div></div>${ansBlock}</div>`
}

function sectionHtml(cards) {
  return cards.map((c, i) => cardHtml(c, i)).join('\n')
}

function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

// Read one subject dir → [{ key, chapter, sections:[{label, count, html}] }].
function readSubject(slug) {
  const d = path.join(DIR, slug)
  if (!fs.existsSync(d)) return []
  return fs.readdirSync(d)
    .filter((f) => /^ch\d+\.json$/.test(f))
    .sort((a, b) => num(a) - num(b))
    .map((f) => {
      const j = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'))
      const topics = (j.topics || []).filter((t) => Array.isArray(t.cards) && t.cards.length)
      if (!topics.length) return null
      const single = topics.length === 1
      const sections = topics.map((t) => ({
        label: single ? 'Revision Notes' : trim(t.topic),
        count: t.cards.length,
        html: sectionHtml(t.cards),
      }))
      return { key: f.replace('.json', ''), chapter: normApos(j.chapter), sections }
    })
    .filter(Boolean)
}

async function main() {
  const bySubject = Object.entries(SUBJECTS).map(([slug, subject]) => ({ slug, subject, chapters: readSubject(slug) }))

  const rows = []
  bySubject.forEach(({ subject, chapters }) => {
    chapters.forEach((c, ci) => {
      c.sections.forEach((s, si) => {
        rows.push({
          part: PART, subject, className: CLASS_NAME, chapter: c.chapter,
          sectionKey: slugify(s.label) + '-' + si, sectionLabel: s.label, html: s.html, chapterPos: ci, position: si,
        })
      })
    })
  })

  console.log('\n=== CLASS 6 — REVISION NOTES PARSE REPORT (part=4) ===')
  bySubject.forEach(({ subject, chapters }) => {
    const cards = chapters.reduce((n, c) => n + c.sections.reduce((a, s) => a + s.count, 0), 0)
    console.log(`  ${subject}: ${chapters.length} chapters, ${cards} cards`)
  })
  console.log(`\nTOTAL: ${rows.length} section rows`)

  if (!LIVE) { console.log('\n[DRY RUN] node scripts/importClass6Flashcards.js --live to insert.\n'); return }

  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected.')
  try {
    for (const { subject } of bySubject) {
      await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [PART, subject, CLASS_NAME])
    }
    for (const r of rows) {
      await client.query(
        `insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [r.part, r.subject, r.className, r.chapter, r.sectionKey, r.sectionLabel, r.html, r.chapterPos, r.position])
    }
    console.log(`✓ Seeded ${rows.length} revision-note rows (part=4).`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
