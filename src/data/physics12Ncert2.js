// physics12Ncert2.js
// Class 12 Physics — NCERT Solutions Part-II (textbook examples + exercises).
// Loads the per-chapter raw JSON in ./physics12Ncert2/*.json and returns, per
// chapter, a FULL self-contained HTML document (MathJax + card styling) ready to
// drop into a WebView — same self-contained approach as physics12Exemplar.js /
// physics12Ncert1.js. Most items are subjective (solution box); a few (the
// Semiconductor chapter) are MCQs, so this renderer also handles options.
//
// Chapter keys match ResourcesScreen's Class-12 Physics chapter list (Part-II
// covers chapters 9–14). One alias maps the Semiconductor chapter to the UI
// name "Electronic Devices".

import ch01 from './physics12Ncert2/01 Atoms.json';
import ch02 from './physics12Ncert2/02 Dual Nature of Radiation and Matter.json';
import ch03 from './physics12Ncert2/03 Nuclei.json';
import ch04 from './physics12Ncert2/04 Ray Optics and Optical Instruments.json';
import ch05 from './physics12Ncert2/05 Semiconductor Electronics_ Materials_ Devices and Simple Circuits.json';
import ch06 from './physics12Ncert2/06 Wave Optics.json';

const RAW_CHAPTERS = [ch01, ch02, ch03, ch04, ch05, ch06];

// Chapter-name aliases: data `chapter` field -> the name used in the UI list.
const NAME_ALIAS = {
  'Semiconductor Electronics: Materials, Devices and Simple Circuits': 'Electronic Devices',
};

// Same pastel card template as the other local sets, with a sky-blue "NCERT" tag
// so the sets read as distinct. pqReport posts {type:'report_error'} to the host.
const HEAD = `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<script>
  window.MathJax = { startup: { ready: function () {
    window.MathJax.startup.defaultReady();
    window.MathJax.startup.promise.then(fitWideMath);
  } } };
  function fitWideMath(){ try{ var avail=document.body.clientWidth;
    var nodes=document.querySelectorAll('mjx-container');
    for(var i=0;i<nodes.length;i++){ var c=nodes[i];
      if(c.parentNode && c.parentNode.className==='math-scroll') continue;
      var w=c.scrollWidth||c.getBoundingClientRect().width;
      if(w>avail+1){ var b=document.createElement('span'); b.className='math-scroll';
        c.parentNode.insertBefore(b,c); b.appendChild(c); } } }catch(e){} }
  function pqReport(btn){
    btn.innerText='\\u2713 Reported';
    btn.style.color='#047857'; btn.style.borderColor='#6EE7B7'; btn.style.background='#ECFDF5';
    btn.disabled=true;
    try{ if(window.ReactNativeWebView){
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:'report_error', id: btn.getAttribute('data-qid') }));
    } }catch(e){}
  }
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<style>
  *{ -webkit-tap-highlight-color:transparent; box-sizing:border-box; }
  html,body{ margin:0; max-width:100%; overflow-x:hidden; }
  body{ padding:12px; background:#F4F4F5; color:#1C1C1E;
        font-family:-apple-system,Roboto,"Segoe UI",sans-serif; overflow-wrap:break-word; word-break:break-word; }
  img{ max-width:100%; height:auto; border-radius:8px; }
  .pq-card{ background:#ffffff; border:1px solid #ECEEF3; border-radius:18px;
            padding:20px; margin-bottom:16px; box-shadow:0 6px 20px rgba(17,24,39,0.06); }
  .pq-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
  .pq-q{ font-size:13px; font-weight:800; color:#0F172A; letter-spacing:0.3px; }
  .pq-tag{ font-size:11px; font-weight:700; color:#0369A1; background:#E0F2FE; padding:4px 10px; border-radius:999px; white-space:nowrap; }
  .pq-question{ font-size:16px; line-height:1.7; color:#1E293B; margin:0 0 16px; }
  .pq-opt{ display:flex; gap:12px; align-items:flex-start; background:#F5F6FA;
           border:1px solid #EEF0F5; border-radius:12px; padding:13px 16px; margin-bottom:10px; font-size:15px; color:#334155; }
  .pq-letter{ font-weight:800; color:#475569; min-width:16px; }
  .pq-opt-text{ flex:1; max-width:100%; overflow:hidden; }
  .pq-opt-correct{ background:#ECFBF2; border:1px solid #BBF7D0; border-left:4px solid #34D399; flex-direction:column; align-items:stretch; }
  .pq-correct-row{ display:flex; gap:12px; }
  .pq-correct-letter{ color:#059669; }
  .pq-expl-label{ color:#059669; font-weight:700; font-size:13px; margin:10px 0 6px; }
  .pq-expl{ border-left:3px solid #A7F3D0; padding-left:12px; color:#475569; font-size:14px; line-height:1.6; }
  .pq-expl p{ margin:3px 0; }
  .pq-solution{ background:#FBF6EC; border:1px solid #F2E7D2; border-radius:14px; padding:16px 18px; margin-top:4px; }
  .pq-solution-title{ font-size:14px; font-weight:800; color:#1C1C1E; margin-bottom:10px; }
  .pq-solution-body{ color:#6B7280; font-size:15px; line-height:1.75; }
  .pq-solution-body p{ margin:4px 0; }
  .pq-foot{ display:flex; justify-content:flex-end; margin-top:12px; }
  .pq-report{ font-family:inherit; font-size:13px; font-weight:600; color:#64748B;
              background:#ffffff; border:1px solid #E2E8F0; border-radius:10px; padding:9px 16px; }
  .math-scroll{ display:block; max-width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  mjx-container{ max-width:100% !important; }
  ol,ul{ margin:8px 0; padding-left:22px; } li{ margin:3px 0; line-height:1.6; }
  table{ display:block; max-width:100%; overflow-x:auto; border-collapse:collapse; margin:8px 0; }
  th,td{ border:1px solid #e3e3e6; padding:4px 8px; font-size:14px; text-align:left; }
  strong,b{ font-weight:700; } em,i{ font-style:italic; }
</style>
`;

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const hasOptions = (q) =>
  Array.isArray(q.options) &&
  q.options.some((o) => (o.html && o.html.trim()) || (o.text && o.text.trim()));

