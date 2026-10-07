# Board Shapes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The AI teacher draws a purpose-built diagram for any DIAGRAM slide from general-purpose shapes, laid out by the app so it is large and no label overlaps anything.

**Architecture:** The lesson LLM adds an optional `visualData.shapes` list (primitives on a 100×60 grid). The server validates it (`normalizeShapes`, never throws). The client turns it into strokes + placed labels with a pure layout module (`shapeLayout.js`: geometry, greedy collision-free label placement, auto-fit viewBox), and `ShapesBoard` draws it stroke by stroke, one voice-synced step at a time.

**Tech Stack:** React Native (Expo 54) + react-native-svg, plain ESM for pure client modules, Node 22 `node:test`; server is CommonJS Express on Render (`rootDir: server`).

**Spec:** `docs/superpowers/specs/2026-10-06-board-shapes-design.md`

## Global Constraints

- Canvas grid is 100 wide × 60 tall, y down; viewBox units = grid × 3 (300 × 180).
- ≤ 14 shapes; labels ≤ 18 chars; `text` ≤ 32 chars; steps 1–6 (dense).
- Colors: `orange|blue|green|pink|violet|ink` only; unknown → `ink`.
- Aspect of the fitted viewBox is clamped to 1.4–2.2; label font never below 9.
- Bad shapes must never fail lesson generation or crash the board; no shapes → today's behaviour.
- Pure client modules (`boardLayout.js`, `shapeLayout.js`, `teachingScenes.js`) stay React-free and import each other WITH the `.js` extension (Node ESM needs it; Metro accepts it).
- Server copy of the validator lives under `server/` (Render deploys only that folder) — no imports from `src/`.
- Work happens uncommitted in `F:\aiLernova2\AI_Teacher-APP` (branch `feat/trial-booking`) — the user asked to check before any commit. "Checkpoint" steps run the suites instead of committing.

## Review Focus

- All shapes at one point / zero-size shapes → board renders (min view width), no crash, no NaN in paths.
- A `from`/`to` id that names a missing shape, itself, or another line → that connector is dropped, others still draw.
- `step` values sparse or > 6 (e.g. 2, 5, 9) → dense 1..k, capped at 6, Director total matches the board.
- `shapes` on a non-DIAGRAM slide, or a lesson cached before this change → ignored; routing unchanged.
- A crowded diagram (14 labelled shapes in one corner) → every label still collision-free (leader line), inside the fitted viewBox.

Each line has its test in the owning task (Tasks 1, 2, 3).

---

## File structure

| File | Responsibility |
|---|---|
| `server/src/utils/lessonShapes.js` (new) | `normalizeShapes(raw)` — validate/clamp model output |
| `server/tests/lessonShapes.test.js` (new) | its tests + one `parseAndValidateLesson` integration test |
| `server/src/providers/ai/AnthropicProvider.js` (modify) | call it for DIAGRAM slides; export `parseAndValidateLesson` for the test |
| `server/src/prompts/lessonGeneration.prompt.js` (modify) | teach the model the shapes schema |
| `src/components/teacher/shapeLayout.js` (new) | `assignSteps`, `shapesStepCount`, `layoutShapes` — pure |
| `src/components/teacher/__tests__/shapeLayout.test.mjs` (new) | fixtures + seeded fuzz of no-overlap guarantees |
| `src/components/teacher/ShapesBoard.js` (new) | render `layoutShapes` output, step reveal, emphasis |
| `src/components/teacher/subjectBoards.js` (modify) | export `useReveal`, `LaserPointer` |
| `src/components/teacher/LessonBoards.js` (modify) | route `shapes` → `ShapesBoard` (fallback `ConceptBoard`) |
| `src/components/teacher/teachingScenes.js` (modify) | route DIAGRAM+shapes → `shapes`; build scene; kicker |
| `src/components/teacher/teachingDirector.js` (modify) | `boardTotalFor('shapes')` |
| `src/components/teacher/LiveTeachingPlayer.js` (modify) | add `shapes` to `ZOOM_BOARDS` |
| `package.json` (modify) | add the new test file to `test:boards` |

---

