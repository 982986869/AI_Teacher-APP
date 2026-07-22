// src/screens/HomeScreen.js
// Student Home = an INTELLIGENT DECISION ENGINE, not a dashboard. On every open it reads
// the student's whole real state and elects the single most valuable next action for the
// HERO — then arranges supporting sections that each answer a DIFFERENT question, deduped
// against the hero so nothing repeats. It thinks like a learning coach (Duolingo / Cuemath
// / Khan), guiding the student ("Learn / Practice / Improve / Revise / Reflect / Celebrate")
// rather than advertising features.
//
// The hero is elected by priority from real signals:
//   celebrate-badge  → a badge was just unlocked (vs last visit)         → Celebrate
//   celebrate-goal   → this week's goals just got completed              → Celebrate
//   streak           → streak alive, not practised, and it's evening     → Save the streak
//   resume           → a lesson/concept is in progress (welcome-back if lapsed) → Learn
//   mistakes         → mistakes are pending                              → Improve
//   weak             → a weak topic was detected                         → Strengthen
//   new              → brand-new student, no activity yet                → Meet your teacher
//   next             → otherwise, the recommended next step / momentum   → Keep going
//
// All content is REAL (getParentReport student self-report + getActiveLesson + getResumeContext
// + a tiny local "last seen" snapshot to detect just-unlocked/just-completed). Global loading
// skeleton, error+retry, pull-to-refresh, per-section empty states. Distinct destinations per
// card — AI Teacher is only ONE of them.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, StatusBar, TouchableOpacity,
  Dimensions, Modal, Animated, Easing, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Svg, { Defs, RadialGradient, LinearGradient as LG, Stop, Rect, Circle, Path } from 'react-native-svg';
import {
  Bell, Flame, Star, TrendingUp, Play, ArrowRight, Sparkles, GraduationCap,
  CircleCheck, Bot, Dumbbell, Pencil, WandSparkles, Gauge, PartyPopper,
  Zap, Trophy, Target, BookOpen, MessageCircle, Swords, Lock, CircleAlert,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import AITeacherScreen from './AITeacherScreen';
import BrainGymFlow from './braingym/BrainGymFlow';
import { useRuntimeConfig } from '../context/RuntimeConfigContext';
import OptionalUpdateBanner from '../components/OptionalUpdateBanner';
import { getParentReport } from '../api/parentApi';
import { getResumeContext } from '../api/aiApi';
import { getActiveLesson, getHomeState, saveHomeState } from '../utils/storage';
import { T } from './parent/ParentApp/constants';
import { S, shadow, shadowSm } from '../theme/studentTheme';
import {
  FadeInOnce, FadeIn, PressableScale, CountUp, GrowFill, GrowBar,
  Breathe, Float, Pulse, PulseRing, Nudge, Wave, PopIn, Shine, Shimmer,
} from './parent/ParentApp/anim';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 18;
const AIT_SUBJECTS = ['Physics', 'Maths', 'Chemistry', 'Biology', 'English', 'History'];

// ─── Character identities ─────────────────────────────────────────────────────
const CHARS = [
  { name: 'The Explorer',  role: 'Curious Learner',  emoji: '🧭', tint: S.indigo,  tintBg: S.indigoSoft },
  { name: 'The Scientist', role: 'Problem Solver',   emoji: '🔬', tint: S.emerald, tintBg: S.emeraldSoft },
  { name: 'The Artist',    role: 'Creative Thinker', emoji: '🎨', tint: S.orange,  tintBg: S.orangeSoft },
  { name: 'The Champion',  role: 'Goal Achiever',    emoji: '🏆', tint: S.gold,    tintBg: S.goldSoft },
  { name: 'The Dreamer',   role: 'Big Thinker',      emoji: '💭', tint: S.purple,  tintBg: S.purpleSoft },
  { name: 'The Ninja',     role: 'Speed Learner',    emoji: '⚡', tint: S.cyan,    tintBg: S.cyanSoft },
];
const CharAvatar = ({ char, size = 46, ring = S.hair }) => (
  <View style={{
    width: size, height: size, borderRadius: size / 2, backgroundColor: char.tintBg,
    borderWidth: ring ? 2 : 0, borderColor: ring, alignItems: 'center', justifyContent: 'center',
  }}>
    <T style={{ fontSize: size * 0.44 }}>{char.emoji}</T>
  </View>
);

const SUBJECT_QS = {
  Physics:   ['Explain gravity 🌍', 'Laws of motion?', 'What is velocity?', 'What is energy?'],
  Maths:     ['Solve x²+5x+6=0', 'What is integration?', 'Pythagoras theorem?', 'What is a prime?'],
  Chemistry: ['What is pH?', 'Explain bonding', 'What are isotopes?', 'Periodic table tips?'],
  Biology:   ['How does DNA work?', 'Explain photosynthesis', 'What is osmosis?', 'How do cells divide?'],
  English:   ['Grammar tips?', 'How to write essay?', 'What is metaphor?', 'Improve vocabulary?'],
  History:   ['WW2 causes?', 'Industrial Revolution?', 'Who was Gandhi?', 'French Revolution?'],
};
const QPILL = [
  { bg: S.indigoSoft, text: S.indigo }, { bg: S.emeraldSoft, text: S.emerald },
  { bg: S.orangeSoft, text: S.orange }, { bg: S.cyanSoft, text: S.cyan }, { bg: S.purpleSoft, text: S.purple },
];

const ICONS = {
  sparkle: Sparkles, dumbbell: Dumbbell, zap: Zap, trophy: Trophy, flame: Flame,
  target: Target, book: BookOpen, message: MessageCircle, swords: Swords, alert: CircleAlert,
};
const TONES = {
  green: { tint: S.emerald, bg: S.emeraldSoft }, peach: { tint: S.orange, bg: S.orangeSoft },
  blue: { tint: S.blue, bg: S.blueSoft }, gold: { tint: S.gold, bg: S.goldSoft },
  violet: { tint: S.purple, bg: S.purpleSoft },
};
const ACT = {
  quiz:    { Icon: CircleCheck,   tint: S.emerald, bg: S.emeraldSoft },
  doubt:   { Icon: MessageCircle, tint: S.purple,  bg: S.purpleSoft },
  mistake: { Icon: CircleAlert,   tint: S.orange,  bg: S.orangeSoft },
  lesson:  { Icon: Play,          tint: S.blue,    bg: S.blueSoft },
  arena:   { Icon: Swords,        tint: S.gold,    bg: S.goldSoft },
};

function timeAgo(at) {
  if (!at) return '';
  const t = new Date(at).getTime();
  if (Number.isNaN(t)) return '';
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  return new Date(at).toLocaleDateString();
}

// ── soft radial glow disc ──
let _gid = 0;
function SoftGlow({ size = 120, color = S.heroGlow, opacity = 0.5 }) {
  const id = useRef('g' + (_gid++)).current;
  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx={size / 2} cy={size / 2} r={size / 2} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="0.6" stopColor={color} stopOpacity={opacity * 0.4} />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill={`url(#${id})`} />
    </Svg>
  );
}

