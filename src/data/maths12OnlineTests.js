// maths12OnlineTests.js
// Class 12 Mathematics — Online Tests (MCQ). 70 tests across 13 chapters (1048 Qs).
// Loads the per-chapter raw JSON in ./maths12OnlineTests/*.json and exposes the
// real test groupings (each chapter ships a fixed set of named tests — free and
// paid — NOT a synthetic 5-way split like the offline banks).
//
// Like the rest of Class 12 Mathematics (Practice / PYQ / Important / Papers /
// Mock Tests) and Class 12 Chemistry, these ship locally (offline).
// OnlineTestsScreen routes Class 12 Mathematics to this module instead of the
// generic mathsBank.
//
// Each question carries its correct answer (is_correct / correct_option_ids), so
// the post-submit result (computeMockResult in PracticeScreen) scores correctly.
// Questions are normalized to the shape TestQuestionScreen renders (plain text,
// letter answer): { id, text, options:[{key,label}], correctAnswer, explanation }.
//
// Maths is LaTeX-heavy, so (unlike the text-only Chemistry online tests) we keep
// the HTML + {tex}…{/tex} markup intact and pass it to TestQuestionScreen, which
// renders question/option content via MathText (MathJax SVG) — so fractions,
// matrices, integrals etc. render as real formulas instead of raw LaTeX.
//
// Files are ch01.json..ch13.json (plain ASCII, no spaces) — Metro on Windows
// fails to resolve import paths containing spaces. Order is NCERT chapter order.

import ch01 from './maths12OnlineTests/ch01.json'; // Relations and Functions
import ch02 from './maths12OnlineTests/ch02.json'; // Inverse Trigonometric Functions
import ch03 from './maths12OnlineTests/ch03.json'; // Matrices
import ch04 from './maths12OnlineTests/ch04.json'; // Determinants
import ch05 from './maths12OnlineTests/ch05.json'; // Continuity and Differentiability
import ch06 from './maths12OnlineTests/ch06.json'; // Application of Derivatives
import ch07 from './maths12OnlineTests/ch07.json'; // Integrals
import ch08 from './maths12OnlineTests/ch08.json'; // Application of Integrals
import ch09 from './maths12OnlineTests/ch09.json'; // Differential Equations
import ch10 from './maths12OnlineTests/ch10.json'; // Vector Algebra
import ch11 from './maths12OnlineTests/ch11.json'; // Three Dimensional Geometry
import ch12 from './maths12OnlineTests/ch12.json'; // Linear Programming
import ch13 from './maths12OnlineTests/ch13.json'; // Probability

const RAW_CHAPTERS = [
  ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10, ch11, ch12, ch13,
];

const LETTERS = 'ABCDEFGHIJ'.split('');

// Keep the HTML + {tex}…{/tex} markup (MathText/MathJax renders it as real
// formulas, super/subscripts, etc.). We only normalise whitespace and drop the
// occasional <img> wrapper. The question_html / option.html fields carry the
// full markup; we prefer them over the flattened *_text fields.
const toRich = (s) =>
  String(s || '')
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();

// Plain-text fallback (used for the explanation, which isn't math-rendered here).
const toText = (s) =>
  String(s || '')
    .replace(/\{tex\}/g, ' ').replace(/\{\/tex\}/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

// One raw online-test question -> the shape TestQuestionScreen expects. The
// correct option's letter (from is_correct, or correct_option_ids) becomes
// `correctAnswer` so computeMockResult can score the attempt.
const toQuestion = (raw) => {
  const opts = Array.isArray(raw.options) ? raw.options : [];
  let ci = opts.findIndex((o) => o.is_correct);
  if (ci < 0 && Array.isArray(raw.correct_option_ids) && raw.correct_option_ids.length) {
    ci = opts.findIndex((o) => raw.correct_option_ids.includes(o.id));
  }
  return {
    id: raw.question_id != null ? raw.question_id : raw.n,
    text: toRich(raw.question_html || raw.question_text),
    options: opts.map((o, i) => ({ key: LETTERS[i], label: toRich(o.html || o.text) })),
    correctAnswer: ci >= 0 ? LETTERS[ci] : null,
    explanation: toText(raw.explanation || raw.solution),
  };
};

// Build { chapterId: { id, name, tests:[{ id, name, isPaid, questions }] } }.
const BY_CHAPTER = {};
const CHAPTER_LIST = [];
RAW_CHAPTERS.forEach((ch) => {
  if (!ch || !Array.isArray(ch.tests)) return;
  const tests = ch.tests
    .filter((t) => Array.isArray(t.questions) && t.questions.length)
    .map((t) => ({
      id: `maths12ot-${t.test_id}`,
      name: t.test_name,
      isPaid: !!t.is_paid,
      // Drop malformed source questions that ship with no options (unanswerable).
      questions: t.questions.map(toQuestion).filter((q) => q.options.length > 0),
    }))
    .filter((t) => t.questions.length);
  if (!tests.length) return;
  const count = tests.reduce((n, t) => n + t.questions.length, 0);
  BY_CHAPTER[ch.chapter_id] = { id: ch.chapter_id, name: ch.chapter, tests };
  CHAPTER_LIST.push({ id: ch.chapter_id, name: ch.chapter, count, testCount: tests.length });
});

// ── public API ─────────────────────────────────────────────────────────────

// Chapter rows for OnlineTestsScreen: [{ id, name, count, testCount }].
export function getMaths12OnlineChapters() {
  return CHAPTER_LIST;
}

// The real tests for a chapter: [{ id, name, isPaid, questions:[normalized] }].
export function getMaths12OnlineTests(chapterId) {
  const ch = BY_CHAPTER[chapterId];
  return ch ? ch.tests : [];
}

export default BY_CHAPTER;
