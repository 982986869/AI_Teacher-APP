// conicSectionsContent.js
// NCERT Solutions — Class 11 Mathematics, Chapter 10: Conic Sections.
//   EXAMPLES (20) | EX10_1 (16) | EX10_2 (12) | EX10_3 (20) | EX10_4 (15) | MISC (8)
// Math uses {tex}...{/tex} (LaTeX), rendered by Ncert2Screen's tex-mml-chtml build.

export const EXAMPLES_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Find an equation of the circle with centre at (0, 0) and radius r.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here (h, k)&nbsp;= (0, 0)&nbsp;Therefore, the equation of the circle is (x - 0)<sup>2</sup> + (y - 0)<sup>2</sup> = r<sup>2</sup>&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x<sup>2</sup> + y<sup>2</sup> = r<sup>2</sup></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Find the equation of the circle with centre (-3, 2) and radius 4</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here centre of circle is (-3,2) and radius&nbsp; r = 4<br />
h = &ndash;3, k = 2 and r = 4.0<br />
herefore, the equation of the required circle is (x + 3)<sup>2</sup> + (y -&nbsp;2)<sup>2</sup> = 16</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Find the centre and the radius of the circle: x<sup>2</sup> + y<sup>2</sup> + 8x + 10y &ndash; 8 = 0</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation is (x<sup>2</sup> + 8x) + (y<sup>2</sup> + 10y) = 8<br />
Now, completing the squares within the parenthesis, we get<br />
(x<sup>2</sup> + 8x + 16) + (y<sup>2</sup> + 10y + 25) = 8 + 16 + 25<br />
i.e. (x + 4)<sup>2</sup> + (y + 5)<sup>2</sup> = 49<br />
i.e. {x &ndash; (&ndash; 4)}<sup>2</sup> + {y &ndash; (&ndash;5)}<sup>2</sup> = 49&nbsp; &nbsp; &nbsp;[comparing with {x &ndash; (h)}<sup>2</sup> + {y &ndash; (k)}<sup>2</sup> = r<sup>2 </sup>, centre(-h, -k) and r radius]<br />
Therefore, the given circle has centre at (&ndash; 4, &ndash;5) and radius 7.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Find the equation of the circle which passes through the points (2, -2) and (3, 4) and whose centre lies on the line x + y = 2.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let the equation of circle with centre (h, k) and radius r be (x - h)<sup>2</sup>&nbsp;+ (y - k)<sup>2</sup>&nbsp;= r<sup>2</sup>&nbsp;...(i)<br />
Since, circle passes through the points (2, -2) and (3, 4), so the points (2, -2) and (3, 4) will lie on Eq. (i).<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;(2 - h)<sup>2</sup>&nbsp;+ (- 2 - k)<sup>2</sup>&nbsp;= r<sup>2</sup>&nbsp;...(ii)<br />
and (3 - h)<sup>2</sup>&nbsp;+ (4 - k)<sup>2</sup>&nbsp;= r<sup>2</sup>...(iii)<br />
Now, from Eqs. (ii) and (iii), we get<br />
(2 - h)<sup>2</sup>&nbsp;+ (- 2 - k)<sup>2</sup>&nbsp;= (3 - h)<sup>2</sup>&nbsp;+ (4 - k)<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;4 + h<sup>2</sup>&nbsp;- 4h + 4 + k<sup>2</sup>&nbsp;+ 4k = 9 + h<sup>2</sup>&nbsp;- 6h + 16 + k<sup>2&nbsp;</sup>- 8k<br />
&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2h + 12k = 17 ...(iv)<br />
Also, given that centre (h, k) lies on x + y = 2. So, it will satisfy it.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;h + k = 2 ...(v)<br />
On solving Eqs. (iv) and (v), we get<br />
h = 0.7, k = 1.3<br />
Now, r<sup>2</sup>&nbsp;= (2 - 0.7)<sup>2</sup>&nbsp;+ (-2 - 1.3)<sup>2</sup>&nbsp;= 1.69 + 10.89 = 12.58<br />
On putting h = 0.7, k = 13 and r<sup>2</sup>&nbsp;= 12.58 in Eq. (i), we get<br />
(x - 0.7)<sup>2</sup>&nbsp;+ (y - 1.3)<sup>2</sup>&nbsp;= 12.58<br />
which is the required equation of circle.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the coordinates of the focus, axis, the equation of the directrix and latus rectum of the parabola y<sup>2</sup> = 8x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have, equation of parabola is&nbsp;y<sup>2</sup> = 8x.<br />
The given equation involves y<sup>2</sup>,&nbsp;so the axis of symmetry is along&nbsp;X-axis. The coefficient of x is positive, so the parabola opens to right.<br />
On comparing with the given equation y<sup>2</sup> = 4ax, we get,<br />
a = 2<br />
Thus, focus = (2, 0)<br />
Equation of directrix, x = - 2<br />
Length of latus rectum is 4a = 4&nbsp;<span class="math-tex">{tex}\\times{/tex}</span> 2 = 8.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find the equation of the parabola with focus (2, 0) and directrix x = &ndash; 2.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that the directrix is x = &ndash; 2 and the focus is (2, 0),<br />
Since the focus (2, 0) lies on the x-axis, the x-axis itself is the axis of the parabola.<br />
Hence the equation of the parabola is of the form either y<sup>2</sup> = 4ax or y<sup>2</sup> = -4ax.<br />
Since the directrix is x = &ndash; 2 and the focus is (2, 0),<br />
the parabola is to be of the form y<sup>2</sup> = 4ax with a = 2.<br />
Hence the required equation is y<sup>2 </sup>= 4(2)x = 8x</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the equation of the parabola with vertex at (0, 0) and focus at (0, 2).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given, the vertex is (0, 0) and focus is at (0, 2) which lies on Y-axis.<br />
The Y axis is the axis of parabola.<br />
Therefore, equation of parabola is of the form<br />
x<sup>2</sup>&nbsp;= 4ay<br />
x<sup>2&nbsp;</sup>&nbsp;= 4(2)y i.e., x<sup>2</sup> = 8y</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the equation of the parabola which is symmetric about the y-axis, and passes through the point (2, -3).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Since the parabola is symmetric about the y-axis and has its vertex at the origin, the equation is of the form x<sup>2</sup> = 4ay or x<sup>2</sup> = -4ay,&nbsp;<br />
But the parabola passes through (2,&ndash;3) which lies in the fourth quadrant, it must open downwards.<br />
Thus the equation is of the form x<sup>2</sup> = -4ay<br />
Since the parabola passes through ( 2, -3), we have<br />
<span class="math-tex">{tex}2^{2}=-4 a(-3), \\text { i.e., } a=\\frac{1}{3}{/tex}</span><br />
Therefore, the equation of the parabola is<br />
<span class="math-tex">{tex}x^{2}=-4\\left(\\frac{1}{3}\\right) y, {/tex}</span>&nbsp;i.e., 3 x<sup>2</sup>&nbsp;= -4y</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the coordinates of the foci, the vertices, the length of major axis, the minor axis, the eccentricity and the latus rectum of the ellipse&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{25}+\\frac{y^{2}}{9}=1{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Since the denominator of&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{25}{/tex}</span>&nbsp;is larger than the denominator of&nbsp;<span class="math-tex">{tex}\\frac{y^{2}}{9}{/tex}</span>,&nbsp;the major&nbsp;axis is along the x-axis. Comparing the given equation with&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{a^{2}}+\\frac{y^{2}}{b^{2}}=1{/tex}</span>,&nbsp;we get<br />
a = 5 and b = 3. Also&nbsp;<span class="math-tex">{tex}c=\\sqrt{a^{2}-b^{2}}=\\sqrt{25-9}=4{/tex}</span>&nbsp;<br />
Therefore, the coordinates of the foci are (&ndash; 4,0) and (4,0), vertices are (&ndash; 5, 0) and (5, 0).<br />
Length of the major axis 2a is 10 units length of the minor axis 2b is 6 units &nbsp;<br />
Eccentricity is&nbsp;<span class="math-tex">{tex}\\frac{4}{5}{/tex}</span><br />
Length of latus rectum is&nbsp;<span class="math-tex">{tex}\\frac{2 b^{2}}{a}=\\frac{18}{5}{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Find the coordinates of the foci, the vertices, the lengths of major and minor axes and the eccentricity of the ellipse 9x<sup>2</sup> + 4y<sup>2</sup> = 36.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of the ellipse can be written in standard form as&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{4}+\\frac{y^{2}}{9}=1{/tex}</span><br />
Since the denominator of&nbsp;<span class="math-tex">{tex}\\frac{y^{2}}{9}{/tex}</span>&nbsp;is larger than the denominator of&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{4}{/tex}</span>&nbsp;,the major axis is along the y-axis. Comparing the given equation with the standard equation&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{b^{2}}+\\frac{y^{2}}{a^{2}}=1{/tex}</span>,&nbsp;we have b = 2 and a = 3.<br />
Also&nbsp;<span class="math-tex">{tex}c=\\sqrt{a^{2}-b^{2}}=\\sqrt{9-4}=\\sqrt{5}{/tex}</span><br />
and&nbsp;<span class="math-tex">{tex}e=\\frac{c}{a}=\\frac{\\sqrt{5}}{3}{/tex}</span><br />
Hence the foci are,<span class="math-tex">{tex}(0, \\sqrt{5}){/tex}</span>&nbsp;&amp;&nbsp;<span class="math-tex">{tex}(0,-\\sqrt{5}){/tex}</span>&nbsp;vertices are (0,3) &amp;&nbsp;(0, &ndash;3),</p>

<p>length of the major axis = 2a =&nbsp;6 units</p>

<p>the length of the minor axis =&nbsp;2b = 4 units and</p>

<p>the eccentricity of the ellipse =&nbsp;<span class="math-tex">{tex}\\frac{\\sqrt{5}}{3}{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Find the equation of the ellipse whose vertices are (<span class="math-tex">{tex}\\pm{/tex}</span>&nbsp;13, 0) and foci are (<span class="math-tex">{tex}\\pm{/tex}</span>&nbsp;5, 0).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Since the vertices are on x-axis, the equation will be of the form&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{a^{2}}+\\frac{y^{2}}{b^{2}}=1{/tex}</span>,&nbsp;where a is the semi-major axis.<br />
Given that&nbsp;vertices are (<span class="math-tex">{tex}\\pm{/tex}</span>&nbsp;13, 0) and foci are (<span class="math-tex">{tex}\\pm{/tex}</span>&nbsp;5, 0)&nbsp; ==&gt;&gt; a = 13, c = ae = <span class="math-tex">{tex}\\pm{/tex}</span>5<br />
Therefore, from the relation c<sup>2</sup> = a<sup>2</sup> &ndash; b<sup>2</sup> , we get<br />
25 = 169 &ndash; b<sup>2</sup> , i.e., b = 12<br />
Hence the equation of the ellipse is&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{169}+\\frac{y^{2}}{144}=1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Find the equation of the ellipse, whose length of the major axis is 20 and foci are (0, <span class="math-tex">{tex}\\pm{/tex}</span>&nbsp;5).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Since the foci are on the y-axis, the major axis is along the y-axis. So, the equation&nbsp;of the ellipse is of the form&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{b^{2}}+\\frac{y^{2}}{a^{2}}=1{/tex}</span><br />
Given,&nbsp;length of the major axis is 20 and foci are (0,&nbsp;&plusmn;&nbsp;5).&nbsp; ==&gt; 2a = 20 and c = ae = 5<br />
a = semi-major axis =&nbsp;<span class="math-tex">{tex}\\frac{20}{2}{/tex}</span>= 10<br />
and the relation&nbsp;c<sup>2</sup> = a<sup>2</sup> &ndash; b<sup>2</sup> gives&nbsp;<br />
5<sup>2</sup> = 10<sup>2</sup> &ndash; b<sup>2</sup> i.e., b<sup>2</sup> = 75<br />
Therefore, the equation of the ellipse is&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{75}+\\frac{y^{2}}{100}=1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>Find the equation of the ellipse, with major axis along the x-axis and passing through the points (4, 3) and (&ndash;1, 4).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The standard form of the ellipse is&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{a^{2}}+\\frac{y^{2}}{b^{2}}=1{/tex}</span>&nbsp;Since the points (4, 3)&nbsp;and (&ndash;1, 4) lie on the ellipse, we have<br />
<span class="math-tex">{tex}\\frac{16}{a^{2}}+\\frac{9}{b^{2}}=1{/tex}</span>&nbsp;... equation(1)<br />
and&nbsp;<span class="math-tex">{tex}\\frac{1}{a^{2}}+\\frac{16}{b^{2}}=1{/tex}</span>&nbsp;&hellip;.equation(2)<br />
Solving equations (1) and (2), we find that&nbsp;<span class="math-tex">{tex}a^{2}=\\frac{247}{7}{/tex}</span>&nbsp;and&nbsp;&nbsp;<span class="math-tex">{tex}b^{2}=\\frac{247}{15}{/tex}</span>.<br />
Hence the required equation is&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{\\left(\\frac{247}{7}\\right)}+\\frac{y^{2}}{(\\frac{247}{15})}=1{/tex}</span>,&nbsp;i.e., 7x<sup>2</sup> + 15y<sup>2</sup> = 247.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14(1)</span></div><div class="question-text"><p>Find the coordinates of the foci and the vertices, the eccentricity, the length of the latus rectum of the hyperbola:&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{9}-\\frac{y^{2}}{16}=1{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Comparing the equation&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{9}-\\frac{y^{2}}{16}=1{/tex}</span>&nbsp;with the standard equation&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{a^{2}}-\\frac{y^{2}}{b^{2}}=1{/tex}</span><br />
Here, a = 3, b = 4 and c =&nbsp;<span class="math-tex">{tex}\\sqrt{a^{2}+b^{2}}=\\sqrt{9+16}=5{/tex}</span>&nbsp;==&gt; c = ae = 5<br />
Therefore, the coordinates of the foci are (<span class="math-tex">{tex}\\pm{/tex}</span>&nbsp;5, 0) and that of vertices are (&plusmn; 3, 0). Also,<br />
The eccentricity&nbsp;<span class="math-tex">{tex}e=\\frac{c}{a}=\\frac{5}{3}{/tex}</span>.&nbsp;The length oflatus rectum&nbsp;<span class="math-tex">{tex}=\\frac{2 b^{2}}{a}=\\frac{32}{3}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14(2)</span></div><div class="question-text"><p>Find the coordinates of the foci and the vertices, the eccentricity, the length of the latus rectum of the hyperbola:&nbsp;y<sup>2</sup> &ndash; 16x<sup>2</sup> = 16</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Dividing the equation by 16 on both sides, we have&nbsp;<span class="math-tex">{tex}\\frac{y^{2}}{16}-\\frac{x^{2}}{1}=1{/tex}</span><br />
Comparing the equation with the standard equation&nbsp;<span class="math-tex">{tex}\\frac{y^{2}}{a^{2}}-\\frac{x^{2}}{b^{2}}=1{/tex}</span>,&nbsp;we find that<br />
a = 4, b = 1 and&nbsp;<span class="math-tex">{tex}c=\\sqrt{a^{2}+b^{2}}=\\sqrt{16+1}=\\sqrt{17}{/tex}</span>&nbsp;==&gt; c = ae =&nbsp;<span class="math-tex">{tex}\\sqrt 17{/tex}</span><br />
Therefore, the coordinates of the foci are (0, <span class="math-tex">{tex}\\pm{/tex}</span>&nbsp;<span class="math-tex">{tex}\\sqrt{17}{/tex}</span> ) and that of the vertices are (0, <span class="math-tex">{tex}\\pm{/tex}</span>&nbsp;4). Also<br />
The eccentricity&nbsp;<span class="math-tex">{tex}e=\\frac{c}{a}=\\frac{\\sqrt{17}}{4}{/tex}</span>.&nbsp;The length of latus rectum&nbsp;<span class="math-tex">{tex}=\\frac{2 b^{2}}{a}=\\frac{1}{2}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 15</span></div><div class="question-text"><p>Find the equation of the hyperbola with foci (0, <span class="math-tex">{tex}\\pm{/tex}</span>&nbsp;3) and vertices&nbsp;<span class="math-tex">{tex}\\left(0, \\pm \\frac{\\sqrt{11}}{2}\\right){/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Since the foci is on the y-axis, the equation of the hyperbola is of the form&nbsp;<span class="math-tex">{tex}\\frac{y^{2}}{a^{2}}-\\frac{x^{2}}{b^{2}}=1{/tex}</span></p>

<p>given, foci (0, <span class="math-tex">{tex}\\pm{/tex}</span>&nbsp;3) and vertices&nbsp;<span class="math-tex">{tex}\\left(0, \\pm \\frac{\\sqrt{11}}{2}\\right){/tex}</span><br />
Since vertices are&nbsp;<span class="math-tex">{tex}\\left(0, \\pm \\frac{\\sqrt{11}}{2}\\right), \\quad a=\\frac{\\sqrt{11}}{2}{/tex}</span><br />
Also, since foci are (0, &plusmn; 3); c= ae = 3 and&nbsp;b<sup>2</sup> = c<sup>2</sup> &ndash; a<sup>2</sup> =&nbsp;<span class="math-tex">{tex}\\frac{25}{4}{/tex}</span><br />
Therefore, the equation of the hyperbola is&nbsp;<span class="math-tex">{tex}\\frac{y^{2}}{\\left(\\frac{11}{4}\\right)}-\\frac{x^{2}}{\\left(\\frac{25}{4}\\right)}{/tex}</span>&nbsp;= 1, i.e., 100 y<sup>2</sup> &ndash; 44 x<sup>2</sup> = 275&nbsp;&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 16</span></div><div class="question-text"><p>Find the equation of the hyperbola where foci are (0, <span class="math-tex">{tex}\\pm{/tex}</span>12) and the length of the latus rectum is 36.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have given&nbsp; foci are (0, <span class="math-tex">{tex}\\pm{/tex}</span>12),<br />
it follows that c = 12<br />
Length of the latus rectum =&nbsp;<span class="math-tex">{tex}\\frac{2 b^{2}}{a}{/tex}</span>&nbsp;= 36&nbsp;or b<sup>2</sup> = 18a<br />
Therefore&nbsp;&nbsp;c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup>; gives<br />
144 = a<sup>2</sup> + 18a<br />
i.e., a<sup>2</sup> + 18a &ndash; 144 = 0,<br />
So a = &ndash; 24, 6.<br />
Since a cannot be negative, we take a = 6 and so b<sup>2</sup> = 108<br />
No,&nbsp;the equation of the hyperbola is&nbsp;<span class="math-tex">{tex}\\frac{y^{2}}{36}-\\frac{x^{2}}{108}=1, \\text { i.e., } 3 y^{2}-x^{2}=108{/tex}</span><br />
Hence, the equation of the hyperbola =&nbsp;<span class="math-tex">{tex} 3 y^{2}-x^{2}=108{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 17</span></div><div class="question-text"><p>The focus of a parabolic mirror as shown in is at a distance of 5 cm from its vertex. If the mirror is 45 cm deep, find the distance AB</p>

<p><img alt="" data-imgur-src="YoiNVmJ.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/YoiNVmJ.png" style="width: 179px; height: 198px;" /></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Since the distance from the focus to the vertex is 5 cm. We have, a = 5. If the origin is taken at the vertex and the axis of the mirror lies along the positive x-axis, the equation of the parabolic section is<br />
y<sup>2</sup> = 4 (5) x = 20 x&nbsp; &nbsp;==&gt;&nbsp; required eqution of parabola y<sup>2</sup> = 20x<br />
Note that x = 45. Thus<br />
y<sup>2</sup> = 900<br />
Therefore y = <span class="math-tex">{tex}\\pm{/tex}</span>&nbsp;30<br />
Hence AB = 2y = 2 <span class="math-tex">{tex}\\times{/tex}</span>&nbsp;30 = 60 cm&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 18</span></div><div class="question-text"><p>A beam is supported at its ends by supports which are 12 metres apart. Since the load is concentrated at its centre, there&nbsp;is a deflection of 3 cm at the centre and the deflected beam is in the shape of a parabola. How far from the centre is the deflection 1 cm?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><html><body><p><img alt="" data-imgur-src="j1YbA86.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/j1YbA86.png" style="width: 250px; height: 110px;"/></p>
<p>The equation of the parabola takes the form x<sup>2</sup> = 4ay. Since it passes through<br/>
<span class="math-tex">{tex}\\left(6, \\frac{3}{100}\\right){/tex}</span> we have <span class="math-tex">{tex}(6)^{2}=4 a\\left(\\frac{3}{100}\\right){/tex}</span> , i.e., <span class="math-tex">{tex}a=\\frac{36 \\times 100}{12}=300 \\mathrm{m}{/tex}</span> <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 300m<br/>
Let AB be the deflection of the beam which is  <span class="math-tex">{tex}\\frac{1}{100} \\mathrm{m}{/tex}</span> Coordinates of B are <span class="math-tex">{tex}\\left(x, \\frac{2}{100}\\right){/tex}</span><br/>
Therefore <span class="math-tex">{tex}x^{2}=4 \\times 300 \\times \\frac{2}{100}=24{/tex}</span><br/>
i.e. <span class="math-tex">{tex}x=\\sqrt{24}=2 \\sqrt{6}{/tex}</span> m</p></body></html></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 19</span></div><div class="question-text"><p>A rod AB of length 15 cm rests in between two coordinate axes in such a way that the end point A lies on x-axis and end point B lies on y-axis. A point P(x, y) is taken on the rod in such a way that AP = 6 cm. Show that the locus of P is an ellipse.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><html><body><p>Let AB be the rod making an angle θ with OX as shown in figure and P (x, y) the point on it such that AP = 6 cm<br/>
Since AB = 15 cm, we have<br/>
<img alt="" data-imgur-src="MqwP0zv.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/MqwP0zv.png" style="width: 171px; height: 144px;"/><br/>
PB = 9 cm.<br/>
From P draw PR and PQ perpendiculars on x-axis and y-axis, respectively.<br/>
From <span class="math-tex">{tex}\\Delta \\mathrm{PBQ}, \\cos \\theta=\\frac{x}{9}{/tex}</span><br/>
From <span class="math-tex">{tex}\\Delta \\mathrm{PRA}, \\sin \\theta=\\frac{y}{6}{/tex}</span><br/>
Since cos<sup>2</sup> θ + sin<sup>2</sup> θ = 1<br/>
<span class="math-tex">{tex}\\left(\\frac{x}{9}\\right)^{2}+\\left(\\frac{y}{6}\\right)^{2}=1{/tex}</span><br/>
or <span class="math-tex">{tex}\\frac{x^{2}}{81}+\\frac{y^{2}}{36}=1{/tex}</span><br/>
Therefore, locus of P is an ellipse.</p></body></html></div></div></div>
`;

export const EX10_1_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Find the equation of the circle with centre (0, 2) and radius 2</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here h = 0, k = 2 and r = 2<br />
The equation of circle is<br />
(x - h)<sup>2</sup> + (y - k)<sup>2</sup> = r<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (x - 0)<sup>2</sup> + (y - 2)<sup>2</sup> = (2)<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + y<sup>2</sup> + 4 - 4y = 4<br />
x<sup>2</sup> + y<sup>2</sup> - 4y = 0<br />
Which is required equation of circle.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Find the equation of the circle with centre (-2, 3) and radius 4</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here h = -2, k = 3 and r = 4<br />
The equation of circle is<br />
(x - h)<sup>2</sup> + (y - k)<sup>2</sup> = r<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (x + 2)<sup>2</sup> + (y - 3)<sup>2</sup> = (4)<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + 4 + 4x + y<sup>2</sup> + 9 - 6y = 16<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + y<sup>2</sup> + 4x - 6y - 3 = 0<br />
Which is required equation of circle.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Find the equation of the circle with centre&nbsp;<span class="math-tex">{tex}\\left( \\frac { 1 } { 2 } , \\frac { 1 } { 4 } \\right){/tex}</span>&nbsp;and radius&nbsp;<span class="math-tex">{tex}\\frac { 1 } { 12 }{/tex}</span>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><html><body><p>Given centre is <span class="math-tex">{tex}\\left( \\frac { 1 } { 2 } , \\frac { 1 } { 4 } \\right){/tex}</span><br/>
<img alt="" data-imgur-src="26v0OCC.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/26v0OCC.png"/><br/>
<span class="math-tex">{tex}\\therefore{/tex}</span> h = <span class="math-tex">{tex}\\frac { 1 } { 2 }{/tex}</span>, k = <span class="math-tex">{tex}\\frac { 1 } { 4 }{/tex}</span> and radius, r = <span class="math-tex">{tex}\\frac { 1 } { 12 }{/tex}</span> <br/>
On putting these values in equation of circle<br/>
(x - h)<sup>2</sup> + (y - k)<sup>2</sup> = r<sup>2</sup>, we get<br/>
<span class="math-tex">{tex}\\left( x - \\frac { 1 } { 2 } \\right) ^ { 2 } + \\left( y - \\frac { 1 } { 4 } \\right) ^ { 2 } = \\left( \\frac { 1 } { 12 } \\right) ^ { 2 }{/tex}</span><br/>
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + <span class="math-tex">{tex}\\frac { 1 } { 4 }{/tex}</span> - x + y<sup>2</sup> + <span class="math-tex">{tex}\\frac { 1 } { 16 }{/tex}</span> - <span class="math-tex">{tex}\\frac { y } { 2 }{/tex}</span> = <span class="math-tex">{tex}\\frac { 1 } { 144 }{/tex}</span><br/>
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + y<sup>2</sup> - x - <span class="math-tex">{tex}\\frac { y } { 2 } + \\frac { 1 } { 4 } + \\frac { 1 } { 16 } - \\frac { 1 } { 144 }{/tex}</span> = 0<br/>
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + y<sup>2</sup> - x - <span class="math-tex">{tex}\\frac { y } { 2 } + \\frac { 11 } { 36 }{/tex}</span> = 0<br/>
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 36x<sup>2</sup> + 36y<sup>2 </sup>- 36x - 18y + 11 = 0<br/>
which is the required equation of circle.</p></body></html></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Find the equation of the circle with centre (1, 1) and radius <span class="math-tex">{tex}\\sqrt2{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here h = 1, k =1 and r = <span class="math-tex">{tex}\\sqrt2{/tex}</span><br />
The equation of circle is<br />
(x - h)<sup>2</sup> + (y - k)<sup>2</sup> = r<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (x - 1)<sup>2</sup> + (y - 1)<sup>2</sup> = <span class="math-tex">{tex}{(\\sqrt 2 )^2}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + 1 - 2x + y<sup>2</sup> + 1 - 2y = 2<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + y<sup>2</sup> - 2x - 2y = 0<br />
Which is required equation of circle.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the equation of the circle with centre (-a, -b) and radius <span class="math-tex">{tex}\\sqrt {{a^2} - {b^2}}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here h = -a, k = -b and r = <span class="math-tex">{tex}\\sqrt {{a^2} - {b^2}}{/tex}</span><br />
The equation of circle is<br />
(x - h)<sup>2</sup> + (y - k)<sup>2</sup> = r<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (x + a)<sup>2</sup> + (y + b)<sup>2</sup> = <span class="math-tex">{tex}{\\left( {\\sqrt {{a^2} - {b^2}} } \\right)^2}{/tex}</span><br />
<span>​</span><span class="math-tex">{tex}\\Rightarrow{/tex}</span><span>​ x</span><sup>2</sup> <span> + a</span><sup>2</sup> + 2ax + y<sup>2</sup> + b<sup>2</sup> +2by = a<sup>2</sup> - b<sup>2</sup><br />
<span>​</span><span class="math-tex">{tex}\\Rightarrow{/tex}</span><span>​ x</span><sup>2</sup> + y<sup>2</sup> + 2ax + 2by + 2b<sup>2</sup> = 0<br />
Which is required equation of circle.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find the centre and radius of the circle. (x + 5)<sup>2 </sup>+ (y - 3)<sup>2</sup> = 36</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of circle is<br />
(x + 5)<sup>2 </sup>+ (y - 3)<sup>2</sup> = 36&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp; (x + 5)<sup>2 </sup>+ (y - 3)<sup>2</sup> = (6)<sup>2</sup><br />
Comparing it with (x - h)<sup>2</sup> + (y - k)<sup>2</sup> = r<sup>2</sup> we have<br />
h = -5, k = 3 and r = 6<br />
Thus the coordinates of the centre is (-5, 3) and radius is 6.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the centre and radius of the circle. x<sup>2</sup> + y<sup>2</sup> - 4x - 8y - 45 = 0</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of circle is<br />
x<sup>2</sup> + y<sup>2</sup> - 4x - 8y - 45 = 0<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp; (x<sup>2</sup> -&nbsp; 4x) + (y<sup>2</sup> - 8y)&nbsp; = 45<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> [x<sup>2</sup> - 4x + (2)<sup>2</sup>] + [y<sup>2</sup> - 8y + (4)<sup>2</sup>]<br />
= 45 + (2)<sup>2</sup> + (4)<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> (x - 2)<sup>2</sup> + (y - 4)<sup>2</sup> = 45 + 4 + 16<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> (x - 2)<sup>2</sup> + (y - 4)<sup>2</sup> = 65<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> (x - 2)<sup>2</sup> + (y - 4)<sup>2</sup> = <span class="math-tex">{tex}{(\\sqrt {65} )^2}{/tex}</span><br />
Comparing it with (x - h)<sup>2</sup> + (y - k)<sup>2</sup> = r<sup>2</sup>, we have<br />
h = 2 , k = 4 and r = <span class="math-tex">{tex}\\sqrt{65}{/tex}</span><br />
Thus coordinates of the centre is (2, 4) and radius is&nbsp;<span class="math-tex">{tex}\\sqrt{65}{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the centre and radius of the circle. x <sup>2</sup> + y <sup>2</sup> - 8x +&nbsp;10y - 12 = 0</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of circle is<br />
x <sup>2</sup> +y <sup>2</sup>&nbsp; - 8x - 10y - 12 = 0<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (x <sup>2</sup> - 8x) + (y <sup>2</sup> + 10y) = 12<br />
Completing the square<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> [x <sup>2</sup> - 8x + (4) <sup>2</sup>] + [y <sup>2</sup> + 10y + (5) <sup>2</sup>]<br />
= 12 + (4) <sup>2</sup>&nbsp; + (5) <sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> (x - 4) <sup>2</sup> + (y + 5) <sup>2</sup> = 12 + 16 + 25<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> (x - 4) <sup>2</sup> + (y + 5) <sup>2</sup> = 53<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> (x - 4) <sup>2</sup> + (y + 5) <sup>2</sup> = <span class="math-tex">{tex}(\\sqrt{53})^2{/tex}</span><br />
Comparing it with (x - h) <sup>2</sup> + (y - k) <sup>2</sup> = r <sup>2</sup>, we have<br />
h = 4, k = -5 and&nbsp; r = <span class="math-tex">{tex}\\sqrt{53}{/tex}</span><br />
Thus coordinates of the centre is (4, -5) and radius is&nbsp;<span class="math-tex">{tex}\\sqrt{53}{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the centre and radius of the circle x<sup>2</sup> + y<sup>2</sup> - 8x + 10y - 12 = 0.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation can be written as<br />
(x<sup>2</sup> - 8x) + (y<sup>2&nbsp;</sup>- 10y) = 12<br />
Completing the squares, we get<br />
(x<sup>2</sup> - 8x + 16) + (y<sup>2</sup> + 10y + 25) = 12 + 16 + 25<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;(x - 4)<sup>2</sup> + (y + 5)<sup>2</sup> = 53<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;(x - 4)<sup>2</sup> + (y - (-5))<sup>2</sup> = (<span class="math-tex">{tex}\\sqrt {53}{/tex}</span>)<sup>2</sup>, which is comparable with<br />
(x - h)<sup>2</sup> + (y - k)<sup>2</sup> = r<sup>2</sup><br />
Here h = 4, k = -5 and r = <span class="math-tex">{tex}\\sqrt {53}{/tex}</span><br />
Hence, the given circle has centre at (4, -5) and its radius is <span class="math-tex">{tex}\\sqrt {53}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the centre and radius of the circle 2x<sup>2</sup>&nbsp;+ 2y<sup>2&nbsp;</sup>- x = 0.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of circle is<br />
2x<sup>2</sup>&nbsp;+ 2y<sup>2</sup>&nbsp;- x = 0&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x<sup>2</sup>&nbsp;+ y<sup>2</sup>&nbsp;-&nbsp;<span class="math-tex">{tex}\\frac { x } { 2 }{/tex}</span>&nbsp;= 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span><sup>&nbsp;</sup><span class="math-tex">{tex}\\left( x ^ { 2 } - \\frac { x } { 2 } \\right){/tex}</span><sup>&nbsp;</sup>+ y<sup>2</sup>&nbsp;= 0<br />
On adding&nbsp;<span class="math-tex">{tex}\\frac { 1 } { 16 }{/tex}</span>&nbsp;to make perfect squares, we get<br />
<span class="math-tex">{tex}\\left( x ^ { 2 } - \\frac { x } { 2 } + \\frac { 1 } { 16 } \\right){/tex}</span>&nbsp;+ y<sup>2</sup>&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac { 1 } { 16 }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\left( x - \\frac { 1 } { 4 } \\right) ^ { 2 }{/tex}</span>&nbsp;+ (y - 0)<sup>2</sup>&nbsp;=&nbsp;<span class="math-tex">{tex}\\left( \\frac { 1 } { 4 } \\right) ^ { 2 }{/tex}</span><br />
On comparing with (x - h)<sup>2</sup> + &nbsp;(y - &nbsp;k)<sup>2</sup>&nbsp;= &nbsp;r<sup>2</sup>, we get<br />
h =&nbsp;<span class="math-tex">{tex}\\frac { 1 } { 4 }{/tex}</span>, k = 0 and r =&nbsp;<span class="math-tex">{tex}\\frac { 1 } { 4 }{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Centre = (h, k) =&nbsp;<span class="math-tex">{tex}\\left( \\frac { 1 } { 4 } , 0 \\right){/tex}</span><br />
and Radius =&nbsp;<span class="math-tex">{tex}\\frac { 1 } { 4 }{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Find the equation of the circle passing through the points (4, 1) and (6, 5) and whose centre is on the line 4x + y = 16.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of the circle is<br />
(x - h)<sup>2</sup> + (y - k)<sup>2</sup> = r<sup>2</sup> .... (i)<br />
Since the circle passes through point (4, 1)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (4 - h)<sup>2</sup> + (1 - k)<sup>2</sup> = r<sup>2</sup> <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 16 + h<sup>2</sup> - 8h + 1 + k<sup>2</sup> - 2k = r<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> h<sup>2</sup> + k<sup>2</sup> - 8h - 2k + 17 = r<sup>2</sup> .... (ii)<br />
Also the circle passes through point (6, 5)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (6 - h)<sup>2</sup> + (5 - k)<sup>2</sup> = r<sup>2</sup> <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 36 + h<sup>2</sup>&nbsp; - 12h + 25 + k<sup>2</sup>&nbsp; - 10k = r<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> h<sup>2</sup> + k<sup>2</sup> - 12h - 10k + 61 = r<sup>2</sup><br />
From (ii) and (iii), we have<br />
h<sup>2</sup> + k<sup>2</sup>&nbsp; - 8h - 2k + 17 = h<sup>2</sup>&nbsp; + k<sup>2</sup>&nbsp; - 12h - 10k + 61<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 4h + 8k = 44 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> h + 2k = 11 .... (iv)<br />
Since the centre (h, k) of the circle lies on the line 4x + y = 16<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;4h + k = 16 . . . (v)<br />
Solving (iv) and (v), we have<br />
h = 3 and k = 4<br />
Putting value of h and k in (ii), we have<br />
(3)<sup>2</sup> + (4)<sup>2</sup> - 8 &times; 3 - 2 &times; 4 + 17 = r<sup>2</sup><br />
r<sup>2</sup> = 10<br />
Thus equation of required circle is<br />
(x - 3)<sup>2</sup> + (y - 4)<sup>2</sup> = 10&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + 9 - 6x + y<sup>2</sup> + 16 - 8y = 10<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + y<sup>2</sup> - 6x - 8y + 15 =0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Find the equation of the circle passing through the points (2, 3) and (-1, 1) and whose centre is on the line x - 3y - 11 = 0.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of the circle is<br />
(x - h)<sup>2</sup> + (y - k)<sup>2</sup> =&nbsp;<span class="math-tex">{tex}r^2.....(1){/tex}</span></p>

<p><span class="math-tex">{tex}Since\\ the\\ circle\\ passes\\ through\\ ( -1,1),\\\\ \\therefore\\ (-1-h)^2+(1-k)^2=r^2\\\\ \\Rightarrow 1+h^2+2h+1+k^2-2k=r^2\\\\ \\Rightarrow h^2+k^2+2h-2k+2=r^2......(2){/tex}</span><br />
Since the circle passes through point (2, 3)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (2 - h)<sup>2</sup> + (3 - k)<sup>2</sup> = r<sup>2</sup> <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 4 + h<sup>2</sup> - 4h + 9 + k<sup>2</sup> - 6k = r<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> h<sup>2</sup> + k<sup>2</sup>&nbsp;-4h - 6k + 13=&nbsp;<span class="math-tex">{tex}r^2........(3){/tex}</span><br />
From (2) and (3), we have<br />
h<sup>2</sup> + k<sup>2</sup> -4h - 6k + 13 = h<sup>2</sup> + k<sup>2</sup>&nbsp; + 2h - 2k + 2<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> -6h - 4k = -11 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 6h + 4k = 11 .... (4)<br />
Since the centre (h, k) of the circle lies on the line (x - 3y - 11 = 0)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> h - 3k - 11 = 0 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> h - 3k = 11 . . . (5)<br />
Solving (4) and (5), we have,<br />
<span class="math-tex">{tex}h = \\frac{7}{2}{/tex}</span> and&nbsp; <span class="math-tex">{tex}k = \\frac{{ - 5}}{2}{/tex}</span><br />
Putting these values of h and k in (3), we have<br />
<span class="math-tex">{tex}{\\left( {\\frac{7}{2}} \\right)^2} + {\\left( {\\frac{{ - 5}}{2}} \\right)^2} - \\frac{{4 \\times 7}}{2} - 6 \\times \\frac{{ - 5}}{2} + 13 = {r^2}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\frac{{49}}{4} + \\frac{{25}}{4} - 14 + 15 + 13 = {r^2} \\Rightarrow {r^2} = \\frac{{65}}{2}{/tex}</span><br />
Thus equation of required circle is<br />
<span class="math-tex">{tex}{\\left( {x - \\frac{7}{2}} \\right)^2} + {\\left( {y + \\frac{5}{2}} \\right)^2} = \\frac{{65}}{2}{/tex}</span><span class="math-tex">{tex}\\Rightarrow {x^2} + \\frac{{49}}{4} - 7x + {y^2} + \\frac{{25}}{4} + 5y = \\frac{{65}}{2}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 4x<sup>2</sup> + 49 &ndash; 28x + 4y<sup>2</sup> + 25 + 20y = 130<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 4x<sup>2</sup> + 4y<sup>2</sup> &ndash; 28x + 20y &ndash; 56 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 4(x<sup>2</sup> + y<sup>2</sup> &ndash; 7x + 5y &ndash; 14) = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + y<sup>2</sup> &ndash; 7x + 5y &ndash; 14 = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Find the equation of the circle with radius 5 whose centre lies on x-axis and passes through the point (2, 3).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Since the centre of the circle lies on x-axis, the coordinates of centres is (h, 0)<br />
Now the circle passes through the point (2, 3)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Radius of circle <span class="math-tex">{tex} = \\sqrt {{{(h - 2)}^2} + {{(0 - 3)}^2}} = \\sqrt {{h^2} + 4 - 4h + 9} {/tex}</span> <span class="math-tex">{tex}= \\sqrt {{h^2} - 4h + 13}{/tex}</span><br />
But radius of circle = 5<br />
<span class="math-tex">{tex}\\therefore \\;\\sqrt {{h^2} - 4h + 13} = 5{/tex}</span> <span class="math-tex">{tex}\\Rightarrow{/tex}</span> h<sup>2</sup> - 4h + 13 = 25 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> h<sup>2</sup> - 4h - 12 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> (h - 6)(h + 2) = 0 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> h = 6 or h = -2<br />
When h = 6<br />
Equation of required circle is<br />
(x - 6)<sup>2</sup> + (y - 0)<sup>2</sup> = (5)<sup>2</sup> <span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + 36 - 12x + y<sup>2</sup> = 25<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + y<sup>2</sup> -12x + 11 = 0<br />
When h = -2<br />
Equation of required circle is<br />
(x + 2)<sup>2</sup> + (y - 0)<sup>2</sup> = (5)<sup>2</sup> <span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + 4 + 4x + y<sup>2</sup> = 25<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + y<sup>2</sup> + 4x - 21 = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>Find the equation of the circle passing through (0, 0) and making intercepts a and b on the coordinate axes.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The circle makes intercepts a with x-axis and b with y-axis.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> OA = a and OB = b<br />
So the co-ordinates of A are (a, 0) and B are (0, b)<br />
Now the circle passes through three points O(0, 0), A (a, 0) and B(0, b)<br />
Putting the co-ordinates of three points in the equation of circle.<br />
x<sup>2</sup> + y<sup>2</sup> + 2gx + 2fy + c = 0. . . (i)<br />
c = 0<br />
a<sup>2</sup> + 2ga = 0 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a(a + 2 g) = 0 <span class="math-tex">{tex}\\Rightarrow g = \\frac{{ - 1}}{2}a{/tex}</span><br />
b<sup>2</sup> + 2fb = 0 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b (b + 2 f ) = 0 <span class="math-tex">{tex}\\Rightarrow f = \\frac{{ - 1}}{2}b{/tex}</span><br />
Putting these values of g, f and c in (i) we have<br />
<span class="math-tex">{tex}{x^2} + {y^2} + 2 \\times \\frac{{ - 1}}{2}ax + 2 \\times \\frac{{ - 1}}{2}by + 0 = 0{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + y<sup>2</sup> - ax - by = 0<br />
which is required equation of circle.<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_11/image159.png" style="width: 130px; height: 118px;" /></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>Find the equation of a circle with centre (2, 2) and passes through the point (4, 5).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of circle is<br />
(x - h)<sup>2</sup> + (y - k)<sup>2</sup> = r<sup>2</sup> . . . (i)<br />
Since the circle passes through point (4, 5) and co-ordinates of centre are (2, 2).<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> radius of circle <span class="math-tex">{tex}= \\sqrt {{{(4 - 2)}^2} + {{(5 - 2)}^2}} = \\sqrt {4 + 9} = \\sqrt {13}{/tex}</span><br />
Now the equation of required circle is<br />
(x - 2)<sup>2</sup>&nbsp; + (y - 2)<sup>2</sup> = <span class="math-tex">{tex}(\\sqrt{13})^2{/tex}</span> <span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + 4 - 4x + y<sup>2</sup> + 4 - 4y = 13<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> + y<sup>2</sup> - 4x - 4y - 5 = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 15</span></div><div class="question-text"><p>Does the point (-2.5, 3.5) lie inside, outside or on the circle x<sup>2</sup> + y<sup>2</sup> = 25?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given circle is<br />
x<sup>2</sup> + y<sup>2</sup> = 25<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> (x - 0)<sup>2</sup> + (y - 0)<sup>2</sup> = (5)<sup>2</sup><br />
Comparing it with (x - h)<sup>2</sup> + (y - k)<sup>2</sup>&nbsp; = r<sup>2</sup>, we have<br />
h = 0 , k = 0 and r = 5<br />
Now distance of the point (-2.5, 3.5) from the centre (0, 0)<br />
<span class="math-tex">{tex}= \\sqrt {{{(0 + 2.5)}^2} + {{(0 - 3.5)}^2}} = \\sqrt {6.25 + 12.25} = \\sqrt {18.5}{/tex}</span> = 4.3 &lt; 5<br />
Thus the point (-2.5, 3.5)lies inside the circle.</p></div></div></div>
`;

export const EX10_2_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Find the coordinates of the focus, axis of the parabola, the equation of the directrix and the length of the latus rectum:&nbsp;y<sup>2</sup> = 12x</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation&nbsp;of parabola is y<sup>2</sup> = 12x which is of the form y<sup>2</sup> = 4ax.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> 4a = 12&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 3<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of focus are (3, 0)<br />
Axis of parabola is y = 0<br />
Equation of the directrix is x = -3 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> x + 3 = 0<br />
Length of latus rectum = 4<span class="math-tex">{tex}\\times{/tex}</span>3 = 12</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Find the coordinates of the focus, axis of the parabola, the equation of the directrix and the length of the latus rectum:&nbsp;x<sup>2</sup> = 6y</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of parabola is x<sup>2</sup> = 6y which is of the form x<sup>2</sup> = 4ay<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> 4a = 6 <span class="math-tex">{tex}\\Rightarrow a = \\frac{6}{4} \\Rightarrow a = \\frac{3}{2}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Coordinates of focus are <span class="math-tex">{tex}\\left( {0,\\;\\frac{3}{2}} \\right){/tex}</span><br />
Axis of parabola is x = 0<br />
Equation of the directrix is <span class="math-tex">{tex}y = \\frac{{ - 3}}{2} \\Rightarrow{/tex}</span> 2y + 3 =0<br />
Length of latus rectum <span class="math-tex">{tex}= \\frac{{4 \\times 3}}{2}{/tex}</span> = 6</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Find the coordinates of the focus, axis of the parabola, the equation of the directrix and the length of the latus rectum:&nbsp;y<sup>2</sup> = -8x</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of parabola is y<sup>2</sup> = -8x which is of the form y<sup>2</sup> = -4 ax<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> 4a = 8 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 2<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of focus are (-2, 0)<br />
Axis of parabola is y = 0<br />
Equation of the directrix is x = 2 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> x - 2= 0<br />
Length of latus rectum = 4 <span class="math-tex">{tex}\\times{/tex}</span> 2 = 8</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Find the coordinates of the focus, axis of the parabola, the equation of the directrix and the length of the latus rectum:&nbsp;x<sup>2</sup> = -16y</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of parabola is x<sup>2</sup> = 16y which is of the form x<sup>2</sup> = -4ay<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> 4a = 16 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 4<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Coordinates of focus are (0, -4)<br />
Axis of parabola is x = 0<br />
Equation of the directrix is y = 4&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>y - 4 = 0<br />
Length of latus rectum = 4 <span class="math-tex">{tex}\\times{/tex}</span> 4 = 16</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the coordinates of the focus, axis of the parabola, the equation of the directrix and the length of the latus rectum:&nbsp;y<sup>2</sup> = 10x</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of parabola is y<sup>2</sup> = 10x which is of the form y<sup>2</sup> = 4ax<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> 4a = 10 <span class="math-tex">{tex}\\Rightarrow a = \\frac{{10}}{4} \\Rightarrow a = \\frac{5}{2}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of focus are&nbsp;<span class="math-tex">{tex}\\left( {\\frac{5}{2},\\;0} \\right){/tex}</span><br />
Axis of parabola is y = 0<br />
Equation of the directrix is <span class="math-tex">{tex}x = \\frac{{ - 5}}{2} \\Rightarrow{/tex}</span> 2 x + 5 = 0<br />
Length of latus rectum <span class="math-tex">{tex} = \\frac{{4 \\times 5}}{2} = 10{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find the coordinates of the focus, axis of the parabola, the equation of the directrix and the length of the latus rectum:&nbsp;x<sup>2</sup> = -9y</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of parabola is x<sup>2</sup> = -9y which is of the form x<sup>2</sup> = -4ay<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> 4a = 9 <span class="math-tex">{tex}\\Rightarrow a = \\frac{9}{4}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of focus are <span class="math-tex">{tex}\\left( {0,\\;\\frac{{ - 9}}{4}} \\right){/tex}</span><br />
Axis of parabola is x = 0<br />
Equation of the directrix is <span class="math-tex">{tex}y = \\frac{9}{4} \\Rightarrow{/tex}</span> 4y - 9 = 0<br />
Length of latus rectum&nbsp;<span class="math-tex">{tex}= 4 \\times \\frac{9}{4} = 9{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the equation of the parabola that satisfies the given conditions: Focus (6, 0) directrix x = -6</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The required equation of parabola is<br />
y<sup>2</sup> = 4 <span class="math-tex">{tex}\\times{/tex}</span> 6x <span class="math-tex">{tex}\\Rightarrow{/tex}</span> y<sup>2</sup> = 24x</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the equation of the parabola that satisfies the given conditions: Focus (0, - 3) directrix y = 3</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Since the focus (0, - 3) lies on the y-axis, therefore y-axis is the axis of parabola. Also the directrix is y = 3 i.e. y = a and focus (0, - 3) i.e. (0, -a). So the parabola is of the form x <sup>2</sup> = - 4ay.<br />
The required equation of parabola is<br />
x<sup>2</sup> = -4 &times; 3y <span class="math-tex">{tex}\\Rightarrow{/tex}</span> x<sup>2</sup> = - 12y</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the equation of the parabola that satisfies the given conditions: Vertex (0, 0) Focus (3, 0)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The vertex of the parabola is at (0, 0) and focus is at (3, 0),<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> y = 0 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> The axis of parabola is along x-axis<br />
So the parabola is of the form y<sup>2</sup> = 4ax.<br />
The required equation of parabola is<br />
y<sup>2</sup> = 4 &times; 3x <span class="math-tex">{tex}\\Rightarrow{/tex}</span> y<sup>2</sup> = 12x</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Find the equation of the parabola that satisfies the given conditions: Vertex (0, 0) Focus (-2, 0)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The vertex of the parabola is at (0, 0) and focus is at (-2, 0)&#39;<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> y = 0 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> The axis of parabola is along x-axis<br />
So the parabola is of the form y<sup>2 </sup>= 4ax.<br />
The required equation of parabola is<br />
y<sup>2</sup> = 4x - 2x <span class="math-tex">{tex}\\Rightarrow{/tex}</span> y<sup>2</sup> = -8x.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Find the equation of the parabola that satisfies the given conditions: Vertex (0, 0) passing through (2, 3) and axis is along x-axis.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The vertex of the parabola is at (0, 0) and the axis is along x-axis.<br />
So the parabola is of the form y<sup>2</sup> = 4ax<br />
Since the parabola passes through point (2, 3)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (3)<sup>2</sup> = 4a &times; 2&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 9 = 8 a <span class="math-tex">{tex}\\Rightarrow a = \\frac{9}{8}{/tex}</span><br />
The required equation of parabola is<br />
<span class="math-tex">{tex}{y^2} = \\frac{{4 \\times 9}}{8}x \\Rightarrow {y^2} = \\frac{9}{2}x \\Rightarrow 2{y^2} = 9x{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Find the equation of the parabola that satisfies the given conditions: Vertex (0, 0) passing through (5, 2) and symmetric with respect to y-axis.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The vertex of the parabola is at (0, 0) and it is symmetrical about the y-axis.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> axis of parabola is Y-axis<br />
So the parabola is of the form x<sup>2</sup> = 4ay<br />
Since the parabola passes through point (5, 2)<br />
<span class="math-tex">{tex}\\therefore {(5)^2} = 4a \\times 2 \\Rightarrow 25 = 8a \\Rightarrow a = \\frac{{25}}{8}{/tex}</span><br />
The required equation of parabola is<br />
<span class="math-tex">{tex}{x^2} = \\frac{{4 \\times 25}}{8}y \\Rightarrow {x^2} = \\frac{{25}}{2}y \\Rightarrow 2{x^2} = 25y{/tex}</span></p></div></div></div>
`;

export const EX10_3_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Find the coordinates of the foci, the vertices, the length of major axis, the minor axis, the eccentricity and the length of the latus rectum of the ellipse.<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{36}} + \\frac{{{y^2}}}{{16}} = 1{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given ellipse is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{36}} + \\frac{{{y^2}}}{{16}} = 1{/tex}</span><br />
Now 36 &gt; 16 <span class="math-tex">{tex}\\Rightarrow {a^2} = 36{/tex}</span> and b<sup>2</sup> = 16<br />
So the equation of ellipse in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} + \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
a<sup>2</sup> = 36 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 6 and b<sup>2</sup> = 16 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 4<br />
We know that&nbsp;<span class="math-tex">{tex}c = \\sqrt {{a^2} - {b^2}}{/tex}</span><br />
<span class="math-tex">{tex}c = \\sqrt {36 - 16}  = \\sqrt {20}  = 2\\sqrt 5{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of foci are <span class="math-tex">{tex}( \\pm c,\\;0){/tex}</span> i.e. <span class="math-tex">{tex}( \\pm 2\\sqrt 5 ,\\;0){/tex}</span><br />
Coordinates of vertices are <span class="math-tex">{tex}( \\pm a,\\;0){/tex}</span> i.e. <span class="math-tex">{tex}( \\pm 6,\\;0){/tex}</span><br />
Length of major axis = 2a <span class="math-tex">{tex}= 2 \\times 6 = 12{/tex}</span><br />
Length of minor axis = 2b = <span class="math-tex">{tex}2 \\times 4{/tex}</span> = 8<br />
Eccentricity (e) <span class="math-tex">{tex}= \\frac{c}{a} = \\frac{{2\\sqrt 5 }}{6} = \\frac{{\\sqrt 5 }}{3}{/tex}</span><br />
Length of latus rectum&nbsp;<span class="math-tex">{tex} = \\frac{{2{b^2}}}{a} = \\frac{{2 \\times 16}}{6} = \\frac{{16}}{3}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Find the coordinates of the foci, the vertices, the length of major axis, the minor axis, the eccentricity and the length of the latus rectum of the ellipse.<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{4} + \\frac{{{y^2}}}{{25}} = 1{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given ellipse is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{4} + \\frac{{{y^2}}}{{25}} = 1{/tex}</span><br />
Now 25 &gt; 4 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> = 25 and b<sup>2</sup> = 4<br />
So the equation of ellipse in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{y^2}}}{{{a^2}}} + \\frac{{{x^2}}}{{{b^2}}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> a<sup>2</sup> = 25 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 5 and b<sup>2</sup> = 4 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 2<br />
We know that <span class="math-tex">{tex}c = \\sqrt {{a^2} - {b^2}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore c = \\sqrt {25 - 4} = \\sqrt {21}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> Coordinates of foci are <span class="math-tex">{tex}(0,\\; \\pm c){/tex}</span>&nbsp; i.e. <span class="math-tex">{tex}(0 \\pm \\sqrt {21} ){/tex}</span><br />
Coordinates of vertices are <span class="math-tex">{tex}(0,\\; \\pm a){/tex}</span> i.e.&nbsp;<span class="math-tex">{tex}(0,\\; \\pm 5){/tex}</span><br />
Length of major axis <span class="math-tex">{tex}= 2a = 2 \\times 5 = 10{/tex}</span><br />
Length of minor axis = 2b <span class="math-tex">{tex}= 2 \\times 2 = 4{/tex}</span><br />
Eccentricity (e) <span class="math-tex">{tex}\\frac{c}{a} = \\frac{{\\sqrt {21} }}{5}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex}= \\frac{{a{b^2}}}{a} = \\frac{{2 \\times 4}}{5} = \\frac{8}{5}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Find the coordinates of the foci, the vertices, the length of major axis, the minor axis, the eccentricity and the length of the latus rectum of the ellipse.<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{16}} + \\frac{{{y^2}}}{9} = 1{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given ellipse is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{16}} + \\frac{{{y^2}}}{9} = 1{/tex}</span><br />
Now 16 &gt; 9 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> = 16 and b<sup>2</sup> = 9<br />
On the equation of ellipse in standard form is <span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} + \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
a<sup>2</sup> = 16 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 4 and b<sup>2</sup> = 9 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 3<br />
We know that <span class="math-tex">{tex}c = \\sqrt {{a^2} - {b^2}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore c = \\sqrt {16 - 9} = \\sqrt 7{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Coordinates of foci are <span class="math-tex">{tex}( \\pm c,\\;0){/tex}</span> i.e. <span class="math-tex">{tex}( \\pm \\sqrt 7 ,\\;0){/tex}</span><br />
Coordinates of vertices are <span class="math-tex">{tex}( \\pm a,\\;0){/tex}</span> i.e. <span class="math-tex">{tex}( \\pm 4,\\;0){/tex}</span><br />
Length of major axis = 2 a <span class="math-tex">{tex}= 2 \\times 4 = 8{/tex}</span><br />
Length of minor axis = 2b <span class="math-tex">{tex} = 2 \\times 3{/tex}</span>= 6<br />
Eccentricity (e) <span class="math-tex">{tex} = \\frac{c}{a} = \\frac{{\\sqrt 7 }}{4}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex} = \\frac{{2{b^2}}}{a} = \\frac{{2 \\times 9}}{4} = \\frac{9}{2}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Find the coordinates of the foci, the vertices, the length of major axis, the minor axis, the eccentricity and the length of the latus rectum of the ellipse.<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{25}} + \\frac{{{y^2}}}{{100}} = 1{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given ellipse is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{25}} + \\frac{{{y^2}}}{{100}} = 1{/tex}</span><br />
Now 100 &gt; 25 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> = 100 and b<sup>2</sup> = 25<br />
So the equation of ellipse in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{y^2}}}{{{a^2}}} + \\frac{{{x^2}}}{{{b^2}}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> a<sup>2</sup> = 100 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 10 and b<sup>2</sup> = 25 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 5<br />
We know that <span class="math-tex">{tex}c = \\sqrt {{a^2} - {b^2}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore c = \\sqrt {100 - 25} = \\sqrt {75} = 5\\sqrt 3{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Coordinates of foci are <span class="math-tex">{tex}(0,\\; \\pm c){/tex}</span> i.e. <span class="math-tex">{tex}(0, \\pm 5\\sqrt 3 ){/tex}</span><br />
Coordinates of vertices are <span class="math-tex">{tex}(0,\\; \\pm a){/tex}</span> i.e.&nbsp;<span class="math-tex">{tex}(0,\\; \\pm 10){/tex}</span><br />
Length of major axis = 2 a = <span class="math-tex">{tex}2 \\times 10{/tex}</span>= 20<br />
Length of minor axis = 2 b = <span class="math-tex">{tex}2 \\times 5{/tex}</span> = 10<br />
Eccentricity (e) <span class="math-tex">{tex} = \\frac{c}{a} = \\frac{{5\\sqrt 3 }}{{10}} = \\frac{{\\sqrt 3 }}{2}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex}= \\frac{{a{b^2}}}{a} = \\frac{{2 \\times 25}}{{10}} = 5{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the coordinates of the foci, the vertices, the length of major axis, the minor axis, the eccentricity and the length of the latus rectum of the ellipse.<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{49}} + \\frac{{{y^2}}}{{36}} = 1{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given ellipse is <span class="math-tex">{tex}\\frac{{{x^2}}}{{49}} + \\frac{{{y^2}}}{{36}} = 1{/tex}</span><br />
Now 49 &gt; 36 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> = 49 and b<sup>2</sup> = 36<br />
So the equation of ellipse in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} + \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> a<sup>2</sup> = 49 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 7 and b<sup>2</sup> = 36 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 6<br />
We know that&nbsp;<span class="math-tex">{tex}c = \\sqrt {{a^2} - {b^2}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore c = \\sqrt {49 - 36}  = \\sqrt {13}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Coordinates of foci are <span class="math-tex">{tex}( \\pm c,\\;0){/tex}</span> i.e.&nbsp;<span class="math-tex">{tex}( \\pm \\sqrt {13} ,\\;0){/tex}</span><br />
Coordinates of vertices are&nbsp;<span class="math-tex">{tex}( \\pm a,\\;0){/tex}</span> i.e. <span class="math-tex">{tex}( \\pm 7,\\;0){/tex}</span><br />
Length of major axis = 2 a = <span class="math-tex">{tex}2 \\times 7 = 14{/tex}</span><br />
Length of minor axis = <span class="math-tex">{tex}2b = 2 \\times 6 = 12{/tex}</span><br />
Eccentricity (e) <span class="math-tex">{tex}= \\frac{c}{a} = \\frac{{\\sqrt {13} }}{7}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex}= \\frac{{2{b^2}}}{a} = \\frac{{2 \\times 36}}{7} = \\frac{{72}}{7}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find the coordinates of the foci, the vertices, the length of major axis, the minor axis, the eccentricity and the length of the latus rectum of the ellipse.<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{100}} + \\frac{{{y^2}}}{{400}} = 1{/tex}</span></p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given ellipse is <span class="math-tex">{tex}\\frac{{{x^2}}}{{100}} + \\frac{{{y^2}}}{{400}} = 1{/tex}</span><br />
Now 400 &gt; 100 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> = 400 and b<sup>2</sup> = 100<br />
So the equation of ellipse in standard form is <span class="math-tex">{tex}\\frac { y ^ { 2 } } { a ^ { 2 } } + \\frac { x ^ { 2 } } { b ^ { 2 } } = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> a<sup>2</sup> = 400 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 20 and b<sup>2</sup> = 100 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 10<br />
We know that <span class="math-tex">{tex}c = \\sqrt {{a^2} - {b^2}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore c = \\sqrt {400 - 100} = \\sqrt {300} = 10\\sqrt 3{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of foci are <span class="math-tex">{tex}(0,\\; \\pm c){/tex}</span> i.e. <span class="math-tex">{tex}(0,\\; \\pm 10\\sqrt 3 ){/tex}</span><br />
Coordinates of vertices are <span class="math-tex">{tex}(0,\\; \\pm a){/tex}</span> i.e.&nbsp;<span class="math-tex">{tex}(0,\\; \\pm 20){/tex}</span><br />
Length of major axis = 2 a <span class="math-tex">{tex} = 2 \\times 20 = 40{/tex}</span><br />
Length of minor axis = 2 b = <span class="math-tex">{tex}2 \\times 10{/tex}</span> = 20<br />
Eccentricity (e) <span class="math-tex">{tex} = \\frac{c}{a} = \\frac{{10\\sqrt 3 }}{{20}} = \\frac{{\\sqrt 3 }}{2}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex}= \\frac{{2{b^2}}}{a} = \\frac{{2 \\times 100}}{{20}} = 10{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the coordinates of the foci, the vertices, the length of major axis, the minor axis, the eccentricity and the length of the latus rectum of the ellipse.<br />
36x<sup>2</sup> + 4y<sup>2</sup> = 144</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given ellipse is 36x<sup>2</sup> + 4y<sup>2</sup>&nbsp; = 144<br />
i.e.&nbsp;<span class="math-tex">{tex}\\frac{{36{x^2}}}{{144}} + \\frac{{4{y^2}}}{{144}} = 1 \\Rightarrow \\frac{{{x^2}}}{4} + \\frac{{{y^2}}}{{36}} = 1{/tex}</span><br />
Now 36 &gt; 4&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> = 36 and b<sup>2</sup> = 4<br />
So the equation of ellipse in standard form is <span class="math-tex">{tex}\\frac{{{y^2}}}{{{a^2}}} + \\frac{{{x^2}}}{{{b^2}}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> a<sup>2</sup> = 36 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 6 and b<sup>2</sup> = 4 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 2<br />
We know that <span class="math-tex">{tex}c = \\sqrt {{a^2} - {b^2}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore c = \\sqrt {36 - 4} = \\sqrt {32} = 4\\sqrt 2{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Coordinates of foci are <span class="math-tex">{tex}(0,\\; \\pm c){/tex}</span> i.e. <span class="math-tex">{tex}(0,\\; \\pm 4\\sqrt 2 ){/tex}</span><br />
Coordinates of vertices are <span class="math-tex">{tex}(0,\\; \\pm a){/tex}</span> i.e.&nbsp;<span class="math-tex">{tex}(0,\\; \\pm 6){/tex}</span><br />
Length of major axis = 2 a = <span class="math-tex">{tex}2 \\times 6 = 12{/tex}</span><br />
Length of minor axis <span class="math-tex">{tex} = 2b = 2 \\times 2 = 4{/tex}</span><br />
Eccentricity (e) <span class="math-tex">{tex} = \\frac{c}{a} = \\frac{{4\\sqrt 2 }}{6} = \\frac{{2\\sqrt 2 }}{3}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex} = \\frac{{a{b^2}}}{a} = \\frac{{2 \\times 4}}{6} = \\frac{4}{3}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the coordinates of the foci, the vertices, the length of major axis, the minor axis, the eccentricity and the length of the latus rectum of the ellipse.<br />
16x<sup>2</sup> + y<sup>2</sup> = 16</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given ellipse is 16x<sup>2</sup> + y<sup>2</sup> = 16<br />
i.e. <span class="math-tex">{tex}\\frac{{16{x^2}}}{{16}} + \\frac{{{y^2}}}{{16}} = 1{/tex}</span> <span class="math-tex">{tex}\\Rightarrow \\frac{{{x^2}}}{1} + \\frac{{{y^2}}}{{16}} = 1{/tex}</span><br />
Now 16 &gt; 1 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> = 16 and b<sup>2</sup> = 1<br />
So the equation of ellipse in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{y^2}}}{{{a^2}}} + \\frac{{{x^2}}}{{{b^2}}} = 1{/tex}</span><br />
a<sup>2</sup> = 16 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 4 and b<sup>2</sup> = 1 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 1<br />
We know that <span class="math-tex">{tex}c = \\sqrt {{a^2} - {b^2}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore c = \\sqrt {16 - 1} = \\sqrt {15}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of foci are <span class="math-tex">{tex}(0,\\; \\pm c){/tex}</span> i.e. <span class="math-tex">{tex}(0,\\; \\pm \\sqrt {15} ){/tex}</span><br />
Coordinates of vertices are <span class="math-tex">{tex}(0,\\; \\pm a){/tex}</span> i.e. <span class="math-tex">{tex}(0,\\; \\pm 4){/tex}</span><br />
Length of major axis = 2 a = <span class="math-tex">{tex}2 \\times 4 = 8{/tex}</span><br />
Length of minor axis = 2b = <span class="math-tex">{tex}2 \\times 1{/tex}</span> = 2<br />
Eccentricity (e) = <span class="math-tex">{tex}\\frac{c}{a} = \\frac{{\\sqrt {15} }}{4}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex}= \\frac{{2{b^2}}}{a} = \\frac{{2 \\times 1}}{4} = \\frac{1}{2}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the coordinates of the foci, the vertices, the length of major axis, the minor axis, the eccentricity and the length of the latus rectum of the ellipse.<br />
4x<sup>2</sup> + 9y<sup>2</sup> = 36</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given ellipse is 4x<sup>2</sup> + 9y<sup>2</sup> = 36<br />
i.e. <span class="math-tex">{tex}\\frac{{4{x^2}}}{{36}} + \\frac{{9{y^2}}}{{36}} = 1 \\Rightarrow \\frac{{{x^2}}}{9} + \\frac{{{y^2}}}{4} = 1{/tex}</span><br />
Now 9 &gt; 4&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> = 9 and b<sup>2</sup> = 4<br />
So the equation of ellipse in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} + \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> a<sup>2</sup> = 9 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 3 and b<sup>2</sup> = 4 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 2<br />
We know that <span class="math-tex">{tex}c = \\sqrt {{a^2} - {b^2}}{/tex}</span><br />
<span class="math-tex">{tex}c = \\sqrt {9 - 4}  = \\sqrt 5{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Coordinates of foci are <span class="math-tex">{tex}( \\pm c,\\;0){/tex}</span> i.e. <span class="math-tex">{tex}( \\pm \\sqrt5,\\;0){/tex}</span><br />
Coordinates of vertices are <span class="math-tex">{tex}( \\pm a,\\;0){/tex}</span> i.e. <span class="math-tex">{tex}( \\pm 3,\\;0){/tex}</span><br />
Length of major axis <span class="math-tex">{tex} = 2a = 2 \\times 3 = 6{/tex}</span><br />
Length of minor axis <span class="math-tex">{tex}2b = 2 \\times 2 = 4{/tex}</span><br />
Eccentricity (e) <span class="math-tex">{tex}= \\frac{c}{a} = \\frac{{\\sqrt 5 }}{3}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex}= \\frac{{2{b^2}}}{a} = \\frac{{2 \\times 4}}{3} = \\frac{8}{3}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Find the equation of ellipse which has vertices&nbsp;(<span class="math-tex">{tex}\\pm{/tex}</span>5, 0), foci (<span class="math-tex">{tex}\\pm{/tex}</span>4, 0)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Vertices (<span class="math-tex">{tex}\\pm {/tex}</span>5, 0) and foci (<span class="math-tex">{tex}\\pm 4,0{/tex}</span>)&nbsp;<br />
Here, the vertices are on the x-axis.a<br />
Therefore, the equation of the ellipse will be of form&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{a^{2}}+\\frac{y^{2}}{b^{2}}{/tex}</span>&nbsp;=1, where a is the semi-major axis.<br />
Accordingly, a = 5 and c =&nbsp; ae = 4.<br />
It is known that a<sup>2</sup>&nbsp;= b<sup>2</sup>+c<sup>2</sup>.&nbsp;<br />
<span class="math-tex">{tex}\\therefore 5^{2}=b^{2}+4^{2}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;25 = b<sup>2</sup>&nbsp;+ 16<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;b<sup>2</sup>&nbsp;= 25 &ndash; 16<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;b =&nbsp;<span class="math-tex">{tex}\\sqrt{9}{/tex}</span>&nbsp;= 3<br />
Thus, the equation of the ellipse is&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{5^{2}}+\\frac{y^{2}}{3^{2}}{/tex}</span>&nbsp;=1 or&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{25}+\\frac{y^{2}}{9}{/tex}</span>&nbsp;= 1.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Find the equation of ellipse which has Vertices (0, <span class="math-tex">{tex}\\pm{/tex}</span>13), foci(0, <span class="math-tex">{tex}\\pm{/tex}</span>5)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The foci (0, <span class="math-tex">{tex}\\pm{/tex}</span>5) lie on y-axis<br />
So the equation of ellipse in standard form is <span class="math-tex">{tex}\\frac{{{y^2}}}{{{a^2}}} + \\frac{{{x^2}}}{{{b^2}}} = 1{/tex}</span><br />
Now vertices (0, <span class="math-tex">{tex}\\pm{/tex}</span>a) is (0, <span class="math-tex">{tex}\\pm{/tex}</span>13)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 13<br />
Foci (0, <span class="math-tex">{tex}\\pm{/tex}</span>c) is (0, <span class="math-tex">{tex}\\pm{/tex}</span>5)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;c = 5<br />
We know that c<sup>2</sup> = a<sup>2</sup>&nbsp;-&nbsp;b<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (5)<sup>2</sup> = (13)<sup>2</sup> - b<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> b<sup>2</sup> = 169 &ndash; 25 = 144<br />
Thus equation of required ellipse is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{144}} + \\frac{{{y^2}}}{{169}} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Find the equation of ellipse which has Vertices (<span class="math-tex">{tex}\\pm{/tex}</span>6, 0), foci (<span class="math-tex">{tex}\\pm{/tex}</span>4, 0)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The foci (<span class="math-tex">{tex}\\pm{/tex}</span>4, 0) lie on x-axis.<br />
So the equation of ellipse in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} + \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
Now vertices (<span class="math-tex">{tex}\\pm{/tex}</span>a, 0) is (<span class="math-tex">{tex}\\pm{/tex}</span>6, 0)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 6<br />
foci (&plusmn; c, 0) is (<span class="math-tex">{tex}\\pm{/tex}</span>4, 0)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> c = 4<br />
We know that c<sup>2</sup> = a<sup>2</sup> - b<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (4)<sup>2</sup> = (6)<sup>2</sup> -b<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> b<sup>2</sup> = 36 - 16 = 20<br />
Thus equation of required ellipse is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{36}} + \\frac{{{y^2}}}{{20}} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>Find the equation of ellipse having Ends of major axis <span class="math-tex">{tex}( \\pm 3,0){/tex}</span>, ends of minor axis <span class="math-tex">{tex}(0, \\pm 2){/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Ends of major axis <span class="math-tex">{tex}( \\pm 3,0){/tex}</span> lie on x-axis.<br />
So the equation of ellipse in standard form is <span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} + \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
Now ends of major axis (<span class="math-tex">{tex}\\pm{/tex}</span>a, 0) is (<span class="math-tex">{tex}\\pm{/tex}</span>3, 0) <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 3<br />
Ends of minor axis <span class="math-tex">{tex}(0, \\pm b){/tex}</span>&nbsp;is <span class="math-tex">{tex}(0, \\pm 2) \\Rightarrow{/tex}</span> b = 2<br />
Thus equation of required ellipse is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{9} + \\frac{{{y^2}}}{4} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>Find the equation of ellipse having Ends of major axis <span class="math-tex">{tex}(0, \\pm \\sqrt 5 ){/tex}</span>, ends&nbsp;of minor axis <span class="math-tex">{tex}( \\pm 1,0){/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Ends of major axis <span class="math-tex">{tex}(0, \\pm \\sqrt 5 ){/tex}</span> lies on y-axis<br />
So the equation of ellipse in standard form is <span class="math-tex">{tex}\\frac{{{x^2}}}{{{b^2}}} + \\frac{{{y^2}}}{{{a^2}}} = 1{/tex}</span><br />
Now ends of major axis (0, <span class="math-tex">{tex}\\pm{/tex}</span> a) is (0, <span class="math-tex">{tex}\\pm{/tex}</span> <span class="math-tex">{tex}\\sqrt 5{/tex}</span>) <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = <span class="math-tex">{tex}\\sqrt 5{/tex}</span><br />
Ends of minor axis (<span class="math-tex">{tex}\\pm{/tex}</span>b, 0) is (<span class="math-tex">{tex}\\pm{/tex}</span>1, 0) <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 1<br />
Thus equation of required ellipse is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{1} + \\frac{{{y^2}}}{5} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 15</span></div><div class="question-text"><p>Find the equation of ellipse having Length of major axis 26, foci (<span class="math-tex">{tex}\\pm{/tex}</span>5, 0)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The foci (<span class="math-tex">{tex}\\pm{/tex}</span>5, 0) lie on x-axis<br />
So the equation of ellipse in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} + \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
Now length of major axis 2a = 26<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 13<br />
foci (<span class="math-tex">{tex}\\pm{/tex}</span>c, 0) is (<span class="math-tex">{tex}\\pm{/tex}</span>5, 0)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;c = 5<br />
We know that c<sup>2</sup> = a<sup>2</sup> - b<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (5)<sup>2</sup> = (13)<sup>2</sup>&nbsp; - b<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> b<sup>2</sup> = 169 - 25 = 144<br />
Thus equation of required ellipse is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{169}} + \\frac{{{y^2}}}{{144}} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 16</span></div><div class="question-text"><p>Find the equation of ellipse having Length of minor axis 16, foci (0,&nbsp;<span class="math-tex">{tex}\\pm{/tex}</span>6)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The foci (0,&nbsp;<span class="math-tex">{tex}\\pm{/tex}</span>6) lie on y-axis.<br />
So the equation of ellipse in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{{b^2}}} + \\frac{{{y^2}}}{{{a^2}}} = 1]{/tex}</span><br />
Now length of minor axis 2b = 16 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 8<br />
foci (0, <span class="math-tex">{tex}\\pm{/tex}</span>c) is (0, <span class="math-tex">{tex}\\pm{/tex}</span>6) <span class="math-tex">{tex}\\Rightarrow{/tex}</span> c = 6<br />
We know that <span class="math-tex">{tex}{c^2} = {a^2} - {b^2}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (6)<sup>2</sup> = a<sup>2</sup> - (8)<sup>2</sup> <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> = 36 + 64 = 100<br />
Thus equation of required ellipse is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{64}} + \\frac{{{y^2}}}{{100}} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 17</span></div><div class="question-text"><p>Find the equation of ellipse having Foci (<span class="math-tex">{tex}\\pm{/tex}</span>3, 0), a = 4.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The foci (<span class="math-tex">{tex}\\pm{/tex}</span>3, 0) lie on x-axis<br />
So the equation of ellipse in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} + \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
Now foci (<span class="math-tex">{tex}\\pm{/tex}</span>c, 0) is (<span class="math-tex">{tex}\\pm{/tex}</span>3, 0)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;c = 3<br />
We know that c<sup>2</sup> = a<sup>2</sup>&nbsp; - b<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (3)<sup>2</sup> = (4)<sup>2</sup>&nbsp; - b<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> b<sup>2</sup> = 16 - 9 = 7<br />
Thus equation of required ellipse is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{16}} + \\frac{{{y^2}}}{7} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 18</span></div><div class="question-text"><p>Find the equation of ellipse having b = 3, c = 4, centre at the origin, foci on the x-axis.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The foci lie on x-axis<br />
So the equation of ellipse in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} + \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
We know that c<sup>2</sup> = a<sup>2</sup> - b<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (4)<sup>2</sup> = a<sup>2</sup> - (3)<sup>2</sup> <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> = 16 + 9 = 25<br />
Thus equation of required ellipse is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{25}} + \\frac{{{y^2}}}{9} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 19</span></div><div class="question-text"><p>Find the equation of ellipse having Centre at (0, 0) major axis on the y-axis and passes through the points (3, 2) and (1, 6).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Since the major axis is along y-axis<br />
So the equation of ellipse in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{{b^2}}} + \\frac{{{y^2}}}{{{a^2}}} = 1{/tex}</span><br />
Since the ellipse passes through the point (3, 2)<br />
<span class="math-tex">{tex}\\therefore \\frac{9}{{{b^2}}} + \\frac{4}{{{a^2}}} = 1{/tex}</span><br />
Also the ellipse passes through point (1, 6)<br />
<span class="math-tex">{tex}\\therefore \\frac{1}{{{b^2}}} + \\frac{{36}}{{{a^2}}} = 1{/tex}</span><br />
Solving (i) and (ii), we have<br />
a<sup>2</sup> = 40 and b<sup>2</sup> = 10<br />
Thus equation of required ellipse is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{10}} + \\frac{{{y^2}}}{{40}} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 20</span></div><div class="question-text"><p>Find the equation of ellipse having Major axis on the x-axis and passes through the points (4, 3) and (6, 2)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Since the major axis is along x-axis.<br />
So the equation of ellipse in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} + \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
Since the ellipse passes through point (4, 3)<br />
<span class="math-tex">{tex}\\therefore \\frac{{16}}{{{a^2}}} + \\frac{9}{{{b^2}}} = 1{/tex}</span>. . . (i)<br />
Also the ellipse passes through point (6, 2)<br />
<span class="math-tex">{tex}\\therefore \\frac{{36}}{{{a^2}}} + \\frac{4}{{{b^2}}} = 1{/tex}</span>....(ii)<br />
Solving (i) and (ii), we have<br />
a<sup>2</sup> = 52 and b<sup>2</sup> = 13<br />
Thus equation of required ellipse is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{52}} + \\frac{{{y^2}}}{{13}} = 1{/tex}</span></p></div></div></div>
`;

export const EX10_4_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Find the coordinates of the foci, and the vertices, the eccentricity and the length of the latus rectum of the hyperbolas.<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{16}} - \\frac{{{y^2}}}{9} = 1{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given hyperbola is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{16}} - \\frac{{{y^2}}}{9} = 1{/tex}</span> which is of the form <span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} - \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
The foci and vertices of the hyperbola lie on x-axis.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> a<sup>2</sup> = 16 <span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp; a = 4 and b<sup>2</sup> = 9&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 3<br />
Now c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup> = 16 + 9 = 25 &rArr; c = 5<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of foci are (&plusmn; c, 0) i.e. (&plusmn; 5, 0)<br />
Coordinates of vertices are (&plusmn; a, 0) i.e. (&plusmn; 4, 0)<br />
Eccentricity <span class="math-tex">{tex}(e) = \\frac{c}{a} = \\frac{5}{4}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex} = \\frac{{2{b^2}}}{a} = \\frac{{2 \\times 9}}{4} = \\frac{9}{2}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Find the coordinates of the foci, and the vertices, the eccentricity and the length of the latus rectum of the hyperbolas.<br />
<span class="math-tex">{tex}\\frac{{{y^2}}}{9} - \\frac{{{x^2}}}{{27}} = 1{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given hyperbola is&nbsp;<span class="math-tex">{tex}\\frac{{{y^2}}}{9} - \\frac{{{x^2}}}{{27}} = 1{/tex}</span> which is of the form <span class="math-tex">{tex}\\frac{{{y^2}}}{a^2} - \\frac{{{x^2}}}{{b^2}} = 1{/tex}</span><br />
The foci and vertices of the hyperbola lie on x-axis.<br />
a<sup>2</sup> = 9 &rArr; a = 3 and b<sup>2</sup> = 27 &rArr; b = 3<span class="math-tex">{tex}\\sqrt 3{/tex}</span><br />
Now c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup> = 9 + 27 = 36 &rArr; c = 6<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of foci are (0, &plusmn; c) i.e. (0, &plusmn; 6)<br />
Coordinates of vertices are (0, &plusmn; a) i.e. (0, &plusmn; 3)<br />
Eccentricity (e) = <span class="math-tex">{tex}= \\frac{c}{a} = \\frac{6}{3} = 2{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex}= \\frac{{a{b^2}}}{a} = \\frac{{2 \\times 27}}{3} = 18{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Find the coordinates of the foci, and the vertices, the eccentricity and the length of the latus rectum of the hyperbolas. 9y<sup>2</sup> - 4x<sup>2</sup> = 36</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of hyperbola is 9y<sup>2</sup> - 4x<sup>2</sup> = 36<br />
i.e. <span class="math-tex">{tex}\\frac{{9{y^2}}}{{36}} - \\frac{{4{x^2}}}{{36}} = 1 \\Rightarrow \\frac{{{y^2}}}{4} - \\frac{{{x^2}}}{9} = 1{/tex}</span> which is of the form <span class="math-tex">{tex}\\frac{{{y^2}}}{{{a^2}}} - \\frac{{{x^2}}}{{{b^2}}} = 1{/tex}</span><br />
The foci and vertices of the hyperbola lie on y-axis.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> a<sup>2</sup> = 4 <span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp; a = 2 and (b<sup>2</sup> = 9 &rArr; b = 3<br />
Now c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup> = 4 + 9 = 13 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> c = <span class="math-tex">{tex}\\sqrt{13}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of foci are (0,&plusmn;c) i.e. (0,&plusmn;<span class="math-tex">{tex}\\sqrt{13}{/tex}</span>)<br />
Coordinates of vertices are (0, &plusmn; a) i.e. (0, &plusmn; 2)<br />
Eccentricity (e) <span class="math-tex">{tex}\\frac{c}{a} = \\frac{{\\sqrt {13} }}{2}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex}= \\frac{{2{b^2}}}{a} = \\frac{{2 \\times 9}}{2} = 9{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Find the coordinates of the foci, and the vertices, the eccentricity and the length of the latus rectum of the hyperbolas. 16x<sup>2</sup> - 9y<sup>2</sup> = 576</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of hyperbola is 16x<sup>2</sup> - 9y<sup>2</sup> = 576<br />
i.e. <span class="math-tex">{tex}\\frac{{16{x^2}}}{{576}} - \\frac{{9{y^2}}}{{576}} = 1 \\Rightarrow \\frac{{{x^2}}}{{36}} - \\frac{{{y^2}}}{{64}} = 1{/tex}</span> which is of the form <span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} - \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
The foci and vertices of the hyperbola lie on x-axis.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> a<sup>2</sup> = 36 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 6 and b<sup>2</sup> = 64 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 8<br />
Now c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup> = 36 + 64 = 100 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> c = 10<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of foci are <span class="math-tex">{tex}( \\pm c,0){/tex}</span> i.e. <span class="math-tex">{tex}( \\pm 10,0){/tex}</span><br />
Coordinates of vertices are <span class="math-tex">{tex}( \\pm a,0){/tex}</span> i.e. <span class="math-tex">{tex}( \\pm 6,0){/tex}</span><br />
Eccentricity (e) <span class="math-tex">{tex} = \\frac{c}{a} = \\frac{{10}}{6} = \\frac{5}{3}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex}= \\frac{{2{b^2}}}{a} = \\frac{{2 \\times 64}}{6} = \\frac{{64}}{3}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the coordinates of the foci, and the vertices, the eccentricity and the length of the latus rectum of the hyperbolas. 5y<sup>2</sup> - 9x<sup>2</sup> = 36</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of hyperbola is 5y<sup>2</sup> - 9x<sup>2</sup> = 36<br />
i.e. <span class="math-tex">{tex}\\frac{{5{y^2}}}{{36}} - \\frac{{9{x^2}}}{{36}} = 1 \\Rightarrow \\frac{{{y^2}}}{{\\frac{{36}}{5}}} - \\frac{{{x^2}}}{4} = 1{/tex}</span> which is of the form <span class="math-tex">{tex}\\frac{{{y^2}}}{{{a^2}}} - \\frac{{{x^2}}}{{{b^2}}} = 1{/tex}</span><br />
The foci and vertices of the hyperbola lie on y-axis.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> <span class="math-tex">{tex}{a^2} = \\frac{{36}}{5} \\Rightarrow a = \\frac{6}{{\\sqrt 5 }}{/tex}</span> and b<sup>2</sup> = 4&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 2<br />
Now c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup> <span class="math-tex">{tex}= \\frac{{36}}{5} + 4 = \\frac{{56}}{5} \\Rightarrow c = \\sqrt {\\frac{{56}}{5}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of foci are <span class="math-tex">{tex}(0, \\pm c){/tex}</span> i.e. <span class="math-tex">{tex}\\left( {0, \\pm \\frac{{\\sqrt {56} }}{5}} \\right){/tex}</span><br />
Coordinates of vertices are <span class="math-tex">{tex}(0, \\pm a){/tex}</span>&nbsp; i.e. <span class="math-tex">{tex}\\left( {0, \\pm \\frac{6}{{\\sqrt 5 }}} \\right){/tex}</span><br />
Eccentricity (e) <span class="math-tex">{tex}= \\frac{c}{a} = \\frac{{\\sqrt {\\frac{{56}}{5}} }}{{\\frac{6}{{\\sqrt 5 }}}} = \\frac{{\\sqrt {56} }}{6} = \\frac{{2\\sqrt {14} }}{6} = \\frac{{\\sqrt {14} }}{3}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex} = \\frac{{2{b^2}}}{a} = \\frac{{\\frac{{2 \\times 4}}{6}}}{{\\sqrt 5 }} = \\frac{{2 \\times 4 \\times \\sqrt 5 }}{6} = \\frac{{4\\sqrt 5 }}{3}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find the coordinates of the foci, and the vertices, the eccentricity and the length of the latus rectum of the hyperbolas. 49y<sup>2</sup> - 16x<sup>2</sup> = 784</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of hyperbola is 49y<sup>2</sup> - 16x<sup>2</sup> = 784<br />
i.e. <span class="math-tex">{tex}\\frac{{49{y^2}}}{{784}} - \\frac{{16{x^2}}}{{784}} = 1 \\Rightarrow \\frac{{{y^2}}}{{16}} - \\frac{{{x^2}}}{{49}} = 1{/tex}</span> which is of the form <span class="math-tex">{tex}\\frac{{{y^2}}}{{{a^2}}} - \\frac{{{x^2}}}{{{a^2}}} = 1{/tex}</span><br />
The foci and vertices of the hyperbola lie on y-axis.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> a<sup>2</sup> = 16 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 4 and b<sup>2</sup> = 49 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 7<br />
Now c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup> = 16 + 49 = 65 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> c = <span class="math-tex">{tex}\\sqrt{65}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of foci are <span class="math-tex">{tex}(0, \\pm c){/tex}</span> i.e. <span class="math-tex">{tex}(0, \\pm \\sqrt {65} ){/tex}</span><br />
Coordinates of vertices are <span class="math-tex">{tex}(0, \\pm a){/tex}</span> i.e <span class="math-tex">{tex}(0, \\pm 4){/tex}</span><br />
Eccentricity <span class="math-tex">{tex}(e) = \\frac{c}{a} = \\frac{{\\sqrt {65} }}{4}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex} = \\frac{{2{b^2}}}{a} = \\frac{{2 \\times 49}}{4} = \\frac{{49}}{2}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the equation of hyperbola having Vertices (<span class="math-tex">{tex}\\pm{/tex}</span>2, 0), foci (<span class="math-tex">{tex}\\pm{/tex}</span>3, 0)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The vertices are (<span class="math-tex">{tex}\\pm{/tex}</span>2, 0) which lie on x-axis.<br />
So, the equation of hyperbola in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} - \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;the vertices (<span class="math-tex">{tex}\\pm{/tex}</span>a, 0) is (<span class="math-tex">{tex}\\pm{/tex}</span>2, 0)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a = 2<br />
foci (<span class="math-tex">{tex}\\pm{/tex}</span>ae, 0) is (<span class="math-tex">{tex}\\pm{/tex}</span>3, 0)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ae = 3<br />
Now ae = 3<br />
<span class="math-tex">{tex} \\Rightarrow e = \\frac{3}{a} \\Rightarrow e = \\frac{3}{2}{/tex}</span><br />
We know that<br />
<span class="math-tex">{tex}b = a\\sqrt {{e^2} - 1} \\Rightarrow b = 2\\sqrt {\\frac{9}{4} - 1} = 2\\frac{{\\sqrt 5 }}{2} = \\sqrt 5{/tex}</span><br />
Thus required equation of hyperbola is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{{{(2)}^2}}} - \\frac{{{y^2}}}{{{{(\\sqrt 5 )}^2}}} = 1 \\Rightarrow \\frac{{{x^2}}}{4} - \\frac{{{y^2}}}{5} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the equation of hyperbola having Vertices (0, <span class="math-tex">{tex}\\pm{/tex}</span>5), foci (0, <span class="math-tex">{tex}\\pm{/tex}</span>8)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The vertices are (0, <span class="math-tex">{tex}\\pm{/tex}</span>5) which lie on y-axis.<br />
So the equation of the hyperbola in standard form is <span class="math-tex">{tex}\\frac{{{y^2}}}{{{a^2}}} - \\frac{{{x^2}}}{{{b^2}}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> the vertices (0, <span class="math-tex">{tex}\\pm{/tex}</span>a) is (0, <span class="math-tex">{tex}\\pm{/tex}</span>5)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 5<br />
Foci (0, <span class="math-tex">{tex}\\pm{/tex}</span>ae) is (0, <span class="math-tex">{tex}\\pm{/tex}</span>8)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> ae = 8<br />
Now ae = 8<br />
<span class="math-tex">{tex} \\Rightarrow e = \\frac{8}{a} \\Rightarrow e = \\frac{8}{5}{/tex}</span><br />
We know that<br />
<span class="math-tex">{tex}b = a\\sqrt {{e^2} - 1} \\Rightarrow b = 5\\sqrt {\\frac{{64}}{{25}} - 1} = 5\\frac{{\\sqrt {39} }}{5} = \\sqrt {39}{/tex}</span><br />
Thus required equation of hyperbola is<br />
<span class="math-tex">{tex}\\frac{{{y^2}}}{{{{(5)}^2}}} - \\frac{{{x^2}}}{{{{(\\sqrt {39} )}^2}}} = 1 \\Rightarrow \\frac{{{y^2}}}{{25}} - \\frac{{{x^2}}}{{39}} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the equation of hyperbola having Vertices (0, <span class="math-tex">{tex}\\pm{/tex}</span>3), foci (0, <span class="math-tex">{tex}\\pm{/tex}</span>5).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,<br />
vertices = (0, <span class="math-tex">{tex}\\pm{/tex}</span>3) = (0, <span class="math-tex">{tex}\\pm{/tex}</span>a)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 3&nbsp;and foci = (0, <span class="math-tex">{tex}\\pm{/tex}</span>c) = (0, <span class="math-tex">{tex}\\pm{/tex}</span>5)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> c = 5&nbsp;<br />
Also, we know that, c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;25 = 9 + b<sup>2</sup>&nbsp;[<span class="math-tex">{tex}\\because{/tex}</span>&nbsp;a = 3]<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;b<sup>2</sup>&nbsp;= 25 - 9 = 16<br />
<img alt="" data-imgur-src="CNsxauy.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/CNsxauy.png" style="width: 149px; height: 249px;" /><br />
Here, the foci and vertices lie on&nbsp;Y-axis,<br />
Therefore equation of hyperbola is of the form<br />
<span class="math-tex">{tex}\\frac { y ^ { 2 } } { a ^ { 2 } } - \\frac { x ^ { 2 } } { b ^ { 2 } }{/tex}</span>&nbsp;= 1<br />
i.e.,&nbsp;<span class="math-tex">{tex}\\frac { y ^ { 2 } } { 9 } - \\frac { x ^ { 2 } } { 16 }{/tex}</span> = 1</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Find the equation of hyperbola, when&nbsp;foci are at (<span class="math-tex">{tex}\\pm{/tex}</span>5, 0) and transverse axis is of length 8.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here, foci are at (<span class="math-tex">{tex}\\pm{/tex}</span>5, 0)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;(<span class="math-tex">{tex}\\pm{/tex}</span>c, 0) = (<span class="math-tex">{tex}\\pm{/tex}</span>5,0)&nbsp;<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;c = 5<br />
<img alt="" data-imgur-src="VY9TnC0.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/VY9TnC0.png" style="width: 200px; height: 112px;" /><br />
And length of transverse<br />
axis = 2a = 8&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a = 4<br />
Also, we know that, c<sup>2</sup>&nbsp;= a<sup>2</sup>&nbsp;+ b<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;25 = 16 + b<sup>2</sup>&nbsp;[<span class="math-tex">{tex}\\because{/tex}</span>&nbsp;a = 4, c = 5]<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;b<sup>2</sup>&nbsp;= 9<br />
Since, the foci lie on X-axis. Therefore, the equation of hyperbola is of the form<br />
<span class="math-tex">{tex}\\frac { x ^ { 2 } } { a ^ { 2 } } - \\frac { y ^ { 2 } } { b ^ { 2 } }{/tex}</span>&nbsp;= 1<br />
On putting the values of a<sup>2</sup> and b<sup>2</sup>,&nbsp;we get<br />
<span class="math-tex">{tex}\\frac { x ^ { 2 } } { 16 } - \\frac { y ^ { 2 } } { 9 }{/tex}</span>&nbsp;= 1<br />
which is the required equation of hyperbola.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Find the equation of hyperbola having Foci (0, <span class="math-tex">{tex}\\pm{/tex}</span>13) and the conjugate axis is of length 24.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here foci are (0, <span class="math-tex">{tex}\\pm{/tex}</span>13) which lie on y-axis.<br />
So the equation of hyperbola in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{y^2}}}{{{a^2}}} - \\frac{{{x^2}}}{{{b^2}}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (13)<sup>2</sup> = a<sup>2</sup> + (12)<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> = 169 &ndash; 144 = 25<br />
Thus required equation of hyperbola is<br />
<span class="math-tex">{tex}\\frac{{{y^2}}}{{25}} - \\frac{{{x^2}}}{{{{(12)}^2}}} = 1 \\Rightarrow \\frac{{{y^2}}}{{25}} - \\frac{{{x^2}}}{{144}} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Find the equation of hyperbola having&nbsp; Foci (<span class="math-tex">{tex}\\pm{/tex}</span>3<span class="math-tex">{tex}\\sqrt{5}{/tex}</span>, 0), the latus rectum is of length 8.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here foci are (<span class="math-tex">{tex}\\pm{/tex}</span>3<span class="math-tex">{tex}\\sqrt{5}{/tex}</span>, 0) which lie on x-axis.<br />
So the equation of hyperbola in standard form is <span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} - \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> foci (<span class="math-tex">{tex}\\pm{/tex}</span>c, 0) is (<span class="math-tex">{tex}\\pm{/tex}</span>3<span class="math-tex">{tex}\\sqrt{5}{/tex}</span>, 0)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> c = 3<span class="math-tex">{tex}\\sqrt{5}{/tex}</span><br />
Length of latus rectum <span class="math-tex">{tex}\\frac{{2{b^2}}}{a} = 8 \\Rightarrow{/tex}</span>b<sup>2</sup> = 4a<br />
We know that c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;(3<span class="math-tex">{tex}\\sqrt{5}{/tex}</span>)<sup>2</sup> = a<sup>2</sup> + 4a<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> + 4a &ndash; 45 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> (a + 9) (a &ndash; 5) = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a = 5 (<span class="math-tex">{tex}\\because{/tex}</span> a = -9&nbsp; is not possible)<br />
Also&nbsp; a = 5<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> &nbsp;b<sup>2</sup> = 4 <span class="math-tex">{tex}\\times{/tex}</span> 5 = 20<br />
Thus required equation of hyperbola is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{25}} - \\frac{{{y^2}}}{{20}} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>Find the equation of hyperbola having Foci (<span class="math-tex">{tex}\\pm{/tex}</span>4, 0)&nbsp; and the latus rectum is of length 12.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here foci are (<span class="math-tex">{tex}\\pm{/tex}</span>4, 0) which lie on x-axis.<br />
So the equation of hyperbola in standard form is <span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} - \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
&there4; foci (<span class="math-tex">{tex}\\pm{/tex}</span>c, 0) is <span class="math-tex">{tex}\\pm{/tex}</span>4, 0)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;c = 4<br />
Length of latus rectum <span class="math-tex">{tex}\\frac{{2{b^2}}}{a} = 12 \\Rightarrow{/tex}</span> b<sup>2</sup> = 6a<br />
We know that c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (4)<sup>2</sup> = a<sup>2</sup> + 6a<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> + 6a &ndash; 16 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> (a + 8) (a &ndash; 2) = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a = 2 (<span class="math-tex">{tex}\\because{/tex}</span> a = -8 is not possible)<br />
<span class="math-tex">{tex}{/tex}</span><span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>2</sup> = 4<br />
Also b<sup>2</sup> = 6 <span class="math-tex">{tex}\\times{/tex}</span> 2 = 12<br />
Thus required equation of hyperbola is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{4} - \\frac{{{y^2}}}{{12}} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>Find the equation of hyperbola which has Vertices <span class="math-tex">{tex}( \\pm 7,0),e = \\frac{4}{3}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here vertices are (&plusmn; 7, 0) which lie on x-axis.<br />
So the equation of hyperbola in standard form is&nbsp;<span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} - \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Vertices (&plusmn; a, 0) is (&plusmn; 7, 0) &rArr; a = 7<br />
Now <span class="math-tex">{tex}e = \\frac{4}{3} \\Rightarrow \\frac{c}{a} = \\frac{4}{3} \\Rightarrow \\frac{c}{7} = \\frac{4}{3} \\Rightarrow c = \\frac{{28}}{3}{/tex}</span><br />
We know that c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore {\\left( {\\frac{{28}}{3}} \\right)^2} = {(7)^2} + {b^2} \\Rightarrow {b^2} = \\frac{{784}}{9} - 49 = \\frac{{343}}{9}{/tex}</span><br />
Thus required equation of hyperbola is<br />
<span class="math-tex">{tex}\\frac{{{x^2}}}{{{{(7)}^2}}} - \\frac{{{y^2}}}{{\\frac{{343}}{9}}} = 1 \\Rightarrow \\frac{{{x^2}}}{{49}} - \\frac{{{9y^2}}}{{343}} = 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 15</span></div><div class="question-text"><p>Find the equation of hyperbola which has Foci&nbsp;<span class="math-tex">{tex}(0, \\pm \\sqrt {10} ){/tex}</span> and passing&nbsp;through (2, 3)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here foci <span class="math-tex">{tex}(0, \\pm \\sqrt {10} ){/tex}</span> which lie on y-axis<br />
So the equation of hyperbola in standard form is <span class="math-tex">{tex}\\frac{{{y^2}}}{{{a^2}}} - \\frac{{{x^2}}}{{{b^2}}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> foci <span class="math-tex">{tex}(0, \\pm c){/tex}</span> is <span class="math-tex">{tex}(0, \\pm \\sqrt {10} ) \\Rightarrow a = \\sqrt {10}{/tex}</span><br />
We know that c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore {(\\sqrt {10} )^2} = {a^2} + {b^2} \\Rightarrow{/tex}</span> b<sup>2</sup> = 10 - a<sup>2</sup><br />
Since the hyperbola passes through (2, 3)<br />
<span class="math-tex">{tex}\\therefore \\frac{9}{{{a^2}}} - \\frac{4}{{{b^2}}} = 1 \\Rightarrow \\frac{9}{{{a^2}}} - \\frac{4}{{10 - {a^2}}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\frac{{9(10 - {a^2}) - 4{a^2}}}{{{a^2}(10 - {a^2})}} =a^2{(10-a^2)}\\Rightarrow{/tex}</span> a<sup>4</sup> - 23a<sup>2</sup> + 90 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> a<sup>4</sup> - 18a<sup>2</sup> - 5a<sup>2<span class="math-tex">{tex}+{/tex}</span></sup>90 = 0 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> (a<sup>2</sup> - 18)(a<sup>2</sup> - 5) = 0</p>

<p><span class="math-tex">{tex}\\Rightarrow a^2=5 ,18{/tex}</span><br />
When a<sup>2</sup> = 18 then b<sup>2</sup> = 10 - 18 = -8 (which is not possible)<br />
When a<sup>2</sup> = 5 then b<sup>2</sup> = 10 - 5 = 5<br />
Thus required equation of the hyperbola is<br />
<span class="math-tex">{tex}\\frac{{{y^2}}}{5} - \\frac{{{x^2}}}{5} = 1{/tex}</span></p></div></div></div>
`;

export const MISC_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>If a parabolic reflector is 20 cm in diameter and 5 cm deep, find the focus.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>A parabolic reflector with diameter PR = 20 cm and OQ = 5 cm.<br />
Vertex of the parabola is (0, 0)<br />
Let focus of the parabola be (a, 0).<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_11/image618.png" style="width: 150px; height: 131px;" /><br />
Now PR = 20 cm <span class="math-tex">{tex}\\Rightarrow{/tex}</span> PQ = 10 cm<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Coordinate of point P are (5, 10)<br />
Since the point lies on the parabola y<sup>2</sup> = 4ax<br />
<span class="math-tex">{tex}\\therefore {(10)^2} = 4a \\times 5 \\Rightarrow a = \\frac{{100}}{{20}} \\Rightarrow{/tex}</span> a = 5<br />
Thus required focus of the parabola is (5, 0).</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>An arch is in the form of a parabola with its axis vertical. The arch is 10 m high and 5 m wide at the base. How wide is it 2 m from the vertex of the parabola?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let AB be the parabolic arch having O as the vertex and OY as the axis.<br />
The parabola is of the form x<sup>2</sup> = 4ay<br />
Now CD = 5 m <span class="math-tex">{tex}\\Rightarrow{/tex}</span> OD = 2.5 m<br />
BD = 10 m<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_11/image622.png" style="width: 120px; height: 115px;" /><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> Coordinates of point B are (2.5, 10)<br />
Since the point B lies on the parabola x<sup>2</sup> = 4ay<br />
<span class="math-tex">{tex}\\therefore {(2.5)^2} = 4a \\times 10 \\Rightarrow a = \\frac{{6.25}}{{40}} = \\frac{{625}}{{4000}} = \\frac{5}{{32}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Equation of parabola is <span class="math-tex">{tex}{x^2} = 4 \\times \\frac{5}{{32}}y{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow {x^2} = \\frac{5}{8}y{/tex}</span><br />
Let PQ = d &rArr; NQ = <span class="math-tex">{tex}\\frac{d}{2}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Coordinates of Point Q are <span class="math-tex">{tex}\\left( {\\frac{d}{2},2} \\right){/tex}</span><br />
Since point Q lies on the parabola <span class="math-tex">{tex}{x^2} = \\frac{5}{8}y{/tex}</span><br />
<span class="math-tex">{tex}\\therefore {\\left( {\\frac{d}{2}} \\right)^2} = \\frac{5}{8} \\times 2 \\Rightarrow \\frac{{{d^2}}}{4} = \\frac{5}{4} \\Rightarrow {d^2} = 5 \\Rightarrow d = \\sqrt 5{/tex}</span><br />
Thus width of arc&nbsp;<span class="math-tex">{tex} = \\sqrt 5 \\;m{/tex}</span> = 2.24m approx.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>The cable of a uniformly loaded suspension bridge hangs in the form of a parabola. The roadway which is horizontal and 100 m long is supported by vertical wires attached to the cable, the longest wire being 30 m and the shortest being 6 m. Find the length of a supporting wire attached to the roadway 18 m from the middle.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let AOB be the cable of uniformly loaded suspension bridge. Let AL and BM be the longest wires of length 30 m each. Let OC be the shortest wire of length 6 m and LM be the roadway.<br />
Now AL = BM = 30 m, OC = 6 m and LM = 100 m.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> LC = CM = <span class="math-tex">{tex}\\frac{1}{2}{/tex}</span>LM= 50 m<br />
Let O be the vertex and axis of the parabola be y-axis. So the equation of parabola in standard form is x<sup>2</sup> = 4ay<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_11/image634.png" style="width: 180px; height: 111px;" /><br />
Coordinates of point B are (50, 24)<br />
Since point B lies on the parabola x<sup>2</sup> = 4ay<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (50)<sup>2</sup> = 4a &times; 24 &rArr; a = <span class="math-tex">{tex}\\frac{{2500}}{{4 \\times 24}} = \\frac{{625}}{{24}}{/tex}</span><br />
So equation of parabola is <span class="math-tex">{tex}{x^2} = \\frac{{4 \\times 625}}{{24}}y \\Rightarrow {x^2} = \\frac{{625}}{6}y{/tex}</span><br />
Let length of the supporting wire PW at a distance of 18 m be h.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> OR = 18 m and PR = PQ &ndash; QP = PQ - OC = h - 6<br />
Coordinates of point P are (18, h - 6)<br />
Since the point P lies on parabola <span class="math-tex">{tex}{x^2} = \\frac{{625}}{6}y{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> (18)<sup>2</sup> = <span class="math-tex">{tex}\\frac{{625}}{6}{/tex}</span> (h - 6) &rArr; 324&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;6 = 625h - 3750<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;625 h = 1944 + 3750 <span class="math-tex">{tex}\\Rightarrow h = \\frac{{5694}}{{625}}{/tex}</span> = 9.11 m approx.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>An arch is in the form of a semi-ellipse. It is 8 m wide and 2 m high at the centre. Find the height of the arch at a point 1.5 m from one end.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here width of elliptical arch = 8 m.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp; AB = 8 m 2a = 8&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 4<br />
Height at the centre = 2 m<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;OB = 2&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 2<br />
The axis is of the ellipse is x-axis.<br />
So the equation of ellipse in standard form is <span class="math-tex">{tex}\\frac{{{x^2}}}{{{a^2}}} + \\frac{{{y^2}}}{{{b^2}}} = 1{/tex}</span><br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_11/image642.png" style="width: 180px; height: 109px;" /><br />
<span class="math-tex">{tex}\\therefore \\frac{{{x^2}}}{{{{(4)}^2}}} + \\frac{{{y^2}}}{{{{(2)}^2}}} = 1 \\Rightarrow \\frac{{{x^2}}}{{16}} + \\frac{{{y^2}}}{4} = 1{/tex}</span><br />
Now AP = 1.5 m OP = OA - AP = 4 - 1.5 = 2.5m<br />
Let PQ = h<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Coordinate of Q are (2.5, h)<br />
Since the point Q lies on the ellipse <span class="math-tex">{tex}\\frac{{{x^2}}}{{16}} + \\frac{{{y^2}}}{4} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\frac{{{{(2.5)}^2}}}{{16}} + \\frac{{{h^2}}}{4} = 1 \\Rightarrow \\frac{{{h^2}}}{4} ={ 1}-\\frac{ 6.25}{{16}}{/tex}</span><span class="math-tex">{tex} \\Rightarrow {h^2} = \\frac{{9.75 \\times 4}}{{16}} = \\frac{{9.75}}{4}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> h<sup>2</sup> = 2.44 <span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp; h = <span class="math-tex">{tex}\\sqrt{2.44}{/tex}</span> = 1.56 m approx.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>A rod of length 12 cm moves with its ends always touching the coordinate axes. Determine the equation of the locus of a point P on the rod, which is 3 cm from the end in contact with the x-axis.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let AB be a rod of length 12 cm and P (x, y) be any point on the rod such that PA = 3 cm and PB = 9 cm<br />
Let AR = a and BQ = b<br />
Then triangle ARP ~&nbsp; trianglePQB<br />
<span class="math-tex">{tex}\\therefore \\frac{{AR}}{{PQ}} = \\frac{{AP}}{{PB}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\frac{a}{x} = \\frac{3}{9} \\Rightarrow 9a = 3x \\Rightarrow a = \\frac{x}{3}{/tex}</span><br />
and <span class="math-tex">{tex}\\frac{{BQ}}{{BP}} = \\frac{{PR}}{{PA}}{/tex}</span><br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_11/image657.png" style="width: 150px; height: 141px;" /><br />
<span class="math-tex">{tex}\\therefore \\frac{b}{9} = \\frac{y}{3}{/tex}</span> &rArr; 3b = 9y &rArr; b = 3y<br />
Now OA = OR + AR = x + a <span class="math-tex">{tex} = x + \\frac{x}{3} = \\frac{{4x}}{3}{/tex}</span><br />
OB = OQ + BQ = y + b = y + 3 y = 4y<br />
In right angled <span class="math-tex">{tex}\\Delta {\\rm A}{\\rm O}{\\rm B}{/tex}</span><br />
AB<sup>2</sup> = OA<sup>2</sup> + OB<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore {(12)^2 =}{\\left( {\\frac{{4x}}{3}} \\right)^2} + {(4y)^2} \\Rightarrow 144 = \\frac{{16{x^2}}}{9} + 16{y^2}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\frac{{{x^2}}}{{81}} + \\frac{{{y^2}}}{9} = 1{/tex}</span><br />
Which is required locus of point P and which represents an ellipse.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find the area of the triangle formed by the lines joining the vertex of the parabola x<sup>2</sup> = 12y to the ends of its latus rectum.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of parabola is x<sup>2</sup> = 12y which is of the form x<sup>2</sup> = 4ay<br />
4a = 12 <span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a = 3<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_11/image668.png" style="height:129px; width:150px" /><br />
Focus of the parabola is (0, 3) <span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x = <span class="math-tex">{tex}\\pm{/tex}</span>6<br />
Let AB be the latus rectum if the parabola then y = 3<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;x<sup>2</sup> = 4 <span class="math-tex">{tex}\\times{/tex}</span>&nbsp;3 <span class="math-tex">{tex}\\times{/tex}</span>&nbsp;3 = 36<br />
The coordinates of A are (-6, 3) and B are (6, 3)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Area of <span class="math-tex">{tex}\\Delta {/tex}</span>AOB<span class="math-tex">{tex}\\frac{1}{2}{/tex}</span> [(0 &ndash; 0) + (18 + 18) + (0 &ndash; 0)]<br />
= <span class="math-tex">{tex}\\frac{1}{2}{/tex}</span>|36| = 18 sq. units.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>A man running a racecourse notes that the sum of the distances from the two flag posts from him is always 10 m and the distance between the flag posts is 8 m. Find the equation of the posts traced by the man.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let A and B be the positions of the two flag posts and P(x, y) be the position of the man.<br />
Accordingly, PA + PB = 10<br />
We know that if a point moves in-plane in such a way that the sum of its distance from two fixed points is constant, then the path is an ellipse and this constant value is equal to the length of the major axis of the ellipse.<br />
Therefore, the path described by the man is an ellipse where the length of the major axis is 10m, while points A and B are the foci.<br />
Taking the origin of the coordinate plane as the center of the ellipse, while taking the major axis along the x-axis, <img data-imgur-src="NkYUBXU.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/NkYUBXU.png" style="width: 185px; height: 196px;" /><br />
The equation of the ellipse will be of the form&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{a^{2}}+\\frac{y^{2}}{b^{2}}=1{/tex}</span>, where a is the semi-major axis.<br />
Accordingly, 2a = 10&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a = 5<br />
Distance between the foci = 2ae = 2c&nbsp;= 8<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;c = 4<br />
On using the relation, c =&nbsp;<span class="math-tex">{tex}\\sqrt{a^{2}-b^{2}}{/tex}</span>, we get,<br />
4 =&nbsp;<span class="math-tex">{tex}\\sqrt{25-b^{2}}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;16 = 25 &ndash; b<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;b<sup>2</sup>&nbsp;= 25 -1 6 = 9<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;b = 3<br />
Put value of a and b in&nbsp;&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{a^{2}}+\\frac{y^{2}}{b^{2}}=1{/tex}</span>.<br />
&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{5^{2}}+\\frac{y^{2}}{3^{2}}=1{/tex}</span>&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac{x^{2}}{25}+\\frac{y^{2}}{9}=1{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>An equilateral triangle is inscribed in the parabola y<sup>2</sup> = 4ax where one vertex is at the vertex of the parabola. Find the length of the side of the triangle.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of parabola is y<sup>2</sup> = 4ax let b be the side of an equilateral <span class="math-tex">{tex}\\Delta {\\rm O}{\\rm A}{\\rm B}{/tex}</span> whose one vertex is the vertex of parabola.<br />
Let OC = x<br />
Now AB = b<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;AC = BC <span class="math-tex">{tex} = \\frac{1}{2} \\times AB = \\frac{b}{2}{/tex}</span><br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_11/image687.png" style="width: 100px; height: 107px;" /><br />
Coordinates of point A are <span class="math-tex">{tex}\\left( {x,\\frac{b}{2}} \\right){/tex}</span><br />
Since point A lies on the parabola y<sup>2</sup> = 4ax<br />
<span class="math-tex">{tex}\\therefore {\\left( {\\frac{b}{2}} \\right)^2} = 4ax \\Rightarrow x = \\frac{{{b^2}}}{{4 \\times 4a}} \\Rightarrow x = \\frac{{{b^2}}}{{16a}}{/tex}</span><br />
In right angled <span class="math-tex">{tex}\\Delta {\\rm O}{\\rm A}{\\rm C}{/tex}</span><br />
OA<sup>2</sup> = OC<sup>2</sup> + AC<sup>2</sup><br />
<span class="math-tex">{tex}\\therefore {b^2} = {x^2} + {\\left( {\\frac{b}{2}} \\right)^2} \\Rightarrow {b^2} = {\\left( {\\frac{{{b^2}}}{{16a}}} \\right)^2} + \\frac{{{b^2}}}{4}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow {b^2} = \\frac{{{b^4}}}{{256{a^2}}} + \\frac{{{b^2}}}{4} \\Rightarrow 1 = \\frac{{{b^2}}}{{256{a^2}}} + \\frac{1}{4}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\frac{{{b^2}}}{{256{a^2}}} = 1 - \\frac{1}{4}{/tex}</span><span class="math-tex">{tex}\\Rightarrow {b^2} = \\frac{3}{4} \\times 256{a^2} = {b^2} = 192{a^2}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow b = \\sqrt {192{a^2}} \\Rightarrow b = 8\\sqrt 3 a{/tex}</span><br />
Thus the side of equilateral triangle is <span class="math-tex">{tex}8\\sqrt 3 a{/tex}</span>.</p></div></div></div>
`;

export default { EXAMPLES_HTML, EX10_1_HTML, EX10_2_HTML, EX10_3_HTML, EX10_4_HTML, MISC_HTML };