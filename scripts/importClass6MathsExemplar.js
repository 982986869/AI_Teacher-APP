'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import Class 6 — Maths (OLD) NCERT EXEMPLAR into ncert_solutions as part=3
// (part 2 = the textbook solutions). Rendered by Ncert2Screen's MathJax WebView
// via the Class 6 "Exemplar" tile — so HTML + {tex} math + MCQ options display
// correctly (the plain-text ChapterEndScreen cannot show these).
//
// Source: src/data/class6MathsExemplar/chapters/chNN.json  (fetchClass6MathsOld.js
//   with CH_CONFIG=class6MathsExemplar.chapters.json OUT_SUBDIR=class6MathsExemplar).
//   Exemplar questions are MCQs: options = [{ option(html), explanation(html), is_correct }].
//
//   node scripts/importClass6MathsExemplar.js          # DRY RUN
//   node scripts/importClass6MathsExemplar.js --live    # insert
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DIR = path.join(ROOT, 'src', 'data', 'class6MathsExemplar', 'chapters')
const CHAPTERS_CONFIG = path.join(__dirname, 'class6MathsExemplar.chapters.json')
const LIVE = process.argv.includes('--live')
const SUBJECT = 'Maths (OLD)'
const CLASS_NAME = 'Class 6'
const PART = 3
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f']

const trim = (s) => (s == null ? '' : String(s)).trim()
const num = (f) => { const m = String(f).match(/(\d+)/); return m ? parseInt(m[1], 10) : 999 }
const slug = (s) => trim(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// One MCQ (or plain) question as an html card. Correct option highlighted; the
// answer block uses the correct option's explanation (or the plain solution).
function questionCard(q, i) {
  const qh = trim(q.question_html)
  const opts = Array.isArray(q.options) ? q.options : []
  let optsHtml = ''
  if (opts.length) {
    optsHtml = '<div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">' +
      opts.map((o, k) => {
        const correct = !!o.is_correct
        const bg = correct ? '#eef7ee' : '#fff'
        const bd = correct ? '#2f9e44' : '#e3e3e6'
        const badge = correct ? '✓' : LETTERS[k]
        const badgeBg = correct ? '#2f9e44' : '#ededf0'
        const badgeColor = correct ? '#fff' : '#555'
        return `<div style="border:1px solid ${bd};background:${bg};border-radius:10px;padding:8px 10px;display:flex;gap:10px;align-items:flex-start">` +
          `<span style="flex:0 0 auto;width:22px;height:22px;border-radius:11px;background:${badgeBg};color:${badgeColor};font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center">${badge}</span>` +
          `<span style="flex:1">${trim(o.option)}</span></div>`
      }).join('') + '</div>'
  }
  const correctOpt = opts.find((o) => o.is_correct)
  const answerBody = trim(q.solution_html) ||
    (correctOpt ? (trim(correctOpt.explanation) ||
      `<p>Correct answer: (${LETTERS[opts.indexOf(correctOpt)]}) ${trim(correctOpt.option)}</p>`) : '')
  const solBlock = answerBody
    ? `<div class="answer-section"><div class="solution-block"><div class="label">Answer</div><div>${answerBody}</div></div></div>`
    : ''
  return `<div class="question-card"><div class="question-header"><span class="q-number">Q ${i + 1}</span></div>` +
    `<div class="question-body"><div class="question-text">${qh}</div></div>${optsHtml}${solBlock}</div>`
}

function sectionHtml(questions) {
  return questions.map((q, i) => questionCard(q, i)).join('\n')
}

function canonicalNames() {
  const out = {}
  try { JSON.parse(fs.readFileSync(CHAPTERS_CONFIG, 'utf8')).forEach((c) => { out[c.n] = trim(c.name) }) } catch (_) {}
  return out
}

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
      return { key: f.replace('.json', ''), chapter: canon[num(f)] || trim(j.chapter), sections }
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
  const rows = []
  chapters.forEach((c, ci) => {
    c.sections.forEach((s, si) => {
      rows.push({
        part: PART, subject: SUBJECT, className: CLASS_NAME, chapter: c.chapter,
        sectionKey: slug(s.label), sectionLabel: s.label, html: s.html, chapterPos: ci, position: si,
      })
    })
  })

  console.log('\n=== CLASS 6 — MATHS (OLD) EXEMPLAR PARSE REPORT (part=3) ===')
  chapters.forEach((c) => {
    const total = c.sections.reduce((n, s) => n + s.count, 0)
    console.log(`   ${c.key}  ${c.chapter.padEnd(28)} ${c.sections.length} sections, ${total} q`)
    c.sections.forEach((s) => console.log(`         - ${s.label.padEnd(16)} ${s.count}`))
  })
  console.log(`\nTOTAL: ${chapters.length} chapters, ${rows.length} section rows`)

  if (!LIVE) { console.log('\n[DRY RUN] node scripts/importClass6MathsExemplar.js --live to insert.\n'); return }

  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected.')
  try {
    await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [PART, SUBJECT, CLASS_NAME])
    for (const r of rows) {
      await client.query(
        `insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [r.part, r.subject, r.className, r.chapter, r.sectionKey, r.sectionLabel, r.html, r.chapterPos, r.position])
    }
    console.log(`✓ Seeded ${rows.length} exemplar rows for ${SUBJECT} / ${CLASS_NAME} (part=3).`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
