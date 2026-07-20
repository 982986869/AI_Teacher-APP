// src/screens/admin/learning/NodeDetailScreen.js
// Full operational control for a content node. Primary actions (Edit, Publish/Unpublish)
// up top; secondary actions (Duplicate, Submit for review, Hide/Show, Archive/Restore) in
// a "More" sheet; permanent Delete isolated in a Danger Zone with a typed-name confirm and
// a subtree breakdown. Reversible actions offer Undo. Every action hits a real endpoint.
import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Plus, Pencil, Send, Archive, RotateCcw, Trash2, ChevronRight, Undo2, EllipsisVertical,
  Copy, Eye, EyeOff, ShieldAlert, X,
} from 'lucide-react-native';
import {
  getCmsNode, getCmsSubtree, setCmsNodeStatus, deleteCmsNode, duplicateCmsNode, updateCmsNode,
} from '../../../api/adminApi';
import {
  AdminScreen, AdminHeader, AdminCard, IconChip, AdminBadge, Section, AdminMetaGrid,
  AdminErrorState, GhostButton, S,
} from '../ui/kit';
import { ProfileSkeleton } from '../ui/sections';
import { ActionSheet } from '../ui/ActionSheet';
import { UndoToast } from '../ui/UndoToast';
import { apiError, fmtDate } from '../ui/format';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale, Stagger } from '../../parent/ParentApp/anim';
import { StudentPrimaryButton } from '../../../theme/studentUI';
import {
  LEVEL_ICON, LEVEL_TONE, LEVEL_LABEL, LEVEL_PLURAL, STATUS_TONE, STATUS_LABEL, childLevelOf, LEVELS,
} from './levels';

