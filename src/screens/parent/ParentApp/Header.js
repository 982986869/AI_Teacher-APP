// src/screens/parent/ParentApp/Header.js — top bar shown on every tab: the parent's
// profile photo, the tab title + child's name, and the AI Gym pill.
import React, { memo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { C, st, T } from './constants';
import { PressableScale, FadeInOnce } from './anim';

function Header({ meta, childName, parentPhoto, parentName, onAvatar, onGym }) {
  // No photo on the account → the parent's initial, the same fallback the student
  // Profile screen and ProfileSheet already draw. Never a stand-in face: a stock
  // portrait would read as this parent, which it is not. An initial reads as a real
  // person whose picture we simply do not have yet.
  const initial = (Array.from((parentName || 'P').trim())[0] || 'P').toUpperCase();
  return (
    <View style={st.header}>
      {/* Content settles in the first time the app opens, then stays calm. */}
      <FadeInOnce id="parent-hdr-l" y={10}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <PressableScale style={hd.avatar} onPress={onAvatar} accessibilityLabel="Account options">
            {/* cover, not contain: profile photos are rarely square, and the disc must
                stay filled rather than letterbox the face inside a white ring. */}
            {parentPhoto
              ? <Image source={{ uri: parentPhoto }} style={hd.photo} resizeMode="cover" />
              : <T w="xbold" s={19} c={C.orange}>{initial}</T>}
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
  // Clean white disc with a branded ring; the photo is clipped to the circle by overflow.
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: C.orange, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
});

export default memo(Header);
