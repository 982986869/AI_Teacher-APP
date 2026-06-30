'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Apply hand-filled answers (Fix 3) for the Class 12 Maths practice questions
// examin8 couldn't serve (HTTP 500). Reads scripts/maths12_missing_answers.csv
// — the worksheet of 199 questions — and for every row with a correct_letter
// (A/B/C/D) filled in, writes that answer into src/data/maths12Practice/
// answer_key.json in the SAME shape the module + DB importer read:
//   { "<question_id>": { correctAnswer, correctOptionId, explanation } }
//
// The correct option id is resolved from the question's own option order in the
// practice bank, so the letter maps to the right stable id. Re-runnable &
// merge-safe: existing answers are preserved; only newly-filled rows are added.
//
// After running this:  node scripts/importMaths12Practice.js --live   (push to DB)
//
//   node scripts/applyMaths12CsvAnswers.js
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const CSV = path.join(ROOT, 'scripts', 'maths12_missing_answers.csv')
const DIR = path.join(ROOT, 'src', 'data', 'maths12Practice')
const KEY_FILE = path.join(DIR, 'answer_key.json')
const LETTERS = 'ABCDEFGHIJ'.split('')

// Minimal RFC-4180 CSV parser (handles quoted fields, escaped quotes, newlines).
function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false }
      else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

// Build question_id -> options[] from the practice bank, to resolve letter -> id.
function buildOptionMap() {
  const map = {}
  fs.readdirSync(DIR).filter((f) => /^ch\d+\.json$/.test(f)).forEach((f) => {
    JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')).forEach((q) => {
      map[String(q.question_id)] = Array.isArray(q.options) ? q.options : []
    })
  })
  return map
}

function main() {
  if (!fs.existsSync(CSV)) { console.error('Worksheet not found:', CSV); process.exit(1) }
  const rows = parseCSV(fs.readFileSync(CSV, 'utf8'))
  if (!rows.length) { console.error('Empty CSV'); process.exit(1) }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const idCol = header.findIndex((h) => h.startsWith('question_id'))
  const letterCol = header.findIndex((h) => h.startsWith('correct_letter'))
  if (idCol < 0 || letterCol < 0) {
    console.error('CSV must have question_id and correct_letter columns. Found:', header.join(', '))
    process.exit(1)
  }

  const opts = buildOptionMap()
  const key = fs.existsSync(KEY_FILE) ? JSON.parse(fs.readFileSync(KEY_FILE, 'utf8')) : {}
  let filled = 0, added = 0, bad = 0, blank = 0

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || !r[idCol]) continue
    const id = String(r[idCol]).trim()
    const letter = String(r[letterCol] || '').trim().toUpperCase()
    if (!letter) { blank++; continue }
    filled++
    const idx = LETTERS.indexOf(letter)
    const o = opts[id]
    if (idx < 0 || !o || idx >= o.length) { bad++; console.warn(`  ! row ${i}: qid ${id} letter "${letter}" invalid (has ${o ? o.length : 0} options)`); continue }
    if (key[id]) continue // already answered (don't overwrite a fetched answer)
    key[id] = {
      correctAnswer: letter,
      correctOptionId: o[idx].id != null ? o[idx].id : null,
      explanation: key[id]?.explanation || '',
    }
    added++
  }

  fs.writeFileSync(KEY_FILE, JSON.stringify(key))
  console.log(`Rows filled in CSV: ${filled} | blank: ${blank}`)
  console.log(`Answer key: +${added} added (${bad} rejected). Now ${Object.keys(key).length} total.`)
  console.log(`Next: node scripts/importMaths12Practice.js --live   (push to DB)`)
}

main()
