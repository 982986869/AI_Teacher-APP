'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Fetch "PYQ" (Previous Year Questions) for Class 9 "Old - Maths" and seed into
// ncert_solutions as part=8 (2=NCERT, 3=Exemplar, 4=Revision Notes, 5=Important
// Questions). Rendered by Ncert2Screen (ncert2 WebView) via a "PYQ" tile — cards
// grouped into one "Previous Year Questions" section per chapter.
//
// Requires a SUBSCRIBED examin8 session (PYQ is subscription-gated).
//   GET /v1/content/category/1234/type/0/content_name/flash-card/  -> chapters {id,name}
//   GET /v1/question/previous_year_questions/:chapterId/            -> paginated
//        { data:{ results:[{ id, question, years:[…], option:[{option,is_correct,explanation}],
//                            solution:[{solution}] }], next } }
//   NOTE: PYQ is a mix of subjective (option:[] + solution) and MCQ (option filled).
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass9MathsOldPyq.js          # DRY
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass9MathsOldPyq.js --live    # seed
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

const SUBJECT = 'Old - Maths'
const CLASS_NAME = 'Class 9'
const RESOURCE_ID = '1234'
const PART = 8

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const normApos = (s) => trim(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
const slug = (s) => normApos(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function api(url) {
  const r = await fetch(url, { headers: { accept: 'application/json', 'x-csrftoken': CSRF, referer: 'https://web.examin8.com/', cookie: COOKIE } })
  if (r.status === 401 || r.status === 403) throw Object.assign(new Error('AUTH ' + r.status + ' (subscription?)'), { fatal: true })
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url)
  return r.json()
}

// One PYQ as an html card: question + year tag, options (MCQ; correct highlighted),
// then the solution/answer.
function card(q, i) {
  const qh = trim(q.question)
  const years = Array.isArray(q.years) ? q.years.filter(Boolean) : []
  const yTag = years.length ? `<span class="q-year" style="margin-left:8px;font-size:12px;color:#0FA39A;font-weight:700">[${years.join(', ')}]</span>` : ''
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
  // Solution: prefer solution_data[].solution; MCQ may instead carry the answer as
  // the correct option's explanation.
  let solBody = ''
  if (Array.isArray(q.solution) && q.solution.length) solBody = q.solution.map((s) => trim(s.solution)).filter(Boolean).join('<hr/>')
  if (!solBody) { const co = opts.find((o) => o.is_correct); solBody = co ? (trim(co.explanation) || `<p>Correct answer: (${LETTERS[opts.indexOf(co)]}) ${trim(co.option)}</p>`) : '' }
  const ans = solBody ? `<div class="answer-section"><div class="solution-block"><div class="label">Solution</div><div>${solBody}</div></div></div>` : ''
  return `<div class="question-card"><div class="question-header"><span class="q-number">Q ${i + 1}</span>${yTag}</div><div class="question-body"><div class="question-text">${qh}</div></div>${optsHtml}${ans}</div>`
}

async function fetchChapterPyq(chapterId) {
  const out = []
  let url = `${B}/question/previous_year_questions/${chapterId}/`
  while (url) {
    let j
    try { j = await api(url) } catch (e) { if (e.fatal) throw e; break }
    for (const q of ((j.data && j.data.results) || [])) out.push(q)
    url = (j.data && j.data.next) || null
    if (url) await sleep(DELAY)
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
  const list = await api(`${B}/content/category/${RESOURCE_ID}/type/0/content_name/flash-card/`)
  const chapters = list.children || []
  console.log(`${SUBJECT} (${CLASS_NAME}) PYQ — ${chapters.length} chapters`)

  const rows = []
  let ci = 0
  for (const ch of chapters) {
    let qs = []
    try { qs = await fetchChapterPyq(ch.id) } catch (e) { if (e.fatal) { console.error('AUTH/subscription error — refresh session.'); process.exit(1) } }
    if (!qs.length) { console.log(`  ${normApos(ch.name)}: 0 (skip)`); await sleep(DELAY); continue }
    const mcq = qs.filter((q) => (q.option || []).length).length
    console.log(`  ${normApos(ch.name).padEnd(40)} ${qs.length} PYQ (${mcq} MCQ, ${qs.length - mcq} subjective)`)
    const html = qs.map((q, i) => card(q, i)).join('\n')
    rows.push({ part: PART, subject: SUBJECT, className: CLASS_NAME, chapter: normApos(ch.name), sectionKey: 'pyq-0', sectionLabel: 'Previous Year Questions', html, chapterPos: ci, position: 0 })
    ci++
    await sleep(DELAY)
  }
  const totalQ = rows.length // one section per chapter
  console.log(`\nTOTAL: ${rows.length} chapter-sections (part=${PART})`)
  fs.writeFileSync(path.join(ROOT, 'src', 'data', 'class9MathsOld', 'old-maths-pyq.json'), JSON.stringify(rows))
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
    console.log(`✓ Seeded ${rows.length} PYQ chapter-sections (part=${PART}) for ${SUBJECT} / ${CLASS_NAME}.`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
