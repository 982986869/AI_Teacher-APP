// src/screens/SessionsScreen.js
// The Student "Sessions" tab. Now reads REAL sessions the admin publishes (GET /api/sessions,
// class-scoped + active-only server-side). When sessions exist they render as a live schedule;
// when there are none it falls back to the honest, premium "coming soon" (no fake list).
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, Linking } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Video, Users, MessageCircle, CirclePlay, CircleCheck, Bell, MapPin, CalendarDays, Clock3, User } from 'lucide-react-native';
import { T } from './parent/ParentApp/constants';
import {
  S, shadow, InkSurface, StudentScreenHeader, StudentSectionHeader, StudentPrimaryButton, StudentSkeleton,
} from '../theme/studentUI';
import { FadeInOnce, Breathe, Float, Pulse, Shine, PressableScale } from './parent/ParentApp/anim';
import { getHomeState, saveHomeState } from '../utils/storage';
import { getStudentSessions } from '../api/sessionsApi';

const PAD = 18;

const FEATURES = [
  { Icon: Users,         tint: S.blue,    bg: S.blueSoft,    title: 'Learn from expert teachers', sub: 'Live classes with top educators for your class' },
  { Icon: MessageCircle, tint: S.purple,  bg: S.purpleSoft,  title: 'Solve doubts in real time',  sub: 'Ask questions and get answered on the spot' },
  { Icon: CirclePlay,    tint: S.emerald, bg: S.emeraldSoft, title: 'Rewatch any class',           sub: 'Every session is recorded, yours to replay' },
];

const fmtWhen = (iso) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
};

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
        <StudentPrimaryButton label="Join class" Icon={Video} tint={S.blue} onPress={() => Linking.openURL(s.meetingLink).catch(() => {})} style={{ marginTop: 12, paddingVertical: 12 }} />
      )}
    </View>
  );
}

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
  const completed = (sessions || []).filter((s) => s.status === 'completed');
  const hasSessions = (sessions || []).length > 0;

  return (
    <View style={hs.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={S.canvas} translucent={false} />
      <StudentScreenHeader title="Live sessions" subtitle="1:1 classes with real teachers" />

      <ScrollView ref={scrollRef} style={hs.body} contentContainerStyle={{ paddingBottom: 30, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        {sessions === null ? (
          <View style={{ paddingTop: 8 }}>{[0, 1].map((i) => <StudentSkeleton key={i} w="100%" h={110} r={18} mb={10} />)}</View>
        ) : hasSessions ? (
          <>
            {upcoming.length > 0 && (
              <>
                <StudentSectionHeader title="Upcoming" accent={S.blue} />
                {upcoming.map((s) => <FadeInOnce key={s.id} id={`sess-${s.id}`} delay={40} y={12}><SessionCard s={s} /></FadeInOnce>)}
              </>
            )}
            {completed.length > 0 && (
              <>
                <StudentSectionHeader title="Completed" accent={S.emerald} />
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

            <StudentSectionHeader title="What to expect" accent={S.blue} />
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
                  <Breathe><StudentPrimaryButton label="Remind me at launch" Icon={Bell} tint={S.blue} onPress={setReminder} style={{ marginTop: 22 }} /></Breathe>
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
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: S.hair, padding: 15, marginBottom: 10, ...shadow },
  cardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroShadow: { borderRadius: 26, backgroundColor: '#0E1E4A', marginTop: 8, shadowColor: '#0E1E4A', shadowOpacity: 0.30, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 11 },
  hero: { borderRadius: 26, overflow: 'hidden', padding: 22 },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  heroIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  featCard: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: S.hair, padding: 16, ...shadow },
  featRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  featDivider: { borderBottomWidth: 1, borderBottomColor: S.hair },
  featIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  savedNote: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: S.emeraldSoft, borderWidth: 1, borderColor: '#BBE9CE', borderRadius: 16, padding: 14, marginTop: 22 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: S.indigoSoft, borderRadius: 16, padding: 14, marginTop: 16 },
});

export default SessionsScreen;
