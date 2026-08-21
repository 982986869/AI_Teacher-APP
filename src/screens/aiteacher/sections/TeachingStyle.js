// src/screens/aiteacher/sections/TeachingStyle.js
// "TEACHING STYLE" — a horizontally scrolling row of pills, the selected one filled
// near-black and the rest outlined. This is the register the NEXT generated lesson is
// taught in, so the choice has to survive until the student hits generate.
//
// Items are `{ key, label }`. The caller passes TEACHING_MODES from src/api/aiApi.js
// mapped to `{ key: m.key, label: m.short }` — the key is what the lesson request
// carries, the label is what fits a pill. Defaults below are the five the design draws,
// which are the first five of that list; the live screen passes all eight.
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';

import { AIT } from '../../../theme/aiTeacherTheme';
import { T, Eyebrow, PAD } from './ui';

export const DEFAULT_STYLES = [
  { key: 'auto', label: 'Auto' },
  { key: 'eli5', label: 'ELI5' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Standard' },
  { key: 'advanced', label: 'Advanced' },
];

function Chip({ label, on, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, on ? s.chipOn : s.chipOff]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`Teaching style: ${label}`}
    >
      <T w={on ? 'bold' : 'med'} s={13} c={on ? AIT.chipOnInk : AIT.chipOffInk}>
        {label}
      </T>
    </Pressable>
  );
}

export default function TeachingStyle({
  styles: items = DEFAULT_STYLES,
  selected = DEFAULT_STYLES[0].key,
  onSelect = () => {},
}) {
  if (!items?.length) return null;

  return (
    <View style={s.wrap}>
      <Eyebrow style={s.label}>Teaching style</Eyebrow>

      {/* The row runs past the right edge in the design — "Advanced" is cut off — so it
          scrolls, and the padding lives on the content rather than the ScrollView so the
          first pill starts on the page gutter and the last one can still reach the edge. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.row}
      >
        {items.map((m) => (
          <Chip
            key={m.key}
            label={m.label}
            on={m.key === selected}
            onPress={() => onSelect(m.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingTop: 16, gap: 10 },
  label: { paddingHorizontal: PAD },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: PAD },
  chip: {
    height: 36, borderRadius: 100, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  chipOn:  { backgroundColor: AIT.chipOnBg },
  chipOff: { backgroundColor: AIT.chipOffBg, borderWidth: 1, borderColor: AIT.chipEdge },
});
