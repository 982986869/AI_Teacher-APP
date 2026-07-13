import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Easing, Dimensions, Platform, TextInput,
} from 'react-native';
import LessonBoard from './LessonBoards';
import TeacherAvatar from './TeacherAvatar';
import TeacherFullBody from './TeacherFullBody';
import { TEACHER_PHOTO as TEACHER_HERO_PHOTO, TEACHER_VIDEO as TEACHER_HERO_VIDEO, TEACHER_HEADSHOT } from './teacherIdentity';
import VoicePicker from './VoicePicker';
import { directLesson } from './teachingDirector';
import { focusTarget } from './cameraDirector';
import { freshLearner, observe, assess } from './emotionEngine';
import { C, D, F, SP, GLASS, GRAD, R } from './premiumTheme';
import { PressableScale, Gradient } from './uiKit';
import BoardSurface, { surfaceFor } from './boardSurfaces';
import { EraserWipe } from './boardGestures';
import { AmbientStage, VoiceAura } from './ambientStage';
import { expressionForScene, praiseLine, reassureLine, listeningLine, completeLine } from './teacherPersona';
import { speakTeacher, stopTeacher, primeTeacherVoice, getSpeechProgress, SPEECH_OK, speakTeacherQueued, resetTeacherQueue, isTeacherQueueActive } from '../../utils/teacherVoice';

// Optional student camera — degrades to a friendly placeholder.
let ExpoCamera = null;
try { ExpoCamera = require('expo-camera'); } catch (e) { ExpoCamera = null; }
const CAMERA_OK = !!(ExpoCamera && ExpoCamera.CameraView && ExpoCamera.useCameraPermissions);

// Optional voice input (needs expo-speech-recognition dev build).
let SpeechRec = null;
try { SpeechRec = require('expo-speech-recognition'); } catch (e) { SpeechRec = null; }
const VOICE_OK = !!(SpeechRec && SpeechRec.ExpoSpeechRecognitionModule && SpeechRec.useSpeechRecognitionEvent);

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// Circular illustrated teacher avatar: large & centred when she's just talking;
// small in the top-right corner once a slide / whiteboard is on screen.
const AV_HERO = Math.round(Math.min(176, SCREEN_W * 0.46, SCREEN_H * 0.23));
const AV_CORNER = Math.round(Math.min(90, SCREEN_W * 0.24));
// She stays present (not a corner chip) while a board is on screen — a confident
// mid size that keeps her the anchor of the scene without crowding her workspace.
const AV_STAGE = Math.round(Math.min(124, SCREEN_W * 0.34, SCREEN_H * 0.16));
// Student camera — rounded rectangle.
const CAM_W = Math.round(Math.min(150, SCREEN_W * 0.4));
const CAM_H = Math.round(CAM_W * 0.76);

// ── THE INSTRUCTOR — illustrated circular avatar (blinks + lip-syncs) ──────────
// To use a real talking face, drop a short muted looping clip / photo here:
const TEACHER_VIDEO = null;
const TEACHER_PHOTO = null;

// ── Single teaching state machine — only ONE mode is ever active ───────────────
const M = {
  TEACHING: 'TEACHING',     // a scene is being explained (TTS = the clock)
  PAUSED: 'PAUSED',         // frozen by the student
  LISTENING: 'LISTENING',   // capturing the student's question
  THINKING: 'THINKING',     // waiting for the answer
  ANSWERING: 'ANSWERING',   // speaking the answer to a doubt
  COMPLETED: 'COMPLETED',   // lesson finished
};

// ── warm peach background ─────────────────────────────────────────────────────
const WarmGradient = () => (
  <View style={StyleSheet.absoluteFill}>
    {C.peachBands.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
  </View>
);
const BottomScrim = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={{ flex: 1 }} />
    <View style={{ height: '55%' }}>
      {C.scrim.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
    </View>
  </View>
);

function Appear({ children, style, from = 'up', delay = 0 }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(a, { toValue: 1, duration: 460, delay, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [a, delay]);
  const tf = from === 'scale'
    ? [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }]
    : [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }];
  return <Animated.View style={[style, { opacity: a, transform: tf }]}>{children}</Animated.View>;
}

// ── scene "camera settle": on every scene change the board slides in from the
// right and gently pushes in (a soft camera move), then settles. Keyed by sceneKey
// in the render, so it re-mounts (and re-animates) per scene.
function Stage({ children, style }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    a.setValue(0);
    const anim = Animated.timing(a, { toValue: 1, duration: 540, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [a]);
  return (
    <Animated.View style={[style, {
      opacity: a,
      transform: [
        { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
        { scale: a.interpolate({ inputRange: [0, 1], outputRange: [1.028, 1] }) },
      ],
    }]}>{children}</Animated.View>
  );
}

// a marker-style underline that "draws" under the slide title (board feel)
function Underline() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    a.setValue(0);
    const anim = Animated.timing(a, { toValue: 1, duration: 520, delay: 180, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    anim.start();
    return () => anim.stop();
  }, [a]);
  return <Animated.View style={{ height: 3, borderRadius: 2, backgroundColor: C.accent, marginTop: 7, width: a.interpolate({ inputRange: [0, 1], outputRange: ['0%', '34%'] }) }} />;
}

// ── speaking waveform (purple/blue audio bars) shown ABOVE the teacher ────────
// Kept light (fewer bars) so it never janks on mid-range phones.
const WAVE_N = 14;
function Waveform({ active }) {
  const vals = useRef(Array.from({ length: WAVE_N }, () => new Animated.Value(0.22))).current;
  useEffect(() => {
    let loops = [];
    if (active) {
      loops = vals.map((v, i) => Animated.loop(Animated.sequence([
        Animated.delay(i * 55),
        Animated.timing(v, { toValue: 1, duration: 280 + (i % 5) * 60, useNativeDriver: false }),
        Animated.timing(v, { toValue: 0.2, duration: 260 + (i % 4) * 60, useNativeDriver: false }),
      ])));
      loops.forEach((l) => l.start());
    } else {
      vals.forEach((v) => v.setValue(0.22));
    }
    return () => loops.forEach((l) => l.stop());
  }, [active, vals]);
  return (
    <View style={st.wave} pointerEvents="none">
      {vals.map((v, i) => {
        const edge = 1 - Math.abs(i - (WAVE_N - 1) / 2) / ((WAVE_N - 1) / 2);
        const max = 12 + edge * 26;
        return (
          <Animated.View key={i} style={[st.waveBar, {
            height: v.interpolate({ inputRange: [0, 1], outputRange: [4, max] }),
            backgroundColor: i % 2 ? C.blue : C.accent,
            opacity: active ? 0.9 : 0.3,
          }]} />
        );
      })}
    </View>
  );
}

// ── floating corner teacher — circular avatar that slides in to the top-right ──
// `cam` is the Camera Director's rack-focus (0 teacher · 1 board): she grows and
// brightens when the shot is on HER, and eases back a touch when it's on the board.
function CornerTeacher({ state, expression, cam }) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.spring(enter, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [enter]);
  const camScale = cam ? cam.interpolate({ inputRange: [0, 1], outputRange: [1.14, 0.9] }) : 1;
  const camOpacity = cam ? cam.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }) : 1;
  return (
    <Animated.View pointerEvents="none" style={[st.cornerWrap, {
      opacity: enter,
      transform: [
        { translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
        { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }) },
      ],
    }]}>
      <Animated.View style={{ opacity: camOpacity, transform: [{ scale: camScale }] }}>
        <TeacherAvatar theme="dark" video={TEACHER_VIDEO} photo={TEACHER_HEADSHOT} state={state} expression={expression} size={AV_CORNER} />
      </Animated.View>
    </Animated.View>
  );
}

