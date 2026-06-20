'use strict'
// Verifies DB exemplar content EXACTLY matches the static frontend content, for
// every (subject, chapter). Run from server/:  node scripts/verify-exemplar.js
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { PrismaClient } = require('@prisma/client')

const ROOT = path.resolve(__dirname, '..', '..')
const DATA_DIR = path.join(ROOT, 'src', 'data')
const RES = path.join(ROOT, 'src', 'screens', 'ResourcesScreen.js')

// ── load the static EXEMPLAR_QUESTIONS map (same approach as the extractor) ──
const allExports = {}
for (const f of fs.readdirSync(DATA_DIR).filter((x) => /Exemplar.*\.js$/.test(x))) {
  const cjs = fs.readFileSync(path.join(DATA_DIR, f), 'utf8')
    .replace(/export\s+default\s+[^;]+;?/g, '')
    .replace(/export\s*\{[^}]*\}\s*;?/g, '')
    .replace(/export\s+const\s+/g, 'exports.')
  const sb = { exports: {} }
  vm.runInNewContext(cjs, sb, { filename: f })
  Object.assign(allExports, sb.exports)
}
const resSrc = fs.readFileSync(RES, 'utf8')
const s = resSrc.indexOf('const EXEMPLAR_QUESTIONS =')
const o = resSrc.indexOf('{', s)
let d = 0
let e = -1
for (let i = o; i < resSrc.length; i++) {
  if (resSrc[i] === '{') d++
  else if (resSrc[i] === '}') { d--; if (d === 0) { e = i; break } }
}
// eslint-disable-next-line no-new-func
const EXEMPLAR_QUESTIONS = new Function(...Object.keys(allExports), `return (${resSrc.slice(o, e + 1)});`)(...Object.values(allExports))

// ── canonical normalizers (so JSONB key-reordering doesn't cause false diffs) ──
const normOpt = (op) => ({ text: String(op && op.text != null ? op.text : ''), correct: (op && op.correct) === true })
const normQ = (q) => ({
  q: String(q.q != null ? q.q : ''),
  text: String(q.text != null ? q.text : ''),
  options: (Array.isArray(q.options) ? q.options : []).map(normOpt),
  solutionLabel: String(q.solutionLabel != null ? q.solutionLabel : ''),
  solution: String(q.solution != null ? q.solution : ''),
  questionImages: Array.isArray(q.questionImages) ? q.questionImages : [],
  solutionImages: Array.isArray(q.solutionImages) ? q.solutionImages : [],
})
const toSections = (subject, data) => {
  if (Array.isArray(data) && data.length > 0 && data[0] && data[0].questions !== undefined) return data
  return [{ label: subject === 'Mathematics' ? 'Exercise' : 'Chapter-end', questions: data || [] }]
}
const normSections = (secs) => secs.map((sec) => ({ label: String(sec.label || ''), questions: (sec.questions || []).map(normQ) }))

;(async () => {
  const prisma = new PrismaClient()
  let ok = 0
  let bad = 0
  let qStatic = 0
  let qDb = 0
  const mismatches = []
  try {
    for (const [subject, chapters] of Object.entries(EXEMPLAR_QUESTIONS)) {
      for (const [chapter, data] of Object.entries(chapters)) {
        const staticSecs = normSections(toSections(subject, data))
        staticSecs.forEach((sec) => { qStatic += sec.questions.length })

        const rows = await prisma.exemplar_solutions.findMany({
          where: { subject, className: 'Class 11', chapter },
          orderBy: { position: 'asc' },
        })
        const dbSecs = []
        const idx = Object.create(null)
        for (const r of rows) {
          if (idx[r.section] === undefined) { idx[r.section] = dbSecs.length; dbSecs.push({ label: r.section, questions: [] }) }
          dbSecs[idx[r.section]].questions.push(normQ({
            q: r.qNumber, text: r.text, options: r.options, solutionLabel: r.solutionLabel,
            solution: r.solution, questionImages: r.questionImages, solutionImages: r.solutionImages,
          }))
        }
        const dbNorm = normSections(dbSecs)
        dbNorm.forEach((sec) => { qDb += sec.questions.length })

        if (JSON.stringify(staticSecs) === JSON.stringify(dbNorm)) ok++
        else { bad++; if (mismatches.length < 5) mismatches.push(`${subject} / ${chapter}`) }
      }
    }
    console.log(`chapters compared: ${ok + bad}  |  EXACT match: ${ok}  |  mismatch: ${bad}`)
    console.log(`questions — static: ${qStatic}  |  db: ${qDb}`)
    if (bad) console.log('mismatched:', mismatches.join('  ;  '))
    console.log(bad === 0 && qStatic === qDb ? '✅ DB content matches static content EXACTLY' : '❌ differences found')
  } catch (err) {
    console.error('VERIFY ERROR:', err.message)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
})()