const optionBody = (o) => o.html || (o.text ? `<p style="display:inline">${o.text}</p>` : '');

// One MCQ option row; the correct option expands to show its explanation.
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

// One card: MCQs render their options; subjective items render a solution box.
const renderCard = (q, qNo) => {
  const label = q.q_no ? `Q${q.q_no}` : `Q${qNo}`;
  const exTag = q.exercise && q.exercise.trim() ? q.exercise.trim() : 'NCERT Solutions';
  const top = `<div class="pq-top"><span class="pq-q">${label}</span><span class="pq-tag">${exTag}</span></div>`;
  const question = `<div class="pq-question">${q.question_html || q.question_text || ''}</div>`;

  let body = '';
  if (hasOptions(q)) {
    const fallbackExpl = (q.solution_html && q.solution_html.trim()) || '';
    body = q.options.map((o, i) => renderOption(o, i, fallbackExpl)).join('');
  } else {
    const sol = (q.solution_html && q.solution_html.trim())
      || (q.solution_text && q.solution_text.trim())
      || (q.numeric_solution_html && q.numeric_solution_html.trim())
      || (q.numeric_solution_text && q.numeric_solution_text.trim())
      || '';
    if (sol) {
      body =
        `<div class="pq-solution"><div class="pq-solution-title">Solution</div>` +
        `<div class="pq-solution-body">${sol}</div></div>`;
    }
  }

  const foot =
    `<div class="pq-foot"><button class="pq-report" data-qid="phy12ncert2-${q.question_id}" ` +
    `onclick="pqReport(this)">Report Error</button></div>`;

  return `<div class="pq-card">${top}${question}${body}${foot}</div>`;
};

// Turn a chapter's question list into a full HTML document. {tex}…{/tex} ->
// \( … \) so MathJax (default inline delimiters) typesets every formula.
const chapterToDoc = (questions) => {
  const cards = questions.map((q, i) => renderCard(q, i + 1)).join('');
  const fragment = `<div class="pq-wrap">${cards}</div>`
    .replace(/\{tex\}/g, ' \\(')
    .replace(/\{\/tex\}/g, '\\) ');
  return `<!DOCTYPE html><html><head>${HEAD}</head><body>${fragment}</body></html>`;
};

// Build the { chapterName: htmlDoc } map, keyed by each file's `chapter` field
// (with the UI alias applied).
const PHYSICS12_NCERT2 = {};
RAW_CHAPTERS.forEach((questions) => {
  if (Array.isArray(questions) && questions.length > 0 && questions[0].chapter) {
    const raw = questions[0].chapter;
    const key = NAME_ALIAS[raw] || raw;
    PHYSICS12_NCERT2[key] = chapterToDoc(questions);
  }
});

// Returns a full HTML document for a Class 12 Physics chapter's NCERT Part-II
// solutions, or null if there's no local data for it.
export function getPhysics12Ncert2Html(chapter) {
  return PHYSICS12_NCERT2[chapter] || null;
}

// Chapter names that currently have local NCERT Part-II content.
export function getPhysics12Ncert2Chapters() {
  return Object.keys(PHYSICS12_NCERT2);
}

export default PHYSICS12_NCERT2;
