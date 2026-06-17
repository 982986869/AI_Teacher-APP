// organicChemistryContent.js
// NCERT Solutions Part-II — Class 11 Chemistry
// Chapter: Organic Chemistry — Some Basic Principles and Techniques
//
// Two named exports consumed by ncert2Solutions.js:
//   EXAMPLES_HTML     -> "Examples" section    (Q1-Q18, source skips Q4)
//   CHAPTER_END_HTML  -> "Chapter-end" section (Q1-Q20)
//
// Content is raw HTML rendered inside a MathJax WebView (see Ncert2Screen).
// Chemical formulae use HTML <sub>/<sup>. Many answers in this chapter are
// structural diagrams that are not text; those are marked "(structure)".

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
  .ncert .note { color:#8E8E93; font-style:italic; }
</style>`;

export const EXAMPLES_HTML = `
${STYLE}
<div class="ncert">

  <div class="q-block">
    <p class="q"><span class="q-num">Q1.</span> How many σ and π bonds are present in (a) HC≡C–CH=CH–CH<sub>3</sub> and (b) CH<sub>2</sub>=C=CH–CH<sub>3</sub>?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) σ(C–C): 4, σ(C–H): 4, π(C=C): 1, π(C≡C): 2.</p>
      <p>(b) σ(C–C): 3, σ(C–H): 6, π(C=C): 2.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q2.</span> What is the type of hybridisation of each carbon in CH<sub>3</sub>Cl, (CH<sub>3</sub>)<sub>2</sub>CO, CH<sub>3</sub>CN, HCONH<sub>2</sub>, CH<sub>3</sub>CH=CHCN?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>CH<sub>3</sub>Cl: sp³. (CH<sub>3</sub>)<sub>2</sub>CO: sp³, sp², sp³. CH<sub>3</sub>CN: sp³, sp. HCONH<sub>2</sub>: sp². CH<sub>3</sub>CH=CHCN: sp³, sp², sp², sp.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q3.</span> Write the state of hybridisation of carbon and the shape of each molecule: H<sub>2</sub>C=O, CH<sub>3</sub>F, HC≡N.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>H<sub>2</sub>C=O: sp² carbon, <span class="res">trigonal planar</span>. CH<sub>3</sub>F: sp³ carbon, <span class="res">tetrahedral</span>. HC≡N: sp carbon, <span class="res">linear</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q5.</span> Write a condensed formula and a bond-line formula for HOCH<sub>2</sub>CH<sub>2</sub>CH<sub>2</sub>CH(CH<sub>3</sub>)CH(CH<sub>3</sub>)CH<sub>3</sub>.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Condensed formula: HO(CH<sub>2</sub>)<sub>3</sub>CH(CH<sub>3</sub>)CH(CH<sub>3</sub>)<sub>2</sub>.</p>
      <p class="note">Bond-line formula: structure — see textbook figure.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q6.</span> Expand the given bond-line formula to show all atoms, including carbon and hydrogen.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p class="note">Structure — see textbook figure (each line terminus/vertex is a carbon, with hydrogens added to complete tetravalency).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q7.</span> Explain why the IUPAC names in parentheses are incorrect: (a) 3-ethyl-5-methylheptane (not 5-ethyl-3-methylheptane); (b) 2,5,6-trimethyloctane (not 3,4,7-trimethyloctane).</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) When substituents are in equivalent positions, the lower locant goes to the one first in alphabetical order — ethyl comes before methyl, so it gets the lower number: <span class="res">3-ethyl-5-methylheptane</span>.</p>
      <p>(b) The correct numbering gives the lowest locant set. Sum 2+5+6 = 13 is lower than 3+4+7 = 14, so <span class="res">2,5,6-trimethyloctane</span> is correct.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q8.</span> Write the IUPAC names of the compounds (i)–(iv) from their structures.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(i) –OH group on an eight-carbon chain at C-3 with a methyl at C-6: <span class="res">6-Methyloctan-3-ol</span>.</p>
      <p>(ii) Two keto groups at C-2 and C-4 on a six-carbon chain: <span class="res">Hexane-2,4-dione</span>.</p>
      <p>(iii) Carboxylic acid (principal group) with a keto group at C-5 on hexane: <span class="res">5-Oxohexanoic acid</span>.</p>
      <p>(iv) Two C=C at C-1, C-3 and a C≡C at C-5 on hexane: <span class="res">Hexa-1,3-dien-5-yne</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q9.</span> Draw the structures of 2-chlorohexane, pent-4-en-2-ol, 3-nitrocyclohexene, cyclohex-2-en-1-ol, and 6-hydroxyheptanal.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p class="note">Structures — see textbook figures.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q10.</span> Write the structural formula of (1) o-Ethylanisole, (2) p-Nitroaniline, (3) 2,3-Dibromo-1-phenylpentane, (4) 4-Ethyl-1-fluoro-2-nitrobenzene.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p class="note">Structures — see textbook figures.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q11.</span> Using curved-arrow notation, show the reactive intermediates formed when CH<sub>3</sub>–SCH<sub>3</sub>, CH<sub>3</sub>–CN and CH<sub>3</sub>–Cu undergo heterolytic cleavage.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p class="note">Mechanism (curved arrows) — see textbook figure. Heterolysis gives an ion pair: the more electronegative fragment takes the bonding pair (becoming the anion) and the other becomes the cation.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q12.</span> Categorise as nucleophile or electrophile, with justification: HS<sup>−</sup>, BF<sub>3</sub>, C<sub>2</sub>H<sub>5</sub>O<sup>−</sup>, (CH<sub>3</sub>)<sub>3</sub>N:, Cl<sup>+</sup>, CH<sub>3</sub>–C<sup>+</sup>=O, H<sub>2</sub>N:<sup>−</sup>, NO<sub>2</sub><sup>+</sup>.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Nucleophiles (have a lone pair to donate): HS<sup>−</sup>, C<sub>2</sub>H<sub>5</sub>O<sup>−</sup>, (CH<sub>3</sub>)<sub>3</sub>N:, H<sub>2</sub>N:<sup>−</sup>.</p>
      <p>Electrophiles (electron-deficient, can accept a pair): BF<sub>3</sub>, Cl<sup>+</sup>, CH<sub>3</sub>–C<sup>+</sup>=O, NO<sub>2</sub><sup>+</sup>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q13.</span> Identify the electrophilic centre in CH<sub>3</sub>CH=O, CH<sub>3</sub>CN, CH<sub>3</sub>I.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>The electrophilic centres are the carbon atoms carrying a partial positive charge due to bond polarity: the carbonyl carbon in CH<sub>3</sub>CH=O, the nitrile carbon in CH<sub>3</sub>CN, and the carbon bonded to iodine in CH<sub>3</sub>I.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q14.</span> Which bond is more polar: (a) H<sub>3</sub>C–H or H<sub>3</sub>C–Br; (b) H<sub>3</sub>C–NH<sub>2</sub> or H<sub>3</sub>C–OH; (c) H<sub>3</sub>C–OH or H<sub>3</sub>C–SH?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) <span class="res">H<sub>3</sub>C–Br</span> (Br is more electronegative than H). (b) <span class="res">H<sub>3</sub>C–OH</span> (O &gt; N). (c) <span class="res">H<sub>3</sub>C–OH</span> (O &gt; S).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q15.</span> In which C–C bond of CH<sub>3</sub>CH<sub>2</sub>CH<sub>2</sub>Br is the inductive effect expected to be the least?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>The inductive effect weakens as the number of intervening bonds increases, so it is least in the bond <span class="res">farthest from the Br atom</span> (the C-2–C-3 region of the chain).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q16.</span> Write the resonance structures of CH<sub>3</sub>COO<sup>−</sup>, showing electron movement with curved arrows.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>The negative charge is delocalised over the two oxygen atoms, giving two equivalent resonance structures in which the C–O and C=O bonds interchange.</p>
      <p class="note">Curved-arrow diagram — see textbook figure.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q17.</span> Write the resonance structures of CH<sub>2</sub>=CH–CHO and indicate the relative stability of the contributing structures.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Structure I (the neutral form) is <span class="res">most stable</span> — it has the most covalent bonds, complete octets, and no charge separation.</p>
      <p>The structure with the negative charge on oxygen (the more electronegative atom) and the positive charge on carbon is the next contributor.</p>
      <p>The structure with a positive charge on oxygen and a negative charge on carbon is <span class="res">least stable</span> and contributes little.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q18.</span> Explain why structures I and II cannot be major contributors to the real structure of CH<sub>3</sub>COOCH<sub>3</sub>.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Both involve charge separation, which makes them less important contributors. In addition, structure I has a carbon atom with an incomplete octet, further lowering its contribution.</p>
    </div>
  </div>

