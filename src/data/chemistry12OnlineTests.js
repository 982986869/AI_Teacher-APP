// chemistry12OnlineTests.js
// Class 12 Chemistry — Online Tests (MCQ). 44 tests across 10 chapters (659 Qs).
// Loads the per-chapter raw JSON in ./chemistry12OnlineTests/*.json and exposes
// the real test groupings (each chapter ships a fixed set of named tests — free
// and paid — NOT a synthetic 5-way split like the offline banks).
//
// Like the rest of Class 12 Chemistry (Practice / PYQ / Important / Papers /
// Mock Tests), these ship locally (offline). OnlineTestsScreen routes Class 12
// Chemistry to this module instead of the generic chemistryBank.
//
// Each question carries its correct answer (is_correct / correct_option_ids), so
// the post-submit result (computeMockResult in PracticeScreen) scores correctly.
// Questions are normalized to the shape TestQuestionScreen renders (plain text,
// letter answer): { id, text, options:[{key,label}], correctAnswer, explanation }.
//
// Files are ch01.json..ch10.json (plain ASCII, no spaces) — Metro on Windows
// fails to resolve import paths containing spaces. Order is NCERT chapter order.

import ch01 from './chemistry12OnlineTests/ch01.json'; // Solutions
import ch02 from './chemistry12OnlineTests/ch02.json'; // Electrochemistry
import ch03 from './chemistry12OnlineTests/ch03.json'; // Chemical Kinetics
import ch04 from './chemistry12OnlineTests/ch04.json'; // The d- and f- Block Elements
import ch05 from './chemistry12OnlineTests/ch05.json'; // Coordination Compounds
import ch06 from './chemistry12OnlineTests/ch06.json'; // Haloalkanes and Haloarenes
import ch07 from './chemistry12OnlineTests/ch07.json'; // Alcohols Phenols and Ethers
import ch08 from './chemistry12OnlineTests/ch08.json'; // Aldehydes Ketones and Carboxylic Acids
import ch09 from './chemistry12OnlineTests/ch09.json'; // Amines
import ch10 from './chemistry12OnlineTests/ch10.json'; // Biomolecules

const RAW_CHAPTERS = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10];

const LETTERS = 'ABCDEFGHIJ'.split('');

// Flatten any leftover HTML/entities to readable text — TestQuestionScreen renders
// plain <Text>, not HTML/MathText (same as the offline banks). question_text /
// option.text are already flattened in the source; this is a safety net.
const toText = (s) =>
  String(s || '')
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
    text: toText(raw.question_text || raw.question_html),
    options: opts.map((o, i) => ({ key: LETTERS[i], label: toText(o.text || o.html) })),
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
      id: `chem12ot-${t.test_id}`,
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
export function getChemistry12OnlineChapters() {
  return CHAPTER_LIST;
}

// The real tests for a chapter: [{ id, name, isPaid, questions:[normalized] }].
export function getChemistry12OnlineTests(chapterId) {
  const ch = BY_CHAPTER[chapterId];
  return ch ? ch.tests : [];
}

export default BY_CHAPTER;
