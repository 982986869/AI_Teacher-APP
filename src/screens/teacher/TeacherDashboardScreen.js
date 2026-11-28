// src/screens/teacher/TeacherDashboardScreen.js
// The human teacher's app: Home (next lesson with Join, today, my students with each
// pair's permanent room link, this week), Homework (give / edit / see) and My class. Teachers only — an admin makes the account a
// teacher; AppNavigator routes role 'teacher' here. Data: GET /api/teaching/dashboard.
//
// Times are India time (teacherTime.js).
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Linking, Share, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, CalendarDays, Users, Clock, Link2, LogOut } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getTeacherDashboard, getTeacherHomework, getMyClass } from '../../api/teachingApi';
import TeacherHomeworkTab from './TeacherHomeworkTab';
import TeacherClassTab from './TeacherClassTab';
import HomeworkSheet from './HomeworkSheet';
import { SPACING, RADIUS } from '../../theme/designSystem';
import { T, F, CARD, EYEBROW } from './teacherTheme';

import { timeIST, dateIST, longDateIST, greeting, lessonState, whenText } from './teacherTime';

const TICK_MS = 20 * 1000;

const openRoom = (link) => { if (link) Linking.openURL(link).catch(() => {}); };
const shareRoom = (link, who) => { if (link) Share.share({ message: link, title: `Room · ${who}` }).catch(() => {}); };

const TABS = [['home', 'Home'], ['homework', 'Homework'], ['class', 'My class']];

