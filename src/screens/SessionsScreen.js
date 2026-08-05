// src/screens/SessionsScreen.js
// The Student "Sessions" tab, on the shared night palette (src/theme/nightTheme.js)
// so it matches Home and the auth flow.
//
//   header → live/next class card → Recorded Lectures (subject chips + date range +
//   grid/list toggle) → upcoming → past classes
//
// Still reads the REAL sessions an admin publishes (GET /api/sessions, class-scoped and
// active-only server-side). When nothing is published it falls back to the honest
// "coming soon" panel rather than a fake schedule.
//
// Two things the design asks for that the data cannot honestly supply:
//   • There is no 'live' status — the server only stores 'scheduled' | 'completed'.
//     LIVE is DERIVED: now is inside [startsAt, startsAt + durationMin]. A 30s tick
//     re-evaluates it so the badge appears and clears on its own.
//   • There is no percent-watched. Recordings open in the system player via
//     Linking.openURL, so playback position is unobservable. The ring is therefore
//     binary — New or Watched, from markRecordingWatched() — instead of an invented
//     "30%". Wire a real number in only if playback moves in-app.
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, Linking, Pressable, Modal, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Video, Users, MessageCircle, CirclePlay, CircleCheck, Bell, MapPin,
  Calendar, Clock, Play, LayoutGrid, List, ChevronDown, Check,
} from 'lucide-react-native';
import {
  useFonts as useAuroraFonts,
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { N, NFONT } from '../theme/nightTheme';
import { NightBg, Appear } from '../theme/nightChrome';
import {
  getHomeState, saveHomeState, getWatchedRecordings, markRecordingWatched,
} from '../utils/storage';
import { getStudentSessions } from '../api/sessionsApi';

const { width: W } = Dimensions.get('window');
const PAD = 18;
const GRID_W = (W - PAD * 2 - 12) / 2;

const FEATURES = [
  { Icon: Users,         title: 'Learn from expert teachers', sub: 'Live classes with top educators for your class' },
  { Icon: MessageCircle, title: 'Solve doubts in real time',  sub: 'Ask questions and get answered on the spot' },
  { Icon: CirclePlay,    title: 'Rewatch any class',          sub: 'Every session is recorded, yours to replay' },
];

const RANGES = [
  { key: 'all',   label: 'All time',     days: null },
  { key: 'd7',    label: 'Last 7 days',  days: 7 },
  { key: 'd30',   label: 'Last 30 days', days: 30 },
  { key: 'd90',   label: 'Last 3 months', days: 90 },
];

// DEMO — a dummy recorded lecture so the Recorded Lectures section always has something
// to show. Video is a real Ailernova clip (ailernova.in; .com has none). Remove this and
// the `DUMMY_RECORDING` reference below once real recordings are published. Note it also
// keeps `hasAnything` true, so the coming-soon panel stays hidden while it exists.
const DUMMY_RECORDING = {
  id: 'demo-recording',
  title: 'Sample Recorded Lecture',
  subject: 'Demo',
  teacherName: 'Ms. Nova',
  durationMin: 12,
  startsAt: '2026-07-20T10:00:00.000Z',
  status: 'completed',
  recordingUrl: 'https://ailernova.in/wp-content/themes/ailernova-theme/image/0_Student_Girl_1280x720.mp4',
};

const DAY = 86400000;
const ms = (iso) => new Date(iso).getTime();
const fmtDay   = (iso) => new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtShort = (d)   => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const fmtTime  = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

// ── type helper ─────────────────────────────────────────────────────────────
function T({ w = 'reg', s = 14, c = N.inkSoft, F, style, children, ...rest }) {
  const fam = w === 'bold' ? F.bold : w === 'semi' || w === 'med' ? F.med : F.reg;
  return <Text {...rest} style={[{ fontFamily: fam, fontSize: s, color: c }, style]}>{children}</Text>;
}

// ── watched ring: full green + tick once opened, empty track + play until then ──
function WatchRing({ watched, size = 46 }) {
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={N.track} strokeWidth={4} fill="none" />
        {watched && (
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={N.green} strokeWidth={4} fill="none"
            strokeDasharray={`${c} ${c}`} strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      {watched
        ? <Check size={18} color={N.green} strokeWidth={3} />
        : <Play size={16} color={N.violet} strokeWidth={2.5} fill={N.violet} />}
    </View>
  );
}

// ── aurora placeholder thumbnail (no thumbnail_url column on sessions) ──────
function Thumb({ style, radius = 12 }) {
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      <LinearGradient
        colors={[N.orbA, N.orbB]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={hs.thumbDot} />
    </View>
  );
}

export default function SessionsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [fontsLoaded] = useAuroraFonts({
    SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
  });
  const F = fontsLoaded ? NFONT : { reg: undefined, med: undefined, semi: undefined, bold: undefined };

  const [sessions, setSessions] = useState(null); // null = loading
  const [notified, setNotified] = useState(false);
  const [loaded, setLoaded]     = useState(false);
  const [watched, setWatched]   = useState({});
  const [subject, setSubject]   = useState('All');
  const [range, setRange]       = useState('all');
  const [view, setView]         = useState('list'); // 'list' | 'grid'
  const [rangeOpen, setRangeOpen] = useState(false);
  const [now, setNow]           = useState(() => Date.now());

  // Re-evaluate the derived LIVE window without a refetch.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    getHomeState()
      .then((st) => { setNotified(!!st?.sessionsReminder); if (st?.sessionsView) setView(st.sessionsView); })
      .catch(() => {})
      .finally(() => setLoaded(true));
    getWatchedRecordings().then(setWatched).catch(() => {});
  }, []);

  const setReminder = () => { setNotified(true); saveHomeState({ sessionsReminder: true }); };
  const setViewMode = (v) => { setView(v); saveHomeState({ sessionsView: v }); };

  useFocusEffect(useCallback(() => {
    let alive = true;
    getStudentSessions().then((rows) => { if (alive) setSessions(rows); }).catch(() => { if (alive) setSessions([]); });
    getWatchedRecordings().then((w) => { if (alive) setWatched(w); }).catch(() => {});
    return () => { alive = false; };
  }, []));

  useEffect(() => {
    const unsub = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return unsub;
  }, [navigation]);

  const openRecording = async (s) => {
    await markRecordingWatched(s.id);
    setWatched((w) => ({ ...w, [s.id]: new Date().toISOString() }));
    Linking.openURL(s.recordingUrl).catch(() => {});
  };

  const rows = useMemo(() => sessions || [], [sessions]);
  const isLive = (s) =>
    s.status === 'scheduled' && now >= ms(s.startsAt) && now <= ms(s.startsAt) + (s.durationMin || 0) * 60000;

  const scheduled = rows.filter((s) => s.status === 'scheduled').sort((a, b) => ms(a.startsAt) - ms(b.startsAt));
  const hero = scheduled.find(isLive) || scheduled[0] || null;
  const restUpcoming = scheduled.filter((s) => s !== hero);
  const allRecordings = useMemo(() => [...rows.filter((s) => !!s.recordingUrl), DUMMY_RECORDING], [rows]);
  const past = rows.filter((s) => s.status === 'completed' && !s.recordingUrl);

  const subjects = useMemo(() => {
    const set = [];
    allRecordings.forEach((s) => { if (s.subject && !set.includes(s.subject)) set.push(s.subject); });
    return ['All', ...set];
  }, [allRecordings]);

  // Keep the chip valid if the recording list changes under it.
  useEffect(() => {
    if (subject !== 'All' && !subjects.includes(subject)) setSubject('All');
  }, [subjects, subject]);

  const activeRange = RANGES.find((r) => r.key === range) || RANGES[0];
  const rangeLabel = useMemo(() => {
    if (!activeRange.days) return 'All time';
    const from = new Date(now - activeRange.days * DAY);
    return `${fmtShort(from)} – ${fmtShort(new Date(now))}`;
  }, [activeRange, now]);

  const recordings = useMemo(() => allRecordings
    .filter((s) => subject === 'All' || s.subject === subject)
    .filter((s) => !activeRange.days || ms(s.startsAt) >= now - activeRange.days * DAY)
    .sort((a, b) => ms(b.startsAt) - ms(a.startsAt)),
  [allRecordings, subject, activeRange, now]);

  const hasAnything = rows.length > 0 || allRecordings.length > 0;
  const filtersActive = subject !== 'All' || range !== 'all';

  return (
    <View style={hs.root}>
      <StatusBar barStyle="light-content" backgroundColor={N.bgTop} translucent={false} />
      <NightBg id="ss" />

      <ScrollView
        ref={scrollRef}
        style={hs.body}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Appear delay={30}>
          <T F={F} w="bold" s={34} c={N.ink} style={{ letterSpacing: -0.8 }}>Live sessions</T>
          <T F={F} s={15} c={N.inkSoft} style={{ marginTop: 4 }}>1:1 classes with real teachers</T>
        </Appear>

        {sessions === null ? (
          <View style={{ paddingTop: 20 }}>
            {[0, 1].map((i) => <View key={i} style={hs.skeleton} />)}
          </View>
        ) : hasAnything ? (
          <>
            {/* Live / next class */}
            {!!hero && (
              <Appear delay={70}>
                <View style={[hs.heroWrap, isLive(hero) && hs.heroWrapLive]}>
                  <View style={hs.heroRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={hs.heroTagRow}>
                        {isLive(hero) ? (
                          <View style={hs.livePill}>
                            <View style={hs.liveDot} />
                            <T F={F} w="bold" s={11} c="#FF5F7A" style={{ letterSpacing: 0.8 }}>LIVE</T>
                          </View>
                        ) : (
                          <View style={hs.soonPill}>
                            <T F={F} w="bold" s={11} c={N.amber} style={{ letterSpacing: 0.8 }}>UPCOMING</T>
                          </View>
                        )}
                        <T F={F} w="bold" s={13} c={N.violet} numberOfLines={1} style={{ letterSpacing: 0.4, flex: 1 }}>
                          {[hero.subject, hero.teacherName].filter(Boolean).join(' • ').toUpperCase()}
                        </T>
                      </View>

                      <T F={F} w="bold" s={20} c={N.ink} numberOfLines={2} style={{ marginTop: 10, letterSpacing: -0.3 }}>
                        {hero.title}
                      </T>

                      <View style={hs.heroMeta}>
                        <View style={hs.metaItem}>
                          <Calendar size={14} color={N.violet} strokeWidth={2} />
                          <T F={F} w="med" s={13} c={N.inkSoft}>{fmtTime(hero.startsAt)}</T>
                        </View>
                        <View style={hs.metaItem}>
                          <Clock size={14} color={N.amber} strokeWidth={2} />
                          <T F={F} w="med" s={13} c={N.inkSoft}>{hero.durationMin}m</T>
                        </View>
                        {hero.mode === 'offline' && !!hero.location && (
                          <View style={hs.metaItem}>
                            <MapPin size={14} color={N.blue} strokeWidth={2} />
                            <T F={F} w="med" s={13} c={N.inkSoft} numberOfLines={1}>{hero.location}</T>
                          </View>
                        )}
                      </View>
                    </View>

                    {!!hero.meetingLink && hero.mode !== 'offline' && (
                      <Pressable
                        onPress={() => Linking.openURL(hero.meetingLink).catch(() => {})}
                        accessibilityRole="button"
                        accessibilityLabel={`Join ${hero.title}`}
                        style={({ pressed }) => [hs.joinWrap, pressed && { transform: [{ scale: 0.97 }] }]}
                      >
                        <LinearGradient
                          colors={[N.violet, '#A855F7']}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                          style={hs.join}
                        >
                          <Play size={17} color={N.ink} strokeWidth={2.5} fill={N.ink} />
                          <T F={F} w="bold" s={15} c={N.ink}>Join</T>
                        </LinearGradient>
                      </Pressable>
                    )}
                  </View>
                </View>
              </Appear>
            )}

            <View style={hs.divider} />

            {/* Recorded Lectures */}
            <Appear delay={110}>
              <View style={hs.sectionRow}>
                <View style={hs.sectionTitle}>
                  <View style={hs.sectionDot} />
                  <T F={F} w="bold" s={20} c={N.ink} style={{ letterSpacing: -0.3 }}>Recorded Lectures</T>
                </View>
                <View style={hs.toggle}>
                  <Pressable
                    onPress={() => setViewMode('grid')}
                    accessibilityRole="button"
                    accessibilityLabel="Grid view"
                    accessibilityState={{ selected: view === 'grid' }}
                    style={[hs.toggleBtn, view === 'grid' && hs.toggleBtnOn]}
                  >
                    <LayoutGrid size={18} color={view === 'grid' ? N.violet : N.inkSoft} strokeWidth={2} />
                  </Pressable>
                  <Pressable
                    onPress={() => setViewMode('list')}
                    accessibilityRole="button"
                    accessibilityLabel="List view"
                    accessibilityState={{ selected: view === 'list' }}
                    style={[hs.toggleBtn, view === 'list' && hs.toggleBtnOn]}
                  >
                    <List size={18} color={view === 'list' ? N.violet : N.inkSoft} strokeWidth={2} />
                  </Pressable>
                </View>
              </View>
            </Appear>

            {allRecordings.length > 0 && (
              <>
                {/* Subject chips — derived from the recordings that exist, not hardcoded */}
                {subjects.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={hs.chipsRow}
                    style={{ marginHorizontal: -PAD }}
                  >
                    {subjects.map((sub) => {
                      const on = subject === sub;
                      return (
                        <Pressable
                          key={sub}
                          onPress={() => setSubject(sub)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                          style={[hs.chip, on && hs.chipOn]}
                        >
                          <T F={F} w="med" s={15} c={on ? N.ink : N.inkSoft}>{sub}</T>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}

                {/* Date range */}
                <Pressable
                  onPress={() => setRangeOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Date range: ${rangeLabel}`}
                  style={({ pressed }) => [hs.rangeChip, pressed && { opacity: 0.8 }]}
                >
                  <Calendar size={17} color={N.violet} strokeWidth={2} />
                  <T F={F} w="med" s={15} c={N.ink}>{rangeLabel}</T>
                  <ChevronDown size={18} color={N.inkSoft} strokeWidth={2} />
                </Pressable>
              </>
            )}

            {recordings.length > 0 ? (
              view === 'list' ? (
                recordings.map((s, i) => (
                  <Appear key={s.id} delay={40 + i * 30}>
                    <Pressable
                      onPress={() => openRecording(s)}
                      accessibilityRole="button"
                      accessibilityLabel={`Watch recording: ${s.title}`}
                      style={({ pressed }) => [hs.recRow, pressed && { opacity: 0.85 }]}
                    >
                      <Thumb style={hs.recThumb} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={hs.recTopRow}>
                          <T F={F} w="bold" s={12.5} c={N.violet} style={{ letterSpacing: 0.5 }} numberOfLines={1}>
                            {(s.subject || 'Class').toUpperCase()}
                          </T>
                          {!!s.teacherName && (
                            <>
                              <View style={hs.metaDot} />
                              <T F={F} s={12.5} c={N.inkSoft} numberOfLines={1} style={{ flexShrink: 1 }}>{s.teacherName}</T>
                            </>
                          )}
                        </View>
                        <T F={F} w="bold" s={16} c={N.ink} numberOfLines={2} style={{ marginTop: 3, lineHeight: 21 }}>
                          {s.title}
                        </T>
                        <View style={hs.recTopRow}>
                          <T F={F} s={13} c={N.inkDim}>{fmtDay(s.startsAt)}</T>
                          <View style={hs.metaDot} />
                          <T F={F} s={13} c={N.inkDim}>{s.durationMin} min</T>
                        </View>
                      </View>
                      <WatchRing watched={!!watched[s.id]} />
                    </Pressable>
                  </Appear>
                ))
              ) : (
                <View style={hs.grid}>
                  {recordings.map((s, i) => (
                    <Appear key={s.id} delay={40 + i * 30} style={{ width: GRID_W }}>
                      <Pressable
                        onPress={() => openRecording(s)}
                        accessibilityRole="button"
                        accessibilityLabel={`Watch recording: ${s.title}`}
                        style={({ pressed }) => [hs.gridCard, pressed && { opacity: 0.85 }]}
                      >
                        <Thumb style={hs.gridThumb} radius={0} />
                        <View style={{ padding: 12 }}>
                          <T F={F} w="bold" s={11.5} c={N.violet} style={{ letterSpacing: 0.5 }} numberOfLines={1}>
                            {(s.subject || 'Class').toUpperCase()}
                          </T>
                          <T F={F} w="bold" s={14} c={N.ink} numberOfLines={2} style={{ marginTop: 4, lineHeight: 19 }}>
                            {s.title}
                          </T>
                          <View style={[hs.recTopRow, { marginTop: 6, justifyContent: 'space-between' }]}>
                            <T F={F} s={12} c={N.inkDim}>{s.durationMin} min</T>
                            <WatchRing watched={!!watched[s.id]} size={26} />
                          </View>
                        </View>
                      </Pressable>
                    </Appear>
                  ))}
                </View>
              )
            ) : (
              <View style={hs.emptyCard}>
                <View style={hs.emptyIcon}><CirclePlay size={22} color={N.violet} strokeWidth={2} /></View>
                <View style={{ flex: 1 }}>
                  <T F={F} w="bold" s={14.5} c={N.ink}>
                    {filtersActive ? 'Nothing in this filter' : 'No recordings yet'}
                  </T>
                  <T F={F} s={13} c={N.inkSoft} style={{ marginTop: 3, lineHeight: 18 }}>
                    {filtersActive
                      ? 'Try another subject or widen the date range.'
                      : 'Completed classes will appear here to rewatch anytime.'}
                  </T>
                </View>
              </View>
            )}

            {/* Other upcoming classes */}
            {restUpcoming.length > 0 && (
              <>
                <View style={hs.sectionRow}>
                  <View style={hs.sectionTitle}>
                    <View style={[hs.sectionDot, { backgroundColor: N.blue }]} />
                    <T F={F} w="bold" s={20} c={N.ink} style={{ letterSpacing: -0.3 }}>Upcoming</T>
                  </View>
                </View>
                {restUpcoming.map((s) => (
                  <View key={s.id} style={hs.miniRow}>
                    <View style={hs.miniIcon}>
                      {s.mode === 'offline'
                        ? <MapPin size={18} color={N.blue} strokeWidth={2} />
                        : <Video size={18} color={N.blue} strokeWidth={2} />}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T F={F} w="bold" s={15} c={N.ink} numberOfLines={1}>{s.title}</T>
                      <T F={F} s={12.5} c={N.inkSoft} numberOfLines={1} style={{ marginTop: 2 }}>
                        {[s.subject, s.teacherName].filter(Boolean).join(' · ')} · {fmtDay(s.startsAt)} · {fmtTime(s.startsAt)}
                      </T>
                    </View>
                    {!!s.meetingLink && s.mode !== 'offline' && (
                      <Pressable
                        onPress={() => Linking.openURL(s.meetingLink).catch(() => {})}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Join ${s.title}`}
                        style={hs.miniJoin}
                      >
                        <T F={F} w="bold" s={13} c={N.violet}>Join</T>
                      </Pressable>
                    )}
                  </View>
                ))}
              </>
            )}

            {/* Completed with no recording — kept so a past class never vanishes */}
            {past.length > 0 && (
              <>
                <View style={hs.sectionRow}>
                  <View style={hs.sectionTitle}>
                    <View style={[hs.sectionDot, { backgroundColor: N.green }]} />
                    <T F={F} w="bold" s={20} c={N.ink} style={{ letterSpacing: -0.3 }}>Past classes</T>
                  </View>
                </View>
                {past.map((s) => (
                  <View key={s.id} style={hs.miniRow}>
                    <View style={[hs.miniIcon, { backgroundColor: N.greenSoft }]}>
                      <CircleCheck size={18} color={N.green} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T F={F} w="bold" s={15} c={N.ink} numberOfLines={1}>{s.title}</T>
                      <T F={F} s={12.5} c={N.inkSoft} numberOfLines={1} style={{ marginTop: 2 }}>
                        {[s.subject, s.teacherName].filter(Boolean).join(' · ')} · {fmtDay(s.startsAt)}
                      </T>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        ) : (
          // ── Honest coming-soon (nothing published yet) ──
          <>
            <Appear delay={70}>
              <View style={hs.comingCard}>
                <LinearGradient
                  colors={[N.heroA, N.heroB]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={hs.comingTag}>
                  <CircleCheck size={12} color="#DCD3FF" strokeWidth={2.6} />
                  <T F={F} w="bold" s={10.5} c="#DCD3FF" style={{ letterSpacing: 1 }}>COMING SOON</T>
                </View>
                <View style={hs.comingIcon}><Video size={28} color={N.ink} strokeWidth={2} /></View>
                <T F={F} w="bold" s={22} c={N.ink} style={{ marginTop: 14, letterSpacing: -0.3 }}>
                  Live 1:1 classes are on the way
                </T>
                <T F={F} s={13.5} c="rgba(255,255,255,0.78)" style={{ marginTop: 6, lineHeight: 20 }}>
                  Soon you'll book personal sessions with expert teachers — right here, whenever you need a hand.
                </T>
              </View>
            </Appear>

            <View style={hs.sectionRow}>
              <View style={hs.sectionTitle}>
                <View style={hs.sectionDot} />
                <T F={F} w="bold" s={20} c={N.ink} style={{ letterSpacing: -0.3 }}>What to expect</T>
              </View>
            </View>
            <View style={hs.featCard}>
              {FEATURES.map((f, i) => (
                <View key={f.title} style={[hs.featRow, i < FEATURES.length - 1 && hs.featDivider]}>
                  <View style={hs.featIcon}><f.Icon size={20} color={N.violet} strokeWidth={2} /></View>
                  <View style={{ flex: 1 }}>
                    <T F={F} w="bold" s={14.5} c={N.ink}>{f.title}</T>
                    <T F={F} s={12.5} c={N.inkSoft} style={{ marginTop: 2, lineHeight: 17 }}>{f.sub}</T>
                  </View>
                </View>
              ))}
            </View>

            {loaded && (notified ? (
              <View style={hs.savedNote}>
                <CircleCheck size={17} color={N.green} strokeWidth={2.4} />
                <T F={F} w="med" s={13} c={N.green} style={{ flex: 1, lineHeight: 18 }}>
                  Reminder saved on this device — we'll surface sessions here the moment they launch.
                </T>
              </View>
            ) : (
              <Pressable
                onPress={setReminder}
                accessibilityRole="button"
                style={({ pressed }) => [hs.remindWrap, pressed && { transform: [{ scale: 0.99 }] }]}
              >
                <LinearGradient
                  colors={[N.violet, '#A855F7']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={hs.remind}
                >
                  <Bell size={18} color={N.ink} strokeWidth={2.2} />
                  <T F={F} w="bold" s={15.5} c={N.ink}>Remind me at launch</T>
                </LinearGradient>
              </Pressable>
            ))}

            <View style={hs.hintRow}>
              <T F={F} s={14}>💡</T>
              <T F={F} s={12.5} c={N.inkSoft} style={{ flex: 1, lineHeight: 18 }}>
                In the meantime, your AI teacher is on the Home tab 24/7 — ask any doubt, anytime.
              </T>
            </View>
          </>
        )}
      </ScrollView>

      {/* Date range sheet */}
      <Modal visible={rangeOpen} transparent animationType="slide" onRequestClose={() => setRangeOpen(false)}>
        <Pressable style={hs.sheetBackdrop} onPress={() => setRangeOpen(false)} accessibilityLabel="Close" />
        <View style={[hs.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={hs.sheetGrab} />
          <T F={F} w="bold" s={18} c={N.ink} style={{ marginBottom: 12, paddingHorizontal: 4 }}>Date range</T>
          {RANGES.map((r) => {
            const on = range === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => { setRange(r.key); setRangeOpen(false); }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[hs.sheetItem, on && hs.sheetItemOn]}
              >
                <T F={F} w="med" s={15.5} c={on ? N.ink : N.inkSoft} style={{ flex: 1 }}>{r.label}</T>
                {on && <Check size={18} color={N.violet} strokeWidth={2.5} />}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}

const hs = StyleSheet.create({
  root: { flex: 1, backgroundColor: N.bg },
  body: { flex: 1, paddingHorizontal: PAD },

  skeleton: { height: 110, borderRadius: 18, backgroundColor: N.cardSoft, marginBottom: 12 },

  // live / next class
  heroWrap: {
    marginTop: 18, borderRadius: 20, padding: 16,
    backgroundColor: 'rgba(10,8,26,0.5)',
    borderWidth: 1.5, borderColor: N.cardEdge,
  },
  heroWrapLive: {
    borderColor: N.violet,
    shadowColor: N.violet, shadowOpacity: 0.45, shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  heroRow:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroTagRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#FF5F7A', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  liveDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF5F7A' },
  soonPill: {
    borderWidth: 1.5, borderColor: N.amber, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  joinWrap: {
    borderRadius: 16,
    shadowColor: N.violet, shadowOpacity: 0.5, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  join: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 22, height: 54, borderRadius: 16,
  },

  divider: { height: 1, backgroundColor: N.cardEdge, marginVertical: 22 },

  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 14 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  sectionDot:   { width: 9, height: 9, borderRadius: 5, backgroundColor: N.violet },

  toggle:      { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(10,8,26,0.5)',
    borderWidth: 1.5, borderColor: N.cardEdge,
  },
  toggleBtnOn: { borderColor: N.violet, backgroundColor: N.violetSoft },

  chipsRow: { gap: 10, paddingHorizontal: PAD, paddingBottom: 4 },
  chip: {
    height: 46, paddingHorizontal: 22, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(10,8,26,0.5)',
    borderWidth: 1.5, borderColor: N.cardEdge,
  },
  chipOn: { backgroundColor: N.violet, borderColor: N.violet },

  rangeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start',
    height: 48, paddingHorizontal: 16, borderRadius: 14, marginTop: 14, marginBottom: 16,
    backgroundColor: 'rgba(10,8,26,0.5)',
    borderWidth: 1.5, borderColor: N.cardEdge,
  },

  // list rows
  recRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 12, borderRadius: 18, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1, borderColor: N.cardEdge,
  },
  recThumb:  { width: 82, height: 82 },
  recTopRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  metaDot:   { width: 3, height: 3, borderRadius: 2, backgroundColor: N.inkDim },

  thumbDot: {
    position: 'absolute', top: '50%', left: '50%',
    width: 22, height: 22, borderRadius: 11, marginTop: -11, marginLeft: -11,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },

  // grid
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: {
    borderRadius: 18, overflow: 'hidden', marginBottom: 0,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1, borderColor: N.cardEdge,
  },
  gridThumb: { width: '100%', aspectRatio: 16 / 10 },

  // compact rows
  miniRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16, marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: N.cardEdge,
  },
  miniIcon: {
    width: 40, height: 40, borderRadius: 13, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center', backgroundColor: N.blueSoft,
  },
  miniJoin: {
    paddingHorizontal: 14, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: N.violetSoft, borderWidth: 1, borderColor: N.violet,
  },

  emptyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: N.cardEdge,
  },
  emptyIcon: {
    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center', backgroundColor: N.violetSoft,
  },

  // coming soon
  comingCard: { borderRadius: 26, overflow: 'hidden', padding: 22, marginTop: 20 },
  comingTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  comingIcon: {
    width: 58, height: 58, borderRadius: 19, marginTop: 16,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)',
  },
  featCard: {
    borderRadius: 20, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1, borderColor: N.cardEdge,
  },
  featRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  featDivider: { borderBottomWidth: 1, borderBottomColor: N.cardEdge },
  featIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', backgroundColor: N.violetSoft,
  },
  remindWrap: {
    marginTop: 22, borderRadius: 16,
    shadowColor: N.violet, shadowOpacity: 0.4, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  remind: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 56, borderRadius: 16,
  },
  savedNote: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22,
    padding: 14, borderRadius: 16,
    backgroundColor: N.greenSoft, borderWidth: 1, borderColor: 'rgba(53,190,124,0.4)',
  },
  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16,
    padding: 14, borderRadius: 16,
    backgroundColor: N.cardSoft, borderWidth: 1, borderColor: N.cardEdge,
  },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(6,4,20,0.6)' },
  sheet: {
    backgroundColor: N.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: N.cardEdge,
    paddingHorizontal: 16, paddingTop: 10,
  },
  sheetGrab: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: N.track,
    alignSelf: 'center', marginBottom: 14,
  },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 14, marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1, borderColor: 'transparent',
  },
  sheetItemOn: { backgroundColor: N.violetSoft, borderColor: N.violet },
});
