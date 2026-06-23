'use strict'
// Exercises POST /api/ai/ask across all 8 intents + language + grounding, against
// a locally-running server. Prints intent, language, grounding, sources, answer.
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const BASE = 'http://localhost:5099'
const SECRET = 'testsecret123'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitUp() {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(BASE + '/api/health'); if (r.ok) return true } catch (e) {}
    await sleep(1000)
  }
  return false
}
async function token() {
  const p = new PrismaClient(); const u = await p.user.findFirst({ select: { id: true } })
  await p.$disconnect(); return jwt.sign({ sub: u.id }, SECRET, { expiresIn: '15m' })
}
async function ask(tok, body) {
  const t0 = Date.now()
  const r = await fetch(BASE + '/api/ai/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
    body: JSON.stringify(body),
  })
  const ms = Date.now() - t0
  let j = {}; try { j = await r.json() } catch (e) {}
  return { status: r.status, ms, d: j.data || j }
}

const CASES = [
  { label: 'concept (EN)', body: { text: "Explain Newton's first law of motion", subject: 'Physics' } },
  { label: 'doubt (Hinglish)', body: { text: 'Sir escape velocity kaise nikalte hain gravitation me?', subject: 'Physics' } },
  { label: 'formula (EN)', body: { text: 'What is the formula for kinetic energy?', subject: 'Physics' } },
  { label: 'example (EN)', body: { text: "Give me one example of Newton's third law", subject: 'Physics' } },
  { label: 'quiz (EN)', body: { text: 'Quiz me on gravitation', subject: 'Physics' } },
  { label: 'revision (EN)', body: { text: 'Quick revision of laws of motion', subject: 'Physics' } },
  { label: 'off_topic', body: { text: 'Do you like pizza?', subject: 'Physics' } },
  { label: 'unclear', body: { text: 'asdfgh', subject: 'Physics' } },
  { label: 'not-in-material', body: { text: 'Explain quantum field theory renormalization', subject: 'Physics' } },
  { label: 'filler-strip check', body: { text: 'What is inertia?', subject: 'Physics' } },
]

;(async () => {
  if (!(await waitUp())) { console.log('server did not come up'); process.exit(1) }
  const tok = await token()
  for (const c of CASES) {
    const { status, ms, d } = await ask(tok, c.body)
    console.log(`\n— ${c.label} — HTTP ${status} (${ms}ms)`)
    if (status !== 200) { console.log('  ERROR:', JSON.stringify(d).slice(0, 200)); continue }
    console.log(`  intent=${d.intent} (${d.intentVia}) | lang=${d.language} | grounded=${d.grounded} | conf=${d.confidence} | sources=${(d.sources || []).map((s) => s.chapter || s.title).slice(0, 2).join(', ')}`)
    if (d.guard) console.log(`  guard: ${JSON.stringify(d.guard)}`)
    console.log('  answer: ' + String(d.answer || '').replace(/\n/g, ' / '))
  }
})()
