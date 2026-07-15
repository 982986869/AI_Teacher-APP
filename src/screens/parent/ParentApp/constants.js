// src/screens/parent/ParentApp/constants.js
// Design tokens, Poppins font map, the `T` text helper, shared atoms, config, the
// Sessions mock/config data, and the single StyleSheet. Exact visuals from the
// teammate's RN build, plus a few styles for the real-data states (link/error/stats).
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Defs, LinearGradient as LG, Stop, Rect } from 'react-native-svg';
import { Home, BarChart3, MessageCircle, BookOpen, Video, Share2, Sparkles, TrendingUp } from 'lucide-react-native';

export const C = {
  bg: '#FFFFFF', canvas: '#F1F3F7', headerBg: '#F6F6F7', ink: '#161616', muted: '#6C7179', faint: '#A6AAB2',
  border: '#ECECEE', hair: '#F0F1F4', black: '#111111',
  orange: '#F0501E', gold: '#F5B301', navy: '#001A66',
  blue: '#1848F0', blueSoft: '#EAEFFF', green: '#12924B', greenSoft: '#E4F4EA',
  red: '#D81818', peach: '#FDEBE2', peachInk: '#C2410C',
  chatBg: '#33AEE8', classBg: '#2FC65C',
  // Hero (Upcoming Demo) — deep ink surface + gradient stops that read premium on a
  // light dashboard. Text/accents sit on top of this.
  heroA: '#171A2E', heroB: '#0E1020', heroAccent: '#8FA6FF',
};
// Nunito — the rounded display font used by ailernova.in (and matching the reference
// events UI). Loaded in ParentApp; applies across the whole parent dashboard.
export const F = {
  reg: 'Nunito_400Regular', med: 'Nunito_500Medium', semi: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold', xbold: 'Nunito_800ExtraBold', black: 'Nunito_900Black',
};
export const WORDMARK = [['A', C.orange], ['I', C.gold], ['L', C.navy], ['E', C.blue], ['R', C.blue], ['N', C.navy], ['O', C.green], ['V', C.red], ['A', C.orange]];

