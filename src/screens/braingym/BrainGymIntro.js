// src/screens/braingym/BrainGymIntro.js
//
// 4-slide intro carousel for the "Brain Gym" workout feature.
// Change BRAND / FIT below to rename the feature anywhere.
//
// Usage:
//   <BrainGymIntro onDone={() => {/* go to wheel */}} onBack={() => {/* back to profile */}} />

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, Pressable, Animated, Easing } from 'react-native';
import { pressSpring, PRESS_SCALE } from './motion';

const BRAND = 'Brain Gym';   // ← rename the feature here
const FIT   = 'BrainFit';    // ← the "fitness" word

const SLIDES = [
  {
    h: `Welcome to the ${BRAND}!`,
    p: `Get ${FIT} with daily workouts, social challenges, and targeted practice.`,
    art: 'tabs',
  },
  {
    h: 'Master the Fundamentals',
    p: 'New content covers your full syllabus — perfect for mastering the basics!',
    art: 'mascot',
  },
  {
    h: 'Your Daily Workout',
    p: `Complete 4 personalized challenges for 360° ${FIT}!`,
    art: 'grid',
  },
  {
    h: 'Select a challenge\nand tap START.',
    p: 'Each slice is a skill. Tap one, then START to begin that challenge.',
    art: 'target',
    last: true,
  },
];

// A finger that keeps tapping — scales down + nudges as if pressing.
const TapHand = ({ style }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 320, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.delay(900),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] });
  const ty = v.interpolate({ inputRange: [0, 1], outputRange: [0, 5] });
  return <Animated.Text style={[s.hand, style, { transform: [{ scale }, { translateY: ty }] }]}>👆</Animated.Text>;
};

// A small button that springs down on press.
const Press = ({ style, wrapStyle, onPress, children }) => {
  const sc = useRef(new Animated.Value(1)).current;
  const to = (v) => pressSpring(sc, v).start();
  return (
    <Pressable style={wrapStyle} onPress={onPress} onPressIn={() => to(PRESS_SCALE)} onPressOut={() => to(1)}>
      <Animated.View style={[style, { transform: [{ scale: sc }] }]}>{children}</Animated.View>
    </Pressable>
  );
};

const Art = ({ kind, cellAnim }) => {
  if (kind === 'tabs') {
    return (
      <View style={s.art}>
        <View style={s.ghostTabs}>
          <View style={s.gt}><Text style={s.gtTxt}>PRACTICE</Text></View>
          <View style={[s.gt, s.gtOn]}><Text style={[s.gtTxt, { color: '#fff' }]}>WORKOUT</Text></View>
          <View style={s.gt}><Text style={s.gtTxt}>ARENA</Text></View>
        </View>
        <TapHand />
      </View>
    );
  }
  if (kind === 'mascot') {
    return <View style={s.art}><Text style={{ fontSize: 78 }}>🧑‍🎓</Text></View>;
  }
  if (kind === 'grid') {
    const cells = [
      ['✓', '#34D399', '#0E0E10'], ['▦', '#222', '#cfcfd6'], ['✓', '#34D399', '#0E0E10'],
      ['✓', '#34D399', '#0E0E10'], ['●', '#2A2A2E', '#fff'], ['＋', '#4da6ff', '#0E0E10'],
      ['x', '#222', '#cfcfd6'], ['a', '#222', '#cfcfd6'], ['⏱', '#222', '#cfcfd6'],
    ];
    return (
      <View style={s.art}>
        <View style={s.grid}>
          {cells.map(([t, bg, fg], i) => (
            <Animated.View key={i} style={[s.cell, { backgroundColor: bg, opacity: cellAnim, transform: [{ scale: cellAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }] }]}>
              <Text style={{ color: fg, fontWeight: '800', fontSize: 13 }}>{t}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    );
  }
  return <View style={s.art}><Text style={{ fontSize: 54 }}>🎯</Text><TapHand style={{ bottom: 28 }} /></View>;
};

const BrainGymIntro = ({ onDone, onBack }) => {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const dir = useRef(1);
  const anim = useRef(new Animated.Value(0)).current;   // per-slide content entrance
  const float = useRef(new Animated.Value(0)).current;  // art idle float
  const cell = useRef(new Animated.Value(0)).current;   // grid cells pop
  const dots = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  useEffect(() => {
    anim.setValue(0); cell.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 150, mass: 0.85 }).start();
    Animated.stagger(60, dots.map((d, i) => Animated.spring(d, { toValue: i === idx ? 1 : 0, useNativeDriver: false, damping: 16, stiffness: 200 }))).start();
    if (slide.art === 'grid') {
      Animated.timing(cell, { toValue: 1, duration: 500, delay: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    } else {
      cell.setValue(1);
    }
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [float]);

  const next = () => { if (slide.last) { onDone && onDone(); } else { dir.current = 1; setIdx((i) => i + 1); } };
  const back = () => { if (idx === 0) { onBack && onBack(); } else { dir.current = -1; setIdx((i) => i - 1); } };

  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [dir.current * 46, 0] });
  const op = anim.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 1, 1] });
  const artScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0E0E10" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0E0E10' }} />}

      <View style={s.arc} />

      <Animated.View style={[s.body, { opacity: op, transform: [{ translateX: tx }] }]}>
        <Animated.View style={{ transform: [{ scale: artScale }, { translateY: floatY }] }}>
          <Art kind={slide.art} cellAnim={cell} />
        </Animated.View>
        <Text style={s.h}>{slide.h}</Text>
        <Text style={s.p}>{slide.p}</Text>
      </Animated.View>

      {/* dots — the active one stretches into a pill */}
      <View style={s.dots}>
        {dots.map((d, i) => (
          <Animated.View
            key={i}
            style={{
              height: 7, borderRadius: 4,
              width: d.interpolate({ inputRange: [0, 1], outputRange: [7, 18] }),
              backgroundColor: d.interpolate({ inputRange: [0, 1], outputRange: ['#3a3a3e', '#ffffff'] }),
            }}
          />
        ))}
      </View>

      <View style={s.foot}>
        <Press style={s.backBtn} onPress={back}><Text style={s.backTxt}>←</Text></Press>
        <Press style={s.nextBtn} wrapStyle={{ flex: 1 }} onPress={next}><Text style={s.nextTxt}>{slide.last ? 'Got it!' : 'Next'}</Text></Press>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E10' },
  arc: { position: 'absolute', top: 120, left: -40, right: -40, height: 170, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 300 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 },
  art: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#141417', alignItems: 'center', justifyContent: 'center', marginBottom: 18, overflow: 'hidden' },
  ghostTabs: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  gt: { paddingVertical: 7, paddingHorizontal: 11, borderRadius: 8, backgroundColor: '#222' },
  gtOn: { backgroundColor: '#2d2d2d', borderWidth: 1.5, borderColor: '#fff' },
  gtTxt: { color: '#777', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  hand: { fontSize: 30, position: 'absolute', bottom: 24 },
  grid: { width: 98, flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  cell: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  h: { color: '#fff', fontSize: 21, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  p: { color: '#c7c7cc', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 260, marginTop: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginBottom: 4 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 14 : 24 },
  backBtn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  nextBtn: { backgroundColor: '#fff', borderRadius: 30, paddingVertical: 15, alignItems: 'center' },
  nextTxt: { color: '#0E0E10', fontSize: 15, fontWeight: '800' },
});

export default BrainGymIntro;
