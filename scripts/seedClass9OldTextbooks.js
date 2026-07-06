'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 9 OLD-subject textbook solutions (NCERT + Exemplar) into
// ncert_solutions (className='Class 9'). Books are discovered from examin8's
// download-resources `textbook_data` (no hardcoded UUIDs). Each book → its own
// `part` + a display label stored in ncert_solutions.part_label so the app can
// show every book as a separate tile.
//
//   part 3         = Exemplar Solutions
//   parts 2,6,7,9… = NCERT books (in textbook order)  [pool avoids 4=notes,5=IQ,8=PYQ]
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass9OldTextbooks.js          # DRY
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass9OldTextbooks.js --live    # seed
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const B = 'https://web.examin8.com/v1'
const CLASS_NAME = 'Class 9'
const DELAY = 140
const NCERT_POOL = [2, 6, 7, 9, 10, 11, 12]

const SUBJECTS = [
  { name: 'Old - Maths',     res: '1234' },
  { name: 'Old - Science',   res: '1218' },
  { name: 'Old - Social Sc', res: '1895' },
  { name: 'Old - Eng Lang',  res: '1902' },
  { name: 'Old - हिंदी ए',    res: '1904' },
  { name: 'Old - हिंदी ब',    res: '1906' },
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
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function main() {
  if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
  const plan = []
  for (const s of SUBJECTS) {
    const dr = await api(`${B}/content/category/${s.res}/type/download-resources/`)
    const books = dr.textbook_data || []
    if (!books.length) { console.log(`\n${s.name}: no textbooks`); continue }
    console.log(`\n=== ${s.name} — ${books.length} book(s) ===`)
    let poolIdx = 0
    const seededParts = []
    for (const bk of books) {
      const isExemplar = /exemplar/i.test(bk.name)
      const part = isExemplar ? 3 : NCERT_POOL[poolIdx++]
      const chapters = await fetchBook(bk.uuid)
      const nRows = chapters.reduce((n, c) => n + c.sections.length, 0)
      const nQ = chapters.reduce((n, c) => n + c.sections.reduce((a, x) => a + (x.count || 0), 0), 0)
      console.log(`   part ${part}  "${bk.name}"  ${chapters.length} ch, ${nRows} sections, ${nQ} questions`)
      seededParts.push({ part, label: bk.name, chapters })
    }
    plan.push({ subject: s.name, parts: seededParts })
  }

  const outDir = path.join(ROOT, 'src', 'data', 'class9OldTextbooks')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'plan.json'), JSON.stringify(plan))
  if (!LIVE) { console.log('\n[DRY] add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')
  try {
    await client.query('alter table ncert_solutions add column if not exists part_label text')
    for (const sub of plan) {
      for (const p of sub.parts) {
        await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [p.part, sub.subject, CLASS_NAME])
        let ci = 0, rows = 0
        for (const c of p.chapters) {
          let si = 0
          for (const sec of c.sections) {
            await client.query(
              `insert into ncert_solutions (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position, part_label)
               values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
              [p.part, sub.subject, CLASS_NAME, c.chapter, slug(sec.label) + '-' + si, sec.label, sec.html, ci, si, p.label])
            si++; rows++
          }
          ci++
        }
        console.log(`  ✓ ${sub.subject}  part ${p.part} "${p.label}": ${rows} rows`)
      }
    }
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); if (e.fatal) console.error('(auth — refresh session)'); process.exit(1) })
