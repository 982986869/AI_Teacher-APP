// Dynamic per-class subject lists (Class 9), fetched from the DB via
// /api/resources/class-subjects — no hardcoded subject arrays. Each screen filters
// the list by the feature it needs (importantQuestions / practice / online / mock /
// parts) and uses subjectDisplay() for the tile emoji + colour (the DB has none).

import { useState, useEffect } from 'react';
import { getClassSubjects } from '../api/resourcesApi';

// Display-only: subject name → { emoji, bg }. Curated for known subjects; unknowns
// get a stable colour derived from the name + a neutral book icon.
const DISPLAY = {
  // Class 9 OLD subjects
  'Old - Maths':      { emoji: '➗', bg: '#0F6E56' },
  'Old - Science':    { emoji: '⚗️', bg: '#5AA84F' },
  'Old - Social Sc':  { emoji: '🏛️', bg: '#8A5A2B' },
  'Old - Eng Lang':   { emoji: '📖', bg: '#7A6FD0' },
  'Old - Eng Comm':   { emoji: '📝', bg: '#26215C' },
  'Old - हिंदी ए':     { emoji: '📚', bg: '#2F80ED' },
  'Old - हिंदी ब':     { emoji: '📚', bg: '#B0306B' },
  // Class 6 OLD subjects (single English / हिंदी, unlike Class 9's split)
  'Old - English':    { emoji: '📖', bg: '#7A6FD0' },
  'Old - हिंदी':       { emoji: '📚', bg: '#2F80ED' },
  // Class 9 new-syllabus (mirror the team's curated colours)
  'Maths (Ganita Manjari)':                 { emoji: '📐', bg: '#E8703A' },
  'Science (Exploration)':                  { emoji: '🔬', bg: '#5AA84F' },
  'Social Science (Understanding Society)': { emoji: '🌐', bg: '#2F80ED' },
  'हिंदी (गंगा)':                           { emoji: '📚', bg: '#D9822B' },
  'English (Kaveri)':                       { emoji: '📖', bg: '#7A6FD0' },
};

const PALETTE = ['#0F8A5F', '#B0306B', '#D9822B', '#26215C', '#0C8F88', '#5AA84F', '#8A5A2B', '#2F80ED', '#7A6FD0', '#E8703A'];
export const subjectDisplay = (name) => {
  if (DISPLAY[name]) return DISPLAY[name];
  let h = 5381;
  const str = String(name || '');
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return { emoji: '📘', bg: PALETTE[h % PALETTE.length] };
};

// Fetch the DB-derived subject list for a class. Returns null while loading, then
// an array of { name, slug, parts, importantQuestions, pyq, practice, online, mock }.
export const useClassSubjects = (classLevel, enabled = true) => {
  const [subjects, setSubjects] = useState(null);
  useEffect(() => {
    if (!enabled || !classLevel) { setSubjects([]); return undefined; }
    let alive = true;
    setSubjects(null);
    getClassSubjects(classLevel)
      .then((list) => { if (alive) setSubjects(Array.isArray(list) ? list : []); })
      .catch(() => { if (alive) setSubjects([]); });
    return () => { alive = false; };
  }, [classLevel, enabled]);
  return subjects;
};

// Map a DB subject row → a tile object { name, slug, emoji, bg, chapters, ...extra }.
// `chapters: []` default: some screens read subject.chapters (ChapterList is API-driven,
// but the fallback expects an array), so never leave it undefined.
export const toTile = (s, extra = {}) => ({ name: s.name, slug: s.slug, chapters: [], ...subjectDisplay(s.name), ...extra });
