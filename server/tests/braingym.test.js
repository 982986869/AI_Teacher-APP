'use strict'

// Force the deterministic offline generator (no LLM / no network) so the whole
// pipeline is reproducible in CI. Must be set BEFORE requiring any module.
process.env.MOCK_AI = 'true'
process.env.VOYAGE_API_KEY = ''
process.env.ANTHROPIC_API_KEY = ''

const test = require('node:test')
const assert = require('node:assert/strict')

const grade = require('../src/services/braingym/grade')
const difficulty = require('../src/services/braingym/difficulty')
const dedup = require('../src/services/braingym/dedup')
const quality = require('../src/services/braingym/quality')
const { validateQuestion } = require('../src/services/braingym/validator')
const { fallbackGenerate } = require('../src/services/braingym/generator')
const { CATEGORIES, DIFFICULTIES } = require('../src/services/braingym/constants')

const mastery = require('../src/services/braingym/mastery')
const pipeline = require('../src/services/braingym/pipeline')
const { makeFakeDb } = require('./fakeDb')

const UID = '00000000-0000-0000-0000-000000000001'

// ─── CLASS-LEVEL GUARDRAIL ──────────────────────────────────────────────────
test('parseGrade normalises many representations', () => {
  assert.equal(grade.gradeNum('Class 9'), 9)
  assert.equal(grade.gradeNum('G12'), 12)
  assert.equal(grade.gradeNum('grade-10'), 10)
  assert.equal(grade.gradeNum('XI'), 11)
  assert.equal(grade.gradeNum(7), 7)
  assert.equal(grade.parseGrade('9').className, 'Class 9')
})

test('Class 9 student never receives Class 10/11/12 concepts (text scan)', () => {
  const oog9 = [
    'Find the derivative of x²',            // 11
    'Evaluate ∫ x dx',                       // 12
    'Find sin 30°',                          // 10 (trig)
    'Solve the quadratic x² - 5x + 6 = 0',   // 10
    'Find log 100',                          // 11
    'Determinant of the matrix',             // 12
  ]
  for (const q of oog9) {
    assert.ok(grade.detectOutOfGradeConcepts(q, 'Class 9').length > 0, `should flag: ${q}`)
  }
  // plain Class 9 arithmetic is clean
  assert.equal(grade.detectOutOfGradeConcepts('What is 47 + 38?', 'Class 9').length, 0)
})

test('Class 10 never receives Class 11/12 concepts; trig/quadratic now allowed', () => {
  assert.ok(grade.detectOutOfGradeConcepts('Find the integral of x', 'Class 10').length > 0) // 12
  assert.ok(grade.detectOutOfGradeConcepts('Find the derivative', 'Class 10').length > 0)    // 11
  assert.equal(grade.detectOutOfGradeConcepts('Find sin 30 degrees', 'Class 10').length, 0)  // 10 ok
})

test('Class 12 receives Class 12 concepts (allowed)', () => {
  assert.equal(grade.detectOutOfGradeConcepts('Find the derivative of x³', 'Class 12').length, 0)
  assert.equal(grade.detectOutOfGradeConcepts('Evaluate the definite integral', 'Class 12').length, 0)
  assert.ok(grade.isConceptAllowed('Derivative of polynomial (power rule)', 'Class 12'))
})

test('isConceptAllowed enforces the class boundary; prereq lets lower classes in', () => {
  // Class 9 cannot use a Class 11 concept
  assert.equal(grade.isConceptAllowed('Logarithm evaluation', 'Class 9'), false)
  // Class 9 own concept ok
  assert.equal(grade.isConceptAllowed('Linear equations in two variables', 'Class 9'), true)
  // Class 12 prereq revision can pull a Class 9 concept ONLY when flagged
  assert.equal(grade.isConceptAllowed('Linear equations in two variables', 'Class 12'), false)
  assert.equal(grade.isConceptAllowed('Linear equations in two variables', 'Class 12', { isPrerequisite: true }), true)
})

test('validator rejects an out-of-grade question for a Class 9 student', () => {
  const badQ = {
    category: 'reasoning', grade: 'Class 9', difficulty: 'hard',
    concept: 'Derivative of polynomial (power rule)', // Class 12 concept
    questionText: 'Find the derivative of x² at x = 3',
    answer: '6', answerValue: 6,
    options: ['6', '3', '9', '12'], correctOption: 0,
    explanation: 'derivative is 2x = 6', hints: ['power rule'],
  }
  const v = validateQuestion(badQ, { grade: 'Class 9', category: 'reasoning', difficulty: 'hard' })
  assert.equal(v.valid, false)
  assert.ok(v.errors.includes('concept_out_of_grade') || v.errors.some((e) => e.startsWith('advanced_syllabus')))
})

