// src/components/TestModeToggle.js
// A two-way segment for the admin Tests tab: Mock Tests (admin-authored, lifecycle) vs
// Online Tests (imported examin8 MCQ tests, browse + manage). Plain Pressable + Text so the
// labels always render on-device.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { TK } from './testCardKit';

const SEGMENTS = [{ id: 'mock', label: 'Mock Tests' }, { id: 'online', label: 'Online Tests' }];

export default function TestModeToggle({ mode, onChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, backgroundColor: TK.bg, borderRadius: 14, padding: 4, marginHorizontal: 16, marginTop: 6, borderWidth: 1, borderColor: TK.border }}>
      {SEGMENTS.map((s) => {
        const on = mode === s.id;
        return (
          <Pressable key={s.id} onPress={() => onChange(s.id)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 11, backgroundColor: on ? TK.card : 'transparent', ...(on ? { shadowColor: '#0B1020', shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 } : null) }}>
            <Text style={{ fontSize: 13.5, fontWeight: '800', color: on ? TK.text : TK.textMuted }}>{s.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