/* Marketing / static content (config, not per-user data). Subject-neutral + global. */
export const CONTENT = {
  trial: { title: 'Learning that\nactually sticks', body: 'Every Ailernova lesson is built on proven memory science — recall, spacing and mixed practice — so what your child learns lasts.', cta: 'Book a FREE demo' },
  // Per-event data is DB-driven (offline_events → /api/parent/report). These are the
  // shared brand figures shown under every event card.
  event: {
    cta: 'Register Now', learn: 'Learn how it works',
    stats: [{ value: '200+', label: 'Events' }, { value: '22K+', label: 'Participants' }, { value: '50+', label: 'Cities' }],
    rating: { score: '4.9', count: '11K+ Reviews' },
    exploreTitle: 'Explore events by', regionCta: 'Select Region', exploreHint: 'Please select a region to show the events',
    storeTitle: "What's in store for you?",
    storeBody: 'Your child dives into a hands-on learning experience — building, solving and discovering how they learn best. They take home everything they make.',
    regions: [],
    skillsTitle: "Skills You'll Discover",
    skillsIntro: 'The activities and quizzes build the core skills behind confident learning — across every subject.',
    participantsTitle: 'Hear From Our Participants',
    participantsIntro: 'Real AILERNOVA learners, and what changed for them.',
    community: {
      title: 'Join our community of\nAilernova parents', body: 'Get updates, learning resources, and celebrate every win ❤️',
      instagram: 'https://instagram.com/ailernova', youtube: 'https://youtube.com/@ailernova',
    },
    become: {
      title: 'BECOME AILERNOVA™', body: 'Build skills with daily challenges and puzzles.',
      appCta: 'Download the app', appUrl: 'https://ailernova.com',
      // Four feature glyphs (coloured lucide icons on dark circles), matching the app's
      // reference tiles. Each carries its own Icon component + accent colour.
      categories: [
        { Icon: Share2, color: '#22D3EE', label: 'AI TUTOR' },
        { Icon: Sparkles, color: '#C471ED', label: 'SMART PRACTICE' },
        { Icon: BookOpen, color: '#F5B301', label: 'ADAPTIVE LEARNING' },
        { Icon: TrendingUp, color: '#3FCF7F', label: 'PROGRESS TRACKING' },
      ],
    },
    footer: {
      links: [
        { q: 'About Ailernova', a: 'Ailernova makes learning click through hands-on lessons, memory science and playful practice.' },
        // Each program row opens an in-app detail page (ProgramDetail) with a class-switcher
        // at the top. Copy below is editable brand marketing — swap freely per program.
        { q: 'Our Programs', a: 'Live AI Teacher, Brain Gym, events and practice — across every stage.', programs: [
          {
            id: 'k2', label: 'Class K-2', tab: 'Class K-2',
            title: 'The playful start\nevery learner needs',
            sub: 'Curiosity-led early learning that builds number sense, focus and a love for figuring things out.',
            cta: 'Get Started',
            bodyTitle: 'We take care of all your child’s early foundations',
            body: 'Hands-on activities and gentle guidance help young learners build confidence with numbers, patterns and problem-solving — one small win at a time.',
            bullets: ['Number sense & counting', 'Focus and observation', 'Confidence with mistakes'],
          },
          {
            id: '35', label: 'Class 3-5', tab: 'Class 3-5',
            title: 'The strong foundation\nyour child needs',
            sub: 'The right guidance today is crucial to help them start their journey to mastery.',
            cta: 'Get Started',
            bodyTitle: 'We take care of all your child’s maths',
            body: 'Concept-first lessons and spaced practice turn shaky basics into a foundation your child can build on for years.',
            bullets: ['Core concepts, deeply understood', 'Daily mixed practice', 'Steady, visible progress'],
          },
          {
            id: '68', label: 'Class 6-8', tab: 'Class 6-8',
            title: 'Where real\nconfidence is built',
            sub: 'Middle-school is where habits form. We make sure they form the right ones.',
            cta: 'Get Started',
            bodyTitle: 'We take care of all your child’s learning',
            body: 'Structured practice, live doubt-solving and honest progress tracking keep your child ahead of the syllabus, not chasing it.',
            bullets: ['Concept mastery, not cramming', 'Live doubt-solving', 'Exam-ready practice'],
          },
          {
            id: 'imo', label: 'IMO', tab: 'IMO',
            title: 'Olympiad-ready\nthinking',
            sub: 'Sharpen problem-solving for IMO and school olympiads with structured, challenging practice.',
            cta: 'Get Started',
            bodyTitle: 'We build the problem-solvers of tomorrow',
            body: 'Curated olympiad-level problems and clear step-by-step reasoning stretch your child beyond the textbook.',
            bullets: ['Olympiad-level problem sets', 'Reasoning & proof skills', 'Timed mock rounds'],
          },
          {
            id: 'cueprep', label: 'Cueprep', tab: 'Cueprep',
            title: 'Exam preparation\nthat sticks',
            sub: 'Focused revision, mock tests and doubt-solving to walk into every exam prepared.',
            cta: 'Get Started',
            bodyTitle: 'We take care of the whole exam journey',
            body: 'Chapter-wise revision, full-length mock tests and instant doubt-solving turn exam stress into a clear plan.',
            bullets: ['Chapter-wise revision', 'Full-length mock tests', 'Instant doubt-solving'],
          },
        ] },
        { q: 'Resources', a: 'Free notes, revision guides, solutions and chapter-wise practice tests.' },
        { q: 'Tutoring', a: '1-on-1 and small-group tutoring with certified Ailernova mentors.' },
        { q: 'Partner with Us', a: 'Bring Ailernova events and programs to your school or city.' },
      ],
      offices: [
        { label: 'SUPPORT', lines: 'support@ailernova.com\nailernova.com' },
      ],
    },
  },
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
// Editorial section header: an uppercase tracked label followed by a hairline rule.
export function Label({ children }) {
  return (
    <View style={st.labelRow}>
      <T w="xbold" s={11.5} c={C.muted} style={st.label} accessibilityRole="header">{children}</T>
      <View style={st.labelRule} />
    </View>
  );
}

// Subtle top-lit sheen for light cards — a layered, premium glass surface. Sits behind
// card content (parent card needs overflow:hidden). Reused across widgets.
// NOTE: we measure the card in pixels (onLayout) and paint with gradientUnits=
// "userSpaceOnUse". Percentage rects underfill on Android, and viewBox + non-uniform
// stretch skews the gradient vector diagonally — both leave a visible seam. Exact
// pixels + a top→bottom vector is the only artifact-free way in react-native-svg.
export function CardGradient({ from = '#FFFFFF', to = '#F1F4FB' }) {
  const [d, setD] = React.useState({ w: 0, h: 0 });
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => setD({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) })}
    >
      {d.w > 0 && (
        <Svg width={d.w} height={d.h}>
          <Defs>
            <LG id="cardG" x1="0" y1="0" x2="0" y2={d.h} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={from} />
              <Stop offset="1" stopColor={to} />
            </LG>
          </Defs>
          <Rect x="0" y="0" width={d.w} height={d.h} fill="url(#cardG)" />
        </Svg>
      )}
    </View>
  );
}
export function Wordmark({ size = 18 }) {
  return <View style={{ flexDirection: 'row' }}>{WORDMARK.map(([c, col], i) => <T key={i} w="xbold" s={size} c={col}>{c}</T>)}</View>;
}

