import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Easing, Dimensions, Platform, TextInput, Image, Modal,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LessonBoard from './LessonBoards';
import TeacherAvatar from './TeacherAvatar';
import TeacherFullBody from './TeacherFullBody';
import { TEACHER_PHOTO as TEACHER_HERO_PHOTO, TEACHER_VIDEO as TEACHER_HERO_VIDEO, TEACHER_STAGE_CLIP, TEACHER_HEADSHOT } from './teacherIdentity';
import useTeacherIdentity from './useTeacherIdentity';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import VoicePicker from './VoicePicker';
import { directLesson } from './teachingDirector';
import { focusTarget } from './cameraDirector';
import { freshLearner, observe, assess } from './emotionEngine';
import { ACTIONS, freshPedagogy, observePedagogy, decideNextAction, personalizedRecap, continuationHint, openingBridge } from './pedagogyEngine';
import { postCheckOutcome } from '../../api/aiApi';
import { C, D, F, SP, GLASS, GRAD, R, SERIF } from './premiumTheme';
import { PressableScale, Gradient } from './uiKit';
import { FollowUpChips, ContentsSheet, FlashcardDeck, TestSheet, loadNotes, saveNotes, loadNoteText, saveNoteText, buildFlashcards, buildTest, buildFormulas, buildRecap } from './lessonExtras';
import BoardSurface, { surfaceFor } from './boardSurfaces';
import { EraserWipe } from './boardGestures';
import { AmbientStage, VoiceAura } from './ambientStage';
import { expressionForScene, praiseLine, reassureLine, listeningLine, completeLine, resumeBridge } from './teacherPersona';
import { buildReteach } from './reteach';
import { speakTeacher, stopTeacher, primeTeacherVoice, getSpeechProgress, SPEECH_OK, speakTeacherQueued, resetTeacherQueue, isTeacherQueueActive, setListeningMode } from '../../utils/teacherVoice';
import {
  Mic, Square, RotateCcw, SkipForward, SkipBack, Play, Pause, ArrowUp, ChevronLeft, AudioLines,
  Volume2, VolumeX, RefreshCw, GraduationCap, BookOpen, Globe, Check, Trophy, Radio, ListTree, Layers, Maximize2, Minimize2,
  Ellipsis, Camera, Pencil, Eraser, Type, ChevronDown, ChevronRight, Undo2, FileText,
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
// Comfortable touch expansion for the 34px top-bar icons (keeps the frozen visual
// size but reaches the ~44px accessible target).
const BAR_HIT = { top: 8, bottom: 8, left: 8, right: 8 };

// The room backdrop — the exact deep navy-indigo the user supplied as a swatch, not
// an approximation. Matches V.ground/V.ground2 below.
const ROOM_GRAD = ['#FFFFFF', '#FFFFFF', '#FFFFFF'];   // white page, per the design
const ACCENT = '#FFC629';      // yellow — send button, active tool, highlights
const ACCENT_DIM = '#8A6A00';  // accent as TEXT — raw yellow fails on white
// premiumTheme's C.ink2/C.dim are a pale "chalk on dark slate" set — correct for a
// dark board, but the wbCard below is a WHITE surface, so that pale chalk renders as
// near-invisible icons/labels on it. Same override values as LessonBoards/subjectBoards.
const INK2 = '#5B6472';
const INK_DIM = '#7A8592';
const GLASS_PANEL = 'rgba(255,255,255,0.86)';   // light frosted glass over the video
const GLASS_HAIR = 'rgba(17,17,17,0.08)';  // hairline on the light glass

// ── SESSION CHROME (approved mockup, Jul 2026) ────────────────────────────────
// The live lesson is framed like a video class: a dark app ground, a violet
// "teacher on camera" card, a white whiteboard card, an ask bar, and a session
// action bar. These tokens own that chrome only — the BOARD ITSELF still renders
// from the light `C` tokens in LessonBoards, so no SVG board changes.
const V = {
  ground: '#FFFFFF',        // page
  ground2: '#FFFFFF',       // ask bar / action bar sit on the page, separated by a hairline
  hair: 'rgba(17,17,17,0.10)',
  hairSoft: 'rgba(17,17,17,0.06)',
  text: '#111111',
  textDim: '#666666',
  textFaint: '#9B9B9B',
  violet: '#FFC629',        // ACCENT — send button, active tool, highlights (name kept)
  violetDeep: '#E8B01F',
  violetSoft: '#FFF4CC',
  live: '#EF4444',          // the Live pill + End Session stay red, as drawn
  liveSoft: 'rgba(239,68,68,0.12)',
  paper: '#F1F1F3',         // whiteboard card — light grey, as drawn
  paperEdge: 'rgba(17,17,17,0.08)',
  paperDim: '#FFFFFF',      // tool rail sits WHITE on the grey board
};
// The teacher card's violet stage — Figma's exact Primary Light → Primary, deepening
// to the existing violetDeep token. Previously three invented hex values with no
// relationship to the design system; now every stop is either a Figma-specified
// color or a token already used elsewhere in this file.
const CAM_GRAD = ['#A855F7', '#7C3AED', '#5B32C4'];   // the video stage stays violet
const CARD_R = 26;
// Figma's spacing grid is 4/8/12/16/24/32/48/64 — SP.lg (20, from the shared theme)
// is not one of those steps, so it can't be reused here without inheriting an
// off-grid value. 24 is this screen's literal per the design system (not SP.xl,
// which is 28 — also off-grid); premiumTheme.js's SP scale itself is shared by other
// screens and out of scope to change for this one screen's audit. Both the
// ScrollView's own padding and the hero-photo crop math (which needs the card's true
// rendered width) read from this one constant so they can never drift apart.
const SCREEN_MARGIN = 24;
// Explicit screen-proportion budget, re-measured against the reference so the WHOLE
// session (header, teacher card, board, ask bar, nav) fits in one viewport with no
// scroll — the reference never needs to scroll to see the action bar. 52% for the
// board was too generous once the header/footer chrome is accounted for; it pushed
// the layout past 100% of the screen and forced a scroll the reference doesn't have.
const CAM_CARD_FRAC = 0.27;
const BOARD_MIN_FRAC = 0.42;

// TEACHER_HERO_PHOTO (assets/teacher-avatar.png) and the matching talking clip
// (assets/teacher-tahlia.mp4) are a 1283×1080 BUST of Tahlia on a TRANSPARENT
// background — the violet stage behind her is what fills the frame.
//
// She is shown WHOLE: everything the asset contains — crown, face, both shoulders,
// collar and shirt — is inside the card, never cropped. The card is landscape and
// she is portrait, so fitting her whole means she is scaled DOWN and the violet
// stage shows either side of her. That empty stage is deliberate, not a gap to
// close: cropping her to fill the width is what cut her chin off before.
//
// The geometry is driven by where she ACTUALLY sits on the canvas — her opaque
// alpha bounding box, measured off the asset rather than eyeballed:
//   x 203–1107  (she is a touch right of centre)
//   y  54–1079  (hair crown 5% down; the canvas ends at her chest, so the art has
//                 no waist or legs — a talking-head export, not a full-body one)
//
// ⚠ THESE ARE ASSET-SPECIFIC. If the photo/clip is replaced, re-measure the alpha
// bbox on the new file (any image tool, or sharp's extractChannel(3)) and update
// the four numbers below. Nothing else needs to move.
const HERO_PHOTO_W = 1283;
const HERO_PHOTO_H = 1080;
const HERO_BBOX_X0 = 203;
const HERO_BBOX_X1 = 1107;
const HERO_BBOX_Y0 = 54;
const HERO_BBOX_Y1 = 1079;
// A little headroom above her crown so she is not jammed against the card's top
// edge. Her chest runs to the bottom edge, which is where the asset itself ends.
const HERO_HEADROOM = 0.96;
const CAM_CARD_W = SCREEN_W - SCREEN_MARGIN * 2;   // matches sessionScroll's horizontal padding
const CAM_CARD_H = SCREEN_H * CAM_CARD_FRAC;
// Scale the whole canvas so her bbox fits INSIDE the card on both axes (a contain
// fit, taken on the bbox rather than the canvas so the transparent margins don't
// eat the budget). On a landscape card the height binds; the width guard keeps her
// whole on a short, wide screen too.
const HERO_BBOX_W = HERO_BBOX_X1 - HERO_BBOX_X0;
const HERO_BBOX_H = HERO_BBOX_Y1 - HERO_BBOX_Y0;
const HERO_SCALE = Math.min(
  (CAM_CARD_H * HERO_HEADROOM) / HERO_BBOX_H,
  (CAM_CARD_W * 0.92) / HERO_BBOX_W,
);
const HERO_FULL_W = HERO_PHOTO_W * HERO_SCALE;
const HERO_FULL_H = HERO_PHOTO_H * HERO_SCALE;
// Centre her bbox horizontally, and sit its bottom on the card's bottom edge so
// the chest-height cut in the art reads as the frame ending, not as her floating.
const HERO_LEFT = CAM_CARD_W / 2 - ((HERO_BBOX_X0 + HERO_BBOX_X1) / 2) * HERO_SCALE;
const HERO_TOP = CAM_CARD_H - HERO_BBOX_Y1 * HERO_SCALE;

// The talking clip is the SAME shot at a different crop — 1920×1080 where the still
// is 1283×1080 — so it needs its own numbers rather than the still's. Fitting each
// on its own bbox is what makes the swap invisible: she lands at x 72.9–269.1 from
// the clip against x 74.5–267.5 from the still, under 2dp apart, so nothing shifts
// when she starts talking. (Same caveat as above: re-measure on a new export.)
const CLIP_W = 1920;
const CLIP_H = 1080;
const CLIP_BBOX_X0 = 494;
const CLIP_BBOX_X1 = 1407;
const CLIP_BBOX_Y0 = 61;
const CLIP_BBOX_Y1 = 1079;
const CLIP_SCALE = Math.min(
  (CAM_CARD_H * HERO_HEADROOM) / (CLIP_BBOX_Y1 - CLIP_BBOX_Y0),
  (CAM_CARD_W * 0.92) / (CLIP_BBOX_X1 - CLIP_BBOX_X0),
);
// The clip carries the violet stage baked in (see scripts/bake-teacher-clip.js), so
// unlike the transparent still it covers the whole card — which is exactly what
// keeps the background from flickering as she starts and stops speaking.
const CLIP_FULL_W = CLIP_W * CLIP_SCALE;
const CLIP_FULL_H = CLIP_H * CLIP_SCALE;
const CLIP_LEFT = CAM_CARD_W / 2 - ((CLIP_BBOX_X0 + CLIP_BBOX_X1) / 2) * CLIP_SCALE;
const CLIP_TOP = CAM_CARD_H - CLIP_BBOX_Y1 * CLIP_SCALE;

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

// Stickers thrown across the finish card. Emoji rather than images: they need no
// asset, scale on every density, and already carry the tone.
//
// Each one is a fixed, hand-chosen vector — angle, distance, spin, delay — not
// Math.random(). A burst re-rolled on every render jitters when the card
// re-renders mid-flight, and a fixed set is also the same celebration for every
// student, which is easier to judge than one that differs each run.
const STICKERS = [
  { e: '🎉', x: -128, y: -96,  r: -28, d: 0,   s: 1.15 },
  { e: '⭐', x: 118,  y: -84,  r: 24,  d: 90,  s: 1.0 },
  { e: '✨', x: -92,  y: 74,   r: 14,  d: 170, s: 0.9 },
  { e: '🏆', x: 104,  y: 88,   r: -18, d: 250, s: 1.05 },
  { e: '👏', x: -18,  y: -132, r: 8,   d: 330, s: 0.95 },
  { e: '🌟', x: 36,   y: 122,  r: -12, d: 410, s: 0.85 },
];

function Stickers() {
  const a = useRef(new Animated.Value(0)).current;
  const reduce = useRef(false);
  useEffect(() => {
    let alive = true;
    // A burst is exactly the kind of motion that makes some people ill, and the
    // card reads fine without it.
    AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (!alive) return;
      reduce.current = on;
      if (on) { a.setValue(1); return; }
      Animated.timing(a, {
        toValue: 1, duration: 900, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true,
      }).start();
    }).catch(() => {
      Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }).start();
    });
    return () => { alive = false; };
  }, [a]);

  return (
    <View style={st.stickerLayer} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {STICKERS.map((s, i) => (
        <Animated.Text
          key={i}
          style={[
            st.sticker,
            {
              opacity: a.interpolate({ inputRange: [0, 0.25, 0.85, 1], outputRange: [0, 1, 1, 0.9] }),
              transform: [
                { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [0, s.x] }) },
                { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, s.y] }) },
                { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${s.r}deg`] }) },
                { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.2, s.s] }) },
              ],
            },
          ]}
        >{s.e}</Animated.Text>
      ))}
    </View>
  );
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
  return <Animated.View style={{ height: 3, borderRadius: 2, backgroundColor: ACCENT, marginTop: 7, width: a.interpolate({ inputRange: [0, 1], outputRange: ['0%', '34%'] }) }} />;
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
            height: v.interpolate({ inputRange: [0, 1], outputRange: [3, max] }),
            backgroundColor: i % 2 ? ACCENT_DIM : ACCENT,
            opacity: active ? 0.95 : 0.28,
          }]} />
        );
      })}
    </View>
  );
}

// ── floating corner teacher — circular avatar that slides in to the top-right ──
// `cam` is the Camera Director's rack-focus (0 teacher · 1 board): she grows and
// brightens when the shot is on HER, and eases back a touch when it's on the board.
// ── Session clock — MM:SS since the lesson opened, ticking once a second ──────
// Its own component so the 1 Hz tick re-renders eight characters of text and not
// the whole player (which owns the TTS/Director state machine).
function SessionClock({ since, style }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.max(0, Math.floor((now - since) / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return <Text style={style} accessibilityLabel={`Session time ${mm} minutes ${ss} seconds`}>{mm}:{ss}</Text>;
}

// ── "Live" pill — the red status dot breathes while she's actually speaking ────
function LivePill({ active }) {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) { p.setValue(0); return undefined; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(p, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(p, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [active, p]);
  return (
    <View style={st.livePill} accessibilityLabel={active ? 'Live — teacher is speaking' : 'Live'}>
      <Animated.View style={[st.liveDot, { opacity: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) }]} />
      <Text style={st.liveTxt}>Live</Text>
    </View>
  );
}

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
        ? <View style={[st.dMic, st.dMicOn]}><Square size={20} color="#fff" fill="#fff" /></View>
        : <Gradient colors={GRAD.ink} style={st.dMic}><Mic size={24} color="#fff" strokeWidth={2.3} /></Gradient>}
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
  const tierColor = tier === 'high' ? C.green : tier === 'medium' ? C.orange : C.dim;
  return (
    <View style={st.metaWrap}>
      <Text style={st.metaHeader}>Answer details</Text>
      <View style={st.metaRow}>
        {grounded != null && (
          <View style={[st.metaPill, grounded ? st.metaPillOn : null]}>
            {grounded
              ? <BookOpen size={11} color={C.teal} strokeWidth={2.4} />
              : <Globe size={11} color={D.textDim} strokeWidth={2.4} />}
            <Text style={[st.metaPillTxt, grounded ? st.metaPillTxtOn : null]}>
              {grounded ? 'From your material' : 'General knowledge'}
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
  // On edge-to-edge Android, nothing insets the screen from the system nav bar —
  // without this the End Session action row sits directly under the phone's own
  // back/home/recent buttons instead of clearing them.
  const insets = useSafeAreaInsets();
  // The teacher matching the voice the student is actually hearing — the name
  // follows the fallback, so a male device voice is not introduced as Ms. Nova.
  const teacher = useTeacherIdentity();
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
  // The session scroll must always open on the teacher card, never wherever a PREVIOUS
  // scene happened to leave it scrolled to — otherwise a new scene can silently render
  // "scrolled past" the camera card with no visual cue that anything is wrong.
  const sessionScrollRef = useRef(null);
  useEffect(() => {
    const toTop = () => sessionScrollRef.current && sessionScrollRef.current.scrollTo({ y: 0, animated: false });
    toTop();
    // On a cold mount (especially resuming a saved lesson straight into a later scene)
    // the ScrollView hasn't measured its content yet when this effect first runs, so
    // the scrollTo above can be a no-op — a second call next frame, once content has
    // actually laid out, is what makes it stick.
    const raf = requestAnimationFrame(toTop);
    return () => cancelAnimationFrame(raf);
  }, [idx]);
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
  const [contentsTab, setContentsTab] = useState('contents');
  const openContents = (tab) => { setContentsTab(tab); setContentsOpen(true); };
  const [focusMode, setFocusMode] = useState(false); // distraction-free reading
  // Session-chrome state (see the mockup): whiteboard tool rail, student self-view,
  // the "…" overflow menu, and whether the ask bar is collapsed.
  const [tool, setTool] = useState('pen');
  const [selfView, setSelfView] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [askCollapsed, setAskCollapsed] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]); // saved concept indices
  const [noteText, setNoteText] = useState('');     // the student's own free-text note
  const [conceptResults, setConceptResults] = useState([]); // {i,title,correct} from checks
  const [visited, setVisited] = useState([]);       // concept indices seen (for the progress map)
  const openedAtRef = useRef(Date.now());           // for the study-time stat
  const lessonKey = useMemo(() => String((lesson && (lesson.id || lesson.lessonId || lesson.lessonTitle)) || subject || 'lesson'), [lesson, subject]);
  // Bounded to what's been taught so far (idx), not the whole lesson — these are all
  // now reachable mid-lesson (Flashcards/Test/Slides chips below), and an unbounded
  // deck would hand the student flashcards/questions/formulas for concepts she
  // hasn't explained yet. At the lesson's last scene this is identical to the whole
  // array, so end-of-lesson behaviour (Done screen, full Review) is unchanged.
  const scenesSoFar = useMemo(() => scenes.slice(0, idx + 1), [scenes, idx]);
  const flashcards = useMemo(() => buildFlashcards(scenesSoFar), [scenesSoFar]);
  const testQs = useMemo(() => buildTest(scenesSoFar), [scenesSoFar]);
  const formulas = useMemo(() => buildFormulas(scenesSoFar), [scenesSoFar]);
  const recap = useMemo(() => buildRecap(scenesSoFar), [scenesSoFar]);
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

  // ── Her talking clip on the camera card ───────────────────────────────────
  // Mounted for the WHOLE session and parked on its first frame when she is quiet,
  // rather than swapped in and out. The clip has the violet stage baked into it, so
  // unmounting it between sentences would flash the card's own gradient every time
  // she stops; parking at 0 also rests her on a closed mouth instead of freezing
  // her mid-word. If the clip ever fails to load, the still underneath is already
  // in place and simply becomes what you see.
  const [heroClipFailed, setHeroClipFailed] = useState(false);
  const heroPlayer = useVideoPlayer(TEACHER_STAGE_CLIP, (p) => { p.loop = true; p.muted = true; });
  useEventListener(heroPlayer, 'statusChange', ({ error }) => { if (error) setHeroClipFailed(true); });
  useEffect(() => {
    if (!heroPlayer || heroClipFailed) return;
    if (ttsActive) heroPlayer.play();
    else { heroPlayer.pause(); heroPlayer.currentTime = 0; }
  }, [ttsActive, heroPlayer, heroClipFailed]);
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
        // Strategy ledger: record the rung we're about to SHOW so the next miss on this
        // same check escalates to a genuinely different re-teach (never repeats a rung).
        observeTeach({ type: 'reteach', strategy: decision.action });
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

    // Fire-and-forget: report a GRADEABLE check outcome to the server ONCE per slide
    // (reusing the conceptResults "first attempt wins" guard). Self-checks (no MCQ
    // options) never emit a mastery signal. The server only records it when
    // DIAGNOSTIC_GATE is on; any network failure is swallowed and never affects
    // playback or the pedagogy flow below.
    const checkLessonId = lesson && (lesson.id || lesson.lessonId);
    if (checkLessonId && isMcq && !conceptResults.some((r) => r.i === idx)) {
      postCheckOutcome(checkLessonId, { slideIndex: idx, correct: !!correct, concept: scene.title || scene.kicker || null }).catch(() => {});
    }

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
  const onPrev = () => { if (idx > 0) goTeach(idx - 1); };
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
      // Stay in THINKING during the answer latency (so "she's thinking" shows, not a
      // waveform over silence). We flip to ANSWERING when the first token actually
      // arrives, and ttsActive lights up only when real audio starts (queue onStart) —
      // matching the non-streaming path's honest timing.
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
        onDelta: (t) => { if (turn !== doubtTurnRef.current) return; if (!acc) setMode(M.ANSWERING); acc += t; buf += t; setQa({ q, a: acc }); flush(false); },
      })
        .then((res) => {
          if (!fresh()) return;
          setMode(M.ANSWERING); // no-op if a token already flipped it; covers an empty stream
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
          setMode(M.ANSWERING); // leave THINKING so the error + Resume button surface
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
  // ── session-chrome handlers ──
  // The camera-card rail: mic toggles live conversation when the recognizer build is
  // present, otherwise it opens the typed ask. The camera button drives the student
  // self-view and is inert (and dimmed) when no camera module is installed.
  const onMicPress = () => { if (VOICE_OK) toggleHandsFree(); else beginListen(); };
  const onCameraPress = () => {
    if (!CAMERA_OK) { setHint('Your camera isn’t available in this build — you can still talk and type.'); return; }
    setSelfView((v) => !v);
  };
  // Leaving mid-lesson used to exit on the first tap. It asks now — not to trap
  // anyone, but because the most common reason a student leaves is a distraction,
  // and the position they are about to abandon is already saved. The sheet says
  // where they are and that it will be waiting; "Leave for now" is one tap away
  // and never disabled.
  const [leaveOpen, setLeaveOpen] = useState(false);
  const endSession = () => {
    // Already finished, or nothing taught yet — nothing to come back to, so go.
    if (mode === M.COMPLETED || idx <= 0) { stopTeacher(); if (onExit) onExit(); return; }
    stopTeacher();          // stop the voice while they decide
    setLeaveOpen(true);
  };
  const leaveNow = () => { setLeaveOpen(false); stopTeacher(); if (onExit) onExit(); };
  // "Math Tutor" / "Science Tutor" — falls back to a neutral label when the lesson
  // carries no subject. `sessionLabel` names the class in the header ("Math Session")
  // so the header stays stable while the whiteboard title carries the live concept.
  const subjectName = subject ? `${String(subject).charAt(0).toUpperCase()}${String(subject).slice(1)}` : '';
  const tutorLabel = subjectName ? `${subjectName} Tutor` : 'Your Tutor';
  const sessionLabel = subjectName ? `${subjectName} Session` : 'Live Session';

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

  // Re-explanation: jump back to the concept she just taught (skip quick-checks /
  // the opener) and replay it. The 'replay' signal eases her pace, so the second
  // pass is genuinely slower and warmer — the honest, no-new-content re-teach.
  const reexplain = () => {
    feelLearner('replay'); observeTeach({ type: 'replay' });
    let j = idx - 1;
    while (j > 0 && (scenes[j].boardType === 'quickCheck' || scenes[j].boardType === 'intro')) j -= 1;
    goTeach(Math.max(0, j));
  };

  // Stable identities for the board callbacks so LessonBoard's React.memo isn't defeated
  // by these functions being re-created every render. The refs always hold the latest
  // closure, so behaviour and state are identical — only the prop identity is stabilized.
  const onNextRef = useRef(onNext); onNextRef.current = onNext;
  const quizResultRef = useRef(handleQuizResult); quizResultRef.current = handleQuizResult;
  const reexplainRef = useRef(reexplain); reexplainRef.current = reexplain;
  const onNextStable = useCallback((...a) => onNextRef.current(...a), []);
  const onQuizResultStable = useCallback((...a) => quizResultRef.current(...a), []);
  const onReexplainStable = useCallback((...a) => reexplainRef.current(...a), []);

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
  // The intro used to hide the board, so a session opened with the teacher alone and
  // the whiteboard only appeared at the second scene — which read as "the board is
  // missing". It now shows from the first beat carrying the lesson title, the way a
  // real class starts with the topic already on the board. Summary/mistake scenes
  // still need real points to be worth a board.
  const sceneHasContent = (scene.boardType === 'summary' || scene.boardType === 'mistake')
    ? hasPoints
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

  // Cross-fade the caption when it switches KIND (lesson narration ⇄ a doubt Q&A ⇄ the
  // listening prompt). Stage only animates on a NEW scene, so this in-place swap used to
  // hard-cut mid-conversation. Scene-to-scene changes keep the same kind, so this never
  // double-animates with Stage. Native-driver opacity; first render is left untouched.
  const captionKind = qa ? 'qa' : (mode === M.LISTENING ? 'listen' : 'teach');
  const capFade = useRef(new Animated.Value(1)).current;
  const capFirst = useRef(true);
  useEffect(() => {
    if (capFirst.current) { capFirst.current = false; return undefined; }
    capFade.setValue(0.35);
    const anim = Animated.timing(capFade, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [captionKind, capFade]);

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

  // The classroom dissolves in on first mount (and on resume) so the hand-off from the
  // light "preparing" screen into the dark lesson is a calm fade, not a hard light→dark
  // cut. Native-driver opacity; runs once per mount, no layout shift.
  const mountFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(mountFade, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [mountFade]);

  return (
    <Animated.View style={[st.container, { opacity: mountFade }]}>
      {/* The room: a near-black ground with a faint violet cast, so the teacher card
          and the white whiteboard are the only lit surfaces. */}
      <LinearGradient colors={ROOM_GRAD} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />

      {/* ── HEADER — back · session title/concept · Live · clock · overflow ── */}
      <View style={st.hdr}>
        <PressableScale onPress={() => { stopTeacher(); onExit && onExit(); }} style={st.hdrBack} hitSlop={BAR_HIT} accessibilityLabel="Exit lesson">
          <ChevronLeft size={26} color={V.text} strokeWidth={2.4} />
        </PressableScale>
        <View style={st.hdrTitles}>
          <Text style={st.hdrTitle} numberOfLines={1}>{sessionLabel}</Text>
          <Text style={st.hdrSub} numberOfLines={1}>{lessonTopic}</Text>
        </View>
        <LivePill active={ttsActive} />
        <SessionClock since={openedAtRef.current} style={st.hdrClock} />
        <PressableScale onPress={() => setMenuOpen(true)} style={st.hdrMore} hitSlop={BAR_HIT} accessibilityLabel="Session options">
          <Ellipsis size={20} color={V.text} strokeWidth={2.4} />
        </PressableScale>
      </View>
      {/* Hairline lesson progress — kept from the old header bar so the student can
          still see how far along the lesson is without a counter competing with the
          title row. */}
      <View style={st.hdrProgress} accessibilityRole="progressbar" accessibilityValue={{ now: Math.min(idx + 1, N), min: 0, max: N }}>
        <Animated.View style={[st.hdrProgressFill, { width: progressA.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>

      <VoicePicker visible={voiceOpen} onClose={() => setVoiceOpen(false)} />

      {/* Continuous listener for hands-free "Live conversation". Mounted independent
          of the mode so recognition runs uninterrupted; mounted only when on so it
          never contends with the tap-to-talk VoiceMic for the single mic session. */}
      {VOICE_OK && handsFree && <HandsFreeListener onBargeIn={handleBargeIn} isEcho={isLikelyEcho} onUnavailable={handleVoiceUnavailable} />}

      {/* ── THE LESSON — the teacher's camera card on top, the whiteboard under it,
          her words below. The camera card is persistent (never remounts); only the
          material inside the whiteboard transitions per scene. */}
      <ScrollView ref={sessionScrollRef} style={st.scroll} contentContainerStyle={st.sessionScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* ── TEACHER ON CAMERA — a violet "video call" stage. The photo fills the
            frame like a live feed; the violet wash keeps her tied to the brand and
            keeps the name chip / control rail legible over any backdrop. ── */}
        {!focusMode && (
        <View style={st.camCardGlow}>
        <View style={st.camCard}>
          <LinearGradient colors={CAM_GRAD} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
          {/* She is shown WHOLE — the HERO_ and CLIP_ geometry above fits her own
              measured bounding box inside the card instead of cropping her to fill
              it, so the violet either side of her is the stage, not a gap. The still
              is the base layer and the only thing left if the clip fails; the clip
              sits exactly on top of it, matched to under 2dp, and plays while she
              talks. contentFit="fill" is safe because the box it is given already
              carries the clip's own 16:9 — nothing is stretched. */}
          <Image
            source={TEACHER_HERO_PHOTO}
            resizeMode="stretch"
            accessibilityLabel="Your teacher, Ms. Nova"
            style={{ position: 'absolute', width: HERO_FULL_W, height: HERO_FULL_H, left: HERO_LEFT, top: HERO_TOP }}
          />
          {!heroClipFailed && (
            <VideoView
              player={heroPlayer}
              nativeControls={false}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              contentFit="fill"
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{ position: 'absolute', width: CLIP_FULL_W, height: CLIP_FULL_H, left: CLIP_LEFT, top: CLIP_TOP }}
            />
          )}
          <LinearGradient
            colors={['rgba(124,77,255,0.34)', 'rgba(91,50,196,0.10)', 'rgba(11,11,20,0.40)']}
            style={StyleSheet.absoluteFill} pointerEvents="none"
          />
          <View style={st.camCardHighlight} pointerEvents="none" />

          {/* identity chip */}
          <View style={st.nameChip}>
            <TeacherAvatar theme="dark" video={TEACHER_VIDEO} photo={TEACHER_HEADSHOT} state={teacherState} expression={expression} size={28} />
            <View>
              <Text style={st.nameTxt} numberOfLines={1}>{teacher.name}</Text>
              <View style={st.roleRow}>
                <GraduationCap size={9} color={V.textDim} strokeWidth={2.6} />
                <Text style={st.roleTxt} numberOfLines={1}>{tutorLabel}</Text>
              </View>
            </View>
          </View>

          {/* she's talking — a live waveform sitting under the chip */}
          {ttsActive && <View style={st.camWave}><Waveform active compact /></View>}

          {/* control rail — narration · voice · self-view */}
          <View style={st.rail}>
            <PressableScale onPress={toggleMute} style={[st.railBtn, muted && st.railBtnOff]} hitSlop={BAR_HIT}
              accessibilityLabel={muted ? 'Unmute narration' : 'Mute narration'} accessibilityState={{ selected: !muted }}>
              {muted ? <VolumeX size={19} color={V.text} strokeWidth={2.2} /> : <Volume2 size={19} color={V.text} strokeWidth={2.2} />}
            </PressableScale>
            <PressableScale onPress={onMicPress} style={[st.railBtn, VOICE_OK && handsFree && st.railBtnLive]} hitSlop={BAR_HIT}
              accessibilityLabel={VOICE_OK ? (handsFree ? 'Live conversation is on — tap to turn off' : 'Turn on live conversation — speak anytime') : 'Ask a question'}
              accessibilityState={{ selected: VOICE_OK && handsFree }}>
              <Mic size={19} color={VOICE_OK && handsFree ? C.teal : V.text} strokeWidth={2.2} />
            </PressableScale>
            <PressableScale onPress={onCameraPress} style={st.railBtn} hitSlop={BAR_HIT}
              accessibilityLabel={CAMERA_OK ? (selfView ? 'Turn off your camera' : 'Turn on your camera') : 'Camera is not available in this build'}
              accessibilityState={{ selected: selfView, disabled: !CAMERA_OK }}>
              <Camera size={19} color={V.text} strokeWidth={2.2} />
            </PressableScale>
          </View>

          {/* student self-view, only when a camera module is actually present */}
          {CAMERA_OK && selfView && <View style={st.selfView}><CamInner /></View>}
        </View>
        </View>
        )}

        <Stage key={sceneKey} style={st.workArea}>
          {showBoard && (
            // minHeight lives on this plain, non-animated View — putting it on the SAME
            // node as the `transform` (Animated.View below) measurably failed to apply
            // on this device/architecture; isolating the two concerns onto separate
            // nodes is what actually holds the floor.
            <View style={st.boardOuter}>
            <Animated.View style={{ width: '100%', flex: 1, transform: [{ scale: focusZoom }] }}>
              {/* ── WHITEBOARD CARD — tool rail on the left, board title + Full
                  Screen on top, the live board below, undo pinned bottom-left. ── */}
              <View style={st.wbCard}>
                <View style={st.wbRail}>
                  {[
                    { k: 'pen', Icon: Pencil, label: 'Pen' },
                    { k: 'eraser', Icon: Eraser, label: 'Eraser' },
                    { k: 'text', Icon: Type, label: 'Text' },
                  ].map(({ k, Icon, label }) => (
                    <PressableScale key={k} onPress={() => setTool(k)} style={[st.wbTool, tool === k && st.wbToolOn]} hitSlop={BAR_HIT}
                      accessibilityLabel={`${label} tool`} accessibilityState={{ selected: tool === k }}>
                      <Icon size={16} color={tool === k ? V.violet : INK_DIM} strokeWidth={2.2} />
                    </PressableScale>
                  ))}
                </View>

                <View style={st.wbMain}>
                  <View style={st.wbHead}>
                    <View style={st.wbHeadTitles}>
                      {!!scene.kicker && kickerDistinct && <Text style={st.wbKicker} numberOfLines={1}>{scene.kicker}</Text>}
                      {!!scene.title && <Text style={st.wbTitle} numberOfLines={2}>{scene.title}</Text>}
                    </View>
                    <PressableScale onPress={() => setFocusMode((f) => !f)} style={st.fsBtn} hitSlop={BAR_HIT}
                      accessibilityLabel={focusMode ? 'Exit full screen' : 'Full screen board'} accessibilityState={{ selected: focusMode }}>
                      {focusMode ? <Minimize2 size={15} color={INK2} strokeWidth={2.4} /> : <Maximize2 size={15} color={INK2} strokeWidth={2.4} />}
                    </PressableScale>
                  </View>

                  {/* The board SCROLLS. wbCard clips (overflow:'hidden') and the point
                      boards render every point with no cap, so a scene with five
                      two-line points ran past the bottom of the card on a small screen
                      and the last ones could not be read at all.

                      flexGrow:1 on the content keeps the boards that depend on a flex
                      parent — the triangle diagram, the charts — filling the space as
                      before when content is short; it scrolls only once the content is
                      genuinely taller than the card. */}
                  <ScrollView
                    style={st.wbScroll}
                    contentContainerStyle={st.wbScrollBody}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    <LessonBoard scene={scene} paused={!teaching} skip={false} resetKey={sceneKey} step={curBeat ? curBeat.boardStep : null} highlight={(curBeat && curBeat.highlight && curBeat.highlight.length) ? curBeat.highlight : keyTerms} action={curBeat && curBeat.boardAction} onQuizContinue={onNextStable} onQuizResult={onQuizResultStable} onReexplain={onReexplainStable} quizFb={quizFb} reteach={reteach} />
                  </ScrollView>
                  <EraserWipe enabled={idx > 0} />

                  <PressableScale onPress={onRefresh} style={st.undoBtn} hitSlop={BAR_HIT} accessibilityLabel="Replay this step from the start">
                    <Undo2 size={16} color={INK_DIM} strokeWidth={2.2} />
                  </PressableScale>
                </View>
              </View>
            </Animated.View>
            </View>
          )}
          {!focusMode && <Animated.View style={[st.captionWrap, { opacity: capFade }]}>{captionEl}</Animated.View>}
        </Stage>
      </ScrollView>

      {/* ── FIXED FOOTER — transient teaching state, then the ask bar, then the
          session actions (Previous / End Session / Next). ── */}
      <View style={[st.bottom, { paddingBottom: st.bottom.paddingBottom + insets.bottom }]}>
        {mode === M.LISTENING && VOICE_OK && <Text style={st.listenTxt} numberOfLines={2} accessibilityLiveRegion="polite">{partial || 'I’m listening — go ahead.'}</Text>}
        {mode === M.THINKING && <Appear><ThinkingDots /></Appear>}

        {mode === M.LISTENING && !VOICE_OK && !qInput && (
          <View style={st.starterRow}>
            {[
              `Why is "${(scene.title || 'this').replace(/["“”]/g, '')}" true?`,
              'Can you show a worked example?',
              'Where is this used in real life?',
            ].map((sq) => (
              <PressableScale key={sq} style={st.starterChip} onPress={() => sendDoubt(sq)} accessibilityRole="button" accessibilityLabel={sq}>
                <Text style={st.starterTxt} numberOfLines={1}>{sq}</Text>
              </PressableScale>
            ))}
          </View>
        )}
        {mode === M.ANSWERING && (
          <>
            {doubtDone && !!onAsk && <FollowUpChips question={qa && qa.q} onPick={(q) => sendDoubt(q)} />}
            <PressableScale style={st.resumeBtn} onPress={resumeFromDoubt} accessibilityLabel="Resume the lesson">
              <Play size={15} color="#fff" strokeWidth={2.4} fill="#fff" />
              <Text style={st.resumeTxt}>Resume lesson</Text>
            </PressableScale>
          </>
        )}

        {!!hint && (teaching || mode === M.PAUSED) && <Text style={st.hint}>{hint}</Text>}

        {/* Quick access to the lesson's Contents/Notes, and — once there's at least one
            concept behind them — Flashcards/Test-yourself on what's been covered SO FAR
            (not the whole lesson: flashcards/testQs are sliced to idx below, so this
            never spoils a concept she hasn't taught yet). Was previously only reachable
            via the "…" menu (Notes) or after the whole lesson finished (Flashcards/Test).
            The explain-differently chips that used to live here (Simpler / Break it down /
            Hindi / Practice) were removed: each was a full doubt round-trip, so they read
            as instant taps but actually broke the student's pace, and "Practice" only
            ever posed a question without solving it, so it looked half-built. Flashcards/
            Test are pure client-side lookups (no round-trip), so they don't have that
            problem — safe to offer any time. */}
        {!askCollapsed && !qInput && mode !== M.COMPLETED && mode !== M.ANSWERING && (
          <View style={st.quickChipRow}>
            <PressableScale style={st.notesChip} onPress={() => openContents('contents')} accessibilityRole="button"
              accessibilityLabel={savedNotes.length > 0 ? `Notes, ${savedNotes.length} saved` : 'Notes'}>
              <ListTree size={14} color={ACCENT} strokeWidth={2.3} />
              <Text style={st.notesChipTxt}>{savedNotes.length > 0 ? `Notes · ${savedNotes.length}` : 'Notes'}</Text>
            </PressableScale>
            {(formulas.length > 0 || recap.length > 0) && (
              <PressableScale style={st.notesChip} onPress={() => openContents('review')} accessibilityRole="button" accessibilityLabel="Slides">
                <FileText size={14} color={ACCENT} strokeWidth={2.3} />
                <Text style={st.notesChipTxt}>Slides</Text>
              </PressableScale>
            )}
            {flashcards.length > 0 && (
              <PressableScale style={st.notesChip} onPress={() => setDeckOpen(true)} accessibilityRole="button" accessibilityLabel="Review flashcards">
                <Layers size={14} color={ACCENT} strokeWidth={2.3} />
                <Text style={st.notesChipTxt}>Flashcards</Text>
              </PressableScale>
            )}
            {testQs.length > 0 && (
              <PressableScale style={st.notesChip} onPress={() => setTestOpen(true)} accessibilityRole="button" accessibilityLabel="Test yourself">
                <GraduationCap size={14} color={ACCENT} strokeWidth={2.3} />
                <Text style={st.notesChipTxt}>Test yourself</Text>
              </PressableScale>
            )}
          </View>
        )}

        {/* ── ASK BAR — always reachable, so a doubt is one tap away at any point
            of the lesson (the mockup's primary input). ── */}
        {!askCollapsed && mode !== M.COMPLETED && !!onAsk && (
          <View style={st.askBar}>
            <TextInput
              style={st.askField}
              placeholder="Ask a question..."
              placeholderTextColor={V.textFaint}
              value={qInput} onChangeText={setQInput}
              onSubmitEditing={() => sendDoubt()} returnKeyType="send"
              accessibilityLabel="Ask your teacher a question"
            />
            <PressableScale style={[st.askSendBtn, !qInput.trim() && st.askSendDim]} onPress={() => sendDoubt()}
              disabled={!qInput.trim()} accessibilityLabel="Send question">
              <ArrowUp size={18} color="#111111" strokeWidth={2.8} />
            </PressableScale>
          </View>
        )}

        {/* collapse handle — hides the ask bar to give the board more room */}
        {mode !== M.COMPLETED && !!onAsk && (
          <PressableScale onPress={() => setAskCollapsed((v) => !v)} style={st.collapse} hitSlop={BAR_HIT}
            accessibilityLabel={askCollapsed ? 'Show the question box' : 'Hide the question box'}>
            <ChevronDown size={18} color={V.textFaint} strokeWidth={2.4}
              style={askCollapsed ? { transform: [{ rotate: '180deg' }] } : null} />
          </PressableScale>
        )}

        {/* ── SESSION ACTIONS — move between concepts, or end the class ── */}
        {mode !== M.COMPLETED && (
          <View style={st.actionBar}>
            <PressableScale style={st.navBtn} onPress={onPrev} disabled={idx === 0} accessibilityLabel="Previous topic">
              <ChevronLeft size={15} color={idx === 0 ? V.textFaint : V.text} strokeWidth={2.5} />
              <View>
                <Text style={[st.navTop, idx === 0 && st.navDim]}>Previous</Text>
                <Text style={[st.navBot, idx === 0 && st.navDim]}>Topic</Text>
              </View>
            </PressableScale>

            <PressableScale style={st.endBtn} onPress={endSession} scaleTo={0.94} accessibilityLabel="End this session">
              <Square size={10} color="#fff" strokeWidth={2.6} fill="#fff" />
              <Text style={st.endTxt}>End Session</Text>
            </PressableScale>

            <PressableScale style={[st.navBtn, st.navBtnR]} onPress={onNext} accessibilityLabel="Next topic">
              <View>
                <Text style={[st.navTop, st.navRight]}>Next</Text>
                <Text style={[st.navBot, st.navRight]}>Topic</Text>
              </View>
              <ChevronRight size={15} color={V.text} strokeWidth={2.5} />
            </PressableScale>
          </View>
        )}
      </View>

      {/* ── "…" OVERFLOW — everything the mockup's header doesn't show but the
          lesson still needs: transport, live conversation, voice, contents. ── */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <PressableScale style={st.menuScrim} onPress={() => setMenuOpen(false)} scaleTo={1} accessibilityLabel="Close options">
          <View />
        </PressableScale>
        <View style={st.menuCard}>
          <View style={st.menuGrip} />
          {[
            {
              key: 'play',
              Icon: teaching ? Pause : Play,
              label: teaching ? 'Pause lesson' : 'Play lesson',
              on: false,
              run: togglePlay,
            },
            {
              key: 'replay',
              Icon: RotateCcw,
              label: 'Replay this concept',
              on: false,
              run: onRefresh,
            },
            ...(VOICE_OK && onAsk ? [{
              key: 'live',
              Icon: Radio,
              label: handsFree ? 'Live conversation · on' : 'Live conversation · off',
              on: handsFree,
              run: toggleHandsFree,
            }] : []),
            {
              key: 'voice',
              Icon: AudioLines,
              label: 'Teacher voice',
              on: false,
              run: () => { stopTeacher(); setVoiceOpen(true); },
            },
            ...(onNewLesson ? [{
              key: 'new',
              Icon: RefreshCw,
              label: 'Start a new lesson',
              on: false,
              run: onNewLesson,
            }] : []),
          ].map(({ key, Icon, label, on, run }) => (
            <PressableScale key={key} style={st.menuRow} onPress={() => { setMenuOpen(false); run(); }} accessibilityLabel={label}>
              <Icon size={18} color={on ? V.violet : V.textDim} strokeWidth={2.2} />
              <Text style={[st.menuTxt, on && st.menuTxtOn]}>{label}</Text>
            </PressableScale>
          ))}
        </View>
      </Modal>

      {/* ── LEAVING PART-WAY ──────────────────────────────────────────────────
          Not a "are you sure?" guard. The position is already saved, so the
          honest thing to say is where they are and that it will keep — then get
          out of the way. Leaving is one tap and is never the harder option. */}
      <Modal visible={leaveOpen} transparent animationType="fade" onRequestClose={() => setLeaveOpen(false)}>
        <View style={st.leaveWrap}>
          <Appear from="scale" style={st.leaveCard}>
            <View style={st.leaveIcon}><Text style={st.leaveIconTxt}>🌱</Text></View>
            <Text style={st.leaveTitle} accessibilityRole="header">Come back to this</Text>
            <Text style={st.leaveSub}>
              You’re {Math.min(idx + 1, N)} of {N} through {lessonTopic}.
              I’ll keep your place — finish it whenever you have time.
            </Text>

            <View style={st.leaveBarTrack}>
              <View style={[st.leaveBarFill, { width: `${Math.round((Math.min(idx + 1, N) / Math.max(1, N)) * 100)}%` }]} />
            </View>

            <PressableScale style={[st.leaveBtn, st.leaveStay]} onPress={() => setLeaveOpen(false)} accessibilityLabel="Keep learning">
              <Text style={st.leaveStayTxt}>Keep learning</Text>
            </PressableScale>
            <PressableScale style={st.leaveGo} onPress={leaveNow} accessibilityLabel="Leave for now">
              <Text style={st.leaveGoTxt}>Leave for now</Text>
            </PressableScale>
          </Appear>
        </View>
      </Modal>

      {/* ── COMPLETED ── */}
      {mode === M.COMPLETED && (
        <View style={st.doneOverlay} pointerEvents="box-none">
          <Appear from="scale" style={st.doneCard}>
            {/* Behind the trophy, so the stickers read as thrown from it. */}
            <Stickers />
            <Appear from="scale" delay={220} duration={420} style={st.doneEmoji}><Trophy size={40} color="#F59E0B" strokeWidth={1.9} /></Appear>
            <Text style={st.doneTitle} accessibilityRole="header">Thank you for attending — well done!</Text>
            <Text style={st.doneSub}>{memoryRecap || doneMsg || 'Great focus today. Take it again whenever you like.'}</Text>

            {learned.length > 0 && (
              <View style={st.learnedWrap}>
                <Text style={st.learnedHead}>Today you learned</Text>
                <View style={st.learnedChips}>
                  {learned.map((t, i) => (
                    <Appear key={i} delay={220 + i * 70} style={st.learnedChip}>
                      <Check size={11} color={C.green} strokeWidth={3.2} />
                      <Text style={st.learnedChipTxt} numberOfLines={1}>{t}</Text>
                    </Appear>
                  ))}
                </View>
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
                    <Layers size={17} color={ACCENT} strokeWidth={2.3} />
                    <Text style={st.studyTxt}>Flashcards</Text>
                  </PressableScale>
                )}
                {testQs.length > 0 && (
                  <PressableScale style={st.studyBtn} onPress={() => setTestOpen(true)} accessibilityLabel="Test yourself">
                    <GraduationCap size={18} color={ACCENT} strokeWidth={2.3} />
                    <Text style={st.studyTxt}>Test yourself</Text>
                  </PressableScale>
                )}
              </View>
            )}

            <View style={st.doneRow}>
              <PressableScale style={[st.doneBtn, st.doneGhost]} onPress={() => { stopTeacher(); onExit && onExit(); }} accessibilityLabel="Finish and exit"><Text style={st.doneGhostTxt}>Done</Text></PressableScale>
              <PressableScale style={[st.doneBtn, st.donePrimary]} onPress={onReplayLesson} accessibilityLabel="Replay the lesson"><RotateCcw size={15} color="#fff" strokeWidth={2.4} /><Text style={st.donePrimaryTxt}>Replay</Text></PressableScale>
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
        initialTab={contentsTab}
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
    </Animated.View>
  );
}

