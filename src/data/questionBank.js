// questionBank.js
// Loads the chapter JSON files and normalizes each question into the shape the
// screens expect: { id, text, difficulty, options: [{ key, label, optionId }] }.
// It also converts the HTML + LaTeX in the scraped data into readable text.

// Chapter metadata — lightweight. Each chapter's JSON is loaded LAZILY (only when
// that chapter is actually opened) via a static require() string, so the app does
// not parse the whole multi-MB question bank into memory at startup.
const META = [
  { id: 1342, name: "Units and Measurements", count: 564, load: () => require("./physics_questions/1342_Units_and_Measurements.json") },
  { id: 1343, name: "Motion in A Straight Line", count: 380, load: () => require("./physics_questions/1343_Motion_in_A_Straight_Line.json") },
  { id: 1344, name: "Motion in A Plane", count: 703, load: () => require("./physics_questions/1344_Motion_in_A_Plane.json") },
  { id: 1345, name: "Laws of Motion", count: 606, load: () => require("./physics_questions/1345_Laws_of_Motion.json") },
  { id: 1346, name: "Work Energy and Power", count: 514, load: () => require("./physics_questions/1346_Work_Energy_and_Power.json") },
  { id: 1347, name: "System of Particles and Rotational Motion", count: 667, load: () => require("./physics_questions/1347_System_of_Particles_and_Rotational_Motion.json") },
  { id: 1348, name: "Gravitation", count: 808, load: () => require("./physics_questions/1348_Gravitation.json") },
  { id: 1349, name: "Mechanical Properties of Solids", count: 232, load: () => require("./physics_questions/1349_Mechanical_Properties_of_Solids.json") },
  { id: 1350, name: "Mechanical Properties of Fluids", count: 624, load: () => require("./physics_questions/1350_Mechanical_Properties_of_Fluids.json") },
  { id: 1351, name: "Thermal Properties of Matter", count: 720, load: () => require("./physics_questions/1351_Thermal_Properties_of_Matter.json") },
  { id: 1352, name: "Thermodynamics", count: 599, load: () => require("./physics_questions/1352_Thermodynamics.json") },
  { id: 1353, name: "Kinetic Theory", count: 426, load: () => require("./physics_questions/1353_Kinetic_Theory.json") },
  { id: 1354, name: "Oscillations", count: 644, load: () => require("./physics_questions/1354_Oscillations.json") },
  { id: 4529, name: "Waves", count: 527, load: () => require("./physics_questions/4529_Waves.json") },
];

// Fetched answers, keyed by question id. Loaded lazily + cached on first use.
let _answerKey = null;
function getAnswerKey() {
  if (_answerKey) return _answerKey;
  try { _answerKey = require('./physics_questions/answer_key.json'); }
  catch (e) { _answerKey = {}; }
  return _answerKey;
}

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