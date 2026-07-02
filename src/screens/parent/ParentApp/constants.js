// src/screens/parent/ParentApp/constants.js
// Shared design tokens, config, the single StyleSheet, and tiny shared UI atoms for
// the Parent experience. Everything here is presentation/config only (backend-ready).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/* ---------- palette (matches the web preview) ---------- */
export const C = {
  bg: '#FFFFFF', headerBg: '#F6F6F7', ink: '#161616', muted: '#8C9199', faint: '#BDC1C7',
  border: '#ECECEE', black: '#111111', skeleton: '#ECECEE',
  orange: '#F0501E', gold: '#F5B301', navy: '#001A66',
  blue: '#1848F0', blueSoft: '#EAEFFF', green: '#12924B', greenSoft: '#E4F4EA',
  red: '#D81818', peach: '#FDEBE2', peachInk: '#C2410C',
  chatBg: '#33AEE8', classBg: '#2FC65C',
};
export const WORDMARK = [['A', C.orange], ['I', C.gold], ['L', C.navy], ['E', C.blue], ['R', C.blue], ['N', C.navy], ['O', C.green], ['V', C.red], ['A', C.orange]];
export const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const DOWF = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONF = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const TABS = [
  { id: 'home', label: 'Home', icon: 'home', title: 'Home', color: C.orange },
  { id: 'progress', label: 'Progress', icon: 'stats-chart', title: 'Progress', color: C.green, sub: true },
  { id: 'sessions', label: 'Sessions', icon: 'videocam', title: 'Sessions', color: C.blue, sub: true },
  { id: 'chat', label: 'Chat', icon: 'chatbubble-ellipses', title: 'Chat', color: C.red, sub: true },
  { id: 'classes', label: 'Classes', icon: 'book', title: 'Classes', color: C.navy, sub: true },
];

// Marketing / static content (config, not per-user data). Backend/CMS-ready.
export const CONTENT = {
  trial: {
    title: 'The science of\nmath mastery',
    body: 'Every AILERNOVA lesson is built on proven memory science — recall, spacing and mixed practice — so learning lasts.',
    cta: 'Book a FREE trial',
  },
  event: { kicker: 'Logic & Reasoning Edition', name: 'Math', suffix: " '26", grades: 'Grades 1–8', cta: 'Explore Now', trust: 'Trusted by parents', stars: 5 },
};
export const ARENA_BASE_RATING = 1000;

/* ---------- shared UI atoms ---------- */
export function Wordmark({ size = 18 }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {WORDMARK.map(([ch, col], i) => <Text key={i} style={{ color: col, fontWeight: '800', fontSize: size }}>{ch}</Text>)}
    </View>
  );
}
export const Label = ({ children, style }) => <Text style={[s.label, style]}>{children}</Text>;

