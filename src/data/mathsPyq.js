// mathsPyq.js
// Class 11 Mathematics - Previous Year Questions.
// Default-exports a { chapterName: questionCardHtml } map consumed by allPyq.js
// (getPyqHtml -> SUBJECT_PYQ.Mathematics[chapter]).
//
// Chapter-name keys MUST match PracticeScreen's PYQ_SUBJECTS (Mathematics) exactly.
//
// PASTEL TEMPLATE: cards carry their OWN scoped styles (class prefix `pq-`) so the
// pastel look renders regardless of buildPyqDocument's black/white CSS. Math is
// written as {tex}...{/tex} so the app's MathJax renders it. "Report Error" is
// clickable: it confirms visually and (if you add a WebView onMessage handler)
// posts {type:'report_error', id} back to React Native.

// ── Shared pastel styles + report-button script (include once per chapter) ──
const PQ_PASTEL_HEAD = `
<style>
  .pq-wrap{ font-family:-apple-system,Roboto,"Segoe UI",sans-serif; }
  .pq-card{ background:#ffffff; border:1px solid #ECEEF3; border-radius:18px;
            padding:20px; margin-bottom:16px; box-shadow:0 6px 20px rgba(17,24,39,0.06); }
  .pq-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
  .pq-q{ font-size:13px; font-weight:800; color:#0F172A; letter-spacing:0.3px; }
  .pq-year{ font-size:12px; font-weight:700; color:#14B8A6; background:#ECFDFA;
            padding:4px 12px; border-radius:999px; }
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
    btn.innerText='\u2713 Reported';
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


// ── Chapter 1: Sets (MCQ card sample) ───────────────────────────────────────
// NOTE: this sample question is about relations/domain. Move to
// 'Relations and Functions' if you prefer.
const MATHS_SETS = PQ_PASTEL_HEAD + `
<div class="pq-wrap">
  <div class="pq-card">
    <div class="pq-top">
      <span class="pq-q">Q1</span>
      <span class="pq-year">2022</span>
    </div>
    <p class="pq-question">If R = {(x, y): x, y &isin; Z, {tex}x^2 + y^2 \leq 4{/tex}} is a relation on Z, then domain of R is</p>

    <div class="pq-opt"><span class="pq-letter">A</span><span>{0, 1, 2}</span></div>
    <div class="pq-opt"><span class="pq-letter">B</span><span>{0, -1, -2}</span></div>

    <div class="pq-opt pq-opt-correct">
      <div class="pq-correct-row">
        <span class="pq-letter pq-correct-letter">C</span>
        <span>{-2, -1, 0, 1, 2}</span>
      </div>
      <div class="pq-expl-label">Explanation:</div>
      <div class="pq-expl">
        <p>Domain of R is a set constituting all values of x.</p>
        <p>Here, possible values for x by equation {tex}x^2 + y^2 \leq 4{/tex} will be 0, 1, -1, 2, -2.</p>
        <p>So, Domain of R is : {-2, -1, 0, 1, 2}.</p>
      </div>
    </div>

    <div class="pq-opt"><span class="pq-letter">D</span><span>{-1, 0, 1}</span></div>

    <div class="pq-foot">
      <button class="pq-report" data-qid="maths-sets-q1" onclick="pqReport(this)">Report Error</button>
    </div>
  </div>
