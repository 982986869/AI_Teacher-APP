import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import { C } from './premiumTheme';

// ── TEACHER'S HAND ON THE BOARD ───────────────────────────────────────────────
// The gestures a real teacher makes AT the board while explaining — not new UI,
// just the human motions layered over the content that's already there:
//   • CircleAround  — she loops a chalk ring around the key result once it's up
//   • Highlighter   — she swipes a highlighter across the line she's on
//   • EraserWipe    — she wipes the board before the next part
// All are decorative overlays; they never move or replace the board's content.

const AEllipse = Animated.createAnimatedComponent(Ellipse);
const { width: SCREEN_W } = Dimensions.get('window');

// Ellipse circumference (Ramanujan) — the dash length we "draw on".
const ellipsePerim = (rx, ry) => Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));

// Circle the important concept: measures its children, then hand-draws a chalk
// ellipse around them when `active` flips true (e.g. the final formula / the answer).
export function CircleAround({ active, color = C.pink, padX = 14, padY = 10, width = 2.6, children }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const draw = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (active && box.w > 0) {
      draw.setValue(0);
      Animated.timing(draw, { toValue: 1, duration: 640, delay: 140, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    } else if (!active) {
      draw.setValue(0);
    }
  }, [active, box.w, box.h, draw]);
  const w = box.w + padX * 2;
  const h = box.h + padY * 2;
  const rx = Math.max(1, w / 2 - width);
  const ry = Math.max(1, h / 2 - width);
  const perim = ellipsePerim(rx, ry);
  return (
    <View style={{ position: 'relative', alignSelf: 'center' }}
      onLayout={(e) => { const { width: lw, height: lh } = e.nativeEvent.layout; if (lw && (lw !== box.w || lh !== box.h)) setBox({ w: lw, h: lh }); }}>
      {children}
      {active && box.w > 0 && (
        <Svg width={w} height={h} pointerEvents="none" style={{ position: 'absolute', left: -padX, top: -padY }}>
          <AEllipse cx={w / 2} cy={h / 2} rx={rx} ry={ry} stroke={color} strokeWidth={width} fill="none"
            strokeLinecap="round" strokeDasharray={`${perim}, ${perim}`}
            strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [perim, 0] })} />
        </Svg>
      )}
    </View>
  );
}

// Highlighter swipe — a translucent marker that wipes left→right behind the line
// she's currently on. Replaces a flat highlight with the GESTURE of highlighting.
export function Highlighter({ color = 'rgba(224,165,46,0.22)', radius = 12 }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    w.setValue(0);
    Animated.timing(w, { toValue: 1, duration: 440, delay: 110, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [w]);
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius, backgroundColor: color,
      width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
    }} />
  );
}

// Eraser wipe — a soft band sweeps across as a new scene mounts, so moving to the
// next part reads as her clearing the board, not a hard cut. This lives inside the
// per-scene Stage (which remounts each scene), so it plays once on mount; `enabled`
// is passed false for the very first scene so the lesson doesn't open on a wipe.
export function EraserWipe({ enabled = true }) {
  const x = useRef(new Animated.Value(0)).current;
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    setOn(true);
    x.setValue(0);
    const a = Animated.timing(x, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    a.start(({ finished }) => { if (finished) setOn(false); });
    return () => a.stop();
  }, [enabled, x]);
  if (!on) return null;
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', top: 0, bottom: 0, width: 72, backgroundColor: 'rgba(255,255,255,0.92)',
      shadowColor: '#2C3043', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
      transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-90, SCREEN_W] }) }, { skewX: '-10deg' }],
    }} />
  );
}
