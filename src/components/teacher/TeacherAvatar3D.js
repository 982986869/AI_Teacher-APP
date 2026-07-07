// TeacherAvatar3D.js
// The real "my image → talking 3D model": a rigged .glb head (Avaturn / Ready
// Player Me) rendered by three.js inside a WebView, lip-synced to the teacher's
// speaking state. It fills its parent frame; TeacherFullBody wraps it in the same
// glowing portrait chrome and swaps back to the still photo if 3D ever fails.
//
// `state` maps to the viewer's motion modes: speaking → mouth moves, listening /
// thinking → head tilt, idle → gentle sway + blinks.

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { buildAvatarHtml } from './avatarViewerHtml';

const modeFor = (state) => (
  state === 'speaking' ? 'speaking'
    : state === 'listening' ? 'listening'
      : state === 'thinking' ? 'thinking' : 'idle'
);

function TeacherAvatar3D({ state = 'idle', glbUrl, bg = '#11151D', onError, style }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const html = useMemo(() => buildAvatarHtml({ glbUrl, bg }), [glbUrl, bg]);

  // Push mode changes into the scene once it has reported ready.
  useEffect(() => {
    if (!ready || !ref.current) return;
    ref.current.injectJavaScript(`window.__setMode && window.__setMode(${JSON.stringify(modeFor(state))}); true;`);
  }, [state, ready]);

  const onMessage = useCallback((e) => {
    let m; try { m = JSON.parse(e.nativeEvent.data); } catch (_) { return; }
    if (m && m.type === 'ready') setReady(true);
    else if (m && m.type === 'error') onError && onError(m.message || '3D avatar failed');
  }, [onError]);

  return (
    <View style={[{ width: '100%', height: '100%', backgroundColor: bg }, style]} pointerEvents="none">
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://appassets.local/' }}
        style={{ flex: 1, backgroundColor: bg }}
        onMessage={onMessage}
        onError={() => onError && onError('WebView error')}
        onRenderProcessGone={() => onError && onError('WebView crashed')}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        overScrollMode="never"
        androidLayerType="hardware"
        setSupportMultipleWindows={false}
        mediaPlaybackRequiresUserAction={false}
        // A hosted .glb + three.js need network; nothing here needs cookies/storage.
      />
    </View>
  );
}

export default React.memo(TeacherAvatar3D);
