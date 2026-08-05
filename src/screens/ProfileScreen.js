// src/screens/ProfileScreen.js
// Student profile — REAL data (Nunito `T`, anim primitives). Stats, badges and the
// "closest badge" milestone all come from GET /api/parent/report (a student calling
// it gets their OWN progress). Only actions that actually DO something remain (sound
// toggle, share, help, switch to parent, log out) — no fake stats, no dead menu rows.
// Loading skeleton, error+retry, empty-safe.
//
// Dark reskin (the "profile-screen" reference) — scoped to this screen only, same
// opt-in-per-screen pattern as Login/Signup/KnowledgeAskScreen (Home/Sessions/
// Practice/Resources/Results stay on the light studentTheme for now). Colours route
// through a local `D` map built on designSystem's COLORS, same technique used in
// KnowledgeAskScreen. The bottom tab bar (FloatingDock) is shared chrome across all
// five tabs and is deliberately left alone — out of scope for a single-screen match.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, Alert, Share, Linking, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import {
  Volume2, VolumeX, Share2, MessageCircle, LogOut, Users, ChevronRight, ChevronLeft,
  Flame, Star, TrendingUp, Target, CircleAlert, Sparkles, Dumbbell, Zap,
  Trophy, BookOpen, Swords, Camera,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getSoundEnabledAsync, setSoundEnabled } from '../utils/sound';
import { getParentReport } from '../api/parentApi';
import { T } from './parent/ParentApp/constants';
import { COLORS } from '../theme/designSystem';
import { shadowSm } from '../theme/studentTheme';
import { SoftGlow } from '../theme/studentUI';
import {
  FadeInOnce, PressableScale, CountUp, GrowFill, Breathe, Float, PopIn, Shine,
} from './parent/ParentApp/anim';

const PAD = 18;
const APP_VERSION = Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';
const ICONS = {
  sparkle: Sparkles, dumbbell: Dumbbell, zap: Zap, trophy: Trophy, flame: Flame,
  target: Target, book: BookOpen, message: MessageCircle, swords: Swords, alert: CircleAlert,
};

// Dark palette — same token-map technique as KnowledgeAskScreen, scoped to this file.
const D = {
  canvas: COLORS.background, card: 'rgba(255,255,255,0.05)',
  ink: COLORS.textPrimary, sub: COLORS.textSecondary, muted: COLORS.textSecondary,
  faint: 'rgba(255,255,255,0.38)', hair: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.16)',
  white: '#FFFFFF',
  indigo: COLORS.primary, indigoSoft: 'rgba(124,58,237,0.16)',
  blue: '#60A5FA', blueSoft: 'rgba(96,165,250,0.16)',
  emerald: COLORS.success, emeraldSoft: 'rgba(16,185,129,0.16)',
  orange: COLORS.warning, orangeSoft: 'rgba(249,115,22,0.16)',
  gold: '#F5C451', goldSoft: 'rgba(245,196,81,0.16)',
  rose: '#FB7185', roseSoft: 'rgba(251,113,133,0.16)',
  red: COLORS.error, redSoft: 'rgba(239,68,68,0.16)',
};

// Counts up on first appearance only; snaps to the new value on a background refresh.
function StatNum({ value, suffix = '' }) {
  const first = useRef(true);
  useEffect(() => { first.current = false; }, []);
  return first.current
    ? <CountUp value={value} suffix={suffix} duration={900} w="black" s={18} c={D.ink} style={{ marginTop: 8 }} />
    : <T w="black" s={18} c={D.ink} style={{ marginTop: 8 }}>{value}{suffix}</T>;
}

function Badge({ item, delay = 0 }) {
  const Icon = ICONS[item.icon] || Trophy;
  const earned = !!item.unlocked;
  return (
    <PopIn delay={delay} style={{ width: 92, alignItems: 'center' }}>
      <Float distance={earned ? 6 : 0} duration={2600}>
        <View style={[hs.badge, !earned && hs.badgeLocked]}>
          {earned && <View style={{ position: 'absolute' }}><SoftGlow size={70} color={D.gold} opacity={0.4} /></View>}
          <Icon size={23} color={earned ? D.gold : D.faint} strokeWidth={2.4} />
          {earned && <Shine delay={1200} gap={4200} width={30} />}
        </View>
      </Float>
      <T w="bold" s={10.5} c={earned ? D.ink : D.faint} numberOfLines={2} style={{ textAlign: 'center', marginTop: 8, lineHeight: 13 }}>{item.title}</T>
    </PopIn>
  );
}

