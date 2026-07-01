// teachingDirector.js
// ── THE TEACHING DIRECTOR ─────────────────────────────────────────────────────
// The LLM generates KNOWLEDGE (what to teach). The Director decides the
// PERFORMANCE (how to teach it) — it choreographs every lesson the way a real
// teacher runs a classroom, so a lesson feels *directed*, never *rendered*.
//
// It never shows a wall of text. It breaks each concept into SCENES, and each
// scene into a sequence of BEATS. A beat is the atomic directed moment — it
// bundles, for one instant of the lesson:
//
//   • Teacher Action     — the one short line she says now      (beat.say)
//   • Board Action       — how much of the board is written now (beat.boardStep)
//   • Visual Action      — her face / gesture for this moment    (beat.expression)
//   • Student Interaction— when the lesson stops and waits       (beat.interaction)
//   • Transition + pacing— the pause she leaves after            (beat.pause / hold)
//
// The player is a dumb executor: it walks the beats, speaks each `say`, and
// drives the board to each `boardStep`. Because both come from the SAME beat,
// the board finally writes *in step with her voice* instead of on its own timer.
//
// Choreography lives in reusable TEMPLATES (Concept, Formula, Diagram, Story,
// Experiment, Analogy, WorkedExample, Revision, QuickCheck). Same knowledge,
// different rhythm — that is what makes each lesson feel like it has its own
// pacing. Inspired by the *interaction feel* of premium tutors, not their UI.

import { buildScenes } from './teachingScenes';
import { cameraForBeat } from './cameraDirector';
import { openerFor } from './teacherPersona';

// ── the nine reusable choreography templates ──────────────────────────────────
export const TEMPLATES = [
  'Concept', 'Formula', 'Diagram', 'Story', 'Experiment',
  'Analogy', 'WorkedExample', 'Revision', 'QuickCheck',
];

// Pacing per template — the "director's rhythm". `pause` is the silence she
// leaves after a spoken line; `silentHold` is how long a wordless reveal beat
// dwells; `closePause` is the breath at the end of a scene before moving on.
// Story/Analogy breathe; Revision snaps; Formula lets the rule land.
const PACE = {
  Concept:       { silentHold: 1500, pause: 340, closePause: 800 },
  Formula:       { silentHold: 1400, pause: 300, closePause: 1050 },
  Diagram:       { silentHold: 1300, pause: 300, closePause: 800 },
  Story:         { silentHold: 1700, pause: 700, closePause: 900 },
  Experiment:    { silentHold: 1600, pause: 460, closePause: 900 },
  Analogy:       { silentHold: 1650, pause: 640, closePause: 900 },
  WorkedExample: { silentHold: 1600, pause: 360, closePause: 950 },
  Revision:      { silentHold: 1000, pause: 180, closePause: 600 },
  QuickCheck:    { silentHold: 1200, pause: 300, closePause: 600 },
};

// Split a narration line into individual spoken sentences (the raw beats of speech).
function toSentences(line) {
  return String(line || '')
    .replace(/([.?!।])\s+/g, '$1<<S>>')
    .split('<<S>>')
    .map((s) => s.trim())
    .filter(Boolean);
}

// How many discrete things the board reveals for this scene — one per beat step.
// Mirrors exactly what each board in LessonBoards actually draws, so the
// Director's intent ("reveal step 3 now") lines up with what appears.
function boardTotalFor(scene) {
  const d = scene.diagram || {};
  switch (scene.boardType) {
    case 'triangle': return 4;                 // base · height · hypotenuse · right-angle
    case 'proof': return 5;                    // triangle · 3 squares · the sum
    case 'formula': return (scene.formulaParts || []).length || 3;
    case 'chart': return ((d.chart && d.chart.values) || []).length || 1; // one bar per beat
    // Subject illustrations — step counts MIRROR each board's own reveal total in
    // subjectBoards.js (kept in sync by hand; both files are additive/pure here).
    case 'freeBody': return 4;                 // weight · normal · applied · friction
    case 'reaction': return 4;                 // reactants · arrow · products · balanced
    case 'graphFn': return 3;                  // axes · curve · point
    case 'numberLine': { const nums = (d.items || []).map((x) => parseFloat(x)).filter((x) => Number.isFinite(x)); return 1 + (nums.length ? Math.min(3, nums.length) : 3); }
    case 'molecule': { const it = (d.items || []); const labels = it.length ? it : ['O', 'H', 'H']; const outer = [labels[1], labels[2], labels[3]].filter(Boolean).length; return Math.max(2, Math.min(4, 1 + outer)); }
    case 'cell': { const it = (d.items || []); return Math.max(3, Math.min(5, it.length || 4)); }
    case 'timeline': { const it = (d.items || []); return Math.min(5, it.length || 3); }
    case 'quickCheck': return 0;               // interactive, nothing auto-reveals
    case 'concept':
      if (d.shape === 'flow' && Array.isArray(d.steps) && d.steps.length) return Math.min(3, d.steps.length);
      return (d.points || []).length;
    default:                                   // intro / summary / mistake → points list
      return (d.points || []).length;
  }
}