</div>
`;

export const CHAPTER_END_HTML = `
${STYLE}
<div class="ncert">

  <div class="q-block">
    <p class="q"><span class="q-num">Q1.</span> What are the hybridisation states of each carbon atom in CH<sub>2</sub>=C=O, CH<sub>3</sub>CH=CH<sub>2</sub>, (CH<sub>3</sub>)<sub>2</sub>CO, CH<sub>2</sub>=CHCN, C<sub>6</sub>H<sub>6</sub>?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>CH<sub>2</sub>=C=O: terminal C sp², central C sp. CH<sub>3</sub>CH=CH<sub>2</sub>: sp³, sp², sp². (CH<sub>3</sub>)<sub>2</sub>CO: sp³, sp², sp³. CH<sub>2</sub>=CHCN: sp², sp², sp. C<sub>6</sub>H<sub>6</sub>: every carbon is sp².</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q2.</span> Indicate the number of σ and π bonds in C<sub>6</sub>H<sub>6</sub>, C<sub>6</sub>H<sub>12</sub>, CH<sub>2</sub>Cl<sub>2</sub>, CH<sub>2</sub>=C=CH<sub>2</sub>, CH<sub>3</sub>NO<sub>2</sub>, HCONHCH<sub>3</sub>.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>C<sub>6</sub>H<sub>6</sub>: 12 σ, 3 π. C<sub>6</sub>H<sub>12</sub> (cyclohexane): 18 σ, 0 π. CH<sub>2</sub>Cl<sub>2</sub>: 4 σ, 0 π. CH<sub>2</sub>=C=CH<sub>2</sub> (allene): 6 σ, 2 π. CH<sub>3</sub>NO<sub>2</sub>: 6 σ, 1 π. HCONHCH<sub>3</sub>: 8 σ, 1 π.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q3.</span> Write bond-line formulas for isopropyl alcohol, 2,3-dimethylbutanal, and heptan-4-one.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Isopropyl alcohol: (CH<sub>3</sub>)<sub>2</sub>CHOH. 2,3-Dimethylbutanal: (CH<sub>3</sub>)<sub>2</sub>CHCH(CH<sub>3</sub>)CHO. Heptan-4-one: CH<sub>3</sub>CH<sub>2</sub>CH<sub>2</sub>COCH<sub>2</sub>CH<sub>2</sub>CH<sub>3</sub>.</p>
      <p class="note">Bond-line drawings — see textbook figures.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q4.</span> Give the IUPAC names of the given compounds (including Cl<sub>2</sub>CHCH<sub>2</sub>OH).</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Propylbenzene; 3-Methylpentanenitrile; 2,5-Dimethylheptane; 3-Bromo-3-chloroheptane; 3-Chloropropanal; and Cl<sub>2</sub>CHCH<sub>2</sub>OH = <span class="res">2,2-Dichloroethanol</span>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q5.</span> Which is the correct IUPAC name? (a) 2,2-Dimethylpentane / 2-Dimethylpentane; (b) 2,4,7-Trimethyloctane / 2,5,7-Trimethyloctane; (c) 2-Chloro-4-methylpentane / 4-Chloro-2-methylpentane; (d) But-3-yn-1-ol / But-4-ol-1-yne.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) <span class="res">2,2-Dimethylpentane</span> — the locant is repeated for two groups on the same carbon.</p>
      <p>(b) <span class="res">2,4,7-Trimethyloctane</span> — the set {2,4,7} is lower than {2,5,7}.</p>
      <p>(c) <span class="res">2-Chloro-4-methylpentane</span> — lower locant by alphabetical order of substituents.</p>
      <p>(d) <span class="res">But-3-yn-1-ol</span> — the principal functional group (–ol) gets the lower locant.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q6.</span> Draw the first five members of each homologous series beginning with HCOOH, CH<sub>3</sub>COCH<sub>3</sub>, and H–CH=CH<sub>2</sub>.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Carboxylic acids: HCOOH, CH<sub>3</sub>COOH, CH<sub>3</sub>CH<sub>2</sub>COOH, CH<sub>3</sub>CH<sub>2</sub>CH<sub>2</sub>COOH, CH<sub>3</sub>CH<sub>2</sub>CH<sub>2</sub>CH<sub>2</sub>COOH.</p>
      <p>Ketones: CH<sub>3</sub>COCH<sub>3</sub>, CH<sub>3</sub>COCH<sub>2</sub>CH<sub>3</sub>, CH<sub>3</sub>COCH<sub>2</sub>CH<sub>2</sub>CH<sub>3</sub>, CH<sub>3</sub>COCH<sub>2</sub>CH<sub>2</sub>CH<sub>2</sub>CH<sub>3</sub>, CH<sub>3</sub>CO(CH<sub>2</sub>)<sub>4</sub>CH<sub>3</sub>.</p>
      <p>Alkenes: CH<sub>2</sub>=CH<sub>2</sub>, CH<sub>3</sub>CH=CH<sub>2</sub>, CH<sub>3</sub>CH<sub>2</sub>CH=CH<sub>2</sub>, CH<sub>3</sub>CH<sub>2</sub>CH<sub>2</sub>CH=CH<sub>2</sub>, CH<sub>3</sub>CH<sub>2</sub>CH<sub>2</sub>CH<sub>2</sub>CH=CH<sub>2</sub>.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q7.</span> Give condensed and bond-line formulas and identify functional groups for 2,2,4-trimethylpentane, 2-hydroxy-1,2,3-propanetricarboxylic acid, and hexanedial.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>2,2,4-Trimethylpentane: (CH<sub>3</sub>)<sub>3</sub>CCH<sub>2</sub>CH(CH<sub>3</sub>)<sub>2</sub> — no functional group (an alkane).</p>
      <p>2-Hydroxy-1,2,3-propanetricarboxylic acid (citric acid): one –OH and three –COOH groups.</p>
      <p>Hexanedial: OHC(CH<sub>2</sub>)<sub>4</sub>CHO — two –CHO (aldehyde) groups.</p>
      <p class="note">Bond-line drawings — see textbook figures.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q8.</span> Identify the functional groups in the given compounds.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p class="note">Structure-based — see textbook figures (identify groups such as –OH, –CHO, &gt;C=O, –COOH, –NH<sub>2</sub>, –NO<sub>2</sub>, etc., as present in each structure).</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q9.</span> Which is more stable: O<sub>2</sub>NCH<sub>2</sub>CH<sub>2</sub>O<sup>−</sup> or CH<sub>3</sub>CH<sub>2</sub>O<sup>−</sup>? Why?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p><span class="res">O<sub>2</sub>NCH<sub>2</sub>CH<sub>2</sub>O<sup>−</sup></span> is more stable. The –NO<sub>2</sub> group has a –I effect and disperses the negative charge on the oxygen. In CH<sub>3</sub>CH<sub>2</sub>O<sup>−</sup>, the ethyl group has a +I effect that intensifies the negative charge and destabilises the ion.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q10.</span> Explain why alkyl groups act as electron donors when attached to a π system.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Because of <span class="res">hyperconjugation</span> — the σ electrons of the C–H bonds of the alkyl group delocalise into the adjacent π system, effectively donating electron density to it.</p>
      <p class="note">Resonance/hyperconjugation structures — see textbook figure.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q11.</span> Draw the resonance structures (with curved arrows) for C<sub>6</sub>H<sub>5</sub>OH, C<sub>6</sub>H<sub>5</sub>NO<sub>2</sub>, CH<sub>3</sub>CH=CHCHO, C<sub>6</sub>H<sub>5</sub>CHO, C<sub>6</sub>H<sub>5</sub>–C<sup>+</sup>H<sub>2</sub>, and CH<sub>3</sub>CH=CH–C<sup>+</sup>H<sub>2</sub>.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p class="note">Resonance structures (curved-arrow notation) — see textbook figures. In each, electron density (or the positive charge) is delocalised over the conjugated/aromatic system.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q12.</span> What are electrophiles and nucleophiles? Explain with examples.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Electrophiles ("electron-loving") are electron-deficient species — positive ions or neutral molecules that accept an electron pair. Examples: H<sup>+</sup>, Cl<sup>+</sup>, Br<sup>+</sup>, NO<sub>2</sub><sup>+</sup>, R<sub>3</sub>C<sup>+</sup>, AlCl<sub>3</sub>, BF<sub>3</sub>.</p>
      <p>Nucleophiles ("nucleus-loving") are electron-rich species that attack positive centres by donating an electron pair. Examples: Cl<sup>−</sup>, Br<sup>−</sup>, CN<sup>−</sup>, OH<sup>−</sup>, NH<sub>3</sub>, RNH<sub>2</sub>, H<sub>2</sub>O, ROH.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q13.</span> Identify the bold reagents as nucleophiles or electrophiles: (a) CH<sub>3</sub>COOH + <b>HO<sup>−</sup></b>; (b) (CH<sub>3</sub>)<sub>2</sub>CO + <b>⁻CN</b>; (c) C<sub>6</sub>H<sub>6</sub> + <b>CH<sub>3</sub>CO<sup>+</sup></b>.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) HO<sup>−</sup> — nucleophile. (b) <sup>−</sup>CN — nucleophile. (c) CH<sub>3</sub>CO<sup>+</sup> — electrophile.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q14.</span> Classify each reaction: (a) CH<sub>3</sub>CH<sub>2</sub>Br + HS<sup>−</sup> → CH<sub>3</sub>CH<sub>2</sub>SH + Br<sup>−</sup>; (b) (CH<sub>3</sub>)<sub>2</sub>C=CH<sub>2</sub> + HCl → (CH<sub>3</sub>)<sub>2</sub>CCl–CH<sub>3</sub>; (c) CH<sub>3</sub>CH<sub>2</sub>Br + HO<sup>−</sup> → CH<sub>2</sub>=CH<sub>2</sub> + H<sub>2</sub>O + Br<sup>−</sup>; (d) (CH<sub>3</sub>)<sub>3</sub>C–CH<sub>2</sub>OH + HBr → (CH<sub>3</sub>)<sub>2</sub>CBr–CH<sub>2</sub>CH<sub>3</sub> + H<sub>2</sub>O.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) Nucleophilic substitution. (b) Electrophilic addition. (c) Bimolecular elimination (E2). (d) Nucleophilic substitution with rearrangement.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q15.</span> What is the relationship between the members of each pair of structures — structural isomers, geometrical isomers, or resonance contributors?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>(a) Structural isomers (position isomers / metamers). (b) Geometrical isomers. (c) Resonance contributors — they differ only in the position of electrons, not atoms.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q16.</span> For CH<sub>3</sub>O–OCH<sub>3</sub> → 2 CH<sub>3</sub>O•, use curved arrows to show the electron flow, classify the cleavage as homolysis or heterolysis, and identify the reactive intermediate (free radical / carbocation / carbanion).</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>This is <span class="res">homolysis</span> — the O–O bond breaks evenly, each oxygen keeping one electron, producing two methoxy <span class="res">free radicals</span> (CH<sub>3</sub>O•). Curved (fish-hook) single-electron arrows are used.</p>
      <p class="note">Mechanism diagram — see textbook figure.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q17.</span> Explain inductive and electromeric effects. Which electron-displacement effect explains: (a) Cl<sub>3</sub>CCOOH &gt; Cl<sub>2</sub>CHCOOH &gt; ClCH<sub>2</sub>COOH; (b) CH<sub>3</sub>CH<sub>2</sub>COOH &gt; (CH<sub>3</sub>)<sub>2</sub>CHCOOH &gt; (CH<sub>3</sub>)<sub>3</sub>C·COOH?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Inductive effect: the permanent polarity in a σ bond caused by a difference in electronegativity; –I groups (NO<sub>2</sub>, halogens, OH) withdraw electrons, +I groups (alkyl) push electrons toward carbon. It weakens along the chain.</p>
      <p>Electromeric effect: a temporary, complete shift of a π-bond electron pair when an attacking reagent approaches a multiple bond; it lasts only while the reagent is present.</p>
      <p>(a) Explained by the <span class="res">–I effect</span>: more chlorine atoms → stronger electron withdrawal → stronger acid.</p>
      <p>(b) Explained by the <span class="res">+I effect</span>: more alkyl groups → greater electron donation → weaker acid.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q18.</span> Briefly describe the principle of crystallisation, distillation, and chromatography, with an example of each.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Crystallisation: the impure solid is dissolved in the minimum hot solvent; on cooling, the pure compound crystallises out while soluble impurities stay in the mother liquor. Example: purification of sugar.</p>
      <p>Distillation: a liquid is boiled and its vapours condensed in another vessel, separating it from non-volatile impurities. Example: purifying benzene/toluene.</p>
      <p>Chromatography: components distribute differently between a stationary and a moving phase (adsorption or partition), so they separate. Example: separating plant pigments or dyes.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q19.</span> Describe a method to separate two compounds with different solubilities in a solvent S.</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p><span class="res">Fractional crystallisation.</span> A hot saturated solution is cooled; the less soluble compound crystallises first and is filtered off. The mother liquor is concentrated and cooled again to crystallise the more soluble compound, which is then filtered and dried.</p>
    </div>
  </div>

  <div class="q-block">
    <p class="q"><span class="q-num">Q20.</span> What is the difference between distillation, distillation under reduced pressure, and steam distillation?</p>
    <div class="sol">
      <p class="sol-h">Solution</p>
      <p>Distillation: for a volatile liquid containing non-volatile impurities.</p>
      <p>Distillation under reduced pressure: for liquids with very high boiling points that decompose at or below their boiling point — lowering the pressure lets them boil at a lower temperature.</p>
      <p>Steam distillation: for steam-volatile liquids that are immiscible with water and associated with water-immiscible impurities.</p>
    </div>
  </div>

</div>
`;