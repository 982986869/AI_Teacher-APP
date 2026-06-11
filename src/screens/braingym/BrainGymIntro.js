// src/screens/braingym/BrainGymIntro.js
//
// 4-slide intro carousel for the "Brain Gym" workout feature.
// Change BRAND / FIT below to rename the feature anywhere.
//
// Usage:
//   <BrainGymIntro onDone={() => {/* go to wheel */}} onBack={() => {/* back to profile */}} />

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity } from 'react-native';

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

const Art = ({ kind }) => {
  if (kind === 'tabs') {
    return (
      <View style={s.art}>
        <View style={s.ghostTabs}>
          <View style={s.gt}><Text style={s.gtTxt}>PRACTICE</Text></View>
          <View style={[s.gt, s.gtOn]}><Text style={[s.gtTxt, { color: '#fff' }]}>WORKOUT</Text></View>
          <View style={s.gt}><Text style={s.gtTxt}>ARENA</Text></View>
        </View>
        <Text style={s.hand}>👆</Text>
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
            <View key={i} style={[s.cell, { backgroundColor: bg }]}><Text style={{ color: fg, fontWeight: '800', fontSize: 13 }}>{t}</Text></View>
          ))}
        </View>
      </View>
    );
  }
  return <View style={s.art}><Text style={{ fontSize: 54 }}>🎯</Text><Text style={[s.hand, { bottom: 28 }]}>👆</Text></View>;
};

const BrainGymIntro = ({ onDone, onBack }) => {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];

  const next = () => { if (slide.last) { onDone && onDone(); } else { setIdx((i) => i + 1); } };
  const back = () => { if (idx === 0) { onBack && onBack(); } else { setIdx((i) => i - 1); } };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0E0E10" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0E0E10' }} />}

      <View style={s.arc} />

      <View style={s.body}>
        <Art kind={slide.art} />
        <Text style={s.h}>{slide.h}</Text>
        <Text style={s.p}>{slide.p}</Text>
      </View>

      {/* dots */}
      <View style={s.dots}>
        {SLIDES.map((_, i) => <View key={i} style={[s.dot, i === idx && s.dotOn]} />)}
      </View>

      <View style={s.foot}>
        <TouchableOpacity style={s.backBtn} onPress={back} activeOpacity={0.85}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.nextBtn} onPress={next} activeOpacity={0.9}>
          <Text style={s.nextTxt}>{slide.last ? 'Got it!' : 'Next'}</Text>
        </TouchableOpacity>
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
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3a3a3e' },
  dotOn: { backgroundColor: '#fff', width: 18 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 14 : 24 },
  backBtn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  nextBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 30, paddingVertical: 15, alignItems: 'center' },
  nextTxt: { color: '#0E0E10', fontSize: 15, fontWeight: '800' },
});

export default BrainGymIntro;