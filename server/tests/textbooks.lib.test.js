'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const lib = require('../scripts/textbooks/lib')

test('pad2 zero-pads chapter numbers the way NCERT names its files', () => {
  assert.equal(lib.pad2(1), '01')
  assert.equal(lib.pad2(14), '14')
})

test('pdfUrl and prelimsUrl follow the ncert.nic.in pattern', () => {
  assert.equal(lib.pdfUrl('jemh1', 7), 'https://ncert.nic.in/textbook/pdf/jemh107.pdf')
  assert.equal(lib.prelimsUrl('jesc1'), 'https://ncert.nic.in/textbook/pdf/jesc1ps.pdf')
})

test('paths land under server/data/textbooks and server/public/books', () => {
  assert.equal(path.basename(lib.chapterPdfPath('jemh1', 7)), 'jemh107.pdf')
  assert.ok(lib.chapterPdfPath('jemh1', 7).includes(path.join('data', 'textbooks', 'pdf')))
  assert.ok(lib.rawJsonPath('jemh1', 7).endsWith(path.join('class10', 'jemh1', 'ch07.raw.json')))
  assert.ok(lib.chapterJsonPath('jemh1', 7).endsWith(path.join('class10', 'jemh1', 'ch07.json')))
  assert.ok(lib.coverPngPath('jemh1').endsWith(path.join('public', 'books', 'jemh1.png')))
})

test('loadManifest returns every book with its class and chapter count', () => {
  const books = lib.loadManifest()
  const by = Object.fromEntries(books.map((b) => [b.code, b]))
  assert.deepEqual([by.jesc1.classLevel, by.jesc1.chapters, by.jemh1.chapters], [10, 13, 14])
  assert.deepEqual([by.iesc1.chapters, by.iemh1.chapters, by.iemh2.chapters], [13, 8, 6])
  // one entry per class 6–12, codes unique, part 2s numbered after their part 1
  assert.deepEqual([...new Set(books.map((b) => b.classLevel))].sort((a, b) => a - b), [6, 7, 8, 9, 10, 11, 12])
  assert.equal(new Set(books.map((b) => b.code)).size, books.length)
  for (const bk of books) if (/2$/.test(bk.code)) assert.equal(bk.chapterOffset, by[bk.code.replace(/2$/, '1')].chapters, `${bk.code} offset`)
  // Part 2 continues Part 1's chapter numbering (its first chapter is chapter 9)
  assert.equal(books.find((b) => b.code === 'iemh2').chapterOffset, 8)
  // every book has what seed/embed/UI read off it
  for (const bk of books) for (const k of ['subject', 'subjectSlug', 'title', 'publisher', 'edition', 'language', 'position']) assert.ok(bk[k] != null, `${bk.code}.${k}`)
})

test('parseArgs reads --book, --chapter and --force', () => {
  assert.deepEqual(lib.parseArgs(['--book', 'jemh1', '--chapter', '7', '--force']), { book: 'jemh1', chapter: 7, force: true })
  assert.deepEqual(lib.parseArgs([]), {})
})
