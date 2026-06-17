// sequencesSeriesContent.js
// NCERT Solutions — Class 11 Mathematics, Chapter 8: Sequences and Series.
//   EXAMPLES_HTML (20) | EX8_1_HTML (14) | EX8_2_HTML (20; PARTIAL 20/34) | MISC_HTML (19)
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

export const EX8_1_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Write the first five terms of&nbsp;the sequence whose n<sup>th</sup> term is a<sub>n</sub> = n (n + 2)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: a<sub>n</sub> =&nbsp;n(n + 2)<br />
Putting n = 1, 2, 3, 4 and 5, we get,<br />
<span class="math-tex">{tex}a _ { 1 } = 1 ( 1 + 2 ) = 1 \\times 3 = 3{/tex}</span><br />
<span class="math-tex">{tex}a _ { 2 } = 2 ( 2 + 2 ) = 2 \\times 4 = 8{/tex}</span><br />
<span class="math-tex">{tex}a _ { 3 } = 3 ( 3 + 2 ) = 3 \\times 5 = 15{/tex}</span><br />
<span class="math-tex">{tex}a _ { 4 } = 4 ( 4 + 2 ) = 4 \\times 6 = 24{/tex}</span><br />
<span class="math-tex">{tex}a _ { 5 } = 5 ( 5 + 2 ) = 5 \\times 7 = 35{/tex}</span><br />
Therefore, the first five terms are 3, 8, 15, 24 and 35.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Write the first five terms of&nbsp;the sequence whose n<sup>th</sup> term is&nbsp;<span class="math-tex">{tex}a _ { n } = \\frac { n } { n + 1 }{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: <span class="math-tex">{tex}a _ { n } = \\frac { n } { n + 1 }{/tex}</span></p>

<p>Putting n = 1, 2, 3, 4&nbsp;and 5, we get,</p>

<p><span class="math-tex">{tex}a _ { 1 } = \\frac { 1 } { 1 + 1 } = \\frac { 1 } { 2 }{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 2 } = \\frac { 2 } { 2 + 1 } = \\frac { 2 } { 3 }{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 3 } = \\frac { 3 } { 3 + 1 } = \\frac { 3 } { 4 }{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 4 } = \\frac { 4 } { 4 + 1 } = \\frac { 4 } { 5 }{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 5 } = \\frac { 5 } { 5 + 1 } = \\frac { 5 } { 6 }{/tex}</span></p>

<p>Therefore, the first five terms are <span class="math-tex">{tex}\\frac { 1 } { 2 } , \\frac { 2 } { 3 } , \\frac { 3 } { 4 } , \\frac { 4 } { 5 }{/tex}</span>&nbsp;and <span class="math-tex">{tex}\\frac { 5 } { 6 }.{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Write the first five terms of the sequence whose n<sup>th</sup> term is a<sub>n</sub> = 2<sup>n</sup></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: a<sub>n</sub> = 2<sup>n</sup></p>

<p>Putting n = 1, 2, 3, 4&nbsp;&nbsp;and 5, we get,</p>

<p>a<sub>1</sub> = 2<sup>1</sup> = 2</p>

<p>a<sub>2</sub> = 2<sup>2</sup> = 4</p>

<p>a<sub>3</sub> = 2<sup>3</sup> = 8</p>

<p>a<sub>4</sub> = 2<sup>4</sup> = 16</p>

<p>a<sub>5</sub> = 2<sup>5</sup> = 32</p>

<p>Therefore, the first five terms are 2, 4, 8, 16 and 32.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Write the first five terms of&nbsp;the sequence whose n<sup>th</sup> term is&nbsp;<span class="math-tex">{tex}a _ { n } = \\frac { 2 n - 3 } { 6 }{/tex}</span>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: <span class="math-tex">{tex}a _ { n } = \\frac { 2 n - 3 } { 6 }{/tex}</span></p>

<p>Putting n = 1, 2, 3, 4&nbsp;and 5, we get,</p>

<p><span class="math-tex">{tex}a _ { 1 } = \\frac { 2 \\times 1 - 3 } { 6 } = \\frac { 2 - 3 } { 6 } = \\frac { - 1 } { 6 }{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 2 } = \\frac { 2 \\times 2 - 3 } { 6 } = \\frac { 4 - 3 } { 6 } = \\frac { 1 } { 6 }{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 3 } = \\frac { 2 \\times 3 - 3 } { 6 } = \\frac { 6 - 3 } { 6 } = \\frac { 3 } { 6 } = \\frac { 1 } { 2 }{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 4 } = \\frac { 2 \\times 4 - 3 } { 6 } = \\frac { 8 - 3 } { 6 } = \\frac { 5 } { 6 }{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 5 } = \\frac { 2 \\times 5 - 3 } { 6 } = \\frac { 10 - 3 } { 6 } = \\frac { 7 } { 6 }{/tex}</span></p>

<p>Therefore, the first five terms are <span class="math-tex">{tex}\\frac { - 1 } { 6 } , \\frac { 1 } { 6 } , \\frac { 1 } { 2 } , \\frac { 5 } { 6 }{/tex}</span>&nbsp;and <span class="math-tex">{tex}\\frac { 7 } { 6 }.{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Write the first five terms of&nbsp;the sequence whose n<sup>th</sup> term is&nbsp;<span class="math-tex">{tex}a _ { n } = ( - 1 ) ^ { n - 1 } \\cdot 5 ^ { n + 1 }{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: <span class="math-tex">{tex}a _ { n } = ( - 1 ) ^ { n - 1 } \\cdot 5 ^ { n + 1 }{/tex}</span></p>

<p>Putting n = 1, 2, 3, 4&nbsp;&nbsp;and 5, we get,</p>

<p><span class="math-tex">{tex}a _ { 1 } = ( - 1 ) ^ { 1 - 1 } \\cdot 5 ^ { 1 + 1 } = ( - 1 ) ^ { 0 } \\cdot 5 ^ { 2 } = 1 \\times 25 = 25{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 2 } = ( - 1 ) ^ { 2 - 1 } 5 ^ { 2 + 1 } = ( - 1 ) ^ { 1 } \\cdot 5 ^ { 3 } = - 1 \\times 125 = - 125{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 3 } = ( - 1 ) ^ { 3 - 1 } \\cdot 5 ^ { 3 + 1 } = ( - 1 ) ^ { 2 } \\cdot 5 ^ { 4 } = 1 \\times 625 = 625{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 4 } = ( - 1 ) ^ { 4 - 1 } \\cdot 5 ^ { 4 + 1 } = ( - 1 ) ^ { 3 } \\cdot 5 ^ { 5 } = - 1 \\times 3125 = - 3125{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 5 } = ( - 1 ) ^ { 5 - 1 } \\cdot 5 ^ { 5 + 1 } = ( - 1 ) ^ { 4 } \\cdot 5 ^ { 6 } = 1 \\times 15625 = 15625{/tex}</span></p>

<p>Therefore, the first five terms are 25, -125, 625, -3125&nbsp;&nbsp;and 15625.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Write the first five terms of the sequence whose n<sup>th</sup> term is&nbsp;<span class="math-tex">{tex}a _ { n } = n . \\frac { n ^ { 2 } + 5 } { 4 }{/tex}</span> .</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given:&nbsp;<span class="math-tex">{tex}a_{n}=n \\cdot \\frac{n^{2}+5}{4}{/tex}</span><br />
Putting n = 1,2,3,4&nbsp;and 5, we get,<br />
<span class="math-tex">{tex}a_{1}=1 \\frac{1^{2}+5}{4}{/tex}</span><span class="math-tex">{tex}=1 . \\frac{1+5}{4}=\\frac{6}{4}=\\frac{3}{2}{/tex}</span><br />
<span class="math-tex">{tex}a_{2}=2 \\cdot \\frac{2^{2}+5}{4}{/tex}</span><span class="math-tex">{tex}=2 . \\frac{4+5}{4}=\\frac{18}{4}=\\frac{9}{2}{/tex}</span><br />
<span class="math-tex">{tex}a_{3}=3 . \\frac{3^{2}+5}{4}{/tex}</span><span class="math-tex">{tex}=3 . \\frac{9+5}{4}=3 \\times \\frac{14}{4}{/tex}</span><span class="math-tex">{tex}=\\frac{42}{4}=\\frac{21}{2}{/tex}</span><br />
<span class="math-tex">{tex}a_{4}=4 \\cdot \\frac{4^{2}+5}{4}{/tex}</span><span class="math-tex">{tex}=4 . \\frac{16+5}{4}=\\frac{84}{4}{/tex}</span>&nbsp;= 21<br />
<span class="math-tex">{tex}a_{5}=5 \\cdot \\frac{5^{2}+5}{4}{/tex}</span><span class="math-tex">{tex}=5 . \\frac{25+5}{4}=5 \\times \\frac{30}{4}{/tex}</span><span class="math-tex">{tex}=\\frac{150}{4}=\\frac{75}{2}{/tex}</span><br />
Therefore, the first five terms are <span class="math-tex">{tex}\\frac{3}{2}, \\frac{9}{2}, \\frac{21}{2}{/tex}</span>, 21 and&nbsp;<span class="math-tex">{tex}\\frac{75}{2}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the indicated terms of the sequence, whose n<sup>th&nbsp;</sup>term is a<sub>n</sub>&nbsp;= 4n - 3;&nbsp;a<sub>17</sub>,&nbsp;a<sub>24</sub>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have, a<sub>n</sub>&nbsp;= 4n - 3<br />
On putting n = 17, we get<br />
a<sub>17</sub>&nbsp;= 4&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;17 - 3 = 68 - 3 = 65<br />
On putting n = 24, we get<br />
a<sub>24</sub>&nbsp;= 4&nbsp;<span class="math-tex">{tex}\\times{/tex}</span> 24 - 3 = 96 - 3 = 93</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the indicated terms of the sequence, whose n<sup>th</sup>&nbsp;term is&nbsp;<span class="math-tex">{tex}a _ { n } = \\frac { n ^ { 2 } } { 2 ^ { n } }{/tex}</span>;&nbsp;a<sub>7</sub></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: <span class="math-tex">{tex}a _ { n } = \\frac { n ^ { 2 } } { 2 ^ { n } }{/tex}</span><br />
<span class="math-tex">{tex}\\therefore a _ { 7 } = \\frac { 7 ^ { 2 } } { 2 ^ { 7 } } = \\frac { 49 } { 128 }{/tex}</span><br />
Therefore, 7<sup>th</sup> term is <span class="math-tex">{tex}\\frac { 49 } { 128 }.{/tex}</span></p>

</div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the indicated terms of the sequence, whose n<sup>th</sup>&nbsp;term is&nbsp;<span class="math-tex">{tex}a _ { n } = ( - 1 ) ^ { n - 1 } n ^ { 3 }{/tex}</span>; a<sub>9</sub></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: a<sub>n</sub> = (-1)<sup>n-1</sup> n<sup>3</sup></p>

<p><span class="math-tex">{tex}\\therefore a _ { 9 } = ( - 1 ) ^ { 9 - 1 } \\times ( 9 ) ^ { 3 } = ( - 1 ) ^ { 8 } \\times 729 = 729{/tex}</span></p>

<p>Therefore, 9<sup>th</sup> term is 729.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Find the indicated terms of the sequence, whose n<sup>th</sup> term is&nbsp;<span class="math-tex">{tex}a _ { n } = \\frac { n ( n - 2 ) } { n + 3 }{/tex}</span>; a<sub>20</sub></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given:&nbsp;<span class="math-tex">{tex}a_{n}=\\frac{n(n-2)}{n+3}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore a_{20}=\\frac{20(20-2)}{20+3}{/tex}</span><span class="math-tex">{tex}=\\frac{20 \\times 18}{23}=\\frac{360}{23}{/tex}</span><br />
Therefore, 20<sup>th</sup> term is <span class="math-tex">{tex}\\frac{360}{23}{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Write the first five terms of the sequence and obtain the corresponding series&nbsp;a<sub>1</sub> = 3, a<sub>n</sub> = 3a<sub>n-1</sub> + 2&nbsp;for all n &gt; 1</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: a<sub>1</sub> = 3, a<sub>n-1</sub>&nbsp;+ 2&nbsp;for all n &gt; 1</p>

<p>Putting n = 2, 3, 4&nbsp;and 5, we get</p>

<p>a<sub>2</sub> = 3a<sub>2-1</sub> + 2 = 3a<sub>2-1</sub> + 2 = 3a<sub>1</sub> + 2 = 3&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;3 + 2 = 9 + 2 = 11</p>

<p>a<sub>3</sub> = 3a<sub>3-1</sub> + 2 = 3a<sub>2</sub> + 2 = 3&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;11 + 2 = 33 + 2 = 35</p>

<p>a<sub>4</sub> = 3a<sub>4-1</sub> + 2 = 3a<sub>3</sub> + 2 = 3&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;35 + 2 = 105 + 2 = 107</p>

<p>a<sub>5</sub>&nbsp; 3a<sub>5-1</sub> + 2 = 3a<sub>4</sub> + 2 = 3&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;107 + 2 = 321 + 2 = 323</p>

<p>Hence the first five terms are 3,11,35,107,323.</p>

<p>Therefore, corresponding series is 3 + 11 + 35 + 107 + 323 + &hellip;&hellip;&hellip;.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Write the first five terms of the sequence and obtain the corresponding series&nbsp;a<sub>1</sub> = -1,&nbsp;<span class="math-tex">{tex}a _ { n } = \\frac { a _ { n - 1 } } { n } , n \\geq 2{/tex}</span></p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: a<sub>1</sub> = -1,&nbsp;<span class="math-tex">{tex}a _ { n } = \\frac { a _ { n - 1 } } { n } , n \\geq 2{/tex}</span></p>

<p>Putting n = 2, 3, 4&nbsp;and 5, we get</p>

<p><span class="math-tex">{tex}a _ { 2 } = \\frac { a _ { 2 - 1 } } { 2 } = \\frac { a _ { 1 } } { 2 } = \\frac { - 1 } { 2 }{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 3 } = \\frac { a _ { 3 - 1 } } { 3 } = \\frac { a _ { 2 } } { 3 } = \\frac { - 1 / 2 } { 3 } = \\frac { - 1 } { 6 }{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 4 } = \\frac { a _ { 4 - 1 } } { 4 } = \\frac { a _ { 3 } } { 4 } = \\frac { - 1 / 6 } { 4 } = \\frac { - 1 } { 24 }{/tex}</span></p>

<p><span class="math-tex">{tex}a _ { 5 } = \\frac { a _ { 5 - 1 } } { 5 } = \\frac { a _ { 4 } } { 5 } = \\frac { - 1 / 24 } { 5 } = \\frac { - 1 } { 120 }{/tex}</span></p>

<p>Hence the first five terms are&nbsp;<span class="math-tex">{tex}- 1,{{ - 1} \\over 2},{{ - 1} \\over 6},{{ - 1} \\over {24}},{{ - 1} \\over {120}}{/tex}</span></p>

<p><span class="math-tex">{tex}\\therefore{/tex}</span> Corresponding series is&nbsp;<span class="math-tex">{tex}- 1 + \\left( {{{ - 1} \\over 2}} \\right) + \\left( {{{ - 1} \\over 6}} \\right) + \\left( {{{ - 1} \\over {24}}} \\right) + \\left( {{{ - 1} \\over {120}}} \\right).........{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>Write the first five terms of the sequence and obtain the corresponding series&nbsp;a<sub>1</sub> = a<sub>2</sub> = 2, a<sub>n</sub> = a<sub>n-1</sub> - 1, n &gt; 2.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: a<sub>1</sub> = a<sub>2</sub> = 2, a<sub>n</sub> = a<sub>n-1</sub> - 1, n &gt; 2<br />
Putting n = 3, 4&nbsp;and 5, we get<br />
a<sub>3</sub> = a<sub>3-1</sub> - 1 = a<sub>2</sub> <sub>- 1</sub> = 2 - 1 = 1<br />
a<sub>4</sub> = a<sub>4-1</sub> - 1 = a<sub>3</sub> <sub>- 1</sub>&nbsp;= 1 - 1 = 0&nbsp;<br />
a<sub>5</sub> = a<sub>5-1</sub> - 1 = a<sub>4</sub> <sub>- 1</sub>&nbsp;= 0 - 1 = -1<br />
Hence the first five terms are 2, 2, 1, 0, -1.<br />
Therefore, corresponding series is 2 + 2 + 1 + 0 + (-1) + .......</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>The Fibonacci sequence is defined by 1 = a<sub>1</sub>&nbsp;= a<sub>2</sub>&nbsp;and a<sub>n</sub>&nbsp;= a<sub>n-1&nbsp;</sub>+ a<sub>n-2</sub>, n &gt; 2. Find&nbsp;<span class="math-tex">{tex}\\frac { a _ { n + 1 } } { a _ { n } }{/tex}</span>, for n = 1, 2, 3, 4, 5.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given, 1 = a<sub>1</sub>&nbsp;= a<sub>2</sub><br />
and a<sub>n</sub>&nbsp;= a<sub>n-1</sub>&nbsp;+ a<sub>n-2</sub>, n &gt; 2<br />
On putting n = 3, 4, 5, 6 respectively, we get<br />
For n = 3, a<sub>3</sub>&nbsp;= a<sub>3-1</sub>&nbsp;+ a<sub>3-2&nbsp;</sub>= a<sub>2</sub>&nbsp;+ a<sub>1</sub>&nbsp;= 1 + 1 = 2<br />
For n = 4, a<sub>4&nbsp;</sub>= a<sub>4-1</sub>&nbsp;+ a<sub>4-2&nbsp;</sub>= a<sub>3</sub>&nbsp;+ a<sub>2&nbsp;</sub>= 2 + 1 = 3<br />
For n = 5, a<sub>5</sub>&nbsp;= a<sub>5-1</sub>&nbsp;+ a<sub>5-2&nbsp;</sub>= a<sub>4</sub>&nbsp;+ a<sub>3</sub>&nbsp;= 3 + 2 = 5<br />
For n = 6, a<sub>6</sub>&nbsp;= a<sub>6-1&nbsp;</sub>+ a<sub>6-2</sub>&nbsp;= a<sub>5&nbsp;</sub>+ a<sub>4</sub>&nbsp;= 5 + 3 = 8<br />
Now,&nbsp;<span class="math-tex">{tex}\\frac { a _ { n + 1 } } { a _ { n } }{/tex}</span>, for n = 1, 2, 3, 4, 5.<br />
For n = 1,&nbsp;<span class="math-tex">{tex}\\frac { a _ { 2 } } { a _ { 1 } } = \\frac { 1 } { 1 }{/tex}</span>&nbsp;= 1<br />
For n = 2,&nbsp;<span class="math-tex">{tex}\\frac { a _ { 3 } } { a _ { 2 } } = \\frac { 2 } { 1 }{/tex}</span>&nbsp;= 2<br />
For n = 3,&nbsp;<span class="math-tex">{tex}\\frac { a _ { 4 } } { a _ { 3 } } = \\frac { 3 } { 2 }{/tex}</span><br />
For n = 4,&nbsp;<span class="math-tex">{tex}\\frac { a _ { 5 } } { a _ { 4 } } = \\frac { 5 } { 3 }{/tex}</span><br />
For n = 5,&nbsp;<span class="math-tex">{tex}\\frac { a _ { 6 } } { a _ { 5 } } = \\frac { 8 } { 5 }{/tex}</span><br />
Hence, the terms are 1, 2,&nbsp;<span class="math-tex">{tex}\\frac { 3 } { 2 } , \\frac { 5 } { 3 }{/tex}</span>&nbsp;and&nbsp;<span class="math-tex">{tex}\\frac { 8 } { 5 }{/tex}</span></p></div></div></div>
`;

export const EX8_2_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Find the 20<sup>th</sup> and n<sup>th&nbsp;</sup>terms of the G.P.&nbsp;<span class="math-tex">{tex}\\frac { 5 } { 2 } , \\frac { 5 } { 4 } , \\frac { 5 } { 8 }{/tex}</span> .......</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here, a =<span class="math-tex">{tex}\\frac 52{/tex}</span>&nbsp;and r =<span class="math-tex">{tex}\\frac 54 \\div \\frac 52 = \\frac 12{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>a<sub>n</sub>&nbsp;= ar<sup>n-1</sup><br />
<span class="math-tex">{tex}\\Rightarrow a _ { 20 } = \\frac { 5 } { 2 } \\times \\left( \\frac { 1 } { 2 } \\right) ^ { 20 - 1 }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow a _ { 20 } = \\frac { 5 } { 2 } \\times \\left( \\frac { 1 } { 2 } \\right) ^ { 19 } = \\frac { 5 } { 2 ^ { 20 } }{/tex}</span><br />
and&nbsp;<span class="math-tex">{tex}a _ { n } = \\frac { 5 } { 2 } \\times \\left( \\frac { 1 } { 2 } \\right) ^ { n - 1 } = \\frac { 5 } { 2 \\times 2 ^ { n - 1 } } = \\frac { 5 } { 2 ^ { n } }{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Find the 12<sup>th</sup> term of a G.P. whose 8<sup>th</sup> term is 192 and the common ratio is&nbsp;2.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let a be the first term of given G.P. Here r =2&nbsp;and a<sub>8</sub>&nbsp;= 192<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>a<sub>n</sub> = ar<sup>n</sup><sup>-1</sup><br />
<span class="math-tex">{tex}\\Rightarrow a _ { 8 } = a \\times ( 2 ) ^ { 8 - 1 } = 192{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow a \\times ( 2 )^7 = 192{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow a \\times 128 = 192{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow a = \\frac { 192 } { 128 } = \\frac { 3 } { 2 }{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>a<sub>12</sub> = ar<sup>12 - 1</sup><br />
<span class="math-tex">{tex}\\Rightarrow a _ { 12 } = \\frac { 3 } { 2 } \\times 2 ^ { 11 } = 3 \\times 2 ^ { 10 }{/tex}</span><br />
= 3&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>1024 = 3072</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>The 5<sup>th</sup>, 8<sup>th </sup>and 11<sup>th</sup> terms of a G.P. are p, q and s respectively. Show that q<sup>2</sup> = ps.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let a&nbsp;be the first term and r&nbsp;be the common ratio of given G.P.<br />
<span class="math-tex">{tex}\\therefore {/tex}</span>&nbsp;a<sub>5</sub> = p <span class="math-tex">{tex}\\Rightarrow{/tex}</span> ar<sup>4</sup> = p ...(i)<br />
a<sub>8</sub> = q <span class="math-tex">{tex}\\Rightarrow{/tex}</span> ar<sup>7</sup> = q ...(ii)<br />
a<sub>11</sub>&nbsp;= s&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;&nbsp;a r<sup>10</sup> = s&nbsp;...(iii)<br />
Squaring both sides of eq. (ii), we getq<sup>2</sup>&nbsp;= (ar<sup>7</sup>)<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;q<sup>2</sup>&nbsp;= a<sup>2</sup>&nbsp;r<sup>14</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;q<sup>2</sup>&nbsp;= (ar<sup>4</sup>) (ar<sup>10</sup>)<br />
<span class="math-tex">{tex}\\Rightarrow {/tex}</span>&nbsp;q<sup>2</sup>&nbsp;= ps&nbsp;[From eq. (i) and (iii)]</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>The 4<sup>th</sup> term of a G.P. is square of its second term, and the first term is -3. Determine its 7<sup>th</sup> term.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let a&nbsp;be the first term and&nbsp;r&nbsp;be the common ratio of given G.P.<br />
Here a = -3 and a<sub>4</sub>&nbsp;= (a<sub>2</sub>)<sup>2</sup><br />
Now, a<sub>4</sub>&nbsp;= (a<sub>2</sub>)<sup>2</sup><br />
<span class="math-tex">{tex} \\Rightarrow{/tex}</span>&nbsp;ar<sup>3</sup>&nbsp;= (ar)<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ar<sup>3</sup>&nbsp;= a<sup>2</sup>r<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;r = a<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;r = -3<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;a <sub>7</sub> = ar<sup>7 - 1</sup>&nbsp;= (-3) <span class="math-tex">{tex}\\times{/tex}</span> (-3)<sup>6</sup><br />
= -3&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;729 = -2187</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(1)</span></div><div class="question-text"><p>Which term of the sequence 2, 2<span class="math-tex">{tex}\\sqrt 2{/tex}</span>, 4, .... is 128?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here a = 2, r =&nbsp;<span class="math-tex">{tex}\\frac { 2 \\sqrt { 2 } } { 2 } = \\sqrt { 2 }{/tex}</span>&nbsp;and a<sub>n</sub>&nbsp;= 128<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>a<sub>n</sub> = ar<sup>n-1</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>128 =&nbsp;<span class="math-tex">{tex}2 \\times ( \\sqrt { 2 } ) ^ { n - 1 }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;64 =&nbsp;<span class="math-tex">{tex}( \\sqrt { 2 } ) ^ { n - 1 }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow( \\sqrt { 2 } ) ^ { 12 } = ( \\sqrt { 2 } ) ^ { n - 1 }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>n - 1 = 12<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>n = 13<br />
Therefore, 13<sup>th</sup> term of the given G.P. is 128</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(2)</span></div><div class="question-text"><p>Which term of the sequence&nbsp;<span class="math-tex">{tex}\\sqrt { 3 } , 3,3 \\sqrt { 3 }{/tex}</span> , ..... is 729?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here a =&nbsp;<span class="math-tex">{tex}\\sqrt3{/tex}</span> , r =&nbsp;<span class="math-tex">{tex}\\frac { 3 } { \\sqrt { 3 } } = \\sqrt { 3 }{/tex}</span>&nbsp;and a<sub>n</sub>&nbsp;= 729<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>a<sub>n</sub> = ar<sup>n-1</sup><br />
<span class="math-tex">{tex}\\Rightarrow 729 = \\sqrt { 3 } \\times ( \\sqrt { 3 } ) ^ { n - 1 }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow ( \\sqrt { 3 } ) ^ { 12 } = ( \\sqrt { 3 } ) ^ { n }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>n = 12​​​​​​​​​​​​​​<br />
Therefore, 12<sup>th</sup> term of the given G.P. is 729.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(3)</span></div><div class="question-text"><p>Which term of the sequence&nbsp;<span class="math-tex">{tex}\\frac { 1 } { 3 } , \\frac { 1 } { 9 } , \\frac { 1 } { 27 }{/tex}</span>, ... is&nbsp;<span class="math-tex">{tex}\\frac { 1 } { 19683 }{/tex}</span>?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here a =&nbsp;<span class="math-tex">{tex}\\frac 13{/tex}</span> , r =&nbsp;<span class="math-tex">{tex}\\frac { 1 } { 9 } \\div \\frac { 1 } { 3 } = \\frac { 1 } { 3 }{/tex}</span>&nbsp;and a<sub>n</sub>&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac { 1 } { 19683 }{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>a<sub>n</sub> = ar<sup>n-1</sup><br />
<span class="math-tex">{tex}\\Rightarrow \\frac { 1 } { 19683 } = \\frac { 1 } { 3 } \\times \\left( \\frac { 1 } { 3 } \\right) ^ { n - 1 }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\left( \\frac { 1 } { 3 } \\right) ^ { 9 } = \\left( \\frac { 1 } { 3 } \\right) ^ { n }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;n = 9<br />
Therefore, 9<sup>th</sup> term of the given G.P. is <span class="math-tex">{tex}\\frac { 1 } { 19683 }{/tex}</span>​​​​​​</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>For what values of x, the numbers <span class="math-tex">{tex} \\frac { - 2 } { 7 } , x , \\frac { - 7 } { 2 }{/tex}</span> are in G.P.?</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given,&nbsp;<span class="math-tex">{tex} \\frac { - 2 } { 7 } , x , \\frac { - 7 } { 2 }{/tex}</span> are in G.P.<br />
<span class="math-tex">{tex} \\therefore\\frac { x } { \\frac { - 2 } { 7 } } = \\frac { \\frac { - 7 } { 2 } } { x }{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow x ^ { 2 } = \\frac { - 2 } { 7 } \\times \\frac { - 7 } { 2 }{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow x ^ { 2 } = 1{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow x = \\pm 1{/tex}</span><br />
Therefore, for x =&nbsp;<span class="math-tex">{tex} \\pm1{/tex}</span>&nbsp;th given numbers are in G.P.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the sum to indicated number of terms of the geometric progression&nbsp;0.15, 0.015, 0.0015, ... 20 terms.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here,a = 0.15&nbsp;and r =&nbsp;<span class="math-tex">{tex}\\frac { 0.015 } { 0.15 } = \\frac { 1 } { 10 }{/tex}</span><br />
<span class="math-tex">{tex}\\mathrm { S } _ { n } = \\frac { a \\left( 1 - r ^ { n } \\right) } { 1 - r }{/tex}</span>&nbsp;when r &lt; 1<br />
<span class="math-tex">{tex}\\Rightarrow S _ { 20 } = \\frac { 0.15 \\left[ 1 - \\left( \\frac { 1 } { 10 } \\right) ^ { 20 } \\right] } { 1 - \\frac { 1 } { 10 } }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\mathrm { S } _ { 20 } = \\frac { 15 } { 100 } \\times \\frac { 10 } { 9 } \\left[ 1 - ( 0.1 ) ^ { 20 } \\right]{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\mathrm { S } _ { 20 } = \\frac { 1 } { 6 } \\left[ 1 - ( 0.1 ) ^ { 20 } \\right]{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the sum to indicated number of terms of the geometric progression&nbsp;<span class="math-tex">{tex} \\sqrt { 7 } , \\sqrt { 21 } , 3 \\sqrt { 7 }{/tex}</span>, ... n&nbsp;terms.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here,a =&nbsp;<span class="math-tex">{tex} \\sqrt 7{/tex}</span>&nbsp;and r =<span class="math-tex">{tex} \\frac { \\sqrt { 21 } } { \\sqrt { 7 } } = \\sqrt { 3 }{/tex}</span><br />
<span class="math-tex">{tex} \\therefore S_ { n } = \\frac { a \\left( r ^ { n } - 1 \\right) } { r - 1 }{/tex}</span>&nbsp;when r &gt; 1<br />
<span class="math-tex">{tex} \\Rightarrow \\mathrm { S } _ { n } = \\frac { \\sqrt { 7 } \\left[ ( \\sqrt { 3 } ) ^ { n } - 1 \\right] } { \\sqrt { 3 } - 1 }{/tex}</span><br />
<span class="math-tex">{tex} S _ { n } = \\frac { \\sqrt { 7 } } { \\sqrt { 3 } - 1 } \\times \\frac { \\sqrt { 3 } + 1 } { \\sqrt { 3 } + 1 } \\left[ ( 3 ) ^ { \\frac { n } { 2 } } - 1 \\right]{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\mathrm { S } _ { n } = \\frac { \\sqrt { 7 } ( \\sqrt { 3 } + 1 ) } { 2 } \\left[ ( 3 ) ^ { \\frac { n } { 2 } } - 1 \\right]{/tex}</span>​​​​​​​</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the sum to indicated number of terms of the geometric progression 1, -a, a<sup>2</sup>, -a<sup>3</sup>, ... n terms (if a <span class="math-tex">{tex}\\ne{/tex}</span> -1).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here, a = 1&nbsp;and r =&nbsp;<span class="math-tex">{tex}\\frac {-a} {1}{/tex}</span>&nbsp;= -a<br />
<span class="math-tex">{tex}\\therefore ^ { \\mathrm { S } _ { n } = \\frac { a \\left( 1 - r ^ { n } \\right) } { 1 - r } }{/tex}</span>&nbsp;when r &lt; 1<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;S<sub>n&nbsp;</sub>= <span class="math-tex">{tex}\\frac { 1 \\left[ 1 - (-a) ^ { n } \\right] } { 1 - (-a) }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;S<sub>n</sub> = <span class="math-tex">{tex}\\frac { 1 } { 1 + a }{/tex}</span>[1 - (-a)<sup>n</sup>]</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Find the sum to indicated number of terms of the geometric progression&nbsp;x<sup>3</sup>,&nbsp;x<sup>5</sup>,&nbsp;x<sup>7</sup> ... n&nbsp;terms&nbsp;(if&nbsp;<span class="math-tex">{tex}x \\ne \\pm1){/tex}</span>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here,a = x<sup>3</sup>&nbsp;and r =&nbsp;<span class="math-tex">{tex}\\frac { x ^ { 5 } } { x ^ { 3 } }{/tex}</span>&nbsp;= x<sup>2</sup><br />
<span class="math-tex">{tex}S _ { n } = \\frac { a \\left( 1 - r ^ { n } \\right) } { 1 - r }{/tex}</span>&nbsp;when r &lt; 1<br />
<span class="math-tex">{tex}\\Rightarrow S _ { n } = \\frac { x ^ { 3 } \\left[ 1 - \\left( x ^ { 2 } \\right) ^ { n } \\right] } { 1 - x ^ { 2 } }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\mathrm { S } _ { n } = \\frac { x ^ { 3 } } { 1 - x ^ { 2 } } \\left[ 1 - x ^ { 2 n } \\right]{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Evaluate:<span class="math-tex">{tex}\\sum \\limits_ { k = 1 } ^ { 11 } \\left( 2 + 3 ^ { k } \\right){/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given:<span class="math-tex">{tex}\\sum _ { k = 1 } ^ { 11 } \\left( 2 + 3 ^ { k } \\right){/tex}</span><br />
= (2 + 3<sup>1</sup>) +&nbsp;(2 + 3<sup>2</sup>) + (2 + 3<sup>3</sup>) +&nbsp;(2 + 3<sup>11</sup>)<br />
= ( 2 + 2 + 2 +........11 times) + (3 + 3<sup>2</sup>&nbsp;+ 3<sup>3</sup>&nbsp;+....... +3<sup>11</sup>)</p>

<p>= 22 + (3 + 3<sup>2</sup>&nbsp;+ 3<sup>3</sup>&nbsp;+....... +3<sup>11</sup>)&nbsp;&hellip;&hellip;&hellip;.(i)</p>

<p>Here&nbsp;3, 3<sup>2</sup>,3<sup>3</sup>&nbsp;....... ,3<sup>11</sup>is in G.P.</p>

<p><span class="math-tex">{tex}\\therefore{/tex}</span>a = 3 and r =&nbsp;<span class="math-tex">{tex}\\frac { 3 ^ { 2 } } { 3 } = 3{/tex}</span><br />
<span class="math-tex">{tex}\\mathrm { S } _ { n } = \\frac { 3 \\left( 3 ^ { 11 } - 1 \\right) } { 3 - 1 } = \\frac { 3 } { 2 } \\left( 3 ^ { 11 } - 1 \\right){/tex}</span></p>

<p>Putting the value of S<sub>n</sub>&nbsp;in eq. (i), we get&nbsp;<span class="math-tex">{tex}\\sum _ { k = 1 } ^ { 11 } \\left( 2 + 3 ^ { k } \\right) = 22 + \\frac { 3 } { 2 } \\left( 3 ^ { 11 } - 1 \\right){/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>The sum of first three terms of a G.P. is <span class="math-tex">{tex}\\frac{39}{10}{/tex}</span>&nbsp;and their product is 1. Find the common ratio and the terms.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let <span class="math-tex">{tex}\\frac ar{/tex}</span>, a, ar&nbsp;be first three terms of the given G.P.<br />
<span class="math-tex">{tex}\\frac { a } { { r } } + a + a r = \\frac { 39 } { 10 }{/tex}</span>&nbsp;...(i)<br />
<span class="math-tex">{tex}(\\frac {a}{r}){/tex}</span>(a)(ar) = 1 ...(ii)<br />
From (ii) we obtain a<sup>3</sup> = 1 <span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a = 1 (considering real roots only)<br />
Substituting a = 1 in equation (i), we obtain<br />
<span class="math-tex">{tex}\\frac{1}{\\mathrm{r}}+1+\\mathrm{r}=\\frac{39}{10}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow 1+\\mathrm{r}+\\mathrm{r}^2=\\frac{39}{10} \\mathrm{r}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;10 + 10r + 10r<sup>2&nbsp;</sup>- 39r = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;10r<sup>2&nbsp;</sup>- 29r + 10 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;10r<sup>2&nbsp;</sup>- 25r - 4r + 10 = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;5r(2r - 5)-2(2r - 5) = 0<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;(5r - 2)(2r - 5) = 0<br />
<span class="math-tex">{tex}\\Rightarrow \\mathrm{r}=\\frac{2}{5}{/tex}</span>&nbsp;or&nbsp;<span class="math-tex">{tex}\\frac {5}{2}{/tex}</span><br />
corresponding terms of the G.P</p>

<ol start="1" style="list-style-type:lower-roman">
	<li>when r =&nbsp;<span class="math-tex">{tex}\\frac {2}{5}{/tex}</span><br />
	<span class="math-tex">{tex}​​\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac {5}{2}{/tex}</span>, 1,&nbsp;<span class="math-tex">{tex}\\frac {2}{5}{/tex}</span></li>
	<li>when r =&nbsp;<span class="math-tex">{tex}\\frac {5}{2}{/tex}</span><br />
	<span class="math-tex">{tex}​​\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac {2}{5}{/tex}</span>, 1,&nbsp;<span class="math-tex">{tex}\\frac {5}{2}{/tex}</span></li>
</ol></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>How many terms of G.P. 3, 3<sup>2</sup>, 3<sup>3</sup>, ... are needed to give the sum 120?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here, a = 3 and r =&nbsp;<span class="math-tex">{tex} \\frac { 3 ^ { 2 } } { 3 } = 3{/tex}</span><br />
<span class="math-tex">{tex}\\therefore ^ { \\mathrm { S } _ { n } = \\frac { a \\left( r ^ { - } - 1 \\right) } { r - 1 } }{/tex}</span>&nbsp;when r &gt; 1<br />
<span class="math-tex">{tex}\\Rightarrow 120 = \\frac { 3 \\left( 3 ^ { n } - 1 \\right) } { 3 - 1 }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow 120 = \\frac { 3 } { 2 } \\left( 3 ^ { n } - 1 \\right){/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 120 \\times \\frac { 2 } { 3 } = 3 ^ { n } - 1{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow{/tex}</span>&nbsp;3<sup>n</sup>&nbsp;= 81<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;3<sup>n</sup>&nbsp;= (3)<sup>4</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> n = 4<br />
Therefore, the sum of 4 terms of the given G.P. is 120.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>The Sum of first three terms of a G.P. is 16 and the sum of the next three terms is 128. Determine the first term, the common ratio and the sum to n terms of the G.P.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>s<sub>3</sub>&nbsp;= 16<br />
<span class="math-tex">{tex}\\frac{a\\left(1-r^{3}\\right)}{1-r}{/tex}</span>&nbsp;= 16 (1)<br />
s<sub>6</sub> - s<sub>3</sub>&nbsp;= 128<br />
<span class="math-tex">{tex}\\frac{a\\left(1-r^{6}\\right)}{1-r}{/tex}</span>&nbsp;- 16 = 128<br />
<span class="math-tex">{tex}\\frac{a\\left(1-r^{6}\\right)}{1-r}{/tex}</span>, = 144 (2)<br />
(2)&nbsp;<span class="math-tex">{tex}\\div{/tex}</span>&nbsp;(1)<br />
<span class="math-tex">{tex}\\frac{1-r^{6}}{1-r^{3}}=\\frac{144}{16}{/tex}</span><br />
1 + r<sup>3</sup>&nbsp;= 9<br />
r<sup>3</sup>&nbsp;= 8<br />
r = 2<br />
<span class="math-tex">{tex}s_{3}=\\frac{a\\left(r^{3}-1\\right)}{r-1}{/tex}</span>&nbsp;= 16<br />
a = 16 / 7<br />
<span class="math-tex">{tex}s_{n}=\\frac{a\\left(r^{n}-1\\right)}{r-1}{/tex}</span><span class="math-tex">{tex}=\\frac{16}{7} \\frac{\\left(2^{n}-1\\right)}{2-1}=\\frac{16}{7}\\left(2^{n}-1\\right){/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 15</span></div><div class="question-text"><p>Given a G.P. with a = 729 and 7<sup>th</sup> term 64, determine S<sub>7</sub>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: a = 729 and a<sub>7</sub> = 64<br />
<span class="math-tex">{tex}\\Rightarrow a r ^ { 6 } = 64{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow 729{r^6} = 64{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow {r^6} = {{64} \\over {729}} = {\\left( {{2 \\over 3}} \\right)^6}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow r = \\frac { 2 } { 3 }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow S _ { n } = \\frac { a \\left( 1 - r ^ { n } \\right) } { 1 - r }{/tex}</span>&nbsp;when r &lt; 1<img src="https://media-mycbseguide.s3.amazonaws.com/images/static/ncert/11/maths/ch09/Ex9.3/image081.png" /><br />
<span class="math-tex">{tex}\\Rightarrow S _ { 7 } = \\frac { 729 \\left[ 1 - \\left( \\frac { 2 } { 3 } \\right) ^ { 7 } \\right] } { 1 - \\frac { 2 } { 3 } } = \\frac { 729 \\left[ 1 - \\frac { 128 } { 2187 } \\right] } { \\frac { 3 - 2 } { 3 } }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow S _ { 7 } = 729 \\times 3 \\left( \\frac { 2187 - 128 } { 2187 } \\right){/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\mathrm { S } _ { 7 } = \\frac { 729 \\times 3 \\times 2059 } { 2187 } = 2059{/tex}</span></p>

</div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 16</span></div><div class="question-text"><p>Find a G.P. for which sum of the first two terms is -4 and the fifth term is 4 times the third term.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let a&nbsp;be the first term and r&nbsp;be the common ratio of given G.P.</p>

<p>Given: a + ar = -4&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a(1 + r) = -4&nbsp;&hellip;&hellip;..(i)</p>

<p>And a<sub>5</sub> = 4a<sub>3</sub></p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ar<sup>4</sup> = 4ar<sup>2</sup></p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;r<sup>2</sup> = 4</p>

<p><span class="math-tex">{tex}\\Rightarrow r = \\pm 2{/tex}</span></p>

<p>Putting r = 2<img src="https://media-mycbseguide.s3.amazonaws.com/images/static/ncert/11/maths/ch09/Ex9.3/image150.png" /> in eq. (i), we get a(1 + 2) = -4&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow a = \\frac { - 4 } { 3 }{/tex}</span></p>

<p>Therefore, required G.P. is <span class="math-tex">{tex}\\frac { - 4 } { 3 } , \\frac { - 8 } { 3 } , \\frac { - 16 } { 3 } , \\dots{/tex}</span></p>

<p>Putting r = -2&nbsp;&nbsp;in eq. (i), we get a(1 - 2) = -4&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a = 4</p>

<p>Therefore, required G.P. is 4, -8, 16, -32,.......&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 17</span></div><div class="question-text"><p>If the 4<sup>th</sup>, 10<sup>th</sup> and 16<sup>th</sup> terms of a G.P. are x, y&nbsp;and z, respectively. Prove that x, y, z are in G.P.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let a&nbsp;be the first term and r&nbsp;be the common ratio of given G.P.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;a<sub>4</sub> = x<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ar<sup>3</sup> = x ...(i)<br />
a<sub>10</sub> = y<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ar<sup>9</sup> = y&nbsp;...(ii)<br />
a<sub>16</sub> = z&nbsp;<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ar<sup>15</sup> = z&nbsp;...(iii)<br />
From eq. (ii), ar<sup>9</sup> = y<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;(ar<sup>9</sup>)<sup>2</sup> = y<sup>2</sup><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;y<sup>2</sup> = (ar<sup>3</sup>)(ar<sup>15</sup>)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;y<sup>2</sup> = xz&nbsp;[From eq. (i) and (iii)]<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;x, y, z&nbsp;are in G.P.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 18</span></div><div class="question-text"><p>Find the sum to n&nbsp;terms of the sequence,&nbsp;8, 88, 888, 8888&hellip; .</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here Sn = 8 + 88 + 888 + 8888 + ....... up to n terms<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;Sn = 8(1 +11 + 111 + 1111 + ...... up to n terms)<br />
<span class="math-tex">{tex}\\Rightarrow S _ { n } = \\frac { 8 } { 9 }{/tex}</span>(9 + 99 + 999 + 9999 + ....... up to n terms)&nbsp;<img src="https://media-mycbseguide.s3.amazonaws.com/images/static/ncert/11/maths/ch09/Ex9.3/image007.png" /><br />
<span class="math-tex">{tex}\\Rightarrow S _ { n } = \\frac { 8 } { 9 } \\left[ ( 10 - 1 ) + \\left( 10 ^ { 2 } - 1 \\right) + \\left( 10 ^ { 3 } - 1 \\right) + \\ldots . \\text { up to } n \\text { terms } \\right]{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow \\mathrm { S } _ { n } = \\frac { 8 } { 9 }{/tex}</span>[(10 + 10<sup>2</sup> + 10<sup>3</sup> + ..... up to n terms) - (1 + 1 + 1 + ...... up to n terms)]<br />
<span class="math-tex">{tex}\\Rightarrow S _ { n } = \\frac { 8 } { 9 } \\left[ \\frac { 10 \\times \\left( 10 ^ { n } - 1 \\right) } { 10 - 1 } - n \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\frac { 8 } { 9 } \\left[ \\frac { 10 } { 9 } \\left( 10 ^ { n } - 1 \\right) - n \\right]{/tex}</span><br />
<span class="math-tex">{tex}= \\frac { 80 } { 81 } \\left( 10 ^ { n } - 1 \\right) - \\frac { 8 } { 9 } n{/tex}</span></p></div></div></div>
`;

export const MISC_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>If f is a function satisfying f (x+y) = f (x) f (y) for all x, y <span class="math-tex">{tex} \\in {/tex}</span>&nbsp;N such that f (1) = 3 and <span class="math-tex">{tex}\\sum\\limits_{x = 1}^n f (x) = 120{/tex}</span> find the value of n.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>f (1) = 3</p>

<p>f(1 + 2) = f(1) f(2) = 3&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;9 = 27<br />
f(1 + 3) = f(1) f(3) = 3&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;27 = 81<br />
L.H.S.<br />
= f(1) + f(2) + f(3) + ...... + f(n)<br />
= 3 + 9 + 27 + 81 + ... + n terms<br />
=&nbsp;<span class="math-tex">{tex}\\frac {3(3^n - 1)}{3-1} = \\frac 32 (3^n - 1){/tex}</span><br />
= f(1) + f(2) + f(3) +----+ f(n)<br />
= 3 + 9 + 27 + 1 +----+n term s<br />
<span class="math-tex">{tex}= \\frac { 3 \\left( 3 ^ { n } - 1 \\right) } { 3 - 1 } = \\frac { 3 } { 2 } \\left( 3 ^ { n } - 1 \\right){/tex}</span><br />
ATQ<br />
<span class="math-tex">{tex}\\frac { 3 } { 2 } \\left( 3 ^ { n } - 1 \\right) = 120{/tex}</span><br />
3<sup>n</sup> - 1 = 80<br />
3<sup>n</sup> = 81<br />
n = 4</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>The sum of some terms of G.P. is 315 whose first term and the common ratio are 5 and 2 respectively. Find the last term and the number of terms.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: a = 5, r = 2&nbsp;and S<sub>n</sub> = 315&nbsp;</p>

<p><span class="math-tex">{tex}\\therefore \\mathrm { S } _ { n } = \\frac { a \\left( r ^ { n } - 1 \\right) } { r - 1 }{/tex}</span>&nbsp;&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow 315 = \\frac { 5 \\left( 2 ^ { n } - 1 \\right) } { 2 - 1 }{/tex}</span>&nbsp;&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow \\frac { 315 } { 5 } = 2 ^ { n } - 1{/tex}</span></p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2<sup>n - 1</sup> = 63</p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2<sup>n</sup> = 64 = 2<sup>6</sup>&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;n = 6&nbsp;</p>

<p><span class="math-tex">{tex}\\therefore a _ { 6 } = a r ^ { 6 - 1 } = 5 \\times 2 ^ { 5 } = 5 \\times 32 = 160{/tex}</span></p>

<p>Hence the number of terms=6 and the last term =160</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>The first term of a G.P. is 1. The sum of the third term and fifth term is 90. Find the common ratio of G.P.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: a = 1&nbsp;and a<sub>3</sub> + a<sub>5</sub> = 90&nbsp;&nbsp;<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ar<sup>2</sup> + ar<sup>4</sup> = 90&nbsp;<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a(r<sup>2</sup> + r4) = 90&nbsp;&nbsp;<br />
<span class="math-tex">{tex}\\Rightarrow 1 \\times \\left( r ^ { 2 } + r ^ { 4 } \\right) = 90{/tex}</span></p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;r<sup>2</sup> + r<sup>4</sup> = 90</p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;r<sup>4</sup> + r<sup>2</sup> - 90 = 0</p>

<p><span class="math-tex">{tex}\\Rightarrow r ^ { 2 } = \\frac { - 1 \\pm \\sqrt { ( 1 ) ^ { 2 } - 4 \\times ( - 90 ) \\times 1 } } { 2 \\times 1 }{/tex}</span></p>

<p><span class="math-tex">{tex}= \\frac { - 1 \\pm \\sqrt { 1 + 360 } } { 2 } = \\frac { - 1 \\pm \\sqrt { 361 } } { 2 }{/tex}</span></p>

<p><span class="math-tex">{tex}= \\frac { - 1 \\pm 19 } { 2 }{/tex}</span>= &nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow r ^ { 2 } = \\frac { - 1 + 19 } { 2 } = \\frac { 18 } { 2 } = 9{/tex}</span>or&nbsp;<span class="math-tex">{tex}r ^ { 2 } = \\frac { - 1 - 19 } { 2 } = \\frac { - 20 } { 2 } = - 10{/tex}</span>&nbsp;which is not possible</p>

<p>Therefore, the common ratio is <span class="math-tex">{tex}r = \\pm 3{/tex}</span>&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>The sum of three numbers in G.P. is 56. If we subtract 1, 7, 21 from these numbers in that order, we obtain an arithmetic progression. Find the numbers.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let a, ar, ar<sup>2&nbsp;</sup>&nbsp;be three numbers in G.P., therefore, a + ar + ar<sup>2</sup> = 56&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a(1 + r + r<sup>2</sup>) = 56&nbsp; ......(i)</p>

<p>According to question,&nbsp; a - 1, ar - 7, ar<sup>2</sup> - 21&nbsp;&nbsp;are in A.P.</p>

<p><span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;(ar - 7) - (a - 1) = (ar<sup>2</sup> - 21) - (ar - 7)&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ar - 7 - a + 1 = ar<sup>2</sup> - 21 - ar + 7&nbsp;&nbsp;&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ar - a - 6 = ar<sup>2</sup> - ar - 14</p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ar<sup>2</sup> - 2ar + a = 8</p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a(r<sup>2</sup> - 2r + 1) = 8&nbsp;&hellip;.....(ii)</p>

<p>Dividing eq. (i) by eq. (ii), <span class="math-tex">{tex}\\frac { a \\left( 1 + r + r ^ { 2 } \\right) } { a \\left( r ^ { 2 } - 2 r + 1 \\right) } = \\frac { 56 } { 8 }{/tex}</span></p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;1 + r + r<sup>2</sup> = 7r<sup>2</sup> - 14r + 7&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;6r<sup>2</sup> - 15r + 6 = 0&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2r<sup>2</sup> - 5r + 2 = 0&nbsp;&nbsp;&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow r = \\frac { - ( - 5 ) \\pm \\sqrt { ( - 5 ) ^ { 2 } - 4 \\times 2 \\times 2 } } { 2 \\times 2 }{/tex}</span>&nbsp;</p>

<p><span class="math-tex">{tex}= \\frac { 5 \\pm \\sqrt { 25 - 16 } } { 4 } = \\frac { 5 \\pm \\sqrt { 9 } } { 4 } = \\frac { 5 \\pm 3 } { 4 }{/tex}</span>= &nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow r = \\frac { 5 + 3 } { 4 } = \\frac { 8 } { 4 } = 2{/tex}</span>or&nbsp;<span class="math-tex">{tex}r = \\frac { 5 - 3 } { 4 } = \\frac { 2 } { 4 } = \\frac { 1 } { 2 }{/tex}</span>&nbsp;</p>

<p>Putting r = 2&nbsp;&nbsp;in eq. (i), a(1 + 2 + 2<sup>2</sup>) = 56&nbsp;&nbsp;&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow a = \\frac { 56 } { 7 } = 8{/tex}</span>&nbsp;</p>

<p>Then the required numbers are 8, 16, 32.</p>

<p>Putting <span class="math-tex">{tex}r = \\frac { 1 } { 2 }{/tex}</span>&nbsp;in eq. (i),&nbsp;<span class="math-tex">{tex}a \\left( 1 + \\frac { 1 } { 2 } + \\frac { 1 } { 4 } \\right) = 56{/tex}</span>&nbsp;&nbsp;&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow a \\times \\frac { 7 } { 4 } = 56{/tex}</span>&nbsp;&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a = 32&nbsp;</p>

<p>Then the required numbers are 32, 16, 8.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>A G.P. consists of an even number of terms. If the sum of all the terms is 5 times the sum of terms occupying odd places, then find its common ratio.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let the number of terms be 2n then we have the number of odd terms is n<br />
Let the G.P be&nbsp; a, ar, ar<sup>2</sup>, .... ar<sup>2n-1</sup><br />
Then the odd terms a, ar<sup>2</sup>, ar<sup>4</sup>, ar<sup>6</sup>, ....&nbsp;&nbsp;form a G.P<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;S<sub>2n</sub>&nbsp;= <span class="math-tex">{tex}\\frac {a \\left(r ^ {2n} - 1\\right)} {r - 1}{/tex}</span>&nbsp; and S<sub>n</sub>&nbsp;= a<span class="math-tex">{tex}\\left[ {{{{{({r^2})}^n} - 1} \\over {{r^2} - 1}}} \\right]{/tex}</span><br />
According to question,&nbsp; S<sub>2n</sub> = 5S<sub>n<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span></sub>&nbsp;<span class="math-tex">{tex}a\\left[ {{{{r^{2n}} - 1} \\over {r - 1}}} \\right] = 5a\\left[ {{{{{({r^2})}^n} - 1} \\over {{r^2} - 1}}} \\right]{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow {1 \\over {r - 1}} = {5 \\over {{r^2} - 1}}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;r + 1 = 5<br />
<strong><span class="math-tex">{tex}\\Rightarrow{/tex}</span></strong>&nbsp;r = 4</p>

</div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>If <span class="math-tex">{tex}\\frac { a + b x } { a - b x } = \\frac { b + c x } { b - c x } = \\frac { c + d x } { c - d x }{/tex}</span>&nbsp;(x <span class="math-tex">{tex}\\neq{/tex}</span> 0), then show that a, b, c&nbsp;and d&nbsp;are in G.P.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Taking <span class="math-tex">{tex}\\frac { a + b x } { a - b x } = \\frac { b + c x } { b - c x }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;(a + bx)(b - cx) = (b + cx) (a - bx)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ab - acx + b<sup>2</sup>x - bcx<sup>2</sup> = ab - b<sup>2</sup>x + acx - bcx<sup>2<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;</sup>2b<sup>2</sup>x = 2acx<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;b<sup>2</sup> = ac<br />
<span class="math-tex">{tex}\\Rightarrow \\frac { b } { a } = \\frac { c } { b }{/tex}</span>&nbsp;...(i)<br />
Taking <span class="math-tex">{tex}\\frac { b + c x } { b - c x } = \\frac { c + d x } { c - d x }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;(b + cx) (c - dx) = (c + dx) (b - cx)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2c<sup>2</sup>x = 2bdx<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;c<sup>2</sup> = bd<br />
<span class="math-tex">{tex}\\Rightarrow \\frac { c } { b } = \\frac { d } { c }{/tex}</span>&nbsp;...(ii)<br />
From eq. (i) and (ii),&nbsp;<span class="math-tex">{tex}\\frac { b } { a } = \\frac { c } { b } = \\frac { d } { c }{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Let S be the sum, P the product and R the sum of reciprocals of n&nbsp;terms in a G.P. Prove that P<sup>2</sup>R<sup>n</sup> = S<sup>n</sup>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let the G.P be&nbsp;<span class="math-tex" data-widget="mathjaxlatex" style="display:inline-block">a, ar, ar<sup>2</sup>, ar<sup>3</sup> ..........,ar<sup>n - 1</sup></span></p>

<p>Here <span class="math-tex">{tex}\\mathrm { S } = \\frac { a \\left( r ^ { n } - 1 \\right) } { r - 1 }{/tex}</span></p>

<p>&nbsp;P = a.ar.ar<sup>2</sup> ......... ar<sup>n-1</sup><span class="math-tex">{tex}= {a^n}.{r^{1 + 2 + 3 + ....... + (n - 1)}} = {a^n}.{r^{{{n(n - 1)} \\over 2}}}{/tex}</span></p>

<p>and R <span class="math-tex">{tex}= \\frac { 1 } { a } + \\frac { 1 } { a r } + \\frac { 1 } { a r ^ { 2 } } + \\ldots \\ldots \\frac { 1 } { a r ^ { n - 1 } }{/tex}</span><span class="math-tex">{tex}= {{{r^{n - 1}} + {r^{n - 2}} + {r^{n - 3}} + .......... + 1} \\over {a{r^{n - 1}}}}{/tex}</span></p>

<p><span class="math-tex">{tex}= {{1({r^n} - 1)} \\over {r - 1}}.{1 \\over {a{r^{n - 1}}}}{/tex}</span><span class="math-tex">{tex}= {{{r^n} - 1} \\over {a{r^{n - 1}}(r - 1)}}{/tex}</span></p>

<p>Now <span class="math-tex">{tex}{p^2}{R^n} = {{{a^{2n}}.{r^{n(n - 1)}}{{({r^n} - 1)}^n}} \\over {{a^n}{r^{n(n - 1)}}{{(r - 1)}^n}}} = {{{a^n}{{({r^n} - 1)}^n}} \\over {{{(r - 1)}^n}}} = {a^n}{\\left( {{{{r^n} - 1} \\over {r - 1}}} \\right)^n} = {S^n}{/tex}</span>&nbsp;&nbsp;</p>

<p>Hence proved.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>If a, b, c, d&nbsp;are in G.P., prove that (a<sup>n</sup> + b<sup>n</sup>), (b<sup>n</sup> + c<sup>n</sup>), (c<sup>n</sup> + d<sup>n</sup>)&nbsp;are in G.P.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: a, b, c, d&nbsp;are in G.P.</p>

<p>To prove: (a<sup>n</sup> + b<sup>n</sup>), (b<sup>n</sup> + c<sup>n</sup>), (c<sup>n</sup> + d<sup>n</sup>)&nbsp;are in G.P.</p>

<p><span class="math-tex">{tex}\\Rightarrow \\frac { b ^ { n } + c ^ { n } } { a ^ { n } + b ^ { n } } = \\frac { c ^ { n } + d ^ { n } } { b ^ { n } + c ^ { n } }{/tex}</span><br />
Let <span class="math-tex">{tex}\\frac { b } { a } = \\frac { c } { b } = \\frac { d } { c } = k{/tex}</span>&nbsp;</p>

<p><span class="math-tex">{tex}\\therefore \\frac { b } { a } = k{/tex}</span></p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;b = ak&nbsp;</p>

<p>And <span class="math-tex">{tex}\\frac { c } { b } = k{/tex}</span></p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;c = bk = (ak)k = ak<sup>2</sup></p>

<p>Also <span class="math-tex">{tex}\\frac { d } { c } = k{/tex}</span></p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;d = ck = (ak<sup>2</sup>)k = ak<sup>3</sup>&nbsp;</p>

<p>Now, <span class="math-tex">{tex}\\frac { b ^ { n } + c ^ { n } } { a ^ { n } + b ^ { n } } = \\frac { c ^ { n } + d ^ { n } } { b ^ { n } + c ^ { n } }{/tex}</span>&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow \\frac { ( a k ) ^ { n } + \\left( a k ^ { 2 } \\right) ^ { n } } { a ^ { n } + ( a k ) ^ { n } } = \\frac { \\left( a k ^ { 2 } \\right) ^ { n } + \\left( a k ^ { 3 } \\right) ^ { n } } { ( a k ) ^ { n } + \\left( a k ^ { 2 } \\right) ^ { n } }{/tex}</span></p>

<p><span class="math-tex">{tex}\\Rightarrow \\frac { a ^ { n } k ^ { n } + a ^ { n } k ^ { 2 n } } { a ^ { n } + a ^ { n } k ^ { n } } = \\frac { a ^ { n } k ^ { 2 n } + a ^ { n } k ^ { 3 n } } { a ^ { n } k ^ { n } + a ^ { n } k ^ { 2 n } }{/tex}</span></p>

<p><span class="math-tex">{tex}\\Rightarrow \\frac { a ^ { n } k ^ { n } \\left( 1 + k ^ { n } \\right) } { a ^ { n } \\left( 1 + k ^ { n } \\right) } = \\frac { a ^ { n } k ^ { 2 n } \\left( 1 + k ^ { n } \\right) } { a ^ { n } k ^ { n } \\left( 1 + k ^ { n } \\right) }{/tex}</span></p>

<p><span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;k<sup>n</sup> = k<sup>n</sup></p>

<p>Therefore, (a<sup>n</sup> + b<sup>n</sup>), (b<sup>n</sup> + c<sup>n</sup>), (c<sup>n</sup> + d<sup>n</sup>)&nbsp;are in G.P.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>If a and b are the roots x<sup>2</sup> - 3x + p = 0&nbsp;and c, d&nbsp;are roots of x<sup>2</sup> - 12x + q = 0, where a, b, c, d&nbsp;form a G.P. Prove that (q + p) : (q - p) = 17 : 15.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let <span class="math-tex">{tex}\\frac { b } { a } = \\frac { c } { b } = \\frac { d } { c }{/tex}</span>&nbsp;= k<br />
<span class="math-tex">{tex}\\therefore \\frac ba{/tex}</span>&nbsp;= k<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;b = ak<br />
And <span class="math-tex">{tex}\\frac cb{/tex}</span>&nbsp;= k<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;c = bk = (ak)k = ak<sup>2&nbsp;</sup><br />
Also <span class="math-tex">{tex}\\frac dc{/tex}</span>&nbsp;= k<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;d = ck = (ak<sup>2</sup>)k = ak<sup>3</sup><br />
<span class="math-tex">{tex}\\because{/tex}</span>&nbsp; a<sup>a</sup>&nbsp;and b<sup>b</sup>&nbsp;are the roots x<sup>2</sup> - 3x + p = 0<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;a + b = <span class="math-tex">{tex}\\frac {-(-3)} {1}{/tex}</span> = 3<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a + ak = 3<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a(1 + k) = 3 ...(i)<br />
And ab =&nbsp;<span class="math-tex">{tex}\\frac p 1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a(ak) = p<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a<sup>2</sup>k = p​ ...(ii)<br />
Also&nbsp;c, d&nbsp;are roots of x<sup>2</sup> - 12x + q = 0&nbsp;<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;c + d =&nbsp;<span class="math-tex">{tex}\\frac { - ( - 12 ) } { 1 }{/tex}</span>&nbsp;= 12<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ak<sup>2</sup> + ak<sup>3</sup> = 12<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ak<sup>2</sup>(1 + k) = 12 ...(iii)<br />
And c d =&nbsp;<span class="math-tex">{tex}\\frac q1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;ak<sup>2</sup>(ak<sup>3</sup>) = q<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a<sup>2</sup>k<sup>5</sup> = q&nbsp;...(iv)<br />
Dividing eq. (iii) by eq. (i),&nbsp;<span class="math-tex">{tex}\\frac { a k ^ { 2 } ( 1 + k ) } { a ( 1 + k ) } = \\frac { 12 } { 3 }{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;k<sup>2</sup> = 4<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;k =&nbsp;<span class="math-tex">{tex}\\pm{/tex}</span>&nbsp;2<br />
Now <span class="math-tex">{tex}\\frac { q + p } { q - p } = \\frac { a ^ { 2 } k ^ { 5 } + a ^ { 2 } k } { a ^ { 2 } k ^ { 5 } - a ^ { 2 } k } = \\frac { a ^ { 2 } k \\left( k ^ { 4 } + 1 \\right) } { a ^ { 2 } k \\left( k ^ { 4 } - 1 \\right) }{/tex}</span>&nbsp;<br />
=&nbsp;<span class="math-tex">{tex}\\frac { ( \\pm 2 ) ^ { 4 } + 1 } { ( \\pm 2 ) ^ { 4 } - 1 } = \\frac { 16 + 1 } { 16 - 1 } = \\frac { 17 } { 15 }{/tex}</span><br />
Therefore, (q + p) : (q - p) = 17 : 15</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>The ratio of the A.M. and G.M. of two positive numbers a and b is <img src="https://media-mycbseguide.s3.amazonaws.com/images/static/ncert/11/maths/ch09/Misc/image276.png" />&nbsp;Show that <span class="math-tex">{tex}a : b = \\left( \\begin{array} { c } { m + \\sqrt { m ^ { 2 } - n ^ { 2 } } } \\end{array} \\right) : \\left( m - \\sqrt { m ^ { 2 } - n ^ { 2 } } \\right){/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: <span class="math-tex">{tex}\\frac { a + b } { 2 } : \\sqrt { a b } = m : n{/tex}</span></p>

<p><span class="math-tex">{tex}\\Rightarrow \\frac { a + b } { 2 \\sqrt { a b } } = \\frac { m } { n }{/tex}</span>&nbsp;</p>

<p>By componendo&nbsp;and dividendo,&nbsp;</p>

<p><span class="math-tex">{tex}\\frac { a + b + 2 \\sqrt { a b } } { a + b - 2 \\sqrt { a b } } = \\frac { m + n } { m - n }{/tex}</span>&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow \\frac { ( \\sqrt { a } + \\sqrt { b } ) ^ { 2 } } { ( \\sqrt { a } - \\sqrt { b } ) ^ { 2 } } = \\frac { m + n } { m - n }{/tex}</span>&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow \\frac { \\sqrt { a } + \\sqrt { b } } { \\sqrt { a } - \\sqrt { b } } = \\frac { \\sqrt { m + n } } { \\sqrt { m - n } }{/tex}</span></p>

<p>Again by componendo&nbsp;and dividendo,</p>

<p><span class="math-tex">{tex}\\frac { \\sqrt { a } + \\sqrt { b } + \\sqrt { a } - \\sqrt { b } } { \\sqrt { a } + \\sqrt { b } - \\sqrt { a } + \\sqrt { b } } = \\frac { \\sqrt { m + n } + \\sqrt { m - n } } { \\sqrt { m + n } - \\sqrt { m - n } }{/tex}</span>&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow \\frac { 2 \\sqrt { a } } { 2 \\sqrt { b } } = \\frac { \\sqrt { m + n } + \\sqrt { m - n } } { \\sqrt { m + n } - \\sqrt { m - n } }{/tex}</span></p>

<p><span class="math-tex">{tex}\\Rightarrow \\frac { a } { b } = \\frac { ( \\sqrt { m + n } + \\sqrt { m - n } ) ^ { 2 } } { ( \\sqrt { m + n } - \\sqrt { m - n } ) ^ { 2 } }{/tex}</span></p>

<p><span class="math-tex">{tex}\\Rightarrow \\frac { a } { b } = \\frac { m + n + m - n + 2 \\sqrt { ( m + n ) ( m - n ) } } { m + n + m - n - 2 \\sqrt { ( m + n ) ( m - n ) } }{/tex}</span>&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow \\frac { a } { b } = \\frac { 2 m + 2 \\sqrt { ( m + n ) ( m - n ) } } { 2 m - 2 \\sqrt { ( m + n ) ( m - n ) } }{/tex}</span>&nbsp;</p>

<p><span class="math-tex">{tex}\\Rightarrow \\frac { a } { b } = \\frac { m + \\sqrt { ( m + n ) ( m - n ) } } { m - \\sqrt { ( m + n ) ( m - n ) } }{/tex}</span></p>

<p>Therefore, <span class="math-tex">{tex}a : b = \\left( \\begin{array} { c } { m + \\sqrt { m ^ { 2 } - n ^ { 2 } } } \\end{array} \\right) : \\left( m - \\sqrt { m ^ { 2 } - n ^ { 2 } } \\right){/tex}</span>&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11(1)</span></div><div class="question-text"><p>Find the sum of the series up to n terms&nbsp;5 + 55 + 555 + &hellip;&nbsp;</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Now,to find sum = 5 + 55 + 555 + &hellip;. n terms.<br />
= <span class="math-tex">{tex}\\frac{5}{9}{/tex}</span>&nbsp;[9 + 99 + 999 + &hellip;. n terms]<br />
= <span class="math-tex">{tex}\\frac{5}{9}{/tex}</span>&nbsp;[(10 -&nbsp;1) + (100 -&nbsp;1) + (1000 -&nbsp;1) + &hellip; n terms]<br />
= <span class="math-tex">{tex}\\frac{5}{9}{/tex}</span>&nbsp;[10 + 100 + 1000 &hellip;.. &ndash; (1 + 1 + &hellip; 1)]<br />
= <span class="math-tex">{tex}\\frac{5}{9}{/tex}</span>&nbsp;[10(10<sup>n</sup>&nbsp;-&nbsp;1)/(10 -&nbsp;1) + (1 + 1 + &hellip; n times)]<br />
= <span class="math-tex">{tex}\\frac{50}{81}{/tex}</span>(10<sup>n</sup>&nbsp;&ndash; 1)&nbsp;-&nbsp;<span class="math-tex">{tex}\\frac{5n}{9}{/tex}</span>&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11(2)</span></div><div class="question-text"><p>Find the sum of the series up to n terms&nbsp;.6 +. 66 + .666+&hellip;</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The given sum is not in GP but we can write it as follows: -<br />
Sum = .6 + .66 + .666 + &hellip;to n terms<br />
= 6(0.1) + 6(0.11) + 6(0.111) + &hellip;to n terms<br />
taking 6 common<br />
= 6[0.1 + 0.11 + 0.111 + &hellip;to n terms]<br />
divide &amp; multiply by 9,we get<br />
= <span class="math-tex">{tex}(\\frac{6}{9}){/tex}</span>[9(0.1 + 0.11 + 0.111 + &hellip;to n terms)]<br />
= <span class="math-tex">{tex}(\\frac{6}{9}){/tex}</span>[0.9 + 0.99 + 0.999 + &hellip;to n terms]<br />
=&nbsp;<span class="math-tex">{tex}\\frac{6}{9}\\left[\\left(\\frac{9}{10}\\right)+\\left(\\frac{99}{100}\\right)+\\left(\\frac{999}{1000}\\right)+\\ldots \\text { to } n \\text { terms }\\right]{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac{6}{9}\\left[\\left(1-\\frac{1}{10}\\right)+\\left(1-\\frac{1}{100}\\right)+\\left(1-\\frac{1}{1000}\\right)+\\ldots \\text { to } n \\text { terms }\\right]{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac{6}{9}[\\{1+1+1+\\ldots \\text { to } n \\text { terms }\\}{/tex}</span>&nbsp;-&nbsp;<span class="math-tex">{tex}\\left.\\left\\{\\frac{1}{10}+\\frac{1}{100}+\\frac{1}{1000}+\\ldots \\text { to } n \\text { terms }\\right\\}\\right]{/tex}</span>&nbsp;<br />
=&nbsp;<span class="math-tex">{tex}\\frac{6}{9}\\left[n-\\left\\{\\frac{1}{10}+\\frac{1}{100}+\\frac{1}{1000}+\\ldots \\text { to } n \\text { terms }\\right\\}\\right]{/tex}</span>&nbsp;<br />
Since&nbsp;<span class="math-tex">{tex}\\frac{1}{10}+\\frac{1}{100}+\\frac{1}{1000}+\\ldots \\text { to } n \\text { terms }{/tex}</span>&nbsp;is in GP with&nbsp;<br />
first term(a) = <span class="math-tex">{tex}\\frac{1}{10}{/tex}</span><br />
common ratio(r) =&nbsp;<span class="math-tex">{tex}\\frac{10^{-2}}{10^{-1}}{/tex}</span>&nbsp;= 10&nbsp;<sup>- 1</sup>&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac{1}{10}{/tex}</span><br />
We know that<br />
Sum of n terms =&nbsp;<span class="math-tex">{tex}\\frac{a\\left(1-r^{n}\\right)}{1-r}{/tex}</span>&nbsp;[As r &lt; 1]<br />
Substituting valuevalue of a &amp; r<br />
<span class="math-tex">{tex}\\frac{1}{10}+\\frac{1}{100}+\\frac{1}{1000}+\\ldots \\text { to } n \\text { terms }=\\frac{a\\left(1-r^{n}\\right)}{1-r}{/tex}</span>&nbsp;<br />
=&nbsp;<span class="math-tex">{tex}\\frac{\\frac{1}{10}\\left(1-\\left(\\frac{1}{10}\\right)^{n}\\right)}{\\left(1-\\frac{1}{10}\\right)}{/tex}</span>&nbsp;<br />
=&nbsp;<span class="math-tex">{tex}\\frac{\\frac{1}{10}\\left(1-\\left(\\frac{1}{10}\\right)^{n}\\right)}{\\frac{9}{10}}{/tex}</span>&nbsp;<br />
=&nbsp;<span class="math-tex">{tex}\\frac{1\\left(1-10^{-n}\\right)}{9}{/tex}</span>&nbsp;</p>

<p>Therefore, Sum =&nbsp;<span class="math-tex">{tex}\\frac{6}{9}\\left[n-\\frac{1\\left(1-10^{-n}\\right)}{9}\\right]{/tex}</span>&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Find the 20<sup>th</sup> term of the series <span class="math-tex">{tex}2 \\times 4 + 4 \\times 6 + 6 \\times 8 + \\ldots \\ldots \\ldots +{/tex}</span>&nbsp;n terms.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given: <span class="math-tex">{tex}2 \\times 4 + 4 \\times 6 + 6 \\times 8 + \\ldots \\ldots \\ldots + n{/tex}</span>terms<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;a<sub>n</sub> = (n<sup>th</sup> term of 2, 4, 6, ......) (n<sup>th</sup> term of 4, 6, 8, ........)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;a<sub>n</sub> = [2 + (n - 1)2] [4 + (n - 1)2] = 2n(2n + 2)<br />
<span class="math-tex">{tex}\\therefore a _ { 20 } = 2 \\times 20 ( 2 \\times 20 + 2 ) = 40 \\times 42 = 1680{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>A farmer buys a used tractor for ₹12000. He pays ₹ 6000 cash and agrees to pay the balance in annual installments of ₹ 500 plus 12% interest on the unpaid amount. How much will the tractor cost him?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Total cost of the tractor = ₹ 12000, Cash paid = ₹ 6000<br />
Balance to be paid = 12000 &ndash; 6000 = ₹ 6000<br />
Annual installment = ₹ 500<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Number of installment&nbsp;=&nbsp;<span class="math-tex">{tex}{{6000} \\over {500}}{/tex}</span>&nbsp;= 12<br />
Interest of 1<sup>st</sup> installment = <span class="math-tex">{tex}\\frac { 6000 \\times 12 \\times 1 } { 100 }{/tex}</span>&nbsp;= ₹ 720<br />
Amount of 1<sup>st</sup> installment = 500 + 720 = ₹ 1220<br />
Interest of 2<sup>nd</sup> installment = <span class="math-tex">{tex}\\frac { 5500 \\times 12 \\times 1 } { 100 }{/tex}</span>&nbsp;= ₹ 660<br />
Amount of 2<sup>nd</sup> installment = 500 + 660 = ₹ 1160<br />
Interest of 3<sup>rd</sup> installment = <span class="math-tex">{tex}\\frac { 5000 \\times 12 \\times 1 } { 100 }{/tex}</span>&nbsp;= ₹ 600<br />
Amount of 3<sup>rd</sup> installment = 500 + 600 = ₹ 1100<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Sequence of installments is 1220, 1160, 1100, ...&nbsp;which is&nbsp;in A.P<br />
Here, a = 1220, d = 1160 - 1220 = -60&nbsp;&nbsp;and n = 12<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;S<sub>n</sub>&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac n2{/tex}</span>[2a + (n - 1) d]<br />
= <span class="math-tex">{tex}\\frac {12}2{/tex}</span>[ 2 <span class="math-tex">{tex}\\times{/tex}</span> 1220 + (12 - 1) <span class="math-tex">{tex}\\times{/tex}</span> (-60)]&nbsp;<br />
= 6 [2440 - 660] = ₹ 10680<br />
Therefore, the total cost of tractor is (10680 + 6000) = ₹ 16680</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>Shamshad Ali buys a scooter for ₹ 22000. He pays ₹ 4000 cash and agrees to pay the balance in annual installment of ₹ 1000 plus 10% interest on the unpaid amount. How much will the scooter cost him?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Total cost of the scooter = ₹ 22000, Cash paid = ₹ 4000<br />
Balance to be paid&nbsp;= 22000 &ndash; 4000 = ₹ 18000<br />
Annual installment = ₹ 1000<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Number of installment&nbsp;=&nbsp;<span class="math-tex">{tex}{{18000} \\over {1000}}{/tex}</span>&nbsp;= 18<br />
Interest of 1<sup>st</sup> installment = <span class="math-tex">{tex}\\frac { 18000 \\times 10 \\times 1 } { 100 }{/tex}</span>&nbsp;= ₹ 1800<br />
Amount of 1<sup>st</sup> installment = 1000 + 1800 = ₹ 2800<br />
Interest of 2<sup>nd</sup> installment = <span class="math-tex">{tex}\\frac { 17000 \\times 10 \\times 1 } { 100 }{/tex}</span>&nbsp;= ₹ 1700<br />
Amount of 2<sup>nd</sup> installment = 1000 + 1700 = ₹ 2700<br />
Interest of 3<sup>rd</sup> installment = <span class="math-tex">{tex}\\frac { 16000 \\times 10 \\times 1 } { 100 }{/tex}</span>&nbsp;= ₹ 1600<br />
Amount of 3<sup>rd</sup> installment = 1000 + 1600 = ₹ 2600<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Sequence of installments is 2800, 2700, 2600, &hellip;&nbsp;in A.P<br />
Here, a = 2800, d = 2700 - 2800 = -100&nbsp;&nbsp;and n = 18<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;S<sub>n&nbsp;</sub>=&nbsp;<span class="math-tex">{tex}\\frac n2{/tex}</span>[2a + (n - 1) d] = <span class="math-tex">{tex}\\frac {18}2{/tex}</span> [2 <span class="math-tex">{tex}\\times{/tex}</span> 2800 + (18 - 1) <span class="math-tex">{tex}\\times{/tex}</span> (-100)]<br />
= 9 [5600 &ndash; 1700] = ₹ 35100<br />
Therefore, the total cost of tractor is (35100 + 4000) = ₹ 39100</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 15</span></div><div class="question-text"><p>A person writes a letter to four of his friends. He asks each one of them to copy the letter and mail to four different persons with instruction that they move the chain similarly. Assuming that the chain is not broken and that it costs 50 paise to mail one letter. Find the amount spent on the postage when 8<sup>th</sup> set of letter is mailed.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Total letters in the first set = 4, Total letters in the second set = 4<sup>2</sup> = 16</p>

<p>Total letters in the third set = 4<sup>3</sup> = 64</p>

<p><span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Sequence of letters is 4, 16, 64, &hellip;&hellip;&hellip;. &nbsp;in G.P.</p>

<p>Here a = 4,&nbsp;<span class="math-tex">{tex}r = \\frac { 16 } { 4 } = 4{/tex}</span>&nbsp;and n = 8&nbsp;</p>

<p><span class="math-tex">{tex}\\therefore \\quad S _ { n } = \\frac { a \\left( r ^ { n } - 1 \\right) } { r - 1 }{/tex}</span></p>

<p><span class="math-tex">{tex}= \\frac { 4 \\left( 4 ^ { 8 } - 1 \\right) } { 8 - 1 }{/tex}</span></p>

<p><span class="math-tex">{tex}= \\frac { 4 } { 3 } ( 65536 - 1 ){/tex}</span></p>

<p><span class="math-tex">{tex}= \\frac { 4 } { 3 } \\times 65535 = 87380{/tex}</span></p>

<p>&nbsp;Hence, the total number of letters mailed = 87380</p>

<p>&nbsp;The amount of postage on each letter =&nbsp;50 paise</p>

<p>&nbsp;Therefore total amount spent on postage = <span class="math-tex">{tex}87380 \\times 0.50{/tex}</span>&nbsp;= Rs. 43690.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 16</span></div><div class="question-text"><p>A man deposited ₹ 10,000 in a bank at the rate of 5% simple interest annually. Find the amount in 15<sup>th</sup> year since he deposited the amount and also calculate the total amount after 20 years.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Total amount deposited = ₹ 10000, Rate of interest = 5% per annum<br />
Interest of first year = <span class="math-tex">{tex}\\frac { 10000 \\times 5 \\times 1 } { 100 }{/tex}</span>&nbsp;= ₹ 500<br />
Here a = 1000, d = 500&nbsp;<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Amount in 15<sup>th</sup> year = a<sub>15</sub> = 10000 + (15 - 1)&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;500&nbsp;&nbsp;= 10000 + 7000 = ₹ 17000<br />
Total amount after 20 years = Amount in the 21<sup>st</sup>&nbsp;year = <span class="math-tex" data-widget="mathjaxlatex" style="display:inline-block">a<sub>21</sub> = 1000 + (21 - 1)500</span><br />
= 10000 + 10000 = ₹20000</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 17</span></div><div class="question-text"><p>A manufacturer reckons that the value of a machine, which costs him ₹ 15625, will depreciate each year by 20%. Find the estimated value at the end of 5 years.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Present value of the machine = ₹ 15625<br />
Rate of depreciation = 20%<br />
After 1 year value of machine = 15625 - 15625&nbsp;<span class="math-tex">{tex} \\times \\frac { 20 } { 100 }{/tex}</span>&nbsp;= 15625 &ndash; 3125 = ₹ 12500<br />
After 2 year value of machine = 12500 - 12500&nbsp;<span class="math-tex">{tex} \\times \\frac { 20 } { 100 }{/tex}</span>&nbsp;= 12500 &ndash; 2500 = ₹ 10000<br />
After 3 year value of machine = 10000 - 10000&nbsp;<span class="math-tex">{tex} \\times \\frac { 20 } { 100 }{/tex}</span>&nbsp;= 10000 &ndash; 2000 = ₹ 8000<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Sequence of values of machine after depreciation is 12500, 10000, 8000, ...&nbsp;is a&nbsp;G.P.<br />
Here a = 12500,&nbsp;r =&nbsp;<span class="math-tex">{tex}\\frac { 10000 } { 12500 } = \\frac { 4 } { 5 }{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;a<sub>5</sub> = ar<sup>4</sup> =&nbsp;12500&nbsp;<span class="math-tex">{tex} \\times \\left( \\frac { 4 } { 5 } \\right) ^4{/tex}</span>&nbsp;= 12500 <span class="math-tex">{tex}\\times \\frac { 256 } { 625 }{/tex}</span>&nbsp;= ₹ 5120<br />
Therefore, the value of machine at the end of 5 years is ₹ 5120</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 18</span></div><div class="question-text"><p>150 workers were engaged to finish a job in a certain number&nbsp;of days. 4 workers dropped out on the second day, 4 more workers dropped out on third day and so on. It took 8 more days to finish the work. Find the number&nbsp;of days in which the work was completed.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given, a = 150, d = -4&nbsp;<br />
<span class="math-tex">{tex}S _ { n } = \\frac { n } { 2 } [ 2 \\times 150 + ( n - 1 ) ( - 4 ) ]{/tex}</span><br />
If total works who would have worked all n days 150(n-8)<br />
According to question,&nbsp;<span class="math-tex">{tex} \\frac { n } { 2 } [ 300 + ( n - 1 ) ( - 4 ) ] = 150 ( n - 8 ){/tex}</span><br />
Hence,&nbsp;n = 25</p></div></div></div>
`;

export default { EXAMPLES_HTML, EX8_1_HTML, EX8_2_HTML, MISC_HTML };