// Pick the choreography template for a scene from what it IS.
function templateFor(scene) {
  switch (scene.boardType) {
    case 'formula': return 'Formula';
    case 'triangle': return 'Diagram';
    case 'chart': return 'Diagram';
    case 'proof': return 'WorkedExample';
    case 'quickCheck': return 'QuickCheck';
    case 'summary': return 'Revision';
    case 'intro': return 'Concept';
    case 'freeBody':
    case 'reaction': return 'Experiment';      // physics/chem — "watch what happens"
    case 'molecule':
    case 'cell':
    case 'numberLine':
    case 'graphFn': return 'Diagram';          // draw-and-point visualization
    case 'timeline': return 'Story';           // narrated, left-to-right
    default: break; // concept / mistake — refine below
  }
  switch (scene.visualType) {
    case 'EXAMPLE': return 'WorkedExample';
    case 'ANALOGY': return 'Analogy';
    case 'DIAGRAM':
    case 'CHART': return 'Diagram';
    default: break;
  }
  const blob = `${scene.title || ''} ${scene.teacherLine || ''}`;
  if (/experiment|observe|apparatus|beaker|test tube|reaction|electrode|predict what/i.test(blob)) return 'Experiment';
  if (/\bstory\b|once upon|long ago|a farmer|a shopkeeper|suppose you/i.test(blob)) return 'Story';
  return 'Concept';
}

// The teacher's face for beat i of an n-beat scene under a given template. This
// is where a formula reads as *writing at the board*, a diagram as *pointing*,
// a recap as *warm and quick* — instead of one flat "explaining" for everything.
function expressionFor(template, i, n) {
  const last = i === n - 1;
  switch (template) {
    case 'Formula': return last ? 'encouraging' : 'writing';
    case 'WorkedExample': return last ? 'encouraging' : 'writing';
    case 'Diagram': return 'pointing';
    case 'Experiment': return last ? 'surprise' : 'pointing';
    case 'Revision': return 'encouraging';
    case 'QuickCheck': return 'encouraging';
    case 'Analogy':
    case 'Story': return i === 0 ? 'smile' : 'explaining';
    case 'Concept':
    default: return last ? 'encouraging' : 'explaining';
  }
}

// Templates that always earn a spoken opener (they set up a "moment"); plain
// Concept scenes only get one when the STYLE just changed, so she doesn't say
// "Alright." at the top of every single scene.
const ALWAYS_LEAD = new Set(['Story', 'Analogy', 'Experiment', 'WorkedExample', 'Formula', 'Diagram']);

// ── choreograph ONE scene into a beat timeline ────────────────────────────────
function directScene(scene, opts = {}) {
  const template = templateFor(scene);
  const pace = PACE[template] || PACE.Concept;

  // A quick-check is a single beat: pose the question, then STOP and wait for the
  // student. The board (options) is interactive; nothing auto-advances.
  if (scene.boardType === 'quickCheck') {
    const q = (scene.quickCheck && scene.quickCheck.question) || '';
    return {
      ...scene,
      template,
      beats: [{
        say: scene.teacherLine || q,
        boardStep: null,
        expression: 'encouraging',
        camera: 'wide',
        interaction: { type: 'quickCheck' },
        hold: pace.silentHold,
        pause: 0,
      }],
    };
  }

  const sentences = toSentences(scene.teacherLine);
  const boardTotal = boardTotalFor(scene);
  // One beat per "moment": as many as there are sentences OR board reveals,
  // whichever is longer — so every spoken line lands, and every drawn element
  // gets its own beat. This is the core sync: beat i speaks sentence i AND
  // brings the board to step i+1.
  const n = Math.max(sentences.length, boardTotal, 1);

  const beats = [];
  for (let i = 0; i < n; i += 1) {
    const say = sentences[i] || '';
    const last = i === n - 1;
    const expression = expressionFor(template, i, n);
    beats.push({
      say,                                                   // Teacher Action
      boardStep: boardTotal ? Math.min(i + 1, boardTotal) : null, // Board Action
      expression,                                            // Visual Action (face + gaze)
      camera: cameraForBeat({ expression, i, n, boardTotal, template }), // Camera Action
      interaction: null,                                     // Student Interaction
      // A wordless beat exists only to reveal the next board element — give it a
      // real dwell so the drawing is watched, not skipped.
      hold: say ? 0 : pace.silentHold,
      // Transition: the breath she leaves after speaking (longer at scene end).
      pause: last ? pace.closePause : (say ? pace.pause : 0),
    });
  }

  // Open the scene with a natural, style-matched line (Story opens like a story,
  // a formula like a rule). Leads on style scenes, on the first scene, and whenever
  // the teaching style just changed — never the same opener twice running.
  const changed = opts.prevTemplate && opts.prevTemplate !== template;
  const lead = opts.first || changed || ALWAYS_LEAD.has(template);
  if (lead && beats[0] && beats[0].say) {
    beats[0] = { ...beats[0], say: `${openerFor(template)} ${beats[0].say}` };
  }

  return { ...scene, template, beats };
}

// ── choreograph a whole lesson ────────────────────────────────────────────────
// buildScenes turns the LLM's slides into scene DATA (knowledge, normalised).
// The Director layers the PERFORMANCE (beats) on top — the only new step. It
// threads the previous template through so consecutive scenes never open the same
// way, and every lesson opens a little differently.
export function directLesson(lesson) {
  const scenes = buildScenes(lesson || {});
  let prevTemplate = null;
  return scenes.map((s, i) => {
    const directed = directScene(s, { prevTemplate, first: i === 0 });
    prevTemplate = directed.template;
    return directed;
  });
}

// Exposed for tests / tooling: how a single scene would be choreographed.
export { directScene, templateFor, boardTotalFor };
