'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Fetch correct answers for the Class 12 Physics "Practice Questions" via the
// examin8 /v1/practice/attempted/ endpoint — same method as the Class 11 tooling
// (scripts/fetchPhysicsAnswers.js). Writes a single answer key keyed by
// question_id in the SAME shape as src/data/physics_questions/answer_key.json:
//   { "<question_id>": { correctAnswer, correctOptionId, explanation } }
// which src/data/physics12Practice.js reads to fill in answers + enable scoring.
//
// ⚠️ Each question = one submitted attempt on the examin8 account.
// Resumable: the key file is updated incrementally; re-running skips cached ids.
//
// Creds via env (NOT hardcoded):
//   EXAMIN8_COOKIE='mcsrftoken=...; msessionid=...'
//   EXAMIN8_CSRF='<mcsrftoken value>'
//
//   node scripts/fetchPhysics12Answers.js          # full run (6,739 Qs)
//   node scripts/fetchPhysics12Answers.js --test    # one chapter, first 3 Qs
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DIR = path.join(ROOT, 'src', 'data', 'physics12Practice')
const KEY_FILE = path.join(DIR, 'answer_key.json')
const TEST = process.argv.includes('--test')

const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const ENDPOINT = 'https://web.examin8.com/v1/practice/attempted/'
const REFERER = 'https://web.examin8.com/i/376735/ailernova/batch/21883/resources/1251/practice-topic-list'
const DELAY_MS = 300
const MAX_RETRIES = 3
const LETTERS = 'ABCDEFGHIJ'.split('')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const loadJSON = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d)

async function fetchAnswer(q) {
  const body = JSON.stringify({
    question: q.question_id,
    option: q.options[0].id,
    time_taken: 4,
    category: q.topic_id,
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
      return await res.json() // { correct_option, explanation, ... }
    } catch (e) {
      if (attempt === MAX_RETRIES) throw e
      await sleep(500 * attempt)
    }
  }
}

// Letter (A/B/C…) of the correct option, from its position in the option list.
function letterOf(options, correctOptionId) {
  const idx = options.findIndex((o) => String(o.id) === String(correctOptionId))
  return idx >= 0 ? LETTERS[idx] : null
}

async function main() {
  if (!COOKIE || !CSRF) {
    console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF env vars first.')
    process.exit(1)
  }
  const key = loadJSON(KEY_FILE, {}) // { qid: { correctAnswer, correctOptionId, explanation } }
  let files = fs.readdirSync(DIR).filter((f) => /^\d+ .*\.json$/.test(f)).sort()
  if (TEST) files = files.slice(0, 1)

  let done = 0, fetched = 0, missing = 0
  for (const f of files) {
    let qs = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))
    if (TEST) qs = qs.slice(0, 3)

    for (const q of qs) {
      done++
      if (key[String(q.question_id)]) continue // already have it
      let j
      try { j = await fetchAnswer(q) } catch (e) { missing++; continue }
      const correctOptionId = j && (j.correct_option != null ? j.correct_option : null)
      key[String(q.question_id)] = {
        correctAnswer: correctOptionId != null ? letterOf(q.options, correctOptionId) : null,
        correctOptionId,
        explanation: (j && j.explanation) || '',
      }
      fetched++
      if (fetched % 25 === 0) {
        fs.writeFileSync(KEY_FILE, JSON.stringify(key))
        console.log(`   …${done} done (${fetched} newly fetched, ${missing} failed)`)
      }
      await sleep(DELAY_MS)
    }
    fs.writeFileSync(KEY_FILE, JSON.stringify(key))
    console.log(`✓ ${f.replace(/\.json$/, '')}: ${qs.length} Qs (cache now ${Object.keys(key).length})`)
  }
  fs.writeFileSync(KEY_FILE, JSON.stringify(key))
  console.log(`\nDONE: ${done} processed, ${fetched} newly fetched, ${missing} failed. Key: ${path.basename(KEY_FILE)} (${Object.keys(key).length} entries)`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
