import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, StatusBar, SafeAreaView, Modal,
} from 'react-native';
import { S } from '../theme/studentUI';
import { FONT } from '../constants/fonts';
import { Ionicons } from '@expo/vector-icons';
import MathText from '../components/MathText';

// Render question/option content that may carry LaTeX ({tex}…{/tex}) or HTML as
// MathText (MathJax SVG); plain strings fall back to a normal <Text> so the
// text-only banks (Chemistry/Physics/Biology online tests) are unchanged and
// keep their text styling. Maths online tests pass HTML+{tex} so formulas render.
const hasMath = (s) => typeof s === 'string' && (/\{tex\}/.test(s) || /<[a-z!/][^>]*>/i.test(s));
const RichText = ({ value, style, fontSize, color }) =>
  hasMath(value)
    ? <MathText value={value} fontSize={fontSize} color={color} style={style} />
    : <Text style={style}>{value}</Text>;

// ----- Theme (dark, matches app) -----
const COLORS = {
  dark: S.ink,
  darkSoft: S.ink,
  accentTint: S.hair,
  text: S.ink,
  textSecondary: S.ink,
  textMuted: S.muted,
  textTertiary: S.muted,
  disabled: S.faint,
  border: S.border,
  borderSoft: S.hair,
  optionBadge: S.hair,
  banner: '#FBF3DA',
  bannerText: '#8A6D1B',
  white: '#FFFFFF',
  pageBg: S.hair,
  overlay: 'rgba(0,0,0,0.4)',
};

const SECTION_ORDER = ['A', 'B', 'C'];
const SECTION_RULE = {
  A: 'Attempt any 20 questions',
  B: 'Attempt any 20 questions',
  C: 'Attempt any 5 questions',
};

