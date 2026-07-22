import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import Svg, { G, Line, Rect, Polygon, Path, Text as SvgText } from 'react-native-svg';
import { ChalkLine, ChalkStroke } from './WhiteboardCanvas';
import { C } from './premiumTheme';
import { selfCheckLine } from './teacherPersona';
import { SubjectBoard, SUBJECT_BOARD_TYPES } from './subjectBoards';
import { CircleAround, Highlighter } from './boardGestures';
import { TriangleAlert, Ruler, BookOpen, RotateCcw } from 'lucide-react-native';

// ── marker underline — a chalk/marker stroke that "draws" under the active
// formula token (Smart Whiteboard flourish); reads as her underlining it. ──────
function MarkerUnderline({ active, color }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(w, { toValue: active ? 1 : 0, duration: active ? 440 : 160, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [active, w]);
  return <Animated.View style={{ height: 3, borderRadius: 2, marginTop: 2, backgroundColor: color, width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />;
}

// ── Animated concept boards for the live lesson (cream / ink palette) ─────────
// One entry point <LessonBoard/> switches on scene.boardType. Each board builds
// step-by-step (pause-aware) so it draws "live" while the teacher speaks.

const AG = Animated.createAnimatedComponent(G);
const ARect = Animated.createAnimatedComponent(Rect);

// A single chart bar that GROWS up from the axis (the graph draws itself) instead
// of snapping to full height — one per beat, in step with the teacher's voice.
function GrowBar({ x, baseY, h, bw, col }) {
  const g = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(g, { toValue: 1, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [g]);
  return (
    <ARect
      x={x}
      y={g.interpolate({ inputRange: [0, 1], outputRange: [baseY, baseY - h] })}
      width={bw}
      height={g.interpolate({ inputRange: [0, 1], outputRange: [0, h] })}
      rx={4}
      fill={col}
      opacity={0.9}
    />
  );
}

// Reveal counter with TWO modes:
//   • DIRECTED  (step != null) — the Teaching Director owns the timing; the board
//     simply shows exactly `step` elements, in sync with the teacher's voice.
//   • AUTONOMOUS (step == null) — legacy self-paced timer (kept as a fallback for
//     any surface that renders a board without the Director).
// Either way it resets whenever resetKey changes (a new scene).
function useReveal(total, stepMs, { paused, skip, resetKey, step }) {
  const directed = step != null;
  const [n, setN] = useState(skip ? total : (total > 0 ? 1 : 0));
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    if (directed) return undefined;            // director drives it — no internal timer
    if (skip) { setN(total); return undefined; }
    setN(total > 0 ? 1 : 0);
    if (total <= 1) return undefined;
    let i = 1;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      i += 1; setN(i);
      if (i >= total) clearInterval(id);
    }, stepMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, skip, total, stepMs, directed]);
  if (directed) return Math.max(0, Math.min(total, step)); // show exactly what the director asked for
  return n;
}

// fade a group of SVG nodes in once `show` flips true
function FadeG({ children, show }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (show) { Animated.timing(a, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }
    else a.setValue(0);
  }, [show, a]);
  return <AG opacity={a}>{children}</AG>;
}

