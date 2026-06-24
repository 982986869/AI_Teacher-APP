// questionBank.js
// Loads the chapter JSON files and normalizes each question into the shape the
// screens expect: { id, text, difficulty, options: [{ key, label, optionId }] }.
// It also converts the HTML + LaTeX in the scraped data into readable text.

import c1342 from './physics_questions/1342_Units_and_Measurements.json';
import c1343 from './physics_questions/1343_Motion_in_A_Straight_Line.json';
import c1344 from './physics_questions/1344_Motion_in_A_Plane.json';
import c1345 from './physics_questions/1345_Laws_of_Motion.json';
import c1346 from './physics_questions/1346_Work_Energy_and_Power.json';
import c1347 from './physics_questions/1347_System_of_Particles_and_Rotational_Motion.json';
import c1348 from './physics_questions/1348_Gravitation.json';
import c1349 from './physics_questions/1349_Mechanical_Properties_of_Solids.json';
import c1350 from './physics_questions/1350_Mechanical_Properties_of_Fluids.json';
import c1351 from './physics_questions/1351_Thermal_Properties_of_Matter.json';
import c1352 from './physics_questions/1352_Thermodynamics.json';
import c1353 from './physics_questions/1353_Kinetic_Theory.json';
import c1354 from './physics_questions/1354_Oscillations.json';
import c4529 from './physics_questions/4529_Waves.json';
// Fetched answers, keyed by question id: { id: { correctAnswer, correctOptionId, explanation } }
import answerKey from './physics_questions/answer_key.json';

const rawChapters = [
  c1342, c1343, c1344, c1345, c1346, c1347, c1348,
  c1349, c1350, c1351, c1352, c1353, c1354, c4529,
];

const LETTERS = 'ABCDEFGHIJ'.split('');

// ---- HTML + LaTeX -> readable text -------------------------------------------

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&deg;/g, '\u00B0')
    .replace(/&minus;/g, '\u2212')
    .replace(/&times;/g, '\u00D7')
    .replace(/&divide;/g, '\u00F7')
    .replace(/&plusmn;/g, '\u00B1')
    .replace(/&prime;/g, '\u2032')
    .replace(/&Prime;/g, '\u2033')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&rarr;/g, '\u2192')
    .replace(/&infin;/g, '\u221E')
    .replace(/&alpha;/g, '\u03B1').replace(/&beta;/g, '\u03B2').replace(/&gamma;/g, '\u03B3')
    .replace(/&theta;/g, '\u03B8').replace(/&pi;/g, '\u03C0').replace(/&mu;/g, '\u03BC')
    .replace(/&lambda;/g, '\u03BB').replace(/&omega;/g, '\u03C9').replace(/&Delta;/g, '\u0394')
    .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)));
}

const GREEK = {
  varepsilon: '\u03B5', epsilon: '\u03B5', mu: '\u03BC', pi: '\u03C0', theta: '\u03B8',
  alpha: '\u03B1', beta: '\u03B2', gamma: '\u03B3', delta: '\u03B4', lambda: '\u03BB',
  omega: '\u03C9', rho: '\u03C1', sigma: '\u03C3', phi: '\u03C6', tau: '\u03C4',
  eta: '\u03B7', nu: '\u03BD', Delta: '\u0394', Omega: '\u03A9', Sigma: '\u03A3',
  Phi: '\u03A6', Theta: '\u0398', Lambda: '\u039B',
};

// matches a {...} group with up to two levels of nesting
const BRACE = '\\{((?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*)\\}';

function latexToText(tex) {
  let s = tex;
  s = s.replace(
    /\\(varepsilon|epsilon|mu|pi|theta|alpha|beta|gamma|delta|lambda|omega|rho|sigma|phi|tau|eta|nu|Delta|Omega|Sigma|Phi|Theta|Lambda)/g,
    (m, g) => GREEK[g] || m
  );
  s = s
    .replace(/\\times/g, '\u00D7').replace(/\\cdot/g, '\u00B7').replace(/\\pm/g, '\u00B1')
    .replace(/\\div/g, '\u00F7').replace(/\\infty/g, '\u221E').replace(/\\circ/g, '\u00B0')
    .replace(/\\Rightarrow/g, '\u21D2').replace(/\\rightarrow|\\to/g, '\u2192')
    .replace(/\\approx/g, '\u2248').replace(/\\neq/g, '\u2260')
    .replace(/\\leq/g, '\u2264').replace(/\\geq/g, '\u2265').replace(/\\propto/g, '\u221D')
    .replace(/\\left|\\right/g, '');
  for (let pass = 0; pass < 4; pass++) {
    s = s.replace(new RegExp('\\\\frac\\s*' + BRACE + '\\s*' + BRACE, 'g'), '($1)/($2)');
    s = s.replace(new RegExp('\\\\sqrt\\s*' + BRACE, 'g'), '\u221A($1)');
    s = s.replace(new RegExp('\\^' + BRACE, 'g'), '^($1)');
    s = s.replace(new RegExp('_' + BRACE, 'g'), '_($1)');
  }
  s = s.replace(/\\,|\\;|\\!|\\ /g, ' ').replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '');
  return s;
}

function htmlToText(html) {
  if (html == null) return '';
  let s = String(html);
  s = s.replace(/\{tex\}([\s\S]*?)\{\/tex\}/g, (m, t) => latexToText(t));
  s = s.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/g, '^($1)');
  s = s.replace(/<sub[^>]*>([\s\S]*?)<\/sub>/g, '_($1)');
  s = s.replace(/<br\s*\/?>/g, ' ');
  s = s.replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  return s.replace(/\s+/g, ' ').trim();
}

// ---- normalization -----------------------------------------------------------

function normalizeQuestion(q) {
  const options = (q.options || []).map((o, i) => ({
    key: LETTERS[i],
    label: htmlToText(o.option ?? o.label ?? ''),
    optionId: o.id ?? null,
  }));
  // Answers come from the fetched answer key (chapter files have null answers).
  const ak = answerKey[q.id] || {};
  const correctOptionId = q.correct_option_id ?? ak.correctOptionId ?? null;
  let correctAnswer = null;
  if (correctOptionId != null) {
    const idx = options.findIndex((o) => String(o.optionId) === String(correctOptionId));
    if (idx >= 0) correctAnswer = LETTERS[idx];
  }
  if (!correctAnswer && ak.correctAnswer) correctAnswer = ak.correctAnswer; // letter fallback
  return {
    id: q.id,
    text: htmlToText(q.question ?? q.text ?? ''),
    difficulty: q.difficulty_label ?? q.difficulty ?? null,
    options,
    correctAnswer,
    explanation: htmlToText(q.explanation ?? ak.explanation ?? ''),
  };
}

export const chapters = rawChapters.map((c) => ({
  chapter_id: c.chapter_id,
  chapter_name: c.chapter_name,
  count: c.count ?? (c.questions ? c.questions.length : 0),
  questions: (c.questions || []).map(normalizeQuestion),
}));

export function getChapter(chapterId) {
  return chapters.find((c) => c.chapter_id === Number(chapterId)) || null;
}

export function getQuestions(chapterId) {
  const ch = getChapter(chapterId);
  return ch ? ch.questions : [];
}

export const allQuestions = chapters.flatMap((c) =>
  c.questions.map((q) => ({ ...q, chapterId: c.chapter_id, chapterName: c.chapter_name }))
);

export const chapterList = chapters.map((c) => ({
  id: c.chapter_id,
  name: c.chapter_name,
  count: c.count,
}));