'use strict'

// Board elements the AI teacher draws while answering a doubt. The model emits them as
// [[board:{...}]] markers inside its streamed text (see boardStream.js); this module is
// the only gate between that JSON and the app's SVG layer. Everything that leaves
// validateElement() is a known op with finite, clamped numbers and bounded strings, so
// the app can render without a second round of checks.
//
// Coordinate space is 300 x 180, top-left origin — the same viewBox the lesson boards
// use (DiagramRenderer VIEW_W/VIEW_H), so the model's numbers mean the same thing on
// every board surface.

const BOARD_W = 300
const BOARD_H = 180
const MAX_ELEMENTS = 24
const MAX_TEXT = 40
const MAX_PATH = 400
const COLORS = ['chalk', 'yellow', 'blue', 'green', 'pink', 'orange']

const PATH_RE = /^[MLQCZmlqcz0-9 ,.\-]+$/

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Number() of anything that is not already a finite number → NaN → reject. Strings
// like "12" are accepted because the model sometimes quotes numbers.
function num(v) {
  if (typeof v === 'string' && v.trim() === '') return NaN
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

// Field kinds decide the clamp range. x/y are positions; w/h/r are sizes.
const KIND = {
  x: [0, BOARD_W], y: [0, BOARD_H],
  size: [1, BOARD_W], radius: [1, BOARD_H / 2],
}
const FIELDS = {
  rect: { x: 'x', y: 'y', w: 'size', h: 'size' },
  highlight: { x: 'x', y: 'y', w: 'size', h: 'size' },
  circle: { cx: 'x', cy: 'y', r: 'radius' },
  line: { x1: 'x', y1: 'y', x2: 'x', y2: 'y' },
  arrow: { x1: 'x', y1: 'y', x2: 'x', y2: 'y' },
  text: { x: 'x', y: 'y' },
  path: {},
  clear: {},
}

function color(v) {
  return COLORS.includes(v) ? v : 'chalk'
}

function validateElement(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const op = raw.op
  if (typeof op !== 'string' || !Object.prototype.hasOwnProperty.call(FIELDS, op)) return null
  if (op === 'clear') return { op: 'clear' }

  const out = { op }
  for (const [field, kind] of Object.entries(FIELDS[op])) {
    const n = num(raw[field])
    if (Number.isNaN(n)) return null
    const [lo, hi] = KIND[kind]
    out[field] = clamp(n, lo, hi)
  }

  if (op === 'text') {
    const text = typeof raw.text === 'string' ? raw.text.trim() : ''
    if (!text) return null
    out.text = text.slice(0, MAX_TEXT)
    const size = raw.size === undefined || raw.size === null ? 14 : num(raw.size)
    out.size = Number.isNaN(size) ? 14 : clamp(size, 10, 24)
  }

  if (op === 'path') {
    const d = typeof raw.d === 'string' ? raw.d.trim() : ''
    if (!d || d.length > MAX_PATH || !PATH_RE.test(d)) return null
    out.d = d
  }

  out.color = color(raw.color)
  return out
}

// Served in MOCK_AI mode so the app can be exercised without a model key.
const MOCK_BOARD_SAMPLE = [
  { op: 'clear' },
  { op: 'rect', x: 60, y: 40, w: 180, h: 90, color: 'blue' },
  { op: 'text', x: 70, y: 30, text: 'Rectangle', size: 14, color: 'chalk' },
]

module.exports = { BOARD_W, BOARD_H, MAX_ELEMENTS, MAX_TEXT, MAX_PATH, COLORS, validateElement, MOCK_BOARD_SAMPLE }
