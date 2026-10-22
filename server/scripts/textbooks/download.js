'use strict'
// Downloads every chapter PDF (+ the prelims PDF with the cover) for the books in
// books.json into server/data/textbooks/pdf/. Skips files already on disk.
//
//   node scripts/textbooks/download.js                 # all books
//   node scripts/textbooks/download.js --book jemh1    # one book
//   node scripts/textbooks/download.js --book jemh1 --chapter 7
const fs = require('fs')
const path = require('path')
const lib = require('./lib')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchPdf(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) return 'skip'
  let lastErr
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (res.status === 404) throw Object.assign(new Error(`404 ${url}`), { fatal: true })
      if (!res.ok) throw new Error(`${res.status} ${url}`)
      const buf = Buffer.from(await res.arrayBuffer())
      // NCERT sometimes answers with an HTML error page and a 200 — check the magic bytes.
      if (buf.subarray(0, 4).toString() !== '%PDF') throw new Error(`not a PDF: ${url}`)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, buf)
      return 'ok'
    } catch (err) {
      if (err.fatal) throw err
      lastErr = err
      await sleep(1500 * attempt)
    }
  }
  throw lastErr
}

;(async () => {
  const args = lib.parseArgs()
  const books = lib.loadManifest().filter((b) => !args.book || b.code === args.book)
  if (!books.length) throw new Error(`unknown book ${args.book}`)
  for (const b of books) {
    const jobs = [[lib.prelimsUrl(b.code), lib.prelimsPdfPath(b.code)]]
    for (let n = 1; n <= b.chapters; n++) {
      if (args.chapter && n !== args.chapter) continue
      jobs.push([lib.pdfUrl(b.code, n), lib.chapterPdfPath(b.code, n)])
    }
    for (const [url, dest] of jobs) {
      const r = await fetchPdf(url, dest)
      console.log(`${r.padEnd(4)} ${path.basename(dest)}`)
    }
  }
})().catch((e) => { console.error('DOWNLOAD ERROR:', e.message); process.exit(1) })
