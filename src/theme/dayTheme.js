// src/theme/dayTheme.js
// The light "day" palette for the Student Home.
//
// It carries EVERY key `N` (src/theme/nightTheme.js) carries, with the same meanings,
// so a screen can move between the two by swapping one import. That mirroring is the
// point: nightTheme is shared with the AI-Teacher crafting screen and SessionsScreen,
// so lightening those tokens in place would have re-skinned two screens nobody asked
// about. A parallel palette keeps the blast radius at one import line.
//
// Values below marked "Figma" are lifted verbatim from the design's property panels —
// do not "improve" them. The rest are derived: they fill in the keys the night palette
// had that the design never speaks to.

export const DAY = {
  // surfaces
  bg: '#FFFFFF',                        // page base
  bgTop: '#FFFFFF',                     // page gradient, top
  bgBot: '#F8F8FB',                     // page gradient, bottom — barely there, but it
                                        // stops the page reading as a flat sheet of paper
  glow: '#EFEBFF',                      // faint violet wash (unused since the blooms went)
  glowBlue: '#EAF0FF',
  card: '#FFFFFF',                      // Figma — every card
  cardSoft: '#F3F4F6',                  // inert fill (skeletons, ghost buttons, empty days)
  cardEdge: '#E5E5EA',                  // Figma — every card border, 1px
  track: '#ECECF3',                     // progress trough

  // type — Figma. #1C1C1E for headings, #6B7280 for every subtitle. inkDim is derived:
  // the design has no third grey, but the pending weekday letters need to sit back from
  // the subtitles or the whole week reads as equally important.
  ink: '#1C1C1E',
  inkSoft: '#6B7280',
  inkDim: '#9CA3AF',

  // brand violet — Figma (#7C3AED: "NEXT UP", the footer banner's text and border)
  violet: '#7C3AED',
  violetLo: '#6D28D9',
  violetSoft: 'rgba(124,58,237,0.10)',
  dot: '#7C3AED',

  // hero — the "current lesson" card. Figma calls it a linear gradient but gives both
  // stops as #FFBA07, so it is a flat fill wearing a gradient's clothes; the two tokens
  // are kept because the LinearGradient that paints it wants two.
  //
  // The panel also lists a second fill, #000000 at 20%. It is NOT applied here: over
  // #FFBA07 that lands around #CC9506, a brown-gold clearly darker than the hero in the
  // design's own screenshot. Either it sits under the gradient (where it does nothing)
  // or the export is reporting a layer that is switched off. Applying it would move the
  // card away from the picture it came from.
  heroA: '#FFBA07',
  heroB: '#FFBA07',

  // orb + progress fill (crafting screen — mirrored for completeness, unused by Home)
  orbA: '#C9BEF5',
  orbB: '#B4A6EE',
  fillA: '#7C6BD4',
  fillB: '#9B8AEC',

  // semantic accents. amber is Figma (#D97706: "SHARPEN THINKING" and the BRAIN chip
  // label). The others are derived — each darkened from the night value until it holds
  // as small bold text on white, where the originals sat at roughly 2:1.
  green: '#12A06A',
  greenSoft: 'rgba(18,160,106,0.12)',
  amber: '#D97706',
  amberSoft: '#FEF3C7',
  blue: '#2F63E8',
  blueSoft: 'rgba(47,99,232,0.12)',
  red: '#DC2F35',
  redSoft: 'rgba(220,47,53,0.12)',

  pendingEdge: '#E5E5EA',

  // ── card elevation ───────────────────────────────────────────────────────────
  // Figma: X0 Y2, blur 8, spread 0, #000000 at 6.27%. Identical on every card, so it
  // lives here rather than being retyped per style.
  shadow: '#000000',
  shadowOpacity: 0.0627,

  // ── the hero inverts ─────────────────────────────────────────────────────────
  // Everything below replaces a hardcoded '#fff' that was right on violet and is
  // invisible on yellow. Figma sets every text node on this card to pure #000000 —
  // including the "Chemistry · 7 hrs left" line, which is why onHeroSoft is not soft:
  // it separates from the title by weight and size, not by opacity.
  onHero: '#000000',                    // title, % number, badge label
  onHeroSoft: '#000000',                // "Chemistry · 7 hrs left"
  heroChip: 'rgba(255,255,255,0.1255)', // Figma — badge fill, #FFFFFF at 12.55%
  heroEdge: 'rgba(255,255,255,0.0784)', // Figma — 1px card border, #FFFFFF at 7.84%
  heroTrack: 'rgba(0,0,0,0.16)',        // ring trough (not specified; derived)
  heroBtnBg: '#000000',                 // Figma — Resume-CTA fill
  heroBtnFg: '#FFFFFF',                 // Figma — its label
  // Figma — X0 Y8, blur 24, #8B5CF6 at 20%. A VIOLET shadow under a yellow card, which
  // is the design's choice and reads as a coloured glow rather than dirt.
  heroShadow: '#8B5CF6',

  // Primary call-to-action ("Ask a doubt"), following the hero's yellow.
  ctaBg: '#FFCB3D',
  ctaFg: '#141118',
  ghostBg: '#F3F4F6',                   // secondary button ("Ask a question")

  // Next-up card — Figma. The sparkles outline is a pale yellow, and the play triangle
  // is pure black rather than the card's near-black #1C1C1E.
  sparkle: '#FCE38E',
  playBg: '#FFCB3D',
  playFg: '#000000',

  // BRAIN chip — Figma. Note it is a 4px-radius rectangle, not the 50px pill the other
  // chips use, and its label is Inter, not the page's Plus Jakarta Sans.
  chipBrainBg: '#FEF3C7',
  chipBrainEdge: '#FCD34D',
  chipBrainFg: '#D97706',

  // Weekly goal — Figma. "01 hrs" is pure black; only the "of 03 hrs" half greys out.
  goalValue: '#000000',

  // Weekday chips — Figma gives the first three (#93E4FE, #FEC0FC, #FBDD85) and shows
  // the rest inert, so the remaining four continue the same pastel family. The colour
  // is positional, not semantic: it says WHICH day, and the glyph inside says whether
  // it was done.
  dayTints: ['#93E4FE', '#FEC0FC', '#FBDD85', '#B6E8C9', '#FFC9B0', '#C7C9FE', '#FBC7DE'],
  dayGlyph: '#000000',                  // Figma — the check vector, 2px, pure black
  dayIdleBg: '#F3F4F6',

  // Footer banner ("1:1 TUTORING IS COMING SOON") — Figma, dashed 4/4.
  bannerBg: '#F5F3FF',
  bannerEdge: '#7C3AED',
  bannerFg: '#7C3AED',

  divider: '#F0F0F5',                   // list hairline inside a card

  // Bottom navigation bar — a BLACK bar, the one surface on this page that is not light.
  // The "Bottom Navigation Bar" panel reports #FFFFFF under Colors and #000000 under a
  // top border, which reads as a white bar; the rendered design is the opposite, and the
  // ":shadow" node is where the #000000 fill actually shows up. The render wins.
  //
  // There is no top border token: the base panel's 1px #000000 would be a black hairline
  // on a black bar, which draws nothing.
  dockBg: '#000000',
  dockFg: '#FFFFFF',                    // active tab — icon and label
  dockIdle: '#9CA3AF',                  // inactive. Not specified; #6B7280 (the page's
                                        // subtitle grey) goes muddy against black, so
                                        // this is one step lighter.
  dockShadow: '#000000',
};

// Plus Jakarta Sans — Figma names it for every text node on the page except the BRAIN
// chip, which is Inter. Weight 800 is real here (the "01 hrs" figure) rather than an
// alias for bold, so `xbold` and `black` no longer collapse onto 700.
export const DFONT = {
  reg: 'PlusJakartaSans_400Regular',
  med: 'PlusJakartaSans_500Medium',
  semi: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  xbold: 'PlusJakartaSans_800ExtraBold',
};

export default DAY;
