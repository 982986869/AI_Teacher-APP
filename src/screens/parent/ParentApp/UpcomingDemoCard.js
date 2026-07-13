// src/screens/parent/ParentApp/UpcomingDemoCard.js
// ── The hero "Upcoming demo" widget on the Parent dashboard ───────────────────
// A premium dark gradient surface that stands out against the light canvas — the
// first thing a parent notices. Live countdown, pulsing LIVE state, tutor-assigning
// shimmer, calendar-synced badge, and a Join button that only unlocks inside the
// class window. Reschedule / Cancel inline. Pure presentation — persistence + calendar
// changes happen in the parent via onJoin / onReschedule / onCancel.
import React, { memo, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGrad, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Video, RefreshCw, X, CheckCircle2, Bell, Radio, UserRound, Clock3 } from 'lucide-react-native';
import { C, T } from './constants';
import { PressableScale, Shimmer, FadeIn, Breathe, PulseRing } from './anim';
import { countdown, joinWindow, fmtTime, fmtDateLong, fmtDateShort } from './demoConfig';

// text colours on the dark hero surface
const W = '#FFFFFF';
const DIM = 'rgba(255,255,255,0.62)';
const DIM2 = 'rgba(255,255,255,0.55)';
const GREEN = '#5FD39A';
const AMBER = '#F6C560';

// A softly pulsing dot for the "Live now" state — tasteful, not blinking.
function LiveDot() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 700, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v]);
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.15] });
  return <Animated.View style={[st.liveDot, { opacity, transform: [{ scale }] }]} />;
}

// The gradient surface: a deep diagonal base + a soft accent glow in the top-right
// corner (react-native-svg — clipped to the card's rounded corners).
function HeroSurface() {
  const [d, setD] = useState({ w: 0, h: 0 });
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => setD({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) })}
    >
      {d.w > 0 && (
        <Svg width={d.w} height={d.h}>
          <Defs>
            <SvgGrad id="udHero" x1="0" y1="0" x2={d.w * 0.25} y2={d.h} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={C.heroA} />
              <Stop offset="1" stopColor={C.heroB} />
            </SvgGrad>
            <RadialGradient id="udGlow" cx={d.w * 0.9} cy={d.h * 0.02} r={d.w * 0.8} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={C.heroAccent} stopOpacity="0.22" />
              <Stop offset="1" stopColor={C.heroAccent} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={d.w} height={d.h} fill="url(#udHero)" />
          <Rect x="0" y="0" width={d.w} height={d.h} fill="url(#udGlow)" />
        </Svg>
      )}
    </View>
  );
}

