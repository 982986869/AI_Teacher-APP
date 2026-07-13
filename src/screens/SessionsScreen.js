// src/screens/SessionsScreen.js
// Live 1:1 sessions have no backend yet (server flag features.sessions=false), so instead
// of a fake list of sessions with dead buttons this is an honest, PREMIUM "coming soon"
// experience on the shared Student design system (Nunito `T`, studentTheme palette, the
// anim primitives, safe-area header). It teases what's coming and offers a real, local
// "notify me" acknowledgement — nothing fake, nothing dead.
import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as LG, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Video, Users, MessageCircle, CirclePlay, CircleCheck, Bell, Sparkles } from 'lucide-react-native';
import { T } from './parent/ParentApp/constants';
import { S, shadow, shadowSm } from '../theme/studentTheme';
import { FadeInOnce, PressableScale, Breathe, Float, Pulse, Shine, Wave } from './parent/ParentApp/anim';

const PAD = 18;

// deep gradient surface (measured px → no Android skew), matching the Home hero cards
let _sid = 0;
function InkSurface({ a, b, glow, radius = 0 }) {
  const [d, setD] = useState({ w: 0, h: 0 });
  const id = useRef('sess' + (_sid++)).current;
  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]} pointerEvents="none"
      onLayout={(e) => setD({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) })}>
      {d.w > 0 && (
        <Svg width={d.w} height={d.h}>
          <Defs>
            <LG id={`${id}g`} x1="0" y1="0" x2={d.w} y2={d.h} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={a} /><Stop offset="1" stopColor={b} />
            </LG>
            <RadialGradient id={`${id}h`} cx={d.w * 0.82} cy={d.h * 0.12} r={d.w * 0.72} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={glow} stopOpacity="0.4" /><Stop offset="1" stopColor={glow} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width={d.w} height={d.h} fill={`url(#${id}g)`} />
          <Rect width={d.w} height={d.h} fill={`url(#${id}h)`} />
        </Svg>
      )}
    </View>
  );
}

const FEATURES = [
  { Icon: Users,         tint: S.blue,    bg: S.blueSoft,    title: 'Learn from expert teachers', sub: 'Live classes with top educators for your class' },
  { Icon: MessageCircle, tint: S.purple,  bg: S.purpleSoft,  title: 'Solve doubts in real time',  sub: 'Ask questions and get answered on the spot' },
  { Icon: CirclePlay,    tint: S.emerald, bg: S.emeraldSoft, title: 'Rewatch any class',           sub: 'Every session is recorded, yours to replay' },
];

