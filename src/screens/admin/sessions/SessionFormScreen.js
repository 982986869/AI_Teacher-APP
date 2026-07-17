// src/screens/admin/sessions/SessionFormScreen.js
// Create / edit a session — real POST/PATCH /api/admin/sessions. Native keyboard-aware
// form with validation and an unsaved-changes guard. Date + time are entered as text
// (YYYY-MM-DD / HH:MM) to stay dependency-free; combined to an ISO instant on save.
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createAdminSession, updateAdminSession } from '../../../api/adminApi';
import { AdminScreen, AdminHeader, AdminSegmented, S } from '../ui/kit';
import { apiError } from '../ui/format';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';

const inputStyle = { backgroundColor: S.card, borderWidth: 1.5, borderColor: S.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: S.ink };
const pad = (n) => String(n).padStart(2, '0');

function Field({ label, required, error, helper, children }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 7 }}>
        <T w="xbold" s={12.5} c={S.sub}>{label}</T>{required ? <T w="xbold" s={12.5} c={S.red}>*</T> : null}
      </View>
      {children}
      {error ? <T w="semi" s={11.5} c={S.red} style={{ marginTop: 5 }}>{error}</T> : helper ? <T w="med" s={11.5} c={S.faint} style={{ marginTop: 5 }}>{helper}</T> : null}
    </View>
  );
}

export default function SessionFormScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { mode = 'add', session = null } = route.params || {};
  const isEdit = mode === 'edit';

  const initial = useMemo(() => {
    const d = session?.startsAt ? new Date(session.startsAt) : null;
    return {
      title: session?.title || '', subject: session?.subject || '', classLevel: session?.classLevel ? String(session.classLevel) : '',
      chapter: session?.chapter || '', teacherName: session?.teacherName || '',
      date: d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '',
      time: d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '',
      durationMin: session?.durationMin ? String(session.durationMin) : '60',
      mode: session?.mode || 'online', meetingLink: session?.meetingLink || '', location: session?.location || '',
      capacity: session?.capacity ? String(session.capacity) : '', description: session?.description || '',
    };
  }, [session]);

  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const nameError = touched && !form.title.trim() ? 'A title is required.' : null;
  const whenError = touched && (!form.date.trim() || !form.time.trim()) ? 'Add a date and time.' : (touched && Number.isNaN(new Date(`${form.date}T${form.time}`).getTime()) ? 'Use YYYY-MM-DD and HH:MM.' : null);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!dirty || savedRef.current || saving) return;
      e.preventDefault();
      Alert.alert('Discard changes?', 'Your edits will be lost.', [
        { text: 'Keep editing', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsub;
  }, [navigation, dirty, saving]);

  const save = async () => {
    setTouched(true);
    const when = new Date(`${form.date}T${form.time}`);
    if (!form.title.trim() || !form.date.trim() || !form.time.trim() || Number.isNaN(when.getTime()) || saving) return;
    const body = {
      title: form.title.trim(), subject: form.subject.trim(), chapter: form.chapter.trim(),
      classLevel: form.classLevel.trim() ? parseInt(form.classLevel, 10) : null, teacherName: form.teacherName.trim(),
      startsAt: when.toISOString(), durationMin: parseInt(form.durationMin, 10) || 60, mode: form.mode,
      meetingLink: form.mode === 'online' ? form.meetingLink.trim() : '', location: form.mode === 'offline' ? form.location.trim() : '',
      capacity: form.capacity.trim() ? parseInt(form.capacity, 10) : null, description: form.description.trim(),
    };
    setSaving(true);
    try {
      if (isEdit) await updateAdminSession(session.id, body); else await createAdminSession(body);
      savedRef.current = true; navigation.goBack();
    } catch (e) { Alert.alert('Could not save', apiError(e)); }
    finally { setSaving(false); }
  };

  return (
    <AdminScreen>
      <AdminHeader title={isEdit ? 'Edit session' : 'New session'} subtitle={isEdit ? 'Update details' : 'Appears in students\' Sessions'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <Field label="Session title" required error={nameError}>
            <TextInput style={[inputStyle, nameError && { borderColor: S.red }]} value={form.title} onChangeText={set('title')} placeholder="e.g. Trigonometry doubt-solving" placeholderTextColor={S.faint} onBlur={() => setTouched(true)} />
          </Field>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="Subject"><TextInput style={inputStyle} value={form.subject} onChangeText={set('subject')} placeholder="Mathematics" placeholderTextColor={S.faint} /></Field></View>
            <View style={{ width: 110 }}><Field label="Class" helper="Blank = all"><TextInput style={inputStyle} value={form.classLevel} onChangeText={(v) => set('classLevel')(v.replace(/[^0-9]/g, ''))} placeholder="10" placeholderTextColor={S.faint} keyboardType="number-pad" /></Field></View>
          </View>
          <Field label="Chapter / topic"><TextInput style={inputStyle} value={form.chapter} onChangeText={set('chapter')} placeholder="Optional" placeholderTextColor={S.faint} /></Field>
          <Field label="Teacher"><TextInput style={inputStyle} value={form.teacherName} onChangeText={set('teacherName')} placeholder="Who's taking it?" placeholderTextColor={S.faint} /></Field>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1.4 }}><Field label="Date" required error={whenError}><TextInput style={[inputStyle, whenError && { borderColor: S.red }]} value={form.date} onChangeText={set('date')} placeholder="2026-07-20" placeholderTextColor={S.faint} /></Field></View>
            <View style={{ flex: 1 }}><Field label="Start time" required><TextInput style={[inputStyle, whenError && { borderColor: S.red }]} value={form.time} onChangeText={set('time')} placeholder="16:30" placeholderTextColor={S.faint} /></Field></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="Duration (min)"><TextInput style={inputStyle} value={form.durationMin} onChangeText={(v) => set('durationMin')(v.replace(/[^0-9]/g, ''))} placeholder="60" placeholderTextColor={S.faint} keyboardType="number-pad" /></Field></View>
            <View style={{ flex: 1 }}><Field label="Capacity" helper="Optional"><TextInput style={inputStyle} value={form.capacity} onChangeText={(v) => set('capacity')(v.replace(/[^0-9]/g, ''))} placeholder="—" placeholderTextColor={S.faint} keyboardType="number-pad" /></Field></View>
          </View>
          <Field label="Mode"><AdminSegmented value={form.mode} onChange={set('mode')} options={[{ value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' }]} /></Field>
          {form.mode === 'online'
            ? <Field label="Meeting link"><TextInput style={inputStyle} value={form.meetingLink} onChangeText={set('meetingLink')} placeholder="https://meet…" placeholderTextColor={S.faint} autoCapitalize="none" /></Field>
            : <Field label="Location"><TextInput style={inputStyle} value={form.location} onChangeText={set('location')} placeholder="Centre / room" placeholderTextColor={S.faint} /></Field>}
          <Field label="Description"><TextInput style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} value={form.description} onChangeText={set('description')} placeholder="Optional notes for students" placeholderTextColor={S.faint} multiline /></Field>
        </ScrollView>
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: S.hair, backgroundColor: S.canvas }}>
          <PressableScale onPress={save} disabled={saving} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: S.indigo, borderRadius: 16, paddingVertical: 16, opacity: saving ? 0.6 : 1 }} accessibilityRole="button" accessibilityLabel={isEdit ? 'Save session' : 'Create session'}>
            {saving ? <ActivityIndicator color="#fff" /> : <T w="bold" s={15} c="#fff">{isEdit ? 'Save changes' : 'Create session'}</T>}
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </AdminScreen>
  );
}
