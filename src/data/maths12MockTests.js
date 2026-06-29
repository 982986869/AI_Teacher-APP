// maths12MockTests.js
// Class 12 Mathematics — full-length mock tests (10 papers, 50 Qs each).
// Loads the per-paper raw JSON in ./maths12MockTests/*.json and exposes them in
// the shape PracticeScreen's mock-test flow expects:
//   list:      [{ id, name, durationMin, questionCount }]
//   questions: [{ id, question, options:[strings], correct, cat, explanation }]
//   sections:  [{ sectionName, count, attemptAny }]
//
// Like the rest of Class 12 Mathematics (Practice / PYQ / Important / Papers) and
// Class 12 Chemistry, these ship locally (offline) instead of via the DB/API —
// unlike Class 12 Physics, whose mocks are DB-backed. PracticeScreen short-
// circuits the DB mock flow for Mathematics + Class 12 and reads this module.
//
// Files are named ch01.json..ch10.json (plain ASCII, no spaces): Metro on
// Windows fails to resolve import paths containing spaces.
//
// Math stays as {tex}…{/tex} — McqTestScreen renders each field through MathText,
// which handles {tex}.

import m01 from './maths12MockTests/ch01.json';
import m02 from './maths12MockTests/ch02.json';
import m03 from './maths12MockTests/ch03.json';
import m04 from './maths12MockTests/ch04.json';
import m05 from './maths12MockTests/ch05.json';
import m06 from './maths12MockTests/ch06.json';
import m07 from './maths12MockTests/ch07.json';
import m08 from './maths12MockTests/ch08.json';
import m09 from './maths12MockTests/ch09.json';
import m10 from './maths12MockTests/ch10.json';

const RAW_MOCKS = [m01, m02, m03, m04, m05, m06, m07, m08, m09, m10];

const DURATION_MIN = 90;

// A 50-question Maths mock splits into the three CBSE sections (matches the
// paper's own instruction: A=20 attempt 16, B=20 attempt 16, C=10 attempt 8).
const SECTION_SPLIT = [
  { sectionName: 'Section A', count: 20, attemptAny: 16 },
  { sectionName: 'Section B', count: 20, attemptAny: 16 },
  { sectionName: 'Section C', count: 10, attemptAny: 8 },
];

// Local mock ids are namespaced (maths12-) so they never collide with DB test ids
// (or Physics/Chemistry local ids) and so submit/attempt API calls can be skipped.
const localId = (mock) => `maths12-${mock.mock_id}`;

// Map one raw question to McqTestScreen's flat shape. We use the plain-text
// fields (question_text / option.text / explanation) because MathText renders
// text + {tex}, not HTML.
const toQuestion = (raw) => {
  const opts = Array.isArray(raw.options) ? raw.options : [];
  let correct = opts.findIndex((o) => o.is_correct);
  // Fallback: match against correct_option_ids if no is_correct flag is set.
  if (correct < 0 && Array.isArray(raw.correct_option_ids) && raw.correct_option_ids.length) {
    correct = opts.findIndex((o) => raw.correct_option_ids.includes(o.id));
  }
  return {
    id: raw.question_id != null ? raw.question_id : raw.n,
    question: raw.question_text || '',
    options: opts.map((o) => o.text || ''),
    correct: correct < 0 ? 0 : correct,
    explanation: raw.explanation || raw.solution || '',
    cat: 'MCQ',
  };
};

// Sections only apply to standard 50-question papers; otherwise one flat list.
const sectionsFor = (questions) => {
  const total = SECTION_SPLIT.reduce((n, s) => n + s.count, 0);
  return questions.length === total ? SECTION_SPLIT : null;
};

// Build { localId: { questions, sections } } once at module load.
const QUESTIONS_BY_ID = {};
RAW_MOCKS.forEach((mock) => {
  if (!mock || !Array.isArray(mock.questions)) return;
  const questions = mock.questions.map(toQuestion);
  QUESTIONS_BY_ID[localId(mock)] = { questions, sections: sectionsFor(questions) };
});

// The mock-test list rows (shape PracticeScreen renders directly).
export function getMaths12MockList() {
  return RAW_MOCKS
    .filter((m) => m && Array.isArray(m.questions))
    .map((m) => ({
      id: localId(m),
      name: m.name,
      durationMin: DURATION_MIN,
      questionCount: m.questions.length,
    }));
}

// Questions + sections for a local test id, or null if it isn't a local mock.
export function getMaths12MockQuestions(id) {
  return QUESTIONS_BY_ID[id] || null;
}

// True if the id belongs to a locally-shipped Class 12 Mathematics mock test.
export function isLocalMaths12MockId(id) {
  return typeof id === 'string' && id.startsWith('maths12-');
}