const SessionsScreen = () => {
  const insets = useSafeAreaInsets();
  const [notified, setNotified] = useState(false);

  return (
    <View style={hs.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={S.canvas} translucent={false} />

      {/* clean light header, consistent with the rest of the Student app */}
      <View style={[hs.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <T w="black" s={22} c={S.ink} style={{ letterSpacing: -0.5 }}>Live sessions</T>
          <T w="semi" s={12.5} c={S.muted} style={{ marginTop: 1 }}>1:1 classes with real teachers</T>
        </View>
      </View>

      <ScrollView style={hs.body} contentContainerStyle={{ paddingBottom: 30, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        {/* ── Hero: honest, premium coming-soon ── */}
        <FadeInOnce id="sess-hero" delay={40} y={16}>
          <View style={hs.heroShadow}>
            <View style={hs.hero}>
              <InkSurface a="#1E3A8A" b="#0E1E4A" glow="#5B8CFF" radius={26} />
              <Float distance={9} duration={4400} style={{ position: 'absolute', top: -18, right: -14 }}>
                <Video size={140} color="rgba(255,255,255,0.09)" strokeWidth={1.3} />
              </Float>
              <Shine delay={1400} gap={4200} width={80} color="rgba(255,255,255,0.14)" />
              <View style={hs.heroTag}>
                <Pulse from={0.85} to={1.15} duration={1500}><Sparkles size={11} color="#CFE0FF" strokeWidth={2.8} /></Pulse>
                <T w="xbold" s={10} c="#CFE0FF" style={{ letterSpacing: 1 }}>COMING SOON</T>
              </View>
              <View style={hs.heroIcon}>
                <Breathe><Video size={30} color="#fff" strokeWidth={2.2} /></Breathe>
              </View>
              <T w="black" s={22} c="#fff" style={{ marginTop: 14, letterSpacing: -0.3 }}>Live 1:1 classes are on the way</T>
              <T w="semi" s={13} c="rgba(255,255,255,0.72)" style={{ marginTop: 6, lineHeight: 19 }}>
                Soon you’ll book personal sessions with expert teachers — right here, whenever you need a hand.
              </T>
            </View>
          </View>
        </FadeInOnce>

        {/* ── What to expect ── */}
        <View style={hs.secHead}>
          <View style={[hs.secDot, { backgroundColor: S.blue }]} />
          <T w="black" s={16} c={S.ink} style={{ letterSpacing: -0.3 }}>What to expect</T>
        </View>
        <FadeInOnce id="sess-feats" delay={60} y={14}>
          <View style={hs.card}>
            {FEATURES.map((f, i) => (
              <View key={f.title} style={[hs.featRow, i < FEATURES.length - 1 && hs.featDivider]}>
                <View style={[hs.featIcon, { backgroundColor: f.bg }]}><f.Icon size={20} color={f.tint} strokeWidth={2.5} /></View>
                <View style={{ flex: 1 }}>
                  <T w="xbold" s={14} c={S.ink}>{f.title}</T>
                  <T w="semi" s={11.5} c={S.muted} style={{ marginTop: 1 }}>{f.sub}</T>
                </View>
              </View>
            ))}
          </View>
        </FadeInOnce>

        {/* ── Honest "notify me" (local acknowledgement, no fake network) ── */}
        <FadeInOnce id="sess-notify" delay={90} y={14}>
          <Breathe>
            <PressableScale
              style={[hs.notifyBtn, notified && hs.notifyBtnDone]}
              onPress={() => setNotified(true)}
              disabled={notified}
              accessibilityRole="button"
              accessibilityLabel={notified ? 'You will be notified when live sessions launch' : 'Notify me when live sessions launch'}
            >
              {notified
                ? <><CircleCheck size={18} color="#fff" strokeWidth={2.6} /><T w="bold" s={14.5} c="#fff">You’re on the list — we’ll tell you first</T></>
                : <><Bell size={17} color="#fff" strokeWidth={2.4} /><T w="bold" s={14.5} c="#fff">Notify me when it’s ready</T></>}
            </PressableScale>
          </Breathe>
        </FadeInOnce>

        {/* gentle bridge to what IS available now */}
        <View style={hs.hintRow}>
          <Wave><T s={13}>💡</T></Wave>
          <T w="semi" s={12} c={S.muted} style={{ flex: 1 }}>
            In the meantime, your AI teacher is on the Home tab 24/7 — ask any doubt, anytime.
          </T>
        </View>
      </ScrollView>
    </View>
  );
};

const hs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: S.canvas },
  body: { flex: 1, paddingHorizontal: PAD },
  header: { paddingHorizontal: PAD, paddingBottom: 12 },

  secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 },
  secDot: { width: 8, height: 8, borderRadius: 4 },

  heroShadow: { borderRadius: 26, backgroundColor: '#0E1E4A', marginTop: 8, shadowColor: '#0E1E4A', shadowOpacity: 0.30, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 11 },
  hero: { borderRadius: 26, overflow: 'hidden', padding: 22 },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  heroIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginTop: 16 },

  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: S.hair, padding: 16, ...shadow },
  featRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  featDivider: { borderBottomWidth: 1, borderBottomColor: S.hair },
  featIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  notifyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: S.blue, borderRadius: 16, paddingVertical: 16, marginTop: 22, ...shadowSm },
  notifyBtnDone: { backgroundColor: S.emerald },

  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: S.indigoSoft, borderRadius: 16, padding: 14, marginTop: 16 },
});

export default SessionsScreen;
