// src/screens/parent/ParentApp/constants.js
// Design tokens, Poppins font map, the `T` text helper, shared atoms, config, the
// Sessions mock/config data, and the single StyleSheet. Exact visuals from the
// teammate's RN build, plus a few styles for the real-data states (link/error/stats).
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Home, BarChart3, MessageCircle, BookOpen, Video } from 'lucide-react-native';

export const C = {
  bg: '#FFFFFF', headerBg: '#F6F6F7', ink: '#161616', muted: '#8C9199', faint: '#BDC1C7',
  border: '#ECECEE', black: '#111111',
  orange: '#F0501E', gold: '#F5B301', navy: '#001A66',
  blue: '#1848F0', blueSoft: '#EAEFFF', green: '#12924B', greenSoft: '#E4F4EA',
  red: '#D81818', peach: '#FDEBE2', peachInk: '#C2410C',
  chatBg: '#33AEE8', classBg: '#2FC65C',
};
export const F = {
  reg: 'Poppins_400Regular', med: 'Poppins_500Medium', semi: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold', xbold: 'Poppins_800ExtraBold', black: 'Poppins_900Black',
};
export const WORDMARK = [['A', C.orange], ['I', C.gold], ['L', C.navy], ['E', C.blue], ['R', C.blue], ['N', C.navy], ['O', C.green], ['V', C.red], ['A', C.orange]];

/* Marketing / static content (config, not per-user data). */
export const CONTENT = {
  trial: { title: 'The science of\nmath mastery', body: 'Every AILERNOVA lesson is built on proven memory science — recall, spacing and mixed practice — so learning lasts.', cta: 'Book a FREE trial' },
  event: { kicker: 'Logic & Reasoning Edition', name: 'Math', suffix: " '26", grades: 'Grades 1–8', cta: 'Explore Now', trust: 'Trusted by parents', stars: 5 },
};
export const ARENA_BASE_RATING = 1000;

export const DOWF = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONF = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const TABS = [
  { id: 'home', label: 'Home', Icon: Home, color: C.orange, title: 'Home' },
  { id: 'progress', label: 'Progress', Icon: BarChart3, color: C.green, title: 'Progress', sub: true },
  { id: 'sessions', label: 'Sessions', Icon: Video, color: C.blue, title: 'Sessions', sub: true },
  { id: 'chat', label: 'Chat', Icon: MessageCircle, color: C.red, title: 'Chat', sub: true },
  { id: 'classes', label: 'Classes', Icon: BookOpen, color: C.navy, title: 'Classes', sub: true },
];

/* ---------- shared text atoms ---------- */
export function T({ w = 'reg', s = 14, c = C.ink, style, children, ...rest }) {
  return <Text style={[{ fontFamily: F[w], fontSize: s, color: c }, style]} {...rest}>{children}</Text>;
}
export function Label({ children }) { return <T w="bold" s={11.5} c={C.faint} style={st.label}>{children}</T>; }
export function Wordmark({ size = 18 }) {
  return <View style={{ flexDirection: 'row' }}>{WORDMARK.map(([c, col], i) => <T key={i} w="xbold" s={size} c={col}>{c}</T>)}</View>;
}

