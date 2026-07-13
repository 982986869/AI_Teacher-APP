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
// opts.collapsible (Important Questions): hide each card's answer (solution +
// MCQ correct highlight) until the user taps the card to expand it.
export function buildPyqDocument(fragmentHtml, opts = {}) {
  const collapsible = !!opts.collapsible;
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
  // Wrap any formula wider than the space actually available to it (its parent's
  // content box — not the full page) in a horizontally scrollable span, so wide
  // math inside a narrow column (e.g. an MCQ option) scrolls instead of pushing
  // the card off-screen. Re-runs on resize/orientation and after late layout.
  // Width of the space actually available to a node = nearest ancestor with a
  // real content box (inline <p> wrappers report clientWidth 0, so we skip them).
  function availWidth(node){ var b=node;
    while(b && b!==document.body){ if(b.clientWidth>0) return b.clientWidth; b=b.parentNode; }
    return document.body.clientWidth; }
  function fitWideMath(){ try{
    var nodes=document.querySelectorAll('mjx-container');
    for(var i=0;i<nodes.length;i++){ var c=nodes[i];
      var p=c.parentNode; if(!p) continue;
      // Formulas inside a .math-tex wrapper already scroll via CSS — leave them.
      if(c.closest && c.closest('.math-tex')) continue;
      if(p.className==='math-scroll'){
        // Already wrapped: drop the scroller if the math now fits its space.
        if((c.scrollWidth||0) <= availWidth(p.parentNode)+1){
          p.parentNode.insertBefore(c,p); p.parentNode.removeChild(p);
        }
        continue;
      }
      var w=c.scrollWidth||c.getBoundingClientRect().width;
      if(w>availWidth(p)+1){ var b=document.createElement('span'); b.className='math-scroll';
        p.insertBefore(b,c); b.appendChild(c); } } }catch(e){} }
  window.addEventListener('resize', fitWideMath);
  window.addEventListener('load', fitWideMath);
  window.addEventListener('orientationchange', function(){ setTimeout(fitWideMath, 60); });
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
  /* Each scraped formula is wrapped in <span class="math-tex">: make that the
     scroll boundary so a wide formula scrolls inside the card (pure CSS, no JS
     timing). .math-scroll is the JS fallback for math without this wrapper. */
  .math-tex{ display:inline-block; max-width:100%; overflow-x:auto; overflow-y:hidden;
             vertical-align:middle; -webkit-overflow-scrolling:touch; }
  .math-scroll{ display:block; max-width:100%; overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; }
  mjx-container{ max-width:100% !important; }
  /* CRITICAL: inside a scroll boundary the formula must keep its natural width,
     otherwise max-width:100% clips it and there is nothing to scroll. */
  .math-tex mjx-container,.math-scroll mjx-container{ max-width:none !important; }
  /* Display (block) math scrolls on its own. */
  mjx-container[display="true"]{ display:block; overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; }
  /* Let flex rows and their content columns shrink below content size so a wide
     formula/word scrolls within its column instead of widening the whole card.
     Covers the Exemplar (.option) and pastel PYQ/Important (.pq-*) layouts. */
  .option,.pq-opt,.pq-correct-row,.pq-top{ min-width:0; }
  .option-text,.pq-opt-text{ min-width:0; overflow:hidden; }
  .pq-card{ overflow:hidden; }
  .pq-question,.pq-expl,.pq-solution-body{ max-width:100%; overflow-wrap:break-word; word-break:break-word; }
  table{ display:block; max-width:100%; overflow-x:auto; border-collapse:collapse; margin:8px 0; }
  th,td{ border:1px solid #e3e3e6; padding:4px 8px; font-size:14px; text-align:left; }
  ol,ul{ margin:8px 0; padding-left:22px; }
  li{ margin:3px 0; line-height:1.6; }
  strong,b{ font-weight:700; }
  em,i{ font-style:italic; }
  /* ── Collapsible questions (Important Questions) ────────────────────────────
     Collapsed = a small tappable box showing only the question number (like the
     chapter tiles); tapping expands the full question + answer. Applied only when
     the doc is built with { collapsible:true }; PYQ/Exemplar stay fully visible. */
  body.iq .pyq-card,body.iq .question-card{ cursor:pointer; }
  /* While collapsed, show only a short 2-line preview of the question; hide the
     options and the answer. Tapping expands the full question + answer. */
  body.iq .pyq-card:not(.open) .pyq-options,
  body.iq .pyq-card:not(.open) .solution-box,
  body.iq .question-card:not(.open) .options,
  body.iq .question-card:not(.open) .solution-block{ display:none; }
  body.iq .pyq-card:not(.open) .pyq-header,
  body.iq .question-card:not(.open) .question-header{ margin-bottom:6px; }
  body.iq .pyq-card:not(.open) .pyq-question,
  body.iq .question-card:not(.open) .question-text{
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
    overflow:hidden; line-height:1.5; max-height:3em; margin:0; }
  /* Flatten nested <p>/blocks so the 2-line preview clamps cleanly (no top gap,
     no mid-line cut). */
  body.iq .pyq-card:not(.open) .pyq-question *,
  body.iq .question-card:not(.open) .question-text *{ margin:0 !important; display:inline !important; }
  /* MCQ correct-answer highlight only once opened (options are hidden collapsed). */
  body.iq .option.correct{ border-color:#e3e3e6; background:#fff; color:#1C1C1E; font-weight:400; }
  body.iq .option.correct .option-index,body.iq .option.correct .option-text,body.iq .option.correct p{ color:#1C1C1E; }
  body.iq .open .option.correct{ border-color:#16a34a; background:#e7f7ec; color:#15803d; font-weight:600; }
  body.iq .open .option.correct .option-index,body.iq .open .option.correct .option-text,body.iq .open .option.correct p{ color:#15803d; }
  /* Tap affordance shown inside every box. */
  body.iq .pyq-card::after,body.iq .question-card::after{ content:"View answer  \\25BE";
    display:block; margin-top:10px; font-size:12px; font-weight:800; color:#15803d; letter-spacing:0.2px; }
  body.iq .pyq-card.open::after,body.iq .question-card.open::after{ content:"Hide  \\25B4"; margin-top:12px; font-weight:700; color:#9ca3af; }
</style></head>
<body class="${collapsible ? 'iq' : ''}">${html}
${collapsible ? `<script>(function(){
  document.addEventListener('click', function(e){
    var t = e.target;
    var card = t && t.closest ? t.closest('.pyq-card,.question-card') : null;
    if(!card) return;
    card.classList.toggle('open');
    // Re-flow wide math now that the solution is visible (hidden nodes measure 0).
    if(typeof fitWideMath==='function') setTimeout(fitWideMath, 0);
  });
})();</script>` : ''}
</body></html>`;
}
