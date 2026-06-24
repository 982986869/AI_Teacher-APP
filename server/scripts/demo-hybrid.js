'use strict'
// Evaluation report for the hybrid teacher architecture. Exercises all 6 parts
// with a synthetic demo user (random uuid, cleaned up after). Run from server/:
//   node scripts/demo-hybrid.js
require('dotenv').config()

const { ask } = require('../src/services/agent.service')
const { retrieve } = require('../src/services/retriever.service')
const memory = require('../src/services/memory.service')
const planner = require('../src/services/planner.service')
const db = require('../src/config/database')

const U = '11111111-1111-1111-1111-111111111111'
const fmt = (a) => String(a).replace(/\n/g, ' / ')
const hr = (s) => '\n' + '='.repeat(76) + '\n' + s + '\n' + '='.repeat(76)
const stype = (title) => String(title).split(' — ')[0]

async function main() {
  await db.$executeRaw`DELETE FROM student_memory WHERE "userId" = ${U}::uuid`
  await db.$executeRaw`DELETE FROM student_events WHERE "userId" = ${U}::uuid`

  // 1. Curriculum RAG (now incl. PYQ + Practice) + subject normalization
  console.log(hr('1. CURRICULUM RAG — NCERT + Exemplar + PYQ + Practice'))
  const r = await retrieve({ query: 'Why does Pb4+ act as an oxidising agent?', subject: 'Chemistry', topK: 6 })
  console.log('   Chemistry query → source types retrieved: ' + [...new Set(r.chunks.map((c) => stype(c.sourceTitle)))].join(', '))
  r.chunks.slice(0, 4).forEach((c) => console.log(`     [${c.similarity.toFixed(2)}] ${stype(c.sourceTitle)} > ${c.metadata && c.metadata.chapter}`))
  const rm = await retrieve({ query: 'diagonal of a square', subject: 'Maths', topK: 2 })
  console.log(`   subject normalization: "Maths" → grounded=${rm.grounded} (top ${rm.topSimilarity}, ${stype(rm.chunks[0] ? rm.chunks[0].sourceTitle : '-')})`)

  // 2. General Knowledge Mode
  console.log(hr('2. GENERAL KNOWLEDGE MODE (retrieval < threshold → model knowledge)'))
  const gk = await ask({ userId: U, text: 'Who was the first President of India?', subject: 'History' })
  console.log(`   [History]  source=${gk.source}  grounded=${gk.grounded}`)
  console.log('     ' + fmt(gk.answer))
  const cur = await ask({ userId: U, text: 'What is acceleration due to gravity?', subject: 'Physics' })
  console.log(`   [Physics]  source=${cur.source}  grounded=${cur.grounded}  conf=${cur.confidence}  src=${(cur.sources[0] || {}).chapter}`)

  // 3. Adaptive difficulty
  console.log(hr('3. TEACHER PERSONA — adaptive difficulty (same question, 3 levels)'))
  for (const level of ['beginner', 'intermediate', 'advanced']) {
    const a = await ask({ userId: U, text: 'What is an acid?', subject: 'Chemistry', level })
    console.log(`\n   [${level}]  ${fmt(a.answer).slice(0, 220)}`)
  }

  // 4. Student memory
  console.log(hr('4. STUDENT MEMORY — mistakes, weak chapters, quiz performance'))
  await memory.recordEvent({ userId: U, type: 'doubt', subject: 'Physics', chapter: 'Gravitation' })
  await memory.recordEvent({ userId: U, type: 'mistake', subject: 'Physics', chapter: 'Thermodynamics' })
  await memory.recordEvent({ userId: U, type: 'mistake', subject: 'Physics', chapter: 'Thermodynamics' })
  for (const correct of [false, false, true]) {
    await memory.recordEvent({ userId: U, type: 'quiz', subject: 'Physics', chapter: 'Laws of Motion', detail: { correct } })
  }
  const sum = await memory.getSummary(U)
  console.log('   summary: ' + JSON.stringify({
    chaptersEngaged: sum.chaptersEngaged, totalDoubts: sum.totalDoubts,
    totalMistakes: sum.totalMistakes, quizAccuracy: sum.quizAccuracy, quiz: sum.quiz,
  }))
  console.log('   weak chapters:')
  sum.weakChapters.forEach((w) => console.log(`     ${w.subject} > ${w.chapter}  weakness=${w.weakness}  mistakes=${w.mistakes}  quiz=${w.quizCorrect}/${w.quizTotal}`))

  // 5. Lesson planner
  console.log(hr('5. LESSON PLANNER — what to teach next'))
  const plan = await planner.recommendNext(U, 'Physics')
  console.log('   ' + JSON.stringify({ action: plan.action, subject: plan.subject, chapter: plan.chapter }))
  console.log('   reason: ' + plan.reason)

  await db.$executeRaw`DELETE FROM student_memory WHERE "userId" = ${U}::uuid`
  await db.$executeRaw`DELETE FROM student_events WHERE "userId" = ${U}::uuid`
  console.log('\n(demo user memory cleaned up)')
}

main().then(() => process.exit(0)).catch((e) => { console.error('DEMO ERROR:', e); process.exit(1) })