### Task 1: Server validator `normalizeShapes`

**Files:**
- Create: `server/src/utils/lessonShapes.js`
- Create: `server/tests/lessonShapes.test.js`
- Modify: `server/src/providers/ai/AnthropicProvider.js` (slides map ~L573-600, `module.exports` L731)

**Interfaces:**
- Produces: `normalizeShapes(raw: any) → Shape[] | undefined` (CommonJS). Shapes keep only known keys, ids `[A-Za-z0-9_-]{1,24}`.
- Produces: `require('../src/providers/ai/AnthropicProvider').parseAndValidateLesson(raw: string)`.

- [ ] **Step 1: Write the failing tests** — `server/tests/lessonShapes.test.js`

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd server && node --test tests/lessonShapes.test.js`
Expected: FAIL — `Cannot find module '../src/utils/lessonShapes'`.

- [ ] **Step 3: Implement** — `server/src/utils/lessonShapes.js`

```js
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
      return at && w && h ? { at, w, h, x: cleanStr(s.x, 12), y: cleanStr(s.y, 12) } : null
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
  const id = typeof s.id === 'string' && /^[A-Za-z0-9_-]{1,24}$/.test(s.id) ? s.id : null
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
    // connectors may only point at a kept, non-connector shape other than themselves
    const targets = new Set(shapes.filter((s) => s.id && !CONNECTORS.includes(s.kind)).map((s) => s.id))
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
```

In `AnthropicProvider.js`: add `const { normalizeShapes } = require('../../utils/lessonShapes')` next to the `slideAnimation` require; in the slides map replace the `visualData` constant with

```js
    const rawVisual =
      slide.visualData && typeof slide.visualData === 'object' && !Array.isArray(slide.visualData)
        ? slide.visualData
        : {}
    // The board drawing is only drawn on DIAGRAM slides; validated, never fatal.
    const { shapes: rawShapes, ...visualRest } = rawVisual
    const shapes = slide.visualType === 'DIAGRAM' ? normalizeShapes(rawShapes) : undefined
    const visualData = shapes ? { ...visualRest, shapes } : visualRest
```

and after `module.exports = AnthropicProvider` add `module.exports.parseAndValidateLesson = parseAndValidateLesson`.

- [ ] **Step 4: Run to verify it passes** — `cd server && node --test tests/lessonShapes.test.js` → all pass.
- [ ] **Step 5: Checkpoint** — `cd server && npm test` → whole server suite green (DB-backed tests may need the local Postgres; report any failure by name).

---

### Task 2: Client layout `shapeLayout.js`

**Files:**
- Create: `src/components/teacher/shapeLayout.js`
- Create: `src/components/teacher/__tests__/shapeLayout.test.mjs`
- Modify: `package.json` (`test:boards`)

**Interfaces:**
- Consumes: `fitLabel`, `labelBox`, `boxesOverlap` from `./boardLayout.js`.
- Produces:
  - `assignSteps(shapes) → number[]` (per shape, dense 1..k ≤ 6)
  - `shapesStepCount(shapes) → number` (0 when nothing drawable)
  - `layoutShapes(shapes) → null | { viewBox: {x,y,w,h}, steps, items: Item[], labels: Label[], obstacles: Box[] }`
    - `Item = { id, kind, step, color, dashed, fillD|null, strokes: [{d, length}], dot: {cx,cy,r}|null, pointer: {x,y} }`
    - `Label = { x, y, size, lines, anchor:'middle', step, color, leader: {x1,y1,x2,y2}|null }`

- [ ] **Step 1: Write the failing tests** — `__tests__/shapeLayout.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignSteps, shapesStepCount, layoutShapes } from '../shapeLayout.js';
import { labelBox, boxesOverlap } from '../boardLayout.js';

