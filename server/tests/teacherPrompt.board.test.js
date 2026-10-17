'use strict'

// The BOARD block is opt-in: without `board: true` the doubt prompt must stay
// byte-identical to today's, so old app builds behave exactly as before.

const test = require('node:test')
const assert = require('node:assert/strict')
const { buildTeacherSystemPrompt, BOARD_BLOCK } = require('../src/prompts/teacherResponse.prompt')

const base = { intent: 'doubt', language: 'en', contexts: [], lesson: null, level: 'intermediate', gradeLevel: '9' }

test('board off: prompt is byte-identical to the default', () => {
  assert.equal(buildTeacherSystemPrompt({ ...base, board: false }), buildTeacherSystemPrompt(base))
  assert.equal(buildTeacherSystemPrompt(base).includes('[[board:'), false)
})

test('board on: appends the BOARD block once, at the end', () => {
  const p = buildTeacherSystemPrompt({ ...base, board: true })
  assert.equal(p.endsWith(BOARD_BLOCK), true)
  assert.equal(p.split('[[board:').length - 1, 1)
  assert.equal(p.startsWith(buildTeacherSystemPrompt(base)), true)
})
