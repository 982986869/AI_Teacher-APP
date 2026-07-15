// src/screens/parent/ParentApp/AboutScreen.js
// "About Ailernova" — one long story page (scroll straight down through every
// section) with a Get Started CTA that stays pinned over the content the whole way.
// Section order: rating · hero · video · marquee · stats · founder · pillars ·
// reach · timeline · investors · know-more · FAQ · movement · become + footer.
//
// Sections whose data is empty in CONTENT.about (video / founder / timeline /
// investors / reach.image) render NOTHING — they light up the moment real data is
// put in constants.js. Nothing here invents a figure, a face or a backer.
import React, { useState, useRef, useEffect } from 'react';
import {
  View, ScrollView, Animated, Easing, StyleSheet, Modal, SafeAreaView,
  Linking, LayoutAnimation, Platform, UIManager, Image,
} from 'react-native';
import Svg, { Line, Circle, Path, G, Polyline, Polygon } from 'react-native-svg';
import { Star, Plus, X, Play, Sparkles, ArrowUpRight, UserRound, Medal, Image as ImageIcon } from 'lucide-react-native';
import { C, T, CONTENT, Wordmark } from './constants';
import { PressableScale, FadeIn, PopIn } from './anim';
import { BecomePage } from './EventsCarousel';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
const CITIES = [
  [28.6, 77.2], [19.1, 72.9], [12.9, 77.6], [22.6, 88.4], [13.1, 80.3], [17.4, 78.5],
  [27.7, 85.3], [6.9, 79.9], [25.2, 55.3], [25.3, 51.5], [24.7, 46.7],
  [1.3, 103.8], [3.1, 101.7], [51.5, -0.1], [52.5, 13.4], [-1.3, 36.8],
];
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
    ? CITIES.map(([lat, lon]) => ({ ...project(lat, lon, R), lat, lon }))
      .filter((p) => p.z > 0.16)
      .sort((a, b) => a.z - b.z)
    : [];

  return (
    <View style={s.globeWrap} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      {R > 0 && (
        <Svg width={w} height={w}>
          <Circle cx={R + 8} cy={R + 8} r={R} fill="#FAFAF9" />
          {dots.map((d, i) => (
            <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="#B9BCC2" opacity={d.o} />
          ))}
          {pins.map((p) => (
            // lucide's MapPin path, hand-placed so the pin's TIP sits on the coordinate.
            <G key={`${p.lat},${p.lon}`} transform={`translate(${R + 8 + p.x - 9}, ${R + 8 + p.y - 16.5}) scale(0.75)`}>
              <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill={C.blue} />
              <Circle cx={12} cy={10} r={3} fill="#fff" />
            </G>
          ))}
        </Svg>
      )}
    </View>
  );
}