const FIXTURES = {
  solar: [
    { id: 'sun', kind: 'circle', at: [15, 30], r: 9, color: 'orange', fill: true, label: 'Sun' },
    { id: 'earth', kind: 'circle', at: [70, 30], r: 4, color: 'blue', fill: true, label: 'Earth' },
    { kind: 'arrow', from: 'sun', to: 'earth', label: 'light' },
    { kind: 'arc', at: [70, 30], r: 12, start: 200, end: 340, dashed: true, label: 'orbit' },
  ],
  circuit: [
    { id: 'cell', kind: 'rect', at: [10, 22], w: 10, h: 16, label: 'Cell ε', color: 'orange' },
    { id: 'r', kind: 'rect', at: [70, 24], w: 16, h: 12, label: 'Internal resistance r', color: 'blue' },
    { kind: 'arrow', from: 'cell', to: 'r', label: 'current I', color: 'green' },
    { kind: 'line', from: [15, 38], to: [78, 50] },
  ],
  unitCircle: [
    { kind: 'axes', at: [20, 55], w: 60, h: 50, x: 'x', y: 'y' },
    { id: 'c', kind: 'circle', at: [50, 30], r: 22, label: 'unit circle' },
    { kind: 'line', from: [50, 30], to: [66, 15], label: 'r = 1', color: 'violet' },
    { kind: 'arc', at: [50, 30], r: 7, start: 0, end: 43, label: 'θ', color: 'green' },
    { kind: 'dot', at: [66, 15], label: '(cos θ, sin θ)', color: 'pink' },
  ],
  graph: [
    { kind: 'axes', at: [10, 55], w: 85, h: 50, x: 'time', y: 'speed' },
    { kind: 'curve', points: [[10, 55], [30, 35], [50, 25], [80, 20]], label: 'speeding up', color: 'blue' },
    { kind: 'text', at: [60, 45], text: 'v = u + at' },
  ],
  venn: [
    { kind: 'circle', at: [40, 30], r: 18, color: 'blue', fill: true, label: 'Mammals' },
    { kind: 'circle', at: [60, 30], r: 18, color: 'green', fill: true, label: 'Swimmers' },
    { kind: 'text', at: [50, 30], text: 'Whale' },
  ],
  degenerate: [
    { kind: 'circle', at: [50, 30], r: 0.0001, label: 'tiny' },
    { kind: 'dot', at: [50, 30], label: 'same spot' },
    { kind: 'line', from: [50, 30], to: [50, 30], label: 'zero length' },
  ],
};

function assertClean(L, name) {
  assert.ok(L, `${name}: layout is null`);
  const v = L.viewBox;
  const aspect = v.w / v.h;
  assert.ok(aspect >= 1.4 - 1e-9 && aspect <= 2.2 + 1e-9, `${name}: aspect ${aspect}`);
  const boxes = L.labels.map(labelBox);
  boxes.forEach((b, i) => {
    assert.ok(L.labels[i].size >= 9, `${name}: font ${L.labels[i].size}`);
    assert.ok(b.x0 >= v.x && b.y0 >= v.y && b.x1 <= v.x + v.w && b.y1 <= v.y + v.h, `${name}: label "${L.labels[i].lines.join(' ')}" outside viewBox`);
    for (let j = i + 1; j < boxes.length; j += 1) assert.equal(boxesOverlap(b, boxes[j]), false, `${name}: labels ${i} and ${j} overlap`);
    for (const o of L.obstacles) assert.equal(boxesOverlap(b, o), false, `${name}: label "${L.labels[i].lines.join(' ')}" on a stroke`);
  });
  for (const it of L.items) for (const s of it.strokes) assert.ok(!/NaN|Infinity/.test(s.d), `${name}: bad path ${s.d}`);
}

for (const [name, shapes] of Object.entries(FIXTURES)) {
  test(`${name}: labels never overlap strokes or each other, and fit the view`, () => assertClean(layoutShapes(shapes), name));
}

test('layout is deterministic', () => {
  assert.deepEqual(layoutShapes(FIXTURES.circuit), layoutShapes(FIXTURES.circuit));
});

