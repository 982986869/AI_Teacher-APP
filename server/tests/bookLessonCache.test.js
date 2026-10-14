'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { createBookLessonCache } = require('../src/services/bookLessonCache')

function fakeDb() {
  const rows = []
  return {
    _rows: rows,
    book_lessons: {
      async findUnique({ where }) { return rows.find((r) => r.cache_key === where.cache_key) || null },
      async update({ where, data }) { const r = rows.find((r) => r.id === where.id); r.hits += data.hits.increment; return r },
    },
    // store() uses raw SQL for ON CONFLICT DO NOTHING; the fake mimics "insert unless the key exists".
    async $executeRaw(strings, ...values) {
      const key = values[0]
      if (rows.some((r) => r.cache_key === key)) return 0
      rows.push({ id: `bl-${rows.length + 1}`, cache_key: key, chapter_id: values[1], kind: values[2], topic_ids: values[3], grade_level: values[4], teaching_mode: values[5], explanation_style: values[6], prompt_version: values[7], payload: JSON.parse(values[8]), generation_model: values[9], generation_time_ms: values[10], hits: 0 })
      return 1
    },
  }
}

const parts = { chapterId: 10, kind: 'topics', topicIds: [102, 101], gradeLevel: '10', teachingMode: 'intermediate', explanationStyle: 'visual', promptVersion: 1 }

test('cacheKey is stable, order-independent for topic ids, and changes with every part', () => {
  const c = createBookLessonCache(fakeDb())
  const k = c.cacheKey(parts)
  assert.equal(k, c.cacheKey({ ...parts, topicIds: [101, 102] }))
  assert.notEqual(k, c.cacheKey({ ...parts, teachingMode: 'exam' }))
  assert.notEqual(k, c.cacheKey({ ...parts, explanationStyle: 'story' }))
  assert.notEqual(k, c.cacheKey({ ...parts, promptVersion: 2 }), 'a prompt bump is a miss')
  assert.notEqual(k, c.cacheKey({ ...parts, kind: 'summary', topicIds: [] }))
  assert.notEqual(k, c.cacheKey({ ...parts, gradeLevel: '11' }))
  assert.match(k, /^[0-9a-f]{40}$/)
})

test('store then find returns the payload and counts hits', async () => {
  const db = fakeDb(); const c = createBookLessonCache(db)
  const key = c.cacheKey(parts)
  assert.equal(await c.find(key), null)
  const row = await c.store({ key, parts, payload: { lessonTitle: 'T', slides: [] }, generationModel: 'm', generationTimeMs: 1234 })
  assert.equal(row.cache_key, key)
  assert.deepEqual(row.topic_ids, [102, 101])
  const hit = await c.find(key)
  assert.equal(hit.payload.lessonTitle, 'T')
  assert.equal(hit.hits, 1)
})

test('two concurrent stores of the same key keep ONE row and both callers get it', async () => {
  const db = fakeDb(); const c = createBookLessonCache(db)
  const key = c.cacheKey(parts)
  const [a, b] = await Promise.all([
    c.store({ key, parts, payload: { lessonTitle: 'A', slides: [] }, generationModel: 'm', generationTimeMs: 1 }),
    c.store({ key, parts, payload: { lessonTitle: 'B', slides: [] }, generationModel: 'm', generationTimeMs: 1 }),
  ])
  assert.equal(db._rows.length, 1)
  assert.equal(a.id, b.id)
})
