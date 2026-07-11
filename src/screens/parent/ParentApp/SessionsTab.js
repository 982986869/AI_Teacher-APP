// src/screens/parent/ParentApp/SessionsTab.js — the live-class hub. When nothing is
// booked it leads with one premium blue "book a demo" hero, a clean "what's included"
// list, and calm empty states. When a demo is booked, the dark UpcomingDemoCard leads.
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as LG, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Video, Calendar, CheckCircle2, Users, Clock3, FileText, ArrowRight } from 'lucide-react-native';
import { C, st, T, Label, card, CardGradient } from './constants';
import Header from './Header';
import { PressableScale, FadeInOnce, Breathe, Nudge, Pulse } from './anim';
import UpcomingDemoCard from './UpcomingDemoCard';

// Deep-blue gradient wash for the booking hero — measured in pixels (userSpaceOnUse) so
// it fills cleanly on Android, with a soft top-right glow.
function BlueSurface() {
  const [d, setD] = useState({ w: 0, h: 0 });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none"
      onLayout={(e) => setD({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) })}>
      {d.w > 0 && (
        <Svg width={d.w} height={d.h}>
          <Defs>
            <LG id="sessG" x1="0" y1="0" x2="0" y2={d.h} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#4C67FF" />
              <Stop offset="1" stopColor="#2130BE" />
            </LG>
            <RadialGradient id="sessGlow" cx={d.w * 0.85} cy={d.h * 0.05} r={d.w * 0.72} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.26" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={d.w} height={d.h} fill="url(#sessG)" />
          <Rect x="0" y="0" width={d.w} height={d.h} fill="url(#sessGlow)" />
        </Svg>
      )}
    </View>
  );
}

function HeroChip({ Icon, label }) {
  return (
    <View style={se.chip}>
      <Icon size={13} color="#fff" strokeWidth={2.5} />
      <T w="xbold" s={11.5} c="#fff">{label}</T>
    </View>
  );
}

// The premium booking hero — the one clear call to action on the Sessions tab.
function BookingHero({ childName, onBookTrial }) {
  return (
    <View style={se.heroShadow}>
      <View style={se.heroCard}>
        <BlueSurface />
        <Video size={128} color="rgba(255,255,255,0.12)" strokeWidth={1.4} style={se.heroMark} />
        <View style={se.heroBadge}>
          <Pulse from={0.85} to={1.35} duration={1300}><View style={se.heroDot} /></Pulse>
          <T w="xbold" s={10.5} c={C.blue} style={{ letterSpacing: 0.8 }}>LIVE 1:1 CLASS</T>
        </View>
        <T w="xbold" s={23} c="#fff" style={{ marginTop: 14, lineHeight: 29, letterSpacing: -0.3 }}>Book a free{'\n'}demo class</T>
        <T w="semi" s={13.5} c="rgba(255,255,255,0.82)" style={{ marginTop: 8, lineHeight: 19 }}>Meet an expert mentor and see how {childName} learns best.</T>
        <View style={se.chips}>
          <HeroChip Icon={Users} label="1:1 Live" />
          <HeroChip Icon={Clock3} label="60 min" />
          <HeroChip Icon={CheckCircle2} label="Free" />
        </View>
        <Breathe>
          <PressableScale style={se.heroCta} onPress={onBookTrial} accessibilityLabel="Book a free demo class">
            <T w="bold" s={15} c={C.blue}>Book your class</T>
            <Nudge distance={5}><ArrowRight size={18} color={C.blue} strokeWidth={2.6} /></Nudge>
          </PressableScale>
        </Breathe>
      </View>
    </View>
  );
}

// One row of the "what's included" list.
function IncludedRow({ Icon, tint, tintBg, title, sub, last }) {
  return (
    <View style={[se.incRow, !last && se.incDivider]}>
      <View style={[se.incIcon, { backgroundColor: tintBg }]}><Icon size={17} color={tint} strokeWidth={2.3} /></View>
      <View style={{ flex: 1 }}>
        <T w="bold" s={14.5} c={C.ink}>{title}</T>
        <T w="med" s={12.5} c={C.muted} style={{ marginTop: 1 }}>{sub}</T>
      </View>
    </View>
  );
}