test('seeded fuzz: 200 random diagrams stay collision-free', () => {
  let seed = 12345;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const kinds = ['circle', 'rect', 'dot', 'ellipse', 'polygon', 'curve', 'arc'];
  for (let k = 0; k < 200; k += 1) {
    const n = 2 + Math.floor(rnd() * 13);
    const shapes = [];
    for (let i = 0; i < n; i += 1) {
      const kind = kinds[Math.floor(rnd() * kinds.length)];
      const at = [rnd() * 100, rnd() * 60];
      const s = { id: `s${i}`, kind, at, r: 2 + rnd() * 15, rx: 3 + rnd() * 20, ry: 2 + rnd() * 12, w: 4 + rnd() * 30, h: 3 + rnd() * 20,
        start: rnd() * 360, end: rnd() * 360, label: rnd() < 0.8 ? 'Label number ' + i : undefined,
        points: [[rnd() * 100, rnd() * 60], [rnd() * 100, rnd() * 60], [rnd() * 100, rnd() * 60]] };
      shapes.push(s);
    }
    if (rnd() < 0.5) shapes.push({ kind: 'arrow', from: 's0', to: 's1', label: 'link' });
    assertClean(layoutShapes(shapes), `fuzz#${k}`);
  }
});

test('assignSteps: each labelled shape opens a step, unlabelled ones join the next', () => {
  assert.deepEqual(assignSteps([{ kind: 'line' }, { kind: 'circle', label: 'a' }, { kind: 'line' }, { kind: 'circle', label: 'b' }, { kind: 'line' }]), [1, 1, 2, 2, 2]);
});

test('assignSteps: given steps win, gaps close, cap at 6', () => {
  assert.deepEqual(assignSteps([{ step: 2 }, { step: 9 }, {}, { step: 4 }]), [1, 3, 3, 2]);
  assert.equal(Math.max(...assignSteps(Array.from({ length: 10 }, (_, i) => ({ label: `l${i}` })))), 6);
});

test('labels keep their position at every step (computed once for all steps)', () => {
  const L = layoutShapes(FIXTURES.solar);
  assert.equal(L.steps, shapesStepCount(FIXTURES.solar));
  assert.ok(L.labels.every((l) => l.step >= 1 && l.step <= L.steps));
});

test('crowded corner: 14 labelled shapes still collision-free', () => {
  const shapes = Array.from({ length: 14 }, (_, i) => ({ kind: 'dot', at: [2 + (i % 4), 2 + Math.floor(i / 4)], label: `Point ${i}` }));
  assertClean(layoutShapes(shapes), 'crowded');
});

test('nothing drawable → null', () => {
  assert.equal(layoutShapes([]), null);
  assert.equal(layoutShapes('x'), null);
  assert.equal(shapesStepCount(undefined), 0);
});

test('a connector to a missing id is skipped, the rest still draws', () => {
  const L = layoutShapes([{ id: 'a', kind: 'circle', at: [20, 30], r: 5 }, { kind: 'arrow', from: 'a', to: 'ghost' }, { kind: 'dot', at: [70, 30] }]);
  assert.deepEqual(L.items.map((i) => i.kind), ['circle', 'dot']);
});
```

Add to `package.json` `test:boards`: `src/components/teacher/__tests__/shapeLayout.test.mjs`.

- [ ] **Step 2: Run to verify it fails** — `npm run test:boards` → FAIL, `Cannot find module '../shapeLayout.js'`.

- [ ] **Step 3: Implement** — `src/components/teacher/shapeLayout.js`

```js
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
const LABEL_SIZES = [13, 11, 9];
const LABEL_W = 110;
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
    const labelled = list.map((s) => !!(s && (str(s.label) || (s.kind === 'text' && str(s.text)))));
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
function place(requests, obstacles) {
  const placed = [];
  const free = (b) => !obstacles.some((o) => boxesOverlap(b, o)) && !placed.some((p) => boxesOverlap(b, p.box));
  const inCanvas = (b) => b.x0 >= CANVAS.x0 && b.y0 >= CANVAS.y0 && b.x1 <= CANVAS.x1 && b.y1 <= CANVAS.y1;
  for (const rq of requests) {
    let pick = null;
    for (const needInside of [true, false]) {
      for (const size of LABEL_SIZES) {
        const fit = fitLabel(rq.text, { size, maxW: LABEL_W, maxLines: 2, min: size });
        const probe = labelBox({ x: 0, y: 0, size: fit.size, lines: fit.lines });
        const w = probe.x1 - probe.x0; const h = probe.y1 - probe.y0;
        for (const c of rq.cands(w, h)) {
          const label = { x: c.x, y: c.y, size: fit.size, lines: fit.lines, anchor: 'middle' };
          const box = labelBox(label);
          if (free(box) && (!needInside || inCanvas(box))) { pick = { label, box, leader: null }; break; }
        }
        if (pick) break;
      }
      if (pick) break;
    }
    if (!pick) {
      // Last resort: nearest free spot (the canvas plus a margin around it, which is
      // always empty), joined to its shape by a thin leader line.
      const fit = fitLabel(rq.text, { size: 9, maxW: LABEL_W, maxLines: 2, min: 9 });
      const spots = [];
      for (let y = CANVAS.y0 - 60; y <= CANVAS.y1 + 60; y += 8) for (let x = CANVAS.x0 - 90; x <= CANVAS.x1 + 90; x += 8) spots.push({ x, y });
      spots.sort((a, b) => dist(a, rq.anchor) - dist(b, rq.anchor) || a.y - b.y || a.x - b.x);
      for (const s of spots) {
        const label = { x: s.x, y: s.y, size: fit.size, lines: fit.lines, anchor: 'middle' };
        const box = labelBox(label);
        if (free(box)) {
          const lx = clamp(rq.anchor.x, box.x0, box.x1); const ly = clamp(rq.anchor.y, box.y0, box.y1);
          pick = { label, box, leader: { x1: lx, y1: ly, x2: rq.anchor.x, y2: rq.anchor.y } };
          break;
        }
      }
    }
    if (pick) placed.push({ ...pick, step: rq.step, color: rq.color });
  }
  return placed;
}

