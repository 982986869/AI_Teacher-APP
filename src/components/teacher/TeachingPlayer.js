import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import WhiteboardCanvas from './WhiteboardCanvas';
import DiagramRenderer from './DiagramRenderer';
import { BOARD } from './theme';

// ── Teaching Timeline Engine ──────────────────────────────────────────────────
// Plays a lesson one scene at a time on a premium dark stage, like a teacher on a
// digital whiteboard: each scene animates, then the next is revealed (with a
// chalk wipe). Playback controls: Pause / Resume / Next / Replay.
//
// Entrance animations use the RN Animated API (not reanimated) to avoid a native
// worklets dependency; SVG drawing lives in WhiteboardCanvas/DiagramRenderer.

const WIPE_MS = 460;
const GAP_MS = 700;

// ── Entrance wrapper: fades + slides/scales in on mount ───────────────────────
function Appear({ children, style, from = 'up', duration = 380, delay = 0 }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(a, {
      toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [a, duration, delay]);
  const transform = [];
  if (from === 'up') transform.push({ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) });
  if (from === 'right') transform.push({ translateX: a.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) });
  if (from === 'scale') transform.push({ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) });
  return <Animated.View style={[style, { opacity: a, transform }]}>{children}</Animated.View>;
}

// ── Shared reveal hooks ───────────────────────────────────────────────────────

