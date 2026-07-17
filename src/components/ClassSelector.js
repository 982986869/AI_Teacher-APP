// src/components/ClassSelector.js
// One shared, native class selector for Admin Mode (Tests, Resources, Results filters, forms).
// Canonical "Class N" chips only (no "11"/"grade 11"/"XI"), horizontal scroll, student
// black/white chip theme (matches ClassPicker.ClassTabs), the selected chip auto-scrolls into
// view, and there's leading/trailing padding so the first/last chip is never clipped. No giant
// card around it — it sits inline under the header.
import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Pressable, Text, StyleSheet } from 'react-native';

export default function ClassSelector({ classes = [], value, onChange, style }) {
  const ref = useRef(null);
  const offsets = useRef({}); // class number → x offset (captured on layout)

  const scrollToValue = (n) => {
    const x = offsets.current[n];
    if (x != null && ref.current) ref.current.scrollTo({ x: Math.max(0, x - 16), animated: true });
  };
  // Keep the selected chip visible when the value changes (incl. the initial default).
  useEffect(() => { const t = setTimeout(() => scrollToValue(value), 60); return () => clearTimeout(t); }, [value, classes.length]);

  return (
    <View style={[st.wrap, style]}>
      <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
        {classes.map((n) => {
          const on = n === value;
          return (
            <Pressable
              key={n}
              onLayout={(e) => { offsets.current[n] = e.nativeEvent.layout.x; }}
              onPress={() => { onChange(n); scrollToValue(n); }}
              style={[st.chip, on && st.chipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Class ${n}`}
            >
              <Text numberOfLines={1} style={[st.txt, on && st.txtOn]}>Class {n}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { backgroundColor: 'transparent' },
  content: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#D8D8DC', backgroundColor: '#fff' },
  chipOn: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  txt: { fontSize: 13, fontWeight: '800', color: '#3A3A3C' },
  txtOn: { color: '#fff' },
});
