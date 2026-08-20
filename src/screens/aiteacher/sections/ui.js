// src/screens/aiteacher/sections/ui.js
// The three primitives every section of the AI Teacher home repeats: typed text, the
// small grey ALL-CAPS eyebrow, and the sentence-case section heading.
//
// They live here rather than in each section file because the page mixes the two
// heading styles deliberately — "TEACHING STYLE" and "YOUR DEDICATED INSTRUCTOR" are
// eyebrows, while "Your Subjects", "Jump back in" and "Personalized For You" are
// headings — and a section picking the wrong one is only visible when they sit side by
// side. One definition each keeps that distinction honest.
import React from 'react';
import { Text, StyleSheet } from 'react-native';

import { AIT, AFONT as F } from '../../../theme/aiTeacherTheme';

// Horizontal page padding. The header, greeting, search and action cards on
// AITeacherHome all use 24; every section below matches so the page has one gutter.
export const PAD = 24;

const FAM = { xbold: F.xbold, bold: F.bold, semi: F.semi, med: F.med, reg: F.reg };

export function T({ w = 'reg', s = 14, c = AIT.ink, style, children, ...rest }) {
  return (
    <Text {...rest} style={[{ fontFamily: FAM[w] || F.reg, fontSize: s, color: c }, style]}>
      {children}
    </Text>
  );
}

// The grey ALL-CAPS label above a band of content.
export function Eyebrow({ children, style }) {
  return (
    <T w="bold" s={11} c={AIT.inkMuted} style={[u.eyebrow, style]}>
      {children}
    </T>
  );
}

// The larger sentence-case heading that introduces a stack of cards.
export function SectionTitle({ children, style }) {
  return (
    <T w="bold" s={18} style={[u.sectionTitle, style]}>
      {children}
    </T>
  );
}

// The white panel the instructor / lesson / personalized cards are all drawn on.
export const cardSurface = {
  backgroundColor: AIT.surface,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: AIT.surfaceEdge,
};

const u = StyleSheet.create({
  eyebrow: { letterSpacing: 1.1, textTransform: 'uppercase' },
  sectionTitle: { letterSpacing: -0.2 },
});

export default T;
