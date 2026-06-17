// kineticTheoryContent.js
// NCERT Solutions Part-II — Class 11 Physics
// Chapter 5: Kinetic Theory
//
// Two named exports consumed by ncert2Solutions.js:
//   EXAMPLES_HTML     -> "Examples" section    (9 worked examples)
//   CHAPTER_END_HTML  -> "Chapter-end" section (10 exercise solutions)
//
// Content is raw HTML rendered inside a MathJax WebView (see Ncert2Screen).
// Inline math uses \( ... \) delimiters (MathJax default).

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
    <p class="q"><span class="q-num">Q1.</span> The density of water is 1000 kg m<sup>-3</sup>. The density of water vapour at 100 °C and 1 atm pressure is 0.6 kg m<sup>-3</sup>. The volume of a molecule multiplied by the total number of molecules gives the molecular volume. Estimate the ratio of the molecular volume to the total volume occupied by the water vapour under these conditions.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>For a given mass of water the volume is inversely proportional to the density, i.e. \\(V \\propto \\dfrac{1}{\\rho}\\).</p>
      <p>So the ratio of the molecular volume to the total volume of the vapour equals the ratio of the densities:</p>
      <p>\\(\\dfrac{\\text{density of water vapour}}{\\text{density of water}} = \\dfrac{0.6}{1000} = \\) <span class="res">\\(6 \\times 10^{-4}\\)</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q2.</span> Estimate the volume of a single water molecule.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>In the liquid (or solid) phase the molecules are closely packed, so the density of a molecule is roughly the bulk density of water, \\(1000\\ \\text{kg m}^{-3}\\).</p>
      <p>1 mole of water has mass \\((2+16)\\,\\text{g} = 18\\,\\text{g} = 0.018\\,\\text{kg}\\) and contains \\(6 \\times 10^{23}\\) molecules.</p>
      <p>Mass of one molecule \\(= \\dfrac{0.018}{6 \\times 10^{23}} = 3 \\times 10^{-26}\\ \\text{kg}\\).</p>
      <p>Volume of one molecule \\(= \\dfrac{3 \\times 10^{-26}}{1000} = 3 \\times 10^{-29}\\ \\text{m}^3\\).</p>
      <p>Treating it as a sphere, \\(\\tfrac{4}{3}\\pi r^3 = 3 \\times 10^{-29}\\), so <span class="res">\\(r \\approx 2 \\times 10^{-10}\\ \\text{m} = 2\\ \\overset{\\circ}{A}\\)</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q3.</span> What is the average distance between molecules (interatomic distance) in water vapour?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>A given mass of water in the vapour state occupies about \\(\\dfrac{1000}{0.6} \\approx 1.67 \\times 10^{3}\\) times the volume of the same mass in the liquid state. This is the increase in volume available per molecule.</p>
      <p>When the volume increases by \\(\\approx 10^{3}\\) times, the radius increases by \\(V^{1/3}\\), i.e. about 10 times: \\(10 \\times 2\\,\\overset{\\circ}{A} = 20\\,\\overset{\\circ}{A}\\).</p>
      <p>So the average distance \\(= 2 \\times 20 = \\) <span class="res">\\(40\\ \\overset{\\circ}{A}\\)</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q4.</span> A vessel contains two non-reacting gases: neon (monoatomic) and oxygen (diatomic). The ratio of their partial pressures is 3 : 2. Estimate the ratio of (i) the number of molecules and (ii) the mass density of neon and oxygen. Molecular mass of Ne = 20.2 u, of O<sub>2</sub> = 32.0 u.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>V and T are the same for both gases. From \\(PV = \\mu RT\\), \\(\\dfrac{P_{Ne}}{P_{O_2}} = \\dfrac{\\mu_{Ne}}{\\mu_{O_2}} = \\dfrac{3}{2}\\).</p>
      <p>(i) Number of molecules \\(N = \\mu N_A\\), so \\(\\dfrac{N_{Ne}}{N_{O_2}} = \\dfrac{\\mu_{Ne}}{\\mu_{O_2}} = \\) <span class="res">1.5</span>.</p>
      <p>(ii) Mass density \\(\\rho = \\dfrac{\\mu M}{V}\\), so \\(\\dfrac{\\rho_{Ne}}{\\rho_{O_2}} = \\dfrac{\\mu_{Ne} M_{Ne}}{\\mu_{O_2} M_{O_2}} = \\dfrac{3}{2} \\times \\dfrac{20.2}{32} = \\) <span class="res">0.947</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q5.</span> A flask contains argon and chlorine in the ratio 2 : 1 by mass at 27 °C. Obtain the ratio of (i) the average kinetic energy per molecule and (ii) the root-mean-square speed \\(v_{rms}\\) of the two gases. Atomic mass of argon = 39.9 u, molecular mass of chlorine = 70.9 u.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(i) The average kinetic energy per molecule of any ideal gas is \\(\\tfrac{3}{2}k_B T\\); it depends only on temperature. Both gases are at the same temperature, so the ratio is <span class="res">1 : 1</span>.</p>
      <p>(ii) Since \\(\\tfrac{1}{2}m v_{rms}^2 = \\tfrac{3}{2}k_B T\\), \\(v_{rms}^2 \\propto \\dfrac{1}{M}\\). Therefore \\(\\dfrac{(v_{rms}^2)_{Ar}}{(v_{rms}^2)_{Cl}} = \\dfrac{M_{Cl}}{M_{Ar}} = \\dfrac{70.9}{39.9} = 1.77\\).</p>
      <p>Taking square roots, \\(\\dfrac{(v_{rms})_{Ar}}{(v_{rms})_{Cl}} = \\) <span class="res">1.33</span>. (The mass composition of the mixture is irrelevant.)</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q6.</span> Uranium has two isotopes of masses 235 u and 238 u. Both are present in uranium hexafluoride gas. Which has the larger average speed? Taking the atomic mass of fluorine as 19 u, estimate the percentage difference in speeds.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>At a fixed temperature \\(\\tfrac{1}{2}m v^2\\) is the same, so \\(v \\propto \\dfrac{1}{\\sqrt{M}}\\): the lighter molecule is faster.</p>
      <p>Masses of UF<sub>6</sub>: \\(235 + 6(19) = 349\\) and \\(238 + 6(19) = 352\\). So the molecule with <span class="res">U-235 (mass 349)</span> moves faster.</p>
      <p>\\(\\dfrac{v_{349}}{v_{352}} = \\sqrt{\\dfrac{352}{349}} = 1.0044\\), hence \\(\\dfrac{\\Delta v}{v} = \\) <span class="res">0.44 %</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q7.</span> A ball rebounds at the same speed from a massive bat held firmly, but at a different speed when the bat moves toward it. (a) Does the ball move faster or slower? (b) Using (a), explain why a gas heats up when compressed by a piston. (c) What happens when a compressed gas pushes a piston out and expands? (d) Did using a heavy bat help Sachin Tendulkar?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) If the ball approaches with speed \\(u\\) and the bat moves toward it with speed \\(V\\), then relative to the bat the ball approaches and rebounds at \\(V+u\\). Relative to the ground the rebound speed is \\(2V + u\\) — the ball <span class="res">speeds up</span>.</p>
      <p>(b) Pushing the piston in is like a moving bat striking the molecules: they rebound faster, raising their average kinetic energy, so the gas <span class="res">heats up</span>.</p>
      <p>(c) When the gas pushes the piston out, the wall recedes (bat moving away), so molecules rebound slower and the gas <span class="res">cools down</span>.</p>
      <p>(d) Yes — a heavier bat acts like a more massive wall, so the ball rebounds faster, helping him hit farther.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q8.</span> A cylinder of fixed capacity 44.8 litres contains helium gas at STP. How much heat is needed to raise the temperature of the gas by 15.0 °C? (R = 8.31 J mol<sup>-1</sup> K<sup>-1</sup>.)</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>At STP 1 mole occupies 22.4 L, so moles of helium \\(\\mu = \\dfrac{44.8}{22.4} = 2\\).</p>
      <p>Helium is monoatomic, so \\(C_V = \\tfrac{3}{2}R\\). The volume is fixed, so \\(\\Delta W = p\\,\\Delta V = 0\\).</p>
      <p>\\(\\Delta Q = \\Delta U = \\mu C_V \\Delta T = 2 \\times \\tfrac{3}{2}R \\times 15 = 45R = 45 \\times 8.31\\).</p>
      <p><span class="res">\\(\\Delta Q \\approx 374\\ \\text{J}\\)</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q9.</span> Estimate the mean free path of a water molecule in water vapour at 373 K. (Take the molecular diameter to be the same as that of air and use \\(n_{air} = 2.7 \\times 10^{25}\\ \\text{m}^{-3}\\) at 273 K.)</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>The diameter \\(d\\) for water vapour is taken to be the same as for air. Number density is inversely proportional to absolute temperature, so \\(n = 2.7 \\times 10^{25} \\times \\dfrac{273}{373} = 2 \\times 10^{25}\\ \\text{m}^{-3}\\).</p>
      <p>Hence the mean free path \\(l \\approx \\) <span class="res">\\(4 \\times 10^{-7}\\ \\text{m}\\)</span>.</p>
    </div>
  </div>

