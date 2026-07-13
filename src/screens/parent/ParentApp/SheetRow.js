// src/screens/parent/ParentApp/SheetRow.js
// Reusable list row for bottom sheets (Profile, and future sheets). Same look as the
// original inline Profile row — icon chip + label + chevron (or trailing sub-text),
// with a spring press. Kept separate so any sheet can compose the same row.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { C, T } from './constants';
import { PressableScale } from './anim';

export default function SheetRow({ Icon, label, sub, onPress, danger }) {
  return (
    <PressableScale style={s.row} onPress={onPress} accessibilityLabel={label} accessibilityHint={danger ? 'Destructive action' : undefined}>
      <View style={[s.icon, { backgroundColor: danger ? '#FDE8E8' : C.headerBg }]} accessibilityElementsHidden importantForAccessibility="no">
        <Icon size={19} color={danger ? C.red : C.ink} strokeWidth={2.2} />
      </View>
      <T w="semi" s={15} c={danger ? C.red : C.ink} style={{ flex: 1 }} numberOfLines={1}>{label}</T>
      {sub ? <T w="med" s={13} c={C.muted}>{sub}</T> : <ChevronRight size={18} color={C.faint} />}
    </PressableScale>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 },
  icon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
