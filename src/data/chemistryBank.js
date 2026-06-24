// chemistryBank.js
// Loads the chemistry chapter JSON files and normalizes each question into:
//   { id, text, difficulty, options: [{ key, label, optionId }], correctAnswer }
// Same approach as questionBank.js. Answers (correctAnswer) are null until fetched.

// Chapter metadata — lightweight. Each chapter's JSON is loaded LAZILY (only when
// that chapter is actually opened) via a static require() string, so the app does
// not parse the whole multi-MB question bank into memory at startup.
const META = [
  { id: 1357, name: "Some Basic Concepts of Chemistry", count: 735, load: () => require("./chemistry_questions/1357_Some_Basic_Concepts_of_Chemistry.json") },
  { id: 1358, name: "Structure of Atom", count: 809, load: () => require("./chemistry_questions/1358_Structure_of_Atom.json") },
  { id: 1359, name: "Classification of Elements and Periodicity in Properties", count: 899, load: () => require("./chemistry_questions/1359_Classification_of_Elements_and_Periodicity_in_Properties.json") },
  { id: 1360, name: "Chemical Bonding and Molecular Structure", count: 1690, load: () => require("./chemistry_questions/1360_Chemical_Bonding_and_Molecular_Structure.json") },
  { id: 1361, name: "States of Matter - Gases and Liquids (FA ONLY)", count: 690, load: () => require("./chemistry_questions/1361_States_of_Matter_Gases_and_Liquids_FA_ONLY.json") },
  { id: 1362, name: "Chemical Thermodynamics", count: 664, load: () => require("./chemistry_questions/1362_Chemical_Thermodynamics.json") },
  { id: 1363, name: "Equilibrium", count: 1200, load: () => require("./chemistry_questions/1363_Equilibrium.json") },
  { id: 1364, name: "Redox Reactions", count: 564, load: () => require("./chemistry_questions/1364_Redox_Reactions.json") },
  { id: 1366, name: "The s-Block Elements (FA ONLY)", count: 565, load: () => require("./chemistry_questions/1366_The_s_Block_Elements_FA_ONLY.json") },
  { id: 1367, name: "Some p-Block Elements (FA ONLY)", count: 570, load: () => require("./chemistry_questions/1367_Some_p_Block_Elements_FA_ONLY.json") },
  { id: 1368, name: "Organic Chemistry Some Basic Principles and Techniques", count: 1255, load: () => require("./chemistry_questions/1368_Organic_Chemistry_Some_Basic_Principles_and_Techniques.json") },
  { id: 1369, name: "Hydrocarbons", count: 1805, load: () => require("./chemistry_questions/1369_Hydrocarbons.json") },
];

// Fetched answers, keyed by question id. Loaded lazily + cached on first use.
let _answerKey = null;
function getAnswerKey() {
  if (_answerKey) return _answerKey;
  try { _answerKey = require('./chemistry_questions/answer_key_chemistry.json'); }
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
    .replace(/&harr;/g, '\u2194').replace(/&hellip;/g, '\u2026').replace(/&infin;/g, '\u221E')
    .replace(/&alpha;/g, '\u03B1').replace(/&beta;/g, '\u03B2').replace(/&gamma;/g, '\u03B3')
    .replace(/&delta;/g, '\u03B4').replace(/&pi;/g, '\u03C0').replace(/&mu;/g, '\u03BC')
    .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)));
}

const GREEK = {
  varepsilon: '\u03B5', epsilon: '\u03B5', mu: '\u03BC', pi: '\u03C0', theta: '\u03B8',
  alpha: '\u03B1', beta: '\u03B2', gamma: '\u03B3', delta: '\u03B4', lambda: '\u03BB',
  omega: '\u03C9', rho: '\u03C1', sigma: '\u03C3', phi: '\u03C6', Delta: '\u0394', Omega: '\u03A9',
};

const BRACE = '\\{((?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*)\\}';

function latexToText(tex) {
  let s = tex;
  s = s.replace(/\\(varepsilon|epsilon|mu|pi|theta|alpha|beta|gamma|delta|lambda|omega|rho|sigma|phi|Delta|Omega)/g, (m, g) => GREEK[g] || m);
  s = s.replace(/\\times/g, '\u00D7').replace(/\\cdot/g, '\u00B7').replace(/\\pm/g, '\u00B1')
       .replace(/\\rightleftharpoons|\\leftrightarrow/g, '\u21CC').replace(/\\rightarrow|\\to/g, '\u2192')
       .replace(/\\leftarrow/g, '\u2190').replace(/\\Delta/g, '\u0394').replace(/\\circ/g, '\u00B0')
       .replace(/\\left|\\right/g, '');
  for (let p = 0; p < 4; p++) {
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
  s = s.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  return s.replace(/\s+/g, ' ').trim();
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