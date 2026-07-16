// src/screens/parent/ParentApp/EventsCarousel.js
// The "Offline events" experience on the Parent home. The home shows a single image
// teaser card (EventTeaser); tapping it opens EventsModal — a full-screen page with
// all 7 sections STACKED vertically (scroll down to see them all), not a slider:
//   featured event · explore-by-region · what's-in-store · AILERNOVA skills ·
//   participants grid · community · become-AILERNOVA + footer.
// List data (events/store/skills/gallery) is DB-driven via the report; marketing copy
// lives in CONTENT.event (constants.js). Rebranded AILERNOVA.
import React, { useState, useRef, useEffect } from 'react';
import {
  View, ScrollView, Image, ImageBackground, Dimensions, StyleSheet,
  Linking, LayoutAnimation, Platform, UIManager, Modal, SafeAreaView, Animated, Easing, ActivityIndicator,
} from 'react-native';
import { Star, Plus, Minus, Play, Globe, MapPin, Smartphone, Calendar, Clock, Ticket, ExternalLink, ChevronLeft, Users, TrendingUp, Video, BookOpen, Award } from 'lucide-react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Path, Rect as SvgRect, Circle, Polygon } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { C, T, CONTENT, Wordmark } from './constants';
import { PressableScale, FadeIn, CountUp } from './anim';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
const { width: SCREEN_W } = Dimensions.get('window');
const STORE_W = SCREEN_W - 72;   // inner store-slider width (screen − modal pad − card pad)

// Per-slide pastel frames for "What's in store for you?" — soft fill + a deeper
// border of the same hue. Cycled by slide index; matches the Skills palette.
const STORE_TINTS = [
  { bg: '#FBEFC6', br: '#EBC34B' }, // yellow
  { bg: '#FBE0CE', br: '#F0A98A' }, // peach
  { bg: '#F4D6F1', br: '#D98FD0' }, // pink
  { bg: '#C8F5D8', br: '#7FD3A0' }, // mint
];
// A deeper border for each skill-row tint (keys are the seeded sk.color values).
const SKILL_BORDER = {
  '#C8F5D8': '#7FD3A0', '#FBE0CE': '#F0A98A', '#F4D6F1': '#D98FD0',
  '#D5E4FB': '#9FC0F5', '#FBEFC6': '#EBC34B',
};

// Subtle graph-paper grid for the page background (Cuemath-style). A fixed full-screen
// SVG pattern; the opaque content cards float over it, so the grid only shows in the gaps.
function GridBg({ cell = 26, color = '#E6E7EC' }) {
  const { width, height } = Dimensions.get('window');
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="evGrid" width={cell} height={cell} patternUnits="userSpaceOnUse">
          <Path d={`M ${cell} 0 L 0 0 0 ${cell}`} fill="none" stroke={color} strokeWidth={1} />
        </Pattern>
      </Defs>
      <SvgRect x="0" y="0" width={width} height={height} fill="url(#evGrid)" />
    </Svg>
  );
}

// Join-the-dots rocket: the outline draws through the dots, then a booster flame fires
// and the rocket launches up and lands — looping. SVG path-drawing via strokeDashoffset.
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const ROCKET_PTS = [
  [100, 24], [120, 62], [120, 116], [146, 150], [120, 150], [114, 166],
  [86, 166], [80, 150], [54, 150], [80, 116], [80, 62], [100, 24],
];
const _seg = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const ROCKET_D = ROCKET_PTS.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
const ROCKET_LEN = ROCKET_PTS.reduce((s, p, i) => (i ? s + _seg(ROCKET_PTS[i - 1], p) : 0), 0);

function RocketDotToDot() {
  const draw = useRef(new Animated.Value(0)).current;   // 0..1 outline drawing
  const lift = useRef(new Animated.Value(0)).current;   // 0..1 launch height
  useEffect(() => {
    let alive = true;
    const run = () => {
      if (!alive) return;
      draw.setValue(0); lift.setValue(0);
      Animated.sequence([
        Animated.timing(draw, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.delay(320),
        Animated.timing(lift, { toValue: 1, duration: 720, easing: Easing.in(Easing.cubic), useNativeDriver: false }),   // launch
        Animated.timing(lift, { toValue: 0, duration: 820, easing: Easing.out(Easing.cubic), useNativeDriver: false }),  // land
        Animated.delay(600),
      ]).start(({ finished }) => { if (finished && alive) run(); });
    };
    run();
    return () => { alive = false; draw.stopAnimation(); lift.stopAnimation(); };
  }, [draw, lift]);

  const dashoffset = draw.interpolate({ inputRange: [0, 1], outputRange: [ROCKET_LEN, 0] });
  const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -40] });
  const flameOpacity = lift.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 0.95, 1] });
  const flameScale = lift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.8] });

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Svg width={172} height={172} viewBox="0 0 200 200">
        {/* booster flame (shows during launch) */}
        <AnimatedPolygon points="86,168 114,168 100,206" fill="#FB8C1A" opacity={flameOpacity}
          origin="100,168" style={{ transform: [{ scaleY: flameScale }] }} />
        <AnimatedPolygon points="92,168 108,168 100,192" fill="#FFC24B" opacity={flameOpacity} />
        {/* the numbered dots to join */}
        {ROCKET_PTS.slice(0, -1).map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={3.2} fill="#9DB4CC" />)}
        {/* porthole */}
        <Circle cx={100} cy={82} r={11} fill="none" stroke="#9DB4CC" strokeWidth={2} />
        {/* the connecting outline, drawn progressively */}
        <AnimatedPath d={ROCKET_D} fill="none" stroke={C.blue} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round"
          strokeDasharray={ROCKET_LEN} strokeDashoffset={dashoffset} />
      </Svg>
    </Animated.View>
  );
}

