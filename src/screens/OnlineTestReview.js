// OnlineTestReview.js
// Question-by-question review shown after an online test is submitted, from the
// "Review Answers" button on MockResultScreen. Palette matches MockResultScreen —
// both import the `timed-test-dark` tokens, so the runner → result → review journey
// is one surface.
//
// A scannable LIST: one line per question (number, truncated stem, the correct
// answer, a verdict chip), grouped by section. Tapping a row expands it to the full
// detail — every option graded, plus the solution — because a review that only shows
// "Correct: C. 3" tells a student what the answer was but never why, and that detail
// was the whole point of the screen it replaced.
//
// Works off the raw submit payload rather than a computed report, because the
// report (computeMockResult) only carries totals — it has no per-question detail.
//
// Props:
//   title      -> e.g. "Laws of Motion — Review"
//   questions  -> [{ id, text, section, options:[{ key, label }], correctAnswer:'A', explanation }]
//                 (the shape the offline banks produce — `correctAnswer` is a LETTER)
//   answers    -> { [questionId]: 'A' }  — letters too; absent = unanswered
//   onBack()   -> return to the result screen (the header arrow)
//   onExit()   -> leave the test entirely (the pinned "Back to Practice" button);
//                 falls back to onBack when the caller wires only the one.

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check, X, ChevronDown } from 'lucide-react-native';
import { TT, TTF, Rich } from '../components/timedTestDark';
import { htmlToPlain, hasMath, firstImg } from '../utils/mathHtml';

const C = {
  ...TT,
  green: '#22D39A',
  greenSoft: 'rgba(34,211,154,0.10)',
  redSoft: 'rgba(255,59,92,0.10)',
  wrong: '#FF3B5C',
  chip: 'rgba(255,255,255,0.06)',
};

// A question with no answer key cannot be marked right or wrong — say so rather
// than silently calling the student's answer incorrect. (Biology currently ships
// with no answer key at all, so this is a real case, not a defensive branch.)
function statusOf(q, picked) {
  if (!q.correctAnswer) return 'unknown';
  if (picked == null) return 'unanswered';
  return String(picked) === String(q.correctAnswer) ? 'correct' : 'incorrect';
}

// A wrong answer is the one verdict a student must not scroll past, so it is the
// only chip that carries a full-strength edge; the rest sit on a soft fill alone.
const BADGE = {
  correct:    { label: 'CORRECT', fg: C.green, bg: C.greenSoft, edge: 'rgba(34,211,154,0.45)' },
  incorrect:  { label: 'WRONG',   fg: C.wrong, bg: C.redSoft,   edge: C.wrong },
  unanswered: { label: 'SKIPPED', fg: C.sub,   bg: C.chip,      edge: 'transparent' },
  unknown:    { label: 'NOT GRADED', fg: C.dim, bg: C.chip,     edge: 'transparent' },
};

const FILTERS = [
  { key: 'all',        label: 'All' },
  { key: 'correct',    label: 'Correct' },
  { key: 'incorrect',  label: 'Wrong' },
  { key: 'unanswered', label: 'Skipped' },
];

