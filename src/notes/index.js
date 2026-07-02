// src/notes/index.js
// Central registry — maps subject name → notes file
// To add a new subject: import its notes file and add to NOTES_MAP

import PhysicsNotes     from './PhysicsNotes';
import Physics12Notes   from './Physics12Notes';
import ChemistryNotes   from './ChemistryNotes';
import MathsNotes       from './MathsNotes';
import BiologyNotes     from './BiologyNotes';
import EnglishNotes     from './EnglishNotes';

const NOTES_MAP = {
  // Class 11 + Class 12 notes share one map per subject; chapter names are unique
  // across classes, so they merge without collision.
  'Physics':     { ...PhysicsNotes, ...Physics12Notes },
  'Chemistry':   { ...ChemistryNotes }, // Class 12 Chemistry notes are DB-backed
  'Mathematics': MathsNotes,
  'Biology':     BiologyNotes,
  // Class 6 English — the Subjects picker names this book "English (Poorvi)", and
  // notes are looked up by the raw subject name, so register under that exact key.
  'English (Poorvi)': EnglishNotes,
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