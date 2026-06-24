'use strict'
// Verifies the Physics knowledge-graph slice against the 5 success criteria.
require('dotenv').config()
const { retrieve } = require('../src/services/retriever.service')
const { getWeakConcepts } = require('../src/services/mastery.service')
const agent = require('../src/services/agent.service')
const db = require('../src/config/database')

const U = '44444444-4444-4444-4444-444444444444'
const hr = (s) => '\n' + '='.repeat(74) + '\n' + s + '\n' + '='.repeat(74)
const chapters = (r) => [...new Set(r.chunks.map((c) => c.metadata && c.metadata.chapter))].join(', ')
const concepts = (r) => r.chunks.slice(0, 6).map((c) => c.metadata && c.metadata.concept)

async function main() {
  await db.$executeRaw`DELETE FROM student_concepts WHERE "userId" = ${U}::uuid`

  console.log(hr('CRITERION 1 — Escape Velocity retrieves Gravitation'))
  const ev = await retrieve({ query: 'how do we calculate escape velocity', subject: 'Physics', topK: 6 })
  console.log('chapters:', chapters(ev), '| tier:', ev.confidenceTier, '| topSim:', ev.topSimilarity)
  console.log('PASS:', ev.chunks.every((c) => c.metadata.chapter === 'Gravitation') && ev.chunks.length > 0)

  console.log(hr('CRITERION 2 — Impulse retrieves Momentum'))
  const im = await retrieve({ query: 'explain impulse', subject: 'Physics', topK: 6 })
  console.log('resolved concept:', im.concept && im.concept.name, '| prereqs:', im.prereqConcepts.join(', '))
  console.log('result concepts:', concepts(im).join(' | '))
  const momentumHit = concepts(im).some((c) => /momentum/i.test(c || '')) || im.prereqConcepts.some((p) => /momentum/i.test(p))
  console.log('PASS:', momentumHit)

  console.log(hr('CRITERION 3 — Retrieval confidence'))
  for (const q of ['how do we calculate escape velocity', 'explain impulse', 'what is the capital of France']) {
    const r = await retrieve({ query: q, subject: 'Physics', topK: 3 })
    console.log(`  "${q}" → tier=${r.confidenceTier} topSim=${r.topSimilarity} grounded=${r.grounded}`)
  }

  console.log(hr('CRITERION 5 — Quiz results update mastery'))
  const q1 = await agent.ask({ userId: U, text: 'Quiz me on gravitation', subject: 'Physics' })
  console.log('quiz on concept:', q1.concept && q1.concept.name, '| pending.conceptId set:', !!(q1.pending && q1.pending.conceptId))
  const wrong = await agent.ask({ userId: U, text: "I don't know", subject: 'Physics', pending: q1.pending })
  console.log('answered wrong → verdict:', wrong.verdict)
  await new Promise((r) => setTimeout(r, 600)) // let the fire-and-forget mastery write land
  const after1 = await db.$queryRaw`SELECT c.name, sc.mastery, sc.weakness, sc."quizTotal", sc."quizCorrect" FROM student_concepts sc JOIN concepts c ON c.id=sc.concept_id WHERE sc."userId"=${U}::uuid`
  console.log('mastery after wrong quiz:', JSON.stringify(after1.map((r) => ({ concept: r.name, mastery: Number(r.mastery).toFixed(2), weakness: Number(r.weakness).toFixed(2), quiz: `${r.quizCorrect}/${r.quizTotal}` }))))

  const q2 = await agent.ask({ userId: U, text: 'Quiz me on gravitation', subject: 'Physics' })
  const right = await agent.ask({ userId: U, text: q2.pending.answer, subject: 'Physics', pending: q2.pending })
  console.log('answered correctly → verdict:', right.verdict)
  await new Promise((r) => setTimeout(r, 600))

  console.log(hr('CRITERION 4 — Weak concepts tracked'))
  // add a couple of doubts to build evidence/confidence
  await agent.ask({ userId: U, text: 'I am confused about gravitational force', subject: 'Physics' })
  await new Promise((r) => setTimeout(r, 600))
  const weak = await getWeakConcepts(U, { subject: 'Physics', limit: 6 })
  weak.forEach((w) => console.log(`  ${w.chapter} > ${w.concept}: mastery=${w.mastery} weakness=${w.weakness} conf=${w.confidence} quiz=${w.quizCorrect}/${w.quizTotal} doubts=${w.doubts}`))
  console.log('PASS:', weak.length > 0)

  await db.$executeRaw`DELETE FROM student_concepts WHERE "userId" = ${U}::uuid`
  console.log('\n(demo data cleaned up)')
}

main().then(() => process.exit(0)).catch((e) => { console.error('DEMO ERROR:', e); process.exit(1) })
