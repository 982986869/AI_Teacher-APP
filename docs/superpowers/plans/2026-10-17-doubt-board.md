# Doubt Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** While the AI teacher speaks the answer to a doubt, she draws the matching shapes on a board in the live classroom, each shape appearing with the sentence that introduces it.

**Architecture:** The model embeds `[[board:{...}]]` markers in its streamed answer. A server-side stream parser strips them from the spoken text and forwards validated elements as a new `board` SSE event on the existing `/api/ai/ask/stream`. The app holds each element until the sentence before it starts playing, then renders it with the existing `react-native-svg` chalk primitives.

**Tech Stack:** Node 20+/Express 4 server, `node --test`; Expo 54 / React Native 0.81 app, `react-native-svg`; Anthropic Messages streaming (unchanged provider call).

**Spec:** `docs/superpowers/specs/2026-10-17-doubt-board-design.md`

## Global Constraints

- Work on the existing branch `feat/landscape-board` in worktree `F:\aiLernova2\textbook-lessons-wt` (owner's decision 2026-10-17); Task 1 becomes "copy spec + plan into that worktree and commit" — no new branch. That branch's `LiveTeachingPlayer` is a landscape layout (page on the left, drawing on the right): in Task 9 mount `DoubtBoard` in the right-hand side card (the `showSide` slot, `sideCardPortrait` in portrait) while `qa` is set, instead of the hidden-board slot described for `main`. Line numbers in this plan are from `main`; re-anchor by the named functions. No merge into `main` in this plan.
- Board coordinate space is exactly 300 × 180; palette keys are exactly `chalk | yellow | blue | green | pink | orange`.
- Marker syntax is exactly `[[board:` … `]]`. Max 24 elements per answer, text ≤ 40 chars (truncated), path `d` ≤ 400 chars.
- Without `board: true` in the request, the system prompt, the SSE events, and `done.answer` are byte-identical to today.
- Server files are CommonJS (`require`/`module.exports`). App files are ESM. App pure helpers must not import React Native so `node --test` can load them.
- Server tests: `cd server && npm test`. App helper tests: `node --test src/components/teacher/__tests__/*.test.mjs` (Node 22 loads ESM `.js` by syntax detection).
- Commit after every task with the attribution line `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. A marker split across two SSE chunks mid-JSON (`[[board:{"op":"re` … `ct",...}]]`) must never leak `[[board:` or JSON into the spoken text or the caption. → Task 3 test `splits a marker across chunks`.
2. A marker with `NaN`, strings in place of numbers, an unknown op, or coordinates like 99999 must be dropped or clamped, never passed to the SVG. → Task 2 tests `drops unknown op`, `drops non-finite numbers`, `clamps coordinates`.
3. The model puts a marker mid-sentence instead of on its own line: the words before and after must still both be spoken and the element must still appear (one sentence early at worst). → Task 3 test `marker mid-sentence keeps both halves`.
4. A second doubt starts while the first still has held elements: none of the first doubt's shapes may appear on the second doubt's board. → Task 7 test `reset drops held elements`; Task 9 guards with `turn`.
5. The teacher's audio never starts (TTS failed, device muted): held elements would wait forever. → Task 7 test `flush releases everything held`; Task 9 releases on the done poller.

---

### Task 1: Branch and plan commit

**Files:**
- Create: `docs/superpowers/specs/2026-10-17-doubt-board-design.md` (already written, uncommitted)
- Create: `docs/superpowers/plans/2026-10-17-doubt-board.md` (this file)

- [ ] **Step 1: Create the branch from main**

Run from `F:\aiLernova2\main-wt`: `git switch -c feat/doubt-board`
Expected: `Switched to a new branch 'feat/doubt-board'`

- [ ] **Step 2: Commit the spec and plan**

```bash
git add docs/superpowers/specs/2026-10-17-doubt-board-design.md docs/superpowers/plans/2026-10-17-doubt-board.md
git commit -m "docs: doubt board design and implementation plan"
```

---

### Task 2: Element validator (server)

**Files:**
- Create: `server/src/utils/boardElements.js`
- Test: `server/tests/boardElements.test.js`

**Interfaces:**
- Produces:
  - `BOARD_W = 300`, `BOARD_H = 180`, `MAX_ELEMENTS = 24`, `MAX_TEXT = 40`, `MAX_PATH = 400`, `COLORS = ['chalk','yellow','blue','green','pink','orange']`
  - `validateElement(raw: any) -> object | null` — returns a NEW plain object holding only the op's fields plus `color`, or `null`.
  - `MOCK_BOARD_SAMPLE: object[]` — `[{op:'clear'}, {op:'rect',x:60,y:40,w:180,h:90,color:'blue'}, {op:'text',x:70,y:30,text:'Rectangle',size:14,color:'chalk'}]`

Normalisation rules (the spec's table): each numeric field goes through `Number()` and must be finite, else the element is `null`. x-type fields clamp to [0, 300], y-type to [0, 180]; `w`, `h` clamp to [1, 300]; `r` to [1, 150]; `size` defaults to 14 and clamps to [10, 24]. `text` is trimmed, empty → `null`, then sliced to 40. `path.d` is trimmed, must match `/^[MLQCZmlqcz0-9 ,.\-]+$/` and be ≤ 400 chars, else `null`. `color` defaults to `'chalk'`; an unknown colour becomes `'chalk'`. `clear` carries no fields and no colour.

- [ ] **Step 1: Write the failing tests**

```js
'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { validateElement, MOCK_BOARD_SAMPLE, MAX_TEXT } = require('../src/utils/boardElements')

test('rect: keeps fields, defaults color to chalk', () => {
  assert.deepEqual(validateElement({ op: 'rect', x: 10, y: 20, w: 30, h: 40, junk: 1 }),
    { op: 'rect', x: 10, y: 20, w: 30, h: 40, color: 'chalk' })
})
test('clamps coordinates into the 300x180 board', () => {
  assert.deepEqual(validateElement({ op: 'line', x1: -5, y1: 99999, x2: 400, y2: 0 }),
    { op: 'line', x1: 0, y1: 180, x2: 300, y2: 0, color: 'chalk' })
})
test('drops unknown op', () => { assert.equal(validateElement({ op: 'triangle', x: 1 }), null) })
test('drops non-finite numbers', () => {
  assert.equal(validateElement({ op: 'circle', cx: 'abc', cy: 10, r: 5 }), null)
  assert.equal(validateElement({ op: 'circle', cx: NaN, cy: 10, r: 5 }), null)
})
test('text: truncates to 40, size defaults and clamps, unknown color -> chalk', () => {
  const long = 'x'.repeat(60)
  const el = validateElement({ op: 'text', x: 1, y: 2, text: long, size: 99, color: 'neon' })
  assert.equal(el.text.length, MAX_TEXT)
  assert.equal(el.size, 24)
  assert.equal(el.color, 'chalk')
  assert.equal(validateElement({ op: 'text', x: 1, y: 2, text: '   ' }), null)
  assert.equal(validateElement({ op: 'text', x: 1, y: 2, text: 'Hi' }).size, 14)
})
test('path: accepts M L Q C Z only, rejects scripts and long paths', () => {
  assert.equal(validateElement({ op: 'path', d: 'M10,10 L50,50 Q60,70 80,80 Z' }).d, 'M10,10 L50,50 Q60,70 80,80 Z')
  assert.equal(validateElement({ op: 'path', d: 'M10,10 A5 5 0 0 1 20 20' }), null)
  assert.equal(validateElement({ op: 'path', d: 'M' + '1,1 L'.repeat(200) }), null)
})
test('clear has no fields', () => { assert.deepEqual(validateElement({ op: 'clear', x: 5 }), { op: 'clear' }) })
test('non-objects are null', () => { assert.equal(validateElement(null), null); assert.equal(validateElement('rect'), null) })
test('mock sample is valid', () => { for (const el of MOCK_BOARD_SAMPLE) assert.deepEqual(validateElement(el), el) })
```

- [ ] **Step 2: Run to verify failure**

Run: `cd server && node --test tests/boardElements.test.js`
Expected: FAIL, `Cannot find module '../src/utils/boardElements'`

- [ ] **Step 3: Implement `server/src/utils/boardElements.js`** with the constants, `validateElement`, and `MOCK_BOARD_SAMPLE` as specified above.

- [ ] **Step 4: Run to verify pass**

Run: `cd server && node --test tests/boardElements.test.js`
Expected: all 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/utils/boardElements.js server/tests/boardElements.test.js
git commit -m "feat(board): validate board elements from the model"
```

---

### Task 3: Board stream parser (server)

**Files:**
- Create: `server/src/utils/boardStream.js`
- Test: `server/tests/boardStream.test.js`

**Interfaces:**
- Consumes: `validateElement`, `MAX_ELEMENTS` from Task 2.
- Produces: `createBoardStreamParser({ onText, onElement, maxElements = MAX_ELEMENTS } = {}) -> { push(chunk: string): void, end(): void, get text(): string, elements: object[] }`
  - `text` is the clean text emitted so far (markers removed); `elements` the accepted elements in order.
  - `MARK_OPEN = '[[board:'`, `MARK_CLOSE = ']]'` exported.

Behaviour: `push` appends to an internal buffer, then repeatedly: if the buffer has no `MARK_OPEN`, emit everything except the longest trailing suffix that is a prefix of `MARK_OPEN` (held for the next chunk). If it has one, emit the text before it; if no `MARK_CLOSE` follows yet, hold from the marker on. Otherwise `JSON.parse` the inner text; a parse error or `validateElement` returning `null` drops the marker; an accepted element is appended and `onElement` is called unless `elements.length >= maxElements`. After a marker is removed, one leading `\n` of the following text is swallowed (so a marker on its own line leaves no blank line). `end()` emits any held text up to an unclosed marker and discards the marker remainder.

- [ ] **Step 1: Write the failing tests**

```js
'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { createBoardStreamParser } = require('../src/utils/boardStream')

const RECT = '[[board:{"op":"rect","x":10,"y":10,"w":50,"h":40}]]'
function run(chunks, opts) {
  const text = [], els = []
  const p = createBoardStreamParser({ onText: (t) => text.push(t), onElement: (e) => els.push(e), ...opts })
  for (const c of chunks) p.push(c)
  p.end()
  return { text: text.join(''), els, p }
}

test('marker on its own line is removed with its newline', () => {
  const r = run(['A square.\n', RECT, '\nSee it.'])
  assert.equal(r.text, 'A square.\nSee it.')
  assert.equal(r.els.length, 1)
  assert.equal(r.els[0].op, 'rect')
  assert.equal(r.p.text, 'A square.\nSee it.')
})
test('splits a marker across chunks', () => {
  const r = run(['Look.\n[[bo', 'ard:{"op":"re', 'ct","x":1,"y":2,"w":3,"h":4}', ']]\nDone.'])
  assert.equal(r.text, 'Look.\nDone.')
  assert.deepEqual(r.els, [{ op: 'rect', x: 1, y: 2, w: 3, h: 4, color: 'chalk' }])
})
test('marker mid-sentence keeps both halves', () => {
  const r = run(['Draw a box ' + RECT + ' like this.'])
  assert.equal(r.text, 'Draw a box  like this.')
  assert.equal(r.els.length, 1)
})
test('invalid JSON and invalid elements are dropped silently', () => {
  const r = run(['A.[[board:{not json}]]B.[[board:{"op":"nope"}]]C.'])
  assert.equal(r.text, 'A.B.C.')
  assert.equal(r.els.length, 0)
})
test('caps elements at maxElements', () => {
  const r = run([Array(5).fill(RECT).join('')], { maxElements: 3 })
  assert.equal(r.els.length, 3)
})
test('unclosed marker at end is discarded, text before it kept', () => {
  const r = run(['Keep this.\n[[board:{"op":"rect","x":1'])
  assert.equal(r.text, 'Keep this.\n')
  assert.equal(r.els.length, 0)
})
test('a lone bracket that is not a marker is plain text', () => {
  const r = run(['Array [[1,2]] is fine.'])
  assert.equal(r.text, 'Array [[1,2]] is fine.')
})
test('clear passes through as an element', () => {
  const r = run(['[[board:{"op":"clear"}]]Hi'])
  assert.deepEqual(r.els, [{ op: 'clear' }])
  assert.equal(r.text, 'Hi')
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd server && node --test tests/boardStream.test.js`
Expected: FAIL, `Cannot find module '../src/utils/boardStream'`

- [ ] **Step 3: Implement `server/src/utils/boardStream.js`** per the behaviour above.

- [ ] **Step 4: Run to verify pass**

Run: `cd server && node --test tests/boardStream.test.js`
Expected: all 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/utils/boardStream.js server/tests/boardStream.test.js
git commit -m "feat(board): strip [[board:]] markers from the streamed answer"
```

---

### Task 4: BOARD block in the teacher prompt (server)

**Files:**
- Modify: `server/src/prompts/teacherResponse.prompt.js:141-183` (`buildTeacherSystemPrompt`)
- Test: `server/tests/teacherPrompt.board.test.js`

**Interfaces:**
- Produces: `buildTeacherSystemPrompt({ ..., board = false })` — when `board` is truthy, appends `\n\n${BOARD_BLOCK}` after the language line; otherwise the returned string is unchanged. Export `BOARD_BLOCK`.

`BOARD_BLOCK` is exactly:

```
BOARD (you can draw while you speak) — A 300 by 180 whiteboard is visible to the student. Draw ONLY when a picture genuinely helps: a figure (triangle, circle, axes, a graph), labelled parts, a flow of steps, or one line of a derivation. Never for plain definitions or facts.
To draw, put a marker on ITS OWN LINE right after the sentence it illustrates:
[[board:{"op":"rect","x":60,"y":40,"w":180,"h":90,"color":"blue"}]]
Ops: clear | rect{x,y,w,h} | circle{cx,cy,r} | line{x1,y1,x2,y2} | arrow{x1,y1,x2,y2} | text{x,y,text,size} | path{d} (SVG path, commands M L Q C Z only) | highlight{x,y,w,h}. Optional "color": chalk, yellow, blue, green, pink, orange. x runs 0–300 left to right, y runs 0–180 top to bottom.
Rules: start with a clear marker. At most 6 markers. Labels are 1–3 words, under 40 characters. Keep shapes inside the board with space between them. Markers are NOT spoken text: they do not count toward the 5-line limit, and the spoken lines stay exactly as described above.
```

- [ ] **Step 1: Write the failing tests**

```js
'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { buildTeacherSystemPrompt, BOARD_BLOCK } = require('../src/prompts/teacherResponse.prompt')

const base = { intent: 'doubt', language: 'en', contexts: [], lesson: null, level: 'intermediate', gradeLevel: '9' }

test('board off: prompt is byte-identical to the default', () => {
  assert.equal(buildTeacherSystemPrompt({ ...base, board: false }), buildTeacherSystemPrompt(base))
  assert.equal(buildTeacherSystemPrompt(base).includes('[[board:'), false)
})
test('board on: appends the BOARD block once, at the end', () => {
  const p = buildTeacherSystemPrompt({ ...base, board: true })
  assert.equal(p.endsWith(BOARD_BLOCK), true)
  assert.equal(p.split('[[board:').length - 1, 1)
  assert.equal(p.startsWith(buildTeacherSystemPrompt(base)), true)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd server && node --test tests/teacherPrompt.board.test.js`
Expected: FAIL on `p.endsWith(BOARD_BLOCK)` (BOARD_BLOCK undefined)

- [ ] **Step 3: Add `BOARD_BLOCK` and the `board` parameter** in `buildTeacherSystemPrompt`; add `BOARD_BLOCK` to `module.exports`.

- [ ] **Step 4: Run to verify pass**

Run: `cd server && node --test tests/teacherPrompt.board.test.js`
Expected: 2 PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/prompts/teacherResponse.prompt.js server/tests/teacherPrompt.board.test.js
git commit -m "feat(board): teach the model the [[board:]] marker syntax when asked"
```

---

### Task 5: Wire the stream end to end (server)

**Files:**
- Modify: `server/src/providers/ai/AnthropicProvider.js:233-252` (`streamTeacherResponse`)
- Modify: `server/src/services/agent.service.js:579-672` (`askStream`)
- Modify: `server/src/controllers/ai.controller.js:173-206` (`askStream`)
- Modify: `server/src/routes/ai.js` (`askRules`)

**Interfaces:**
- Consumes: `createBoardStreamParser` (Task 3), `MOCK_BOARD_SAMPLE` (Task 2), `board` prompt flag (Task 4).
- Produces:
  - `AnthropicProvider.streamTeacherResponse({ ..., board }, onText)` — forwards `board` to `buildTeacherSystemPrompt`. Return value unchanged (full raw text, markers included).
  - `agentService.askStream(params, { onMeta, onDelta, onBoard })` with `params.board: boolean`. When `board` is true, `onDelta` receives marker-free text, `onBoard(el)` receives each accepted element, and the guard/`done.answer` are built from the parser's clean text. When false, behaviour is unchanged.
  - SSE: `event: board` with `data: <element JSON>`.

- [ ] **Step 1: Provider** — add `board` to the destructured params of `streamTeacherResponse` and pass `board` into `buildTeacherSystemPrompt(...)`. Leave `generateTeacherResponse` untouched.

- [ ] **Step 2: Service** — in `askStream`, read `const board = params.board === true`. Just before the `if (config.ai.mockMode)` branch, create `parser = board ? createBoardStreamParser({ onText: (t) => onDelta && onDelta(t), onElement: (el) => onBoard && onBoard(el) }) : null` and `sink = parser ? (t) => parser.push(t) : (t) => { if (onDelta) onDelta(t) }`. Pass `sink` as the provider's `onText` and add `board` to the provider params. After the provider resolves, when `parser` exists call `parser.end()` and set `raw = parser.text`. In the mock branch, when `board` is true, call `onBoard(el)` for each `MOCK_BOARD_SAMPLE` element after `onDelta(raw)`. Canned early returns stay as they are (they never draw).

- [ ] **Step 3: Controller and route** — in `askStream`, pass `board: req.body.board === true` in the params object and `onBoard: (el) => send('board', el)` in the callbacks. In `routes/ai.js` add `body('board').optional().isBoolean()` to `askRules` (match the existing rule style in that file).

- [ ] **Step 4: Run the whole server suite**

Run: `cd server && npm test`
Expected: every test PASSES, including the three new files

- [ ] **Step 5: Verify the SSE contract against a running server in mock mode**

Run (first terminal): `cd server && MOCK_AI=true PORT=5050 node src/index.js` (PowerShell: `$env:MOCK_AI='true'; $env:PORT='5050'; node src/index.js`)
Run (second terminal), with a valid student JWT in `$TOKEN` (log in via `POST /api/auth/login` against the same server first):
```bash
curl -N -s -X POST http://localhost:5050/api/ai/ask/stream -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"text":"explain a rectangle","subject":"Maths","board":true}'
```
Expected: three `event: board` blocks whose data are the `MOCK_BOARD_SAMPLE` elements, `event: delta` data contains no `[[board:`, then `event: done`. Repeat without `"board":true`: no `event: board` block.

- [ ] **Step 6: Commit**

```bash
git add server/src/providers/ai/AnthropicProvider.js server/src/services/agent.service.js server/src/controllers/ai.controller.js server/src/routes/ai.js
git commit -m "feat(board): stream board elements as SSE events on /api/ai/ask/stream"
```

---

### Task 6: App stream client (app)

**Files:**
- Modify: `src/api/aiApi.js:158-205` (`askAgentStream`)

**Interfaces:**
- Produces: `askAgentStream({ ..., board }, { onMeta, onDelta, onBoard })` — sends `body.board = true` when `board` is truthy; on an SSE `board` event with `data.op` a string, calls `onBoard(data)`.

- [ ] **Step 1: Implement** — add `board` to the first argument's destructuring and `onBoard` to the second; `if (board) body.board = true;`; add `else if (event === 'board') { if (onBoard && data && typeof data.op === 'string') onBoard(data); }` to the drain switch.

- [ ] **Step 2: Verify nothing else broke**

Run: `node -e "require('@babel/core').transformFileSync('src/api/aiApi.js',{presets:['babel-preset-expo']}); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add src/api/aiApi.js
git commit -m "feat(board): receive board SSE events in askAgentStream"
```

---

### Task 7: Pure board helpers (app)

**Files:**
- Create: `src/components/teacher/doubtBoardLayout.js` (ESM, no React Native imports)
- Create: `src/components/teacher/__tests__/doubtBoardLayout.test.mjs`
- Modify: `package.json` scripts — add `"test:doubt-board": "node --test src/components/teacher/__tests__/doubtBoardLayout.test.mjs"`

**Interfaces:**
- Produces:
  - `BOARD_W = 300`, `BOARD_H = 180`
  - `visibleElements(elements: object[]) -> { key: number, el: object }[]` — the elements after the last `{op:'clear'}` (clears excluded), `key` = index in the input array.
  - `pathLength(d: string) -> number` — polyline length over the numeric pairs in order; `Z`/`z` closes to the first point; minimum 1.
  - `boardColor(name: string, palette: object) -> string` — `palette[name]` if present, else `palette.chalk`.
  - `createBoardSync() -> { hold(el, queued: number), sentenceStarted(ordinal: number) -> object[], flush() -> object[], reset() }` — `queued` is how many sentences had been queued for speech when the element arrived; `sentenceStarted(n)` (1-based) returns and removes, in arrival order, every held element with `queued <= n`; `flush` returns and removes everything; `reset` discards everything.

- [ ] **Step 1: Write the failing tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { visibleElements, pathLength, boardColor, createBoardSync } from '../doubtBoardLayout.js'

test('visibleElements: keeps only elements after the last clear, with original keys', () => {
  const els = [{ op: 'rect' }, { op: 'clear' }, { op: 'text' }, { op: 'clear' }, { op: 'arrow' }, { op: 'line' }]
  assert.deepEqual(visibleElements(els), [{ key: 4, el: { op: 'arrow' } }, { key: 5, el: { op: 'line' } }])
  assert.deepEqual(visibleElements([{ op: 'rect' }]), [{ key: 0, el: { op: 'rect' } }])
  assert.deepEqual(visibleElements([]), [])
})
test('pathLength: polyline, Z closes, never below 1', () => {
  assert.equal(pathLength('M0,0 L30,40'), 50)
  assert.equal(pathLength('M0,0 L30,40 Z'), 100)
  assert.equal(pathLength('M5,5'), 1)
})
test('boardColor falls back to chalk', () => {
  const pal = { chalk: '#111', blue: '#00f' }
  assert.equal(boardColor('blue', pal), '#00f')
  assert.equal(boardColor('neon', pal), '#111')
  assert.equal(boardColor(undefined, pal), '#111')
})
test('sync: element released when the sentence before it starts', () => {
  const s = createBoardSync()
  const a = { op: 'clear' }, b = { op: 'rect' }, c = { op: 'text' }
  s.hold(a, 0); s.hold(b, 1); s.hold(c, 3)
  assert.deepEqual(s.sentenceStarted(1), [a, b])
  assert.deepEqual(s.sentenceStarted(2), [])
  assert.deepEqual(s.sentenceStarted(3), [c])
  assert.deepEqual(s.sentenceStarted(4), [])
})
test('sync: flush releases everything held', () => {
  const s = createBoardSync()
  s.hold({ op: 'rect' }, 2); s.hold({ op: 'line' }, 5)
  assert.deepEqual(s.flush(), [{ op: 'rect' }, { op: 'line' }])
  assert.deepEqual(s.flush(), [])
})
test('sync: reset drops held elements', () => {
  const s = createBoardSync()
  s.hold({ op: 'rect' }, 1)
  s.reset()
  assert.deepEqual(s.sentenceStarted(9), [])
  assert.deepEqual(s.flush(), [])
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:doubt-board` (after adding the script)
Expected: FAIL, cannot find `../doubtBoardLayout.js`

- [ ] **Step 3: Implement `src/components/teacher/doubtBoardLayout.js`** with the four exports and two constants.

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:doubt-board`
Expected: 6 PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/teacher/doubtBoardLayout.js src/components/teacher/__tests__/doubtBoardLayout.test.mjs package.json
git commit -m "feat(board): pure helpers for the doubt board (visibility, path length, speech sync)"
```

---

### Task 8: DoubtBoard component (app)

**Files:**
- Create: `src/components/teacher/DoubtBoard.js`

**Interfaces:**
- Consumes: `ChalkStroke, ChalkLine, Box, Circle, Arrow, Highlight` from `./WhiteboardCanvas`; `BOARD` from `./theme`; `visibleElements, pathLength, boardColor, BOARD_W, BOARD_H` from `./doubtBoardLayout`.
- Produces: `export default function DoubtBoard({ elements = [], height = 200, style })`.

Rendering: a `View` frame styled like the lesson board (background `BOARD.bg`, 1px border `BOARD.frame`, radius 18, overflow hidden, the given `height`) containing `<Svg width="100%" height="100%" viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} preserveAspectRatio="xMidYMid meet">`. Map `visibleElements(elements)` to: `rect` → `Box`; `circle` → `Circle`; `line` → `ChalkLine`; `arrow` → `Arrow`; `highlight` → `Highlight` (`color` via `boardColor`, default `BOARD.yellow`); `path` → `ChalkStroke d={el.d} length={pathLength(el.d)}`; `text` → `react-native-svg` `Text` with `x`, `y`, `fontSize={el.size}`, `fontWeight="700"`, `fill={boardColor(el.color, BOARD)}`. Every element's `key` is the `key` from `visibleElements` so already-drawn shapes never re-animate when a new one arrives. Stroke width 2.5, `color={boardColor(el.color, BOARD)}`.

- [ ] **Step 1: Implement the component** as specified.

- [ ] **Step 2: Verify it compiles**

Run: `node -e "require('@babel/core').transformFileSync('src/components/teacher/DoubtBoard.js',{presets:['babel-preset-expo']}); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add src/components/teacher/DoubtBoard.js
git commit -m "feat(board): DoubtBoard renders streamed elements with chalk primitives"
```

---

### Task 9: Wire the live classroom (app)

**Files:**
- Modify: `src/components/teacher/LiveTeachingPlayer.js:1163-1262` (`goTeach`, `beginListen`, `sendDoubt`, `resumeFromDoubt`), `:1701-1703` (board slot inside `<Stage>`), imports at the top
- Modify: `src/screens/AITeacherScreen.js:537-556` (`onAskStream`)

**Interfaces:**
- Consumes: `DoubtBoard` (Task 8), `createBoardSync` (Task 7), `askAgentStream` `board`/`onBoard` (Task 6).
- Produces: `onAskStream(q, i, { onDelta, onBoard })` prop contract between the two files.

- [ ] **Step 1: AITeacherScreen** — the `onAskStream` handler destructures `{ onDelta, onBoard }`, passes `board: true` in the request object and `{ onDelta, onBoard }` as callbacks.

- [ ] **Step 2: LiveTeachingPlayer state** — import `DoubtBoard` and `createBoardSync`; add `const [boardEls, setBoardEls] = useState([])` and `const boardSyncRef = useRef(createBoardSync())`; add `const clearBoard = () => { boardSyncRef.current.reset(); setBoardEls([]); }` and call it inside `goTeach`, `beginListen`, and `resumeFromDoubt`.

- [ ] **Step 3: sendDoubt streaming path** — at the start of the `if (onAskStream && voiceOnRef.current)` block call `clearBoard()` and declare `let queued = 0` and `const release = (els) => { if (els.length && fresh()) setBoardEls((p) => [...p, ...els]); }`. In `flush`, every `speakTeacherQueued` call (both the loop and the forced tail) first does `queued += 1; const ord = queued;` and passes `onStart: () => { setTtsActive(true); if (turn === doubtTurnRef.current) release(boardSyncRef.current.sentenceStarted(ord)); }`. Pass `onBoard: (el) => { if (turn !== doubtTurnRef.current) return; boardSyncRef.current.hold(el, queued); }` next to `onDelta`. In the done poller, when it decides the doubt is done, also `release(boardSyncRef.current.flush())`. In `.catch`, call `clearBoard()`.

- [ ] **Step 4: Render** — inside `<Stage key={sceneKey} style={st.workArea}>`, directly before the `{showBoard && (` block, add:
```jsx
{inDoubt && boardEls.length > 0 && (
  <View style={st.boardOuter}><DoubtBoard elements={boardEls} height={focusMode ? boardBoxH : 200} /></View>
)}
```

- [ ] **Step 5: Verify compile and existing helper tests**

Run: `node -e "require('@babel/core').transformFileSync('src/components/teacher/LiveTeachingPlayer.js',{presets:['babel-preset-expo']}); console.log('ok')"` and `npm run test:doubt-board`
Expected: `ok`; 6 PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/teacher/LiveTeachingPlayer.js src/screens/AITeacherScreen.js
git commit -m "feat(board): draw doubt answers on the board in step with speech"
```

---

### Task 10: End-to-end verification on a device/emulator

**Files:** none (verification only; fix-ups commit to the same branch)

- [ ] **Step 1: Mock run** — start the server with `MOCK_AI=true`, point the app at it (`EXPO_PUBLIC_API_URL`), open a lesson, ask any doubt with voice on.
Expected: the lesson board hides, the answer streams, and the mock rectangle plus the label "Rectangle" draw themselves as the first sentence starts speaking. Tap Resume: the board disappears and the lesson board returns.

- [ ] **Step 2: Real model run** — start the server with the real `ANTHROPIC_API_KEY`, ask: "Explain the Pythagoras theorem with a diagram."
Expected: a triangle (lines or a path) with 1–3 labels appears sentence by sentence; the caption and the spoken audio contain no `[[board:` text; `done.answer` in the server log contains no marker.

- [ ] **Step 3: Plain-text doubt** — ask: "What is the capital of France?"
Expected: no board appears; behaviour identical to before this branch.

- [ ] **Step 4: Interruption** — ask a diagram doubt, and while it is still speaking ask a second doubt.
Expected: the first board clears immediately; only the second doubt's shapes appear.

- [ ] **Step 5: Record results** — append a "Verified 2026-MM-DD" section with the four outcomes to the spec file and commit:
```bash
git add docs/superpowers/specs/2026-10-17-doubt-board-design.md
git commit -m "docs(board): record device verification results"
```

- [ ] **Step 6: Hand off** — use `superpowers:finishing-a-development-branch` to decide merge/PR.

---

### Task 11: Stop the teacher citing section numbers unnecessarily (textbook lessons)

**Context:** The owner's feedback (2026-10-17): in textbook lessons the teacher says things like "as 7.3 says…" in nearly every line. Today's `SOURCE_RULES` in `server/src/prompts/lessonGeneration.prompt.js:259` *instructs* this ("refer to sections by number ('as 7.3 says…') so the student can follow in the book"), and `SUMMARY_RULES` (`:261`) asks the revise slide to list sections by number. Book lessons are cached per `PROMPT_VERSION` (`:247`, currently `4`), so the prompt change needs a bump or cached lessons keep the old habit.

**Files:**
- Modify: `server/src/prompts/lessonGeneration.prompt.js:247,259,261`
- Test: `server/tests/lessonPrompt.sections.test.js`

**Interfaces:**
- Produces: `PROMPT_VERSION = 5`. `SOURCE_RULES` and `SUMMARY_RULES` exported (add to `module.exports`) so the test can read them.

Replace the "refer to sections by number…" clause in `SOURCE_RULES` with exactly:
`Mention a section number at most ONCE per lesson — only in the opening slide ("this is from 7.3 in your book") so the student can find the place; never repeat it in later narration, and never say "as the section says" or "the book says in 7.3" mid-explanation. Teach the idea, not the page.`
In `SUMMARY_RULES` replace `listing the sections by number` with `naming the topics to revise in plain words (section numbers only if the student needs them to find the page, at most one list)`.

- [ ] **Step 1: Write the failing test**

```js
'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { SOURCE_RULES, SUMMARY_RULES, PROMPT_VERSION } = require('../src/prompts/lessonGeneration.prompt')

test('source rules: section number at most once, never mid-explanation', () => {
  assert.equal(SOURCE_RULES.includes('as 7.3 says'), false)
  assert.equal(SOURCE_RULES.includes('at most ONCE per lesson'), true)
  assert.equal(SOURCE_RULES.includes('never repeat it in later narration'), true)
})
test('summary rules: revise slide names topics, not a list of section numbers', () => {
  assert.equal(SUMMARY_RULES.includes('listing the sections by number'), false)
  assert.equal(SUMMARY_RULES.includes('naming the topics to revise in plain words'), true)
})
test('prompt version bumped so cached book lessons regenerate', () => {
  assert.equal(PROMPT_VERSION, 5)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd server && node --test tests/lessonPrompt.sections.test.js`
Expected: FAIL (`SOURCE_RULES` undefined / version 4)

- [ ] **Step 3: Edit the two rule strings, bump `PROMPT_VERSION` to 5, export the two constants.**

- [ ] **Step 4: Run to verify pass, then the whole suite**

Run: `cd server && node --test tests/lessonPrompt.sections.test.js && npm test`
Expected: 3 PASS; full suite PASS

- [ ] **Step 5: Verify on a real lesson** — with the real key, generate one textbook lesson for a 2-section topic (e.g. Class 10 Science, Light, 10.1–10.2) and read the narration.
Expected: the section number appears in the opening slide only; no later slide says "as 10.2 says" or similar.

- [ ] **Step 6: Commit**

```bash
git add server/src/prompts/lessonGeneration.prompt.js server/tests/lessonPrompt.sections.test.js
git commit -m "fix(textbook): mention the section number once, then just teach"
```
