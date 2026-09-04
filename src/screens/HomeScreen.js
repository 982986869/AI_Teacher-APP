// src/screens/HomeScreen.js
// The Student Home — light "day" skin, FIXED layout:
//   header → current lesson (gradient hero + % ring) → Next up | Sharpen thinking
//   → Your Weekly Goal (day chips) → Improving | AI Teacher → Recent activity
//
// Every card is fed by the SAME real signals as before (getParentReport +
// getResumeContext + the locally-stored active lesson) — nothing here is mock data.
// Sections render in a fixed order; a card with no data hides itself rather than
// inventing a placeholder.
//
// NOTE: this replaced an adaptive version that elected one of seven heroes and
// reordered its sections per visit. That engine was removed deliberately in favour of
// this fixed layout — see git history if the adaptive behaviour is ever wanted back.
//
// Palette is src/theme/dayTheme.js. It mirrors every key in nightTheme's `N`, so this
// screen moved from dark to light by swapping one import — nightTheme itself is left
// alone because SessionsScreen and the AI-Teacher crafting screen still ride on it.
//
// Note that AITeacherScreen and BrainGymFlow open INSIDE this screen and are still
// dark: tapping "Ask a doubt" hands off to a dark surface. That is a handoff, not a
// mismatch, but if this page's light skin spreads to the rest of the student tabs
// those two are the next things to look at.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, Animated,
  Easing, RefreshControl, Pressable, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
