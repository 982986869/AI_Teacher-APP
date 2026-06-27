'use strict'

// Live verification that the AI Teacher now USES the backend engines — runs real
// conversations (real Claude) for several personas and checks the replies are
// personalised AND never leak raw scores.  node scripts/teacher-verify.js
require('dotenv').config() // real env → MOCK_AI=false, real Claude key

const db = require('../src/config/database')
const agent = require('../src/services/agent.service')
const bgMastery = require('../src/services/braingym/mastery')
const { getAIProvider } = require('../src/providers')

const LEAK = /\d+\s*%|\bmastery\b|\byour score\b|\bNN%\b|\baccuracy is\b/i

async function ensureUser(name, grade = 'Class 9') {
  let u = await db.user.findFirst({ where: { name }, select: { id: true } })
  if (!u) u = await db.user.create({ data: { name, grade }, select: { id: true } })
  return u.id
}

async function conversation(label, userId, text) {
  let reply = '(no reply)'
  try {
    const r = await agent.ask({ userId, text })
    reply = (r && r.answer) || '(empty)'
  } catch (e) { reply = `ERROR: ${e.message}` }
  const leaks = LEAK.test(reply)
  console.log(`\n── ${label} ──\nQ: ${text}\nA: ${reply}\n   [leak check: ${leaks ? '❌ leaked a score!' : '✅ number-free'}]`)
  return { reply, leaks }
}

async function main() {
  // Personas
  const newUser = await ensureUser('Teacher Verify New')
  const strongUser = await ensureUser('Teacher Verify Strong')
  const richUser = await ensureUser('BrainGym Verify') // has a Forgotten Maths concept + BrainGym history + mistakes

  // Seed a strong BrainGym skill for the strong persona (reasoning).
  for (let i = 0; i < 4; i++) await bgMastery.applySessionResult(db, { userId: strongUser, category: 'reasoning', grade: 'Class 9', correct: 5, total: 5 })

  // 1. CUE GENERATION from real data (subject-agnostic) ───────────────────────
  const cuesNew = await agent.gatherMemoryCues({ userId: newUser, currentConceptName: 'X' })
  const cuesStrong = await agent.gatherMemoryCues({ userId: strongUser, currentConceptName: 'X' })
  const cuesRich = await agent.gatherMemoryCues({ userId: richUser, currentConceptName: 'X' })
  console.log('cues(new)   →', JSON.stringify(cuesNew))
  console.log('cues(strong)→', JSON.stringify(cuesStrong))
  console.log('cues(rich)  →', JSON.stringify(cuesRich))

  // 2. LIVE CONVERSATIONS (real Claude) ───────────────────────────────────────
  const c1 = await conversation('NEW student', newUser, 'Can you explain what acceleration means?')
  const c2 = await conversation('STRONG student (reasoning improving)', strongUser, 'Explain Newtons second law in short')
  const c3 = await conversation('RETURNING student (forgotten topic + BrainGym history)', richUser, 'Help me understand how to evaluate a polynomial')

  // 2b. ON-TOPIC memory weaving (the realistic case: the student is asking about
  // the very concept they struggled with). Drives generateTeacherResponse directly
  // with the studentContext conceptMemory would build, so we can see the callback.
  const weakCtx = {
    conceptName: 'Relative Velocity', chapter: 'Relative Velocity', status: 'weak',
    strugglingBefore: true, faded: false, gap: null, prereqs: [],
    memoryCues: ["This student's reasoning has been improving lately — you may acknowledge it warmly."],
  }
  let weave = '(no reply)'
  try {
    weave = await getAIProvider().generateTeacherResponse({
      intent: 'concept_explanation', language: 'en', contexts: [], lesson: null, history: [],
      question: 'Can you explain relative velocity again?', level: 'beginner', studentContext: weakCtx,
    })
  } catch (e) { weave = `ERROR: ${e.message}` }
  const weaveLeaks = LEAK.test(weave)
  const weaveRefs = /relative velocity|last time|tricky|gentl|before|again|struggl/i.test(weave)
  console.log(`\n── WEAK student, struggled before (on-topic recall) ──\nQ: Can you explain relative velocity again?\nA: ${weave}\n   [leak: ${weaveLeaks ? '❌' : '✅'} | references memory: ${weaveRefs ? '✅' : '⚠️ no'}]`)

  // 3. Assertions ─────────────────────────────────────────────────────────────
  const ok =
    Array.isArray(cuesNew) && cuesNew.length === 0 &&                       // new student → no fabricated memory
    cuesStrong.some((c) => /reasoning/i.test(c) && /improv/i.test(c)) &&     // strong → skill trend cue
    cuesRich.length >= 1 &&                                                  // rich → at least one memory cue
    !c1.leaks && !c2.leaks && !c3.leaks && !weaveLeaks &&                    // never leak a raw score
    c1.reply && c2.reply && c3.reply &&
    !/^ERROR/.test(c1.reply) && !/^ERROR/.test(c2.reply) && !/^ERROR/.test(c3.reply) &&
    !/^ERROR/.test(weave) && weaveRefs                                       // on-topic memory is actually woven in

  console.log(ok ? '\n✅ TEACHER VERIFY PASSED' : '\n❌ TEACHER VERIFY FAILED')
  await db.$disconnect()
  process.exit(ok ? 0 : 1)
}

main().catch((e) => { console.error('VERIFY ERROR', e); process.exit(1) })
