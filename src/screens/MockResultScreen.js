// MockResultScreen.js
// Shown automatically after an online test / mock is submitted â€” the screen that
// follows TestQuestionScreen's finish dialog.
//
// A violet gradient hero carries the verdict (test name, score, one line of
// encouragement), then the dark body breaks the paper down: Correct / Wrong /
// Skipped as labelled meters, the three derived percentages, and the section split
// when the paper has sections. It reads as the same product as the runner it comes
// out of â€” the timed-test tokens are imported from components/timedTestDark rather
// than restated, so the two can't drift.
//
// Props:
//   title        -> e.g. "Mock Test - 08 - Result"
//   result       -> {
//                     correct, incorrect, unanswered, total,
//                     sections: [{ id:'A', correct, incorrect, unanswered, total }, ...]
//                   }
//   onReview()   -> Review Answers
//   onRetake()   -> Retake test
//   onClose()    -> Back to Practice

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TT, TTF } from '../components/timedTestDark';

const C = {
  ...TT,
  heroA: '#8B5CF6',              // hero gradient, top-left
  heroB: '#6D28D9',              // hero gradient, bottom-right
  wrong: '#FF3B5C',
  skipped: '#8F95B2',
  track: 'rgba(255,255,255,0.08)',
};

// One line of encouragement, chosen by score band. Copy only â€” it never restates or
// softens the numbers printed directly above it.
const verdictLine = (pct, attempted) => {
  if (!attempted) return 'You didnâ€™t attempt this one. Give it a real go â€” youâ€™ll surprise yourself.';
  if (pct >= 90) return 'Outstanding. Youâ€™ve got this cold.';
  if (pct >= 75) return 'Strong paper. A little polish and itâ€™s full marks.';
  if (pct >= 50) return 'Solid start. Review what slipped and go again.';
  if (pct >= 25) return 'Thereâ€™s a foundation here â€” the review is where it clicks.';
  return 'Keep practicing! You can do better.';
};

// "Mock Test - 08 - Result" â†’ "MOCK TEST - 08 COMPLETE". The caller appends
// "- Result" for the old header; strip it rather than making every caller change.
const heroTitle = (title) => {
  const base = String(title || '').replace(/\s*[-â€“]\s*results?\s*$/i, '').trim();
  return `${base} COMPLETE`.toUpperCase();
};

function Meter({ label, value, total, color }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <View style={styles.meter}>
      <View style={styles.meterHead}>
        <Text style={styles.meterLabel}>{label}</Text>
        <Text style={[styles.meterValue, { color }]}>{value}</Text>
      </View>
      <View
        style={styles.meterTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: value }}
      >
        {/* A non-zero count always shows a sliver, so "1 wrong out of 50" reads as
            present rather than as an empty track. */}
        {value > 0 && <View style={[styles.meterFill, { width: `${Math.max(1.5, pct)}%`, backgroundColor: color }]} />}
      </View>
    </View>
  );
}

function SectionRow({ s }) {
  const total = Math.max(1, s.total);
  const w = (n) => `${(n / total) * 100}%`;
  return (
    <View style={styles.secRow}>
      <View style={styles.meterHead}>
        <Text style={styles.secName}>Section {s.id}</Text>
        <Text style={styles.secMeta}>{s.correct}/{s.total} correct</Text>
      </View>
      <View style={styles.secTrack}>
        <View style={[styles.secSeg, { width: w(s.correct), backgroundColor: C.violet }]} />
        <View style={[styles.secSeg, { width: w(s.incorrect), backgroundColor: C.wrong }]} />
        <View style={[styles.secSeg, { width: w(s.unanswered), backgroundColor: C.track }]} />
      </View>
    </View>
  );
}