export default function TeacherDashboardScreen() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState('home');
  const [data, setData] = useState(null);           // dashboard (Home)
  const [homework, setHomework] = useState(null);   // the teacher's homework
  const [klass, setKlass] = useState(null);         // My class rows
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [hwFilter, setHwFilter] = useState(null);   // an assignmentId, or all
  const [sheet, setSheet] = useState(null);         // { item } to edit, { preset } to give
  const [toast, setToast] = useState(null);

  // Each tab loads what it shows; a pull refreshes the open tab.
  const load = useCallback(async (which, pull = false) => {
    if (pull) setRefreshing(true);
    try {
      if (which === 'home') setData(await getTeacherDashboard());
      else {
        const [hw, cls] = await Promise.all([getTeacherHomework(), getMyClass()]);
        setHomework(hw); setKlass(cls);
      }
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not load this page.');
    } finally {
      setRefreshing(false);
      setNow(Date.now());
    }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);
  // Keep "in 25 minutes" and Join honest without reloading.
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), TICK_MS); return () => clearInterval(t); }, []);
  // When the next lesson ends, fetch again so the card moves on to the one after it.
  useEffect(() => {
    if (tab !== 'home' || !data?.next) return undefined;
    const ms = new Date(data.next.endsAt).getTime() - Date.now() + 1500;
    if (ms <= 0 || ms > 6 * 3600000) return undefined;
    const t = setTimeout(() => load('home'), ms);
    return () => clearTimeout(t);
  }, [tab, data, load]);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); }, [toast]);

  const firstName = String(user?.name || '').trim().split(/\s+/)[0] || 'Teacher';
  // The pairs, for the homework form and filter (My class rows, else the dashboard's).
  const students = klass || (data ? data.students : []);
  const loaded = tab === 'home' ? !!data : !!homework && !!klass;

  const onSaved = (_item, what) => {
    setToast({ deleted: 'Homework deleted', edited: 'Changes saved', checked: 'Marked checked', unchecked: 'Check removed' }[what] || 'Homework given');
    load('homework');
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={T.page} />
      <View style={st.top}>
        <View style={{ flex: 1 }}>
          <Text style={st.hello}>{greeting(now)}, {firstName}</Text>
          <Text style={st.date}>{longDateIST(now)}</Text>
        </View>
        <Pressable onPress={signOut} hitSlop={10} accessibilityRole="button" accessibilityLabel="Log out" style={st.logout}>
          <LogOut size={18} color={T.soft} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={st.tabs} accessibilityRole="tablist">
        {TABS.map(([key, label]) => {
          const on = tab === key;
          return (
            <Pressable key={key} onPress={() => { setError(null); setTab(key); }} accessibilityRole="tab" accessibilityState={{ selected: on }}
              style={[st.tab, on && st.tabOn]}>
              <Text style={[st.tabText, on && st.tabTextOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {!loaded && !error ? (
        <View style={st.center}><ActivityIndicator color={T.ink} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={st.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(tab === 'home' ? 'home' : 'homework', true)} />}
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={st.error}>
              <Text style={st.errorText}>{error}</Text>
              <Pressable onPress={() => load(tab)} style={st.retry} accessibilityRole="button"><Text style={st.retryText}>Try again</Text></Pressable>
            </View>
          )}
          {tab === 'home' && data && (
            <>
              <NextLesson lesson={data.next} now={now} />
              <TodayList lessons={data.today} now={now} />
              <MyStudents students={data.students} now={now} />
              <ThisWeek week={data.week} />
            </>
          )}
          {tab === 'homework' && homework && klass && (
            <TeacherHomeworkTab
              homework={homework} students={klass} filter={hwFilter} onFilter={setHwFilter} now={now}
              onGive={(preset) => setSheet({ preset })} onEdit={(item) => setSheet({ item })}
            />
          )}
          {tab === 'class' && klass && (
            <TeacherClassTab
              students={klass} now={now}
              onGive={(preset) => setSheet({ preset })}
              onSeeHomework={(id) => { setHwFilter(id); setTab('homework'); }}
            />
          )}
        </ScrollView>
      )}

      <HomeworkSheet
        visible={!!sheet} onClose={() => setSheet(null)} onSaved={onSaved}
        students={students} item={sheet?.item || null} presetAssignmentId={sheet?.preset || null}
      />
      {!!toast && (
        <View style={st.toast} pointerEvents="none" accessibilityLiveRegion="polite">
          <Text style={st.toastText}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── 1. Next lesson ─────────────────────────────────────────────────────────────────
function NextLesson({ lesson, now }) {
  if (!lesson) {
    return (
      <View style={[st.hero, st.heroEmpty]}>
        <Text style={st.heroKicker}>NEXT LESSON</Text>
        <Text style={st.heroEmptyText}>No lessons booked yet.</Text>
      </View>
    );
  }
  const state = lessonState(lesson, now);
  const live = state === 'joinable';
  return (
    <View style={st.hero} accessibilityLabel={`Next lesson: ${lesson.studentName}, ${lesson.subject}, ${whenText(lesson, now)}`}>
      <View style={st.heroHead}>
        <Text style={st.heroKicker}>NEXT LESSON</Text>
        <View style={[st.whenPill, live && st.whenPillLive]}>
          <Text style={[st.whenText, live && st.whenTextLive]}>{whenText(lesson, now)}</Text>
        </View>
      </View>
      <Text style={st.heroName} numberOfLines={1}>{lesson.studentName}</Text>
      <Text style={st.heroSub}>{lesson.subject}{lesson.classLevel ? ` · Class ${lesson.classLevel}` : ''}</Text>
      <View style={st.heroTime}>
        <Clock size={15} color={T.heroInk} strokeWidth={2.4} />
        <Text style={st.heroTimeText}>{timeIST(lesson.startsAt)} – {timeIST(lesson.endsAt)}</Text>
      </View>
      <JoinButton lesson={lesson} state={state} big />
    </View>
  );
}

function JoinButton({ lesson, state, big = false }) {
  const live = state === 'joinable' && !!lesson.roomLink;
  let label = 'Join';
  if (!lesson.roomLink) label = 'No room link';
  else if (state === 'upcoming') label = big ? `Join opens at ${timeIST(lesson.joinOpensAt)}` : 'Join';
  else if (state === 'over') label = 'Ended';
  return (
    <Pressable
      onPress={() => live && openRoom(lesson.roomLink)}
      disabled={!live}
      accessibilityRole="button"
      accessibilityState={{ disabled: !live }}
      accessibilityLabel={live ? `Join the lesson with ${lesson.studentName}` : label}
      style={({ pressed }) => [big ? st.joinBig : st.joinSmall, live ? st.joinOn : big ? st.joinBigOff : st.joinOff, pressed && live && { opacity: 0.85 }]}
    >
      {live && <Video size={big ? 18 : 14} color={T.white} strokeWidth={2.4} />}
      <Text style={[big ? st.joinBigText : st.joinSmallText, live ? st.joinOnText : big ? st.joinBigOffText : st.joinOffText]}>{label}</Text>
    </Pressable>
  );
}

// ── 2. Today ────────────────────────────────────────────────────────────────────────
function TodayList({ lessons, now }) {
  return (
    <Section title="Today" icon={CalendarDays} count={lessons.length}>
      {!lessons.length && <Text style={st.empty}>No lessons today.</Text>}
      {lessons.map((l, i) => {
        const state = lessonState(l, now);
        return (
          <View key={l.id} style={[st.row, state === 'over' && st.rowOver, i === lessons.length - 1 && st.rowLast]}>
            <Text style={[st.rowTime, state === 'over' && st.muted]}>{timeIST(l.startsAt)}</Text>
            <View style={st.rowMain}>
              <Text style={[st.rowTitle, state === 'over' && st.muted]} numberOfLines={1}>{l.studentName}</Text>
              <Text style={st.rowSub} numberOfLines={1}>{l.subject}{state === 'over' ? ' · done' : ''}</Text>
            </View>
            {state !== 'over' && <JoinButton lesson={l} state={state} />}
          </View>
        );
      })}
    </Section>
  );
}

// ── 3. My students ──────────────────────────────────────────────────────────────────
function MyStudents({ students, now }) {
  return (
    <Section title="My students" icon={Users} count={students.length}>
      {!students.length && <Text style={st.empty}>No students assigned to you yet.</Text>}
      {students.map((s, i) => (
        <View key={s.assignmentId} style={[st.row, i === students.length - 1 && st.rowLast]}>
          <View style={st.rowMain}>
            <Text style={st.rowTitle} numberOfLines={1}>{s.studentName}</Text>
            <Text style={st.rowSub} numberOfLines={1}>{s.subject} · Class {s.classLevel}</Text>
            <Text style={st.rowNext} numberOfLines={1}>
              {s.nextLessonAt ? `Next: ${whenText({ startsAt: s.nextLessonAt }, now)}` : 'No lesson booked'}
            </Text>
          </View>
          {s.roomLink ? (
            <Pressable
              onPress={() => openRoom(s.roomLink)}
              onLongPress={() => shareRoom(s.roomLink, s.studentName)}
              accessibilityRole="link"
              accessibilityLabel={`Open the room for ${s.studentName}. Long press to share or copy the link.`}
              style={({ pressed }) => [st.room, pressed && { opacity: 0.7 }]}
            >
              <Link2 size={14} color={T.ink} strokeWidth={2.4} />
              <Text style={st.roomText}>Room</Text>
            </Pressable>
          ) : <Text style={st.rowSub}>No room yet</Text>}
        </View>
      ))}
      {students.some((s) => s.roomLink) && <Text style={st.hint}>Each student's room link never changes. Long-press Room to share or copy it.</Text>}
    </Section>
  );
}

// ── 4. This week ────────────────────────────────────────────────────────────────────
function ThisWeek({ week }) {
  return (
    <Section title="This week" icon={CalendarDays}>
      {week.map((d, i) => (
        <View key={d.date} style={[st.weekRow, i === week.length - 1 && st.rowLast]}>
          <View style={st.weekDay}>
            <Text style={st.weekLabel}>{d.label}</Text>
            <Text style={st.weekDate}>{dateIST(`${d.date}T06:30:00Z`)}</Text>
          </View>
          <Text style={[st.weekLessons, !d.lessons.length && st.muted]} numberOfLines={3}>
            {d.lessons.length ? d.lessons.map((l) => `${timeIST(l.startsAt)} ${l.studentName}`).join('  ·  ') : 'Free'}
          </Text>
        </View>
      ))}
    </Section>
  );
}

function Section({ title, icon: Icon, count, children }) {
  return (
    <View style={st.section}>
      <View style={st.sectionHead}>
        {Icon && <Icon size={16} color={T.ink} strokeWidth={2.4} />}
        <Text style={st.sectionTitle}>{title}</Text>
        {count != null && <Text style={st.sectionCount}>{count}</Text>}
      </View>
      <View style={st.card}>{children}</View>
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.page },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md + 4, paddingTop: SPACING.sm, paddingBottom: SPACING.md, backgroundColor: T.page },
  tabs: { flexDirection: 'row', marginHorizontal: SPACING.md + 4, marginBottom: SPACING.md, padding: 4, borderRadius: RADIUS.full, backgroundColor: T.fill },
  tab: { flex: 1, height: 38, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: T.black },
  tabText: { fontFamily: F.bold, fontSize: 14, color: T.soft },
  tabTextOn: { color: T.white },
  toast: { position: 'absolute', left: SPACING.lg, right: SPACING.lg, bottom: SPACING.xl, backgroundColor: T.black, borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: SPACING.md, alignItems: 'center' },
  toastText: { fontFamily: F.bold, fontSize: 14, color: T.white },
  hello: { fontFamily: F.xbold, fontSize: 23, color: T.ink },
  date: { fontFamily: F.med, fontSize: 14, color: T.soft, marginTop: 2 },
  logout: { width: 38, height: 38, borderRadius: 19, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.edge },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: SPACING.md + 4, paddingBottom: SPACING.xxl },

  // Home's hero: flat #FFBA07, radius 24, violet-tinted shadow, black CTA.
  hero: {
    backgroundColor: T.hero, borderRadius: 24, padding: 18, marginBottom: SPACING.lg,
    shadowColor: '#8B5CF6', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  heroEmpty: { ...CARD, borderRadius: 24, shadowColor: CARD.shadowColor, shadowOpacity: CARD.shadowOpacity, shadowRadius: CARD.shadowRadius, shadowOffset: CARD.shadowOffset, elevation: CARD.elevation },
  heroHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  heroKicker: { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.1, color: T.heroInk, backgroundColor: T.heroChip, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, overflow: 'hidden' },
  heroEmptyText: { fontFamily: F.med, fontSize: 15, color: T.soft, marginTop: 4 },
  whenPill: { backgroundColor: T.heroChip, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  whenPillLive: { backgroundColor: T.black },
  whenText: { fontFamily: F.bold, fontSize: 13, color: T.heroInk },
  whenTextLive: { color: T.white },
  heroName: { fontFamily: F.xbold, fontSize: 24, color: T.heroInk, lineHeight: 30 },
  heroSub: { fontFamily: F.semi, fontSize: 15, color: 'rgba(0,0,0,0.72)', marginTop: 2 },
  heroTime: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.sm + 2, marginBottom: SPACING.md },
  heroTimeText: { fontFamily: F.bold, fontSize: 15, color: T.heroInk },

  joinBig: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 12 },
  joinBigOff: { backgroundColor: 'rgba(255,255,255,0.55)' },
  joinBigOffText: { color: 'rgba(0,0,0,0.6)' },
  joinSmall: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 14, borderRadius: RADIUS.full },
  joinOn: { backgroundColor: T.black },
  joinOff: { backgroundColor: T.fill, borderWidth: 1, borderColor: T.edge },
  joinBigText: { fontFamily: F.bold, fontSize: 16 },
  joinSmallText: { fontFamily: F.bold, fontSize: 13 },
  joinOnText: { color: T.white },
  joinOffText: { color: T.dim },

  section: { marginBottom: SPACING.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  sectionTitle: { fontFamily: F.xbold, fontSize: 17, color: T.ink },
  sectionCount: { fontFamily: F.semi, fontSize: 13, color: T.dim },
  card: { ...CARD, paddingHorizontal: SPACING.md, paddingVertical: 4 },
  empty: { fontFamily: F.med, fontSize: 14, color: T.soft, paddingVertical: SPACING.md },
  hint: { fontFamily: F.reg, fontSize: 12, color: T.dim, paddingBottom: SPACING.sm + 2, paddingTop: 2 },

  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 4, paddingVertical: SPACING.sm + 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.edge },
  rowOver: { opacity: 0.75 },
  rowTime: { width: 74, fontFamily: F.bold, fontSize: 14, color: T.ink },
  rowMain: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: F.semi, fontSize: 15, color: T.ink },
  rowSub: { fontFamily: F.reg, fontSize: 13, color: T.soft, marginTop: 1 },
  rowNext: { fontFamily: F.semi, fontSize: 13, color: T.violet, marginTop: 2 },
  rowLast: { borderBottomWidth: 0 },
  muted: { color: T.dim },
  room: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 32, paddingHorizontal: 12, borderRadius: RADIUS.full, backgroundColor: T.yellowSoft, borderWidth: 1, borderColor: T.yellowEdge },
  roomText: { fontFamily: F.bold, fontSize: 13, color: T.ink },

  weekRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm + 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.edge },
  weekDay: { width: 74 },
  weekLabel: { fontFamily: F.bold, fontSize: 14, color: T.ink },
  weekDate: { fontFamily: F.reg, fontSize: 12, color: T.dim },
  weekLessons: { flex: 1, fontFamily: F.med, fontSize: 13, color: T.ink },

  error: { backgroundColor: T.redSoft, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  errorText: { fontFamily: F.med, fontSize: 14, color: T.red },
  retry: { alignSelf: 'flex-start', marginTop: SPACING.sm, paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.full, backgroundColor: T.black },
  retryText: { fontFamily: F.bold, fontSize: 13, color: T.white },
});
