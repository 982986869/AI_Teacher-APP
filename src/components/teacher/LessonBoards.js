import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import Svg, { G, Line, Rect, Polygon, Path, Text as SvgText } from 'react-native-svg';
import { ChalkLine, ChalkStroke } from './WhiteboardCanvas';
import { C } from './premiumTheme';

// ── Animated concept boards for the live lesson (cream / ink palette) ─────────
// One entry point <LessonBoard/> switches on scene.boardType. Each board builds
// step-by-step (pause-aware) so it draws "live" while the teacher speaks.

const AG = Animated.createAnimatedComponent(G);

// pause-aware step counter — resets whenever resetKey changes (scene change).
function useReveal(total, stepMs, { paused, skip, resetKey }) {
  const [n, setN] = useState(skip ? total : (total > 0 ? 1 : 0));
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
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
  }, [resetKey, skip, total, stepMs]);
  return n;
}

// fade a group of SVG nodes in once `show` flips true
function FadeG({ children, show }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (show) { Animated.timing(a, { toValue: 1, duration: 320, useNativeDriver: false }).start(); }
    else a.setValue(0);
  }, [show, a]);
  return <AG opacity={a}>{children}</AG>;
}

// fade + rise a RN view
function Pop({ children, show, style }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (show) Animated.timing(a, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    else a.setValue(0);
  }, [show, a]);
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
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
function TriangleBoard({ scene, paused, skip, resetKey }) {
  const n = useReveal(4, 900, { paused, skip, resetKey });
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
function FormulaBoard({ scene, paused, skip, resetKey }) {
  const parts = scene.formulaParts && scene.formulaParts.length ? scene.formulaParts : ['base²', '+ height²', '= hypotenuse²'];
  const colors = [C.orange, C.blue, C.green, C.ink];
  const n = useReveal(parts.length, 1000, { paused, skip, resetKey });
  return (
    <View style={s.boardWrap}>
      <View style={s.formulaCard}>
        <View style={s.formulaRow}>
          {parts.map((p, i) => (
            <Pop key={i} show={i < n} style={[s.formulaTokWrap, i === n - 1 && !skip && s.formulaTokActive]}>
              <Text style={[s.formulaTok, { color: colors[i % colors.length] }]}>{p}</Text>
            </Pop>
          ))}
        </View>
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
function ProofBoard({ scene, paused, skip, resetKey }) {
  const n = useReveal(5, 1050, { paused, skip, resetKey });
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
        <Text style={s.sumTxt}>
          <Text style={{ color: C.blue }}>9</Text>
          <Text style={{ color: C.ink }}> + </Text>
          <Text style={{ color: C.orange }}>16</Text>
          <Text style={{ color: C.ink }}> = </Text>
          <Text style={{ color: C.green }}>25</Text>
        </Text>
      </Pop>
    </View>
  );
}

// ── INTRO / SUMMARY / MISTAKE: soft points card ──────────────────────────────
function PointsBoard({ scene, paused, skip, resetKey, intro, warn }) {
  const points = (scene.diagram && scene.diagram.points) || [];
  const total = Math.max(1, points.length);
  const n = useReveal(total, 700, { paused, skip, resetKey });
  if (!points.length) {
    return (
      <View style={[s.boardWrap, { alignItems: 'center', paddingVertical: 18 }]}>
        <Text style={{ fontSize: 46 }}>{warn ? '⚠️' : intro ? '📐' : '📘'}</Text>
      </View>
    );
  }
  return (
    <View style={s.boardWrap}>
      {points.map((p, i) => (
        <Pop key={i} show={i < n} style={s.pointRow}>
          <View style={[s.pointDot, warn && s.pointDotWarn]}><Text style={s.pointDotTxt}>{warn ? '!' : i + 1}</Text></View>
          <Text style={s.pointTxt}>{p}</Text>
        </Pop>
      ))}
    </View>
  );
}

// ── CONCEPT (generic flow / points) ──────────────────────────────────────────
function ConceptBoard({ scene, paused, skip, resetKey }) {
  const d = scene.diagram || {};
  const isFlow = d.shape === 'flow' && Array.isArray(d.steps) && d.steps.length > 0;
  const steps = isFlow ? d.steps.slice(0, 3) : [];
  const n = useReveal(steps.length || 1, 850, { paused, skip, resetKey }); // always called
  if (isFlow) {
    return (
      <View style={[s.boardWrap, s.flowRow]}>
        {steps.map((stp, i) => (
          <React.Fragment key={i}>
            <Pop show={i < n} style={s.flowBox}><Text style={s.flowTxt}>{String(stp)}</Text></Pop>
            {i < steps.length - 1 && <Pop show={i + 1 < n}><Text style={s.flowArrow}>→</Text></Pop>}
          </React.Fragment>
        ))}
      </View>
    );
  }
  return <PointsBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} />;
}

// ── QUICK CHECK ──────────────────────────────────────────────────────────────
function QuickCheckBoard({ scene, onContinue }) {
  const q = scene.quickCheck || {};
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const isMcq = Array.isArray(q.options) && q.options.length > 0;
  return (
    <View style={s.boardWrap}>
      <Text style={s.quizQ}>{q.question}</Text>
      {isMcq ? (
        <>
          {q.options.map((opt, i) => {
            const answered = picked != null;
            const isAns = i === q.answer;
            const chosen = picked === i;
            const st = [s.opt];
            if (answered && isAns) st.push(s.optRight);
            else if (answered && chosen && !isAns) st.push(s.optWrong);
            return (
              <TouchableOpacity key={i} style={st} activeOpacity={0.9} disabled={answered} onPress={() => setPicked(i)}>
                <Text style={s.optTxt}>{opt}</Text>
                {answered && isAns && <Text style={s.optMark}>✓</Text>}
                {answered && chosen && !isAns && <Text style={[s.optMark, { color: C.pink }]}>✕</Text>}
              </TouchableOpacity>
            );
          })}
          {picked != null && (
            <Text style={[s.quizFb, { color: picked === q.answer ? C.green : C.pink }]}>
              {picked === q.answer ? '🎉 Correct!' : '🤔 Almost — the right answer is highlighted.'}
            </Text>
          )}
        </>
      ) : (
        !revealed
          ? <TouchableOpacity style={s.opt} activeOpacity={0.9} onPress={() => setRevealed(true)}><Text style={s.optTxt}>🤔 Tap to check yourself</Text></TouchableOpacity>
          : <Text style={s.quizFb}>Say it in your own words, then continue 👍</Text>
      )}
      {!!onContinue && (
        <TouchableOpacity style={s.continueBtn} activeOpacity={0.9} onPress={onContinue}><Text style={s.continueTxt}>Continue ›</Text></TouchableOpacity>
      )}
    </View>
  );
}

// ── entry point ──────────────────────────────────────────────────────────────
export default function LessonBoard({ scene, paused = false, skip = false, resetKey, onQuizContinue }) {
  if (!scene) return null;
  switch (scene.boardType) {
    case 'triangle': return <TriangleBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} />;
    case 'formula': return <FormulaBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} />;
    case 'proof': return <ProofBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} />;
    case 'quickCheck': return <QuickCheckBoard scene={scene} onContinue={onQuizContinue} />;
    case 'intro': return <PointsBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} intro />;
    case 'mistake': return <PointsBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} warn />;
    case 'summary': return <PointsBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} />;
    case 'concept':
    default: return <ConceptBoard scene={scene} paused={paused} skip={skip} resetKey={resetKey} />;
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

  formulaCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18 },
  formulaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 2 },
  formulaTokWrap: { borderRadius: 8, paddingHorizontal: 3, paddingVertical: 2 },
  formulaTokActive: { backgroundColor: 'rgba(255,138,61,0.14)' },
  formulaTok: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  varList: { marginTop: 12, gap: 4, alignItems: 'center' },
  varLine: { fontSize: 13, fontWeight: '600', color: C.ink2 },

  sumPill: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 18 },
  sumTxt: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },

  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10, alignSelf: 'stretch' },
  pointDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  pointDotWarn: { backgroundColor: C.orange },
  pointDotTxt: { color: '#fff', fontSize: 11, fontWeight: '900' },
  pointTxt: { flex: 1, fontSize: 15, fontWeight: '600', color: C.ink, lineHeight: 22 },

  flowRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8 },
  flowBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  flowTxt: { fontSize: 13, fontWeight: '800', color: C.ink },
  flowArrow: { fontSize: 18, fontWeight: '900', color: C.accent },

  quizQ: { fontSize: 17, fontWeight: '800', color: C.ink, lineHeight: 24, alignSelf: 'stretch', marginBottom: 4 },
  opt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.line, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 15, marginTop: 9 },
  optRight: { backgroundColor: 'rgba(87,214,151,0.16)', borderColor: C.green },
  optWrong: { backgroundColor: 'rgba(255,143,176,0.14)', borderColor: C.pink },
  optTxt: { flex: 1, fontSize: 14, fontWeight: '700', color: C.ink },
  optMark: { fontSize: 15, fontWeight: '900', color: C.green, marginLeft: 8 },
  quizFb: { fontSize: 13, fontWeight: '800', marginTop: 12, alignSelf: 'stretch' },
  continueBtn: { alignSelf: 'flex-end', marginTop: 14, backgroundColor: C.accent, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 18 },
  continueTxt: { color: '#fff', fontSize: 13, fontWeight: '900' },
});
