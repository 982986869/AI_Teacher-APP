# AI Teacher — Reference & UX/UI Standards

A single source of truth for the AI Teacher feature: what it is, where it lives, the
API it speaks to, and the design rules any UI change must follow so the surfaces stay
one crafted product instead of drifting into ad‑hoc styling.

---

## 1. Package & source map

| Thing | Value |
| --- | --- |
| App package (Android) | `com.kumkum165.ailernova` |
| EAS project id | `dccd04ea-7d70-4833-8530-b551448b5b05` |
| Screen entry | [src/screens/AITeacherScreen.js](../src/screens/AITeacherScreen.js) |
| API client | [src/api/aiApi.js](../src/api/aiApi.js) |
| Design tokens | [src/components/teacher/premiumTheme.js](../src/components/teacher/premiumTheme.js) |
| Micro‑interaction kit | [src/components/teacher/uiKit.js](../src/components/teacher/uiKit.js) |
| Live player | [src/components/teacher/LiveTeachingPlayer.js](../src/components/teacher/LiveTeachingPlayer.js) |
| Avatar / identity | [src/components/teacher/](../src/components/teacher/) |
| Server routes | [server/src/routes/ai.js](../server/src/routes/ai.js) |
| Server controller | [server/src/controllers/ai.controller.js](../server/src/controllers/ai.controller.js) |

**Base URL** is resolved in [src/constants/config.js](../src/constants/config.js): a
standalone build reads `EXPO_PUBLIC_API_URL`; in dev it derives the LAN host from
Metro. All AI paths hang off `/api/ai`.

---

## 2. API surface

Every route requires a valid JWT (attached automatically by the axios request
interceptor). Responses are wrapped as `{ success, message, data }` — clients unwrap
`res.data.data`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/ai/ask` | Unified teacher agent (intent + RAG + teacher style). |
| `POST` | `/api/ai/ask/stream` | Same, streamed as SSE so the teacher can speak sentence‑by‑sentence. |
| `POST` | `/api/ai/lesson/generate` | Generate a full lesson (Opus; 30–90s, 2‑min timeout). |
| `GET` | `/api/ai/lesson/:id` | Fetch a lesson. |
| `POST` | `/api/ai/lesson/:id/doubt` | In‑lesson doubt tied to a slide. |
| `GET` | `/api/ai/lesson/:id/doubts` | Doubt history for a lesson. |
| `POST` | `/api/ai/lesson/:id/progress` | Best‑effort playback telemetry. |
| `GET` | `/api/ai/lessons/progress` | Lessons + progress (completed / resume). |
| `GET` | `/api/ai/chapters/progress` | Per‑chapter %, weak/strong, recommended. |
| `POST` | `/api/ai/revision` | Weak‑topic revision (recap + quick quiz). |
| `POST` | `/api/ai/memory/event` | Record a doubt / mistake / quiz event. |
| `GET` | `/api/ai/memory/summary` | Progress snapshot. |
| `GET` | `/api/ai/plan` | "What should I study next?" |
| `GET` | `/api/ai/session/resume` | "Welcome back" continuity snapshot. |

### `/api/ai/ask` contract
Request body (validated server‑side; `text` required, ≤1000 chars):
```jsonc
{
  "text": "why is the sky blue?",   // required
  "subject": "Physics",             // optional, ≤100
  "gradeLevel": "Class 11",         // optional, ≤20
  "lessonId": "…", "slideIndex": 3, // optional, in-lesson context
  "history": [ … ],                 // optional, ≤20 turns
  "level": "beginner|intermediate|advanced",
  "pending": { … }                  // optional, carries quiz/check state forward
}
```
Returns `{ intent, language, grounded, confidence, sources, answer, resumeCue, … }`.
The streaming variant emits `meta` → many `delta` (`{ t }` text chunks) → `done` (same
shape as non‑streamed), or an `error` event.

---

## 3. Design tokens — the only values you may use

Import from `premiumTheme.js`. **Never hard‑code a hex, radius, or spacing number in a
component** — reference a token so the avatar, cards, dock and SVG boards re‑theme
together. The live surface uses the **Nova** palette (`C` light / `D` dark) with `F`,
`SP`, `GRAD`, `R`.

### 3.1 Light palette — `C`
| Token | Value | Use |
| --- | --- | --- |
| `C.cream` | `#F8FAFC` | App background |
| `C.cream2` | `#F1F5F9` | Elevated / track |
| `C.board` | `#FFFFFF` | Card / surface |
| `C.ink` | `#0F172A` | Primary text |
| `C.ink2` | `#475569` | Secondary text |
| `C.dim` | `#94A3B8` | Labels / tertiary |
| `C.faint` | `#CBD5E1` | Placeholders |
| `C.line` | `rgba(15,23,42,0.08)` | Hairlines / dividers |
| `C.accent` | `#4F46E5` | **Primary brand** (indigo‑600) |
| `C.accentBright` | `#4338CA` | Pressed / emphasis |
| `C.accentSoft` | `rgba(79,70,229,0.12)` | Tinted fills, selected chips |
| `C.green` | `#10B981` | Success / correct |
| `C.pink` | `#F43F5E` | Danger / weak |
| `C.blue` `C.orange` | `#3B82F6` `#F97316` | Diagram hues (keep distinct) |

