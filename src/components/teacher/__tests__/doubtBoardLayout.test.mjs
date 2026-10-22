// Pure helpers behind the doubt board — no React Native imports, so `node --test` can
// run them straight from the repo (Node 22 loads the ESM .js module by syntax detection).
import test from 'node:test'
import assert from 'node:assert/strict'
import { visibleElements, pathLength, boardColor, createBoardSync } from '../doubtBoardLayout.js'

test('visibleElements: keeps only elements after the last clear, with original keys', () => {
  const els = [{ op: 'rect' }, { op: 'clear' }, { op: 'text' }, { op: 'clear' }, { op: 'arrow' }, { op: 'line' }]
  assert.deepEqual(visibleElements(els), [{ key: 4, el: { op: 'arrow' } }, { key: 5, el: { op: 'line' } }])
  assert.deepEqual(visibleElements([{ op: 'rect' }]), [{ key: 0, el: { op: 'rect' } }])
  assert.deepEqual(visibleElements([]), [])
})

test('pathLength: polyline, Z closes, never below 1', () => {
  assert.equal(pathLength('M0,0 L30,40'), 50)
  assert.equal(pathLength('M0,0 L30,40 Z'), 100)
  assert.equal(pathLength('M5,5'), 1)
})

test('boardColor falls back to chalk', () => {
  const pal = { chalk: '#111', blue: '#00f' }
  assert.equal(boardColor('blue', pal), '#00f')
  assert.equal(boardColor('neon', pal), '#111')
  assert.equal(boardColor(undefined, pal), '#111')
})

test('sync: element released when the sentence before it starts', () => {
  const s = createBoardSync()
  const a = { op: 'clear' }
  const b = { op: 'rect' }
  const c = { op: 'text' }
  s.hold(a, 0); s.hold(b, 1); s.hold(c, 3)
  assert.deepEqual(s.sentenceStarted(1), [a, b])
  assert.deepEqual(s.sentenceStarted(2), [])
  assert.deepEqual(s.sentenceStarted(3), [c])
  assert.deepEqual(s.sentenceStarted(4), [])
})

test('sync: flush releases everything held', () => {
  const s = createBoardSync()
  s.hold({ op: 'rect' }, 2); s.hold({ op: 'line' }, 5)
  assert.deepEqual(s.flush(), [{ op: 'rect' }, { op: 'line' }])
  assert.deepEqual(s.flush(), [])
})

test('sync: reset drops held elements', () => {
  const s = createBoardSync()
  s.hold({ op: 'rect' }, 1)
  s.reset()
  assert.deepEqual(s.sentenceStarted(9), [])
  assert.deepEqual(s.flush(), [])
})

// Review fix: an element whose sentence has ALREADY started must not wait for the next
// sentence (or, worse, for the end-of-answer flush) — it is released at once.
test('sync: hold releases immediately when its sentence already started', () => {
  const s = createBoardSync()
  assert.deepEqual(s.sentenceStarted(2), [])
  assert.deepEqual(s.hold({ op: 'rect' }, 1), [{ op: 'rect' }])
  assert.deepEqual(s.hold({ op: 'line' }, 2), [{ op: 'line' }])
  assert.deepEqual(s.hold({ op: 'text' }, 3), [])
  assert.deepEqual(s.sentenceStarted(3), [{ op: 'text' }])
})
test('sync: an element before any sentence still waits for the first sentence', () => {
  const s = createBoardSync()
  assert.deepEqual(s.hold({ op: 'clear' }, 0), [])
  assert.deepEqual(s.sentenceStarted(1), [{ op: 'clear' }])
})
test('sync: reset forgets which sentences started', () => {
  const s = createBoardSync()
  s.sentenceStarted(5)
  s.reset()
  assert.deepEqual(s.hold({ op: 'rect' }, 1), [])
})