function UpcomingDemoCard({ booking, onJoin, onReschedule, onCancel }) {
  const [now, setNow] = useState(() => new Date());
  // Keep the countdown + join window live: 1s precision near the class (so the 10-min
  // join gate is exact), a cheap 30s otherwise. Self-reschedules as time passes.
  useEffect(() => {
    const start = new Date(booking?.date).getTime();
    const toStart = Number.isFinite(start) ? start - Date.now() : Infinity;
    const period = toStart <= 12 * 60000 ? 1000 : 30000;
    const id = setInterval(() => setNow(new Date()), period);
    return () => clearInterval(id);
  }, [booking, now]);

  if (!booking) return null;
  if (!Number.isFinite(new Date(booking.date).getTime())) return null; // guard malformed dates
  const { canJoin, isLive, ended } = joinWindow(booking, now);
  const short = fmtDateShort(booking.date);
  const synced = !!booking.calendarEventId;
  const hasTutor = !!(booking.tutor && booking.tutor.name);
  const statusText = ended ? 'Completed' : isLive ? 'Live now' : hasTutor ? 'Tutor assigned' : 'Confirmed';

  return (
    <View style={st.shadow}>
    <View style={st.card}>
      <HeroSurface />
      <View style={st.glassEdge} />

      {/* Status + date */}
      <View style={st.topRow}>
        <FadeIn key={statusText} y={0} duration={240} style={[st.pill, isLive && st.pillLive]}>
          {isLive && (
            <View style={st.liveWrap}>
              <PulseRing color="#fff" size={7} />
              <LiveDot />
            </View>
          )}
          <T w="bold" s={10.5} c={isLive ? '#fff' : C.heroAccent}>{statusText.toUpperCase()}</T>
        </FadeIn>
        <View style={{ alignItems: 'flex-end' }}>
          <T w="bold" s={10.5} c={DIM2}>{short.dow.toUpperCase()}</T>
          <T w="xbold" s={14.5} c={W} style={{ marginTop: 1 }}>{short.day} {short.month}</T>
        </View>
      </View>

      {/* Big time + meta */}
      <T w="xbold" s={34} c={W} style={{ marginTop: 14, letterSpacing: -0.6 }}>{fmtTime(booking.date)}</T>
      <T w="semi" s={13.5} c={DIM} style={{ marginTop: 4 }}>{fmtDateLong(booking.date)} · {booking.durationMin} min · Online 1:1</T>
      {!ended && (
        <View style={st.countRow}>
          <Clock3 size={14} color={C.heroAccent} />
          <T w="bold" s={13} c={C.heroAccent}>{isLive ? 'Happening now' : `Starts ${countdown(booking, now)}`}</T>
        </View>
      )}

      {/* Tutor strip — assigning (shimmer) until a mentor is matched */}
      <View style={st.tutor}>
        <View style={st.tutorAv}>
          {hasTutor ? <UserRound size={19} color="#fff" /> : <Video size={17} color="#fff" strokeWidth={2.3} />}
        </View>
        <View style={{ flex: 1 }}>
          {hasTutor ? (
            <>
              <T w="bold" s={14} c={W}>{booking.tutor.name}</T>
              <T w="med" s={12} c={DIM}>Your Ailernova mentor{booking.tutor.rating ? ` · ${booking.tutor.rating}★` : ''}</T>
            </>
          ) : (
            <>
              <T w="bold" s={14} c={W}>Assigning your mentor</T>
              <Shimmer w={130} h={8} r={5} mt={6} style={{ backgroundColor: 'rgba(255,255,255,0.14)' }} />
            </>
          )}
        </View>
        <View style={st.tag}><T w="bold" s={10} c={DIM}>{isLive ? 'LIVE' : '1:1'}</T></View>
      </View>

      {/* Badges: calendar sync (fades in when it flips) + reminder */}
      <View style={st.badges}>
        <FadeIn key={synced ? 'synced' : 'unsynced'} y={0} duration={280} style={[st.badge, { backgroundColor: synced ? 'rgba(95,211,154,0.15)' : 'rgba(255,255,255,0.06)' }]}>
          <CheckCircle2 size={13} color={synced ? GREEN : DIM2} />
          <T w="bold" s={11} c={synced ? GREEN : DIM2}>{synced ? 'Calendar synced' : 'Not in calendar'}</T>
        </FadeIn>
        <View style={[st.badge, { backgroundColor: 'rgba(246,197,96,0.14)' }]}>
          <Bell size={13} color={AMBER} />
          <T w="bold" s={11} c={AMBER}>Reminder 30 min</T>
        </View>
      </View>

      {/* Primary CTA — bright on dark, breathes when it's ready to tap */}
      {canJoin ? (
        <Breathe>
          <PressableScale style={st.join} onPress={() => onJoin && onJoin(booking)} accessibilityLabel="Join class">
            {isLive && <Radio size={17} color={C.heroB} />}
            <T w="bold" s={15} c={C.heroB}>Join class</T>
          </PressableScale>
        </Breathe>
      ) : (
        <View style={st.joinOff}>
          <T w="bold" s={14.5} c={DIM2}>{ended ? 'Class ended' : 'Join opens 10 min before'}</T>
        </View>
      )}

      {/* Reschedule / Cancel */}
      {!ended && (
        <View style={st.actions}>
          <PressableScale style={st.ghost} onPress={() => onReschedule && onReschedule(booking)} accessibilityLabel="Reschedule demo">
            <RefreshCw size={15} color={W} />
            <T w="bold" s={13.5} c={W}>Reschedule</T>
          </PressableScale>
          <PressableScale style={st.ghost} onPress={() => onCancel && onCancel(booking)} accessibilityLabel="Cancel demo">
            <X size={15} color="#FF8B8B" />
            <T w="bold" s={13.5} c="#FF8B8B">Cancel</T>
          </PressableScale>
        </View>
      )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  // Shadow on the outer layer, the gradient clip (overflow) on the inner — otherwise
  // iOS clips the shadow.
  shadow: {
    borderRadius: 26, backgroundColor: C.heroB,
    shadowColor: '#0B1020', shadowOpacity: 0.30, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 14,
  },
  card: { borderRadius: 26, overflow: 'hidden', padding: 20 },
  glassEdge: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, alignSelf: 'flex-start' },
  pillLive: { backgroundColor: '#D81818' },
  liveWrap: { width: 7, height: 7, alignItems: 'center', justifyContent: 'center' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start', backgroundColor: 'rgba(143,166,255,0.13)', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6 },

  tutor: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.055)', borderRadius: 16, padding: 12, marginTop: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  tutorAv: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.heroAccent, alignItems: 'center', justifyContent: 'center' },
  tag: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6 },

  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 7 },

  join: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, marginTop: 18 },
  joinOff: { alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 16, marginTop: 18, backgroundColor: 'rgba(255,255,255,0.06)' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  ghost: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 13, paddingVertical: 13 },
});

export default memo(UpcomingDemoCard);
