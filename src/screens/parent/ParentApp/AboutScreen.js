// src/screens/parent/ParentApp/AboutScreen.js
// "About Ailernova" — one long story page (scroll straight down through every
// section) with a Get Started CTA that stays pinned over the content the whole way.
// Section order: rating · hero · video · marquee · stats · founder · pillars ·
// reach · timeline · investors · know-more · FAQ · movement · become + footer.
//
// Sections whose data is empty in CONTENT.about (video / founder / timeline /
// investors / reach.image) render NOTHING — they light up the moment real data is
// put in constants.js. Nothing here invents a figure, a face or a backer.
import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View, ScrollView, Animated, Easing, StyleSheet, Modal, SafeAreaView,
  Linking, LayoutAnimation, Platform, UIManager, Image, Dimensions,
} from 'react-native';
import Svg, { Line, Circle, Path, G, Polyline, Polygon } from 'react-native-svg';
import { Star, Plus, X, Check, Play, Sparkles, ArrowUpRight, UserRound, Medal, ChevronDown, Image as ImageIcon, HelpCircle, Wallet, Users, FileText, ArrowDown, CalendarDays, Mail, MessageCircle } from 'lucide-react-native';
import { C, T, CONTENT, Wordmark } from './constants';
import { PressableScale, FadeIn, PopIn } from './anim';
import { BecomePage } from './EventsCarousel';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_W } = Dimensions.get('window');
const open = (u) => { if (u) Linking.openURL(u).catch(() => {}); };
const spring = () => LayoutAnimation.configureNext(
  LayoutAnimation.create(240, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity),
);

/* ── Trustpilot-style rating block ────────────────────────────────────────── */
function Rating({ r }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <T w="xbold" s={15} c={C.ink}>{r.score}+</T>
        <T w="med" s={14} c={C.muted}>· {r.label}</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 3, marginTop: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={s.tpStar}><Star size={13} color="#fff" fill="#fff" /></View>
        ))}
      </View>
    </View>
  );
}

/* ── Hero art — the placeholder that HOLDS the video slot ─────────────────── */
// Stands in until a real film exists: set CONTENT.about.video = { image, url } and
// the play card below takes this spot automatically. Deliberately has no play button
// — a tappable ▶ that plays nothing is worse than no ▶ at all.
// A brand medallion wired to subject nodes; lines are drawn in real pixels (measured
// via onLayout) because percentage-positioned SVG endpoints drift on Android.
const NODES = [
  { x: 0.10, y: 0.16, e: '📐' }, { x: 0.33, y: 0.07, e: '🧪' }, { x: 0.62, y: 0.09, e: '📘' },
  { x: 0.88, y: 0.20, e: '🔬' }, { x: 0.09, y: 0.52, e: '➗' }, { x: 0.91, y: 0.55, e: '🧠' },
  { x: 0.20, y: 0.85, e: '📊' }, { x: 0.50, y: 0.93, e: '✏️' }, { x: 0.80, y: 0.84, e: '🧮' },
];
const CX = 0.5;
const CY = 0.46;
const DOT = 46;

function HeroArt() {
  const [d, setD] = useState({ w: 0, h: 0 });
  const px = (n, axis) => (axis === 'x' ? n * d.w : n * d.h);
  return (
    <View style={s.art} onLayout={(e) => setD({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {d.w > 0 && (
        <>
          <Svg width={d.w} height={d.h} style={StyleSheet.absoluteFill}>
            {NODES.map((n) => (
              <Line
                key={n.e}
                x1={px(CX, 'x')} y1={px(CY, 'y')} x2={px(n.x, 'x')} y2={px(n.y, 'y')}
                stroke="#C9D3EA" strokeWidth={1}
              />
            ))}
          </Svg>
          {NODES.map((n, i) => (
            <PopIn
              key={n.e}
              delay={200 + i * 70}
              style={[s.node, { left: px(n.x, 'x') - DOT / 2, top: px(n.y, 'y') - DOT / 2 }]}
            >
              <T s={20}>{n.e}</T>
            </PopIn>
          ))}
          <PopIn delay={90} style={[s.medallion, { left: px(CX, 'x') - 58, top: px(CY, 'y') - 58 }]}>
            <Wordmark size={13} />
            <T w="xbold" s={17} c={C.ink} style={{ marginTop: 6 }}>200K+</T>
            <T w="med" s={10.5} c={C.muted}>learners</T>
          </PopIn>
        </>
      )}
    </View>
  );
}

/* ── Auto-scrolling highlight ticker ──────────────────────────────────────── */
// One row is measured, then two copies translate left by exactly that width and
// snap back — so the loop is seamless (no gap, no visible jump).
function Marquee({ items }) {
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!w) return undefined;
    x.setValue(0);
    const a = Animated.loop(Animated.timing(x, {
      toValue: -w, duration: w * 18, easing: Easing.linear, useNativeDriver: true,
    }));
    a.start();
    return () => a.stop();
  }, [w, x]);
  const row = (onLayout) => (
    <View style={{ flexDirection: 'row' }} onLayout={onLayout}>
      {items.map((it, i) => (
        <View key={i} style={s.mqItem}>
          <Sparkles size={13} color={C.gold} />
          <T w="semi" s={13} c={C.ink}>{it}</T>
        </View>
      ))}
    </View>
  );
  return (
    <View style={s.mq}>
      <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: x }] }}>
        {row((e) => setW(Math.round(e.nativeEvent.layout.width)))}
        {row()}
      </Animated.View>
    </View>
  );
}

/* ── Dotted globe with location pins ──────────────────────────────────────── */
// A real orthographic projection, not a decorative circle of dots: every dot and pin
// is a lat/lon point projected onto the sphere, so the pins land where those cities
// actually are. Only the front hemisphere (z > 0) is drawn — that's what gives it depth.
// CENTER_LON aims the globe at India, so South Asia, the Gulf, SE Asia and Europe
// are all on the visible face.
const CENTER_LON = 55;
// The same coordinates as before, now carrying the city/country they actually are.
// Naming them turns the globe from decoration into a claim we can label and count:
// the "16 cities · 11 countries" line under it is DERIVED from this list, so the
// figure can never drift out of step with the pins.
const CITIES = [
  { lat: 28.6, lon: 77.2, city: 'Delhi', country: 'India', cont: 'Asia' },
  { lat: 19.1, lon: 72.9, city: 'Mumbai', country: 'India', cont: 'Asia' },
  { lat: 12.9, lon: 77.6, city: 'Bengaluru', country: 'India', cont: 'Asia' },
  { lat: 22.6, lon: 88.4, city: 'Kolkata', country: 'India', cont: 'Asia' },
  { lat: 13.1, lon: 80.3, city: 'Chennai', country: 'India', cont: 'Asia' },
  { lat: 17.4, lon: 78.5, city: 'Hyderabad', country: 'India', cont: 'Asia' },
  { lat: 27.7, lon: 85.3, city: 'Kathmandu', country: 'Nepal', cont: 'Asia' },
  { lat: 6.9, lon: 79.9, city: 'Colombo', country: 'Sri Lanka', cont: 'Asia' },
  { lat: 25.2, lon: 55.3, city: 'Dubai', country: 'UAE', cont: 'Asia' },
  { lat: 25.3, lon: 51.5, city: 'Doha', country: 'Qatar', cont: 'Asia' },
  { lat: 24.7, lon: 46.7, city: 'Riyadh', country: 'Saudi Arabia', cont: 'Asia' },
  { lat: 1.3, lon: 103.8, city: 'Singapore', country: 'Singapore', cont: 'Asia' },
  { lat: 3.1, lon: 101.7, city: 'Kuala Lumpur', country: 'Malaysia', cont: 'Asia' },
  { lat: 51.5, lon: -0.1, city: 'London', country: 'UK', cont: 'Europe' },
  { lat: 52.5, lon: 13.4, city: 'Berlin', country: 'Germany', cont: 'Europe' },
  { lat: -1.3, lon: 36.8, city: 'Nairobi', country: 'Kenya', cont: 'Africa' },
];
const COUNTRY_COUNT = new Set(CITIES.map((c) => c.country)).size;
const CONT_COUNT = new Set(CITIES.map((c) => c.cont)).size;
const RAD = Math.PI / 180;

// lat/lon → x/y on the sphere face (+ z: how far toward the viewer, 1 = dead centre).
function project(lat, lon, R) {
  const a = lat * RAD;
  const b = (lon - CENTER_LON) * RAD;
  return {
    x: R * Math.cos(a) * Math.sin(b),
    y: -R * Math.sin(a),
    z: Math.cos(a) * Math.cos(b),
  };
}

function Globe() {
  const [w, setW] = useState(0);
  const R = w / 2 - 8;
  // One shared pulse drives every halo. A per-pin Animated.Value would mean 16 loops
  // running at once for an effect the eye reads as a single heartbeat anyway.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.timing(pulse, {
      toValue: 1, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true,
    }));
    a.start();
    return () => a.stop();
  }, [pulse]);

  const dots = [];
  if (R > 0) {
    for (let lat = -84; lat <= 84; lat += 8) {
      // Widen the longitude step toward the poles, else the dots bunch up into a blob.
      const step = 8 / Math.max(0.22, Math.cos(lat * RAD));
      for (let lon = -180; lon < 180; lon += step) {
        const p = project(lat, lon, R);
        if (p.z <= 0.04) continue;
        dots.push({ cx: R + 8 + p.x, cy: R + 8 + p.y, r: 0.9 + 1.15 * p.z, o: 0.18 + 0.42 * p.z });
      }
    }
  }
  // Farthest pins first, so nearer ones overlap them correctly.
  const pins = R > 0
    ? CITIES.map((c) => ({ ...project(c.lat, c.lon, R), ...c }))
      .filter((p) => p.z > 0.16)
      .sort((a, b) => a.z - b.z)
    : [];
  // Only the pins facing us square-on get a name. Labelling all of them turns the
  // rim into a pile of overlapping text.
  const labelled = pins.filter((p) => p.z > 0.62);

  return (
    <View>
      <View style={s.globeWrap} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
        {R > 0 && (
          <>
            <Svg width={w} height={w}>
              <Circle cx={R + 8} cy={R + 8} r={R} fill="#FAFAF9" />
              {dots.map((d, i) => (
                <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="#B9BCC2" opacity={d.o} />
              ))}
              {pins.map((p) => (
                // lucide's MapPin path, hand-placed so the pin's TIP sits on the coordinate.
                <G key={p.city} transform={`translate(${R + 8 + p.x - 9}, ${R + 8 + p.y - 16.5}) scale(0.75)`}>
                  <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill={C.blue} />
                  <Circle cx={12} cy={10} r={3} fill="#fff" />
                </G>
              ))}
            </Svg>

            {/* Halos ride on top as plain Views, not SVG, so the expand/fade runs on the
                UI thread — react-native-svg props can't be native-driven. */}
            {labelled.map((p) => (
              <Animated.View
                key={`halo-${p.city}`}
                pointerEvents="none"
                style={[s.gHalo, {
                  left: R + 8 + p.x - 15, top: R + 8 + p.y - 15,
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                  transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.9] }) }],
                }]}
              />
            ))}

            {labelled.map((p) => (
              <View key={`lbl-${p.city}`} pointerEvents="none" style={[s.gLabel, { left: R + 8 + p.x + 10, top: R + 8 + p.y - 24 }]}>
                <T w="semi" s={10.5} c={C.ink}>{p.city}</T>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Counts derived from CITIES — they cannot disagree with the pins above. */}
      <View style={s.gStats}>
        <View style={{ alignItems: 'center' }}>
          <T w="xbold" s={22} c={C.ink}>{CITIES.length}</T>
          <T w="med" s={11.5} c={C.muted}>Cities</T>
        </View>
        <View style={s.gStatRule} />
        <View style={{ alignItems: 'center' }}>
          <T w="xbold" s={22} c={C.ink}>{COUNTRY_COUNT}</T>
          <T w="med" s={11.5} c={C.muted}>Countries</T>
        </View>
        <View style={s.gStatRule} />
        <View style={{ alignItems: 'center' }}>
          <T w="xbold" s={22} c={C.ink}>{CONT_COUNT}</T>
          <T w="med" s={11.5} c={C.muted}>Continents</T>
        </View>
      </View>

      {/* Every city, including the ones currently on the far side of the globe. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 16, paddingHorizontal: 2 }}>
        {CITIES.map((c) => (
          <View key={c.city} style={s.gChip}>
            <View style={s.gChipDot} />
            <T w="semi" s={12.5} c={C.ink}>{c.city}</T>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ── Scroll-triggered reveal ──────────────────────────────────────────────────
   FadeIn (anim.js) fires on MOUNT, which on a long page means every section has
   already played its entrance by the time a parent scrolls down to it — the numbers
   have finished counting into an empty screen. These reveal when the block actually
   enters the viewport instead.

   CONSTRAINT: a revealed block reads its own `onLayout` y, which RN reports relative
   to its IMMEDIATE parent. So `useRevealed`/`Reveal` are only correct as a DIRECT
   child of the reveal ScrollView's contentContainer, where that y is the content-
   absolute offset. Nest one deeper and it will trigger at the wrong scroll position. */
const SCREEN_H = Dimensions.get('window').height;
const REVEAL_MARGIN = 70;   // start slightly before the block's top edge clears the fold
const RevealCtx = React.createContext(null);

function useRevealed() {
  const ctx = useContext(RevealCtx);
  const [shown, setShown] = useState(false);
  const top = useRef(null);

  const check = (scrollTop) => {
    if (top.current != null && top.current < scrollTop + SCREEN_H - REVEAL_MARGIN) setShown(true);
  };

  useEffect(() => {
    // No provider above us (this component reused on a page without one) → don't
    // hide content behind an event that will never arrive. Show it.
    if (!ctx) { setShown(true); return undefined; }
    const id = ctx.scrollY.addListener(({ value }) => check(value));
    // Failsafe. A revealed block starts at opacity 0, so ANY way the trigger can be
    // missed — onLayout not firing, a y we measured against the wrong parent, a
    // provider that gets remounted — fails to a permanently blank section, which is
    // far worse than an entrance that plays early. Show unconditionally after a beat.
    const bail = setTimeout(() => setShown(true), 1600);
    return () => { ctx.scrollY.removeListener(id); clearTimeout(bail); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);

  // Blocks already on screen at first paint never see a scroll event, so settle them
  // at layout time off the last known offset.
  const onLayout = (e) => {
    top.current = e.nativeEvent.layout.y;
    check(ctx ? ctx.last.current : 0);
  };

  return [shown, onLayout];
}

// The page-level scroller that feeds useRevealed. Keeps its own Animated.Value and a
// plain ref of the latest offset (Animated.Value has no public getter, and onLayout
// needs to read the offset synchronously).
function useRevealScroll() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const last = useRef(0);
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => { last.current = value; });
    return () => scrollY.removeListener(id);
  }, [scrollY]);
  const ctx = useRef({ scrollY, last }).current;
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true });
  return { ctx, onScroll };
}

function Reveal({ children, delay = 0, y = 14, style }) {
  const [shown, onLayout] = useRevealed();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!shown) return undefined;
    const an = Animated.timing(a, {
      toValue: 1, duration: 460, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    an.start();
    return () => an.stop();
  }, [shown, delay, a]);

  return (
    <Animated.View
      onLayout={onLayout}
      style={[style, {
        opacity: a,
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }],
      }]}
    >
      {children}
    </Animated.View>
  );
}

/* ── Big-number proof points ──────────────────────────────────────────────── */
// Rolls the numeric head of a stat 0 → value once the row is in view. Values that do
// not START with a digit ("Top 1%") have no head to roll and are rendered as-is —
// counting up the "1" inside "Top 1%" would be nonsense. Decimals are preserved to the
// same precision as the source ("4.9★" lands on 4.9, not 5), which the shared CountUp
// helper cannot do — it Math.rounds.
function StatNumber({ value, color, run }) {
  const m = /^(\d+(?:\.\d+)?)(.*)$/.exec(String(value));
  const target = m ? parseFloat(m[1]) : 0;
  const suffix = m ? m[2] : '';
  const dp = m && m[1].includes('.') ? m[1].split('.')[1].length : 0;
  const av = useRef(new Animated.Value(0)).current;
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!m || !run) return undefined;
    const id = av.addListener(({ value: v }) => setN(v));
    const an = Animated.timing(av, { toValue: target, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    an.start();
    return () => { av.removeListener(id); an.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, target]);

  if (!m) return <T w="xbold" s={34} c={color}>{value}</T>;
  return <T w="xbold" s={34} c={color}>{n.toFixed(dp)}{suffix}</T>;
}

function Stats({ stats }) {
  const [shown, onLayout] = useRevealed();
  return (
    <View style={s.pad} onLayout={onLayout}>
      {stats.map((st, i) => (
        <View key={st.title} style={[s.statRow, i === stats.length - 1 && { borderBottomWidth: 0 }]}>
          <StatNumber value={st.value} color={st.color} run={shown} />
          <T w="bold" s={15} c={C.ink} style={{ marginTop: 14 }}>{st.title}</T>
          <T w="med" s={13} c={C.muted} style={{ marginTop: 4, lineHeight: 19 }}>{st.body}</T>
        </View>
      ))}
    </View>
  );
}

/* ── Graph-paper backdrop ─────────────────────────────────────────────────── */
// The squared-notebook surface the Impact wall and the Pillars header sit on. Ruled in
// real pixels off the measured box (not percentages), so the grid stays square on any
// width and the lines land on whole pixels instead of blurring.
const PAPER = 42;   // square size, px

// `stroke` lets the dark surfaces (the Our Tutors hero) rule the same paper in a light
// ink, so the squared-notebook thread carries across both the white and the dark blocks.
function Paper({ style, children, stroke = '#E9EBEF' }) {
  const [d, setD] = useState({ w: 0, h: 0 });
  return (
    <View
      style={[{ overflow: 'hidden' }, style]}
      onLayout={(e) => setD({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) })}
    >
      {/* Decoration only — it must never take a touch. Without this the ruled overlay
          sits across the whole Paper and can swallow taps meant for the content inside
          it (CardGradient guards its own absolute-fill overlay the same way). */}
      {d.w > 0 && (
        <Svg width={d.w} height={d.h} style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: Math.ceil(d.w / PAPER) + 1 }).map((_, i) => (
            <Line key={`v${i}`} x1={i * PAPER} y1={0} x2={i * PAPER} y2={d.h} stroke={stroke} strokeWidth={1} />
          ))}
          {Array.from({ length: Math.ceil(d.h / PAPER) + 1 }).map((_, i) => (
            <Line key={`h${i}`} x1={0} y1={i * PAPER} x2={d.w} y2={i * PAPER} stroke={stroke} strokeWidth={1} />
          ))}
        </Svg>
      )}
      {children}
    </View>
  );
}

/* ── Snapping horizontal rail ─────────────────────────────────────────────────
   The proof-run carousels (stories · parent voices · awards) were plain horizontal
   ScrollViews: free-scrolling, so a card could come to rest half off-screen, and with
   nothing to hint there was more beside it. This snaps each card to the fold and, when
   `autoplay` is on, walks the rail forward until the parent touches it — after which
   it stops for good rather than fighting the finger.
   `interval` must be card width + the rail's gap, or the snap lands off by the gap. */
