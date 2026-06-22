'use strict'
// Extracts NCERT Part-II content EXACTLY as the app sees it. ncert2Solutions.js
// is ESM and imports ~23 HTML content modules, so we install a require hook that
// transpiles our src/ ESM -> CJS via @babel/core (node_modules left untouched),
// then call the SAME public functions the screen uses (getNcert2Chapters /
// getNcert2Sections). Writes one row per section to server/prisma/ncert-seed.json.
const fs = require('fs')
const path = require('path')
const babel = require('@babel/core')                                   // from root node_modules
const cjsPlugin = require('@babel/plugin-transform-modules-commonjs')   // from root node_modules

const ROOT = path.resolve(__dirname, '..', '..')

const origJs = require.extensions['.js']
require.extensions['.js'] = function (module, filename) {
  if (filename.includes('node_modules')) return origJs(module, filename)
  const src = fs.readFileSync(filename, 'utf8')
  const { code } = babel.transformSync(src, {
    filename, babelrc: false, configFile: false, plugins: [cjsPlugin],
  })
  module._compile(code, filename)
}

const { getNcert2Chapters, getNcert2Sections } = require(path.join(ROOT, 'src', 'data', 'ncert2Solutions.js'))

const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Mathematics']
const CLASS_NAME = 'Class 11'

const rows = []
const summary = {}
for (const subject of SUBJECTS) {
  const chapters = getNcert2Chapters(subject)
  summary[subject] = { chapters: chapters.length, sections: 0, withHtml: 0 }
  chapters.forEach((chapter, ci) => {
    const secs = getNcert2Sections(subject, chapter)
    secs.forEach((sec, si) => {
      rows.push({
        part: 2,
        subject,
        className: CLASS_NAME,
        chapter,
        sectionKey: sec.key,
        sectionLabel: sec.label,
        html: sec.html == null ? null : String(sec.html),
        chapterPos: ci,
        position: si,
      })
      summary[subject].sections++
      if (sec.html != null) summary[subject].withHtml++
    })
  })
}

fs.writeFileSync(path.join(ROOT, 'server', 'prisma', 'ncert-seed.json'), JSON.stringify(rows))

console.log('NCERT Part-II extracted (exact, via getNcert2Sections):')
let tc = 0, ts = 0, th = 0
for (const s of SUBJECTS) {
  const x = summary[s]
  console.log(`  ${s.padEnd(12)} ${x.chapters} chapters, ${x.sections} sections, ${x.withHtml} with html (${x.sections - x.withHtml} coming-soon/null)`)
  tc += x.chapters; ts += x.sections; th += x.withHtml
}
console.log(`  ${'TOTAL'.padEnd(12)} ${tc} chapters, ${ts} sections, ${th} with html, ${ts - th} null`)
console.log('wrote server/prisma/ncert-seed.json (' + rows.length + ' rows)')
