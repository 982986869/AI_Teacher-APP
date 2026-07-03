'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 8 EXEMPLAR solutions into ncert_solutions as part=3, className='Class 8'
// (Exemplar Solutions tile → Ncert2Screen). Exemplar questions are MCQs: their
// options + correct answer live in examin8's `options_data` (NOT `question`), so we
// render the options and highlight the correct one — buildClass8's generic textbook
// fetch drops these, which is why options/answers were missing.
//
// Fill the exemplar book uuids in scripts/class8Exemplar.books.json first.
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass8Exemplar.js          # DRY
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass8Exemplar.js --live    # + seed DB
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const B = 'https://web.examin8.com/v1'
const CLASS_NAME = 'Class 8'
const PART = 3
const DELAY = 150
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const normApos = (s) => trim(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
const slug = (s) => normApos(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function api(url) {
  const r = await fetch(url, { headers: { accept: 'application/json', 'x-csrftoken': CSRF, referer: 'https://web.examin8.com/', cookie: COOKIE } })
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url)
  return r.json()
}

// One MCQ (or plain) exemplar question → html card. Options rendered with the
// correct one highlighted (✓); solution from solution_data or the correct option.
function questionCard(q, i) {
  const qh = trim(q.question_html)
  const opts = Array.isArray(q.options) ? q.options : []
  let optsHtml = ''
  if (opts.length) {
    optsHtml = '<div class="options" style="margin-top:8px;display:flex;flex-direction:column;gap:6px">' +
      opts.map((o, k) => {
        const correct = !!o.is_correct
        const bg = correct ? '#eef7ee' : '#ffffff'
        const bd = correct ? '#2f9e44' : '#e3e3e6'
        const badge = correct ? '✓' : (LETTERS[k] || String(k + 1))
        const bc = correct ? '#2f9e44' : '#8a8a8a'
        return `<div style="display:flex;gap:8px;align-items:flex-start;border:1px solid ${bd};background:${bg};border-radius:8px;padding:6px 10px">`
          + `<span style="font-weight:700;color:${bc};min-width:16px">${badge}</span><div>${trim(o.option)}</div></div>`
      }).join('') + '</div>'
  }
  const co = opts.find((o) => o.is_correct)
  const sh = trim(q.solution_html) || trim(co && co.explanation) || ''
  const sol = sh ? `<div class="answer-section"><div class="solution-block"><div class="label">Solution</div><div>${sh}</div></div></div>` : ''
  return `<div class="question-card"><div class="question-header"><span class="q-number">Q ${i + 1}</span></div><div class="question-body"><div class="question-text">${qh}</div>${optsHtml}</div>${sol}</div>`
}
const qs2html = (qs) => qs.map((q, i) => questionCard(q, i)).join('\n')

async function fetchNode(nodeUuid) {
  const seen = new Set(); const out = []
  let url = `${B}/textbook/chapter/${nodeUuid}/questions/?p=1`
  while (url) {
    let j
    try { j = await api(url) } catch (e) { break }
    for (const q of (j.results || [])) {
      if (seen.has(q.id)) continue; seen.add(q.id)
      const sol = Array.isArray(q.solution_data) && q.solution_data[0] ? q.solution_data[0].solution : (q.solution_html || q.solution || '')
      const options = (Array.isArray(q.options_data) ? q.options_data : []).map((o) => ({ option: o.option || '', explanation: o.explanation || '', is_correct: !!o.is_correct }))
      out.push({ order: q.order != null ? q.order : out.length + 1, question_html: q.question || '', solution_html: sol || '', options })
    }
    url = j.next || null
    if (url) await sleep(DELAY)
  }
  out.sort((a, b) => a.order - b.order)
  return out
}
async function fetchBook(bookUuid) {
  let meta
  try { meta = await api(`${B}/textbook/${bookUuid}/dashboard/chapters/`) } catch (e) { return [] }
  const chapters = Array.isArray(meta) ? meta : (meta.chapters || meta.results || [])
  const out = []
  for (const ch of chapters) {
    const chUuid = ch.uuid || ch.id
    let ex
    try { ex = await api(`${B}/textbook/chapter/${chUuid}/exercises/`) } catch (e) { await sleep(DELAY); continue }
    const sections = []
    for (const node of (ex.exercise_nodes || [])) {
      let qs = []
      try { qs = await fetchNode(node.uuid) } catch (e) { qs = [] }
      if (qs.length) sections.push({ label: normApos(node.name), html: qs2html(qs), count: qs.length, mcq: qs.filter((q) => q.options.length).length })
      await sleep(DELAY)
    }
    if (sections.length) out.push({ chapter: normApos(ch.chapter_name || ch.name), sections })
    await sleep(DELAY)
  }
  return out
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function main() {
  if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'class8Exemplar.books.json'), 'utf8'))
  const subjects = cfg.filter((s) => trim(s.book))
  if (!subjects.length) { console.error('Fill exemplar book uuids in scripts/class8Exemplar.books.json first.'); process.exit(1) }

  const rows = []
  for (const s of subjects) {
    console.log(`\n=== ${s.name} (exemplar book ${s.book}) ===`)
    const chapters = await fetchBook(s.book)
    const totQ = chapters.reduce((n, c) => n + c.sections.reduce((a, sec) => a + sec.count, 0), 0)
    const totMcq = chapters.reduce((n, c) => n + c.sections.reduce((a, sec) => a + sec.mcq, 0), 0)
    console.log(`   ${chapters.length} chapters · ${totQ} questions · ${totMcq} with options`)
    chapters.forEach((c, ci) => c.sections.forEach((sec, si) => rows.push({ part: PART, subject: s.name, className: CLASS_NAME, chapter: c.chapter, sectionKey: slug(sec.label) + '-' + si, sectionLabel: sec.label, html: sec.html, chapterPos: ci, position: si })))
  }
  console.log(`\nTOTAL exemplar rows: ${rows.length}`)
  if (!LIVE) { console.log('[DRY] add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('✓ Connected.')
  try {
    for (const s of subjects) {
      await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [PART, s.name, CLASS_NAME])
    }
    for (const r of rows) {
      await client.query(
        `insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [r.part, r.subject, r.className, r.chapter, r.sectionKey, r.sectionLabel, r.html, r.chapterPos, r.position])
    }
    console.log(`✓ Seeded ${rows.length} exemplar rows (part=3, with options) for Class 8.`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
