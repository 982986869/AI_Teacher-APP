import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { BOARD } from './theme';

// ── Whiteboard primitives ─────────────────────────────────────────────────────
// Animated "chalk" drawing on a dark board, built on react-native-svg. Strokes
// draw themselves by animating strokeDashoffset (the classic line-draw trick).
// Drawing animations use the RN Animated API with useNativeDriver:false because
// SVG props are not natively animatable. (We intentionally avoid react-native-
// reanimated here so the teacher module needs no native worklets runtime.)

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

// A single self-drawing chalk stroke for an arbitrary path `d` of known `length`.
export function ChalkStroke({
  d, length, color = BOARD.chalk, width = 3, delay = 0, duration = 600, skip = false, opacity = 1,
}) {
  const p = useRef(new Animated.Value(skip ? 1 : 0)).current;
  useEffect(() => {
    if (skip) { p.setValue(1); return undefined; }
    p.setValue(0);
    const anim = Animated.timing(p, {
      toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [skip, d, duration, delay, p]);

  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity={opacity}
      strokeDasharray={length}
      strokeDashoffset={p.interpolate({ inputRange: [0, 1], outputRange: [length, 0] })}
    />
  );
}

// Straight line / underline.
export function ChalkLine({ x1, y1, x2, y2, ...rest }) {
  return <ChalkStroke d={`M${x1},${y1} L${x2},${y2}`} length={dist({ x: x1, y: y1 }, { x: x2, y: y2 })} {...rest} />;
}
export const Underline = (props) => <ChalkLine {...props} />;

// Box outline drawn as one continuous perimeter stroke.
export function Box({ x, y, w, h, ...rest }) {
  const d = `M${x},${y} H${x + w} V${y + h} H${x} Z`;
  return <ChalkStroke d={d} length={2 * (w + h)} {...rest} />;
}

// Circle drawn as two arcs (≈ 2πr length).
export function Circle({ cx, cy, r, ...rest }) {
  const d = `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`;
  return <ChalkStroke d={d} length={2 * Math.PI * r} {...rest} />;
}

// Arrow: shaft + arrowhead (head draws right after the shaft).
export function Arrow({ x1, y1, x2, y2, color = BOARD.chalk, width = 3, delay = 0, duration = 460, skip = false }) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hl = 11;
  const spread = 0.45;
  const hx1 = x2 - hl * Math.cos(ang - spread);
  const hy1 = y2 - hl * Math.sin(ang - spread);
  const hx2 = x2 - hl * Math.cos(ang + spread);
  const hy2 = y2 - hl * Math.sin(ang + spread);
  const shaftLen = Math.hypot(x2 - x1, y2 - y1);
  const headPath = `M${hx1},${hy1} L${x2},${y2} L${hx2},${hy2}`;
  return (
    <>
      <ChalkStroke d={`M${x1},${y1} L${x2},${y2}`} length={shaftLen} color={color} width={width} delay={delay} duration={duration} skip={skip} />
      <ChalkStroke d={headPath} length={hl * 2.2} color={color} width={width} delay={delay + duration} duration={200} skip={skip} />
    </>
  );
}

// Animated highlighter swipe (grows in width behind text/shapes).
export function Highlight({ x, y, width, height, color = BOARD.yellow, delay = 0, duration = 480, skip = false }) {
  const w = useRef(new Animated.Value(skip ? width : 0)).current;
  useEffect(() => {
    if (skip) { w.setValue(width); return undefined; }
    w.setValue(0);
    const anim = Animated.timing(w, { toValue: width, duration, delay, useNativeDriver: false });
    anim.start();
    return () => anim.stop();
  }, [skip, width, duration, delay, w]);
  return <AnimatedRect x={x} y={y} width={w} height={height} rx={5} fill={color} opacity={0.26} />;
}

// Animated "writing" of text on the board — types out gradually (chalk-write
// feel). Honors pause + a one-shot skip, and reports completion.
export function WriteText({
  text = '', color = BOARD.chalk, size = 18, weight = '800', paused = false, skip = false,
  speed = 40, onDone, style,
}) {
  const [n, setN] = useState(0);
  const pausedRef = useRef(paused);
  const doneRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    doneRef.current = false;
    const fire = () => { if (!doneRef.current) { doneRef.current = true; onDone && onDone(); } };
    if (skip) { setN(text.length); fire(); return undefined; }
    let i = 0;
    setN(0);
    const id = setInterval(() => {
      if (pausedRef.current) return;
      i += 1;
      setN(i);
      if (i >= text.length) { clearInterval(id); fire(); }
    }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, text]);

  return (
    <Text style={[{ color, fontSize: size, fontWeight: weight, lineHeight: size * 1.35 }, style]}>
      {text.slice(0, n)}
      {n < text.length ? <Text style={{ color: BOARD.orange }}>▍</Text> : null}
    </Text>
  );
}

// ── The board surface ─────────────────────────────────────────────────────────
// A dark, framed chalkboard. Children are typically an <Svg> using the primitives
// above. `erasing` sweeps a wiper across to "erase" the board on scene change.
export default function WhiteboardCanvas({ children, height = 210, erasing = false, style }) {
  const wipe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!erasing) { wipe.setValue(0); return undefined; }
    const anim = Animated.timing(wipe, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [erasing, wipe]);

  return (
    <View style={[styles.board, height != null && { height }, style]}>
      {/* faint chalk-dust grid */}
      <View style={styles.grid} pointerEvents="none">
        {[0.25, 0.5, 0.75].map((f) => (
          <View key={`h${f}`} style={[styles.gridLineH, { top: `${f * 100}%` }]} />
        ))}
      </View>

      <View style={styles.content}>{children}</View>

      {/* chalk tray */}
      <View style={styles.tray}>
        {[BOARD.yellow, BOARD.blue, BOARD.green, BOARD.pink].map((c) => (
          <View key={c} style={[styles.chalkStub, { backgroundColor: c }]} />
        ))}
      </View>

      {erasing && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wiper,
            {
              opacity: wipe.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }),
              transform: [{ translateX: wipe.interpolate({ inputRange: [0, 1], outputRange: [-60, 360] }) }],
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: BOARD.bg,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: BOARD.frame,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  grid: { ...StyleSheet.absoluteFillObject },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: BOARD.grid },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tray: { position: 'absolute', bottom: 6, left: 12, flexDirection: 'row', gap: 6, opacity: 0.85 },
  chalkStub: { width: 16, height: 5, borderRadius: 3 },
  wiper: { position: 'absolute', top: 0, bottom: 0, width: 70, backgroundColor: 'rgba(244,241,232,0.18)' },
});