function fitView(boxes) {
  let x0 = Math.min(...boxes.map((b) => b.x0)) - PAD; let y0 = Math.min(...boxes.map((b) => b.y0)) - PAD;
  let w = Math.max(...boxes.map((b) => b.x1)) + PAD - x0; let h = Math.max(...boxes.map((b) => b.y1)) + PAD - y0;
  if (w < MIN_VIEW_W) { x0 -= (MIN_VIEW_W - w) / 2; w = MIN_VIEW_W; }
  if (w / h < ASPECT_MIN) { const nw = h * ASPECT_MIN; x0 -= (nw - w) / 2; w = nw; }
  if (w / h > ASPECT_MAX) { const nh = w / ASPECT_MAX; y0 -= (nh - h) / 2; h = nh; }
  return { x: r1(x0), y: r1(y0), w: Math.ceil(w * 10) / 10, h: Math.ceil(h * 10) / 10 };
}

// ── entry point ───────────────────────────────────────────────────────────────
export function layoutShapes(shapes) {
  if (!Array.isArray(shapes) || !shapes.length) return null;
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
  const placed = place(requests, obstacles);
  const labelBoxes = placed.map((p) => p.box);
  const viewBox = fitView([...shapeBoxes, ...labelBoxes]);
  const used = [...new Set([...items.map((it) => it.step), ...placed.map((p) => p.step)])].sort((a, b) => a - b);
  const renum = (s) => used.indexOf(s) + 1;
  return {
    viewBox,
    steps: used.length,
    items: items.map((it) => ({ ...it, step: renum(it.step), pointer: { x: r1(it.pointer.x), y: r1(it.pointer.y) } })),
    labels: placed.map((p) => ({ ...p.label, step: renum(p.step), color: p.color, leader: p.leader })),
    obstacles,
  };
}
```

- [ ] **Step 4: Run to verify it passes** — `npm run test:boards` → all pass. If a fuzz case fails, fix the layout (never loosen the test).
- [ ] **Step 5: Checkpoint** — `npm run test:boards` green.

---

### Task 3: Routing, scene build, Director total

**Files:**
- Modify: `src/components/teacher/teachingScenes.js` (`kickerFor` ~L154, `boardTypeFor`, `buildScene`)
- Modify: `src/components/teacher/teachingDirector.js` (`boardTotalFor`)
- Test: `src/components/teacher/__tests__/teachingScenes.test.mjs`

**Interfaces:**
- Consumes: `shapesStepCount` from `./shapeLayout.js`.
- Produces: scene `{ boardType: 'shapes', diagram: { shapes, shapesTotal, shape, steps, points, label } }`.

- [ ] **Step 1: Write failing tests** (append to `teachingScenes.test.mjs`)

```js
const SHAPES = [
  { id: 'cell', kind: 'rect', at: [10, 22], w: 10, h: 16, label: 'Cell' },
  { id: 'r', kind: 'rect', at: [70, 24], w: 16, h: 12, label: 'R' },
  { kind: 'arrow', from: 'cell', to: 'r', label: 'current' },
];

