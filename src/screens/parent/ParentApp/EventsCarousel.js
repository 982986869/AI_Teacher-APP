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
  Linking, LayoutAnimation, Platform, UIManager, Modal, SafeAreaView, Animated, Easing, ActivityIndicator, TextInput,
} from 'react-native';
import { Star, Plus, Minus, Play, Globe, MapPin, Smartphone, Calendar, Clock, Ticket, ExternalLink, ChevronLeft, ChevronDown, Check, Users, TrendingUp, Video, BookOpen, Award } from 'lucide-react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Path, Rect as SvgRect, Circle, Polygon, G } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Video as AVVideo, ResizeMode } from 'expo-av';   // `Video` is taken by the lucide icon
import { C, T, CONTENT, Wordmark } from './constants';
import { PressableScale, FadeIn, PopIn, CountUp } from './anim';

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
// One wedge of a pie, from angle a0 to a1 (radians), centered on (cx,cy).
function pieWedge(cx, cy, r, a0, a1) {
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${cx} ${cy} L${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}
// A circle split into `n` equal wedges; the first `filled` are solid, the rest faint.
function FractionPie({ n, filled = 0, color, size = 40 }) {
  const r = size / 2 - 1.5, c = size / 2;
  return (
    <Svg width={size} height={size}>
      {Array.from({ length: n }).map((_, i) => {
        const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
        const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
        return <Path key={i} d={pieWedge(c, c, r, a0, a1)} fill={i < filled ? color : color + '22'} stroke="#fff" strokeWidth="1.1" />;
      })}
    </Svg>
  );
}

/* ── "How our classes work" — an animated 1-on-1 session ───────────────────────
   Original artwork, not footage. Deliberately abstract (initialled avatars, no faces):
   it shows the SHAPE of a session — tutor and child live, a problem worked a step at a
   time, a doubt raised and answered — without implying any real child is pictured. A real
   recorded session in `classVideo.uri` takes priority over this.                       */
const CE_STEP_AT = [0.12, 0.40, 0.60];
const CE_ACCENT = ['#8B5CF6', '#3B9EFF', '#12B36A'];
function ClassExplainer({ heading, ask, reply, steps = [] }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 6200, easing: Easing.linear, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(t, { toValue: 0, duration: 600, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.delay(300),
    ]));
    loop.start();
    return () => loop.stop();
  }, [t]);

  const win = (a, b, from, to) => t.interpolate({ inputRange: [a, b], outputRange: [from, to], extrapolate: 'clamp' });
  const livePulse = t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 0.3, 1, 0.3, 1] });

  return (
    <View style={s.ceSection}>
      {!!heading && <T w="xbold" s={24} c={C.ink} style={{ textAlign: 'center', lineHeight: 31 }}>{heading}</T>}
      <View style={s.ceCard}>
        {/* Who's in the room. */}
        <View style={s.ceBar}>
          <View style={s.ceWho}>
            <View style={[s.ceAvatar, { backgroundColor: '#F5B301' }]}><T w="xbold" s={10.5} c="#14151B">T</T></View>
            <T w="semi" s={11} c="rgba(255,255,255,0.82)">Tutor</T>
          </View>
          <View style={s.ceWho}>
            <View style={[s.ceAvatar, { backgroundColor: '#3B9EFF' }]}><T w="xbold" s={10.5} c="#fff">C</T></View>
            <T w="semi" s={11} c="rgba(255,255,255,0.82)">Your child</T>
          </View>
          <View style={{ flex: 1 }} />
          <View style={s.ceLive}>
            <Animated.View style={[s.ceLiveDot, { opacity: livePulse }]} />
            <T w="bold" s={8.5} c="#fff" style={{ letterSpacing: 0.5 }}>LIVE</T>
          </View>
        </View>

        {/* Shared board — one step at a time. */}
        <View style={s.ceBoard}>
          {steps.slice(0, 3).map((st, i) => (
            <Animated.View key={st} style={[s.ceStepRow, {
              opacity: win(CE_STEP_AT[i], CE_STEP_AT[i] + 0.09, 0, 1),
              transform: [{ translateY: win(CE_STEP_AT[i], CE_STEP_AT[i] + 0.09, 8, 0) }],
            }]}>
              <View style={[s.ceStepBar, { backgroundColor: CE_ACCENT[i % CE_ACCENT.length] }]} />
              <T w="xbold" s={16} c={C.ink}>{st}</T>
              {i === steps.slice(0, 3).length - 1 && (
                <Animated.View style={{ opacity: win(0.82, 0.9, 0, 1), transform: [{ scale: win(0.82, 0.9, 0.4, 1) }] }}>
                  <Check size={16} color="#12B36A" strokeWidth={3.4} />
                </Animated.View>
              )}
            </Animated.View>
          ))}
        </View>

        {/* The doubt, then the answer — the bit a recorded lecture can't do. */}
        {!!ask && (
          <Animated.View style={[s.ceBubble, { opacity: win(0.24, 0.33, 0, 1), transform: [{ translateY: win(0.24, 0.33, 6, 0) }] }]}>
            <T w="semi" s={11.5} c="rgba(255,255,255,0.92)">{ask}</T>
          </Animated.View>
        )}
        {!!reply && (
          <Animated.View style={[s.ceBubble, s.ceReply, { opacity: win(0.7, 0.79, 0, 1), transform: [{ translateY: win(0.7, 0.79, 6, 0) }] }]}>
            <T w="semi" s={11.5} c="#14151B">{reply}</T>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

/* ── Grades 6–8 curriculum visual — a balance settling to solve x + ? = ? ───── */
// The beam swings and damps to level; the answer lands once it settles. Keyframes carry
// the damping, so the driving timing stays linear.
const BAL_IN = [0, 0.28, 0.52, 0.74, 1];
function AlgebraBalance() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true }),
      Animated.delay(1700),
      Animated.timing(t, { toValue: 0, duration: 600, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.delay(400),
    ]));
    loop.start();
    return () => loop.stop();
  }, [t]);

  const rotate = t.interpolate({ inputRange: BAL_IN, outputRange: ['-9deg', '6deg', '-3.5deg', '1.5deg', '0deg'] });
  // Counter-rotates the pans so the tiles stay upright while the beam swings.
  const counter = t.interpolate({ inputRange: BAL_IN, outputRange: ['9deg', '-6deg', '3.5deg', '-1.5deg', '0deg'] });
  const ansO = t.interpolate({ inputRange: [0.82, 0.95], outputRange: [0, 1], extrapolate: 'clamp' });
  const ansS = t.interpolate({ inputRange: [0.82, 0.95], outputRange: [0.6, 1], extrapolate: 'clamp' });

  return (
    <View style={s.balStage}>
      <View style={s.balWrap}>
        <Animated.View style={[s.balBeam, { transform: [{ rotate }] }]}>
          <Animated.View style={[s.balSide, { left: 2, transform: [{ rotate: counter }] }]}>
            <View style={[s.balTile, { width: 32, height: 32, backgroundColor: '#8B5CF6' }]}>
              <T w="xbold" s={15} c="#fff">x</T>
            </View>
            <View style={s.balPlate} />
          </Animated.View>
          <Animated.View style={[s.balSide, { right: 2, transform: [{ rotate: counter }] }]}>
            <View style={{ flexDirection: 'row', gap: 3 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[s.balTile, { width: 14, height: 24, backgroundColor: '#F5B301' }]} />
              ))}
            </View>
            <View style={s.balPlate} />
          </Animated.View>
        </Animated.View>
        <View style={s.balFulcrum} />
      </View>
      <Animated.View style={{ opacity: ansO, transform: [{ scale: ansS }], marginTop: 6 }}>
        <T w="xbold" s={16} c={C.ink}>x = 3</T>
      </Animated.View>
    </View>
  );
}

