// src/screens/parent/ParentApp/ErrorState.js — network/error state with retry.
import React from 'react';
import { View } from 'react-native';
import { CloudOff } from 'lucide-react-native';
import { C, st, T } from './constants';
import { PressableScale } from './anim';

export default function ErrorState({ onRetry }) {
  return (
    <View style={st.center}>
      <View style={st.errIcon}><CloudOff size={34} color={C.muted} /></View>
      <T w="xbold" s={18} c={C.ink}>Couldn't load</T>
      <T w="med" s={14} c={C.muted} style={{ textAlign: 'center' }}>Check your connection and try again.</T>
      <PressableScale style={st.retryBtn} onPress={onRetry}><T w="xbold" s={14} c="#fff">Retry</T></PressableScale>
    </View>
  );
}
