'use strict'

process.env.MOCK_AI = 'true'
process.env.VOYAGE_API_KEY = ''
process.env.ANTHROPIC_API_KEY = ''

const test = require('node:test')
const assert = require('node:assert/strict')

const { planSelection, RATIO } = require('../src/services/braingym/selectionPolicy')
const pipeline = require('../src/services/braingym/pipeline')
const bridge = require('../src/services/braingym/teacherBridge')
const { makeFakeDb } = require('./fakeDb')

const UID = '11111111-1111-1111-1111-111111111111'

// ── Selection policy ────────────────────────────────────────────────────────
test('policy: with teacher context a round of 10 is 50/30/20', () => {
  const p = planSelection({ count: 10, hasTeacherContext: true })
  assert.deepEqual([p.random_general, p.weak_area, p.teacher_recommended], [5, 3, 2])
})

test('policy: WITHOUT teacher context the 20% is redistributed to random+weak (no teacher slots)', () => {
  const p = planSelection({ count: 10, hasTeacherContext: false })
  assert.equal(p.teacher_recommended, 0)
  assert.equal(p.random_general + p.weak_area, 10)
  assert.ok(p.random_general > p.weak_area, 'random stays the majority')
  assert.deepEqual([p.random_general, p.weak_area], [6, 4])
})

test('policy: counts always sum to the round size, random is never starved', () => {
  for (const count of [1, 3, 5, 7, 8, 10, 12, 20]) {
    for (const t of [true, false]) {
      const p = planSelection({ count, hasTeacherContext: t })
      assert.equal(p.random_general + p.weak_area + p.teacher_recommended, count, `sum=${count} t=${t}`)
      if (!t) assert.equal(p.teacher_recommended, 0)
      assert.ok(p.random_general >= p.weak_area, 'random ≥ weak')
    }
  }
  assert.equal(RATIO.random_general, 0.5)
})

// ── Mixed pipeline: DIRECT BrainGym flow (no teacher topic) ──────────────────
test('direct flow: mixed round, NO teacher questions, full round, class-appropriate', async () => {
  const db = makeFakeDb()
  const { questions, modes } = await pipeline.getQuestions(db, { userId: UID, grade: 'Class 9', category: 'application', count: 10 })
  assert.equal(questions.length, 10)
  assert.ok(!modes.teacher_recommended, 'no teacher_recommended slots in a direct round')
  assert.ok((modes.random_general || 0) >= 1 && (modes.weak_area || 0) >= 1, 'blends random + weak')
  assert.equal((modes.random_general || 0) + (modes.weak_area || 0), 10)
  // numeric-answer contract (the quiz keypad reads answerValue; controller coerces)
  for (const q of questions) assert.ok(Number.isFinite(q.answerValue), 'every question has a numeric answerValue')
})

// ── Mixed pipeline: AI-TEACHER recommended flow (soft boost) ─────────────────
test('teacher flow: teacher topic is a SOFT boost (~20%), not the whole round', async () => {
  const db = makeFakeDb()
  // Seed a few generated Class 9 application questions tagged with the lesson concept.
  for (let i = 0; i < 4; i++) {
    await db.generated_questions.create({ data: {
      category: 'application', grade: 'Class 9', subject: 'Mental Math', difficulty: 'easy', level: 1,
      concept: 'Polynomials (evaluation)', topic: 'Polynomials', chapter: 'Polynomials',
      questionText: `Evaluate the polynomial case #${i}: 2×${i + 1} + 3 = ?`, answer: String(2 * (i + 1) + 3), answerValue: 2 * (i + 1) + 3,
      options: ['1', '2', '3', '4'], correctOption: 0, signature: `poly-${i}`, qualityScore: 0.9,
    } })
  }
  const { questions, modes, plan } = await pipeline.getQuestions(db, {
    userId: UID, grade: 'Class 9', category: 'application', count: 10, teacherConcept: 'Polynomials',
  })
  assert.equal(questions.length, 10)
  assert.equal(plan.teacher_recommended, 2)
  assert.equal(modes.teacher_recommended, 2, 'exactly the planned ~20% are teacher-linked')
  assert.ok(modes.random_general >= modes.teacher_recommended, 'random remains the majority — not narrowed to the topic')
  // the teacher-linked ones really are the concept-matched questions
  const teacherQs = questions.filter((q) => q.mode === 'teacher_recommended')
  for (const q of teacherQs) assert.ok(/polynomial/i.test(q.q))
})

// ── BrainGym → AI Teacher skill signal (always-on) ──────────────────────────
test('recordBrainGymSkill writes per-skill quiz signals under a BrainGym subject', async () => {
  const calls = []
  await bridge.recordBrainGymSkill(
    { userId: UID, category: 'reasoning', items: [{ isCorrect: true }, { isCorrect: false }] },
    { teacherMemory: { async recordEvent(a) { calls.push(a) } } },
  )
  assert.equal(calls.length, 2)
  assert.equal(calls[0].subject, 'BrainGym')
  assert.equal(calls[0].chapter, 'Reasoning')
  assert.equal(calls[0].detail.source, 'braingym')
})

test('summariseSkills turns mastery into teacher-speakable learning signals', () => {
  const out = bridge.summariseSkills([
    { category: 'reasoning', accuracy: 0.82, attempts: 10 },
    { category: 'application', accuracy: 0.30, attempts: 8 },
    { category: 'fluency', accuracy: 0.95, attempts: 2 }, // too little evidence → ignored
  ])
  assert.deepEqual(out.strongCategories, ['reasoning'])
  assert.deepEqual(out.weakCategories, ['application'])
  assert.ok(out.phrasings.some((p) => /reasoning is improving/i.test(p)))
  assert.ok(out.phrasings.some((p) => /struggled with application/i.test(p)))
})
