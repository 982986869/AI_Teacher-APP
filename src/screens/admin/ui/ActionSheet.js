// src/screens/admin/ui/ActionSheet.js
// A native bottom-sheet menu for secondary/destructive actions — the "More" menu and
// context menus. Keeps cards clean (one primary action visible, the rest tucked in here).
import React from 'react';
import { Modal, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { S, IconChip } from './kit';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';

export function ActionSheet({ visible, onClose, title, message, options = [] }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(21,24,41,0.42)', justifyContent: 'flex-end' }} onPress={onClose} accessibilityLabel="Dismiss menu">
        <Pressable style={{ backgroundColor: S.canvas, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: insets.bottom + 10, paddingTop: 8 }} onPress={() => {}}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: S.border, alignSelf: 'center', marginVertical: 8 }} />
          {title ? <T w="black" s={17} c={S.ink} style={{ textAlign: 'center', marginTop: 4 }}>{title}</T> : null}
          {message ? <T w="semi" s={12.5} c={S.muted} style={{ textAlign: 'center', marginTop: 4, paddingHorizontal: 24, lineHeight: 18 }}>{message}</T> : null}
          <View style={{ padding: 14, gap: 8 }}>
            {options.filter(Boolean).map((o) => (
              <PressableScale key={o.key || o.label} disabled={o.disabled}
                onPress={() => { onClose(); setTimeout(() => o.onPress && o.onPress(), 80); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16, opacity: o.disabled ? 0.45 : 1 }}
                accessibilityRole="button" accessibilityLabel={o.label}>
                {o.icon ? <IconChip icon={o.icon} toneKey={o.tone || (o.danger ? 'red' : 'indigo')} size={40} /> : null}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T w="xbold" s={14.5} c={o.danger ? S.red : S.ink}>{o.label}</T>
                  {o.sub ? <T w="semi" s={11.5} c={S.muted} numberOfLines={1} style={{ marginTop: 1 }}>{o.sub}</T> : null}
                </View>
              </PressableScale>
            ))}
          </View>
          <PressableScale onPress={onClose} style={{ marginHorizontal: 14, marginBottom: 4, paddingVertical: 14, borderRadius: 16, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, alignItems: 'center' }} accessibilityLabel="Cancel">
            <T w="bold" s={14.5} c={S.muted}>Cancel</T>
          </PressableScale>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
