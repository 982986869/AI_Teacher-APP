// ncert2Solutions.js
// NCERT Solutions Part-II content registry.
//
// Each chapter normally exposes two sections: "Examples" and "Chapter-end".
// A chapter can opt out of Examples with `hideExamples: true`.
// Real HTML content is attached per chapter where available; otherwise the
// section shows a "coming soon" placeholder.
//
// Content is raw HTML rendered inside a WebView with MathJax (see Ncert2Screen).

import { EXAMPLES_HTML as SOLIDS_EX,  CHAPTER_END_HTML as SOLIDS_CE  } from './mpsSolidsContent';
import { EXAMPLES_HTML as FLUIDS_EX,  CHAPTER_END_HTML as FLUIDS_CE  } from './mpFluidsContent';
import { EXAMPLES_HTML as THERMAL_EX, CHAPTER_END_HTML as THERMAL_CE } from './thermalContent';
import { CHAPTER_END_HTML as THERMO_CE } from './thermodynamicsContent';
import { EXAMPLES_HTML as KINETIC_EX, CHAPTER_END_HTML as KINETIC_CE } from './kineticTheoryContent';
import { EXAMPLES_HTML as REDOX_EX, CHAPTER_END_HTML as REDOX_CE } from './redoxReactionsContent';
import { EXAMPLES_HTML as ORG_EX, CHAPTER_END_HTML as ORG_CE } from './organicChemistryContent';
import { EXAMPLES_HTML as HYDRO_EX, CHAPTER_END_HTML as HYDRO_CE } from './hydrocarbonsContent';
import {
  EXAMPLES_HTML as SETS_EX,
  EX1_1_HTML as SETS_1_1,
  EX1_2_HTML as SETS_1_2,
  EX1_3_HTML as SETS_1_3,
  EX1_4_HTML as SETS_1_4,
  EX1_5_HTML as SETS_1_5,
  MISC_HTML as SETS_MISC,
} from './setsContent';
import {
  EXAMPLES_HTML as RF_EX,
  EX2_1_HTML as RF_2_1,
  EX2_2_HTML as RF_2_2,
  EX2_3_HTML as RF_2_3,
  MISC_HTML as RF_MISC,
} from './relationsFunctionsContent';
import {
  EXAMPLES_HTML as TRIG_EX,
  EX3_1_HTML as TRIG_3_1,
  EX3_2_HTML as TRIG_3_2,
  EX3_3_HTML as TRIG_3_3,
  MISC_HTML as TRIG_MISC,
} from './trigonometricFunctionsContent';
import {
  EXAMPLES_HTML as CN_EX,
  EX4_1_HTML as CN_4_1,
  MISC_HTML as CN_MISC,
} from './complexNumbersContent';
import {
  EXAMPLES_HTML as LI_EX,
  EX5_1_HTML as LI_5_1,
  MISC_HTML as LI_MISC,
} from './linearInequalitiesContent';
import {
  EXAMPLES_HTML as PC_EX,
  EX6_1_HTML as PC_6_1,
  EX6_2_HTML as PC_6_2,
  EX6_3_HTML as PC_6_3,
  EX6_4_HTML as PC_6_4,
  MISC_HTML as PC_MISC,
} from './permutationsCombinationsContent';
import {
  EXAMPLES_HTML as BT_EX,
  EX7_1_HTML as BT_7_1,
  MISC_HTML as BT_MISC,
} from './binomialTheoremContent';
import {
  EXAMPLES_HTML as SS_EX,
  EX8_1_HTML as SS_8_1,
  EX8_2_HTML as SS_8_2,
  MISC_HTML as SS_MISC,
} from './sequencesSeriesContent';
import {
  EXAMPLES_HTML as SL_EX,
  EX9_1_HTML as SL_9_1,
  EX9_2_HTML as SL_9_2,
  EX9_3_HTML as SL_9_3,
  MISC_HTML as SL_MISC,
} from './straightLinesContent';
import {
  EXAMPLES_HTML as CS_EX,
  EX10_1_HTML as CS_10_1,
  EX10_2_HTML as CS_10_2,
  EX10_3_HTML as CS_10_3,
  EX10_4_HTML as CS_10_4,
  MISC_HTML as CS_MISC,
} from './conicSectionsContent';
import {
  EXAMPLES_HTML as G3_EX,
  EX11_1_HTML as G3_11_1,
  EX11_2_HTML as G3_11_2,
  MISC_HTML as G3_MISC,
} from './introTo3DGeometryContent';
import {
  EXAMPLES_HTML as LD_EX,
  EX12_1_HTML as LD_12_1,
  EX12_2_HTML as LD_12_2,
  MISC_HTML as LD_MISC,
} from './limitsDerivativesContent';
import {
  EX13_1_HTML as ST_13_1,
  EX13_2_HTML as ST_13_2,
  MISC_HTML as ST_MISC,
} from './statisticsContent';
import {
  EXAMPLES_HTML as PR_EX,
  EX14_1_HTML as PR_14_1,
  EX14_2_HTML as PR_14_2,
  MISC_HTML as PR_MISC,
} from './probabilityContent';
import {
  CH1_HTML as BIO_CH1,
  CH2_HTML as BIO_CH2,
  CH3_HTML as BIO_CH3,
  CH4_HTML as BIO_CH4,
  CH5_HTML as BIO_CH5,
  CH6_HTML as BIO_CH6,
  CH7_HTML as BIO_CH7,
  CH8_HTML as BIO_CH8,
  CH9_HTML as BIO_CH9,
  CH10_HTML as BIO_CH10,
  CH11_HTML as BIO_CH11,
  CH12_HTML as BIO_CH12,
  CH13_HTML as BIO_CH13,
  CH14_HTML as BIO_CH14,
  CH15_HTML as BIO_CH15,
  CH16_HTML as BIO_CH16,
  CH17_HTML as BIO_CH17,
  CH18_HTML as BIO_CH18,
  CH19_HTML as BIO_CH19,
} from './biologyContent';