// Snap distances = card width + the rail's gap. Keep these in step with s.rail /
// s.storyCard / s.voiceCard / s.awardCard below, or cards drift out of the fold.
const RAIL_GAP = 14;
const STORY_SNAP = 290 + RAIL_GAP;
const VOICE_SNAP = 300 + RAIL_GAP;
const AWARD_SNAP = 300 + RAIL_GAP;
// The dark trust-bar cards sit edge-to-edge as a ruled strip (tbCard carries its own
// right border and no margin), so this snap is the bare card width — no RAIL_GAP to add.
// Keep in step with tbCard.width below; the light ReviewCard is a different style.
const REVIEW_SNAP = 300;

function AutoRail({ interval, count, autoplay = false, every = 4200, style, contentContainerStyle, children }) {
  const ref = useRef(null);
  const at = useRef(0);
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live || !autoplay || count < 2) return undefined;
    const t = setInterval(() => {
      at.current = (at.current + 1) % count;
      ref.current && ref.current.scrollTo({ x: at.current * interval, animated: true });
    }, every);
    return () => clearInterval(t);
  }, [live, autoplay, count, interval, every]);

  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={interval}
      decelerationRate="fast"
      disableIntervalMomentum
      onScrollBeginDrag={() => setLive(false)}
      onMomentumScrollEnd={(e) => { at.current = Math.round(e.nativeEvent.contentOffset.x / interval); }}
      style={style}
      contentContainerStyle={contentContainerStyle}
    >
      {children}
    </ScrollView>
  );
}

/* ── "Our Impact" — the results wall ──────────────────────────────────────── */
// Graph-paper headline block + a two-column wall of the children behind the numbers.
// Hidden entirely while impact.achievers is empty. A card with photo: null draws a
// medal stub instead, so the wall lays out identically before the real pictures exist.
function AchieverCard({ a }) {
  return (
    <View style={s.achCard}>
      {a.photo ? (
        <Image source={{ uri: a.photo }} style={s.achImg} resizeMode="cover" />
      ) : (
        <View style={[s.achImg, s.achStub]}><Medal size={30} color="#C4CAD6" /></View>
      )}
      <View style={[s.achCap, { backgroundColor: a.bg }]}>
        <T w="xbold" s={12.5} c={C.ink} style={{ textAlign: 'center', lineHeight: 17 }}>
          {`${a.name}${a.grade ? `, ${a.grade}` : ''}`.toUpperCase()}
        </T>
        <T w="med" s={12} c={C.muted} style={{ textAlign: 'center', marginTop: 4, lineHeight: 17 }}>{a.achievement}</T>
      </View>
    </View>
  );
}

// One card of the wall, held at opacity 0 until `run` flips, then eased up into place.
function WallCard({ a, run, delay }) {
  const av = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!run) return undefined;
    const an = Animated.timing(av, {
      toValue: 1, duration: 480, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    an.start();
    return () => an.stop();
  }, [run, delay, av]);
  return (
    <Animated.View style={{
      opacity: av,
      transform: [{ translateY: av.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
    }}>
      <AchieverCard a={a} />
    </Animated.View>
  );
}

function Impact({ I, onGo }) {
  // Alternate down two columns and drop the right one, so the cards stagger instead of
  // sitting in tidy rows — the wall reads as a collage, not a table.
  const cols = [[], []];
  I.achievers.forEach((a, i) => cols[i % 2].push(a));
  const [wallShown, onWallLayout] = useRevealed();

  return (
    <Paper style={s.impact}>
      <View style={s.pad}>
        <T w="xbold" s={30} c={C.ink} style={{ textAlign: 'center', lineHeight: 38 }}>{I.title}</T>
        <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 14, lineHeight: 22 }}>{I.body}</T>
        <PressableScale style={s.impactCta} onPress={onGo}>
          <T w="xbold" s={16} c={C.ink}>{I.cta}</T>
        </PressableScale>
        {!!I.learnUrl && (
          <PressableScale style={s.learnRow} onPress={() => open(I.learnUrl)}>
            <View style={s.learnDot}><Play size={12} color={C.ink} fill={C.ink} /></View>
            <T w="bold" s={15} c={C.ink} style={{ textDecorationLine: 'underline' }}>{I.learn}</T>
          </PressableScale>
        )}
      </View>

      {/* The wall reveals as it scrolls into view, column-interleaved so the two sides
          stagger in rather than arriving as two solid blocks.
          On the y-offset constraint noted at useRevealed: this onLayout sits on the wall
          INSIDE Paper, so its y is Paper-relative — which is only equal to the content
          offset because Impact is the first section on the page, at content y = 0. The
          headline block above the wall is roughly a screen tall, so the trigger lands
          about where it should. Move Impact down the page and this needs revisiting. */}
      <View style={s.wall} onLayout={onWallLayout}>
        {cols.map((col, ci) => (
          <View key={ci} style={[s.wallCol, ci === 1 && { marginTop: 52 }]}>
            {col.map((a, i) => (
              <WallCard key={`${a.name}-${a.grade}-${i}`} a={a} run={wallShown} delay={(i * 2 + ci) * 90} />
            ))}
          </View>
        ))}
      </View>
    </Paper>
  );
}

/* ── "Research-Proven Method" — study accordion ───────────────────────────── */
// Rows open one at a time. An open row shows the study's cover/photo, the finding, and a
// "Know more" link out to it. `image` null → a stub holds the picture's exact space, so
// the row reads the same before the asset lands. `url` null → no link is drawn (a
// "Know more" that goes nowhere is worse than none). `source` is optional.
function Research({ R }) {
  const [openIdx, setOpenIdx] = useState(-1);
  const toggle = (i) => { spring(); setOpenIdx((o) => (o === i ? -1 : i)); };
  return (
    <View>
      <View style={s.pad}>
        <T w="xbold" s={26} c={C.ink} style={{ textAlign: 'center', lineHeight: 33 }}>{R.title}</T>
        <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 14, lineHeight: 21 }}>{R.body}</T>
      </View>
      <View style={{ marginTop: 26 }}>
        {R.items.map((it, i) => (
          <View key={it.headline} style={s.resItem}>
            <PressableScale style={s.resHead} onPress={() => toggle(i)}>
              <T w="med" s={15} c={C.ink} style={{ flex: 1, lineHeight: 22, paddingRight: 12 }}>{it.headline}</T>
              {openIdx === i ? <X size={19} color={C.ink} /> : <Plus size={19} color={C.ink} />}
            </PressableScale>
            {openIdx === i && (
              <View style={{ paddingBottom: 20 }}>
                {/* image null → picture-icon stub at the SAME resImg size, so opening a
                    row never jumps the accordion's height once real images land. */}
                {it.image ? (
                  <Image source={{ uri: it.image }} style={s.resImg} resizeMode="cover" />
                ) : (
                  <View style={[s.resImg, s.resStub]}><ImageIcon size={26} color="#C4CAD6" /></View>
                )}
                <T w="med" s={14} c={C.ink} style={{ marginTop: 14, lineHeight: 22 }}>{it.body}</T>
                {!!it.source && (
                  <T w="semi" s={12} c={C.faint} style={{ marginTop: 8 }}>{it.source}</T>
                )}
                {!!it.url && (
                  <PressableScale style={{ alignSelf: 'flex-start', marginTop: 8 }} onPress={() => open(it.url)}>
                    <T w="bold" s={14} c={C.ink} style={{ textDecorationLine: 'underline' }}>{it.linkLabel || 'Know more'}</T>
                  </PressableScale>
                )}
              </View>
            )}
          </View>
        ))}
        {/* closes the last row, so the stack reads as a ruled list and not an open edge */}
        <View style={{ height: 1, backgroundColor: C.border }} />
      </View>
    </View>
  );
}

/* ── Founder letter (hidden until CONTENT.about.founder is filled) ────────── */
function Founder({ f }) {
  return (
    <View style={s.founderCard}>
      {f.photo ? (
        <Image source={{ uri: f.photo }} style={s.founderImg} resizeMode="cover" />
      ) : (
        // Holds the portrait's space until a real photo URL exists — so the card
        // reads the same now as it will then, instead of collapsing.
        <View style={[s.founderImg, s.founderStub]}>
          <UserRound size={54} color="#C4CAD6" />
          <T w="med" s={12} c={C.faint} style={{ marginTop: 10 }}>Founder photo</T>
        </View>
      )}
      <View style={{ padding: 18 }}>
        <T w="xbold" s={14} c={C.orange} style={{ letterSpacing: 1 }}>{f.name.toUpperCase()}</T>
        <T w="bold" s={13} c={C.ink} style={{ marginTop: 3 }}>{f.role}</T>
        <T w="xbold" s={26} c={C.ink} style={{ marginTop: 20, lineHeight: 32 }}>{f.title}</T>
        {f.letter.map((p, i) => (
          <T key={i} w="med" s={14} c={C.ink} style={{ marginTop: 16, lineHeight: 23, opacity: 0.85 }}>{p}</T>
        ))}
      </View>
    </View>
  );
}

/* ── "How we make learning stick" — flat 2-col pastel grid ────────────────── */
function Pillars({ A }) {
  return (
    <View>
      {/* Same squared paper as the Impact wall — it carries the "worked out on paper"
          thread down the page and hands off into the pastel grid. */}
      <Paper style={[s.pad, s.paperHead]}>
        <T w="xbold" s={26} c={C.ink} style={{ textAlign: 'center', lineHeight: 32 }}>{A.pillarsTitle}</T>
        <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 10, lineHeight: 21 }}>{A.pillarsIntro}</T>
      </Paper>
      <View style={s.grid}>
        {A.pillars.map((p, i) => (
          <FadeIn key={p.title} delay={i * 50} y={10} style={s.tileWrap}>
            <View style={[s.tile, { backgroundColor: p.bg }]}>
              <T s={26}>{p.emoji}</T>
              <T w="xbold" s={14} c={C.ink} style={{ marginTop: 10, lineHeight: 19 }}>{p.title}</T>
              <T w="med" s={12.5} c={C.muted} style={{ marginTop: 5, lineHeight: 18 }}>{p.body}</T>
            </View>
          </FadeIn>
        ))}
      </View>
    </View>
  );
}

/* ── Student stories — horizontal card rail on paper ──────────────────────── */
// Photo (with the child's name chipped onto it) over a pastel block carrying the story.
// photo: null → a stub of identical size, so the rail lays out the same before the real
// pictures land. Hidden entirely while stories.items is empty.
function Stories({ S }) {
  return (
    <Paper style={s.paperSec}>
      <View style={s.pad}>
        <T w="xbold" s={26} c={C.ink} style={{ textAlign: 'center', lineHeight: 33 }}>{S.title}</T>
        {/* body empty → the rail hangs straight off the title, no dead gap under it */}
        {!!S.body && (
          <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 12, lineHeight: 21 }}>{S.body}</T>
        )}
      </View>
      <AutoRail interval={STORY_SNAP} count={S.items.length} autoplay contentContainerStyle={s.rail}>
        {S.items.map((it, i) => (
          <FadeIn key={`${it.name}-${i}`} delay={i * 70} y={10}>
            <View style={s.storyCard}>
              <View>
                {it.photo ? (
                  // contain, not cover: these are photographs of children — the frame bends
                  // to the picture, the picture is never cropped to the frame. The pastel
                  // behind it is the card's own, so the hairline gap left by the 0.83-0.87
                  // ratio spread reads as part of the card.
                  // string → a remote URL; anything else is a bundled require()
                  <Image
                    source={typeof it.photo === 'string' ? { uri: it.photo } : it.photo}
                    style={[s.storyImg, { backgroundColor: it.bg }]}
                    resizeMode="contain"
                  />
                ) : (
                  // photo null → person-icon stub, never a stand-in face. These cards are
                  // about real children; a stock portrait here would read as one of them.
                  <View style={[s.storyImg, s.resStub]}><UserRound size={40} color="#C4CAD6" /></View>
                )}
                {/* no name → no chip. An empty chip is a smudge on the photo. */}
                {!!it.name && (
                  <View style={[s.storyChip, { backgroundColor: it.bg }]}>
                    <T w="xbold" s={11} c={C.ink}>{it.name.toUpperCase()}</T>
                  </View>
                )}
              </View>
              <View style={[s.storyBody, { backgroundColor: it.bg }]}>
                <T w="xbold" s={17} c={C.ink} style={{ lineHeight: 24 }}>{it.title}</T>
                {/* a story is longer than a card — it opens in place rather than being cut */}
                {!!it.body && (
                  <Clamp text={it.body} limit={130} size={13} style={{ marginTop: 10, lineHeight: 20 }} />
                )}
              </View>
            </View>
          </FadeIn>
        ))}
      </AutoRail>
    </Paper>
  );
}

