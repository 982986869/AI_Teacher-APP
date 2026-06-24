// mathsBank.js
// Loads the maths chapter JSON files and normalizes each question into:
//   { id, text, difficulty, options: [{ key, label, optionId }], correctAnswer, explanation }
// Same approach as chemistryBank.js / questionBank.js.
// correctAnswer is null until answers are fetched (then it auto-resolves).

// Chapter metadata — lightweight. Each chapter's JSON is loaded LAZILY (only when
// that chapter is actually opened) via a static require() string, so the app does
// not parse the whole multi-MB question bank into memory at startup.
const META = [
  { id: 1372, name: "Sets", count: 125, load: () => require("./maths_questions/1372_Sets.json") },
  { id: 1373, name: "Relations and Functions", count: 335, load: () => require("./maths_questions/1373_Relations_and_Functions.json") },
  { id: 1374, name: "Trigonometric Functions", count: 556, load: () => require("./maths_questions/1374_Trigonometric_Functions.json") },
  { id: 1375, name: "Principle of Mathematical Induction (Deleted)", count: 128, load: () => require("./maths_questions/1375_Principle_of_Mathematical_Induction_Deleted.json") },
  { id: 1376, name: "Complex Numbers and Quadratic Equations", count: 730, load: () => require("./maths_questions/1376_Complex_Numbers_and_Quadratic_Equations.json") },
  { id: 1377, name: "Linear Inequalities", count: 73, load: () => require("./maths_questions/1377_Linear_Inequalities.json") },
  { id: 1378, name: "Permutations and Combinations", count: 436, load: () => require("./maths_questions/1378_Permutations_and_Combinations.json") },
  { id: 1379, name: "Binomial Theorem", count: 380, load: () => require("./maths_questions/1379_Binomial_Theorem.json") },
  { id: 1380, name: "Sequences and Series", count: 263, load: () => require("./maths_questions/1380_Sequences_and_Series.json") },
  { id: 1381, name: "Straight Lines", count: 175, load: () => require("./maths_questions/1381_Straight_Lines.json") },
  { id: 1382, name: "Conic Sections", count: 798, load: () => require("./maths_questions/1382_Conic_Sections.json") },
  { id: 1383, name: "Introduction to 3D Geometry", count: 91, load: () => require("./maths_questions/1383_Introduction_to_3D_Geometry.json") },
  { id: 1384, name: "Limits and Derivatives", count: 174, load: () => require("./maths_questions/1384_Limits_and_Derivatives.json") },
  { id: 1386, name: "Statistics", count: 269, load: () => require("./maths_questions/1386_Statistics.json") },
  { id: 1387, name: "Probability", count: 272, load: () => require("./maths_questions/1387_Probability.json") },
];

// Fetched answers, keyed by question id. Loaded lazily + cached on first use.
let _answerKey = null;
function getAnswerKey() {
  if (_answerKey) return _answerKey;
  try { _answerKey = require('./maths_questions/answer_key_maths.json'); }
  catch (e) { _answerKey = {}; }
  return _answerKey;
}

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
  // Answers come from the fetched answer key (chapter files have null answers).
  const ak = getAnswerKey()[q.id] || {};
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

// Cheap, synchronous list for the chapter pickers (no JSON parsed).
export const chapterList = META.map((m) => ({ id: m.id, name: m.name, count: m.count }));

// Lazily build + cache a chapter's normalized questions on first access.
const _chapterCache = {};
function buildChapter(meta) {
  if (_chapterCache[meta.id]) return _chapterCache[meta.id];
  const raw = meta.load() || {};
  const ch = {
    chapter_id: meta.id,
    chapter_name: meta.name,
    count: meta.count ?? (raw.questions ? raw.questions.length : 0),
    questions: (raw.questions || []).map(normalizeQuestion),
  };
  _chapterCache[meta.id] = ch;
  return ch;
}

export function getChapter(chapterId) {
  const meta = META.find((m) => m.id === Number(chapterId));
  return meta ? buildChapter(meta) : null;
}

export function getQuestions(chapterId) {
  const ch = getChapter(chapterId);
  return ch ? ch.questions : [];
}

// All questions across every chapter — lazy (parses all chapters on call). Nothing
// imports this at startup; kept for compatibility.
export function getAllQuestions() {
  return META.flatMap((m) => {
    const ch = buildChapter(m);
    return ch.questions.map((q) => ({ ...q, chapterId: ch.chapter_id, chapterName: ch.chapter_name }));
  });
}