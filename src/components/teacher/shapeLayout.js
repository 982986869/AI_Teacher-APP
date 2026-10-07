// ── SHAPES LAYOUT ─────────────────────────────────────────────────────────────
// Turns the lesson model's `visualData.shapes` (primitives on a 100 × 60 grid, y down)
// into strokes the board can chalk on and labels placed so they never touch a stroke
// or each other. The model decides WHAT to draw; this decides where the text goes —
// the part models are bad at, and the cause of overlapping boards. Pure (no React):
// __tests__/shapeLayout.test.mjs proves the guarantees, including a seeded fuzz.
import { fitLabel, labelBox, boxesOverlap } from './boardLayout.js';

export const UNIT = 3;               // grid → viewBox units (100 × 60 → 300 × 180)
export const MAX_STEPS = 6;
const CANVAS = { x0: 0, y0: 0, x1: 300, y1: 180 };
const ASPECT_MIN = 1.4;
const ASPECT_MAX = 2.2;
const MIN_VIEW_W = 160;
const PAD = 8;
const GAP = 4;
// Labels are sized for the screen, not the viewBox: the board is ~BOARD_PX × BOARD_H_PX
// on a 360-dp phone and the fitted view scales into it ("meet"), so a 13-unit label in
// a 350-unit view rendered at ~9px. The type is picked once, from the region the labels
// are kept inside (the drawing plus a margin), so labels can neither shrink the drawing
// into a corner nor spill outside that region while a readable spot exists.
export const BOARD_PX = 237;
export const BOARD_H_PX = 188;
export const MIN_LABEL_PX = 11;
const MIN_UNITS = 9;
const MAX_UNITS = 20;
const MARGINS = [0.1, 0.2, 0.3];   // label region = drawing + this share of its size
const labelW = (size) => size * 9; // ~16 characters a line
const STROKE_R = 3;                  // half-thickness of a stroke as an obstacle
const COLORS = new Set(['orange', 'blue', 'green', 'pink', 'violet', 'ink']);

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r1 = (v) => Math.round(v * 10) / 10;
const pt = (p) => (Array.isArray(p) && num(p[0]) != null && num(p[1]) != null
  ? { x: clamp(p[0], 0, 100) * UNIT, y: clamp(p[1], 0, 60) * UNIT } : null);
const pos = (v, max) => (num(v) != null && v > 0 ? Math.min(v, max) * UNIT : null);
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

// ── steps ─────────────────────────────────────────────────────────────────────
export function assignSteps(shapes) {
  const list = Array.isArray(shapes) ? shapes : [];
  const given = list.map((s) => (s && Number.isInteger(s.step) && s.step >= 1 ? s.step : null));
  let raw;
  if (given.some((g) => g != null)) {
    let prev = given.find((g) => g != null);
    raw = given.map((g) => { if (g != null) prev = g; return prev; });
  } else {
    // each labelled shape opens a step; unlabelled shapes join the NEXT labelled one
    // what actually gets text on the board: axes show their x/y names, never `label`
    const labelled = list.map((s) => !!(s && (s.kind === 'axes' ? (str(s.x) || str(s.y)) : (str(s.label) || (s.kind === 'text' && str(s.text))))));
    raw = new Array(list.length);
    let step = 0;
    for (let i = 0; i < list.length; i += 1) if (labelled[i]) { step += 1; raw[i] = step; }
    let next = step || 1;
    for (let i = list.length - 1; i >= 0; i -= 1) { if (labelled[i]) next = raw[i]; else raw[i] = next; }
  }
  const uniq = [...new Set(raw)].sort((a, b) => a - b);
  return raw.map((r) => Math.min(MAX_STEPS, uniq.indexOf(r) + 1));
}

export function shapesStepCount(shapes) {
  const L = layoutShapes(shapes);
  return L ? L.steps : 0;
}

