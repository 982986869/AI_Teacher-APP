// src/screens/admin/AdminHomeScreen.js
// Admin Home — the Student Home visual language (Nunito T, InkSurface hero, section
// headers, cards, primary action) with admin-relevant content. Real data only. No logout
// here (it lives in Profile). Quick actions only for flows that actually work today.
import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  CalendarPlus, ChartColumn, Users, CalendarDays, FileClock, BookOpenCheck,
  TriangleAlert, ChevronRight, UserPlus, Sparkles, ClipboardCheck, Settings as SettingsIcon,
  Target, BookOpen, Plus,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getAdminDashboard, getAdminSessions, getAdminModules } from '../../api/adminApi';
import { T } from '../parent/ParentApp/constants';
import {
  S, shadow, InkSurface, StudentScreenHeader, StudentSectionHeader, StudentErrorState, StudentPrimaryButton, StudentSkeleton,
} from '../../theme/studentUI';
import { FadeInOnce, PressableScale, CountUp, Float, Wave } from '../parent/ParentApp/anim';
import { greeting, timeAgo, fmtDate } from './ui/format';

const isSameDay = (iso) => { const d = new Date(iso); const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); };

function StatCard({ icon: Icon, tint, bg, value, label }) {
  return (
    <View style={{ flex: 1, minWidth: '46%', backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: S.hair, padding: 16, ...shadow }}>
      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={tint} strokeWidth={2.5} /></View>
      <CountUp value={Number(value) || 0} duration={800} w="black" s={24} c={S.ink} style={{ marginTop: 12 }} />
      <T w="semi" s={12} c={S.muted} style={{ marginTop: 2 }}>{label}</T>
    </View>
  );
}

const ACT = {
  signup: { icon: UserPlus, tint: S.indigo }, lesson_completed: { icon: BookOpenCheck, tint: S.blue },
  mock_submitted: { icon: ClipboardCheck, tint: S.emerald }, braingym_completed: { icon: Sparkles, tint: S.orange },
  admin_action: { icon: SettingsIcon, tint: S.purple },
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

// A manageable module card — student-style surface, real counts, Manage + optional Quick Add.
function ModuleCard({ icon: Icon, tint, bg, name, counts, onManage, onAdd, addLabel }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: S.hair, padding: 16, marginBottom: 12, ...shadow }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Icon size={22} color={tint} strokeWidth={2.4} /></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w="xbold" s={15} c={S.ink}>{name}</T>
          <T w="semi" s={12} c={S.muted} numberOfLines={1} style={{ marginTop: 2 }}>{counts}</T>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <PressableScale onPress={onManage} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: S.border, borderRadius: 13, paddingVertical: 11 }} accessibilityLabel={`Manage ${name}`}>
          <T w="bold" s={13} c={S.sub}>Manage</T><ChevronRight size={15} color={S.faint} />
        </PressableScale>
        {onAdd && (
          <PressableScale onPress={onAdd} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: S.indigo, borderRadius: 13, paddingVertical: 11, paddingHorizontal: 16 }} accessibilityLabel={addLabel || `Add ${name}`}>
            <Plus size={15} color="#fff" strokeWidth={2.6} /><T w="bold" s={13} c="#fff">{addLabel || 'Add'}</T>
          </PressableScale>
        )}
      </View>
    </View>
  );
}

