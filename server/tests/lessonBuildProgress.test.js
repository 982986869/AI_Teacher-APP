// Live lesson-build progress: the % the app shows while a lesson generates.
const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')

const progress = require('../src/services/lessonBuildProgress')
const { watchLessonStream } = require('../src/providers/ai/AnthropicProvider')

const PID = 'test-build-0001'

test('rejects malformed progress ids', () => {
  assert.equal(progress.isProgressId('short'), false)
  assert.equal(progress.isProgressId('has spaces in it'), false)
  assert.equal(progress.isProgressId(123), false)
  assert.equal(progress.isProgressId(PID), true)
})

test('no progressId → reporter is a harmless no-op', () => {
  const report = progress.start('u0', undefined)
  assert.doesNotThrow(() => report('slide', { n: 3 }))
  assert.equal(progress.get('u0', undefined), null)
})

test('percent rises through the phases and never goes back', () => {
  const report = progress.start('u1', PID)
  const seen = []
  const snap = () => { const p = progress.get('u1', PID); seen.push(p.percent); return p }

  report('context'); snap()
  report('thinking'); snap()
  for (let n = 1; n <= 9; n += 1) { report('slide', { n }); snap() }
  report('slide', { n: 2 }) // late / out-of-order event
  const afterLate = snap()
  report('saving'); snap()
  report('done'); const done = snap()

  for (let i = 1; i < seen.length; i += 1) assert.ok(seen[i] >= seen[i - 1], `went back: ${seen}`)
  assert.equal(afterLate.slide, 9)
  assert.ok(seen[2] > 25 && seen[2] < 35, `first slide ~29%, got ${seen[2]}`)
  assert.ok(afterLate.percent <= 92, 'writing phase stays below the saving step')
  assert.equal(done.percent, 100)
  assert.equal(done.phase, 'done')
})

test('a build is only visible to the user who started it', () => {
  progress.start('owner', 'private-build-01')
  assert.ok(progress.get('owner', 'private-build-01'))
  assert.equal(progress.get('someone-else', 'private-build-01'), null)
})

test('stream watcher counts slides, including a key split across deltas', () => {
  const stream = new EventEmitter()
  const events = []
  watchLessonStream(stream, (e, d) => events.push([e, d && d.n]))

  stream.emit('streamEvent', { type: 'content_block_start', content_block: { type: 'thinking' } })
  stream.emit('text', '{"slides":[{"slideNumber":1,"slideTitle":"a"},{"slide')
  stream.emit('text', 'Number":2,"slideTitle":"b"},{"slideNumber":3}')
  stream.emit('text', ',"x":"no key here"')

  assert.deepEqual(events, [['thinking', undefined], ['slide', 1], ['slide', 3]])
})

test('a throwing reporter never breaks the stream', () => {
  const stream = new EventEmitter()
  watchLessonStream(stream, () => { throw new Error('boom') })
  assert.doesNotThrow(() => stream.emit('text', '"slideNumber":1'))
})
