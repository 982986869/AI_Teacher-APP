import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing, Dimensions, Platform, TextInput,
} from 'react-native';
import LessonBoard from './LessonBoards';
import TeacherAvatar from './TeacherAvatar';
import TeacherFullBody from './TeacherFullBody';
import { TEACHER_PHOTO as TEACHER_HERO_PHOTO, TEACHER_VIDEO as TEACHER_HERO_VIDEO, TEACHER_HEADSHOT } from './teacherIdentity';
import VoicePicker from './VoicePicker';
import { directLesson } from './teachingDirector';
import { focusTarget } from './cameraDirector';
import { freshLearner, observe, assess } from './emotionEngine';
import { C } from './premiumTheme';
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
  if (!perm || !perm.granted) return <View style={st.camFill}><Text style={{ fontSize: CAM_H * 0.45 }}>🧑‍🎓</Text></View>;
  const CameraView = ExpoCamera.CameraView;
  return <CameraView style={{ width: '100%', height: '100%' }} facing="front" />;
}
const StudentCircle = React.memo(function StudentCircle({ active }) {
  return (
    <View style={[st.camFrame, active && st.camFrameOn]}>
      <View style={st.camMask}>{CAMERA_OK ? <CamInner /> : <View style={st.camFill}><Text style={{ fontSize: CAM_H * 0.45 }}>🧑‍🎓</Text></View>}</View>
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
  // Rendered as the "Ask Teacher" control inside the dock.
  return (
    <TouchableOpacity onPress={toggle} style={st.dItem} activeOpacity={0.85}>
      <View style={[st.dMic, busy && st.dMicOn]}><Text style={st.dMicIcon}>{busy ? '■' : '🎤'}</Text></View>
      <Text style={st.dLbl}>{busy ? 'Stop' : 'Ask Teacher'}</Text>
    </TouchableOpacity>
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
export default function LiveTeachingPlayer({ lesson, ttsOk = true, startIndex = 0, onProgress, onAsk, onAskStream, onExit, onNewLesson }) {
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
  useEffect(() => () => { mountedRef.current = false; clearDoubtTick(); if (reactTimerRef.current) clearTimeout(reactTimerRef.current); stopTeacher(); }, []);

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
  const expression = reactExpr
    || ((mode === M.THINKING || mode === M.LISTENING) ? 'thinking'
      : mode === M.TEACHING ? ((curBeat && curBeat.expression) || expressionForScene(scene.boardType, ttsActive))
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
      {/* ── HEADER (fixed) ── */}
      <View style={st.bar}>
        <TouchableOpacity onPress={() => { stopTeacher(); onExit && onExit(); }} style={st.barIcon} accessibilityRole="button" accessibilityLabel="Exit lesson"><Text style={st.barIconTxt}>‹</Text></TouchableOpacity>
        <View style={st.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ now: Math.min(idx + 1, N), min: 0, max: N }}><Animated.View style={[st.progressFill, { width: progressA.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} /></View>
        <Text style={st.counter} accessibilityLabel={`Slide ${Math.min(idx + 1, N)} of ${N}`}>{Math.min(idx + 1, N)}/{N}</Text>
        <TouchableOpacity onPress={() => { stopTeacher(); setVoiceOpen(true); }} style={st.barIcon} accessibilityRole="button" accessibilityLabel="Choose teacher voice"><Text style={st.barIconTxt2}>🎙</Text></TouchableOpacity>
        <TouchableOpacity onPress={toggleMute} style={st.barIcon} accessibilityRole="button" accessibilityLabel={muted ? 'Unmute narration' : 'Mute narration'}><Text style={st.barIconTxt2}>{muted ? '🔇' : '🔊'}</Text></TouchableOpacity>
        {!!onNewLesson && <TouchableOpacity onPress={onNewLesson} style={st.barIcon} accessibilityRole="button" accessibilityLabel="Start a new lesson"><Text style={st.barIconTxt2}>↺</Text></TouchableOpacity>}
      </View>

      <VoicePicker visible={voiceOpen} onClose={() => setVoiceOpen(false)} />

      {/* ── TEACHER + WHITEBOARD (scrolls) ──
          No slide → big centred teacher. Slide on → board is the focus and the
          teacher tucks into the top-right corner. */}
      <ScrollView style={st.scroll} contentContainerStyle={showBoard ? st.scrollTop : st.scrollBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {showBoard ? (
          <Stage key={sceneKey} style={st.lessonArea}>
            {/* right gutter keeps the title clear of the corner teacher */}
            <View style={st.lessonHead}>
              <Appear><Text style={st.kicker}>{scene.kicker}</Text></Appear>
              {!!scene.title && <Appear delay={50}><Text style={st.title}>{scene.title}</Text><Underline /></Appear>}
            </View>
            <Animated.View style={{ width: '100%', opacity: boardOpacity, transform: [{ scale: boardScale }] }}>
              <Appear delay={110} style={st.lessonCard}>
                <LessonBoard scene={scene} paused={!teaching} skip={false} resetKey={sceneKey} step={curBeat ? curBeat.boardStep : null} onQuizContinue={onNext} onQuizResult={handleQuizResult} onReexplain={reexplain} quizFb={quizFb} />
              </Appear>
            </Animated.View>
            <View style={st.subtitleBar}>{captionEl}</View>
          </Stage>
        ) : (
          <View style={st.banner}>
            {/* waveform above the teacher while she speaks */}
            <View style={st.waveWrap} pointerEvents="none"><Waveform active={ttsActive} /></View>
            {/* Live page → HALF avatar (head & shoulders). Landing keeps full-body. */}
            <TeacherFullBody theme="dark" photo={TEACHER_HEADSHOT} video={null} state={teacherState} height={Math.round(AV_HERO * 1.7)} />
            <View style={[st.badge, ttsActive && st.badgeOn]}>
              <View style={[st.badgeDot, ttsActive && st.badgeDotOn]} />
              <Text style={[st.badgeTxt, ttsActive && st.badgeTxtOn]}>{stateLabel}</Text>
            </View>
            <View style={st.caption}>{captionEl}</View>
          </View>
        )}
      </ScrollView>

      {/* floating corner teacher while a board is on screen */}
      {showBoard && <CornerTeacher state={teacherState} expression={expression} cam={cam} />}

      {/* ── STUDENT + STATUS + CONTROL DOCK (fixed) ── */}
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
            <TouchableOpacity style={st.askSend} onPress={() => sendDoubt()} accessibilityRole="button" accessibilityLabel="Send question"><Text style={st.askSendTxt}>↑</Text></TouchableOpacity>
          </View>
        )}

        {mode === M.ANSWERING && (
          <TouchableOpacity style={st.resumeBtn} onPress={resumeFromDoubt} activeOpacity={0.9} accessibilityRole="button" accessibilityLabel="Resume the lesson">
            <Text style={st.resumeTxt}>▶  Resume lesson</Text>
          </TouchableOpacity>
        )}

        <StudentCircle active={mode === M.LISTENING} />

        {!!hint && (teaching || mode === M.PAUSED) && <Text style={st.hint}>{hint}</Text>}

        {/* control dock — Previous · Pause · Ask Teacher · Refresh · Next */}
        {mode !== M.THINKING && mode !== M.COMPLETED && (
          <View style={st.dock}>
            <TouchableOpacity style={st.dItem} onPress={onPrev} disabled={idx === 0} activeOpacity={0.85}
              accessibilityRole="button" accessibilityLabel="Previous slide" accessibilityState={{ disabled: idx === 0 }}>
              <Text style={[st.dIcon, idx === 0 && st.dDim]}>⏮</Text><Text style={st.dLbl}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.dItem} onPress={togglePlay} activeOpacity={0.85}
              accessibilityRole="button" accessibilityLabel={teaching ? 'Pause the lesson' : 'Play the lesson'}>
              <View style={st.dPlay}><Text style={st.dPlayTxt}>{teaching ? '⏸' : '▶'}</Text></View><Text style={st.dLbl}>{teaching ? 'Pause' : 'Play'}</Text>
            </TouchableOpacity>
            {!!onAsk && (VOICE_OK ? (
              <VoiceMic
                dock
                onStart={beginListen}
                onPartial={setPartial}
                onFinal={(t) => sendDoubt(t)}
                onEnd={() => setMode((m) => (m === M.LISTENING ? M.PAUSED : m))}
                onError={(m) => { setHint(typeof m === 'string' ? m : 'Type your question.'); setMode((p) => (p === M.LISTENING ? M.PAUSED : p)); }}
              />
            ) : (
              <TouchableOpacity style={st.dItem} onPress={beginListen} activeOpacity={0.85}
                accessibilityRole="button" accessibilityLabel="Ask the teacher a question">
                <View style={st.dMic}><Text style={st.dMicIcon}>🎤</Text></View><Text style={st.dLbl}>Ask Teacher</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={st.dItem} onPress={onRefresh} activeOpacity={0.85}
              accessibilityRole="button" accessibilityLabel="Replay this slide">
              <Text style={st.dIcon}>↻</Text><Text style={st.dLbl}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.dItem} onPress={onNext} activeOpacity={0.85}
              accessibilityRole="button" accessibilityLabel="Next slide">
              <Text style={st.dIcon}>⏭</Text><Text style={st.dLbl}>Next</Text>
            </TouchableOpacity>
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
              <TouchableOpacity style={[st.doneBtn, st.doneGhost]} onPress={() => { stopTeacher(); onExit && onExit(); }} activeOpacity={0.9} accessibilityRole="button" accessibilityLabel="Finish and exit"><Text style={st.doneGhostTxt}>Done</Text></TouchableOpacity>
              <TouchableOpacity style={[st.doneBtn, st.donePrimary]} onPress={onReplayLesson} activeOpacity={0.9} accessibilityRole="button" accessibilityLabel="Replay the lesson"><Text style={st.donePrimaryTxt}>↺ Replay</Text></TouchableOpacity>
            </View>
          </Appear>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },

  // header (fixed)
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10 },
  barIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.board, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  barIconTxt: { fontSize: 20, fontWeight: '900', color: C.ink, marginTop: -2 },
  barIconTxt2: { fontSize: 15, fontWeight: '900', color: C.ink },
  progressTrack: { flex: 1, height: 4, backgroundColor: C.line, borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.accent, borderRadius: 8, shadowColor: C.accent, shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  counter: { fontSize: 11, fontWeight: '800', color: C.dim, minWidth: 30, textAlign: 'right' },

  scroll: { flex: 1 },
  // no slide → centre the big teacher; slide on screen → top-align the lesson
  scrollBody: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16 },
  scrollTop: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16 },

  // teacher banner: photo card with the waveform above it
  banner: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  waveWrap: { height: 38, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 10 },
  wave: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', height: 38, gap: 3 },
  waveBar: { width: 4, borderRadius: 3 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 6, shadowColor: '#2C3043', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  badgeOn: { backgroundColor: '#EEF1F4', borderColor: 'rgba(15,163,154,0.35)' },
  badgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.dim },
  badgeDotOn: { backgroundColor: '#0FA39A' },
  badgeTxt: { fontSize: 11.5, fontWeight: '800', color: C.dim, letterSpacing: 0.5 },
  badgeTxtOn: { color: C.ink },

  caption: { width: '100%', alignItems: 'center', paddingHorizontal: 18, marginTop: 16 },
  askedLabel: { fontSize: 11, fontWeight: '800', color: C.dim, textAlign: 'center', marginBottom: 5, maxWidth: SCREEN_W * 0.8 },

  // doubt metadata strip (concept / prerequisites / confidence / source)
  metaWrap: { marginTop: 12, alignItems: 'center', gap: 7, maxWidth: SCREEN_W * 0.86 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  metaPillOn: { backgroundColor: 'rgba(87,214,151,0.12)', borderColor: 'rgba(87,214,151,0.5)' },
  metaPillTxt: { fontSize: 10.5, fontWeight: '800', color: C.dim, letterSpacing: 0.2 },
  metaPillTxtOn: { color: C.green },
  metaDot: { width: 6, height: 6, borderRadius: 3 },
  metaConcept: { fontSize: 12, fontWeight: '700', color: C.dim, textAlign: 'center' },
  metaConceptName: { color: C.ink, fontWeight: '900' },
  metaPrereqRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6 },
  metaPrereqLbl: { fontSize: 10, fontWeight: '800', color: C.faint, letterSpacing: 0.5, textTransform: 'uppercase' },
  metaChip: { backgroundColor: 'rgba(124,58,237,0.15)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.45)', borderRadius: 11, paddingHorizontal: 9, paddingVertical: 3 },
  metaChipTxt: { fontSize: 11, fontWeight: '800', color: C.ink2 },
  captionTxt: { fontSize: 17, fontWeight: '700', color: C.ink, textAlign: 'center', lineHeight: 26, letterSpacing: 0.1 }, // PRIMARY — spoken words (bright)
  capDim: { color: 'rgba(44,48,67,0.26)' }, // not-yet-spoken words (soft ink); brighten as she speaks

  // floating corner teacher (top-right) while a board is on screen
  cornerWrap: { position: 'absolute', top: 56, right: 12, zIndex: 20 },

  // lesson: kicker + title (left, clear of the corner teacher), board, her words
  lessonArea: { width: '100%', alignItems: 'stretch', marginTop: 8 },
  lessonHead: { alignSelf: 'stretch', paddingRight: AV_CORNER + 16, minHeight: AV_CORNER - 6, justifyContent: 'center' },
  kicker: { fontSize: 11, fontWeight: '800', color: C.accent, letterSpacing: 1.4, textAlign: 'left' },
  title: { fontSize: 20.5, fontWeight: '900', color: C.ink, letterSpacing: -0.45, textAlign: 'left', marginTop: 6, lineHeight: 26 },
  lessonCard: { width: '100%', marginTop: 16, backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: 22, paddingVertical: 20, paddingHorizontal: 15, alignItems: 'center', shadowColor: '#2C3043', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  subtitleBar: { width: '100%', alignItems: 'center', marginTop: 18, paddingHorizontal: 4 },

  // bottom (fixed): status → student → dock
  bottom: { alignItems: 'center', paddingHorizontal: 18, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 12, gap: 10 },

  // student camera — small rounded-rect with a purple frame
  camFrame: { width: CAM_W, height: CAM_H, borderRadius: 16, padding: 2.5, backgroundColor: C.accent, shadowColor: C.accent, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  camFrameOn: { shadowOpacity: 0.7 },
  camMask: { flex: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: C.board, alignItems: 'center', justifyContent: 'center' },
  camFill: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: C.board },

  listenTxt: { fontSize: 13, fontWeight: '800', color: C.ink, textAlign: 'center', paddingHorizontal: 26 },
  hint: { fontSize: 13, fontWeight: '700', color: C.dim, textAlign: 'center' },

  // listening / typed-doubt / resume
  resumeBtn: { backgroundColor: C.accent, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 26, shadowColor: C.accent, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  resumeTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },
  askRow: { flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'stretch' },
  askInput: { flex: 1, backgroundColor: 'rgba(44,48,67,0.05)', borderWidth: 1, borderColor: C.line, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 18, color: C.ink, fontSize: 14, fontWeight: '600' },
  askSend: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  askSendTxt: { color: '#fff', fontSize: 18, fontWeight: '900' },

  // clean rounded control dock — Previous · Pause · Ask Teacher · Refresh · Next
  dock: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', alignSelf: 'stretch', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.line, borderRadius: 24, paddingHorizontal: 6, paddingVertical: 12, shadowColor: '#2C3043', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  dItem: { alignItems: 'center', justifyContent: 'flex-start', gap: 7, minWidth: 56 },
  dIcon: { fontSize: 20, fontWeight: '900', color: C.ink, height: 46, lineHeight: 46, textAlign: 'center' },
  dPlay: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  dPlayTxt: { fontSize: 18, color: '#fff', fontWeight: '900' },
  dMic: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(124,58,237,0.18)', borderWidth: 1.5, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  dMicOn: { backgroundColor: '#E0322E', borderColor: '#E0322E' },
  dMicIcon: { fontSize: 18, color: '#fff', fontWeight: '900' },
  dDim: { opacity: 0.3 },
  dLbl: { fontSize: 10.5, fontWeight: '700', color: C.dim },

  // completed
  doneOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  doneCard: { width: '100%', backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: 26, padding: 28, alignItems: 'center', shadowColor: '#0B0E16', shadowOpacity: 0.28, shadowRadius: 34, shadowOffset: { width: 0, height: 16 }, elevation: 16 },
  doneEmoji: { fontSize: 46 },
  doneTitle: { fontSize: 21, fontWeight: '900', color: C.ink, marginTop: 10, letterSpacing: -0.4 },
  doneSub: { fontSize: 13, fontWeight: '600', color: C.dim, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  doneRow: { flexDirection: 'row', gap: 12, marginTop: 22, alignSelf: 'stretch' },
  doneBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16 },
  donePrimary: { backgroundColor: C.accent },
  donePrimaryTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },
  doneGhost: { backgroundColor: C.board, borderWidth: 1, borderColor: C.line },
  doneGhostTxt: { color: C.ink, fontSize: 14, fontWeight: '800' },
});
