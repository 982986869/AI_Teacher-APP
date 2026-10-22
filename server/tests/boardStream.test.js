'use strict'

// The model writes [[board:{...}]] markers inside its streamed answer. The parser must
// hand the app clean spoken text and separate elements, whatever chunk boundaries the
// network produces — a marker split mid-JSON must never leak into the caption or TTS.

const test = require('node:test')
const assert = require('node:assert/strict')
const { createBoardStreamParser } = require('../src/utils/boardStream')

const RECT = '[[board:{"op":"rect","x":10,"y":10,"w":50,"h":40}]]'

function run(chunks, opts) {
  const text = []
  const els = []
  const p = createBoardStreamParser({ onText: (t) => text.push(t), onElement: (e) => els.push(e), ...opts })
  for (const c of chunks) p.push(c)
  p.end()
  return { text: text.join(''), els, p }
}

test('marker on its own line is removed with its newline', () => {
  const r = run(['A square.\n', RECT, '\nSee it.'])
  assert.equal(r.text, 'A square.\nSee it.')
  assert.equal(r.els.length, 1)
  assert.equal(r.els[0].op, 'rect')
  assert.equal(r.p.text, 'A square.\nSee it.')
})

test('splits a marker across chunks', () => {
  const r = run(['Look.\n[[bo', 'ard:{"op":"re', 'ct","x":1,"y":2,"w":3,"h":4}', ']]\nDone.'])
  assert.equal(r.text, 'Look.\nDone.')
  assert.deepEqual(r.els, [{ op: 'rect', x: 1, y: 2, w: 3, h: 4, color: 'chalk' }])
})

test('marker mid-sentence keeps both halves', () => {
  const r = run(['Draw a box ' + RECT + ' like this.'])
  assert.equal(r.text, 'Draw a box  like this.')
  assert.equal(r.els.length, 1)
})

test('invalid JSON and invalid elements are dropped silently', () => {
  const r = run(['A.[[board:{not json}]]B.[[board:{"op":"nope"}]]C.'])
  assert.equal(r.text, 'A.B.C.')
  assert.equal(r.els.length, 0)
})

test('caps elements at maxElements', () => {
  const r = run([Array(5).fill(RECT).join('')], { maxElements: 3 })
  assert.equal(r.els.length, 3)
})

test('unclosed marker at end is discarded, text before it kept', () => {
  const r = run(['Keep this.\n[[board:{"op":"rect","x":1'])
  assert.equal(r.text, 'Keep this.\n')
  assert.equal(r.els.length, 0)
})

test('a lone bracket that is not a marker is plain text', () => {
  const r = run(['Array [[1,2]] is fine.'])
  assert.equal(r.text, 'Array [[1,2]] is fine.')
})

test('clear passes through as an element', () => {
  const r = run(['[[board:{"op":"clear"}]]Hi'])
  assert.deepEqual(r.els, [{ op: 'clear' }])
  assert.equal(r.text, 'Hi')
})

// ── Review fix: one bad marker must not swallow the rest of the answer ────────
test('a marker that never closes ends at its line; later sentences are still spoken', () => {
  const r = run(['A triangle has three sides.\n[[board:{"op":"rect","x":1,"y":1,"w":5,"h":5}]\nThe angles add to 180 degrees.\nClear?'])
  assert.equal(r.text, 'A triangle has three sides.\nThe angles add to 180 degrees.\nClear?')
  assert.equal(r.els.length, 0)
})
test('a runaway marker with no newline is cut off after 600 characters', () => {
  const r = run(['Start.\n[[board:{"op":"text","text":"' + 'x'.repeat(700), ' End.'])
  assert.equal(r.text.startsWith('Start.\n'), true)
  assert.equal(r.text.includes('[[board:'), false)
  assert.equal(r.els.length, 0)
})
