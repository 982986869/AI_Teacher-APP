// src/components/AdminTestCard.js
// The admin mock-test card. Whole card is tappable (→ manage the test); a clean "⋯" sits in
// the top-right for secondary actions, and a chevron on the right signals "tap to open"
// (replacing the old green button). A NEW file so Metro serves it reliably, and so the shared
// student TestCard (which keeps its Attempt/Retake button) is untouched.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { EllipsisVertical, ChevronRight } from 'lucide-react-native';

const TONE = {
  published: { soft: '#E7F3E4', ink: '#1F9D6B' },
  draft:     { soft: '#FBEED6', ink: '#B9820E' },
  archived:  { soft: '#EFEFF1', ink: '#6B6B70' },
};
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export default function AdminTestCard({ status, title, metas = [], onPress, onMenu }) {
  const tone = TONE[status] || TONE.draft;
  return (
    <Pressable style={st.card} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={st.top}>
          <View style={[st.pill, { backgroundColor: tone.soft }]}>
            <View style={[st.dot, { backgroundColor: tone.ink }]} />
            <Text numberOfLines={1} style={[st.pillTxt, { color: tone.ink }]}>{cap(status)}</Text>
          </View>
          <Pressable onPress={onMenu} hitSlop={12} style={st.menu} accessibilityRole="button" accessibilityLabel="More actions">
            <EllipsisVertical size={18} color="#9A9AA0" strokeWidth={2.2} />
          </Pressable>
        </View>
        <Text numberOfLines={2} style={st.title}>{title}</Text>
        {metas.length > 0 && (
          <View style={st.metaRow}>{metas.map((m, i) => <Text key={i} style={st.meta}>{m}</Text>)}</View>
        )}
      </View>
      <ChevronRight size={22} color="#C7C7CC" strokeWidth={2.4} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 18, paddingVertical: 15, paddingLeft: 16, paddingRight: 12, marginBottom: 12 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8, alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pillTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  menu: { padding: 2, marginLeft: 8 },
  title: { fontSize: 16, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.2, marginTop: 9 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 9 },
  meta: { fontSize: 12, fontWeight: '700', color: '#6B6B70' },
});
