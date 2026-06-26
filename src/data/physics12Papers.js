// physics12Papers.js
// Class 12 Physics — CBSE board "Last Year Papers" (2025). Each source JSON holds
// one full paper: { name, year, code, set, question_paper_html, answer_key_html }.
// This module exposes the paper list for the Resources "Last Year Papers" screen
// and, per paper code, full self-contained HTML documents (MathJax) for the
// question paper (Questions tab) and the answer key (Solutions tab) — rendered in
// a WebView, same approach as the Exemplar / NCERT local content.

import p89  from './physics12Papers/89 2025 55_1_1 set1.json';
import p90  from './physics12Papers/90 2025 55_1_2 set2.json';
import p91  from './physics12Papers/91 2025 55_1_3 set3.json';
import p92  from './physics12Papers/92 2025 55_2_1 set1.json';
import p93  from './physics12Papers/93 2025 55_2_2 set2.json';
import p94  from './physics12Papers/94 2025 55_2_3 set3.json';
import p95  from './physics12Papers/95 2025 55_4_1 set1.json';
import p96  from './physics12Papers/96 2025 55_4_2 set2.json';
import p97  from './physics12Papers/97 2025 55_4_3 set3.json';
import p98  from './physics12Papers/98 2025 55_5_1 set1.json';
import p99  from './physics12Papers/99 2025 55_5_2 set2.json';
import p100 from './physics12Papers/100 2025 55_5_3 set3.json';
import p101 from './physics12Papers/101 2025 55_6_1 set1.json';
import p102 from './physics12Papers/102 2025 55_6_2 set2.json';
import p103 from './physics12Papers/103 2025 55_6_3 set3.json';
import p104 from './physics12Papers/104 2025 55_7_1 set1.json';
import p105 from './physics12Papers/105 2025 55_7_2 set2.json';
import p106 from './physics12Papers/106 2025 55_7_3 set3.json';
import p107 from './physics12Papers/107 2025 55_S_1 set1.json';
import p108 from './physics12Papers/108 2025 55_S_2 set2.json';
import p109 from './physics12Papers/109 2025 55_S_3 set3.json';

const RAW = [
  p89, p90, p91, p92, p93, p94, p95, p96, p97, p98, p99,
  p100, p101, p102, p103, p104, p105, p106, p107, p108, p109,
];

const BY_CODE = {};
RAW.forEach((p) => { if (p && p.code) BY_CODE[p.code] = p; });

// MathJax + light base styling. The paper HTML brings its own inline styles for
// the instruction box, section headers and question tables; this only adds the
// page font, responsive images and horizontally-scrollable wide math/tables.
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
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<style>
  *{ -webkit-tap-highlight-color:transparent; box-sizing:border-box; }
  html,body{ margin:0; max-width:100%; overflow-x:hidden; }
  body{ padding:14px 12px; background:#F4F4F5; color:#1C1C1E;
        font-family:-apple-system,Roboto,"Segoe UI",sans-serif; font-size:15px; line-height:1.6;
        overflow-wrap:break-word; word-break:break-word; }
  img{ max-width:100%; height:auto; border-radius:6px; }
  h1{ font-size:22px; }
  .math-scroll{ display:block; max-width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  mjx-container{ max-width:100% !important; }
  ol,ul{ padding-left:22px; } li{ margin:3px 0; }
  hr{ border:0; border-top:1px solid #ddd; }
  table{ max-width:100%; }
  .ques_text table{ display:block; overflow-x:auto; }
  strong,b{ font-weight:700; }
</style>
`;

// Wrap a paper's raw HTML fragment in a full MathJax document. {tex}…{/tex} ->
// \( … \) so MathJax (default inline delimiters) typesets every formula.
const buildDoc = (html) =>
  `<!DOCTYPE html><html><head>${HEAD}</head><body>` +
  String(html || '').replace(/\{tex\}/g, ' \\(').replace(/\{\/tex\}/g, '\\) ') +
  `</body></html>`;

// Set number from the QP code (e.g. 55/2/3 -> "3"); falls back to the set field.
const setOf = (p) => (p.set != null ? String(p.set) : String(p.code).split('/').pop());

// Paper list for the "Last Year Papers" screen, sorted by code.
export function getPhysics12Papers() {
  return RAW
    .map((p) => ({ year: p.year, code: p.code, set: setOf(p), name: p.name }))
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
}

// Full HTML doc for a paper. which = 'solutions' returns the answer key, anything
// else returns the question paper. Returns null if there's no local paper / html.
export function getPhysics12PaperDoc(code, which) {
  const p = BY_CODE[code];
  if (!p) return null;
  const html = which === 'solutions' ? p.answer_key_html : p.question_paper_html;
  return html ? buildDoc(html) : null;
}

export default BY_CODE;
