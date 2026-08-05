// src/screens/results/ResultsView.js
// The Student Results dashboard, extracted verbatim so BOTH the student's own Progress tab
// and the Admin "view any student's results" flow render the EXACT same UI. The two callers
// differ ONLY by where the data comes from — so the data source is injected:
//   • fetchResults(period, offset)  → the Results payload (overview, daily, subjects, recent)
//   • fetchAttemptSections(id)      → section-wise breakdown for one mock attempt
// Everything visual (period toggle, streak, cards, chart, subject/recent lists, both modals)
// is identical. `header` lets each caller supply its own screen header (student = "Progress",
// admin = the selected student's name); `enableTabScrollToTop` is the student-only re-tap
// behaviour. Removing nothing here should make the two screens indistinguishable.
//
// `dark` (default false, preserving admin's existing light look exactly): the student
// caller passes `dark` to render on the AILERNOVA design-system dark palette instead of
// studentTheme's light `S`. Every colour in this file already routes through one `T.<role>`
// object, so the two palettes are just two maps with the same role names — see `D` below.
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { S, shadow, shadowSm, StudentErrorState } from '../../theme/studentUI';
import { COLORS } from '../../theme/designSystem';
import { FONT } from '../../constants/fonts';
import { FadeInOnce, Shimmer } from '../parent/ParentApp/anim';

// Dark palette — same role names as studentTheme's `S`, so every `T.role` call site
// below works unchanged regardless of which map is active.
const D = {
  canvas: COLORS.background, card: 'rgba(255,255,255,0.05)',
  ink: COLORS.textPrimary, sub: COLORS.textSecondary, muted: COLORS.textSecondary, faint: 'rgba(255,255,255,0.38)',
  hair: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.16)', white: '#FFFFFF',
  indigo: COLORS.primary, indigoSoft: 'rgba(124,58,237,0.16)',
  blue: '#60A5FA', blueSoft: 'rgba(96,165,250,0.16)',
  emerald: COLORS.success, emeraldSoft: 'rgba(16,185,129,0.16)',
  orange: COLORS.warning, orangeSoft: 'rgba(249,115,22,0.16)',
  gold: '#F5C451', goldSoft: 'rgba(245,196,81,0.16)',
  purple: '#C084FC', purpleSoft: 'rgba(192,132,252,0.16)',
  cyan: '#22D3EE', cyanSoft: 'rgba(34,211,238,0.16)',
  red: COLORS.error, redSoft: 'rgba(239,68,68,0.16)',
};

const SUBJ_ABBR = {
  Physics: 'Ph', Chemistry: 'Ch', Mathematics: 'Ma', Maths: 'Ma', Biology: 'Bi',
  English: 'En', Hindi: 'हि', 'Social Science': 'SS', Science: 'Sc',
  'Current Affairs': 'CA', 'Computer Applications': 'CA', 'Information Technology': 'IT', 'Brain Gym': 'BG',
};
const abbr = (name) => SUBJ_ABBR[name] || (name || '?').trim().slice(0, 2);

const EMOJIS = { Mathematics: '📐', Maths: '📐', Physics: '⚛️', English: '📖', Biology: '🧬', Chemistry: '🧪', Science: '🔬', 'Social Science': '🌐', Hindi: '📖', 'Current Affairs': '🌐', 'Computer Applications': '💻', 'Information Technology': '💻', 'Brain Gym': '🧠' };
const emojiFor = (name) => EMOJIS[name] || (Object.keys(EMOJIS).find(k => (name || '').includes(k)) ? EMOJIS[Object.keys(EMOJIS).find(k => (name || '').includes(k))] : '📚');

const PERIODS = [{ key: 'week', lbl: 'Week' }, { key: 'month', lbl: 'Month' }];

const relativeDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
};
const fmtHM = (secs) => {
  if (!secs) return '';
  const m = Math.round(secs / 60), h = Math.floor(m / 60), mm = m % 60;
  if (h && mm) return `${h}h ${mm}m`;
  if (h) return `${h}h`;
  return `${mm}m`;
};
const fmtHoursTotal = (secs) => {
  const m = Math.round((secs || 0) / 60), h = Math.floor(m / 60), mm = m % 60;
  return h ? `${h}h ${mm}m` : `${mm}m`;
};
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fullDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = d.getHours(), mm = String(d.getMinutes()).padStart(2, '0');
  const ap = hh >= 12 ? 'PM' : 'AM', h12 = ((hh + 11) % 12) + 1;
  return `${WEEK[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()} · ${h12}:${mm} ${ap}`;
};
const subjMeta = (sub) => {
  const parts = [];
  if (sub.tests) parts.push(`${sub.tests} ${sub.tests === 1 ? 'test' : 'tests'}`);
  if (sub.mcqs) parts.push(`${sub.mcqs} MCQs`);
  return parts.length ? parts.join('  •  ') : 'No attempts';
};

function ResultsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <Shimmer w="100%" h={62} r={18} />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <Shimmer w="100%" h={120} r={20} style={{ flex: 1 }} />
        <Shimmer w="100%" h={120} r={20} style={{ flex: 1 }} />
      </View>
      <Shimmer w="100%" h={210} r={22} mt={16} />
      <Shimmer w="100%" h={170} r={22} mt={16} />
    </View>
  );
}

export default function ResultsView({ fetchResults, fetchAttemptSections, header, enableTabScrollToTop = false, contentBottomPad = 32, dark = false }) {
  const T = dark ? D : S;
  const PRIMARY = T.indigo;
  const AMBER = T.gold;
  const SUBJECT_COLORS = {
    Physics: T.blue, Chemistry: T.orange, Mathematics: T.emerald, Maths: T.emerald,
    Biology: '#16A34A', English: T.gold, Hindi: T.red, 'Social Science': T.cyan,
    Science: '#14B8A6', 'Current Affairs': T.purple, 'Computer Applications': T.indigo,
    'Information Technology': T.indigo, 'Brain Gym': T.purple,
  };
  const PALETTE = [T.indigo, T.emerald, T.blue, T.orange, T.red, T.cyan, '#14B8A6', T.purple];
  const subjectColor = (name, i) => {
    if (SUBJECT_COLORS[name]) return SUBJECT_COLORS[name];
    const k = Object.keys(SUBJECT_COLORS).find((k) => (name || '').includes(k));
    return k ? SUBJECT_COLORS[k] : PALETTE[i % PALETTE.length];
  };
  const scoreColor = (pct) => (pct >= 70 ? T.emerald : pct >= 50 ? T.gold : T.red);
  const s = useMemo(() => makeStyles(T, PRIMARY, AMBER), [dark]); // eslint-disable-line react-hooks/exhaustive-deps

  const [period, setPeriod] = useState('week');
  const [offset, setOffset] = useState(0);
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState(null);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [sections, setSections] = useState({ loading: false, list: [] });
  const [subjectDetail, setSubjectDetail] = useState(null);
  const barsScrollRef = useRef(null);
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const seqRef = useRef(0);
  const lastBarCount = useRef(0);

  const load = useCallback((p, off, isRefresh) => {
    const my = ++seqRef.current;
    setState((prev) => ({ ...prev, loading: true, error: isRefresh ? prev.error : null }));
    return fetchResults(p, off)
      .then((data) => { if (my === seqRef.current) setState({ loading: false, error: null, data }); })
      .catch((err) => {
        if (my !== seqRef.current) return;
        if (isRefresh) setState((prev) => ({ ...prev, loading: false }));
        else setState({ loading: false, error: err?.response?.data?.error || err?.message || 'Could not load progress', data: null });
      });
  }, [fetchResults]);

  useEffect(() => { load(period, offset, false); }, [period, offset, load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(period, offset, true).finally(() => setRefreshing(false));
  }, [load, period, offset]);

  const focusInit = useRef(true);
  const pRef = useRef(period); pRef.current = period;
  const oRef = useRef(offset); oRef.current = offset;
  useFocusEffect(useCallback(() => {
    if (focusInit.current) { focusInit.current = false; return; }
    load(pRef.current, oRef.current, true);
  }, [load]));

  useEffect(() => {
    if (!enableTabScrollToTop) return undefined;
    const unsub = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return unsub;
  }, [navigation, enableTabScrollToTop]);

  useEffect(() => {
    if (!detail || detail.type !== 'Mock' || !detail.id) { setSections({ loading: false, list: [] }); return undefined; }
    let alive = true;
    setSections({ loading: true, list: [] });
    fetchAttemptSections(detail.id)
      .then((d) => { if (alive) setSections({ loading: false, list: d?.sections || [] }); })
      .catch(() => { if (alive) setSections({ loading: false, list: [] }); });
    return () => { alive = false; };
  }, [detail, fetchAttemptSections]);

  const pickPeriod = (p) => { setOffset(0); setPeriod(p); };

  const data = state.data;
  const daily = data?.daily || [];
  const subjects = data?.subjects || [];
  const recent = data?.recent || [];
  const ov = data?.overview || {};
  const maxSecs = Math.max(1, ...daily.map((d) => d.secs || 0));
  const maxH = Math.max(1, Math.ceil(maxSecs / 3600));
  const manyBars = daily.length > 8;

  const cards = [
    { icon: '📋', bg: T.indigoSoft, tint: T.indigo, val: String(ov.testsTaken ?? 0), lbl: 'Tests Taken', sub: `Mocks: ${ov.mocks ?? 0} · Quizzes: ${ov.quizzes ?? 0}` },
    { icon: '🎯', bg: T.emeraldSoft, tint: T.emerald, val: `${ov.avgScore ?? 0}%`, lbl: 'Avg Score', sub: 'Across all attempts' },
    { icon: '⏱', bg: T.goldSoft, tint: T.gold, val: fmtHoursTotal(ov.studySeconds), lbl: 'Hours', sub: 'Total study time' },
    { icon: '⚡', bg: T.purpleSoft, tint: T.purple, val: (ov.xp ?? 0).toLocaleString(), lbl: 'XP Earned', sub: 'Keep it up! 🚀' },
  ];

  return (
    <View style={s.safe}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={T.canvas} translucent={false} />

      {header}

      {/* Period toggle */}
      <View style={s.periodWrap}>
        <View style={s.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p.key} style={[s.periodBtn, period === p.key && s.periodBtnActive]} onPress={() => pickPeriod(p.key)}>
              <Text style={[s.periodTxt, period === p.key && s.periodTxtActive]}>{p.lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date range navigator */}
      {period !== 'all' && (
        <View style={s.dateNav}>
          <TouchableOpacity onPress={() => setOffset((o) => o + 1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.dateArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.dateLabel}>{data?.rangeLabel || ' '}</Text>
          <TouchableOpacity disabled={offset === 0} onPress={() => setOffset((o) => Math.max(0, o - 1))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[s.dateArrow, offset === 0 && s.dateArrowOff]}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {state.loading && !state.data ? (
        <ResultsSkeleton />
      ) : state.error ? (
        dark ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
            <Text style={{ fontSize: 18, fontFamily: FONT.black, color: T.ink, textAlign: 'center' }}>Couldn’t load progress</Text>
            <Text style={{ fontSize: 13, fontFamily: FONT.semibold, color: T.muted, textAlign: 'center' }}>{state.error}</Text>
            <TouchableOpacity style={{ marginTop: 6, backgroundColor: PRIMARY, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 30 }} onPress={() => load(period, offset, false)}>
              <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: '#fff' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <StudentErrorState title="Couldn’t load progress" message={state.error} onRetry={() => load(period, offset, false)} />
        )
      ) : (
      <View style={{ flex: 1 }}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: contentBottomPad, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />}>

        {/* Study streak ribbon */}
        <FadeInOnce id="res-streak" delay={20} y={12}>
          <View style={s.streak}>
            <View style={s.streakFlame}><Text style={{ fontSize: 18 }}>🔥</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.streakTitle}>{data?.streak > 0 ? `${data.streak}-day study streak` : 'Start a study streak'}</Text>
              <Text style={s.streakSub}>{data?.todayActive ? 'Great — keep it going!' : 'Study today to keep it alive'}</Text>
            </View>
            <View style={s.streakDots}>
              {(data?.streakDays || [false, false, false, false, false, false, false]).map((a, i) => (
                <View key={i} style={[s.streakDot, a && s.streakDotOn]} />
              ))}
            </View>
          </View>
        </FadeInOnce>

        {/* Overview cards (2×2) */}
        <FadeInOnce id="res-cards" delay={60} y={14}>
          <View style={s.cardsGrid}>
            {cards.map((c, i) => (
              <View key={i} style={s.ovCard}>
                <View style={[s.ovIcon, { backgroundColor: c.bg }]}><Text style={{ fontSize: 18 }}>{c.icon}</Text></View>
                <Text style={s.ovLbl}>{c.lbl}</Text>
                <Text style={s.ovVal}>{c.val}</Text>
                <Text style={s.ovSub} numberOfLines={1}>{c.sub}</Text>
              </View>
            ))}
          </View>
        </FadeInOnce>

        {/* Activity chart */}
        <FadeInOnce id="res-chart" delay={90} y={14}>
        <View style={s.card}>
          <View style={s.cardHdr}>
            <Text style={s.cardTitle}>Activity</Text>
            <View style={s.hoursPill}><Text style={s.hoursPillTxt}>Hours</Text></View>
          </View>
          <View style={s.chartArea}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[s.gridline, { bottom: 22 + (i / 3) * 150 }]}>
                <Text style={s.yLabel}>{i === 0 ? '0' : (maxSecs >= 3600 ? `${Math.round((maxH * i) / 3)}h` : `${Math.round(maxSecs * i / 3 / 60)}m`)}</Text>
              </View>
            ))}
            {manyBars ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                ref={barsScrollRef}
                onContentSizeChange={() => { if (daily.length !== lastBarCount.current) { lastBarCount.current = daily.length; barsScrollRef.current?.scrollToEnd({ animated: false }); } }}
                style={s.barsScroll} contentContainerStyle={s.barsScrollContent}>
                {daily.map((d, i) => {
                  const barH = Math.max(4, ((d.secs || 0) / maxSecs) * 150);
                  return (
                    <View key={i} style={s.barColFixed}>
                      <Text style={s.barVal} numberOfLines={1}>{fmtHM(d.secs)}</Text>
                      <View style={[s.bar, { height: barH }]} />
                      <Text style={s.barLabel}>{d.day}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={s.barsRow}>
                {daily.map((d, i) => {
                  const barH = Math.max(4, ((d.secs || 0) / maxSecs) * 150);
                  return (
                    <View key={i} style={s.barCol}>
                      <Text style={s.barVal} numberOfLines={1}>{fmtHM(d.secs)}</Text>
                      <View style={[s.bar, { height: barH }]} />
                      <Text style={s.barLabel}>{d.day}</Text>
                      {!!d.sub && <Text style={s.barSub}>{d.sub}</Text>}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
          <View style={s.legendRow}><View style={s.legendDot} /><Text style={s.legendTxt}>Study Hours</Text></View>
        </View>
        </FadeInOnce>

        {/* Subject breakdown */}
        <FadeInOnce id="res-subj" delay={120} y={14}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Subject Breakdown</Text>
          {subjects.length === 0 ? (
            <Text style={s.emptyCardTxt}>No tests or MCQ practice in this period.</Text>
          ) : (showAllSubjects ? subjects : subjects.slice(0, 5)).map((sub, i) => {
            const col = subjectColor(sub.name, i);
            const attempted = sub.tests || sub.mcqs;
            return (
              <TouchableOpacity key={i} style={s.subjRow} activeOpacity={0.6} onPress={() => setSubjectDetail(sub)}>
                <View style={[s.subjIcon, { backgroundColor: col + '1A' }]}><Text style={{ fontSize: 17 }}>{emojiFor(sub.name)}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={s.subjTopRow}>
                    <Text style={s.subjName} numberOfLines={1}>{sub.name}</Text>
                    <Text style={[s.subjScore, { color: attempted ? col : T.faint }]}>{attempted ? `${sub.score}%` : '—'}</Text>
                  </View>
                  <View style={s.subjBarBg}>
                    <View style={[s.subjBarFill, { width: `${attempted ? sub.score : 0}%`, backgroundColor: col }]} />
                  </View>
                  <Text style={s.subjMeta}>{subjMeta(sub)}</Text>
                </View>
                <Text style={s.subjChevron}>›</Text>
              </TouchableOpacity>
            );
          })}
          {subjects.length > 5 && (
            <TouchableOpacity style={s.viewAllBtn} onPress={() => setShowAllSubjects((v) => !v)} activeOpacity={0.7}>
              <Text style={s.viewAllTxt}>{showAllSubjects ? 'Show less' : `View all subjects (${subjects.length})`}  {showAllSubjects ? '˄' : '˅'}</Text>
            </TouchableOpacity>
          )}
        </View>
        </FadeInOnce>

        {/* Recent tests */}
        <FadeInOnce id="res-recent" delay={150} y={14}>
        <View style={s.card}>
          <View style={s.cardHdr}>
            <Text style={s.cardTitle}>Recent Tests</Text>
          </View>
          {recent.length === 0 ? (
            <Text style={s.emptyCardTxt}>Recent tests and quizzes will appear here.</Text>
          ) : (
            <>
              {recent.map((t, i) => {
                const pct = t.total > 0 ? Math.round((t.score / t.total) * 100) : 0;
                const isQuiz = t.type === 'Quiz';
                return (
                  <TouchableOpacity key={i} activeOpacity={0.6} onPress={() => setDetail(t)}
                    style={[s.recRow, i < recent.length - 1 && s.recRowBorder]}>
                    <View style={[s.recIcon, { backgroundColor: isQuiz ? T.goldSoft : T.indigoSoft }]}>
                      <Text style={{ fontSize: 16 }}>{isQuiz ? '❓' : '📋'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.recSubject} numberOfLines={1}>{t.subject}</Text>
                      <Text style={s.recTopic} numberOfLines={1}>{t.topic}</Text>
                      <View style={s.recMetaRow}>
                        <Text style={s.recDate}>{relativeDate(t.createdAt)}</Text>
                        <View style={[s.typePill, isQuiz ? s.typePillQuiz : s.typePillMock]}>
                          <Text style={[s.typePillTxt, { color: isQuiz ? AMBER : PRIMARY }]}>{t.type}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={s.recRight}>
                      <Text style={s.recScore}>{t.score}/{t.total}</Text>
                      <Text style={[s.recPct, { color: scoreColor(pct) }]}>{pct}%</Text>
                    </View>
                    <Text style={s.recChevron}>›</Text>
                  </TouchableOpacity>
                );
              })}
              <Text style={s.recFooter}>Tap on any test to see detailed performance</Text>
            </>
          )}
        </View>
        </FadeInOnce>

      </ScrollView>
        {state.loading && (
          <View pointerEvents="none" style={s.refreshChip}><ActivityIndicator size="small" color={PRIMARY} /></View>
        )}
      </View>
      )}

      {/* Detail modal */}
      <Modal visible={!!detail} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setDetail(null)}>
          <TouchableOpacity style={s.modalCard} activeOpacity={1} onPress={() => {}}>
            {detail && (() => {
              const pct = detail.total > 0 ? Math.round((detail.score / detail.total) * 100) : 0;
              const skipped = Math.max(0, detail.total - detail.attempted);
              const isQuiz = detail.type === 'Quiz';
              const perQ = detail.attempted > 0 ? Math.round(detail.timeSec / detail.attempted) : 0;
              return (
                <>
                  <View style={s.modalHead}>
                    <View style={[s.modalIcon, { backgroundColor: isQuiz ? T.emeraldSoft : T.indigoSoft }]}><Text style={{ fontSize: 22 }}>{isQuiz ? '❓' : '📋'}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.modalSubject}>{detail.subject}</Text>
                      <Text style={s.modalTopic} numberOfLines={2}>{detail.topic}</Text>
                    </View>
                    <View style={[s.typePill, isQuiz ? s.typePillQuiz : s.typePillMock]}><Text style={[s.typePillTxt, { color: isQuiz ? T.emerald : PRIMARY }]}>{detail.type}</Text></View>
                  </View>
                  <View style={s.modalScoreWrap}>
                    <Text style={s.modalScoreBig}>{detail.score}<Text style={s.modalScoreTot}>/{detail.total}</Text></Text>
                    <Text style={[s.modalScorePct, { color: scoreColor(pct) }]}>{pct}%</Text>
                  </View>
                  <View style={s.modalStatsRow}>
                    <View style={s.modalStat}><Text style={[s.modalStatVal, { color: T.emerald }]}>{detail.correct}</Text><Text style={s.modalStatLbl}>Correct</Text></View>
                    <View style={s.modalStat}><Text style={[s.modalStatVal, { color: T.red }]}>{detail.wrong}</Text><Text style={s.modalStatLbl}>Wrong</Text></View>
                    <View style={s.modalStat}><Text style={s.modalStatVal}>{skipped}</Text><Text style={s.modalStatLbl}>Skipped</Text></View>
                  </View>
                  {/* Section-wise (mock tests) */}
                  {detail.type === 'Mock' && (
                    sections.loading ? (
                      <ActivityIndicator size="small" color={PRIMARY} style={{ marginBottom: 14 }} />
                    ) : sections.list.length > 0 ? (
                      <View style={s.secBlock}>
                        <Text style={s.secBlockTitle}>Section-wise</Text>
                        {sections.list.map((sec, i) => (
                          <View key={i} style={s.secRow}>
                            <Text style={s.secName} numberOfLines={1}>{sec.section}</Text>
                            <View style={s.secBarBg}><View style={[s.secBarFill, { width: `${sec.accuracy}%`, backgroundColor: scoreColor(sec.accuracy) }]} /></View>
                            <Text style={s.secStat}>{sec.correct}/{sec.total}</Text>
                            <Text style={[s.secPct, { color: scoreColor(sec.accuracy) }]}>{sec.accuracy}%</Text>
                          </View>
                        ))}
                      </View>
                    ) : null
                  )}

                  {/* Attempt info */}
                  <View style={s.infoBlock}>
                    <View style={s.infoLine}><Text style={s.infoLabel}>Attempt</Text><Text style={s.infoVal}>#{detail.attemptNumber} of {detail.attemptCount}</Text></View>
                    <View style={s.infoLine}><Text style={s.infoLabel}>Time taken</Text><Text style={s.infoVal}>{fmtHM(detail.timeSec) || '—'}{perQ ? `  ·  ~${perQ}s/question` : ''}</Text></View>
                    {detail.xp > 0 && <View style={s.infoLine}><Text style={s.infoLabel}>XP earned</Text><Text style={s.infoVal}>⚡ {detail.xp}</Text></View>}
                    <View style={s.infoLine}><Text style={s.infoLabel}>Attempted on</Text><Text style={s.infoVal}>{fullDate(detail.createdAt)}</Text></View>
                  </View>

                  <TouchableOpacity style={s.modalClose} onPress={() => setDetail(null)}>
                    <Text style={s.modalCloseTxt}>Close</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Subject detail modal */}
      <Modal visible={!!subjectDetail} transparent animationType="fade" onRequestClose={() => setSubjectDetail(null)}>
        <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setSubjectDetail(null)}>
          <TouchableOpacity style={s.modalCard} activeOpacity={1} onPress={() => {}}>
            {subjectDetail && (() => {
              const col = subjectColor(subjectDetail.name, 0);
              const attempted = subjectDetail.tests || subjectDetail.mcqs;
              const subjRecent = recent.filter((r) => r.subject === subjectDetail.name);
              return (
                <>
                  <View style={s.modalHead}>
                    <View style={[s.modalIcon, { backgroundColor: col + '1A' }]}><Text style={{ fontSize: 22 }}>{emojiFor(subjectDetail.name)}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.modalSubject}>{subjectDetail.name}</Text>
                      <Text style={s.modalTopic}>{subjMeta(subjectDetail)}</Text>
                    </View>
                    <Text style={[s.modalScorePct, { color: attempted ? col : T.faint, fontSize: 24 }]}>{attempted ? `${subjectDetail.score}%` : '—'}</Text>
                  </View>

                  <View style={s.modalStatsRow}>
                    <View style={s.modalStat}><Text style={s.modalStatVal}>{subjectDetail.tests}</Text><Text style={s.modalStatLbl}>Tests</Text></View>
                    <View style={s.modalStat}><Text style={s.modalStatVal}>{subjectDetail.mcqs}</Text><Text style={s.modalStatLbl}>MCQs done</Text></View>
                    <View style={s.modalStat}><Text style={[s.modalStatVal, attempted && { color: col }]}>{attempted ? `${subjectDetail.score}%` : '—'}</Text><Text style={s.modalStatLbl}>Accuracy</Text></View>
                  </View>

                  {subjRecent.length > 0 ? (
                    <View style={s.secBlock}>
                      <Text style={s.secBlockTitle}>Recent in {subjectDetail.name}</Text>
                      {subjRecent.slice(0, 6).map((t, i) => {
                        const pct = t.total > 0 ? Math.round((t.score / t.total) * 100) : 0;
                        return (
                          <TouchableOpacity key={i} style={s.subjRecentRow} activeOpacity={0.6}
                            onPress={() => { setSubjectDetail(null); setDetail(t); }}>
                            <Text style={s.subjRecentTopic} numberOfLines={1}>{t.topic}</Text>
                            <Text style={s.subjRecentScore}>{t.score}/{t.total}</Text>
                            <Text style={[s.subjRecentPct, { color: scoreColor(pct) }]}>{pct}%</Text>
                            <Text style={s.subjRecentChev}>›</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={s.subjNoRecent}>No test attempts in this period.</Text>
                  )}

                  <TouchableOpacity style={s.modalClose} onPress={() => setSubjectDetail(null)}>
                    <Text style={s.modalCloseTxt}>Close</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Styles depend on which palette (T) is active, so this is a function called once
// per `dark` value (memoized in the component) rather than a module constant.
function makeStyles(T, PRIMARY, AMBER) {
  const streakBg = T === D ? T.goldSoft : T.goldSoft;
  const cardBg = T === D ? T.card : '#fff';
  const modalBg = T === D ? T.surface || T.card : '#fff';
  return StyleSheet.create({
  safe:             { flex: 1, backgroundColor: T.canvas },
  periodWrap:       { alignItems: 'center', paddingBottom: 6 },
  periodRow:        { flexDirection: 'row', backgroundColor: T.hair, borderRadius: 20, padding: 4 },
  periodBtn:        { paddingVertical: 7, paddingHorizontal: 22, borderRadius: 16 },
  periodBtnActive:  { backgroundColor: PRIMARY },
  periodTxt:        { fontSize: 13, fontFamily: FONT.extrabold, color: T.muted },
  periodTxtActive:  { color: '#fff' },
  dateNav:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 9 },
  dateArrow:        { fontSize: 24, color: T.muted, fontFamily: FONT.bold, paddingHorizontal: 6 },
  dateArrowOff:     { color: T.border },
  dateLabel:        { fontSize: 14, fontFamily: FONT.extrabold, color: T.sub },
  refreshChip:      { position: 'absolute', top: 8, alignSelf: 'center', backgroundColor: cardBg, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: T.hair, ...(T === D ? {} : shadowSm) },
  emptyCardTxt:     { fontSize: 13, color: T.muted, fontFamily: FONT.semibold, textAlign: 'center', lineHeight: 19, paddingVertical: 14 },
  streak:           { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 12,
                      backgroundColor: streakBg, borderWidth: 1, borderColor: T === D ? T.hair : '#F4E6C4', borderRadius: 18, padding: 12 },
  streakFlame:      { width: 34, height: 34, borderRadius: 10, backgroundColor: T === D ? T.card : '#FBEBCC', alignItems: 'center', justifyContent: 'center' },
  streakTitle:      { fontSize: 14, fontFamily: FONT.extrabold, color: T.ink },
  streakSub:        { fontSize: 11.5, color: T === D ? T.muted : '#9A7B3C', fontFamily: FONT.semibold, marginTop: 1 },
  streakDots:       { flexDirection: 'row', gap: 4, marginLeft: 'auto' },
  streakDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: T === D ? T.hair : '#EAD9B4' },
  streakDotOn:      { backgroundColor: AMBER },
  cardsGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  ovCard:           { width: '47.6%', flexGrow: 1, backgroundColor: cardBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.hair, ...(T === D ? {} : shadow) },
  ovIcon:           { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ovLbl:            { fontSize: 12, fontFamily: FONT.bold, color: T.muted },
  ovVal:            { fontSize: 26, fontFamily: FONT.black, color: T.ink, letterSpacing: -0.8, marginTop: 2 },
  ovSub:            { fontSize: 10.5, fontFamily: FONT.semibold, color: T.faint, marginTop: 4 },
  card:             { backgroundColor: cardBg, borderRadius: 22, padding: 18, marginTop: 16, borderWidth: 1, borderColor: T.hair, ...(T === D ? {} : shadow) },
  cardHdr:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle:        { fontSize: 17, fontFamily: FONT.black, color: T.ink, letterSpacing: -0.3 },
  hoursPill:        { borderWidth: 1.5, borderColor: T.border, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 12 },
  hoursPillTxt:     { fontSize: 12, fontFamily: FONT.extrabold, color: T.sub },
  chartArea:        { height: 150 + 22 + 30, position: 'relative', marginTop: 8 },
  gridline:         { position: 'absolute', left: 24, right: 0, height: 1, borderTopWidth: 1, borderColor: T.hair, borderStyle: 'dashed' },
  yLabel:           { position: 'absolute', left: -24, top: -7, fontSize: 9, color: T.faint, fontFamily: FONT.bold, width: 22, textAlign: 'right' },
  barsRow:          { flexDirection: 'row', alignItems: 'flex-end', height: 150 + 22, paddingLeft: 24, gap: 6 },
  barsScroll:       { marginLeft: 24, height: 150 + 22 },
  barsScrollContent:{ flexDirection: 'row', alignItems: 'flex-end', height: 150 + 22, gap: 12, paddingRight: 14 },
  barColFixed:      { width: 42, alignItems: 'center' },
  barCol:           { flex: 1, alignItems: 'center' },
  barVal:           { fontSize: 8.5, color: T.muted, fontFamily: FONT.bold, marginBottom: 4, height: 12 },
  bar:              { width: '62%', maxWidth: 26, backgroundColor: PRIMARY, borderRadius: 8 },
  barLabel:         { fontSize: 11, color: T.sub, fontFamily: FONT.extrabold, marginTop: 6 },
  barSub:           { fontSize: 9, color: T.faint, fontFamily: FONT.semibold },
  legendRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
  legendDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY },
  legendTxt:        { fontSize: 11, color: T.muted, fontFamily: FONT.bold },
  subjRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  subjIcon:         { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  subjTopRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subjName:         { fontSize: 14, fontFamily: FONT.extrabold, color: T.ink, flex: 1 },
  subjScore:        { fontSize: 14, fontFamily: FONT.black, marginLeft: 8 },
  subjBarBg:        { height: 7, backgroundColor: T.hair, borderRadius: 4, overflow: 'hidden' },
  subjBarFill:      { height: 7, borderRadius: 4 },
  subjMeta:         { fontSize: 11, color: T.faint, fontFamily: FONT.bold, marginTop: 5 },
  subjChevron:      { fontSize: 20, color: T.faint, fontFamily: FONT.bold, marginLeft: 6, alignSelf: 'center' },
  subjRecentRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: T.hair },
  subjRecentTopic:  { flex: 1, fontSize: 12.5, fontFamily: FONT.bold, color: T.ink },
  subjRecentScore:  { fontSize: 12.5, fontFamily: FONT.extrabold, color: T.muted },
  subjRecentPct:    { fontSize: 12.5, fontFamily: FONT.black, width: 44, textAlign: 'right' },
  subjRecentChev:   { fontSize: 17, color: T.faint, fontFamily: FONT.bold },
  subjNoRecent:     { fontSize: 12.5, color: T.muted, fontFamily: FONT.semibold, textAlign: 'center', paddingVertical: 12, marginBottom: 4 },
  recRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  recRowBorder:     { borderBottomWidth: 1, borderBottomColor: T.hair },
  recIcon:          { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recSubject:       { fontSize: 14, fontFamily: FONT.extrabold, color: T.ink },
  recTopic:         { fontSize: 11.5, color: T.muted, fontFamily: FONT.semibold, marginTop: 1 },
  recMetaRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  recDate:          { fontSize: 10.5, color: T.faint, fontFamily: FONT.semibold },
  typePill:         { borderRadius: 7, paddingVertical: 2, paddingHorizontal: 8 },
  typePillMock:     { backgroundColor: T.indigoSoft },
  typePillQuiz:     { backgroundColor: T.goldSoft },
  typePillTxt:      { fontSize: 9.5, fontFamily: FONT.extrabold },
  recRight:         { alignItems: 'flex-end' },
  recScore:         { fontSize: 15, fontFamily: FONT.black, color: T.ink, letterSpacing: -0.3 },
  recPct:           { fontSize: 12, fontFamily: FONT.extrabold, marginTop: 2 },
  recChevron:       { fontSize: 20, color: T.faint, fontFamily: FONT.bold, marginLeft: 4 },
  recFooter:        { fontSize: 11, color: T.faint, fontFamily: FONT.semibold, textAlign: 'center', marginTop: 12 },
  viewAllBtn:       { alignItems: 'center', paddingVertical: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: T.hair },
  viewAllTxt:       { fontSize: 13, fontFamily: FONT.extrabold, color: PRIMARY },
  secBlock:         { marginBottom: 16 },
  secBlockTitle:    { fontSize: 12, fontFamily: FONT.extrabold, color: T.muted, marginBottom: 10, letterSpacing: 0.3, textTransform: 'uppercase' },
  secRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  secName:          { fontSize: 12, fontFamily: FONT.extrabold, color: T.ink, width: 78 },
  secBarBg:         { flex: 1, height: 6, backgroundColor: T.hair, borderRadius: 3, overflow: 'hidden' },
  secBarFill:       { height: 6, borderRadius: 3 },
  secStat:          { fontSize: 11, fontFamily: FONT.bold, color: T.muted, width: 42, textAlign: 'right' },
  secPct:           { fontSize: 12, fontFamily: FONT.black, width: 40, textAlign: 'right' },
  infoBlock:        { backgroundColor: T.canvas, borderRadius: 16, padding: 14, marginBottom: 18, gap: 10 },
  infoLine:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel:        { fontSize: 12, fontFamily: FONT.bold, color: T.muted },
  infoVal:          { fontSize: 12, fontFamily: FONT.extrabold, color: T.ink, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  modalBackdrop:    { flex: 1, backgroundColor: 'rgba(12,13,28,0.55)', justifyContent: 'center', padding: 24 },
  modalCard:        { backgroundColor: modalBg, borderRadius: 24, padding: 20 },
  modalHead:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  modalIcon:        { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalSubject:     { fontSize: 16, fontFamily: FONT.black, color: T.ink },
  modalTopic:       { fontSize: 12, color: T.muted, fontFamily: FONT.semibold, marginTop: 2 },
  modalScoreWrap:   { alignItems: 'center', marginBottom: 18 },
  modalScoreBig:    { fontSize: 44, fontFamily: FONT.black, color: T.ink, letterSpacing: -1 },
  modalScoreTot:    { fontSize: 20, color: T.faint, fontFamily: FONT.extrabold },
  modalScorePct:    { fontSize: 15, fontFamily: FONT.black, marginTop: 2 },
  modalStatsRow:    { flexDirection: 'row', backgroundColor: T.canvas, borderRadius: 16, paddingVertical: 14, marginBottom: 14 },
  modalStat:        { flex: 1, alignItems: 'center' },
  modalStatVal:     { fontSize: 20, fontFamily: FONT.black, color: T.ink },
  modalStatLbl:     { fontSize: 10, fontFamily: FONT.bold, color: T.muted, marginTop: 2 },
  modalClose:       { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 14, alignItems: 'center', ...(T === D ? {} : shadowSm) },
  modalCloseTxt:    { color: '#fff', fontSize: 14, fontFamily: FONT.black },
  });
}
