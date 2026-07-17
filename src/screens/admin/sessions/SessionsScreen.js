// src/screens/admin/sessions/SessionsScreen.js
// Admin Sessions — mirrors the Student Sessions tab, but shows ALL sessions and manages
// them. Grouped into Today / Upcoming / Completed / Cancelled. Real data; every action
// hits the sessions API and is reflected on the Student side.
import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Plus, CalendarDays, Video, MapPin, Clock3, User, Pencil, CalendarClock, Ban, RotateCcw,
  CircleCheck, Copy, Trash2, Archive,
} from 'lucide-react-native';
import { getAdminSessions, setAdminSessionStatus, deleteAdminSession, createAdminSession } from '../../../api/adminApi';
import { T } from '../../parent/ParentApp/constants';
import { S, shadow, StudentScreenHeader, StudentSectionHeader, StudentErrorState, StudentPrimaryButton, StudentSkeleton } from '../../../theme/studentUI';
import { FadeInOnce, PressableScale, Float, Breathe } from '../../parent/ParentApp/anim';
import { ActionSheet } from '../ui/ActionSheet';
import { UndoToast } from '../ui/UndoToast';
import { apiError } from '../ui/format';
import Fab from '../../../components/Fab';
import { useBottomPad } from '../../../theme/layout';

const fmtWhen = (iso) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
};
const isSameDay = (iso) => { const d = new Date(iso); const n = new Date(); return d.toDateString() === n.toDateString(); };
const STATUS_TONE = { scheduled: S.blue, completed: S.emerald, cancelled: S.red, archived: S.faint };

