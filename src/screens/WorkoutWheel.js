// src/screens/WorkoutWheel.js
// AILERNOVA — dark "radar" Brain Gym workout wheel (react-native-svg).
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform,
  TouchableOpacity, Animated, Dimensions, Easing, PanResponder,
} from 'react-native';
import Svg, { Path, Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { FONT } from '../constants/fonts';
import { initSounds, playLoop, playSound, stopSound } from '../utils/sound';
import ArcTabs from './braingym/ArcTabs';

const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_W - 40, 330);

const VB = 300;
const C = VB / 2;
const R_OUTER = 140;
const R_INNER = 92;
const R_LABEL = 116;  // labels — centered in the band ring
const R_EMOJI = 76;   // small skill icon — inner, in the dark gap

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
  application:   { a0: -40, a1: 40 },   // top
  understanding: { a0: 50,  a1: 130 },  // right
  fluency:       { a0: 140, a1: 220 },  // bottom
  reasoning:     { a0: 230, a1: 310 },  // left
};
const ORDER = ['application', 'understanding', 'fluency', 'reasoning'];
const EMOJI = { reasoning: '🧠', application: '⚙️', understanding: '💡', fluency: '⚡' };

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
  const [showStreak, setShowStreak] = useState(true);
  const [coach, setCoach] = useState(!coachSeen);
  const dismissCoach = () => { coachSeen = true; setCoach(false); };

  const pulse = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current; // cumulative degrees
  const rotRef = useRef(0);
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

  // Load the wheel sounds once; stop any looping tick if we leave mid-spin.
  useEffect(() => {
    initSounds();
    return () => { stopSound('tick'); };
  }, []);

  // Physically spin the wheel: rotate so the randomly chosen segment decelerates
  // to a stop under the top pointer. Does NOT auto-start — the user confirms after.
  const spinTo = () => {
    if (spinning || snappingRef.current) return;
    setLanded(null);
    setSpinning(true);
    const target = Math.floor(Math.random() * data.length);
    // Segment centers sit at index*90° (reasoning 0, application 90, …). Rotate so
    // that center reaches the top (0°), plus a few full turns for momentum.
    const desiredMod = (360 - (target * 90)) % 360;
    const currentMod = ((rotRef.current % 360) + 360) % 360;
    let delta = desiredMod - currentMod;
    if (delta < 0) delta += 360;
    const next = rotRef.current + 360 * 4 + delta;
    rotRef.current = next;
    playLoop('tick'); // ratchet sound while it spins (no-op if assets are placeholders)
    Animated.timing(rotation, {
      toValue: next, duration: 2600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start(({ finished }) => {
      stopSound('tick');
      if (!finished || !mountedRef.current) return;
      playSound('success'); // landed on a skill
      setSpinning(false);
      setLit(target);
      lastLitRef.current = target;
      setLanded(data[target]);
    });
  };

  // Center button: spins when idle, confirms (starts) once a skill has landed.
  const onCenter = () => {
    if (spinning || snappingRef.current) return;
    if (landed) { onStart && onStart(landed); return; }
    if (!spinOnStart) { onStart && onStart(data[lit]); return; }
    spinTo();
  };

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
  const btnPx = (WHEEL_SIZE * (2 * 58)) / VB;
  // The category currently under the pointer (updates live as the wheel turns) —
  // shown big below the wheel, Cuemath-style.
  const cur = data[lit] || data[0] || { label: '', key: '' };

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
          <View style={s.avatar}><Text style={{ fontSize: 22 }}>🙂</Text></View>
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

      {/* Streak nudge (dismissible) */}
      {showStreak && (
        <View style={s.streakCard}>
          <Text style={s.streakTxt}>Uh-oh! You lost all 1 streak point for missing the last 3 days.</Text>
          <TouchableOpacity style={s.streakBtn} activeOpacity={0.9} onPress={() => setShowStreak(false)}>
            <Text style={s.streakBtnTxt}>I'm back in action!</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={s.wheelWrap}>
        <Animated.View style={{ transform: [{ scale: enterScale }], opacity: enter }}>
          <View ref={wheelRef} onLayout={measureCenter} style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
            {/* Top pointer marking the selected segment */}
            <View style={s.pointer} pointerEvents="none" />

            {/* Rotating wheel — drag it to rotate manually, or tap START to spin */}
            <Animated.View
              {...pan.panHandlers}
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
                  <G key={skill.key} onPress={() => onSelectSkill && onSelectSkill(skill)}>
                    <Path d={wedge(seg.a0, seg.a1, R_OUTER, R_INNER)}
                      fill={isLit ? COL.segLit : COL.seg}
                      stroke={isLit ? COL.white : COL.segStroke}
                      strokeWidth={isLit ? 3 : 1} />
                  </G>
                );
              })}

              {/* Skill icons (inner): green brand block on the active skill, ✕ on the rest */}
              {data.map((skill, i) => {
                const seg = SEG[skill.key];
                if (!seg) return null;
                const mid = (seg.a0 + seg.a1) / 2;
                const p = polar(R_EMOJI, mid);
                if (i === lit) {
                  return (
                    <Rect key={'ic-' + skill.key} x={p.x - 9} y={p.y - 9} width={18} height={18}
                      rx={4} fill={COL.green} stroke="#0B3D24" strokeWidth={1} />
                  );
                }
                return (
                  <SvgText key={'ic-' + skill.key} x={p.x} y={p.y + 6} fontSize={18} fontWeight="800"
                    fill={COL.label} textAnchor="middle">✕</SvgText>
                );
              })}

              {/* Labels — straight, centered in each wedge, kept upright.
                  Top/bottom read horizontally; sides read vertically along the ring. */}
              {data.map((skill, i) => {
                const seg = SEG[skill.key];
                if (!seg) return null;
                const mid = (seg.a0 + seg.a1) / 2;
                let rot = ((mid % 360) + 360) % 360;
                if (rot > 90 && rot < 270) rot -= 180; // never upside-down
                const p = polar(R_LABEL, mid);
                const isLit = i === lit;
                return (
                  <SvgText key={'lbl-' + skill.key}
                    x={p.x} y={p.y}
                    fill={isLit ? COL.labelLit : COL.label}
                    fontSize={11} fontFamily={FONT.extrabold} letterSpacing={2}
                    textAnchor="middle" alignmentBaseline="middle"
                    transform={`rotate(${rot} ${p.x} ${p.y})`}>
                    {skill.label}
                  </SvgText>
                );
              })}
            </Svg>
            </Animated.View>

            {/* START / GO button (fixed center, does not rotate) */}
            <Animated.View style={[s.startWrap, {
              width: btnPx, height: btnPx, borderRadius: btnPx / 2,
              marginLeft: -btnPx / 2, marginTop: -btnPx / 2,
              transform: [{ scale: pulseScale }],
            }]}>
              <TouchableOpacity activeOpacity={0.85} onPress={onCenter} disabled={spinning}
                style={[s.startBtn, { borderRadius: btnPx / 2 }]}>
                <Text style={s.startTxt}>{spinning ? '✦' : landed ? 'GO' : 'START'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        <View style={s.confirmWrap}>
          <Text style={s.catName} numberOfLines={1}>{EMOJI[cur.key] ? `${EMOJI[cur.key]}  ` : ''}{cur.label}</Text>
          <Text style={s.catSub} numberOfLines={1}>{cur.sub || topic}</Text>
          {!!landed && (
            <View style={s.confirmRow}>
              <TouchableOpacity style={s.confirmBtn} activeOpacity={0.9} onPress={() => onStart && onStart(landed)}>
                <Text style={s.confirmTxt}>Start ▶</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.respinBtn} activeOpacity={0.9} onPress={spinTo}>
                <Text style={s.respinTxt}>↻ Spin again</Text>
              </TouchableOpacity>
            </View>
          )}
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
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8E7BF5', alignItems: 'center', justifyContent: 'center' },
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
