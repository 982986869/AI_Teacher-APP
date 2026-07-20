// src/screens/ProfileScreen.js
// Student profile — REAL data on the shared design system (Nunito `T`, studentTheme, anim
// primitives), consistent with the Home. Stats, badges and the "closest badge" milestone
// all come from GET /api/parent/report (a student calling it gets their OWN progress). Only
// actions that actually DO something remain (sound toggle, share, help, switch to parent,
// log out) — no fake stats, no dead menu rows. Loading skeleton, error+retry, empty-safe.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, Alert, Share, Linking } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import {
  Volume2, VolumeX, Share2, MessageCircle, LogOut, Users, ChevronRight,
  Flame, Star, TrendingUp, Target, CircleAlert, Sparkles, Dumbbell, Zap,
  Trophy, BookOpen, Swords,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getSoundEnabledAsync, setSoundEnabled } from '../utils/sound';
import { getParentReport } from '../api/parentApi';
import { T } from './parent/ParentApp/constants';
import {
  S, shadow, shadowSm, InkSurface, SoftGlow, StudentScreenHeader, StudentErrorState,
} from '../theme/studentUI';
import {
  FadeInOnce, PressableScale, CountUp, GrowFill, Breathe, Float, PopIn, Shine, Shimmer,
} from './parent/ParentApp/anim';

const PAD = 18;
const APP_VERSION = Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';
const ICONS = {
  sparkle: Sparkles, dumbbell: Dumbbell, zap: Zap, trophy: Trophy, flame: Flame,
  target: Target, book: BookOpen, message: MessageCircle, swords: Swords, alert: CircleAlert,
};

// Counts up on first appearance only; snaps to the new value on a background refresh (F4).
function StatNum({ value, suffix = '' }) {
  const first = useRef(true);
  useEffect(() => { first.current = false; }, []);
  return first.current
    ? <CountUp value={value} suffix={suffix} duration={900} w="black" s={16} c="#fff" style={{ marginTop: 5 }} />
    : <T w="black" s={16} c="#fff" style={{ marginTop: 5 }}>{value}{suffix}</T>;
}

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
    </PopIn>
  );
}