// Compact create shortcut (icon + label). Quick actions only — NOT a second nav menu (re-saved).
function QuickBtn({ icon: Icon, tint, bg, label, onPress }) {
  return (
    <PressableScale onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: S.hair, paddingVertical: 16, ...shadow }} accessibilityLabel={label}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Icon size={21} color={tint} strokeWidth={2.4} /></View>
      <T w="xbold" s={12.5} c={S.ink} numberOfLines={1}>{label}</T>
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
  const goResults = () => navigation.navigate('Results');

  return (
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <StudentScreenHeader title="Home" subtitle="Manage Ailernova" />
      <ScrollView style={{ flex: 1, paddingHorizontal: 18 }} contentContainerStyle={{ paddingBottom: 40, paddingTop: 6 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={S.indigo} />}>

        {loading && !dash ? (
          <View style={{ paddingTop: 8 }}>
            <StudentSkeleton w="100%" h={150} r={26} />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}><StudentSkeleton w="48%" h={110} r={20} /><StudentSkeleton w="48%" h={110} r={20} /></View>
          </View>
        ) : error && !dash ? (
          <StudentErrorState title="Couldn't load Home" onRetry={load} />
        ) : dash ? (
          <>
            {/* Greeting hero */}
            <FadeInOnce id="ah-hero" delay={30} y={16}>
              <View style={{ borderRadius: 26, backgroundColor: '#241C55', marginTop: 8, shadowColor: '#241C55', shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 11 }}>
                <View style={{ borderRadius: 26, overflow: 'hidden', padding: 22 }}>
                  <InkSurface a="#4A3AA6" b="#241C55" glow={S.heroGlow} radius={26} />
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
            <StudentSectionHeader title="Today" accent={S.indigo} />
            <FadeInOnce id="ah-today" delay={40} y={14}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <StatCard icon={Users} tint={S.blue} bg={S.blueSoft} value={dash.overview.activeToday} label="Active students today" />
                <StatCard icon={CalendarDays} tint={S.emerald} bg={S.emeraldSoft} value={todayCount} label="Sessions today" />
                <StatCard icon={BookOpenCheck} tint={S.indigo} bg={S.indigoSoft} value={dash.overview.newRegistrationsWeek} label="New students / week" />
                <StatCard icon={FileClock} tint={S.gold} bg={S.goldSoft} value={drafts} label="Drafts to review" />
              </View>
            </FadeInOnce>

            {/* Quick actions — compact create shortcuts. The tabs (Sessions/Tests/Resources/
                Results) are NOT repeated here — they already live in the dock; Home is not a
                second navigation menu. */}
            <StudentSectionHeader title="Quick actions" accent={S.indigo} />
            <FadeInOnce id="ah-quick" delay={40} y={14}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <QuickBtn icon={Target} tint={S.indigo} bg={S.indigoSoft} label="New Test"
                  onPress={() => navigation.navigate('Tests', { screen: 'TestForm', params: { mode: 'add' } })} />
                <QuickBtn icon={CalendarPlus} tint={S.blue} bg={S.blueSoft} label="New Session" onPress={goSessionForm} />
              </View>
            </FadeInOnce>

            {/* Needs attention */}
            {(noTeacher > 0 || drafts > 0) && (
              <>
                <StudentSectionHeader title="Needs attention" accent={S.orange} />
                <FadeInOnce id="ah-attn" delay={40} y={14}>
                  <View style={{ backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: S.hair, overflow: 'hidden', ...shadow }}>
                    {noTeacher > 0 && (
                      <PressableScale onPress={() => navigation.navigate('Sessions')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: drafts > 0 ? 1 : 0, borderBottomColor: S.hair }}>
                        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: S.orangeSoft, alignItems: 'center', justifyContent: 'center' }}><TriangleAlert size={18} color={S.orange} strokeWidth={2.4} /></View>
                        <View style={{ flex: 1 }}><T w="xbold" s={13.5} c={S.ink}>{noTeacher} session{noTeacher > 1 ? 's' : ''} without a teacher</T><T w="semi" s={11.5} c={S.muted}>Assign a teacher before it starts</T></View>
                        <ChevronRight size={16} color={S.faint} />
                      </PressableScale>
                    )}
                    {drafts > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: S.goldSoft, alignItems: 'center', justifyContent: 'center' }}><FileClock size={18} color={S.gold} strokeWidth={2.4} /></View>
                        <View style={{ flex: 1 }}><T w="xbold" s={13.5} c={S.ink}>{drafts} draft{drafts > 1 ? 's' : ''} awaiting review</T><T w="semi" s={11.5} c={S.muted}>Content saved but not yet published</T></View>
                      </View>
                    )}
                  </View>
                </FadeInOnce>
              </>
            )}

            {/* Recent activity */}
            <StudentSectionHeader title="Recent activity" accent={S.purple} />
            <FadeInOnce id="ah-activity" delay={40} y={14}>
              <View style={{ backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: S.hair, padding: 6, ...shadow }}>
                {(dash.activity || []).length ? (dash.activity || []).slice(0, 6).map((a, i, arr) => {
                  const cfg = ACT[a.type] || ACT.admin_action;
                  return (
                    <View key={a.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 10, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: S.hair }}>
                      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: '#F4F5FB', alignItems: 'center', justifyContent: 'center' }}><cfg.icon size={17} color={cfg.tint} strokeWidth={2.4} /></View>
                      <View style={{ flex: 1, minWidth: 0 }}><T w="xbold" s={13} c={S.ink} numberOfLines={1}>{activityLine(a)}</T>{!!a.subtitle ? <T w="semi" s={11.5} c={S.muted} numberOfLines={1}>{a.subtitle}</T> : null}</View>
                      <T w="bold" s={11} c={S.faint}>{timeAgo(a.at)}</T>
                    </View>
                  );
                }) : <T w="bold" s={13} c={S.muted} style={{ padding: 12 }}>No activity yet today.</T>}
              </View>
            </FadeInOnce>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
