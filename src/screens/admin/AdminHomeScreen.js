// src/screens/admin/AdminHomeScreen.js
// Admin Home — AILERNOVA design system (dark violet), same layout/data as before
// (greeting hero, Today stats, Quick actions, Needs attention, Recent activity).
// Real data only. No logout here (it lives in Profile).
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, ScrollView, RefreshControl, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  CalendarPlus, ChartColumn, Users, CalendarDays, FileClock, BookOpenCheck,
  TriangleAlert, ChevronRight, UserPlus, Sparkles, ClipboardCheck, Settings as SettingsIcon,
  Target, CircleAlert,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getAdminDashboard, getAdminSessions, getAdminModules } from '../../api/adminApi';
import { T } from '../parent/ParentApp/constants';
import { InkSurface } from '../../theme/studentUI';
import { COLORS, GRADIENTS } from '../../theme/designSystem';
import { FadeInOnce, PressableScale, CountUp, Float, Wave } from '../parent/ParentApp/anim';
import { greeting, timeAgo, fmtDate } from './ui/format';

// Local dark palette — this screen's own reskin onto the AILERNOVA design system's
// COLORS tokens. Kept local (not added to the shared light `studentUI` kit) since
// that kit is still what every un-migrated light admin/student screen renders with.
const DK = {
  canvas: COLORS.background,
  card: 'rgba(255,255,255,0.05)',
  hair: 'rgba(255,255,255,0.10)',
  ink: COLORS.textPrimary,
  muted: COLORS.textSecondary,
  faint: 'rgba(241,240,245,0.45)',
  indigo: COLORS.primary, indigoSoft: 'rgba(124,58,237,0.18)',
  blue: '#60A5FA', blueSoft: 'rgba(96,165,250,0.16)',
  emerald: COLORS.success, emeraldSoft: 'rgba(16,185,129,0.16)',
  gold: COLORS.accent, goldSoft: 'rgba(245,158,11,0.16)',
  orange: COLORS.warning, orangeSoft: 'rgba(249,115,22,0.16)',
  purple: COLORS.primaryLight, purpleSoft: 'rgba(168,85,247,0.16)',
};

const isSameDay = (iso) => { const d = new Date(iso); const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); };

function Header({ title, subtitle }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingHorizontal: 18, paddingBottom: 12, paddingTop: insets.top + 8 }}>
      <T w="black" s={22} c={DK.ink} style={{ letterSpacing: -0.5 }} numberOfLines={1}>{title}</T>
      {!!subtitle && <T w="semi" s={12.5} c={DK.muted} style={{ marginTop: 1 }} numberOfLines={1}>{subtitle}</T>}
    </View>
  );
}

function SectionHeader({ title, accent = DK.indigo }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />
      <T w="black" s={16} c={DK.ink} style={{ letterSpacing: -0.3 }}>{title}</T>
    </View>
  );
}

// Simple pulsing placeholder block — the shared Shimmer is hardcoded to light-grey
// fills, which would read as a bright flash against this screen's dark canvas.
function Skeleton({ w, h, r = 12, style }) {
  const op = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.5, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [op]);
  return <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: DK.card }, style, { opacity: op }]} />;
}

function ErrorState({ title = "Couldn't load Home", onRetry }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
      <View style={{ width: 74, height: 74, borderRadius: 24, backgroundColor: DK.card, borderWidth: 1, borderColor: DK.hair, alignItems: 'center', justifyContent: 'center' }}>
        <CircleAlert size={30} color={DK.muted} strokeWidth={2} />
      </View>
      <T w="xbold" s={18} c={DK.ink} style={{ textAlign: 'center' }}>{title}</T>
      <T w="med" s={13} c={DK.muted} style={{ textAlign: 'center' }}>Check your connection and try again.</T>
      {!!onRetry && (
        <PressableScale style={{ marginTop: 6, backgroundColor: DK.indigo, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 30 }} onPress={onRetry} accessibilityLabel="Retry">
          <T w="bold" s={14} c="#fff">Retry</T>
        </PressableScale>
      )}
    </View>
  );
}

function StatCard({ icon: Icon, tint, bg, value, label }) {
  return (
    <View style={{ flex: 1, minWidth: '46%', backgroundColor: DK.card, borderRadius: 20, borderWidth: 1, borderColor: DK.hair, padding: 16 }}>
      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={tint} strokeWidth={2.5} /></View>
      <CountUp value={Number(value) || 0} duration={800} w="black" s={24} c={DK.ink} style={{ marginTop: 12 }} />
      <T w="semi" s={12} c={DK.muted} style={{ marginTop: 2 }}>{label}</T>
    </View>
  );
}

const ACT = {
  signup: { icon: UserPlus, tint: DK.indigo }, lesson_completed: { icon: BookOpenCheck, tint: DK.blue },
  mock_submitted: { icon: ClipboardCheck, tint: DK.emerald }, braingym_completed: { icon: Sparkles, tint: DK.orange },
  admin_action: { icon: SettingsIcon, tint: DK.purple },
};

