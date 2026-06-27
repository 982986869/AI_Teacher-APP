'use strict'

// Overnight / low-load batch generation. Grows the generated bank for every
// (grade × category × difficulty) bucket up to a target depth, so students rarely
// see repeats. Safe to run on a cron; each question passes validate → dedup →
// quality before it is stored. Class guardrail is enforced per question.
//
//   node scripts/braingym-backfill.js                 # default grades 9-12
//   node scripts/braingym-backfill.js "Class 9,Class 10" 12
//
// Requires DATABASE_URL (real Postgres). Uses the LLM when configured, else the
// deterministic grade-safe fallback.

require('dotenv').config()
const db = require('../src/config/database')
const { generateAndStore } = require('../src/services/braingym/generationService')
const { bucketCount } = require('../src/services/braingym/retrieval')
const { CATEGORIES, DIFFICULTIES } = require('../src/services/braingym/constants')

async function main() {
  const grades = (process.argv[2] || 'Class 9,Class 10,Class 11,Class 12').split(',').map((s) => s.trim())
  const target = parseInt(process.argv[3], 10) || 20
  const subject = 'Mental Math'

  let totalAccepted = 0
  for (const grade of grades) {
    for (const category of CATEGORIES) {
      for (const difficulty of DIFFICULTIES) {
        const have = await bucketCount(db, { grade, subject, category, difficulty })
        const need = Math.max(0, target - have)
        if (!need) { console.log(`✓ ${grade}/${category}/${difficulty}: ${have} (full)`); continue }
        const { stats, engine } = await generateAndStore(db, {
          userId: null, grade, subject, category, difficulty,
          count: need, trigger: 'batch', salt: Math.floor(Date.now() / 1000) % 100000,
        })
        totalAccepted += stats.accepted
        console.log(`+ ${grade}/${category}/${difficulty}: had ${have}, made ${stats.accepted}/${need} [${engine}] (dup ${stats.rejectedDuplicate}, guard ${stats.rejectedGuardrail}, val ${stats.rejectedValidation})`)
      }
    }
  }
  console.log(`\nDone. Accepted ${totalAccepted} new questions across ${grades.length} grade(s).`)
  await db.$disconnect()
}

main().catch((err) => { console.error('backfill failed:', err); process.exit(1) })
