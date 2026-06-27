// chemistry12Ncert1.js
// Class 12 Chemistry — NCERT Solutions Part-I (Examples, In-Text and Chapter-end
// questions + solutions). Loads the per-chapter raw JSON in ./chemistry12Ncert1/
// and returns, per chapter, a FULL self-contained MathJax HTML document for a
// WebView — built with the same shared helpers (buildFragmentFromQuestions +
// buildPyqDocument) the Class-12 Physics DB path uses, so it renders identically.
//
// Chapter keys match ResourcesScreen's Class-12 Chemistry chaptersByClass exactly.

import { buildFragmentFromQuestions, buildPyqDocument } from '../utils/pyqDocument';

import ch01 from './chemistry12Ncert1/01 Chemical Kinetics.json';
import ch02 from './chemistry12Ncert1/02 Coordination Compounds.json';
import ch03 from './chemistry12Ncert1/03 Electrochemistry.json';
import ch04 from './chemistry12Ncert1/04 Solutions.json';
import ch05 from './chemistry12Ncert1/05 The d- and f- Block Elements.json';

const RAW_CHAPTERS = [ch01, ch02, ch03, ch04, ch05];

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const hasOptions = (q) =>
  Array.isArray(q.options) &&
  q.options.some((o) => (o.html && o.html.trim()) || (o.text && o.text.trim()));

// Map a raw NCERT question (q_no/question_html/options/solution_html) onto the
// shape buildFragmentFromQuestions expects ({ qNumber, questionHtml, isMcq,
// options:[{idx,html,is_correct}], solutionHtml }). The exercise label (Examples /
// In Text / Chapter-end) rides along in the question number for context.
const toCardQuestion = (q, i) => {
  const ex = (q.exercise || '').trim();
  const no = q.q_no || String(i + 1);
  const isMcq = hasOptions(q);
  return {
    qNumber: ex ? `${ex} · Q${no}` : `Q${no}`,
    questionHtml: q.question_html || q.question_text || '',
    isMcq,
    options: isMcq
      ? q.options.map((o, j) => ({
          idx: LETTERS[j] || String(j + 1),
          html: o.html || (o.text ? `<p>${o.text}</p>` : ''),
          is_correct: !!o.is_correct,
        }))
      : [],
    solutionHtml:
      (q.solution_html && q.solution_html.trim()) ||
      (q.numeric_solution_html && q.numeric_solution_html.trim()) ||
      (q.solution_text && q.solution_text.trim()) ||
      '',
  };
};

const chapterToDoc = (questions) =>
  buildPyqDocument(buildFragmentFromQuestions(questions.map(toCardQuestion)));

// Build the { chapterName: htmlDoc } map, keyed by each file's `chapter` field.
const CHEMISTRY12_NCERT1 = {};
RAW_CHAPTERS.forEach((questions) => {
  if (Array.isArray(questions) && questions.length > 0 && questions[0].chapter) {
    CHEMISTRY12_NCERT1[String(questions[0].chapter).trim()] = chapterToDoc(questions);
  }
});

// Returns a full HTML document for a Class 12 Chemistry chapter's NCERT Part-I
// solutions, or null if there's no local data for it.
export function getChemistry12Ncert1Html(chapter) {
  return CHEMISTRY12_NCERT1[chapter] || null;
}

export function getChemistry12Ncert1Chapters() {
  return Object.keys(CHEMISTRY12_NCERT1);
}

export default CHEMISTRY12_NCERT1;
