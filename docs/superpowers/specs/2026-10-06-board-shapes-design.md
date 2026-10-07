# Board shapes: the AI teacher draws its own diagrams

Status: design, awaiting review · Branch: `feat/board-diagrams` · 2026-10-06

## Problem

The live-lesson board can only draw what someone hand-built. The lesson LLM never
outputs geometry: a DIAGRAM slide carries `{ description, label, components[],
keyPoints[] }`, and `teachingScenes.boardTypeFor` picks one of ~15 hard-coded SVG
boards by running regexes over the slide text. When no regex matches (unit circle,
lens ray diagram, food chain, circuit, pulley, Venn diagram, …) the slide falls
through to `concept`, which is three text boxes, not a drawing. A regex can also
match the wrong board (a "graph of sine" slide gets the fixed parabola/line).

Part A (commit `1f5e129`) fixed size and overlap on the existing boards. This spec
is Part B: let the model describe a diagram out of general-purpose shapes, and have
the app lay it out so it is large and nothing overlaps.

## Goals

- The model can draw a purpose-built diagram for any DIAGRAM slide from a small set
  of primitives: lines, arrows, circles, rectangles, polygons, curves, axes, text.
- Labels never overlap each other or the drawing, and never leave the board. The
  app places them; the model only says which shape a label belongs to.
- The drawing always fills the board's width (auto-fit), so it is as large as the
  card allows.
- It reveals step by step in sync with the teacher's voice, like every other board.
- Old lessons (cached in the DB without shapes) render exactly as today.

## Non-goals

- Knowledge Ask's `DiagramRenderer` (pipeline B) — separate surface, unchanged.
- Replacing the curated boards (triangle, figures, free-body …). They stay.
- Free-form SVG paths or math-expression plotting from the model (security and
  reliability cost; a points-based curve covers graphs).
- The student's own pen/eraser tools.

## Approaches considered

1. **Shape DSL + app-side layout (recommended).** Model emits a compact JSON list of
   primitives on a fixed grid; server validates; client auto-fits and places labels.
   Model decides *what* to draw, code decides *where text goes* — the part models are
   bad at, and the cause of today's overlaps.
2. **Model emits raw SVG.** Most expressive, but unvalidatable, no step reveal, no
   control over label collisions or text size, and an injection surface. Rejected.
3. **Grow the curated-board library.** Best-looking per board, but every new topic
   needs a developer; it is what we have now and is why most slides fall to `concept`.
   Kept as the first choice where a board exists, not as the general answer.

## Design

### 1. Schema (lesson prompt → `visualData.shapes`)

An optional `shapes` array on DIAGRAM visualData. Canvas is **100 wide × 60 tall**,
origin top-left, y down (5:3, the board's aspect, so one uniform scale — circles stay
round).

```jsonc
"shapes": [
  { "id": "sun",   "kind": "circle", "at": [15, 30], "r": 9,  "color": "orange", "fill": true, "label": "Sun" },
  { "id": "earth", "kind": "circle", "at": [70, 30], "r": 4,  "color": "blue",   "fill": true, "label": "Earth", "step": 2 },
  { "kind": "arrow", "from": "sun", "to": "earth", "label": "light", "step": 2 },
  { "kind": "arc", "at": [70, 30], "r": 12, "start": 200, "end": 340, "dashed": true, "label": "orbit", "step": 3 }
]
```

| kind | geometry keys | notes |
|---|---|---|
| `line`, `arrow` | `from`, `to` — a point `[x,y]` or a shape `id` | arrow head at `to`; id endpoints clip to that shape's edge |
| `circle` | `at`, `r` | |
| `ellipse` | `at`, `rx`, `ry` | |
| `rect` | `at` (top-left), `w`, `h` | |
| `polygon` | `points` (3–8) | triangles, prisms, lenses |
| `curve` | `points` (2–12) | smooth curve through the points; graphs, waves, rays |
| `arc` | `at`, `r`, `start`, `end` (degrees) | angles, orbits |
| `axes` | `at` (origin), `w`, `h`, `x`, `y` (axis names) | draws both axes with arrowheads |
| `dot` | `at` | a marked point |
| `text` | `at`, `text` | free text that is not a label of a shape (e.g. an equation) |

Common optional keys: `id`, `label` (≤ 18 chars), `color` (`orange|blue|green|pink|
violet|ink`), `fill` (soft tint), `dashed`, `step` (1–6).

**Steps.** `step` groups what appears per beat. If absent: each labelled shape starts
a new step, unlabelled shapes join the next labelled one. Capped at 6 steps. The
Director's `boardTotalFor('shapes')` is the number of steps.

**Prompt changes** (`lessonGeneration.prompt.js`): add `shapes` to the DIAGRAM shape
line, one compact example, and rules: use shapes when the slide's object is spatial
(a figure, a setup, a cycle, a graph); ≤ 14 shapes; ≤ 18-char labels; label shapes
via `label`, never with stray `text` placed next to them; keep `components` as today
(they feed narration and the fallback). Shapes add roughly 150–300 output tokens per
diagram slide; `LESSON_MAX_TOKENS` (8000) has headroom, and the existing truncation
retry stays.

