// Centralised "teacher voice" engine for the AI Teacher.
//
// Goals (production requirement #3):
//   • pick the best available teacher-like (female / enhanced) English voice
//   • a natural, slightly slow classroom pace + warm pitch
//   • a SINGLE speaking instance — every speak() stops the previous utterance so
//     two voices can never overlap (the old double-speech bug)
//   • degrade gracefully to silent if expo-speech isn't installed
//
// PRIMARY voice = OpenAI TTS streamed from our server (one natural female teacher
// voice on every device). FALLBACK = on-device Expo Speech if the network/TTS
// fails or isn't configured. The public interface below is unchanged, so the
// player's state machine (which treats TTS as its clock) needs no changes.
import { API_BASE_URL } from '../constants/config';
import { getToken } from './storage';

// expo-speech (fallback) + expo-av Audio (OpenAI playback) are loaded defensively
// so the app still runs if a native module is missing.
let Speech = null;
try { Speech = require('expo-speech'); } catch (e) { Speech = null; }
let ExpoAudio = null;
try { ExpoAudio = require('expo-av').Audio; } catch (e) { ExpoAudio = null; }

// Persist the user's hand-picked (fallback) teacher voice across launches.
let Storage = null;
try { Storage = require('@react-native-async-storage/async-storage').default; } catch (e) { Storage = null; }
const PREF_KEY = 'teacherVoiceId';

const DEVICE_OK = !!(Speech && typeof Speech.speak === 'function');
const AUDIO_OK = !!(ExpoAudio && ExpoAudio.Sound);
// Voice is possible if EITHER path works. (Kept name `SPEECH_OK` so callers that
// gate playback on it — AITeacherScreen, the player — are unchanged.)
export const SPEECH_OK = DEVICE_OK || AUDIO_OK;

// Server base URL, normalised like axiosInstance (no trailing slash / "/api").
const BASE_URL = String(API_BASE_URL || '').replace(/\/+$/, '').replace(/\/api$/i, '');

// ── OpenAI TTS playback state ────────────────────────────────────────────────
let currentSound = null;       // the Audio.Sound currently loaded
let playToken = 0;             // bumps on every speak/stop → stale callbacks ignore
let ttsFailStreak = 0;         // consecutive OpenAI failures
let ttsDisabled = false;       // turned on after repeated failures (this session)
let audioModeSet = false;
const TTS_GUARD_MS = 6000;     // if no audio starts within this, fall back to device

// ── caption karaoke progress (0..1 through the CURRENT spoken line) ───────────
// OpenAI path uses the real audio position; the device path estimates from time.
let speechMode = null;         // 'openai' | 'device' | null
let speechProgress01 = 0;      // OpenAI: positionMillis / durationMillis
let speechStartTs = 0;         // device: when speaking actually started
let speechEstMs = 1;           // device: estimated line duration

function estSpeechMs(text) {
  const w = String(text || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1200, w * 380 + 600);
}

// How far through the current line the teacher has spoken (0..1). The caption
// uses this to brighten words in step with her voice.
export function getSpeechProgress() {
  if (speechMode === 'openai') return speechProgress01;
  if (speechMode === 'device') {
    const p = (Date.now() - speechStartTs) / speechEstMs;
    return p < 0 ? 0 : (p > 1 ? 1 : p);
  }
  return 0;
}

async function ensureAudioMode() {
  if (audioModeSet || !AUDIO_OK) return;
  audioModeSet = true;
  try { await ExpoAudio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false }); }
  catch (e) { /* no-op */ }
}

async function unloadCurrentSound() {
  const s = currentSound;
  currentSound = null;
  if (!s) return;
  try { s.setOnPlaybackStatusUpdate(null); } catch (e) { /* no-op */ }
  try { await s.stopAsync(); } catch (e) { /* no-op */ }
  try { await s.unloadAsync(); } catch (e) { /* no-op */ }
}

// Natural classroom defaults — a touch slow & warm, like a teacher at the board.
// Slow, clear classroom pace — never rushed. Natural pauses come from the
// sentence punctuation in the (short) teacher lines, stretched by this slow rate.
const DEFAULT_RATE = 0.86;
// When we DID find a real female voice, keep the pitch natural (close to 1.0).
const FEMALE_PITCH = 1.06;
// When the device gives us a neutral / unknown-gender voice (common on Android,
// where the TTS voice list rarely tags gender), lift the pitch so it still reads
// as a young female teacher instead of a flat/male default.
const FEMININE_PITCH = 1.22;

