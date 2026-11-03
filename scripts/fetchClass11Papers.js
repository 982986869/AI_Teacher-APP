'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Class 11 examin8 PDF resources (read-only, resumable): Sample Papers (type 2,
// subject level, question + solution PDF), CBSE Test Papers (type 4, per chapter)
// and Case Study Questions (type 33, per chapter); plus Last Year Papers (type 3,
// HTML snapshots — only हिंदी कोर / हिंदी ऐच्छिक have any).
//
// PDFs → server/public/pdfs/class11/<res>/<kind>/<id>.pdf (+ <id>-solution.pdf),
// served by the backend's existing /pdfs static route. The download links are
// signed and expire after ~24h, so they are used immediately, never stored.
// Manifest (what exists, titles, chapters, files) → src/data/class11Papers/manifest.json.
// Chapters marked "(Deleted)" are skipped, matching the rest of the Class 11 seed.
//
//   node scripts/fetchClass11Papers.js            # all subjects
//   ONLY=1340 KINDS=sample,test node scripts/fetchClass11Papers.js
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const RAW = path.join(ROOT, 'src', 'data', 'class11Examin8')
const OUT = path.join(ROOT, 'src', 'data', 'class11Papers')
const PDF = path.join(ROOT, 'server', 'public', 'pdfs', 'class11')
const B = 'https://web.examin8.com/v1'
const DELAY = 150
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean)
const KINDS = (process.env.KINDS || 'sample,test,case,lyp').split(',')
const TYPE = { sample: 2, test: 4, case: 33, lyp: 3 }

const env = fs.readFileSync(path.join(ROOT, 'server', '.env.examin8'), 'utf8')
const COOKIE = process.env.EXAMIN8_COOKIE || env.match(/^EXAMIN8_COOKIE=(.*)$/m)[1].trim()
const CSRF = process.env.EXAMIN8_CSRF || env.match(/^EXAMIN8_CSRF=(.*)$/m)[1].trim()
const H = { accept: 'application/json', 'x-csrftoken': CSRF, referer: 'https://web.examin8.com/', cookie: COOKIE }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const stats = { items: 0, downloaded: 0, cached: 0, failed: 0, bytes: 0 }

async function api(url) {
  for (let a = 1; ; a++) {
    try {
      const r = await fetch(url, { headers: H })
      if (r.status === 401) throw Object.assign(new Error('AUTH 401'), { fatal: true })
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url)
      const j = await r.json()
      await sleep(DELAY)
      return j
    } catch (e) {
      if (e.fatal || a >= 3) throw e
      await sleep(1500 * a)
    }
  }
}

async function download(url, file) {
  if (!url) return null
  if (fs.existsSync(file) && fs.statSync(file).size > 1000) { stats.cached++; return file }
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const b = Buffer.from(await r.arrayBuffer())
      if (b.slice(0, 4).toString() !== '%PDF') throw new Error('not a PDF')
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file + '.tmp', b); fs.renameSync(file + '.tmp', file)
      stats.downloaded++; stats.bytes += b.length
      return file
    } catch (e) {
      if (a === 3) { stats.failed++; console.log(`    ! ${path.basename(file)}: ${e.message}`); return null }
      await sleep(1500 * a)
    }
  }
}

const rel = (f) => (f ? path.relative(path.join(ROOT, 'server', 'public', 'pdfs'), f).replace(/\\/g, '/') : null)

