// src/screens/admin/support/RefreshFailedBanner.js
// "The last refresh failed, but what you are looking at is still real."
//
// Both support screens reload constantly — every socket event, every return to the
// foreground, every write — on a mobile connection that drops at every network switch.
// Replacing a loaded queue or an open thread with a full-screen error for one of those
// blips throws away work the agent can still act on (and, in the thread, makes a
// half-typed reply appear to vanish). The web console's answer is a toast over held
// state (admin/app/(portal)/support/page.tsx); this is that, in a shape a phone screen
// can hold — a strip above the content, tappable to retry.
import React from 'react';
import { View } from 'react-native';
import { TriangleAlert, RotateCw } from 'lucide-react-native';
import { T } from '../../parent/ParentApp/constants';
import { S } from '../../../theme/studentUI';
import { PressableScale } from '../../parent/ParentApp/anim';

export function RefreshFailedBanner({ message, onRetry }) {
  return (
    <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8 }}>
      <PressableScale
        onPress={onRetry}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: S.orangeSoft, borderRadius: 12, borderWidth: 1, borderColor: S.orange + '44',
          paddingHorizontal: 12, paddingVertical: 9,
        }}
        accessibilityRole="button"
        accessibilityLabel="Refresh failed, tap to retry"
      >
        <TriangleAlert size={13} color={S.orange} strokeWidth={2.4} />
        <T w="semi" s={11.5} c={S.orange} numberOfLines={2} style={{ flex: 1 }}>
          {message || "Couldn't refresh"} — what you see may be out of date.
        </T>
        <RotateCw size={13} color={S.orange} strokeWidth={2.6} />
      </PressableScale>
    </View>
  );
}

export default RefreshFailedBanner;
