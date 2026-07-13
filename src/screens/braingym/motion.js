// src/screens/braingym/motion.js
//
// Brain Gym motion tokens — a single source of truth so every screen shares the
// exact same tactile feel. Previously each screen hand-tuned its own press scale
// (0.88 … 0.96) and spring speed (40 … 45); this unifies them.
//
// Press feel: a quick, no-overshoot depress, then a slightly springy release so a
// button has real "follow-through" and weight (Apple / Duolingo-style) instead of a
// flat snap. All transform/opacity → always `useNativeDriver: true`, so 60 FPS.
import { Animated, Easing } from 'react-native';

// How far any button/tile depresses on touch. One value everywhere.
export const PRESS_SCALE = 0.94;

const PRESS_IN = { useNativeDriver: true, speed: 50, bounciness: 0 };  // snappy depress
const PRESS_OUT = { useNativeDriver: true, speed: 26, bounciness: 8 }; // springy release

// Spring a scale value for a press. v < 1 → pressing in; v === 1 → releasing.
// Interruptible by design (a fresh spring continues from the current value), so
// rapid taps stay responsive.
export const pressSpring = (val, v) =>
  Animated.spring(val, { toValue: v, ...(v < 1 ? PRESS_IN : PRESS_OUT) });

// Shared easing curves for entrances / transitions.
export const EASE = {
  out: Easing.out(Easing.cubic),     // entrances settle in
  inOut: Easing.inOut(Easing.quad),  // breathing / ambient loops
  in: Easing.in(Easing.cubic),       // exits accelerate away
};

// Shared springs for entrances + celebrations (physics form, not speed/bounciness,
// so damping/stiffness read consistently across screens).
export const SPRING = {
  pop: { useNativeDriver: true, damping: 12, stiffness: 220, mass: 0.7 },    // entrance / reward pop
  settle: { useNativeDriver: true, damping: 15, stiffness: 170, mass: 0.9 }, // gentle land
};

// Shared entrance durations (ms) by intent — keeps tempo consistent between screens.
export const DUR = { press: 120, fast: 220, base: 340, slow: 520, breathe: 1800 };
