// avatarViewerHtml.js
// Builds the self-contained HTML for the WebView 3D teacher avatar.
//
// The WebView runs the full AvatarRuntime (multi-mesh ARKit morph driving,
// DRACO/KTX2/Meshopt loaders, three-point lighting, blink / breath / eye-lead,
// expression states + Rhubarb-style visemes). The face DATA lives in one place —
// ./expressions.js — and is injected here as JSON so there is a single source of
// truth; the AvatarRuntime CLASS is inlined into the page because the WebView is a
// separate JS realm with no bundler serving loose modules to it.
//
// The React Native side drives it through window.__setMode('speaking' | 'listening'
// | 'thinking' | 'idle'). expo-speech gives us no phoneme timing, so "speaking"
// cycles Rhubarb mouth cues procedurally on a syllable-rate envelope; the other
// modes just pick the matching expression + head pose.
//
// three.js and the decoders load from CDNs (the WebView has network; no CSP here).
// On any failure the page posts {type:'error'} back to React Native, which falls
// back to the still photo — so a flaky network or a bad URL never leaves a blank
// frame.

import { EXPRESSIONS, POSE_HINTS, VISEMES } from './expressions';

const THREE_VER = '0.160.0';
const DRACO_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';
const KTX2_PATH = `https://unpkg.com/three@${THREE_VER}/examples/jsm/libs/basis/`;

// App mode -> one of expressions.js' EXPRESSION states. "speaking" also gets the
// procedural viseme driver below; the rest are pose + brow/mouth expressions only.
const STATE_FOR = { idle: 'idle', thinking: 'thinking', listening: 'encouraging', speaking: 'explaining' };

