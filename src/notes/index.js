// src/notes/index.js
// Central registry — maps subject name → notes file
// To add a new subject: import its notes file and add to NOTES_MAP

import PhysicsNotes   from './PhysicsNotes';
import Physics12Notes from './Physics12Notes';
import ChemistryNotes from './ChemistryNotes';
import MathsNotes     from './MathsNotes';
import BiologyNotes   from './BiologyNotes';

const NOTES_MAP = {
  // Class 11 + Class 12 Physics notes share one map; chapter names are unique
  // across classes, so they merge without collision.
  'Physics':     { ...PhysicsNotes, ...Physics12Notes },
  'Chemistry':   ChemistryNotes,
  'Mathematics': MathsNotes,
  'Biology':     BiologyNotes,
};

/**
 * Get notes for a specific chapter of a subject.
 * @param {string} subjectName  e.g. 'Physics'
 * @param {string} chapterName  e.g. 'Units and Measurements'
 * @returns {object|null} notes object or null if not found
 */
export const getChapterNotes = (subjectName, chapterName) => {
  const subjectNotes = NOTES_MAP[subjectName];
  if (!subjectNotes) return null;
  return subjectNotes[chapterName] || null;
};

export default NOTES_MAP;