const DEFAULT_QUESTIONS = [
  { id: 'q1', section: 'A', text: 'According to IUPAC nomenclature for elements with Z greater than 100, the root \u2018sept\u2019 corresponds to the digit:', options: [ { key: 'A', label: '7' }, { key: 'B', label: '8' }, { key: 'C', label: '4' }, { key: 'D', label: '3' } ] },
  { id: 'q2', section: 'A', text: 'Which of the following is the basic unit of life?', options: [ { key: 'A', label: 'Tissue' }, { key: 'B', label: 'Organ' }, { key: 'C', label: 'Cell' }, { key: 'D', label: 'Organism' } ] },
  { id: 'q3', section: 'B', text: 'The process by which plants make their own food is called:', options: [ { key: 'A', label: 'Respiration' }, { key: 'B', label: 'Photosynthesis' }, { key: 'C', label: 'Digestion' }, { key: 'D', label: 'Transpiration' } ] },
  { id: 'q4', section: 'C', text: 'Which gas do humans primarily exhale during respiration?', options: [ { key: 'A', label: 'Oxygen' }, { key: 'B', label: 'Nitrogen' }, { key: 'C', label: 'Hydrogen' }, { key: 'D', label: 'Carbon dioxide' } ] },
];

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TestQuestionScreen({
  title = 'Mock Test - 01',
  bannerText,                 // if given, overrides the per-section rule
  questions = DEFAULT_QUESTIONS,
  durationSeconds = 90 * 60,
  onExit = () => {},
  onSubmit = () => {},
}) {
  // Group questions by section (A/B/C). Questions with no section -> 'A'.
  const sections = useMemo(() => {
    const map = {};
    questions.forEach((q, i) => {
      const sec = (q.section && SECTION_ORDER.includes(q.section)) ? q.section : 'A';
      (map[sec] = map[sec] || []).push({ ...q, id: q.id ?? `q${i}`, _section: sec });
    });
    return SECTION_ORDER.filter((s) => map[s] && map[s].length).map((s) => ({
      id: s, rule: SECTION_RULE[s], questions: map[s],
    }));
  }, [questions]);

  const [activeSec, setActiveSec] = useState(sections[0]?.id || 'A');
  const [index, setIndex] = useState(0); // index within active section
  const [answers, setAnswers] = useState({});
  const [paletteVisible, setPaletteVisible] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [remaining, setRemaining] = useState(durationSeconds);
  const timerRef = useRef(null);

  const section = sections.find((s) => s.id === activeSec) || sections[0];
  const secQuestions = section ? section.questions : [];
  const total = secQuestions.length;
  const current = secQuestions[index] || secQuestions[0];
  const selected = current ? answers[current.id] : undefined;
  const isLastInSection = index === total - 1;
  const answeredCount = Object.keys(answers).length;
  const grandTotal = questions.length;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((r) => { if (r <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; } return r - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (key) => current && setAnswers((a) => ({ ...a, [current.id]: key }));
  const clearAnswer = () => current && setAnswers((a) => { const n = { ...a }; delete n[current.id]; return n; });

  const switchSection = (secId) => { setActiveSec(secId); setIndex(0); };
  const goPrev = () => index > 0 && setIndex((i) => i - 1);
  const goNext = () => {
    if (!isLastInSection) { setIndex((i) => i + 1); return; }
    // move to next section if any, else submit
    const pos = sections.findIndex((s) => s.id === activeSec);
    if (pos < sections.length - 1) { switchSection(sections[pos + 1].id); }
    else setConfirmFinish(true);
  };
  const jumpTo = (i) => { setIndex(i); setPaletteVisible(false); };

  const handleSubmit = (auto) => {
    clearInterval(timerRef.current);
    onSubmit({ answers, answeredCount, total: grandTotal, questions, autoSubmitted: !!auto });
  };

  const isVeryLast = (() => {
    const pos = sections.findIndex((s) => s.id === activeSec);
    return pos === sections.length - 1 && isLastInSection;
  })();

  if (!current) {
    return (
      <SafeAreaView style={styles.safe}><StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
        <View style={styles.header}><Text style={styles.headerTitle}>{title}</Text></View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: COLORS.textMuted }}>No questions available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Top bar: close + timer + Submit */}
      <View style={styles.topBar}>
        <Pressable style={styles.closeBtn} hitSlop={8} onPress={onExit}>
          <Ionicons name="close" size={18} color={COLORS.white} />
        </Pressable>
        <View style={styles.topTimer}>
          <Ionicons name="time-outline" size={15} color={COLORS.white} />
          <Text style={styles.topTimerText}>{formatTime(remaining)}</Text>
        </View>
        <Pressable style={styles.submitTop} onPress={() => setConfirmFinish(true)}>
          <Text style={styles.submitTopText}>Submit</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* progress + per-question timer */}
          <View style={styles.cardTopRow}>
            <Text style={styles.progress}>{index + 1} / {total}</Text>
            <Text style={styles.miniTimer}>{formatTime(remaining).slice(3)}</Text>
          </View>

          {/* Section tabs */}
          <View style={styles.tabs}>
            {sections.map((sec) => {
              const on = sec.id === activeSec;
              return (
                <Pressable key={sec.id} onPress={() => switchSection(sec.id)} style={[styles.tab, on && styles.tabOn]}>
                  <Text style={[styles.tabText, on && styles.tabTextOn]}>Section {sec.id}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{bannerText || section.rule}</Text>
          </View>

          {/* Question */}
          <RichText value={current.text} style={styles.questionText} fontSize={15} color={COLORS.text} />

          {/* Options */}
          <View style={styles.options}>
            {current.options.map((opt) => {
              const active = selected === opt.key;
              return (
                <Pressable key={opt.key} onPress={() => select(opt.key)} style={[styles.option, active && styles.optionActive]}>
                  <Text style={[styles.optKey, active && styles.optKeyActive]}>{opt.key}</Text>
                  <RichText
                    value={opt.label}
                    style={[styles.optLabel, active && styles.optLabelActive]}
                    fontSize={14.5}
                    color={active ? COLORS.dark : COLORS.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.clearWrap} hitSlop={6} disabled={!selected} onPress={clearAnswer}>
            <Text style={[styles.clearText, !selected && styles.clearTextOff]}>Clear Answer</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Pressable style={[styles.navBtn, index === 0 && styles.navBtnDisabled]} disabled={index === 0} onPress={goPrev}>
          <Ionicons name="arrow-back" size={15} color={index === 0 ? COLORS.disabled : COLORS.textSecondary} />
          <Text style={[styles.navBtnText, index === 0 && styles.navBtnTextDisabled]}>Previous</Text>
        </Pressable>

        <Pressable style={styles.paletteBtn} onPress={() => setPaletteVisible(true)}>
          <Ionicons name="menu" size={20} color={COLORS.text} />
        </Pressable>

        <Pressable style={styles.nextBtn} onPress={goNext}>
          <Text style={styles.nextBtnText}>{isVeryLast ? 'Submit' : 'Next'}</Text>
          {!isVeryLast && <Ionicons name="arrow-forward" size={15} color={COLORS.white} />}
        </Pressable>
      </View>

      {/* Finish confirmation */}
      <Modal visible={confirmFinish} transparent animationType="fade" onRequestClose={() => setConfirmFinish(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Finish Test?</Text>
            <Text style={styles.confirmSub}>
              You've answered {answeredCount} of {grandTotal} questions.
              {answeredCount < grandTotal ? ' Unanswered questions will be marked as skipped.' : ''}
            </Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.confirmCancel} onPress={() => setConfirmFinish(false)}>
                <Text style={styles.confirmCancelTxt}>Keep Going</Text>
              </Pressable>
              <Pressable style={styles.confirmFinishBtn} onPress={() => { setConfirmFinish(false); handleSubmit(false); }}>
                <Text style={styles.confirmFinishTxt}>Finish Test</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Palette */}
      <Modal visible={paletteVisible} transparent animationType="slide" onRequestClose={() => setPaletteVisible(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setPaletteVisible(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Section {activeSec} \u00B7 Question Palette</Text>
              <Text style={styles.sheetCount}>{answeredCount}/{grandTotal} answered</Text>
            </View>
            <View style={styles.paletteGrid}>
              {secQuestions.map((q, i) => {
                const isCurrent = i === index;
                const isAnswered = answers[q.id] != null;
                return (
                  <Pressable key={q.id} onPress={() => jumpTo(i)}
                    style={[styles.paletteCell, isAnswered && styles.paletteAnswered, isCurrent && styles.paletteCurrent]}>
                    <Text style={[styles.paletteNum, isAnswered && styles.paletteNumAnswered, isCurrent && styles.paletteNumCurrent]}>{i + 1}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.legendRow}>
              <Legend color={COLORS.dark} label="Answered" />
              <Legend color={COLORS.white} border={COLORS.dark} label="Current" />
              <Legend color={COLORS.optionBadge} label="Not answered" />
            </View>
            <Pressable style={styles.submitBtn} onPress={() => { setPaletteVisible(false); setConfirmFinish(true); }}>
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
      <View style={[styles.legendSwatch, { backgroundColor: color, borderColor: border || COLORS.border }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.pageBg },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 48, paddingBottom: 12, backgroundColor: COLORS.dark },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  topTimer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topTimerText: { color: COLORS.white, fontSize: 16, fontFamily: FONT.bold, letterSpacing: 0.5 },
  submitTop: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  submitTopText: { color: COLORS.dark, fontSize: 13, fontFamily: FONT.extrabold },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.borderSoft, padding: 16 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  progress: { fontSize: 13, fontFamily: FONT.bold, color: COLORS.text },
  miniTimer: { fontSize: 12, color: COLORS.textTertiary, fontFamily: FONT.semibold },

  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.optionBadge },
  tabOn: { backgroundColor: COLORS.dark },
  tabText: { fontSize: 12, fontFamily: FONT.bold, color: COLORS.textMuted },
  tabTextOn: { color: COLORS.white },

  banner: { backgroundColor: COLORS.banner, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  bannerText: { fontSize: 12.5, fontFamily: FONT.semibold, color: COLORS.bannerText },

  questionText: { fontSize: 15, lineHeight: 23, color: COLORS.text, marginTop: 14 },

  options: { marginTop: 14, gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: COLORS.white },
  optionActive: { borderWidth: 1.5, borderColor: COLORS.dark, backgroundColor: COLORS.accentTint },
  optKey: { fontSize: 13, fontFamily: FONT.bold, color: COLORS.textMuted, width: 18 },
  optKeyActive: { color: COLORS.dark },
  optLabel: { flex: 1, fontSize: 14.5, color: COLORS.textSecondary },
  optLabelActive: { color: COLORS.dark, fontFamily: FONT.semibold },

  clearWrap: { alignSelf: 'flex-end', marginTop: 12, paddingVertical: 4 },
  clearText: { fontSize: 13, fontFamily: FONT.bold, color: COLORS.dark },
  clearTextOff: { color: COLORS.disabled },

  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  navBtnDisabled: { opacity: 0.6 },
  navBtnText: { fontSize: 13.5, color: COLORS.textSecondary, fontFamily: FONT.semibold },
  navBtnTextDisabled: { color: COLORS.disabled },
  paletteBtn: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.dark, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  nextBtnText: { fontSize: 13.5, fontFamily: FONT.bold, color: COLORS.white },

  sheetOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 14 },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sheetTitle: { fontSize: 15, fontFamily: FONT.bold, color: COLORS.text },
  sheetCount: { fontSize: 12.5, color: COLORS.textMuted },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paletteCell: { width: 44, height: 44, borderRadius: 10, backgroundColor: COLORS.optionBadge, alignItems: 'center', justifyContent: 'center' },
  paletteAnswered: { backgroundColor: COLORS.dark },
  paletteCurrent: { borderWidth: 2, borderColor: COLORS.dark },
  paletteNum: { fontSize: 14, fontFamily: FONT.bold, color: COLORS.textMuted },
  paletteNumAnswered: { color: COLORS.white },
  paletteNumCurrent: { color: COLORS.dark },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },
  legendText: { fontSize: 12, color: COLORS.textMuted },
  submitBtn: { marginTop: 18, backgroundColor: COLORS.dark, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontFamily: FONT.bold, color: COLORS.white },

  // finish confirmation
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  confirmCard: { width: '100%', maxWidth: 340, backgroundColor: COLORS.white, borderRadius: 18, padding: 20 },
  confirmTitle: { fontSize: 18, fontFamily: FONT.extrabold, color: COLORS.text, marginBottom: 8 },
  confirmSub: { fontSize: 13.5, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 18 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  confirmCancel: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  confirmCancelTxt: { fontSize: 14, fontFamily: FONT.bold, color: COLORS.textSecondary },
  confirmFinishBtn: { backgroundColor: COLORS.dark, paddingVertical: 11, paddingHorizontal: 20, borderRadius: 12 },
  confirmFinishTxt: { fontSize: 14, fontFamily: FONT.extrabold, color: COLORS.white },
});