// Calm empty state — layered surface + tinted icon circle.
function EmptyCard({ iconEl, tintBg, title, body }) {
  return (
    <View style={se.shadow}>
      <View style={se.emptyCard}>
        <CardGradient />
        <View style={[se.iconCircle, { backgroundColor: tintBg }]}>{iconEl}</View>
        <View style={{ flex: 1 }}>
          <T w="bold" s={14.5} c={C.ink}>{title}</T>
          <T w="med" s={13} c={C.muted}>{body}</T>
        </View>
      </View>
    </View>
  );
}

export default function SessionsTab({ meta, childName, onAvatar, onGym, booking, onBookTrial, onJoinDemo, onRescheduleDemo, onCancelDemo }) {
  return (
    <View style={st.screen}>
      <Header meta={meta} childName={childName} onAvatar={onAvatar} onGym={onGym} />
      <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {booking ? (
          <>
            <FadeInOnce id="sess-upcoming" delay={20}>
              <Label>Upcoming session</Label>
              <UpcomingDemoCard booking={booking} onJoin={onJoinDemo} onReschedule={onRescheduleDemo} onCancel={onCancelDemo} />
            </FadeInOnce>
            <FadeInOnce id="sess-past-b" delay={120}>
              <Label>Past sessions</Label>
              <EmptyCard iconEl={<CheckCircle2 size={20} color={C.green} />} tintBg={C.greenSoft}
                title="No past sessions" body="Completed sessions will show here." />
            </FadeInOnce>
          </>
        ) : (
          <>
            <FadeInOnce id="sess-hero" delay={20} y={16}>
              <View style={{ marginTop: 10 }}><BookingHero childName={childName} onBookTrial={onBookTrial} /></View>
            </FadeInOnce>

            <FadeInOnce id="sess-incl" delay={110}>
              <Label>What's included</Label>
              <View style={se.shadow}>
                <View style={se.incCard}>
                  <CardGradient />
                  <IncludedRow Icon={Video} tint={C.blue} tintBg={C.blueSoft} title="Live 1:1 video class" sub="Face-to-face with a real mentor" />
                  <IncludedRow Icon={Users} tint={C.green} tintBg={C.greenSoft} title="Expert mentor" sub="Matched to your child's level" />
                  <IncludedRow Icon={FileText} tint={C.orange} tintBg={C.peach} title="Notes & recap" sub="Shared with you after the class" last />
                </View>
              </View>
            </FadeInOnce>

            <FadeInOnce id="sess-past" delay={180}>
              <Label>Past sessions</Label>
              <EmptyCard iconEl={<CheckCircle2 size={20} color={C.green} />} tintBg={C.greenSoft}
                title="No past sessions" body="Completed sessions will show here." />
            </FadeInOnce>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const se = StyleSheet.create({
  // Booking hero (blue) — shadow on the outer layer, gradient clip on the inner.
  heroShadow: { borderRadius: 24, backgroundColor: '#2A3AD0', shadowColor: '#1B2AA8', shadowOpacity: 0.34, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
  heroCard: { borderRadius: 24, overflow: 'hidden', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18 },
  heroMark: { position: 'absolute', top: -8, right: -12 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6 },
  heroDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.blue },
  chips: { flexDirection: 'row', gap: 8, marginTop: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 11, paddingHorizontal: 10, paddingVertical: 7 },
  heroCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 15, paddingVertical: 15, marginTop: 18 },

  // "What's included" list card
  shadow: { borderRadius: 18, backgroundColor: '#fff', marginTop: 2, ...card },
  incCard: { borderRadius: 18, overflow: 'hidden', paddingHorizontal: 16, borderWidth: 1, borderColor: C.hair },
  incRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15 },
  incDivider: { borderBottomWidth: 1, borderBottomColor: C.hair },
  incIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  // Empty states
  emptyCard: { borderRadius: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderWidth: 1, borderColor: C.hair },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
