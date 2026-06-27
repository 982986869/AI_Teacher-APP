'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const L = require('../src/services/masteryLifecycle')

const DAY = 86400000
const ago = (days) => new Date(Date.now() - days * DAY)

// ── Forgetting curve ────────────────────────────────────────────────────────
test('retention ≈ mastery right after practice, and decays toward 0 over time', () => {
  const fresh = L.computeRetention({ mastery: 0.9, lastSeen: ago(0), evidenceCount: 1 })
  assert.ok(fresh > 0.88 && fresh <= 0.9, `fresh retention ~mastery, got ${fresh}`)
  const old = L.computeRetention({ mastery: 0.9, lastSeen: ago(120), evidenceCount: 1 })
  assert.ok(old < 0.2, `decays a lot after months, got ${old}`)
  assert.ok(old < fresh)
})

test('stronger/streakier concepts decay SLOWER (higher stability)', () => {
  const weakMem = L.computeRetention({ mastery: 0.9, lastSeen: ago(20), streak: 0, evidenceCount: 1 })
  const strongMem = L.computeRetention({ mastery: 0.9, lastSeen: ago(20), streak: 12, evidenceCount: 20 })
  assert.ok(strongMem > weakMem, `streak/evidence slows forgetting (${strongMem} > ${weakMem})`)
  assert.ok(L.stabilityDays({ mastery: 0.9, streak: 12, evidenceCount: 20 }) > L.stabilityDays({ mastery: 0.9 }))
})

// ── State machine (all 7 states) ────────────────────────────────────────────
test('classifyState covers New → Learning → Improving → Strong → Mastered', () => {
  assert.equal(L.classifyState({ evidenceCount: 0 }), 'New')
  assert.equal(L.classifyState({ mastery: 0.3, evidenceCount: 3, retention: 0.3 }), 'Learning')
  assert.equal(L.classifyState({ mastery: 0.5, evidenceCount: 5, retention: 0.8 }), 'Improving')
  assert.equal(L.classifyState({ mastery: 0.75, evidenceCount: 6, retention: 0.8 }), 'Strong')
  assert.equal(L.classifyState({ mastery: 0.9, confidence: 0.7, evidenceCount: 8, retention: 0.9 }), 'Mastered')
})

test('classifyState: decayed retention → Needs Revision → Forgotten (mastery untouched)', () => {
  assert.equal(L.classifyState({ mastery: 0.8, confidence: 0.7, evidenceCount: 6, retention: 0.4 }), 'Needs Revision')
  assert.equal(L.classifyState({ mastery: 0.8, confidence: 0.7, evidenceCount: 6, retention: 0.2 }), 'Forgotten')
})

test('lifecycle transitions over time for the same learned concept', () => {
  const base = { mastery: 0.88, confidence: 0.7, evidenceCount: 8, streak: 2 }
  const at = (days) => {
    const now = Date.now()
    const row = { ...base, lastSeen: new Date(now - days * DAY) }
    return L.deriveLifecycle(row, { now }).state
  }
  assert.equal(at(0), 'Mastered')        // just practised
  assert.equal(at(25), 'Needs Revision') // retention slipping
  assert.equal(at(120), 'Forgotten')     // faded
})

// ── Teacher phrasings ───────────────────────────────────────────────────────
test('statePhrasing produces natural teacher lines', () => {
  assert.match(L.statePhrasing('Mastered', 'Quadratic Equations'), /mastered Quadratic Equations/i)
  assert.match(L.statePhrasing('Improving', 'Relative Velocity'), /Relative Velocity is improving/i)
  assert.match(L.statePhrasing('Needs Revision', 'Trigonometry', { lastSeen: ago(31) }), /revise/i)
  assert.match(L.statePhrasing('Needs Revision', 'Trigonometry', { lastSeen: ago(31) }), /month/i)
  assert.match(L.statePhrasing('Forgotten', 'Probability', { lastSeen: ago(90) }), /faded|refresher/i)
})

// ── Speed score ─────────────────────────────────────────────────────────────
test('speedFromTime: fast → 1, slow → 0, mid → between', () => {
  assert.equal(L.speedFromTime(3000), 1)
  assert.equal(L.speedFromTime(60000), 0)
  const mid = L.speedFromTime(25000)
  assert.ok(mid > 0 && mid < 1)
  assert.equal(L.speedFromTime(0), null)
  assert.equal(L.speedFromTime(null), null)
})
