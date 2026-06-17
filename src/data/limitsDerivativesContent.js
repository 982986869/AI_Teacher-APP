// limitsDerivativesContent.js
// NCERT Solutions — Class 11 Mathematics, Chapter 12: Limits and Derivatives.
//   EXAMPLES (20 of 34) | EX12_1 (20 of 32) | EX12_2 (20 of 27) | MISC (20 of 33)
//   ALL FOUR sections are page 1 of 2 — page-2 tails still pending.
// Math uses {tex}...{/tex} (LaTeX), rendered by Ncert2Screen's tex-mml-chtml build.

export const EXAMPLES_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(1)</span></div><div class="question-text"><p>Find the limit:&nbsp;<span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow 1}\\left[x^{3}-x^{2}+1\\right]{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,&nbsp;<span class="math-tex">{tex}\\lim \\limits _{x \\rightarrow 1}\\left[x^{3}-x^{2}+1\\right]{/tex}</span>&nbsp;= 1<sup>3</sup> &ndash; 1<sup>2</sup> + 1 = 1</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(2)</span></div><div class="question-text"><p>Find the limit:&nbsp;<span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow 3}[x(x+1)]{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,&nbsp;<span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow 3}[x(x+1)]{/tex}</span>&nbsp;= 3 (3+1) = 3 (4) = 12</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(3)</span></div><div class="question-text"><p>Find the limit:&nbsp;<span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow-1}\\left[1+x+x^{2}+\\ldots+x^{10}\\right]{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow-1}\\left[1+x+x^{2}+\\ldots+x^{10}\\right]{/tex}</span>&nbsp;<span class="math-tex">{tex}=1+(-1)+(-1)^{2}+\\ldots+(-1)^{10}{/tex}</span></p>

