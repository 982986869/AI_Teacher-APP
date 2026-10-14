// src/screens/aiteacher/books/BookGrid.js
// Books for the student's class: subject chips + a 2-column cover grid.
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Image, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AIT } from '../../../theme/aiTeacherTheme';
import { T, PAD, cardSurface } from '../sections/ui';
import { coverUri } from '../../../api/booksApi';
import BookHeader from './BookHeader';

const GAP = 12;

export default function BookGrid({ books, loading, error, classLabel, onOpenBook, onBack, onRetry }) {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const cardW = Math.floor((W - PAD * 2 - GAP) / 2);
  const subjects = useMemo(() => ['All', ...Array.from(new Set((books || []).map((b) => b.subject)))], [books]);
  const [subject, setSubject] = useState('All');
  const shown = (books || []).filter((b) => subject === 'All' || b.subject === subject);

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <BookHeader title="Your textbooks" subtitle={classLabel ? `NCERT · ${classLabel}` : 'NCERT'} onBack={onBack} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={{ flexGrow: 0 }}>
        {subjects.map((name) => {
          const on = name === subject;
          return (
            <Pressable
              key={name}
              onPress={() => setSubject(name)}
              style={[s.chip, on && s.chipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <T w="semi" s={12.5} c={on ? AIT.inkInv : AIT.ink}>{name}</T>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading && <ActivityIndicator color={AIT.accent} style={{ marginTop: 40 }} />}

      {!!error && !loading && (
        <View style={s.empty}>
          <T w="med" s={13} c={AIT.inkSoft}>{error}</T>
          <Pressable onPress={onRetry} accessibilityRole="button"><T w="bold" s={13} c={AIT.accent}>Retry</T></Pressable>
        </View>
      )}

      {!loading && !error && (
        <ScrollView contentContainerStyle={[s.grid, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          {shown.map((b) => {
            const uri = coverUri(b.coverUrl);
            return (
              <Pressable
                key={b.id}
                onPress={() => onOpenBook(b)}
                style={({ pressed }) => [s.card, { width: cardW }, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel={`${b.title}, ${b.chapterCount} chapters`}
              >
                <View style={[s.cover, { height: Math.round(cardW * 1.3) }]}>
                  {uri
                    ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    : <T w="bold" s={16} c={AIT.inkMuted}>{b.title}</T>}
                </View>
                <T w="bold" s={14} numberOfLines={2}>{b.title}</T>
                <T w="reg" s={12} c={AIT.inkSoft}>{b.chapterCount} chapters</T>
              </Pressable>
            );
          })}
          {!shown.length && <T w="med" s={13} c={AIT.inkSoft} style={{ padding: PAD }}>No books for this class yet.</T>}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: AIT.bg },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: PAD, paddingVertical: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: AIT.edge, backgroundColor: AIT.field },
  chipOn: { backgroundColor: AIT.ink, borderColor: AIT.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: PAD, paddingTop: 8 },
  card: { ...cardSurface, padding: 10, gap: 4 },
  cover: { borderRadius: 10, overflow: 'hidden', backgroundColor: AIT.field, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  empty: { alignItems: 'center', gap: 10, padding: PAD * 2 },
});
