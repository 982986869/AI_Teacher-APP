// linearInequalitiesContent.js
// NCERT Solutions — Class 11 Mathematics, Chapter 5: Linear Inequalities.
//
//   EXAMPLES_HTML  -> worked examples (15 cards)
//   EX5_1_HTML     -> Exercise 5.1 (20 cards)
//   MISC_HTML      -> Miscellaneous Exercise (14 cards)
//
// Math uses {tex}...{/tex} (LaTeX), rendered by the Ncert2Screen WebView's
// tex-mml-chtml MathJax build.

export const EXAMPLES_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(1)</span></div><div class="question-text"><p>Solve 30 x &lt; 200 when&nbsp;x is a natural number.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We are given 30 x &lt; 200<br />
or&nbsp;<span class="math-tex">{tex}\\frac{30 x}{30}&lt;\\frac{200}{30}{/tex}</span><br />
i.e., x &lt; 20 / 3.<br />
x &lt; 6.66 for x&nbsp;<span class="math-tex">{tex}\\in{/tex}</span>R<br />
When x&nbsp;<span class="math-tex">{tex}\\in{/tex}</span>&nbsp;Natural&nbsp;number,<br />
In this case, the following values of x make the statement true.<br />
1, 2, 3, 4, 5, 6.<br />
The solution set of the given linear inequality is {1, 2, 3, 4, 5, 6}.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(2)</span></div><div class="question-text"><p>Solve 30 x &lt; 200 when&nbsp;x is an integer.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We are given 30 x &lt; 200<br />
<span class="math-tex">{tex}\\Leftrightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac{30 x}{30}&lt;\\frac{200}{30}{/tex}</span>&nbsp;<br />
i.e., x &lt; 20 / 3.<br />
When x is an integer, the solutions of the given inequality are<br />
..., &ndash; 3, &ndash;2, &ndash;1, 0, 1, 2, 3, 4, 5, 6<br />
The solution set of the inequality is {...,&ndash;3, &ndash;2,&ndash;1, 0, 1, 2, 3, 4, 5, 6}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(1)</span></div><div class="question-text"><p>Solve 5x &ndash; 3 &lt; 3x +1 when&nbsp;x is an integer.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have, 5x &ndash;3 &lt; 3x + 1<br />
or 5x &ndash;3 + 3 &lt; 3x +1 +3<br />
or 5x &lt; 3x +4<br />
or 5x &ndash; 3x &lt; 3x + 4 &ndash; 3x&nbsp;<br />
or 2x &lt; 4<br />
or x &lt; 2&nbsp;<br />
x&nbsp;&lt; 2 is a solution for x<span class="math-tex">{tex}\\in{/tex}</span>R<br />
When x is an integer, the solutions of the given inequality are<br />
{...............&nbsp;&ndash; 4, &ndash; 3, &ndash; 2, &ndash; 1, 0, 1}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(2)</span></div><div class="question-text"><p>Solve 5x &ndash; 3 &lt; 3x +1 when&nbsp;x is a real number.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have, 5x &ndash;3 &lt; 3x + 1<br />
or 5x &ndash;3 + 3 &lt; 3x +1 +3&nbsp;<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;5x &lt; 3x +4<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 5x &ndash; 3x &lt; 3x + 4 &ndash; 3x&nbsp;<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2x &lt; 4<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x &lt; 2 &nbsp;<br />
Therefore, the solution set of the inequality is x <span class="math-tex">{tex}\\in{/tex}</span> (&ndash; <span class="math-tex">{tex}\\infty{/tex}</span>, 2).</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Solve 4x + 3 &lt; 6x +7.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,<br />
4x + 3 &lt; 6x + 7<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;4x + 3&nbsp;- 3 &lt; 6x + 7 - 3&nbsp;<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 4x &lt; 6x + 4<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 4x &ndash; 6x &lt; 6x + 4 &ndash; 6x<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> &ndash; 2x &lt; 4 or x &gt; &ndash; 2<br />
i.e., all the real numbers which are greater than &ndash;2, are the solutions of the given inequality.<br />
Hence, the solution set is (&ndash;2, <span class="math-tex">{tex}\\infty{/tex}</span>).</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Solve&nbsp;<span class="math-tex">{tex}\\frac{5-2 x}{3} \\leq \\frac{x}{6}-5{/tex}</span>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have<br />
<span class="math-tex">{tex}\\frac{5-2 x}{3} \\leq \\frac{x}{6}-5{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 2 (5 &ndash; 2x) <span class="math-tex">{tex}\\leq{/tex}</span> x &ndash; 30<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 10 &ndash; 4x <span class="math-tex">{tex}\\leq{/tex}</span> x &ndash; 30<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> &ndash; 5x <span class="math-tex">{tex}\\leq{/tex}</span> &ndash; 40,<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x <span class="math-tex">{tex}\\ge{/tex}</span> 8<br />
i.e., x <span class="math-tex">{tex}\\in{/tex}</span> [8, <span class="math-tex">{tex}\\infty{/tex}</span>).&nbsp; &nbsp; &nbsp;<br />
Hence, Solution set =&nbsp;[8, <span class="math-tex">{tex}\\infty{/tex}</span>).&nbsp; &nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Solve 7x + 3 &lt; 5x + 9. Show the graph of the solutions on number line.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have&nbsp;7x + 3 &lt; 5x + 9<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;7x + 3 - 3 &lt; 5x + 9 - 3&nbsp;<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;7x &lt; 5x + 6<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2x &lt; 6<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x &lt; 3<br />
The graphical representation of the solutions are given in the figure<br />
<img alt="" data-imgur-src="90NzJ8s.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/90NzJ8s.png" style="width: 200px; height: 36px;" /></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Solve <span class="math-tex">{tex}\\frac{3 x-4}{2} \\geq \\frac{x+1}{4}-1{/tex}</span>. Show the graph of the solutions on number line.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have<br />
<span class="math-tex">{tex}\\frac{3 x-4}{2} \\geq \\frac{x+1}{4}-1{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac{3 x-4}{2} \\geq \\frac{x-3}{4}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 2 (3x &ndash; 4) <span class="math-tex">{tex}\\ge{/tex}</span> (x &ndash; 3)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 6x &ndash; 8 <span class="math-tex">{tex}\\ge{/tex}</span> x &ndash; 3<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 5x <span class="math-tex">{tex}\\ge{/tex}</span> 5<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x <span class="math-tex">{tex}\\ge{/tex}</span> 1<br />
The graphical representation of solutions is given in the figure<br />
<img alt="" data-imgur-src="cRzo3JV.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/cRzo3JV.png" style="width: 200px; height: 37px;" /></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>The marks obtained by a student of Class XI in first and second terminal examination are 62 and 48, respectively. Find the minimum marks he should get in the annual examination to have an average of at least 60 marks.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let x be the marks obtained by student in the annual examination.&nbsp;<br />
Average =&nbsp;<span class="math-tex">{tex}\\frac{62+48+x}{3} \\geq 60{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac{62+48+x}{3} \\geq 60{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 110 + x&nbsp;<span class="math-tex">{tex}\\ge{/tex}</span>&nbsp;60<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp; x&nbsp;<span class="math-tex">{tex}\\ge{/tex}</span>&nbsp;70<br />
Thus, the student must obtain a minimum of 70 marks to get an average of at least 60 marks.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find all pairs of consecutive odd natural numbers, both of which are larger&nbsp;than 10, such that their sum is less than 40.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let&nbsp;x&nbsp;be the smaller of the two consecutive odd natural numbers. Then the other odd integer is x+2.<br />
It is given that both the natural number are greater than 10 and their sum is less than 40.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;x &gt; 10&nbsp;and,&nbsp; x + x + 2 &lt; 40<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;&nbsp;x &gt; 10 and 2x &lt; 38<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x &gt; 10 and x &lt;19<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;10 &lt; x &lt; 19<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x = 11, 13, 15, 17 [<span class="math-tex">{tex}\\because{/tex}</span>&nbsp;x is an odd number]<br />
Hence, the required pairs of odd natural number are (11, 13), (13, 15), (15, 17) and (17, 19).</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Solve &ndash; 8 <span class="math-tex">{tex}\\le{/tex}</span> 5x &ndash; 3 &lt; 7.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that,&nbsp; &ndash; 8 <span class="math-tex">{tex}\\le{/tex}</span> 5x &ndash;3 &lt; 7&nbsp;<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp; &ndash; 8+3&nbsp;<span class="math-tex">{tex}\\le{/tex}</span> 5x &ndash;3+3&lt; 7+3<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> &ndash;5 <span class="math-tex">{tex}\\le{/tex}</span> 5x &lt; 10<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> &ndash;1 <span class="math-tex">{tex}\\le{/tex}</span> x &lt; 2<br />
<strong><span class="math-tex">{tex}\\Rightarrow{/tex}</span></strong>&nbsp;x&nbsp;<span class="math-tex">{tex}\\in{/tex}</span>&nbsp;[-1,2)</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Solve: - 5&nbsp;<span class="math-tex">{tex}\\leq \\frac{5-3 x}{2} \\leq{/tex}</span>&nbsp;8.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have - 5&nbsp;<span class="math-tex">{tex}\\leq \\frac{5-3 x}{2} \\leq 8{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> &ndash;10 <span class="math-tex">{tex}\\le{/tex}</span> 5 &ndash; 3x <span class="math-tex">{tex}\\le{/tex}</span> 16<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> &ndash;10 - 5&nbsp;<span class="math-tex">{tex}\\le{/tex}</span> 5 &ndash; 3x - 5&nbsp;<span class="math-tex">{tex}\\le{/tex}</span> 16 -5<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> &ndash; 15 <span class="math-tex">{tex}\\le{/tex}</span> &ndash; 3x <span class="math-tex">{tex}\\le{/tex}</span> 11<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp; 5&nbsp;<span class="math-tex">{tex}\\ge{/tex}</span>&nbsp;x&nbsp;<span class="math-tex">{tex}\\ge{/tex}</span>&nbsp;-&nbsp;<span class="math-tex">{tex}\\frac{11}{3}{/tex}</span><br />
which can be written as&nbsp;<span class="math-tex">{tex}\\frac{-11}{3} \\leq x \\leq{/tex}</span>&nbsp;5<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x&nbsp;<span class="math-tex">{tex}\\in{/tex}</span>&nbsp;[&nbsp;-&nbsp;<span class="math-tex">{tex}\\frac{11}{3}{/tex}</span>, 5]</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Solve the system of inequalities:</p>

<ol start="1" style="list-style-type: lower-roman;">
	<li>3x &ndash; 7 &lt; 5 + x</li>
	<li>11 &ndash; 5 x <span class="math-tex">{tex}\\le{/tex}</span> 1</li>
</ol>

<p>and represent the solutions on the number line.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given,<br />
3x &ndash; 7 &lt; 5 + x&nbsp; &nbsp;.....&nbsp;(1)&nbsp;<br />
11 &ndash; 5 x <span class="math-tex">{tex}\\le{/tex}</span> 1&nbsp; &nbsp;&nbsp;&nbsp;.....&nbsp;(2)&nbsp;<br />
From inequality (1), we have<br />
3x &ndash; 7 &lt; 5 + x<br />
or x &lt; 6 ....(3)<br />
Also, from inequality (2), we have<br />
11 &ndash; 5 x <span class="math-tex">{tex}\\le{/tex}</span> 1&nbsp;<br />
or &ndash; 5 x <span class="math-tex">{tex}\\le{/tex}</span> &ndash; 10 i.e., x <span class="math-tex">{tex}\\ge{/tex}</span> 2 .....(4)<br />
If we draw the graph of inequalities (3) and (4) on the number line, we see that the values of x, which are common to both, are shown by a bold line in the figure.<br />
<img alt="" data-imgur-src="LBtBS3F.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/LBtBS3F.png" style="width: 220px; height: 64px;" /><br />
Thus, the solution of the system are real numbers x lying between 2 and 6 including 2, i.e.,<br />
2 <span class="math-tex">{tex}\\le{/tex}</span> x &lt; 6</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>In an experiment, a solution of hydrochloric acid is to be kept between 30&deg; and 35&deg; Celsius. What is the range of temperature in degree Fahrenheit if conversion&nbsp;formula is given by C =&nbsp;<span class="math-tex">{tex}\\frac{5}{9}{/tex}</span>&nbsp;(F &ndash; 32), where C and F represent temperature in degree Celsius and degree Fahrenheit, respectively.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>It is given that 30 &lt; C &lt; 35.<br />
Put,&nbsp;C =&nbsp;<span class="math-tex">{tex}\\frac{5}{9}{/tex}</span>&nbsp;(F &ndash; 32), we get<br />
30 &lt;&nbsp;<span class="math-tex">{tex}\\frac{5}{9}{/tex}</span>&nbsp;(F &ndash; 32) &lt; 35,<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac{9}{5}{/tex}</span>&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;(30) &lt; (F &ndash; 32) &lt;&nbsp;<span class="math-tex">{tex}\\frac{9}{5}{/tex}</span>&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;(35)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 54 + 32 &lt; (F &ndash; 32) + 32 &lt; 63 + 32<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;86 &lt; F &lt; 95.<br />
Thus, the required range of temperature is between 86&deg; F and 95&deg; F.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>A manufacturer has 600 litres of a 12% solution of acid. How many litres of a 30% acid solution must be added to it so that acid content in the resulting mixture will be more than 15% but less than 18%?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let x liters of 30% acid solution is required to be added to the mixture.<br />
Then Total mixture = (x + 600) litres<br />
Therefore,&nbsp;30% x + 12% of 600 &gt; 15% of (x + 600)<br />
&nbsp;&amp;&nbsp;30% x + 12% of 600 &lt; 18% of (x + 600)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac{30 x}{100}+\\frac{12}{100}(600)&gt;\\frac{15}{100}{/tex}</span>&nbsp;(x + 600)&nbsp; and&nbsp;<span class="math-tex">{tex}\\frac{30 x}{100}+\\frac{12}{100}(600)&lt;\\frac{18}{100}{/tex}</span>&nbsp;(x + 600)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>30x + 7200 &gt; 15x + 9000&nbsp; and 30x + 7200 &lt; 18x + 10800<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 15x &gt; 1800 and 12x &lt; 3600<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x &gt; 120 and x &lt; 300,<br />
i.e. 120 &lt; x &lt; 300<br />
Thus, the number of litres of the 30% solution of acid will have to be more than 120 litres but less than 300 litres.</p></div></div></div>
`;

export const EX5_1_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(1)</span></div><div class="question-text"><p>Solve: 24x &lt; 100, when x is a natural number.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have 24x &lt; 100<br />
<span class="math-tex">{tex}\\Rightarrow \\quad \\frac{24 x}{24}&lt;\\frac{100}{24}{/tex}</span>&nbsp;[dividing both sides by 24]<br />
<span class="math-tex">{tex}\\Rightarrow \\quad x&lt;\\frac{25}{6}{/tex}</span><br />
When x is a natural number, then solutions of the inequality are given by&nbsp;<span class="math-tex">{tex}x&lt;\\frac{25}{6}{/tex}</span>&nbsp;i.e., all natural numbers x which are less than&nbsp;<span class="math-tex">{tex}\\frac{25}{6}.{/tex}</span><br />
Hence, the solution set&nbsp;is {1, 2, 3, 4}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(2)</span></div><div class="question-text"><p>Solve: 24x &lt; 100, when x is an integer.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have, 24x &lt; 100<br />
<span class="math-tex">{tex}\\Rightarrow \\quad \\frac{24 x}{24}&lt;\\frac{100}{24}{/tex}</span>&nbsp;[dividing both sides by 24]<br />
<span class="math-tex">{tex}\\Rightarrow \\quad x&lt;\\frac{25}{6}{/tex}</span><br />
When x is an integer.<br />
Hence the solution set of inequality is {...., -4, -3, -2, -1, 0, 1, 2, 3, 4}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(1)</span></div><div class="question-text"><p>Solve &ndash; 12x &gt; 30, when&nbsp;x is a natural number.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>It is given in the question that,<br />
&ndash; 12x &gt; 30<br />
Dividing the inequality by -12 into both sides we get,<br />
<span class="math-tex">{tex}x&lt;\\frac{-5}{2}{/tex}</span><br />
When x is a natural integer.<br />
It can be clearly observed that there is no natural number less than<span class="math-tex">{tex}\\frac{-5}{2}{/tex}</span>because&nbsp;<span class="math-tex">{tex}\\frac{5}{-2}{/tex}</span>&nbsp;&nbsp;is a negative number and natural numbers are positive numbers.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> There would be no solution to the given inequality when x is a natural number.</p>

<p>solution set =&nbsp;<span class="math-tex">{tex}\\phi{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2(2)</span></div><div class="question-text"><p>Solve &ndash;12x &gt; 30, when x is an integer.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>It is given in the question that,<br />
&ndash; 12x &gt; 30<br />
Dividing the inequality by -12 on both sides we get,<br />
<span class="math-tex">{tex}x&lt;\\frac{-5}{2}{/tex}</span><br />
When x is an integer<br />
It can be clearly observed that the integer number less than<span class="math-tex">{tex}\\frac{-5}{2}{/tex}</span>are&hellip;, -5, -4, -3.<br />
Thus, solution of &ndash;12x &gt; 30 is &hellip;, -5, -4, -3, when x is an integer.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;solution set = {&hellip;, -5, -4, -3}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(1)</span></div><div class="question-text"><p>Solve: 5x &ndash; 3 &lt; 7, when&nbsp;x is an integer.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>It is given in the question that,<br />
5x &ndash; 3 &lt; 7<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;5x &ndash; 3 + 3 &lt; 7 + 3<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;5x &lt; 10<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac{5 x}{5}&lt;\\frac{10}{5}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x &lt; 2, When x is an integer<br />
It can be clearly observed that the integer number less than 2 are&hellip;, -2, -1, 0, 1.<br />
Thus, solution of 5x &ndash; 3 &lt; 7 is &hellip;,-2, -1, 0, 1, when x is an integer.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;solution set = {&hellip;, -2, -1, 0, 1}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(2)</span></div><div class="question-text"><p>Solve: 5x &ndash; 3 &lt; 7, when&nbsp;x is a real number.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>It is given in the question that,<br />
5x &ndash; 3 &lt; 7<br />
Adding 3 both side we get,<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 5x &ndash; 3 + 3 &lt; 7 + 3<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> 5x &lt; 10<br />
Dividing both sides by 5 we get,<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac{5 x}{5}&lt;\\frac{10}{5}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x &lt; 2<br />
When x is a real number,<br />
Solution set = (-<span class="math-tex">{tex}\\infty{/tex}</span>, 2)</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(1)</span></div><div class="question-text"><p>Solve 3x + 8 &gt; 2, when&nbsp;x is an integer.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>It is given in the question that,<br />
3x + 8 &gt; 2<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;3x + 8 &ndash; 8 &gt;2 &ndash; 8<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;3x &gt;- 6<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac{3 x}{3}&gt;\\frac{-6}{3}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x &gt; -2, where&nbsp;x is an integer<br />
It can be clearly observed that the integer number greater than -2 are -1, 0, 1, 2,...<br />
Thus, solution of&nbsp;3x + 8 &gt; 2 is -1, 0, 1, 2,&hellip; when x is an integer.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;solution set = {-1, 0, 1, 2, &hellip;}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(2)</span></div><div class="question-text"><p>Solve 3x + 8 &gt; 2, when x is a real number.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>It is given in the question that,<br />
3x + 8 &gt;2<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;3x + 8 &ndash; 8 &gt; 2 &ndash; 8<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;3x &gt; - 6<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;<span class="math-tex">{tex}\\frac{3 x}{3}&gt;\\frac{-6}{3}{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x &gt; -2, where&nbsp;x is a real number.<br />
It can be clearly observed that the solutions of&nbsp;3x + 8 &gt; 2 will be given by x &gt; -2 which states that all the real numbers that are greater than -2.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;solution set = (-2, <span class="math-tex">{tex}\\infty{/tex}</span>)&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Solve&nbsp;the inequality&nbsp;4x + 3 &lt; 5x + 7 for real x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here 4x + 3 &lt; 5x +7, 4x - 5x &lt; 7 - 3<br />
<span class="math-tex">{tex} \\Rightarrow - x &lt; 4{/tex}</span><br />
Dividing both sides by -1, we have<br />
<span class="math-tex">{tex}\\frac{{ - x}}{{ - 1}} &gt; \\frac{4}{{ - 1}}{/tex}</span><span class="math-tex">{tex} \\Rightarrow x &gt; - 4{/tex}</span><br />
Thus the solution set is <span class="math-tex">{tex}( - 4,\\infty ){/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Solve&nbsp;the inequality&nbsp;3x &ndash; 7 &gt; 5x &ndash; 1 for real x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here 3x - 7 &gt; 5x - 1<br />
<span class="math-tex">{tex} \\Rightarrow 3x - 5x &gt; - 1 + 7{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow - 2x &gt; 6{/tex}</span><br />
Dividing both sides by -2,&nbsp;we have<br />
<span class="math-tex">{tex}\\frac{{ - 2x}}{{ - 2}} &lt; \\frac{6}{{ - 2}} \\Rightarrow x &lt; - 3{/tex}</span><br />
Thus the solution set is <span class="math-tex">{tex}( - \\infty , - 3){/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Solve&nbsp;the inequality&nbsp;3(x &ndash; 1) <span class="math-tex">{tex}\\leq{/tex}</span> 2 (x &ndash; 3) for real x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>It is given in the question that,<br />
3(x &ndash; 1) <span class="math-tex">{tex}\\leq{/tex}</span> 2 (x &ndash; 3)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;3x &ndash; 3 <span class="math-tex">{tex}\\leq{/tex}</span> 2x &ndash; 6<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;3x &ndash; 3+ 3 <span class="math-tex">{tex}\\leq{/tex}</span> 2x &ndash; 6+ 3<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;3x <span class="math-tex">{tex}\\leq{/tex}</span> 2x &ndash; 3<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;3x &ndash; 2x <span class="math-tex">{tex}\\leq{/tex}</span> 2x &ndash; 3 &ndash; 2x<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> x <span class="math-tex">{tex}\\leq{/tex}</span> -3<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;The solutions of the given inequality are defined by all the real numbers less than or equal to -3.<br />
Thus, the solutions set to the given inequality are&nbsp; (-<span class="math-tex">{tex}\\infty {/tex}</span>, - 3]&nbsp;</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Solve&nbsp;the inequality&nbsp;3 (2 &ndash; x) <span class="math-tex">{tex}\\ge{/tex}</span> 2 (1 &ndash; x) for real x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}3(2 - x) \\geqslant 2(1 - x){/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 6 - 3x \\geqslant 2 - 2x{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow - 3x + 2x \\geqslant 2 - 6{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow - x \\leqslant - 4{/tex}</span><br />
Dividing both sides by -1, we have<br />
<span class="math-tex">{tex}\\frac{{ - x}}{{ - 1}} &lt; \\frac{{ - 4}}{{ - 1}} \\Rightarrow x \\leqslant 4{/tex}</span><br />
Thus the solution set is <span class="math-tex">{tex}\\left( { - \\infty ,4} \\right]{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Solve&nbsp;the inequality&nbsp;<span class="math-tex">{tex}x+\\frac{x}{2}+\\frac{x}{3}&lt;11{/tex}</span> for real x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}x + \\frac{x}{2} + \\frac{x}{3} &lt; 11{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{6x + 3x + 2x}}{6} &lt; 11{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{11x}}{6} &lt; 11{/tex}</span><br />
Multiplying both sides by 6, we have<br />
11x &lt; 66<br />
Dividing both sides by 11, we have<br />
x &lt; 6<br />
Thus the solution set is <span class="math-tex">{tex}\\left( { - \\infty ,6} \\right){/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Solve&nbsp;the inequality&nbsp;<span class="math-tex">{tex}\\frac{x}{3}&gt;\\frac{x}{2}+1{/tex}</span> for real x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}\\frac{x}{3} &gt; \\frac{x}{2} + 1{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{x}{3} - \\frac{x}{2} &gt; 1{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{2x - 3x}}{6} &gt; 1{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{ - x}}{6} &gt; 1{/tex}</span><br />
Multiplying both sides by 6, we have<br />
-x &gt; 6<br />
Dividing both sides by -1, we have x &lt; -6<br />
Thus the solution set is <span class="math-tex">{tex}( - \\infty , - 6){/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Solve&nbsp;the inequality&nbsp;<span class="math-tex">{tex}\\frac{3(x-2)}{5} \\leq \\frac{5(2-x)}{3}{/tex}</span> for real x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}\\frac{{3(x - 2)}}{5} \\leqslant \\frac{{5(2 - x)}}{3}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{3x - 6}}{5} \\leqslant \\frac{{10 - 5x}}{3}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{3x}}{5} - \\frac{6}{5} \\leqslant \\frac{{10}}{3} - \\frac{{5x}}{3}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{3x}}{5} + \\frac{{5x}}{3} \\leqslant \\frac{{10}}{3} + \\frac{6}{5}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{9x + 25x}}{{15}} \\leqslant \\frac{{50 + 18}}{{15}}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{34x}}{{15}} \\leqslant \\frac{{68}}{{15}}{/tex}</span><br />
Multiplying both sides by 15, we have<br />
<span class="math-tex">{tex}34x \\leqslant 68{/tex}</span><br />
Dividing both sides by 34, we have<br />
<span class="math-tex">{tex}x \\leqslant 2{/tex}</span><br />
Thus the solution set is <span class="math-tex">{tex}\\left( { - \\infty ,2} \\right]{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Solve&nbsp;the inequality&nbsp;<span class="math-tex">{tex}\\frac{1}{2}\\left(\\frac{3 x}{5}+4\\right) \\geq \\frac{1}{3}(x-6){/tex}</span> for real x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}\\frac{1}{2}\\left( {\\frac{{3x}}{5} + 4} \\right) \\geqslant \\frac{1}{3}(x - 6){/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{3x}}{{10}} + 2 \\geqslant \\frac{x}{3} - 2{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{3x}}{{10}} - \\frac{x}{3} \\geqslant - 2 - 2{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{9x - 10x}}{{30}} \\geqslant - 4{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{ - x}}{{30}} \\geqslant - 4{/tex}</span><br />
Multiplying both sides by 30, we have<br />
<span class="math-tex">{tex} - x \\geqslant - 120{/tex}</span><br />
Dividing both sides by -1, we have<br />
<span class="math-tex">{tex}x \\leqslant 120{/tex}</span><br />
Thus the solution set is <span class="math-tex">{tex}\\left[ { - \\infty ,120} \\right]{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>Solve&nbsp;the inequality&nbsp;2 (2x + 3) &ndash; 10 &lt; 6 (x &ndash; 2) for real x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here 2(2x + 3) - 10 &lt; 6(x - 2)<br />
<span class="math-tex">{tex} \\Rightarrow 4x + 6 - 10 &lt; 6x - 12{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 4x - 4 &lt; 6x - 12{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 4x - 6x &lt; - 12 + 4{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow - 2x &lt; - 8{/tex}</span><br />
Dividing both sides by -2, we have<br />
<span class="math-tex">{tex}\\frac{{ - 2x}}{{ - 2}} &gt; \\frac{{ - 8}}{{ - 2}}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow x &gt; 4{/tex}</span><br />
Thus the solution set is <span class="math-tex">{tex}(4,\\infty ){/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>Solve&nbsp;the inequality&nbsp;37 &ndash; (3x + 5) <span class="math-tex">{tex}\\ge{/tex}</span> 9x &ndash; 8 (x &ndash; 3) for real x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}37 - (3x + 5) \\geqslant 9x - 8(x - 3){/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 37 - 3x - 5 \\geqslant 9x - 8x + 24{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 32 - 3x \\geqslant x + 24{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow - 3x - x \\geqslant 24 - 32{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow - 4x \\geqslant - 8{/tex}</span><br />
Dividing both sides by -4, we have<br />
<span class="math-tex">{tex}\\frac{{ - 4x}}{{ - 4}} \\leqslant \\frac{{ - 8}}{{ - 4}}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow x \\leqslant 2{/tex}</span><br />
Thus the solution set is <span class="math-tex">{tex}\\left( { - \\infty ,2} \\right]{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 15</span></div><div class="question-text"><p>Solve the inequality&nbsp;<span class="math-tex">{tex}\\frac{x}{4}&lt;\\frac{(5 x-2)}{3}-\\frac{(7 x-3)}{5}{/tex}</span> for real x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}\\frac{x}{4} &lt; \\frac{{(5x - 2)}}{3} - \\frac{{(7x - 3)}}{5}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{x}{4} &lt; \\frac{{5x}}{3} - \\frac{2}{3} - \\frac{{7x}}{5} + \\frac{3}{5}{/tex}</span> <span class="math-tex">{tex} \\Rightarrow \\frac{{15x - 100x + 84x}}{{60}} &lt; \\frac{{ - 10 + 9}}{{15}}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{ - x}}{{60}} &lt; \\frac{{ - 1}}{{15}}{/tex}</span><br />
Multiplying both sides by 60, we have<br />
-x &lt; -4<br />
Dividing both sides by -1, we have<br />
x &gt; 4<br />
Thus the solution set is <span class="math-tex">{tex}(4,\\infty ){/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 16</span></div><div class="question-text"><p>Solve&nbsp;the inequality&nbsp;<span class="math-tex">{tex}\\frac{(2 x-1)}{3} \\geq \\frac{(3 x-2)}{4}-\\frac{(2-x)}{5}{/tex}</span> for real x.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here <span class="math-tex">{tex}\\frac{{(2x - 1)}}{3} \\geqslant \\frac{{(3x - 2)}}{4} - \\frac{{(2 - x)}}{5}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{2x}}{3} - \\frac{1}{3} \\geqslant \\frac{{3x}}{4} - \\frac{2}{4} - \\frac{2}{5} + \\frac{x}{5}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{2x}}{3} - \\frac{3x}{4}-\\frac{x}{5}\\geqslant \\ \\frac{-2}{4} - \\frac{2}{5} + \\frac{1}{3}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{40x - 45x - 12x}}{{60}} \\geqslant \\frac{{ - 30 - 24 + 20}}{{60}}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{ - 17x}}{{60}} \\geqslant \\frac{{ - 34}}{{60}}{/tex}</span><br />
Multiplying both sides by 60, we have<br />
<span class="math-tex">{tex} - 17x \\geqslant - 34{/tex}</span><br />
Dividing both sides by -17,&nbsp;we have<br />
<span class="math-tex">{tex}\\frac{{ - 17x}}{{ - 17}} \\leqslant \\frac{{ - 34}}{{ - 17}}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow x \\leqslant 2{/tex}</span><br />
Thus the solution set is <span class="math-tex">{tex}\\left( { - \\infty ,2} \\right]{/tex}</span></p></div></div></div>
`;

export const MISC_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Solve the inequality:&nbsp;2 <span class="math-tex">{tex}\\le{/tex}</span> 3x &ndash; 4 <span class="math-tex">{tex}\\le{/tex}</span> 5</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given inequality&nbsp;2 <span class="math-tex">{tex}\\le{/tex}</span> 3x &ndash; 4 <span class="math-tex">{tex}\\le{/tex}</span> 5<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2 <span class="math-tex">{tex}\\le{/tex}</span> 3x &ndash; 4 <span class="math-tex">{tex}\\le{/tex}</span> 5<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2 + 4 <span class="math-tex">{tex}\\le{/tex}</span> 3x &ndash; 4 + 4 <span class="math-tex">{tex}\\le{/tex}</span> 5 + 4<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;6 <span class="math-tex">{tex}\\le{/tex}</span> 3x <span class="math-tex">{tex}\\le{/tex}</span> 9<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;6/3 <span class="math-tex">{tex}\\le{/tex}</span> 3x/3 <span class="math-tex">{tex}\\le{/tex}</span> 9/3<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;2 <span class="math-tex">{tex}\\le{/tex}</span> x <span class="math-tex">{tex}\\le{/tex}</span> 3<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;all real numbers x greater than or equal to 2 but less than or equal to 3 are a solution of given equality.<br />
x&nbsp;<span class="math-tex">{tex}\\in{/tex}</span>&nbsp;[2, 3]&nbsp; &nbsp; solution set = [2,3]</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Solve the inequality: <span class="math-tex">{tex}6 \\leq- 3 \\ (2x - 4) &lt; 12{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have <span class="math-tex">{tex}6 \\leq - 3(2x - 4) &lt; 12{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 2 \\geq (2x - 4) &gt; - 4 \\Rightarrow 2 \\geq 2x &gt; 0{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow 1 \\geq x &gt; 0 \\Rightarrow 0 &lt; x \\leq 1{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Solve the inequality:&nbsp;<span class="math-tex">{tex}-3 \\leq 4-\\frac{7 x}{2} \\leq 18{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given inequality&nbsp;<span class="math-tex">{tex}-3 \\leq 4-\\frac{7 x}{2} \\leq 18{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow-3 \\leq 4-\\frac{7 x}{2} \\leq 18{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow-3-4 \\leq 4-\\frac{7 x}{2}-4 \\leq 18-4{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow-7 \\leq-\\frac{7 x}{2} \\leq 14{/tex}</span><br />
Multiplying the inequality by -2.<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;(-7)&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;(-2)&nbsp;<span class="math-tex">{tex}\\geq-\\frac{7 x}{2} \\times(-2) \\geq 14 \\times{/tex}</span>&nbsp;(-2)<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;14 <span class="math-tex">{tex}\\ge{/tex}</span> 7x <span class="math-tex">{tex}\\ge{/tex}</span> -28<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;-28 <span class="math-tex">{tex}\\le{/tex}</span> 7x <span class="math-tex">{tex}\\le{/tex}</span> 14<br />
Dividing the inequality by 7<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;-4 <span class="math-tex">{tex}\\le{/tex}</span> x <span class="math-tex">{tex}\\le{/tex}</span> 2<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;all real numbers x greater than or equal to -4 but less than or equal to 2 are the solution of given equality.<br />
x&nbsp;<span class="math-tex">{tex}\\in{/tex}</span>&nbsp;[-4, 2]&nbsp; solution set =[-4,2]</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Solve the inequality:&nbsp;<span class="math-tex">{tex}-15&lt;\\frac{3(x-2)}{5} \\leq 0{/tex}</span></p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have <span class="math-tex">{tex} - 15 &lt; \\frac{{3(x - 2)}}{5} \\leqslant 0{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow  - 75 &lt; 3(x - 2) \\leqslant 0{/tex}</span><span class="math-tex">{tex} \\Rightarrow  - 25 &lt; x - 2 \\leqslant 0{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow  - 23 &lt; x \\leqslant 2{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Solve the inequality:&nbsp;<span class="math-tex">{tex}-12&lt;4-\\frac{3 x}{-5} \\leq 2{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given inequality is;&nbsp;<span class="math-tex">{tex}-12&lt;4-\\frac{3 x}{-5} \\leq 2{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow-12&lt;4-\\frac{3 x}{-5} \\leq 2{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;- 12 - 4 &lt; 4 -&nbsp;<span class="math-tex">{tex}\\frac{3 x}{-5}{/tex}</span>&nbsp;- 4&nbsp;<span class="math-tex">{tex}\\le{/tex}</span>&nbsp;2 - 4 [subtracting by 4]<br />
<span class="math-tex">{tex}\\Rightarrow-16&lt;\\frac{-3 x}{-5} \\leq-2{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow-16&lt;\\frac{3 x}{5} \\leq-2{/tex}</span><br />
Multiplying the inequality by 5.<br />
<span class="math-tex">{tex}\\Rightarrow-16 \\times 5&lt;\\frac{3 x}{5} \\times 5 \\leq-2 \\times 5{/tex}</span><br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;-80 &lt; 3x <span class="math-tex">{tex}\\le{/tex}</span> -10<br />
<span class="math-tex">{tex}\\Rightarrow-\\frac{80}{3}&lt;x \\leq-\\frac{10}{3}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;all real numbers x greater than <span class="math-tex">{tex}-\\frac{80}{3}{/tex}</span> but less than or equal to <span class="math-tex">{tex}-\\frac{10}{3}{/tex}</span> are a solution of given equality.<br />
x&nbsp;<span class="math-tex">{tex}\\in{/tex}</span>&nbsp;(<span class="math-tex">{tex}-\\frac{80}{3},-\\frac{10}{3}{/tex}</span>]</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Solve the inequality:&nbsp;<span class="math-tex">{tex}7 \\leq \\frac{(3 x+11)}{2} \\leq 11{/tex}</span></p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have <span class="math-tex">{tex}7 \\leqslant \\frac{{(3x + 11)}}{2} \\leqslant 11{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 14 \\leqslant 3x + 11 \\leqslant 22 \\Rightarrow 3 \\leqslant 3x \\leqslant 11{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 1 \\leqslant x \\leqslant \\frac{{11}}{3}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Solve the inequality&nbsp;and represent the solution graphically on number line:&nbsp;5x + 1 &gt; &ndash; 24, 5x &ndash; 1 &lt; 24</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given inequalities 5x + 1 &gt; -24 and 5x &ndash; 1 &lt; 24<br />
5x + 1 &gt; -24<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;5x &gt; -24 &ndash; 1<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;5x &gt; -25<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x &gt; -5 &hellip;&hellip;&hellip;(I)<br />
5x &ndash; 1 &lt; 24<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;5x &lt; 24 + 1<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;5x &lt; 25<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;x &lt; 5 &hellip;&hellip;&hellip;.(II)<br />
From (I) and (II) we conclude that the solution of given inequalities is (-5, 5).&nbsp;</p>

<p>solution set (-5,5)<br />
<img alt="" data-imgur-src="OgA1gch.png" src="https://media-mycbseguide.s3.amazonaws.com/images/imgur/OgA1gch.png" style="width: 300px; height: 49px;" /></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Solve the inequality&nbsp;and represent the solution graphically on number line:&nbsp;2 (x &ndash; 1) <span class="math-tex">{tex}&lt;{/tex}</span> x + 5, 3 (x + 2) <span class="math-tex">{tex}&gt;{/tex}</span> 2 &ndash; x</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have 2(x - 1) &lt; x + 5, and 3(x + 2) &gt; 2 - x<br />
<span class="math-tex">{tex} \\Rightarrow 2x - 2 &lt; x + 5{/tex}</span>&nbsp;and 3x + 6 &gt; 2 - x<br />
<span class="math-tex">{tex} \\Rightarrow x &lt; 7{/tex}</span>&nbsp;and 4x &gt; -4<br />
<span class="math-tex">{tex} \\Rightarrow x &lt; 7{/tex}</span>&nbsp;and x &gt; -1<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_06/image042.png" style="height: 29px; width: 300px;" /></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Solve the inequality&nbsp;and represent the solution graphically on number line:&nbsp;3x &ndash; 7 <span class="math-tex">{tex}&gt;{/tex}</span> 2 (x &ndash; 6), 6 &ndash; x <span class="math-tex">{tex}&gt;{/tex}</span> 11 &ndash; 2x</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have,<br />
3x - 7 &gt; 2 (x - 6) and 6 - x &gt; 11 - 2x<br />
<span class="math-tex">{tex} \\Rightarrow 3x - 7 &gt; 2x - 12{/tex}</span>&nbsp;and 6 - x &gt; 11 - 2x<br />
<span class="math-tex">{tex} \\Rightarrow x &gt; - 5{/tex}</span>&nbsp;and x &gt; 5<br />
graphical representation is<br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/question_images/1690633608-5mj2xf.jpg" style="width: 227px; height: 150px;" /></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Solve the inequality&nbsp;and represent the solution graphically on number line:&nbsp;5 (2x &ndash; 7) &ndash; 3 (2x + 3) <span class="math-tex">{tex}\\le{/tex}</span> 0, 2x + 19 <span class="math-tex">{tex}\\le{/tex}</span> 6x + 47.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have <span class="math-tex">{tex}5(2x - 7) - 3(2x + 3) \\leq 0{/tex}</span>&nbsp;and <span class="math-tex">{tex}2x + 19 \\leq 6x + 47{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 10x - 35 - 6x - 9 \\leq 0{/tex}</span>&nbsp;and <span class="math-tex">{tex} - 4x \\leq 28{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 4x - 44 \\leq 0{/tex}</span>&nbsp;and <span class="math-tex">{tex}x \\geq - 7{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 4x \\leq 44{/tex}</span>&nbsp;and <span class="math-tex">{tex}x \\geq - 7{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow x \\leq 11{/tex}</span>&nbsp;and <span class="math-tex">{tex}x \\geq - 7{/tex}</span><br />
<img src="https://media-mycbseguide.s3.amazonaws.com/images/quesbank/11/TG%20maths/ch_06/image056.png" style="height: 29px; width: 290px;" /></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>A solution is to be kept between 68&deg;F and 77&deg;F. What is the range in&nbsp;temperature in degree Celsius (C) if the Celsius / Fahrenheit (F) conversion formula is given by <span class="math-tex">{tex}F = \\frac{9}{5}C + 32{/tex}</span>?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>It is given that 68&deg; &lt; F &lt; 77&deg;<br />
Putting <span class="math-tex">{tex}F = \\frac{9}{5}C + 32{/tex}</span>, we have<br />
<span class="math-tex">{tex}68^\\circ &lt; \\frac{9}{5}C + 32 &lt; 77^\\circ {/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 36^\\circ &lt; \\frac{{9C}}{5} &lt; 45^\\circ {/tex}</span><span class="math-tex">{tex} \\Rightarrow 180^\\circ &lt; 9C &lt; 225^\\circ {/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow {/tex}</span>&nbsp;20&deg; &lt; C &lt; 25&deg;<br />
Thus the range of temperature between 20&deg;C and 25&deg;C</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>A solution of 8% boric acid is to be diluted by adding a 2% boric acid solution to it. The resulting mixture is to be more than 4% but less than 6% boric acid. If we have 640 litres of the 8% solution, how&nbsp;many litres of the 2% solution will have to be added?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let x litre of 2% boric acid solution be added to 640 litres of 8% boric acid solution. Then<br />
Total quality of mixture = (640 + x) litres<br />
Total boric acid in (640 + x) litres of mixture <span class="math-tex">{tex} = \\frac{{2x}}{{100}} + \\frac{8}{{100}} \\times 640{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{x}{{50}} + \\frac{{256}}{5}{/tex}</span><br />
It is given that the resulting mixture must be more than 4% but less than 6% boric acid.<br />
<span class="math-tex">{tex}\\therefore \\frac{4}{{100}}(640 + x) &lt; \\frac{x}{{50}} + \\frac{{256}}{5}{/tex}</span><span class="math-tex">{tex} &lt; \\frac{6}{{100}}(640 + x){/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow \\frac{{640 + x}}{{25}} &lt; \\frac{{x + 2560}}{{50}} &lt; \\frac{{1920 + 3x}}{{50}}{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow {/tex}</span>&nbsp;1280 + 2x &lt; x + 2560 &lt; 1920 + 3x<br />
<span class="math-tex">{tex} \\Rightarrow {/tex}</span>&nbsp;1280 + 2x &lt; x + 2560 and x + 2560 &lt; 1920 + 3x<br />
<span class="math-tex">{tex} \\Rightarrow {/tex}</span>&nbsp;x &lt; 1280 and<br />
<span class="math-tex">{tex} \\Rightarrow {/tex}</span>&nbsp;x &lt; 1280 and x &gt; 320<br />
<span class="math-tex">{tex} \\Rightarrow {/tex}</span>&nbsp;320 &lt; x &lt; 1280<br />
Thus 2% boric acid solution must be more than 320 litres but less than 1280 litres.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 13</span></div><div class="question-text"><p>How many litres of water will have to be added to 1125 litres of the 45% solution of acid so that the resulting mixture will contain more than 25% but less than 30% acid content?</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let x litres of water be added to 1125 litres of 45% acid solution.<br />
Then total quantity of mixture = (1125 +x ) litres<br />
<span class="math-tex">{tex}\\frac{{45}}{{100}} \\times 1125 + 0 \\times \\frac{x}{{100}} &gt; {/tex}</span><span class="math-tex">{tex}\\frac{{25}}{{100}} \\times (1125 + x){/tex}</span><br />
and <span class="math-tex">{tex}\\frac{{45}}{{100}} \\times 1125 + 0 \\times \\frac{x}{{100}} &lt; \\frac{{30}}{{100}}{/tex}</span><span class="math-tex">{tex} \\times (1125 + x){/tex}</span><br />
Combining the above inequations, we get<br />
<span class="math-tex">{tex}\\frac{{25}}{{100}} \\times 100 \\leqslant \\frac{{2025 \\times 100}}{{4(1125 + x)}} \\leqslant \\frac{{30}}{{100}} \\times 100{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 25 \\leqslant \\frac{{50625}}{{1125 + x}} \\leqslant 30{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 25 \\leqslant \\frac{{50625}}{{1125 + x}}{/tex}</span>&nbsp;and <span class="math-tex">{tex}\\frac{{50625}}{{1125 + x}} \\leqslant 30{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 28125 + 25x \\leqslant 50625{/tex}</span>&nbsp;and <span class="math-tex">{tex}50625 \\leqslant 33750 + 30x{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 25x \\leqslant 22500{/tex}</span>&nbsp;and <span class="math-tex">{tex}30x \\geqslant 1687.5{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow x \\leqslant 900{/tex}</span>&nbsp;and <span class="math-tex">{tex}x \\geqslant 562.5{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 562.5 \\leqslant x \\leqslant 900{/tex}</span><br />
Thus minimum 562.5 litres and maximum 900 litres of water need to be added.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 14</span></div><div class="question-text"><p>IQ of a person is given by the formula<br />
<span class="math-tex">{tex}\\mathrm{IQ}=\\frac{\\mathrm{MA}}{\\mathrm{CA}} \\times 100{/tex}</span><br />
where MA is mental age and CA is chronological age. If 80 <span class="math-tex">{tex}\\le{/tex}</span> IQ <span class="math-tex">{tex}\\le{/tex}</span> 140 for a group of 12 years old children, find the range of their mental age.</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>It is given that <span class="math-tex">{tex}80 \\leqslant Q \\leqslant 140{/tex}</span>&nbsp;and CA = 12<br />
We have <span class="math-tex">{tex}IQ = \\frac{{MA}}{{CA}} \\times 100{/tex}</span><br />
<span class="math-tex">{tex}\\therefore 80 \\leqslant \\frac{{MA}}{{12}} \\times 100 \\leqslant 140{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 960 \\leqslant MA \\times 100 \\leqslant 1680{/tex}</span><br />
<span class="math-tex">{tex} \\Rightarrow 9.6 \\leqslant MA \\leqslant 16.8{/tex}</span><br />
Thus minimum MA is 9.6 and maximum 16.8</p></div></div></div>
`;

export default { EXAMPLES_HTML, EX5_1_HTML, MISC_HTML };