/* ── Grades K–2 curriculum visual — abacus beads slide across, counting ─────── */
const ABACUS_ROWS = ['#E4572E', '#F5B301', '#12924B', '#3B82C4'];
const ABACUS = { beads: 5, step: 19, travel: 62, rod: 26, frameW: 172, frameH: 132, bd: 7 };
function AbacusCount() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      // Linear out so each bead's stagger window stays evenly spaced.
      Animated.timing(t, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }),
      Animated.delay(1300),
      Animated.timing(t, { toValue: 0, duration: 800, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.delay(400),
    ]));
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <View style={s.abStage}>
      <View style={s.abFrame}>
        {ABACUS_ROWS.map((color, r) => (
          <View key={color} style={[s.abRodWrap, { top: 12 + r * ABACUS.rod }]}>
            <View style={s.abRod} />
            {Array.from({ length: ABACUS.beads }).map((_, i) => {
              const s0 = 0.04 + r * 0.17 + i * 0.028;
              return (
                <Animated.View key={i} style={[s.abBead, {
                  left: 3 + i * ABACUS.step,
                  backgroundColor: color,
                  transform: [{
                    translateX: t.interpolate({
                      inputRange: [s0, s0 + 0.1], outputRange: [ABACUS.travel, 0], extrapolate: 'clamp',
                    }),
                  }],
                }]} />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

/* ── Grades 3–5 curriculum visual — fraction wedges scatter, then assemble ──── */
const FRAC_COLORS = ['#3E7CB1', '#F0864A', '#EE7B9E', '#5BA8D6', '#F2A65A', '#E5638A'];
function FractionAssemble() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(t, { toValue: 0, duration: 800, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.delay(500),
    ]));
    loop.start();
    return () => loop.stop();
  }, [t]);

  const N = 6, R = 52, SPREAD = 26, BOX = R * 2;
  return (
    <View style={s.fracStage}>
      {Array.from({ length: N }).map((_, i) => {
        const mid = ((i + 0.5) / N) * 2 * Math.PI - Math.PI / 2;
        const a0 = (i / N) * 2 * Math.PI - Math.PI / 2;
        const a1 = ((i + 1) / N) * 2 * Math.PI - Math.PI / 2;
        // 0 → scattered outward along the wedge's own bearing, 1 → seated in the circle.
        const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [Math.cos(mid) * SPREAD, 0] });
        const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [Math.sin(mid) * SPREAD, 0] });
        const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });
        return (
          <Animated.View key={i} style={[s.fracWedge, { width: BOX, height: BOX, marginLeft: -R, marginTop: -R, transform: [{ translateX }, { translateY }, { scale }] }]}>
            <Svg width={BOX} height={BOX}>
              <Path d={pieWedge(R, R, R - 3, a0, a1)} fill={FRAC_COLORS[i % FRAC_COLORS.length]} stroke="#FBF3E4" strokeWidth="1.5" />
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
}

/* ── Grades 3–5 synced visual — factor blocks arrive in parts, then join up ──── */
const FACTOR_TOTAL = 6;
const FACTOR_ROWS = [
  { label: '6', unit: 6, count: 1, color: '#7C3AED' },   // the whole
  { label: '1', unit: 1, count: 6, color: '#EC7FD0' },   // 1 × 6 → factor
  { label: '2', unit: 2, count: 3, color: '#5AA9E6' },   // 2 × 3 → factor
  { label: '4', unit: 4, count: 1, color: '#F7A072' },   // 4 doesn't divide 6 → no tick
];
function FactorBlocks({ caption }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      // Linear on the way out so the per-block stagger windows stay evenly spaced.
      Animated.timing(t, { toValue: 1, duration: 3400, easing: Easing.linear, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(t, { toValue: 0, duration: 700, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.delay(400),
    ]));
    loop.start();
    return () => loop.stop();
  }, [t]);

  const UNIT = 24, GAP = 3;
  const win = (a, b, from, to) => t.interpolate({ inputRange: [a, b], outputRange: [from, to], extrapolate: 'clamp' });
  return (
    <View style={s.facCard}>
      {FACTOR_ROWS.map((row, r) => {
        const fits = row.unit * row.count === FACTOR_TOTAL;
        const start = 0.04 + r * 0.12;
        return (
          <View key={row.label} style={s.facRow}>
            <T w="xbold" s={11.5} c={C.muted} style={{ width: 13 }}>{row.label}</T>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {Array.from({ length: row.count }).map((_, i) => (
                <Animated.View key={i} style={{
                  width: row.unit * UNIT - GAP, height: 21, borderRadius: 3, marginRight: GAP,
                  backgroundColor: row.color,
                  opacity: win(start + i * 0.035, start + i * 0.035 + 0.07, 0, 1),
                  transform: [
                    { scale: win(start + i * 0.035, start + i * 0.035 + 0.07, 0.5, 1) },
                    { translateX: win(0.64, 0.8, 0, -i * GAP) },   // gaps close → one solid box
                  ],
                }} />
              ))}
              {fits && (
                <Animated.View style={{
                  marginLeft: 9,
                  opacity: win(0.82, 0.92, 0, 1),
                  transform: [{ scale: win(0.82, 0.92, 0.4, 1) }],
                }}>
                  <Check size={16} color="#12B36A" strokeWidth={3.4} />
                </Animated.View>
              )}
            </View>
          </View>
        );
      })}
      {!!caption && <T w="semi" s={10.5} c={C.muted} style={{ marginTop: 12 }}>{caption}</T>}
    </View>
  );
}

// 360° approach — an orange circle with a laptop whose on-screen charts spin, plus a
// pale swoosh that orbits the circle. Cuemath-style animated hero.
// Orbit ring — a tilted ellipse precomputed once. A back arc drawn behind the circle and
// a front arc drawn over it give the ring its "wraps around" look; a bead orbits along it.
const ORBIT = (() => {
  const cx = 125, cy = 145, rx = 126, ry = 46, t = -16 * Math.PI / 180;
  const ct = Math.cos(t), st = Math.sin(t);
  const at = (th) => { const ex = rx * Math.cos(th), ey = ry * Math.sin(th); return [cx + ex * ct - ey * st, cy + ex * st + ey * ct]; };
  const arc = (a, b, n) => { let d = ''; for (let i = 0; i <= n; i++) { const [x, y] = at(a + (b - a) * i / n); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } return d; };
  const N = 60, inp = [], bx = [], by = [];
  for (let i = 0; i <= N; i++) { const [x, y] = at(2 * Math.PI * i / N); inp.push(i / N); bx.push(+x.toFixed(1)); by.push(+y.toFixed(1)); }
  return { front: arc(0, Math.PI, 30), back: arc(Math.PI, 2 * Math.PI, 30), inp, bx, by };
})();

function Approach360({ title, body }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const beadX = spin.interpolate({ inputRange: ORBIT.inp, outputRange: ORBIT.bx });
  const beadY = spin.interpolate({ inputRange: ORBIT.inp, outputRange: ORBIT.by });
  const knobX = spin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 118, 0] });

  return (
    <View style={s.p360Card}>
      {!!title && <T w="xbold" s={24} c="#3A2205" style={{ textAlign: 'center', lineHeight: 31 }}>{title}</T>}
      {!!body && <T w="semi" s={13} c="#8A6A2E" style={{ textAlign: 'center', lineHeight: 19, marginTop: 8 }}>{body}</T>}

      <View style={s.p360Stage}>
        <View style={s.p360Box}>
          {/* Ring — back half, behind the circle. */}
          <Svg width={250} height={262} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path d={ORBIT.back} fill="none" stroke="#EBC24C" strokeWidth="7" strokeLinecap="round" opacity={0.45} />
          </Svg>

          <View style={s.p360Circle} />

          {/* Ring — front half, over the circle. */}
          <Svg width={250} height={262} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path d={ORBIT.front} fill="none" stroke="#FBD24E" strokeWidth="7" strokeLinecap="round" />
          </Svg>

          {/* Laptop teaching fractions — a third split into twelfths. */}
          <View style={s.lapAbs}>
            <View style={s.lapWrap}>
              <View style={s.lapScreen}>
                <View style={s.lapInner}>
                  <View style={s.lapBar}>
                    <View style={[s.lapDot, { backgroundColor: '#F0501E' }]} />
                    <View style={[s.lapDot, { backgroundColor: '#F5B301' }]} />
                    <View style={[s.lapDot, { backgroundColor: '#12924B' }]} />
                  </View>
                  <View style={s.lapBody}>
                    <View style={s.eqRow}>
                      <View style={s.eqChip}><T w="xbold" s={9.5} c="#7C3AED">3</T></View>
                      <T w="bold" s={10} c="#5B6472">× 4  =</T>
                      <View style={[s.eqChip, { backgroundColor: '#D6F7EC' }]}><T w="xbold" s={9.5} c="#0E9F92">12</T></View>
                    </View>
                    <View style={s.pieRow}>
                      <FractionPie n={3} filled={1} color="#8B5CF6" size={42} />
                      <View>
                        <FractionPie n={12} filled={0} color="#12B3A6" size={42} />
                        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
                          <Svg width={42} height={42}>
                            <Path d={pieWedge(21, 21, 19.5, -Math.PI / 2, -Math.PI / 2 + Math.PI / 6)} fill="#0E9F92" />
                          </Svg>
                        </Animated.View>
                      </View>
                    </View>
                    <View style={s.sliderRow}>
                      <View style={s.sliderTrack} />
                      <View style={s.sliderFill} />
                      <Animated.View style={[s.sliderKnob, { transform: [{ translateX: knobX }] }]} />
                    </View>
                  </View>
                </View>
              </View>
              <View style={s.lapBase} />
            </View>
          </View>

          <View style={s.p360Badge}>
            <T w="xbold" s={13} c="#fff">360°</T>
            <T w="bold" s={8.5} c="rgba(255,255,255,0.9)" style={{ letterSpacing: 0.5 }}>MATHS</T>
          </View>

          <Animated.View style={[s.orbitBead, { transform: [{ translateX: beadX }, { translateY: beadY }] }]} pointerEvents="none" />
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
export function BecomePage({ E, onAbout, onImpact, onTutors, onReviews, onPricing, onFaqs, onContact, onRefund, onReferral, onOpenProgram }) {
  const bc = E.become;
  const ft = E.footer;
  const [openIdx, setOpenIdx] = useState(-1);
  const [blogsOpen, setBlogsOpen] = useState(false);
  const [subjOpen, setSubjOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const toggle = (i) => { spring(); setOpenIdx((o) => (o === i ? -1 : i)); };
  const tapItem = (it) => {
    if (it.program) return onOpenProgram && onOpenProgram(it.program);
    if (it.action === 'about') return onAbout && onAbout();
    if (it.action === 'impact') return onImpact && onImpact();
    if (it.action === 'tutors') return onTutors && onTutors();
    // Each of these opens the in-app page where the host wired one up, and otherwise
    // falls back to the matching page on the website — so a link never dead-ends.
    if (it.action === 'reviews') return onReviews ? onReviews() : open(it.url);
    if (it.action === 'pricing') return onPricing ? onPricing() : open(it.url);
    if (it.action === 'faqs') return onFaqs ? onFaqs() : open(it.url);
    if (it.action === 'contact') return onContact ? onContact() : open(it.url);
    if (it.action === 'refund') return onRefund ? onRefund() : open(it.url);
    if (it.action === 'referral') return onReferral ? onReferral() : open(it.url);
    if (it.action === 'blogs') return setBlogsOpen(true);
    if (it.action === 'subjects') return setSubjOpen(true);
    if (it.action === 'becometutor') return setTutorOpen(true);
    return open(it.url);
  };
  return (
    <>
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
              <View style={s.catCircle}>
                {c.Icon ? <c.Icon size={24} color={c.color || '#fff'} strokeWidth={2.2} /> : <T s={22}>{c.emoji}</T>}
              </View>
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
    <BlogsScreen visible={blogsOpen} onClose={() => setBlogsOpen(false)} data={E.blogs} />
    <SubjectPicker visible={subjOpen} onClose={() => setSubjOpen(false)} data={E.subjects} />
    <BecomeTutorScreen visible={tutorOpen} onClose={() => setTutorOpen(false)} data={E.becomeTutor} />
    </>
  );
}

// In-app Blog — a card list; tapping a card opens the full article in a reader (both
// live in this one modal). Content comes from CONTENT.event.blogs.
function BlogsScreen({ visible, onClose, data }) {
  const [active, setActive] = useState(null);
  if (!data) return null;
  const close = () => { setActive(null); onClose && onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={active ? () => setActive(null) : close}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F7' }}>
        <GridBg />
        <View style={s.mHead}>
          <PressableScale onPress={active ? () => setActive(null) : close} style={s.mBack}><ChevronLeft size={24} color={C.ink} /></PressableScale>
          <T w="bold" s={16} c={C.ink}>{active ? 'Article' : 'Blog'}</T><View style={{ width: 40 }} />
        </View>

        {active ? (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <View style={[s.blogHero, { backgroundColor: active.tint }]}>
              <View style={s.blogTag}><T w="xbold" s={10} c={active.tint} style={{ letterSpacing: 0.4 }}>{active.category}</T></View>
            </View>
            <FadeIn delay={40} y={14} style={{ paddingHorizontal: 20, paddingTop: 18 }}>
              <T w="xbold" s={23} c={C.ink} style={{ lineHeight: 30 }}>{active.title}</T>
              <View style={s.blogFoot}>
                <Clock size={13} color={C.faint} /><T w="bold" s={11.5} c={C.faint}>{active.read}</T>
                <T w="bold" s={11.5} c={C.faint}>· Ailernova</T>
              </View>
              <View style={{ marginTop: 16, gap: 14 }}>
                {(active.body || [active.excerpt]).map((para, i) => (
                  <T key={i} w="reg" s={14.5} c={C.ink} style={{ lineHeight: 23 }}>{para}</T>
                ))}
              </View>
            </FadeIn>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            <T w="xbold" s={24} c={C.ink} style={{ lineHeight: 30 }}>{data.title}</T>
            {!!data.subtitle && <T w="med" s={13} c={C.muted} style={{ marginTop: 6, lineHeight: 19 }}>{data.subtitle}</T>}
            <View style={{ marginTop: 18, gap: 14 }}>
              {(data.posts || []).map((p, i) => (
                <FadeIn key={p.id} delay={i * 60}>
                  <PressableScale style={s.blogCard} onPress={() => setActive(p)} accessibilityRole="button" accessibilityLabel={p.title}>
                    <View style={[s.blogBand, { backgroundColor: p.tint }]}>
                      <BookOpen size={30} color="#fff" strokeWidth={2} />
                      <View style={s.blogTag}><T w="xbold" s={9.5} c={p.tint} style={{ letterSpacing: 0.4 }}>{p.category}</T></View>
                    </View>
                    <View style={{ padding: 16 }}>
                      <T w="xbold" s={16} c={C.ink} style={{ lineHeight: 22 }}>{p.title}</T>
                      {!!p.excerpt && <T w="med" s={12.5} c={C.muted} numberOfLines={3} style={{ marginTop: 7, lineHeight: 18 }}>{p.excerpt}</T>}
                      <View style={s.blogFoot}>
                        <Clock size={13} color={C.faint} />
                        <T w="bold" s={11} c={C.faint}>{p.read}</T>
                        <View style={{ flex: 1 }} />
                        <T w="bold" s={12} c={p.tint}>Read →</T>
                      </View>
                    </View>
                  </PressableScale>
                </FadeIn>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// "Become a Tutor" — full-screen landing + apply form. Submit composes a WhatsApp
// application to the Ailernova line with the entered details (real, backend-free).
const TUTOR_ICON = { clock: Clock, remote: Smartphone, earn: TrendingUp, impact: Award };
function BecomeTutorScreen({ visible, onClose, data }) {
  const [f, setF] = useState({ name: '', mobile: '', subject: '', qual: '' });
  const [done, setDone] = useState(false);
  if (!data) return null;
  const set = (patch) => setF((p) => ({ ...p, ...patch }));
  const valid = f.name.trim() && f.mobile.replace(/\D/g, '').length >= 10 && f.subject.trim();
  const close = () => { onClose && onClose(); setTimeout(() => { setDone(false); setF({ name: '', mobile: '', subject: '', qual: '' }); }, 250); };
  const submit = () => {
    const msg = `Hi Ailernova, I'd like to apply to become a tutor.%0A%0AName: ${encodeURIComponent(f.name)}%0AMobile: ${encodeURIComponent(f.mobile)}%0ASubject(s): ${encodeURIComponent(f.subject)}%0AQualification: ${encodeURIComponent(f.qual || '—')}`;
    open(`https://wa.me/${data.waNumber}?text=${msg}`);
    setDone(true);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F7' }}>
        <GridBg />
        <View style={s.mHead}>
          <PressableScale onPress={close} style={s.mBack}><ChevronLeft size={24} color={C.ink} /></PressableScale>
          <T w="bold" s={16} c={C.ink}>Become a Tutor</T><View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <FadeIn delay={0}>
            <View style={s.btHero}>
              {!!data.eyebrow && <T w="bold" s={11} c={C.orange} style={{ letterSpacing: 0.8 }}>{data.eyebrow}</T>}
              <T w="xbold" s={27} c={C.ink} style={{ lineHeight: 34, marginTop: 8 }}>{data.title}</T>
              {!!data.subtitle && <T w="med" s={13.5} c={C.muted} style={{ lineHeight: 21, marginTop: 12 }}>{data.subtitle}</T>}
            </View>
          </FadeIn>

          {/* Benefits — 2×2 */}
          <View style={s.btGrid}>
            {(data.benefits || []).map((b, i) => {
              const Icon = TUTOR_ICON[b.icon] || Award;
              return (
                <PopIn key={b.title} delay={120 + i * 70} style={{ width: '47%' }}>
                  <View style={[s.btCard, { width: '100%' }]}>
                    <View style={[s.btIcon, { backgroundColor: b.bg }]}><Icon size={22} color={b.tint} strokeWidth={2.3} /></View>
                    <T w="xbold" s={14} c={C.ink} style={{ marginTop: 12 }}>{b.title}</T>
                    <T w="med" s={11.5} c={C.muted} style={{ marginTop: 5, lineHeight: 16 }}>{b.body}</T>
                  </View>
                </PopIn>
              );
            })}
          </View>

          {/* How it works */}
          {!!data.steps?.length && (
            <FadeIn delay={200} y={16}>
              <View style={s.btSteps}>
                <T w="xbold" s={19} c={C.ink}>{data.stepsTitle}</T>
                <View style={{ marginTop: 16, gap: 16 }}>
                  {data.steps.map((st, i) => (
                    <View key={st} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={s.btStepNum}><T w="xbold" s={14} c="#fff">{i + 1}</T></View>
                      <T w="semi" s={14} c={C.ink} style={{ flex: 1 }}>{st}</T>
                    </View>
                  ))}
                </View>
              </View>
            </FadeIn>
          )}

          {/* Apply form */}
          <FadeIn delay={260} y={16} style={s.btForm}>
            <T w="xbold" s={19} c={C.ink}>{data.formTitle}</T>
            {done ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={s.tbTick}><FontAwesome6 name="check" size={28} color="#fff" /></View>
                <T w="xbold" s={18} c={C.ink} style={{ marginTop: 16, textAlign: 'center' }}>Application opened!</T>
                <T w="med" s={13} c={C.muted} style={{ marginTop: 8, textAlign: 'center', lineHeight: 20 }}>Send the pre-filled WhatsApp message and our team will get back to you.</T>
              </View>
            ) : (
              <>
                <Field label="YOUR NAME" value={f.name} onChangeText={(t) => set({ name: t })} />
                <Field label="MOBILE NUMBER" value={f.mobile} onChangeText={(t) => set({ mobile: t })} keyboardType="phone-pad" />
                <Field label="SUBJECT(S) YOU TEACH" value={f.subject} onChangeText={(t) => set({ subject: t })} />
                <Field label="QUALIFICATION (OPTIONAL)" value={f.qual} onChangeText={(t) => set({ qual: t })} />
                <PressableScale disabled={!valid} style={[valid ? s.tbBtnOn : s.tbBtnOff, { marginTop: 22 }]} onPress={valid ? submit : undefined}>
                  <T w="bold" s={15.5} c={valid ? C.ink : '#9AA0AA'}>{data.cta}</T>
                </PressableScale>
              </>
            )}
          </FadeIn>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// "Study by Subject" — a bottom-sheet pop-form. Picking a subject opens its resource hub.
function SubjectPicker({ visible, onClose, data }) {
  const scrim = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(340)).current;   // slides up from below
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scrim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 220, mass: 0.9 }),
      ]).start();
    } else { scrim.setValue(0); sheetY.setValue(340); }
  }, [visible, scrim, sheetY]);
  if (!data) return null;
  const pick = (it) => { onClose && onClose(); setTimeout(() => open(it.url), 150); };
  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <PressableScale style={StyleSheet.absoluteFill} onPress={onClose} scaleTo={1}>
        <Animated.View style={[s.sheetScrim, { opacity: scrim }]} />
      </PressableScale>
      <Animated.View style={[s.sheet, { transform: [{ translateY: sheetY }] }]}>
        <View style={s.sheetGrab} />
        <T w="xbold" s={19} c={C.ink} style={{ marginTop: 6 }}>{data.title}</T>
        {!!data.subtitle && <T w="med" s={12.5} c={C.muted} style={{ marginTop: 5, lineHeight: 18 }}>{data.subtitle}</T>}
        <View style={s.subjGrid}>
          {(data.items || []).map((it, i) => (
            <PopIn key={it.label} delay={120 + i * 55} style={{ width: '47%' }}>
              <PressableScale style={[s.subjChip, { width: '100%', borderColor: it.tint + '55', backgroundColor: it.tint + '12' }]} onPress={() => pick(it)}>
                <T s={19} style={{ width: 24, textAlign: 'center' }}>{it.emoji}</T>
                <T w="bold" s={13} c={C.ink} numberOfLines={1} style={{ flex: 1 }}>{it.label}</T>
              </PressableScale>
            </PopIn>
          ))}
        </View>
        <PressableScale style={s.sheetClose} onPress={onClose}><T w="bold" s={14} c={C.muted}>Cancel</T></PressableScale>
      </Animated.View>
    </Modal>
  );
}

/* ── Program detail page (opened from "Our Programs" → a class) ─────────────── */
const BULLET_COLORS = ['#8B5CF6', '#12924B', '#F0501E'];

// Feature-badge icons, keyed by the `icon` field on each feature in constants.
const FEAT_ICON = { users: Users, trend: TrendingUp, video: Video, book: BookOpen, award: Award };

function FeatureRow({ f }) {
  const Icon = FEAT_ICON[f.icon] || Users;
  return (
    <View style={s.pFeatRow}>
      <View style={{ flex: 1, paddingRight: 14 }}>
        <T w="xbold" s={16.5} c={C.ink} style={{ lineHeight: 22 }}>{f.title}</T>
        <View style={{ marginTop: 11, gap: 8 }}>
          {f.bullets.map((b, i) => {
            const color = BULLET_COLORS[i % BULLET_COLORS.length];
            // Cuemath marker sequence: purple dot · green dot · red triangle.
            return (
              <View key={b} style={s.pFeatBulletRow}>
                {i % BULLET_COLORS.length === 2
                  ? <View style={[s.pBulletTri, { borderBottomColor: color }]} />
                  : <View style={[s.pBulletDot, { backgroundColor: color }]} />}
                <T w="med" s={12.5} c={C.muted} style={{ flex: 1, lineHeight: 17 }}>{b}</T>
              </View>
            );
          })}
        </View>
      </View>
      <View style={[s.pFeatIcon, { backgroundColor: f.bg }]}><Icon size={27} color={f.tint} strokeWidth={2.1} /></View>
    </View>
  );
}

// Fixed starfield for the dark principle cards (percent coords) — precomputed so the
// dots don't jump around between renders.
const PR_STARS = [
  { x: 12, y: 14, o: 0.7 }, { x: 28, y: 30, o: 0.4 }, { x: 46, y: 10, o: 0.6 }, { x: 66, y: 22, o: 0.35 },
  { x: 82, y: 12, o: 0.8 }, { x: 90, y: 34, o: 0.45 }, { x: 8, y: 44, o: 0.5 }, { x: 34, y: 52, o: 0.3 },
  { x: 74, y: 46, o: 0.55 }, { x: 20, y: 66, o: 0.4 }, { x: 52, y: 72, o: 0.3 }, { x: 88, y: 64, o: 0.5 },
  { x: 40, y: 88, o: 0.35 }, { x: 14, y: 84, o: 0.6 }, { x: 62, y: 92, o: 0.4 }, { x: 78, y: 82, o: 0.3 },
];
// Original space motif — a small planet with a highlight and a dashed orbit arc.
function OrbitArt({ color }) {
  return (
    <Svg width={150} height={104} viewBox="0 0 150 104">
      <Path d="M14 92 A72 34 0 0 0 148 52" fill="none" stroke={color} strokeOpacity={0.55} strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" />
      <Circle cx="112" cy="82" r="38" fill={color} opacity={0.92} />
      <Circle cx="99" cy="68" r="6.5" fill="#FFFFFF" opacity={0.85} />
      <Circle cx="126" cy="92" r="3.5" fill="#0E0F14" opacity={0.35} />
    </Svg>
  );
}
// Horizontally-scrollable dark cards on why the teaching works. Peeks the next card.
function PrinciplesCarousel({ heading, sub, cards }) {
  const CARD_W = Math.round(SCREEN_W * 0.72);
  return (
    <View style={s.prSection}>
      <T w="xbold" s={24} c={C.ink} style={{ lineHeight: 31 }}>{heading}</T>
      {!!sub && <T w="med" s={13.5} c={C.muted} style={{ marginTop: 8, lineHeight: 20, paddingRight: 22 }}>{sub}</T>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={CARD_W + 14}
        decelerationRate="fast" contentContainerStyle={s.prScroll}>
        {cards.map((c) => (
          <View key={c.title} style={[s.prCard, { width: CARD_W }]}>
            {PR_STARS.map((st, k) => (
              <View key={k} style={[s.prStar, { left: `${st.x}%`, top: `${st.y}%`, opacity: st.o }]} />
            ))}
            <T w="xbold" s={19} c={c.tint} style={{ lineHeight: 24 }}>{c.title}</T>
            <T w="med" s={12.5} c="rgba(255,255,255,0.72)" style={{ marginTop: 10, lineHeight: 18 }}>{c.body}</T>
            <View style={s.prArt}><OrbitArt color={c.tint} /></View>
          </View>
        ))}
      </ScrollView>
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

// Astronaut riding a rocket — drifts in a slow figure-of-eight with a flickering
// booster. Original artwork; all transforms run on the native driver.
function JoinRocket() {
  const float = useRef(new Animated.Value(0)).current;
  const flick = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const mk = (v, d) => Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: d, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: d, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    const a = mk(float, 2300), b = mk(flick, 240);
    a.start(); b.start();
    return () => { a.stop(); b.stop(); };
  }, [float, flick]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [10, -12] });
  const translateX = float.interpolate({ inputRange: [0, 1], outputRange: [-7, 7] });
  const rotate = float.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });
  const flameScale = flick.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.18] });

  return (
    <Animated.View style={{ transform: [{ translateX }, { translateY }, { rotate }] }}>
      <Svg width={200} height={180} viewBox="0 0 200 180">
        <G transform="rotate(-32 100 100)">
          {/* booster flame */}
          <AnimatedPolygon points="46,88 46,112 4,100" fill="#F58A1B" opacity={0.95}
            origin="46,100" style={{ transform: [{ scaleX: flameScale }] }} />
          <AnimatedPolygon points="46,93 46,107 22,100" fill="#FFD34E"
            origin="46,100" style={{ transform: [{ scaleX: flameScale }] }} />
          {/* fins */}
          <Polygon points="74,82 58,58 52,88" fill="#1F9DBE" />
          <Polygon points="74,118 58,142 52,112" fill="#1F9DBE" />
          {/* body + nose */}
          <Path d="M46 100 C46 84 66 74 96 74 C126 74 152 88 160 100 C152 112 126 126 96 126 C66 126 46 116 46 100 Z" fill="#3FC5E8" />
          <Path d="M132 79 C146 85 156 93 160 100 C156 107 146 115 132 121 Z" fill="#2FB2D6" />
          {/* porthole */}
          <Circle cx="112" cy="100" r="10" fill="#EAF9FF" stroke="#1F9DBE" strokeWidth="2.5" />
          {/* astronaut */}
          <Circle cx="86" cy="60" r="15" fill="#FFFFFF" />
          <Path d="M78 56 C82 51 92 51 95 57 C92 62 82 63 78 56 Z" fill="#2B3440" />
          <Path d="M74 70 C78 78 96 80 100 72" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" fill="none" />
        </G>
      </Svg>
    </Animated.View>
  );
}