/* ---------- the single shared StyleSheet ---------- */
const shadow = { shadowColor: '#14141E', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 };
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  flexFill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  header: { backgroundColor: C.headerBg, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.orange, borderWidth: 2, borderColor: '#111', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '800', fontSize: 22 },
  hTitle: { fontSize: 23, fontWeight: '700', color: C.ink },
  hSub: { fontSize: 13.5, color: C.muted, fontWeight: '500' },
  gymPill: { backgroundColor: C.gold, borderRadius: 24, paddingVertical: 7, paddingLeft: 15, paddingRight: 7, flexDirection: 'row', alignItems: 'center', gap: 8 },
  gymPillTxt: { fontWeight: '700', fontSize: 14.5, color: C.ink },
  gymIcon: { backgroundColor: '#fff', borderRadius: 13, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  logoutBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#fff' },
  logoutTxt: { color: C.muted, fontSize: 12.5, fontWeight: '800' },
  body: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 18 },
  label: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1, color: C.faint, textTransform: 'uppercase', marginTop: 22, marginBottom: 11 },

  errIcon: { width: 78, height: 78, borderRadius: 24, backgroundColor: C.headerBg, alignItems: 'center', justifyContent: 'center' },
  errTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  errText: { fontSize: 14, fontWeight: '500', color: C.muted, textAlign: 'center' },
  retryBtn: { marginTop: 6, backgroundColor: C.blue, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, ...shadow },
  retryTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  updateCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.peach, borderRadius: 16, padding: 14, width: 274 },
  updateIcon: { width: 42, height: 42, borderRadius: 11, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  piBadge: { position: 'absolute', right: -6, bottom: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  piBadgeTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  updTitle: { fontWeight: '700', fontSize: 15, color: C.ink },
  updSub: { fontSize: 13, color: C.muted, fontWeight: '500', marginTop: 2 },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF6E2', borderRadius: 16, padding: 14, width: 180 },
  streakIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },

  trialCard: { backgroundColor: '#F7C948', borderRadius: 20, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 30, ...shadow },
  trialTitle: { fontWeight: '800', fontSize: 21, color: C.ink, textAlign: 'center' },
  trialSub: { fontSize: 13.5, color: '#5A4A2A', fontWeight: '500', textAlign: 'center', marginTop: 10, marginHorizontal: 4, lineHeight: 20 },
  trialArt: { marginTop: 16, backgroundColor: '#F5CE5E', borderRadius: 16, minHeight: 150, position: 'relative' },
  trialBtn: { position: 'absolute', bottom: -15, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 26, ...shadow },
  trialBtnTxt: { fontWeight: '700', fontSize: 15, color: C.ink },
  eventCard: { backgroundColor: '#1C1E26', borderRadius: 20, padding: 22, ...shadow },
  eventKicker: { fontSize: 12.5, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  eventBig: { fontWeight: '800', fontSize: 26, color: '#fff' },
  eventGrade: { fontSize: 12.5, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  eventBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  eventBtnTxt: { fontWeight: '700', fontSize: 15, color: C.ink },
  trustStar: { width: 19, height: 19, backgroundColor: '#00B67A', borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  trustTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', marginLeft: 6 },

  progHead: { paddingHorizontal: 2, paddingTop: 18, paddingBottom: 8 },
  progHeadTxt: { fontWeight: '700', fontSize: 13.5, letterSpacing: 0.5, color: C.muted },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: C.border },
  dowChip: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dowChipTxt: { fontSize: 12, fontWeight: '700', color: C.muted },
  dateCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  dateCircleTxt: { fontSize: 14, fontWeight: '700', color: C.ink },
  noActivity: { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 22, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FAFAFB', marginTop: 22 },
  noActivityTxt: { color: C.faint, fontWeight: '600', fontSize: 15 },
  statCard: { borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, backgroundColor: '#fff', ...shadow },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statVal: { color: C.ink, fontSize: 22, fontWeight: '800' },
  statLabel: { color: C.muted, fontSize: 11, fontWeight: '700', marginTop: 3 },
  focusCard: { borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, backgroundColor: '#fff', ...shadow },
  focusNum: { color: C.peachInk, fontSize: 30, fontWeight: '800' },
  focusReco: { color: C.ink, fontSize: 13, fontWeight: '600', marginTop: 12, lineHeight: 19 },

  emptyScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, gap: 18 },
  emptyIcon: { width: 78, height: 78, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  emptyText: { textAlign: 'center', fontSize: 15.5, fontWeight: '600', color: 'rgba(255,255,255,0.92)', lineHeight: 22, maxWidth: 300 },
  comingPill: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  comingPillTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },

  linkArt: { alignItems: 'center', marginTop: 6, marginBottom: 10 },
  linkTitle: { fontSize: 24, fontWeight: '800', color: C.ink, textAlign: 'center' },
  linkSub: { fontSize: 14, fontWeight: '500', color: C.muted, textAlign: 'center', lineHeight: 21, marginTop: 10, marginBottom: 22, paddingHorizontal: 6 },
  q: { fontWeight: '700', fontSize: 14, color: C.ink, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.border, borderRadius: 14, color: C.ink, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  primaryBtn: { backgroundColor: C.blue, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16, ...shadow },
  primaryBtnOff: { opacity: 0.45 },
  primaryBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  nav: { height: 76, backgroundColor: '#FBFBFC', borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 8 },
  navItem: { alignItems: 'center', gap: 5 },
  toast: { position: 'absolute', bottom: 96, left: 20, right: 20, backgroundColor: '#111', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, zIndex: 40 },
  toastTxt: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
