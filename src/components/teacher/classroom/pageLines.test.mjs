// node --test src/components/teacher/classroom/pageLines.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { pageLinesFor, revealCount, hasSideVisual } from './pageLines.js';

const kinds = (lines) => lines.map((l) => l.kind);

test('a concept slide: teal title, then its key points as bullets', () => {
  const scene = { boardType: 'concept', title: 'Thermal Equilibrium', diagram: { shape: 'points', points: ['hot tea → cooler room', 'heat flows hot to cold'] } };
  const lines = pageLinesFor(scene, { visualType: 'NONE', visualData: {} });
  assert.deepEqual(kinds(lines), ['title', 'pt', 'pt']);
  assert.equal(lines[0].text, 'Thermal Equilibrium');
  assert.equal(lines[1].text, 'hot tea → cooler room');
});

test('an EXAMPLE slide adds its scenario as an orange e.g. line and its steps as bullets', () => {
  const scene = { boardType: 'concept', title: 'Worked example', diagram: { points: ['legs are 3 and 4'] } };
  const slide = { visualType: 'EXAMPLE', visualData: { scenario: 'P(2, 3) and Q(5, 7)', steps: ['PR = 3', 'QR = 4'], keyPoints: ['legs are 3 and 4'] } };
  const lines = pageLinesFor(scene, slide);
  assert.deepEqual(kinds(lines), ['title', 'pt', 'pt', 'pt', 'eg']);
  assert.equal(lines.at(-1).text, 'e.g. P(2, 3) and Q(5, 7)');
});

test('an ANALOGY slide becomes an e.g. line naming the comparison', () => {
  const scene = { boardType: 'concept', title: 'Current', diagram: { points: [] } };
  const slide = { visualType: 'ANALOGY', visualData: { realWorldObject: 'water in a pipe', comparison: 'charge flows like water' } };
  const lines = pageLinesFor(scene, slide);
  assert.deepEqual(kinds(lines), ['title', 'eg']);
  assert.equal(lines[1].text, 'e.g. Like water in a pipe: charge flows like water');
});

test('a FORMULA slide writes the formula, then one bullet per variable', () => {
  const scene = { boardType: 'formula', title: 'Distance formula', diagram: { variables: [{ symbol: 'd', meaning: 'distance' }] } };
  const slide = { visualType: 'FORMULA', visualData: { formula: 'd = √[(x₂ − x₁)² + (y₂ − y₁)²]', variables: [{ symbol: 'd', meaning: 'distance' }], keyPoints: ['subtract, then square'] } };
  const lines = pageLinesFor(scene, slide);
  assert.deepEqual(kinds(lines), ['title', 'formula', 'pt', 'pt']);
  assert.equal(lines[1].text, 'd = √[(x₂ − x₁)² + (y₂ − y₁)²]');
  assert.equal(lines[2].text, 'd: distance');
});

test('a mistake slide turns every point into a red warning line', () => {
  const scene = { boardType: 'mistake', title: 'Common slip', diagram: { points: ['Never add the coordinates'] } };
  const lines = pageLinesFor(scene, { visualType: 'NONE', visualData: {} });
  assert.deepEqual(kinds(lines), ['title', 'warn']);
});

test('a quick check has no written lines (the quiz card is the page)', () => {
  assert.deepEqual(pageLinesFor({ boardType: 'quickCheck', title: 'Quick Check' }, null), []);
});

test('missing slide data never throws and empty strings are dropped', () => {
  const lines = pageLinesFor({ boardType: 'concept', title: '', diagram: { points: ['', '  ', 'kept'] } }, undefined);
  assert.deepEqual(lines, [{ kind: 'pt', text: 'kept' }]);
});

test('revealCount: the title shows at once, the rest spread across the beats, all by the last beat', () => {
  assert.equal(revealCount(5, 0, 4), 2);
  assert.equal(revealCount(5, 1, 4), 3);
  assert.equal(revealCount(5, 3, 4), 5);
  assert.equal(revealCount(1, 0, 3), 1);
  assert.equal(revealCount(0, 0, 3), 0);
  assert.equal(revealCount(4, 9, 2), 4, 'never more than there are lines');
  assert.equal(revealCount(4, 0, 0), 4, 'no beats: show everything');
});

test('hasSideVisual: drawn boards get the right-hand column, plain point boards do not', () => {
  assert.equal(hasSideVisual({ boardType: 'chart' }), true);
  assert.equal(hasSideVisual({ boardType: 'triangle' }), true);
  assert.equal(hasSideVisual({ boardType: 'freeBody' }), true);
  assert.equal(hasSideVisual({ boardType: 'annotated' }), true);
  assert.equal(hasSideVisual({ boardType: 'concept', diagram: { shape: 'flow', steps: ['a', 'b'] } }), true);
  assert.equal(hasSideVisual({ boardType: 'concept', diagram: { shape: 'points', points: ['a'] } }), false);
  assert.equal(hasSideVisual({ boardType: 'formula' }), false, 'the formula is already written on the page');
  assert.equal(hasSideVisual({ boardType: 'summary' }), false);
  assert.equal(hasSideVisual({ boardType: 'quickCheck' }), false);
});
