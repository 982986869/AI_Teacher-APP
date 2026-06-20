// src/utils/sound.js
//
// Lightweight sound manager for the quiz / challenge flow (Expo SDK 54, expo-av).
//
// Setup:
//   1) npx expo install expo-av
//   2) Put audio files in assets/sounds/ (see assets/sounds/README.md):
//        tick.mp3, success.mp3, wrong.mp3, correct.mp3
//
// expo-av is required defensively (so a half-set-up project degrades gracefully),
// and each sound loads independently — a missing/placeholder/invalid file simply
// no-ops instead of throwing. Build note: importing this module pulls in expo-av,
// so the package must be installed wherever this is actually bundled.

let Audio = null;
try {
  // eslint-disable-next-line global-require
  ({ Audio } = require('expo-av'));
} catch (e) {
  Audio = null;
}

// Static requires so Metro bundles the assets. The placeholder files must exist.
const SOURCES = {
  tick:    require('../../assets/sounds/tick.mp3'),
  success: require('../../assets/sounds/success.mp3'),
  wrong:   require('../../assets/sounds/wrong.mp3'),
  correct: require('../../assets/sounds/correct.mp3'),
};

const players = {}; // name -> Audio.Sound
let initStarted = false;

// Load all sounds once. Safe to call repeatedly. No-ops if expo-av is absent.
export async function initSounds() {
  if (!Audio || initStarted) return;
  initStarted = true;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
  } catch (e) { /* non-fatal */ }

  await Promise.all(
    Object.entries(SOURCES).map(async ([name, src]) => {
      try {
        const { sound } = await Audio.Sound.createAsync(src, { volume: 1.0 });
        players[name] = sound;
      } catch (e) {
        // missing / placeholder / invalid file — this sound just won't play
      }
    })
  );
}

// Play a one-shot sound from the beginning.
export async function playSound(name) {
  const s = players[name];
  if (!s) return;
  try {
    await s.setIsLoopingAsync(false);
    await s.replayAsync();
  } catch (e) { /* ignore */ }
}

// Loop a sound (e.g. a countdown tick) until stopSound(name) is called.
export async function playLoop(name) {
  const s = players[name];
  if (!s) return;
  try {
    await s.setIsLoopingAsync(true);
    await s.setPositionAsync(0);
    await s.playAsync();
  } catch (e) { /* ignore */ }
}

export async function stopSound(name) {
  const s = players[name];
  if (!s) return;
  try { await s.stopAsync(); } catch (e) { /* ignore */ }
}

export async function stopAll() {
  await Promise.all(Object.keys(players).map(stopSound));
}

// Stop and free everything. Call on screen unmount.
export async function unloadSounds() {
  await Promise.all(
    Object.values(players).map(async (s) => {
      try { await s.unloadAsync(); } catch (e) { /* ignore */ }
    })
  );
  for (const k of Object.keys(players)) delete players[k];
  initStarted = false;
}
