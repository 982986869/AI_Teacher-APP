// chemistry12Pyq.js
// Class 12 Chemistry — Previous Year Questions (PYQ). 2695 questions across 10
// chapters (mix of MCQ + subjective). Default-exports a { chapterName: cardsHtml }
// map, the same shape and pastel template as chemistry12Important.js. The cards
// are built at runtime from the per-chapter JSON in ./chemistry12Pyq/*.json so
// the raw question data stays the source of truth.
//
// Unlike Class 12 Physics (whose PYQ are served from the DB/API), Class 12
// Chemistry ships these locally — the same self-contained approach used for Class
// 12 Chemistry Important Questions / Last Year Papers. PracticeScreen renders the
// HTML via PyqWebView's `html` prop (no API call).
//
// Each question carries a `years` array (exam years it appeared in) which is
// rendered as the card's tag (e.g. "2025, 2023"). Math stays as {tex}...{/tex}
// (MathJax renders it via PracticeScreen's buildPyqDocument). Images keep their
// original remote src.
//
// Each chapter's display name comes from its `chapter` field (not the filename),
// so files use plain ASCII names (ch01..ch10) — Metro on Windows fails to resolve
// import paths containing spaces. The order below is NCERT chapter order.

import ch01 from './chemistry12Pyq/ch01.json'; // Solutions
import ch02 from './chemistry12Pyq/ch02.json'; // Electrochemistry
import ch03 from './chemistry12Pyq/ch03.json'; // Chemical Kinetics
import ch04 from './chemistry12Pyq/ch04.json'; // The d- and f- Block Elements
import ch05 from './chemistry12Pyq/ch05.json'; // Coordination Compounds
import ch06 from './chemistry12Pyq/ch06.json'; // Haloalkanes and Haloarenes
import ch07 from './chemistry12Pyq/ch07.json'; // Alcohols Phenols and Ethers
import ch08 from './chemistry12Pyq/ch08.json'; // Aldehydes Ketones and Carboxylic Acids
import ch09 from './chemistry12Pyq/ch09.json'; // Amines
import ch10 from './chemistry12Pyq/ch10.json'; // Biomolecules

const RAW_CHAPTERS = [
  ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10,
];

// Same pastel template as chemistry12Important.js so Important and PYQ look
// identical. pqReport posts a {type:'report_error'} message to the host app.
const PQ_PASTEL_HEAD = `
<style>
  .pq-wrap{ font-family:-apple-system,Roboto,"Segoe UI",sans-serif; }
  .pq-card{ background:#ffffff; border:1px solid #ECEEF3; border-radius:18px;
            padding:20px; margin-bottom:16px; box-shadow:0 6px 20px rgba(17,24,39,0.06); }
  .pq-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
  .pq-q{ font-size:13px; font-weight:800; color:#0F172A; letter-spacing:0.3px; }
  .pq-tag{ font-size:11px; font-weight:700; color:#14B8A6; background:#ECFDFA; padding:4px 10px; border-radius:999px; }
  .pq-opt-text{ flex:1; }
  .pq-question{ font-size:16px; line-height:1.65; color:#1E293B; margin:0 0 16px; }

  /* MCQ options */
  .pq-opt{ display:flex; gap:12px; align-items:flex-start; background:#F5F6FA;
           border:1px solid #EEF0F5; border-radius:12px; padding:13px 16px;
           margin-bottom:10px; font-size:15px; color:#334155; }
  .pq-letter{ font-weight:800; color:#475569; min-width:16px; }
  .pq-opt-correct{ background:#ECFBF2; border:1px solid #BBF7D0;
                   border-left:4px solid #34D399; flex-direction:column; align-items:stretch; }
  .pq-correct-row{ display:flex; gap:12px; }
  .pq-correct-letter{ color:#059669; }
  .pq-expl-label{ color:#059669; font-weight:700; font-size:13px; margin:10px 0 6px; }
  .pq-expl{ border-left:3px solid #A7F3D0; padding-left:12px; color:#475569;
            font-size:14px; line-height:1.6; }
  .pq-expl p{ margin:3px 0; }

  /* Subjective solution box (cream) */
  .pq-solution{ background:#FBF6EC; border:1px solid #F2E7D2; border-radius:14px;
                padding:16px 18px; margin-top:4px; }
  .pq-solution-title{ font-size:14px; font-weight:800; color:#1C1C1E; margin-bottom:10px; }
  .pq-solution-body{ color:#6B7280; font-size:15px; line-height:1.75; }
  .pq-solution-body p{ margin:4px 0; }

  .pq-foot{ display:flex; justify-content:flex-end; margin-top:12px; }
  .pq-report{ font-family:inherit; font-size:13px; font-weight:600; color:#64748B;
              background:#ffffff; border:1px solid #E2E8F0; border-radius:10px;
              padding:9px 16px; cursor:pointer; }
  .pq-report:active{ background:#F8FAFC; }
</style>
<script>
  function pqReport(btn){
    btn.innerText='\\u2713 Reported';
    btn.style.color='#047857';
    btn.style.borderColor='#6EE7B7';
    btn.style.background='#ECFDF5';
    btn.disabled=true;
    try{
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type:'report_error', id: btn.getAttribute('data-qid') })
        );
      }
    }catch(e){}
  }
</script>
`;

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// An option counts as MCQ-renderable only if it has visible text or HTML.
const hasOptions = (q) =>
  Array.isArray(q.options) &&
  q.options.some((o) => (o.html && o.html.trim()) || (o.text && o.text.trim()));

