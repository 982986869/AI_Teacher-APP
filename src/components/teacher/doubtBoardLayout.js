// Pure helpers for the doubt board (DoubtBoard.js). Deliberately free of React Native
// imports so `npm run test:doubt-board` can run them under plain Node.
//
// Coordinate space 300 x 180 — the same viewBox every lesson board uses, and the same
// numbers the server validated (server/src/utils/boardElements.js).

export const BOARD_W = 300;
export const BOARD_H = 180;

// Elements after the LAST `clear`, each paired with its index in the full list. The key
// is the index so a shape that is already on the board keeps its React key when a new
// one arrives — a stable key is what stops it re-animating.
export function visibleElements(elements) {
  const list = Array.isArray(elements) ? elements : [];
  let start = 0;
  for (let i = 0; i < list.length; i += 1) {
    if (list[i] && list[i].op === 'clear') start = i + 1;
  }
  const out = [];
  for (let i = start; i < list.length; i += 1) {
    const el = list[i];
    if (el && el.op !== 'clear') out.push({ key: i, el });
  }
  return out;
}

// Approximate length of an SVG path as the polyline through its coordinate pairs, in
// order; `Z` closes back to the first point. ChalkStroke needs a length to animate the
// dash offset, and a slight under-estimate only makes the stroke finish a touch early.
export function pathLength(d) {
  const s = String(d || '');
  const nums = (s.match(/-?\d*\.?\d+/g) || []).map(Number);
  const pts = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
  let len = 0;
  for (let i = 1; i < pts.length; i += 1) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  if (/[Zz]/.test(s) && pts.length > 1) {
    const a = pts[pts.length - 1];
    const b = pts[0];
    len += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return Math.max(1, len);
}

export function boardColor(name, palette) {
  const pal = palette || {};
  return (name && pal[name]) || pal.chalk;
}

// Keeps each incoming element until the sentence that introduces it starts playing.
// `queued` is how many sentences had been queued for speech when the element arrived;
// the teacher writes the marker right after the sentence it illustrates, so that
// sentence is number `queued`, and the element is released when it starts.
export function createBoardSync() {
  let held = [];
  return {
    hold(el, queued) {
      held.push({ el, after: Number.isFinite(queued) ? queued : 0 });
    },
    // 1-based ordinal of the sentence that just started speaking.
    sentenceStarted(ordinal) {
      const out = [];
      const keep = [];
      for (const h of held) (h.after <= ordinal ? out : keep).push(h);
      held = keep;
      return out.map((h) => h.el);
    },
    flush() {
      const out = held.map((h) => h.el);
      held = [];
      return out;
    },
    reset() { held = []; },
  };
}
