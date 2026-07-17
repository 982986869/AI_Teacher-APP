// src/components/Fab.js
// Shared floating action button for Admin Mode (Practice "+", Sessions "+", Resources/AI "+").
// A clean circular Material-style FAB in the app's indigo — small footprint so it doesn't
// clutter the cards it floats over. Uses the shared PressableScale press animation and sits
// above the floating dock. Pass `label` only when an extended pill is genuinely wanted; the
// default (icon-only round) is the premium, uncluttered look.
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { S } from '../theme/studentUI';
import { FONT } from '../constants/fonts';
import { PressableScale } from '../screens/parent/ParentApp/anim';

export default function Fab({ label, onPress, Icon = Plus, color = S.indigo, bottomInset = 92, accessibilityLabel }) {
  const insets = useSafeAreaInsets();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.9}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label || 'Add'}
      style={[
        st.fab,
        label ? st.extended : st.round,
        { bottom: insets.bottom + bottomInset, backgroundColor: color, shadowColor: color },
      ]}
    >
      <Icon size={26} color="#fff" strokeWidth={2.6} />
      {label ? <Text style={st.label}>{label}</Text> : null}
    </PressableScale>
  );
}

const st = StyleSheet.create({
  fab: {
    position: 'absolute', right: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    // A soft, tinted lift — pronounced enough to read as a floating action, not a flat blob.
    shadowOpacity: 0.32, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  round: { width: 58, height: 58, borderRadius: 29 },
  extended: { height: 54, paddingHorizontal: 20, borderRadius: 27, gap: 8 },
  label: { color: '#fff', fontSize: 15, fontFamily: FONT.extrabold, letterSpacing: 0.2 },
});