// ─── FALLBACK GENERATOR — grade-safe across the board ────────────────────────
test('fallback generator: every (category × difficulty × grade) question is valid and in-grade', () => {
  for (const g of ['Class 9', 'Class 10', 'Class 11', 'Class 12']) {
    for (const category of CATEGORIES) {
      for (const diff of DIFFICULTIES) {
        const qs = fallbackGenerate({ category, grade: g, difficulty: diff, count: 4, salt: 1 })
        assert.ok(qs.length >= 1, `should generate for ${g}/${category}/${diff}`)
        for (const q of qs) {
          // grade metadata correct
          assert.equal(q.grade, g)
          assert.equal(q.category, category)
          assert.equal(q.difficulty, diff)
          assert.ok(Number.isFinite(q.answerValue), 'answer is numeric')
          // no out-of-grade vocabulary
          assert.equal(grade.detectOutOfGradeConcepts(q.questionText + ' ' + q.options.join(' '), g).length, 0,
            `in-grade text for ${g}/${category}/${diff}: ${q.questionText}`)
          // validator agrees
          const v = validateQuestion(q, { grade: g, category, difficulty: diff })
          assert.equal(v.valid, true, `valid ${g}/${category}/${diff}: ${JSON.stringify(v.errors)}`)
        }
      }
    }
  }
})

test('a HARD Class 9 question stays a Class 9 question (difficulty ≠ higher syllabus)', () => {
  const [q] = fallbackGenerate({ category: 'application', grade: 'Class 9', difficulty: 'challenge', count: 1, salt: 3 })
  assert.equal(q.grade, 'Class 9')
  assert.equal(q.difficulty, 'challenge')
  assert.equal(grade.detectOutOfGradeConcepts(q.questionText, 'Class 9').length, 0)
})

// ─── DIFFICULTY ENGINE ───────────────────────────────────────────────────────
test('classifyDifficulty bands accuracy correctly (within class)', () => {
  const base = { attempts: 20, currentDifficulty: 'medium', hiAccuracySessions: 0, recentFails: 0 }
  assert.equal(difficulty.classifyDifficulty({ ...base, accuracy: 0.30 }), 'easy')
  assert.equal(difficulty.classifyDifficulty({ ...base, accuracy: 0.55 }), 'medium')
  assert.equal(difficulty.classifyDifficulty({ ...base, accuracy: 0.80 }), 'hard')
  // ≥85% but not yet sustained → hard, not challenge
  assert.equal(difficulty.classifyDifficulty({ ...base, accuracy: 0.90, hiAccuracySessions: 1 }), 'hard')
  // sustained high accuracy → challenge
  assert.equal(difficulty.classifyDifficulty({ ...base, accuracy: 0.90, hiAccuracySessions: 2 }), 'challenge')
})

test('repeated struggle forces an automatic downgrade', () => {
  const d = difficulty.classifyDifficulty({ accuracy: 0.9, attempts: 20, currentDifficulty: 'hard', recentFails: 3 })
  assert.equal(d, 'medium')
})

test('cold start holds easy until enough evidence', () => {
  assert.equal(difficulty.classifyDifficulty({ accuracy: 0.9, attempts: 2, currentDifficulty: 'easy' }), 'easy')
})

test('recomputeMastery progresses a strong student up the bands (still in class)', () => {
  let m = {}
  for (let i = 0; i < 4; i++) m = difficulty.recomputeMastery(m, { correct: 5, total: 5 })
  assert.ok(m.attempts >= 20)
  assert.ok(m.accuracy >= 0.85)
  assert.equal(m.currentDifficulty, 'challenge') // top band — but it is still a same-class band
})

// ─── DEDUP ───────────────────────────────────────────────────────────────────
test('dedup: formatting/spacing duplicates are caught; different numbers are NOT', () => {
  const existing = [{ text: 'What is 2 + 2 = ?' }]
  assert.equal(dedup.isDuplicate('what is 2 + 2 = ?', existing).duplicate, true)   // case only
  assert.equal(dedup.isDuplicate('What  is  2+2 = ?', existing).duplicate, true)   // spacing + operator
  assert.equal(dedup.isDuplicate('What is 3 + 3 = ?', existing).duplicate, false)  // fresh variant — kept
})

