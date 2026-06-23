'use strict'
// Verifies POST /api/ai/ask/stream emits meta -> delta… -> done over SSE.
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')
const BASE = 'http://localhost:5099'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  for (let i = 0; i < 40; i++) { try { const r = await fetch(BASE + '/api/health'); if (r.ok) break } catch (e) {} await sleep(1000) }
  const p = new PrismaClient(); const u = await p.user.findFirst({ select: { id: true } }); await p.$disconnect()
  const tok = jwt.sign({ sub: u.id }, 'testsecret123', { expiresIn: '10m' })

  const t0 = Date.now(); let first = null; let deltas = 0; let meta = null; let done = null; let buf = ''
  const res = await fetch(BASE + '/api/ai/ask/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
    body: JSON.stringify({ text: 'What is inertia?', subject: 'Physics' }),
  })
  const reader = res.body.getReader(); const dec = new TextDecoder()
  for (;;) {
    const { done: d, value } = await reader.read(); if (d) break
    buf += dec.decode(value, { stream: true })
    let idx
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const raw = buf.slice(0, idx); buf = buf.slice(idx + 2)
      let ev = 'message'; let data = ''
      for (const line of raw.split('\n')) { if (line.startsWith('event:')) ev = line.slice(6).trim(); else if (line.startsWith('data:')) data += line.slice(5).trim() }
      let j = {}; try { j = JSON.parse(data) } catch (e) {}
      if (ev === 'meta') meta = j
      else if (ev === 'delta') { if (first == null) first = Date.now() - t0; deltas++ }
      else if (ev === 'done') done = j
    }
  }
  console.log('meta:', JSON.stringify(meta))
  console.log('deltas:', deltas, '| first token at', first + 'ms | total', (Date.now() - t0) + 'ms')
  console.log('done.answer:', String((done && done.answer) || '').replace(/\n/g, ' / ').slice(0, 110))
  console.log('done.expecting:', done && done.expecting, '| pending:', done && done.pending && done.pending.kind)
})().catch((e) => { console.error(e); process.exit(1) })
