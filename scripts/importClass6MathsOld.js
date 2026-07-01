'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import Class 6 — Maths (OLD) NCERT solutions into the ncert_solutions table so
// they render under the "Class 06 - Mathematics - Revised" tile via Ncert2Screen.
//
// Source: src/data/class6MathsOld/chapters/chNN.json  (produced by
//   scripts/fetchClass6MathsOld.js) — { chapter, sections: [{ label, questions }] }.
//
// One ncert_solutions row per (chapter, section). Sections keep their real names
// from examin8 — "Examples", "Exercise n.1", "Exercise n.2", … — so each chapter
// shows its Examples and Exercises exactly like the source book:
//   part=2, subject="Maths (OLD)", className="Class 6", chapter=<name>,
//   sectionLabel = <Examples | Exercise n.1 | …>, position = section order
//
//   node scripts/importClass6MathsOld.js          # DRY RUN (report)
//   node scripts/importClass6MathsOld.js --live    # insert into Supabase
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DIR = path.join(ROOT, 'src', 'data', 'class6MathsOld', 'chapters')
const CHAPTERS_CONFIG = path.join(__dirname, 'class6MathsOld.chapters.json')
const LIVE = process.argv.includes('--live')
const SUBJECT = 'Maths (OLD)'
const CLASS_NAME = 'Class 6'
const PART = 2

const trim = (s) => (s == null ? '' : String(s)).trim()
const num = (f) => { const m = String(f).match(/(\d+)/); return m ? parseInt(m[1], 10) : 999 }
const slug = (s) => trim(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Build a question-card html blob for a section from its question array.
function sectionHtml(questions) {
  return questions.map((q, i) => {
    const qh = trim(q.question_html) || trim(q.question_text) || ''
    const sh = trim(q.solution_html) || trim(q.solution) || ''
    const solBlock = sh
      ? `<div class="answer-section"><div class="solution-block"><div class="label">Solution</div><div>${sh}</div></div></div>`
      : ''
    return `<div class="question-card"><div class="question-header"><span class="q-number">Q ${i + 1}</span></div>` +
      `<div class="question-body"><div class="question-text">${qh}</div></div>${solBlock}</div>`
  }).join('\n')
}

// Canonical chapter names (must match the UI's CLASS6_MATHS_CHAPTERS exactly, since
// the app filters + queries by exact name). Keyed by chapter number, e.g. 9 -> "Data
// Handling" — overrides examin8's inconsistent casing ("Data handling").
function canonicalNames() {
  const out = {}
  try {
    JSON.parse(fs.readFileSync(CHAPTERS_CONFIG, 'utf8')).forEach((c) => { out[c.n] = trim(c.name) })
  } catch (_) {}
  return out
}

// Read chapters/chNN.json → [{ key, chapter, sections:[{label, count, html}] }].
function readChapters() {
  if (!fs.existsSync(DIR)) return []
  const canon = canonicalNames()
  return fs.readdirSync(DIR)
    .filter((f) => /^ch\d+\.json$/.test(f))
    .sort((a, b) => num(a) - num(b))
    .map((f) => {
      const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))
      const sections = (j.sections || [])
        .filter((s) => Array.isArray(s.questions) && s.questions.length)
        .map((s) => ({ label: trim(s.label), count: s.questions.length, html: sectionHtml(s.questions) }))
      if (!sections.length) return null
      const chapter = canon[num(f)] || trim(j.chapter)
      return { key: f.replace('.json', ''), chapter, sections }
    })
    .filter(Boolean)
}

function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

async function main() {
  const chapters = readChapters()

  // rows: one section row per (chapter, section)
  const rows = []
  chapters.forEach((c, ci) => {
    c.sections.forEach((s, si) => {
      rows.push({
        part: PART, subject: SUBJECT, className: CLASS_NAME, chapter: c.chapter,
        sectionKey: slug(s.label), sectionLabel: s.label, html: s.html, chapterPos: ci, position: si,
      })
    })
  })

  console.log('\n=== CLASS 6 — MATHS (OLD) NCERT PARSE REPORT ===')
  chapters.forEach((c) => {
    const total = c.sections.reduce((n, s) => n + s.count, 0)
    console.log(`   ${c.key}  ${c.chapter.padEnd(28)} ${c.sections.length} sections, ${total} q`)
    c.sections.forEach((s) => console.log(`         - ${s.label.padEnd(16)} ${s.count}`))
  })
  console.log(`\nTOTAL: ${chapters.length} chapters, ${rows.length} section rows`)

  if (!LIVE) { console.log('\n[DRY RUN] node scripts/importClass6MathsOld.js --live to insert.\n'); return }

  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected.')
  try {
    // Re-runnable: clear this subject/class/part first.
    await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [PART, SUBJECT, CLASS_NAME])
    for (const r of rows) {
      await client.query(
        `insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [r.part, r.subject, r.className, r.chapter, r.sectionKey, r.sectionLabel, r.html, r.chapterPos, r.position])
    }
    console.log(`✓ Seeded ${rows.length} rows for ${SUBJECT} / ${CLASS_NAME}.`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