/* ── Parent voices — quote/video rail on paper ────────────────────────────── */
// A card with `url` gets a ▶ and opens the clip; a card without one is simply a quote
// card. Never a play button over nothing.
function ParentVoices({ P }) {
  return (
    <Paper style={s.paperSec}>
      <View style={s.pad}>
        <T w="xbold" s={26} c={C.ink} style={{ textAlign: 'center', lineHeight: 33 }}>{P.title}</T>
        <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 12, lineHeight: 21 }}>{P.body}</T>
      </View>
      <AutoRail interval={VOICE_SNAP} count={P.items.length} contentContainerStyle={s.rail}>
        {P.items.map((v, i) => (
          <FadeIn key={`${v.name}-${i}`} delay={i * 70} y={10}>
          <PressableScale onPress={() => open(v.url)} disabled={!v.url}>
            <View style={s.voiceCard}>
              {!!v.thumb && <Image source={{ uri: v.thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
              <View style={s.voiceQuote}>
                <T w="xbold" s={22} c={C.orange} style={{ lineHeight: 22 }}>“</T>
                <T w="bold" s={14} c="#fff" style={{ marginTop: 2, lineHeight: 20 }}>{v.quote}</T>
                <T w="xbold" s={10.5} c="rgba(255,255,255,0.66)" style={{ marginTop: 10, letterSpacing: 0.6 }}>— {v.name.toUpperCase()}</T>
              </View>
              {!!v.url && (
                <View style={s.voicePlay}><Play size={20} color="#fff" fill="#fff" /></View>
              )}
            </View>
          </PressableScale>
          </FadeIn>
        ))}
      </AutoRail>
    </Paper>
  );
}

/* ── Dark trust bar — closes the proof run ────────────────────────────────── */
// Wireframe globe behind the numbers, reusing the same orthographic projection as the
// reach globe — so the lit dots sit on real cities, not decorative noise.
function DarkGlobe() {
  const [w, setW] = useState(0);
  const R = w / 2 - 6;
  const pts = (arr) => arr.map((p) => `${(R + 6 + p.x).toFixed(1)},${(R + 6 + p.y).toFixed(1)}`).join(' ');
  const arc = (fixed, axis) => {
    const out = [];
    for (let v = -180; v <= 180; v += 4) {
      const p = axis === 'lat' ? project(fixed, v, R) : project(v / 2, fixed, R);
      if (p.z > 0.02) out.push(p);
    }
    return out;
  };
  return (
    <View style={s.darkGlobe} pointerEvents="none" onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      {R > 0 && (
        <Svg width={w} height={w}>
          <Circle cx={R + 6} cy={R + 6} r={R} stroke="rgba(255,255,255,0.10)" strokeWidth={1} fill="none" />
          {[-60, -30, 0, 30, 60].map((lat) => (
            <Polyline key={`la${lat}`} points={pts(arc(lat, 'lat'))} stroke="rgba(255,255,255,0.09)" strokeWidth={1} fill="none" />
          ))}
          {[-120, -80, -40, 0, 40, 80, 120].map((lon) => (
            <Polyline key={`lo${lon}`} points={pts(arc(lon, 'lon'))} stroke="rgba(255,255,255,0.09)" strokeWidth={1} fill="none" />
          ))}
          {CITIES.map((c) => {
            const p = project(c.lat, c.lon, R);
            if (p.z <= 0.1) return null;
            return <Circle key={c.city} cx={R + 6 + p.x} cy={R + 6 + p.y} r={2.6} fill="#22C55E" opacity={0.35 + 0.5 * p.z} />;
          })}
        </Svg>
      )}
    </View>
  );
}

function Trusted({ TR }) {
  const [pill, setPill] = useState(0);
  const [pillAuto, setPillAuto] = useState(true);
  useEffect(() => {
    if (!pillAuto || TR.pills.length < 2) return undefined;
    const t = setInterval(() => setPill((p) => (p + 1) % TR.pills.length), 2600);
    return () => clearInterval(t);
  }, [pillAuto, TR.pills.length]);

  return (
    <View style={s.trusted}>
      <DarkGlobe />

      <View style={{ alignItems: 'center', paddingHorizontal: 22 }}>
        <T w="xbold" s={24} c="#fff" style={{ textAlign: 'center', lineHeight: 34 }}>{TR.title}</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 26 }}>
          <T w="xbold" s={24} c="#00B67A">{TR.score}</T>
          <Star size={26} color="#00B67A" fill="#00B67A" />
          <T w="xbold" s={24} c="#fff">Trustpilot</T>
        </View>
        <T w="med" s={14} c="rgba(255,255,255,0.6)" style={{ marginTop: 6 }}>{TR.reviews}</T>
        <View style={{ flexDirection: 'row', gap: 22, marginTop: 16 }}>
          {TR.stats.map((st) => (
            <View key={st.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <T w="xbold" s={19} c={st.color}>{st.value}</T>
              <T w="med" s={15} c="#fff">{st.label}</T>
            </View>
          ))}
        </View>
      </View>

      {/* The transformations, as pills you can push through. The lit one steps along on
          a timer so the whole set gets read — before, index 0 was hardcoded active and
          the rest never lit at all. Tapping takes over and stops the cycle. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, gap: 12, paddingTop: 26 }}>
        {TR.pills.map((p, i) => (
          <PressableScale key={p} onPress={() => { setPillAuto(false); setPill(i); }}>
            <View style={[s.pill, i === pill && s.pillOn]}>
              <T w="semi" s={13.5} c={i === pill ? C.ink : '#fff'}>{p}</T>
            </View>
          </PressableScale>
        ))}
      </ScrollView>

      {/* Advances on its own like the stories and awards rails do — a static strip read
          as "there are only two reviews". Dragging stops the autoplay (see AutoRail). */}
      <AutoRail interval={REVIEW_SNAP} count={TR.testimonials.length} autoplay every={5000} style={s.revRail}>
        {TR.testimonials.map((r, i) => (
          <View key={`${r.name}-${i}`} style={s.tbCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <T s={14}>{r.emoji}</T>
              <T w="xbold" s={13.5} c="#fff" style={{ flex: 1, letterSpacing: 0.3 }}>{r.title.toUpperCase()}</T>
            </View>
            <T w="med" s={13.5} c="rgba(255,255,255,0.66)" style={{ marginTop: 14, lineHeight: 21 }} numberOfLines={6}>{r.body}</T>
            <View style={s.revFoot}>
              {/* The round reviewer avatar. photo → the parent's picture; no photo → their
                  initials ("Priyanka Rao · Bengaluru" → "PR") on the same faint disc.
                  Both branches wear the SAME tbAvatar style, so the circle's size and
                  borderRadius stay identical either way and the footer never shifts.
                  Initials, not a person glyph: a named review with a generic face reads
                  as stock, whereas initials read as a real person whose photo we lack.
                  White initials because tbAvatar is a translucent disc on black — this is
                  the DARK bar's avatar, distinct from ReviewCard's light one.
                  resizeMode cover because the source photos are not square — they get
                  centre-cropped into the disc rather than squashed.
                  `.filter(Boolean)` guards a stray double space in a name. */}
              {r.photo ? (
                <Image source={r.photo} style={s.tbAvatar} resizeMode="cover" />
              ) : (
                <View style={s.tbAvatar}>
                  <T w="xbold" s={13} c="#fff">
                    {r.name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </T>
                </View>
              )}
              <View style={{ alignItems: 'center', flex: 1 }}>
                <T w="bold" s={15} c="#fff">{r.name} {r.flag}</T>
                <View style={{ flexDirection: 'row', gap: 2, marginTop: 6 }}>
                  {Array.from({ length: 5 }).map((_, k) => (
                    <View key={k} style={s.tpStar}><Star size={11} color="#fff" fill="#fff" /></View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        ))}
      </AutoRail>
    </View>
  );
}

/* ── Awards & press — horizontal card rail ────────────────────────────────── */
// image null → a stub of the same size, so the rail reads the same before the photos
// land. url null → no "Read more." link is drawn.
function Awards({ AW }) {
  return (
    <View style={{ paddingTop: 36, paddingBottom: 34 }}>
      <View style={s.pad}>
        <T w="xbold" s={26} c={C.ink} style={{ textAlign: 'center', lineHeight: 33 }}>{AW.title}</T>
        <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 12, lineHeight: 21 }}>{AW.body}</T>
      </View>
      <AutoRail interval={AWARD_SNAP} count={AW.items.length} autoplay every={5000} contentContainerStyle={s.rail}>
        {AW.items.map((a, i) => (
          <FadeIn key={`${a.title}-${i}`} delay={i * 70} y={10}>
            <View style={s.awardCard}>
              {a.image ? (
                <Image source={{ uri: a.image }} style={s.awardImg} resizeMode="cover" />
              ) : (
                <View style={[s.awardImg, s.resStub]}><ImageIcon size={28} color="#C4CAD6" /></View>
              )}
              <View style={{ padding: 16 }}>
                <T w="xbold" s={17} c={C.ink} style={{ lineHeight: 24 }}>{a.title}</T>
                <T w="med" s={13.5} c={C.muted} style={{ marginTop: 10, lineHeight: 21 }}>{a.body}</T>
                {!!a.url && (
                  <PressableScale style={{ alignSelf: 'flex-start', marginTop: 10 }} onPress={() => open(a.url)}>
                    <T w="bold" s={14} c={C.ink} style={{ textDecorationLine: 'underline' }}>Read more.</T>
                  </PressableScale>
                )}
              </View>
            </View>
          </FadeIn>
        ))}
      </AutoRail>
    </View>
  );
}

/* ── Milestones — dark coverflow carousel (hidden while timeline is empty) ───
   The centred card sits at full size and full opacity; its neighbours shrink and
   fade toward the edges, so the eye is told where to read without a highlight box.
   Ported from the coverflow prototype: there, a rAF loop hand-tweened the track and
   rewrote every card's transform each frame. Here the ScrollView's own offset drives
   the interpolation, so the scale/opacity ramp is computed on the UI thread
   (useNativeDriver) and stays glued to the finger instead of chasing it. */
const TL_W = Math.round(SCREEN_W * 0.80);   // card width — the prototype's 80% viewport
const TL_SIDE = (SCREEN_W - TL_W) / 2;      // pad so card 0 starts centred
const TL_AUTOPLAY = 3400;

function Timeline({ title, items }) {
  const x = useRef(new Animated.Value(0)).current;
  const railRef = useRef(null);
  const idx = useRef(0);
  // Autoplay advances the rail, but ANY touch kills it for good. A carousel that
  // keeps yanking itself along after a parent has started reading a card is worse
  // than one that never moved.
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live || items.length < 2) return undefined;
    const t = setInterval(() => {
      idx.current = (idx.current + 1) % items.length;
      railRef.current && railRef.current.scrollTo({ x: idx.current * TL_W, animated: true });
    }, TL_AUTOPLAY);
    return () => clearInterval(t);
  }, [live, items.length]);

  return (
    <View style={s.dark}>
      <T w="xbold" s={24} c="#fff" style={{ textAlign: 'center', lineHeight: 31, paddingHorizontal: 20 }}>{title}</T>

      <Animated.ScrollView
        ref={railRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={TL_W}
        decelerationRate="fast"
        disableIntervalMomentum
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: TL_SIDE, paddingTop: 22 }}
        onScrollBeginDrag={() => setLive(false)}
        onMomentumScrollEnd={(e) => { idx.current = Math.round(e.nativeEvent.contentOffset.x / TL_W); }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: true })}
      >
        {items.map((m, i) => {
          // Distance of this card's centre from the viewport centre, in card-widths.
          const range = [(i - 1) * TL_W, i * TL_W, (i + 1) * TL_W];
          const scale = x.interpolate({ inputRange: range, outputRange: [0.84, 1, 0.84], extrapolate: 'clamp' });
          const opacity = x.interpolate({ inputRange: range, outputRange: [0.45, 1, 0.45], extrapolate: 'clamp' });
          return (
            <Animated.View
              key={`${m.year}-${i}`}
              // transformOrigin 'center 60%' in the prototype — matched here by scaling
              // about the card centre, which reads the same at this aspect ratio.
              style={{ width: TL_W, paddingHorizontal: 12, transform: [{ scale }], opacity }}
            >
              {/* image null → faint picture icon on the dark card. Dimmer than the light
                  rails' stub (0.28 white, not #C4CAD6) so it recedes on black instead of
                  glowing — the milestone's year and text stay the thing you read. */}
              {m.image ? (
                <Image source={{ uri: m.image }} style={s.tlImg} resizeMode="cover" />
              ) : (
                <View style={[s.tlImg, s.tlStub]}>
                  <ImageIcon size={30} color="rgba(255,255,255,0.28)" />
                </View>
              )}
              {!!m.caption && <T w="med" s={12} c="rgba(255,255,255,0.5)" style={{ marginTop: 10 }}>{m.caption}</T>}
              <View style={s.tlRule} />
              <T w="xbold" s={22} c="#fff" style={{ marginTop: 12 }}>{m.year}</T>
              <T w="med" s={13.5} c="rgba(255,255,255,0.72)" style={{ marginTop: 6, lineHeight: 20, minHeight: 60 }}>{m.body}</T>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      {/* Progress dots — the active one stretches into a gold bar. Tapping one jumps
          the rail, so the dots are a control, not just an indicator. */}
      {items.length > 1 && (
        <View style={s.tlDots}>
          {/* `x` is native-driven, so anything derived from it must be too — that rules
              out animating width or backgroundColor (both JS-only). The widening gold
              bar is therefore a fixed-size bar revealed by scaleX + opacity over a
              static grey dot, inside a fixed-width slot so nothing reflows. */}
          {items.map((m, i) => {
            const range = [(i - 1) * TL_W, i * TL_W, (i + 1) * TL_W];
            const scaleX = x.interpolate({ inputRange: range, outputRange: [0.35, 1, 0.35], extrapolate: 'clamp' });
            const opacity = x.interpolate({ inputRange: range, outputRange: [0, 1, 0], extrapolate: 'clamp' });
            return (
              <PressableScale
                key={`${m.year}-dot-${i}`}
                hitSlop={10}
                style={s.tlDotSlot}
                onPress={() => {
                  setLive(false);
                  idx.current = i;
                  railRef.current && railRef.current.scrollTo({ x: i * TL_W, animated: true });
                }}
              >
                <View style={s.tlDotOff} />
                <Animated.View style={[s.tlDotOn, { opacity, transform: [{ scaleX }] }]} />
              </PressableScale>
            );
          })}
        </View>
      )}
    </View>
  );
}

/* ── Dark closing: photo bands · the letter · the founder strip ───────────── */
// A hairline-split row of session/event stills. A null photo holds its cell, so the band
// keeps its shape before the real pictures land.
// Every photo on ailernova.in has a caption bar burned into the bottom ~17% of the
// file ("How Ailernova Helped Build Strong Concepts…"). A plain cover-crop into these
// cells is nearly portrait, so it trims only a few pixels and the caption stays
// visible as a stripe of someone else's typography. Anchoring the image to the TOP of
// an over-tall box pushes that band below the cell, where overflow:hidden clips it.
// RN has no object-position, so the over-tall box IS the mechanism.
const CAPTION_CROP = 52;

function BandImage({ uri }) {
  return (
    <Image
      source={{ uri }}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: -CAPTION_CROP }}
      resizeMode="cover"
    />
  );
}

function PhotoBand({ photos, style }) {
  return (
    <View style={[s.tsRow, style]}>
      {/* A slot per photo, drawn whether or not the photo exists — an entry of null keeps
          its cell and shows the picture icon. That holds the band's rhythm, so a half-
          filled band still reads as a deliberate grid instead of a collapsed row. */}
      {photos.map((p, i) => (
        <View key={i} style={s.tsCell}>
          {p
            ? <BandImage uri={p} />
            : <ImageIcon size={26} color="rgba(255,255,255,0.22)" />}
        </View>
      ))}
    </View>
  );
}

// Founder strip: media cell · credentials cell · CTA cell — hairline-split. Shared by the
// About Us movement block and the Our Impact closing, so both stay in step.
function FounderStrip({ M, name, onGo }) {
  return (
    <View style={s.strip}>
      <PressableScale style={s.stripCell} onPress={() => open(M.videoUrl)} disabled={!M.videoUrl}>
        {/* image null → person icon, centred in the cell the photo would have filled.
            The cell keeps its size either way, so the strip does not reflow later. */}
        {M.image ? (
          <Image source={{ uri: M.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <UserRound size={30} color="rgba(255,255,255,0.28)" />
        )}
        {!!M.videoUrl && <View style={s.stripPlay}><Play size={15} color={C.ink} fill={C.ink} /></View>}
      </PressableScale>

      <View style={[s.stripCell, { padding: 12, alignItems: 'flex-start', justifyContent: 'center' }]}>
        <T w="xbold" s={12} c="#fff" style={{ letterSpacing: 0.6 }}>{(name || '').toUpperCase()}</T>
        {M.credits.map((c) => (
          <T key={c} w="med" s={11.5} c="rgba(255,255,255,0.6)" style={{ marginTop: 6 }}>{c}</T>
        ))}
      </View>

      <PressableScale style={[s.stripCell, s.stripCta]} onPress={onGo}>
        <ArrowUpRight size={18} color={C.ink} style={{ alignSelf: 'flex-end' }} />
        <T w="xbold" s={14} c={C.ink} style={{ marginTop: 'auto' }}>Get{'\n'}Started</T>
      </PressableScale>
    </View>
  );
}

// "Join the Ailernova Movement" — the founder's closing note. Same block on both pages.
function Movement({ M, name, onGo }) {
  return (
    <View style={s.dark}>
      <View style={{ paddingHorizontal: 22 }}>
        <T w="xbold" s={28} c="#fff" style={{ lineHeight: 36 }}>{M.title}</T>
        <T w="med" s={14} c="rgba(255,255,255,0.72)" style={{ marginTop: 16, lineHeight: 22 }}>{M.body}</T>
      </View>
      <FounderStrip M={M} name={name} onGo={onGo} />
    </View>
  );
}

// The Our Impact closing: stills · the "it all started with a trial" letter · the strip.
function TrialStrip({ TS, M, name, onGo }) {
  return (
    <View style={s.dark}>
      <PhotoBand photos={TS.photos} />
      <View style={{ paddingHorizontal: 22, marginTop: 26 }}>
        <T w="xbold" s={30} c="#fff" style={{ lineHeight: 40 }}>{TS.title}</T>
        <T w="med" s={14} c="rgba(255,255,255,0.72)" style={{ marginTop: 20, lineHeight: 24 }}>{TS.body}</T>
      </View>
      <FounderStrip M={M} name={name} onGo={onGo} />
      {/* flush to the bottom edge — cancels the dark section's own padding */}
      {!!TS.photosBottom?.length && <PhotoBand photos={TS.photosBottom} style={{ marginTop: 0, marginBottom: -30 }} />}
    </View>
  );
}

/* ── FAQ accordion ────────────────────────────────────────────────────────── */
function Faq({ A }) {
  const [openIdx, setOpenIdx] = useState(0);
  const toggle = (i) => { spring(); setOpenIdx((o) => (o === i ? -1 : i)); };
  return (
    <View style={[s.pad, { backgroundColor: '#F6F6F7', paddingVertical: 26 }]}>
      <T w="xbold" s={24} c={C.ink} style={{ textAlign: 'center', lineHeight: 30 }}>{A.faqTitle}</T>
      <View style={{ marginTop: 18 }}>
        {A.faqs.map((f, i) => (
          <View key={f.q} style={s.faqItem}>
            <PressableScale style={s.faqHead} onPress={() => toggle(i)}>
              <T w="med" s={15} c={C.ink} style={{ flex: 1, lineHeight: 22, paddingRight: 12 }}>{f.q}</T>
              {openIdx === i ? <X size={19} color={C.ink} /> : <Plus size={19} color={C.ink} />}
            </PressableScale>
            {openIdx === i && (
              <T w="med" s={13.5} c={C.muted} style={{ lineHeight: 21, paddingBottom: 16 }}>{f.a}</T>
            )}
          </View>
        ))}
      </View>
      {/* Only drawn when there is somewhere to go. Callers that pass no seeMoreUrl
          (the Refund page, and now Referral) were rendering an underlined "See More"
          that swallowed the tap and did nothing. */}
      {!!A.seeMoreUrl && (
        <PressableScale style={{ alignSelf: 'center', marginTop: 18 }} onPress={() => open(A.seeMoreUrl)}>
          <T w="bold" s={15} c={C.ink} style={{ textDecorationLine: 'underline' }}>See More</T>
        </PressableScale>
      )}
    </View>
  );
}

/* ── The page ─────────────────────────────────────────────────────────────── */
export default function AboutStack({ onGetStarted, onImpact, onTutors, onReviews, onPricing, onFaqs, onContact, onRefund, onReferral }) {
  const A = CONTENT.about;
  const E = CONTENT.event;
  const go = () => (onGetStarted ? onGetStarted() : open(E.become.appUrl));
  // The footer's "About Us" link — we're already on that page, so it rewinds to the top
  // rather than opening a second copy of it. "Our Impact" and "Our Tutors" hand off.
  const scrollRef = useRef(null);
  const toTop = () => scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: true });
  // Know More tiles → the in-app page, where this host passed a handler for it.
  // A missing entry falls through to the tile's website url.
  const knowMoreNav = {
    faqs: onFaqs, pricing: onPricing, tutors: onTutors,
    reviews: onReviews, refund: onRefund, contact: onContact,
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* paddingBottom clears the pinned CTA so the last row is never trapped under it */}
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Rating r={A.rating} />

        <View style={[s.pad, { paddingTop: 26 }]}>
          <T w="xbold" s={30} c={C.ink} style={{ textAlign: 'center', lineHeight: 38 }}>{A.hero.title}</T>
          <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 16, lineHeight: 22 }}>{A.hero.body}</T>
        </View>

        {/* Real film when there is one; the network art holds the slot until then. */}
        {A.video ? (
          <PressableScale style={[s.pad, { marginTop: 22 }]} onPress={() => open(A.video.url)}>
            <View style={s.video}>
              <Image source={{ uri: A.video.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={s.playDot}><Play size={26} color={C.ink} fill={C.ink} /></View>
            </View>
          </PressableScale>
        ) : (
          <View style={[s.pad, { marginTop: 22 }]}>
            <HeroArt />
            <T w="med" s={12.5} c={C.faint} style={{ textAlign: 'center', marginTop: 12 }}>
              Learners across India — one session at a time.
            </T>
          </View>
        )}

        <Marquee items={A.marquee} />
        <Stats stats={A.stats} />

        {!!A.founder && <View style={[s.pad, { marginTop: 10 }]}><Founder f={A.founder} /></View>}

        <View style={{ marginTop: 30 }}><Pillars A={A} /></View>

        <View style={[s.pad, { marginTop: 34 }]}>
          <T w="xbold" s={26} c={C.ink} style={{ textAlign: 'center', lineHeight: 33 }}>{A.reach.title}</T>
          <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 12, lineHeight: 21 }}>{A.reach.body}</T>
          {A.reach.image
            ? <Image source={{ uri: A.reach.image }} style={s.reachImg} resizeMode="contain" />
            : <Globe />}
        </View>

        {!!A.timeline.length && (
          <View style={{ marginTop: 34 }}><Timeline title={A.timelineTitle} items={A.timeline} /></View>
        )}

        {!!A.investors.length && (
          <View style={[s.pad, { marginTop: 34 }]}>
            <T w="xbold" s={24} c={C.ink} style={{ textAlign: 'center', lineHeight: 31 }}>{A.investorsTitle}</T>
            <View style={[s.grid, { marginTop: 18 }]}>
              {A.investors.map((iv, i) => (
                <View key={`${iv.name}-${i}`} style={s.tileWrap}>
                  <View style={s.logoBox}>
                    {iv.logo
                      ? <Image source={{ uri: iv.logo }} style={{ width: '70%', height: 40 }} resizeMode="contain" />
                      : <T w="semi" s={12.5} c={C.faint}>{iv.name}</T>}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Know More — routes into the in-app page when this host wired one up, and
            falls back to the website otherwise, so a tile never dead-ends. Same
            fallback rule the footer accordion uses. */}
        <View style={[s.pad, { marginTop: 34 }]}>
          <T w="xbold" s={24} c={C.ink} style={{ textAlign: 'center', lineHeight: 31 }}>{A.knowMoreTitle}</T>
          {!!A.knowMoreBody && (
            <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 10, lineHeight: 21 }}>{A.knowMoreBody}</T>
          )}
          <View style={{ marginTop: 20, gap: 12 }}>
            {A.knowMore.map((k, i) => {
              const goTo = knowMoreNav[k.action];
              return (
                <FadeIn key={k.key} delay={40 + i * 60}>
                  <PressableScale onPress={() => (goTo ? goTo() : open(k.url))}>
                    <View style={s.kmRow}>
                      <View style={[s.kmIcon, { backgroundColor: k.bg }]}>
                        <Sparkles size={19} color={k.tint} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <T w="xbold" s={16} c={C.ink}>{k.title}</T>
                        <T w="med" s={13.5} c={C.muted} style={{ marginTop: 4, lineHeight: 20 }}>{k.body}</T>
                      </View>
                      <ArrowUpRight size={18} color={C.faint} />
                    </View>
                  </PressableScale>
                </FadeIn>
              );
            })}
          </View>
        </View>

        <View style={{ marginTop: 34 }}><Faq A={A} /></View>

        <Movement M={A.movement} name={A.founder?.name} onGo={go} />

        {/* Closes with the same BECOME AILERNOVA™ + footer accordions + offices block as
            the Events page, so About Us and the other sections stay reachable from here. */}
        <View style={[s.pad, { marginTop: 20 }]}>
          <BecomePage E={E} onAbout={toTop} onImpact={onImpact} onTutors={onTutors} onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onRefund={onRefund} onReferral={onReferral} onContact={onContact} />
        </View>
      </ScrollView>

      {/* Pinned CTA — floats above the scroll the whole way down. box-none lets taps
          fall through the wrapper everywhere except the button itself. */}
      <View style={s.stickyWrap} pointerEvents="box-none">
        <PressableScale style={s.sticky} onPress={go}>
          <T w="xbold" s={16} c={C.ink}>{A.cta}</T>
        </PressableScale>
      </View>
    </View>
  );
}

