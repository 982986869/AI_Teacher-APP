'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Convert the BUNDLED class-12 practice banks in src/data into the normalized
// shape importClass10Questions.js already consumes.
//
// Why this exists: src/data/{physics,chemistry,maths}12Practice hold 19,451
// examin8 practice questions that no screen imports — App.js never reaches
// them, so they are pure APK weight — while the DB has ZERO practice sections
// for class 12 and the app shows "coming soon" on every class-12 chapter.
// The data was already paid for and fetched; it just never made it to the DB.
//
// This writes the SAME file the examin8 fetchers write, so the existing
// importer does the actual writing and there is no second import path to keep
// in step:
//
//   node scripts/examin8/convertBundledPractice.js
//     → data/examin8/class12/normalized/practice.json
//   SECTION=practice CLASS_LEVEL=12 CLASS_DIR=class12 \
//     node scripts/examin8/importClass10Questions.js --live
//
// ANSWERS live in a sibling answer_key.json keyed by question_id, not on the
// question itself (the practice API never returned them inline). chemistry has
// all 7,910; maths has 4,603 of 4,802; physics ships an empty {} and so has
// none — which matches the class-10 practice already in the DB, where
// correct_option is null throughout.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const CLASS_DIR = process.env.CLASS_DIR || 'class12'
const OUT_DIR = path.join(ROOT, 'data', 'examin8', CLASS_DIR, 'normalized')

// Folder → the subject it belongs to. subject_slug must match the slug already
// in `subjects`, or the importer's upsert would create a SECOND subject row and
// the chapters would hang off a subject no screen queries.
const SOURCES = [
  { dir: 'physics12Practice',   subject: 'Physics',     subject_slug: 'physics' },
  { dir: 'chemistry12Practice', subject: 'Chemistry',   subject_slug: 'chemistry' },
  { dir: 'maths12Practice',     subject: 'Mathematics', subject_slug: 'mathematics' },
]

const LETTERS = 'ABCDEFGH'

// Chapter files are ordered by a numeric filename prefix ("03 Current
// Electricity.json"). Read position from it where present so a NEW chapter
// lands in syllabus order; existing chapters keep the position they already
// have (the importer's upsert does not overwrite it).
const positionOf = (file, i) => {
  const m = /^\s*(\d+)/.exec(file)
  return m ? parseInt(m[1], 10) - 1 : i
}

const html = (h, text) => {
  const s = String(h || '').trim()
  if (s) return s
  const t = String(text || '').trim()
  return t ? `<p>${t}</p>` : ''
}

function convertQuestion(q, answerKey) {
  const body = html(q.question_html, q.question_text)
  if (!body) return null

  const src = Array.isArray(q.options) ? q.options : []
  const ans = answerKey[String(q.question_id)] || null

  // Prefer the option ID: it is unambiguous. The letter is only a fallback, and
  // both were verified to agree on every answered question in these banks.
  let correctIdx = -1
  if (ans) {
    if (ans.correctOptionId != null) correctIdx = src.findIndex((o) => o.id === ans.correctOptionId)
    if (correctIdx < 0 && ans.correctAnswer) correctIdx = LETTERS.indexOf(String(ans.correctAnswer).trim().toUpperCase())
  }

  const options = src.map((o, i) => ({
    idx: LETTERS[i] || String(i + 1),
    html: html(o.html, o.text),
    is_correct: i === correctIdx,
  })).filter((o) => o.html)

  return {
    q_number: null,                       // the importer numbers these after dedup
    year: null,
    question_html: body,
    is_mcq: options.length > 0,
    options: options.length ? options : null,
    correct_option: correctIdx >= 0 ? (LETTERS[correctIdx] || null) : null,
    solution_html: ans && ans.explanation ? String(ans.explanation) : null,
    position: 0,
  }
}

function main() {
  const out = []
  const totals = { chapters: 0, questions: 0, answered: 0, explained: 0, skipped: 0 }

  for (const s of SOURCES) {
    const dir = path.join(ROOT, 'src', 'data', s.dir)
    if (!fs.existsSync(dir)) { console.log(`  ! ${s.dir}: not found, skipped`); continue }

    const akPath = path.join(dir, 'answer_key.json')
    let answerKey = {}
    if (fs.existsSync(akPath)) {
      try { answerKey = JSON.parse(fs.readFileSync(akPath, 'utf8')) || {} } catch (_) { answerKey = {} }
    }

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'answer_key.json').sort()
    const chapters = []

    files.forEach((f, i) => {
      let rows
      try { rows = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) } catch (e) {
        console.log(`  ! ${s.dir}/${f}: unreadable (${e.message})`); return
      }
      if (!Array.isArray(rows) || !rows.length) return

      const questions = []
      for (const q of rows) {
        const c = convertQuestion(q, answerKey)
        if (!c) { totals.skipped++; continue }
        if (c.correct_option) totals.answered++
        if (c.solution_html) totals.explained++
        questions.push(c)
      }
      if (!questions.length) return

      chapters.push({
        chapter: rows[0].chapter || f.replace(/\.json$/, '').replace(/^\s*\d+\s*/, ''),
        position: positionOf(f, i),
        questions,
      })
      totals.chapters++
      totals.questions += questions.length
    })

    if (!chapters.length) continue
    out.push({ subject: s.subject, subject_slug: s.subject_slug, chapters })
    console.log(`  ${s.subject.padEnd(12)} ${String(chapters.length).padStart(2)} chapters  ${String(chapters.reduce((n, c) => n + c.questions.length, 0)).padStart(5)} questions`)
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outPath = path.join(OUT_DIR, 'practice.json')
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2))

  console.log(`\n  chapters ${totals.chapters}  questions ${totals.questions}`)
  console.log(`  with answer ${totals.answered}  with explanation ${totals.explained}  skipped ${totals.skipped}`)
  console.log(`\n  -> ${path.relative(ROOT, outPath)}`)
  console.log(`\n  Next: SECTION=practice CLASS_LEVEL=12 CLASS_DIR=${CLASS_DIR} node scripts/examin8/importClass10Questions.js`)
}

main()