function Skeleton() {
  return (
    <View style={{ paddingHorizontal: PAD, paddingTop: 8 }}>
      <Shimmer w="100%" h={210} r={24} />
      <Shimmer w={150} h={16} r={8} mt={26} />
      <Shimmer w="100%" h={110} r={20} mt={12} />
      <Shimmer w={120} h={16} r={8} mt={26} />
      <Shimmer w="100%" h={160} r={20} mt={12} />
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
  const { user, signOut, scope, setActiveView } = useAuth();
  const navigation = useNavigation();
  const scrollRef = useRef(null);

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
  // Re-tapping the active Profile tab scrolls back to top (F8).
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
    { Icon: BookOpen,   tint: '#9AA6FF', value: quizzes, label: 'Quizzes' },
    { Icon: Star,       tint: '#FFD34E', value: xp, label: 'XP points' },
    { Icon: Flame,      tint: '#FF9558', value: streak, label: 'Day streak' },
    { Icon: TrendingUp, tint: '#5AE6A0', value: accuracy, suffix: '%', label: 'Accuracy' },
  ];

  return (
    <View style={hs.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={S.canvas} translucent={false} />

      <StudentScreenHeader title="Profile" />

      {loading ? (
        <Skeleton />
      ) : err ? (
        <StudentErrorState title="Couldn’t load your profile" onRetry={retry} />
      ) : (
        <ScrollView ref={scrollRef} style={hs.body} contentContainerStyle={{ paddingBottom: 34, paddingTop: 6 }} showsVerticalScrollIndicator={false}>
          {/* ── Identity + real stats ── */}
          <FadeInOnce id="prof-card" delay={30} y={16}>
            <View style={hs.idShadow}>
              <View style={hs.idCard}>
                <InkSurface a="#4A3AA6" b="#241C55" glow={S.heroGlow} radius={26} />
                <Float distance={7} duration={4200} style={{ position: 'absolute', top: -10, right: -6 }}>
                  <Trophy size={110} color="rgba(255,255,255,0.08)" strokeWidth={1.4} />
                </Float>
                <View style={{ alignItems: 'center' }}>
                  <View style={hs.avatar}><T w="black" s={30} c={S.indigo}>{firstName[0].toUpperCase()}</T></View>
                  <T w="black" s={21} c="#fff" style={{ marginTop: 12, letterSpacing: -0.4 }}>{user?.name || firstName}</T>
                  <T w="semi" s={12.5} c="rgba(255,255,255,0.7)" style={{ marginTop: 3 }}>{profileLine}</T>
                  {!!(user?.email || user?.phone) && (
                    <T w="med" s={11.5} c="rgba(255,255,255,0.5)" style={{ marginTop: 2 }}>{user?.email || user?.phone}</T>
                  )}
                </View>
                <View style={hs.statStrip}>
                  {STATS.map((st, i) => (
                    <View key={st.label} style={[hs.statBox, i < STATS.length - 1 && hs.statDiv]}>
                      <st.Icon size={15} color={st.tint} strokeWidth={2.7} />
                      <StatNum value={st.value} suffix={st.suffix || ''} />
                      <T w="semi" s={9} c="rgba(255,255,255,0.6)" style={{ marginTop: 1 }}>{st.label}</T>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </FadeInOnce>

          {/* ── Achievements (real) ── */}
          {badges.length > 0 && (
            <>
              <View style={hs.secHead}>
                <View style={[hs.secDot, { backgroundColor: S.gold }]} />
                <T w="black" s={16} c={S.ink} style={{ letterSpacing: -0.3 }}>What you’ve earned</T>
                <T w="bold" s={11.5} c={S.faint} style={{ marginLeft: 'auto' }}>{unlocked} unlocked</T>
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
                <View style={[hs.secDot, { backgroundColor: S.indigo }]} />
                <T w="black" s={16} c={S.ink} style={{ letterSpacing: -0.3 }}>Almost there</T>
              </View>
              <FadeInOnce id="prof-next" delay={30} y={14}>
                <View style={hs.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                    <View style={hs.nextIcon}>{(() => { const I = ICONS[nextLocked.icon] || Trophy; return <I size={22} color={S.indigo} strokeWidth={2.5} />; })()}</View>
                    <View style={{ flex: 1 }}>
                      <T w="xbold" s={14.5} c={S.ink}>{nextLocked.title}</T>
                      <T w="semi" s={11.5} c={S.muted} style={{ marginTop: 1 }}>{nextLocked.desc || 'Keep going to unlock this'}</T>
                      <View style={hs.nextBar}>
                        <GrowFill pct={nextLocked.progress || 0} color={S.indigo} delay={250} style={{ height: '100%', borderRadius: 4 }} />
                      </View>
                    </View>
                    <T w="black" s={15} c={S.indigo}>{Math.round((nextLocked.progress || 0) * 100)}%</T>
                  </View>
                </View>
              </FadeInOnce>
            </>
          )}

          {/* ── Settings (functional only) ── */}
          <View style={hs.secHead}>
            <View style={[hs.secDot, { backgroundColor: S.emerald }]} />
            <T w="black" s={16} c={S.ink} style={{ letterSpacing: -0.3 }}>Settings</T>
          </View>
          <FadeInOnce id="prof-settings" delay={30} y={14}>
            <View style={hs.menuCard}>
              <View style={[hs.menuRow, hs.menuDivider]}>
                <View style={[hs.menuIcon, { backgroundColor: S.orangeSoft }]}>{soundOn ? <Volume2 size={18} color={S.orange} strokeWidth={2.4} /> : <VolumeX size={18} color={S.orange} strokeWidth={2.4} />}</View>
                <View style={{ flex: 1 }}>
                  <T w="bold" s={14} c={S.ink}>Sound effects</T>
                  <T w="semi" s={11} c={S.muted} style={{ marginTop: 1 }}>Taps, wins & Brain Gym sounds</T>
                </View>
                <Toggle on={soundOn} onPress={toggleSound} />
              </View>
              <PressableScale style={[hs.menuRow, hs.menuDivider]} onPress={handleShare} accessibilityLabel="Share ailernova">
                <View style={[hs.menuIcon, { backgroundColor: S.blueSoft }]}><Share2 size={18} color={S.blue} strokeWidth={2.4} /></View>
                <T w="bold" s={14} c={S.ink} style={{ flex: 1 }}>Share ailernova</T>
                <ChevronRight size={18} color={S.faint} strokeWidth={2.4} />
              </PressableScale>
              <PressableScale style={hs.menuRow} onPress={handleHelp} accessibilityLabel="Help and support">
                <View style={[hs.menuIcon, { backgroundColor: S.purpleSoft }]}><MessageCircle size={18} color={S.purple} strokeWidth={2.4} /></View>
                <T w="bold" s={14} c={S.ink} style={{ flex: 1 }}>Help & support</T>
                <ChevronRight size={18} color={S.faint} strokeWidth={2.4} />
              </PressableScale>
            </View>
          </FadeInOnce>

          {/* ── Account actions ── */}
          <FadeInOnce id="prof-actions" delay={40} y={14}>
            <Breathe>
              <PressableScale style={hs.parentBtn} onPress={() => setActiveView('parent')} accessibilityLabel="Switch to Parent view">
                <Users size={18} color={S.emerald} strokeWidth={2.5} />
                <T w="bold" s={14.5} c={S.emerald}>Switch to Parent view</T>
              </PressableScale>
            </Breathe>
            <PressableScale style={hs.logoutBtn} onPress={handleLogout} accessibilityLabel="Log out">
              <LogOut size={17} color={S.red} strokeWidth={2.5} />
              <T w="bold" s={14.5} c={S.red}>Log out</T>
            </PressableScale>
          </FadeInOnce>

          <T w="semi" s={11.5} c={S.faint} style={{ textAlign: 'center', marginTop: 18 }}>ailernova · v{APP_VERSION}</T>
        </ScrollView>
      )}
    </View>
  );
};

const hs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: S.canvas },
  body: { flex: 1, paddingHorizontal: PAD },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  header: { paddingHorizontal: PAD, paddingBottom: 12 },

  errIcon: { width: 74, height: 74, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: S.hair, alignItems: 'center', justifyContent: 'center', ...shadowSm },
  retryBtn: { marginTop: 6, backgroundColor: S.indigo, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 30, ...shadowSm },

  secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 },
  secDot: { width: 8, height: 8, borderRadius: 4 },

  // Identity card
  idShadow: { borderRadius: 26, backgroundColor: S.heroB, marginTop: 8, shadowColor: '#241C55', shadowOpacity: 0.30, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 11 },
  idCard: { borderRadius: 26, overflow: 'hidden', padding: 22 },
  avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)' },
  statStrip: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 18, paddingVertical: 12, marginTop: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statDiv: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.12)' },

  // Cards
  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: S.hair, padding: 16, ...shadow },
  nextIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: S.indigoSoft, alignItems: 'center', justifyContent: 'center' },
  nextBar: { height: 6, backgroundColor: S.hair, borderRadius: 4, marginTop: 9, overflow: 'hidden' },

  // Badges
  badge: { width: 68, height: 68, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: S.hair, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...shadow },
  badgeLocked: { backgroundColor: '#F2F3F8', borderColor: S.border },

  // Settings menu
  menuCard: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: S.hair, overflow: 'hidden', ...shadow },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 15 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: S.hair },
  menuIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toggle: { width: 46, height: 27, borderRadius: 14, backgroundColor: S.border, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: S.emerald },
  toggleThumb: { width: 21, height: 21, borderRadius: 11, backgroundColor: '#fff', ...shadowSm },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // Actions
  parentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: S.emeraldSoft, borderWidth: 1.5, borderColor: '#B7E9C6', borderRadius: 16, paddingVertical: 15, marginTop: 24 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: S.redSoft, borderWidth: 1.5, borderColor: '#FAD1D1', borderRadius: 16, paddingVertical: 15, marginTop: 12 },
});

export default ProfileScreen;
