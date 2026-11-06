'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Class 11 examin8 RAW fetcher (read-only, resumable). Saves verbatim API JSON
// under src/data/class11Examin8/<subjectRes>/ so the seeders can run offline.
//
// Per subject: download-resources, chapter tree, revision notes (flash cards),
// NCERT/Exemplar textbooks, Important Questions, PYQ, online-test + mock lists.
// Nothing here submits or records anything on the examin8 account.
//
//   node scripts/fetchClass11Examin8.js                 # all subjects
//   ONLY=1340,1371 node scripts/fetchClass11Examin8.js  # by examin8 res id
//   KINDS=notes,books node scripts/fetchClass11Examin8.js
// Cookie from server/.env.examin8 (EXAMIN8_COOKIE / EXAMIN8_CSRF).
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
// CLASS=9 → category 1217, cache src/data/class9Examin8 (default Class 11).
const CLASS = process.env.CLASS || '11'
const CLASS_CATS = { 3: 1448, 6: 1445, 7: 1444, 9: 1217, 11: 1339 }
const OUT = path.join(ROOT, 'src', 'data', `class${CLASS}Examin8`)
const B = 'https://web.examin8.com/v1'
const DELAY = 150
const CLASS_CAT = CLASS_CATS[CLASS]

const env = fs.readFileSync(path.join(ROOT, 'server', '.env.examin8'), 'utf8')
const COOKIE = process.env.EXAMIN8_COOKIE || env.match(/^EXAMIN8_COOKIE=(.*)$/m)[1].trim()
const CSRF = process.env.EXAMIN8_CSRF || env.match(/^EXAMIN8_CSRF=(.*)$/m)[1].trim()
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean)
const KINDS = (process.env.KINDS || 'meta,notes,books,iq,pyq,online,mock').split(',')

// PCMB first, then the rest in examin8 order.
const PRIORITY = CLASS === '11' ? ['1340', '1356', '1371', '1388'] : []

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let nReq = 0, nCached = 0, nErr = 0

class AuthError extends Error {}

async function api(url, tries = 4) {
  for (let a = 1; ; a++) {
    let r
    try {
      r = await fetch(url, { headers: { accept: 'application/json', 'x-csrftoken': CSRF, referer: 'https://web.examin8.com/', cookie: COOKIE } })
    } catch (e) {
      if (a >= tries) throw e
      await sleep(1500 * a); continue
    }
    nReq++
    if (r.status === 401 || r.status === 403) {
      const t = await r.text()
      if (/credentials were not provided|not authenticated/i.test(t)) throw new AuthError('AUTH ' + r.status + ' ' + url)
      const e = new Error('HTTP ' + r.status + ' ' + url); e.status = r.status; throw e
    }
    if (r.status >= 500 && a < tries) { await sleep(1500 * a); continue }
    if (!r.ok) { const e = new Error('HTTP ' + r.status + ' ' + url); e.status = r.status; throw e }
    const txt = await r.text()
    if (txt.startsWith('<')) { const e = new Error('HTML response ' + url); e.status = 0; throw e }
    return JSON.parse(txt)
  }
}

// Cached GET: file exists → reuse. Errors (non-auth) are cached as {__error}.
async function cached(file, url) {
  if (fs.existsSync(file)) {
    // A killed run can leave a truncated / NUL-filled file → refetch it.
    try { const j = JSON.parse(fs.readFileSync(file, 'utf8')); nCached++; return j } catch (_) { fs.unlinkSync(file) }
  }
  let j
  try { j = await api(url) } catch (e) {
    if (e instanceof AuthError) throw e
    nErr++
    j = { __error: e.message, __status: e.status }
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file + '.tmp', JSON.stringify(j)); fs.renameSync(file + '.tmp', file) // atomic
  await sleep(DELAY)
  return j
}

// Follow `next` (top-level or under data) and store every page.
async function cachedPages(fileBase, firstUrl, maxPages = 200) {
  const pages = []
  let url = firstUrl
  for (let p = 1; url && p <= maxPages; p++) {
    const j = await cached(`${fileBase}-p${p}.json`, url)
    pages.push(j)
    url = (j && (j.next || (j.data && j.data.next))) || null
  }
  return pages
}

