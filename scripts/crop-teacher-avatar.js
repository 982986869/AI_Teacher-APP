// scripts/crop-teacher-avatar.js
// Produces the two still images the teacher identity needs from ONE source frame:
//
//   assets/teacher-avatar.png  — the full frame, the still fallback behind the video
//   assets/teacher-head.png    — a square face crop, for the small circular badge
//
// Why a script and not a one-off: swapping the avatar is a recurring job (we went
// Daphne -> Tahlia in a day). Downloading a HeyGen look's preview gives one wide
// frame; the badge needs a square of the face out of it, and doing that by hand in
// an editor each time is where the two images drift apart and the hero and the badge
// stop being the same person.
//
//   node scripts/crop-teacher-avatar.js assets/teacher-tahlia.webp
//
// The crop is expressed as FRACTIONS of the source, not pixels, so it survives a
// look whose preview comes back at a different resolution. Defaults are tuned to
// HeyGen's waist-up preview framing (subject centred, head in the top half); pass
// --cx/--top/--size to nudge them for a look that sits differently.

const path = require('path');
const sharp = require('sharp');

const args = process.argv.slice(2);
const src = args.find((a) => !a.startsWith('--'));
if (!src) {
  console.error('usage: node scripts/crop-teacher-avatar.js <source image> [--cx=0.51] [--top=0.037] [--size=0.52]');
  process.exit(1);
}
const opt = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? parseFloat(hit.split('=')[1]) : fallback;
};

// cx   — horizontal centre of the face, as a fraction of width
// top  — top of the crop (just above the hair), as a fraction of height
// size — square side, as a fraction of height
const CX = opt('cx', 0.51);
const TOP = opt('top', 0.037);
const SIZE = opt('size', 0.52);

const root = path.resolve(__dirname, '..');
const outFull = path.join(root, 'assets', 'teacher-avatar.png');
const outHead = path.join(root, 'assets', 'teacher-head.png');

(async () => {
  const input = path.resolve(root, src);
  const meta = await sharp(input).metadata();
  const { width: w, height: h } = meta;

  const side = Math.round(h * SIZE);
  // Clamp inside the frame: a look framed further left than the default would
  // otherwise ask sharp for pixels that don't exist and throw.
  const left = Math.max(0, Math.min(w - side, Math.round(w * CX - side / 2)));
  const top = Math.max(0, Math.min(h - side, Math.round(h * TOP)));

  await sharp(input).png().toFile(outFull);
  await sharp(input).extract({ left, top, width: side, height: side }).png().toFile(outHead);

  console.log(`source     ${src}  ${w}x${h}`);
  console.log(`full   ->  assets/teacher-avatar.png`);
  console.log(`head   ->  assets/teacher-head.png  (${side}x${side} at ${left},${top})`);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
