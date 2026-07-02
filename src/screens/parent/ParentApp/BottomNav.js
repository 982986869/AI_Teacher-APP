// src/screens/parent/ParentApp/BottomNav.js
import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, s, TABS } from './constants';

function BottomNav({ tab, setTab }) {
  return (
    <View style={s.nav}>
      {TABS.map(({ id, label, icon, color }) => {
        const on = tab === id;
        return (
          <TouchableOpacity key={id} style={s.navItem} activeOpacity={0.8} onPress={() => setTab(id)}>
            <Ionicons name={on ? icon : `${icon}-outline`} size={22} color={on ? color : C.ink} />
            <Text style={{ fontSize: 11, fontWeight: on ? '700' : '500', color: on ? color : C.ink }}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default memo(BottomNav);
