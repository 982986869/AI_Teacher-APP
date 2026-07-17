// src/screens/admin/resources/SubjectResourcesScreen.js
// Manage one subject's chapters (rename / reorder / hide-show / archive / delete-if-empty,
// plus "Edit content" → notes / MCQs / questions per chapter) and its Previous-Year Papers
// (add / edit / reorder / remove) — all reflected on the Student side. Papers are HTML docs
// (question_paper_html + answer_key_html), edited via PaperEditor; there is still no file-upload
// service, so no fake "Upload PDF" control appears.
import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Plus, ListTree, Check, Layers, FileText, ArrowUp, ArrowDown, Pencil, Eye, EyeOff, Archive, RotateCcw, Trash2, TriangleAlert, ChevronRight, EllipsisVertical,
} from 'lucide-react-native';
import {
  getAdminSubjectChapters, getAdminSubjectPapers, setAdminChapterStatus, reorderAdminChapters,
  deleteAdminChapter, reorderAdminPapers, deleteAdminPaper,
} from '../../../api/adminApi';
import { T } from '../../parent/ParentApp/constants';
import { S, shadow, StudentScreenHeader, StudentErrorState, StudentSkeleton } from '../../../theme/studentUI';
import { PressableScale, FadeInOnce } from '../../parent/ParentApp/anim';
import { AdminBadge, GhostButton } from '../ui/kit';
import { ActionSheet } from '../ui/ActionSheet';
import { UndoToast } from '../ui/UndoToast';
import { apiError } from '../ui/format';
import { useBottomPad } from '../../../theme/layout';

const isContentBlock = (e) => e?.response?.status === 409 && /content/i.test(e?.response?.data?.error || '');
const ST_TONE = { published: 'emerald', hidden: 'gold', archived: 'purple' };