/* ── "Our Impact" — the proof page ────────────────────────────────────────── */
// Sits under ABOUT AILERNOVA → Our Impact, right below About Us. Where About Us tells the
// story, this page is the evidence: the wall of children · the numbers · the research ·
// how we teach · their stories · their parents · the score · the awards · the questions.
// Every section is data-driven and hides itself when its data in CONTENT.about is empty.
export function ImpactStack({ onGetStarted, onAbout, onTutors, onReviews, onPricing, onFaqs, onContact, onRefund, onReferral }) {
  const A = CONTENT.about;
  const E = CONTENT.event;
  const go = () => (onGetStarted ? onGetStarted() : open(E.become.appUrl));
  const scrollRef = useRef(null);
  const toTop = () => scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: true });
  // Feeds the scroll-triggered reveals below. Every section that uses one must stay a
  // DIRECT child of this ScrollView's contentContainer — see the note on useRevealed.
  const { ctx, onScroll } = useRevealScroll();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <RevealCtx.Provider value={ctx}>
      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
      >
        {!!A.impact?.achievers?.length && <Impact I={A.impact} onGo={go} />}

        <Stats stats={A.stats} />

        {/* Why it works, then how we do it. Both slide up as they reach the fold. */}
        {!!A.research?.items?.length && <Reveal style={{ marginTop: 34 }}><Research R={A.research} /></Reveal>}
        <Reveal style={{ marginTop: 30 }}><Pillars A={A} /></Reveal>

        {/* The proof run: the children · their parents · the score · the awards. */}
        {!!A.stories?.items?.length && <Stories S={A.stories} />}
        {!!A.parentVoices?.items?.length && <ParentVoices P={A.parentVoices} />}
        {!!A.trusted && <Trusted TR={A.trusted} />}
        {!!A.awards?.items?.length && <Awards AW={A.awards} />}

        <View style={{ marginTop: 34 }}><Faq A={A} /></View>

        {/* Closes exactly like About Us does — the trial letter, then the movement note. */}
        {!!A.trialStrip && (
          <TrialStrip TS={A.trialStrip} M={A.movement} name={A.founder?.name} onGo={go} />
        )}
        <Movement M={A.movement} name={A.founder?.name} onGo={go} />

        <View style={[s.pad, { marginTop: 20 }]}>
          {/* "Our Impact" in the footer is this page — rewind instead of stacking a copy. */}
          <BecomePage E={E} onAbout={onAbout} onImpact={toTop} onTutors={onTutors} onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onRefund={onRefund} onReferral={onReferral} onContact={onContact} />
        </View>
      </Animated.ScrollView>
      </RevealCtx.Provider>

      <View style={s.stickyWrap} pointerEvents="box-none">
        <PressableScale style={s.sticky} onPress={go}>
          <T w="xbold" s={16} c={C.ink}>{A.cta}</T>
        </PressableScale>
      </View>
    </View>
  );
}

/* ── "Our Tutors" — the who-will-teach-my-child page ──────────────────────── */
// Sits under ABOUT AILERNOVA → Our Tutors, beside About Us and Our Impact. Every section
// is data-driven off CONTENT.tutors and hides itself when its data is empty.

// The hero: a full-bleed still with the promise, the CTA and the score sitting on it.
// image null → the dark ruled surface holds the slot (it carries the graph-paper thread
// the rest of the page is built on). No ▶ is drawn unless `learnUrl` actually exists.
function TutorHero({ H, onGo }) {
  return (
    <Paper style={s.tHero} stroke="rgba(255,255,255,0.07)">
      {!!H.image && (
        <>
          <Image source={{ uri: H.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          {/* scrim — the copy has to stay legible whatever the photo does */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(12,10,9,0.55)' }]} />
        </>
      )}

      <View style={s.tHeroBody}>
        <T w="xbold" s={30} c="#fff" style={{ textAlign: 'center', lineHeight: 40 }}>{H.title}</T>
        <T w="med" s={14.5} c="rgba(255,255,255,0.78)" style={{ textAlign: 'center', marginTop: 14, lineHeight: 22 }}>{H.body}</T>

        <PressableScale style={s.tHeroCta} onPress={onGo}>
          <T w="xbold" s={16} c={C.ink}>{H.cta}</T>
        </PressableScale>

        {!!H.learnUrl && (
          <PressableScale style={s.tLearnRow} onPress={() => open(H.learnUrl)}>
            <View style={s.tLearnDot}><Play size={11} color="#fff" fill="#fff" /></View>
            <T w="bold" s={15} c="#fff" style={{ textDecorationLine: 'underline' }}>{H.learn}</T>
          </PressableScale>
        )}
      </View>

      {/* Score sits at the foot of the hero, exactly where the eye lands after the CTA. */}
      <View style={s.tHeroRating}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <T w="xbold" s={15} c="#fff">{H.rating.score}+</T>
          {!!H.rating.count && <T w="med" s={14} c="rgba(255,255,255,0.7)">· {H.rating.count}</T>}
        </View>
        <View style={{ flexDirection: 'row', gap: 3, marginTop: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={s.tpStar}><Star size={13} color="#fff" fill="#fff" /></View>
          ))}
        </View>
      </View>
    </Paper>
  );
}

// "Less Than 1% Make The Cut" — the headline, then the hiring funnel that literally
// narrows: each stage is a trapezoid band, drawn from the measured width so the sides
// meet cleanly at every seam. The bands darken as they narrow, so the squeeze is
// something you SEE. `stages` empty → the headline still stands on its own.
const FUNNEL_BAND = 118;   // band height, px
const FUNNEL_END = 0.42;   // bottom width, as a share of the top

function Funnel({ stages }) {
  const [w, setW] = useState(0);
  // Half-width of the funnel at band boundary i (0 = the mouth, n = the spout).
  const half = (i) => (w / 2) * (1 - (1 - FUNNEL_END) * (i / stages.length));
  const H = stages.length * FUNNEL_BAND;

  return (
    <View style={{ marginTop: 30 }} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      {w > 0 && (
        <>
          <Svg width={w} height={H}>
            {stages.map((st, i) => {
              const yT = i * FUNNEL_BAND;
              const yB = yT + FUNNEL_BAND;
              const hT = half(i);
              const hB = half(i + 1);
              return (
                <Polygon
                  key={st.label}
                  points={`${w / 2 - hT},${yT} ${w / 2 + hT},${yT} ${w / 2 + hB},${yB} ${w / 2 - hB},${yB}`}
                  fill={st.bg}
                />
              );
            })}
          </Svg>

          {/* Copy sits inside the band's NARROWEST width, so it can never spill past the
              sloped sides on a small screen. */}
          {stages.map((st, i) => (
            <FadeIn
              key={st.label}
              delay={i * 80}
              y={8}
              style={[s.funnelBand, { top: i * FUNNEL_BAND, width: 2 * half(i + 1) - 20, left: w / 2 - half(i + 1) + 10 }]}
            >
              <T w="xbold" s={14.5} c={C.ink} style={{ textAlign: 'center', lineHeight: 20 }}>{st.label}</T>
              <View style={s.funnelPill}>
                <T w="bold" s={12.5} c={C.muted} style={{ letterSpacing: 0.6 }}>{st.count}</T>
              </View>
            </FadeIn>
          ))}
        </>
      )}
    </View>
  );
}

function Selection({ S }) {
  const hasFunnel = !!S.stages?.length;
  return (
    <Paper style={s.paperSec}>
      <View style={s.pad}>
        <T w="xbold" s={30} c={C.ink} style={{ textAlign: 'center', lineHeight: 38 }}>{S.title}</T>
        <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 14, lineHeight: 22 }}>{S.body}</T>
      </View>

      {hasFunnel && <Funnel stages={S.stages} />}

      {/* What a certified tutor is certified FOR — hangs off the spout of the funnel. */}
      {!!S.certifications?.length && (
        <View style={{ alignItems: 'center' }}>
          {hasFunnel && <View style={s.certStem} />}
          <View style={s.certCard}>
            <T w="bold" s={13.5} c={C.faint} style={{ letterSpacing: 1.2 }}>{S.certificationsTitle}</T>
            {S.certifications.map((c) => (
              <View key={c.label} style={s.certRow}>
                <T s={16}>{c.emoji}</T>
                <T w="med" s={15} c={C.ink}>{c.label}</T>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Hiring is where it starts, not where it stops. */}
      {!!S.ongoing && (
        <View style={[s.pad, { marginTop: 22 }]}>
          <View style={s.ongoingNote}>
            <T w="med" s={17} c={C.ink} style={{ textAlign: 'center', lineHeight: 25 }}>{S.ongoing.title}</T>
            <T w="med" s={13.5} c={C.muted} style={{ textAlign: 'center', marginTop: 10, lineHeight: 21 }}>{S.ongoing.body}</T>
          </View>
        </View>
      )}
    </Paper>
  );
}

// How our tutors teach — the horizontal rail of what actually happens in a session.
// A saturated art block over a tinted body. `image` null → the glyph block holds the art's
// exact space, so the rail lays out identically once real illustrations land.
function Teaching({ TE }) {
  return (
    <Paper style={s.paperSec}>
      <View style={s.pad}>
        <T w="xbold" s={26} c={C.ink} style={{ textAlign: 'center', lineHeight: 34 }}>{TE.title}</T>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail}>
        {TE.items.map((it, i) => (
          <FadeIn key={it.title} delay={i * 70} y={10}>
            <View style={s.teachCard}>
              {it.image ? (
                <Image source={{ uri: it.image }} style={s.teachArt} resizeMode="cover" />
              ) : (
                <View style={[s.teachArt, { backgroundColor: it.bg }]}><T s={64}>{it.emoji}</T></View>
              )}
              <View style={[s.teachBody, { backgroundColor: it.tint }]}>
                <T w="xbold" s={19} c={C.ink} style={{ lineHeight: 26 }}>{it.title}</T>
                <T w="med" s={13.5} c={C.muted} style={{ marginTop: 10, lineHeight: 21 }}>{it.body}</T>
              </View>
            </View>
          </FadeIn>
        ))}
      </ScrollView>
    </Paper>
  );
}

// What every tutor brings — the same pastel grid as About Us → Pillars, on paper.
function Qualities({ Q }) {
  return (
    <View>
      <Paper style={[s.pad, s.paperHead]}>
        <T w="xbold" s={26} c={C.ink} style={{ textAlign: 'center', lineHeight: 33 }}>{Q.title}</T>
        <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 10, lineHeight: 21 }}>{Q.intro}</T>
      </Paper>
      <View style={s.grid}>
        {Q.items.map((q, i) => (
          <FadeIn key={q.title} delay={i * 50} y={10} style={s.tileWrap}>
            <View style={[s.tile, { backgroundColor: q.bg }]}>
              <T s={26}>{q.emoji}</T>
              <T w="xbold" s={14} c={C.ink} style={{ marginTop: 10, lineHeight: 19 }}>{q.title}</T>
              <T w="med" s={12.5} c={C.muted} style={{ marginTop: 5, lineHeight: 18 }}>{q.body}</T>
            </View>
          </FadeIn>
        ))}
      </View>
    </View>
  );
}

// The tutor rail — real people, hidden entirely while `meet.items` is empty. photo null →
// a portrait stub of identical size, so the rail lays out the same before the photos land.
function MeetTutors({ M }) {
  return (
    <View style={{ paddingTop: 38, paddingBottom: 36 }}>
      <View style={s.pad}>
        <T w="xbold" s={26} c={C.ink} style={{ textAlign: 'center', lineHeight: 33 }}>{M.title}</T>
        <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 12, lineHeight: 21 }}>{M.body}</T>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail}>
        {M.items.map((t, i) => (
          <FadeIn key={`${t.name}-${i}`} delay={i * 70} y={10}>
            <View style={s.tutorCard}>
              {/* string → remote URL, anything else → a bundled require(). photo null →
                  person-icon stub: these are named, real tutors, so an invented face
                  beside a real person's name is the one thing not to draw here. */}
              {t.photo ? (
                <Image source={typeof t.photo === 'string' ? { uri: t.photo } : t.photo} style={s.tutorImg} resizeMode="cover" />
              ) : (
                <View style={[s.tutorImg, s.resStub]}><UserRound size={44} color="#C4CAD6" /></View>
              )}
              <View style={[s.tutorBody, { backgroundColor: t.bg }]}>
                <T w="xbold" s={17} c={C.ink}>{t.name}</T>
                <T w="bold" s={12.5} c={C.orange} style={{ marginTop: 4, letterSpacing: 0.4 }}>
                  {`${t.subject}${t.grades ? ` · ${t.grades}` : ''}`.toUpperCase()}
                </T>
                {!!t.experience && (
                  <T w="med" s={13} c={C.muted} style={{ marginTop: 10, lineHeight: 19 }}>{t.experience}</T>
                )}
                {!!t.credential && (
                  <View style={s.tutorChip}>
                    <Medal size={12} color={C.ink} />
                    <T w="semi" s={11.5} c={C.ink}>{t.credential}</T>
                  </View>
                )}
              </View>
            </View>
          </FadeIn>
        ))}
      </ScrollView>
    </View>
  );
}

// "Students ❤️ Our Tutors" — the wall of real thank-you notes. A rail of polaroid
// note cards, each a photo a child (or parent) actually sent, tilted like they were
// pinned to a board. EMPTY ON PURPOSE until real notes are added WITH consent — the
// whole section then hides itself. Never invent a note.
function StudentNotes({ M }) {
  return (
    <View style={{ paddingTop: 34, paddingBottom: 30 }}>
      <View style={s.pad}>
        <T w="xbold" s={26} c={C.ink} style={{ textAlign: 'center', lineHeight: 33 }}>{M.title}</T>
        <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 12, lineHeight: 21 }}>{M.body}</T>
      </View>
      {!!M.items.length && (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail}>
        {M.items.map((n, i) => (
          <FadeIn key={`${n.caption || 'note'}-${i}`} delay={i * 70} y={10}>
            <View style={[s.noteCard, { transform: [{ rotate: i % 2 ? '2deg' : '-2deg' }] }]}>
              {/* string → remote URL, anything else → a bundled require(). image null →
                  picture-icon stub at the same noteImg size, so the tilted note keeps its
                  shape (the ±2deg rotation above needs a stable box to rotate about). */}
              {n.image ? (
                <Image source={typeof n.image === 'string' ? { uri: n.image } : n.image} style={s.noteImg} resizeMode="cover" />
              ) : (
                <View style={[s.noteImg, s.resStub]}><ImageIcon size={40} color="#C4CAD6" /></View>
              )}
              {!!n.caption && (
                <T w="semi" s={12.5} c={C.muted} style={{ marginTop: 10, textAlign: 'center' }}>{n.caption}</T>
              )}
            </View>
          </FadeIn>
        ))}
      </ScrollView>
      )}
    </View>
  );
}

