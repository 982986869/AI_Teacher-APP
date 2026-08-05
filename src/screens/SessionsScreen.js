// src/screens/SessionsScreen.js
// The Student "Sessions" tab. Now reads REAL sessions the admin publishes (GET /api/sessions,
// class-scoped + active-only server-side). When sessions exist they render as a live schedule;
// when there are none it falls back to the honest, premium "coming soon" (no fake list).
//
// Dark reskin (AILERNOVA design system) — this screen only, same opt-in-per-screen technique
// as Profile/Practice/Resources. `D` mirrors studentTheme's `S` role names 1:1 so every call
// site below is unchanged; only the import binding + a couple of local dark-aware components
// (header/section-header, replacing studentUI's light ones) differ.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Linking } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, Users, MessageCircle, CirclePlay, CircleCheck, Bell, MapPin, CalendarDays, Clock3 } from 'lucide-react-native';
import { T } from './parent/ParentApp/constants';
import { InkSurface } from '../theme/studentUI';
import { COLORS } from '../theme/designSystem';
import { FONT } from '../constants/fonts';
import PrimaryButton from '../components/brand/PrimaryButton';
import { FadeInOnce, Breathe, Float, Pulse, Shine, PressableScale } from './parent/ParentApp/anim';
import { getHomeState, saveHomeState } from '../utils/storage';
import { getStudentSessions } from '../api/sessionsApi';

const PAD = 18;

// Dark palette — same role names as studentTheme's `S`.
const S = {
  canvas: COLORS.background, card: 'rgba(255,255,255,0.05)',
  ink: COLORS.textPrimary, sub: COLORS.textSecondary, muted: COLORS.textSecondary, faint: 'rgba(255,255,255,0.38)',
  hair: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.16)', white: '#FFFFFF',
  indigo: COLORS.primary, indigoSoft: 'rgba(124,58,237,0.16)',
  blue: '#60A5FA', blueSoft: 'rgba(96,165,250,0.16)',
  emerald: COLORS.success, emeraldSoft: 'rgba(16,185,129,0.16)',
  orange: COLORS.warning, orangeSoft: 'rgba(249,115,22,0.16)',
  purple: '#C084FC', purpleSoft: 'rgba(192,132,252,0.16)',
};

const FEATURES = [
  { Icon: Users,         tint: S.blue,    bg: S.blueSoft,    title: 'Learn from expert teachers', sub: 'Live classes with top educators for your class' },
  { Icon: MessageCircle, tint: S.purple,  bg: S.purpleSoft,  title: 'Solve doubts in real time',  sub: 'Ask questions and get answered on the spot' },
  { Icon: CirclePlay,    tint: S.emerald, bg: S.emeraldSoft, title: 'Rewatch any class',           sub: 'Every session is recorded, yours to replay' },
];

const fmtWhen = (iso) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
};

function SessionsHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[hs.header, { paddingTop: insets.top + 8 }]}>
      <Text style={hs.headerTitle}>Live sessions</Text>
      <Text style={hs.headerSub}>1:1 classes with real teachers</Text>
    </View>
  );
}

function SectionHeader({ title, accent }) {
  return (
    <View style={hs.secHead}>
      <View style={[hs.secDot, { backgroundColor: accent }]} />
      <Text style={hs.secTitle}>{title}</Text>
    </View>
  );
}

function Skeleton() {
  return (
    <View style={{ paddingTop: 8 }}>
      {[0, 1].map((i) => <View key={i} style={{ width: '100%', height: 110, borderRadius: 18, marginBottom: 10, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair }} />)}
    </View>
  );
}

