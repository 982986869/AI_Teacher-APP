import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { getResults, getAttemptDetail } from '../api/learningApi';

const PRIMARY = '#6C5CE7';
const AMBER = '#EB9A16';

const SUBJ_ABBR = {
  Physics: 'Ph', Chemistry: 'Ch', Mathematics: 'Ma', Maths: 'Ma', Biology: 'Bi',
  English: 'En', Hindi: 'हि', 'Social Science': 'SS', Science: 'Sc',
  'Current Affairs': 'CA', 'Computer Applications': 'CA', 'Information Technology': 'IT', 'Brain Gym': 'BG',
};
const abbr = (name) => SUBJ_ABBR[name] || (name || '?').trim().slice(0, 2);

const SUBJECT_COLORS = {
  Physics: '#6C5CE7', Chemistry: '#22C55E', Mathematics: '#3B82F6', Maths: '#3B82F6',
  Biology: '#16A34A', English: '#F59E0B', Hindi: '#EF4444', 'Social Science': '#0EA5E9',
  Science: '#14B8A6', 'Current Affairs': '#8B5CF6', 'Computer Applications': '#6366F1',
  'Information Technology': '#6366F1', 'Brain Gym': '#8B5CF6',
};
const PALETTE = ['#6C5CE7', '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#0EA5E9', '#14B8A6', '#8B5CF6'];
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
const scoreColor = (pct) => (pct >= 70 ? '#16A34A' : pct >= 50 ? '#F59E0B' : '#EF4444');
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

