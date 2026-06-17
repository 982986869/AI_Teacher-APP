// straightLinesContent.js
// NCERT Solutions — Class 11 Mathematics, Chapter 9: Straight Lines.
//   EXAMPLES (20) | EX9_1 (12) | EX9_2 (19) | EX9_3 (20; PARTIAL 20/22) | MISC (20; PARTIAL 20/26)
// Math uses {tex}...{/tex} (LaTeX), rendered by Ncert2Screen's tex-mml-chtml build.

export const EXAMPLES_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(1)</span></div><div class="question-text"><p>Find the slope of the line passing through&nbsp;the points (3, -2) and (-1, 4).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Slope of the line through the points (3, -2) and (-1, 4) is<br />
<span class="math-tex">{tex}m=\\frac{4-(-2)}{-1-3}{/tex}</span>&nbsp;<span class="math-tex">{tex}\\left[\\because m=\\frac{y_{2}-y_{1}}{x_{2}-x_{1}}\\right]{/tex}</span><br />
<span class="math-tex">{tex}=\\frac{6}{-4}=-\\frac{3}{2}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(2)</span></div><div class="question-text"><p>Find the slope of the line&nbsp;passing through the points (3, -2) and (7, -2).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Slope of the line through the points (3, -2) and (7, -2) is<br />
<span class="math-tex">{tex}m=\\frac{y_2-y_1}{x_2-x_1}=\\frac{-2-(-2)}{7-3}=\\frac{0}{4}=0{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(3)</span></div><div class="question-text"><p>Find the slope of the line passing through the points (3, &ndash;2) and (3, 4).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The slope of the line through the points (3, &ndash;2) and (3, 4) is<br />
<span class="math-tex">{tex}m=\\frac{4-(-2)}{3-3}=\\frac{6}{0}{/tex}</span>&nbsp;which is not defined.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(4)</span></div><div class="question-text"><p>Find the slope of the line making inclination of 60&deg; with the positive direction of x-axis.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here inclination of the line &alpha; = 60&deg;.<br />
Thus, slope of the line is m = tan 60&deg; =&nbsp;<span class="math-tex">{tex}\\sqrt{3}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>If the angle between two lines is <span class="math-tex">{tex}\\frac{\\pi}{4}{/tex}</span> and slope of one of the lines is <span class="math-tex">{tex}\\frac{1}{2}{/tex}</span>, find the slope of the other line.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We know that, the acute angle <span class="math-tex">{tex}\\theta{/tex}</span>&nbsp;between two lines with slopes m<sub>1</sub>&nbsp;and m<sub>2</sub> is given by<br />
<span class="math-tex">{tex}\\tan \\theta=\\left|\\frac{m_{2}-m_{1}}{1+m_{1} m_{2}}\\right|{/tex}</span>&nbsp;...(i)<br />
Let&nbsp;<span class="math-tex">{tex}m_{1}=\\frac{1}{2},{/tex}</span>&nbsp;m<sub>2</sub> = m&nbsp;and&nbsp;<span class="math-tex">{tex} \\theta=\\frac{\\pi}{4}{/tex}</span><br />
Now, putting these values in Eq. (i). we get<br />
<span class="math-tex">{tex}\\frac{m-\\frac{1}{2}}{1+\\frac{1}{2} m}=1 {/tex}</span>&nbsp;or&nbsp;<span class="math-tex">{tex} \\frac{m-\\frac{1}{2}}{1+\\frac{1}{2} m}=-1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow m-\\frac{1}{2}=1+\\frac{1}{2} m {/tex}</span>&nbsp;or&nbsp;<span class="math-tex">{tex}m-\\frac{1}{2}=-1-\\frac{1}{2} m{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\left(1-\\frac{1}{2}\\right) m=1+\\frac{1}{2} \\text { or } m\\left(1+\\frac{1}{2}\\right)=-1+\\frac{1}{2}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;m = 3 or m =&nbsp;<span class="math-tex">{tex}-\\frac {1}{3}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Line through the points (-2, 6) and (4, 8) is perpendicular to the line through the points (8, 12) and (x, 24). Find the value of x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Slope of the line through the points (-2, 6) and (4, 8) is<br />
<span class="math-tex">{tex}m_{1}=\\frac{8-6}{4-(-2)}=\\frac{2}{6}=\\frac{1}{3}{/tex}</span><br />
Slope of the line through the points (8, 12) and (x,&nbsp; 24) is<br />
<span class="math-tex">{tex}m_{2}=\\frac{24-12}{x-8}=\\frac{12}{x-8}{/tex}</span><br />
Since, two lines are perpendicular,<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;m<sub>1</sub>m<sub>2</sub> = -1&nbsp;<span class="math-tex">{tex}\\Rightarrow \\frac{1}{3} \\times \\frac{12}{x-8}=-1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;4 = -(x - 8)&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x = 4</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Find the equations of the lines parallel to axes and passing through (&ndash;2, 3).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Position of the lines is shown in the Figure.<br />
The y-coordinate of every point on the line parallel to the x-axis is 3, thus, the equation of the line parallel to the x-axis and passing through (&ndash; 2, 3) is y = 3.<br />
Similarly, also the equation of the line parallel to the y-axis and passing through (&ndash; 2, 3) is x = &ndash; 2.&nbsp;</p>

<p><img alt="" data-imgur-src="DSUK4YB.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/DSUK4YB.png" style="width: 180px; height: 145px;" /></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the equation of the line through (&ndash;2, 3) with slope &ndash;4.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here m = &ndash;4 and given point (x<sub>0</sub> , y<sub>0</sub> ) is (&ndash;2, 3).<br />
By slope-intercept form formula, then we have&nbsp;<br />
<span class="math-tex">{tex}m=\\frac{y-y_{0}}{x-x_{0}}, \\text { i.e., } y-y_{0}=m\\left(x-x_{0}\\right){/tex}</span><br />
y &ndash; 3 = &ndash;4 (x + 2) or 4x + y + 5 = 0.<br />
which is the required equation.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Write the equation of the line through the points (1, &ndash;1) and (3, 5)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We know that,<br />
<span class="math-tex">{tex}y-y_{1}=\\frac{y_{2}-y_{1}}{x_{2}-x_{1}}\\left(x-x_{1}\\right){/tex}</span><br />
Here x<sub>1</sub> = 1, y<sub>1</sub> = &ndash; 1, x<sub>2</sub> = 3 and y<sub>2</sub> = 5.&nbsp;<br />
<span class="math-tex">{tex}y-(-1)=\\frac{5-(-1)}{3-1}(x-1){/tex}</span><br />
or &ndash;3x + y + 4 = 0.<br />
which is the required equation.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7(1)</span></div><div class="question-text"><p>Write the equation of the lines for which tan&nbsp;<span class="math-tex">{tex}\\theta=\\frac{1}{2}{/tex}</span>,&nbsp;where &theta; is the inclination of the line and y-intercept is&nbsp;<span class="math-tex">{tex}-\\frac{3}{2}{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here, slope of the line is m = tan &theta; =&nbsp;<span class="math-tex">{tex}\\frac{1}{2}{/tex}</span>&nbsp;and y - intercept c =<span class="math-tex">{tex}-\\frac{3}{2}{/tex}</span><br />
the equation of the line is&nbsp;y = mx +c<br />
<span class="math-tex">{tex}y=\\frac{1}{2} x-\\frac{3}{2} \\text { or } 2 y-x+3=0{/tex}</span><br />
which is the required equation.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7(2)</span></div><div class="question-text"><p>Write the equation of the lines for which tan&nbsp;<span class="math-tex">{tex}\\theta=\\frac{1}{2}{/tex}</span>,&nbsp;where &theta; is the inclination of the line and x-intercept is 4.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here, we have m = tan &theta; =&nbsp;<span class="math-tex">{tex}\\frac{1}{2}{/tex}</span>&nbsp;and d = 4.<br />
the equation of the line is y = m(x &ndash; d)<br />
<span class="math-tex">{tex}y=\\frac{1}{2}(x-4) \\text { or } 2 y-x+4=0{/tex}</span><br />
which is the required equation.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the equation of the line, which makes intercepts &ndash;3 and 2 on the x- and y-axes respectively.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here a = &ndash;3 and b = 2.<br />
We know that equation of the line is&nbsp;<span class="math-tex">{tex}\\frac{x}{a}+\\frac{y}{b}=1{/tex}</span><br />
<span class="math-tex">{tex}\\frac{x}{-3}+\\frac{y}{2}=1{/tex}</span>&nbsp;or 2x - 3y + 6 = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the distance of the point (3, -5) from the line 3x -&nbsp;4y -&nbsp;26 = 0</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>According to the question,<br />
Given line is 3x &ndash; 4y &ndash;26 = 0 ...(1)<br />
Comparing (1) with general equation of line Ax + By + C = 0, we get<br />
A = 3, B = &ndash; 4 and C = &ndash; 26.<br />
Given point is&nbsp;(x<sub>1,</sub>&nbsp;y<sub>1</sub>) = (3, &ndash;5). The distance of the given point from the given line is<br />
<span class="math-tex">{tex}d=\\frac{\\left|\\mathrm{A} x_{1}+\\mathrm{B} y_{1}+\\mathrm{C}\\right|}{\\sqrt{\\mathrm{A}^{2}+\\mathrm{B}^{2}}}=\\frac{|3.3+(-4)(-5)-26|}{\\sqrt{3^{2}+(-4)^{2}}}=\\frac{3}{5}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Find the distance between the parallel lines 3x &ndash; 4y + 7 = 0 and 3x &ndash; 4y + 5 = 0</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here, A = 3, B = &ndash;4, C<sub>1</sub> = 7 and C<sub>2</sub> = 5.<br />
Hence, the required distance is&nbsp;<span class="math-tex">{tex}d=\\frac{|7-5|}{\\sqrt{3^{2}+(-4)^{2}}}=\\frac{2}{5}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>If the lines 2x + y - 3 = 0, 5x + ky - 3 = 0 and 3x - y - 2 = 0 are concurrent, find the value of k.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that three lines are&nbsp;concurrent, if they pass through a common point, i.e., point of intersection of any two lines lies on the third line. Here given lines are<br />
2x + y &ndash; 3 = 0 ....(1)<br />
5x + ky &ndash; 3 = 0 ....(2)<br />
3x &ndash; y &ndash; 2 = 0 ... (3)<br />
Solving (1) and (3) by cross-multiplication method, we get&nbsp;<span class="math-tex">{tex}\\frac{x}{-2-3}=\\frac{y}{-9+4}=\\frac{1}{-2-3}{/tex}</span>&nbsp;or x = 1, y = 1<br />
Therefore, the point of intersection of two lines is (1, 1).<br />
Since the above three lines are concurrent, the point (1, 1) will satisfy equation (2) so that<br />
5.1 + k.1&nbsp;&ndash; 3 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;k = &ndash;2</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Find the distance of the line 4x &ndash; y = 0 from the point P (4, 1) measured along the line making an angle of 135&deg; with the positive x-axis.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><html><body><p>Given that the line is 4x – y = 0 ... (1)<br/>
In order to find the distance of the line (1) from the point P (4, 1) along another line, we have to find the point of intersection of both the lines.<br/>
For this purpose, we will first find the equation of the second line.<br/>
Slope of second line is tan 135° = –1.<br/>
Equation of the line with slope -1 through the point P (4, 1) is</p>
<p><img alt="" data-imgur-src="93NkQlX.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/93NkQlX.png" style="width: 200px; height: 169px;"/><br/>
y – 1 = – 1 (x – 4) or x + y – 5 = 0 ... (2)<br/>
Solving (1) and (2), we get x = 1 and y = 4 so that point of intersection of the two lines Q (1, 4).<br/>
Now, distance of line (1) from the point P (4, 1) along the line (2)<br/>
= the distance between the points P (4, 1) and Q (1, 4).<br/>
<span class="math-tex">{tex}=\\sqrt{(1-4)^{2}+(4-1)^{2}}=3 \\sqrt{2} \\text { units. }{/tex}</span><br/>
Therefore, the required distance is <span class="math-tex">{tex}3 \\sqrt{2}{/tex}</span> units.</p></body></html></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>Assuming that straight lines work as the plane mirror for a point, find the image of the point (1, 2) in the line x &ndash; 3y + 4 = 0</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Suppose Q (h, k) is the image of the point P (1, 2) in the line<br />
x &ndash; 3y + 4 = 0 ... (1)</p>

<p><img alt="" data-imgur-src="bwqgayn.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/bwqgayn.png" style="width: 250px; height: 198px;" /><br />
Thus,the line (1) is the perpendicular bisector of line segment PQ<br />
Therefore,Slope of line PQ=<span class="math-tex">{tex}\\frac{-1}{\\text { Slope of line } x-3 y+4=0}{/tex}</span><br />
so that&nbsp;<span class="math-tex">{tex}\\frac{k-2}{h-1}=\\frac{-1}{\\frac{1}{3}}{/tex}</span>&nbsp;or 3h+k=5<br />
and the mid-point of PQ, i.e., point&nbsp;<span class="math-tex">{tex}\\left(\\frac{h+1}{2}, \\frac{k+2}{2}\\right){/tex}</span>&nbsp;will satisfy the equation (1) so that<br />
<span class="math-tex">{tex}\\frac{h+1}{2}-3\\left(\\frac{k+2}{2}\\right)+4=0 \\text { or } h-3 k=-3{/tex}</span>&nbsp;.........(3)<br />
Solving (2) and (3), we obtain h=<span class="math-tex">{tex}\\frac{6}{5}{/tex}</span>&nbsp;and k=<span class="math-tex">{tex}\\frac{7}{5}{/tex}</span><br />
Therefore, the image of the point (1, 2) in the line (1) is&nbsp;<span class="math-tex">{tex}\\left(\\frac{6}{5}, \\frac{7}{5}\\right){/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>Show that the area of the triangle formed by the lines&nbsp;y = m<sub>1</sub>x + c<sub>1</sub>, y = m<sub>2</sub>x + c<sub>2</sub> and x = 0 is&nbsp;<span class="math-tex">{tex}\\frac{\\left(c_{1}-c_{2}\\right)^{2}}{2\\left|m_{1}-m_{2}\\right|}{/tex}</span>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given lines are<br />
y = m<sub>1</sub>x + c<sub>1</sub> ... (1)<br />
y = m<sub>2</sub>x + c<sub>2</sub> ... (2)<br />
x = 0 ... (3)<br />
We know that line y = mx + c meets the line x = 0 (y-axis) at the point (0, c). Thus, two vertices of the triangle formed by lines (1) to (3) are P (0, c<sub>1</sub>) and Q (0, c<sub>2</sub>). Third vertex can be obtained by solving equations (1) and (2). Solving (1) and (2), we obtain<br />
<span class="math-tex">{tex}x=\\frac{\\left(c_{2}-c_{1}\\right)}{\\left(m_{1}-m_{2}\\right)} \\text { and } y=\\frac{\\left(m_{1} c_{2}-m_{2} c_{1}\\right)}{\\left(m_{1}-m_{2}\\right)}{/tex}</span><br />
Thus, third vertex of the triangle is R&nbsp;<span class="math-tex">{tex}\\left(\\frac{\\left(c_{2}-c_{1}\\right)}{\\left(m_{1}-m_{2}\\right)}, \\frac{\\left(m_{1} c_{2}-m_{2} c_{1}\\right)}{\\left(m_{1}-m_{2}\\right)}\\right){/tex}</span><br />
Now, the area of the triangle is given<br />
<span class="math-tex">{tex}=\\frac{1}{2} | 0\\left(\\frac{m_{1} c_{2}-m_{2} c_{1}}{m_{1}-m_{2}}-c_{2}\\right)+\\frac{c_{2}-c_{1}}{m_{1}-m_{2}}\\left(c_{2}-c_{1}\\right)+0\\left(c_{1}-\\frac{m_{1} c_{2}-m_{2} c_{1}}{m_{1}-m_{2}}\\right)|=\\frac{\\left(c_{2}-c_{1}\\right)^{2}}{2\\left|m_{1}-m_{2}\\right|}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 15</span></div><div class="question-text"><p>A line is such that its segment between the lines 5x &ndash; y + 4 = 0 and 3x + 4y &ndash; 4 = 0 is bisected at the point (1, 5). Obtain its equation.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><html><body><p>Equations of given lines are;<br/>
5x – y + 4 = 0   ... (1)<br/>
3x + 4y – 4 = 0   ... (2)<br/>
Let the required line intersects the lines (1) and (2) at points (α<sub>1</sub> , β<sub>1</sub> ) and (α<sub>2</sub> , β<sub>2</sub> ) respectively.<br/>
Hence, we have,<br/>
5α<sub>1</sub> – β<sub>1</sub> + 4 = 0 and<br/>
3 α<sub>2</sub> + 4 β<sub>2</sub> – 4 = 0<br/>
<img alt="" data-imgur-src="cppUeHy.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/cppUeHy.png" style="width: 195px; height: 233px;"/><br/>
or <span class="math-tex">{tex}\\beta_{1}=5 \\alpha_{1}+4 \\text { and } \\beta_{2}=\\frac{4-3 \\alpha_{2}}{4}{/tex}</span><br/>
We are given that the midpoint of the segment of the required line between (α<sub>1</sub> , β<sub>1</sub> ) and (α<sub>2</sub> , β<sub>2</sub> ) is (1, 5). Therefore<br/>
<span class="math-tex">{tex}\\frac{\\alpha_{1}+\\alpha_{2}}{2}=1 \\text { and } \\frac{\\beta_{1}+\\beta_{2}}{2}=5{/tex}</span><br/>
or <span class="math-tex">{tex}\\alpha_{1}+\\alpha_{2}=2 \\text { and } \\frac{5 \\alpha_{1}+4+\\frac{4-3 \\alpha_{2}}{4}}{2}=5{/tex}</span><br/>
or α<sub>1</sub> + α<sub>2</sub> = 2 and 20α<sub>1</sub> – 3α<sub>2 </sub>= 20 ... (3)<br/>
Solving equations in (3) for α<sub>1</sub> and α<sub>2</sub> , we get<br/>
<span class="math-tex">{tex}\\alpha_{1}=\\frac{26}{23} \\text { and } \\alpha_{z}=\\frac{20}{23}{/tex}</span> and hence, <span class="math-tex">{tex}\\beta_{1}=5 \\cdot \\frac{26}{23}+4=\\frac{222}{23}{/tex}</span><br/>
Equation of the required line passing through (1, 5) and (α<sub>1</sub>, β<sub>1</sub> ) is<br/>
<span class="math-tex">{tex}y-5=\\frac{\\beta_{1}-5}{\\alpha_{1}-1}(x-1){/tex}</span> <br/>
or <span class="math-tex">{tex}y-5=\\frac{\\frac{222}{23}-5}{\\frac{26}{23}-1}(x-1){/tex}</span><br/>
or 107x – 3y – 92 = 0<br/>
which is the equation of required line.</p></body></html></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 16</span></div><div class="question-text"><p>Show that the path of a moving point such that its distances from two lines 3x &ndash; 2y = 5 and 3x + 2y = 5 are equal is a straight line.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here,it is the given lines are<br />
3x &ndash; 2y = 5 &hellip; (1)<br />
and 3x + 2y = 5 &hellip; (2)<br />
Let (h, k) is any point, whose distances from the lines (1) and (2) are equal. Thus<br />
<span class="math-tex">{tex}\\frac{|3 h-2 k-5|}{\\sqrt{9+4}}=\\frac{|3 h+2 k-5|}{\\sqrt{9+4}}{/tex}</span>&nbsp;or&nbsp;<span class="math-tex">{tex}|3 h-2 k-5|=|3 h+2 k-5|{/tex}</span><br />
which gives 3h &ndash; 2k &ndash; 5 = 3h + 2k &ndash; 5 or &ndash; (3h &ndash; 2k &ndash; 5) = 3h + 2k &ndash; 5.<br />
Solving these two relations we get k = 0 or&nbsp;<span class="math-tex">{tex}h=\\frac{5}{3}{/tex}</span>&nbsp;Therefore, the point (h, k) satisfies the equations y = 0 or&nbsp;<span class="math-tex">{tex}x=\\frac{5}{3}{/tex}</span>&nbsp;which represent straight lines. Therefore, path of the point equidistant from the lines (1) and (2) is a straight line.</p></div></div></div>
`;

export const EX9_1_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Draw a quadrilateral in the Cartesian plane, whose vertices are (-4, 5), (0, 7), (5, -5) and (-4, -2) also find its area.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Area of quadrilateral ABCD = area of <span class="math-tex">{tex}\\Delta BCE{/tex}</span>&nbsp;+ area of trap. ABED<br />
<span class="math-tex">{tex} = \\frac{1}{2} \\times 10.4 \\times 5 + \\frac{1}{2}(10.4 + 7) \\times 4{/tex}</span><br />
<span class="math-tex">{tex} = 5.2 \\times 5 + 2 \\times 17.4{/tex}</span><br />
= 26 + 34.8 = 60.8 sq. units.<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_10/image024.jpg" style="height: 288px; width: 250px;" /></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>The base of an equilateral triangle with side 2a lies along the Y-axis such that the mid-point of the base is at the origin. Find vertices of the triangle.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let BC be the base of a triangle which lies on Y-axis and third vertex may be A (h, 0) or A&#39;(-h, 0).<br />
<img alt="" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/GMSSEc7.png" style="height:188px; width:220px" /><br />
Since,&nbsp;<span class="math-tex">{tex}\\Delta A B C{/tex}</span>&nbsp;is an equilateral, then AB = BC.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;AB<sup>2</sup> = BC<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;(h - 0)<sup>2</sup> + (0 - a)<sup>2</sup> = (2a)<sup>2&nbsp;</sup>[<span class="math-tex">{tex}\\because{/tex}</span>&nbsp;distance between two points (x<sub>1</sub>, y<sub>1</sub>) and (x<sub>2</sub>, y<sub>2</sub>)&nbsp;<span class="math-tex">{tex}=\\sqrt{\\left(x_{2}-x_{1}\\right)^{2}+\\left(y_{2}-y_{1}\\right)^{2}} ]{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;h<sup>2</sup> + a<sup>2</sup> = 4a<sup>2</sup>&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;h<sup>2</sup> = 3a<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow \\quad h=\\pm \\sqrt{3} a{/tex}</span>&nbsp;[taking square root]<br />
Hence, the vertices of triangle are&nbsp;<span class="math-tex">{tex}(\\sqrt{3}{/tex}</span>a, 0),(0, a),(0,-a)&nbsp;or&nbsp;<span class="math-tex">{tex}(-\\sqrt{3}{/tex}</span>a, 0),(0, a),(0,-a).</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(1)</span></div><div class="question-text"><p>Find the distance between P(x<sub>1</sub>, y<sub>1</sub>) and Q(x<sub>2</sub>, y<sub>2</sub>) when&nbsp;PQ is parallel to the y-axis</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here P(x<sub>1</sub>, y<sub>1</sub>) and Q(x<sub>2</sub>, y<sub>2</sub>) are two points.<br />
Then, distance&nbsp;<span class="math-tex">{tex}PQ = \\sqrt {{{({x_2} - {x_1})}^2} + {{({y_2} - {y_1})}^2}} {/tex}</span><br />
PQ is parallel to the y-axis then x<sub>2</sub> - x<sub>1</sub> = 0<br />
distance&nbsp;<span class="math-tex">{tex}PQ = \\sqrt { {{({y_2} - {y_1})}^2}} {/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}|y_2-y_1|{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(2)</span></div><div class="question-text"><p>Find the distance between P(x<sub>1</sub>, y<sub>1</sub>) and Q(x<sub>2</sub>, y<sub>2</sub>) when :&nbsp;PQ is parallel to the x-axis.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here P(x<sub>1</sub>, y<sub>1</sub>) and Q(x<sub>2</sub>, y<sub>2</sub>) are two points.<br />
PQ is parallel to the x-axis then y<sub>2</sub> - y<sub>1</sub> = 0<br />
Then, distance&nbsp;<span class="math-tex">{tex}PQ = \\sqrt {({x_2} - {x_1})^2} = |{x_2} - {x_1}|{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Find a point on the x-axis, which is equidistant from the points (7, 6) and (3, 4).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let P(x, 0) be any point on the x-axis which is equidistant from Q(7, 6) and R (3, 4).<br />
Then <span class="math-tex">{tex}PQ = \\sqrt {{{(x - 7)}^2} + {{(0 - 6)}^2}}{/tex}</span> <span class="math-tex">{tex}= \\sqrt {{x^2} - 14x + 49 + 36}{/tex}</span><br />
<span class="math-tex">{tex} = \\sqrt {{x^2} - 14x + 85}{/tex}</span><br />
<span class="math-tex">{tex}PR = \\sqrt {{{(x - 3)}^2} + {{(0 - 4)}^2}} = \\sqrt {{x^2} - 6x + 9 + 16}{/tex}</span><br />
<span class="math-tex">{tex}= \\sqrt {{x^2} - 6x + 25}{/tex}</span><br />
Since PQ = PR<br />
<span class="math-tex">{tex}\\therefore \\sqrt {{x^2} - 14x + 85} = \\sqrt {{x^2} - 6x + 25}{/tex}</span><br />
Squaring both sides, we have<br />
x<sup>2</sup> - 14x + 85 = x<sup>2</sup> - 6x + 25<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> -14x + 6x = 25 - 85 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 8x = -60<br />
<span class="math-tex">{tex}\\Rightarrow x = \\frac{{15}}{2}{/tex}</span><br />
Thus coordinates of point on the x-axis is <span class="math-tex">{tex}\\left( {\\frac{{15}}{2},0} \\right){/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the slope of a line, which passes through the origin, and the mid-point of the line segment joining the points P (0, -4) and B (8, 0).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>If two points are given, then slope m =&nbsp;<span class="math-tex">{tex}\\frac{y_{2}-y_{1}}{x_{2}-x_{1}}{/tex}</span><br />
Given points are P (0, -4) and Q (8, 0).<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;x<sub>1</sub> = 0, y<sub>1</sub> = -4, x<sub>2</sub> = 8, y<sub>2</sub> = 0<br />
These points plotted in XY&nbsp;- plane are given below.<br />
Mid-point of PQ is R<br />
<img alt="" data-imgur-src="G3wS3DQ.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/G3wS3DQ.png" style="width: 235px; height: 157px;" /><br />
<span class="math-tex">{tex}R=\\left(\\frac{x_{1}+x_{2}}{2}, \\frac{y_{1}+y_{2}}{2}\\right)=\\left(\\frac{0+8}{2}, \\frac{-4+0}{2}\\right)=(4,-2){/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\text { Slope of } O R=\\frac{y_{2}-y_{1}}{x_{2}-x_{1}}=\\frac{-2-0}{4-0}=\\frac{-2}{4}=-\\frac{1}{2}{/tex}</span>&nbsp;<span class="math-tex">{tex}\\left[ \\begin{array}{l}{\\because x_{1}=0, y_{1}=0,} \\ {x_{2}=4, y_{2}=-2}\\end{array}\\right]{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Without using the Pythagoras theorem, show that the points (4, 4), (3, 5) and (-1, -1) are the vertices of a right angled triangle.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let A (4, 4), B (3, 5) and C(-1, -1) be three vertices of a <span class="math-tex">{tex}\\Delta {\\rm A}{\\rm B}C{/tex}</span>.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of AB <span class="math-tex">{tex} = \\frac{{5 - 4}}{{3 - 4}} = \\frac{1}{{ - 1}} = - 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of BC <span class="math-tex">{tex}= \\frac{{ - 1 - 5}}{{ - 1 - 3}} = \\frac{{ - 6}}{{ - 4}} = \\frac{3}{2}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of AC <span class="math-tex">{tex} = \\frac{{ - 1 - 4}}{{ - 1 - 4}} = \\frac{{ - 5}}{{ - 5}} = 1{/tex}</span><br />
Now slope of AB <span class="math-tex">{tex}\\times{/tex}</span> slope of AC = -1<span class="math-tex">{tex}\\times{/tex}</span>1 = -1<br />
This shows thatAB<span class="math-tex">{tex}\\bot{/tex}</span>AC. Thus <span class="math-tex">{tex}\\Delta {\\rm A}{\\rm B}C{/tex}</span> is right angled at point A.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the slope of the line, which makes an angle of 30&deg; with the positive direction of y-axis measured anticlockwise.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The line makes an angle of 30&deg; with the positive direction of y-axis.<br />
Now the line makes an angle of (90 + 30)&deg; = 120&deg; with the positive direction x-axis.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of the line = tan 120&deg; = tan (90 + 30)<br />
=&nbsp;-cot 30<sup>o</sup> =&nbsp;<span class="math-tex">{tex}- \\sqrt 3{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Without using distance formula, show that the points (-2, -1), (4, 0), (3, 3) and (-3, 2) are the vertices of a parallelogram.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let A(-2, -1), B (4, 0), C (3, 3) and D(-3, 2) be vertices of a quadrilateral ABCD.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of AB <span class="math-tex">{tex} = \\frac{{0 - ( - 1)}}{{4 - ( - 2)}} = \\frac{1}{6}{/tex}</span><br />
Slope of BC <span class="math-tex">{tex}= \\frac{{3 - 0}}{{3 - 4}} = \\frac{3}{{ - 1}} = - 3{/tex}</span><br />
Slope of DC <span class="math-tex">{tex}= \\frac{{3 - 2}}{{3 - ( - 3)}} = \\frac{1}{6}{/tex}</span><br />
Slope of AD <span class="math-tex">{tex}= \\frac{{2 - ( - 1)}}{{ - 3 - ( - 2)}} = \\frac{3}{{ - 1}} = - 3{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of AB = Slope of DC&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> AB|| DC<br />
And Slope of BC = Slope of AD <span class="math-tex">{tex}\\Rightarrow{/tex}</span> BC || AD<br />
Thus ABCD is a parallelogram</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the angle between the x-axis and the line joining the points (3, -1) and (4, -2).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let A(3, -1) and B(4, -2) be two points. Let Q be the angle which AB makes with positive direction of x-axis.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of AB = <span class="math-tex">{tex}\\tan \\theta{/tex}</span><br />
Also Slope of AB <span class="math-tex">{tex}= \\frac{{ - 2-( - 1)}}{{4 - 3}} = \\frac{{ - 1}}{1} = - 1{/tex}</span><br />
Now <span class="math-tex">{tex}\\tan \\theta = - 1 = - \\tan 45^\\circ = \\tan (180 - 45)^\\circ{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\theta = 135^\\circ{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>The slope of a line is double of the slope of another line. If tangent of the angle between them is&nbsp;<span class="math-tex">{tex}\\frac{1}{3}{/tex}</span>, find the slope of the lines.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>If slope of one line is m. Then, the slope of the other line is 2m.<br />
Let angle between these two lines be&nbsp;<span class="math-tex">{tex}\\theta.{/tex}</span><br />
Then,&nbsp;<span class="math-tex">{tex}\\tan \\theta=\\frac{1}{3}{/tex}</span>&nbsp;[given)<br />
<span class="math-tex">{tex}\\Rightarrow \\left|\\frac{2 m-m}{1+2 m \\cdot m}\\right|=\\frac{1}{3}\\left[\\because \\tan \\theta=\\left|\\frac{m_{2}-m_{1}}{1+m_{1} \\cdot m_{2}}\\right|\\right]{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\frac{m}{1+2 m^{2}}=\\frac{1}{3}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2m<sup>2</sup> - 3m + 1 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;(2m - 1) (m - 1) = 0&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}m=\\frac{1}{2}, m=1{/tex}</span><br />
Thus, the slope of these lines are&nbsp;<span class="math-tex">{tex}\\frac{1}{2}{/tex}</span>&nbsp;and 1.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>A line passes through (x<sub>1</sub>, y<sub>1</sub>) and (h, k). If slope of the line is m, show that <span class="math-tex">{tex}k - {y_1} = m(h - {x_1}){/tex}</span>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let A(x<sub>1</sub>, y<sub>1</sub>) and B(h, k) be two points.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of AB <span class="math-tex">{tex}= \\frac{{k - {y_1}}}{{h - {x_1}}}{/tex}</span><br />
Slope of AB = m (given)<br />
<span class="math-tex">{tex}\\therefore m = \\frac{{k - {y_1}}}{{h - {x_1}}} \\Rightarrow k - {y_1} = m(h - {x_1}){/tex}</span></p></div></div></div>
`;

export const EX9_2_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Find the equation of the line which satisfy the given condition:<br />
Write the equations for the x-and y-axes.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We know that the y-coordinate of every point on the x-axis is 0.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Equation of x-axis is y = 0.<br />
The x-coordinate of every point on the y-axis is 0.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Equation of y-axis is x = 0.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Find the equation of the line which satisfy the given condition:<br />
Passing through (-4, 3) and having slope&nbsp;<span class="math-tex">{tex}\\frac{1}{2}.{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Equation of the line passing through the point (x<sub>0,</sub> y<sub>0</sub>) having slope m is<br />
y - y<sub>1</sub> = m (x - x<sub>1</sub>) ...(i)<br />
Given, m = slope of the line =&nbsp;<span class="math-tex">{tex}\\frac{1}{2}{/tex}</span>&nbsp;and x<sub>1</sub> = - 4, y<sub>1</sub> = 3<br />
From Eq. (i). required equation of the line is<br />
y - 3=<span class="math-tex">{tex}\\frac{1}{2}{/tex}</span>(x+4)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2y - 6 = x + 4<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x - 2y + 10 = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Find the equation of the line which satisfy the given condition:<br />
Passing through (0, 0) with slope m.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given point = (0, 0) and slope = m<br />
We know that the point (x, y) lies on the line with slope m through the fixed point (x<sub>0</sub>, y<sub>0</sub>), if and only if, its coordinates satisfy the equation y -&nbsp;y<sub>0</sub> = m (x -&nbsp;x<sub>0</sub>)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> y -&nbsp;0 = m (x -&nbsp;0)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> y = mx<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> y -&nbsp;mx = 0<br />
Therefore, the required equation of the line is y -&nbsp;mx = 0.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Find the equation of the line which satisfy the given condition:<br />
Passing through&nbsp;<span class="math-tex">{tex}(2,2 \\sqrt{3}){/tex}</span>&nbsp;and inclined with the x-axis at an angle of 75<sup>o</sup>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>It is given that the point = (2, 2&radic;3) and angle &theta; = 75&deg;<br />
Equation of line: (y - y<sub>1</sub>) = m (x - x<sub>1</sub>)<br />
where, m = slope of line = tan &theta; and (x<sub>1</sub>, y<sub>1</sub>) are the points through which line passes<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;m = tan 75&deg;<br />
75&deg; = 45&deg; + 30&deg; Applying the formula: tan (A + B) =&nbsp;<span class="math-tex">{tex}\\frac{\\tan A+\\tan B}{1-\\tan A \\cdot \\tan B}{/tex}</span><br />
<span class="math-tex">{tex}\\tan \\left(45^{\\circ}+30^{\\circ}\\right){/tex}</span>&nbsp;<span class="math-tex">{tex}=\\frac{\\tan 45^{\\circ}+\\tan 30^{\\circ}}{1-\\tan 45^{\\circ} \\cdot \\tan 30^{\\circ}}=\\frac{1+\\frac{1}{\\sqrt{3}}}{1-\\frac{1}{\\sqrt{3}}}{/tex}</span><br />
<span class="math-tex">{tex}\\tan 75^{\\circ}=\\frac{\\sqrt{3}+1}{\\sqrt{3}-1}{/tex}</span><br />
Rationalizing we obtain<span class="math-tex">{tex}\\tan 75^{\\circ}=\\frac{3+1+2 \\sqrt{3}}{3-1}=2+\\sqrt{3}{/tex}</span><br />
We know that the point (x, y) lies on the line with slope m through the fixed point (x<sub>1</sub>, y<sub>1</sub>), if and only if, its coordinates satisfy the equation y &ndash; y<sub>1</sub>&nbsp;= m (x &ndash; x<sub>1</sub>)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;<span class="math-tex">{tex}y-2 \\sqrt{3}=(2+\\sqrt{3})(x-2){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow y-2 \\sqrt{3}=2 x-4+\\sqrt{3} x-2 \\sqrt{3}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow y=2 x-4+\\sqrt{3} x{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow(2+\\sqrt{3}) x-y-4=0{/tex}</span><br />
Therefore, the equation of the line is (2 + <span class="math-tex">{tex}\\sqrt{3}{/tex}</span>) x &ndash; y - 4 = 0.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the equation of the line which satisfy the given condition:<br />
The line intersecting the X-axis at a distance of 3 units to the left of origin with slope -2.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><html><body><p>Given, the line intersecting the X-axis to the left of the origin. It means it intersect the negative X-axis. Clearly, line AB passes through the point (-3, 0) and m = -2.<br/>
Equation of line in point slope from is<br/>
y - y<sub>1</sub> = m(x - x<sub>1</sub>) <span class="math-tex">{tex}\\Rightarrow{/tex}</span>y - 0 = -2(x + 3)<br/>
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> y = -2x - 6<br/>
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 2x + y + 6 = 0<br/>
<img alt="" data-imgur-src="vvfmSaK.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/vvfmSaK.png" style="width: 206px; height: 152px;"/></p></body></html></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find the equation of the line which satisfy the given condition:<br />
The line intersecting the y-axis at a distance of 2 units above the origin and making an angle of 30&deg; with positive direction of the x-axis.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here m = tan 30&deg; =&nbsp;<span class="math-tex">{tex}\\frac{1}{{\\sqrt 3 }}{/tex}</span> and c = 2<br />
Putting these values in y = mx + c, we have<br />
<span class="math-tex">{tex}y = \\frac{1}{{\\sqrt 3 }}x + 2 \\Rightarrow x - \\sqrt 3 y + 2\\sqrt 3 = 0{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the equation of the line which satisfy the given condition:<br />
The line passing through the points (-1,&nbsp;1) and (2, - 4).</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given points are A(x<sub>1</sub>, y<sub>1</sub>) = (-1, 1) and B(x<sub>2</sub>, y<sub>2</sub>) = (2, -4), then equation of line AB is<br />
<span class="math-tex">{tex}y-y_{1}=\\frac{y_{2}-y_{1}}{x_{2}-x_{1}}\\left(x-x_{1}\\right){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\quad y-1=\\frac{-4-1}{2+1}(x+1){/tex}</span><span class="math-tex">{tex}\\left[\\because x_{1}=-1, y_{1}=1, x_{2}=2, y_{2}=-4\\right]{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\quad y-1=\\frac{-5}{3}(x+1) \\Rightarrow 3 y-3=-5 x-5{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;5x + 3y + 2 = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>The vertices of <span class="math-tex">{tex}\\Delta PQR{/tex}</span>, are P(2, 1), Q(-2, 3) and R (4, 5). Find equation of the median through the vertex R.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here P (2, 1), Q(-2, 3) and R(4, 5) are the vertices of <span class="math-tex">{tex}\\Delta PQR{/tex}</span>.<br />
RS is the median through vertex R.<br />
Then S is midpoint of PQ.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Coordinates of S are <span class="math-tex">{tex}\\left( {\\frac{{2 - 2}}{2},\\frac{{1 + 3}}{2}} \\right){/tex}</span> i.e. (0, 2)<br />
So equation of required median RS is<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_10/image575.png" style="width: 120px; height: 109px;" /><br />
<span class="math-tex">{tex}y - 2 = \\left( {\\frac{{5 - 2}}{{4 - 0}}} \\right)(x - 0){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow y - 2 = \\frac{3}{4}x \\Rightarrow{/tex}</span> 4y - 8 = 3x <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 3x - 4y + 8 =&nbsp;0.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the equation of the line passing through (-3, 5) and perpendicular to the line through the points (2, 5) and (-3, 6).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let A (2, 5) and B(-3, 6) be any two points.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of AB <span class="math-tex">{tex}= \\frac{{6 - 5}}{{ - 3 - 2}} = - \\frac{1}{5}{/tex}</span><br />
Since the required line is perpendicular to AB.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of required line m = 5.<br />
Now the required line passing through point (-3, 5) having slope 5<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> y - 5 = 5(x + 3) <span class="math-tex">{tex}\\Rightarrow{/tex}</span> y - 5 = 5x + 15<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 5x - y + 20 = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>A line perpendicular to the line segment joining the points (1, 0) and (2, 3) divides it in the ratio 1 : n. Find the equation of the line.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let point C divides the join of A(1, 0) and B(2, 3) in the ratio 1 : n.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Coordinates of C are <span class="math-tex">{tex}\\left( {\\frac{{2 + n}}{{1 + n}},\\frac{3}{{1 + n}}} \\right){/tex}</span><br />
Slope of AB <span class="math-tex">{tex}= \\frac{{3 - 0}}{{2 - 1}} = 3{/tex}</span><br />
Since the required line is perpendicular to AB,<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> ;Slope of required line <span class="math-tex">{tex}m = - \\frac{1}{3}{/tex}</span><br />
Now the required line passing through point <span class="math-tex">{tex}\\left( {\\frac{{2 + n}}{{1 + n}},\\frac{3}{{1 + n}}} \\right){/tex}</span> having slope <span class="math-tex">{tex}-\\frac{1}{3}{/tex}</span>.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Equation of required line is<br />
<span class="math-tex">{tex}y - \\frac{3}{{1 + n}} = \\frac{{ - 1}}{3}\\left( {x - \\frac{{2 + n}}{{1 + n}}} \\right){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\frac{{(1 + n)y - 3}}{{1 + n}} = - \\frac{1}{3}\\left[ {\\frac{{(1 + n)x - 2 - n}}{{1 + n}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 3(1 + n)y - 9 = -(1 + n)x + 2 + n<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> (1+ n)x + 3 ( 1+ n) y = n + 11.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Find the equation of a line that cuts off equal intercepts on the coordinate axis and passes through the point (2, 3).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let equal intercepts on the coordinate axis be a and the line passes through point (2, 3).<br />
<span class="math-tex">{tex}\\therefore \\frac{2}{a} + \\frac{3}{a} = 1 \\Rightarrow {/tex}</span> a = 5<br />
Thus equation of required line is<br />
<span class="math-tex">{tex}\\frac{x}{5} + \\frac{y}{5} = 1 \\Rightarrow{/tex}</span> x + y = 5</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Find equation of the line passing through the point (2, 2) and cutting off intercepts on the axis whose sum is 9.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Since the line passes through point (2, 2).<br />
<span class="math-tex">{tex}\\therefore \\frac{2}{a} + \\frac{2}{b} = 1{/tex}</span> . . . . (i)<br />
It is given that a + b = 9 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> a = 9 - b. . . (ii)<br />
Putting value of a in (i)<br />
<span class="math-tex">{tex}\\frac{2}{{9 - b}} + \\frac{2}{b} = 1 \\Rightarrow{/tex}</span> 2b + 18 - 2b = 9b - b<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> b<sup>2</sup> - 9b + 18 = 0 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> (b - 3)(b - 6) = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> b = 3, 6<br />
Putting these values of b in (ii)<br />
For b = 3, a = 9 - 3 = 6<br />
For b = 6, a = 9 - 6 = 3<br />
Thus equation of lines are<br />
<span class="math-tex">{tex}\\frac{x}{6} + \\frac{y}{3} = 1 \\Rightarrow{/tex}</span> x + 2 y = 6<br />
<span class="math-tex">{tex}\\frac{x}{3} + \\frac{y}{6} = 1 \\Rightarrow{/tex}</span> 2x + y = 6</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>Find equation of the line through the point (0, 2) making an angle <span class="math-tex">{tex}\\frac{{2\\pi }}{3}{/tex}</span> with the positive x-axis. Also, find the equation of line parallel to it and crossing the y-axis at a distance of 2 units below the origin.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here&nbsp;<span class="math-tex">{tex}m = \\tan \\frac{{2\\pi }}{3}{/tex}</span> = tan 120&deg; = tan (90 + 30) = -cot 30&deg; = <span class="math-tex">{tex} - \\sqrt 3{/tex}</span><br />
Equation of the line passing through point (0, 2) having slope&nbsp;<span class="math-tex">{tex} - \\sqrt 3{/tex}</span> is<br />
y - 2 =&nbsp;<span class="math-tex">{tex}-\\sqrt 3{/tex}</span>(x - 0)&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\sqrt 3{/tex}</span>&nbsp;x+ y - 2 = 0<br />
Now the line parallel to this line has slope&nbsp;<span class="math-tex">{tex} - \\sqrt 3{/tex}</span><br />
Here c = -2<br />
Putting these values in y = mx + c, we have<br />
y =&nbsp;<span class="math-tex">{tex}-\\sqrt 3{/tex}</span>x - 2&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}-\\sqrt 3{/tex}</span>x - y - 2 = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>The perpendicular from the origin to a line meets it at the point (-2, 9), find the equation of the line.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Slope of line <span class="math-tex">{tex}OP = \\frac{{9 - 0}}{{ - 2 - 0}} = \\frac{{ - 9}}{2}{/tex}</span><br />
Since the required line is perpendicular to OP,<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_10/image616.png" style="height:114px; width:110px" /><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of required line <span class="math-tex">{tex} = \\frac{2}{9}{/tex}</span><br />
The required line passing through point (-2, 9) having slope <span class="math-tex">{tex}\\frac{2}{9}{/tex}</span>.<br />
So equation of required line is<br />
<span class="math-tex">{tex}y - 9 = \\frac{2}{9}(x + 2) \\Rightarrow{/tex}</span> 9y - 81 = 2 x + 4<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 2x - 9y + 85 = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 15</span></div><div class="question-text"><p>The length L (in centimeter) of a copper rod is a linear function of its Celsius temperature C. In an experiment if L = 124.942 when C = 20 and L = 125.134 when C = 110, express L in terms of C.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let the length be represented by y and the temperature by x.<br />
Then (x<sub>1</sub>, y<sub>1</sub>) = (20, 124.942) and (x<sub>2</sub>, y<sub>2</sub>) = ( 110, 125.134)<br />
Putting these values in <span class="math-tex">{tex}y - {y_1} = \\left( {\\frac{{{y_2} - {y_1}}}{{{x_2} - {x_1}}}} \\right)(x - {x_1}){/tex}</span>.<br />
<span class="math-tex">{tex}\\therefore y - 124.942 = \\frac{{(125.134 - 124.942)}}{{(110 - 20)}}{/tex}</span> (x - 20)<br />
<span class="math-tex">{tex} \\Rightarrow y - 124.942 = \\frac{{0.192}}{{90}}(x - 20){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow y - 124.942 = \\frac{{0.032}}{{15}}(x - 20){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 15y - 1874.13 = 0.03x - 0.64<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 1y y = 0.032 x + 1873.49<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;y = 0.0021x + 124.8993<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;L = 0.0021 C + 124.8993</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 16</span></div><div class="question-text"><p>The owner of a milk store finds that he can sell 980 litres of milk each week at Rs. 14/litre and 1220 litres of milk each week at Rs. 16/litre. Assuming a linear relationship between selling price and demand, how many litres could he sell weekly at Rs. 17/litre?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here (x<sub>1</sub>, y<sub>1</sub>) = (980, 14) and (x<sub>2</sub>, y<sub>2</sub>) = (1220, 16).<br />
Putting these values in y - y<sub>1</sub> =&nbsp;<span class="math-tex">{tex}\\left( {\\frac{{{y_2} - {y_1}}}{{{x_2} - {x_1}}}} \\right){/tex}</span> (x - x<sub>1</sub>), we have<br />
y - 14 =&nbsp;<span class="math-tex">{tex}{\\left[ {\\frac{{16 - 14}}{{1220 - 980}}} \\right]}{/tex}</span> (x - 980)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> y - 14 =&nbsp;<span class="math-tex">{tex}\\frac{2}{{240}}{/tex}</span> (x - 980)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> y - 14 =&nbsp;<span class="math-tex">{tex}\\frac{1}{{120}}{/tex}</span> (x - 980)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 120(y - 14) = x - 980<br />
Putting y = 17, we have<br />
120 (17 - 14) = x - 980<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 120 &times; 3 = x - 980<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x = 1340 litres</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 17</span></div><div class="question-text"><p>P (a, b) is the mid point of a line segment between axes. Show that equation of the line is <span class="math-tex">{tex}\\frac{x}{a} + \\frac{y}{b} = 2{/tex}</span>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let A(x, 0) and B (0, y) be two points where the line intersect x and y-axis respectively and P(a, b) is midpoint of AB.<br />
Then&nbsp;<span class="math-tex">{tex}\\frac{{0 + x}}{2} = a \\Rightarrow{/tex}</span> x = 2 a<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_10/image640.png" style="width: 100px; height: 99px;" /><br />
and&nbsp;<span class="math-tex">{tex}\\frac{{0 + y}}{2} = b \\Rightarrow{/tex}</span> y = 2 b<br />
Now equation of required line is<br />
<span class="math-tex">{tex}\\frac{x}{{2a}} + \\frac{y}{{2b}} = 1 \\Rightarrow \\frac{x}{a} + \\frac{y}{b} = 2{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 18</span></div><div class="question-text"><p>Point R(h, k) divides a line segment between the axis in the ratio 1 : 2. Find equation of the line.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let A(x, 0) and B (0, y) be two points where the line intersect x and y axis respectively and R(h, k) is a point divides AB in the ratio 1: 2.<br />
Then <span class="math-tex">{tex}\\frac{{2x + 0}}{{2 + 1}} = h{/tex}</span> and <span class="math-tex">{tex}\\frac{{0 + y}}{{2 + 1}} = k{/tex}</span><br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_10/image646.png" style="height:123px; width:120px" /><br />
<span class="math-tex">{tex}\\Rightarrow x = \\frac{3}{2}h{/tex}</span> and y = 3 k<br />
Now equation of required line is<br />
<span class="math-tex">{tex}\\frac{x}{{\\frac{3}{2}h}} + \\frac{y}{{3k}} = 1 \\Rightarrow \\frac{{2x}}{{3h}} + \\frac{y}{{3k}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2kx + hy = 3 kh</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 19</span></div><div class="question-text"><p>By using the concept of equation of a line, prove that the three points (3, 0), (-2, -2) and (8, 2) are collinear.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here (x<sub>1</sub>, y<sub>1</sub>) = (3, 0) and (x<sub>2</sub>, y<sub>2</sub>) = (-2, -2).<br />
Putting these values in y - y<sub>1</sub> =&nbsp;<span class="math-tex">{tex}\\left( {\\frac{{{y_2} - {y_1}}}{{{x_2} - {x_1}}}} \\right){/tex}</span> (x - x<sub>1</sub>), we have,<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> y - 0 =&nbsp;<span class="math-tex">{tex}\\left( {\\frac{{ - 2 - 0}}{{ - 2 - 3}}} \\right){/tex}</span> (x - 3)<br />
<span class="math-tex">{tex} \\Rightarrow y = \\left( {\\frac{{ - 2}}{{ - 5}}} \\right)(x - 3){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 5y = 2x - 6<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 2x - 5y = 6<br />
Put the coordinates of third point (8, 2) in above equation, we have<br />
2<span class="math-tex">{tex}\\times{/tex}</span>8 - 5<span class="math-tex">{tex}\\times{/tex}</span>2 = 6<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 16 - 10 = 6 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 6 = 6 which is true.<br />
Thus the third point lies on the line of the first two points. So given three points are collinear.</p></div></div></div>
`;

export const EX9_3_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(1)</span></div><div class="question-text"><p>Reduce the equation into slope-intercept form and find the&nbsp;slope&nbsp;and the y-intercept.<br />
x + 7y = 0</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here x + 7y = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 7y = -x<br />
<span class="math-tex">{tex}y = \\frac{{ - 1}}{7}x \\Rightarrow y = \\frac{{ - 1}}{7}x + 0{/tex}</span>&nbsp;which is required slope intercept form.<br />
Comparing it with y = mx +c, we have<br />
<span class="math-tex">{tex}m = \\frac{{ - 1}}{7}{/tex}</span> and c = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(2)</span></div><div class="question-text"><p>Reduce the equation into slope intercept form and find the&nbsp;slope&nbsp;and the y-intercept.<br />
6x + 3y - 5 = 0</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here 6x + 3y - 5 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 3y = -6x + 5 <span class="math-tex">{tex}\\Rightarrow y = \\frac{{ - 6}}{3}x + \\frac{5}{3} \\Rightarrow y = - 2x + \\frac{5}{3}{/tex}</span><br />
Which is required slope intercept form,<br />
Comparing it with y = mx + c, we have<br />
m = -2 and <span class="math-tex">{tex}c = \\frac{5}{3}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(3)</span></div><div class="question-text"><p>Reduce the equation into slope-intercept form and find the&nbsp;slope&nbsp;and the y-intercept.<br />
y = 0</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here y = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> y = 0 . x + 0<br />
Which is required slope intercept form,<br />
Comparing it with y = mx + c, we have<br />
m = 0 and c = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(1)</span></div><div class="question-text"><p>Reduce the given equation into the intercept form and find the&nbsp;intercept&nbsp;on the axis.<br />
3x + 2y - 12 = 0</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here 3x + 2y - 12 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;3x + 2y = 12<br />
<span class="math-tex">{tex}\\Rightarrow \\frac{{3x}}{{12}} + \\frac{{2y}}{{12}} = 1 \\Rightarrow \\frac{x}{4} + \\frac{y}{6} = 1{/tex}</span><br />
which is required intercept form.<br />
Comparing it with <span class="math-tex">{tex}\\frac{x}{a} + \\frac{y}{b} = 1{/tex}</span>, we have<br />
a = 4 and b = 6</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(2)</span></div><div class="question-text"><p>Reduce the given equation into the intercept form and find the&nbsp;intercept on the axis. 4x - 3y = 6</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here 4x - 3y = 6<br />
<span class="math-tex">{tex}\\Rightarrow \\frac{{4x}}{6} - \\frac{{3y}}{6} = 1 \\Rightarrow \\frac{{2x}}{3} - \\frac{y}{2} = 1]{/tex}</span><span class="math-tex">{tex}\\Rightarrow \\frac{x}{{\\frac{3}{2}}} + \\frac{y}{{ - 2}} = 1{/tex}</span><br />
which is required intercept form,<br />
Comparing it with <span class="math-tex">{tex}\\frac{x}{a} + \\frac{y}{b} = 1{/tex}</span>, we have<br />
<span class="math-tex">{tex}a = \\frac{3}{2}{/tex}</span> and b = -2</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(3)</span></div><div class="question-text"><p>Reduce the given equation into the intercept form and find the&nbsp;intercept&nbsp;on the axis. 3y + 2 = 0</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here 3y + 2 = 0<br />
<span class="math-tex">{tex}\\Rightarrow 3y = - 2{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{3y}}{{ - 2}} = 1 \\Rightarrow \\frac{{0x}}{{ - 2}} + \\frac{{3y}}{{ - 2}} = 1 \\Rightarrow \\frac{{0x}}{{ - 2}} + \\frac{y}{{\\frac{{ - 2}}{3}}} = 1{/tex}</span><br />
which is required intercept form.<br />
Comparing it with <span class="math-tex">{tex}\\frac{x}{a} + \\frac{y}{b} = 1{/tex}</span> we have<br />
a = 0 and b = -2/3.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Find the distance of the point (-1, 1) from the line 12 (x + 6) = 5(y - 2).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here given line is 12(x + 6) = 5(y - 2)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 12x + 72 = 5y - 10 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 12x - 5y + 82 = 0<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Perpendicular distance of the point (-1, 1) from the line 12x - 5y + 82 = 0 is<br />
<span class="math-tex">{tex}\\left| {\\frac{{12( - 1) - 5(1) + 82}}{{\\sqrt {{{(12)}^2} + {{( - 5)}^2}} }}} \\right| = \\left| {\\frac{{ - 12 - 5 + 82}}{{\\sqrt {144 + 25} }}} \\right| = \\left| {\\frac{{65}}{{13}}} \\right|{/tex}</span> = 5 units.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Find the points on the x-axis, whose distances from the line <span class="math-tex">{tex}\\frac{x}{3} + \\frac{y}{4} = 1{/tex}</span>are 4 units.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let the coordinates of the point on x-axis be <span class="math-tex">{tex}(\\alpha ,0){/tex}</span>.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Perpendicular distance of the point&nbsp;<span class="math-tex">{tex}(\\alpha ,0){/tex}</span> from the line 4x + 3y - 12 = 0 is<br />
<span class="math-tex">{tex}\\left| {\\frac{{4\\alpha + 3(0) - 12}}{{\\sqrt {{{(4)}^2} + {{(3)}^2}} }}} \\right| = \\left| {\\frac{{4\\alpha - 12}}{5}} \\right|{/tex}</span><br />
It is given that <span class="math-tex">{tex}\\left| {\\frac{{4\\alpha - 12}}{5}} \\right| = 4{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{4\\alpha - 12}}{5} = \\pm 4{/tex}</span><br />
Now <span class="math-tex">{tex}\\frac{{4\\alpha - 12}}{5} = 4{/tex}</span> or <span class="math-tex">{tex}\\frac{{4\\alpha - 12}}{5} = - 4{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow 4\\alpha - 12 = 20{\\text{ or }}4\\alpha - 12 = - 20{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow 4\\alpha = 32{\\text{ or }}4\\alpha = - 8{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\alpha = 8{\\text{ or }}\\alpha = - 2{/tex}</span><br />
Thus the points on x-axis are (8, 0) and (-2, 0)</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(1)</span></div><div class="question-text"><p>Find the distance between parallel lines. 15x + 8y - 34 = 0 and 15x + 8y + 31 = 0</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equations are<br />
15x + 8y - 34 = 0<br />
and 15 x + 8y + 31 = 0<br />
where a = 15, b = 8, c<sub>1</sub> = -34 and c<sub>2</sub> = 31<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;The distance between two parallel lines<br />
<span class="math-tex">{tex}d = \\frac{{\\left| {{c_1} - {c_2}} \\right|}}{{\\sqrt {{a^2} + {b^2}} }}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\frac{{\\left| { - 34 - 31} \\right|}}{{\\sqrt {{{(15)}^2} + {{(8)}^2}} }}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac{{65}}{{17}}{/tex}</span> units</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(2)</span></div><div class="question-text"><p>Find the distance between parallel lines. l(x + y) + p = 0 and l(x + y) - r = 0</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have the equation,<br />
lx + ly + p = 0<br />
and lx + ly - r = 0<br />
where a = 1, b = 1 , c<sub>1</sub> = p and c<sub>2</sub> = -r<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;The distance between two parallel lines<br />
d =&nbsp;<span class="math-tex">{tex}\\frac{{\\left| {{c_1} - {c_2}} \\right|}}{{\\sqrt {{a^2} + {b^2}} }}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\frac{{\\left| {p + r} \\right|}}{{\\sqrt {{1^2} + {1^2}} }}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\frac{1}{{\\sqrt 2 }}\\left| {\\frac{{p + r}}{1}} \\right|{/tex}</span>&nbsp;units</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find equation of the line parallel to the line 3x - 4y + 2 = 0 and passing through the point (&ndash;2, 3).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given equation of the line is 3x &ndash; 4y + 2 = 0<br />
<span class="math-tex">{tex}\\Rightarrow y=\\frac{3 x}{4}+\\frac{2}{4}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow y=\\frac{3 x}{4}+\\frac{1}{2}{/tex}</span><br />
Which is of the form y = mx + c, where m is the slope.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;the slope of the given line is <span class="math-tex">{tex}\\frac34{/tex}</span><br />
We know that parallel lines have the same slope.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;the slope of another line = m = <span class="math-tex">{tex}\\frac34{/tex}</span><br />
Equation of line having slope m and passing through (x<sub>1</sub>, y<sub>1</sub>) is given by<br />
y - y<sub>1</sub> = m(x - x<sub>1</sub>)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Equation of line having slope <span class="math-tex">{tex}\\frac34{/tex}</span> and passing through (-2, 3) is<br />
<span class="math-tex">{tex}y-3=\\frac{3}{4}(x-(-2)){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow {/tex}</span>&nbsp;4y - 3 <span class="math-tex">{tex}\\times{/tex}</span> 4 = 3x + 3 <span class="math-tex">{tex}\\times{/tex}</span> 2<br />
<span class="math-tex">{tex}\\Rightarrow {/tex}</span>&nbsp;3x - 4y +&nbsp;18=0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find equation of the line perpendicular to the line x - 7y + 5 = 0 and having x intercept 3.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Equation of any line which is perpendicular to the line<br />
x - 7y + 5 = 0 is 7x + y + k = 0<br />
Since this line passes through point (3, 0)<br />
<span class="math-tex">{tex}\\therefore 7 \\times 3 + 0 + k = 0 \\Rightarrow {/tex}</span> k = -21<br />
Thus equation of required line is 7x + y - 21 = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find angles between the lines <span class="math-tex">{tex}\\sqrt 3 x + y = 1{/tex}</span> and <span class="math-tex">{tex}x + \\sqrt 3 y = 1{/tex}</span>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have <span class="math-tex">{tex}\\sqrt 3 x + y = 1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow y = - \\sqrt 3 x + 1{/tex}</span><br />
<span class="math-tex">{tex}\\therefore {m_1} = - \\sqrt 3{/tex}</span><br />
Also <span class="math-tex">{tex}x + \\sqrt 3 y = 1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\sqrt 3 y = - x + 1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow y = \\frac{{ - 1}}{{\\sqrt 3 }}x + \\frac{1}{{\\sqrt 3 }}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore {m_2} = \\frac{{ - 1}}{{\\sqrt 3 }}{/tex}</span><br />
Let&nbsp;<span class="math-tex">{tex}\\theta{/tex}</span> be the angle between the lines. Then,<br />
<span class="math-tex">{tex}\\tan \\theta = \\left| {\\frac{{ - \\sqrt 3 + \\frac{1}{{\\sqrt 3 }}}}{{1 + ( - \\sqrt 3 )\\left( {\\frac{{ - 1}}{{\\sqrt 3 }}} \\right)}}} \\right| = \\left| {\\frac{{\\frac{{ - 3 + 1}}{{\\sqrt 3 }}}}{{1 + 1}}} \\right|{/tex}</span><span class="math-tex">{tex}= \\left| {\\frac{{ - 2}}{{\\sqrt 3 }} \\times \\frac{1}{2}} \\right| = \\left| {\\frac{{ - 1}}{{\\sqrt 3 }}} \\right| = \\frac{1}{{\\sqrt 3 }}{/tex}</span><br />
<span class="math-tex">{tex}\\tan \\theta = \\tan 30^\\circ{/tex}</span> and <span class="math-tex">{tex}\\tan (180^\\circ - 30^\\circ ){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\theta = 30^\\circ{/tex}</span> and 150&deg;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>The line through the points (h, 3) and (4, 1) intersects the line 7x - 9y - 19 = 0 at right angle. Find the value of h.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Slope of the line passing through the points (h, 3) and (4, 1) is<br />
<span class="math-tex">{tex}= \\frac{{1 - 3}}{{4 - h}} = \\frac{{ - 2}}{{4 - h}}{/tex}</span><br />
Also slope of the line 7x - 9y - 19 = 0 is <span class="math-tex">{tex}\\frac{7}{9}{/tex}</span><br />
Since two lines are perpendicular to each other<br />
<span class="math-tex">{tex}\\therefore \\frac{{ - 2}}{{4 - h}} \\times \\frac{7}{9} = - 1 \\Rightarrow \\frac{{ - 14}}{{36 - 9h}} = - 1{/tex}</span>&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> -14 = -36 + 9h<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 9h = 36 - 14 <span class="math-tex">{tex}\\Rightarrow h = \\frac{{22}}{9}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Prove that the line through the point (x<sub>1</sub>, y<sub>1</sub>) and parallel to the line Ax + By + C = 0 is A(x - x<sub>1</sub>) + B(y - y<sub>1</sub>) = 0.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Equation of the line parallel to line Ax + By + C = 0 is Ax + By + K = 0 . . . (i)<br />
Since line (i) passes through (x<sub>1</sub>, y<sub>1</sub>)<br />
Ax<sub>1</sub> + By<sub>1</sub> + K = 0...(ii)<br />
Subtracting (ii) from (i), we have<br />
A(x - x<sub>1</sub>) + B(y - y<sub>1</sub>) = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Two lines passing through the point (2, 3) intersects each other at an angle of 60&deg;. If slope of one line is 2 Find equation of the other line.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here m<sub>1</sub> = 2 and <span class="math-tex">{tex}\\theta  = 60^\\circ{/tex}</span><br />
We know that <span class="math-tex">{tex}\\tan \\theta  = \\left| {\\frac{{{m_1} - {m_2}}}{{1 + {m_1}{m_2}}}} \\right|{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\tan 60^\\circ  = \\left| {\\frac{{2 - {m_2}}}{{1 + 2{m_2}}}} \\right| \\Rightarrow \\sqrt 3  = \\left| {\\frac{{2 - {m_2}}}{{1 + 2{m_2}}}} \\right|{/tex}</span><span class="math-tex">{tex}\\Rightarrow \\frac{{2 - {m_2}}}{{1 + 2{m_2}}} =  \\pm \\sqrt 3{/tex}</span><br />
If <span class="math-tex">{tex}\\frac{{2 - {m_2}}}{{1 + 2{m_2}}} = \\sqrt 3  \\Rightarrow 2 - {m_2} = \\sqrt 3  + 2\\sqrt 3 {m_2}{/tex}</span><span class="math-tex">{tex}\\Rightarrow (2\\sqrt 3  + 1){m_2} = 2 - \\sqrt 3{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow {m_2} = \\frac{{2 - \\sqrt 3 }}{{2\\sqrt 3  + 1}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Equation of required line is<br />
<span class="math-tex">{tex}y - 3 = \\frac{{2 - \\sqrt 3 }}{{2\\sqrt 3  + 1}}(x - 2){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow (2\\sqrt 3  + 1)y - 6\\sqrt 3  - 3{/tex}</span><span class="math-tex">{tex}= (2 - \\sqrt 3 )x - 4 + 2\\sqrt 3{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow (\\sqrt 3  - 2)x + (2\\sqrt 3  + 1)y{/tex}</span><span class="math-tex">{tex}=  - 4 + 2\\sqrt 3  + 6\\sqrt 3  + 3{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow (\\sqrt 3  - 2)x + (2\\sqrt 3  + 1)y = 8\\sqrt 3  - 1{/tex}</span><br />
If <span class="math-tex">{tex}\\frac{{2 - {m_2}}}{{1 + 2{m_2}}} =  - \\sqrt 3  \\Rightarrow 2 - {m_2} =  - \\sqrt 3  - 2\\sqrt 3 {m_2}{/tex}</span><span class="math-tex">{tex}\\Rightarrow (2\\sqrt 3  - 1){m_2} =  - (2 + \\sqrt 3 ){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow {m_2} = \\frac{{ - (2 + \\sqrt 3 )}}{{(2\\sqrt 3  - 1)}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Equation of required line is<br />
<span class="math-tex">{tex}y - 3 = \\frac{{ - (2 + \\sqrt 3 )}}{{(2\\sqrt 3  - 1)}}(x - 2){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow (2\\sqrt 3  - 1)y - 6\\sqrt 3  + 3{/tex}</span><span class="math-tex">{tex}\\Rightarrow  - (2 + \\sqrt 3 )x + 4x2\\sqrt 3{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow (2 + \\sqrt 3 )x + (2\\sqrt 3  - 1)y{/tex}</span><span class="math-tex">{tex}\\Rightarrow 4 + 2\\sqrt 3  + 6\\sqrt 3  - 3{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow (2 + \\sqrt 3 )x + (2\\sqrt 3  - 1)y \\Rightarrow 8\\sqrt 3  + 1{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Find the equation of the right bisector of the line segment joining the points (3, 4) and (-1, 2).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Mid point of the line segment joining the points (3, 4) and (-1, 2) is <span class="math-tex">{tex}\\left( {\\frac{{3 - 1}}{2},\\frac{{4 + 2}}{2}} \\right){/tex}</span> i.e. (1, 3).<br />
Slope of the line joining points (3, 4) and (-1, 2)<br />
<span class="math-tex">{tex}= \\frac{{2 - 4}}{{ - 1 - 3}} = \\frac{{ - 2}}{{ - 4}} = \\frac{1}{2}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of the required line is -2.<br />
Thus the required line passes through point (1, 3) having slope -2.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Equation of required line is y - 3 = -2(x - 1) <span class="math-tex">{tex}\\Rightarrow{/tex}</span> y - 3 = -2x + 2 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 2x + y - 5 = 0.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>Find the coordinates of the foot of perpendicular from the point (-1, 3) to the line 3x - 4y - 16 = 0</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let Q be the foot of perpendicular drawn from P(-1, 3) on the line 3x - 4y - 16 = 0<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Equation of a line <span class="math-tex">{tex}\\bot{/tex}</span> to 3x - 4y - 16 = 0 is 4x + 3y + k = 0<br />
Since this line passes through point (-1, 3)<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_10/image852.png" style="width: 110px; height: 92px;" /><br />
<span class="math-tex">{tex}\\therefore 4 \\times - 1 + 3 \\times 3 + k = 0{/tex}</span><span class="math-tex">{tex}\\Rightarrow - 4 + 9 + k = 0 \\Rightarrow k = - 5{/tex}</span><br />
Thus Q is a point of intersection of the lines<br />
3x - 4y - 16 = 0 and 4x + 3y - 5 = 0<br />
Solving these equations by cross multiplication we have<br />
<span class="math-tex">{tex}\\frac{x}{{ - 68}} = \\frac{y}{{49}} = - \\frac{1}{{25}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\frac{x}{{ - 68}} = \\frac{{ - 1}}{{25}} \\Rightarrow x = \\frac{{68}}{{25}}{/tex}</span><br />
<span class="math-tex">{tex}\\frac{y}{{49}} = \\frac{{ - 1}}{{25}} \\Rightarrow y = \\frac{{ - 49}}{{25}}{/tex}</span><br />
Thus coordinates of foot of perpendicular are <span class="math-tex">{tex}\\left( {\\frac{{68}}{{25}},\\frac{{ - 49}}{{25}}} \\right){/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>The perpendicular from the origin to the line y = mx + c meets it at the point (-1, 2). Find the values of m and c.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Equation of the line PQ<br />
<span class="math-tex">{tex}y - 0 = \\left( {\\frac{{2 - 0}}{{ - 1 - 0}}} \\right)(x - 0){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> y = -2x <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 2x + y = 0 ....... (i)<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_10/image862.png" style="width: 120px; height: 109px;" /><br />
Slope of the required line which is perpendicular to line (i) is <span class="math-tex">{tex}\\frac{1}{2}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Equation of the line AB is<br />
<span class="math-tex">{tex}y - 2 = \\frac{1}{2}(x + 1) \\Rightarrow{/tex}</span> 2y - 4 = x + 1<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2y = x + 5 <span class="math-tex">{tex} \\Rightarrow y = \\frac{x}{2} + \\frac{5}{2}{/tex}</span><br />
Comparing it with y = mx + c, we have<br />
<span class="math-tex">{tex}m = \\frac{1}{2}{/tex}</span> and <span class="math-tex">{tex}c = \\frac{5}{2}{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 15</span></div><div class="question-text"><p>If p and q are the length of perpendiculars from the origin to the lines <span class="math-tex">{tex}x\\cos \\theta - y\\sin \\theta = k\\cos 2\\theta{/tex}</span> and <span class="math-tex">{tex}x\\sec \\theta + y\\operatorname{co} sec\\theta = k{/tex}</span> respectively, prove that p<sup>2</sup> + 4q<sup>2</sup> = k<sup>2</sup>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Length of perpendicular from origin to line <span class="math-tex">{tex}x\\cos \\theta - y\\sin \\theta - k\\cos 2\\theta = 0{/tex}</span> is<br />
<span class="math-tex">{tex}p = \\left| {\\frac{{0 \\times \\cos \\theta - 0 \\times \\sin \\theta - kcos2\\theta }}{{\\sqrt {{{\\cos }^2}\\theta + {{\\sin }^2}\\theta } }}} \\right|{/tex}</span><span class="math-tex">{tex}= \\left| {\\frac{{ - k\\cos 2\\theta }}{1}} \\right| = k\\cos 2\\theta{/tex}</span><br />
Length of perpendicular from origin to line <span class="math-tex">{tex}x\\sec \\theta + y\\cos ec\\theta - k = 0{/tex}</span> is<br />
<span class="math-tex">{tex}q = \\left| {\\frac{{0 \\times \\sec \\theta + 0 \\times \\cos ec\\,\\theta - k}}{{\\sqrt {{{\\sec }^2}\\theta + \\cos e{c^2}\\theta } }}} \\right|{/tex}</span><span class="math-tex">{tex}= \\left| {\\frac{{ - k}}{{\\sqrt {\\frac{{{{\\sin }^2}\\theta + {{\\cos }^2}\\theta }}{{{{\\sin }^2}\\theta {{\\cos }^2}\\theta }}} }}} \\right|{/tex}</span><br />
<span class="math-tex">{tex}=\\left| { - k\\sin \\theta \\cos \\theta } \\right| = \\frac{k}{2}\\sin 2\\theta{/tex}</span><br />
Now <span class="math-tex">{tex}{p^2} +4 {q^2} = {(k\\cos 2\\theta )^2} + 4{\\left( {\\frac{k}{2}\\sin 2\\theta } \\right)^2}{/tex}</span><br />
<br />
<span class="math-tex">{tex}= {k^2}({\\cos ^2}2\\theta + {\\sin ^2}2\\theta ) = {k^2}{/tex}</span>.</p></div></div></div>
`;

export const MISC_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(1)</span></div><div class="question-text"><p>Find the values of k for which the line (k&ndash;3) x &ndash; (4 &ndash; k<sup>2</sup>) y + k<sup>2</sup> &ndash; 7k + 6 = 0 is parallel to the x-axis.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of the line is<br />
(k&ndash;3) x &ndash; (4 &ndash; k<sup>2</sup>) y +&nbsp;<span class="math-tex">{tex}k^2-7k+6=0{/tex}</span><br />
The given line can be written as<br />
(4 &ndash; k<sup>2</sup>) = (k&ndash;3) x + k<sup>2</sup>&nbsp;&ndash; 7k + 6 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> y =&nbsp;<span class="math-tex">{tex}\\frac{(k-3)}{\\left(4-k^{2}\\right)} x+\\frac{k^{2}-7 k+6}{\\left(4-k^{2}\\right)}{/tex}</span>&nbsp;which is the form y = mx+c<br />
Therefore, Slope of the given line =<span class="math-tex">{tex}\\frac{(k-3)}{\\left(4-k^{2}\\right)}{/tex}</span><br />
Slope of x- axis = 0<br />
Then,&nbsp;<span class="math-tex">{tex}\\frac{(k-3)}{\\left(4-k^{2}\\right)}=0{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;k &ndash; 3 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;k = 3<br />
Thus if the given line is parallel to the x &ndash; axis, then the value of k is 3</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(2)</span></div><div class="question-text"><p>Find the values of k for which the line (k&ndash;3) x &ndash; (4 &ndash; k<sup>2</sup>) y + k<sup>2</sup> &ndash; 7k + 6 = 0 is parallel to the y-axis.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of the line is<br />
(k&ndash;3) x &ndash; (4 &ndash; k<sup>2</sup>) y +&nbsp;<span class="math-tex">{tex}k^2-7k+6=0{/tex}</span><br />
The slope of the line is =&nbsp;<span class="math-tex">{tex}\\frac{(k-3)}{\\left(4-k^{2}\\right)}{/tex}</span><br />
Now,&nbsp;<span class="math-tex">{tex}\\frac{(k-3)}{\\left(4-k^{2}\\right)}{/tex}</span>&nbsp;is undefined at k<sup>2</sup>&nbsp;= 4<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;k<sup>2</sup>&nbsp;= 4<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;k =&nbsp;<span class="math-tex">{tex}\\pm{/tex}</span>2<br />
Thus, if the given line is parallel to the y &ndash; axis, then the value of k is&nbsp;<span class="math-tex">{tex}\\pm{/tex}</span>2.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(3)</span></div><div class="question-text"><p>Find the values of k for which the line (k -&nbsp;3) x -&nbsp;(4 -&nbsp;k<sup>2</sup>) y + k<sup>2</sup>&nbsp;- 7k + 6 = 0 is passing through the origin.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given equation of the line is<br />
(k &ndash; 3) x &ndash; (4 &ndash; k<sup>2</sup>) y +&nbsp;<span class="math-tex">{tex}k^2-7k+6=0{/tex}</span><br />
If the given line is passing through the origin, then point (0,0) satisfies the given equation of line.<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>(k - 3) (0) &ndash; (4 - k<sup>2</sup>)(0) + k<sup>2</sup>&nbsp;- 7k + 6 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;k<sup>2</sup>&nbsp;- 7k + 6 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;k<sup>2</sup>&nbsp;- 6k - k + 6 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;(k - 6) (k - 1) = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;k = 1 or 6<br />
Thus, we get the value of k is either 1 or 6.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Find the equations of the lines which cut-off intercepts on the axes whose sum and product are 1 and -6 respectively.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let <span class="math-tex">{tex}\\frac{x}{a} + \\frac{y}{b} = 1{/tex}</span>&nbsp;be the equation of line.<br />
It is given that a + b = 1 and ab = -6<br />
We know that (a - b)<sup>2</sup> = (a + b)<sup>2</sup> - 4ab<br />
<span class="math-tex">{tex} \\Rightarrow {(a - b)^2} = {(1)^2} - 4 \\times - 6{/tex}</span>&nbsp;<span class="math-tex">{tex} = 1 + 24 = 25 \\Rightarrow a - b = \\pm 5{/tex}</span><br />
Solving a + b = 1 and a - b = 5 we have<br />
a = 3 and b = -2<br />
Solving a +b = 1 and a - b = -5, we have<br />
a = -2 and b = 3<br />
Thus the required equations are<br />
<span class="math-tex">{tex}\\frac{x}{3} + \\frac{y}{{ - 2}} = 1{/tex}</span><span class="math-tex">{tex} \\Rightarrow - 2x + 3y = - 6{/tex}</span>&nbsp;<span class="math-tex">{tex} \\Rightarrow 2x - 3y = 6{/tex}</span><br />
and <span class="math-tex">{tex}\\frac{x}{{ - 2}} + \\frac{y}{3} = 1 \\Rightarrow 3x - 2y = - 6{/tex}</span>&nbsp;<span class="math-tex">{tex} \\Rightarrow - 3x + 2y = 6{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>What are the points on the y-axis whose distance from the line <span class="math-tex">{tex}\\frac{x}{3} + \\frac{y}{4} = 1{/tex}</span>&nbsp;is 4 units.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let point on y-axis be (0, y).<br />
The given equation of line is <span class="math-tex">{tex}\\frac{x}{3} + \\frac{y}{4} = 1{/tex}</span>.<br />
<span class="math-tex">{tex} \\Rightarrow 4x + 3y = 12{/tex}</span>&nbsp;<span class="math-tex">{tex} \\Rightarrow 4x + 3y - 12 = 0{/tex}</span><br />
Now perpendicular distance from point (0, y) to line 4x + 3y - 12 = 0 is<br />
<span class="math-tex">{tex}\\left| {\\frac{{4 \\times 0 + 3y - 12}}{{\\sqrt {{{(4)}^2} + {{(3)}^2}} }}} \\right| = \\left| {\\frac{{3y - 12}}{{\\sqrt {25} }}} \\right| = \\left| {\\frac{{3y - 12}}{5}} \\right|{/tex}</span><br />
It is given that<br />
<span class="math-tex">{tex}\\left| {\\frac{{3y - 12}}{5}} \\right| = 4 \\Rightarrow \\left| {\\frac{{3y - 12}}{5}} \\right| = \\pm 4{/tex}</span><br />
When <span class="math-tex">{tex}\\frac{{3y - 12}}{5} = 4{/tex}</span>&nbsp;<span class="math-tex">{tex} \\Rightarrow 3y - 12 = 20 \\Rightarrow y = \\frac{{32}}{3}{/tex}</span><br />
When <span class="math-tex">{tex}\\frac{{3y - 12}}{5} = - 4{/tex}</span><span class="math-tex">{tex} \\Rightarrow 3y - 12 = - 20 \\Rightarrow y = \\frac{{ - 8}}{3}{/tex}</span><br />
Thus required points are <span class="math-tex">{tex}\\left( {0,\\frac{{32}}{3}} \\right){/tex}</span>&nbsp;and <span class="math-tex">{tex}\\left( {0,\\frac{{ - 8}}{3}} \\right){/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Find perpendicular distance from the origin of the line joining the points <span class="math-tex">{tex}(\\cos \\theta ,\\sin \\theta ){/tex}</span>&nbsp;and <span class="math-tex">{tex}(\\cos \\phi ,\\sin \\phi ){/tex}</span>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><strong>Step 1: </strong>Determine the equation of the Line<br />
Let A = (cos <span class="math-tex">{tex}\\theta{/tex}</span>, sin&nbsp;<span class="math-tex">{tex}\\theta{/tex}</span>) and<br />
B = (cos <span class="math-tex">{tex}\\phi{/tex}</span>, sin <span class="math-tex">{tex}\\phi{/tex}</span>) be the given points.<br />
Then equation of AB is of the form,<br />
<span class="math-tex">{tex}y-y_1=\\frac{y_2-y_1}{x_2-x_1}\\left(x-x_1\\right){/tex}</span><br />
<span class="math-tex">{tex}y-\\sin \\theta=\\frac{\\sin \\phi-\\sin \\theta}{\\cos \\phi-\\cos \\theta}(x-\\cos \\theta){/tex}</span><br />
<span class="math-tex">{tex}y(\\cos \\phi-\\cos \\theta)-\\sin \\theta(\\cos \\phi-\\cos \\theta){/tex}</span>&nbsp;=&nbsp;<span class="math-tex">{tex}x(\\sin\\phi-\\sin \\theta)-\\cos \\theta(\\sin \\phi-\\sin \\theta){/tex}</span><br />
<span class="math-tex">{tex}y(\\cos \\phi-\\cos \\theta)-\\sin \\theta \\cos \\phi+\\sin \\theta \\cos \\theta{/tex}</span>&nbsp;=&nbsp;<span class="math-tex">{tex}x(\\sin \\phi-\\sin \\theta)-\\cos \\theta \\sin \\phi+\\sin \\theta \\cos \\theta{/tex}</span><br />
<span class="math-tex">{tex}x(\\sin \\phi-\\sin \\theta)-y(\\cos \\phi-\\cos \\theta)+\\sin \\theta \\cos{/tex}</span>&nbsp;<span class="math-tex">{tex}\\phi-\\cos \\theta \\sin \\phi=0{/tex}</span><br />
<span class="math-tex">{tex}x(\\sin \\phi-\\sin \\theta)-y(\\cos \\phi-\\cos \\theta)+\\sin (\\theta-\\phi){/tex}</span>&nbsp;= 0<br />
<span class="math-tex">{tex}[\\because \\sin (\\theta-\\phi)=\\sin \\theta \\cos \\phi-\\cos \\theta \\sin \\phi]{/tex}</span></p>

<p><strong>Step 2:</strong> Determine the distance<br />
We know that distance of this line from the origin,<br />
<span class="math-tex">{tex}D=\\left|\\frac{0-0+\\sin (\\theta-\\phi)}{\\sqrt{(\\sin \\phi-\\sin \\theta)^2+(\\cos \\phi-\\cos \\theta)^2}}\\right|{/tex}</span><br />
<span class="math-tex">{tex}=\\left|\\frac{\\sin (\\theta-\\phi)}{\\sqrt{2-2(\\cos \\theta \\cos \\phi+\\sin \\theta \\sin \\phi)}}\\right|{/tex}</span><br />
<span class="math-tex">{tex}=\\left|\\frac{\\sin (\\theta-\\phi)}{\\sqrt{2} \\sqrt{1-\\cos (\\theta-\\phi)}}\\right|{/tex}</span><br />
<span class="math-tex">{tex}=\\left|\\frac{\\sin (\\theta-\\phi)}{\\sqrt{2} \\cdot \\sqrt{2 \\sin ^2\\left(\\frac{\\theta-\\phi}{2}\\right)}}\\right|{/tex}</span><br />
<span class="math-tex">{tex}[\\because 1-\\cos x=2 \\sin ^2 \\frac{x}{2}{/tex}</span>,&nbsp;<span class="math-tex">{tex} \\sin x=2 \\sin \\frac{x}{2} \\cos \\frac{x}{2}]{/tex}</span><br />
<span class="math-tex">{tex}=\\left|\\frac{2 \\sin \\left(\\frac{\\theta-\\phi}{2}\\right) \\cdot \\cos \\left(\\frac{\\theta-\\phi}{2}\\right)}{\\sqrt{2} \\sqrt{2} \\cdot \\sin \\left(\\frac{\\theta-\\phi}{2}\\right)}\\right|{/tex}</span><br />
<span class="math-tex">{tex}=\\left|\\cos \\left(\\frac{\\theta-\\phi}{2}\\right)\\right|{/tex}</span><br />
<span class="math-tex">{tex}=\\left|\\cos \\left(\\frac{\\theta-\\phi}{2}\\right)\\right|{/tex}</span><br />
Hence, the required perpendicular distance is&nbsp;<span class="math-tex">{tex}\\left|\\cos \\left(\\frac{\\theta-\\phi}{2}\\right)\\right|{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the equation of the line parallel to y-axis and drawn through the point of intersection of the lines x - 7y + 5 = 0 and 3x + y = 0</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Point of intersection of lines x - 7y + 5 = 0 and 3x + y = 0 obtained by solving these equations has coordinates.<br />
<span class="math-tex">{tex}\\therefore x = \\frac{{ - 5}}{{22}}{/tex}</span>&nbsp;and <span class="math-tex">{tex}y = \\frac{{15}}{{22}}{/tex}</span>.<br />
Since the required line is parallel to y-axis, so the equation of required line is<br />
<span class="math-tex">{tex}x = \\frac{{ - 5}}{{22}}{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find the equation of a line drawn perpendicular to the line&nbsp;<span class="math-tex">{tex}\\frac{x}{4}+\\frac{y}{6}=1{/tex}</span>&nbsp;through the point where it meets the Y-axis.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given equation of line is<br />
<span class="math-tex">{tex}\\frac{x}{4}+\\frac{y}{6}=1 \\Rightarrow \\frac{3 x+2y}{12}=1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;3x + 2y = 12 ...(i)<br />
If line (i) meet the Y-axis, then put x = 0 in Eq. (i), we get<br />
0 + 2y = 12&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;y = 6<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>Point is (0, 6).<br />
Slope of line (i) is,&nbsp;<span class="math-tex">{tex}m_{1}=\\frac{-3}{2}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of line perpendicular to line (i) is,<br />
<span class="math-tex">{tex}m_{2}=-\\frac{1}{m_{1}}=\\frac{-1}{(-3 / 2)}=\\frac{2}{3}{/tex}</span><br />
Now, equation of line having slope&nbsp;<span class="math-tex">{tex}\\frac{2}{3}{/tex}</span>&nbsp;and passing through (0, 6) is given by<br />
y - y<sub>1 </sub>= m(x - x<sub>1</sub>)<br />
<span class="math-tex">{tex}\\Rightarrow \\quad y-6=\\frac{2}{3}(x-0){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;3y - 18 = 2x<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2x - 3y + 18 = 0<br />
which is required equation of line.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the area of the triangle formed by the lines y - x = 0, x + y = 0 and x - k = 0.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of lines are<br />
y - x = 0 &hellip;..(i)<br />
x + y = 0&hellip;..(ii)<br />
x -k = 0 &hellip;.(iii)<br />
By solving (i) and (ii), we get the coordinates of point C.<br />
<span class="math-tex">{tex}\\therefore {/tex}</span>&nbsp;Coordinate of C are (0, 0).<br />
By solving (ii) and (iii), we get the coordinates of point A.<br />
<span class="math-tex">{tex}\\therefore {/tex}</span>&nbsp;Coordinate of A are (k, -k).<br />
By solving (i) and (iii), we get the coordinates of point B.<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_10/image143.png" style="height: 123px; width: 120px;" /><br />
<span class="math-tex">{tex}\\therefore {/tex}</span>&nbsp;coordinates of B are (k, k)<br />
<span class="math-tex">{tex}\\therefore {/tex}</span>&nbsp;Area of <span class="math-tex">{tex}\\Delta ABC = \\frac{1}{2}\\left| {\\begin{array}{*{20}{c}} k&amp;{ - k}&amp;1 \\\\ k&amp;k&amp;1 \\\\ 0&amp;0&amp;1 \\end{array}} \\right|{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{1}{2}\\left[ {({k^2} + {k^2} + (0 - 0) + (0 - 0)} \\right]{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{1}{2} \\times 2{k^2}{/tex}</span><br />
= k<sup>2</sup> sq. unit</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the value of p so that the three lines 3x + y - 2 = 0, px + 2y - 3 = 0 and 2x - y - 3 = 0 may intersect at one point.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of lines are<br />
3x + y - 2 = 0, px + 2y - 3 = 0 and 2x - y - 3 = 0.<br />
We know that three lines are concurrent if<br />
<span class="math-tex">{tex}{a_3}({b_1}{c_2} - {b_2}{c_1}) + {b_3}({c_1}{a_2} - {c_2}{a_1}){/tex}</span><span class="math-tex">{tex} + {c_3}({a_1}{b_2} - {a_2}{b_1}) = 0{/tex}</span><br />
<span class="math-tex">{tex}\\therefore 2[1 \\times ( - 3) - 2 \\times ( - 2)] + ( - 1)[ - 2{/tex}</span>&nbsp;<span class="math-tex">{tex} \\times p - ( - 3) \\times 3] + ( - 3)[3 \\times 2 - p \\times 1] = 0{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 2[ - 3 + 4] - 1[ - 2p + 9] - 3[6 - p] = 0{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 2 + 2p - 9 - 18 + 3p = 0{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 5p - 25 = 0 \\Rightarrow p = 5{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>If three lines whose equations are y = m<sub>1</sub>x + c<sub>1</sub>y = m<sub>2</sub>x + c<sub>2</sub>&nbsp;and y = m<sub>3</sub>x + c<sub>3</sub> are concurrent, then show that m<sub>1</sub>(c<sub>2</sub> - c<sub>3</sub>) + m<sub>2</sub>(c<sub>3</sub> - c<sub>1</sub>) + m<sub>3</sub> (c<sub>1</sub> - c<sub>2</sub>) = 0.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>i.e. -m<sub>1</sub>x + y - c<sub>1</sub> = 0 - m<sub>2</sub>x + y - c<sub>2</sub> = 0 and -m<sub>3</sub>x + y - c<sub>3</sub>= 0<br />
We know that three lines are concurrent if<br />
<span class="math-tex">{tex}\\left| {\\begin{array}{*{20}{c}}
  { - {m_1}}&amp;1&amp;{ - {c_1}} \\\\ 
  { - {m_2}}&amp;1&amp;{ - {c_2}} \\\\ 
  { - {m_3}}&amp;1&amp;{ - {c_3}} 
\\end{array}} \\right| = 0{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow  - {m_1}[ - {c_3} + {c_2}] + {m_2}[{c_3} - {c_1}]{/tex}</span><span class="math-tex">{tex} - {m_3}[ - {c_2} + {c_1}] = 0{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow {m_1}({c_2} - {c_3}) + {m_2}({c_3} - {c_1}){/tex}</span><span class="math-tex">{tex} + {m_3}({c_1} - {c_2}) = 0{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Find the equation of the lines through the point (3, 2) which make an angle of 45&deg; with the line x - 2y = 3.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let m be the slope of required line which passes through point (3, 2). Then equation of required line is<br />
y - 2 = m (x - 3). . . (i)<br />
The equation of given line is x - 2y = 3<br />
<span class="math-tex">{tex}\\Rightarrow y = \\frac{x}{2} - \\frac{3}{2}{/tex}</span>. . . (ii)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Slope of given line is <span class="math-tex">{tex}\\frac{1}{2}{/tex}</span>.<br />
It is given that lines (i) and (ii) make an angle of 45&deg;<br />
<span class="math-tex">{tex}\\therefore \\tan 45^\\circ = \\left| {\\frac{{m - \\frac{1}{2}}}{{1 + \\frac{m}{2}}}} \\right| \\Rightarrow 1 = \\left| {\\frac{{2m - 1}}{{2 + m}}} \\right|{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\frac{{2m - 1}}{{2 + m}} = \\pm 1{/tex}</span><br />
When <span class="math-tex">{tex}\\frac{{2m - 1}}{{2 + m}} = 1 \\Rightarrow{/tex}</span> 2m - 1 = 2 + m&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> m = 3<br />
Then equation of required line is y - 2 = 3(x - 3).<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> y - 2 = 3x - 9 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 3x - y - 7 = 0<br />
When <span class="math-tex">{tex}\\frac{{2m - 1}}{{2 + m}} = - 1 \\Rightarrow{/tex}</span> 2m - 1 = - 2 - m <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 3m = -1<br />
<span class="math-tex">{tex}\\Rightarrow m = \\frac{{ - 1}}{3}{/tex}</span><br />
Then equation of required line is <span class="math-tex">{tex}y - 2 = \\frac{{ - 1}}{3}(x - 3){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 3y - 6 = -x + 3 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> x + 3y - 9 = 0</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Find the equation of the line passing through the point of intersection of the lines 4x + 7y - 3 = 0 and 2x - 3y + 1 = 0 that has equal intercepts on the axis.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given lines are 4x + 7y - 3 = 0 and 2x - 3y + 1 = 0.<br />
Now the equation of any line through intersection of these lines is<br />
4x + 7y - 3 + k(2x - 3y + 1) = 0. . . (i)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> (1 + 2k)x + (7 - 3k)y = 3 - k<br />
<span class="math-tex">{tex}\\Rightarrow \\frac{{(4 + 2k)x}}{{3 - k}} + \\frac{{(7 - 3k)y}}{{3 - k}} = 1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\frac{x}{{\\frac{{3 - k}}{{4 - 2k}}}} + \\frac{y}{{\\frac{{3 - k}}{{7 - 3k}}}} = 1{/tex}</span><br />
It is given that <span class="math-tex">{tex}\\frac{{3 - k}}{{4 + 2k}} = \\frac{{3 - k}}{{7 - 3k}}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow (3 - k)\\left[ {\\frac{1}{{4 + 2k}} - \\frac{1}{{7 - 3k}}} \\right] = 0{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 3 - k = 0 and <span class="math-tex">{tex}\\frac{1}{{4 + 2k}} - \\frac{1}{{7 - 3k}} = 0{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 3 = k or 7 - 3k - 4 - 2k = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;k =3 or -5k = - 3<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;k = 3 or <span class="math-tex">{tex}k = \\frac{3}{5}{/tex}</span><br />
Putting k = 3 in (i) , we have<br />
4x + 7y - 3 + 3(2x - 3y + 1) = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 4x + 7y - 3 + 6x - 9y + 3 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 10x - 2y = 0 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 5x - y = 0<br />
Putting&nbsp;<span class="math-tex">{tex}k = \\frac{3}{5}{/tex}</span> in (i), we have<br />
<span class="math-tex">{tex}4x + 7y - 3 + \\frac{3}{5}(2x - 3y + 1) = 0{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 20x + 35y - 15 + 6x - 9y + 3 = 0.<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 26x + 26y - 12 = 0 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 13x + 13y - 6 = 0.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Show that the equation of the line passing through the origin and making an angle&nbsp;<span class="math-tex">{tex}\\theta{/tex}</span> with the line y = mx + c is <span class="math-tex">{tex}\\frac{y}{x} = \\frac{{m \\pm \\tan \\theta }}{{1 \\mp m\\tan \\theta }}{/tex}</span>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let m<sub>1</sub> be the slope of required line which passes through (0, 0).<br />
Then equation of line is y - 0 = m<sub>1</sub> (x - 0)&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> y = m<sub>1</sub>x<br />
Now&nbsp;<span class="math-tex">{tex}\\theta{/tex}</span> is the angle between y = mx + c and y = m<sub>1</sub>x<br />
<span class="math-tex">{tex}\\therefore \\tan \\theta = \\left| {\\frac{{{m_1} - m}}{{1 + {m_1}m}}} \\right| \\Rightarrow \\tan \\theta = \\pm \\frac{{{m_1} - m}}{{1 + {m_1}m}}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\tan \\theta = \\frac{{{m_1} - m}}{{1 + {m_1}m}}{\\text{or}}\\tan \\theta = - \\frac{{{m_1} - m}}{{1 + {m_1}m}}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\tan \\theta + {m_1}m\\tan \\theta = {m_1} - m{/tex}</span> or <span class="math-tex">{tex}\\tan \\theta + {m_1}m\\tan \\theta = m - {m_1}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow {m_1}(1 - m\\tan \\theta ) = m + \\tan \\theta {/tex}</span> or <span class="math-tex">{tex}{m_1}(1 + m\\tan \\theta ) = m - \\tan \\theta{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow {m_1} = \\frac{{m + \\tan \\theta }}{{1 - m\\tan \\theta }}{\\text{or }}{m_1} = \\frac{{m - \\tan \\theta }}{{1 + m\\tan \\theta }}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow {m_1} = \\frac{{m \\pm \\tan \\theta }}{{1 \\mp m\\tan \\theta }}{/tex}</span><br />
Putting value of m<sub>1</sub> in (i), we have<br />
<span class="math-tex">{tex}y = \\pm \\frac{{m + \\tan \\theta }}{{1 - m\\tan \\theta }} \\cdot x{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\frac{y}{x} = \\frac{{m \\pm \\tan \\theta }}{{1 \\mp m\\tan \\theta }}{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>In what ratio, the line joining (-1, 1) and (5, 7) is divided by the line x + y = 4?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The equation of given line is x + y - 4 = 0<br />
Let the given line divide the line joining A (-1, 1) and B (5, 7) in the ratio k : 1 at point. Then coordinates of C are<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_10/image324.png" style="width: 200px; height: 103px;" /><br />
<span class="math-tex">{tex}\\left[ {\\frac{{5k - 1}}{{k + 1}},\\frac{{7k + 1}}{{k + 1}}} \\right]{/tex}</span><br />
Since the point, c lies on the given line<br />
<span class="math-tex">{tex}\\therefore \\frac{{5k - 1}}{{k + 1}} + \\frac{{7k + 1}}{{k + 1}} - 4 = 0{/tex}</span> <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 5k - 1 + 7k + 1 - 4k - 4 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;8k = 4 <span class="math-tex">{tex}\\Rightarrow k = \\frac{1}{2}{/tex}</span><br />
The required ratio is <span class="math-tex">{tex}\\frac{1}{2}:1{/tex}</span> i.e. 1 : 2</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>In what ratio is the line joining A (-1, 1) and B(5, 7) divided by the line x + y = 4?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let the given line divide AB in the ratio m : 1.<br />
Then, we have hehe point of division is C&nbsp;<span class="math-tex">{tex}\\left(\\frac{5 m-1}{m+1}, \\frac{7 m+1}{m+1}\\right){/tex}</span><br />
This point C must lie on the line x + y = 4<br />
<span class="math-tex">{tex}\\therefore \\quad \\frac{5 m-1}{m+1}+\\frac{7 m+1}{m+1}=4 \\Leftrightarrow{/tex}</span>&nbsp;(5m -1 ) + (7m + 1) = 4(m + 1)<br />
<span class="math-tex">{tex}\\Leftrightarrow 8 m=4 \\Leftrightarrow m=\\frac{1}{2}{/tex}</span><br />
Therefore, the required ratio is&nbsp;<span class="math-tex">{tex}\\frac{1}{2}{/tex}</span>&nbsp;: 1, i.e., 1: 2.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>Find the distance of the line 4x + 7y + 5 = 0 from the point (1, 2) along the line 2x - y = 0</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have to find the distance between point (1, 2) and point of intersection of lines 4x + 7 y + 5 = 0 and 2x - y = 0<br />
Now the point of intersection of lines 4x + 7 y + 5 = 0 and 2x - y = 0 is obtained by solving these equations.<br />
<span class="math-tex">{tex}\\therefore x = \\frac{{ - 5}}{{18}}{/tex}</span> and <span class="math-tex">{tex}y = \\frac{{ - 5}}{9}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Distance between point (1, 2) and <span class="math-tex">{tex}\\left( {\\frac{{ - 5}}{{18}},\\frac{{ - 5}}{9}} \\right){/tex}</span> is<br />
<span class="math-tex">{tex}\\sqrt {{{\\left( {1 + \\frac{5}{{18}}} \\right)}^2} + {{\\left( {2 + \\frac{5}{9}} \\right)}^2}} = \\sqrt {{{\\left( {\\frac{{23}}{{18}}} \\right)}^2} + {{\\left( {\\frac{{23}}{9}} \\right)}^2}}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{23}}{{18}}\\sqrt {{{(1)}^2} + {{(2)}^2}} = \\frac{{23}}{{18}}\\sqrt 5{/tex}</span> units.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 15</span></div><div class="question-text"><p>Find the direction in which a straight line must be drawn through the point (-1, 2) so that its point of intersection with the line x + y = 4 may be at a distance of 3 units from this point.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let the required line makes an angle&nbsp;<span class="math-tex">{tex}\\theta{/tex}</span> with the positive direction of x-axis. Then equation of line is<br />
<span class="math-tex">{tex}\\frac{{x - ( - 1)}}{{\\cos \\theta }} = \\frac{{y - 2}}{{\\sin \\theta }} = r \\Rightarrow \\frac{{x + 1}}{{\\cos \\theta }} = \\frac{{y - 2}}{{\\sin \\theta }} = r{/tex}</span><br />
It is given that r = 3<br />
<span class="math-tex">{tex}\\therefore \\frac{{x + 1}}{{\\cos \\theta }} = \\frac{{y - 2}}{{\\sin \\theta }} = 3{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> x + 1 = 3 cos <span class="math-tex">{tex}\\theta{/tex}</span> <span class="math-tex">{tex}\\Rightarrow{/tex}</span> x = 3 cos <span class="math-tex">{tex}\\theta{/tex}</span> - 1<br />
and y - 2 = 3 sin <span class="math-tex">{tex}\\theta{/tex}</span> <span class="math-tex">{tex}\\Rightarrow{/tex}</span> y = 3 sin <span class="math-tex">{tex}\\theta{/tex}</span> + 2<br />
Since this point on the line x + y = 4<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> 3 cos<span class="math-tex">{tex}\\theta{/tex}</span> - 1 + 3sin<span class="math-tex">{tex}\\theta{/tex}</span> + 2 = 4<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> 3 cos<span class="math-tex">{tex}\\theta{/tex}</span> + 3sin<span class="math-tex">{tex}\\theta{/tex}</span> = 3 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> cos<span class="math-tex">{tex}\\theta{/tex}</span> + sin<span class="math-tex">{tex}\\theta{/tex}</span> = 1<br />
Squaring both sides, we have<br />
cos<sup>2</sup><span class="math-tex">{tex}\\theta{/tex}</span> +sin<sup>2</sup><span class="math-tex">{tex}\\theta{/tex}</span> + 2 sin<span class="math-tex">{tex}\\theta{/tex}</span> cos<span class="math-tex">{tex}\\theta{/tex}</span> = 1<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 1 + sin 2 <span class="math-tex">{tex}\\theta{/tex}</span> = 1 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> sin 2<span class="math-tex">{tex}\\theta{/tex}</span> = 0 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> 2<span class="math-tex">{tex}\\theta{/tex}</span> = 0 <span class="math-tex">{tex}\\Rightarrow{/tex}</span> <span class="math-tex">{tex}\\theta{/tex}</span> = 0<br />
Which shows that required line is parallel to x-axis .</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 16</span></div><div class="question-text"><p>The hypotenuse of a right angled triangle has its ends at the points (1, 3) and (&ndash;4, 1). Find an equation of the legs (perpendicular sides) of the triangle which are parallel to the axes.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>First we plot the points A(1, 3) and B (-4, 1) in the XY-plane. From the point A(1, 3), we draw a line parallel to Y-axis. And the point B(-4, 1), we draw a line parallel to X-axis. The point of intersection of two lines is on C, which is right angled at C.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;The coordinate of C will be (1, 1)<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Equation of line AC passing through A(1, 3) and C(1, 1) is<br />
<img alt="" data-imgur-src="cCTkNqf.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/cCTkNqf.png" style="width: 309px; height: 228px;" /><br />
<span class="math-tex">{tex}y-y_{1}=\\frac{y_{2}-y_{1}}{x_{2}-x_{1}}\\left(x-x_{1}\\right){/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\quad y-3=\\frac{1-3}{1-1}(x-1){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\quad y-3=\\frac{-2}{0}(x-1) \\Rightarrow x=1{/tex}</span><br />
Equation of line BC is<br />
<span class="math-tex">{tex}y-1=\\frac{1-1}{1+4}(x-1){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\quad y-1=\\frac{0}{1+4}(x-1){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;y - 1 = 0&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;y = 1<br />
Hence, the legs of a triangle are x = 1 and y = 1.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 17</span></div><div class="question-text"><p>Find the image of the point (3, 8) with respect to the line x + 3y = 7 assuming the line to be a plane mirror.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let the image of the point A(3, 8) in the line mirror DE be <span class="math-tex">{tex}C(\\alpha ,\\beta ){/tex}</span>. Then AC is perpendicular bisector of DE.<br />
The coordinates of point B are <span class="math-tex">{tex}\\left( {\\frac{{\\alpha + 3}}{2},\\frac{{\\beta + 8}}{2}} \\right){/tex}</span>.<br />
Since point B lies on the line x + 3y = 7.<br />
<span class="math-tex">{tex}\\therefore \\frac{{\\alpha + 3}}{2} + \\frac{{3(\\beta + 8)}}{2} = 7 \\Rightarrow{/tex}</span><span class="math-tex">{tex}\\alpha + 3 + 3\\beta + 24 = 14{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\alpha + 3\\beta + 13 = 0{/tex}</span>....... (i)<br />
Since AC is perpendicular on DE,<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_10/image384.png" style="width: 110px; height: 115px;" /><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Slope of AC&nbsp;<span class="math-tex">{tex} \\times{/tex}</span> Slope of DE = -1<br />
<span class="math-tex">{tex}\\Rightarrow \\frac{{\\beta - 8}}{{\\alpha - 3}} \\times \\frac{{ - 1}}{3} = - 1 \\Rightarrow \\beta - 8 = 3\\alpha - 9{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow 3\\alpha - \\beta - 1 = 0{/tex}</span>. . . (ii)<br />
Solving (i) and (ii) we get<br />
<span class="math-tex">{tex}\\alpha = - 1 ,\\beta=-4{/tex}</span><br />
Thus image of point (3, 8) is (-1, -4)</p></div></div></div>
`;

export default { EXAMPLES_HTML, EX9_1_HTML, EX9_2_HTML, EX9_3_HTML, MISC_HTML };