// Typewriter that respects pause + a one-shot skip, and reports completion.
function useTypewriter(text, { paused, skip, speed = 22, onDone }) {
  const [typed, setTyped] = useState('');
  const pausedRef = useRef(paused);
  const doneRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  const fire = () => { if (!doneRef.current) { doneRef.current = true; onDone && onDone(); } };

  useEffect(() => {
    if (skip) { setTyped(text); fire(); return undefined; }
    let i = 0;
    setTyped('');
    const id = setInterval(() => {
      if (pausedRef.current) return;
      i += 1;
      setTyped(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); fire(); }
    }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  return typed;
}

// Sequentially reveals `total` items (one per stepMs), pausable + skippable.
function useTimedReveal({ total, stepMs = 780, paused, skip, onDone }) {
  const [visible, setVisible] = useState(total > 0 ? 1 : 0);
  const pausedRef = useRef(paused);
  const doneRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    if (skip) { setVisible(total); return undefined; }
    if (total <= 1) return undefined;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setVisible((v) => { if (v >= total) { clearInterval(id); return v; } return v + 1; });
    }, stepMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, total, stepMs]);

  useEffect(() => {
    if (visible >= total && !doneRef.current) { doneRef.current = true; onDone && onDone(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, total]);

  return visible;
}

// ── Narration bubbles ─────────────────────────────────────────────────────────

const BUBBLES = {
  teacher: { emoji: '👩‍🏫', label: 'Teacher', bg: '#171C26', accent: BOARD.orange },
  explanation: { emoji: '💬', label: 'Explanation', bg: '#141B24', accent: BOARD.blue },
  hint: { emoji: '💡', label: 'Hint', bg: '#1A1810', accent: BOARD.yellow },
};

function NarrationBubble({ variant = 'teacher', title, children }) {
  const cfg = BUBBLES[variant] || BUBBLES.teacher;
  return (
    <Appear from="up" style={[styles.bubble, { backgroundColor: cfg.bg, borderColor: cfg.accent, shadowColor: cfg.accent }]}>
      <View style={styles.bubbleHead}>
        <Text style={styles.bubbleEmoji}>{cfg.emoji}</Text>
        <Text style={[styles.bubbleLabel, { color: cfg.accent }]}>{title || cfg.label}</Text>
      </View>
      {children}
    </Appear>
  );
}

// ── Scenes ────────────────────────────────────────────────────────────────────

function ExplanationScene({ scene, paused, skip, onComplete }) {
  const text = scene.text || '';
  const typed = useTypewriter(text, { paused, skip, onDone: onComplete });
  return (
    <View style={styles.center}>
      {!!scene.title && (
        <Appear from="up"><Text style={styles.sceneTitle}>{scene.title}</Text></Appear>
      )}
      <NarrationBubble variant="teacher">
        <Text style={styles.bubbleText}>
          {typed}
          {typed.length < text.length ? <Text style={styles.caret}>▍</Text> : null}
        </Text>
      </NarrationBubble>
    </View>
  );
}

function StepsScene({ scene, paused, skip, onComplete }) {
  const steps = scene.steps || [];
  const visible = useTimedReveal({ total: steps.length, stepMs: 800, paused, skip, onDone: onComplete });
  return (
    <View style={styles.center}>
      {!!scene.title && <Text style={styles.sceneTitle}>{scene.title}</Text>}
      {steps.map((s, i) => (i < visible ? (
        <Appear key={i} from="right" style={styles.stepRow}>
          <View style={styles.stepNum}><Text style={styles.stepNumTxt}>{i + 1}</Text></View>
          <Text style={styles.stepTxt}>{s}</Text>
        </Appear>
      ) : null))}
    </View>
  );
}

function splitFormula(f) {
  const parts = String(f || '').trim().split(/\s+(?=[+\-=×*/])/).map((x) => x.trim()).filter(Boolean);
  return parts.length ? parts : [String(f || '')];
}

function FormulaScene({ scene, paused, skip, onComplete }) {
  const tokens = splitFormula(scene.formula);
  const visible = useTimedReveal({ total: tokens.length, stepMs: 850, paused, skip, onDone: onComplete });
  return (
    <View style={styles.center}>
      <NarrationBubble variant="teacher" title="Building the formula">
        <Text style={styles.bubbleText}>Step by step ✏️</Text>
      </NarrationBubble>
      <View style={styles.formulaStack}>
        {tokens.map((tk, i) => (i < visible ? (
          <Appear key={i} from="up" style={styles.formulaRow}>
            {i > 0 && <Text style={styles.formulaArrow}>↓</Text>}
            <View style={styles.formulaChip}><Text style={styles.formulaText}>{tk}</Text></View>
          </Appear>
        ) : null))}
      </View>
    </View>
  );
}

function DiagramScene({ scene, skip, onComplete }) {
  return (
    <View style={styles.center}>
      <NarrationBubble variant="teacher" title="On the board">
        <Text style={styles.bubbleText}>Watch me draw it 🖍️</Text>
      </NarrationBubble>
      <View style={styles.diagramWrap}>
        <DiagramRenderer shape={scene.shape} caption={scene.caption} data={scene.data} skip={skip} onComplete={onComplete} />
      </View>
    </View>
  );
}

function ExampleScene({ scene, paused, skip, onComplete }) {
  const steps = scene.steps || [];
  const visible = useTimedReveal({ total: steps.length, stepMs: 900, paused, skip, onDone: onComplete });
  return (
    <View style={styles.center}>
      <NarrationBubble variant="explanation" title="Worked example">
        <Text style={styles.bubbleText}>Follow along 👇</Text>
      </NarrationBubble>
      {steps.map((s, i) => (i < visible ? (
        <Appear key={i} from="up" style={styles.exStepWrap}>
          {i > 0 && <Text style={styles.exArrow}>↓</Text>}
          <View style={styles.exStep}>
            <Text style={styles.exStepLabel}>STEP {i + 1}</Text>
            <Text style={styles.exStepTxt}>{s}</Text>
          </View>
        </Appear>
      ) : null))}
    </View>
  );
}

function QuizScene({ scene, skip, onComplete }) {
  const doneRef = useRef(false);
  useEffect(() => {
    const id = setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onComplete && onComplete(); } }, skip ? 0 : 600);
    return () => clearTimeout(id);
  }, [skip, onComplete]);
  return (
    <View style={styles.center}>
      <NarrationBubble variant="hint" title="Quick check">
        <Text style={styles.bubbleText}>{scene.question}</Text>
      </NarrationBubble>
      <Appear from="scale" duration={440} style={styles.quizBadge}>
        <Text style={styles.quizBadgeTxt}>🎉 You reached the end of the lesson!</Text>
      </Appear>
    </View>
  );
}

