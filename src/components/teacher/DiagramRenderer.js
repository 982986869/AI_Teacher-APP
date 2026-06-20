import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import WhiteboardCanvas, { ChalkStroke, ChalkLine, Box, Circle, Arrow } from './WhiteboardCanvas';
import { BOARD } from './theme';

// ── Animated diagram renderer ─────────────────────────────────────────────────
// Draws a labelled shape with sequential strokes (slow, teacher-paced), then
// reports completion. Supported: triangle, rectangle, graph, coordinate, tree,
// process flow.
//
// `bare`  → just the SVG + caption (no board frame), for embedding.
// `light` → ink-on-paper palette (for the cream "live class" board).

const VIEW_W = 300;
const VIEW_H = 180;

const DURATION = {
  triangle: 3600, rectangle: 1700, graph: 3500, coordinate: 3100, tree: 2900, flow: 2800,
};

// Palette: ink-on-cream when `light`, else the dark board colors.
const palette = (light) => (light
  ? { white: '#5A4A38', yellow: '#E07B39', blue: '#3B82F6', green: '#1C9D5B', pink: '#E0517A', orange: '#E07B39', textBright: '#2A2A2C', textDim: '#9A8A66' }
  : { white: BOARD.white, yellow: BOARD.yellow, blue: BOARD.blue, green: BOARD.green, pink: BOARD.pink, orange: BOARD.orange, textBright: BOARD.textBright, textDim: BOARD.textDim });

export default function DiagramRenderer({ shape = 'triangle', caption, data = {}, skip = false, paused = false, bare = false, light = false, onComplete }) {
  const doneRef = useRef(false);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    if (doneRef.current) return undefined;
    const fire = () => { if (!doneRef.current) { doneRef.current = true; onComplete && onComplete(); } };
    if (skip) { fire(); return undefined; }
    // Tick instead of a single timeout so the "drawing finished" signal never
    // fires while the lesson is paused (otherwise auto-advance races ahead).
    const total = DURATION[shape] || 2600;
    let waited = 0;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      waited += 100;
      if (waited >= total) { clearInterval(id); fire(); }
    }, 100);
    return () => clearInterval(id);
  }, [skip, shape, onComplete]);

  const pal = palette(light);
  const svg = (
    <Svg width="100%" height={bare ? 190 : '100%'} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      {renderShape(shape, data, skip, pal)}
    </Svg>
  );

  if (bare) {
    return (
      <View style={styles.bareWrap}>
        {svg}
        {!!caption && <Text style={[styles.captionBare, { color: pal.textDim }]}>{caption}</Text>}
      </View>
    );
  }

  return (
    <WhiteboardCanvas height={220}>
      {svg}
      {!!caption && <Text style={styles.caption}>{caption}</Text>}
    </WhiteboardCanvas>
  );
}

function label(x, y, text, color, size = 14) {
  return (
    <SvgText key={`l-${x}-${y}-${text}`} x={x} y={y} fill={color} fontSize={size} fontWeight="bold" textAnchor="middle">
      {text}
    </SvgText>
  );
}

