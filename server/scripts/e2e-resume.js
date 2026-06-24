'use strict'
// Verifies the resume controller (resumeCue + resumeSlideIndex when a lessonId is
// present) and that the Mathematics corpus grounds. Self-contained (modules resolve
// by file location), so it can run with an absolute path regardless of cwd.
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const BASE = 'http://localhost:5099'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(BASE + '/api/health'); if (r.ok) break } catch (e) {}
    await sleep(1000)
  }
  const p = new PrismaClient()
  const u = await p.user.findFirst({ select: { id: true } })
  await p.$disconnect()
  const tok = jwt.sign({ sub: u.id }, 'testsecret123', { expiresIn: '10m' })

  const ask = async (body) => {
    const r = await fetch(BASE + '/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
      body: JSON.stringify(body),
    })
    return (await r.json()).data
  }

  const a = await ask({ text: 'What is inertia?', subject: 'Physics', lessonId: '00000000-0000-0000-0000-000000000000', slideIndex: 1 })
  console.log('RESUME CONTROLLER: intent=' + a.intent + ' grounded=' + a.grounded
    + ' resumeCue=' + JSON.stringify(a.resumeCue) + ' resumeSlideIndex=' + a.resumeSlideIndex)
  console.log('  answer:', String(a.answer).replace(/\n/g, ' / ').slice(0, 130))

  const b = await ask({ text: 'formula for the diagonal of a square', subject: 'Mathematics' })
  console.log('MATHS CORPUS: intent=' + b.intent + ' grounded=' + b.grounded + ' conf=' + b.confidence
    + ' src=' + (b.sources[0] && (b.sources[0].chapter || b.sources[0].title)))
  console.log('  answer:', String(b.answer).replace(/\n/g, ' / ').slice(0, 130))
})().catch((e) => { console.log('ERR', e.message); process.exit(1) })
