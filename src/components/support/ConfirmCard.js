// src/components/support/ConfirmCard.js
// Shown when a ticket is `pending_confirmation` — the team believes it is solved and is
// asking the user to agree.
//
// The two buttons are the whole point of the design: staff propose, the USER closes. If
// they say nothing for three days the server closes it, so this card is never a dead
// end.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CircleCheck } from 'lucide-react-native';

import { PressableScale } from '../../screens/parent/ParentApp/anim';
import { D, TX } from './theme';

export default function ConfirmCard({ resolution, onConfirm, onStillBroken, busy }) {
  return (
    <View style={s.card}>
      <View style={s.head}>
        <CircleCheck size={18} color={D.indigo} />
        <TX w="semi" s={14} c={D.ink}>Team ka kehna hai issue solve ho gaya</TX>
      </View>

      {!!resolution?.summary && (
        <TX s={13} lh={19} c={D.muted} style={s.summary}>“{resolution.summary}”</TX>
      )}
      {!!resolution?.by && <TX s={12} c={D.muted}>— {resolution.by}</TX>}

      <PressableScale onPress={onConfirm} disabled={busy} style={[s.btn, s.primary]} accessibilityRole="button" accessibilityLabel="Confirm the issue is resolved">
        <TX w="bold" s={14} c={D.ink}>{busy ? 'Ek second…' : 'Issue Resolved'}</TX>
      </PressableScale>

      <PressableScale onPress={onStillBroken} disabled={busy} style={[s.btn, s.ghost]} accessibilityRole="button" accessibilityLabel="Say the issue is still there">
        <TX w="semi" s={14} c={D.muted}>Abhi bhi problem hai</TX>
      </PressableScale>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 16, borderWidth: 1.5, borderColor: D.indigo,
    padding: 16, gap: 8, marginVertical: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summary: { marginTop: 2 },
  btn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  primary: { backgroundColor: D.indigo },
  ghost: { borderWidth: 1, borderColor: D.border },
});