// ── DARK CLASSROOM ────────────────────────────────────────────────────────────
// The room lights go down; the whiteboard is the only lit surface. The board card
// is a literal WHITE surface (V.paper) so every SVG board in LessonBoards reads on
// paper — only the chrome around it goes dark (D.*). premiumTheme's C.ink/C.dim/
// C.line are a pale chalk-on-slate set, not a "board" set, so LessonBoards and this
// file both use local INK/INK2/INK_DIM overrides for text/icons on that white card.
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: V.ground },
  paperFaint: { opacity: 0.35 },

  // ══ SESSION CHROME (approved mockup) ════════════════════════════════════════
  // header: back · title/concept · Live · clock · overflow
  hdr: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SCREEN_MARGIN, paddingTop: 8, paddingBottom: 8 },
  // Back and overflow bookend the row — same box size, same optical inset, so the row
  // reads as symmetric instead of the back button feeling slightly larger/closer to
  // the edge than the overflow button.
  hdrBack: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: -5 },
  hdrTitles: { flex: 1, minWidth: 0 },
  hdrTitle: { fontSize: 16, fontFamily: F.bold, color: V.text, letterSpacing: -0.3 },
  hdrSub: { fontSize: 12, fontFamily: F.med, color: V.textDim, marginTop: 1 },
  hdrClock: { fontSize: 13, fontFamily: F.semi, color: V.text, letterSpacing: 0.2, fontVariant: ['tabular-nums'] },
  hdrMore: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: -5 },
  hdrProgress: { height: 2, marginHorizontal: SCREEN_MARGIN, backgroundColor: 'rgba(17,17,17,0.08)', borderRadius: 2, overflow: 'hidden' },
  hdrProgressFill: { height: '100%', backgroundColor: V.violet, borderRadius: 2 },

  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: V.liveSoft, borderRadius: R.pill, paddingVertical: 4, paddingHorizontal: 9 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: V.live },
  liveTxt: { fontSize: 11, fontFamily: F.bold, color: V.live, letterSpacing: 0.1 },

  sessionScroll: { flexGrow: 1, paddingHorizontal: SCREEN_MARGIN, paddingTop: 8, paddingBottom: 8, gap: 16 },

  // Design-system elevation tiers are deliberately DIFFERENT per card, not the same
  // shadow reused twice: the whiteboard is "Raised" (Level 1 — a normal card lift),
  // the teacher card is "Glow" (Level 2 — a purple ambient halo). Android's `elevation`
  // ignores shadowColor entirely (it always renders a neutral gray lift, ANY hex you
  // pass), so a colour glow can't be done through shadow props alone on this platform
  // — camCardGlow below is a padded, tinted wrapper that lets the violet peek out
  // around the card's edges as a visible halo on every platform, not just iOS.
  camCardGlow: { padding: 6, borderRadius: CARD_R + 6, backgroundColor: 'rgba(124,58,237,0.30)' },
  camCard: { width: '100%', height: CAM_CARD_H, borderRadius: CARD_R, overflow: 'hidden', backgroundColor: V.violetDeep },
  // A hairline top highlight — the same "glass edge" cue every other floating surface
  // in this screen uses (rail buttons, name chip) — so the card itself reads as part
  // of the same material, not a flat rectangle of colour.
  camCardHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.22)' },
  nameChip: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 7, maxWidth: '72%', backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)', borderRadius: R.pill, paddingVertical: 5, paddingHorizontal: 8, paddingRight: 12 },
  nameTxt: { fontSize: 12, fontFamily: F.bold, color: V.text, letterSpacing: -0.1 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  roleTxt: { fontSize: 9, fontFamily: F.semi, color: V.textDim, letterSpacing: 0.2 },
  camWave: { position: 'absolute', top: 62, left: 18 },
  rail: { position: 'absolute', top: 14, right: 12, gap: 10 },
  railBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
  railBtnOff: { backgroundColor: 'rgba(17,17,17,0.40)', borderColor: 'rgba(255,255,255,0.22)' },
  railBtnLive: { backgroundColor: 'rgba(16,185,129,0.20)', borderColor: 'rgba(16,185,129,0.55)' },
  selfView: { position: 'absolute', right: 12, bottom: 12, width: 78, height: 100, borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: '#11151D' },

  // whiteboard card — tool rail + titled board + undo
  wbCard: { width: '100%', flex: 1, flexDirection: 'row', backgroundColor: V.paper, borderRadius: CARD_R, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 30, shadowOffset: { width: 0, height: 14 }, elevation: 12 },
  wbRail: { paddingVertical: 14, paddingHorizontal: 8, gap: 6, borderRightWidth: 1, borderRightColor: V.paperEdge },
  wbTool: { width: 30, height: 30, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center' },
  wbToolOn: { backgroundColor: V.violetSoft },
  wbMain: { flex: 1, minWidth: 0, paddingTop: 14, paddingBottom: 40, paddingHorizontal: 14 },
  // The scroller fills what is left under the title; the 40 of paddingBottom on
  // wbMain is what keeps its last line clear of the undo button pinned below.
  wbScroll: { flex: 1, alignSelf: 'stretch' },
  wbScrollBody: { flexGrow: 1, paddingBottom: 4 },
  wbHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  wbHeadTitles: { flex: 1, minWidth: 0 },
  wbKicker: { fontSize: 9, fontFamily: F.bold, color: INK_DIM, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 3 },
  wbTitle: { fontSize: 21, fontFamily: F.bold, color: V.violet, letterSpacing: -0.3, lineHeight: 27 },
  // Icon-only. This was the widest control on the board header — an icon plus the
  // words "Full Screen" — and it sat directly beside the scene title, which is the
  // thing that actually needs the width. The label lives on accessibilityLabel.
  fsBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: V.violetSoft, borderRadius: R.sm },
  undoBtn: { position: 'absolute', left: 0, bottom: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  // ask bar + collapse handle
  askBar: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch', backgroundColor: V.ground2, borderWidth: 1, borderColor: V.hair, borderRadius: R.pill, paddingVertical: 5, paddingLeft: 20, paddingRight: 5 },
  askField: { flex: 1, minWidth: 0, color: V.text, fontSize: 14, fontFamily: F.med, paddingVertical: Platform.OS === 'ios' ? 10 : 7 },
  askSendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: V.violet, alignItems: 'center', justifyContent: 'center' },
  askSendDim: { opacity: 0.4 },
  quickChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SP.sm },
  notesChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(124,58,237,0.10)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.38)', borderRadius: R.pill, paddingVertical: 7, paddingHorizontal: 13 },
  notesChipTxt: { fontSize: 12, fontFamily: F.semi, color: ACCENT, letterSpacing: 0.2 },
  collapse: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 26 },

  // session action bar
  actionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', borderTopWidth: 1, borderTopColor: V.hairSoft, paddingTop: 8 },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 80 },
  navBtnR: { justifyContent: 'flex-end' },
  navTop: { fontSize: 11.5, fontFamily: F.semi, color: V.text, letterSpacing: -0.1 },
  navBot: { fontSize: 9, fontFamily: F.med, color: V.textDim, marginTop: -1 },
  navDim: { color: V.textFaint },
  navRight: { textAlign: 'right' },
  endBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: V.live, borderRadius: R.pill, paddingVertical: 8, paddingHorizontal: 16 },
  endTxt: { fontSize: 12, fontFamily: F.bold, color: '#fff', letterSpacing: -0.1 },

  // "…" overflow sheet
  menuScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,4,10,0.6)' },
  menuCard: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: V.ground2, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderTopWidth: 1, borderColor: V.hair, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 34 : 20, paddingHorizontal: 10 },
  menuGrip: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(17,17,17,0.16)', marginBottom: 10 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 14, borderRadius: R.md },
  menuTxt: { flex: 1, fontSize: 14.5, fontFamily: F.med, color: V.text, letterSpacing: -0.1 },
  menuTxtOn: { color: V.violet, fontFamily: F.semi },

  // header (fixed) — ghost circle glyphs over the dark room
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SP.md, paddingTop: SP.sm, paddingBottom: SP.xs },
  barIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: D.fill, borderWidth: 1, borderColor: D.edgeSoft },
  barIconLive: { backgroundColor: 'rgba(16,185,129,0.16)', borderColor: C.teal },
  barIconNote: { backgroundColor: 'rgba(124,58,237,0.16)', borderColor: 'rgba(124,58,237,0.5)' },
  barIconTxt: { fontSize: 22, color: D.text, marginTop: -3 },
  barIconTxt2: { fontSize: 14, color: D.text },
  progressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(17,17,17,0.12)', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 8 },
  progressTick: { position: 'absolute', top: 0, bottom: 0, width: 1.5, backgroundColor: 'rgba(8,9,12,0.55)' },
  counter: { fontSize: 11, fontFamily: F.semi, color: D.textFaint, minWidth: 30, textAlign: 'right', letterSpacing: 0.5 },

  // learning-progress context strip (topic + concept N of M)
  contextBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: SP.md, paddingTop: 2, paddingBottom: SP.sm },
  ctxTopic: { flex: 1, fontSize: 13, fontFamily: F.bold, color: D.text, letterSpacing: -0.2 },
  ctxStep: { fontSize: 10.5, fontFamily: F.semi, color: D.textDim, letterSpacing: 0.6, textTransform: 'uppercase' },

  // completion: "today you learned" checklist + count-up stats + adaptive next line
  learnedWrap: { alignSelf: 'stretch', marginTop: SP.md, gap: 8 },
  learnedHead: { fontSize: 11, fontFamily: F.bold, color: D.textDim, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2, textAlign: 'left' },
  learnedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 },
  learnedChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(45,187,120,0.12)', borderWidth: 1, borderColor: 'rgba(45,187,120,0.35)', borderRadius: R.pill, paddingVertical: 6, paddingHorizontal: 12 },
  learnedChipTxt: { fontSize: 12.5, fontFamily: F.semi, color: '#111111', letterSpacing: 0.1 },
  learnedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  learnedTick: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.18)', alignItems: 'center', justifyContent: 'center' },
  learnedTickTxt: { fontSize: 12, fontWeight: '900', color: C.green },
  learnedTxt: { flex: 1, fontSize: 14, fontFamily: F.semi, color: D.text },
  statRow: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'center', gap: 30, marginTop: SP.lg },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 30, fontFamily: SERIF, fontWeight: '600', color: ACCENT_DIM, letterSpacing: 0 },
  statLbl: { fontSize: 10, fontFamily: F.semi, color: '#666666', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  recoTxt: { fontSize: 12.5, fontFamily: F.med, color: D.textDim, textAlign: 'center', marginTop: SP.lg },
  masteryPanel: { alignSelf: 'stretch', marginTop: SP.lg, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: V.hair, borderRadius: R.lg, padding: SP.md },
  masteryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  masteryLabel: { fontSize: 10.5, fontFamily: F.bold, color: D.textDim, letterSpacing: 1.4, textTransform: 'uppercase' },
  masteryScore: { fontSize: 14, fontFamily: F.bold, color: ACCENT },
  masteryDots: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  mDot: { width: 20, height: 6, borderRadius: 3 },
  mDotOk: { backgroundColor: '#2DBB78' },
  mDotWeak: { backgroundColor: '#E9A23B' },
  masteryWeak: { fontSize: 11.5, fontFamily: F.med, color: D.textDim, marginTop: 10, lineHeight: 16 },

  scroll: { flex: 1 },
  scrollBody: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16 },
  scrollTop: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16 },

  doneNew: { marginTop: SP.md, paddingVertical: SP.sm, alignSelf: 'center' },
  doneNewTxt: { fontSize: 13, fontFamily: F.semi, color: ACCENT, letterSpacing: 0.2 },

  // teacher hero + speaking waveform
  banner: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingTop: SP.sm },
  heroStage: { alignItems: 'center', justifyContent: 'center' },
  waveWrap: { height: 38, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 10 },
  wave: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', height: 38, gap: 3 },
  waveBar: { width: 4, borderRadius: 3 },
  waveMini: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 24, gap: 3, paddingRight: 4 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: SP.md, backgroundColor: D.fill, borderWidth: 1, borderColor: D.edge, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  badgeOn: { borderColor: 'rgba(16,185,129,0.35)' },
  badgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: D.textFaint },
  badgeDotOn: { backgroundColor: C.green },
  badgeTxt: { fontSize: 11, fontFamily: F.semi, color: D.textDim, letterSpacing: 0.8, textTransform: 'lowercase' },
  badgeTxtOn: { color: D.text },

  caption: { alignSelf: 'center', alignItems: 'center', marginTop: SP.lg, maxWidth: SCREEN_W - SP.xl, paddingVertical: SP.md, paddingHorizontal: SP.lg, borderRadius: R.xl, backgroundColor: D.panel, borderWidth: 1, borderColor: D.edge },
  askedLabel: { fontSize: 11, fontFamily: F.semi, color: D.textFaint, textAlign: 'left', marginBottom: 8, letterSpacing: 0.3, fontStyle: 'italic' },

  // doubt metadata strip (source / confidence / concept / prerequisites)
  metaWrap: { marginTop: 14, gap: 8, alignSelf: 'stretch', backgroundColor: 'rgba(34,38,48,0.6)', borderRadius: R.md, borderWidth: 1, borderColor: D.edge, borderLeftWidth: 2.5, borderLeftColor: ACCENT_DIM, padding: 12 },
  metaHeader: { fontSize: 9.5, fontFamily: F.bold, color: ACCENT_DIM, letterSpacing: 1.6, textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: D.edge, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
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

  captionTxt: { fontSize: 16, fontFamily: F.med, color: D.text, textAlign: 'left', lineHeight: 25, letterSpacing: 0.1 }, // PRIMARY — spoken words (bright)
  capDim: { color: 'rgba(248,250,252,0.35)' },   // not-yet-spoken words; brighten as she speaks
  capHot: { color: ACCENT, fontFamily: F.semi }, // keyword emphasised (warm champagne) the moment it's spoken
  capTerm: { textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: 'rgba(124,58,237,0.6)' }, // tappable key term → tap to define

  cornerWrap: { position: 'absolute', top: 56, right: 12, zIndex: 20 },

  // optional student camera PiP
  camWrap: { alignItems: 'center', gap: 5 },
  camFrame: { width: CAM_W, height: CAM_H, borderRadius: R.lg, borderWidth: 2, borderColor: D.edge, overflow: 'hidden', backgroundColor: D.panel2 },
  camFrameOn: { borderColor: C.pink },
  camMask: { flex: 1, borderRadius: R.md, overflow: 'hidden' },
  camFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: D.panel2 },
  camLbl: { fontSize: 10, fontFamily: F.semi, color: D.textFaint },
  camLblOn: { color: C.pink },

  // ── the lit whiteboard + the dark teacher/caption panel ──
  lessonScroll: { flexGrow: 1, paddingHorizontal: SP.md, paddingTop: SP.xs, paddingBottom: SP.md },
  teacherBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SP.lg, backgroundColor: GLASS_PANEL, borderWidth: 1, borderColor: D.edge, borderTopColor: GLASS_HAIR, borderRadius: R.lg, padding: SP.sm, paddingRight: SP.md, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  teacherName: { fontSize: 17, fontFamily: SERIF, fontWeight: '600', color: D.text, letterSpacing: 0.2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: D.textFaint },
  statusDotOn: { backgroundColor: ACCENT, shadowColor: ACCENT, shadowOpacity: 0.9, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  statusTxt: { fontSize: 9.5, fontFamily: F.semi, color: D.textDim, letterSpacing: 2, textTransform: 'uppercase' },

  workArea: { width: '100%', alignItems: 'stretch' },
  kicker: { fontSize: 9.5, fontFamily: F.semi, color: ACCENT_DIM, letterSpacing: 2.4, textTransform: 'uppercase', textAlign: 'left', marginBottom: 7 },
  title: { fontSize: 24, fontFamily: SERIF, fontWeight: '600', color: D.text, letterSpacing: 0.1, textAlign: 'left', lineHeight: 31, marginBottom: SP.md },
  // the ONE lit surface — a white board card floating in the dark room
  // minHeight is a FLOOR (short content won't overflow it), enforced here — a plain
  // column node with no competing flex/height constraint above it in the tree — rather
  // than on wbCard itself, where the same minHeight measurably failed to apply (a
  // flex-row child of an unconstrained ScrollView content node is not a reliable place
  // to float a height floor). wbCard's `flex: 1` below fills whatever height this
  // resolves to.
  boardOuter: { width: '100%', minHeight: SCREEN_H * BOARD_MIN_FRAC, alignItems: 'center' },
  lessonCard: { width: '100%', backgroundColor: '#FAF7F0', borderRadius: R.xl, paddingVertical: 26, paddingHorizontal: 18, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 14 },
  // her words, under the board — a graphite frosted-glass panel with a bright top
  // hairline and a slim champagne rule on the left, so it reads as an editorial
  // "she is saying" quote, not a flat box.
  captionWrap: { width: '100%', marginTop: SP.md, backgroundColor: V.ground2, borderWidth: 1, borderColor: V.hair, borderTopColor: GLASS_HAIR, borderLeftWidth: 2.5, borderLeftColor: V.violet, borderRadius: R.lg, paddingVertical: SP.md, paddingHorizontal: SP.lg, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 6 },

  // bottom (fixed): status → dock
  bottom: { alignItems: 'center', paddingHorizontal: SCREEN_MARGIN, paddingTop: SP.sm, paddingBottom: Platform.OS === 'ios' ? SP.lg : SP.md, gap: SP.sm },

  listenTxt: { fontSize: 13, fontFamily: F.semi, color: D.text, textAlign: 'center', paddingHorizontal: 26 },
  thinkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  thinkDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT },
  thinkTxt: { fontSize: 13, fontFamily: F.semi, color: D.textDim, marginLeft: 6, letterSpacing: 0.2 },
  hint: { fontSize: 12.5, fontFamily: F.med, color: D.textDim, textAlign: 'center' },

  // listening / typed-doubt / resume
  resumeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: ACCENT, borderRadius: R.pill, paddingVertical: 13, paddingHorizontal: 28, shadowColor: ACCENT, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  resumeTxt: { color: '#fff', fontSize: 14, fontFamily: F.bold },
  starterRow: { alignSelf: 'stretch', gap: 6, marginBottom: SP.sm },
  starterChip: { alignSelf: 'stretch', backgroundColor: 'rgba(124,58,237,0.08)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)', borderRadius: R.md, paddingVertical: 10, paddingHorizontal: 14 },
  starterTxt: { fontSize: 13, fontFamily: F.med, color: ACCENT },
  askRow: { flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'stretch' },
  askInput: { flex: 1, backgroundColor: D.panel2, borderWidth: 1, borderColor: D.edge, borderRadius: R.pill, paddingVertical: 13, paddingHorizontal: 20, color: D.text, fontSize: 14, fontFamily: F.med },
  askSend: { width: 48, height: 48, borderRadius: 24, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  askSendTxt: { color: '#111111', fontSize: 18 },

  // floating dock — Ask (mic) is the raised gradient primary; transport is quiet
  dock: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', alignSelf: 'stretch',
    backgroundColor: GLASS_PANEL, borderWidth: 1, borderColor: D.edge, borderTopColor: GLASS_HAIR, borderRadius: R.pill,
    paddingHorizontal: SP.sm, paddingVertical: SP.sm,
    shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 12,
  },
  dItem: { alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 52 },
  dGhost: { width: 42, height: 42, borderRadius: 21, backgroundColor: D.fill, borderWidth: 1, borderColor: D.edgeSoft, alignItems: 'center', justifyContent: 'center' },
  dGlyph: { fontSize: 16, color: D.text },
  // overflow:hidden so the SVG <Gradient> fill is clipped to the circle
  dMic: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: ACCENT, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  dMicOn: { backgroundColor: C.pink, shadowColor: C.pink, borderColor: 'rgba(255,255,255,0.4)' },
  dMicIcon: { fontSize: 22, color: '#fff' },
  dDim: { opacity: 0.28 },
  dLbl: { fontSize: 9.5, fontFamily: F.semi, color: D.textFaint, letterSpacing: 0.4, marginTop: 3 },
  dLblPrimary: { color: ACCENT },
  // Hands-free "Live" dock control — a calm teal ring that reads as "listening now".
  dLive: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,185,129,0.16)', borderWidth: 1.5, borderColor: C.teal },
  dLblLive: { color: C.teal, fontFamily: F.bold },

  // leaving part-way — a small sheet, not a full takeover
  leaveWrap: { flex: 1, backgroundColor: 'rgba(17,17,17,0.5)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  leaveCard: {
    width: '100%', maxWidth: 380, backgroundColor: '#FFFFFF', borderRadius: R.xxl,
    padding: 26, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: 14 }, elevation: 14,
  },
  leaveIcon: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(16,185,129,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: SP.sm,
  },
  leaveIconTxt: { fontSize: 28 },
  leaveTitle: { fontSize: 21, fontFamily: SERIF, fontWeight: '600', color: '#111111', marginTop: 4, textAlign: 'center' },
  leaveSub: { fontSize: 13.5, fontFamily: F.med, color: '#666666', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  leaveBarTrack: { alignSelf: 'stretch', height: 6, borderRadius: 3, backgroundColor: '#EDEDED', marginTop: SP.md, overflow: 'hidden' },
  leaveBarFill: { height: '100%', borderRadius: 3, backgroundColor: C.green },
  leaveBtn: { alignSelf: 'stretch', paddingVertical: 15, borderRadius: R.md, alignItems: 'center', marginTop: SP.md },
  leaveStay: { backgroundColor: ACCENT },
  leaveStayTxt: { fontSize: 14.5, fontFamily: F.bold, color: '#111111' },
  leaveGo: { alignSelf: 'stretch', paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  leaveGoTxt: { fontSize: 13.5, fontFamily: F.semi, color: '#666666' },

  // finish-card stickers — centred on the card, thrown outward from the trophy
  stickerLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  sticker: { position: 'absolute', fontSize: 26 },

  // completed — a dark sheet over the darkened room
  doneOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,17,17,0.45)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  doneCard: { width: '100%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(17,17,17,0.08)', borderRadius: R.xxl, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 40, shadowOffset: { width: 0, height: 18 }, elevation: 16 },
  doneEmoji: { alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  doneTitle: { fontSize: 26, fontFamily: SERIF, fontWeight: '600', color: '#111111', marginTop: SP.md, letterSpacing: 0.1 },
  doneSub: { fontSize: 13.5, fontFamily: F.med, color: '#666666', textAlign: 'center', marginTop: SP.sm, lineHeight: 20 },
  studyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SP.lg, alignSelf: 'stretch', justifyContent: 'center' },
  studyBtn: { flexGrow: 1, flexBasis: '30%', minWidth: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 6, borderRadius: R.md, backgroundColor: 'rgba(124,58,237,0.10)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.38)' },
  studyTxt: { fontSize: 12.5, fontFamily: F.bold, color: ACCENT, letterSpacing: 0.1 },
  doneRow: { flexDirection: 'row', gap: 12, marginTop: SP.md, alignSelf: 'stretch' },
  doneBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 15, borderRadius: R.md },
  donePrimary: { backgroundColor: ACCENT },
  donePrimaryTxt: { color: '#111111', fontSize: 14, fontFamily: F.bold },
  doneGhost: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: 'rgba(17,17,17,0.08)' },
  doneGhostTxt: { color: '#111111', fontSize: 14, fontFamily: F.semi },
});
