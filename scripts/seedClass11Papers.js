'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed the Class 11 PDF resources fetched by scripts/fetchClass11Papers.js into
// ncert_solutions ("className"='Class 11'), so they surface as Resources tiles
// through the existing class-subjects → Ncert2Screen flow (no new tables):
//
//   part 13 = Sample Papers          chapter = paper title  (question + solution PDF)
//   part 14 = Test Papers            chapter = syllabus chapter, one card per paper
//   part 15 = Case Study Questions   chapter = syllabus chapter, one card per set
//   part 16 = Last Year Papers       chapter = paper (HTML snapshot: question + answers)
//
// PDF buttons link to /pdfs/class11/… (relative; Ncert2Screen's WebView has the API
// as baseUrl and hands .pdf links to the phone's PDF viewer).
//
//   node scripts/seedClass11Papers.js          # dry
//   node scripts/seedClass11Papers.js --live
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'src', 'data', 'class11Papers')
const LIVE = process.argv.includes('--live')
const CLASS_NAME = 'Class 11'
const PART = { sample: [13, 'Sample Papers'], test: [14, 'Test Papers'], case: [15, 'Case Study Questions'], lyp: [16, 'Last Year Papers'] }

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const keySlug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x'
const btn = (href, label, primary) =>
  `<a href="/pdfs/${href}" style="display:block;text-align:center;text-decoration:none;font-weight:700;padding:12px 14px;border-radius:10px;margin:8px 0;${primary ? 'background:#5b3df5;color:#fff;' : 'background:#efeaff;color:#3a2bb0;'}">${label}</a>`
function pdfCard(it, i) {
  const buttons = [it.file && btn(it.file, 'Open question paper (PDF)', true), it.solutionFile && btn(it.solutionFile, 'Open solutions (PDF)', false)].filter(Boolean).join('')
  if (!buttons) return ''
  return `<div class="question-card"><div class="question-header"><span class="q-number">${esc(it.title || `Paper ${i + 1}`)}</span></div><div class="question-body">${buttons}<div style="font-size:12px;color:#777;margin-top:4px;">Opens in your phone's PDF viewer.</div></div></div>`
}
const rows = []
const add = (subject, part, label, chapter, chapterPos, sectionLabel, html, position) =>
  rows.push({ subject, part, label, chapter, chapterPos, sectionKey: keySlug(sectionLabel) + '-' + position, sectionLabel, html, position })

function main() {
  const man = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8'))
  for (const res of Object.keys(man)) {
    const m = man[res]
    const subject = m.subject
    // Sample papers: one "chapter" per paper.
    ;(m.sample || []).forEach((it, i) => {
      const h = pdfCard(it, i)
      if (h) add(subject, PART.sample[0], PART.sample[1], it.title || `Sample Paper ${i + 1}`, i, 'Sample Paper', h, 0)
    })
    // Test papers + case studies: grouped by syllabus chapter.
    for (const kind of ['test', 'case']) {
      const byCh = new Map()
      for (const it of (m[kind] || [])) {
        if (!it.file) continue
        const k = it.chapter || 'Other'
        if (!byCh.has(k)) byCh.set(k, { pos: it.chapterPos || 999, items: [] })
        byCh.get(k).items.push(it)
      }
      ;[...byCh].sort((a, b) => a[1].pos - b[1].pos).forEach(([ch, v], ci) => {
        v.items.sort((a, b) => String(a.title).localeCompare(String(b.title), undefined, { numeric: true }))
        add(subject, PART[kind][0], PART[kind][1], ch, ci, PART[kind][1], v.items.map(pdfCard).join('\n'), 0)
      })
    }
    // Last year papers (HTML snapshots and/or PDFs).
    if (m.lyp) {
      let ci = 0
      for (const p of (m.lyp.html || [])) {
        const snap = JSON.parse(fs.readFileSync(path.join(OUT, p.snapshot), 'utf8'))
        const title = [p.name || p.title, p.year].filter(Boolean).join(' ')
        if (snap.snapshot) add(subject, PART.lyp[0], PART.lyp[1], title, ci, 'Question Paper', snap.snapshot, 0)
        if (snap.answer_snapshot) add(subject, PART.lyp[0], PART.lyp[1], title, ci, 'Solutions', snap.answer_snapshot, 1)
        ci++
      }
      for (const it of (m.lyp.pdf || [])) {
        const h = pdfCard(it, ci)
        if (h) add(subject, PART.lyp[0], PART.lyp[1], it.title || `Paper ${ci + 1}`, ci++, 'Last Year Paper', h, 0)
      }
    }
  }
  const summary = {}
  for (const r of rows) { const k = `${r.subject} | ${r.label}`; summary[k] = (summary[k] || 0) + 1 }
  for (const [k, n] of Object.entries(summary)) console.log(`${k}: ${n} sections`)
  return rows
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); for (const k of [...x.searchParams.keys()]) x.searchParams.delete(k); u = x.toString() } catch (_) {}
  return u
}

;(async () => {
  const data = main()
  if (!LIVE) { console.log('\n[DRY] add --live to write.'); return }
  const { Client } = require('pg')
  const c = new Client({ connectionString: getDbUrl() })
  await c.connect()
  try {
    await c.query('BEGIN')
    await c.query('delete from ncert_solutions where "className" = $1 and part = any($2)', [CLASS_NAME, [13, 14, 15, 16]])
    for (const r of data) {
      await c.query(
        `insert into ncert_solutions (id, part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position, part_label)
         values (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [r.part, r.subject, CLASS_NAME, r.chapter, r.sectionKey, r.sectionLabel, String(r.html).replace(/\u0000/g, ''), r.chapterPos, r.position, r.label])
    }
    await c.query('COMMIT')
    console.log(`\n✓ ${data.length} rows written`)
  } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e } finally { await c.end() }
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