// Audit actions arrive as dotted keys ("chapter.questions.save", "delete", "lesson.generate").
// Turn them into plain-English activity lines instead of showing raw keys to the admin.
const ACT_VERB = { save: 'Saved', update: 'Updated', create: 'Added', add: 'Added', delete: 'Deleted', remove: 'Removed', archived: 'Archived', archive: 'Archived', published: 'Published', publish: 'Published', unpublish: 'Unpublished', draft: 'Unpublished', reorder: 'Reordered', generate: 'Generated', restore: 'Restored', move: 'Moved', duplicate: 'Duplicated', status: 'Updated', hidden: 'Hidden', hide: 'Hidden', login: 'Signed in', setup: 'Set up', rename: 'Renamed' };
const ACT_NOUN = { questions: 'questions', notes: 'notes', mcq: 'MCQs', mcqs: 'MCQs', chapter: 'chapter', chapters: 'chapters', paper: 'paper', papers: 'papers', lesson: 'lesson', lessons: 'lessons', slide: 'slide', slides: 'slides', subject: 'subject', subjects: 'subjects', test: 'test', tests: 'tests', question: 'question', session: 'session', config: 'settings', student: 'student', parent: 'parent' };
const isActionKey = (s) => /^[a-z][a-z_]*(\.[a-z][a-z_]*)*$/.test(String(s || ''));
function humanizeAction(action) {
  const parts = String(action || '').split('.');
  const v = parts[parts.length - 1];
  const verb = ACT_VERB[v] || (v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' '));
  let noun = '';
  if (parts.length >= 2) { const nk = parts[parts.length - 2]; noun = ACT_NOUN[nk] || nk.replace(/_/g, ' '); }
  return noun ? `${verb} ${noun}` : verb;
}
const activityLine = (a) => (isActionKey(a && a.title) ? humanizeAction(a.title) : (a && (a.title || a.subtitle)) || 'Activity');

// Compact create shortcut (icon + label). Quick actions only — NOT a second nav menu (re-saved).
function QuickBtn({ icon: Icon, tint, bg, label, onPress }) {
  return (
    <PressableScale onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 8, backgroundColor: DK.card, borderRadius: 18, borderWidth: 1, borderColor: DK.hair, paddingVertical: 16 }} accessibilityLabel={label}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Icon size={21} color={tint} strokeWidth={2.4} /></View>
      <T w="xbold" s={12.5} c={DK.ink} numberOfLines={1}>{label}</T>
    </PressableScale>
  );
}