function SessionCard({ s, onPress }) {
  return (
    <PressableScale onPress={onPress} style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: S.hair, padding: 15, marginBottom: 10, ...shadow }} accessibilityLabel={s.title}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: s.mode === 'offline' ? S.orangeSoft : S.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
          {s.mode === 'offline' ? <MapPin size={20} color={S.orange} strokeWidth={2.4} /> : <Video size={20} color={S.blue} strokeWidth={2.4} />}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w="xbold" s={14.5} c={S.ink} numberOfLines={1}>{s.title}</T>
          <T w="semi" s={12} c={S.muted} numberOfLines={1} style={{ marginTop: 1 }}>
            {[s.subject, s.classLevel ? `Class ${s.classLevel}` : null].filter(Boolean).join(' · ') || 'All classes'}
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><CalendarDays size={13} color={S.faint} strokeWidth={2.4} /><T w="bold" s={11.5} c={S.sub}>{fmtWhen(s.startsAt)}</T></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Clock3 size={13} color={S.faint} strokeWidth={2.4} /><T w="bold" s={11.5} c={S.sub}>{s.durationMin} min</T></View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <User size={12} color={S.faint} strokeWidth={2.4} />
            <T w="semi" s={11.5} c={s.teacherName ? S.muted : S.orange}>{s.teacherName || 'No teacher assigned'}</T>
            <View style={{ marginLeft: 'auto', backgroundColor: STATUS_TONE[s.status] + '1f', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <T w="xbold" s={10} c={STATUS_TONE[s.status]} style={{ textTransform: 'capitalize' }}>{s.status}</T>
            </View>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

export default function AdminSessionsScreen({ navigation }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sheet, setSheet] = useState(null); // session for the action sheet
  const [toast, setToast] = useState(null);
  const bottomPad = useBottomPad({ fab: true });

  const load = useCallback(async () => {
    setError(false);
    try { const d = await getAdminSessions(); setRows(d?.rows || []); }
    catch (_) { setError(true); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const groups = {
    Today: rows.filter((s) => s.status === 'scheduled' && isSameDay(s.startsAt)),
    Upcoming: rows.filter((s) => s.status === 'scheduled' && !isSameDay(s.startsAt) && new Date(s.startsAt) >= new Date()),
    Completed: rows.filter((s) => s.status === 'completed'),
    Cancelled: rows.filter((s) => s.status === 'cancelled'),
    Archived: rows.filter((s) => s.status === 'archived'),
  };
  const order = ['Today', 'Upcoming', 'Completed', 'Cancelled', 'Archived'];
  const accent = { Today: S.emerald, Upcoming: S.blue, Completed: S.indigo, Cancelled: S.red, Archived: S.faint };

  const act = async (fn, undoMsg, onUndo) => {
    try { await fn(); await load(); if (undoMsg) setToast({ message: undoMsg, onUndo }); }
    catch (e) { Alert.alert('Could not complete', apiError(e)); }
  };
  const goEdit = (s) => navigation.navigate('SessionForm', { mode: 'edit', session: s });
  const duplicate = (s) => act(async () => {
    await createAdminSession({ title: `${s.title} (copy)`, subject: s.subject, chapter: s.chapter, classLevel: s.classLevel, board: s.board, teacherName: s.teacherName, startsAt: s.startsAt, durationMin: s.durationMin, mode: s.mode, meetingLink: s.meetingLink, location: s.location, capacity: s.capacity, description: s.description });
  });
  const remove = (s) => Alert.alert('Remove session?', 'It will no longer appear in schedules. Attendance history is kept.',
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => act(() => deleteAdminSession(s.id)) }]);

  const sheetOptions = (s) => s ? [
    { key: 'edit', label: 'Edit session', icon: Pencil, tone: 'indigo', onPress: () => goEdit(s) },
    s.status === 'scheduled' ? { key: 'resched', label: 'Reschedule', icon: CalendarClock, tone: 'blue', onPress: () => goEdit(s) } : null,
    { key: 'dup', label: 'Duplicate', icon: Copy, tone: 'blue', onPress: () => duplicate(s) },
    s.status === 'scheduled' ? { key: 'complete', label: 'Mark completed', icon: CircleCheck, tone: 'emerald', onPress: () => act(() => setAdminSessionStatus(s.id, 'completed')) } : null,
    (s.status === 'cancelled' || s.status === 'archived')
      ? { key: 'restore', label: 'Restore session', icon: RotateCcw, tone: 'emerald', onPress: () => act(() => setAdminSessionStatus(s.id, 'scheduled')) }
      : { key: 'cancel', label: 'Cancel session', icon: Ban, tone: 'orange', onPress: () => act(() => setAdminSessionStatus(s.id, 'cancelled'), 'Session cancelled', () => act(() => setAdminSessionStatus(s.id, 'scheduled'))) },
    s.status !== 'archived' ? { key: 'archive', label: 'Archive', icon: Archive, tone: 'gold', onPress: () => act(() => setAdminSessionStatus(s.id, 'archived'), 'Session archived', () => act(() => setAdminSessionStatus(s.id, 'scheduled'))) } : null,
    { key: 'remove', label: 'Delete', icon: Trash2, danger: true, onPress: () => remove(s) },
  ].filter(Boolean) : [];

  return (
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <StudentScreenHeader title="Sessions" subtitle="Live 1:1 & group classes" />

      <ScrollView style={{ flex: 1, paddingHorizontal: 18 }} contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 6 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={S.indigo} />}>
        {loading && !rows.length ? (
          <View style={{ paddingTop: 8 }}>{[0, 1, 2].map((i) => <StudentSkeleton key={i} w="100%" h={104} r={18} mb={10} />)}</View>
        ) : error ? (
          <StudentErrorState title="Couldn't load sessions" onRetry={load} />
        ) : !rows.length ? (
          <FadeInOnce id="sess-empty" delay={40} y={14}>
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
              <Float><Breathe><View style={{ width: 76, height: 76, borderRadius: 26, backgroundColor: S.blueSoft, alignItems: 'center', justifyContent: 'center' }}><CalendarDays size={34} color={S.blue} strokeWidth={2.2} /></View></Breathe></Float>
              <T w="black" s={18} c={S.ink}>No sessions yet</T>
              <T w="semi" s={13} c={S.muted} style={{ textAlign: 'center', maxWidth: 280, lineHeight: 19 }}>Add your first session — it'll appear in students' Sessions tab the moment you save.</T>
              <StudentPrimaryButton label="Add Session" Icon={Plus} onPress={() => navigation.navigate('SessionForm', { mode: 'add' })} style={{ marginTop: 6, paddingHorizontal: 24 }} />
            </View>
          </FadeInOnce>
        ) : (
          order.filter((g) => groups[g].length).map((g) => (
            <View key={g}>
              <StudentSectionHeader title={g} accent={accent[g]} sub={`${groups[g].length}`} />
              {groups[g].map((s) => <SessionCard key={s.id} s={s} onPress={() => setSheet(s)} />)}
            </View>
          ))
        )}
      </ScrollView>

      {/* Duplicate-action rule: empty list shows the centered CTA only; a non-empty list shows
          the FAB only. Never both at once. */}
      {rows.length > 0 && (
        <Fab onPress={() => navigation.navigate('SessionForm', { mode: 'add' })} accessibilityLabel="Add session" />
      )}

      <ActionSheet visible={!!sheet} onClose={() => setSheet(null)} title={sheet?.title} message={sheet ? fmtWhen(sheet.startsAt) : ''} options={sheetOptions(sheet)} />
      <UndoToast visible={!!toast} message={toast?.message || ''} onAction={toast?.onUndo ? () => { const u = toast.onUndo; setToast(null); u(); } : undefined} onHide={() => setToast(null)} />
    </View>
  );
}
