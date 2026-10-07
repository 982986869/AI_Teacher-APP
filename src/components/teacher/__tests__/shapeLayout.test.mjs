import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignSteps, shapesStepCount, layoutShapes, MIN_LABEL_PX, pxPerUnit } from '../shapeLayout.js';
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
  heart: [
    { id: 'ra', kind: 'rect', at: [30, 12], w: 16, h: 14, label: 'Right atrium', color: 'blue', fill: true },
    { id: 'la', kind: 'rect', at: [54, 12], w: 16, h: 14, label: 'Left atrium', color: 'pink', fill: true },
    { id: 'rv', kind: 'rect', at: [30, 30], w: 16, h: 18, label: 'Right ventricle', color: 'blue', fill: true },
    { id: 'lv', kind: 'rect', at: [54, 30], w: 16, h: 18, label: 'Left ventricle', color: 'pink', fill: true },
    { id: 'vc', kind: 'rect', at: [18, 4], w: 6, h: 10, label: 'Vena cava', color: 'blue' },
    { id: 'pa', kind: 'rect', at: [36, 2], w: 6, h: 6, label: 'Pulmonary artery', color: 'blue' },
    { id: 'pv', kind: 'rect', at: [76, 4], w: 6, h: 10, label: 'Pulmonary vein', color: 'pink' },
    { id: 'ao', kind: 'rect', at: [58, 2], w: 6, h: 6, label: 'Aorta', color: 'pink' },
    { kind: 'arrow', from: 'vc', to: 'ra', label: 'from body', color: 'blue' },
    { kind: 'arrow', from: 'rv', to: 'pa', label: 'to lungs', color: 'blue' },
    { kind: 'arrow', from: 'pv', to: 'la', label: 'from lungs', color: 'pink' },
    { kind: 'arrow', from: 'lv', to: 'ao', label: 'to body', color: 'pink' },
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
  assert.equal(L.labels.length, L.labelsRequested, `${name}: ${L.labelsRequested - L.labels.length} label(s) dropped`);
  const boxes = L.labels.map(labelBox);
  boxes.forEach((b, i) => {
    assert.ok(L.labels[i].size >= 9, `${name}: font ${L.labels[i].size}`);

    assert.ok(b.x0 >= v.x && b.y0 >= v.y && b.x1 <= v.x + v.w && b.y1 <= v.y + v.h, `${name}: label "${L.labels[i].lines.join(' ')}" outside viewBox`);
    for (let j = i + 1; j < boxes.length; j += 1) assert.equal(boxesOverlap(b, boxes[j]), false, `${name}: labels ${i} and ${j} overlap`);
    for (const o of L.obstacles) assert.equal(boxesOverlap(b, o), false, `${name}: label "${L.labels[i].lines.join(' ')}" on a stroke`);
  });
  for (const it of L.items) for (const s of it.strokes) assert.ok(!/NaN|Infinity/.test(s.d), `${name}: bad path ${s.d}`);
}

// Realistic diagrams must also be READABLE and LARGE on a 360-dp phone: labels at
// MIN_LABEL_PX or more when the view scales into the ~BOARD_PX card, and the drawing
// itself keeping most of the width (labels must not shrink the picture to a corner).
// Priority when a diagram is too dense for both: no overlap > no dropped label > the
// drawing keeps >= 60% of its scale > labels at MIN_LABEL_PX. Dense diagrams (`dense`)
// may fall back to smaller type, never below the 9-unit floor.
function assertReadable(L, name, dense = false) {
  const k = pxPerUnit(L.viewBox);
  for (const lb of L.labels) {
    if (dense) { assert.ok(lb.size >= 9, `${name}: ${lb.size}`); continue; }
    const px = lb.size * k;
    assert.ok(px >= MIN_LABEL_PX - 1e-6, `${name}: label "${lb.lines.join(' ')}" renders at ${px.toFixed(1)}px`);
  }
  // the drawing is drawn at >= 60% of the scale it would get with no labels at all
  const ideal = pxPerUnit({ w: L.drawing.w, h: L.drawing.h });
  assert.ok(k / ideal >= 0.6, `${name}: drawing shrunk to ${(100 * k / ideal).toFixed(0)}% by its labels`);
}

for (const [name, shapes] of Object.entries(FIXTURES)) {
  test(`${name}: labels never overlap strokes or each other, and fit the view`, () => assertClean(layoutShapes(shapes), name));
  if (name !== 'degenerate') test(`${name}: readable and large on a phone`, () => assertReadable(layoutShapes(shapes), name, name === 'heart'));
}

test('fuzz layouts stay fast enough for a phone (desktop budget 150 ms each)', () => {
  let seed = 777;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  let worst = 0;
  for (let k = 0; k < 60; k += 1) {
    const shapes = Array.from({ length: 14 }, (_, i) => ({ id: `s${i}`, kind: ['circle', 'rect', 'ellipse'][i % 3], at: [rnd() * 100, rnd() * 60], r: 3 + rnd() * 12, rx: 4 + rnd() * 14, ry: 3 + rnd() * 10, w: 6 + rnd() * 20, h: 4 + rnd() * 14, label: `Part number ${i}` }));
    const t0 = performance.now(); layoutShapes(shapes); worst = Math.max(worst, performance.now() - t0);
  }
  assert.ok(worst < 150, `worst layout ${worst.toFixed(0)} ms`);
});

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

test('a diagram spanning the whole canvas still gets readable labels (real lens lesson)', () => {
  const shapes = [
    { kind: 'axes', at: [10, 30], w: 80, h: 5, x: 'Principal Axis' },
    { kind: 'line', from: [20, 18], to: [40, 18] }, { kind: 'line', from: [42, 18], to: [70, 20], color: 'orange' },
    { kind: 'polygon', points: [[40, 10], [42, 30], [40, 50], [38, 30]], color: 'blue', label: 'Lens' },
    { kind: 'dot', at: [70, 32], label: 'F' }, { kind: 'dot', at: [10, 32], label: 'F' },
  ];
  assertClean(layoutShapes(shapes), 'lens');
  assertReadable(layoutShapes(shapes), 'lens');
});

test('the same shapes array is laid out once (scene build and board share it)', () => {
  const shapes = FIXTURES.circuit.map((s) => ({ ...s }));
  assert.equal(layoutShapes(shapes), layoutShapes(shapes));
});

test('an axes "label" never opens a step of its own (it is not drawn; x/y names are)', () => {
  assert.deepEqual(assignSteps([{ kind: 'axes', label: 'graph' }, { kind: 'curve', label: 'v' }]), [1, 1]);
  assert.deepEqual(assignSteps([{ kind: 'axes', x: 't', y: 'v' }, { kind: 'curve', label: 'v' }]), [1, 2]);
});
