// probabilityContent.js
// NCERT Solutions — Class 11 Mathematics, Chapter 14: Probability.
//   EXAMPLES (20 of 32) | EX14_1 (20 of 25) | EX14_2 (20 of 45) | MISC (16)
//   Examples (p.1/2), Ex 14.1 (p.1/2), Ex 14.2 (p.1/3) PARTIAL; Misc complete.
// Math uses {tex}...{/tex} (LaTeX), rendered by Ncert2Screen's tex-mml-chtml build.

export const EXAMPLES_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(1)</span></div><div class="question-text"><p>Consider the experiment of rolling a die. Let A be the event getting a prime number, B be the event getting an odd number. Write the sets representing&nbsp;the event&nbsp;A or B</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here sample&nbsp; space s= {1, 2, 3, 4, 5, 6}, A = {2, 3, 5} and B = {1, 3, 5}<br />
&lsquo;A or B&rsquo; = A <span class="math-tex">{tex}\\cup{/tex}</span>&nbsp;B = {1, 2, 3, 5}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(2)</span></div><div class="question-text"><p>Consider the experiment of rolling a die. Let A be the event getting a prime number, B be the event getting an odd number. Write the sets representing&nbsp;the event&nbsp;A and B.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here sample space S = {1, 2, 3, 4, 5, 6}, A = {2, 3, 5} and B = {1, 3, 5}<br />
&lsquo;A and B&rsquo; = A <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;B = {3,5}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(3)</span></div><div class="question-text"><p>Consider the experiment of rolling a die. Let A be the event getting a prime number, B be the event getting an odd number. Write the sets representing&nbsp;the event&nbsp;A but not B.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here sample space S = {1, 2, 3, 4, 5, 6}, A = {2, 3, 5} and B = {1, 3, 5}<br />
&lsquo;A but not B&rsquo; = A &ndash; B = {2}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(4)</span></div><div class="question-text"><p>Consider the experiment of rolling a die. Let A be the event getting a prime number, B be the event getting an odd number. Write the sets representing&nbsp;the event not A.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here the sample space S = {1, 2, 3, 4, 5, 6}, A = {2, 3, 5} and B = {1, 3, 5}<br />
&lsquo;not A&rsquo; = A&prime; = {1,4,6}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>Two dice are thrown and the sum of the numbers which come up on the&nbsp;dice is noted. Let us consider the following events associated with this experiment<br />
A: the sum is even.<br />
B: the sum is a multiple of 3.<br />
C: the sum is less than 4.<br />
D: the sum is greater than 11.<br />
Which pairs of these events are mutually exclusive?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Two dice are thrown so there are 36 elements in the sample space S = {(x, y): x, y = 1, 2, 3, 4, 5, 6}.<br />
Then<br />
A = {(1, 1), (1, 3), (1, 5), (2, 2), (2, 4), (2, 6), (3, 1), (3, 3), (3, 5), (4, 2), (4, 4), (4, 6), (5, 1), (5, 3), (5, 5), (6, 2), (6, 4), (6, 6)}<br />
B = {(1, 2), (2, 1), (1, 5), (5, 1), (3, 3), (2, 4), (4, 2), (3, 6), (6, 3), (4, 5), (5, 4), (6, 6)}<br />
C = {(1, 1), (2, 1), (1, 2)} and<br />
D = {(6, 6)}<br />
For mutually exclusive events, there should be no element common,<br />
We find that A <span class="math-tex">{tex}\\cap{/tex}</span> B = {(1, 5), (2, 4), (3, 3), (4, 2), (5, 1), (6, 6)} <span class="math-tex">{tex}\\ne{/tex}</span> <span class="math-tex">{tex}\\phi{/tex}</span><br />
Therefore, A and B are not mutually exclusive events.<br />
Similarly A <span class="math-tex">{tex}\\cap{/tex}</span> C <span class="math-tex">{tex}\\ne{/tex}</span>&nbsp;<span class="math-tex">{tex}\\phi{/tex}</span>, A <span class="math-tex">{tex}\\cap{/tex}</span> D <span class="math-tex">{tex}\\ne{/tex}</span>&nbsp;<span class="math-tex">{tex}\\phi{/tex}</span>, B <span class="math-tex">{tex}\\cap{/tex}</span> C <span class="math-tex">{tex}\\ne{/tex}</span>&nbsp;<span class="math-tex">{tex}\\phi{/tex}</span> and B <span class="math-tex">{tex}\\cap{/tex}</span> D <span class="math-tex">{tex}\\ne{/tex}</span>&nbsp;<span class="math-tex">{tex}\\phi{/tex}</span>.<br />
Thus, the pairs of events, (A, C), (A, D), (B, C), (B, D) are not mutually exclusive events.<br />
Also C <span class="math-tex">{tex}\\cap{/tex}</span> D =&nbsp;<span class="math-tex">{tex}\\phi{/tex}</span> and so C and D are mutually exclusive events.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>A coin is tossed three times, consider the&nbsp;events.<br />
A: &lsquo;No head appears&rsquo;,<br />
B: &lsquo;Exactly one head appears&rsquo; and<br />
C: &lsquo;Atleast two heads appear&rsquo;.<br />
Do they form a set of mutually exclusive and exhaustive events?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that three coins are tossed. The sample space of the experiment is<br />
S = {HHH, HHT, HTH, THH, HTT, THT, TTH, TTT}<br />
Now, outcomes of event&nbsp; A = {TTT},<br />
Outcomes of event B = {HTT, THT, TTH},<br />
Outcomes of event C = {HHT, HTH, THH, HHH}<br />
Now<br />
Since A <span class="math-tex">{tex}\\cup{/tex}</span>&nbsp;B <span class="math-tex">{tex}\\cup{/tex}</span>&nbsp;C = {TTT, HTT, THT, TTH, HHT, HTH, THH, HHH} = S<br />
Therefore, &nbsp; A, B and C are exhaustive events.<br />
Also, A <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;B = <span class="math-tex">{tex}\\phi{/tex}</span>, A <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;C = <span class="math-tex">{tex}\\phi{/tex}</span>&nbsp;and B <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;C = <span class="math-tex">{tex}\\phi{/tex}</span><br />
Therefore, the events are pair-wise disjoint, i.e., they are mutually exclusive.<br />
Hence, A, B and C form a set of mutually exclusive and exhaustive events.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(1)</span></div><div class="question-text"><p>Let a sample space be S = {<span class="math-tex">{tex}\\omega_1, \\omega_2,..., \\omega_6{/tex}</span>}. Which of the following assignments of probabilities to each outcome are valid?</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Outcomes</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_1{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_2{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_3{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_4{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_5{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_6{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 16{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 16{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 16{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 16{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 16{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 16{/tex}</span></td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given assignment is&nbsp;following both the&nbsp;conditions to be valid.<br />
Condition (i): Each of the number p(<span class="math-tex">{tex}\\omega_i{/tex}</span>) is positive and less than one.<br />
Condition (ii): Sum of probabilities<br />
<span class="math-tex">{tex}= \\frac16 + \\frac16 + \\frac16+ \\frac16+ \\frac16+\\frac16 = 1{/tex}</span><br />
Therefore, the assignment is valid</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(2)</span></div><div class="question-text"><p>Let a sample space be S = {<span class="math-tex">{tex}\\omega_1, \\omega_2,..., \\omega_6{/tex}</span>}. Which of the following assignments of probabilities to each outcome are valid?</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Outcomes</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_1{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_2{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_3{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_4{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_5{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_6{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">1</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
			<td style="text-align: center;">0</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>As we see that the given assignment is following both the conditions of axiomatic approach of probability<br />
Condition (i): Each of the number p(<span class="math-tex">{tex}\\omega_i{/tex}</span>) is 0 &le;p(<span class="math-tex">{tex}\\omega_i{/tex}</span>)&le; 1<br />
Condition (ii) Sum of the probabilities = 1 + 0 + 0 + 0 + 0 + 0 = 1<br />
Therefore, the assignment is valid.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(3)</span></div><div class="question-text"><p>Let a sample space be S = {<span class="math-tex">{tex}\\omega_1, \\omega_2,..., \\omega_6{/tex}</span>}. Which of the following assignments of probabilities to each outcome are valid?</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Outcomes</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_1{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_2{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_3{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_4{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_5{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_6{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 18{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 23{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 13{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 13{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}-\\frac 14{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}-\\frac 13{/tex}</span></td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Clearly we see that two of the probabilities p(<span class="math-tex">{tex}\\omega_5{/tex}</span>) and p(<span class="math-tex">{tex}\\omega_6{/tex}</span>) are negative so&nbsp;the assignment is not valid.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(4)</span></div><div class="question-text"><p>Let a sample space be S = {<span class="math-tex">{tex}\\omega_1, \\omega_2,..., \\omega_6{/tex}</span>}. Which of the following assignments of probabilities to each outcome are valid?</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Outcomes</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_1{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_2{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_3{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_4{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_5{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_6{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 1{12}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 1{12}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 16{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 16{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 16{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac 32{/tex}</span></td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We know that in no case P &gt; 1.<br />
Since p(<span class="math-tex">{tex}\\omega_6{/tex}</span>) =&nbsp;<span class="math-tex">{tex}\\frac32{/tex}</span>&gt;&nbsp;1, the assignment is not valid.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(5)</span></div><div class="question-text"><p>Let a sample space be S = {<span class="math-tex">{tex}\\omega_1, \\omega_2,..., \\omega_6{/tex}</span>}. Which of the following assignments of probabilities to each outcome are valid?</p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Outcomes</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_1{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_2{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_3{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_4{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_5{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_6{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">0.1</td>
			<td style="text-align: center;">0.2</td>
			<td style="text-align: center;">0.3</td>
			<td style="text-align: center;">0.4</td>
			<td style="text-align: center;">0.5</td>
			<td style="text-align: center;">0.6</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Since, sum of probabilities = 0.1 + 0.2 + 0.3 + 0.4 + 0.5 + 0.6 = 2.1.<br />
Hence,&nbsp; the assignment is not valid.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(1)</span></div><div class="question-text"><p>One card is drawn from a well shuffled deck of 52 cards. If each outcome&nbsp;is equally likely, calculate the probability that the card will be a&nbsp;diamond.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>When a card is drawn from a well shuffled deck of 52 cards,<br />
Total&nbsp;number of possible outcomes =&nbsp;52.<br />
Let A be the event &#39;the card drawn is a diamond&#39;<br />
Clearly the number of elements in set A is 13.<br />
Total number of favorable outcomes = 13<br />
Therefore, P(A)&nbsp;<span class="math-tex">{tex}= \\frac {13}{52} = \\frac 14{/tex}</span><br />
i.e. probability of being a diamond card =&nbsp;<span class="math-tex">{tex}\\frac 14{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(2)</span></div><div class="question-text"><p>One card is drawn from a well shuffled deck of 52 cards. If each outcome&nbsp;is equally likely, calculate the probability that the card will be not an ace.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>When a card is drawn from a well shuffled deck of 52 cards, the number of&nbsp;possible outcomes is 52.<br />
Let A be the event &lsquo;Card drawn is an ace&rsquo;.<br />
Since there are 4 cards of ace, so P(<strong>B</strong>) =&nbsp;<span class="math-tex">{tex}\\frac{4}{52}{/tex}</span><br />
We know that &nbsp;P(<span class="math-tex">{tex}\\bar B{/tex}</span>) = 1 &ndash; &nbsp;P(B) =&nbsp;<span class="math-tex">{tex}= 1 - \\frac 4{52} = 1 - \\frac 1{13} = \\frac {12}{13}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(3)</span></div><div class="question-text"><p>One card is drawn from a well shuffled deck of 52 cards. If each outcome&nbsp;is equally likely, calculate the probability that the card will be a black card (i.e., a club or, a spade).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>When a card is drawn from a well shuffled deck of 52 cards, the number of&nbsp;possible outcomes is 52.<br />
Let C be&nbsp;the event &lsquo;card drawn is black card&rsquo;.<br />
Since total number of black cards&nbsp;= 26<br />
So, P(C) =&nbsp;<span class="math-tex">{tex}\\frac {26}{52} = \\frac 12{/tex}</span><br />
Thus, probability of a black card =&nbsp;&nbsp;<span class="math-tex">{tex}\\frac 12{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(4)</span></div><div class="question-text"><p>One card is drawn from a well shuffled deck of 52 cards. If each outcome&nbsp;is equally likely, calculate the probability that the card will be not a diamond.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>When a card is drawn from a well shuffled deck of 52 cards, the number of&nbsp;possible outcomes =&nbsp;52.<br />
Let A be the event &#39;the card drawn is a diamond&#39;<br />
We know that total&nbsp;number of diamond cards =&nbsp;13.<br />
Therefore, P(A)<span class="math-tex">{tex}= \\frac {13}{52} = \\frac 14{/tex}</span><br />
So the event &lsquo;card drawn is not a diamond&rsquo; may be denoted as A&#39; or &lsquo;not A&rsquo;<br />
Now P(not A) = 1 &ndash; P(A) <span class="math-tex">{tex}= 1-\\frac14 = \\frac 34 {/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(5)</span></div><div class="question-text"><p>One card is drawn from a well shuffled deck of 52 cards. If each outcome&nbsp;is equally likely, calculate the probability that the card will be not a black card.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>When a card is drawn from a well shuffled deck of 52 cards, the number of possible outcomes =&nbsp;52.<br />
Let C be&nbsp;the event &lsquo;card drawn is black card&rsquo;<br />
As we know that total number of black cards = 26<br />
So&nbsp;P(C) = <span class="math-tex">{tex}\\frac {26}{52} = \\frac 12{/tex}</span><br />
Thus, probability of a black card = <span class="math-tex">{tex}\\frac 12{/tex}</span><br />
The event &lsquo;card drawn is not a black card&rsquo; may be denoted as C&prime; or &lsquo;not C&rsquo;.<br />
We know that P(not C) = 1 &ndash; P(C) = <span class="math-tex">{tex}1 - \\frac 12 = \\frac 12{/tex}</span><br />
Therefore, probability of not a black card = <span class="math-tex">{tex}\\frac 12{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>A bag contains 9 discs of which 4 are red, 3 are blue and 2 are yellow. The discs are similar in shape and size. A disc is drawn at random from the bag.&nbsp;Calculate the probability that it will be</p>

<ol start="1" style="list-style-type: lower-roman;">
	<li>red</li>
	<li>yellow</li>
	<li>blue</li>
	<li>not blue</li>
	<li>either red or blue.</li>
</ol></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>There are 9 discs in all so the total number of possible outcomes = n(S) =&nbsp;9.<br />
Let the events A, B, C be defined as<br />
A: &lsquo;the disc drawn is red&rsquo;<br />
B: &lsquo;the disc drawn is yellow&rsquo;<br />
C: &lsquo;the disc drawn is blue&rsquo;.</p>

<p>So, now</p>

<ol start="1" style="list-style-type: lower-roman;">
	<li>The number of red discs =number of favourable outcomes= 4, i.e., n (A) = 4<br />
	Hence P(A) = <span class="math-tex">{tex}\\frac 49{/tex}</span></li>
	<li>The number of yellow discs =number of favourable outcomes= 2, i.e., n (B) = 2<br />
	Therefore, P(B) = <span class="math-tex">{tex}\\frac 29{/tex}</span></li>
	<li>The number of blue discs =number of favourable outcomes= 3, i.e., n(C) = 3<br />
	Therefore, P(C) = <span class="math-tex">{tex}\\frac 39 = \\frac 13{/tex}</span></li>
	<li>Clearly the event &lsquo;not blue&rsquo; is &lsquo;not C&rsquo;. We know that P(not C) = 1 &ndash; P(C)<br />
	Therefore P(not C) = <span class="math-tex">{tex}1-\\frac 13 = \\frac 23{/tex}</span></li>
	<li>The event &lsquo;either red or blue&rsquo; may be described by the set &lsquo;A or C&rsquo;<br />
	Since, A and C are mutually exclusive events, we have<br />
	P(A or C) = P (A <span class="math-tex">{tex}\\cup{/tex}</span> C) = P(A) + P(C) =&nbsp;<span class="math-tex">{tex}\\frac 43 + \\frac 13 = \\frac 79{/tex}</span></li>
</ol></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7(1)</span></div><div class="question-text"><p>Two students Anil and Ashima appeared in an examination. The probability that Anil will qualify the examination is 0.05 and that Ashima will qualify the examination is 0.10. The probability that both will qualify the examination is 0.02. Find the probability that Both Anil and Ashima will not qualify the examination.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let E and F denote the events that Anil and Ashima will qualify the examination, respectively.<br />
Given that<br />
P(E) = 0.05, P(F) = 0.10 and P(E <span class="math-tex">{tex}\\cap{/tex}</span> F) = 0.02.<br />
Now,the event &lsquo;both Anil and Ashima will not qualify the examination&rsquo; may be expressed as &nbsp;E&acute; <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F&acute;.<br />
Since, E&acute; is &lsquo;not E&rsquo;, i.e., Anil will not qualify the examination and F&acute; is &lsquo;not F&rsquo;, i.e., Ashima will not qualify the examination.<br />
Also&nbsp;E&acute; <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F&acute; = (E <span class="math-tex">{tex}\\cup{/tex}</span> F)&acute; (by Demorgan&#39;s Law)<br />
So, P(E&acute; <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F&acute;) = P(E <span class="math-tex">{tex}\\cup{/tex}</span> F)&acute;<br />
Applying the formula,<br />
P(E <span class="math-tex">{tex}\\cup{/tex}</span> F) = P(E) + P(F) &ndash; &nbsp;P(E <span class="math-tex">{tex}\\cup{/tex}</span>&nbsp;F)<br />
or&nbsp;P(E &cup; F) = 0.05 + 0.10 &ndash; 0.02 = 0.13<br />
Therefore P(E&acute; <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F&acute;) = P(E <span class="math-tex">{tex}\\cup{/tex}</span>&nbsp;F)&acute; = 1 &ndash; P(E <span class="math-tex">{tex}\\cup{/tex}</span>&nbsp;F) = 1 &ndash; 0.13 = 0.87</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7(2)</span></div><div class="question-text"><p>Two students Anil and Ashima appeared in an examination. The probability that Anil will qualify the examination is 0.05 and that Ashima will qualify the examination is 0.10. The probability that both will qualify the examination is 0.02. Find the probability that at least one of them will not qualify the examination.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let E and F denote the events that Anil and Ashima will qualify the examination, respectively.<br />
Given that<br />
P(E) = 0.05, P(F) = 0.10 and P(E <span class="math-tex">{tex}\\cap{/tex}</span> F) = 0.02.<br />
P(at least one of them will not qualify)<br />
= 1 -&nbsp;P(both of them will qualify)<br />
= 1 - P(E <span class="math-tex">{tex}\\cap{/tex}</span> F)<br />
= 1 -&nbsp;0.02<br />
= 0.98</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7(3)</span></div><div class="question-text"><p>Two students Anil and Ashima appeared in an examination. The probability that Anil will qualify the examination is 0.05 and that Ashima will qualify the examination is 0.10. The probability that both will qualify the examination is 0.02. Find the probability that only one of them will qualify the examination.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let E and F be the events that Anil and Ashima will qualify the examination, respectively.<br />
Given that<br />
P(E) = 0.05, P(F) = 0.10 and P(E <span class="math-tex">{tex}\\cap{/tex}</span> F) = 0.02.<br />
The event only one of them will qualify the examination is same as the event&nbsp;either (Anil will qualify, and Ashima will not qualify) or (Anil will not qualify and Ashima will qualify) i.e., E <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F&acute; or E&acute; <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F, where E <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F&acute; and E&acute; <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F are mutually exclusive<br />
Therefore, &nbsp;<br />
P(only one of them will qualify)<br />
= P(E <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F&acute; or E&acute; <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F)<br />
= P(E <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F&acute;) + P(E&acute; <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F) - P [(E <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F&acute;) <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;P(E&acute; <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F)] [by&nbsp;general addition rule and also P [(E <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F&acute;) <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;P(E&acute; <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F)]= 0]<br />
= P (E) &ndash; P(E <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F) + P(F) &ndash; P (E <span class="math-tex">{tex}\\cap{/tex}</span>&nbsp;F)<br />
= 0.05 &ndash; 0.02 + 0.10 &ndash; 0.02 = 0.11</p></div></div></div>
`;

export const EX14_1_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1</span></div><div class="question-text"><p>A die is rolled. Let E be the event <strong>die shows 4</strong>&nbsp;and F be the event <strong>die shows even number</strong>. Are E and F mutually exclusive?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>When a die is rolled then S = {1, 2, 3, 4, 5, 6}<br />
E: die shows 4 = {4}<br />
F: die shows even number = {2, 4.6}<br />
Now <span class="math-tex">{tex}E \\cap F = (4) \\ne \\phi{/tex}</span><br />
Thus E and F are not mutually exclusive events.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>A die is thrown. Describe the following events:</p>

<ol start="1" style="list-style-type: lower-roman;">
	<li>A: a number less than 7</li>
	<li>B: a number greater than 7</li>
	<li>C: a multiple of 3</li>
	<li>D: a number less than 4</li>
	<li>E: an even number greater than 4</li>
	<li>F: a number not less than 3</li>
</ol>

<p>Also find <span class="math-tex">{tex}{A\\cup B}{/tex}</span>, <span class="math-tex">{tex}{A\\cap B}{/tex}</span>, <span class="math-tex">{tex}{B\\cup C}{/tex}</span>, <span class="math-tex">{tex}{E\\cap F}{/tex}</span>, <span class="math-tex">{tex}{D\\cap E}{/tex}</span>, A &ndash;C, D&ndash;E, <span class="math-tex">{tex}{E\\cap F'}{/tex}</span>, F&#39;.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>When a die is thrown then, the sample space is given by, S = {1, 2, 3, 4, 5, 6}</p>

<ol start="1" style="list-style-type: lower-roman;">
	<li>A: a number less than 7 = {1, 2, 3, 4, 5, 6}</li>
	<li>B: a number greater than 7 = <span class="math-tex">{tex}\\phi{/tex}</span></li>
	<li>C: a multiple of 3 = {3, 6}</li>
	<li>D: a number less than,4 = {1, 2, 3}</li>
	<li>E: an even number greater than 4 = {6}</li>
	<li>F: a number not less than 3 = {3, 4, 5, 6}</li>
</ol>

<p>Now : <span class="math-tex">{tex}A\\cup B=\\{1,\\;2,\\;3,\\;4,\\;5,\\;6\\}{/tex}</span>,<br />
<span class="math-tex">{tex}A \\cap B = \\phi{/tex}</span>,<br />
<span class="math-tex">{tex}B\\cup C=\\{3,6\\}{/tex}</span>,<br />
<span class="math-tex">{tex}E\\cap F=\\{6\\}{/tex}</span>,<br />
<span class="math-tex">{tex}D \\cap E = \\phi{/tex}</span>,<br />
A - C = {1, 2, 4, 5},<br />
D - E = {1, 2, 3},<br />
Since, <span class="math-tex">{tex}F'=\\{1,\\;2\\}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore {/tex}</span> <span class="math-tex">{tex}E\\cap F'=\\{\\phi\\}{/tex}</span>,<br />
<span class="math-tex">{tex}F'=\\{1,\\;2\\}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3</span></div><div class="question-text"><p>An experiment involves rolling a pair of dice and recording the numbers that come up. Describe the following events:<br />
A: the sum is greater than 8, B: 2 occurs on either die.<br />
C: the sum is at least 7 and a multiple of 3<br />
which pairs of these events are mutually exclusive?</p>
</div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>When a pair of die is rolled&nbsp;then the sample space (S) is given by,&nbsp;<br />
S = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
&nbsp; &nbsp; &nbsp; &nbsp;(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6)<br />
&nbsp; &nbsp; &nbsp; (3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
&nbsp; &nbsp; &nbsp; (4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6)<br />
&nbsp; &nbsp; &nbsp;(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)<br />
&nbsp; &nbsp; (6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
A : the sum is greater than 8.&nbsp;</p>

<p><span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp; A = {(3, 6), (4, 5),&nbsp;(4, 6), (5, 4), (5, 5), (5, 6), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
B : 2 occurs on either die :&nbsp; &nbsp;</p>

<p><span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp; B = {(1, 2), (2, 2), (3, 2), (4, 2), (5, 2), (6, 2), (2,1), (2, 3), (2, 4), (2,5) (2, 6)}<br />
C: the sum is at least 7 and a multiple of 3.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp; &nbsp;C&nbsp; = {(3, 6), (6, 3), (5, 4), (4, 5), (6, 6)}<br />
Now&nbsp;&nbsp;<span class="math-tex">{tex}\\style{font-size:28px}{A\\cap B=\\phi}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp; &nbsp;A and B are mutually exclusive events.&nbsp;</p>

<p>&nbsp;<span class="math-tex">{tex}\\style{font-size:28px}{B\\cap C=\\phi}{/tex}</span><br />
&nbsp;B and C are mutually exclusive events.<br />
<span class="math-tex">{tex}\\style{font-size:28px}{A\\cap C}{/tex}</span>= {(3, 6), (4, 5), (5, 4), (6, 3), (6, 6)} <span class="math-tex">{tex}\\style{font-size:28px}{⧧\\phi}{/tex}</span><br />
Thus A and C are not mutually exclusive events.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(1)</span></div><div class="question-text"><p>Three coins are tossed once. Let A denote the event three heads show, B denote the event two heads and one tail show, C denote the event three tails show&nbsp;and D denote the event a head shows on the first coin. find Mutually exclusive?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>When three coins are tossed then the sample space (S) =2<sup>3</sup>&nbsp;= 8 and it is given by<br />
S = {HHH, HHT, HTH, THH, TTH, THT, HTT, TTT}<br />
A: three heads show = {HHH}<br />
B: two heads and one tail show = {HHT, HTH, THH}<br />
C: three tails show = {TTT}<br />
D: a head shows on the first coin - {HHH, HHT, HTH, HTT}<br />
Here we have to examine which of the above events are mutually exclusive.<br />
As we know that if two events do not have any common element<br />
i.e., if intersection of two events is&nbsp;<span class="math-tex">{tex}\\style{font-size:24px}\\phi{/tex}</span>&nbsp;,<br />
then those events are called mutually exclusive events.<br />
Here,clearly&nbsp;&nbsp;<span class="math-tex">{tex}\\style{font-size:28px}{A\\cap B=\\phi}{/tex}</span>,&nbsp; &nbsp;<span class="math-tex">{tex}\\style{font-size:28px}{B\\cap C=\\phi}{/tex}</span>,&nbsp; <span class="math-tex">{tex}\\style{font-size:28px}{A\\cap C=\\phi}{/tex}</span>&nbsp;,&nbsp;<span class="math-tex">{tex}\\style{font-size:28px}{C\\cap D=\\phi}{/tex}</span><br />
Hence, events A and B, events B and C, events A and C, events C and D are mutually exclusive events.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(2)</span></div><div class="question-text"><p>Three coins are tossed once. Let A denote the event three heads show, B denote the event two heads and one tail show, C denote the event three tails show&nbsp;and D denote the event a head shows on the first coin. Find Simple events?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that three coins are tossed then the sample space (S) is given by</p>

<p>S = {HHH, HHT, HTH, THH, TTH, THT, HTT, TTT}<br />
Event A: three heads show = {HHH}<br />
Event B: two heads and one tail show = {HHT, HTH, THH}<br />
Event C: three tails show = {TTT}<br />
Event D: a head shows on the first coin - {HHH, HHT, HTH, HTT}<br />
Simple events have only one outcome<br />
A ={HHH}, Here cardinal number&nbsp; = 1<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp; A is a simple event.<br />
Since, C = {TTT}, Here also cardinal number = 1<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;C is a simple event.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(3)</span></div><div class="question-text"><p>Three coins are tossed once. Let A denote the event three heads show, B denote the event two heads and one tail show, C denote the event three tails show&nbsp;and D denote the event a head shows on the first coin. Find Compound events?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that three coins are tossed. So&nbsp;sample space (S) is given by</p>

<p>S = {HHH, HHT,&nbsp;HTH, THH, TTH, THT, HTT, TTT}<br />
Event A: three heads show = {HHH}<br />
Event B: two heads and one tail show = {HHT, HTH, THH}<br />
Event C: three tails show = {TTT}<br />
Event D: a head shows on the first coin - {HHH, HHT, HTH, HTT}<br />
A compound event is the occurrence of two or more outcomes&nbsp;together.<br />
We see that,&nbsp; B = {HHT, HTH, THH}, and&nbsp;D = {HHH, HHT, HTH, HTT}.<br />
Since cardinal numbers of events B and D are respectively 3 and 4,<br />
So, B and D are compound events.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(1)</span></div><div class="question-text"><p>Three coins are tossed. Describe&nbsp;Two events which are mutually exclusive.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>When three coins are tossed then sample space (S) is given by&nbsp;S = {HHH, HHT, HTH, THH, HTT, THT, TTH, TTT}<br />
Let event&nbsp;A: getting at least two heads = {HHH, HHT, HTH, THH}&nbsp;and<br />
event B: getting at least two tails = {HTT, THT, TTH, TTT}<br />
There should not be any element common for the events to be mutually exclusive.<br />
since <span class="math-tex">{tex}{A\\cap B=\\phi}{/tex}</span><br />
Thus A and B are mutually exclusive events.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(2)</span></div><div class="question-text"><p>Three coins are tossed. Describe&nbsp;Three events which are mutually exclusive and exhaustive.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>When three coins are tossed then sample space (S) is given by</p>

<p>S = {HHH, HHT, HTH, THH, HTT, THT, TTH, TTT}</p>

<p>Now, let A be the event: getting at least two heads = {HHH, HHT, HTH, THH}<br />
B be the event: getting exactly one head = {HTT, THT, TTH}<br />
and C be th event: getting no head = {TTT}</p>

<p>Mutually exclusive events are those in which no element is common<br />
Since&nbsp;<span class="math-tex">{tex}{A\\cap B=\\phi}{/tex}</span>. <span class="math-tex">{tex}\\therefore{/tex}</span> A and B are mutually exclusive events,<br />
&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;<span class="math-tex">{tex}\\style{font-size:28px}{B\\cap C=\\phi}{/tex}</span>. <span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;B and C are mutually exclusive events,<br />
&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<span class="math-tex">{tex}\\style{font-size:28px}{A\\cap C=\\phi}{/tex}</span>. <span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp; A and C are mutually exclusive events.<br />
Thus A, B, C are mutually exclusive events.<br />
Also, as&nbsp;<span class="math-tex">{tex}{A\\cup B\\cup C=\\{HHH,\\;HHT,\\;HTH,\\;THH,\\;HTT,\\;THT,\\;TTH,\\;TTT\\}=S}{/tex}</span><br />
So, A, B, C are exhaustive events.<br />
A, B, C are three events which are mutually exclusive and exhaustive.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(3)</span></div><div class="question-text"><p>Three coins are tossed. Describe&nbsp;Two events, which are not mutually exclusive.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that three coins are tossed then sample space (S) is given by<br />
S = {HHH, HHT, HTH, THH, HTT, THT, TTH, TTT}<br />
Let event&nbsp;A: getting at least two heads = {HHH, HHT, HTH, THH}&nbsp;and&nbsp;<br />
event B: getting exactly two heads = {HHT, HTH, THH}<br />
Now&nbsp; <span class="math-tex">{tex}\\style{font-size:28px}{A\\cap B=\\{HHT,\\;HTH,\\;THH\\}⧧\\phi}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;A and B are not mutually exclusive.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(4)</span></div><div class="question-text"><p>Three coins are tossed. Describe Two events which are mutually exclusive but not exhaustive.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that three coins are tossed then sample space (S) is given by<br />
S = {HHH, HHT, HTH, THH, HTT, THT, TTH, TTT}<br />
Let event&nbsp;A: getting three heads = {HHH} and<br />
event B: getting three tails = {TTT}<br />
Now <span class="math-tex">{tex}{A\\cap B=\\phi}{/tex}</span> and <span class="math-tex">{tex}{AUB=\\{HHH,\\;TTT\\;\\}⧧S}{/tex}</span><br />
Thus A and B are mutually exclusive but not exhaustive.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(5)</span></div><div class="question-text"><p>Three coins are tossed. Describe&nbsp;Three events which are mutually exclusive but not exhaustive.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that three coins are tossed then sample space (S) is given by</p>

<p>S = {HHH, HHT, HTH, THH, HTT, THT, TTH, TTT}<br />
Let event A: getting three heads = {HHH},<br />
event B: getting exactly two heads = {HHT, HTH, THH} and<br />
event C: getting three tails = {TTT}<br />
Now <span class="math-tex">{tex}\\style{font-size:28px}{A\\cap B=\\phi}{/tex}</span>,&nbsp; <span class="math-tex">{tex}\\style{font-size:28px}{B\\cap C=\\phi}{/tex}</span>&nbsp;and&nbsp; <span class="math-tex">{tex}\\style{font-size:28px}{A\\cap C=\\phi}{/tex}</span>&nbsp;<br />
Thus A, B, C are mutually exclusive events<br />
Also&nbsp;<span class="math-tex">{tex}{A\\cup B\\cup C=\\{HHH,\\;HHT,\\;HTH,\\;THH,\\;TTT\\;\\}⧧S}{/tex}</span><br />
Thus A, B, C are mutually exclusive but not exhaustive events.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6(1)</span></div><div class="question-text"><p>Two dice are thrown. The events A, B and C are as follows:<br />
A: getting an even number on the first die<br />
B: getting an odd number on the first die<br />
C: getting the sum of the numbers on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Describe the event&nbsp;A&#39;</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that two dice are thrown, so&nbsp;sample space is<br />
S = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(2, l), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event A: getting an even number on the first die.<br />
Outcomes of event A= {(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2,6),<br />
(4,1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6),<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event B: getting an odd number on the first die<br />
Outcomes of event B = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)}<br />
Event C: getting the sum of the number on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Outcomes of event C = {(1, 1),(1, 2), (1, 3), (1, 4), (2, 1), (2, 2), (2, 3), (3, 1), (3, 2), (4, 1)}<br />
A&#39; = S - A<br />
= (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)} = B</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6(2)</span></div><div class="question-text"><p>Two dice are thrown. The events A, B and C are as follows:<br />
A: getting an even number on the first die<br />
B: getting an odd number on the first die<br />
C: getting the sum of the numbers on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Describe the event not B</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that two dice are thrown. So sample space is<br />
S = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(2, l), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event A: getting an even number on the first die.<br />
Outcomes of event A= {(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2,6),<br />
(4,1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6),<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event B: getting an odd number on the first die<br />
Outcomes of event B = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)}<br />
Event C: getting the sum of the number on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Outcomes of event C = {(1, 1),(1, 2), (1, 3), (1, 4), (2, 1), (2, 2), (2, 3), (3, 1), (3, 2), (4, 1)}<br />
not B&nbsp;= {(2, l), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6),<br />
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6),<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)} = A</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6(3)</span></div><div class="question-text"><p>Two dice are thrown. The events A, B and C are as follows:<br />
A: getting an even number on the first die<br />
B: getting an odd number on the first die<br />
C: getting the sum of the numbers on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Describe the event A or B</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that two dice are thrown then sample space is<br />
S = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(2, l), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event A: getting an even number on the first die.<br />
Outcomes of event A = {(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2,6),<br />
(4,1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6),<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event B: getting an odd number on the first die<br />
Outcomes of event B&nbsp;={(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)}<br />
Event C: getting the sum of the number on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Outcomes of event C = {(1, 1),(1, 2), (1, 3), (1, 4), (2, 1), (2, 2), (2, 3), (3, 1), (3, 2), (4, 1)}<br />
A or B =<span class="math-tex">{tex}A \\cup B{/tex}</span> = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(2, l), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(4, l), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)} = S</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6(4)</span></div><div class="question-text"><p>Two dice are thrown. The events A, B and C are as follows:<br />
A: getting an even number on the first die<br />
B: getting an odd number on the first die<br />
C: getting the sum of the numbers on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Describe the event A and B</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that&nbsp;two dice are thrown then sample space is<br />
S = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(2, l), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event A: getting an even number on the first die.<br />
Outcomes of event A&nbsp;= {(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2,6),<br />
(4,1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6),<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event B: getting an odd number on the first die<br />
Outcomes of event B = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)}<br />
Event C: getting the sum of the number on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Outcomes of event C = {(1, 1),(1, 2), (1, 3), (1, 4), (2, 1), (2, 2), (2, 3), (3, 1), (3, 2), (4, 1)}<br />
A and B = <span class="math-tex">{tex}A \\cap B = \\phi{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6(5)</span></div><div class="question-text"><p>Two dice are thrown. The events A, B and C are as follows:<br />
A: getting an even number on the first die<br />
B: getting an odd number on the first die<br />
C: getting the sum of the numbers on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Describe the event A but not C</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that two dice are thrown then sample space is<br />
S = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(2, l), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event A: getting an even number on the first die.<br />
Outcomes of event A = {(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2,6),<br />
(4,1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6),<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event B: getting an odd number on the first die<br />
Outcomes of event B = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)}<br />
Event C: getting the sum of the number on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Outcomes of event C = {(1, 1),(1, 2), (1, 3), (1, 4), (2, 1), (2, 2), (2, 3), (3, 1), (3, 2), (4, 1)}<br />
A but not C = A - C<br />
= {(2, 4), (2, 5), (2, 6), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6(6)</span></div><div class="question-text"><p>Two dice are thrown. The events A, B and C are as follows:<br />
A: getting an even number on the first die<br />
B: getting an odd number on the first die<br />
C: getting the sum of the numbers on the dice <span class="math-tex">{tex}\\leq 5{/tex}</span><br />
Describe the event B or C</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that&nbsp;two dice are thrown then space space is<br />
S = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(2, l), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event A: getting an even number on the first die.<br />
Outcomes of event A = {(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2,6),<br />
(4,1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6),<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event B: getting an odd number on the first die<br />
Outcomes of event B = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)}<br />
Event C: getting the sum of the number on the dice <span class="math-tex">{tex}\\leq 5{/tex}</span><br />
Outcomes of event C = {(1, 1),(1, 2), (1, 3), (1, 4), (2, 1), (2, 2), (2, 3), (3, 1), (3, 2), (4, 1)}<br />
B or C = <span class="math-tex">{tex}B \\cup C{/tex}</span> =<br />
{(1,1), (1,2), (1, 3), (1, 4), (1, 5), (1, 6), (2, 1), (2, 2), (2, 3), (3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (4, 1), (5,1),(5,2), (5, 3), (5, 4), (5, 5), (5, 6)}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6(7)</span></div><div class="question-text"><p>Two dice are thrown. The events A, B and C are as follows:<br />
A: getting an even number on the first die<br />
B: getting an odd number on the first die<br />
C: getting the sum of the numbers on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Describe the event B and C</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that two dice are thrown then sample space&nbsp;is<br />
S = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event A: getting an even number on the first die.<br />
Outcomes of event A = {(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2,6),<br />
(4,1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6),<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event B: getting an odd number on the first die<br />
Outcomes of event B = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)}<br />
Event C: getting the sum of the number on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Outcomes of event C = {(1, 1),(1, 2), (1, 3), (1, 4), (2, 1), (2, 2), (2, 3), (3, 1), (3, 2), (4, 1)}<br />
B and C = <span class="math-tex">{tex}B \\cap C{/tex}</span> = {(1, 1), (1, 2), (1, 3), (1, 4), (3, 1), (3, 2)}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6(8)</span></div><div class="question-text"><p>Two dice are thrown. The events A, B and C are as follows:<br />
A: getting an even number on the first die<br />
B: getting an odd number on the first die<br />
C: getting the sum of the numbers on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Describe the event <span class="math-tex">{tex}A \\cap B'\\cap C'{/tex}</span></p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that two dice are thrown then sample space is<br />
S = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event A: getting an even number on the first die.<br />
Outcomes of event A = {(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2,6),<br />
(4,1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6),<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Event B: getting an odd number on the first die<br />
Outcomes of event B = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)<br />
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)}<br />
B&#39; = S - B<br />
= {(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2,6),<br />
(4,1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6),<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)} =&nbsp;A<br />
Event C: getting the sum of the number on the dice <span class="math-tex">{tex}\\le 5{/tex}</span><br />
Outcomes of event C = {(1, 1),(1, 2), (1, 3), (1, 4), (2, 1), (2, 2), (2, 3), (3, 1), (3, 2), (4, 1)}<br />
C&#39; = S - C<br />
=&nbsp;{(1, 5), (1, 6),(2, 4), (2, 5), (2, 6), (3, 3), (3, 4), (3, 5), (3, 6),(4, 2), (4, 3), (4, 4), (4, 5), (4, 6)<br />
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)<br />
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
Clearly,&nbsp;<span class="math-tex">{tex}A \\cap B' \\cap C'{/tex}</span> = {(2, 4), (2, 5), (2, 6), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6,6)}</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7(1)</span></div><div class="question-text"><p>Two dice are thrown. The events A, B, and C are as follows:<br />
A: getting an even number on the first die.<br />
B: getting an odd number on the first die.<br />
C: getting the sum of the numbers on the dice <span class="math-tex">{tex}\\le{/tex}</span>&nbsp;5.<br />
State true or false: A and B are mutually exclusive (give the reason for your answer).</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>True<br />
Solution: If two dice are thrown then, total number of possible outcomes S = 6 <span class="math-tex">{tex}\\times{/tex}</span> 6 = 36<br />
S = { (1, 1), (1, 2) , (1, 3), (1, 4), (1, 5), (1, 6), (2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6), (6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
A = getting an even number on the first die<br />
= {(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6) , (6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6) }<br />
B = getting an odd on the first die.<br />
= {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6)}<br />
C = getting the sum of the numbers on the die <span class="math-tex">{tex}\\le{/tex}</span> 5<br />
= {(1, 1), (1, 2), (1, 3), (1, 4), (2, 1), (2, 2), (2, 3), (3, 1), (3, 2), (4, 1)}<br />
True, &nbsp;A and B are mutually exclusive<br />
<span class="math-tex">{tex}\\because{/tex}</span>&nbsp;A = getting an even number on the first die.<br />
B = getting an odd number on the first die.<br />
A <span class="math-tex">{tex}\\cap{/tex}</span> B = <span class="math-tex">{tex}\\phi{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;A and B are mutually exclusive events.</p></div></div></div>
`;

export const EX14_2_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(1)</span></div><div class="question-text"><p>Which of the following can not be valid assignment of probabilities for outcomes of sample Space S =&nbsp;<span class="math-tex">{tex}\\{\\omega_{1}, \\omega_{2}, \\omega_{3}, \\omega_{4}, \\omega_{5}, \\omega_{6}, \\omega_{7}\\}{/tex}</span></p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Assignment</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{1}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{2}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{3}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{4}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{5}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{6}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{7}{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">0.1</td>
			<td style="text-align: center;">0.01</td>
			<td style="text-align: center;">0.05</td>
			<td style="text-align: center;">0.03</td>
			<td style="text-align: center;">0.01</td>
			<td style="text-align: center;">0.2</td>
			<td style="text-align: center;">0.6</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Both the conditions of axiomatic approach hold true in the given assignment, that is</p>

<ol>
	<li>Each of the probability&nbsp;p(w<sub>i</sub>) is less than one&nbsp;and is positive</li>
	<li>Sum of probabilities is 0.01 + 0.05 + 0.03 + 0.01 + 0.2 + 0.6 = 1</li>
</ol>

<p>Hence,the given assignment is valid.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(2)</span></div><div class="question-text"><p>Which of the following can not be valid assignment of probabilities for outcomes of sample Space S =&nbsp;<span class="math-tex">{tex}\\{\\omega_{1}, \\omega_{2}, \\omega_{3}, \\omega_{4}, \\omega_{5}, \\omega_{6}, \\omega_{7}\\}{/tex}</span></p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Assignment</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{1}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{2}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{3}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{4}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{5}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{6}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{7}{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{1}{7}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{1}{7}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{1}{7}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{1}{7}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{1}{7}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{1}{7}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{1}{7}{/tex}</span></td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Both the conditions of axiomatic approach hold true in the given assignment, that is</p>

<ol start="1" style="list-style-type: lower-roman;">
	<li>Each of the number p (w<sub>i</sub>) is less than or equal to one&nbsp;and is positive</li>
	<li>Sum of probabilities is&nbsp;<span class="math-tex">{tex}\\frac 17 +\\frac 17+\\frac 17+\\frac 17+\\frac 17+\\frac 17+\\frac 17+\\frac 77 = 1{/tex}</span></li>
</ol>

<p>Hence, the given assignment is valid.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(3)</span></div><div class="question-text"><p>Which of the following can not be valid assignment of probabilities for outcomes of sample Space S =&nbsp;<span class="math-tex">{tex}\\{\\omega_{1}, \\omega_{2}, \\omega_{3}, \\omega_{4}, \\omega_{5}, \\omega_{6}, \\omega_{7}\\}{/tex}</span></p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Assignment</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{1}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{2}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{3}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{4}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{5}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{6}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{7}{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">0.1</td>
			<td style="text-align: center;">0.2</td>
			<td style="text-align: center;">0.3</td>
			<td style="text-align: center;">0.4</td>
			<td style="text-align: center;">0.5</td>
			<td style="text-align: center;">0.6</td>
			<td style="text-align: center;">0.7</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Both the conditions of axiomatic approach in the given assignment are</p>

<ol start="1" style="list-style-type: lower-roman;">
	<li>Each of the number p(w<sub>i</sub>) is less than or equal to one&nbsp;and is positive,</li>
	<li>Sum of probabilities is 0.1 + 0.2 + 0.3 + 0.4 + 0.5 + 0.6 + 0.7 = 2.8 &gt; 1.</li>
</ol>

<p>It&#39;s clear that&nbsp;the second condition is not satisfied as the sum should be exactly equal to one.<br />
Hence, the given assignment is not valid.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(4)</span></div><div class="question-text"><p>Which of the following can not be valid assignment of probabilities for outcomes of sample Space S =&nbsp;<span class="math-tex">{tex}\\{\\omega_{1}, \\omega_{2}, \\omega_{3}, \\omega_{4}, \\omega_{5}, \\omega_{6}, \\omega_{7}\\}{/tex}</span></p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Assignment</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{1}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{2}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{3}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{4}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{5}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{6}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{7}{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;">-0.1</td>
			<td style="text-align: center;">0.2</td>
			<td style="text-align: center;">0.3</td>
			<td style="text-align: center;">0.4</td>
			<td style="text-align: center;">-0.2</td>
			<td style="text-align: center;">0.1</td>
			<td style="text-align: center;">0.3</td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The conditions of axiomatic approach do not hold true in the given assignment, because&nbsp;p(w<sub>1</sub>) and p(w<sub>4</sub>) is&nbsp;negative.<br />
To be the conditions true each of the number p(w<sub>i</sub>) should be less than or equal to one&nbsp;and positive.<br />
So, the assignment is not valid</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(5)</span></div><div class="question-text"><p>Which of the following can not be valid assignment of probabilities for outcomes of sample Space S =&nbsp;<span class="math-tex">{tex}\\{\\omega_{1}, \\omega_{2}, \\omega_{3}, \\omega_{4}, \\omega_{5}, \\omega_{6}, \\omega_{7}\\}{/tex}</span></p>

<table border="1" cellpadding="3" cellspacing="0" style="width:100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">Assignment</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{1}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{2}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{3}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{4}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{5}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{6}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\omega_{7}{/tex}</span></td>
		</tr>
		<tr>
			<td style="text-align: center;">&nbsp;</td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{1}{14}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{2}{14}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{3}{14}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{4}{14}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{5}{14}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{6}{14}{/tex}</span></td>
			<td style="text-align: center;"><span class="math-tex">{tex}\\frac{15}{14}{/tex}</span></td>
		</tr>
	</tbody>
</table></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The conditions of axiomatic approach in the given assignment are being fulfilled as&nbsp;p(w<sub>7</sub>)=<span class="math-tex">{tex}\\frac{15}{14}{/tex}</span>&gt;1 and probability should be less than or equal to one and positive.<br />
Hence, the given assignment is not valid.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>A coin is tossed twice, what is the probability that atleast one tail occurs?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Since a coin tossed twice,<br />
so the sample space (S) is given by S= {HH, HT, TH, TT}<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Total number of possible out comes n (S) = 4<br />
Let E be the event of getting at least one tail<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> n(E) = 3<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Probability of getting at least one tail <span class="math-tex">{tex}{P(E)=\\frac{n(E)}{n(S)}=\\frac34}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(1)</span></div><div class="question-text"><p>A die is thrown. Find the probability that a prime number will appear.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>As 2, 3, 5 are prime numbers up to 6, so the desired outcomes are 2, 3, 5, and total outcomes are 1, 2, 3, 4, 5, 6<br />
Therefore, total no. of outcomes are 6, and total no. of desired outcomes are 3<br />
Probability of getting a prime number =&nbsp;<span class="math-tex">{tex}\\frac{3}{6}{/tex}</span>&nbsp;=&nbsp;<span class="math-tex">{tex}\\frac{1}{2}{/tex}</span><br />
Conclusion: Probability of getting a prime number when a die is thrown is&nbsp;<span class="math-tex">{tex}\\frac{1}{2}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(2)</span></div><div class="question-text"><p>A die is thrown. Find the probability of a number greater than or equal to 3 will appear.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have to find the probability of getting&nbsp;a number greater than or equal to 3.<br />
The sample space associated with the random experiment of rolling a die is given by<br />
S = {1, 2, 3, 4 ,5 , 6}. Clearly, there are 6 elements in S.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;The total number of elementary events = 6.<br />
A number greater than or equal to 3 is obtained, if we get any one of 3, 4, 5, 6 as an outcome.<br />
So, favourable number of elementary events = 4<br />
Hence, the required probability =&nbsp;<span class="math-tex">{tex}\\frac{4}{6}=\\frac{2}{3}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(3)</span></div><div class="question-text"><p>A die is thrown, find the probability of A number less than or equal to 1 will appear.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>In a throw of a die, sample space S = {1, 2, 3, 4, 5, 6}<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;n(S) = 6<br />
Let C be the event of getting a number less than or equal to 1<br />
Elements of C = {1}&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> n(C) = 1<br />
Thus <span class="math-tex">{tex}P(C)=\\frac{{n(C)}}{{n(S)}} = \\frac{1}{6}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(4)</span></div><div class="question-text"><p>A die is thrown. Find the probability of a number more than 6 will appear.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have to&nbsp;find the probability of getting&nbsp;a number of more than 6<br />
The sample space associated with the random experiment of rolling a die is given by<br />
S = {1, 2, 3, 4 ,5 , 6}. Clearly, there are 6 elements in S.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>The total number of elementary events = 6.<br />
Since no face of the die is marked with a number greater than 6.<br />
So, favourable number of elementary events = 0<br />
Hence, required probability =&nbsp;<span class="math-tex">{tex}\\frac{0}{6}{/tex}</span> = 0<br />
In fact, the given event is an impossible event. So, the probability of its occurrence is zero.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(5)</span></div><div class="question-text"><p>A die is thrown, find the probability of A number less than 6 will appear.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here the sample space of the event is given by<br />
S = {1, 2, 3, 4, 5, 6}<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;n(S) = 6<br />
Let E be the event of getting a number less than 6<br />
E = {1, 2, 3, 4, 5}&nbsp;<span class="math-tex">{tex}\\Rightarrow{/tex}</span> n(E) = 5<br />
Thus,&nbsp;<span class="math-tex">{tex}P(E) = \\frac{{n(E)}}{{n(S)}} = \\frac{5}{6}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(1)</span></div><div class="question-text"><p>A card is selected from a pack of 52 cards.&nbsp;How many points are there in the sample space?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have to draw One card&nbsp;from a pack of 52 cards.<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> Number of points in the sample space S = n(S) = 52.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(2)</span></div><div class="question-text"><p>A card is selected from a pack of 52 cards.&nbsp;Calculate the probability that the card is an ace of spades.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let A be the event of drawing an ace of spades. Now there is only once ace of spade.<br />
Therefore,&nbsp;<br />
<span class="math-tex">{tex} P(A) = \\frac{1}{{52}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(3)</span></div><div class="question-text"><p>A card is selected from a pack of 52 cards.&nbsp;Calculate the probability that the card is an ace.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let B be the event of drawing an ace. We know that in&nbsp;a&nbsp;pack of 52 card there are four aces.<br />
<span class="math-tex">{tex}\\therefore P(B) = \\frac{4}{{52}} = \\frac{1}{{13}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(4)</span></div><div class="question-text"><p>A card is selected from a pack of 52 cards.&nbsp;Calculate the probability that the card is black card.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Let C be the event of drawing a black card. Now, we know that in a pack of 52 cards,&nbsp;there are 26 black cards.<br />
<span class="math-tex">{tex}\\therefore P(C) =\\frac{{number of favourable outcomes}}{{number of total outcomes}}= \\frac{{26}}{{52}} = \\frac{1}{2}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(1)</span></div><div class="question-text"><p>A fair coin with 1 marked on one face and 6 on the other and a fair die are both tossed. Find the probability that the sum of numbers that turn up is 3.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The coin with 1 marked on one face and 6 on the other face.<br />
The coin and die are tossed together.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> S = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;sample space of event is given by n(S) = 12<br />
Let A be the event having sum of numbers is 3<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> A = {(1, 2)}<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> n (A) = 1<br />
Thus, P(A) = <span class="math-tex">{tex}\\frac{1}{{12}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5(2)</span></div><div class="question-text"><p>A fair coin with 1 marked on one face and 6 on the other and a fair die are both tossed. Find the probability that the sum of numbers that turn up is 12.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>The coin with 1 marked on one face and 6 on the other face.<br />
The coin and die are tossed together.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> S = {(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)}<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span>&nbsp;smpale space&nbsp;n(S) = 12<br />
Let B be the event having a sum&nbsp;of the numbers is 12<br />
therefore, B = {(6, 6)}<br />
<span class="math-tex">{tex}\\Rightarrow{/tex}</span> n (B) = 1<br />
Thus,&nbsp;<span class="math-tex">{tex}P(B) = \\frac{1}{{12}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>There are four men and, six women on the city council. If one council member is selected for a committee at random, how likely is it that it is a woman?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here total members in the council = 4 + 6 = 10<br />
One member is selected out of 10 members<br />
<span class="math-tex">{tex}\\therefore \\;n(S){ = ^{10}}{C_1} = 10{/tex}</span><br />
Let A be the event that the member is a woman.<br />
<span class="math-tex">{tex}n(A){ = ^6}{C_1} = 6{/tex}</span><br />
Thus&nbsp;<span class="math-tex">{tex}P(A) = \\frac{{n(A)}}{{n(S)}} = \\frac{6}{{10}} = \\frac{3}{5}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>A fair coin is tossed&nbsp;four times, and&nbsp;a person win Rs.&nbsp;1 for each head&nbsp;and lose Rs. 1.50 for each tail that turns up.<br />
Form the sample space calculate how many different amounts of money you&nbsp;can have after four tosses and the probability of having each of these amounts.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here a coin is tossed four times. So number of elements in the sample space (S) will be 2<sup>4</sup> = 16. n(S) = 16.<br />
The sample space,<br />
S = {HHHH, HHHT, HHTH, HTHH, HTTH, HTHT, HHTT, HTTT, THHH, THHT, THTH, TTHH, TTTH, TTHT, THTT, TTTT}<br />
Amounts:</p>

<ol start="1" style="list-style-type: lower-roman;">
	<li>When 4 heads turns up = Rs( 1 + 1+ 1 + 1)= Rs. 4. i.e., Person wins Rs. 4</li>
	<li>When 3 heads and 1 tail turns up = Rs(1+ 1+1 &ndash;1.50 =Rs. 1.50. i.e.,Person wins Rs. 1.50</li>
	<li>When2 heads and 2 tails turns up = Rs(1 + 1&ndash; 1.50&ndash; 1.50) =&ndash; Rs. 1. i.e., Person losesRs. 1</li>
	<li>When1 head and 3 tails turns up = Rs(1&ndash; 1.50&ndash; 1.50&ndash; 1.50 )=&ndash; Rs 3.50. i.e., Person losesRs. 3.50</li>
	<li>When4 tails turns up= Rs(&ndash; 1.50&ndash; 1.50&ndash; 1.50&ndash; 1.50) =&ndash; Rs 6. i.e., Person loses Rs. 6</li>
</ol>

<p>Let the events for which the person wins Rs 4, wins Rs 1.50, loses Re1, loses Rs 3.50 and loses Rs 6<br />
be denoted by E<sub>1</sub>, E<sub>2</sub>, E<sub>3</sub>, E<sub>4</sub> and E<sub>5</sub>.<br />
i.e., E<sub>1</sub> = {HHHH}, E<sub>2</sub> = {HHHT, HHTH, HTHH, THHH} E<sub>3&nbsp;</sub>= {HHTT, HTHT, HTTH, THTH, THHT, TTHH}<br />
E<sub>4</sub> = {HTTT, TTTH, THTT, TTHT}, E<sub>5</sub> = {TTTT}<br />
Here, n(E<sub>1</sub>) = 1, n(E<sub>2</sub>) = 4, n(E<sub>3</sub>) = 6, n(E<sub>4</sub>) = 4 and n(E<sub>5</sub>) = 1.<br />
Hence,&nbsp;<span class="math-tex">{tex}\\style{font-size:26px}{P(E_1)=\\frac{n({E_1)}}{n(S)}=\\frac1{16}}{/tex}</span>,<br />
<span class="math-tex">{tex}\\style{font-size:26px}{P(E_2)=\\frac{n({E_2)}}{n(S)}=\\frac4{16}=\\frac14}{/tex}</span><br />
<span class="math-tex">{tex}\\style{font-size:26px}{P(E_3)=\\frac{n({E_3)}}{n(S)}=\\frac6{16}=\\frac38}{/tex}</span><br />
<span class="math-tex">{tex}\\style{font-size:26px}{P(E_4)=\\frac{n({E_4)}}{n(S)}=\\frac4{16}=\\frac14}{/tex}</span><br />
and&nbsp;<span class="math-tex">{tex}\\style{font-size:26px}{P(E_5)=\\frac{n({E_5)}}{n(S)}=\\frac1{16}=\\frac1{16}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8(1)</span></div><div class="question-text"><p>Three coins are tossed once. Find the probability of getting: 3 heads</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>When three coins are tossed then total outcomes,&nbsp;S = {HHH, HHT, HTH, THH, TTH, HTT, TTT, THT}<br />
Where s is sample space and here n(S) = 8<br />
Let A be the event of getting 3 heads n(A) = 1<br />
P(getting 3 heads) = P(A) =&nbsp;<span class="math-tex">{tex}\\frac{\\mathrm{n}(\\mathrm{A})}{\\mathrm{n}(\\mathrm{S})}=\\frac{1}{\\mathrm{8}}{/tex}</span></p></div></div></div>
`;

export const MISC_HTML = `
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(1)</span></div><div class="question-text"><p>A box contains 10 red marbles, 20 blue marbles and 30 green marbles. 5 marbles are drawn from the box, what is the probability that all will be blue?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Total marbles = 10 + 20 + 30 = 60<br />
We have to draw 5 marbles out of 60 marbles and this can be done in <span class="math-tex">{tex}^{60}{C_5}{/tex}</span> ways.<br />
There are 20 blue marbles.<br />
We have to draw 5 marbles out of 20 blue marbles and that can be done&nbsp;in <span class="math-tex">{tex}^{20}{C_5}{/tex}</span> ways.<br />
Thus the probability that all drawn marbles will be blue <span class="math-tex">{tex}= \\frac{{^{20}{C_5}}}{{^{60}{C_5}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 1(2)</span></div><div class="question-text"><p>A box contains 10 red marbles, 20 blue marbles and 30 green marbles. 5 marbles are drawn from the box, what is the probability that&nbsp;at least one will be green?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Total marbles in box&nbsp;= 10 + 20 + 30 = 60<br />
We have to draw 5 marbles out of 60 marbles and this can be done in <span class="math-tex">{tex}^{60}{C_5}{/tex}</span> ways.<br />
There are 10 red marbles and 20 blue marbles.<br />
We have to draw 5 marbles out of these 30 marbles ( for now green marbles are excluded), then none of the drawn&nbsp;marbles will be green and that can be done in <span class="math-tex">{tex}^{30}{C_5}{/tex}</span> ways.<br />
Thus the probability that at least one drawn marbles will be green= 1- P(no green marble out of 5)&nbsp;<span class="math-tex">{tex} = 1 - \\frac{{^{30}{C_5}}}{{^{60}{C_5}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 2</span></div><div class="question-text"><p>4 cards are drawn from a well shuffled deck of 52 cards. What is the probability of obtaining 3 diamonds and one spade?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>From a pack of 52 cards, 4 cards can be drawn in <span class="math-tex">{tex}^{52}{C_4}{/tex}</span> ways.<br />
There are 13 cards of diamond and 18 cards of spades<br />
Now 3 cards of diamond out of 18 cards of diamond can be drawn in <span class="math-tex">{tex}^{13}{C_3}{/tex}</span> ways and 1 card of spade out of 13 cards of spade can be drawn in <span class="math-tex">{tex}^{13}{C_1}{/tex}</span> ways.<br />
Thus the probability of obtaining 3 diamond and 1 spade card<br />
<span class="math-tex">{tex}= \\frac{{^{13}{C_3}{ \\times ^{13}}{C_1}}}{{^{52}{C_4}}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(1)</span></div><div class="question-text"><p>A die has two faces each with number 1, three faces each with number 2 and one face with number 3. If die is rolled once, determine&nbsp;P(2)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Total number of faces in a die = 6<br />
Number of faces with number 2 = 3<br />
<span class="math-tex">{tex}\\therefore \\;P(2) = \\frac{3}{6}=\\frac12{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(2)</span></div><div class="question-text"><p>A die has two faces each with number 1, three faces each with number 2 and one face with number 3. If die is rolled once, determine&nbsp;P(1 or 3)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Total number of faces in a die = 6<br />
Number of faces with number 1 = 2<br />
Number of faces with number 3 = 1<br />
<span class="math-tex">{tex}\\therefore \\;P(1) = \\frac{2}{6} = \\frac{1}{3},\\;P(3) = \\frac{1}{6}{/tex}</span><br />
P (1 or 3) = P(1) + P(3) <span class="math-tex">{tex}= \\frac{1}{3} + \\frac{1}{6} = \\frac{{2 + 1}}{6} = \\frac{3}{6} = \\frac{1}{2}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 3(3)</span></div><div class="question-text"><p>A die has two faces each with number 1, three faces each with number 2 and one face with number 3. If die is rolled once, determine&nbsp;P(not 3)</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Total number of faces in a die = 6<br />
Number of faces with number 3 = 1<br />
<span class="math-tex">{tex}\\therefore\\;P(3) = \\frac{1}{6}{/tex}</span><br />
P (not 3) = 1 - P(3) <span class="math-tex">{tex} = 1 - \\frac{1}{6} = \\frac{5}{6}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(1)</span></div><div class="question-text"><p>In a certain lottery 10,000 tickets are sold and, ten equal prizes are awarded. What is the probability of not getting a prize if you buy one ticket?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given, total number of tickets = total number of outcomes = 10,000<br />
Also given, number of prize bearing tickets = 10<br />
So number of tickets not bearing prize = 10,000-10 = 9990<br />
Let A represent the event that one bought ticket is not bearing&nbsp;prize.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> <span class="math-tex">{tex}P(A)=\\frac{9990}{10000} =\\frac{999}{1000}{/tex}</span><br />
Hence, probability of not getting a prize if one ticket is bought <span class="math-tex">{tex}=\\frac{999}{1000}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(2)</span></div><div class="question-text"><p>In a certain lottery 10,000 tickets are sold and, ten equal prizes are awarded. What is the probability of not getting a prize if you buy two tickets?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given, total number of tickets&nbsp;= 10,000<br />
Number of prize bearing tickets = 10<br />
So number of tickets not bearing prize = 10,000-10 = 9990<br />
Let B be the event that two bought tickets are not prize bearing tickets.<br />
Now, out of 10,000 tickets one can buy 2 ticket in <span class="math-tex">{tex}{}^{10000}C_2{/tex}</span> ways i.e. total number of outcomes,<br />
and out of 9990 tickets not bearing any prize, one can buy 2 tickets in <span class="math-tex">{tex}{}^{9990}C_2{/tex}</span>ways i.e. total number of favourable outcomes.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span><span class="math-tex">{tex}P(B)=\\frac{Number of favourable outcomes}{Total number of outcomes}=\\frac{{}^{9990}C_2}{{}^{10000}C_2}{/tex}</span><br />
Hence, probability of not getting a prize if two tickets are bought <span class="math-tex">{tex}=\\frac{{}^{9990}C_2}{{}^{10000}C_2}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 4(3)</span></div><div class="question-text"><p>In a certain lottery 10,000 tickets are sold and, ten equal prizes are awarded. What is the probability of not getting a prize if you buy 10 tickets?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have to find the&nbsp;probability of not getting a prize if you buy 10 tickets<br />
Given, the total number of tickets = 10,000<br />
So out of 10,000 tickets, one can buy 1 ticket in <span class="math-tex">{tex}{}^{10000}C_1=10,000\\;ways{/tex}</span><br />
Given, number of prize bearing tickets = 10<br />
So number of tickets not bearing prize = 10,000 - 10 = 9990<br />
Let C be the event that ten bought tickets are not prize bearing tickets.<br />
Now, out of 10,000 tickets, one can buy 2 tickets in <span class="math-tex">{tex}{}^{10000}C_{10}{/tex}</span> ways<br />
and out of 9990 tickets not bearing any prize, one can buy 10 tickets in&nbsp;&nbsp;<span class="math-tex">{tex}{}^{9990}C_{10}{/tex}</span>&nbsp;ways.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;<span class="math-tex">{tex}P(C)=\\frac{{}^{9990}C_{10}}{{}^{10000}C_{10}}{/tex}</span><br />
Hence, the probability of not getting a prize if ten tickets are bought <span class="math-tex">{tex}=\\frac{{}^{9990}C_{10}}{{}^{10000}C_{10}}{/tex}</span>.</p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 5</span></div><div class="question-text"><p>Out of 100 students, two sections of 40 and 60 are formed. If you and your friend are among the 100 students, what is the probability that,</p>

<ol start="1" style="list-style-type: lower-roman;">
	<li>you both enter the same section?</li>
	<li>you both enter the different sections?</li>
</ol></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given, total number of students = 100.<br />
Out of these students two students can be chosen in&nbsp;&nbsp;<span class="math-tex">{tex}{{}^{100}C_2}{/tex}</span>&nbsp;ways.</p>

<ol start="1" style="list-style-type: lower-roman;">
	<li>If both of us belong to the same section<br />
	i.e., either both of us belong to the section of 40 students or to the section of 60 students.<br />
	<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp;Number of total favourable outcomes in which both of us (i.e., 2 students)<br />
	belong to either section of 40 students or section of 60 students =&nbsp;<span class="math-tex">{tex}{{}^{40}C_2} + \\style{}{{}^{60}C_2}{/tex}</span>.<br />
	<span class="math-tex">{tex}\\therefore{/tex}</span>&nbsp; Probability (both of us belong to same section)<br />
	=&nbsp;<span class="math-tex">{tex}{\\frac{{}^{40}C_2+{}^{60}C_2}{{}^{100}C_2}=\\frac{{\\frac{40!}{2!\\;.(40-2)!}}+{\\frac{60!}{2!\\;.\\;(60-2)!}}}{\\frac{100!}{2!\\;.(100-2)!}}}{/tex}</span><br />
	<span class="math-tex">{tex}{=\\frac{40\\times39+60\\times59}2\\times\\frac2{100\\times99}}{/tex}</span><span class="math-tex">{tex}{=\\frac{4\\times39+6\\times59}{10\\times99}=\\frac{17}{33}}{/tex}</span></li>
	<li>P (both students are in different sections)<br />
	<span class="math-tex">{tex}= 1 - \\frac{{17}}{{33}} = \\frac{{16}}{{33}}{/tex}</span></li>
</ol></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 6</span></div><div class="question-text"><p>Three letters are dictated to three persons and an envelope is addressed to each of them, the letters are inserted into the envelopes at random so that each envelope contains exactly one letter. Find the probability that at least one letter is in its proper envelope.</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Given that each envelope contains exactly one letter.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Number of ways in which three letters can be inserted randomly into three envelopes = 3<strong>!</strong> = 6<br />
Out of three letters insertion of one letter into proper envelope can be done in <span class="math-tex">{tex}\\style{font-size:28px}{{}^3C_1=3}{/tex}</span> ways, and insertion of other two letters into wrong envelope can be done in one way.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Number of ways in which one letter can be inserted into proper envelope and other two in wrong envelopes =<span class="math-tex">{tex}\\style{font-size:28px}{{}^3C_1\\times1=3}{/tex}</span><br />
Also, number of ways in which two letters can be inserted into proper envelopes = 1<br />
Number of ways in which atleast one letter is in proper envelope = 3 + 1 = 4<br />
Thus the required probability that atleast one letter is in its proper envelope = <span class="math-tex">{tex}\\style{font-size:24px}{\\frac46=\\frac23}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 7</span></div><div class="question-text"><p>A and B are two events such that P(A) = 0.54, P(B) = 0.69 and <span class="math-tex">{tex}P(A \\cap B) = 0.35{/tex}</span>. Find</p>

<ol start="1" style="list-style-type: lower-roman;">
	<li><span class="math-tex">{tex}P(A \\cup B){/tex}</span></li>
	<li><span class="math-tex">{tex}P(A'\\cap B'){/tex}</span></li>
	<li><span class="math-tex">{tex}P(A\\cap B'){/tex}</span></li>
	<li><span class="math-tex">{tex}P( B\\cap A'){/tex}</span></li>
</ol></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here P(A) = 0.54, P(B) = 0.69 and&nbsp;<span class="math-tex">{tex}\\style{font-size:36px}{\\mathrm P(\\mathrm A\\cap\\mathrm B)}{/tex}</span>&nbsp;= 0.35</p>

<ol start="1" style="list-style-type: lower-roman;">
	<li>We know that<br />
	<span class="math-tex">{tex}P ( A \\cup B ) = P ( A ) + P ( B ) - P ( A \\cap B ){/tex}</span><br />
	= 0.54+ 0.69 - 0.35<br />
	= 1.23 - 0.35 = 0.88</li>
	<li><span class="math-tex">{tex}\\style{font-size:36px}{\\mathrm P(\\mathrm A'\\cap\\mathrm B')=\\mathrm P(\\mathrm A\\cup\\mathrm B)'=1-\\mathrm P(\\mathrm A\\cup\\mathrm B)}{/tex}</span>&nbsp;&nbsp;<br />
	= 1 - 0.88 = 0.12</li>
	<li><span class="math-tex">{tex}\\style{font-size:36px}{\\mathrm P(\\mathrm A\\cap\\mathrm B')=\\mathrm P(\\mathrm A)-\\mathrm P(\\mathrm A\\cap\\mathrm B)}{/tex}</span><br />
	= 0.54 - 0.35 = 0.19</li>
	<li><span class="math-tex">{tex}P(B\\cap A') = P(B)- P(A\\cap B){/tex}</span><br />
	= 0.69 - 0.35 = 0.34</li>
</ol></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 8</span></div><div class="question-text"><p>From the employees of a company, 5 persons are selected to represent&nbsp;them in the managing committee of the company. Particulars of five persons are as follows:</p>

<table border="1" cellpadding="3" cellspacing="0" style="width: 100%;">
	<tbody>
		<tr>
			<td style="text-align: center;">S.No.</td>
			<td style="text-align: center;">Name</td>
			<td style="text-align: center;">Sex</td>
			<td style="text-align: center;">Age in years</td>
		</tr>
		<tr>
			<td style="text-align: center;">1</td>
			<td style="text-align: center;">Harish</td>
			<td style="text-align: center;">M</td>
			<td style="text-align: center;">30</td>
		</tr>
		<tr>
			<td style="text-align: center;">2</td>
			<td style="text-align: center;">Rohan</td>
			<td style="text-align: center;">M</td>
			<td style="text-align: center;">33</td>
		</tr>
		<tr>
			<td style="text-align: center;">3</td>
			<td style="text-align: center;">Sheetal</td>
			<td style="text-align: center;">F</td>
			<td style="text-align: center;">46</td>
		</tr>
		<tr>
			<td style="text-align: center;">4</td>
			<td style="text-align: center;">Alis</td>
			<td style="text-align: center;">F</td>
			<td style="text-align: center;">28</td>
		</tr>
		<tr>
			<td style="text-align: center;">5</td>
			<td style="text-align: center;">Salim</td>
			<td style="text-align: center;">M</td>
			<td style="text-align: center;">41</td>
		</tr>
	</tbody>
</table>

<p>A person is selected at random from this group to act as a spokesperson. What is the probability that the spokesperson will be either male or over 35 years?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>Here total number of persons = 5<br />
One spokesperson is selected out of 5 persons in = 5 ways.<br />
Let A be the event that the selected person is male<br />
and B be the event that the selected person is over 35 years.<br />
There are 3 male and one person can be selected in 3 ways.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> <span class="math-tex">{tex}P(A)={\\tfrac35}{/tex}</span><br />
There are 2 persons who are over 35 years.<br />
So, out of themone person can be selected in 2 ways.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> <span class="math-tex">{tex}P(B)={\\frac25}{/tex}</span><br />
Since there is 1 male who isover 35 years.<br />
so, <span class="math-tex">{tex}P(A\\cap B)={\\frac15}{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> P (that the spokesperson is either male or over 35 years)<br />
= <span class="math-tex">{tex}P(A\\cup B){/tex}</span><br />
<span class="math-tex">{tex}= P(A)+P(B)-P(A\\cap B){/tex}</span><br />
<span class="math-tex">{tex}= \\frac{3}{5} + \\frac{2}{5} - \\frac{1}{5} = \\frac{{3 + 2 - 1}}{5}{/tex}</span><br />
<span class="math-tex">{tex}= \\frac{4}{5}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9(1)</span></div><div class="question-text"><p>If 4-digit numbers greater than 5000 are randomly formed from the digits 0, 1, 3, 5, and 7, what is the probability of forming a number divisible by 5 when&nbsp;the digits are repeated?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have to find the probability of forming a number divisible by 5 when&nbsp;the digits are repeated<br />
When digits are repeated:<br />
In a 4-digit number greater than 5000, the thousandth place can be filled up by either 5 or 7.<br />
So the thousandth place can be filled in 2 ways.<br />
Since the digits can be repeated, so the remaining three places can be filled in 5<sup>3 </sup>= 125 ways.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Total number of 4 digit numbers greater than 5000 = 2 <span class="math-tex">{tex}\\times{/tex}</span> 125 - 1 = 250 - 1 = 249.<br />
A number is divisible by 5 if the digit at the unit place is either 0 or 5<br />
For a 4-digit number greater than 5000 and divisible by 5 the unit and thousandth place are fixed in {2 <span class="math-tex">{tex}\\times{/tex}</span> 2 = 4} ways.<br />
The hundredth and tenth place can be filled in 5<sup>2</sup> = 25 ways.<br />
Since the numbers are greater than 5000, so the number of 4-digit numbers divisible by 5 <span class="math-tex">{tex}= 2\\times5\\times5\\times2-1=100-1=99{/tex}</span><br />
<span class="math-tex">{tex}\\therefore{/tex}</span> The required probability of forming a 4-digit number greater than 5000<br />
and divisible by 5 when digits can be repeated = <span class="math-tex">{tex}{\\frac{99}{249}=\\frac{33}{83}}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 9(2)</span></div><div class="question-text"><p>If 4-digit numbers greater than 5000 are randomly formed from the digits 0, 1, 3, 5, and 7. What is the probability of forming a number divisible by 5 when&nbsp;the repetition of digits is not allowed?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>We have to find the probability of forming a number divisible by 5 when&nbsp;the repetition of digits is not allowed<br />
When digits are not repeated:<strong>&nbsp;</strong>In a 4-digit number greater than 5000, the thousandth place can be filled up by either 5 or 7.<br />
If the thousandth place is filled by 5 then the other three places can be filled in = {4 <span class="math-tex">{tex}\\times{/tex}</span> 3 <span class="math-tex">{tex}\\times{/tex}</span> 2 = 24} ways.<br />
Similarly when the thousandth place is filled by 7 then the other three places can be filled in = 4 <span class="math-tex">{tex}\\times{/tex}</span> 3 <span class="math-tex">{tex}\\times{/tex}</span> 2 = 24 ways.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Without repeating digits, total number of 4-digit numbers greater than 5000 can be formed = 24 + 24 = 48.<br />
Now to find the number of 4-digit numbers greater than 5000 and divisible by 5 (without repetition ).<br />
A number greater than 5000 and divisible by 5 when the unit place is either 0 or 5 and the thousandth place is either 5 or 7.<br />
<strong>case-I:</strong>&nbsp;When thousandth place is filled by 5, then the unit place will be filled by 0 (zero)<br />
and a number of such numbers = 3 <span class="math-tex">{tex}\\times{/tex}</span> 2 = 6.<br />
<strong>case-II:</strong>&nbsp;When thousandth place is filled by 7, then unit place will be filled by either 0 (zero) or 5<br />
and number of such numbers = 2(3 <span class="math-tex">{tex}\\times{/tex}</span> 2) = 12.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Without repetition, the total number of 4-digit numbers greater than 5000<br />
and divisible by 5 = 6 + 12 = 18. [by case-I and case-II]<br />
Hence, the required probability <span class="math-tex">{tex}={\\frac{18}{48}=\\frac38}{/tex}</span></p></div></div></div>
<div class="question-card"><div class="question-header"><span class="q-number">Q 10</span></div><div class="question-text"><p>The number lock of a suitcase has 4 wheels, each labelled with ten digits i.e. from 0 to 9. The lock opens with a sequence of four digits with no repeats. What is the probability of a person getting the right sequence to open the suitcase?</p></div><div class="answer-section"><div class="solution-block"><div class="label">Solution</div><p>There are total 10 digits from 0 to 9.<br />
Since the digits cannot be repeated.<br />
So the first place may be filled in 10 ways, second place in 9 ways, third place in 8 ways and fourth place in 7 ways.<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Number of possible outcomes <span class="math-tex">{tex} = 10 \\times 9 \\times 8 \\times 7 = 5040{/tex}</span><br />
The lock of suitcase can be opened in 1 way only<br />
<span class="math-tex">{tex}\\therefore{/tex}</span> Number of favourable cases = 1<br />
Thus required probability <span class="math-tex">{tex} = \\frac{1}{{5040}}.{/tex}</span></p></div></div></div>
`;

export default { EXAMPLES_HTML, EX14_1_HTML, EX14_2_HTML, MISC_HTML };