test('dedup cosine similarity flags near-identical vectors', () => {
  const a = [1, 0, 0], b = [0.99, 0.01, 0]
  assert.equal(dedup.isDuplicateByEmbedding(a, [{ embedding: b, id: 'x' }]).duplicate, true)
  assert.equal(dedup.isDuplicateByEmbedding(a, [{ embedding: [0, 1, 0], id: 'y' }]).duplicate, false)
})

// ─── VALIDATOR structural checks ─────────────────────────────────────────────
test('validator rejects structural defects', () => {
  const ctx = { grade: 'Class 9', category: 'fluency', difficulty: 'easy' }
  const good = { category: 'fluency', grade: 'Class 9', difficulty: 'easy', concept: 'Exponents and powers', questionText: '5 + 4 = ?', answer: '9', answerValue: 9, options: ['9', '8', '10', '7'], correctOption: 0, explanation: '5 + 4 = 9', hints: ['add'] }
  assert.equal(validateQuestion(good, ctx).valid, true)
  // two correct options
  assert.equal(validateQuestion({ ...good, options: ['9', '9', '10', '7'] }, ctx).valid, false)
  // non-numeric answer (quiz is a numeric keypad)
  assert.equal(validateQuestion({ ...good, answer: 'nine', answerValue: null, options: ['nine', 'eight', 'ten', 'seven'], correctOption: 0 }, ctx).valid, false)
  // wrong number of options
  assert.equal(validateQuestion({ ...good, options: ['9', '8', '10'] }, ctx).valid, false)
  // category mismatch
  assert.equal(validateQuestion({ ...good, category: 'reasoning' }, ctx).valid, false)
})

test('quality score: clean question scores high, gibberish scores low', () => {
  const clean = { questionText: 'What is 12 + 7 = ?', difficulty: 'easy' }
  const messy = { questionText: 'x(', difficulty: 'easy' }
  const hi = quality.computeQuality({ normalized: clean, validationScore: 1, uniqueness: 1, targetDifficulty: 'easy' })
  const lo = quality.computeQuality({ normalized: messy, validationScore: 0.5, uniqueness: 0.3, targetDifficulty: 'hard' })
  assert.ok(hi.score > 0.8)
  assert.ok(lo.score < hi.score)
})

// ─── ADAPTIVE ENGINE (DB-backed via fake) ────────────────────────────────────
test('applySessionResult upserts mastery and adapts difficulty within class', async () => {
  const db = makeFakeDb()
  let m
  for (let i = 0; i < 4; i++) {
    m = await mastery.applySessionResult(db, { userId: UID, category: 'reasoning', grade: 'Class 9', correct: 5, total: 5 })
  }
  assert.equal(m.grade, 'Class 9')
  assert.equal(m.currentDifficulty, 'challenge')
  const row = await mastery.getMasteryRow(db, { userId: UID, category: 'reasoning', subject: 'Mental Math' })
  assert.ok(row && row.attempts >= 20)
})

// ─── PIPELINE / RETRIEVAL (DB-backed via fake) ───────────────────────────────
test('pipeline returns a full in-grade round on an empty bank (seed-first), then grows in background', async () => {
  const db = makeFakeDb()
  const { questions, difficulty: diff } = await pipeline.getQuestions(db, { userId: UID, grade: 'Class 9', category: 'reasoning', count: 5 })
  // Retrieval priority: with an empty generated bank, the offline SEED fills the
  // round (priority 2) — on-demand generation (priority 4) only runs if seed can't.
  assert.equal(questions.length, 5)
  for (const q of questions) {
    assert.ok(Number.isFinite(Number(q.answer)) || Number.isFinite(q.answerValue))
    if (q.source === 'generated') {
      assert.equal(q.grade, 'Class 9')
      assert.equal(grade.detectOutOfGradeConcepts(q.q, 'Class 9').length, 0)
    }
  }
  assert.ok(DIFFICULTIES.includes(diff))
})

test('generateAndStore grows the bank with valid, in-grade, de-duplicated questions', async () => {
  const { generateAndStore } = require('../src/services/braingym/generationService')
  const db = makeFakeDb()
  const { accepted, stats } = await generateAndStore(db, {
    userId: null, grade: 'Class 9', category: 'reasoning', subject: 'Mental Math', difficulty: 'easy', count: 5, trigger: 'on_demand',
  })
  assert.equal(accepted.length, 5)
  assert.equal(db._gq.length, 5)
  assert.equal(db._history.length, 1)           // audit row written
  const sigs = new Set(db._gq.map((r) => r.signature))
  assert.equal(sigs.size, 5, 'no duplicate signatures persisted')
  for (const r of db._gq) {
    assert.equal(r.grade, 'Class 9')
    assert.equal(grade.detectOutOfGradeConcepts(r.questionText, 'Class 9').length, 0)
    assert.ok(r.qualityScore >= 0.7 && r.validationScore >= 0.7)
  }
  assert.ok(stats.accepted === 5)
})

