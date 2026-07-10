import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import Svg, {
  Defs, LinearGradient, Stop, Path, Ellipse, Circle, Rect, G,
} from 'react-native-svg';
import { T, stateColor } from './premiumTheme';

// Optional video avatar (a real talking face) — degrades gracefully if expo-av
// isn't available. A looping muted clip gives REAL lip movement + blink.
let ExpoAV = null;
try { ExpoAV = require('expo-av'); } catch (e) { ExpoAV = null; }
const VIDEO_OK = !!(ExpoAV && ExpoAV.Video);

// ── Premium AI human-teacher avatar ──────────────────────────────────────────
// A refined, illustrated human tutor (Bloom / Duolingo-Max style) rendered in
// SVG with gradient shading — plus real micro-motion so she feels alive:
//   • eye blinking (always)        • subtle head sway (always)
//   • lip-sync while speaking      • speaking glow + pulse ring
//   • facial expressions: happy · thinking · explaining · encouraging
//
// Drivers: lip-sync + blink animate SVG props (useNativeDriver:false); head sway,
// glow and rings animate plain Views (native driver) for 60fps.

const AEllipse = Animated.createAnimatedComponent(Ellipse);
const ARect = Animated.createAnimatedComponent(Rect);
const ACircle = Animated.createAnimatedComponent(Circle);

// Expression → brow + mouth shape (resting) + gaze direction + optional one-shot
// motion (`special`). Lip-sync overrides the mouth while speaking, but the smile
// corners + brows stay per-expression. eyeDir = fixed pupil gaze { x:-1..1, y:-1..1 }
// (null = free idle drift). This is the teacher's whole behavioural vocabulary.
function expressionShapes(expr) {
  switch (expr) {
    case 'thinking':
      return { browL: 'M58 86 q12 -8 24 -3', browR: 'M118 83 q12 -2 24 4', mouth: 'M88 140 q12 4 24 0', eyeUp: -2, eyeDir: { x: 0.6, y: -0.7 } }; // glances up, pondering
    case 'explaining':
      return { browL: 'M58 84 q12 -4 24 -1', browR: 'M118 83 q12 -1 24 3', mouth: 'M84 138 q16 8 32 0', eyeUp: 0, eyeDir: null };
    case 'encouraging':
      return { browL: 'M58 80 q12 -6 24 -2', browR: 'M118 78 q12 -2 24 6', mouth: 'M80 136 q20 16 40 0', eyeUp: 0, eyeDir: null };
    case 'surprise':
      return { browL: 'M56 74 q12 -9 24 -3', browR: 'M118 73 q12 -3 24 7', mouth: 'M90 138 q10 12 20 0', eyeUp: -3, eyeDir: { x: 0, y: 0 }, special: 'flash' }; // brows way up, eyes wide, small O
    case 'celebrate':
      return { browL: 'M58 78 q12 -7 24 -2', browR: 'M118 76 q12 -2 24 7', mouth: 'M78 135 q22 18 44 0', eyeUp: 0, eyeDir: { x: 0, y: -0.3 }, happyEyes: true, special: 'bounce' }; // big grin + a little bounce
    case 'writing':
      return { browL: 'M58 85 q12 -4 24 -1', browR: 'M118 84 q12 -1 24 3', mouth: 'M88 139 q12 4 24 0', eyeUp: 1, eyeDir: { x: 0, y: 1 } }; // focused, looking DOWN at the board
    case 'pointing':
      return { browL: 'M58 82 q12 -5 24 -1', browR: 'M118 81 q12 -1 24 4', mouth: 'M84 137 q16 9 32 0', eyeUp: 0, eyeDir: { x: 1, y: 0.3 } }; // looks toward the board (aside)
    case 'waiting':
      return { browL: 'M58 83 q12 -5 24 -1', browR: 'M118 82 q12 -1 24 4', mouth: 'M84 138 q16 8 32 0', eyeUp: 0, eyeDir: null, calm: true }; // patient, gentle
    case 'smile':
      return { browL: 'M58 81 q12 -6 24 -2', browR: 'M118 80 q12 -2 24 5', mouth: 'M80 136 q20 15 40 0', eyeUp: 0, eyeDir: null };
    case 'happy':
    default:
      return { browL: 'M58 83 q12 -5 24 -1', browR: 'M118 82 q12 -1 24 4', mouth: 'M84 137 q16 11 32 0', eyeUp: 0, eyeDir: null };
  }
}

