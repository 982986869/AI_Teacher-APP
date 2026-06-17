// oscillationsContent.js
// NCERT Solutions Part-II — Class 11 Physics
// Chapter 6: Oscillations
//
// Two named exports consumed by ncert2Solutions.js:
//   EXAMPLES_HTML     -> "Examples" section    (8 worked examples)
//   CHAPTER_END_HTML  -> "Chapter-end" section (18 exercise solutions)
//
// Content is raw HTML rendered inside a MathJax WebView (see Ncert2Screen).
// Inline math uses \( ... \) delimiters (MathJax default).
// Figure-dependent parts state the result that follows from the textbook figure.

const STYLE = `
<style>
  .ncert { color:#1C1C1E; font-size:15px; line-height:1.55; }
  .ncert .q-block { padding:14px 0; border-bottom:1px solid #E8E8E8; }
  .ncert .q-block:last-child { border-bottom:0; }
  .ncert .q-num { font-weight:800; }
  .ncert .q { font-weight:600; margin:0 0 8px; }
  .ncert .sol-h { font-weight:800; margin:8px 0 4px; }
  .ncert .sol p { margin:4px 0; color:#333; }
  .ncert .res { font-weight:700; }
</style>`;

export const EXAMPLES_HTML = `
${STYLE}
<div class="ncert">

  <div class="q-block">
    <p class="q"><span class="q-num">Q1.</span> On an average a human heart beats 75 times in a minute. Calculate its frequency and period.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Beat frequency \\(= \\dfrac{75}{60\\,\\text{s}} = \\) <span class="res">1.25 Hz</span>.</p>
      <p>Time period \\(T = \\dfrac{1}{1.25} = \\) <span class="res">0.8 s</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q2.</span> Which of the following represent periodic and non-periodic motion? Give the period of each periodic case (ω is a positive constant): (a) \\(\\sin\\omega t + \\cos\\omega t\\), (b) \\(\\sin\\omega t + \\cos 2\\omega t + \\sin 4\\omega t\\), (c) \\(e^{-\\omega t}\\), (d) \\(\\log(\\omega t)\\).</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) Periodic: \\(\\sin\\omega t + \\cos\\omega t = \\sqrt{2}\\sin(\\omega t + \\tfrac{\\pi}{4})\\), period \\(\\dfrac{2\\pi}{\\omega}\\).</p>
      <p>(b) Periodic. The terms have periods \\(T_0 = \\tfrac{2\\pi}{\\omega}\\), \\(\\tfrac{T_0}{2}\\) and \\(\\tfrac{T_0}{4}\\); the smallest interval after which the sum repeats is \\(T_0 = \\dfrac{2\\pi}{\\omega}\\).</p>
      <p>(c) \\(e^{-\\omega t}\\) is <span class="res">non-periodic</span> — it decreases monotonically to zero as \\(t \\to \\infty\\).</p>
      <p>(d) \\(\\log(\\omega t)\\) is <span class="res">non-periodic</span> — it increases monotonically and diverges as \\(t \\to \\infty\\).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q3.</span> Which represent SHM, and which are periodic but not SHM? Give the period: (a) \\(\\sin\\omega t - \\cos\\omega t\\), (b) \\(\\sin^2\\omega t\\).</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) \\(\\sin\\omega t - \\cos\\omega t = \\sqrt{2}\\sin(\\omega t - \\tfrac{\\pi}{4})\\) — <span class="res">SHM</span> with period \\(\\dfrac{2\\pi}{\\omega}\\) and phase \\(-\\tfrac{\\pi}{4}\\).</p>
      <p>(b) \\(\\sin^2\\omega t = \\tfrac{1}{2} - \\tfrac{1}{2}\\cos 2\\omega t\\) — periodic with period \\(\\dfrac{\\pi}{\\omega}\\); it represents harmonic motion about the mean value \\(\\tfrac{1}{2}\\) rather than zero.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q4.</span> Two circular motions are shown (radius, period, initial position and sense of revolution given). Obtain the SHM of the x-projection of the radius vector OP in each case.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p><b>Case 1</b> (anticlockwise, OP at \\(45° = \\tfrac{\\pi}{4}\\) at \\(t=0\\), \\(T = 4\\,\\text{s}\\)): \\(x(t) = A\\cos\\!\\left(\\dfrac{2\\pi}{T}t + \\tfrac{\\pi}{4}\\right) = A\\cos\\!\\left(\\dfrac{\\pi}{2}t + \\tfrac{\\pi}{4}\\right)\\) — SHM of amplitude A, period 4 s, initial phase \\(\\tfrac{\\pi}{4}\\).</p>
      <p><b>Case 2</b> (clockwise, OP at \\(90° = \\tfrac{\\pi}{2}\\) at \\(t=0\\), \\(T = 30\\,\\text{s}\\)): \\(x(t) = B\\cos\\!\\left(\\tfrac{\\pi}{2} - \\dfrac{2\\pi}{T}t\\right) = B\\sin\\!\\left(\\dfrac{\\pi}{15}t\\right) = B\\cos\\!\\left(\\dfrac{\\pi}{15}t - \\tfrac{\\pi}{2}\\right)\\) — SHM of amplitude B, period 30 s, initial phase \\(-\\tfrac{\\pi}{2}\\).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q5.</span> A body oscillates with SHM as \\(x = 5\\cos(2\\pi t + \\tfrac{\\pi}{4})\\) (SI units). At \\(t = 1.5\\,\\text{s}\\), find the displacement, speed and acceleration.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Displacement: \\(x = 5\\cos(3\\pi + \\tfrac{\\pi}{4}) = -5\\cos\\tfrac{\\pi}{4} = \\) <span class="res">−3.535 m</span>.</p>
      <p>Speed: \\(v = -10\\pi\\sin(2\\pi t + \\tfrac{\\pi}{4})\\); at \\(t=1.5\\): \\(|v| = 10\\pi(0.707) = \\) <span class="res">22.22 m s⁻¹</span>.</p>
      <p>Acceleration: \\(a = -20\\pi^2\\cos(2\\pi t + \\tfrac{\\pi}{4})\\); at \\(t=1.5\\): \\(|a| = \\) <span class="res">139.56 m s⁻²</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q6.</span> Two identical springs of spring constant k are attached to a block of mass m and to fixed supports on either side. Show that the block executes SHM and find the period.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>When displaced by x, each spring exerts a restoring force \\(-kx\\), so the net force is \\(F = -kx - kx = -2kx\\).</p>
      <p>Force is proportional to displacement and directed toward the mean position, so the motion is SHM with effective constant \\(k' = 2k\\).</p>
      <p>\\(T = 2\\pi\\sqrt{\\dfrac{m}{k'}} = \\) <span class="res">\\(2\\pi\\sqrt{\\dfrac{m}{2k}}\\)</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q7.</span> A 1 kg block on a frictionless surface is fastened to a spring of constant 50 N m⁻¹ and pulled 10 cm from equilibrium, then released at \\(t=0\\). Find the kinetic, potential and total energies when it is 5 cm from the mean position.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Here \\(A = 0.1\\,\\text{m}\\), \\(x = 0.05\\,\\text{m}\\), \\(k = 50\\,\\text{N m}^{-1}\\).</p>
      <p>KE \\(= \\tfrac{1}{2}k(A^2 - x^2) = \\tfrac{1}{2}(50)(0.1^2 - 0.05^2) = \\) <span class="res">0.1875 J</span>.</p>
      <p>PE \\(= \\tfrac{1}{2}kx^2 = \\tfrac{1}{2}(50)(0.05)^2 = \\) <span class="res">0.0625 J</span>.</p>
      <p>Total \\(E = \\) <span class="res">0.25 J</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q8.</span> What is the length of a simple pendulum that "ticks seconds" (period 2 s)?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>\\(T = 2\\pi\\sqrt{\\dfrac{L}{g}}\\) with \\(T = 2\\,\\text{s}\\), \\(g = 9.8\\,\\text{m s}^{-2}\\).</p>
      <p>\\(L = \\dfrac{gT^2}{4\\pi^2} = \\dfrac{9.8}{\\pi^2} = 0.992\\,\\text{m} \\approx \\) <span class="res">1.0 m</span>.</p>
    </div>
  </div>

</div>
`;