// Mapping is by file CONTENT (worked examples -> Examples, exercises -> Chapter-end).
const solids  = { examples: SOLIDS_EX,  chapterEnd: SOLIDS_CE  };
const fluids  = { examples: FLUIDS_EX,  chapterEnd: FLUIDS_CE  };
const thermal = { examples: THERMAL_EX, chapterEnd: THERMAL_CE };
const thermo  = { chapterEnd: THERMO_CE, hideExamples: true }; // Chapter-end only (no Examples)
const kinetic = { examples: KINETIC_EX, chapterEnd: KINETIC_CE };
const redox   = { examples: REDOX_EX,   chapterEnd: REDOX_CE   };
const organic = { examples: ORG_EX,     chapterEnd: ORG_CE     }; // ORG_EX is null until Examples page provided
const hydro   = { examples: HYDRO_EX,   chapterEnd: HYDRO_CE   };

// ── Mathematics uses the exercise-list template ──────────────────────────────
// Each chapter exposes an ordered `sections` array (Examples, Exercise X.1,
// ... Miscellaneous Exercise) instead of the Examples/Chapter-end model.
// html starts null; fill each as its source page is uploaded.
const sets = {
  sections: [
    { key: 'examples', label: 'Examples',               html: SETS_EX },
    { key: 'ex1_1',    label: 'Exercise 1.1',           html: SETS_1_1 },
    { key: 'ex1_2',    label: 'Exercise 1.2',           html: SETS_1_2 },
    { key: 'ex1_3',    label: 'Exercise 1.3',           html: SETS_1_3 },
    { key: 'ex1_4',    label: 'Exercise 1.4',           html: SETS_1_4 },
    { key: 'ex1_5',    label: 'Exercise 1.5',           html: SETS_1_5 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: SETS_MISC },
  ],
};

// Chapters listed in the registry but with no content added yet.
// Both sections render as "coming soon" placeholders until content is wired in.
const pending = {};

// Placeholder for Maths chapters not yet built. Uses the exercise-list template
// (Examples + Miscellaneous Exercise) rather than Examples/Chapter-end. When a
// chapter's exercise pages are uploaded, replace this with a full `sections`
// array (Examples, Exercise X.1 ... X.n, Miscellaneous Exercise) like `sets`.
const mathsPending = {
  sections: [
    { key: 'examples', label: 'Examples',               html: null },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: null },
  ],
};

// Ch.7 Binomial Theorem — Examples, Ex 7.1, Misc (all complete).
const binomialTheorem = {
  sections: [
    { key: 'examples', label: 'Examples',               html: BT_EX },
    { key: 'ex7_1',    label: 'Exercise 7.1',           html: BT_7_1 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: BT_MISC },
  ],
};

// Ch.13 Statistics — Ex 13.1, 13.2, Misc complete; Examples pending (not yet uploaded).
const statistics = {
  sections: [
    { key: 'examples', label: 'Examples',               html: null },
    { key: 'ex13_1',   label: 'Exercise 13.1',          html: ST_13_1 },
    { key: 'ex13_2',   label: 'Exercise 13.2',          html: ST_13_2 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: ST_MISC },
  ],
};

