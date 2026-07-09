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

// A fresh model at lesson start. With no `prior` it is neutral (as before). When we
// remember the student (prior.confidence 0..1), the lesson OPENS at their known
// register — a historically-struggling student gets a gentler pace from scene one —
// and live signals take over within a few interactions (see the seed blend in assess).
export function freshLearner(prior) {
  const seed = prior && typeof prior.confidence === 'number'
    ? Math.max(0, Math.min(1, prior.confidence))
    : 0.5;
  return { correct: 0, firstTryCorrect: 0, misses: 0, replays: 0, doubts: 0, checks: 0, seed };
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

  // confidence: start from what we remember about the student (seed), nudged by the
  // balance of live struggle/fluency. Before any evidence this lesson, the seed leads;
  // as checks/replays/doubts arrive, the live read takes over within ~3 interactions.
  const raw = 0.5 + (fluency - struggle) * 0.12;
  const computed = Math.max(0, Math.min(1, raw));
  const seed = typeof m.seed === 'number' ? m.seed : 0.5;
  const evidence = m.checks + m.replays + m.doubts;
  const w = Math.min(1, evidence / 3);
  const confidence = Math.max(0, Math.min(1, seed * (1 - w) + computed * w));

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
