// src/screens/HomeScreen.js
// The Student Home — dark "night" re-skin, FIXED layout:
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
// Palette is shared with the AI-Teacher crafting screen (src/theme/nightTheme.js) so
// the two dark surfaces read as one product.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, Animated,
  Easing, RefreshControl, Pressable, Image, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell, Settings, Play, Sparkles, CircleCheck, MessageCircle, Swords,
  CircleAlert, TrendingUp, Target, Clock, Brain,
} from 'lucide-react-native';
import {
  useFonts as useAuroraFonts,
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
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
import { N, NFONT as F } from '../theme/nightTheme';

const { width: W, height: H } = Dimensions.get('window');
const PAD = 16;
const GAP = 12;

// ── type helper ──────────────────────────────────────────────────────────────
function T({ w = 'reg', s = 14, c = N.inkSoft, style, children, ...rest }) {
  const fam = w === 'black' || w === 'xbold' || w === 'bold' ? F.bold : w === 'semi' ? F.med : F.reg;
  return <Text {...rest} style={[{ fontFamily: fam, fontSize: s, color: c }, style]}>{children}</Text>;
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
  quiz:    { Icon: CircleCheck,   tint: N.green,  bg: N.greenSoft },
  doubt:   { Icon: MessageCircle, tint: N.violet, bg: N.violetSoft },
  mistake: { Icon: CircleAlert,   tint: N.amber,  bg: N.amberSoft },
  lesson:  { Icon: Play,          tint: N.blue,   bg: N.blueSoft },
  arena:   { Icon: Swords,        tint: N.amber,  bg: N.amberSoft },
};

// ── page background: vertical gradient + two low-opacity blooms ──────────────
function NightBg() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[N.bgTop, N.bgBot]} style={StyleSheet.absoluteFill} />
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="hg0" cx={W * 0.5} cy={H * 0.06} r={W * 0.8} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={N.glow} stopOpacity="0.5" />
            <Stop offset="1" stopColor={N.glow} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="hg1" cx={W * 0.08} cy={H * 0.95} r={W * 0.8} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={N.glowBlue} stopOpacity="0.34" />
            <Stop offset="1" stopColor={N.glowBlue} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={W} height={H} fill="url(#hg0)" />
        <Rect x="0" y="0" width={W} height={H} fill="url(#hg1)" />
      </Svg>
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

