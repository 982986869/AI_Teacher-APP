'use strict'
// Live demo report for the AI Teacher agent. Calls the real internals (intent,
// retrieval, generation, guard) so every stage is visible. Run from server/:
//   node scripts/demo-report.js
require('dotenv').config()

const { buildIntentSystemPrompt } = require('../src/prompts/intentClassify.prompt')
const { buildTeacherSystemPrompt } = require('../src/prompts/teacherResponse.prompt')
const { ask } = require('../src/services/agent.service')
const { retrieve } = require('../src/services/retriever.service')
const { applyGuard } = require('../src/utils/responseGuard')
const { getAIProvider } = require('../src/providers')

const ms = () => Date.now()
const hr = (s) => '\n' + '='.repeat(78) + '\n' + s + '\n' + '='.repeat(78)
const ind = (t) => String(t || '').split('\n').map((l) => '   ' + l).join('\n')

async function main() {
  // ── 1 & 2: exact prompts ──────────────────────────────────────────────────
  console.log(hr('1. INTENT CLASSIFICATION PROMPT (exact system prompt)'))
  console.log(buildIntentSystemPrompt())

  console.log(hr('2. TEACHER GENERATOR PROMPT (exact — shown with real retrieved context)'))
  const sampleRetrieval = await retrieve({ query: 'how to find escape velocity', subject: 'Physics', topK: 2 })
  console.log(buildTeacherSystemPrompt({
    intent: 'doubt',
    language: 'hinglish',
    contexts: sampleRetrieval.chunks.slice(0, 2),
    lesson: { lessonTitle: 'Gravitation', subject: 'Physics', gradeLevel: '11' },
  }))

  // ── 3: example responses across intents (also used for latency) ───────────
  const QUERIES = [
    { label: 'concept_explanation', body: { text: "Explain Newton's first law of motion", subject: 'Physics' } },
    { label: 'doubt (Hinglish)', body: { text: 'Sir escape velocity kaise nikalte hain?', subject: 'Physics' } },
    { label: 'formula', body: { text: 'What is the formula for kinetic energy?', subject: 'Physics' } },
    { label: 'example_request', body: { text: "Give me one example of Newton's third law", subject: 'Physics' } },
    { label: 'quiz_request', body: { text: 'Quiz me on gravitation', subject: 'Physics' } },
    { label: 'off_topic', body: { text: 'Do you like pizza?', subject: 'Physics' } },
    { label: 'concept (Biology)', body: { text: 'What is photosynthesis?', subject: 'Biology' } },
    { label: 'formula (Maths)', body: { text: 'formula for the diagonal of a square', subject: 'Mathematics' } },
    { label: 'concept (Chemistry)', body: { text: 'What is an acid?', subject: 'Chemistry' } },
    { label: 'concept (inertia)', body: { text: 'What is inertia?', subject: 'Physics' } },
  ]

  console.log(hr('3. EXAMPLE RESPONSES + 6. LATENCY (10 live queries)'))
  const timings = []
  for (const q of QUERIES) {
    const t0 = ms()
    const r = await ask({ userId: 'demo', text: q.body.text, subject: q.body.subject })
    const dt = ms() - t0
    timings.push({ label: q.label, dt, intent: r.intent, via: r.intentVia, grounded: r.grounded })
    console.log(`\n— ${q.label} —  (${dt} ms)`)
    console.log(`   Q: ${q.body.text}`)
    console.log(`   intent=${r.intent} (${r.intentVia})  lang=${r.language}  grounded=${r.grounded}  conf=${r.confidence}  src=${(r.sources || []).map((s) => s.chapter || s.title).slice(0, 2).join(', ')}`)
    console.log(`   guard=${JSON.stringify(r.guard || {})}`)
    console.log('   A:\n' + ind(r.answer))
  }

  // ── 4: old vs new ─────────────────────────────────────────────────────────
  console.log(hr('4. OLD (lesson-grounded doubt) vs NEW (agent)'))
  const question = 'Why does a heavier object not fall faster than a lighter one?'
  const syntheticLesson = {
    topic: 'Gravitation', subject: 'Physics', gradeLevel: '11', lessonTitle: 'Gravitation',
    summary: 'Gravitation, free fall, and acceleration due to gravity.',
    keyTerms: ['gravity', 'free fall', 'acceleration', 'mass'],
    slides: [{ slideNumber: 1, slideTitle: 'Free fall', explanation: 'All objects fall with the same acceleration g in the absence of air resistance.' }],
  }
  console.log('Q: ' + question + '\n')
  const tOld = ms()
  const oldAns = await getAIProvider().answerDoubt(question, syntheticLesson, [], 0)
  console.log(`OLD doubt path (lesson context only, no RAG, no guard)  (${ms() - tOld} ms):`)
  console.log(ind(oldAns))
  const tNew = ms()
  const newRes = await ask({ userId: 'demo', text: question, subject: 'Physics' })
  console.log(`\nNEW agent (intent + curriculum RAG + guard)  (${ms() - tNew} ms):`)
  console.log(`   [intent=${newRes.intent} grounded=${newRes.grounded} conf=${newRes.confidence} src=${(newRes.sources || []).map((s) => s.chapter).join(', ')}]`)
  console.log(ind(newRes.answer))

  // ── 5: full traced flow for one question ──────────────────────────────────
  console.log(hr('5. FULL ASK FLOW TRACE (stage-by-stage)'))
  const traceQ = 'Sir escape velocity kaise nikalte hain?'
  console.log('STUDENT: ' + traceQ + '\n')
  const provider = getAIProvider()

  let t = ms()
  const intentRes = await provider.classifyIntent(traceQ)
  console.log(`[1] INTENT   (${ms() - t} ms): ` + JSON.stringify(intentRes))

  t = ms()
  const ret = await retrieve({ query: traceQ, subject: 'Physics', minSimilarity: 0.4 })
  console.log(`[2] RETRIEVE (${ms() - t} ms): grounded=${ret.grounded} topSim=${ret.topSimilarity} chunks=${ret.chunks.length}`)
  ret.chunks.slice(0, 3).forEach((c) => console.log(`       [${c.similarity.toFixed(3)}] ${c.content.split('\n')[0]}`))

  t = ms()
  const raw = await provider.generateTeacherResponse({
    intent: intentRes.intent, language: intentRes.language, contexts: ret.chunks,
    lesson: null, history: [], question: traceQ,
  })
  console.log(`[3] GENERATE (${ms() - t} ms) raw:\n` + ind(raw))

  const guarded = applyGuard(raw, { language: intentRes.language })
  console.log(`[4] GUARD    flags=${JSON.stringify(guarded.flags)} ->\n` + ind(guarded.text))

  console.log(`[5] RESUME   resumeCue (when in a lesson) = "Let's continue." / "Chalo, aage badhte hain."`)

  // ── 6: latency summary ────────────────────────────────────────────────────
  console.log(hr('6. LATENCY over 10 queries'))
  const xs = timings.map((x) => x.dt)
  const avg = Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)
  console.log(timings.map((x) => `   ${String(x.dt).padStart(6)} ms  ${x.intent.padEnd(20)} (${x.via})  ${x.label}`).join('\n'))
  console.log(`\n   AVG ${avg} ms  |  MIN ${Math.min(...xs)} ms  |  MAX ${Math.max(...xs)} ms`)
  console.log(`   rule-intent queries are faster (skip the classify LLM call).`)
}

main().then(() => process.exit(0)).catch((e) => { console.error('DEMO ERROR:', e); process.exit(1) })
