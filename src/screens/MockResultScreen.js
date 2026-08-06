// MockResultScreen.js
// Shown automatically after an online test / mock is submitted — the screen that
// follows TestQuestionScreen's finish dialog.
//
// It reads as the same product as the runner it comes out of: the `timed-test-dark`
// tokens (canvas, card, hair, violet, cyan) are imported from components/timedTestDark
// rather than restated, so the two can't drift. Only the verdict hues — green for
// correct, yellow for unanswered — are local, since nothing in the runner grades.
//
// Props:
//   title        -> e.g. "Mock Test - 01 - Result"
//   result       -> {
//                     correct, incorrect, unanswered, total,
//                     sections: [{ id:'A', correct, incorrect, unanswered, total }, ...]
//                   }
//   onReview()   -> Review Questions
//   onRetake()   -> Retake Test
//   onClose()    -> back / done

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar, SafeAreaView, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { TT, TTF } from '../components/timedTestDark';

const C = {
  ...TT,
  green: '#00FF88',              // correct — the runner has no graded state to borrow from
  yellow: '#F7B500',             // unanswered
  // The ring reads "how much of this paper is graded", so the unanswered arc is
  // drawn at a fraction of its strength: a 24-of-25 blank paper otherwise renders
  // as a solid yellow donut, which shouts the one thing the student can't fix.
  yellowDim: 'rgba(247,181,0,0.22)',
  track: 'rgba(255,255,255,0.06)',
};

function Donut({ correct, incorrect, unanswered, size = 168, stroke = 22 }) {
  const total = Math.max(1, correct + incorrect + unanswered);
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const segs = [
    { val: correct, color: C.green },
    { val: incorrect, color: C.red },
    { val: unanswered, color: C.yellowDim },
  ];
  let offset = 0;
  const pct = Math.round((correct / total) * 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          <Circle cx={cx} cy={cy} r={r} stroke={C.track} strokeWidth={stroke} fill="none" />
          {segs.map((s, i) => {
            const len = (s.val / total) * circ;
            const el = (
              <Circle
                key={i}
                cx={cx} cy={cy} r={r}
                stroke={s.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={styles.donutPct}>{pct}%</Text>
        <Text style={styles.donutSub}>Score</Text>
      </View>
    </View>
  );
}

function SectionBar({ s }) {
  const total = Math.max(1, s.total);
  const w = (n) => `${(n / total) * 100}%`;
  return (
    <View style={styles.secRow}>
      <View style={styles.secHead}>
        <Text style={styles.secName}>Section {s.id}</Text>
        <Text style={styles.secMeta}>{s.correct}/{s.total} correct</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barSeg, { width: w(s.correct), backgroundColor: C.green }]} />
        <View style={[styles.barSeg, { width: w(s.incorrect), backgroundColor: C.red }]} />
        <View style={[styles.barSeg, { width: w(s.unanswered), backgroundColor: C.yellow }]} />
      </View>
    </View>
  );
}

export default function MockResultScreen({
  title = 'Mock Test - 01 - Result',
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
  const attempted = correct + incorrect;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.canvas} />
      {Platform.OS === 'android' && <View style={styles.androidStatusPad} />}

      {/* Header — the runner's close button, and the title beside it rather than
          centred, so a long "chapter — test — Result" isn't squeezed by a spacer. */}
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} hitSlop={10} onPress={onClose}
          accessibilityRole="button" accessibilityLabel="Close result">
          <X size={16} color={C.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={2}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Donut card */}
        <View style={styles.card}>
          <Donut correct={correct} incorrect={incorrect} unanswered={unanswered} />
          <View style={styles.legendRow}>
            <Legend color={C.green} label="Correct" value={correct} />
            <Legend color={C.red} label="Incorrect" value={incorrect} />
            <Legend color={C.yellow} label="Unanswered" value={unanswered} />
          </View>
        </View>

        {/* Stat tiles — the number carries the colour, the card stays the flat
            #16143F every other surface uses. */}
        <View style={styles.tiles}>
          <Tile color={C.cyan} num={`${correct}/${total}`} label="Score" />
          <Tile color={C.red} num={`${accuracy}%`} label="Accuracy" />
          <Tile color={C.violet} num={`${attempted}/${total}`} label="Attempted" />
        </View>

        {/* Section breakdown. No repeat legend under the bars — the donut's sits
            directly above and says the same thing. */}
        <Text style={styles.sectionTitle}>Section-wise breakdown</Text>
        <View style={styles.card}>
          {sections.map((s) => <SectionBar key={s.id} s={s} />)}
        </View>

        {/* Actions */}
        <Pressable style={styles.primaryBtn} onPress={onReview} accessibilityRole="button">
          <Text style={styles.primaryTxt}>Review Questions</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={onRetake} accessibilityRole="button">
          <Text style={styles.secondaryTxt}>Retake Test</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Legend({ color, label, value }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}{value != null ? ` • ${value}` : ''}</Text>
    </View>
  );
}

function Tile({ color, num, label }) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileNum, { color }]}>{num}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas },
  androidStatusPad: { height: 24, backgroundColor: C.canvas },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: C.hair,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 16, lineHeight: 22, fontFamily: TTF.head, color: C.ink },

  body: { paddingHorizontal: 16, paddingTop: 4 },

  card: {
    backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.hair,
    padding: 17, alignItems: 'center', marginBottom: 12,
  },

  donutPct: { fontSize: 32, lineHeight: 40, fontFamily: TTF.head, color: C.ink },
  donutSub: { fontSize: 12, lineHeight: 16, fontFamily: TTF.semi, color: C.sub, marginTop: 2 },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, lineHeight: 16, fontFamily: TTF.semi, color: C.ink },

  tiles: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tile: {
    flex: 1, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.hair,
    paddingVertical: 14, alignItems: 'center',
  },
  tileNum: { fontSize: 18, lineHeight: 24, fontFamily: TTF.head },
  tileLabel: { fontSize: 11, lineHeight: 14, fontFamily: TTF.semi, color: C.sub, marginTop: 3 },

  sectionTitle: { fontSize: 15, lineHeight: 22, fontFamily: TTF.head, color: C.ink, marginBottom: 10 },

  secRow: { width: '100%' },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  secName: { fontSize: 13, lineHeight: 17, fontFamily: TTF.bold, color: C.ink },
  secMeta: { fontSize: 12, lineHeight: 16, fontFamily: TTF.semi, color: C.sub },
  barTrack: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: C.track },
  barSeg: { height: '100%' },

  // The runner's Next button, full width — same violet, same glow.
  primaryBtn: {
    backgroundColor: C.violet, borderRadius: 14, height: 50, alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
    shadowColor: C.violet, shadowOpacity: 0.1451, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  primaryTxt: { fontSize: 15, lineHeight: 20, fontFamily: TTF.bold, color: C.ink },
  secondaryBtn: { height: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryTxt: { fontSize: 14, lineHeight: 18, fontFamily: TTF.bold, color: C.violet },
});