export default function SubjectResourcesScreen({ route, navigation }) {
  // The class is FIXED from the previous screen (Resources → subject for a class) — no class
  // switching inside detail; everything is scoped to this class.
  const { slug, name, classLevel } = route.params || {};
  const cls = classLevel != null ? Number(classLevel) : null;
  const [chapters, setChapters] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [paperSheet, setPaperSheet] = useState(null); // { paper, index }
  const [toast, setToast] = useState(null);
  const bottomPad = useBottomPad();

  const load = useCallback(async () => {
    setError(false);
    try {
      const d = await getAdminSubjectChapters(slug, { class: cls });
      setChapters(d?.rows || []);
      const p = await getAdminSubjectPapers(slug, { class: cls }).catch(() => ({ rows: [] }));
      setPapers(p?.rows || []);
    } catch (_) { setError(true); }
    finally { setLoading(false); }
  }, [slug, cls]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const chList = chapters; // already scoped to this class by the API

  const reloadPapers = async () => { const p = await getAdminSubjectPapers(slug, { class: cls }).catch(() => ({ rows: [] })); setPapers(p?.rows || []); };

  const act = async (fn, undoMsg, onUndo) => { try { await fn(); await load(); if (undoMsg) setToast({ message: undoMsg, onUndo }); } catch (e) { Alert.alert('Could not complete', apiError(e)); } };

  const moveChapter = async (index, dir) => {
    const j = index + dir; if (j < 0 || j >= chList.length) return;
    const next = chList.slice(); const [it] = next.splice(index, 1); next.splice(j, 0, it);
    // Rebuild the full chapters array with this class's new order (others untouched).
    setChapters(next);
    try { await reorderAdminChapters(next.map((c) => c.id)); } catch (e) { Alert.alert('Could not reorder', apiError(e)); load(); }
  };
  const delChapter = (c) => Alert.alert('Remove chapter?', `Remove "${c.name}"? If it has content, archive it instead.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => { try { await deleteAdminChapter(c.id); load(); } catch (e) { if (isContentBlock(e)) Alert.alert('Has content', 'This chapter has notes/questions. Archive it instead of deleting.', [{ text: 'OK' }, { text: 'Archive', onPress: () => act(() => setAdminChapterStatus(c.id, 'archived')) }]); else Alert.alert('Could not remove', apiError(e)); } } },
  ]);

  const chapterOptions = (c) => c ? [
    { key: 'content', label: 'Edit content', sub: 'Notes, important & previous-year questions', icon: FileText, tone: 'emerald', onPress: () => navigation.navigate('ChapterContent', { id: c.id, name: c.name }) },
    { key: 'edit', label: 'Edit details', icon: Pencil, tone: 'indigo', onPress: () => navigation.navigate('ChapterForm', { mode: 'edit', slug, chapter: c }) },
    c.status === 'published'
      ? { key: 'hide', label: 'Hide from students', icon: EyeOff, tone: 'gold', onPress: () => act(() => setAdminChapterStatus(c.id, 'hidden'), 'Chapter hidden', () => act(() => setAdminChapterStatus(c.id, 'published'))) }
      : { key: 'show', label: 'Show to students', icon: Eye, tone: 'emerald', onPress: () => act(() => setAdminChapterStatus(c.id, 'published')) },
    c.status !== 'archived'
      ? { key: 'arch', label: 'Archive', sub: 'Hidden, kept for records', icon: Archive, tone: 'orange', onPress: () => act(() => setAdminChapterStatus(c.id, 'archived'), 'Chapter archived', () => act(() => setAdminChapterStatus(c.id, 'published'))) }
      : { key: 'rest', label: 'Restore', icon: RotateCcw, tone: 'emerald', onPress: () => act(() => setAdminChapterStatus(c.id, 'published')) },
    { key: 'del', label: 'Remove', icon: Trash2, danger: true, onPress: () => delChapter(c) },
  ] : [];

  const movePaper = async (index, dir) => {
    const j = index + dir; if (j < 0 || j >= papers.length) return;
    const next = papers.slice(); const [it] = next.splice(index, 1); next.splice(j, 0, it);
    setPapers(next);
    try { await reorderAdminPapers(slug, cls, next.map((p) => p.extUid)); } catch (e) { Alert.alert('Could not reorder', apiError(e)); reloadPapers(); }
  };
  const delPaper = (p) => Alert.alert('Remove paper?', `Remove "${p.paperTitle || p.name || p.extUid}"? This can't be undone.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => { try { await deleteAdminPaper(slug, p.extUid, cls); reloadPapers(); } catch (e) { Alert.alert('Could not remove', apiError(e)); } } },
  ]);
  const editPaper = (p) => navigation.navigate('PaperEditor', { slug, classLevel: cls, extUid: p.extUid, subjectName: name });
  const addPaper = () => navigation.navigate('PaperEditor', { slug, classLevel: cls, subjectName: name });
  const paperOptions = (entry) => {
    if (!entry) return [];
    const { paper: p, index } = entry;
    return [
      { key: 'edit', label: 'Edit paper', sub: 'Title, year & content', icon: Pencil, tone: 'emerald', onPress: () => editPaper(p) },
      index > 0 ? { key: 'up', label: 'Move up', icon: ArrowUp, tone: 'indigo', onPress: () => movePaper(index, -1) } : null,
      index < papers.length - 1 ? { key: 'down', label: 'Move down', icon: ArrowDown, tone: 'indigo', onPress: () => movePaper(index, 1) } : null,
      { key: 'del', label: 'Remove paper', icon: Trash2, danger: true, onPress: () => delPaper(p) },
    ].filter(Boolean);
  };

  return (
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <StudentScreenHeader title={name || 'Subject'} subtitle={cls != null ? `Class ${cls} · Chapters & papers` : 'Chapters & papers'} />
      <ScrollView style={{ flex: 1, paddingHorizontal: 18 }} contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 4 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={S.indigo} />}>
        {loading && !chapters.length ? (
          <View style={{ paddingTop: 8 }}>{[0, 1, 2].map((i) => <StudentSkeleton key={i} w="100%" h={64} r={16} mb={10} />)}</View>
        ) : error ? (
          <StudentErrorState title="Couldn't load" onRetry={load} />
        ) : (
          <>
            {/* chapters */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: S.indigo }} /><T w="black" s={16} c={S.ink}>Chapters</T><T w="bold" s={11.5} c={S.faint}>{chList.length}</T></View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {chList.length > 1 && <PressableScale onPress={() => setReordering((r) => !r)} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>{reordering ? <Check size={15} color={S.indigo} /> : <ListTree size={15} color={S.muted} />}<T w="xbold" s={12} c={reordering ? S.indigo : S.muted}>{reordering ? 'Done' : 'Reorder'}</T></PressableScale>}
                <PressableScale onPress={() => navigation.navigate('ChapterForm', { mode: 'add', slug, classLevel: cls })} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: S.indigo, alignItems: 'center', justifyContent: 'center' }}><Plus size={18} color="#fff" strokeWidth={2.6} /></PressableScale>
              </View>
            </View>
            <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: S.hair, overflow: 'hidden', ...shadow }}>
              {chList.length ? chList.map((c, i) => (
                <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: i < chList.length - 1 ? 1 : 0, borderBottomColor: S.hair }}>
                  <PressableScale disabled={reordering} onPress={() => setSheet(c)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: S.indigoSoft, alignItems: 'center', justifyContent: 'center' }}><Layers size={16} color={S.indigo} strokeWidth={2.3} /></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T w="xbold" s={13.5} c={S.ink} numberOfLines={2}>{c.name}</T>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                        <AdminBadge toneKey={ST_TONE[c.status] || 'gold'}>{c.status}</AdminBadge>
                        {!c.hasContent && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><TriangleAlert size={11} color={S.orange} strokeWidth={2.4} /><T w="bold" s={10.5} c={S.orange}>no content</T></View>}
                      </View>
                    </View>
                    {!reordering && <ChevronRight size={16} color={S.faint} />}
                  </PressableScale>
                  {reordering && (
                    <View style={{ flexDirection: 'row', gap: 2, paddingRight: 10 }}>
                      <PressableScale onPress={() => moveChapter(i, -1)} disabled={i === 0} hitSlop={6} style={{ opacity: i === 0 ? 0.3 : 1, padding: 5 }}><ArrowUp size={17} color={S.sub} /></PressableScale>
                      <PressableScale onPress={() => moveChapter(i, 1)} disabled={i === chList.length - 1} hitSlop={6} style={{ opacity: i === chList.length - 1 ? 0.3 : 1, padding: 5 }}><ArrowDown size={17} color={S.sub} /></PressableScale>
                    </View>
                  )}
                </View>
              )) : <T w="bold" s={13} c={S.muted} style={{ padding: 14 }}>No chapters in this class yet.</T>}
            </View>

            {/* papers */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: S.orange }} /><T w="black" s={16} c={S.ink}>Previous Year Papers</T><T w="bold" s={11.5} c={S.faint}>{papers.length}</T></View>
              <PressableScale onPress={addPaper} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: S.orange, alignItems: 'center', justifyContent: 'center' }}><Plus size={18} color="#fff" strokeWidth={2.6} /></PressableScale>
            </View>
            <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: S.hair, overflow: 'hidden', ...shadow }}>
              {papers.length ? papers.map((p, i) => (
                <View key={p.extUid} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: i < papers.length - 1 ? 1 : 0, borderBottomColor: S.hair }}>
                  <PressableScale onPress={() => editPaper(p)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: S.orangeSoft, alignItems: 'center', justifyContent: 'center' }}><FileText size={16} color={S.orange} strokeWidth={2.3} /></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T w="xbold" s={13} c={S.ink} numberOfLines={2}>{p.paperTitle || p.name || p.setLabel || p.extUid}</T>
                      <T w="semi" s={11.5} c={S.muted} numberOfLines={1} style={{ marginTop: 1 }}>{[p.year, p.paperFormat === 'pdf' ? 'PDF' : 'HTML', p.setLabel].filter(Boolean).join(' · ')}</T>
                    </View>
                  </PressableScale>
                  <PressableScale onPress={() => setPaperSheet({ paper: p, index: i })} hitSlop={8} accessibilityLabel="Paper actions" style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                    <EllipsisVertical size={18} color={S.faint} />
                  </PressableScale>
                </View>
              )) : <T w="bold" s={13} c={S.muted} style={{ padding: 14 }}>No papers yet. Tap + to add one.</T>}
            </View>

          </>
        )}
      </ScrollView>

      <ActionSheet visible={!!sheet} onClose={() => setSheet(null)} title={sheet?.name} message="Chapter" options={chapterOptions(sheet)} />
      <ActionSheet visible={!!paperSheet} onClose={() => setPaperSheet(null)} title={paperSheet?.paper?.paperTitle || paperSheet?.paper?.name || 'Paper'} message="Previous year paper" options={paperOptions(paperSheet)} />
      <UndoToast visible={!!toast} message={toast?.message || ''} onAction={toast?.onUndo ? () => { const u = toast.onUndo; setToast(null); u(); } : undefined} onHide={() => setToast(null)} />
    </View>
  );
}