function SceneRenderer({ scene, paused, skip, onComplete }) {
  const props = { scene, paused, skip, onComplete };
  switch (scene.type) {
    case 'steps': return <StepsScene {...props} />;
    case 'formula': return <FormulaScene {...props} />;
    case 'diagram': return <DiagramScene {...props} />;
    case 'example': return <ExampleScene {...props} />;
    case 'quiz': return <QuizScene {...props} />;
    case 'explanation':
    default: return <ExplanationScene {...props} />;
  }
}

// ── The player (timeline engine + controls) ───────────────────────────────────

export default function TeachingPlayer({ scenes = [], title, confidence }) {
  const total = scenes.length;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [done, setDone] = useState(false);
  const [skip, setSkip] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [runKey, setRunKey] = useState(0);

  const atEnd = index >= total - 1;

  const goNext = useCallback(() => {
    setErasing(true);
    setTimeout(() => {
      setIndex((i) => Math.min(total - 1, i + 1));
      setDone(false); setSkip(false); setErasing(false);
    }, WIPE_MS);
  }, [total]);

  // Auto-advance once a scene finishes (unless paused / at the end).
  useEffect(() => {
    if (done && playing && !atEnd && !erasing) {
      const id = setTimeout(goNext, GAP_MS);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [done, playing, atEnd, erasing, goNext]);

  const onNext = () => {
    if (!done) { setSkip(true); return; } // first tap finishes the current scene
    if (!atEnd) goNext();
  };
  const onReplay = () => {
    setIndex(0); setDone(false); setSkip(false); setErasing(false); setPlaying(true);
    setRunKey((k) => k + 1);
  };
  const togglePlay = () => setPlaying((p) => !p);

  if (!total) return null;
  const scene = scenes[index];

  return (
    <Appear from="up" style={styles.player}>
      <View style={styles.header}>
        <Text style={styles.kicker}>🎬 LIVE LESSON</Text>
        {typeof confidence === 'number' && (
          <View style={styles.confPill}><Text style={styles.confTxt}>{Math.round(confidence * 100)}% match</Text></View>
        )}
      </View>
      {!!title && <Text style={styles.lessonTitle}>{title}</Text>}

      <View style={styles.stage}>
        {erasing ? (
          <WhiteboardCanvas height={230} erasing />
        ) : (
          <ScrollView
            key={`${runKey}-${index}`}
            style={styles.stageScroll}
            contentContainerStyle={styles.stageInner}
            showsVerticalScrollIndicator={false}
          >
            <SceneRenderer scene={scene} paused={!playing} skip={skip} onComplete={() => setDone(true)} />
          </ScrollView>
        )}
      </View>

      {/* scene progress dots */}
      <View style={styles.dots}>
        {scenes.map((s, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotOn, i < index && styles.dotDone]} />
        ))}
      </View>

      {/* playback controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={onReplay} activeOpacity={0.85}>
          <Text style={styles.ctrlTxt}>↺ Replay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlBtn, styles.ctrlPrimary]} onPress={togglePlay} activeOpacity={0.85}>
          <Text style={[styles.ctrlTxt, styles.ctrlPrimaryTxt]}>{playing ? '⏸ Pause' : '▶ Resume'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ctrlBtn, atEnd && done && styles.ctrlDisabled]}
          onPress={onNext}
          disabled={atEnd && done}
          activeOpacity={0.85}
        >
          <Text style={styles.ctrlTxt}>{done ? (atEnd ? 'Done' : 'Next ›') : 'Skip ›'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.counter}>Scene {index + 1} of {total}</Text>
    </Appear>
  );
}

const styles = StyleSheet.create({
  player: {
    marginTop: 24,
    backgroundColor: BOARD.stage,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: BOARD.cardBorder,
    padding: 16,
    shadowColor: BOARD.glow, shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: 12, fontWeight: '900', color: BOARD.orange, letterSpacing: 1 },
  confPill: { backgroundColor: 'rgba(123,224,164,0.15)', borderRadius: 12, paddingVertical: 3, paddingHorizontal: 9 },
  confTxt: { fontSize: 11, fontWeight: '800', color: BOARD.green },
  lessonTitle: { fontSize: 20, fontWeight: '900', color: BOARD.textBright, letterSpacing: -0.4, marginTop: 8 },

  stage: { marginTop: 14, minHeight: 300, maxHeight: 460, backgroundColor: BOARD.bg, borderRadius: 16, borderWidth: 1, borderColor: BOARD.frame, overflow: 'hidden' },
  stageScroll: { flexGrow: 0 },
  stageInner: { padding: 14, paddingBottom: 20 },
  center: { width: '100%' },

  sceneTitle: { fontSize: 17, fontWeight: '900', color: BOARD.yellow, marginBottom: 10, letterSpacing: -0.3 },

  // bubbles
  bubble: { borderRadius: 16, borderWidth: 1.5, padding: 14, marginTop: 10, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  bubbleHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  bubbleEmoji: { fontSize: 16 },
  bubbleLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  bubbleText: { fontSize: 16, fontWeight: '600', color: BOARD.textBright, lineHeight: 24 },
  caret: { color: BOARD.orange, fontWeight: '900' },

  // steps
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12, backgroundColor: BOARD.card, borderRadius: 14, borderWidth: 1, borderColor: BOARD.cardBorder, padding: 12 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: BOARD.orange, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumTxt: { fontSize: 12, fontWeight: '900', color: '#1C1C1E' },
  stepTxt: { flex: 1, fontSize: 15, fontWeight: '600', color: BOARD.textBright, lineHeight: 22 },

  // formula
  formulaStack: { marginTop: 16, alignItems: 'center' },
  formulaRow: { alignItems: 'center' },
  formulaArrow: { fontSize: 20, fontWeight: '900', color: BOARD.textDim, marginVertical: 4 },
  formulaChip: { backgroundColor: BOARD.card, borderWidth: 1.5, borderColor: BOARD.orange, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 22 },
  formulaText: { fontSize: 24, fontWeight: '900', color: BOARD.textBright, letterSpacing: 1 },

  // diagram
  diagramWrap: { marginTop: 14 },

  // example
  exStepWrap: { alignItems: 'center', marginTop: 8 },
  exArrow: { fontSize: 18, fontWeight: '900', color: BOARD.textDim, marginVertical: 2 },
  exStep: { width: '100%', backgroundColor: BOARD.card, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: BOARD.blue, padding: 14 },
  exStepLabel: { fontSize: 10, fontWeight: '900', color: BOARD.blue, letterSpacing: 1, marginBottom: 4 },
  exStepTxt: { fontSize: 15, fontWeight: '600', color: BOARD.textBright, lineHeight: 22 },

  // quiz
  quizBadge: { marginTop: 16, alignSelf: 'center', backgroundColor: 'rgba(255,138,61,0.16)', borderWidth: 1.5, borderColor: BOARD.orange, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 18 },
  quizBadgeTxt: { fontSize: 14, fontWeight: '800', color: BOARD.orange, textAlign: 'center' },

  // dots + controls
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(44,48,67,0.16)' },
  dotOn: { width: 20, backgroundColor: BOARD.orange },
  dotDone: { backgroundColor: BOARD.green },

  controls: { flexDirection: 'row', gap: 8, marginTop: 14 },
  ctrlBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 13, backgroundColor: BOARD.card, borderWidth: 1.5, borderColor: BOARD.cardBorder },
  ctrlPrimary: { backgroundColor: BOARD.orange, borderColor: BOARD.orange },
  ctrlDisabled: { opacity: 0.4 },
  ctrlTxt: { fontSize: 13, fontWeight: '900', color: BOARD.textBright },
  ctrlPrimaryTxt: { color: '#1C1C1E' },
  counter: { textAlign: 'center', fontSize: 11, fontWeight: '700', color: BOARD.textDim, marginTop: 10 },
});
