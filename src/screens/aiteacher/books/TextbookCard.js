// src/screens/aiteacher/books/TextbookCard.js
// "Learn from your textbook" — the entry card on the AI Teacher home. Rendered only when
// the student's class has books (AITeacherScreen passes `visible`).
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BookOpen, ChevronRight } from 'lucide-react-native';

import { AIT } from '../../../theme/aiTeacherTheme';
import { T, PAD, cardSurface } from '../sections/ui';

export default function TextbookCard({ visible, bookCount = 0, onPress }) {
  if (!visible) return null;
  return (
    <View style={s.wrap}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
        accessibilityLabel="Learn from your textbook"
      >
        <View style={s.icon}><BookOpen size={20} color={AIT.ink} strokeWidth={1.8} /></View>
        <View style={{ flex: 1 }}>
          <T w="bold" s={16}>Learn from your textbook</T>
          <T w="reg" s={12} c={AIT.onAmberSoft}>
            {bookCount ? `${bookCount} NCERT books · pick a chapter, hear it taught` : 'Pick a chapter, hear it taught'}
          </T>
        </View>
        <ChevronRight size={18} color={AIT.ink} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: PAD, paddingTop: 14 },
  card: { ...cardSurface, backgroundColor: AIT.cardAmber, borderColor: AIT.cardAmber, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: AIT.cardIconBg, alignItems: 'center', justifyContent: 'center' },
});