function Ring({ pct = 0, size = 62, stroke = 6, color = '#fff', track = 'rgba(255,255,255,0.26)', children }) {
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
        <T w="xbold" s={13} c={N.ink}>{data.title}</T>
        <T w="semi" s={11} c={N.inkSoft} style={{ marginTop: 1 }}>{data.sub}</T>
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
  useAuroraFonts({ SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold });
  const { user } = useAuth();
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

  // AI Teacher and Brain Gym render as an in-place swap of Home's own content, not a
  // separate route — the Tab Navigator's active route never changes, so the dock
  // never learns to hide itself. Tell it directly whenever either immersive flow is up.
  useEffect(() => {
    navigation.setOptions({ tabBarStyle: (showAITeacher || showBrainGym) ? { display: 'none' } : undefined });
    return () => navigation.setOptions({ tabBarStyle: undefined });
  }, [showAITeacher, showBrainGym, navigation]);

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
      <StatusBar barStyle="light-content" backgroundColor={N.bgTop} translucent={false} />
      <NightBg />

      <ScrollView
        ref={scrollRef}
        // The app is edge-to-edge on Android (app.json → android.edgeToEdgeEnabled), so
        // the status bar draws OVER this content — a flat paddingTop clipped the greeting
        // row under the clock. Pad by the real inset instead.
        contentContainerStyle={{ paddingHorizontal: PAD, paddingTop: insets.top + 8, paddingBottom: 28, gap: GAP }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={N.violet} colors={[N.violet]} />
        }
      >
        {/* ── header ── */}
        <Appear delay={0} y={10}>
          <View style={hs.header}>
            <View style={hs.avatar}>
              {avatarUri
                ? <Image source={{ uri: avatarUri }} style={hs.avatarImg} />
                : <T w="black" s={17} c={N.ink}>{initial}</T>}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              {/* The name still truncates on its own (flexShrink) — the hand is a
                  separate node so it can rotate, and never squeezes the name out. */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <T w="black" s={17} c={N.ink} numberOfLines={1} style={{ flexShrink: 1 }}>Hi, {firstName}</T>
                <Wave />
              </View>
              <T w="semi" s={12} c={N.inkSoft} numberOfLines={1} style={{ marginTop: 2 }}>Ready to level up?</T>
            </View>
            <Squeeze style={hs.iconBtn} accessibilityLabel="Notifications">
              <Bell size={19} color={N.inkSoft} strokeWidth={2.2} />
            </Squeeze>
            <Squeeze style={hs.iconBtn} onPress={() => navigation.navigate('Profile')} accessibilityLabel="Settings">
              <Settings size={19} color={N.inkSoft} strokeWidth={2.2} />
            </Squeeze>
          </View>
        </Appear>

        <OptionalUpdateBanner />

        {loading ? <Skeleton /> : err ? (
          <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 30 }}>
            <T w="xbold" s={15} c={N.ink}>Couldn’t load your home</T>
            <T w="semi" s={12.5} c={N.inkSoft} style={{ textAlign: 'center' }}>Check your connection and try again.</T>
            <Squeeze style={hs.retryBtn} onPress={() => { setLoading(true); setErr(false); load(false); }}>
              <T w="xbold" s={13} c="#fff">Retry</T>
            </Squeeze>
          </Card>
        ) : (
          <>
            {/* ── 1. current lesson ── */}
            <Appear delay={60} y={16}>
              <LinearGradient colors={[N.heroA, N.heroB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={hs.hero}>
                <View style={hs.heroTop}>
                  <View style={hs.heroChip}>
                    <T w="bold" s={8.5} c="#fff" style={{ letterSpacing: 0.9 }}>CURRENT LESSON</T>
                  </View>
                  {(!!contSubject || streak > 0) && (
                    <T w="semi" s={11.5} c="rgba(255,255,255,0.82)" numberOfLines={1} style={{ flexShrink: 1, textAlign: 'right' }}>
                      {[contSubject, streak > 0 ? `${streak}-day streak` : null].filter(Boolean).join(' · ')}
                    </T>
                  )}
                </View>

                <View style={hs.heroBody}>
                  <T w="black" s={20} c="#fff" numberOfLines={3} style={{ flex: 1, lineHeight: 27, letterSpacing: -0.3 }}>
                    {contTitle || 'Start your first lesson'}
                  </T>
                  <Ring pct={heroPct / 100} size={62} stroke={6}>
                    <CountUp to={Math.round(heroPct)} w="black" s={14} c="#fff" />
                  </Ring>
                </View>

                <Squeeze
                  style={hs.heroBtn}
                  onPress={() => openAITeacher(contTitle || '', contSubject || '')}
                  accessibilityLabel={contTitle ? `Resume lesson: ${contTitle}` : 'Start learning'}
                >
                  <T w="xbold" s={14} c={N.heroB}>{contTitle ? 'Resume lesson' : 'Start learning'}</T>
                  <Play size={14} color={N.heroB} strokeWidth={3} fill={N.heroB} />
                </Squeeze>
              </LinearGradient>
            </Appear>

            {/* ── 2. next up | sharpen thinking ── */}
            <View style={hs.row2}>
              <Appear delay={120} style={{ flex: 1 }}>
                <Squeeze style={[hs.card, hs.tile]} onPress={() => runRec(upnext)} accessibilityLabel="Next up">
                  <View style={hs.tileTop}>
                    <View style={[hs.tileIcon, { backgroundColor: N.violetSoft }]}>
                      <Sparkles size={17} color={N.violet} strokeWidth={2.4} />
                    </View>
                    <Breathe style={hs.playDot} from={0.72} to={1} scale={1.12} duration={1300}>
                      <Play size={11} color="#fff" strokeWidth={3} fill="#fff" />
                    </Breathe>
                  </View>
                  <T w="bold" s={9} c={N.violet} style={{ letterSpacing: 0.9, marginTop: 12 }}>NEXT UP</T>
                  <T w="xbold" s={14} c={N.ink} numberOfLines={2} style={{ marginTop: 4, lineHeight: 19 }}>
                    {upnext?.title || 'Start the first tool'}
                  </T>
                  <T w="semi" s={11} c={N.inkDim} numberOfLines={1} style={{ marginTop: 4 }}>
                    {upnext?.subtitle || 'Daily practice block'}
                  </T>
                </Squeeze>
              </Appear>

              {brainGymOn && (
                <Appear delay={160} style={{ flex: 1 }}>
                  <Squeeze style={[hs.card, hs.tile]} onPress={openBrainGym} accessibilityLabel="Open Brain Gym">
                    <View style={hs.tileTop}>
                      <View style={[hs.tileIcon, { backgroundColor: N.amberSoft }]}>
                        <Brain size={17} color={N.amber} strokeWidth={2.4} />
                      </View>
                      <Chip label="BRAIN" tint={N.amber} bg={N.amberSoft} />
                    </View>
                    <T w="bold" s={9} c={N.amber} style={{ letterSpacing: 0.9, marginTop: 12 }}>SHARPEN THINKING</T>
                    <T w="xbold" s={14} c={N.ink} numberOfLines={2} style={{ marginTop: 4, lineHeight: 19 }}>Focus, memory & speed</T>
                    <T w="semi" s={11} c={N.inkDim} numberOfLines={1} style={{ marginTop: 4 }}>Workout your brain</T>
                  </Squeeze>
                </Appear>
              )}
            </View>

            {/* ── 3. weekly goal ── */}
            {(goal || week.length > 0) && (
              <Appear delay={200}>
                <Card>
                  <View style={hs.rowBetween}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                      <Target size={15} color={N.green} strokeWidth={2.6} />
                      <T w="xbold" s={14} c={N.ink}>Your Weekly Goal</T>
                    </View>
                    {!!goal && (
                      <T w="semi" s={11.5} c={N.inkDim}>
                        <T w="xbold" s={11.5} c={N.green}>{goal.value} {goal.unit || ''}</T> of {goal.target} {goal.unit || ''}
                      </T>
                    )}
                  </View>

                  {week.length > 0 && (
                    <View style={hs.days}>
                      {week.map((d, i) => {
                        const did = (Number(d.xp) || 0) > 0;
                        return (
                          <Pop key={i} delay={260 + i * 55} style={{ flex: 1 }}>
                            <View
                              style={[hs.day, did && hs.dayDone, d.isToday && hs.dayToday]}
                              accessibilityLabel={`${d.day || ''}${did ? ', done' : ''}${d.isToday ? ', today' : ''}`}
                            >
                              <T w="xbold" s={11.5} c={did || d.isToday ? '#fff' : N.inkDim}>{(d.day || '').slice(0, 1)}</T>
                              {did
                                ? <CircleCheck size={11} color="#fff" strokeWidth={3} style={{ marginTop: 2 }} />
                                : <View style={[hs.dayDot, d.isToday && { backgroundColor: '#fff' }]} />}
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
                    <TrendingUp size={16} color={N.green} strokeWidth={2.6} />
                    <T w="black" s={16} c={N.green}>{totalQuiz} Done</T>
                  </View>
                  <T w="bold" s={9} c={N.green} style={{ letterSpacing: 0.9, marginTop: 12 }}>IMPROVING</T>
                  <T w="xbold" s={14} c={N.ink} numberOfLines={2} style={{ marginTop: 4, lineHeight: 19 }}>
                    {totalQuiz} quiz{totalQuiz === 1 ? '' : 'zes'} done
                  </T>
                  <T w="semi" s={11} c={N.inkDim} numberOfLines={2} style={{ marginTop: 4, lineHeight: 15 }}>
                    {totalQuiz > 0 ? 'You’re improving! Keep up the momentum.' : 'Your first quiz is waiting.'}
                  </T>
                </Card>
              </Appear>

              {aiTeacherOn && (
                <Appear delay={280} style={{ flex: 1 }}>
                  <Card style={hs.tile}>
                    <View style={hs.rowBetween}>
                      <MessageCircle size={16} color={N.violet} strokeWidth={2.4} />
                      <Chip label="ONLINE" tint={N.violet} bg={N.violetSoft} live />
                    </View>
                    <T w="bold" s={9} c={N.violet} style={{ letterSpacing: 0.9, marginTop: 12 }}>AI TEACHER</T>
                    <T w="xbold" s={14} c={N.ink} numberOfLines={2} style={{ marginTop: 4, lineHeight: 19 }}>Stuck on something?</T>
                    <Squeeze style={hs.askPrimary} onPress={() => openAITeacher()} accessibilityLabel="Ask a doubt">
                      <T w="xbold" s={11.5} c="#fff">Ask a doubt</T>
                    </Squeeze>
                    <Squeeze style={hs.askGhost} onPress={() => openAITeacher()} accessibilityLabel="Ask a question">
                      <T w="xbold" s={11.5} c={N.inkSoft}>Ask a question</T>
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
                    <Clock size={14} color={N.inkSoft} strokeWidth={2.6} />
                    <T w="xbold" s={13.5} c={N.ink}>Recent activity</T>
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
                            <T w="xbold" s={13} c={N.ink} numberOfLines={1}>{a.title}</T>
                            {!!meta && <T w="semi" s={11} c={N.inkDim} numberOfLines={1} style={{ marginTop: 2 }}>{meta}</T>}
                          </View>
                          <T w="semi" s={10.5} c={N.inkDim} style={{ flexShrink: 0 }}>{timeAgo(a.at)}</T>
                        </View>
                      </Appear>
                    );
                  })}
                </Card>
              </Appear>
            )}
          </>
        )}
      </ScrollView>

      {toast && <Toast data={toast} top={insets.top} onDone={() => setToast(null)} />}
    </View>
  );
};

const hs = StyleSheet.create({
  root: { flex: 1, backgroundColor: N.bg },

  // header
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 4 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: N.violetSoft,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 1, borderColor: N.cardEdge,
  },
  avatarImg: { width: '100%', height: '100%' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 13, backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: N.cardEdge, alignItems: 'center', justifyContent: 'center',
  },

  // cards
  card: {
    backgroundColor: N.card, borderRadius: 20, borderWidth: 1, borderColor: N.cardEdge,
    padding: 15,
  },
  row2: { flexDirection: 'row', gap: GAP },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 50 },
  chipLive: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 7 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  skel: { backgroundColor: N.cardSoft, borderRadius: 20 },

  // hero
  hero: {
    borderRadius: 24, padding: 18,
    shadowColor: '#5B3FD9', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 9,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  heroChip: { backgroundColor: 'rgba(255,255,255,0.20)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50 },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 },
  heroBtn: {
    marginTop: 18, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },

  // tiles
  tile: { minHeight: 128 },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  playDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: N.violetLo, alignItems: 'center', justifyContent: 'center' },

  // weekly goal
  days: { flexDirection: 'row', gap: 7, marginTop: 14 },
  // The Pop wrapper is the flex child now, so the tile sizes to it. `flex: 1` here
  // would take flexBasis 0 in an auto-height column parent and could collapse.
  day: {
    width: '100%', aspectRatio: 0.86, borderRadius: 13, backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: N.cardEdge, alignItems: 'center', justifyContent: 'center',
  },
  dayDone: { backgroundColor: N.green, borderColor: N.green },
  dayToday: { backgroundColor: N.violetLo, borderColor: N.violet },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: N.inkDim, marginTop: 4 },

  // ask buttons
  askPrimary: { marginTop: 10, backgroundColor: N.violetLo, borderRadius: 11, paddingVertical: 9, alignItems: 'center' },
  askGhost: {
    marginTop: 7, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: N.cardEdge,
    borderRadius: 11, paddingVertical: 9, alignItems: 'center',
  },

  // recent activity
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11 },
  actDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  actIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  retryBtn: { marginTop: 4, backgroundColor: N.violetLo, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 28 },

  toast: {
    position: 'absolute', left: PAD, right: PAD, flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: N.card, borderRadius: 16, borderWidth: 1, borderColor: N.cardEdge, padding: 13,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
});

export default HomeScreen;