// Only the ring needs Svg now — the page background's radial blooms went with the
// dark skin, and Defs/RadialGradient/Stop/Rect went with them.
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell, Settings, Play, Sparkles, CircleCheck, MessageCircle, Swords,
  CircleAlert, TrendingUp, Target, Clock, Brain, Video, ArrowRight,
} from 'lucide-react-native';
import {
  useFonts as useAuroraFonts,
  PlusJakartaSans_400Regular, PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
// The BRAIN chip is the one node the design sets in Inter rather than Plus Jakarta Sans.
import { Inter_700Bold } from '@expo-google-fonts/inter';
import { ClassPicker } from '../components/ClassPicker';
import { useAuth } from '../context/AuthContext';
import { useRuntimeConfig } from '../context/RuntimeConfigContext';
// Imported statically ON PURPOSE — do NOT React.lazy() these. On native, `import()` makes
// Metro build and ship a separate chunk at runtime (measured: ~25s for AITeacherScreen,
// ~35s for BrainGymFlow over LAN), so the open showed a blank Suspense fallback for half a
// minute. BrainGymFlow is also already in the main bundle via AppNavigator, so splitting it
// only duplicated it. Static import = instant open.
import AITeacherScreen from './AITeacherScreen';
import BrainGymFlow from './braingym/BrainGymFlow';
import OptionalUpdateBanner from '../components/OptionalUpdateBanner';
import { getParentReport } from '../api/parentApi';
import { getResumeContext } from '../api/aiApi';
import { getActiveLesson, getHomeState, saveHomeState } from '../utils/storage';
import { DAY, DFONT as F } from '../theme/dayTheme';

const PAD = 16;
const GAP = 12;

// ── type helper ──────────────────────────────────────────────────────────────
// `black` is now a real 800 rather than an alias for bold, because the design asks for
// ExtraBold in exactly one place (the "01 hrs" figure) and Bold everywhere else. Keeping
// xbold on 700 means the many existing w="xbold" nodes stay at the weight the design
// gives them; only the nodes deliberately marked `black` get heavier.
const FAM = { black: F.xbold, xbold: F.bold, bold: F.bold, semi: F.semi, med: F.med, reg: F.reg };

function T({ w = 'reg', s = 14, c = DAY.inkSoft, style, children, ...rest }) {
  return <Text {...rest} style={[{ fontFamily: FAM[w] || F.reg, fontSize: s, color: c }, style]}>{children}</Text>;
}

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

// Recent-activity row styling by event type.
const ACT = {
  quiz:    { Icon: CircleCheck,   tint: DAY.green,  bg: DAY.greenSoft },
  doubt:   { Icon: MessageCircle, tint: DAY.violet, bg: DAY.violetSoft },
  mistake: { Icon: CircleAlert,   tint: DAY.amber,  bg: DAY.amberSoft },
  lesson:  { Icon: Play,          tint: DAY.blue,   bg: DAY.blueSoft },
  arena:   { Icon: Swords,        tint: DAY.amber,  bg: DAY.amberSoft },
};

// ── page background ──────────────────────────────────────────────────────────
// White at the top fading to the faintest grey at the bottom, and nothing else.
//
// The night version painted two large radial "blooms" (violet top, blue bottom) over
// its gradient. Those are an additive effect: they work by being lighter than the page
// they sit on, which a dark page gives them for free and a white one cannot — at any
// opacity that stayed invisible they were dead pixels, and at any opacity you could
// see they read as a smudge. So they are gone, along with the Svg they needed.
function DayBg() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[DAY.bgTop, DAY.bgBot]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

// ── entrance: fade + rise ────────────────────────────────────────────────────
function Appear({ delay = 0, y = 14, style, children }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 460, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a, delay]);
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// press feedback
function Squeeze({ onPress, style, children, ...rest }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, friction: 7, tension: 180, useNativeDriver: true }).start();
  return (
    <Pressable onPress={onPress} onPressIn={() => to(0.97)} onPressOut={() => to(1)} {...rest}>
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// ── circular progress ring (hero) ────────────────────────────────────────────
// The arc SWEEPS to its value rather than appearing at it — on a progress ring the
// motion is the information: you see how far along you are, not just where. Stroke
// props can't take the native driver, but this is one element on the page, and it
// runs once after the card has settled (the delay lets Appear finish first).
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function Ring({ pct = 0, size = 62, stroke = 6, color = DAY.onHero, track = DAY.heroTrack, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const target = Math.max(0, Math.min(1, pct));
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(a, {
      toValue: target, duration: 900, delay: 260,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [a, target]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={a.interpolate({ inputRange: [0, 1], outputRange: [circ, 0] })}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute' }}>{children}</View>
    </View>
  );
}

// The number counts up alongside the arc, so the two don't disagree mid-sweep.
// State is set only when the ROUNDED value changes — ~pct renders of one <Text>,
// not one per frame.
function CountUp({ to = 0, duration = 900, delay = 260, suffix = '%', ...textProps }) {
  const [n, setN] = useState(0);
  const a = useRef(new Animated.Value(0)).current;
  const last = useRef(0);
  useEffect(() => {
    const id = a.addListener(({ value }) => {
      const v = Math.round(value);
      if (v !== last.current) { last.current = v; setN(v); }
    });
    Animated.timing(a, { toValue: to, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => a.removeListener(id);
  }, [a, to, duration, delay]);
  return <T {...textProps}>{n}{suffix}</T>;
}

// Scale + fade pop, staggered by index. Used for the weekly-goal days so the week
// fills in left-to-right instead of landing as one block.
function Pop({ delay = 0, style, children }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(a, { toValue: 1, delay, friction: 6, tension: 140, useNativeDriver: true }).start();
  }, [a, delay]);
  return (
    <Animated.View style={[style, {
      opacity: a,
      transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}

// A status chip. `live` adds a breathing dot — on an "ONLINE" badge the motion IS
// the claim; a static dot says the same thing but looks like a print asset.
const Chip = ({ label, tint, bg, live }) => (
  <View style={[hs.chip, { backgroundColor: bg }, live && hs.chipLive]}>
    {live && <Breathe style={[hs.liveDot, { backgroundColor: tint }]} from={0.35} to={1} duration={1100} />}
    <T w="bold" s={8.5} c={tint} style={{ letterSpacing: 0.9 }}>{label}</T>
  </View>
);

// Looping opacity (and optional scale) pulse. Native-driven, so it costs nothing
// while the page scrolls. Used for the ONLINE dot and the Next-up play button.
function Breathe({ style, from = 0.55, to = 1, scale = 0, duration = 1400, children }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a, duration]);
  return (
    <Animated.View style={[style, {
      opacity: a.interpolate({ inputRange: [0, 1], outputRange: [from, to] }),
      ...(scale ? { transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, scale] }) }] } : null),
    }]}>
      {children}
    </Animated.View>
  );
}

// The greeting waves — three tilts, then a long rest, so it reads as a hello and
// not as something stuck vibrating in the corner of the screen.
function Wave() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const tilt = (to, duration) => Animated.timing(a, { toValue: to, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(600),
      tilt(1, 180), tilt(-1, 260), tilt(1, 260), tilt(0, 180),
      Animated.delay(5200),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  return (
    <Animated.Text
      style={{
        fontSize: 17, marginLeft: 5,
        transformOrigin: '60% 85%', // pivot at the wrist, not the middle of the glyph
        transform: [{ rotate: a.interpolate({ inputRange: [-1, 1], outputRange: ['-16deg', '16deg'] }) }],
      }}
    >
      👋
    </Animated.Text>
  );
}

const Card = ({ style, children }) => <View style={[hs.card, style]}>{children}</View>;

// ── toast (progress made since last visit) ───────────────────────────────────
function Toast({ data, top, onDone }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(a, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(({ finished }) => finished && onDone && onDone());
  }, [a, onDone]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[hs.toast, { top: top + 8, opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }]}
    >
      <T s={17}>{data.emoji}</T>
      <View style={{ flex: 1 }}>
        <T w="xbold" s={13} c={DAY.ink}>{data.title}</T>
        <T w="semi" s={11} c={DAY.inkSoft} style={{ marginTop: 1 }}>{data.sub}</T>
      </View>
    </Animated.View>
  );
}

