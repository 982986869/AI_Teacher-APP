'use strict'
/**
 * fetch-textbooks.js — Class 6 Science structured textbook Q&A from examin8.
 *
 * Two books (from subject 1595 textbook_data):
 *   Exemplar : c8b9f247-b5bd-481b-afc9-dd2833cb1fc0  → "Class 06 - Science - Exemplar Book by NCERT"
 *   Revised  : bf52c3e8-ca08-49cf-bf87-16ad3e3d816e  → "Class 06 - Science - Revised"
 *
 * API (cookie-gated; needs a session that has textbook access):
 *   GET /v1/textbook/{book_uuid}/dashboard/chapters/          -> chapters[{name,uuid}]
 *   GET /v1/textbook/chapter/{chapter_uuid}/exercises/        -> exercise_nodes[{name,uuid}]
 *   GET /v1/textbook/chapter/{exercise_uuid}/questions/?limit=20&offset=N -> paginated results
 *
 * Output: <Book>/NN_<chapter>.json = { chapter_name, chapter_uuid,
 *   exercises: [{ name, uuid, questions: [raw...] }] }
 * Node 18+.
 */
const fs = require('fs')
const path = require('path')

const CSRF = 'I1WHfIyginu5nUjoZAngXs2gsE9TKtq4'
const COOKIE = `msessionid=axfqdgsru6qra95tlnvhcaqb5xuavl4l; mcsrftoken=${CSRF}`
const BASE = 'https://web.examin8.com'
const DIR = __dirname
const DELAY = 300
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const safe = (s) => s.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim()

const BOOKS = [
  { key: 'Exemplar', uuid: 'c8b9f247-b5bd-481b-afc9-dd2833cb1fc0' },
  { key: 'Revised', uuid: 'bf52c3e8-ca08-49cf-bf87-16ad3e3d816e' },
]

const H = {
  accept: 'application/json, text/plain, */*',
  cookie: COOKIE,
  'x-csrftoken': CSRF,
  referer: `${BASE}/i/376735/ailernova/batch/21891/resources/1595`,
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
}
async function getJSON(url) {
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch(url, { headers: H })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return await r.json()
    } catch (e) { if (a === 3) throw e; await sleep(DELAY * a * 2) }
  }
}

async function fetchQuestions(exerciseUuid) {
  const all = []
  let offset = 0
  while (true) {
    const j = await getJSON(`${BASE}/v1/textbook/chapter/${exerciseUuid}/questions/?limit=20&offset=${offset}`)
    const rows = j.results || []
    all.push(...rows)
    if (!j.next || rows.length === 0) break
    offset += 20
    await sleep(DELAY)
  }
  return all
}

;(async () => {
  for (const book of BOOKS) {
    const out = path.join(DIR, book.key)
    fs.mkdirSync(out, { recursive: true })
    console.log(`\n===== ${book.key} (${book.uuid}) =====`)
    const bookData = await getJSON(`${BASE}/v1/textbook/${book.uuid}/dashboard/chapters/`)
    const chapters = bookData.chapters || []
    console.log(`book: ${bookData.book_name} — ${chapters.length} chapters`)
    const index = { book_name: bookData.book_name, book_uuid: book.uuid, chapters: [] }
    let n = 0
    for (const ch of chapters) {
      n++
      const num = String(n).padStart(2, '0')
      const ex = await getJSON(`${BASE}/v1/textbook/chapter/${ch.uuid}/exercises/`)
      const nodes = ex.exercise_nodes || []
      const exercises = []
      let qTotal = 0
      for (const node of nodes) {
        const qs = await fetchQuestions(node.uuid)
        exercises.push({ name: (node.name || '').trim(), uuid: node.uuid, questions: qs })
        qTotal += qs.length
        await sleep(DELAY)
      }
      const file = `${num}_${safe(ch.name)}.json`
      fs.writeFileSync(path.join(out, file), JSON.stringify({ chapter_name: ch.name, chapter_uuid: ch.uuid, exercises }, null, 2))
      console.log(`  ${num} ${ch.name.slice(0, 38).padEnd(38)} ${nodes.length} ex, ${qTotal} Q`)
      index.chapters.push({ n: num, name: ch.name, uuid: ch.uuid, exercises: nodes.length, questions: qTotal, file })
      await sleep(DELAY)
    }
    fs.writeFileSync(path.join(out, '_index.json'), JSON.stringify(index, null, 2))
    const grand = index.chapters.reduce((s, c) => s + c.questions, 0)
    console.log(`  DONE ${book.key}: ${chapters.length} chapters, ${grand} questions`)
  }
  console.log('\nAll books done.')
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
