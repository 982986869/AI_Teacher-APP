// src/screens/admin/tests/TestDetailScreen.js
// A mock test's detail — real /api/admin/tests/:id. Identity, rules, attempts, the ordered
// questions, and the full lifecycle (Edit, Publish/Unpublish, Duplicate, Archive/Restore,
// Preview as student, Delete). Structural editing + delete are blocked once students have
// attempted it — the UI surfaces "Duplicate to make a new version".
import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Pencil, Send, Undo2, EllipsisVertical, Copy, Archive, RotateCcw, Trash2, Eye, Plus,
  ArrowUp, ArrowDown, ShieldAlert, ListTree, Check,
} from 'lucide-react-native';
import { getAdminTest, setAdminTestStatus, duplicateAdminTest, deleteAdminTest, reorderAdminTestQuestions, duplicateAdminTestQuestion, removeAdminTestQuestion } from '../../../api/adminApi';
import { T } from '../../parent/ParentApp/constants';
import { S, StudentScreenHeader } from '../../../theme/studentUI';
import { PressableScale, Stagger } from '../../parent/ParentApp/anim';
import { AdminScreen, AdminCard, AdminBadge, AdminMetaGrid, Section, GhostButton, ListSkeleton, AdminErrorState, S as KS } from '../ui/kit';
import { ActionSheet } from '../ui/ActionSheet';
import { StudentPrimaryButton } from '../../../theme/studentUI';
import { apiError, fmtDate, plainText, firstImg } from '../ui/format';

const isAttemptBlock = (e) => e?.response?.status === 409 && /attempt/i.test(e?.response?.data?.error || '');

