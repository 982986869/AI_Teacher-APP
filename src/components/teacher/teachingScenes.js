// Converts a backend-generated lesson (slides) into short, focused TEACHING
// SCENES the live player animates one idea at a time (Bloom/Cuemath style).
//
// Backend slide shape:
//   { slideNumber, slideTitle, explanation, narrationText,
//     visualType: DIAGRAM|CHART|EXAMPLE|ANALOGY|FORMULA|NONE, visualData, keyPoints }
//
// Scene shape (frontend contract):
//   { id, boardType, title, kicker, teacherLine, subtitleChunks[],
//     formulaParts[], highlights[], diagram, proof, quickCheck }
//   boardType: 'intro' | 'triangle' | 'formula' | 'proof' | 'concept' | 'summary' | 'quickCheck'

const TRIANGLE_RE = /pythag|hypotenuse|right[ -]?angle(?:d)?|triangle/i;

function isTriangleText(s) { return TRIANGLE_RE.test(String(s || '')); }

// ── Math notation normalisation ──────────────────────────────────────────────
// Lesson text from the model can contain raw caret powers ("a^2 + b^2 = c^2").
// On screen that looks broken, and read aloud the "^" is meaningless. We fix it
// in ONE place so every surface (caption, board, title) is clean:
//   • prettyMath  → real Unicode superscripts for VISUAL text  (a² + b²)
//   • spellMath   → spoken words for the CAPTION + TTS line     (a squared plus b squared)
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', n: 'ⁿ', x: 'ˣ', '+': '⁺', '-': '⁻' };
const toSuper = (s) => String(s).split('').map((c) => SUP[c] || c).join('');

// VISUAL: "x^2"→"x²", "x^10"→"x¹⁰", "x^{2}"→"x²", "a**2"→"a²".
function prettyMath(str) {
  return String(str == null ? '' : str)
    .replace(/\^\{([^}]+)\}/g, (_, p) => toSuper(p))
    .replace(/(?:\^|\*\*)\(?([0-9]+|n|x)\)?/g, (_, p) => toSuper(p))
    .replace(/\s+/g, ' ')
    .trim();
}

const powerWord = (p) => (p === '2' ? 'squared' : p === '3' ? 'cubed' : `to the power ${p}`);