test('pipeline prefers UNSEEN generated for the comfort-difficulty (random_general) slots', async () => {
  const db = makeFakeDb()
  // Pre-seed 6 ACTIVE Class 9 reasoning EASY generated questions (the comfort band).
  for (let i = 0; i < 6; i++) {
    await db.generated_questions.create({ data: {
      category: 'reasoning', grade: 'Class 9', subject: 'Mental Math', difficulty: 'easy', level: 1,
      questionText: `pre-seeded Q${i}: ${i} + ${i} = ?`, answer: String(i + i), answerValue: i + i,
      options: [String(i + i), '1', '2', '3'], correctOption: 0, signature: `sig-${i}`, qualityScore: 0.9,
    } })
  }
  // Mixed round: random_general runs at the comfort difficulty (easy) and should be
  // filled from the generated bank; weak_area runs at the growth edge (no generated
  // there yet → seed). So the round is intentionally a blend, not 100% generated.
  const { questions, modes } = await pipeline.getQuestions(db, { userId: UID, grade: 'Class 9', category: 'reasoning', count: 5 })
  assert.equal(questions.length, 5)
  const randomSlots = questions.filter((q) => q.mode === 'random_general')
  assert.ok(randomSlots.length >= 1)
  assert.ok(randomSlots.every((q) => q.source === 'generated'), 'comfort-difficulty slots come from the generated bank first')
})

test('weak_area targets the concepts a student has actually been getting wrong', async () => {
  const db = makeFakeDb()
  const WUID = '00000000-0000-0000-0000-0000000000aa'
  // Unseen growth targets for two concepts at the comfort difficulty (easy).
  const mk = (concept, i) => db.generated_questions.create({ data: {
    category: 'reasoning', grade: 'Class 9', subject: 'Mental Math', difficulty: 'easy', level: 1,
    questionText: `${concept} item ${i}: ${i} + ${i} = ?`, answer: String(i + i), answerValue: i + i,
    options: [String(i + i), '1', '2', '3'], correctOption: 0,
    concept, topic: concept, chapter: concept, signature: `wk-${concept}-${i}`, qualityScore: 0.9,
  } })
  for (let i = 0; i < 6; i++) await mk('Polynomials (evaluation)', i)
  for (let i = 0; i < 6; i++) await mk('Percentage', i)
  // The student answered three (now-seen) Polynomials questions WRONG.
  const wrongs = []
  for (let i = 100; i < 103; i++) wrongs.push(await mk('Polynomials (evaluation)', i))
  await pipeline.recordAttempts(db, {
    userId: WUID, grade: 'Class 9',
    items: wrongs.map((r) => ({ id: r.id, source: 'generated', category: 'reasoning', difficulty: 'easy', isCorrect: false, answerGiven: '0' })),
  })

  const { questions, modes } = await pipeline.getQuestions(db, { userId: WUID, grade: 'Class 9', category: 'reasoning', count: 10 })
  assert.ok((modes.weak_area || 0) >= 1, 'weak-area slots are present')
  // weak-area generated questions are drawn from the weak concept (Polynomials)
  const weakGen = questions.filter((q) => q.mode === 'weak_area' && q.source === 'generated')
  assert.ok(weakGen.length >= 1, 'weak-area pulled concept-matched generated questions')
  for (const q of weakGen) assert.match(String(q.q).toLowerCase(), /polynomials/)
})

test('pipeline excludes recently-attempted questions', async () => {
  const db = makeFakeDb()
  const made = await db.generated_questions.create({ data: {
    category: 'fluency', grade: 'Class 9', subject: 'Mental Math', difficulty: 'easy', level: 1,
    questionText: 'seen 9 + 9 = ?', answer: '18', answerValue: 18, options: ['18', '1', '2', '3'],
    correctOption: 0, signature: 'seen-sig', qualityScore: 0.9,
  } })
  await db.question_attempts.createMany({ data: [{ userId: UID, questionId: made.id, source: 'generated', category: 'fluency', isCorrect: true }] })
  const { questions } = await pipeline.getQuestions(db, { userId: UID, grade: 'Class 9', category: 'fluency', count: 5 })
  assert.ok(questions.every((q) => q.id !== made.id), 'the recently attempted question is not re-served')
})

