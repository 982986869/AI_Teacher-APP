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
  assert.deepEqual(books.map((b) => [b.code, b.classLevel, b.chapters]), [
    ['jesc1', 10, 13], ['jemh1', 10, 14],
    ['iesc1', 9, 13], ['iemh1', 9, 8], ['iemh2', 9, 6],
  ])
  // Part 2 continues Part 1's chapter numbering (its first chapter is chapter 9)
  assert.equal(books.find((b) => b.code === 'iemh2').chapterOffset, 8)
  // every book has what seed/embed/UI read off it
  for (const bk of books) for (const k of ['subject', 'subjectSlug', 'title', 'publisher', 'edition', 'language', 'position']) assert.ok(bk[k] != null, `${bk.code}.${k}`)
})

test('parseArgs reads --book, --chapter and --force', () => {
  assert.deepEqual(lib.parseArgs(['--book', 'jemh1', '--chapter', '7', '--force']), { book: 'jemh1', chapter: 7, force: true })
  assert.deepEqual(lib.parseArgs([]), {})
})
