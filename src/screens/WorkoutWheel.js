// src/screens/WorkoutWheel.js
// AILERNOVA — dark "radar" Brain Gym workout wheel (react-native-svg).
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform,
  TouchableOpacity, Animated, Dimensions, Easing, PanResponder,
} from 'react-native';
import Svg, { Path, Circle, G, Rect, Line, Defs, TextPath, Text as SvgText } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { FONT } from '../constants/fonts';
import { initSounds, playLoop, playSound, stopSound, startLoop, stopLoop } from '../utils/sound';
import { peekPracticeStreak } from '../utils/storage';
import { pressSpring, PRESS_SCALE } from './braingym/motion';
import ArcTabs from './braingym/ArcTabs';

const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_W - 40, 330);

const VB = 300;
const C = VB / 2;
const R_OUTER = 140;
const R_INNER = 116;  // thin band — just wide enough for the label
const R_LABEL = 128;  // labels — centered in the thin band ring
const R_EMOJI = 87;   // skill icon — sits in the wider dark gap between START and the ring

const polar = (r, deg) => {
  const rad = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(rad), y: C - r * Math.cos(rad) };
};
const wedge = (a0, a1, rOut, rIn) => {
  const large = a1 - a0 > 180 ? 1 : 0;
  const p1 = polar(rOut, a0), p2 = polar(rOut, a1), p3 = polar(rIn, a1), p4 = polar(rIn, a0);
  return [`M ${p1.x} ${p1.y}`, `A ${rOut} ${rOut} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`, `A ${rIn} ${rIn} 0 ${large} 0 ${p4.x} ${p4.y}`, 'Z'].join(' ');
};
// Positions match the BrainGym design: APPLICATION top, UNDERSTANDING right,
// FLUENCY bottom, REASONING left (segment centers sit at index*90°).
const SEG = {
  application:   { a0: -45, a1: 45 },   // top
  understanding: { a0: 45,  a1: 135 },  // right
  fluency:       { a0: 135, a1: 225 },  // bottom
  reasoning:     { a0: 225, a1: 315 },  // left
};
// Where the four quadrants meet — thin radial divider lines run out along these.
const DIVIDERS = [45, 135, 225, 315];

