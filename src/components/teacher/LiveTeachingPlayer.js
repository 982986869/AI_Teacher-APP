import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Easing, Dimensions, Platform, TextInput, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LessonBoard from './LessonBoards';
import TeacherAvatar from './TeacherAvatar';
import TeacherFullBody from './TeacherFullBody';
import { TEACHER_PHOTO as TEACHER_HERO_PHOTO, TEACHER_VIDEO as TEACHER_HERO_VIDEO, TEACHER_HEADSHOT } from './teacherIdentity';
import VoicePicker from './VoicePicker';
import { directLesson } from './teachingDirector';
import { focusTarget } from './cameraDirector';
import { freshLearner, observe, assess } from './emotionEngine';
// openingBridge (the memory-driven opener) and the lessonExtras study features are
// consumed by code that sits outside any conflict — the buildFlashcards/buildTest/
// loadNotes hooks and the sheets they feed — so they come in here even though the
// rest of this block is the pre-merge import list.
import { ACTIONS, freshPedagogy, observePedagogy, decideNextAction, personalizedRecap, continuationHint, openingBridge } from './pedagogyEngine';
import { ContentsSheet, FlashcardDeck, TestSheet, loadNotes, saveNotes, loadNoteText, saveNoteText, buildFlashcards, buildTest, buildFormulas, buildRecap } from './lessonExtras';
// C comes in for ONE surface only: the board is a slate she writes chalk on, and
// its colour has to be the same source of truth the SVG boards draw against —
// otherwise the card and the chalk drift apart the moment either is re-themed.
// D is the dark-stage text ramp (D.text / D.textDim / D.textFaint).
import { SP, R, C, D } from './premiumTheme';
// The classroom runs on the APP-WIDE design system (studentTheme tokens + the Nunito
// family + lucide icons), not a palette of its own — so a lesson looks like the rest
// of the app rather than a separate product. Only SP/R (spacing + radii) still come
// from premiumTheme: they are structural scales, not colours.
import { S, shadow, shadowSm } from '../../theme/studentTheme';
import { F } from '../../screens/parent/ParentApp/constants';
import { PressableScale } from './uiKit';
import { EraserWipe } from './boardGestures';
import { BoardSizeProvider } from './boardSize';
import { expressionForScene, praiseLine, reassureLine, listeningLine, completeLine, resumeBridge } from './teacherPersona';
import { buildReteach } from './reteach';
import { speakTeacher, stopTeacher, primeTeacherVoice, getSpeechProgress, SPEECH_OK, speakTeacherQueued, resetTeacherQueue, isTeacherQueueActive, setListeningMode } from '../../utils/teacherVoice';
// The single lucide import for this file. The merge briefly carried a second copy
// further up, which is a duplicate-binding SyntaxError — MoreHorizontal is folded in
// here from that block rather than left behind with it.
import {
  Mic, Square, RotateCcw, SkipForward, SkipBack, Play, Pause, ArrowUp, ChevronLeft, AudioLines,
  Volume2, VolumeX, RefreshCw, GraduationCap, BookOpen, Globe, Check, Trophy, Radio, ListTree, Layers, Maximize2, Minimize2,
  MoreHorizontal,
} from 'lucide-react-native';

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
// Comfortable touch expansion for the 34px top-bar icons (keeps the frozen visual
// size but reaches the ~44px accessible target).
const BAR_HIT = { top: 8, bottom: 8, left: 8, right: 8 };

// The "classroom" backdrop — a deep indigo→near-black gradient (cohesive with the
// premium hub header) so the teaching room reads as a rich, focused space instead of
// flat black. A soft indigo bloom top-centre gives a subtle "stage light" depth.
// A sophisticated graphite "study room" — near-black with the faintest cool cast,
// no bright purple. Editorial and mature, not playful. One warm accent (champagne)
// carries emphasis and the live pulse, like a highlighter in a fine textbook.
const ROOM_GRAD = ['#191C24', '#0F1116', '#08090C'];
const ACCENT = '#6C4DE6';      // Aurora purple brand accent (dark-room theme)
const ACCENT_DIM = '#A06BFF';  // lighter Aurora purple for smaller labels
const GLASS_PANEL = 'rgba(255,255,255,0.07)';  // Aurora frosted glass (teacher / caption / dock)
const GLASS_HAIR = 'rgba(255,255,255,0.16)';   // bright top hairline on the glass

const M = {
  TEACHING: 'TEACHING',     // a scene is being explained (TTS = the clock)
  PAUSED: 'PAUSED',         // frozen by the student
  LISTENING: 'LISTENING',   // capturing the student's question
  THINKING: 'THINKING',     // waiting for the answer
  ANSWERING: 'ANSWERING',   // speaking the answer to a doubt
  COMPLETED: 'COMPLETED',   // lesson finished
};

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

// A number that counts up to its target — used on the completion card so the
// accuracy / concept tally feels earned as it lands, not just printed.
function CountUp({ to, suffix = '', style, duration = 900 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const a = new Animated.Value(0);
    const id = a.addListener(({ value }) => setN(Math.round(value)));
    const anim = Animated.timing(a, { toValue: to, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    anim.start();
    return () => { a.removeListener(id); anim.stop(); };
  }, [to, duration]);
  return <Text style={style}>{n}{suffix}</Text>;
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
  return <Animated.View style={{ height: 3, borderRadius: 2, backgroundColor: S.indigo, marginTop: 7, width: a.interpolate({ inputRange: [0, 1], outputRange: ['0%', '34%'] }) }} />;
}

// ── speaking waveform (purple/blue audio bars) shown ABOVE the teacher ────────
// Kept light (fewer bars) so it never janks on mid-range phones.
// Three softly pulsing dots — a professional "she's thinking" indicator.
function ThinkingDots() {
  const vals = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const loops = vals.map((v, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 160),
      Animated.timing(v, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.3, duration: 380, useNativeDriver: true }),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [vals]);
  return (
    <View style={st.thinkRow}>
      {vals.map((v, i) => (
        <Animated.View key={i} style={[st.thinkDot, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0.3, 1], outputRange: [0.8, 1.15] }) }] }]} />
      ))}
      <Text style={st.thinkTxt}>Ms. Nova is thinking</Text>
    </View>
  );
}

const WAVE_N = 14;
function Waveform({ active, compact }) {
  const n = compact ? 5 : WAVE_N;
  const vals = useRef(Array.from({ length: n }, () => new Animated.Value(0.22))).current;
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
    <View style={compact ? st.waveMini : st.wave} pointerEvents="none">
      {vals.map((v, i) => {
        const edge = 1 - Math.abs(i - (n - 1) / 2) / ((n - 1) / 2);
        const max = compact ? (10 + edge * 12) : (12 + edge * 26);
        return (
          <Animated.View key={i} style={[st.waveBar, {
            height: v.interpolate({ inputRange: [0, 1], outputRange: [4, max] }),
            backgroundColor: i % 2 ? S.blue : S.indigo,
            opacity: active ? 0.9 : 0.3,
          }]} />
        );
      })}
    </View>
  );
}

// (The floating corner avatar is gone: she is now a chip on the slate itself in
// both modes, so there is one place — and one size — she ever appears.)

// ── caption: karaoke-style — every word starts dim and brightens exactly as the
// teacher speaks it. Sync comes from the real audio position (getSpeechProgress),
// so the highlight never races ahead of her voice. Freezes when she's not
// speaking (paused) and resets per line (resetKey). Light on the JS thread: it
// only re-renders when the bright-word count actually changes.
function SpokenCaption({ text, speaking, karaoke, resetKey, style, highlight, onTermTap }) {
  const words = useMemo(() => String(text || '').split(/\s+/).filter(Boolean), [text]);
  // Keywords to emphasise the instant they're spoken (from the beat's `highlight`).
  const hot = useMemo(() => new Set((highlight || [])
    .flatMap((h) => String(h).toLowerCase().split(/\s+/))
    .map((w) => w.replace(/[^a-z0-9]/gi, ''))
    .filter(Boolean)), [highlight]);
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
      {words.map((w, i) => {
        const clean = w.replace(/[^a-z0-9]/gi, '').toLowerCase();
        const spokenNow = i < brightUpto;
        const isHot = spokenNow && hot.size > 0 && hot.has(clean);
        const isTerm = !!onTermTap && hot.has(clean) && clean.length > 2;
        const sep = i < words.length - 1 ? ' ' : '';
        if (isTerm) {
          return (
            <Text key={i} onPress={() => onTermTap(w.replace(/[^a-z0-9]/gi, ''))} style={[spokenNow ? st.capHot : st.capDim, st.capTerm]}>{w}{sep}</Text>
          );
        }
        return (
          <Text key={i} style={!spokenNow ? st.capDim : (isHot ? st.capHot : null)}>{w}{sep}</Text>
        );
      })}
    </Animated.Text>
  );
}

// ── student camera (small rounded-rect PiP, purple frame) ────────────────────
function CamInner() {
  const [perm, requestPerm] = ExpoCamera.useCameraPermissions();
  useEffect(() => { if (perm && !perm.granted && perm.canAskAgain !== false) requestPerm(); }, [perm]); // eslint-disable-line
  if (!perm || !perm.granted) return <View style={st.camFill}><GraduationCap size={26} color={D.textDim} strokeWidth={2} /></View>;
  const CameraView = ExpoCamera.CameraView;
  return <CameraView style={{ width: '100%', height: '100%' }} facing="front" />;
}
const StudentCircle = React.memo(function StudentCircle({ active }) {
  return (
    <View style={st.camWrap}>
      <View style={[st.camFrame, active && st.camFrameOn]}>
        <View style={st.camMask}>{CAMERA_OK ? <CamInner /> : <View style={st.camFill}><GraduationCap size={26} color={D.textDim} strokeWidth={2} /></View>}</View>
      </View>
      <Text style={[st.camLbl, active && st.camLblOn]}>{active ? 'Listening' : 'You'}</Text>
    </View>
  );
});

