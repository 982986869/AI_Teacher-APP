'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Build ALL Class 8 content in one pass. For each subject, fetch from examin8 and
// seed into ncert_solutions with className='Class 8':
//   • Revision Notes (flash cards)     -> part=4  (sections = topics)
//   • NCERT Solutions (textbook)       -> part=2  (sections = exercise nodes)
//
// Endpoints (verified):
//   flash chapters : GET /v1/content/category/:resourceId/type/0/content_name/flash-card/
//   flash cards    : GET /v1/flash_card/flash_cards/:chapterId/
//   ncert chapters : GET /v1/textbook/:bookUuid/dashboard/chapters/
//   ncert nodes    : GET /v1/textbook/chapter/:chUuid/exercises/
//   ncert questions: GET /v1/textbook/chapter/:nodeUuid/questions/   (node uuid as chapter)
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/buildClass8.js          # DRY (fetch+report)
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/buildClass8.js --live    # + seed DB
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const B = 'https://web.examin8.com/v1'
const CLASS_NAME = 'Class 8'
const DELAY = 150

const SUBJECTS = [
  { name: 'Science (Curiosity)',                flash: '26867', book: '05088360-e5dc-4c52-913d-26a7b01ca905' },
  { name: 'Social Science (Exploring Society)', flash: '27030', book: '22c01a05-e085-42e1-987b-fb99ac72961f' },
  { name: 'हिंदी (मल्हार)',                      flash: '26769', book: 'c6152584-6acc-4c32-a1d1-4467d7bd8c5e' },
  { name: 'English (Poorvi)',                   flash: '26892', book: '124ec982-ee61-44f8-8608-da5a4798919a' },
  { name: 'Maths (Ganita Prakash)',             flash: '26761', book: 'dc135f92-03b1-42be-8133-5589296242b7' },
  { name: 'Old - Science',                      flash: '1466',  book: 'cae5d797-cb9e-42b6-9ca0-0e1733071452' },
  { name: 'Old - Maths',                        flash: '1449',  book: 'be9fa37c-058f-443d-ba11-7d5574a3baa9' },
  { name: 'Old - Social Sc',                    flash: '1485',  book: '65b3d37c-6631-4a0c-8bca-0b05876fe23f' },
  { name: 'Old - English',                      flash: '1918',  book: '1d86c7d3-20a6-4667-b920-debfff3a909d' },
  { name: 'Old - हिंदी',                         flash: '1921',  book: 'c3566ab6-15af-4c37-b020-d819088ec101' },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const normApos = (s) => trim(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
const slug = (s) => normApos(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function api(url) {
  const r = await fetch(url, { headers: { accept: 'application/json', 'x-csrftoken': CSRF, referer: 'https://web.examin8.com/', cookie: COOKIE } })
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url)
  return r.json()
}

// ── HTML builders (match Ncert2Screen WebView CSS) ──────────────────────────
function ncertCard(q, i) {
  const qh = trim(q.question_html)
  const sh = trim(q.solution_html)
  const sol = sh ? `<div class="answer-section"><div class="solution-block"><div class="label">Solution</div><div>${sh}</div></div></div>` : ''
  return `<div class="question-card"><div class="question-header"><span class="q-number">Q ${i + 1}</span></div><div class="question-body"><div class="question-text">${qh}</div></div>${sol}</div>`
}
function noteCard(c) {
  const body = trim(c.text)
  const ans = trim(c.answer)
  const ab = ans ? `<div class="answer-section"><div class="solution-block"><div class="label">Answer</div><div>${ans}</div></div></div>` : ''
  return `<div class="question-card"><div class="question-body"><div class="question-text">${body}</div></div>${ab}</div>`
}
const cards2html = (cards) => cards.map(noteCard).join('\n')
const qs2html = (qs) => qs.map((q, i) => ncertCard(q, i)).join('\n')

// ── Fetchers ────────────────────────────────────────────────────────────────
async function fetchRevision(resourceId) {
  let list
  try { list = await api(`${B}/content/category/${resourceId}/type/0/content_name/flash-card/`) } catch (e) { return [] }
  const out = []
  for (const ch of (list.children || [])) {
    let fc
    try { fc = await api(`${B}/flash_card/flash_cards/${ch.id}/`) } catch (e) { await sleep(DELAY); continue }
    const topics = (fc.flash_cards || []).filter((t) => (t.cards || []).length)
    if (!topics.length) { await sleep(DELAY); continue }
    const single = topics.length === 1
    const sections = topics.map((t) => ({
      label: single ? 'Revision Notes' : normApos(t.topic_name),
      html: cards2html((t.cards || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map((c) => ({ type: c.flashcard_type, text: c.text, answer: c.answer }))),
      count: (t.cards || []).length,
    }))
    out.push({ chapter: normApos(ch.name), sections })
    await sleep(DELAY)
  }
  return out
}

async function fetchNode(nodeUuid) {
  const seen = new Set(); const out = []
  let url = `${B}/textbook/chapter/${nodeUuid}/questions/?p=1`
  while (url) {
    let j
    try { j = await api(url) } catch (e) { break }   // skip bad/empty node, keep what we have
    for (const q of (j.results || [])) {
      if (seen.has(q.id)) continue; seen.add(q.id)
      const sol = Array.isArray(q.solution_data) && q.solution_data[0] ? q.solution_data[0].solution : (q.solution_html || q.solution || '')
      out.push({ order: q.order != null ? q.order : out.length + 1, question_html: q.question || '', solution_html: sol || '' })
    }
    url = j.next || null
    if (url) await sleep(DELAY)
  }
  out.sort((a, b) => a.order - b.order)
  return out
}
async function fetchNcert(bookUuid) {
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
      if (qs.length) sections.push({ label: normApos(node.name), html: qs2html(qs), count: qs.length })
      await sleep(DELAY)
    }
    if (sections.length) out.push({ chapter: normApos(ch.chapter_name || ch.name), sections })
    await sleep(DELAY)
  }
  return out
}

function getDbUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  let u = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function main() {
  if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
  const outDir = path.join(ROOT, 'src', 'data', 'class8')
  fs.mkdirSync(outDir, { recursive: true })

  // ONLY="old - maths,old - social" re-seeds just the matching subject(s).
  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  const subjects = ONLY.length ? SUBJECTS.filter((s) => ONLY.some((t) => s.name.toLowerCase().includes(t))) : SUBJECTS

  const rows = [] // { part, subject, className, chapter, sectionKey, sectionLabel, html, chapterPos, position }
  for (const s of subjects) {
    console.log(`\n=== ${s.name} ===`)
    const rev = await fetchRevision(s.flash)
    const ncert = await fetchNcert(s.book)
    console.log(`   Revision Notes: ${rev.length} chapters | NCERT: ${ncert.length} chapters`)
    fs.writeFileSync(path.join(outDir, slug(s.name) + '.json'), JSON.stringify({ subject: s.name, revision: rev, ncert }))
    rev.forEach((c, ci) => c.sections.forEach((sec, si) => rows.push({ part: 4, subject: s.name, className: CLASS_NAME, chapter: c.chapter, sectionKey: slug(sec.label) + '-' + si, sectionLabel: sec.label, html: sec.html, chapterPos: ci, position: si })))
    ncert.forEach((c, ci) => c.sections.forEach((sec, si) => rows.push({ part: 2, subject: s.name, className: CLASS_NAME, chapter: c.chapter, sectionKey: slug(sec.label) + '-' + si, sectionLabel: sec.label, html: sec.html, chapterPos: ci, position: si })))
  }
  console.log(`\nTOTAL rows to seed: ${rows.length}`)
  if (!LIVE) { console.log('[DRY] add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('✓ Connected.')
  try {
    for (const s of subjects) for (const part of [2, 4]) {
      await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [part, s.name, CLASS_NAME])
    }
    for (const r of rows) {
      await client.query(
        `insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [r.part, r.subject, r.className, r.chapter, r.sectionKey, r.sectionLabel, r.html, r.chapterPos, r.position])
    }
    console.log(`✓ Seeded ${rows.length} rows for Class 8.`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