// A curved path along the ring band for a skill's label so the text follows the circle.
// The bottom label (mid ≈ 180) is drawn reversed so it stays upright (not upside-down).
const labelArcPath = (key, r) => {
  const seg = SEG[key];
  return labelArcPathAt((seg.a0 + seg.a1) / 2, r);
};
// Same, but for an arbitrary on-screen mid angle (used by the upright label layer,
// which positions each label at its CURRENT screen angle regardless of wheel spin).
function labelArcPathAt(midDeg, r) {
  const mid = ((midDeg % 360) + 360) % 360;
  const rev = mid > 90 && mid < 270;                 // bottom half → draw reversed (upright)
  const pad = 6;
  const start = rev ? mid + 45 - pad : mid - 45 + pad;
  const end = rev ? mid - 45 + pad : mid + 45 - pad;
  const p0 = polar(r, start), p1 = polar(r, end);
  const sweep = start < end ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 0 ${sweep} ${p1.x} ${p1.y}`;
}
const ORDER = ['application', 'understanding', 'fluency', 'reasoning'];
const EMOJI = { reasoning: '🧠', application: '⚙️', understanding: '💡', fluency: '⚡' };

// Line-art skill icons drawn INSIDE the wheel SVG (so they rotate with it). Each skill
// CYCLES between two related mini-icons (Cuemath-style "the skill is thinking") — the
// caller passes the current variant `v` (0/1) which flips on a timer. White/grey when
// idle, a bright accent on the active skill.
const skillIcon = (cx, cy, key, color, v) => {
  const p = { stroke: color, strokeWidth: 1.7, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const rp = (r, deg) => ({ x: cx + r * Math.sin((deg * Math.PI) / 180), y: cy - r * Math.cos((deg * Math.PI) / 180) });

  if (key === 'reasoning') {
    if (v === 0) return (
      <G>
        <Line x1={cx - 8} y1={cy - 5} x2={cx + 7} y2={cy} {...p} />
        <Line x1={cx - 8} y1={cy + 5} x2={cx + 7} y2={cy} {...p} />
        <Circle cx={cx - 8} cy={cy - 5} r={2.4} fill={color} />
        <Circle cx={cx - 8} cy={cy + 5} r={2.4} fill={color} />
        <Rect x={cx + 4.5} y={cy - 3} width={6} height={6} rx={1} {...p} />
      </G>
    );
    return (
      <G>
        {[-6, 0, 6].map((dy, idx) => <Circle key={idx} cx={cx - 7} cy={cy + dy} r={2.3} fill={color} />)}
        {[-6, 0, 6].map((dy, idx) => <Rect key={'s' + idx} x={cx + 3.5} y={cy + dy - 2.6} width={5.2} height={5.2} rx={1} {...p} />)}
      </G>
    );
  }

  if (key === 'application') {
    if (v === 0) return ( // gear
      <G>
        {[0, 90, 180, 270].map((a, idx) => { const a1 = rp(4.5, a), a2 = rp(8.5, a); return <Line key={idx} x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} {...p} />; })}
        <Circle cx={cx} cy={cy} r={4.6} {...p} />
        <Circle cx={cx} cy={cy} r={1.5} fill={color} />
      </G>
    );
    return ( // exponent Xⁿ
      <G>
        <SvgText x={cx - 1} y={cy + 6} fontSize={17} fontWeight="800" fill={color} textAnchor="middle">X</SvgText>
        <SvgText x={cx + 7} y={cy - 3} fontSize={9} fontWeight="800" fill={color} textAnchor="middle">n</SvgText>
      </G>
    );
  }

  if (key === 'understanding') {
    if (v === 0) return ( // lightbulb
      <G>
        <Circle cx={cx} cy={cy - 2} r={5} {...p} />
        <Line x1={cx - 3} y1={cy + 5} x2={cx + 3} y2={cy + 5} {...p} />
        <Line x1={cx - 2.4} y1={cy + 8} x2={cx + 2.4} y2={cy + 8} {...p} />
      </G>
    );
    return ( // compare shapes  △ ▢
      <G>
        <Path d={`M ${cx - 7} ${cy + 4} L ${cx - 3.5} ${cy - 4} L ${cx} ${cy + 4} Z`} {...p} />
        <Rect x={cx + 2} y={cy - 3.5} width={7} height={7} rx={1} {...p} />
      </G>
    );
  }

  // fluency
  if (v === 0) return <Path d={`M ${cx + 2.5} ${cy - 8} L ${cx - 5} ${cy + 1} L ${cx - 0.5} ${cy + 1} L ${cx - 2.5} ${cy + 8} L ${cx + 5} ${cy - 2} L ${cx + 0.5} ${cy - 2} Z`} fill={color} stroke={color} strokeWidth={0.8} strokeLinejoin="round" />;
  return ( // triangle with a tick
    <G>
      <Path d={`M ${cx} ${cy - 7} L ${cx + 7} ${cy + 6} L ${cx - 7} ${cy + 6} Z`} {...p} />
      <Line x1={cx} y1={cy - 1} x2={cx} y2={cy + 6} {...p} />
    </G>
  );
};

const COL = {
  bg: '#0B0B0D', radar: '#16161A', radar2: '#1E1E24',
  seg: '#141418', segLit: '#202026', segStroke: '#2C2C33',
  white: '#FFFFFF', label: '#6E6E77', labelLit: '#FFFFFF',
  green: '#39D98A', orange: '#E07B39', red: '#E0322E', sub: '#8A8A93',
};

// Faint radar rings behind the wheel.
const RADAR_RINGS = [30, 46, 62, 78, 150, 166];

// First-run coach mark shown once per app session.
let coachSeen = false;

// A button that springs down on press — tactile feedback for the wheel's CTAs.
const PressBtn = ({ style, onPress, disabled, activeOpacity = 0.9, children }) => {
  const sc = useRef(new Animated.Value(1)).current;
  const to = (v) => pressSpring(sc, v).start();
  return (
    <TouchableOpacity activeOpacity={activeOpacity} disabled={disabled} onPress={onPress}
      onPressIn={() => !disabled && to(PRESS_SCALE)} onPressOut={() => to(1)}>
      <Animated.View style={[style, { transform: [{ scale: sc }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const WorkoutWheel = ({
  topic = 'Exponents Basics & Evaluation',
  user = {},
  skills,
  xp = 40,
  defaultActiveKey = 'fluency',
  spinOnStart = true,
  onStart,
  onSelectSkill,
  activeTab = 'workout',
  onTabPress,
  onBack,
  onLeaderboard,
}) => {
  const { user: authUser } = useAuth();
  const u = user || {};
  const uName  = u.name ?? authUser?.name ?? 'Learner';
  const uGrade = u.grade ?? '';
  const uXp    = u.xp ?? xp;

  const data = useMemo(() => {
    const provided = {};
    (skills || []).forEach((s) => { if (s && s.key) provided[s.key] = s; });
    const fallback = {
      reasoning:     { key: 'reasoning',     label: 'REASONING' },
      application:   { key: 'application',   label: 'APPLICATION' },
      understanding: { key: 'understanding', label: 'UNDERSTANDING' },
      fluency:       { key: 'fluency',       label: 'FLUENCY' },
    };
    return ORDER.map((k) => ({ ...fallback[k], ...(provided[k] || {}) }));
  }, [skills]);

  const defaultIdx = Math.max(0, ORDER.indexOf(defaultActiveKey));
  const [lit, setLit] = useState(defaultIdx);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState(null);
  // Only show the "you lost your streak" nudge when the player is genuinely returning
  // after a gap (streak actually broke). null = hidden.
  const [streakLoss, setStreakLoss] = useState(null);
  const [coach, setCoach] = useState(!coachSeen);
  const dismissCoach = () => { coachSeen = true; setCoach(false); };
  const [iconStep, setIconStep] = useState(0); // flips the skill icons between variants
  const [restRotDeg, setRestRotDeg] = useState(0); // where the upright label/icon layer sits (deg)

  // Cycle the inner skill icons so each wedge feels "alive" (like the Cuemath wheel).
  useEffect(() => {
    const id = setInterval(() => setIconStep((s) => s + 1), 1500);
    return () => clearInterval(id);
  }, []);

  const pulse = useRef(new Animated.Value(0)).current;
  const pressStart = useRef(new Animated.Value(1)).current; // START button press feedback
  const enter = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current; // cumulative degrees
  const rotRef = useRef(0);
  const labelOpacity = useRef(new Animated.Value(1)).current; // fades the upright layer during a turn
  const mountedRef = useRef(true); // guards async animation callbacks after unmount

  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [enter, pulse]);

  // Load the wheel sounds once; stop the spin loop if we leave mid-spin.
  useEffect(() => {
    initSounds();
    return () => { stopSound('spin'); };
  }, []);

  // Show the streak-lost nudge only if the streak really broke (missed 2+ days).
  useEffect(() => {
    peekPracticeStreak().then((info) => {
      if (mountedRef.current && info && info.broken) setStreakLoss(info);
    }).catch(() => {});
  }, []);

  // Tap a wedge → it lights up (selected) and the wheel spins. It's NOT random: the
  // tap picks the skill, then the wheel does a few full turns and decelerates to a
  // stop. It lands back upright (net rotation ≡ 0°) so every label + icon stays the
  // right way up; the tapped skill is the one highlighted at rest. Centre START then
  // launches that skill's quiz.
  const selectSkill = (i) => {
    if (i == null || i < 0 || i >= data.length) return;
    if (spinningRef.current || i === lit) return;   // ignore mid-turn / already selected
    setSpinning(true);
    playSound('tick');
    startLoop('spin');                    // whoosh (no-op until a spin loop sound is added)
    setLit(i);                            // the tapped wedge lights up…
    lastLitRef.current = i;
    // …and the wheel turns the SHORT way so that wedge lands at the bottom (the selected
    // slot) — e.g. a top wedge just swings down. Labels + icons live in a separate upright
    // layer, so we fade them out for the turn and back in once repositioned: nothing flips.
    const seg = SEG[data[i].key];
    const localMid = (seg.a0 + seg.a1) / 2;
    const currentScreen = (((localMid + rotRef.current) % 360) + 360) % 360;
    const delta = norm(180 - currentScreen);         // shortest signed turn to the bottom
    const target = rotRef.current + delta;
    rotRef.current = target;
    Animated.timing(labelOpacity, { toValue: 0, duration: 130, useNativeDriver: true }).start();
    Animated.timing(rotation, {
      toValue: target, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start(({ finished }) => {
      stopLoop('spin');
      if (!mountedRef.current) return;
      setRestRotDeg((((target % 360) + 360) % 360));  // reposition the upright layer
      setSpinning(false);
      Animated.timing(labelOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      if (finished) playSound('success');
    });
  };

  // Centre button starts the quiz for the currently selected skill (ignored mid-spin).
  const onCenter = () => { if (spinningRef.current) return; onStart && onStart(data[lit]); };

  // ── Manual drag-to-rotate ───────────────────────────────────────────────────
  // Same wheel, same `rotation`/`lit`/`landed` state as the random spin — the only
  // new affordance is a finger drag. Release snaps to the nearest segment center
  // (under the top pointer) and "lands" it exactly like a spin, so the confirm UI
  // (X selected! → Start) is shared and questions load for the chosen category.
  const wheelRef    = useRef(null);
  const centerRef   = useRef({ x: 0, y: 0 });   // wheel center in window coords
  const spinningRef = useRef(false);            // live mirror of `spinning` for handlers
  const snappingRef = useRef(false);            // true while the post-drag snap animates
  const lastLitRef  = useRef(defaultIdx);       // avoid redundant setLit() while dragging
  const dataRef     = useRef(data);
  const dragRef     = useRef({ lastAngle: 0, lastT: 0, vel: 0 });

  useEffect(() => { spinningRef.current = spinning; }, [spinning]);
  useEffect(() => { dataRef.current = data; }, [data]);

  const measureCenter = () => {
    wheelRef.current?.measureInWindow?.((x, y, w, h) => {
      centerRef.current = { x: x + w / 2, y: y + h / 2 };
    });
  };

  // Angle of a window point around the wheel center, clockwise from the top (0°).
  const angleOf = (x, y) => {
    const c = centerRef.current;
    return (Math.atan2(x - c.x, -(y - c.y)) * 180) / Math.PI;
  };
  // Shortest signed delta between two angles (handles the 180/-180 wrap).
  const norm = (d) => { d %= 360; if (d > 180) d -= 360; if (d < -180) d += 360; return d; };
  // Which segment sits under the top pointer for a given cumulative rotation.
  const indexFromRot = (rot) => (((Math.round(-rot / 90) % 4) + 4) % 4);

  const pan = useRef(PanResponder.create({
    // Let taps (center button, wedges) through; only claim real drags.
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_e, g) =>
      !spinningRef.current && !snappingRef.current &&
      (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
    // Capture so a drag is stolen from the SVG wedges (which grab touch-start for
    // their onPress). A tap has ~0 movement, so it still falls through to the wedge.
    onMoveShouldSetPanResponderCapture: (_e, g) =>
      !spinningRef.current && !snappingRef.current &&
      (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
    onPanResponderGrant: () => {
      measureCenter();
      // Baseline is established on the FIRST move (when centerRef is guaranteed
      // measured), so an as-yet-unmeasured center can't cause a startup jump.
      dragRef.current = { lastAngle: 0, lastT: Date.now(), vel: 0, primed: false };
      setLanded(null); // re-dragging clears any previous landing
    },
    onPanResponderMove: (_e, g) => {
      const a = angleOf(g.moveX, g.moveY);
      if (!dragRef.current.primed) {
        dragRef.current.lastAngle = a;
        dragRef.current.lastT = Date.now();
        dragRef.current.primed = true;
        return; // first frame just anchors the baseline; no rotation applied
      }
      const step = norm(a - dragRef.current.lastAngle);
      const newRot = rotRef.current + step;
      rotRef.current = newRot;
      rotation.setValue(newRot);

      const now = Date.now();
      const dt = now - dragRef.current.lastT;
      if (dt > 0) dragRef.current.vel = step / dt; // deg/ms, for the release fling
      dragRef.current.lastAngle = a;
      dragRef.current.lastT = now;

      // Live-highlight the segment currently under the pointer.
      const i = indexFromRot(newRot);
      if (i !== lastLitRef.current) { lastLitRef.current = i; setLit(i); }
    },
    onPanResponderRelease: () => {
      // Fast swipe carries further; a small drag still snaps to the nearest center.
      const fling = Math.max(-360, Math.min(360, dragRef.current.vel * 140));
      const snapped = Math.round((rotRef.current + fling) / 90) * 90;
      rotRef.current = snapped;
      snappingRef.current = true;
      Animated.timing(rotation, {
        toValue: snapped, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }).start(({ finished }) => {
        snappingRef.current = false;
        if (!finished || !mountedRef.current) return;
        const i = indexFromRot(snapped);
        lastLitRef.current = i;
        setLit(i);
        playSound('tick'); // soft click as the drag snaps onto a skill
        setLanded(dataRef.current[i]); // same "landed" path as a random spin
      });
    },
    onPanResponderTerminationRequest: () => false,
  })).current;

  const spin = rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'], extrapolate: 'extend' });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const enterScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
  const btnPx = (WHEEL_SIZE * (2 * 44)) / VB;
  // The category currently under the pointer (updates live as the wheel turns) —
  // shown big below the wheel, Cuemath-style.
  const cur = data[lit] || data[0] || { label: '', key: '' };

  // Each skill's current on-screen mid angle (local wedge angle + how far the wheel
  // has turned to rest). Drives the upright label/icon layer.
  const screenMidOf = (skill) => ((((SEG[skill.key].a0 + SEG[skill.key].a1) / 2 + restRotDeg) % 360) + 360) % 360;

  // Curved upright labels. Memoised on [restRotDeg, lit] so the 1.5s icon ticker does
  // NOT re-render (and re-register) the <Defs> paths — repeated re-registration of the
  // same ids is what makes react-native-svg stack every label onto one arc. Unique ids
  // per rest angle keep each TextPath resolving to its own fresh path.
  const labelLayer = useMemo(() => (
    <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${VB} ${VB}`}>
      <Defs>
        {data.map((skill) => {
          if (!SEG[skill.key]) return null;
          return <Path key={skill.key} id={`lp-${skill.key}-${restRotDeg}`} d={labelArcPathAt(screenMidOf(skill), R_LABEL)} fill="none" />;
        })}
      </Defs>
      {data.map((skill, i) => (
        SEG[skill.key] ? (
          <SvgText key={skill.key} fill={i === lit ? COL.bg : COL.label}
            fontSize={10.5} fontFamily={FONT.extrabold} letterSpacing={2} textAnchor="middle">
            <TextPath href={`#lp-${skill.key}-${restRotDeg}`} startOffset="50%">{skill.label}</TextPath>
          </SvgText>
        ) : null
      ))}
    </Svg>
  ), [restRotDeg, lit, data]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COL.bg} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: COL.bg }} />}

      {/* Header */}
      <View style={s.header}>
        <View style={s.userRow}>
          {!!onBack && (
            <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.85}
              accessibilityRole="button" accessibilityLabel="Back to home" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.backTxt}>‹</Text>
            </TouchableOpacity>
          )}
          <View style={s.avatar}><Text style={{ fontSize: 24 }}>😌</Text></View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={s.userName}>{uName}</Text>
              {!!uGrade && <Text style={s.userGrade}>{uGrade}</Text>}
            </View>
            <Text style={s.userSub}>+{uXp}</Text>
          </View>
        </View>
        <View style={s.statsRow}>
          <View style={s.boltPill}><Text style={s.boltTxt}>⚡⚡⚡</Text></View>
          <TouchableOpacity style={s.circleBadge} onPress={onLeaderboard} activeOpacity={0.85}
            accessibilityRole="button" accessibilityLabel="Leaderboard">
            <Text style={{ fontSize: 14 }}>🏆</Text>
          </TouchableOpacity>
          <View style={[s.circleBadge, s.streakBadge]}><Text style={s.streakNum}>0</Text></View>
        </View>
      </View>

      {/* Streak nudge — only when the streak actually broke after a gap (dismissible) */}
      {streakLoss && (
        <View style={s.streakCard}>
          <Text style={s.streakTxt}>
            Uh-oh! You lost {streakLoss.lostPoints > 1 ? `all ${streakLoss.lostPoints}` : 'your'} streak point{streakLoss.lostPoints === 1 ? '' : 's'} for missing the last {streakLoss.missedDays} day{streakLoss.missedDays === 1 ? '' : 's'}.
          </Text>
          <TouchableOpacity style={s.streakBtn} activeOpacity={0.9} onPress={() => setStreakLoss(null)}>
            <Text style={s.streakBtnTxt}>I'm back in action!</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={s.wheelWrap}>
        <Animated.View style={{ transform: [{ scale: enterScale }], opacity: enter }}>
          <View ref={wheelRef} onLayout={measureCenter} style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
            {/* Rotating wheel — drag it to rotate manually, or tap START to spin */}
            <Animated.View
              style={{ width: WHEEL_SIZE, height: WHEEL_SIZE, transform: [{ rotate: spin }] }}>
            <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${VB} ${VB}`}>
              {/* Radar rings */}
              {RADAR_RINGS.map((r, i) => (
                <Circle key={i} cx={C} cy={C} r={r} fill="none"
                  stroke={i % 3 === 0 ? COL.radar2 : COL.radar} strokeWidth={1} />
              ))}

              {/* Skill wedges */}
              {data.map((skill, i) => {
                const seg = SEG[skill.key];
                if (!seg) return null;
                const isLit = i === lit;
                return (
                  <G key={skill.key} onPress={() => selectSkill(i)}>
                    <Path d={wedge(seg.a0, seg.a1, R_OUTER, R_INNER)}
                      fill={isLit ? COL.white : COL.seg}
                      stroke={isLit ? COL.white : COL.segStroke}
                      strokeWidth={isLit ? 1.5 : 1} />
                  </G>
                );
              })}

              {/* Thin radial dividers from the START circle out to the ring */}
              {DIVIDERS.map((a, idx) => {
                const p1 = polar(52, a), p2 = polar(R_OUTER, a);
                return <Line key={'div' + idx} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#3A3A44" strokeWidth={1} />;
              })}
            </Svg>
            </Animated.View>

            {/* Upright layer — labels + icons stay the right way up while the wheel turns
                underneath. pointerEvents none so wedge taps fall through to the wheel.
                Labels are the memoised layer; icons are separate so the ticker can flip
                them without touching the label <Defs>. */}
            <Animated.View pointerEvents="none"
              style={{ position: 'absolute', left: 0, top: 0, width: WHEEL_SIZE, height: WHEEL_SIZE, opacity: labelOpacity }}>
              {labelLayer}
              <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${VB} ${VB}`}
                style={{ position: 'absolute', left: 0, top: 0 }}>
                {data.map((skill, i) => {
                  if (!SEG[skill.key]) return null;
                  const p = polar(R_EMOJI, screenMidOf(skill));
                  return <G key={skill.key}>{skillIcon(p.x, p.y, skill.key, i === lit ? COL.white : COL.label, iconStep % 2)}</G>;
                })}
              </Svg>
            </Animated.View>

            {/* START / GO button (fixed center, does not rotate) */}
            <Animated.View style={[s.startWrap, {
              width: btnPx, height: btnPx, borderRadius: btnPx / 2,
              marginLeft: -btnPx / 2, marginTop: -btnPx / 2,
              transform: [{ scale: Animated.multiply(pulseScale, pressStart) }],
            }]}>
              <TouchableOpacity activeOpacity={0.85} onPress={onCenter} disabled={spinning}
                onPressIn={() => !spinning && pressSpring(pressStart, PRESS_SCALE).start()}
                onPressOut={() => pressSpring(pressStart, 1).start()}
                style={[s.startBtn, { borderRadius: btnPx / 2 }]}>
                <Text style={s.startTxt}>{spinning ? '✦' : 'START'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        <View style={s.confirmWrap}>
          <Text style={s.catSub} numberOfLines={1}>{cur.topic || cur.sub || topic}</Text>
        </View>
      </View>

      {/* Bottom tabs — Cuemath-style curved selector (active spins to centre) */}
      <ArcTabs active={activeTab} onTabPress={onTabPress} />

      {/* First-run coach mark */}
      {coach && (
        <View style={s.coachOverlay} pointerEvents="box-none">
          <View style={s.coachCard}>
            <Text style={s.coachTxt}>Select a challenge and{'\n'}tap START to begin.</Text>
            <View style={s.coachRow}>
              {!!onBack && (
                <TouchableOpacity onPress={() => { dismissCoach(); onBack(); }} style={s.coachBack} activeOpacity={0.85}
                  accessibilityRole="button" accessibilityLabel="Back">
                  <Text style={s.coachBackTxt}>←</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={dismissCoach} style={s.coachBtn} activeOpacity={0.9}
                accessibilityRole="button" accessibilityLabel="Got it">
                <Text style={s.coachBtnTxt}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COL.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COL.green, alignItems: 'center', justifyContent: 'center' },
  userName: { color: COL.white, fontSize: 17, fontFamily: FONT.black, letterSpacing: -0.2 },
  userGrade: { color: COL.sub, fontSize: 10, fontFamily: FONT.bold, marginLeft: 3, marginTop: 2 },
  userSub: { color: COL.green, fontSize: 12, fontFamily: FONT.bold, marginTop: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boltPill: { borderWidth: 1.5, borderColor: '#5A4A12', backgroundColor: '#231D08', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  boltTxt: { fontSize: 12, letterSpacing: 1 },
  circleBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#17171C', borderWidth: 1.5, borderColor: COL.segStroke, alignItems: 'center', justifyContent: 'center' },
  streakBadge: { backgroundColor: COL.red, borderColor: COL.red },
  streakNum: { color: COL.white, fontSize: 13, fontFamily: FONT.black },

  streakCard: { marginHorizontal: 16, marginBottom: 6, backgroundColor: COL.orange, borderRadius: 16, padding: 14, alignItems: 'center', gap: 12 },
  streakTxt: { color: '#fff', fontSize: 13, fontFamily: FONT.bold, textAlign: 'center', lineHeight: 18 },
  streakBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 20 },
  streakBtnTxt: { color: '#7A3D14', fontSize: 13, fontFamily: FONT.extrabold },

  wheelWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 16 },
  startWrap: { position: 'absolute', left: '50%', top: '50%' },
  startBtn: {
    flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FFFFFF', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },
  startTxt: { color: '#0B0B0D', fontSize: 19, fontFamily: FONT.black, letterSpacing: 0.5 },

  topic: { color: COL.white, fontSize: 17, fontFamily: FONT.bold, marginTop: 26, letterSpacing: -0.2, textAlign: 'center' },
  selected: { color: COL.green, fontSize: 17, fontFamily: FONT.black, textAlign: 'center', letterSpacing: 0.2 },

  // Back button (top-left of the header) + big Cuemath-style category name below the wheel
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: COL.segStroke, alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: COL.white, fontSize: 24, fontFamily: FONT.black, marginTop: -3 },

  // First-run coach mark
  coachOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', padding: 22, paddingBottom: 110 },
  coachCard: { alignItems: 'center', gap: 18 },
  coachTxt: { color: '#fff', fontSize: 16, fontFamily: FONT.bold, textAlign: 'center', lineHeight: 23 },
  coachRow: { flexDirection: 'row', alignItems: 'center', gap: 14, alignSelf: 'stretch', justifyContent: 'center' },
  coachBack: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  coachBackTxt: { color: '#fff', fontSize: 20, fontWeight: '900' },
  coachBtn: { backgroundColor: '#fff', borderRadius: 26, paddingVertical: 14, paddingHorizontal: 40 },
  coachBtnTxt: { color: '#0B0B0D', fontSize: 15, fontFamily: FONT.black, letterSpacing: 0.3 },
  catName: { color: COL.white, fontSize: 24, fontFamily: FONT.black, letterSpacing: 0.5, textAlign: 'center', marginTop: 22 },
  catSub: { color: COL.sub, fontSize: 13, fontFamily: FONT.bold, textAlign: 'center', marginTop: 5, letterSpacing: 0.2 },

  // Top pointer (downward triangle) marking the landed segment
  pointer: {
    position: 'absolute', top: -4, left: WHEEL_SIZE / 2 - 11, zIndex: 6,
    width: 0, height: 0,
    borderLeftWidth: 11, borderRightWidth: 11, borderTopWidth: 18,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: COL.green,
  },

  // Confirm-after-spin UI
  confirmWrap: { alignItems: 'center', marginTop: 22, gap: 14 },
  confirmRow: { flexDirection: 'row', gap: 10 },
  confirmBtn: { backgroundColor: COL.green, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 26 },
  confirmTxt: { color: '#06210F', fontSize: 14, fontFamily: FONT.black, letterSpacing: 0.3 },
  respinBtn: { borderWidth: 1.5, borderColor: COL.segStroke, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 18 },
  respinTxt: { color: COL.white, fontSize: 14, fontFamily: FONT.bold },

  tabs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 8 : 18, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
  tabActive: { borderWidth: 1.5, borderColor: COL.white },
  tabTxt: { color: COL.label, fontSize: 13, fontFamily: FONT.extrabold, letterSpacing: 1.5 },
  tabTxtActive: { color: COL.white },
});

export default WorkoutWheel;
