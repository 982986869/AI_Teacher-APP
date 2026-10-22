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

const PATH_RE = /^[MLQCZ0-9 ,.\-]+$/
// Numbers per command. Repeats are allowed (L10,10 20,20) in whole multiples.
const PATH_ARGS = { M: 2, L: 2, Q: 4, C: 6, Z: 0 }

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// react-native-svg's Android PathParser THROWS (uncaught, in a native prop setter) on a
// malformed `d`: a path not starting with M, a command with too few numbers, a number
// after Z. A character allow-list cannot catch those, so the path is tokenised, checked
// command by command, every coordinate clamped to the board, and re-emitted in one
// canonical spelling ("M10,10 L20,20 Q30,30 40,40 Z"). Absolute commands only — relative
// ones (m l q c) cannot be clamped meaningfully and are refused.
function normalizePath(d) {
  if (typeof d !== 'string') return null
  const s = d.trim()
  if (!s || s.length > MAX_PATH || !PATH_RE.test(s)) return null
  const tokens = s.match(/[MLQCZ]|-?\d*\.?\d+/g) || []
  if (!tokens.length || tokens[0] !== 'M') return null
  const out = []
  let i = 0
  while (i < tokens.length) {
    const cmd = tokens[i]
    if (!(cmd in PATH_ARGS)) return null // a number where a command should be
    i += 1
    const nums = []
    while (i < tokens.length && !(tokens[i] in PATH_ARGS)) {
      const n = Number(tokens[i])
      if (!Number.isFinite(n)) return null
      nums.push(n)
      i += 1
    }
    const need = PATH_ARGS[cmd]
    if (need === 0) {
      if (nums.length) return null
      out.push('Z')
      continue
    }
    if (!nums.length || nums.length % need !== 0) return null
    for (let k = 0; k < nums.length; k += need) {
      const pairs = []
      for (let j = 0; j < need; j += 2) {
        pairs.push(`${clamp(nums[k + j], 0, BOARD_W)},${clamp(nums[k + j + 1], 0, BOARD_H)}`)
      }
      out.push(`${cmd}${pairs.join(' ')}`)
    }
  }
  return out.join(' ')
}

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
    const d = normalizePath(raw.d)
    if (!d) return null
    out.d = d
  }

  // A highlight is the translucent marker swipe behind text — yellow unless told otherwise.
  out.color = raw.color === undefined && op === 'highlight' ? 'yellow' : color(raw.color)
  return out
}

// Served in MOCK_AI mode so the app can be exercised without a model key.
const MOCK_BOARD_SAMPLE = [
  { op: 'clear' },
  { op: 'rect', x: 60, y: 40, w: 180, h: 90, color: 'blue' },
  { op: 'text', x: 70, y: 30, text: 'Rectangle', size: 14, color: 'chalk' },
]

module.exports = { BOARD_W, BOARD_H, MAX_ELEMENTS, MAX_TEXT, MAX_PATH, COLORS, validateElement, normalizePath, MOCK_BOARD_SAMPLE }
