// src/screens/parent/ParentApp/Header.js
import React, { memo } from 'react';
import { View } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { C, st, T } from './constants';
import { PressableScale } from './anim';

function Header({ meta, childName, onAvatar, onGym }) {
  const initial = (childName || 'P').trim().charAt(0).toUpperCase();
  return (
    <View style={st.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <PressableScale style={st.avatar} onPress={onAvatar} accessibilityLabel="Account options">
          <T w="xbold" s={22} c="#fff">{initial}</T>
        </PressableScale>
        <View>
          <T w="bold" s={23} c={C.ink}>{meta.title}</T>
          {meta.sub && !!childName && <T w="med" s={13} c={C.muted}>{childName} • Math</T>}
        </View>
      </View>
      {/* AI Gym → the child's real BrainGym + Arena data (Progress tab). Reuses the
          existing BrainGym backend; no duplicate gym experience for parents. */}
      <PressableScale style={st.gymPill} onPress={onGym} accessibilityLabel="Open AI Gym progress">
        <T w="bold" s={14} c={C.ink}>AI Gym</T>
        <View style={st.gymIcon}><Dumbbell size={14} strokeWidth={2.6} color={C.ink} /></View>
      </PressableScale>
    </View>
  );
}

export default memo(Header);