/* ── Big-number proof points ──────────────────────────────────────────────── */
function Stats({ stats }) {
  return (
    <View style={s.pad}>
      {stats.map((st, i) => (
        <FadeIn key={st.title} delay={i * 60} y={10}>
          <View style={[s.statRow, i === stats.length - 1 && { borderBottomWidth: 0 }]}>
            <T w="xbold" s={34} c={st.color}>{st.value}</T>
            <T w="bold" s={15} c={C.ink} style={{ marginTop: 14 }}>{st.title}</T>
            <T w="med" s={13} c={C.muted} style={{ marginTop: 4, lineHeight: 19 }}>{st.body}</T>
          </View>
        </FadeIn>
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
      {d.w > 0 && (
        <Svg width={d.w} height={d.h} style={StyleSheet.absoluteFill}>
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

function Impact({ I, onGo }) {
  // Alternate down two columns and drop the right one, so the cards stagger instead of
  // sitting in tidy rows — the wall reads as a collage, not a table.
  const cols = [[], []];
  I.achievers.forEach((a, i) => cols[i % 2].push(a));

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

      <View style={s.wall}>
        {cols.map((col, ci) => (
          <View key={ci} style={[s.wallCol, ci === 1 && { marginTop: 52 }]}>
            {col.map((a, i) => (
              <FadeIn key={`${a.name}-${a.grade}-${i}`} delay={(i * 2 + ci) * 70} y={12}>
                <AchieverCard a={a} />
              </FadeIn>
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
        <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', marginTop: 12, lineHeight: 21 }}>{S.body}</T>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail}>
        {S.items.map((it, i) => (
          <FadeIn key={`${it.name}-${i}`} delay={i * 70} y={10}>
            <View style={s.storyCard}>
              <View>
                {it.photo ? (
                  <Image source={{ uri: it.photo }} style={s.storyImg} resizeMode="cover" />
                ) : (
                  <View style={[s.storyImg, s.resStub]}><UserRound size={40} color="#C4CAD6" /></View>
                )}
                <View style={[s.storyChip, { backgroundColor: it.bg }]}>
                  <T w="xbold" s={11} c={C.ink}>{it.name.toUpperCase()}</T>
                </View>
              </View>
              <View style={[s.storyBody, { backgroundColor: it.bg }]}>
                <T w="xbold" s={17} c={C.ink} style={{ lineHeight: 24 }}>{it.title}</T>
                <T w="med" s={13} c={C.muted} style={{ marginTop: 10, lineHeight: 20 }}>{it.body}</T>
              </View>
            </View>
          </FadeIn>
        ))}
      </ScrollView>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail}>
        {P.items.map((v, i) => (
          <PressableScale key={`${v.name}-${i}`} onPress={() => open(v.url)} disabled={!v.url}>
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
        ))}
      </ScrollView>
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
          {CITIES.map(([lat, lon]) => {
            const p = project(lat, lon, R);
            if (p.z <= 0.1) return null;
            return <Circle key={`${lat},${lon}`} cx={R + 6 + p.x} cy={R + 6 + p.y} r={2.6} fill="#22C55E" opacity={0.35 + 0.5 * p.z} />;
          })}
        </Svg>
      )}
    </View>
  );
}

function Trusted({ TR }) {
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

      {/* The transformations, as pills you can push through. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, gap: 12, paddingTop: 26 }}>
        {TR.pills.map((p, i) => (
          <View key={p} style={[s.pill, i === 0 && s.pillOn]}>
            <T w="semi" s={13.5} c={i === 0 ? C.ink : '#fff'}>{p}</T>
          </View>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.revRail}>
        {TR.testimonials.map((r, i) => (
          <View key={`${r.name}-${i}`} style={s.revCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <T s={14}>{r.emoji}</T>
              <T w="xbold" s={13.5} c="#fff" style={{ flex: 1, letterSpacing: 0.3 }}>{r.title.toUpperCase()}</T>
            </View>
            <T w="med" s={13.5} c="rgba(255,255,255,0.66)" style={{ marginTop: 14, lineHeight: 21 }} numberOfLines={6}>{r.body}</T>
            <View style={s.revFoot}>
              <View style={s.revAvatar}>
                <T w="xbold" s={13} c="#fff">{r.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</T>
              </View>
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
      </ScrollView>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail}>
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
      </ScrollView>
    </View>
  );
}

/* ── Milestones — dark horizontal rail (hidden while timeline is empty) ───── */
function Timeline({ title, items }) {
  return (
    <View style={s.dark}>
      <T w="xbold" s={24} c="#fff" style={{ textAlign: 'center', lineHeight: 31, paddingHorizontal: 20 }}>{title}</T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, gap: 14 }}>
        {items.map((m, i) => (
          <View key={`${m.year}-${i}`} style={{ width: 260 }}>
            {m.image ? (
              <Image source={{ uri: m.image }} style={s.tlImg} resizeMode="cover" />
            ) : (
              <View style={[s.tlImg, s.tlStub]}>
                <ImageIcon size={30} color="rgba(255,255,255,0.28)" />
              </View>
            )}
            <View style={s.tlRule} />
            <T w="xbold" s={20} c="#fff" style={{ marginTop: 12 }}>{m.year}</T>
            <T w="med" s={13} c="rgba(255,255,255,0.72)" style={{ marginTop: 6, lineHeight: 19 }}>{m.body}</T>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ── Dark closing: photo bands · the letter · the founder strip ───────────── */
// A hairline-split row of session/event stills. A null photo holds its cell, so the band
// keeps its shape before the real pictures land.
function PhotoBand({ photos, style }) {
  return (
    <View style={[s.tsRow, style]}>
      {photos.map((p, i) => (
        <View key={i} style={s.tsCell}>
          {p
            ? <Image source={{ uri: p }} style={StyleSheet.absoluteFill} resizeMode="cover" />
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
      <PressableScale style={{ alignSelf: 'center', marginTop: 18 }} onPress={() => open(A.seeMoreUrl)}>
        <T w="bold" s={15} c={C.ink} style={{ textDecorationLine: 'underline' }}>See More</T>
      </PressableScale>
    </View>
  );
}

/* ── The page ─────────────────────────────────────────────────────────────── */
export default function AboutStack({ onGetStarted, onImpact, onTutors }) {
  const A = CONTENT.about;
  const E = CONTENT.event;
  const go = () => (onGetStarted ? onGetStarted() : open(E.become.appUrl));
  // The footer's "About Us" link — we're already on that page, so it rewinds to the top
  // rather than opening a second copy of it. "Our Impact" and "Our Tutors" hand off.
  const scrollRef = useRef(null);
  const toTop = () => scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: true });

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

        <View style={[s.pad, { marginTop: 34 }]}>
          <T w="xbold" s={24} c={C.ink} style={{ textAlign: 'center', lineHeight: 31 }}>{A.knowMoreTitle}</T>
          <View style={[s.grid, { marginTop: 16 }]}>
            {A.knowMore.map((k) => (
              <View key={k.label} style={s.tileWrap}>
                <PressableScale onPress={() => open(k.url)}>
                  <View style={[s.knowTile, { backgroundColor: k.bg }]}>
                    <ArrowUpRight size={18} color={C.ink} />
                    <T w="xbold" s={14} c={C.ink} style={{ marginTop: 26 }}>{k.label}</T>
                  </View>
                </PressableScale>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 34 }}><Faq A={A} /></View>

        <Movement M={A.movement} name={A.founder?.name} onGo={go} />

        {/* Closes with the same BECOME AILERNOVA™ + footer accordions + offices block as
            the Events page, so About Us and the other sections stay reachable from here. */}
        <View style={[s.pad, { marginTop: 20 }]}>
          <BecomePage E={E} onAbout={toTop} onImpact={onImpact} onTutors={onTutors} />
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
export function ImpactStack({ onGetStarted, onAbout, onTutors }) {
  const A = CONTENT.about;
  const E = CONTENT.event;
  const go = () => (onGetStarted ? onGetStarted() : open(E.become.appUrl));
  const scrollRef = useRef(null);
  const toTop = () => scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: true });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {!!A.impact?.achievers?.length && <Impact I={A.impact} onGo={go} />}

        <Stats stats={A.stats} />

        {/* Why it works, then how we do it. */}
        {!!A.research?.items?.length && <View style={{ marginTop: 34 }}><Research R={A.research} /></View>}
        <View style={{ marginTop: 30 }}><Pillars A={A} /></View>

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
          <BecomePage E={E} onAbout={onAbout} onImpact={toTop} onTutors={onTutors} />
        </View>
      </ScrollView>

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
          <View style={s.noteCard}>
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
              {t.photo ? (
                <Image source={{ uri: t.photo }} style={s.tutorImg} resizeMode="cover" />
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

export function TutorsStack({ onGetStarted, onAbout, onImpact }) {
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
        {!!TU.qualities?.items?.length && <Qualities Q={TU.qualities} />}
        {!!TU.meet?.items?.length && <MeetTutors M={TU.meet} />}
        {!!TU.match?.steps?.length && <View style={{ marginTop: 34 }}><Match M={TU.match} /></View>}

        {/* Tutor-specific questions, falling back to the shared set if none are written. */}
        <View style={{ marginTop: 34 }}>
          <Faq A={{ faqTitle: TU.faqTitle, faqs: TU.faqs?.length ? TU.faqs : A.faqs, seeMoreUrl: A.seeMoreUrl }} />
        </View>

        <Movement M={A.movement} name={A.founder?.name} onGo={go} />

        <View style={[s.pad, { marginTop: 20 }]}>
          {/* "Our Tutors" in the footer is this page — rewind instead of stacking a copy. */}
          <BecomePage E={E} onAbout={onAbout} onImpact={onImpact} onTutors={toTop} />
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

/* ── Full-screen modal wrappers ───────────────────────────────────────────── */
export function AboutModal({ visible, onClose, onGetStarted, onImpact, onTutors }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={s.head}>
          <PressableScale onPress={onClose} style={s.back}><T s={26} c={C.ink}>‹</T></PressableScale>
          <T w="bold" s={16} c={C.ink}>About Us</T><View style={{ width: 40 }} />
        </View>
        <AboutStack onGetStarted={onGetStarted} onImpact={onImpact} onTutors={onTutors} />
      </SafeAreaView>
    </Modal>
  );
}

export function ImpactModal({ visible, onClose, onGetStarted, onAbout, onTutors }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={s.head}>
          <PressableScale onPress={onClose} style={s.back}><T s={26} c={C.ink}>‹</T></PressableScale>
          <T w="bold" s={16} c={C.ink}>Our Impact</T><View style={{ width: 40 }} />
        </View>
        <ImpactStack onGetStarted={onGetStarted} onAbout={onAbout} onTutors={onTutors} />
      </SafeAreaView>
    </Modal>
  );
}

export function TutorsModal({ visible, onClose, onGetStarted, onAbout, onImpact }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={s.head}>
          <PressableScale onPress={onClose} style={s.back}><T s={26} c={C.ink}>‹</T></PressableScale>
          <T w="bold" s={16} c={C.ink}>Our Tutors</T><View style={{ width: 40 }} />
        </View>
        <TutorsStack onGetStarted={onGetStarted} onAbout={onAbout} onImpact={onImpact} />
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
  storyImg: { width: '100%', aspectRatio: 1, backgroundColor: '#EFF1F5' },
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
  revCard: { width: 300, padding: 20, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.14)' },
  revFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  revAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },

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
  noteCard: { backgroundColor: '#F4F5F7', paddingVertical: 24, paddingHorizontal: 20 },

  teachCard: { width: 290, backgroundColor: '#fff' },
  teachArt: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  teachBody: { padding: 18, flex: 1 },

  tutorCard: { width: 260, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', overflow: 'hidden' },
  tutorImg: { width: '100%', aspectRatio: 1, backgroundColor: '#EFF1F5' },
  tutorBody: { padding: 16, flex: 1 },
  tutorChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 12 },

  stepRow: { flexDirection: 'row', gap: 14 },
  stepDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, width: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 4 },

  faqItem: { borderTopWidth: 1, borderTopColor: C.border },
  faqHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 17 },

  stickyWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingBottom: 18, paddingTop: 10 },
  sticky: { backgroundColor: C.gold, borderRadius: 12, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
});