// Breathing placeholders — a still grey block reads as a broken layout, a pulsing
// one reads as loading. One native-driven loop shared by every block.
const Skeleton = () => {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  const pulse = { opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) };
  return (
    <View style={{ gap: GAP }}>
      <Animated.View style={[hs.skel, { height: 190, borderRadius: 24 }, pulse]} />
      <View style={{ flexDirection: 'row', gap: GAP }}>
        <Animated.View style={[hs.skel, { flex: 1, height: 128 }, pulse]} />
        <Animated.View style={[hs.skel, { flex: 1, height: 128 }, pulse]} />
      </View>
      <Animated.View style={[hs.skel, { height: 120 }, pulse]} />
    </View>
  );
};

const HomeScreen = () => {
  useAuroraFonts({
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold, Inter_700Bold,
  });
  const { user, selectedClass, setSelectedClass } = useAuth();
  const { isFeatureEnabled } = useRuntimeConfig();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const scrollRef = useRef(null);

  const [showAITeacher, setShowAITeacher] = useState(false);
  const [seedTopic, setSeedTopic] = useState('');
  const [seedSubject, setSeedSubject] = useState('');
  const [showBrainGym, setShowBrainGym] = useState(false);

  const [report, setReport] = useState(null);
  const [resume, setResume] = useState({ active: null, ctx: null });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const mounted = useRef(true);
  const prevStats = useRef(null);
  const lastLoadAt = useRef(0);
  const initialLoad = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async (isRefresh) => {
    try {
      const [rep, active, ctx, seen] = await Promise.all([
        getParentReport(!!isRefresh), // pull-to-refresh forces a live (uncached) report
        getActiveLesson().catch(() => null),
        getResumeContext().catch(() => null),
        getHomeState().catch(() => null),
      ]);
      if (!mounted.current) return;
      setReport(rep || null);
      setResume({ active: active || null, ctx: ctx || null });
      // Acknowledge progress made elsewhere, so finishing a lesson/quiz "counts" on return.
      const nx = Number(rep?.brainGym?.totalXp) || 0;
      const ns = Number(rep?.brainGym?.currentStreak) || 0;
      if (prevStats.current) {
        if (ns > prevStats.current.streak && ns > 1) setToast({ emoji: '🔥', title: `${ns}-day streak!`, sub: 'You’re on fire — keep it going' });
        else if (nx > prevStats.current.xp) setToast({ emoji: '🎉', title: `+${nx - prevStats.current.xp} XP earned`, sub: 'Nice work — that’s real progress' });
      }
      prevStats.current = { xp: nx, streak: ns };
      // First ever visit: baseline the "seen" snapshot silently.
      if (seen == null) saveHomeState({ seenUnlocked: Number(rep?.achievements?.unlockedCount) || 0 });
      setErr(false);
    } catch (_) {
      if (!mounted.current) return;
      if (!isRefresh) setErr(true);
    } finally {
      lastLoadAt.current = Date.now();
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  // Refetch on focus, but THROTTLED — the parent report is a ~20-query aggregate, so
  // rapid tab-hopping must not fire a query storm. Pull-to-refresh always forces one.
  const FOCUS_REFETCH_MS = 20000;
  useFocusEffect(useCallback(() => {
    const stale = Date.now() - lastLoadAt.current > FOCUS_REFETCH_MS;
    if (initialLoad.current || stale) load(!initialLoad.current);
    initialLoad.current = false;
  }, [load]));

  // Re-tapping the already-active Home tab scrolls back to the top.
  useEffect(() => {
    const unsub = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return unsub;
  }, [navigation]);

  // Feature flags — a feature that is off cannot be launched from anywhere on Home,
  // and its card is hidden. Fail-open (missing flag = on).
  const aiTeacherOn = isFeatureEnabled('aiTeacher');
  const brainGymOn = isFeatureEnabled('brainGym');
  const openAITeacher = (topic = '', subject = '') => {
    if (!aiTeacherOn) return;
    setSeedTopic(topic);
    setSeedSubject(subject);
    setShowAITeacher(true);
  };
  const openBrainGym = () => { if (!brainGymOn) return; setShowBrainGym(true); };

  // ── real signals ──
  const bg          = report?.brainGym || {};
  const streak      = Number(bg.currentStreak) || 0;
  const totalQuiz   = Number(bg.quizzesCompleted) || 0;
  const firstName   = report?.child?.firstName || user?.name?.split(' ')[0] || 'there';
  const weeklyGoals = report?.weeklyGoals || null;
  const week        = report?.weeklyActivity || [];
  const activity    = report?.learningTimeline || [];
  const nextStep    = report?.recommendedNextStep || null;
  const recs        = report?.recommendations || [];
  const active      = resume.active;
  const ctx         = resume.ctx;

  const contTitle   = active?.title || ctx?.focusConcept?.concept || ctx?.last?.chapter || null;
  const contSubject = active?.subject || ctx?.focusConcept?.subject || ctx?.last?.subject || null;
  // Ring %: concept mastery when we know it, else this week's overall goal progress.
  const heroPct = Number.isFinite(ctx?.focusConcept?.masteryPct)
    ? ctx.focusConcept.masteryPct
    : Number(weeklyGoals?.overall) || 0;

  // Weekly-goal headline — prefer a time-based goal, else the first one.
  const goal = weeklyGoals?.goals?.find((g) => /hr|hour|min/i.test(g.unit || '')) || weeklyGoals?.goals?.[0] || null;
  // "Next up" = the recommended next step, else the top recommendation.
  const upnext = nextStep || recs[0] || null;

  const runRec = (rec) => {
    if (!rec) { openAITeacher(); return; }
    const id = rec.id || rec.action;
    if (id === 'start' || id === 'streak' || id === 'braingym' || id === 'arena') { openBrainGym(); return; }
    if (id === 'weak') { openAITeacher(String(rec.title || '').replace(/^Revisit\s+/i, '')); return; }
    openAITeacher();
  };

  // Closing either flow refetches, so work done inside it (a finished lesson, a Brain
  // Gym set) is reflected the moment the student lands back on Home.
  if (showAITeacher) {
    return (
      <AITeacherScreen
        initialSubject={seedSubject || 'Physics'}
        initialTopic={seedTopic}
        onBack={() => { setShowAITeacher(false); load(true); }}
      />
    );
  }
  if (showBrainGym) return <BrainGymFlow onFinish={() => { setShowBrainGym(false); load(true); }} />;

  const avatarUri = user?.photo || user?.avatar || null;
  const initial = String(firstName || 'S').trim().charAt(0).toUpperCase();

  return (
    <View style={hs.root}>
      <StatusBar barStyle="dark-content" backgroundColor={DAY.bgTop} translucent={false} />
      <DayBg />

      <ScrollView
        ref={scrollRef}
        // The app is edge-to-edge on Android (app.json → android.edgeToEdgeEnabled), so
        // the status bar draws OVER this content — a flat paddingTop clipped the greeting
        // row under the clock. Pad by the real inset instead.
        contentContainerStyle={{ paddingHorizontal: PAD, paddingTop: insets.top + 8, paddingBottom: 28, gap: GAP }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={DAY.violet} colors={[DAY.violet]} />
        }
      >
        {/* ── header ── */}
        <Appear delay={0} y={10}>
          <View style={hs.header}>
            <View style={hs.avatar}>
              {avatarUri
                ? <Image source={{ uri: avatarUri }} style={hs.avatarImg} />
                : <T w="black" s={17} c={DAY.ink}>{initial}</T>}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              {/* The name still truncates on its own (flexShrink) — the hand is a
                  separate node so it can rotate, and never squeezes the name out. */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <T w="black" s={17} c={DAY.ink} numberOfLines={1} style={{ flexShrink: 1 }}>Hi, {firstName}</T>
                <Wave />
              </View>
              <T w="semi" s={12} c={DAY.inkSoft} numberOfLines={1} style={{ marginTop: 2 }}>Ready to level up?</T>
            </View>
            {/* Which class the student is browsing. It seeds from their own and
                is theirs to change: the server honours ?class= for every student
                now, so looking ahead at another year is a chip, not a support
                request. Sits before the icons so it reads as content, not chrome. */}
            <ClassPicker value={selectedClass} onChange={setSelectedClass} />
            <Squeeze style={hs.iconBtn} accessibilityLabel="Notifications">
              <Bell size={19} color={DAY.inkSoft} strokeWidth={2.2} />
            </Squeeze>
            <Squeeze style={hs.iconBtn} onPress={() => navigation.navigate('Profile')} accessibilityLabel="Settings">
              <Settings size={19} color={DAY.inkSoft} strokeWidth={2.2} />
            </Squeeze>
          </View>
        </Appear>

        <OptionalUpdateBanner />

        {loading ? <Skeleton /> : err ? (
          <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 30 }}>
            <T w="xbold" s={15} c={DAY.ink}>Couldn’t load your home</T>
            <T w="semi" s={12.5} c={DAY.inkSoft} style={{ textAlign: 'center' }}>Check your connection and try again.</T>
            <Squeeze style={hs.retryBtn} onPress={() => { setLoading(true); setErr(false); load(false); }}>
              <T w="xbold" s={13} c="#fff">Retry</T>
            </Squeeze>
          </Card>
        ) : (
          <>
            {/* ── 1. current lesson ── */}
            <Appear delay={60} y={16}>
              <LinearGradient colors={[DAY.heroA, DAY.heroB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={hs.hero}>
                <View style={hs.heroTop}>
                  {/* Badge: 100px radius, 4/10 padding, #FFFFFF at 12.55%. Its label is
                      10px Bold, and pure black like everything else on this card. */}
                  <View style={hs.heroChip}>
                    <T w="bold" s={10} c={DAY.onHero} style={hs.heroChipText}>CURRENT LESSON</T>
                  </View>
                  {(!!contSubject || streak > 0) && (
                    <T w="semi" s={11} c={DAY.onHeroSoft} numberOfLines={1} style={{ flexShrink: 1, textAlign: 'right' }}>
                      {[contSubject, streak > 0 ? `${streak}-day streak` : null].filter(Boolean).join(' · ')}
                    </T>
                  )}
                </View>

                {/* Card-Body: 16px gap, and a 64px progress container. Figma sets the
                    title in 800 at 20px/135% — 27px of line height, which is what the
                    two-line 54px title node measures. */}
                <View style={hs.heroBody}>
                  <T w="black" s={20} c={DAY.onHero} numberOfLines={3} style={{ flex: 1, lineHeight: 27 }}>
                    {contTitle || 'Start your first lesson'}
                  </T>
                  <Ring pct={heroPct / 100} size={64} stroke={6}>
                    <CountUp to={Math.round(heroPct)} w="black" s={14} c={DAY.onHero} />
                  </Ring>
                </View>

                <Squeeze
                  style={hs.heroBtn}
                  onPress={() => openAITeacher(contTitle || '', contSubject || '')}
                  accessibilityLabel={contTitle ? `Resume lesson: ${contTitle}` : 'Start learning'}
                >
                  <T w="xbold" s={14} c={DAY.heroBtnFg}>{contTitle ? 'Resume lesson' : 'Start learning'}</T>
                  {/* Figma: an 8x9 vector inside the 12px box, 2px stroke, #FFFFFF, and
                      NO fill — an outlined triangle, not a solid one. */}
                  <Play size={12} color={DAY.heroBtnFg} strokeWidth={2} fill="none" />
                </Squeeze>
              </LinearGradient>
            </Appear>

            {/* ── 2. next up | sharpen thinking ── */}
            <View style={hs.row2}>
              <Appear delay={120} style={{ flex: 1 }}>
                <Squeeze style={[hs.card, hs.tile]} onPress={() => runRec(upnext)} accessibilityLabel="Next up">
                  <View style={hs.tileTop}>
                    {/* The design drops the tinted rounded square behind the sparkles and
                        leaves the glyph bare, in its own pale yellow. */}
                    <Sparkles size={18} color={DAY.sparkle} strokeWidth={2} />
                    <Breathe style={hs.playDot} from={0.72} to={1} scale={1.12} duration={1300}>
                      {/* Same treatment as the hero's: 2px stroke, no fill. */}
                      <Play size={10} color={DAY.playFg} strokeWidth={2} fill="none" />
                    </Breathe>
                  </View>
                  <T w="bold" s={11} c={DAY.violet} style={hs.eyebrow}>NEXT UP</T>
                  <T w="xbold" s={15} c={DAY.ink} numberOfLines={2} style={{ marginTop: 4, lineHeight: 19.5 }}>
                    {upnext?.title || 'Start the first tool'}
                  </T>
                  <T w="reg" s={11} c={DAY.inkSoft} numberOfLines={1} style={{ marginTop: 4 }}>
                    {upnext?.subtitle || 'Daily practice block'}
                  </T>
                </Squeeze>
              </Appear>

              {brainGymOn && (
                <Appear delay={160} style={{ flex: 1 }}>
                  <Squeeze style={[hs.card, hs.tile]} onPress={openBrainGym} accessibilityLabel="Open Brain Gym">
                    <View style={hs.tileTop}>
                      <Brain size={18} color={DAY.ink} strokeWidth={2} />
                      {/* Not the pill <Chip> the ONLINE badge uses: the design makes this
                          a 4px-radius rectangle with a 1px border, and sets it in Inter
                          rather than the page's Plus Jakarta Sans. */}
                      <View style={hs.brainChip}>
                        <Text style={hs.brainChipText}>BRAIN</Text>
                      </View>
                    </View>
                    <T w="bold" s={11} c={DAY.amber} style={hs.eyebrow}>SHARPEN THINKING</T>
                    <T w="xbold" s={15} c={DAY.ink} numberOfLines={2} style={{ marginTop: 4, lineHeight: 19.5 }}>Focus, memory &amp; speed</T>
                    <T w="reg" s={11} c={DAY.inkSoft} numberOfLines={1} style={{ marginTop: 4 }}>Workout your brain</T>
                  </Squeeze>
                </Appear>
              )}
            </View>

            {/* ── 3. weekly goal ── */}
            {(goal || week.length > 0) && (
              <Appear delay={200}>
                <Card>
                  {/* Goal-Header: 8px gap, 16px target icon, 14px Bold #1C1C1E. The value
                      and its "of N" tail are separate nodes, not one nested run — the
                      design gives them different weights (800 vs 400), sizes (16 vs 11)
                      and colours (#000 vs #6B7280), which a nested <T> cannot express
                      because the outer baseline would drag the 16px figure around. */}
                  <View style={hs.rowBetween}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Target size={16} color={DAY.ink} strokeWidth={2.6} />
                      <T w="xbold" s={14} c={DAY.ink}>Your Weekly Goal</T>
                    </View>
                    {!!goal && (
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                        <T w="black" s={16} c={DAY.goalValue}>{goal.value} {goal.unit || ''}</T>
                        <T w="reg" s={11} c={DAY.inkSoft}>of {goal.target} {goal.unit || ''}</T>
                      </View>
                    )}
                  </View>

                  {week.length > 0 && (
                    <View style={hs.days}>
                      {week.map((d, i) => {
                        const did = (Number(d.xp) || 0) > 0;
                        // The tint is POSITIONAL — Monday is always blue, Tuesday always
                        // pink — so the week reads as a row of distinct days rather than a
                        // progress bar. Whether the day was earned is said by the glyph
                        // inside it, not by its colour. A day that is neither done nor
                        // today gets the inert grey instead of its tint.
                        const active = did || d.isToday;
                        const tint = DAY.dayTints[i % DAY.dayTints.length];
                        const fg = active ? DAY.dayGlyph : DAY.inkDim;
                        return (
                          <Pop key={i} delay={260 + i * 55}>
                            <View
                              style={[hs.day, { backgroundColor: active ? tint : DAY.dayIdleBg }]}
                              accessibilityLabel={`${d.day || ''}${did ? ', done' : ''}${d.isToday ? ', today' : ''}`}
                            >
                              <T w="xbold" s={11.5} c={fg}>{(d.day || '').slice(0, 1)}</T>
                              {did
                                ? <CircleCheck size={11} color={fg} strokeWidth={3} />
                                : <View style={[hs.dayDot, { backgroundColor: fg }]} />}
                            </View>
                          </Pop>
                        );
                      })}
                    </View>
                  )}
                </Card>
              </Appear>
            )}

            {/* ── 4. improving | ai teacher ── */}
            <View style={hs.row2}>
              <Appear delay={240} style={{ flex: 1 }}>
                <Card style={hs.tile}>
                  <View style={hs.rowBetween}>
                    <TrendingUp size={16} color={DAY.green} strokeWidth={2.6} />
                    <T w="black" s={16} c={DAY.green}>{totalQuiz} Done</T>
                  </View>
                  <T w="bold" s={9} c={DAY.green} style={{ letterSpacing: 0.9, marginTop: 12 }}>IMPROVING</T>
                  <T w="xbold" s={14} c={DAY.ink} numberOfLines={2} style={{ marginTop: 4, lineHeight: 19 }}>
                    {totalQuiz} quiz{totalQuiz === 1 ? '' : 'zes'} done
                  </T>
                  <T w="semi" s={11} c={DAY.inkDim} numberOfLines={2} style={{ marginTop: 4, lineHeight: 15 }}>
                    {totalQuiz > 0 ? 'You’re improving! Keep up the momentum.' : 'Your first quiz is waiting.'}
                  </T>
                </Card>
              </Appear>

              {aiTeacherOn && (
                <Appear delay={280} style={{ flex: 1 }}>
                  <Card style={hs.tile}>
                    <View style={hs.rowBetween}>
                      <MessageCircle size={16} color={DAY.violet} strokeWidth={2.4} />
                      <Chip label="ONLINE" tint={DAY.violet} bg={DAY.violetSoft} live />
                    </View>
                    <T w="bold" s={9} c={DAY.violet} style={{ letterSpacing: 0.9, marginTop: 12 }}>AI TEACHER</T>
                    <T w="xbold" s={14} c={DAY.ink} numberOfLines={2} style={{ marginTop: 4, lineHeight: 19 }}>Stuck on something?</T>
                    <Squeeze style={hs.askPrimary} onPress={() => openAITeacher()} accessibilityLabel="Ask a doubt">
                      <T w="xbold" s={11.5} c={DAY.ctaFg}>Ask a doubt</T>
                    </Squeeze>
                    <Squeeze style={hs.askGhost} onPress={() => openAITeacher()} accessibilityLabel="Ask a question">
                      <T w="xbold" s={11.5} c={DAY.inkSoft}>Ask a question</T>
                    </Squeeze>
                  </Card>
                </Appear>
              )}
            </View>

            {/* ── 5. recent activity ── */}
            {activity.length > 0 && (
              <Appear delay={320}>
                <Card style={{ paddingVertical: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 10, paddingBottom: 4 }}>
                    <Clock size={14} color={DAY.inkSoft} strokeWidth={2.6} />
                    <T w="xbold" s={13.5} c={DAY.ink}>Recent activity</T>
                  </View>
                  {activity.slice(0, 4).map((a, i, arr) => {
                    const cfg = ACT[a.type] || ACT.quiz;
                    const meta = [a.subject, a.chapter].filter(Boolean).join(' · ');
                    return (
                      // Rows arrive one after another, so the feed reads as a list
                      // being filled rather than a block that snaps into place.
                      <Appear key={`${a.type}-${a.at}-${i}`} delay={380 + i * 80} y={8}>
                        <View style={[hs.actRow, i < arr.length - 1 && hs.actDivider]}>
                          <View style={[hs.actIcon, { backgroundColor: cfg.bg }]}>
                            <cfg.Icon size={16} color={cfg.tint} strokeWidth={2.6} />
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <T w="xbold" s={13} c={DAY.ink} numberOfLines={1}>{a.title}</T>
                            {!!meta && <T w="semi" s={11} c={DAY.inkDim} numberOfLines={1} style={{ marginTop: 2 }}>{meta}</T>}
                          </View>
                          <T w="semi" s={10.5} c={DAY.inkDim} style={{ flexShrink: 0 }}>{timeAgo(a.at)}</T>
                        </View>
                      </Appear>
                    );
                  })}
                </Card>
              </Appear>
            )}

            {/* ── 6. footer banner ── */}
            {/* Announcement, not a control: 1:1 tutoring does not exist yet, so this
                says so and does nothing when tapped. It is deliberately NOT a Squeeze —
                a card that presses in promises a destination it cannot honour. It also
                does not hide itself when data is missing the way the cards above do,
                because it has no data: it is the same sentence on every account until
                the feature ships, and then it should be deleted rather than wired. */}
            <Appear delay={420}>
              <View style={hs.banner} accessibilityRole="text">
                <View style={hs.bannerLeft}>
                  <Video size={12} color={DAY.bannerFg} strokeWidth={2.4} />
                  <T w="bold" s={12} c={DAY.bannerFg} numberOfLines={1} style={{ letterSpacing: 1.1, flexShrink: 1 }}>
                    1:1 TUTORING IS COMING SOON
                  </T>
                </View>
                <ArrowRight size={12} color={DAY.bannerFg} strokeWidth={2.4} style={{ flexShrink: 0 }} />
              </View>
            </Appear>
          </>
        )}
      </ScrollView>

      {toast && <Toast data={toast} top={insets.top} onDone={() => setToast(null)} />}
    </View>
  );
};

const hs = StyleSheet.create({
  root: { flex: 1, backgroundColor: DAY.bg },

  // header
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 4 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: DAY.violetSoft,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 1, borderColor: DAY.cardEdge,
  },
  avatarImg: { width: '100%', height: '100%' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 13, backgroundColor: DAY.cardSoft,
    borderWidth: 1, borderColor: DAY.cardEdge, alignItems: 'center', justifyContent: 'center',
  },

  // cards
  // Figma: 20px radius, 1px #E5E5EA, 16px padding, drop shadow X0 Y2 blur 8 at 6.27%.
  // A white card on a white page has no edge of its own, so it needs both the hairline
  // and the shadow; on the dark skin the hairline alone was enough.
  card: {
    backgroundColor: DAY.card, borderRadius: 20, borderWidth: 1, borderColor: DAY.cardEdge,
    padding: 16,
    shadowColor: DAY.shadow, shadowOpacity: DAY.shadowOpacity, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  row2: { flexDirection: 'row', gap: 16 },   // Figma: Bento-Row gap 16
  // Shared by "NEXT UP" and "SHARPEN THINKING". Figma sets 11px Bold uppercase with a
  // 12px gap above. It also reports 50% letter-spacing, which at 11px is 5.5px — but the
  // same panels give "SHARPEN THINKING" a width of 107px, which that tracking would blow
  // past by more than half again. The stated widths only hold at near-zero tracking, so
  // the two numbers contradict each other and this follows the widths.
  eyebrow: { letterSpacing: 1.1, marginTop: 12, textTransform: 'uppercase' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 50 },
  chipLive: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 7 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  skel: { backgroundColor: DAY.cardSoft, borderRadius: 20 },

  // hero — Figma: 24px radius, 20px padding, 16px gap, a 1px #FFFFFF/7.84% border, and
  // a violet drop shadow at X0 Y8 blur 24, 20%.
  //
  // Height is minHeight, not the design's fixed 200px. The design's own numbers add to
  // 206 (40 padding + 32 gaps + 26 badge + 64 body + 44 CTA), and a lesson title longer
  // than two lines pushes further. Fixing the height would clip the title — the one
  // thing on the card that has to be readable.
  hero: {
    borderRadius: 24, padding: 20, gap: 16, minHeight: 200,
    borderWidth: 1, borderColor: DAY.heroEdge,
    shadowColor: DAY.heroShadow, shadowOpacity: 0.20, shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  heroChip: { backgroundColor: DAY.heroChip, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100 },
  // Figma reports 100% letter spacing on this label — 10px of tracking at 10px type,
  // which would run "CURRENT LESSON" to roughly 200px against its stated 90px width.
  // Same contradiction as the card eyebrows; the width wins.
  heroChipText: { letterSpacing: 1, textTransform: 'uppercase' },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroBtn: {
    height: 44, backgroundColor: DAY.heroBtnBg, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },

  // tiles
  tile: { minHeight: 134 },   // Figma: Bento-Row-1 height 134
  // Figma: 40x15 hug, 4px radius, 1px #FCD34D, 2/6 padding, Inter 700 9px #D97706.
  brainChip: {
    backgroundColor: DAY.chipBrainBg, borderWidth: 1, borderColor: DAY.chipBrainEdge,
    borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6,
  },
  brainChipText: { fontFamily: 'Inter_700Bold', fontSize: 9, color: DAY.chipBrainFg },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: DAY.playBg, alignItems: 'center', justifyContent: 'center' },

  // weekly goal — Figma: Days-Tracker is space-between, each chip a fixed 38x50 with a
  // 10px radius, 6px top/bottom padding and a 6px gap. Seven 38px chips come to 266px,
  // which still fits inside the card on a 360px-wide phone (296px of room), so the fixed
  // width holds rather than needing to flex.
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  day: {
    width: 38, height: 50, borderRadius: 10, paddingVertical: 6, gap: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  dayDot: { width: 4, height: 4, borderRadius: 2 },

  // ask buttons
  askPrimary: { marginTop: 10, backgroundColor: DAY.ctaBg, borderRadius: 11, paddingVertical: 9, alignItems: 'center' },
  askGhost: {
    marginTop: 7, backgroundColor: DAY.ghostBg, borderWidth: 1, borderColor: DAY.cardEdge,
    borderRadius: 11, paddingVertical: 9, alignItems: 'center',
  },

  // footer banner — Figma: 39px tall, 16px radius, 1px dashed #7C3AED (4/4), #F5F3FF
  // fill, 12/16 padding, space-between. RN has no dash-pattern control on a View border:
  // borderStyle: 'dashed' renders the platform's own dash, which is close to 4/4 and is
  // the only dashed border available short of drawing the outline in Svg.
  // minHeight, not the design's fixed 39px. Figma pairs that 39px with 12px of top and
  // bottom padding, which leaves 15px of content box for a 12px bold line that needs
  // about 17 — so the label was being clipped top and bottom. The design's own numbers
  // do not fit each other; the text has to win. Padding comes down to 10 so the natural
  // height lands near 36 and minHeight lifts it the rest of the way to 39.
  banner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    minHeight: 39, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed',
    borderColor: DAY.bannerEdge, backgroundColor: DAY.bannerBg,
    paddingVertical: 10, paddingHorizontal: 16, gap: 8,
  },
  // The label plus both icons comes to roughly 295px. That clears a 360px phone but not
  // a 320px one, so the left group shrinks and the label truncates rather than pushing
  // the arrow off the edge.
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, minWidth: 0 },

  // recent activity
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11 },
  actDivider: { borderBottomWidth: 1, borderBottomColor: DAY.divider },
  actIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  retryBtn: { marginTop: 4, backgroundColor: DAY.violetLo, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 28 },

  toast: {
    position: 'absolute', left: PAD, right: PAD, flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: DAY.card, borderRadius: 16, borderWidth: 1, borderColor: DAY.cardEdge, padding: 13,
    shadowColor: '#1B1830', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
});

export default HomeScreen;