// ── deep gradient surface for premium dark cards ──
function InkSurface({ a = S.heroA, b = S.heroB, glow = S.heroGlow, radius = 0 }) {
  const [d, setD] = useState({ w: 0, h: 0 });
  const id = useRef('ink' + (_gid++)).current;
  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]} pointerEvents="none"
      onLayout={(e) => setD({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) })}>
      {d.w > 0 && (
        <Svg width={d.w} height={d.h}>
          <Defs>
            <LG id={`${id}g`} x1="0" y1="0" x2={d.w} y2={d.h} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={a} />
              <Stop offset="1" stopColor={b} />
            </LG>
            <RadialGradient id={`${id}h`} cx={d.w * 0.82} cy={d.h * 0.12} r={d.w * 0.72} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={glow} stopOpacity="0.4" />
              <Stop offset="1" stopColor={glow} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width={d.w} height={d.h} fill={`url(#${id}g)`} />
          <Rect width={d.w} height={d.h} fill={`url(#${id}h)`} />
        </Svg>
      )}
    </View>
  );
}

// ── circular progress ring ──
function Ring({ pct = 0, size = 68, stroke = 7, color = '#fff', track = 'rgba(255,255,255,0.22)', children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${circ}`} strokeDashoffset={off} strokeLinecap="round" />
      </Svg>
      {children}
    </View>
  );
}

// ── mini spinning "radar" wheel (Brain Gym motif) ──
const mPolar = (r, deg) => { const rad = (deg * Math.PI) / 180; return { x: 50 + r * Math.sin(rad), y: 50 - r * Math.cos(rad) }; };
const mWedge = (a0, a1, rOut, rIn) => {
  const large = a1 - a0 > 180 ? 1 : 0;
  const p1 = mPolar(rOut, a0), p2 = mPolar(rOut, a1), p3 = mPolar(rIn, a1), p4 = mPolar(rIn, a0);
  return [`M ${p1.x} ${p1.y}`, `A ${rOut} ${rOut} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`, `A ${rIn} ${rIn} 0 ${large} 0 ${p4.x} ${p4.y}`, 'Z'].join(' ');
};
const MINI_SEGS = [{ a0: -45, a1: 45 }, { a0: 45, a1: 135 }, { a0: 135, a1: 225 }, { a0: 225, a1: 315 }];
function MiniWheel({ size = 84 }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute' }}><SoftGlow size={size + 20} color="#C6ABFF" opacity={0.5} /></View>
      <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {[20, 32, 46].map((r, i) => (
            <Circle key={i} cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          ))}
          {MINI_SEGS.map((sg, i) => (
            <Path key={i} d={mWedge(sg.a0 + 5, sg.a1 - 5, 46, 33)}
              fill={i === 0 ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.17)'} />
          ))}
        </Svg>
      </Animated.View>
      <View style={hs.bgHub}><Play size={13} color="#4A2E9C" strokeWidth={3} fill="#4A2E9C" /></View>
    </View>
  );
}

// ── section header ──
function Section({ title, accent = S.indigo, sub }) {
  return (
    <View style={hs.secHead}>
      <View style={[hs.secDot, { backgroundColor: accent }]} />
      <T w="black" s={16} c={S.ink} style={{ letterSpacing: -0.3 }}>{title}</T>
      {!!sub && <T w="bold" s={11.5} c={S.faint} style={{ marginLeft: 'auto' }}>{sub}</T>}
    </View>
  );
}

// ── separated stat card ──
function StatCard({ Icon, tint, tintBg, value, suffix = '', label, isText, delay = 0 }) {
  // Count up only on first appearance; on a background refresh (value changes) snap to the
  // new number instead of flashing back to 0. (F4)
  const first = useRef(true);
  useEffect(() => { first.current = false; }, []);
  return (
    <FadeInOnce id={`stat-${label}`} delay={delay} y={12} style={{ flex: 1 }}>
      <View style={hs.statCard}>
        <View style={[hs.statIcon, { backgroundColor: tintBg }]}><Icon size={16} color={tint} strokeWidth={2.7} /></View>
        <View style={{ marginTop: 9 }}>
          {isText ? (
            <T w="black" s={19} c={S.ink}>{value}</T>
          ) : first.current ? (
            <CountUp value={value} suffix={suffix} duration={900} w="black" s={19} c={S.ink} />
          ) : (
            <T w="black" s={19} c={S.ink}>{value}{suffix}</T>
          )}
        </View>
        <T w="semi" s={10.5} c={S.muted} style={{ marginTop: 1 }}>{label}</T>
      </View>
    </FadeInOnce>
  );
}

// ── achievement badge ──
function Badge({ item, delay = 0 }) {
  const Icon = ICONS[item.icon] || Trophy;
  const earned = !!item.unlocked;
  return (
    <PopIn delay={delay} style={{ width: 96, alignItems: 'center' }}>
      <Float distance={earned ? 6 : 0} duration={2600}>
        <View style={[hs.badge, !earned && hs.badgeLocked]}>
          {earned && <View style={{ position: 'absolute' }}><SoftGlow size={74} color={S.gold} opacity={0.5} /></View>}
          <Icon size={26} color={earned ? S.gold : S.faint} strokeWidth={2.4} />
          {earned && <Shine delay={1200} gap={4200} width={30} />}
        </View>
      </Float>
      <T w="bold" s={10.5} c={earned ? S.ink : S.faint} numberOfLines={2} style={{ textAlign: 'center', marginTop: 8, lineHeight: 13 }}>{item.title}</T>
      {!earned && item.progress > 0 && (
        <View style={hs.badgeBar}><View style={{ width: `${Math.round(item.progress * 100)}%`, height: '100%', borderRadius: 3, backgroundColor: S.faint }} /></View>
      )}
    </PopIn>
  );
}

// ── the elected HERO — a single card rendered from the decision engine's `intent` ──
function HeroCard({ intent }) {
  const Deco = intent.Deco || GraduationCap;
  const TagIcon = intent.TagIcon;
  return (
    <FadeInOnce id={`hero-${intent.key}`} delay={40} y={16}>
      <View style={[hs.clShadow, { shadowColor: intent.shadow || '#241C55' }]}>
        <View style={hs.cl}>
          <InkSurface a={intent.a} b={intent.b} glow={intent.glow} radius={24} />
          <Float distance={9} duration={4200} style={{ position: 'absolute', top: -14, right: -16 }}>
            <Deco size={132} color="rgba(255,255,255,0.10)" strokeWidth={1.3} />
          </Float>
          {intent.celebrate && (
            <>
              <Float distance={7} duration={3400} style={{ position: 'absolute', top: 14, right: 20 }}><T style={{ fontSize: 18 }}>🎉</T></Float>
              <Float distance={9} duration={4200} style={{ position: 'absolute', top: 54, right: 70 }}><Sparkles size={15} color="rgba(255,255,255,0.5)" strokeWidth={2.4} /></Float>
            </>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={hs.clTag}>
              {TagIcon
                ? <Pulse from={0.85} to={1.15} duration={1400}><TagIcon size={11} color={intent.tagTint} strokeWidth={2.8} /></Pulse>
                : <Wave><T s={11}>👋</T></Wave>}
              <T w="xbold" s={10} c={intent.tagTint} style={{ letterSpacing: 1 }}>{intent.tag}</T>
            </View>
            {intent.streakChip > 0 && (
              <View style={hs.streakChip}><Flame size={11} color="#FF9558" strokeWidth={2.8} /><T w="xbold" s={10.5} c="#fff">{intent.streakChip}</T></View>
            )}
          </View>
          <T w="black" s={intent.big || 22} c="#fff" style={{ marginTop: 10, letterSpacing: -0.3 }} numberOfLines={2}>{intent.headline}</T>
          <T w="semi" s={12.5} c="rgba(255,255,255,0.68)" style={{ marginTop: 4 }} numberOfLines={2}>{intent.sub}</T>
          <Breathe>
            <PressableScale style={hs.clCta} onPress={intent.onPress} accessibilityLabel={intent.ctaLabel}>
              <Shine delay={1400} gap={3400} />
              <T w="bold" s={14.5} c={intent.ctaTint}>{intent.ctaLabel}</T>
              <Nudge distance={5}><ArrowRight size={18} color={intent.ctaTint} strokeWidth={2.8} /></Nudge>
            </PressableScale>
          </Breathe>
        </View>
      </View>
    </FadeInOnce>
  );
}

// ── loading skeleton ──
function Skeleton() {
  return (
    <View style={{ paddingHorizontal: PAD, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[0, 1, 2].map((i) => <Shimmer key={i} w="100%" h={92} r={18} style={{ flex: 1 }} />)}
      </View>
      <Shimmer w="100%" h={188} r={24} mt={18} />
      <Shimmer w={150} h={16} r={8} mt={26} />
      <Shimmer w="100%" h={96} r={20} mt={12} />
      <Shimmer w={150} h={16} r={8} mt={26} />
      <Shimmer w="100%" h={120} r={22} mt={12} />
    </View>
  );
}

// ── error state ──
function ErrorState({ onRetry }) {
  return (
    <View style={hs.center}>
      <View style={hs.errIcon}><CircleAlert size={30} color={S.muted} strokeWidth={2} /></View>
      <T w="xbold" s={18} c={S.ink}>Couldn’t load your home</T>
      <T w="med" s={13} c={S.muted} style={{ textAlign: 'center' }}>Check your connection and try again.</T>
      <PressableScale style={hs.retryBtn} onPress={onRetry}><T w="bold" s={14} c="#fff">Retry</T></PressableScale>
    </View>
  );
}

// ── acknowledgement toast — a satisfying "welcome back" when the student returns to
// Home having earned XP or extended a streak elsewhere (a lesson, a quiz, a Brain Gym set).
// Springs down, holds, then lifts away. pointerEvents none so it never blocks a tap. ──
function Toast({ data, top, onDone }) {
  const y = useRef(new Animated.Value(-30)).current;
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(y, { toValue: 0, useNativeDriver: true, damping: 14, stiffness: 180, mass: 0.9 }),
      Animated.timing(o, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(y, { toValue: -30, duration: 260, useNativeDriver: true }),
        Animated.timing(o, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished && onDone) onDone(); });
    }, 2600);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View pointerEvents="none" style={[hs.toastWrap, { top, opacity: o, transform: [{ translateY: y }] }]}>
      <View style={hs.toast}>
        <T s={17}>{data.emoji}</T>
        <View>
          <T w="xbold" s={13} c="#fff">{data.title}</T>
          {!!data.sub && <T w="semi" s={10.5} c="rgba(255,255,255,0.72)" style={{ marginTop: 1 }}>{data.sub}</T>}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
const HomeScreen = () => {
  const { user, selectedClass, scope } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const scrollRef = useRef(null);

  const [charIdx, setCharIdx]             = useState(0);
  const [showCharModal, setShowCharModal] = useState(false);
  const [tempChar, setTempChar]           = useState(0);
  const [activeSubject, setActiveSubject] = useState('Physics');
  const [showAITeacher, setShowAITeacher] = useState(false);
  const [seedTopic, setSeedTopic]         = useState('');
  // Immersive AI Teacher: hide the bottom nav dock while the teacher screen is open
  // (the AI Teacher has its own back button), so a lesson feels full-screen and focused.
  useEffect(() => {
    navigation.setOptions({ tabBarStyle: showAITeacher ? { display: 'none' } : undefined });
    return () => navigation.setOptions({ tabBarStyle: undefined });
  }, [showAITeacher, navigation]);
  const [showBrainGym, setShowBrainGym]   = useState(false);
  const currentChar = CHARS[charIdx];

  const [report, setReport]       = useState(null);
  const [resume, setResume]       = useState({ active: null, ctx: null });
  const [homeSeen, setHomeSeen]   = useState(undefined); // undefined = not loaded yet
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const mounted = useRef(true);
  const initialLoad = useRef(true);
  const prevStats = useRef(null); // last-seen {xp, streak} to detect progress on return
  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async (isRefresh) => {
    try {
      const [rep, active, ctx, seen] = await Promise.all([
        getParentReport(),
        getActiveLesson().catch(() => null),
        getResumeContext().catch(() => null),
        getHomeState().catch(() => null),
      ]);
      if (!mounted.current) return;
      setReport(rep || null);
      setResume({ active: active || null, ctx: ctx || null });
      // Acknowledge progress made elsewhere: if XP grew or the streak extended since the
      // last time we saw Home, greet the student with a brief celebratory toast. This is
      // what makes finishing a lesson / quiz / Brain Gym feel like it "counted" on return.
      const nx = Number(rep?.brainGym?.totalXp) || 0;
      const ns = Number(rep?.brainGym?.currentStreak) || 0;
      if (prevStats.current) {
        if (ns > prevStats.current.streak && ns > 1) setToast({ emoji: '🔥', title: `${ns}-day streak!`, sub: 'You’re on fire — keep it going' });
        else if (nx > prevStats.current.xp) setToast({ emoji: '🎉', title: `+${nx - prevStats.current.xp} XP earned`, sub: 'Nice work — that’s real progress' });
      }
      prevStats.current = { xp: nx, streak: ns };
      // First ever visit: baseline the "seen" snapshot silently so we never celebrate
      // milestones the student already had. Subsequent visits compare against it.
      if (seen == null) {
        const baseUnlocked = Number(rep?.achievements?.unlockedCount) || 0;
        setHomeSeen({ seenUnlocked: baseUnlocked, celebratedGoalWeek: null, _baseline: true });
        saveHomeState({ seenUnlocked: baseUnlocked });
      } else {
        setHomeSeen(seen);
      }
      setErr(false);
    } catch (_) {
      if (!mounted.current) return;
      if (!isRefresh) setErr(true);
    } finally {
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);
  // Refetch whenever the Home tab regains focus so progress made elsewhere (a finished
  // lesson, a Brain Gym set, a newly-earned badge) is reflected the instant you land here.
  // First focus does a full load (skeleton); later focuses refresh silently in the background.
  useFocusEffect(useCallback(() => {
    load(!initialLoad.current);
    initialLoad.current = false;
  }, [load]));
  // Re-tapping the already-active Home tab scrolls back to the top (standard, expected).
  useEffect(() => {
    const unsub = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return unsub;
  }, [navigation]);
  const onRefresh = () => { setRefreshing(true); load(true); };
  const retry = () => { setLoading(true); setErr(false); load(false); };

  // Feature flags — when a feature is off it cannot be launched from anywhere on Home,
  // and its dedicated entry section is hidden below. Fail-open (missing flag = on).
  const { isFeatureEnabled } = useRuntimeConfig();
  const aiTeacherOn = isFeatureEnabled('aiTeacher');
  const brainGymOn = isFeatureEnabled('brainGym');

  const openAITeacher = (topic = '', subject) => {
    if (!aiTeacherOn) return;
    setSeedTopic(topic);
    if (subject && AIT_SUBJECTS.includes(subject)) setActiveSubject(subject);
    setShowAITeacher(true);
  };
  const openBrainGym = () => { if (!brainGymOn) return; setShowBrainGym(true); };
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ── real signals ──
  const bg        = report?.brainGym || {};
  const streak    = Number(bg.currentStreak) || 0;
  const xp        = Number(bg.totalXp) || 0;
  const accuracy  = Number(bg.accuracy) || 0;
  const totalQuiz = Number(bg.quizzesCompleted) || 0;
  const lessons   = Number(report?.aiTeacher?.lessons) || 0;
  const firstName = report?.child?.firstName || user?.name?.split(' ')[0] || 'there';
  const weeklyGoals = report?.weeklyGoals || null;
  const week      = report?.weeklyActivity || [];
  const summary   = report?.weeklySummary || {};
  const badges    = report?.achievements?.items || [];
  const unlocked  = Number(report?.achievements?.unlockedCount) || 0;
  const recs      = report?.recommendations || [];
  const nextStep  = report?.recommendedNextStep || null;
  const activity  = report?.learningTimeline || [];
  const sessionsOn = !!report?.features?.sessions;
  const openMistakes = Number(report?.openMistakes) || 0;
  const weakAreas = report?.weakAreas || [];
  const weakTop   = weakAreas[0]?.chapter || weakAreas[0]?.subject || null;
  const active    = resume.active;
  const ctx       = resume.ctx;
  const practicedToday = (Number(report?.today?.quizzes) || 0) > 0;
  const daysSince = typeof ctx?.daysSince === 'number' ? ctx.daysSince : null;

  const hasActivity = totalQuiz > 0 || lessons > 0 || activity.length > 0 || !!active || !!ctx?.hasHistory;
  const contTitle   = active?.title || ctx?.focusConcept?.concept || ctx?.last?.chapter || null;
  const contSubject = active?.subject || ctx?.focusConcept?.subject || ctx?.last?.subject || null;
  const lapsed = daysSince != null ? daysSince >= 2 : (!practicedToday && streak === 0 && hasActivity);

  // week key (Sun-aligned) for "celebrate this week's goal, once"
  const _t = new Date(); _t.setHours(0, 0, 0, 0);
  const _ws = new Date(_t); _ws.setDate(_t.getDate() - _t.getDay());
  const weekKey = _ws.toISOString().slice(0, 10);
  const goalDone = !!(weeklyGoals && weeklyGoals.goals.length > 0 && weeklyGoals.metCount >= weeklyGoals.goals.length);

  const seenReady = homeSeen !== undefined;
  const newlyUnlocked = seenReady && homeSeen && !homeSeen._baseline
    && typeof homeSeen.seenUnlocked === 'number' && unlocked > homeSeen.seenUnlocked;
  const goalCelebrateDue = seenReady && goalDone && homeSeen && homeSeen.celebratedGoalWeek !== weekKey && !homeSeen._baseline;
  const streakAtRisk = streak >= 1 && !practicedToday && hour >= 17;

  // AI Teacher subjects (real, class-aware)
  const realSubjects = report?.child?.subjects || scope?.subjects || [];
  const known = Object.keys(SUBJECT_QS);
  const inter = realSubjects.filter((s) => known.includes(s));
  const subjectChips = (inter.length ? inter : known)
    .filter((s) => !(selectedClass === 'Class 12' && s === 'Biology'));

  const runRec = (rec) => {
    if (!rec) { openAITeacher(); return; }
    const id = rec.id || rec.action;
    if (id === 'start' || id === 'streak' || id === 'braingym' || id === 'arena') { openBrainGym(); return; }
    if (id === 'weak') { openAITeacher(String(rec.title || '').replace(/^Revisit\s+/i, '')); return; }
    openAITeacher();
  };

  // ── THE DECISION ENGINE — elect one hero by priority ──
  const newestBadge = [...badges].reverse().find((b) => b.unlocked) || null;
  let intent, heroRecId = null;
  if (newlyUnlocked) {
    intent = {
      key: 'celebrate-badge', celebrate: true, Deco: Trophy, TagIcon: PartyPopper,
      a: '#E0A32E', b: '#8A5A16', glow: '#FFD98A', shadow: '#7A4E12', tagTint: '#FFE9B0', ctaTint: S.gold,
      tag: 'ACHIEVEMENT UNLOCKED', headline: newestBadge ? `“${newestBadge.title}” unlocked! 🎉` : 'New badge unlocked! 🎉',
      sub: 'You’re making real progress — keep the momentum going.',
      ctaLabel: contTitle ? 'Continue learning' : 'Keep training',
      onPress: () => (contTitle ? openAITeacher(contTitle, contSubject) : openBrainGym()),
    };
  } else if (goalCelebrateDue) {
    intent = {
      key: 'celebrate-goal', celebrate: true, Deco: Trophy, TagIcon: CircleCheck,
      a: '#12A05E', b: '#0A5B37', glow: '#7BEBB0', shadow: '#0A5B37', tagTint: '#C7F6DE', ctaTint: S.emerald,
      tag: 'WEEKLY GOAL COMPLETE', headline: 'You smashed this week’s goals! 🎉',
      sub: 'Every target met. Fancy a bonus round to stretch further?',
      ctaLabel: 'Bonus Brain Gym', onPress: openBrainGym,
    };
  } else if (streakAtRisk) {
    intent = {
      key: 'streak', Deco: Flame, TagIcon: Flame,
      a: '#E8792E', b: '#8A3D12', glow: '#FFB877', shadow: '#8A3D12', tagTint: '#FFD9BC', ctaTint: S.orange,
      tag: 'KEEP YOUR STREAK', headline: `Don’t lose your ${streak}-day streak 🔥`,
      sub: 'One quick set before the day ends keeps it alive.',
      ctaLabel: 'Save my streak', onPress: openBrainGym,
    };
  } else if (contTitle) {
    intent = {
      key: 'resume', Deco: GraduationCap, TagIcon: Play, streakChip: lapsed ? 0 : streak,
      a: '#4A3AA6', b: '#241C55', glow: S.heroGlow, tagTint: S.heroGlow, ctaTint: S.indigo,
      tag: lapsed ? 'WELCOME BACK' : 'CONTINUE LEARNING',
      headline: lapsed ? `Pick up ${contTitle}` : contTitle,
      sub: lapsed
        ? `It’s been ${daysSince != null ? `${daysSince} day${daysSince === 1 ? '' : 's'}` : 'a while'} — let’s get back on track.`
        : `${contSubject ? contSubject + ' · ' : ''}Pick up where you left off`,
      ctaLabel: 'Resume lesson', onPress: () => openAITeacher(contTitle, contSubject),
    };
  } else if (openMistakes > 0) {
    heroRecId = 'mistakes';
    intent = {
      key: 'mistakes', Deco: Target, TagIcon: CircleAlert,
      a: '#B25A2A', b: '#5E2C12', glow: '#FFC08A', shadow: '#5E2C12', tagTint: '#FFD9BC', ctaTint: S.orange,
      tag: 'TURN MISTAKES INTO MASTERY', headline: `Fix ${openMistakes} mistake${openMistakes > 1 ? 's' : ''}`,
      sub: 'Reviewing what tripped you up locks the concept in for good.',
      ctaLabel: 'Review with your teacher', onPress: () => openAITeacher(),
    };
  } else if (weakTop) {
    heroRecId = 'weak';
    intent = {
      key: 'weak', Deco: Target, TagIcon: Target,
      a: '#2A5BC4', b: '#12295E', glow: '#8FB4FF', shadow: '#12295E', tagTint: '#CFE0FF', ctaTint: S.blue,
      tag: 'STRENGTHEN A WEAK SPOT', headline: `Let’s strengthen ${weakTop}`,
      sub: 'A little focused practice turns this into one of your strengths.',
      ctaLabel: `Practise ${weakTop}`, onPress: () => openAITeacher(weakTop),
    };
  } else if (!hasActivity) {
    intent = {
      key: 'new', Deco: GraduationCap, TagIcon: null, big: 23,
      a: '#5A45C7', b: '#2A1E63', glow: '#A8B0FF', tagTint: '#C7CCFF', ctaTint: S.indigo,
      tag: 'WELCOME TO AILERNOVA', headline: `Meet your AI teacher, ${firstName}!`,
      sub: 'Ask anything or start a guided lesson — we’ll find your level together.',
      ctaLabel: 'Start learning', onPress: () => openAITeacher('', activeSubject),
    };
  } else {
    heroRecId = nextStep?.action || null;
    intent = {
      key: 'next', Deco: GraduationCap, TagIcon: Play, streakChip: streak,
      a: '#4A3AA6', b: '#241C55', glow: S.heroGlow, tagTint: S.heroGlow, ctaTint: S.indigo,
      tag: 'TODAY’S FOCUS', headline: nextStep?.title || 'Start today’s lesson',
      sub: nextStep?.subtitle || 'A short session keeps your momentum going.',
      ctaLabel: 'Start now', onPress: () => runRec(nextStep),
    };
  }

  // ── supporting sections — each answers a DIFFERENT question, deduped vs the hero ──
  const heroUsesBrainGym = intent.onPress === openBrainGym;
  let order;
  if (intent.key === 'new') {
    order = ['path', 'practice', 'doubt', 'session'];
  } else if (intent.key === 'celebrate-badge') {
    order = ['achievements', 'progress', 'upnext', 'practice', 'doubt', 'activity', 'session'];
  } else if (intent.key === 'celebrate-goal') {
    order = ['progress', 'achievements', 'upnext', 'doubt', 'activity', 'session'];
  } else if (intent.key === 'streak') {
    order = ['goal', 'upnext', 'doubt', 'progress', 'achievements', 'activity', 'session'];
  } else if (intent.key === 'mistakes' || intent.key === 'weak') {
    order = ['practice', 'upnext', 'goal', 'progress', 'achievements', 'activity', 'doubt', 'session'];
  } else if (intent.key === 'next') {
    order = ['goal', 'practice', 'doubt', 'progress', 'achievements', 'activity', 'session'];
  } else { // resume
    order = ['upnext', 'goal', 'practice', 'doubt', 'progress', 'achievements', 'activity', 'session'];
  }
  if (heroUsesBrainGym) order = order.filter((k) => k !== 'practice'); // dedupe practice vs a Brain-Gym hero

  // For "Up next", pick the top recommendation that ISN'T what the hero already covers.
  const upnextRec = recs.find((r) => (r.id || r.action) !== heroRecId) || null;

  // Persist celebration "seen" so we don't re-celebrate next launch (this visit still shows it).
  useEffect(() => {
    if (!seenReady) return;
    if (intent.key === 'celebrate-badge') saveHomeState({ seenUnlocked: unlocked });
    else if (intent.key === 'celebrate-goal') saveHomeState({ celebratedGoalWeek: weekKey });
  }, [intent.key, seenReady, unlocked, weekKey]);

  const renderSection = (key) => {
    switch (key) {
      case 'path': {
        const steps = [
          { Icon: Bot, tint: S.indigo, bg: S.indigoSoft, title: 'Learn', sub: 'Guided AI lessons, one concept at a time' },
          { Icon: Dumbbell, tint: S.purple, bg: S.purpleSoft, title: 'Practice', sub: 'Sharpen skills in Brain Gym' },
          { Icon: Trophy, tint: S.gold, bg: S.goldSoft, title: 'Master', sub: 'Build streaks, XP & badges' },
        ];
        return (
          <React.Fragment key={key}>
            <Section title="How you’ll learn" accent={S.indigo} />
            <FadeInOnce id="s-path" delay={30} y={14}>
              <View style={hs.card}>
                {steps.map((st, i) => (
                  <View key={st.title} style={[hs.pathRow, i < steps.length - 1 && hs.pathDivider]}>
                    <View style={hs.pathNum}><T w="black" s={12} c={S.faint}>{i + 1}</T></View>
                    <View style={[hs.pathIcon, { backgroundColor: st.bg }]}><st.Icon size={18} color={st.tint} strokeWidth={2.5} /></View>
                    <View style={{ flex: 1 }}>
                      <T w="xbold" s={14} c={S.ink}>{st.title}</T>
                      <T w="semi" s={11.5} c={S.muted} style={{ marginTop: 1 }}>{st.sub}</T>
                    </View>
                  </View>
                ))}
              </View>
            </FadeInOnce>
          </React.Fragment>
        );
      }

      case 'goal': {
        if (!weeklyGoals) return null;
        return (
          <React.Fragment key={key}>
            <Section title="Weekly goal" accent={S.emerald} sub={`${weeklyGoals.metCount} / ${weeklyGoals.goals.length} done`} />
            <FadeInOnce id="s-goal" delay={30} y={14}>
              <View style={hs.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Ring pct={(weeklyGoals.overall || 0) / 100} size={58} stroke={6} color={S.emerald} track={S.hair}>
                    <T w="black" s={13} c={S.emerald}>{weeklyGoals.overall || 0}%</T>
                  </Ring>
                  <View style={{ flex: 1, gap: 9 }}>
                    {weeklyGoals.goals.map((g) => (
                      <View key={g.id}>
                        <View style={hs.rowBetween}>
                          <T w="bold" s={11.5} c={S.sub}>{g.label}</T>
                          <T w="xbold" s={11.5} c={g.done ? S.emerald : S.muted}>{g.value}/{g.target}{g.unit ? ` ${g.unit}` : ''}</T>
                        </View>
                        <View style={hs.goalBar}>
                          <GrowFill pct={g.pct} color={g.done ? S.emerald : S.indigo} delay={200} style={{ height: '100%', borderRadius: 4 }} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </FadeInOnce>
          </React.Fragment>
        );
      }

      case 'practice':
        if (!brainGymOn) return null; // Brain Gym feature flag off → hide the section
        return (
          <React.Fragment key={key}>
            <Section title="Sharpen your thinking" accent={S.purple} sub={streak > 0 ? `${streak}-day streak 🔥` : 'Brain Gym'} />
            <FadeInOnce id="s-braingym" delay={40} y={16}>
              <View style={hs.bgShadow}>
                <PressableScale style={hs.bg} onPress={openBrainGym} accessibilityLabel="Open Brain Gym">
                  <InkSurface a="#6D4AC0" b="#301E66" glow="#C6ABFF" radius={22} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <View style={hs.bgTag}>
                        <Pulse from={0.85} to={1.15} duration={1500}><Sparkles size={10} color="#E7DBFF" strokeWidth={2.8} /></Pulse>
                        <T w="xbold" s={9.5} c="#E7DBFF" style={{ letterSpacing: 1 }}>SPIN & TRAIN</T>
                      </View>
                      <T w="black" s={18} c="#fff" style={{ marginTop: 8, letterSpacing: -0.3 }}>Focus, memory & speed</T>
                      <T w="semi" s={12} c="rgba(255,255,255,0.66)" style={{ marginTop: 2 }}>A quick daily workout for your brain</T>
                    </View>
                    <MiniWheel size={84} />
                  </View>
                </PressableScale>
              </View>
            </FadeInOnce>
          </React.Fragment>
        );

      case 'upnext': {
        if (!upnextRec) return null;
        const Icon = ICONS[upnextRec.icon] || Sparkles;
        const tone = TONES[upnextRec.tone] || TONES.violet;
        return (
          <React.Fragment key={key}>
            <View style={hs.secHead}>
              <View style={[hs.secDot, { backgroundColor: S.purple }]} />
              <T w="black" s={16} c={S.ink} style={{ letterSpacing: -0.3 }}>What to learn next</T>
              <Pulse from={0.85} to={1.15} duration={1500} style={{ marginLeft: 6 }}><Sparkles size={15} color={S.purple} strokeWidth={2.6} /></Pulse>
            </View>
            <FadeInOnce id="s-upnext" delay={30} y={14}>
              <PressableScale onPress={() => runRec(upnextRec)} accessibilityLabel={upnextRec.title}>
                <View style={[hs.card, hs.upnext]}>
                  <View style={[hs.upnextIcon, { backgroundColor: tone.bg }]}><Icon size={22} color={tone.tint} strokeWidth={2.5} /></View>
                  <View style={{ flex: 1 }}>
                    <T w="black" s={15} c={S.ink} numberOfLines={1}>{upnextRec.title}</T>
                    <T w="semi" s={11.5} c={S.muted} style={{ marginTop: 2 }} numberOfLines={2}>{upnextRec.do || upnextRec.why}</T>
                  </View>
                  <View style={[hs.upnextGo, { backgroundColor: tone.tint }]}><ArrowRight size={16} color="#fff" strokeWidth={2.8} /></View>
                </View>
              </PressableScale>
            </FadeInOnce>
          </React.Fragment>
        );
      }

      case 'doubt':
        if (!aiTeacherOn) return null; // AI Teacher feature flag off → hide the section
        return (
          <FadeInOnce id="s-ai" delay={80} y={16} key={key}>
            <View style={[hs.aiCard, { marginTop: 22 }]}>
              <View style={hs.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                  <View style={hs.aiAvatar}>
                    <Pulse from={0.92} to={1.08} duration={2400}><Bot size={22} color={S.emerald} strokeWidth={2.4} /></Pulse>
                  </View>
                  <View>
                    <T w="black" s={15.5} c={S.ink}>Stuck on something?</T>
                    <T w="semi" s={10.5} c={S.muted} style={{ marginTop: 1 }}>Ask your AI teacher — instant help</T>
                  </View>
                </View>
                <View style={hs.online}>
                  <View style={hs.onlineDot}><PulseRing color={S.emerald} size={6} /><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: S.emerald }} /></View>
                  <T w="xbold" s={10} c={S.emerald}>Online</T>
                </View>
              </View>

              <T w="xbold" s={9.5} c={S.faint} style={{ letterSpacing: 0.8, marginTop: 16, marginBottom: 9 }}>YOUR SUBJECTS</T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {subjectChips.map((subj) => {
                  const on = activeSubject === subj;
                  return (
                    <PressableScale key={subj} style={[hs.subChip, on && { backgroundColor: S.emerald, borderColor: S.emerald }]} onPress={() => setActiveSubject(subj)}>
                      <T w="bold" s={12.5} c={on ? '#fff' : S.muted}>{subj}</T>
                    </PressableScale>
                  );
                })}
              </ScrollView>

              <T w="xbold" s={9.5} c={S.faint} style={{ letterSpacing: 0.8, marginTop: 16, marginBottom: 9 }}>QUICK QUESTIONS</T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {(SUBJECT_QS[activeSubject] || []).map((q, i) => {
                  const p = QPILL[i % QPILL.length];
                  return (
                    <PressableScale key={q} style={[hs.qPill, { backgroundColor: p.bg }]} onPress={() => openAITeacher(q, activeSubject)}>
                      <T w="bold" s={11.5} c={p.text}>{q}</T>
                    </PressableScale>
                  );
                })}
              </ScrollView>

              <Breathe>
                <PressableScale style={hs.aiBtn} onPress={() => openAITeacher('', activeSubject)} accessibilityLabel="Ask a doubt">
                  <WandSparkles size={16} color="#fff" strokeWidth={2.4} />
                  <T w="bold" s={14.5} c="#fff">Ask a doubt</T>
                </PressableScale>
              </Breathe>
            </View>
          </FadeInOnce>
        );

      case 'progress':
        return (
          <React.Fragment key={key}>
            <Section title="How you’re improving" accent={S.indigo} sub="This week" />
            <FadeInOnce id="s-week" delay={30} y={14}>
              <View style={hs.card}>
                <View style={hs.rowBetween}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Gauge size={17} color={S.indigo} strokeWidth={2.5} />
                    <T w="xbold" s={15} c={S.ink}>{Number(summary.quizzes) || 0} quizzes done</T>
                  </View>
                  <T w="semi" s={11.5} c={S.muted}>{Number(summary.xp) || 0} XP</T>
                </View>
                {week.length > 0 && (Number(summary.quizzes) > 0 || week.some((d) => (Number(d.xp) || 0) > 0)) ? (
                  <View style={hs.chartRow}>
                    {(() => {
                      const maxXp = Math.max(1, ...week.map((d) => Number(d.xp) || 0));
                      return week.map((d, i) => (
                        <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                          <View style={hs.barTrack}>
                            <GrowBar height={Math.max(4, ((Number(d.xp) || 0) / maxXp) * 64)} color={d.isToday ? S.indigo : '#DEE1F0'} delay={200 + i * 70}
                              style={{ width: '58%', borderRadius: 6, alignSelf: 'center', position: 'absolute', bottom: 0 }} />
                          </View>
                          <T w={d.isToday ? 'xbold' : 'semi'} s={10} c={d.isToday ? S.indigo : S.faint}>{(d.day || '').slice(0, 1)}</T>
                        </View>
                      ));
                    })()}
                  </View>
                ) : (
                  <T w="semi" s={12} c={S.muted} style={{ marginTop: 14 }}>Your weekly activity will show here once you start practising.</T>
                )}
              </View>
            </FadeInOnce>
          </React.Fragment>
        );

      case 'achievements':
        if (badges.length === 0) return null;
        return (
          <React.Fragment key={key}>
            <Section title="What you’ve earned" accent={S.gold} sub={`${unlocked} unlocked`} />
            <FadeInOnce id="s-badges" delay={30} y={0}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 6, paddingVertical: 4 }}>
                {badges.map((b, i) => <Badge key={b.id} item={b} delay={80 + i * 60} />)}
              </ScrollView>
            </FadeInOnce>
          </React.Fragment>
        );

      case 'activity':
        return (
          <React.Fragment key={key}>
            <Section title="Recent activity" accent={S.cyan} />
            <FadeInOnce id="s-activity" delay={30} y={0}>
              <View style={[hs.card, activity.length > 0 && { paddingVertical: 6 }]}>
                {activity.length > 0 ? activity.map((a, i) => {
                  const cfg = ACT[a.type] || ACT.quiz;
                  const meta = [a.subject, a.chapter].filter(Boolean).join(' · ');
                  return (
                    <FadeIn key={`${a.type}-${a.at}-${i}`} delay={120 + i * 70} x={12} y={0}>
                      <View style={[hs.actRow, i < activity.length - 1 && hs.actDivider]}>
                        <View style={[hs.actIcon, { backgroundColor: cfg.bg }]}><cfg.Icon size={17} color={cfg.tint} strokeWidth={2.6} /></View>
                        <View style={{ flex: 1 }}>
                          <T w="bold" s={13} c={S.ink} numberOfLines={1}>{a.title}</T>
                          <T w="semi" s={11} c={S.muted} style={{ marginTop: 2 }} numberOfLines={1}>{[meta, timeAgo(a.at)].filter(Boolean).join(' · ')}</T>
                        </View>
                      </View>
                    </FadeIn>
                  );
                }) : (
                  <View style={{ alignItems: 'center', paddingVertical: 8, gap: 4 }}>
                    <T w="bold" s={13} c={S.sub}>No activity yet</T>
                    <T w="semi" s={11.5} c={S.muted} style={{ textAlign: 'center' }}>Start a lesson or a Brain Gym set — it’ll show up here.</T>
                  </View>
                )}
              </View>
            </FadeInOnce>
          </React.Fragment>
        );

      case 'session':
        if (sessionsOn) return null;
        return (
          <React.Fragment key={key}>
            <Section title="Live 1:1 session" accent={S.blue} />
            <FadeInOnce id="s-session" delay={30} y={14}>
              <View style={[hs.card, hs.soonCard]}>
                <View style={hs.soonIcon}><Lock size={17} color={S.blue} strokeWidth={2.5} /></View>
                <View style={{ flex: 1 }}>
                  <T w="xbold" s={14} c={S.ink}>1:1 tutoring is coming soon</T>
                  <T w="semi" s={11.5} c={S.muted} style={{ marginTop: 2 }}>Book live sessions with expert teachers — launching shortly.</T>
                </View>
                <View style={hs.soonPill}><T w="xbold" s={9.5} c={S.blue}>SOON</T></View>
              </View>
            </FadeInOnce>
          </React.Fragment>
        );
      default:
        return null;
    }
  };

  const showStats = hasActivity;

  // In-place overlays. Placed AFTER every hook so hook order stays stable (Rules of Hooks).
  if (showAITeacher) {
    // On returning from a lesson, refresh so Continue-learning / progress / recommendations update.
    return <AITeacherScreen initialSubject={activeSubject} initialTopic={seedTopic} onBack={() => { setShowAITeacher(false); load(true); }} />;
  }
  if (showBrainGym) {
    return (
      <Modal visible animationType="slide" statusBarTranslucent onRequestClose={() => setShowBrainGym(false)}>
        <BrainGymFlow onFinish={() => { setShowBrainGym(false); load(true); }} />
      </Modal>
    );
  }

  return (
    <View style={hs.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={S.canvas} translucent={false} />

      {/* ── CLEAN LIGHT HEADER ── */}
      <View style={[hs.header, { paddingTop: insets.top + 8 }]}>
        <View style={hs.headerLeft}>
          <PressableScale onPress={() => { setTempChar(charIdx); setShowCharModal(true); }} accessibilityLabel="Change character">
            <View>
              <CharAvatar char={currentChar} size={46} ring={S.hair} />
              <View style={hs.charEdit}><Pencil size={9} color="#fff" strokeWidth={2.8} /></View>
            </View>
          </PressableScale>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <T w="semi" s={12.5} c={S.muted}>{greet}</T>
              <Wave><T s={12.5}>👋</T></Wave>
            </View>
            <T w="black" s={21} c={S.ink} numberOfLines={1} style={{ marginTop: 1, letterSpacing: -0.4 }}>Hi, {firstName}</T>
          </View>
        </View>
        <PressableScale style={hs.bellBtn} accessibilityLabel="Notifications">
          <Bell size={19} color={S.ink} strokeWidth={2.3} />
          {(report?.notifications?.unread || 0) > 0 && <View style={hs.bellDot} />}
        </PressableScale>
      </View>

      {loading ? (
        <Skeleton />
      ) : err ? (
        <ErrorState onRetry={retry} />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={hs.body}
          contentContainerStyle={{ paddingBottom: 30, paddingTop: 6 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={S.indigo} colors={[S.indigo]} />}
        >
          <OptionalUpdateBanner />
          {showStats && (
            <View style={hs.statsRow}>
              <StatCard Icon={Flame} tint={S.orange} tintBg={S.orangeSoft} value={streak} label="Day streak" delay={40} />
              <StatCard Icon={Star} tint={S.gold} tintBg={S.goldSoft} value={xp} label="XP points" delay={100} />
              <StatCard Icon={TrendingUp} tint={S.emerald} tintBg={S.emeraldSoft} value={`${accuracy}%`} isText label="Accuracy" delay={160} />
            </View>
          )}

          <HeroCard intent={intent} />

          {order.map(renderSection)}
        </ScrollView>
      )}

      {/* Positioned below the header so it never overlaps it. */}
      {toast && <Toast data={toast} top={insets.top + 70} onDone={() => setToast(null)} />}

      {/* ── CHARACTER MODAL ── */}
      <Modal visible={showCharModal} transparent animationType="fade" onRequestClose={() => setShowCharModal(false)}>
        <View style={hs.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowCharModal(false)} accessibilityLabel="Close" />
          <FadeIn y={22}>
            <View style={hs.modal}>
              <View style={hs.modalHandle} />
              <T w="black" s={19} c={S.ink}>Choose your character</T>
              <T w="med" s={13} c={S.muted} style={{ marginTop: 3, marginBottom: 18 }}>Pick a unique identity that’s all yours.</T>
              <View style={hs.charGrid}>
                {CHARS.map((c, i) => (
                  <PopIn key={c.name} delay={i * 50} style={{ width: (SCREEN_W - 2 * PAD - 24 - 24) / 3 }}>
                    <PressableScale style={[hs.charOpt, tempChar === i && { borderColor: c.tint, backgroundColor: '#fff' }]} onPress={() => setTempChar(i)}>
                      <CharAvatar char={c} size={58} ring={null} />
                      <T w="bold" s={11.5} c={S.ink} numberOfLines={1} style={{ textAlign: 'center', marginTop: 6 }}>{c.name}</T>
                      <T w="semi" s={9.5} c={S.muted} numberOfLines={1} style={{ textAlign: 'center' }}>{c.role}</T>
                    </PressableScale>
                  </PopIn>
                ))}
              </View>
              <Breathe>
                <PressableScale style={hs.modalBtn} onPress={() => { setCharIdx(tempChar); setShowCharModal(false); }}>
                  <T w="bold" s={15} c="#fff">Save my character</T>
                  <CircleCheck size={17} color="#fff" strokeWidth={2.4} />
                </PressableScale>
              </Breathe>
            </View>
          </FadeIn>
        </View>
      </Modal>
    </View>
  );
};

const hs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: S.canvas },
  body: { flex: 1, paddingHorizontal: PAD },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: PAD, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  charEdit: { position: 'absolute', bottom: -2, right: -2, width: 17, height: 17, borderRadius: 9, backgroundColor: S.indigo, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: S.canvas },
  bellBtn: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#fff', borderWidth: 1, borderColor: S.hair, alignItems: 'center', justifyContent: 'center', ...shadowSm },
  bellDot: { position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: S.orange, borderWidth: 1.5, borderColor: '#fff' },

  // Acknowledgement toast
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: S.ink, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 16, maxWidth: '90%', ...shadow },

  errIcon: { width: 74, height: 74, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: S.hair, alignItems: 'center', justifyContent: 'center', ...shadowSm },
  retryBtn: { marginTop: 6, backgroundColor: S.indigo, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 30, ...shadowSm },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 4 },
  statCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: S.hair, paddingVertical: 14, paddingHorizontal: 13, ...shadowSm },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 },
  secDot: { width: 8, height: 8, borderRadius: 4 },

  // Hero
  clShadow: { borderRadius: 24, backgroundColor: S.heroB, marginTop: 18, shadowColor: '#241C55', shadowOpacity: 0.32, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 11 },
  cl: { borderRadius: 24, overflow: 'hidden', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18 },
  clTag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  clCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 15, paddingVertical: 14, marginTop: 18, overflow: 'hidden' },
  streakChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },

  // Brain Gym
  bgShadow: { borderRadius: 22, backgroundColor: '#301E66', shadowColor: '#301E66', shadowOpacity: 0.30, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
  bg: { borderRadius: 22, overflow: 'hidden', paddingHorizontal: 18, paddingVertical: 16 },
  bgTag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  bgHub: { position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  // Generic card
  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: S.hair, padding: 16, ...shadow },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalBar: { height: 6, backgroundColor: S.hair, borderRadius: 5, marginTop: 5, overflow: 'hidden' },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 16 },
  barTrack: { width: '100%', height: 64, justifyContent: 'flex-end' },

  // Learning-path steps
  pathRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  pathDivider: { borderBottomWidth: 1, borderBottomColor: S.hair },
  pathNum: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: S.border, alignItems: 'center', justifyContent: 'center' },
  pathIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Up next
  upnext: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  upnextIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  upnextGo: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  // Coming-soon session
  soonCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  soonIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: S.blueSoft, alignItems: 'center', justifyContent: 'center' },
  soonPill: { backgroundColor: S.blueSoft, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },

  // AI Teacher (doubt)
  aiCard: { backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: S.hair, padding: 18, ...shadow },
  aiAvatar: { width: 46, height: 46, borderRadius: 15, backgroundColor: S.emeraldSoft, alignItems: 'center', justifyContent: 'center' },
  online: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: S.emeraldSoft, borderRadius: 18, paddingVertical: 6, paddingHorizontal: 11 },
  onlineDot: { width: 6, height: 6, alignItems: 'center', justifyContent: 'center' },
  subChip: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 18, borderWidth: 1.5, borderColor: S.border, backgroundColor: '#fff' },
  qPill: { borderRadius: 18, paddingVertical: 9, paddingHorizontal: 14 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: S.emerald, borderRadius: 14, paddingVertical: 14, marginTop: 16 },

  // Achievements
  badge: { width: 68, height: 68, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: S.hair, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...shadow },
  badgeLocked: { backgroundColor: '#F2F3F8', borderColor: S.border },
  badgeBar: { width: 44, height: 4, borderRadius: 3, backgroundColor: S.hair, marginTop: 6, overflow: 'hidden' },

  // Recent activity
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  actDivider: { borderBottomWidth: 1, borderBottomColor: S.hair },
  actIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Character modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(12,13,28,0.55)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 34 },
  modalHandle: { width: 40, height: 4, backgroundColor: S.border, borderRadius: 10, alignSelf: 'center', marginBottom: 16 },
  charGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  charOpt: { backgroundColor: S.canvas, borderRadius: 18, paddingVertical: 13, paddingHorizontal: 8, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  modalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: S.indigo, borderRadius: 15, paddingVertical: 16, marginTop: 20 },
});

export default HomeScreen;
