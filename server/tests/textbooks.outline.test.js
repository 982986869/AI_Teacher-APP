'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { sliceChapter, slugify, MIN_TOPIC_CHARS } = require('../scripts/textbooks/outlineLib')

const L = (text) => ({ text, size: 10, bold: false })
const fill = (n, tag) => Array.from({ length: n }, (_, i) => L(`${tag} sentence number ${i} with enough words to count.`))

function raw() {
  return {
    code: 'jemh1', chapterNumber: 7, chapterTitle: 'Binomial Theorem', pageCount: 2,
    pages: [
      { index: 0, lines: [L('7.1 Introduction'), ...fill(12, 'intro'), L('7.2 Binomial Theorem'), ...fill(10, 'bt'),
        L('EXERCISE 7.1'), L('1. Expand (x+1)^2'), L('2. Expand (2x-3)^3')] },
      { index: 1, lines: [L('7.2.1 Special cases'), ...fill(8, 'special'), L('7.3 General Term'), ...fill(9, 'gen'),
        L('Summary'), L('1. The binomial theorem states ...')] },
    ],
  }
}

const outline = () => ({
  title: 'Binomial Theorem',
  topics: [
    { number: '7.1', title: 'Introduction', page: 0, line: 0 },
    { number: '7.2', title: 'Binomial Theorem', page: 0, line: 13 },
    { number: '7.3', title: 'General Term', page: 1, line: 9 },
  ],
  subsections: [{ number: '7.2.1', title: 'Special cases', page: 1, line: 0 }],
  bodyEnd: { page: 1, line: 19 },
})

test('slugify', () => {
  assert.equal(slugify('7.3 General and Middle Terms'), '7-3-general-and-middle-terms')
})

test('topics are sliced between consecutive starts and stop at bodyEnd', () => {
  const ch = sliceChapter(raw(), outline())
  assert.equal(ch.topics.length, 3)
  assert.ok(ch.topics[0].text.includes('intro sentence number 11'))
  assert.ok(!ch.topics[0].text.includes('bt sentence'))
  assert.ok(ch.topics[2].text.includes('gen sentence number 8'))
  assert.ok(!ch.topics[2].text.includes('The binomial theorem states'), 'summary excluded')
})

test('a subsection folds into its parent topic', () => {
  const ch = sliceChapter(raw(), outline())
  assert.ok(ch.topics[1].text.includes('7.2.1 Special cases'))
  assert.ok(ch.topics[1].text.includes('special sentence number 7'))
})

test('an in-chapter EXERCISE block is cut up to the next boundary, even a subsection', () => {
  const ch = sliceChapter(raw(), outline())
  assert.ok(!ch.topics[1].text.includes('Expand (x+1)^2'))
  assert.ok(ch.topics[1].text.includes('special sentence number 0'), 'text after the cut survives')
})

test('a QUESTIONS box is cut the same way', () => {
  const r = raw()
  r.pages[0].lines[23] = L('QUESTIONS')
  const ch = sliceChapter(r, outline())
  assert.ok(!ch.topics[1].text.includes('Expand (x+1)^2'))
})

test('the heading line itself is not repeated inside the topic text', () => {
  const ch = sliceChapter(raw(), outline())
  assert.ok(!ch.topics[0].text.startsWith('7.1 Introduction'))
})

test('a short later section folds into the topic before it (a tiny closing aside is not its own topic)', () => {
  const r = raw()
  for (let i = 11; i < 19; i++) r.pages[1].lines[i].text = '' // gut 7.3 down to one line (positions kept)
  const ch = sliceChapter(r, outline())
  assert.deepEqual(ch.topics.map((t) => t.number), ['7.1', '7.2'])
  assert.ok(ch.topics[1].text.includes('General Term'), 'the short section\'s heading lives on inside 7.2')
  assert.ok(ch.topics[1].text.includes('gen sentence number 0'), 'and so does its text')
})

