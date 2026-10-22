'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { buildLessonRequestParts } = require('../src/providers/ai/AnthropicProvider')
const { buildDoubtSystemPrompt } = require('../src/prompts/doubtResolution.prompt')

test('without a source: plain cached system, one text block', () => {
  const r = buildLessonRequestParts({ systemText: 'SYS', sourceBlock: null, userText: 'USER' })
  assert.deepEqual(r.system, [{ type: 'text', text: 'SYS', cache_control: { type: 'ephemeral' } }])
  assert.deepEqual(r.messages, [{ role: 'user', content: [{ type: 'text', text: 'USER' }] }])
})

test('with a source: the source is its own cached block BEFORE the per-student text', () => {
  const r = buildLessonRequestParts({ systemText: 'SYS', sourceBlock: 'SOURCE MATERIAL …', userText: 'USER' })
  assert.equal(r.messages.length, 1)
  const [src, user] = r.messages[0].content
  assert.deepEqual(src, { type: 'text', text: 'SOURCE MATERIAL …', cache_control: { type: 'ephemeral' } })
  assert.deepEqual(user, { type: 'text', text: 'USER' })
})

test('doubt system prompt quotes the textbook when sourceText is given', () => {
  const lesson = { topic: 'Sets', subject: 'Maths', gradeLevel: '10', lessonTitle: 'Sets', summary: '', keyTerms: [], slides: [] }
  assert.ok(!buildDoubtSystemPrompt(lesson).includes("THE STUDENT'S TEXTBOOK SAYS"))
  const p = buildDoubtSystemPrompt(lesson, '[1.2 Sets]\nA set is a well-defined collection.')
  assert.ok(p.includes("THE STUDENT'S TEXTBOOK SAYS"))
  assert.ok(p.includes('well-defined collection'))
  assert.ok(p.indexOf("THE STUDENT'S TEXTBOOK SAYS") < p.indexOf('HOW TO ANSWER'))
})
