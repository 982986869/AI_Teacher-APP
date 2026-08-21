// src/screens/ChapterPracticeScreen.js
// The chapter view for Important Questions / PYQ: a progress card, the question the
// student should do next, and the full series with each question's status.
//
// It is drawn with the SHARED test-card kit (components/testCardKit) — the same
// ScreenHeader, FilterTabs and card geometry as Mock Tests, Online Tests and the
// Practice lists — so this screen reads as one of the app's normal pages. What it
// looked like before was a leftover: a 30px title over a rounded bottom-sheet panel
// with a grab handle, geometry that belonged to the dark timed-test frame it was
// written against and matched nothing else once the app went light.
//
// The status filter moved from a modal sheet onto FilterTabs chips, the way Mock
// Tests shows All / Attempted. Same three filters, now with their counts visible
// before you tap.
//
// Every number here is REAL. GET /api/resources/progress/... returns each question
// with its marks, type and this student's status; the card's percent is solved/total
// from that same payload. Where the importer never supplied a value — a question
// with no marks or no type — the row simply omits it rather than printing "0 Marks"
// or a guessed category.
//
// "Recommended next" is the first question with no progress row, in paper order. It
// is not a ranked suggestion: there is no per-question difficulty or mastery signal
// to rank by, and a confident "Recommended next" label on a guess would be worse
// than an honest "next one you haven't done".
//
// Props:
//   subject, chapter -> { name, slug } for each
//   sectionType      -> 'important_questions' | 'pyq'
//   classLevel       -> number
//   tabs             -> [{ key, label }] rendered under the title
//   activeTab, onTab -> which one is lit, and the caller's handler
//   onOpenQuestion(q)-> open one question (the caller owns the reader)
//   onBack()
import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, StatusBar, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { Check, CircleAlert } from 'lucide-react-native';
import { TK, ScreenHeader, FilterTabs, TestCard } from '../components/testCardKit';
import { htmlToPlain } from '../utils/mathHtml';
import { getChapterQuestionProgress, setQuestionProgress } from '../api/resourcesApi';

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'solved',  label: 'Solved' },
  { key: 'pending', label: 'Not started' },
];

const qLabel = (q, i) => (q.qNumber ? String(q.qNumber).replace(/^Q/i, '') : String(i + 1));

// "MCQ · 4 Marks" — each part only when the importer actually supplied it.
const qMeta = (q) => [
  q.questionType || null,
  q.marks != null ? `${q.marks} Mark${q.marks === 1 ? '' : 's'}` : null,
].filter(Boolean).join('  ·  ');

