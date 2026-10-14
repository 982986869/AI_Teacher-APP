// ── The board's "notebook page" ───────────────────────────────────────────────
// Pure helpers (no React) that turn one directed scene + its source slide into the
// lines the teacher WRITES on the board, in the board's colour language:
//   title   — teal heading            (the slide title)
//   pt      — blue bullet             (short notes)
//   formula — the formula itself      (FORMULA slides)
//   eg      — orange "e.g." line      (EXAMPLE scenario / ANALOGY object)
//   warn    — red warning line        (every note of a "mistake" slide)
// Like a real teacher she speaks full sentences but writes only what matters: the
// lesson's `boardNotes` when the AI wrote them, else each point cut down to a note.
// Kept dependency-free so it runs under `node --test`.

// Boards that DRAW something (graphs, figures, reaction chains…) keep their drawing
// next to (or under) the written notes; plain point boards are fully told by them.
const DRAWN = new Set([
  'chart', 'triangle', 'proof',
  'freeBody', 'reaction', 'molecule', 'cell', 'numberLine', 'graphFn', 'timeline', 'annotated',
]);

const NOTE_MAX = 60;
const clean = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const list = (a) => (Array.isArray(a) ? a.map(clean).filter(Boolean) : []);
const FILLER = /^(?:just like|remember(?: that)?|note(?: that)?|notice(?: that)?|so,?|now,?|here,?|basically,?|in short,?)\s+/i;
// "A building foundation" → "a building foundation"; names ("Newton", "DNA") untouched.
const lowerFirst = (s) => s.replace(/^(A|An|The) /, (m) => m.toLowerCase());

// One point → one board note: drop the spoken filler, keep the first clause of a
// long sentence, and as a last resort cut at a word boundary.
export function noteOf(text, max = NOTE_MAX) {
  let t = clean(text).replace(FILLER, '');
  if (t.length <= max) return t;
  const first = clean(t.split(/[.;:—–]\s|,\s/)[0]);
  if (first.length >= 8 && first.length <= max) return first;
  t = t.slice(0, max - 2);
  const cut = t.lastIndexOf(' ');
  return `${(cut > 20 ? t.slice(0, cut) : t).replace(/[,;:\s]+$/, '')}…`;
}

export function hasSideVisual(scene) {
  if (!scene) return false;
  if (DRAWN.has(scene.boardType)) return true;
  const d = scene.diagram || {};
  return scene.boardType === 'concept' && d.shape === 'flow' && Array.isArray(d.steps) && d.steps.length > 0;
}

export function pageLinesFor(scene, slide) {
  if (!scene || scene.boardType === 'quickCheck') return [];
  const v = (slide && slide.visualData) || {};
  const vt = (slide && slide.visualType) || scene.visualType || 'NONE';
  const d = scene.diagram || {};
  const out = [];
  const push = (kind, text) => { const t = clean(text); if (t) out.push({ kind, text: t }); };
  const note = (kind, text) => push(kind, noteOf(text));

  push('title', scene.title);

  const notes = list(v.boardNotes);
  const points = list(d.points).length ? list(d.points) : list(v.keyPoints);

  if (scene.boardType === 'mistake') {
    (notes.length ? notes : points).forEach((p) => note('warn', p));
    return out;
  }

  if (scene.boardType === 'formula' || vt === 'FORMULA') {
    push('formula', v.formula);
    if (notes.length) { notes.forEach((p) => note('pt', p)); return out; }
    const vars = Array.isArray(v.variables) && v.variables.length ? v.variables : (Array.isArray(d.variables) ? d.variables : []);
    vars.forEach((x) => { if (x && clean(x.symbol)) note('pt', clean(x.meaning) ? `${clean(x.symbol)}: ${clean(x.meaning)}` : x.symbol); });
    points.forEach((p) => note('pt', p));
    return out;
  }

  if (vt === 'EXAMPLE') {
    if (notes.length) notes.forEach((p) => note('pt', p));
    else { list(v.steps).forEach((p) => note('pt', p)); points.forEach((p) => note('pt', p)); }
    if (clean(v.scenario)) push('eg', `e.g. ${noteOf(v.scenario)}`);
    return out;
  }

  (notes.length ? notes : points).forEach((p) => note('pt', p));
  if (vt === 'ANALOGY') {
    const obj = clean(v.realWorldObject);
    const cmp = clean(v.comparison);
    if (notes.length) { if (obj) push('eg', `e.g. Like ${lowerFirst(obj)}`); }
    else if (obj || cmp) push('eg', obj ? `e.g. Like ${lowerFirst(obj)}${cmp ? `: ${noteOf(cmp)}` : ''}` : `e.g. ${noteOf(cmp)}`);
  }
  return out;
}

// ── writing in step with her voice ───────────────────────────────────────────
const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'are', 'its', 'our', 'you', 'your', 'how', 'what', 'why', 'when', 'all', 'can', 'has', 'have', 'was', 'will', 'let', 'now']);
const tokens = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

// For each line, the beat (spoken sentence) on which she writes it. The title goes up
// on the first beat; a note lands on the first later beat that says most of its words;
// a note the narration never says is spread evenly between its neighbours. Never goes
// backwards, so the page always fills top to bottom.
export function planLineBeats(lines, beats) {
  const B = Array.isArray(beats) ? beats.length : 0;
  if (!B) return lines.map(() => 0);
  const said = beats.map((b) => new Set(tokens(b)));
  const L = lines.length;
  const plan = [];
  let prev = 0;
  lines.forEach((ln, i) => {
    if (i === 0) { plan.push(0); return; }
    const w = tokens(ln && ln.text);
    let best = -1;
    let score = 0;
    for (let b = prev; b < B && w.length; b += 1) {
      const hit = w.filter((x) => said[b].has(x)).length / w.length;
      if (hit > score) { score = hit; best = b; }
    }
    const at = best >= 0 && score >= 0.34 ? best : Math.max(prev, Math.round((i / Math.max(1, L - 1)) * (B - 1)));
    prev = at;
    plan.push(at);
  });
  return plan;
}

// How many lines are on the board once she has reached beat `beat`.
export const revealAt = (plan, beat) => plan.filter((b) => b <= beat).length;

// Even spread (kept for scenes with no spoken beats to match against).
export function revealCount(total, beat, beats) {
  if (total <= 0) return 0;
  if (!beats || beats <= 0) return total;
  if (total === 1) return 1;
  const b = Math.min(Math.max(0, beat), beats - 1);
  const rest = total - 1;
  return Math.min(total, 1 + Math.ceil(((b + 1) / beats) * rest));
}
