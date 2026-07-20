// src/screens/parent/ParentApp/HomeTab.js — premium Parent dashboard.
import React, { memo, useState, useRef } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as LG, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Flame, Target, TrendingUp, Sparkles, GraduationCap, Clock3, Users, ArrowRight } from 'lucide-react-native';
import { C, st, T, Label, card, CardGradient } from './constants';
import Header from './Header';
import { PressableScale, FadeInOnce, Breathe, Odometer, Pulse, Float, PopIn, Wave, Nudge } from './anim';
import { EventTeaser, EventsModal } from './EventsCarousel';
import { AboutModal, ImpactModal, TutorsModal } from './AboutScreen';
import UpcomingDemoCard from './UpcomingDemoCard';

// Stat carousel card width + gap — wide rectangles that overflow the screen so the row
// slides. snapToInterval below uses STAT_W + STAT_GAP so each card settles cleanly.
const STAT_W = 162;
const STAT_GAP = 12;

// A soft radial glow disc (SVG, fades to transparent) — a real premium light halo, not
// a hard circle. Unique id per instance so Android never cross-links gradients.
let _glowId = 0;
function SoftGlow({ size = 76, color = '#FF7A3C', opacity = 0.5 }) {
  const id = useRef('glow' + (_glowId++)).current;
  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx={size / 2} cy={size / 2} r={size / 2} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="0.6" stopColor={color} stopOpacity={opacity * 0.45} />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill={`url(#${id})`} />
    </Svg>
  );
}

// A single at-a-glance metric — a wide rounded rectangle: tinted icon chip on the left,
// big number + label on the right. The number spins up like a mechanical odometer and
// settles; everything else stays calm and clean. Lives in a slide carousel.
function StatTile({ Icon, tint, tintBg, value, label, rollDelay = 0, onPress }) {
  const pct = typeof value === 'string' && /^\d+(\.\d+)?%$/.test(value);
  return (
    <PressableScale style={hs.tileShadow} onPress={onPress} accessibilityLabel={`${value} ${label}`}>
      <View style={hs.tile}>
        <CardGradient />
        <View style={[hs.tileIcon, { backgroundColor: tintBg }]}><Icon size={20} color={tint} strokeWidth={2.5} /></View>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          {typeof value === 'number'
            ? <Odometer value={value} delay={rollDelay} height={30} w="xbold" s={23} c={C.ink} />
            : pct
              ? <Odometer value={Math.round(parseFloat(value))} suffix="%" delay={rollDelay} height={30} w="xbold" s={23} c={C.ink} />
              : <T w="xbold" s={23} c={C.ink} numberOfLines={1}>{value}</T>}
          <T w="semi" s={11.5} c={C.muted} numberOfLines={1} style={{ marginTop: 1 }}>{label}</T>
        </View>
      </View>
    </PressableScale>
  );
}

// Warm gradient wash for the "book a free demo" hero — a clean amber→orange surface
// (top→bottom, so no right-edge band) with a soft top-right glow. Measured in pixels
// with userSpaceOnUse so the gradient never skews on Android.
function DemoSurface() {
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
            <LG id="demoG" x1="0" y1="0" x2="0" y2={d.h} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFBC46" />
              <Stop offset="1" stopColor="#F26A16" />
            </LG>
            <RadialGradient id="demoGlow" cx={d.w * 0.86} cy={d.h * 0.04} r={d.w * 0.7} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.34" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={d.w} height={d.h} fill="url(#demoG)" />
          <Rect x="0" y="0" width={d.w} height={d.h} fill="url(#demoGlow)" />
        </Svg>
      )}
    </View>
  );
}

function DemoChip({ Icon, label }) {
  return (
    <View style={hs.demoChip}>
      <Icon size={13} color="#5A3410" strokeWidth={2.6} />
      <T w="xbold" s={11.5} c="#5A3410">{label}</T>
    </View>
  );
}

