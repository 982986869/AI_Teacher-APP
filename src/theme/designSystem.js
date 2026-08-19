/**
 * AILERNOVA Design System — Visual Foundation
 * ============================================
 * Single source of truth for the dark, purple-accented brand look: Color Palette,
 * Type Scale, Spacing Grid, Border Radius, Elevation and Motion. Screens should
 * import from here instead of hardcoding hexes.
 *
 * NOTE: the legacy light theme lives in `src/constants/colors.js` and still drives
 * every un-migrated screen. This file is the NEW system — opt-in per screen so the
 * migration can happen one screen at a time (Splash + Landing are on it already).
 */

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------
// `card` and `border` are deliberately WHITE WITH ALPHA, not opaque greys — they
// tint whatever sits beneath them, which is what keeps stacked surfaces reading as
// one material. Don't "simplify" them to solid hexes.
export const COLORS = {
  // ⚠ CUEMATH-INSPIRED LIGHT SYSTEM. This was the dark purple palette; every KEY is
  // preserved so the screens reading it keep working, but the values are now the
  // light system. Names that no longer describe their value:
  //   primary   is the YELLOW accent (#FFC629), not a purple.
  //   glow      is the soft-yellow tint — on a white page a glow is a wash.
  //   surface   is the secondary background (#F5F5F5), not a raised dark panel.
  //
  // ⚠ YELLOW IS A FILL, NOT A TEXT COLOUR: #FFC629 on white is 1.7:1. Put ink on
  // top of it; for accent-coloured TEXT or icons use COLORS.accent (#8A6A00) —
  // the same hue darkened until it passes.
  // ⚠ PRIMARY CTA IS YELLOW with an INK label (see GRADIENTS.primary) — that is
  // what every mockup shows. COLORS.ink/onInk remain for dark secondary buttons.

  // Brand
  primary:       '#FFC629',   // yellow — fills, highlights, rings
  primaryLight:  '#FFD75E',   // lighter yellow
  accent:        '#8A6A00',   // yellow as TEXT/ICON — passes on white

  // Primary button (dark, per the system)
  ink:           '#111111',
  onInk:         '#FFFFFF',

  // Feedback — darkened to hold contrast against white
  success:       '#0E9F6E',
  error:         '#D92D20',
  warning:       '#B54708',

  // Surfaces
  background:    '#FFFFFF',   // page
  surface:       '#F5F5F5',   // secondary background
  card:          '#FFFFFF',   // white card; elevation via ELEVATION, not fill
  border:        'rgba(17,17,17,0.08)',
  glow:          '#FFF4CC',   // soft-yellow wash

  // Text
  textPrimary:   '#111111',
  textSecondary: '#666666',
  textMuted:     '#9B9B9B',
};

/**
 * Light theme surfaces + text, per the board. The legacy light screens still run
 * on src/constants/colors.js; these are here so a NEW light screen has one place
 * to read from instead of inventing greys.
 */
export const LIGHT = {
  background:    '#F8F8FF',
  card:          '#FFFFFF',
  textPrimary:   '#161B26',
  textSecondary: '#71717A',
};

/** Purple-on-dark gradients. Feed straight into <LinearGradient colors={...} />. */
export const GRADIENTS = {
  // Primary CTA fill (left → right). Three stops, inspected off the shared
  // primary-button node — a two-stop approximation loses the dark right end.
  // Now that the board's Primary IS #6D4AFF, the first stop lifts to the board's
  // Secondary so the ramp still travels light → dark instead of flattening.
  primary:  [COLORS.primaryLight, COLORS.primary, COLORS.primary],   // yellow CTA, ink label
  // Progress fills.
  progress: [COLORS.primary, COLORS.primaryLight],  // yellow — a fill, so it stays
  // Deep violet wash behind the splash (both stops opaque).
  splash:   ['#FFFFFF', '#FFFDF5'],   // white, with the faintest yellow settle
  // Full-bleed scrim that drops a photo/hero into the background so text stays
  // legible. Inspected from Figma: two stops, transparent #0E0B3C → solid #030124,
  // spanning the whole 390×844 frame. Note the deep navy is intentionally darker
  // than COLORS.background — don't "correct" it to the background token.
  scrim:    ['#FFFFFF00', '#FFFFFF'],   // scrim now lifts INTO white, not into navy
};

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
// TWO families, both confirmed by inspecting Figma nodes: headings are Poppins,
// everything else is Manrope. Don't collapse them into one — the welcome heading
// inspects as Poppins 700 while the body right beneath it is Manrope 400.
export const FONT_FAMILY = {
  display:   'Poppins_700Bold',      // headings only
  extrabold: 'Manrope_800ExtraBold',
  bold:      'Manrope_700Bold',
  semibold:  'Manrope_600SemiBold',
  medium:    'Manrope_500Medium',
  regular:   'Manrope_400Regular',

  // The board's second sanctioned pair — "Heading: Poppins Bold OR Sora Bold,
  // Body: Inter OR Manrope". Both faces are loaded in App.js. Pick ONE pair per
  // screen and stay on it; mixing Sora headings with Manrope body (or Poppins
  // with Inter) reads as two different products on the same page.
  soraBold:     'Sora_700Bold',
  soraSemibold: 'Sora_600SemiBold',
  interBold:     'Inter_700Bold',
  interSemibold: 'Inter_600SemiBold',
  interMedium:   'Inter_500Medium',
  interRegular:  'Inter_400Regular',
};

