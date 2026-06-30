'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Backfill the Class 12 Mathematics Practice answer key (src/data/maths12Practice/
// answer_key.json) FOR FREE from the other Class 12 Maths datasets that already
// carry correct answers — Online Tests, PYQ, Important Questions, Mock Tests.
// They share the same examin8 question_id space, so any practice question whose
// id also appears in those sets gets its answer with zero network calls.
//
// Writes the SAME shape maths12Practice.js reads, keyed by question_id:
//   { "<id>": { correctAnswer, correctOptionId, explanation } }
// correctAnswer (A/B/C…) is computed from the PRACTICE file's own option order so
// it stays correct regardless of how the source ordered its options.
//
// Re-runnable & merge-safe: existing key entries are preserved; only missing ids
// are added. Run this BEFORE fetchMaths12Answers.js so the network fetch only has
// to cover the remainder.
//
//   node scripts/backfillMaths12Answers.js
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'src', 'data')
const PRACTICE_DIR = path.join(DATA, 'maths12Practice')
const KEY_FILE = path.join(PRACTICE_DIR, 'answer_key.json')
const LETTERS = 'ABCDEFGHIJ'.split('')

const loadJSON = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d)
const trim = (s) => (s == null ? '' : String(s)).trim()

// Pull the correct option id (+ explanation) out of a source question that has
// answers: prefer an option flagged is_correct, else correct_option_ids[0].
function answerOf(q) {
  const opts = Array.isArray(q.options) ? q.options : []
  let cid = null
  const flagged = opts.find((o) => o.is_correct)
  if (flagged) cid = flagged.id
  else if (Array.isArray(q.correct_option_ids) && q.correct_option_ids.length) cid = q.correct_option_ids[0]
  if (cid == null) return null
  const explanation = trim(q.explanation) || trim(q.solution_html) || trim(q.solution) || ''
  return { correctOptionId: cid, explanation }
}

// Walk a data dir of JSON files, extracting answers via getQs(fileData) → [questions].
function collectAnswers(dir, getQs, into) {
  if (!fs.existsSync(dir)) return
  fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json') && f !== 'answer_key.json')
    .forEach((f) => {
      let data
      try { data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) } catch (_) { return }
      getQs(data).forEach((q) => {
        if (q.question_id == null || into[q.question_id]) return
        const a = answerOf(q)
        if (a) into[q.question_id] = a
      })
    })
}

function main() {
  // 1. Build {qid: {correctOptionId, explanation}} from every answered local source.
  const src = {}
  collectAnswers(path.join(DATA, 'maths12OnlineTests'),
    (d) => [].concat(...((d.tests || []).map((t) => t.questions || []))), src)
  collectAnswers(path.join(DATA, 'maths12Pyq'), (d) => (Array.isArray(d) ? d : []), src)
  collectAnswers(path.join(DATA, 'maths12Important'), (d) => (Array.isArray(d) ? d : []), src)
  collectAnswers(path.join(DATA, 'maths12MockTests'), (d) => (d.questions || []), src)
  console.log(`Collected ${Object.keys(src).length} answers from local Maths sources.`)

  // 2. Walk the practice banks; for any qid we have an answer for, write a key entry
  //    with the letter computed from the PRACTICE file's option ordering.
  const key = loadJSON(KEY_FILE, {})
  const before = Object.keys(key).length
  let total = 0, added = 0, withExpl = 0
  fs.readdirSync(PRACTICE_DIR)
    .filter((f) => /^ch\d+\.json$/.test(f)).sort()
    .forEach((f) => {
      JSON.parse(fs.readFileSync(path.join(PRACTICE_DIR, f), 'utf8')).forEach((q) => {
        total++
        const id = String(q.question_id)
        if (key[id]) return
        const a = src[q.question_id]
        if (!a) return
        const opts = Array.isArray(q.options) ? q.options : []
        const idx = opts.findIndex((o) => String(o.id) === String(a.correctOptionId))
        if (idx < 0) return // answer's option id isn't in this question's options — skip
        key[id] = {
          correctAnswer: LETTERS[idx],
          correctOptionId: a.correctOptionId,
          explanation: a.explanation || '',
        }
        added++
        if (a.explanation) withExpl++
      })
    })

  fs.writeFileSync(KEY_FILE, JSON.stringify(key))
  console.log(`\nPractice questions: ${total}`)
  console.log(`Answer key: ${before} → ${Object.keys(key).length} (+${added} backfilled, ${withExpl} with explanation)`)
  console.log(`Remaining without answers: ${total - Object.keys(key).length} (run fetchMaths12Answers.js to cover these)`)
}

main()
