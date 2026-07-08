import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect, Circle, Line } from 'react-native-svg';
import { C } from './premiumTheme';

// ── LIVE-CLASS BOARD SURFACES ─────────────────────────────────────────────────
// A real classroom writes on a SURFACE, not a blank slide: maths on grid paper,
// physics on graph paper, chemistry on the lab dot-grid, biology in a ruled
// notebook, history on a timeline ledger, geography on a faint map. This renders
// that surface *behind* the board content so every lesson reads as a live whiteboard.
//
// Purely decorative + very low-contrast, so it never competes with the teaching.
// One <BoardSurface type=…/> tiles an SVG pattern to fill its parent (the lesson
// card). React.memo'd on `type` so it never re-renders as the board draws.

// boardType (+ subject fallback) → surface. Subject boards map directly; generic
// boards (concept / formula / intro / summary…) fall back to the lesson's subject.
const BY_BOARD = {
  triangle: 'grid', formula: 'grid', proof: 'grid', numberLine: 'grid', chart: 'graph',
  graphFn: 'graph', freeBody: 'graph',
  reaction: 'lab', molecule: 'lab',
  cell: 'notebook',
  timeline: 'timeline',
};
const BY_SUBJECT = {
  maths: 'grid', math: 'grid', mathematics: 'grid',
  physics: 'graph',
  chemistry: 'lab',
  biology: 'notebook',
  history: 'timeline',
  geography: 'map',
};

export function surfaceFor(boardType, subject) {
  if (boardType && BY_BOARD[boardType]) return BY_BOARD[boardType];
  const s = String(subject || '').toLowerCase();
  for (const key of Object.keys(BY_SUBJECT)) if (s.includes(key)) return BY_SUBJECT[key];
  return 'grid'; // neutral premium default
}

// faint ink helpers (kept low so text stays crisp on top)
const blue = (a) => `rgba(60,157,240,${a})`;
const teal = (a) => `rgba(15,163,154,${a})`;
const warm = (a) => `rgba(239,138,67,${a})`;
const pink = (a) => `rgba(238,111,150,${a})`;

// Each surface = a tiling <Pattern> (minor grid) + optional coarser overlay and a
// couple of static accents (notebook margin, map contours) drawn full-bleed.
function SurfaceSvg({ type }) {
  const id = `sfc-${type}`;
  if (type === 'graph') {
    return (
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={`${id}-m`} width={13} height={13} patternUnits="userSpaceOnUse">
            <Path d="M13 0 H0 V13" stroke={teal(0.05)} strokeWidth={1} fill="none" />
          </Pattern>
          <Pattern id={`${id}-M`} width={65} height={65} patternUnits="userSpaceOnUse">
            <Path d="M65 0 H0 V65" stroke={teal(0.1)} strokeWidth={1} fill="none" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id}-m)`} />
        <Rect width="100%" height="100%" fill={`url(#${id}-M)`} />
      </Svg>
    );
  }
  if (type === 'lab') {
    // scientific dot-grid — reads as squared lab paper
    return (
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} width={22} height={22} patternUnits="userSpaceOnUse">
            <Circle cx={1.5} cy={1.5} r={1.2} fill={teal(0.14)} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    );
  }
  if (type === 'notebook') {
    // ruled notebook: horizontal lines + a coloured margin rule near the left
    return (
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} width={2000} height={27} patternUnits="userSpaceOnUse">
            <Line x1={0} y1={26.5} x2={2000} y2={26.5} stroke={blue(0.09)} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
        <Line x1={30} y1={0} x2={30} y2={2000} stroke={pink(0.22)} strokeWidth={1.5} />
      </Svg>
    );
  }
  if (type === 'timeline') {
    // aged ledger — warm horizontal rules
    return (
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} width={2000} height={29} patternUnits="userSpaceOnUse">
            <Line x1={0} y1={28.5} x2={2000} y2={28.5} stroke={warm(0.08)} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    );
  }
  if (type === 'map') {
    // faint graticule + two contour sweeps
    return (
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} width={30} height={30} patternUnits="userSpaceOnUse">
            <Path d="M30 0 H0 V30" stroke={teal(0.06)} strokeWidth={1} fill="none" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
        <Path d="M-20 60 Q120 20 260 70 T560 60" stroke={teal(0.12)} strokeWidth={1.5} fill="none" />
        <Path d="M-20 150 Q140 110 300 160 T620 150" stroke={teal(0.1)} strokeWidth={1.5} fill="none" />
      </Svg>
    );
  }
  // grid (default) — maths squared paper
  return (
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern id={`${id}-m`} width={20} height={20} patternUnits="userSpaceOnUse">
          <Path d="M20 0 H0 V20" stroke={blue(0.05)} strokeWidth={1} fill="none" />
        </Pattern>
        <Pattern id={`${id}-M`} width={100} height={100} patternUnits="userSpaceOnUse">
          <Path d="M100 0 H0 V100" stroke={blue(0.09)} strokeWidth={1} fill="none" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id}-m)`} />
      <Rect width="100%" height="100%" fill={`url(#${id}-M)`} />
    </Svg>
  );
}

const BoardSurface = React.memo(function BoardSurface({ type = 'grid' }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <SurfaceSvg type={type} />
    </View>
  );
});

export default BoardSurface;
