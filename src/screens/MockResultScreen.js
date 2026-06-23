// MockResultScreen.js
// Shown automatically after a mock is submitted. Pastel mint & peach.
// Layout mirrors the Examin8 result template: title, action buttons,
// donut (Correct / Incorrect / Unanswered) + per-section bars + stat cards.
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
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

// ---- pastel mint & peach palette ----
const C = {
  bg: '#F4FBF8',
  card: '#FFFFFF',
  border: '#E6F2EC',
  text: '#2E4039',
  textMuted: '#7C8C85',
  mint: '#7BD3B0',      // correct
  mintSoft: '#D6F2E7',
  peach: '#F6A98C',     // incorrect
  peachSoft: '#FBE0D5',
  sand: '#F3D9A4',      // unanswered
  sandSoft: '#FBEFD6',
  headerA: '#CDEFE2',
  headerB: '#FBE0D5',
};

function Donut({ correct, incorrect, unanswered, size = 168, stroke = 26 }) {
  const total = Math.max(1, correct + incorrect + unanswered);
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const segs = [
    { val: correct, color: C.mint },
    { val: incorrect, color: C.peach },
    { val: unanswered, color: C.sand },
  ];
  let offset = 0;
  const pct = Math.round((correct / total) * 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          <Circle cx={cx} cy={cy} r={r} stroke={C.border} strokeWidth={stroke} fill="none" />
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
        <View style={[styles.barSeg, { width: w(s.correct), backgroundColor: C.mint }]} />
        <View style={[styles.barSeg, { width: w(s.incorrect), backgroundColor: C.peach }]} />
        <View style={[styles.barSeg, { width: w(s.unanswered), backgroundColor: C.sand }]} />
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
  onReview = () => {},
  onRetake = () => {},
  onClose = () => {},
}) {
  const { correct, incorrect, unanswered, total, sections = [] } = result;
  const attempted = correct + incorrect;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.headerA} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} hitSlop={8} onPress={onClose}>
          <Text style={styles.closeTxt}>{'\u2715'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Donut card */}
        <View style={styles.card}>
          <Donut correct={correct} incorrect={incorrect} unanswered={unanswered} />
          <View style={styles.legendRow}>
            <Legend color={C.mint} label="Correct" value={correct} />
            <Legend color={C.peach} label="Incorrect" value={incorrect} />
            <Legend color={C.sand} label="Unanswered" value={unanswered} />
          </View>
        </View>

        {/* Stat tiles */}
        <View style={styles.tiles}>
          <Tile bg={C.mintSoft} num={`${correct}/${total}`} label="Score" />
          <Tile bg={C.peachSoft} num={`${accuracy}%`} label="Accuracy" />
          <Tile bg={C.sandSoft} num={`${attempted}/${total}`} label="Attempted" />
        </View>

        {/* Section breakdown */}
        <Text style={styles.sectionTitle}>Section-wise breakdown</Text>
        <View style={styles.card}>
          {sections.map((s) => <SectionBar key={s.id} s={s} />)}
          <View style={styles.miniLegend}>
            <Legend small color={C.mint} label="Correct" />
            <Legend small color={C.peach} label="Incorrect" />
            <Legend small color={C.sand} label="Unanswered" />
          </View>
        </View>

        {/* Actions */}
        <Pressable style={styles.primaryBtn} onPress={onReview}>
          <Text style={styles.primaryTxt}>Review Questions</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={onRetake}>
          <Text style={styles.secondaryTxt}>Retake Test</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Legend({ color, label, value, small }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }, small && { width: 9, height: 9 }]} />
      <Text style={[styles.legendLabel, small && { fontSize: 11 }]}>
        {label}{value != null ? ` · ${value}` : ''}
      </Text>
    </View>
  );
}

function Tile({ bg, num, label }) {
  return (
    <View style={[styles.tile, { backgroundColor: bg }]}>
      <Text style={styles.tileNum}>{num}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.headerA, paddingTop: 48, paddingBottom: 16, paddingHorizontal: 14 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 16, color: C.text, fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: C.text },

  body: { padding: 16 },

  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18, alignItems: 'center', marginBottom: 14 },

  donutPct: { fontSize: 30, fontWeight: '900', color: C.text },
  donutSub: { fontSize: 12, color: C.textMuted, marginTop: 2, fontWeight: '600' },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 12.5, color: C.text, fontWeight: '600' },

  tiles: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tile: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  tileNum: { fontSize: 18, fontWeight: '900', color: C.text },
  tileLabel: { fontSize: 11, color: C.textMuted, fontWeight: '700', marginTop: 3 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 10, marginLeft: 2 },

  secRow: { width: '100%', marginBottom: 14 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  secName: { fontSize: 13, fontWeight: '800', color: C.text },
  secMeta: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  barTrack: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: C.border },
  barSeg: { height: '100%' },
  miniLegend: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 4 },

  primaryBtn: { backgroundColor: C.mint, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  primaryTxt: { color: '#1F3B30', fontSize: 15, fontWeight: '800' },
  secondaryBtn: { backgroundColor: C.peachSoft, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  secondaryTxt: { color: '#7A3B26', fontSize: 15, fontWeight: '800' },
});