const optionBody = (o) => o.html || (o.text ? `<p style="display:inline">${o.text}</p>` : '');

// One option row. The correct option expands to show its explanation.
const renderOption = (o, i, fallbackExpl) => {
  const letter = LETTERS[i] || String(i + 1);
  if (o.is_correct) {
    const expl = (o.explanation && o.explanation.trim()) || fallbackExpl || '';
    const explBlock = expl
      ? `<div class="pq-expl-label">Explanation:</div><div class="pq-expl">${expl}</div>`
      : '';
    return (
      `<div class="pq-opt pq-opt-correct"><div class="pq-correct-row">` +
      `<span class="pq-letter pq-correct-letter">${letter}</span>` +
      `<span class="pq-opt-text">${optionBody(o)}</span></div>${explBlock}</div>`
    );
  }
  return (
    `<div class="pq-opt"><span class="pq-letter">${letter}</span>` +
    `<span class="pq-opt-text">${optionBody(o)}</span></div>`
  );
};

// PYQ tag = the years this question appeared in (newest first), e.g. "2025, 2023".
const yearsTag = (q) => {
  if (!Array.isArray(q.years) || q.years.length === 0) return '';
  const ys = [...q.years].sort((a, b) => b - a).join(', ');
  return `<span class="pq-tag">${ys}</span>`;
};

// Build one .pq-card for a question. MCQs render their options; subjective
// questions render a cream solution box from solution_html / explanation.
const renderCard = (q, qNo) => {
  const top = `<div class="pq-top"><span class="pq-q">Q${qNo}</span>${yearsTag(q)}</div>`;
  const question = `<div class="pq-question">${q.question_html || ''}</div>`;

  let body = '';
  if (hasOptions(q)) {
    const fallbackExpl = q.explanation || q.solution_html || '';
    body = q.options.map((o, i) => renderOption(o, i, fallbackExpl)).join('');
  } else {
    const sol = (q.solution_html && q.solution_html.trim())
      || (q.solution && q.solution.trim())
      || (q.explanation && q.explanation.trim())
      || '';
    if (sol) {
      body =
        `<div class="pq-solution"><div class="pq-solution-title">Solution</div>` +
        `<div class="pq-solution-body">${sol}</div></div>`;
    }
  }

  const foot =
    `<div class="pq-foot"><button class="pq-report" data-qid="chem12pyq-${q.question_id}" ` +
    `onclick="pqReport(this)">Report Error</button></div>`;

  return `<div class="pq-card">${top}${question}${body}${foot}</div>`;
};

// Turn a chapter's question list into the full HTML fragment.
const chapterToHtml = (questions) =>
  PQ_PASTEL_HEAD +
  `<div class="pq-wrap">` +
  questions.map((q, i) => renderCard(q, i + 1)).join('') +
  `</div>`;

// Build the { chapterName: html } map, keyed by each file's `chapter` field.
const CHEMISTRY12_PYQ = {};
RAW_CHAPTERS.forEach((questions) => {
  if (Array.isArray(questions) && questions.length > 0 && questions[0].chapter) {
    CHEMISTRY12_PYQ[questions[0].chapter] = chapterToHtml(questions);
  }
});

// Returns the PYQ HTML for a Class 12 Chemistry chapter, or null.
export function getChemistry12PyqHtml(chapter) {
  return CHEMISTRY12_PYQ[chapter] || null;
}

// Chapter names that currently have content (for availability badges).
export function getChemistry12PyqChapters() {
  return Object.keys(CHEMISTRY12_PYQ);
}

export default CHEMISTRY12_PYQ;
