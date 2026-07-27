// src/components/NamePrompt.js
// A small native name-entry sheet (create / rename) — used across Admin Mode instead of the
// iOS-only Alert.prompt, so create/rename flows are a consistent bottom-sheet on every OS.
// Keeps forms off separate pages for simple single-field entry.
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { S, shadowSm } from '../theme/studentUI';
import { FONT } from '../constants/fonts';
import { T } from '../screens/parent/ParentApp/constants';

export default function NamePrompt({ visible, title, message, placeholder = 'Name', initialValue = '', saveLabel = 'Save', onSubmit, onClose }) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) { setValue(initialValue); setSaving(false); } }, [visible, initialValue]);

  const submit = async () => {
    const v = value.trim();
    if (!v || saving) return;
    setSaving(true);
    try { await onSubmit(v); } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(21,24,41,0.42)', justifyContent: 'flex-end' }} onPress={onClose} accessibilityLabel="Dismiss">
          <Pressable style={{ backgroundColor: S.canvas, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 10, paddingBottom: insets.bottom + 16 }} onPress={() => {}}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: S.border, alignSelf: 'center', marginBottom: 14 }} />
            <T w="black" s={18} c={S.ink}>{title}</T>
            {message ? <T w="semi" s={12.5} c={S.muted} style={{ marginTop: 3, lineHeight: 18 }}>{message}</T> : null}
            <TextInput
              autoFocus
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              placeholderTextColor={S.faint}
              onSubmitEditing={submit}
              returnKeyType="done"
              style={{ marginTop: 14, backgroundColor: S.card, borderWidth: 1.5, borderColor: S.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontFamily: FONT.semibold, fontSize: 15, color: S.ink }}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable onPress={onClose} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: S.card, borderWidth: 1.5, borderColor: S.border, borderRadius: 14, paddingVertical: 14 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: S.muted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={submit} disabled={saving || !value.trim()} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: S.indigo, borderRadius: 14, paddingVertical: 14, opacity: saving || !value.trim() ? 0.6 : 1 }}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#fff' }}>{saveLabel}</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
