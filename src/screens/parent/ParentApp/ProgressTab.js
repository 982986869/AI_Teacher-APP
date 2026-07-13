// src/screens/parent/ParentApp/ProgressTab.js — teammate's week UI + real report stats.
import React, { memo, useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight, Dumbbell, Trophy } from 'lucide-react-native';
import { C, st, T, Label, DOWF, MONF, ARENA_BASE_RATING, card, CardGradient } from './constants';
import Header from './Header';
import { CountUp, RollNumber, Pulse, PressableScale, FadeIn, PopIn, GrowFill, Breathe, Float } from './anim';
import { SleepyMonitor } from './illustrations';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DFULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Same look (s=22, same colours) — but the number WAITS for the card to settle, then
// rolls 0→value and lands with a spring punch (`rollDelay` sequences it). Handles plain
// numbers and the "85%" accuracy string transparently.
function Stat({ value, label, color, rollDelay = 0 }) {
  const pct = typeof value === 'string' && /^\d+(\.\d+)?%$/.test(value);
  return (
    <View style={st.stat}>
      {typeof value === 'number'
        ? <RollNumber value={value} delay={rollDelay} w="xbold" s={22} c={color || C.ink} />
        : pct
          ? <RollNumber value={Math.round(parseFloat(value))} suffix="%" delay={rollDelay} w="xbold" s={22} c={color || C.ink} />
          : <T w="xbold" s={22} c={color || C.ink}>{value}</T>}
      <T w="bold" s={11} c={C.muted} style={{ marginTop: 3 }}>{label}</T>
    </View>
  );
}

// A titled, layered-gradient stat widget (shadow on the outer layer, gradient + clip
// on the inner — otherwise iOS clips the shadow). The icon pops in, the divider draws
// across, and the stats stagger up — `delay` sequences this after the card slides in.
function StatWidget({ Icon, tint, tintBg, title, delay = 0, onPress, children }) {
  return (
    <PressableScale style={ps.shadow} onPress={onPress} accessibilityLabel={`${title} stats`}>
      <View style={ps.widget}>
        <CardGradient />
        <View style={ps.head}>
          <PopIn delay={delay + 90}>
            <Breathe from={1} to={1.06} duration={2600}>
              <View style={[ps.wIcon, { backgroundColor: tintBg }]}><Icon size={15} color={tint} strokeWidth={2.4} /></View>
            </Breathe>
          </PopIn>
          <T w="xbold" s={15.5} c={C.ink}>{title}</T>
          <ChevronRight size={17} color={C.faint} style={{ marginLeft: 'auto' }} />
        </View>
        <GrowFill pct={1} color={C.hair} delay={delay + 130} duration={560} style={ps.divider} />
        <View style={st.statRow}>
          {React.Children.map(children, (c, i) => (
            <FadeIn key={i} delay={delay + 160 + i * 70} y={12} duration={440} style={{ flex: 1 }}>
              {React.cloneElement(c, { rollDelay: delay + 560 + i * 130 })}
            </FadeIn>
          ))}
        </View>
      </View>
    </PressableScale>
  );
}

