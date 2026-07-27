// src/screens/admin/resources/ChapterFormScreen.js
// Create / edit a chapter's structure (name + class). Content (notes/questions) is authored
// elsewhere; a newly-created chapter is empty until content is added.
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createAdminChapter, updateAdminChapter } from '../../../api/adminApi';
import { AdminScreen, AdminHeader, S } from '../ui/kit';
import { apiError } from '../ui/format';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';

const inputStyle = { backgroundColor: S.card, borderWidth: 1.5, borderColor: S.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: S.ink };

export default function ChapterFormScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { mode = 'add', slug, classLevel = null, chapter = null } = route.params || {};
  const isEdit = mode === 'edit';
  const initial = useMemo(() => ({ name: chapter?.name || '', classLevel: (chapter?.classLevel ?? classLevel) != null ? String(chapter?.classLevel ?? classLevel) : '' }), [chapter, classLevel]);
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const nameError = touched && !form.name.trim() ? 'A chapter name is required.' : null;
  const classError = touched && !form.classLevel.trim() ? 'A class is required.' : null;

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!dirty || savedRef.current || saving) return;
      e.preventDefault();
      Alert.alert('Discard changes?', 'Your edits will be lost.', [{ text: 'Keep editing', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) }]);
    });
    return unsub;
  }, [navigation, dirty, saving]);

  const save = async () => {
    setTouched(true);
    if (!form.name.trim() || !form.classLevel.trim() || saving) return;
    const body = { name: form.name.trim(), classLevel: parseInt(form.classLevel, 10) };
    setSaving(true);
    try {
      if (isEdit) await updateAdminChapter(chapter.id, body); else await createAdminChapter(slug, body);
      savedRef.current = true; navigation.goBack();
    } catch (e) {
      const dup = e?.response?.status === 409 && /slug|exists/i.test(e?.response?.data?.error || '');
      Alert.alert(dup ? 'Name already used' : 'Could not save', dup ? 'A chapter with this name already exists in this class.' : apiError(e));
    } finally { setSaving(false); }
  };

  return (
    <AdminScreen>
      <AdminHeader title={isEdit ? 'Edit chapter' : 'New chapter'} subtitle={isEdit ? 'Update details' : 'Structure only'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', gap: 3, marginBottom: 7 }}><T w="xbold" s={12.5} c={S.sub}>Chapter name</T><T w="xbold" s={12.5} c={S.red}>*</T></View>
          <TextInput style={[inputStyle, nameError && { borderColor: S.red }]} value={form.name} onChangeText={set('name')} placeholder="e.g. Trigonometry" placeholderTextColor={S.faint} onBlur={() => setTouched(true)} />
          {nameError ? <T w="semi" s={11.5} c={S.red} style={{ marginTop: 5 }}>{nameError}</T> : null}

          <View style={{ flexDirection: 'row', gap: 3, marginTop: 18, marginBottom: 7 }}><T w="xbold" s={12.5} c={S.sub}>Class</T><T w="xbold" s={12.5} c={S.red}>*</T></View>
          <TextInput style={[inputStyle, { width: 120 }, classError && { borderColor: S.red }]} value={form.classLevel} onChangeText={(v) => set('classLevel')(v.replace(/[^0-9]/g, ''))} placeholder="10" placeholderTextColor={S.faint} keyboardType="number-pad" />
          {classError ? <T w="semi" s={11.5} c={S.red} style={{ marginTop: 5 }}>{classError}</T> : null}

          <T w="med" s={11.5} c={S.faint} style={{ marginTop: 16, lineHeight: 17 }}>A new chapter is empty until its content (notes, questions) is added — it won't appear to students until then.</T>
        </ScrollView>
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: S.hair, backgroundColor: S.canvas }}>
          <PressableScale onPress={save} disabled={saving} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: S.indigo, borderRadius: 16, paddingVertical: 16, opacity: saving ? 0.6 : 1 }} accessibilityLabel={isEdit ? 'Save chapter' : 'Create chapter'}>
            {saving ? <ActivityIndicator color="#fff" /> : <T w="bold" s={15} c="#fff">{isEdit ? 'Save changes' : 'Create chapter'}</T>}
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </AdminScreen>
  );
}