function renderShape(shape, data, skip, P) {
  switch (shape) {
    case 'rectangle': {
      const x = 80, y = 50, w = 150, h = 84;
      return (
        <>
          <Box x={x} y={y} w={w} h={h} color={P.blue} delay={0} duration={1400} skip={skip} />
          {label(x + w / 2, y - 12, data.topLabel || 'length', P.yellow)}
          {label(x - 18, y + h / 2 + 4, data.sideLabel || 'w', P.green)}
        </>
      );
    }
    case 'coordinate': {
      const ox = 44, oy = 140, ex = 270, ey = 28;
      return (
        <>
          <Arrow x1={ox} y1={oy} x2={ex} y2={oy} color={P.white} delay={0} duration={900} skip={skip} />
          <Arrow x1={ox} y1={oy} x2={ox} y2={ey} color={P.white} delay={920} duration={900} skip={skip} />
          {label(ex - 2, oy + 18, 'x', P.textDim)}
          {label(ox - 14, ey + 2, 'y', P.textDim)}
          <ChalkLine x1={ox} y1={oy} x2={250} y2={50} color={P.orange} width={3} delay={1850} duration={900} skip={skip} />
          <Circle cx={250} cy={50} r={5} color={P.pink} delay={2750} duration={200} skip={skip} />
        </>
      );
    }
    case 'graph': {
      const base = 140, left = 56, bw = 30, gap = 26;
      const vals = (data.values && data.values.length ? data.values : [40, 70, 55, 95]);
      const max = Math.max(...vals, 1);
      return (
        <>
          <Arrow x1={left - 10} y1={base} x2={272} y2={base} color={P.white} delay={0} duration={800} skip={skip} />
          <Arrow x1={left - 10} y1={base} x2={left - 10} y2={28} color={P.white} delay={820} duration={800} skip={skip} />
          {vals.map((v, i) => {
            const h = (v / max) * 96;
            const x = left + i * (bw + gap);
            const colors = [P.yellow, P.blue, P.green, P.pink];
            return (
              <Box key={i} x={x} y={base - h} w={bw} h={h} color={colors[i % colors.length]} delay={1650 + i * 400} duration={500} skip={skip} />
            );
          })}
        </>
      );
    }
    case 'tree': {
      const root = { x: 150, y: 44 };
      const l = { x: 80, y: 132 };
      const r = { x: 220, y: 132 };
      return (
        <>
          <Box x={root.x - 36} y={root.y - 18} w={72} h={34} color={P.orange} delay={0} duration={800} skip={skip} />
          {label(root.x, root.y + 4, data.root || 'Topic', P.textBright, 12)}
          <ChalkLine x1={root.x} y1={root.y + 16} x2={l.x} y2={l.y - 16} color={P.white} delay={850} duration={520} skip={skip} />
          <ChalkLine x1={root.x} y1={root.y + 16} x2={r.x} y2={r.y - 16} color={P.white} delay={1150} duration={520} skip={skip} />
          <Box x={l.x - 34} y={l.y - 16} w={68} h={32} color={P.blue} delay={1750} duration={620} skip={skip} />
          {label(l.x, l.y + 3, data.left || 'Part A', P.textBright, 11)}
          <Box x={r.x - 34} y={r.y - 16} w={68} h={32} color={P.green} delay={2100} duration={620} skip={skip} />
          {label(r.x, r.y + 3, data.right || 'Part B', P.textBright, 11)}
        </>
      );
    }
    case 'flow': {
      const steps = (data.steps && data.steps.length ? data.steps : ['Start', 'Process', 'End']).slice(0, 3);
      const y = 74, bw = 70, bh = 38, gap = 30;
      const xs = steps.map((_, i) => 26 + i * (bw + gap));
      const colors = [P.yellow, P.blue, P.green];
      return (
        <>
          {steps.map((stp, i) => (
            <React.Fragment key={i}>
              <Box x={xs[i]} y={y} w={bw} h={bh} color={colors[i % colors.length]} delay={i * 900} duration={600} skip={skip} />
              {label(xs[i] + bw / 2, y + bh / 2 + 4, stp, P.textBright, 10)}
              {i < steps.length - 1 && (
                <Arrow x1={xs[i] + bw} y1={y + bh / 2} x2={xs[i + 1]} y2={y + bh / 2} color={P.white} delay={i * 900 + 600} duration={320} skip={skip} />
              )}
            </React.Fragment>
          ))}
        </>
      );
    }
    case 'triangle':
    default: {
      // right triangle: base → vertical → hypotenuse, with labels
      const A = { x: 64, y: 142 };  // right angle
      const B = { x: 244, y: 142 };
      const C = { x: 64, y: 34 };
      return (
        <>
          <ChalkLine x1={A.x} y1={A.y} x2={B.x} y2={B.y} color={P.yellow} width={3.5} delay={0} duration={1000} skip={skip} />
          <ChalkLine x1={A.x} y1={A.y} x2={C.x} y2={C.y} color={P.green} width={3.5} delay={1080} duration={1000} skip={skip} />
          <ChalkLine x1={B.x} y1={B.y} x2={C.x} y2={C.y} color={P.pink} width={3.5} delay={2160} duration={1000} skip={skip} />
          <ChalkStroke d={`M${A.x + 16},${A.y} V${A.y - 16} H${A.x}`} length={32} color={P.white} width={2} delay={3240} duration={220} skip={skip} />
          {label((A.x + B.x) / 2, A.y + 22, data.b || 'base', P.yellow, 12)}
          {label(A.x - 22, (A.y + C.y) / 2 + 4, data.a || 'height', P.green, 12)}
          {label((B.x + C.x) / 2 + 26, (B.y + C.y) / 2 - 2, data.c || 'hypotenuse', P.pink, 11)}
        </>
      );
    }
  }
}

const styles = StyleSheet.create({
  caption: { position: 'absolute', bottom: 10, alignSelf: 'center', color: BOARD.textDim, fontSize: 14, fontWeight: '800' },
  bareWrap: { width: '100%', alignItems: 'center' },
  captionBare: { fontSize: 13, fontWeight: '800', marginTop: 6 },
});
