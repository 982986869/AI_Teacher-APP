// complexNumbersContent.js
// NCERT Solutions — Class 11 Mathematics, Chapter 4: Complex Numbers and Quadratic Equations.
//
//   EXAMPLES_HTML  -> worked examples (10 cards)
//   EX4_1_HTML     -> Exercise 4.1 (14 cards)
//   MISC_HTML      -> Miscellaneous Exercise (15 cards)
//
// Math uses {tex}...{/tex} (LaTeX). The Ncert2Screen WebView loads the
// tex-mml-chtml MathJax build configured to treat {tex}/{/tex} as inline math.

export const EXAMPLES_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>If 4x + i(3x -&nbsp;y) = 3 + i (-6), where x and y are real numbers, then find the values of x and y.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,<br />
4x + i (3x - y) = 3 - 6i<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;4x + i (3x - y) = 3 + i (- 6)<br />
On equating real and imaginary parts from both sides, we get<br />
4x = 3&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x =&nbsp;<span class="math-tex">{tex}\\frac { 3 } { 4 }{/tex}</span>&nbsp;and 3x - y = - 6<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;3&nbsp;<span class="math-tex">{tex}\\left( \\frac { 3 } { 4 } \\right){/tex}</span>&nbsp;- y = - 6 [<span class="math-tex">{tex}\\because{/tex}</span>&nbsp;x =&nbsp;<span class="math-tex">{tex}\\frac { 3 } { 4 }{/tex}</span>]<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac { 9 } { 4 }{/tex}</span>&nbsp;- y = - 6<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;y =&nbsp;<span class="math-tex">{tex}\\frac { 9 } { 4 } + 6 = \\frac { 33 } { 4 }{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;x =&nbsp;<span class="math-tex">{tex}\\frac { 3 } { 4 }{/tex}</span>&nbsp;and y =&nbsp;<span class="math-tex">{tex}\\frac { 33 } { 4 }{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(1)</span></div><div class="question-text"><p>Express the <span class="math-tex">{tex}(-5i)\\left(\\frac 18 i\\right){/tex}</span> in the form of a + bi.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><span class="math-tex">{tex}(-5i)\\left(\\frac 18 i\\right) = \\frac {-5}{8} i^2{/tex}</span><br />
i<sup>2</sup> = -1<br />
<span class="math-tex">{tex}= \\frac {-5}{8} (-1) = \\frac 58 = \\frac 58 + i0{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(2)</span></div><div class="question-text"><p>&nbsp;Express the (-i)(2i)<span class="math-tex">{tex}\\left (- \\frac 18 i\\right)^3{/tex}</span> in the form of a + bi:</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>(-i)(2i)<span class="math-tex">{tex}\\left (- \\frac 18 i\\right)^3{/tex}</span>&nbsp;=&nbsp;<span class="math-tex">{tex}2i^2 \\times \\frac 1{8\\times 8\\times 8} \\times i^3{/tex}</span>&nbsp;=&nbsp;&nbsp;<span class="math-tex">{tex}2 \\times \\frac 1{8\\times 8\\times 8} \\times i^5{/tex}</span>&nbsp;<br />
<span class="math-tex">{tex}= \\frac 1{256} (i^2)^2{/tex}</span>i<br />
<span class="math-tex">{tex}i = \\frac {1}{256} i{/tex}</span><br />
&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Express (5 - 3i)<sup>3</sup> in the form a + ib.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have, (5-3i)<sup>3&nbsp;</sup>=&nbsp;<span class="math-tex">{tex}5^3 - 3 \\times 5^2 \\times (3i) + 3 \\times 5 (3i)^2 - (3i)^3{/tex}</span>&nbsp; &nbsp;[(a-b)<sup>3</sup>= a<sup>3</sup>&nbsp;- 3a<sup>2</sup>b+ 3b<sup>2</sup>a - b<sup>3</sup>]<br />
= 125 - 225i - 135 + 27i = -10 - 198i</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>&nbsp;Express <span class="math-tex">{tex}(-\\sqrt3 + \\sqrt{-2})(2\\sqrt3 - i){/tex}</span>&nbsp;in the form of a + ib.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let z=&nbsp;<span class="math-tex">{tex}(-\\sqrt3 + \\sqrt{-2})(2\\sqrt3 - i){/tex}</span>&nbsp;=&nbsp;<span class="math-tex">{tex}(-\\sqrt3 + \\sqrt{2i^2})(2\\sqrt3 - i){/tex}</span>&nbsp;=&nbsp;<span class="math-tex">{tex}(-\\sqrt3 + \\sqrt{2}i)(2\\sqrt3 - i){/tex}</span><br />
z&nbsp;<span class="math-tex">{tex}= -6 + ​\\sqrt3 i + 2\\sqrt6 i - \\sqrt2 i^2{/tex}</span><br />
z&nbsp;<span class="math-tex">{tex}= (-6 + \\sqrt2)+\\sqrt3(1 + 2\\sqrt2)i{/tex}</span>&nbsp;&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the multiplicative inverse of 2 - 3i.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let z = 2 - 3i<br />
Then,&nbsp;<span class="math-tex">{tex}\\overline { z }{/tex}</span>&nbsp;= 2 + 3i<br />
and |z|<sup>2</sup>&nbsp;= 2<sup>2</sup>&nbsp;+ (- 3)<sup>2</sup>&nbsp;= 4 + 9 = 13<br />
Therefore, the multiplicative inverse of 2 - 3i is given by<br />
z<sup>-1</sup>&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac { \\overline { z } } { | z | ^ { 2 } } = \\frac { 2 + 3 i } { 13 } = \\frac { 2 } { 13 } + \\frac { 3 } { 13 } i{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6(1)</span></div><div class="question-text"><p>Express&nbsp;<span class="math-tex">{tex}\\frac { 5 + \\sqrt { 2 } i } { 1 - \\sqrt { 2 } i }{/tex}</span> in the form of a + ib.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let z =&nbsp;<span class="math-tex">{tex}\\frac { 5 + \\sqrt { 2 } i } { 1 - \\sqrt { 2 } i } = \\frac { 5 + \\sqrt { 2 } i } { 1 - \\sqrt { 2 } i } \\times \\frac { 1 + \\sqrt { 2 } i } { 1 + \\sqrt { 2 } i }{/tex}</span><br />
[multiplying numerator and denominator by 1 +&nbsp;<span class="math-tex">{tex}\\sqrt { 2 } i{/tex}</span>]<br />
=&nbsp;<span class="math-tex">{tex}\\frac { 5 + 5 \\sqrt { 2 } i + \\sqrt { 2 } i - 2 } { 1 - ( \\sqrt { 2 } i ) ^ { 2 } }{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac { 3 + 6 \\sqrt { 2 } i } { 1 + 2 }{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac { 3 ( 1 + 2 \\sqrt { 2 } i ) } { 3 }{/tex}</span><br />
= 1 +&nbsp;<span class="math-tex">{tex}2 \\sqrt { 2 }{/tex}</span> i</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6(2)</span></div><div class="question-text"><p>Express the i<sup>&ndash;35</sup> in the form a + ib</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>i<sup>-35 </sup><span class="math-tex">{tex}= \\frac 1{i^{35}}{/tex}</span> <span class="math-tex">{tex}\\frac 1{(i^2)^{17} i}{/tex}</span>&nbsp;<br />
<span class="math-tex">{tex}= \\frac 1{-i} \\times \\frac i{i}{/tex}</span> <span class="math-tex">{tex}\\frac i{-i^2} {/tex}</span>&nbsp;= i</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the conjugate of&nbsp;<span class="math-tex">{tex}\\frac{(3-2 i)(2+3 i)}{(1+2 i)(2-i)}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have&nbsp;<span class="math-tex">{tex}\\frac{(3-2 i)(2+3 i)}{(1+2 i)(2-i)}{/tex}</span><br />
<span class="math-tex">{tex}=\\frac{6+9 i-4 i+6}{2-i+4 i+2}=\\frac{12+5 i}{4+3 i} \\times \\frac{4-3 i}{4-3 i}{/tex}</span><br />
<span class="math-tex">{tex}=\\frac{48-36 i+20 i+15}{16+9}=\\frac{63-16 i}{25}=\\frac{63}{25}-\\frac{16}{25} i{/tex}</span><br />
Therefore, conjugate of&nbsp;<span class="math-tex">{tex}\\frac{(3-2 i)(2+3 i)}{(1+2 i)(2-i)}{/tex}</span>is&nbsp;<span class="math-tex">{tex}\\frac{63}{25}+\\frac{16}{25} i{/tex}</span>&nbsp; [If z = x + iy then then conjugate is x - iy]</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>If x + iy =&nbsp;<span class="math-tex">{tex}\\frac{a+i b}{a-i b}{/tex}</span>, prove that x<sup>2</sup> + y<sup>2</sup> = 1</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have&nbsp;<span class="math-tex">{tex}x+i y=\\frac{(a+i b)}{(a-i b)}{/tex}</span>&nbsp;<br />
=&gt;&nbsp;<span class="math-tex">{tex}|x+i y|=|\\frac{(a+i b)}{(a-i b)}|{/tex}</span></p>

<p>Squaring Both the sides,<br />
=&gt; |x + iy|<sup>2</sup> =<span class="math-tex">{tex}\\frac{|(a+i b)|^2}{|(a-i b)|^2}{/tex}</span>&nbsp;<br />
=&gt;&nbsp;x<sup>2</sup>&nbsp;+ y<sup>2</sup>&nbsp;= <span class="math-tex">{tex}\\frac {a^2 + b^2} {a^2 + b^2}{/tex}</span>&nbsp;= 1</p></div></div></div>
`;

export const EX4_1_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Express the complex number <span class="math-tex">{tex}(5i)\\left( { - \\frac{3}{5}i} \\right){/tex}</span> in the form a + ib.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><span class="math-tex">{tex}(5i)\\left( { - \\frac{3}{5}i} \\right) = - 3{i^2} = - 3 \\times - 1{/tex}</span><span class="math-tex">{tex}(\\because {i^2} = - 1){/tex}</span><br />
= 3 = 3 + 0i</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Express the complex number i<sup>9</sup> + i<sup>19</sup> in the form a + ib.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>i<sup>9</sup> + i<sup>19</sup> = <span class="math-tex">{tex} {({i^2})^4} \\cdot i + {({i^2})^9} \\cdot i{/tex}</span><br />
<span class="math-tex">{tex} = {( - 1)^4} \\cdot i + {( - 1)^9} \\cdot i{/tex}</span><br />
= i - i = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Express the complex number i<sup>-39 </sup>in the form a + ib.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>i<sup>-39&nbsp;</sup>=&nbsp;<span class="math-tex">{tex}i^{4 \\times -9-3}{/tex}</span><br />
<span class="math-tex">{tex}= (i^4)^{-9} \\times i^{-3}{/tex}</span><br />
<span class="math-tex">{tex}=(1)^{-9} \\times i^{-3}{/tex}</span><br />
<span class="math-tex">{tex}=\\frac {1}{i^3}{/tex}</span><br />
<span class="math-tex">{tex}=\\frac {1}{-i} \\times \\frac {i}{i} {/tex}</span><br />
<span class="math-tex">{tex}= \\frac {-i}{i^2} = \\frac {-i}{-1} {/tex}</span>&nbsp;= i</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Express the complex number&nbsp;3(7 + i7) + i(7 + i7) in the form a + ib.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>3(7 + i7) + i (7 + i7)<br />
= 21 + 21i + 7i + 7i<sup>2&nbsp;</sup>= 21 + 28i - 7<br />
= 14 + 28 i</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Express the complex number&nbsp;(1 -&nbsp;i) - (- 1 + i6)&nbsp;in&nbsp;form of a + ib.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>(1 -&nbsp;i) -&nbsp;(-1 + i6)<br />
1 -&nbsp;i + 1 - 6i = 2 - 7i</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Express the complex number&nbsp;<span class="math-tex">{tex}\\left( {\\frac{1}{5} + \\frac{2}{5}i} \\right) - \\left( {4 + \\frac{5}{2}i} \\right){/tex}</span>&nbsp;in the&nbsp;form of a + ib.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><span class="math-tex">{tex}\\left( {\\frac{1}{5} + \\frac{2}{5}i} \\right) - \\left( {4 + \\frac{5}{2}i} \\right){/tex}</span><br />
<span class="math-tex">{tex} = \\frac{1}{5} + \\frac{2}{5}i - 4 - \\frac{5}{2}i{/tex}</span><br />
<span class="math-tex">{tex} = \\left( {\\frac{1}{5} - 4} \\right) + \\left( {\\frac{2}{5} - \\frac{5}{2}} \\right)i{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{ - 19}}{5} - \\frac{{21}}{{10}}i{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Express the complex number<span class="math-tex">{tex}\\left[ {\\left( {\\frac{1}{3} + \\frac{7}{3}i} \\right) + \\left( {4 + \\frac{1}{3}i} \\right)} \\right] - \\left[ {\\frac{{ - 4}}{3} + i} \\right]{/tex}</span>&nbsp;in the form of a + ib.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><span class="math-tex">{tex}\\left[ {\\left( {\\frac{1}{3} + \\frac{7}{3}i} \\right) + \\left( {4 + \\frac{1}{3}i} \\right)} \\right] - \\left[ {\\frac{{ - 4}}{3} + i} \\right]{/tex}</span><br />
<span class="math-tex">{tex} =\\left(\\frac13+4+\\frac43\\right)+\\left(\\frac73i+\\frac13i\\;-i\\right){/tex}</span><br />
<span class="math-tex">{tex}\\;=\\left(\\frac13+\\frac{4\\times3}3+\\frac43\\right)+\\left(\\frac73i\\;+\\frac i3-\\frac{3i}3\\right){/tex}</span><br />
<span class="math-tex">{tex}=\\left(\\frac{1+12+4}3\\right)+\\left(\\frac{7i+i\\;-3i}3\\right){/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{17}}{3} + \\frac{5}{3}i{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Express the complex number (1 - i)<sup>4 </sup>in the form of a + ib.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>(1 - i)<sup>4</sup> = [(1 - i)<sup>2</sup>]<sup>2</sup><br />
= (1 + i<sup>2</sup> - 2i)<sup>2</sup><br />
= (1 - 1 - 2i)<sup>2</sup> = (-2i)<sup>2</sup><br />
<span class="math-tex">{tex} = 4{i^2} = 4 \\times - 1 = - 4{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Express the complex number <span class="math-tex">{tex}{\\left( {\\frac{1}{3} + 3i} \\right)^3}{/tex}</span>&nbsp;in the&nbsp;form of a + ib.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><span class="math-tex">{tex}\\left(\\frac13+3i\\right)^3\\;=\\left(\\frac13\\right)^3+{(3i)^3}+3\\times\\left(\\frac13\\right)(3i)\\left(\\frac13+3i\\right){/tex}</span><span class="math-tex">{tex}{/tex}</span><br />
<span class="math-tex">{tex}=\\frac1{27}+27i^3+i+3i\\left(\\frac13+3i\\right){/tex}</span><br />
<span class="math-tex">{tex}=\\frac1{27}+27(-i)+i+9i^2{/tex}</span><span class="math-tex">{tex}\\left[ {\\because {i^3} = - i\\;and\\;{i^2} = - 1} \\right]{/tex}</span><br />
<span class="math-tex">{tex} \\begin{array}{l}=\\frac1{27}-27i+i-9\\\\=\\left(\\frac1{27}-9\\right)-26i\\;\\\\=\\frac{-242}{27}-26i\\end{array}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Express the complex number <span class="math-tex">{tex}{\\left( { - 2 - \\frac{1}{3}i} \\right)^3}{/tex}</span>&nbsp;in the form of a + ib.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><span class="math-tex">{tex}{\\left( { - 2 - \\frac{1}{3}i} \\right)^3}{/tex}</span><span class="math-tex">{tex} = - {\\left( {2 + \\frac{1}{3}i} \\right)^3}{/tex}</span><br />
<span class="math-tex">{tex}=-\\left[{(2)}^3+\\left(\\frac13i\\right)^3+3\\times{(2)}^2\\times\\frac13i\\right.{/tex}</span><span class="math-tex">{tex}\\left. { + 3 \\times 2 \\times {{\\left( {\\frac{1}{3}i} \\right)}^2}} \\right]{/tex}</span><br />
<span class="math-tex">{tex}=-\\left[8+\\frac1{27}i^3+4i+\\frac23i^2\\right]{/tex}</span><span class="math-tex">{tex} = - \\left[ {8 - \\frac{1}{{27}}i + 4i - \\frac{2}{3}} \\right]\\left[ {\\begin{array}{*{20}{c}} {\\because {i^3} = - i} \\\\ {{i^2} = - 1} \\end{array}} \\right]{/tex}</span><br />
<span class="math-tex">{tex} = \\left[ {\\left( {8 - \\frac{2}{3}} \\right) + \\left( {4 - \\frac{1}{{27}}} \\right)i} \\right.{/tex}</span><br />
<span class="math-tex">{tex} = - \\left[ {\\frac{{22}}{3} + \\frac{{107}}{{27}}i} \\right] = \\frac{{ - 22}}{3} - \\frac{{107}}{{27}}i{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Find the multiplicative inverse of the complex number 4 - 3i</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>M.I. of (4 - 3i)&nbsp;<span class="math-tex">{tex} = \\frac{1}{{4 - 3i}} = \\frac{1}{{4 - 3i}} \\times \\frac{{4 + 3i}}{{4 + 3i}} = \\frac{{4 + 3i}}{{{{(4)}^2} - {{(3i)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{4 + 3i}}{{16 - 9{i^2}}} = \\frac{{4 + 3i}}{{16 + 9}} = \\frac{1}{{25}}(4 + 3i){/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Find the multiplicative inverse of the complex number&nbsp;<span class="math-tex">{tex} = \\sqrt 5 + 3i{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>M.I. of <span class="math-tex">{tex} = \\sqrt 5 + 3i{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{1}{{\\sqrt 5 + 3i}} = \\frac{1}{{\\sqrt 5 + 3i}} \\times \\frac{{\\sqrt 5 - 3i}}{{\\sqrt 5 - 3i}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{\\sqrt 5 - 3i}}{{{{(\\sqrt 5 )}^2} - {{(3i)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{\\sqrt 5 - 3i}}{{5 - 9{i^2}}} = \\frac{{\\sqrt 5 - 3i}}{{5 + 9}} = \\frac{1}{{14}}(\\sqrt 5 - 3i){/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>Find the multiplicative inverse of the complex number&nbsp;-i</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>M.I. of <span class="math-tex">{tex} - i = \\frac{1}{{ - i}} = \\frac{i}{{ - {i^2}}} = \\frac{i}{{ - (-1)}} = i{/tex}</span><br />
&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>Express the following expression in the form of a + ib:<br />
<span class="math-tex">{tex}\\frac { ( 3 + \\sqrt { 5 } i ) ( 3 - \\sqrt { 5 } i ) } { ( \\sqrt { 3 } + \\sqrt { 2 } i ) - ( \\sqrt { 3 } - \\sqrt { 2 }i ) }{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,&nbsp;<span class="math-tex">{tex}\\frac { ( 3 + \\sqrt { 5 }i ) ( 3 - \\sqrt { 5 }i ) } { ( \\sqrt { 3 } + \\sqrt { 2 } i ) - ( \\sqrt { 3 } - \\sqrt { 2 }i ) }{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac { 9 - 3 \\sqrt { 5 }i+3 \\sqrt {5 }i - \\sqrt { 5 }i \\sqrt { 5 }i } { \\sqrt { 3 } + \\sqrt { 2 } i - \\sqrt { 3 } + \\sqrt { 2 } i }{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac { 9 + 5 } { 2 \\sqrt { 2 } i } = \\frac { 14 } { 2 \\sqrt { 2 } i } = \\frac { 7 } { \\sqrt { 2 } i } \\times \\frac { \\sqrt { 2 } i } { \\sqrt { 2 } i }{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac { 7 \\sqrt { 2 } i } { 2 i ^ { 2 } } = \\frac { 7 \\sqrt { 2 } i } { - 2 }{/tex}</span>&nbsp;= 0 - i&nbsp;<span class="math-tex">{tex}\\frac { 7 \\sqrt { 2 } } { 2 }{/tex}</span>&nbsp;= a + ib [say]<br />
where, a = 0 and b =&nbsp;<span class="math-tex">{tex}\\frac { - 7 \\sqrt { 2 } } { 2 }{/tex}</span></p></div></div></div>
`;

export const MISC_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Evaluate <span class="math-tex">{tex}{\\left[ {{i^{18}} + {{\\left( {\\frac{1}{i}} \\right)}^{25}}} \\right]^3}{/tex}</span></p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><span class="math-tex">{tex}\\style{font-family:Tahoma}{\\style{font-size:8px}{\\begin{array}{l}=\\;\\left[\\left(-1\\right)^9\\;+\\frac1{i^{24}.i}\\right]^3\\;=\\;\\left[-1\\;+\\frac1{\\left(i^2\\right)^{12}.i}\\right]^3\\\\=\\;\\left[-1\\;+\\frac1{\\left(-1\\right)^{12}.i}\\right]^3\\;=\\;\\left[-1\\;+\\frac1{1\\times i}\\right]^3\\\\=\\left[-1+\\frac1i\\right]^3\\;=\\;\\left[-1-i\\right]^3\\\\=-\\left(1\\;+i\\right)^3\\;=\\;-\\left[1+i^3+3\\times1\\times i(1+i)\\right]\\\\=-\\left[1-i+3i(1+i)\\right]\\;=\\;-\\left[1-i+3i+3i^2\\right]\\\\=-\\left[1-i+3i-3\\right]\\;=\\;-\\left[-2+2i\\right]\\\\=2\\;-\\;2i\\end{array}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>For any two complex numbers z<sub>1&nbsp;</sub>and z<sub>2</sub>, prove that Re (z<sub>1</sub>&nbsp;z<sub>2</sub>) = Re (Z<sub>1</sub>) Re (z<sub>2</sub>) - Im (z<sub>1</sub>) Im (z<sub>2</sub>).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let z<sub>1</sub>&nbsp;= x<sub>1</sub>&nbsp;+ iy<sub>1</sub>&nbsp;and z<sub>2</sub>&nbsp;= x<sub>2</sub>&nbsp;+ iy<sub>2</sub><br />
Then, z<sub>1</sub>&nbsp;z<sub>2</sub>&nbsp;= (x<sub>1</sub>&nbsp;x<sub>2</sub>&nbsp;- y<sub>1&nbsp;</sub>y<sub>2</sub>) + i (x<sub>1&nbsp;</sub>y<sub>2</sub>&nbsp;+ y<sub>1</sub>&nbsp;x<sub>2</sub>)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Re (z<sub>1</sub>&nbsp;z<sub>2</sub>) = x<sub>1</sub>&nbsp;x<sub>2</sub>&nbsp;- y<sub>1</sub>&nbsp;y<sub>2</sub><br />
= Re (z<sub>1</sub>) Re&nbsp;(z<sub>2</sub>) - Im (z<sub>1</sub>) Im (Z<sub>2</sub>)<br />
Hence proved.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Reduce&nbsp;<span class="math-tex">{tex}\\left( \\frac { 1 } { 1 - 4 i } - \\frac { 2 } { 1 + i } \\right) \\left( \\frac { 3 - 4 i } { 5 + i } \\right){/tex}</span> to the standard form.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,&nbsp;<span class="math-tex">{tex}\\left( \\frac { 1 } { 1 - 4 i } - \\frac { 2 } { 1 + i } \\right) \\left( \\frac { 3 - 4 i } { 5 + i } \\right){/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\left[ \\frac { 1 + i - 2 ( 1 - 4 i ) } { ( 1 - 4 i ) ( 1 + i ) } \\right] \\left( \\frac { 3 - 4 i } { 5 + i } \\right){/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\left( \\frac { 1 + i - 2 + 8 i } { 1 + i - 4 i - 4 i ^ { 2 } } \\right) \\left( \\frac { 3 - 4 i } { 5 + i } \\right){/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\left( \\frac { - 1 + 9 i } { 1 - 3 i + 4 } \\right) \\left( \\frac { 3 - 4 i } { 5 + i } \\right){/tex}</span>&nbsp;[<span class="math-tex">{tex}\\because{/tex}</span>&nbsp;i<sup>2</sup>&nbsp;= - 1]<br />
=&nbsp;<span class="math-tex">{tex}\\left( \\frac { - 1 + 9 i } { 5 - 3 i } \\right) \\left( \\frac { 3 - 4 i } { 5 + i } \\right){/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac { - 3 + 4 i + 27 i - 36 i ^ { 2 } } { 25 + 5 i - 15 i - 3 i ^ { 2 } }{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex} \\frac { - 3 + 31 i + 36 } { 25 - 10 i + 3 } = \\frac { 33 + 31 i } { 28 - 10 i }{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac { ( 33 + 31 i ) } { ( 28 - 10 i ) } \\times \\frac { ( 28 + 10 i ) } { ( 28 + 10 i ) }{/tex}</span><br />
[multiplying numerator and denominator by 28 + 10i]<br />
=&nbsp;<span class="math-tex">{tex}\\frac { 924 + 868 i + 330 i + 310 i ^ { 2 } } { 784 - 100 i ^ { 2 } }{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac { 924 + 1198 i - 310 } { 784 + 100 }{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac { 614 + 1198 i } { 884 } = \\frac { 307 } { 442 } + \\frac { 599 } { 442 }{/tex}</span>i</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>If <span class="math-tex">{tex}x - iy = \\sqrt {\\frac{{a - ib}}{{c - id}}} {/tex}</span>&nbsp;prove that&nbsp;<span class="math-tex">{tex}{({x^2} + {y^2})^2} = \\frac{{{a^2} + {b^2}}}{{{c^2} + {d^2}}}{/tex}</span></p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}x - iy = \\sqrt {\\frac{{a - ib}}{{c - id}}} {/tex}</span><br />
Squaring both sides, we get<br />
<span class="math-tex">{tex}{(x - iy)^2} = \\frac{{a - ib}}{{c - id}}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\left| {{{(x - iy)}^2}} \\right| = \\left| {\\frac{{a - ib}}{{c - id}}} \\right|{/tex}</span><span class="math-tex">{tex} \\Rightarrow \\left| {(x - iy)} \\right|\\left| {x - iy} \\right| = \\left| {\\frac{{a - ib}}{{c - id}}} \\right|{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\left( {\\sqrt {{x^2} + {y^2}} } \\right)\\left( {\\sqrt {{x^2} + {y^2}} } \\right){/tex}</span><span class="math-tex">{tex} = \\frac{{\\sqrt {{a^2} + {b^2}} }}{{\\sqrt {{c^2} + {d^2}} }} \\Rightarrow ({x^2} + {y^2}) = \\sqrt {\\frac{{{a^2} + {b^2}}}{{{c^2} + {d^2}}}} {/tex}</span><br />
Squaring both sides<br />
<span class="math-tex">{tex}{({x^2} + {y^2})^2} = \\frac{{{a^2} + {b^2}}}{{{c^2} + {d^2}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>If z<sub>1</sub> = 2 - i, z<sub>2</sub> = 1 + i, find <span class="math-tex">{tex}{\\left|\\frac{z_1+z_2+1}{z_1-z_2+1}\\right|}{/tex}</span></p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here z<sub>1</sub> = 2 - iand z<sub>2</sub> = 1 + i<br />
<span class="math-tex">{tex}\\therefore \\left| {\\frac{{{z_1} + {z_2} + 1}}{{{z_1} - {z_2} + 1}}} \\right| = \\left| {\\frac{{2 - i + 1 + i + 1}}{{2 - i - 1 - i + 1}}} \\right|{/tex}</span><span class="math-tex">{tex} = \\left| {\\frac{4}{{2 - 2i}}} \\right| = \\frac{{\\left| 4 \\right|}}{{\\left| {2 - 2i} \\right|}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{4}{{\\sqrt {{{(2)}^2} + {{( - 2)}^2}} }} = \\frac{4}{{\\sqrt {4 + 4} }} = \\frac{4}{{\\sqrt 8 }}{/tex}</span><span class="math-tex">{tex} = \\frac{4}{{2\\sqrt 2 }} = \\sqrt 2 {/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>If a + ib <span class="math-tex">{tex} = \\frac{{{{(x + i)}^2}}}{{2{x^2} + 1}}{/tex}</span>, prove that <span class="math-tex">{tex}{a^2} + {b^2} = \\frac{{{{({x^2} + 1)}^2}}}{{{{(2{x^2} + 1)}^2}}}{/tex}</span>.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here a + ib <span class="math-tex">{tex} = \\frac{{{{(x + i)}^2}}}{{2{x^2} + 1}} = \\frac{{{x^2} + {i^2} + 2ix}}{{2{x^2} + 1}} = \\frac{{{x^2} - 1}}{{2{x^2} + 1}} + i{/tex}</span><span class="math-tex">{tex}\\frac{{2x}}{{2{x^2} + 1}}{/tex}</span><br />
Comparing both sides, we have<br />
<span class="math-tex">{tex}a = \\frac{{{x^2} - 1}}{{2{x^2} + 1}}{/tex}</span>&nbsp;amd <span class="math-tex">{tex}b = \\frac{{2x}}{{2{x^2} + 1}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore {a^2} + {b^2} = \\left( {\\frac{{{x^2} - 1}}{{2{x^2} + 1}}} \\right)^2 + {\\left( {\\frac{{2x}}{{2{x^2} + 1}}} \\right)^2}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{{{({x^2} - 1)}^2}}}{{{{(2{x^2} + 1)}^2}}} + \\frac{{{{(2x)}^2}}}{{{{(2{x^2} + 1)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{{{({x^2} - 1)}^2} + {{(2x)}^2}}}{{{{(2{x^2} + 1)}^2}}}{/tex}</span><span class="math-tex">{tex} = \\frac{{{x^4} + 1 - 2{x^2} + 4{x^2}}}{{{{(2{x^2} + 1)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{{x^4} + 1 + 2{x^2}}}{{{{(2{x^2} + 1)}^2}}} = \\frac{{{{({x^2} + 1)}^2}}}{{{{(2{x^2} + 1)}^2}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7(1)</span></div><div class="question-text"><p>Let z<sub>1</sub> = 2 - i, z<sub>2</sub> = -2 + i. Find&nbsp;<span class="math-tex">{tex}\\operatorname{Re} \\left( {\\frac{{{z_1}{z_2}}}{{{{\\overline z }_1}}}} \\right){/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here z<sub>1</sub> = 2 - i and z<sub>2</sub> = -2 + i<br />
<span class="math-tex">{tex}\\therefore \\overline {{z_1}} = 2 + i{/tex}</span></p>

<p>Now z<sub>1</sub>z<sub>2</sub>&nbsp;= (2 -i)(-2 + i)<br />
= - 4 + 2i + 2i - i<sup>2</sup> = (-4 + 1) + 4i<br />
= - 3 + 4i<br />
<span class="math-tex">{tex}\\therefore \\frac{{{z_1}{z_2}}}{{\\overline {{z_1}} }} = \\frac{{ - 3 + 4i}}{{2 + i}} \\times \\frac{{2 - i}}{{2 - i}}{/tex}</span><span class="math-tex">{tex} = \\frac{{ - 6 + 3i + 8i - 4{i^2}}}{{4 - {i^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{( - 6 + 4) + 11i}}{{4 + 1}} = \\frac{{ - 2 + 11i}}{5} = \\frac{{ - 2}}{5} + \\frac{{11}}{5}i{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\operatorname{Re} \\left( {\\frac{{{z_1}{z_2}}}{{\\overline {{z_1}} }}} \\right) = \\frac{{ - 2}}{5}{/tex}</span>&nbsp; &nbsp;<br />
&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7(2)</span></div><div class="question-text"><p>Let z<sub>1</sub> = 2 - i, z<sub>2</sub> = -2 + i. Find <span class="math-tex">{tex}\\operatorname{Im} \\left( {\\frac{1}{{{z_1}\\overline {{z_1}} }}} \\right){/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here z<sub>1</sub> = 2 - i and z<sub>2</sub> = -2 + i<br />
<span class="math-tex">{tex}\\therefore \\overline {{z_1}} = 2 + i{/tex}</span><br />
<span class="math-tex">{tex}\\frac{1}{{{z_1}\\overline {{z_1}} }} = \\frac{1}{{(2 - i)(2 + i)}} = \\frac{1}{{4 - {i^2}}} = \\frac{1}{5}{/tex}</span>&nbsp; =&nbsp;<span class="math-tex">{tex}\\frac 1 5{/tex}</span>&nbsp;+ 0i<br />
<span class="math-tex">{tex}\\therefore \\operatorname{Im} \\left( {\\frac{1}{{{z_1}\\overline {{z_1}} }}} \\right) = 0{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the real numbers x and y if (x - iy) (3 + 5i) is the conjugate of -6 - 24i.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}\\overline { - 6 - 24i} = - 6 + 24i{/tex}</span><br />
Now (x - iy) (3 + 5i) = -6 + 24i<br />
<span class="math-tex">{tex} \\Rightarrow 3x + 5xi - 3yi - 5y{i^2} = 6 + 24i{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow (3x + 5y) + (5x - 3y)i = - 6 + 24i{/tex}</span><br />
Comparing both sides, we have<br />
3x + 5y = -6. . . . (i)<br />
and 5x - 3y = 24 .... (ii)<br />
Multiplying (i) by 3 and (ii) by 5 and then adding<br />
<span class="math-tex">{tex}\\begin{gathered} \\underline {\\begin{array}{*{20}{c}} {9x + 15y = - 18} \\\\ {25x - 15y = 120} \\end{array}} \\hfill \\\\ 34x = 102 \\hfill \\\\ \\end{gathered} {/tex}</span><span class="math-tex">{tex} \\Rightarrow x = 3{/tex}</span><br />
Putting x = 3 in (i)<br />
3(3)+5y=-6<br />
Thus y=-3</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the modulus of <span class="math-tex">{tex}\\frac{{1 + i}}{{1 - i}} - \\frac{{1 - i}}{{1 + i}}{/tex}</span>.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><span class="math-tex">{tex}\\left| {\\frac{{1 + i}}{{1 - i}} - \\frac{{1 - i}}{{1 + i}}} \\right| = \\left| {\\frac{{{{(1 + i)}^2} - {{(1 - i)}^2}}}{{(1 - i)(1 + i)}}} \\right|{/tex}</span><br />
<span class="math-tex">{tex} = \\left| {\\frac{{1 + {i^2} + 2i - 1 - {i^2} + 2i}}{{1 - {i^2}}}} \\right|{/tex}</span><br />
<span class="math-tex">{tex}\\left| {\\frac{{4i}}{2}} \\right| = |2i| = \\sqrt 4 = 2{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>If (x + iy)<sup>3</sup> = u + iv, then show that <span class="math-tex">{tex}\\frac{u}{x} + \\frac{v}{y} = 4({x^2} - {y^2}){/tex}</span></p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>(x + iy)<sup>3</sup>&nbsp;=u + iv<br />
<span class="math-tex">{tex} \\Rightarrow {x^3} + {i^3}{y^3} + 3{x^2}yi + 3x{y^2}{i^2} = u + iv{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow ({x^3} - 3x{y^2}) + (3{x^2}y - {y^3})i = u + iv{/tex}</span><br />
Comparing both sides<br />
u = x (x<sup>2</sup> - 3y<sup>2</sup>) and v = y(3x<sup>2</sup> - y<sup>2</sup>)<br />
Now <span class="math-tex">{tex}\\frac{u}{x} + \\frac{v}{y} = \\frac{{x({x^2} - 3{y^2})}}{x} + \\frac{{y(3{x^2} - {y^2})}}{y}{/tex}</span><br />
= x<sup>2</sup> - 3y<sup>2</sup> + 3x<sup>2</sup> - y<sup>2</sup> = 4x<sup>2</sup> - 4y<sup>2</sup> = 4(x<sup>2</sup> - y<sup>2</sup>)</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>If <span class="math-tex">{tex}\\alpha {/tex}</span>&nbsp;and <span class="math-tex">{tex}\\beta {/tex}</span>&nbsp;are different complex numbers with <span class="math-tex">{tex}\\left| \\beta \\right| = 1{/tex}</span>&nbsp;then find <span class="math-tex">{tex}\\left| {\\frac{{\\beta - \\alpha }}{{1 - \\overline \\alpha \\beta }}} \\right|{/tex}</span></p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Now <span class="math-tex">{tex}{\\left| {\\frac{{\\beta - \\alpha }}{{1 - \\overline \\alpha \\beta }}} \\right|^2} = \\left[ {\\frac{{\\beta - \\alpha }}{{1 - \\overline \\alpha \\beta }}} \\right]\\left[ {\\frac{{\\overline {\\beta - \\alpha } }}{{1 - \\overline \\alpha \\beta }}} \\right]{/tex}</span><span class="math-tex">{tex}\\left[ {\\because {{\\left| z \\right|}^2} = z\\overline z } \\right]{/tex}</span><br />
<span class="math-tex">{tex} = \\left[ {\\frac{{\\beta - \\alpha }}{{1 - \\overline \\alpha \\beta }}} \\right]\\left[ {\\frac{{\\overline \\beta - \\overline \\alpha }}{{1 - \\alpha \\overline \\beta }}} \\right]{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{\\beta \\overline \\beta - \\beta \\overline \\alpha - \\alpha \\overline \\beta + \\alpha \\overline \\alpha }}{{1 - \\overline \\alpha \\beta - \\alpha \\overline \\beta + \\alpha \\overline \\alpha \\beta \\overline \\beta }}{/tex}</span><span class="math-tex">{tex} = \\frac{{{{\\left| \\beta \\right|}^2} - \\alpha \\overline \\beta - \\alpha \\overline \\beta + {{\\left| \\alpha \\right|}^2}}}{{1 - \\overline \\alpha \\beta - \\alpha \\overline \\beta + {{\\left| \\alpha \\right|}^2}{{\\left| \\beta \\right|}^2}}}{/tex}</span></p>

<p><span class="math-tex">{tex} = \\frac{{1 - \\overline \\alpha \\beta - \\alpha \\overline \\beta + {{\\left| \\alpha \\right|}^2}}}{{1 - \\overline \\alpha \\beta - \\overline \\alpha \\beta + {{\\left| \\alpha \\right|}^2}}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\left| {\\frac{{\\beta - \\alpha }}{{1 - \\alpha \\beta }}} \\right| = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Find the number of non-zero integral solutions of the equation <span class="math-tex">{tex}{\\left| {1 - i} \\right|^x} = {2^x}{/tex}</span>.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}{\\left| {1 - i} \\right|^x} = {2^x}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow {\\left[ {\\sqrt {{{(1)}^2} + {{( - 1)}^2}} } \\right]^x} = {2^x}{/tex}</span><span class="math-tex">{tex} \\Rightarrow {(\\sqrt 2 )^x} = {2^x}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow {2^{\\frac{x}{2}}} = {2^x} \\Rightarrow \\frac{x}{2} = x \\Rightarrow \\frac{x}{2} - x = 0{/tex}</span><span class="math-tex">{tex} \\Rightarrow \\frac{{ - x}}{2} = 0{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow x = 0{/tex}</span><br />
Thus the given equation has no non-zero integral solution.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>If (a + ib) (c + id) (e+ if) (g + ih) = A + iB, then show that (a<sup>2</sup> + b<sup>2</sup>) (c<sup>2</sup> + d<sup>2</sup>) (e<sup>2</sup> + f<sup>2</sup>) (g<sup>2</sup> + h<sup>2</sup>) = A<sup>2</sup> + B<sup>2</sup></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here (a + ib) (c + id) (e+ if) (g + ih) = A + iB<br />
Taking modulus on both sides<br />
| (a + ib) (c + id) (e+ if) (g + ih) | = |A + iB|<br />
<span class="math-tex">{tex} \\Rightarrow {/tex}</span>&nbsp;|a + ib | |c + id | | e + if | |g + ih| = | A + iB|<br />
<span class="math-tex">{tex} \\Rightarrow \\left( {\\sqrt {{a^2} + {b^2}} } \\right)\\left( {\\sqrt {{c^2} + {d^2}} } \\right)\\left( {\\sqrt {{e^2} + {f^2}} } \\right){/tex}</span>&nbsp;<span class="math-tex">{tex}\\left( {{g^2} + {h^2}} \\right) = \\sqrt {{A^2} + {B^2}} {/tex}</span><br />
Squaring both sides<br />
(a<sup>2</sup> + b<sup>2</sup>) (c<sup>2</sup> + d<sup>2</sup>) (e<sup>2</sup> + f<sup>2</sup>) (g<sup>2</sup> + h<sup>2</sup>) = A<sup>2</sup> + B<sup>2</sup></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>If&nbsp;<span class="math-tex">{tex}\\left(\\frac{1+i}{1-i}\\right)^{m} = 1{/tex}</span> then find the least positive integral value of m.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given&nbsp;<span class="math-tex">{tex}\\left(\\frac{1+i}{1-i}\\right)^{m} = 1{/tex}</span><br />
Now,&nbsp;<span class="math-tex">{tex}\\left(\\frac{1+i}{1-i} \\times \\frac{1+i}{1+i}\\right)^{m}=1{/tex}</span>&nbsp;[multiply divide numerator and denominator by 1+i]<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span><span class="math-tex">{tex}\\left[\\frac{(1+i)^{2}}{1^{2}-i^{2}}\\right]^{m}=1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span><span class="math-tex">{tex}\\left(\\frac{1^{2}+\\mathrm{i}^{2}+2 \\mathrm{i}}{1+1}\\right)^{\\mathrm{m}}=1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span><span class="math-tex">{tex}\\left(\\frac{1-1+2 i}{2}\\right)^{m}=1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span><span class="math-tex">{tex}\\left(\\frac{2 i}{2}\\right)^{m}=1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>i<sup>m</sup> = 1<br />
We can also write, i<sup>m</sup> = i<sup>4k</sup><br />
On equating the powers,<br />
Thus, m = 4k, Where k is some integer.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>1 is the least positive integer.<br />
Least positive integral value of m is&nbsp;<span class="math-tex">{tex}4 \\times 1 = 4{/tex}</span></p></div></div></div>
`;

export default { EXAMPLES_HTML, EX4_1_HTML, MISC_HTML };