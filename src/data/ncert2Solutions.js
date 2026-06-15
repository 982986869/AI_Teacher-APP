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

// Mapping is by file CONTENT (worked examples -> Examples, exercises -> Chapter-end).
const solids  = { examples: SOLIDS_EX,  chapterEnd: SOLIDS_CE  };
const fluids  = { examples: FLUIDS_EX,  chapterEnd: FLUIDS_CE  };
const thermal = { examples: THERMAL_EX, chapterEnd: THERMAL_CE };
const thermo  = { chapterEnd: THERMO_CE, hideExamples: true }; // Chapter-end only (no Examples)

// Map: subject -> chapter -> config.
// Keys are the EXACT chapter titles from your ResourcesScreen SUBJECTS list.
const CONTENT = {
  Physics: {
    'Mechanical Properties of Solids': solids,   // Part-II Ch.1
    'Mechanical Properties of Fluids': fluids,   // Part-II Ch.2
    'Thermal Properties of Matter': thermal,     // Part-II Ch.3
    'Thermodynamics': thermo,                    // Part-II Ch.4 (Chapter-end only)
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
 * - Defaults to ["Examples", "Chapter-end"].
 * - If the chapter sets hideExamples, only "Chapter-end" is returned.
 * - `html` is null when no content has been added yet for that section.
 */
export function getNcert2Sections(subjectName, chapterName) {
  const chap = (CONTENT[subjectName] || {})[chapterName] || {};
  const sections = [];
  if (!chap.hideExamples) {
    sections.push({ key: 'examples', label: 'Examples', html: chap.examples || null });
  }
  sections.push({ key: 'chapterEnd', label: 'Chapter-end', html: chap.chapterEnd || null });
  return sections;
}

export default getNcert2Sections;