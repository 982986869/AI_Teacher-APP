// src/screens/braingym/GoalTip.js
// A small "?" button that toggles a tooltip showing the game's goal/question.
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function GoalTip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={st.wrap}>
      <TouchableOpacity onPress={() => setOpen((o) => !o)} style={st.btn} activeOpacity={0.85} accessibilityLabel="What to do">
        <Text style={st.q}>?</Text>
      </TouchableOpacity>
      {open && (
        <View style={st.bubble}>
          <Text style={st.bubbleTxt}>{text}</Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'relative' },
  btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  q: { color: '#fff', fontSize: 16, fontWeight: '900' },
  bubble: { position: 'absolute', top: 42, right: 0, minWidth: 170, maxWidth: 240, backgroundColor: '#F4F4F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, zIndex: 60, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8 },
  bubbleTxt: { color: '#0B0B0D', fontSize: 13, fontWeight: '800', lineHeight: 18 },
});
