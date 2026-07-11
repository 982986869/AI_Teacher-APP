// chemistryBank.js
// Loads the chemistry chapter JSON files and normalizes each question into:
//   { id, text, difficulty, options: [{ key, label, optionId }], correctAnswer }
// Same approach as questionBank.js. Answers (correctAnswer) are null until fetched.

import c1357 from './chemistry_questions/1357_Some_Basic_Concepts_of_Chemistry.json';
import c1358 from './chemistry_questions/1358_Structure_of_Atom.json';
import c1359 from './chemistry_questions/1359_Classification_of_Elements_and_Periodicity_in_Properties.json';
import c1360 from './chemistry_questions/1360_Chemical_Bonding_and_Molecular_Structure.json';
import c1361 from './chemistry_questions/1361_States_of_Matter_Gases_and_Liquids_FA_ONLY.json';
import c1362 from './chemistry_questions/1362_Chemical_Thermodynamics.json';
import c1363 from './chemistry_questions/1363_Equilibrium.json';
import c1364 from './chemistry_questions/1364_Redox_Reactions.json';
import c1366 from './chemistry_questions/1366_The_s_Block_Elements_FA_ONLY.json';
import c1367 from './chemistry_questions/1367_Some_p_Block_Elements_FA_ONLY.json';
import c1368 from './chemistry_questions/1368_Organic_Chemistry_Some_Basic_Principles_and_Techniques.json';
import c1369 from './chemistry_questions/1369_Hydrocarbons.json';
// Fetched answers, keyed by question id: { id: { correctAnswer, correctOptionId, explanation } }
import answerKey from './chemistry_questions/answer_key_chemistry.json';

const rawChapters = [
  c1357, c1358, c1359, c1360, c1361, c1362,
  c1363, c1364, c1366, c1367, c1368, c1369,
];

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

// The chemistry JSON files use a different schema than physics/biology
// (`id`/`name` instead of `chapter_id`/`chapter_name`), so accept either —
// otherwise chapter id/name resolve to undefined and the chapter lookup
// (getQuestions) returns nothing. Count stays the actually-bundled question
// count (not `total_questions`, which is the larger full upstream bank size).
export const chapters = rawChapters.map((c) => ({
  chapter_id: c.chapter_id ?? c.id,
  chapter_name: c.chapter_name ?? c.name,
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