// "Ailernova Tutors Are Different" — the two-column comparison table. Left = us (gold
// header, green ticks, cream cells); right = everyone else (grey header, red crosses).
// A round VS badge sits on the divider between the two headers. Hidden when rows empty.
function TutorsDifferent({ D }) {
  return (
    <View style={{ paddingTop: 34, paddingBottom: 30 }}>
      <View style={{ paddingHorizontal: 12 }}>
        {/* one line, always — shrinks to fit the width rather than wrapping */}
        <T w="xbold" s={26} c={C.ink} numberOfLines={1} adjustsFontSizeToFit style={{ textAlign: 'center' }}>{D.title}</T>
      </View>
      <View style={s.cmpWrap}>
        <View style={s.cmpHeadRow}>
          <View style={[s.cmpHeadCell, { backgroundColor: C.gold }]}>
            <T w="xbold" s={14} c={C.ink} style={{ letterSpacing: 0.6 }}>{D.us}</T>
          </View>
          <View style={[s.cmpHeadCell, { backgroundColor: '#E3E4E6' }]}>
            <T w="xbold" s={13} c={C.muted} style={{ letterSpacing: 0.6 }}>{D.them}</T>
          </View>
          <View style={s.cmpVs}><T w="xbold" s={12} c={C.muted}>VS</T></View>
        </View>
        {D.rows.map((r, i) => (
          <View key={i} style={s.cmpRow}>
            <View style={[s.cmpCell, s.cmpCellUs]}>
              <View style={s.cmpTick}><Check size={13} color="#fff" strokeWidth={3} /></View>
              <T w="semi" s={13.5} c={C.ink} style={{ flex: 1, lineHeight: 19 }}>{r.us}</T>
            </View>
            <View style={[s.cmpCell, s.cmpCellThem]}>
              <View style={s.cmpCross}><X size={13} color="#fff" strokeWidth={3} /></View>
              <T w="med" s={13} c={C.muted} style={{ flex: 1, lineHeight: 19 }}>{r.them}</T>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// How the match happens — a numbered spine you read straight down, ending at the demo.
function Match({ M }) {
  return (
    <View style={s.dark}>
      <View style={{ paddingHorizontal: 22 }}>
        <T w="xbold" s={26} c="#fff" style={{ lineHeight: 34 }}>{M.title}</T>
        <T w="med" s={14} c="rgba(255,255,255,0.72)" style={{ marginTop: 14, lineHeight: 22 }}>{M.body}</T>
      </View>
      <View style={{ paddingHorizontal: 22, marginTop: 26 }}>
        {M.steps.map((st, i) => (
          <FadeIn key={st.n} delay={i * 70} y={10}>
            <View style={s.stepRow}>
              <View style={{ alignItems: 'center' }}>
                <View style={s.stepDot}><T w="xbold" s={13} c={C.ink}>{st.n}</T></View>
                {/* the spine — every step but the last one hands down to the next */}
                {i < M.steps.length - 1 && <View style={s.stepLine} />}
              </View>
              <View style={{ flex: 1, paddingBottom: 22 }}>
                <T w="xbold" s={15.5} c="#fff" style={{ lineHeight: 21 }}>{st.title}</T>
                <T w="med" s={13} c="rgba(255,255,255,0.66)" style={{ marginTop: 6, lineHeight: 20 }}>{st.body}</T>
              </View>
            </View>
          </FadeIn>
        ))}
      </View>
    </View>
  );
}

export function TutorsStack({ onGetStarted, onAbout, onImpact, onReviews, onPricing, onFaqs, onContact, onRefund, onReferral }) {
  const TU = CONTENT.tutors;
  const A = CONTENT.about;
  const E = CONTENT.event;
  const go = () => (onGetStarted ? onGetStarted() : open(E.become.appUrl));
  const scrollRef = useRef(null);
  const toTop = () => scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: true });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* The promise · the proof · the bar we hold them to · what they bring · who they
            are · how you get one. */}
        <TutorHero H={TU.hero} onGo={go} />
        {!!TU.trusted && <Trusted TR={TU.trusted} />}
        {!!TU.selection && <Selection S={TU.selection} />}
        {!!TU.teaching?.items?.length && <Teaching TE={TU.teaching} />}
        {!!TU.meet?.items?.length && <MeetTutors M={TU.meet} />}
        {!!TU.notes && <StudentNotes M={TU.notes} />}
        {!!TU.different?.rows?.length && <TutorsDifferent D={TU.different} />}

        {/* Tutor FAQ — falls back to the shared About FAQ set if none are written. */}
        <View style={{ marginTop: 34 }}>
          <Faq A={{ faqTitle: TU.faqTitle, faqs: TU.faqs?.length ? TU.faqs : A.faqs, seeMoreUrl: A.seeMoreUrl }} />
        </View>

        {/* Still removed from Our Tutors per request: "What Every Ailernova Tutor Brings"
            (Qualities) and "How We Find Your Child's Tutor" (Match). Their definitions are
            kept in place so the sections are easy to restore. */}

        <Movement M={A.movement} name={A.founder?.name} onGo={go} />

        <View style={[s.pad, { marginTop: 20 }]}>
          {/* "Our Tutors" in the footer is this page — rewind instead of stacking a copy. */}
          <BecomePage E={E} onAbout={onAbout} onImpact={onImpact} onTutors={toTop} onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onRefund={onRefund} onReferral={onReferral} onContact={onContact} />
        </View>
      </ScrollView>

      <View style={s.stickyWrap} pointerEvents="box-none">
        <PressableScale style={s.sticky} onPress={go}>
          <T w="xbold" s={16} c={C.ink}>{TU.hero.cta}</T>
        </PressableScale>
      </View>
    </View>
  );
}

/* ── Parent Reviews — "What Parents Say" (see CONTENT.reviews) ───────────────── */
// Long copy collapses to a stub that ends in an inline "Read More". The cut is made in JS
// on a word boundary rather than with numberOfLines, because that is what lets the link
// sit at the END of the last line (a numberOfLines clamp would drop it entirely).
function Clamp({ text, limit, size = 13.5, c = C.muted, style }) {
  const [open, setOpen] = useState(false);
  const long = text.length > limit;
  // lastIndexOf can miss (one very long word) — fall back to a hard cut at the limit.
  const cut = text.lastIndexOf(' ', limit);
  const stub = `${text.slice(0, cut > 0 ? cut : limit).trimEnd()}… `;
  return (
    <T w="med" s={size} c={c} style={style}>
      {long && !open ? stub : `${text} `}
      {long && (
        <T
          w="bold" s={size} c={C.ink} style={{ textDecorationLine: 'underline' }}
          onPress={() => { spring(); setOpen((o) => !o); }}
        >
          {open ? 'Read Less' : 'Read More'}
        </T>
      )}
    </T>
  );
}

// Tags cycle three tints so a card of three reads as three distinct notes, not a block.
const TAG_BG = ['#D6F5E0', '#FBE7D8', '#E0EEFB'];

function ReviewCard({ r }) {
  return (
    <View style={s.revCard}>
      {/* 105 ≈ three lines at this width — the real reviews run 90-130 characters, so the
          shortest sit whole and the longer ones earn their Read More. */}
      <Clamp text={`“${r.quote}”`} limit={105} c={C.ink} style={{ lineHeight: 20 }} />
      {!!r.tags?.length && (
        <View style={s.revTags}>
          {r.tags.map((t, i) => (
            <View key={i} style={[s.revTag, { backgroundColor: TAG_BG[i % TAG_BG.length] }]}>
              <T w="semi" s={11} c={C.ink}>{t}</T>
            </View>
          ))}
        </View>
      )}
      <View style={s.revWho}>
        {/* Same three-way avatar as the dark trust bar (see Trusted), in this card's light
            palette: photo → the parent's picture; no photo but a name → their initials;
            neither → the person glyph. Initials beat the glyph for a named review — a
            real name over a generic face reads as stock. All three branches share the
            revAvatar style, so the disc is one size and the row never shifts.
            `.filter(Boolean)` guards a double space in a name ("Olga  R" → "OR", not a
            crash on n[0] of an empty segment). */}
        {r.photo ? (
          <Image source={r.photo} style={s.revAvatar} resizeMode="cover" />
        ) : r.name ? (
          <View style={s.revAvatar}>
            <T w="xbold" s={12} c={C.muted}>
              {r.name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </T>
          </View>
        ) : (
          <View style={s.revAvatar}><UserRound size={18} color="#C4CAD6" /></View>
        )}
        <View style={{ flex: 1 }}>
          <T w="xbold" s={13} c={C.ink}>{`${r.name}${r.flag ? ` ${r.flag}` : ''}`}</T>
          {!!(r.place || r.grade) && (
            <T w="med" s={11.5} c={C.muted}>{[r.place, r.grade].filter(Boolean).join(' · ')}</T>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 1 }}>
          {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={12} color="#00B67A" fill="#00B67A" />)}
        </View>
      </View>
    </View>
  );
}

// One theme (e.g. "Tutor Quality") — a tap-to-expand row that reveals a summary and a
// horizontal rail of the reviews under that theme. Hidden when it has no reviews.
// Accordion: exactly one theme is open at a time, so `open`/`onToggle` are owned by the
// page rather than by each row. With per-row state every row a parent tapped stayed
// open and the section grew into a wall of stacked rails.
function ThemeRow({ th, open, onToggle }) {
  return (
    <View style={s.themeRow}>
      <PressableScale onPress={() => { spring(); onToggle(); }} style={s.themeHead}>
        <T w="xbold" s={18} c={C.ink} style={{ flex: 1, paddingRight: 12 }}>{th.title}</T>
        {open ? <X size={22} color={C.ink} /> : <Plus size={22} color={C.ink} />}
      </PressableScale>
      {open && (
        <View>
          <Clamp text={th.summary} limit={100} style={{ marginTop: 8, lineHeight: 21 }} />
          {/* breaks the page's 22pt gutter on purpose, so the rail runs to the edge and
              reads as scrollable instead of ending in dead margin */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.revRailOut} contentContainerStyle={s.revRailIn}>
            {th.reviews.map((r, i) => <ReviewCard key={i} r={r} />)}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// The Parent Reviews hero: a full-bleed still with the trust pill, the promise, the CTA
// and the score sitting on it — the same construction as the Our Tutors hero, so the two
// entry pages read as one family. `image` null → the dark ruled surface holds the photo's
// slot. The score sits bottom-left, where the eye lands after the CTA.
function ReviewsHero({ H, onGo }) {
  return (
    <Paper style={s.rHero} stroke="rgba(255,255,255,0.07)">
      {!!H.image && (
        <>
          <Image source={typeof H.image === 'string' ? { uri: H.image } : H.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
          {/* scrim — the copy has to stay legible whatever the photo does */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(12,10,9,0.55)' }]} />
        </>
      )}

      <View style={s.rHeroBody}>
        <View style={s.rTrustPill}>
          <View style={{ flexDirection: 'row' }}>
            {/* The overlapping face stack in the "Trusted by 200K+ learners" pill. Five
                fixed icon chips, not data — nothing feeds this, so it stays generic
                glyphs on purpose rather than five real customers' faces used as decor.
                marginLeft -9 on all but the first is what makes them overlap. */}
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={[s.rPillAvatar, { marginLeft: i ? -9 : 0 }]}><UserRound size={13} color="#C4CAD6" /></View>
            ))}
          </View>
          <T w="med" s={13} c={C.ink}>
            {`${H.trustPre} `}<T w="xbold" s={13} c={C.ink}>{H.trustNum}</T>{` ${H.trustPost}`}
          </T>
        </View>

        <T w="xbold" s={32} c="#fff" style={{ textAlign: 'center', marginTop: 22, lineHeight: 42 }}>{H.title}</T>
        <T w="med" s={14.5} c="rgba(255,255,255,0.78)" style={{ textAlign: 'center', marginTop: 14, lineHeight: 22 }}>{H.body}</T>

        <PressableScale style={s.rHeroCta} onPress={onGo}>
          <T w="xbold" s={16} c={C.ink}>{H.cta}</T>
        </PressableScale>

        {!!H.learnUrl && (
          <PressableScale style={s.tLearnRow} onPress={() => open(H.learnUrl)}>
            <View style={s.tLearnDot}><Play size={11} color="#fff" fill="#fff" /></View>
            <T w="bold" s={15} c="#fff" style={{ textDecorationLine: 'underline' }}>{H.learn}</T>
          </PressableScale>
        )}
      </View>

      <View style={s.rHeroRating}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <T w="xbold" s={15} c="#fff">{`${H.rating.score}+`}</T>
          {!!H.rating.label && <T w="med" s={14} c="rgba(255,255,255,0.7)">· {H.rating.label}</T>}
        </View>
        <View style={{ flexDirection: 'row', gap: 3, marginTop: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={s.tpStar}><Star size={13} color="#fff" fill="#fff" /></View>
          ))}
        </View>
      </View>
    </Paper>
  );
}

// The accolade strip that sits directly under the hero — scrolls sideways when the
// badges outrun the width. Hidden entirely while `badges` is empty.
function ReviewsBadges({ items }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.rBadgeBar} contentContainerStyle={s.rBadgeRow}>
      {items.map((b, i) => (
        <View key={i} style={s.rBadge}>
          {!!b.starred && <Sparkles size={14} color={C.gold} />}
          <T w="semi" s={14} c={C.ink}>{b.label}</T>
        </View>
      ))}
    </ScrollView>
  );
}

export function ReviewsStack({ onGetStarted, onAbout, onImpact, onTutors, onPricing, onFaqs, onContact, onRefund, onReferral }) {
  const R = CONTENT.reviews;
  const A = CONTENT.about;
  const E = CONTENT.event;
  const go = () => (onGetStarted ? onGetStarted() : open(E.become.appUrl));
  const scrollRef = useRef(null);
  const toTop = () => scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: true });
  const [openTheme, setOpenTheme] = useState(-1);   // -1 = all closed

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ReviewsHero H={R.hero} onGo={go} />
        {!!R.hero.badges?.length && <ReviewsBadges items={R.hero.badges} />}

        {/* The proof block: the promise, the score, the pairs — then the themes hanging
            off it. Sits on the page's grey surface so it reads as one panel. */}
        <View style={s.why}>
          <View style={s.pad}>
            <T w="xbold" s={27} c={C.ink} style={{ textAlign: 'center', lineHeight: 36 }}>{R.whyTitle}</T>
            <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 10, lineHeight: 22 }}>{R.whyBody}</T>

            <View style={s.whyScore}>
              <T w="xbold" s={22} c={C.green}>{`${R.whyRating.score}+`}</T>
              <Star size={18} color={C.green} fill={C.green} />
              <T w="med" s={16} c={C.muted}>{R.whyRating.label}</T>
            </View>

            <View style={s.whyPairs}>
              {R.stats.map((st, i) => (
                <React.Fragment key={st.label}>
                  {i > 0 && <View style={s.whyDivider} />}
                  <View style={s.whyPair}>
                    <T w="xbold" s={19} c={st.color}>{st.value}</T>
                    <T w="med" s={15} c={C.muted}>{st.label}</T>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>

          <View style={[s.pad, { marginTop: 34 }]}>
            {R.themes.filter((t) => t.reviews?.length).map((th, i) => (
              <ThemeRow
                key={i}
                th={th}
                open={openTheme === i}
                onToggle={() => setOpenTheme((cur) => (cur === i ? -1 : i))}
              />
            ))}
            {/* closes the last row, so the stack reads as a ruled list, not an open edge */}
            <View style={{ height: 1, backgroundColor: C.ink }} />
          </View>
        </View>

        {/* The themes are what parents said; the stories are the children they said it
            about. Same block as About Us → Our Impact, reading off the same
            CONTENT.about.stories — one set of student stories, not a second copy to keep
            in step. Hidden until real, consented stories exist. */}
        {!!A.stories?.items?.length && <Stories S={A.stories} />}

        {!!R.reads?.items?.length && (
          <View style={{ marginTop: 30 }}>
            <T w="xbold" s={26} c={C.ink} style={{ textAlign: 'center' }}>{R.reads.title}</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail}>
              {R.reads.items.map((a, i) => (
                <PressableScale key={i} onPress={() => a.url && open(a.url)} style={s.readCard}>
                  {/* Always the icon — these cards carry no image field yet, so the
                      header is a tinted band with a picture glyph rather than art.
                      Add `a.image` + a conditional here when the reads get thumbnails. */}
                  <View style={s.readImg}><ImageIcon size={34} color="#9FD4F5" /></View>
                  <T w="xbold" s={16} c={C.ink} style={{ marginTop: 12, lineHeight: 21 }}>{a.title}</T>
                  <T w="med" s={12.5} c={C.muted} style={{ marginTop: 8, lineHeight: 18 }}>{a.blurb}</T>
                  <T w="semi" s={11.5} c={C.muted} style={{ marginTop: 12 }}>{a.by}</T>
                </PressableScale>
              ))}
            </ScrollView>
          </View>
        )}

        {/* The questions a parent is left holding after reading the reviews. Same accordion
            as About Us and Our Tutors, on its own review-specific set. */}
        <View style={{ marginTop: 34 }}>
          <Faq A={{ faqTitle: R.faqTitle, faqs: R.faqs, seeMoreUrl: R.seeMoreUrl }} />
        </View>

        <Movement M={A.movement} name={A.founder?.name} onGo={go} />

        <View style={[s.pad, { marginTop: 20 }]}>
          <BecomePage E={E} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors} onReviews={toTop} onPricing={onPricing} onFaqs={onFaqs} onRefund={onRefund} onReferral={onReferral} onContact={onContact} />
        </View>
      </ScrollView>

      <View style={s.stickyWrap} pointerEvents="box-none">
        <PressableScale style={s.sticky} onPress={go}>
          <T w="xbold" s={16} c={C.ink}>{R.stickyCta}</T>
        </PressableScale>
      </View>
    </View>
  );
}

/* ── Pricing — "Simple Pricing, Clear Value." (see CONTENT.pricing) ──────────── */
// Same bones as the other ABOUT AILERNOVA pages: the dark ruled hero, then the content on
// paper, then the pinned CTA. What is different is what it owes the reader — these are
// figures a parent pays, so the struck-through price, the billed total and the GST line
// are never dropped to tidy the layout.
// A plan: a saturated header band carrying the term, then a tinted body carrying the
// money. The term splits — the number is what a parent scans, the unit is not.
function PlanCard({ p }) {
  return (
    <View style={[s.planCard, { borderColor: p.head }]}>
      <View style={[s.planHead, { backgroundColor: p.head }]}>
        <T w="xbold" s={30} c={C.ink}>{p.name.split(' ')[0]}</T>
        <T w="bold" s={17} c={C.ink}>{p.name.split(' ').slice(1).join(' ')}</T>
      </View>

      <View style={[s.planBody, { backgroundColor: p.tint }]}>
        {/* Struck-through price and the discount travel together — "20% OFF" beside no
            original number is a claim about nothing. Neither is drawn without the other. */}
        {!!p.was && !!p.off && (
          <View style={s.planWasRow}>
            <T w="med" s={15} c={C.muted} style={{ textDecorationLine: 'line-through' }}>{`${p.was}${p.unit}`}</T>
            <View style={s.planOff}><T w="xbold" s={11} c="#fff">{p.off}</T></View>
          </View>
        )}

        <View style={s.planPriceRow}>
          <T w="xbold" s={34} c={C.ink}>{p.per}</T>
          <T w="bold" s={16} c={C.ink}>{p.unit}</T>
        </View>

        <View style={{ gap: 10, marginTop: 12 }}>
          <View style={s.planTickRow}>
            <Check size={15} color="#00B259" strokeWidth={4} />
            <T w="semi" s={14} c={C.ink} style={{ flex: 1 }}>{p.classes}</T>
          </View>
          <View style={s.planTickRow}>
            <Check size={15} color="#00B259" strokeWidth={4} />
            <T w="med" s={14} c={C.ink} style={{ flex: 1 }}>
              <T w="xbold" s={14} c={C.ink}>{p.billed.split(' billed')[0]}</T>{` billed${p.billed.split(' billed')[1]}`}
            </T>
          </View>
          {p.features.map((f) => (
            <View key={f} style={s.planTickRow}>
              <Check size={15} color="#00B259" strokeWidth={4} />
              <T w="med" s={14} c={C.ink} style={{ flex: 1 }}>{f}</T>
            </View>
          ))}
        </View>

        {!!p.badge && (
          <View style={s.planBadge}><T w="xbold" s={10.5} c={C.ink} style={{ letterSpacing: 0.3 }}>{p.badge.toUpperCase()}</T></View>
        )}
      </View>
    </View>
  );
}

// GRADES — a real select. It carries two brackets because Ailernova teaches two; only one
// of them has a published price, and picking the other says so rather than inventing one.
function GradePicker({ label, values, value, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ alignItems: 'center' }}>
      <T w="xbold" s={13} c={C.ink} style={{ letterSpacing: 0.8 }}>{label}</T>
      <PressableScale style={s.selBox} onPress={() => { spring(); setOpen((o) => !o); }}>
        <T w="bold" s={17} c={C.ink}>{value}</T>
        <ChevronDown size={20} color={C.ink} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </PressableScale>
      {open && (
        <View style={s.selList}>
          {values.map((v) => (
            <PressableScale
              key={v}
              style={[s.selItem, v === value && { backgroundColor: '#F5F5F5' }]}
              onPress={() => { spring(); onPick(v); setOpen(false); }}
            >
              <T w={v === value ? 'bold' : 'med'} s={15} c={C.ink}>{v}</T>
              {v === value && <Check size={16} color={C.ink} strokeWidth={3} />}
            </PressableScale>
          ))}
        </View>
      )}
    </View>
  );
}

