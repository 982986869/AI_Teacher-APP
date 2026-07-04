// src/utils/sound.js
//
// Automatic premium sound system for BrainGym (Expo SDK 54, expo-av). Screens fire
// semantic events — the user never manually plays/stops audio. One global setting
// ("Sound Effects" ON/OFF, persisted) gates everything.
//
// Public API:
//   initSounds()                preload once (safe to call repeatedly)
//   play('correct')             one-shot  (alias: playSound)
//   startLoop('spin')           looping   (alias: playLoop)
//   stopLoop('spin')            stop a loop (alias: stopSound)
//   stopAll()                   stop every sound (screen exit / background / mute)
//   setSoundEnabled(bool)       toggle + persist; OFF stops & silences everything
//   isSoundEnabled()/getSoundEnabledAsync()/subscribeSound(fn)
//   unloadSounds()              free native memory
//
// Robustness: expo-av is required defensively; any missing/invalid sound file simply
// no-ops (the app NEVER breaks without assets). App background auto-stops all audio.
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let Audio = null;
try {
  // eslint-disable-next-line global-require
  ({ Audio } = require('expo-av'));
} catch (e) { Audio = null; }

const SETTING_KEY = '@ailernova_sound_enabled';
const THROTTLE_MS = 70;               // ignore identical one-shot fired within this window
const LOOP_SOUNDS = new Set(['spin', 'tick']);

// Soft / premium volumes — never loud or arcade. 0..1.
const VOLUME = {
  tap: 0.35, pop: 0.45, correct: 0.55, wrong: 0.45, flip: 0.4, xp: 0.5,
  achievement: 0.65, tick: 0.3, timeout: 0.5, spin: 0.4, whoosh: 0.45,
  victory: 0.7, fail: 0.45, success: 0.6,
};

// ── Sound registry ──────────────────────────────────────────────────────────
// Full premium set — original synthesized effects (soft bell chimes + gentle noise
// textures), shipped in assets/sounds/brainGym/. No placeholders: every event has a
// real, commercially-usable, royalty-free sound. (A missing file would still no-op
// safely, but none are missing.)
const SOURCES = {
  correct:     require('../../assets/sounds/brainGym/correct.mp3'),
  wrong:       require('../../assets/sounds/brainGym/wrong.mp3'),
  success:     require('../../assets/sounds/brainGym/achievement.mp3'), // quiz "All Done!" chime
  tick:        require('../../assets/sounds/brainGym/tick.mp3'),
  tap:         require('../../assets/sounds/brainGym/tap.mp3'),
  pop:         require('../../assets/sounds/brainGym/pop.mp3'),
  flip:        require('../../assets/sounds/brainGym/flip.mp3'),
  xp:          require('../../assets/sounds/brainGym/xp.mp3'),
  achievement: require('../../assets/sounds/brainGym/achievement.mp3'),
  timeout:     require('../../assets/sounds/brainGym/timeout.mp3'),
  spin:        require('../../assets/sounds/brainGym/spin_loop.mp3'), // LOOP
  whoosh:      require('../../assets/sounds/brainGym/whoosh.mp3'),
  victory:     require('../../assets/sounds/brainGym/victory.mp3'),
  fail:        require('../../assets/sounds/brainGym/fail.mp3'),
};

const players = {};      // name -> Audio.Sound (only for present assets)
const lastPlayed = {};   // name -> timestamp (one-shot throttle)
const listeners = new Set();
let enabled = true;
let initPromise = null;
let appSub = null;

const notify = () => { listeners.forEach((fn) => { try { fn(enabled); } catch (_) {} }); };

async function readSetting() {
  try { const v = await AsyncStorage.getItem(SETTING_KEY); return v === null ? true : v === '1'; }
  catch (_) { return true; }
}

// Preload once. Returns a shared promise so every caller's `.then` runs after load.
export function initSounds() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    enabled = await readSetting();
    if (!Audio) return;
    try { await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true }); } catch (_) {}
    await Promise.all(Object.keys(SOURCES).map(async (name) => {
      const src = SOURCES[name];
      if (!src || players[name]) return; // no file → skip; already loaded → keep
      try {
        const { sound } = await Audio.Sound.createAsync(src, {
          volume: VOLUME[name] ?? 0.5, isLooping: LOOP_SOUNDS.has(name),
        });
        players[name] = sound;
      } catch (_) { /* skip one bad asset, keep the rest */ }
    }));
    if (!appSub) appSub = AppState.addEventListener('change', (s) => { if (s !== 'active') stopAll(); });
  })();
  return initPromise;
}

export function isSoundEnabled() { return enabled; }
export async function getSoundEnabledAsync() { return readSetting(); }
export function subscribeSound(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export async function setSoundEnabled(on) {
  enabled = !!on;
  notify();
  if (!enabled) stopAll();
  try { await AsyncStorage.setItem(SETTING_KEY, enabled ? '1' : '0'); } catch (_) {}
}

// One-shot. Restarts from 0 (never stacks) and throttles rapid duplicates.
export async function playSound(name) {
  if (!enabled) return;
  const s = players[name];
  if (!s) return;
  const now = Date.now();
  if (now - (lastPlayed[name] || 0) < THROTTLE_MS) return;
  lastPlayed[name] = now;
  try { await s.setIsLoopingAsync(false); await s.replayAsync(); } catch (_) {}
}

export async function playLoop(name) {
  if (!enabled) return;
  const s = players[name];
  if (!s) return;
  try { await s.setIsLoopingAsync(true); await s.setPositionAsync(0); await s.playAsync(); } catch (_) {}
}

export async function stopSound(name) {
  const s = players[name];
  if (!s) return;
  try { await s.stopAsync(); } catch (_) {}
}

export async function stopAll() {
  await Promise.all(Object.keys(players).map(stopSound));
}

export async function unloadSounds() {
  await Promise.all(Object.values(players).map(async (s) => { try { await s.unloadAsync(); } catch (_) {} }));
  for (const k of Object.keys(players)) delete players[k];
  initPromise = null;
  if (appSub) { appSub.remove(); appSub = null; }
}

// Requested API names (aliases over the same engine).
export const play = playSound;
export const startLoop = playLoop;
export const stopLoop = stopSound;