// ── geometry ──────────────────────────────────────────────────────────────────
const pathOf = (pts, closed) => pts.map((p, i) => `${i ? 'L' : 'M'}${r1(p.x)},${r1(p.y)}`).join(' ') + (closed ? ' Z' : '');
function lengthOf(pts, closed) {
  let L = 0;
  for (let i = 1; i < pts.length; i += 1) L += dist(pts[i - 1], pts[i]);
  if (closed && pts.length > 2) L += dist(pts[pts.length - 1], pts[0]);
  return Math.max(1, L);
}
function ellipsePts(cx, cy, rx, ry, n = 32) {
  return Array.from({ length: n }, (_, i) => { const t = (i / n) * 2 * Math.PI; return { x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) }; });
}
function arcPts(cx, cy, r, a0, a1) {
  const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 10));
  return Array.from({ length: n + 1 }, (_, i) => { const t = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; return { x: cx + r * Math.cos(t), y: cy - r * Math.sin(t) }; });
}
function catmullRom(pts, per = 8) {
  if (pts.length < 3) return pts;
  const out = [];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[Math.max(0, i - 1)]; const p1 = pts[i]; const p2 = pts[i + 1]; const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k += 1) {
      const t = k / per; const t2 = t * t; const t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function pointAlong(pts, t) {
  const total = lengthOf(pts, false);
  let want = total * t;
  for (let i = 1; i < pts.length; i += 1) {
    const seg = dist(pts[i - 1], pts[i]);
    if (want <= seg || i === pts.length - 1) {
      const k = seg ? Math.min(1, want / seg) : 0;
      const nx = -(pts[i].y - pts[i - 1].y) / (seg || 1); const ny = (pts[i].x - pts[i - 1].x) / (seg || 1);
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k, nx: seg ? nx : 0, ny: seg ? ny : -1 };
    }
    want -= seg;
  }
  return { x: pts[0].x, y: pts[0].y, nx: 0, ny: -1 };
}
function sampleBoxes(pts, closed) {
  const out = [];
  const seq = closed && pts.length > 2 ? [...pts, pts[0]] : pts;
  const add = (p) => out.push({ x0: p.x - STROKE_R, y0: p.y - STROKE_R, x1: p.x + STROKE_R, y1: p.y + STROKE_R });
  if (seq.length === 1) add(seq[0]);
  for (let i = 1; i < seq.length; i += 1) {
    const a = seq[i - 1]; const b = seq[i];
    const n = Math.max(1, Math.ceil(dist(a, b) / 4));
    for (let k = 0; k <= n; k += 1) add({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
  }
  return out;
}

// A closed "node" shape: what connectors attach to and labels sit around.
function buildNode(s) {
  const c = pt(s.at);
  switch (s.kind) {
    case 'circle': { const r = pos(s.r, 30); if (!c || !r) return null; return { c, rx: Math.max(r, 1), ry: Math.max(r, 1), outline: ellipsePts(c.x, c.y, Math.max(r, 1), Math.max(r, 1)), closed: true, inside: true }; }
    case 'ellipse': { const rx = pos(s.rx, 50); const ry = pos(s.ry, 30); if (!c || !rx || !ry) return null; return { c, rx, ry, outline: ellipsePts(c.x, c.y, rx, ry), closed: true, inside: true }; }
    case 'rect': {
      const w = pos(s.w, 100); const h = pos(s.h, 60); if (!c || !w || !h) return null;
      const pts = [c, { x: c.x + w, y: c.y }, { x: c.x + w, y: c.y + h }, { x: c.x, y: c.y + h }];
      return { c: { x: c.x + w / 2, y: c.y + h / 2 }, rx: w / 2, ry: h / 2, box: true, outline: pts, closed: true, inside: true };
    }
    case 'polygon': {
      const pts = Array.isArray(s.points) ? s.points.map(pt).filter(Boolean).slice(0, 8) : [];
      if (pts.length < 3) return null;
      const xs = pts.map((p) => p.x); const ys = pts.map((p) => p.y);
      const cc = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
      return { c: cc, rx: (Math.max(...xs) - Math.min(...xs)) / 2 || 1, ry: (Math.max(...ys) - Math.min(...ys)) / 2 || 1, box: true, outline: pts, closed: true, inside: true };
    }
    case 'dot': return c ? { c, rx: 4, ry: 4, outline: [c], closed: false, dot: true } : null;
    default: return null;
  }
}

// Where a connector meets a node's edge, heading toward `toward`.
function edgePoint(node, toward) {
  const dx = toward.x - node.c.x; const dy = toward.y - node.c.y;
  const len = Math.hypot(dx, dy);
  if (!len) return node.c;
  const ux = dx / len; const uy = dy / len;
  const t = node.box
    ? Math.min(ux ? node.rx / Math.abs(ux) : Infinity, uy ? node.ry / Math.abs(uy) : Infinity)
    : 1 / Math.sqrt((ux / node.rx) ** 2 + (uy / node.ry) ** 2);
  return { x: node.c.x + ux * (t + 2), y: node.c.y + uy * (t + 2) };
}

function arrowHead(a, b) {
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const hl = 10; const sp = 0.45;
  return [{ x: b.x - hl * Math.cos(ang - sp), y: b.y - hl * Math.sin(ang - sp) }, b, { x: b.x - hl * Math.cos(ang + sp), y: b.y - hl * Math.sin(ang + sp) }];
}

// ── label candidates (preference order) ───────────────────────────────────────
function around(c, rx, ry, w, h) {
  return [-90, 90, 0, 180, -45, -135, 45, 135].map((a) => {
    const t = (a * Math.PI) / 180; const ux = Math.cos(t); const uy = Math.sin(t);
    return { x: c.x + ux * (rx + GAP + w / 2), y: c.y + uy * (ry + GAP + h / 2) };
  });
}
function alongCands(pts, w, h) {
  const out = [];
  for (const t of [0.5, 0.3, 0.7]) {
    const p = pointAlong(pts, t);
    const off = GAP + STROKE_R + Math.abs(p.nx) * (w / 2) + Math.abs(p.ny) * (h / 2);
    for (const side of [1, -1]) out.push({ x: p.x + p.nx * side * off, y: p.y + p.ny * side * off });
  }
  return out;
}

// ── placement ─────────────────────────────────────────────────────────────────
// Boxes bucketed on a coarse grid, so "is this spot free?" checks a handful of
// neighbours instead of every stroke sample on the board.
const CELL = 24;
function boxIndex() {
  const cells = new Map();
  const each = (b, fn) => {
    for (let gx = Math.floor(b.x0 / CELL); gx <= Math.floor(b.x1 / CELL); gx += 1) {
      for (let gy = Math.floor(b.y0 / CELL); gy <= Math.floor(b.y1 / CELL); gy += 1) if (fn(gx * 4096 + gy)) return true;
    }
    return false;
  };
  return {
    add(b) { each(b, (k) => { if (!cells.has(k)) cells.set(k, []); cells.get(k).push(b); return false; }); },
    hits(b) {
      return each(b, (k) => {
        const c = cells.get(k);
        if (!c) return false;
        for (let i = 0; i < c.length; i += 1) if (boxesOverlap(b, c[i])) return true;
        return false;
      });
    },
  };
}

const spotsIn = (b, step) => {
  const out = [];
  for (let y = b.y0; y <= b.y1; y += step) for (let x = b.x0; x <= b.x1; x += step) out.push({ x, y });
  return out;
};
const unionBox = (boxes) => ({
  x0: Math.min(...boxes.map((b) => b.x0)), y0: Math.min(...boxes.map((b) => b.y0)),
  x1: Math.max(...boxes.map((b) => b.x1)), y1: Math.max(...boxes.map((b) => b.y1)),
});
const within = (b, R) => b.x0 >= R.x0 && b.y0 >= R.y0 && b.x1 <= R.x1 && b.y1 <= R.y1;
// how many screen px one viewBox unit gets when `view` is fitted into the board
export const pxPerUnit = (view) => Math.min(BOARD_PX / view.w, BOARD_H_PX / view.h);

// Every request gets a label — none is ever dropped. Preference, in order:
//   1. a spot beside its shape, readable size, inside the region R
//   2. the nearest free spot in R at readable size, with a leader line
//   3. the same two at smaller type (still ≥ MIN_UNITS)
//   4. a free spot in a ring around R, then — guaranteed free — past everything placed.
function place(requests, obstacles, R, readable, strict = false) {
  const placed = [];
  const index = boxIndex();
  obstacles.forEach((o) => index.add(o));
  const free = (b) => !index.hits(b);
  let farX = Math.max(R.x1, ...obstacles.map((o) => o.x1));
  const sizes = [...new Set([Math.min(MAX_UNITS, readable + 2), readable, 11, MIN_UNITS])].filter((z) => z >= MIN_UNITS && z <= readable + 2).sort((a, b) => b - a);
  const ringBox = { x0: R.x0 - 90, y0: R.y0 - 60, x1: R.x1 + 90, y1: R.y1 + 60 };
  const inR = spotsIn(R, 8);
  const ring = spotsIn(ringBox, 10).filter((p) => !(p.x >= R.x0 && p.x <= R.x1 && p.y >= R.y0 && p.y <= R.y1));
  const fitAt = (rq, size) => fitLabel(rq.text, { size, maxW: labelW(size), maxLines: 2, min: size });
  const beside = (rq, size, region) => {
    const fit = fitAt(rq, size);
    const probe = labelBox({ x: 0, y: 0, size: fit.size, lines: fit.lines });
    for (const c of rq.cands(probe.x1 - probe.x0, probe.y1 - probe.y0)) {
      const label = { x: c.x, y: c.y, size: fit.size, lines: fit.lines, anchor: 'middle' };
      const box = labelBox(label);
      if (free(box) && (!region || within(box, region))) return { label, box, leader: null };
    }
    return null;
  };
  const leadered = (rq, label, box) => ({ label, box, leader: { x1: clamp(rq.anchor.x, box.x0, box.x1), y1: clamp(rq.anchor.y, box.y0, box.y1), x2: rq.anchor.x, y2: rq.anchor.y } });
  const nearest = (rq, size, spots, region) => {
    const fit = fitAt(rq, size);
    const ax = rq.anchor.x; const ay = rq.anchor.y;
    const order = spots.map((p) => ({ x: p.x, y: p.y, d: (p.x - ax) ** 2 + (p.y - ay) ** 2 })).sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
    for (const sp of order) {
      const label = { x: sp.x, y: sp.y, size: fit.size, lines: fit.lines, anchor: 'middle' };
      const box = labelBox(label);
      if (free(box) && (!region || within(box, region))) return leadered(rq, label, box);
    }
    return null;
  };
  for (const rq of requests) {
    let pick = null;
    for (const size of sizes) {
      if (strict && size < readable) break;
      pick = beside(rq, size, R) || (size <= readable ? nearest(rq, size, inR, R) : null);
      if (pick) break;
    }
    if (!pick && strict) return null;
    if (!pick) pick = beside(rq, MIN_UNITS, null) || nearest(rq, MIN_UNITS, ring, null);
    if (!pick) {
      const fit = fitAt(rq, MIN_UNITS);
      const probe = labelBox({ x: 0, y: 0, size: fit.size, lines: fit.lines });
      const label = { x: farX + GAP + (probe.x1 - probe.x0) / 2, y: rq.anchor.y, size: fit.size, lines: fit.lines, anchor: 'middle' };
      pick = leadered(rq, label, labelBox(label));
    }
    placed.push({ ...pick, step: rq.step, color: rq.color });
    index.add(pick.box);
    farX = Math.max(farX, pick.box.x1);
  }
  return placed;
}

function fitView(boxes) {
  let x0 = Math.min(...boxes.map((b) => b.x0)) - PAD; let y0 = Math.min(...boxes.map((b) => b.y0)) - PAD;
  let w = Math.max(...boxes.map((b) => b.x1)) + PAD - x0; let h = Math.max(...boxes.map((b) => b.y1)) + PAD - y0;
  if (w < MIN_VIEW_W) { x0 -= (MIN_VIEW_W - w) / 2; w = MIN_VIEW_W; }
  if (w / h < ASPECT_MIN) { const nw = h * ASPECT_MIN; x0 -= (nw - w) / 2; w = nw; }
  if (w / h > ASPECT_MAX) { const nh = w / ASPECT_MAX; y0 -= (nh - h) / 2; h = nh; }
  // Round outward, then re-assert the aspect: rounding h up alone can tip it under the floor.
  const up = (v) => Math.ceil(v * 10) / 10;
  const out = { x: r1(x0), y: r1(y0), w: up(w + (x0 - r1(x0))), h: up(h + (y0 - r1(y0))) };
  if (out.w / out.h < ASPECT_MIN) out.w = up(out.h * ASPECT_MIN);
  if (out.w / out.h > ASPECT_MAX) out.h = up(out.w / ASPECT_MAX);
  return out;
}

// ── entry point ───────────────────────────────────────────────────────────────
// The scene builder (step count) and the board (drawing) ask for the same array's
// layout; it is computed once and shared. Treat the result as read-only.
const cache = new WeakMap();
export function layoutShapes(shapes) {
  if (!Array.isArray(shapes) || !shapes.length) return null;
  if (cache.has(shapes)) return cache.get(shapes);
  const out = computeLayout(shapes);
  cache.set(shapes, out);
  return out;
}

function computeLayout(shapes) {
  const list = shapes.filter((s) => s && typeof s === 'object');
  const steps = assignSteps(list);
  const nodes = new Map();
  list.forEach((s, i) => {
    const n = (() => { try { return buildNode(s); } catch (e) { return null; } })();
    if (n) nodes.set(i, n);
    if (n && typeof s.id === 'string') nodes.set(`#${s.id}`, n);
  });

  const items = []; const requests = []; const obstacles = []; const shapeBoxes = [];
  const color = (s) => (COLORS.has(s.color) ? s.color : 'ink');
  const addLabel = (s, i, anchor, cands, text = str(s.label)) => {
    if (text) requests.push({ text, step: steps[i], color: color(s), anchor, cands });
  };
  const addStrokes = (pts, closed) => {
    const boxes = sampleBoxes(pts, closed);
    obstacles.push(...boxes); shapeBoxes.push(...boxes);
    return { d: pathOf(pts, closed), length: lengthOf(pts, closed) };
  };

  list.forEach((s, i) => {
    try {
      const base = { id: `${s.kind}${i}`, kind: s.kind, step: steps[i], color: color(s), dashed: s.dashed === true, fillD: null, strokes: [], dot: null, pointer: null };
      const node = nodes.get(i);
      if (node) {
        if (node.dot) {
          items.push({ ...base, dot: { cx: r1(node.c.x), cy: r1(node.c.y), r: 4 }, pointer: node.c });
          const b = { x0: node.c.x - 5, y0: node.c.y - 5, x1: node.c.x + 5, y1: node.c.y + 5 };
          obstacles.push(b); shapeBoxes.push(b);
        } else {
          const stroke = addStrokes(node.outline, true);
          items.push({ ...base, strokes: [stroke], fillD: s.fill === true ? stroke.d : null, pointer: node.c });
        }
        addLabel(s, i, node.c, (w, h) => [...(node.inside ? [node.c] : []), ...around(node.c, node.rx, node.ry, w, h)]);
        return;
      }
      if (s.kind === 'line' || s.kind === 'arrow') {
        const ref = (e) => (typeof e === 'string' ? nodes.get(`#${e}`) : null);
        const na = ref(s.from); const nb = ref(s.to);
        const a0 = na ? na.c : pt(s.from); const b0 = nb ? nb.c : pt(s.to);
        if (!a0 || !b0) return;
        const a = na ? edgePoint(na, b0) : a0; const b = nb ? edgePoint(nb, a0) : b0;
        if (dist(a, b) < 1) return;
        const strokes = [addStrokes([a, b], false)];
        if (s.kind === 'arrow') strokes.push(addStrokes(arrowHead(a, b), false));
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        items.push({ ...base, strokes, pointer: mid });
        addLabel(s, i, mid, (w, h) => alongCands([a, b], w, h));
        return;
      }
      if (s.kind === 'curve') {
        const raw = Array.isArray(s.points) ? s.points.map(pt).filter(Boolean).slice(0, 12) : [];
        if (raw.length < 2) return;
        const pts = catmullRom(raw);
        const mid = pointAlong(pts, 0.5);
        items.push({ ...base, strokes: [addStrokes(pts, false)], pointer: mid });
        addLabel(s, i, mid, (w, h) => alongCands(pts, w, h));
        return;
      }
      if (s.kind === 'arc') {
        const c = pt(s.at); const r = pos(s.r, 30);
        const a0 = num(s.start) != null ? s.start : 0; const a1 = num(s.end) != null ? s.end : 90;
        if (!c || !r || a0 === a1) return;
        const pts = arcPts(c.x, c.y, r, a0, a1);
        const mid = pointAlong(pts, 0.5);
        items.push({ ...base, strokes: [addStrokes(pts, false)], pointer: mid });
        addLabel(s, i, mid, (w, h) => [...alongCands(pts, w, h), ...around(c, r, r, w, h)]);
        return;
      }
      if (s.kind === 'axes') {
        const o = pt(s.at); const w = pos(s.w, 100); const h = pos(s.h, 60);
        if (!o || !w || !h) return;
        const xe = { x: o.x + w, y: o.y }; const ye = { x: o.x, y: o.y - h };
        const strokes = [addStrokes([o, xe], false), addStrokes(arrowHead(o, xe), false), addStrokes([o, ye], false), addStrokes(arrowHead(o, ye), false)];
        items.push({ ...base, strokes, pointer: o });
        addLabel(s, i, xe, (lw, lh) => [{ x: xe.x - lw / 2, y: xe.y + GAP + STROKE_R + lh / 2 }, { x: xe.x + GAP + lw / 2, y: xe.y }, ...around(xe, 6, 6, lw, lh)], str(s.x));
        addLabel(s, i, ye, (lw, lh) => [{ x: ye.x - GAP - STROKE_R - lw / 2, y: ye.y + lh / 2 }, { x: ye.x, y: ye.y - GAP - lh / 2 }, ...around(ye, 6, 6, lw, lh)], str(s.y));
        return;
      }
      if (s.kind === 'text') {
        const c = pt(s.at); const text = str(s.text);
        if (!c || !text) return;
        addLabel(s, i, c, (w, h) => [c, ...around(c, 0, 0, w, h)], text);
      }
    } catch (e) {
      // one malformed shape must not take the board down
    }
  });

  if (!items.length) return null;
  // Labels live in the drawing plus a margin; their type is whatever reads at
  // MIN_LABEL_PX once that region is fitted to the board (within MIN..MAX units).
  // Widen the region step by step until every label fits at a readable size; past
  // MARGINS' last step the drawing would shrink too far, so the tightest region is used
  // with smaller type instead (never below MIN_UNITS, never dropped, never overlapping).
  const D = unionBox(shapeBoxes);
  const regionAt = (m) => {
    const mx = Math.max(18, m * (D.x1 - D.x0)); const my = Math.max(16, (m + 0.04) * (D.y1 - D.y0));
    const R = { x0: D.x0 - mx, y0: D.y0 - my, x1: D.x1 + mx, y1: D.y1 + my };
    return { R, readable: clamp(Math.ceil((MIN_LABEL_PX / pxPerUnit(fitView([R]))) * 2) / 2, MIN_UNITS, MAX_UNITS) };
  };
  let placed = null;
  for (const m of MARGINS) {
    const { R, readable } = regionAt(m);
    placed = place(requests, obstacles, R, readable, true);
    if (placed) break;
  }
  if (!placed) { const { R, readable } = regionAt(MARGINS[0]); placed = place(requests, obstacles, R, readable); }
  const viewBox = fitView([...shapeBoxes, ...placed.map((p) => p.box)]);
  const used = [...new Set([...items.map((it) => it.step), ...placed.map((p) => p.step)])].sort((a, b) => a - b);
  const renum = (s) => used.indexOf(s) + 1;
  return {
    viewBox,
    steps: used.length,
    labelsRequested: requests.length,
    drawing: { w: r1(D.x1 - D.x0), h: r1(D.y1 - D.y0) },
    items: items.map((it) => ({ ...it, step: renum(it.step), pointer: { x: r1(it.pointer.x), y: r1(it.pointer.y) } })),
    labels: placed.map((p) => ({ ...p.label, step: renum(p.step), color: p.color, leader: p.leader })),
    obstacles,
  };
}
