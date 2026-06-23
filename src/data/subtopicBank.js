// subtopicBank.js
// Loads the <chapter>.by_topic.json files (produced by fetch-by-subtopic.js) for
// BOTH chemistry and maths, and exposes chapters -> sub-topics -> questions.
//
// Each question is normalized to: { id, text, difficulty, topicId, topicName,
//   options: [{ key, label, optionId }], correctAnswer, explanation }
//
// IMPORTANT: these .by_topic.json files only exist AFTER you run fetch-by-subtopic.js
// in each subject's folder. Comment out a subject's imports until its files exist,
// or the app will fail to resolve them.

// ---------------- CHEMISTRY (12 chapters) ----------------
import chem1357 from './chemistry_questions/1357_Some_Basic_Concepts_of_Chemistry.by_topic.json';
import chem1358 from './chemistry_questions/1358_Structure_of_Atom.by_topic.json';
import chem1359 from './chemistry_questions/1359_Classification_of_Elements_and_Periodicity_in_Properties.by_topic.json';
import chem1360 from './chemistry_questions/1360_Chemical_Bonding_and_Molecular_Structure.by_topic.json';
import chem1361 from './chemistry_questions/1361_States_of_Matter_Gases_and_Liquids_FA_ONLY.by_topic.json';
import chem1362 from './chemistry_questions/1362_Chemical_Thermodynamics.by_topic.json';
import chem1363 from './chemistry_questions/1363_Equilibrium.by_topic.json';
import chem1364 from './chemistry_questions/1364_Redox_Reactions.by_topic.json';
import chem1366 from './chemistry_questions/1366_The_s_Block_Elements_FA_ONLY.by_topic.json';
import chem1367 from './chemistry_questions/1367_Some_p_Block_Elements_FA_ONLY.by_topic.json';
import chem1368 from './chemistry_questions/1368_Organic_Chemistry_Some_Basic_Principles_and_Techniques.by_topic.json';
import chem1369 from './chemistry_questions/1369_Hydrocarbons.by_topic.json';

// ---------------- MATHS (15 chapters) ----------------
// DISABLED: the maths export has no sub-topic grouping and the live paginate
// endpoint returns wrong content for maths topic ids, so per-sub-topic maths
// by_topic.json files can't be produced. Re-enable once real grouped data exists.

const SUBJECTS = [
  { subject: 'Chemistry', chapters: [chem1357, chem1358, chem1359, chem1360, chem1361, chem1362, chem1363, chem1364, chem1366, chem1367, chem1368, chem1369] },
];

const LETTERS = 'ABCDEFGHIJ'.split('');

// --- HTML/LaTeX -> readable text ---
function decodeEntities(s) {
  return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;|&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&deg;/g, '\u00B0').replace(/&times;/g, '\u00D7').replace(/&divide;/g, '\u00F7')
    .replace(/&rarr;/g, '\u2192').replace(/&harr;/g, '\u2194').replace(/&infin;/g, '\u221E')
    .replace(/&pi;/g, '\u03C0').replace(/&theta;/g, '\u03B8').replace(/&alpha;/g, '\u03B1')
    .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)));
}
const BRACE = '\\{((?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*)\\}';
function latexToText(tex) {
  let s = tex
    .replace(/\\rightleftharpoons|\\leftrightarrow/g, '\u21CC').replace(/\\rightarrow|\\to/g, '\u2192')
    .replace(/\\times/g, '\u00D7').replace(/\\div/g, '\u00F7').replace(/\\pm/g, '\u00B1')
    .replace(/\\leq/g, '\u2264').replace(/\\geq/g, '\u2265').replace(/\\neq/g, '\u2260')
    .replace(/\\in/g, '\u2208').replace(/\\cup/g, '\u222A').replace(/\\cap/g, '\u2229')
    .replace(/\\subset/g, '\u2282').replace(/\\infty/g, '\u221E').replace(/\\Delta/g, '\u0394')
    .replace(/\\pi/g, '\u03C0').replace(/\\theta/g, '\u03B8').replace(/\\left|\\right/g, '');
  for (let p = 0; p < 4; p++) {
    s = s.replace(new RegExp('\\\\frac\\s*' + BRACE + '\\s*' + BRACE, 'g'), '($1)/($2)');
    s = s.replace(new RegExp('\\\\sqrt\\s*' + BRACE, 'g'), '\u221A($1)');
    s = s.replace(new RegExp('\\^' + BRACE, 'g'), '^($1)');
    s = s.replace(new RegExp('_' + BRACE, 'g'), '_($1)');
  }
  return s.replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '');
}
function clean(html) {
  if (html == null) return '';
  let s = String(html)
    .replace(/\{tex\}([\s\S]*?)\{\/tex\}/g, (m, t) => latexToText(t))
    .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/g, '^($1)')
    .replace(/<sub[^>]*>([\s\S]*?)<\/sub>/g, '_($1)')
    .replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '');
  return decodeEntities(s).replace(/\s+/g, ' ').trim();
}