export default function NodeDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params || {};
  const [data, setData] = useState(null);
  const [subtree, setSubtree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [toast, setToast] = useState(null); // { message, onUndo }

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [d, st] = await Promise.all([getCmsNode(id), getCmsSubtree(id).catch(() => null)]);
      setData(d); setSubtree(st);
    } catch (e) { setError(apiError(e, 'Could not load this item.')); }
    finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const node = data?.node;
  const childLevel = node ? childLevelOf(node.level) : null;

  const run = async (fn, toastMsg, onUndo) => {
    setBusy(true);
    try { await fn(); await load(); if (toastMsg) setToast({ message: toastMsg, onUndo }); }
    catch (e) { Alert.alert('Could not complete', apiError(e)); }
    finally { setBusy(false); }
  };

  const publish = () => Alert.alert('Publish?', `"${node.name}" will become visible in the Student app.`,
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Publish', onPress: () => run(() => setCmsNodeStatus(id, 'published')) }]);
  const unpublish = () => Alert.alert('Move to draft?', `"${node.name}" will be hidden from students until published again.`,
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Move to draft', style: 'destructive', onPress: () => run(() => setCmsNodeStatus(id, 'draft')) }]);
  const submitReview = () => run(() => setCmsNodeStatus(id, 'review'), 'Submitted for review');
  const archive = () => {
    const prev = node.status;
    run(() => setCmsNodeStatus(id, 'archived'), 'Archived', () => run(() => setCmsNodeStatus(id, prev)));
  };
  const restore = () => run(() => setCmsNodeStatus(id, 'draft'), 'Restored as draft');
  const toggleVisibility = () => {
    const next = node.visibility === 'hidden' ? 'visible' : 'hidden';
    run(() => updateCmsNode(id, { visibility: next }), next === 'hidden' ? 'Hidden from students' : 'Visible again',
      () => run(() => updateCmsNode(id, { visibility: node.visibility })));
  };
  const duplicate = () => run(async () => {
    const res = await duplicateCmsNode(id);
    if (res?.node?.id) navigation.push('NodeDetail', { id: res.node.id });
  });

  const doDelete = async (cascade) => {
    setBusy(true);
    try { await deleteCmsNode(id, cascade); navigation.goBack(); }
    catch (e) { setBusy(false); Alert.alert('Could not delete', apiError(e)); }
  };
  const onDeletePress = () => {
    if ((data?.childCount || 0) > 0) { setConfirmText(''); setDeleteOpen(true); }
    else Alert.alert('Delete permanently?', `Permanently remove "${node.name}"? This cannot be undone.`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => doDelete(false) }]);
  };

  // Subtree breakdown text ("2 chapters · 1 topic · 1 lesson").
  const breakdown = subtree
    ? LEVELS.filter((l) => subtree.byLevel?.[l]).map((l) => `${subtree.byLevel[l]} ${(subtree.byLevel[l] === 1 ? LEVEL_LABEL[l] : LEVEL_PLURAL[l]).toLowerCase()}`).join(' · ')
    : '';
  const published = subtree?.byStatus?.published || 0;
  const drafts = (subtree?.byStatus?.draft || 0) + (subtree?.byStatus?.review || 0);

  const moreOptions = node ? [
    { key: 'dup', label: 'Duplicate', sub: 'Copy this and everything inside as a draft', icon: Copy, tone: 'blue', onPress: duplicate },
    node.status === 'draft' ? { key: 'review', label: 'Submit for review', icon: Send, tone: 'gold', onPress: submitReview } : null,
    { key: 'vis', label: node.visibility === 'hidden' ? 'Show to students' : 'Hide from students', icon: node.visibility === 'hidden' ? Eye : EyeOff, tone: 'purple', onPress: toggleVisibility },
    node.status !== 'archived'
      ? { key: 'arch', label: 'Archive', sub: 'Hidden from students, history kept', icon: Archive, tone: 'orange', onPress: archive }
      : { key: 'rest', label: 'Restore as draft', icon: RotateCcw, tone: 'emerald', onPress: restore },
  ].filter(Boolean) : [];

  return (
    <AdminScreen>
      <AdminHeader
        title={node?.name || 'Content'} subtitle={node ? LEVEL_LABEL[node.level] : 'Loading'} onBack={() => navigation.goBack()}
        right={node ? (
          <PressableScale onPress={() => setMoreOpen(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="More actions"
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, alignItems: 'center', justifyContent: 'center' }}>
            <EllipsisVertical size={19} color={S.sub} strokeWidth={2.2} />
          </PressableScale>
        ) : null}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={S.indigo} />}
      >
        {loading && !data ? <ProfileSkeleton />
          : error && !data ? <AdminErrorState message={error} onRetry={load} />
            : node ? (
              <Stagger base={24} step={50}>
                {/* Identity */}
                <AdminCard style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <IconChip icon={LEVEL_ICON[node.level]} toneKey={LEVEL_TONE[node.level]} size={56} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w="black" s={19} c={S.ink} numberOfLines={2}>{node.name}</T>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <AdminBadge toneKey={STATUS_TONE[node.status] || 'gold'}>{STATUS_LABEL[node.status] || node.status}</AdminBadge>
                      {node.visibility === 'hidden' ? <AdminBadge toneKey="red" dot={false}>Hidden</AdminBadge> : null}
                    </View>
                  </View>
                </AdminCard>

                {/* Primary actions */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <View style={{ flex: 1 }}>
                    <GhostButton label="Edit" icon={Pencil} onPress={() => navigation.navigate('NodeForm', { mode: 'edit', id: node.id, node })} disabled={busy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    {node.status === 'published'
                      ? <GhostButton label="Unpublish" icon={Undo2} onPress={unpublish} disabled={busy} />
                      : <StudentPrimaryButton label="Publish" Icon={Send} onPress={publish} disabled={busy} style={{ paddingVertical: 12 }} />}
                  </View>
                </View>

                {/* Breadcrumb */}
                {(data.breadcrumb || []).length ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 14, paddingHorizontal: 2 }}>
                    {data.breadcrumb.map((b) => (
                      <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <T w="bold" s={11.5} c={S.muted}>{b.name}</T>
                        <ChevronRight size={12} color={S.faint} style={{ marginHorizontal: 3 }} />
                      </View>
                    ))}
                    <T w="xbold" s={11.5} c={S.sub}>{node.name}</T>
                  </View>
                ) : null}

                {/* Details */}
                <Section label="Details" card>
                  <AdminMetaGrid items={[
                    { k: 'Status', v: STATUS_LABEL[node.status] || node.status },
                    { k: 'Difficulty', v: node.difficulty || '—' },
                    { k: 'Duration', v: node.estimatedDuration ? `${node.estimatedDuration} min` : '—' },
                    { k: 'Visibility', v: node.visibility === 'hidden' ? 'Hidden' : 'Visible' },
                    { k: 'Version', v: node.version ? `v${node.version}` : 'Unpublished' },
                    { k: 'Updated', v: fmtDate(node.updatedAt) },
                  ]} />
                  {!!node.description && <T w="semi" s={13.5} c={S.sub} style={{ marginTop: 12, lineHeight: 20 }}>{node.description}</T>}
                </Section>

                {/* Coverage + children */}
                {childLevel ? (
                  <Section label={LEVEL_PLURAL[childLevel]}>
                    {subtree && subtree.total > 0 && (
                      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                        <View style={{ flex: 1, minWidth: 140, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, borderRadius: 14, padding: 12 }}>
                          <T w="black" s={18} c={S.emerald}>{published}</T>
                          <T w="semi" s={11.5} c={S.muted}>published</T>
                        </View>
                        <View style={{ flex: 1, minWidth: 140, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, borderRadius: 14, padding: 12 }}>
                          <T w="black" s={18} c={S.gold}>{drafts}</T>
                          <T w="semi" s={11.5} c={S.muted}>draft / in review</T>
                        </View>
                      </View>
                    )}
                    <AdminCard onPress={() => navigation.navigate('NodeList', { parentId: node.id, parentName: node.name, parentLevel: node.level })}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <IconChip icon={LEVEL_ICON[childLevel]} toneKey={LEVEL_TONE[childLevel]} size={42} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <T w="xbold" s={14} c={S.ink}>{data.childCount || 0} {(LEVEL_PLURAL[childLevel] || '').toLowerCase()}</T>
                        <T w="semi" s={12} c={data.childCount ? S.muted : S.orange} numberOfLines={1}>
                          {data.childCount ? (breakdown || 'Open to manage') : `No ${(LEVEL_PLURAL[childLevel] || '').toLowerCase()} yet — add the first`}
                        </T>
                      </View>
                      <ChevronRight size={18} color={S.faint} />
                    </AdminCard>
                    <View style={{ marginTop: 10 }}>
                      <GhostButton label={`Add ${LEVEL_LABEL[childLevel]}`} icon={Plus}
                        onPress={() => navigation.navigate('NodeForm', { mode: 'add', parentId: node.id, parentName: node.name, childLevel })} />
                    </View>
                  </Section>
                ) : null}

                {/* Danger zone */}
                <Section label="Danger zone">
                  <View style={{ backgroundColor: S.redSoft, borderRadius: 18, borderWidth: 1, borderColor: '#F1C9C9', padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ShieldAlert size={16} color={S.red} strokeWidth={2.3} />
                      <T w="xbold" s={13.5} c={S.red}>Delete permanently</T>
                    </View>
                    <T w="semi" s={12} c="#9A4A4A" style={{ marginTop: 4, lineHeight: 17 }}>Can't be undone. Prefer Archive to keep history and student progress.</T>
                    <View style={{ marginTop: 10 }}>
                      <GhostButton label="Delete permanently" icon={Trash2} danger onPress={onDeletePress} disabled={busy} />
                    </View>
                  </View>
                </Section>
              </Stagger>
            ) : null}
      </ScrollView>

      {/* More menu */}
      <ActionSheet visible={moreOpen} onClose={() => setMoreOpen(false)} title={node?.name} message={node ? LEVEL_LABEL[node.level] : ''} options={moreOptions} />

      {/* Undo toast */}
      <UndoToast
        visible={!!toast}
        message={toast?.message || ''}
        onAction={toast?.onUndo ? () => { const u = toast.onUndo; setToast(null); u(); } : undefined}
        onHide={() => setToast(null)}
      />

      {/* Typed-name cascade delete */}
      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(21,24,41,0.5)', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: S.card, borderRadius: 22, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <T w="black" s={18} c={S.red}>Delete everything?</T>
              <PressableScale onPress={() => setDeleteOpen(false)} hitSlop={8}><X size={20} color={S.muted} /></PressableScale>
            </View>
            <T w="semi" s={13} c={S.sub} style={{ marginTop: 8, lineHeight: 19 }}>
              "{node?.name}" contains {breakdown || 'sub-items'}. This permanently removes all of it and cannot be undone.
            </T>
            <T w="bold" s={12} c={S.muted} style={{ marginTop: 14 }}>Type <T w="xbold" s={12} c={S.ink}>{node?.name}</T> to confirm</T>
            <TextInput
              style={{ marginTop: 6, borderWidth: 1.5, borderColor: confirmText === node?.name ? S.red : S.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: S.ink }}
              value={confirmText} onChangeText={setConfirmText} placeholder={node?.name} placeholderTextColor={S.faint} autoCapitalize="none" autoCorrect={false}
            />
            <View style={{ marginTop: 16, gap: 10 }}>
              <PressableScale
                onPress={confirmText === node?.name && !busy ? () => { setDeleteOpen(false); doDelete(true); } : undefined}
                disabled={confirmText !== node?.name || busy}
                style={{ backgroundColor: S.red, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: confirmText === node?.name && !busy ? 1 : 0.4 }}
                accessibilityRole="button" accessibilityLabel="Permanently delete everything">
                <T w="bold" s={14.5} c="#fff">Permanently delete everything</T>
              </PressableScale>
              <GhostButton label="Archive instead" icon={Archive} onPress={() => { setDeleteOpen(false); archive(); }} />
            </View>
          </View>
        </View>
      </Modal>
    </AdminScreen>
  );
}
