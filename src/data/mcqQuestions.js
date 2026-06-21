// mcqQuestions.js
// Question bank for the MCQ test flow (McqTestScreen).
//
// Shape: { Subject: { 'Chapter Name': [ question, question, ... ] } }
// Each question:
//   {
//     cat: 'Limits',                      // small category label shown on the card
//     question: 'What is lim(x->0) ...',  // question text
//     options: ['0', 'inf', '1', 'DNE'],  // 2-6 options
//     correct: 2,                          // index (0-based) of the correct option
//   }
//
// Subject + chapter names must match PracticeScreen's PYQ_SUBJECTS exactly.
// When a chapter has no questions yet, getMcqQuestions returns SAMPLE so the
// flow is still demonstrable. Replace SAMPLE usage by filling real chapters.

const SAMPLE = [
  { cat: 'Limits', question: 'What is lim(x→0) (sin x) / x ?', options: ['0', '∞', '1', 'Does not exist'], correct: 2 },
  { cat: 'Continuity', question: 'A function f(x) is continuous at x = a if:', options: ['lim(x→a) f(x) exists', 'f(a) is defined', 'lim(x→a) f(x) = f(a)', "f'(a) exists"], correct: 2 },
  { cat: 'Differentiability', question: 'If f(x) = |x|, then f′(0) is:', options: ['0', '1', '−1', 'Does not exist'], correct: 3 },
  { cat: 'L’Hôpital', question: 'lim(x→0) (tan x − x) / x³ = ?', options: ['0', '1/2', '1/3', '2/3'], correct: 2 },
  { cat: 'Limits', question: 'lim(x→∞) (1 + 1/x)^x = ?', options: ['1', 'e', '0', '∞'], correct: 1 },
];

const MCQ_QUESTIONS = {
  Physics: {},
  Mathematics: {},
  Chemistry: {},
  Biology: {},
};

// Returns the question array for a subject + chapter, or SAMPLE if none yet.
export function getMcqQuestions(subject, chapter) {
  const subj = MCQ_QUESTIONS[subject];
  const list = subj ? subj[chapter] : null;
  return Array.isArray(list) && list.length ? list : SAMPLE;
}

export default MCQ_QUESTIONS;