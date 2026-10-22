'use strict'
// Paths and URLs shared by the textbook pipeline scripts (download → extract →
// outline → seed → embed). Everything is keyed by the NCERT book code, e.g.
// "jemh1" = Class 10 (j), English (e), Mathematics (mh), part 1.
const fs = require('fs')
const path = require('path')

const SERVER_ROOT = path.join(__dirname, '..', '..')
const DATA_DIR = path.join(SERVER_ROOT, 'data', 'textbooks')
const PDF_DIR = path.join(DATA_DIR, 'pdf')
const COVER_DIR = path.join(SERVER_ROOT, 'public', 'books')
const NCERT_BASE = 'https://ncert.nic.in/textbook/pdf/'

const pad2 = (n) => String(n).padStart(2, '0')

const pdfUrl = (code, n) => `${NCERT_BASE}${code}${pad2(n)}.pdf`
const prelimsUrl = (code) => `${NCERT_BASE}${code}ps.pdf`

const chapterPdfPath = (code, n) => path.join(PDF_DIR, `${code}${pad2(n)}.pdf`)
const prelimsPdfPath = (code) => path.join(PDF_DIR, `${code}ps.pdf`)
const bookJsonDir = (code, classLevel = 10) => path.join(DATA_DIR, `class${classLevel}`, code)
const rawJsonPath = (code, n, classLevel = 10) => path.join(bookJsonDir(code, classLevel), `ch${pad2(n)}.raw.json`)
const chapterJsonPath = (code, n, classLevel = 10) => path.join(bookJsonDir(code, classLevel), `ch${pad2(n)}.json`)
const coverPngPath = (code) => path.join(COVER_DIR, `${code}.png`)

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'books.json'), 'utf8'))
}

// --book jemh1 --chapter 7 --force  →  { book: 'jemh1', chapter: 7, force: true }
function parseArgs(argv = process.argv.slice(2)) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--book') out.book = argv[++i]
    else if (a === '--chapter') out.chapter = Number(argv[++i])
    else if (a === '--force') out.force = true
  }
  return out
}

module.exports = {
  DATA_DIR, PDF_DIR, COVER_DIR, pad2, pdfUrl, prelimsUrl,
  chapterPdfPath, prelimsPdfPath, bookJsonDir, rawJsonPath, chapterJsonPath, coverPngPath,
  loadManifest, parseArgs,
}