// ── progress ring ───────────────────────────────────────────────────────────
function Ring({ percent = 0, size = 84, stroke = 8 }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#EFEFF1" strokeWidth={stroke} fill="none" />
        {pct > 0 && (
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={TK.ok} strokeWidth={stroke} fill="none"
            strokeDasharray={`${(c * pct) / 100} ${c}`} strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <Text style={s.ringTxt}>{pct}%</Text>
    </View>
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

  // The section name rides in the subtitle when there is only one of them — a lone
  // chip is a control that cannot do anything.
  const activeTabLabel = (tabs.find((t) => t.key === activeTab) || tabs[0] || {}).label;
  const subtitle = [subject.name, chapter.group, tabs.length > 1 ? null : activeTabLabel]
    .filter(Boolean).join('  ·  ');

  // Counts ride on the chips, so the filter reads before it is tapped.
  const statusTabs = FILTERS.map((f) => ({
    id: f.key,
    label: f.label,
    count: f.key === 'all'
      ? questions.length
      : questions.filter((q) => (f.key === 'solved' ? q.status === 'solved' : q.status == null)).length,
  }));

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
      <ScreenHeader
        title={chapter.name || 'Chapter'}
        titleLines={2}
        subtitle={subtitle}
        onBack={onBack}
      />

      {/* Section tabs (Important Qs / PYQ) — only when there is a real choice. */}
      {tabs.length > 1 && (
        <FilterTabs
          tab={activeTab}
          onChange={onTab}
          tabs={tabs.map((t) => ({ id: t.key, label: t.label }))}
        />
      )}

      {data === null ? (
        <View style={s.loading}><ActivityIndicator color={TK.mintInk} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }}
          showsVerticalScrollIndicator={false}
        >
          {!!error && (
            <View style={s.errCard}>
              <CircleAlert size={17} color={TK.mintInk} strokeWidth={2.2} />
              <Text style={s.errTxt}>{error}</Text>
            </View>
          )}

          {/* Progress */}
          <View style={s.progress}>
            <Ring percent={data.percent} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.progressTitle}>Syllabus Practice</Text>
              <Text style={s.progressSub}>
                {data.total > 0
                  ? `${data.solved} of ${data.total} questions solved`
                  : 'No questions in this chapter yet'}
              </Text>
            </View>
          </View>

          {/* Recommended next — the first question with no progress row */}
          {!!rec && (
            <TestCard
              statusLabel="Recommended next"
              title={htmlToPlain(rec.questionHtml || '')}
              metas={[
                rec.qNumber ? `Q${String(rec.qNumber).replace(/^Q/i, '')}` : null,
                rec.marks != null ? `${rec.marks} Mark${rec.marks === 1 ? '' : 's'}` : null,
              ].filter(Boolean)}
              actionLabel="Solve Question"
              onPress={() => onOpenQuestion(rec)}
            />
          )}

          {/* The series */}
          <Text style={s.sectionTitle}>All Question Series</Text>
          <FilterTabs
            tab={filter}
            onChange={setFilter}
            tabs={statusTabs}
            style={s.seriesTabs}
          />

          {shown.length === 0 ? (
            <Text style={s.empty}>
              {questions.length === 0 ? 'No questions here yet.' : `No ${activeFilter.label.toLowerCase()} questions.`}
            </Text>
          ) : shown.map((q, i) => {
            const solved = q.status === 'solved';
            const meta = qMeta(q);
            return (
              <Pressable
                key={q.id}
                style={s.qRow}
                onPress={() => onOpenQuestion(q)}
                accessibilityRole="button"
                accessibilityLabel={`Question ${qLabel(q, i)}${solved ? ', solved' : ''}`}
              >
                <View style={s.qNum}><Text style={s.qNumTxt}>{qLabel(q, i)}</Text></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[s.qName, solved && s.qNameDone]} numberOfLines={2}>
                    {htmlToPlain(q.questionHtml || '')}
                  </Text>
                  {!!meta && <Text style={s.qSub}>{meta}</Text>}
                </View>
                <Pressable
                  onPress={() => toggleSolved(q)}
                  hitSlop={10}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: solved }}
                  accessibilityLabel={solved ? 'Mark as not solved' : 'Mark as solved'}
                  style={[s.tick, solved && s.tickOn]}
                >
                  {solved && <Check size={17} color="#FFFFFF" strokeWidth={3} />}
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  loading: { paddingVertical: 60, alignItems: 'center' },

  errCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14,
    padding: 14, borderRadius: 14, backgroundColor: TK.mintSoft, borderWidth: 1, borderColor: '#FFE9A8',
  },
  errTxt: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '700', color: TK.mintInk },

  // Same geometry as testCardKit's `card`, so it stacks with the TestCard below it.
  progress: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: TK.card, borderWidth: 1, borderColor: TK.border,
    borderRadius: 18, padding: 18, marginBottom: 14,
  },
  ringTxt: { fontSize: 16, fontWeight: '800', color: TK.ok, letterSpacing: -0.3 },
  progressTitle: { fontSize: 18.5, fontWeight: '800', color: TK.text, letterSpacing: -0.4 },
  progressSub: { fontSize: 13.5, fontWeight: '700', color: TK.textMuted, marginTop: 4 },

  sectionTitle: { fontSize: 18.5, fontWeight: '800', color: TK.text, letterSpacing: -0.4, marginTop: 10 },
  // FilterTabs pads itself by 16; bleed that back out so the chips line up with the
  // cards instead of sitting 32px in.
  seriesTabs: { marginHorizontal: -16, marginBottom: 14 },

  qRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: TK.card, borderRadius: 16, borderWidth: 1, borderColor: TK.border,
    padding: 16, marginBottom: 12,
  },
  qNum: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: '#F4F4F6',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  qNumTxt: { fontSize: 14.5, fontWeight: '800', color: TK.text },
  qName: { fontSize: 14.5, lineHeight: 20, fontWeight: '700', color: TK.text },
  qNameDone: { color: TK.textMuted },
  qSub: { fontSize: 12, fontWeight: '700', color: TK.textMuted, marginTop: 3 },

  tick: {
    width: 32, height: 32, borderRadius: 16, marginLeft: 12,
    borderWidth: 1.5, borderColor: TK.border,
    alignItems: 'center', justifyContent: 'center',
  },
  tickOn: { backgroundColor: TK.ok, borderColor: TK.ok },

  empty: { textAlign: 'center', fontSize: 14, fontWeight: '700', color: TK.textMuted, paddingVertical: 40 },
});
