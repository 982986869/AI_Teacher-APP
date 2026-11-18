// What the AI Teacher is told about the lesson on screen, and which language it
// replies in (owner 2026-11-18: English, except Hindi/Sanskrit lessons).
const test = require('node:test')
const assert = require('node:assert/strict')

const { replyLanguageFor, buildLessonContext, pickBookPassages } = require('../src/services/lessonContext')

const lesson = { lessonTitle: 'Photosynthesis', topic: 'Photosynthesis' }
const slides = [
  { slideTitle: 'What Is Photosynthesis?', explanation: 'Plants make food from light.', narrationText: 'Plants use light.' },
  { slideTitle: 'The Equation', explanation: '6CO2 + 6H2O → C6H12O6 + 6O2', narrationText: 'Six carbon dioxide…', visualData: { keyPoints: ['6 CO2 in', '6 O2 out'] } },
  { slideTitle: 'Chlorophyll', explanation: 'Green pigment that absorbs light.', narrationText: 'Chlorophyll…' },
]

test('replyLanguageFor: English unless a Hindi/Sanskrit subject', () => {
  assert.equal(replyLanguageFor('Science'), 'en')
  assert.equal(replyLanguageFor('हिंदी (मल्हार)'), 'hi')
  assert.equal(replyLanguageFor('Old - हिंदी ए'), 'hi')
  assert.equal(replyLanguageFor('Sanskrit'), 'hi')
  assert.equal(replyLanguageFor('संस्कृत (शारदा)'), 'hi')
  assert.equal(replyLanguageFor('HINDI'), 'hi')
  assert.equal(replyLanguageFor(undefined), 'en')
  assert.equal(replyLanguageFor(''), 'en')
})

test('buildLessonContext: current slide in full, neighbours in brief', () => {
  const ctx = buildLessonContext({ lesson, slides, slideIndex: 1 })
  assert.match(ctx, /LESSON: Photosynthesis/)
  assert.match(ctx, /CURRENT SLIDE \(2 of 3\): The Equation/)
  assert.match(ctx, /6CO2 \+ 6H2O/)
  assert.match(ctx, /Key points: 6 CO2 in; 6 O2 out/)
  assert.match(ctx, /PREVIOUS SLIDE: What Is Photosynthesis\?/)
  assert.match(ctx, /NEXT SLIDE: Chlorophyll/)
})

test('buildLessonContext: no slide lines when the index is out of range or slides are empty', () => {
  for (const args of [{ slides, slideIndex: 99 }, { slides: [], slideIndex: 0 }, { slides: undefined, slideIndex: null }]) {
    const ctx = buildLessonContext({ lesson, ...args })
    assert.match(ctx, /LESSON: Photosynthesis/)
    assert.doesNotMatch(ctx, /CURRENT SLIDE/)
  }
})

test('buildLessonContext: slide part capped at 3000 chars', () => {
  const huge = [{ slideTitle: 'Long', explanation: 'x', narrationText: 'y'.repeat(10000) }]
  const ctx = buildLessonContext({ lesson, slides: huge, slideIndex: 0 })
  assert.ok(ctx.length < 3200, `got ${ctx.length}`)
})

test('buildLessonContext: no lesson → empty string', () => {
  assert.equal(buildLessonContext({ lesson: null, slides, slideIndex: 0 }), '')
})

test('buildLessonContext: book text appended under TEXTBOOK PASSAGES', () => {
  const ctx = buildLessonContext({ lesson, slides, slideIndex: 0, bookText: '[1.1 Chlorophyll]\ngreen pigment' })
  assert.match(ctx, /TEXTBOOK PASSAGES:\n\[1\.1 Chlorophyll\]/)
})

test('pickBookPassages: most relevant passage first, within the cap', () => {
  const topics = [
    { number: '1.2', title: 'Respiration', text: 'cells release energy from glucose using oxygen '.repeat(20) },
    { number: '1.1', title: 'Chlorophyll', text: 'chlorophyll is a green pigment that absorbs red and blue light' },
  ]
  const out = pickBookPassages(topics, 'why is chlorophyll green', 4000)
  assert.ok(out.startsWith('[1.1 Chlorophyll]'), out.slice(0, 40))
  assert.ok(pickBookPassages(topics, 'chlorophyll', 120).length <= 120)
  assert.equal(pickBookPassages([], 'x'), '')
})
