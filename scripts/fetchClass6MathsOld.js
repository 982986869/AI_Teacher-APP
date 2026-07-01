'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Fetch Class 6 — Maths (OLD) NCERT chapters from examin8 with the REAL section
// split: Examples + Exercise n.1 / n.2 / … , each with its own questions.
//
// KEY: examin8's per-exercise filter (?exercise=…) is IGNORED, but each exercise
// node has its own UUID that works as a "chapter" in the questions endpoint:
//   GET /textbook/chapter/{chapterUuid}/exercises/  -> [{ uuid, name }]  (sections)
//   GET /textbook/chapter/{nodeUuid}/questions/     -> that section's questions
// (Querying the chapter UUID directly returns an incomplete flat pool — always
//  fetch per node UUID.)
//
// Input:  scripts/class6MathsOld.chapters.json  ->  [{ n, uuid, name }, …]
// Output: src/data/class6MathsOld/chapters/chNN.json
//   { chapter, sections: [{ label, node_uuid, questions:
//     [{ question_id, order, name, question_html, solution_html, options }] }] }
//
//   EXAMIN8_COOKIE='mcsrftoken=…; msessionid=…'  EXAMIN8_CSRF='<mcsrftoken>' \
//     node scripts/fetchClass6MathsOld.js
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const BASE = 'https://web.examin8.com/v1/textbook'
// Reusable for the textbook book (default) and the Exemplar book (override via env):
//   CH_CONFIG=class6MathsExemplar.chapters.json  OUT_SUBDIR=class6MathsExemplar  node scripts/fetchClass6MathsOld.js
const CHAPTERS = path.join(__dirname, process.env.CH_CONFIG || 'class6MathsOld.chapters.json')
const OUT = path.join(ROOT, 'src', 'data', process.env.OUT_SUBDIR || 'class6MathsOld', 'chapters')
const DELAY_MS = 200

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()

async function api(url) {
  const r = await fetch(url, {
    headers: { accept: 'application/json', 'x-csrftoken': CSRF, referer: 'https://web.examin8.com/', cookie: COOKIE },
  })
  if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url)
  return r.json()
}

// All questions for one exercise node (node UUID queried as a chapter; paginated).
async function fetchNode(nodeUuid) {
  const seen = new Set()
  const out = []
  let url = `${BASE}/chapter/${nodeUuid}/questions/?p=1`
  while (url) {
    const j = await api(url)
    for (const q of (j.results || [])) {
      if (seen.has(q.id)) continue
      seen.add(q.id)
      const sol = Array.isArray(q.solution_data) && q.solution_data[0]
        ? q.solution_data[0].solution : (q.solution_html || q.solution || '')
      out.push({
        question_id: q.id,
        order: q.order != null ? q.order : out.length + 1,
        name: q.name != null ? String(q.name) : '',
        question_html: q.question || '',
        solution_html: sol || '',
        options: q.options_data || [],
      })
    }
    url = j.next || null
    if (url) await sleep(DELAY_MS)
  }
  out.sort((a, b) => (a.order - b.order) || (a.question_id - b.question_id))
  return out
}

async function fetchChapter(ch) {
  const meta = await api(`${BASE}/chapter/${ch.uuid}/exercises/`)
  const chapterName = trim(meta.chapter_name) || trim(ch.name) || ch.uuid
  const sections = []
  for (const node of (meta.exercise_nodes || [])) {
    const questions = await fetchNode(node.uuid)
    sections.push({ label: trim(node.name), node_uuid: node.uuid, questions })
    await sleep(DELAY_MS)
  }
  return { chapterName, sections }
}

async function main() {
  if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
  const chapters = JSON.parse(fs.readFileSync(CHAPTERS, 'utf8'))
  fs.mkdirSync(OUT, { recursive: true })
  let grand = 0
  for (const ch of chapters) {
    try {
      const { chapterName, sections } = await fetchChapter(ch)
      const file = path.join(OUT, 'ch' + String(ch.n).padStart(2, '0') + '.json')
      fs.writeFileSync(file, JSON.stringify({ chapter: chapterName, sections }))
      const total = sections.reduce((n, s) => n + s.questions.length, 0)
      grand += total
      console.log(`  ch${String(ch.n).padStart(2, '0')}  ${chapterName.padEnd(28)} ${sections.length} sections, ${total} questions`)
      sections.forEach((s) => console.log(`        - ${s.label.padEnd(16)} ${s.questions.length}`))
    } catch (e) {
      console.log(`  ch${String(ch.n).padStart(2, '0')}  ${(ch.name || ch.uuid)}  FAILED: ${e.message}`)
    }
    await sleep(DELAY_MS)
  }
  console.log(`\nDone: ${chapters.length} chapters, ${grand} questions -> src/data/class6MathsOld/chapters/`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
