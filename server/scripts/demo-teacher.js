'use strict'
// Evaluation for the human-teacher loops: quiz grading, understanding check,
// adaptive re-explanation, streaming, lesson progress, revision mode.
require('dotenv').config()

const agent = require('../src/services/agent.service')
const progress = require('../src/services/progress.service')
const memory = require('../src/services/memory.service')
const db = require('../src/config/database')

const U = '22222222-2222-2222-2222-222222222222'
const LESSON = '33333333-3333-3333-3333-333333333333'
const fmt = (a) => String(a || '').replace(/\n/g, ' / ')
const hr = (s) => '\n' + '='.repeat(76) + '\n' + s + '\n' + '='.repeat(76)

async function main() {
  await db.$executeRaw`DELETE FROM student_memory WHERE "userId" = ${U}::uuid`
  await db.$executeRaw`DELETE FROM student_events WHERE "userId" = ${U}::uuid`
  await db.$executeRaw`DELETE FROM lesson_progress WHERE "userId" = ${U}::uuid`

  // 1. QUIZ GRADING LOOP
  console.log(hr('1. QUIZ GRADING LOOP'))
  const q1 = await agent.ask({ userId: U, text: 'Quiz me on gravitation', subject: 'Physics' })
  console.log('teacher asks:  ' + fmt(q1.answer))
  console.log('   (expecting=' + q1.expecting + ')')
  const wrong = await agent.ask({ userId: U, text: "I don't know", subject: 'Physics', pending: q1.pending })
  console.log('student: "I don\'t know"  → verdict=' + wrong.verdict)
  console.log('   teacher: ' + fmt(wrong.answer))

  const q2 = await agent.ask({ userId: U, text: 'Quiz me on Newton laws', subject: 'Physics' })
  console.log('\nteacher asks:  ' + fmt(q2.answer))
  const good = await agent.ask({ userId: U, text: q2.pending.answer, subject: 'Physics', pending: q2.pending })
  console.log('student answers correctly  → verdict=' + good.verdict)
  console.log('   teacher: ' + fmt(good.answer))

  // 2 & 3. UNDERSTANDING LOOP + ADAPTIVE RE-EXPLANATION
  console.log(hr('2+3. UNDERSTANDING CHECK + ADAPTIVE RE-EXPLANATION'))
  const c1 = await agent.ask({ userId: U, text: 'Explain escape velocity', subject: 'Physics' })
  console.log('teacher: ' + fmt(c1.answer).slice(0, 150) + '  (expecting=' + c1.expecting + ')')
  const r1 = await agent.ask({ userId: U, text: 'nahi samajh aaya', subject: 'Physics', pending: c1.pending })
  console.log('\nstudent: "nahi samajh aaya"  → strategy=' + r1.strategy)
  console.log('   teacher: ' + fmt(r1.answer).slice(0, 170))
  const r2 = await agent.ask({ userId: U, text: 'still confused', subject: 'Physics', pending: r1.pending })
  console.log('\nstudent: "still confused"  → strategy=' + r2.strategy)
  console.log('   teacher: ' + fmt(r2.answer).slice(0, 170))
  const ok = await agent.ask({ userId: U, text: 'ok got it', subject: 'Physics', pending: r2.pending })
  console.log('\nstudent: "ok got it"  → mode=' + ok.mode + '  teacher: ' + fmt(ok.answer))

  // 4. STREAMING
  console.log(hr('4. STREAMING RESPONSES'))
  const deltas = []
  let meta = null
  const t0 = Date.now()
  let firstTokenMs = null
  const final = await agent.askStream(
    { userId: U, text: 'What is inertia?', subject: 'Physics' },
    { onMeta: (m) => { meta = m }, onDelta: (t) => { if (firstTokenMs == null) firstTokenMs = Date.now() - t0; deltas.push(t) } }
  )
  console.log('meta event: ' + JSON.stringify(meta))
  console.log(`streamed ${deltas.length} chunks | first token at ${firstTokenMs}ms | total ${Date.now() - t0}ms`)
  console.log('first 3 chunks: ' + JSON.stringify(deltas.slice(0, 3)))
  console.log('final (guarded): ' + fmt(final.answer).slice(0, 120))

  // 5. LESSON PROGRESS
  console.log(hr('5. LESSON PROGRESS TRACKING'))
  let p = await progress.updateProgress({ userId: U, lessonId: LESSON, slideIndex: 2, total: 5 })
  console.log('after slide 3/5: ' + JSON.stringify(p))
  p = await progress.updateProgress({ userId: U, lessonId: LESSON, slideIndex: 4, total: 5 })
  console.log('after slide 5/5: ' + JSON.stringify({ percent: p.percent, completed: p.completed }))

  // 6. WEAK-TOPIC REVISION MODE
  console.log(hr('6. WEAK-TOPIC REVISION MODE'))
  await memory.recordEvent({ userId: U, type: 'mistake', subject: 'Physics', chapter: 'Thermodynamics' })
  await memory.recordEvent({ userId: U, type: 'mistake', subject: 'Physics', chapter: 'Thermodynamics' })
  const rev = await agent.startRevision({ userId: U, subject: 'Physics' })
  console.log('focus: ' + JSON.stringify(rev.focus))
  console.log('recap+quiz: ' + fmt(rev.answer).slice(0, 220))
  console.log('expecting=' + rev.expecting + ' (quiz armed on weak chapter)')

  await db.$executeRaw`DELETE FROM student_memory WHERE "userId" = ${U}::uuid`
  await db.$executeRaw`DELETE FROM student_events WHERE "userId" = ${U}::uuid`
  await db.$executeRaw`DELETE FROM lesson_progress WHERE "userId" = ${U}::uuid`
  console.log('\n(demo data cleaned up)')
}

main().then(() => process.exit(0)).catch((e) => { console.error('DEMO ERROR:', e); process.exit(1) })
