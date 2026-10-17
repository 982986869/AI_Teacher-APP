'use strict'

// Board elements come from the model mid-stream. Everything here must be safe to hand to
// the app's SVG layer: known ops only, finite clamped numbers, bounded text and paths.

const test = require('node:test')
const assert = require('node:assert/strict')
const { validateElement, MOCK_BOARD_SAMPLE, MAX_TEXT } = require('../src/utils/boardElements')

test('rect: keeps fields, defaults color to chalk', () => {
  assert.deepEqual(validateElement({ op: 'rect', x: 10, y: 20, w: 30, h: 40, junk: 1 }),
    { op: 'rect', x: 10, y: 20, w: 30, h: 40, color: 'chalk' })
})

test('clamps coordinates into the 300x180 board', () => {
  assert.deepEqual(validateElement({ op: 'line', x1: -5, y1: 99999, x2: 400, y2: 0 }),
    { op: 'line', x1: 0, y1: 180, x2: 300, y2: 0, color: 'chalk' })
})

test('drops unknown op', () => { assert.equal(validateElement({ op: 'triangle', x: 1 }), null) })

test('drops non-finite numbers', () => {
  assert.equal(validateElement({ op: 'circle', cx: 'abc', cy: 10, r: 5 }), null)
  assert.equal(validateElement({ op: 'circle', cx: NaN, cy: 10, r: 5 }), null)
})

test('text: truncates to 40, size defaults and clamps, unknown color -> chalk', () => {
  const long = 'x'.repeat(60)
  const el = validateElement({ op: 'text', x: 1, y: 2, text: long, size: 99, color: 'neon' })
  assert.equal(el.text.length, MAX_TEXT)
  assert.equal(el.size, 24)
  assert.equal(el.color, 'chalk')
  assert.equal(validateElement({ op: 'text', x: 1, y: 2, text: '   ' }), null)
  assert.equal(validateElement({ op: 'text', x: 1, y: 2, text: 'Hi' }).size, 14)
})

test('path: accepts M L Q C Z only, rejects scripts and long paths', () => {
  assert.equal(validateElement({ op: 'path', d: 'M10,10 L50,50 Q60,70 80,80 Z' }).d, 'M10,10 L50,50 Q60,70 80,80 Z')
  assert.equal(validateElement({ op: 'path', d: 'M10,10 A5 5 0 0 1 20 20' }), null)
  assert.equal(validateElement({ op: 'path', d: 'M' + '1,1 L'.repeat(200) }), null)
})

test('clear has no fields', () => { assert.deepEqual(validateElement({ op: 'clear', x: 5 }), { op: 'clear' }) })

test('non-objects are null', () => { assert.equal(validateElement(null), null); assert.equal(validateElement('rect'), null) })

test('mock sample is valid', () => { for (const el of MOCK_BOARD_SAMPLE) assert.deepEqual(validateElement(el), el) })

// ── Review fixes ──────────────────────────────────────────────────────────────
// react-native-svg's Android PathParser throws on a malformed `d` (first command not
// M, too few numbers for a command, a number after Z). Character-class checking is
// not enough: the server must tokenise, verify, clamp and re-emit the path.
test('path: rejects malformed paths the Android parser would throw on', () => {
  for (const d of ['L10,10 L20,20', 'M10', 'M10,10 Q20,20', 'M10,10 C1,2 3,4', 'M10,10 Z 5,5', 'm10,10 l5,5']) {
    assert.equal(validateElement({ op: 'path', d }), null, d)
  }
})
test('path: clamps every coordinate and re-emits a canonical path', () => {
  assert.equal(validateElement({ op: 'path', d: 'M99999,99999 L5,5' }).d, 'M300,180 L5,5')
  assert.equal(validateElement({ op: 'path', d: 'M10 10L50 50 Q 60,70 80,80Z' }).d, 'M10,10 L50,50 Q60,70 80,80 Z')
  assert.equal(validateElement({ op: 'path', d: 'M0,0 L10,10 20,20 30,30' }).d, 'M0,0 L10,10 L20,20 L30,30')
})
test('highlight defaults to yellow, the translucent marker colour', () => {
  assert.equal(validateElement({ op: 'highlight', x: 1, y: 1, w: 5, h: 5 }).color, 'yellow')
  assert.equal(validateElement({ op: 'highlight', x: 1, y: 1, w: 5, h: 5, color: 'blue' }).color, 'blue')
})
