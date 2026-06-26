// physics12OnlineTests.js
// Class 12 Physics — Online Tests bank (14 chapters, one 15-question test each).
// Mirrors questionBank.js (the Class 11 Physics bank) so OnlineTestsScreen /
// TestQuestionScreen can consume it the same way: it exposes `chapterList`
// ([{ id, name, count }]) and `getQuestions(chapterId)` returning normalized
// questions ({ id, text, difficulty, options:[{key,label,optionId}],
// correctAnswer, explanation }). Raw scraped HTML + {tex} math is flattened to
// readable text via questionBank's htmlToText (TestQuestionScreen renders plain
// <Text>, not MathJax).

import { htmlToText } from './questionBank';

import c1252 from './physics12OnlineTests/01 Electric Charges and Fields.json';
import c1253 from './physics12OnlineTests/02 Electrostatic Potential and Capacitance.json';
import c1254 from './physics12OnlineTests/03 Current Electricity.json';
import c1255 from './physics12OnlineTests/04 Moving Charges and Magnetism.json';
import c1256 from './physics12OnlineTests/05 Magnetism and Matter.json';
import c1257 from './physics12OnlineTests/06 Electromagnetic Induction.json';
import c1258 from './physics12OnlineTests/07 Alternating Current.json';
import c1259 from './physics12OnlineTests/08 Electromagnetic Waves.json';
import c1260 from './physics12OnlineTests/09 Ray Optics and Optical Instruments.json';
import c1261 from './physics12OnlineTests/10 Wave Optics.json';
import c1262 from './physics12OnlineTests/11 Dual Nature of Radiation and Matter.json';
import c1263 from './physics12OnlineTests/12 Atoms.json';
import c1264 from './physics12OnlineTests/13 Nuclei.json';
import c1265 from './physics12OnlineTests/14 Electronic Devices.json';

const RAW_CHAPTERS = [
  c1252, c1253, c1254, c1255, c1256, c1257, c1258,
  c1259, c1260, c1261, c1262, c1263, c1264, c1265,
];

const LETTERS = 'ABCDEFGHIJ'.split('');

// One raw scraped question -> the normalized shape TestQuestionScreen expects.
function normalizeQuestion(q) {
  const opts = Array.isArray(q.options) ? q.options : [];
  const options = opts.map((o, i) => ({
    key: LETTERS[i],
    label: htmlToText(o.html || o.text || ''),
    optionId: o.id ?? null,
  }));
  // Correct option letter: prefer is_correct, fall back to correct_option_ids.
  let idx = opts.findIndex((o) => o.is_correct);
  if (idx < 0 && Array.isArray(q.correct_option_ids) && q.correct_option_ids.length) {
    idx = opts.findIndex((o) => q.correct_option_ids.includes(o.id));
  }
  return {
    id: q.question_id != null ? q.question_id : q.n,
    text: htmlToText(q.question_html || q.question_text || ''),
    difficulty: null,
    options,
    correctAnswer: idx >= 0 ? LETTERS[idx] : null,
    explanation: htmlToText(q.explanation || q.solution || ''),
  };
}

// Flatten every test's questions into a single per-chapter list (each file ships
// one 15-question test; OnlineTestsScreen re-splits a chapter into 5 sub-tests).
const chapters = RAW_CHAPTERS
  .filter((c) => c && Array.isArray(c.tests))
  .map((c) => {
    const questions = c.tests.flatMap((t) => (t.questions || []).map(normalizeQuestion));
    return { chapter_id: c.chapter_id, chapter_name: c.chapter, count: questions.length, questions };
  });

export function getChapter(chapterId) {
  return chapters.find((c) => c.chapter_id === Number(chapterId)) || null;
}

export function getQuestions(chapterId) {
  const ch = getChapter(chapterId);
  return ch ? ch.questions : [];
}

export const chapterList = chapters.map((c) => ({
  id: c.chapter_id,
  name: c.chapter_name,
  count: c.count,
}));
