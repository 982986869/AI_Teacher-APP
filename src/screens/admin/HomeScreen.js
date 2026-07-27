// src/screens/admin/HomeScreen.js
// Admin Home — a calm workspace, not a dashboard. Greeting, ONE primary priority built
// only from real backend fields, a few gently-counting numbers, the module grid, and a
// live recent-activity feed. Sections stagger in; nothing animates aggressively.
import React, { useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Users, GraduationCap, ChartColumn, Settings as SettingsIcon, UserPlus, TrendingUp,
  BookOpen, FileClock, ClipboardCheck, FilePlus, CircleCheck, LogOut,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getAdminDashboard } from '../../api/adminApi';
import { useAdminResource } from '../../hooks/useAdminResource';
import { AdminScreen, AdminInsight, MetricGrid, AdminModuleCard, Section, ResourceView, S } from './ui/kit';
import { ActivityFeed, HomeSkeleton } from './ui/sections';
import { greeting } from './ui/format';
import { T } from '../parent/ParentApp/constants';
import { PressableScale, Wave, Stagger, Pulse } from '../parent/ParentApp/anim';
import { StudentPrimaryButton } from '../../theme/studentUI';

const attentionOf = (d) => [
  d.content.draftContent != null && d.content.draftContent > 0
    ? { icon: FileClock, count: d.content.draftContent, title: 'Drafts awaiting review', note: 'Content saved but not yet published.' } : null,
  d.aiTeacher.pendingReview > 0
    ? { icon: ClipboardCheck, count: d.aiTeacher.pendingReview, title: 'AI lessons pending review', note: 'Generated lessons waiting on a reviewer.' } : null,
  d.content.missingContent > 0
    ? { icon: FilePlus, count: d.content.missingContent, title: 'Chapters missing content', note: 'Chapters with no notes or questions yet.' } : null,
].filter(Boolean);

function LiveTag() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Pulse from={0.85} to={1.15} duration={1400}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: S.emerald }} /></Pulse>
      <T w="xbold" s={10} c={S.emerald} style={{ letterSpacing: 0.6 }}>LIVE</T>
    </View>
  );
}

export default function AdminHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { data, loading, error, reload } = useAdminResource(useCallback(() => getAdminDashboard(), []));
  const firstName = (user?.name || 'Admin').split(' ')[0];

  const attnCount = data ? attentionOf(data).length : 0;
  const humanSub = !data
    ? "Here's what's happening across Ailernova."
    : attnCount ? `${attnCount} thing${attnCount > 1 ? 's' : ''} to look at today.` : "You're all caught up — nice.";

  return (
    <AdminScreen>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={reload} tintColor={S.indigo} />}
      >
        {/* Greeting — human, always visible */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <T w="semi" s={13.5} c={S.muted}>{greeting()},</T>
              <Wave><T s={15}>👋</T></Wave>
            </View>
            <T w="black" s={27} c={S.ink} numberOfLines={1} style={{ letterSpacing: -0.6, marginTop: 2 }} accessibilityRole="header">{firstName}</T>
            <T w="semi" s={13} c={S.muted} style={{ marginTop: 3, lineHeight: 18 }}>{humanSub}</T>
          </View>
          <PressableScale style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, alignItems: 'center', justifyContent: 'center' }}
            onPress={signOut} hitSlop={8} accessibilityRole="button" accessibilityLabel="Sign out">
            <LogOut size={17} color={S.muted} strokeWidth={2.3} />
          </PressableScale>
        </View>

        <View style={{ marginTop: 20 }}>
          <ResourceView loading={loading} error={error} data={data} onRetry={reload} skeleton={<HomeSkeleton />}>
            {(d) => {
              const primary = attentionOf(d)[0];
              return (
                <Stagger base={30} step={70}>
                  {primary ? (
                    <AdminInsight icon={primary.icon} toneKey="gold" value={String(primary.count)} title={primary.title} note={primary.note}
                      action={<StudentPrimaryButton label="Review in Learning" showArrow onPress={() => navigation.navigate('Learning')} style={{ alignSelf: 'flex-start', paddingHorizontal: 18 }} />} />
                  ) : (
                    <AdminInsight icon={CircleCheck} toneKey="emerald" value="All clear" title="Nothing needs your attention" note="No drafts, review queues or content gaps are open." />
                  )}

                  <View style={{ marginTop: 14 }}>
                    <MetricGrid items={[
                      { icon: UserPlus, toneKey: 'indigo', value: d.overview.newRegistrationsWeek, label: 'New students / week' },
                      { icon: TrendingUp, toneKey: 'blue', value: d.overview.activeThisWeek, label: 'Active this week' },
                      { icon: BookOpen, toneKey: 'emerald', value: d.aiTeacher.lessonsCompleted, label: 'Lessons completed' },
                    ]} />
                  </View>

                  <Section label="Manage">
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                      <View style={{ flex: 1, minWidth: '46%' }}><AdminModuleCard icon={Users} toneKey="indigo" name="People" blurb="Students, parents and team" count={d.overview.totalStudents} onPress={() => navigation.navigate('People')} /></View>
                      <View style={{ flex: 1, minWidth: '46%' }}><AdminModuleCard icon={GraduationCap} toneKey="purple" name="Learning" blurb="Content, AI Teacher, Brain Gym" soon onPress={() => navigation.navigate('Learning')} /></View>
                      <View style={{ flex: 1, minWidth: '46%' }}><AdminModuleCard icon={ChartColumn} toneKey="blue" name="Operations" blurb="Reports, announcements, audit" soon onPress={() => navigation.navigate('Operations')} /></View>
                      <View style={{ flex: 1, minWidth: '46%' }}><AdminModuleCard icon={SettingsIcon} toneKey="orange" name="Settings" blurb="Configuration & feature flags" soon onPress={() => navigation.navigate('Settings')} /></View>
                    </View>
                  </Section>

                  <Section label="Recent activity" card right={<LiveTag />}>
                    <ActivityFeed items={d.activity} emptyText="No activity yet today." />
                  </Section>
                </Stagger>
              );
            }}
          </ResourceView>
        </View>
      </ScrollView>
    </AdminScreen>
  );
}
