// src/theme/aiTeacherTheme.js
// Tokens for the AI Teacher home, lifted from its Figma panels.
//
// A separate palette from dayTheme rather than an extension of it, because the two
// designs disagree on their basics: this page sets everything in Inter where the Student
// Home is Plus Jakarta Sans, and its greys are #111111 / #555555 / #777777 against the
// Home's #1C1C1E / #6B7280. Folding those into one palette would mean one screen quietly
// re-skinning the other every time a value moved.
//
// ── PROVENANCE ───────────────────────────────────────────────────────────────
// The block down to `cardIconBg` came off the Figma inspect panels and is exact.
// Everything BELOW the "read off the mockup" divider was derived from the design
// SCREENSHOTS, not from Figma — the file (node 609-8765) needs a login this workspace
// does not have, so those hexes are eyeballed to within a shade or two. They are marked
// TODO(figma) individually. When a read-only Figma token is available, re-inspect the
// frame and correct them in place; nothing outside this file hardcodes a colour.

export const AIT = {
  // surfaces
  bg: '#FFFFFF',
  field: '#F8F8F6',                     // search bar fill, and the glow wrap behind it
  edge: '#EAEAEA',                      // 1px borders — settings button, search, cards

  // type
  ink: '#111111',                        // titles, icons
  inkSoft: '#555555',                    // subtitles, card descriptions
  inkMuted: '#777777',                   // search placeholder

  // avatar
  avatarRing: '#6366F1',                 // 2px indigo ring around the photo
  online: '#10B981',                     // presence dot
  // The dot's 2px cut-out border. Figma set this near-black to punch the dot out of a
  // dark page; the shipped page is white and the mockup draws a WHITE ring, so it
  // follows the surface it actually sits on.
  onlineEdge: '#FFFFFF',

  // search
  sparkleChip: '#FFF0B3',                // the pale yellow square at the end of the field

  // action cards. Figma lists both on the row: a mint fill and a #FFBA07 gradient whose
  // stops are identical, i.e. a flat yellow. The mockup resolves which is which —
  // amber carries "Learn a Topic", and the second card is the near-black one below.
  // cardMint is kept because the panel names it, though the shipped row no longer uses it.
  cardMint: '#8FF0C0',
  cardAmber: '#FFBA07',
  cardIconBg: 'rgba(255,255,255,0.1098)', // the 36px rounded square behind a card's icon

  // ── read off the mockup — TODO(figma): verify every value below ─────────────

  // the second action card: near-black fill, light type
  cardInk: '#101010',                    // TODO(figma)
  inkInv: '#FFFFFF',
  inkInvSoft: 'rgba(255,255,255,0.62)',  // its description line
  // A description on the amber card cannot use inkSoft — #555 on #FFBA07 reads muddy.
  // This is the ink knocked back into the fill instead.
  onAmberSoft: 'rgba(17,17,17,0.60)',    // TODO(figma)

  // amber accent for eyebrows, links and the "current lesson" marker. Distinct from
  // cardAmber: the fill is a flat yellow, this is the deeper orange the type sits in.
  accent: '#F59E0B',                     // TODO(figma)

  // cards — the white panels behind instructors, subjects, jump-back-in, personalized
  surface: '#FFFFFF',
  surfaceEdge: '#EDEDED',                // TODO(figma) — a hair lighter than `edge`
  divider: '#F0F0F0',

  // teaching-style chips: one filled, the rest outlined
  chipOnBg: '#111111',
  chipOnInk: '#FFFFFF',
  chipOffBg: '#FFFFFF',
  chipOffInk: '#555555',
  chipEdge: '#E4E4E4',                   // TODO(figma)

  // "PHYSICS" pill on the jump-back-in card
  tagBg: '#F4F4F2',                      // TODO(figma)

  // progress track behind the 68% ring
  track: '#F0EEE8',                      // TODO(figma)

  // ── states the design never drew ───────────────────────────────────────────
  // The mockup is a resting screen: no failed generation, no empty library, no
  // loading. Those states exist in the feature regardless, so they get tokens here
  // rather than inline hexes in whichever section happened to need one first.
  danger: '#D93A3F',
  dangerBg: '#FDECEC',
  skeleton: '#F3F3F1',
};

// Pastel tint + glyph colour pairs. Subjects and the personalized rows draw the same
// shape — a rounded tile with a coloured glyph — so they share one scale rather than
// each inventing its own. TODO(figma): sampled from the mockup, not inspected.
export const AIT_TINTS = {
  blue:   { bg: '#DDEAFE', fg: '#3B82F6' },
  violet: { bg: '#EAE5FE', fg: '#8B5CF6' },
  green:  { bg: '#D6F5E3', fg: '#10B981' },
  pink:   { bg: '#FCE1EC', fg: '#EC4899' },
  peach:  { bg: '#FFE3D2', fg: '#F97316' },
};

// Inter, every weight the page asks for. The Student Home's Plus Jakarta Sans does not
// appear on this screen at all.
export const AFONT = {
  reg: 'Inter_400Regular',
  med: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  xbold: 'Inter_800ExtraBold',
};

export default AIT;
