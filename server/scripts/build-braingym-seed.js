'use strict'

// Build the backend Brain Gym seed bank from the SINGLE source of truth:
// the frontend file src/data/brainGymQuestions.js. We parse the static array
// with a tolerant regex so the backend never drifts from the client seed.
//
//   node server/scripts/build-braingym-seed.js
//
// Output: server/src/data/brainGymSeed.json
//   [{ seedId, skill, level, q, answer, grade: null, source: 'seed' }]
//
// grade is null = "grade-agnostic mental arithmetic". Seed questions introduce
// no class-specific syllabus concepts, so they are safe for every class. The
// strict per-class guardrail applies to AI-GENERATED questions (see grade.js).

const fs = require('fs')
const path = require('path')

const FRONTEND = path.resolve(__dirname, '../../src/data/brainGymQuestions.js')
const OUT = path.resolve(__dirname, '../src/data/brainGymSeed.json')

function build() {
  const src = fs.readFileSync(FRONTEND, 'utf8')

  // Match: { skill: 'reasoning', level: 1, q: 'Next: 1, 2, 3, ?', answer: 4 }
  // q may contain escaped quotes; keep it simple by capturing up to the
  // closing quote that precedes ", answer".
  const re = /\{\s*skill:\s*'([^']+)'\s*,\s*level:\s*(\d+)\s*,\s*q:\s*'((?:\\'|[^'])*)'\s*,\s*answer:\s*(-?\d+(?:\.\d+)?)\s*\}/g

  const out = []
  let m
  let i = 0
  while ((m = re.exec(src)) !== null) {
    const [, skill, level, qRaw, answer] = m
    out.push({
      seedId: `seed-${String(i).padStart(4, '0')}`,
      skill,
      level: parseInt(level, 10),
      q: qRaw.replace(/\\'/g, "'"),
      answer: Number(answer),
      grade: null,
      source: 'seed',
    })
    i += 1
  }

  if (out.length < 300) {
    throw new Error(`Parsed only ${out.length} seed questions — expected ~400. Regex likely needs an update.`)
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n')

  const bySkill = out.reduce((a, x) => ((a[x.skill] = (a[x.skill] || 0) + 1), a), {})
  console.log(`Wrote ${out.length} seed questions → ${path.relative(process.cwd(), OUT)}`)
  console.log('By skill:', bySkill)
}

build()
