import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { G, Path, Line, Circle } from 'react-native-svg';
import { ChalkStroke } from './WhiteboardCanvas';
import { C } from './premiumTheme';
import { useBoardSize } from './boardSize';
import { SvgLines, useReveal, LaserPointer } from './subjectBoards';
import { layoutShapes } from './shapeLayout';

// ── MODEL-DRAWN BOARD ─────────────────────────────────────────────────────────
// Draws the lesson model's own diagram (visualData.shapes), laid out by
// shapeLayout.js so labels never touch a stroke and the drawing fills the card.
// It chalks itself on one voice-synced step at a time; the step she is speaking is
// at full strength and earlier ones recede, so the eye always lands on "now".
const PALETTE = { orange: C.orange, blue: C.blue, green: C.green, pink: C.pink, violet: '#7C3AED', ink: '#2C3043' };
const PAST = 0.55;
const strokeMs = (len) => Math.max(280, Math.min(900, len * 3));
const AG = Animated.createAnimatedComponent(G);

// A dashed line can't use the chalk draw-on (it animates the dash pattern itself), so it
// fades in at the moment its stroke would have been drawn instead of popping.
function DashedStroke({ d, color, width, delay, skip }) {
  const a = useRef(new Animated.Value(skip ? 1 : 0)).current;
  useEffect(() => {
    if (skip) { a.setValue(1); return undefined; }
    const anim = Animated.timing(a, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    anim.start();
    return () => anim.stop();
  }, [a, delay, skip]);
  return <AG opacity={a}><Path d={d} stroke={color} strokeWidth={width} strokeDasharray="6 5" fill="none" /></AG>;
}

export default function ShapesBoard({ scene, paused, skip, resetKey, step, fallback = null }) {
  const { h } = useBoardSize();
  const shapes = scene && scene.diagram && scene.diagram.shapes;
  const L = useMemo(() => {
    try { return layoutShapes(shapes); } catch (e) { return null; }
  }, [shapes]);
  const n = useReveal(L ? L.steps : 0, 950, { paused, skip, resetKey, step });
  if (!L) return fallback;
  const vb = L.viewBox;
  // strokes and the pointer keep their on-screen weight however wide the fitted view is
  const k = vb.w / 300;
  // step 0 = nothing drawn yet, exactly like every other board
  const shown = n;
  const op = (s) => (skip || s === shown ? 1 : PAST);
  const now = L.items.find((it) => it.step === shown);
  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <Svg width="100%" height={h(188)} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}>
        {L.items.map((it) => {
          if (it.step > shown) return null;
          const col = PALETTE[it.color] || PALETTE.ink;
          let delay = 0;
          return (
            <G key={it.id} opacity={op(it.step)}>
              {!!it.fillD && <Path d={it.fillD} fill={col} opacity={0.14} />}
              {it.dot && <Circle cx={it.dot.cx} cy={it.dot.cy} r={it.dot.r} fill={col} />}
              {it.strokes.map((s, j) => {
                const dur = strokeMs(s.length);
                const el = it.dashed
                  ? <DashedStroke key={j} d={s.d} color={col} width={2.2 * k} delay={delay} skip={skip} />
                  : <ChalkStroke key={j} d={s.d} length={s.length} color={col} width={2.6 * k} delay={delay} duration={dur} skip={skip} />;
                delay += dur;
                return el;
              })}
            </G>
          );
        })}
        {L.labels.map((lb, i) => (lb.step <= shown ? (
          <G key={`l${i}`} opacity={op(lb.step)}>
            {lb.leader && <Line x1={lb.leader.x1} y1={lb.leader.y1} x2={lb.leader.x2} y2={lb.leader.y2} stroke={PALETTE[lb.color] || PALETTE.ink} strokeWidth={k} opacity={0.6} />}
            <SvgLines label={lb} color={PALETTE[lb.color] || PALETTE.ink} />
          </G>
        ) : null))}
        {!skip && now && <LaserPointer x={now.pointer.x} y={now.pointer.y} size={k} />}
      </Svg>
    </View>
  );
}
