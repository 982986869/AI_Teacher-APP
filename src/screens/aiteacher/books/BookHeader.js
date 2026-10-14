// src/screens/aiteacher/books/BookHeader.js
// The back-arrow header every textbook sub-view shares (same geometry as AITeacherHome's).
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { AIT } from '../../../theme/aiTeacherTheme';
import { T, PAD } from '../sections/ui';

export default function BookHeader({ title, subtitle, onBack }) {
  return (
    <View style={s.row}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back" style={s.back}>
        <ArrowLeft size={18} color={AIT.ink} strokeWidth={2} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <T w="bold" s={18} numberOfLines={1}>{title}</T>
        {!!subtitle && <T w="reg" s={12.5} c={AIT.inkSoft} numberOfLines={1}>{subtitle}</T>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 12 },
  back: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: AIT.edge, alignItems: 'center', justifyContent: 'center' },
});
