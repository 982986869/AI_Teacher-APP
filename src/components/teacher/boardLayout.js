// ── BOARD LAYOUT MATHS ────────────────────────────────────────────────────────
// Pure geometry for the lesson boards: how big a label can be and where it goes, so
// that model-authored text never runs into another label or over the drawing. No
// React here on purpose — the boards render what these functions return, and
// __tests__/boardLayout.test.mjs proves the no-overlap promises without a device.
//
// Units are viewBox units. A label is { x, y, size, lines, anchor } where `y` is the
// vertical CENTRE of the block (a wrapped label stays centred on what it names).

// 0.56 em per character is a deliberately generous estimate of the board's bold
// sans — erring wide means a label lands slightly inside its box, never past it.
export const EM_W = 0.56;
export const LINE_H = 1.18;
const textW = (str, size) => String(str).length * size * EM_W;

// Greedy word wrap; null when `text` can't fit `maxLines` lines of `maxW` at `size`.
function wrapToWidth(text, size, maxW, maxLines) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const lines = [];
  let cur = '';
  for (let i = 0; i < words.length; i += 1) {
    const next = cur ? `${cur} ${words[i]}` : words[i];
    if (!cur || textW(next, size) <= maxW) { cur = next; continue; }
    lines.push(cur);
    cur = words[i];
    if (lines.length >= maxLines) return null;
  }
  lines.push(cur);
  if (lines.length > maxLines) return null;
  // a single word wider than the box survives the loop — reject it so the type shrinks
  if (lines.some((l) => textW(l, size) > maxW)) return null;
  return lines;
}

// Shrink the type until the label fits its box, wrapping over `maxLines`; only when
// even the floor size can't hold it is it cut, with an honest ellipsis.
// `truncated` tells a caller the label did NOT really fit (e.g. to move it outside).
export function fitLabel(text, { size, maxW, maxLines = 2, min = 9 }) {
  const str = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  if (!str) return { size, lines: [], truncated: false };
  for (let s = size; s >= min; s -= 1) {
    const lines = wrapToWidth(str, s, maxW, maxLines);
    if (lines) return { size: s, lines, truncated: false };
  }
  const per = Math.max(1, Math.floor(maxW / (min * EM_W)));
  const lines = [];
  for (let i = 0; i < maxLines; i += 1) lines.push(str.slice(i * per, (i + 1) * per));
  const kept = lines.filter(Boolean);
  if (str.length > per * kept.length) kept[kept.length - 1] = `${kept[kept.length - 1].slice(0, -1)}…`;
  return { size: min, lines: kept, truncated: true };
}

// Estimated bounding box of a placed label.
export function labelBox({ x, y, size, lines, anchor = 'middle' }) {
  const w = Math.max(0, ...lines.map((l) => textW(l, size)));
  const h = lines.length * size * LINE_H;
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return { x0, y0: y - h / 2, x1: x0 + w, y1: y + h / 2 };
}