export default function MockResultScreen({
  title = 'Mock Test - 01 - Result',
  // Marks-based papers (the DB-backed Class 6-9 tests) score out of totalMarks, not
  // out of the question count. Pass both and the hero shows marks; omit them and it
  // falls back to correct/total, which is right for the offline bank.
  scoreMarks, scoreTotal,
  result = {
    correct: 0, incorrect: 0, unanswered: 0, total: 0,
    sections: [
      { id: 'A', correct: 0, incorrect: 0, unanswered: 0, total: 0 },
      { id: 'B', correct: 0, incorrect: 0, unanswered: 0, total: 0 },
      { id: 'C', correct: 0, incorrect: 0, unanswered: 0, total: 0 },
    ],
  },
  onReview = () => {},
  onRetake = () => {},
  onClose = () => {},
}) {
  const { correct, incorrect, unanswered, total, sections = [] } = result;
  const insets = useSafeAreaInsets();

  const attempted = correct + incorrect;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const completion = total ? Math.round((attempted / total) * 100) : 0;
  const score = total ? Math.round((correct / total) * 100) : 0;

  // Only paint a section split that carries real counts â€” an all-zero A/B/C block
  // (the prop default, or a paper with no sections) would read as three empty bars.
  const realSections = sections.filter((s) => s && s.total > 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.canvas} />
      <View style={{ height: insets.top, backgroundColor: C.canvas }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={[C.heroA, C.heroB]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brand}>AiLernova</Text>
          </View>
          <Text style={styles.heroTitle} numberOfLines={2}>{heroTitle(title)}</Text>

          <View style={styles.scoreRow}>
            <Text style={styles.scoreNum}>{scoreMarks != null ? scoreMarks : correct}</Text>
            <Text style={styles.scoreOf}>/{scoreTotal != null ? scoreTotal : total}</Text>
          </View>

          <Text style={styles.heroMsg}>{verdictLine(score, attempted)}</Text>
        </LinearGradient>

        {/* Breakdown */}
        <View style={styles.body}>
          <Meter label="Correct" value={correct} total={total} color={C.violet} />
          <Meter label="Wrong" value={incorrect} total={total} color={C.wrong} />
          <Meter label="Skipped" value={unanswered} total={total} color={C.skipped} />

          <Text style={styles.statsLine}>
            Accuracy <Text style={styles.statsNum}>{accuracy}%</Text>
            <Text style={styles.statsDot}>  Â·  </Text>
            Completion <Text style={styles.statsNum}>{completion}%</Text>
            <Text style={styles.statsDot}>  Â·  </Text>
            Score <Text style={styles.statsNum}>{score}%</Text>
          </Text>

          {realSections.length > 0 && (
            <View style={styles.sections}>
              {realSections.map((s) => <SectionRow key={s.id} s={s} />)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.actionRow}>
          <Pressable style={styles.ghostBtn} onPress={onReview} accessibilityRole="button">
            <Text style={styles.ghostLbl}>Review Answers</Text>
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={onClose} accessibilityRole="button">
            <Text style={styles.primaryLbl}>Back to Practice</Text>
          </Pressable>
        </View>
        {/* The design shows two buttons; retake is kept as a link because the caller
            wires a real retake (PracticeScreen remounts the runner and restarts its
            clock), and losing it would mean leaving the result to sit it again. */}
        <Pressable style={styles.retakeLink} onPress={onRetake} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.retakeLbl}>Retake test</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },

  // â”€â”€ hero â”€â”€
  hero: { paddingHorizontal: 24, paddingTop: 26, paddingBottom: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' },
  brand: { fontSize: 14, lineHeight: 18, fontFamily: TTF.bold, color: 'rgba(255,255,255,0.5)' },
  heroTitle: {
    fontSize: 16, lineHeight: 22, fontFamily: TTF.bold, color: C.ink,
    letterSpacing: 0.4, marginTop: 8,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 30 },
  scoreNum: { fontSize: 82, lineHeight: 92, fontFamily: TTF.head, color: C.ink, letterSpacing: -2 },
  scoreOf:  { fontSize: 32, lineHeight: 48, fontFamily: TTF.head, color: 'rgba(255,255,255,0.42)', marginLeft: 4 },
  heroMsg:  { fontSize: 17, lineHeight: 24, fontFamily: TTF.reg, color: 'rgba(255,255,255,0.94)', marginTop: 26 },

  // â”€â”€ breakdown â”€â”€
  body: { paddingHorizontal: 24, paddingTop: 26 },
  meter: { marginBottom: 22 },
  meterHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  meterLabel: { fontSize: 17, lineHeight: 22, fontFamily: TTF.reg, color: C.ink },
  meterValue: { fontSize: 17, lineHeight: 22, fontFamily: TTF.bold },
  meterTrack: { height: 6, borderRadius: 3, backgroundColor: C.track, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 3 },

  statsLine: { fontSize: 15, lineHeight: 22, fontFamily: TTF.reg, color: C.sub, textAlign: 'center', marginTop: 8 },
  statsNum:  { fontFamily: TTF.bold, color: C.violet },
  statsDot:  { color: C.dim },

  sections: { marginTop: 32, gap: 18 },
  secRow: {},
  secName: { fontSize: 14, lineHeight: 18, fontFamily: TTF.bold, color: C.ink },
  secMeta: { fontSize: 13, lineHeight: 18, fontFamily: TTF.semi, color: C.sub },
  secTrack: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: C.track },
  secSeg: { height: '100%' },

  // â”€â”€ actions â”€â”€
  actions: { paddingHorizontal: 24, paddingTop: 8 },
  actionRow: { flexDirection: 'row', gap: 14 },
  ghostBtn: {
    flex: 1, height: 62, borderRadius: 16, borderWidth: 1.5, borderColor: C.violet,
    alignItems: 'center', justifyContent: 'center',
  },
  ghostLbl: { fontSize: 16, lineHeight: 20, fontFamily: TTF.bold, color: C.ink },
  primaryBtn: {
    flex: 1, height: 62, borderRadius: 16, backgroundColor: C.violet,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryLbl: { fontSize: 16, lineHeight: 20, fontFamily: TTF.bold, color: C.ink },
  retakeLink: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  retakeLbl: { fontSize: 15, lineHeight: 20, fontFamily: TTF.semi, color: C.sub },
});