/* ---------- styles (exact from the teammate build + real-data states) ---------- */
// Premium soft elevation — larger, softer, lifted. Used by every card.
export const card = { shadowColor: '#0B1020', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 4 };
// Sharp, black-outlined card treatment used across the parent screens (MathGym look):
// perfectly square corners + a 2px hard black border. Spread onto any card container.
export const sharp = { borderRadius: 0, borderWidth: 2, borderColor: C.black };
export const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas, paddingTop: Platform.OS === 'android' ? 28 : 0 },
  screen: { flex: 1, backgroundColor: C.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  header: { backgroundColor: C.canvas, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.orange, borderWidth: 2, borderColor: '#111', alignItems: 'center', justifyContent: 'center' },
  gymPill: { backgroundColor: C.gold, borderRadius: 24, paddingLeft: 15, paddingRight: 7, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 8 },
  gymIcon: { backgroundColor: '#fff', borderRadius: 13, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, paddingHorizontal: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 26, marginBottom: 14 },
  label: { letterSpacing: 1.4, textTransform: 'uppercase' },
  labelRule: { flex: 1, height: 1, backgroundColor: C.hair },

  updateCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.peach, borderRadius: 16, padding: 14, width: 270, marginRight: 10 },
  updateIcon: { width: 42, height: 42, borderRadius: 11, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  piBadge: { position: 'absolute', right: -6, bottom: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF6E2', borderRadius: 16, padding: 14, width: 160 },
  streakIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },

  // ── MathGym-style Home: full-width, square, black-bordered stacked cards ──
  noticeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.peach, padding: 13, marginBottom: 2, ...sharp },
  noticeThumb: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...sharp },
  updateThumb: { width: 58, height: 58, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', ...sharp },
  updateThumbBadge: { position: 'absolute', right: -5, bottom: -5, width: 22, height: 22, borderRadius: 11, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  promoCard: { backgroundColor: '#C21FD6', padding: 20, overflow: 'hidden', ...sharp },
  promoImgWrap: { marginTop: 18, height: 190, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  promoCircle: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: '#F3A6E4', bottom: -34 },
  promoImg: { width: '100%', height: 190, resizeMode: 'contain' },

  // Green "ring" onboarding tooltip on the Progress calendar.
  ringTip: { backgroundColor: '#17A65A', padding: 14, marginTop: 2, marginBottom: 16, alignSelf: 'flex-start', maxWidth: '84%', ...sharp },
  ringTipBtn: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 9, alignSelf: 'flex-start', marginTop: 12 },

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
  noActivity: { padding: 22, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FAFAFB', ...sharp },
  statCard: { padding: 16, backgroundColor: '#fff', ...sharp },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  focusCard: { padding: 16, backgroundColor: '#fff', ...sharp },

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
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: C.hair, borderRadius: 18, padding: 16, backgroundColor: '#fff', ...card },
  bookCta: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, ...card },
  bookIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  pastRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  pastCheck: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' },
  notesTag: { backgroundColor: C.blueSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },

  // Docked navigation bar — full-width, anchored to the bottom edge (no side/bottom
  // gaps). Rounded top corners + upward shadow lift it off the content; the white fills
  // all the way down (paddingBottom = safe-area inset in BottomNav) so it covers the
  // system-nav strip completely.
  nav: { backgroundColor: '#FFFFFF', paddingTop: 10, paddingHorizontal: 10, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: 'rgba(20,20,40,0.06)', shadowColor: '#0B1020', shadowOpacity: 0.10, shadowRadius: 18, shadowOffset: { width: 0, height: -4 }, elevation: 18 },

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
