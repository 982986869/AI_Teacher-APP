// mathsBank.js
// Loads the maths chapter JSON files and normalizes each question into:
//   { id, text, difficulty, options: [{ key, label, optionId }], correctAnswer, explanation }
// Same approach as chemistryBank.js / questionBank.js.
// correctAnswer is null until answers are fetched (then it auto-resolves).

import c1372 from './maths_questions/1372_Sets.json';
import c1373 from './maths_questions/1373_Relations_and_Functions.json';
import c1374 from './maths_questions/1374_Trigonometric_Functions.json';
import c1375 from './maths_questions/1375_Principle_of_Mathematical_Induction_Deleted.json';
import c1376 from './maths_questions/1376_Complex_Numbers_and_Quadratic_Equations.json';
import c1377 from './maths_questions/1377_Linear_Inequalities.json';
import c1378 from './maths_questions/1378_Permutations_and_Combinations.json';
import c1379 from './maths_questions/1379_Binomial_Theorem.json';
import c1380 from './maths_questions/1380_Sequences_and_Series.json';
import c1381 from './maths_questions/1381_Straight_Lines.json';
import c1382 from './maths_questions/1382_Conic_Sections.json';
import c1383 from './maths_questions/1383_Introduction_to_3D_Geometry.json';
import c1384 from './maths_questions/1384_Limits_and_Derivatives.json';
import c1386 from './maths_questions/1386_Statistics.json';
import c1387 from './maths_questions/1387_Probability.json';

const rawChapters = [
  c1372, c1373, c1374, c1375, c1376, c1377, c1378, c1379,
  c1380, c1381, c1382, c1383, c1384, c1386, c1387,
];

const LETTERS = 'ABCDEFGHIJ'.split('');

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;|&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&deg;/g, '\u00B0').replace(/&minus;/g, '\u2212').replace(/&times;/g, '\u00D7')
    .replace(/&divide;/g, '\u00F7').replace(/&plusmn;/g, '\u00B1').replace(/&rarr;/g, '\u2192')
    .replace(/&hellip;/g, '\u2026').replace(/&infin;/g, '\u221E').replace(/&deg;/g, '\u00B0')
    .replace(/&alpha;/g, '\u03B1').replace(/&beta;/g, '\u03B2').replace(/&gamma;/g, '\u03B3')
    .replace(/&theta;/g, '\u03B8').replace(/&pi;/g, '\u03C0').replace(/&lambda;/g, '\u03BB')
    .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)));
}

const GREEK = {
  varepsilon: '\u03B5', epsilon: '\u03B5', mu: '\u03BC', pi: '\u03C0', theta: '\u03B8',
  alpha: '\u03B1', beta: '\u03B2', gamma: '\u03B3', delta: '\u03B4', lambda: '\u03BB',
  omega: '\u03C9', rho: '\u03C1', sigma: '\u03C3', phi: '\u03C6', Delta: '\u0394', Omega: '\u03A9', Sigma: '\u03A3',
};

const BRACE = '\\{((?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*)\\}';

function latexToText(tex) {
  let s = tex.replace(/\\(varepsilon|epsilon|mu|pi|theta|alpha|beta|gamma|delta|lambda|omega|rho|sigma|phi|Delta|Omega|Sigma)/g, (m, g) => GREEK[g] || m);
  s = s.replace(/\\times/g, '\u00D7').replace(/\\cdot/g, '\u00B7').replace(/\\pm/g, '\u00B1')
       .replace(/\\div/g, '\u00F7').replace(/\\infty/g, '\u221E').replace(/\\rightarrow|\\to/g, '\u2192')
       .replace(/\\leq/g, '\u2264').replace(/\\geq/g, '\u2265').replace(/\\neq/g, '\u2260')
       .replace(/\\in/g, '\u2208').replace(/\\cup/g, '\u222A').replace(/\\cap/g, '\u2229')
       .replace(/\\subset/g, '\u2282').replace(/\\left|\\right/g, '');
  for (let p = 0; p < 4; p++) {
    s = s.replace(new RegExp('\\\\frac\\s*' + BRACE + '\\s*' + BRACE, 'g'), '($1)/($2)');
    s = s.replace(new RegExp('\\\\sqrt\\s*' + BRACE, 'g'), '\u221A($1)');
    s = s.replace(new RegExp('\\^' + BRACE, 'g'), '^($1)');
    s = s.replace(new RegExp('_' + BRACE, 'g'), '_($1)');
  }
  return s.replace(/\\,|\\;|\\!|\\ /g, ' ').replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '');
}

function htmlToText(html) {
  if (html == null) return '';
  let s = String(html)
    .replace(/\{tex\}([\s\S]*?)\{\/tex\}/g, (m, t) => latexToText(t))
    .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/g, '^($1)')
    .replace(/<sub[^>]*>([\s\S]*?)<\/sub>/g, '_($1)')
    .replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '');
  return decodeEntities(s).replace(/\s+/g, ' ').trim();
}

function normalizeQuestion(q) {
  const options = (q.options || []).map((o, i) => ({
    key: LETTERS[i],
    label: htmlToText(o.option ?? o.text ?? ''),
    optionId: o.id ?? null,
  }));
  let correctAnswer = null;
  if (q.correct_option_id != null) {
    const idx = options.findIndex((o) => String(o.optionId) === String(q.correct_option_id));
    if (idx >= 0) correctAnswer = LETTERS[idx];
  }
  return {
    id: q.id,
    text: htmlToText(q.question ?? q.text ?? ''),
    difficulty: q.difficulty_label ?? q.difficulty ?? null,
    options,
    correctAnswer,
    explanation: htmlToText(q.explanation ?? ''),
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