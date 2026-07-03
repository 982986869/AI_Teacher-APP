'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 7 "Old - English" NCERT (textbook) Solutions for the two old books
// into ncert_solutions (Model A, ncert2 WebView flow, className='Class 7'):
//   • Honeycomb      (17 chapters) -> part=2
//   • An Alien Hand  ( 7 chapters) -> part=6   (distinct part so it's a SEPARATE tile
//                                               under the same subject 'Old - English')
//
// Reads LOCAL exports:
//   old_english/honeycomb/{index.json, NN_<slug>.json}
//   old_english/an_alien_hand/{index.json, NN_<slug>.json}
//
//   node scripts/seedClass7OldEnglishBooks.js            # DRY  (build + report, no DB)
//   node scripts/seedClass7OldEnglishBooks.js --live     # seed DATABASE_URL (server/.env)
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
const SUBJECT = 'Old - English'
const CLASS_NAME = 'Class 7'

const BOOKS = [
  { dir: 'honeycomb',     part: 2, label: 'Honeycomb' },
  { dir: 'an_alien_hand', part: 6, label: 'An Alien Hand' },
]

const trim = (s) => (s == null ? '' : String(s)).trim()
const esc = (s) => trim(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const absUrl = (u, base) => { u = trim(u); if (!u) return ''; return /^https?:\/\//.test(u) ? u : (trim(base) + u) }
const imgs = (arr, base) => (Array.isArray(arr) ? arr : []).map((u) => `<img src="${absUrl(u, base)}" alt="" />`).join('')

// ── HTML builder (matches Ncert2Screen WebView CSS, same as buildClass7.js) ──
function ncertCard(qh, sh, i) {
  const sol = sh ? `<div class="answer-section"><div class="solution-block"><div class="label">Solution</div><div>${sh}</div></div></div>` : ''
  return `<div class="question-card"><div class="question-header"><span class="q-number">Q ${i + 1}</span></div><div class="question-body"><div class="question-text">${qh}</div></div>${sol}</div>`
}

// Map one local textbook question → { qh, sh }
function mapQ(q, base) {
  let qh = trim(q.question_html) || `<p>${esc(q.question_text)}</p>`
  qh += imgs(q.question_images, base)
  // MCQ options (rare for these books) → list them under the question
  const opts = Array.isArray(q.options) ? q.options : []
  if (opts.length) {
    qh += '<ol type="a">' + opts.map((o) => `<li>${esc(o.text || o.option || o)}</li>`).join('') + '</ol>'
  }
  // solution: prefer solutions[].text/html; fall back to correct_answer
  let sh = ''
  const sols = Array.isArray(q.solutions) ? q.solutions : []
  if (sols.length) sh = sols.map((s) => (trim(s.html) || `<p>${esc(s.text)}</p>`) + imgs(s.images || s.solution_images, base)).join('')
  else if (q.correct_answer != null && trim(q.correct_answer)) sh = `<p>${esc(q.correct_answer)}</p>`
  return { qh, sh }
}

function buildBook(book) {
  const dir = path.join(ROOT, 'old_english', book.dir)
  const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'))
  const base = index.media_base_url || ''
  const rows = []
  let withSol = 0, totalQ = 0
  const chapters = (index.chapters || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
  chapters.forEach((ch, ci) => {
    const cf = path.join(dir, ch.file)
    if (!fs.existsSync(cf)) { console.warn(`  ! missing chapter file: ${ch.file}`); return }
    const cd = JSON.parse(fs.readFileSync(cf, 'utf8'))
    const exercises = cd.exercises || []
    exercises.forEach((ex, si) => {
      const qs = ex.questions || []
      const cards = qs.map((q, i) => { const m = mapQ(q, base); if (m.sh) withSol++; totalQ++; return ncertCard(m.qh, m.sh, i) })
      if (!cards.length) return
      rows.push({
        part: book.part, subject: SUBJECT, className: CLASS_NAME,
        chapter: trim(ch.name),
        sectionKey: slug(ex.node_name || ex.name || 'section') + '-' + si,
        sectionLabel: trim(ex.node_name || ex.name || 'Questions'),
        html: cards.join('\n'), chapterPos: ci, position: si,
      })
    })
  })
  return { rows, chapters: chapters.length, totalQ, withSol }
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function main() {
  console.log(`\nClass 7 "Old - English" textbook solutions import (${LIVE ? 'LIVE' : 'DRY'})\n`)
  const all = []
  for (const book of BOOKS) {
    const b = buildBook(book)
    console.log(`  ${book.label.padEnd(16)} part=${book.part}  ${b.chapters} chapters · ${b.rows.length} sections · ${b.totalQ} questions · ${b.withSol} with solution`)
    all.push({ book, ...b })
  }
  const rows = all.flatMap((a) => a.rows)
  console.log(`\n  TOTAL rows: ${rows.length}`)
  if (!LIVE) { console.log('\n[DRY] No DB written. Add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected to DB.')
  try {
    for (const book of BOOKS) {
      await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [book.part, SUBJECT, CLASS_NAME])
    }
    for (const r of rows) {
      await client.query(
        `insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [r.part, r.subject, r.className, r.chapter, r.sectionKey, r.sectionLabel, r.html, r.chapterPos, r.position])
    }
    console.log(`✓ Seeded ${rows.length} ncert_solutions rows for '${SUBJECT}' (Class 7).`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
