// src/screens/aiteacher/sections/PersonalizedList.js
// "Personalized For You" — three rows into the parts of the feature that are about the
// student rather than the subject: what to study next, what to revise, and how they are
// doing. Each row is a tinted glyph tile, a title and a one-line description, with a
// chevron.
//
// The three destinations already exist in the app, which is why the row keys below are
// not invented: `next` is GET /api/ai/plan, `revise` is POST /api/ai/revision (the
// weak-topic recap the Home screen's "Revisit …" recommendation also runs), and
// `progress` is StudyInsightsScreen.
//
// TODO(wire): raise `onSelect(key)` into those three, and let the caller drop a row when
// the student has nothing for it — a "Revise" row with no weak topics behind it is a dead
// tap.
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { CalendarCheck, RefreshCw, ChartColumn, ChevronRight } from 'lucide-react-native';

import { AIT, AIT_TINTS } from '../../../theme/aiTeacherTheme';
import { T, SectionTitle, PAD, cardSurface } from './ui';

export const DEFAULT_ITEMS = [
  { key: 'next',     Icon: CalendarCheck, tint: AIT_TINTS.peach,  title: 'What next?', detail: 'Smart study plan' },
  { key: 'revise',   Icon: RefreshCw,     tint: AIT_TINTS.violet, title: 'Revise',     detail: 'Weak topics' },
  { key: 'progress', Icon: ChartColumn,   tint: AIT_TINTS.green,  title: 'Progress',   detail: 'Streak, study time, mastery' },
];

function Row({ item, onPress }) {
  const { Icon, tint, title, detail } = item;
  return (
    <Pressable
      onPress={onPress}
      style={s.row}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
    >
      <View style={[s.glyph, { backgroundColor: tint.bg }]}>
        <Icon size={18} color={tint.fg} strokeWidth={2} />
      </View>

      <View style={s.text}>
        <T w="bold" s={15} numberOfLines={1}>{title}</T>
        <T w="reg" s={12} c={AIT.inkSoft} numberOfLines={1}>{detail}</T>
      </View>

      <ChevronRight size={18} color={AIT.inkMuted} strokeWidth={2} />
    </Pressable>
  );
}

export default function PersonalizedList({ items = DEFAULT_ITEMS, onSelect = () => {} }) {
  if (!items?.length) return null;

  return (
    <View style={s.wrap}>
      <SectionTitle style={s.title}>Personalized For You</SectionTitle>

      <View style={s.stack}>
        {items.map((it) => (
          <Row key={it.key} item={it} onPress={() => onSelect(it.key)} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingTop: 22, gap: 12 },
  title: { paddingHorizontal: PAD },
  stack: { paddingHorizontal: PAD, gap: 10 },

  row: {
    ...cardSurface,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  glyph: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0, gap: 2 },
});
