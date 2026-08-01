// OnlineTestReview.js
// Question-by-question review shown after an online test is submitted, from the
// "Review Questions" button on MockResultScreen. Palette matches MockResultScreen.
//
// Works off the raw submit payload rather than a computed report, because the
// report (computeMockResult) only carries totals — it has no per-question detail.
//
// Props:
//   title      -> e.g. "Laws of Motion — Review"
//   questions  -> [{ id, text, options:[{ key, label }], correctAnswer:'A', explanation }]
//                 (the shape the offline banks produce — `correctAnswer` is a LETTER)
//   answers    -> { [questionId]: 'A' }  — letters too; absent = unanswered
//   onBack()   -> return to the result screen

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { S } from '../theme/studentUI';
import { FONT } from '../constants/fonts';

const C = {
  bg: S.hair,
  card: '#FFFFFF',
  border: '#F0E8E3',
  text: '#2A2D3A',
  textMuted: S.muted,
  mint: '#0FA39A',
  mintSoft: '#E1F5F3',
  peach: '#E25563',
  peachSoft: '#FCE9EC',
  sand: '#F5A623',
  sandSoft: '#FDF0DC',
};

// A question with no answer key cannot be marked right or wrong — say so rather
// than silently calling the student's answer incorrect. (Biology currently ships
// with no answer key at all, so this is a real case, not a defensive branch.)
function statusOf(q, picked) {
  if (!q.correctAnswer) return 'unknown';
  if (picked == null) return 'unanswered';
  return String(picked) === String(q.correctAnswer) ? 'correct' : 'incorrect';
}

const BADGE = {
  correct: { label: 'Correct', fg: C.mint, bg: C.mintSoft },
  incorrect: { label: 'Incorrect', fg: C.peach, bg: C.peachSoft },
  unanswered: { label: 'Unanswered', fg: C.sand, bg: C.sandSoft },
  unknown: { label: 'Not graded', fg: C.textMuted, bg: S.hair },
};

export default function OnlineTestReview({ title = 'Review', questions = [], answers = {}, onBack = () => {} }) {
  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={st.header}>
        <Pressable onPress={onBack} hitSlop={12} style={st.back}>
          <Text style={st.backTxt}>{'‹'}</Text>
        </Pressable>
        <Text style={st.title} numberOfLines={1}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
        {questions.length === 0 && (
          <Text style={st.empty}>Nothing to review.</Text>
        )}

        {questions.map((q, i) => {
          const picked = answers[q.id];
          const status = statusOf(q, picked);
          const badge = BADGE[status];
          return (
            <View key={q.id ?? i} style={st.card}>
              <View style={st.cardTop}>
                <Text style={st.qNum}>Q{i + 1}</Text>
                <View style={[st.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[st.badgeTxt, { color: badge.fg }]}>{badge.label}</Text>
                </View>
              </View>

              <Text style={st.qText}>{q.text}</Text>

              <View style={{ gap: 8, marginTop: 10 }}>
                {(q.options || []).map((o) => {
                  const isCorrect = q.correctAnswer && String(o.key) === String(q.correctAnswer);
                  const isPicked = picked != null && String(o.key) === String(picked);
                  const tint = isCorrect ? C.mint : (isPicked ? C.peach : C.text);
                  return (
                    <View
                      key={o.key}
                      style={[
                        st.opt,
                        isCorrect && { borderColor: C.mint, backgroundColor: C.mintSoft },
                        isPicked && !isCorrect && { borderColor: C.peach, backgroundColor: C.peachSoft },
                      ]}
                    >
                      <Text style={[st.optKey, { color: tint }]}>{o.key}</Text>
                      <Text style={[st.optLabel, { color: tint }]}>{o.label}</Text>
                      {isCorrect && <Text style={[st.mark, { color: C.mint }]}>{'✓'}</Text>}
                      {isPicked && !isCorrect && <Text style={[st.mark, { color: C.peach }]}>{'✕'}</Text>}
                    </View>
                  );
                })}
              </View>

              {status === 'unknown' && (
                <Text style={st.note}>The answer key for this question isn{'’'}t available yet.</Text>
              )}

              {!!q.explanation && (
                <View style={st.solBox}>
                  <Text style={st.solTitle}>Solution</Text>
                  <Text style={st.solTxt}>{q.explanation}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  back: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 30, lineHeight: 32, color: C.text },
  title: { flex: 1, fontFamily: FONT.bold, fontSize: 16, color: C.text },
  body: { padding: 16, gap: 14, paddingBottom: 40 },
  empty: { textAlign: 'center', color: C.textMuted, fontFamily: FONT.semibold, marginTop: 40 },
  card: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  qNum: { fontFamily: FONT.bold, fontSize: 13, color: C.textMuted },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt: { fontFamily: FONT.bold, fontSize: 11.5 },
  qText: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 22, color: C.text },
  opt: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  optKey: { fontFamily: FONT.bold, fontSize: 13, width: 16 },
  optLabel: { flex: 1, fontFamily: FONT.regular, fontSize: 14, lineHeight: 20 },
  mark: { fontFamily: FONT.bold, fontSize: 15 },
  note: { marginTop: 10, fontFamily: FONT.semibold, fontSize: 12.5, color: C.textMuted, fontStyle: 'italic' },
  solBox: { marginTop: 12, backgroundColor: C.bg, borderRadius: 10, padding: 12 },
  solTitle: { fontFamily: FONT.bold, fontSize: 12.5, color: C.textMuted, marginBottom: 4 },
  solTxt: { fontFamily: FONT.regular, fontSize: 13.5, lineHeight: 20, color: C.text },
});
