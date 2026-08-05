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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StudentErrorState } from '../../theme/studentUI';
// Night palette — the same one AI Teacher and Home are built on. Progress is a
// data page, so hue here is INFORMATION (ring arcs, bar peaks, subject accents,
// score colours); the surfaces stay neutral so those reads stay legible.
import { N } from '../../theme/nightTheme';
import { NightBg } from '../../theme/nightChrome';
import { FONT } from '../../constants/fonts';
import { FadeInOnce, Shimmer } from '../parent/ParentApp/anim';

const PRIMARY = N.violet;
// The idle bar / secondary accent. The night palette's blue is a true blue; the
// chart wants the cyan next to it so a violet peak reads as "this one is bigger",
// not "this one is a different metric".
const CYAN = '#22D3EE';

const SUBJ_ABBR = {
  Physics: 'Ph', Chemistry: 'Ch', Mathematics: 'Ma', Maths: 'Ma', Biology: 'Bi',
  English: 'En', Hindi: 'हि', 'Social Science': 'SS', Science: 'Sc',
  'Current Affairs': 'CA', 'Computer Applications': 'CA', 'Information Technology': 'IT', 'Brain Gym': 'BG',
};
const abbr = (name) => SUBJ_ABBR[name] || (name || '?').trim().slice(0, 2);

// Subject accents, picked for the dark surface: the light build's #2563EB /
// #16A34A sink into the violet page, so each subject gets the brighter member of
// its own hue family instead.
const SUBJECT_COLORS = {
  Physics: '#FF8A3D', Chemistry: '#FF5C8A', Mathematics: '#A78BFA', Maths: '#A78BFA',
  Biology: CYAN, English: N.amber, Hindi: N.red, 'Social Science': '#4ADE80',
  Science: '#2DD4BF', 'Current Affairs': '#C084FC', 'Computer Applications': N.blue,
  'Information Technology': N.blue, 'Brain Gym': N.violet,
};
const PALETTE = [N.violet, '#4ADE80', N.blue, '#FF8A3D', N.red, CYAN, '#2DD4BF', '#C084FC'];
const subjectColor = (name, i) => {
  if (SUBJECT_COLORS[name]) return SUBJECT_COLORS[name];
  const k = Object.keys(SUBJECT_COLORS).find((k) => (name || '').includes(k));
  return k ? SUBJECT_COLORS[k] : PALETTE[i % PALETTE.length];
};
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
const scoreColor = (pct) => (pct >= 70 ? N.green : pct >= 50 ? N.amber : N.red);
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