</div>
`;


// ── Chapter 2: Relations and Functions (subjective + cream Solution box) ─────
// NOTE: this question is actually a quadratic-equations problem (topic of
// 'Complex Numbers and Quadratic Equations'). Move the map key below if you want
// it under that chapter instead.
const MATHS_RELATIONS_AND_FUNCTIONS = PQ_PASTEL_HEAD + `
<div class="pq-wrap">
  <div class="pq-card">
    <div class="pq-top">
      <span class="pq-q">Q1</span>
      <span class="pq-year">2023</span>
    </div>
    <p class="pq-question">Three consecutive odd numbers are such that the sum of the squares of the first two numbers is greater than the square of the third by 65. Find the numbers.</p>

    <div class="pq-solution">
      <div class="pq-solution-title">Solution</div>
      <div class="pq-solution-body">
        <p>Let 2x + 1, 2x + 3 and 2x + 5 be the three consecutive odd numbers.</p>
        <p>A.T.Q.</p>
        <p>{tex}(2x+1)^2 + (2x+3)^2 = (2x+5)^2 + 65{/tex}</p>
        <p>{tex}\Rightarrow x^2 - x - 20 = 0{/tex}</p>
        <p>{tex}\Rightarrow (x-5)(x+4) = 0{/tex}</p>
        <p>{tex}\Rightarrow x = 5 \;\text{or}\; x = -4{/tex}</p>
        <p>Odd and even numbers are natural numbers.</p>
        <p>{tex}\therefore x = 5{/tex}</p>
        <p>So, required numbers are 11, 13 and 15.</p>
      </div>
    </div>

    <div class="pq-foot">
      <button class="pq-report" data-qid="maths-relfn-q1" onclick="pqReport(this)">Report Error</button>
    </div>
  </div>
</div>
`;


// ── Chapter 8: Sequences and Series (MCQ + long explanation) ────────────────
const MATHS_SEQUENCES_AND_SERIES = PQ_PASTEL_HEAD + `
<div class="pq-wrap">
  <div class="pq-card">
    <div class="pq-top">
      <span class="pq-q">Q1</span>
      <span class="pq-year">2013</span>
    </div>
    <p class="pq-question">The first three of four given numbers are in G.P. and their last three are in A.P. with common difference 6. If first and fourth numbers are equal, then the first number is</p>

    <div class="pq-opt"><span class="pq-letter">A</span><span>2</span></div>
    <div class="pq-opt"><span class="pq-letter">B</span><span>4</span></div>
    <div class="pq-opt"><span class="pq-letter">C</span><span>6</span></div>

    <div class="pq-opt pq-opt-correct">
      <div class="pq-correct-row">
        <span class="pq-letter pq-correct-letter">D</span>
        <span>8</span>
      </div>
      <div class="pq-expl-label">Explanation:</div>
      <div class="pq-expl">
        <p>As per given question,</p>
        <p>The first and the last numbers are equal.</p>
        <p>Let the four given numbers be p, q, r and p.</p>
        <p>The first three of four given numbers are in G.P.</p>
        <p>{tex}\therefore q^2 = p \cdot r \quad \text{...(I)}{/tex}</p>
        <p>And, the last three are in A.P. with common difference 6.</p>
        <p>We have,</p>
        <p>First term = q</p>
        <p>Second term = r = q + 6</p>
        <p>Third term = p = q + 12</p>
        <p>Also, 2r = q + p</p>
        <p>Now, put the values of p and r in (I):</p>
        <p>{tex}q^2 = (q + 12)(q + 6){/tex}</p>
        <p>{tex}\Rightarrow q^2 = q^2 + 18q + 72{/tex}</p>
        <p>{tex}\Rightarrow 18q + 72 = 0{/tex}</p>
        <p>{tex}\Rightarrow q + 4 = 0{/tex}</p>
        <p>{tex}\Rightarrow q = -4{/tex}</p>
        <p>Now put the value of q in p = q + 12</p>
        <p>{tex}p = -4 + 12 = 8{/tex}</p>
      </div>
    </div>

    <div class="pq-foot">
      <button class="pq-report" data-qid="maths-seqser-q1" onclick="pqReport(this)">Report Error</button>
    </div>
  </div>
</div>
`;


const MATHS_PYQ = {
  'Sets': MATHS_SETS,
  'Relations and Functions': MATHS_RELATIONS_AND_FUNCTIONS,
  'Sequences and Series': MATHS_SEQUENCES_AND_SERIES,
  // If you want the quadratic card under its true chapter instead, use:
  // 'Complex Numbers and Quadratic Equations': MATHS_RELATIONS_AND_FUNCTIONS,
};

export default MATHS_PYQ;