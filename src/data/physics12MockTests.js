// physics12MockTests.js
// Class 12 Physics — full-length mock tests (10 papers, 55 Qs each).
// Loads the per-paper raw JSON in ./physics12MockTests/*.json and exposes them
// in the shape PracticeScreen's mock-test flow expects:
//   list:      [{ id, name, durationMin, questionCount }]
//   questions: [{ id, question, options:[strings], correct, cat, explanation }]
//   sections:  [{ sectionName, count, attemptAny }]
//
// These ship locally (offline) and override the DB-backed Physics mock tests,
// mirroring the PYQ / Exemplar local-first approach. Math stays as {tex}…{/tex}
// — McqTestScreen renders each field through MathText, which handles {tex}.

import m01 from './physics12MockTests/01 Mock Test - 01.json';
import m02 from './physics12MockTests/02 Mock Test - 02.json';
import m03 from './physics12MockTests/03 Mock Test - 03.json';
import m04 from './physics12MockTests/04 Mock Test - 04.json';
import m05 from './physics12MockTests/05 Mock Test - 05.json';
import m06 from './physics12MockTests/06 Mock Test - 06.json';
import m07 from './physics12MockTests/07 Mock Test - 07.json';
import m08 from './physics12MockTests/08 Mock Test - 08.json';
import m09 from './physics12MockTests/09 Mock Test - 09.json';
import m10 from './physics12MockTests/10 Mock Test - 10.json';

const RAW_MOCKS = [m01, m02, m03, m04, m05, m06, m07, m08, m09, m10];

const DURATION_MIN = 90;

// A 55-question paper splits into the three CBSE sections (matches the paper's
// own instruction: A=25 attempt 20, B=24 attempt 20, C=6 attempt 5).
const SECTION_SPLIT = [
  { sectionName: 'Section A', count: 25, attemptAny: 20 },
  { sectionName: 'Section B', count: 24, attemptAny: 20 },
  { sectionName: 'Section C', count: 6, attemptAny: 5 },
];

// Local mock ids are namespaced so they never collide with DB test ids and so
// the submit/attempt API calls can be skipped for them.
const localId = (mock) => `local-${mock.mock_id}`;

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

// Sections only apply to standard 55-question papers; otherwise one flat list.
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
export function getPhysics12MockList() {
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
export function getPhysics12MockQuestions(id) {
  return QUESTIONS_BY_ID[id] || null;
}

// True if the id belongs to a locally-shipped Physics mock test.
export function isLocalMockId(id) {
  return typeof id === 'string' && id.startsWith('local-');
}
