'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Fetch "Revision Notes" (examin8 flash cards) for Class 6 OLD subjects and seed
// into ncert_solutions as part=4 (className='Class 6'), rendered by Ncert2Screen.
// Only Old - Science exposes flash cards at Class 6. Mirror of seedClass9OldNotes.
//
//   flash chapters : GET /v1/content/category/:res/type/0/content_name/flash-card/
//   flash cards    : GET /v1/flash_card/flash_cards/:chapterId/
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass6OldNotes.js          # DRY
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass6OldNotes.js --live    # seed
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const B = 'https://web.examin8.com/v1'
const CLASS_NAME = 'Class 6'
const PART = 4
const DELAY = 150

// Probe showed flash cards only for Science at Class 6; the others simply return
// no chapters and are harmlessly skipped, so all 5 are listed for completeness.
const SUBJECTS = [
  { name: 'Old - Maths',     res: '1612' },
  { name: 'Old - Science',   res: '1595' },
  { name: 'Old - Social Sc', res: '1570' },
  { name: 'Old - English',   res: '1920' },
  { name: 'Old - हिंदी',      res: '1923' },
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

function noteCard(c) {
  const body = trim(c.text)
  const ans = trim(c.answer)
  const ab = ans ? `<div class="answer-section"><div class="solution-block"><div class="label">Answer</div><div>${ans}</div></div></div>` : ''
  return `<div class="question-card"><div class="question-body"><div class="question-text">${body}</div></div>${ab}</div>`
}
const cards2html = (cards) => cards.map(noteCard).join('\n')

async function fetchSubjectRows(subj) {
  let list
  try { list = await api(`${B}/content/category/${subj.res}/type/0/content_name/flash-card/`) } catch (e) { if (e.fatal) throw e; return [] }
  const chapters = list.children || []
  if (!chapters.length) { console.log(`\n=== ${subj.name}: no flash cards — skipped ===`); return [] }
  console.log(`\n=== ${subj.name} (${CLASS_NAME}) Revision Notes — ${chapters.length} chapters ===`)
  const rows = []
  let ci = 0
  for (const ch of chapters) {
    let fc
    try { fc = await api(`${B}/flash_card/flash_cards/${ch.id}/`) } catch (e) { if (e.fatal) throw e; await sleep(DELAY); continue }
    const topics = (fc.flash_cards || []).filter((t) => (t.cards || []).length)
    if (!topics.length) { await sleep(DELAY); continue }
    const single = topics.length === 1
    topics.forEach((t, si) => {
      const label = single ? 'Revision Notes' : normApos(t.topic_name)
      const html = cards2html((t.cards || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map((c) => ({ text: c.text, answer: c.answer })))
      rows.push({ part: PART, subject: subj.name, className: CLASS_NAME, chapter: normApos(ch.name), sectionKey: slug(label) + '-' + si, sectionLabel: label, html, chapterPos: ci, position: si })
    })
    const cards = topics.reduce((n, t) => n + (t.cards || []).length, 0)
    console.log(`  ${normApos(ch.name).padEnd(40)} ${topics.length} topics, ${cards} cards`)
    ci++
    await sleep(DELAY)
  }
  console.log(`  → ${rows.length} note sections`)
  return rows
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function main() {
  if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
  const outDir = path.join(ROOT, 'src', 'data', 'class6OldNotes')
  fs.mkdirSync(outDir, { recursive: true })
  const bySubject = []
  for (const subj of SUBJECTS) {
    const rows = await fetchSubjectRows(subj)
    if (rows.length) fs.writeFileSync(path.join(outDir, slug(subj.name) + '.json'), JSON.stringify(rows))
    bySubject.push({ subj, rows })
  }
  const total = bySubject.reduce((n, x) => n + x.rows.length, 0)
  console.log(`\nTOTAL: ${total} note sections (part=${PART})`)
  if (!LIVE) { console.log('[DRY] add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('✓ Connected.')
  try {
    for (const { subj, rows } of bySubject) {
      if (!rows.length) continue
      await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [PART, subj.name, CLASS_NAME])
      for (const r of rows) {
        await client.query(
          `insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [r.part, r.subject, r.className, r.chapter, r.sectionKey, r.sectionLabel, r.html, r.chapterPos, r.position])
      }
      console.log(`  ✓ ${subj.name}: ${rows.length} note sections (part=${PART})`)
    }
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); if (e.fatal) console.error('(auth — refresh session)'); process.exit(1) })
