// constants/colors.js — AiLernova Design Tokens

const COLORS = {
  // ── Brand / Primary ──────────────────────────────────────
  darkNavy:     '#0f0c2e',   // main dark background (hero, headers)
  darkCard:     '#1e1a40',   // elevated surface on dark bg (bubble, cards)
  accent:       '#5b8dee',   // primary CTA blue (buttons, progress bar, selected chips)
  purple:       '#a855f7',   // Nova mascot avatar background
  novaBlue:     '#7ecfff',   // Nova name highlight in speech bubble

  // ── Neutral / UI ─────────────────────────────────────────
  white:        '#ffffff',
  background:   '#f8fafc',   // light screen background
  surface:      '#ffffff',   // card / input surface
  border:       '#e2e8f0',   // default border
  borderFocus:  '#5b8dee',   // focused / selected border

  // ── Text ─────────────────────────────────────────────────
  textPrimary:  '#0f0c2e',   // headings, body on light bg
  textSecondary:'#475569',   // unselected chip labels
  textMuted:    '#94a3b8',   // placeholder, step label
  textWhite:    '#ffffff',   // text on dark surfaces
  textBlue:     '#1d4ed8',   // selected card label, tag text

  // ── State / Feedback ─────────────────────────────────────
  selectedBg:   '#eff6ff',   // light blue tint for selected cards/chips
  tagBg:        '#eff6ff',   // done-screen tag background
  tagBorder:    '#bfdbfe',   // done-screen tag border
  disabled:     '#cbd5e1',   // disabled button background
  disabledText: '#94a3b8',

  // ── Decorative dots (hero bg) ────────────────────────────
  heroDot:      'rgba(255,255,255,0.12)',

  // ── Aliases for SignupScreen + shared UI ─────────────────
  primary:      '#5b8dee',   // alias for accent
  text:         '#0f0c2e',   // alias for textPrimary
  subtext:      '#94a3b8',   // alias for textMuted
};

export default COLORS;

// Named export so both import styles work:
// import COLORS from '../constants/colors'       ← default
// import { COLORS } from '../constants/colors'   ← named
export { COLORS };