### 3.2 Dark palette — `D` (the "room lights down" classroom chrome)
`D.bg #020617` · `D.panel #0F172A` · `D.panel2 #1E293B` · `D.text #F8FAFC` ·
`D.textDim #94A3B8` · `D.edge rgba(255,255,255,0.10)`.
The whiteboard card itself stays on `C` (white + ink) so SVG boards render unchanged
inside the dark room.

### 3.3 State accents
Speaking = brand indigo, listening = emerald, thinking = indigo. Use `stateColor(s)`
from the theme rather than branching on colors inline.

### 3.4 Type — `F` (Poppins, loaded at the AI Teacher root)
`F.black` 800 · `F.bold` 700 · `F.semi` 600 · `F.med` 500 · `F.reg` 400.
`SERIF` (Georgia/serif) is for **restraint only** — greeting, lesson title, formulas.
Families fall back to the system font if Poppins hasn't loaded, so referencing them is
always safe.

### 3.5 Spacing — `SP`
`xs 4 · sm 8 · md 14 · lg 20 · xl 28 · xxl 40 · xxxl 56`. Compose layout from these;
no free‑hand margins.

### 3.6 Radius — `R`
`sm 12 · md 16 · lg 20 · xl 24 · xxl 32 · pill 999`. Cards use `R.lg`–`R.xl`; chips and
pills use `R.pill`.

### 3.7 Gradients — `GRAD` (rendered by `<Gradient/>`, SVG, no native dep)
`brand` indigo→purple (headers) · `hot` pink→orange (primary CTA) · `mint`
teal→emerald (study insights) · `violet` indigo→purple (ask mic) · `ink` slate
(dark cards).

---

## 4. Component primitives — use these, don't re‑roll them

From `uiKit.js`:

- **`<Gradient colors={GRAD.x} …>`** — the only sanctioned gradient. Handles the two
  Android gotchas (real‑pixel SVG sizing + setting `from` as the view background so the
  elevation shadow doesn't leak a white block). Pass a `GRAD` pair, never raw hexes.
- **`<Appear from="up|down|scale" delay duration>`** — the standard entrance: soft
  fade + 12px slide (or 0.94 scale), 360ms, `ease‑out‑cubic`. Cleans up on unmount.
- **`<PressableScale …>`** — the standard tap target. Springs to 0.96 while held and
  **wires accessibility** (`role`, `label`, `hint`, disabled state). Use it in place of
  `TouchableOpacity` everywhere on these surfaces.

---

## 5. UX/UI standards for changes

**Motion**
- Entrances via `<Appear>`; presses via `<PressableScale>`. Don't introduce new
  durations/easings — reuse the kit so timing stays uniform.
- Motion is a whisper, never a delay: ≤360ms, subtle. If it reads as waiting, it's wrong.
- Always `useNativeDriver: true` (opacity/transform only). Never animate layout props.

**Layout & hierarchy**
- One card = one surface (`C.board`, `R.lg`+, hairline `C.line`). Float cards on
  `C.cream`; don't stack borders.
- Rhythm comes from `SP`. Group related controls; give primary actions breathing room.
- Serif is a garnish (greeting / title / formula). Body and UI are Poppins.

**Color & state**
- Brand action = `C.accent`; its soft tint = selected/hover fills. Semantic only:
  green = correct, pink = weak/danger. Don't repurpose diagram hues for UI chrome.
- Teacher state (speaking/listening/thinking) always uses `stateColor()` — keep the
  mapping consistent across avatar, dock and captions.

**Light & dark**
- Chrome re‑themes via `C`↔`D`; the whiteboard/SVG board stays on `C`. Verify any new
  surface in both the light screen and the dark "room" before shipping.

**Touch & accessibility**
- Min target 44×44 (use `hitSlop` on small controls). `PressableScale` already sets
  roles/labels — always pass a meaningful `accessibilityLabel`.
- Text contrast: body on `C.board` uses `C.ink`/`C.ink2`; never drop below `C.dim` for
  anything a user must read.

**Async & AI latency (feature‑specific)**
- Lesson generation is 30–90s — always show determinate‑feeling progress (the existing
  "preparing" beats), never a bare spinner.
- Prefer `askAgentStream` for anything the teacher speaks, so words appear as they
  arrive instead of after a long pause.
- Progress/telemetry calls are best‑effort — their failure must never block the UI.

**Non‑negotiables**
- No raw hex / magic numbers in components — tokens only.
- No new gradient path — extend `GRAD` and use `<Gradient>`.
- No `TouchableOpacity` on teacher surfaces — use `PressableScale`.
- New color or spacing need? Add a token to `premiumTheme.js` first, then reference it.

---

## 6. Change checklist

- [ ] All colors/spacing/radii come from `C`/`D`/`F`/`SP`/`R`/`GRAD`.
- [ ] Entrances use `<Appear>`, taps use `<PressableScale>`.
- [ ] Gradients go through `<Gradient>` with a `GRAD` pair.
- [ ] Verified in **both** light and dark.
- [ ] Targets ≥44px; every control has an `accessibilityLabel`.
- [ ] AI waits show real progress; streaming used where the teacher speaks.
- [ ] No new hard‑coded style values introduced.
