// src/screens/ChapterPracticeScreen.js
// The chapter view for Important Questions / PYQ: a progress card, the question the
// student should do next, and the full series with each question's status.
//
// Every number here is REAL. GET /api/resources/progress/... returns each question
// with its marks, type and this student's status; the card's percent is solved/total
// from that same payload. Where the importer never supplied a value — a question
// with no marks or no type — the row simply omits it rather than printing "0 Marks"
// or a guessed category.
//
// "Recommended next" is the first question with no progress row, in paper order. It
// is not a ranked suggestion: there is no per-question difficulty or mastery signal
// to rank by, and a confident RECOMMENDED NEXT label on a guess would be worse than
// an honest "next one you haven't done".
//
// MOTION: New Architecture is on, so LayoutAnimation is a no-op here — everything
// below is explicit Animated, on the native driver wherever the property allows it.
// The one exception is the ring, whose SVG stroke cannot be driven natively.
//
// Props:
//   subject, chapter -> { name, slug } for each
//   sectionType      -> 'important_questions' | 'pyq'
//   classLevel       -> number
//   tabs             -> [{ key, label }] rendered under the title
//   activeTab, onTab -> which one is lit, and the caller's handler
//   onOpenQuestion(q)-> open one question (the caller owns the reader)
//   onBack()
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, StatusBar, ActivityIndicator, Modal,
  Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { ArrowLeft, ArrowRight, Check, CircleAlert } from 'lucide-react-native';
import { TT, TTF } from '../components/timedTestDark';
import { N, NSHADOW } from '../theme/nightTheme';
import { htmlToPlain } from '../utils/mathHtml';
import { getChapterQuestionProgress, setQuestionProgress } from '../api/resourcesApi';

const C = {
  // Spreads TT (the light system). The locals below were chosen against the old
  // dark canvas — panel in particular was a navy sheet, so "All Question Series"
  // rendered as dark-on-dark. All of them now come from the shared theme.
  ...TT,
  green: N.green,
  greenSoft: N.greenSoft,
  amber: N.violet,        // the accent fill (key kept; see nightTheme)
  panel: N.page,          // the sheet sits a shade off the white page
  dim: N.inkDim,          // TT has no `dim`; the unsolved bullet was rendering invisible
};

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'solved',  label: 'Solved' },
  { key: 'pending', label: 'Not started' },
];

