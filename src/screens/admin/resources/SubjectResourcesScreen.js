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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/designSystem';
import { PressableScale, FadeInOnce } from '../../parent/ParentApp/anim';
import { AdminBadge, GhostButton } from '../ui/kit';
import { ActionSheet } from '../ui/ActionSheet';
import { UndoToast } from '../ui/UndoToast';
import { apiError } from '../ui/format';
import { useBottomPad } from '../../../theme/layout';

const isContentBlock = (e) => e?.response?.status === 409 && /content/i.test(e?.response?.data?.error || '');
const ST_TONE = { published: 'emerald', hidden: 'gold', archived: 'purple' };

// Local dark palette — same recipe as AdminHomeScreen.js's DK, kept local since the
// light `studentUI` kit is still what other un-migrated admin/student screens render with.
const DK = {
  canvas: COLORS.background,
  card: 'rgba(255,255,255,0.05)',
  hair: 'rgba(255,255,255,0.10)',
  ink: COLORS.textPrimary,
  sub: 'rgba(241,240,245,0.75)',
  muted: COLORS.textSecondary,
  faint: 'rgba(241,240,245,0.45)',
  indigo: COLORS.primary, indigoSoft: 'rgba(124,58,237,0.18)',
  orange: COLORS.warning, orangeSoft: 'rgba(249,115,22,0.16)',
};

function Header({ title, subtitle }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingHorizontal: 18, paddingBottom: 12, paddingTop: insets.top + 8 }}>
      <T w="black" s={22} c={DK.ink} style={{ letterSpacing: -0.5 }} numberOfLines={1}>{title}</T>
      {!!subtitle && <T w="semi" s={12.5} c={DK.muted} style={{ marginTop: 1 }} numberOfLines={1}>{subtitle}</T>}
    </View>
  );
}

function Skeleton({ w, h, r = 12, mb = 0 }) {
  return <View style={{ width: w, height: h, borderRadius: r, backgroundColor: DK.card, marginBottom: mb }} />;
}

