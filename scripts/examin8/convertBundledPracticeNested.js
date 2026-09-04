'use strict'

// Convert the BUNDLED class 7/8/9 practice banks in src/data into the shape
// importClass10Questions.js consumes.
//
// Same job as convertBundledPractice.js, different source shape. The class-12
// folders are a flat array of questions per chapter file; these are one file per
// SUBJECT, with questions nested two levels down:
//
//   { name, slug, chapters: [ { name, position,
//       subtopics: [ { topicId, name, questions: [...] } ] } ] }
//
// The subtopic level is flattened away: the app has no notion of a topic inside a
// chapter's practice tab, and keeping it would mean inventing a section type
// nothing renders. Question order within a chapter follows subtopic order.
//
//   CLASS=8 node scripts/examin8/convertBundledPracticeNested.js
//   SECTION=practice CLASS_LEVEL=8 CLASS_DIR=class8 \
//     node scripts/examin8/importClass10Questions.js --live
//
// Answers ride on the question itself here (correctOptionId + explanation), not
// in a sibling answer_key.json — so no join is needed and coverage is near total.

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const CLASS = parseInt(process.env.CLASS, 10) || 8
const SRC = path.join(ROOT, 'src', 'data', `class${CLASS}Practice`)
const OUT_DIR = path.join(ROOT, 'data', 'examin8', `class${CLASS}`, 'normalized')

const LETTERS = 'ABCDEFGH'
const html = (h, text) => {
  const s = String(h || '').trim()
  if (s) return s
  const t = String(text || '').trim()
  return t ? `<p>${t}</p>` : ''
}

function convertQuestion(q) {
  const body = html(q.question, q.questionText)
  if (!body) return null

  const src = Array.isArray(q.options) ? q.options : []
  const correctIdx = q.correctOptionId != null
    ? src.findIndex((o) => o.id === q.correctOptionId)
    : -1

  const options = src.map((o, i) => ({
    idx: LETTERS[i] || String(i + 1),
    html: html(o.option, o.text),
    is_correct: i === correctIdx,
  })).filter((o) => o.html)

  return {
    q_number: null,                      // the importer numbers these after dedup
    year: null,
    question_html: body,
    is_mcq: options.length > 0,
    options: options.length ? options : null,
    correct_option: correctIdx >= 0 ? (LETTERS[correctIdx] || null) : null,
    solution_html: q.explanation ? String(q.explanation) : null,
    position: 0,
  }
}

function main() {
  if (!fs.existsSync(SRC)) { console.error(`\n  no such folder: ${path.relative(ROOT, SRC)}\n`); process.exit(1) }

  const out = []
  const totals = { subjects: 0, chapters: 0, questions: 0, answered: 0, explained: 0, skipped: 0 }

  for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith('.json')).sort()) {
    let j
    try { j = JSON.parse(fs.readFileSync(path.join(SRC, file), 'utf8')) } catch (e) {
      console.log(`  ! ${file}: unreadable (${e.message})`); continue
    }
    if (!j || !Array.isArray(j.chapters) || !j.chapters.length) continue

    const chapters = []
    for (const c of j.chapters) {
      const questions = []
      for (const st of (c.subtopics || [])) {
        for (const q of (st.questions || [])) {
          const conv = convertQuestion(q)
          if (!conv) { totals.skipped++; continue }
          if (conv.correct_option) totals.answered++
          if (conv.solution_html) totals.explained++
          questions.push(conv)
        }
      }
      if (!questions.length) continue
      chapters.push({ chapter: c.name, position: c.position || 0, questions })
      totals.chapters++
      totals.questions += questions.length
    }
    if (!chapters.length) continue

    out.push({ subject: j.name, subject_slug: j.slug, chapters })
    totals.subjects++
    console.log(`  ${String(j.name).padEnd(36)} ${String(chapters.length).padStart(3)} ch  ${String(chapters.reduce((n, c) => n + c.questions.length, 0)).padStart(6)} q`)
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outPath = path.join(OUT_DIR, 'practice.json')
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2))

  console.log(`\n  class ${CLASS}: ${totals.subjects} subjects  ${totals.chapters} chapters  ${totals.questions} questions`)
  console.log(`  with answer ${totals.answered}  with explanation ${totals.explained}  skipped ${totals.skipped}`)
  console.log(`\n  -> ${path.relative(ROOT, outPath)}`)
  console.log(`\n  Next: SECTION=practice CLASS_LEVEL=${CLASS} CLASS_DIR=class${CLASS} node scripts/examin8/importClass10Questions.js\n`)
}

main()
