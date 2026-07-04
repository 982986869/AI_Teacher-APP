'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Build Class 9 NEW-syllabus content. For each subject, fetch from examin8 and
// seed into ncert_solutions with className='Class 9':
//   • Revision Notes (flash cards)     -> part=4  (sections = topics)
//   • NCERT Solutions (textbook)       -> part=2  (sections = exercise nodes)
//
// Only NEW subjects are fetched (per product decision — old-syllabus data is not
// pulled for Class 9). Social Science (Understanding Society) has no textbook/flash
// on examin8 (Important Questions only), so it's not here — it surfaces via Practice.
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/buildClass9.js          # DRY
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/buildClass9.js --live    # + seed
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const B = 'https://web.examin8.com/v1'
const CLASS_NAME = 'Class 9'
const DELAY = 150

const SUBJECTS = [
  { name: 'Science (Exploration)',   flash: '28744', book: '734df3e9-bc97-4d6b-8eae-c2254587114a' },
  { name: 'हिंदी (गंगा)',            flash: '29068', book: 'f948f22e-33f3-4529-aa7e-8afcae7fb05d' },
  { name: 'English (Kaveri)',        flash: '28696', book: '8b22b2e2-ba24-4046-802c-de9da0f68914' },
  { name: 'Maths (Ganita Manjari)',  flash: '28726', book: '61cba3a7-bf70-448f-a714-8dc73ad95ece' },
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
function noteCard(c) {
  const body = trim(c.text)
  const ans = trim(c.answer)
  const ab = ans ? `<div class="answer-section"><div class="solution-block"><div class="label">Answer</div><div>${ans}</div></div></div>` : ''
  return `<div class="question-card"><div class="question-body"><div class="question-text">${body}</div></div>${ab}</div>`
}
const cards2html = (cards) => cards.map(noteCard).join('\n')
const qs2html = (qs) => qs.map((q, i) => ncertCard(q, i)).join('\n')

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
  const outDir = path.join(ROOT, 'src', 'data', 'class9')
  fs.mkdirSync(outDir, { recursive: true })

  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  const subjects = ONLY.length ? SUBJECTS.filter((s) => ONLY.some((t) => s.name.toLowerCase().includes(t))) : SUBJECTS

  const rows = []
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
    console.log(`✓ Seeded ${rows.length} rows for Class 9.`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
