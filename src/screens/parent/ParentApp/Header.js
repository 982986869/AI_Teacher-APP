// src/screens/parent/ParentApp/Header.js — top bar shown on every tab: an animated
// mascot avatar (gently bobs), the tab title + child's name, and the AI Gym pill.
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { C, st, T } from './constants';
import { PressableScale, FadeInOnce, Float } from './anim';

function Header({ meta, childName, onAvatar, onGym }) {
  return (
    <View style={st.header}>
      {/* Content settles in the first time the app opens, then stays calm. */}
      <FadeInOnce id="parent-hdr-l" y={10}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <PressableScale style={hd.avatar} onPress={onAvatar} accessibilityLabel="Account options">
            <Float distance={5} duration={2600}><T s={32}>🦊</T></Float>
          </PressableScale>
          <View style={{ flexShrink: 1 }}>
            <T w="bold" s={23} c={C.ink} numberOfLines={1}>{meta?.title || 'Ailernova'}</T>
            {meta?.sub && !!childName && <T w="med" s={13} c={C.muted} numberOfLines={1}>{childName}</T>}
          </View>
        </View>
      </FadeInOnce>
      {/* AI Gym → the child's real BrainGym + Arena data (Progress tab). Reuses the
          existing BrainGym backend; no duplicate gym experience for parents. */}
      <FadeInOnce id="parent-hdr-r" y={10} delay={80}>
        <PressableScale style={st.gymPill} onPress={onGym} accessibilityLabel="Open AI Gym progress">
          <T w="bold" s={14} c={C.ink}>AI Gym</T>
          <View style={st.gymIcon}><Dumbbell size={14} strokeWidth={2.6} color={C.ink} /></View>
        </PressableScale>
      </FadeInOnce>
    </View>
  );
}

const hd = StyleSheet.create({
  // Mascot avatar — clean white disc with a branded ring; the face bobs gently inside.
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: C.orange, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});

export default memo(Header);