// ── caption: karaoke-style — every word starts dim and brightens exactly as the
// teacher speaks it. Sync comes from the real audio position (getSpeechProgress),
// so the highlight never races ahead of her voice. Freezes when she's not
// speaking (paused) and resets per line (resetKey). Light on the JS thread: it
// only re-renders when the bright-word count actually changes.
function SpokenCaption({ text, speaking, karaoke, resetKey, style }) {
  const words = useMemo(() => String(text || '').split(/\s+/).filter(Boolean), [text]);
  const [spoken, setSpoken] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const speakingRef = useRef(speaking);
  useEffect(() => { speakingRef.current = speaking; }, [speaking]);

  useEffect(() => {
    setSpoken(0);
    fade.setValue(0);
    const anim = Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true });
    anim.start();
    if (!words.length || !karaoke) return () => anim.stop(); // no audio → all words bright
    const id = setInterval(() => {
      if (!speakingRef.current) return; // freeze while paused / not speaking
      const n = Math.min(words.length, Math.round(getSpeechProgress() * words.length));
      setSpoken((prev) => (n > prev ? n : prev)); // monotonic within a line
    }, 90);
    return () => { anim.stop(); clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, words, karaoke]);

  // karaoke off (muted / no audio) → every word bright; otherwise dim the unspoken.
  const brightUpto = karaoke ? spoken : words.length;
  return (
    <Animated.Text style={[style, { opacity: fade }]}>
      {words.map((w, i) => (
        <Text key={i} style={i >= brightUpto ? st.capDim : null}>{w}{i < words.length - 1 ? ' ' : ''}</Text>
      ))}
    </Animated.Text>
  );
}

// ── student camera (small rounded-rect PiP, purple frame) ────────────────────
function CamInner() {
  const [perm, requestPerm] = ExpoCamera.useCameraPermissions();
  useEffect(() => { if (perm && !perm.granted && perm.canAskAgain !== false) requestPerm(); }, [perm]); // eslint-disable-line
  if (!perm || !perm.granted) return <View style={st.camFill}><Text style={{ fontSize: 26 }}>🧑‍🎓</Text></View>;
  const CameraView = ExpoCamera.CameraView;
  return <CameraView style={{ width: '100%', height: '100%' }} facing="front" />;
}
const StudentCircle = React.memo(function StudentCircle({ active }) {
  return (
    <View style={st.camWrap}>
      <View style={[st.camFrame, active && st.camFrameOn]}>
        <View style={st.camMask}>{CAMERA_OK ? <CamInner /> : <View style={st.camFill}><Text style={{ fontSize: 26 }}>🧑‍🎓</Text></View>}</View>
      </View>
      <Text style={[st.camLbl, active && st.camLblOn]}>{active ? 'Listening' : 'You'}</Text>
    </View>
  );
});

// ── voice mic — encapsulates recognition; calls back into the state machine ───
function VoiceMic({ onStart, onPartial, onFinal, onEnd, onError, dock }) {
  const { useSpeechRecognitionEvent, ExpoSpeechRecognitionModule } = SpeechRec;
  const [busy, setBusy] = useState(false);
  useSpeechRecognitionEvent('result', (e) => {
    const t = (e && e.results && e.results[0] && e.results[0].transcript) || '';
    if (t) onPartial && onPartial(t);
    if (e && e.isFinal && t) { setBusy(false); onFinal && onFinal(t); }
  });
  useSpeechRecognitionEvent('end', () => { setBusy(false); onEnd && onEnd(); });
  useSpeechRecognitionEvent('error', () => { setBusy(false); onError && onError('Voice could not start — type instead.'); });
  const toggle = async () => {
    if (busy) { try { ExpoSpeechRecognitionModule.stop(); } catch (e) { /* no-op */ } setBusy(false); return; }
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm || !perm.granted) { onError && onError('Allow microphone to speak.'); return; }
      ExpoSpeechRecognitionModule.start({ lang: 'en-IN', interimResults: true, continuous: false });
      setBusy(true); onStart && onStart();
    } catch (e) { setBusy(false); onError && onError('Type your question for now.'); }
  };
  // The primary conversational action — talk to her.
  return (
    <PressableScale onPress={toggle} style={st.dItem} scaleTo={0.9} accessibilityLabel={busy ? 'Stop listening' : 'Ask the teacher a question'}>
      {busy
        ? <View style={[st.dMic, st.dMicOn]}><Text style={st.dMicIcon}>■</Text></View>
        : <Gradient colors={GRAD.violet} style={st.dMic}><Text style={st.dMicIcon}>🎤</Text></Gradient>}
      <Text style={[st.dLbl, st.dLblPrimary]}>{busy ? 'Stop' : 'Ask'}</Text>
    </PressableScale>
  );
}

// Pull the retrieval signals the agent already returns (concept, prerequisites,
// confidence tier, grounding source) off a doubt response. Returns null when the
// handler resolved to a plain string (older call shape) or nothing useful.
function extractMeta(res) {
  if (!res || typeof res !== 'object') return null;
  const concept = res.concept && res.concept.name ? res.concept.name : null;
  const prereqs = Array.isArray(res.prereqConcepts) ? res.prereqConcepts.filter(Boolean) : [];
  const tier = res.confidenceTier || null;
  const grounded = typeof res.grounded === 'boolean' ? res.grounded : null;
  if (!concept && !prereqs.length && !tier && grounded == null) return null;
  return { concept, prereqs, tier, grounded };
}

const TIER_LABEL = { high: 'High match', medium: 'Fair match', low: 'Low match' };

