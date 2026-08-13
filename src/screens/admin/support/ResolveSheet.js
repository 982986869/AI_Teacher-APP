// src/screens/admin/support/ResolveSheet.js
// Proposing a resolution. Staff never close a ticket outright — this moves it to
// pending_confirmation and the summary typed here is what the user reads.
import React, { useState } from 'react';
import { Modal, View, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';
import { S } from '../../../theme/studentUI';

export function ResolveSheet({ visible, onClose, onSubmit }) {
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = !!summary.trim();

  async function submit() {
    if (!ready) return;
    setBusy(true);
    try {
      await onSubmit(summary.trim());
      setSummary('');
      onClose();
    } catch (_) {
      // Deliberately stays open with the summary still in the box. Closing here would
      // throw away what was typed AND leave the ticket looking resolved when the PATCH
      // was refused. Only the success path above clears and closes.
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(21,24,41,0.42)', justifyContent: 'flex-end' }}
          onPress={onClose}
          accessibilityLabel="Dismiss"
        >
          <Pressable
            style={{
              backgroundColor: S.canvas, borderTopLeftRadius: 26, borderTopRightRadius: 26,
              paddingBottom: insets.bottom + 14, paddingTop: 8, paddingHorizontal: 18,
            }}
            onPress={() => {}}
          >
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: S.hair, alignSelf: 'center', marginVertical: 8 }} />
            <T w="black" s={17} c={S.ink} style={{ textAlign: 'center' }}>Issue resolved mark karein</T>
            <T w="semi" s={12.5} c={S.muted} style={{ textAlign: 'center', marginTop: 6, marginBottom: 14, lineHeight: 18 }}>
              Ye summary user ko dikhegi. Ticket abhi band nahi hoga — user confirm karega,
              ya 3 din baad apne aap band ho jayega.
            </T>

            <TextInput
              value={summary}
              onChangeText={setSummary}
              placeholder="Kya kiya? e.g. Refund process kar diya, 3-4 din mein aa jayega."
              placeholderTextColor={S.faint}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: S.hair,
                padding: 12, fontSize: 13, color: S.ink, minHeight: 92, textAlignVertical: 'top',
              }}
              accessibilityLabel="Resolution summary"
            />

            <PressableScale
              onPress={submit}
              disabled={busy || !ready}
              style={{
                marginTop: 14, backgroundColor: ready ? S.emerald : S.hair, borderRadius: 14,
                paddingVertical: 13, alignItems: 'center', opacity: busy ? 0.6 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel="Mark resolved"
            >
              <T w="xbold" s={14} c={ready ? '#fff' : S.faint}>{busy ? 'Save ho raha…' : 'Mark resolved'}</T>
            </PressableScale>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
