import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { G, Line, Rect, Circle, Ellipse, Path, Polygon, Text as SvgText } from 'react-native-svg';
import { ChalkLine, ChalkStroke, Arrow } from './WhiteboardCanvas';
import { C } from './premiumTheme';
// Every board's pixel height runs through h() so the immersive full-bleed stage can
// draw the same illustration larger without blurring it. h(x) === x in card mode.
import { useBoardSize } from './boardSize';

// ── SUBJECT ILLUSTRATION ENGINE ───────────────────────────────────────────────
// Reusable, self-drawing board illustrations so a lesson NEVER falls back to
// plain bullet points when a picture would teach it better. Every board:
//   • is DIRECTOR-CONTROLLED — it shows exactly `step` elements (voice-synced),
//   • draws itself with chalk strokes (redraw feel) as each element appears,
//   • carries the LASER POINTER, which glides to the element she's explaining.
// Palette matches the cream "live class" board. viewBox is 0 0 300 180 for all.
//
// Boards: freeBody · reaction · molecule · cell · numberLine · graphFn · timeline
// (physics · chemistry · chemistry · biology · maths · maths · history)

const ACircle = Animated.createAnimatedComponent(Circle);
const ARect = Animated.createAnimatedComponent(Rect);

// Director-controlled reveal (mirror of LessonBoards.useReveal — kept local to
// avoid a circular import). step != null → show exactly that many; else self-pace.
function useReveal(total, stepMs, { paused, skip, resetKey, step }) {
  const directed = step != null;
  const [n, setN] = useState(skip ? total : (total > 0 ? 1 : 0));
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    if (directed) return undefined;
    if (skip) { setN(total); return undefined; }
    setN(total > 0 ? 1 : 0);
    if (total <= 1) return undefined;
    let i = 1;
    const id = setInterval(() => { if (pausedRef.current) return; i += 1; setN(i); if (i >= total) clearInterval(id); }, stepMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, skip, total, stepMs, directed]);
  if (directed) return Math.max(0, Math.min(total, step));
  return n;
}