test('a short FIRST section still makes the chapter refuse (the outline is wrong, not the book)', () => {
  const r = raw()
  for (let i = 2; i < 13; i++) r.pages[0].lines[i].text = '' // gut 7.1 (positions kept)
  const o = outline()
  o.topics[0].title = 'Overview' // a short "Introduction" is dropped on purpose; any other short first section is an error
  assert.throws(() => sliceChapter(r, o), new RegExp(`7\\.1 .*${MIN_TOPIC_CHARS}`))
})

test('a short Introduction is dropped instead of refusing', () => {
  const r = raw()
  r.pages[0].lines.splice(1, 12, L('Short intro.'))
  const o = outline(); o.topics[1].line = 2
  const ch = sliceChapter(r, o)
  assert.deepEqual(ch.topics.map((t) => t.number), ['7.2', '7.3'])
})

test('charCount matches text length and slugs are prefixed with the number', () => {
  const ch = sliceChapter(raw(), outline())
  assert.equal(ch.topics[0].charCount, ch.topics[0].text.length)
  assert.equal(ch.topics[2].slug, '7-3-general-term')
  assert.equal(ch.slug, 'binomial-theorem')
})

test('a topic whose start line is missing is an error naming the topic', () => {
  const o = outline(); o.topics[2].line = 99
  assert.throws(() => sliceChapter(raw(), o), /7\.3 .*start line not found/)
})

// Review finding: NCERT Science chapters open with un-numbered text (and Activities)
// before "N.1"; that text must not be dropped.
test('un-numbered text before the first section becomes an "N.0 Introduction" topic', () => {
  const r = raw()
  r.pages[0].lines.unshift(L('Chapter opening'), ...fill(10, 'opening'))
  const o = outline()
  o.topics = o.topics.map((t) => (t.page === 0 ? { ...t, line: t.line + 11 } : t))
  o.subsections = o.subsections.map((t) => (t.page === 0 ? { ...t, line: t.line + 11 } : t))
  const ch = sliceChapter(r, o)
  assert.deepEqual(ch.topics.map((t) => t.number), ['7.0', '7.1', '7.2', '7.3'])
  assert.equal(ch.topics[0].title, 'Introduction')
  assert.ok(ch.topics[0].text.includes('opening sentence number 9'))
  assert.ok(!ch.topics[0].text.includes('7.1 Introduction'))
})

test('a short un-numbered opening (title lines, epigraph) is ignored', () => {
  const r = raw()
  r.pages[0].lines.unshift(L('Chapter 7'), L('BINOMIAL THEOREM'))
  const o = outline()
  o.topics = o.topics.map((t) => (t.page === 0 ? { ...t, line: t.line + 2 } : t))
  o.subsections = o.subsections.map((t) => (t.page === 0 ? { ...t, line: t.line + 2 } : t))
  assert.deepEqual(sliceChapter(r, o).topics.map((t) => t.number), ['7.1', '7.2', '7.3'])
})

test('a chapter with no numbered sections becomes one topic carrying the whole body', () => {
  const r = raw()
  r.chapterTitle = 'Exploration: Entering the World of Secondary Science'
  r.pages = [
    { index: 0, lines: [L('Chapter'), L('1'), L('Exploration: Entering the World of Secondary Science'), ...fill(14, 'open')] },
    { index: 1, lines: [...fill(10, 'more'), L('Summary'), L('1. Science is a way of ...')] },
  ]
  const ch = sliceChapter(r, { title: r.chapterTitle, topics: [], subsections: [], bodyEnd: { page: 1, line: 10 } })
  assert.equal(ch.topics.length, 1)
  assert.equal(ch.topics[0].number, '7.1')
  assert.equal(ch.topics[0].title, r.chapterTitle)
  assert.ok(ch.topics[0].text.startsWith('open sentence number 0'), 'title lines are not part of the text')
  assert.ok(ch.topics[0].text.endsWith('more sentence number 9 with enough words to count.'), 'stops at bodyEnd')
})

test('a bodyEnd at or before the last topic start is ignored (the last section is not empty)', () => {
  const o = outline()
  o.bodyEnd = { page: 1, line: 9 } // exactly where "7.3 General Term" starts
  const ch = sliceChapter(raw(), o)
  assert.equal(ch.topics.length, 3)
  assert.ok(ch.topics[2].text.includes('gen sentence number 8'), 'the last section keeps its text')
})