const ResultsScreen = () => {
  const [period, setPeriod] = useState('week');
  const [offset, setOffset] = useState(0);
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState(null);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [sections, setSections] = useState({ loading: false, list: [] });
  const [subjectDetail, setSubjectDetail] = useState(null);
  const barsScrollRef = useRef(null);

  const load = useCallback((p, off, isRefresh) => {
    if (!isRefresh) setState((prev) => ({ ...prev, loading: true, error: null }));
    return getResults(p, off)
      .then((data) => setState({ loading: false, error: null, data }))
      .catch((err) => setState({ loading: false, error: err?.response?.data?.error || err?.message || 'Could not load progress', data: null }));
  }, []);

  useEffect(() => {
    let alive = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    getResults(period, offset)
      .then((data) => { if (alive) setState({ loading: false, error: null, data }); })
      .catch((err) => { if (alive) setState({ loading: false, error: err?.response?.data?.error || err?.message || 'Could not load progress', data: null }); });
    return () => { alive = false; };
  }, [period, offset]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(period, offset, true).finally(() => setRefreshing(false));
  }, [load, period, offset]);

  // On opening a Mock attempt, fetch its section-wise breakdown.
  useEffect(() => {
    if (!detail || detail.type !== 'Mock' || !detail.id) { setSections({ loading: false, list: [] }); return undefined; }
    let alive = true;
    setSections({ loading: true, list: [] });
    getAttemptDetail(detail.id)
      .then((d) => { if (alive) setSections({ loading: false, list: d?.sections || [] }); })
      .catch(() => { if (alive) setSections({ loading: false, list: [] }); });
    return () => { alive = false; };
  }, [detail]);

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
    { icon: '📋', bg: '#EEEBFF', tint: PRIMARY, val: String(ov.testsTaken ?? 0), lbl: 'Tests Taken', sub: `Mocks: ${ov.mocks ?? 0} · Quizzes: ${ov.quizzes ?? 0}` },
    { icon: '🎯', bg: '#E4F8EE', tint: '#22C55E', val: `${ov.avgScore ?? 0}%`, lbl: 'Avg Score', sub: 'Across all attempts' },
    { icon: '⏱', bg: '#FFF2E0', tint: '#F59E0B', val: fmtHoursTotal(ov.studySeconds), lbl: 'Hours', sub: 'Total study time' },
    { icon: '⚡', bg: '#F5EAFF', tint: '#A855F7', val: (ov.xp ?? 0).toLocaleString(), lbl: 'XP Earned', sub: 'Keep it up! 🚀' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerIcon}>☰</Text>
        <Text style={s.headerTitle}>My Progress</Text>
        <Text style={s.headerIcon}>🗓</Text>
      </View>

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

      {state.loading ? (
        <View style={s.centerFill}><ActivityIndicator size="large" color={PRIMARY} /></View>
      ) : state.error ? (
        <View style={s.centerFill}>
          <Text style={s.emptyTitle}>Couldn't load progress</Text>
          <Text style={s.emptySub}>{state.error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load(period, offset, false)}><Text style={s.retryTxt}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}>

        {/* Study streak ribbon */}
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

        {/* Overview cards (2×2) */}
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

        {/* Activity chart */}
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
                onContentSizeChange={() => barsScrollRef.current?.scrollToEnd({ animated: false })}
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

        {/* Subject breakdown */}
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
                    <Text style={[s.subjScore, { color: attempted ? col : '#C7C7CC' }]}>{attempted ? `${sub.score}%` : '—'}</Text>
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

        {/* Recent tests */}
        <View style={s.card}>
          <View style={s.cardHdr}>
            <Text style={s.cardTitle}>Recent Tests</Text>
          </View>
          {recent.length === 0 ? (
            <Text style={s.emptyCardTxt}>Your recent tests and quizzes will appear here.</Text>
          ) : (
            <>
              {recent.map((t, i) => {
                const pct = t.total > 0 ? Math.round((t.score / t.total) * 100) : 0;
                const isQuiz = t.type === 'Quiz';
                return (
                  <TouchableOpacity key={i} activeOpacity={0.6} onPress={() => setDetail(t)}
                    style={[s.recRow, i < recent.length - 1 && s.recRowBorder]}>
                    <View style={[s.recIcon, { backgroundColor: isQuiz ? '#FBEBCC' : '#EEEBFF' }]}>
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

      </ScrollView>
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
                    <View style={[s.modalIcon, { backgroundColor: isQuiz ? '#E4F8EE' : '#EEEBFF' }]}><Text style={{ fontSize: 22 }}>{isQuiz ? '❓' : '📋'}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.modalSubject}>{detail.subject}</Text>
                      <Text style={s.modalTopic} numberOfLines={2}>{detail.topic}</Text>
                    </View>
                    <View style={[s.typePill, isQuiz ? s.typePillQuiz : s.typePillMock]}><Text style={[s.typePillTxt, { color: isQuiz ? '#16A34A' : PRIMARY }]}>{detail.type}</Text></View>
                  </View>
                  <View style={s.modalScoreWrap}>
                    <Text style={s.modalScoreBig}>{detail.score}<Text style={s.modalScoreTot}>/{detail.total}</Text></Text>
                    <Text style={[s.modalScorePct, { color: scoreColor(pct) }]}>{pct}%</Text>
                  </View>
                  <View style={s.modalStatsRow}>
                    <View style={s.modalStat}><Text style={[s.modalStatVal, { color: '#16A34A' }]}>{detail.correct}</Text><Text style={s.modalStatLbl}>Correct</Text></View>
                    <View style={s.modalStat}><Text style={[s.modalStatVal, { color: '#EF4444' }]}>{detail.wrong}</Text><Text style={s.modalStatLbl}>Wrong</Text></View>
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
                    <Text style={[s.modalScorePct, { color: attempted ? col : '#C7C7CC', fontSize: 24 }]}>{attempted ? `${subjectDetail.score}%` : '—'}</Text>
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
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#F6F7FB' },
  header:           { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8 },
  headerIcon:       { fontSize: 18, color: '#1C1C1E', width: 28, textAlign: 'center' },
  headerTitle:      { fontSize: 20, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.4 },
  periodWrap:       { backgroundColor: '#fff', alignItems: 'center', paddingBottom: 6 },
  periodRow:        { flexDirection: 'row', backgroundColor: '#F0F0F4', borderRadius: 20, padding: 4 },
  periodBtn:        { paddingVertical: 7, paddingHorizontal: 22, borderRadius: 16 },
  periodBtnActive:  { backgroundColor: PRIMARY },
  periodTxt:        { fontSize: 13, fontWeight: '800', color: '#8A8A99' },
  periodTxtActive:  { color: '#fff' },
  dateNav:          { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 9 },
  dateArrow:        { fontSize: 24, color: '#8A8A99', fontWeight: '700', paddingHorizontal: 6 },
  dateArrowOff:     { color: '#DDD' },
  dateLabel:        { fontSize: 14, fontWeight: '800', color: '#4A4A57' },
  centerFill:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  retryBtn:         { marginTop: 16, backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24 },
  retryTxt:         { color: '#fff', fontSize: 13, fontWeight: '800' },
  emptyTitle:       { fontSize: 16, fontWeight: '900', color: '#1C1C1E', marginBottom: 6 },
  emptySub:         { fontSize: 13, color: '#8A8A99', fontWeight: '600', textAlign: 'center' },
  emptyCardTxt:     { fontSize: 13, color: '#8A8A99', fontWeight: '600', textAlign: 'center', lineHeight: 19, paddingVertical: 14 },
  streak:           { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 12,
                      backgroundColor: '#FDF3E0', borderWidth: 1, borderColor: '#F4E0BC', borderRadius: 18, padding: 12 },
  streakFlame:      { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FBEBCC', alignItems: 'center', justifyContent: 'center' },
  streakTitle:      { fontSize: 14, fontWeight: '800', color: '#1C1C1E' },
  streakSub:        { fontSize: 11.5, color: '#8A7A55', fontWeight: '600', marginTop: 1 },
  streakDots:       { flexDirection: 'row', gap: 4, marginLeft: 'auto' },
  streakDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EAD9B4' },
  streakDotOn:      { backgroundColor: AMBER },
  subjTag:          { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  subjTagTxt:       { fontSize: 13, fontWeight: '800', color: '#fff' },
  cardsGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  ovCard:           { width: '47.6%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#6C5CE7', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  ovIcon:           { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ovLbl:            { fontSize: 12, fontWeight: '700', color: '#8A8A99' },
  ovVal:            { fontSize: 26, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.8, marginTop: 2 },
  ovSub:            { fontSize: 10.5, fontWeight: '600', color: '#A9A9B8', marginTop: 4 },
  card:             { backgroundColor: '#fff', borderRadius: 22, padding: 18, marginTop: 16, shadowColor: '#6C5CE7', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardHdr:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle:        { fontSize: 17, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  hoursPill:        { borderWidth: 1.5, borderColor: '#ECECF2', borderRadius: 10, paddingVertical: 5, paddingHorizontal: 12 },
  hoursPillTxt:     { fontSize: 12, fontWeight: '800', color: '#6A6A78' },
  chartArea:        { height: 150 + 22 + 30, position: 'relative', marginTop: 8 },
  gridline:         { position: 'absolute', left: 24, right: 0, height: 1, borderTopWidth: 1, borderColor: '#F0F0F4', borderStyle: 'dashed' },
  yLabel:           { position: 'absolute', left: -24, top: -7, fontSize: 9, color: '#B8B8C4', fontWeight: '700', width: 22, textAlign: 'right' },
  barsRow:          { flexDirection: 'row', alignItems: 'flex-end', height: 150 + 22, paddingLeft: 24, gap: 6 },
  barsScroll:       { marginLeft: 24, height: 150 + 22 },
  barsScrollContent:{ flexDirection: 'row', alignItems: 'flex-end', height: 150 + 22, gap: 12, paddingRight: 14 },
  barColFixed:      { width: 42, alignItems: 'center' },
  barCol:           { flex: 1, alignItems: 'center' },
  barVal:           { fontSize: 8.5, color: '#8A8A99', fontWeight: '700', marginBottom: 4, height: 12 },
  bar:              { width: '62%', maxWidth: 26, backgroundColor: PRIMARY, borderRadius: 8 },
  barLabel:         { fontSize: 11, color: '#4A4A57', fontWeight: '800', marginTop: 6 },
  barLabelSmall:    { fontSize: 8, marginTop: 4 },
  barSub:           { fontSize: 9, color: '#A9A9B8', fontWeight: '600' },
  legendRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
  legendDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY },
  legendTxt:        { fontSize: 11, color: '#8A8A99', fontWeight: '700' },
  subjRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  subjIcon:         { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  subjTopRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subjName:         { fontSize: 14, fontWeight: '800', color: '#1C1C1E', flex: 1 },
  subjScore:        { fontSize: 14, fontWeight: '900', marginLeft: 8 },
  subjBarBg:        { height: 7, backgroundColor: '#F0F0F4', borderRadius: 4, overflow: 'hidden' },
  subjBarFill:      { height: 7, borderRadius: 4 },
  subjMeta:         { fontSize: 11, color: '#A9A9B8', fontWeight: '700', marginTop: 5 },
  subjChevron:      { fontSize: 20, color: '#C7C7D2', fontWeight: '700', marginLeft: 6, alignSelf: 'center' },
  subjRecentRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F4F4F8' },
  subjRecentTopic:  { flex: 1, fontSize: 12.5, fontWeight: '700', color: '#1C1C1E' },
  subjRecentScore:  { fontSize: 12.5, fontWeight: '800', color: '#8A8A99' },
  subjRecentPct:    { fontSize: 12.5, fontWeight: '900', width: 44, textAlign: 'right' },
  subjRecentChev:   { fontSize: 17, color: '#C7C7D2', fontWeight: '700' },
  subjNoRecent:     { fontSize: 12.5, color: '#8A8A99', fontWeight: '600', textAlign: 'center', paddingVertical: 12, marginBottom: 4 },
  recRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  recRowBorder:     { borderBottomWidth: 1, borderBottomColor: '#F4F4F8' },
  recIcon:          { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recSubject:       { fontSize: 14, fontWeight: '800', color: '#1C1C1E' },
  recTopic:         { fontSize: 11.5, color: '#8A8A99', fontWeight: '600', marginTop: 1 },
  recMetaRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  recDate:          { fontSize: 10.5, color: '#A9A9B8', fontWeight: '600' },
  typePill:         { borderRadius: 7, paddingVertical: 2, paddingHorizontal: 8 },
  typePillMock:     { backgroundColor: '#EEEBFF' },
  typePillQuiz:     { backgroundColor: '#FBEBCC' },
  typePillTxt:      { fontSize: 9.5, fontWeight: '800' },
  recRight:         { alignItems: 'flex-end' },
  recScore:         { fontSize: 15, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  recPct:           { fontSize: 12, fontWeight: '800', marginTop: 2 },
  recChevron:       { fontSize: 20, color: '#C7C7D2', fontWeight: '700', marginLeft: 4 },
  recFooter:        { fontSize: 11, color: '#A9A9B8', fontWeight: '600', textAlign: 'center', marginTop: 12 },
  viewAllBtn:       { alignItems: 'center', paddingVertical: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: '#F4F4F8' },
  viewAllTxt:       { fontSize: 13, fontWeight: '800', color: PRIMARY },
  // Section-wise + info block (detail modal)
  secBlock:         { marginBottom: 16 },
  secBlockTitle:    { fontSize: 12, fontWeight: '800', color: '#8A8A99', marginBottom: 10, letterSpacing: 0.3, textTransform: 'uppercase' },
  secRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  secName:          { fontSize: 12, fontWeight: '800', color: '#1C1C1E', width: 78 },
  secBarBg:         { flex: 1, height: 6, backgroundColor: '#F0F0F4', borderRadius: 3, overflow: 'hidden' },
  secBarFill:       { height: 6, borderRadius: 3 },
  secStat:          { fontSize: 11, fontWeight: '700', color: '#8A8A99', width: 42, textAlign: 'right' },
  secPct:           { fontSize: 12, fontWeight: '900', width: 40, textAlign: 'right' },
  infoBlock:        { backgroundColor: '#F6F7FB', borderRadius: 16, padding: 14, marginBottom: 18, gap: 10 },
  infoLine:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel:        { fontSize: 12, fontWeight: '700', color: '#8A8A99' },
  infoVal:          { fontSize: 12, fontWeight: '800', color: '#1C1C1E', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  // Modal
  modalBackdrop:    { flex: 1, backgroundColor: 'rgba(20,18,40,0.45)', justifyContent: 'center', padding: 24 },
  modalCard:        { backgroundColor: '#fff', borderRadius: 24, padding: 20 },
  modalHead:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  modalIcon:        { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalSubject:     { fontSize: 16, fontWeight: '900', color: '#1C1C1E' },
  modalTopic:       { fontSize: 12, color: '#8A8A99', fontWeight: '600', marginTop: 2 },
  modalScoreWrap:   { alignItems: 'center', marginBottom: 18 },
  modalScoreBig:    { fontSize: 44, fontWeight: '900', color: '#1C1C1E', letterSpacing: -1 },
  modalScoreTot:    { fontSize: 20, color: '#C7C7D2', fontWeight: '800' },
  modalScorePct:    { fontSize: 15, fontWeight: '900', marginTop: 2 },
  modalStatsRow:    { flexDirection: 'row', backgroundColor: '#F6F7FB', borderRadius: 16, paddingVertical: 14, marginBottom: 14 },
  modalStat:        { flex: 1, alignItems: 'center' },
  modalStatVal:     { fontSize: 20, fontWeight: '900', color: '#1C1C1E' },
  modalStatLbl:     { fontSize: 10, fontWeight: '700', color: '#8A8A99', marginTop: 2 },
  modalMetaRow:     { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 },
  modalMeta:        { fontSize: 12, fontWeight: '700', color: '#8A8A99' },
  modalClose:       { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalCloseTxt:    { color: '#fff', fontSize: 14, fontWeight: '900' },
});

export default ResultsScreen;