async function items(res, subject, kind, chapter) {
  const url = `${B}/content/category/${chapter ? chapter.id : res}/type/${TYPE[kind]}/`
  const j = await api(url)
  const list = [...(j.content || []), ...(j.content_paid || [])]
  const out = []
  for (const it of list) {
    stats.items++
    const dir = path.join(PDF, res, kind)
    const q = await download(it.download_url, path.join(dir, `${it.id}.pdf`))
    const s = await download(it.download_solution_url, path.join(dir, `${it.id}-solution.pdf`))
    out.push({ id: it.id, title: (it.title || '').trim(), isPaid: !!it.is_paid, chapter: chapter ? chapter.name.trim() : null, chapterId: chapter ? chapter.id : null, chapterPos: chapter ? chapter.weight : null, file: rel(q), solutionFile: rel(s) })
  }
  return { list: out, categories: j.categories || [], lyp: j.previous_year_papers || [] }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const manFile = path.join(OUT, 'manifest.json')
  const manifest = fs.existsSync(manFile) ? JSON.parse(fs.readFileSync(manFile, 'utf8')) : {}
  const subjects = JSON.parse(fs.readFileSync(path.join(RAW, 'subjects.json'), 'utf8'))
  for (const s of subjects) {
    const res = String(s.id)
    if (ONLY.length && !ONLY.includes(res)) continue
    const drFile = path.join(RAW, res, 'download-resources.json')
    if (!fs.existsSync(drFile)) continue
    const d = JSON.parse(fs.readFileSync(drFile, 'utf8'))
    const want = {
      sample: (d.sample_papers_item_free_count || 0) + (d.sample_papers_item_paid_count || 0),
      test: (d.test_papers_item_free_count || 0) + (d.test_papers_item_paid_count || 0),
      case: (d.case_study_questions_item_free_count || 0) + (d.case_study_questions_item_paid_count || 0),
      lyp: (d.last_year_paper_item_free_count || 0) + (d.last_year_paper_item_paid_count || 0),
    }
    if (!KINDS.some((k) => want[k])) continue
    const name = s.name.trim()
    manifest[res] = manifest[res] || { subject: name }
    console.log(`\n=== ${res} ${name}`)
    for (const kind of KINDS) {
      if (!want[kind]) continue
      try {
        if (kind === 'sample') {
          const r = await items(res, name, 'sample', null)
          manifest[res].sample = r.list
        } else if (kind === 'lyp') {
          const j = await api(`${B}/content/category/${res}/type/3/`)
          const papers = []
          for (const p of (j.previous_year_papers || [])) {
            stats.items++
            const f = path.join(OUT, 'lyp', `${p.uuid}.json`)
            if (!fs.existsSync(f)) {
              const snap = await api(`${B}/previous_year_question/paper/data/${p.uuid}/`)
              fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(snap))
            }
            papers.push({ uuid: p.uuid, name: p.name, year: p.year, code: p.code, set: p.set, title: p.title, snapshot: path.relative(OUT, f).replace(/\\/g, '/') })
          }
          // Some subjects publish LYP as PDFs under content[] instead.
          const pdfs = []
          for (const it of [...(j.content || []), ...(j.content_paid || [])]) {
            stats.items++
            const q = await download(it.download_url, path.join(PDF, res, 'lyp', `${it.id}.pdf`))
            const sol = await download(it.download_solution_url, path.join(PDF, res, 'lyp', `${it.id}-solution.pdf`))
            pdfs.push({ id: it.id, title: (it.title || '').trim(), file: rel(q), solutionFile: rel(sol) })
          }
          manifest[res].lyp = { html: papers, pdf: pdfs }
        } else {
          const top = await api(`${B}/content/category/${res}/type/${TYPE[kind]}/`)
          const all = []
          for (const ch of (top.categories || [])) {
            if (/\(deleted\)/i.test(ch.name)) continue
            const r = await items(res, name, kind, ch)
            all.push(...r.list)
          }
          manifest[res][kind] = all
        }
        const got = manifest[res][kind]
        const n = Array.isArray(got) ? got.length : (got.html.length + got.pdf.length)
        console.log(`   ${kind.padEnd(6)} website ${String(want[kind]).padStart(3)}  fetched ${n}`)
      } catch (e) {
        if (e.fatal) { console.error('SESSION EXPIRED — refresh server/.env.examin8 and re-run (resumes).'); process.exitCode = 2; break }
        console.log(`   ${kind} FAILED: ${e.message}`)
      }
      fs.writeFileSync(manFile + '.tmp', JSON.stringify(manifest, null, 1)); fs.renameSync(manFile + '.tmp', manFile)
    }
    if (process.exitCode === 2) break
  }
  console.log(`\nitems ${stats.items}, downloaded ${stats.downloaded}, cached ${stats.cached}, failed ${stats.failed}, ${(stats.bytes / 1048576).toFixed(1)} MB new`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