// Compact strip shown under a doubt answer: where the answer came from (your
// material vs general knowledge), how strong the match was, the resolved concept,
// and the prerequisite concepts it builds on — all already computed server-side.
function DoubtMeta({ meta }) {
  if (!meta) return null;
  const { concept, prereqs, tier, grounded } = meta;
  const tierColor = tier === 'high' ? C.green : tier === 'medium' ? C.orange : C.dim;
  return (
    <View style={st.metaWrap}>
      <View style={st.metaRow}>
        {grounded != null && (
          <View style={[st.metaPill, grounded ? st.metaPillOn : null]}>
            <Text style={[st.metaPillTxt, grounded ? st.metaPillTxtOn : null]}>
              {grounded ? '📘 From your material' : '🌐 General knowledge'}
            </Text>
          </View>
        )}
        {!!tier && (
          <View style={[st.metaPill, { borderColor: tierColor }]}>
            <View style={[st.metaDot, { backgroundColor: tierColor }]} />
            <Text style={[st.metaPillTxt, { color: tierColor }]}>{TIER_LABEL[tier] || tier}</Text>
          </View>
        )}
      </View>
      {!!concept && (
        <Text style={st.metaConcept} numberOfLines={1}>Concept · <Text style={st.metaConceptName}>{concept}</Text></Text>
      )}
      {prereqs.length > 0 && (
        <View style={st.metaPrereqRow}>
          <Text style={st.metaPrereqLbl}>Builds on</Text>
          {prereqs.slice(0, 4).map((p) => (
            <View key={p} style={st.metaChip}><Text style={st.metaChipTxt}>{p}</Text></View>
          ))}
        </View>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function LiveTeachingPlayer({ lesson, subject, ttsOk = true, startIndex = 0, onProgress, onAsk, onAskStream, onExit, onNewLesson }) {
  // The Teaching Director choreographs the lesson into scenes-of-beats. The player
  // just executes that timeline (speak this line ↔ draw this board step ↔ this face).
  const scenes = useMemo(() => directLesson(lesson || {}), [lesson]);
  const N = scenes.length;

  const [mode, setMode] = useState(M.TEACHING);
  // Resume at the saved position (clamped), else start at the beginning.
  const [idx, setIdx] = useState(() => Math.min(Math.max(0, Math.floor(Number(startIndex)) || 0), Math.max(0, N - 1)));
  const [beat, setBeat] = useState(0);   // which directed beat within the current scene
  const [animKey, setAnimKey] = useState(0);
  const [muted, setMuted] = useState(false);
  const [ttsActive, setTtsActive] = useState(false); // is audio playing right now (avatar/sync)
  const [qa, setQa] = useState(null);                // { q, a } during a doubt
  const [qaMeta, setQaMeta] = useState(null);        // retrieval signals for the doubt answer
  const [partial, setPartial] = useState('');
  const [qInput, setQInput] = useState('');
  const [doubtDone, setDoubtDone] = useState(false); // answer fully spoken
  const [hint, setHint] = useState('');
  const [voiceOpen, setVoiceOpen] = useState(false); // voice-picker sheet
  const [reactExpr, setReactExpr] = useState(null);  // transient face after a quick-check (celebrate / encouraging)
  const [gestureExpr, setGestureExpr] = useState(null); // transient 'pointing' lead — she points at the board a beat before she speaks
  const [quizFb, setQuizFb] = useState(null);        // { correct, line } — the human line for the last quick-check
  const [doneMsg, setDoneMsg] = useState('');        // varied wrap-up line (never the same twice running)
  const [listenPrompt, setListenPrompt] = useState('I’m listening…');
  // streaks drive her TONE: a run of right answers ramps up praise; a repeated
  // miss slows her down and softens her. Refs (not state) — read inside handlers.
  const rightStreakRef = useRef(0);
  const wrongStreakRef = useRef(0);
  const reactTimerRef = useRef(null);
  // The Emotion engine's learner model + the pace multiplier it produces. Both are
  // refs (read inside the beat timer), so adapting the pace never forces a re-render.
  const learnerRef = useRef(freshLearner());
  const paceMultRef = useRef(1);
  const feelLearner = (event) => { learnerRef.current = observe(learnerRef.current, event); paceMultRef.current = assess(learnerRef.current).paceMult; };
  // The Camera Director's rack-focus: 0 = teacher, 1 = board, 0.5 = wide. One
  // Animated scalar drives both the board's push-in and the teacher's size.
  const cam = useRef(new Animated.Value(0.5)).current;
  // A gentle "lean-in" on equation/diagram beats — the shot pushes toward the line
  // being built, then eases back, so the camera never sits statically on the board.
  const focusZoom = useRef(new Animated.Value(1)).current;

  const scene = scenes[idx] || { boardType: 'concept', title: '', kicker: '', teacherLine: '', subtitleChunks: [], formulaParts: [], beats: [] };
  const beats = scene.beats && scene.beats.length ? scene.beats : [{ say: scene.teacherLine || '', boardStep: null, expression: null, interaction: null, hold: 1400, pause: 600 }];
  const curBeat = beats[Math.min(beat, beats.length - 1)] || beats[0];
  // Remember the last line she actually spoke, so a wordless reveal beat can keep
  // it on the caption instead of flashing empty.
  const lastSayRef = useRef('');
  useEffect(() => { if (curBeat && curBeat.say) lastSayRef.current = curBeat.say; }, [curBeat && curBeat.say]);
  // Rack focus: smoothly move the camera to this beat's target. During a doubt she
  // faces you (near-teacher focus). Native driver → 60fps, ~free.
  useEffect(() => {
    const target = mode === M.TEACHING ? focusTarget(curBeat && curBeat.camera) : 0.12;
    const a = Animated.timing(cam, { toValue: target, duration: 720, easing: Easing.bezier(0.33, 0, 0.2, 1), useNativeDriver: true });
    a.start();
    return () => a.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, idx, beat, animKey]);

  // ── Equation/diagram focus-zoom: on each beat of a board that BUILDS (formulas,
  // proofs, graphs, charts), the shot leans in a touch as the new line lands, then
  // settles — the auto-zoom-to-the-equation-and-return feel, never a static frame.
  const ZOOM_BOARDS = ['formula', 'proof', 'chart', 'graphFn', 'numberLine', 'triangle'];
  useEffect(() => {
    if (mode !== M.TEACHING || !ZOOM_BOARDS.includes(scene.boardType)) { focusZoom.setValue(1); return undefined; }
    const a = Animated.sequence([
      Animated.timing(focusZoom, { toValue: 1.05, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(focusZoom, { toValue: 1.0, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]);
    a.start();
    return () => a.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, idx, beat, animKey]);

  // ── POINT-BEFORE-SPEAKING: at the top of each beat she turns to the board and
  // points at what's coming (the board step + pointer have just moved there, and
  // the TTS engine has a beat of start-up latency), then hands off to her speaking
  // face. Pure gaze/gesture — it never changes when the audio actually starts.
  useEffect(() => {
    if (mode !== M.TEACHING || scene.boardType === 'intro') { setGestureExpr(null); return undefined; }
    setGestureExpr('pointing');
    const t = setTimeout(() => setGestureExpr(null), 620);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, idx, beat, animKey]);

  const voiceOn = ttsOk && SPEECH_OK && !muted;
  const teaching = mode === M.TEACHING;
  const inDoubt = mode === M.LISTENING || mode === M.THINKING || mode === M.ANSWERING;

  // Latest-value refs: the speech-recognition callbacks live in a long-mounted
  // VoiceMic, so reading these from a render closure could be stale. Refs keep the
  // doubt grounded on the CURRENT scene + current mute state.
  const askPosRef = useRef(0);
  askPosRef.current = scene.slideIndex != null ? scene.slideIndex : idx;
  const voiceOnRef = useRef(voiceOn);
  voiceOnRef.current = voiceOn;
  // The doubt-completion poller (interval) — kept in a ref so it's always cleared
  // on unmount / new doubt, never leaking or firing setState after unmount.
  const doubtTickRef = useRef(null);
  const mountedRef = useRef(true);
  const clearDoubtTick = () => { if (doubtTickRef.current) { clearInterval(doubtTickRef.current); doubtTickRef.current = null; } };

  useEffect(() => { primeTeacherVoice(); }, []);
  // Re-arm on mount — the cleanup below also runs on Fast Refresh / StrictMode, and
  // refs survive it, so a setup that only clears the flag would leave it false and
  // silently drop every doubt answer.
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; clearDoubtTick(); if (reactTimerRef.current) clearTimeout(reactTimerRef.current); stopTeacher(); };
  }, []);

  // Pick a fresh wrap-up line the moment the lesson finishes / open the mic —
  // so the two lines the student hears most often never sound rehearsed.
  useEffect(() => { if (mode === M.COMPLETED) setDoneMsg(completeLine()); }, [mode]);
  useEffect(() => { if (mode === M.LISTENING) setListenPrompt(listeningLine()); }, [mode]);

  // Show a transient expression (celebrate / encouraging / surprise) for a beat,
  // then let her settle back to the scene's natural face.
  const reactWith = (expr, ms = 2600) => {
    setReactExpr(expr);
    if (reactTimerRef.current) clearTimeout(reactTimerRef.current);
    reactTimerRef.current = setTimeout(() => { if (mountedRef.current) setReactExpr(null); }, ms);
  };

  // The student just answered a quick-check. React like a human tutor: a genuine
  // beat of delight when they're right (ramping with a streak), warm reassurance
  // when they're not — and a gentler, slower register if they miss it twice.
  const handleQuizResult = (correct) => {
    const firstTry = wrongStreakRef.current === 0;
    let line;
    if (correct) {
      wrongStreakRef.current = 0;
      rightStreakRef.current += 1;
      feelLearner(firstTry ? 'correctFirstTry' : 'correct');
      line = praiseLine(rightStreakRef.current);
      reactWith('celebrate', 2800);
    } else {
      rightStreakRef.current = 0;
      wrongStreakRef.current += 1;
      feelLearner('miss');
      line = reassureLine(wrongStreakRef.current);
      reactWith('encouraging', 3200);
    }
    setQuizFb({ correct, line });
    // Speak it in her own voice (same engine as the lesson) so the reaction is
    // heard, not just read — only when narration is on and nothing else is talking.
    if (voiceOn) {
      speakTeacher(line, {
        onStart: () => setTtsActive(true),
        onDone: () => setTtsActive(false),
        onStopped: () => setTtsActive(false),
        onError: () => setTtsActive(false),
      });
    }
  };

  // Report the current position so the screen can persist progress + study time
  // (enables resume-to-position and the Study Insights tiles).
  useEffect(() => {
    if (onProgress) onProgress({ slideIndex: idx, total: N });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, N]);

  // ── THE BEAT EXECUTOR: the Director owns the choreography; this just plays the
  // CURRENT beat and hands off to the next. Her voice is still the clock — the
  // board is already at the beat's step (via the `step` prop), so speech and
  // drawing move together. When she's muted, each beat runs on its own timing so
  // the lesson still breathes at the same directed pace. ─────────────────────────
  useEffect(() => {
    if (mode !== M.TEACHING) return undefined;
    let cancelled = false;
    let did = false;
    const timers = [];
    const at = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
    setTtsActive(false);

    const b = beats[Math.min(beat, beats.length - 1)];
    const waiting = !!(b && b.interaction);

    // Move to the next beat, or hand off to the next scene when the beats run out.
    const advance = () => {
      if (cancelled || did || waiting) return;
      did = true;
      if (beat < beats.length - 1) { setBeat(beat + 1); return; }
      setBeat(0);
      setIdx((i) => { if (i >= N - 1) { setMode(M.COMPLETED); return i; } return i + 1; });
    };

    // A "watch out" slide earns a one-shot flash of surprise as it lands — the way
    // a tutor's brows jump before "careful, this is where people slip". Only on the
    // scene's first beat, so it doesn't re-fire every beat.
    if (scene.boardType === 'mistake' && beat === 0) reactWith('surprise', 1500);

    const line = b && b.say;
    // Adaptive pace: the Emotion engine stretches the silences for a struggling
    // student and tightens them for a fluent one. It scales the BEATS (pauses,
    // dwells) — never her speech — so words stay natural, only the room breathes
    // differently.
    const mult = paceMultRef.current || 1;
    const pauseMs = ((b && b.pause) || 0) * mult;

    if (voiceOn && line) {
      speakTeacher(line, {
        onStart: () => { if (!cancelled) setTtsActive(true); },
        onDone: () => { if (!cancelled) { setTtsActive(false); if (!waiting) at(advance, pauseMs); } },
        onStopped: () => { if (!cancelled) setTtsActive(false); },
        onError: () => { if (!cancelled) { setTtsActive(false); if (!waiting) advance(); } },
      });
      const words = String(line).split(/\s+/).filter(Boolean).length;
      // Safety net only — advance even if the engine never fires onDone.
      if (!waiting) at(advance, words * 360 + pauseMs + 6000);
      // Rest her mouth ~when the audio should have ended (some Android TTS engines
      // drop onDone), so she never lip-syncs in silence.
      at(() => { if (!cancelled) setTtsActive(false); }, Math.max(2200, words * 400 + 1200));
    } else if (!waiting) {
      // Muted, or a wordless reveal beat: dwell for the directed duration, then move on.
      const base = line
        ? Math.max(1600, String(line).split(/\s+/).filter(Boolean).length * 300)
        : (b && b.hold) || 1200;
      at(advance, base * mult + pauseMs);
    }
    return () => { cancelled = true; timers.forEach(clearTimeout); stopTeacher(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, idx, beat, animKey]);

  // ── transport ──
  const goTeach = (next) => { stopTeacher(); setQa(null); setQaMeta(null); setDoubtDone(false); setHint(''); setQuizFb(null); setReactExpr(null); setBeat(0); setIdx(next); setMode(M.TEACHING); setAnimKey((k) => k + 1); };
  const pause = () => { stopTeacher(); setTtsActive(false); setMode(M.PAUSED); };
  const resume = () => { setMode(M.TEACHING); setAnimKey((k) => k + 1); };
  const togglePlay = () => { if (teaching) pause(); else if (mode === M.PAUSED) resume(); };
  const onPrev = () => { if (idx > 0) goTeach(idx - 1); };
  const onNext = () => { if (idx < N - 1) goTeach(idx + 1); else { stopTeacher(); setMode(M.COMPLETED); } };
  const onRefresh = () => { feelLearner('replay'); setQuizFb(null); setReactExpr(null); setBeat(0); setMode(M.TEACHING); setAnimKey((k) => k + 1); }; // replaying a scene → she eases the pace
  const onReplayLesson = () => { goTeach(0); };
  // Toggling sound restarts the current scene so audio/captions stay in lock-step.
  const toggleMute = () => { setMuted((m) => !m); if (teaching) setAnimKey((k) => k + 1); };

  // ── doubt flow (lesson fully frozen the whole time) ──
  const beginListen = () => { stopTeacher(); clearDoubtTick(); setTtsActive(false); setPartial(''); setQInput(''); setQa(null); setQaMeta(null); setDoubtDone(false); setHint(''); setMode(M.LISTENING); };
  const sendDoubt = (override) => {
    const q = (typeof override === 'string' ? override : qInput).trim();
    if (!q || !onAsk) { if (!q) setMode(M.PAUSED); return; }
    feelLearner('doubt'); // asking for help eases her pace a little
    setQInput(''); setPartial(''); setHint('');
    setQa({ q, a: null }); setQaMeta(null); setDoubtDone(false); setMode(M.THINKING);
    stopTeacher(); clearDoubtTick();

    // ── STREAMING path: speak sentence-by-sentence as the answer arrives ──
    // (only when a streaming handler is provided AND voice is on).
    if (onAskStream && voiceOnRef.current) {
      resetTeacherQueue();
      let acc = '';
      let buf = '';
      setMode(M.ANSWERING); setTtsActive(true);
      const flush = (force) => {
        let m;
        // emit each completed sentence to the voice queue as soon as it's whole
        while ((m = buf.match(/[\s\S]*?[.!?\n।]/))) {
          const s = m[0]; buf = buf.slice(s.length);
          if (s.trim()) speakTeacherQueued(s.trim(), { onStart: () => setTtsActive(true) });
        }
        if (force && buf.trim()) { speakTeacherQueued(buf.trim()); buf = ''; }
      };
      onAskStream(q, askPosRef.current, {
        onDelta: (t) => { acc += t; buf += t; setQa({ q, a: acc }); flush(false); },
      })
        .then((res) => {
          if (!mountedRef.current) return;
          flush(true);
          setQa({ q, a: (res && res.answer) || acc || "Sorry, I didn't catch that. Could you ask again?" });
          setQaMeta(extractMeta(res));
          // Mark done once the queued speech actually finishes playing. Capped so a
          // stuck queue can never poll forever (force-done after ~20s).
          clearDoubtTick();
          let polls = 0;
          doubtTickRef.current = setInterval(() => {
            polls += 1;
            if (!isTeacherQueueActive() || polls > 66) {
              clearDoubtTick();
              if (mountedRef.current) { setTtsActive(false); setDoubtDone(true); }
            }
          }, 300);
        })
        .catch((e) => {
          resetTeacherQueue();
          if (!mountedRef.current) return;
          setQa({ q, a: `⚠️ ${e?.message || 'Could not get an answer.'}` });
          setTtsActive(false); setDoubtDone(true);
        });
      return;
    }

    // Never get stuck in THINKING — race the answer against a timeout so a hung
    // network falls through to the error → Resume path.
    let to;
    const timeoutP = new Promise((_, reject) => { to = setTimeout(() => reject(new Error('That took too long — please try again.')), 30000); });
    Promise.race([Promise.resolve(onAsk(q, askPosRef.current)), timeoutP])
      .then((ans) => {
        clearTimeout(to);
        if (!mountedRef.current) return;
        // onAsk may resolve to a plain string (answer) or the full agent response.
        const a = (typeof ans === 'string' ? ans : (ans && ans.answer)) || "Sorry, I didn't catch that. Could you ask again?";
        setQa({ q, a }); setQaMeta(extractMeta(ans)); setMode(M.ANSWERING);
        if (voiceOnRef.current) {
          speakTeacher(a, {
            onStart: () => setTtsActive(true),
            onDone: () => { setTtsActive(false); setDoubtDone(true); },
            onStopped: () => setTtsActive(false),
            onError: () => { setTtsActive(false); setDoubtDone(true); },
          });
        } else { setDoubtDone(true); }
      })
      .catch((e) => { clearTimeout(to); if (!mountedRef.current) return; setQa({ q, a: `⚠️ ${e?.response?.data?.error || e?.message || 'Could not get an answer.'}` }); setMode(M.ANSWERING); setDoubtDone(true); });
  };
  const resumeFromDoubt = () => { stopTeacher(); clearDoubtTick(); setQa(null); setQaMeta(null); setDoubtDone(false); setMode(M.TEACHING); setAnimKey((k) => k + 1); };

  // Re-explanation: jump back to the concept she just taught (skip quick-checks /
  // the opener) and replay it. The 'replay' signal eases her pace, so the second
  // pass is genuinely slower and warmer — the honest, no-new-content re-teach.
  const reexplain = () => {
    feelLearner('replay');
    let j = idx - 1;
    while (j > 0 && (scenes[j].boardType === 'quickCheck' || scenes[j].boardType === 'intro')) j -= 1;
    goTeach(Math.max(0, j));
  };

  // ── derived avatar state + layout ──
  const teacherState = mode === M.LISTENING ? 'listening'
    : mode === M.THINKING ? 'thinking'
    : ((mode === M.ANSWERING || mode === M.TEACHING) && ttsActive) ? 'speaking' : 'idle';
  // A transient reaction (celebrate / encouraging after a quick-check) wins;
  // otherwise the face follows the actual teaching moment — she points at a
  // diagram, writes through a formula/proof, softens on the mistake slide — so
  // her whole behavioural vocabulary is actually used, not one flat "explaining".
  // Order of precedence: a quick-check reaction wins; then the point-before-speaking
  // lead; then the teaching cycle — WHILE SPEAKING she works the board (writing /
  // pointing per scene), and in the PAUSE after a line she looks back at the student
  // ('smile') before pointing to the next beat. That gives the full human rhythm:
  // point → write/explain → pause & look at you → continue.
  const expression = reactExpr
    || (mode === M.TEACHING && gestureExpr ? gestureExpr
      : (mode === M.THINKING || mode === M.LISTENING) ? 'thinking'
      : mode === M.TEACHING
        ? (ttsActive ? ((curBeat && curBeat.expression) || expressionForScene(scene.boardType, true)) : 'smile')
      : ttsActive ? 'explaining' : 'happy');
  const stateLabel = mode === M.LISTENING ? 'listening…'
    : mode === M.THINKING ? 'thinking…'
    : ttsActive ? 'teaching…'
    : mode === M.PAUSED ? 'paused' : 'Ms. Nova';

  const hasPoints = !!(scene.diagram && (scene.diagram.points || []).length);
  const sceneHasContent = scene.boardType === 'intro' ? false
    : (scene.boardType === 'summary' || scene.boardType === 'mistake') ? hasPoints
    : true;
  const showBoard = sceneHasContent && !inDoubt; // board hides while a doubt is handled

  // Caption = the current BEAT's line (one directed line at a time — never a wall
  // of text). Wordless reveal beats keep the previous line on screen instead of
  // blanking, so the subtitle always reads as one calm sentence.
  const beatText = (curBeat && curBeat.say) || lastSayRef.current || scene.teacherLine || '';
  const captionText = qa ? (qa.a || 'Thinking…') : beatText;

  const progress = N ? (idx + 1) / N : 0;
  // Glide the progress bar between scenes instead of snapping (premium micro-motion).
  const progressA = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    const a = Animated.timing(progressA, { toValue: progress, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [progress, progressA]);
  const sceneKey = `${idx}-${animKey}`;
  const beatKey = `${idx}-${beat}-${animKey}`; // karaoke highlight resets per beat

  // The spoken caption (or the doubt Q&A) — shared by the centred hero and the
  // with-slide subtitle bar so it always reads the same. Shown whole (not
  // word-by-word) so it stays in step with her voice and never janks.
  const captionEl = (
    qa ? (
      <>
        <Text style={st.askedLabel} numberOfLines={1}>You asked · “{qa.q}”</Text>
        <SpokenCaption key={`ans-${idx}-${qa.a ? 1 : 0}`} text={captionText} speaking={ttsActive} karaoke={voiceOn} resetKey={`ans-${qa.a ? 1 : 0}`} style={st.captionTxt} />
        {doubtDone && <DoubtMeta meta={qaMeta} />}
      </>
    ) : mode === M.LISTENING ? (
      <Text style={st.captionTxt}>{listenPrompt}</Text>
    ) : (
      <SpokenCaption key={`s-${idx}-${captionText}`} text={captionText} speaking={ttsActive} karaoke={voiceOn} resetKey={`${idx}-${captionText}`} style={st.captionTxt} />
    )
  );

  // Rack-focus transforms from the one camera scalar (0 teacher · 0.5 wide · 1 board).
  // Gentle by design: a real push-in + soft dim, never enough to blur text or jump.
  const boardScale = cam.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.985, 1.0, 1.035] });
  const boardOpacity = cam.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.82, 0.94, 1.0] });

  return (
    <View style={st.container}>
      {/* dark "room lights down" classroom (D.bg) — the whiteboard is the only lit surface */}

      {/* ── HEADER (fixed) — exit · lesson title + progress · voice · mute · new lesson ── */}
      <View style={st.bar}>
        <PressableScale onPress={() => { stopTeacher(); onExit && onExit(); }} style={st.barIcon} accessibilityLabel="Exit lesson"><Text style={st.barIconTxt}>‹</Text></PressableScale>

        <View style={st.barMid}>
          <Text style={st.barTitle} numberOfLines={1}>{(lesson && lesson.lessonTitle) || subject || 'Lesson'}</Text>
          <View style={st.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ now: Math.min(idx + 1, N), min: 0, max: N }}><Animated.View style={[st.progressFill, { width: progressA.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} /></View>
          <Text style={st.counter} accessibilityLabel={`Step ${Math.min(idx + 1, N)} of ${N}`}>{Math.min(idx + 1, N)}/{N} completed</Text>
        </View>

        <View style={st.barRight}>
          <PressableScale onPress={() => { stopTeacher(); setVoiceOpen(true); }} style={st.barIcon} accessibilityLabel="Choose teacher voice"><Text style={st.barIconTxt2}>🎙</Text></PressableScale>
          <PressableScale onPress={toggleMute} style={st.barIcon} accessibilityLabel={muted ? 'Unmute narration' : 'Mute narration'}><Text style={st.barIconTxt2}>{muted ? '🔇' : '🔊'}</Text></PressableScale>
          {!!onNewLesson && <PressableScale onPress={onNewLesson} style={st.barIcon} accessibilityLabel="Start a new lesson"><Text style={st.barIconTxt2}>↺</Text></PressableScale>}
        </View>
      </View>

      <VoicePicker visible={voiceOpen} onClose={() => setVoiceOpen(false)} />

      {/* ── THE LESSON — a lit whiteboard card, then a persistent dark panel holding
          Ms. Nova + her spoken line (or the doubt Q&A). The panel is OUTSIDE the
          keyed Stage, so the avatar never remounts between scenes. */}
      <ScrollView style={st.scroll} contentContainerStyle={st.lessonScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Stage key={sceneKey} style={st.workArea}>
          {showBoard ? (
            <Animated.View style={[st.boardOuter, { transform: [{ scale: focusZoom }] }]}>
              <View style={st.lessonCard}>
                <View style={st.boardHead}>
                  {!!scene.kicker && <View style={st.boardBadge}><Text style={st.boardBadgeTxt} numberOfLines={1}>{scene.kicker}</Text></View>}
                </View>
                {!!scene.title && <Text style={st.title} numberOfLines={2}>{scene.title}</Text>}
                <LessonBoard scene={scene} paused={!teaching} skip={false} resetKey={sceneKey} step={curBeat ? curBeat.boardStep : null} onQuizContinue={onNext} onQuizResult={handleQuizResult} onReexplain={reexplain} quizFb={quizFb} />
                <EraserWipe enabled={idx > 0} />
              </View>
            </Animated.View>
          ) : (
            (!!scene.kicker || !!scene.title) && (
              <View style={st.titleOnly}>
                {!!scene.kicker && <Text style={st.kicker}>{scene.kicker}</Text>}
                {!!scene.title && <Text style={st.titleDark}>{scene.title}</Text>}
              </View>
            )
          )}
        </Stage>

        <View style={st.panel}>
          <View style={st.teacherBar}>
            <TeacherAvatar theme="dark" video={TEACHER_VIDEO} photo={TEACHER_HEADSHOT} state={teacherState} expression={expression} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={st.teacherName}>Ms. Nova</Text>
              <View style={st.statusRow}>
                <View style={[st.statusDot, ttsActive && st.statusDotOn]} />
                <Text style={st.statusTxt}>{mode === M.LISTENING ? 'Listening' : mode === M.THINKING ? 'Thinking' : ttsActive ? 'Teaching' : mode === M.PAUSED ? 'Paused' : 'Ready'}</Text>
              </View>
            </View>
            {(ttsActive || mode === M.LISTENING) && <Waveform active />}
          </View>
          <View style={st.captionWrap}>{captionEl}</View>
        </View>
      </ScrollView>

      {/* ── STATUS + CONTROL DOCK (fixed) ── */}
      <View style={st.bottom}>
        {mode === M.LISTENING && VOICE_OK && <Text style={st.listenTxt} numberOfLines={2}>{partial || 'Listening… ask your question'}</Text>}
        {mode === M.THINKING && <Text style={st.listenTxt}>Thinking…</Text>}

        {mode === M.LISTENING && !VOICE_OK && (
          <View style={st.askRow}>
            <TextInput
              style={st.askInput}
              placeholder="Type your question…"
              placeholderTextColor="rgba(44,48,67,0.45)"
              value={qInput} onChangeText={setQInput}
              onSubmitEditing={() => sendDoubt()} returnKeyType="send" autoFocus
              accessibilityLabel="Type your question for the teacher"
            />
            <PressableScale style={st.askSend} onPress={() => sendDoubt()} accessibilityLabel="Send question"><Text style={st.askSendTxt}>↑</Text></PressableScale>
          </View>
        )}

        {mode === M.ANSWERING && (
          <PressableScale style={st.resumeBtn} onPress={resumeFromDoubt} accessibilityLabel="Resume the lesson">
            <Text style={st.resumeTxt}>▶  Resume lesson</Text>
          </PressableScale>
        )}

        {!!hint && (teaching || mode === M.PAUSED) && <Text style={st.hint}>{hint}</Text>}

        {/* controls — a floating glass dock. Ask (mic) is the clear primary; the
            transport is secondary with small, quiet labels for discoverability. */}
        {mode !== M.THINKING && mode !== M.COMPLETED && (
          <View style={st.dock}>
            <PressableScale style={st.dItem} onPress={onPrev} disabled={idx === 0} accessibilityLabel="Previous step">
              <View style={st.dGhost}><Text style={[st.dGlyph, idx === 0 && st.dDim]}>⏮</Text></View>
              <Text style={st.dLbl}>Prev</Text>
            </PressableScale>
            <PressableScale style={st.dItem} onPress={togglePlay} scaleTo={0.92} accessibilityLabel={teaching ? 'Pause the lesson' : 'Play the lesson'}>
              <View style={st.dGhost}><Text style={st.dGlyph}>{teaching ? '⏸' : '▶'}</Text></View>
              <Text style={st.dLbl}>{teaching ? 'Pause' : 'Play'}</Text>
            </PressableScale>
            {!!onAsk && (VOICE_OK ? (
              <VoiceMic
                onStart={beginListen}
                onPartial={setPartial}
                onFinal={(t) => sendDoubt(t)}
                onEnd={() => setMode((m) => (m === M.LISTENING ? M.PAUSED : m))}
                onError={(m) => { setHint(typeof m === 'string' ? m : 'Type your question.'); setMode((p) => (p === M.LISTENING ? M.PAUSED : p)); }}
              />
            ) : (
              <PressableScale style={st.dItem} onPress={beginListen} scaleTo={0.9} accessibilityLabel="Ask the teacher a question">
                <Gradient colors={GRAD.violet} style={st.dMic}><Text style={st.dMicIcon}>🎤</Text></Gradient>
                <Text style={[st.dLbl, st.dLblPrimary]}>Ask</Text>
              </PressableScale>
            ))}
            <PressableScale style={st.dItem} onPress={onRefresh} accessibilityLabel="Replay this step">
              <View style={st.dGhost}><Text style={st.dGlyph}>↻</Text></View>
              <Text style={st.dLbl}>Replay</Text>
            </PressableScale>
            <PressableScale style={st.dItem} onPress={onNext} accessibilityLabel="Next step">
              <View style={st.dGhost}><Text style={st.dGlyph}>⏭</Text></View>
              <Text style={st.dLbl}>Next</Text>
            </PressableScale>
          </View>
        )}
      </View>

      {/* ── COMPLETED ── */}
      {mode === M.COMPLETED && (
        <View style={st.doneOverlay} pointerEvents="box-none">
          <Appear from="scale" style={st.doneCard}>
            <Text style={st.doneEmoji}>🎉</Text>
            <Text style={st.doneTitle}>Lesson complete</Text>
            <Text style={st.doneSub}>{doneMsg || 'Great focus today. Take it again whenever you like.'}</Text>
            <View style={st.doneRow}>
              <PressableScale style={[st.doneBtn, st.doneGhost]} onPress={() => { stopTeacher(); onExit && onExit(); }} accessibilityLabel="Finish and exit"><Text style={st.doneGhostTxt}>Done</Text></PressableScale>
              <PressableScale style={[st.doneBtn, st.donePrimary]} onPress={onReplayLesson} accessibilityLabel="Replay the lesson"><Text style={st.donePrimaryTxt}>↺ Replay</Text></PressableScale>
            </View>
            {!!onNewLesson && (
              <PressableScale onPress={onNewLesson} style={st.doneNew} accessibilityLabel="Start a new topic"><Text style={st.doneNewTxt}>Learn a new topic</Text></PressableScale>
            )}
          </Appear>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },

  // ── header (fixed): ghost circle glyphs · lesson title + hairline progress ──
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SP.md, paddingTop: SP.sm, paddingBottom: SP.xs },
  barIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: D.fill, borderWidth: 1, borderColor: D.edgeSoft },
  barIconTxt: { fontSize: 22, color: D.text, marginTop: -3 },
  barIconTxt2: { fontSize: 14, color: D.text },
  barMid: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  barRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barTitle: { fontSize: 10, fontFamily: F.bold, color: D.textDim, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 5, maxWidth: '100%' },
  progressTrack: { alignSelf: 'stretch', height: 5, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.accent, borderRadius: 8 },
  counter: { fontSize: 9.5, fontFamily: F.semi, color: D.textFaint, marginTop: 4, letterSpacing: 0.4 },

  // ── the lit whiteboard ──
  scroll: { flex: 1 },
  lessonScroll: { flexGrow: 1, paddingHorizontal: SP.md, paddingTop: SP.sm, paddingBottom: SP.md },
  workArea: { width: '100%', alignItems: 'stretch' },
  boardOuter: { width: '100%', alignItems: 'center' },
  lessonCard: {
    width: '100%', backgroundColor: C.board, borderRadius: R.xxl,
    paddingVertical: 22, paddingHorizontal: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 26, shadowOffset: { width: 0, height: 14 }, elevation: 12,
  },
  boardHead: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', minHeight: 4 },
  boardBadge: { backgroundColor: C.accentSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  boardBadgeTxt: { fontSize: 9.5, fontFamily: F.bold, color: C.accent, letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { alignSelf: 'stretch', fontSize: 19, fontFamily: F.black, color: C.ink, letterSpacing: -0.4, lineHeight: 25, marginTop: SP.sm, marginBottom: SP.md },
  // scene with no board (intro / during a doubt) — the title reads on the dark room
  titleOnly: { paddingVertical: SP.lg, paddingHorizontal: SP.xs },
  kicker: { fontSize: 10, fontFamily: F.bold, color: '#A5B4FC', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: SP.xs },
  titleDark: { fontSize: 24, fontFamily: F.black, color: D.text, letterSpacing: -0.5, lineHeight: 31 },

  // ── persistent teacher + caption panel (never remounts per scene) ──
  panel: { marginTop: SP.md, backgroundColor: D.panel, borderRadius: R.xxl, borderWidth: 1, borderColor: D.edge, padding: SP.md },
  teacherBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SP.md },
  teacherName: { fontSize: 14.5, fontFamily: F.bold, color: D.text, letterSpacing: -0.2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: D.textFaint },
  statusDotOn: { backgroundColor: C.accent },
  statusTxt: { fontSize: 9.5, fontFamily: F.semi, color: D.textDim, letterSpacing: 1.4, textTransform: 'uppercase' },

  // speaking / listening waveform (sits at the right of the teacher row)
  wave: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end', height: 26, gap: 2.5 },
  waveBar: { width: 3, borderRadius: 3 },

  captionWrap: { width: '100%' },
  captionTxt: { fontSize: 16, fontFamily: F.med, color: D.text, textAlign: 'left', lineHeight: 25, letterSpacing: 0.1 }, // PRIMARY — spoken words (bright)
  capDim: { color: 'rgba(248,250,252,0.35)' }, // not-yet-spoken words; brighten as she speaks
  askedLabel: { fontSize: 11, fontFamily: F.semi, color: D.textFaint, marginBottom: 8, letterSpacing: 0.3, fontStyle: 'italic' },

  // ── doubt metadata strip (source / confidence / concept / prerequisites) ──
  metaWrap: { marginTop: 14, gap: 8, backgroundColor: D.panel2, borderRadius: R.md, borderWidth: 1, borderColor: D.edge, padding: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: D.edge, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  metaPillOn: { backgroundColor: 'rgba(16,185,129,0.14)', borderColor: 'rgba(16,185,129,0.45)' },
  metaPillTxt: { fontSize: 10, fontFamily: F.bold, color: D.textDim, letterSpacing: 0.3 },
  metaPillTxtOn: { color: C.green },
  metaDot: { width: 6, height: 6, borderRadius: 3 },
  metaConcept: { fontSize: 12, fontFamily: F.semi, color: D.textDim },
  metaConceptName: { color: D.text, fontFamily: F.bold },
  metaPrereqRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  metaPrereqLbl: { fontSize: 9.5, fontFamily: F.bold, color: D.textFaint, letterSpacing: 0.6, textTransform: 'uppercase' },
  metaChip: { backgroundColor: 'rgba(79,70,229,0.18)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.4)', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3 },
  metaChipTxt: { fontSize: 10.5, fontFamily: F.semi, color: '#C7D2FE' },

  // floating corner teacher (kept for the corner layout)
  cornerWrap: { position: 'absolute', top: 56, right: 12, zIndex: 20 },

  // optional student camera PiP
  camWrap: { alignItems: 'center', gap: 5 },
  camFrame: { width: CAM_W, height: CAM_H, borderRadius: R.lg, borderWidth: 2, borderColor: D.edge, overflow: 'hidden', backgroundColor: D.panel2 },
  camFrameOn: { borderColor: C.pink },
  camMask: { flex: 1, borderRadius: R.md, overflow: 'hidden' },
  camFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: D.panel2 },
  camLbl: { fontSize: 10, fontFamily: F.semi, color: D.textFaint },
  camLblOn: { color: C.pink },

  // ── bottom (fixed): status → typed doubt → resume → dock ──
  bottom: { alignItems: 'center', paddingHorizontal: SP.md, paddingTop: SP.sm, paddingBottom: Platform.OS === 'ios' ? SP.lg : SP.md, gap: SP.sm },
  listenTxt: { fontSize: 13, fontFamily: F.semi, color: D.text, textAlign: 'center', paddingHorizontal: 26 },
  hint: { fontSize: 12.5, fontFamily: F.med, color: D.textDim, textAlign: 'center' },

  resumeBtn: { backgroundColor: C.accent, borderRadius: R.pill, paddingVertical: 13, paddingHorizontal: 28, shadowColor: C.accent, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  resumeTxt: { color: '#fff', fontSize: 14, fontFamily: F.bold },
  askRow: { flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'stretch' },
  askInput: { flex: 1, backgroundColor: D.panel2, borderWidth: 1, borderColor: D.edge, borderRadius: R.pill, paddingVertical: 13, paddingHorizontal: 20, color: D.text, fontSize: 14, fontFamily: F.med },
  askSend: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  askSendTxt: { color: '#fff', fontSize: 18 },

  // ── floating dock — Ask (mic) is the raised gradient primary; transport is quiet ──
  dock: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', alignSelf: 'stretch',
    backgroundColor: 'rgba(15,23,42,0.92)', borderWidth: 1, borderColor: D.edge, borderRadius: R.pill,
    paddingHorizontal: SP.sm, paddingVertical: SP.sm,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 10,
  },
  dItem: { alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 52 },
  dGhost: { width: 42, height: 42, borderRadius: 21, backgroundColor: D.fill, borderWidth: 1, borderColor: D.edgeSoft, alignItems: 'center', justifyContent: 'center' },
  dGlyph: { fontSize: 16, color: D.text },
  dMic: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', shadowColor: '#6D28D9', shadowOpacity: 0.55, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  dMicOn: { backgroundColor: C.pink, shadowColor: C.pink },
  dMicIcon: { fontSize: 22, color: '#fff' },
  dDim: { opacity: 0.28 },
  dLbl: { fontSize: 9.5, fontFamily: F.semi, color: D.textFaint, letterSpacing: 0.2, marginTop: 1 },
  dLblPrimary: { color: '#A5B4FC' },

  // ── completed ──
  doneOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,6,23,0.82)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  doneCard: { width: '100%', backgroundColor: D.panel, borderWidth: 1, borderColor: D.edge, borderRadius: R.xxl, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 40, shadowOffset: { width: 0, height: 18 }, elevation: 16 },
  doneEmoji: { fontSize: 46 },
  doneTitle: { fontSize: 22, fontFamily: F.black, color: D.text, marginTop: SP.md, letterSpacing: -0.5 },
  doneSub: { fontSize: 13.5, fontFamily: F.med, color: D.textDim, textAlign: 'center', marginTop: SP.sm, lineHeight: 20 },
  doneRow: { flexDirection: 'row', gap: 12, marginTop: SP.xl, alignSelf: 'stretch' },
  doneBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: R.md },
  donePrimary: { backgroundColor: C.accent },
  donePrimaryTxt: { color: '#fff', fontSize: 14, fontFamily: F.bold },
  doneGhost: { backgroundColor: D.fill, borderWidth: 1, borderColor: D.edge },
  doneGhostTxt: { color: D.text, fontSize: 14, fontFamily: F.semi },
  doneNew: { marginTop: SP.md, paddingVertical: SP.sm, alignSelf: 'center' },
  doneNewTxt: { fontSize: 13, fontFamily: F.semi, color: '#A5B4FC', letterSpacing: 0.2 },
});
