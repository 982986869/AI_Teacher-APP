'use strict'

// Live verification that memory reaches the RE-EXPLANATION and WRONG-ANSWER paths
// (not just normal teaching). Real Claude conversations.  node scripts/teacher-paths-verify.js
require('dotenv').config() // real env → MOCK_AI=false, real Claude key

const db = require('../src/config/database')
const agent = require('../src/services/agent.service')
const mastery = require('../src/services/mastery.service')

const LEAK = /\d+\s*%|\bmastery\b|\bconfidence score\b|\bretention\b|\byour score\b|\baccuracy is\b/i

async function ensureUser(name) {
  let u = await db.user.findFirst({ where: { name }, select: { id: true } })
  if (!u) u = await db.user.create({ data: { name, grade: 'Class 9' }, select: { id: true } })
  return u.id
}

async function main() {
  const userId = await ensureUser('Teacher Paths Verify')

  // Seed a concept this student has STRUGGLED with (recent wrong answers).
  await db.$executeRawUnsafe(`INSERT INTO concepts (subject, chapter, name, slug) VALUES ('Physics','Relative Velocity','Relative Velocity','relative-velocity-test') ON CONFLICT (subject, chapter, name) DO NOTHING`)
  const c = await db.$queryRawUnsafe(`SELECT id FROM concepts WHERE subject='Physics' AND name='Relative Velocity'`)
  const conceptId = c[0].id
  for (let i = 0; i < 2; i++) await mastery.updateMastery({ userId, conceptId, signal: 'quiz_wrong' })

  // 1. RE-EXPLANATION — confused student on a concept they struggled with before.
  let r1 = '(none)'
  try {
    const res = await agent.ask({
      userId, text: "I still don't understand this",
      pending: { kind: 'understanding', topic: 'explain relative velocity simply', subject: 'Physics', language: 'en', attempts: 0, strategy: 'direct', conceptId, conceptName: 'Relative Velocity', chapter: 'Relative Velocity' },
    })
    r1 = (res && res.answer) || '(empty)'
  } catch (e) { r1 = `ERROR: ${e.message}` }
  const r1leak = LEAK.test(r1)
  const r1mem = /last time|again|another way|tricky|hard|before|gently|differently|step/i.test(r1)
  console.log(`\n── RE-EXPLAIN (confused, struggled before) ──\nstudent: "I still don't understand this"\nteacher: ${r1}\n   [leak: ${r1leak ? '❌' : '✅'} | memory-aware: ${r1mem ? '✅' : '⚠️'}]`)

  // 2. WRONG ANSWER — student answers a quiz wrong on the struggled concept.
  let r2 = '(none)'
  try {
    const res = await agent.ask({
      userId, text: 'It is the speed of light',
      pending: { kind: 'quiz', question: 'In one line, what is relative velocity?', answer: 'the velocity of one object as seen from another moving object', subject: 'Physics', chapter: 'Relative Velocity', language: 'en', level: 'beginner', conceptId },
    })
    r2 = (res && res.answer) || '(empty)'
  } catch (e) { r2 = `ERROR: ${e.message}` }
  const r2leak = LEAK.test(r2)
  const r2harsh = /\b(wrong!|incorrect\.|no\.|completely wrong|bad)\b/i.test(r2)
  console.log(`\n── WRONG ANSWER (struggled before → gentle) ──\nstudent: "It is the speed of light"\nteacher: ${r2}\n   [leak: ${r2leak ? '❌' : '✅'} | harsh: ${r2harsh ? '❌ harsh' : '✅ gentle'}]`)

  // 3. Contrast — a NEW student's re-explanation should NOT fabricate memory.
  const newUser = await ensureUser('Teacher Paths New')
  let r3 = '(none)'
  try {
    const res = await agent.ask({
      userId: newUser, text: "I don't get it",
      pending: { kind: 'understanding', topic: 'explain inertia simply', subject: 'Physics', language: 'en', attempts: 0, strategy: 'direct', conceptId: null, conceptName: null, chapter: null },
    })
    r3 = (res && res.answer) || '(empty)'
  } catch (e) { r3 = `ERROR: ${e.message}` }
  console.log(`\n── RE-EXPLAIN (brand-new student, no history) ──\nstudent: "I don't get it"\nteacher: ${r3}\n   [leak: ${LEAK.test(r3) ? '❌' : '✅'}]`)

  const ok = !r1leak && !r2leak && !r2harsh && !LEAK.test(r3)
    && !/^ERROR/.test(r1) && !/^ERROR/.test(r2) && !/^ERROR/.test(r3)
    && r1mem // the struggled-before re-explanation acknowledges history
  console.log(ok ? '\n✅ PATHS VERIFY PASSED' : '\n❌ PATHS VERIFY FAILED')
  await db.$disconnect()
  process.exit(ok ? 0 : 1)
}

main().catch((e) => { console.error('VERIFY ERROR', e); process.exit(1) })
