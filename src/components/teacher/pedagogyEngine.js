// pedagogyEngine.js
// ── THE PEDAGOGY ENGINE ───────────────────────────────────────────────────────
// The DECISION LAYER that sits between the lesson planner and the renderer.
//
//   Planner (buildScenes/directLesson)  →  WHAT to teach (knowledge + choreography)
//   Pedagogy Engine (this file)         →  what the teacher should DO next
//   Renderer (LiveTeachingPlayer)       →  only draws / speaks what it is told
//
// A real teacher is constantly making micro-decisions: ask now or explain more,
// nudge with a hint or re-teach differently, pause, recap, praise, move on. Those
// decisions are NOT hardcoded in the renderer any more — they are expressed here
// as weighted teacher heuristics over the signals the app already has:
//
//   • lesson progress   (which scene, how far in, is it the last one)
//   • student responses (right / wrong, streaks, self-checks)
//   • misconceptions    (the specific wrong idea a check exposed)
//   • confidence        (0..1 read of how the student is doing)
//   • grade level        (a Class-4 room is run very differently from a Class-12 one)
//
// It is PURE — no React, no backend, no timers — so it is reusable and testable in
// isolation, and can be swapped for a smarter policy later without touching the
// renderer. Every decision returns a machine action PLUS a human-readable reason,
// so the teacher's thinking is always inspectable.

// The teacher's full vocabulary of moves. The renderer maps each to something it
// already knows how to render/speak; unknown actions degrade to Transition.
export const ACTIONS = {
  EXPLAIN: 'Explain',
  DEMONSTRATE: 'Demonstrate',
  ASK_QUESTION: 'AskQuestion',
  GIVE_HINT: 'GiveHint',
  RE_EXPLAIN: 'ReExplain',
  GIVE_ANALOGY: 'GiveAnalogy',
  GIVE_EXAMPLE: 'GiveExample',
  PAUSE: 'Pause',
  RECAP: 'Recap',
  PRACTICE: 'Practice',
  PRAISE: 'Praise',
  TRANSITION: 'Transition',
  SUMMARIZE: 'Summarize',
};

// Class → teaching band. Younger rooms recap more, lean on analogies/examples, and
// earn more praise; senior rooms probe reasoning and move crisply. (Kept local so
// the engine is a self-contained drop-in; mirrors reteach.gradeBand intentionally.)
export function bandFor(grade) {
  const g = parseInt(String(grade == null ? '' : grade).replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(g) || !g) return 'mid';
  if (g <= 6) return 'young';
  if (g <= 8) return 'mid';
  if (g <= 10) return 'board';
  return 'senior';
}

// How often a band likes to consolidate (scenes between periodic recaps).
function recapEvery(band) {
  switch (band) {
    case 'young': return 2;
    case 'mid': return 3;
    case 'board': return 4;
    default: return 5; // senior — trusts retention longer
  }
}

// A fresh pedagogy state at lesson start. With no `prior` it is neutral (as before).
// When we remember the student (`prior` = the long-term model from foldOutcome), the
// lesson STARTS from what we know: confidence is seeded, and a student we remember as
// struggling earns extra scaffolding (examples/analogies come sooner) from scene one.
export function freshPedagogy({ grade, total, prior } = {}) {
  const seed = prior && typeof prior.confidence === 'number' ? Math.max(0, Math.min(1, prior.confidence)) : 0.5;
  const exampleBias = !!(prior && (
    (typeof prior.confidence === 'number' && prior.confidence <= 0.42) ||
    (typeof prior.accuracy === 'number' && prior.accuracy < 55)
  ));
  return {
    band: bandFor(grade),
    grade: grade == null ? null : grade,
    total: total || 0,
    index: 0,
    confidence: seed,    // 0..1; seeded from memory, the host may override with a richer read
    seed,
    exampleBias,         // remembered as struggling → reach for examples/analogies sooner
    priorLessons: (prior && prior.lessons) || 0,
    checks: 0,
    correct: 0,
    misses: 0,
    wrongStreak: 0,      // consecutive misses on the CURRENT check
    rightStreak: 0,      // consecutive correct checks
    hintsThisCheck: 0,   // hints already spent on the current question
    lastMisconception: null,
    sinceRecap: 0,       // content scenes since the last recap
    recentDoubt: false,  // student just asked something — a beat to breathe helps
    lastAction: null,
  };
}

