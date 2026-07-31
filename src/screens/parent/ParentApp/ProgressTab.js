// src/screens/parent/ParentApp/ProgressTab.js — teammate's week UI + real report stats.
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronRight, ChevronDown, ChevronUp, Dumbbell, Trophy, Check, Minus, Plus, BookOpen, MessageCircleQuestion, ClipboardCheck, PencilLine, Timer } from 'lucide-react-native';
import { C, st, T, Label, DOWF, MONF, card, CardGradient } from './constants';
import Header from './Header';
import { getProgressDay, getProgressCalendar } from '../../../api/parentApi';
import { CountUp, RollNumber, Pulse, PressableScale, FadeIn, PopIn, GrowFill, Breathe, Float } from './anim';
import { SleepyMonitor } from './illustrations';

// The strip and the month grid both read Mon→Sun.
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const pad2 = (n) => String(n).padStart(2, '0');
const keyOf = (dt) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
const fromKey = (k) => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (dt, n) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);
const mondayIdx = (dt) => (dt.getDay() + 6) % 7;   // 0 = Monday … 6 = Sunday
const weekStart = (dt) => addDays(dt, -mondayIdx(dt));
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

// Practice time, parent-facing — seconds are noise to a parent reading a summary.
const mins = (sec) => {
  const s = Number(sec) || 0;
  return s < 60 ? `${s}s` : `${Math.round(s / 60)} min`;
};

// One row on a day's timeline. `lead` is the bold prefix ("Understanding:"), `title`
// the thing itself. The connector line is dropped on the last row so the rail ends
// with the dot rather than trailing into whitespace.
function DayRow({ lead, title, detail, detailColor, last, delay = 0 }) {
  return (
    <FadeIn delay={delay} y={10}>
      <View style={ds.row}>
        <View style={ds.rail}>
          <View style={ds.dot}><Check size={11} color="#fff" strokeWidth={3.2} /></View>
          {!last && <View style={ds.line} />}
        </View>
        <View style={{ flex: 1, paddingBottom: last ? 2 : 18 }}>
          <T w="semi" s={15} c={C.ink} style={{ lineHeight: 21 }}>
            {lead ? <T w="xbold" s={15} c={C.ink}>{lead}: </T> : null}{title}
          </T>
          {!!detail && <T w="semi" s={13} c={detailColor || C.muted} style={{ marginTop: 3 }}>{detail}</T>}
        </View>
      </View>
    </FadeIn>
  );
}

// A collapsible day card. Starts open — a parent opening Progress wants to see what
// happened, not tap to reveal it.
function DayCard({ Icon, tint, tintBg, title, children }) {
  const [open, setOpen] = useState(true);
  const Toggle = open ? Minus : Plus;
  return (
    <View style={ds.card}>
      <PressableScale onPress={() => setOpen((o) => !o)} style={ds.cardHead}
        accessibilityLabel={`${title}, ${open ? 'collapse' : 'expand'}`} accessibilityState={{ expanded: open }}>
        <View style={[ds.cardIcon, { backgroundColor: tintBg }]}><Icon size={16} color={tint} strokeWidth={2.4} /></View>
        <T w="xbold" s={15.5} c={C.ink} style={{ flex: 1 }}>{title}</T>
        <Toggle size={20} color={C.muted} strokeWidth={2.4} />
      </PressableScale>
      {open && <View style={ds.cardBody}>{children}</View>}
    </View>
  );
}