// The stat cards' progress ring. `pct` is progress toward that stat's goal (see
// GOALS) — a ring needs a denominator, so a raw count can't drive one.
function Ring({ pct = 0, label, color = PRIMARY, size = 56, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={N.track} strokeWidth={stroke} fill="none" />
        {p > 0 && (
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={circ * (1 - p / 100)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <Text style={s.ringTxt}>{label}</Text>
    </View>
  );
}

// Shimmer's own base is the light build's #EDEDF0 — it is shared with the Parent
// app, so instead of recolouring it globally each block is given the night card
// colour and the sweep reads as a highlight across it.
const SKEL = { backgroundColor: N.card };

function ResultsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <Shimmer w="100%" h={68} r={18} style={SKEL} />
      {[0, 1, 2, 3].map((i) => <Shimmer key={i} w="100%" h={90} r={20} mt={12} style={SKEL} />)}
      <Shimmer w="100%" h={210} r={22} mt={16} style={SKEL} />
    </View>
  );
}

export default function ResultsView({ fetchResults, fetchAttemptSections, header, enableTabScrollToTop = false, contentBottomPad = 32 }) {
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
  const manyBars = daily.length > 8;
  // The busiest bar is the violet one; every other bar is cyan. -1 when nothing
  // was studied, so an all-zero chart has no false "peak".
  const peakIdx = daily.some((d) => d.secs > 0)
    ? daily.reduce((best, d, i) => ((d.secs || 0) > (daily[best].secs || 0) ? i : best), 0)
    : -1;

  // A ring needs a denominator, so each stat gets a modest goal for the period —
  // a month simply scales the week's. Avg Score is already a percentage and rings
  // itself. These are display goals only; nothing is scored against them.
  const scale = period === 'month' ? 4 : 1;
  const pctOf = (val, goal) => (goal > 0 ? Math.min(100, (val / goal) * 100) : 0);
  const avg = ov.avgScore ?? 0;
  const hoursPct = pctOf((ov.studySeconds || 0) / 3600, 6 * scale);
  const testsPct = pctOf(ov.testsTaken || 0, 10 * scale);
  const xpPct = pctOf(ov.xp || 0, 500 * scale);

  const cards = [
    { ring: testsPct, color: N.blue, val: String(ov.testsTaken ?? 0), lbl: 'Tests Taken', sub: `Mocks: ${ov.mocks ?? 0} · Quizzes: ${ov.quizzes ?? 0}` },
    { ring: avg, color: scoreColor(avg), val: `${avg}%`, lbl: 'Avg Score', sub: 'Across all attempts' },
    { ring: hoursPct, color: PRIMARY, val: fmtHoursTotal(ov.studySeconds), lbl: 'Hours', sub: `Total study time this ${period}` },
    { ring: xpPct, color: N.green, val: (ov.xp ?? 0).toLocaleString(), lbl: 'XP Earned', sub: 'Keep it up! 🚀' },
  ];

  return (
    <View style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={N.bgTop} translucent={false} />
      <NightBg id="progress" />

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
        <StudentErrorState title="Couldn’t load progress" message={state.error} onRetry={() => load(period, offset, false)} />
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

        {/* Overview — one full-width row per stat, each led by its progress ring */}
        <FadeInOnce id="res-cards" delay={60} y={14}>
          <View style={s.cardsCol}>
            {cards.map((c, i) => (
              <View key={i} style={s.ovCard}>
                <Ring pct={c.ring} color={c.color} label={`${Math.round(c.ring)}%`} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.ovLbl}>{c.lbl}</Text>
                  <Text style={s.ovVal}>{c.val}</Text>
                  <Text style={s.ovSub} numberOfLines={1}>{c.sub}</Text>
                </View>
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
          {/* No gridlines or per-bar numbers — the shape is the message. The one
              scale cue is the peak, so the bars still mean something absolute. */}
          <Text style={s.scaleTxt}>Peak {fmtHM(maxSecs) || '0m'}</Text>
          <View style={s.chartArea}>
            {manyBars ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                ref={barsScrollRef}
                onContentSizeChange={() => { if (daily.length !== lastBarCount.current) { lastBarCount.current = daily.length; barsScrollRef.current?.scrollToEnd({ animated: false }); } }}
                style={s.barsScroll} contentContainerStyle={s.barsScrollContent}>
                {daily.map((d, i) => {
                  const barH = Math.max(10, ((d.secs || 0) / maxSecs) * 150);
                  return (
                    <View key={i} style={s.barColFixed}>
                      <View style={[s.bar, { height: barH, backgroundColor: i === peakIdx ? PRIMARY : CYAN }]} />
                      <Text style={s.barLabel}>{d.day}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={s.barsRow}>
                {daily.map((d, i) => {
                  const barH = Math.max(10, ((d.secs || 0) / maxSecs) * 150);
                  return (
                    <View key={i} style={s.barCol}>
                      <View style={[s.bar, { height: barH, backgroundColor: i === peakIdx ? PRIMARY : CYAN }]} />
                      <Text style={s.barLabel}>{d.day}</Text>
                      {!!d.sub && <Text style={s.barSub}>{d.sub}</Text>}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
        </FadeInOnce>

        {/* Subject breakdown */}
        <FadeInOnce id="res-subj" delay={120} y={14}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Subject Breakdown</Text>
          {subjects.length === 0 ? (
            <View style={s.card}><Text style={s.emptyCardTxt}>No tests or MCQ practice in this period.</Text></View>
          ) : (showAllSubjects ? subjects : subjects.slice(0, 5)).map((sub, i) => {
            const col = subjectColor(sub.name, i);
            const attempted = sub.tests || sub.mcqs;
            return (
              <TouchableOpacity key={i} style={s.subjCard} activeOpacity={0.7} onPress={() => setSubjectDetail(sub)}
                accessibilityLabel={`${sub.name}. ${attempted ? `${sub.score} percent. ${subjMeta(sub)}` : 'No attempts'}`}>
                <View style={[s.subjIcon, { backgroundColor: col + '26', borderColor: col + '59' }]}><Text style={{ fontSize: 17 }}>{emojiFor(sub.name)}</Text></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={s.subjTopRow}>
                    <Text style={s.subjName} numberOfLines={1}>{sub.name}</Text>
                    <Text style={[s.subjScore, { color: attempted ? col : N.inkDim }]}>{attempted ? `${sub.score}%` : 'None'}</Text>
                  </View>
                  <View style={s.subjBarBg}>
                    <View style={[s.subjBarFill, { width: `${attempted ? sub.score : 0}%`, backgroundColor: col }]} />
                  </View>
                </View>
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
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Tests</Text>
          {recent.length === 0 ? (
            <View style={s.card}><Text style={s.emptyCardTxt}>Recent tests and quizzes will appear here.</Text></View>
          ) : (
            <>
              {recent.map((t, i) => {
                const pct = t.total > 0 ? Math.round((t.score / t.total) * 100) : 0;
                const isQuiz = t.type === 'Quiz';
                return (
                  <TouchableOpacity key={i} activeOpacity={0.7} onPress={() => setDetail(t)} style={s.recCard}
                    accessibilityLabel={`${t.subject}, ${t.topic}, scored ${t.score} of ${t.total}`}>
                    <View style={[s.recIcon, isQuiz ? s.recIconQuiz : s.recIconMock]}>
                      <Text style={{ fontSize: 16 }}>{isQuiz ? '❓' : '📋'}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.recSubject} numberOfLines={1}>{t.subject}</Text>
                      <Text style={s.recTopic} numberOfLines={1}>
                        {[t.topic, relativeDate(t.createdAt)].filter(Boolean).join('  ·  ')}
                      </Text>
                    </View>
                    <View style={s.recRight}>
                      <Text style={s.recScore}>{t.score}/{t.total}</Text>
                      <Text style={[s.recPct, { color: scoreColor(pct) }]}>{pct}%</Text>
                    </View>
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
                    <View style={[s.modalIcon, { backgroundColor: isQuiz ? N.greenSoft : N.violetSoft }]}><Text style={{ fontSize: 22 }}>{isQuiz ? '❓' : '📋'}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.modalSubject}>{detail.subject}</Text>
                      <Text style={s.modalTopic} numberOfLines={2}>{detail.topic}</Text>
                    </View>
                    <View style={[s.typePill, isQuiz ? s.typePillQuiz : s.typePillMock]}><Text style={[s.typePillTxt, { color: isQuiz ? N.green : PRIMARY }]}>{detail.type}</Text></View>
                  </View>
                  <View style={s.modalScoreWrap}>
                    <Text style={s.modalScoreBig}>{detail.score}<Text style={s.modalScoreTot}>/{detail.total}</Text></Text>
                    <Text style={[s.modalScorePct, { color: scoreColor(pct) }]}>{pct}%</Text>
                  </View>
                  <View style={s.modalStatsRow}>
                    <View style={s.modalStat}><Text style={[s.modalStatVal, { color: N.green }]}>{detail.correct}</Text><Text style={s.modalStatLbl}>Correct</Text></View>
                    <View style={s.modalStat}><Text style={[s.modalStatVal, { color: N.red }]}>{detail.wrong}</Text><Text style={s.modalStatLbl}>Wrong</Text></View>
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
                    <Text style={[s.modalScorePct, { color: attempted ? col : N.inkDim, fontSize: 24 }]}>{attempted ? `${subjectDetail.score}%` : '—'}</Text>
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

// Soft black drop — a coloured shadow on the violet page reads as blur, not lift.
const lift = { shadowColor: '#05030F', shadowOpacity: 0.34, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 };

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: N.bg },

  // period toggle — full-width track, the active half is a solid violet pill
  periodWrap:       { paddingHorizontal: 16, paddingBottom: 8 },
  periodRow:        { flexDirection: 'row', gap: 6, backgroundColor: 'rgba(10,8,26,0.55)', borderWidth: 1, borderColor: N.cardEdge, borderRadius: 26, padding: 5 },
  periodBtn:        { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  periodBtnActive:  { backgroundColor: PRIMARY },
  periodTxt:        { fontSize: 15, fontFamily: FONT.bold, color: N.inkSoft },
  periodTxtActive:  { color: N.ink, fontFamily: FONT.extrabold },

  dateNav:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 9 },
  dateArrow:        { fontSize: 24, color: N.inkSoft, fontFamily: FONT.bold, paddingHorizontal: 6 },
  dateArrowOff:     { color: N.inkDim },
  dateLabel:        { fontSize: 14, fontFamily: FONT.extrabold, color: N.inkSoft },
  refreshChip:      { position: 'absolute', top: 8, alignSelf: 'center', backgroundColor: N.card, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: N.cardEdge, ...lift },
  emptyCardTxt:     { fontSize: 13, color: N.inkSoft, fontFamily: FONT.semibold, textAlign: 'center', lineHeight: 19, paddingVertical: 14 },

  // streak ribbon — amber edge so it reads as its own thing above the stats
  streak:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12,
                      backgroundColor: N.card, borderWidth: 1, borderColor: 'rgba(249,115,22,0.42)', borderRadius: 18, padding: 14 },
  streakFlame:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(249,115,22,0.18)', alignItems: 'center', justifyContent: 'center' },
  streakTitle:      { fontSize: 15, fontFamily: FONT.extrabold, color: N.ink },
  streakSub:        { fontSize: 12, color: '#F0913F', fontFamily: FONT.semibold, marginTop: 2 },
  streakDots:       { flexDirection: 'row', gap: 5, marginLeft: 'auto' },
  streakDot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)' },
  streakDotOn:      { backgroundColor: '#F97316' },

  // overview — a stacked list of full-width rows, each led by its ring
  cardsCol:         { gap: 12, marginTop: 16 },
  ovCard:           { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: N.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: N.cardEdge, ...lift },
  ringTxt:          { fontSize: 13, fontFamily: FONT.extrabold, color: N.ink },
  ovLbl:            { fontSize: 13.5, fontFamily: FONT.bold, color: N.inkSoft },
  ovVal:            { fontSize: 25, fontFamily: FONT.black, color: N.ink, letterSpacing: -0.7, marginTop: 1 },
  ovSub:            { fontSize: 11.5, fontFamily: FONT.semibold, color: N.inkDim, marginTop: 3 },

  card:             { backgroundColor: N.card, borderRadius: 22, padding: 18, marginTop: 16, borderWidth: 1, borderColor: N.cardEdge, ...lift },
  cardHdr:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle:        { fontSize: 17, fontFamily: FONT.black, color: N.ink, letterSpacing: -0.3 },

  // free-standing section title above a list of individual cards
  section:          { marginTop: 10 },
  sectionTitle:     { fontSize: 18, fontFamily: FONT.black, color: N.ink, letterSpacing: -0.4, marginTop: 12, marginBottom: 12 },

  hoursPill:        { backgroundColor: 'rgba(34,211,238,0.14)', borderWidth: 1, borderColor: 'rgba(34,211,238,0.42)', borderRadius: 11, paddingVertical: 6, paddingHorizontal: 13 },
  hoursPillTxt:     { fontSize: 12, fontFamily: FONT.extrabold, color: CYAN },
  scaleTxt:         { fontSize: 10.5, fontFamily: FONT.bold, color: N.inkDim, marginTop: 2 },

  chartArea:        { height: 150 + 26, position: 'relative', marginTop: 12 },
  barsRow:          { flexDirection: 'row', alignItems: 'flex-end', height: 150 + 26, gap: 6 },
  barsScroll:       { height: 150 + 26 },
  barsScrollContent:{ flexDirection: 'row', alignItems: 'flex-end', height: 150 + 26, gap: 12, paddingRight: 14 },
  barColFixed:      { width: 42, alignItems: 'center' },
  barCol:           { flex: 1, alignItems: 'center' },
  bar:              { width: 18, borderRadius: 10 },
  barLabel:         { fontSize: 11, color: N.inkSoft, fontFamily: FONT.bold, marginTop: 8 },
  barSub:           { fontSize: 9, color: N.inkDim, fontFamily: FONT.semibold },

  // subject breakdown — one card per subject
  subjCard:         { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: N.card, borderRadius: 18, borderWidth: 1, borderColor: N.cardEdge, padding: 14, marginBottom: 10 },
  subjIcon:         { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  subjTopRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjName:         { fontSize: 15, fontFamily: FONT.extrabold, color: N.ink, flex: 1 },
  subjScore:        { fontSize: 14, fontFamily: FONT.black, marginLeft: 8 },
  subjBarBg:        { height: 6, backgroundColor: N.track, borderRadius: 3, overflow: 'hidden', marginTop: 9 },
  subjBarFill:      { height: 6, borderRadius: 3 },

  subjRecentRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: N.cardEdge },
  subjRecentTopic:  { flex: 1, fontSize: 12.5, fontFamily: FONT.bold, color: N.ink },
  subjRecentScore:  { fontSize: 12.5, fontFamily: FONT.extrabold, color: N.inkSoft },
  subjRecentPct:    { fontSize: 12.5, fontFamily: FONT.black, width: 44, textAlign: 'right' },
  subjRecentChev:   { fontSize: 17, color: N.inkDim, fontFamily: FONT.bold },
  subjNoRecent:     { fontSize: 12.5, color: N.inkSoft, fontFamily: FONT.semibold, textAlign: 'center', paddingVertical: 12, marginBottom: 4 },

  // recent tests — one card per attempt
  recCard:          { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: N.card, borderRadius: 18, borderWidth: 1, borderColor: N.cardEdge, padding: 14, marginBottom: 10 },
  recIcon:          { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  recIconMock:      { backgroundColor: N.violetSoft, borderColor: 'rgba(139,110,240,0.45)' },
  recIconQuiz:      { backgroundColor: N.blueSoft, borderColor: 'rgba(91,140,255,0.45)' },
  recSubject:       { fontSize: 15, fontFamily: FONT.extrabold, color: N.ink },
  recTopic:         { fontSize: 12, color: N.inkSoft, fontFamily: FONT.semibold, marginTop: 3 },
  recRight:         { alignItems: 'flex-end' },
  recScore:         { fontSize: 16, fontFamily: FONT.black, color: N.ink, letterSpacing: -0.3 },
  recPct:           { fontSize: 12.5, fontFamily: FONT.extrabold, marginTop: 2 },
  recFooter:        { fontSize: 11, color: N.inkDim, fontFamily: FONT.semibold, textAlign: 'center', marginTop: 6 },

  viewAllBtn:       { alignItems: 'center', paddingVertical: 13, marginTop: 2, borderRadius: 14, borderWidth: 1, borderColor: N.cardEdge, backgroundColor: N.cardSoft },
  viewAllTxt:       { fontSize: 13, fontFamily: FONT.extrabold, color: N.dot },

  typePill:         { borderRadius: 8, paddingVertical: 3, paddingHorizontal: 9 },
  typePillMock:     { backgroundColor: N.violetSoft },
  typePillQuiz:     { backgroundColor: N.greenSoft },
  typePillTxt:      { fontSize: 9.5, fontFamily: FONT.extrabold },

  // ── modals ──
  secBlock:         { marginBottom: 16 },
  secBlockTitle:    { fontSize: 12, fontFamily: FONT.extrabold, color: N.inkSoft, marginBottom: 10, letterSpacing: 0.3, textTransform: 'uppercase' },
  secRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  secName:          { fontSize: 12, fontFamily: FONT.extrabold, color: N.ink, width: 78 },
  secBarBg:         { flex: 1, height: 6, backgroundColor: N.track, borderRadius: 3, overflow: 'hidden' },
  secBarFill:       { height: 6, borderRadius: 3 },
  secStat:          { fontSize: 11, fontFamily: FONT.bold, color: N.inkSoft, width: 42, textAlign: 'right' },
  secPct:           { fontSize: 12, fontFamily: FONT.black, width: 40, textAlign: 'right' },
  infoBlock:        { backgroundColor: N.cardSoft, borderWidth: 1, borderColor: N.cardEdge, borderRadius: 16, padding: 14, marginBottom: 18, gap: 10 },
  infoLine:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel:        { fontSize: 12, fontFamily: FONT.bold, color: N.inkSoft },
  infoVal:          { fontSize: 12, fontFamily: FONT.extrabold, color: N.ink, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  modalBackdrop:    { flex: 1, backgroundColor: 'rgba(4,3,14,0.66)', justifyContent: 'center', padding: 24 },
  modalCard:        { backgroundColor: '#191636', borderWidth: 1, borderColor: N.cardEdge, borderRadius: 24, padding: 20 },
  modalHead:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  modalIcon:        { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalSubject:     { fontSize: 16, fontFamily: FONT.black, color: N.ink },
  modalTopic:       { fontSize: 12, color: N.inkSoft, fontFamily: FONT.semibold, marginTop: 2 },
  modalScoreWrap:   { alignItems: 'center', marginBottom: 18 },
  modalScoreBig:    { fontSize: 44, fontFamily: FONT.black, color: N.ink, letterSpacing: -1 },
  modalScoreTot:    { fontSize: 20, color: N.inkDim, fontFamily: FONT.extrabold },
  modalScorePct:    { fontSize: 15, fontFamily: FONT.black, marginTop: 2 },
  modalStatsRow:    { flexDirection: 'row', backgroundColor: N.cardSoft, borderWidth: 1, borderColor: N.cardEdge, borderRadius: 16, paddingVertical: 14, marginBottom: 14 },
  modalStat:        { flex: 1, alignItems: 'center' },
  modalStatVal:     { fontSize: 20, fontFamily: FONT.black, color: N.ink },
  modalStatLbl:     { fontSize: 10, fontFamily: FONT.bold, color: N.inkSoft, marginTop: 2 },
  modalClose:       { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalCloseTxt:    { color: N.ink, fontSize: 14, fontFamily: FONT.black },
});
