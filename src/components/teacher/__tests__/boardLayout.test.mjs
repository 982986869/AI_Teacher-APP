// Pure layout maths for the lesson boards — run with `npm run test:boards`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fitLabel, labelBox, boxesOverlap,
  numberLineRange, chartSeries, CHART_MAX_BARS,
  cellLayout, moleculeLayout, freeBodyLayout,
} from '../boardLayout.js';

// ── fitLabel ──────────────────────────────────────────────────────────────────
test('fitLabel keeps a short label at full size on one line', () => {
  const r = fitLabel('Nucleus', { size: 13, maxW: 100 });
  assert.equal(r.size, 13);
  assert.deepEqual(r.lines, ['Nucleus']);
});

test('fitLabel wraps before it shrinks below the floor', () => {
  const r = fitLabel('Endoplasmic reticulum', { size: 13, maxW: 90, maxLines: 2, min: 9 });
  assert.equal(r.lines.length, 2);
  for (const l of r.lines) assert.ok(l.length * r.size * 0.56 <= 90, `"${l}" overflows`);
});

test('fitLabel ellipsises when nothing fits even at the floor', () => {
  const r = fitLabel('Supercalifragilisticexpialidocious', { size: 12, maxW: 30, maxLines: 1, min: 8 });
  assert.equal(r.size, 8);
  assert.equal(r.lines.length, 1);
  assert.ok(r.lines[0].endsWith('…'));
});

// ── boxes ─────────────────────────────────────────────────────────────────────
test('labelBox is centred on (x, y) for a middle-anchored label', () => {
  const b = labelBox({ x: 100, y: 50, size: 10, lines: ['abcd'] });
  assert.ok(Math.abs((b.x0 + b.x1) / 2 - 100) < 0.001);
  assert.ok(Math.abs((b.y0 + b.y1) / 2 - 50) < 0.001);
});

test('boxesOverlap detects intersection and ignores touching-free boxes', () => {
  assert.equal(boxesOverlap({ x0: 0, y0: 0, x1: 10, y1: 10 }, { x0: 5, y0: 5, x1: 15, y1: 15 }), true);
  assert.equal(boxesOverlap({ x0: 0, y0: 0, x1: 10, y1: 10 }, { x0: 11, y0: 0, x1: 20, y1: 10 }), false);
});

// ── number line ───────────────────────────────────────────────────────────────
test('numberLineRange keeps the classic -5..5 for small marks', () => {
  assert.deepEqual(numberLineRange([-2, 1, 3]), { lo: -5, hi: 5, step: 1 });
});

test('numberLineRange widens to include marks outside -5..5', () => {
  const r = numberLineRange([12, -7]);
  assert.ok(r.lo <= -7 && r.hi >= 12, JSON.stringify(r));
  // never more than ~12 ticks, or the tick labels collide
  assert.ok((r.hi - r.lo) / r.step <= 12, JSON.stringify(r));
});

// ── chart ─────────────────────────────────────────────────────────────────────
test('chartSeries caps the bars so labels cannot collide', () => {
  const values = Array.from({ length: 12 }, (_, i) => i + 1);
  const r = chartSeries({ values, labels: values.map(String) });
  assert.equal(r.values.length, CHART_MAX_BARS);
  assert.equal(r.labels.length, CHART_MAX_BARS);
});

test('chartSeries drops non-numeric values and falls back when empty', () => {
  assert.deepEqual(chartSeries({ values: [3, 'x', 5] }).values, [3, 5]);
  assert.ok(chartSeries({}).values.length > 0);
});

