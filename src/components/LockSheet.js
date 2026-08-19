// src/components/LockSheet.js
// The paywall's one screen. Raised when a free account reaches content — either from
// an entry point the app gates itself, or from a 403 LOCKED the axios interceptor
// caught on the way back.
//
// It is deliberately plain. This is the moment a student finds out they cannot have
// the thing they just tapped, and dressing that up makes it read as a sales page
// rather than an answer. One line of what happened, one line of what to do, one
// button that does it.
//
// The button raises a support ticket rather than dialling or opening a payment page:
// the support flow already exists end to end, already routes to the Sales team, and
// already captures a callback number so somebody can ring back. There is no payment
// in the app on purpose — see docs/superpowers/specs/2026-08-18-free-tier-access-gate-design.md.
import React from 'react';
import { Modal, View, StyleSheet, Pressable } from 'react-native';
import { Lock } from 'lucide-react-native';
import { DAY, DFONT as F } from '../theme/dayTheme';
import { T } from '../screens/parent/ParentApp/constants';

export default function LockSheet({ visible, onClose, onRequestAccess }) {
  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose}>
        {/* Stops a tap inside the card from closing it — the scrim is the dismiss. */}
        <Pressable style={s.card} onPress={() => {}}>
          <View style={s.icon}>
            <Lock size={22} color={DAY.violet} strokeWidth={2.2} />
          </View>

          <T w="xbold" s={17} c={DAY.ink} style={s.title}>This is locked</T>
          <T w="reg" s={13.5} c={DAY.inkSoft} style={s.body}>
            Lessons, practice, resources and tests are part of the full plan. Brain Gym
            and the games stay free.
          </T>

          <Pressable style={s.primary} onPress={onRequestAccess} accessibilityRole="button">
            <T w="xbold" s={14} c="#FFFFFF">Request access</T>
          </Pressable>
          <Pressable style={s.ghost} onPress={onClose} accessibilityRole="button">
            <T w="semi" s={13.5} c={DAY.inkSoft}>Not now</T>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(17,17,17,0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: {
    width: '100%', maxWidth: 360, backgroundColor: DAY.card, borderRadius: 20,
    borderWidth: 1, borderColor: DAY.cardEdge, padding: 22, alignItems: 'center',
  },
  icon: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: DAY.violetSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', marginTop: 8, lineHeight: 19 },
  primary: {
    alignSelf: 'stretch', marginTop: 18, height: 46, borderRadius: 14,
    backgroundColor: DAY.violet, alignItems: 'center', justifyContent: 'center',
  },
  ghost: { alignSelf: 'stretch', marginTop: 4, height: 40, alignItems: 'center', justifyContent: 'center' },
});
