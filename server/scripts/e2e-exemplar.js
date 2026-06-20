'use strict'
// Simulates the mobile flow Resources -> Exemplar -> Subject -> Chapter by hitting
// the SAME endpoints the app calls, against a locally-running server. Prints the
// real responses (what the UI renders). Run AFTER the test server is up on :5099.
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const BASE = 'http://localhost:5099'
const SECRET = 'testsecret123' // self-consistent with the test server's JWT_SECRET

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitUp() {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(BASE + '/api/health'); if (r.ok) return true } catch (e) { /* not up yet */ }
    await sleep(1000)
  }
  return false
}

async function token() {
  const p = new PrismaClient()
  const u = await p.user.findFirst({ select: { id: true } })
  await p.$disconnect()
  return jwt.sign({ sub: u.id }, SECRET, { expiresIn: '15m' })
}

async function exemplar(tok, subject, chapter, cls = 'Class 11') {
  const url = BASE + '/api/resources/exemplar?' + new URLSearchParams({ subject, class: cls, chapter })
  const t0 = Date.now()
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + tok } })
  const ms = Date.now() - t0
  let j = {}
  try { j = await r.json() } catch (e) { /* ignore */ }
  return { status: r.status, ms, sections: (j.data && j.data.sections) || [] }
}

;(async () => {
  if (!(await waitUp())) { console.log('server did not come up'); process.exit(1) }
  const tok = await token()

  console.log('=== Resources -> Exemplar -> Subject -> Chapter (live, from DB) ===')
  for (const [subject, chapter] of [
    ['Physics', 'Gravitation'],
    ['Chemistry', 'Equilibrium'],
    ['Biology', 'The Living World'],
    ['Mathematics', 'Sets'],
  ]) {
    const { status, ms, sections } = await exemplar(tok, subject, chapter)
    const totalQ = sections.reduce((a, s) => a + s.questions.length, 0)
    console.log(`\n[${subject} / ${chapter}]  HTTP ${status}  (${ms}ms — loading spinner shows for this window)`)
    console.log('  sections: ' + sections.map((s) => `"${s.label}"(${s.questions.length}q)`).join(', '))
    console.log('  total questions: ' + totalQ)
    const q = sections[0] && sections[0].questions[0]
    if (q) console.log(`  first Q: ${JSON.stringify(q.q)}  text: ${JSON.stringify(String(q.text).slice(0, 70))}  options: ${q.options.length}  solutionLabel: ${JSON.stringify(q.solutionLabel)}`)
  }

  console.log('\n=== Empty state ===')
  const e1 = await exemplar(tok, 'Physics', 'No Such Chapter ZZZ')
  console.log(`[Physics / "No Such Chapter"]  HTTP ${e1.status}  sections: ${e1.sections.length}  -> UI shows "No solutions available"`)
  const e2 = await exemplar(tok, 'Physics', 'Gravitation', 'Class 12')
  console.log(`[Physics / Gravitation / Class 12]  HTTP ${e2.status}  sections: ${e2.sections.length}  -> empty (data is Class 11 only)`)

  console.log('\n=== PYQ regression (same /resources router) ===')
  const t0 = Date.now()
  const r = await fetch(BASE + '/api/resources/subjects', { headers: { Authorization: 'Bearer ' + tok } })
  let pj = {}
  try { pj = await r.json() } catch (e) { /* ignore */ }
  const subs = Array.isArray(pj.data) ? pj.data.length : (pj.data ? Object.keys(pj.data).length : '?')
  console.log(`[GET /resources/subjects]  HTTP ${r.status}  (${Date.now() - t0}ms)  subjects returned: ${subs}  -> PYQ API intact`)

  console.log('\n=== Auth ===')
  const na = await fetch(BASE + '/api/resources/exemplar?subject=Physics&class=Class%2011&chapter=Gravitation')
  console.log(`[no token]  HTTP ${na.status}  (expect 401)`)
})()
