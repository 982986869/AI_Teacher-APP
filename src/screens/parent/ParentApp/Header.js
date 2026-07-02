// src/screens/parent/ParentApp/Header.js
import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C, s } from './constants';

function Header({ meta, child, onAvatar }) {
  const initial = (child?.name || 'P').trim().charAt(0).toUpperCase();
  return (
    <View style={s.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity style={s.avatar} activeOpacity={0.85} onPress={onAvatar} accessibilityLabel="Account options">
          <Text style={s.avatarTxt}>{initial}</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.hTitle}>{meta.title}</Text>
          {meta.sub && !!child && <Text style={s.hSub}>{child.name}{child.className ? ` • ${child.className}` : ''}</Text>}
        </View>
      </View>
      <View style={s.gymPill}>
        <Text style={s.gymPillTxt}>AI Gym</Text>
        <View style={s.gymIcon}><MaterialCommunityIcons name="dumbbell" size={14} color={C.ink} /></View>
      </View>
    </View>
  );
}

export default memo(Header);