// Internal confidence read from the tallies so the engine works standalone even if
// the host has no emotion engine. Same shape/spirit as emotionEngine.assess so the
// two never disagree by much; the host can still override via ctx.confidence.
function readConfidence(s) {
  const struggle = s.misses * 1.0;
  const fluency = s.correct * 0.6;
  return Math.max(0, Math.min(1, 0.5 + (fluency - struggle) * 0.12));
}

// Fold one observed teaching event into the state. Returns a NEW object. Events:
//   { type: 'answer', correct, misconception }   — a check was answered
//   { type: 'hint' }                             — a hint was given for this check
//   { type: 'progress', index }                  — moved to a new scene
//   { type: 'recap' }                            — a recap was delivered
//   { type: 'replay' } | { type: 'doubt' }       — student replayed / asked
//   { type: 'confidence', value }                — host's richer confidence read
export function observePedagogy(state, event) {
  const s = { ...(state || freshPedagogy()) };
  const e = event || {};
  switch (e.type) {
    case 'answer':
      s.checks += 1;
      if (e.correct) {
        s.correct += 1;
        s.rightStreak += 1;
        s.wrongStreak = 0;
        s.hintsThisCheck = 0;           // check resolved — fresh slate for the next
        s.lastMisconception = null;
      } else {
        s.misses += 1;
        s.wrongStreak += 1;
        s.rightStreak = 0;
        if (e.misconception) s.lastMisconception = e.misconception;
      }
      s.confidence = readConfidence(s);
      break;
    case 'hint':
      s.hintsThisCheck += 1;
      break;
    case 'progress':
      if (typeof e.index === 'number' && e.index !== s.index) {
        s.index = e.index;
        s.sinceRecap += 1;
        s.wrongStreak = 0;              // a new scene starts a clean check slate
        s.hintsThisCheck = 0;
        s.recentDoubt = false;
      }
      break;
    case 'recap':
      s.sinceRecap = 0;
      break;
    case 'replay':
      s.recentDoubt = true;            // replaying signals "I didn't get that"
      break;
    case 'doubt':
      s.recentDoubt = true;
      break;
    case 'confidence':
      if (typeof e.value === 'number') s.confidence = Math.max(0, Math.min(1, e.value));
      break;
    default:
      break;
  }
  return s;
}

const D = (action, reason, params) => ({ action, reason, ...(params ? { params } : {}) });

