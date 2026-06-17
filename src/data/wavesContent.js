// wavesContent.js
// NCERT Solutions Part-II — Class 11 Physics
// Chapter 7: Waves
//
// Two named exports consumed by ncert2Solutions.js:
//   EXAMPLES_HTML     -> "Examples" section    (6 worked examples)
//   CHAPTER_END_HTML  -> "Chapter-end" section (19 exercise solutions)
//
// Content is raw HTML rendered inside a MathJax WebView (see Ncert2Screen).
// Inline math uses \( ... \) delimiters (MathJax default).
// Figure/plot-dependent parts state the result that follows from the figure.

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
    <p class="q"><span class="q-num">Q1.</span> State whether each wave motion is transverse, longitudinal, or a combination: (a) a kink in a long spring produced by displacing one end sideways; (b) waves in a liquid-filled cylinder produced by moving its piston back and forth; (c) waves produced by a motorboat in water; (d) ultrasonic waves in air from a vibrating quartz crystal.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) <span class="res">Transverse and longitudinal</span>. (b) <span class="res">Longitudinal</span>. (c) <span class="res">Transverse and longitudinal</span>. (d) <span class="res">Longitudinal</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q2.</span> A wave is described by \\(y(x,t) = 0.005\\sin(80.0x - 3.0t)\\) (SI units). Find the amplitude, wavelength, period and frequency, and the displacement at \\(x = 30.0\\,\\text{cm}\\), \\(t = 20\\,\\text{s}\\).</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Comparing with \\(y = a\\sin(kx - \\omega t)\\): \\(a = 0.005\\,\\text{m} = 5\\,\\text{mm}\\), \\(k = 80\\,\\text{rad m}^{-1}\\), \\(\\omega = 3\\,\\text{rad s}^{-1}\\).</p>
      <p>\\(\\lambda = \\dfrac{2\\pi}{k} = \\dfrac{2\\pi}{80} = 7.85\\,\\text{cm}\\); \\(T = \\dfrac{2\\pi}{\\omega} = \\dfrac{2\\pi}{3} = 2.09\\,\\text{s}\\); \\(\\nu = \\dfrac{1}{T} = 0.48\\,\\text{Hz}\\).</p>
      <p>\\(y(0.3, 20) = 0.005\\sin(24 - 60) = 0.005\\sin(-36) = \\) <span class="res">−5 mm</span> (≈ −0.00495 m).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q3.</span> A steel wire 0.72 m long has a mass of 5.0 × 10⁻³ kg. Under a tension of 60 N, what is the speed of transverse waves on it?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>\\(\\mu = \\dfrac{5.0 \\times 10^{-3}}{0.72} = 6.9 \\times 10^{-3}\\,\\text{kg m}^{-1}\\).</p>
      <p>\\(v = \\sqrt{\\dfrac{T}{\\mu}} = \\sqrt{\\dfrac{60}{6.9 \\times 10^{-3}}} = \\) <span class="res">93 m s⁻¹</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q4.</span> Estimate the speed of sound in air at STP. The mass of 1 mole of air is 29.0 × 10⁻³ kg.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Density at STP: \\(\\rho_0 = \\dfrac{29.0 \\times 10^{-3}}{22.4 \\times 10^{-3}} = 1.29\\,\\text{kg m}^{-3}\\).</p>
      <p>With Laplace's correction, \\(v = \\sqrt{\\dfrac{\\gamma P}{\\rho_0}} = \\sqrt{\\dfrac{1.4 \\times 1.01 \\times 10^{5}}{1.29}} = \\) <span class="res">331.3 m s⁻¹</span> (\\(\\gamma = 1.4\\)).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q5.</span> A pipe 30.0 cm long, open at both ends, resonates with a 1.1 kHz source at which harmonic? Will resonance occur with the same source if one end is closed? (v = 330 m s⁻¹.)</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Open pipe: \\(\\nu_n = \\dfrac{nv}{2L}\\). Fundamental \\(\\nu_1 = \\dfrac{330}{2(0.30)} = 550\\,\\text{Hz}\\), so 1.1 kHz \\(= 2\\nu_1\\) — the <span class="res">second harmonic</span>.</p>
      <p>Closed at one end: fundamental \\(= \\dfrac{v}{4L} = 275\\,\\text{Hz}\\), and only odd harmonics exist. Since \\(1100 = 4 \\times 275\\) (an even multiple), <span class="res">no resonance</span> occurs.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q6.</span> Two sitar strings A and B playing "Dha" are slightly out of tune and give 5 Hz beats. On slightly increasing the tension of B, the beat frequency drops to 3 Hz. If A = 427 Hz, what was the original frequency of B?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Possible B \\(= 427 \\pm 5 = 432\\) or \\(422\\,\\text{Hz}\\). Increasing tension raises B's frequency; since the beat frequency decreased, B must have been below A.</p>
      <p>So original \\(\\nu_B = 427 - 5 = \\) <span class="res">422 Hz</span>.</p>
    </div>
  </div>

