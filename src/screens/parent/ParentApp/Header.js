// src/screens/parent/ParentApp/Header.js
import React, { memo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { C, st, T } from './constants';

function Header({ meta, childName, onAvatar }) {
  const initial = (childName || 'P').trim().charAt(0).toUpperCase();
  return (
    <View style={st.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity style={st.avatar} activeOpacity={0.85} onPress={onAvatar} accessibilityLabel="Account options">
          <T w="xbold" s={22} c="#fff">{initial}</T>
        </TouchableOpacity>
        <View>
          <T w="bold" s={23} c={C.ink}>{meta.title}</T>
          {meta.sub && !!childName && <T w="med" s={13} c={C.muted}>{childName} • Math</T>}
        </View>
      </View>
      <View style={st.gymPill}>
        <T w="bold" s={14} c={C.ink}>AI Gym</T>
        <View style={st.gymIcon}><Dumbbell size={14} strokeWidth={2.6} color={C.ink} /></View>
      </View>
    </View>
  );
}

export default memo(Header);