export default function AdminHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [dash, setDash] = useState(null);
  const [modules, setModules] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [d, m, s] = await Promise.all([
        getAdminDashboard(),
        getAdminModules().catch(() => null),
        getAdminSessions({ status: 'scheduled' }).catch(() => ({ rows: [] })),
      ]);
      setDash(d); setModules(m); setSessions(s?.rows || []);
    } catch (_) { setError(true); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const firstName = (user?.name || 'Admin').split(' ')[0];
  const todayCount = sessions.filter((s) => isSameDay(s.startsAt)).length;
  const noTeacher = sessions.filter((s) => !s.teacherName || !s.teacherName.trim()).length;
  const drafts = dash?.content?.draftContent || 0;

  const goSessionForm = () => navigation.navigate('Sessions', { screen: 'SessionForm', params: { mode: 'add' } });

  return (
    <View style={{ flex: 1, backgroundColor: DK.canvas }}>
      <Header title="Home" subtitle="Manage Ailernova" />
      <ScrollView style={{ flex: 1, paddingHorizontal: 18 }} contentContainerStyle={{ paddingBottom: 40, paddingTop: 6 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={DK.indigo} />}>

        {loading && !dash ? (
          <View style={{ paddingTop: 8 }}>
            <Skeleton w="100%" h={150} r={26} />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}><Skeleton w="48%" h={110} r={20} /><Skeleton w="48%" h={110} r={20} /></View>
          </View>
        ) : error && !dash ? (
          <ErrorState title="Couldn't load Home" onRetry={load} />
        ) : dash ? (
          <>
            {/* Greeting hero */}
            <FadeInOnce id="ah-hero" delay={30} y={16}>
              <View style={{ borderRadius: 26, backgroundColor: COLORS.primary, marginTop: 8, shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 11 }}>
                <View style={{ borderRadius: 26, overflow: 'hidden', padding: 22 }}>
                  <InkSurface a={GRADIENTS.primary[0]} b={GRADIENTS.primary[2]} glow={COLORS.primaryLight} radius={26} />
                  <Float distance={7} duration={4200} style={{ position: 'absolute', top: -8, right: -4 }}><ChartColumn size={104} color="rgba(255,255,255,0.08)" strokeWidth={1.4} /></Float>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <T w="semi" s={13} c="rgba(255,255,255,0.7)">{greeting()},</T><Wave><T s={14}>👋</T></Wave>
                  </View>
                  <T w="black" s={24} c="#fff" style={{ marginTop: 3, letterSpacing: -0.4 }}>{firstName}</T>
                  <T w="semi" s={12.5} c="rgba(255,255,255,0.6)" style={{ marginTop: 3 }}>{fmtDate(new Date().toISOString())}</T>
                </View>
              </View>
            </FadeInOnce>

            {/* Today */}
            <SectionHeader title="Today" accent={DK.indigo} />
            <FadeInOnce id="ah-today" delay={40} y={14}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <StatCard icon={Users} tint={DK.blue} bg={DK.blueSoft} value={dash.overview.activeToday} label="Active students today" />
                <StatCard icon={CalendarDays} tint={DK.emerald} bg={DK.emeraldSoft} value={todayCount} label="Sessions today" />
                <StatCard icon={BookOpenCheck} tint={DK.indigo} bg={DK.indigoSoft} value={dash.overview.newRegistrationsWeek} label="New students / week" />
                <StatCard icon={FileClock} tint={DK.gold} bg={DK.goldSoft} value={drafts} label="Drafts to review" />
              </View>
            </FadeInOnce>

            {/* Quick actions — compact create shortcuts. The tabs (Sessions/Tests/Resources/
                Results) are NOT repeated here — they already live in the dock; Home is not a
                second navigation menu. */}
            <SectionHeader title="Quick actions" accent={DK.indigo} />
            <FadeInOnce id="ah-quick" delay={40} y={14}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <QuickBtn icon={Target} tint={DK.indigo} bg={DK.indigoSoft} label="New Test"
                  onPress={() => navigation.navigate('Tests', { screen: 'TestForm', params: { mode: 'add' } })} />
                <QuickBtn icon={CalendarPlus} tint={DK.blue} bg={DK.blueSoft} label="New Session" onPress={goSessionForm} />
              </View>
            </FadeInOnce>

            {/* Needs attention */}
            {(noTeacher > 0 || drafts > 0) && (
              <>
                <SectionHeader title="Needs attention" accent={DK.orange} />
                <FadeInOnce id="ah-attn" delay={40} y={14}>
                  <View style={{ backgroundColor: DK.card, borderRadius: 20, borderWidth: 1, borderColor: DK.hair, overflow: 'hidden' }}>
                    {noTeacher > 0 && (
                      <PressableScale onPress={() => navigation.navigate('Sessions')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: drafts > 0 ? 1 : 0, borderBottomColor: DK.hair }}>
                        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: DK.orangeSoft, alignItems: 'center', justifyContent: 'center' }}><TriangleAlert size={18} color={DK.orange} strokeWidth={2.4} /></View>
                        <View style={{ flex: 1 }}><T w="xbold" s={13.5} c={DK.ink}>{noTeacher} session{noTeacher > 1 ? 's' : ''} without a teacher</T><T w="semi" s={11.5} c={DK.muted}>Assign a teacher before it starts</T></View>
                        <ChevronRight size={16} color={DK.faint} />
                      </PressableScale>
                    )}
                    {drafts > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: DK.goldSoft, alignItems: 'center', justifyContent: 'center' }}><FileClock size={18} color={DK.gold} strokeWidth={2.4} /></View>
                        <View style={{ flex: 1 }}><T w="xbold" s={13.5} c={DK.ink}>{drafts} draft{drafts > 1 ? 's' : ''} awaiting review</T><T w="semi" s={11.5} c={DK.muted}>Content saved but not yet published</T></View>
                      </View>
                    )}
                  </View>
                </FadeInOnce>
              </>
            )}

            {/* Recent activity */}
            <SectionHeader title="Recent activity" accent={DK.purple} />
            <FadeInOnce id="ah-activity" delay={40} y={14}>
              <View style={{ backgroundColor: DK.card, borderRadius: 20, borderWidth: 1, borderColor: DK.hair, padding: 6 }}>
                {(dash.activity || []).length ? (dash.activity || []).slice(0, 6).map((a, i, arr) => {
                  const cfg = ACT[a.type] || ACT.admin_action;
                  return (
                    <View key={a.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 10, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: DK.hair }}>
                      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}><cfg.icon size={17} color={cfg.tint} strokeWidth={2.4} /></View>
                      <View style={{ flex: 1, minWidth: 0 }}><T w="xbold" s={13} c={DK.ink} numberOfLines={1}>{activityLine(a)}</T>{!!a.subtitle ? <T w="semi" s={11.5} c={DK.muted} numberOfLines={1}>{a.subtitle}</T> : null}</View>
                      <T w="bold" s={11} c={DK.faint}>{timeAgo(a.at)}</T>
                    </View>
                  );
                }) : <T w="bold" s={13} c={DK.muted} style={{ padding: 12 }}>No activity yet today.</T>}
              </View>
            </FadeInOnce>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