export function boxesOverlap(a, b) {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

const place = (text, at, box) => ({ ...at, anchor: at.anchor || 'middle', ...fitLabel(text, box) });

// ── NUMBER LINE ───────────────────────────────────────────────────────────────
// The classic -5..5 line, widened (with a coarser tick step) to reach any mark that
// falls outside it — a mark at 12 used to be drawn off the right edge of the board.
export function numberLineRange(marks) {
  const nums = (marks || []).filter((v) => Number.isFinite(v));
  let lo = Math.min(-5, ...nums.map((v) => Math.floor(v) - 1));
  let hi = Math.max(5, ...nums.map((v) => Math.ceil(v) + 1));
  // A "nice" step (1, 2, 2.5 or 5 × a power of ten) from the span's own magnitude, so a
  // mark at 3e8 gives a dozen ticks, not 300,000 elements that freeze the board.
  const raw = (hi - lo) / 10;
  const mag = 10 ** Math.floor(Math.log10(raw));
  let step = Math.max(1, [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw));
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  if ((hi - lo) / step > 12) { step *= 2; lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step; }
  return { lo, hi, step };
}

// ── CHART ─────────────────────────────────────────────────────────────────────
// Past six bars the value and axis labels in a 300-wide board start sitting on each
// other, so the chart shows the first six. The Director counts beats from this too.
export const CHART_MAX_BARS = 6;
const CHART_FALLBACK = [40, 70, 55, 90];
export function chartSeries(chart) {
  const c = chart || {};
  const rawV = Array.isArray(c.values) ? c.values : [];
  const rawL = Array.isArray(c.labels) ? c.labels : [];
  const pairs = rawV
    .map((v, i) => ({ v: typeof v === 'number' ? v : parseFloat(v), l: rawL[i] }))
    .filter((p) => Number.isFinite(p.v))
    .slice(0, CHART_MAX_BARS);
  if (!pairs.length) return { values: CHART_FALLBACK.slice(), labels: [] };
  return { values: pairs.map((p) => p.v), labels: pairs.map((p) => (p.l == null ? '' : String(p.l))) };
}

// ── CELL ──────────────────────────────────────────────────────────────────────
// Membrane label sits ABOVE the cell; the nucleus is named inside its own circle
// (there used to be an 'N' glyph drawn on top of the label); mitochondria and
// cytoplasm are named BELOW their organelle, inside the membrane, one line each.
export const CELL_PARTS = 4;
export function cellLayout(labels) {
  const L = (i, fb) => (labels && labels[i] ? String(labels[i]) : fb);
  const membrane = { cx: 150, cy: 96, rx: 126, ry: 66 };
  const nucleus = { cx: 150, cy: 80, r: 28 };
  const cyto = { cx: 100, cy: 104, r: 9 };
  const mito = { cx: 200, cy: 104, rx: 18, ry: 10 };
  const parts = [
    { kind: 'membrane', anchor: { x: 150, y: membrane.cy - membrane.ry },
      label: place(L(0, 'Cell membrane'), { x: 150, y: 14 }, { size: 13, maxW: 230, maxLines: 1, min: 9 }) },
    { kind: 'nucleus', anchor: { x: nucleus.cx, y: nucleus.cy }, inside: 'nucleus',
      label: place(L(1, 'Nucleus'), { x: nucleus.cx, y: nucleus.cy }, { size: 12, maxW: nucleus.r * 2 - 6, maxLines: 2, min: 8 }) },
    { kind: 'mito', anchor: { x: mito.cx, y: mito.cy },
      label: place(L(2, 'Mitochondria'), { x: mito.cx, y: 128 }, { size: 12, maxW: 80, maxLines: 1, min: 8 }) },
    { kind: 'cyto', anchor: { x: cyto.cx, y: cyto.cy },
      label: place(L(3, 'Cytoplasm'), { x: cyto.cx, y: 128 }, { size: 12, maxW: 80, maxLines: 1, min: 8 }) },
  ];
  return {
    viewW: 300, viewH: 180, membrane, nucleus, cyto, mito, parts,
    labels: parts.map((p) => ({ ...p.label, inside: p.inside })),
    shapes: [
      { id: 'nucleus', box: { x0: nucleus.cx - nucleus.r, y0: nucleus.cy - nucleus.r, x1: nucleus.cx + nucleus.r, y1: nucleus.cy + nucleus.r } },
      { id: 'cyto', box: { x0: cyto.cx - cyto.r, y0: cyto.cy - cyto.r, x1: cyto.cx + cyto.r, y1: cyto.cy + cyto.r } },
      { id: 'mito', box: { x0: mito.cx - mito.rx, y0: mito.cy - mito.ry, x1: mito.cx + mito.rx, y1: mito.cy + mito.ry } },
    ],
  };
}

// ── MOLECULE ──────────────────────────────────────────────────────────────────
// Central atom + up to three bonded atoms, spread across the board (they used to sit
// in the middle third). A symbol that fits is written inside its atom; a full name
// ("Hydrogen") goes outside it, in a slot reserved for that atom, instead of
// spilling out of a 12-unit circle.
const MOLECULE_SLOTS = [
  { x: 150, y: 92, r: 28, out: { at: { x: 150, y: 134 }, box: { size: 12, maxW: 100, maxLines: 2, min: 9 } } },
  { x: 70, y: 130, r: 20, out: { at: { x: 70, y: 166 }, box: { size: 12, maxW: 120, maxLines: 1, min: 8 } } },
  { x: 230, y: 130, r: 20, out: { at: { x: 230, y: 166 }, box: { size: 12, maxW: 120, maxLines: 1, min: 8 } } },
  { x: 150, y: 30, r: 20, out: { at: { x: 176, y: 30, anchor: 'start' }, box: { size: 12, maxW: 118, maxLines: 1, min: 8 } } },
];
export function moleculeLayout(labels) {
  // Only the atoms the lesson named — inventing an "H" for ['C', 'O'] drew an atom the
  // Director never counts. Nothing named → the H2O default.
  const given = Array.isArray(labels) && labels.some(Boolean);
  const names = (given ? [labels[0] || 'O', labels[1], labels[2], labels[3]] : ['O', 'H', 'H', ''])
    .map((x) => (x ? String(x) : ''));
  const atoms = [];
  names.forEach((name, i) => {
    if (!name) return;
    const slot = MOLECULE_SLOTS[i];
    const inner = fitLabel(name, { size: Math.round(slot.r * 0.75), maxW: slot.r * 2 - 6, maxLines: 1, min: 10 });
    const inside = !inner.truncated;
    const label = inside
      ? { x: slot.x, y: slot.y, anchor: 'middle', ...inner }
      : place(name, slot.out.at, slot.out.box);
    atoms.push({ id: `atom${i}`, slot: i, x: slot.x, y: slot.y, r: slot.r, inside, label });
  });
  return {
    viewW: 300, viewH: 180, atoms,
    labels: atoms.map((a) => ({ ...a.label, inside: a.inside ? a.id : undefined })),
    shapes: atoms.map((a) => ({ id: a.id, box: { x0: a.x - a.r, y0: a.y - a.r, x1: a.x + a.r, y1: a.y + a.r } })),
  };
}

// ── FREE-BODY ─────────────────────────────────────────────────────────────────
// Block in the middle, four forces. The side labels used to be centred ON the tip
// of their own arrow ("External load resistance R" with the arrow through it); they
// now sit under the outer half of the arrow, clear of the block even after the
// applied force slides it SLIDE units to the right.
export const FREE_BODY_SLIDE = 14;
export function freeBodyLayout(labels) {
  const L = (i, fb) => (labels && labels[i] ? String(labels[i]) : fb);
  const cx = 150; const cy = 92; const hs = 20;
  const forces = [
    { kind: 'weight', x1: cx, y1: cy + hs, x2: cx, y2: cy + 56,
      label: place(L(0, 'Weight'), { x: cx, y: 164 }, { size: 11, maxW: 200, maxLines: 2, min: 8 }) },
    { kind: 'normal', x1: cx, y1: cy - hs, x2: cx, y2: cy - 52,
      label: place(L(1, 'Normal'), { x: cx, y: 20 }, { size: 11, maxW: 200, maxLines: 2, min: 8 }) },
    { kind: 'applied', x1: cx + hs, y1: cy, x2: cx + 78, y2: cy,
      label: place(L(2, 'Applied'), { x: 240, y: 114 }, { size: 12, maxW: 108, maxLines: 2, min: 8 }) },
    { kind: 'friction', x1: cx - hs, y1: cy, x2: cx - 74, y2: cy,
      label: place(L(3, 'Friction'), { x: 62, y: 114 }, { size: 12, maxW: 108, maxLines: 2, min: 8 }) },
  ];
  const seg = (f) => ({ x0: Math.min(f.x1, f.x2) - 5, y0: Math.min(f.y1, f.y2) - 5, x1: Math.max(f.x1, f.x2) + 5, y1: Math.max(f.y1, f.y2) + 5 });
  return {
    viewW: 300, viewH: 180, block: { cx, cy, hs }, forces,
    labels: forces.map((f) => f.label),
    shapes: [
      { id: 'block', box: { x0: cx - hs, y0: cy - hs, x1: cx + hs + FREE_BODY_SLIDE, y1: cy + hs } },
      ...forces.map((f) => ({ id: f.kind, box: seg(f) })),
    ],
  };
}
