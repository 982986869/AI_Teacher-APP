// The in-lesson teacher prompt: lesson grounding, honesty, and the 2026-11-18 rules
// (docs/superpowers/specs/2026-11-18-ai-teacher-doubt-quality-design.md).
const test = require('node:test')
const assert = require('node:assert/strict')

const { buildTeacherSystemPrompt } = require('../src/prompts/teacherResponse.prompt')

const base = { intent: 'doubt', language: 'en', contexts: [], gradeLevel: '9' }

test('lesson context is included, before GROUNDING', () => {
  const p = buildTeacherSystemPrompt({ ...base, lessonContext: 'LESSON: X\nCURRENT SLIDE (1 of 2): Y' })
  assert.match(p, /LESSON CONTEXT/)
  assert.match(p, /LESSON: X/)
  assert.ok(p.indexOf('LESSON CONTEXT') < p.indexOf('GROUNDING'), 'LESSON CONTEXT must come before GROUNDING')
})

test('no lesson context → no LESSON CONTEXT block', () => {
  assert.doesNotMatch(buildTeacherSystemPrompt(base), /LESSON CONTEXT/)
})

test('ungrounded answers are honest, not "confident"', () => {
  const p = buildTeacherSystemPrompt(base)
  assert.doesNotMatch(p, /with confidence from general knowledge/i)
  assert.match(p, /not sure/i)
})

test('new teaching rules are present', () => {
  const p = buildTeacherSystemPrompt({ ...base, lessonContext: 'LESSON: X' })
  for (const re of [/gender/i, /false assumption/i, /homework/i, /never promise/i, /class level/i]) {
    assert.match(p, re)
  }
})

test('the invented-progress example line is gone', () => {
  const p = buildTeacherSystemPrompt({
    ...base,
    studentContext: { chapter: 'Photosynthesis', status: 'learning', memoryCues: ['They practised yesterday.'] },
  })
  assert.doesNotMatch(p, /Your reasoning has really been improving/)
})

test('language: English for anything but Hindi', () => {
  const hinglish = buildTeacherSystemPrompt({ ...base, language: 'hinglish' })
  assert.match(hinglish, /LANGUAGE — Reply in clear, simple English/)
  assert.doesNotMatch(hinglish, /Hinglish/)
  const hi = buildTeacherSystemPrompt({ ...base, language: 'hi' })
  assert.match(hi, /Hindi \(Devanagari\)/)
})
