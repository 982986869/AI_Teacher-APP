// src/screens/braingym/stickLogic.js
// Data + helpers for the Matchstick game (Cuemath-style): a wrong equation is shown
// in seven-segment "matchstick" digits, and the player fixes it by moving one stick
// (picked from 3 options). Pure data/logic — no React — so it's easy to test/extend.

// Seven-segment layout, segment keys:  aaa
//                                      f   b
//                                      f   b
//                                       ggg
//                                      e   c
//                                      e   c
//                                       ddd
export const DIGIT_SEGS = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgecd',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
};

// Turn an equation string like "9-5=4" into renderable tokens.
//   digit → { type:'digit', char, segs:Set }   operator → { type:'op', op }
export function tokensFor(str) {
  return String(str).split('').filter((ch) => ch !== ' ').map((ch) => {
    if (/[0-9]/.test(ch)) return { type: 'digit', char: ch, segs: new Set((DIGIT_SEGS[ch] || '').split('')) };
    return { type: 'op', op: ch }; // + - =
  });
}

// Safe evaluator for "a±b=c" (only used to sanity-check the puzzle bank at runtime).
export function isEquationTrue(str) {
  const m = String(str).replace(/\s/g, '').match(/^(\d+)([+\-])(\d+)=(\d+)$/);
  if (!m) return false;
  const a = +m[1], b = +m[3], c = +m[4];
  return (m[2] === '+' ? a + b : a - b) === c;
}

// Curated puzzle bank. Each: a WRONG equation (`bad`), the CORRECT one after moving a
// single matchstick (`good`), two more wrong `options`, and a short `tip`. Every `good`
// is a true equation; every distractor is false (checked by isEquationTrue in dev).
export const PUZZLES = [
  { bad: '9+5=4', good: '9-5=4', options: ['9-5=2', '9+5=6'], tip: 'Take one stick off the +' },
  { bad: '5-1=6', good: '5+1=6', options: ['5+1=4', '5+1=8'], tip: 'Add a stick to the −' },
  { bad: '1+1=3', good: '1+1=2', options: ['1+1=4', '1-1=2'], tip: 'Move a stick on the last digit' },
  { bad: '2+2=5', good: '2+2=4', options: ['2+2=6', '2+2=8'], tip: 'Slide a stick on the answer' },
  { bad: '3+3=5', good: '3+3=6', options: ['3+3=8', '3+3=9'], tip: 'Add a stick to the answer' },
  { bad: '7+1=9', good: '7+1=8', options: ['7+1=6', '7+1=0'], tip: 'Move a stick on the 9' },
  { bad: '6-2=8', good: '6-2=4', options: ['6-2=3', '6-2=9'], tip: 'Rework the answer' },
  { bad: '8-3=4', good: '8-3=5', options: ['8-3=6', '8-3=9'], tip: 'Slide a stick on the answer' },
  { bad: '4+3=8', good: '4+3=7', options: ['4+3=9', '4+3=6'], tip: 'Move a stick on the 8' },
  { bad: '9-6=2', good: '9-6=3', options: ['9-6=4', '9-6=5'], tip: 'Move a stick on the answer' },
  { bad: '5+2=8', good: '5+2=7', options: ['5+2=9', '5+2=6'], tip: 'Rework the answer' },
  { bad: '6+1=8', good: '6+1=7', options: ['6+1=9', '6+1=5'], tip: 'Move a stick on the 8' },
];

// Fisher–Yates shuffle (Math.random is fine in the app runtime).
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// One playable round: the bad equation + its 3 shuffled options (good + 2 distractors).
export function buildRound(puzzle) {
  const opts = shuffle([puzzle.good, ...puzzle.options]);
  return { bad: puzzle.bad, good: puzzle.good, tip: puzzle.tip, options: opts };
}

// A shuffled run of `n` distinct rounds.
export function buildRun(n = 8) {
  return shuffle(PUZZLES).slice(0, n).map(buildRound);
}
