// teacherPersona.js
// ── The teacher's HUMAN voice, not her looks ──────────────────────────────────
// A real tutor never says the exact same sentence twice in a row, and her tone
// shifts with how the student is doing. This module is the single place that
// decides *what Ms. Nova says* at the little human moments the app controls
// (praise, reassurance, listening, wrapping up) — with two rules baked in:
//
//   1. NEVER repeat a line back-to-back  (pick() remembers the last index/category)
//   2. Tone follows the student           (confident → warm → gentle-on-repeat)
//
// The lesson *content* still comes from the model; this is the connective human
// tissue around it, so the parts the student hears every single lesson never
// start to sound canned. See [[ai-teacher-voice-architecture]] — these strings
// are spoken through the same teacherVoice engine, never Speech.speak directly.

// Remember the last index used per bucket so we never repeat a line twice running.
const lastIdx = {};

// Pick one line from a list, never the same one as last time for this key.
function pick(key, list) {
  if (!list || !list.length) return '';
  if (list.length === 1) return list[0];
  const prev = lastIdx[key];
  let i = Math.floor(Math.random() * list.length);
  if (i === prev) i = (i + 1) % list.length; // step off a repeat
  lastIdx[key] = i;
  return list[i];
}

// ── Praise — when the student gets a quick-check right ────────────────────────
// `streak` lets a run of right answers ramp from warm to genuinely proud.
const PRAISE = [
  'Yes! Exactly right.',
  "That's it. Well done.",
  'Correct — you saw it.',
  'Perfect. You got it.',
  'Spot on.',
  "There you go — that's the one.",
  'Exactly. That reasoning is solid.',
  "Right again — you're thinking it through.",
  'Beautiful. That\'s precisely it.',
  "Yes — and you got there yourself.",
  'Clean answer. Well reasoned.',
];
const PRAISE_STREAK = [
  "Three in a row — you're on fire.",
  "You're really flying now.",
  "Look at you go. That's mastery.",
  "Nothing's stopping you today.",
  "That's a real streak — the ideas are clicking.",
  "One after another. This is genuine understanding.",
];

// ── Reassurance — a WRONG answer, first time. Warm, never disappointed ────────
const REASSURE = [
  "Close — look again. The right one's marked.",
  'Not quite, and that\'s okay. See the highlighted one?',
  "Good try — the answer's the one glowing.",
  "Almost. Let's fix the idea together.",
  "Nearly there. Notice which one is right.",
  "Not this time — and that's fine. The right one is marked.",
  "So close. Look at the highlighted answer and see why.",
  "Good thinking, just missed it — the correct one is glowing.",
];

// ── Repeated mistake — SAME idea missed again. Slow down, no frustration ──────
const REASSURE_AGAIN = [
  "Let's slow right down — no rush at all.",
  "This one's tricky. Take a breath, we'll get it.",
  "Happens to everyone. Watch the highlighted one carefully.",
  "Take your time. I'm not going anywhere.",
];

// ── Self-check reveal (the open, no-wrong-answer check) ───────────────────────
const SELF_CHECK = [
  'Say it out loud in your own words, then carry on.',
  'Explain it to yourself — then tap continue.',
  'If you can say it simply, you understand it. Continue when ready.',
];

// ── Listening — while the mic is open ─────────────────────────────────────────
const LISTENING = [
  "I'm listening…",
  'Go ahead — ask away.',
  "What's on your mind?",
  "Ask me anything about this.",
];

// ── A tiny beat before she starts answering a doubt ───────────────────────────
const THINKING_BEAT = [
  'Good question — let me think.',
  'Right, let me put that clearly.',
  'Let me explain it properly.',
];

// ── Wrapping up a lesson ──────────────────────────────────────────────────────
const COMPLETE = [
  'Great focus today. Take it again whenever you like.',
  "You stayed with it the whole way — that's how it sticks.",
  "Solid work. Come back and run it again any time.",
  "Nicely done. A second pass tomorrow will lock it in.",
  "That's a wrap — and you earned it. Bring me another topic whenever you're ready.",
  "Lovely work. I'll be right here when you want the next one.",
  "You showed up and stuck with it — that's the whole game. See you next time.",
];

// Public helpers — each never repeats its last line. Callers pass a signal so the
// tone can follow the student instead of firing the same register every time.

export function praiseLine(streak = 0) {
  if (streak >= 3 && Math.random() < 0.6) return pick('praiseStreak', PRAISE_STREAK);
  return pick('praise', PRAISE);
}

