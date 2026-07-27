// src/screens/admin/ui/UndoToast.js
// A brief, dismissible toast with an Undo affordance for reversible actions (archive,
// hide). Auto-hides after a few seconds. Purely presentational — the screen owns the
// state and the actual undo call.
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { S, shadow } from './kit';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';

export function UndoToast({ visible, message, actionLabel = 'Undo', onAction, onHide, bottom = 100 }) {
  useEffect(() => {
    if (!visible) return undefined;
    const t = setTimeout(onHide, 4200);
    return () => clearTimeout(t);
  }, [visible, onHide]);
  if (!visible) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: S.ink, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16, ...shadow }}>
        <T w="semi" s={13} c="#fff" style={{ flex: 1 }} numberOfLines={2}>{message}</T>
        {onAction ? (
          <PressableScale onPress={onAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={actionLabel}>
            <T w="xbold" s={13} c={S.gold}>{actionLabel}</T>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}