function SessionCard({ s }) {
  const upcoming = s.status === 'scheduled';
  return (
    <View style={hs.card}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={[hs.cardIcon, { backgroundColor: s.mode === 'offline' ? S.orangeSoft : S.blueSoft }]}>
          {s.mode === 'offline' ? <MapPin size={20} color={S.orange} strokeWidth={2.4} /> : <Video size={20} color={S.blue} strokeWidth={2.4} />}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w="xbold" s={14.5} c={S.ink} numberOfLines={1}>{s.title}</T>
          <T w="semi" s={12} c={S.muted} numberOfLines={1} style={{ marginTop: 1 }}>{[s.subject, s.teacherName].filter(Boolean).join(' · ') || 'Live class'}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><CalendarDays size={13} color={S.faint} strokeWidth={2.4} /><T w="bold" s={11.5} c={S.sub}>{fmtWhen(s.startsAt)}</T></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Clock3 size={13} color={S.faint} strokeWidth={2.4} /><T w="bold" s={11.5} c={S.sub}>{s.durationMin} min</T></View>
          </View>
        </View>
      </View>
      {upcoming && s.mode === 'online' && !!s.meetingLink && (
        <PrimaryButton label="Join class" icon={<Video size={16} color="#fff" strokeWidth={2.4} />} onPress={() => Linking.openURL(s.meetingLink).catch(() => {})} style={{ marginTop: 12 }} />
      )}
    </View>
  );
}