// The redesigned demo hero — replaces the old mustard card + placeholder photo.
function DemoCard({ onBookTrial }) {
  const chips = [
    { Icon: Users, label: '1:1 Live' },
    { Icon: Clock3, label: '60 min' },
    { Icon: Sparkles, label: 'Free' },
  ];
  return (
    <View style={hs.demoShadow}>
      <View style={hs.demoCard}>
        <DemoSurface />
        {/* a soft white light breathes in the corner — living premium glow, clipped to card */}
        <Pulse style={hs.demoGlow} from={0.9} to={1.18} duration={3200}>
          <SoftGlow size={160} color="#FFFFFF" opacity={0.22} />
        </Pulse>
        <Float distance={9} duration={4200} style={hs.demoWatermark}>
          <GraduationCap size={132} color="rgba(255,255,255,0.15)" strokeWidth={1.4} />
        </Float>
        <View style={hs.demoBadge}>
          <Pulse from={0.8} to={1.15} duration={1100}><Sparkles size={12} color={C.orange} strokeWidth={2.6} /></Pulse>
          <T w="xbold" s={10.5} c={C.orange} style={{ letterSpacing: 0.8 }}>FREE DEMO CLASS</T>
        </View>
        <T w="xbold" s={23} c="#3A2205" style={{ marginTop: 14, lineHeight: 29, letterSpacing: -0.3 }}>Learning that{'\n'}actually sticks</T>
        <T w="semi" s={13.5} c="#71491A" style={{ marginTop: 8, lineHeight: 19 }}>A live 1:1 class with an expert mentor — see how your child learns best.</T>
        <View style={hs.demoChips}>
          {chips.map((c, i) => (
            <PopIn key={c.label} delay={360 + i * 100}><DemoChip Icon={c.Icon} label={c.label} /></PopIn>
          ))}
        </View>
        <Breathe>
          <PressableScale style={hs.demoCta} onPress={onBookTrial} accessibilityLabel="Book a free demo class">
            <T w="bold" s={15} c="#fff">Book your free class</T>
            <Nudge distance={5}><ArrowRight size={18} color="#fff" strokeWidth={2.6} /></Nudge>
          </PressableScale>
        </Breathe>
      </View>
    </View>
  );
}

