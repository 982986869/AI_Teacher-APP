// src/screens/admin/learning/NodeFormScreen.js
// Create / edit a content node — real POST/PATCH /api/admin/cms/nodes. Native mobile form
// (labels, helper text, required markers, segmented controls), keyboard-aware, with an
// unsaved-changes guard on back and inline validation. New nodes are created as drafts;
// publishing happens from the detail screen.
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createCmsNode, updateCmsNode } from '../../../api/adminApi';
import { AdminScreen, AdminHeader, AdminSegmented, S } from '../ui/kit';
import { apiError } from '../ui/format';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';
import { LEVEL_LABEL } from './levels';

const inputStyle = { backgroundColor: S.card, borderWidth: 1.5, borderColor: S.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: S.ink };

function Field({ label, required, error, helper, children }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 7 }}>
        <T w="xbold" s={12.5} c={S.sub}>{label}</T>
        {required ? <T w="xbold" s={12.5} c={S.red}>*</T> : null}
      </View>
      {children}
      {error
        ? <T w="semi" s={11.5} c={S.red} style={{ marginTop: 5 }}>{error}</T>
        : helper ? <T w="med" s={11.5} c={S.faint} style={{ marginTop: 5 }}>{helper}</T> : null}
    </View>
  );
}

export default function NodeFormScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { mode = 'add', parentId = null, childLevel = 'board', id = null, node = null } = route.params || {};
  const isEdit = mode === 'edit';
  const levelLabel = isEdit ? LEVEL_LABEL[node?.level] || 'item' : LEVEL_LABEL[childLevel] || 'item';

  const initial = useMemo(() => ({
    name: node?.name || '',
    description: node?.description || '',
    difficulty: node?.difficulty || '',
    duration: node?.estimatedDuration ? String(node.estimatedDuration) : '',
    icon: node?.icon || '',
    tags: (node?.tags || []).join(', '),
    visibility: node?.visibility || 'visible',
  }), [node]);

  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const nameError = touched && !form.name.trim() ? 'A name is required.' : null;

  // Unsaved-changes guard — catches Android back, gesture back, and the header back.
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!dirty || savedRef.current || saving) return;
      e.preventDefault();
      Alert.alert('Discard changes?', 'Your edits will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsub;
  }, [navigation, dirty, saving]);

  const save = async () => {
    setTouched(true);
    if (!form.name.trim() || saving) return;
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const duration = form.duration.trim() ? parseInt(form.duration, 10) : undefined;
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      visibility: form.visibility,
      tags,
      icon: form.icon.trim() || undefined,
      ...(form.difficulty ? { difficulty: form.difficulty } : {}),
      ...(Number.isFinite(duration) ? { estimatedDuration: duration } : {}),
    };
    setSaving(true);
    try {
      if (isEdit) await updateCmsNode(id, { ...body, expectedLockVersion: node?.lockVersion });
      else await createCmsNode({ ...body, parentId });
      savedRef.current = true;
      navigation.goBack();
    } catch (e) {
      // The server returns 409 for these (code field may be absent) — detect by code or message.
      const msg = e?.response?.data?.error || '';
      const code = e?.response?.data?.code;
      const isDup = code === 'DUPLICATE_SLUG' || /already exists|slug/i.test(msg);
      const isConflict = code === 'VERSION_CONFLICT' || /changed by someone|reload/i.test(msg);
      Alert.alert(
        isDup ? 'Name already used' : isConflict ? 'Edited elsewhere' : 'Could not save',
        isDup ? 'Another item here already uses this name. Try a different one.'
          : isConflict ? 'This item changed since you opened it. Go back and reopen to get the latest.'
            : apiError(e),
      );
    } finally { setSaving(false); }
  };

  return (
    <AdminScreen>
      <AdminHeader title={isEdit ? `Edit ${levelLabel.toLowerCase()}` : `New ${levelLabel.toLowerCase()}`} subtitle={isEdit ? 'Update details' : 'Saved as a draft'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <Field label="Name" required error={nameError} helper={`What this ${levelLabel.toLowerCase()} is called`}>
            <TextInput style={[inputStyle, nameError && { borderColor: S.red }]} value={form.name} onChangeText={set('name')}
              placeholder={`e.g. ${levelLabel} name`} placeholderTextColor={S.faint} onBlur={() => setTouched(true)} returnKeyType="next" accessibilityLabel="Name" />
          </Field>

          <Field label="Description" helper="A short summary (optional)">
            <TextInput style={[inputStyle, { minHeight: 92, textAlignVertical: 'top' }]} value={form.description} onChangeText={set('description')}
              placeholder="What will students learn here?" placeholderTextColor={S.faint} multiline accessibilityLabel="Description" />
          </Field>

          <Field label="Difficulty" helper="Optional">
            <AdminSegmented value={form.difficulty} onChange={set('difficulty')}
              options={[{ value: '', label: 'None' }, { value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} />
          </Field>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Duration (min)" helper="Optional">
                <TextInput style={inputStyle} value={form.duration} onChangeText={(v) => set('duration')(v.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 20" placeholderTextColor={S.faint} keyboardType="number-pad" accessibilityLabel="Duration in minutes" />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Icon" helper="Emoji (optional)">
                <TextInput style={inputStyle} value={form.icon} onChangeText={set('icon')} placeholder="📘" placeholderTextColor={S.faint} maxLength={4} accessibilityLabel="Icon" />
              </Field>
            </View>
          </View>

          <Field label="Tags" helper="Comma-separated (optional)">
            <TextInput style={inputStyle} value={form.tags} onChangeText={set('tags')} placeholder="algebra, ncert" placeholderTextColor={S.faint} autoCapitalize="none" accessibilityLabel="Tags" />
          </Field>

          <Field label="Visibility" helper="Hidden items never reach students, even if published">
            <AdminSegmented value={form.visibility} onChange={set('visibility')}
              options={[{ value: 'visible', label: 'Visible' }, { value: 'hidden', label: 'Hidden' }]} />
          </Field>
        </ScrollView>

        {/* Sticky save */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: S.hair, backgroundColor: S.canvas }}>
          <PressableScale onPress={save} disabled={saving || (touched && !form.name.trim())}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: S.indigo, borderRadius: 16, paddingVertical: 16, opacity: saving || (touched && !form.name.trim()) ? 0.55 : 1 }}
            accessibilityRole="button" accessibilityLabel={isEdit ? 'Save changes' : `Create ${levelLabel}`}>
            {saving ? <ActivityIndicator color="#fff" /> : <T w="bold" s={15} c="#fff">{isEdit ? 'Save changes' : `Create ${levelLabel.toLowerCase()}`}</T>}
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </AdminScreen>
  );
}
