'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Fetch "Important Questions" for a Class 7 subject and seed into ncert_solutions
// as part=5. Rendered by Ncert2Screen (ncert2 WebView) via an "Important Questions"
// tile — MCQ cards grouped into sections by weightage (VSA / SA / LA / …).
//
//   GET /v1/content/category/:resourceId/type/0/content_name/flash-card/  -> chapters {id,name}
//   GET /v1/question/important-questions/:chapterId/                        -> paginated MCQs
//        { data:{ results:[{ question, option:[{option,is_correct,explanation}], weightage_name }] } }
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/importantQuestionsClass7.js          # DRY
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/importantQuestionsClass7.js --live    # seed
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const B = 'https://web.examin8.com/v1'
const DELAY = 150
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f']

// Subject to build (override via env). resourceId = the flash-card category id.
const SUBJECT = process.env.SUBJECT || 'Science (Curiosity)'
const CLASS_NAME = process.env.CLASS_NAME || 'Class 7'
const RESOURCE_ID = process.env.RESOURCE_ID || '24658'
const PART = 5

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const normApos = (s) => trim(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
const slug = (s) => normApos(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function api(url) {
  const r = await fetch(url, { headers: { accept: 'application/json', 'x-csrftoken': CSRF, referer: 'https://web.examin8.com/', cookie: COOKIE } })
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url)
  return r.json()
}

// One MCQ as an html card (correct option highlighted; explanation as the answer).
function card(q, i) {
  const qh = trim(q.question)
  const opts = Array.isArray(q.option) ? q.option : []
  let optsHtml = ''
  if (opts.length) {
    optsHtml = '<div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">' +
      opts.map((o, k) => {
        const correct = !!o.is_correct
        const bd = correct ? '#2f9e44' : '#e3e3e6', bg = correct ? '#eef7ee' : '#fff'
        const badge = correct ? '✓' : LETTERS[k], bBg = correct ? '#2f9e44' : '#ededf0', bC = correct ? '#fff' : '#555'
        return `<div style="border:1px solid ${bd};background:${bg};border-radius:10px;padding:8px 10px;display:flex;gap:10px;align-items:flex-start">` +
          `<span style="flex:0 0 auto;width:22px;height:22px;border-radius:11px;background:${bBg};color:${bC};font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center">${badge}</span>` +
          `<span style="flex:1">${trim(o.option)}</span></div>`
      }).join('') + '</div>'
  }
  const co = opts.find((o) => o.is_correct)
  const ansBody = co ? (trim(co.explanation) || `<p>Correct answer: (${LETTERS[opts.indexOf(co)]}) ${trim(co.option)}</p>`) : ''
  const ans = ansBody ? `<div class="answer-section"><div class="solution-block"><div class="label">Answer</div><div>${ansBody}</div></div></div>` : ''
  return `<div class="question-card"><div class="question-header"><span class="q-number">Q ${i + 1}</span></div><div class="question-body"><div class="question-text">${qh}</div></div>${optsHtml}${ans}</div>`
}

async function fetchChapterIQ(chapterId) {
  const byW = new Map() // weightage -> [questions]
  let url = `${B}/question/important-questions/${chapterId}/`
  while (url) {
    let j
    try { j = await api(url) } catch (e) { break }
    for (const q of ((j.data && j.data.results) || [])) {
      const w = trim(q.weightage_name) || 'Important Questions'
      if (!byW.has(w)) byW.set(w, [])
      byW.get(w).push(q)
    }
    url = (j.data && j.data.next) || null
    if (url) await sleep(DELAY)
  }
  return [...byW.entries()].map(([label, qs]) => ({ label, html: qs.map((q, i) => card(q, i)).join('\n'), count: qs.length }))
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function main() {
  if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
  const list = await api(`${B}/content/category/${RESOURCE_ID}/type/0/content_name/flash-card/`)
  const chapters = list.children || []
  console.log(`${SUBJECT} (${CLASS_NAME}) — ${chapters.length} chapters`)

  const rows = []
  let ci = 0
  for (const ch of chapters) {
    const sections = await fetchChapterIQ(ch.id)
    const total = sections.reduce((n, s) => n + s.count, 0)
    if (!total) { console.log(`  ${normApos(ch.name)}: 0 (skip)`); await sleep(DELAY); continue }
    console.log(`  ${normApos(ch.name).padEnd(40)} ${sections.map((s) => s.label + ':' + s.count).join(', ')}`)
    sections.forEach((s, si) => rows.push({ part: PART, subject: SUBJECT, className: CLASS_NAME, chapter: normApos(ch.name), sectionKey: slug(s.label) + '-' + si, sectionLabel: s.label, html: s.html, chapterPos: ci, position: si }))
    ci++
    await sleep(DELAY)
  }
  console.log(`\nTOTAL rows: ${rows.length}`)
  if (!LIVE) { console.log('[DRY] add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('✓ Connected.')
  try {
    await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [PART, SUBJECT, CLASS_NAME])
    for (const r of rows) {
      await client.query(
        `insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [r.part, r.subject, r.className, r.chapter, r.sectionKey, r.sectionLabel, r.html, r.chapterPos, r.position])
    }
    console.log(`✓ Seeded ${rows.length} important-question rows (part=5) for ${SUBJECT} / ${CLASS_NAME}.`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
