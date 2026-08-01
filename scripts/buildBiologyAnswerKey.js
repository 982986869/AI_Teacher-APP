'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Build src/data/biology_questions/answer_key_biology.json — OFFLINE.
//
// The 20 Biology chapter banks ship 7,125 questions with correct_option_id,
// correct_letter and explanation ALL null, and the key file they fall back to is
// `{}`. So biologyBank.normQ() leaves correctAnswer null for every question and the
// review screen renders "Not graded" — the bank is live in OnlineTestsScreen but
// cannot actually grade anything.
//
// The answers already exist locally: src/data/biology_practice/*.by_topic.json (the
// gitignored practice export) carries correctOptionId + explanation for the same
// question ids. This script joins the two — no network, no credentials, and none of
// the ~7,000 account-mutating POSTs that build-answer-key-biology.js would make
// against /v1/practice/attempted/.
//
// The correct LETTER is resolved against the BANK's own option order, never the
// practice file's, because that is the order the app renders and grades against.
//
//   node scripts/buildBiologyAnswerKey.js            # write the key
//   node scripts/buildBiologyAnswerKey.js --dry      # report only
//   PRACTICE_DIR=../other/src/data/biology_practice node scripts/buildBiologyAnswerKey.js
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BANK_DIR = path.join(ROOT, 'src', 'data', 'biology_questions')
const PRACTICE_DIR = process.env.PRACTICE_DIR
  ? path.resolve(process.env.PRACTICE_DIR)
  : path.join(ROOT, 'src', 'data', 'biology_practice')
const OUT = path.join(BANK_DIR, 'answer_key_biology.json')
const DRY = process.argv.includes('--dry')

const LETTERS = 'ABCDEFGHIJ'.split('')
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

// practice export → questionId → { correctOptionId, explanation }
function loadPracticeAnswers() {
  if (!fs.existsSync(PRACTICE_DIR)) {
    console.error(`Practice export not found: ${PRACTICE_DIR}`)
    console.error('It is gitignored — point PRACTICE_DIR at the checkout that has it.')
    process.exit(1)
  }
  const byId = new Map()
  for (const f of fs.readdirSync(PRACTICE_DIR).filter((x) => x.endsWith('.json'))) {
    const doc = readJson(path.join(PRACTICE_DIR, f))
    for (const topic of (doc.topics || [])) {
      for (const q of (topic.questions || [])) {
        if (q.correctOptionId == null) continue
        byId.set(String(q.id), { correctOptionId: q.correctOptionId, explanation: q.explanation || '' })
      }
    }
  }
  return byId
}

function main() {
  const answers = loadPracticeAnswers()
  const chapterFiles = fs.readdirSync(BANK_DIR).filter((f) => /^\d+_/.test(f) && !f.includes('by_topic'))

  const key = {}
  let total = 0, matched = 0, withExplanation = 0
  const noAnswer = [], optionMismatch = []

  for (const f of chapterFiles) {
    const doc = readJson(path.join(BANK_DIR, f))
    for (const q of (doc.questions || [])) {
      total++
      const ans = answers.get(String(q.id))
      if (!ans) { noAnswer.push(q.id); continue }

      // Resolve the letter against the bank's option order — biologyBank.normQ()
      // keys options by their position in THIS array.
      const idx = (q.options || []).findIndex((o) => String(o.id) === String(ans.correctOptionId))
      if (idx < 0) { optionMismatch.push(q.id); continue }

      key[q.id] = {
        correctAnswer: LETTERS[idx],
        correctOptionId: ans.correctOptionId,
        explanation: ans.explanation,
      }
      matched++
      if (ans.explanation) withExplanation++
    }
  }

  console.log(`chapters            : ${chapterFiles.length}`)
  console.log(`bank questions      : ${total}`)
  console.log(`answers resolved    : ${matched} (${(matched * 100 / total).toFixed(1)}%)`)
  console.log(`  with explanation  : ${withExplanation}`)
  console.log(`not in practice     : ${noAnswer.length}${noAnswer.length ? '  → ' + noAnswer.slice(0, 10).join(', ') : ''}`)
  console.log(`option id mismatch  : ${optionMismatch.length}${optionMismatch.length ? '  → ' + optionMismatch.slice(0, 10).join(', ') : ''}`)

  // Unresolved questions are simply absent from the key: biologyBank leaves
  // correctAnswer null and the review screen shows "Not graded". Never guess.
  if (DRY) { console.log('\n[DRY] nothing written.'); return }
  fs.writeFileSync(OUT, JSON.stringify(key))
  console.log(`\n✓ wrote ${path.relative(ROOT, OUT)}  (${(fs.statSync(OUT).size / 1048576).toFixed(2)} MB)`)
}

main()