export default function OnlineTestReview({
  title = 'Answer Review', questions = [], answers = {}, onBack = () => {}, onExit,
}) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [openId, setOpenId] = useState(null);

  // Number every question paper-wide first, so a row keeps its number no matter
  // which filter is applied — a "Q6" that becomes "Q2" because Q1–Q5 were hidden
  // would not match the paper the student just sat.
  const rows = useMemo(() => questions.map((q, i) => {
    const picked = answers[q.id];
    return { q, picked, n: i + 1, status: statusOf(q, picked), key: q.id ?? `q${i}` };
  }), [questions, answers]);

  const shown = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  // Group by section when the bank supplies one; otherwise a single untitled group.
  const groups = useMemo(() => {
    const out = [];
    shown.forEach((r) => {
      const sec = r.q.section || null;
      const last = out[out.length - 1];
      if (last && last.section === sec) last.items.push(r);
      else out.push({ section: sec, items: [r] });
    });
    return out;
  }, [shown]);

  const activeFilter = FILTERS.find((f) => f.key === filter) || FILTERS[0];

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.canvas} />
      <View style={{ height: insets.top }} />

      <View style={st.header}>
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back to result">
          <ArrowLeft size={24} color={C.ink} strokeWidth={2.2} />
        </Pressable>
        <Text style={st.title} numberOfLines={1}>{title}</Text>
        <Pressable
          style={st.filterPill}
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Filter: ${activeFilter.label}`}
        >
          <Text style={st.filterLbl}>{activeFilter.label}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {shown.length === 0 && (
          <Text style={st.empty}>
            {rows.length === 0 ? 'Nothing to review.' : `No ${activeFilter.label.toLowerCase()} questions.`}
          </Text>
        )}

        {groups.map((g, gi) => (
          <View key={`${g.section || 'all'}-${gi}`}>
            {!!g.section && (
              <View style={st.secHead}>
                <View style={st.secBar} />
                <Text style={st.secTxt}>
                  SECTION {g.section} · Q{g.items[0].n}-Q{g.items[g.items.length - 1].n}
                </Text>
              </View>
            )}

            {g.items.map(({ q, picked, n, status, key }) => {
              const badge = BADGE[status];
              const open = openId === key;
              const correctOpt = (q.options || []).find((o) => String(o.key) === String(q.correctAnswer));
              return (
                <View key={key}>
                  <Pressable
                    style={st.row}
                    onPress={() => setOpenId(open ? null : key)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityLabel={`Question ${n}, ${badge.label.toLowerCase()}. Tap for the full answer.`}
                  >
                    <Text style={st.qNum}>Q{n}</Text>
                    <View style={st.rowMid}>
                      {/* The stem is NOT truncated: a review row that hides the
                          question makes the answer beneath it unreadable, and the
                          long set-theory stems are exactly the ones worth re-reading. */}
                      <Text style={st.qText}>{htmlToPlain(q.text || '')}</Text>
                      {!!q.correctAnswer && (
                        <Text style={st.correctLine} numberOfLines={1}>
                          Correct: {q.correctAnswer}{correctOpt ? `. ${htmlToPlain(correctOpt.label || '')}` : ''}
                        </Text>
                      )}
                      {!q.correctAnswer && <Text style={st.noKey}>Answer key not available yet</Text>}
                    </View>
                    <View style={[st.badge, { backgroundColor: badge.bg, borderColor: badge.edge }]}>
                      <Text style={[st.badgeTxt, { color: badge.fg }]}>{badge.label}</Text>
                    </View>
                  </Pressable>

                  {/* Expanded detail — every option graded, then the solution. */}
                  {open && (
                    <View style={st.detail}>
                      {/* The row already prints the stem as plain text, so repeat it
                          here only when that flattening loses something — a formula
                          to typeset or a diagram to show. */}
                      {(hasMath(q.text || '') || !!firstImg(q.text || '')) && (
                        <Rich value={q.text} fontSize={15} lineHeight={22} color={C.ink} family={TTF.head} imgHeight={170} />
                      )}
                      <View style={st.opts}>
                        {(q.options || []).map((o) => {
                          const isCorrect = q.correctAnswer && String(o.key) === String(q.correctAnswer);
                          const isPicked = picked != null && String(o.key) === String(picked);
                          // One place decides a row's whole appearance: the key is
                          // graded green, a wrong pick red, everything else resting.
                          const tone = isCorrect
                            ? { edge: C.green, fill: C.greenSoft, Mark: Check }
                            : (isPicked ? { edge: C.wrong, fill: C.redSoft, Mark: X } : null);
                          return (
                            <View key={o.key} style={[st.opt, tone && { borderColor: tone.edge, backgroundColor: tone.fill }]}>
                              <View style={[st.letterBadge, tone && { backgroundColor: tone.edge }]}>
                                <Text style={[st.letterTxt, tone && { color: C.onBright }]}>{o.key}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Rich value={o.label} fontSize={14} lineHeight={18}
                                  color={tone ? C.ink : C.sub} family={TTF.reg} imgHeight={92} />
                              </View>
                              {tone && <tone.Mark size={16} color={tone.edge} strokeWidth={2.4} />}
                            </View>
                          );
                        })}
                      </View>
                      {!!q.explanation && (
                        <View style={st.solBox}>
                          <Text style={st.solTitle}>Solution</Text>
                          <Rich value={q.explanation} fontSize={13} lineHeight={19} color={C.sub} family={TTF.reg} imgHeight={140} />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Leaves the test entirely, rather than stepping back to the result the way
          the header arrow does — the two exits go to different places on purpose. */}
      <View style={[st.foot, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={st.exitBtn} onPress={onExit || onBack} accessibilityRole="button">
          <Text style={st.exitLbl}>Back to Practice</Text>
        </Pressable>
      </View>

      {/* Filter sheet */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={st.scrim} onPress={() => setFilterOpen(false)} accessibilityLabel="Close" />
        <View style={[st.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={st.grab} />
          <Text style={st.sheetTitle}>Show</Text>
          {FILTERS.map((f) => {
            const on = filter === f.key;
            const count = f.key === 'all' ? rows.length : rows.filter((r) => r.status === f.key).length;
            return (
              <Pressable
                key={f.key}
                onPress={() => { setFilter(f.key); setFilterOpen(false); }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[st.sheetItem, on && st.sheetItemOn]}
              >
                <Text style={[st.sheetItemTxt, on && { color: C.ink }]}>{f.label}</Text>
                <Text style={st.sheetCount}>{count}</Text>
                {on && <Check size={18} color={C.violet} strokeWidth={2.5} />}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.hair,
  },
  title: { flex: 1, fontSize: 24, lineHeight: 30, fontFamily: TTF.head, color: C.ink, letterSpacing: -0.4 },
  filterPill: {
    minWidth: 68, height: 42, borderRadius: 21, paddingHorizontal: 18,
    backgroundColor: C.violet, alignItems: 'center', justifyContent: 'center',
  },
  filterLbl: { fontSize: 15, lineHeight: 20, fontFamily: TTF.bold, color: C.ink },

  secHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12 },
  secBar: { width: 4, height: 18, borderRadius: 2, backgroundColor: C.violet },
  secTxt: { fontSize: 14, lineHeight: 18, fontFamily: TTF.bold, color: C.violet, letterSpacing: 0.8 },

  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: C.hair,
  },
  qNum: { width: 34, fontSize: 19, lineHeight: 25, fontFamily: TTF.head, color: C.ink },
  rowMid: { flex: 1, minWidth: 0 },
  qText: { fontSize: 16, lineHeight: 22, fontFamily: TTF.reg, color: C.ink },
  correctLine: { fontSize: 15, lineHeight: 21, fontFamily: TTF.semi, color: C.green, marginTop: 6 },
  noKey: { fontSize: 14, lineHeight: 20, fontFamily: TTF.reg, color: C.dim, marginTop: 6, fontStyle: 'italic' },
  badge: { borderRadius: 8, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12, marginTop: 2 },
  badgeTxt: { fontSize: 12, lineHeight: 15, fontFamily: TTF.bold, letterSpacing: 0.6 },

  detail: {
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, gap: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderBottomWidth: 1, borderBottomColor: C.hair,
  },
  opts: { gap: 8 },
  opt: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1,
    borderColor: C.hair, backgroundColor: C.card, padding: 13,
  },
  letterBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.hair, alignItems: 'center', justifyContent: 'center' },
  letterTxt: { fontSize: 13, lineHeight: 16, fontFamily: TTF.head, color: C.ink },
  solBox: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.hair, padding: 12, gap: 4 },
  solTitle: { fontSize: 12, lineHeight: 16, fontFamily: TTF.bold, color: C.sub, letterSpacing: 0.6 },

  empty: { textAlign: 'center', fontSize: 15, fontFamily: TTF.reg, color: C.sub, marginTop: 48 },

  foot: { paddingHorizontal: 20, paddingTop: 12 },
  exitBtn: {
    height: 62, borderRadius: 16, backgroundColor: C.violet,
    alignItems: 'center', justifyContent: 'center',
  },
  exitLbl: { fontSize: 17, lineHeight: 22, fontFamily: TTF.bold, color: C.ink },

  scrim: { flex: 1, backgroundColor: 'rgba(4,3,18,0.6)' },
  sheet: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: C.hair, paddingHorizontal: 16, paddingTop: 10,
  },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.hair, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 17, lineHeight: 24, fontFamily: TTF.head, color: C.ink, marginBottom: 12, paddingHorizontal: 4 },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'transparent',
  },
  sheetItemOn: { backgroundColor: 'rgba(123,97,255,0.14)', borderColor: C.violet },
  sheetItemTxt: { flex: 1, fontSize: 15.5, lineHeight: 20, fontFamily: TTF.semi, color: C.sub },
  sheetCount: { fontSize: 14, lineHeight: 20, fontFamily: TTF.semi, color: C.dim },
});
