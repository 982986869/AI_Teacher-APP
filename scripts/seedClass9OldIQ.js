'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Fetch "Important Questions" for Class 9 OLD subjects and seed into
// ncert_solutions as part=5 (className='Class 9'), grouped into sections by
// weightage (VSA / SA / LA / …). Rendered by Ncert2Screen via an "Important
// Questions" ncert2 tile.
//
// Chapters are enumerated via content_name/important-questions/ (NOT flash-card),
// because English/Hindi Old subjects have IQ but no flash cards.
//   GET /v1/content/category/:res/type/0/content_name/important-questions/  -> chapters
//   GET /v1/question/important-questions/:chapterId/                        -> paginated MCQs
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass9OldIQ.js          # DRY
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass9OldIQ.js --live    # seed
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
const CLASS_NAME = 'Class 9'
const PART = 5

// Explicit `slug` for filenames — 'Old - हिंदी ए/ब' both slugify to "old" (collision).
const SUBJECTS = [
  { name: 'Old - Science',   res: '1218', slug: 'old-science' },
  { name: 'Old - Social Sc', res: '1895', slug: 'old-social-sc' },
  { name: 'Old - Eng Lang',  res: '1902', slug: 'old-eng-lang' },
  { name: 'Old - हिंदी ए',    res: '1904', slug: 'old-hindi-a' },
  { name: 'Old - हिंदी ब',    res: '1906', slug: 'old-hindi-b' },
  { name: 'Old - Eng Comm',  res: '1900', slug: 'old-eng-comm' },
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
  const ansBody = co ? (trim(co.explanation) || `<p>Correct answer: (${LETTERS[opts.indexOf(co)]}) ${trim(co.option)}</p>`) : (trim(q.solution && q.solution[0] && q.solution[0].solution) || '')
  const ans = ansBody ? `<div class="answer-section"><div class="solution-block"><div class="label">Answer</div><div>${ansBody}</div></div></div>` : ''
  return `<div class="question-card"><div class="question-header"><span class="q-number">Q ${i + 1}</span></div><div class="question-body"><div class="question-text">${qh}</div></div>${optsHtml}${ans}</div>`
}

async function fetchChapterIQ(chapterId) {
  const byW = new Map()
  let url = `${B}/question/important-questions/${chapterId}/`
  while (url) {
    let j
    try { j = await api(url) } catch (e) { if (e.fatal) throw e; break }
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

async function fetchSubjectRows(subj) {
  const list = await api(`${B}/content/category/${subj.res}/type/0/content_name/important-questions/`)
  const chapters = list.children || []
  console.log(`\n=== ${subj.name} (${CLASS_NAME}) IQ — ${chapters.length} chapters ===`)
  const rows = []
  let ci = 0
  for (const ch of chapters) {
    const sections = await fetchChapterIQ(ch.id)
    const total = sections.reduce((n, s) => n + s.count, 0)
    if (!total) { await sleep(DELAY); continue }
    console.log(`  ${normApos(ch.name).padEnd(40)} ${sections.map((s) => s.label + ':' + s.count).join(', ')}`)
    sections.forEach((s, si) => rows.push({ part: PART, subject: subj.name, className: CLASS_NAME, chapter: normApos(ch.name), sectionKey: slug(s.label) + '-' + si, sectionLabel: s.label, html: s.html, chapterPos: ci, position: si }))
    ci++
    await sleep(DELAY)
  }
  console.log(`  → ${rows.length} sections across ${ci} chapters`)
  return rows
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function main() {
  if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
  const outDir = path.join(ROOT, 'src', 'data', 'class9OldIQ')
  fs.mkdirSync(outDir, { recursive: true })
  const ONLY = (process.env.ONLY || '').trim()
  const targets = ONLY ? SUBJECTS.filter((s) => s.slug === ONLY || s.name.includes(ONLY)) : SUBJECTS
  const bySubject = []
  for (const subj of targets) {
    let rows = []
    try { rows = await fetchSubjectRows(subj) } catch (e) { console.error(`  FAILED ${subj.name}: ${e.message}`); if (e.fatal) process.exit(1) }
    fs.writeFileSync(path.join(outDir, (subj.slug || slug(subj.name)) + '.json'), JSON.stringify(rows))
    bySubject.push({ subj, rows })
  }
  const total = bySubject.reduce((n, x) => n + x.rows.length, 0)
  console.log(`\nTOTAL: ${total} IQ sections (part=${PART}) across ${SUBJECTS.length} subjects`)
  if (!LIVE) { console.log('[DRY] add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('✓ Connected.')
  try {
    for (const { subj, rows } of bySubject) {
      if (!rows.length) { console.log(`  ~ ${subj.name}: 0 rows (skip — not overwriting existing)`); continue }
      await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [PART, subj.name, CLASS_NAME])
      for (const r of rows) {
        await client.query(
          `insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [r.part, r.subject, r.className, r.chapter, r.sectionKey, r.sectionLabel, r.html, r.chapterPos, r.position])
      }
      console.log(`  ✓ ${subj.name}: ${rows.length} IQ sections (part=${PART})`)
    }
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