test('generator falls back when the LLM throws or returns junk JSON', async () => {
  const { generateCandidates } = require('../src/services/braingym/generator')
  const throwing = async () => { throw new Error('429 rate limited') }
  const junk = async () => ({ text: 'sorry, here is no json', model: 'x' })
  for (const llm of [throwing, junk]) {
    const r = await generateCandidates({ category: 'fluency', grade: 'Class 9', difficulty: 'easy', count: 3 }, { llm })
    assert.equal(r.engine, 'fallback')
    assert.ok(r.candidates.length >= 1)
    for (const c of r.candidates) {
      const v = validateQuestion(c, { grade: 'Class 9', category: 'fluency', difficulty: 'easy' })
      assert.equal(v.valid, true, JSON.stringify(v.errors))
    }
  }
})

test('mastery upgrades then downgrades difficulty with performance (still in class)', async () => {
  const db = makeFakeDb()
  let m
  for (let i = 0; i < 4; i++) m = await mastery.applySessionResult(db, { userId: UID, category: 'fluency', grade: 'Class 9', correct: 5, total: 5 })
  assert.ok(['hard', 'challenge'].includes(m.currentDifficulty), `up to hard/challenge, got ${m.currentDifficulty}`)
  for (let i = 0; i < 4; i++) m = await mastery.applySessionResult(db, { userId: UID, category: 'fluency', grade: 'Class 9', correct: 0, total: 5 })
  assert.equal(m.currentDifficulty, 'easy') // repeated failure → downgraded, but still Class 9
  assert.equal(m.grade, 'Class 9')
})

test('pipeline serves the adapted difficulty (high mastery → challenge bucket)', async () => {
  const db = makeFakeDb()
  for (let i = 0; i < 4; i++) await mastery.applySessionResult(db, { userId: UID, category: 'application', grade: 'Class 9', correct: 5, total: 5 })
  const { difficulty: diff } = await pipeline.getQuestions(db, { userId: UID, grade: 'Class 9', category: 'application', count: 5 })
  assert.equal(diff, 'challenge')
})

test('adaptive submit composition: grades round, records attempts, updates mastery', async () => {
  const db = makeFakeDb()
  const made = await db.generated_questions.create({ data: {
    category: 'reasoning', grade: 'Class 9', subject: 'Mental Math', difficulty: 'easy', level: 1,
    questionText: '1 + 1 = ?', answer: '2', answerValue: 2, options: ['2', '1', '3', '4'], correctOption: 0, signature: 's1', qualityScore: 0.9,
  } })
  const questions = [{ id: made.id, source: 'generated', category: 'reasoning', difficulty: 'easy', answer: 2 }]
  const answers = [2]
  const items = questions.map((q, i) => ({ id: q.id, source: 'generated', category: q.category, difficulty: q.difficulty, isCorrect: Number(answers[i]) === Number(q.answer), answerGiven: String(answers[i]) }))
  await pipeline.recordAttempts(db, { userId: UID, grade: 'Class 9', items })
  const m = await mastery.applySessionResult(db, { userId: UID, category: 'reasoning', grade: 'Class 9', correct: 1, total: 1 })
  assert.equal(db._attempts.length, 1)
  const row = db._gq.find((r) => r.id === made.id)
  assert.equal(row.timesServed, 1)
  assert.equal(row.timesCorrect, 1)
  assert.equal(m.grade, 'Class 9')
})

test('recordAttempts logs attempts and bumps per-question counters', async () => {
  const db = makeFakeDb()
  const made = await db.generated_questions.create({ data: {
    category: 'reasoning', grade: 'Class 9', subject: 'Mental Math', difficulty: 'easy', level: 1,
    questionText: 'q', answer: '1', answerValue: 1, options: ['1', '2', '3', '4'], correctOption: 0, signature: 's', qualityScore: 0.9,
  } })
  await pipeline.recordAttempts(db, { userId: UID, grade: 'Class 9', items: [
    { source: 'generated', id: made.id, category: 'reasoning', difficulty: 'easy', isCorrect: true, answerGiven: '1', timeMs: 1200 },
    { source: 'seed', seedId: 'seed-0001', category: 'reasoning', difficulty: 'easy', isCorrect: false, answerGiven: '9', timeMs: 800 },
  ] })
  assert.equal(db._attempts.length, 2)
  const row = db._gq.find((r) => r.id === made.id)
  assert.equal(row.timesServed, 1)
  assert.equal(row.timesCorrect, 1)
})