export default function TestDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const [qMenu, setQMenu] = useState(null);
  const [reordering, setReordering] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await getAdminTest(id)); }
    catch (e) { setError(apiError(e)); }
    finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const test = data?.test;
  const questions = data?.questions || [];
  const editable = data?.editable;

  const run = async (fn, ok) => { setBusy(true); try { await fn(); await load(); if (ok) ok(); } catch (e) { Alert.alert('Could not complete', apiError(e)); } finally { setBusy(false); } };
  const publish = () => run(() => setAdminTestStatus(id, 'published')).catch(() => {});
  const doPublish = () => Alert.alert('Publish test?', `"${test.name}" will appear in students' Practice → Mock Tests.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Publish', onPress: () => run(() => setAdminTestStatus(id, 'published')) }]);
  const unpublish = () => Alert.alert('Unpublish?', 'It disappears from Practice for new attempts. Existing results stay.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Unpublish', style: 'destructive', onPress: () => run(() => setAdminTestStatus(id, 'draft')) }]);
  const duplicate = () => run(async () => { const r = await duplicateAdminTest(id); if (r?.test?.id) navigation.push('TestDetail', { id: r.test.id }); });
  const del = () => Alert.alert('Delete permanently?', `Remove "${test.name}"? This cannot be undone.`, [{ text: 'Cancel', style: 'cancel' }, {
    text: 'Delete', style: 'destructive', onPress: async () => {
      setBusy(true);
      try { await deleteAdminTest(id); navigation.goBack(); }
      catch (e) { setBusy(false); if (isAttemptBlock(e)) Alert.alert('Has student attempts', 'This test has attempts and cannot be deleted. Archive it instead to keep results.', [{ text: 'OK' }, { text: 'Archive', onPress: () => run(() => setAdminTestStatus(id, 'archived')) }]); else Alert.alert('Could not delete', apiError(e)); }
    },
  }]);

  const move = async (index, dir) => {
    const j = index + dir; if (j < 0 || j >= questions.length) return;
    const next = questions.slice(); const [it] = next.splice(index, 1); next.splice(j, 0, it);
    setData((d) => ({ ...d, questions: next }));
    try { await reorderAdminTestQuestions(id, next.map((q) => q.id)); }
    catch (e) { Alert.alert('Could not reorder', apiError(e)); load(); }
  };

  const dupQ = (q) => run(() => duplicateAdminTestQuestion(id, q.id));
  const delQ = (q) => Alert.alert('Delete question?', 'This removes it from the test.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => run(() => removeAdminTestQuestion(id, q.id)) }]);
  const qMenuOptions = qMenu ? [
    { key: 'edit', label: 'Edit question', icon: Pencil, tone: 'indigo', onPress: () => navigation.navigate('QuestionForm', { mode: 'edit', testId: id, question: qMenu }) },
    { key: 'dup', label: 'Duplicate question', icon: Copy, tone: 'blue', onPress: () => dupQ(qMenu) },
    { key: 'del', label: 'Delete question', icon: Trash2, danger: true, onPress: () => delQ(qMenu) },
  ] : [];

  const moreOptions = test ? [
    { key: 'preview', label: 'Preview as student', icon: Eye, tone: 'blue', onPress: () => navigation.navigate('TestPreview', { id }) },
    { key: 'dup', label: 'Duplicate', sub: 'New draft copy — no attempts', icon: Copy, tone: 'blue', onPress: duplicate },
    test.status !== 'archived'
      ? { key: 'arch', label: 'Archive', sub: 'Hide from students, keep results', icon: Archive, tone: 'orange', onPress: () => run(() => setAdminTestStatus(id, 'archived')) }
      : { key: 'rest', label: 'Restore as draft', icon: RotateCcw, tone: 'emerald', onPress: () => run(() => setAdminTestStatus(id, 'draft')) },
  ] : [];

  return (
    <AdminScreen>
      <StudentScreenHeader title={test?.name || 'Test'} subtitle="Mock test"
        right={test ? <PressableScale onPress={() => setMore(true)} hitSlop={8} accessibilityLabel="More" style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: KS.card, borderWidth: 1, borderColor: KS.hair, alignItems: 'center', justifyContent: 'center' }}><EllipsisVertical size={19} color={KS.sub} /></PressableScale> : null} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 130 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={KS.indigo} />}>
        {loading && !data ? <ListSkeleton rows={6} />
          : error && !data ? <AdminErrorState message={error} onRetry={load} />
            : test ? (
              <Stagger base={24} step={50}>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <AdminBadge toneKey={test.status === 'published' ? 'emerald' : test.status === 'draft' ? 'gold' : 'purple'}>{test.status}</AdminBadge>
                  {test.attemptCount > 0 && <AdminBadge toneKey="blue" dot={false}>{test.attemptCount} attempts</AdminBadge>}
                </View>

                {!editable && (
                  <View style={{ flexDirection: 'row', gap: 10, backgroundColor: KS.goldSoft, borderRadius: 16, padding: 14, marginTop: 12 }}>
                    <ShieldAlert size={18} color={KS.gold} strokeWidth={2.3} />
                    <T w="semi" s={12.5} c="#8A5A16" style={{ flex: 1, lineHeight: 18 }}>Students have attempted this test, so its questions are locked. Duplicate it to make a new version you can edit.</T>
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <View style={{ flex: 1 }}><GhostButton label="Edit details" icon={Pencil} onPress={() => navigation.navigate('TestForm', { mode: 'edit', test })} disabled={busy} /></View>
                  <View style={{ flex: 1 }}>{test.status === 'published' ? <GhostButton label="Unpublish" icon={Undo2} onPress={unpublish} disabled={busy} /> : <StudentPrimaryButton label="Publish" Icon={Send} onPress={doPublish} disabled={busy} style={{ paddingVertical: 12 }} />}</View>
                </View>

                <Section label="Rules" card>
                  <AdminMetaGrid items={[
                    { k: 'Subject', v: test.subject || '—' }, { k: 'Class', v: test.classLevel ? `Class ${test.classLevel}` : '—' },
                    { k: 'Difficulty', v: test.difficulty || '—' }, { k: 'Duration', v: `${test.durationMin} min` },
                    { k: 'Questions', v: String(test.questionCount || 0) }, { k: 'Updated', v: fmtDate(test.updatedAt) },
                  ]} />
                  {test.avgScore != null && <T w="semi" s={12.5} c={KS.muted} style={{ marginTop: 10 }}>Average score: {Math.round(test.avgScore)} across {test.attemptCount} attempts</T>}
                </Section>

                <Section label={`Questions · ${questions.length}`} right={editable && questions.length > 1 ? (
                  <PressableScale onPress={() => setReordering((r) => !r)} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {reordering ? <Check size={14} color={KS.indigo} /> : <ListTree size={14} color={KS.muted} />}<T w="xbold" s={11.5} c={reordering ? KS.indigo : KS.muted}>{reordering ? 'Done' : 'Reorder'}</T>
                  </PressableScale>
                ) : null}>
                  {questions.length ? (
                    <>
                      <AdminCard style={{ padding: 6 }}>
                        {questions.map((q, i) => (
                          <View key={q.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 8, borderBottomWidth: i < questions.length - 1 ? 1 : 0, borderBottomColor: KS.hair }}>
                            <PressableScale disabled={reordering || !editable} onPress={() => navigation.navigate('QuestionForm', { mode: 'edit', testId: id, question: q })} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: KS.indigoSoft, alignItems: 'center', justifyContent: 'center' }}><T w="black" s={11} c={KS.indigo}>{i + 1}</T></View>
                              <T w="semi" s={13} c={KS.ink} numberOfLines={2} style={{ flex: 1 }}>{plainText(q.question) || (firstImg(q.question) ? '🖼 Image question' : '')}</T>
                            </PressableScale>
                            {reordering ? (
                              <View style={{ flexDirection: 'row', gap: 2 }}>
                                <PressableScale onPress={() => move(i, -1)} disabled={i === 0} hitSlop={6} style={{ opacity: i === 0 ? 0.3 : 1, padding: 5 }}><ArrowUp size={17} color={KS.sub} /></PressableScale>
                                <PressableScale onPress={() => move(i, 1)} disabled={i === questions.length - 1} hitSlop={6} style={{ opacity: i === questions.length - 1 ? 0.3 : 1, padding: 5 }}><ArrowDown size={17} color={KS.sub} /></PressableScale>
                              </View>
                            ) : editable ? <PressableScale onPress={() => setQMenu(q)} hitSlop={6} accessibilityLabel="Question actions" style={{ padding: 5 }}><EllipsisVertical size={17} color={KS.faint} /></PressableScale> : null}
                          </View>
                        ))}
                      </AdminCard>
                      {editable && <View style={{ marginTop: 12 }}><StudentPrimaryButton label="Add question" Icon={Plus} onPress={() => navigation.navigate('QuestionForm', { mode: 'add', testId: id })} /></View>}
                    </>
                  ) : editable ? (
                    // Prominent empty state — this is where you add the test's content (questions).
                    <AdminCard style={{ alignItems: 'center', paddingVertical: 26, paddingHorizontal: 20, gap: 10 }}>
                      <View style={{ width: 62, height: 62, borderRadius: 20, backgroundColor: KS.indigoSoft, alignItems: 'center', justifyContent: 'center' }}><ListTree size={28} color={KS.indigo} strokeWidth={2.2} /></View>
                      <T w="black" s={16} c={KS.ink}>No questions yet</T>
                      <T w="semi" s={12.5} c={KS.muted} style={{ textAlign: 'center', maxWidth: 260, lineHeight: 18 }}>Add questions (with options, correct answer & explanation) so students can attempt this test.</T>
                      <View style={{ marginTop: 4, alignSelf: 'stretch' }}><StudentPrimaryButton label="Add first question" Icon={Plus} onPress={() => navigation.navigate('QuestionForm', { mode: 'add', testId: id })} /></View>
                    </AdminCard>
                  ) : <AdminCard style={{ padding: 14 }}><T w="bold" s={13} c={KS.muted}>No questions.</T></AdminCard>}
                </Section>

                <Section label="Danger zone">
                  <View style={{ backgroundColor: KS.redSoft, borderRadius: 18, borderWidth: 1, borderColor: '#F1C9C9', padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><ShieldAlert size={16} color={KS.red} strokeWidth={2.3} /><T w="xbold" s={13.5} c={KS.red}>Delete permanently</T></View>
                    <T w="semi" s={12} c="#9A4A4A" style={{ marginTop: 4, lineHeight: 17 }}>{test.attemptCount > 0 ? 'Blocked — this test has student results. Archive it to keep history.' : "Can't be undone. Prefer Archive."}</T>
                    <View style={{ marginTop: 10 }}><GhostButton label="Delete permanently" icon={Trash2} danger onPress={del} disabled={busy} /></View>
                  </View>
                </Section>
              </Stagger>
            ) : null}
      </ScrollView>

      <ActionSheet visible={more} onClose={() => setMore(false)} title={test?.name} message="Mock test" options={moreOptions} />
      <ActionSheet visible={!!qMenu} onClose={() => setQMenu(null)} title="Question" message={plainText(qMenu?.question)} options={qMenuOptions} />
    </AdminScreen>
  );
}