// "View Detailed Curriculum" → generates a branded PDF of the class curriculum and opens
// the system share/save sheet (a real download). Uses expo-print + expo-sharing.
async function downloadCurriculum(cls, H) {
  const rows = cls.topics.map((t, i) => `<tr><td class="n">${i + 1}</td><td>${t}</td></tr>`).join('');
  const html = `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{font-family:-apple-system,Roboto,Arial,sans-serif;color:#161616;padding:36px}
    h1{color:#1848F0;margin:0 0 2px} .sub{color:#6C7179;margin:0 0 22px;font-size:14px}
    .lead{font-weight:800;font-size:18px;margin:0 0 14px} table{border-collapse:collapse;width:100%}
    td{padding:11px 8px;border-bottom:1px solid #ECECEE;font-size:15px}
    td.n{width:34px;color:#6C7179;font-weight:800} .foot{margin-top:28px;color:#A6AAB2;font-size:12px}
  </style></head><body>
    <h1>Ailernova</h1><p class="sub">${cls.tab} · Maths Curriculum</p>
    <p class="lead">${H.boardsBody}</p>
    <table>${rows}</table>
    <p class="foot">Learning that actually sticks · ailernova.com</p>
  </body></html>`;
  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${cls.tab} Maths Curriculum`, UTI: 'com.adobe.pdf' });
    }
  } catch (e) { /* user cancelled or unavailable — no-op */ }
}

// Small spinning donut chart — the "moving content" on the laptop screen.
function Donut({ rotate, color, size = 30 }) {
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Svg width={size} height={size} viewBox="0 0 36 36">
        <Circle cx="18" cy="18" r="13" fill="none" stroke={color + '33'} strokeWidth="6" />
        <Circle cx="18" cy="18" r="13" fill="none" stroke={color} strokeWidth="6" strokeDasharray="34 88" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

// 360° approach — an orange circle with a laptop whose on-screen charts spin, plus a
// pale swoosh that orbits the circle. Cuemath-style animated hero.
function Approach360({ title, body }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotateRev = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  return (
    <View style={s.p360Card}>
      {!!title && <T w="xbold" s={24} c="#3A2205" style={{ textAlign: 'center', lineHeight: 31 }}>{title}</T>}
      {!!body && <T w="semi" s={13} c="#8A6A2E" style={{ textAlign: 'center', lineHeight: 19, marginTop: 8 }}>{body}</T>}

      <View style={s.p360Stage}>
        <View style={s.p360Circle} />
        <Animated.View style={[s.p360Orbit, { transform: [{ rotate }] }]}>
          <Svg width={250} height={250} viewBox="0 0 250 250">
            <Path d="M18 125 A107 107 0 0 1 232 125" fill="none" stroke="#FCE39A" strokeWidth="7" strokeLinecap="round" opacity={0.9} />
          </Svg>
        </Animated.View>

        {/* Laptop with moving screen content. */}
        <View style={s.lapWrap}>
          <View style={s.lapScreen}>
            <View style={s.lapInner}>
              <View style={s.lapBar}>
                <View style={[s.lapDot, { backgroundColor: '#F0501E' }]} />
                <View style={[s.lapDot, { backgroundColor: '#F5B301' }]} />
                <View style={[s.lapDot, { backgroundColor: '#12924B' }]} />
              </View>
              <View style={s.lapCharts}>
                <Donut rotate={rotate} color="#8B5CF6" />
                <Donut rotate={rotateRev} color="#12B3A6" />
              </View>
            </View>
          </View>
          <View style={s.lapBase} />
        </View>

        <View style={s.p360Badge}>
          <T w="xbold" s={13} c="#fff">360°</T>
          <T w="bold" s={8.5} c="rgba(255,255,255,0.9)" style={{ letterSpacing: 0.5 }}>MATHS</T>
        </View>
      </View>
    </View>
  );
}

const open = (u) => { if (u) Linking.openURL(u).catch(() => {}); };
// Render 5 stars filled to the actual score (rounded), rest outlined — not always 5.
const Stars = ({ score = 5, size = 12 }) => {
  const filled = Math.max(0, Math.min(5, Math.round(Number(score) || 0)));
  return (
    <View style={{ flexDirection: 'row', gap: 2 }} accessible accessibilityLabel={`${score} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} color="#00B67A" fill={i < filled ? '#00B67A' : 'none'} />
      ))}
    </View>
  );
};
const spring = () => LayoutAnimation.configureNext(LayoutAnimation.create(260, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));

// Network image that fades in on load (over a soft placeholder) — no jarring pop-in.
function FadeImage({ source, style, radius = 0 }) {
  const o = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  return (
    <View style={[style, { backgroundColor: C.border, borderRadius: radius, overflow: 'hidden' }]}>
      {loading && <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator size="small" color={C.faint} /></View>}
      <Animated.Image
        source={source}
        style={[StyleSheet.absoluteFill, { opacity: o }]}
        resizeMode="cover"
        onLoad={() => { setLoading(false); Animated.timing(o, { toValue: 1, duration: 280, useNativeDriver: true }).start(); }}
      />
    </View>
  );
}

