// The doubt-quality eval writes mastery/memory for the asking student, so it must
// only ever run against a local server; and its totals feed the before/after report.
const test = require('node:test')
const assert = require('node:assert/strict')

const { assertLocalBase, summarise } = require('../scripts/eval-doubts')

test('assertLocalBase rejects non-local', () => {
  assert.throws(() => assertLocalBase('https://api.ailernova.in'))
  assert.throws(() => assertLocalBase('http://10.203.94.99:5000'))
  assert.doesNotThrow(() => assertLocalBase('http://localhost:5000'))
  assert.doesNotThrow(() => assertLocalBase('http://127.0.0.1:5000'))
})

test('summarise totals', () => {
  const s = summarise([
    { id: 'a', scores: { correct: 2, onTopic: 2, rules: 1, teaching: 0 } },
    { id: 'b', scores: { correct: 2, onTopic: 1, rules: 2, teaching: 2 } },
  ])
  assert.equal(s.cases, 2)
  assert.equal(s.total, 12)
  assert.equal(s.max, 16)
  assert.equal(s.byCriterion.correct, 4)
  assert.equal(s.byCriterion.teaching, 2)
})
