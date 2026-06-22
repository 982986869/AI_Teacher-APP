'use strict'
// One-time extractor: loads the static exemplar data files + the real
// EXEMPLAR_QUESTIONS map from ResourcesScreen.js, normalizes them EXACTLY like the
// frontend's getExemplarSections(), and writes flat rows -> server/prisma/exemplar-seed.json
// Run from anywhere:  node server/scripts/extract-exemplar.js
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = path.resolve(__dirname, '..', '..') // repo root
const DATA_DIR = path.join(ROOT, 'src', 'data')
const RES = path.join(ROOT, 'src', 'screens', 'ResourcesScreen.js')

// 1) Load every "...Exemplar....js" data file's `export const X = [...]` arrays.
//    The files use ONLY `export const`, so a tiny CJS rewrite avoids needing babel.
const dataFiles = fs.readdirSync(DATA_DIR).filter((f) => /Exemplar.*\.js$/.test(f))
const allExports = {}
for (const f of dataFiles) {
  const src = fs.readFileSync(path.join(DATA_DIR, f), 'utf8')
  const cjs = src
    .replace(/export\s+default\s+[^;]+;?/g, '')     // drop `export default X;` (redundant)
    .replace(/export\s*\{[^}]*\}\s*;?/g, '')         // drop `export { ... };` if any
    .replace(/export\s+const\s+/g, 'exports.')       // `export const X =` -> `exports.X =`
  const sandbox = { exports: {} }
  vm.runInNewContext(cjs, sandbox, { filename: f })
  Object.assign(allExports, sandbox.exports)
}

// 2) Slice the literal `const EXEMPLAR_QUESTIONS = { ... }` out of ResourcesScreen.
const resSrc = fs.readFileSync(RES, 'utf8')
const startKw = resSrc.indexOf('const EXEMPLAR_QUESTIONS =')
if (startKw < 0) throw new Error('EXEMPLAR_QUESTIONS not found in ResourcesScreen.js')
const objStart = resSrc.indexOf('{', startKw)
let depth = 0
let objEnd = -1
for (let i = objStart; i < resSrc.length; i++) {
  const c = resSrc[i]
  if (c === '{') depth++
  else if (c === '}') { depth--; if (depth === 0) { objEnd = i; break } }
}
const objText = resSrc.slice(objStart, objEnd + 1)

// 3) Evaluate the object literal with the loaded arrays bound as identifiers.
const keys = Object.keys(allExports)
// eslint-disable-next-line no-new-func
const EXEMPLAR_QUESTIONS = new Function(...keys, `return (${objText});`)(...keys.map((k) => allExports[k]))

// 4) Normalize EXACTLY like frontend getExemplarSections(), then flatten to rows.
const toSections = (subject, data) => {
  if (Array.isArray(data) && data.length > 0 && data[0] && data[0].questions !== undefined) return data
  return [{ label: subject === 'Mathematics' ? 'Exercise' : 'Chapter-end', questions: data || [] }]
}

const rows = []
const summary = {}
for (const [subject, chapters] of Object.entries(EXEMPLAR_QUESTIONS)) {
  summary[subject] = { chapters: 0, questions: 0 }
  for (const [chapter, data] of Object.entries(chapters)) {
    summary[subject].chapters++
    let position = 0
    for (const sec of toSections(subject, data)) {
      for (const q of sec.questions || []) {
        rows.push({
          subject,
          className: 'Class 11',
          chapter,
          section: String(sec.label || ''),
          qNumber: String(q.q != null ? q.q : ''),
          text: String(q.text != null ? q.text : ''),
          options: Array.isArray(q.options) ? q.options : [],
          solutionLabel: String(q.solutionLabel != null ? q.solutionLabel : ''),
          solution: String(q.solution != null ? q.solution : ''),
          questionImages: Array.isArray(q.questionImages) ? q.questionImages : [],
          solutionImages: Array.isArray(q.solutionImages) ? q.solutionImages : [],
          position: position++,
        })
        summary[subject].questions++
      }
    }
  }
}

const out = path.join(ROOT, 'server', 'prisma', 'exemplar-seed.json')
fs.writeFileSync(out, JSON.stringify(rows))
console.log('subjects:', Object.keys(EXEMPLAR_QUESTIONS).join(', '))
for (const s of Object.keys(summary)) console.log(`  ${s}: ${summary[s].chapters} chapters, ${summary[s].questions} questions`)
console.log('TOTAL rows:', rows.length)
console.log('wrote', path.relative(ROOT, out))
