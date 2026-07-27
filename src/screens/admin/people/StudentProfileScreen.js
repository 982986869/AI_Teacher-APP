// src/screens/admin/people/StudentProfileScreen.js
// Full student profile — real /api/admin/users/:id. Identity, details, learning snapshot,
// linked parents, recent activity and account actions. Built from the shared profile
// sections so it stays short and consistent with the parent profile.
import React, { useCallback, useState } from 'react';
import { ScrollView, RefreshControl, Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Target, BookOpen, TriangleAlert, UserRound, KeyRound, Ban, CircleCheck, Trash2 } from 'lucide-react-native';
import { getAdminUser, setAdminUserStatus, resetAdminUserPassword, deleteAdminUser } from '../../../api/adminApi';
import { useAdminResource } from '../../../hooks/useAdminResource';
import { AdminScreen, AdminHeader, AdminCard, Section, MetricGrid, ResourceView, AdminMetaGrid, IconChip, S } from '../ui/kit';
import { ProfileHeaderCard, PersonMiniRow, ActivityFeed, ActionGroup, ProfileSkeleton } from '../ui/sections';
import { fmtDate } from '../ui/format';
import { T } from '../../parent/ParentApp/constants';
import { Stagger } from '../../parent/ParentApp/anim';

export default function StudentProfileScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id, name } = route.params || {};
  const { data, loading, error, reload } = useAdminResource(useCallback(() => getAdminUser(id), [id]));
  const [busy, setBusy] = useState(false);

  const run = async (fn, onDone) => {
    setBusy(true);
    try { const r = await fn(); onDone && onDone(r); }
    catch (e) { Alert.alert('Could not complete', e?.response?.data?.error || e?.message || 'Please try again.'); }
    finally { setBusy(false); }
  };

  const u = data?.user;

  const toggleStatus = () => {
    const off = u.isActive;
    Alert.alert(off ? 'Deactivate account?' : 'Reactivate account?',
      off ? `${u.name} will no longer be able to sign in.` : `${u.name} will be able to sign in again.`,
      [{ text: 'Cancel', style: 'cancel' }, { text: off ? 'Deactivate' : 'Reactivate', style: off ? 'destructive' : 'default', onPress: () => run(() => setAdminUserStatus(id, !off), reload) }]);
  };
  const resetPassword = () => {
    Alert.alert('Reset password?', `A new temporary password will be generated for ${u.name}.`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Reset', onPress: () => run(() => resetAdminUserPassword(id), (r) => Alert.alert('Temporary password', r?.temporaryPassword ? `Share this securely:\n\n${r.temporaryPassword}` : 'Password was reset.')) }]);
  };
  const removeUser = () => {
    Alert.alert('Delete account?', `This permanently deletes ${u.name}. This cannot be undone.`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => run(() => deleteAdminUser(id), () => navigation.goBack()) }]);
  };

  return (
    <AdminScreen>
      <AdminHeader title={u?.name || name || 'Student'} subtitle="Student profile" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={reload} tintColor={S.indigo} />}
      >
        <ResourceView loading={loading} error={error} data={data} onRetry={reload} skeleton={<ProfileSkeleton />}>
          {(d) => {
            const p = d.progress || {};
            return (
              <Stagger base={24} step={55}>
                <ProfileHeaderCard
                  seed={d.user.id} name={d.user.name} contact={d.user.email || d.user.phone}
                  badges={[
                    { toneKey: d.user.isActive ? 'emerald' : 'red', label: d.user.isActive ? 'active' : 'deactivated' },
                    ...(d.user.grade ? [{ toneKey: 'indigo', dot: false, label: d.user.grade }] : []),
                  ]}
                />

                <Section label="Details" card>
                  <AdminMetaGrid items={[
                    { k: 'Account', v: d.user.accountType || 'student' },
                    { k: 'Class', v: d.user.grade || '—' },
                    { k: 'Stream', v: d.user.stream || '—' },
                    { k: 'Board', v: d.user.board || '—' },
                    { k: 'Provider', v: d.user.provider || '—' },
                    { k: 'Joined', v: fmtDate(d.user.createdAt) },
                  ]} />
                </Section>

                <Section label="Learning snapshot">
                  <MetricGrid items={[
                    { icon: Flame, toneKey: 'orange', value: p.brainGymPlays ?? 0, label: 'Brain Gym plays' },
                    { icon: Target, toneKey: 'blue', value: p.accuracy ?? null, suffix: p.accuracy != null ? '%' : '', label: 'Accuracy' },
                    { icon: BookOpen, toneKey: 'emerald', value: p.lessons ?? 0, label: 'Lessons' },
                    { icon: TriangleAlert, toneKey: 'gold', value: p.openMistakes ?? 0, label: 'Open mistakes' },
                  ]} />
                </Section>

                <Section label="Linked parents" card>
                  {(d.linkedParents || []).length ? (
                    (d.linkedParents || []).map((par, i, arr) => (
                      <PersonMiniRow key={par.id} seed={par.id} name={par.name} sub={par.email || '—'} last={i === arr.length - 1} />
                    ))
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
                      <IconChip icon={UserRound} toneKey="indigo" size={34} />
                      <T w="bold" s={13} c={S.muted}>No parent linked to this student.</T>
                    </View>
                  )}
                </Section>

                <Section label="Recent activity" card>
                  <ActivityFeed items={d.recentActivity} />
                </Section>

                <Section label="Actions">
                  <ActionGroup actions={[
                    { label: 'Reset password', icon: KeyRound, onPress: resetPassword, disabled: busy },
                    { label: d.user.isActive ? 'Deactivate account' : 'Reactivate account', icon: d.user.isActive ? Ban : CircleCheck, danger: d.user.isActive, onPress: toggleStatus, disabled: busy },
                    { label: 'Delete account', icon: Trash2, danger: true, onPress: removeUser, disabled: busy, hidden: d.user.adminRole === 'super_admin' },
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
