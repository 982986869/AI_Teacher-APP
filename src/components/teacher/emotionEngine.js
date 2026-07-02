// emotionEngine.js
// ── THE EMOTION + ADAPTIVE-PACE ENGINE ────────────────────────────────────────
// A premium tutor reads the room. She speeds up for a student who's flying,
// slows down and softens for one who's struggling, and her face carries that
// read — proud, patient, gently concerned. This engine keeps a tiny LEARNER
// MODEL from the signals the app already has (no backend, no new data): quick-
// check results, how often a scene was replayed, and how many doubts were asked.
//
// It outputs two things the presentation layer consumes:
//   • paceMult  — a global time multiplier on every beat's pause/hold
//                 (slow learner → lessons breathe; fast learner → they move)
//   • tone/level — feeds the persona's word choice + reaction intensity
//
// It never fabricates content (that would need the backend); it shapes the
// *delivery* of the content the Teaching Director already choreographed.

// A fresh model at lesson start — neutral, no assumptions about the student.
export function freshLearner() {
  return { correct: 0, firstTryCorrect: 0, misses: 0, replays: 0, doubts: 0, checks: 0 };
}

// Fold one observed event into the model. Returns a NEW object (easy to store in
// a ref and reassign). Events: 'correct' | 'correctFirstTry' | 'miss' | 'replay' | 'doubt'.
export function observe(model, event) {
  const m = { ...(model || freshLearner()) };
  switch (event) {
    case 'correctFirstTry': m.firstTryCorrect += 1; m.correct += 1; m.checks += 1; break;
    case 'correct': m.correct += 1; m.checks += 1; break;
    case 'miss': m.misses += 1; m.checks += 1; break;
    case 'replay': m.replays += 1; break;
    case 'doubt': m.doubts += 1; break;
    default: break;
  }
  return m;
}

// The read on the student right now. `confidence` is 0..1; `pace` is the label;
// `paceMult` scales every beat's timing; `tone` guides the persona's register.
export function assess(model) {
  const m = model || freshLearner();
  // Struggle pushes up, fluency pushes down. Weighted so a single wobble doesn't
  // overreact, but a pattern clearly moves her.
  const struggle = m.misses * 1.0 + m.replays * 0.7 + m.doubts * 0.5;
  const fluency = m.firstTryCorrect * 1.0 + Math.max(0, m.correct - m.misses) * 0.3;

  // confidence: start neutral 0.5, nudged by the balance of the two.
  const raw = 0.5 + (fluency - struggle) * 0.12;
  const confidence = Math.max(0, Math.min(1, raw));

  let pace = 'normal';
  let paceMult = 1;
  let tone = 'warm';
  if (confidence >= 0.68) { pace = 'fast'; paceMult = 0.74; tone = 'confident'; }
  else if (confidence <= 0.34) { pace = 'slow'; paceMult = 1.38; tone = 'gentle'; }

  return { confidence, pace, paceMult, tone };
}

// Should she offer to re-explain? A repeated miss on the same check, or a clear
// low-confidence read, means "let's take that again, slower" — the honest,
// content-free re-explanation: replay the concept she just taught at a calmer pace.
export function shouldReexplain(model, wrongStreak) {
  if (wrongStreak >= 2) return true;
  return assess(model).confidence <= 0.3;
}