// Female teacher voices across iOS (Samantha, Karen…) and Android (…#female…).
const FEMALE_NAMES = /samantha|karen|moira|tessa|serena|fiona|veena|catherine|allison|susan|zoe|ava|nicky|joana|martha|kate|stephanie|rishika|priya|aditi/i;
// Obvious male voices we never want for the teacher.
const MALE_NAMES = /daniel|alex|fred|rishi|aaron|arthur|gordon|oliver|thomas|reed|albert|ralph|junior|google\W*uk\W*english\W*male/i;

// Detect a voice's gender from its identifier/name. Android encodes it as
// "…#female…/#male…"; iOS uses the speaker's name (Samantha = female, etc.).
function voiceGender(v) {
  const tag = `${v.identifier || ''} ${v.name || ''}`.toLowerCase();
  if (tag.includes('female') || FEMALE_NAMES.test(tag)) return 'f';
  // "female" contains "male", so only call it male when it isn't female.
  if (tag.includes('male') || MALE_NAMES.test(tag)) return 'm';
  return '?';
}

// Cached chosen voice: `undefined` = not primed yet, `null` = use system default.
let chosenVoice = undefined;
let chosenFemale = false;   // did we confidently pick a FEMALE voice?
let userPicked = false;     // did the user hand-pick this voice?
let preferredId = undefined; // undefined = not loaded; null/string = loaded
let primingPromise = null;

async function loadPreferredId() {
  if (preferredId !== undefined) return preferredId;
  try { preferredId = Storage ? (await Storage.getItem(PREF_KEY)) || null : null; }
  catch (e) { preferredId = null; }
  return preferredId;
}

function scoreVoice(v) {
  const lang = String(v.language || '').toLowerCase();
  if (!lang.startsWith('en')) return -Infinity;     // English only
  const g = voiceGender(v);
  if (g === 'm') return -Infinity;                  // never pick a male voice
  let score = 10;
  if (g === 'f') score += 50;                       // strongly prefer female
  if (String(v.quality) === 'Enhanced') score += 9; // strongly prefer the most natural voice
  if (/neural|natural|premium|enhanced|wavenet/i.test(`${v.identifier} ${v.name}`)) score += 6;
  // Mild regional preference: en-IN feels closest for our students, then US/GB.
  if (lang.startsWith('en-in')) score += 3;
  else if (lang.startsWith('en-us')) score += 2;
  else if (lang.startsWith('en-gb')) score += 1;
  return score;
}

// Load the device voice list once and remember the best teacher voice.
export async function primeTeacherVoice() {
  if (!SPEECH_OK || chosenVoice !== undefined) return chosenVoice;
  if (primingPromise) return primingPromise;
  primingPromise = (async () => {
    try {
      const voices = (await Speech.getAvailableVoicesAsync()) || [];
      // Some Android devices return an empty list until the TTS engine warms up.
      // Leave `chosenVoice` unset so a later call can retry instead of locking in.
      if (!voices.length) { primingPromise = null; return undefined; }
      // 1) Honour the user's hand-picked voice if it's still available.
      const pref = await loadPreferredId();
      if (pref) {
        const match = voices.find((v) => v.identifier === pref);
        if (match) { chosenVoice = match; chosenFemale = true; userPicked = true; return chosenVoice; }
      }
      // 2) Otherwise auto-pick the best female / most natural English voice.
      let best = null;
      let bestScore = -Infinity;
      for (const v of voices) {
        const s = scoreVoice(v);
        if (s > bestScore) { bestScore = s; best = v; }
      }
      chosenVoice = best; // may be null → system default + feminised pitch below
      chosenFemale = !!(best && voiceGender(best) === 'f');
    } catch (e) {
      chosenVoice = null;
      chosenFemale = false;
    }
    return chosenVoice;
  })();
  return primingPromise;
}

export function getSelectedVoice() {
  return chosenVoice || null;
}
export function getSelectedVoiceId() {
  return (chosenVoice && chosenVoice.identifier) || null;
}

