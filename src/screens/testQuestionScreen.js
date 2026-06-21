import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Modal,
} from 'react-native';
// Icons: uses @expo/vector-icons (bundled with Expo).
// Bare RN: `npm i react-native-vector-icons` and import from 'react-native-vector-icons/Ionicons'.
import { Ionicons } from '@expo/vector-icons';

// ----- Theme -----
const COLORS = {
  purple: '#534AB7',
  purpleLight: '#EEEDFE',
  purpleTint: '#F6F5FE',
  purpleMid: '#7F77DD',
  purpleDeep: '#26215C',
  purpleBorder: '#CECBF6',
  text: '#2C2C2A',
  textSecondary: '#444441',
  textMuted: '#5F5E5A',
  textTertiary: '#9A9A9A',
  disabled: '#B4B2A9',
  border: '#ECECEC',
  optionBadge: '#F1EFE8',
  white: '#FFFFFF',
  pageBg: '#F4F5FB',
  overlay: 'rgba(40,33,92,0.35)',
};

// ----- Default content (override via props) -----
const DEFAULT_QUESTIONS = [
  {
    id: 'q1',
    text: 'The existence of a wide range of different types of organisms in a given place at a given time is________.',
    options: [
      { key: 'A', label: 'Biodiversity' },
      { key: 'B', label: 'Zoo' },
      { key: 'C', label: 'Museum' },
      { key: 'D', label: 'Park' },
    ],
  },
  {
    id: 'q2',
    text: 'Which of the following is the basic unit of life?',
    options: [
      { key: 'A', label: 'Tissue' },
      { key: 'B', label: 'Organ' },
      { key: 'C', label: 'Cell' },
      { key: 'D', label: 'Organism' },
    ],
  },
  {
    id: 'q3',
    text: 'The process by which plants make their own food is called________.',
    options: [
      { key: 'A', label: 'Respiration' },
      { key: 'B', label: 'Photosynthesis' },
      { key: 'C', label: 'Digestion' },
      { key: 'D', label: 'Transpiration' },
    ],
  },
  {
    id: 'q4',
    text: 'Which gas do humans primarily exhale during respiration?',
    options: [
      { key: 'A', label: 'Oxygen' },
      { key: 'B', label: 'Nitrogen' },
      { key: 'C', label: 'Hydrogen' },
      { key: 'D', label: 'Carbon dioxide' },
    ],
  },
  {
    id: 'q5',
    text: 'The powerhouse of the cell is the________.',
    options: [
      { key: 'A', label: 'Nucleus' },
      { key: 'B', label: 'Ribosome' },
      { key: 'C', label: 'Mitochondria' },
      { key: 'D', label: 'Chloroplast' },
    ],
  },
];

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TestQuestionScreen({
  title = 'Mock Test - 01',
  bannerText = 'Attempt any 20 questions',
  questions = DEFAULT_QUESTIONS,
  durationSeconds = 30 * 60,
  onExit = () => {},
  onSubmit = () => {},
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: optionKey }
  const [paletteVisible, setPaletteVisible] = useState(false);
  const [remaining, setRemaining] = useState(durationSeconds);
  const timerRef = useRef(null);

  const total = questions.length;
  const current = questions[index];
  const selected = answers[current.id];
  const isLast = index === total - 1;
  const answeredCount = Object.keys(answers).length;

  // Countdown timer -> auto-submit at zero
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (key) =>
    setAnswers((a) => ({ ...a, [current.id]: key }));

  const clearAnswer = () =>
    setAnswers((a) => {
      const next = { ...a };
      delete next[current.id];
      return next;
    });

  const goPrev = () => index > 0 && setIndex((i) => i - 1);
  const goNext = () => (isLast ? handleSubmit(false) : setIndex((i) => i + 1));
  const jumpTo = (i) => {
    setIndex(i);
    setPaletteVisible(false);
  };

  const handleSubmit = (auto) => {
    clearInterval(timerRef.current);
    onSubmit({ answers, answeredCount, total, autoSubmitted: !!auto });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerLeft} hitSlop={8} onPress={onExit}>
          <Ionicons name="arrow-back" size={22} color={COLORS.purpleDeep} />
          <Text style={styles.headerTitle}>{title}</Text>
        </Pressable>
        <View style={styles.timerChip}>
          <Ionicons name="time-outline" size={14} color={COLORS.purple} />
          <Text style={styles.timerText}>{formatTime(remaining)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.progress}>
          Question {index + 1} of {total}
        </Text>

        <View style={styles.banner}>
          <Text style={styles.bannerText}>{bannerText}</Text>
        </View>

        <Text style={styles.questionText}>{current.text}</Text>

        <View style={styles.options}>
          {current.options.map((opt) => {
            const active = selected === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => select(opt.key)}
                style={[styles.option, active && styles.optionActive]}
              >
                <View style={[styles.optBadge, active && styles.optBadgeActive]}>
                  <Text style={[styles.optBadgeText, active && styles.optBadgeTextActive]}>
                    {opt.key}
                  </Text>
                </View>
                <Text style={[styles.optLabel, active && styles.optLabelActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.clearWrap}
          hitSlop={6}
          disabled={!selected}
          onPress={clearAnswer}
        >
          <Text style={[styles.clearText, !selected && styles.clearTextOff]}>
            Clear Answer
          </Text>
        </Pressable>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.navBtn, index === 0 && styles.navBtnDisabled]}
          disabled={index === 0}
          onPress={goPrev}
        >
          <Ionicons
            name="arrow-back"
            size={15}
            color={index === 0 ? COLORS.disabled : COLORS.textSecondary}
          />
          <Text style={[styles.navBtnText, index === 0 && styles.navBtnTextDisabled]}>
            Previous
          </Text>
        </Pressable>

        <Pressable style={styles.paletteBtn} onPress={() => setPaletteVisible(true)}>
          <Ionicons name="grid-outline" size={18} color={COLORS.purple} />
        </Pressable>

        <Pressable style={styles.nextBtn} onPress={goNext}>
          <Text style={styles.nextBtnText}>{isLast ? 'Submit' : 'Next'}</Text>
          {!isLast && <Ionicons name="arrow-forward" size={15} color={COLORS.white} />}
        </Pressable>
      </View>

      {/* Question palette */}
      <Modal
        visible={paletteVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaletteVisible(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setPaletteVisible(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Question Palette</Text>
              <Text style={styles.sheetCount}>
                {answeredCount}/{total} answered
              </Text>
            </View>

            <View style={styles.paletteGrid}>
              {questions.map((q, i) => {
                const isCurrent = i === index;
                const isAnswered = answers[q.id] != null;
                return (
                  <Pressable
                    key={q.id}
                    onPress={() => jumpTo(i)}
                    style={[
                      styles.paletteCell,
                      isAnswered && styles.paletteAnswered,
                      isCurrent && styles.paletteCurrent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.paletteNum,
                        isAnswered && styles.paletteNumAnswered,
                        isCurrent && styles.paletteNumCurrent,
                      ]}
                    >
                      {i + 1}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <Legend color={COLORS.purple} label="Answered" />
              <Legend color={COLORS.white} border={COLORS.purple} label="Current" />
              <Legend color={COLORS.optionBadge} label="Not answered" />
            </View>

            <Pressable style={styles.submitBtn} onPress={() => handleSubmit(false)}>
              <Text style={styles.submitBtnText}>Finish Test</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Legend({ color, border, label }) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendSwatch,
          { backgroundColor: color, borderColor: border || COLORS.border },
        ]}
      />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.pageBg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 15, fontWeight: '500', color: COLORS.purpleDeep },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.purpleLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  timerText: { fontSize: 12.5, fontWeight: '500', color: COLORS.purple },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },

  progress: { fontSize: 12, color: COLORS.textTertiary, marginBottom: 10 },
  banner: {
    backgroundColor: COLORS.purpleLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bannerText: { fontSize: 12.5, fontWeight: '500', color: '#3C3489' },

  questionText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: COLORS.text,
    marginTop: 14,
  },

  options: { marginTop: 14, gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  optionActive: {
    borderWidth: 1.5,
    borderColor: COLORS.purple,
    backgroundColor: COLORS.purpleTint,
  },
  optBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: COLORS.optionBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optBadgeActive: { backgroundColor: COLORS.purple },
  optBadgeText: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  optBadgeTextActive: { color: COLORS.white },
  optLabel: { fontSize: 14, color: COLORS.textSecondary },
  optLabelActive: { color: COLORS.purpleDeep, fontWeight: '500' },

  clearWrap: { alignSelf: 'flex-end', marginTop: 12, paddingVertical: 4 },
  clearText: { fontSize: 13, fontWeight: '500', color: COLORS.purple },
  clearTextOff: { color: COLORS.disabled },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  navBtnDisabled: { opacity: 0.6 },
  navBtnText: { fontSize: 13.5, color: COLORS.textSecondary },
  navBtnTextDisabled: { color: COLORS.disabled },
  paletteBtn: {
    width: 42,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    borderRadius: 10,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  nextBtnText: { fontSize: 13.5, fontWeight: '500', color: COLORS.white },

  // Palette sheet
  sheetOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 16, fontWeight: '500', color: COLORS.purpleDeep },
  sheetCount: { fontSize: 12.5, color: COLORS.textMuted },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paletteCell: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.optionBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteAnswered: { backgroundColor: COLORS.purple },
  paletteCurrent: { borderWidth: 2, borderColor: COLORS.purple },
  paletteNum: { fontSize: 14, fontWeight: '500', color: COLORS.textMuted },
  paletteNumAnswered: { color: COLORS.white },
  paletteNumCurrent: { color: COLORS.purple },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },
  legendText: { fontSize: 12, color: COLORS.textMuted },

  submitBtn: {
    marginTop: 18,
    backgroundColor: COLORS.purple,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: { fontSize: 15, fontWeight: '500', color: COLORS.white },
});