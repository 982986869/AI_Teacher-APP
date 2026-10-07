'use strict'

// Validates the lesson LLM's optional `visualData.shapes` (board drawing) — see
// docs/superpowers/specs/2026-10-06-board-shapes-design.md. Canvas is 100 × 60, y down.
// Never throws: a bad drawing must not fail lesson generation, it just isn't drawn.

const GRID_W = 100
const GRID_H = 60
const MAX_SHAPES = 14
const MAX_STEPS = 6
const COLORS = ['orange', 'blue', 'green', 'pink', 'violet', 'ink']
const KINDS = ['line', 'arrow', 'circle', 'ellipse', 'rect', 'polygon', 'curve', 'arc', 'axes', 'dot', 'text']
const CONNECTORS = ['line', 'arrow']
// what a connector can attach to on the board (shapeLayout.buildNode)
const NODE_KINDS = ['circle', 'ellipse', 'rect', 'polygon', 'dot']

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const cleanStr = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '')
const point = (p) => (Array.isArray(p) && num(p[0]) != null && num(p[1]) != null
  ? [clamp(p[0], 0, GRID_W), clamp(p[1], 0, GRID_H)] : null)
const points = (ps, min, max) => {
  if (!Array.isArray(ps)) return null
  const out = ps.map(point).filter(Boolean).slice(0, max)
  return out.length >= min ? out : null
}
const size = (v, lo, hi) => (num(v) != null && v > 0 ? clamp(v, lo, hi) : null)
const endpoint = (v) => (typeof v === 'string' ? cleanStr(v, 24) || null : point(v))

function geometry(s) {
  switch (s.kind) {
    case 'circle': { const at = point(s.at); const r = size(s.r, 1, 30); return at && r ? { at, r } : null }
    case 'ellipse': { const at = point(s.at); const rx = size(s.rx, 1, 50); const ry = size(s.ry, 1, 30); return at && rx && ry ? { at, rx, ry } : null }
    case 'rect': { const at = point(s.at); const w = size(s.w, 1, GRID_W); const h = size(s.h, 1, GRID_H); return at && w && h ? { at, w, h } : null }
    case 'polygon': { const p = points(s.points, 3, 8); return p ? { points: p } : null }
    case 'curve': { const p = points(s.points, 2, 12); return p ? { points: p } : null }
    case 'arc': {
      const at = point(s.at); const r = size(s.r, 1, 30)
      const start = num(s.start) != null ? clamp(s.start, -360, 360) : 0
      const end = num(s.end) != null ? clamp(s.end, -360, 360) : 90
      return at && r && start !== end ? { at, r, start, end } : null
    }
    case 'axes': {
      const at = point(s.at); const w = size(s.w, 5, GRID_W); const h = size(s.h, 5, GRID_H)
      return at && w && h ? { at, w, h, x: cleanStr(s.x, 18), y: cleanStr(s.y, 18) } : null
    }
    case 'dot': { const at = point(s.at); return at ? { at } : null }
    case 'text': { const at = point(s.at); const text = cleanStr(s.text, 32); return at && text ? { at, text } : null }
    case 'line': case 'arrow': { const from = endpoint(s.from); const to = endpoint(s.to); return from && to ? { from, to } : null }
    default: return null
  }
}

function normalizeOne(s) {
  if (!s || typeof s !== 'object' || !KINDS.includes(s.kind)) return null
  const g = geometry(s)
  if (!g) return null
  const out = { kind: s.kind, ...g }
  // any short name the model picks ("load R", "ε") — it is only ever compared
  const id = cleanStr(s.id, 24) || null
  if (id) out.id = id
  const label = cleanStr(s.label, 18)
  if (label) out.label = label
  out.color = COLORS.includes(s.color) ? s.color : 'ink'
  if (s.fill === true) out.fill = true
  if (s.dashed === true) out.dashed = true
  if (Number.isInteger(s.step) && s.step >= 1) out.step = s.step
  return out
}

function normalizeShapes(raw) {
  try {
    if (!Array.isArray(raw)) return undefined
    let shapes = raw.map(normalizeOne).filter(Boolean).slice(0, MAX_SHAPES)
    // connectors may only point at a kept node shape (one the board can attach to)
    const targets = new Set(shapes.filter((s) => s.id && NODE_KINDS.includes(s.kind)).map((s) => s.id))
    const okEnd = (e, self) => Array.isArray(e) || (e !== self && targets.has(e))
    shapes = shapes.filter((s) => !CONNECTORS.includes(s.kind) || (okEnd(s.from, s.id) && okEnd(s.to, s.id)))
    // dense steps 1..k, capped
    const given = [...new Set(shapes.map((s) => s.step).filter(Boolean))].sort((a, b) => a - b)
    for (const s of shapes) if (s.step) s.step = Math.min(MAX_STEPS, given.indexOf(s.step) + 1)
    if (shapes.filter((s) => s.kind !== 'text').length < 2) return undefined
    return shapes
  } catch (e) {
    return undefined
  }
}

module.exports = { normalizeShapes, MAX_SHAPES, MAX_STEPS, GRID_W, GRID_H }