</div>
`;

export const CHAPTER_END_HTML = `
${STYLE}
<div class="ncert">

  <div class="q-block">
    <p class="q"><span class="q-num">Q1.</span> A string of mass 2.50 kg is under a tension of 200 N. Its length is 20.0 m. If a transverse jerk is struck at one end, how long does the disturbance take to reach the other end?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>\\(\\mu = \\dfrac{2.50}{20} = 0.125\\,\\text{kg m}^{-1}\\); \\(v = \\sqrt{\\dfrac{T}{\\mu}} = \\sqrt{\\dfrac{200}{0.125}} = 40\\,\\text{m s}^{-1}\\).</p>
      <p>\\(t = \\dfrac{l}{v} = \\dfrac{20}{40} = \\) <span class="res">0.50 s</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q2.</span> A stone dropped from the top of a 300 m tower splashes into a pond at the base. When is the splash heard at the top? (v = 340 m s⁻¹, g = 9.8 m s⁻².)</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Fall time: \\(300 = \\tfrac{1}{2}(9.8)t_1^2 \\Rightarrow t_1 = \\sqrt{\\dfrac{2(300)}{9.8}} = 7.82\\,\\text{s}\\).</p>
      <p>Sound travel time: \\(t_2 = \\dfrac{300}{340} = 0.88\\,\\text{s}\\).</p>
      <p>Total \\(t = 7.82 + 0.88 = \\) <span class="res">8.7 s</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q3.</span> A steel wire 12.0 m long has a mass of 2.10 kg. What tension makes the transverse-wave speed equal to the speed of sound in dry air at 20 °C (343 m s⁻¹)?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>\\(\\mu = \\dfrac{2.10}{12} = 0.175\\,\\text{kg m}^{-1}\\).</p>
      <p>\\(T = v^2\\mu = (343)^2 \\times 0.175 = \\) <span class="res">2.06 × 10⁴ N</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q4.</span> Use \\(v = \\sqrt{\\dfrac{\\gamma P}{\\rho}}\\) to explain why the speed of sound in air (a) is independent of pressure, (b) increases with temperature, (c) increases with humidity.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) Writing \\(\\rho = \\dfrac{M}{V}\\), \\(v = \\sqrt{\\dfrac{\\gamma PV}{M}}\\). For 1 mole, \\(PV = RT\\), so at constant T, \\(PV\\) is constant and v is <span class="res">independent of pressure</span>.</p>
      <p>(b) Using \\(P = \\dfrac{RT}{V}\\), \\(v = \\sqrt{\\dfrac{\\gamma RT}{M}}\\), so \\(v \\propto \\sqrt{T}\\) — speed <span class="res">increases with temperature</span>.</p>
      <p>(c) \\(v \\propto \\dfrac{1}{\\sqrt{\\rho}}\\). Water vapour makes air less dense (\\(\\rho_{moist} < \\rho_{dry}\\)), so \\(v_{moist} > v_{dry}\\) — speed <span class="res">increases with humidity</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q5.</span> A 1-D travelling wave needs x and t in the combination \\(x \\pm vt\\). Is the converse true? Can these represent travelling waves: (a) \\((x - vt)^2\\), (b) \\(\\log\\!\\left[\\dfrac{x + vt}{x_0}\\right]\\), (c) \\(\\dfrac{1}{x + vt}\\)?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>No — the converse is not true. A wave function must remain <span class="res">finite for all x and t</span>. Each of (a), (b), (c) becomes infinite (or undefined) for some values, so <span class="res">none</span> represents a travelling wave.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q6.</span> A bat emits ultrasound of frequency 1000 kHz in air. When it meets a water surface, what are the wavelengths of the reflected and transmitted sound? (v<sub>air</sub> = 340 m s⁻¹, v<sub>water</sub> = 1486 m s⁻¹.)</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Reflected sound stays in air: \\(\\lambda_r = \\dfrac{340}{10^{6}} = \\) <span class="res">3.4 × 10⁻⁴ m</span>.</p>
      <p>Transmitted sound enters water: \\(\\lambda_t = \\dfrac{1486}{10^{6}} = \\) <span class="res">1.49 × 10⁻³ m</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q7.</span> An ultrasonic scanner operating at 4.2 MHz locates tumours in tissue where the speed of sound is 1.7 km s⁻¹. What is the wavelength of sound in the tissue?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>\\(\\lambda = \\dfrac{v}{\\nu} = \\dfrac{1.7 \\times 10^{3}}{4.2 \\times 10^{6}} = \\) <span class="res">4.1 × 10⁻⁴ m</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q8.</span> A transverse wave is \\(y(x,t) = 3.0\\sin(36t + 0.018x + \\tfrac{\\pi}{4})\\) (x, y in cm; t in s; +x is left→right). Is it travelling or stationary? Give its speed and direction, amplitude, frequency, initial phase at the origin, and the least distance between successive crests.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>The terms \\(\\omega t\\) and \\(kx\\) have the same sign, so it is a <span class="res">travelling wave moving from right to left</span> (−x direction).</p>
      <p>\\(\\omega = 36\\,\\text{rad s}^{-1}\\), \\(k = 0.018\\,\\text{cm}^{-1}\\). Speed \\(v = \\dfrac{\\omega}{k} = \\dfrac{36}{0.018} = 2000\\,\\text{cm s}^{-1} = \\) <span class="res">20 m s⁻¹</span>.</p>
      <p>Amplitude \\(a = 3\\,\\text{cm}\\); frequency \\(\\nu = \\dfrac{\\omega}{2\\pi} = \\) <span class="res">5.73 Hz</span>; initial phase \\(= \\tfrac{\\pi}{4}\\).</p>
      <p>Least distance between crests \\(= \\lambda = \\dfrac{2\\pi}{k} = \\) <span class="res">3.49 m</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q9.</span> For the same wave, plot y versus t at x = 0, 2 and 4 cm. What are the shapes? In which respect (amplitude, frequency or phase) does the motion differ from point to point?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>At \\(x = 0\\): \\(y = 3\\sin(36t + \\tfrac{\\pi}{4})\\), with period \\(T = \\dfrac{2\\pi}{36}\\). The plot is <span class="res">sinusoidal</span>, and the curves for x = 2 cm and x = 4 cm are identical sinusoids shifted along the time axis.</p>
      <p>The oscillations differ only in <span class="res">phase</span>; the amplitude (3 cm) and frequency are the same at every point.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q10.</span> For \\(y(x,t) = 2.0\\cos 2\\pi(10t - 0.0080x + 0.35)\\) (x, y in cm; t in s), find the phase difference between two points separated by (a) 4 m, (b) 0.5 m, (c) λ/2, (d) 3λ/4.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Rewriting, \\(y = 2.0\\cos(20\\pi t - 0.016\\pi x + 0.7\\pi)\\), so \\(k = 0.016\\pi\\,\\text{cm}^{-1}\\) and \\(\\Delta\\phi = k \\cdot \\Delta x\\).</p>
      <p>(a) \\(\\Delta x = 400\\,\\text{cm}\\): \\(\\Delta\\phi = 0.016\\pi \\times 400 = \\) <span class="res">6.4π rad</span>.</p>
      <p>(b) \\(\\Delta x = 50\\,\\text{cm}\\): \\(\\Delta\\phi = 0.016\\pi \\times 50 = \\) <span class="res">0.8π rad</span>.</p>
      <p>(c) \\(\\Delta x = \\tfrac{\\lambda}{2}\\): \\(\\Delta\\phi = \\dfrac{2\\pi}{\\lambda}\\cdot\\dfrac{\\lambda}{2} = \\) <span class="res">π rad</span>.</p>
      <p>(d) \\(\\Delta x = \\tfrac{3\\lambda}{4}\\): \\(\\Delta\\phi = \\dfrac{2\\pi}{\\lambda}\\cdot\\dfrac{3\\lambda}{4} = \\) <span class="res">3π/2 rad</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q11.</span> A string clamped at both ends has \\(y(x,t) = 0.06\\sin\\!\\left(\\tfrac{2\\pi}{3}x\\right)\\cos(120\\pi t)\\) (m, s). Length 1.5 m, mass 3.0 × 10⁻² kg. (a) Travelling or stationary? (b) Interpret as two opposite-travelling waves and give their λ, frequency and speed. (c) Find the tension.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) The form \\(2a\\sin kx \\cos\\omega t\\) is a <span class="res">stationary wave</span>, with \\(2a = 0.06\\) (so \\(a = 0.03\\,\\text{m}\\)), \\(\\omega = 120\\pi\\), \\(k = \\tfrac{2\\pi}{3}\\).</p>
      <p>(b) The two component waves are \\(y_1 = 0.03\\sin(120\\pi t - \\tfrac{2\\pi}{3}x)\\) and \\(y_2 = 0.03\\sin(120\\pi t + \\tfrac{2\\pi}{3}x)\\). Each has frequency \\(\\nu = \\dfrac{\\omega}{2\\pi} = 60\\,\\text{Hz}\\), \\(\\lambda = \\dfrac{2\\pi}{k} = 3\\,\\text{m}\\), and speed \\(v = \\nu\\lambda = 180\\,\\text{m s}^{-1}\\).</p>
      <p>(c) \\(\\mu = \\dfrac{m}{l} = \\dfrac{3.0 \\times 10^{-2}}{1.5} = 2 \\times 10^{-2}\\,\\text{kg m}^{-1}\\); \\(T = v^2\\mu = (180)^2 \\times 2 \\times 10^{-2} = \\) <span class="res">648 N</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q12.</span> For the same string, do all points oscillate with the same frequency, phase and amplitude? What is the amplitude of a point 0.375 m from one end?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>With \\(\\lambda = 3\\,\\text{m}\\) and \\(l = 1.5\\,\\text{m} = \\tfrac{\\lambda}{2}\\), the string vibrates in a single segment (nodes at the ends, one antinode between).</p>
      <p>All points (except nodes) share the same <span class="res">frequency (60 Hz)</span> and the same <span class="res">phase</span>, but the <span class="res">amplitude varies</span> — maximum 0.06 m at the antinode, zero at the nodes.</p>
      <p>At \\(x = 0.375\\,\\text{m}\\): \\(A = 0.06\\sin\\!\\left(\\tfrac{2\\pi}{3}\\times 0.375\\right) = 0.06\\sin\\tfrac{\\pi}{4} = \\) <span class="res">0.042 m</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q13.</span> State whether each represents a travelling wave, a stationary wave, or neither: (a) \\(y = 2\\cos(3x)\\sin(10t)\\); (b) \\(y = 2\\sqrt{x - vt}\\); (c) \\(y = 3\\sin(5x - 0.5t) + 4\\cos(5x - 0.5t)\\); (d) \\(y = \\cos x \\sin t + \\cos 2x \\sin 2t\\).</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) <span class="res">Stationary wave</span>. (b) <span class="res">Neither</span>. (c) <span class="res">Travelling wave</span>. (d) <span class="res">Superposition of two stationary waves</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q14.</span> A wire stretched between rigid supports vibrates in its fundamental mode at 45 Hz. Its mass is 3.5 × 10⁻² kg and its linear mass density is 4.0 × 10⁻² kg m⁻¹. Find the transverse-wave speed and the tension.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Length \\(l = \\dfrac{m}{\\mu} = \\dfrac{3.5 \\times 10^{-2}}{4.0 \\times 10^{-2}} = 0.875\\,\\text{m}\\). Fundamental: \\(\\lambda = 2l = 1.75\\,\\text{m}\\).</p>
      <p>\\(v = \\nu\\lambda = 45 \\times 1.75 = \\) <span class="res">78.75 m s⁻¹</span>.</p>
      <p>\\(T = v^2\\mu = (78.75)^2 \\times 4.0 \\times 10^{-2} = \\) <span class="res">248.06 N</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q15.</span> A metre-long tube open at one end with a movable piston resonates with a 340 Hz tuning fork at tube lengths 25.5 cm and 79.3 cm. Estimate the speed of sound in air (neglect edge effects).</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>The tube acts as a closed pipe (odd harmonics). For the fundamental, \\(l_1 = \\dfrac{\\lambda}{4}\\), so \\(\\lambda = 4 \\times 0.255 = 1.02\\,\\text{m}\\).</p>
      <p>\\(v = \\nu\\lambda = 340 \\times 1.02 = \\) <span class="res">346.8 m s⁻¹</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q16.</span> A steel rod 100 cm long is clamped at its middle. The fundamental frequency of its longitudinal vibrations is 2.53 kHz. What is the speed of sound in steel?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Clamped at the middle: an antinode at the centre and nodes at both ends, so \\(l = \\dfrac{\\lambda}{2}\\), giving \\(\\lambda = 2\\,\\text{m}\\).</p>
      <p>\\(v = \\nu\\lambda = 2.53 \\times 10^{3} \\times 2 = \\) <span class="res">5.06 × 10³ m s⁻¹</span> (5.06 km s⁻¹).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q17.</span> A pipe 20 cm long is closed at one end. Which harmonic is resonantly excited by a 430 Hz source? Would this source resonate if both ends were open? (v = 340 m s⁻¹.)</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Closed pipe: \\(\\nu_n = \\dfrac{(2n-1)v}{4L}\\). Setting \\(430 = \\dfrac{(2n-1)(340)}{4(0.2)}\\) gives \\(2n - 1 \\approx 1\\), i.e. \\(n = 1\\) — the <span class="res">fundamental (first mode)</span>.</p>
      <p>Open pipe: \\(\\nu_n = \\dfrac{nv}{2L}\\) gives \\(n = \\dfrac{430 \\times 2 \\times 0.2}{340} = 0.5\\), not an integer, so <span class="res">no resonance</span> with both ends open.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q18.</span> Two sitar strings A and B playing "Ga" are slightly out of tune and give 6 Hz beats. On slightly reducing the tension in A, the beat frequency drops to 3 Hz. If A = 324 Hz, what is the frequency of B?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Possible B \\(= 324 \\pm 6 = 330\\) or \\(318\\,\\text{Hz}\\). Reducing the tension lowers A's frequency. Since \\(\\nu \\propto \\sqrt{T}\\) and the beat frequency decreased, B must be below A.</p>
      <p>Hence \\(\\nu_B = \\) <span class="res">318 Hz</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q19.</span> Explain why/how: (a) a displacement node is a pressure antinode and vice versa; (b) bats can judge distance, direction, nature and size of obstacles without eyes; (c) a violin and a sitar note of the same frequency are distinguishable; (d) solids support both longitudinal and transverse waves but gases only longitudinal; (e) a pulse is distorted in a dispersive medium.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) A displacement node has minimum vibration but maximum pressure variation, while a displacement antinode has maximum vibration but minimum pressure variation — so they swap roles.</p>
      <p>(b) Bats emit high-frequency ultrasound; the reflected waves return to them, and their brains interpret the echoes to judge distance, direction, nature and size.</p>
      <p>(c) The two instruments produce different sets and strengths of overtones (timbre), so we distinguish them even at the same fundamental frequency.</p>
      <p>(d) Transverse waves require shear stress, which only solids (having a shear modulus) can sustain. Both solids and fluids have a bulk modulus, so longitudinal waves can travel through gases as well.</p>
      <p>(e) A pulse is a combination of many wavelengths; in a dispersive medium these travel at different speeds, so the pulse shape gets distorted.</p>
    </div>
  </div>

</div>
`;