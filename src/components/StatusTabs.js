// src/components/StatusTabs.js
// Status-filter chips for admin lists (All / Published / Draft / Archived …).
// Uses a simple WRAPPING row (flexWrap) — NOT a horizontal ScrollView — because the scroll
// version rendered blank on some Android devices. Chips wrap to fit and are always visible.
// Plain Pressable + plain Text (raw fontWeight), exactly like the student ClassTabs that
// renders correctly. Count is part of the single label string (no nested Text).
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';

export default function StatusTabs({ tab, onChange, tabs, style }) {
  return (
    <View style={[st.wrap, style]}>
      {tabs.map((t) => {
        const on = tab === t.id;
        return (
          <Pressable key={t.id} onPress={() => onChange(t.id)} style={[st.chip, on && st.chipOn]}
            accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={t.label}>
            <Text numberOfLines={1} style={[st.txt, on && st.txtOn]}>
              {t.count != null ? `${t.label} ${t.count}` : t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#D8D8DC', backgroundColor: '#FFFFFF' },
  chipOn: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  txt: { fontSize: 13, fontWeight: '800', color: '#3A3A3C' },
  txtOn: { color: '#FFFFFF' },
});
