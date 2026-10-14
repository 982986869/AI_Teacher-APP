'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { buildLessonUserPrompt, buildSourceBlock, buildLessonSystemPrompt, PROMPT_VERSION } = require('../src/prompts/lessonGeneration.prompt')

const source = {
  book: { title: 'Mathematics', subject: 'Mathematics' },
  chapter: { number: 7, title: 'Binomial Theorem' },
  kind: 'topics',
  classLevel: 10,
  topics: [
    { number: '7.2', title: 'Binomial Theorem for Positive Integral Indices', text: 'Let us expand (a+b)^n ...' },
    { number: '7.3', title: 'General and Middle Terms', text: 'The (r+1)th term is ...' },
  ],
  topicLabel: '7.2, 7.3',
}
const learner = { learner: { weak: ['sets'], averageMastery: 40 } }

test('PROMPT_VERSION is a positive integer', () => {
  assert.ok(Number.isInteger(PROMPT_VERSION) && PROMPT_VERSION >= 1)
})

test('buildSourceBlock wraps every topic with its number and title, in order', () => {
  const b = buildSourceBlock(source)
  assert.match(b, /SOURCE MATERIAL — NCERT Class 10 Mathematics, Chapter 7 "Binomial Theorem", section\(s\) 7\.2, 7\.3/)
  assert.ok(b.indexOf('[7.2 Binomial Theorem for Positive Integral Indices]') < b.indexOf('[7.3 General and Middle Terms]'))
  assert.ok(b.includes('Let us expand (a+b)^n'))
  assert.ok(b.trim().endsWith('>>>'))
})

test('buildSourceBlock for a summary says "whole chapter"', () => {
  const b = buildSourceBlock({ ...source, kind: 'summary' })
  assert.match(b, /Chapter 7 "Binomial Theorem" \(whole chapter\)/)
})

test('without a source the user prompt is unchanged in spirit: no SOURCE instructions, learner line present', () => {
  const p = buildLessonUserPrompt('Sets', 'Maths', '10', learner)
  assert.ok(!p.includes('TEACH FROM THE SOURCE'))
  assert.ok(p.includes('struggled before with: sets'))
})

test('with a source the user prompt instructs to teach from it and drops the learner line', () => {
  const p = buildLessonUserPrompt('Binomial Theorem: 7.2 …', 'Mathematics', '10', learner, source)
  assert.ok(p.includes('TEACH FROM THE SOURCE'))
  assert.ok(p.includes('refer to sections by number'))
  assert.ok(!p.includes('struggled before with'))
  assert.ok(!p.includes('LESSON KIND — CHAPTER SUMMARY'))
  assert.ok(!p.includes('Let us expand'), 'the source text itself is NOT embedded (it goes in its own cached block)')
})

test('a summary source adds the chapter-summary guidance', () => {
  const p = buildLessonUserPrompt('Chapter 7: Binomial Theorem (summary)', 'Mathematics', '10', {}, { ...source, kind: 'summary' })
  assert.ok(p.includes('LESSON KIND — CHAPTER SUMMARY'))
  assert.ok(p.includes('what to revise'))
})

test('the system prompt tells the model a SOURCE MATERIAL block is authoritative', () => {
  assert.ok(buildLessonSystemPrompt().includes('SOURCE MATERIAL'))
})
