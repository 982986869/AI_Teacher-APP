// src/screens/admin/people/ParentProfileScreen.js
// Full parent profile — real /api/admin/parents/:id. Identity, details, the linked child +
// their snapshot and recent activity, and link/unlink. Uses the shared profile sections.
import React, { useCallback, useState } from 'react';
import { ScrollView, RefreshControl, Alert, Modal, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Target, BookOpen, TriangleAlert, Link2, Unlink, UserRoundPlus, X } from 'lucide-react-native';
import { getAdminParent, linkAdminParent, unlinkAdminParent } from '../../../api/adminApi';
import { useAdminResource } from '../../../hooks/useAdminResource';
import { AdminScreen, AdminHeader, AdminCard, Avatar, AdminBadge, Section, MetricGrid, ResourceView, AdminMetaGrid, IconChip, S } from '../ui/kit';
import { ProfileHeaderCard, ActivityFeed, ActionGroup, ProfileSkeleton } from '../ui/sections';
import { fmtDate } from '../ui/format';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale, Stagger } from '../../parent/ParentApp/anim';
import { StudentPrimaryButton } from '../../../theme/studentUI';

export default function ParentProfileScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id, name } = route.params || {};
  const { data, loading, error, reload } = useAdminResource(useCallback(() => getAdminParent(id), [id]));
  const [busy, setBusy] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkVal, setLinkVal] = useState('');

  const submitLink = async () => {
    const v = linkVal.trim();
    if (!v) return;
    setBusy(true);
    try {
      await linkAdminParent(id, v.includes('@') ? { email: v } : { phone: v });
      setLinkOpen(false); setLinkVal(''); reload();
    } catch (e) {
      Alert.alert('Could not link', e?.response?.data?.error || e?.message || 'Check the email/phone and try again.');
    } finally { setBusy(false); }
  };

  const unlink = (child, parent) => {
    Alert.alert('Unlink child?', `${child?.name} will be unlinked from ${parent?.name}.`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Unlink', style: 'destructive', onPress: async () => {
        setBusy(true);
        try { await unlinkAdminParent(id); reload(); }
        catch (e) { Alert.alert('Could not unlink', e?.response?.data?.error || e?.message || 'Please try again.'); }
        finally { setBusy(false); }
      } }]);
  };

  return (
    <AdminScreen>
      <AdminHeader title={data?.parent?.name || name || 'Parent'} subtitle="Parent profile" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={reload} tintColor={S.indigo} />}
      >
        <ResourceView loading={loading} error={error} data={data} onRetry={reload} skeleton={<ProfileSkeleton />}>
          {(d) => {
            const parent = d.parent; const child = d.child; const prog = d.snapshot?.progress || {};
            return (
              <Stagger base={24} step={55}>
                <ProfileHeaderCard
                  seed={parent.id} name={parent.name} contact={parent.email || parent.phone}
                  badges={[
                    { toneKey: parent.isActive ? 'emerald' : 'red', label: parent.isActive ? 'active' : 'deactivated' },
                    { toneKey: child ? 'emerald' : 'gold', dot: false, label: child ? 'linked' : 'not linked' },
                  ]}
                />

                <Section label="Details" card>
                  <AdminMetaGrid items={[
                    { k: 'School', v: parent.school || '—' },
                    { k: 'Language', v: parent.language || '—' },
                    { k: 'Joined', v: fmtDate(parent.createdAt) },
                    { k: 'Linkage', v: child ? 'Linked' : 'Not linked' },
                  ]} />
                </Section>

                <Section label="Linked child">
                  {child ? (
                    <>
                      <AdminCard style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <Avatar seed={child.id} name={child.name} size={48} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <T w="xbold" s={15} c={S.ink} numberOfLines={1}>{child.name}</T>
                          <T w="semi" s={12} c={S.muted} numberOfLines={1}>{child.email || child.phone || '—'}</T>
                        </View>
                        {child.grade ? <AdminBadge toneKey="indigo" dot={false}>{child.grade}</AdminBadge> : null}
                      </AdminCard>
                      <View style={{ marginTop: 12 }}>
                        <MetricGrid items={[
                          { icon: Flame, toneKey: 'orange', value: prog.brainGymPlays ?? 0, label: 'Brain Gym plays' },
                          { icon: Target, toneKey: 'blue', value: prog.accuracy ?? null, suffix: prog.accuracy != null ? '%' : '', label: 'Accuracy' },
                          { icon: BookOpen, toneKey: 'emerald', value: prog.lessons ?? 0, label: 'Lessons' },
                          { icon: TriangleAlert, toneKey: 'gold', value: prog.openMistakes ?? 0, label: 'Open mistakes' },
                        ]} />
                      </View>
                    </>
                  ) : (
                    <AdminCard>
                      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 10 }}>
                        <IconChip icon={UserRoundPlus} toneKey="indigo" size={48} />
                        <T w="xbold" s={15} c={S.ink}>No child linked</T>
                        <T w="semi" s={12.5} c={S.muted} style={{ textAlign: 'center', lineHeight: 18, maxWidth: 260 }}>Link this parent to a student by their email or phone.</T>
                        <StudentPrimaryButton label="Link a student" Icon={Link2} onPress={() => setLinkOpen(true)} style={{ marginTop: 4, paddingHorizontal: 22 }} />
                      </View>
                    </AdminCard>
                  )}
                </Section>

                {child ? (
                  <>
                    <Section label="Child recent activity" card>
                      <ActivityFeed items={d.snapshot?.recentActivity} />
                    </Section>
                    <View style={{ marginTop: 16 }}>
                      <ActionGroup actions={[{ label: 'Unlink child', icon: Unlink, danger: true, onPress: () => unlink(child, parent), disabled: busy }]} />
                    </View>
                  </>
                ) : null}
              </Stagger>
            );
          }}
        </ResourceView>
      </ScrollView>

      {/* Link modal */}
      <Modal visible={linkOpen} transparent animationType="fade" onRequestClose={() => setLinkOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(21,24,41,0.42)', justifyContent: 'center', paddingHorizontal: 24 }}>
            <View style={{ backgroundColor: S.card, borderRadius: 22, padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <T w="black" s={18} c={S.ink}>Link a student</T>
                <PressableScale onPress={() => setLinkOpen(false)} hitSlop={8} accessibilityLabel="Close" style={{ padding: 4 }}><X size={20} color={S.muted} /></PressableScale>
              </View>
              <T w="semi" s={12.5} c={S.muted} style={{ marginBottom: 14, lineHeight: 18 }}>Enter the student's email or phone number.</T>
              <TextInput
                style={{ borderWidth: 1.5, borderColor: S.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: S.ink }}
                value={linkVal} onChangeText={setLinkVal} autoFocus
                placeholder="student@email.com or 98xxxxxxxx" placeholderTextColor={S.faint}
                autoCapitalize="none" autoCorrect={false} keyboardType="email-address" returnKeyType="done" onSubmitEditing={submitLink}
              />
              <View style={{ marginTop: 16 }}>
                <StudentPrimaryButton label={busy ? 'Linking…' : 'Link student'} onPress={submitLink} disabled={busy || !linkVal.trim()} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AdminScreen>
  );
}