/* 1 ── Featured event ─────────────────────────────────────────────────────── */
function EventPage({ ev, E, onRegister }) {
  return (
    <View style={[s.card, { backgroundColor: '#14151B' }]}>
      <ImageBackground source={{ uri: ev.image }} style={{ height: 320 }} imageStyle={{ resizeMode: 'cover' }}>
        <View style={s.scrim} />
        <View style={{ flex: 1, padding: 16, justifyContent: 'space-between' }}>
          <View style={s.badge}><T w="bold" s={10} c={C.ink} style={{ letterSpacing: 0.5 }}>{ev.badge || 'IN-PERSON EVENTS'}</T></View>
          <View>
            <T w="semi" s={12.5} c="rgba(255,255,255,0.9)">{ev.duration}</T>
            <T w="xbold" s={22} c="#fff" style={{ lineHeight: 27, marginTop: 2 }}>{ev.title}</T>
            <T w="med" s={12.5} c="rgba(255,255,255,0.85)" style={{ marginTop: 4 }}>{ev.grades}{ev.city ? `  ·  ${ev.city}` : ''}</T>
            <PressableScale style={s.cta} onPress={onRegister || (() => open(ev.ctaUrl))}><T w="bold" s={14.5} c={C.ink}>{ev.ctaLabel || E.cta}</T></PressableScale>
            <PressableScale style={s.learn} onPress={() => open(ev.learnUrl)}>
              <View style={s.learnDot}><Play size={9} color="#fff" fill="#fff" /></View>
              <T w="semi" s={12} c="rgba(255,255,255,0.92)">{ev.learnLabel || E.learn}</T>
            </PressableScale>
          </View>
        </View>
      </ImageBackground>
      <View style={s.footer}>
        <View style={s.statsRow}>
          {E.stats.map((st, i) => {
            const m = String(st.value).match(/^(\d+)(.*)$/);   // "200+" → 200 "+" ; "22K+" → 22 "K+"
            return (
              <View key={i} style={{ alignItems: 'center' }}>
                {m
                  ? <CountUp value={parseInt(m[1], 10)} suffix={m[2]} duration={1100} w="xbold" s={15} c={C.ink} />
                  : <T w="xbold" s={15} c={C.ink}>{st.value}</T>}
                <T w="med" s={10.5} c={C.muted}>{st.label}</T>
              </View>
            );
          })}
        </View>
        <View style={s.ratingRow}>
          <T w="xbold" s={13} c={C.ink}>{E.rating.score}</T><Stars score={E.rating.score} /><T w="med" s={11} c={C.muted}>· {E.rating.count}</T>
        </View>
      </View>
    </View>
  );
}

/* 2 ── Explore events by region ───────────────────────────────────────────── */
function RegionPage({ events, E }) {
  const [region, setRegion] = useState(null);
  const [openList, setOpenList] = useState(false);
  const matches = region ? events.filter((e) => e.city === region) : [];
  return (
    <View style={[s.card, s.pad, s.light]}>
      <T w="xbold" s={19} c={C.ink} style={{ textAlign: 'center', marginTop: 2 }}>{E.exploreTitle}</T>
      <PressableScale style={s.regionPill} onPress={() => { spring(); setOpenList((o) => !o); }}>
        <Globe size={15} color={C.ink} />
        <T w="semi" s={13} c={C.ink} style={{ flex: 1, textAlign: 'center' }}>{region || E.regionCta}</T>
        <T w="bold" s={12} c={C.muted}>{openList ? '▲' : '▼'}</T>
      </PressableScale>
      {openList && (
        <View style={s.regionList}>
          {E.regions.map((c) => (
            <PressableScale key={c} style={s.regionItem} onPress={() => { spring(); setRegion(c); setOpenList(false); }}>
              <MapPin size={13} color={C.blue} /><T w="med" s={13} c={C.ink}>{c}</T>
            </PressableScale>
          ))}
        </View>
      )}
      {!region ? (
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 28 }}>
          <View style={s.globe}><Globe size={34} color={C.blue} /></View>
          <T w="med" s={13} c={C.muted} style={{ textAlign: 'center', maxWidth: 220, lineHeight: 20 }}>{E.exploreHint}</T>
        </View>
      ) : (
        <View style={{ marginTop: 16, gap: 12 }}>
          {matches.map((e, idx) => (
            <PressableScale key={e.id} onPress={() => open(e.ctaUrl)}
              style={[s.regCard, { backgroundColor: idx % 2 ? '#FBE3D2' : '#FCEFC7', borderLeftColor: idx % 2 ? C.orange : C.gold }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <T w="xbold" s={10.5} c="#8A5A2B" style={{ letterSpacing: 0.5 }}>AILERNOVA · {e.city}</T>
                <T w="bold" s={14} c={C.ink} numberOfLines={2} style={{ marginTop: 3, lineHeight: 18 }}>{e.title}</T>
              </View>
              <View style={{ gap: 6 }}>
                <View style={s.regMeta}><Ticket size={12} color={C.ink} /><T w="semi" s={11} c={C.ink}>{e.free ? 'Free' : 'Paid'}</T></View>
                {!!e.date && <View style={s.regMeta}><Calendar size={12} color={C.ink} /><T w="med" s={11} c={C.ink}>{e.date}</T></View>}
                {!!e.time && <View style={s.regMeta}><Clock size={12} color={C.ink} /><T w="med" s={11} c={C.ink}>{e.time}</T></View>}
              </View>
              <View style={s.regLink}><ExternalLink size={13} color={C.ink} /></View>
            </PressableScale>
          ))}
          {!matches.length && <T w="med" s={13} c={C.muted} style={{ textAlign: 'center', marginTop: 12 }}>No events in {region} yet.</T>}
        </View>
      )}
    </View>
  );
}

