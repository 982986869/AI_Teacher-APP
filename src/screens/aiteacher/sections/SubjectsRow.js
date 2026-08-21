// src/screens/aiteacher/sections/SubjectsRow.js
// "Your Subjects" — tiles, each a rounded card holding a tinted circular glyph above its
// label. This is the subject the next generated lesson is about, so one tile is selected.
//
// The design draws four across. The live screen offers six (AITeacherScreen's SUBJECTS —
// the AI teacher answers every academic question, so it is not restricted by stream), so
// rather than wrap into a ragged second row the list scrolls once it passes four, with
// each tile sized to a quarter of the gutter width. Four subjects therefore render
// pixel-identical to the design, and the extras simply slide.
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Atom, Percent, FlaskConical, Leaf, BookOpen, Landmark, Sparkles } from 'lucide-react-native';

import { AIT, AIT_TINTS } from '../../../theme/aiTeacherTheme';
import { T, SectionTitle, PAD, cardSurface } from './ui';

const GAP = 10;
const PER_ROW = 4;

// Presentation only — which glyph and tint a subject wears. The subject LIST is data
// that arrives from outside; this is the lookup that dresses it. Keys match
// AITeacherScreen's SUBJECTS.
const META = {
  Physics:   { Icon: Atom,         tint: AIT_TINTS.blue },
  Maths:     { Icon: Percent,      tint: AIT_TINTS.violet },
  Chemistry: { Icon: FlaskConical, tint: AIT_TINTS.green },
  Biology:   { Icon: Leaf,         tint: AIT_TINTS.pink },
  English:   { Icon: BookOpen,     tint: AIT_TINTS.peach },
  History:   { Icon: Landmark,     tint: AIT_TINTS.peach },
};
const metaFor = (name) => META[name] || { Icon: Sparkles, tint: AIT_TINTS.violet };

export const DEFAULT_SUBJECTS = ['Physics', 'Maths', 'Chemistry', 'Biology'];

function SubjectTile({ name, width, on, onPress }) {
  const { Icon, tint } = metaFor(name);
  return (
    <Pressable
      onPress={onPress}
      style={[s.tile, { width }, on && { borderColor: tint.fg, borderWidth: 1.5 }]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={name}
    >
      <View style={[s.glyph, { backgroundColor: tint.bg }]}>
        <Icon size={18} color={tint.fg} strokeWidth={2} />
      </View>
      <T w={on ? 'bold' : 'semi'} s={12} numberOfLines={1}>{name}</T>
    </Pressable>
  );
}

export default function SubjectsRow({ subjects = DEFAULT_SUBJECTS, selected, onSelect = () => {} }) {
  const { width: W } = useWindowDimensions();
  // Four tiles and three gaps inside the page gutters.
  const tileW = Math.floor((W - PAD * 2 - GAP * (PER_ROW - 1)) / PER_ROW);

  if (!subjects?.length) return null;

  return (
    <View style={s.wrap}>
      <SectionTitle style={s.title}>Your Subjects</SectionTitle>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // With exactly four subjects the content is the full width and nothing scrolls;
        // the ScrollView only earns its keep when there are more.
        scrollEnabled={subjects.length > PER_ROW}
        contentContainerStyle={s.row}
      >
        {subjects.map((name) => (
          <SubjectTile
            key={name}
            name={name}
            width={tileW}
            on={name === selected}
            onPress={() => onSelect(name)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingTop: 22, gap: 12 },
  title: { paddingHorizontal: PAD },
  row: { flexDirection: 'row', gap: GAP, paddingHorizontal: PAD },
  tile: {
    ...cardSurface,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center', gap: 8,
  },
  glyph: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
});
