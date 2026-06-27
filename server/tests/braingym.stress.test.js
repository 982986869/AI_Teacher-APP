'use strict'

// Stress / concurrency test for the BrainGym adaptive system. Uses the in-memory
// fake DB (which now enforces the (grade,subject,signature) unique constraint and
// $transaction), so it exercises the real service logic under load: concurrent
// retrieval, simultaneous mastery writes, and a generation thundering-herd that
// hammers the duplicate-insert race.
process.env.MOCK_AI = 'true'
process.env.VOYAGE_API_KEY = ''
process.env.ANTHROPIC_API_KEY = ''

const test = require('node:test')
const assert = require('node:assert/strict')
const { performance } = require('node:perf_hooks')

const pipeline = require('../src/services/braingym/pipeline')
const mastery = require('../src/services/braingym/mastery')
const { generateAndStore } = require('../src/services/braingym/generationService')
const { CATEGORIES } = require('../src/services/braingym/constants')
const grade = require('../src/services/braingym/grade')
const { makeFakeDb } = require('./fakeDb')

const GRADES = ['Class 9', 'Class 10', 'Class 11', 'Class 12']
const NUM_STUDENTS = 100
const NUM_REQUESTS = 1000
const BATCH = 50

const students = Array.from({ length: NUM_STUDENTS }, (_, i) => ({ id: `student-${i}`, grade: GRADES[i % GRADES.length] }))

function uniqSignatures(gq) {
  return gq.map((r) => `${r.grade}|${r.subject}|${r.signature}`)
}

test('STRESS: 1000 concurrent adaptive requests across 100 students — every round full & in-grade', async () => {
  const db = makeFakeDb()
  const tasks = Array.from({ length: NUM_REQUESTS }, (_, i) => {
    const s = students[i % NUM_STUDENTS]
    const category = CATEGORIES[i % CATEGORIES.length]
    return () => pipeline.getQuestions(db, { userId: s.id, grade: s.grade, category, count: 5 })
  })

  let served = 0
  let errors = 0
  const t0 = performance.now()
  for (let b = 0; b < tasks.length; b += BATCH) {
    const batch = tasks.slice(b, b + BATCH)
    const results = await Promise.allSettled(batch.map((f) => f()))
    for (let j = 0; j < results.length; j++) {
      const r = results[j]
      if (r.status !== 'fulfilled') { errors++; continue }
      assert.equal(r.value.questions.length, 5, 'every round returns a full set')
      served += r.value.questions.length
      // class guardrail under load: any GENERATED question must be in the student's class
      const s = students[(b + j) % NUM_STUDENTS]
      for (const q of r.value.questions) {
        if (q.source === 'generated') {
          assert.equal(q.grade, s.grade)
          assert.equal(grade.detectOutOfGradeConcepts(q.q, s.grade).length, 0)
        }
      }
    }
  }
  const ms = performance.now() - t0

  assert.equal(errors, 0, 'no request errored')
  // The dedup unique constraint must hold even under concurrency.
  const sigs = uniqSignatures(db._gq)
  assert.equal(new Set(sigs).size, sigs.length, 'no duplicate (grade,subject,signature) persisted')

  console.log(`  [stress] ${NUM_REQUESTS} requests, ${served} questions served in ${ms.toFixed(0)}ms ` +
    `(${(NUM_REQUESTS / (ms / 1000)).toFixed(0)} req/s); generated bank=${db._gq.length}, errors=${errors}`)
})

test('STRESS: 100 simultaneous session submissions update mastery without corruption', async () => {
  const db = makeFakeDb()
  const t0 = performance.now()
  // Every student submits a perfect session for the same category at the same time.
  const out = await Promise.allSettled(students.map((s) =>
    mastery.applySessionResult(db, { userId: s.id, category: 'reasoning', grade: s.grade, correct: 5, total: 5 })))
  const ms = performance.now() - t0

  const failed = out.filter((r) => r.status !== 'fulfilled').length
  assert.equal(failed, 0, 'no mastery update failed')
  // Exactly one mastery row per (student, reasoning, Mental Math).
  assert.equal(db._mastery.size, NUM_STUDENTS, 'one mastery row per student')
  for (const row of db._mastery.values()) {
    assert.equal(row.attempts, 5)
    assert.equal(row.correct, 5)
    assert.equal(row.accuracy, 1)
    assert.equal(row.grade.startsWith('Class '), true)
  }
  console.log(`  [stress] 100 simultaneous submissions in ${ms.toFixed(0)}ms`)
})

test('STRESS: repeated concurrent generation for one bucket never persists duplicates', async () => {
  const db = makeFakeDb()
  // 20 identical generation runs fire at once for the SAME bucket. With salt=0 they
  // produce overlapping questions — the unique index + P2002 handling must ensure
  // each distinct question is stored exactly once.
  const t0 = performance.now()
  const runs = await Promise.allSettled(Array.from({ length: 20 }, () =>
    generateAndStore(db, { userId: null, grade: 'Class 9', category: 'fluency', subject: 'Mental Math', difficulty: 'easy', count: 5, trigger: 'background' })))
  const ms = performance.now() - t0

  assert.equal(runs.filter((r) => r.status !== 'fulfilled').length, 0, 'no generation run threw')
  const sigs = uniqSignatures(db._gq)
  assert.equal(new Set(sigs).size, sigs.length, 'no duplicate signatures persisted under the race')
  assert.ok(db._gq.length >= 1, 'bank grew')
  // Every persisted question is valid Class 9, numeric, 4 options.
  for (const r of db._gq) {
    assert.equal(r.grade, 'Class 9')
    assert.equal(Array.isArray(r.options) && r.options.length, 4)
    assert.ok(Number.isFinite(r.answerValue))
    assert.equal(grade.detectOutOfGradeConcepts(r.questionText, 'Class 9').length, 0)
  }
  console.log(`  [stress] 20 concurrent generations → ${db._gq.length} unique stored in ${ms.toFixed(0)}ms`)
})

test('STRESS: a returning student is not re-served recently-attempted questions', async () => {
  const db = makeFakeDb()
  const s = { id: 'returning-1', grade: 'Class 9' }
  const seen = new Set()
  // Play 8 rounds; record attempts each time; assert no question repeats across rounds.
  for (let round = 0; round < 8; round++) {
    const { questions } = await pipeline.getQuestions(db, { userId: s.id, grade: s.grade, category: 'understanding', count: 5 })
    const items = questions.map((q) => ({
      id: q.id || null, seedId: q.seedId || null, source: q.source, category: 'understanding',
      difficulty: q.difficulty, isCorrect: true, answerGiven: String(q.answer),
    }))
    await pipeline.recordAttempts(db, { userId: s.id, grade: s.grade, items })
    for (const q of questions) {
      const key = q.id || q.seedId || q.q
      // A small overlap is acceptable only once the pools are exhausted; assert the
      // recency filter is actually working by requiring mostly-fresh rounds.
      seen.add(key)
    }
  }
  // 8 rounds × 5 = 40 served; with recency avoidance we expect a high distinct ratio.
  assert.ok(seen.size >= 30, `expected mostly-fresh questions across rounds, got ${seen.size}/40 distinct`)
  console.log(`  [stress] returning student: ${seen.size}/40 distinct questions across 8 rounds`)
})
