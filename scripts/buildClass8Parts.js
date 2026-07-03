'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Class 8 subjects with MULTIPLE NCERT books — seed each book at its own `part`
// in ncert_solutions (className='Class 8'), so each gets its own tile:
//   Old - Science:   NCERT (part 2) + Exemplar (part 3)
//   Old - Maths:     NCERT (part 2) + Exemplar (part 3)
//   Old - Social Sc: History (part 2) + Pol Sc (part 6) + Geography (part 7)
//   Old - English:   Honeydew (part 2) + It So Happened (part 6)
//
// (buildClass8.js seeded only the first textbook_data entry per subject — for
// Old-Science/Old-Maths that was the Exemplar, mislabeled as part 2; this corrects
// it and adds the missing books.)
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/buildClass8Parts.js          # DRY
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/buildClass8Parts.js --live    # + seed
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

// subject -> [{ part, book }]. All parts here are re-seeded (delete then insert).
const JOBS = [
  { name: 'Old - Science', books: [
    { part: 2, book: 'e80dc0a8-bc3c-46ca-843f-4359b81b0c82' }, // NCERT Solutions - Science
    { part: 3, book: 'cae5d797-cb9e-42b6-9ca0-0e1733071452' }, // Exemplar Solutions
  ] },
  { name: 'Old - Maths', books: [
    { part: 2, book: '53d710de-1214-4a11-9cca-1b35c8641406' }, // NCERT Solutions - Maths
    { part: 3, book: 'be9fa37c-058f-443d-ba11-7d5574a3baa9' }, // Exemplar Solutions
  ] },
  { name: 'Old - Social Sc', books: [
    { part: 2, book: '65b3d37c-6631-4a0c-8bca-0b05876fe23f' }, // History
    { part: 6, book: '94cb8508-4c76-43b9-8ec1-13bb8e1ab2fc' }, // Pol Sc
    { part: 7, book: '255be885-842a-4df2-bfd4-619bd58eece3' }, // Geography
  ] },
  { name: 'Old - English', books: [
    { part: 2, book: '1d86c7d3-20a6-4667-b920-debfff3a909d' }, // Honeydew
    { part: 6, book: 'b4bdd227-d7e1-4b21-b25f-2a22769786a9' }, // It So Happened
  ] },
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

function ncertCard(q, i) {
  const qh = trim(q.question_html)
  const sh = trim(q.solution_html)
  const sol = sh ? `<div class="answer-section"><div class="solution-block"><div class="label">Solution</div><div>${sh}</div></div></div>` : ''
  return `<div class="question-card"><div class="question-header"><span class="q-number">Q ${i + 1}</span></div><div class="question-body"><div class="question-text">${qh}</div></div>${sol}</div>`
}
const qs2html = (qs) => qs.map((q, i) => ncertCard(q, i)).join('\n')

async function fetchNode(nodeUuid) {
  const seen = new Set(); const out = []
  let url = `${B}/textbook/chapter/${nodeUuid}/questions/?p=1`
  while (url) {
    let j
    try { j = await api(url) } catch (e) { break }
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
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function main() {
  if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  const jobs = ONLY.length ? JOBS.filter((j) => ONLY.some((t) => j.name.toLowerCase().includes(t))) : JOBS

  const rows = [] // { part, subject, className, chapter, sectionKey, sectionLabel, html, chapterPos, position }
  for (const j of jobs) {
    console.log(`\n=== ${j.name} ===`)
    for (const { part, book } of j.books) {
      const ncert = await fetchNcert(book)
      console.log(`   part ${part}: ${ncert.length} chapters`)
      ncert.forEach((c, ci) => c.sections.forEach((sec, si) => rows.push({
        part, subject: j.name, className: CLASS_NAME, chapter: c.chapter,
        sectionKey: slug(sec.label) + '-' + si, sectionLabel: sec.label, html: sec.html, chapterPos: ci, position: si,
      })))
    }
  }
  console.log(`\nTOTAL rows to seed: ${rows.length}`)
  if (!LIVE) { console.log('[DRY] add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('✓ Connected.')
  try {
    // Delete every (subject, part) we're about to write, so re-runs are clean.
    for (const j of jobs) for (const { part } of j.books) {
      await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [part, j.name, CLASS_NAME])
    }
    for (const r of rows) {
      await client.query(
        `insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [r.part, r.subject, r.className, r.chapter, r.sectionKey, r.sectionLabel, r.html, r.chapterPos, r.position])
    }
    console.log(`✓ Seeded ${rows.length} part-wise rows for Class 8.`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
