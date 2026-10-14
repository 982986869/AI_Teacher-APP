// ── The landscape board's "notebook page" ─────────────────────────────────────
// Pure helpers (no React) that turn one directed scene + its source slide into the
// lines the teacher writes on the board, in the board's colour language:
//   title   — teal heading            (the slide title)
//   pt      — blue bullet             (key points, steps, formula variables)
//   formula — the formula itself      (FORMULA slides)
//   eg      — orange "e.g." line      (EXAMPLE scenario / ANALOGY comparison)
//   warn    — red warning line        (every point of a "mistake" slide)
// Kept dependency-free so it runs under `node --test`.

// Boards that DRAW something (graphs, figures, reaction chains…) keep their drawing
// in the right-hand column; plain point boards are fully told by the written lines.
const DRAWN = new Set([
  'chart', 'triangle', 'proof',
  'freeBody', 'reaction', 'molecule', 'cell', 'numberLine', 'graphFn', 'timeline', 'annotated',
]);

const clean = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const list = (a) => (Array.isArray(a) ? a.map(clean).filter(Boolean) : []);

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

  push('title', scene.title);

  const points = list(d.points).length ? list(d.points) : list(v.keyPoints);

  if (scene.boardType === 'mistake') {
    points.forEach((p) => push('warn', p));
    return out;
  }

  if (scene.boardType === 'formula' || vt === 'FORMULA') {
    push('formula', v.formula);
    const vars = Array.isArray(v.variables) && v.variables.length ? v.variables : (Array.isArray(d.variables) ? d.variables : []);
    vars.forEach((x) => { if (x && clean(x.symbol)) push('pt', clean(x.meaning) ? `${clean(x.symbol)}: ${clean(x.meaning)}` : x.symbol); });
    points.forEach((p) => push('pt', p));
    return out;
  }

  if (vt === 'EXAMPLE') {
    list(v.steps).forEach((p) => push('pt', p));
    points.forEach((p) => push('pt', p));
    if (clean(v.scenario)) push('eg', `e.g. ${clean(v.scenario)}`);
    return out;
  }

  points.forEach((p) => push('pt', p));
  if (vt === 'ANALOGY' && (clean(v.comparison) || clean(v.realWorldObject))) {
    push('eg', clean(v.realWorldObject)
      ? `e.g. Like ${clean(v.realWorldObject)}${clean(v.comparison) ? `: ${clean(v.comparison)}` : ''}`
      : `e.g. ${clean(v.comparison)}`);
  }
  return out;
}

// How many of `total` lines are on the board at beat `beat` of `beats`. The title is
// up from the first beat; the remaining lines are spread evenly so the last one lands
// on the scene's final beat.
export function revealCount(total, beat, beats) {
  if (total <= 0) return 0;
  if (!beats || beats <= 0) return total;
  if (total === 1) return 1;
  const b = Math.min(Math.max(0, beat), beats - 1);
  const rest = total - 1;
  return Math.min(total, 1 + Math.ceil(((b + 1) / beats) * rest));
}