// All English voices on the device, likely-female first, for the voice picker.
export async function listEnglishVoices() {
  if (!SPEECH_OK) return [];
  let voices = [];
  try { voices = (await Speech.getAvailableVoicesAsync()) || []; } catch (e) { return []; }
  const rank = (g, quality, lang) => {
    let s = 0;
    if (g === 'f') s += 50;
    if (g === 'm') s -= 30;
    if (String(quality) === 'Enhanced') s += 6;
    const l = String(lang || '').toLowerCase();
    if (l.startsWith('en-in')) s += 3; else if (l.startsWith('en-us')) s += 2; else if (l.startsWith('en-gb')) s += 1;
    return s;
  };
  return voices
    .filter((v) => String(v.language || '').toLowerCase().startsWith('en'))
    .map((v) => ({ identifier: v.identifier, name: v.name || v.identifier, language: v.language, quality: v.quality, gender: voiceGender(v) }))
    .sort((a, b) => rank(b.gender, b.quality, b.language) - rank(a.gender, a.quality, a.language));
}

// Speak a short sample with a specific voice so the user can audition it.
export function previewVoice(identifier) {
  if (!SPEECH_OK) return;
  try { Speech.stop(); } catch (e) { /* no-op */ }
  try {
    Speech.speak('Hi! I am your teacher. Shall we begin?', {
      language: 'en-US',
      voice: identifier || undefined,
      rate: 0.92,
      pitch: FEMALE_PITCH,
    });
  } catch (e) { /* no-op */ }
}

// Lock in the user's chosen voice (persisted). Pass null to clear → auto-pick.
export async function setPreferredVoice(identifier) {
  preferredId = identifier || null;
  userPicked = !!identifier;
  if (identifier) {
    try {
      const voices = (await Speech.getAvailableVoicesAsync()) || [];
      chosenVoice = voices.find((v) => v.identifier === identifier) || null;
    } catch (e) { chosenVoice = null; }
    chosenFemale = true; // user-chosen → use the natural FEMALE_PITCH
  } else {
    chosenVoice = undefined; // force a fresh auto-pick next prime
    chosenFemale = false;
    primingPromise = null;
  }
  try { if (Storage) await Storage.setItem(PREF_KEY, identifier || ''); } catch (e) { /* no-op */ }
}

export function stopTeacher() {
  playToken += 1; // invalidate any pending OpenAI playback callbacks
  speechMode = null; speechProgress01 = 0;
  if (DEVICE_OK) { try { Speech.stop(); } catch (e) { /* no-op */ } }
  if (AUDIO_OK) { unloadCurrentSound(); }
}

// ── FALLBACK: on-device Expo Speech (the original path, unchanged) ────────────
function speakViaDevice(text, opts = {}) {
  if (!DEVICE_OK) { if (opts.onError) opts.onError(new Error('No TTS available')); return; }
  if (chosenVoice === undefined) primeTeacherVoice();
  const voice = chosenVoice && chosenVoice.identifier ? chosenVoice.identifier : undefined;
  const autoPitch = chosenFemale ? FEMALE_PITCH : FEMININE_PITCH;
  // Estimate-based caption progress for the device path.
  speechMode = 'device'; speechStartTs = Date.now(); speechEstMs = estSpeechMs(text);
  try {
    Speech.speak(text, {
      language: 'en-US',
      voice,
      rate: opts.rate != null ? opts.rate : DEFAULT_RATE,
      pitch: opts.pitch != null ? opts.pitch : autoPitch,
      onStart: () => { speechStartTs = Date.now(); if (opts.onStart) opts.onStart(); },
      onDone: opts.onDone,
      onStopped: opts.onStopped,
      onError: opts.onError,
      onBoundary: opts.onBoundary,
    });
  } catch (e) {
    if (opts.onError) opts.onError(e);
  }
}