function ErrorState({ title = "Couldn't load", onRetry }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
      <View style={{ width: 68, height: 68, borderRadius: 22, backgroundColor: DK.card, borderWidth: 1, borderColor: DK.hair, alignItems: 'center', justifyContent: 'center' }}>
        <TriangleAlert size={28} color={DK.muted} strokeWidth={2} />
      </View>
      <T w="xbold" s={16} c={DK.ink}>{title}</T>
      {!!onRetry && (
        <PressableScale style={{ marginTop: 4, backgroundColor: DK.indigo, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 26 }} onPress={onRetry} accessibilityLabel="Retry">
          <T w="bold" s={14} c="#fff">Retry</T>
        </PressableScale>
      )}
    </View>
  );
}

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
    <View style={{ flex: 1, backgroundColor: DK.canvas }}>
      <Header title={name || 'Subject'} subtitle={cls != null ? `Class ${cls} · Chapters & papers` : 'Chapters & papers'} />
      <ScrollView style={{ flex: 1, paddingHorizontal: 18 }} contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 4 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={DK.indigo} />}>
        {loading && !chapters.length ? (
          <View style={{ paddingTop: 8 }}>{[0, 1, 2].map((i) => <Skeleton key={i} w="100%" h={64} r={16} mb={10} />)}</View>
        ) : error ? (
          <ErrorState title="Couldn't load" onRetry={load} />
        ) : (
          <>
            {/* chapters */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: DK.indigo }} /><T w="black" s={16} c={DK.ink}>Chapters</T><T w="bold" s={11.5} c={DK.faint}>{chList.length}</T></View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {chList.length > 1 && <PressableScale onPress={() => setReordering((r) => !r)} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>{reordering ? <Check size={15} color={DK.indigo} /> : <ListTree size={15} color={DK.muted} />}<T w="xbold" s={12} c={reordering ? DK.indigo : DK.muted}>{reordering ? 'Done' : 'Reorder'}</T></PressableScale>}
                <PressableScale onPress={() => navigation.navigate('ChapterForm', { mode: 'add', slug, classLevel: cls })} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: DK.indigo, alignItems: 'center', justifyContent: 'center' }}><Plus size={18} color="#fff" strokeWidth={2.6} /></PressableScale>
              </View>
            </View>
            <View style={{ backgroundColor: DK.card, borderRadius: 18, borderWidth: 1, borderColor: DK.hair, overflow: 'hidden' }}>
              {chList.length ? chList.map((c, i) => (
                <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: i < chList.length - 1 ? 1 : 0, borderBottomColor: DK.hair }}>
                  <PressableScale disabled={reordering} onPress={() => setSheet(c)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: DK.indigoSoft, alignItems: 'center', justifyContent: 'center' }}><Layers size={16} color={DK.indigo} strokeWidth={2.3} /></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T w="xbold" s={13.5} c={DK.ink} numberOfLines={2}>{c.name}</T>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                        <AdminBadge toneKey={ST_TONE[c.status] || 'gold'}>{c.status}</AdminBadge>
                        {!c.hasContent && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><TriangleAlert size={11} color={DK.orange} strokeWidth={2.4} /><T w="bold" s={10.5} c={DK.orange}>no content</T></View>}
                      </View>
                    </View>
                    {!reordering && <ChevronRight size={16} color={DK.faint} />}
                  </PressableScale>
                  {reordering && (
                    <View style={{ flexDirection: 'row', gap: 2, paddingRight: 10 }}>
                      <PressableScale onPress={() => moveChapter(i, -1)} disabled={i === 0} hitSlop={6} style={{ opacity: i === 0 ? 0.3 : 1, padding: 5 }}><ArrowUp size={17} color={DK.sub} /></PressableScale>
                      <PressableScale onPress={() => moveChapter(i, 1)} disabled={i === chList.length - 1} hitSlop={6} style={{ opacity: i === chList.length - 1 ? 0.3 : 1, padding: 5 }}><ArrowDown size={17} color={DK.sub} /></PressableScale>
                    </View>
                  )}
                </View>
              )) : <T w="bold" s={13} c={DK.muted} style={{ padding: 14 }}>No chapters in this class yet.</T>}
            </View>

            {/* papers */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: DK.orange }} /><T w="black" s={16} c={DK.ink}>Previous Year Papers</T><T w="bold" s={11.5} c={DK.faint}>{papers.length}</T></View>
              <PressableScale onPress={addPaper} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: DK.orange, alignItems: 'center', justifyContent: 'center' }}><Plus size={18} color="#fff" strokeWidth={2.6} /></PressableScale>
            </View>
            <View style={{ backgroundColor: DK.card, borderRadius: 18, borderWidth: 1, borderColor: DK.hair, overflow: 'hidden' }}>
              {papers.length ? papers.map((p, i) => (
                <View key={p.extUid} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: i < papers.length - 1 ? 1 : 0, borderBottomColor: DK.hair }}>
                  <PressableScale onPress={() => editPaper(p)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: DK.orangeSoft, alignItems: 'center', justifyContent: 'center' }}><FileText size={16} color={DK.orange} strokeWidth={2.3} /></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T w="xbold" s={13} c={DK.ink} numberOfLines={2}>{p.paperTitle || p.name || p.setLabel || p.extUid}</T>
                      <T w="semi" s={11.5} c={DK.muted} numberOfLines={1} style={{ marginTop: 1 }}>{[p.year, p.paperFormat === 'pdf' ? 'PDF' : 'HTML', p.setLabel].filter(Boolean).join(' · ')}</T>
                    </View>
                  </PressableScale>
                  <PressableScale onPress={() => setPaperSheet({ paper: p, index: i })} hitSlop={8} accessibilityLabel="Paper actions" style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                    <EllipsisVertical size={18} color={DK.faint} />
                  </PressableScale>
                </View>
              )) : <T w="bold" s={13} c={DK.muted} style={{ padding: 14 }}>No papers yet. Tap + to add one.</T>}
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
