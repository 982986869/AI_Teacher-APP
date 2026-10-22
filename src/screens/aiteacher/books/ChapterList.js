// src/screens/aiteacher/books/ChapterList.js
// "Ch. 7: Binomial Theorem" rows for one book.
import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';

import { AIT } from '../../../theme/aiTeacherTheme';
import { T, PAD, cardSurface } from '../sections/ui';
import BookHeader from './BookHeader';

export default function ChapterList({ book, chapters, loading, error, onOpenChapter, onBack, onRetry }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <BookHeader title={book?.title || 'Chapters'} subtitle="Select a chapter" onBack={onBack} />

      {loading && <ActivityIndicator color={AIT.accent} style={{ marginTop: 40 }} />}

      {!!error && !loading && (
        <View style={s.empty}>
          <T w="med" s={13} c={AIT.inkSoft}>{error}</T>
          <Pressable onPress={onRetry} accessibilityRole="button"><T w="bold" s={13} c={AIT.accent}>Retry</T></Pressable>
        </View>
      )}

      {!loading && !error && (
        <ScrollView contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          {(chapters || []).map((c) => (
            <Pressable
              key={c.id}
              onPress={() => onOpenChapter(c)}
              style={({ pressed }) => [s.row, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel={`Chapter ${c.number}: ${c.title}`}
            >
              <View style={{ flex: 1 }}>
                <T w="bold" s={14}>Ch. {c.number}: {c.title}</T>
                <T w="reg" s={12} c={AIT.inkSoft}>{c.topicCount} {c.topicCount === 1 ? 'topic' : 'topics'}</T>
              </View>
              <ChevronRight size={18} color={AIT.inkMuted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: AIT.bg },
  list: { paddingHorizontal: PAD, gap: 10, paddingTop: 4 },
  row: { ...cardSurface, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  empty: { alignItems: 'center', gap: 10, padding: PAD * 2 },
});