test('a DIAGRAM slide with shapes gets the shapes board, with its step count', () => {
  const sc = buildScenes(lesson({ slideTitle: 'Internal Resistance and Terminal Voltage', explanation: 'x', narrationText: 'The applied force of the cell drives current.', visualType: 'DIAGRAM', visualData: { components: ['Cell', 'R'], shapes: SHAPES } }))[1];
  assert.equal(sc.boardType, 'shapes');
  assert.equal(sc.diagram.shapesTotal, 3);
});

test('shapes on a non-DIAGRAM slide are ignored', () => {
  assert.notEqual(boardOf({ slideTitle: 'An example', explanation: 'x', narrationText: 'x', visualType: 'EXAMPLE', visualData: { shapes: SHAPES } }), 'shapes');
});

test('a named figure still outranks model shapes', () => {
  assert.equal(boardOf({ slideTitle: 'Electromagnetic induction', explanation: 'x', narrationText: 'Faraday\'s law', visualType: 'DIAGRAM', visualData: { shapes: SHAPES } }), 'annotated');
});

test('a cached lesson without shapes routes exactly as before', () => {
  assert.equal(boardOf({ slideTitle: 'Parts of an Animal Cell', explanation: 'x', narrationText: 'nucleus', visualType: 'DIAGRAM', visualData: { components: ['Nucleus'] } }), 'cell');
});
```

- [ ] **Step 2: Run** — `npm run test:boards` → the shapes tests FAIL (`boardType` is a subject board / `concept`).

- [ ] **Step 3: Implement**

`teachingScenes.js` — top of file:

```js
import { shapesStepCount } from './shapeLayout.js';
```

`kickerFor`: add `case 'shapes': return `${idx} · SEE IT DRAWN`;`

Before `function boardTypeFor`:

```js
// The model drew this slide itself (visualData.shapes). It is the actual object the
// slide names, so it outranks the keyword-matched subject boards — but not a curated
// figure or the triangle board, which are proven drawings of exactly that thing.
const hasShapes = (slide) => slide.visualType === 'DIAGRAM'
  && Array.isArray(slide.visualData && slide.visualData.shapes)
  && shapesStepCount(slide.visualData.shapes) > 0;
```

In `boardTypeFor`, right after `if (figure) return 'annotated';`:

```js
  if (hasShapes(slide)) return 'shapes';
