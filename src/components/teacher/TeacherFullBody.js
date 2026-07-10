import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import { stateColor } from './premiumTheme';
import { TEACHER_GLB_URL } from './teacherIdentity';
import TeacherAvatar3D from './TeacherAvatar3D';

// Optional talking-head VIDEO (real lip movement) — lazy + graceful: if expo-av
// isn't present the frame just falls back to the still photo, never blank.
let ExpoAV = null;
try { ExpoAV = require('expo-av'); } catch (e) { ExpoAV = null; }
const VIDEO_OK = !!(ExpoAV && ExpoAV.Video);

// ── Full-body teacher (3D · video · photo) ────────────────────────────────────
// Renders the teacher full-body in a PORTRAIT rounded-rect frame, picking the best
// available source in priority order:
//   1. rigged 3D head  (TEACHER_GLB_URL set)      → real lip-sync, head motion
//   2. looping muted VIDEO (`video` prop set)     → real lip movement
//   3. still photo (`photo` prop)                 → no mouth motion
// The photo/video source is a wide shot (figure centred, brick backdrop on the
// sides); `resizeMode:"cover"` in a tall frame crops those sides so the whole
// standing figure reads head-to-toe. Even on the still she feels alive: a
// barely-there breathing scale (always) plus a soft accent glow that strengthens
// while she speaks / listens / thinks.
//
// The small circular animated illustration (TeacherAvatar) is still used for the
// tiny corner badge — this component is only for the large hero slots.

const CREAM_ACCENT = { speaking: '#FF8A3D', listening: '#3B82F6', thinking: '#E0A23C', idle: '#FF8A3D' };

function TeacherFullBody({ state = 'idle', photo, video, height = 300, theme = 'dark', style }) {
  const [imgError, setImgError] = useState(false);
  const width = Math.round(height * 0.66);           // portrait crop that frames the figure
  const radius = Math.round(height * 0.11);
  const active = state === 'speaking' || state === 'listening' || state === 'thinking';
  const accent = theme === 'cream' ? (CREAM_ACCENT[state] || CREAM_ACCENT.idle) : stateColor(state);

  // When a rigged .glb is configured she renders as a real talking 3D head; if the
  // WebView / model ever fails we drop back to the still photo, so a frame is never
  // left blank.
  const [threeFailed, setThreeFailed] = useState(false);
  const [vidFailed, setVidFailed] = useState(false);
  const frameBg = theme === 'cream' ? '#FFF7EE' : '#11151D';
  const show3D = !!TEACHER_GLB_URL && !threeFailed;
  const useVid = !show3D && !!video && VIDEO_OK && !vidFailed;   // looping talking clip

  const breath = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const vidRef = useRef(null);
  const speaking = state === 'speaking';

  // Talking video plays ONLY while she's speaking; when she stops, pause and rewind
  // to the first frame so she rests on a neutral (mouth-closed) pose, not frozen
  // mid-word. Guarded so it's a no-op unless a video source is actually in use.
  useEffect(() => {
    if (!useVid) return undefined;
    const v = vidRef.current;
    if (!v) return undefined;
    if (speaking) {
      v.playAsync && v.playAsync().catch(() => {});
    } else {
      Promise.resolve(v.pauseAsync && v.pauseAsync())
        .then(() => v.setPositionAsync && v.setPositionAsync(0))
        .catch(() => {});
    }
    return undefined;
  }, [speaking, useVid]);

  // gentle idle breathing — always on
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [breath]);

  // accent glow — pulses stronger while she's active
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: active ? 0.4 : 0.1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow, active]);

  const breathScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.012] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.05, active ? 0.34 : 0.14] });

  const canImg = !!photo && !imgError;

  return (
    <View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* soft accent halo behind the figure */}
      <Animated.View pointerEvents="none" style={[styles.glow, {
        width: width * 1.08, height: height * 1.04, borderRadius: radius + 10,
        backgroundColor: accent, opacity: glowOpacity,
      }]} />

      <Animated.View style={[styles.frame, {
        width, height, borderRadius: radius, borderColor: accent,
        backgroundColor: frameBg,
        transform: [{ scale: breathScale }],
      }]}>
        {show3D ? (
          <TeacherAvatar3D state={state} glbUrl={TEACHER_GLB_URL} bg={frameBg} onError={() => setThreeFailed(true)} />
        ) : useVid ? (
          <ExpoAV.Video
            ref={vidRef}
            source={video}
            isMuted
            isLooping
            shouldPlay={speaking}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
            onError={() => setVidFailed(true)}
          />
        ) : canImg ? (
          <Image source={photo} resizeMode="cover" style={{ width: '100%', height: '100%' }} onError={() => setImgError(true)} />
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute' },
  frame: {
    overflow: 'hidden', borderWidth: 2, backgroundColor: '#11151D',
    shadowColor: '#1B2233', shadowOpacity: 0.26, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
});

export default React.memo(TeacherFullBody);