// Ch.14 Probability — Examples (p.1/2), Ex 14.1 (p.1/2), Ex 14.2 (p.1/3) partial; Misc complete.
const probability = {
  sections: [
    { key: 'examples', label: 'Examples',               html: PR_EX },
    { key: 'ex14_1',   label: 'Exercise 14.1',          html: PR_14_1 },
    { key: 'ex14_2',   label: 'Exercise 14.2',          html: PR_14_2 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: PR_MISC },
  ],
};

// Ch.11 Introduction to Three Dimensional Geometry — Examples, Ex 11.1-11.2, Misc (all complete).
const introTo3DGeometry = {
  sections: [
    { key: 'examples', label: 'Examples',               html: G3_EX },
    { key: 'ex11_1',   label: 'Exercise 11.1',          html: G3_11_1 },
    { key: 'ex11_2',   label: 'Exercise 11.2',          html: G3_11_2 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: G3_MISC },
  ],
};

// Ch.12 Limits and Derivatives — all four sections page 1 of 2 (page-2 tails pending).
const limitsDerivatives = {
  sections: [
    { key: 'examples', label: 'Examples',               html: LD_EX },
    { key: 'ex12_1',   label: 'Exercise 12.1',          html: LD_12_1 },
    { key: 'ex12_2',   label: 'Exercise 12.2',          html: LD_12_2 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: LD_MISC },
  ],
};

// Ch.10 Conic Sections — Examples, Ex 10.1-10.4, Misc (all complete).
const conicSections = {
  sections: [
    { key: 'examples', label: 'Examples',               html: CS_EX },
    { key: 'ex10_1',   label: 'Exercise 10.1',          html: CS_10_1 },
    { key: 'ex10_2',   label: 'Exercise 10.2',          html: CS_10_2 },
    { key: 'ex10_3',   label: 'Exercise 10.3',          html: CS_10_3 },
    { key: 'ex10_4',   label: 'Exercise 10.4',          html: CS_10_4 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: CS_MISC },
  ],
};

// Ch.9 Straight Lines — Examples, Ex 9.1-9.2 complete; Ex 9.3 (20/22) & Misc (20/26) partial.
const straightLines = {
  sections: [
    { key: 'examples', label: 'Examples',               html: SL_EX },
    { key: 'ex9_1',    label: 'Exercise 9.1',           html: SL_9_1 },
    { key: 'ex9_2',    label: 'Exercise 9.2',           html: SL_9_2 },
    { key: 'ex9_3',    label: 'Exercise 9.3',           html: SL_9_3 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: SL_MISC },
  ],
};

// Ch.8 Sequences and Series — Examples, Ex 8.1, Misc complete; Ex 8.2 partial (20/34).
const sequencesSeries = {
  sections: [
    { key: 'examples', label: 'Examples',               html: SS_EX },
    { key: 'ex8_1',    label: 'Exercise 8.1',           html: SS_8_1 },
    { key: 'ex8_2',    label: 'Exercise 8.2',           html: SS_8_2 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: SS_MISC },
  ],
};

// Ch.6 Permutations and Combinations — Ex 6.1-6.4 + Misc complete; Examples partial (20/38).
const permutationsCombinations = {
  sections: [
    { key: 'examples', label: 'Examples',               html: PC_EX },
    { key: 'ex6_1',    label: 'Exercise 6.1',           html: PC_6_1 },
    { key: 'ex6_2',    label: 'Exercise 6.2',           html: PC_6_2 },
    { key: 'ex6_3',    label: 'Exercise 6.3',           html: PC_6_3 },
    { key: 'ex6_4',    label: 'Exercise 6.4',           html: PC_6_4 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: PC_MISC },
  ],
};

// Ch.5 Linear Inequalities — Examples + Misc complete; Ex 5.1 partial (20/30, pg 2 pending).
const linearInequalities = {
  sections: [
    { key: 'examples', label: 'Examples',               html: LI_EX },
    { key: 'ex5_1',    label: 'Exercise 5.1',           html: LI_5_1 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: LI_MISC },
  ],
};

// Ch.4 Complex Numbers and Quadratic Equations — Examples, Ex 4.1, Misc (all filled).
const complexNumbers = {
  sections: [
    { key: 'examples', label: 'Examples',               html: CN_EX },
    { key: 'ex4_1',    label: 'Exercise 4.1',           html: CN_4_1 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: CN_MISC },
  ],
};

