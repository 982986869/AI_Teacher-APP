// src/theme/nightTheme.js
// The shared palette for Home, the auth flow, Sessions, AI Teacher, the chapter
// screens and the dock. One source of truth so those surfaces read as one product.
//
// ⚠ THIS IS NOW THE CUEMATH-INSPIRED LIGHT SYSTEM — yellow accent, black type,
// white cards. It began as the dark "night" palette, which is why the file and
// several KEYS are misnamed. Every key is preserved so the ~15 screens importing
// `N` keep working; only the values moved. Two names now lie about their value:
//
//   N.violet   is the PRIMARY ACCENT, now yellow (#FFC629). Every highlight, ring
//              and active state reads it. Renaming it to `primary` means touching
//              every call site — a mechanical pass worth doing, separately.
//   N.glow / N.glowBlue are the page washes. On a white page a "glow" is a barely
//              perceptible tint, not a light source, so both are near-white.
//
// The design system, verbatim:
//   Primary #FFC629 · Primary/Dark #111111 · Background #FFFFFF
//   Secondary background #F5F5F5 · Text #666666 · Accent #FFF4CC
//   Buttons dark with rounded corners · Cards white, 16px radius, subtle shadow
//   Minimal, friendly, educational — large type, generous spacing, yellow highlights
//
// ⚠ YELLOW IS A SURFACE COLOUR, NOT A TEXT COLOUR. #FFC629 on white is 1.7:1 and
// fails every contrast bar. Use it as a FILL with `ink` on top; for accent-coloured
// TEXT or icons use `dot` (#8A6A00), which is the same hue darkened until it passes.
//
// ⚠ BUTTONS ARE DARK, NOT YELLOW. Use `btn` / `btnInk` for primary CTAs. Yellow is
// for highlights, chips, rings and hero fills — the system pairs the two rather
// than using the accent for everything.

export const N = {
  // ── surfaces ──
  bg: '#FFFFFF',                        // page base
  bgTop: '#FFFFFF',                     // page gradient, top — flat by design
  bgBot: '#FFFFFF',                     // page gradient, bottom
  glow: '#FFF4CC',                      // soft-yellow wash (the accent, as a tint)
  glowBlue: '#F5F5F5',                  // second wash — neutral, not blue
  card: '#FFFFFF',                      // white card; elevation comes from `shadow`
  cardSoft: '#F5F5F5',                  // secondary background / inset fill
  cardEdge: 'rgba(17,17,17,0.08)',      // hairline border
  track: 'rgba(17,17,17,0.10)',         // progress trough / inert fill

  // ── type ──
  ink: '#111111',                       // headings, primary text, active state
  inkSoft: '#666666',                   // body, secondary
  inkDim: '#9B9B9B',                    // pending, disabled, meta

  // ── primary accent — key kept as `violet`, see the note above ──
  violet: '#FFC629',                    // fills, rings, highlights
  violetLo: '#E8B01F',                  // pressed / darker fill
  violetSoft: '#FFF4CC',                // accent tint (chips, soft backgrounds)
  dot: '#8A6A00',                       // accent as TEXT/ICON — passes on white

  // ── primary button — dark, per the system ──
  btn: '#111111',
  btnInk: '#FFFFFF',
  btnSoft: '#2A2A2A',                   // pressed

  // ── hero fill (the "current lesson" card) — yellow, with ink on top ──
  heroA: '#FFD75E',
  heroB: '#FFC629',

  // orb + progress fill
  orbA: '#FFF4CC',
  orbB: '#FFE38F',
  fillA: '#FFC629',
  fillB: '#FFD75E',

  // ── semantic accents, darkened to hold contrast against white ──
  green: '#0E9F6E',
  greenSoft: '#E6F6F0',
  amber: '#8A6A00',
  amberSoft: '#FFF4CC',
  blue: '#2563EB',
  blueSoft: '#E8EEFD',
  red: '#D92D20',
  redSoft: '#FDECEA',

  pendingEdge: 'rgba(17,17,17,0.18)',

  // Cards: white, 16px radius, SUBTLE shadow — spread it, don't deepen it.
  radius: 16,
};

// Cards and sheets share one elevation so nothing invents its own.
export const NSHADOW = {
  shadowColor: '#111111',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const NFONT = {
  reg: 'SpaceGrotesk_400Regular',
  med: 'SpaceGrotesk_500Medium',
  semi: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
};

export default N;
