'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { parseSourceBody } = require('../src/services/lessonSource')

test('no source → null, no error (the free-topic path)', () => {
  assert.deepEqual(parseSourceBody({ topic: 'Sets' }), { source: null, error: null })
})

test('summary source needs only a chapter id', () => {
  assert.deepEqual(parseSourceBody({ source: { chapterId: 12, kind: 'summary' } }), { source: { chapterId: 12, kind: 'summary', topicIds: [] }, error: null })
})

test('topics source keeps 1–3 integer ids, de-duplicated, as numbers', () => {
  assert.deepEqual(parseSourceBody({ source: { chapterId: '12', kind: 'topics', topicIds: ['7', 8, 7] } }).source, { chapterId: 12, kind: 'topics', topicIds: [7, 8] })
})

test('rejects a bad kind, a missing chapter, zero or four topics, non-integers, non-object', () => {
  assert.match(parseSourceBody({ source: { chapterId: 1, kind: 'quiz' } }).error, /kind/)
  assert.match(parseSourceBody({ source: { kind: 'summary' } }).error, /chapterId/)
  assert.match(parseSourceBody({ source: { chapterId: 1, kind: 'topics', topicIds: [] } }).error, /1 to 3/)
  assert.match(parseSourceBody({ source: { chapterId: 1, kind: 'topics', topicIds: [1, 2, 3, 4] } }).error, /1 to 3/)
  assert.match(parseSourceBody({ source: { chapterId: 1, kind: 'topics', topicIds: ['a'] } }).error, /topicIds/)
  assert.match(parseSourceBody({ source: { chapterId: 1, kind: 'topics' } }).error, /topicIds/)
  assert.match(parseSourceBody({ source: 'jemh1' }).error, /object/)
})