function ProgressTab({ meta, childName, onAvatar, onGym, report = {}, refreshing, onRefresh }) {
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
        <FadeIn delay={20} y={8}>
          <View style={st.progHead}>
            <PressableScale onPress={() => setWkOffset((o) => Math.min(lastIdx, o + 1))} disabled={!canOlder}
              hitSlop={10} style={{ padding: 8, opacity: canOlder ? 1 : 0.25 }} accessibilityLabel="Previous week">
              <ChevronLeft size={20} color={C.ink} />
            </PressableScale>
            <FadeIn key={hdr} y={0} duration={260}><T w="bold" s={13} c={C.muted} style={{ letterSpacing: 0.5 }}>{hdr}</T></FadeIn>
            <PressableScale onPress={() => setWkOffset((o) => Math.max(0, o - 1))} disabled={!canNewer}
              hitSlop={10} style={{ padding: 8, opacity: canNewer ? 1 : 0.25 }} accessibilityLabel="Next week">
              <ChevronRight size={20} color={C.ink} />
            </PressableScale>
          </View>
        </FadeIn>
        {/* Tappable strip — pick any date; green dot = practised that day. Each cell pops
            in on a stagger; today's circle gently breathes. */}
        <View style={st.weekRow}>
          {weekDays.map((d, i) => {
            const selected = d.key === effSelKey;
            const circle = (
              <View style={[st.dateCircle,
                d.isToday && { backgroundColor: C.ink, borderColor: C.ink },
                !d.isToday && selected && { borderColor: C.blue, borderWidth: 2 },
                d.isFuture && { borderColor: '#F2F2F3' }]}>
                <T w="bold" s={14} c={d.isToday ? '#fff' : d.isFuture ? C.faint : C.ink}>{d.date}</T>
              </View>
            );
            return (
              <PopIn key={d.key || i} delay={90 + i * 55}>
                <PressableScale disabled={d.isFuture} onPress={() => setSelKey(d.key)} style={{ alignItems: 'center', gap: 7 }}
                  accessibilityLabel={`${DFULL[i]} ${d.date}${d.isFuture ? ', upcoming' : d.active ? ', practised' : ''}`} accessibilityState={{ selected, disabled: d.isFuture }}>
                  <View style={[st.dowChip, d.isToday && { backgroundColor: '#E6E7EA' }]}><T w="bold" s={12} c={C.muted}>{DOW[i]}</T></View>
                  {d.isToday ? <Breathe from={1} to={1.07} duration={2000}>{circle}</Breathe> : circle}
                  {d.active
                    ? <Pulse from={1} to={1.35} duration={1400}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.green }} /></Pulse>
                    : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' }} />}
                </PressableScale>
              </PopIn>
            );
          })}
        </View>

        {/* Selected day's detail — crossfades + rises whenever you pick a different day. */}
        {!!selDay && (
          <FadeIn key={effSelKey} y={6} duration={320} style={{ marginTop: -6, marginBottom: 16, alignItems: 'center' }}>
            <T w="bold" s={13.5} c={C.ink}>{selLabel}</T>
            <T w="semi" s={12.5} c={selDay.quizzes > 0 ? C.green : C.muted} style={{ marginTop: 2 }}>{selDetail}</T>
          </FadeIn>
        )}

        {!hasActivity ? (
          <FadeIn delay={120} y={16}>
            <View style={st.noActivity}>
              <Float distance={8} duration={2600}><SleepyMonitor /></Float>
              <T w="semi" s={15} c={C.faint}>No activity yet today</T>
            </View>
          </FadeIn>
        ) : (
          <>
            <FadeIn delay={140} y={18}>
              <StatWidget Icon={Dumbbell} tint={C.green} tintBg={C.greenSoft} title="BrainGym" delay={140} onPress={onGym}>
                <Stat value={bg.totalXp ?? 0} label="XP" color={C.green} />
                <Stat value={bg.quizzesCompleted ?? 0} label="Quizzes" />
                <Stat value={`${bg.accuracy ?? 0}%`} label="Accuracy" />
                <Stat value={bg.currentStreak ?? 0} label="Streak" color={C.orange} />
              </StatWidget>
            </FadeIn>
            <FadeIn delay={240} y={18}>
              <StatWidget Icon={Trophy} tint={C.blue} tintBg={C.blueSoft} title="Arena" delay={240} onPress={onGym}>
                <Stat value={ar.rating ?? ARENA_BASE_RATING} label="Rating" color={C.blue} />
                <Stat value={ar.wins ?? 0} label="Wins" color={C.green} />
                <Stat value={ar.losses ?? 0} label="Losses" color={C.red} />
                <Stat value={ar.played ?? 0} label="Played" />
              </StatWidget>
            </FadeIn>
            <FadeIn delay={340} y={18}>
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
            </FadeIn>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const ps = StyleSheet.create({
  shadow: { borderRadius: 20, backgroundColor: '#fff', marginTop: 16, ...card },
  widget: { borderRadius: 20, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: C.hair },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: C.hair, marginVertical: 14 },
});

export default memo(ProgressTab);
