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

test('loadManifest returns the two Class 10 books with their chapter counts', () => {
  const books = lib.loadManifest()
  assert.deepEqual(books.map((b) => [b.code, b.chapters]), [['jesc1', 13], ['jemh1', 14]])
})

test('parseArgs reads --book, --chapter and --force', () => {
  assert.deepEqual(lib.parseArgs(['--book', 'jemh1', '--chapter', '7', '--force']), { book: 'jemh1', chapter: 7, force: true })
  assert.deepEqual(lib.parseArgs([]), {})
})
