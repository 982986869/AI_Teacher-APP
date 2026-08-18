// src/theme/aiTeacherTheme.js
// Tokens for the AI Teacher home, lifted from its Figma panels.
//
// A separate palette from dayTheme rather than an extension of it, because the two
// designs disagree on their basics: this page sets everything in Inter where the Student
// Home is Plus Jakarta Sans, and its greys are #111111 / #555555 / #777777 against the
// Home's #1C1C1E / #6B7280. Folding those into one palette would mean one screen quietly
// re-skinning the other every time a value moved.

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
  onlineEdge: '#0B0F19',                 // its 2px cut-out border — near-black, so the
                                         // dot reads as punched out of the page

  // search
  sparkleChip: '#FFF0B3',                // the pale yellow square at the end of the field

  // action cards. Figma lists both on the row: a mint fill and a #FFBA07 gradient whose
  // stops are identical, i.e. a flat yellow. One card each.
  cardMint: '#8FF0C0',
  cardAmber: '#FFBA07',
  cardIconBg: 'rgba(255,255,255,0.1098)', // the 36px rounded square behind a card's icon
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
