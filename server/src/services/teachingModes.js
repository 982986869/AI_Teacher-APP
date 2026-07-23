'use strict'

// ─── Teaching Modes ──────────────────────────────────────────────────────────
// The AI Teacher's teaching MODE is the "how" — distinct from the "what" (the topic)
// and the "who" (the student's class/board/language). The SAME topic taught in
// `eli5` vs `exam` vs `advanced` is a genuinely different lesson in register, pace,
// depth and framing — the way a real teacher shifts gear for the moment.
//
// A mode is a small, composable instruction folded into the lesson/answer prompt
// (see lessonGeneration.prompt.js → modePrompt). It is either CHOSEN by the student
// or AUTO-SELECTED from what we already know about them (mastery / revision-due), so
// the teacher intelligently picks the right register without being asked.
//
// Design notes:
//  • Leaf module — no service imports — safe to require from prompt builders.
//  • `prompt` fragments are additive; they never tell the model to refuse a topic.
//  • Adding a mode here is the only change needed to expose a new register.

const MODES = {
  eli5: {
    label: 'Explain Like I’m 5',
    short: 'ELI5',
    prompt:
      'TEACHING MODE — Explain-Like-I’m-5: teach as if to a bright, curious younger child. One vivid everyday analogy or tiny story per idea, the simplest possible words, zero jargon (and if a real term is unavoidable, name it once in plain language). Use "imagine…" a lot. Keep every step tiny and concrete; celebrate small wins.',
  },
  beginner: {
    label: 'Beginner',
    short: 'Beginner',
    prompt:
      'TEACHING MODE — Beginner: assume no prior exposure. Build from the ground up, define every term the first time, move slowly with ONE small idea per slide, add extra scaffolding and a second easy example, and reassure often. Prefer intuition before any formula.',
  },
  intermediate: {
    label: 'Intermediate',
    short: 'Standard',
    prompt:
      'TEACHING MODE — Intermediate (standard class level): clear definitions, the reasoning behind the idea, one clean worked example, and a check for understanding. Assume the basic prerequisites are known.',
  },
  advanced: {
    label: 'Advanced',
    short: 'Advanced',
    prompt:
      'TEACHING MODE — Advanced: push depth. Give the underlying WHY, a short derivation or proof of the key result, an edge case and a counter-example, correct notation, and one stretch insight that reaches just beyond the syllabus. Assume prerequisites and keep the pace crisp.',
  },
  exam: {
    label: 'Exam Preparation',
    short: 'Exam',
    prompt:
      'TEACHING MODE — Exam Preparation: teach for the exam. Foreground the exact definitions and formulas that earn marks, the standard method step-by-step, the commonly-tested traps and how to avoid them, mark-scheme phrasing, and finish with one exam-style worked problem. Be precise and complete over chatty.',
  },
  revision: {
    label: 'Revision',
    short: 'Revision',
    prompt:
      'TEACHING MODE — Revision (topic already studied): no long build-up. Briskly recap the key idea, the must-remember formula, the top 2–3 mistakes students make, a memory hook/mnemonic, and 2 quick self-check questions. Dense and fast — this is a refresh, not a first lesson.',
  },
  doubt: {
    label: 'Doubt Solving',
    short: 'Doubt',
    prompt:
      'TEACHING MODE — Doubt Solving: target the specific confusion directly and precisely. Give the minimal correct explanation, one clarifying example, and then verify the doubt is actually cleared before moving on. Do not re-teach the whole topic.',
  },
  interview: {
    label: 'Interview Mode',
    short: 'Interview',
    prompt:
      'TEACHING MODE — Interview/Viva: conversational and probing. Pose the concept as a question first and expect reasoning, ask "why" follow-ups, and surface what an examiner is really testing. Reward clear thinking; gently correct hand-waving.',
  },
}

const MODE_KEYS = Object.keys(MODES)

function isMode(m) {
  return typeof m === 'string' && Object.prototype.hasOwnProperty.call(MODES, m)
}

function modePrompt(mode) {
  return isMode(mode) ? MODES[mode].prompt : ''
}

function modeLabel(mode) {
  return isMode(mode) ? MODES[mode].label : ''
}

// Auto-select a teaching mode from the learner profile when the student hasn't
// chosen one. Pure function of the compact learner summary
// ({ averageMastery, weak[], needsRevision[], strong[] }) so it stays cheap and
// testable. Falls back to `intermediate` for a cold/unknown learner.
function autoSelectMode(learner) {
  if (!learner || typeof learner !== 'object') return 'intermediate'
  const needsRevision = Array.isArray(learner.needsRevision) ? learner.needsRevision.length : 0
  // A student with several concepts fading is best served by a revision pass.
  if (needsRevision >= 2) return 'revision'
  const avg = Number(learner.averageMastery)
  if (Number.isFinite(avg)) {
    if (avg < 30) return 'beginner'
    if (avg >= 80) return 'advanced'
    if (avg < 55) return 'intermediate'
  }
  return 'intermediate'
}

// The public mode list for the client picker (key + human label + short chip label).
function modeCatalog() {
  return MODE_KEYS.map((k) => ({ key: k, label: MODES[k].label, short: MODES[k].short }))
}

module.exports = { MODES, MODE_KEYS, isMode, modePrompt, modeLabel, autoSelectMode, modeCatalog }
