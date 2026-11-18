'use strict'

// What the AI Teacher is told about the lesson on the student's screen when it
// answers an in-lesson doubt, and which language it replies in. Pure functions —
// agent.service loads the lesson/slides/book and passes them in.
//
// Owner decisions (2026-11-18, docs/superpowers/specs/2026-11-18-ai-teacher-doubt-quality-design.md):
//   1a — replies are in English, except in Hindi/Sanskrit lessons (simple Hindi);
//   2a — the class level wins over the slide (enforced in the prompt, not here).

const SLIDE_CAP = 3000
const BOOK_CAP = 4000

// Language subjects that are taught in Hindi. Matched on the subject name because
// subjects are DB-derived and named inconsistently ("हिंदी (मल्हार)", "Old - हिंदी ए").
const HINDI_SUBJECT = /hindi|हिंदी|हिन्दी|sanskrit|संस्कृत/i

function replyLanguageFor(subject) {
  return subject && HINDI_SUBJECT.test(String(subject)) ? 'hi' : 'en'
}

// \p{M} keeps Devanagari vowel signs (matras) inside the word, so Hindi words
// are matched whole rather than as fragments.
const words = (s) => String(s || '').toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter((w) => w.length >= 3)

// Book passages most relevant to the question, whole passages first, up to `cap`.
function pickBookPassages(topics, query, cap = BOOK_CAP) {
  if (!Array.isArray(topics) || !topics.length) return ''
  const q = new Set(words(query))
  const ranked = topics
    .map((t, i) => {
      const block = `[${t.number} ${t.title}]\n${t.text || ''}`
      const score = words(`${t.title} ${t.text}`).reduce((s, w) => s + (q.has(w) ? 1 : 0), 0)
      return { block, score, i }
    })
    .sort((a, b) => b.score - a.score || a.i - b.i)
  let out = ''
  for (const { block } of ranked) {
    const next = out ? `${out}\n\n${block}` : block
    if (next.length <= cap) { out = next; continue }
    if (!out) out = block.slice(0, cap) // a single oversized passage still contributes
    break
  }
  return out
}

const brief = (s) => (s ? `${s.slideTitle || ''} — ${s.explanation || ''}`.trim() : '')

function buildLessonContext({ lesson, slides, slideIndex, bookText } = {}) {
  if (!lesson) return ''
  const list = Array.isArray(slides) ? slides : []
  const parts = [`LESSON: ${lesson.lessonTitle || lesson.topic || ''}`]
  const i = Number.isInteger(slideIndex) ? slideIndex : -1
  const cur = i >= 0 && i < list.length ? list[i] : null
  if (cur) {
    parts.push(`CURRENT SLIDE (${i + 1} of ${list.length}): ${cur.slideTitle || ''}`)
    if (cur.explanation) parts.push(cur.explanation)
    if (cur.narrationText) parts.push(cur.narrationText)
    const kp = cur.visualData && Array.isArray(cur.visualData.keyPoints) ? cur.visualData.keyPoints : null
    if (kp && kp.length) parts.push(`Key points: ${kp.join('; ')}`)
    if (list[i - 1]) parts.push(`PREVIOUS SLIDE: ${brief(list[i - 1])}`)
    if (list[i + 1]) parts.push(`NEXT SLIDE: ${brief(list[i + 1])}`)
  }
  let ctx = parts.join('\n').slice(0, SLIDE_CAP)
  if (bookText) ctx += `\nTEXTBOOK PASSAGES:\n${bookText}`
  return ctx
}

module.exports = { replyLanguageFor, buildLessonContext, pickBookPassages, SLIDE_CAP, BOOK_CAP }
