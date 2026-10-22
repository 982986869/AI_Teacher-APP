# Doubt Board — live drawing while the teacher answers a doubt (Route A)

**Date:** 2026-10-17 · **Status:** approved in conversation, not yet built
**Branch:** `feat/doubt-board` from `main` (`e5ae47b`)

## What the student sees

In the live classroom (`LiveTeachingPlayer`), the student asks a doubt. Today the lesson
board hides and the answer streams as a caption while the teacher speaks it. With this
change, when the answer benefits from a picture (a triangle, a graph, a flow, labelled
parts, a derivation step), a board appears in the hidden board's slot and the teacher
draws on it **while speaking**: each shape appears when the sentence that introduces it
starts playing. Plain-text answers show no board, exactly as today.

## Decisions (locked)

| Question | Decision | Why |
|---|---|---|
| Transport | The existing SSE stream `POST /api/ai/ask/stream` gets one new event, `board` | Stream already carries `meta`/`delta`/`done`; no socket.io, no new service |
| Canvas | Existing `react-native-svg` chalk primitives in `WhiteboardCanvas.js` (`ChalkStroke`, `Box`, `Circle`, `Arrow`, `ChalkLine`, `Highlight`) | Same look as lesson boards; no WebView, no Excalidraw/tldraw dependency |
| How the model draws | Inline markers in its text: `[[board:{"op":"rect","x":40,"y":30,"w":80,"h":50}]]` on their own line, right after the sentence they illustrate. Server strips them from the spoken text and forwards them as `board` events | One streamed response; text and drawing interleave naturally. Anthropic tool_use would end the turn at each tool call and need a round-trip per shape |
| Voice | Unchanged: ElevenLabs/OpenAI TTS via `speakTeacherQueued`, sentence by sentence | No LiveKit in Route A |
| Opt-in | App sends `board: true` in the stream request. Without it the server prompt and output are byte-identical to today | Old app builds keep working; OTA-safe |
| Where | Doubts inside a lesson only (the streaming path in `sendDoubt`). Not `KnowledgeAskScreen`, not lesson slides | Smallest surface that proves the feature |

## Board element schema

Coordinate space is **300 × 180** (same as `DiagramRenderer`'s `VIEW_W`/`VIEW_H`). Origin
top-left. All numbers are finite; the server clamps x into [0, 300], y into [0, 180],
sizes into [1, 300].

| op | fields | notes |
|---|---|---|
| `clear` | — | wipes the board; elements after it are the new drawing |
| `rect` | `x y w h` | |
| `circle` | `cx cy r` | |
| `line` | `x1 y1 x2 y2` | |
| `arrow` | `x1 y1 x2 y2` | head at (x2, y2) |
| `text` | `x y text size?` | `text` ≤ 40 chars; `size` 10–24, default 14; (x, y) is the text baseline start |
| `path` | `d` | SVG path, ≤ 400 chars, commands `M L Q C Z` only, for curves and graphs |
| `highlight` | `x y w h` | translucent yellow block behind text/shapes |

Every op except `clear` takes optional `color` ∈ `chalk | yellow | blue | green | pink | orange`
(default `chalk`), mapped to the `BOARD` palette in `src/components/teacher/theme.js`.
At most **24** elements per answer; the server drops the rest. Invalid markers are dropped
silently and never reach the spoken text.

## Server flow

1. `askStream` controller reads `board === true` from the body and passes `board` into
   `agentService.askStream(params, { onMeta, onDelta, onBoard })`.
2. `buildTeacherSystemPrompt({ ..., board })` appends a BOARD block only when `board` is
   true: board size, the marker syntax, "at most 6 markers", "only when a visual truly
   helps", "marker on its own line right after the sentence it illustrates", "labels ≤ 3
   words", "markers do not count toward the 5-line limit".
3. The provider streams raw text as today. `askStream` pushes each chunk through a board
   stream parser that emits clean text to `onDelta` and validated elements to `onBoard`.
   The guard, the `done.answer`, and therefore the chat history only ever see clean text.
4. Controller writes `event: board\ndata: {"op":...}` for each element.
5. `MOCK_AI=true` with `board: true` emits a fixed two-element sample so the app can be
   exercised without a key.

## App flow

1. `askAgentStream` sends `board: true` and calls `onBoard(el)` for `board` events.
2. `sendDoubt` (streaming path) keeps a board sync: an element arriving after *k*
   sentences have been queued for speech is released when sentence *k* starts speaking
   (`speakTeacherQueued`'s `onStart`). When the stream ends, anything still held is
   released. Elements that follow a `clear` replace the board.
3. `DoubtBoard` renders the released elements in a `<Svg viewBox="0 0 300 180">` inside a
   `WhiteboardCanvas`-style frame; each element animates on mount using the chalk
   primitives. It mounts in the lesson board's slot when `inDoubt` and there is at least
   one element; it unmounts (and the element list resets) on resume, next scene, or a new
   doubt.

## Out of scope (follow-ups)

- Board when voice is off (the non-streaming `onAsk` path). Today that path has no board.
- Boards for `KnowledgeAskScreen` and for lesson slide generation.
- Real-time call / interruption (Route B: LiveKit + Python agent).
- Student drawing on the board.
