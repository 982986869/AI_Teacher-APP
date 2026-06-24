'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Build maths subtopic-grouped questions + answers for MCQ Practice.
//   - Subtopic questions: GET category/{chapterId}/paginate/?topic_id={subId}
//     (the CORRECT maths endpoint — plain category/{subId} returns wrong data).
//   - Answers: POST /v1/practice/attempted/ → correct_option (one attempt/question).
// Writes maths_questions/<chapter>.by_topic.json for scripts/importMcqPractice.js.
//
// ⚠️ Each question = one submitted attempt on the examin8 account. Resumable
// (answer cache: maths_questions/answer_key_maths_practice.json).
//
// Creds via env:
//   EXAMIN8_COOKIE='mcsrftoken=...; msessionid=...'   EXAMIN8_CSRF='<mcsrftoken>'
//   node scripts/fetchMathsSubtopics.js          # full
//   node scripts/fetchMathsSubtopics.js --test    # one chapter, one subtopic
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DIR = path.join(ROOT, 'src', 'data', 'maths_questions')
const KEY_FILE = path.join(DIR, 'answer_key_maths_practice.json')
const TEST = process.argv.includes('--test')

const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const BASE = 'https://web.examin8.com/v1/practice'
const REFERER = 'https://web.examin8.com/i/376735/ailernova/batch/21884/resources/1371/practice-topic-list'
const PAGE = 50
const DELAY_MS = 250
const MAX_RETRIES = 3

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const loadJSON = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d)
const headers = () => ({ 'content-type': 'application/json', 'accept': 'application/json', 'x-csrftoken': CSRF, 'referer': REFERER, 'cookie': COOKIE })

async function getJSON(url) {
  for (let a = 1; a <= MAX_RETRIES; a++) {
    try {
      const res = await fetch(url, { headers: headers() })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return await res.json()
    } catch (e) { if (a === MAX_RETRIES) throw e; await sleep(500 * a) }
  }
}

// All questions of a subtopic (paginated)
async function fetchSubtopicQuestions(chapterId, subId) {
  const all = []
  const seen = new Set()
  for (let off = 0; off < 5000; off += PAGE) {
    const url = `${BASE}/question/category/${chapterId}/paginate/?topic_id=${subId}&limit=${PAGE}&offset=${off}`
    const j = await getJSON(url)
    const items = j.data || []
    for (const q of items) if (!seen.has(q.id)) { seen.add(q.id); all.push(q) }
    await sleep(DELAY_MS)
    if (items.length < PAGE) break
  }
  return all
}

async function fetchAnswer(chapterId, q) {
  const body = JSON.stringify({ question: q.id, option: q.options[0].id, time_taken: 4, category: chapterId })
  for (let a = 1; a <= MAX_RETRIES; a++) {
    try {
      const res = await fetch(`${BASE}/attempted/`, { method: 'POST', headers: headers(), body })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const j = await res.json()
      return { correctOptionId: j.correct_option, explanation: j.explanation || null }
    } catch (e) { if (a === MAX_RETRIES) throw e; await sleep(500 * a) }
  }
}

async function main() {
  if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF'); process.exit(1) }
  const index = loadJSON(path.join(DIR, 'index.json'), { chapters: [] })
  const cache = loadJSON(KEY_FILE, {}) // qid -> {correctOptionId, explanation}
  let chapters = index.chapters || []
  if (TEST) chapters = chapters.slice(0, 1)

  let totalQ = 0, fetched = 0
  for (const ch of chapters) {
    const chFile = path.join(DIR, ch.file)
    if (!fs.existsSync(chFile)) { console.log('skip (no file):', ch.file); continue }
    let topics = (loadJSON(chFile, {}).topics) || []
    if (TEST) topics = topics.slice(0, 1)

    const outTopics = []
    for (const t of topics) {
      const subId = t.id ?? t.topicId
      const qs = await fetchSubtopicQuestions(ch.chapter_id, subId)
      const outQs = []
      for (const q of qs) {
        totalQ++
        let ans = cache[q.id]
        if (!ans) {
          ans = await fetchAnswer(ch.chapter_id, q)
          cache[q.id] = ans
          fetched++
          if (fetched % 25 === 0) { fs.writeFileSync(KEY_FILE, JSON.stringify(cache)); console.log(`   …${fetched} answers fetched`) }
          await sleep(DELAY_MS)
        }
        outQs.push({ id: q.id, question: q.question, options: q.options, topicId: subId, topicName: t.name, correctOptionId: ans.correctOptionId, explanation: ans.explanation })
      }
      outTopics.push({ topicId: subId, topicName: t.name, questions: outQs })
      console.log(`   • ${ch.chapter_name} / ${t.name}: ${outQs.length} q`)
    }
    const out = { chapter_id: ch.chapter_id, chapter_name: ch.chapter_name, topics: outTopics }
    fs.writeFileSync(path.join(DIR, ch.file.replace(/\.json$/, '.by_topic.json')), JSON.stringify(out, null, 2))
    fs.writeFileSync(KEY_FILE, JSON.stringify(cache))
    console.log(`✓ ${ch.chapter_name}: ${outTopics.length} subtopics`)
  }
  console.log(`\nDONE: ${totalQ} questions, ${fetched} newly fetched.`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
