// src/screens/parent/ParentApp/ProgressTab.js — teammate's week UI + real report stats.
import React, { memo, useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { C, st, T, Label, DOWF, MONF, ARENA_BASE_RATING } from './constants';
import Header from './Header';
import { CountUp, PressableScale } from './anim';
import { SleepyMonitor } from './illustrations';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DFULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Same static appearance as before (s=22, same colours) — numbers just animate up on
// mount. Handles plain numbers and the "85%" accuracy string transparently.
function Stat({ value, label, color }) {
  const pct = typeof value === 'string' && /^\d+%$/.test(value);
  return (
    <View style={st.stat}>
      {typeof value === 'number'
        ? <CountUp value={value} w="xbold" s={22} c={color || C.ink} />
        : pct
          ? <CountUp value={parseInt(value, 10)} suffix="%" w="xbold" s={22} c={color || C.ink} />
          : <T w="xbold" s={22} c={color || C.ink}>{value}</T>}
      <T w="bold" s={11} c={C.muted} style={{ marginTop: 3 }}>{label}</T>
    </View>
  );
}

function ProgressTab({ meta, childName, onAvatar, onGym, flash, report, refreshing, onRefresh }) {
  const bg = report.brainGym || {};
  const ar = report.arena || {};
  const mistakes = Number(report.openMistakes) || 0;
  const weakAreas = Array.isArray(report.weakAreas) ? report.weakAreas : [];
  const topWeak = weakAreas[0] ? (weakAreas[0].chapter || weakAreas[0].subject) : null;
  const hasActivity = (Number(bg.quizzesCompleted) || 0) > 0 || (Number(bg.totalXp) || 0) > 0;

  // Navigable week strip over the last 5 weeks. report.calendar.days is 35 days,
  // Sun→Sat aligned (ending this week), each { date, key, active, isToday, isFuture }.
  const weeks = useMemo(() => {
    const cal = (report.calendar && Array.isArray(report.calendar.days)) ? report.calendar.days : [];
    const out = [];
    for (let i = 0; i + 7 <= cal.length; i += 7) out.push(cal.slice(i, i + 7));
    return out;
  }, [report.calendar]);
  const lastIdx = Math.max(0, weeks.length - 1);
  const [wkOffset, setWkOffset] = useState(0);        // 0 = current week; higher = older
  const idx = Math.max(0, lastIdx - wkOffset);
  const weekDays = weeks[idx] || [];
  const canOlder = idx > 0;
  const canNewer = idx < lastIdx;
  const hdr = useMemo(() => {
    if (weekDays.length) {
      const parse = (k) => { const p = String(k).split('-').map(Number); return { y: p[0], m: (p[1] || 1) - 1, d: p[2] }; };
      const f = parse(weekDays[0].key), l = parse(weekDays[weekDays.length - 1].key);
      return (f.m === l.m ? `${f.d}–${l.d} ${MONF[l.m]} ${l.y}` : `${f.d} ${MONF[f.m]} – ${l.d} ${MONF[l.m]} ${l.y}`).toUpperCase();
    }
    const t = new Date();
    return `${DOWF[t.getDay()]}, ${t.getDate()} ${MONF[t.getMonth()]}, ${t.getFullYear()}`.toUpperCase();
  }, [weekDays]);

  // Tap a date to inspect that day. Defaults to today; detail shows quizzes/XP.
  const allDays = (report.calendar && Array.isArray(report.calendar.days)) ? report.calendar.days : [];
  const todayKey = (allDays.find((d) => d.isToday) || {}).key || null;
  const [selKey, setSelKey] = useState(null);
  const effSelKey = selKey || todayKey;
  const selIdx = allDays.findIndex((d) => d.key === effSelKey);
  const selDay = selIdx >= 0 ? allDays[selIdx] : null;
  const selLabel = selDay
    ? `${DFULL[selIdx % 7]}, ${selDay.date} ${MONF[(Number(String(selDay.key).split('-')[1]) || 1) - 1]}`
    : '';
  const selDetail = selDay
    ? (selDay.isFuture ? 'Upcoming'
      : selDay.quizzes > 0 ? `${selDay.quizzes} quiz${selDay.quizzes > 1 ? 'zes' : ''} · ${selDay.xp} XP`
        : selDay.active ? 'Active — lessons or doubts'
          : 'No practice this day')
    : '';

  return (
    <View style={st.screen}>
      <Header meta={meta} childName={childName} onAvatar={onAvatar} onGym={onGym} />
      <ScrollView style={{ paddingHorizontal: 18 }} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}>
        {/* Real week navigation — ‹ / › page through the last 5 weeks. */}
        <View style={st.progHead}>
          <PressableScale onPress={() => setWkOffset((o) => Math.min(lastIdx, o + 1))} disabled={!canOlder}
            style={{ padding: 6, opacity: canOlder ? 1 : 0.25 }} accessibilityLabel="Previous week">
            <ChevronLeft size={20} color={C.ink} />
          </PressableScale>
          <T w="bold" s={13} c={C.muted} style={{ letterSpacing: 0.5 }}>{hdr}</T>
          <PressableScale onPress={() => setWkOffset((o) => Math.max(0, o - 1))} disabled={!canNewer}
            style={{ padding: 6, opacity: canNewer ? 1 : 0.25 }} accessibilityLabel="Next week">
            <ChevronRight size={20} color={C.ink} />
          </PressableScale>
        </View>
        {/* Tappable strip — pick any date; green dot = practised that day. */}
        <View style={st.weekRow}>
          {weekDays.map((d, i) => {
            const selected = d.key === effSelKey;
            return (
              <PressableScale key={d.key || i} disabled={d.isFuture} onPress={() => setSelKey(d.key)} style={{ alignItems: 'center', gap: 7 }}>
                <View style={[st.dowChip, d.isToday && { backgroundColor: '#E6E7EA' }]}><T w="bold" s={12} c={C.muted}>{DOW[i]}</T></View>
                <View style={[st.dateCircle,
                  d.isToday && { backgroundColor: C.ink, borderColor: C.ink },
                  !d.isToday && selected && { borderColor: C.blue, borderWidth: 2 },
                  d.isFuture && { borderColor: '#F2F2F3' }]}>
                  <T w="bold" s={14} c={d.isToday ? '#fff' : d.isFuture ? C.faint : C.ink}>{d.date}</T>
                </View>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: d.active ? C.green : 'transparent' }} />
              </PressableScale>
            );
          })}
        </View>

        {/* Selected day's detail (real per-day quizzes / XP from the backend). */}
        {!!selDay && (
          <View style={{ marginTop: -6, marginBottom: 16, alignItems: 'center' }}>
            <T w="bold" s={13.5} c={C.ink}>{selLabel}</T>
            <T w="semi" s={12.5} c={selDay.quizzes > 0 ? C.green : C.muted} style={{ marginTop: 2 }}>{selDetail}</T>
          </View>
        )}

        {!hasActivity ? (
          <View style={st.noActivity}>
            <SleepyMonitor />
            <T w="semi" s={15} c={C.faint}>No activity yet today</T>
          </View>
        ) : (
          <>
            <Label>BrainGym</Label>
            <PressableScale style={st.statCard} onPress={onGym}>
              <View style={st.statRow}>
                <Stat value={bg.totalXp ?? 0} label="XP" color={C.green} />
                <Stat value={bg.quizzesCompleted ?? 0} label="Quizzes" />
                <Stat value={`${bg.accuracy ?? 0}%`} label="Accuracy" />
                <Stat value={bg.currentStreak ?? 0} label="Streak" color={C.orange} />
              </View>
            </PressableScale>
            <Label>Arena</Label>
            <PressableScale style={st.statCard} onPress={onGym}>
              <View style={st.statRow}>
                <Stat value={ar.rating ?? ARENA_BASE_RATING} label="Rating" color={C.blue} />
                <Stat value={ar.wins ?? 0} label="Wins" color={C.green} />
                <Stat value={ar.losses ?? 0} label="Losses" color={C.red} />
                <Stat value={ar.played ?? 0} label="Played" />
              </View>
            </PressableScale>
            <Label>Areas to focus</Label>
            <View style={st.focusCard}>
              {mistakes > 0 ? (
                <>
                  <CountUp value={mistakes} w="xbold" s={30} c={C.peachInk} />
                  <T w="med" s={13} c={C.muted}>{mistakes === 1 ? 'open item' : 'open items'} in the Mistake Book to revise.</T>
                  <T w="semi" s={13} c={C.ink} style={{ marginTop: 12, lineHeight: 19 }}>
                    {topWeak
                      ? `💡 Focus on ${topWeak} — a short daily BrainGym helps most.`
                      : (Number(bg.accuracy) || 0) >= 80
                        ? '🌟 Strong accuracy — encourage harder Arena challenges.'
                        : '💡 A short daily BrainGym + clearing the Mistake Book will help most.'}
                  </T>
                </>
              ) : topWeak ? (
                <>
                  <T w="xbold" s={19} c={C.peachInk}>Strengthen {topWeak}</T>
                  <T w="med" s={13} c={C.muted} style={{ marginTop: 6, lineHeight: 19 }}>
                    {childName} has room to grow here — a short daily BrainGym helps most.
                  </T>
                </>
              ) : (
                <>
                  <T w="xbold" s={17} c={C.green}>No concepts to revise yet</T>
                  <T w="med" s={13} c={C.muted} style={{ marginTop: 6, lineHeight: 19 }}>
                    Anything {childName} gets wrong in a quiz will appear here to revise.
                  </T>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default memo(ProgressTab);