// SPOKEN: "a^2"→"a squared", "x^3"→"x cubed", "x^10"→"x to the power 10". Also
// fixes any stray superscripts and the "*" multiply sign for natural narration.
function spellMath(str) {
  return String(str == null ? '' : str)
    .replace(/([A-Za-z0-9)\]])\s*(?:\^|\*\*)\s*\{?\(?([0-9]+|n)\)?\}?/g, (_, base, p) => `${base} ${powerWord(p)} `)
    .replace(/²/g, ' squared ').replace(/³/g, ' cubed ')
    .replace(/\s+([.,;:?!।])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// Split a formula like "base^2 + height^2 = hypotenuse^2" into 3 reveal parts,
// normalising powers (^2 → ², ^3 → ³, …) to real superscripts.
function toFormulaParts(formula) {
  const f = prettyMath(formula);
  if (!f) return [];
  // split keeping the leading operator with each chunk after the first
  const parts = f.split(/\s+(?=[+\-=×*])/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [f];
}

// Keep the spoken line SHORT so the caption is never a messy paragraph and she
// never rambles. The prompt asks for 3–5 short teacher lines, so we allow that
// many short sentences but still hard-cap a runaway paragraph. (Both the caption
// and the TTS use this trimmed line, so they always match.)
function trimNarration(text, maxSentences = 5, maxWords = 46) {
  const t = String(text || '').trim();
  if (!t) return '';
  const sentences = t.replace(/([.?!।])\s+/g, '$1<<S>>').split('<<S>>').filter(Boolean);
  const out = [];
  let words = 0;
  for (const s of sentences) {
    const w = s.trim().split(/\s+/).filter(Boolean).length;
    if (out.length >= maxSentences) break;
    if (out.length && words + w > maxWords) break;   // keep at least one sentence
    out.push(s.trim());
    words += w;
    if (words >= maxWords) break;
  }
  let line = out.join(' ');
  // Hard cap: if even the first sentence is huge, clip to maxWords words.
  const allWords = line.split(/\s+/).filter(Boolean);
  if (allWords.length > maxWords + 4) line = allWords.slice(0, maxWords).join(' ') + '…';
  return line || (sentences[0] || t);
}

// Break narration into SHORT caption phrases (~8 words max each) so the on-screen
// subtitle is only ever one tidy line at a time.
export function toSubtitleChunks(text) {
  const t = String(text || '').trim();
  if (!t) return [];
  // split on sentence enders (lookbehind-free for older Hermes)
  const sentences = t.replace(/([.?!।])\s+/g, '$1<<S>>').split('<<S>>').filter(Boolean);
  const out = [];
  const pushHard = (phrase) => {
    const w = phrase.trim().split(/\s+/).filter(Boolean);
    for (let i = 0; i < w.length; i += 8) out.push(w.slice(i, i + 8).join(' '));
  };
  sentences.forEach((s) => {
    const w = s.trim().split(/\s+/).filter(Boolean);
    if (w.length <= 8) { out.push(s.trim()); return; }
    const byComma = s.split(/,\s*/).map((x) => x.trim()).filter(Boolean);
    if (byComma.length > 1 && byComma.every((p) => p.split(/\s+/).length <= 8)) { out.push(...byComma); return; }
    pushHard(s);
  });
  return out.length ? out : [t];
}

function kickerFor(boardType, idx) {
  switch (boardType) {
    case 'intro': return "TODAY'S CONCEPT";
    case 'triangle': return `${idx} · MEET THE SIDES`;
    case 'formula': return `${idx} · THE RULE`;
    case 'proof': return `${idx} · THE PROOF, VISUALLY`;
    case 'mistake': return 'COMMON MISTAKE';
    case 'summary': return 'RECAP';
    case 'quickCheck': return 'QUICK CHECK';
    default: return `${idx} · KEY IDEA`;
  }
}

const MISTAKE_RE = /mistake|misconception|common error|gets? it wrong|don.?t confuse|do not confuse|avoid this|be careful|watch out|the trap/i;
const RECAP_RE = /recap|summary|takeaway|to sum up|in short|let.?s recap|quick recap|key takeaway|wrapping up/i;

// ── Subject-visual detection — when a slide is about something we can DRAW, we
// draw it instead of listing bullets. Conservative regexes (first strong match
// wins) so we never mis-render a plain text slide. Must stay RN-free (this file
// is used by the pure Teaching Director). Board renderers live in subjectBoards.js.
const SUBJECT_SET = new Set(['freeBody', 'reaction', 'molecule', 'cell', 'numberLine', 'graphFn', 'timeline']);
const SUBJECT_RES = [
  ['freeBody', /free[- ]?body|net force|force diagram|forces? acting|normal force|\btension\b|\bfriction\b|newton'?s (?:first|second|third)|weight.*(?:force|gravity)|\binertia\b|law of motion|object (?:at rest|in motion|stays|remains)|\bacceleration\b|\bmomentum\b|applied force|external force/i],
  ['reaction', /\breaction\b|reactants?|\bproducts?\b|combustion|→|->|balance the equation|chemical equation|\byields\b|react(?:s|ing)? with|\bcatalyst\b|precipitat|acid.*base|displacement reaction/i],
  ['molecule', /\bmolecule\b|covalent|\bbond(?:ing|ed|s)?\b|\bH2O\b|\bCO2\b|structural formula|atoms? (?:join|share|bond)|\bvalenc(?:y|e)\b|electron.*shar|lewis structure/i],
  ['cell', /\bcell\b|nucleus|\bmembrane\b|mitochondri|organelle|cytoplasm|chloroplast|\bribosome|cell (?:wall|division)|\bneuron\b/i],
  ['timeline', /\btimeline\b|\bcentury\b|\bdynasty\b|\bera\b|\bBCE?\b|\bAD\b|revolution|\bin \d{3,4}\b|\b\d{3,4}\s?(?:BC|BCE|CE)\b|world war|freedom (?:struggle|movement)|\bempire\b|independence in/i],
  ['numberLine', /number line|\bintegers?\b|on a (?:number )?line|negative numbers?|positive and negative/i],
  ['graphFn', /graph of|plot the (?:function|line|curve)|straight[- ]line graph|\bparabola\b|quadratic (?:graph|curve)|\bslope\b|y ?= ?[^=]|coordinate (?:plane|axis|geometry)|\bx-?axis\b|\by-?axis\b|linear equation|plot(?:ting)? (?:a )?point/i],
];
function detectSubjectBoard(blob) {
  for (const [type, re] of SUBJECT_RES) if (re.test(blob)) return type;
  return null;
}

function boardTypeFor(slide, i, total, triangleLesson) {
  const blob = `${slide.slideTitle || ''} ${slide.explanation || ''} ${slide.narrationText || ''}`;
  if (i === 0) return 'intro';
  if (slide.visualType === 'FORMULA') return 'formula';
  if (slide.visualType === 'CHART') return 'chart';
  if (slide.visualType === 'DIAGRAM' && (isTriangleText(blob) || triangleLesson)) return 'triangle';
  if (MISTAKE_RE.test(blob)) return 'mistake';
  if (RECAP_RE.test(blob)) return 'summary';
  // The final text-only slide is almost always the recap; otherwise it's a key idea.
  if (i === total - 1 && slide.visualType === 'NONE') return 'summary';
  // Draw it if we can (physics/chem/bio/maths/history), else a generic concept board.
  const subj = detectSubjectBoard(blob);
  if (subj) return subj;
  return 'concept';
}

function buildScene(slide, i, total, triangleLesson) {
  const v = (slide && slide.visualData) || {};
  const boardType = boardTypeFor(slide, i, total, triangleLesson);
  // Spoken/caption line: spell powers out (clean text + correct TTS).
  const teacherLine = spellMath(trimNarration(slide.narrationText || slide.explanation || slide.slideTitle || ''));
  // Visual list items on the board: real superscripts.
  const keyPoints = (Array.isArray(v.keyPoints) ? v.keyPoints.filter(Boolean) : []).map(prettyMath);

  const scene = {
    id: `s${slide.slideNumber || i + 1}`,
    boardType,
    visualType: slide.visualType || 'NONE', // kept so the Teaching Director can pick a richer template (analogy / worked-example / …)
    slideIndex: i,
    title: prettyMath(slide.slideTitle || ''),
    kicker: kickerFor(boardType, i + 1),
    teacherLine,
    subtitleChunks: toSubtitleChunks(teacherLine),
    formulaParts: [],
    highlights: [],
    diagram: null,
    proof: null,
    quickCheck: null,
  };

  if (boardType === 'formula') {
    scene.formulaParts = toFormulaParts(v.formula || (Array.isArray(v.variables) ? '' : ''));
    scene.diagram = { variables: Array.isArray(v.variables) ? v.variables : [] };
  } else if (boardType === 'triangle') {
    scene.diagram = {
      shape: 'triangle',
      labels: { base: 'base', height: 'height', hyp: 'hypotenuse' },
      legend: true,
    };
  } else if (boardType === 'chart') {
    const cd = v.data || {};
    const labels = (Array.isArray(cd.labels) ? cd.labels : []).map((x) => String(x));
    const values = (Array.isArray(cd.values) ? cd.values : []).map((x) => Number(x)).filter((x) => Number.isFinite(x));
    scene.diagram = {
      chart: { type: v.chartType || 'bar', labels, values, xAxis: v.xAxis || '', yAxis: v.yAxis || '' },
      points: keyPoints,
    };
  } else if (SUBJECT_SET.has(boardType)) {
    const comps = (Array.isArray(v.components) ? v.components : []).map(prettyMath).filter(Boolean);
    scene.diagram = {
      sci: boardType,
      items: comps.length ? comps : keyPoints,
      label: prettyMath(v.label || v.scenario || v.description || v.formula || v.comparison || ''),
      steps: (Array.isArray(v.steps) ? v.steps : []).map(prettyMath),
      points: keyPoints,
    };
  } else if (boardType === 'concept') {
    scene.diagram = {
      shape: (Array.isArray(v.components) && v.components.length) ? 'flow' : 'points',
      steps: (Array.isArray(v.components) ? v.components : []).map(prettyMath),
      points: keyPoints.length ? keyPoints : (Array.isArray(v.steps) ? v.steps : []).map(prettyMath),
      label: prettyMath(v.label || v.scenario || ''),
    };
  } else if (boardType === 'summary' || boardType === 'intro' || boardType === 'mistake') {
    scene.diagram = { points: keyPoints };
  }

  // ── OPTIONAL phrase-level teaching timeline (backend metadata) ────────────────
  // Backward-compatible: if the backend attaches a per-phrase beat list to a slide
  // (`narrationBeats` or `teachingBeats`), we hand it to the Teaching Director for
  // exact phrase-level sync; when it's absent/empty, the Director falls back to the
  // clause-level path. Nothing else changes, so old lessons keep working untouched.
  // Contract — one entry per spoken phrase:
  //   { say|text: string,
  //     step?: number,                         // reveal index to bring the board to
  //     board?: { action: 'reveal'|'highlight'|'arrow'|'diagram'|'zoom'|'underline'|'focus'|'step',
  //               step?: number, target?: string|number },
  //     highlight?: string[],                  // keywords to emphasise while spoken
  //     expression?: string, hold?: number, pause?: number }
  const rawBeats = Array.isArray(slide.narrationBeats) ? slide.narrationBeats
    : (Array.isArray(slide.teachingBeats) ? slide.teachingBeats : null);
  if (rawBeats && rawBeats.length) {
    const mapped = rawBeats.map((b) => ({
      say: spellMath(String((b && (b.say != null ? b.say : b.text)) || '')),
      board: (b && b.board) || null,
      step: (b && typeof b.step === 'number') ? b.step
        : ((b && b.board && typeof b.board.step === 'number') ? b.board.step : null),
      highlight: Array.isArray(b && b.highlight) ? b.highlight.map(String) : null,
      expression: (b && b.expression) || null,
      hold: (b && typeof b.hold === 'number') ? b.hold : null,
      pause: (b && typeof b.pause === 'number') ? b.pause : null,
    })).filter((b) => b.say || b.step != null);
    scene.directedBeats = mapped.length ? mapped : null;
  }
  // Optional backend-authored adaptive re-teach for this scene (same shape reteach.js
  // returns: { ack, gap, intro, steps[], easyQ }). Absent → client builds a fallback.
  if (slide && slide.reteach && typeof slide.reteach === 'object') scene.reteach = slide.reteach;
  // Optional LLM comprehension check attached to this concept slide (used for the
  // mid-lesson / final check-ins). Absent → client falls back to a self-check.
  if (slide && slide.check && typeof slide.check === 'object' && slide.check.question) scene.check = slide.check;
  return scene;
}

// Turn an LLM comprehension check into a quick-check scene. `mcq` → tappable options
// (answer mapped from the correct option text); `conceptual`/`short` → a self-explain
// check. hint + misconception ride along (the misconception feeds the adaptive re-teach).
function checkToScene(check, meta) {
  const base = {
    id: meta.id,
    boardType: 'quickCheck',
    slideIndex: Math.max(0, meta.slideIndex || 0),
    title: 'Quick Check',
    kicker: meta.kicker || 'QUICK CHECK',
    teacherLine: check.question,
    subtitleChunks: toSubtitleChunks(check.question),
    formulaParts: [], highlights: [], diagram: null, proof: null,
  };
  if (check.type === 'mcq' && Array.isArray(check.options) && check.options.length >= 2) {
    const norm = (x) => String(x || '').trim().toLowerCase();
    let answer = check.options.findIndex((o) => norm(o) === norm(check.answer));
    if (answer < 0) answer = 0;
    return { ...base, quickCheck: { question: check.question, options: check.options, answer, hint: check.hint || '', misconception: check.misconception || '' } };
  }
  return { ...base, quickCheck: { question: check.question, selfCheck: true, hint: check.hint || '', misconception: check.misconception || '' } };
}

export function buildScenes(lesson) {
  const slides = (lesson && Array.isArray(lesson.slides)) ? lesson.slides : [];
  const lessonText = `${(lesson && lesson.lessonTitle) || ''} ${slides.map((s) => s.slideTitle).join(' ')}`;
  const triangleLesson = isTriangleText(lessonText);

  const scenes = slides.map((s, i) => buildScene(s, i, slides.length, triangleLesson));

  // For a right-triangle lesson, ensure a visual-proof scene exists right after
  // the formula scene (3-4-5 → squares 9, 16, 25).
  if (triangleLesson) {
    const hasProof = scenes.some((sc) => sc.boardType === 'proof' || /proof/i.test(sc.title));
    if (!hasProof) {
      const fIdx = scenes.findIndex((sc) => sc.boardType === 'formula');
      const proofScene = {
        id: 'proof',
        boardType: 'proof',
        slideIndex: fIdx >= 0 ? scenes[fIdx].slideIndex : 0,
        title: 'The Proof, Visually',
        kicker: 'THE PROOF, VISUALLY',
        teacherLine: 'Draw a square on each side — their areas are 9, 16, and 25. See, 9 plus 16 equals 25.',
        subtitleChunks: ['Draw a square on each side.', 'Their areas are 9, 16, and 25.', 'And 9 plus 16 equals 25.'],
        formulaParts: [],
        highlights: [],
        diagram: null,
        proof: { a: 3, b: 4, c: 5 }, // height², base², hypotenuse²  → 9, 16, 25
        quickCheck: null,
      };
      if (fIdx >= 0) scenes.splice(fIdx + 1, 0, proofScene);
      else scenes.push(proofScene);
    }
  }

  // ── CLASSROOM · mid-lesson understanding check-in (turn-taking) ───────────────
  // A real teacher doesn't monologue — she stops partway to make sure you're with
  // her, waits for you, then continues. Insert ONE self-check after the first
  // substantial concept so the lesson becomes two-way (the closing quick-check below
  // still wraps up). Reuses the whole quick-check flow: the lesson PAUSES and waits,
  // she reacts to the answer, and offers a slower re-explain on a miss.
  const terms = ((lesson && lesson.keyTerms) || []).filter(Boolean);
  const CONTENT_TYPES = new Set(['concept', 'formula', 'triangle', 'proof', 'chart', 'freeBody', 'reaction', 'molecule', 'cell', 'graphFn', 'numberLine', 'timeline']);
  // Prefer the LLM's concept checks (grade/topic-aware, misconception-focused); fall
  // back to a self-check when the model did not author any.
  const llmChecks = scenes.filter((sc) => sc.check && sc.check.question);
  let usedMid = null;

  if (scenes.length >= 4 && !scenes.some((sc) => sc.boardType === 'quickCheck')) {
    if (llmChecks.length) {
      usedMid = llmChecks[0];
      const at = Math.min(scenes.length, scenes.indexOf(usedMid) + 1);
      scenes.splice(at, 0, checkToScene(usedMid.check, { id: 'checkin', slideIndex: usedMid.slideIndex, kicker: 'CHECK-IN' }));
    } else {
      const anchor = scenes.findIndex((sc, i) => i >= 1 && CONTENT_TYPES.has(sc.boardType));
      const at = Math.min(scenes.length, anchor >= 0 ? anchor + 1 : 2);
      const term = terms[0];
      const q = term
        ? `Quick check before we go on \u2014 can you explain \u201C${term}\u201D in your own words?`
        : 'Quick check before we go on \u2014 can you say that back in your own words?';
      scenes.splice(at, 0, {
        id: 'checkin', boardType: 'quickCheck', slideIndex: Math.max(0, at - 1),
        title: 'Quick Check', kicker: 'CHECK-IN', teacherLine: q, subtitleChunks: [q],
        formulaParts: [], highlights: [], diagram: null, proof: null,
        quickCheck: { question: term ? `Explain \u201C${term}\u201D in your own words.` : 'Say it back in your own words.', selfCheck: true },
      });
    }
  }

  // Re-number kickers after any insertion.
  scenes.forEach((sc, i) => { sc.kicker = kickerFor(sc.boardType, i + 1); });

  // Closing check-in \u2014 a DIFFERENT LLM check if available, else a key-term self-check.
  const endCheck = llmChecks.find((sc) => sc !== usedMid);
  if (endCheck) {
    scenes.push(checkToScene(endCheck.check, { id: 'quick', slideIndex: Math.max(0, slides.length - 1), kicker: 'QUICK CHECK' }));
  } else if (terms.length) {
    const t0 = terms[0];
    scenes.push({
      id: 'quick', boardType: 'quickCheck', slideIndex: Math.max(0, slides.length - 1),
      title: 'Quick Check', kicker: 'QUICK CHECK',
      teacherLine: triangleLesson ? 'Quick check \u2014 which side is the hypotenuse?' : `Quick check \u2014 what is \u201C${t0}\u201D?`,
      subtitleChunks: triangleLesson ? ['Quick check \u2014 which side is the hypotenuse?'] : [`Quick check \u2014 what is \u201C${t0}\u201D?`],
      formulaParts: [], highlights: [], diagram: null, proof: null,
      quickCheck: triangleLesson
        ? { question: 'Which side is the hypotenuse?', options: ['The shortest side', 'The longest side', 'The middle side'], answer: 1 }
        : { question: `Explain \u201C${t0}\u201D in your own words.`, selfCheck: true },
    });
  }

  return scenes;
}
