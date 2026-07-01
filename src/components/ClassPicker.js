// ClassPicker.js
// Global class selector (Class 6–12) + a "coming soon" gate. The picker chip
// lives in the Home top bar; the chosen class is stored app-wide in AuthContext
// and decides which content the user sees. Only classes in READY have content.

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export const CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
// Classes that currently have seeded content in the DB. Anything else shows the
// premium "coming soon" empty state instead of falling back to another class.
export const READY = { 'Class 11': true, 'Class 12': true };
export const isClassReady = (c) => !!READY[c];

const TEAL = '#0FA39A';
const TEAL_SOFT = '#E1F5F3';
const INDIGO = '#5A67E8';
const INK = '#2A2D3A';
const MUTED = '#8A8F9C';

export function ClassPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable style={st.chip} onPress={() => setOpen(true)} hitSlop={6}>
        <Ionicons name="school-outline" size={14} color={TEAL} />
        <Text style={st.chipTxt}>{value || 'Select class'}</Text>
        <Ionicons name="chevron-down" size={14} color={TEAL} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={st.overlay} onPress={() => setOpen(false)}>
          <View style={st.sheet}>
            <Text style={st.sheetTitle}>Select your class</Text>
            {CLASSES.map((c) => {
              const active = c === value;
              const ready = isClassReady(c);
              return (
                <Pressable key={c} style={[st.row, active && st.rowActive]}
                  onPress={() => { onChange(c); setOpen(false); }}>
                  <Text style={[st.rowTxt, active && st.rowTxtActive]}>{c}</Text>
                  {!ready && <Text style={st.soon}>Coming soon</Text>}
                  {active && <Ionicons name="checkmark-circle" size={20} color={TEAL} style={{ marginLeft: 8 }} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// Side-by-side class chips (6–12) for quick switching — black & white theme.
// Used at the top of the Practice and Resources tabs.
export function ClassTabs({ value, onChange }) {
  return (
    <View style={st.tabsWrap}>
      {CLASSES.map((c) => {
        const active = c === value;
        const ready = isClassReady(c);
        return (
          <Pressable key={c} style={[st.tab, active && st.tabActive]} onPress={() => onChange(c)}>
            <Text numberOfLines={1} style={[st.tabTxt, active && st.tabTxtActive]}>{c}</Text>
            {!ready && <View style={[st.tabDot, active && { backgroundColor: '#fff' }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

// Premium empty state for a class/subject whose content isn't seeded yet. Reads the
// student's saved profile (class · board · stream) so it never implies switching to
// another class. Pass `label` to name the specific section (e.g. "Mock Tests").
export function ComingSoon({ className, label }) {
  const { scope } = useAuth();
  const cls = className || scope?.className || 'Your class';
  const bits = [cls, scope?.board, scope?.stream ? String(scope.stream).toUpperCase() : null].filter(Boolean);
  return (
    <View style={st.csWrap}>
      <View style={st.csIcon}><Ionicons name="sparkles-outline" size={34} color={INDIGO} /></View>
      <Text style={st.csTitle}>{label ? `${label} for ${cls}` : `${cls} content`} is coming soon</Text>
      <Text style={st.csSub}>
        We're building this for your syllabus. Please check back later — it will appear here automatically.
      </Text>
      {bits.length > 0 && (
        <View style={st.csTags}>
          {bits.map((b) => (
            <View key={b} style={st.csTag}><Text style={st.csTagTxt}>{b}</Text></View>
          ))}
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: TEAL_SOFT, borderWidth: 1, borderColor: '#C7E9E5', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  chipTxt: { fontSize: 12.5, fontWeight: '800', color: TEAL, letterSpacing: -0.2 },

  overlay: { flex: 1, backgroundColor: 'rgba(20,22,30,0.35)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  sheet: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 22, padding: 16 },
  sheetTitle: { fontSize: 16, fontWeight: '900', color: INK, marginBottom: 10, paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, marginBottom: 4 },
  rowActive: { backgroundColor: TEAL_SOFT },
  rowTxt: { flex: 1, fontSize: 15.5, fontWeight: '700', color: INK },
  rowTxtActive: { color: TEAL, fontWeight: '800' },
  soon: { fontSize: 11, fontWeight: '800', color: INDIGO, backgroundColor: '#EAECFB', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },

  tabsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  tab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#D8D8DC', backgroundColor: '#fff' },
  tabActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  tabTxt: { fontSize: 13, fontWeight: '800', color: '#3A3A3C' },
  tabTxtActive: { color: '#fff' },
  tabDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#B0B0B6' },

  csWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48, gap: 12 },
  csIcon: { width: 76, height: 76, borderRadius: 24, backgroundColor: '#EAECFB', alignItems: 'center', justifyContent: 'center' },
  csTitle: { fontSize: 19, fontWeight: '900', color: INK, textAlign: 'center', letterSpacing: -0.3 },
  csSub: { fontSize: 13.5, fontWeight: '600', color: MUTED, textAlign: 'center', lineHeight: 20 },
  csTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
  csTag: { backgroundColor: '#F1F2F6', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  csTagTxt: { fontSize: 12, fontWeight: '800', color: INK },
});