// ── voice mic — encapsulates recognition; calls back into the state machine ───
function VoiceMic({ onStart, onPartial, onFinal, onEnd, onError, dock }) {
  const { useSpeechRecognitionEvent, ExpoSpeechRecognitionModule } = SpeechRec;
  const [busy, setBusy] = useState(false);

  // A soft state-halo behind the mic that breathes while she's listening — a quiet
  // "I'm hearing you" cue. Core Animated (native driver) so it costs nothing on the JS
  // thread and needs no extra dependency; matches the pink stop-state so the cluster
  // reads as one lit control.
  const haloScale = useRef(new Animated.Value(1)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!busy) {
      haloScale.stopAnimation();
      haloOpacity.stopAnimation();
      haloScale.setValue(1);
      Animated.timing(haloOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start();
      return undefined;
    }
    haloScale.setValue(1);
    haloOpacity.setValue(0.34);
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(haloScale, { toValue: 1.35, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(haloOpacity, { toValue: 0, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [busy, haloScale, haloOpacity]);

  // Idle "breath" on the mic — the primary action feels alive and invites a tap, the
  // way a professional coach app's main CTA gently pulses. Pauses while listening so
  // it never competes with the halo.
  const idleScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (busy) { idleScale.stopAnimation(); idleScale.setValue(1); return undefined; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(idleScale, { toValue: 1.05, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(idleScale, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [busy, idleScale]);

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
        ? <View style={[st.dMic, st.dMicOn]}><Square size={18} color="#fff" strokeWidth={2.4} fill="#fff" /></View>
        : <View style={st.dMic}><Mic size={22} color="#fff" strokeWidth={2.4} /></View>}
      <Text style={[st.dLbl, st.dLblPrimary]}>{busy ? 'Stop' : 'Ask'}</Text>
    </PressableScale>
  );
}

// ── HANDS-FREE "Live conversation" listener ──────────────────────────────────
// Unlike VoiceMic (tap-to-talk), this runs continuous recognition the whole time,
// so the student can just SPEAK while the teacher is teaching and she pauses to
// answer — like a real class. Renders nothing; mounted only while hands-free is on
// (so it never fights VoiceMic for the single recognition session). Echo handling
// (ignoring the teacher's own voice) is done by the parent via `isEcho`, which knows
// exactly what she is currently saying. Best with earphones; on a speaker the parent's
// known-text echo filter is the mitigation.
function HandsFreeListener({ onBargeIn, isEcho, onUnavailable }) {
  const { useSpeechRecognitionEvent, ExpoSpeechRecognitionModule } = SpeechRec;
  const aliveRef = useRef(true);
  const restartRef = useRef(null);
  const errCountRef = useRef(0); // consecutive hard failures → give up gracefully
  const onBargeInRef = useRef(onBargeIn); onBargeInRef.current = onBargeIn;
  const isEchoRef = useRef(isEcho); isEchoRef.current = isEcho;
  const onUnavailableRef = useRef(onUnavailable); onUnavailableRef.current = onUnavailable;

  const bail = (reason) => { if (onUnavailableRef.current) onUnavailableRef.current(reason); };

  const begin = async () => {
    if (!aliveRef.current) return;
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!aliveRef.current) return;
      if (!perm || !perm.granted) { bail('mic-denied'); return; } // don't pretend to listen
      ExpoSpeechRecognitionModule.start({ lang: 'en-IN', interimResults: true, continuous: true });
    } catch (e) { /* the 'error' handler decides whether to retry or bail */ }
  };

  useSpeechRecognitionEvent('result', (e) => {
    if (!aliveRef.current) return;
    errCountRef.current = 0;                     // a real result → recognition is healthy
    const r = e && e.results && e.results[0];
    const t = (r && r.transcript) || '';
    if (!t || !e.isFinal) return;                // act on settled utterances only
    if (isEchoRef.current && isEchoRef.current(t)) return; // her own voice → ignore
    if (onBargeInRef.current) onBargeInRef.current(t);
  });
  // Continuous sessions still stop on their own (silence timeout, focus loss) — re-arm.
  useSpeechRecognitionEvent('end', () => { if (aliveRef.current) restartRef.current = setTimeout(begin, 350); });
  useSpeechRecognitionEvent('error', (e) => {
    if (!aliveRef.current) return;
    const code = (e && e.error) || '';
    if (code === 'not-allowed' || code === 'service-not-allowed') { bail('mic-denied'); return; }
    if (code === 'no-speech' || code === 'no-match') { restartRef.current = setTimeout(begin, 500); return; } // just a quiet stretch
    errCountRef.current += 1;
    if (errCountRef.current >= 4) { bail('errors'); return; } // stop looping on a broken device
    restartRef.current = setTimeout(begin, 900);
  });

  useEffect(() => {
    aliveRef.current = true;
    begin();
    return () => {
      aliveRef.current = false;
      if (restartRef.current) { clearTimeout(restartRef.current); restartRef.current = null; }
      try { ExpoSpeechRecognitionModule.stop(); } catch (e) { /* no-op */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
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
function DoubtMeta({ meta, onLearnPrereq }) {
  if (!meta) return null;
  const { concept, prereqs, tier, grounded } = meta;
  const tierColor = tier === 'high' ? S.emerald : tier === 'medium' ? S.orange : S.faint;
  return (
    <View style={st.metaWrap}>
      <Text style={st.metaHeader}>Answer details</Text>
      <View style={st.metaRow}>
        {grounded != null && (
          <View style={[st.metaPill, grounded ? st.metaPillOn : null]}>
            <Text style={[st.metaPillTxt, grounded ? st.metaPillTxtStrong : null]}>
              {grounded ? '📘 From your material' : '🌐 General knowledge'}
            </Text>
          </View>
        )}
        {!!tier && (
          // The match strength is carried by the dot + border, not the label colour —
          // a tinted 10px label would not clear AA contrast on any of the three tiers.
          <View style={[st.metaPill, { borderColor: tierColor }]}>
            <View style={[st.metaDot, { backgroundColor: tierColor }]} />
            <Text style={st.metaPillTxtStrong}>{TIER_LABEL[tier] || tier}</Text>
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
            <PressableScale key={p} style={st.metaChip} onPress={() => onLearnPrereq && onLearnPrereq(p)} accessibilityRole="button" accessibilityLabel={`Explain ${p}`}>
              <Text style={st.metaChipTxt}>{p}</Text>
            </PressableScale>
          ))}
        </View>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function LiveTeachingPlayer({ lesson, subject, ttsOk = true, startIndex = 0, priorModel = null, onProgress, onOutcome, onAsk, onAskStream, onExit, onNewLesson }) {
  // The Teaching Director choreographs the lesson into scenes-of-beats. The player
  // just executes that timeline (speak this line ↔ draw this board step ↔ this face).
  const scenes = useMemo(() => directLesson(lesson || {}), [lesson]);
  // Fallback highlight set — the lesson's key terms. When a beat carries no explicit
  // `highlight` (no backend metadata), any key term she speaks still pops in the
  // caption + on the board, so "important words highlight when spoken" works today.
  const keyTerms = useMemo(() => (lesson && Array.isArray(lesson.keyTerms) ? lesson.keyTerms.filter(Boolean) : []), [lesson]);
  const N = scenes.length;

  const [mode, setMode] = useState(M.TEACHING);
  // Resume at the saved position (clamped), else start at the beginning.
  const [idx, setIdx] = useState(() => Math.min(Math.max(0, Math.floor(Number(startIndex)) || 0), Math.max(0, N - 1)));
  const [beat, setBeat] = useState(0);   // which directed beat within the current scene
  const [animKey, setAnimKey] = useState(0);
  const [muted, setMuted] = useState(false);
  // "Live conversation" is the DEFAULT: the student just speaks, no mic to press.
  // (Inert until VOICE_OK; falls back to the typed/tap ask when the recognizer
  // build isn't present. The top-bar toggle can turn it off for privacy.)
  const [handsFree, setHandsFree] = useState(true);
  // Study features (see lessonExtras): a jump-around Contents/Notes sheet, a flip
  // flashcard deck and a summative "Test yourself" quiz. Bookmarks persist per lesson.
  const [contentsOpen, setContentsOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false); // distraction-free reading
  const [deckOpen, setDeckOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]); // saved concept indices
  const [noteText, setNoteText] = useState('');     // the student's own free-text note
  const [conceptResults, setConceptResults] = useState([]); // {i,title,correct} from checks
  const [visited, setVisited] = useState([]);       // concept indices seen (for the progress map)
  const openedAtRef = useRef(Date.now());           // for the study-time stat
  const lessonKey = useMemo(() => String((lesson && (lesson.id || lesson.lessonId || lesson.lessonTitle)) || subject || 'lesson'), [lesson, subject]);
  const flashcards = useMemo(() => buildFlashcards(scenes), [scenes]);
  const testQs = useMemo(() => buildTest(scenes), [scenes]);
  const formulas = useMemo(() => buildFormulas(scenes), [scenes]);
  const recap = useMemo(() => buildRecap(scenes), [scenes]);
  useEffect(() => { let ok = true; loadNotes(lessonKey).then((n) => { if (ok) setSavedNotes(n); }); loadNoteText(lessonKey).then((t) => { if (ok) setNoteText(t); }); return () => { ok = false; }; }, [lessonKey]);
  const toggleSaveNote = (i) => setSavedNotes((prev) => {
    const next = prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort((a, b) => a - b);
    saveNotes(lessonKey, next);
    return next;
  });
  const onChangeNoteText = (t) => { setNoteText(t); saveNoteText(lessonKey, t); };
  // Mastery from this lesson's checks (client-side, per-lesson): how many concepts nailed.
  const mastered = conceptResults.filter((r) => r.correct).length;
  const weakConcepts = conceptResults.filter((r) => !r.correct);
  const studyMin = Math.max(1, Math.round((Date.now() - openedAtRef.current) / 60000));
  const [ttsActive, setTtsActive] = useState(false); // is audio playing right now (avatar/sync)
  const [qa, setQa] = useState(null);                // { q, a } during a doubt
  const [qaMeta, setQaMeta] = useState(null);        // retrieval signals for the doubt answer
  const [partial, setPartial] = useState('');
  const [qInput, setQInput] = useState('');
  const [doubtDone, setDoubtDone] = useState(false); // answer fully spoken
  const [hint, setHint] = useState('');
  const [voiceOpen, setVoiceOpen] = useState(false); // voice-picker sheet
  // ── IMMERSIVE BOARD ──────────────────────────────────────────────────────────
  // The board stops being a card in a scroll and becomes the whole stage: teacher
  // shrinks to the corner, her line sits over the board, and the chrome fades out
  // while she teaches. Opt-in per lesson via the header toggle — flip this to
  // `useState(true)` to make the full-screen board the default for every lesson.
  const [immersive, setImmersive] = useState(false);
  const [chromeOn, setChromeOn] = useState(true);   // header + dock visible?
  const [stageH, setStageH] = useState(0);          // measured stage height → board scale
  const [menuOpen, setMenuOpen] = useState(false);  // the ⋯ sheet (voice · new lesson)
  const chromeA = useRef(new Animated.Value(1)).current;
  const chromeTimer = useRef(null);
  const [reactExpr, setReactExpr] = useState(null);  // transient face after a quick-check (celebrate / encouraging)
  const [gestureExpr, setGestureExpr] = useState(null); // transient 'pointing' lead — she points at the board a beat before she speaks
  const [quizFb, setQuizFb] = useState(null);        // { correct, line } — the human line for the last quick-check
  const [reteach, setReteach] = useState(null);      // adaptive re-teach shown on a missed check (not a repeat)
  const [doneMsg, setDoneMsg] = useState('');        // varied wrap-up line (never the same twice running)
  const [listenPrompt, setListenPrompt] = useState('I’m listening…');
  // streaks drive her TONE: a run of right answers ramps up praise; a repeated
  // miss slows her down and softens her. Refs (not state) — read inside handlers.
  const rightStreakRef = useRef(0);
  const wrongStreakRef = useRef(0);
  const reactTimerRef = useRef(null);
  const answerTimerRef = useRef(null);   // the human "thinking beat" before she reacts to an answer
  const outcomeSentRef = useRef(false);  // report this lesson's outcome to memory exactly once
  const resumeBridgeRef = useRef(false); // speak a natural "where were we" bridge on the next beat after a doubt
  const openedRef = useRef(false);       // one-shot: memory-aware opener on the very first beat
  // The Emotion engine's learner model + the pace multiplier it produces. Both are
  // refs (read inside the beat timer), so adapting the pace never forces a re-render.
  // Seeded from cross-lesson memory (priorModel) so a returning student's pace opens
  // at their known register instead of always starting neutral. null → neutral.
  const learnerRef = useRef(freshLearner(priorModel));
  const paceMultRef = useRef(assess(learnerRef.current).paceMult);
  const feelLearner = (event) => { learnerRef.current = observe(learnerRef.current, event); paceMultRef.current = assess(learnerRef.current).paceMult; };
  // ── THE PEDAGOGY ENGINE (decision layer) ──────────────────────────────────────
  // Emotion engine reads the room (pace/tone); Pedagogy engine decides the next
  // teaching MOVE (hint vs re-teach vs praise…). Seeded with the class + lesson
  // length so its choices are grade-aware. State lives in a ref (read in handlers).
  const pedagogyRef = useRef(freshPedagogy({
    grade: lesson && (lesson.grade != null ? lesson.grade : lesson.gradeLevel),
    total: N,
    prior: priorModel,   // remembered as struggling → examples/analogies come sooner
  }));
  const observeTeach = (event) => { pedagogyRef.current = observePedagogy(pedagogyRef.current, event); };
  // What re-teach flavours the lesson can actually offer right now (drives whether
  // the engine reaches for an analogy / worked example vs a plain re-explanation).
  const lessonAffords = useMemo(() => ({
    hasAnalogy: scenes.some((sc) => sc.visualType === 'ANALOGY' || sc.template === 'Analogy'),
    hasExample: scenes.some((sc) => sc.visualType === 'EXAMPLE' || sc.template === 'WorkedExample'),
  }), [scenes]);
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
    // Explicit 'zoom'/'focus' action from the transcript overrides — the board leans
    // in harder on command; otherwise auto-zoom on any board that BUILDS.
    const act = curBeat && curBeat.boardAction && curBeat.boardAction.action;
    const wantZoom = act === 'zoom' || act === 'focus';
    if (mode !== M.TEACHING || (!ZOOM_BOARDS.includes(scene.boardType) && !wantZoom)) { focusZoom.setValue(1); return undefined; }
    const peak = wantZoom ? 1.11 : 1.05;
    const a = Animated.sequence([
      Animated.timing(focusZoom, { toValue: peak, duration: wantZoom ? 540 : 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(focusZoom, { toValue: 1.0, duration: wantZoom ? 1150 : 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
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
  // Latest-value mirrors for the long-mounted hands-free listener's callbacks
  // (they'd otherwise close over stale render values).
  const modeRef = useRef(mode); modeRef.current = mode;
  const ttsActiveRef = useRef(ttsActive); ttsActiveRef.current = ttsActive;
  const qaRef = useRef(qa); qaRef.current = qa;
  const bargeCooldownRef = useRef(0);   // debounce repeat barge-ins
  const autoResumeRef = useRef(null);   // auto-continue timer after a hands-free answer
  const doubtTurnRef = useRef(0);       // invalidates a stale in-flight doubt when a newer one starts / we resume
  const ttsEndedAtRef = useRef(0);      // when TTS last stopped — keeps echo suppression alive briefly after (speaker tail)
  // The doubt-completion poller (interval) — kept in a ref so it's always cleared
  // on unmount / new doubt, never leaking or firing setState after unmount.
  const doubtTickRef = useRef(null);
  const mountedRef = useRef(true);
  const clearDoubtTick = () => { if (doubtTickRef.current) { clearInterval(doubtTickRef.current); doubtTickRef.current = null; } };

  useEffect(() => { primeTeacherVoice(); }, []);
  useEffect(() => { setVisited((prev) => (prev.includes(idx) ? prev : [...prev, idx])); }, [idx]);
  // Re-arm the flag on mount. An effect cleanup also runs on Fast Refresh (and under
  // StrictMode's double-invoke) and refs survive it, so a setup that only ever clears
  // the flag leaves it false forever — after which every `if (mountedRef.current)`
  // guard below silently drops its setState (doubt answers never render, the lesson
  // never opens).
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; clearDoubtTick(); if (reactTimerRef.current) clearTimeout(reactTimerRef.current); if (answerTimerRef.current) clearTimeout(answerTimerRef.current); resetTeacherQueue(); };
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
  const ttsCbs = () => ({ onStart: () => setTtsActive(true), onDone: () => setTtsActive(false), onStopped: () => setTtsActive(false), onError: () => setTtsActive(false) });

  // The renderer only RENDERS the pedagogy engine's decision — it maps each action
  // onto a capability it already has (praise line · one-line hint · adaptive
  // re-teach). No new UI: a hint reuses the re-teach panel with just its gap line,
  // and the MCQ options stay open above so the student can try again once it clicks.
  const applyTeachingDecision = (decision) => {
    const params = decision.params || {};
    switch (decision.action) {
      case ACTIONS.PRAISE: {
        reactWith('celebrate', 2800);
        setReteach(null);                       // she got it → drop the re-teach
        const base = praiseLine(rightStreakRef.current);
        // Stretch a student who is clearly acing it: pose the authored harder probe as
        // a bonus (a real teacher pushes their strongest). Only when one is authored AND
        // they're on a roll — never nagging after a single correct answer.
        const stretch = (rightStreakRef.current >= 2 && scene.quickCheck && scene.quickCheck.stretch) ? scene.quickCheck.stretch : '';
        const line = stretch ? `${base}  Here's a tougher one to think about — ${stretch}` : base;
        setQuizFb({ correct: true, line });
        if (voiceOn) speakTeacher(line, ttsCbs());
        return;
      }
      case ACTIONS.GIVE_HINT: {
        // A nudge, not the answer. Options stay open for another attempt.
        observeTeach({ type: 'hint' });
        reactWith('encouraging', 3000);
        const mc = params.misconception;
        const kt = (lesson && Array.isArray(lesson.keyTerms) && lesson.keyTerms.find(Boolean));
        const hintLine = (scene.quickCheck && scene.quickCheck.hint)
          || (mc ? `Careful — ${String(mc).replace(/\.$/, '')}.` : (kt ? `Think about what “${kt}” really means here.` : 'Take another look at the key idea, then try again.'));
        setReteach({ gap: hintLine });          // panel shows only the one-line hint
        setQuizFb({ correct: false, line: reassureLine(wrongStreakRef.current) });
        if (voiceOn) speakTeacher(hintLine, ttsCbs());
        return;
      }
      // ── ADAPTIVE RE-TEACH (acknowledge → name the gap → re-teach a DIFFERENT way,
      // step by step → ask an easier question). Analogy/Example are re-teach flavours
      // today. A backend `scene.reteach` still overrides. Never a repeat. ──
      case ACTIONS.GIVE_ANALOGY:
      case ACTIONS.GIVE_EXAMPLE:
      case ACTIONS.RE_EXPLAIN:
      default: {
        reactWith('encouraging', 3600);
        const concept = scenes[Math.max(0, idx - 1)] || scene;
        const rt = scene.reteach || concept.reteach || buildReteach({
          title: concept.title || scene.title,
          keyTerms: (lesson && lesson.keyTerms) || [],
          points: (concept.diagram && concept.diagram.points) || (scene.diagram && scene.diagram.points) || [],
          grade: lesson && (lesson.grade != null ? lesson.grade : lesson.gradeLevel),
          wrongStreak: wrongStreakRef.current,
          misconception: params.misconception || (scene.quickCheck && scene.quickCheck.misconception),
        });
        setReteach(rt);
        setQuizFb({ correct: false, line: rt.ack });
        if (voiceOn) {
          const speech = [rt.ack, rt.gap, rt.intro, ...(rt.steps || []), rt.easyQ].filter(Boolean).join('  ');
          speakTeacher(speech, ttsCbs());
        }
        return;
      }
    }
  };

  // The student answered a quick-check. The PEDAGOGY ENGINE decides what happens
  // next (praise · hint · re-teach); this handler just feeds it the signals and
  // renders its call. Streak refs stay in sync for the praise/re-teach copy.
  const handleQuizResult = (correct) => {
    const firstTry = wrongStreakRef.current === 0;
    if (correct) { wrongStreakRef.current = 0; rightStreakRef.current += 1; }
    else { rightStreakRef.current = 0; wrongStreakRef.current += 1; }
    feelLearner(correct ? (firstTry ? 'correctFirstTry' : 'correct') : 'miss');
    // Per-lesson mastery: record this concept's outcome once (first attempt wins).
    setConceptResults((prev) => (prev.some((r) => r.i === idx) ? prev : [...prev, { i: idx, title: scene.title || scene.kicker || `Concept ${idx + 1}`, correct: !!correct }]));

    const isMcq = !!(scene.quickCheck && Array.isArray(scene.quickCheck.options) && scene.quickCheck.options.length);
    observeTeach({ type: 'answer', correct, misconception: scene.quickCheck && scene.quickCheck.misconception });
    observeTeach({ type: 'confidence', value: assess(learnerRef.current).confidence });

    const decision = decideNextAction(pedagogyRef.current, {
      phase: 'afterCheck',
      retryable: isMcq,
      hasAnalogy: lessonAffords.hasAnalogy,
      hasExample: lessonAffords.hasExample,
    });

    // A real teacher doesn't answer the instant a student taps. She registers it —
    // a small, considering beat (longer, more thoughtful after a miss) — and only
    // THEN responds. Her face holds a listening/thinking look through the pause.
    reactWith(correct ? 'happy' : 'thinking', 1400);
    const beatMs = (correct ? 360 : 640) + Math.round(Math.random() * 360);
    if (answerTimerRef.current) clearTimeout(answerTimerRef.current);
    answerTimerRef.current = setTimeout(() => { if (mountedRef.current) applyTeachingDecision(decision); }, beatMs);
  };

  // Report the current position so the screen can persist progress + study time
  // (enables resume-to-position and the Study Insights tiles).
  useEffect(() => {
    if (onProgress) onProgress({ slideIndex: idx, total: N });
    observeTeach({ type: 'progress', index: idx });
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
    // She was interrupted by a doubt and is picking the lesson back up — lead the
    // resumed sentence with a natural, context-aware bridge ("Right, where were we?
    // Back to Pythagoras —") so it feels like a conversation continuing, not a slide
    // un-pausing. One-shot: consumed the first beat after resuming.
    const doBridge = resumeBridgeRef.current;
    resumeBridgeRef.current = false;
    // Once, on the very first beat: if this student is remembered as having struggled
    // with THIS topic, open gently and name it (memory made audible). Fresh students /
    // resumes are unaffected.
    let memOpener = '';
    if (!doBridge && !openedRef.current && idx === 0 && beat === 0) {
      openedRef.current = true;
      memOpener = openingBridge(priorModel, { topic: (lesson && (lesson.lessonTitle || lesson.title)) || (scene && scene.title) });
    }
    const sayLine = (doBridge && line)
      ? `${resumeBridge(scene.title)} ${line}`
      : ((memOpener && line) ? `${memOpener} ${line}` : line);
    // Adaptive pace: the Emotion engine stretches the silences for a struggling
    // student and tightens them for a fluent one. It scales the BEATS (pauses,
    // dwells) — never her speech — so words stay natural, only the room breathes
    // differently.
    const mult = paceMultRef.current || 1;
    // A touch of human irregularity so the pacing never sounds metronomic — the
    // silences breathe by a few percent each beat instead of being pixel-identical.
    const pauseMs = ((b && b.pause) || 0) * mult * (0.92 + Math.random() * 0.22);

    if (voiceOn && line) {
      speakTeacher(sayLine, {
        onStart: () => { if (!cancelled) setTtsActive(true); },
        onDone: () => { if (!cancelled) { setTtsActive(false); if (!waiting) at(advance, pauseMs); } },
        onStopped: () => { if (!cancelled) setTtsActive(false); },
        onError: () => { if (!cancelled) { setTtsActive(false); if (!waiting) advance(); } },
      });
      const words = String(sayLine).split(/\s+/).filter(Boolean).length;
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
  const goTeach = (next) => { doubtTurnRef.current += 1; stopTeacher(); setQa(null); setQaMeta(null); setDoubtDone(false); setHint(''); setQuizFb(null); setReteach(null); setReactExpr(null); setBeat(0); setIdx(next); setMode(M.TEACHING); setAnimKey((k) => k + 1); };
  const pause = () => { stopTeacher(); setTtsActive(false); setMode(M.PAUSED); };
  const resume = () => { setMode(M.TEACHING); setAnimKey((k) => k + 1); };
  const togglePlay = () => { if (teaching) pause(); else if (mode === M.PAUSED) resume(); };
  // Prev absorbed Replay when the dock dropped to four buttons: on the first scene
  // there is nothing behind you, so "back" can only sensibly mean "say that again".
  const onPrev = () => { if (idx > 0) goTeach(idx - 1); else onRefresh(); };
  const onNext = () => { if (idx < N - 1) goTeach(idx + 1); else { stopTeacher(); setMode(M.COMPLETED); } };
  const onRefresh = () => { feelLearner('replay'); observeTeach({ type: 'replay' }); setQuizFb(null); setReactExpr(null); setBeat(0); setMode(M.TEACHING); setAnimKey((k) => k + 1); }; // replaying a scene → she eases the pace
  const onReplayLesson = () => { goTeach(0); };
  // Toggling sound restarts the current scene so audio/captions stay in lock-step.
  const toggleMute = () => { setMuted((m) => !m); if (teaching) setAnimKey((k) => k + 1); };

  // ── doubt flow (lesson fully frozen the whole time) ──
  const beginListen = () => { doubtTurnRef.current += 1; stopTeacher(); clearDoubtTick(); setTtsActive(false); setPartial(''); setQInput(''); setQa(null); setQaMeta(null); setDoubtDone(false); setHint(''); setMode(M.LISTENING); };
  const sendDoubt = (override) => {
    const q = (typeof override === 'string' ? override : qInput).trim();
    if (!q || !onAsk) { if (!q) setMode(M.PAUSED); return; }
    // This turn owns the voice queue + UI. A newer doubt (e.g. a second hands-free
    // barge-in) or a resume/navigate bumps doubtTurnRef, so a late-arriving answer
    // from THIS request is dropped instead of speaking the wrong answer / leaking a timer.
    const turn = (doubtTurnRef.current += 1);
    const fresh = () => turn === doubtTurnRef.current && mountedRef.current;
    feelLearner('doubt'); observeTeach({ type: 'doubt' }); // asking for help eases her pace a little
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
        onDelta: (t) => { if (turn !== doubtTurnRef.current) return; acc += t; buf += t; setQa({ q, a: acc }); flush(false); },
      })
        .then((res) => {
          if (!fresh()) return;
          flush(true);
          setQa({ q, a: (res && res.answer) || acc || "Hmm, that didn't come through on my side — ask me once more?" });
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
          if (turn !== doubtTurnRef.current) return; // a newer doubt owns the queue now
          resetTeacherQueue();
          if (!mountedRef.current) return;
          setQa({ q, a: e?.message || 'Sorry, I couldn’t get an answer just now. Please try asking again.' });
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
        if (!fresh()) return;
        // onAsk may resolve to a plain string (answer) or the full agent response.
        const a = (typeof ans === 'string' ? ans : (ans && ans.answer)) || "Hmm, that didn't come through on my side — ask me once more?";
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
      .catch((e) => { clearTimeout(to); if (!fresh()) return; setQa({ q, a: e?.response?.data?.error || e?.message || 'Sorry, I couldn’t get an answer just now. Please try asking again.' }); setMode(M.ANSWERING); setDoubtDone(true); });
  };
  const resumeFromDoubt = () => { doubtTurnRef.current += 1; stopTeacher(); clearDoubtTick(); setQa(null); setQaMeta(null); setDoubtDone(false); resumeBridgeRef.current = true; setMode(M.TEACHING); setAnimKey((k) => k + 1); };

  // ── HANDS-FREE "Live conversation": echo suppression + barge-in ──
  const _norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').split(/\s+/).filter(Boolean);
  // True when what the mic heard is (mostly) the teacher's OWN speech. We know exactly
  // what she is saying right now (current beat line + streaming doubt answer), so we can
  // ignore her voice echoing back off the speaker and react only to the student. Only
  // applies while she is actually making sound — when she is silent, it IS the student.
  const ECHO_GRACE_MS = 1100; // her audio physically rings out (and ASR lags) past ttsActive=false
  const isLikelyEcho = (heard) => {
    const h = _norm(heard);
    if (!h.length) return true;
    // Keep suppressing for a short window AFTER she stops — otherwise the trailing
    // recognition of her own last sentence (esp. on a speaker) fires a false doubt.
    const speakingRecently = ttsActiveRef.current || (Date.now() - ttsEndedAtRef.current < ECHO_GRACE_MS);
    if (!speakingRecently) return false;
    const teacher = new Set([..._norm(lastSayRef.current), ..._norm(qaRef.current && qaRef.current.a)]);
    if (!teacher.size) return false;
    const overlap = h.filter((w) => teacher.has(w)).length / h.length;
    return overlap >= 0.6;
  };
  // The student spoke while she was teaching/answering → pause and take the doubt, like a
  // real class. Ignored while she is already THINKING/listening or the lesson is done.
  const handleBargeIn = (text) => {
    const q = String(text || '').trim();
    if (q.split(/\s+/).filter(Boolean).length < 2) return; // stray one-word noise
    const now = Date.now();
    if (now < bargeCooldownRef.current) return;
    const m = modeRef.current;
    if (m === M.THINKING || m === M.LISTENING || m === M.COMPLETED) return;
    bargeCooldownRef.current = now + 1600;
    if (autoResumeRef.current) { clearTimeout(autoResumeRef.current); autoResumeRef.current = null; }
    sendDoubt(q);
  };
  const toggleHandsFree = () => {
    setHandsFree((v) => {
      const next = !v;
      setHint(next ? 'Live conversation on — just speak anytime and I\'ll pause to answer. (Earphones give the clearest result.)' : '');
      return next;
    });
  };
  // Recognition couldn't run (mic denied / no service / repeated failures) — never
  // leave the "Live" pill pretending to listen. Turn it off and fall back to the
  // tap mic / typed ask, with a clear reason.
  const handleVoiceUnavailable = (reason) => {
    setHandsFree(false);
    setHint(reason === 'mic-denied'
      ? 'Microphone access is off — allow it in Settings to talk, or tap the mic / type your question.'
      : 'Live conversation isn\'t available on this device — tap the mic or type your question instead.');
  };
  // After a hands-free answer finishes, quietly continue the lesson unless the student
  // speaks again first (which cancels this and starts a new doubt).
  useEffect(() => {
    if (!handsFree || mode !== M.ANSWERING || !doubtDone) return undefined;
    autoResumeRef.current = setTimeout(() => { if (mountedRef.current) resumeFromDoubt(); }, 3500);
    return () => { if (autoResumeRef.current) { clearTimeout(autoResumeRef.current); autoResumeRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handsFree, mode, doubtDone]);

  // Simultaneous record+play is only needed while listening — enable it with the
  // hands-free toggle and drop it on leave so normal playback keeps full volume.
  useEffect(() => {
    if (VOICE_OK) setListeningMode(handsFree);
    return () => { if (VOICE_OK) setListeningMode(false); };
  }, [handsFree]);

  // First-time nudge so the student knows they can just talk (mic-free).
  useEffect(() => {
    if (VOICE_OK && handsFree) setHint('Just speak anytime — I\'ll pause and answer. (Earphones give the clearest result.)');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stamp when she stops speaking, so the echo filter can keep suppressing briefly
  // afterwards (the audio tail + ASR lag) instead of self-triggering on her own words.
  useEffect(() => { if (!ttsActive) ttsEndedAtRef.current = Date.now(); }, [ttsActive]);

  // Quick-action chips under a finished answer → send a natural follow-up doubt.
  const QUICK_FOLLOWUP = {
    explain_simpler: 'Can you explain that more simply?',
    give_example: 'Can you give me an example?',
    start_quiz: 'Quiz me on this with one quick question.',
  };
  const handleQuickAction = (action) => { const q = QUICK_FOLLOWUP[action]; if (q) sendDoubt(q); };

  // Re-explanation: jump back to the concept she just taught (skip quick-checks /
  // the opener) and replay it. The 'replay' signal eases her pace, so the second
  // pass is genuinely slower and warmer — the honest, no-new-content re-teach.
  const reexplain = () => {
    feelLearner('replay'); observeTeach({ type: 'replay' });
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
  // Distinct colour + label per live state — a professional, legible presence.
  const statusInfo = mode === M.LISTENING ? { label: 'Listening', color: C.teal }
    : mode === M.THINKING ? { label: 'Thinking', color: '#E9A23B' }
    : ttsActive ? { label: 'Teaching', color: ACCENT }
    : mode === M.PAUSED ? { label: 'Paused', color: D.textFaint }
    : { label: 'Ready', color: D.textDim };

  // Caption = the current BEAT's line (one directed line at a time — never a wall
  // of text). Wordless reveal beats keep the previous line on screen instead of
  // blanking, so the subtitle always reads as one calm sentence.
  const beatText = (curBeat && curBeat.say) || lastSayRef.current || scene.teacherLine || '';
  const captionText = qa ? (qa.a || 'One moment…') : beatText;

  // (Progress is the row of dots on the slate now — a bar that fills is a task
  // being completed, which is not what following an explanation is.)
  const sceneKey = `${idx}-${animKey}`;
  const beatKey = `${idx}-${beat}-${animKey}`; // karaoke highlight resets per beat
  // Drop the small eyebrow when it just repeats the title (e.g. quick-check scenes
  // set both kicker "QUICK CHECK" and title "Quick Check") — one clean heading, not two.
  const _normHead = (s) => String(s || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const kickerDistinct = _normHead(scene.kicker) !== _normHead(scene.title);

  // The spoken caption (or the doubt Q&A) — shared by the centred hero and the
  // with-slide subtitle bar so it always reads the same. Shown whole (not
  // word-by-word) so it stays in step with her voice and never janks.
  const captionEl = (
    qa ? (
      <>
        <Text style={st.askedLabel} numberOfLines={1}>You asked · “{qa.q}”</Text>
        <SpokenCaption key={`ans-${idx}-${qa.a ? 1 : 0}`} text={captionText} speaking={ttsActive} karaoke={voiceOn} resetKey={`ans-${qa.a ? 1 : 0}`} style={st.captionTxt} />
        {doubtDone && <DoubtMeta meta={qaMeta} onLearnPrereq={(p) => sendDoubt(`Explain "${p}" briefly — I want to understand the idea this builds on.`)} />}
      </>
    ) : mode === M.LISTENING ? (
      <Text style={st.captionTxt}>{listenPrompt}</Text>
    ) : (
      <SpokenCaption key={`s-${idx}-${captionText}`} text={captionText} speaking={ttsActive} karaoke={voiceOn} resetKey={`${idx}-${captionText}`} style={st.captionTxt} highlight={(curBeat && curBeat.highlight && curBeat.highlight.length) ? curBeat.highlight : keyTerms} onTermTap={onAsk ? (term) => sendDoubt(`In one line, what does "${term}" mean here?`) : undefined} />
    )
  );

  // ── Learning-progress context — reads as progress through the CONCEPTS, not a
  // raw slide count (checkpoints are excluded from the numbering). ──
  const lessonTopic = (lesson && (lesson.lessonTitle || lesson.title)) || (scenes[0] && scenes[0].title) || 'Today’s lesson';
  const conceptTotal = Math.max(1, scenes.filter((sc) => sc.boardType !== 'quickCheck').length);
  const conceptNo = Math.min(conceptTotal, Math.max(1, scenes.slice(0, idx + 1).filter((sc) => sc.boardType !== 'quickCheck').length));

  // Completion summary — what she'll say the student learned + how they did. Drawn
  // from the lesson's own key terms (or concept titles) + the live pedagogy tally.
  const learned = (() => {
    const kt = (lesson && Array.isArray(lesson.keyTerms) ? lesson.keyTerms.filter(Boolean) : []);
    if (kt.length) return kt.slice(0, 5);
    const titles = scenes.filter((sc) => sc.boardType !== 'quickCheck' && sc.boardType !== 'summary' && sc.title).map((sc) => sc.title);
    return Array.from(new Set(titles)).slice(0, 4);
  })();
  const ped = pedagogyRef.current || {};
  const accuracy = ped.checks > 0 ? Math.round((ped.correct / ped.checks) * 100) : null;

  // ── MEMORY: what she remembers about THIS student shapes the closing words. With a
  // priorModel she gives a personalized recap + a smart "what next"; without one she
  // falls back to the warm generic lines (fully backward compatible). ──
  const memoryRecap = priorModel ? personalizedRecap(priorModel, { topic: lessonTopic, accuracy, learned }) : null;
  const memoryNext = priorModel ? continuationHint(priorModel, { topic: lessonTopic, accuracy }) : null;

  // Report this lesson's outcome to long-term memory exactly once, when it completes.
  useEffect(() => {
    if (mode !== M.COMPLETED || outcomeSentRef.current) return;
    outcomeSentRef.current = true;
    if (onOutcome) onOutcome({
      topic: lessonTopic,
      subject: subject || null,
      grade: lesson && (lesson.grade != null ? lesson.grade : lesson.gradeLevel),
      accuracy,                                          // 0..100 | null
      confidence: assess(learnerRef.current).confidence, // 0..1
      learned,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Rack-focus transforms from the one camera scalar (0 teacher · 0.5 wide · 1 board).
  // Gentle by design: a real push-in + soft dim, never enough to blur text or jump.
  const boardScale = cam.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.985, 1.0, 1.035] });
  const boardOpacity = cam.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.82, 0.94, 1.0] });

  // ── How much bigger the board draws on the immersive stage ───────────────────
  // Measured, not guessed: the stage reports its own height and the board grows into
  // it. The divisor is the TALLEST board base (ProofBoard, 220) rather than a typical
  // one — scale by the average and the tall boards overflow their card on every phone
  // below a Pro Max. Shorter boards simply keep some slack, which is correct: their
  // viewBox aspect is preserved, never stretched. Capped at 2.4 so a tablet does not
  // turn a lesson into a poster.
  // Card mode grows with its content, so a plain View is right there. The immersive
  // stage is a FIXED box, so the board needs its own scroller — otherwise a tall
  // board (a quick check, a long points list) is centred until it outgrows the card
  // and then gets clipped away entirely. Only one scroller is ever live: the page
  // scroller is disabled whenever this one exists.
  const BoardHolder = immersive ? ScrollView : View;

  const MAX_BOARD_BASE = 220;
  const CARD_PAD_V = SP.md * 2;
  const boardSizeScale = (immersive && stageH > 0)
    ? Math.max(1, Math.min(2.4, (stageH - CARD_PAD_V) / MAX_BOARD_BASE))
    : 1;

  // ── Chrome auto-hide ────────────────────────────────────────────────────────
  // On the immersive stage the controls step out of the way WHILE SHE IS TEACHING,
  // like a video player. They come straight back on any tap, and they are forced
  // back whenever the student is being asked to do something (paused, listening,
  // thinking, answering, finished) — controls must never be hidden at the moment
  // they are needed.
  const holdChrome = !immersive || mode !== M.TEACHING || !ttsActive;
  useEffect(() => {
    clearTimeout(chromeTimer.current);
    if (holdChrome) { setChromeOn(true); return undefined; }
    if (!chromeOn) return undefined;
    chromeTimer.current = setTimeout(() => setChromeOn(false), 4000);
    return () => clearTimeout(chromeTimer.current);
  }, [holdChrome, chromeOn, idx]);
  useEffect(() => () => clearTimeout(chromeTimer.current), []);
  useEffect(() => {
    const a = Animated.timing(chromeA, {
      toValue: chromeOn ? 1 : 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [chromeOn, chromeA]);
  // Any tap on the stage brings the chrome back (and restarts its idle countdown).
  const wakeChrome = () => setChromeOn(true);
  const chromeStyle = { opacity: chromeA };
  const chromeHidden = immersive && !chromeOn;

  return (
    // The capture handler sits on the ROOT, not the stage: when the chrome is hidden
    // the dock is pointerEvents:none, so a tap down there would otherwise land on
    // nothing. Returning false means it never steals the gesture — buttons, the board
    // and the quiz options all still get it.
    <View
      style={st.container}
      onStartShouldSetResponderCapture={immersive ? () => { wakeChrome(); return false; } : undefined}
    >
      {/* the room is a flat S.canvas — no ambient art, so the board is the only focus */}

      {/* ── HEADER (fixed; fades out on the immersive stage while she teaches) ── */}
      <Animated.View style={[st.bar, chromeStyle]} pointerEvents={chromeHidden ? 'none' : 'auto'}>
        <PressableScale onPress={() => { stopTeacher(); onExit && onExit(); }} style={st.barIcon} accessibilityLabel="Leave lesson"><ChevronLeft size={20} color={S.ink} strokeWidth={2.6} /></PressableScale>
        {/* Topic + where she is, as ONE reading. "Concept 3 of 9" is learning
            progress; the old "5/11" + bar read as slides to get through, which is
            an invitation to skip rather than to follow. */}
        <View style={st.headTxt}>
          <Text style={st.headTopic} numberOfLines={1}>{lessonTopic}</Text>
          <Text style={st.headPos} accessibilityLabel={`Concept ${conceptNo} of ${conceptTotal}`}>Concept {conceptNo} of {conceptTotal}</Text>
        </View>
        <PressableScale onPress={toggleMute} style={st.barIcon} accessibilityLabel={muted ? 'Unmute narration' : 'Mute narration'}>
          {muted ? <VolumeX size={17} color={S.muted} strokeWidth={2.4} /> : <Volume2 size={17} color={S.ink} strokeWidth={2.4} />}
        </PressableScale>
        {/* Everything that is set once — her voice, starting over — lives behind
            this, not on the bar a student stares at for twenty minutes. */}
        <PressableScale onPress={() => setMenuOpen((v) => !v)} style={st.barIcon} accessibilityLabel="Lesson options" accessibilityState={{ expanded: menuOpen }}>
          <MoreHorizontal size={18} color={S.ink} strokeWidth={2.6} />
        </PressableScale>
      </Animated.View>

      {menuOpen && (
        <>
          <Pressable style={st.menuScrim} onPress={() => setMenuOpen(false)} accessibilityLabel="Close options" />
          <View style={st.menu}>
            <PressableScale style={st.menuItem} onPress={() => { setMenuOpen(false); stopTeacher(); setVoiceOpen(true); }} accessibilityLabel="Choose teacher voice">
              <AudioLines size={16} color={S.ink} strokeWidth={2.4} />
              <Text style={st.menuTxt}>Teacher voice</Text>
            </PressableScale>
            {!!onNewLesson && (
              <PressableScale style={st.menuItem} onPress={() => { setMenuOpen(false); onNewLesson(); }} accessibilityLabel="Start a new lesson">
                <RotateCcw size={16} color={S.ink} strokeWidth={2.4} />
                <Text style={st.menuTxt}>New lesson</Text>
              </PressableScale>
            )}
          </View>
        </>
      )}

      <VoicePicker visible={voiceOpen} onClose={() => setVoiceOpen(false)} />

      {/* ── THE LESSON — Ms. Nova top-left header, a clean white
          board card, her words below. Mobile-first, no student PiP. The teacher row
          is persistent (never remounts); only the material transitions per scene. */}
      <ScrollView
        style={st.scroll}
        contentContainerStyle={immersive ? st.lessonScrollFull : st.lessonScroll}
        scrollEnabled={!immersive}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Stage key={sceneKey} style={immersive ? st.workAreaFull : st.workArea}>
          {/* The slate is ALWAYS up — she doesn't wheel the board out between ideas.
              On a scene with nothing to draw (the opener, a bare recap) it carries
              her name and the title alone, which is exactly what a real board shows
              at that moment. Only the drawing below is conditional. */}
          {(
            <Animated.View
              style={[immersive ? st.boardOuterFull : st.boardOuter, { transform: [{ scale: focusZoom }] }]}
              onLayout={immersive ? (e) => setStageH(Math.round(e.nativeEvent.layout.height)) : undefined}
            >
              {/* ── THE SLATE ── everything about the lesson lives on it: who is
                  speaking, what she is writing, and how far in we are. Nothing about
                  the lesson sits outside it except her current sentence. */}
              <View style={immersive ? st.lessonCardFull : st.lessonCard}>
                <View style={st.slateTop}>
                  {/* She is a small presence ON the board, not a row above it — the
                      old 46px header cost more height than it earned. */}
                  <View style={st.speakChip}>
                    <TeacherAvatar theme="dark" video={TEACHER_VIDEO} photo={TEACHER_HEADSHOT} state={teacherState} expression={expression} size={20} />
                    <Text style={st.speakName}>Ms. Nova</Text>
                    <Text style={st.speakState}>{mode === M.LISTENING ? 'listening' : mode === M.THINKING ? 'thinking' : ttsActive ? 'speaking' : mode === M.PAUSED ? 'paused' : 'ready'}</Text>
                  </View>
                  <PressableScale onPress={() => { setImmersive((v) => !v); setChromeOn(true); }} style={st.slateExpand}
                    accessibilityLabel={immersive ? 'Exit full-screen board' : 'Full-screen board'}
                    accessibilityState={{ selected: immersive }}>
                    {immersive
                      ? <Minimize2 size={13} color={C.ink2} strokeWidth={2.2} />
                      : <Maximize2 size={13} color={C.ink2} strokeWidth={2.2} />}
                  </PressableScale>
                </View>

                {!!scene.kicker && <Text style={st.kicker}>{scene.kicker}</Text>}
                {!!scene.title && <Text style={immersive ? st.titleFull : st.title} numberOfLines={2}>{scene.title}</Text>}

                {/* The board scrolls INSIDE the slate. A quick check is far taller
                    than a diagram, and on the full-screen stage a centred child that
                    outgrows its card was being clipped to nothing. */}
                {showBoard && (
                  <BoardHolder
                    style={immersive ? st.boardHolderFull : st.boardHolder}
                    contentContainerStyle={immersive ? st.boardHolderContent : undefined}
                    showsVerticalScrollIndicator={false}
                  >
                    <BoardSizeProvider value={boardSizeScale}>
                      <LessonBoard scene={scene} paused={!teaching} skip={false} resetKey={sceneKey} step={curBeat ? curBeat.boardStep : null} highlight={(curBeat && curBeat.highlight && curBeat.highlight.length) ? curBeat.highlight : keyTerms} action={curBeat && curBeat.boardAction} onQuizContinue={onNext} onQuizResult={handleQuizResult} onReexplain={reexplain} quizFb={quizFb} reteach={reteach} />
                    </BoardSizeProvider>
                  </BoardHolder>
                )}

                {N > 1 && N <= 14 && (
                  <View style={st.dots} accessibilityRole="progressbar" accessibilityValue={{ now: Math.min(idx + 1, N), min: 0, max: N }}>
                    {scenes.map((_, i) => <View key={i} style={[st.dot, i <= idx && st.dotOn]} />)}
                  </View>
                )}
                <EraserWipe enabled={idx > 0} />
              </View>
            </Animated.View>
          )}
          <View style={immersive ? st.captionWrapFull : st.captionWrap}>{captionEl}</View>
        </Stage>
      </ScrollView>


      {/* ── STUDENT + STATUS + CONTROL DOCK (fixed; fades with the header) ── */}
      <Animated.View style={[st.bottom, chromeStyle]} pointerEvents={chromeHidden ? 'none' : 'auto'}>
        {mode === M.LISTENING && VOICE_OK && <Text style={st.listenTxt} numberOfLines={2}>{partial || 'Listening… ask your question'}</Text>}
        {mode === M.THINKING && <Text style={st.listenTxt}>Thinking…</Text>}

        {mode === M.LISTENING && !VOICE_OK && (
          <View style={st.askRow}>
            <TextInput
              style={st.askInput}
              placeholder="Type your question…"
              placeholderTextColor={S.faint}
              value={qInput} onChangeText={setQInput}
              onSubmitEditing={() => sendDoubt()} returnKeyType="send" autoFocus
              accessibilityLabel="Type your question for the teacher"
            />
            <PressableScale style={st.askSend} onPress={() => sendDoubt()} accessibilityLabel="Send question"><ArrowUp size={20} color="#fff" strokeWidth={2.8} /></PressableScale>
          </View>
        )}

        {mode === M.ANSWERING && (
          <PressableScale style={st.resumeBtn} onPress={resumeFromDoubt} accessibilityLabel="Resume the lesson">
            <Play size={15} color="#fff" strokeWidth={2.6} fill="#fff" />
            <Text style={st.resumeTxt}>Resume lesson</Text>
          </PressableScale>
        )}

        {!!hint && (teaching || mode === M.PAUSED) && <Text style={st.hint}>{hint}</Text>}

        {/* controls — a floating glass dock. Ask (mic) is the clear primary; the
            transport is secondary with small, quiet labels for discoverability. */}
        {mode !== M.THINKING && mode !== M.COMPLETED && (
          <View style={st.dock}>
            <PressableScale style={st.dItem} onPress={onPrev} accessibilityLabel={idx === 0 ? 'Say that again' : 'Previous step'}>
              <View style={st.dGhost}>
                {idx === 0
                  ? <RotateCcw size={17} color={S.sub} strokeWidth={2.4} />
                  : <SkipBack size={17} color={S.sub} strokeWidth={2.4} fill={S.sub} />}
              </View>
              <Text style={st.dLbl}>{idx === 0 ? 'Again' : 'Prev'}</Text>
            </PressableScale>
            <PressableScale style={st.dItem} onPress={togglePlay} scaleTo={0.92} accessibilityLabel={teaching ? 'Pause the lesson' : 'Play the lesson'}>
              <View style={st.dGhost}>
                {teaching
                  ? <Pause size={17} color={S.sub} strokeWidth={2.4} fill={S.sub} />
                  : <Play size={17} color={S.sub} strokeWidth={2.4} fill={S.sub} />}
              </View>
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
                <View style={st.dMic}><Mic size={22} color="#fff" strokeWidth={2.4} /></View>
                <Text style={[st.dLbl, st.dLblPrimary]}>Ask</Text>
              </PressableScale>
            ))}
            {/* Replay is gone: Prev already re-teaches the step you are on the moment
                you step back into it, so two buttons were doing one job. */}
            <PressableScale style={st.dItem} onPress={onNext} accessibilityLabel="Next step">
              <View style={st.dGhost}><SkipForward size={17} color={S.sub} strokeWidth={2.4} fill={S.sub} /></View>
              <Text style={st.dLbl}>Next</Text>
            </PressableScale>
          </View>
        )}
      </Animated.View>

      {/* ── COMPLETED ── */}
      {mode === M.COMPLETED && (
        <View style={st.doneOverlay} pointerEvents="box-none">
          <Appear from="scale" style={st.doneCard}>
            <Appear from="scale" delay={220} duration={420} style={st.doneEmoji}><Trophy size={40} color="#F59E0B" strokeWidth={1.9} /></Appear>
            <Text style={st.doneTitle} accessibilityRole="header">Well done today</Text>
            <Text style={st.doneSub}>{memoryRecap || doneMsg || 'Great focus today. Take it again whenever you like.'}</Text>

            {learned.length > 0 && (
              <View style={st.learnedWrap}>
                <Text style={st.learnedHead}>Today you learned</Text>
                {learned.map((t, i) => (
                  <Appear key={i} delay={220 + i * 90} style={st.learnedRow}>
                    <View style={st.learnedTick}><Check size={12} color={S.emerald} strokeWidth={3.2} /></View>
                    <Text style={st.learnedTxt} numberOfLines={2}>{t}</Text>
                  </Appear>
                ))}
              </View>
            )}

            <Appear delay={260 + learned.length * 90} style={st.statRow}>
              {accuracy != null && (
                <View style={st.statBox}><CountUp to={accuracy} suffix="%" style={st.statNum} /><Text style={st.statLbl}>Accuracy</Text></View>
              )}
              <View style={st.statBox}><CountUp to={conceptTotal} style={st.statNum} /><Text style={st.statLbl}>Concepts</Text></View>
              <View style={st.statBox}><CountUp to={studyMin} style={st.statNum} /><Text style={st.statLbl}>{studyMin === 1 ? 'Minute' : 'Minutes'}</Text></View>
            </Appear>

            {conceptResults.length > 0 && (
              <View style={st.masteryPanel}>
                <View style={st.masteryTop}>
                  <Text style={st.masteryLabel}>Concept mastery</Text>
                  <Text style={st.masteryScore}>{mastered}/{conceptResults.length}</Text>
                </View>
                <View style={st.masteryDots}>
                  {conceptResults.map((r, i) => (
                    <View key={i} style={[st.mDot, r.correct ? st.mDotOk : st.mDotWeak]} />
                  ))}
                </View>
                {weakConcepts.length > 0 && (
                  <Text style={st.masteryWeak} numberOfLines={2}>Revisit: {weakConcepts.map((w) => w.title).join(' · ')}</Text>
                )}
              </View>
            )}

            <Text style={st.recoTxt}>{memoryNext || (accuracy != null && accuracy >= 80 ? 'You’ve got this — ready for a new topic?' : 'A quick replay will lock it in.')}</Text>

            {(flashcards.length > 0 || testQs.length > 0) && (
              <View style={st.studyRow}>
                {flashcards.length > 0 && (
                  <PressableScale style={st.studyBtn} onPress={() => setDeckOpen(true)} accessibilityLabel="Review flashcards">
                    <Layers size={17} color="#DBA53F" strokeWidth={2.3} />
                    <Text style={st.studyTxt}>Flashcards</Text>
                  </PressableScale>
                )}
                {testQs.length > 0 && (
                  <PressableScale style={st.studyBtn} onPress={() => setTestOpen(true)} accessibilityLabel="Test yourself">
                    <GraduationCap size={18} color="#DBA53F" strokeWidth={2.3} />
                    <Text style={st.studyTxt}>Test yourself</Text>
                  </PressableScale>
                )}
              </View>
            )}

            <View style={st.doneRow}>
              <PressableScale style={[st.doneBtn, st.doneGhost]} onPress={() => { stopTeacher(); onExit && onExit(); }} accessibilityLabel="Finish and exit"><Text style={st.doneGhostTxt}>Done</Text></PressableScale>
              <PressableScale style={[st.doneBtn, st.donePrimary]} onPress={onReplayLesson} accessibilityLabel="Replay the lesson">
              <RotateCcw size={15} color="#fff" strokeWidth={2.6} />
              <Text style={st.donePrimaryTxt}>Replay</Text>
            </PressableScale>
            </View>
            {!!onNewLesson && (
              <PressableScale onPress={onNewLesson} style={st.doneNew} accessibilityLabel="Start a new topic"><Text style={st.doneNewTxt}>Learn a new topic</Text></PressableScale>
            )}
          </Appear>
        </View>
      )}

      {/* ── study features (jump-around contents/notes · flashcards · self-test) ── */}
      <ContentsSheet
        visible={contentsOpen}
        scenes={scenes}
        currentIdx={idx}
        saved={savedNotes}
        onToggleSave={toggleSaveNote}
        onJump={(i) => goTeach(i)}
        onClose={() => setContentsOpen(false)}
        recap={recap}
        formulas={formulas}
        lessonTitle={lessonTopic}
        noteText={noteText}
        onChangeNoteText={onChangeNoteText}
        visited={visited}
        results={conceptResults}
        onExplainFormula={onAsk ? (f) => { setContentsOpen(false); sendDoubt(`Explain this formula and what each symbol means, briefly: ${f}`); } : undefined}
      />
      <FlashcardDeck visible={deckOpen} cards={flashcards} onClose={() => setDeckOpen(false)} lessonKey={lessonKey} />
      <TestSheet visible={testOpen} questions={testQs} onClose={() => setTestOpen(false)} onScore={() => {}} />
    </View>
  );
}

// ── THE LIT CLASSROOM ─────────────────────────────────────────────────────────
// Built on the app's studentTheme tokens so a lesson sits inside the product
// rather than beside it. Three deliberate depth planes, quietest to loudest:
//   0  the room      S.canvas          — never competes for attention
//   1  chrome        S.card + S.hair   — header, teacher bar, caption, dock
//   2  the board     S.card + shadow   — the ONE elevated surface; it is the lesson
// Elevation does the separating, not colour, so the eye lands on the whiteboard
// first every time. Contrast is held at WCAG AA for every piece of running text
// (see capDim — the not-yet-spoken words stay readable, only quieter).
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: S.canvas },
  paperFaint: { opacity: 0.35 },

  // header (fixed) — leave · what we're on · mute · ⋯ . Four things, because the
  // fifth one is always the one tapped by accident.
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SP.md, paddingTop: SP.sm, paddingBottom: SP.sm },
  barIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: S.card, borderWidth: 1, borderColor: S.border },
  headTxt: { flex: 1, minWidth: 0 },
  headTopic: { fontSize: 14, fontFamily: F.xbold, color: S.ink, letterSpacing: -0.2 },
  headPos: { fontSize: 10, fontFamily: F.bold, color: S.muted, letterSpacing: 0.7, textTransform: 'uppercase', marginTop: 1 },

  // ⋯ sheet — set-once controls, kept off the bar
  menuScrim: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  menu: { position: 'absolute', top: 52, right: SP.md, zIndex: 21, backgroundColor: S.card, borderRadius: R.lg, borderWidth: 1, borderColor: S.hair, paddingVertical: 6, minWidth: 178, ...shadow },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: SP.md },
  menuTxt: { fontSize: 13.5, fontFamily: F.semi, color: S.ink },

  // completion: "today you learned" checklist + count-up stats + adaptive next line
  learnedWrap: { alignSelf: 'stretch', marginTop: SP.md, gap: 8 },
  learnedHead: { fontSize: 11, fontFamily: F.xbold, color: S.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2, textAlign: 'left' },
  learnedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  learnedTick: { width: 20, height: 20, borderRadius: 10, backgroundColor: S.emeraldSoft, alignItems: 'center', justifyContent: 'center' },
  learnedTxt: { flex: 1, fontSize: 14, fontFamily: F.semi, color: S.sub },
  statRow: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'center', gap: 30, marginTop: SP.lg },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 26, fontFamily: F.black, color: S.indigo, letterSpacing: -0.5 },
  statLbl: { fontSize: 10, fontFamily: F.bold, color: S.muted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  recoTxt: { fontSize: 12.5, fontFamily: F.med, color: S.muted, textAlign: 'center', marginTop: SP.lg },

  scroll: { flex: 1 },
  scrollBody: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16 },
  scrollTop: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16 },

  doneNew: { marginTop: SP.md, paddingVertical: SP.sm, alignSelf: 'center' },
  doneNewTxt: { fontSize: 13, fontFamily: F.bold, color: S.indigo, letterSpacing: 0.2 },

  // teacher hero + speaking waveform
  banner: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingTop: SP.sm },
  heroStage: { alignItems: 'center', justifyContent: 'center' },
  waveWrap: { height: 38, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 10 },
  wave: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', height: 38, gap: 3 },
  waveBar: { width: 4, borderRadius: 3 },
  waveMini: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 24, gap: 3, paddingRight: 4 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: SP.md, backgroundColor: S.card, borderWidth: 1, borderColor: S.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  badgeOn: { borderColor: S.emerald },
  badgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: S.faint },
  badgeDotOn: { backgroundColor: S.emerald },
  badgeTxt: { fontSize: 11, fontFamily: F.bold, color: S.muted, letterSpacing: 0.8, textTransform: 'lowercase' },
  badgeTxtOn: { color: S.ink },

  caption: { alignSelf: 'center', alignItems: 'center', marginTop: SP.lg, maxWidth: SCREEN_W - SP.xl, paddingVertical: SP.md, paddingHorizontal: SP.lg, borderRadius: R.xl, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair },
  askedLabel: { fontSize: 11, fontFamily: F.bold, color: S.muted, textAlign: 'left', marginBottom: 8, letterSpacing: 0.3, fontStyle: 'italic' },

  // doubt metadata strip (source / confidence / concept / prerequisites) — recessed
  // one step (S.canvas inside a white card) so it reads as footnotes, not content.
  metaWrap: { marginTop: 14, gap: 8, alignSelf: 'stretch', backgroundColor: S.canvas, borderRadius: R.md, borderWidth: 1, borderColor: S.hair, padding: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: S.card, borderWidth: 1, borderColor: S.border, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  metaPillOn: { backgroundColor: S.emeraldSoft, borderColor: S.emerald },
  metaPillTxt: { fontSize: 10, fontFamily: F.bold, color: S.muted, letterSpacing: 0.3 },
  // "on" state darkens the label rather than tinting it — S.emerald on S.emeraldSoft
  // is only 2.7:1, so the tint stays on the fill/border where contrast rules differ.
  metaPillTxtStrong: { color: S.sub, fontFamily: F.xbold },
  metaDot: { width: 6, height: 6, borderRadius: 3 },
  metaConcept: { fontSize: 12, fontFamily: F.semi, color: S.muted },
  metaConceptName: { color: S.ink, fontFamily: F.xbold },
  metaPrereqRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  metaPrereqLbl: { fontSize: 9.5, fontFamily: F.xbold, color: S.muted, letterSpacing: 0.6, textTransform: 'uppercase' },
  metaChip: { backgroundColor: S.indigoSoft, borderWidth: 1, borderColor: S.indigoSoft, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3 },
  metaChipTxt: { fontSize: 10.5, fontFamily: F.bold, color: S.indigo },

  // Karaoke caption. The three states must be tellable apart at a glance WITHOUT
  // relying on the dim one being unreadable — a student reads ahead of her voice.
  captionTxt: { fontSize: 16, fontFamily: F.med, color: S.ink, textAlign: 'left', lineHeight: 25, letterSpacing: 0.1 }, // spoken
  capDim: { color: S.muted },                          // not yet spoken — 5.9:1 on white, still AA
  capHot: { color: S.indigo, fontFamily: F.xbold },    // keyword, the instant it is spoken


  // optional student camera PiP
  camWrap: { alignItems: 'center', gap: 5 },
  camFrame: { width: CAM_W, height: CAM_H, borderRadius: R.lg, borderWidth: 2, borderColor: S.border, overflow: 'hidden', backgroundColor: S.hair },
  camFrameOn: { borderColor: S.indigo },
  camMask: { flex: 1, borderRadius: R.md, overflow: 'hidden' },
  camFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: S.hair },
  camLbl: { fontSize: 10, fontFamily: F.bold, color: S.muted },
  camLblOn: { color: S.indigo },

  // ── THE SLATE → her words ──
  lessonScroll: { flexGrow: 1, paddingHorizontal: SP.md, paddingTop: SP.xs, paddingBottom: SP.md },

  // She is a chip ON the slate, not a row above it: same information (who, doing
  // what) at a fifth of the height, and the board keeps what she gave back.
  slateTop: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginBottom: SP.xs },
  speakChip: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: 'rgba(239,193,82,0.28)', borderRadius: R.pill, paddingVertical: 3, paddingHorizontal: 8, paddingLeft: 3 },
  speakName: { fontSize: 11, fontFamily: F.xbold, color: C.ink, letterSpacing: -0.1 },
  speakState: { fontSize: 9, fontFamily: F.bold, color: C.accent, letterSpacing: 0.8, textTransform: 'uppercase' },
  slateExpand: { marginLeft: 'auto', width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },

  workArea: { width: '100%', alignItems: 'stretch' },
  // Chalk, on the slate — so the title reads as something she wrote up there
  // rather than a caption the app printed above her board.
  kicker: { fontSize: 10, fontFamily: F.xbold, color: C.accent, letterSpacing: 1.8, textTransform: 'uppercase', alignSelf: 'stretch', marginBottom: 2 },
  title: { fontSize: 19, fontFamily: F.black, color: C.ink, letterSpacing: -0.3, alignSelf: 'stretch', lineHeight: 25, marginBottom: SP.sm },

  boardOuter: { width: '100%', alignItems: 'center' },
  lessonCard: { width: '100%', backgroundColor: C.board, borderRadius: R.xxl, paddingVertical: SP.md, paddingHorizontal: SP.md, alignItems: 'center', borderWidth: 1, borderColor: C.line, ...shadow },
  boardHolder: { alignSelf: 'stretch' },

  // Progress reads on the slate, where the lesson is — one dot per concept, filled
  // as she gets through them. Suppressed past 14 so it never becomes a grey ruler.
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: SP.sm },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.16)' },
  dotOn: { backgroundColor: C.accent },

  // her words, under the slate — plain text on the room, not another card. It is
  // one sentence; boxing it made the screen read as three stacked panels.
  captionWrap: { width: '100%', marginTop: SP.md, paddingHorizontal: SP.xs },

  // ── IMMERSIVE STAGE ────────────────────────────────────────────────────────
  // The slate stops being a card in a scroll and becomes the room: it takes the
  // leftover height, loses its side margins, and her line sits under it.
  lessonScrollFull: { flexGrow: 1, paddingHorizontal: SP.sm, paddingTop: 0, paddingBottom: SP.sm },
  workAreaFull: { flex: 1, width: '100%', alignItems: 'stretch', justifyContent: 'center' },
  titleFull: { fontSize: 17, fontFamily: F.black, color: C.ink, letterSpacing: -0.3, alignSelf: 'stretch', lineHeight: 23, marginBottom: SP.xs },
  boardOuterFull: { flex: 1, width: '100%', alignItems: 'stretch', justifyContent: 'center' },
  lessonCardFull: { flex: 1, width: '100%', backgroundColor: C.board, borderRadius: R.xl, paddingVertical: SP.md, paddingHorizontal: SP.md, alignItems: 'center', overflow: 'hidden', ...shadow },
  boardHolderFull: { flex: 1, alignSelf: 'stretch' },
  // A short board still sits in the middle of the slate; a tall one scrolls from
  // the top instead of being centred until it clips off both ends.
  boardHolderContent: { flexGrow: 1, justifyContent: 'center' },

  // Caption stays a real surface rather than floating text on the board — text over
  // a drawing is unreadable the moment a chalk line runs under it.
  captionWrapFull: { width: '100%', marginTop: SP.sm, paddingHorizontal: SP.xs, maxHeight: 132 },

  // bottom (fixed): status → dock
  bottom: { alignItems: 'center', paddingHorizontal: SP.md, paddingTop: SP.sm, paddingBottom: Platform.OS === 'ios' ? SP.lg : SP.md, gap: SP.sm },

  listenTxt: { fontSize: 13, fontFamily: F.bold, color: S.ink, textAlign: 'center', paddingHorizontal: 26 },
  hint: { fontSize: 12.5, fontFamily: F.med, color: S.muted, textAlign: 'center' },

  // listening / typed-doubt / resume
  resumeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: S.indigo, borderRadius: R.pill, paddingVertical: 13, paddingHorizontal: 26, ...shadowSm },
  resumeTxt: { color: '#fff', fontSize: 14, fontFamily: F.bold },
  starterRow: { alignSelf: 'stretch', gap: 6, marginBottom: SP.sm },
  starterChip: { alignSelf: 'stretch', backgroundColor: 'rgba(219,165,63,0.08)', borderWidth: 1, borderColor: 'rgba(219,165,63,0.3)', borderRadius: R.md, paddingVertical: 10, paddingHorizontal: 14 },
  starterTxt: { fontSize: 13, fontFamily: F.med, color: '#DBA53F' },
  askRow: { flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'stretch' },
  askInput: { flex: 1, backgroundColor: S.card, borderWidth: 1, borderColor: S.border, borderRadius: R.pill, paddingVertical: 13, paddingHorizontal: 20, color: S.ink, fontSize: 14, fontFamily: F.med },
  askSend: { width: 48, height: 48, borderRadius: 24, backgroundColor: S.indigo, alignItems: 'center', justifyContent: 'center', ...shadowSm },

  // floating dock — one primary (Ask) and four quiet transport controls. The mic is
  // the only filled circle, so "talk to her" stays the obvious action.
  dock: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', alignSelf: 'stretch',
    backgroundColor: S.card, borderWidth: 1, borderColor: S.border, borderRadius: R.pill,
    paddingHorizontal: SP.sm, paddingVertical: SP.sm, ...shadow,
  },
  dItem: { alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 52 },
  dGhost: { width: 42, height: 42, borderRadius: 21, backgroundColor: S.canvas, borderWidth: 1, borderColor: S.hair, alignItems: 'center', justifyContent: 'center' },
  dMic: { width: 56, height: 56, borderRadius: 28, backgroundColor: S.indigo, alignItems: 'center', justifyContent: 'center', shadowColor: S.indigo, shadowOpacity: 0.38, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  dMicOn: { backgroundColor: S.red, shadowColor: S.red },
  dLbl: { fontSize: 9.5, fontFamily: F.bold, color: S.muted, letterSpacing: 0.2, marginTop: 1 },
  dLblPrimary: { color: S.indigo },

  // completed — the room dims behind a white sheet (scrim is S.ink, not black, so
  // it reads as the same product going quiet rather than a different app)
  doneOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(21,24,41,0.45)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  doneCard: { width: '100%', backgroundColor: S.card, borderRadius: R.xxl, padding: 30, alignItems: 'center', ...shadow },
  doneEmoji: { fontSize: 46 },
  doneTitle: { fontSize: 22, fontFamily: F.black, color: S.ink, marginTop: SP.md, letterSpacing: -0.5 },
  doneSub: { fontSize: 13.5, fontFamily: F.med, color: S.muted, textAlign: 'center', marginTop: SP.sm, lineHeight: 20 },
  doneRow: { flexDirection: 'row', gap: 12, marginTop: SP.xl, alignSelf: 'stretch' },
  doneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, flex: 1, paddingVertical: 15, borderRadius: R.md },
  donePrimary: { backgroundColor: S.indigo, ...shadowSm },
  donePrimaryTxt: { color: '#fff', fontSize: 14, fontFamily: F.bold },
  doneGhost: { backgroundColor: S.canvas, borderWidth: 1, borderColor: S.border },
  doneGhostTxt: { color: S.sub, fontSize: 14, fontFamily: F.bold },

  // ── Restored from the pre-merge StyleSheet ──────────────────────────────
  // The markup that reads these (the mastery panel, the study strip, the
  // thinking row, the tappable caption term) survived the merge, but their
  // definitions sat in a block the merge resolved away. Values are verbatim,
  // so the dark-stage palette (D.*, ACCENT) they were designed against holds.
  capTerm: { textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: 'rgba(219,165,63,0.6)' }, // tappable key term → tap to define
  masteryDots: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  masteryLabel: { fontSize: 10.5, fontFamily: F.bold, color: D.textDim, letterSpacing: 1.4, textTransform: 'uppercase' },
  masteryPanel: { alignSelf: 'stretch', marginTop: SP.lg, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: R.lg, padding: SP.md },
  masteryScore: { fontSize: 14, fontFamily: F.bold, color: '#DBA53F' },
  masteryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  masteryWeak: { fontSize: 11.5, fontFamily: F.med, color: D.textDim, marginTop: 10, lineHeight: 16 },
  mDot: { width: 20, height: 6, borderRadius: 3 },
  mDotOk: { backgroundColor: '#2DBB78' },
  mDotWeak: { backgroundColor: '#E9A23B' },
  metaHeader: { fontSize: 9.5, fontFamily: F.bold, color: ACCENT_DIM, letterSpacing: 1.6, textTransform: 'uppercase' },
  studyBtn: { flexGrow: 1, flexBasis: '30%', minWidth: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 6, borderRadius: R.md, backgroundColor: 'rgba(219,165,63,0.10)', borderWidth: 1, borderColor: 'rgba(219,165,63,0.38)' },
  studyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SP.lg, alignSelf: 'stretch', justifyContent: 'center' },
  studyTxt: { fontSize: 12.5, fontFamily: F.bold, color: '#DBA53F', letterSpacing: 0.1 },
  thinkDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT },
  thinkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  thinkTxt: { fontSize: 13, fontFamily: F.semi, color: D.textDim, marginLeft: 6, letterSpacing: 0.2 },
});
