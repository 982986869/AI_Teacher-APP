// statisticsContent.js
// NCERT Solutions — Class 11 Mathematics, Chapter 13: Statistics.
//   EXAMPLES (pending — not yet uploaded) | EX13_1 (12) | EX13_2 (10) | MISC (7)
//   Ex 13.1, 13.2, Misc complete. Examples still to come.
// Math uses {tex}...{/tex} (LaTeX), rendered by Ncert2Screen's tex-mml-chtml build.

export const EX13_1_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Find the mean deviation about the mean for the data: 4, 7, 8, 9, 10, 12, 13, 17.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Mean of the given data is<br />
<span class="math-tex">{tex}\\bar x = \\frac{{4 + 7 + 8 + 9 + 10 + 12 + 13 + 17}}{8} = \\frac{{80}}{8}{/tex}</span>&nbsp;= 10</p>

<table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\left| {{x_1} - \\bar x} \\right|{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">6</td>
		</tr>
		<tr>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">3</td>
		</tr>
		<tr>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">2</td>
		</tr>
		<tr>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">1</td>
		</tr>
		<tr>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">0</td>
		</tr>
		<tr>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">2</td>
		</tr>
		<tr>
			<td style="text-align: center;">13</td>
			<td style="text-align: center;">3</td>
		</tr>
		<tr>
			<td style="text-align: center;">17</td>
			<td style="text-align: center;">7</td>
		</tr>
		<tr>
			<td style="text-align: center;"><strong>Total</strong></td>
			<td style="text-align: center;">24</td>
		</tr>
	</tbody>
</table>

<p>M.D. about mean&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac{1}{n}\\sum\\limits_{i = 1}^n {\\left| {{x_i} - \\bar x} \\right|} {/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac{1}{8} \\times{/tex}</span>&nbsp;24 = 3</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Find the mean deviation about the mean for the data: 38, 70, 48, 40, 42, 55, 63, 46, 54, 44.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p><span class="math-tex">{tex}\\bar x = \\frac{{38 + 70 + 48 + 40 + 42 + 55 + 63 + 46 + 54 + 44}}{{10}}{/tex}</span>&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac{{500}}{{10}}{/tex}</span>&nbsp;= 50</p>

<table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\left| {{x_i} - \\bar x} \\right|{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">38</td>
			<td style="text-align: center;">12</td>
		</tr>
		<tr>
			<td style="text-align: center;">70</td>
			<td style="text-align: center;">20</td>
		</tr>
		<tr>
			<td style="text-align: center;">48</td>
			<td style="text-align: center;">2</td>
		</tr>
		<tr>
			<td style="text-align: center;">40</td>
			<td style="text-align: center;">10</td>
		</tr>
		<tr>
			<td style="text-align: center;">42</td>
			<td style="text-align: center;">8</td>
		</tr>
		<tr>
			<td style="text-align: center;">55</td>
			<td style="text-align: center;">5</td>
		</tr>
		<tr>
			<td style="text-align: center;">63</td>
			<td style="text-align: center;">13</td>
		</tr>
		<tr>
			<td style="text-align: center;">46</td>
			<td style="text-align: center;">4</td>
		</tr>
		<tr>
			<td style="text-align: center;">54</td>
			<td style="text-align: center;">4</td>
		</tr>
		<tr>
			<td style="text-align: center;">44</td>
			<td style="text-align: center;">6</td>
		</tr>
		<tr>
			<td style="text-align: center;">Total</td>
			<td style="text-align: center;">84</td>
		</tr>
	</tbody>
</table>

<p>M.D. about mean&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac{1}{n}\\sum\\limits_{i = 1}^n {\\left| {{x_i} - \\bar x} \\right|} {/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac{1}{{10}} \\times{/tex}</span>&nbsp;84 = 8.4</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Find the mean deviation about the median for the data in: 13, 17, 16, 14, 11, 13, 10, 16, 11, 18, 12, 17.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Arrange the data in ascending order, we have<br />
10, 11, 11,12, 13, 13, 14, 16, 16, 17, 17, 18<br />
Here n = 12 (which is even)<br />
So median is average of 6<sup> th</sup> and 7<sup> th</sup> observations<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Median =&nbsp;<span class="math-tex">{tex}\\frac{{13 + 14}}{2} = \\frac{{27}}{2}{/tex}</span> = 13.5</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%">
	<tbody>
		<tr>
			<td style="text-align:center">x<sub>i</sub></td>
			<td style="text-align:center">|x<sub>i</sub> - M|</td>
		</tr>
		<tr>
			<td style="text-align:center">10</td>
			<td style="text-align:center">3.5</td>
		</tr>
		<tr>
			<td style="text-align:center">11</td>
			<td style="text-align:center">2.5</td>
		</tr>
		<tr>
			<td style="text-align:center">11</td>
			<td style="text-align:center">2.5</td>
		</tr>
		<tr>
			<td style="text-align:center">12</td>
			<td style="text-align:center">1.5</td>
		</tr>
		<tr>
			<td style="text-align:center">13</td>
			<td style="text-align:center">0.5</td>
		</tr>
		<tr>
			<td style="text-align:center">13</td>
			<td style="text-align:center">0.5</td>
		</tr>
		<tr>
			<td style="text-align:center">14</td>
			<td style="text-align:center">0.5</td>
		</tr>
		<tr>
			<td style="text-align:center">16</td>
			<td style="text-align:center">2.5</td>
		</tr>
		<tr>
			<td style="text-align:center">16</td>
			<td style="text-align:center">2.5</td>
		</tr>
		<tr>
			<td style="text-align:center">17</td>
			<td style="text-align:center">3.5</td>
		</tr>
		<tr>
			<td style="text-align:center">17</td>
			<td style="text-align:center">3.5</td>
		</tr>
		<tr>
			<td style="text-align:center">18</td>
			<td style="text-align:center">4.5</td>
		</tr>
		<tr>
			<td style="text-align:center">Total</td>
			<td style="text-align:center">28</td>
		</tr>
	</tbody>
</table>

<p>M.D. about median&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac{1}{n}\\sum\\limits_{i = 1}^n{/tex}</span>&nbsp;|x<sub>i</sub>&nbsp;- M|<br />
=&nbsp;<span class="math-tex">{tex}\\frac{1}{{12}} \\times{/tex}</span>&nbsp;&nbsp;28 = 2.33</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Find the mean deviation about the median for the data in: 36, 72, 46, 42, 60, 45, 53, 46, 51, 49.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Arranging data in ascending order,<br />
36, 42, 45, 46, 46, 49, 51, 53, 60, 72<br />
Here, n= number of observation = 10 (even)<br />
Since n is even<br />
Median =&nbsp;<span class="math-tex">{tex}\\frac{\\left(\\frac{n}{2}\\right)^{t h} \\text { observation }+\\left(\\frac{n}{2}+1\\right)^{t h} \\text { observation }}{2}{/tex}</span><br />
M =&nbsp;<span class="math-tex">{tex}\\frac{\\left(\\frac{10}{2}\\right)^{t h} \\text { observation }+\\left(\\frac{10}{2}+1\\right)^{t h} \\text { observation }}{2}{/tex}</span><br />
M =&nbsp;<span class="math-tex">{tex}\\frac{5^{t h} \\text { observation } \\ +\\ 6^{t h} \\text { observation }}{2}{/tex}</span><br />
M =&nbsp;<span class="math-tex">{tex}\\frac{46+49}{2}{/tex}</span>&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac{95}{2}{/tex}</span>&nbsp;= 47.5<br />
Thus, for<br />
36, 42, 45, 46, 46, 49, 51, 53, 60, 72<br />
Median = 47.5<br />
Mean deviation about median =&nbsp;<span class="math-tex">{tex}\\frac{\\sum\\left|x_i-\\mathrm{M}\\right|}{10}{/tex}</span><br />
M.D.(M) =&nbsp;<span class="math-tex">{tex}\\frac{\\left(\\begin{array}{l} |36-47.5|+|42-47.5|+|45-47.5|+|46-47.5|+|46-47.5| \\\\ +|49-47.5|+|51-47.5|+|53-47.5|+|60-47.5|+|72-47.5| \\end{array}\\right)}{10}{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac{\\left(\\begin{array}{c} |-11.5|+|-5.5|+|-2.5|+|-1.5|+|-1.5| \\\\ +|1.5|+|3.5|+|5.5|+|12.5|+|24.5| \\end{array}\\right)}{10}{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac{11.5+5.5+2.5+1.5+1.5+1.5+3.5+5.5+12.5+24.5}{10}{/tex}</span><br />
=&nbsp;<span class="math-tex">{tex}\\frac{70}{10}{/tex}</span><br />
= 7</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the mean deviation from the mean for the data:</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">20</td>
			<td style="text-align: center;">25</td>
		</tr>
		<tr>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">5</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>To find mean deviation about the mean we need to make the following table,&nbsp;</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">x<sub>i</sub>f<sub>i</sub></td>
			<td style="text-align: center;">|d<sub>i</sub>| = |x<sub>i</sub>&nbsp;- mean|</td>
			<td style="text-align: center;">f<sub>i</sub>d<sub>i</sub></td>
		</tr>
		<tr>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">35</td>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">63</td>
		</tr>
		<tr>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">40</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">16</td>
		</tr>
		<tr>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">90</td>
			<td style="text-align: center;">1</td>
			<td style="text-align: center;">6</td>
		</tr>
		<tr>
			<td style="text-align: center;">20</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">60</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">18</td>
		</tr>
		<tr>
			<td style="text-align: center;">25</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">125</td>
			<td style="text-align: center;">11</td>
			<td style="text-align: center;">55</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">25</td>
			<td style="text-align: center;">350</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">158</td>
		</tr>
	</tbody>
</table>

<p>Mean =&nbsp;<span class="math-tex">{tex}\\frac{1}{n} \\sum f_{i} x_{i}=\\frac{350}{25}{/tex}</span>&nbsp;= 14<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;M.D =&nbsp;<span class="math-tex">{tex}\\frac{1}{n} \\Sigma f_{i}\\left|\\mathrm{d}_{i}\\right|=\\frac{1}{25}{/tex}</span>[158] = 6.32</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find the mean deviation from the mean for the data:</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">30</td>
			<td style="text-align: center;">50</td>
			<td style="text-align: center;">70</td>
			<td style="text-align: center;">90</td>
		</tr>
		<tr>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">24</td>
			<td style="text-align: center;">28</td>
			<td style="text-align: center;">16</td>
			<td style="text-align: center;">8</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>To calculate the mean deviation about mean we need to make the following table,&nbsp;</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td>
			<p style="text-align: center;">x<sub>i</sub></p>
			</td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">x<sub>i</sub>f<sub>i</sub></td>
			<td style="text-align: center;">|d<sub>i</sub>|=|x<sub>i</sub>-mean|</td>
			<td style="text-align: center;">f<sub>i</sub>d<sub>i</sub></td>
		</tr>
		<tr>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">40</td>
			<td style="text-align: center;">40</td>
			<td style="text-align: center;">160</td>
		</tr>
		<tr>
			<td style="text-align: center;">30</td>
			<td style="text-align: center;">24</td>
			<td style="text-align: center;">720</td>
			<td style="text-align: center;">20</td>
			<td style="text-align: center;">480</td>
		</tr>
		<tr>
			<td style="text-align: center;">50</td>
			<td style="text-align: center;">28</td>
			<td style="text-align: center;">1400</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
		</tr>
		<tr>
			<td style="text-align: center;">70</td>
			<td style="text-align: center;">16</td>
			<td style="text-align: center;">1120</td>
			<td style="text-align: center;">20</td>
			<td style="text-align: center;">320</td>
		</tr>
		<tr>
			<td style="text-align: center;">90</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">720</td>
			<td style="text-align: center;">40</td>
			<td style="text-align: center;">320</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">80</td>
			<td style="text-align: center;">4000</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">1280</td>
		</tr>
	</tbody>
</table>

<p><span class="math-tex">{tex}Mean=\\frac{1}{n} \\sum f_{i} x_{i}=\\frac{4000}{80}=50{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\quad \\mathrm{M.D.}=\\frac{1}{n} \\Sigma f_{i}\\left|d_{i}\\right|=\\frac{1}{80}[1280]=16{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the mean deviation about the median for the data</p>

<table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">15</td>
		</tr>
		<tr>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">6</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">c.f.</td>
			<td style="text-align: center;">|x<sub>i</sub> - 7|</td>
			<td style="text-align: center;">f<sub>i</sub>|x<sub>i</sub> - 7|</td>
		</tr>
		<tr>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">16</td>
		</tr>
		<tr>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">14</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
		</tr>
		<tr>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">16</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">4</td>
		</tr>
		<tr>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">18</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">6</td>
		</tr>
		<tr>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">20</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">10</td>
		</tr>
		<tr>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">26</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">48</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">26</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">84</td>
		</tr>
	</tbody>
</table>

<p><span class="math-tex">{tex}\\frac{N}{2} = \\frac{{26}}{2} = 13{/tex}</span><br />
The c.f. just greater than 13 is 14 and corresponding value of x is 7.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Median = 7<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> M.D. about median&nbsp;<span class="math-tex">{tex} = \\frac{1}{N}\\sum {{f_i}} \\left| {{x_i} - M} \\right| = \\frac{1}{{26}} \\times 84 = 3.23{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the mean deviation about the median for the data:</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">21</td>
			<td style="text-align: center;">27</td>
			<td style="text-align: center;">30</td>
			<td style="text-align: center;">35</td>
		</tr>
		<tr>
			<td style="text-align: center;">fi</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">8</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">Cum. Freq.</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\left|d_{i}\\right|=\\left|x_{i}-30\\right|{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}f_{i}\\left|d_{i}\\right|{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">45</td>
		</tr>
		<tr>
			<td style="text-align: center;">21</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">45</td>
		</tr>
		<tr>
			<td style="text-align: center;">27</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">14</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">18</td>
		</tr>
		<tr>
			<td style="text-align: center;">30</td>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">21</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
		</tr>
		<tr>
			<td style="text-align: center;">35</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">29</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">40</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">29</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">Total = 148</td>
		</tr>
	</tbody>
</table>

<p><br />
<span class="math-tex">{tex}\\frac{N}{2}= \\frac{29} {2} =14.5{/tex}</span><br />
To calculate median we will locate the above value in column of cumulative frequency and the corresponding value of x<sub>i</sub>&nbsp;will be our median.&nbsp;<br />
Median = 30<br />
<span class="math-tex">{tex}\\mathrm{MD}=\\frac{148}{29} = 5.10{/tex}</span></p>

</div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the mean deviation about the mean for the data</p>

<table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td>Income per day in&nbsp;₹</td>
			<td style="text-align: center;">0-100</td>
			<td style="text-align: center;">100-200</td>
			<td style="text-align: center;">200-300</td>
			<td style="text-align: center;">300-400</td>
			<td style="text-align: center;">400-500</td>
			<td style="text-align: center;">500-600</td>
			<td style="text-align: center;">600-700</td>
			<td style="text-align: center;">700-800</td>
		</tr>
		<tr>
			<td>Number of persons</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">3</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Income per day</td>
			<td style="text-align: center;">Mid values x<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub>x<sub>i</sub></td>
			<td style="text-align: center;">|x<sub>i</sub> - 358|</td>
			<td style="text-align: center;">f<sub>i</sub>|x<sub>i</sub> - 358|</td>
		</tr>
		<tr>
			<td style="text-align: center;">0 - 100</td>
			<td style="text-align: center;">50</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">200</td>
			<td style="text-align: center;">308</td>
			<td style="text-align: center;">1232</td>
		</tr>
		<tr>
			<td style="text-align: center;">100 - 200</td>
			<td style="text-align: center;">150</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">1200</td>
			<td style="text-align: center;">208</td>
			<td style="text-align: center;">1664</td>
		</tr>
		<tr>
			<td style="text-align: center;">200 - 300</td>
			<td style="text-align: center;">250</td>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">2250</td>
			<td style="text-align: center;">108</td>
			<td style="text-align: center;">972</td>
		</tr>
		<tr>
			<td style="text-align: center;">300 - 400</td>
			<td style="text-align: center;">350</td>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">3500</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">80</td>
		</tr>
		<tr>
			<td style="text-align: center;">400 - 500</td>
			<td style="text-align: center;">450</td>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">3150</td>
			<td style="text-align: center;">92</td>
			<td style="text-align: center;">644</td>
		</tr>
		<tr>
			<td style="text-align: center;">500 - 600</td>
			<td style="text-align: center;">550</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">2750</td>
			<td style="text-align: center;">192</td>
			<td style="text-align: center;">960</td>
		</tr>
		<tr>
			<td style="text-align: center;">600 - 700</td>
			<td style="text-align: center;">650</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">2600</td>
			<td style="text-align: center;">292</td>
			<td style="text-align: center;">1168</td>
		</tr>
		<tr>
			<td style="text-align: center;">700 - 800</td>
			<td style="text-align: center;">750</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">2250</td>
			<td style="text-align: center;">392</td>
			<td style="text-align: center;">1176</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">50</td>
			<td style="text-align: center;">17900</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">7896</td>
		</tr>
	</tbody>
</table>

<p>Mean <span class="math-tex">{tex}\\bar x = \\frac{1}{N}\\sum {{f_i}{x_i}} = \\frac{1}{{50}} \\times 17900 = 358{/tex}</span><br />
Mean deviation about mean <span class="math-tex">{tex}= \\frac{1}{N}\\sum\\limits_{i = 1}^n {{f_i}\\left| {{x_i} - \\bar x} \\right|}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{1}{{50}} \\times 7896 = 157.92{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>Find the mean deviation about the mean for the data</p>

<table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td>Height in cms</td>
			<td>95-105</td>
			<td>105-115</td>
			<td>115-125</td>
			<td>125-135</td>
			<td>135-145</td>
			<td>145-155</td>
		</tr>
		<tr>
			<td>Number of boys</td>
			<td>9</td>
			<td>13</td>
			<td>26</td>
			<td>30</td>
			<td>12</td>
			<td>10</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Height in cms</td>
			<td style="text-align: center;">Mid values x<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub>x<sub>i</sub></td>
			<td style="text-align: center;">|x<sub>i</sub> - 125.3|</td>
			<td style="text-align: center;">f<sub>i</sub>|x<sub>i</sub> - 125.3|</td>
		</tr>
		<tr>
			<td style="text-align: center;">95 - 105</td>
			<td style="text-align: center;">100</td>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">900</td>
			<td style="text-align: center;">25.3</td>
			<td style="text-align: center;">227.7</td>
		</tr>
		<tr>
			<td style="text-align: center;">105 - 115</td>
			<td style="text-align: center;">110</td>
			<td style="text-align: center;">13</td>
			<td style="text-align: center;">1430</td>
			<td style="text-align: center;">15.3</td>
			<td style="text-align: center;">198.9</td>
		</tr>
		<tr>
			<td style="text-align: center;">115 - 125</td>
			<td style="text-align: center;">120</td>
			<td style="text-align: center;">26</td>
			<td style="text-align: center;">3120</td>
			<td style="text-align: center;">5.3</td>
			<td style="text-align: center;">137.8</td>
		</tr>
		<tr>
			<td style="text-align: center;">125 - 135</td>
			<td style="text-align: center;">130</td>
			<td style="text-align: center;">30</td>
			<td style="text-align: center;">3900</td>
			<td style="text-align: center;">4.7</td>
			<td style="text-align: center;">141</td>
		</tr>
		<tr>
			<td style="text-align: center;">135 - 145</td>
			<td style="text-align: center;">140</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">1680</td>
			<td style="text-align: center;">14.7</td>
			<td style="text-align: center;">176.4</td>
		</tr>
		<tr>
			<td style="text-align: center;">145 - 155</td>
			<td style="text-align: center;">150</td>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">1500</td>
			<td style="text-align: center;">24.7</td>
			<td style="text-align: center;">247</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">100</td>
			<td style="text-align: center;">12530</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">1128.8</td>
		</tr>
	</tbody>
</table>

<p>Mean <span class="math-tex">{tex}\\bar x = \\frac{1}{N}\\sum {{f_i}{x_i} = \\frac{1}{{100}} \\times 12530 = 125.3}{/tex}</span><br />
Mean deviation about mean <span class="math-tex">{tex}\\frac{1}{N}\\sum\\limits_{i = 1}^n {{f_i}} \\left| {{x_i} - \\bar x} \\right| = \\frac{1}{{100}} \\times 1128.8 = 11.28{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 11</span></div><div class="question-text"><p>Find the mean deviation about median for the following data:</p>

<table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td>Marks</td>
			<td style="text-align: center;">0-10</td>
			<td style="text-align: center;">10-20</td>
			<td style="text-align: center;">20-30</td>
			<td style="text-align: center;">30-40</td>
			<td style="text-align: center;">40-50</td>
			<td style="text-align: center;">50-60</td>
		</tr>
		<tr>
			<td>Number of Girls</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">14</td>
			<td style="text-align: center;">16</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">2</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Marks</td>
			<td style="text-align: center;">Mid values x<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">c.f.</td>
			<td style="text-align: center;">|x<sub>i</sub> - 27.86|</td>
			<td style="text-align: center;">f<sub>i</sub>|x<sub>i</sub> - 27.86|</td>
		</tr>
		<tr>
			<td style="text-align: center;">0 - 10</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">22.86</td>
			<td style="text-align: center;">137.16</td>
		</tr>
		<tr>
			<td style="text-align: center;">10 - 20</td>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">14</td>
			<td style="text-align: center;">12.86</td>
			<td style="text-align: center;">102.88</td>
		</tr>
		<tr>
			<td style="text-align: center;">20 - 30</td>
			<td style="text-align: center;">25</td>
			<td style="text-align: center;">14</td>
			<td style="text-align: center;">28</td>
			<td style="text-align: center;">2.86</td>
			<td style="text-align: center;">40.04</td>
		</tr>
		<tr>
			<td style="text-align: center;">30 - 40</td>
			<td style="text-align: center;">35</td>
			<td style="text-align: center;">16</td>
			<td style="text-align: center;">44</td>
			<td style="text-align: center;">7.14</td>
			<td style="text-align: center;">114.24</td>
		</tr>
		<tr>
			<td style="text-align: center;">40 - 50</td>
			<td style="text-align: center;">45</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">48</td>
			<td style="text-align: center;">17.14</td>
			<td style="text-align: center;">68.56</td>
		</tr>
		<tr>
			<td style="text-align: center;">50 - 60</td>
			<td style="text-align: center;">55</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">50</td>
			<td style="text-align: center;">27.14</td>
			<td style="text-align: center;">54.28</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">50</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">517.16</td>
		</tr>
	</tbody>
</table>

<p><span class="math-tex">{tex}\\frac{N}{2} = \\frac{{50}}{2} = 25{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Median class is 20 - 30<br />
Median&nbsp;<span class="math-tex">{tex} = 20 + \\frac{{25 - 14}}{{14}} \\times 10{/tex}</span> = 20 + 7.86 = 27.86<br />
M.D. about median&nbsp;<span class="math-tex">{tex} = \\frac{1}{N}\\sum\\limits_{i = 1}^n {{f_i}\\left| {{x_i} - M} \\right|} = \\frac{1}{{50}} \\times 517.16 = 10.34{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 12</span></div><div class="question-text"><p>Calculate the mean deviation about median age for the age distribution of 100 persons given&nbsp;below:</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%">
	<tbody>
		<tr>
			<td>Age (in years)</td>
			<td style="text-align:center">16-20</td>
			<td style="text-align:center">21-25</td>
			<td style="text-align:center">26-30</td>
			<td style="text-align:center">31-35</td>
			<td style="text-align:center">36-40</td>
			<td style="text-align:center">41-45</td>
			<td style="text-align:center">46-50</td>
			<td style="text-align:center">51-55</td>
		</tr>
		<tr>
			<td>Number</td>
			<td style="text-align:center">5</td>
			<td style="text-align:center">6</td>
			<td style="text-align:center">12</td>
			<td style="text-align:center">14</td>
			<td style="text-align:center">26</td>
			<td style="text-align:center">12</td>
			<td style="text-align:center">16</td>
			<td style="text-align:center">9</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><table border="1" cellpadding="3" cellspacing="0" style="width:100%">
	<tbody>
		<tr>
			<td style="text-align:center">Age</td>
			<td style="text-align:center">Exclusive class intervals</td>
			<td style="text-align:center">Mid values x<sub>i</sub></td>
			<td style="text-align:center">f<sub>i</sub></td>
			<td style="text-align:center">c.f.</td>
			<td style="text-align:center">|x<sub>i</sub> - 38|</td>
			<td style="text-align:center">f<sub>i</sub>|x<sub>i</sub> - 38|</td>
		</tr>
		<tr>
			<td style="text-align:center">16-20</td>
			<td style="text-align:center">15.5-20.5</td>
			<td style="text-align:center">18</td>
			<td style="text-align:center">5</td>
			<td style="text-align:center">5</td>
			<td style="text-align:center">20</td>
			<td style="text-align:center">100</td>
		</tr>
		<tr>
			<td style="text-align:center">21-25</td>
			<td style="text-align:center">20.5-25.5</td>
			<td style="text-align:center">23</td>
			<td style="text-align:center">6</td>
			<td style="text-align:center">11</td>
			<td style="text-align:center">15</td>
			<td style="text-align:center">90</td>
		</tr>
		<tr>
			<td style="text-align:center">26-30</td>
			<td style="text-align:center">25.5-30.5</td>
			<td style="text-align:center">28</td>
			<td style="text-align:center">12</td>
			<td style="text-align:center">23</td>
			<td style="text-align:center">10</td>
			<td style="text-align:center">120</td>
		</tr>
		<tr>
			<td style="text-align:center">31-35</td>
			<td style="text-align:center">30.5-35.5</td>
			<td style="text-align:center">33</td>
			<td style="text-align:center">14</td>
			<td style="text-align:center">37</td>
			<td style="text-align:center">5</td>
			<td style="text-align:center">70</td>
		</tr>
		<tr>
			<td style="text-align:center">36-40</td>
			<td style="text-align:center">35.5-40.5</td>
			<td style="text-align:center">38</td>
			<td style="text-align:center">26</td>
			<td style="text-align:center">63</td>
			<td style="text-align:center">0</td>
			<td style="text-align:center">0</td>
		</tr>
		<tr>
			<td style="text-align:center">41-45</td>
			<td style="text-align:center">40.5-45.5</td>
			<td style="text-align:center">43</td>
			<td style="text-align:center">12</td>
			<td style="text-align:center">75</td>
			<td style="text-align:center">5</td>
			<td style="text-align:center">60</td>
		</tr>
		<tr>
			<td style="text-align:center">46-50</td>
			<td style="text-align:center">45.5-50.5</td>
			<td style="text-align:center">48</td>
			<td style="text-align:center">16</td>
			<td style="text-align:center">91</td>
			<td style="text-align:center">10</td>
			<td style="text-align:center">160</td>
		</tr>
		<tr>
			<td style="text-align:center">51-55</td>
			<td style="text-align:center">50.5-55.5</td>
			<td style="text-align:center">53</td>
			<td style="text-align:center">9</td>
			<td style="text-align:center">100</td>
			<td style="text-align:center">15</td>
			<td style="text-align:center">135</td>
		</tr>
		<tr>
			<td style="text-align:center">&nbsp;</td>
			<td style="text-align:center">&nbsp;</td>
			<td style="text-align:center">&nbsp;</td>
			<td style="text-align:center">100</td>
			<td style="text-align:center">&nbsp;</td>
			<td style="text-align:center">&nbsp;</td>
			<td style="text-align:center">735</td>
		</tr>
	</tbody>
</table>

<p><span class="math-tex">{tex}\\frac{N}{2} = \\frac{{100}}{2} {/tex}</span>&nbsp;= 50<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Median class is 35.5 - 40.5<br />
Median = 35.5 +&nbsp;<span class="math-tex">{tex}\\frac{{50 - 37}}{{26}} \\times {/tex}</span>&nbsp;5 = 35.5 + 2.5 = 38<br />
M.D. about median =&nbsp;<span class="math-tex">{tex}\\frac{1}{N}\\sum\\limits_{i = 1}^n {{f_i}\\left| {{x_i} - M} \\right|} = \\frac{1}{{100}} \\times {/tex}</span>&nbsp;735 = 7.35</p></div></div></div>
`;

export const EX13_2_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>Find the mean and variance for each of the data<br />
6, 7, 10, 12, 13, 4, 8, 12</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here x = 6, 7, 10, 12, 13, 4, 8, 12<br />
<span class="math-tex">{tex}\\therefore \\sum x{/tex}</span> = 6 + 7 + 10 + 12 + 13 + 4 + 8 + 12 = 72<br />
n = 8 <span class="math-tex">{tex}\\therefore \\;\\bar x = \\frac{{72}}{8} = 9{/tex}</span><br />
<span class="math-tex">{tex}\\sum {x^2}{/tex}</span> = (6)<sup>2</sup> + (7)<sup>2</sup> + (10)<sup>2</sup> + (12)<sup>2</sup> + (13)<sup>2</sup> + (4)<sup>2</sup> + (8)<sup>2</sup> + (12)<sup>2</sup><br />
= 36 + 49 + 100 + 144 + 169 + 16 + 64 + 144 = 722<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Variance <span class="math-tex">{tex}{\\sigma ^2} = \\frac{{N\\sum {x^2} - {{\\left( {\\sum x} \\right)}^2}}}{{{N^2}}} = \\frac{{8 \\times 722 - {{(72)}^2}}}{{{{(8)}^2}}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{5776 - 5184}}{{64}} = \\frac{{592}}{{64}} = 9.25{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Find the mean and variance for each of the data First n natural numbers.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have to calculate mean and Variance of First n natural numbers&nbsp;= 1, 2, ..., n.<br />
Mean =&nbsp; <span class="math-tex">{tex}=\\frac{1}{n}(1+2+3+\\ldots+n)=\\frac{n(n+1)}{2 n}=\\frac{n+1}{2}{/tex}</span><br />
variance&nbsp; (<span class="math-tex">{tex}\\sigma^2{/tex}</span>) =&nbsp;<span class="math-tex">{tex}\\frac {\\sum (x_i - \\bar x)^2}{n}{/tex}</span><br />
As the data is very large hence,&nbsp;<span class="math-tex">{tex}(x_i - \\bar x)^2{/tex}</span>&nbsp;calculation id difficult.<br />
Hence, we can use the formula: variance (<span class="math-tex">{tex}\\sigma^2{/tex}</span>)&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac {\\sum(x_i)^2}{n} - (Mean)^2{/tex}</span><br />
<span class="math-tex">{tex}= \\frac {1^2+2^2+...n^2}{n} - \\left(\\frac {n+1}{2}\\right)^2{/tex}</span><br />
Since, 1<sup>2</sup> + 2<sup>2</sup> + 3<sup>2</sup> + .. + n<sup>2&nbsp;</sup>=&nbsp;<span class="math-tex">{tex}\\frac {n(n+1)(2n+1)}{6}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>variance (<span class="math-tex">{tex}\\sigma^2{/tex}</span>) =&nbsp;<span class="math-tex">{tex}\\frac {n(n+1)(2n+1)}{6n} - \\frac {(n+1)^2}{4}{/tex}</span><br />
<span class="math-tex">{tex}\\frac {(n+1)(2n+1)}{6} - \\frac {(n+1)^2}{4}{/tex}</span><br />
<span class="math-tex">{tex}\\frac {(n+1)}{2} \\left(\\frac {2n+1}{3} - \\frac {n+1}{2}\\right){/tex}</span><br />
<span class="math-tex">{tex}\\frac {n+1}{2} \\left(\\frac {4n+2 -3n - 3}{6} \\right){/tex}</span><br />
<span class="math-tex">{tex}\\frac {n+1}{2} \\times \\frac {n-1}{6}{/tex}</span>&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac {n^2 -1}{12}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>Find the mean and variance for each of the data First 10 multiples of 3.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The First 10 multiples of 3 are given by,&nbsp;<br />
3, 6, 9, 12, 15, 18, 21, 24, 27, 30<br />
We know that Mean,&nbsp;<span class="math-tex">{tex}\\overline{\\mathrm{x}}=\\frac{\\sum_{i=1}^{\\mathrm{a}} \\mathrm{x}_{\\mathrm{i}}}{\\mathrm{n}}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;<span class="math-tex">{tex}\\overline{\\mathrm{x}}=\\frac{3+6+9+12+15+18+21+24+27+30}{10}{/tex}</span>&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac{165}{10}{/tex}</span>&nbsp;= 16.5<br />
From the given data, we can form the table:</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td>x<sub>i</sub></td>
			<td>Deviation from mean (xi - <span class="math-tex">{tex}\\overline{\\mathbf{X}}{/tex}</span>)</td>
			<td>(xi - <span class="math-tex">{tex}\\overline{\\mathbf{X}}{/tex}</span>)<sup>2</sup></td>
		</tr>
		<tr>
			<td>3</td>
			<td>3 - 16.5 = 13.5</td>
			<td>182.25</td>
		</tr>
		<tr>
			<td>6</td>
			<td>6&nbsp;- 16.5 = 10.5</td>
			<td>110.25</td>
		</tr>
		<tr>
			<td>9</td>
			<td>9&nbsp;- 16.5 = 7.5</td>
			<td>56.25</td>
		</tr>
		<tr>
			<td>12</td>
			<td>12&nbsp;- 16.5 = -4.5</td>
			<td>20.25</td>
		</tr>
		<tr>
			<td>15</td>
			<td>15&nbsp;- 16.5 = -1.5</td>
			<td>2.25</td>
		</tr>
		<tr>
			<td>18</td>
			<td>18&nbsp;- 16.5 = 1.5</td>
			<td>2.25</td>
		</tr>
		<tr>
			<td>21</td>
			<td>21&nbsp;- 16.5 = 4.5</td>
			<td>20.25</td>
		</tr>
		<tr>
			<td>24</td>
			<td>24&nbsp;- 16.5 = 7.5</td>
			<td>56.25</td>
		</tr>
		<tr>
			<td>27</td>
			<td>27&nbsp;- 16.5 = 10.5</td>
			<td>110.25</td>
		</tr>
		<tr>
			<td>30</td>
			<td>30&nbsp;- 16.5 = 13.5</td>
			<td>182.25</td>
		</tr>
		<tr>
			<td>&nbsp;</td>
			<td>&nbsp;</td>
			<td><span class="math-tex">{tex}\\sum_{i=1}^{10}\\left(x_{i}-\\bar{x}\\right)^{2}{/tex}</span>&nbsp;= 742.5</td>
		</tr>
	</tbody>
</table>

<p>We know that Variance,&nbsp;<span class="math-tex">{tex}\\sigma^{2}=\\frac{1}{\\mathrm{n}} \\sum_{\\mathrm{i}=1}^{\\mathrm{a}}\\left(\\mathrm{x}_{\\mathrm{i}}-\\overline{\\mathrm{x}}\\right)^{2}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;<span class="math-tex">{tex}\\sigma^{2}{/tex}</span>&nbsp;= (1/10)&nbsp;<span class="math-tex">{tex}\\times{/tex}</span>&nbsp;742.5 = 74.25<br />
Mean = 16.5 and Variance = 74.25</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Find the mean and variance for each of the data</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">14</td>
			<td style="text-align: center;">18</td>
			<td style="text-align: center;">24</td>
			<td style="text-align: center;">28</td>
			<td style="text-align: center;">30</td>
		</tr>
		<tr>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">3</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>1st of all we construct table.&nbsp;</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub>x<sub>i</sub></td>
			<td style="text-align: center;"><span class="math-tex">{tex}X_i - \\bar X{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}(X_i - \\bar X)^2{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}f_i (X_i - \\bar X)^2{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">-13</td>
			<td style="text-align: center;">169</td>
			<td style="text-align: center;">338</td>
		</tr>
		<tr>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">40</td>
			<td style="text-align: center;">-9</td>
			<td style="text-align: center;">81</td>
			<td style="text-align: center;">324</td>
		</tr>
		<tr>
			<td style="text-align: center;">14</td>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">98</td>
			<td style="text-align: center;">-5</td>
			<td style="text-align: center;">25</td>
			<td style="text-align: center;">175</td>
		</tr>
		<tr>
			<td style="text-align: center;">18</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">216</td>
			<td style="text-align: center;">-1</td>
			<td style="text-align: center;">1</td>
			<td style="text-align: center;">12</td>
		</tr>
		<tr>
			<td style="text-align: center;">24</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">192</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">25</td>
			<td style="text-align: center;">200</td>
		</tr>
		<tr>
			<td style="text-align: center;">28</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">112</td>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">81</td>
			<td style="text-align: center;">324</td>
		</tr>
		<tr>
			<td style="text-align: center;">30</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">90</td>
			<td style="text-align: center;">11</td>
			<td style="text-align: center;">121</td>
			<td style="text-align: center;">363</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">40</td>
			<td style="text-align: center;">760</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">1736</td>
		</tr>
	</tbody>
</table>

<p>Here, N = 40,&nbsp;<span class="math-tex">{tex}\\sum\\limits_{i=1}^{7} f_i x_i = 760{/tex}</span><br />
<span class="math-tex">{tex}\\therefore \\bar x = \\frac {\\sum\\limits_{i=1}^{7} f_i x_i}{N} = \\frac {760}{40} = 19{/tex}</span><br />
Variance =&nbsp;<span class="math-tex">{tex} \\frac 1N \\sum\\limits_{i=1}^{7} f_i(x_i - \\bar x)^2 = \\frac {1}{40} \\times 1736 = 43.4{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Find the mean and&nbsp;variance of the following data.</p>

<table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;">92</td>
			<td style="text-align: center;">93</td>
			<td style="text-align: center;">97</td>
			<td style="text-align: center;">98</td>
			<td style="text-align: center;">102</td>
			<td style="text-align: center;">104</td>
			<td style="text-align: center;">109</td>
		</tr>
		<tr>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">3</td>
		</tr>
	</tbody>
</table>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub>x<sub>i</sub></td>
			<td style="text-align: center;">(x<sub>i</sub>-100)</td>
			<td style="text-align: center;">(x<sub>i</sub>-100)<sup>2</sup></td>
			<td style="text-align: center;">f<sub>i</sub>(x<sub>i</sub>-100)<sup>2</sup></td>
		</tr>
		<tr>
			<td style="text-align: center;">92</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">276</td>
			<td style="text-align: center;">- 8</td>
			<td style="text-align: center;">64</td>
			<td style="text-align: center;">192</td>
		</tr>
		<tr>
			<td style="text-align: center;">93</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">186</td>
			<td style="text-align: center;">- 7</td>
			<td style="text-align: center;">49</td>
			<td style="text-align: center;">98</td>
		</tr>
		<tr>
			<td style="text-align: center;">97</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">291</td>
			<td style="text-align: center;">- 3</td>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">27</td>
		</tr>
		<tr>
			<td style="text-align: center;">98</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">196</td>
			<td style="text-align: center;">- 2</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">8</td>
		</tr>
		<tr>
			<td style="text-align: center;">102</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">612</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">24</td>
		</tr>
		<tr>
			<td style="text-align: center;">104</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">312</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">16</td>
			<td style="text-align: center;">48</td>
		</tr>
		<tr>
			<td style="text-align: center;">109</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">327</td>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">81</td>
			<td style="text-align: center;">243</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">22</td>
			<td style="text-align: center;">2200</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">640</td>
		</tr>
	</tbody>
</table>

<p>Mean&nbsp;<span class="math-tex">{tex}(\\bar x) = \\frac{1}{N}\\sum {{f_i}{x_i}}  = \\frac{1}{{22}} \\times 2200 = 100{/tex}</span><br />
Variance&nbsp;<span class="math-tex">{tex}({\\sigma ^2}) = \\frac{1}{N}\\sum\\limits_{i = 1}^n {{f_i}{{({x_i} - \\bar x)}^2}}  = \\frac{1}{{22}} \\times 640 = 29.09{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Find the mean and standard deviation using short cut method.</p>

<table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;">60</td>
			<td style="text-align: center;">61</td>
			<td style="text-align: center;">62</td>
			<td style="text-align: center;">63</td>
			<td style="text-align: center;">64</td>
			<td style="text-align: center;">65</td>
			<td style="text-align: center;">66</td>
			<td style="text-align: center;">67</td>
			<td style="text-align: center;">68</td>
		</tr>
		<tr>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">1</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">29</td>
			<td style="text-align: center;">25</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">5</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">x<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;">u = x - 64</td>
			<td style="text-align: center;">fu</td>
			<td style="text-align: center;">fu<sup>2</sup></td>
		</tr>
		<tr>
			<td style="text-align: center;">60</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">- 4</td>
			<td style="text-align: center;">- 8</td>
			<td style="text-align: center;">32</td>
		</tr>
		<tr>
			<td style="text-align: center;">61</td>
			<td style="text-align: center;">1</td>
			<td style="text-align: center;">- 3</td>
			<td style="text-align: center;">- 3</td>
			<td style="text-align: center;">9</td>
		</tr>
		<tr>
			<td style="text-align: center;">62</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">- 2</td>
			<td style="text-align: center;">- 24</td>
			<td style="text-align: center;">48</td>
		</tr>
		<tr>
			<td style="text-align: center;">63</td>
			<td style="text-align: center;">29</td>
			<td style="text-align: center;">- 1</td>
			<td style="text-align: center;">- 29</td>
			<td style="text-align: center;">29</td>
		</tr>
		<tr>
			<td style="text-align: center;">64</td>
			<td style="text-align: center;">25</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
		</tr>
		<tr>
			<td style="text-align: center;">65</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">1</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">12</td>
		</tr>
		<tr>
			<td style="text-align: center;">66</td>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">20</td>
			<td style="text-align: center;">40</td>
		</tr>
		<tr>
			<td style="text-align: center;">67</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">36</td>
		</tr>
		<tr>
			<td style="text-align: center;">68</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">20</td>
			<td style="text-align: center;">80</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">100</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">286</td>
		</tr>
	</tbody>
</table>

<p>Mean&nbsp;<span class="math-tex">{tex}(\\bar x) = A + \\frac{{\\sum {fu} }}{N} = 64 + \\frac{0}{{100}} = 64{/tex}</span><br />
S.D. <span class="math-tex">{tex}(\\sigma ) = \\frac{1}{{100}}\\sqrt {N\\sum {f{u^2}}  - {{\\left( {\\sum {fu} } \\right)}^2}}{/tex}</span><span class="math-tex">{tex} = \\frac{1}{{100}}\\sqrt {100 \\times 286 - {{(0)}^2}} {/tex}</span><br />
<span class="math-tex">{tex}= \\frac{1}{{100}}\\sqrt {28600}  = \\frac{1}{{100}} \\times 169.1 = 1.69.{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>Find the mean and variance for the following frequency distribution</p>

<table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td>Classes</td>
			<td style="text-align: center;">0-30</td>
			<td style="text-align: center;">30-60</td>
			<td style="text-align: center;">60-90</td>
			<td style="text-align: center;">90-120</td>
			<td style="text-align: center;">120-150</td>
			<td style="text-align: center;">150-180</td>
			<td style="text-align: center;">180-210</td>
		</tr>
		<tr>
			<td>Frequencies</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">2</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Classes</td>
			<td style="text-align: center;">Mid values x<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;"><span class="math-tex">{tex}u = \\frac{{x - 105}}{{30}}{/tex}</span></td>
			<td style="text-align: center;">fu</td>
			<td style="text-align: center;">fu<sup>2</sup></td>
		</tr>
		<tr>
			<td style="text-align: center;">0-30</td>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">- 3</td>
			<td style="text-align: center;">- 6</td>
			<td style="text-align: center;">18</td>
		</tr>
		<tr>
			<td style="text-align: center;">30-60</td>
			<td style="text-align: center;">45</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">- 2</td>
			<td style="text-align: center;">- 6</td>
			<td style="text-align: center;">12</td>
		</tr>
		<tr>
			<td style="text-align: center;">60-90</td>
			<td style="text-align: center;">75</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">- 1</td>
			<td style="text-align: center;">- 5</td>
			<td style="text-align: center;">5</td>
		</tr>
		<tr>
			<td style="text-align: center;">90-120</td>
			<td style="text-align: center;">105</td>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
		</tr>
		<tr>
			<td style="text-align: center;">120-150</td>
			<td style="text-align: center;">135</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">1</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">3</td>
		</tr>
		<tr>
			<td style="text-align: center;">150-180</td>
			<td style="text-align: center;">165</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">10</td>
			<td style="text-align: center;">20</td>
		</tr>
		<tr>
			<td style="text-align: center;">180-210</td>
			<td style="text-align: center;">195</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">18</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;"><strong>30</strong></td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;"><strong>2</strong></td>
			<td style="text-align: center;"><strong>76</strong></td>
		</tr>
	</tbody>
</table>

<p>Mean <span class="math-tex">{tex}(\\bar x) = A + \\frac{{\\sum {fu} }}{N} \\times h = 105 + \\frac{2}{{30}} \\times 30 = 107{/tex}</span><br />
Variance&nbsp;<span class="math-tex">{tex}({\\sigma ^2}) = \\frac{{{h^2}}}{{{N^2}}}\\left[ {N\\Sigma f{u^2} - {{(\\Sigma fu)}^2}} \\right]{/tex}</span><br />
= 900/900[30(76)-4] = 2276</p>

</div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>Find the mean and variance for the following frequency distribution</p>

<table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td>Classes</td>
			<td style="text-align: center;">0-10</td>
			<td style="text-align: center;">10-20</td>
			<td style="text-align: center;">20-30</td>
			<td style="text-align: center;">30-40</td>
			<td style="text-align: center;">40-50</td>
		</tr>
		<tr>
			<td>Frequencies</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">16</td>
			<td style="text-align: center;">6</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Classes</td>
			<td style="text-align: center;">Mid values x<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;"><span class="math-tex">{tex}u = \\frac{{x - 25}}{{10}}{/tex}</span></td>
			<td style="text-align: center;">fu</td>
			<td style="text-align: center;">fu<sup>2</sup></td>
		</tr>
		<tr>
			<td style="text-align: center;">0-10</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">- 2</td>
			<td style="text-align: center;">- 10</td>
			<td style="text-align: center;">20</td>
		</tr>
		<tr>
			<td style="text-align: center;">10-20</td>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">8</td>
			<td style="text-align: center;">- 1</td>
			<td style="text-align: center;">- 8</td>
			<td style="text-align: center;">8</td>
		</tr>
		<tr>
			<td style="text-align: center;">20-30</td>
			<td style="text-align: center;">25</td>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
		</tr>
		<tr>
			<td style="text-align: center;">30-40</td>
			<td style="text-align: center;">35</td>
			<td style="text-align: center;">16</td>
			<td style="text-align: center;">1</td>
			<td style="text-align: center;">16</td>
			<td style="text-align: center;">16</td>
		</tr>
		<tr>
			<td style="text-align: center;">40-50</td>
			<td style="text-align: center;">45</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">24</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;"><strong>50</strong></td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;"><strong>10</strong></td>
			<td style="text-align: center;"><strong>68</strong></td>
		</tr>
	</tbody>
</table>

<p>Mean <span class="math-tex">{tex}(\\bar x) = A + \\frac{{\\Sigma fu}}{N} \\times h{/tex}</span><br />
<span class="math-tex">{tex} = 25 + \\frac{{10}}{{50}} \\times 10{/tex}</span> = 25 + 2 = 27<br />
Variance&nbsp;<span class="math-tex">{tex}({\\sigma ^2}) = \\frac{{{h^2}}}{{{N^2}}}[N\\Sigma f{u^2} - {(\\Sigma fu)^2}]{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{{{(10)}^2}}}{{{{(50)}^2}}}[50 \\times 68 - {(10)^2}]{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{100}}{{2500}}[3400 - 100]{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{1}{{25}} \\times 3300 = 132{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9</span></div><div class="question-text"><p>Find the mean, variance and standard deviation using short cut method.</p>

<table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td>Height in cms</td>
			<td style="text-align: center;">70-75</td>
			<td style="text-align: center;">75-80</td>
			<td style="text-align: center;">80-85</td>
			<td style="text-align: center;">85-90</td>
			<td style="text-align: center;">90-95</td>
			<td style="text-align: center;">95-100</td>
			<td style="text-align: center;">100-105</td>
			<td style="text-align: center;">105-110</td>
			<td style="text-align: center;">110-115</td>
		</tr>
		<tr>
			<td>No. of children</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">3</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Height in cms.</td>
			<td style="text-align: center;">Mid values x<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;"><span class="math-tex">{tex}u = \\frac{{x - 92.5}}{5}{/tex}</span></td>
			<td style="text-align: center;">fu</td>
			<td style="text-align: center;">fu<sup>2</sup></td>
		</tr>
		<tr>
			<td style="text-align: center;">70-75</td>
			<td style="text-align: center;">72.5</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">- 4</td>
			<td style="text-align: center;">- 12</td>
			<td style="text-align: center;">48</td>
		</tr>
		<tr>
			<td style="text-align: center;">75-80</td>
			<td style="text-align: center;">77.5</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">- 3</td>
			<td style="text-align: center;">- 12</td>
			<td style="text-align: center;">36</td>
		</tr>
		<tr>
			<td style="text-align: center;">80-85</td>
			<td style="text-align: center;">82.5</td>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">- 2</td>
			<td style="text-align: center;">- 14</td>
			<td style="text-align: center;">28</td>
		</tr>
		<tr>
			<td style="text-align: center;">85-90</td>
			<td style="text-align: center;">87.5</td>
			<td style="text-align: center;">7</td>
			<td style="text-align: center;">- 1</td>
			<td style="text-align: center;">- 7</td>
			<td style="text-align: center;">7</td>
		</tr>
		<tr>
			<td style="text-align: center;">90-95</td>
			<td style="text-align: center;">92.5</td>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
		</tr>
		<tr>
			<td style="text-align: center;">95-100</td>
			<td style="text-align: center;">97.5</td>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">1</td>
			<td style="text-align: center;">9</td>
			<td style="text-align: center;">9</td>
		</tr>
		<tr>
			<td style="text-align: center;">100-105</td>
			<td style="text-align: center;">102.5</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">24</td>
		</tr>
		<tr>
			<td style="text-align: center;">105-110</td>
			<td style="text-align: center;">107.5</td>
			<td style="text-align: center;">6</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">18</td>
			<td style="text-align: center;">54</td>
		</tr>
		<tr>
			<td style="text-align: center;">110-115</td>
			<td style="text-align: center;">112.5</td>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">12</td>
			<td style="text-align: center;">48</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;"><strong>60</strong></td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;"><strong>6</strong></td>
			<td style="text-align: center;">254</td>
		</tr>
	</tbody>
</table>

<p>Mean <span class="math-tex">{tex}(\\bar x) = A + \\frac{{\\Sigma fu}}{N} \\times h = 92.5 + \\frac{6}{{60}} \\times 5{/tex}</span> = 92.5 + 0.5 = 93<br />
Variance&nbsp;<span class="math-tex">{tex}({\\sigma ^2}) = \\frac{{{h^2}}}{{{N^2}}}[N\\Sigma f{u^2} - {(\\Sigma fu)^2}]{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{{{{(5)}^2}}}{{{{(60)}^2}}}[60 \\times 254 - {(6)^2}]{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{{25}}{{3600}}[15240 - 36] = \\frac{{25}}{{3600}} \\times 15204 = 105.58{/tex}</span><br />
Standard deviation&nbsp;<span class="math-tex">{tex}(\\sigma ) = \\sqrt {105.58} = 10.27{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>The diameters of circles (in mm) drawn in a design are given below:</p>

<table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td>Diameters</td>
			<td style="text-align: center;">33-36</td>
			<td style="text-align: center;">37-40</td>
			<td style="text-align: center;">41-44</td>
			<td style="text-align: center;">45-48</td>
			<td style="text-align: center;">49-52</td>
		</tr>
		<tr>
			<td>No. of circles</td>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">17</td>
			<td style="text-align: center;">21</td>
			<td style="text-align: center;">22</td>
			<td style="text-align: center;">25</td>
		</tr>
	</tbody>
</table>

<p>Calculate the standard deviation and mean diameter of the circles.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Diameters</td>
			<td style="text-align: center;">Classes</td>
			<td style="text-align: center;">Mid vales x<sub>i</sub></td>
			<td style="text-align: center;">f<sub>i</sub></td>
			<td style="text-align: center;"><span class="math-tex">{tex}u = \\frac{{x - 42.5}}{4}{/tex}</span></td>
			<td style="text-align: center;">fu</td>
			<td style="text-align: center;">fu<sup>2</sup></td>
		</tr>
		<tr>
			<td style="text-align: center;">33-36</td>
			<td style="text-align: center;">32.5-36.5</td>
			<td style="text-align: center;">34.5</td>
			<td style="text-align: center;">15</td>
			<td style="text-align: center;">- 2</td>
			<td style="text-align: center;">- 30</td>
			<td style="text-align: center;">60</td>
		</tr>
		<tr>
			<td style="text-align: center;">37-40</td>
			<td style="text-align: center;">36.5-40.5</td>
			<td style="text-align: center;">38.5</td>
			<td style="text-align: center;">17</td>
			<td style="text-align: center;">- 1</td>
			<td style="text-align: center;">- 17</td>
			<td style="text-align: center;">17</td>
		</tr>
		<tr>
			<td style="text-align: center;">41-44</td>
			<td style="text-align: center;">40.5-44.5</td>
			<td style="text-align: center;">42.5</td>
			<td style="text-align: center;">21</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
		</tr>
		<tr>
			<td style="text-align: center;">45-48</td>
			<td style="text-align: center;">44.5-52.5</td>
			<td style="text-align: center;">46.5</td>
			<td style="text-align: center;">22</td>
			<td style="text-align: center;">1</td>
			<td style="text-align: center;">22</td>
			<td style="text-align: center;">22</td>
		</tr>
		<tr>
			<td style="text-align: center;">49-52</td>
			<td style="text-align: center;">48.5-52.5</td>
			<td style="text-align: center;">50.5</td>
			<td style="text-align: center;">25</td>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">50</td>
			<td style="text-align: center;">100</td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;"><strong>100</strong></td>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;"><strong>25</strong></td>
			<td style="text-align: center;"><strong>199</strong></td>
		</tr>
	</tbody>
</table>

<p>Mean&nbsp;<span class="math-tex">{tex}(\\bar x) = A + \\frac{{\\Sigma fu}}{N} \\times h{/tex}</span><br />
<span class="math-tex">{tex} = 42.5 + \\frac{{25}}{{100}} \\times 4{/tex}</span><br />
= 42.5 + 1 = 43.5 mm<br />
Standard deviation&nbsp;<span class="math-tex">{tex}(\\sigma ) = \\frac{h}{N}\\sqrt {N\\Sigma f{u^2} - {{(\\Sigma fu)}^2}}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{4}{{100}}\\sqrt {100 \\times 199 - {{(25)}^2}} = \\frac{1}{{25}}\\sqrt {19275}{/tex}</span><br />
<span class="math-tex">{tex} = \\frac{1}{{25}} \\times 138.83{/tex}</span> = 5.55</p></div></div></div>
`;

export const MISC_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>The mean and variance of eight observations are 9 and 9.25 respectively. If six of the observations are 6, 7, 10, 12, 12 and 13, find the remaining two observations.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let two remaining observations be x and y. Then<br /><span class="math-tex">{tex}\\frac{{6 + 7 + 10 + 12 + 12 + 13 + x + y}}{8} = 9{/tex}</span><br />&rArr; 60 + x + y = 72 &rArr; x + y = 12 ...(i)<br />Also <span class="math-tex">{tex}\\frac{1}{8}(6^2+7^2+10^2+12^2+12^2+13^2+x^2+y^2) - 9^2 = 9.25{/tex}</span><br />&rArr; x<sup>2</sup> + y<sup>2</sup> = 80 ...(ii)<br />Now (x + y)<sup>2</sup> + (x &minus; y)<sup>2</sup> = 2(x<sup>2</sup> + y<sup>2</sup>)<br />&rArr; (12)<sup>2</sup> + (x &minus; y)<sup>2</sup> = 2 &times; 80 &rArr; (x &minus; y)<sup>2</sup> = 16 &rArr; x &minus; y = <span class="math-tex">{tex}\\pm{/tex}</span> 4<br />Solving with x + y = 12: when x &minus; y = 4, x = 8, y = 4; when x &minus; y = &minus;4, x = 4, y = 8.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>The mean and variance of 7 observations are 8 and 16 respectively. If five of the observations are 2, 4, 10, 12, 14, find the remaining two observations.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let two remaining observations be x and y. Then<br /><span class="math-tex">{tex}\\frac{{2 + 4 + 10 + 12 + 14 + x + y}}{7} = 8{/tex}</span><br />&rArr; 42 + x + y = 56 &rArr; x + y = 14<br />Also <span class="math-tex">{tex}\\frac{1}{7}(2^2+4^2+10^2+12^2+14^2+x^2+y^2) - 8^2 = 16{/tex}</span><br />&rArr; x<sup>2</sup> + y<sup>2</sup> = 100 ...(ii)<br />Now (x + y)<sup>2</sup> + (x &minus; y)<sup>2</sup> = 2(x<sup>2</sup> + y<sup>2</sup>)<br />&rArr; (14)<sup>2</sup> + (x &minus; y)<sup>2</sup> = 2 &times; 100 &rArr; (x &minus; y)<sup>2</sup> = 4 &rArr; x &minus; y = <span class="math-tex">{tex}\\pm{/tex}</span> 2<br />Solving with x + y = 14: when x &minus; y = 2, x = 8, y = 6; when x &minus; y = &minus;2, x = 6, y = 8.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>The mean and standard deviation of six observations are 8 and 4, respectively. If each observation is multiplied by 3, find the new mean and new standard deviation of the resulting observations.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let x<sub>1</sub>,...,x<sub>6</sub> be six observations with mean 8, so <span class="math-tex">{tex}\\Sigma x_i = 48{/tex}</span>.<br />When each observation is multiplied by 3:<br />New mean <span class="math-tex">{tex}= \\frac{{3(x_1 + ... + x_6)}}{6} = \\frac{1}{2} \\times 48 = 24{/tex}</span><br />Since variance = 16, <span class="math-tex">{tex}\\Sigma x_i^2 = 480{/tex}</span>.<br />New variance <span class="math-tex">{tex}= \\frac{9}{6} \\times 480 - (24)^2 = 720 - 576 = 144{/tex}</span><br /><span class="math-tex">{tex}\\therefore{/tex}</span> New S.D. <span class="math-tex">{tex}= \\sqrt{144} = 12{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4</span></div><div class="question-text"><p>Given that <span class="math-tex">{tex}\\bar x{/tex}</span> is the mean and <span class="math-tex">{tex}\\sigma^2{/tex}</span> is the variance of n observations x<sub>1</sub>, x<sub>2</sub>, ..., x<sub>n</sub>. Prove that the mean and variance of the observations ax<sub>1</sub>, ax<sub>2</sub>, ..., ax<sub>n</sub> are <span class="math-tex">{tex}a\\bar x{/tex}</span> and <span class="math-tex">{tex}a^2\\sigma^2{/tex}</span>, respectively, <span class="math-tex">{tex}(a \\ne 0){/tex}</span>.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>New mean <span class="math-tex">{tex}= \\frac{{ax_1 + ax_2 + ... + ax_n}}{n} = \\frac{{a(x_1 + ... + x_n)}}{n} = a\\bar x{/tex}</span><br />New variance <span class="math-tex">{tex}= \\frac{{n(a^2x_1^2 + ... + a^2x_n^2) - (ax_1 + ... + ax_n)^2}}{{n^2}}{/tex}</span><br /><span class="math-tex">{tex}= a^2\\left[\\frac{{n(x_1^2 + ... + x_n^2) - (x_1 + ... + x_n)^2}}{{n^2}}\\right] = a^2\\sigma^2{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(1)</span></div><div class="question-text"><p>The mean and standard deviation of 20 observations are found to be 10 and 2, respectively. On rechecking, it was found that an observation 8 was incorrect. Calculate the correct mean and standard deviation in case the wrong item is omitted.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here n = 20, <span class="math-tex">{tex}\\bar x = 10{/tex}</span>, <span class="math-tex">{tex}\\sigma = 2{/tex}</span>.<br />Incorrect <span class="math-tex">{tex}\\Sigma x_i = 200{/tex}</span> and incorrect <span class="math-tex">{tex}\\Sigma x_i^2 = 2080{/tex}</span>.<br />Omitting the wrong item 8 (now 19 observations):<br />Correct <span class="math-tex">{tex}\\Sigma x_i = 200 - 8 = 192{/tex}</span> &rArr; Correct mean <span class="math-tex">{tex}= \\frac{192}{19} = 10.1{/tex}</span><br />Correct <span class="math-tex">{tex}\\Sigma x_i^2 = 2080 - 64 = 2016{/tex}</span><br />Correct variance <span class="math-tex">{tex}= \\frac{2016}{19} - \\left(\\frac{192}{19}\\right)^2 = \\frac{1440}{361}{/tex}</span><br />Correct S.D. <span class="math-tex">{tex}= \\sqrt{3.99} \\approx 1.997{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(2)</span></div><div class="question-text"><p>The mean and standard deviation of 20 observations are found to be 10 and 2, respectively. On rechecking, it was found that an observation 8 was incorrect. Calculate the correct mean and standard deviation in case it is replaced by 12.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here n = 20, incorrect <span class="math-tex">{tex}\\Sigma x_i = 200{/tex}</span>, incorrect <span class="math-tex">{tex}\\Sigma x_i^2 = 2080{/tex}</span>.<br />Replacing 8 by 12:<br />Correct <span class="math-tex">{tex}\\Sigma x_i = 200 - 8 + 12 = 204{/tex}</span> &rArr; Correct mean <span class="math-tex">{tex}= \\frac{204}{20} = 10.2{/tex}</span><br />Correct <span class="math-tex">{tex}\\Sigma x_i^2 = 2080 - 64 + 144 = 2160{/tex}</span><br />Correct variance <span class="math-tex">{tex}= \\frac{2160}{20} - \\left(\\frac{204}{20}\\right)^2 = \\frac{1584}{400}{/tex}</span><br />Correct S.D. <span class="math-tex">{tex}= \\sqrt{3.96} \\approx 1.989{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>The mean and standard deviation of a group of 100 observations were found to be 20 and 3, respectively. Later on it was found that three observations were incorrect, which were recorded as 21, 21 and 18. Find the mean and standard deviation if the incorrect observations are omitted.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here n = 100, <span class="math-tex">{tex}\\bar x = 20{/tex}</span>, <span class="math-tex">{tex}\\sigma = 3{/tex}</span>.<br />Incorrect <span class="math-tex">{tex}\\Sigma x_i = 2000{/tex}</span>, incorrect <span class="math-tex">{tex}\\Sigma x_i^2 = 40900{/tex}</span>.<br />Omitting 21, 21, 18 (now 97 observations):<br />Correct <span class="math-tex">{tex}\\Sigma x_i = 2000 - 21 - 21 - 18 = 1940{/tex}</span> &rArr; Correct mean <span class="math-tex">{tex}= \\frac{1940}{97} = 20{/tex}</span><br />Correct <span class="math-tex">{tex}\\Sigma x_i^2 = 40900 - 441 - 441 - 324 = 39694{/tex}</span><br />Correct variance <span class="math-tex">{tex}= \\frac{39694}{97} - (20)^2 = 409.22 - 400 = 9.22{/tex}</span><br />Correct S.D. <span class="math-tex">{tex}= \\sqrt{9.22} \\approx 3.036{/tex}</span></p></div></div></div>
`;

export default { EX13_1_HTML, EX13_2_HTML, MISC_HTML };