// src/screens/admin/learning/NodeListScreen.js
// A level-aware collection of content nodes (Subjects under a class, Chapters under a
// subject, …). Real data from /api/admin/cms/nodes. Add (→ form), open (→ detail),
// reorder (persists), and a multi-select mode with real bulk actions (publish / archive /
// delete) — each looping the same per-node endpoints, with a summary confirm first.
import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, ListTree, Check, FolderTree, CheckCheck, Send, Archive, Trash2, X } from 'lucide-react-native';
import { getCmsNodes, reorderCmsNodes, setCmsNodeStatus, deleteCmsNode } from '../../../api/adminApi';
import { AdminScreen, AdminHeader, AdminEmptyState, AdminErrorState, ListSkeleton, GhostButton, S } from '../ui/kit';
import { UndoToast } from '../ui/UndoToast';
import { apiError } from '../ui/format';
import { PressableScale, FadeIn } from '../../parent/ParentApp/anim';
import { T } from '../../parent/ParentApp/constants';
import { NodeRow } from './parts';
import { childLevelOf, LEVEL_LABEL, LEVEL_PLURAL } from './levels';

export default function NodeListScreen({ route, navigation }) {
  const { parentId = null, parentName = null, parentLevel = null } = route.params || {};
  const childLevel = childLevelOf(parentLevel);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await getCmsNodes({ parentId: parentId || 'root', sort: 'position', dir: 'asc', pageSize: 100 });
      setRows(d?.rows || []);
    } catch (e) { setError(apiError(e, 'Could not load this content.')); }
    finally { setLoading(false); }
  }, [parentId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const goAdd = () => navigation.navigate('NodeForm', { mode: 'add', parentId, parentName, childLevel });
  const openNode = (node) => navigation.navigate('NodeDetail', { id: node.id });

  const move = async (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= rows.length) return;
    const next = rows.slice();
    const [it] = next.splice(index, 1);
    next.splice(j, 0, it);
    setRows(next);
    try { await reorderCmsNodes(parentId, next.map((n) => n.id)); }
    catch (e) { Alert.alert('Could not reorder', apiError(e)); load(); }
  };

  // ── selection ──
  const enterSelect = (id) => { setReordering(false); setSelecting(true); setSelected(new Set(id ? [id] : [])); };
  const exitSelect = () => { setSelecting(false); setSelected(new Set()); };
  const toggle = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelected(new Set(rows.map((r) => r.id)));

  const runBulk = async (fn, doneMsg) => {
    const ids = [...selected];
    const results = await Promise.allSettled(ids.map(fn));
    const okN = results.filter((r) => r.status === 'fulfilled').length;
    exitSelect(); await load();
    setToast({ message: `${okN} ${doneMsg}${okN !== ids.length ? ` · ${ids.length - okN} skipped` : ''}` });
  };
  const bulkStatus = (status, verb, doneMsg) => {
    const n = selected.size;
    Alert.alert(`${verb} ${n} item${n > 1 ? 's' : ''}?`,
      status === 'archived' ? 'They disappear from students but their history is kept.' : status === 'published' ? 'They become visible to students.' : 'They will be hidden from students.',
      [{ text: 'Cancel', style: 'cancel' }, { text: verb, style: status === 'draft' ? 'destructive' : 'default', onPress: () => runBulk((id) => setCmsNodeStatus(id, status), doneMsg) }]);
  };
  const bulkDelete = () => {
    const n = selected.size;
    Alert.alert(`Delete ${n} item${n > 1 ? 's' : ''}?`, 'This permanently removes them and everything inside. This cannot be undone.',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => runBulk((id) => deleteCmsNode(id, true), 'deleted') }]);
  };

  const title = parentName || 'Content library';
  const subtitle = childLevel ? LEVEL_PLURAL[childLevel] : 'Content';
  const canBack = navigation.canGoBack();

  return (
    <AdminScreen>
      <AdminHeader
        title={selecting ? `${selected.size} selected` : title}
        subtitle={selecting ? 'Tap to select' : subtitle}
        onBack={selecting ? exitSelect : (canBack ? () => navigation.goBack() : undefined)}
        right={selecting ? (
          <PressableScale onPress={selectAll} hitSlop={8} accessibilityLabel="Select all" style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, alignItems: 'center', justifyContent: 'center' }}>
            <CheckCheck size={18} color={S.indigo} strokeWidth={2.3} />
          </PressableScale>
        ) : (!reordering && childLevel ? (
          <PressableScale onPress={goAdd} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Add ${LEVEL_LABEL[childLevel]}`}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: S.indigo, alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={20} color="#fff" strokeWidth={2.6} />
          </PressableScale>
        ) : null)}
      />

      {!loading && !error && rows.length > 0 && !selecting && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginBottom: 2 }}>
          <T w="bold" s={12.5} c={S.muted}>{rows.length} {(LEVEL_PLURAL[childLevel] || 'items').toLowerCase()}</T>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {rows.length > 1 && childLevel && !reordering && (
              <PressableScale onPress={() => enterSelect()} hitSlop={6} accessibilityLabel="Select" style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10 }}>
                <Check size={15} color={S.muted} strokeWidth={2.4} /><T w="xbold" s={12} c={S.muted}>Select</T>
              </PressableScale>
            )}
            {rows.length > 1 && childLevel && (
              <PressableScale onPress={() => setReordering((r) => !r)} hitSlop={6} accessibilityLabel={reordering ? 'Done reordering' : 'Reorder'}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: reordering ? S.indigoSoft : 'transparent' }}>
                {reordering ? <Check size={15} color={S.indigo} strokeWidth={2.6} /> : <ListTree size={15} color={S.muted} strokeWidth={2.3} />}
                <T w="xbold" s={12} c={reordering ? S.indigo : S.muted}>{reordering ? 'Done' : 'Reorder'}</T>
              </PressableScale>
            )}
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: selecting ? 180 : 130 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={S.indigo} />}
      >
        {loading ? (
          <View style={{ backgroundColor: S.card, borderRadius: 20, borderWidth: 1, borderColor: S.hair, paddingVertical: 6 }}><ListSkeleton rows={6} /></View>
        ) : error ? (
          <AdminErrorState message={error} onRetry={load} />
        ) : !rows.length ? (
          <AdminEmptyState
            icon={FolderTree}
            title={`No ${(LEVEL_PLURAL[childLevel] || 'items').toLowerCase()} yet`}
            message={childLevel ? `Add the first ${LEVEL_LABEL[childLevel].toLowerCase()} to start building this out.` : 'Nothing here yet.'}
            action={childLevel ? <GhostButton label={`Add ${LEVEL_LABEL[childLevel]}`} icon={Plus} onPress={goAdd} /> : undefined}
          />
        ) : (
          <FadeIn y={8} duration={340}>
            <View style={{ backgroundColor: S.card, borderRadius: 20, borderWidth: 1, borderColor: S.hair, overflow: 'hidden' }}>
              {rows.map((n, i) => (
                <NodeRow
                  key={n.id}
                  node={n}
                  onPress={() => openNode(n)}
                  onLongPress={() => enterSelect(n.id)}
                  reordering={reordering}
                  onUp={() => move(i, -1)}
                  onDown={() => move(i, 1)}
                  canUp={i > 0}
                  canDown={i < rows.length - 1}
                  last={i === rows.length - 1}
                  selecting={selecting}
                  selected={selected.has(n.id)}
                  onToggle={() => toggle(n.id)}
                />
              ))}
            </View>
          </FadeIn>
        )}
      </ScrollView>

      {/* Bulk action bar */}
      {selecting && selected.size > 0 && (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 96 }}>
          <View style={{ flexDirection: 'row', gap: 8, backgroundColor: S.card, borderRadius: 18, borderWidth: 1, borderColor: S.hair, padding: 8, ...({ shadowColor: '#1A1B45', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 }) }}>
            <BulkBtn icon={Send} label="Publish" tone={S.emerald} onPress={() => bulkStatus('published', 'Publish', 'published')} />
            <BulkBtn icon={Archive} label="Archive" tone={S.orange} onPress={() => bulkStatus('archived', 'Archive', 'archived')} />
            <BulkBtn icon={Trash2} label="Delete" tone={S.red} onPress={bulkDelete} />
            <PressableScale onPress={exitSelect} hitSlop={6} style={{ width: 44, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Cancel selection"><X size={20} color={S.muted} /></PressableScale>
          </View>
        </View>
      )}

      <UndoToast visible={!!toast} message={toast?.message || ''} onHide={() => setToast(null)} bottom={selecting ? 160 : 100} />
    </AdminScreen>
  );
}

function BulkBtn({ icon: Icon, label, tone, onPress }) {
  return (
    <PressableScale onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 8, borderRadius: 12 }} accessibilityRole="button" accessibilityLabel={label}>
      <Icon size={19} color={tone} strokeWidth={2.3} />
      <T w="xbold" s={11} c={tone}>{label}</T>
    </PressableScale>
  );
}