async function doSubject(s) {
  const dir = path.join(OUT, String(s.id))
  const f = (n) => path.join(dir, n)
  console.log(`\n=== ${s.id} ${s.name}`)
  const dr = await cached(f('download-resources.json'), `${B}/content/category/${s.id}/type/download-resources/`)
  const chapters = await cached(f('chapters.json'), `${B}/content/category/${s.id}/`)
  const chList = Array.isArray(chapters) ? chapters : []
  console.log(`   ${chList.length} chapters | notes:${!!dr.has_flash_card} iq:${!!dr.has_important_questions} pyq:${!!dr.has_previous_year_questions} online:${!!dr.has_onlinetest} mock:${!!dr.has_mock_quiz} books:${(dr.textbook_data || []).length}`)

  if (KINDS.includes('notes') && dr.has_flash_card) {
    const list = await cached(f('notes/list.json'), `${B}/content/category/${s.id}/type/0/content_name/flash-card/`)
    const kids = (list && list.children) || chList
    let cards = 0
    for (const ch of kids) {
      const fc = await cached(f(`notes/ch-${ch.id}.json`), `${B}/flash_card/flash_cards/${ch.id}/`)
      for (const t of (fc.flash_cards || [])) cards += (t.cards || []).length
    }
    console.log(`   notes: ${kids.length} ch, ${cards} cards`)
  }

  if (KINDS.includes('iq') && dr.has_important_questions) {
    const list = await cached(f('iq/list.json'), `${B}/content/category/${s.id}/type/0/content_name/important-questions/`)
    const kids = (list && list.children && list.children.length) ? list.children : chList
    let n = 0
    for (const ch of kids) {
      const pages = await cachedPages(f(`iq/ch-${ch.id}`), `${B}/question/important-questions/${ch.id}/`)
      for (const p of pages) n += ((p.data && p.data.results) || p.results || []).length
    }
    console.log(`   iq: ${kids.length} ch, ${n} q`)
  }

  if (KINDS.includes('pyq') && dr.has_previous_year_questions) {
    // All chapters (IQ listing is a subset that can miss PYQ chapters).
    const topics = await cached(f('pyq/topics.json'), `${B}/practice/topics-q-attempt-data/${s.id}/`)
    const ids = new Map()
    for (const ch of chList) ids.set(String(ch.id), ch.name)
    const tl = (topics && (topics.data || topics.results || topics.chapters)) || (Array.isArray(topics) ? topics : [])
    for (const t of (Array.isArray(tl) ? tl : [])) { const id = t.category_id || t.chapter_id || t.id; if (id) ids.set(String(id), t.name || t.category_name) }
    let n = 0
    for (const [id] of ids) {
      const pages = await cachedPages(f(`pyq/ch-${id}`), `${B}/question/previous_year_questions/${id}/`)
      for (const p of pages) n += ((p.data && p.data.results) || p.results || []).length
    }
    console.log(`   pyq: ${ids.size} ch, ${n} q`)
  }

  if (KINDS.includes('books')) {
    for (const bk of (dr.textbook_data || [])) {
      const meta = await cached(f(`books/${bk.uuid}/chapters.json`), `${B}/textbook/${bk.uuid}/dashboard/chapters/`)
      const chs = Array.isArray(meta) ? meta : (meta.chapters || meta.results || [])
      let nq = 0
      for (const ch of chs) {
        const chUuid = ch.uuid || ch.id
        const ex = await cached(f(`books/${bk.uuid}/ch-${chUuid}/exercises.json`), `${B}/textbook/chapter/${chUuid}/exercises/`)
        for (const node of (ex.exercise_nodes || [])) {
          const pages = await cachedPages(f(`books/${bk.uuid}/ch-${chUuid}/node-${node.uuid}`), `${B}/textbook/chapter/${node.uuid}/questions/?p=1`)
          for (const p of pages) nq += (p.results || []).length
        }
      }
      console.log(`   book "${bk.name}": ${chs.length} ch, ${nq} q`)
    }
  }

  if (KINDS.includes('online') && dr.has_onlinetest) {
    let tests = 0
    for (const ch of chList) {
      const l = await cached(f(`online/ch-${ch.id}.json`), `${B}/category/${ch.id}/`)
      const arr = (l && (l.testpapers || l.test_papers || l.results || l.data)) || []
      tests += Array.isArray(arr) ? arr.length : 0
    }
    console.log(`   online: listed ${chList.length} chapters (${tests} tests seen)`)
  }

  if (KINDS.includes('mock') && dr.has_mock_quiz) {
    const m = await cached(f('mock/list.json'), `${B}/mock-test/category/${s.id}/`)
    const arr = (m && (m.results || m.data || m)) || []
    console.log(`   mock: ${Array.isArray(arr) ? arr.length : '?'} tests listed`)
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const subjects = await cached(path.join(OUT, 'subjects.json'), `${B}/content/category/${CLASS_CAT}/`)
  let list = subjects.map((s) => ({ id: String(s.id), name: s.name }))
  list.sort((a, b) => {
    const pa = PRIORITY.indexOf(a.id), pb = PRIORITY.indexOf(b.id)
    return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb)
  })
  if (ONLY.length) list = list.filter((s) => ONLY.includes(s.id))
  const t0 = Date.now()
  try {
    for (const s of list) await doSubject(s)
  } catch (e) {
    if (e instanceof AuthError) { console.error(`\n✗ SESSION EXPIRED: ${e.message}\n  Refresh server/.env.examin8 and re-run (cache resumes).`); process.exitCode = 2 }
    else throw e
  } finally {
    console.log(`\nrequests ${nReq}, cached ${nCached}, errors ${nErr}, ${Math.round((Date.now() - t0) / 1000)}s`)
  }
}

main()