### 2. Server validation (`AnthropicProvider.normalizeShapes`)

Runs inside `parseAndValidateLesson` for DIAGRAM slides. Pure function, unit-tested.

- Drop unknown kinds, non-finite numbers, unknown colors (→ `ink`), unknown `from`/`to`
  ids. Clamp coordinates to the canvas, radii to 1–30, points counts to their ranges.
- Truncate labels to 18 chars and `text` to 32; strip control characters.
- Keep at most 14 shapes; renumber `step` to a dense 1..k (k ≤ 6).
- If fewer than 2 drawable shapes survive, delete `shapes` (the slide falls back to
  today's behaviour). Never throw — bad shapes must not fail lesson generation.

### 3. Client layout (`shapeLayout.js`, pure, unit-tested)

`layoutShapes(shapes, { step })` → `{ viewBox, items[], labels[] }`, all in viewBox
units (grid × 3, i.e. 300 × 180).

- **Geometry.** Resolve id endpoints to edge points; compute each shape's obstacle
  boxes (segments sampled into small boxes for lines/curves/arcs, so a label can sit
  inside a big empty circle but not on its outline).
- **Label placement.** In reveal order, for each label try candidate anchors: 8
  positions around a shape (outside the outline), the normal-offset midpoint for
  lines/arrows, inside for rects/circles big enough. Size each candidate with the
  existing `fitLabel` (start 13, floor 9, ≤ 2 lines). Score = overlap with obstacles +
  placed labels + out-of-bounds, tie-break by distance. If every candidate collides,
  place at the nearest free spot and draw a thin leader line to the shape.
- **Auto-fit.** viewBox = bounding box of shapes + placed labels + padding, with the
  aspect clamped to 1.4–2.2 so a tall drawing doesn't become tiny in a wide card.
  This is what makes the drawing fill the card's width.
- Layout is computed once for **all** steps, so labels don't jump as steps reveal.

### 4. Client rendering (`ShapesBoard` in `subjectBoards.js`)

**Current-step emphasis** (the "it's happening now" feel of NotebookLM's video
overviews): the step being spoken is drawn at full strength and earlier steps recede
to ~55% opacity, the same board-memory idea the points board already uses; the laser
pointer sits on the newest step. Arc angles are degrees counter-clockwise from +x
(maths convention), converted to the y-down screen inside the layout.

Renders `layoutShapes` output with the existing primitives: `ChalkLine`/`ChalkStroke`
(draw-on animation), `Arrow`, `SvgLines` for labels, `LaserPointer` on the newest
step's first shape. Uses `useReveal(total)` and `useBoardSize().h()` like the other
boards. Unknown kinds render nothing (forward compatible).

### 5. Routing (`teachingScenes.boardTypeFor`)

For a DIAGRAM slide with valid `visualData.shapes`:

1. triangle lesson / named figure (curated, proven) → those boards, as today;
2. otherwise → `shapes`, **ahead of** the loose subject-keyword boards and `concept`.

Rationale: subject boards key off a single keyword and often draw a stand-in, which
the prompt itself forbids ("NEVER show a stand-in"). A model-drawn diagram of the
actual object is closer to the slide title. **This is the one choice to confirm in
review** — the alternative is shapes only when nothing else matched.

`buildScene` copies the normalized shapes onto `scene.diagram.shapes` and sets
`scene.diagram.shapesTotal` (steps), which `boardTotalFor` reads — the same pattern
as `figureTotal`, so the Director stays React-free.

## Error handling

- Server: invalid shapes are dropped, never fatal (section 2).
- Client: `layoutShapes` re-checks types defensively (old/cached or hand-edited
  data); any exception → fall back to `ConceptBoard` for that scene, logged once.
- A lesson generated before this change has no `shapes`: routing is unchanged.

## Testing

- `server/tests/lessonShapes.test.js` — `normalizeShapes`: clamping, id resolution,
  step renumbering, the < 2 shapes drop, garbage input never throws.
- `src/components/teacher/__tests__/shapeLayout.test.mjs` — for a fixture set
  (solar system, lens rays, food chain, circuit, unit circle, Venn, labelled graph)
  and a seeded random fuzz of 200 layouts: no label box overlaps another label or an
  obstacle, every label is inside the viewBox, no font below 9, the aspect is within
  1.4–2.2, and positions are the same at every step.
- Prompt check: generate 5 real lessons with diagram-heavy topics against the
  dev key, run them through `normalizeShapes`, and record how many slides kept shapes
  and how they looked on a device. This is the go/no-go for the prompt wording.
- Device check on a 360-dp Android phone, card and full-screen modes.

## Rollout

Server and app ship independently: an old app ignores `shapes` (it only reads the
keys it knows), a new app with an old server never sees them. Deploying the server
first is safe.

## Risks

- **Model quality.** The model may produce cramped or wrong geometry. Mitigation:
  the prompt-check gate above, and the curated boards keep priority where they exist.
- **Token cost.** About +5–10% output tokens per lesson.
- **Placement isn't perfect.** It is greedy, not optimal; the leader-line fallback
  guarantees no overlap, at the cost of a less tidy look on very busy diagrams.
