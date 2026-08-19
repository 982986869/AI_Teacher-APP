// scripts/bake-teacher-clip.js
// Bakes the teacher's violet stage INTO her talking clip:
//
//   assets/teacher-tahlia.mp4  ->  assets/teacher-tahlia-stage.mp4
//
// Why this exists: HeyGen hands back an H.264 clip, and H.264 carries no alpha —
// the look's preview arrives as the avatar on a flat near-white studio backdrop
// (measured rgb(246,245,250), dead flat across the frame). Dropped straight into
// LiveTeachingPlayer's camera card that backdrop covers the whole card and the
// violet stage disappears behind a white box. The still (assets/teacher-avatar.png)
// has a real alpha channel and does not have this problem, so a naive
// still <-> video swap also flickers white every time she starts talking.
//
// Keying the backdrop out at RUNTIME is not an option in React Native (no shader
// hook into expo-av), and the transparent-video routes are worse: iOS needs HEVC
// with alpha in a .mov, Android needs VP9 alpha in a .webm, and expo-av plays
// neither reliably. So the composite happens ONCE, here, offline: key the flat
// backdrop out, lay her over the card's own gradient, ship a normal H.264 mp4 that
// plays everywhere with no runtime cost.
//
//   node scripts/bake-teacher-clip.js
//   node scripts/bake-teacher-clip.js --in=assets/other.mp4 --similarity=0.03
//
// Needs ffmpeg on PATH.
//
// ⚠ The key is TIGHT on purpose. Her shirt is white-ish and sits only ~0.038 away
// from the backdrop in ffmpeg's normalised colour distance, so a generous
// similarity eats her collar and shoulders. Default 0.02 clears the backdrop (which
// is at distance 0) with room to spare and leaves the shirt alone. If a future look
// wears something paler, lower it rather than raising it, and check a frame.
// (Measured: at 0.030 the shirt front goes visibly see-through. Do not raise it to
// chase edge quality — that is what the erosion below is for.)
//
// The tight key leaves a pale FRINGE around her hair: the clip is yuv420p, so edge
// pixels are a blend of backdrop and hair and land outside the key. Widening the
// key to swallow them takes the shirt with it, so instead the matte is eroded by a
// pixel after keying — it trims exactly that halo and touches nothing else. A few
// sub-pixel violet specks survive on the shirt placket; she renders ~190dp wide
// from a 913px-wide figure, so they land well under a pixel on screen.
//
// ⚠ GRADIENT must stay in step with CAM_GRAD in LiveTeachingPlayer.js. The baked
// clip covers the whole card, so it IS the stage while she talks — if the two drift
// apart the card changes colour when she starts speaking.

const path = require('path');
const os = require('os');
const fs = require('fs');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};

const root = path.resolve(__dirname, '..');
const IN = path.resolve(root, opt('in', 'assets/teacher-tahlia.mp4'));
const OUT = path.resolve(root, opt('out', 'assets/teacher-tahlia-stage.mp4'));
const SIMILARITY = parseFloat(opt('similarity', '0.02'));
const BLEND = parseFloat(opt('blend', '0.04'));

// CAM_GRAD in src/components/teacher/LiveTeachingPlayer.js, with the same
// start/end the LinearGradient there uses.
const GRADIENT = ['#A855F7', '#7C3AED', '#5B32C4'];
const GRAD_FROM = { x: 0.1, y: 0 };
const GRAD_TO = { x: 0.9, y: 1 };

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// The backdrop colour is READ OFF the clip's own first frame rather than hardcoded,
// so a look exported on a slightly different studio white still keys cleanly.
function backdropOf(framePath) {
  return sharp(framePath).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      // Four corners, so a stray dark pixel in one of them can't decide the key.
      const at = (x, y) => { const i = (y * info.width + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
      const pts = [at(2, 2), at(info.width - 3, 2), at(2, info.height - 3), at(info.width - 3, info.height - 3)];
      return [0, 1, 2].map((c) => Math.round(pts.reduce((s, p) => s + p[c], 0) / pts.length));
    });
}

// A linear gradient laid out exactly the way React Native's LinearGradient does:
// project each pixel onto the start->end vector, then interpolate the stops.
async function gradientPng(w, h, file) {
  const stops = GRADIENT.map(hex);
  const dx = GRAD_TO.x - GRAD_FROM.x;
  const dy = GRAD_TO.y - GRAD_FROM.y;
  const len2 = dx * dx + dy * dy;
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      let t = ((u - GRAD_FROM.x) * dx + (v - GRAD_FROM.y) * dy) / len2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      // evenly spaced stops, same as LinearGradient with no `locations`
      const seg = t * (stops.length - 1);
      const i = Math.min(stops.length - 2, Math.floor(seg));
      const f = seg - i;
      const o = (y * w + x) * 3;
      for (let c = 0; c < 3; c++) buf[o + c] = Math.round(stops[i][c] + (stops[i + 1][c] - stops[i][c]) * f);
    }
  }
  await sharp(buf, { raw: { width: w, height: h, channels: 3 } }).png().toFile(file);
}

(async () => {
  if (!fs.existsSync(IN)) throw new Error(`no such clip: ${IN}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'teacher-clip-'));
  const framePath = path.join(tmp, 'frame0.png');
  const gradPath = path.join(tmp, 'stage.png');

  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', IN, '-vframes', '1', framePath]);
  const meta = await sharp(framePath).metadata();
  const key = await backdropOf(framePath);
  const keyHex = '0x' + key.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase();

  await gradientPng(meta.width, meta.height, gradPath);

  // format=rgba first: colorkey needs an alpha channel to write into, and the
  // source is yuv420p. shortest=1 so the looping still image doesn't run forever.
  execFileSync('ffmpeg', [
    '-v', 'error', '-y',
    '-loop', '1', '-i', gradPath,
    '-i', IN,
    '-filter_complex',
    `[1:v]format=rgba,colorkey=${keyHex}:${SIMILARITY}:${BLEND},split=2[ka][kb];`
    + `[ka]alphaextract,erosion=coordinates=255[matte];`
    + `[kb][matte]alphamerge[fg];`
    + `[0:v][fg]overlay=shortest=1,format=yuv420p[v]`,
    '-map', '[v]', '-an',
    '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    OUT,
  ]);

  fs.rmSync(tmp, { recursive: true, force: true });
  const kb = (fs.statSync(OUT).size / 1024) | 0;
  console.log(`source    ${path.relative(root, IN)}  ${meta.width}x${meta.height}`);
  console.log(`backdrop  ${keyHex}  (keyed at similarity ${SIMILARITY}, blend ${BLEND}, matte eroded 1px)`);
  console.log(`stage     ${GRADIENT.join(' -> ')}`);
  console.log(`baked ->  ${path.relative(root, OUT)}  (${kb}KB)`);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