// Static dark placeholder block (Shimmer's shared component is hardcoded light-gray,
// which would look wrong here — this screen's loading state stays simple instead).
function SkelBlock({ w, h, r = 14, mt = 0 }) {
  return <View style={{ width: w, height: h, borderRadius: r, marginTop: mt, backgroundColor: D.card, borderWidth: 1, borderColor: D.hair }} />;
}
function Skeleton() {
  return (
    <View style={{ paddingHorizontal: PAD, paddingTop: 24, alignItems: 'center' }}>
      <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: D.card, borderWidth: 1, borderColor: D.hair }} />
      <SkelBlock w={140} h={18} mt={16} />
      <SkelBlock w={190} h={13} mt={10} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 26, width: '100%' }}>
        {[0, 1, 2, 3].map((i) => <SkelBlock key={i} w="47%" h={92} r={18} />)}
      </View>
      <SkelBlock w="100%" h={160} r={20} mt={30} />
    </View>
  );
}

function ErrorState({ onRetry }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
      <View style={hs.errIcon}><CircleAlert size={30} color={D.muted} strokeWidth={2} /></View>
      <T w="xbold" s={18} c={D.ink} style={{ textAlign: 'center' }}>Couldn’t load your profile</T>
      <T w="med" s={13} c={D.muted} style={{ textAlign: 'center' }}>Check your connection and try again.</T>
      <PressableScale style={hs.retryBtn} onPress={onRetry} accessibilityLabel="Retry">
        <T w="bold" s={14} c="#fff">Retry</T>
      </PressableScale>
    </View>
  );
}

function Toggle({ on, onPress }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.92} accessibilityRole="switch" accessibilityState={{ checked: on }}>
      <View style={[hs.toggle, on && hs.toggleOn]}>
        <View style={[hs.toggleThumb, on && hs.toggleThumbOn]} />
      </View>
    </PressableScale>
  );
}

