// src/screens/aiteacher/sections/RangeSheet.js
// The date-range picker behind "My Lessons" — a bottom sheet, on the light palette.
//
// Split out of AITeacherScreen rather than left inline because it was the last piece of
// the landing still drawn in night-palette styles; on a white page its dark sheet read as
// a different app. The options themselves stay in the screen (RANGES), so this component
// knows nothing about what a range means.
import React from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';

import { AIT } from '../../../theme/aiTeacherTheme';
import { T } from './ui';

export default function RangeSheet({ visible, ranges = [], value, onSelect = () => {}, onClose = () => {} }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.grab} />
        <T w="bold" s={18} style={{ marginBottom: 12, paddingHorizontal: 4 }}>Date range</T>

        {ranges.map((r) => {
          const on = value === r.key;
          return (
            <Pressable
              key={r.key}
              onPress={() => onSelect(r.key)}
              style={[s.item, on && s.itemOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <T w={on ? 'bold' : 'med'} s={15} c={on ? AIT.ink : AIT.inkSoft} style={{ flex: 1 }}>{r.label}</T>
              {on && <Check size={18} color={AIT.accent} strokeWidth={2.5} />}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,17,17,0.35)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: AIT.bg,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 10,
  },
  grab: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: AIT.edge, marginBottom: 14,
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingHorizontal: 14, height: 50,
  },
  itemOn: { backgroundColor: AIT.field },
});
