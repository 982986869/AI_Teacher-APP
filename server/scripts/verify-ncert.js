'use strict'
// Verifies DB ncert_solutions content EXACTLY matches the static frontend content
// (byte-for-byte HTML, including null "coming soon" sections), per (subject, chapter).
const fs = require('fs')
const path = require('path')
const babel = require('@babel/core')
const cjsPlugin = require('@babel/plugin-transform-modules-commonjs')
const { PrismaClient } = require('@prisma/client')

const ROOT = path.resolve(__dirname, '..', '..')

const origJs = require.extensions['.js']
require.extensions['.js'] = function (module, filename) {
  if (filename.includes('node_modules')) return origJs(module, filename)
  const src = fs.readFileSync(filename, 'utf8')
  const { code } = babel.transformSync(src, { filename, babelrc: false, configFile: false, plugins: [cjsPlugin] })
  module._compile(code, filename)
}

const { getNcert2Chapters, getNcert2Sections } = require(path.join(ROOT, 'src', 'data', 'ncert2Solutions.js'))

const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Mathematics']
const normSecs = (secs) => secs.map((s) => ({
  key: String(s.key), label: String(s.label), html: s.html == null ? null : String(s.html),
}))

;(async () => {
  const prisma = new PrismaClient()
  let ok = 0, bad = 0, sStatic = 0, sDb = 0
  const mismatches = []
  try {
    for (const subject of SUBJECTS) {
      for (const chapter of getNcert2Chapters(subject)) {
        const staticSecs = normSecs(getNcert2Sections(subject, chapter))
        sStatic += staticSecs.length

        const rows = await prisma.$queryRaw`
          SELECT "sectionKey", "sectionLabel", html FROM ncert_solutions
          WHERE part = 2 AND subject = ${subject} AND "className" = 'Class 11' AND chapter = ${chapter}
          ORDER BY position ASC`
        const dbSecs = normSecs(rows.map((r) => ({ key: r.sectionKey, label: r.sectionLabel, html: r.html })))
        sDb += dbSecs.length

        if (JSON.stringify(staticSecs) === JSON.stringify(dbSecs)) ok++
        else { bad++; if (mismatches.length < 8) mismatches.push(`${subject} / ${chapter}`) }
      }
    }
    console.log(`chapters compared: ${ok + bad}  |  EXACT match: ${ok}  |  mismatch: ${bad}`)
    console.log(`sections — static: ${sStatic}  |  db: ${sDb}`)
    if (bad) console.log('mismatched:', mismatches.join('  ;  '))
    console.log(bad === 0 && sStatic === sDb ? '✅ DB content matches static NCERT Part-II content EXACTLY' : '❌ differences found')
  } catch (err) {
    console.error('VERIFY ERROR:', err.message)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
})()