<p>= 1 - 1 + 1 - 1 + 1 - 1 + 1 - 1 + 1 - 1 + 1 = 1</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(1)</span></div><div class="question-text"><p>Find the limit:&nbsp;<span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow 1}\\left[\\frac{x^{2}+1}{x+100}\\right]{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>&nbsp;<span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow 1} \\frac{x^{2}+1}{x+100}=\\frac{1^{2}+1}{1+100}=\\frac{2}{101}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(2)</span></div><div class="question-text"><p>Find the limit:&nbsp;<span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow 2}\\left[\\frac{x^{3}-4 x^{2}+4 x}{x^{2}-4}\\right]{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Evaluating the function at 2, it is of the form&nbsp;<span class="math-tex">{tex}\\frac{0}{0}{/tex}</span></p>

<p>Therefore, we have,</p>

<p>&nbsp;<span class="math-tex">{tex}\\lim _{x \\rightarrow 2} \\frac{x^{3}-4 x^{2}+4 x}{x^{2}-4}=\\lim _{x \\rightarrow 2} \\frac{x(x-2)^{2}}{(x+2)(x-2)}{/tex}</span><br />
<span class="math-tex">{tex}=\\lim _{x \\rightarrow 2} \\frac{x(x-2)}{(x+2)}{/tex}</span>&nbsp;as&nbsp;<span class="math-tex">{tex}x\\neq{/tex}</span> 2<br />
<span class="math-tex">{tex}=\\frac{2(2-2)}{2+2}=\\frac{0}{4}=0{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(3)</span></div><div class="question-text"><p>Find the limit:&nbsp;<span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow 2}\\left[\\frac{x^{2}-4}{x^{3}-4 x^{2}+4 x}\\right]{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Evaluating the function at 2, we get it of the form&nbsp;<span class="math-tex">{tex}\\frac{0}{0}{/tex}</span><br />
Therefore, we have,<br />
<span class="math-tex">{tex}\\lim _{x \\rightarrow 2} \\frac{x^{2}-4}{x^{3}-4 x^{2}+4 x}=\\lim _{x \\rightarrow 2} \\frac{(x+2)(x-2)}{x(x-2)^{2}}{/tex}</span><br />
<span class="math-tex">{tex}=\\lim _{x \\rightarrow 2} \\frac{(x+2)}{x(x-2)}=\\frac{2+2}{2(2-2)}=\\frac{4}{0}{/tex}</span>&nbsp;=&nbsp;<span class="math-tex">{tex}\\infty{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(4)</span></div><div class="question-text"><p>Find the limit:&nbsp;<span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow 2}\\left[\\frac{x^{3}-2 x^{2}}{x^{2}-5 x+6}\\right]{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Evaluating the function at 2, we get it of the form&nbsp;<span class="math-tex">{tex}\\frac{0}{0}{/tex}</span><br />
Therefore, we have,<br />
<span class="math-tex">{tex}\\lim _{x \\rightarrow 2} \\frac{x^{3}-2 x^{2}}{x^{2}-5 x+6}=\\lim _{x \\rightarrow 2} \\frac{x^{2}(x-2)}{(x-2)(x-3)}{/tex}</span><br />
<span class="math-tex">{tex}=\\lim _{x \\rightarrow 2} \\frac{x^{2}}{(x-3)}=\\frac{(2)^{2}}{2-3}=\\frac{4}{-1}=-4{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(5)</span></div><div class="question-text"><p>Find the limit:&nbsp;<span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow 1}\\left[\\frac{x-2}{x^{2}-x}-\\frac{1}{x^{3}-3 x^{2}+2 x}\\right]{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>First, we rewrite the function as a rational function.<br />
<span class="math-tex">{tex}\\left[\\frac{x-2}{x^{2}-x}-\\frac{1}{x^{3}-3 x^{2}+2 x}\\right]=\\left[\\frac{x-2}{x(x-1)}-\\frac{1}{x\\left(x^{2}-3 x+2\\right)}\\right]{/tex}</span><br />
<span class="math-tex">{tex}=\\left[\\frac{x-2}{x(x-1)}-\\frac{1}{x(x-1)(x-2)}\\right]{/tex}</span><br />
<span class="math-tex">{tex}=\\left[\\frac{x^{2}-4 x+4-1}{x(x-1)(x-2)}\\right]{/tex}</span><br />
<span class="math-tex">{tex}=\\frac{x^{2}-4 x+3}{x(x-1)(x-2)}{/tex}</span><br />
Evaluating the function at 1, we get it of the form&nbsp;<span class="math-tex">{tex}\\frac{0}{0}{/tex}</span><br />
Hence&nbsp;<span class="math-tex">{tex}\\lim _{x \\rightarrow 1}\\left[\\frac{x^{2}-2}{x^{2}-x}-\\frac{1}{x^{3}-3 x^{2}+2 x}\\right]=\\lim _{x \\rightarrow 1} \\frac{x^{2}-4 x+3}{x(x-1)(x-2)}{/tex}</span><br />
<span class="math-tex">{tex}=\\lim _{x \\rightarrow 1} \\frac{(x-3)(x-1)}{x(x-1)(x-2)}{/tex}</span><br />
<span class="math-tex">{tex}=\\lim _{x \\rightarrow 1} \\frac{x-3}{x(x-2)}=\\frac{1-3}{1(1-2)}=2{/tex}</span>&nbsp;<span class="math-tex">{tex}{/tex}</span>&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(1)</span></div><div class="question-text"><p>Evaluate:&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 1} \\frac{{{x^{15}} - 1}}{{{x^{10}} - 1}}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,<br />
<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 1} \\frac{{{x^{15}} - 1}}{{{x^{10}} - 1}}{/tex}</span>&nbsp;=&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 1} \\frac{{{x^{15}} - 1}}{{{x^{10}} - 1}} \\times \\frac{{(x - 1)}}{{(x - 1)}}{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 1} \\frac{{{x^{15}} - 1}}{{x - 1}} \\div \\mathop {\\lim }\\limits_{x \\to 1} \\frac{{{x^{10}} - 1}}{{x - 1}}{/tex}</span><br />
<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 1} \\frac{{{x^{15}} - {{(1)}^{15}}}}{{x - 1}} \\div \\mathop {\\lim }\\limits_{x \\to 1} \\frac{{{x^{10}} - {{(1)}^{10}}}}{{x - 1}}{/tex}</span><br />
&nbsp;= 15(1)<sup>14</sup> <span class="math-tex">{tex}\\div{/tex}</span> 10(1)<sup>9</sup> [<span class="math-tex">{tex}\\because {\\mathop {\\lim }\\limits_{x \\to a} \\frac{{{x^n} - {a^n}}}{{x - a}}}{/tex}</span>&nbsp;= na<sup>n - 1</sup>]<br />
=&nbsp;<span class="math-tex">{tex}\\frac { 15 } { 10 } = \\frac { 3 } { 2 }{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(2)</span></div><div class="question-text"><p>Find the limit&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\sqrt {1 + x} - 1}}{x}.{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Put y = 1 + x, then y&nbsp;<span class="math-tex">{tex}\\rightarrow{/tex}</span>&nbsp;1 as x&nbsp;<span class="math-tex">{tex}\\rightarrow{/tex}</span>&nbsp;0.<br />
<span class="math-tex">{tex}\\therefore \\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\sqrt {1 + x} - 1}}{x} = \\mathop {\\lim }\\limits_{y \\to 1} \\frac{{\\sqrt y - 1}}{{y - 1}}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{y \\to 1} \\frac{{{y^{\\frac{1}{2}}} - {1^{\\frac{1}{2}}}}}{{y - 1}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{1}{2}{(1)^{\\frac{1}{2} - 1}}\\left[ {\\because \\mathop {\\lim }\\limits_{x \\to a} \\frac{{{x^n} - {a^n}}}{{x - a}} = n{a^{n - 1}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\frac { 1 } { 2 }{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(1)</span></div><div class="question-text"><p>Evaluate&nbsp;<span class="math-tex">{tex}\\lim _\\limits{x \\rightarrow 0} \\frac{\\sin 4 x}{\\sin 2 x}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,</p>

<p><span class="math-tex">{tex}\\lim _{x \\rightarrow 0} \\frac{\\sin 4 x}{\\sin 2 x}{/tex}</span>&nbsp;<span class="math-tex">{tex}=\\lim _{x \\rightarrow 0}\\left[\\frac{\\sin 4 x}{4 x} \\cdot \\frac{2 x}{\\sin 2 x} \\cdot 2\\right]{/tex}</span><br />
<span class="math-tex">{tex}=2 \\cdot \\lim _{x \\rightarrow 0}\\left[\\frac{\\sin 4 x}{4 x}\\right] \\div\\left[\\frac{\\sin 2 x}{2 x}\\right]{/tex}</span><br />
<span class="math-tex">{tex}=2 \\cdot \\lim _{4 x \\rightarrow 0}\\left[\\frac{\\sin 4 x}{4 x}\\right] \\div \\lim _{2 x \\rightarrow 0}\\left[\\frac{\\sin 2 x}{2 x}\\right]{/tex}</span><br />
<span class="math-tex">{tex}=2.1 ÷1=2(\\text { as } x \\rightarrow 0,4 x \\rightarrow 0 \\text { and } 2 x \\rightarrow 0){/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(2)</span></div><div class="question-text"><p>Evaluate&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\tan x}}{x}{/tex}</span></p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\tan x}}{x} = \\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\sin x}}{x} \\cdot \\frac{1}{{\\cos x}}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{x \\to 0} \\left( {\\frac{{\\sin x}}{x}} \\right) \\cdot \\mathop {\\lim }\\limits_{x \\to 0} \\left( {\\frac{1}{{\\cos x}}} \\right){/tex}</span><br />
<span class="math-tex">{tex}\\left[\\because {\\mathop {\\lim }\\limits_{x \\to a} f(x)g(x) = \\mathop {\\lim }\\limits_{x \\to a} f(x)\\mathop {\\lim }\\limits_{x \\to a} g(x)} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= 1 \\times \\frac { 1 } { \\cos 0 } = 1 \\times \\frac { 1 } { 1 } = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the derivative at x = 2 of the function f(x) = 3x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have&nbsp;<span class="math-tex">{tex}f^{\\prime}(2)=\\lim _{h \\rightarrow 0} \\frac{f(2+h)-f(2)}{h}=\\lim _{h \\rightarrow 0} \\frac{3(2+h)-3(2)}{h}{/tex}</span></p>

<p><span class="math-tex">{tex}=\\lim _{h \\rightarrow 0} \\frac{6+3 h-6}{h}=\\lim _{h \\rightarrow 0} \\frac{3 h}{h}=\\lim _{h \\rightarrow 0} 3=3{/tex}</span></p>

<p>Therefore, derivative of the function 3x at x = 2 is 3.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find the derivative of the function f(x) = 2x<sup>2</sup> + 3x - 5 at x = - 1. Also, prove that f&#39;(0) + 3f&#39;(-1) = 0.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>First, we find the derivatives of f(x ) at x = -1 and x = 0. We have,<br />
<span class="math-tex">{tex}{f^\\prime }( - 1) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{f( - 1 + h) - f( - 1)}}{h}{/tex}</span><br />
<span class="math-tex">{tex}\\left[ {\\because {f^\\prime }(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{f(x + h) - f(x)}}{h}} \\right]{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\left[ {2{{( - 1 + h)}^2} + 3( - 1 + h) - 5} \\right] - \\left[ {2{{( - 1)}^2} + 3( - 1) - 5} \\right]}}{h}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\left[ {2\\left( {1 + {h^2} - 2h} \\right) - 3 + 3h - 5} \\right] - [2 - 3 - 5\\} }}{h}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{2{h^2} - h}}{h} = \\mathop {\\lim }\\limits_{h \\to 0} (2h - 1){/tex}</span>= 2(0) - 1 = -1<br />
and&nbsp;<span class="math-tex">{tex}{f^\\prime }(0) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{f(0 + h) - f(0)}}{h}{/tex}</span><br />
<span class="math-tex">{tex}\\left[ {\\because {f^\\prime }(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{f(x + h) - f(x)}}{h}} \\right]{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\left[ {2{{(0 + h)}^2} + 3(0 + h) - 5} \\right] - \\left[ {2{{(0)}^2} + 3(0) - 5} \\right]}}{h}{/tex}</span><br />
<span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{2{h^2} + 3h}}{h}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} (2h + 3){/tex}</span><br />
= 2(0) + 3 = 3<br />
Now, f&#39;(0) + 3f&#39;(-1) = 3 - 3 = 0.<br />
Hence proved.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the derivative of sin x at x = 0.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let f(x) = sin x. Therefore,<br />
<span class="math-tex">{tex}f^{\\prime}(0)=\\lim _{h \\rightarrow 0} \\frac{f(0+h)-f(0)}{h}{/tex}</span><br />
<span class="math-tex">{tex}=\\lim _{h \\rightarrow 0} \\frac{\\sin (0+h)-\\sin (0)}{h}=\\lim _{h \\rightarrow 0} \\frac{\\sin h}{h}=1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the derivative of f(x) = 3 at x = 0 and at x = 3.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let f(x)=3<br />
<span class="math-tex">{tex}f^{\\prime}(0)=\\lim _{h \\rightarrow 0} \\frac{f(0+h)-f(0)}{h}=\\lim _{h \\rightarrow 0} \\frac{3-3}{h}=\\lim _{h \\rightarrow 0} \\frac{0}{h}=0{/tex}</span><br />
Similarly&nbsp;<span class="math-tex">{tex}f^{\\prime}(3)=\\lim _{h \\rightarrow 0} \\frac{f(3+h)-f(3)}{h}=\\lim _{h \\rightarrow 0} \\frac{3-3}{h}=0{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the derivative of f(x) = 10x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>&nbsp;f&prime; ( x) =&nbsp;<span class="math-tex">{tex}\\lim _{h \\rightarrow 0} \\frac{f(x+h)-f(x)}{h}{/tex}</span><br />
<span class="math-tex">{tex}=\\lim _{h \\rightarrow 0} \\frac{10(x+h)-10(x)}{h}{/tex}</span><br />
<span class="math-tex">{tex}=\\lim _{h \\rightarrow 0} \\frac{10 h}{h}=\\lim _{h \\rightarrow 0}(10)=10{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Find the derivative of f(x) = x<sup>2</sup>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>&nbsp;f &prime;(x) =&nbsp;<span class="math-tex">{tex}\\lim _{h \\rightarrow 0} \\frac{f(x+h)-f(x)}{h}{/tex}</span><br />
<span class="math-tex">{tex}=\\lim _{h \\rightarrow 0} \\frac{(x+h)^{2}-(x)^{2}}{h}=\\lim _{h \\rightarrow 0}(h+2 x)=2 x{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Find the derivative of the constant function f (x) = a for a fixed real number a.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>&nbsp;f &prime;(x) =&nbsp;<span class="math-tex">{tex}\\lim _{h \\rightarrow 0} \\frac{f(x+h)-f(x)}{h}{/tex}</span><br />
<span class="math-tex">{tex}=\\lim _{h \\rightarrow 0} \\frac{a-a}{h}=\\lim _{h \\rightarrow 0} \\frac{0}{h}=0 \\text { as } h \\neq 0{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Find the derivative of <span class="math-tex">{tex}f ( x ) = \\frac { 1 } { x }{/tex}</span></p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,&nbsp;<span class="math-tex">{tex}f ( x ) = \\frac { 1 } { x }{/tex}</span><br />
By using the first principle,<br />
<span class="math-tex">{tex}f ^ { \\prime } ( x ) = \\lim _ { h \\rightarrow 0 } \\frac { f ( x + h) - f ( x ) } { h }{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\quad {f^\\prime }(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\frac{1}{{x + h}} - \\frac{1}{x}}}{h}{/tex}</span>&nbsp;<span class="math-tex">{tex}\\left[ {\\begin{array}{*{20}{c}} {\\because f(x) = \\frac{1}{x}} \\\\ {\\therefore f(x + h) = \\frac{1}{{x + h}}} \\end{array}} \\right]{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{1}{h}\\left[ {\\frac{{x - (x + h)}}{{x(x + h)}}} \\right] = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{1}{h}\\left[ {\\frac{{ - h}}{{x(x + h)}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\left[ {\\frac{{ - 1}}{{x(x + h)}}} \\right] = \\frac{{ - 1}}{{{x^2}}}{/tex}</span></p></div></div></div>
`;

export const EX12_1_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Evaluate <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 3} x + 3{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 3} x + 3{/tex}</span> = 3 + 3 = 6</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Evaluate&nbsp;<span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow \\pi}\\left(x-\\frac{22}{7}\\right){/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,&nbsp;<span class="math-tex">{tex} \\lim \\limits_{x \\rightarrow \\pi}\\left(x-\\frac{22}{7}\\right)=\\left(\\pi-\\frac{22}{7}\\right){/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Evaluate <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{r \\to 1}\\pi {r^2}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{r \\to 1}\\pi {r^2}{/tex}</span> <span class="math-tex">{tex} = \\pi \\times {(1)^2} = \\pi{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Evaluate&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 4} \\frac{{4x + 3}}{{x - 2}}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 4} \\frac{{4x + 3}}{{x - 2}} = \\frac{{4 \\times 4 + 3}}{{4 - 2}} = \\frac{{19}}{2}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Evaluate <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to - 1} \\frac{{{x^{10}} + {x^5} + 1}}{{x - 1}}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to - 1} \\frac{{{x^{10}} + {x^5} + 1}}{{x - 1}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{{{( - 1)}^{10}} + {{( - 1)}^5} + 1}}{{ - 1 - 1}} = \\frac{{1 - 1 + 1}}{{ - 2}} = \\frac{{ - 1}}{2}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Evaluate&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{{{(X + 1)}^5} - 1}}{x}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{{{(X + 1)}^5} - 1}}{x}{/tex}</span><br />
<span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{x \\to 0} \\frac{{{{(X + 1)}^5} - 1}}{{(x + 1) - 1}}{/tex}</span><br />
Putting x + 1 = y, as <span class="math-tex">{tex}x \\to 0,\\;y \\to 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\;\\mathop {\\lim }\\limits_{y \\to 0} \\frac{{{y^5} - 1}}{{y - 1}} = 5.{(1)^{5 - 1}}{/tex}</span><br />
<span class="math-tex">{tex}= 5 \\times 1 = 5\\left[ {\\because \\;\\mathop {\\lim }\\limits_{x \\to a} \\frac{{{x^n} - {a^n}}}{{x - a}} = n \\cdot {a^{n - 1}}} \\right]{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Evaluate <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 2} \\frac{{3{x^2} - x - 10}}{{{x^2} - 4}}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 2} \\frac{{3{x^2} - x - 10}}{{{x^2} - 4}}\\left[ {\\frac{0}{0}{\\text{from}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{x \\to 2} \\frac{{(x - 2)(3x + 5)}}{{(x + 2)(x - 2)}}{/tex}</span><br />
<span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{x \\to 2} \\frac{{3x +5}}{{x + 2}} = \\frac{{6 + 5}}{{2 + 2}} = \\frac{{11}}{4}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Evaluate&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 3} \\frac{{{x^4} - 81}}{{2{x^2} - 5x - 3}}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 3} \\frac{{{x^4} - 81}}{{2{x^2} - 5x - 3}}\\left[ {\\frac{0}{0}{\\text{from}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{x \\to 3} \\frac{{({x^2} + 9)(x + 3)(x - 3)}}{{(x - 3)(2x + 1)}}{/tex}</span><br />
<span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{x \\to 3} \\frac{{({x^2} + 9)(x + 3)}}{{(2x + 1)}} = \\frac{{({3^2} + 9)(3 + 3)}}{{(2 \\times 3 + 1)}} = \\frac{{108}}{7}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Evaluate&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{ax + b}}{{cx + 1}}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{ax + b}}{{cx + 1}} = \\frac{{a \\times 0 + b}}{{c \\times 0 + 1}} = \\frac{b}{1} = b{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Evaluate <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{z \\to 1} \\frac{z^{\\frac{1}{3}}-1}{z^{\\frac{1}{6}}-1}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{z \\to 1} \\frac{{{z^{1/3}} - 1}}{{{z^{1/6}} - 1}}\\left[ {\\frac{0}{0}{\\text{form}}} \\right]{/tex}</span><br />
Let us suppose&nbsp;<span class="math-tex">{tex}z^{\\frac{1}{6}}{/tex}</span>&nbsp;be x then,<br />
<span class="math-tex">{tex}(z^{\\frac{1}{6}})^2{/tex}</span>&nbsp;= x<sup>2</sup><br />
<span class="math-tex">{tex}z^{\\frac{1}{3}}{/tex}</span>&nbsp;= x<sup>2</sup><br />
Substituting&nbsp;<span class="math-tex">{tex}z^{\\frac{1}{3}}{/tex}</span>&nbsp;= x<sup>2</sup>&nbsp;in the given limit to get,<br />
<span class="math-tex">{tex}\\lim _\\limits{x \\rightarrow 1} \\frac{x^2-1}{x-1}=\\frac{x^2-1^2}{x-1}{/tex}</span><br />
Using the formula&nbsp;<span class="math-tex">{tex}\\lim _\\limits{x \\rightarrow a} \\frac{x^n-a^n}{x-a}{/tex}</span>&nbsp;= na<sup>n-1</sup>&nbsp;to get,<br />
<span class="math-tex">{tex}\\lim _\\limits{x \\rightarrow 1} \\frac{x^2-1^2}{x-1}{/tex}</span>&nbsp;= 2(1)<sup>2-1</sup><br />
<span class="math-tex">{tex}\\lim _\\limits{x \\rightarrow 1} \\frac{x^2-1^2}{x-1}{/tex}</span> = 2.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Evaluate&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 1} \\frac{{a{x^2} + bx + c}}{{c{x^2} + bx + a}},\\;a + b + c \\ne 0{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 1} \\frac{{a{x^2} + bx + c}}{{c{x^2} + bx + a}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{a \\times {{(1)}^2} + b \\times 1 + c}}{{c \\times {{(1)}^2} + b \\times 1 + a}} = \\frac{{a + b + c}}{{c + b + a}} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Evaluate <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to - 2} \\frac{{\\frac{1}{x} + \\frac{1}{2}}}{{x + 2}}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to - 2} \\frac{{\\frac{1}{x} + \\frac{1}{2}}}{{x + 2}}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{x \\to - 2} \\frac{{\\frac{{x + 2}}{{2x}}}}{{x + 2}}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{x \\to - 2} \\frac{{x + 2}}{{2x}} \\times \\frac{1}{{x + 2}}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{x \\to - 2} \\frac{1}{{2x}} = \\frac{1}{{2 \\times - 2}} = \\frac{{ - 1}}{4}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>Evaluate&nbsp;<span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow 0} \\frac{\\sin a x}{b x}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>&nbsp;Given,&nbsp;<span class="math-tex">{tex}\\lim _{x \\rightarrow 0} \\frac{\\sin a x}{b x}{/tex}</span><br />
<span class="math-tex">{tex}{/tex}</span>Applying the limits in the given expression we get,<span class="math-tex">{tex}\\lim _{x \\rightarrow 0} \\frac{\\sin a x}{b x}=\\frac{0}{0}{/tex}</span><br />
Multiplying and dividing the given expression by a we get,<br />
<span class="math-tex">{tex}\\Rightarrow \\lim _{x \\rightarrow 0} \\frac{\\sin a x}{b x} \\times \\frac{a}{a}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\lim _{x \\rightarrow 0} \\frac{\\sin a x}{a x} \\times \\frac{a}{b}{/tex}</span><br />
We know that:&nbsp;&nbsp;<span class="math-tex">{tex}\\lim _{x \\rightarrow 0} \\frac{\\sin x}{x}=1{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{a}{b} \\lim _{a x \\rightarrow 0} \\frac{\\sin a x}{a x}=\\frac{a}{b} \\times 1=\\frac{a}{b}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>Evaluate <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\sin ax}}{{\\sin bx}},\\;a,\\;b \\ne 0{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\sin ax}}{{\\sin bx}}{/tex}</span><span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{x \\to 0} \\left[ {\\frac{{\\sin ax}}{{ax}} \\times ax \\times \\frac{1}{{\\frac{{\\sin bx}}{{bx}} \\times bx}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{x \\to 0} \\left[ {\\frac{{\\sin ax}}{{ax}} \\times \\frac{1}{{\\frac{{sinbx}}{{bx}}}} \\times \\frac{{ax}}{{bx}}} \\right] = \\frac{a}{b}{/tex}</span><span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\left[ {\\frac{{\\sin ax}}{{ax}}\\frac{1}{{\\frac{{\\sin bx}}{{bx}}}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{a}{b} \\times 1 \\times 1 = \\frac{a}{b}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 15</span></div><div class="question-text"><p>Evaluate <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to \\pi } \\frac{{\\sin (\\pi - x)}}{{\\pi (\\pi - x)}}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let y=&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to \\pi } \\frac{{\\sin (\\pi - x)}}{{\\pi (\\pi - x)}}\\left[ {\\frac{0}{0}{\\text{from}}} \\right]{/tex}</span><br />
Put <span class="math-tex">{tex}x = \\pi + y{/tex}</span>, as&nbsp;<span class="math-tex">{tex}x \\to \\pi ,\\;y \\to 0{/tex}</span><br />
<span class="math-tex">{tex}\\therefore y=\\;\\mathop {\\lim }\\limits_{y \\to 0} \\frac{{\\sin [\\pi - \\pi - y]}}{{\\pi [\\pi - \\pi - y]}}=\\mathop {\\lim }\\limits_{y \\to 0} \\frac{{\\sin ( - y)}}{{ - \\pi y}}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{y \\to 0} \\frac{{ - \\sin y}}{{ - \\pi y}} = \\frac{1}{\\pi }\\mathop {\\lim }\\limits_{y \\to 0} \\frac{{\\sin y}}{y} = \\frac{1}{\\pi } \\times1 = \\frac{1}{\\pi }{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 16</span></div><div class="question-text"><p>Evaluate&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\cos x}}{{\\pi - x}}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\cos x}}{{\\pi  - x}} = \\frac{{\\cos 0}}{{\\pi  - 0}} = \\frac{1}{\\pi }{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 17</span></div><div class="question-text"><p>Evaluate:&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\cos 2x - 1}}{{\\cos x - 1}}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have&nbsp;<span class="math-tex">{tex}\\lim \\limits_{x \\rightarrow 0} \\frac{\\cos 2 x-1}{\\cos x-1}{/tex}</span><br />
At x = 0, the value of the given function takes the form&nbsp;<span class="math-tex">{tex}\\frac 00{/tex}</span><br />
Now,<br />
<span class="math-tex">{tex}=\\lim \\limits_{x \\rightarrow 0} \\frac{\\cos 2 x-1}{\\cos x-1}{/tex}</span><br />
<span class="math-tex">{tex}=\\lim \\limits_{x \\rightarrow 0} \\frac{1-2 \\sin ^2 x-1}{1-2 \\sin ^2 \\frac{x}{2}-1}\\left\\{\\cos 2 x=1-2 \\sin ^2 x\\right\\}{/tex}</span><br />
<span class="math-tex">{tex}=\\lim \\limits_{x \\rightarrow 0} \\frac{\\sin ^2 x}{\\sin ^2\\left(\\frac{x}{2}\\right)}{/tex}</span><br />
<span class="math-tex">{tex}=\\lim \\limits_{x \\rightarrow 0} \\frac{\\left(\\frac{\\sin x^2}{x}\\right) \\times x^2}{\\left(\\frac{\\sin \\left(\\frac{x}{2}\\right)}{\\left(\\frac{x}{2}\\right)}\\right)^2 \\times \\frac{x^2}{4}}{/tex}</span><br />
<span class="math-tex">{tex}=\\frac{4 \\lim \\limits_{x \\rightarrow 0} \\frac{(\\sin x)^2}{x}}{\\lim \\limits_{x \\rightarrow 0}\\left(\\frac{\\sin \\left(\\frac{x}{2}\\right)}{\\left(\\frac{x}{2}\\right)}\\right)^2}\\left\\{\\lim \\limits_{x \\rightarrow 0} \\frac{\\sin x}{x}=1\\right\\}{/tex}</span><br />
<span class="math-tex">{tex}=\\frac{4 \\times 1}{1}=4{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 18</span></div><div class="question-text"><p>Evaluate&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{ax + x\\cos x}}{{b\\sin x}}.{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{ax + x\\cos x}}{{b\\sin x}} = \\mathop {\\lim }\\limits_{x \\to 0} \\left( {\\frac{{ax}}{{b\\sin x}} + \\frac{{x\\cos x}}{{b\\sin x}}} \\right){/tex}</span><br />
<span class="math-tex">{tex} = \\frac{a}{b}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{x}{{\\sin x}} + \\frac{1}{b}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{x\\cos x}}{{\\sin x}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{a}{b}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{1}{{\\left( {\\frac{{\\sin x}}{x}} \\right)}} + \\frac{1}{b}\\mathop {\\lim }\\limits_{bx \\to 0} \\frac{{\\cos x}}{{\\left( {\\frac{{\\sin x}}{x}} \\right)}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{a}{b}\\frac{{\\mathop {\\lim }\\limits_{x \\to 0} 1}}{{\\mathop {\\lim }\\limits_{x \\to 0} \\left( {\\frac{{\\sin x}}{x}} \\right)}} + \\frac{1}{b}\\frac{{\\mathop {\\lim }\\limits_{x \\to 0} \\cos x}}{{\\mathop {\\lim }\\limits_{x \\to 0} \\left( {\\frac{{\\sin x}}{x}} \\right)}}{/tex}</span><span class="math-tex">{tex}\\left[\\because {\\mathop {\\lim }\\limits_{x \\to a} \\frac{{f(x)}}{{g(x)}} = \\frac{{\\mathop {\\lim }\\limits_{x \\to a} f(x)}}{{\\mathop {\\lim }\\limits_{x \\to a} g(x)}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{a}{b} \\times \\frac{1}{1} + \\frac{1}{b} \\times \\frac{1}{1}{/tex}</span><span class="math-tex">{tex}\\left[\\because {\\mathop {\\lim }\\limits_{\\theta \\to 0} \\frac{{\\sin \\theta }}{\\theta } = 1} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\frac { a + 1 } { b }{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 19</span></div><div class="question-text"><p>Evaluate <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} x\\sec x{/tex}</span></p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} x\\sec x{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{x \\to 0} x \\times \\frac{1}{{\\cos x}}\\rightarrow\\mathop {\\lim }\\limits_{x \\to 0} \\frac{x}{{\\cos x}} = \\frac{0}{1} = 0{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 20</span></div><div class="question-text"><p>Evaluate&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\sin ax + bx}}{{ax + \\sin bx}};{/tex}</span>&nbsp;a, b, a + b&nbsp;<span class="math-tex">{tex}\\neq{/tex}</span>&nbsp;0.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,<br />
<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\sin ax + bx}}{{ax + \\sin bx}} = \\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\frac{{\\sin ax}}{x} + \\frac{{bx}}{x}}}{{\\frac{{ax}}{x} + \\frac{{\\sin bx}}{x}}}{/tex}</span><br />
[dividing both numerator and denominator by x]<br />
<span class="math-tex">{tex} = \\frac{{\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\sin (ax)}}{{ax}} \\times a + \\mathop {\\lim }\\limits_{x \\to 0} b}}{{\\mathop {\\lim }\\limits_{x \\to 0} a + \\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\sin bx}}{{bx}} \\times b}}{/tex}</span><span class="math-tex">{tex}\\left[  {\\because \\mathop {\\lim }\\limits_{x \\to a} \\frac{{f(x)}}{{g(x)}} = \\frac{{\\mathop {\\lim }\\limits_{x \\to a} f(x)}}{{\\mathop {\\lim }\\limits_{x \\to a} g(x)}}{\\text{ and }}}  {\\mathop {\\lim }\\limits_{x \\to a} f(x) + g(x) = \\mathop {\\lim }\\limits_{x \\to a} f(x) + \\mathop {\\lim }\\limits_{x \\to a} g(x)}  \\right]{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{a\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\sin ax}}{{ax}} + \\mathop {\\lim }\\limits_{x \\to 0} b}}{{\\mathop {\\lim }\\limits_{x \\to 0} a + b\\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\sin bx}}{{bx}}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac { a ( 1 ) + b } { a + b ( 1 ) }{/tex}</span>&nbsp;<span class="math-tex">{tex}\\left[ {\\because \\mathop {\\lim }\\limits_{x \\to 0} \\frac{{\\sin x}}{x} = 1} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\frac { a + b } { a + b } = 1{/tex}</span></p></div></div></div>
`;

export const EX12_2_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Find the derivative of x<sup>2</sup> - 2 at x = 10</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}\\frac{d}{{dx}}({x^2} - 2){/tex}</span> = 2x - 0 = 2x<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Derivative of x<sup>2</sup> - 2 at x = 10 = 2&nbsp;&times; 10= 20</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Find the derivative of x at x = 1</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}\\frac{d}{{dx}}{/tex}</span>(x) = 1<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Derivative of x at x = 1</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Find the derivative of 99x at x = 100</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}\\frac{d}{{dx}}(99x) = 99{/tex}</span><br />
<span class="math-tex">{tex}\\therefore {/tex}</span> Derivative of 99x at x = 100 = 99</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(1)</span></div><div class="question-text"><p>Find the derivative of (x<sup>3</sup> - 27) from first principle.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have, f(x) = x<sup>3</sup> - 27<br />
By using first principle of derivative,<br />
<span class="math-tex">{tex}{f^\\prime }(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{f(x + h) - f(x)}}{h}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\quad {f^\\prime }(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\left[ {{{(x + h)}^3} - 27} \\right] - \\left[ {{x^3} - 27} \\right]}}{h}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{{x^3} + 3{x^2}h + 3{h^2}x + {h^3} - 27 - {x^3} + 27}}{h}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{3{x^2}h + 3x{h^2} + {h^3}}}{h}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0}{/tex}</span>&nbsp;( 3x<sup>2</sup>&nbsp;+ 3xh + h<sup>2</sup>) = 3x<sup>2</sup></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(2)</span></div><div class="question-text"><p>Find the derivative of (x - 1) (x - 2) from first principle.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,&nbsp;f(x) = (x - 1)(x - 2)<br />
= x<sup>2</sup> - 3x + 2<br />
By first principle of derivative, we have<br />
<span class="math-tex">{tex}{f^\\prime }(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{f(x + h) - f(x)}}{h}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\left[ {{{(x + h)}^2} - 3(x + h) + 2} \\right] - \\left[ {{x^2} - 3x + 2} \\right]}}{h}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\left[ {\\left( {{x^2} + {h^2} + 2xh - 3x - 3h + 2} \\right] - \\left[ {{x^2} - 3x + 2} \\right]} \\right.}}{h}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{2hx + {h^2} - 3h}}{h} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{h(2x + h - 3)}}{h}{/tex}</span><br />
<span class="math-tex">{tex}= 2 x - 3{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(3)</span></div><div class="question-text"><p>Find the derivative of <span class="math-tex">{tex}\\frac{1}{x^2}{/tex}</span> from first principle.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}{\\text{f}}(x) = \\frac{1}{{{x^2}}}{/tex}</span><br />
Then&nbsp;<span class="math-tex">{tex}{\\text{f}}(x + h) = \\frac{1}{{{{(x + h)}^2}}}{/tex}</span><br />
We know that&nbsp;<span class="math-tex">{tex}{\\text{f'}}(x) = \\mathop {\\lim }\\limits_{x \\to 0} \\frac{{f(x + h) - f(x)}}{h}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\;{\\text{f'}}(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\frac{1}{{{{(x + h)}^2}}} - \\frac{1}{{{x^2}}}}}{h}{/tex}</span><span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{{x^2} - {{(x + h)}^2}}}{{h{x^2}{{(x + h)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{{x^2} - {x^2} - {h^2} - 2xh}}{{h{x^2}{{(x + h)}^2}}} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{h( - h - 2x)}}{{h{x^2}{{(x + h)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{ - 2x}}{{{x^2} \\times {x^2}}} = \\frac{{ - 2}}{{{x^3}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(4)</span></div><div class="question-text"><p>Find the derivative of&nbsp;<span class="math-tex">{tex}\\left( \\frac { x + 1 } { x - 1 } \\right){/tex}</span> from the first principle.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,&nbsp;<span class="math-tex">{tex}f ( x ) = \\frac { x + 1 } { x - 1 }{/tex}</span><br />
By first principle of derivative, we have<br />
<span class="math-tex">{tex}{f^\\prime }(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{f(x + h) - f(x)}}{h}{/tex}</span><span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\left[ {\\frac{{(x + h) + 1}}{{(x + h) - 1}} - \\frac{{x + 1}}{{x - 1}}} \\right]}}{h}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{(x + h + 1)(x - 1) - (x + 1)(x + h - 1)}}{{h(x + h - 1)(x - 1)}}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\left( {{x^2} + xh - h - 1} \\right) - \\left( {{x^2} + xh + h - 1} \\right)}}{{h(x + h - 1)(x - 1)}}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{ - 2h}}{{h(x + h - 1)(x - 1)}}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{ - 2}}{{(x + h - 1)(x - 1)}} = \\frac{{ - 2}}{{{{(x - 1)}^2}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>For the function <span class="math-tex">{tex}f(x) = \\frac{{{x^{100}}}}{{100}} + \\frac{{{x^{99}}}}{{99}} + ... + \\frac{{{x^2}}}{2} + x + 1{/tex}</span> prove that f&#39;(1) = 100f&#39;(0)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}f(x) = \\frac{{{x^{100}}}}{{100}} + \\frac{{{x^{99}}}}{{99}} + ... + \\frac{{{x^2}}}{2} + x + 1{/tex}</span><br />
<span class="math-tex">{tex}f{\\text{'}}(x) = \\frac{d}{{dx}}\\left[ {\\frac{{{x^{100}}}}{{100}} + \\frac{{{x^{99}}}}{{99}} + ... + \\frac{{{x^2}}}{2} + x + 1} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{1}{{100}}\\frac{d}{{dx}}({x^{100}}) + \\frac{1}{{99}}\\frac{d}{{dx}}({x^{99}}) + ... + \\frac{1}{2}\\frac{d}{{dx}}({x^2}) + \\frac{d}{{dx}}(x) + \\frac{d}{{dx}}(1){/tex}</span><br />
<span class="math-tex">{tex}= \\frac{1}{{100}} \\times 100{x^{99}} + \\frac{1}{{99}} \\times 99{x^{98}} + ... + \\frac{1}{2} \\times 2x + 1 + 0{/tex}</span><br />
= x<sup>99</sup> + x<sup>98</sup> + ... + x + 1<br />
Now f&#39;(1) = (1)<sup>99</sup> + (1)<sup>98</sup> + ...+(1) + 1 = 100<br />
f&#39;(0) = (0)<sup>99</sup> + (0)<sup>98</sup> + ...+ 0 + 1 = 1<br />
Which shows that f&#39;(1) = 100f&#39;(0)</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find the derivative of x<sup>n</sup> + ax<sup>n-1</sup> + a<sup>2</sup>x<sup>n-2</sup> + ...+ a<sup><span style="font-size: 10.8333px;">n</span>-1</sup> x&nbsp;+ a<sup>n</sup> for some fixed real number a.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let f(x)&nbsp;= x<sup>n</sup> + ax<sup>n-1</sup> + a<sup>2</sup>x<sup>n-2</sup> + .... + a<sup>n- 1&nbsp;</sup>x + a<sup>n</sup><br />
On differentiating both sides, we get<br />
f&#39;(x) = nx<sup>n-1</sup> + a(n - 1)x<sup>n-2</sup> + a<sup>2</sup>(n - 2)x<sup>n-3</sup> + .... + a<sup>n-1</sup>.1&nbsp;+ 0<br />
On putting x = a both sides, we get<br />
f&#39;(a) = na<sup>n-1</sup> + a(n - 1)a<sup>n-2</sup> + a<sup>2</sup> (n - 2)a<sup>n-3</sup> +...+ a<sup>n-1</sup><br />
= n a<sup>n-1</sup> + (n - 1) a<sup>n-1</sup> + (n - 2) a<sup>n-1</sup> + ... + a<sup>n-1</sup><br />
= a<sup>n-1</sup>&nbsp;[n + (n - 1) + (n - 2) + .... + 1]<br />
[<span class="math-tex">{tex}\\because{/tex}</span>&nbsp;sum of n natural numbers&nbsp;<span class="math-tex">{tex}= \\frac { n ( n + 1 ) } { 2 }{/tex}</span>]<br />
f&#39;(a)<span class="math-tex">{tex}= \\frac { n ( n + 1 ) } { 2 }\\; a ^ { n - 1 }{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7(1)</span></div><div class="question-text"><p>For some constants a and b, find the derivative of (x - a)(x - b)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f (x) = (x - a)(x - b)<br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}(x - a)(x - b){/tex}</span><br />
<span class="math-tex">{tex} = (x - a)\\frac{d}{{dx}}(x - b) + (x - b)\\frac{d}{{dx}}(x - a){/tex}</span><br />
= (x - a) &times; 1 + (x - b) &times; 1<br />
= x - a + x - b = 2x - a - b</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7(2)</span></div><div class="question-text"><p>For some constants a and b, find the derivative of&nbsp;(ax<sup>2</sup> + b)<sup>2</sup></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f (x) = (ax<sup>2</sup> + b)<sup>2</sup> = a<sup>2</sup>x<sup>4</sup> + b<sup>2</sup> + 2abx<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}[{a^2}{x^4} + {b^2} + 2ab{x^2}]{/tex}</span><br />
<span class="math-tex">{tex} = {a^2}\\frac{d}{{dx}}({x^4}) + \\frac{d}{{dx}}({b^2}) + 2ab\\frac{d}{{dx}}({x^2}){/tex}</span><br />
= a<sup>2</sup> &times; 4x<sup>3</sup> + 0 + 2ab &times; 2x<br />
= 4a<sup>2</sup>x<sup>3</sup> + 4abx<br />
= 4ax(ax<sup>2</sup> + b)</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7(3)</span></div><div class="question-text"><p>For some constants, a and b, find the derivative of f(x)&nbsp;<span class="math-tex">{tex}= \\frac{{x - a}}{{x - b}}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f (x) <span class="math-tex">{tex}= \\frac{{x - a}}{{x - b}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}\\left( {\\frac{{x - a}}{{x - b}}} \\right){/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{(x - b)\\frac{d}{{dx}}(x - a) - (x - a)\\frac{d}{{dx}}(x - b)}}{{{{(x - b)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{(x - b) \\times 1 - (x - a) \\times 1}}{{{{(x - b)}^2}}} = \\frac{{x - b - x + a}}{{{{(x - b)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{a - b}}{{{{(x - b)}^2}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the derivative of <span class="math-tex">{tex}\\frac{{{x^n} - {a^n}}}{{x - a}}{/tex}</span> for some constant a.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}f(x)\\frac{{{x^n} - {a^n}}}{{x - a}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\;f(x) = \\frac{d}{{dx}}\\left[ {\\frac{{{x^n} - {a^n}}}{{x - a}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{(x - a)\\frac{d}{{dx}}({x^n} - {a^n}) - ({x^n} - {a^n})\\frac{d}{{dx}}(x - a)}}{{{{(x - a)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{(x - a) \\times n{x^{n - 1}} - ({x^n} - {a^n}) \\times 1}}{{{{(x - a)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{n{x^n} - an{x^{n - 1}} - {x^n} + {a^n}}}{{{{(x - a)}^2}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9(1)</span></div><div class="question-text"><p>Find the derivative of <span class="math-tex">{tex}2x - \\frac{3}{4}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}f(x) = 2x - \\frac{3}{4}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}\\left( {2x - \\frac{3}{4}} \\right){/tex}</span><br />
<span class="math-tex">{tex}= 2\\frac{d}{{dx}}(x) - \\frac{d}{{dx}}\\left( {\\frac{3}{4}} \\right){/tex}</span><br />
= 2 &times; 1 - 0 = 2</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9(2)</span></div><div class="question-text"><p>Find the derivative of<br />
<span class="math-tex">{tex}\\left(5 x^{3}+3 x-1\\right)(x-1){/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let f(x) =&nbsp;<span class="math-tex">{tex}\\left(5 x^{3}+3 x-1\\right)(x-1){/tex}</span><br />
By product rule of differentiation,we have,<br />
<span class="math-tex">{tex}f^{\\prime}(x)=\\left(5 x^{3}+3 x-1\\right) \\frac{d}{d x}(x-1){/tex}</span>&nbsp;+&nbsp;<span class="math-tex">{tex}(x-1) \\frac{d}{d x}\\left(5 x^{3}+3 x+1\\right){/tex}</span><br />
=&nbsp;(5x<sup>3&nbsp;</sup>+ 3x &minus; 1) <span class="math-tex">{tex}\\times{/tex}</span> 1 + (x &minus; 1) <span class="math-tex">{tex}\\times{/tex}</span> (15x<sup>2&nbsp;</sup>+ 3)<br />
=&nbsp;(5x<sup>3&nbsp;</sup>+ 3x &minus; 1) <span class="math-tex">{tex}+{/tex}</span>&nbsp;(x &minus; 1) <span class="math-tex">{tex}\\times{/tex}</span> (15x<sup>2&nbsp;</sup>+ 3)<br />
=&nbsp;5x<sup>3&nbsp;</sup>+ 3x &minus; 1 + 15x<sup>3</sup> + 3x &minus; 15x<sup>2</sup> &minus; 3<br />
= 20x<sup>3</sup> - 15x<sup>2</sup> + 6x - 4</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9(3)</span></div><div class="question-text"><p>Find the derivative of x<sup>-3</sup> (5 + 3x)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f(x) = x<sup>-3</sup>(5 + 3x)<br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}[{x^{ - 3}}(5 + 3x)]{/tex}</span><br />
<span class="math-tex">{tex} = {x^{ - 3}}\\frac{d}{{dx}}(5 + 3x) + (5 + 3x)\\frac{d}{{dx}}({x^{ - 3}}){/tex}</span><br />
= x<sup>-3</sup> &times; 3 + (5 + 3x)&nbsp;&times; (- 3x)<sup>-4</sup><br />
<span class="math-tex">{tex} = \\frac{3}{{{x^3}}} - \\frac{3}{{{x^4}}}(5 + 3x){/tex}</span><br />
<span class="math-tex">{tex} = \\frac{3}{{{x^3}}}\\left[ {1 - \\frac{{5 + 3x}}{x}} \\right]{/tex}</span><span class="math-tex">{tex} = \\frac{3}{{{x^3}}}\\left[ {\\frac{{x - 5 - 3x}}{x}} \\right] = \\frac{{ - 3}}{{{x^4}}}(5 + 2x){/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9(4)</span></div><div class="question-text"><p>Find the derivative of x<sup>5</sup> (3 - 6x<sup>-9</sup>)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f(x) = x<sup>5</sup> (3 - 6x<sup>-9</sup>)<br />
<span class="math-tex">{tex} = {x^5}\\frac{d}{{dx}}(3 - 6{x^{ - 9}}) + (3 - 6{x^{ - 9}})\\frac{d}{{dx}}({x^5}){/tex}</span><br />
= x<sup>5</sup>(54x<sup>-10</sup>) + (3 - 6x<sup>-9</sup>) &times; 5x<sup>4</sup><br />
= 54x<sup>-5</sup> + 15x<sup>4</sup> - 30x<sup>-5</sup><br />
= 24x<sup>-5</sup> + 15x<sup>4</sup><br />
<span class="math-tex">{tex}= \\frac{{24}}{{{x^5}}} + 15{x^4}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9(5)</span></div><div class="question-text"><p>Find the derivative of x<sup>-4</sup>(3 - 4x<sup>-5</sup>)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f(x) = x<sup>-4</sup> (3 - 4x<sup>-5</sup>)<br />
f&#39;(x) = <span class="math-tex">{tex}\\frac{d}{{dx}}{/tex}</span>[x<sup>-4</sup> (3 - 4x<sup>-5</sup>)]<br />
<span class="math-tex">{tex} = {x^{ - 4}}\\frac{d}{{dx}}(3 - 4{x^{ - 5}}) + (3 - 4{x^{ - 5}})\\frac{d}{{dx}}({x^{ - 4}}){/tex}</span><br />
= x<sup>-4</sup> (20x<sup>-6</sup>) + (3 - 4x<sup>-5</sup>) (-4x<sup>-5</sup>)<br />
= 20x<sup>-10</sup> - 12x<sup>-5</sup> + 16x<sup>-10</sup><br />
= 36x<sup>-10</sup> - 12x<sup>-5</sup> <span class="math-tex">{tex}= \\frac{{36}}{{{x^{10}}}} - \\frac{{12}}{{{x^5}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9(6)</span></div><div class="question-text"><p>Find the derivative of <span class="math-tex">{tex}\\frac{2}{{x + 1}} - \\frac{{{x^2}}}{{3x - 1}}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}f(x) = \\frac{2}{{x + 1}} - \\frac{{{x^2}}}{{3x - 1}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}\\left[ {\\frac{2}{{x + 1}} - \\frac{{{x^2}}}{{3x - 1}}} \\right]{/tex}</span><span class="math-tex">{tex}= \\frac{d}{{dx}}\\left( {\\frac{2}{{x + 1}}} \\right) - \\frac{d}{{dx}}\\left( {\\frac{{{x^2}}}{{3x - 1}}} \\right){/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{(x + 1)\\frac{d}{{dx}}(2) - 2\\frac{d}{{dx}}(x + 1)}}{{{{(x + 1)}^2}}}{/tex}</span><span class="math-tex">{tex}- \\frac{{(3x - 1)\\frac{d}{{dx}}({x^2}) - {x^2}\\frac{d}{{dx}}(3x - 1)}}{{{{(3x - 1)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{(x + 1) \\times 0 - 2 \\times 1}}{{{{(x + 1)}^2}}} - \\frac{{(3x - 1)(2x) - {x^2 } \\times 3}}{{{{(3x - 1)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{ - 2}}{{{{(x + 1)}^2}}} - \\frac{{6{x^2} - 2x - 3{x^2}}}{{{{(3x - 1)}^2}}}{/tex}</span><span class="math-tex">{tex} = \\frac{{ - 2}}{{{{(x + 1)}^2}}} - \\frac{{3{x^2} - 2x}}{{{{(3x - 1)}^2}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Find the derivative of cos x from first principle.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f (x) = cos x<br />
Then f (x + h) = cos (x + h)<br />
We know that&nbsp;<span class="math-tex">{tex}f{\\text{'}}(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{(x + h) - f(x)}}{h}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow f{\\text{'}}(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\cos (x + h) - \\cos x}}{h}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{ - 2\\sin \\left( {\\frac{{2x + h}}{2}} \\right)\\sin \\left( {\\frac{h}{2}} \\right)}}{h}{/tex}</span><br />
<span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} - \\sin \\left( {\\frac{{2x + h}}{2}} \\right).\\frac{{\\sin \\left( {\\frac{h}{2}} \\right)}}{{\\frac{h}{2}}}{/tex}</span><br />
= -sin x</p></div></div></div>
`;

export const MISC_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(1)</span></div><div class="question-text"><p>Find the derivative of function&nbsp;-x&nbsp;from first principle.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f (x) = -x<br />
Then (f(x + h) = -(x + h)<br />
We known that&nbsp;<span class="math-tex">{tex}\\mathop {\\lim }\\limits_{h \\to 0} \\frac{{ - (x + h) - ( - x)}}{h} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{ - x - h + x}}{h}{/tex}</span><br />
<span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{ - h}}{h} = - 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(2)</span></div><div class="question-text"><p>Find the derivative of&nbsp;function (-x)<sup>-1&nbsp;</sup>from first principle.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f(x) = (-x)<sup>-1</sup> = <span class="math-tex">{tex}- \\frac{1}{x}{/tex}</span><br />
Then f(x + h) =&nbsp;<span class="math-tex">{tex}- \\frac{1}{{x + h}}{/tex}</span><br />
We know that&nbsp;<span class="math-tex">{tex}f{\\text{'}}(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{f(x + h) - f(x)}}{h}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\;f{\\text{'}}(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{ - \\frac{1}{{x + h}} - \\left( { - \\frac{1}{x}} \\right)}}{h}{/tex}</span><span class="math-tex">{tex} = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{ - x + x + h}}{{hx(x + h)}}{/tex}</span><br />
<span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{h \\to 0} \\frac{h}{{hx(x + h)}} = \\frac{1}{{{x^2}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(3)</span></div><div class="question-text"><p>Find the derivative of function&nbsp;sin (x + 1)&nbsp;from first principle.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f (x) = sin (x + 1)<br />
Then f (x + h) = sin (x + h + 1)<br />
We know that <span class="math-tex">{tex}f{\\text{'}}(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{f(x + h) - f(x)}}{h}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\;f{\\text{'}}(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\sin (x + h + 1) - \\sin (x + 1)}}{h}{/tex}</span><br />
<span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{2\\cos \\left( {\\frac{{2x + h + 2}}{2}} \\right)\\sin \\left( {\\frac{h}{2}} \\right)}}{h}{/tex}</span><br />
<span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\cos \\left( {x + 1 + \\frac{h}{2}} \\right)\\sin \\left( {\\frac{h}{2}} \\right)}}{{\\left( {\\frac{h}{2}} \\right)}}{/tex}</span> = cos (x + 1)</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(4)</span></div><div class="question-text"><p>Find the derivative of function&nbsp;<span class="math-tex">{tex}f(x) = \\cos \\left( {x - \\frac{\\pi }{8}} \\right){/tex}</span>&nbsp;from first principle.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}f(x) = \\cos \\left( {x - \\frac{\\pi }{8}} \\right){/tex}</span><br />
<span class="math-tex">{tex}f(x) = \\cos \\left( {x - \\frac{\\pi }{8}} \\right){/tex}</span><br />
Then f (x + h) = <span class="math-tex">{tex}\\cos \\left( {x + h - \\frac{\\pi }{8}} \\right){/tex}</span><br />
We know that&nbsp; <span class="math-tex">{tex}f{\\text{'}}(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{f(x + h) - f(x)}}{h}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow f{\\text{'}}(x) = \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{\\cos \\left( {x + h - \\frac{\\pi }{8}} \\right) - \\cos \\left( {x - \\frac{\\pi }{8}} \\right)}}{h}{/tex}</span><br />
<span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{ - 2\\sin \\left( {x - \\frac{\\pi }{8} + \\frac{h}{2}} \\right)\\sin \\left( {\\frac{h}{2}} \\right)}}{h}{/tex}</span><span class="math-tex">{tex}= \\mathop {\\lim }\\limits_{h \\to 0} \\frac{{ - \\sin \\left( {x - \\frac{\\pi }{8} + \\frac{h}{2}} \\right) \\cdot \\sin \\left( {\\frac{h}{2}} \\right)}}{{\\left( {\\frac{h}{2}} \\right)}}{/tex}</span><br />
<span class="math-tex">{tex}= - \\sin \\left( {x - \\frac{\\pi }{8}} \\right){/tex}</span></p>

</div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Find the derivative of&nbsp;function&nbsp;(x + a)&nbsp;(it is to be understood that a, b, c, d, p, q, r, and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f(x) = x + a<br />
<span class="math-tex">{tex}\\therefore {\\text{f'}}(x) = \\frac{d}{{dx}}(x + a) = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Find the derivative of&nbsp;function&nbsp;(px + q)<span class="math-tex">{tex}\\left( {\\frac{r}{x} + s} \\right){/tex}</span>(it is to be understood that a, b, c, d, p, q, r, and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f (x) = (px + q)<span class="math-tex">{tex}\\left( {\\frac{r}{x} + s} \\right){/tex}</span><br />
<span class="math-tex">{tex}\\therefore f{\\text{'}}(x) = \\frac{d}{{dx}}[(px + q) \\left( {\\frac{r}{x} + s} \\right) ]{/tex}</span><br />
<span class="math-tex">{tex} \\style{font-family:Verdana}{\\style{font-size:8px}{\\begin{array}{l}=\\frac d{dx}\\left(pr+psx\\;+\\frac{qr}x+\\;sq\\right)\\\\=\\;\\frac d{dx}\\left(pr\\right)\\;+\\frac d{dx}\\left(psx\\right)\\;+\\frac d{dx}\\left(\\frac{qr}x\\right)\\;+\\frac d{dx}\\left(sq\\right)\\\\=\\;0\\;+ps(\\;1)\\;+qr\\;\\left(\\frac{-1}{x^2}\\right)\\;+0\\\\=ps\\;-\\;\\frac{qr}{x^2}\\end{array}}}{/tex}</span><br />
&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Find the derivative of function&nbsp;(ax + b)(cx + d)<sup>2&nbsp;</sup>(it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f(x) = (ax + b) (cx + d)<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}[(ax + b){(cx + d)^2}]{/tex}</span><br />
= (ax + b )&nbsp;<span class="math-tex">{tex}\\frac{d}{{dx}}{(cx + d)^2} + {(cx + d)^2} \\cdot \\frac{d}{{dx}}(ax + b){/tex}</span><br />
= (ax + b) &times; 2(cx + d) &times; c + (cx + d)<sup>2</sup> &times; a<br />
= 2c(ax + b)(cx + d) + a(cx + d)<sup>2</sup></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the derivative of function&nbsp;<span class="math-tex">{tex}\\frac{{ax + b}}{{cx + d}}{/tex}</span>&nbsp;(it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}f(x) = \\frac{{ax + b}}{{cx + d}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\;f'(x) = \\frac{d}{{dx}}\\left[ {\\frac{{ax + b}}{{cx + d}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{(cx + d)\\frac{d}{{dx}}(ax + b) - (ax + b)\\frac{d}{{dx}}(cx + d)}}{{{{(cx + d)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{(cx + d)(a) - (ax + b)(c)}}{{{{(cx + d)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{acx + ad - acx - bc}}{{{{(cx + d)}^2}}} = \\frac{{ad - bc}}{{{{(cx + d)}^2}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find the derivative of&nbsp;function&nbsp;<span class="math-tex">{tex}\\frac{{1 + \\frac{1}{x}}}{{1 - \\frac{1}{x}}}{/tex}</span> (it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}f(x) = \\frac{{1 + \\frac{1}{x}}}{{1 - \\frac{1}{x}}} = \\frac{{x + 1}}{{x - 1}}{/tex}</span><br />
<span class="math-tex">{tex}f{\\text{'}}(x) = \\frac{d}{{dx}}\\left[ {\\frac{{x + 1}}{{x - 1}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{(x - 1)\\frac{d}{{dx}}(x + 1) - (x + 1)\\frac{d}{{dx}}(x - 1)}}{{{{(x - 1)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{(x - 1) \\times 1 - (x + 1) \\times 1}}{{{{(x - 1)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{x - 1 - x - 1}}{{{{(x - 1)}^2}}} = \\frac{{ - 2}}{{{{(x - 1)}^2}}},\\;x \\ne 0,\\;1.{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the derivative of&nbsp;function&nbsp;<span class="math-tex">{tex}\\frac{1}{{a{x^2} + bx + c}}{/tex}</span>(it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}f(x) = \\frac{1}{{a{x^2} + bx + c}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}\\left( {\\frac{1}{{a{x^2} + bx + c}}} \\right){/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{(a{x^2} + bx + c)\\frac{d}{{dx}}(1) - 1.\\frac{d}{{dx}}(a{x^2} + bx + c)}}{{{{(a{x^2} + bx + c)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{(a{x^2} + bx + c)(0) - 1(2ax + b)}}{{{{(a{x^2} + bx + c)}^2}}}{/tex}</span><span class="math-tex">{tex} = \\frac{{ - (2ax + b)}}{{{{(a{x^2} + bx + c)}^2}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the derivative of function&nbsp;<span class="math-tex">{tex}\\frac{{ax + b}}{{p{x^2} + qx + r}}{/tex}</span>&nbsp;(it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><span class="math-tex">{tex}f(x) = \\frac{{ax + b}}{{p{x^2} + qx + r}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}\\left[ {\\frac{{ax + b}}{{p{x^2} + qx + r}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{(p{x^2} + qx + r)\\frac{d}{{dx}}(ax + b) - (ax + b)\\frac{d}{{dx}}(p{x^2} + qx + r)}}{{{{(p{x^2} + qx + r)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{(p{x^2} + qx + r)(a) - (ax + b)(2px + q)}}{{{{(p{x^2} + qx + r)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{ap{x^2} + aqx + ar - 2ap{x^2} - aqx - 2bpx - bq}}{{{{(p{x^2} + qx + r)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{ - ap{x^2} - 2bpx + ar - bq}}{{{{(p{x^2} + qx + r)}^2}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the derivative of function&nbsp;<span class="math-tex">{tex}\\frac{{p{x^2} + qx + r}}{{ax + b}}{/tex}</span>&nbsp;(it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}f(x) = \\frac{{p{x^2} + qx + r}}{{ax + b}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore f{\\text{'}}(x) = \\frac{d}{{dx}}\\left[ {\\frac{{p{x^2} + qx + r}}{{ax + b}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{(ax + b)\\frac{d}{{dx}}(p{x^2} + qx + r) - (p{x^2} + qx + r)\\frac{d}{{dx}}(ax + b)}}{{{{(ax + b)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{(ax + b)(2px + q) - (p{x^2} + qx + r)(a)}}{{{{(ax + b)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{2ap{x^2} + aqx + 2bpx + bq + ap{x^2} - aqx - ar}}{{{{(ax + b)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{ap{x^2} + 2bpx + bq - ar}}{{{{(ax + b)}^2}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Find the derivative of&nbsp;function&nbsp;<span class="math-tex">{tex}\\frac{a}{{{x^4}}} - \\frac{b}{{{x^2}}} + \\cos x{/tex}</span>&nbsp;(it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}f(x) = \\frac{a}{{{x^4}}} - \\frac{b}{{{x^2}}} + \\cos x = a{x^-4} - b{x^{ - 2}} + \\cos x{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}[a{x^{ - 4}} - b{x^2} + \\cos x]{/tex}</span><span class="math-tex">{tex}= a\\frac{d}{{dx}}({x^{ - 4}}) - b\\frac{d}{{dx}}({x^{ - 2}}) + \\frac{d}{{dx}}(\\cos x){/tex}</span><br />
<span class="math-tex">{tex} - a{x^{ - 5}} + 2b{x^{ - 3}} - \\sin x = \\frac{{ - 4a}}{{{x^5}}} + \\frac{{2b}}{{{x^3}}} - \\sin x{/tex}</span><br />
<span class="math-tex">{tex}- 4a{x^{ - 5}} + 2b{x^{ - 3}} - \\sin x = \\frac{{ - 4a}}{{{x^5}}} + \\frac{{2b}}{{{x^3}}} - \\sin x{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Find the derivative of&nbsp;function&nbsp;<span class="math-tex">{tex}4\\sqrt x - 2{/tex}</span>&nbsp;(it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}f(x) = 4\\sqrt x - 2{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}\\left[ {4\\sqrt x - 2} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= 4\\frac{d}{{dx}}(\\sqrt x ) - \\frac{d}{{dx}}(2){/tex}</span><br />
<span class="math-tex">{tex}= 4 \\times \\frac{1}{{2\\sqrt x }} - 0 = \\frac{2}{{\\sqrt x }}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Find the derivative of function&nbsp;(ax + b)<sup>n</sup>&nbsp;(it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><span class="math-tex">{tex}\\therefore f{\\text{'}}(x) = \\frac{d}{{dx}}[{(ax + b)^n}]{/tex}</span><br />
<span class="math-tex">{tex}= n{(ax + b)^{n - 1}} \\times \\frac{d}{{dx}}(ax + b){/tex}</span><br />
= n(ax + b)<sup>n-1</sup> &times; a = na(ax + b)<sup>n-1</sup></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>Find the derivative of&nbsp;function&nbsp;(ax + b)<sup>n</sup> (cx + d)<sup>m</sup>&nbsp;(it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f(x) = (ax + b)<sup>n</sup> (cx + d)<sup>m</sup><br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}[{(ax + b)^n}{(cx + d)^m}]{/tex}</span><br />
<span class="math-tex">{tex}= {(ax + b)^n}\\frac{d}{{dx}}{(cx + d)^m}+{(cx + d)^m}\\frac{d}{{dx}}{(ax + b)^n} {/tex}</span><br />
= (ax + b)<sup>n</sup> . m (cx + d)<sup>m-1</sup> . <span class="math-tex">{tex}\\frac{d}{{dx}}{/tex}</span>(cx + d) +(cx + d)<span class="math-tex">{tex}^m{/tex}</span> n(ax + b)<sup>n-1</sup> . <span class="math-tex">{tex}\\frac{d}{{dx}}{/tex}</span>(ax + b)<br />
= cm (ax + b)<sup>n</sup> (cx + d)<sup>m-1&nbsp;</sup>+ an (cx + d)<sup>m</sup> (ax + b)<sup>n-1</sup><br />
= (ax + b)<sup>n-1</sup> (cx +d)<sup>m-1</sup> [cm (ax + b) + an (cx +d)]</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>Find the derivative of&nbsp;function&nbsp;sin (x + a)&nbsp;(it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f (x) = sin (x + a)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> f&#39;(x) =&nbsp;<span class="math-tex">{tex}\\frac{d}{{dx}}{/tex}</span> [sin (x + a)]<br />
= cos (x + a). <span class="math-tex">{tex}\\frac{d}{{dx}}{/tex}</span>(x + a)<br />
= cos (x + a)</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 15</span></div><div class="question-text"><p>Find the derivative of function cosec x cot x (it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here f (x) = cosec x cot x<br />
<span class="math-tex">{tex}\\therefore {/tex}</span>&nbsp;f&#39;(x) = <span class="math-tex">{tex}\\frac{d}{{dx}}{/tex}</span> [cosec x cot x]<br />
= cosec x&nbsp;<span class="math-tex">{tex}\\frac{d}{{dx}}{/tex}</span> (cot x) + cot x <span class="math-tex">{tex}\\frac{d}{{dx}}{/tex}</span> (cosec x)<br />
= cosec x &ndash; cosec<sup>2</sup> x + cot x . &ndash; cosec x cot x<br />
= - cosec<sup>3</sup> x &ndash; cosec x cot<sup>2</sup> x.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 16</span></div><div class="question-text"><p>Find the derivative of function&nbsp;<span class="math-tex">{tex}f(x) = \\frac{{\\cos x}}{{1 + \\sin x}}{/tex}</span>&nbsp;(it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}f(x) = \\frac{{\\cos x}}{{1 + \\sin x}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}\\left[ {\\frac{{\\cos x}}{{1 + \\sin x}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{(1 + \\sin x)\\frac{d}{{dx}}(\\cos x) - \\cos x \\cdot \\frac{d}{{dx}}(1 + \\sin x)}}{{{{(1 + \\sin x)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{(1 + \\sin x)( - \\sin x) - \\cos x(\\cos x)}}{{{{(1 + \\sin x)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{ - \\sin x - {{\\sin }^2}x - {{\\cos }^2}x}}{{{{(1 + \\sin x)}^2}}}{/tex}</span><span class="math-tex">{tex}= \\frac{{ - \\sin x - ({{\\sin }^2}x + {{\\cos }^2}x)}}{{{{(1 + \\sin x)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{ - \\sin x - 1}}{{{{(1 + \\sin x)}^2}}} = \\frac{{ - (1 + \\sin x)}}{{{{(1 + \\sin x)}^2}}} = \\frac{{ - 1}}{{1 + \\sin x}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 17</span></div><div class="question-text"><p>Find the derivative of&nbsp;function&nbsp;<span class="math-tex">{tex}\\frac{{\\sin x + \\cos x}}{{\\sin x - \\cos x}}{/tex}</span> (it is to be understood that a, b, c, d, p, q, r and s are fixed non-zero constants and m and n are integers).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}f(x) = \\frac{{\\sin x + \\cos x}}{{\\sin x - \\cos x}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\;f{\\text{'}}(x) = \\frac{d}{{dx}}\\left[ {\\frac{{\\sin x + \\cos x}}{{\\sin x - \\cos x}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{(\\sin x - \\cos x)\\frac{d}{{dx}}(\\sin x + \\cos x) - (\\sin x + \\cos x)\\frac{d}{{dx}}(\\sin x - \\cos x)}}{{{{(\\sin x - \\cos x)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{(\\sin x - \\cos x)(\\cos x - \\sin x) - (\\sin x + \\cos x)(\\cos x + \\sin x)}}{{{{(\\sin x - \\cos x)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{ - {{(\\sin x - \\cos x)}^2} - {{(\\sin x + \\cos x)}^2}}}{{{{(\\sin x - \\cos x)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{ - ({{\\sin }^2}x - {{\\cos }^2}x + 2\\sin x\\cos x - {{\\sin }^2}x - {{\\cos }^2}x - {{\\cos }^2}x - 2\\sin x\\cos x}}{{{{(\\sin x - \\cos x)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{ - 2({{\\sin }^2}x + {{\\cos }^2}x)}}{{{{(\\sin x - \\cos x)}^2}}}{/tex}</span><span class="math-tex">{tex}= \\frac{{ - 2}}{{{{(\\sin x - \\cos x)}^2}}}{/tex}</span></p></div></div></div>
`;

export default { EXAMPLES_HTML, EX12_1_HTML, EX12_2_HTML, MISC_HTML };