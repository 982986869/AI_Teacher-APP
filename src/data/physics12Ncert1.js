// physics12Ncert1.js
// Class 12 Physics — NCERT Solutions Part-I (textbook examples + exercises).
// Loads the per-chapter raw JSON in ./physics12Ncert1/*.json and returns, per
// chapter, a FULL self-contained HTML document (MathJax + card styling) ready to
// drop into a WebView. Same self-contained approach as physics12Exemplar.js:
// the data wraps math in {tex}…{/tex}, which we convert to the \( … \) inline
// delimiters MathJax renders by default (same trick as MathText.js).
//
// Chapter keys match ResourcesScreen's Class-12 Physics chaptersByClass exactly
// (NCERT Part-I covers chapters 1–8).

import ch01 from './physics12Ncert1/01 Alternating Current.json';
import ch02 from './physics12Ncert1/02 Current Electricity.json';
import ch03 from './physics12Ncert1/03 Electric Charges and Fields.json';
import ch04 from './physics12Ncert1/04 Electromagnetic Induction.json';
import ch05 from './physics12Ncert1/05 Electromagnetic Waves.json';
import ch06 from './physics12Ncert1/06 Electrostatic Potential and Capacitance.json';
import ch07 from './physics12Ncert1/07 Magnetism and Matter.json';
import ch08 from './physics12Ncert1/08 Moving Charges and Magnetism.json';

const RAW_CHAPTERS = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08];

// Chapter-name aliases: data `chapter` field -> the name used in the UI list.
// (None needed for Part-I — the eight chapter names already match.)
const NAME_ALIAS = {};

// Same pastel card template as the Exemplar set, with an emerald "NCERT" tag so
// the sets read as distinct. pqReport posts {type:'report_error'} to the host.
const HEAD = `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<script>
  // Leave MathJax's tex defaults in place (\\( … \\) are default inline
  // delimiters) and just wrap wide equations in a horizontal scroller.
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
  .pq-tag{ font-size:11px; font-weight:700; color:#059669; background:#E7F8F0; padding:4px 10px; border-radius:999px; white-space:nowrap; }
  .pq-question{ font-size:16px; line-height:1.7; color:#1E293B; margin:0 0 16px; }
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

// One solution card. NCERT Part-I items are subjective, so each renders the
// question followed by a cream solution box (HTML preferred, text fallback).
const renderCard = (q, qNo) => {
  const label = q.q_no ? `Q${q.q_no}` : `Q${qNo}`;
  const exTag = q.exercise && q.exercise.trim() ? q.exercise.trim() : 'NCERT Solutions';
  const top = `<div class="pq-top"><span class="pq-q">${label}</span><span class="pq-tag">${exTag}</span></div>`;
  const question = `<div class="pq-question">${q.question_html || q.question_text || ''}</div>`;

  const sol = (q.solution_html && q.solution_html.trim())
    || (q.solution_text && q.solution_text.trim())
    || (q.numeric_solution_html && q.numeric_solution_html.trim())
    || (q.numeric_solution_text && q.numeric_solution_text.trim())
    || '';
  const body = sol
    ? `<div class="pq-solution"><div class="pq-solution-title">Solution</div>` +
      `<div class="pq-solution-body">${sol}</div></div>`
    : '';

  const foot =
    `<div class="pq-foot"><button class="pq-report" data-qid="phy12ncert1-${q.question_id}" ` +
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
const PHYSICS12_NCERT1 = {};
RAW_CHAPTERS.forEach((questions) => {
  if (Array.isArray(questions) && questions.length > 0 && questions[0].chapter) {
    const raw = questions[0].chapter;
    const key = NAME_ALIAS[raw] || raw;
    PHYSICS12_NCERT1[key] = chapterToDoc(questions);
  }
});

// Returns a full HTML document for a Class 12 Physics chapter's NCERT Part-I
// solutions, or null if there's no local data for it.
export function getPhysics12Ncert1Html(chapter) {
  return PHYSICS12_NCERT1[chapter] || null;
}

// Chapter names that currently have local NCERT Part-I content.
export function getPhysics12Ncert1Chapters() {
  return Object.keys(PHYSICS12_NCERT1);
}

export default PHYSICS12_NCERT1;