/* 3 ── What's in store — inner image slider ──────────────────────────────── */
function StorePage({ slides, E }) {
  const [i, setI] = useState(0);
  return (
    <View style={[s.card, s.pad, s.light]}>
      <T w="xbold" s={19} c={C.ink} style={{ textAlign: 'center' }}>{E.storeTitle}</T>
      <T w="med" s={12.5} c={C.muted} style={{ textAlign: 'center', marginTop: 8, lineHeight: 19 }}>{E.storeBody}</T>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}
        onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / STORE_W))}>
        {slides.map((sl, k) => {
          const t = STORE_TINTS[k % STORE_TINTS.length];
          return (
            <View key={sl.id} style={{ width: STORE_W }}>
              <View style={[s.storeSlide, { backgroundColor: t.bg, borderColor: t.br }]}>
                <FadeImage source={{ uri: sl.image }} style={s.storeImg} radius={12} />
                <T w="xbold" s={13} c={C.ink} style={{ letterSpacing: 1, textAlign: 'center', marginTop: 12 }}>{sl.label}</T>
                <T w="med" s={12.5} c={C.muted} style={{ textAlign: 'center', marginTop: 6, lineHeight: 19, paddingHorizontal: 4 }}>{sl.body}</T>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={s.dots}>{slides.map((_, k) => <View key={k} style={[s.dot, k === i && s.dotOn]} />)}</View>
    </View>
  );
}

/* 4 ── AILERNOVA Skills You'll Discover ───────────────────────────────────── */
function SkillsPage({ skills, E }) {
  return (
    <View style={[s.card, s.pad, s.light]}>
      <T w="xbold" s={19} c={C.ink}>{E.skillsTitle}</T>
      <T w="med" s={12} c={C.muted} style={{ marginTop: 6, lineHeight: 18 }}>{E.skillsIntro}</T>
      <View style={{ marginTop: 12, gap: 10 }}>
        {skills.map((sk, k) => {
          const bg = sk.color || C.blueSoft;
          const br = SKILL_BORDER[bg] || C.border;
          return (
            <FadeIn key={sk.id} delay={k * 70} y={10}>
              <View style={[s.skillRow, { backgroundColor: bg, borderColor: br }]}>
                <View style={{ flex: 1 }}>
                  <T w="xbold" s={12.5} c={C.ink} style={{ letterSpacing: 0.6 }}>{sk.title}</T>
                  <T w="med" s={12} c={C.ink} style={{ marginTop: 4, lineHeight: 17, opacity: 0.72 }}>{sk.body}</T>
                </View>
                <View style={[s.skillIcon, { backgroundColor: '#fff', borderColor: br }]}><T s={22}>{sk.emoji || '✦'}</T></View>
              </View>
            </FadeIn>
          );
        })}
      </View>
    </View>
  );
}

/* 5 ── Hear From Our Participants — photo grid ────────────────────────────── */
function ParticipantsPage({ gallery, E }) {
  const col = (arr) => (
    <View style={{ flex: 1, gap: 8 }}>
      {arr.map((g, i) => <FadeImage key={g.id} source={{ uri: g.image }} style={[s.gPhoto, { height: i % 2 ? 150 : 110 }]} radius={12} />)}
    </View>
  );
  return (
    <View style={[s.card, s.pad, s.light]}>
      <T w="xbold" s={19} c={C.ink} style={{ textAlign: 'center', marginBottom: 12 }}>{E.participantsTitle}</T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {col(gallery.filter((_, i) => i % 2 === 0))}
        {col(gallery.filter((_, i) => i % 2 === 1))}
      </View>
    </View>
  );
}

/* 6 ── Join our community ─────────────────────────────────────────────────── */
// Brand marks come from FontAwesome6's `brand` set — lucide ships no brand icons.
// A channel renders only when constants.js CONTENT.event.community has its URL.
const SOCIALS = [
  { key: 'instagram', icon: 'instagram',   label: 'Instagram', gradient: ['#F9A03F', '#E1306C', '#C13584'] },
  { key: 'youtube',   icon: 'youtube',     label: 'YouTube',   bg: '#FF0000' },
  { key: 'facebook',  icon: 'facebook-f',  label: 'Facebook',  bg: '#1877F2' },
  { key: 'linkedin',  icon: 'linkedin-in', label: 'LinkedIn',  bg: '#0A66C2' },
];

// PressableScale puts `style` on its inner Animated.View, so the outer Pressable —
// the actual flex child of the row — would shrink-wrap. The flex:1 wrapper is what
// makes the two buttons in a row share the width evenly.
function SocialButton({ item, url }) {
  const face = (
    <>
      <FontAwesome6 name={item.icon} size={15} color="#fff" brand />
      <T w="bold" s={13.5} c="#fff">{item.label}</T>
    </>
  );
  return (
    <View style={{ flex: 1 }}>
      <PressableScale onPress={() => open(url)} accessibilityRole="link" accessibilityLabel={`Ailernova on ${item.label}`}>
        {item.gradient
          ? <LinearGradient colors={item.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.social}>{face}</LinearGradient>
          : <View style={[s.social, { backgroundColor: item.bg }]}>{face}</View>}
      </PressableScale>
    </View>
  );
}

function CommunityPage({ gallery, E }) {
  const cm = E.community;
  const strip = gallery.slice(0, 3);
  const live = SOCIALS.filter((x) => cm[x.key]);
  const rows = [live.slice(0, 2), live.slice(2, 4)].filter((r) => r.length);
  return (
    <View style={[s.card, { backgroundColor: '#14151B', overflow: 'hidden' }]}>
      <View style={{ padding: 22 }}>
        <T w="xbold" s={22} c="#fff" style={{ lineHeight: 28 }}>{cm.title}</T>
        <T w="med" s={13} c="rgba(255,255,255,0.7)" style={{ marginTop: 10, lineHeight: 19 }}>{cm.body}</T>
        <View style={{ marginTop: 16, gap: 10 }}>
          {rows.map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              {row.map((x) => <SocialButton key={x.key} item={x} url={cm[x.key]} />)}
              {row.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          ))}
        </View>
      </View>
      {!!strip.length && (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {strip.map((g) => <FadeImage key={g.id} source={{ uri: g.image }} style={{ flex: 1, height: 140 }} />)}
        </View>
      )}
    </View>
  );
}

/* 7 ── Become AILERNOVA + functional footer accordion ─────────────────────── */
// Each accordion opens a list of links. `action: 'about'` opens the About Us story page
// (onAbout), `action: 'impact'` opens Our Impact (onImpact), `action: 'tutors'` opens Our
// Tutors (onTutors); everything else opens its url.
// Exported: the About, Impact and Tutors pages close with this exact block too, so the
// footer sections are reachable from there as well.
export function BecomePage({ E, onAbout, onImpact, onTutors, onOpenProgram }) {
  const bc = E.become;
  const ft = E.footer;
  const [openIdx, setOpenIdx] = useState(-1);
  const toggle = (i) => { spring(); setOpenIdx((o) => (o === i ? -1 : i)); };
  const tapItem = (it) => {
    if (it.program) return onOpenProgram && onOpenProgram(it.program);
    if (it.action === 'about') return onAbout && onAbout();
    if (it.action === 'impact') return onImpact && onImpact();
    if (it.action === 'tutors') return onTutors && onTutors();
    return open(it.url);
  };
  return (
    <View style={[s.card, s.light, { overflow: 'hidden' }]}>
      <View style={{ backgroundColor: '#fff', padding: 20 }}>
        <T w="xbold" s={14} c={C.ink} style={{ letterSpacing: 0.6 }}>{bc.title}</T>
        <T w="med" s={12.5} c={C.muted} style={{ marginTop: 6, lineHeight: 18 }}>{bc.body}</T>
        <PressableScale style={s.appBtn} onPress={() => open(bc.appUrl)}>
          <Smartphone size={16} color="#fff" /><T w="bold" s={13.5} c="#fff">{bc.appCta}</T>
        </PressableScale>
        <View style={s.catRow}>
          {bc.categories.map((c) => (
            <View key={c.label} style={{ alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={s.catCircle}><T s={22}>{c.emoji}</T></View>
              <T w="bold" s={9.5} c={C.muted} style={{ textAlign: 'center', letterSpacing: 0.3 }}>{c.label}</T>
            </View>
          ))}
        </View>
      </View>
      <View style={{ padding: 18, borderTopWidth: 1, borderTopColor: C.border }}>
        {ft.links.map((l, i) => (
          <View key={l.q} style={s.accItem}>
            <PressableScale style={s.accHead} onPress={() => toggle(i)}>
              <T w="bold" s={13} c={C.ink} style={{ flex: 1, letterSpacing: 0.3 }}>{l.q.toUpperCase()}</T>
              {openIdx === i ? <Minus size={17} color={C.muted} /> : <Plus size={17} color={C.muted} />}
            </PressableScale>
            {openIdx === i && (
              <View style={{ paddingBottom: 10 }}>
                {(l.items || []).map((it) => (
                  <PressableScale key={it.label} style={s.accLink} onPress={() => tapItem(it)}>
                    <T w="med" s={14} c={C.ink}>{it.label}</T>
                  </PressableScale>
                ))}
              </View>
            )}
          </View>
        ))}
        <View style={s.offices}>
          {ft.offices.map((o) => (
            <View key={o.label} style={{ flex: 1 }}>
              <T w="bold" s={11} c={C.ink} style={{ letterSpacing: 0.5 }}>{o.label}</T>
              <T w="med" s={11.5} c={C.muted} style={{ marginTop: 6, lineHeight: 17 }}>{o.lines}</T>
            </View>
          ))}
        </View>

        {/* Social tiles — bordered squares, one per channel that has a real URL, each
            opening that channel. Dark brand marks on white for clear contrast. */}
        <View style={s.footDivider} />
        <View style={s.socialRow}>
          {SOCIALS.filter((x) => E.community[x.key]).map((x) => (
            <PressableScale key={x.key} onPress={() => open(E.community[x.key])} accessibilityRole="link" accessibilityLabel={`Ailernova on ${x.label}`}>
              <View style={s.socialTile}><FontAwesome6 name={x.icon} size={19} color="#14151B" brand /></View>
            </PressableScale>
          ))}
        </View>

        {/* Brand + legal row. */}
        <View style={s.footDivider} />
        <View style={s.brandRow}>
          <View style={{ flex: 1 }}>
            <Wordmark size={16} />
            {!!ft.tagline && <T w="med" s={11} c={C.muted} style={{ marginTop: 5 }}>{ft.tagline}</T>}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            {(ft.legal || []).map((lg) => (
              <PressableScale key={lg.label} onPress={() => open(lg.url)} accessibilityRole="link">
                <T w="semi" s={11.5} c={C.muted}>{lg.label}</T>
              </PressableScale>
            ))}
          </View>
        </View>

        {!!ft.copyright && <T w="med" s={10.5} c={C.faint} style={{ textAlign: 'center', marginTop: 18 }}>{ft.copyright}</T>}
      </View>
    </View>
  );
}

/* ── Program detail page (opened from "Our Programs" → a class) ─────────────── */
const FEAT_ICON = { users: Users, trend: TrendingUp, video: Video, book: BookOpen, award: Award };
const BULLET_COLORS = ['#8B5CF6', '#12924B', '#F0501E'];

function FeatureRow({ f }) {
  const Icon = FEAT_ICON[f.icon] || Users;
  return (
    <View style={s.pFeatRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <T w="xbold" s={16} c={C.ink} style={{ lineHeight: 21 }}>{f.title}</T>
        <View style={{ marginTop: 10, gap: 7 }}>
          {f.bullets.map((b, i) => (
            <View key={b} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <View style={[s.pBullet, { backgroundColor: BULLET_COLORS[i % BULLET_COLORS.length] }]} />
              <T w="med" s={12.5} c={C.muted} style={{ flex: 1, lineHeight: 17 }}>{b}</T>
            </View>
          ))}
        </View>
      </View>
      <View style={[s.pFeatIcon, { backgroundColor: f.bg }]}><Icon size={26} color={f.tint} strokeWidth={2.2} /></View>
    </View>
  );
}

// Swipeable "method" cards — colored cards with a numbered stepper + dots. Manual snap
// carousel; the dots and stepper track the active card. Heading sits below.
function MethodSlider({ heading, cards }) {
  const [page, setPage] = useState(0);
  const CARD_W = SCREEN_W - 36;
  const GAP = 12;
  const onScroll = (e) => setPage(Math.round(e.nativeEvent.contentOffset.x / (CARD_W + GAP)));
  return (
    <View style={{ marginTop: 30 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={CARD_W + GAP}
        decelerationRate="fast" onScroll={onScroll} scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 18 }}>
        {cards.map((c, i) => {
          const next = (i + 1) % cards.length;
          return (
            <View key={c.title} style={[s.mCard, { width: CARD_W, marginRight: GAP, backgroundColor: c.bg }]}>
              <View style={s.mStep}>
                <View style={s.mStepDot}><T w="xbold" s={15} c={c.tint}>{i + 1}</T></View>
                <View style={[s.mStepLine, { backgroundColor: c.tint + '55' }]} />
                <View style={s.mStepNext}><T w="xbold" s={14} c={cards[next].tint + '66'}>{next + 1}</T></View>
              </View>
              <T w="xbold" s={16.5} c={C.ink} style={{ marginTop: 20 }}>{c.title}</T>
              <T w="med" s={13} c={C.muted} style={{ marginTop: 8, lineHeight: 20 }}>{c.body}</T>
              <View style={s.mDots}>
                {cards.map((cc, j) => (
                  <View key={cc.title} style={[s.mDot, j === i ? { backgroundColor: c.tint, width: 16 } : { backgroundColor: 'rgba(0,0,0,0.14)' }]} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
      {!!heading && <T w="xbold" s={24} c={C.ink} style={{ lineHeight: 31, paddingHorizontal: 22, marginTop: 26 }}>{heading}</T>}
    </View>
  );
}

// A full-screen page rendered inside the events modal. Sticky class switcher + CTA;
// the middle scrolls through the stacked sections. Content re-animates on class switch.
export function ProgramDetail({ programId, onBack }) {
  const H = CONTENT.event.programsHub;
  const classes = H.classes;
  const startIdx = Math.max(0, classes.findIndex((c) => c.id === programId));
  const [idx, setIdx] = useState(startIdx);
  const [grade, setGrade] = useState(0);
  const [page, setPage] = useState(0);
  const scrollRef = useRef(null);
  const cls = classes[idx];
  const SECTIONS = 5;   // care · curriculum · synced · 360° · method

  const pickClass = (i) => { spring(); setIdx(i); setGrade(0); setPage(0); scrollRef.current?.scrollTo({ y: 0, animated: false }); };
  const onScroll = (e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = Math.max(1, contentSize.height - layoutMeasurement.height);
    const frac = Math.min(1, Math.max(0, contentOffset.y / max));
    setPage(Math.round(frac * (SECTIONS - 1)));
  };

  return (
    <View style={s.pdWrap}>
      <GridBg />
      <View style={s.mHead}>
        <PressableScale onPress={onBack} style={s.mBack}><ChevronLeft size={24} color={C.ink} /></PressableScale>
        <T w="bold" s={16} c={C.ink}>Programs</T><View style={{ width: 40 }} />
      </View>

      {/* Sticky class switcher. */}
      <View style={s.pTabsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pTabs}>
          {classes.map((c, i) => {
            const on = i === idx;
            return (
              <PressableScale key={c.id} onPress={() => pickClass(i)} style={s.pTab}>
                <T w={on ? 'xbold' : 'semi'} s={13} c={on ? C.ink : C.faint}>{c.tab}</T>
                <View style={[s.pTabRule, { backgroundColor: on ? C.gold : 'transparent' }]} />
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Section 1 — "We take care of…" + features (light blue card). */}
        <FadeIn key={`care-${cls.id}`} delay={0}>
          <View style={s.pSectionCare}>
            <T w="xbold" s={24} c={C.ink} style={{ lineHeight: 31 }}>{H.careTitle}</T>
            <View style={{ marginTop: 22, gap: 26 }}>
              {H.features.map((f) => <FeatureRow key={f.title} f={f} />)}
            </View>
          </View>
        </FadeIn>

        {/* Section 2 — curriculum. */}
        <FadeIn key={`cur-${cls.id}`} delay={80}>
          <View style={s.pSectionPad}>
            {!!cls.curriculumLead && <T w="bold" s={13} c={C.orange} style={{ letterSpacing: 0.4 }}>{cls.curriculumLead}</T>}
            <T w="xbold" s={24} c={C.ink} style={{ lineHeight: 31, marginTop: 8 }}>{cls.curriculumTitle}</T>
            <T w="med" s={13.5} c={C.muted} style={{ lineHeight: 21, marginTop: 12 }}>{cls.curriculumBody}</T>
            <View style={s.pCurImgFrame}>
              <Image source={PROGRAM_HERO} style={s.pCurImg} resizeMode="cover" />
            </View>
          </View>
        </FadeIn>

        {/* Section 3 — synced with school curriculum. */}
        <FadeIn key={`syn-${cls.id}`} delay={140}>
          <View style={s.pSectionPad}>
            <T w="xbold" s={22} c={C.ink} style={{ lineHeight: 28 }}>{H.boardsTitle}</T>
            <T w="med" s={13} c={C.muted} style={{ lineHeight: 20, marginTop: 8 }}>{H.boardsBody}</T>

            <View style={s.pGradeRow}>
              {cls.grades.map((g, i) => {
                const on = i === grade;
                return (
                  <PressableScale key={g} onPress={() => setGrade(i)} style={[s.pGradeChip, on ? s.pGradeOn : s.pGradeOff]}>
                    <T w="bold" s={12.5} c={on ? C.ink : C.muted}>{g}</T>
                  </PressableScale>
                );
              })}
            </View>

            {/* Join-the-dots rocket — animates: draws the outline, then boosts + lands. */}
            <View style={s.pExerciseWrap}>
              <View style={s.pExerciseBack} />
              <View style={s.pExerciseCard}>
                <RocketDotToDot />
                <T w="semi" s={11.5} c={C.muted} style={{ marginTop: 4 }}>{H.exerciseCaption}</T>
              </View>
            </View>

            {/* Topics list. */}
            <View style={{ marginTop: 26 }}>
              {cls.topics.map((t, i) => (
                <View key={t} style={s.pTopicRow}>
                  <View style={s.pTopicNum}><T w="xbold" s={12} c={C.muted}>{i + 1}</T></View>
                  <T w="semi" s={13.5} c={C.ink} style={{ flex: 1 }}>{t}</T>
                </View>
              ))}
            </View>

            {/* Download the full curriculum PDF. */}
            <PressableScale onPress={() => downloadCurriculum(cls, H)} style={s.pCurLink} accessibilityRole="button">
              <T w="bold" s={13.5} c={C.ink} style={s.pCurLinkTxt}>{H.detailedCurriculumLabel}</T>
            </PressableScale>
          </View>
        </FadeIn>

        {/* Section 4 — 360° approach (animated laptop inside the circle). */}
        <FadeIn key={`a360-${cls.id}`} delay={180}>
          <Approach360 title={H.approachTitle} body={H.approachBody} />
        </FadeIn>

        {/* Section 5 — the method (swipeable colored cards). */}
        {!!H.method && (
          <FadeIn key={`method-${cls.id}`} delay={220}>
            <MethodSlider heading={H.method.heading} cards={H.method.cards} />
          </FadeIn>
        )}
      </ScrollView>

      {/* Sticky CTA + page indicator. */}
      <View style={s.pCtaBar}>
        <PressableScale style={s.pCta} onPress={() => open(H.ctaUrl)}>
          <T w="bold" s={15.5} c={C.ink}>{H.cta}</T>
        </PressableScale>
        <View style={s.pPager}>
          {Array.from({ length: SECTIONS }).map((_, i) => (
            <View key={i} style={[s.pPagerDot, i === page ? s.pPagerOn : null]} />
          ))}
          <T w="bold" s={11.5} c={C.faint} style={{ marginLeft: 8 }}>{page + 1} of {SECTIONS}</T>
        </View>
      </View>
    </View>
  );
}

/* ── All sections stacked vertically (default export) ─────────────────────── */
export default function EventsStack({ events = [], store = [], skills = [], gallery = [], onAbout, onImpact, onTutors, onOpenProgram }) {
  const E = CONTENT.event;
  const scrollRef = useRef(null);
  const regionY = useRef(0);
  // The event card's "Register Now" (the SECOND one, inside the page) scrolls down to
  // the region selector so the parent can pick a location for that event.
  const toRegion = () => { const r = scrollRef.current; if (r) r.scrollTo({ y: Math.max(0, regionY.current), animated: true }); };
  return (
    <ScrollView ref={scrollRef} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View style={{ gap: 14 }}>
        {!!events.length && <FadeIn delay={0}><EventPage ev={events[0]} E={E} onRegister={toRegion} /></FadeIn>}
        {/* onLayout stays on the outer View — FadeIn's translateY doesn't shift layout,
            so regionY stays accurate for the "Register Now" scroll-to. */}
        <View onLayout={(e) => { regionY.current = e.nativeEvent.layout.y + 8; }}>
          <FadeIn delay={60}><RegionPage events={events} E={E} /></FadeIn>
        </View>
        {!!store.length && <FadeIn delay={120}><StorePage slides={store} E={E} /></FadeIn>}
        {!!skills.length && <FadeIn delay={160}><SkillsPage skills={skills} E={E} /></FadeIn>}
        {!!gallery.length && <FadeIn delay={160}><ParticipantsPage gallery={gallery} E={E} /></FadeIn>}
        <FadeIn delay={160}><CommunityPage gallery={gallery} E={E} /></FadeIn>
        <FadeIn delay={160}><BecomePage E={E} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors} onOpenProgram={onOpenProgram} /></FadeIn>
      </View>
    </ScrollView>
  );
}

/* ── Home teaser: a single image event card that opens the full page ───────── */
export function EventTeaser({ event, onOpen }) {
  const E = CONTENT.event;
  const ev = event || {};
  return (
    <PressableScale onPress={onOpen} style={[s.card, { backgroundColor: '#14151B' }]}>
      <ImageBackground source={{ uri: ev.image }} style={s.teaser} imageStyle={{ resizeMode: 'cover' }}>
        <View style={s.scrim} />
        <View>
          <T w="semi" s={12} c="rgba(255,255,255,0.9)" style={{ letterSpacing: 0.3 }}>{ev.badge || 'IN-PERSON EVENTS'}</T>
          <T w="xbold" s={27} c="#fff" style={{ lineHeight: 31, marginTop: 5 }}>{ev.title}</T>
          <T w="med" s={12.5} c="rgba(255,255,255,0.85)" style={{ marginTop: 4 }}>{ev.grades}{ev.city ? `  ·  ${ev.city}` : ''}</T>
        </View>
        <View style={s.teaserBtn}><T w="bold" s={15} c={C.ink}>{ev.ctaLabel || E.cta}</T></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Stars score={E.rating.score} /><T w="semi" s={11} c="rgba(255,255,255,0.85)">{E.rating.score} · {E.rating.count}</T>
        </View>
      </ImageBackground>
    </PressableScale>
  );
}

/* ── Full-screen modal — the whole stacked page ───────────────────────────── */
export function EventsModal({ visible, onClose, events, store, skills, gallery, onAbout, onImpact, onTutors }) {
  const [program, setProgram] = useState(null);
  const close = () => { setProgram(null); onClose && onClose(); };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={program ? () => setProgram(null) : close}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F7' }}>
        {program ? (
          <ProgramDetail programId={program} onBack={() => setProgram(null)} />
        ) : (
          <>
            <GridBg />
            <View style={s.mHead}>
              <PressableScale onPress={close} style={s.mBack}><T s={26} c={C.ink}>‹</T></PressableScale>
              <T w="bold" s={16} c={C.ink}>Events</T><View style={{ width: 40 }} />
            </View>
            <EventsStack events={events} store={store} skills={skills} gallery={gallery} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors} onOpenProgram={setProgram} />
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 20, overflow: 'hidden', shadowColor: '#141420', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  light: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  pad: { padding: 18 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12,12,18,0.42)' },
  badge: { alignSelf: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  cta: { backgroundColor: C.gold, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  learn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', marginTop: 12 },
  learnDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  footer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderTopWidth: 1, borderTopColor: C.border, marginTop: 10, paddingTop: 10 },

  regionPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: C.border, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 11, marginTop: 16 },
  regionList: { borderWidth: 1, borderColor: C.border, borderRadius: 14, marginTop: 8, overflow: 'hidden' },
  regionItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  globe: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  regionEvt: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 10 },
  regionThumb: { width: 54, height: 54, borderRadius: 10, backgroundColor: C.border },
  regCard: { flexDirection: 'row', borderRadius: 14, borderLeftWidth: 4, paddingVertical: 14, paddingLeft: 14, paddingRight: 12 },
  regMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'flex-end' },
  regLink: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },

  storeSlide: { borderRadius: 20, borderWidth: 1.5, padding: 14, marginHorizontal: 3 },
  storeImg: { width: '100%', height: 190, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.border },
  dotOn: { backgroundColor: C.ink, width: 18 },

  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: C.border, borderRadius: 16, padding: 12 },
  skillIcon: { width: 52, height: 52, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  gPhoto: { width: '100%', borderRadius: 12, backgroundColor: C.border },

  social: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13 },

  appBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#14151B', borderRadius: 10, paddingVertical: 13, marginTop: 14 },
  catRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  catCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#14151B', alignItems: 'center', justifyContent: 'center' },
  accItem: { borderBottomWidth: 1, borderBottomColor: C.border },
  accHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  accLink: { paddingVertical: 9 },
  offices: { flexDirection: 'row', gap: 16, marginTop: 20 },
  // Program detail page
  pdWrap: { flex: 1, backgroundColor: '#F6F6F7' },
  pTabsBar: { backgroundColor: '#F6F6F7', borderBottomWidth: 1, borderBottomColor: C.border },
  pTabs: { paddingHorizontal: 18, gap: 24 },
  pTab: { paddingTop: 12, alignItems: 'center' },
  pTabRule: { height: 3, borderRadius: 2, alignSelf: 'stretch', marginTop: 9 },

  pSectionCare: { backgroundColor: '#EAF4FB', paddingHorizontal: 22, paddingTop: 26, paddingBottom: 30 },
  pSectionPad: { paddingHorizontal: 22, paddingTop: 28 },
  pFeatRow: { flexDirection: 'row', alignItems: 'flex-start' },
  pFeatIcon: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
  pBullet: { width: 8, height: 8, borderRadius: 2, marginTop: 5 },

  pCurImgFrame: { marginTop: 20, borderRadius: 18, overflow: 'hidden', height: 200, backgroundColor: C.border },
  pCurImg: { width: '100%', height: '100%' },

  pGradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  pGradeChip: { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, borderWidth: 1.5 },
  pGradeOn: { backgroundColor: '#fff', borderColor: C.ink },
  pGradeOff: { backgroundColor: C.headerBg, borderColor: 'transparent' },

  pExerciseWrap: { marginTop: 26, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  pExerciseBack: { position: 'absolute', width: 220, height: 210, borderRadius: 26, backgroundColor: '#CDEBFA', transform: [{ rotate: '-5deg' }] },
  pExerciseCard: { width: 230, height: 210, borderRadius: 24, backgroundColor: '#EAF7FE', alignItems: 'center', justifyContent: 'center' },

  pTopicRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.hair },
  pTopicNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.headerBg, alignItems: 'center', justifyContent: 'center' },

  pCurLink: { alignSelf: 'center', marginTop: 22, marginBottom: 4 },
  pCurLinkTxt: { textDecorationLine: 'underline' },

  // 360° approach section
  p360Card: { backgroundColor: '#FBF0DA', borderRadius: 22, marginHorizontal: 18, marginTop: 30, paddingTop: 26, paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' },
  p360Stage: { height: 262, marginTop: 18, justifyContent: 'center', alignItems: 'center' },
  p360Circle: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: '#F5A623', top: 26, left: '50%', marginLeft: -105 },
  p360Orbit: { position: 'absolute', width: 250, height: 250, top: 6, left: '50%', marginLeft: -125 },
  p360Badge: { position: 'absolute', top: 40, left: '50%', marginLeft: -120, width: 54, height: 54, borderRadius: 27, backgroundColor: '#F0501E', alignItems: 'center', justifyContent: 'center' },

  lapWrap: { alignItems: 'center' },
  lapScreen: { width: 156, height: 96, backgroundColor: '#12202B', borderRadius: 9, padding: 6 },
  lapInner: { flex: 1, backgroundColor: '#fff', borderRadius: 4, overflow: 'hidden' },
  lapBar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, height: 15, borderBottomWidth: 1, borderBottomColor: '#EEF0F3' },
  lapDot: { width: 5, height: 5, borderRadius: 3 },
  lapCharts: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  lapBase: { width: 182, height: 9, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: '#C9CDD6', marginTop: 2 },

  pCtaBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, backgroundColor: 'rgba(246,246,247,0.96)', borderTopWidth: 1, borderTopColor: C.border },
  pCta: { backgroundColor: '#F9B234', borderRadius: 30, paddingVertical: 17, alignItems: 'center', shadowColor: '#C98A12', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  pPager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12 },
  pPagerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  pPagerOn: { width: 18, backgroundColor: C.gold },

  // Method slider cards
  mCard: { borderRadius: 22, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 18, minHeight: 240 },
  mStep: { flexDirection: 'row', alignItems: 'center' },
  mStepDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#00000030', shadowOpacity: 0.5, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  mStepLine: { flex: 1, height: 2, marginHorizontal: 8 },
  mStepNext: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  mDots: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 20 },
  mDot: { width: 6, height: 6, borderRadius: 3 },

  footDivider: { height: 1, backgroundColor: C.border, marginVertical: 18 },
  socialRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  socialTile: { width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },

  teaser: { height: 330, padding: 18, justifyContent: 'space-between' },
  teaserBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 13, alignItems: 'center', alignSelf: 'stretch' },
  mHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  mBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