/**
 * The board's SIZE ladder — H1 40 / H2 32 / H3 24 / Title 20 / Body 16 / Caption 14.
 * Sizes only: family, colour and leading come from TYPE below (or from the screen's
 * own inspected values). The existing TYPE steps are NOT snapped to this ladder —
 * they're inspected per Figma frame (Splash's heading really is 28px), and resizing
 * them to match a general recommendation would break screens that already ship.
 */
export const TYPE_SCALE = {
  h1: 40, h2: 32, h3: 24, title: 20, body: 16, caption: 14,
};

/**
 * The seven named steps from the Type Scale board. Spread these into `style`.
 * Line heights are the board's percentages resolved to points (RN wants points).
 * `body` is inspected 1:1 from Figma — 16 / 150% / 0 tracking.
 */
export const TYPE = {
  // Inspected: Poppins 700, 28px, 0 tracking, pure #FFFFFF (not textPrimary).
  // Its Figma node reads "line height 100%", but the same node is 84px tall over
  // two lines and the exported design renders 42px baseline-to-baseline — so the
  // node's label is stale and 150% is the real value, matching every other step.
  display: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 28,
    lineHeight: 42,          // 150%
    letterSpacing: 0,
    color: COLORS.textPrimary,
  },
  // Inspected on the onboarding page: 26px Poppins 700 on a single line measures
  // exactly 39px tall — 1.5em, Poppins' own default leading. That is what "line
  // height 100%" in the Figma panel actually resolves to, and it confirms the
  // display step above uses the same 1.5 ratio.
  heading: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 26,
    lineHeight: 39,          // 150%
    letterSpacing: 0,
    color: COLORS.textPrimary,
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 19,
    lineHeight: 26,          // 140%
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 16,
    lineHeight: 24,          // 150%
    color: COLORS.accent,   // accent as TEXT must be the darkened hue
  },
  body: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 16,
    lineHeight: 24,          // 150%
    letterSpacing: 0,
    color: COLORS.textSecondary,
  },
  caption: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 20,          // 150%
    color: COLORS.textSecondary,
  },
  label: {
    fontFamily: FONT_FAMILY.semibold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.textPrimary,
  },
};

// ---------------------------------------------------------------------------
// Spacing grid — 4 / 8 / 16 / 24 / 32 / 48 / 64
// ---------------------------------------------------------------------------
export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64,
};

// ---------------------------------------------------------------------------
// Border radius — XS 4 / SM 8 / MD 12 / LG 16 / XL 24 / Full
// ---------------------------------------------------------------------------
export const RADIUS = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 999,
};

// ---------------------------------------------------------------------------
// Elevation — three levels only: FLAT (surface), RAISED (card), GLOW (purple)
// ---------------------------------------------------------------------------
export const ELEVATION = {
  flat: {},
  raised: {
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
};

// ---------------------------------------------------------------------------
// Motion tokens
// ---------------------------------------------------------------------------
export const MOTION = {
  fade:         { duration: 300 },                        // Fade In/Out — ease-out
  slideUp:      { duration: 250, distance: 16 },          // Slide Up — ease-out
  progressFill: { duration: 400 },                        // Progress Fill — ease-out
  scaleBounce:  { damping: 12, stiffness: 140, mass: 1 }, // Scale Bounce — spring
  glowPulse:    { duration: 1800 },                       // Purple Glow Pulse — loop
  cardFloat:    { duration: 2600 },                       // Card Float — loop
};

export default { COLORS, LIGHT, GRADIENTS, FONT_FAMILY, TYPE, TYPE_SCALE, SPACING, RADIUS, ELEVATION, MOTION };