function HomeTab({ meta, childName, onAvatar, onGym, onActivity, onBookTrial, report, refreshing, onRefresh, booking, onJoinDemo, onRescheduleDemo, onCancelDemo }) {
  const bg = report.brainGym || {};
  const streak = Number(bg.currentStreak) || 0;
  const quizzes = Number(bg.quizzesCompleted) || 0;
  const acc = Number(bg.accuracy) || 0;
  const [eventsOpen, setEventsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [impactOpen, setImpactOpen] = useState(false);
  const [tutorsOpen, setTutorsOpen] = useState(false);
  const events = report.events || [];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={st.screen}>
      <Header meta={meta} childName={childName} onAvatar={onAvatar} onGym={onGym} />
      <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}>

        {/* Greeting — a warm, personal hello with a waving hand leads the dashboard. */}
        <FadeInOnce id="home-greet" delay={20}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <T w="semi" s={14} c={C.muted}>{greet}</T>
            <Wave><T s={14}>👋</T></Wave>
          </View>
          <T w="xbold" s={27} c={C.ink} numberOfLines={1} style={{ marginTop: 2, letterSpacing: -0.5 }}>{childName}'s learning</T>
        </FadeInOnce>

        {/* At-a-glance stat widgets — a smooth horizontal carousel. Cards slide in from
            the right one after another on first view, then scroll/snap by finger. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={hs.statScroll}
          contentContainerStyle={hs.statScrollContent}
          snapToInterval={STAT_W + STAT_GAP}
          snapToAlignment="start"
          decelerationRate="fast"
        >
          {[
            { Icon: Flame, tint: C.orange, tintBg: C.peach, value: streak, label: 'Day streak' },
            { Icon: Target, tint: C.blue, tintBg: C.blueSoft, value: quizzes, label: 'Quizzes' },
            { Icon: TrendingUp, tint: C.green, tintBg: C.greenSoft, value: `${acc}%`, label: 'Accuracy' },
          ].map((s, i) => (
            <FadeInOnce key={s.label} id={`home-stat-${i}`} delay={90 + i * 100} x={30} y={0} duration={560} style={{ marginRight: STAT_GAP }}>
              <StatTile Icon={s.Icon} tint={s.tint} tintBg={s.tintBg} value={s.value} label={s.label} rollDelay={560 + i * 150} onPress={onActivity} />
            </FadeInOnce>
          ))}
        </ScrollView>

        {/* Upcoming demo — the dark hero widget, or the book-a-demo card when none. */}
        {booking ? (
          <FadeInOnce id="home-hero" delay={260}>
            <Label>Upcoming demo</Label>
            <UpcomingDemoCard booking={booking} onJoin={onJoinDemo} onReschedule={onRescheduleDemo} onCancel={onCancelDemo} />
          </FadeInOnce>
        ) : (
          <FadeInOnce id="home-booking" delay={260} y={20}>
            <View style={{ marginTop: 22 }}>
              <DemoCard onBookTrial={onBookTrial} />
            </View>
          </FadeInOnce>
        )}

        <FadeInOnce id="home-events" delay={160}>
          <Label>Offline events</Label>
          {events.length ? (
            <EventTeaser event={events[0]} onOpen={() => setEventsOpen(true)} />
          ) : (
            <View style={st.eventCard}>
              <T w="xbold" s={20} c="#fff">In-person workshops</T>
              <T w="med" s={13} c="rgba(255,255,255,0.7)" style={{ marginTop: 6, marginBottom: 16 }}>Hands-on learning events near you.</T>
              <PressableScale style={st.eventBtn} onPress={() => setEventsOpen(true)}>
                <T w="bold" s={15} c={C.ink}>Register Now</T>
              </PressableScale>
            </View>
          )}
        </FadeInOnce>
        {/* About Us, Our Impact and Our Tutors all open from the Events footer accordion
            (ABOUT AILERNOVA → About Us / Our Impact / Our Tutors), and from each other's
            footers. The opener closes first — two RN Modals stacked at once don't reliably
            layer on Android. */}
        <EventsModal visible={eventsOpen} onClose={() => setEventsOpen(false)}
          events={events} store={report.eventStore} skills={report.eventSkills} gallery={report.eventGallery}
          onAbout={() => { setEventsOpen(false); setAboutOpen(true); }}
          onImpact={() => { setEventsOpen(false); setImpactOpen(true); }}
          onTutors={() => { setEventsOpen(false); setTutorsOpen(true); }} />
        {/* Sticky "Get Started" → close the story, then open the free-demo sheet. */}
        <AboutModal
          visible={aboutOpen}
          onClose={() => setAboutOpen(false)}
          onGetStarted={() => { setAboutOpen(false); onBookTrial && onBookTrial(); }}
          onImpact={() => { setAboutOpen(false); setImpactOpen(true); }}
          onTutors={() => { setAboutOpen(false); setTutorsOpen(true); }}
        />
        <ImpactModal
          visible={impactOpen}
          onClose={() => setImpactOpen(false)}
          onGetStarted={() => { setImpactOpen(false); onBookTrial && onBookTrial(); }}
          onAbout={() => { setImpactOpen(false); setAboutOpen(true); }}
          onTutors={() => { setImpactOpen(false); setTutorsOpen(true); }}
        />
        {/* "Find the Right Tutor" → close the page, then open the free-demo sheet: the
            demo IS how a parent gets matched with a tutor. */}
        <TutorsModal
          visible={tutorsOpen}
          onClose={() => setTutorsOpen(false)}
          onGetStarted={() => { setTutorsOpen(false); onBookTrial && onBookTrial(); }}
          onAbout={() => { setTutorsOpen(false); setAboutOpen(true); }}
          onImpact={() => { setTutorsOpen(false); setImpactOpen(true); }}
        />

      </ScrollView>
    </View>
  );
}

const hs = StyleSheet.create({
  // Slide carousel: full-bleed (negative margins cancel the body's 18px padding) so
  // cards enter from the screen edge; paddingVertical keeps card shadows from clipping.
  statScroll: { marginHorizontal: -18, marginTop: 18 },
  statScrollContent: { paddingHorizontal: 18, paddingVertical: 4 },
  tileShadow: { width: STAT_W, borderRadius: 20, backgroundColor: '#fff', ...card },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, overflow: 'hidden', paddingVertical: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: C.hair },
  tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Demo hero — warm shadow on the outer layer, gradient clip on the inner.
  demoShadow: { borderRadius: 24, backgroundColor: '#F1701A', shadowColor: '#A9500E', shadowOpacity: 0.34, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
  demoCard: { borderRadius: 24, overflow: 'hidden', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18 },
  demoGlow: { position: 'absolute', top: -46, right: -34 },
  demoWatermark: { position: 'absolute', top: -14, right: -16 },
  demoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6 },
  demoChips: { flexDirection: 'row', gap: 8, marginTop: 16 },
  demoChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.32)', borderRadius: 11, paddingHorizontal: 10, paddingVertical: 7 },
  demoCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2A1806', borderRadius: 15, paddingVertical: 15, marginTop: 18, overflow: 'hidden' },
});

export default memo(HomeTab);