// ── PRIMARY: OpenAI TTS streamed from our server, played via expo-av ──────────
async function speakViaOpenAI(text, opts = {}) {
  const myToken = playToken;        // set by the caller (speakTeacher → stopTeacher bump)
  const t0 = Date.now();
  let started = false;
  let finished = false;
  let handed = false;

  const fallback = (reason) => {
    if (handed || finished) return;
    handed = true;
    ttsFailStreak += 1;
    if (ttsFailStreak >= 2) { ttsDisabled = true; if (__DEV__) console.log('[TTS] OpenAI disabled for session after repeated failures'); }
    if (__DEV__) console.log('[TTS] → falling back to device speech', reason ? `(${reason})` : '');
    speakViaDevice(text, opts);
  };

  try {
    await ensureAudioMode();
    const token = await getToken();
    if (!BASE_URL || !token) return fallback('no base url / token');

    const uri = `${BASE_URL}/api/tts?text=${encodeURIComponent(text)}&token=${encodeURIComponent(token)}`;

    // If audio hasn't started within the guard window, drop to device speech.
    const guard = setTimeout(() => {
      if (!started && myToken === playToken) { unloadCurrentSound(); fallback('timeout'); }
    }, TTS_GUARD_MS);

    const onStatus = (status) => {
      if (myToken !== playToken) return; // superseded by a newer speak/stop
      if (!status.isLoaded) {
        if (status.error) { clearTimeout(guard); unloadCurrentSound(); fallback(status.error); }
        return;
      }
      if (status.isPlaying && !started) {
        started = true; ttsFailStreak = 0; clearTimeout(guard);
        speechMode = 'openai'; speechProgress01 = 0;
        if (__DEV__) console.log(`[TTS] OpenAI first-audio in ${Date.now() - t0}ms`);
        if (opts.onStart) opts.onStart();
      }
      // Real playback position → caption karaoke progress.
      if (speechMode === 'openai' && status.durationMillis > 0 && status.positionMillis != null) {
        const p = status.positionMillis / status.durationMillis;
        speechProgress01 = p < 0 ? 0 : (p > 1 ? 1 : p);
      }
      if (status.didJustFinish && !finished) {
        finished = true; clearTimeout(guard); speechProgress01 = 1;
        if (opts.onDone) opts.onDone();
        unloadCurrentSound();
      }
    };

    const { sound } = await ExpoAudio.Sound.createAsync(
      { uri },
      { shouldPlay: true, progressUpdateIntervalMillis: 120 },
      onStatus,
    );
    if (myToken !== playToken) { try { await sound.unloadAsync(); } catch (e) { /* no-op */ } return; }
    currentSound = sound;
  } catch (e) {
    if (myToken === playToken) fallback(e && e.message);
  }
}

// Speak `text` as the teacher. Always stops any current utterance first, so there
// is never more than one voice. Tries OpenAI TTS first, falls back to device
// speech. Callbacks mirror expo-speech's SpeechOptions (onStart/onDone/…).
export function speakTeacher(text, opts = {}) {
  if (!text || !SPEECH_OK) return;
  stopTeacher();
  if (AUDIO_OK && !ttsDisabled) {
    speakViaOpenAI(text, opts); // handles its own fallback to device on failure
  } else {
    speakViaDevice(text, opts);
  }
}

// ── Sequential queue for STREAMING voice playback ─────────────────────────────
// As an answer streams in, we feed it sentence-by-sentence: each chunk waits for
// the previous one to finish (chained onDone) so the teacher speaks continuously
// without two voices overlapping. This lets her start talking ~2s in.
let _queue = [];
let _queueBusy = false;
let _queueToken = 0;

// Clear the queue and stop any current utterance (call when a new turn starts).
export function resetTeacherQueue() {
  _queueToken += 1;
  _queue = [];
  _queueBusy = false;
  stopTeacher();
}

// Enqueue one chunk (usually a sentence) to speak after the current queue drains.
export function speakTeacherQueued(text, opts = {}) {
  const t = String(text || '').trim();
  if (!t || !SPEECH_OK) return;
  _queue.push({ text: t, opts });
  if (!_queueBusy) runQueue(_queueToken);
}

function runQueue(myToken) {
  if (myToken !== _queueToken) return;
  const next = _queue.shift();
  if (!next) { _queueBusy = false; return; }
  _queueBusy = true;
  // speakTeacher() stops the previous utterance first, which is safe here because
  // the previous chunk has already finished (onDone fired) before we advance.
  speakTeacher(next.text, {
    ...next.opts,
    onStart: () => { if (myToken === _queueToken && next.opts.onStart) next.opts.onStart(); },
    onDone: () => { if (next.opts.onDone) next.opts.onDone(); if (myToken === _queueToken) runQueue(myToken); },
    onError: () => { if (next.opts.onError) next.opts.onError(); if (myToken === _queueToken) runQueue(myToken); },
  });
}

// Is the streaming queue still speaking / holding chunks?
export function isTeacherQueueActive() {
  return _queueBusy || _queue.length > 0;
}