// ── no-overlap guarantees for the fixed-layout boards ─────────────────────────
function assertNoLabelCollisions(layout, name) {
  const boxes = layout.labels.map((l) => ({ ...l, box: labelBox(l) }));
  for (let i = 0; i < boxes.length; i += 1) {
    const b = boxes[i].box;
    assert.ok(b.x0 >= 0 && b.x1 <= layout.viewW && b.y0 >= 0 && b.y1 <= layout.viewH,
      `${name}: label "${boxes[i].lines.join(' ')}" leaves the viewBox ${JSON.stringify(b)}`);
    for (let j = i + 1; j < boxes.length; j += 1) {
      assert.equal(boxesOverlap(b, boxes[j].box), false,
        `${name}: "${boxes[i].lines.join(' ')}" overlaps "${boxes[j].lines.join(' ')}"`);
    }
    for (const sh of layout.shapes) {
      if (sh.id === boxes[i].inside) continue; // a label drawn INSIDE its own shape
      assert.equal(boxesOverlap(b, sh.box), false,
        `${name}: label "${boxes[i].lines.join(' ')}" overlaps shape ${sh.id}`);
    }
  }
}

test('cell board labels never overlap each other or the organelles', () => {
  assertNoLabelCollisions(cellLayout(['Cell membrane', 'Nucleus', 'Mitochondria', 'Cytoplasm']), 'cell');
  assertNoLabelCollisions(cellLayout(['Plasma membrane (outer)', 'Nucleus with nucleolus', 'Mitochondrion powerhouse', 'Cytoplasm jelly']), 'cell-long');
});

test('cell board organelle labels stay inside the membrane', () => {
  for (const names of [['Cell membrane', 'Nucleus', 'Mitochondria', 'Cytoplasm'], ['Plasma membrane (outer)', 'Nucleus with nucleolus', 'Mitochondrion powerhouse', 'Cytoplasm jelly']]) {
    const L = cellLayout(names);
    const { cx, cy, rx, ry } = L.membrane;
    for (const p of L.parts.slice(1)) {
      const b = labelBox(p.label);
      for (const [x, y] of [[b.x0, b.y0], [b.x1, b.y0], [b.x0, b.y1], [b.x1, b.y1]]) {
        const k = ((x - cx) / (rx - 3)) ** 2 + ((y - cy) / (ry - 3)) ** 2;
        assert.ok(k <= 1, `${p.kind} label corner (${x.toFixed(1)}, ${y.toFixed(1)}) is outside the cell`);
      }
    }
  }
});

test('cell board has exactly one part per label (no empty 5th beat)', () => {
  assert.equal(cellLayout(['a', 'b', 'c', 'd', 'e', 'f']).parts.length, 4);
});

test('free-body labels never sit on an arrow, the block or each other', () => {
  for (const names of [['Weight', 'Normal', 'Applied', 'Friction'], ['EMF source ε', 'Internal resistance r (inside the cell)', 'External load resistance R', 'Kinetic friction force']]) {
    const L = freeBodyLayout(names);
    assertNoLabelCollisions(L, 'freeBody');
  }
});

test('molecule labels fit: short symbols inside atoms, long names outside without collisions', () => {
  assertNoLabelCollisions(moleculeLayout(['O', 'H', 'H']), 'water');
  assertNoLabelCollisions(moleculeLayout(['Carbon', 'Oxygen', 'Oxygen', 'Hydrogen']), 'long-names');
});

test('molecule atoms fill a good part of the board, not a third of it', () => {
  const m = moleculeLayout(['C', 'O', 'O', 'H']);
  const xs = m.atoms.flatMap((a) => [a.x - a.r, a.x + a.r]);
  assert.ok(Math.max(...xs) - Math.min(...xs) >= 0.5 * m.viewW);
});

test('numberLineRange never draws more than 12 ticks, however big the mark', () => {
  for (const marks of [[20000], [3e8], [-7e12, 4]]) {
    const r = numberLineRange(marks);
    const ticks = Math.round((r.hi - r.lo) / r.step) + 1;
    assert.ok(ticks <= 13, `${JSON.stringify(marks)} → ${ticks} ticks`);
    assert.ok(r.lo <= Math.min(...marks) && r.hi >= Math.max(...marks), JSON.stringify(r));
  }
});

test('molecule draws only the atoms the lesson named (matches the Director count)', () => {
  assert.equal(moleculeLayout(['C', 'O']).atoms.length, 2);
  assert.equal(moleculeLayout([]).atoms.length, 3); // nothing named → the H2O default
});
