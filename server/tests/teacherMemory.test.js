'use strict'

// Phase 1/2 wiring: the live teacher must turn the existing engines' signals into
// NATURAL, number-free language. These tests use injected fakes (no DB/LLM) to
// verify the cue-gathering + the prompt weaving, and that no raw score leaks.
process.env.MOCK_AI = 'true'
process.env.VOYAGE_API_KEY = ''
process.env.ANTHROPIC_API_KEY = ''

const test = require('node:test')
const assert = require('node:assert/strict')
const agent = require('../src/services/agent.service')
const { buildTeacherSystemPrompt } = require('../src/prompts/teacherResponse.prompt')

const fakes = ({ revision, strong = [], weak = [], wrong = [] } = {}) => ({
  mastery: {
    async pickRevisionConcept() { return revision || null },
    async getWeakConcepts() { return weak.map((c) => ({ concept: c })) },
  },
  teacherBridge: { async getBrainGymSkillSummary() { return { strongCategories: strong, weakCategories: [] } } },
  mistakeBook: { async getUnresolved() { return wrong.map((c) => ({ concept: c })) } },
  db: {},
})

const noNumbers = (s) => assert.ok(!/\d+\s*%|\bmastery\b|\bscore\b|\bNN%\b/i.test(s), `must be number-free: "${s}"`)

test('gatherMemoryCues: prioritises revision-due then skill trend, number-free', async () => {
  const cues = await agent.gatherMemoryCues(
    { userId: 'u1', currentConceptName: 'Newton Laws' },
    fakes({ revision: { concept: 'Trigonometry', daysSincePractice: 21 }, strong: ['reasoning'], weak: ['Vectors'], wrong: ['Relative Velocity'] }),
  )
  assert.equal(cues.length, 2)
  assert.match(cues[0], /Trigonometry/)
  assert.match(cues[0], /3 weeks/)             // humanGap(21) — a time gap, not a score
  assert.match(cues[1], /reasoning/i)
  assert.match(cues[1], /improving/i)
  cues.forEach(noNumbers)
})

test('gatherMemoryCues: excludes the concept currently being taught', async () => {
  const cues = await agent.gatherMemoryCues(
    { userId: 'u1', currentConceptName: 'Trigonometry' }, // same as the revision concept
    fakes({ revision: { concept: 'Trigonometry', daysSincePractice: 21 }, strong: ['reasoning'], weak: ['Vectors'] }),
  )
  // revision cue is skipped (it's the current topic) → skill trend + weak concept
  assert.match(cues[0], /reasoning/i)
  assert.match(cues[1], /Vectors/)
  cues.forEach(noNumbers)
})

test('gatherMemoryCues: brand-new student (no signals) → no cues', async () => {
  const cues = await agent.gatherMemoryCues({ userId: 'u1', currentConceptName: 'X' }, fakes({}))
  assert.deepEqual(cues, [])
})

test('buildStudentContext + prompt: weaves faded retention + cues, exposes no scores', async () => {
  const ctx = agent.buildStudentContext(
    { name: 'Projectile Motion', chapter: 'Motion' },
    { masteryPct: 82, status: 'strong', strugglingBefore: false, lifecycleState: 'Needs Revision', faded: true, gap: '3 weeks' },
    { prereqConcepts: [] },
    ['It has been 3 weeks since this student revised Trigonometry; you may gently suggest revising it soon.'],
  )
  const prompt = buildTeacherSystemPrompt({ intent: 'concept_explanation', language: 'en', contexts: [], studentContext: ctx })
  assert.match(prompt, /STUDENT MEMORY/)
  assert.match(prompt, /3 weeks since this student practised Motion/) // faded retention line
  assert.match(prompt, /revised Trigonometry/)                        // cross-topic cue wove in
  // the masteryPct (82) must NEVER appear as a number in the prompt body
  assert.ok(!/82/.test(prompt), 'raw mastery number must not leak into the prompt')
})

test('buildStudentContext: nothing to say → null (no forced memory block)', () => {
  assert.equal(agent.buildStudentContext(null, null, { prereqConcepts: [] }, []), null)
})

test('grade prompt: memory hint sets a warm tone but never exposes scores', () => {
  const { buildGradeSystemPrompt } = require('../src/prompts/quizGrading.prompt')
  const p = buildGradeSystemPrompt({ question: 'q', expectedAnswer: 'a', language: 'en', studentMemory: 'This student found Relative Velocity hard before; be extra warm.' })
  assert.match(p, /TEACHER MEMORY/)
  assert.match(p, /Relative Velocity hard before/)
  assert.match(p, /NEVER expose any score/i)
  assert.match(p, /never discouraging/i)
  // Without a hint there is no memory block at all (no forced template).
  assert.ok(!/TEACHER MEMORY/.test(buildGradeSystemPrompt({ question: 'q', expectedAnswer: 'a', language: 'en' })))
})
