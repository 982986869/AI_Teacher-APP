'use strict'
// The teacher WRITES short notes on the board while she speaks full sentences. The
// model emits them per slide as `boardNotes`; the validator keeps them (cleaned) inside
// visualData so they travel with the slide without a new column.
const test = require('node:test')
const assert = require('node:assert/strict')
const { parseAndValidateLesson } = require('../src/providers/ai/AnthropicProvider')
const { buildLessonSystemPrompt, PROMPT_VERSION } = require('../src/prompts/lessonGeneration.prompt')

const lesson = (slide) => JSON.stringify({
  lessonTitle: 'Heat', estimatedDuration: '5 minutes', summary: 'Heat flows.', keyTerms: ['heat'],
  slides: [{ slideNumber: 1, slideTitle: 'Thermal equilibrium', explanation: 'x', narrationText: 'y', visualType: 'NONE', visualData: { keyPoints: ['a'] }, ...slide }],
})

test('boardNotes are kept in visualData, trimmed, empties dropped, capped at 5', () => {
  const out = parseAndValidateLesson(lesson({ boardNotes: [' hot tea → cooler room ', '', 'heat flows hot to cold', 7, 'a', 'b', 'c', 'd'] }))
  assert.deepEqual(out.slides[0].visualData.boardNotes, ['hot tea → cooler room', 'heat flows hot to cold', 'a', 'b', 'c'])
  assert.equal(out.slides[0].boardNotes, undefined, 'not a top-level slide field (no column for it)')
})

test('no boardNotes → visualData untouched', () => {
  const out = parseAndValidateLesson(lesson({}))
  assert.deepEqual(out.slides[0].visualData, { keyPoints: ['a'] })
})

test('the system prompt asks for short board notes and the cache version moved on', () => {
  const p = buildLessonSystemPrompt()
  assert.match(p, /"boardNotes"/)
  assert.match(p, /never a full sentence/i)
  assert.ok(PROMPT_VERSION >= 4)
})