```

In `buildScene`, before the `else if (boardType === 'concept')` branch:

```js
  } else if (boardType === 'shapes') {
    // concept fields ride along so the board can fall back to them if layout fails
    const comps = (Array.isArray(v.components) ? v.components : []).map(prettyMath).filter(Boolean);
    scene.diagram = {
      shapes: v.shapes,
      shapesTotal: shapesStepCount(v.shapes),
      shape: comps.length ? 'flow' : 'points',
      steps: comps,
      points: keyPoints,
      label: prettyMath(v.label || ''),
    };
```

`teachingDirector.js` `boardTotalFor`, next to `annotated`:

```js
    // Model-drawn board: the step count travels on the scene (set by buildScene from
    // the same layout the board renders), so the two cannot drift.
    case 'shapes': return d.shapesTotal || 1;
```

- [ ] **Step 4: Run** — `npm run test:boards` → all pass.
- [ ] **Step 5: Checkpoint** — `npm run test:boards` green.

---

### Task 4: `ShapesBoard` renderer and wiring

**Files:**
- Create: `src/components/teacher/ShapesBoard.js`
- Modify: `src/components/teacher/subjectBoards.js` (export `useReveal`, `LaserPointer`)
- Modify: `src/components/teacher/LessonBoards.js` (route `shapes`)
- Modify: `src/components/teacher/LiveTeachingPlayer.js:883` (`ZOOM_BOARDS`)

**Interfaces:**
- Consumes: `layoutShapes` (Task 2), `SvgLines`, `useReveal`, `LaserPointer` from `./subjectBoards`, `ChalkStroke` from `./WhiteboardCanvas`, `useBoardSize`.
- Produces: `<ShapesBoard scene paused skip resetKey step fallback />` (default export).

- [ ] **Step 1: Export helpers** — in `subjectBoards.js` change `function useReveal(` → `export function useReveal(` and `function LaserPointer(` → `export function LaserPointer(`.

- [ ] **Step 2: Create `ShapesBoard.js`**

```js
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Line, Circle } from 'react-native-svg';
import { ChalkStroke } from './WhiteboardCanvas';
import { C } from './premiumTheme';
import { useBoardSize } from './boardSize';
import { SvgLines, useReveal, LaserPointer } from './subjectBoards';
import { layoutShapes } from './shapeLayout';

// ── MODEL-DRAWN BOARD ─────────────────────────────────────────────────────────
// Draws the lesson model's own diagram (visualData.shapes), laid out by
// shapeLayout.js so labels never touch a stroke and the drawing fills the card.
// It chalks itself on one voice-synced step at a time; the step she is speaking is
// at full strength and earlier ones recede, so the eye always lands on "now".
const PALETTE = { orange: C.orange, blue: C.blue, green: C.green, pink: C.pink, violet: '#7C3AED', ink: '#2C3043' };
const PAST = 0.55;
const strokeMs = (len) => Math.max(280, Math.min(900, len * 3));

export default function ShapesBoard({ scene, paused, skip, resetKey, step, fallback = null }) {
  const { h } = useBoardSize();
  const shapes = scene && scene.diagram && scene.diagram.shapes;
  const L = useMemo(() => {
    try { return layoutShapes(shapes); } catch (e) { return null; }
  }, [shapes]);
  const n = useReveal(L ? L.steps : 0, 950, { paused, skip, resetKey, step });
  if (!L) return fallback;
  const vb = L.viewBox;
  const shown = Math.max(1, n);
  const op = (s) => (skip || s === shown ? 1 : PAST);
  const now = L.items.find((it) => it.step === shown);
  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <Svg width="100%" height={h(188)} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}>
        {L.items.map((it) => {
          if (it.step > shown) return null;
          const col = PALETTE[it.color] || PALETTE.ink;
          let delay = 0;
          return (
            <G key={it.id} opacity={op(it.step)}>
              {!!it.fillD && <Path d={it.fillD} fill={col} opacity={0.14} />}
              {it.dot && <Circle cx={it.dot.cx} cy={it.dot.cy} r={it.dot.r} fill={col} />}
              {it.strokes.map((s, k) => {
                if (it.dashed) return <Path key={k} d={s.d} stroke={col} strokeWidth={2.2} strokeDasharray="6 5" fill="none" />;
                const dur = strokeMs(s.length);
                const el = <ChalkStroke key={k} d={s.d} length={s.length} color={col} width={2.6} delay={delay} duration={dur} skip={skip} />;
                delay += dur;
                return el;
              })}
            </G>
          );
        })}
        {L.labels.map((lb, i) => (lb.step <= shown ? (
          <G key={`l${i}`} opacity={op(lb.step)}>
            {lb.leader && <Line x1={lb.leader.x1} y1={lb.leader.y1} x2={lb.leader.x2} y2={lb.leader.y2} stroke={PALETTE[lb.color] || PALETTE.ink} strokeWidth={1} opacity={0.6} />}
            <SvgLines label={lb} color={PALETTE[lb.color] || PALETTE.ink} />
          </G>
        ) : null))}
        {!skip && now && <LaserPointer x={now.pointer.x} y={now.pointer.y} />}
      </Svg>
    </View>
  );
}
```

- [ ] **Step 3: Route it** — `LessonBoards.js`: `import ShapesBoard from './ShapesBoard';` and in the `switch` before `case 'concept':`

```js
    case 'shapes': return <ShapesBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} step={step}
      fallback={<ConceptBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} step={step} highlight={highlight} />} />;