/* ---------- styles (exact from the teammate build + real-data states) ---------- */
export const card = { shadowColor: '#141420', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 };
export const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? 28 : 0 },
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  header: { backgroundColor: C.headerBg, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.orange, borderWidth: 2, borderColor: '#111', alignItems: 'center', justifyContent: 'center' },
  gymPill: { backgroundColor: C.gold, borderRadius: 24, paddingLeft: 15, paddingRight: 7, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 8 },
  gymIcon: { backgroundColor: '#fff', borderRadius: 13, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, paddingHorizontal: 18 },
  label: { letterSpacing: 1, textTransform: 'uppercase', marginTop: 22, marginBottom: 11 },

  updateCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.peach, borderRadius: 16, padding: 14, width: 270, marginRight: 10 },
  updateIcon: { width: 42, height: 42, borderRadius: 11, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  piBadge: { position: 'absolute', right: -6, bottom: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF6E2', borderRadius: 16, padding: 14, width: 160 },
  streakIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },

  trialCard: { backgroundColor: '#F7C948', borderRadius: 20, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20, ...card },
  trialArt: { marginTop: 16, backgroundColor: '#F4CC55', borderRadius: 16, height: 200, overflow: 'hidden', justifyContent: 'flex-end' },
  trialImg: { borderRadius: 16 },
  trialBtnWrap: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
  trialBtn: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 26, paddingVertical: 13, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  eventCard: { backgroundColor: '#1C1E26', borderRadius: 20, padding: 22, ...card },
  eventBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  trustStar: { width: 19, height: 19, backgroundColor: '#00B67A', borderRadius: 3, alignItems: 'center', justifyContent: 'center' },

  progHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 8, paddingHorizontal: 2 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 22 },
  dowChip: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dateCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  noActivity: { borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FAFAFB' },
  statCard: { borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, backgroundColor: '#fff', ...card },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  focusCard: { borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, backgroundColor: '#fff', ...card },

  emptyScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, gap: 24 },
  chatBubble: { width: 70, height: 58, backgroundColor: '#BFE6FA', borderWidth: 2.5, borderColor: '#16202A', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chatTailOuter: { position: 'absolute', right: 14, bottom: -13, width: 0, height: 0, borderLeftWidth: 12, borderLeftColor: 'transparent', borderTopWidth: 14, borderTopColor: '#16202A' },
  chatTailInner: { position: 'absolute', right: 17, bottom: -8, width: 0, height: 0, borderLeftWidth: 8, borderLeftColor: 'transparent', borderTopWidth: 9, borderTopColor: '#BFE6FA' },
  emptyText: { textAlign: 'center', lineHeight: 28, maxWidth: 290 },
  exploreBtn: { backgroundColor: C.black, borderRadius: 10, paddingVertical: 16, alignItems: 'center', alignSelf: 'stretch' },
  checkBadge: { position: 'absolute', right: 18, bottom: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...card },

  tutorStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.blueSoft, borderRadius: 18, padding: 14, marginTop: 12 },
  tutorAv: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  upcoming: { borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 16, backgroundColor: '#fff', ...card },
  dateBadge: { width: 60, borderRadius: 14, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  joinBtn: { backgroundColor: C.green, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  ghost: { flex: 1, backgroundColor: '#F3F3F4', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border, borderRadius: 18, padding: 18, backgroundColor: '#FAFAFB' },
  bookCta: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, ...card },
  bookIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  pastRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  pastCheck: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' },
  notesTag: { backgroundColor: C.blueSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },

  nav: { backgroundColor: '#FBFBFC', borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 10, paddingBottom: 12 },
  navItem: { alignItems: 'center', gap: 5 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F2F3', alignItems: 'center', justifyContent: 'center' },
  sheetBody: { paddingHorizontal: 18, paddingTop: 16 },
  chip: { borderWidth: 1.5, borderColor: C.border, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9 },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  dayCell: { width: 52, height: 62, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', gap: 3, marginRight: 8 },
  dayCellOn: { backgroundColor: C.blue, borderColor: C.blue },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  slot: { width: '31%', borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  slotOn: { backgroundColor: C.blue, borderColor: C.blue },
  slotOff: { backgroundColor: '#F6F6F7' },
  sheetFoot: { padding: 16, borderTopWidth: 1, borderTopColor: C.border },
  confirm: { backgroundColor: C.black, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmOff: { backgroundColor: '#E7E7E8' },
  summary: { backgroundColor: '#F7F7F8', borderRadius: 14, padding: 14, marginBottom: 14 },
  noteBlock: { borderRadius: 14, padding: 14, marginBottom: 12 },

  call: { flex: 1, backgroundColor: '#0E0E12' },
  callTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  callStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  callAv: { width: 110, height: 110, borderRadius: 55, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  selfTile: { position: 'absolute', right: 18, bottom: 12, width: 84, height: 116, borderRadius: 16, backgroundColor: '#1E1E26', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  callControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingBottom: 30 },
  callBtn: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  leave: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#F0343C', alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'absolute', bottom: 96, left: 20, right: 20, backgroundColor: '#111', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14 },

  // real-data states
  errIcon: { width: 78, height: 78, borderRadius: 24, backgroundColor: C.headerBg, alignItems: 'center', justifyContent: 'center' },
  retryBtn: { marginTop: 6, backgroundColor: C.blue, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, ...card },
  logoutBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#fff' },
  linkArt: { alignItems: 'center', marginTop: 6, marginBottom: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.border, borderRadius: 14, color: C.ink, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: F.med },
  primaryBtn: { backgroundColor: C.blue, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16, ...card },
  primaryBtnOff: { opacity: 0.45 },
  skelBlock: { backgroundColor: '#ECECEE' },
});