export const CHAPTER_END_HTML = `
${STYLE}
<div class="ncert">

  <div class="q-block">
    <p class="q"><span class="q-num">Q1.</span> Which of the following represent periodic motion? (a) A swimmer completing one return trip across a river. (b) A freely suspended bar magnet displaced from N–S and released. (c) A hydrogen molecule rotating about its centre of mass. (d) An arrow released from a bow.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) <span class="res">Not periodic</span> — to and fro, but with no definite period. (b) <span class="res">Periodic</span> — it oscillates about the N–S position. (c) <span class="res">Periodic</span> — the rotation repeats. (d) <span class="res">Non-periodic</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q2.</span> Which represent (nearly) SHM and which are periodic but not SHM? (a) Rotation of the earth about its axis. (b) Oscillating mercury column in a U-tube. (c) A ball bearing inside a smooth curved bowl released slightly above the lowest point. (d) General vibrations of a polyatomic molecule.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) <span class="res">Periodic but not SHM</span> (not to and fro about a fixed point). (b) <span class="res">SHM</span>. (c) <span class="res">SHM</span>. (d) <span class="res">Periodic but not SHM</span> — a superposition of the individual SHMs of the atoms.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q3.</span> Four x–t plots are given for linear motion of a particle. Which represent periodic motion, and what is the period?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) <span class="res">Non-periodic</span> — unidirectional, non-uniform motion. (b) <span class="res">Periodic, T = 2 s</span>. (c) <span class="res">Non-periodic</span> — only a single position (x = 0) repeats, not the whole motion. (d) <span class="res">Periodic, T = 2 s</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q4.</span> Classify as (a) SHM, (b) periodic but not SHM, or (c) non-periodic; give the period where periodic (ω positive): (i) \\(\\sin\\omega t - \\cos\\omega t\\), (ii) \\(\\sin^3\\omega t\\), (iii) \\(3\\cos(\\tfrac{\\pi}{4} - 2\\omega t)\\), (iv) \\(\\cos\\omega t + \\cos 3\\omega t + \\cos 5\\omega t\\), (v) \\(e^{-\\omega^2 t^2}\\), (vi) \\(1 + \\omega t + \\omega^2 t^2\\).</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(i) \\(= \\sqrt{2}\\sin(\\omega t - \\tfrac{\\pi}{4})\\) — <span class="res">SHM</span>, period \\(\\dfrac{2\\pi}{\\omega}\\).</p>
      <p>(ii) \\(\\sin^3\\omega t = \\tfrac{1}{4}(3\\sin\\omega t - \\sin 3\\omega t)\\) — <span class="res">periodic, not SHM</span>, period \\(\\dfrac{2\\pi}{\\omega}\\).</p>
      <p>(iii) \\(= 3\\cos(2\\omega t - \\tfrac{\\pi}{4})\\) — <span class="res">SHM</span>, period \\(\\dfrac{\\pi}{\\omega}\\).</p>
      <p>(iv) <span class="res">Periodic, not SHM</span>, period \\(\\dfrac{2\\pi}{\\omega}\\).</p>
      <p>(v) <span class="res">Non-periodic</span> (exponential, never repeats).</p>
      <p>(vi) <span class="res">Non-periodic</span> (grows without bound).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q5.</span> A particle is in linear SHM between points A and B, 10 cm apart, with A→B taken as positive (O = mid-point). Give the signs of velocity, acceleration and force when the particle is: (a) at A, (b) at B, (c) at O going toward A, (d) 2 cm from B going toward A, (e) 3 cm from A going toward B, (f) 4 cm from B going toward A.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Acceleration and force always point toward O (\\(a = -\\omega^2 x\\)).</p>
      <p>(a) At A: \\(v = 0\\); a, F <span class="res">positive</span> (toward O).</p>
      <p>(b) At B: \\(v = 0\\); a, F <span class="res">negative</span>.</p>
      <p>(c) At O toward A: \\(v\\) <span class="res">negative</span> (maximum); \\(a = F = 0\\).</p>
      <p>(d) 2 cm from B (\\(x = +3\\)) toward A: \\(v\\) negative; a, F <span class="res">negative</span>.</p>
      <p>(e) 3 cm from A (\\(x = -2\\)) toward B: \\(v\\) positive; a, F <span class="res">positive</span>.</p>
      <p>(f) 4 cm from B (\\(x = +1\\)) toward A: \\(v\\) negative; a, F <span class="res">negative</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q6.</span> Which relationship between acceleration a and displacement x represents SHM? (1) \\(a = 0.7x\\), (2) \\(a = -200x^2\\), (3) \\(a = -10x\\), (4) \\(a = 100x^3\\).</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>SHM requires acceleration proportional to and opposite the displacement, \\(a = -\\omega^2 x\\). Only <span class="res">\\(a = -10x\\)</span> satisfies this.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q7.</span> An SHM is \\(x(t) = A\\cos(\\omega t + \\phi)\\). At \\(t=0\\): \\(x = 1\\,\\text{cm}\\), \\(v = \\omega\\,\\text{cm s}^{-1}\\), with \\(\\omega = \\pi\\,\\text{s}^{-1}\\). Find A and φ. If instead \\(x = B\\sin(\\omega t + \\alpha)\\), find B and α.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>From \\(x(0)=1\\): \\(A\\cos\\phi = 1\\). From \\(v = -A\\omega\\sin(\\omega t+\\phi)\\) and \\(v(0)=\\omega\\): \\(A\\sin\\phi = -1\\).</p>
      <p>Squaring and adding: \\(A^2 = 2 \\Rightarrow A = \\sqrt{2}\\,\\text{cm}\\). Dividing: \\(\\tan\\phi = -1 \\Rightarrow \\phi = \\tfrac{3\\pi}{4}\\) or \\(\\tfrac{7\\pi}{4}\\).</p>
      <p>For the sine form: \\(B\\sin\\alpha = 1\\) and \\(B\\cos\\alpha = 1\\), giving \\(B = \\sqrt{2}\\,\\text{cm}\\) and \\(\\tan\\alpha = 1 \\Rightarrow \\alpha = \\tfrac{\\pi}{4}\\) or \\(\\tfrac{5\\pi}{4}\\).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q8.</span> A spring balance reads 0–50 kg over a scale length of 20 cm. A body suspended from it oscillates with period 0.6 s. What is the weight of the body?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Maximum force \\(= Mg = 50 \\times 9.8 = 490\\,\\text{N}\\); spring constant \\(k = \\dfrac{F}{l} = \\dfrac{490}{0.2} = 2450\\,\\text{N m}^{-1}\\).</p>
      <p>\\(T = 2\\pi\\sqrt{\\dfrac{m}{k}} \\Rightarrow m = \\left(\\dfrac{T}{2\\pi}\\right)^2 k = \\left(\\dfrac{0.6}{6.28}\\right)^2 (2450) = 22.36\\,\\text{kg}\\).</p>
      <p>Weight \\(= mg = 22.36 \\times 9.8 \\approx \\) <span class="res">219 N</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q9.</span> A spring of constant 1200 N m⁻¹ on a horizontal table carries a 3 kg mass pulled 2.0 cm aside and released. Find (a) the frequency, (b) the maximum acceleration, and (c) the maximum speed.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) \\(\\nu = \\dfrac{1}{2\\pi}\\sqrt{\\dfrac{k}{m}} = \\dfrac{1}{2\\pi}\\sqrt{\\dfrac{1200}{3}} = \\) <span class="res">3.18 Hz</span>.</p>
      <p>(b) \\(a_{max} = \\omega^2 A = \\dfrac{k}{m}A = \\dfrac{1200}{3}(0.02) = \\) <span class="res">8 m s⁻²</span>.</p>
      <p>(c) \\(v_{max} = A\\omega = 0.02 \\times 20 = \\) <span class="res">0.4 m s⁻¹</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q10.</span> For the same spring–mass system (\\(\\omega = 20\\,\\text{rad s}^{-1}\\)), give \\(x(t)\\) if at \\(t=0\\) the mass is (a) at the mean position, (b) at the maximum stretched position, (c) at the maximum compressed position. How do these differ?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) \\(x = 2\\sin 20t\\) cm.</p>
      <p>(b) \\(x = 2\\sin(20t + \\tfrac{\\pi}{2}) = 2\\cos 20t\\) cm.</p>
      <p>(c) \\(x = 2\\sin(20t + \\tfrac{3\\pi}{2}) = -2\\cos 20t\\) cm.</p>
      <p>All three have the <span class="res">same frequency and amplitude</span> but different <span class="res">initial phases</span> \\((0, \\tfrac{\\pi}{2}, \\tfrac{3\\pi}{2})\\).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q11.</span> Two circular motions are shown (radius, period, initial position and sense given). Obtain the SHM of the x-projection of OP in each case.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p><b>Case (a)</b> (\\(T = 2\\,\\text{s}\\), \\(A = 3\\,\\text{cm}\\), \\(\\phi = \\tfrac{\\pi}{2}\\)): \\(x = 3\\cos(\\pi t + \\tfrac{\\pi}{2}) = \\) <span class="res">\\(-3\\sin(\\pi t)\\) cm</span>.</p>
      <p><b>Case (b)</b> (\\(T = 4\\,\\text{s}\\), \\(A = 2\\,\\text{m}\\), \\(\\phi = \\pi\\), anticlockwise): \\(x = 2\\cos(\\tfrac{\\pi}{2}t + \\pi) = \\) <span class="res">\\(-2\\cos(\\tfrac{\\pi}{2}t)\\) m</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q12.</span> Plot the reference circle for each SHM, indicating the initial position, radius and angular speed (x in cm, t in s): (a) \\(x = -2\\sin(3t + \\tfrac{\\pi}{3})\\), (b) \\(x = \\cos(\\tfrac{\\pi}{6} - t)\\), (c) \\(x = 3\\sin(2\\pi t + \\tfrac{\\pi}{4})\\), (d) \\(x = 2\\cos\\pi t\\).</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) \\(= 2\\cos(3t + \\tfrac{\\pi}{3} + \\tfrac{\\pi}{2})\\): r = 2 cm, ω = 3 rad s⁻¹, at \\(t=0\\) \\(x = -\\sqrt{3}\\) cm, \\(\\phi_0 = 150°\\).</p>
      <p>(b) \\(= \\cos(t - \\tfrac{\\pi}{6})\\): r = 1 cm, ω = 1 rad s⁻¹, at \\(t=0\\) \\(x = \\tfrac{\\sqrt{3}}{2}\\) cm, \\(\\phi_0 = -\\tfrac{\\pi}{6}\\).</p>
      <p>(c) \\(= 3\\cos(2\\pi t - \\tfrac{\\pi}{4})\\): r = 3 cm, ω = 2π rad s⁻¹, at \\(t=0\\) \\(x = \\tfrac{3}{\\sqrt{2}}\\) cm, \\(\\phi_0 = -\\tfrac{\\pi}{4}\\).</p>
      <p>(d) r = 2 cm, ω = π rad s⁻¹, at \\(t=0\\) \\(x = 2\\) cm, \\(\\phi_0 = 0\\).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q13.</span> A spring of constant k is (a) clamped at one end with mass m at the free end, stretched by a force F; (b) free at both ends with a mass m at each end, each stretched by F. Find the maximum extension in each case and the period of oscillation when released.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Extension: in (a), \\(x = \\dfrac{F}{k}\\); in (b), each free-body gives \\(kx' = F\\), so \\(x' = \\dfrac{F}{k}\\) — the same.</p>
      <p>Period (a): \\(F = -kx \\Rightarrow a = -\\dfrac{k}{m}x\\), so \\(T = 2\\pi\\sqrt{\\dfrac{m}{k}}\\).</p>
      <p>Period (b): by symmetry the midpoint is fixed, so each half acts with constant \\(2k\\): \\(T = \\) <span class="res">\\(2\\pi\\sqrt{\\dfrac{m}{2k}}\\)</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q14.</span> The piston in a locomotive cylinder has a stroke (twice the amplitude) of 1.0 m and moves in SHM with angular frequency 200 rad min⁻¹. What is its maximum speed?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Amplitude \\(A = \\dfrac{1.0}{2} = 0.5\\,\\text{m}\\).</p>
      <p>\\(v_{max} = A\\omega = 0.5 \\times 200 = \\) <span class="res">100 m min⁻¹</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q15.</span> The acceleration due to gravity on the Moon is 1.7 m s⁻². What is the period of a simple pendulum on the Moon if its period on Earth is 3.5 s? (g on Earth = 9.8 m s⁻².)</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Since \\(T \\propto \\dfrac{1}{\\sqrt{g}}\\), \\(\\dfrac{T_{moon}}{T_{earth}} = \\sqrt{\\dfrac{g_{earth}}{g_{moon}}}\\).</p>
      <p>\\(T_{moon} = 3.5\\sqrt{\\dfrac{9.8}{1.7}} = \\) <span class="res">8.4 s</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q16.</span> A simple pendulum of length l and bob mass M hangs in a car moving on a circular track of radius R at uniform speed v. For small radial oscillations, what is the period?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>The bob experiences gravity g and centripetal acceleration \\(\\dfrac{v^2}{R}\\) (perpendicular), so the effective acceleration is \\(a_{eff} = \\sqrt{g^2 + \\left(\\dfrac{v^2}{R}\\right)^2}\\).</p>
      <p>\\(T = 2\\pi\\sqrt{\\dfrac{l}{a_{eff}}} = \\) <span class="res">\\(2\\pi\\sqrt{\\dfrac{l}{\\sqrt{g^2 + \\dfrac{v^4}{R^2}}}}\\)</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q17.</span> A cylindrical cork of density ρ, base area A and height h floats in a liquid of density \\(\\rho_l\\). It is depressed slightly and released. Show that it oscillates simple-harmonically with period \\(T = 2\\pi\\sqrt{\\dfrac{h\\rho}{\\rho_l g}}\\) (ignore viscosity).</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>When depressed by x, the extra up-thrust is the weight of liquid displaced: \\(F = -A\\rho_l g\\,x\\), so the force constant is \\(k = A\\rho_l g\\).</p>
      <p>Mass of cork \\(m = Ah\\rho\\). Hence \\(T = 2\\pi\\sqrt{\\dfrac{m}{k}} = 2\\pi\\sqrt{\\dfrac{Ah\\rho}{A\\rho_l g}} = \\) <span class="res">\\(2\\pi\\sqrt{\\dfrac{h\\rho}{\\rho_l g}}\\)</span>.</p>
      <p>The force is \\(\\propto -x\\), confirming SHM, and the period is independent of the cork's mass.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q18.</span> One arm of a U-tube of mercury is connected to a suction pump, maintaining a small level difference. Show that, when the pump is removed, the mercury column executes SHM, and find the period.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Let cross-section be A and mercury density ρ. If the level differs by 2h, the restoring force is the weight of the unbalanced column: \\(F = -2A\\rho g\\,h\\), so \\(k = 2A\\rho g\\).</p>
      <p>Mass of mercury \\(m = Al\\rho\\) (l = total column length). Therefore \\(T = 2\\pi\\sqrt{\\dfrac{m}{k}} = 2\\pi\\sqrt{\\dfrac{Al\\rho}{2A\\rho g}} = \\) <span class="res">\\(2\\pi\\sqrt{\\dfrac{l}{2g}}\\)</span>.</p>
      <p>Since \\(F \\propto -h\\), the column performs SHM.</p>
    </div>
  </div>

</div>
`;