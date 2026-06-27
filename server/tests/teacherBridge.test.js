'use strict'

process.env.MOCK_AI = 'true'
process.env.VOYAGE_API_KEY = ''
process.env.ANTHROPIC_API_KEY = ''

const test = require('node:test')
const assert = require('node:assert/strict')
const bridge = require('../src/services/braingym/teacherBridge')
const { makeFakeDb } = require('./fakeDb')

test('recommendPractice: matched to class, BrainGym mastery, and the weakest concept', async () => {
  const db = makeFakeDb()
  const teacherMastery = { async getWeakConcepts() { return [{ concept: 'Linear equations', weakness: 0.8 }] } }
  const rec = await bridge.recommendPractice(
    db,
    { userId: 'u1', subject: 'Maths', chapter: 'Linear Equations', grade: 'Class 9' },
    { teacherMastery },
  )
  assert.equal(rec.practice, 'braingym')
  assert.equal(rec.category, 'application')
  assert.equal(rec.grade, 'Class 9')           // server class, never escalated
  assert.equal(rec.focusConcept, 'Linear equations')
  assert.ok(['easy', 'medium', 'hard', 'challenge'].includes(rec.difficulty))
  assert.equal(rec.level >= 1 && rec.level <= 3, true)
})

test('recommendPractice: falls back to chapter when no weak concept is known', async () => {
  const db = makeFakeDb()
  const teacherMastery = { async getWeakConcepts() { return [] } }
  const rec = await bridge.recommendPractice(db, { userId: 'u1', subject: 'Maths', chapter: 'Polynomials', grade: 'Class 10' }, { teacherMastery })
  assert.equal(rec.focusConcept, 'Polynomials')
  assert.equal(rec.grade, 'Class 10')
})

test('recordLessonPractice: writes quiz signals to teacher memory + concept mastery', async () => {
  const memCalls = []
  const masteryCalls = []
  const teacherMemory = { async recordEvent(a) { memCalls.push(a) } }
  const teacherMastery = { async updateMastery(a) { masteryCalls.push(a) } }
  const items = [{ isCorrect: true }, { isCorrect: false }, { isCorrect: true }]

  const r = await bridge.recordLessonPractice(
    { userId: 'u1', subject: 'Maths', chapter: 'Linear Equations', conceptId: '00000000-0000-0000-0000-0000000000ab', items },
    { teacherMemory, teacherMastery },
  )
  assert.equal(r.recorded, 3)
  assert.equal(r.correct, 2)
  assert.equal(memCalls.length, 3)
  assert.equal(memCalls[0].type, 'quiz')
  assert.equal(memCalls[0].subject, 'Maths')
  assert.equal(memCalls[0].detail.source, 'braingym')
  assert.equal(masteryCalls.length, 3)
  assert.deepEqual(masteryCalls.map((c) => c.signal), ['quiz_correct', 'quiz_wrong', 'quiz_correct'])
})

test('recordLessonPractice: without a conceptId, mastery is skipped but memory is still written', async () => {
  const memCalls = []
  const masteryCalls = []
  const r = await bridge.recordLessonPractice(
    { userId: 'u1', subject: 'Maths', items: [{ isCorrect: true }, { isCorrect: true }] },
    { teacherMemory: { async recordEvent(a) { memCalls.push(a) } }, teacherMastery: { async updateMastery(a) { masteryCalls.push(a) } } },
  )
  assert.equal(r.correct, 2)
  assert.equal(memCalls.length, 2)
  assert.equal(masteryCalls.length, 0)
})

test('recordLessonPractice: a failing teacher write never aborts the rest (best-effort)', async () => {
  let calls = 0
  const teacherMemory = { async recordEvent() { calls++; if (calls === 1) throw new Error('db blip') } }
  const r = await bridge.recordLessonPractice(
    { userId: 'u1', subject: 'Maths', items: [{ isCorrect: true }, { isCorrect: false }] },
    { teacherMemory, teacherMastery: { async updateMastery() {} } },
  )
  assert.equal(r.recorded, 2)        // both processed despite the first write throwing
  assert.equal(r.memoryWrites, 1)    // only the second memory write succeeded
})
