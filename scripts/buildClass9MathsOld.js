'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Build Class 9 "Old - Maths" content into ncert_solutions (className='Class 9').
// One pass fetches from examin8 and seeds three parts:
//   • Revision Notes (flash cards)   -> part=4  (sections = topics)
//   • NCERT Solutions (textbook)     -> part=2  (sections = exercise nodes)
//   • Exemplar (textbook)            -> part=3  (sections = exercise nodes)
//
// examin8 resource: /i/376735/ailernova/batch/21886/resources/1234  ("Old - Maths")
//   flash chapters : GET /v1/content/category/1234/type/0/content_name/flash-card/
//   flash cards    : GET /v1/flash_card/flash_cards/:chapterId/
//   ncert chapters : GET /v1/textbook/:bookUuid/dashboard/chapters/
//   ncert nodes    : GET /v1/textbook/chapter/:chUuid/exercises/
//   ncert questions: GET /v1/textbook/chapter/:nodeUuid/questions/   (node uuid as chapter)
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/buildClass9MathsOld.js          # DRY (fetch+report)
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/buildClass9MathsOld.js --live    # + seed DB
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const B = 'https://web.examin8.com/v1'
const CLASS_NAME = 'Class 9'
const SUBJECT = 'Old - Maths'
const FLASH_RES = '1234'
const DELAY = 150

// Two textbooks live under resource 1234. Each maps to a distinct ncert_solutions part.
//   part 2 = NCERT Solutions, part 3 = Exemplar (matches Class 6/8 convention).
const BOOKS = [
  { part: 2, label: 'NCERT Solutions', uuid: 'b56b2ec8-da60-4233-ad83-d0115e5bc9ac' }, // "Mathematics - Revised"
  { part: 3, label: 'Exemplar',        uuid: '08c33cb4-2aaf-4cd5-bfc5-bbf7ccafff9f' }, // "Exemplar Book by NCERT"
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const normApos = (s) => trim(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
const slug = (s) => normApos(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function api(url) {
  const r = await fetch(url, { headers: { accept: 'application/json', 'x-csrftoken': CSRF, referer: 'https://web.examin8.com/', cookie: COOKIE } })
  if (r.status === 401 || r.status === 403) throw Object.assign(new Error('AUTH ' + r.status), { fatal: true })
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
  try { list = await api(`${B}/content/category/${resourceId}/type/0/content_name/flash-card/`) } catch (e) { if (e.fatal) throw e; return [] }
  const out = []
  for (const ch of (list.children || [])) {
    let fc
    try { fc = await api(`${B}/flash_card/flash_cards/${ch.id}/`) } catch (e) { if (e.fatal) throw e; await sleep(DELAY); continue }
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
    try { j = await api(url) } catch (e) { if (e.fatal) throw e; break }
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
async function fetchBook(bookUuid) {
  let meta
  try { meta = await api(`${B}/textbook/${bookUuid}/dashboard/chapters/`) } catch (e) { if (e.fatal) throw e; return [] }
  const chapters = Array.isArray(meta) ? meta : (meta.chapters || meta.results || [])
  const out = []
  for (const ch of chapters) {
    const chUuid = ch.uuid || ch.id
    let ex
    try { ex = await api(`${B}/textbook/chapter/${chUuid}/exercises/`) } catch (e) { if (e.fatal) throw e; await sleep(DELAY); continue }
    const sections = []
    for (const node of (ex.exercise_nodes || [])) {
      let qs = []
      try { qs = await fetchNode(node.uuid) } catch (e) { if (e.fatal) throw e; qs = [] }
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
  const outDir = path.join(ROOT, 'src', 'data', 'class9MathsOld')
  fs.mkdirSync(outDir, { recursive: true })

  console.log(`\n=== ${SUBJECT} (${CLASS_NAME}) ===`)
  const rev = await fetchRevision(FLASH_RES)
  console.log(`   Revision Notes: ${rev.length} chapters`)
  const books = []
  for (const bk of BOOKS) {
    const chs = await fetchBook(bk.uuid)
    console.log(`   ${bk.label} (part ${bk.part}): ${chs.length} chapters`)
    books.push({ ...bk, chapters: chs })
  }
  fs.writeFileSync(path.join(outDir, 'old-maths.json'), JSON.stringify({ subject: SUBJECT, revision: rev, books }))

  const rows = [] // { part, subject, className, chapter, sectionKey, sectionLabel, html, chapterPos, position }
  rev.forEach((c, ci) => c.sections.forEach((sec, si) => rows.push({ part: 4, subject: SUBJECT, className: CLASS_NAME, chapter: c.chapter, sectionKey: slug(sec.label) + '-' + si, sectionLabel: sec.label, html: sec.html, chapterPos: ci, position: si })))
  for (const bk of books) {
    bk.chapters.forEach((c, ci) => c.sections.forEach((sec, si) => rows.push({ part: bk.part, subject: SUBJECT, className: CLASS_NAME, chapter: c.chapter, sectionKey: slug(sec.label) + '-' + si, sectionLabel: sec.label, html: sec.html, chapterPos: ci, position: si })))
  }
  const byPart = rows.reduce((m, r) => { (m[r.part] = m[r.part] || 0, m[r.part]++); return m }, {})
  console.log(`\nTOTAL rows to seed: ${rows.length}  (${Object.entries(byPart).map(([p, n]) => `part${p}:${n}`).join(', ')})`)
  if (!LIVE) { console.log('[DRY] add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('✓ Connected.')
  try {
    for (const part of [2, 3, 4]) {
      await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [part, SUBJECT, CLASS_NAME])
    }
    for (const r of rows) {
      await client.query(
        `insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [r.part, r.subject, r.className, r.chapter, r.sectionKey, r.sectionLabel, r.html, r.chapterPos, r.position])
    }
    console.log(`✓ Seeded ${rows.length} rows for ${SUBJECT} / ${CLASS_NAME}.`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); if (e.fatal) console.error('(auth — refresh session/cookie)'); process.exit(1) })
