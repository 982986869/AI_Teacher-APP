// src/screens/admin/tests/TestFormScreen.js
// Create / edit a mock test's details + rules. Questions are managed from the detail screen.
// Keyboard-aware, validated, unsaved-guard. New tests are drafts; publish from detail.
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createAdminTest, updateAdminTest, setAdminTestStatus } from '../../../api/adminApi';
import { AdminScreen, AdminHeader, AdminSegmented, Section, S } from '../ui/kit';
import { apiError } from '../ui/format';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';

const inputStyle = { backgroundColor: S.card, borderWidth: 1.5, borderColor: S.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: S.ink };
function Field({ label, required, error, helper, children }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', gap: 3, marginBottom: 7 }}><T w="xbold" s={12.5} c={S.sub}>{label}</T>{required ? <T w="xbold" s={12.5} c={S.red}>*</T> : null}</View>
      {children}
      {error ? <T w="semi" s={11.5} c={S.red} style={{ marginTop: 5 }}>{error}</T> : helper ? <T w="med" s={11.5} c={S.faint} style={{ marginTop: 5 }}>{helper}</T> : null}
    </View>
  );
}

export default function TestFormScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { mode = 'add', test = null, subject: presetSubject = null, classLevel: presetClass = null } = route.params || {};
  const isEdit = mode === 'edit';
  // On add, carry the class + subject the admin was browsing so they aren't re-entered.
  const initial = useMemo(() => ({
    name: test?.name || '',
    subject: test?.subject || presetSubject || '',
    classLevel: test?.classLevel ? String(test.classLevel) : (presetClass != null ? String(presetClass) : ''),
    board: test?.board || '', chapter: test?.chapter || '', difficulty: test?.difficulty || '',
    durationMin: test?.durationMin ? String(test.durationMin) : '30', instruction: test?.instruction || '',
  }), [test, presetSubject, presetClass]);
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const nameError = touched && !form.name.trim() ? 'A title is required.' : null;

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!dirty || savedRef.current || saving) return;
      e.preventDefault();
      Alert.alert('Discard changes?', 'Your edits will be lost.', [{ text: 'Keep editing', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) }]);
    });
    return unsub;
  }, [navigation, dirty, saving]);

  // publish=false → Save Draft (new: opens the test's Questions to fill in; edit: just saves).
  // publish=true  → also flip status to published (needs ≥1 question — the server enforces it;
  // for a brand-new empty test we land on Questions with a prompt instead of failing loudly).
  const save = async (publish) => {
    setTouched(true);
    if (!form.name.trim() || saving) return;
    const body = { name: form.name.trim(), subject: form.subject.trim(), classLevel: form.classLevel.trim() ? parseInt(form.classLevel, 10) : null, board: form.board.trim(), chapter: form.chapter.trim(), difficulty: form.difficulty || null, durationMin: parseInt(form.durationMin, 10) || 30, instruction: form.instruction.trim() };
    setSaving(true);
    try {
      let testId = test?.id;
      if (isEdit) await updateAdminTest(test.id, body);
      else { const r = await createAdminTest(body); testId = r?.test?.id; }
      savedRef.current = true;

      if (publish && testId) {
        try {
          await setAdminTestStatus(testId, 'published');
          navigation.goBack();
        } catch (e) {
          // Most commonly: no questions yet → send them into the Questions screen to add some.
          if (!isEdit) { navigation.replace('TestDetail', { id: testId }); Alert.alert('Add questions to publish', 'Your draft is saved. Add at least one question, then tap Publish.'); }
          else Alert.alert('Could not publish', apiError(e));
        }
      } else if (!isEdit && testId) {
        navigation.replace('TestDetail', { id: testId }); // new draft → go straight to its Questions
      } else {
        navigation.goBack();
      }
    } catch (e) { Alert.alert('Could not save', apiError(e)); }
    finally { setSaving(false); }
  };

  return (
    <AdminScreen>
      <AdminHeader title={isEdit ? 'Edit test' : 'New mock test'} subtitle={isEdit ? 'Update details' : 'Saved as a draft'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <Section label="Basic details">
            <Field label="Title" required error={nameError}><TextInput style={[inputStyle, nameError && { borderColor: S.red }]} value={form.name} onChangeText={set('name')} placeholder="e.g. Physics Full Mock 1" placeholderTextColor={S.faint} onBlur={() => setTouched(true)} /></Field>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}><Field label="Subject"><TextInput style={inputStyle} value={form.subject} onChangeText={set('subject')} placeholder="Physics" placeholderTextColor={S.faint} /></Field></View>
              <View style={{ width: 110 }}><Field label="Class"><TextInput style={inputStyle} value={form.classLevel} onChangeText={(v) => set('classLevel')(v.replace(/[^0-9]/g, ''))} placeholder="11" placeholderTextColor={S.faint} keyboardType="number-pad" /></Field></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}><Field label="Board"><TextInput style={inputStyle} value={form.board} onChangeText={set('board')} placeholder="CBSE" placeholderTextColor={S.faint} /></Field></View>
              <View style={{ flex: 1 }}><Field label="Chapter"><TextInput style={inputStyle} value={form.chapter} onChangeText={set('chapter')} placeholder="Optional" placeholderTextColor={S.faint} /></Field></View>
            </View>
            <Field label="Difficulty"><AdminSegmented value={form.difficulty} onChange={set('difficulty')} options={[{ value: '', label: 'None' }, { value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} /></Field>
          </Section>
          <Section label="Rules">
            <Field label="Duration (min)"><TextInput style={inputStyle} value={form.durationMin} onChangeText={(v) => set('durationMin')(v.replace(/[^0-9]/g, ''))} placeholder="30" placeholderTextColor={S.faint} keyboardType="number-pad" /></Field>
            <Field label="Instructions" helper="Marking is 1 per correct, no negative (mock scoring)."><TextInput style={[inputStyle, { minHeight: 90, textAlignVertical: 'top' }]} value={form.instruction} onChangeText={set('instruction')} placeholder="Shown before the test starts" placeholderTextColor={S.faint} multiline /></Field>
          </Section>
        </ScrollView>
        {/* Plain Pressable + plain Text (raw fontWeight) so the labels ALWAYS render — no
            PressableScale/animated-view or custom font that could show a blank coloured pill. */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: S.hair, backgroundColor: S.canvas }}>
          <Pressable onPress={() => save(false)} disabled={saving} accessibilityRole="button" accessibilityLabel={isEdit ? 'Save changes' : 'Save draft'}
            style={{ flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: S.border, borderRadius: 16, opacity: saving ? 0.6 : 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: S.ink }}>{isEdit ? 'Save changes' : 'Save Draft'}</Text>
          </Pressable>
          <Pressable onPress={() => save(true)} disabled={saving} accessibilityRole="button" accessibilityLabel="Publish"
            style={{ flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: S.indigo, borderRadius: 16, opacity: saving ? 0.6 : 1 }}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Publish</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </AdminScreen>
  );
}