// Ch.3 Trigonometric Functions — Examples + Misc filled; exercises pending.
const trigonometricFunctions = {
  sections: [
    { key: 'examples', label: 'Examples',               html: TRIG_EX },
    { key: 'ex3_1',    label: 'Exercise 3.1',           html: TRIG_3_1 },
    { key: 'ex3_2',    label: 'Exercise 3.2',           html: TRIG_3_2 },
    { key: 'ex3_3',    label: 'Exercise 3.3',           html: TRIG_3_3 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: TRIG_MISC },
  ],
};

// Ch.2 Relations and Functions — Examples + Misc filled; exercises pending.
const relationsFunctions = {
  sections: [
    { key: 'examples', label: 'Examples',               html: RF_EX },
    { key: 'ex2_1',    label: 'Exercise 2.1',           html: RF_2_1 },
    { key: 'ex2_2',    label: 'Exercise 2.2',           html: RF_2_2 },
    { key: 'ex2_3',    label: 'Exercise 2.3',           html: RF_2_3 },
    { key: 'misc',     label: 'Miscellaneous Exercise', html: RF_MISC },
  ],
};

// Map: subject -> chapter -> config.
// Keys are the EXACT chapter titles from your ResourcesScreen SUBJECTS list.
// Class 11 Biology — Chapter-end only (no Examples; the subject-level rule in
// getNcert2Sections drops Examples for Biology).
const bioLivingWorld    = { chapterEnd: BIO_CH1 };
const bioClassification = { chapterEnd: BIO_CH2 };
const bioPlantKingdom   = { chapterEnd: BIO_CH3 };
const bioAnimalKingdom  = { chapterEnd: BIO_CH4 };
const bioMorphology     = { chapterEnd: BIO_CH5 };
const bioAnatomy        = { chapterEnd: BIO_CH6 };
const bioStructuralOrg  = { chapterEnd: BIO_CH7 };
const bioCell           = { chapterEnd: BIO_CH8 };
const bioBiomolecules   = { chapterEnd: BIO_CH9 };
const bioCellCycle      = { chapterEnd: BIO_CH10 };
const bioPhotosynthesis = { chapterEnd: BIO_CH11 };
const bioRespiration    = { chapterEnd: BIO_CH12 };
const bioPlantGrowth    = { chapterEnd: BIO_CH13 };
const bioBreathing      = { chapterEnd: BIO_CH14 };
const bioBodyFluids     = { chapterEnd: BIO_CH15 };
const bioExcretory      = { chapterEnd: BIO_CH16 };
const bioLocomotion     = { chapterEnd: BIO_CH17 };
const bioNeural         = { chapterEnd: BIO_CH18 };
const bioChemicalCoord  = { chapterEnd: BIO_CH19 };

