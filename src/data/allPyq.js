// allPyq.js
// Single entry point for Previous Year Questions across ALL subjects.
//
//   • Physics   -> pyqContent.js   (your existing file, untouched)
//   • Maths     -> mathsPyq.js     (default export map)
//   • Chemistry -> chemistryPyq.js (default export map)
//   • Biology   -> biologyPyq.js   (default export map)
//
// PracticeScreen imports getPyqHtml from THIS file. Put all four data files in
// the same folder (src/data/).

import { getPyqHtml as getPhysicsPyqHtml } from './pyqContent';
import MATHS_PYQ from './mathsPyq';
import CHEMISTRY_PYQ from './chemistryPyq';
import BIOLOGY_PYQ from './biologyPyq';

// Subjects whose content lives in their own per-subject file.
const SUBJECT_PYQ = {
  Mathematics: MATHS_PYQ,
  Chemistry: CHEMISTRY_PYQ,
  Biology: BIOLOGY_PYQ,
};

// Returns the question-card HTML for a subject + chapter, or null if none.
export function getPyqHtml(subject, chapter) {
  const map = SUBJECT_PYQ[subject];
  if (map && map[chapter]) return map[chapter];
  // Physics (and anything still living in pyqContent.js)
  try {
    if (typeof getPhysicsPyqHtml === 'function') {
      return getPhysicsPyqHtml(subject, chapter) || null;
    }
  } catch (e) { /* pyqContent unavailable - fall through */ }
  return null;
}

// Chapters that actually have content for a subject (handy for badges/filtering).
export function getPyqChapters(subject) {
  const map = SUBJECT_PYQ[subject];
  return map ? Object.keys(map) : [];
}

export default { getPyqHtml, getPyqChapters };