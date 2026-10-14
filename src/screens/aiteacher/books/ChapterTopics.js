// src/screens/aiteacher/books/ChapterTopics.js
// One chapter: a Summary button, a checklist of the book's numbered sections (up to 3),
// and the "Teach me" CTA. Emits the exact `source` the generate API accepts:
//   { chapterId, kind: 'summary' } | { chapterId, kind: 'topics', topicIds: [...] }
import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Square, CheckSquare } from 'lucide-react-native';

import { AIT } from '../../../theme/aiTeacherTheme';
import { T, PAD, cardSurface, Eyebrow } from '../sections/ui';
import BookHeader from './BookHeader';

// Mirrors the server's limit (books.service MAX_TOPICS); the server still enforces it.
export const MAX_TOPICS = 3;

export default function ChapterTopics({ data, loading, error, generating, onTeach, onBack, onRetry }) {
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState([]);
  const [note, setNote] = useState('');
  const chapter = data?.chapter;
  const topics = data?.topics || [];

  const toggle = (id) => {
    setNote('');
    setPicked((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= MAX_TOPICS) {
        setNote(`Pick up to ${MAX_TOPICS}, or play the chapter summary.`);
        return cur;
      }
      return [...cur, id];
    });
  };
  const pickedLabel = topics.filter((t) => picked.includes(t.id)).map((t) => t.number).join(', ');

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <BookHeader
        title={chapter ? `Ch. ${chapter.number}: ${chapter.title}` : 'Chapter'}
        subtitle={data?.book?.title ? `NCERT · ${data.book.title}` : ''}
        onBack={onBack}
      />

      {loading && <ActivityIndicator color={AIT.accent} style={{ marginTop: 40 }} />}

      {!!error && !loading && (
        <View style={s.empty}>
          <T w="med" s={13} c={AIT.inkSoft}>{error}</T>
          <Pressable onPress={onRetry} accessibilityRole="button"><T w="bold" s={13} c={AIT.accent}>Retry</T></Pressable>
        </View>
      )}

      {!loading && !error && chapter && (
        <>
          <ScrollView contentContainerStyle={[s.body, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
            <Pressable
              disabled={generating}
              onPress={() => onTeach({ chapterId: chapter.id, kind: 'summary' })}
              style={({ pressed }) => [s.summary, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel="Play the chapter summary"
            >
              <View style={s.playIcon}><Play size={16} color={AIT.ink} fill={AIT.ink} /></View>
              <View style={{ flex: 1 }}>
                <T w="bold" s={15}>Chapter summary</T>
                <T w="reg" s={12} c={AIT.onAmberSoft}>Every section, spoken in about 6 minutes</T>
              </View>
            </Pressable>

            <Eyebrow style={{ marginTop: 22, marginBottom: 10 }}>Or pick what to learn (up to {MAX_TOPICS})</Eyebrow>
            {topics.map((t) => {
              const on = picked.includes(t.id);
              const Icon = on ? CheckSquare : Square;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => toggle(t.id)}
                  style={[s.topic, on && s.topicOn]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${t.number} ${t.title}`}
                >
                  <Icon size={20} color={on ? AIT.accent : AIT.inkMuted} strokeWidth={2} />
                  <T w={on ? 'bold' : 'med'} s={14} style={{ flex: 1 }}>{t.number}  {t.title}</T>
                </Pressable>
              );
            })}
            {!!note && (
              <T w="med" s={12.5} c={AIT.accent} style={{ marginTop: 10 }} accessibilityLiveRegion="polite">{note}</T>
            )}
          </ScrollView>

          {picked.length > 0 && (
            <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 12 }]}>
              <Pressable
                disabled={generating}
                onPress={() => onTeach({ chapterId: chapter.id, kind: 'topics', topicIds: picked })}
                style={({ pressed }) => [s.cta, pressed && { opacity: 0.9 }, generating && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel={`Teach me ${pickedLabel}`}
              >
                <T w="bold" s={15} c={AIT.inkInv}>Teach me {pickedLabel} →</T>
              </Pressable>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: AIT.bg },
  body: { paddingHorizontal: PAD, paddingTop: 6 },
  summary: { ...cardSurface, backgroundColor: AIT.cardAmber, borderColor: AIT.cardAmber, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  playIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: AIT.cardIconBg, alignItems: 'center', justifyContent: 'center' },
  topic: { ...cardSurface, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8 },
  topicOn: { borderColor: AIT.accent },
  ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: PAD, paddingTop: 10, backgroundColor: AIT.bg },
  cta: { backgroundColor: AIT.cardInk, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  empty: { alignItems: 'center', gap: 10, padding: PAD * 2 },
});
