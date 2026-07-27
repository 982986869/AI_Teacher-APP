// reteach.js
// ── ADAPTIVE RE-TEACH ─────────────────────────────────────────────────────────
// When a student misses a check, a real teacher doesn't replay the same words. She
// (1) acknowledges gently, (2) names the part that was missed, (3) re-teaches it a
// DIFFERENT way — a slow, step-by-step breakdown in simpler terms — and (4) asks an
// easier follow-up before moving on. This builds that response from the scene's own
// context (title · key term · board points), tuned to the student's CLASS.
//
// PRESENTATION/COPY ONLY — pure JS, no backend, no RN. The backend can override any
// of this per scene via `scene.reteach` (same shape as the return here); when it
// doesn't, this fallback always works. Never repeats a line back-to-back.

const lastIdx = {};
function pick(key, list) {
  if (!list || !list.length) return '';
  if (list.length === 1) return list[0];
  let i = Math.floor(Math.random() * list.length);
  if (i === lastIdx[key]) i = (i + 1) % list.length;
  lastIdx[key] = i;
  return list[i];
}

// Class → teaching band (tone, pace, depth of the correction).
export function gradeBand(grade) {
  const g = parseInt(String(grade == null ? '' : grade).replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(g) || !g) return 'mid';
  if (g <= 6) return 'young';    // simple words, everyday, warm
  if (g <= 8) return 'mid';      // real-life application
  if (g <= 10) return 'board';   // board-exam correction, precise
  return 'senior';               // 11–12: conceptual depth, the *why*
}

// 1 · Acknowledge gently — tone follows the class.
const ACK = {
  young:  ['Oops — almost! No worries at all.', 'So close! Let’s try it together.', 'Nearly! Let’s take it slow.'],
  mid:    ['Almost, but not quite.', 'Good try — one bit is missing.', 'Close! Let’s fix a small thing.'],
  board:  ['Not quite — let’s correct that.', 'Close. Let’s tighten it up for the exam.', 'Almost — let’s get it exact.'],
  senior: ['Close, but let’s sharpen the reasoning.', 'Almost — let’s be precise about the why.', 'Nearly — let’s nail the concept.'],
};

// 3 · How she frames the re-teach (a DIFFERENT approach, per band).
const INTRO = {
  young:  ['Let’s go super slow, one tiny step at a time.', 'Think of it the easy way, step by step.'],
  mid:    ['Let’s break it down into simple steps.', 'Here’s another way to see it.'],
  board:  ['Step by step, the way it’s marked in the exam:', 'Let’s rebuild it cleanly, point by point:'],
  senior: ['Let’s reason it from first principles:', 'Here’s the deeper why, step by step:'],
};

// 4 · The easier follow-up question (open, low-stakes).
function easyQuestion(band, key) {
  const k = key || 'this';
  switch (band) {
    case 'young':  return `Simple one — what is “${k}”, in your own words?`;
    case 'board':  return `In one line for the exam: what is the role of “${k}”?`;
    case 'senior': return `So, conceptually — why does “${k}” matter here?`;
    default:       return `So tell me — what’s the main thing to remember about “${k}”?`;
  }
}

// Build the full adaptive re-teach from the scene's own material.
//   { title, keyTerms[], points[], grade } → { ack, gap, intro, steps[], easyQ, key, band }
export function buildReteach({ title, keyTerms, points, grade, wrongStreak = 1, misconception } = {}) {
  const band = gradeBand(grade);
  const key = (Array.isArray(keyTerms) && keyTerms.find(Boolean)) || String(title || '').trim() || 'this idea';
  const pts = (Array.isArray(points) ? points : []).filter(Boolean).slice(0, 3);

  const ack = pick(`ack-${band}`, ACK[band]);
  // 2 · name the missed part — prefer the LLM's specific misconception when we have it
  const miss = typeof misconception === 'string' ? misconception.trim() : '';
  const gap = miss
    ? `The common slip here — ${miss.replace(/\.$/, '')}.`
    : (pts.length > 1
        ? `You’ve got the start — the part to focus on is “${key}”.`
        : `The key part to focus on is “${key}”.`);
  const intro = pick(`intro-${band}`, INTRO[band]);
  // 3 · re-teach DIFFERENTLY — an itemised, slower breakdown (not the old narration)
  const steps = pts.length
    ? pts.map((p, i) => `${i + 1}. ${p}`)
    : [`Think about “${key}” as just one simple idea.`, `Then connect it to what we just saw.`];
  // On a repeat miss, add an extra reassuring nudge so she slows down further.
  if (wrongStreak >= 2) steps.push(`Take your time — once “${key}” clicks, the rest follows.`);
  const easyQ = easyQuestion(band, key);

  return { ack, gap, intro, steps, easyQ, key, band };
}
