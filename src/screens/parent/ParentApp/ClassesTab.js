// src/screens/parent/ParentApp/ClassesTab.js — classes hub, locked until enrolment. The
// empty state plays a looping little "video": a hand taps around a calendar, marking
// class days one by one, then a check confirms — then it clears and replays. Copy + CTA
// below, and a dark scheduled-time banner once a demo is booked.
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Pointer, Check } from 'lucide-react-native';
import { C, st, T } from './constants';
import Header from './Header';
import { FadeIn } from './anim';
import { fmtDateShort, fmtTime } from './demoConfig';

// (animated calendar — hand taps class days, then a check confirms; loops)
const COLS = 5, ROWS = 4, CELL = 34;
const GW = COLS * CELL, GH = ROWS * CELL;
const MARKS = [{ r: 0, c: 1 }, { r: 1, c: 3 }, { r: 1, c: 0 }, { r: 2, c: 2 }, { r: 3, c: 1 }, { r: 3, c: 3 }];
const CLASS_BG = '#0C8A5E';   // premium emerald (replaces the flat Cuemath green)
// classes tab: locked "Explore Tutoring" until enrolment; scheduled banner once booked
const INK = '#12281B';
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const FINGER_X = 7, FINGER_Y = 3; // where the pointer's tip sits within its icon box

function ClassCalendar() {
  const handX = useRef(new Animated.Value(GW * 0.55)).current;
  const handY = useRef(new Animated.Value(GH + 12)).current;
  const handS = useRef(new Animated.Value(1)).current;
  const check = useRef(new Animated.Value(0)).current;
  const marks = useRef(MARKS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let alive = true;
    const cx = (c) => c * CELL + CELL / 2;
    const cy = (r) => r * CELL + CELL / 2;
    const tapMark = (i) => Animated.sequence([
      Animated.parallel([
        Animated.timing(handX, { toValue: cx(MARKS[i].c) - FINGER_X, duration: 320, easing: EASE, useNativeDriver: true }),
        Animated.timing(handY, { toValue: cy(MARKS[i].r) - FINGER_Y, duration: 320, easing: EASE, useNativeDriver: true }),
      ]),
      Animated.timing(handS, { toValue: 0.8, duration: 110, easing: EASE, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(marks[i], { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 240, mass: 0.6 }),
        Animated.timing(handS, { toValue: 1, duration: 150, easing: EASE, useNativeDriver: true }),
      ]),
      Animated.delay(140),
    ]);
    const run = () => {
      if (!alive) return;
      marks.forEach((m) => m.setValue(0));
      check.setValue(0);
      handX.setValue(GW * 0.55); handY.setValue(GH + 12); handS.setValue(1);
      Animated.sequence([
        Animated.delay(450),
        ...MARKS.map((_, i) => tapMark(i)),
        Animated.delay(220),
        Animated.spring(check, { toValue: 1, useNativeDriver: true, damping: 9, stiffness: 220 }),
        Animated.delay(1500),
      ]).start(({ finished }) => { if (finished) run(); });
    };
    run();
    return () => { alive = false; [handX, handY, handS, check, ...marks].forEach((v) => v.stopAnimation()); };
  }, [handX, handY, handS, check, marks]);

  const checkScale = check.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return (
    <View style={cal.wrap}>
      <View style={cal.spiral}>{Array.from({ length: 7 }).map((_, i) => <View key={i} style={cal.ring} />)}</View>
      <View style={cal.grid}>
        {Array.from({ length: ROWS }).map((_, r) => (
          <View key={r} style={cal.row}>
            {Array.from({ length: COLS }).map((_, c) => {
              const mi = MARKS.findIndex((m) => m.r === r && m.c === c);
              return (
                <View key={c} style={cal.cell}>
                  {mi >= 0 && <Animated.View style={[cal.mark, { opacity: marks[mi], transform: [{ scale: marks[mi] }] }]} />}
                </View>
              );
            })}
          </View>
        ))}
        <Animated.View pointerEvents="none" style={[cal.hand, { transform: [{ translateX: handX }, { translateY: handY }, { scale: handS }] }]}>
          <Pointer size={30} color={INK} fill="#FFFFFF" strokeWidth={2} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[cal.check, { opacity: check, transform: [{ scale: checkScale }] }]}>
          <Check size={19} color={C.green} strokeWidth={3.6} />
        </Animated.View>
      </View>
    </View>
  );
}

export default function ClassesTab({ meta, childName, onAvatar, onGym, onBookTrial, booking }) {
  const valid = booking && Number.isFinite(new Date(booking.date).getTime());
  const short = valid ? fmtDateShort(booking.date) : null;
  return (
    <View style={st.screen}>
      <Header meta={meta} childName={childName} onAvatar={onAvatar} onGym={onGym} />
      <View style={cs.green}>
        <FadeIn style={cs.center} y={10}>
          <ClassCalendar />
          <T w="bold" s={16.5} c="#FFFFFF" style={cs.text}>Manage {childName}'s classes,{'\n'}once you book your first class.</T>
          {/* disabled until enrolment — matches the locked Cuemath-style state */}
          <View style={cs.exploreBtn} accessible accessibilityLabel="Explore Tutoring, available after you enrol" accessibilityState={{ disabled: true }}>
            <T w="bold" s={15} c="rgba(255,255,255,0.62)">Explore Tutoring</T>
          </View>
        </FadeIn>

        {valid && short && (
          <FadeIn y={0} style={cs.banner}>
            <T w="semi" s={13} c="rgba(255,255,255,0.8)">Your first session is scheduled for</T>
            <T w="xbold" s={15} c="#fff" style={{ marginTop: 3, letterSpacing: 0.3 }}>
              {short.dow.toUpperCase()} · {short.day} {short.month} · {fmtTime(booking.date)}
            </T>
          </FadeIn>
        )}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  wrap: { alignItems: 'center' },
  spiral: { flexDirection: 'row', justifyContent: 'space-evenly', width: GW, marginBottom: -7, zIndex: 3 },
  ring: { width: 3.5, height: 15, borderRadius: 2, backgroundColor: INK },
  grid: { width: GW, height: GH, borderWidth: 2.5, borderColor: INK, backgroundColor: '#BCE9CE', borderRadius: 5, position: 'relative' },
  row: { flexDirection: 'row', flex: 1 },
  cell: { flex: 1, borderWidth: 1, borderColor: 'rgba(18,40,27,0.45)', alignItems: 'center', justifyContent: 'center' },
  mark: { width: 13, height: 13, borderRadius: 2, backgroundColor: INK },
  hand: { position: 'absolute', left: 0, top: 0 },
  check: { position: 'absolute', right: -13, bottom: -13, width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#08301A', shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
});

const cs = StyleSheet.create({
  green: { flex: 1, backgroundColor: CLASS_BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, gap: 30 },
  text: { textAlign: 'center', lineHeight: 24 },
  // Disabled "Explore Tutoring" — faded ghost pill, non-interactive until enrolment.
  exploreBtn: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.38)', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 13, paddingHorizontal: 34, paddingVertical: 15, alignItems: 'center' },
  banner: { backgroundColor: '#075B3F', paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
});
