'use strict'

// The owner's feedback (2026-10-17): in textbook lessons the teacher said "as 7.3 says…"
// in nearly every line. SOURCE_RULES used to INSTRUCT that. These pin the new wording so
// the old habit cannot come back, and the version bump so cached book lessons regenerate.

const test = require('node:test')
const assert = require('node:assert/strict')
const { SOURCE_RULES, SUMMARY_RULES, PROMPT_VERSION } = require('../src/prompts/lessonGeneration.prompt')

test('source rules: section number at most once, never mid-explanation', () => {
  assert.equal(SOURCE_RULES.includes('as 7.3 says'), false)
  assert.equal(SOURCE_RULES.includes('at most ONCE per lesson'), true)
  assert.equal(SOURCE_RULES.includes('never repeat it in later narration'), true)
})

test('summary rules: revise slide names topics, not a list of section numbers', () => {
  assert.equal(SUMMARY_RULES.includes('listing the sections by number'), false)
  assert.equal(SUMMARY_RULES.includes('naming the topics to revise in plain words'), true)
})

test('prompt version bumped so cached book lessons regenerate', () => {
  assert.equal(PROMPT_VERSION, 5)
})
