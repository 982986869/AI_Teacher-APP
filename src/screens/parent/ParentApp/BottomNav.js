// src/screens/parent/ParentApp/BottomNav.js
import React, { memo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { C, st, T, TABS } from './constants';

function BottomNav({ tab, setTab }) {
  return (
    <View style={st.nav}>
      {TABS.map(({ id, label, Icon, color }) => {
        const on = tab === id;
        return (
          <TouchableOpacity key={id} style={st.navItem} onPress={() => setTab(id)}>
            <Icon size={22} color={on ? color : C.ink} strokeWidth={on ? 2.5 : 1.9} />
            <T w={on ? 'bold' : 'med'} s={11} c={on ? color : C.ink}>{label}</T>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default memo(BottomNav);