</div>
`;

export const CHAPTER_END_HTML = `
${STYLE}
<div class="ncert">

  <div class="q-block">
    <p class="q"><span class="q-num">Q1.</span> Estimate the fraction of the molecular volume to the actual volume occupied by oxygen gas at STP. Take the diameter of an oxygen molecule to be 3 Å.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Diameter \\(d = 3\\,\\overset{\\circ}{A}\\), so radius \\(r = 1.5\\,\\overset{\\circ}{A} = 1.5 \\times 10^{-8}\\ \\text{cm}\\).</p>
      <p>Actual volume of 1 mole of oxygen at STP \\(= 22400\\ \\text{cm}^3\\).</p>
      <p>Molecular volume \\(V = \\dfrac{4}{3}\\pi r^3 \\cdot N\\), with \\(N = 6.023 \\times 10^{23}\\):</p>
      <p>\\(V = \\dfrac{4}{3} \\times 3.14 \\times (1.5 \\times 10^{-8})^3 \\times 6.023 \\times 10^{23} = 8.51\\ \\text{cm}^3\\).</p>
      <p>Ratio \\(= \\dfrac{8.51}{22400} = \\) <span class="res">\\(3.8 \\times 10^{-4}\\)</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q2.</span> Molar volume is the volume occupied by 1 mol of any ideal gas at STP (1 atm, 0 °C). Show that it is 22.4 litres.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>For 1 mole, \\(PV = nRT\\) with \\(n = 1\\), \\(T = 273\\ \\text{K}\\), \\(P = 1.013 \\times 10^{5}\\ \\text{N m}^{-2}\\).</p>
      <p>\\(V = \\dfrac{nRT}{P} = \\dfrac{1 \\times 8.314 \\times 273}{1.013 \\times 10^{5}} = 0.0224\\ \\text{m}^3\\).</p>
      <p>Since \\(1\\ \\text{litre} = 10^{-3}\\ \\text{m}^3\\), <span class="res">\\(V = 22.4\\ \\text{litres}\\)</span> — the same for all ideal gases at STP.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q3.</span> A plot of PV/T versus P is shown for 1.00 × 10<sup>-3</sup> kg of oxygen at two temperatures. (a) What does the dotted plot signify? (b) Is T<sub>1</sub> &gt; T<sub>2</sub> or T<sub>1</sub> &lt; T<sub>2</sub>? (c) What is PV/T where the curves meet on the y-axis? (d) Would 1.00 × 10<sup>-3</sup> kg of hydrogen give the same value; if not, what mass of hydrogen would? (M<sub>H₂</sub> = 2.02 u, M<sub>O₂</sub> = 32.0 u, R = 8.31 J mol<sup>-1</sup> K<sup>-1</sup>.)</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) The dotted line is parallel to the P-axis, so PV/T is constant as P changes — it represents <span class="res">ideal-gas behaviour</span>.</p>
      <p>(b) The curve at T<sub>1</sub> lies closer to the ideal line, and real gases approach ideal behaviour at higher temperature, so <span class="res">\\(T_1 > T_2\\)</span>.</p>
      <p>(c) Where the curves meet, \\(\\dfrac{PV}{T} = \\mu R\\), with \\(\\mu = \\dfrac{1.00 \\times 10^{-3}}{32 \\times 10^{-3}} = \\dfrac{1}{32}\\). So \\(\\dfrac{PV}{T} = \\dfrac{1}{32} \\times 8.31 = \\) <span class="res">\\(0.26\\ \\text{J K}^{-1}\\)</span>.</p>
      <p>(d) No — hydrogen has a different molar mass. For the same \\(\\dfrac{PV}{T} = 0.26\\): \\(\\dfrac{m}{2.02} \\times 8.31 = 0.26\\), giving \\(m = \\dfrac{2.02 \\times 0.26}{8.31} = \\) <span class="res">\\(6.32 \\times 10^{-2}\\ \\text{g}\\)</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q4.</span> An oxygen cylinder of volume 30 litres has an initial gauge pressure of 15 atm at 27 °C. After some oxygen is withdrawn, the gauge pressure drops to 11 atm and the temperature to 17 °C. Estimate the mass of oxygen taken out. (R = 8.31 J mol<sup>-1</sup> K<sup>-1</sup>, M<sub>O₂</sub> = 32 u.)</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Initial: \\(V_1 = 30 \\times 10^{-3}\\ \\text{m}^3\\), \\(P_1 = 15 \\times 1.013 \\times 10^{5} = 15.195 \\times 10^{5}\\ \\text{Pa}\\), \\(T_1 = 300\\ \\text{K}\\).</p>
      <p>\\(n_1 = \\dfrac{P_1 V_1}{R T_1} = \\dfrac{15.195 \\times 10^{5} \\times 30 \\times 10^{-3}}{8.314 \\times 300} = 18.276\\), so \\(m_1 = n_1 M = 18.276 \\times 32 = 584.84\\ \\text{g}\\).</p>
      <p>Final (same volume): \\(P_2 = 11 \\times 1.013 \\times 10^{5} = 11.143 \\times 10^{5}\\ \\text{Pa}\\), \\(T_2 = 290\\ \\text{K}\\).</p>
      <p>\\(n_2 = \\dfrac{P_2 V_2}{R T_2} = \\dfrac{11.143 \\times 10^{5} \\times 30 \\times 10^{-3}}{8.314 \\times 290} = 13.86\\), so \\(m_2 = 13.86 \\times 32 = 453.1\\ \\text{g}\\).</p>
      <p>Mass taken out \\(= m_1 - m_2 = 584.84 - 453.1 = 131.74\\ \\text{g} \\approx \\) <span class="res">0.131 kg</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q5.</span> An air bubble of volume 1.0 cm³ rises from the bottom of a lake 40 m deep at 12 °C. To what volume does it grow when it reaches the surface, which is at 35 °C?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>At depth: \\(V_1 = 1.0 \\times 10^{-6}\\ \\text{m}^3\\), \\(T_1 = 285\\ \\text{K}\\), \\(P_1 = 1.01 \\times 10^{5} + h\\rho g = 1.01 \\times 10^{5} + 40 \\times 10^{3} \\times 9.8 = 4.93 \\times 10^{5}\\ \\text{Pa}\\).</p>
      <p>At surface: \\(T_2 = 308\\ \\text{K}\\), \\(P_2 = 1.01 \\times 10^{5}\\ \\text{Pa}\\).</p>
      <p>\\(\\dfrac{P_1 V_1}{T_1} = \\dfrac{P_2 V_2}{T_2} \\Rightarrow V_2 = \\dfrac{P_1 V_1 T_2}{T_1 P_2} = \\dfrac{4.93 \\times 10^{5} \\times 1.01 \\times 10^{-6} \\times 308}{285 \\times 1.01 \\times 10^{5}}\\).</p>
      <p><span class="res">\\(V_2 = 5.328 \\times 10^{-6}\\ \\text{m}^3\\)</span> (≈ 5.3 cm³).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q6.</span> Estimate the total number of air molecules (including oxygen, nitrogen, water vapour, etc.) in a room of capacity 25.0 m³ at 27 °C and 1 atm pressure.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Using \\(PV = k_B N T\\) with \\(k_B = 1.38 \\times 10^{-23}\\ \\text{J K}^{-1}\\), \\(P = 1.013 \\times 10^{5}\\ \\text{Pa}\\), \\(V = 25\\ \\text{m}^3\\), \\(T = 300\\ \\text{K}\\):</p>
      <p>\\(N = \\dfrac{PV}{k_B T} = \\dfrac{1.013 \\times 10^{5} \\times 25}{1.38 \\times 10^{-23} \\times 300} = \\) <span class="res">\\(6.11 \\times 10^{26}\\)</span> molecules.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q7.</span> Estimate the average thermal energy of a helium atom at (a) room temperature 27 °C, (b) the surface of the Sun 6000 K, and (c) a stellar core at 10 million K.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Helium has 3 degrees of freedom, so the average thermal energy is \\(\\dfrac{3}{2}k_B T\\) (\\(k_B = 1.38 \\times 10^{-23}\\ \\text{J K}^{-1}\\)).</p>
      <p>(a) At \\(T = 300\\ \\text{K}\\): \\(\\dfrac{3}{2} \\times 1.38 \\times 10^{-23} \\times 300 = \\) <span class="res">\\(6.21 \\times 10^{-21}\\ \\text{J}\\)</span>.</p>
      <p>(b) At \\(T = 6000\\ \\text{K}\\): \\(\\dfrac{3}{2} \\times 1.38 \\times 10^{-23} \\times 6000 = \\) <span class="res">\\(1.241 \\times 10^{-19}\\ \\text{J}\\)</span>.</p>
      <p>(c) At \\(T = 10^{7}\\ \\text{K}\\): \\(\\dfrac{3}{2} \\times 1.38 \\times 10^{-23} \\times 10^{7} = \\) <span class="res">\\(2.07 \\times 10^{-16}\\ \\text{J}\\)</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q8.</span> Three vessels of equal capacity hold gases at the same temperature and pressure: neon (monatomic), chlorine (diatomic), and uranium hexafluoride (polyatomic). Do they contain equal numbers of molecules? Is \\(v_{rms}\\) the same; if not, which is largest?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Equal volumes at the same T and P contain equal numbers of molecules (Avogadro's hypothesis), \\(N = 6.023 \\times 10^{23}\\). So <span class="res">yes, the number of molecules is the same</span>.</p>
      <p>\\(v_{rms} = \\sqrt{\\dfrac{3k_B T}{m}}\\), so with k and T fixed, \\(v_{rms} \\propto \\dfrac{1}{\\sqrt{m}}\\). The speeds are <span class="res">not the same</span>.</p>
      <p>Neon has the smallest molecular mass, so <span class="res">neon has the largest \\(v_{rms}\\)</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q9.</span> At what temperature is the rms speed of an argon atom equal to the rms speed of a helium atom at −20 °C? (Atomic mass of Ar = 39.9 u, of He = 4.0 u.)</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>\\(v_{rms} = \\sqrt{\\dfrac{3RT}{M}}\\). Setting the two equal, \\(\\dfrac{T_{Ar}}{M_{Ar}} = \\dfrac{T_{He}}{M_{He}}\\).</p>
      <p>With \\(T_{He} = -20\\,°\\text{C} = 253\\ \\text{K}\\): \\(T_{Ar} = T_{He} \\times \\dfrac{M_{Ar}}{M_{He}} = 253 \\times \\dfrac{39.9}{4.0}\\).</p>
      <p><span class="res">\\(T_{Ar} \\approx 2.52 \\times 10^{3}\\ \\text{K}\\)</span> (about 2523 K).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q10.</span> Estimate the mean free path and collision frequency of a nitrogen molecule in a cylinder at 2.0 atm and 17 °C. Take the molecular radius as 1.0 Å. Compare the collision time with the time the molecule moves freely between collisions. (M<sub>N₂</sub> = 28.0 u.)</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Given \\(P = 2.0\\ \\text{atm} = 2.026 \\times 10^{5}\\ \\text{Pa}\\), \\(T = 290\\ \\text{K}\\), \\(r = 1 \\times 10^{-10}\\ \\text{m}\\) so \\(d = 2 \\times 10^{-10}\\ \\text{m}\\), \\(M = 28 \\times 10^{-3}\\ \\text{kg}\\).</p>
      <p>\\(v_{rms} = \\sqrt{\\dfrac{3RT}{M}} = \\sqrt{\\dfrac{3 \\times 8.314 \\times 290}{28 \\times 10^{-3}}} = 508.26\\ \\text{m s}^{-1}\\).</p>
      <p>Mean free path \\(l = \\dfrac{k_B T}{\\sqrt{2}\\,\\pi d^2 P} = \\dfrac{1.38 \\times 10^{-23} \\times 290}{\\sqrt{2} \\times 3.14 \\times (2 \\times 10^{-10})^2 \\times 2.026 \\times 10^{5}} = \\) <span class="res">\\(1.11 \\times 10^{-7}\\ \\text{m}\\)</span>.</p>
      <p>Collision frequency \\(= \\dfrac{v_{rms}}{l} = \\dfrac{508.26}{1.11 \\times 10^{-7}} = \\) <span class="res">\\(4.58 \\times 10^{9}\\ \\text{s}^{-1}\\)</span>.</p>
      <p>Single-collision time \\(T = \\dfrac{d}{v_{rms}} = 3.93 \\times 10^{-13}\\ \\text{s}\\); free-travel time \\(T' = \\dfrac{l}{v_{rms}} = 2.18 \\times 10^{-10}\\ \\text{s}\\).</p>
      <p>\\(\\dfrac{T'}{T} \\approx \\) <span class="res">500</span> — the molecule travels freely about 500 times longer than a single collision lasts.</p>
    </div>
  </div>

</div>
`;