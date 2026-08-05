// physics12Practice.js
// Class 12 Physics — "Practice Questions" (MCQ Practice) local bank. 14 chapters,
// each merged from its topic files; subtopics are derived by grouping questions on
// topic_id. Powers the McqPracticeScreen → McqLoader → McqQuizScreen flow for
// Class 12 Physics, overriding the DB-backed mcqPracticeApi (same local-first
// approach as the Online Tests / Mock Test banks).
//
// Question shape returned matches what McqQuizScreen expects:
//   { id, text, options:[{key,label,optionId}], correctOptionId, correctAnswer,
//     explanation, difficulty }
// NOTE: this source has no answer key (correct_option_id is null), so questions
// are presented for practice without correct/incorrect scoring.

import ch01 from './physics12Practice/01 Electric Charges and Fields.json';
import ch02 from './physics12Practice/02 Electrostatic Potential and Capacitance.json';
import ch03 from './physics12Practice/03 Current Electricity.json';
import ch04 from './physics12Practice/04 Moving Charges and Magnetism.json';
import ch05 from './physics12Practice/05 Magnetism and Matter.json';
import ch06 from './physics12Practice/06 Electromagnetic Induction.json';
import ch07 from './physics12Practice/07 Alternating Current.json';
import ch08 from './physics12Practice/08 Electromagnetic Waves.json';
import ch09 from './physics12Practice/09 Ray Optics and Optical Instruments.json';
import ch10 from './physics12Practice/10 Wave Optics.json';
import ch11 from './physics12Practice/11 Dual Nature of Radiation and Matter.json';
import ch12 from './physics12Practice/12 Atoms.json';
import ch13 from './physics12Practice/13 Nuclei.json';
import ch14 from './physics12Practice/14 Electronic Devices.json';

// Fetched answer key (examin8), keyed by question_id:
//   { "<id>": { correctAnswer, correctOptionId, explanation } }
// Populated by scripts/fetchPhysics12Answers.js; empty {} until then.
import ANSWER_KEY from './physics12Practice/answer_key.json';

const RAW_CHAPTERS = [
  ch01, ch02, ch03, ch04, ch05, ch06, ch07,
  ch08, ch09, ch10, ch11, ch12, ch13, ch14,
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
export function getPhysics12PracticeChapters() {
  return CHAPTERS.map((c) => ({ name: c.name, total: c.total }));
}

// Sub-topics of a chapter, derived by grouping on topic_id (first-seen order):
//   [{ id: 'p12-<chapterId>-<topicId>', name, questionCount }]
export function getPhysics12PracticeSubtopics(chapterName) {
  const ch = byName(chapterName);
  if (!ch) return [];
  const order = [];
  const map = new Map();
  ch.questions.forEach((q) => {
    const key = q.topicId;
    if (!map.has(key)) {
      map.set(key, { id: `p12-${ch.id}-${key}`, name: q.topic || 'Practice', questionCount: 0 });
      order.push(key);
    }
    map.get(key).questionCount += 1;
  });
  return order.map((k) => map.get(k));
}

// True for local practice ids produced above.
export function isLocalPracticeId(id) {
  return typeof id === 'string' && id.startsWith('p12-');
}

// Resolve a local id to its test. 'p12-<chapterId>-<topicId>' -> that subtopic;
// 'p12-<chapterId>' -> the whole chapter. Returns { subtopic:{id,name}, questions }
// or null.
export function getPhysics12PracticeTest(id) {
  if (!isLocalPracticeId(id)) return null;
  const sub = id.match(/^p12-(\d+)-(\d+)$/);
  if (sub) {
    const chapterId = Number(sub[1]);
    const topicId = Number(sub[2]);
    const ch = CHAPTERS.find((c) => c.id === chapterId);
    if (!ch) return null;
    const questions = ch.questions.filter((q) => Number(q.topicId) === topicId);
    const name = (questions[0] && questions[0].topic) || ch.name;
    return { subtopic: { id, name }, questions };
  }
  const chOnly = id.match(/^p12-(\d+)$/);
  if (chOnly) {
    const ch = CHAPTERS.find((c) => c.id === Number(chOnly[1]));
    if (!ch) return null;
    return { subtopic: { id, name: ch.name }, questions: ch.questions };
  }
  return null;
}

export default CHAPTERS;
