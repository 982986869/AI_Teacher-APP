'use strict'
// The home page lets a student browse another class (?class=), the way Resources and
// Practice already do. The textbook routes resolve the same way: an explicit valid
// ?class= wins, else the profile class, else nothing.
const test = require('node:test')
const assert = require('node:assert/strict')
const { browsingClass } = require('../src/services/browsingClass')

const req = (query, classNum) => ({ query, scope: classNum == null ? null : { classNum } })

test('?class= wins over the profile class', () => {
  assert.equal(browsingClass(req({ class: '9' }, 10)), 9)
  assert.equal(browsingClass(req({ class: 'Class 7' }, 10)), 7)
})

test('falls back to the profile class without a usable ?class=', () => {
  assert.equal(browsingClass(req({}, 10)), 10)
  assert.equal(browsingClass(req({ class: '13' }, 10)), 10)
  assert.equal(browsingClass(req({ class: 'abc' }, 10)), 10)
  assert.equal(browsingClass(req({ class: '0' }, 10)), 10)
})

test('null when neither is known', () => {
  assert.equal(browsingClass(req({}, null)), null)
  assert.equal(browsingClass({ query: undefined }), null)
})
