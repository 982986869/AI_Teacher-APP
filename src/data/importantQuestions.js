// importantQuestions.js
// Data source for the "Important Questions" section on the Practice tab.
// Mirrors the PYQ shape: { Subject: { 'Chapter Name': cardHtmlFragment } }.
//
//   - Physics     -> physicsImportant.js   (700 Qs / 14 chapters)
//   - Chemistry   -> chemistryImportant.js (599 Qs / 12 chapters)
//   - Mathematics -> mathsImportant.js     (750 Qs / 15 chapters)
//   - Biology     -> biologyImportant.js   (986 Qs / 20 chapters)
//
// Subject names and chapter strings must match PracticeScreen's PYQ_SUBJECTS
// exactly. getImportantHtml returns null when a chapter has no content yet, so
// the app shows the "coming soon" empty state automatically.

import PHYSICS_IMPORTANT from './physicsImportant';
import CHEMISTRY_IMPORTANT from './chemistryImportant';
import MATHS_IMPORTANT from './mathsImportant';
import BIOLOGY_IMPORTANT from './biologyImportant';

const IMPORTANT_QUESTIONS = {
  Physics: PHYSICS_IMPORTANT,
  Chemistry: CHEMISTRY_IMPORTANT,
  Mathematics: MATHS_IMPORTANT,
  Biology: BIOLOGY_IMPORTANT,
};

// Returns the important-questions HTML for a subject + chapter, or null.
export function getImportantHtml(subject, chapter) {
  const map = IMPORTANT_QUESTIONS[subject];
  if (map && map[chapter]) return map[chapter];
  return null;
}

// Chapters that currently have content for a subject (handy for badges).
export function getImportantChapters(subject) {
  const map = IMPORTANT_QUESTIONS[subject];
  return map ? Object.keys(map) : [];
}

export default IMPORTANT_QUESTIONS;