const ProfileScreen = () => {
  const { user, signOut, scope, setActiveView, updatePhoto } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Photo access needed', 'Allow photo access to choose a picture.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets?.length) applyPhoto(res.assets[0]);
  };
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Camera access needed', 'Allow camera access to take a picture.'); return; }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets?.length) applyPhoto(res.assets[0]);
  };
  const applyPhoto = async (asset) => {
    setPhotoBusy(true);
    try {
      await updatePhoto(asset);
    } catch (_) {
      Alert.alert('Couldn’t update photo', 'Please check your connection and try again.');
    } finally {
      setPhotoBusy(false);
    }
  };
  const changePhoto = () => {
    if (photoBusy) return;
    Alert.alert('Profile photo', 'Change your profile photo', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const [soundOn, setSoundOn] = useState(true);
  useEffect(() => { getSoundEnabledAsync().then(setSoundOn); }, []);
  const toggleSound = () => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next); };

  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState(false);
  const mounted = useRef(true);
  const initialLoad = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  const load = useCallback(async (isRefresh) => {
    try {
      const rep = await getParentReport();
      if (!mounted.current) return;
      setReport(rep || null); setErr(false);
    } catch (_) {
      if (mounted.current && !isRefresh) setErr(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);
  // Refetch on focus so XP, streak, badges and the milestone stay in sync with progress
  // made on Home / Brain Gym / lessons. First focus loads with a skeleton; later focuses
  // refresh silently.
  useFocusEffect(useCallback(() => {
    load(!initialLoad.current);
    initialLoad.current = false;
  }, [load]));
  // Re-tapping the active Profile tab scrolls back to top.
  useEffect(() => {
    const unsub = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return unsub;
  }, [navigation]);
  const retry = () => { setLoading(true); setErr(false); load(false); };

  const firstName = report?.child?.firstName || user?.name?.split(' ')[0] || 'Student';
  const profileLine = [scope?.className, scope?.stream ? scope.stream.toUpperCase() : null, scope?.board]
    .filter(Boolean).join('  •  ') || 'Complete your profile';

  const bg       = report?.brainGym || {};
  const streak   = Number(bg.currentStreak) || 0;
  const xp       = Number(bg.totalXp) || 0;
  const accuracy = Number(bg.accuracy) || 0;
  const quizzes  = Number(bg.quizzesCompleted) || 0;
  const badges   = report?.achievements?.items || [];
  const unlocked = Number(report?.achievements?.unlockedCount) || 0;
  const nextLocked = badges.filter((b) => !b.unlocked).sort((a, c) => (c.progress || 0) - (a.progress || 0))[0] || null;

  const handleShare = () => {
    Share.share({ message: 'I’m learning with ailernova — an AI teacher, practice games and real progress tracking in one app. Come learn with me! 📚' }).catch(() => {});
  };
  const handleHelp = () => {
    Linking.openURL('mailto:support@ailernova.com?subject=Help%20with%20ailernova').catch(() =>
      Alert.alert('Contact us', 'Reach us anytime at support@ailernova.com'));
  };
  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const STATS = [
    { Icon: BookOpen,   tint: D.indigo, soft: D.indigoSoft, value: quizzes, label: 'Quizzes' },
    { Icon: Star,       tint: D.gold,   soft: D.goldSoft,   value: xp, label: 'XP Points' },
    { Icon: Flame,      tint: D.rose,   soft: D.roseSoft,   value: streak, label: 'Day Streak' },
    { Icon: TrendingUp, tint: D.emerald, soft: D.emeraldSoft, value: accuracy, suffix: '%', label: 'Accuracy' },
  ];

  return (
    <View style={hs.safe}>
      <StatusBar barStyle="light-content" backgroundColor={D.canvas} />

      <View style={[hs.header, { paddingTop: insets.top + 8 }]}>
        <PressableScale
          style={hs.hIcon}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={20} color={D.ink} strokeWidth={2.6} />
        </PressableScale>
        <T w="black" s={17} c={D.ink} style={{ letterSpacing: -0.3 }}>Profile</T>
        <View style={hs.hIcon} />
      </View>

      {loading ? (
        <Skeleton />
      ) : err ? (
        <ErrorState onRetry={retry} />
      ) : (
        <ScrollView ref={scrollRef} style={hs.body} contentContainerStyle={{ paddingBottom: 34, paddingTop: 6 }} showsVerticalScrollIndicator={false}>
          {/* ── Identity — bare on the canvas, no hero card ── */}
          <FadeInOnce id="prof-card" delay={30} y={16}>
            <View style={{ alignItems: 'center', marginTop: 2 }}>
              <PressableScale onPress={changePhoto} accessibilityLabel="Change profile photo">
                <View style={hs.avatar}>
                  {user?.photoUrl ? (
                    <Image source={{ uri: user.photoUrl }} style={hs.avatarImg} />
                  ) : (
                    <T w="black" s={26} c={D.indigo}>{firstName[0].toUpperCase()}</T>
                  )}
                  {photoBusy && (
                    <View style={hs.avatarBusy}><ActivityIndicator color="#fff" size="small" /></View>
                  )}
                </View>
                <View style={hs.avatarBadge}><Camera size={12} color="#fff" strokeWidth={2.4} /></View>
              </PressableScale>
              <T w="black" s={19} c={D.ink} style={{ marginTop: 12, letterSpacing: -0.3 }}>{user?.name || firstName}</T>
              <T w="semi" s={12.5} c={D.sub} style={{ marginTop: 3 }}>{profileLine}</T>
              {!!(user?.email || user?.phone) && (
                <T w="med" s={11.5} c={D.faint} style={{ marginTop: 2 }}>{user?.email || user?.phone}</T>
              )}
            </View>
          </FadeInOnce>

          {/* ── Real stats — 2x2 grid ── */}
          <FadeInOnce id="prof-stats" delay={40} y={14}>
            <View style={hs.statGrid}>
              {STATS.map((s) => (
                <View key={s.label} style={hs.statCard}>
                  <View style={[hs.statIcon, { backgroundColor: s.soft }]}>
                    <s.Icon size={15} color={s.tint} strokeWidth={2.6} />
                  </View>
                  <StatNum value={s.value} suffix={s.suffix || ''} />
                  <T w="semi" s={11} c={D.muted} style={{ marginTop: 1 }}>{s.label}</T>
                </View>
              ))}
            </View>
          </FadeInOnce>

          {/* ── Achievements (real) ── */}
          {badges.length > 0 && (
            <>
              <View style={hs.secHead}>
                <View style={[hs.secDot, { backgroundColor: D.gold }]} />
                <T w="black" s={16} c={D.ink} style={{ letterSpacing: -0.3 }}>What you’ve earned</T>
                <T w="bold" s={11.5} c={D.faint} style={{ marginLeft: 'auto' }}>{unlocked} unlocked</T>
              </View>
              <FadeInOnce id="prof-badges" delay={30} y={0}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 6, paddingVertical: 4 }}>
                  {badges.map((b, i) => <Badge key={b.id} item={b} delay={80 + i * 60} />)}
                </ScrollView>
              </FadeInOnce>
            </>
          )}

          {/* ── Closest badge (real milestone) ── */}
          {nextLocked && (
            <>
              <View style={hs.secHead}>
                <View style={[hs.secDot, { backgroundColor: D.indigo }]} />
                <T w="black" s={16} c={D.ink} style={{ letterSpacing: -0.3 }}>Almost there</T>
              </View>
              <FadeInOnce id="prof-next" delay={30} y={14}>
                <View style={hs.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                    <View style={hs.nextIcon}>{(() => { const I = ICONS[nextLocked.icon] || Trophy; return <I size={22} color={D.indigo} strokeWidth={2.5} />; })()}</View>
                    <View style={{ flex: 1 }}>
                      <T w="xbold" s={14.5} c={D.ink}>{nextLocked.title}</T>
                      <T w="semi" s={11.5} c={D.muted} style={{ marginTop: 1 }}>{nextLocked.desc || 'Keep going to unlock this'}</T>
                      <View style={hs.nextBar}>
                        <GrowFill pct={nextLocked.progress || 0} color={D.indigo} delay={250} style={{ height: '100%', borderRadius: 4 }} />
                      </View>
                    </View>
                    <View style={hs.pctPill}>
                      <T w="black" s={13} c="#fff">{Math.round((nextLocked.progress || 0) * 100)}%</T>
                    </View>
                  </View>
                </View>
              </FadeInOnce>
            </>
          )}

          {/* ── Settings (functional only) ── */}
          <View style={hs.secHead}>
            <View style={[hs.secDot, { backgroundColor: D.emerald }]} />
            <T w="black" s={16} c={D.ink} style={{ letterSpacing: -0.3 }}>Settings</T>
          </View>
          <FadeInOnce id="prof-settings" delay={30} y={14}>
            <View style={hs.menuCard}>
              <View style={[hs.menuRow, hs.menuDivider]}>
                <View style={[hs.menuIcon, { backgroundColor: D.orangeSoft }]}>{soundOn ? <Volume2 size={18} color={D.orange} strokeWidth={2.4} /> : <VolumeX size={18} color={D.orange} strokeWidth={2.4} />}</View>
                <View style={{ flex: 1 }}>
                  <T w="bold" s={14} c={D.ink}>Sound effects</T>
                  <T w="semi" s={11} c={D.muted} style={{ marginTop: 1 }}>Taps, wins & Brain Gym sounds</T>
                </View>
                <Toggle on={soundOn} onPress={toggleSound} />
              </View>
              <PressableScale style={[hs.menuRow, hs.menuDivider]} onPress={handleShare} accessibilityLabel="Share ailernova">
                <View style={[hs.menuIcon, { backgroundColor: D.blueSoft }]}><Share2 size={18} color={D.blue} strokeWidth={2.4} /></View>
                <T w="bold" s={14} c={D.ink} style={{ flex: 1 }}>Share ailernova</T>
                <ChevronRight size={18} color={D.faint} strokeWidth={2.4} />
              </PressableScale>
              <PressableScale style={hs.menuRow} onPress={handleHelp} accessibilityLabel="Help and support">
                <View style={[hs.menuIcon, { backgroundColor: 'rgba(192,132,252,0.16)' }]}><MessageCircle size={18} color="#C084FC" strokeWidth={2.4} /></View>
                <T w="bold" s={14} c={D.ink} style={{ flex: 1 }}>Help & support</T>
                <ChevronRight size={18} color={D.faint} strokeWidth={2.4} />
              </PressableScale>
            </View>
          </FadeInOnce>

          {/* ── Account actions — Log out is the prominent solid action here (the
              reference design), Switch to Parent stays the quieter soft-green one ── */}
          <FadeInOnce id="prof-actions" delay={40} y={14}>
            <PressableScale style={hs.parentBtn} onPress={() => setActiveView('parent')} accessibilityLabel="Switch to Parent view">
              <Users size={18} color={D.emerald} strokeWidth={2.5} />
              <T w="bold" s={14.5} c={D.emerald}>Switch to Parent view</T>
            </PressableScale>
            <Breathe>
              <PressableScale style={hs.logoutBtn} onPress={handleLogout} accessibilityLabel="Log out">
                <LogOut size={17} color="#fff" strokeWidth={2.5} />
                <T w="bold" s={14.5} c="#fff">Log out</T>
              </PressableScale>
            </Breathe>
          </FadeInOnce>

          <T w="semi" s={11.5} c={D.faint} style={{ textAlign: 'center', marginTop: 18 }}>ailernova · v{APP_VERSION}</T>
        </ScrollView>
      )}
    </View>
  );
};

const hs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.canvas },
  body: { flex: 1, paddingHorizontal: PAD },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: PAD, paddingBottom: 12 },
  hIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  errIcon: { width: 74, height: 74, borderRadius: 24, backgroundColor: D.card, borderWidth: 1, borderColor: D.hair, alignItems: 'center', justifyContent: 'center' },
  retryBtn: { marginTop: 6, backgroundColor: D.indigo, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 30, ...shadowSm },

  secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 10 },
  secDot: { width: 8, height: 8, borderRadius: 4 },

  // Identity
  avatar: { width: 74, height: 74, borderRadius: 37, backgroundColor: D.white, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: D.indigo, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarBusy: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  avatarBadge: { position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: D.indigo, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: D.canvas },

  // Stats — 2x2 grid of individual cards (the reference layout, not one hero strip)
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  statCard: { width: '47%', flexGrow: 1, backgroundColor: D.card, borderWidth: 1, borderColor: D.hair, borderRadius: 16, padding: 12 },
  statIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  // Cards
  card: { backgroundColor: D.card, borderRadius: 20, borderWidth: 1, borderColor: D.hair, padding: 16 },
  nextIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: D.indigoSoft, alignItems: 'center', justifyContent: 'center' },
  nextBar: { height: 6, backgroundColor: D.hair, borderRadius: 4, marginTop: 9, overflow: 'hidden' },
  pctPill: { backgroundColor: D.indigo, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },

  // Badges
  badge: { width: 66, height: 66, borderRadius: 20, backgroundColor: D.card, borderWidth: 1, borderColor: D.hair, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  badgeLocked: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: D.hair },

  // Settings menu
  menuCard: { backgroundColor: D.card, borderRadius: 20, borderWidth: 1, borderColor: D.hair, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 15 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: D.hair },
  menuIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toggle: { width: 46, height: 27, borderRadius: 14, backgroundColor: D.border, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: D.emerald },
  toggleThumb: { width: 21, height: 21, borderRadius: 11, backgroundColor: '#fff', ...shadowSm },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // Actions — Log out solid violet (primary), Switch to Parent soft green
  parentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: D.emeraldSoft, borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.35)', borderRadius: 16, paddingVertical: 15, marginTop: 24 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: D.indigo, borderRadius: 16, paddingVertical: 15, marginTop: 12, ...shadowSm },
});

export default ProfileScreen;
