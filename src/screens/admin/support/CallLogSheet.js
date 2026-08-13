// src/screens/admin/support/CallLogSheet.js
// Recording an outbound call against a ticket. Same container as ui/ActionSheet — dim
// backdrop, rounded sheet, grab handle — but a form rather than a list of actions.
import React, { useState } from 'react';
import { Modal, View, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';
import { S } from '../../../theme/studentUI';

const OUTCOMES = [
  { k: 'talked', l: 'Baat hui' },
  { k: 'no_answer', l: 'Uthaya nahi' },
  { k: 'callback', l: 'Baad mein call karna hai' },
];

export function CallLogSheet({ visible, onClose, onSubmit }) {
  const insets = useSafeAreaInsets();
  const [outcome, setOutcome] = useState('talked');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onSubmit(outcome, note);
      setNote('');
      onClose();
    } catch (_) {
      // Stays open on purpose, note intact — the screen has already shown the reason. A
      // note written straight after a call is the one thing here nobody can reconstruct.
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
            <T w="black" s={17} c={S.ink} style={{ textAlign: 'center', marginBottom: 14 }}>Call log karein</T>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {OUTCOMES.map((o) => {
                const active = outcome === o.k;
                return (
                  <PressableScale
                    key={o.k}
                    onPress={() => setOutcome(o.k)}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
                      borderColor: active ? S.indigo : S.hair,
                      backgroundColor: active ? S.indigoSoft : '#fff',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={o.l}
                    accessibilityState={active ? { selected: true } : {}}
                  >
                    <T w={active ? 'xbold' : 'semi'} s={12.5} c={active ? S.indigo : S.muted}>{o.l}</T>
                  </PressableScale>
                );
              })}
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Call mein kya hua? (sirf team dekhegi)"
              placeholderTextColor={S.faint}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: S.hair,
                padding: 12, fontSize: 13, color: S.ink, minHeight: 92, textAlignVertical: 'top',
              }}
              accessibilityLabel="Call note"
            />
            <T w="semi" s={11.5} c={S.muted} style={{ marginTop: 6, marginBottom: 12 }}>
              Ye note user ko nahi dikhega — sirf team ke record ke liye hai.
            </T>

            <PressableScale
              onPress={submit}
              disabled={busy}
              style={{
                backgroundColor: S.indigo, borderRadius: 14, paddingVertical: 13,
                alignItems: 'center', opacity: busy ? 0.6 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel="Save call"
            >
              <T w="xbold" s={14} c="#fff">{busy ? 'Save ho raha…' : 'Save call'}</T>
            </PressableScale>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