const CONTENT = {
  Physics: {
    'Mechanical Properties of Solids': solids,   // Part-II Ch.1
    'Mechanical Properties of Fluids': fluids,   // Part-II Ch.2
    'Thermal Properties of Matter': thermal,     // Part-II Ch.3
    'Thermodynamics': thermo,                    // Part-II Ch.4 (Chapter-end only)
    'Kinetic Theory': kinetic,                   // Part-II Ch.5
    'Oscillations': pending,                     // Part-II Ch.6 (content pending)
    'Waves': pending,                            // Part-II Ch.7 (content pending)
  },
  Chemistry: {
    'Redox Reactions': redox,                    // Class 11 Chemistry Ch.8
    'Organic Chemistry Some Basic Principles and Techniques': organic, // Chapter-end only for now
    'Hydrocarbons': hydro,                       // Ch.3 — Examples + Chapter-end
  },
  Biology: {
    'The Living World': bioLivingWorld,             // Ch.1 — Chapter-end (10 Q)
    'Biological Classification': bioClassification, // Ch.2 — Chapter-end (12 Q)
    'Plant Kingdom': bioPlantKingdom,               // Ch.3 — Chapter-end (11 Q)
    'Animal Kingdom': bioAnimalKingdom,             // Ch.4 — Chapter-end (15 Q)
    'Morphology of Flowering Plants': bioMorphology, // Ch.5 — Chapter-end (10 Q)
    'Anatomy of Flowering Plants': bioAnatomy,      // Ch.6 — Chapter-end (7 Q)
    'Structural Organisation in Animals': bioStructuralOrg, // Ch.7 — Chapter-end (2 Q)
    'Cell The Unit of Life': bioCell,               // Ch.8 — Chapter-end (14 Q)
    'Biomolecules': bioBiomolecules,                // Ch.9 — Chapter-end (11 Q)
    'Cell Cycle and Cell Division': bioCellCycle,   // Ch.10 — Chapter-end (16 Q)
    'Photosynthesis in Higher Plants': bioPhotosynthesis, // Ch.11 (Revised) — Chapter-end (8 Q)
    'Respiration in Plants': bioRespiration,        // Ch.12 (Revised) — Chapter-end (11 Q)
    'Plant Growth and Development': bioPlantGrowth,  // Ch.13 (Revised) — Chapter-end (9 Q)
    'Breathing and Exchange of Gases': bioBreathing, // Ch.14 (Revised) — Chapter-end (13 Q)
    'Body Fluids and Circulation': bioBodyFluids,   // Ch.15 (Revised) — Chapter-end (14 Q)
    'Excretory Products and their Elimination': bioExcretory, // Ch.16 (Revised) — Chapter-end (10 Q)
    'Locomotion and Movement': bioLocomotion,       // Ch.17 (Revised) — Chapter-end (7 Q)
    'Neural Control and Coordination': bioNeural,   // Ch.18 (Revised) — Chapter-end (7 Q)
    'Chemical Coordination and Integration': bioChemicalCoord, // Ch.19 (Revised) — Chapter-end (7 Q)
  },
  Mathematics: {
    'Sets': sets,                                              // Ch.1 — fully built
    'Relations and Functions': relationsFunctions,            // Ch.2 — Ex 2.1-2.3
    'Trigonometric Functions': trigonometricFunctions,        // Ch.3 — Ex 3.1-3.3
    'Complex Numbers and Quadratic Equations': complexNumbers, // Ch.4 — Ex 4.1 + 5.1 rows
    'Linear Inequalities': linearInequalities,                 // Ch.5 — Examples, Ex 5.1 (partial), Misc
    'Permutations and Combinations': permutationsCombinations, // Ch.6 — Ex 6.1-6.4 + Misc; Examples partial
    'Binomial Theorem': binomialTheorem,                       // Ch.7 — Examples, Ex 7.1, Misc
    'Sequences and Series': sequencesSeries,                   // Ch.8 — Examples, Ex 8.1-8.2, Misc
    'Straight Lines': straightLines,                           // Ch.9 — Examples, Ex 9.1-9.3, Misc
    'Conic Sections': conicSections,                           // Ch.10 — Examples, Ex 10.1-10.4, Misc
    'Introduction to Three Dimensional Geometry': introTo3DGeometry, // Ch.11 — Examples, Ex 11.1-11.2, Misc
    'Limits and Derivatives': limitsDerivatives,               // Ch.12 — Examples, Ex 12.1-12.2, Misc (all p.1 of 2)
    'Statistics': statistics,                                  // Ch.13 — Ex 13.1-13.2, Misc (Examples pending)
    'Probability': probability,                                // Ch.14 — Examples, Ex 14.1-14.2, Misc
  },
};

/**
 * Lists the chapter names (in registry order) that have Part-II content for a
 * subject. Use this to filter the chapter list shown in the Part-II section.
 */
export function getNcert2Chapters(subjectName) {
  return Object.keys(CONTENT[subjectName] || {});
}

/** True if a chapter has any Part-II content. */
export function hasNcert2Content(subjectName, chapterName) {
  return Boolean((CONTENT[subjectName] || {})[chapterName]);
}

/**
 * Returns the sections for a given (subject, chapter).
 * - If the chapter defines an explicit `sections` array (e.g. Maths:
 *   Examples, Exercise 1.1, ... Miscellaneous Exercise), that list is returned
 *   as-is. This replaces the Examples/Chapter-end model for those chapters.
 * - Otherwise defaults to ["Examples", "Chapter-end"]; hideExamples (or the
 *   Biology subject, which is Chapter-end only) drops Examples.
 * - `html` is null when no content has been added yet for that section.
 */
export function getNcert2Sections(subjectName, chapterName) {
  const chap = (CONTENT[subjectName] || {})[chapterName] || {};

  // Template model: an explicit, ordered list of exercise sections.
  if (Array.isArray(chap.sections)) {
    return chap.sections.map((s, i) => ({
      key: s.key || `sec${i}`,
      label: s.label,
      html: s.html || null,
    }));
  }

  // Default model: Examples + Chapter-end.
  // Biology chapters are Chapter-end only (no Examples).
  const dropExamples = chap.hideExamples || subjectName === 'Biology';
  const sections = [];
  if (!dropExamples) {
    sections.push({ key: 'examples', label: 'Examples', html: chap.examples || null });
  }
  sections.push({ key: 'chapterEnd', label: 'Chapter-end', html: chap.chapterEnd || null });
  return sections;
}

export default getNcert2Sections;