// Everything on this tab is scoped to the selected date and comes from
// /api/parent/progress/day — `report` is no longer read here, since its figures are
// all-time and sat confusingly next to a day's worth of activity.
function ProgressTab({ meta, childName, onAvatar, onGym, refreshing, onRefresh }) {
  // Date navigation. Collapsed shows the Mon→Sun week around the selected day;
  // expanded shows a whole month, picked with the month chips. Keys are plain
  // YYYY-MM-DD in the device's local calendar, which is what the API buckets by.
  const todayKey = useMemo(() => keyOf(new Date()), []);
  const [selKey, setSelKey] = useState(todayKey);
  const [anchor, setAnchor] = useState(todayKey);   // month on screen while expanded
  const [expanded, setExpanded] = useState(false);
  const effSelKey = selKey;

  // Pull-to-refresh should also refetch the day and its dots.
  const [tick, setTick] = useState(0);
  useEffect(() => { if (refreshing) setTick((t) => t + 1); }, [refreshing]);

  // Rows of dates on screen. Month view pads to whole weeks with nulls so the 1st
  // lands under its real weekday.
  const gridWeeks = useMemo(() => {
    if (!expanded) {
      const s = weekStart(fromKey(selKey));
      return [Array.from({ length: 7 }, (_, i) => addDays(s, i))];
    }
    const a = fromKey(anchor);
    const y = a.getFullYear(), m = a.getMonth();
    const cells = new Array(mondayIdx(new Date(y, m, 1))).fill(null);
    for (let d = 1, dim = new Date(y, m + 1, 0).getDate(); d <= dim; d++) cells.push(new Date(y, m, d));
    while (cells.length % 7) cells.push(null);
    const out = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [expanded, anchor, selKey]);

  // Which of the visible days had any activity → the dot under the date. The same
  // call reports the child's first-ever activity, which bounds the month picker.
  const [activeDays, setActiveDays] = useState(() => new Set());
  const [firstActivity, setFirstActivity] = useState(null);
  const rangeFrom = keyOf(gridWeeks[0].find(Boolean));
  const rangeTo = keyOf([...gridWeeks[gridWeeks.length - 1]].reverse().find(Boolean));
  useEffect(() => {
    let cancelled = false;
    getProgressCalendar(rangeFrom, rangeTo).then((r) => {
      if (cancelled) return;
      setActiveDays(new Set(r.days));
      if (r.firstActivity) setFirstActivity(r.firstActivity);
    });
    return () => { cancelled = true; };
  }, [rangeFrom, rangeTo, tick]);

  const selDate = fromKey(selKey);
  const hdr = `${DOWF[selDate.getDay()]}, ${selDate.getDate()} ${MONF[selDate.getMonth()]}, ${selDate.getFullYear()}`.toUpperCase();

  const anchorDate = fromKey(anchor);

  // Year picker — reaches back to whichever is earlier, the child's first activity or
  // last year, so the previous year stays browsable even on an account that only
  // started this year. Capped so a stray old timestamp cannot render decades of chips.
  const yearChips = useMemo(() => {
    const nowY = fromKey(todayKey).getFullYear();
    const firstY = firstActivity ? fromKey(firstActivity).getFullYear() : nowY - 1;
    // 15 covers a whole school career (Class 1 → 12) with room to spare; beyond that
    // the date is almost certainly junk rather than real history.
    const start = Math.max(Math.min(firstY, nowY - 1), nowY - 15);
    const out = [];
    for (let y = start; y <= nowY; y++) out.push(y);
    return out;
  }, [todayKey, firstActivity]);

  // Months of the selected year. The current year stops at THIS month — future months
  // are never listed, each appears on its own once it arrives. Past years show all 12.
  const monthChips = useMemo(() => {
    const t = fromKey(todayKey);
    const y = anchorDate.getFullYear();
    const lastM = y === t.getFullYear() ? t.getMonth() : 11;
    return Array.from({ length: lastM + 1 }, (_, m) => new Date(y, m, 1));
  }, [todayKey, anchor]);

  // Switching year keeps the month where possible, clamped when that month does not
  // exist yet in the current year.
  const pickYear = (y) => {
    const t = fromKey(todayKey);
    const maxM = y === t.getFullYear() ? t.getMonth() : 11;
    setAnchor(keyOf(new Date(y, Math.min(anchorDate.getMonth(), maxM), 1)));
  };

  // Both strips scroll the SELECTED chip into view rather than jumping to the end.
  // With several years in play the two disagree — switching to an older year rebuilds
  // the month strip from 7 chips to 12, and scrolling to the end would land on DEC
  // while the selected month sits off-screen to the left. Positions are measured via
  // onLayout so this stays correct whatever the chip widths turn out to be.
  const chipRef = useRef(null);
  const yearRef = useRef(null);
  const monthX = useRef({});
  const yearX = useRef({});
  const bringIntoView = (ref, x) => {
    if (ref.current && typeof x === 'number') ref.current.scrollTo({ x: Math.max(0, x - 16), animated: false });
  };
  useEffect(() => {
    if (!expanded) return;
    bringIntoView(yearRef, yearX.current[anchorDate.getFullYear()]);
    bringIntoView(chipRef, monthX.current[`${anchorDate.getFullYear()}-${anchorDate.getMonth()}`]);
  }, [expanded, anchor, monthChips.length]);

  // What the child actually did on the selected day. Fetched per date — the report
  // payload only carries all-time aggregates, not the day's individual activities.
  const [day, setDay] = useState(null);
  const [dayLoading, setDayLoading] = useState(false);
  useEffect(() => {
    if (!effSelKey) return undefined;
    let cancelled = false;
    setDayLoading(true);
    getProgressDay(effSelKey).then((d) => {
      if (cancelled) return;
      setDay(d);
      setDayLoading(false);
    });
    return () => { cancelled = true; };
  }, [effSelKey, tick]);

  const workout = (day && Array.isArray(day.workout)) ? day.workout : [];
  const lessons = (day && Array.isArray(day.lessons)) ? day.lessons : [];
  const doubts = (day && Array.isArray(day.doubts)) ? day.doubts : [];
  const mockTests = (day && Array.isArray(day.mockTests)) ? day.mockTests : [];
  const onlineTests = (day && Array.isArray(day.onlineTests)) ? day.onlineTests : [];
  const practice = (day && Array.isArray(day.practice)) ? day.practice : [];
  const dayGym = (day && day.brainGym) || { sets: 0, accuracy: null, xp: 0, timeSec: 0 };
  const dayArena = (day && day.arena) || { played: 0, wins: 0, losses: 0, ratingDelta: 0 };
  const dayMistakes = (day && day.mistakes) || { added: 0, open: 0, items: [] };
  const dayEmpty = !dayLoading && !workout.length && !lessons.length && !doubts.length
    && !mockTests.length && !onlineTests.length && !practice.length
    && !dayArena.played && !dayMistakes.added;

  return (
    <View style={st.screen}>
      <Header meta={meta} childName={childName} onAvatar={onAvatar} onGym={onGym} />
      <ScrollView style={{ paddingHorizontal: 18 }} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}>
        {/* The selected date, and a chevron that swaps the week strip for a month grid. */}
        <FadeIn delay={20} y={8}>
          <View style={st.progHead}>
            <FadeIn key={hdr} y={0} duration={260}><T w="bold" s={13} c={C.muted} style={{ letterSpacing: 0.5 }}>{hdr}</T></FadeIn>
            <PressableScale onPress={() => { if (!expanded) setAnchor(selKey); setExpanded((e) => !e); }}
              hitSlop={12} style={{ padding: 6 }}
              accessibilityLabel={expanded ? 'Collapse calendar' : 'Expand calendar'} accessibilityState={{ expanded }}>
              {expanded ? <ChevronUp size={20} color={C.ink} /> : <ChevronDown size={20} color={C.ink} />}
            </PressableScale>
          </View>
        </FadeIn>

        {/* Tappable dates — green dot = the child did something that day. Future days
            are shown but cannot be selected. */}
        <View style={cal.wrap}>
          <View style={cal.row}>
            {DOW.map((d, i) => (
              <View key={i} style={cal.cell}><T w="bold" s={12} c={C.muted}>{d}</T></View>
            ))}
          </View>
          {gridWeeks.map((wk, wi) => (
            <View key={wi} style={cal.row}>
              {wk.map((dt, di) => {
                if (!dt) return <View key={di} style={cal.cell} />;
                const k = keyOf(dt);
                const isToday = k === todayKey;
                const isFuture = k > todayKey;
                const selected = k === effSelKey;
                const active = activeDays.has(k);
                const circle = (
                  <View style={[cal.circle,
                    selected && { backgroundColor: '#E6E7EA', borderColor: '#E6E7EA' },
                    isFuture && { borderColor: '#F2F2F3' }]}>
                    <T w="bold" s={14} c={isFuture ? C.faint : C.ink}>{dt.getDate()}</T>
                  </View>
                );
                return (
                  <View key={di} style={cal.cell}>
                    <PopIn delay={60 + (wi * 7 + di) * 18}>
                      <PressableScale disabled={isFuture} onPress={() => setSelKey(k)} style={{ alignItems: 'center', gap: 6 }}
                        accessibilityLabel={`${dt.getDate()} ${MONF[dt.getMonth()]}${isFuture ? ', upcoming' : active ? ', active' : ''}`}
                        accessibilityState={{ selected, disabled: isFuture }}>
                        {isToday ? <Breathe from={1} to={1.07} duration={2000}>{circle}</Breathe> : circle}
                        {active
                          ? <Pulse from={1} to={1.35} duration={1400}><View style={cal.dot} /></Pulse>
                          : <View style={[cal.dot, { backgroundColor: 'transparent' }]} />}
                      </PressableScale>
                    </PopIn>
                  </View>
                );
              })}
            </View>
          ))}

          {/* Year then month — only while expanded, matching the reference design. */}
          {expanded && (
            <>
              <ScrollView ref={yearRef} horizontal showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}
                style={cal.yearStrip} contentContainerStyle={{ gap: 8, paddingRight: 18 }}>
                {yearChips.map((y) => {
                  const on = y === anchorDate.getFullYear();
                  return (
                    <PressableScale key={y} onPress={() => pickYear(y)}
                      onLayout={(e) => {
                        yearX.current[y] = e.nativeEvent.layout.x;
                        if (on) bringIntoView(yearRef, e.nativeEvent.layout.x);
                      }}
                      style={[cal.yearChip, on && { backgroundColor: C.ink, borderColor: C.ink }]}
                      accessibilityLabel={String(y)} accessibilityState={{ selected: on }}>
                      <T w="bold" s={12.5} c={on ? '#fff' : C.muted}>{y}</T>
                    </PressableScale>
                  );
                })}
              </ScrollView>
              <ScrollView ref={chipRef} horizontal showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}
                style={cal.chipStrip} contentContainerStyle={{ gap: 10, paddingRight: 18 }}>
                {monthChips.map((mDt) => {
                  const on = mDt.getMonth() === anchorDate.getMonth() && mDt.getFullYear() === anchorDate.getFullYear();
                  return (
                    <PressableScale key={keyOf(mDt)} onPress={() => setAnchor(keyOf(mDt))}
                      onLayout={(e) => {
                        monthX.current[`${mDt.getFullYear()}-${mDt.getMonth()}`] = e.nativeEvent.layout.x;
                        if (on) bringIntoView(chipRef, e.nativeEvent.layout.x);
                      }}
                      style={[cal.chip, on && { backgroundColor: C.ink, borderColor: C.ink }]}
                      accessibilityLabel={`${MONF[mDt.getMonth()]} ${mDt.getFullYear()}`} accessibilityState={{ selected: on }}>
                      <T w="bold" s={13} c={on ? '#fff' : C.ink}>{MONF[mDt.getMonth()].toUpperCase()}</T>
                    </PressableScale>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>

        {/* The selected day itself — only what actually happened. There is no daily
            plan behind this, so nothing is shown as "missed" or "not attempted". */}
        {dayLoading ? (
          <View style={{ paddingVertical: 40 }}><ActivityIndicator color={C.blue} /></View>
        ) : dayEmpty ? (
          <FadeIn delay={120} y={16}>
            <View style={st.noActivity}>
              <Float distance={8} duration={2600}><SleepyMonitor /></Float>
              <T w="semi" s={15} c={C.faint}>No Activity</T>
            </View>
          </FadeIn>
        ) : (
          <>
            {!!workout.length && (
              <FadeIn delay={60} y={14}>
                <Label>MathGym</Label>
                <DayCard Icon={Dumbbell} tint={C.peachInk} tintBg={C.peach}
                  title={`Workout — ${workout.length} done`}>
                  {workout.map((w, i) => (
                    <DayRow key={w.id || i} delay={90 + i * 70} last={i === workout.length - 1}
                      lead={w.topic ? w.skillLabel : null}
                      title={w.topic || w.skillLabel}
                      detail={`${w.correct}/${w.total} accuracy · ${mins(w.timeSec)}`}
                      detailColor={w.accuracy != null && w.accuracy >= 70 ? C.green : C.red} />
                  ))}
                </DayCard>
              </FadeIn>
            )}

            {!!mockTests.length && (
              <FadeIn delay={110} y={14}>
                <Label>Mock tests</Label>
                <DayCard Icon={ClipboardCheck} tint={C.navy} tintBg={C.blueSoft}
                  title={`${mockTests.length} test${mockTests.length > 1 ? 's' : ''}`}>
                  {mockTests.map((m, i) => (
                    <DayRow key={m.id || i} delay={90 + i * 70} last={i === mockTests.length - 1}
                      title={m.name}
                      detail={`${m.correct}/${m.total} correct · ${mins(m.timeSec)}${m.subject ? ` · ${m.subject}` : ''}`}
                      detailColor={m.total > 0 && m.correct / m.total >= 0.7 ? C.green : C.muted} />
                  ))}
                </DayCard>
              </FadeIn>
            )}

            {!!onlineTests.length && (
              <FadeIn delay={118} y={14}>
                <Label>Online tests</Label>
                <DayCard Icon={Timer} tint={C.orange} tintBg={C.peach}
                  title={`${onlineTests.length} test${onlineTests.length > 1 ? 's' : ''}`}>
                  {onlineTests.map((o, i) => {
                    // A test whose subject has no answer key (Biology today) comes
                    // back with graded === 0. Showing "0/40 correct" there would be
                    // a lie, so report attempts instead.
                    const ungraded = o.graded === 0 && o.attempted > 0;
                    return (
                      <DayRow key={o.id || i} delay={90 + i * 70} last={i === onlineTests.length - 1}
                        title={o.name}
                        detail={ungraded
                          ? `${o.attempted}/${o.total} attempted · ${mins(o.timeSec)} · not graded`
                          : `${o.correct}/${o.total} correct · ${mins(o.timeSec)}${o.chapter ? ` · ${o.chapter}` : ''}`}
                        detailColor={ungraded ? C.muted
                          : (o.total > 0 && o.correct / o.total >= 0.7 ? C.green : C.muted)} />
                    );
                  })}
                </DayCard>
              </FadeIn>
            )}

            {!!practice.length && (
              <FadeIn delay={125} y={14}>
                <Label>Practice questions</Label>
                <DayCard Icon={PencilLine} tint={C.peachInk} tintBg={C.peach}
                  title={`${practice.reduce((n, p) => n + p.total, 0)} questions`}>
                  {practice.map((p, i) => (
                    <DayRow key={`${p.subtopic}-${i}`} delay={90 + i * 70} last={i === practice.length - 1}
                      title={p.subtopic || p.chapter || 'Practice'}
                      detail={`${p.correct}/${p.total} correct${p.chapter && p.subtopic ? ` · ${p.chapter}` : ''}`}
                      detailColor={p.accuracy != null && p.accuracy >= 70 ? C.green : C.red} />
                  ))}
                </DayCard>
              </FadeIn>
            )}

            {!!lessons.length && (
              <FadeIn delay={140} y={14}>
                <Label>Lessons</Label>
                <DayCard Icon={BookOpen} tint={C.blue} tintBg={C.blueSoft}
                  title={`${lessons.length} lesson${lessons.length > 1 ? 's' : ''}`}>
                  {lessons.map((l, i) => (
                    <DayRow key={l.lessonId || i} delay={90 + i * 70} last={i === lessons.length - 1}
                      title={l.title}
                      detail={l.completed
                        ? `Completed${l.subject ? ` · ${l.subject}` : ''}`
                        : `${l.slidesDone}/${l.slidesTotal} slides${l.subject ? ` · ${l.subject}` : ''}`}
                      detailColor={l.completed ? C.green : C.muted} />
                  ))}
                </DayCard>
              </FadeIn>
            )}

            {!!doubts.length && (
              <FadeIn delay={220} y={14}>
                <Label>Doubts asked</Label>
                <DayCard Icon={MessageCircleQuestion} tint={C.green} tintBg={C.greenSoft}
                  title={`${doubts.reduce((n, d) => n + d.count, 0)} question${doubts.reduce((n, d) => n + d.count, 0) > 1 ? 's' : ''}`}>
                  {doubts.map((d, i) => (
                    <DayRow key={`${d.subject}-${d.chapter}-${i}`} delay={90 + i * 70} last={i === doubts.length - 1}
                      title={d.chapter || d.subject || 'General'}
                      detail={`${d.count} question${d.count > 1 ? 's' : ''}${d.subject && d.chapter ? ` · ${d.subject}` : ''}`} />
                  ))}
                </DayCard>
              </FadeIn>
            )}
            {/* Everything below is scoped to the selected day too — a widget only
                appears when that thing actually happened on this date. */}
            {!!workout.length && (
              <FadeIn delay={280} y={18}>
                <StatWidget Icon={Dumbbell} tint={C.green} tintBg={C.greenSoft} title="MathGym" delay={280} onPress={onGym}>
                  <Stat value={dayGym.xp} label="XP" color={C.green} />
                  <Stat value={dayGym.sets} label={dayGym.sets === 1 ? 'Set' : 'Sets'} />
                  <Stat value={dayGym.accuracy != null ? `${dayGym.accuracy}%` : '—'} label="Accuracy" />
                  <Stat value={mins(dayGym.timeSec)} label="Time" color={C.orange} />
                </StatWidget>
              </FadeIn>
            )}

            {dayArena.played > 0 && (
              <FadeIn delay={340} y={18}>
                <StatWidget Icon={Trophy} tint={C.blue} tintBg={C.blueSoft} title="Arena" delay={340} onPress={onGym}>
                  <Stat value={dayArena.played} label={dayArena.played === 1 ? 'Match' : 'Matches'} />
                  <Stat value={dayArena.wins} label="Wins" color={C.green} />
                  <Stat value={dayArena.losses} label="Losses" color={C.red} />
                  <Stat value={`${dayArena.ratingDelta >= 0 ? '+' : '−'}${Math.abs(dayArena.ratingDelta)}`}
                    label="Rating" color={dayArena.ratingDelta >= 0 ? C.green : C.red} />
                </StatWidget>
              </FadeIn>
            )}

            {dayMistakes.added > 0 && (
              <FadeIn delay={400} y={18}>
                <Label>Areas to focus</Label>
                <View style={st.focusCard}>
                  <CountUp value={dayMistakes.added} w="xbold" s={30} c={C.peachInk} />
                  <T w="med" s={13} c={C.muted}>
                    {dayMistakes.added === 1 ? 'question' : 'questions'} saved to revise from this day.
                  </T>
                  {!!dayMistakes.items.length && (
                    <T w="semi" s={13} c={C.ink} style={{ marginTop: 12, lineHeight: 19 }}>
                      💡 Mostly {dayMistakes.items.map((m) => m.label).join(', ')}.
                    </T>
                  )}
                </View>
              </FadeIn>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Date picker — one Mon→Sun week, or a whole month plus the month chips.
const cal = StyleSheet.create({
  wrap: { paddingTop: 8, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 22 },
  row: { flexDirection: 'row', marginBottom: 8 },
  cell: { flex: 1, alignItems: 'center' },
  circle: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  yearStrip: { marginTop: 12, marginHorizontal: -18, paddingHorizontal: 18 },
  yearChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#fff' },
  chipStrip: { marginTop: 10, marginHorizontal: -18, paddingHorizontal: 18 },
  chip: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: C.ink, backgroundColor: '#fff' },
});

// Day view — a bordered card per activity kind, each holding a dotted timeline.
const ds = StyleSheet.create({
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 4, backgroundColor: '#fff', marginBottom: 18 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  cardIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  cardBody: { paddingHorizontal: 16, paddingBottom: 16 },
  row: { flexDirection: 'row', gap: 14 },
  rail: { width: 22, alignItems: 'center' },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, width: 1, backgroundColor: C.border, marginTop: 4 },
});

const ps = StyleSheet.create({
  shadow: { borderRadius: 20, backgroundColor: '#fff', marginTop: 16, ...card },
  widget: { borderRadius: 20, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: C.hair },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: C.hair, marginVertical: 14 },
});

export default memo(ProgressTab);