// fade + rise a RN view — soft "settle" easing so each element eases into place
// rather than popping (premium micro-motion).
function Pop({ children, show, style }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (show) Animated.timing(a, { toValue: 1, duration: 400, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
    else a.setValue(0);
  }, [show, a]);
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// fade + rise like Pop, but with BOARD MEMORY: once it is no longer the line she's
// on (`active` flips false) it eases down to `dimTo` brightness instead of staying
// at full — so earlier points recede and the current one stays bright, the way a
// real board fills up. `active` defaults true, so it degrades to a plain reveal.
function Reveal({ children, show, active = true, dimTo = 0.5, style }) {
  const a = useRef(new Animated.Value(0)).current;   // reveal 0→1
  const dim = useRef(new Animated.Value(1)).current; // brightness (1 current · dimTo past)
  useEffect(() => {
    if (show) Animated.timing(a, { toValue: 1, duration: 400, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
    else a.setValue(0);
  }, [show, a]);
  useEffect(() => {
    Animated.timing(dim, { toValue: active ? 1 : dimTo, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [active, dim, dimTo]);
  return (
    <Animated.View style={[style, { opacity: Animated.multiply(a, dim), transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

function svgLabel(x, y, text, color, size = 12, rotate) {
  return (
    <SvgText x={x} y={y} fill={color} fontSize={size} fontWeight="bold" textAnchor="middle"
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>{text}</SvgText>
  );
}

// ── TRIANGLE: base → height → hypotenuse, labels after each, legend ───────────
function TriangleBoard({ scene, paused, skip, resetKey, step }) {
  const n = useReveal(4, 900, { paused, skip, resetKey, step });
  const A = { x: 58, y: 150 };   // right angle
  const B = { x: 250, y: 150 };  // base end
  const Cc = { x: 58, y: 40 };   // height top
  return (
    <View style={s.triRow}>
      <View style={s.triDiagram}>
        <Svg width="100%" height={156} viewBox="0 0 290 178">
          {/* base (orange) */}
          {n >= 1 && <ChalkLine x1={A.x} y1={A.y} x2={B.x} y2={B.y} color={C.orange} width={5} duration={900} skip={skip} />}
          {n >= 1 && <FadeG show>{svgLabel((A.x + B.x) / 2, A.y + 25, 'b', C.orange, 20)}</FadeG>}
          {/* height (blue) */}
          {n >= 2 && <ChalkLine x1={A.x} y1={A.y} x2={Cc.x} y2={Cc.y} color={C.blue} width={5} duration={900} skip={skip} />}
          {n >= 2 && <FadeG show>{svgLabel(A.x - 16, (A.y + Cc.y) / 2 + 6, 'h', C.blue, 20)}</FadeG>}
          {/* hypotenuse (green) */}
          {n >= 3 && <ChalkLine x1={B.x} y1={B.y} x2={Cc.x} y2={Cc.y} color={C.green} width={5} duration={1000} skip={skip} />}
          {n >= 3 && <FadeG show>{svgLabel((B.x + Cc.x) / 2 + 14, (B.y + Cc.y) / 2 - 8, 'H', C.green, 20)}</FadeG>}
          {/* right-angle marker */}
          {n >= 4 && <ChalkStroke d={`M${A.x + 18},${A.y} V${A.y - 18} H${A.x}`} length={36} color={C.dim} width={2.5} duration={220} skip={skip} />}
        </Svg>
      </View>
      <Pop show={n >= 2} style={s.triLegend}>
        <LegendRich color={C.orange} term="Base (b)" desc="The side along the bottom." />
        <LegendRich color={C.blue} term="Height (h)" desc="The side going up." />
        <LegendRich color={C.green} term="Hypotenuse (H)" desc="The longest side, opposite the right angle." />
      </Pop>
    </View>
  );
}

function LegendRich({ color, term, desc }) {
  return (
    <View style={s.legRow}>
      <View style={[s.legDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[s.legTerm, { color }]}>{term}</Text>
        <Text style={s.legDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// ── FORMULA: parts reveal + highlight one by one ──────────────────────────────
function FormulaBoard({ scene, paused, skip, resetKey, step, highlight }) {
  const parts = scene.formulaParts && scene.formulaParts.length ? scene.formulaParts : ['base²', '+ height²', '= hypotenuse²'];
  const colors = [C.orange, C.blue, C.green, C.ink];
  const hot = hotSet(highlight);
  const n = useReveal(parts.length, 1000, { paused, skip, resetKey, step });
  // Once every part is written, she loops a chalk ring around the whole rule —
  // "and THIS is the one to remember" — the way a teacher circles the key result.
  const complete = n >= parts.length && !skip;
  return (
    <View style={s.boardWrap}>
      <View style={s.formulaCard}>
        <CircleAround active={complete} color={C.accent}>
          <View style={s.formulaRow}>
            {parts.map((p, i) => {
              const isHot = i < n && hasHot(p, hot);            // spoken keyword → accent glow
              return (
              <Pop key={i} show={i < n} style={[s.formulaTokWrap, i === n - 1 && !skip && s.formulaTokActive, isHot && s.formulaTokHot]}>
                <Text style={[s.formulaTok, { color: isHot ? C.accent : colors[i % colors.length] }]}>{p}</Text>
                <MarkerUnderline active={(i === n - 1 && !skip) || isHot} color={isHot ? C.accent : colors[i % colors.length]} />
              </Pop>
              );
            })}
          </View>
        </CircleAround>
      </View>
      {Array.isArray(scene.diagram && scene.diagram.variables) && scene.diagram.variables.length > 0 && (
        <Pop show={n >= parts.length} style={s.varList}>
          {scene.diagram.variables.slice(0, 3).map((vr, i) => (
            <Text key={i} style={s.varLine}><Text style={{ fontWeight: '900', color: colors[i % 3] }}>{vr.symbol}</Text>  =  {vr.meaning}</Text>
          ))}
        </Pop>
      )}
    </View>
  );
}

// ── PROOF: squares on each side → 9, 16, 25 → 9 + 16 = 25 ──────────────────────
function ProofBoard({ scene, paused, skip, resetKey, step }) {
  const n = useReveal(5, 1050, { paused, skip, resetKey, step });
  // triangle 3-4-5 (height=3 up, base=4 right) at right angle A
  const A = { x: 120, y: 150 };
  const B = { x: 190, y: 150 }; // base end (4 units → 70px)
  const Cc = { x: 120, y: 98 }; // height top (3 units → 52px)
  // hypotenuse square (outward perp of C→B): perp of (70,52) rotated -90 = (52,-70)
  const hypSq = `120,98 190,150 242,80 172,28`;
  return (
    <View style={s.boardWrap}>
      <Svg width="100%" height={220} viewBox="0 0 300 230">
        {/* base square (16, orange) below the base */}
        {n >= 2 && (
          <FadeG show>
            <Rect x={A.x} y={A.y} width={70} height={70} fill={C.orange} opacity={0.18} stroke={C.orange} strokeWidth={2} />
            {svgLabel(A.x + 35, A.y + 40, '16', C.orange, 18)}
            {svgLabel(A.x + 35, A.y + 56, '(4×4)', C.orange, 10)}
          </FadeG>
        )}
        {/* height square (9, blue) left of the height */}
        {n >= 3 && (
          <FadeG show>
            <Rect x={Cc.x - 52} y={Cc.y} width={52} height={52} fill={C.blue} opacity={0.16} stroke={C.blue} strokeWidth={2} />
            {svgLabel(Cc.x - 26, Cc.y + 28, '9', C.blue, 16)}
            {svgLabel(Cc.x - 26, Cc.y + 42, '(3×3)', C.blue, 9)}
          </FadeG>
        )}
        {/* hypotenuse square (25, green) */}
        {n >= 4 && (
          <FadeG show>
            <Polygon points={hypSq} fill={C.green} opacity={0.16} stroke={C.green} strokeWidth={2} />
            {svgLabel(181, 86, '25', C.green, 18)}
            {svgLabel(181, 102, '(5×5)', C.green, 10)}
          </FadeG>
        )}
        {/* the triangle on top */}
        {n >= 1 && (
          <>
            <ChalkLine x1={A.x} y1={A.y} x2={B.x} y2={B.y} color={C.orange} width={3} duration={500} skip={skip} />
            <ChalkLine x1={A.x} y1={A.y} x2={Cc.x} y2={Cc.y} color={C.blue} width={3} duration={500} skip={skip} />
            <ChalkLine x1={B.x} y1={B.y} x2={Cc.x} y2={Cc.y} color={C.green} width={3} duration={600} skip={skip} />
            <Line x1={A.x + 12} y1={A.y} x2={A.x + 12} y2={A.y - 12} stroke={C.dim} strokeWidth={1.5} />
            <Line x1={A.x} y1={A.y - 12} x2={A.x + 12} y2={A.y - 12} stroke={C.dim} strokeWidth={1.5} />
          </>
        )}
      </Svg>
      <Pop show={n >= 5} style={s.sumPill}>
        <CircleAround active={n >= 5 && !skip} color={C.green} padX={12} padY={7}>
          <Text style={s.sumTxt}>
            <Text style={{ color: C.blue }}>9</Text>
            <Text style={{ color: C.ink }}> + </Text>
            <Text style={{ color: C.orange }}>16</Text>
            <Text style={{ color: C.ink }}> = </Text>
            <Text style={{ color: C.green }}>25</Text>
          </Text>
        </CircleAround>
      </Pop>
    </View>
  );
}

// ── INTRO / SUMMARY / MISTAKE: soft points card ──────────────────────────────
// `memory` on → earlier points recede as she moves on (board fills up live). Off
// (summary) → every point stays pinned bright, since the recap IS the keepers.
function PointsBoard({ scene, paused, skip, resetKey, step, intro, warn, memory = true, highlight }) {
  const points = (scene.diagram && scene.diagram.points) || [];
  const total = Math.max(1, points.length);
  const hot = hotSet(highlight);
  const n = useReveal(total, 700, { paused, skip, resetKey, step });
  if (!points.length) {
    return (
      <View style={[s.boardWrap, { alignItems: 'center', paddingVertical: 18 }]}>
        {warn
          ? <TriangleAlert size={40} color={C.orange} strokeWidth={1.9} />
          : intro
            ? <Ruler size={40} color={C.accent} strokeWidth={1.9} />
            : <BookOpen size={40} color={C.accent} strokeWidth={1.9} />}
      </View>
    );
  }
  return (
    <View style={s.boardWrap}>
      {points.map((p, i) => {
        const current = i === n - 1 && !skip;
        return (
          <Reveal key={i} show={i < n} active={!memory || current} dimTo={0.42} style={s.pointRow}>
            {/* she swipes a highlighter across the line she's explaining right now */}
            {current && <Highlighter key={`hl-${i}`} color={warn ? 'rgba(239,138,67,0.20)' : 'rgba(15,163,154,0.14)'} />}
            <View style={[s.pointDot, warn && s.pointDotWarn]}><Text style={s.pointDotTxt}>{warn ? '!' : i + 1}</Text></View>
            <Text style={[s.pointTxt, i < n && hasHot(p, hot) && s.pointTxtHot]}>{p}</Text>
          </Reveal>
        );
      })}
    </View>
  );
}

// ── CONCEPT (generic flow / points) ──────────────────────────────────────────
function ConceptBoard({ scene, paused, skip, resetKey, step, highlight }) {
  const d = scene.diagram || {};
  const isFlow = d.shape === 'flow' && Array.isArray(d.steps) && d.steps.length > 0;
  const steps = isFlow ? d.steps.slice(0, 3) : [];
  const hot = hotSet(highlight);
  const n = useReveal(steps.length || 1, 850, { paused, skip, resetKey, step }); // always called
  if (isFlow) {
    return (
      <View style={[s.boardWrap, s.flowRow]}>
        {steps.map((stp, i) => (
          <React.Fragment key={i}>
            <Reveal show={i < n} active={i === n - 1} dimTo={0.45} style={[s.flowBox, i < n && hasHot(stp, hot) && s.flowBoxHot]}><Text style={[s.flowTxt, i < n && hasHot(stp, hot) && { color: C.accent }]}>{String(stp)}</Text></Reveal>
            {i < steps.length - 1 && <Pop show={i + 1 < n}><Text style={s.flowArrow}>→</Text></Pop>}
          </React.Fragment>
        ))}
      </View>
    );
  }
  return <PointsBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} step={step} highlight={highlight} />;
}

// ── CHART: axes drawn, then bars grow in one per beat (directed) ──────────────
function ChartBoard({ scene, paused, skip, resetKey, step }) {
  const chart = (scene.diagram && scene.diagram.chart) || {};
  const values = Array.isArray(chart.values) && chart.values.length ? chart.values : [40, 70, 55, 90];
  const labels = Array.isArray(chart.labels) ? chart.labels : [];
  const n = useReveal(values.length, 700, { paused, skip, resetKey, step });
  const max = Math.max(...values, 1);
  const colors = [C.orange, C.blue, C.green, C.pink];
  // layout inside a 300×176 viewBox
  const baseY = 140; const leftX = 40; const plotW = 244; const plotH = 104;
  const slot = plotW / values.length;
  const bw = Math.min(38, slot * 0.6);
  return (
    <View style={s.boardWrap}>
      <Svg width="100%" height={176} viewBox="0 0 300 176">
        {/* axes */}
        <Line x1={leftX} y1={baseY} x2={leftX + plotW} y2={baseY} stroke={C.dim} strokeWidth={2} />
        <Line x1={leftX} y1={baseY} x2={leftX} y2={baseY - plotH - 8} stroke={C.dim} strokeWidth={2} />
        {values.map((v, i) => {
          if (i >= n) return null;
          const h = Math.max(3, (v / max) * plotH);
          const x = leftX + i * slot + (slot - bw) / 2;
          const col = colors[i % colors.length];
          return (
            <G key={i}>
              <GrowBar x={x} baseY={baseY} h={h} bw={bw} col={col} />
              {svgLabel(x + bw / 2, baseY - h - 5, String(v), col, 11)}
              {!!labels[i] && svgLabel(x + bw / 2, baseY + 14, String(labels[i]).slice(0, 8), C.dim, 10)}
            </G>
          );
        })}
      </Svg>
      {(!!chart.yAxis || !!chart.xAxis) && (
        <Text style={s.chartAxes}>{[chart.yAxis, chart.xAxis].filter(Boolean).join('  vs  ')}</Text>
      )}
    </View>
  );
}

// ── A single MCQ option with premium answer feedback ──────────────────────────
// Correct pick → a soft one-shot success pulse and the tick springs in. Wrong pick
// → a brief, gentle shake and a warm AMBER wash (never a harsh red error UI). The
// teacher's spoken reaction is still owned by the player via onQuizResult.
function OptionRow({ opt, correct, wrong, locked, onPress }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const tick = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (correct) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(pulse, { toValue: 0, friction: 4, tension: 80, useNativeDriver: true }),
        ]),
        Animated.spring(tick, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
      ]).start();
    } else { tick.setValue(0); }
  }, [correct, pulse, tick]);
  useEffect(() => {
    if (wrong) {
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0.5, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    }
  }, [wrong, shake]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
  const tx = shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });
  return (
    <Animated.View style={{ alignSelf: 'stretch', transform: [{ scale }, { translateX: tx }] }}>
      <TouchableOpacity style={[s.opt, correct && s.optRight, wrong && s.optWrong]} activeOpacity={0.9} disabled={locked} onPress={onPress}>
        <Text style={s.optTxt}>{opt}</Text>
        {correct && <Animated.Text style={[s.optMark, { transform: [{ scale: tick }] }]}>✓</Animated.Text>}
        {wrong && <Text style={[s.optMark, s.optMarkWrong]}>✕</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── QUICK CHECK ──────────────────────────────────────────────────────────────
// The board handles the tap + right/wrong marking; the human REACTION (her face,
// her voice, the varied line of encouragement) is owned by the player via
// onQuizResult, so a repeated miss can soften her tone across the whole lesson.
function QuickCheckBoard({ scene, onContinue, onQuizResult, onReexplain, quizFb, reteach }) {
  const q = scene.quickCheck || {};
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [selfFb, setSelfFb] = useState('');
  const isMcq = Array.isArray(q.options) && q.options.length > 0;
  const answer = (correct) => { if (onQuizResult) onQuizResult(correct); };
  // A slow learner gets to try again: only the CORRECT choice locks the check —
  // a wrong tap stays open so they can rethink, and each attempt is felt by the
  // Emotion engine (which then eases her pace + softens her line).
  const locked = picked != null && picked === q.answer;
  const wrong = picked != null && picked !== q.answer;
  return (
    <View style={s.boardWrap}>
      <Text style={s.quizQ}>{q.question}</Text>
      {isMcq ? (
        <>
          {q.options.map((opt, i) => {
            const isAns = i === q.answer;
            const chosen = picked === i;
            return (
              <OptionRow
                key={i}
                opt={opt}
                correct={locked && isAns}
                wrong={wrong && chosen}
                locked={locked}
                onPress={() => { setPicked(i); answer(i === q.answer); }}
              />
            );
          })}
          {picked != null && (
            <Text style={[s.quizFb, { color: locked ? C.green : C.orange }]}>
              {(quizFb && quizFb.line) || (locked ? 'Correct.' : 'Not quite — try once more.')}
            </Text>
          )}
          {/* ── ADAPTIVE RE-TEACH — she notices the miss and teaches it a different
              way (named gap → step-by-step breakdown → easier question). Options stay
              open above, so the student answers again once it clicks. ── */}
          {wrong && reteach && (
            <View style={s.reteachPanel}>
              {!!reteach.gap && <Text style={s.reteachGap}>{reteach.gap}</Text>}
              {!!reteach.intro && <Text style={s.reteachIntro}>{reteach.intro}</Text>}
              {(reteach.steps || []).map((stp, i) => (
                <Text key={i} style={s.reteachStep}>{stp}</Text>
              ))}
              {!!reteach.easyQ && <Text style={s.reteachEasyQ}>{reteach.easyQ}</Text>}
            </View>
          )}
          {wrong && !reteach && !!onReexplain && (
            <TouchableOpacity style={s.reexplainBtn} activeOpacity={0.9} onPress={onReexplain}>
              <RotateCcw size={15} color={C.accent} strokeWidth={2.4} />
              <Text style={s.reexplainTxt}>Explain that again, slower</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        !revealed
          ? <TouchableOpacity style={s.opt} activeOpacity={0.9} onPress={() => { setRevealed(true); setSelfFb(selfCheckLine()); }}><Text style={s.optTxt}>Tap to check yourself</Text></TouchableOpacity>
          : <Text style={s.quizFb}>{selfFb || 'Say it in your own words, then continue.'}</Text>
      )}
      {!!onContinue && (
        <TouchableOpacity style={s.continueBtn} activeOpacity={0.9} onPress={onContinue}><Text style={s.continueTxt}>Continue ›</Text></TouchableOpacity>
      )}
    </View>
  );
}

// ── entry point ──────────────────────────────────────────────────────────────
// Keyword set + matcher — a board element whose text contains a spoken `highlight`
// keyword lights up in the accent colour, so the board emphasises the same word the
// caption does, exactly when the teacher says it.
export const hotSet = (highlight) => new Set((highlight || [])
  .flatMap((h) => String(h).toLowerCase().split(/\s+/))
  .map((w) => w.replace(/[^a-z0-9]/gi, ''))
  .filter(Boolean));
export const hasHot = (text, set) => !!set && set.size > 0 &&
  String(text || '').toLowerCase().split(/\s+/).some((w) => set.has(w.replace(/[^a-z0-9]/gi, '')));

export default function LessonBoard({ scene, paused = false, skip = false, resetKey, step, highlight, action, onQuizContinue, onQuizResult, onReexplain, quizFb, reteach }) {
  if (!scene) return null;
  // Subject illustrations (physics / chemistry / biology / maths / history) render
  // through their own engine, Director-controlled by `step` like every other board.
  if (SUBJECT_BOARD_TYPES.includes(scene.boardType)) {
    return <SubjectBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} step={step} />;
  }
  switch (scene.boardType) {
    case 'triangle': return <TriangleBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} step={step} />;
    case 'formula': return <FormulaBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} step={step} highlight={highlight} />;
    case 'chart': return <ChartBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} step={step} />;
    case 'proof': return <ProofBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} step={step} />;
    case 'quickCheck': return <QuickCheckBoard scene={scene} onContinue={onQuizContinue} onQuizResult={onQuizResult} onReexplain={onReexplain} quizFb={quizFb} reteach={reteach} />;
    case 'intro': return <PointsBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} step={step} intro highlight={highlight} />;
    case 'mistake': return <PointsBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} step={step} warn highlight={highlight} />;
    case 'summary': return <PointsBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} step={step} memory={false} highlight={highlight} />;
    case 'concept':
    default: return <ConceptBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} step={step} highlight={highlight} />;
  }
}

const s = StyleSheet.create({
  boardWrap: { width: '100%', alignItems: 'center' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendTxt: { fontSize: 11, fontWeight: '700', color: C.ink2 },

  // two-column triangle: diagram (left) + legend with descriptions (right)
  triRow: { flexDirection: 'row', width: '100%', alignItems: 'center', gap: 8 },
  triDiagram: { flex: 1.05 },
  triLegend: { flex: 1, gap: 12 },
  legRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  legDot: { width: 9, height: 9, borderRadius: 3, marginTop: 4 },
  legTerm: { fontSize: 13, fontWeight: '900' },
  legDesc: { fontSize: 11.5, fontWeight: '600', color: C.dim, lineHeight: 16, marginTop: 1 },

  formulaCard: { backgroundColor: 'rgba(44,48,67,0.04)', borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18 },
  formulaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 2 },
  formulaTokWrap: { borderRadius: 8, paddingHorizontal: 3, paddingVertical: 2 },
  formulaTokActive: { backgroundColor: 'rgba(255,138,61,0.14)' },
  formulaTokHot: { backgroundColor: C.accentSoft },
  formulaTok: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  varList: { marginTop: 12, gap: 4, alignItems: 'center' },
  varLine: { fontSize: 13, fontWeight: '600', color: C.ink2 },

  chartAxes: { fontSize: 11, fontWeight: '800', color: C.dim, marginTop: 6, textAlign: 'center' },
  sumPill: { marginTop: 10, backgroundColor: 'rgba(44,48,67,0.05)', borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 18 },
  sumTxt: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },

  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10, alignSelf: 'stretch', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 6, marginHorizontal: -6, overflow: 'hidden' },
  pointRowActive: { backgroundColor: 'rgba(15,163,154,0.10)' },       // the point she's on right now
  pointRowWarnActive: { backgroundColor: 'rgba(239,138,67,0.12)' },   // …on a common-mistake slide
  pointDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  pointDotWarn: { backgroundColor: C.orange },
  pointDotTxt: { color: '#fff', fontSize: 11, fontWeight: '900' },
  pointTxt: { flex: 1, fontSize: 15, fontWeight: '600', color: C.ink, lineHeight: 22 },
  pointTxtHot: { color: C.accent, fontWeight: '800' },

  flowRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8 },
  flowBox: { backgroundColor: 'rgba(44,48,67,0.04)', borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  flowBoxHot: { borderColor: C.accent, backgroundColor: C.accentSoft },
  flowTxt: { fontSize: 13, fontWeight: '800', color: C.ink },
  flowArrow: { fontSize: 18, fontWeight: '900', color: C.accent },

  quizQ: { fontSize: 17, fontWeight: '800', color: C.ink, lineHeight: 24, alignSelf: 'stretch', marginBottom: 4 },
  opt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', backgroundColor: 'rgba(44,48,67,0.04)', borderWidth: 1, borderColor: C.line, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 15, marginTop: 9 },
  // correct → green, softly glowing. wrong → a warm AMBER wash (never harsh red).
  optRight: { backgroundColor: 'rgba(87,214,151,0.18)', borderColor: C.green, shadowColor: C.green, shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  optWrong: { backgroundColor: 'rgba(239,138,67,0.14)', borderColor: C.orange },
  optTxt: { flex: 1, fontSize: 14, fontWeight: '700', color: C.ink },
  optMark: { fontSize: 15, fontWeight: '900', color: C.green, marginLeft: 8 },
  optMarkWrong: { color: C.orange },
  quizFb: { fontSize: 13, fontWeight: '800', marginTop: 12, alignSelf: 'stretch' },
  continueBtn: { alignSelf: 'flex-end', marginTop: 14, backgroundColor: C.accent, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 18 },
  continueTxt: { color: '#fff', fontSize: 13, fontWeight: '900' },
  reexplainBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10, backgroundColor: 'rgba(15,163,154,0.10)', borderWidth: 1, borderColor: C.accent, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 16 },
  reexplainTxt: { color: C.accent, fontSize: 13, fontWeight: '900' },

  // adaptive re-teach panel (shown on a missed check — a different explanation)
  reteachPanel: { alignSelf: 'stretch', marginTop: 14, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: 'rgba(197,126,34,0.28)', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14, gap: 6 },
  reteachGap: { fontSize: 13.5, fontWeight: '800', color: C.ink, lineHeight: 19 },
  reteachIntro: { fontSize: 12.5, fontWeight: '700', color: C.accent, marginTop: 2 },
  reteachStep: { fontSize: 13, fontWeight: '600', color: C.ink, lineHeight: 20, paddingLeft: 4 },
  reteachEasyQ: { fontSize: 13.5, fontWeight: '900', color: C.ink, marginTop: 8, lineHeight: 19 },
});
