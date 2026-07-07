// avatarViewerHtml.js
// Builds the self-contained HTML for the WebView 3D teacher avatar.
//
// It renders a rigged .glb head (Avaturn / Ready Player Me export — both use
// ARKit-style blendshapes) with three.js and drives PROCEDURAL lip-sync: the
// mouth opens on a syllable-rate envelope while the app is "speaking", because
// expo-speech gives us no phoneme/viseme timing. She also blinks, sways, and
// tilts her head for listening / thinking. All motion is driven from the app via
// window.__setMode('speaking' | 'listening' | 'thinking' | 'idle').
//
// three.js loads from a CDN (WebView has network; there is no CSP here). On any
// failure it posts {type:'error'} back to React Native, which falls back to the
// still photo — so a flaky network or a bad URL never leaves a blank frame.

const THREE_VER = '0.160.0';

export function buildAvatarHtml({ glbUrl, bg = '#11151D' } = {}) {
  const cfg = JSON.stringify({ glbUrl: glbUrl || '', bg });
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html,body { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:${bg}; }
  #c { width:100%; height:100%; display:block; }
</style>
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@${THREE_VER}/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@${THREE_VER}/examples/jsm/"
}}
</script>
</head>
<body>
<canvas id="c"></canvas>
<script type="module">
const CFG = ${cfg};
const post = (o) => { try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch (e) {} };
const fail = (m) => post({ type: 'error', message: String(m || 'load failed') });

if (!CFG.glbUrl) { fail('no glb url'); }

(async () => {
  let THREE, GLTFLoader;
  try {
    THREE = await import('three');
    ({ GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'));
  } catch (e) { fail('three.js failed to load — check network'); return; }

  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setClearColor(new THREE.Color(CFG.bg), 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const FOV = 26;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

  // Soft studio light so the face reads without harsh shadows.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2f3a, 1.05));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(0.6, 1.4, 1.2); scene.add(key);
  const fill = new THREE.DirectionalLight(0xbfd0ff, 0.5); fill.position.set(-1, 0.4, 0.8); scene.add(fill);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  const loader = new GLTFLoader();
  let model;
  try {
    const gltf = await new Promise((res, rej) => loader.load(CFG.glbUrl, res, undefined, rej));
    model = gltf.scene;
  } catch (e) { fail('glb failed to load — check the URL'); return; }
  scene.add(model);

  // ── Frame the shot on the head + shoulders, whatever the avatar's scale. ──
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const lookY = box.min.y + size.y * 0.86;                 // eye/nose height
  const fit = size.y * 0.34;                                // portion of height in frame (head+shoulders)
  const dist = fit / Math.tan((FOV / 2) * Math.PI / 180);
  camera.position.set(center.x, lookY, center.z + dist);
  camera.lookAt(center.x, lookY, center.z);
  resize();

  // ── Find the blendshapes we can drive (ARKit / RPM / Avaturn naming). ──
  const setInf = (r, v) => { const a = r.mesh.morphTargetInfluences; if (a) a[r.idx] = v; };
  const blinks = [];
  const findMouth = () => {
    const want = ['jawopen', 'mouthopen', 'viseme_aa', 'mouth_open', 'viseme_o'];
    for (const n of want) {
      let hit = null;
      model.traverse((o) => {
        if (hit || !o.isMesh || !o.morphTargetDictionary) return;
        for (const key in o.morphTargetDictionary) {
          if (key.toLowerCase() === n || key.toLowerCase().includes(n)) { hit = { mesh: o, idx: o.morphTargetDictionary[key] }; break; }
        }
      });
      if (hit) return hit;
    }
    return null;
  };
  const mouthRec = findMouth();
  model.traverse((o) => {
    if (!o.isMesh || !o.morphTargetDictionary) return;
    for (const key in o.morphTargetDictionary) {
      const lk = key.toLowerCase();
      if (lk.includes('blink') || lk === 'eyesclosed' || lk.includes('eye_close')) blinks.push({ mesh: o, idx: o.morphTargetDictionary[key] });
    }
  });
  const head = model.getObjectByName('Head') || model.getObjectByName('head') || null;

  // ── Motion state ──
  let mode = 'idle';
  let mouth = 0, mouthTarget = 0;
  let tiltTarget = 0, tilt = 0;
  window.__setMode = (m) => {
    mode = m || 'idle';
    tiltTarget = mode === 'thinking' ? 0.13 : mode === 'listening' ? -0.07 : 0;
  };

  // syllable-rate mouth envelope (only while speaking)
  setInterval(() => { mouthTarget = mode === 'speaking' ? (0.18 + Math.random() * 0.55) : 0; }, 110);

  // natural blink cadence
  let blinking = false, blinkT = 0;
  (function schedule() { setTimeout(() => { blinking = true; blinkT = 0; schedule(); }, 2600 + Math.random() * 3600); })();

  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    mouth += (mouthTarget - mouth) * Math.min(1, dt * 14);
    if (mouthRec) setInf(mouthRec, mouth);

    if (blinking) {
      blinkT += dt;
      const p = blinkT / 0.16;
      const v = Math.max(0, Math.min(1, p < 0.5 ? p * 2 : (1 - (p - 0.5) * 2)));
      blinks.forEach((b) => setInf(b, v));
      if (blinkT >= 0.16) { blinking = false; blinks.forEach((b) => setInf(b, 0)); }
    }

    tilt += (tiltTarget - tilt) * Math.min(1, dt * 4);
    const sway = Math.sin(t * 0.6) * 0.045;
    if (head) { head.rotation.z = sway * 0.5; head.rotation.x = tilt; }
    else { model.rotation.y = sway; }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
  post({ type: 'ready' });
})();
</script>
</body>
</html>`;
}
