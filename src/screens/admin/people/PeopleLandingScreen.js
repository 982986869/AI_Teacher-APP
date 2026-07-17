// src/screens/admin/people/PeopleLandingScreen.js
// People hub — the landing that branches into Students / Parents / Team. Counts come from
// the real /api/admin/dashboard overview. Each area opens its own list → profile flow.
import React, { useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GraduationCap, HeartHandshake, ShieldCheck, UserPlus, TrendingUp, Repeat } from 'lucide-react-native';
import { getAdminDashboard } from '../../../api/adminApi';
import { useAdminResource } from '../../../hooks/useAdminResource';
import { AdminScreen, AdminHeader, AdminModuleCard, MetricGrid, Section, ResourceView, S } from '../ui/kit';
import { PeopleSkeleton } from '../ui/sections';
import { Stagger } from '../../parent/ParentApp/anim';

export default function PeopleLandingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { data, loading, error, reload } = useAdminResource(useCallback(() => getAdminDashboard(), []));

  return (
    <AdminScreen>
      <AdminHeader title="People" subtitle="Students, parents and your admin team" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={reload} tintColor={S.indigo} />}
      >
        <ResourceView loading={loading} error={error} data={data} onRetry={reload} skeleton={<PeopleSkeleton />}>
          {(d) => {
            const o = d.overview;
            return (
              <Stagger base={30} step={70}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                  <View style={{ flex: 1, minWidth: '46%' }}><AdminModuleCard icon={GraduationCap} toneKey="indigo" name="Students" blurb="Learners, progress & account actions" count={o.totalStudents} onPress={() => navigation.navigate('StudentsList')} /></View>
                  <View style={{ flex: 1, minWidth: '46%' }}><AdminModuleCard icon={HeartHandshake} toneKey="emerald" name="Parents" blurb="Guardians and their linked children" count={o.parents} onPress={() => navigation.navigate('ParentsList')} /></View>
                  <View style={{ flex: 1, minWidth: '46%' }}><AdminModuleCard icon={ShieldCheck} toneKey="purple" name="Team" blurb="Admins & staff with portal access" count={o.admins} soon onPress={() => navigation.navigate('TeamComingSoon')} /></View>
                </View>

                <Section label="This week">
                  <MetricGrid items={[
                    { icon: UserPlus, toneKey: 'indigo', value: o.newRegistrationsWeek ?? 0, label: 'New students' },
                    { icon: TrendingUp, toneKey: 'blue', value: o.activeThisWeek ?? 0, label: 'Active this week' },
                    { icon: Repeat, toneKey: 'emerald', value: o.returningUsers ?? 0, label: 'Returning users' },
                  ]} />
                </Section>
              </Stagger>
            );
          }}
        </ResourceView>
      </ScrollView>
    </AdminScreen>
  );
}