export function PricingStack({ onGetStarted, onAbout, onImpact, onTutors, onReviews, onFaqs, onContact, onRefund, onReferral }) {
  const P = CONTENT.pricing;
  const A = CONTENT.about;
  const E = CONTENT.event;
  const go = () => (onGetStarted ? onGetStarted() : open(E.become.appUrl));
  const scrollRef = useRef(null);
  const toTop = () => scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: true });

  const [grade, setGrade] = useState(P.grades[0]);
  const [cadence, setCadence] = useState(P.cadences[0].id);
  const plans = P.tables[`${grade}|${cadence}`];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Ruled paper, not a dark hero — the money sits on the same squared surface the
            rest of the section works on. */}
        <Paper style={{ paddingTop: 34, paddingBottom: 30 }}>
          <View style={s.pad}>
            <T w="xbold" s={27} c={C.ink} style={{ textAlign: 'center', lineHeight: 35 }}>{P.hero.title}</T>
            <T w="med" s={14.5} c={C.muted} style={{ textAlign: 'center', marginTop: 10, lineHeight: 22 }}>{P.hero.body}</T>
          </View>

          <View style={{ marginTop: 24 }}>
            <GradePicker label={P.gradesLabel} values={P.grades} value={grade} onPick={setGrade} />
          </View>

          {/* Cadence — the recommended one wears its flag above the seam, so the tab reads
              as part of that half and not as a heading for the pair. */}
          <View style={s.segWrap}>
            {P.cadences.map((c) => {
              const on = c.id === cadence;
              return (
                <View key={c.id} style={{ flex: 1 }}>
                  {c.recommended ? (
                    <View style={s.segFlag}><T w="xbold" s={10.5} c="#fff" style={{ letterSpacing: 0.4 }}>MOST RECOMMENDED</T></View>
                  ) : <View style={{ height: 22 }} />}
                  <PressableScale
                    style={[s.segBtn, on ? s.segOn : s.segOff]}
                    onPress={() => { spring(); setCadence(c.id); }}
                  >
                    <T w={on ? 'xbold' : 'med'} s={15} c={on ? '#fff' : C.ink}>{c.label}</T>
                  </PressableScale>
                </View>
              );
            })}
          </View>
        </Paper>

        {plans ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.planRail}>
              {plans.map((p, i) => (
                <FadeIn key={p.name} delay={i * 70} y={12}><PlanCard p={p} /></FadeIn>
              ))}
            </ScrollView>
            <View style={s.pad}>
              <T w="med" s={12} c={C.muted} style={{ textAlign: 'center', marginTop: 18 }}>{P.note}</T>
            </View>
            {/* Three white boxes on a grey shelf — what you get regardless of which plan. */}
            <View style={s.pAssure}>
              {P.assurances.map((a) => (
                <View key={a.label} style={s.pAssureBox}>
                  <T s={26}>{a.emoji}</T>
                  <T w="bold" s={13} c={C.ink} style={{ textAlign: 'center', marginTop: 8, lineHeight: 19 }}>{a.label}</T>
                </View>
              ))}
            </View>
          </>
        ) : (
          // No published price for this combination. Say so and hand the parent to someone
          // who knows — never show a number we cannot stand behind.
          <View style={[s.pad, { paddingTop: 24 }]}>
            <View style={s.askCard}>
              <T w="xbold" s={19} c={C.ink} style={{ textAlign: 'center', lineHeight: 26 }}>{P.noPrice.title}</T>
              <T w="med" s={13.5} c={C.muted} style={{ textAlign: 'center', marginTop: 10, lineHeight: 20 }}>{P.noPrice.body}</T>
              <PressableScale style={s.askCta} onPress={() => open(P.noPrice.url)}>
                <T w="xbold" s={14.5} c={C.ink}>{P.noPrice.cta}</T>
              </PressableScale>
            </View>
          </View>
        )}

        {/* The title sits in its own bordered box ON the paper, so it reads as a card
            pinned to the sheet rather than a heading floating over it. */}
        <Paper style={{ paddingTop: 34, paddingBottom: 0 }}>
          <View style={[s.pad, { alignItems: 'center' }]}>
            <View style={s.incTitleBox}>
              <T w="xbold" s={27} c={C.ink} style={{ textAlign: 'center' }}>{P.includedTitle}</T>
            </View>
          </View>
        </Paper>
        {/* Eight white cells split by hairlines — one table, not eight cards. The right
            and bottom edges are drawn by the wrapper so the outer rule never doubles. */}
        <View style={s.incGrid}>
          {P.included.map((it, i) => (
            <FadeIn key={it.title} delay={i * 50} y={10} style={s.incCellWrap}>
              <View style={s.incCell}>
                <T w="xbold" s={40} c={it.tint} style={{ lineHeight: 48 }}>{it.glyph}</T>
                <T w="xbold" s={17} c={C.ink} style={{ textAlign: 'center', marginTop: 14, lineHeight: 24 }}>{it.title}</T>
              </View>
            </FadeIn>
          ))}
        </View>

        {/* The promise the free trial actually makes — it earns a whole black screen. */}
        <View style={s.promise}>
          <T w="xbold" s={27} c="#fff" style={{ textAlign: 'center', lineHeight: 38 }}>{P.promise}</T>
          <T w="med" s={15} c="rgba(255,255,255,0.72)" style={{ textAlign: 'center', marginTop: 16 }}>{P.promiseSub}</T>
        </View>

        {/* The four steps as full-bleed bands: you scroll THROUGH the funnel, one colour
            at a time, instead of reading a list about it. */}
        {P.steps.map((st) => (
          <View key={st.n} style={[s.stepBand, { backgroundColor: st.bg }]}>
            <T w="xbold" s={19} c={C.ink}>{`${st.n}. ${st.title}`}</T>
            <View style={s.stepBandRow}>
              <T w="med" s={14.5} c={C.ink} style={{ flex: 1, lineHeight: 22 }}>{st.body}</T>
              <T s={40}>{st.emoji}</T>
            </View>
          </View>
        ))}

        <View style={{ marginTop: 34 }}>
          <Faq A={{ faqTitle: A.faqTitle, faqs: A.faqs, seeMoreUrl: A.seeMoreUrl }} />
        </View>

        <Movement M={A.movement} name={A.founder?.name} onGo={go} />

        <View style={[s.pad, { marginTop: 20 }]}>
          <BecomePage E={E} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors} onReviews={onReviews} onPricing={toTop} onFaqs={onFaqs} onRefund={onRefund} onReferral={onReferral} onContact={onContact} />
        </View>
      </ScrollView>

      <View style={s.stickyWrap} pointerEvents="box-none">
        <PressableScale style={s.sticky} onPress={go}>
          <T w="xbold" s={16} c={C.ink}>{P.stickyCta}</T>
        </PressableScale>
      </View>
    </View>
  );
}

/* ── FAQs — the whole shared question set on its own page (see CONTENT.faqs) ─── */
export function FaqsStack({ onGetStarted, onAbout, onImpact, onTutors, onReviews, onPricing, onContact, onRefund, onReferral }) {
  const F = CONTENT.faqs;
  const A = CONTENT.about;
  const E = CONTENT.event;
  const go = () => (onGetStarted ? onGetStarted() : open(E.become.appUrl));
  const scrollRef = useRef(null);
  const toTop = () => scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: true });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Paper style={s.pHero} stroke="rgba(255,255,255,0.07)">
          <View style={s.rHeroBody}>
            <T w="xbold" s={32} c="#fff" style={{ textAlign: 'center', lineHeight: 42 }}>{F.hero.title}</T>
            <T w="med" s={14.5} c="rgba(255,255,255,0.78)" style={{ textAlign: 'center', marginTop: 14, lineHeight: 22 }}>{F.hero.body}</T>
            <PressableScale style={s.rHeroCta} onPress={go}>
              <T w="xbold" s={16} c={C.ink}>{F.hero.cta}</T>
            </PressableScale>
          </View>
        </Paper>

        <View style={{ marginTop: 4 }}>
          <Faq A={{ faqTitle: F.faqTitle, faqs: F.faqs, seeMoreUrl: F.seeMoreUrl }} />
        </View>

        {/* A FAQ page's real job is to hand off the question it could not answer. */}
        <View style={[s.pad, { marginTop: 30 }]}>
          <View style={s.askCard}>
            <T w="xbold" s={20} c={C.ink} style={{ textAlign: 'center', lineHeight: 27 }}>{F.askTitle}</T>
            <T w="med" s={13.5} c={C.muted} style={{ textAlign: 'center', marginTop: 8, lineHeight: 20 }}>{F.askBody}</T>
            <PressableScale style={s.askCta} onPress={() => open(F.askUrl)}>
              <T w="xbold" s={14.5} c={C.ink}>{F.askCta}</T>
            </PressableScale>
          </View>
        </View>

        <Movement M={A.movement} name={A.founder?.name} onGo={go} />

        <View style={[s.pad, { marginTop: 20 }]}>
          <BecomePage E={E} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors} onReviews={onReviews} onPricing={onPricing} onFaqs={toTop} onRefund={onRefund} onReferral={onReferral} onContact={onContact} />
        </View>
      </ScrollView>

      <View style={s.stickyWrap} pointerEvents="box-none">
        <PressableScale style={s.sticky} onPress={go}>
          <T w="xbold" s={16} c={C.ink}>{F.stickyCta}</T>
        </PressableScale>
      </View>
    </View>
  );
}

/* ── Contact Us — every way to reach a human, on one page ─────────────────────
   Graph-paper gold hero, then the two "who are you" cards (existing family vs.
   still deciding), the office list, and the demo CTA. An office with no `map`
   simply drops the Maps link instead of rendering a dead one; an empty
   CONTENT.contact.offices hides the whole block. */
const LINK_ICONS = { faqs: HelpCircle, pricing: Wallet, tutors: Users, reviews: Star };

function OfficeCard({ o }) {
  return (
    <View style={s.cOffice}>
      <T s={26}>{o.flag}</T>
      <T w="xbold" s={19} c={C.ink} style={{ marginTop: 10 }}>{o.country}</T>
      <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
        <T s={14}>📍</T>
        <T w="med" s={14} c={C.ink} style={{ flex: 1, lineHeight: 22 }}>{o.lines}</T>
      </View>
      {!!o.map && (
        <PressableScale style={s.cMapLink} onPress={() => open(o.map)}>
          <T w="xbold" s={14.5} c={C.ink} style={s.cUnderline}>View on Google Maps</T>
          <ArrowUpRight size={15} color={C.ink} />
        </PressableScale>
      )}
    </View>
  );
}

export function ContactStack({ onGetStarted, onAbout, onImpact, onTutors, onReviews, onPricing, onFaqs, onRefund, onReferral }) {
  const K = CONTENT.contact;
  const E = CONTENT.event;
  const go = () => (onGetStarted ? onGetStarted() : open(E.become.appUrl));
  const scrollRef = useRef(null);
  const toTop = () => scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: true });
  const linkHandlers = { faqs: onFaqs, pricing: onPricing, tutors: onTutors, reviews: onReviews };
  const shownLinks = (K.links || []).filter((l) => !!linkHandlers[l.key]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Paper style={s.cHero} stroke="rgba(0,0,0,0.09)">
          <T w="xbold" s={30} c={C.ink} style={{ textAlign: 'center', lineHeight: 40 }}>{K.hero.title}</T>
        </Paper>

        <Paper style={s.cBody} stroke="#EFF1F4">
          {K.cards.map((c, i) => (
            <FadeIn key={c.title} delay={80 + i * 90}>
              <View style={[s.cCard, i > 0 && { marginTop: 18 }]}>
                <T w="xbold" s={21} c={C.ink}>{c.title}</T>
                <T w="med" s={14.5} c={C.ink} style={{ marginTop: 10, lineHeight: 24 }}>{c.body}</T>
                {!!c.cta && (
                  <PressableScale style={s.cCardBtn} onPress={() => open(c.url)}>
                    <T w="xbold" s={15.5} c={C.ink}>{c.cta}</T>
                  </PressableScale>
                )}
                {!!c.email && (
                  <PressableScale style={{ marginTop: 18 }} onPress={() => open(`mailto:${c.email}`)}>
                    <T w="xbold" s={15.5} c={C.ink} style={s.cUnderline}>{c.email}</T>
                  </PressableScale>
                )}
              </View>
            </FadeIn>
          ))}

          {!!K.offices.length && (
            <>
              <T w="xbold" s={23} c={C.ink} style={{ textAlign: 'center', marginTop: 34, marginBottom: 16 }}>
                {K.officesTitle}
              </T>
              {K.offices.map((o, i) => (
                <FadeIn key={o.country} delay={80 + i * 90}>
                  <View style={i > 0 ? { marginTop: 16 } : null}><OfficeCard o={o} /></View>
                </FadeIn>
              ))}
            </>
          )}

          <View style={s.cCta}>
            <T w="xbold" s={21} c={C.ink} style={{ textAlign: 'center', lineHeight: 29 }}>{K.cta.title}</T>
            <T w="med" s={14} c={C.ink} style={{ textAlign: 'center', marginTop: 12, lineHeight: 22 }}>{K.cta.body}</T>
            <PressableScale style={s.cCtaBtn} onPress={go}>
              <T w="xbold" s={16} c={C.ink}>{K.cta.button}</T>
            </PressableScale>
            <PressableScale style={s.cLearn} onPress={() => open(K.cta.learnUrl)}>
              <View style={s.cPlay}><Play size={13} color={C.ink} fill={C.ink} /></View>
              <T w="xbold" s={14.5} c={C.ink} style={s.cUnderline}>{K.cta.learn}</T>
            </PressableScale>
          </View>

          {/* Helpful links — every card opens the in-app page, not the website. A card
              whose handler wasn't passed down is dropped rather than dead-ended. */}
          {!!shownLinks.length && (
            <>
              <T w="xbold" s={23} c={C.ink} style={{ textAlign: 'center', marginTop: 36, marginBottom: 16 }}>
                {K.linksTitle}
              </T>
              {shownLinks.map((l, i) => {
                const Icon = LINK_ICONS[l.key] || HelpCircle;
                return (
                  <FadeIn key={l.key} delay={70 + i * 80}>
                    <PressableScale style={[s.cLink, { backgroundColor: l.bg }, i > 0 && { marginTop: 14 }]} onPress={linkHandlers[l.key]}>
                      <View style={[s.cLinkIcon, { borderColor: C.ink }]}><Icon size={26} color={l.tint} /></View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
                        <T w="xbold" s={15} c={C.ink}>{l.title}</T>
                        <ArrowUpRight size={15} color={C.ink} />
                      </View>
                      <T w="med" s={15} c={C.ink} style={{ marginTop: 6, lineHeight: 23 }}>{l.body}</T>
                    </PressableScale>
                  </FadeIn>
                );
              })}
            </>
          )}

          <View style={{ marginTop: 30 }}>
            <BecomePage E={E} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors}
              onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onRefund={onRefund} onReferral={onReferral} onContact={toTop} />
          </View>
        </Paper>
      </ScrollView>

      <View style={s.stickyWrap} pointerEvents="box-none">
        <PressableScale style={s.sticky} onPress={go}>
          <T w="xbold" s={16} c={C.ink}>{K.stickyCta}</T>
        </PressableScale>
      </View>
    </View>
  );
}

/* ── Refund & Cancellation Policy ─────────────────────────────────────────────
   Reads off CONTENT.refund, which is deliberately empty until the signed-off policy
   is filled in. EVERY block below is guarded: an unfilled field renders nothing
   rather than a placeholder, because a refund term a parent can read is a term we
   are held to. The page can therefore be shipped half-filled without ever stating
   something untrue — it simply shows less. */
