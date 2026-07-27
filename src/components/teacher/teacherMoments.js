// teacherMoments.js
// ── The human moments AROUND the lesson (not the lesson itself) ────────────────
// The landing greeting, the "she's preparing" beats while a lesson generates, the
// first-hello for a new student, warm empty states, and the way she remembers you
// between lessons. This is the connective tissue that makes the AI Teacher feel
// like a relationship with Ms. Nova rather than a screen in an app.
//
// PRESENTATION COPY ONLY — this is text the app SHOWS. It is deliberately separate
// from teacherPersona.js (the lines she SPEAKS through the voice engine) and never
// touches the backend, the agent, or lesson generation. See [[ai-teacher-voice-architecture]].
//
// Two rules, same as her spoken voice: never repeat a line back-to-back, and let
// the tone follow the moment (new vs returning, morning vs night).

const TEACHER_NAME = 'Nova';

const lastIdx = {};
function pick(key, list) {
  if (!list || !list.length) return '';
  if (list.length === 1) return list[0];
  const prev = lastIdx[key];
  let i = Math.floor(Math.random() * list.length);
  if (i === prev) i = (i + 1) % list.length;
  lastIdx[key] = i;
  return list[i];
}

// Time-of-day salutation from the device clock (safe in app code).
function partOfDay(hour) {
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

// ── The landing greeting ──────────────────────────────────────────────────────
// Returns { hello, prompt }. `hello` is warm + personal (name + time or a welcome
// back); `prompt` invites the next step and shifts if there's something to continue.
export function greeting({ name = 'there', returning = false, hasSaved = false, hour } = {}) {
  const h = typeof hour === 'number' ? hour : new Date().getHours();
  const part = partOfDay(h);
  const SALUTE = {
    morning: [`Good morning, ${name}.`, `Morning, ${name}.`],
    afternoon: [`Good afternoon, ${name}.`, `Afternoon, ${name}.`],
    evening: [`Good evening, ${name}.`, `Evening, ${name}.`],
    night: [`Still up, ${name}?`, `Late one, ${name}?`, `Hi ${name}.`],
  };
  const hello = returning
    ? pick('helloBack', [`Welcome back, ${name}.`, `Good to see you again, ${name}.`, `There you are, ${name}.`])
    : pick(`salute-${part}`, SALUTE[part]);

  const prompt = hasSaved
    ? pick('promptSaved', ['Shall we pick up where we left off?', 'Want to carry on, or start something new?', 'Ready to continue?'])
    : pick('prompt', [
        'What shall we learn today?',
        'What would you like to understand?',
        "Tell me a topic — I'll teach it properly.",
        "What's on your mind today?",
        'Give me anything to explain.',
      ]);
  return { hello, prompt };
}

// ── First hello — a new student who has no history yet. One warm line that tells
// them who she is and how this works, without a wall of onboarding. ─────────────
export function firstHello() {
  return pick('firstHello', [
    `I'm Ms. ${TEACHER_NAME}, your teacher. Name any topic and I'll explain it on the board, step by step — and you can stop me to ask anything.`,
    `I'm Ms. ${TEACHER_NAME}. Tell me what you're curious about and I'll teach it live on the board — ask me a doubt whenever you like.`,
    `New here? I'm Ms. ${TEACHER_NAME}. Pick any topic and we'll work through it together on the board, at your pace.`,
  ]);
}

// ── "She's preparing" — the beats shown while a lesson generates. In HER voice and
// about THIS topic, so waiting feels like she's thinking, not like a spinner. ────
export function preparingBeats(topic) {
  const t = (topic || '').trim();
  const about = t ? `“${t}”` : 'this';
  // Keep beat 1 topic-specific, then pick 3 of a larger pool so the wait feels freshly
  // thought each time rather than the identical reel on every lesson.
  const middle = [
    'Finding the simplest way in…',
    'Picking an example that will click…',
    'Sketching it out on the board…',
    'Choosing the clearest order…',
    'Working out the one idea that unlocks it…',
    'Deciding where the tricky bit hides…',
  ];
  const picked = [...middle].sort(() => Math.random() - 0.5).slice(0, 3);
  return [
    `Let me think about how to teach ${about}…`,
    ...picked,
    'Almost ready — just polishing it…',
  ];
}

// A single reassuring line under the preparing beats (varies, never canned).
export function preparingHint() {
  return pick('prepHint', [
    'A lesson worth remembering takes a moment to shape.',
    'Good teaching is worth the small wait.',
    "I'd rather get this right than rush it.",
  ]);
}

// ── The hand-off — the beat right as the lesson opens, so entering the class feels
// like she turns to you and begins, not a screen swap. ──────────────────────────
export function handoff(topic) {
  const t = (topic || '').trim();
  return t
    ? pick('handoff', [`Alright — let's get into ${t}.`, `Okay, ${t}. Watch the board with me.`, `Here we go — ${t}.`])
    : pick('handoffPlain', ["Alright — let's begin.", 'Okay, watch the board with me.', 'Here we go.']);
}

// ── Warm empty states — never a blank or a dead-end. ──────────────────────────
export function emptyState(kind) {
  switch (kind) {
    case 'insights':
      return "Once we've done a few lessons, I'll track what's strong and what to revisit — right here.";
    case 'history':
      return "Nothing yet — teach me what you want to learn and we'll start your story together.";
    default:
      return "Nothing here yet — but it'll grow as we learn together.";
  }
}

// ── Continuity — how she frames coming back to unfinished / past work. ─────────
export function resumeTag() {
  return pick('resumeTag', ['PICK UP WHERE WE LEFT OFF', 'LET’S CONTINUE', 'STILL ON THE BOARD']);
}
