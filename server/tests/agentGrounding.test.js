// In-lesson doubts: the agent loads what is on the student's screen, replies in the
// lesson's language (English unless Hindi/Sanskrit), uses the book's class for
// textbook lessons, and never mistakes a real question for "understood".
const test = require('node:test')
const assert = require('node:assert/strict')

const agent = require('../src/services/agent.service')
const lessonService = require('../src/services/lesson.service')
const retriever = require('../src/services/retriever.service')
const { booksService } = require('../src/services/textbooks.service')

const { classifyUnderstanding } = agent
const { prepareTurn } = agent._test

test('classifyUnderstanding: only short replies are understanding signals', () => {
  const cases = {
    haan: 'understood', 'samajh gaya': 'understood', ok: 'understood', 'got it': 'understood',
    'nahi samjha': 'not_understood', 'phir se': 'not_understood', 'not clear': 'not_understood', 'samajh nahi aaya': 'not_understood',
    "I don't understand": 'not_understood', 'i dont get it': 'not_understood', "I didn't get it": 'not_understood',
    "didn't understand": 'not_understood', "I'm confused": 'not_understood', 'kuch samajh nahi aaya': 'not_understood',
    'haan samajh gaya': 'understood', 'yes, clear': 'understood', 'ok got it': 'understood',
    'ok but why is it green?': 'other',
    'right angle kyun hota hai': 'other',
    'why is it not zero?': 'other',
    'no, what about respiration': 'other',
    'ok so what does chlorophyll do then': 'other',
  }
  for (const [text, want] of Object.entries(cases)) assert.equal(classifyUnderstanding(text), want, text)
})

// ── prepareTurn with stubbed loaders ─────────────────────────────────────────
const SLIDES = [
  { slideTitle: 'Intro', explanation: 'What photosynthesis is.' },
  { slideTitle: 'Equation', explanation: '6CO2 + 6H2O → C6H12O6 + 6O2' },
  { slideTitle: 'Chlorophyll', explanation: 'Green pigment.' },
]
function stub(t, { lesson, slides = SLIDES, loadSource } = {}) {
  const orig = {
    byId: lessonService.getLessonById, withSlides: lessonService.getLessonWithSlides,
    retrieve: retriever.retrieve, loadSource: booksService.loadSource,
  }
  const seen = {}
  lessonService.getLessonById = async () => lesson
  lessonService.getLessonWithSlides = async () => (lesson ? { ...lesson, slides } : null)
  retriever.retrieve = async (args) => { seen.retrieveArgs = args; return { chunks: [], grounded: false, topSimilarity: 0 } }
  booksService.loadSource = loadSource || (async () => ({ topics: [{ number: '1.1', title: 'Chlorophyll', text: 'green pigment' }] }))
  t.after(() => {
    lessonService.getLessonById = orig.byId; lessonService.getLessonWithSlides = orig.withSlides
    retriever.retrieve = orig.retrieve; booksService.loadSource = orig.loadSource
  })
  return seen
}

test('prepareTurn: a Hinglish question in a Science lesson → English, with the slide in context', async (t) => {
  stub(t, { lesson: { id: 'L', lessonTitle: 'Photosynthesis', subject: 'Science', gradeLevel: '9' } })
  const r = await prepareTurn({ userId: 'u', question: 'ek example do', lessonId: 'L', slideIndex: 1 })
  assert.equal(r.intentRes.language, 'en')
  assert.match(r.lessonContext, /CURRENT SLIDE \(2 of 3\): Equation/)
})

test('prepareTurn: a Hindi lesson replies in Hindi', async (t) => {
  stub(t, { lesson: { id: 'L', lessonTitle: 'संज्ञा', subject: 'हिंदी', gradeLevel: '9' } })
  const r = await prepareTurn({ userId: 'u', question: 'ek example do', lessonId: 'L', slideIndex: 0 })
  assert.equal(r.intentRes.language, 'hi')
})

test('prepareTurn: a failing book load still answers, without book text', async (t) => {
  stub(t, {
    lesson: { id: 'L', lessonTitle: 'Spectra', subject: 'Physics', gradeLevel: '12', bookChapterId: 5n, bookTopicIds: [] },
    loadSource: async () => { throw new Error('book store down') },
  })
  const r = await prepareTurn({ userId: 'u', question: 'ek example do', lessonId: 'L', slideIndex: 0 })
  assert.ok(r.lessonContext.includes('LESSON: Spectra'))
  assert.doesNotMatch(r.lessonContext, /TEXTBOOK PASSAGES/)
})

test('prepareTurn: textbook lesson → the book\'s class, also for retrieval; book text in context', async (t) => {
  const seen = stub(t, { lesson: { id: 'L', lessonTitle: 'Spectra', subject: 'Physics', gradeLevel: '12', bookChapterId: 5n, bookTopicIds: [] } })
  const r = await prepareTurn({ userId: 'u', question: 'ek example do', lessonId: 'L', slideIndex: 0, gradeLevel: '7' })
  assert.equal(r.gradeLevel, '12')
  assert.equal(seen.retrieveArgs.gradeLevel, '12')
  assert.match(r.lessonContext, /TEXTBOOK PASSAGES:\n\[1\.1 Chlorophyll\]/)
})

test('prepareTurn: a lesson that is not the user\'s → no context, still resolves', async (t) => {
  stub(t, { lesson: null })
  const r = await prepareTurn({ userId: 'u', question: 'ek example do', subject: 'Science', lessonId: 'L', slideIndex: 0 })
  assert.equal(r.lessonContext, '')
  assert.equal(r.intentRes.language, 'en')
})
