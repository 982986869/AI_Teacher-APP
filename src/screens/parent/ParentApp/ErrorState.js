// src/screens/parent/ParentApp/ErrorState.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, s } from './constants';

export default function ErrorState({ onRetry }) {
  return (
    <View style={s.center}>
      <View style={s.errIcon}><Ionicons name="cloud-offline-outline" size={34} color={C.muted} /></View>
      <Text style={s.errTitle}>Couldn't load</Text>
      <Text style={s.errText}>Check your connection and try again.</Text>
      <TouchableOpacity style={s.retryBtn} activeOpacity={0.9} onPress={onRetry}><Text style={s.retryTxt}>Retry</Text></TouchableOpacity>
    </View>
  );
}
