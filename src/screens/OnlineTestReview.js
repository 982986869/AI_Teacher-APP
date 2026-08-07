// OnlineTestReview.js
// Question-by-question review shown after an online test is submitted, from the
// "Review Questions" button on MockResultScreen. Palette matches MockResultScreen —
// both import the `timed-test-dark` tokens, so the runner → result → review journey
// is one surface.
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
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar, SafeAreaView, Platform } from 'react-native';
import { ChevronLeft, Check, X } from 'lucide-react-native';
import { TT, TTF, Rich } from '../components/timedTestDark';

const C = {
  ...TT,
  green: '#00FF88',
  greenSoft: 'rgba(0,255,136,0.102)',
  redSoft: 'rgba(255,51,102,0.102)',
  yellow: '#F7B500',
  yellowSoft: 'rgba(247,181,0,0.102)',
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
  correct: { label: 'Correct', fg: C.green, bg: C.greenSoft },
  incorrect: { label: 'Incorrect', fg: C.red, bg: C.redSoft },
  unanswered: { label: 'Unanswered', fg: C.yellow, bg: C.yellowSoft },
  unknown: { label: 'Not graded', fg: C.sub, bg: C.hair },
};

export default function OnlineTestReview({ title = 'Review', questions = [], answers = {}, onBack = () => {} }) {
  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.canvas} />
      {Platform.OS === 'android' && <View style={st.androidStatusPad} />}

      <View style={st.header}>
        <Pressable onPress={onBack} hitSlop={10} style={st.back}
          accessibilityRole="button" accessibilityLabel="Back to result">
          <ChevronLeft size={16} color={C.ink} strokeWidth={2} />
        </Pressable>
        <Text style={st.title} numberOfLines={2}>{title}</Text>
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
                <View style={[st.badge, { backgroundColor: badge.bg, borderColor: badge.fg }]}>
                  <Text style={[st.badgeTxt, { color: badge.fg }]}>{badge.label}</Text>
                </View>
              </View>

              <Rich value={q.text} fontSize={15} lineHeight={22} color={C.ink} family={TTF.head} imgHeight={170} />

              <View style={st.opts}>
                {(q.options || []).map((o) => {
                  const isCorrect = q.correctAnswer && String(o.key) === String(q.correctAnswer);
                  const isPicked = picked != null && String(o.key) === String(picked);
                  // One place decides a row's whole appearance: the key is graded
                  // green, a wrong pick red, and everything else stays resting.
                  const tone = isCorrect
                    ? { edge: C.green, fill: C.greenSoft, Mark: Check }
                    : (isPicked ? { edge: C.red, fill: C.redSoft, Mark: X } : null);
                  return (
                    <View key={o.key} style={[st.opt, tone && { borderColor: tone.edge, backgroundColor: tone.fill }]}>
                      <View style={[st.letterBadge, tone && { backgroundColor: tone.edge }]}>
                        <Text style={[st.letterTxt, tone && { color: C.onBright }]}>{o.key}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Rich value={o.label} fontSize={14} lineHeight={18}
                          color={tone ? C.ink : C.sub} family={TTF.reg} imgHeight={92} />
                      </View>
                      {tone && <tone.Mark size={16} color={tone.edge} strokeWidth={2} />}
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
                  <Rich value={q.explanation} fontSize={13} lineHeight={19} color={C.sub} family={TTF.reg} imgHeight={140} />
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
  safe: { flex: 1, backgroundColor: C.canvas },
  androidStatusPad: { height: 24, backgroundColor: C.canvas },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  back: {
    width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: C.hair,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 16, lineHeight: 22, fontFamily: TTF.head, color: C.ink },

  body: { paddingHorizontal: 16, paddingTop: 4, gap: 12, paddingBottom: 32 },
  empty: { textAlign: 'center', fontSize: 13, fontFamily: TTF.reg, color: C.sub, marginTop: 40 },

  card: { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.hair, padding: 15, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qNum: { fontSize: 13, lineHeight: 17, fontFamily: TTF.bold, color: C.sub },
  badge: { borderRadius: 6, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 8 },
  badgeTxt: { fontSize: 11, lineHeight: 14, fontFamily: TTF.semi },

  // The runner's option-card recipe, so a reviewed row and an answered one read as
  // the same object: padding 13 + a 1px inner-aligned border lands both on 14.
  opts: { gap: 8 },
  opt: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1,
    borderColor: C.hair, backgroundColor: C.canvas, padding: 13,
  },
  letterBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.hair, alignItems: 'center', justifyContent: 'center' },
  letterTxt: { fontSize: 13, lineHeight: 16, fontFamily: TTF.head, color: C.ink },

  note: { fontSize: 12, lineHeight: 16, fontFamily: TTF.semi, color: C.sub, fontStyle: 'italic' },
  solBox: { backgroundColor: C.canvas, borderRadius: 12, borderWidth: 1, borderColor: C.hair, padding: 11, gap: 4 },
  solTitle: { fontSize: 12, lineHeight: 16, fontFamily: TTF.bold, color: C.sub },
});
