// src/utils/syllabus.js
// Chapters CBSE has dropped from the current syllabus.
//
// The content source marks these by editing the chapter's NAME — "Sources of
// Energy (Deleted)", "Management of Natural Resources (IA Only) Deleted". It is a
// note typed into the title, not a flag on the record: the chapters are live and
// their questions, tests and answer keys are complete.
//
// We store the name verbatim (every importer in this repo preserves its source
// exactly, which is what makes a re-import comparable), so the cleanup belongs
// here, at the point of display. Two things come out of one parse:
//
//   • the chapter's real name, for the row title;
//   • whether it is off-syllabus, so the UI can say so in its own words.
//
// "Deleted" is the source's shorthand and it reads like an error to a student —
// as if the chapter were broken or removed from the app. What they need to know
// is narrower and more useful: it will not be in the board exam. Hence the badge
// text below rather than passing the raw word through.
//
// Spellings seen across classes 6-10: "(Deleted)", "(deleted)", "(Delete)", and a
// bare trailing "Deleted" after another parenthetical. Matched case-insensitively
// at the end of the name only — a chapter legitimately *about* deletion (SQL
// DELETE, say) keeps its title.

const MARKER = /[\s ]*\(?\s*delete[d]?\s*\)?[\s ]*$/i;

// True when the chapter name carries the off-syllabus marker.
export const isOffSyllabus = (name) => MARKER.test(String(name || '').trim());

// The chapter's name without the marker. "Constructions (Deleted)" → "Constructions";
// "Management of Natural Resources (IA Only) Deleted" → "Management of Natural
// Resources (IA Only)" — the other parenthetical is the source's own labelling and
// is left alone.
export const chapterTitle = (name) => {
  const s = String(name == null ? '' : name).trim();
  if (!MARKER.test(s)) return s;
  const out = s.replace(MARKER, '').trim();
  // Never return an empty title: a chapter named only "(Deleted)" would otherwise
  // render as a blank row, which is worse than showing the raw name.
  return out || s;
};

// What the badge says. Short enough for a chip beside the chapter name.
export const OFF_SYLLABUS_LABEL = 'Not in current syllabus';

// Both at once, for a render path that needs the title and the flag together.
export const readChapterName = (name) => ({
  title: chapterTitle(name),
  offSyllabus: isOffSyllabus(name),
});

export default { isOffSyllabus, chapterTitle, readChapterName, OFF_SYLLABUS_LABEL };