// Closing dark panel — starfield, copy, floating rocket, then a moon horizon with the
// journey arc and the first milestone. Rocket + milestone share this one card.
const JA_BAND_W = SCREEN_W - 36;   // card width (page margin 18 each side)
function JoinAnytime({ title, body, step }) {
  if (!title && !body) return null;
  return (
    <View style={s.jaCard}>
      {PR_STARS.map((st, k) => (
        <View key={k} style={[s.prStar, { left: `${st.x}%`, top: `${st.y}%`, opacity: st.o }]} />
      ))}
      {!!title && <T w="xbold" s={25} c="#fff" style={{ lineHeight: 33 }}>{title}</T>}
      {!!body && <T w="med" s={13} c="rgba(255,255,255,0.66)" style={{ lineHeight: 20, marginTop: 12 }}>{body}</T>}

      <View style={s.jaArt}><JoinRocket /></View>

      {/* Moon horizon + the orange journey arc, with milestone 1 sitting on it. */}
      <View style={s.jaBand}>
        <Svg width={JA_BAND_W} height={92} viewBox="0 0 340 92" preserveAspectRatio="none">
          <Path d="M0 60 L34 40 L62 54 L96 28 L132 56 L168 32 L206 54 L242 34 L278 56 L312 42 L340 52 L340 92 L0 92 Z" fill="#8E8E96" />
          <Path d="M0 70 Q170 30 340 70" fill="none" stroke="#F5A623" strokeWidth="4" strokeLinecap="round" />
        </Svg>
        {!!step && <View style={s.jaBadge}><T w="xbold" s={14} c="#fff">{step.n}</T></View>}
      </View>

      {!!step && (
        <>
          <View style={s.jaDot} />
          <View style={s.jaStepCard}>
            {!!step.title && <T w="xbold" s={14.5} c="#fff" style={{ textAlign: 'center', lineHeight: 21 }}>{step.title}</T>}
            <View style={{ marginTop: 14, gap: 9 }}>
              {(step.bullets || []).map((b) => (
                <View key={b} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9 }}>
                  <View style={s.jaBullet} />
                  <T w="med" s={12.5} c="rgba(255,255,255,0.78)" style={{ flex: 1, lineHeight: 18 }}>{b}</T>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// "How our classes work" — a gold band holding Ailernova's own class footage. Starts
// paused behind a play button; tapping plays it with native controls.
function ClassVideo({ heading, uri }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef(null);
  if (!uri) return null;
  return (
    <View style={s.cvSection}>
      {!!heading && <T w="xbold" s={24} c={C.ink} style={{ textAlign: 'center', lineHeight: 31 }}>{heading}</T>}
      <View style={s.cvBand}>
        <View style={s.cvFrame}>
          <AVVideo
            ref={ref}
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            useNativeControls={playing}
            shouldPlay={playing}
            isLooping={false}
            isMuted={false}
          />
          {!playing && (
            <PressableScale style={StyleSheet.absoluteFill} onPress={() => setPlaying(true)} accessibilityRole="button" accessibilityLabel="Play video">
              <View style={s.cvPlayWrap}>
                <View style={s.cvPlay}><Play size={24} color={C.ink} fill={C.ink} /></View>
              </View>
            </PressableScale>
          )}
        </View>
      </View>
    </View>
  );
}

// A full-screen page rendered inside the events modal. Sticky class switcher + CTA;
// the middle scrolls through the stacked sections. Content re-animates on class switch.
/* ── FAQ accordion on the program page ─────────────────────────────────────── */
// Shows the first 4 questions; "See More" expands the rest in place. One row open at a
// time, matching the footer/About accordions.
function ProgramFaq({ title, faqs }) {
  const [openIdx, setOpenIdx] = useState(-1);
  const [showAll, setShowAll] = useState(false);
  if (!faqs || !faqs.length) return null;
  const shown = showAll ? faqs : faqs.slice(0, 4);
  const toggle = (i) => { spring(); setOpenIdx((o) => (o === i ? -1 : i)); };
  return (
    <View style={s.faqSection}>
      <T w="xbold" s={24} c={C.ink} style={{ textAlign: 'center', lineHeight: 31 }}>{title}</T>
      <View style={{ marginTop: 20 }}>
        <View style={s.faqRule} />
        {shown.map((f, i) => (
          <View key={f.q} style={s.faqItem}>
            <PressableScale style={s.faqHead} onPress={() => toggle(i)} accessibilityRole="button">
              <T w="med" s={14.5} c={C.ink} style={{ flex: 1, lineHeight: 21, paddingRight: 14 }}>{f.q}</T>
              {openIdx === i ? <Minus size={20} color={C.ink} /> : <Plus size={20} color={C.ink} />}
            </PressableScale>
            {openIdx === i && <T w="med" s={13} c={C.muted} style={{ lineHeight: 20, paddingBottom: 16 }}>{f.a}</T>}
          </View>
        ))}
      </View>
      {faqs.length > 4 && (
        <PressableScale style={s.faqMore} onPress={() => { spring(); setShowAll((v) => !v); setOpenIdx(-1); }} accessibilityRole="button">
          <T w="semi" s={13.5} c={C.muted}>{showAll ? 'See less' : 'See More'}</T>
          <ChevronDown size={16} color={C.muted} style={{ transform: [{ rotate: showAll ? '180deg' : '0deg' }] }} />
        </PressableScale>
      )}
    </View>
  );
}

/* ── Trial-booking wizard (opens from "Find the right teacher") ─────────────── */
const TB_GRADES = ['1', '2', '3', '4', '5', '6', '7', '8'];
const TB_BOARDS = ['CBSE', 'ICSE', 'IB', 'IGCSE', 'State Board', 'Other'];
const TB_SLOTS = { Afternoon: ['12 – 1 PM', '2 – 3 PM', '3 – 4 PM'], Evening: ['4 – 5 PM', '5 – 6 PM', '6 – 7 PM'] };
const TB_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TB_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function tbNextDates(n) {
  const out = [], base = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    out.push({ key: `${d.getMonth()}-${d.getDate()}`, label: `${TB_DAY[d.getDay()]}, ${TB_MON[d.getMonth()]} ${d.getDate()}` });
  }
  return out;
}

// Defined at module scope (not inside TrialBooking) so their component type is stable —
// otherwise the text inputs would remount and lose focus on every keystroke.
function Title({ eyebrow, children }) {
  return (
    <>
      {!!eyebrow && <T w="bold" s={11} c={C.faint} style={{ letterSpacing: 0.6, marginBottom: 10, lineHeight: 16 }}>{eyebrow}</T>}
      <T w="med" s={20} c={C.ink} style={{ lineHeight: 27 }}>{children}</T>
    </>
  );
}
function Field({ label, value, onChangeText, keyboardType, autoFocus }) {
  return (
    <View style={s.tbField}>
      <T w="bold" s={10} c={C.faint} style={{ letterSpacing: 0.3 }}>{label}</T>
      <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} autoFocus={autoFocus}
        style={s.tbInput} placeholder="" cursorColor={C.gold} selectionColor="#F9B23455" />
    </View>
  );
}

// Eight questions; the rocket "booster" rides forward one notch per answered step.
function TrialBooking({ visible, onClose, cls }) {
  const TOTAL = 8;
  const DATES = useRef(tbNextDates(7)).current;
  const [step, setStep] = useState(0);
  const [booked, setBooked] = useState(false);
  const [a, setA] = useState({ grade: null, board: null, child: '', parent: '', date: null, period: 'Afternoon', slot: null, mobile: '' });
  const prog = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(prog, { toValue: booked ? 1 : step / (TOTAL - 1), duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [step, booked, prog]);

  const set = (patch) => setA((p) => ({ ...p, ...patch }));
  const next = () => setStep((s) => Math.min(TOTAL - 1, s + 1));
  const back = () => { if (booked) return; step === 0 ? close() : setStep((s) => s - 1); };
  const close = () => { onClose && onClose(); setTimeout(() => { setStep(0); setBooked(false); setA({ grade: null, board: null, child: '', parent: '', date: null, period: 'Afternoon', slot: null, mobile: '' }); }, 250); };
  // Selection steps advance on tap; text steps use the Next button.
  const pick = (patch) => { set(patch); setTimeout(next, 160); };

  const valid = [a.grade != null, a.board != null, !!a.child.trim(), !!a.parent.trim(), a.date != null, a.slot != null, a.mobile.replace(/\D/g, '').length >= 10, true][step];
  const hasBtn = booked ? false : [false, false, true, true, false, false, true, true][step];
  const btnLabel = step === TOTAL - 1 ? 'Confirm' : 'Next';
  const trailW = prog.interpolate({ inputRange: [0, 1], outputRange: ['5%', '95%'] });
  const rocketL = prog.interpolate({ inputRange: [0, 1], outputRange: ['5%', '95%'] });

  const body = () => {
    if (booked) return (
      <View style={{ alignItems: 'center', paddingTop: 30 }}>
        <View style={s.tbTick}><FontAwesome6 name="check" size={30} color="#fff" /></View>
        <T w="xbold" s={22} c={C.ink} style={{ marginTop: 22, textAlign: 'center' }}>You're all set!</T>
        <T w="med" s={13.5} c={C.muted} style={{ marginTop: 10, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 }}>
          {a.parent ? `Thanks, ${a.parent}. ` : ''}We've booked {a.child || 'your child'}'s free 1-on-1 trial for {a.date?.label}, {a.slot}. Our team will call {a.mobile} to confirm.
        </T>
      </View>
    );
    switch (step) {
      case 0: return (
        <>
          <Title eyebrow="TAKE THE FIRST STEP TOWARDS A PERSONALISED MATH PLAN FOR YOUR CHILD.">Which <T w="xbold" s={20} c={C.ink}>grade</T> is your child in?</Title>
          <View style={s.tbChipWrap}>
            {TB_GRADES.map((g) => (
              <PressableScale key={g} onPress={() => pick({ grade: g })} style={[s.tbGradeChip, a.grade === g && s.tbChipOn]}>
                <T w="bold" s={15} c={a.grade === g ? '#fff' : C.ink}>{g}</T>
              </PressableScale>
            ))}
          </View>
        </>
      );
      case 1: return (
        <>
          <Title eyebrow="OUR CURRICULUM IS PERSONALISED BASED ON THE SCHOOL BOARD AND SYLLABUS.">Please select your child's <T w="xbold" s={20} c={C.ink}>school board</T></Title>
          <View style={{ gap: 12, marginTop: 6 }}>
            {TB_BOARDS.map((b) => (
              <PressableScale key={b} onPress={() => pick({ board: b })} style={[s.tbRow, a.board === b && s.tbRowOn]}>
                <T w="semi" s={14.5} c={a.board === b ? C.ink : C.muted}>{b}</T>
              </PressableScale>
            ))}
          </View>
        </>
      );
      case 2: return (
        <>
          <Title eyebrow="EVERY CHILD IS UNIQUE, AND WE PERSONALIZE THE JOURNEY FOR YOUR CHILD!">What's your <T w="xbold" s={20} c={C.ink}>child's name</T>?</Title>
          <Field label="YOUR CHILD'S NAME" value={a.child} onChangeText={(t) => set({ child: t })} autoFocus />
        </>
      );
      case 3: return (
        <>
          <Title eyebrow="JOIN OUR COMMUNITY OF 4,00,000+ SATISFIED PARENTS GLOBALLY!">What's <T w="xbold" s={20} c={C.ink}>your name</T>?</Title>
          <Field label="YOUR NAME" value={a.parent} onChangeText={(t) => set({ parent: t })} autoFocus />
        </>
      );
      case 4: return (
        <>
          <Title>Pick a <T w="xbold" s={20} c={C.ink}>date</T> for a 1-on-1 trial class with an expert tutor</Title>
          <T w="bold" s={11} c={C.faint} style={{ letterSpacing: 0.5, marginTop: 16, marginBottom: 10 }}>SELECT A DATE</T>
          <View style={s.tbChipWrap}>
            {DATES.map((d) => (
              <PressableScale key={d.key} onPress={() => pick({ date: d })} style={[s.tbDateChip, a.date?.key === d.key && s.tbDateOn]}>
                <T w="semi" s={13} c={a.date?.key === d.key ? '#fff' : C.ink}>{d.label}</T>
              </PressableScale>
            ))}
          </View>
        </>
      );
      case 5: return (
        <>
          <Title>Pick a <T w="xbold" s={20} c={C.ink}>time</T> for your trial class on {a.date?.label}</Title>
          <View style={s.tbTabRow}>
            {['Afternoon', 'Evening'].map((p) => (
              <PressableScale key={p} onPress={() => set({ period: p, slot: null })} style={s.tbTab}>
                <T w={a.period === p ? 'xbold' : 'semi'} s={14} c={a.period === p ? C.ink : C.faint}>{p}</T>
                <View style={[s.tbTabRule, { backgroundColor: a.period === p ? C.gold : 'transparent' }]} />
              </PressableScale>
            ))}
          </View>
          <View style={s.tbChipWrap}>
            {TB_SLOTS[a.period].map((sl) => (
              <PressableScale key={sl} onPress={() => pick({ slot: sl })} style={[s.tbDateChip, a.slot === sl && s.tbDateOn]}>
                <T w="semi" s={13} c={a.slot === sl ? '#fff' : C.ink}>{sl}</T>
              </PressableScale>
            ))}
          </View>
          <T w="med" s={12} c={C.muted} style={{ marginTop: 16 }}>Timezone: <T w="bold" s={12} c={C.ink}>Asia/Calcutta</T></T>
        </>
      );
      case 6: return (
        <>
          <Title eyebrow="WE'LL SEND THE CLASS LINK AND REMINDERS HERE.">What's your <T w="xbold" s={20} c={C.ink}>mobile number</T>?</Title>
          <Field label="YOUR MOBILE NUMBER" value={a.mobile} onChangeText={(t) => set({ mobile: t })} keyboardType="phone-pad" autoFocus />
        </>
      );
      default: return (
        <>
          <Title>Confirm your <T w="xbold" s={20} c={C.ink}>free trial class</T></Title>
          <View style={s.tbSummary}>
            {[['Child', a.child], ['Grade', `Grade ${a.grade}`], ['Board', a.board], ['Parent', a.parent], ['Mobile', a.mobile], ['When', `${a.date?.label} · ${a.slot}`]].map(([k, v]) => (
              <View key={k} style={s.tbSumRow}>
                <T w="semi" s={12.5} c={C.faint}>{k}</T>
                <T w="bold" s={13.5} c={C.ink} style={{ flex: 1, textAlign: 'right' }}>{v || '—'}</T>
              </View>
            ))}
          </View>
        </>
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={back} transparent={false}>
      <SafeAreaView style={s.tbWrap}>
        <View style={s.tbTopRow}>
          <PressableScale onPress={back} hitSlop={10}><ChevronLeft size={24} color={C.ink} /></PressableScale>
          <T w="bold" s={16} c={C.ink} style={{ marginLeft: 8 }}>Event</T>
        </View>

        {/* Booster progress header. */}
        <View style={s.tbBanner}>
          <View style={s.tbNavy} />
          <View style={s.tbYellow} />
          <View style={s.tbTrack}>
            <View style={s.tbTrackBase} />
            <Animated.View style={[s.tbTrail, { width: trailW }]} />
            <Animated.View style={[s.tbRocket, { left: rocketL }]}>
              <FontAwesome6 name="rocket" size={15} color="#14151B" style={{ transform: [{ rotate: '45deg' }] }} />
            </Animated.View>
          </View>
          <View style={s.tbGalleryBtn}><FontAwesome6 name="image" size={13} color="#F0501E" /></View>
        </View>

        <ScrollView contentContainerStyle={s.tbBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {body()}
        </ScrollView>

        <View style={s.tbFooter}>
          {booked ? (
            <PressableScale style={s.tbBtnOn} onPress={close}><T w="bold" s={15.5} c={C.ink}>Done</T></PressableScale>
          ) : hasBtn ? (
            <PressableScale disabled={!valid} style={valid ? s.tbBtnOn : s.tbBtnOff} onPress={() => (step === TOTAL - 1 ? setBooked(true) : next())}>
              <T w="bold" s={15.5} c={valid ? C.ink : '#9AA0AA'}>{btnLabel}</T>
            </PressableScale>
          ) : null}
          {!booked && <T w="bold" s={12.5} c={C.faint} style={{ textAlign: 'center', marginTop: 12 }}>{step + 1} of {TOTAL}</T>}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export function ProgramDetail({ programId, onBack }) {
  const H = CONTENT.event.programsHub;
  const classes = H.classes;
  const startIdx = Math.max(0, classes.findIndex((c) => c.id === programId));
  const [idx, setIdx] = useState(startIdx);
  const [grade, setGrade] = useState(0);
  const [page, setPage] = useState(0);
  const [booking, setBooking] = useState(false);
  const scrollRef = useRef(null);
  const cls = classes[idx];
  const SECTIONS = 9;   // care · curriculum · synced · 360° · principles · method · video · join · faqs

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
            {!!cls.curriculumHook && <T w="xbold" s={14} c={C.ink} style={{ lineHeight: 20, marginTop: 14 }}>{cls.curriculumHook}</T>}
            <T w="med" s={13.5} c={C.muted} style={{ lineHeight: 21, marginTop: 12 }}>{cls.curriculumBody}</T>
            {cls.curriculumVisual === 'fractions' ? (
              <View style={[s.pCurImgFrame, s.pCurImgCream]}><FractionAssemble /></View>
            ) : cls.curriculumVisual === 'abacus' ? (
              <View style={[s.pCurImgFrame, s.pCurImgCream]}><AbacusCount /></View>
            ) : cls.curriculumVisual === 'balance' ? (
              <View style={[s.pCurImgFrame, s.pCurImgCream]}><AlgebraBalance /></View>
            ) : (
              // Portrait still resting on a soft cream blob.
              <View style={s.pCurPhotoWrap}>
                <View style={s.pCurPhotoBlob} />
                <View style={s.pCurPhotoCard}>
                  {cls.curriculumImage
                    ? <Image source={{ uri: cls.curriculumImage }} style={s.pCurImg} resizeMode="cover" />
                    : <View style={s.pCurImgStub}><Wordmark size={20} /></View>}
                </View>
              </View>
            )}
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

            {/* Per-class exercise visual: factor blocks (3–5) or the join-the-dots rocket. */}
            <View style={s.pExerciseWrap}>
              <View style={[s.pExerciseBack, cls.exercise === 'factors' && s.pExerciseBackWarm]} />
              <View style={[s.pExerciseCard, cls.exercise === 'factors' && s.pExerciseCardWarm]}>
                {cls.exercise === 'factors' ? (
                  <FactorBlocks caption={cls.exerciseCaption || H.exerciseCaption} />
                ) : (
                  <>
                    <RocketDotToDot />
                    <T w="semi" s={11.5} c={C.muted} style={{ marginTop: 4 }}>{H.exerciseCaption}</T>
                  </>
                )}
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

        {/* Section 5 — why the teaching works (horizontally-scrollable dark cards). */}
        {!!H.principles && (
          <FadeIn key={`principles-${cls.id}`} delay={200}>
            <PrinciplesCarousel heading={H.principles.heading} sub={H.principles.sub} cards={H.principles.cards} />
          </FadeIn>
        )}

        {/* Section 6 — the method (swipeable colored cards). */}
        {!!H.method && (
          <FadeIn key={`method-${cls.id}`} delay={220}>
            <MethodSlider heading={H.method.heading} cards={H.method.cards} />
          </FadeIn>
        )}

        {/* Section 7 — how our classes work. A real recorded session wins if we have one
            (per-class `classVideo`, else the shared clip); otherwise the animated
            explainer stands in, so we never present stock/B-roll as one of our classes. */}
        {(() => {
          const cv = cls.classVideo || H.classVideo;
          const ce = cls.classExplainer;
          if (cv?.uri) {
            return (
              <FadeIn key={`video-${cls.id}`} delay={240}>
                <ClassVideo heading={cv.heading || H.classVideo?.heading} uri={cv.uri} />
              </FadeIn>
            );
          }
          return !!ce && (
            <FadeIn key={`explain-${cls.id}`} delay={240}>
              <ClassExplainer heading={ce.heading || H.classVideo?.heading} ask={ce.ask} reply={ce.reply} steps={ce.steps} />
            </FadeIn>
          );
        })()}

        {/* Section 8 — join any time (dark panel, floating rocket). */}
        {!!H.joinAnytime && (
          <FadeIn key={`join-${cls.id}`} delay={260}>
            <JoinAnytime title={H.joinAnytime.title} body={H.joinAnytime.body} step={H.joinAnytime.step} />
          </FadeIn>
        )}

        {/* Section 9 — FAQs (accordion; first 4, then "See More"). */}
        <FadeIn key={`faq-${cls.id}`} delay={280}>
          <ProgramFaq title={H.faqTitle} faqs={H.faqs} />
        </FadeIn>
      </ScrollView>

      {/* Sticky CTA + page indicator. */}
      <View style={s.pCtaBar}>
        <PressableScale style={s.pCta} onPress={() => setBooking(true)}>
          <T w="bold" s={15.5} c={C.ink}>{H.cta}</T>
        </PressableScale>
        <View style={s.pPager}>
          {Array.from({ length: SECTIONS }).map((_, i) => (
            <View key={i} style={[s.pPagerDot, i === page ? s.pPagerOn : null]} />
          ))}
          <T w="bold" s={11.5} c={C.faint} style={{ marginLeft: 8 }}>{page + 1} of {SECTIONS}</T>
        </View>
      </View>

      <TrialBooking visible={booking} onClose={() => setBooking(false)} cls={cls} />
    </View>
  );
}

/* ── All sections stacked vertically (default export) ─────────────────────── */
export default function EventsStack({ events = [], store = [], skills = [], gallery = [], onAbout, onImpact, onTutors, onReviews, onPricing, onFaqs, onContact, onRefund, onReferral, onOpenProgram }) {
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
        <FadeIn delay={160}><BecomePage E={E} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors} onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onContact={onContact} onRefund={onRefund} onReferral={onReferral} onOpenProgram={onOpenProgram} /></FadeIn>
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
export function EventsModal({ visible, onClose, events, store, skills, gallery, onAbout, onImpact, onTutors, onReviews, onPricing, onFaqs, onContact, onRefund, onReferral }) {
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
            <EventsStack events={events} store={store} skills={skills} gallery={gallery} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors} onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onContact={onContact} onRefund={onRefund} onReferral={onReferral} onOpenProgram={setProgram} />
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
  pFeatIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  pFeatBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  pBulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  pBulletTri: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: 4 },

  pCurImgFrame: { marginTop: 20, borderRadius: 18, overflow: 'hidden', height: 200, backgroundColor: C.border },
  pCurImg: { width: '100%', height: '100%' },
  pCurImgStub: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  pGradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  pGradeChip: { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, borderWidth: 1.5 },
  pGradeOn: { backgroundColor: '#fff', borderColor: C.ink },
  pGradeOff: { backgroundColor: C.headerBg, borderColor: 'transparent' },

  pExerciseWrap: { marginTop: 26, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  pExerciseBack: { position: 'absolute', width: 220, height: 210, borderRadius: 26, backgroundColor: '#CDEBFA', transform: [{ rotate: '-5deg' }] },
  pExerciseCard: { width: 230, height: 210, borderRadius: 24, backgroundColor: '#EAF7FE', alignItems: 'center', justifyContent: 'center' },
  pExerciseBackWarm: { backgroundColor: '#FBE7A8' },
  pExerciseCardWarm: { backgroundColor: '#FDF6E3' },

  // Curriculum still — portrait card on a cream blob
  pCurPhotoWrap: { marginTop: 26, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  pCurPhotoBlob: { position: 'absolute', width: 206, height: 194, borderRadius: 44, backgroundColor: '#FBF0DC', transform: [{ rotate: '-8deg' }] },
  pCurPhotoCard: { width: 170, height: 198, borderRadius: 14, overflow: 'hidden', backgroundColor: C.border },

  // "How our classes work" — animated session
  ceSection: { paddingHorizontal: 18, paddingTop: 32 },
  ceCard: { marginTop: 18, borderRadius: 20, backgroundColor: '#161A22', padding: 14 },
  ceBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ceWho: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ceAvatar: { width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ceLive: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E4342A', paddingHorizontal: 7, paddingVertical: 3.5, borderRadius: 6 },
  ceLiveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  ceBoard: { marginTop: 13, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, minHeight: 116, justifyContent: 'center', gap: 12 },
  ceStepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ceStepBar: { width: 3, height: 18, borderRadius: 2 },
  ceBubble: { marginTop: 10, alignSelf: 'flex-start', maxWidth: '86%', backgroundColor: '#2A3140', borderRadius: 12, borderBottomLeftRadius: 3, paddingHorizontal: 11, paddingVertical: 7 },
  ceReply: { alignSelf: 'flex-end', backgroundColor: '#F5B301', borderBottomLeftRadius: 12, borderBottomRightRadius: 3 },

  // Grades 6–8 animated balance
  balStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  balWrap: { width: 190, height: 104, position: 'relative' },
  balBeam: { position: 'absolute', top: 44, left: 18, right: 18, height: 8, borderRadius: 4, backgroundColor: '#5B6472' },
  balSide: { position: 'absolute', bottom: 8, alignItems: 'center' },
  balTile: { borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  balPlate: { width: 48, height: 4, borderRadius: 2, backgroundColor: '#8A94A6', marginTop: 3 },
  balFulcrum: { position: 'absolute', top: 50, left: 80, width: 0, height: 0, borderLeftWidth: 15, borderRightWidth: 15, borderBottomWidth: 30, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#B9C0CC' },

  // Grades K–2 animated abacus
  abStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  abFrame: { width: 172, height: 132, borderWidth: 7, borderColor: '#C98A4B', borderRadius: 12, backgroundColor: '#FFFDF7' },
  abRodWrap: { position: 'absolute', left: 0, right: 0, height: 18, justifyContent: 'center' },
  abRod: { position: 'absolute', left: 2, right: 2, height: 2.5, borderRadius: 2, backgroundColor: '#E0C49A' },
  abBead: { position: 'absolute', width: 16, height: 16, borderRadius: 8 },

  // Grades 3–5 animated visuals
  pCurImgCream: { backgroundColor: '#FBF3E4' },
  fracStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fracWedge: { position: 'absolute', top: '50%', left: '50%' },
  facCard: { alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 16 },
  facRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },

  pTopicRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.hair },
  pTopicNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.headerBg, alignItems: 'center', justifyContent: 'center' },

  pCurLink: { alignSelf: 'center', marginTop: 22, marginBottom: 4 },
  pCurLinkTxt: { textDecorationLine: 'underline' },

  // 360° approach section
  p360Card: { backgroundColor: '#FBF0DA', borderRadius: 22, marginHorizontal: 18, marginTop: 30, paddingTop: 26, paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' },
  p360Stage: { height: 262, marginTop: 18, alignItems: 'center' },
  p360Box: { width: 250, height: 262, position: 'relative' },
  p360Circle: { position: 'absolute', top: 40, left: 20, width: 210, height: 210, borderRadius: 105, backgroundColor: '#F6AE1E' },
  p360Badge: { position: 'absolute', top: 44, left: 34, width: 54, height: 54, borderRadius: 27, backgroundColor: '#F0501E', alignItems: 'center', justifyContent: 'center' },
  orbitBead: { position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderRadius: 6, marginLeft: -6, marginTop: -6, backgroundColor: '#FCE07A', borderWidth: 2, borderColor: '#FFF7DC' },

  lapAbs: { position: 'absolute', top: 78, left: 0, right: 0, alignItems: 'center' },
  lapWrap: { alignItems: 'center' },
  lapScreen: { width: 178, height: 112, backgroundColor: '#12202B', borderRadius: 10, padding: 6 },
  lapInner: { flex: 1, backgroundColor: '#fff', borderRadius: 5, overflow: 'hidden' },
  lapBar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 16, borderBottomWidth: 1, borderBottomColor: '#EEF0F3' },
  lapDot: { width: 5, height: 5, borderRadius: 3 },
  lapBody: { flex: 1, paddingHorizontal: 10, paddingTop: 5, paddingBottom: 7, justifyContent: 'space-between' },
  eqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  eqChip: { minWidth: 16, height: 15, paddingHorizontal: 4, borderRadius: 4, backgroundColor: '#EDE6FE', alignItems: 'center', justifyContent: 'center' },
  pieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 26 },
  sliderRow: { height: 12, justifyContent: 'center' },
  sliderTrack: { position: 'absolute', left: 6, right: 6, height: 3, borderRadius: 2, backgroundColor: '#E5E8EC' },
  sliderFill: { position: 'absolute', left: 6, width: 118, height: 3, borderRadius: 2, backgroundColor: '#28C08A' },
  sliderKnob: { position: 'absolute', left: 4, width: 11, height: 11, borderRadius: 6, backgroundColor: '#12B3A6', borderWidth: 2, borderColor: '#fff' },
  lapBase: { width: 204, height: 9, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: '#C9CDD6', marginTop: 2 },

  pCtaBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, backgroundColor: 'rgba(246,246,247,0.96)', borderTopWidth: 1, borderTopColor: C.border },
  pCta: { backgroundColor: '#F9B234', borderRadius: 30, paddingVertical: 17, alignItems: 'center', shadowColor: '#C98A12', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  pPager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12 },
  pPagerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  pPagerOn: { width: 18, backgroundColor: C.gold },

  // Trial-booking wizard
  tbWrap: { flex: 1, backgroundColor: '#F4F5F6' },
  tbTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 8 : 0, paddingBottom: 10 },
  tbBanner: { height: 96, position: 'relative' },
  tbNavy: { position: 'absolute', top: 0, left: 0, right: 0, height: 54, backgroundColor: '#33506B' },
  tbYellow: { position: 'absolute', top: 40, left: 0, right: 0, height: 56, backgroundColor: '#F6B01E', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  tbTrack: { position: 'absolute', top: 41, left: 0, right: 0, height: 3, justifyContent: 'center' },
  tbTrackBase: { position: 'absolute', left: '5%', right: '5%', height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  tbTrail: { position: 'absolute', left: 0, height: 3, borderRadius: 2, backgroundColor: '#F0501E' },
  tbRocket: { position: 'absolute', top: -10, marginLeft: -11, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  tbGalleryBtn: { position: 'absolute', top: 40, right: 18, width: 26, height: 26, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#00000030', shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },

  tbBody: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 30 },
  tbChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  tbGradeChip: { width: 66, height: 52, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tbChipOn: { backgroundColor: '#14151B', borderColor: '#14151B' },
  tbDateChip: { minWidth: 96, paddingHorizontal: 16, height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tbDateOn: { backgroundColor: '#14151B', borderColor: '#14151B' },
  tbRow: { paddingHorizontal: 16, height: 50, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', justifyContent: 'center' },
  tbRowOn: { borderColor: C.gold, borderWidth: 1.6, backgroundColor: '#FFF9EC' },
  tbField: { marginTop: 26, borderWidth: 1, borderColor: '#C9CDD6', borderRadius: 10, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, backgroundColor: '#fff' },
  tbInput: { fontSize: 16, color: C.ink, paddingVertical: 6, paddingHorizontal: 0, fontFamily: Platform.select({ ios: undefined, android: undefined }) },
  tbTabRow: { flexDirection: 'row', gap: 26, marginTop: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  tbTab: { paddingBottom: 0, alignItems: 'center' },
  tbTabRule: { height: 3, borderRadius: 2, alignSelf: 'stretch', marginTop: 10 },
  tbSummary: { marginTop: 22, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 6 },
  tbSumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F1F3' },
  tbTick: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#22B573', alignItems: 'center', justifyContent: 'center' },
  tbFooter: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 20 },
  tbBtnOn: { backgroundColor: '#F9B234', borderRadius: 30, paddingVertical: 16, alignItems: 'center', shadowColor: '#C98A12', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  tbBtnOff: { backgroundColor: '#D7DAE0', borderRadius: 30, paddingVertical: 16, alignItems: 'center' },

  // FAQ accordion (program page)
  faqSection: { paddingHorizontal: 22, paddingTop: 34, paddingBottom: 12 },
  faqRule: { height: 1, backgroundColor: C.border },
  faqItem: { borderBottomWidth: 1, borderBottomColor: C.border },
  faqHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
  faqMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 18 },

  // "The Ailernova way" — horizontally-scrollable dark cards
  prSection: { paddingLeft: 22, paddingTop: 30 },
  prScroll: { paddingTop: 18, paddingRight: 22, paddingBottom: 4, gap: 14 },
  prCard: { backgroundColor: '#16171D', borderRadius: 22, padding: 20, minHeight: 310, overflow: 'hidden' },
  prStar: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: '#fff' },
  prArt: { marginTop: 'auto', alignItems: 'flex-end', marginRight: -8, marginBottom: -8 },

  // "You can join any time" closing panel
  jaCard: { backgroundColor: '#2B2B2F', borderRadius: 20, marginHorizontal: 18, marginTop: 34, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 26, overflow: 'hidden' },
  jaArt: { alignItems: 'center', justifyContent: 'center', marginTop: 12, height: 180 },
  // Full-bleed inside the card: cancels the 22px padding so the horizon spans edge to edge.
  jaBand: { marginHorizontal: -22, marginTop: 4, height: 92, position: 'relative' },
  jaBadge: { position: 'absolute', top: 27, left: '50%', marginLeft: -17, width: 34, height: 34, borderRadius: 17, backgroundColor: '#2B2B2F', borderWidth: 2.5, borderColor: '#F5A623', alignItems: 'center', justifyContent: 'center' },
  jaDot: { alignSelf: 'center', width: 10, height: 10, borderRadius: 5, backgroundColor: '#F5A623', marginTop: 8 },
  jaStepCard: { backgroundColor: '#1F1F23', borderRadius: 18, paddingHorizontal: 20, paddingVertical: 20, marginTop: 14 },
  jaBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F5A623', marginTop: 6 },

  // "How our classes work" video
  cvSection: { marginTop: 36, paddingHorizontal: 22 },
  cvBand: { backgroundColor: '#F6B01E', marginHorizontal: -22, marginTop: 20, paddingVertical: 16, paddingHorizontal: 14 },
  cvFrame: { width: '100%', aspectRatio: 16 / 9, borderRadius: 10, overflow: 'hidden', backgroundColor: '#101418' },
  cvPlayWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(12,12,18,0.28)' },
  cvPlay: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', paddingLeft: 4 },

  // Method slider cards
  mCard: { borderRadius: 22, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 18, minHeight: 240 },
  mStep: { flexDirection: 'row', alignItems: 'center' },
  mStepDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#00000030', shadowOpacity: 0.5, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  mStepLine: { flex: 1, height: 2, marginHorizontal: 8 },
  mStepNext: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  mDots: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 20 },
  mDot: { width: 6, height: 6, borderRadius: 3 },

  // Blogs screen
  blogCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: '#141420', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  blogBand: { height: 96, alignItems: 'center', justifyContent: 'center' },
  blogHero: { height: 130, justifyContent: 'flex-end' },
  blogTag: { position: 'absolute', left: 14, bottom: 12, backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  blogFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },

  // Become a Tutor screen
  btHero: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 6 },
  btGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 22, marginTop: 18 },
  btCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14 },
  btIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  btSteps: { marginHorizontal: 22, marginTop: 28, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 20 },
  btStepNum: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  btForm: { marginHorizontal: 22, marginTop: 22 },

  // Subject picker pop-form (bottom sheet)
  sheetScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12,12,18,0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  sheetGrab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 14 },
  subjGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  subjChip: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 14 },
  sheetClose: { alignSelf: 'center', marginTop: 18, paddingVertical: 8, paddingHorizontal: 24 },

  footDivider: { height: 1, backgroundColor: C.border, marginVertical: 18 },
  socialRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  socialTile: { width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },

  teaser: { height: 330, padding: 18, justifyContent: 'space-between' },
  teaserBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 13, alignItems: 'center', alignSelf: 'stretch' },
  mHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  mBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