// ── THE POINTER ENGINE ────────────────────────────────────────────────────────
// A laser-pointer dot with a soft pulsing halo that smoothly glides to whatever
// the teacher is pointing at right now (a label, a bar, an arrow tip, a reaction
// term). Movement eases (cubic) so it feels like a hand, not a jump. Cheap: three
// small SVG circles + one looping value.
function LaserPointer({ x, y, color = '#E0322E', show = true }) {
  const cx = useRef(new Animated.Value(x)).current;
  const cy = useRef(new Animated.Value(y)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // ANTICIPATE the speech: the pointer sets off toward the next element the moment
    // the beat lands (as she starts saying it), arriving just as it's drawn — a real
    // teacher's hand is already moving to what she's about to name, not trailing it.
    const a = Animated.parallel([
      Animated.timing(cx, { toValue: x, duration: 440, delay: 0, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.timing(cy, { toValue: y, duration: 440, delay: 0, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
    ]);
    a.start();
    return () => a.stop();
  }, [x, y, cx, cy]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  if (!show || x == null || y == null) return null;
  const haloR = pulse.interpolate({ inputRange: [0, 1], outputRange: [5, 18] });
  const haloO = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
  return (
    <G>
      <ACircle cx={cx} cy={cy} r={haloR} fill={color} opacity={haloO} />
      <ACircle cx={cx} cy={cy} r={5} fill={color} />
      <ACircle cx={cx} cy={cy} r={2} fill="#fff" opacity={0.95} />
    </G>
  );
}

function T(x, y, text, color, size = 12, anchor = 'middle', weight = 'bold') {
  return <SvgText x={x} y={y} fill={color} fontSize={size} fontWeight={weight} textAnchor={anchor}>{text}</SvgText>;
}

const COLORS = [C.orange, C.blue, C.green, C.pink];
const wrapStyle = { width: '100%', alignItems: 'center' };

// Grab the label list a board should use, with graceful fallbacks so it always
// renders something meaningful even when the model gave sparse data.
function itemsOf(scene, fallback) {
  const d = scene.diagram || {};
  const items = (Array.isArray(d.items) && d.items.length) ? d.items
    : (Array.isArray(d.points) && d.points.length) ? d.points : [];
  return items.length ? items.map((x) => String(x)) : fallback;
}

// ── PHYSICS · free-body diagram ───────────────────────────────────────────────
export function FreeBodyBoard({ scene, paused, skip, resetKey, step }) {
  const { h } = useBoardSize();
  const labels = itemsOf(scene, ['Weight', 'Normal', 'Applied', 'Friction']);
  const cxb = 150; const cyb = 92; const hs = 20;
  // weight ↓ · normal ↑ · applied → · friction ←
  const forces = [
    { x1: cxb, y1: cyb + hs, x2: cxb, y2: cyb + 56, color: C.orange, lx: cxb, ly: cyb + 70, label: labels[0] || 'Weight' },
    { x1: cxb, y1: cyb - hs, x2: cxb, y2: cyb - 52, color: C.blue, lx: cxb, ly: cyb - 58, label: labels[1] || 'Normal' },
    { x1: cxb + hs, y1: cyb, x2: cxb + 78, y2: cyb, color: C.green, lx: cxb + 92, ly: cyb + 4, label: labels[2] || 'Applied' },
    { x1: cxb - hs, y1: cyb, x2: cxb - 74, y2: cyb, color: C.pink, lx: cxb - 74, ly: cyb - 8, label: labels[3] || 'Friction' },
  ];
  const n = useReveal(4, 900, { paused, skip, resetKey, step });
  const tip = forces[Math.min(n, 4) - 1];
  // MOVING OBJECT — once the applied force is on the board (step 3), the block is
  // pushed and slides in the force's direction, then settles: the object visibly
  // responds to the force instead of sitting still like a label.
  const blockX = useRef(new Animated.Value(cxb - hs)).current;
  useEffect(() => {
    const to = (n >= 3 && !skip) ? cxb - hs + 14 : cxb - hs;
    const a = Animated.spring(blockX, { toValue: to, useNativeDriver: false, friction: 6, tension: 42 });
    a.start();
    return () => a.stop();
  }, [n, skip, blockX, cxb, hs]);
  return (
    <View style={wrapStyle}>
      <Svg width="100%" height={h(188)} viewBox="0 0 300 180">
        {/* ground + the body (slides when pushed) */}
        <ARect x={blockX} y={cyb - hs} width={hs * 2} height={hs * 2} rx={4} fill="rgba(44,48,67,0.06)" stroke={C.ink} strokeWidth={2} />
        {forces.map((f, i) => (i < n ? (
          <G key={i}>
            <Arrow x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} color={f.color} width={3.5} duration={520} skip={skip} />
            {T(f.lx, f.ly, f.label, f.color, 12)}
          </G>
        ) : null))}
        {n > 0 && tip && <LaserPointer x={tip.x2} y={tip.y2} />}
      </Svg>
    </View>
  );
}

// ── CHEMISTRY · reaction chain (reactants → products, then "balanced") ────────
export function ReactionBoard({ scene, paused, skip, resetKey, step }) {
  const { h } = useBoardSize();
  const d = scene.diagram || {};
  const raw = String(d.label || (Array.isArray(d.steps) && d.steps.join(' ')) || '');
  const split = raw.split(/->|→|=>|\byields\b|\bgives\b/i);
  const items = itemsOf(scene, []);
  const left = (split[0] && split[0].trim()) || items[0] || 'A + B';
  const right = (split[1] && split[1].trim()) || items[1] || 'AB';
  const n = useReveal(4, 950, { paused, skip, resetKey, step });
  const anchors = [{ x: 74, y: 78 }, { x: 150, y: 78 }, { x: 232, y: 78 }, { x: 150, y: 78 }];
  const tip = anchors[Math.min(n, 4) - 1];
  return (
    <View style={wrapStyle}>
      <Svg width="100%" height={h(150)} viewBox="0 0 300 150">
        {n >= 1 && <G>{T(74, 84, left.slice(0, 14), C.blue, 20)}</G>}
        {n >= 2 && <Arrow x1={116} y1={78} x2={186} y2={78} color={C.ink} width={3} duration={420} skip={skip} />}
        {n >= 3 && <G>{T(232, 84, right.slice(0, 14), C.green, 20)}</G>}
        {n >= 4 && <G>
          <Rect x={40} y={58} width={220} height={40} rx={10} fill="none" stroke={C.accent} strokeWidth={2} opacity={0.7} />
          {T(150, 122, 'balanced ✓', C.accent, 12)}
        </G>}
        {n > 0 && tip && <LaserPointer x={tip.x} y={tip.y - 24} />}
      </Svg>
    </View>
  );
}

// ── CHEMISTRY · molecule (central atom + bonded atoms) ────────────────────────
export function MoleculeBoard({ scene, paused, skip, resetKey, step }) {
  const { h } = useBoardSize();
  const labels = itemsOf(scene, ['O', 'H', 'H']);
  const centre = { x: 150, y: 92, r: 18, c: C.pink, label: labels[0] || 'O' };
  const outer = [
    { x: 104, y: 122, r: 12, c: C.blue, label: labels[1] || 'H' },
    { x: 196, y: 122, r: 12, c: C.blue, label: labels[2] || 'H' },
    { x: 150, y: 44, r: 12, c: C.green, label: labels[3] || '' },
  ].filter((a) => a.label);
  const total = Math.max(2, Math.min(4, 1 + outer.length));
  const n = useReveal(total, 850, { paused, skip, resetKey, step });
  const seq = [centre, ...outer];
  const tip = seq[Math.min(n, seq.length) - 1];
  return (
    <View style={wrapStyle}>
      <Svg width="100%" height={h(176)} viewBox="0 0 300 180">
        {/* bonds first (behind), each appears with its atom */}
        {outer.map((a, i) => (i + 1 < n ? (
          <Line key={`b${i}`} x1={centre.x} y1={centre.y} x2={a.x} y2={a.y} stroke={C.ink} strokeWidth={3} opacity={0.55} />
        ) : null))}
        {seq.map((a, i) => (i < n ? (
          <G key={i}>
            <Circle cx={a.x} cy={a.y} r={a.r} fill={a.c} opacity={0.9} />
            {T(a.x, a.y + 4, a.label, '#fff', a.r * 0.8)}
          </G>
        ) : null))}
        {n > 0 && tip && <LaserPointer x={tip.x} y={tip.y - (tip.r + 6)} />}
      </Svg>
    </View>
  );
}

// ── BIOLOGY · labelled cell (membrane, nucleus, organelles) ───────────────────
export function CellBoard({ scene, paused, skip, resetKey, step }) {
  const { h } = useBoardSize();
  const labels = itemsOf(scene, ['Cell membrane', 'Nucleus', 'Mitochondria', 'Cytoplasm']);
  const parts = [
    { kind: 'membrane', lx: 150, ly: 26, label: labels[0] || 'Cell membrane', anchor: { x: 150, y: 30 } },
    { kind: 'nucleus', lx: 150, ly: 96, label: labels[1] || 'Nucleus', anchor: { x: 150, y: 92 } },
    { kind: 'mito', lx: 214, ly: 128, label: labels[2] || 'Mitochondria', anchor: { x: 196, y: 118 } },
    { kind: 'cyto', lx: 74, ly: 128, label: labels[3] || 'Cytoplasm', anchor: { x: 96, y: 120 } },
  ];
  const total = Math.max(3, Math.min(5, labels.length));
  const n = useReveal(total, 850, { paused, skip, resetKey, step });
  const tip = parts[Math.min(n, parts.length) - 1];
  return (
    <View style={wrapStyle}>
      <Svg width="100%" height={h(188)} viewBox="0 0 300 180">
        {n >= 1 && <Ellipse cx={150} cy={95} rx={122} ry={64} fill="rgba(15,163,154,0.08)" stroke={C.green} strokeWidth={2.5} />}
        {n >= 2 && <G><Circle cx={150} cy={92} r={30} fill="rgba(60,157,240,0.16)" stroke={C.blue} strokeWidth={2.5} />{T(150, 96, 'N', C.blue, 16)}</G>}
        {n >= 3 && <Ellipse cx={196} cy={118} rx={20} ry={11} fill="rgba(239,138,67,0.18)" stroke={C.orange} strokeWidth={2} />}
        {n >= 4 && <Circle cx={96} cy={120} r={9} fill="rgba(238,111,150,0.16)" stroke={C.pink} strokeWidth={2} />}
        {parts.map((p, i) => (i < n ? T(p.lx, p.ly, p.label, C.ink, 10.5) : null))}
        {n > 0 && tip && <LaserPointer x={tip.anchor.x} y={tip.anchor.y} />}
      </Svg>
    </View>
  );
}

// ── MATHS · number line ───────────────────────────────────────────────────────
export function NumberLineBoard({ scene, paused, skip, resetKey, step }) {
  const { h } = useBoardSize();
  const nums = itemsOf(scene, []).map((x) => parseFloat(x)).filter((x) => Number.isFinite(x));
  const marks = nums.length ? nums.slice(0, 3) : [-2, 1, 3];
  const lo = -5; const hi = 5; const y = 96; const x0 = 26; const x1 = 274;
  const px = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
  const n = useReveal(1 + marks.length, 800, { paused, skip, resetKey, step });
  const tip = n >= 2 ? marks[Math.min(n - 1, marks.length) - 1] : null;
  return (
    <View style={wrapStyle}>
      <Svg width="100%" height={h(140)} viewBox="0 0 300 130">
        {n >= 1 && <G>
          <Arrow x1={x0 - 4} y1={y} x2={x1 + 4} y2={y} color={C.ink} width={2.5} duration={600} skip={skip} />
          {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((v) => (
            <G key={v}>
              <Line x1={px(v)} y1={y - 5} x2={px(v)} y2={y + 5} stroke={C.dim} strokeWidth={1.5} />
              {T(px(v), y + 20, String(v), C.dim, 10)}
            </G>
          ))}
        </G>}
        {marks.map((v, i) => (i + 1 < n ? (
          <G key={i}><Circle cx={px(v)} cy={y} r={6} fill={COLORS[i % COLORS.length]} />{T(px(v), y - 12, String(v), COLORS[i % COLORS.length], 12)}</G>
        ) : null))}
        {tip != null && <LaserPointer x={px(tip)} y={y - 12} />}
      </Svg>
    </View>
  );
}

// ── MATHS · function graph (line or parabola) ─────────────────────────────────
export function GraphFnBoard({ scene, paused, skip, resetKey, step }) {
  const { h } = useBoardSize();
  const blob = `${scene.title || ''} ${scene.teacherLine || ''} ${(scene.diagram && scene.diagram.label) || ''}`;
  const parabola = /parabola|quadratic|squared|x\s*\^?\s*2|x²/i.test(blob);
  const ox = 46; const oy = 132; const ex = 276; const ey = 24;
  const n = useReveal(3, 900, { paused, skip, resetKey, step });
  // curve path across the axes
  const curve = parabola
    ? 'M60 120 Q150 -10 260 120'
    : `M${ox} ${oy - 6} L${ex - 6} ${ey + 10}`;
  const point = parabola ? { x: 150, y: 55 } : { x: 200, y: oy - 6 - ((200 - ox) / (ex - ox)) * (oy - ey) };
  const tip = n >= 3 ? point : (n >= 2 ? { x: 205, y: parabola ? 60 : point.y } : null);
  return (
    <View style={wrapStyle}>
      <Svg width="100%" height={h(172)} viewBox="0 0 300 156">
        {n >= 1 && <G>
          <Arrow x1={ox} y1={oy} x2={ex} y2={oy} color={C.ink} width={2.5} duration={620} skip={skip} />
          <Arrow x1={ox} y1={oy} x2={ox} y2={ey} color={C.ink} width={2.5} duration={620} skip={skip} />
          {T(ex - 4, oy + 16, 'x', C.dim, 12)}{T(ox - 14, ey + 4, 'y', C.dim, 12)}
        </G>}
        {n >= 2 && <ChalkStroke d={curve} length={parabola ? 360 : 260} color={C.accent} width={3.5} duration={900} skip={skip} />}
        {n >= 3 && <Circle cx={point.x} cy={point.y} r={5} fill={C.pink} />}
        {tip && <LaserPointer x={tip.x} y={tip.y} />}
      </Svg>
    </View>
  );
}

// ── HISTORY · timeline (axis + dated events left→right) ───────────────────────
export function TimelineBoard({ scene, paused, skip, resetKey, step }) {
  const { h } = useBoardSize();
  const items = itemsOf(scene, ['Event one', 'Event two', 'Event three']).slice(0, 5);
  const y = 90; const x0 = 30; const x1 = 270;
  const gap = items.length > 1 ? (x1 - x0) / (items.length - 1) : 0;
  const n = useReveal(items.length, 900, { paused, skip, resetKey, step });
  const xi = (i) => (items.length > 1 ? x0 + i * gap : (x0 + x1) / 2);
  const tip = n > 0 ? { x: xi(Math.min(n, items.length) - 1), y } : null;
  return (
    <View style={wrapStyle}>
      <Svg width="100%" height={h(172)} viewBox="0 0 300 156">
        {n >= 1 && <Arrow x1={x0 - 6} y1={y} x2={x1 + 6} y2={y} color={C.ink} width={2.5} duration={640} skip={skip} />}
        {items.map((it, i) => {
          if (i >= n) return null;
          const x = xi(i);
          const up = i % 2 === 0;
          const col = COLORS[i % COLORS.length];
          const label = String(it).replace(/\s+/g, ' ').slice(0, 16);
          return (
            <G key={i}>
              <Line x1={x} y1={y} x2={x} y2={up ? y - 26 : y + 26} stroke={col} strokeWidth={2} />
              <Circle cx={x} cy={y} r={5} fill={col} />
              {T(x, up ? y - 32 : y + 40, label, C.ink, 9.5)}
            </G>
          );
        })}
        {tip && <LaserPointer x={tip.x} y={tip.y} />}
      </Svg>
    </View>
  );
}

// ── ANNOTATED FIGURE ──────────────────────────────────────────────────────────
// ONE drawn thing, labelled part by part as she names each piece. The boards above
// are each welded to a subject; this one is a registry, so an algebra identity and
// a physics setup go through the same renderer and only the FIGURE differs.
//
// A figure declares:
//   total  — how many parts it reveals (must match boardTotalFor in the Director)
//   labels — default label per part; a scene can override any of them
//   draw   — the parts, drawn cumulatively for the current n
//   tip    — where the laser pointer rests after part n
//
// Adding a figure is adding one entry here plus one regex in teachingScenes.
const FIGURES = {
  // (a + b)² — the square cut into a², two ab rectangles and b². The whole proof
  // of the identity is visible at once, which is the point of drawing it at all.
  squareExpansion: {
    total: 5,
    labels: ['side = a + b', 'a and b', 'a²', 'ab', 'b²'],
    tip: (n) => [{ x: 143, y: 12 }, { x: 162, y: 100 }, { x: 120, y: 58 }, { x: 185, y: 58 }, { x: 185, y: 123 }][n - 1],
    draw: ({ n, skip, labels }) => (
      <G>
        {n >= 1 && (
          <G>
            <Rect x={78} y={16} width={130} height={130} fill="none" stroke={C.ink} strokeWidth={2} />
            {T(143, 10, labels[0], C.teal, 11)}
          </G>
        )}
        {n >= 2 && (
          <G>
            <ChalkLine x1={162} y1={16} x2={162} y2={146} color={C.ink2} width={1.6} duration={420} skip={skip} />
            <ChalkLine x1={78} y1={100} x2={208} y2={100} color={C.ink2} width={1.6} duration={420} skip={skip} />
            {T(120, 160, 'a', C.orange, 12)}
            {T(185, 160, 'b', C.green, 12)}
            {T(70, 62, 'a', C.orange, 12, 'end')}
            {T(70, 128, 'b', C.green, 12, 'end')}
          </G>
        )}
        {n >= 3 && (
          <G>
            <Rect x={78} y={16} width={84} height={84} fill={C.orange} opacity={0.16} />
            {T(120, 63, labels[2], C.orange, 20)}
          </G>
        )}
        {n >= 4 && (
          <G>
            <Rect x={162} y={16} width={46} height={84} fill={C.blue} opacity={0.18} />
            <Rect x={78} y={100} width={84} height={46} fill={C.blue} opacity={0.18} />
            {T(185, 62, labels[3], C.blue, 14)}
            {T(120, 128, labels[3], C.blue, 14)}
          </G>
        )}
        {n >= 5 && (
          <G>
            <Rect x={162} y={100} width={46} height={46} fill={C.green} opacity={0.18} />
            {T(185, 128, labels[4], C.green, 14)}
          </G>
        )}
      </G>
    ),
  },

  // A magnet pushed at a coil, the field cutting the turns, and the bulb lighting
  // with no battery anywhere — the whole reason induction is surprising.
  magnetCoil: {
    total: 5,
    labels: ['Moving Magnet', 'push', 'Magnetic Field', 'Coil', 'Bulb Glows'],
    tip: (n) => [{ x: 60, y: 88 }, { x: 66, y: 60 }, { x: 148, y: 88 }, { x: 178, y: 88 }, { x: 250, y: 42 }][n - 1],
    draw: ({ n, skip, labels }) => (
      <G>
        {n >= 1 && (
          <G>
            <Rect x={14} y={78} width={30} height={20} rx={2} fill={C.ink2} />
            <Rect x={44} y={78} width={30} height={20} rx={2} fill={C.pink} />
            {T(29, 93, 'S', C.cream, 12)}
            {T(59, 93, 'N', C.cream, 12)}
            {T(12, 118, labels[0], C.ink2, 11, 'start')}
          </G>
        )}
        {n >= 2 && (
          <G>
            <Arrow x1={20} y1={62} x2={68} y2={62} color={C.teal} width={2} duration={420} skip={skip} />
            {T(22, 54, labels[1], C.teal, 10, 'start')}
          </G>
        )}
        {n >= 3 && (
          <G>
            <Path d="M78,82 C104,54 130,52 150,70" stroke={C.brass} strokeWidth={1.6} fill="none" />
            <Path d="M78,88 C108,84 128,84 150,87" stroke={C.brass} strokeWidth={1.6} fill="none" />
            <Path d="M78,94 C104,122 130,124 150,106" stroke={C.brass} strokeWidth={1.6} fill="none" />
            {T(104, 148, labels[2], C.brass, 11)}
          </G>
        )}
        {n >= 4 && (
          <G>
            <Ellipse cx={162} cy={88} rx={9} ry={34} fill="none" stroke={C.orange} strokeWidth={2.2} />
            <Ellipse cx={178} cy={88} rx={9} ry={34} fill="none" stroke={C.orange} strokeWidth={2.2} />
            <Ellipse cx={194} cy={88} rx={9} ry={34} fill="none" stroke={C.orange} strokeWidth={2.2} />
            {T(178, 136, labels[3], C.orange, 11)}
          </G>
        )}
        {n >= 5 && (
          <G>
            <Path d="M203,66 L232,66 L232,50" stroke={C.orange} strokeWidth={1.8} fill="none" />
            <Path d="M203,110 L266,110 L266,50" stroke={C.orange} strokeWidth={1.8} fill="none" />
            <Circle cx={249} cy={38} r={13} fill={C.orange} opacity={0.22} />
            <Circle cx={249} cy={38} r={13} fill="none" stroke={C.orange} strokeWidth={1.8} />
            <Path d="M243,44 L246,32 L249,44 L252,32 L255,44" stroke={C.orange} strokeWidth={1.4} fill="none" />
            {T(249, 16, labels[4], C.orange, 11)}
          </G>
        )}
      </G>
    ),
  },
};

export function AnnotatedBoard({ scene, paused, skip, resetKey, step }) {
  const { h } = useBoardSize();
  const d = scene.diagram || {};
  const fig = FIGURES[d.figure];
  // Hooks must run whatever the figure is, so the reveal is counted before the
  // bail-out. total 0 keeps it inert when the figure key is unknown.
  const total = fig ? fig.total : 0;
  const n = useReveal(total, 950, { paused, skip, resetKey, step });
  if (!fig) return null;
  // A scene may rename any part ("Moving Magnet" → "Bar magnet"); anything it does
  // not name keeps the figure's own wording rather than going blank.
  const parts = Array.isArray(d.parts) ? d.parts : [];
  const labels = fig.labels.map((L, i) => (parts[i] && parts[i].label) || L);
  const tip = n > 0 ? fig.tip(Math.min(total, n)) : null;
  return (
    <View style={wrapStyle}>
      <Svg width="100%" height={h(188)} viewBox="0 0 300 180">
        {fig.draw({ n, skip, labels })}
        {tip && <LaserPointer x={tip.x} y={tip.y} />}
      </Svg>
    </View>
  );
}

// How many parts a figure reveals — the Director imports this so its step count
// cannot drift from what the board actually draws.
export function annotatedTotal(scene) {
  const fig = FIGURES[(scene.diagram || {}).figure];
  return fig ? fig.total : 0;
}

// Router used by LessonBoards — returns the right subject board for a boardType,
// or null if it isn't a subject board.
export function SubjectBoard({ scene, paused, skip, resetKey, step }) {
  const p = { scene, paused, skip, resetKey, step };
  switch (scene.boardType) {
    case 'freeBody': return <FreeBodyBoard {...p} />;
    case 'reaction': return <ReactionBoard {...p} />;
    case 'molecule': return <MoleculeBoard {...p} />;
    case 'cell': return <CellBoard {...p} />;
    case 'numberLine': return <NumberLineBoard {...p} />;
    case 'graphFn': return <GraphFnBoard {...p} />;
    case 'timeline': return <TimelineBoard {...p} />;
    case 'annotated': return <AnnotatedBoard {...p} />;
    default: return null;
  }
}

// The set of boardTypes this file handles (used for routing/detection).
export const SUBJECT_BOARD_TYPES = ['freeBody', 'reaction', 'molecule', 'cell', 'numberLine', 'graphFn', 'timeline', 'annotated'];

// eslint-disable-next-line no-unused-vars
const _styles = StyleSheet.create({ _pad: { padding: 0 } });
