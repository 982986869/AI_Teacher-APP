'use strict'
// Simulates Resources -> NCERT Part-II -> Subject -> Chapter by hitting the SAME
// endpoints the app calls, against a locally-running server. Prints real responses.
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const BASE = 'http://localhost:5099'
const SECRET = 'testsecret123'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitUp() {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(BASE + '/api/health'); if (r.ok) return true } catch (e) { /* not up */ }
    await sleep(1000)
  }
  return false
}
async function token() {
  const p = new PrismaClient(); const u = await p.user.findFirst({ select: { id: true } })
  await p.$disconnect(); return jwt.sign({ sub: u.id }, SECRET, { expiresIn: '15m' })
}
async function chapters(tok, subject, part = 2, cls = 'Class 11') {
  const u = BASE + '/api/resources/ncert/chapters?' + new URLSearchParams({ part, subject, class: cls })
  const r = await fetch(u, { headers: { Authorization: 'Bearer ' + tok } })
  let j = {}; try { j = await r.json() } catch (e) {}
  return { status: r.status, chapters: (j.data && j.data.chapters) || [] }
}
async function sections(tok, subject, chapter, part = 2, cls = 'Class 11') {
  const u = BASE + '/api/resources/ncert?' + new URLSearchParams({ part, subject, class: cls, chapter })
  const t0 = Date.now(); const r = await fetch(u, { headers: { Authorization: 'Bearer ' + tok } })
  const ms = Date.now() - t0; let j = {}; try { j = await r.json() } catch (e) {}
  return { status: r.status, ms, sections: (j.data && j.data.sections) || [] }
}
const fmt = (secs) => secs.map((s) => `${s.label}(${s.html == null ? 'null' : s.html.length + 'ch'})`).join(', ')

;(async () => {
  if (!(await waitUp())) { console.log('server did not come up'); process.exit(1) }
  const tok = await token()

  console.log('=== NCERT Part-II -> Subject -> chapter list (from DB) ===')
  for (const subj of ['Physics', 'Chemistry', 'Biology', 'Mathematics']) {
    const { status, chapters: ch } = await chapters(tok, subj)
    console.log(`[${subj}]  HTTP ${status}  chapters: ${ch.length}  first3: ${ch.slice(0, 3).join(' | ')}`)
  }

  console.log('\n=== Chapter -> sections (html from DB) ===')
  for (const [subj, chap] of [['Mathematics', 'Sets'], ['Biology', 'The Living World'], ['Chemistry', 'Hydrocarbons']]) {
    const { status, ms, sections: secs } = await sections(tok, subj, chap)
    console.log(`[${subj} / ${chap}]  HTTP ${status}  (${ms}ms)  ${secs.length} sections: ${fmt(secs)}`)
  }

  console.log('\n=== null "coming soon" section preserved verbatim ===')
  const osc = await sections(tok, 'Physics', 'Oscillations')
  console.log(`[Physics / Oscillations]  ${osc.sections.length} sections: ${fmt(osc.sections)}`)

  console.log('\n=== empty / Part-I (no content) ===')
  const e1 = await sections(tok, 'Physics', 'No Such Chapter ZZZ')
  console.log(`[Physics / "No Such Chapter"]  HTTP ${e1.status}  sections: ${e1.sections.length}  -> empty state`)
  const p1 = await chapters(tok, 'Physics', 1)
  console.log(`[Physics / part=1 chapters]  chapters: ${p1.chapters.length}  -> Part-I has no content (UI unchanged)`)

  console.log('\n=== regressions ===')
  const r = await fetch(BASE + '/api/resources/subjects', { headers: { Authorization: 'Bearer ' + tok } })
  let pj = {}; try { pj = await r.json() } catch (e) {}
  console.log(`[PYQ /subjects]  HTTP ${r.status}  subjects: ${Array.isArray(pj.data) ? pj.data.length : (pj.data ? Object.keys(pj.data).length : '?')}`)
  const ex = await fetch(BASE + '/api/resources/exemplar?subject=Physics&class=Class%2011&chapter=Gravitation', { headers: { Authorization: 'Bearer ' + tok } })
  let ej = {}; try { ej = await ex.json() } catch (e) {}
  console.log(`[Exemplar Physics/Gravitation]  HTTP ${ex.status}  sections: ${(ej.data && ej.data.sections && ej.data.sections.length) || 0}`)

  console.log('\n=== auth ===')
  const na = await fetch(BASE + '/api/resources/ncert?subject=Mathematics&class=Class%2011&chapter=Sets')
  console.log(`[no token]  HTTP ${na.status}  (expect 401)`)
})()