// Entrance stagger. Capped so a 40-question chapter does not spend two seconds
// dealing itself out — past the eighth row every card lands together.
const STEP = 45;
const MAX_STEPS = 8;
const stagger = (i) => Math.min(i, MAX_STEPS) * STEP;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── entrance wrapper ────────────────────────────────────────────────────────
// One fade-and-rise, played once on mount. Refetch-on-focus replaces `data` but
// does not remount these, so coming back from a question does not replay them.
function Reveal({ delay = 0, rise = 14, style, children }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = Animated.timing(a, {
      toValue: 1, duration: 340, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    t.start();
    return () => t.stop();
  }, [a, delay]);
  return (
    <Animated.View
      style={[
        style,
        { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [rise, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ── progress ring ───────────────────────────────────────────────────────────
// The arc sweeps up to the real percent and the number counts with it. SVG stroke
// props cannot use the native driver, so this one runs on the JS driver — a single
// value on a single element, well inside what that can carry.
function Ring({ percent = 0, size = 92, stroke = 9 }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const sweep = useRef(new Animated.Value(0)).current;
  const [label, setLabel] = useState(0);

  useEffect(() => {
    const id = sweep.addListener(({ value }) => setLabel(Math.round(value)));
    const t = Animated.timing(sweep, {
      toValue: pct, duration: 900, delay: 180, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    });
    t.start();
    return () => { t.stop(); sweep.removeListener(id); };
  }, [pct, sweep]);

  const dashOffset = sweep.interpolate({ inputRange: [0, 100], outputRange: [c, 0] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.hair} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke={C.green} strokeWidth={stroke} fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={st.ringTxt}>{label}%</Text>
    </View>
  );
}

// ── one row of the series ───────────────────────────────────────────────────
// Its own component so each row owns three independent animations: the entrance,
// the press, and the tick springing in when the student marks it solved.
function QRow({ q, index, fallbackNo, onOpen, onToggle }) {
  const solved = q.status === 'solved';
  const enter = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(solved ? 1 : 0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = Animated.timing(enter, {
      toValue: 1, duration: 320, delay: stagger(index), easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    t.start();
    return () => t.stop();
  }, [enter, index]);

  // The tick does not just appear — it springs, so marking one solved reads as an
  // action that landed rather than a re-render that happened.
  useEffect(() => {
    Animated.spring(pop, {
      toValue: solved ? 1 : 0, friction: 5, tension: 180, useNativeDriver: true,
    }).start();
  }, [solved, pop]);

  const to = (v) => Animated.spring(press, { toValue: v, friction: 7, tension: 220, useNativeDriver: true }).start();

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
          { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.975] }) },
        ],
      }}
    >
      <Pressable
        style={st.row}
        onPress={() => onOpen(q)}
        onPressIn={() => to(1)}
        onPressOut={() => to(0)}
        accessibilityRole="button"
        accessibilityLabel={`Question ${index + 1}${solved ? ', solved' : ''}`}
      >
        <Pressable
          onPress={() => onToggle(q)}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: solved }}
          accessibilityLabel={solved ? 'Mark as not solved' : 'Mark as solved'}
          style={[st.dot, solved && st.dotOn]}
        >
          {solved ? (
            <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}>
              <Check size={16} color={C.green} strokeWidth={3} />
            </Animated.View>
          ) : (
            <View style={st.dotInner} />
          )}
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={st.rowHead} numberOfLines={1}>
            <Text style={st.rowQ}>{q.qNumber ? `Q${String(q.qNumber).replace(/^Q/i, '')}` : `Q${fallbackNo}`}</Text>
            {!!q.questionType && <Text style={st.rowType}>{`  ·  ${q.questionType}`}</Text>}
            {q.marks != null && <Text style={st.rowType}>{`  ·  ${q.marks} Mark${q.marks === 1 ? '' : 's'}`}</Text>}
          </Text>
          <Text style={[st.rowTxt, solved && st.rowTxtDone]} numberOfLines={1}>
            {htmlToPlain(q.questionHtml || '')}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ChapterPracticeScreen({
  subject = {}, chapter = {},
  sectionType = 'important_questions',
  classLevel,
  tabs = [], activeTab, onTab = () => {},
  onOpenQuestion = () => {},
  onBack = () => {},
}) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);   // null = loading
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const load = useCallback(() => {
    let alive = true;
    setError('');
    getChapterQuestionProgress(subject.slug, chapter.slug, sectionType, classLevel)
      .then((d) => { if (alive) setData(d || { total: 0, solved: 0, percent: 0, questions: [] }); })
      .catch(() => { if (alive) { setData({ total: 0, solved: 0, percent: 0, questions: [] }); setError('Could not load this chapter. Pull back and try again.'); } });
    return () => { alive = false; };
  }, [subject.slug, chapter.slug, sectionType, classLevel]);

  // Refetch on focus so a question solved in the reader is reflected on return.
  useFocusEffect(load);

  const questions = data?.questions || [];
  const shown = useMemo(() => {
    if (filter === 'solved') return questions.filter((q) => q.status === 'solved');
    if (filter === 'pending') return questions.filter((q) => q.status == null);
    return questions;
  }, [questions, filter]);

  const activeFilter = FILTERS.find((f) => f.key === filter) || FILTERS[0];
  const rec = data?.recommended || null;

  // Optimistic: flip the row, then persist. A failed write reverts, because a tick
  // that survives a failed save would lie about what the server holds.
  const toggleSolved = async (q) => {
    const next = q.status === 'solved' ? null : 'solved';
    setData((d) => {
      if (!d) return d;
      const qs = d.questions.map((x) => (x.id === q.id ? { ...x, status: next } : x));
      const solved = qs.filter((x) => x.status === 'solved').length;
      return { ...d, questions: qs, solved, percent: qs.length ? Math.round((solved / qs.length) * 100) : 0 };
    });
    try {
      await setQuestionProgress(q.id, next);
    } catch (_) {
      setData((d) => {
        if (!d) return d;
        const qs = d.questions.map((x) => (x.id === q.id ? { ...x, status: q.status } : x));
        const solved = qs.filter((x) => x.status === 'solved').length;
        return { ...d, questions: qs, solved, percent: qs.length ? Math.round((solved / qs.length) * 100) : 0 };
      });
    }
  };

  // The Solve CTA presses in. Its own value, so it never shares state with a row.
  const cta = useRef(new Animated.Value(0)).current;
  const ctaTo = (v) => Animated.spring(cta, { toValue: v, friction: 7, tension: 220, useNativeDriver: true }).start();

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.canvas} />
      <View style={{ height: insets.top }} />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={st.head}>
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <ArrowLeft size={24} color={C.ink} strokeWidth={2.2} />
          </Pressable>
          <Text style={st.eyebrow} numberOfLines={1}>
            {(subject.name || '').toUpperCase()}{chapter.group ? ` · ${String(chapter.group).toUpperCase()}` : ''}
          </Text>
        </View>
        <Reveal><Text style={st.title}>{chapter.name || 'Chapter'}</Text></Reveal>

        {/* Tabs */}
        {tabs.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.tabsRow}>
            {tabs.map((t, i) => {
              const on = t.key === activeTab;
              return (
                <Reveal key={t.key} delay={60 + i * 50}>
                  <Pressable
                    onPress={() => onTab(t.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    style={[st.tab, on && st.tabOn]}
                  >
                    <Text style={[st.tabTxt, on && st.tabTxtOn]}>{t.label}</Text>
                  </Pressable>
                </Reveal>
              );
            })}
          </ScrollView>
        )}

        {data === null ? (
          <View style={st.loading}><ActivityIndicator color={C.violet} /></View>
        ) : (
          <>
            {!!error && (
              <View style={st.errCard}>
                <CircleAlert size={17} color={N.dot} strokeWidth={2.2} />
                <Text style={st.errTxt}>{error}</Text>
              </View>
            )}

            {/* Progress */}
            <Reveal delay={90} style={st.card}>
              <Ring percent={data.percent} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={st.cardTitle}>Syllabus Practice</Text>
                <Text style={st.cardSub}>
                  {data.total > 0
                    ? `${data.solved} of ${data.total} questions solved`
                    : 'No questions in this chapter yet'}
                </Text>
              </View>
            </Reveal>

            {/* Recommended next — the first question with no progress row */}
            {!!rec && (
              <Reveal delay={160} style={st.recCard}>
                <View style={st.recTop}>
                  <View style={st.recTag}><Text style={st.recTagTxt}>RECOMMENDED NEXT</Text></View>
                  <Text style={st.recMeta} numberOfLines={1}>
                    {rec.qNumber ? `Q${String(rec.qNumber).replace(/^Q/i, '')}` : ''}
                    {rec.marks != null ? `${rec.qNumber ? '  ·  ' : ''}${rec.marks} Mark${rec.marks === 1 ? '' : 's'}` : ''}
                  </Text>
                </View>
                <Text style={st.recQ} numberOfLines={3}>{htmlToPlain(rec.questionHtml || '')}</Text>
                <Animated.View style={{ transform: [{ scale: cta.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) }] }}>
                  <Pressable
                    style={st.solveBtn}
                    onPress={() => onOpenQuestion(rec)}
                    onPressIn={() => ctaTo(1)}
                    onPressOut={() => ctaTo(0)}
                    accessibilityRole="button"
                  >
                    <Text style={st.solveLbl}>Solve Question</Text>
                    <ArrowRight size={19} color={C.ink} strokeWidth={2.4} />
                  </Pressable>
                </Animated.View>
              </Reveal>
            )}

            {/* The series */}
            <View style={st.panel}>
              <View style={st.grab} />
              <View style={st.panelHead}>
                <Text style={st.panelTitle}>All Question Series</Text>
                <Pressable
                  onPress={() => setFilterOpen(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  style={({ pressed }) => [st.filterChip, pressed && st.filterChipOn]}
                >
                  <Text style={st.filterLbl} numberOfLines={1}>
                    {filter === 'all' ? 'Filter By Status' : activeFilter.label}
                  </Text>
                </Pressable>
              </View>

              {shown.length === 0 ? (
                <Text style={st.empty}>
                  {questions.length === 0 ? 'No questions here yet.' : `No ${activeFilter.label.toLowerCase()} questions.`}
                </Text>
              ) : shown.map((q, i) => (
                <QRow
                  key={q.id}
                  q={q}
                  index={i}
                  fallbackNo={i + 1}
                  onOpen={onOpenQuestion}
                  onToggle={toggleSolved}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Filter sheet */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={st.scrim} onPress={() => setFilterOpen(false)} accessibilityLabel="Close" />
        <View style={[st.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={st.grabDark} />
          <Text style={st.sheetTitle}>Filter by status</Text>
          {FILTERS.map((f, i) => {
            const on = filter === f.key;
            const count = f.key === 'all'
              ? questions.length
              : questions.filter((q) => (f.key === 'solved' ? q.status === 'solved' : q.status == null)).length;
            return (
              <Reveal key={f.key} delay={60 + i * 50} rise={10}>
                <Pressable
                  onPress={() => { setFilter(f.key); setFilterOpen(false); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[st.sheetItem, on && st.sheetItemOn]}
                >
                  <Text style={[st.sheetItemTxt, on && { color: C.ink }]}>{f.label}</Text>
                  <Text style={st.sheetCount}>{count}</Text>
                  {on && <Check size={18} color={N.dot} strokeWidth={2.5} />}
                </Pressable>
              </Reveal>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },

  head: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 14 },
  eyebrow: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: TTF.semi, color: C.sub, letterSpacing: 1.4 },
  title: { fontSize: 30, lineHeight: 38, fontFamily: TTF.head, color: C.ink, paddingHorizontal: 20, marginTop: 10, letterSpacing: -0.5 },

  tabsRow: { gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  tab: {
    height: 52, paddingHorizontal: 24, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.hair,
  },
  tabOn: { backgroundColor: C.violet, borderColor: C.violet },
  tabTxt: { fontSize: 16, lineHeight: 20, fontFamily: TTF.semi, color: C.sub },
  tabTxtOn: { color: C.ink, fontFamily: TTF.bold },

  loading: { paddingVertical: 60, alignItems: 'center' },
  errCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginTop: 20,
    padding: 14, borderRadius: 14, backgroundColor: N.violetSoft, borderWidth: 1, borderColor: N.violet,
  },
  // The banner sits on a yellow tint, so its text is the darkened accent, not the
  // fill colour — #FFC629 on #FFF4CC is unreadable.
  errTxt: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: TTF.semi, color: N.dot },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 20,
    marginHorizontal: 20, marginTop: 22, padding: 20, borderRadius: 22,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.hair,
  },
  ringTxt: { fontSize: 17, lineHeight: 22, fontFamily: TTF.bold, color: C.green },
  cardTitle: { fontSize: 20, lineHeight: 26, fontFamily: TTF.head, color: C.ink },
  cardSub: { fontSize: 15, lineHeight: 21, fontFamily: TTF.reg, color: C.sub, marginTop: 4 },

  recCard: {
    marginHorizontal: 20, marginTop: 18, padding: 20, borderRadius: 22,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.hair,
  },
  recTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  recTag: { backgroundColor: C.ink, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  recTagTxt: { fontSize: 12, lineHeight: 15, fontFamily: TTF.bold, color: C.canvas, letterSpacing: 0.6 },
  recMeta: { fontSize: 15, lineHeight: 20, fontFamily: TTF.semi, color: N.dot },
  recQ: { fontSize: 19, lineHeight: 27, fontFamily: TTF.head, color: C.ink, marginTop: 18 },
  solveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 62, borderRadius: 16, backgroundColor: C.violet, marginTop: 20,
  },
  solveLbl: { fontSize: 17, lineHeight: 22, fontFamily: TTF.bold, color: C.ink },

  panel: {
    marginTop: 24, paddingTop: 12, paddingBottom: 16,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: C.panel,
    borderTopWidth: 1, borderColor: C.hair,
  },
  grab: { width: 46, height: 4, borderRadius: 2, backgroundColor: N.track, alignSelf: 'center' },
  panelHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 12,
  },
  panelTitle: { flexShrink: 1, fontSize: 21, lineHeight: 27, fontFamily: TTF.head, color: C.ink },
  // A bordered chip, because on a light panel plain text gives no sign it is a
  // control — on the old dark sheet its brightness alone used to do that job.
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: N.card, borderWidth: 1, borderColor: C.hair,
  },
  filterChipOn: { backgroundColor: N.violetSoft, borderColor: N.violet },
  filterLbl: { fontSize: 13.5, lineHeight: 18, fontFamily: TTF.semi, color: C.ink },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 16,
    backgroundColor: N.card, borderWidth: 1, borderColor: C.hair,
    ...NSHADOW,
  },
  dot: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: N.cardSoft, borderWidth: 1, borderColor: C.hair,
  },
  dotOn: { backgroundColor: C.greenSoft, borderColor: C.greenSoft },
  dotInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.dim },
  rowHead: { marginBottom: 5 },
  rowQ: { fontSize: 15, lineHeight: 20, fontFamily: TTF.bold, color: C.ink },
  rowType: { fontSize: 14, lineHeight: 20, fontFamily: TTF.semi, color: C.sub },
  rowTxt: { fontSize: 15, lineHeight: 21, fontFamily: TTF.reg, color: C.sub },
  rowTxtDone: { color: N.inkDim },

  empty: { textAlign: 'center', fontSize: 15, fontFamily: TTF.reg, color: C.sub, paddingVertical: 32 },

  scrim: { flex: 1, backgroundColor: C.scrim },
  sheet: {
    backgroundColor: C.canvas, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: C.hair, paddingHorizontal: 16, paddingTop: 10,
  },
  grabDark: { width: 40, height: 4, borderRadius: 2, backgroundColor: N.track, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 17, lineHeight: 24, fontFamily: TTF.head, color: C.ink, marginBottom: 12, paddingHorizontal: 4 },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, marginBottom: 8,
    backgroundColor: N.cardSoft, borderWidth: 1, borderColor: 'transparent',
  },
  sheetItemOn: { backgroundColor: N.violetSoft, borderColor: N.violet },
  sheetItemTxt: { flex: 1, fontSize: 15.5, lineHeight: 20, fontFamily: TTF.semi, color: C.sub },
  sheetCount: { fontSize: 14, lineHeight: 20, fontFamily: TTF.semi, color: N.inkDim },
});
