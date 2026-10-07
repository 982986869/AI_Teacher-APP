// Board routing — run with `npm run test:boards`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildScenes } from '../teachingScenes.js';

const lesson = (...slides) => ({
  lessonTitle: 'Test lesson',
  slides: [
    { slideTitle: 'Opening', explanation: 'x', narrationText: 'x', visualType: 'NONE', visualData: {} },
    ...slides,
    { slideTitle: 'Wrap', explanation: 'x', narrationText: 'x', visualType: 'NONE', visualData: {} },
  ],
});
const boardOf = (slide) => buildScenes(lesson(slide))[1].boardType;

// From a real Class 12 EMF lesson: an electric CELL is not a biological cell.
test('an electric cell (EMF, internal resistance) never gets the biology cell board', () => {
  const t = boardOf({
    slideTitle: 'Short Circuit: When External Resistance is Zero',
    explanation: 'A short circuit gives maximum current from the cell.',
    narrationText: 'Connect the terminals of the cell directly. The internal resistance alone limits the current.',
    visualType: 'DIAGRAM',
    visualData: { components: ['Cell', 'Internal resistance r', 'Wire'], keyPoints: ['Short circuit produces maximum current and zero terminal voltage'] },
  });
  assert.notEqual(t, 'cell');
});

test('a biology cell slide still gets the cell board', () => {
  const t = boardOf({
    slideTitle: 'Parts of an Animal Cell',
    explanation: 'The nucleus controls the cell.',
    narrationText: 'Every animal cell has a membrane, cytoplasm and a nucleus.',
    visualType: 'DIAGRAM',
    visualData: { components: ['Cell membrane', 'Nucleus', 'Mitochondria', 'Cytoplasm'] },
  });
  assert.equal(t, 'cell');
});

// A labelled-part board fed keyPoint SENTENCES draws paragraphs across the picture —
// a text board and a diagram on top of each other.
test('a part-labelling board is not chosen when the slide names no parts', () => {
  const t = boardOf({
    slideTitle: 'Cell organelles at work',
    explanation: 'Mitochondria release energy.',
    narrationText: 'The mitochondria in each cell release energy for the cell.',
    visualType: 'NONE',
    visualData: { keyPoints: ['Mitochondria release energy from food', 'The nucleus holds the DNA'] },
  });
  assert.equal(t, 'concept');
});

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
