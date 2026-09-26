// Run: node --test src/utils/mcqTestScoring.test.mjs
//
// Mock-test scoring. A picked option must count even if the student never pressed
// "Save & Next" — finishing or timing out used to score it as skipped.

import test from 'node:test';
import assert from 'node:assert';
import { scoreMcqTest, answersById } from './mcqTestScoring.js';

const QS = [
  { id: 'q1', correct: 0 },
  { id: 'q2', correct: 1 },
  { id: 'q3', correct: 2 },
];
const MARKS = { pointsPerCorrect: 4, negative: 1 };

test('a picked option counts without Save & Next', () => {
  // q1 saved, q2 picked but not saved (e.g. Finish tapped / time ran out)
  const r = scoreMcqTest(QS, { 0: 0, 1: 1 }, { 0: 'answered' }, MARKS);
  assert.equal(r.correct, 2);
  assert.equal(r.skipped, 1);
  assert.equal(r.score, 8);
});

test('the unsaved last answer is sent to the server too', () => {
  assert.deepEqual(answersById(QS, { 0: 0, 2: 1 }, { 0: 'answered' }), { q1: 0, q3: 1 });
});

test('a question explicitly skipped does not count, even with an option picked', () => {
  const r = scoreMcqTest(QS, { 0: 2 }, { 0: 'skipped' }, MARKS);
  assert.equal(r.wrong, 0);
  assert.equal(r.skipped, 3);
  assert.deepEqual(answersById(QS, { 0: 2 }, { 0: 'skipped' }), {});
});

test('wrong answers take the negative mark and accuracy/completion follow', () => {
  const r = scoreMcqTest(QS, { 0: 0, 1: 0 }, {}, MARKS);
  assert.equal(r.correct, 1);
  assert.equal(r.wrong, 1);
  assert.equal(r.score, 3);
  assert.equal(r.accuracy, 50);
  assert.equal(r.completion, 67);
  assert.equal(r.scorePct, 25);
});

test('an empty test scores zero instead of dividing by zero', () => {
  assert.deepEqual(scoreMcqTest([], {}, {}, MARKS), { correct: 0, wrong: 0, skipped: 0, score: 0, accuracy: 0, completion: 0, scorePct: 0 });
});