```

`LiveTeachingPlayer.js:883`: add `'shapes'` to `ZOOM_BOARDS`.

- [ ] **Step 4: Static checks** — Babel parse + unbound-identifier + local-import checks (scratchpad scripts `parse.cjs`, `unbound.cjs`, `imports.cjs`) over `ShapesBoard.js`, `LessonBoards.js`, `subjectBoards.js`, `LiveTeachingPlayer.js` → all clean.
- [ ] **Step 5: Checkpoint** — `npm run test:boards` green.

---

### Task 5: Teach the model the schema

**Files:**
- Modify: `server/src/prompts/lessonGeneration.prompt.js:109`
- Test: `server/tests/lessonShapes.test.js`

- [ ] **Step 1: Failing test** (append)

```js
test('the lesson prompt documents the shapes schema', () => {
  const src = require('fs').readFileSync(require.resolve('../src/prompts/lessonGeneration.prompt'), 'utf8')
  assert.match(src, /"shapes"/)
  assert.match(src, /100 wide/)
  for (const k of ['circle', 'rect', 'arrow', 'curve', 'arc', 'axes', 'polygon']) assert.match(src, new RegExp(k))
})
```

- [ ] **Step 2: Run** — fails (`"shapes"` absent).

- [ ] **Step 3: Implement** — replace the `- DIAGRAM:` line with:

```
- DIAGRAM: { "description": string, "label": string, "components": string[], "keyPoints": string[], "shapes"?: Shape[] }   // name the parts you will teach
  "shapes" = the drawing itself, chalked onto the board step by step as you speak. ADD IT whenever the slide's object is something you can SEE — a circuit, apparatus, setup, cycle, graph, figure, map of parts.
  Canvas 100 wide × 60 tall, x to the right, y DOWN; a point is [x, y].
  Shape kinds: circle {at, r} · ellipse {at, rx, ry} · rect {at = top-left, w, h} · polygon {points} · curve {points — a smooth line through them} · arc {at, r, start, end — degrees, counter-clockwise from +x} · line / arrow {from, to — a point OR another shape's id} · axes {at = origin (bottom-left), w, h, x, y — axis names} · dot {at} · text {at, text}.
  Optional on any shape: id, label (≤18 chars; the board positions it so it never overlaps), color (orange|blue|green|pink|violet|ink), fill (true = soft tint), dashed, step (1-6 — what appears together, in the order you name it).
  Rules: at most 14 shapes; name a part with its "label", never with a text placed beside it; leave clear space between parts; connect parts with arrows by id.
  Example (cell with internal resistance): [{"id":"cell","kind":"rect","at":[12,22],"w":8,"h":16,"label":"Cell ε","color":"orange","step":1},{"id":"r","kind":"rect","at":[30,26],"w":14,"h":8,"label":"r","color":"pink","step":2},{"id":"R","kind":"rect","at":[72,26],"w":14,"h":8,"label":"Load R","color":"blue","step":3},{"kind":"line","from":"cell","to":"r","step":2},{"kind":"arrow","from":"r","to":"R","label":"current I","color":"green","step":3}]
```

- [ ] **Step 4: Run** — `cd server && node --test tests/lessonShapes.test.js` → pass.
- [ ] **Step 5: Checkpoint** — server suite + `npm run test:boards` green.

---

### Task 6: Real-lesson check (go/no-go for the prompt)

- [ ] Generate 5 lessons on diagram-heavy topics (EMF & internal resistance, lens ray diagram, water cycle, unit circle, food chain) against the dev key; run each through `parseAndValidateLesson`; record per lesson how many DIAGRAM slides kept `shapes` and whether `layoutShapes` returned a layout. Report the numbers; tune the prompt wording only if fewer than half the DIAGRAM slides carry shapes.
- [ ] Device check on a 360-dp Android phone, card and full-screen: drawing fills the width, labels readable, steps reveal with the voice, earlier steps dim.
