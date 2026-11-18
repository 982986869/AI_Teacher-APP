// A teacher answer is never cut in the middle: the guard keeps lines in order (it
// used to keep "first 4 + last" and silently drop worked steps), and a reply that
// ran out of tokens ends at its last full sentence, never mid-word.
const test = require('node:test')
const assert = require('node:assert/strict')

const { capLines, trimToLastSentence, MAX_LINES } = require('../src/utils/responseGuard')

const lines = (n) => Array.from({ length: n }, (_, i) => `Step ${i + 1}.`).join('\n')

test('capLines keeps every line, in order, up to the ceiling', () => {
  const r = capLines(lines(7))
  assert.equal(r.text, lines(7))
  assert.equal(r.truncated, false)
})

test('capLines over the ceiling keeps the FIRST lines, never first-plus-last', () => {
  assert.equal(MAX_LINES, 12)
  const r = capLines(lines(15))
  assert.equal(r.text, lines(12))
  assert.equal(r.truncated, true)
})

test('trimToLastSentence ends at the last full sentence', () => {
  assert.equal(trimToLastSentence('One. Two is cut mi'), 'One.')
  assert.equal(trimToLastSentence('Is it? Yes! And then the'), 'Is it? Yes!')
  assert.equal(trimToLastSentence('ऑक्सीजन पानी से आती है। फिर'), 'ऑक्सीजन पानी से आती है।')
  assert.equal(trimToLastSentence('no stop here'), 'no stop here')
  assert.equal(trimToLastSentence('pi is 3.14 and then'), 'pi is 3.14 and then')
})
