import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing, Dimensions, Platform, TextInput,
} from 'react-native';
import LessonBoard from './LessonBoards';
import TeacherAvatar from './TeacherAvatar';
import VoicePicker from './VoicePicker';
import { buildScenes } from './teachingScenes';
import { C } from './premiumTheme';
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

// How long a scene should run when there is NO voice (muted / TTS missing). Also
// used as a safety fallback so the lesson never hangs if onDone is dropped.
function holdFor(scene) {
  const words = String(scene.teacherLine || '').split(/\s+/).filter(Boolean).length;
  const wordsMs = words * 360;
  const boardMs = scene.boardType === 'proof' ? 6200
    : scene.boardType === 'triangle' ? 4200
    : scene.boardType === 'formula' ? ((scene.formulaParts || []).length * 1000 + 1200)
    : 1600;
  return Math.max(4200, Math.min(15000, Math.max(wordsMs, boardMs) + 1400));
}

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
    const anim = Animated.timing(a, { toValue: 1, duration: 380, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [a, delay]);
  const tf = from === 'scale'
    ? [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }]
    : [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }];
  return <Animated.View style={[style, { opacity: a, transform: tf }]}>{children}</Animated.View>;
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
function CornerTeacher({ state, expression }) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.spring(enter, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [enter]);
  return (
    <Animated.View pointerEvents="none" style={[st.cornerWrap, {
      opacity: enter,
      transform: [
        { translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
        { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }) },
      ],
    }]}>
      <TeacherAvatar theme="dark" video={TEACHER_VIDEO} photo={TEACHER_PHOTO} state={state} expression={expression} size={AV_CORNER} />
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
  const scenes = useMemo(() => buildScenes(lesson || {}), [lesson]);
  const N = scenes.length;

  const [mode, setMode] = useState(M.TEACHING);
  // Resume at the saved position (clamped), else start at the beginning.
  const [idx, setIdx] = useState(() => Math.min(Math.max(0, Math.floor(Number(startIndex)) || 0), Math.max(0, N - 1)));
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

  const scene = scenes[idx] || { boardType: 'concept', title: '', kicker: '', teacherLine: '', subtitleChunks: [], formulaParts: [] };
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
  useEffect(() => () => { mountedRef.current = false; clearDoubtTick(); stopTeacher(); }, []);

  // Report the current position so the screen can persist progress + study time
  // (enables resume-to-position and the Study Insights tiles).
  useEffect(() => {
    if (onProgress) onProgress({ slideIndex: idx, total: N });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, N]);

  // ── THE ONE DRIVER: while TEACHING, speech is the source of truth. Advance only
  // when TTS finishes (or, muted, after holdFor). Everything else hangs off mode. ─
  useEffect(() => {
    if (mode !== M.TEACHING) return undefined;
    let cancelled = false;
    let did = false;
    let timer;
    let mouthTimer;
    setTtsActive(false);
    const advance = () => {
      if (cancelled || did) return;
      did = true;
      setIdx((i) => {
        if (i >= N - 1) { setMode(M.COMPLETED); return i; }
        return i + 1;
      });
    };
    const line = scene.teacherLine;
    // A quick-check waits for the student to answer (the board's Continue button
    // calls onNext) — it must NOT auto-advance when the question finishes.
    const autoAdvance = scene.boardType !== 'quickCheck';
    if (voiceOn && line) {
      speakTeacher(line, {
        onStart: () => { if (!cancelled) setTtsActive(true); },
        onDone: () => { if (!cancelled) { setTtsActive(false); if (autoAdvance) advance(); } },
        onStopped: () => { if (!cancelled) setTtsActive(false); },
        onError: () => { if (!cancelled) { setTtsActive(false); if (autoAdvance) advance(); } },
      });
      if (autoAdvance) timer = setTimeout(advance, holdFor(scene) + 7000); // safety net only
      // Rest her mouth ~when the audio should have ended, even if onDone is dropped
      // (some Android TTS engines never fire it) — so she doesn't keep lip-syncing
      // in silence. The scene still advances via onDone / the safety net above.
      const words = String(line).split(/\s+/).filter(Boolean).length;
      mouthTimer = setTimeout(() => { if (!cancelled) setTtsActive(false); }, Math.max(2600, words * 400 + 1400));
    } else if (autoAdvance) {
      timer = setTimeout(advance, holdFor(scene));
    }
    return () => { cancelled = true; clearTimeout(timer); clearTimeout(mouthTimer); stopTeacher(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, idx, animKey]);

  // ── transport ──
  const goTeach = (next) => { stopTeacher(); setQa(null); setQaMeta(null); setDoubtDone(false); setHint(''); setIdx(next); setMode(M.TEACHING); setAnimKey((k) => k + 1); };
  const pause = () => { stopTeacher(); setTtsActive(false); setMode(M.PAUSED); };
  const resume = () => { setMode(M.TEACHING); setAnimKey((k) => k + 1); };
  const togglePlay = () => { if (teaching) pause(); else if (mode === M.PAUSED) resume(); };
  const onPrev = () => { if (idx > 0) goTeach(idx - 1); };
  const onNext = () => { if (idx < N - 1) goTeach(idx + 1); else { stopTeacher(); setMode(M.COMPLETED); } };
  const onRefresh = () => { setMode(M.TEACHING); setAnimKey((k) => k + 1); }; // restart this scene
  const onReplayLesson = () => { goTeach(0); };
  // Toggling sound restarts the current scene so audio/captions stay in lock-step.
  const toggleMute = () => { setMuted((m) => !m); if (teaching) setAnimKey((k) => k + 1); };

  // ── doubt flow (lesson fully frozen the whole time) ──
  const beginListen = () => { stopTeacher(); clearDoubtTick(); setTtsActive(false); setPartial(''); setQInput(''); setQa(null); setQaMeta(null); setDoubtDone(false); setHint(''); setMode(M.LISTENING); };
  const sendDoubt = (override) => {
    const q = (typeof override === 'string' ? override : qInput).trim();
    if (!q || !onAsk) { if (!q) setMode(M.PAUSED); return; }
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

  // ── derived avatar state + layout ──
  const teacherState = mode === M.LISTENING ? 'listening'
    : mode === M.THINKING ? 'thinking'
    : ((mode === M.ANSWERING || mode === M.TEACHING) && ttsActive) ? 'speaking' : 'idle';
  const expression = (mode === M.THINKING || mode === M.LISTENING) ? 'thinking'
    : (mode === M.TEACHING && scene.boardType === 'quickCheck') ? 'encouraging'
    : ttsActive ? 'explaining' : 'happy';
  const stateLabel = mode === M.LISTENING ? 'listening…'
    : mode === M.THINKING ? 'thinking…'
    : ttsActive ? 'teaching…'
    : mode === M.PAUSED ? 'paused' : 'Ms. Nova';

  const hasPoints = !!(scene.diagram && (scene.diagram.points || []).length);
  const sceneHasContent = scene.boardType === 'intro' ? false
    : (scene.boardType === 'summary' || scene.boardType === 'mistake') ? hasPoints
    : true;
  const showBoard = sceneHasContent && !inDoubt; // board hides while a doubt is handled

  // The full spoken line (or doubt answer) as a single string.
  const captionText = qa
    ? (qa.a || 'Thinking…')
    : (scene.teacherLine || (scene.subtitleChunks ? scene.subtitleChunks.join(' ') : ''));

  const progress = N ? (idx + 1) / N : 0;
  const sceneKey = `${idx}-${animKey}`;

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
      <Text style={st.captionTxt}>I’m listening…</Text>
    ) : (
      <SpokenCaption key={`s-${sceneKey}`} text={captionText} speaking={ttsActive} karaoke={voiceOn} resetKey={sceneKey} style={st.captionTxt} />
    )
  );

  return (
    <View style={st.container}>
      {/* ── HEADER (fixed) ── */}
      <View style={st.bar}>
        <TouchableOpacity onPress={() => { stopTeacher(); onExit && onExit(); }} style={st.barIcon}><Text style={st.barIconTxt}>‹</Text></TouchableOpacity>
        <View style={st.progressTrack}><View style={[st.progressFill, { width: `${progress * 100}%` }]} /></View>
        <Text style={st.counter}>{Math.min(idx + 1, N)}/{N}</Text>
        <TouchableOpacity onPress={() => { stopTeacher(); setVoiceOpen(true); }} style={st.barIcon}><Text style={st.barIconTxt2}>🎙</Text></TouchableOpacity>
        <TouchableOpacity onPress={toggleMute} style={st.barIcon}><Text style={st.barIconTxt2}>{muted ? '🔇' : '🔊'}</Text></TouchableOpacity>
        {!!onNewLesson && <TouchableOpacity onPress={onNewLesson} style={st.barIcon}><Text style={st.barIconTxt2}>↺</Text></TouchableOpacity>}
      </View>

      <VoicePicker visible={voiceOpen} onClose={() => setVoiceOpen(false)} />

      {/* ── TEACHER + WHITEBOARD (scrolls) ──
          No slide → big centred teacher. Slide on → board is the focus and the
          teacher tucks into the top-right corner. */}
      <ScrollView style={st.scroll} contentContainerStyle={showBoard ? st.scrollTop : st.scrollBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {showBoard ? (
          <View key={sceneKey} style={st.lessonArea}>
            {/* right gutter keeps the title clear of the corner teacher */}
            <View style={st.lessonHead}>
              <Appear><Text style={st.kicker}>{scene.kicker}</Text></Appear>
              {!!scene.title && <Appear delay={50}><Text style={st.title}>{scene.title}</Text></Appear>}
            </View>
            <Appear delay={110} style={st.lessonCard}>
              <LessonBoard scene={scene} paused={!teaching} skip={false} resetKey={sceneKey} onQuizContinue={onNext} />
            </Appear>
            <View style={st.subtitleBar}>{captionEl}</View>
          </View>
        ) : (
          <View style={st.banner}>
            {/* waveform above the teacher while she speaks */}
            <View style={st.waveWrap} pointerEvents="none"><Waveform active={ttsActive} /></View>
            <TeacherAvatar theme="dark" video={TEACHER_VIDEO} photo={TEACHER_PHOTO} state={teacherState} expression={expression} size={AV_HERO} />
            <View style={[st.badge, ttsActive && st.badgeOn]}>
              <View style={[st.badgeDot, ttsActive && st.badgeDotOn]} />
              <Text style={[st.badgeTxt, ttsActive && st.badgeTxtOn]}>{stateLabel}</Text>
            </View>
            <View style={st.caption}>{captionEl}</View>
          </View>
        )}
      </ScrollView>

      {/* floating corner teacher while a board is on screen */}
      {showBoard && <CornerTeacher state={teacherState} expression={expression} />}

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
            />
            <TouchableOpacity style={st.askSend} onPress={() => sendDoubt()}><Text style={st.askSendTxt}>↑</Text></TouchableOpacity>
          </View>
        )}

        {mode === M.ANSWERING && (
          <TouchableOpacity style={st.resumeBtn} onPress={resumeFromDoubt} activeOpacity={0.9}>
            <Text style={st.resumeTxt}>▶  Resume lesson</Text>
          </TouchableOpacity>
        )}

        <StudentCircle active={mode === M.LISTENING} />

        {!!hint && (teaching || mode === M.PAUSED) && <Text style={st.hint}>{hint}</Text>}

        {/* control dock — Previous · Pause · Ask Teacher · Refresh · Next */}
        {mode !== M.THINKING && mode !== M.COMPLETED && (
          <View style={st.dock}>
            <TouchableOpacity style={st.dItem} onPress={onPrev} disabled={idx === 0} activeOpacity={0.85}>
              <Text style={[st.dIcon, idx === 0 && st.dDim]}>⏮</Text><Text style={st.dLbl}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.dItem} onPress={togglePlay} activeOpacity={0.85}>
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
              <TouchableOpacity style={st.dItem} onPress={beginListen} activeOpacity={0.85}>
                <View style={st.dMic}><Text style={st.dMicIcon}>🎤</Text></View><Text style={st.dLbl}>Ask Teacher</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={st.dItem} onPress={onRefresh} activeOpacity={0.85}>
              <Text style={st.dIcon}>↻</Text><Text style={st.dLbl}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.dItem} onPress={onNext} activeOpacity={0.85}>
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
            <Text style={st.doneSub}>Great focus today. Take it again whenever you like.</Text>
            <View style={st.doneRow}>
              <TouchableOpacity style={[st.doneBtn, st.doneGhost]} onPress={() => { stopTeacher(); onExit && onExit(); }} activeOpacity={0.9}><Text style={st.doneGhostTxt}>Done</Text></TouchableOpacity>
              <TouchableOpacity style={[st.doneBtn, st.donePrimary]} onPress={onReplayLesson} activeOpacity={0.9}><Text style={st.donePrimaryTxt}>↺ Replay</Text></TouchableOpacity>
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
  progressTrack: { flex: 1, height: 5, backgroundColor: C.line, borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.accent, borderRadius: 8 },
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

  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.line, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 5 },
  badgeOn: { backgroundColor: '#EEF1F4', borderColor: 'rgba(15,163,154,0.35)' },
  badgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.dim },
  badgeDotOn: { backgroundColor: '#0FA39A' },
  badgeTxt: { fontSize: 11.5, fontWeight: '800', color: C.dim, letterSpacing: 0.3 },
  badgeTxtOn: { color: C.ink },

  caption: { width: '100%', alignItems: 'center', paddingHorizontal: 16, marginTop: 14 },
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
  captionTxt: { fontSize: 16, fontWeight: '800', color: C.ink, textAlign: 'center', lineHeight: 23 }, // PRIMARY — spoken words (bright)
  capDim: { color: 'rgba(241,241,247,0.32)' }, // not-yet-spoken words (light); brighten as she speaks

  // floating corner teacher (top-right) while a board is on screen
  cornerWrap: { position: 'absolute', top: 56, right: 12, zIndex: 20 },

  // lesson: kicker + title (left, clear of the corner teacher), board, her words
  lessonArea: { width: '100%', alignItems: 'stretch', marginTop: 8 },
  lessonHead: { alignSelf: 'stretch', paddingRight: AV_CORNER + 16, minHeight: AV_CORNER - 6, justifyContent: 'center' },
  kicker: { fontSize: 11, fontWeight: '900', color: C.accent, letterSpacing: 1.6, textAlign: 'left' },
  title: { fontSize: 20, fontWeight: '900', color: C.ink, letterSpacing: -0.3, textAlign: 'left', marginTop: 5, lineHeight: 25 },
  lessonCard: { width: '100%', marginTop: 14, backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingVertical: 18, paddingHorizontal: 14, alignItems: 'center' },
  subtitleBar: { width: '100%', alignItems: 'center', marginTop: 16, paddingHorizontal: 4 },

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
  dock: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', alignSelf: 'stretch', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.line, borderRadius: 24, paddingHorizontal: 6, paddingVertical: 10, shadowColor: '#2C3043', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
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
  doneCard: { width: '100%', backgroundColor: C.cream2, borderWidth: 1, borderColor: C.line, borderRadius: 24, padding: 26, alignItems: 'center' },
  doneEmoji: { fontSize: 44 },
  doneTitle: { fontSize: 20, fontWeight: '900', color: C.ink, marginTop: 8 },
  doneSub: { fontSize: 13, fontWeight: '600', color: C.dim, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  doneRow: { flexDirection: 'row', gap: 12, marginTop: 22, alignSelf: 'stretch' },
  doneBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16 },
  donePrimary: { backgroundColor: C.accent },
  donePrimaryTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },
  doneGhost: { backgroundColor: C.board, borderWidth: 1, borderColor: C.line },
  doneGhostTxt: { color: C.ink, fontSize: 14, fontWeight: '800' },
});
