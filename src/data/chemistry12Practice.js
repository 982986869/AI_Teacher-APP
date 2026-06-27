// chemistry12Practice.js
// Class 12 Chemistry — "Practice Questions" (MCQ Practice) local bank. 7910
// questions across 10 chapters, each merged from its subtopic files; subtopics
// are derived by grouping questions on topic_id. Powers the McqPracticeScreen →
// McqLoader → McqQuizScreen flow for Class 12 Chemistry, overriding the DB-backed
// mcqPracticeApi (same local-first approach as Class 12 Physics).
//
// Question shape returned matches what McqQuizScreen expects:
//   { id, text, options:[{key,label,optionId}], correctOptionId, correctAnswer,
//     explanation, difficulty }
// NOTE: this source has no answer key (correct_option_id is null), so questions
// are presented for practice without correct/incorrect scoring.
//
// Files use plain ASCII names (ch01..ch10) — Metro on Windows fails to resolve
// import paths containing spaces. The order below is NCERT chapter order; each
// file's `chapter` field supplies the display name.

import ch01 from './chemistry12Practice/ch01.json'; // Solutions
import ch02 from './chemistry12Practice/ch02.json'; // Electrochemistry
import ch03 from './chemistry12Practice/ch03.json'; // Chemical Kinetics
import ch04 from './chemistry12Practice/ch04.json'; // The d- and f- Block Elements
import ch05 from './chemistry12Practice/ch05.json'; // Coordination Compounds
import ch06 from './chemistry12Practice/ch06.json'; // Haloalkanes and Haloarenes
import ch07 from './chemistry12Practice/ch07.json'; // Alcohols Phenols and Ethers
import ch08 from './chemistry12Practice/ch08.json'; // Aldehydes Ketones and Carboxylic Acids
import ch09 from './chemistry12Practice/ch09.json'; // Amines
import ch10 from './chemistry12Practice/ch10.json'; // Biomolecules

// Fetched answer key, keyed by question_id:
//   { "<id>": { correctAnswer, correctOptionId, explanation } }
// Empty {} until/unless a fetch script populates it (mirrors physics12Practice).
import ANSWER_KEY from './chemistry12Practice/answer_key.json';

const RAW_CHAPTERS = [
  ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10,
];

const LETTERS = 'ABCDEFGHIJ'.split('');

// One raw scraped MCQ -> the shape McqQuizScreen renders. We pass the original
// HTML (which keeps {tex} LaTeX) so McqQuizScreen's MathText (MathJax→SVG, built
// for HTML+LaTeX) renders fractions/superscripts/roots properly; falls back to
// the flattened text when no HTML is present.
function normalizeQuestion(q) {
  const options = (q.options || []).map((o, i) => ({
    key: LETTERS[i],
    label: (o.html && o.html.trim()) ? o.html : (o.text || ''),
    optionId: o.id != null ? o.id : null,
  }));
  // Prefer the fetched answer key; fall back to any answer in the source data.
  const ak = ANSWER_KEY[q.question_id] || ANSWER_KEY[String(q.question_id)] || null;
  const correctOptionId =
    (ak && ak.correctOptionId != null) ? ak.correctOptionId
      : (q.correct_option_id != null ? q.correct_option_id : null);
  let correctAnswer = (ak && ak.correctAnswer) ? ak.correctAnswer : null;
  if (!correctAnswer && correctOptionId != null) {
    const idx = options.findIndex((o) => String(o.optionId) === String(correctOptionId));
    if (idx >= 0) correctAnswer = LETTERS[idx];
  }
  return {
    id: q.question_id,
    text: (q.question_html && q.question_html.trim()) ? q.question_html : (q.question_text || ''),
    options,
    correctOptionId,
    correctAnswer,
    explanation: (ak && ak.explanation) || q.explanation || '',
    difficulty: q.difficulty || null,
    topicId: q.topic_id,
    topic: q.topic,
  };
}

// Build the chapter list. Each chapter: { id, name, total, questions:[normalized] }.
const CHAPTERS = RAW_CHAPTERS
  .filter((arr) => Array.isArray(arr) && arr.length > 0)
  .map((arr) => {
    const questions = arr.map(normalizeQuestion);
    return {
      id: arr[0].chapter_id,
      name: arr[0].chapter,
      total: questions.length,
      questions,
    };
  });

const byName = (name) => CHAPTERS.find((c) => c.name === name) || null;

// ── public API ────────────────────────────────────────────────────────────────

// Chapter cards for McqPracticeScreen: [{ name, total }].
export function getChemistry12PracticeChapters() {
  return CHAPTERS.map((c) => ({ name: c.name, total: c.total }));
}

// Sub-topics of a chapter, derived by grouping on topic_id (first-seen order):
//   [{ id: 'c12-<chapterId>-<topicId>', name, questionCount }]
export function getChemistry12PracticeSubtopics(chapterName) {
  const ch = byName(chapterName);
  if (!ch) return [];
  const order = [];
  const map = new Map();
  ch.questions.forEach((q) => {
    const key = q.topicId;
    if (!map.has(key)) {
      map.set(key, { id: `c12-${ch.id}-${key}`, name: q.topic || 'Practice', questionCount: 0 });
      order.push(key);
    }
    map.get(key).questionCount += 1;
  });
  return order.map((k) => map.get(k));
}

// True for local practice ids produced above.
export function isLocalChem12PracticeId(id) {
  return typeof id === 'string' && id.startsWith('c12-');
}

// Resolve a local id to its test. 'c12-<chapterId>-<topicId>' -> that subtopic;
// 'c12-<chapterId>' -> the whole chapter. Returns { subtopic:{id,name}, questions }
// or null.
export function getChemistry12PracticeTest(id) {
  if (!isLocalChem12PracticeId(id)) return null;
  const sub = id.match(/^c12-(\d+)-(\d+)$/);
  if (sub) {
    const chapterId = Number(sub[1]);
    const topicId = Number(sub[2]);
    const ch = CHAPTERS.find((c) => c.id === chapterId);
    if (!ch) return null;
    const questions = ch.questions.filter((q) => Number(q.topicId) === topicId);
    const name = (questions[0] && questions[0].topic) || ch.name;
    return { subtopic: { id, name }, questions };
  }
  const chOnly = id.match(/^c12-(\d+)$/);
  if (chOnly) {
    const ch = CHAPTERS.find((c) => c.id === Number(chOnly[1]));
    if (!ch) return null;
    return { subtopic: { id, name: ch.name }, questions: ch.questions };
  }
  return null;
}

export default CHAPTERS;