function Ripple({ color, size, delay }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(a, { toValue: 1, duration: 1800, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [a, delay]);
  return (
    <Animated.View pointerEvents="none" style={[styles.ring, {
      width: size, height: size, borderRadius: size / 2, borderColor: color,
      opacity: a.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.45, 0] }),
      transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.62, 1.22] }) }],
    }]} />
  );
}

// Warm accents for the cream classroom theme.
const CREAM_ACCENT = { speaking: '#FF8A3D', listening: '#3B82F6', thinking: '#E0A23C', idle: '#FF8A3D' };

function TeacherAvatar({ state = 'idle', expression, size = 160, theme = 'dark', photo, video, style }) {
  const [imgError, setImgError] = useState(false);
  const useVid = !!video && VIDEO_OK;                 // real talking video (best: lip-sync + blink)
  const useImg = !useVid && !!photo && !imgError;     // real static photo (no lip movement)
  const speaking = state === 'speaking';
  const listening = state === 'listening';
  const thinking = state === 'thinking';
  const accent = theme === 'cream' ? (CREAM_ACCENT[state] || CREAM_ACCENT.idle) : stateColor(state);
  const expr = expression || (thinking ? 'thinking' : speaking ? 'explaining' : listening ? 'thinking' : 'happy');
  const shp = useMemo(() => expressionShapes(expr), [expr]);

  const blink = useRef(new Animated.Value(1)).current; // 1 = open, 0 = closed
  const sway = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const mouth = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const dots = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current; // gentle idle breathing
  const look = useRef(new Animated.Value(0)).current;   // slow pupil drift (alive eyes)
  const nod = useRef(new Animated.Value(0)).current;    // talking head-nod emphasis

  // blink — periodic, with a natural double-blink now and then
  useEffect(() => {
    let cancelled = false;
    const one = () => Animated.sequence([
      Animated.timing(blink, { toValue: 0, duration: 80, useNativeDriver: false }),
      Animated.timing(blink, { toValue: 1, duration: 110, useNativeDriver: false }),
    ]);
    const loop = () => {
      if (cancelled) return;
      Animated.sequence([
        Animated.delay(2200 + Math.round(Math.random() * 2600)),
        one(),
      ]).start(() => loop());
    };
    loop();
    return () => { cancelled = true; };
  }, [blink]);

  // gentle head sway, always on
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(sway, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(sway, { toValue: -1, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(sway, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [sway]);

  // soft idle breathing — a barely-there scale, always on (makes her feel alive)
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [breath]);

  // talking head-nod — while she speaks, her head bobs gently on emphasis (people
  // move their head when they explain). Off when silent, so it never looks fidgety.
  useEffect(() => {
    let loop;
    if (speaking) {
      loop = Animated.loop(Animated.sequence([
        Animated.timing(nod, { toValue: 1, duration: 620, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(nod, { toValue: 0, duration: 560, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(220),
      ]));
      loop.start();
    } else { Animated.timing(nod, { toValue: 0, duration: 300, useNativeDriver: true }).start(); }
    return () => loop && loop.stop();
  }, [speaking, nod]);

  // slow pupil drift — eyes occasionally glance aside, then back to centre
  useEffect(() => {
    let cancelled = false;
    const step = () => {
      if (cancelled) return;
      // While teaching she HOLDS eye contact (centre) and only flicks away briefly;
      // when idle she lets her gaze wander more. Centre = looking at the student.
      const amp = speaking ? 0.32 : 0.9;
      const awayMs = speaking ? 380 : 520;
      const awayHold = speaking ? 360 + Math.random() * 700 : 900 + Math.random() * 1800;
      const centreHold = speaking ? 1600 + Math.random() * 2400 : 700 + Math.random() * 1600;
      const to = (Math.random() * 2 - 1) * amp;
      Animated.sequence([
        Animated.timing(look, { toValue: to, duration: awayMs, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.delay(awayHold),
        Animated.timing(look, { toValue: 0, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.delay(centreHold),
      ]).start(() => step());
    };
    step();
    return () => { cancelled = true; };
  }, [look, speaking]);

  // glow
  useEffect(() => {
    const active = speaking || listening || thinking;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: active ? 0.4 : 0.12, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow, speaking, listening, thinking]);

  // lip-sync + speaking pulse ring — ORGANIC, not a fixed flap. Each "syllable"
  // opens to a random amplitude over a random short duration, then eases mostly
  // closed, so the mouth never loops the same shape twice (reads as real speech).
  // When she stops, the mouth eases shut (120ms) instead of snapping.
  useEffect(() => {
    let cancelled = false; let p;
    if (speaking) {
      const syllable = () => {
        if (cancelled) return;
        const open = 0.5 + Math.random() * 0.5;   // 0.5 … 1.0 aperture
        const rest = 0.06 + Math.random() * 0.2;  // brief between-syllable close
        const upMs = 66 + Math.round(Math.random() * 72);
        const dnMs = 58 + Math.round(Math.random() * 84);
        Animated.sequence([
          Animated.timing(mouth, { toValue: open, duration: upMs, easing: Easing.out(Easing.quad), useNativeDriver: false }),
          Animated.timing(mouth, { toValue: rest, duration: dnMs, easing: Easing.in(Easing.quad), useNativeDriver: false }),
        ]).start(({ finished }) => { if (finished) syllable(); });
      };
      syllable();
      p = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1650, easing: Easing.out(Easing.quad), useNativeDriver: true }));
      p.start();
    } else {
      Animated.timing(mouth, { toValue: 0, duration: 130, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start();
      pulse.setValue(0);
    }
    return () => { cancelled = true; p && p.stop(); };
  }, [speaking, mouth, pulse]);

  // thinking dots
  useEffect(() => {
    let d;
    if (thinking) {
      d = Animated.loop(Animated.sequence([
        Animated.timing(dots, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dots, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]));
      d.start();
    } else { dots.setValue(0); }
    return () => { d && d.stop(); };
  }, [thinking, dots]);

  const orb = size;
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.4] });
  const swayRotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-2.6deg', '2.6deg'] });
  const swayY = sway.interpolate({ inputRange: [-1, 1], outputRange: [1.5, -1.5] });
  // nod bob while talking, and a small static lean toward whatever she's pointing at
  // (eyeDir.x > 0 → the board), so her head engages with the board, not just her eyes.
  const nodY = nod.interpolate({ inputRange: [0, 1], outputRange: [0, -2.4] });
  const leanRotate = `${(shp.eyeDir && typeof shp.eyeDir.x === 'number' ? shp.eyeDir.x : 0) * 2.4}deg`;
  // eyelid height: 0 when open, ~14 when closed
  const lidH = blink.interpolate({ inputRange: [0, 1], outputRange: [15, 0] });
  // inner mouth opening for lip-sync — kept SUBTLE (a natural speaking mouth, not
  // a big cartoon "O"). Only ever animates while `speaking` is true.
  const mouthRy = mouth.interpolate({ inputRange: [0, 1], outputRange: [0, 3.6] });
  const eyeY = 100 + (shp.eyeUp || 0);
  const breathScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  // horizontal pupil position for a given resting cx (drifts ±1.8px)
  const lx = (base) => look.interpolate({ inputRange: [-1, 1], outputRange: [base - 1.8, base + 1.8] });

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* glow */}
      <Animated.View pointerEvents="none" style={[styles.glow, { width: size, height: size, borderRadius: size, backgroundColor: accent, opacity: glowOpacity }]} />

      {/* listening ripples */}
      {listening && (
        <>
          <Ripple color={accent} size={size * 0.96} delay={0} />
          <Ripple color={accent} size={size * 0.96} delay={650} />
          <Ripple color={accent} size={size * 0.96} delay={1300} />
        </>
      )}

      {/* speaking pulse ring */}
      {speaking && (
        <Animated.View pointerEvents="none" style={[styles.ring, {
          width: orb * 0.96, height: orb * 0.96, borderRadius: orb, borderColor: accent, borderWidth: 2.5,
          opacity: pulse.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.5, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.22] }) }],
        }]} />
      )}

      {/* the portrait — a REAL photo when `photo` is provided, else illustrated */}
      <Animated.View style={[styles.frame, { width: size, height: size, borderRadius: size / 2, borderColor: accent, backgroundColor: theme === 'cream' ? '#FFF7EE' : '#11151D', transform: [{ rotate: swayRotate }, { rotate: leanRotate }, { translateY: swayY }, { translateY: nodY }, { scale: breathScale }] }]}>
        {useVid ? (
          <ExpoAV.Video
            source={video}
            isMuted
            isLooping
            shouldPlay
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />
        ) : useImg ? (
          <Image source={photo} resizeMode="cover" style={{ width: '100%', height: '100%' }} onError={() => setImgError(true)} />
        ) : (
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Defs>
            {/* LinearGradients only — Android's native RadialGradient throws on
                degenerate/edge cases; linear is rock-solid. */}
            <LinearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
              <Stop offset="0%" stopColor={theme === 'cream' ? '#FFF7EE' : '#2A2E42'} />
              <Stop offset="55%" stopColor={theme === 'cream' ? '#FBEFDD' : '#1B1E2D'} />
              <Stop offset="100%" stopColor={theme === 'cream' ? '#F6E2C6' : '#10121C'} />
            </LinearGradient>
            <LinearGradient id="hair" x1="0.2" y1="0" x2="0.5" y2="1">
              <Stop offset="0%" stopColor="#4A3320" />
              <Stop offset="100%" stopColor="#241608" />
            </LinearGradient>
            <LinearGradient id="top" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={theme === 'cream' ? '#2BB3A3' : '#8B5CF6'} />
              <Stop offset="100%" stopColor={theme === 'cream' ? '#178E80' : '#5B21B6'} />
            </LinearGradient>
          </Defs>

          {/* backdrop + soft top rim light */}
          <Circle cx="100" cy="100" r="100" fill="url(#bg)" />
          <Ellipse cx="100" cy="46" rx="58" ry="22" fill="#FFFFFF" opacity={0.05} />

          {/* hair behind — long, framing the face */}
          <Path d="M46 104 C40 44 70 24 100 24 C130 24 160 44 154 104 C158 150 150 184 140 198 L126 198 C134 162 130 122 120 106 L80 106 C70 122 66 162 74 198 L60 198 C50 184 42 150 46 104 Z" fill="url(#hair)" />

          {/* shoulders / blazer + a crisp collar */}
          <Path d="M34 200 C38 166 60 154 84 148 L116 148 C140 154 162 166 166 200 Z" fill="url(#top)" />
          <Path d="M84 148 L100 170 L116 148 Z" fill="#F2F0FA" opacity={0.95} />
          <Path d="M100 158 L100 200" stroke="#4C1D95" strokeWidth={2} opacity={0.4} />

          {/* neck — SAME flat skin tone, sits BELOW the chin */}
          <Path d="M89 136 Q100 148 111 136 L111 156 Q100 162 89 156 Z" fill="#ECB892" />

          {/* face — one clean flat skin tone, CHUBBY (full round cheeks) */}
          <Path d="M59 86 C57 58 78 47 100 47 C122 47 143 58 141 86 C140 112 131 132 100 142 C69 132 60 112 59 86 Z" fill="#ECB892" />

          {/* ears (same skin) + tiny gold studs */}
          <Ellipse cx="60" cy="97" rx="6" ry="9.5" fill="#ECB892" />
          <Ellipse cx="140" cy="97" rx="6" ry="9.5" fill="#ECB892" />
          <Circle cx="60" cy="106" r="1.5" fill="#FFE08A" />
          <Circle cx="140" cy="106" r="1.5" fill="#FFE08A" />

          {/* hair front — soft side-parting */}
          <Path d="M59 86 C57 50 79 40 100 40 C121 40 143 50 141 86 C137 67 125 56 116 58 C109 50 100 51 100 51 C100 51 91 50 84 58 C75 56 63 67 59 86 Z" fill="url(#hair)" />

          {/* eyebrows (expression-driven) */}
          <Path d={shp.browL} fill="none" stroke="#46301E" strokeWidth="3.4" strokeLinecap="round" />
          <Path d={shp.browR} fill="none" stroke="#46301E" strokeWidth="3.4" strokeLinecap="round" />

          {/* eyes — clean almond, simple iris */}
          <G>
            <Ellipse cx="79" cy={eyeY} rx="9.5" ry="6" fill="#FBF8F3" />
            <Ellipse cx="121" cy={eyeY} rx="9.5" ry="6" fill="#FBF8F3" />
            <ACircle cx={lx(80)} cy={eyeY} r="4.2" fill="#5B3B22" />
            <ACircle cx={lx(80)} cy={eyeY} r="2" fill="#160F09" />
            <ACircle cx={lx(81.4)} cy={eyeY - 1.5} r="1.1" fill="#fff" opacity={0.95} />
            <ACircle cx={lx(120)} cy={eyeY} r="4.2" fill="#5B3B22" />
            <ACircle cx={lx(120)} cy={eyeY} r="2" fill="#160F09" />
            <ACircle cx={lx(121.4)} cy={eyeY - 1.5} r="1.1" fill="#fff" opacity={0.95} />
            {/* upper lash line */}
            <Path d={`M69 ${eyeY - 5} Q79 ${eyeY - 9} 89 ${eyeY - 5}`} fill="none" stroke="#241812" strokeWidth="2.2" strokeLinecap="round" />
            <Path d={`M111 ${eyeY - 5} Q121 ${eyeY - 9} 131 ${eyeY - 5}`} fill="none" stroke="#241812" strokeWidth="2.2" strokeLinecap="round" />
            {/* animated eyelids (blink) — SAME skin fill, seamless */}
            <ARect x="69" y={eyeY - 7} width="21" height={lidH} rx="5.5" fill="#ECB892" />
            <ARect x="111" y={eyeY - 7} width="21" height={lidH} rx="5.5" fill="#ECB892" />
          </G>

          {/* nose — one soft tip shadow */}
          <Path d="M100 104 L96 117 Q100 120 104 117 Z" fill="#D49C70" opacity={0.4} />

          {/* chubby cheeks — fuller blush, set wider */}
          <Ellipse cx="74" cy="118" rx="9.5" ry="6" fill="#EE9C88" opacity={0.24} />
          <Ellipse cx="126" cy="118" rx="9.5" ry="6" fill="#EE9C88" opacity={0.24} />

          {/* MOUTH — a SINGLE element on the FACE (above the chin): lips + an opening
              that grows only while speaking */}
          <Path d="M88 124 Q100 131 112 124 Q100 128 88 124 Z" fill="#B5564B" />
          <AEllipse cx="100" cy="126" rx="7" ry={mouthRy} fill="#5E211F" />
        </Svg>
        )}
      </Animated.View>

      {/* thinking dots */}
      {thinking && (
        <Animated.View style={[styles.thinkDots, { opacity: dots.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }]}>
          <View style={[styles.thinkDot, { backgroundColor: T.thinking }]} />
          <View style={[styles.thinkDot, { backgroundColor: T.thinking, opacity: 0.7 }]} />
          <View style={[styles.thinkDot, { backgroundColor: T.thinking, opacity: 0.45 }]} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute' },
  ring: { position: 'absolute', borderWidth: 2 },
  frame: {
    overflow: 'hidden', borderWidth: 2, backgroundColor: '#11151D',
    // soft, layered drop shadow (real elevation) rather than a flat coloured glow —
    // the animated colour halo lives in the `glow` view behind this.
    shadowColor: '#1B2233', shadowOpacity: 0.26, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
  thinkDots: { position: 'absolute', top: -2, flexDirection: 'row', gap: 6 },
  thinkDot: { width: 8, height: 8, borderRadius: 4 },
});

// Memoised: the avatar's motion is driven by Animated refs, not re-renders, so it
// only needs to re-render when its props change (state / expression / size).
export default React.memo(TeacherAvatar);