// A recorded class the student can replay any time (a completed session with a
// recording link the admin attached). Course-player card: a 16:9 Aurora thumbnail
// with an animated play overlay + duration/RECORDING badges, then title & teacher.
// Tapping anywhere opens the recording. Aurora look: purple gradient + glass accents.
function RecordingCard({ s }) {
  const meta = [s.subject, s.teacherName].filter(Boolean).join(' · ') || 'Recorded class';
  const initial = (s.teacherName || 'N').trim().charAt(0).toUpperCase();
  return (
    <PressableScale style={hs.recCard} onPress={() => Linking.openURL(s.recordingUrl).catch(() => {})} accessibilityLabel={`Watch recording: ${s.title}`}>
      <View style={hs.recThumbLg}>
        <InkSurface a="#6C4DE6" b="#A06BFF" glow="#C7A6FF" radius={0} />
        {/* a light sweep across the thumbnail — a subtle "playable" shimmer */}
        <Shine delay={1200} gap={3800} width={70} color="rgba(255,255,255,0.18)" />
        {/* breathing play button — the clear affordance */}
        <Breathe>
          <View style={hs.recPlay}><CirclePlay size={30} color="#fff" strokeWidth={2} /></View>
        </Breathe>
        {/* live REC tag with a pulsing dot */}
        <View style={hs.recTag}>
          <Pulse from={0.5} to={1} duration={1200}><View style={hs.recDot} /></Pulse>
          <T w="xbold" s={8.5} c="#fff" style={{ letterSpacing: 1 }}>RECORDING</T>
        </View>
        <View style={hs.recDur}><T w="bold" s={10.5} c="#fff">{s.durationMin} min</T></View>
      </View>
      <View style={hs.recBody}>
        <T w="xbold" s={14.5} c={S.ink} numberOfLines={2}>{s.title}</T>
        <View style={hs.recMeta}>
          <View style={hs.recAvatar}><T w="bold" s={11} c="#C4B8F5">{initial}</T></View>
          <T w="semi" s={12} c={S.muted} numberOfLines={1} style={{ flex: 1 }}>{meta}</T>
          <View style={hs.recDateChip}>
            <CalendarDays size={12} color={S.faint} strokeWidth={2.4} />
            <T w="bold" s={11} c={S.sub}>{fmtWhen(s.startsAt)}</T>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

// DEMO — a dummy recorded lecture so the Recorded Lectures section always has something
// to show. Video is a real Ailernova clip (ailernova.in; .com has none). Remove this and
// the two `DUMMY_RECORDING` references below once real recordings are published.
const DUMMY_RECORDING = {
  id: 'demo-recording',
  title: 'Sample Recorded Lecture',
  subject: 'Demo',
  teacherName: 'Ms. Nova',
  durationMin: 12,
  startsAt: '2026-07-20T10:00:00.000Z',
  recordingUrl: 'https://ailernova.in/wp-content/themes/ailernova-theme/image/0_Student_Girl_1280x720.mp4',
};

const SessionsScreen = () => {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const [notified, setNotified] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sessions, setSessions] = useState(null); // null = loading

  useEffect(() => {
    getHomeState().then((st) => setNotified(!!st?.sessionsReminder)).catch(() => {}).finally(() => setLoaded(true));
  }, []);
  const setReminder = () => { setNotified(true); saveHomeState({ sessionsReminder: true }); };

  useFocusEffect(useCallback(() => {
    let alive = true;
    getStudentSessions().then((rows) => { if (alive) setSessions(rows); }).catch(() => { if (alive) setSessions([]); });
    return () => { alive = false; };
  }, []));

  useEffect(() => {
    const unsub = navigation.addListener('tabPress', () => { if (navigation.isFocused()) scrollRef.current?.scrollTo({ y: 0, animated: true }); });
    return unsub;
  }, [navigation]);

  const upcoming = (sessions || []).filter((s) => s.status === 'scheduled');
  // Recorded lectures = any session with a recording link (its own replay library),
  // plus the DEMO dummy recording so the section always shows one to try.
  const recordings = [...(sessions || []).filter((s) => !!s.recordingUrl), DUMMY_RECORDING];
  // Completed WITHOUT a recording — so a recorded class shows once, under Recordings.
  const completed = (sessions || []).filter((s) => s.status === 'completed' && !s.recordingUrl);
  const hasSessions = (sessions || []).length > 0 || recordings.length > 0;

  return (
    <View style={hs.safe}>
      <StatusBar barStyle="light-content" backgroundColor={S.canvas} translucent={false} />
      <SessionsHeader />

      <ScrollView ref={scrollRef} style={hs.body} contentContainerStyle={{ paddingBottom: 30, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        {sessions === null ? (
          <Skeleton />
        ) : hasSessions ? (
          <>
            {upcoming.length > 0 && (
              <>
                <SectionHeader title="Upcoming" accent={S.blue} />
                {upcoming.map((s) => <FadeInOnce key={s.id} id={`sess-${s.id}`} delay={40} y={12}><SessionCard s={s} /></FadeInOnce>)}
              </>
            )}
            {/* Recorded Lectures — a persistent sub-section (its own replay library).
                Always shown so students know where recordings live; empty state until
                a completed class has a recording attached. */}
            <SectionHeader title="Recorded Lectures" accent={S.purple} />
            {recordings.length > 0 ? (
              recordings.map((s) => <FadeInOnce key={s.id} id={`rec-${s.id}`} delay={40} y={12}><RecordingCard s={s} /></FadeInOnce>)
            ) : (
              <View style={hs.recEmpty}>
                <View style={hs.recEmptyIcon}><CirclePlay size={22} color={S.purple} strokeWidth={2.2} /></View>
                <View style={{ flex: 1 }}>
                  <T w="xbold" s={13.5} c={S.ink}>No recordings yet</T>
                  <T w="semi" s={11.5} c={S.muted} style={{ marginTop: 2, lineHeight: 16 }}>Completed classes will appear here to rewatch anytime.</T>
                </View>
              </View>
            )}
            {completed.length > 0 && (
              <>
                <SectionHeader title="Completed" accent={S.emerald} />
                {completed.map((s) => <SessionCard key={s.id} s={s} />)}
              </>
            )}
          </>
        ) : (
          // ── Honest coming-soon (no sessions yet) ──
          <>
            <FadeInOnce id="sess-hero" delay={40} y={16}>
              <View style={hs.heroShadow}>
                <View style={hs.hero}>
                  <InkSurface a="#1E3A8A" b="#0E1E4A" glow="#5B8CFF" radius={26} />
                  <Float distance={9} duration={4400} style={{ position: 'absolute', top: -18, right: -14 }}><Video size={140} color="rgba(255,255,255,0.09)" strokeWidth={1.3} /></Float>
                  <Shine delay={1400} gap={4200} width={80} color="rgba(255,255,255,0.14)" />
                  <View style={hs.heroTag}>
                    <Pulse from={0.85} to={1.15} duration={1500}><CircleCheck size={11} color="#CFE0FF" strokeWidth={2.8} /></Pulse>
                    <T w="xbold" s={10} c="#CFE0FF" style={{ letterSpacing: 1 }}>COMING SOON</T>
                  </View>
                  <View style={hs.heroIcon}><Breathe><Video size={30} color="#fff" strokeWidth={2.2} /></Breathe></View>
                  <T w="black" s={22} c="#fff" style={{ marginTop: 14, letterSpacing: -0.3 }}>Live 1:1 classes are on the way</T>
                  <T w="semi" s={13} c="rgba(255,255,255,0.72)" style={{ marginTop: 6, lineHeight: 19 }}>Soon you'll book personal sessions with expert teachers — right here, whenever you need a hand.</T>
                </View>
              </View>
            </FadeInOnce>

            <SectionHeader title="What to expect" accent={S.blue} />
            <FadeInOnce id="sess-feats" delay={60} y={14}>
              <View style={hs.featCard}>
                {FEATURES.map((f, i) => (
                  <View key={f.title} style={[hs.featRow, i < FEATURES.length - 1 && hs.featDivider]}>
                    <View style={[hs.featIcon, { backgroundColor: f.bg }]}><f.Icon size={20} color={f.tint} strokeWidth={2.5} /></View>
                    <View style={{ flex: 1 }}><T w="xbold" s={14} c={S.ink}>{f.title}</T><T w="semi" s={11.5} c={S.muted} style={{ marginTop: 1 }}>{f.sub}</T></View>
                  </View>
                ))}
              </View>
            </FadeInOnce>

            {loaded && (
              <FadeInOnce id="sess-notify" delay={90} y={14}>
                {notified ? (
                  <View style={hs.savedNote}><CircleCheck size={17} color={S.emerald} strokeWidth={2.6} /><T w="bold" s={13} c={S.emerald} style={{ flex: 1 }}>Reminder saved on this device — we'll surface sessions here the moment they launch.</T></View>
                ) : (
                  <Breathe><PrimaryButton label="Remind me at launch" icon={<Bell size={16} color="#fff" strokeWidth={2.4} />} onPress={setReminder} style={{ marginTop: 22 }} /></Breathe>
                )}
              </FadeInOnce>
            )}

            <View style={hs.hintRow}><T s={13}>💡</T><T w="semi" s={12} c={S.muted} style={{ flex: 1 }}>In the meantime, your AI teacher is on the Home tab 24/7 — ask any doubt, anytime.</T></View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const hs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: S.canvas },
  body: { flex: 1, paddingHorizontal: PAD },

  header: { paddingHorizontal: 0, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontFamily: FONT.black, color: S.ink, letterSpacing: -0.5 },
  headerSub: { fontSize: 12.5, fontFamily: FONT.semibold, color: S.muted, marginTop: 2 },

  secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 },
  secDot: { width: 8, height: 8, borderRadius: 4 },
  secTitle: { fontSize: 16, fontFamily: FONT.black, color: S.ink, letterSpacing: -0.3 },

  card: { backgroundColor: S.card, borderRadius: 18, borderWidth: 1, borderColor: S.hair, padding: 15, marginBottom: 10 },
  cardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // ── Aurora course-player recording card ──
  recCard: { backgroundColor: S.card, borderRadius: 20, borderWidth: 1, borderColor: S.hair, marginBottom: 12, overflow: 'hidden' },
  recThumbLg: { width: '100%', aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  recPlay: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center' },
  recTag: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(20,15,40,0.4)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF5F7A' },
  recDur: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(20,15,40,0.5)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  recBody: { padding: 14 },
  recMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  recAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: S.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  recDateChip: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  recEmpty: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: S.card, borderRadius: 18, borderWidth: 1, borderColor: S.hair, padding: 14, marginBottom: 10 },
  recEmptyIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: S.purpleSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroShadow: { borderRadius: 26, backgroundColor: '#0E1E4A', marginTop: 8 },
  hero: { borderRadius: 26, overflow: 'hidden', padding: 22 },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  heroIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  featCard: { backgroundColor: S.card, borderRadius: 20, borderWidth: 1, borderColor: S.hair, padding: 16 },
  featRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  featDivider: { borderBottomWidth: 1, borderBottomColor: S.hair },
  featIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  savedNote: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: S.emeraldSoft, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', borderRadius: 16, padding: 14, marginTop: 22 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: S.indigoSoft, borderRadius: 16, padding: 14, marginTop: 16 },
});

export default SessionsScreen;
