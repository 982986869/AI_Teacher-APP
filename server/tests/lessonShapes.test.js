'use strict'

const test = require('node:test')
const assert = require('node:assert')

const { normalizeShapes, MAX_SHAPES } = require('../src/utils/lessonShapes')
const { parseAndValidateLesson } = require('../src/providers/ai/AnthropicProvider')

const circle = (id, x, extra = {}) => ({ id, kind: 'circle', at: [x, 30], r: 6, ...extra })

test('keeps valid shapes and clamps coordinates to the 100x60 canvas', () => {
  const out = normalizeShapes([circle('a', 20), { id: 'b', kind: 'rect', at: [150, -9], w: 10, h: 8 }])
  assert.strictEqual(out.length, 2)
  assert.deepStrictEqual(out[1].at, [100, 0])
})

test('drops unknown kinds, non-finite numbers and unknown colors become ink', () => {
  const out = normalizeShapes([circle('a', 20, { color: 'neon' }), { kind: 'blob', at: [1, 1] }, { kind: 'circle', at: [NaN, 3], r: 4 }, circle('b', 60)])
  assert.deepStrictEqual(out.map((s) => s.id), ['a', 'b'])
  assert.strictEqual(out[0].color, 'ink')
})

test('connectors to a missing id, to themselves or to another connector are dropped', () => {
  const out = normalizeShapes([
    circle('a', 20), circle('b', 70),
    { id: 'ab', kind: 'arrow', from: 'a', to: 'b' },
    { kind: 'arrow', from: 'a', to: 'ghost' },
    { id: 'self', kind: 'line', from: 'self', to: 'a' },
    { kind: 'line', from: 'ab', to: 'b' },
  ])
  assert.deepStrictEqual(out.map((s) => s.kind), ['circle', 'circle', 'arrow'])
})

test('labels are trimmed to 18 chars, text to 32, control characters stripped', () => {
  const out = normalizeShapes([circle('a', 20, { label: 'A very very long label indeed' }), { kind: 'text', at: [50, 50], text: `x\u0007${'y'.repeat(60)}` }, circle('b', 70)])
  assert.strictEqual(out[0].label.length, 18)
  assert.strictEqual(out[1].text.length, 32)
  assert.ok(!/\u0007/.test(out[1].text))
})

test(`keeps at most ${14} shapes`, () => {
  const many = Array.from({ length: 30 }, (_, i) => circle(`c${i}`, i * 3))
  assert.strictEqual(normalizeShapes(many).length, MAX_SHAPES)
})

test('steps become dense 1..k and never exceed 6', () => {
  const out = normalizeShapes([2, 5, 9, 9, 40, 70, 80, 90].map((s, i) => circle(`c${i}`, i * 10, { step: s })))
  assert.deepStrictEqual(out.map((s) => s.step), [1, 2, 3, 3, 4, 5, 6, 6])
})

test('fewer than two drawable shapes → undefined (slide falls back)', () => {
  assert.strictEqual(normalizeShapes([circle('a', 20), { kind: 'text', at: [1, 1], text: 'hi' }]), undefined)
  assert.strictEqual(normalizeShapes('nope'), undefined)
})

test('garbage never throws', () => {
  for (const g of [null, 42, {}, [null, 1, 'x', [], { kind: 'polygon', points: 'x' }], [{ kind: 'curve', points: [[1, 2], 'a'] }]]) {
    assert.doesNotThrow(() => normalizeShapes(g))
  }
})

const lessonJson = (visualType, visualData) => JSON.stringify({
  lessonTitle: 'EMF', estimatedDuration: '8 minutes', summary: 's', keyTerms: ['emf'],
  slides: [{ slideNumber: 1, slideTitle: 'Circuit', explanation: 'e', narrationText: 'n', visualType, visualData }],
})

test('parseAndValidateLesson normalizes shapes on DIAGRAM slides only', () => {
  const shapes = [circle('a', 20, { color: 'neon' }), circle('b', 70)]
  const diag = parseAndValidateLesson(lessonJson('DIAGRAM', { components: ['a'], shapes }))
  assert.strictEqual(diag.slides[0].visualData.shapes[0].color, 'ink')
  const ex = parseAndValidateLesson(lessonJson('EXAMPLE', { scenario: 's', shapes }))
  assert.strictEqual(ex.slides[0].visualData.shapes, undefined)
})

test('the lesson prompt documents the shapes schema', () => {
  const src = require('fs').readFileSync(require.resolve('../src/prompts/lessonGeneration.prompt'), 'utf8')
  assert.match(src, /"shapes"/)
  assert.match(src, /100 wide/)
  for (const k of ['circle', 'rect', 'arrow', 'curve', 'arc', 'axes', 'polygon']) assert.match(src, new RegExp(k))
})

test('axis names keep up to 18 chars ("Principal Axis" was cut to "Principal Ax")', () => {
  const out = normalizeShapes([{ kind: 'axes', at: [10, 30], w: 80, h: 20, x: 'Principal Axis', y: 'Height in metres!!' }, circle('a', 50)])
  assert.strictEqual(out[0].x, 'Principal Axis')
  assert.strictEqual(out[0].y.length, 18)
})

test('ids may be any short string ("load R", "ε") — arrows to them survive', () => {
  const out = normalizeShapes([circle('load R', 20), circle('ε', 70), { kind: 'arrow', from: 'load R', to: 'ε' }])
  assert.deepStrictEqual(out.map((s) => s.kind), ['circle', 'circle', 'arrow'])
})

test('connectors may only attach to shapes the board can attach to (not text/curve/arc/axes)', () => {
  const out = normalizeShapes([
    circle('a', 20), circle('b', 70),
    { id: 't', kind: 'text', at: [50, 10], text: 'note' },
    { id: 'c', kind: 'curve', points: [[1, 1], [9, 9]] },
    { kind: 'arrow', from: 'a', to: 't' },
    { kind: 'arrow', from: 'c', to: 'b' },
    { kind: 'arrow', from: 'a', to: 'b' },
  ])
  assert.deepStrictEqual(out.filter((s) => s.kind === 'arrow').map((s) => [s.from, s.to]), [['a', 'b']])
})
