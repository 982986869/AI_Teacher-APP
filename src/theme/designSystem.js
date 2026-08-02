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
  // Brand
  primary:       '#7C3AED',
  primaryLight:  '#A855F7',
  accent:        '#F59E0B',

  // Feedback
  success:       '#10B981',
  error:         '#EF4444',
  warning:       '#F97316',

  // Surfaces
  // Figma's auth-screen frame inspects as a flat #0C0936 — the same value the
  // Splash/Onboarding/Login/Signup flow now shares as its one dark background.
  background:    '#0C0936',
  surface:       '#1C1730',
  card:          '#FFFFFF0D',  // white @ 5%
  border:        '#FFFFFF14',  // white @ 8%

  // Text
  textPrimary:   '#F1F0F5',
  // The palette board labels this #9CA3AF, but every body node in the Figma file
  // inspects as #94A3B8 — the screens win, since that's what ships.
  textSecondary: '#94A3B8',
};

/** Purple-on-dark gradients. Feed straight into <LinearGradient colors={...} />. */
export const GRADIENTS = {
  // Primary CTA fill (left → right). Three stops, inspected off the shared
  // primary-button node — a two-stop approximation loses the dark right end.
  primary:  ['#6D4AFF', COLORS.primary, '#4C1D95'],
  // Progress fills.
  progress: [COLORS.primary, COLORS.primaryLight],
  // Deep violet wash behind the splash (both stops opaque).
  splash:   ['#2A0569', '#08033B'],
  // Full-bleed scrim that drops a photo/hero into the background so text stays
  // legible. Inspected from Figma: two stops, transparent #0E0B3C → solid #030124,
  // spanning the whole 390×844 frame. Note the deep navy is intentionally darker
  // than COLORS.background — don't "correct" it to the background token.
  scrim:    ['#0E0B3C00', '#030124'],
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    color: COLORS.primaryLight,   // the board shows this step in purple
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

export default { COLORS, GRADIENTS, FONT_FAMILY, TYPE, SPACING, RADIUS, ELEVATION, MOTION };
