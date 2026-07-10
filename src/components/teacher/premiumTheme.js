// "Atelier" design tokens for the AI Teacher — a warm, editorial luxury look
// (approved direction): warm ivory ground, ink-blue accent, a whisper of brass,
// serif display + Poppins body. One source of truth so the avatar, cards, dock and
// SVG boards re-theme together. Key names are unchanged so everything re-skins.
import { Platform } from 'react-native';

// Serif display role — used with restraint for the greeting, lesson title & formulas.
// System serif (Georgia on iOS, Noto/serif on Android) so no extra font dependency.
export const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export const T = {
  // Surfaces (warm off-white → white cards float on it)
  bg: '#FAF8F4',
  bgElev: '#FBF7EE',
  bgElev2: '#E8E0CF',

  // Fills (translucent warm-dark over the bone bg) + hairline borders
  glass: 'rgba(36,31,23,0.04)',
  glassStrong: 'rgba(36,31,23,0.07)',
  border: 'rgba(36,31,23,0.09)',
  borderStrong: 'rgba(36,31,23,0.15)',

  // Brand — BURNT AMBER primary, deep-teal secondary
  primary: '#C57E22',
  primaryBright: '#A9691A',
  primarySoft: 'rgba(197,126,34,0.14)',

  // State accents — amber speaking · teal listening · amber thinking
  speaking: '#C57E22',
  listening: '#1E6E5B',
  thinking: '#C57E22',

  // Text (espresso)
  text: '#241F17',
  textDim: '#5F584B',
  textFaint: '#8C8371',

  // Semantic
  success: '#1E6E5B',   // teal
  danger: '#C0402A',    // terracotta-red

  // Radii
  rXl: 28,
  rLg: 22,
  rMd: 16,
  rSm: 12,
};

// ── PREMIUM TYPOGRAPHY · SPACING · GLASS ──────────────────────────────────────
// One deliberate type system (Poppins — loaded at the AI Teacher root) and an
// Apple-style spacing scale, so the teaching surfaces read as one crafted product
// instead of ad-hoc numeric weights. Family names fall back to the system font if
// Poppins hasn't loaded, so referencing them is always safe.
export const F = {
  black: 'Poppins_800ExtraBold',
  bold:  'Poppins_700Bold',
  semi:  'Poppins_600SemiBold',
  med:   'Poppins_500Medium',
  reg:   'Poppins_400Regular',
};

// spacing scale (multiples that give generous, consistent rhythm)
export const SP = { xs: 4, sm: 8, md: 14, lg: 20, xl: 28, xxl: 40, xxxl: 56 };

// Faux-frosted glass for floating controls over the warm paper (no native blur
// dependency): layered translucent white + a bright top hairline + a soft ambient
// shadow reads as premium frosted glass on the light theme.
export const GLASS = {
  fill:       'rgba(255,255,255,0.60)',
  fillStrong: 'rgba(255,255,255,0.84)',
  hair:       'rgba(255,255,255,0.9)',  // inner top highlight
  edge:       'rgba(42,46,58,0.06)',    // faint outer border
  shadow:     '#2A2E3A',                // warm ambient shadow
};

// State → accent color helper.
export const stateColor = (s) => (
  s === 'listening' ? T.listening : s === 'thinking' ? T.thinking : T.speaking
);

// ── CLASSROOM palette — PREMIUM warm-off-white + soft-blue theme. Key names kept
// (cream = app bg, ink = text, accent = brand…) so the player and its SVG boards
// re-theme together. Soft blue primary, teal secondary, no purple, no grey cards.
export const C = {
  cream: '#F1EBDF',      // app background — warm bone (Editorial)
  cream2: '#E8E0CF',     // warm elevated / track
  board: '#FBF7EE',      // card / surface (soft warm white)
  ink: '#241F17',        // primary text — espresso
  ink2: '#5F584B',       // secondary text (warm)
  dim: '#8C8371',        // labels / tertiary (warm taupe)
  faint: '#B4A98F',      // faint / placeholders (warm)
  line: 'rgba(36,31,23,0.09)',  // hairline borders/dividers

  // diagram / token colors — warm-cohesive amber + teals
  orange: '#C57E22',     // amber
  blue: '#2E7D6E',       // teal-blue
  green: '#1E6E5B',      // deep teal
  pink: '#B5654A',       // terracotta
  accent: '#C57E22',     // BURNT AMBER — primary brand
  accentBright: '#A9691A',
  accentSoft: 'rgba(197,126,34,0.13)',
  teal: '#1E6E5B',       // deep-teal secondary
  brass: '#C58B3E',      // (kept for compatibility)
  brassSoft: 'rgba(197,139,62,0.14)',

  // bottom area — warm bone bands (legacy WarmGradient; kept warm)
  peachBands: ['#F1EBDF', '#F0E9DA', '#EDE5D4', '#EAE2D0', '#E8E0CD', '#E6DDC9'],
  // very subtle bottom scrim
  scrim: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.02)', 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.06)'],
};
