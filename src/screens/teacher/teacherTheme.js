// src/screens/teacher/teacherTheme.js
// The teacher app wears the same clothes as the student app (src/theme/dayTheme.js — the
// Home screen's "day" look): white page, white cards with a 1px #E5E5EA edge and a soft
// shadow, the yellow hero card with a black button, violet uppercase eyebrows, Plus
// Jakarta Sans. One place, so every teacher screen stays in step with Home.
import { DAY, DFONT } from '../../theme/dayTheme';

export const F = DFONT; // reg · med · semi · bold · xbold

export const T = {
  page: '#FFFFFF',
  card: DAY.card,
  edge: DAY.cardEdge,
  fill: DAY.cardSoft,          // inputs, chips, empty states
  ink: DAY.ink,
  soft: DAY.inkSoft,
  dim: DAY.inkDim,
  violet: DAY.violet,
  violetSoft: DAY.violetSoft,
  hero: DAY.heroA,             // the yellow "current lesson" card
  heroInk: '#000000',
  heroChip: 'rgba(255,255,255,0.55)',
  black: '#000000',
  white: '#FFFFFF',
  green: DAY.green,
  greenSoft: DAY.greenSoft,
  red: DAY.red,
  redSoft: DAY.redSoft,
  amber: DAY.amber,
  amberSoft: DAY.amberSoft,
  yellowSoft: '#FEF3C7',
  yellowEdge: '#FCD34D',
};

// The card every section sits in — Home's `card`.
export const CARD = {
  backgroundColor: DAY.card, borderRadius: 20, borderWidth: 1, borderColor: DAY.cardEdge,
  shadowColor: DAY.shadow, shadowOpacity: DAY.shadowOpacity, shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 }, elevation: 2,
};

// Home's eyebrow: 11px bold uppercase, violet.
export const EYEBROW = { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.1, color: DAY.violet, textTransform: 'uppercase' };