export function buildAvatarHtml({ glbUrl, bg = '#11151D' } = {}) {
  const cfg = JSON.stringify({
    glbUrl: glbUrl || '',
    bg,
    dracoPath: DRACO_PATH,
    ktx2Path: KTX2_PATH,
    stateFor: STATE_FOR,
    EXPRESSIONS,
    POSE_HINTS,
    VISEMES,
  });

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

let THREE, GLTFLoader, DRACOLoader, KTX2Loader, MeshoptDecoder;
try {
  THREE = await import('three');
  ({ GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'));
  ({ DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js'));
  ({ KTX2Loader } = await import('three/addons/loaders/KTX2Loader.js'));
  ({ MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js'));
} catch (e) { fail('three.js failed to load — check network'); }

// Face data — single source of truth, injected from ./expressions.js.
const EXPRESSIONS = CFG.EXPRESSIONS;
const POSE_HINTS = CFG.POSE_HINTS;
const VISEMES = CFG.VISEMES;

/** Every morph any viseme touches — reset these as a set, or shapes stick. */
const VISEME_CHANNELS = [...new Set(Object.values(VISEMES).flatMap(Object.keys))];

/** Exponential damping — framerate independent, unlike a raw lerp. */
function damp(current, target, lambda, dt) {
  return target + (current - target) * Math.exp(-lambda * dt);
}

class AvatarRuntime {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.onStats = opts.onStats || (() => {});
    this.onMorphs = opts.onMorphs || (() => {});

    // name -> [{ mesh, index }]. One ARKit name can live on several meshes
    // (head, teeth, tongue, eyes) and every one of them must be driven.
    this.morphs = new Map();
    this.current = new Map(); // name -> live weight
    this.target = new Map();  // name -> desired weight

    this.state = 'idle';
    this.bones = { head: null, neck: null, chest: null, eyeL: null, eyeR: null };
    this.pose = { pitch: 0, yaw: 0, roll: 0 };
    this.poseTarget = { pitch: 0, yaw: 0, roll: 0 };

    this.blink = { weight: 0, timer: 2, phase: 'idle' };
    this.look = { x: 0, y: 0, tx: 0, ty: 0 };
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._initScene();
  }

  _initScene() {
    const { canvas } = this;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
    this.camera.position.set(0, 1.58, 1.05);

    this.rig = new THREE.Group();
    this.scene.add(this.rig);

    // Three-point setup. Warm key, cool fill, rim to lift her off the bg —
    // this is what reproduces the soft render look without raytracing.
    const key = new THREE.DirectionalLight(0xfff1e0, 2.4);
    key.position.set(1.4, 2.2, 2.0);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xcfe0ff, 0.8);
    fill.position.set(-2.0, 1.2, 1.0);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 1.6);
    rim.position.set(-0.8, 2.0, -2.2);
    this.scene.add(rim);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3a44, 0.7));

    this.resize();
    window.addEventListener('resize', () => this.resize());

    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.look.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      this.look.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
    canvas.addEventListener('pointerleave', () => {
      this.look.tx = 0;
      this.look.ty = 0;
    });
  }

  resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  async load(url) {
    const t0 = performance.now();

    const draco = new DRACOLoader().setDecoderPath(CFG.dracoPath);
    const ktx2 = new KTX2Loader()
      .setTranscoderPath(CFG.ktx2Path)
      .detectSupport(this.renderer);

    const loader = new GLTFLoader()
      .setDRACOLoader(draco)
      .setKTX2Loader(ktx2)
      .setMeshoptDecoder(MeshoptDecoder);

    const gltf = await loader.loadAsync(url);

    if (this.model) this.rig.remove(this.model);
    this.model = gltf.scene;
    this.rig.add(this.model);

    this._collectMorphs();
    this._collectBones();
    this.setState('idle', true);

    const stats = {
      loadMs: Math.round(performance.now() - t0),
      triangles: this.renderer.info.render.triangles,
      morphCount: this.morphs.size,
      meshes: 0,
      arkitCoverage: this._arkitCoverage(),
    };
    this.model.traverse((o) => { if (o.isMesh) stats.meshes++; });
    this.onStats(stats);

    draco.dispose();
    ktx2.dispose();
    return stats;
  }

  _collectMorphs() {
    this.morphs.clear();
    this.model.traverse((o) => {
      if (!o.isMesh || !o.morphTargetDictionary) return;
      o.frustumCulled = false; // morphed bounds go stale and pop out of view
      for (const [name, index] of Object.entries(o.morphTargetDictionary)) {
        if (!this.morphs.has(name)) this.morphs.set(name, []);
        this.morphs.get(name).push({ mesh: o, index });
      }
    });
    for (const name of this.morphs.keys()) {
      this.current.set(name, 0);
      this.target.set(name, 0);
    }
  }

  _collectBones() {
    const want = {
      head: /^(head|mixamorig:?head)$/i,
      neck: /^(neck|mixamorig:?neck)$/i,
      chest: /^(spine2|chest|upperchest|mixamorig:?spine2)$/i,
      eyeL: /^(lefteye|eyeleft|mixamorig:?lefteye)$/i,
      eyeR: /^(righteye|eyeright|mixamorig:?righteye)$/i,
    };
    this.model.traverse((o) => {
      if (!o.isBone) return;
      for (const [slot, re] of Object.entries(want)) {
        if (!this.bones[slot] && re.test(o.name)) {
          this.bones[slot] = o;
          o.userData.restRotation = o.rotation.clone();
        }
      }
    });
  }

  _arkitCoverage() {
    const required = Object.values(EXPRESSIONS)
      .flatMap((e) => Object.keys(e))
      .filter((k) => k !== 'headTiltHint');
    const have = required.filter((k) => this.morphs.has(k));
    return { have: have.length, need: new Set(required).size };
  }

  setState(state, instant = false) {
    if (!EXPRESSIONS[state]) throw new Error('Unknown state: ' + state);
    this.state = state;

    for (const name of this.target.keys()) this.target.set(name, 0);
    for (const [name, weight] of Object.entries(EXPRESSIONS[state])) {
      if (this.target.has(name)) this.target.set(name, weight);
    }

    const hint = POSE_HINTS[state] || { pitch: 0, yaw: 0, roll: 0 };
    this.poseTarget = { pitch: hint.pitch, yaw: hint.yaw, roll: hint.roll };

    if (instant) {
      for (const [name, v] of this.target) this.current.set(name, v);
      this.pose = { pitch: this.poseTarget.pitch, yaw: this.poseTarget.yaw, roll: this.poseTarget.roll };
    }
  }

  /** Drive the mouth directly from a Rhubarb cue. */
  setViseme(cue) {
    const mix = VISEMES[cue] || {};
    for (const name of VISEME_CHANNELS) {
      if (this.target.has(name)) this.target.set(name, 0);
    }
    for (const [name, w] of Object.entries(mix)) {
      if (this.target.has(name)) this.target.set(name, w);
    }
  }

  _applyMorph(name, value) {
    const slots = this.morphs.get(name);
    if (!slots) return;
    for (const { mesh, index } of slots) {
      mesh.morphTargetInfluences[index] = value;
    }
  }

  _updateBlink(dt) {
    const b = this.blink;
    if (this.reducedMotion) return;

    if (b.phase === 'idle') {
      b.timer -= dt;
      if (b.timer <= 0) { b.phase = 'closing'; }
    } else if (b.phase === 'closing') {
      b.weight += dt / 0.06;
      if (b.weight >= 1) { b.weight = 1; b.phase = 'opening'; }
    } else if (b.phase === 'opening') {
      b.weight -= dt / 0.11;
      if (b.weight <= 0) {
        b.weight = 0;
        b.phase = 'idle';
        b.timer = 1.8 + Math.random() * 4.2; // humans blink irregularly
      }
    }

    // Additive over whatever the expression already asked for.
    for (const eye of ['eyeBlinkLeft', 'eyeBlinkRight']) {
      const base = this.current.get(eye) ?? 0;
      this._applyMorph(eye, Math.min(1, base + b.weight));
    }
  }

  _updateBreath(dt) {
    if (this.reducedMotion || !this.bones.chest) return;
    const rest = this.bones.chest.userData.restRotation;
    const breath = Math.sin(this.elapsed * 1.15) * 0.012;
    this.bones.chest.rotation.x = rest.x + breath;
    this.rig.position.y = Math.sin(this.elapsed * 1.15) * 0.004;
  }

  _updateLook(dt) {
    this.look.x = damp(this.look.x, this.look.tx, 6, dt);
    this.look.y = damp(this.look.y, this.look.ty, 6, dt);

    this.pose.pitch = damp(this.pose.pitch, this.poseTarget.pitch, 7, dt);
    this.pose.yaw = damp(this.pose.yaw, this.poseTarget.yaw, 7, dt);
    this.pose.roll = damp(this.pose.roll, this.poseTarget.roll, 7, dt);

    const { head, neck } = this.bones;
    if (head) {
      const rest = head.userData.restRotation;
      head.rotation.set(
        rest.x + this.pose.pitch + this.look.y * 0.18,
        rest.y + this.pose.yaw - this.look.x * 0.28,
        rest.z + this.pose.roll,
      );
    }
    if (neck) {
      const rest = neck.userData.restRotation;
      neck.rotation.set(
        rest.x + this.look.y * 0.07,
        rest.y - this.look.x * 0.11,
        rest.z,
      );
    }

    // Eyes lead the head — this is the detail that reads as "she saw me".
    const ex = -this.look.x * 0.32;
    const ey = this.look.y * 0.2;
    for (const eye of [this.bones.eyeL, this.bones.eyeR]) {
      if (!eye) continue;
      const rest = eye.userData.restRotation;
      eye.rotation.set(rest.x + ey, rest.y + ex, rest.z);
    }
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.elapsed += dt;

    for (const [name, target] of this.target) {
      const next = damp(this.current.get(name), target, 9, dt);
      this.current.set(name, next);
      this._applyMorph(name, next);
    }

    this._updateBlink(dt);
    this._updateBreath(dt);
    this._updateLook(dt);

    this.renderer.render(this.scene, this.camera);
  }

  start() {
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      this.update();
      if (this.elapsed % 0.1 < 0.02) this.onMorphs(this.current);
    };
    loop();
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }
}

// ── Bootstrap + React Native bridge ────────────────────────────────────────────
if (CFG.glbUrl && THREE) {
  const canvas = document.getElementById('c');
  let runtime;
  try {
    runtime = new AvatarRuntime(canvas, { onStats: (s) => post({ type: 'stats', stats: s }) });
  } catch (e) { fail('runtime init failed: ' + (e && e.message)); }

  if (runtime) {
    // App mode -> expression state. Guarded so an unmapped mode can't throw.
    // Defined before we post 'ready' so the mode RN injects on ready never races.
    let mode = 'idle';
    window.__setMode = (m) => {
      mode = m || 'idle';
      const st = CFG.stateFor[mode] || 'idle';
      try { runtime.setState(st); } catch (e) {}
    };

    // Procedural lip-sync: expo-speech gives no phoneme timing, so while she's
    // "speaking" we cycle Rhubarb mouth cues on a syllable-rate envelope. Never
    // repeats the same cue twice in a row, so the mouth never loops one shape.
    const CUES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let last = 'X';
    setInterval(() => {
      if (mode !== 'speaking') return;
      let cue = last;
      while (cue === last) cue = CUES[Math.floor(Math.random() * CUES.length)];
      last = cue;
      runtime.setViseme(cue);
    }, 110);

    try {
      await runtime.load(CFG.glbUrl);
      runtime.start();
      post({ type: 'ready' });
    } catch (e) { fail('glb failed to load — check the URL'); }
  }
}
</script>
</body>
</html>`;
}