// ── The core decision. Given the live state and the moment we're deciding at,
// return the single next teaching action + why. `ctx.phase` frames the moment:
//   'start'      — a scene is about to begin
//   'afterCheck' — a check was just answered (state already folded in the answer)
//   'sceneEnd'   — a content scene finished; decide the flow
// `ctx` also carries what the renderer can offer right now:
//   { confidence, retryable, hasAnalogy, hasExample, hasPractice, isLast, sceneType }
export function decideNextAction(state, ctx = {}) {
  const s = state || freshPedagogy();
  const band = s.band || 'mid';
  const conf = typeof ctx.confidence === 'number' ? ctx.confidence : s.confidence;
  const phase = ctx.phase || 'sceneEnd';

  // ── 1 · Opening a scene — explain, or show, or ask. ─────────────────────────
  if (phase === 'start') {
    const t = ctx.sceneType;
    if (t === 'quickCheck') return D(ACTIONS.ASK_QUESTION, 'Checking understanding before we build on it.');
    if (t === 'triangle' || t === 'chart' || t === 'proof' || t === 'freeBody' ||
        t === 'reaction' || t === 'molecule' || t === 'cell' || t === 'graphFn' ||
        t === 'numberLine' || t === 'timeline') {
      return D(ACTIONS.DEMONSTRATE, 'A visual concept lands better shown than told.');
    }
    return D(ACTIONS.EXPLAIN, 'Introducing the idea in plain language first.');
  }

  // ── 2 · Right after a check — the heart of live teaching. ───────────────────
  if (phase === 'afterCheck') {
    // Correct → acknowledge it. A real teacher names good work, warmer for juniors,
    // crisper for seniors; a streak earns a little momentum.
    if (s.wrongStreak === 0 && s.rightStreak > 0) {
      const momentum = s.rightStreak >= 3 ? ' They are on a roll — keep it moving.' : '';
      return D(ACTIONS.PRAISE, `Got it right${s.rightStreak >= 3 ? ' again' : ''}.${momentum}`, { streak: s.rightStreak });
    }

    // Wrong. The ladder: a first slip earns a HINT (let them think), a repeat earns
    // a genuinely DIFFERENT re-teach — analogy/example for younger rooms, a precise
    // step-by-step for exam rooms — never the same words louder.
    const retryable = ctx.retryable !== false; // mcq stays open; self-check does not
    if (s.wrongStreak <= 1 && retryable && s.hintsThisCheck === 0) {
      return D(ACTIONS.GIVE_HINT, 'First slip — a nudge keeps them thinking instead of being handed the answer.', {
        misconception: s.lastMisconception || null,
      });
    }

    // Escalate to a different explanation. A student we REMEMBER as struggling
    // (exampleBias) gets the concrete reframing sooner, whatever their grade band.
    if ((band === 'young' || band === 'mid' || s.exampleBias) && ctx.hasAnalogy) {
      return D(ACTIONS.GIVE_ANALOGY, 'They are stuck on the abstract form — an everyday analogy reframes it.', {
        misconception: s.lastMisconception || null, wrongStreak: s.wrongStreak,
      });
    }
    if (ctx.hasExample && (band === 'board' || s.exampleBias || s.wrongStreak >= 3)) {
      return D(ACTIONS.GIVE_EXAMPLE, 'A worked example makes the rule concrete before trying again.', {
        misconception: s.lastMisconception || null, wrongStreak: s.wrongStreak,
      });
    }
    return D(ACTIONS.RE_EXPLAIN, 'Same idea, taught a different way — name the gap, rebuild it slowly, then ask an easier question.', {
      misconception: s.lastMisconception || null, wrongStreak: s.wrongStreak,
    });
  }

  // ── 3 · A content scene just finished — decide the flow. ────────────────────
  const isLast = ctx.isLast != null ? ctx.isLast : (s.total > 0 && s.index >= s.total - 1);
  if (isLast) return D(ACTIONS.SUMMARIZE, 'Last scene — pull the whole lesson together.');

  // A student who just asked, or who is shaky, gets a beat before we push on.
  if (s.recentDoubt) return D(ACTIONS.PAUSE, 'They just reached for help — leave a beat before moving on.');

  if (conf <= 0.34) return D(ACTIONS.RECAP, 'Confidence is low — consolidate what we have before adding more.');
  if (s.wrongStreak >= 1) return D(ACTIONS.RECAP, 'An unresolved miss — restate the point before building on it.');
  if (s.sinceRecap >= recapEvery(band)) {
    return D(ACTIONS.RECAP, `${band} pace — time to knit the last few ideas together.`);
  }
  if (conf <= 0.5 && ctx.hasPractice) {
    return D(ACTIONS.PRACTICE, 'Solid but not sure — a quick practice cements it.');
  }
  return D(ACTIONS.TRANSITION, 'Understanding is holding — move to the next idea.');
}