export function RefundStack({ onAbout, onImpact, onTutors, onReviews, onPricing, onFaqs, onContact, onReferral }) {
  const P = CONTENT.refund;
  const E = CONTENT.event;
  const scrollRef = useRef(null);
  const toTop = () => scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: true });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Placeholder wording is in place so the layout can be reviewed. It stays
            visibly marked until CONTENT.refund.draft is set to false. */}
        {P.draft && (
          <View style={s.rfDraft}>
            <T w="xbold" s={12.5} c="#7A3E00" style={s.label}>Draft — sample wording, not our published policy</T>
          </View>
        )}
        <View style={s.rfHero}>
          <T w="xbold" s={28} c={C.ink} style={{ lineHeight: 38 }}>{P.hero.title}</T>
          {!!P.hero.scope && <T w="med" s={17} c="#8A6D1F" style={{ marginTop: 14, lineHeight: 26 }}>{P.hero.scope}</T>}

          {(!!P.hero.answer || !!P.hero.body) && (
            <View style={s.rfCard}>
              {!!P.hero.answer && (
                <>
                  <T w="xbold" s={21} c={C.ink} style={{ lineHeight: 29 }}>{P.hero.answer}</T>
                  <View style={s.rfTick}><Check size={20} color="#fff" /></View>
                </>
              )}
              {!!P.hero.body && <T w="med" s={15.5} c={C.ink} style={{ marginTop: 14, lineHeight: 25 }}>{P.hero.body}</T>}
              {!!P.hero.docUrl && (
                <PressableScale style={s.rfDocBtn} onPress={() => open(P.hero.docUrl)}>
                  <FileText size={20} color={C.ink} />
                  <T w="xbold" s={15.5} c={C.ink} style={{ flex: 1 }}>{P.hero.docCta}</T>
                  <ArrowDown size={18} color={C.ink} />
                </PressableScale>
              )}
              {!!P.hero.effective && (
                <View style={s.rfEffective}>
                  <CalendarDays size={15} color={C.faint} />
                  <T w="med" s={14} c={C.faint}>Effective:  {P.hero.effective}</T>
                </View>
              )}
            </View>
          )}
        </View>

        {!!P.how.length && (
          <View style={[s.pad, { marginTop: 34 }]}>
            <T w="xbold" s={11.5} c={C.muted} style={s.label}>How it works</T>
            <T w="xbold" s={26} c={C.ink} style={{ marginTop: 10, lineHeight: 35 }}>{P.howTitle}</T>
            <View style={{ marginTop: 26, borderWidth: 1, borderColor: C.border }}>
              {P.how.map((h, i) => (
                <FadeIn key={h.title} delay={60 + i * 80}>
                  <View style={[s.rfHow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
                    <View style={[s.rfHowIcon, { backgroundColor: h.tintBg }]}><Sparkles size={20} color={h.tint} /></View>
                    <T w="xbold" s={14} c={h.tint} style={[s.label, { marginTop: 16 }]}>{h.label}</T>
                    <T w="xbold" s={17} c={C.ink} style={{ marginTop: 6 }}>{h.title}</T>
                    <T w="med" s={15} c={C.muted} style={{ marginTop: 10, lineHeight: 24 }}>{h.body}</T>
                  </View>
                </FadeIn>
              ))}
            </View>
          </View>
        )}

        {!!P.not.length && (
          <View style={s.rfNotWrap}>
            <View style={s.pad}>
              <T w="xbold" s={26} c={C.ink} style={{ lineHeight: 35 }}>{P.notTitle}</T>
              {!!P.notBody && <T w="med" s={15.5} c={C.muted} style={{ marginTop: 12, lineHeight: 25 }}>{P.notBody}</T>}
              <View style={{ marginTop: 22, gap: 12 }}>
                {P.not.map((n) => (
                  <View key={n.title} style={s.rfNot}>
                    <View style={s.rfDash} />
                    <View style={{ flex: 1 }}>
                      <T w="xbold" s={16.5} c={C.ink} style={{ lineHeight: 23 }}>{n.title}</T>
                      <T w="med" s={15} c={C.muted} style={{ marginTop: 6, lineHeight: 23 }}>{n.body}</T>
                    </View>
                  </View>
                ))}
              </View>
              {!!P.note && (
                <View style={s.rfNote}>
                  <T w="med" s={15} c={C.ink} style={{ lineHeight: 24 }}>{P.note}</T>
                </View>
              )}
            </View>
          </View>
        )}

        {!!P.channels.length && (
          <View style={[s.pad, { marginTop: 34 }]}>
            <T w="xbold" s={26} c={C.ink} style={{ lineHeight: 35 }}>{P.requestTitle}</T>
            <T w="med" s={15.5} c={C.muted} style={{ marginTop: 10 }}>{P.requestBody}</T>
            {P.channels.map((ch, i) => (
              <React.Fragment key={ch.key}>
                {i > 0 && (
                  <View style={s.rfOr}>
                    <View style={s.rfOrRule} /><T w="med" s={13} c={C.faint}>OR</T><View style={s.rfOrRule} />
                  </View>
                )}
                <PressableScale style={s.rfChannel} onPress={() => open(ch.url)}>
                  <View style={s.rfChIcon}>
                    {ch.key === 'email' ? <Mail size={22} color={C.ink} /> : <MessageCircle size={22} color={C.ink} />}
                  </View>
                  <T w="xbold" s={18} c={C.ink} style={[s.cUnderline, { marginTop: 16 }]}>{ch.title}</T>
                  <T w="med" s={15} c={C.muted} style={{ marginTop: 10, lineHeight: 24 }}>{ch.body}</T>
                </PressableScale>
              </React.Fragment>
            ))}
          </View>
        )}

        {!!P.faqs.length && (
          <View style={{ marginTop: 34 }}>
            <Faq A={{ faqTitle: P.faqTitle, faqs: P.faqs }} />
          </View>
        )}

        {/* The policy verbatim. Legal text is set at a wider line-height and never
            truncated or clamped — a parent must be able to read the clause that binds
            them in full, in the app, without following a link out. */}
        {(!!P.termsIntro.length || !!P.terms.length) && (
          <View style={[s.pad, { marginTop: 40 }]}>
            <T w="xbold" s={27} c={C.ink} style={{ lineHeight: 36 }}>{P.termsTitle}</T>
            {!!P.hero.effective && (
              <View style={s.rfEffective}>
                <CalendarDays size={15} color={C.faint} />
                <T w="med" s={14} c={C.faint}>Effective:  {P.hero.effective}</T>
              </View>
            )}
            {P.termsIntro.map((para, i) => (
              <T key={i} w="med" s={15.5} c={C.ink} style={{ marginTop: 18, lineHeight: 26 }}>{para}</T>
            ))}
            {!!P.termsNote && (
              <View style={s.rfNote}>
                <T w="med" s={15} c="#8A6D1F" style={{ lineHeight: 24 }}>{P.termsNote}</T>
              </View>
            )}

            {P.terms.map((sec, i) => (
              <View key={sec.n} style={[s.rfSection, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
                <View style={[s.rfNum, { backgroundColor: sec.tint || '#F4F4F5' }]}>
                  <T w="xbold" s={16} c={C.ink}>{sec.n}</T>
                </View>
                <T w="xbold" s={23} c={C.ink} style={{ marginTop: 16, lineHeight: 31 }}>{sec.title}</T>
                {(sec.clauses || []).map((cl, j) => (
                  <View key={j}>
                    <View style={s.rfClause}>
                      <T w="med" s={15} c={C.ink} style={s.rfRef}>{cl.ref}</T>
                      <T w="med" s={15} c={C.ink} style={{ flex: 1, lineHeight: 25 }}>{cl.text}</T>
                    </View>
                    {(cl.sub || []).map((sb, k) => (
                      <View key={k} style={[s.rfClause, { marginLeft: 26, marginTop: 8 }]}>
                        <T w="med" s={15} c={C.ink} style={s.rfRef}>{sb.ref}</T>
                        <T w="med" s={15} c={C.ink} style={{ flex: 1, lineHeight: 25 }}>{sb.text}</T>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        <View style={[s.pad, { marginTop: 30 }]}>
          <BecomePage E={E} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors}
            onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onRefund={toTop} onReferral={onReferral} onContact={onContact} />
        </View>
      </ScrollView>

      <View style={s.stickyWrap} pointerEvents="box-none">
        <PressableScale style={s.sticky} onPress={() => open(P.stickyUrl)}>
          <T w="xbold" s={16} c={C.ink}>{P.stickyCta}</T>
        </PressableScale>
      </View>
    </View>
  );
}

/* ── Referral Program ─────────────────────────────────────────────────────────
   Reads off CONTENT.referral. A referral offer is a promise of money, so this page
   follows the refund page's rules exactly: every block is guarded, and the Draft
   strip stays up until CONTENT.referral.draft is false. An unconfirmed reward
   renders as nothing, never as a number a parent could try to claim. */
export function ReferralStack({ onAbout, onImpact, onTutors, onReviews, onPricing, onFaqs, onContact, onRefund }) {
  const P = CONTENT.referral;
  const E = CONTENT.event;
  const scrollRef = useRef(null);
  const toTop = () => scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: true });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {P.draft && (
          <View style={s.rfDraft}>
            <T w="xbold" s={12.5} c="#7A3E00" style={s.label}>Draft — sample wording, not our published offer</T>
          </View>
        )}

        <View style={s.rfHero}>
          {!!P.hero.badge && (
            <View style={s.rrBadge}><T w="xbold" s={13} c="#fff">{P.hero.badge}</T></View>
          )}
          <T w="xbold" s={30} c={C.ink} style={{ marginTop: 22, lineHeight: 40 }}>{P.hero.title}</T>
          {!!P.hero.titleAlt && (
            <T w="xbold" s={30} c={C.ink} style={{ lineHeight: 40, fontStyle: 'italic' }}>{P.hero.titleAlt}</T>
          )}

          {(!!P.hero.answer || !!P.hero.body) && (
            <View style={s.rfCard}>
              {!!P.hero.emoji && <View style={s.rrGift}><T s={26}>{P.hero.emoji}</T></View>}
              {!!P.hero.answer && (
                <T w="xbold" s={21} c={C.ink} style={{ marginTop: 20, lineHeight: 29 }}>{P.hero.answer}</T>
              )}
              {!!P.hero.body && <T w="med" s={15.5} c={C.ink} style={{ marginTop: 14, lineHeight: 25 }}>{P.hero.body}</T>}
              {!!P.hero.docUrl && (
                <PressableScale style={s.rfDocBtn} onPress={() => open(P.hero.docUrl)}>
                  <T w="xbold" s={15.5} c={C.ink} style={{ flex: 1 }}>{P.hero.docCta}</T>
                  <ArrowUpRight size={18} color={C.ink} />
                </PressableScale>
              )}
            </View>
          )}

          {!!P.hero.effective && (
            <View style={s.rfEffective}>
              <CalendarDays size={15} color={C.faint} />
              <T w="med" s={14} c={C.faint}>Effective:  {P.hero.effective}</T>
            </View>
          )}
          {!!P.hero.issuer && (
            <T w="med" s={14} c={C.faint} style={{ marginTop: 8 }}>Issued by: {P.hero.issuer}</T>
          )}
        </View>

        {/* Rewards — one bordered stack, a row per party, in the order a parent asks:
            what do I get, what does my friend get, and when does it land. */}
        {!!P.rewards.length && (
          <View style={[s.pad, { marginTop: 40 }]}>
            <T w="xbold" s={11.5} c={C.muted} style={s.label}>{P.rewardsLabel}</T>
            <T w="xbold" s={26} c={C.ink} style={{ marginTop: 10, lineHeight: 35 }}>{P.rewardsTitle}</T>
            <View style={{ marginTop: 26, borderWidth: 1, borderColor: C.border }}>
              {P.rewards.map((r, i) => (
                <FadeIn key={r.key} delay={60 + i * 80}>
                  <View style={[s.rrReward, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
                    <View style={s.rrTile}><T s={22}>{r.emoji}</T></View>
                    <T w="xbold" s={12.5} c={C.muted} style={[s.label, { marginTop: 18 }]}>{r.label}</T>
                    <T w="xbold" s={34} c={C.ink} style={{ marginTop: 6, lineHeight: 44 }}>{r.value}</T>
                    <T w="med" s={15} c={C.muted} style={{ marginTop: 12, lineHeight: 24 }}>{r.body}</T>
                  </View>
                </FadeIn>
              ))}
            </View>
          </View>
        )}

        {!!P.how.length && (
          <View style={s.rrHowWrap}>
            <View style={s.pad}>
              <T w="xbold" s={11.5} c={C.muted} style={s.label}>{P.howLabel}</T>
              <T w="xbold" s={26} c={C.ink} style={{ marginTop: 10, lineHeight: 35 }}>{P.howTitle}</T>
              <View style={{ marginTop: 26 }}>
                {P.how.map((h, i) => (
                  <View key={h.n} style={[s.rrStep, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
                    <View style={s.rrStepNum}><T w="xbold" s={17} c={C.ink}>{h.n}</T></View>
                    <View style={{ flex: 1 }}>
                      <T w="xbold" s={17.5} c={C.ink} style={{ lineHeight: 25 }}>{h.title}</T>
                      <T w="med" s={15} c={C.muted} style={{ marginTop: 10, lineHeight: 24 }}>{h.body}</T>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {!!P.sibling.body && (
          <View style={[s.pad, { marginTop: 40 }]}>
            <T w="xbold" s={11.5} c={C.muted} style={s.label}>{P.siblingLabel}</T>
            <T w="xbold" s={26} c={C.ink} style={{ marginTop: 10, lineHeight: 35 }}>{P.siblingTitle}</T>
            <View style={s.rrSibling}>
              <T w="xbold" s={12} c={C.muted} style={s.label}>{P.sibling.label}</T>
              {!!P.sibling.headline && (
                <T w="xbold" s={19} c={C.ink} style={{ marginTop: 12, lineHeight: 27 }}>{P.sibling.headline}</T>
              )}
              <T w="med" s={15} c={C.ink} style={{ marginTop: 12, lineHeight: 24 }}>{P.sibling.body}</T>
              {/* The cash-value caveat is the one line people miss, so it gets lifted
                  out of the paragraph onto its own white card. */}
              {!!P.sibling.note && (
                <View style={s.rrNote}><T w="med" s={14} c={C.ink} style={{ lineHeight: 21 }}>{P.sibling.note}</T></View>
              )}
            </View>
          </View>
        )}

        {/* Eligibility — scanned, not read: two lists of short cards, ✓ green for what
            earns the reward and × peach for what voids it. */}
        {(!!P.eligibility?.yes?.length || !!P.eligibility?.no?.length) && (
          <View style={s.rrEligWrap}>
            <View style={s.pad}>
              <T w="xbold" s={11.5} c={C.muted} style={s.label}>{P.eligibility.label}</T>
              <T w="xbold" s={26} c={C.ink} style={{ marginTop: 10, lineHeight: 35 }}>{P.eligibility.title}</T>

              {!!P.eligibility.yes.length && (
                <>
                  <T w="xbold" s={11.5} c={C.muted} style={[s.label, { marginTop: 28 }]}>{P.eligibility.yesLabel}</T>
                  <View style={{ marginTop: 14, gap: 10 }}>
                    {P.eligibility.yes.map((it, i) => (
                      <FadeIn key={it.title} delay={40 + i * 60}>
                        <View style={s.rrRule}>
                          <View style={s.rrRuleHead}>
                            <View style={[s.rrRuleIcon, { backgroundColor: '#C8F5D8' }]}><Check size={15} color="#12924B" /></View>
                            <T w="xbold" s={16.5} c={C.ink} style={{ flex: 1 }}>{it.title}</T>
                          </View>
                          <T w="med" s={14.5} c={C.muted} style={s.rrRuleBody}>{it.body}</T>
                        </View>
                      </FadeIn>
                    ))}
                  </View>
                </>
              )}

              {!!P.eligibility.no.length && (
                <>
                  <T w="xbold" s={11.5} c={C.muted} style={[s.label, { marginTop: 30 }]}>{P.eligibility.noLabel}</T>
                  <View style={{ marginTop: 14, gap: 10 }}>
                    {P.eligibility.no.map((it, i) => (
                      <FadeIn key={it.title} delay={40 + i * 60}>
                        <View style={s.rrRule}>
                          <View style={s.rrRuleHead}>
                            <View style={[s.rrRuleIcon, { backgroundColor: '#FBD9C7' }]}><X size={15} color="#C2410C" /></View>
                            <T w="xbold" s={16.5} c={C.ink} style={{ flex: 1 }}>{it.title}</T>
                          </View>
                          <T w="med" s={14.5} c={C.muted} style={s.rrRuleBody}>{it.body}</T>
                        </View>
                      </FadeIn>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Reuses the shared Faq accordion — same +/× and one-at-a-time behaviour as
            the About and Refund pages, so the interaction is learned once. */}
        {!!P.faqs?.length && (
          <View style={{ marginTop: 40 }}>
            <View style={s.pad}>
              <T w="xbold" s={11.5} c={C.muted} style={s.label}>{P.faqLabel}</T>
            </View>
            <Faq A={{ faqTitle: P.faqTitle, faqs: P.faqs }} />
          </View>
        )}

        {!!P.help?.title && (
          <View style={[s.pad, { marginTop: 34 }]}>
            <T w="xbold" s={20} c={C.ink} style={{ lineHeight: 28 }}>{P.help.title}</T>
            <T w="med" s={15} c={C.muted} style={{ marginTop: 8, lineHeight: 23 }}>{P.help.body}</T>
            <PressableScale style={{ alignSelf: 'flex-start', marginTop: 16 }} onPress={() => open(P.help.url)}>
              <T w="xbold" s={15.5} c={C.ink} style={s.cUnderline}>{P.help.cta}  →</T>
            </PressableScale>
          </View>
        )}

        {!!P.terms?.length && <ReferralTerms P={P} />}

        <View style={[s.pad, { marginTop: 30 }]}>
          <BecomePage E={E} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors}
            onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onRefund={onRefund}
            onContact={onContact} onReferral={toTop} />
        </View>
      </ScrollView>

      <View style={s.stickyWrap} pointerEvents="box-none">
        <PressableScale style={s.sticky} onPress={() => open(P.stickyUrl)}>
          <T w="xbold" s={16} c={C.ink}>{P.stickyCta}</T>
        </PressableScale>
      </View>
    </View>
  );
}

// The binding terms, collapsed by default. The page above is the readable summary; a
// parent who wants the actual wording opens this rather than following a link out of
// the app. Starts CLOSED — the summary is what most people need, and dropping several
// screens of legal text into the scroll buries the FAQ and the contact route under it.
function ReferralTerms({ P }) {
  const [open_, setOpen] = useState(false);
  return (
    <View style={s.rrTermsWrap}>
      <PressableScale style={s.rrTermsBtn} onPress={() => { spring(); setOpen((o) => !o); }}>
        <T w="xbold" s={15.5} c={C.ink} style={{ flex: 1 }}>{P.termsCta}</T>
        {/* Gold diamond: a square turned 45°, with the glyph counter-rotated so the
            +/× stays upright inside it. */}
        <View style={s.rrDiamond}>
          <View style={{ transform: [{ rotate: '-45deg' }] }}>
            {open_ ? <X size={15} color={C.ink} /> : <Plus size={15} color={C.ink} />}
          </View>
        </View>
      </PressableScale>

      {open_ && (
        <View style={{ paddingHorizontal: 22, paddingBottom: 34 }}>
          {P.terms.map((sec) => (
            <View key={sec.title} style={{ marginTop: 28 }}>
              <T w="xbold" s={13} c={C.ink} style={s.label}>{sec.title}</T>
              <View style={s.rrTermsRule} />
              {(sec.paras || []).map((para, i) => (
                <T key={`p${i}`} w="med" s={15} c={C.ink} style={{ marginTop: 14, lineHeight: 25 }}>{para}</T>
              ))}
              {(sec.bullets || []).map((b, i) => (
                <View key={`b${i}`} style={s.rrBullet}>
                  <View style={s.rrBulletDot} />
                  <T w="med" s={14.5} c={C.muted} style={{ flex: 1, lineHeight: 23 }}>{b}</T>
                </View>
              ))}
              {(sec.after || []).map((para, i) => (
                <T key={`a${i}`} w="med" s={15} c={C.ink} style={{ marginTop: 14, lineHeight: 25 }}>{para}</T>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function ReferralModal({ visible, onClose, onAbout, onImpact, onTutors, onReviews, onPricing, onFaqs, onContact, onRefund }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={s.head}>
          <PressableScale onPress={onClose} style={s.back}><T s={26} c={C.ink}>‹</T></PressableScale>
          <T w="bold" s={16} c={C.ink}>Refer a Friend</T><View style={{ width: 40 }} />
        </View>
        <ReferralStack onAbout={onAbout} onImpact={onImpact} onTutors={onTutors}
          onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onRefund={onRefund} onContact={onContact} />
      </SafeAreaView>
    </Modal>
  );
}

export function RefundModal({ visible, onClose, onAbout, onImpact, onTutors, onReviews, onPricing, onFaqs, onContact, onRefund, onReferral }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={s.head}>
          <PressableScale onPress={onClose} style={s.back}><T s={26} c={C.ink}>‹</T></PressableScale>
          <T w="bold" s={16} c={C.ink}>Refund Policy</T><View style={{ width: 40 }} />
        </View>
        <RefundStack onAbout={onAbout} onImpact={onImpact} onTutors={onTutors}
          onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onRefund={onRefund} onReferral={onReferral} onContact={onContact} />
      </SafeAreaView>
    </Modal>
  );
}

export function ContactModal({ visible, onClose, onGetStarted, onAbout, onImpact, onTutors, onReviews, onPricing, onFaqs, onRefund, onReferral }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={s.head}>
          <PressableScale onPress={onClose} style={s.back}><T s={26} c={C.ink}>‹</T></PressableScale>
          <T w="bold" s={16} c={C.ink}>Contact Us</T><View style={{ width: 40 }} />
        </View>
        <ContactStack onGetStarted={onGetStarted} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors}
          onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onRefund={onRefund} onReferral={onReferral} />
      </SafeAreaView>
    </Modal>
  );
}

export function PricingModal({ visible, onClose, onGetStarted, onAbout, onImpact, onTutors, onReviews, onFaqs, onContact, onRefund, onReferral }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={s.head}>
          <PressableScale onPress={onClose} style={s.back}><T s={26} c={C.ink}>‹</T></PressableScale>
          <T w="bold" s={16} c={C.ink}>Pricing</T><View style={{ width: 40 }} />
        </View>
        <PricingStack onGetStarted={onGetStarted} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors} onReviews={onReviews} onFaqs={onFaqs} onRefund={onRefund} onReferral={onReferral} onContact={onContact} />
      </SafeAreaView>
    </Modal>
  );
}

export function FaqsModal({ visible, onClose, onGetStarted, onAbout, onImpact, onTutors, onReviews, onPricing, onContact, onRefund, onReferral }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={s.head}>
          <PressableScale onPress={onClose} style={s.back}><T s={26} c={C.ink}>‹</T></PressableScale>
          <T w="bold" s={16} c={C.ink}>FAQs</T><View style={{ width: 40 }} />
        </View>
        <FaqsStack onGetStarted={onGetStarted} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors} onReviews={onReviews} onPricing={onPricing} onRefund={onRefund} onReferral={onReferral} onContact={onContact} />
      </SafeAreaView>
    </Modal>
  );
}

export function ReviewsModal({ visible, onClose, onGetStarted, onAbout, onImpact, onTutors, onPricing, onFaqs, onContact, onRefund, onReferral }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={s.head}>
          <PressableScale onPress={onClose} style={s.back}><T s={26} c={C.ink}>‹</T></PressableScale>
          <T w="bold" s={16} c={C.ink}>Parent Reviews</T><View style={{ width: 40 }} />
        </View>
        <ReviewsStack onGetStarted={onGetStarted} onAbout={onAbout} onImpact={onImpact} onTutors={onTutors} onPricing={onPricing} onFaqs={onFaqs} onRefund={onRefund} onReferral={onReferral} onContact={onContact} />
      </SafeAreaView>
    </Modal>
  );
}

/* ── Full-screen modal wrappers ───────────────────────────────────────────── */
export function AboutModal({ visible, onClose, onGetStarted, onImpact, onTutors, onReviews, onPricing, onFaqs, onContact, onRefund, onReferral }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={s.head}>
          <PressableScale onPress={onClose} style={s.back}><T s={26} c={C.ink}>‹</T></PressableScale>
          <T w="bold" s={16} c={C.ink}>About Us</T><View style={{ width: 40 }} />
        </View>
        <AboutStack onGetStarted={onGetStarted} onImpact={onImpact} onTutors={onTutors} onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onRefund={onRefund} onReferral={onReferral} onContact={onContact} />
      </SafeAreaView>
    </Modal>
  );
}

export function ImpactModal({ visible, onClose, onGetStarted, onAbout, onTutors, onReviews, onPricing, onFaqs, onContact, onRefund, onReferral }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={s.head}>
          <PressableScale onPress={onClose} style={s.back}><T s={26} c={C.ink}>‹</T></PressableScale>
          <T w="bold" s={16} c={C.ink}>Our Impact</T><View style={{ width: 40 }} />
        </View>
        <ImpactStack onGetStarted={onGetStarted} onAbout={onAbout} onTutors={onTutors} onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onRefund={onRefund} onReferral={onReferral} onContact={onContact} />
      </SafeAreaView>
    </Modal>
  );
}

export function TutorsModal({ visible, onClose, onGetStarted, onAbout, onImpact, onReviews, onPricing, onFaqs, onContact, onRefund, onReferral }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={s.head}>
          <PressableScale onPress={onClose} style={s.back}><T s={26} c={C.ink}>‹</T></PressableScale>
          <T w="bold" s={16} c={C.ink}>Our Tutors</T><View style={{ width: 40 }} />
        </View>
        <TutorsStack onGetStarted={onGetStarted} onAbout={onAbout} onImpact={onImpact} onReviews={onReviews} onPricing={onPricing} onFaqs={onFaqs} onRefund={onRefund} onReferral={onReferral} onContact={onContact} />
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: 22 },

  tpStar: { width: 21, height: 21, backgroundColor: '#00B67A', borderRadius: 3, alignItems: 'center', justifyContent: 'center' },

  video: { height: 300, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  playDot: { width: 74, height: 74, borderRadius: 37, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },

  art: { height: 300, borderRadius: 4, backgroundColor: '#F3F6FC', borderWidth: 1, borderColor: '#E4EAF5', overflow: 'hidden' },
  node: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E1E8F4', alignItems: 'center', justifyContent: 'center', shadowColor: '#0B1020', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  medallion: { position: 'absolute', width: 116, height: 116, borderRadius: 58, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E1E8F4', alignItems: 'center', justifyContent: 'center', shadowColor: '#0B1020', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 },

  mq: { backgroundColor: '#EDEDEF', paddingVertical: 13, marginTop: 30, overflow: 'hidden' },
  mqItem: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 18 },

  statRow: { paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: C.border },

  impact: { paddingTop: 34, paddingBottom: 34, overflow: 'hidden' },
  impactCta: { alignSelf: 'center', backgroundColor: C.gold, borderRadius: 4, paddingVertical: 15, paddingHorizontal: 40, marginTop: 24, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  learnRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'center', marginTop: 20 },
  learnDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#D6D9DF', alignItems: 'center', justifyContent: 'center' },
  wall: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 28 },
  wallCol: { flex: 1, gap: 14 },
  achCard: { borderRadius: 2, overflow: 'hidden', backgroundColor: '#fff' },
  achImg: { width: '100%', aspectRatio: 1, backgroundColor: '#EFF1F5' },
  achStub: { alignItems: 'center', justifyContent: 'center' },
  achCap: { paddingVertical: 12, paddingHorizontal: 10 },

  resItem: { borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 22 },
  resHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 17 },
  resImg: { width: '84%', aspectRatio: 1.5, borderWidth: 1, borderColor: C.border, backgroundColor: '#F4F5F7' },
  resStub: { alignItems: 'center', justifyContent: 'center' },
  paperHead: { paddingTop: 34, paddingBottom: 30 },
  paperSec: { paddingTop: 40, paddingBottom: 38 },

  rail: { paddingHorizontal: 22, paddingTop: 26, gap: 14 },
  storyCard: { width: 290, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', overflow: 'hidden' },
  // Explicit height, not `aspectRatio` off a percentage width. The photo box has to stay
  // bounded no matter what the source asset's own dimensions are — with the ratio form
  // the card grew past the viewport and pushed the story text off screen entirely.
  // resizeMode="contain" still shows each picture whole; it just letterboxes inside 260.
  storyImg: { width: '100%', height: 260, backgroundColor: '#EFF1F5' },
  storyChip: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 12, paddingVertical: 7 },
  storyBody: { padding: 16, flex: 1 },
  voiceCard: { width: 300, height: 190, borderWidth: 1, borderColor: C.border, backgroundColor: '#F4F5F7', overflow: 'hidden', justifyContent: 'center' },
  voiceQuote: { position: 'absolute', left: 14, bottom: 14, maxWidth: 168, backgroundColor: '#111', padding: 12 },
  voicePlay: { position: 'absolute', right: 46, top: '50%', marginTop: -26, width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' },

  trusted: { backgroundColor: '#000', paddingTop: 40, overflow: 'hidden' },
  darkGlobe: { position: 'absolute', left: 0, right: 0, top: 90, alignItems: 'center' },
  pill: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', paddingHorizontal: 20, paddingVertical: 13 },
  pillOn: { backgroundColor: '#EDEDEF', borderColor: '#EDEDEF' },
  revRail: { marginTop: 34, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.14)' },
  tbCard: { width: 300, padding: 20, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.14)' },
  revFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  tbAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },

  awardCard: { width: 300, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff' },
  awardImg: { width: '100%', aspectRatio: 1.4, backgroundColor: '#EFF1F5' },

  tsRow: { flexDirection: 'row', marginTop: -30 },
  tsCell: { flex: 1, height: 150, backgroundColor: '#1C1C20', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.14)' },

  founderCard: { borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden', backgroundColor: '#FAFAFB' },
  founderImg: { width: '100%', height: 340 },
  founderStub: { backgroundColor: '#EFF1F5', alignItems: 'center', justifyContent: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tileWrap: { width: '50%' },
  tile: { padding: 16, minHeight: 168, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)' },
  knowTile: { padding: 16, minHeight: 96, justifyContent: 'space-between', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)' },
  logoBox: { height: 92, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff' },

  reachImg: { width: '100%', height: 280, marginTop: 22 },
  globeWrap: { width: '100%', aspectRatio: 1, marginTop: 24 },

  dark: { backgroundColor: '#0E0E10', paddingVertical: 30 },
  tlImg: { width: '100%', height: 220, backgroundColor: '#1C1C20' },
  tlStub: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  tlRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.16)', marginTop: 14 },
  // Reach globe furniture: pulsing halo under each named pin, the pin's name tag,
  // the derived counts row, and the all-cities chip rail.
  gHalo: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: C.blue },
  gLabel: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.94)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: C.border },
  gStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 20 },
  gStatRule: { width: 1, height: 30, backgroundColor: C.border },
  gChip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: '#FCFCFD' },
  gChipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.blue },

  kmRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: C.border, padding: 16 },
  kmIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  tlDots: { flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 20 },
  // Fixed 20px slot: the grey dot and the gold bar stack inside it, so the row's
  // width never changes as the active card moves.
  tlDotSlot: { width: 20, height: 7, alignItems: 'center', justifyContent: 'center' },
  tlDotOff: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4A4A4A' },
  tlDotOn: { ...StyleSheet.absoluteFillObject, borderRadius: 4, backgroundColor: C.gold },
  movementCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.gold, borderRadius: 12, paddingVertical: 15, marginTop: 22 },
  strip: { flexDirection: 'row', marginTop: 26, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  stripCell: { flex: 1, height: 132, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.12)' },
  stripPlay: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  stripCta: { backgroundColor: C.gold, alignItems: 'stretch', justifyContent: 'space-between', padding: 12, borderRightWidth: 0 },

  // Our Tutors — the hero, the funnel, the tutor rail, the matching spine.
  tHero: { backgroundColor: '#2A1206', paddingTop: 54, paddingBottom: 26 },
  tHeroBody: { paddingHorizontal: 22, alignItems: 'center' },
  tHeroCta: { backgroundColor: C.gold, borderRadius: 4, paddingVertical: 16, paddingHorizontal: 34, marginTop: 30, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  tLearnRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22 },
  tLearnDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  tHeroRating: { paddingHorizontal: 22, marginTop: 40 },

  // Each band's copy is absolutely placed over its trapezoid (see FUNNEL_BAND).
  funnelBand: { position: 'absolute', height: FUNNEL_BAND, alignItems: 'center', justifyContent: 'center', gap: 14 },
  funnelPill: { backgroundColor: 'rgba(255,255,255,0.62)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  certStem: { width: 1, height: 34, backgroundColor: '#C9CBD0' },
  certCard: { backgroundColor: '#F4F5F7', paddingVertical: 20, paddingHorizontal: 28, alignItems: 'flex-start' },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  ongoingNote: { backgroundColor: '#F4F5F7', paddingVertical: 24, paddingHorizontal: 20 },

  teachCard: { width: 290, backgroundColor: '#fff' },
  teachArt: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  teachBody: { padding: 18, flex: 1 },

  tutorCard: { width: 260, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', overflow: 'hidden' },
  tutorImg: { width: '100%', aspectRatio: 1, backgroundColor: '#EFF1F5' },
  tutorBody: { padding: 16, flex: 1 },
  tutorChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 12 },
  // Polaroid thank-you note — white frame, a little tilt, image inside.
  noteCard: { width: 210, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, padding: 10, paddingBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  noteImg: { width: '100%', aspectRatio: 0.82, backgroundColor: '#EFF1F5' },
  // "Tutors Are Different" comparison table.
  cmpWrap: { marginTop: 20, marginHorizontal: 12, borderWidth: 1, borderColor: C.border, borderRadius: 6, overflow: 'hidden' },
  cmpHeadRow: { flexDirection: 'row', position: 'relative' },
  cmpHeadCell: { flex: 1, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  cmpVs: { position: 'absolute', top: '50%', left: '50%', width: 38, height: 38, marginLeft: -19, marginTop: -19, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  cmpRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border },
  cmpCell: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  cmpCellUs: { backgroundColor: '#FDF6E3' },
  cmpCellThem: { backgroundColor: '#fff' },
  cmpTick: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  cmpCross: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  // Parent Reviews page — hero (see ReviewsHero), then the accolade strip.
  rHero: { backgroundColor: '#12100E', paddingTop: 40, paddingBottom: 24 },
  rHeroBody: { paddingHorizontal: 22, alignItems: 'center' },
  rTrustPill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 999, paddingLeft: 8, paddingRight: 16, paddingVertical: 7 },
  rPillAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#EFF1F5', borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  rHeroCta: { backgroundColor: C.gold, borderRadius: 4, paddingVertical: 16, paddingHorizontal: 34, marginTop: 30, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  rHeroRating: { paddingHorizontal: 22, marginTop: 40 },
  // FAQs page — the dark ruled hero from Parent Reviews, minus the photo slot. (Pricing
  // deliberately does NOT use it: money reads better on the light ruled paper.)
  pHero: { backgroundColor: '#12100E', paddingTop: 44, paddingBottom: 40 },
  // GRADES select — closed box, then the list drops under it.
  selBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minWidth: 210, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E2E2E4', paddingVertical: 13, paddingHorizontal: 18, marginTop: 12 },
  selList: { minWidth: 210, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E2E4', borderTopWidth: 0 },
  selItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 13, paddingHorizontal: 16 },
  // Cadence segmented control — square, flush, no gap between the halves.
  segWrap: { flexDirection: 'row', marginTop: 22, paddingHorizontal: 22 },
  segFlag: { height: 22, backgroundColor: '#00B259', alignItems: 'center', justifyContent: 'center' },
  segBtn: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: '#0D0D0D' },
  segOff: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E2E4' },
  // Plan cards — a rail of saturated-headed cards; square, so they read as a fare table.
  planRail: { paddingHorizontal: 22, paddingTop: 26, gap: 14 },
  planCard: { width: 270, borderWidth: 1.5, overflow: 'hidden' },
  planHead: { flexDirection: 'row', alignItems: 'baseline', gap: 7, paddingVertical: 16, paddingHorizontal: 18 },
  planBody: { padding: 18, flex: 1 },
  planWasRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  planOff: { backgroundColor: '#007038', paddingHorizontal: 8, paddingVertical: 3 },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  planTickRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  planBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.75)', paddingHorizontal: 10, paddingVertical: 6, marginTop: 16 },
  pAssure: { flexDirection: 'row', gap: 10, backgroundColor: '#F5F5F5', paddingHorizontal: 14, paddingVertical: 18, marginTop: 18 },
  pAssureBox: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAEAEC', paddingVertical: 18, paddingHorizontal: 8, alignItems: 'center' },
  // "All Plans Include" — the title boxed on the paper, then the hairline-split grid.
  incTitleBox: { borderWidth: 1, borderColor: C.ink, backgroundColor: '#fff', paddingVertical: 26, paddingHorizontal: 20, alignSelf: 'stretch' },
  incGrid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderLeftWidth: 1, borderColor: C.ink },
  incCellWrap: { width: '50%' },
  incCell: { minHeight: 190, paddingVertical: 26, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderBottomWidth: 1, borderColor: C.ink },
  promise: { backgroundColor: '#000', paddingVertical: 74, paddingHorizontal: 22 },
  stepBand: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 30 },
  stepBandRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 },
  askCard: { backgroundColor: '#F4F5F7', borderRadius: 14, padding: 22, alignItems: 'center' },
  askCta: { backgroundColor: C.gold, borderRadius: 8, paddingVertical: 13, paddingHorizontal: 26, marginTop: 16 },
  rBadgeBar: { borderBottomWidth: 1, borderBottomColor: C.border },
  rBadgeRow: { alignItems: 'center', gap: 26, paddingHorizontal: 22, paddingVertical: 18 },
  rBadge: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  // "Why Parents Choose" — the proof panel and the themes hanging off it.
  why: { backgroundColor: C.headerBg, paddingTop: 34, paddingBottom: 36 },
  whyScore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 26 },
  whyPairs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 12 },
  whyPair: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  whyDivider: { width: 1, height: 26, backgroundColor: '#C9CBD0' },
  themeRow: { borderTopWidth: 1, borderTopColor: C.ink, paddingVertical: 18 },
  themeHead: { flexDirection: 'row', alignItems: 'center' },
  // The rail runs edge to edge: cancel the 22pt gutter, then pay it back as padding so the
  // first card still lines up with the copy above it.
  revRailOut: { marginHorizontal: -22 },
  revRailIn: { paddingTop: 16, paddingLeft: 22, paddingRight: 22 },
  // Square-cornered and flush — adjacent borders collapse into one hairline (marginRight
  // -1), so the rail reads as a filmstrip rather than a row of loose chips.
  revCard: { width: 290, borderWidth: 1, borderColor: C.ink, backgroundColor: '#fff', padding: 16, marginRight: -1 },
  revTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  revTag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  revWho: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  revAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EFF1F5', alignItems: 'center', justifyContent: 'center' },
  readCard: { width: 260, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14 },
  readImg: { width: '100%', height: 120, borderRadius: 8, backgroundColor: '#E7F4FC', alignItems: 'center', justifyContent: 'center' },

  stepRow: { flexDirection: 'row', gap: 14 },
  stepDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, width: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 4 },

  faqItem: { borderTopWidth: 1, borderTopColor: C.border },
  faqHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 17 },

  // Contact Us — flat, hard-edged blocks with 1px ink borders (no shadow, no soft
  // radius): the page reads as ruled paper, so lifted cards would fight the grid.
  cHero: { backgroundColor: C.gold, paddingHorizontal: 26, paddingVertical: 62 },
  cBody: { paddingHorizontal: 22, paddingTop: 26, backgroundColor: '#fff' },
  cCard: { backgroundColor: '#FDF1D6', borderWidth: 1, borderColor: C.ink, padding: 22 },
  cCardBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.ink, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  cOffice: { backgroundColor: '#FAFAFB', borderWidth: 1, borderColor: C.ink, padding: 22 },
  cMapLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 },
  cUnderline: { textDecorationLine: 'underline' },
  // Section eyebrows ("WHAT YOU GET", "HOW IT WORKS"). This was referenced by the
  // refund page but never defined here, so every eyebrow on that page silently
  // rendered as plain sentence-case text. Defined once, it fixes both pages.
  label: { letterSpacing: 1.4, textTransform: 'uppercase' },
  cCta: { backgroundColor: '#FDF1D6', borderWidth: 1, borderColor: C.gold, padding: 24, marginTop: 30, alignItems: 'center' },
  cCtaBtn: { backgroundColor: C.gold, borderWidth: 1, borderColor: C.ink, paddingVertical: 16, paddingHorizontal: 30, alignItems: 'center', marginTop: 20, alignSelf: 'stretch' },
  // Refund policy
  rfDraft: { backgroundColor: '#FFD9A8', paddingHorizontal: 22, paddingVertical: 12 },
  rfHero: { backgroundColor: '#FCEBBF', paddingHorizontal: 22, paddingTop: 44, paddingBottom: 40 },
  rfCard: { backgroundColor: '#fff', padding: 22, marginTop: 30 },
  rfTick: { width: 34, height: 34, borderRadius: 6, backgroundColor: '#3EA55E', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  rfDocBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.gold, paddingHorizontal: 16, paddingVertical: 16, marginTop: 22 },
  rfEffective: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  rfHow: { padding: 22 },
  rfHowIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  rfNotWrap: { backgroundColor: '#F4F4F5', paddingTop: 38, paddingBottom: 38, marginTop: 34 },
  rfNot: { flexDirection: 'row', gap: 14, backgroundColor: '#fff', padding: 20 },
  rfDash: { width: 22, height: 2, backgroundColor: '#D3D3D8', marginTop: 10 },
  rfNote: { backgroundColor: '#FDF1D6', borderLeftWidth: 4, borderLeftColor: C.gold, padding: 18, marginTop: 22 },

  // Referral page. Shares rfHero / rfCard / rfDocBtn / rfEffective with the refund
  // page on purpose — both are policy pages and must read as the same document type.
  rrBadge: { alignSelf: 'flex-start', backgroundColor: '#241B3D', paddingHorizontal: 14, paddingVertical: 10 },
  rrGift: { width: 54, height: 54, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  rrReward: { paddingHorizontal: 22, paddingVertical: 30 },
  rrTile: { width: 48, height: 48, backgroundColor: '#FDF1D6', alignItems: 'center', justifyContent: 'center' },
  rrHowWrap: { backgroundColor: '#F4F4F5', paddingVertical: 40, marginTop: 40 },
  rrStep: { flexDirection: 'row', gap: 18, paddingVertical: 24 },
  rrStepNum: { width: 46, height: 46, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  rrSibling: { backgroundColor: '#DBF0FA', borderLeftWidth: 4, borderLeftColor: C.gold, padding: 20, marginTop: 22 },
  rrNote: { backgroundColor: '#fff', padding: 14, marginTop: 18 },

  rrEligWrap: { backgroundColor: '#F4F4F5', paddingVertical: 40, marginTop: 40 },
  rrRule: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, padding: 16 },
  rrRuleHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rrRuleIcon: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  // Indent the body to the title's left edge (icon 26 + gap 12) so the text block
  // hangs off the heading instead of sliding back under the icon.
  rrRuleBody: { marginTop: 8, marginLeft: 38, lineHeight: 22 },

  rrTermsWrap: { backgroundColor: '#F4F4F5', marginTop: 40, paddingTop: 22 },
  rrTermsBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', marginHorizontal: 22, paddingHorizontal: 18, paddingVertical: 18 },
  rrDiamond: { width: 30, height: 30, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  rrTermsRule: { height: 2, backgroundColor: C.gold, marginTop: 10 },
  rrBullet: { flexDirection: 'row', gap: 10, marginTop: 10, paddingLeft: 4 },
  rrBulletDot: { width: 5, height: 5, backgroundColor: C.faint, marginTop: 9 },
  rfOr: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 18 },
  rfOrRule: { flex: 1, height: 1, backgroundColor: C.border },
  rfSection: { paddingTop: 34, marginTop: 34 },
  rfNum: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  rfClause: { flexDirection: 'row', marginTop: 16 },
  // Fixed-width gutter so (i)/(ii)/(iii) and (a)/(b)/(c) all hang on one left edge.
  rfRef: { width: 34 },
  rfChannel: { backgroundColor: '#F4F4F5', padding: 22, marginTop: 20 },
  rfChIcon: { width: 52, height: 52, backgroundColor: '#CFF3DE', alignItems: 'center', justifyContent: 'center' },

  cLink: { borderWidth: 1, borderColor: C.ink, padding: 20 },
  cLinkIcon: { width: 54, height: 54, borderRadius: 12, borderWidth: 1.5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  cLearn: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  cPlay: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E7E3D3', alignItems: 'center', justifyContent: 'center' },

  stickyWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingBottom: 18, paddingTop: 10 },
  sticky: { backgroundColor: C.gold, borderRadius: 12, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
});