// wrongStreak: how many times THIS check has been missed (1 = first miss).
export function reassureLine(wrongStreak = 1) {
  return wrongStreak >= 2 ? pick('reassureAgain', REASSURE_AGAIN) : pick('reassure', REASSURE);
}

// ── Natural openers — a human beat before she starts a scene, chosen to fit the
// teaching STYLE so a story opens like a story and a formula like a rule. Never
// repeats back-to-back (pick), so consecutive scenes never sound templated.
const OPENERS = {
  Story: ['Picture this.', "Here's a little story.", 'Imagine this for a second.'],
  Analogy: ['Think of it like this.', "Here's a simple way to see it.", 'Compare it to something everyday.'],
  Experiment: ["Let's try it and see.", 'Watch what happens.', "Let's test it out."],
  WorkedExample: ["Let's work one out.", 'Follow along with me.', "We'll take it step by step."],
  Revision: ['Quick recap.', "Let's lock this in.", 'The big picture, fast.'],
  Formula: ["Here's the rule.", 'This is the one to remember.', 'Note this one down.'],
  Diagram: ['Look here.', "Let's see it on the board.", 'Watch the board with me.'],
  Concept: ['Alright.', "Okay, here's the idea.", "Let's get into it.", 'Now, listen.'],
};
export function openerFor(template) { return pick(`opener-${template}`, OPENERS[template] || OPENERS.Concept); }

// ── Micro-interjections — the little human noises a tutor makes mid-thought.
const INTERJECT = {
  think: ['Hmm.', "Let's think about it.", 'Give it a moment.'],
  good: ['Good catch.', 'Nice.', 'Interesting observation.', 'Exactly.'],
  soft: ['Almost.', 'So close.', 'Not quite yet.'],
  next: ["Let's try another example.", 'One more.', 'Moving on.'],
};
export function interjection(kind) { return pick(`interject-${kind}`, INTERJECT[kind] || INTERJECT.think); }

// ── Picking the thread back up after a student interrupts with a doubt — the little
// bridge a real tutor says before carrying on, so a resume feels like a conversation
// continuing, not a slide un-pausing. Prepended to the sentence she resumes on, so
// it reads as one natural line: "Right, where were we? Okay, <the sentence>." ──────
const RESUME_BRIDGE = [
  'Right — where were we? Okay,',
  'Good question. So, back to it —',
  'Got it? Let’s carry on.',
  'Okay — picking up where we left off.',
  'Makes sense? Right, back to it —',
];
const RESUME_BRIDGE_TOPIC = [
  'Right — so, back to {t}.',
  'Okay, where were we — yes, {t}.',
  'Good. Now, back to {t} —',
];
export function resumeBridge(topic) {
  const t = String(topic || '').trim();
  if (t && Math.random() < 0.6) return pick('resumeTopic', RESUME_BRIDGE_TOPIC).replace('{t}', t);
  return pick('resume', RESUME_BRIDGE);
}

export function selfCheckLine() { return pick('selfCheck', SELF_CHECK); }
export function listeningLine() { return pick('listening', LISTENING); }
export function thinkingBeat() { return pick('thinkBeat', THINKING_BEAT); }
export function completeLine() { return pick('complete', COMPLETE); }

// ── Behaviour, not words: which face fits this moment ─────────────────────────
// Maps a teaching scene to the RIGHT expression from the avatar's vocabulary, so
// she *points* at a diagram, *writes* through a formula/proof, softens on the
// common-mistake slide, and warms up on the recap — instead of one flat
// "explaining" look for everything. `speaking` = is she talking right now.
export function expressionForScene(boardType, speaking) {
  switch (boardType) {
    case 'triangle':
    case 'concept':
      // a diagram is on the board — she gestures toward it
      return speaking ? 'pointing' : 'writing';
    case 'formula':
    case 'proof':
      // the board is being drawn/derived — she's working it out at the board
      return speaking ? 'writing' : 'thinking';
    case 'mistake':
      // the "watch out" slide — she explains the trap plainly. The brief flash of
      // surprise is fired as a one-shot when the slide lands (see the player), so
      // the sustained face here stays warm-serious, not permanently alarmed.
      return speaking ? 'explaining' : 'thinking';
    case 'summary':
      return 'encouraging';
    case 'quickCheck':
      return 'encouraging';
    case 'intro':
      return speaking ? 'explaining' : 'smile';
    default:
      return speaking ? 'explaining' : 'happy';
  }
}
