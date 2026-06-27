'use strict'

// Phase 1 runtime verification against the REAL database (Supabase) using the
// real Prisma client + services. Forces fallback generation (MOCK_AI) so it is
// deterministic and needs no API key. Proves rows are written to all four tables
// and that a returning student is not re-served the same questions.
//
//   node scripts/braingym-verify.js
process.env.MOCK_AI = 'true' // set before dotenv so it is never overridden
require('dotenv').config()

const db = require('../src/config/database')
const pipeline = require('../src/services/braingym/pipeline')
const mastery = require('../src/services/braingym/mastery')
const { generateAndStore } = require('../src/services/braingym/generationService')

const GRADE = 'Class 9'
const CATEGORY = 'reasoning'

async function main() {
  // Reuse a dedicated verify user (grade Class 9) so the guardrail is exercised.
  let user = await db.user.findFirst({ where: { name: 'BrainGym Verify' }, select: { id: true } })
  if (!user) user = await db.user.create({ data: { name: 'BrainGym Verify', grade: GRADE }, select: { id: true } })
  const userId = user.id
  console.log('verify user:', userId)

  const before = await db.generated_questions.count()

  // 1. Generate + store (validate → dedup → quality → save) ───────────────────
  const g = await generateAndStore(db, { userId, grade: GRADE, category: CATEGORY, subject: 'Mental Math', difficulty: 'easy', count: 6, trigger: 'on_demand' })
  console.log('STEP 1 generate:', { accepted: g.accepted.length, engine: g.engine, model: g.model, stats: g.stats })

  // 2. Adaptive retrieval twice, recording attempts in between → no repeats ────
  const r1 = await pipeline.getQuestions(db, { userId, grade: GRADE, category: CATEGORY, count: 5 })
  const items1 = r1.questions.map((q) => ({ id: q.id, seedId: q.seedId, source: q.source, category: CATEGORY, difficulty: q.difficulty, isCorrect: true, answerGiven: String(q.answer) }))
  await pipeline.recordAttempts(db, { userId, grade: GRADE, items: items1 })
  const r2 = await pipeline.getQuestions(db, { userId, grade: GRADE, category: CATEGORY, count: 5 })
  const key = (q) => q.id || q.seedId || q.q
  const seen1 = new Set(r1.questions.map(key))
  const overlap = r2.questions.filter((q) => seen1.has(key(q))).length
  console.log('STEP 2 retrieval:', {
    round1: r1.questions.length, round1Sources: r1.questions.map((q) => q.source),
    round2: r2.questions.length, overlap, difficulty: r1.difficulty,
  })

  // 3. Submit a session → mastery + difficulty update ─────────────────────────
  const m = await mastery.applySessionResult(db, { userId, category: CATEGORY, grade: GRADE, correct: 4, total: 5 })
  console.log('STEP 3 mastery:', { attempts: m.attempts, accuracy: m.accuracy, currentDifficulty: m.currentDifficulty, grade: m.grade })

  // 4. Verify rows exist in all four tables ───────────────────────────────────
  const [gq, qa, sm, gh] = await Promise.all([
    db.generated_questions.count(),
    db.question_attempts.count({ where: { userId } }),
    db.student_mastery.count({ where: { userId } }),
    db.generation_history.count(),
  ])
  console.log('STEP 4 DB rows:', { generated_questions: gq, 'generated(new this run)': gq - before, question_attempts_user: qa, student_mastery_user: sm, generation_history: gh })

  const ok = g.accepted.length > 0 && r1.questions.length === 5 && r2.questions.length === 5 && overlap === 0 && qa > 0 && sm > 0 && gh > 0
  console.log(ok ? '\n✅ VERIFICATION PASSED' : '\n❌ VERIFICATION FAILED')
  await db.$disconnect()
  process.exit(ok ? 0 : 1)
}

main().catch((e) => { console.error('VERIFY ERROR', e); process.exit(1) })