function normQ(q) {
  const options = (q.options || []).map((o, i) => ({
    key: LETTERS[i], label: clean(o.option ?? o.text ?? ''), optionId: o.id ?? null,
  }));
  return {
    id: q.id, text: clean(q.question ?? q.text ?? ''),
    difficulty: q.difficulty ?? null,
    topicId: q.topicId ?? null, topicName: q.topicName ?? null,
    options,
    correctAnswer: q.correctAnswer ?? null,
    explanation: clean(q.explanation ?? ''),
  };
}

// Build a flat list of chapters, each tagged with its subject.
export const chapters = SUBJECTS.flatMap(({ subject, chapters: list }) =>
  list.map((c) => ({
    subject,
    chapter_id: c.chapter_id,
    chapter_name: c.chapter_name,
    topics: (c.topics || []).map((t) => ({
      topicId: t.topicId,
      topicName: t.topicName,
      count: (t.questions || []).length,
      questions: (t.questions || []).map(normQ),
    })),
  }))
);

export function getChapter(chapterId) {
  return chapters.find((c) => c.chapter_id === Number(chapterId)) || null;
}

export function getSubtopics(chapterId) {
  const ch = getChapter(chapterId);
  return ch ? ch.topics.map((t) => ({ topicId: t.topicId, topicName: t.topicName, count: t.count })) : [];
}

export function getSubtopicQuestions(chapterId, topicId) {
  const ch = getChapter(chapterId);
  if (!ch) return [];
  const t = ch.topics.find((x) => String(x.topicId) === String(topicId));
  return t ? t.questions : [];
}

// Questions for one sub-topic, matched by chapter NAME + sub-topic NAME and
// shaped for McqTestScreen ({ cat, question, options: string[], correct }).
// Returns [] when that sub-topic has no data (caller falls back to chapter MCQs).
const LET = 'ABCDEFGHIJ';
export function getSubtopicTest(chapterName, subtopicName) {
  const ch = chapters.find((c) => c.chapter_name === chapterName);
  if (!ch) return [];
  const t = ch.topics.find((x) => x.topicName === subtopicName);
  if (!t) return [];
  return t.questions
    .map((q) => ({
      cat: q.topicName || 'MCQ',
      question: q.raw || q.text,
      options: q.options.map((o) => o.label),
      correct: q.correctAnswer ? LET.indexOf(q.correctAnswer) : -1,
    }))
    .filter((q) => q.options.length >= 2 && q.correct >= 0);
}

export function getChapterQuestions(chapterId) {
  const ch = getChapter(chapterId);
  return ch ? ch.topics.flatMap((t) => t.questions) : [];
}

// --- subject-level helpers ---
export const subjects = [...new Set(chapters.map((c) => c.subject))];

export function getChaptersBySubject(subject) {
  return chapters
    .filter((c) => c.subject === subject)
    .map((c) => ({
      id: c.chapter_id,
      name: c.chapter_name,
      topicCount: c.topics.length,
      questionCount: c.topics.reduce((n, t) => n + t.count, 0),
    }));
}

export const chapterList = chapters.map((c) => ({
  id: c.chapter_id,
  name: c.chapter_name,
  subject: c.subject,
  topicCount: c.topics.length,
  questionCount: c.topics.reduce((n, t) => n + t.count, 0),
}));