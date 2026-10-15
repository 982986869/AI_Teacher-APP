'use strict'
// Turns a verified outline (where each section starts) plus the raw page lines into
// topic texts. Pure: no I/O, no model calls — so it is unit-tested and outline.js is
// only glue.

const MIN_TOPIC_CHARS = 200
const MIN_INTRO_CHARS = 400
// In-text question blocks: Maths "EXERCISE 1.1", Science's "QUESTIONS" box (extract.py
// collapses its vertical letters into this one word). Cut up to the next boundary.
const EXERCISE_RE = /^(EXERCISE\s+\d+\.\d+|Q\s*U\s*E\s*S\s*T\s*I\s*O\s*N\s*S)\s*$/i

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// Flatten pages to one array of { page, line, text } so positions compare as integers.
function flatten(raw) {
  const flat = []
  for (const p of raw.pages) p.lines.forEach((ln, li) => flat.push({ page: p.index, line: li, text: ln.text }))
  return flat
}
const indexOf = (flat, pos) => flat.findIndex((x) => x.page === pos.page && x.line === pos.line)

function sliceChapter(raw, outline) {
  const flat = flatten(raw)
  const topics = [...outline.topics].sort((a, b) => a.page - b.page || a.line - b.line)
  const subs = Array.isArray(outline.subsections) ? outline.subsections : []
  let endIdx = outline.bodyEnd ? indexOf(flat, outline.bodyEnd) : -1
  // A chapter with no "Summary" block (the 2026-27 books end on a "Conclusion"
  // section) tempts the verifier to put bodyEnd at the last heading, which would
  // empty that section. The body cannot end before its last section starts.
  const lastStart = topics.length ? indexOf(flat, topics[topics.length - 1]) : -1
  if (endIdx >= 0 && endIdx <= lastStart) endIdx = -1
  const end = endIdx >= 0 ? endIdx : flat.length
  const boundaries = [...topics, ...subs].map((t) => indexOf(flat, t)).filter((i) => i >= 0)
  boundaries.push(end)
  const nextBoundaryAfter = (i) => Math.min(...boundaries.filter((b) => b > i), end)

  // Lines [from, to) as topic text, with in-text question blocks cut to the next boundary.
  const sliceRange = (from, to, keep = () => true) => {
    const lines = []
    for (let i = from; i < to; i++) {
      const text = flat[i].text
      if (EXERCISE_RE.test(text)) { i = nextBoundaryAfter(i) - 1; continue } // skip to the boundary
      if (keep(text)) lines.push(text)
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  }
  const topicOut = (number, title, text) => ({ number, title, slug: slugify(`${number} ${title}`), text, charCount: text.length })

  const out = []

  // NCERT Science opens every chapter with un-numbered text (and Activities) before
  // "N.1"; Maths puts an "N.1 Introduction" there instead. Keep the un-numbered opening
  // as an "N.0 Introduction" topic when it is real text, not just the title lines.
  if (topics.length) {
    const firstStart = indexOf(flat, topics[0])
    if (firstStart > 0) {
      const title = String(raw.chapterTitle || '').toLowerCase()
      const isTitleLine = (text) => /^chapter\s*\d*$/i.test(text.trim()) || (title && title.includes(text.trim().toLowerCase()))
      const intro = sliceRange(0, Math.min(firstStart, end), (text) => !isTitleLine(text))
      if (intro.length >= MIN_INTRO_CHARS) out.push(topicOut(`${raw.chapterNumber}.0`, 'Introduction', intro))
    }
  }

  // A chapter with no numbered sections at all (the new books open with a short
  // narrative "Exploration" chapter) is one topic: the whole body under the chapter title.
  if (!topics.length) {
    const title = String(raw.chapterTitle || '').toLowerCase()
    const isTitleLine = (text) => /^chapter\s*\d*$/i.test(text.trim()) || /^\d{1,2}$/.test(text.trim()) || (title && title.includes(text.trim().toLowerCase()))
    out.push(topicOut(`${raw.chapterNumber}.1`, raw.chapterTitle, sliceRange(0, end, (text) => !isTitleLine(text))))
  }

  topics.forEach((t, ti) => {
    const start = indexOf(flat, t)
    if (start < 0) throw new Error(`topic ${t.number} "${t.title}": start line not found at page ${t.page} line ${t.line}`)
    const next = topics[ti + 1] ? indexOf(flat, topics[ti + 1]) : end
    const stop = Math.min(next, end)
    out.push(topicOut(t.number, t.title, sliceRange(start + 1, stop)))
  })

  const kept = out.filter((t) => {
    if (/^introduction$/i.test(t.title) && t.charCount < MIN_INTRO_CHARS) return false
    if (t.charCount < MIN_TOPIC_CHARS) throw new Error(`topic ${t.number} "${t.title}" has only ${t.charCount} chars (< ${MIN_TOPIC_CHARS}) — extraction or outline is wrong`)
    return true
  })
  if (!kept.length) throw new Error('no topics survived slicing')

  const title = outline.title || raw.chapterTitle
  return { chapterNumber: raw.chapterNumber, title, slug: slugify(title), topics: kept }
}

module.exports = { sliceChapter, slugify, MIN_TOPIC_CHARS, MIN_INTRO_CHARS }
