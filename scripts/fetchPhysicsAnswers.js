'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Fetch correct answers for physics_practice questions via the examin8
// /v1/practice/attempted/ endpoint (same approach as the chemistry tooling),
// then write per-chapter <chapter>.by_topic.json (subtopic-grouped + answers)
// that scripts/importMcqPractice.js can import.
//
// ⚠️ Each question = one submitted attempt on the examin8 account.
// Resumable: answer cache saved to physics_practice/answer_key_physics.json.
//
// Creds via env (NOT hardcoded):
//   EXAMIN8_COOKIE='mcsrftoken=...; msessionid=...'
//   EXAMIN8_CSRF='<mcsrftoken value>'
//
//   node scripts/fetchPhysicsAnswers.js          # full run
//   node scripts/fetchPhysicsAnswers.js --test    # one chapter, first 3 Qs
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DIR = path.join(ROOT, 'src', 'data', 'physics_practice')
const JSON_DIR = path.join(DIR, 'json')
const KEY_FILE = path.join(DIR, 'answer_key_physics.json')
const TEST = process.argv.includes('--test')

const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const ENDPOINT = 'https://web.examin8.com/v1/practice/attempted/'
const REFERER = 'https://web.examin8.com/i/376735/ailernova/batch/21884/resources/1340/practice-topic-list'
const DELAY_MS = 300
const MAX_RETRIES = 3

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const loadJSON = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d)

async function fetchAnswer(q) {
  const body = JSON.stringify({
    question: q.id, option: q.options[0].id, time_taken: 4, category: q.topic_id,
  })
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'accept': 'application/json',
          'x-csrftoken': CSRF,
          'referer': REFERER,
          'cookie': COOKIE,
        },
        body,
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const j = await res.json()
      return { correctOptionId: j.correct_option, explanation: j.explanation || null }
    } catch (e) {
      if (attempt === MAX_RETRIES) throw e
      await sleep(500 * attempt)
    }
  }
}

async function main() {
  if (!COOKIE || !CSRF) {
    console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF env vars first.')
    process.exit(1)
  }
  const cache = loadJSON(KEY_FILE, {}) // { qid: { correctOptionId, explanation } }
  let files = fs.readdirSync(JSON_DIR).filter((f) => f.endsWith('.json'))
  if (TEST) files = files.slice(0, 1)

  let done = 0, fetched = 0
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(path.join(JSON_DIR, f), 'utf8'))
    const topics = new Map() // topicId -> { topicId, topicName, questions: [] }
    let qs = j.questions || []
    if (TEST) qs = qs.slice(0, 3)

    for (const q of qs) {
      done++
      let ans = cache[q.id]
      if (!ans) {
        ans = await fetchAnswer(q)
        cache[q.id] = ans
        fetched++
        if (fetched % 25 === 0) {
          fs.writeFileSync(KEY_FILE, JSON.stringify(cache))
          console.log(`   …${done} done (${fetched} newly fetched)`)
        }
        await sleep(DELAY_MS)
      }
      const tId = q.topic_id
      if (!topics.has(tId)) topics.set(tId, { topicId: tId, topicName: q.topic_name, questions: [] })
      topics.get(tId).questions.push({
        id: q.id,
        question: q.question,
        options: q.options,
        topicId: tId,
        topicName: q.topic_name,
        correctOptionId: ans.correctOptionId,
        explanation: ans.explanation,
      })
    }

    const out = { chapter_id: j.chapter_id, chapter_name: j.chapter_name, topics: [...topics.values()] }
    const outFile = path.join(DIR, f.replace(/\.json$/, '.by_topic.json'))
    fs.writeFileSync(outFile, JSON.stringify(out, null, 2))
    fs.writeFileSync(KEY_FILE, JSON.stringify(cache))
    console.log(`✓ ${j.chapter_name}: ${qs.length} questions, ${topics.size} subtopics → ${path.basename(outFile)}`)
  }
  console.log(`\nDONE: ${done} questions processed, ${fetched} newly fetched. Cache: ${path.basename(KEY_FILE)}`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
