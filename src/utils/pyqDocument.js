// src/utils/pyqDocument.js
// Shared helpers that turn the API's structured questions ([{ qNumber, year,
// questionHtml, isMcq, options:[{idx,html,is_correct}], solutionHtml }]) into a
// self-contained MathJax HTML document for a WebView. Used by both PracticeScreen
// (PYQ / Important Questions) and ResourcesScreen (Exemplar) so Class 12 content
// served from the DB renders identically.

// Build the .pyq-card HTML fragment from the structured questions the API returns.
export function buildFragmentFromQuestions(questions) {
  return (questions || [])
    .map((q) => {
      const year = q.year ? `<span class="pyq-year">${q.year}</span>` : '';
      const header = `<div class="pyq-header"><span class="q-number">${q.qNumber || ''}</span>${year}</div>`;
      const question = `<div class="pyq-question">${q.questionHtml || ''}</div>`;
      let options = '';
      if (q.isMcq && Array.isArray(q.options) && q.options.length) {
        const opts = q.options
          .map(
            (o) =>
              `<div class="option${o.is_correct ? ' correct' : ''}">` +
              `<div class="option-index">${o.idx || ''}</div>` +
              `<div class="option-text">${o.html || ''}</div></div>`
          )
          .join('');
        options = `<div class="pyq-options">${opts}</div>`;
      }
      const solution = q.solutionHtml
        ? `<div class="solution-box"><div class="solution-title">Solution</div><div>${q.solutionHtml}</div></div>`
        : '';
      return `<div class="pyq-card">${header}${question}${options}${solution}</div>`;
    })
    .join('');
}

// Wraps a question-card fragment in a full HTML doc with MathJax (renders
// {tex}...{/tex}) and the black-&-white card styling used elsewhere in the app.
export function buildPyqDocument(fragmentHtml) {
  // The scraped data wraps math in {tex}…{/tex}, but MathJax renders the standard
  // \( … \) inline delimiters far more reliably than custom-string delimiters
  // (same conversion MathText.js does). Convert before injecting so every formula
  // typesets. Spaces keep math from fusing with adjacent words.
  const html = String(fragmentHtml || '')
    .replace(/\{tex\}/g, ' \\(')
    .replace(/\{\/tex\}/g, '\\) ');
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<script>
  window.MathJax = { tex: { inlineMath: [['\\\\(', '\\\\)']], displayMath: [] },
    startup: { ready: function () { window.MathJax.startup.defaultReady();
      window.MathJax.startup.promise.then(fitWideMath); } } };
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
  body{ padding:12px; background:#f4f4f5; font-family:-apple-system,Roboto,"Segoe UI",sans-serif;
        color:#1C1C1E; overflow-wrap:break-word; word-break:break-word; }
  img{ max-width:100%; height:auto; border-radius:8px; filter:grayscale(100%); }
  .pyq-card,.question-card{ background:#fff; border:1px solid #e3e3e6; border-radius:16px;
                  padding:16px; margin-bottom:16px; max-width:100%; overflow:hidden; }
  .pyq-header,.question-header{ display:flex; justify-content:space-between; align-items:center;
                    gap:8px; margin-bottom:10px; }
  .q-number{ background:#1C1C1E; color:#fff; padding:4px 10px; border-radius:20px;
             font-size:12px; font-weight:600; white-space:nowrap; }
  .pyq-year,.years{ font-size:11px; font-weight:600; color:#6b7280; text-align:right; }
  .pyq-question,.question-text{ font-size:16px; line-height:1.7; margin-bottom:10px; max-width:100%; }
  .answer-section{ margin-top:12px; max-width:100%; }
  .label{ font-size:12px; font-weight:600; color:#555; margin-bottom:4px; }
  .solution-box,.solution-block{ background:#f5f5f6; padding:10px 12px; border-radius:10px; margin-top:12px;
                   border:1px solid #ededed; max-width:100%; }
  .solution-title{ font-size:12px; font-weight:600; color:#555; margin-bottom:4px; }
  .solution-box p{ margin:4px 0; }
  .pyq-options,.options{ display:flex; flex-direction:column; gap:6px; margin-top:12px; }
  .option{ display:flex; gap:10px; align-items:flex-start;
           border:1px solid #e3e3e6; border-radius:10px; padding:8px 12px; font-size:15px; }
  .option.correct{ border-color:#16a34a; background:#e7f7ec; color:#15803d; font-weight:600; }
  .option.correct .option-index, .option.correct .option-text, .option.correct p{ color:#15803d; }
  .option-index{ font-weight:700; min-width:18px; }
  .option-text{ flex:1; max-width:100%; overflow:hidden; }
  .option-text p{ margin:0; }
  .tick{ font-weight:700; }
  .math-scroll{ display:block; max-width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  mjx-container{ max-width:100% !important; }
  table{ display:block; max-width:100%; overflow-x:auto; border-collapse:collapse; margin:8px 0; }
  th,td{ border:1px solid #e3e3e6; padding:4px 8px; font-size:14px; text-align:left; }
  ol,ul{ margin:8px 0; padding-left:22px; }
  li{ margin:3px 0; line-height:1.6; }
  strong,b{ font-weight:700; }
  em,i{ font-style:italic; }
</style></head>
<body>${html}</body></html>`;
}