// ── CROSS-LESSON STUDENT MEMORY ───────────────────────────────────────────────
// The long-term model the teacher remembers a student by, evolved one lesson at a
// time. Pure: (prevModel|null, result) → newModel. EMA-smoothed so a single off day
// never erases a strong history. The host persists the returned model (storage) and
// feeds it back as `prior` on the next lesson. This is what makes her feel like she
// remembers you. `result` = { topic, subject, grade, accuracy(0..100|null),
// confidence(0..1), learned:string[] }.
export function foldOutcome(prev, result = {}) {
  result = result || {};
  const p = prev || { version: 1, lessons: 0, confidence: 0.5, accuracy: null, topics: [], struggled: [], subjects: {} };
  const a = 0.4; // weight on the newest lesson
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const accPct = typeof result.accuracy === 'number' ? Math.max(0, Math.min(100, Math.round(result.accuracy))) : null;
  const conf = typeof result.confidence === 'number' ? clamp01(result.confidence) : p.confidence;
  const topic = String(result.topic || '').trim();
  const subject = String(result.subject || '').trim();

  const topics = Array.isArray(p.topics) ? p.topics.slice() : [];
  (Array.isArray(result.learned) ? result.learned : []).forEach((t) => {
    const str = String(t || '').trim();
    if (str && !topics.some((x) => x.toLowerCase() === str.toLowerCase())) topics.push(str);
  });

  // struggled: topics answered poorly, most-recent first; cleared once mastered.
  let struggled = Array.isArray(p.struggled) ? p.struggled.slice() : [];
  if (topic) {
    struggled = struggled.filter((x) => x.toLowerCase() !== topic.toLowerCase());
    if (accPct != null && accPct < 65) struggled.unshift(topic);
  }

  const subjects = { ...(p.subjects || {}) };
  if (subject) {
    const sp = subjects[subject] || { lessons: 0, accuracy: null };
    subjects[subject] = {
      lessons: (sp.lessons || 0) + 1,
      accuracy: accPct == null ? sp.accuracy : (sp.accuracy == null ? accPct : Math.round(sp.accuracy * (1 - a) + accPct * a)),
    };
  }

  return {
    version: 1,
    lessons: (p.lessons || 0) + 1,
    confidence: clamp01(p.confidence == null ? conf : p.confidence * (1 - a) + conf * a),
    accuracy: accPct == null ? (p.accuracy == null ? null : p.accuracy) : (p.accuracy == null ? accPct : Math.round(p.accuracy * (1 - a) + accPct * a)),
    topics: topics.slice(-40),
    struggled: struggled.slice(0, 8),
    subjects,
    lastTopic: topic || p.lastTopic || null,
    lastSubject: subject || p.lastSubject || null,
    lastAccuracy: accPct != null ? accPct : (p.lastAccuracy == null ? null : p.lastAccuracy),
    grade: result.grade != null ? result.grade : (p.grade == null ? null : p.grade),
  };
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// A warm, memory-aware recap for the end of a lesson. `model` is the state BEFORE
// this lesson (so "your 3rd lesson" and "that was tricky last time" read true).
// `ctx` = { topic, accuracy(0..100|null), learned:string[] }.
export function personalizedRecap(model, ctx = {}) {
  ctx = ctx || {};
  const m = model || {};
  const lessons = m.lessons || 0;
  const topic = String(ctx.topic || '').trim();
  const acc = typeof ctx.accuracy === 'number' ? ctx.accuracy : null;
  const learnedN = Array.isArray(ctx.learned) ? ctx.learned.length : 0;

  if (lessons <= 0) {
    return topic
      ? `That's our first lesson together — and you took on ${topic} really well.`
      : `That's our first lesson together — a strong start.`;
  }
  const nth = ordinal(lessons + 1); // this lesson is their (lessons+1)-th
  const wasStruggle = topic && Array.isArray(m.struggled) && m.struggled.some((x) => x.toLowerCase() === topic.toLowerCase());
  if (wasStruggle && acc != null && acc >= 70) {
    return `${topic} gave you trouble last time — and today you got ${acc}% of it. That's real progress.`;
  }
  if (acc != null && acc >= 85) {
    return `That's your ${nth} lesson, and ${acc}% today — you're on a strong run.`;
  }
  if (learnedN) {
    return `Your ${nth} lesson together — that's ${learnedN} more idea${learnedN > 1 ? 's' : ''} on top of what you already know.`;
  }
  return `Your ${nth} lesson together — it all adds up.`;
}

// A personalized "what next" suggestion, from memory + how today went.
// `ctx` = { topic, accuracy(0..100|null) }.
export function continuationHint(model, ctx = {}) {
  ctx = ctx || {};
  const m = model || {};
  const topic = String(ctx.topic || '').trim();
  const acc = typeof ctx.accuracy === 'number' ? ctx.accuracy : null;
  if (acc != null && acc < 60 && topic) return `Let's run ${topic} once more next time — it'll click.`;
  const oldGap = Array.isArray(m.struggled) ? m.struggled.find((x) => !topic || x.toLowerCase() !== topic.toLowerCase()) : null;
  if (oldGap) return `Next time, want to revisit ${oldGap}? I remember it was tricky.`;
  if (acc != null && acc >= 80) return `You've got this — ready for a new topic?`;
  return `Tell me the next topic whenever you're ready.`;
}

// Exposed for tests / tooling.
export { recapEvery, readConfidence, ordinal };
