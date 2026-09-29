'use strict'

// Turns a chapter's extracted text into the four kinds of content an admin files
// under sub-sections: notes, quiz, practice questions, and resources.
//
// Everything produced lands as `draft`. A quiz generated from an OCR'd page is
// occasionally wrong, and once it is in front of students it is the platform's
// content, not the model's — so a person approves it first. That is the same
// draft → published flow the activities table already uses.
//
// Generation is per chapter, on demand. A 15-chapter book generated up front is
// 60 model calls for content most students will never open.

const { getAIProvider } = require('../providers')
const books = require('./books.service')

// Enough text to teach from, short enough to stay well inside a context window and
// a sane per-call cost. Chapters run long; the opening pages carry the substance.
const MAX_CHARS = 14000

const SHAPES = {
  notes: `{"summary": "2-3 sentence overview",
  "sections": [{"heading": "...", "points": ["...", "..."]}],
  "keyTerms": [{"term": "...", "meaning": "..."}]}`,
  quiz: `{"questions": [{"q": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..."}]}`,
  practice: `{"questions": [{"q": "...", "answer": "...", "marks": 2, "difficulty": "easy|medium|hard"}]}`,
  resource: `{"items": [{"title": "...", "type": "formula|diagram|definition|example", "body": "..."}]}`,
}

const COUNTS = { notes: '4-7 sections', quiz: 'exactly 8 questions', practice: 'exactly 6 questions', resource: '5-8 items' }

function prompt(kind, { subject, classLevel, chapterTitle, text }) {
  const who = `Class ${classLevel || '?'}${subject ? ' ' + subject : ''} student in India (CBSE)`
  return [
    `You are preparing study material for a ${who}.`,
    `Chapter: "${chapterTitle}"`,
    '',
    'Use ONLY the chapter text below. Do not add facts it does not contain —',
    'if something is not in the text, leave it out rather than filling the gap.',
    '',
    `Produce ${COUNTS[kind]}.`,
    `Reply with JSON only, no prose and no code fence, in exactly this shape:`,
    SHAPES[kind],
    '',
    '--- CHAPTER TEXT ---',
    String(text || '').slice(0, MAX_CHARS),
  ].join('\n')
}

// A model asked for JSON usually returns JSON, and occasionally returns JSON wearing
// a code fence or a sentence of introduction. Recover rather than fail the job.
function parseJson(raw) {
  let s = String(raw || '').trim()
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = s.search(/[[{]/)
  if (start > 0) s = s.slice(start)
  const end = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'))
  if (end > 0 && end < s.length - 1) s = s.slice(0, end + 1)
  return JSON.parse(s)
}

// Reject a shape the app cannot render, before it reaches a review queue and looks
// like something a human should judge.
function validate(kind, data) {
  const bad = (m) => { throw new Error(`Generated ${kind} was unusable: ${m}`) }
  if (!data || typeof data !== 'object') bad('not an object')
  if (kind === 'notes') {
    if (!Array.isArray(data.sections) || !data.sections.length) bad('no sections')
    if (data.sections.some((s) => !s.heading || !Array.isArray(s.points))) bad('a section is missing a heading or points')
  }
  if (kind === 'quiz') {
    if (!Array.isArray(data.questions) || !data.questions.length) bad('no questions')
    data.questions.forEach((q, i) => {
      if (!q.q) bad(`question ${i + 1} has no text`)
      if (!Array.isArray(q.options) || q.options.length < 2) bad(`question ${i + 1} has too few options`)
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) bad(`question ${i + 1} has an answer index outside its options`)
    })
  }
  if (kind === 'practice') {
    if (!Array.isArray(data.questions) || !data.questions.length) bad('no questions')
    if (data.questions.some((q) => !q.q)) bad('a question has no text')
  }
  if (kind === 'resource') {
    if (!Array.isArray(data.items) || !data.items.length) bad('no items')
    if (data.items.some((i) => !i.title || !i.body)) bad('an item is missing a title or body')
  }
  return true
}

async function generate(chapterId, kind) {
  if (!books.KINDS.includes(kind)) throw new Error(`Unknown kind: ${kind}`)
  const ch = await books.chapterText(chapterId)
  if (!ch) throw new Error('Chapter not found')
  if (!ch.text || ch.text.trim().length < 200) throw new Error('This chapter has too little text to generate from.')

  const provider = getAIProvider()
  const raw = await provider.complete({
    prompt: prompt(kind, { subject: ch.subject, classLevel: ch.class_level, chapterTitle: ch.title, text: ch.text }),
    maxTokens: 4000,
  })

  const data = parseJson(typeof raw === 'string' ? raw : (raw && (raw.text || raw.answer)) || '')
  validate(kind, data)

  const id = await books.saveContent(chapterId, kind, {
    title: ch.title,
    payload: data,
    source: 'ai',
    model: (raw && raw.model) || null,
  })
  return { id, kind, chapterId }
}

module.exports = { generate, parseJson, validate, MAX_CHARS }
