// Transforms a grounded RAG teaching object into an ordered scene timeline that
// the TeachingPlayer animates one scene at a time. Scenes are derived purely from
// already-grounded content (no new model output), so grounding is preserved.
//
// teaching = { title, intro, steps[], formula, example, quickCheck }
// scene types: 'explanation' | 'steps' | 'diagram' | 'formula' | 'example' | 'quiz'

// Pick a diagram shape from the question/content, if one clearly fits.
function detectDiagram(blob) {
  if (/pythag|hypotenuse|triangle|right[ -]?angle/.test(blob)) return { shape: 'triangle', caption: 'a² + b² = c²' };
  if (/coordinate|x[- ]?axis|y[- ]?axis|plot|cartesian|quadrant/.test(blob)) return { shape: 'coordinate', caption: 'Coordinate plane' };
  if (/\bgraph\b|bar chart|histogram|data set|frequency/.test(blob)) return { shape: 'graph', caption: 'Graph' };
  if (/hierarchy|tree|classification|taxonomy|branch(es)?\b/.test(blob)) return { shape: 'tree', caption: 'Hierarchy' };
  if (/process|life ?cycle|flow ?chart|sequence of|stages|steps of|water cycle/.test(blob)) return { shape: 'flow', caption: 'Process flow' };
  if (/rectangle|square|area of|perimeter/.test(blob)) return { shape: 'rectangle', caption: 'Rectangle' };
  return null;
}

// Split a worked-example blob into discrete steps.
function splitExample(s) {
  let parts = String(s || '').split(/\n+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length <= 1) parts = String(s || '').split(/\.\s+/).map((x) => x.trim()).filter(Boolean);
  return parts.length ? parts.slice(0, 6) : [String(s || '')];
}

export function buildScenesFromTeaching(teaching) {
  const t = teaching || {};
  const scenes = [];
  const blob = `${t.title || ''} ${t.intro || ''} ${t.formula || ''} ${t.example || ''}`.toLowerCase();
  const diagram = detectDiagram(blob);

  if (t.intro) {
    scenes.push({ type: 'explanation', bubble: 'teacher', title: t.title, text: t.intro });
  }
  if (Array.isArray(t.steps) && t.steps.length) {
    scenes.push({ type: 'steps', title: 'Let’s break it down', steps: t.steps });
  }
  if (diagram) {
    scenes.push({ type: 'diagram', shape: diagram.shape, caption: t.formula && diagram.shape === 'triangle' ? t.formula : diagram.caption });
  }
  if (t.formula) {
    scenes.push({ type: 'formula', formula: t.formula, triangle: diagram?.shape === 'triangle' });
  }
  if (t.example) {
    scenes.push({ type: 'example', title: 'Worked example', steps: splitExample(t.example) });
  }
  if (t.quickCheck) {
    scenes.push({ type: 'quiz', question: t.quickCheck });
  }

  if (scenes.length === 0) {
    scenes.push({ type: 'explanation', bubble: 'teacher', title: t.title, text: t.intro || 'Let’s learn this together!' });
  }
  return scenes;
}
