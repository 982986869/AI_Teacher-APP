# AI Teacher Doubt Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the AI Teacher's in-lesson answers correct, grounded in the slide the student is on, in the right language and depth. Prove it with a before/after quality eval.

**Architecture:**
- A new pure module `lessonContext.js` builds the LESSON CONTEXT text (current slide ± neighbours, plus book passages) and decides the reply language from the lesson subject.
- `agent.service.prepareTurn` loads slides and book text in parallel with the existing intent and retrieval calls, and threads the context through `ask`, `askStream` and `reExplain` into `buildTeacherSystemPrompt`.
- The guard stops cutting middle lines. The provider gets more tokens and trims a `max_tokens` cut to the last full sentence.
- A local-only eval script scores answers with a Claude judge.

**Tech Stack:** Node 22, Express, Prisma 5, `@anthropic-ai/sdk` 0.52, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-18-ai-teacher-doubt-quality-design.md`

## Global Constraints

- **No model change.** Use only the existing `config.ai.doubtModel` / `cheapModel` / `knowledgeModel`. No new model env var, no thinking params.
- **Reply language:** English for every subject. Simple Hindi only when the lesson subject contains `hindi`, `हिंदी`, `sanskrit` or `संस्कृत` (case-insensitive). No lesson or no subject means English.
- **Depth:** CLASS DEPTH wins over slide content. Simplify above-class terms; never raise depth to match the slide.
- **Context caps:** LESSON CONTEXT ≤ 3000 chars. Book passages ≤ 4000 chars.
- **Token limits:** `TEACHER_MAX_TOKENS` = 700, `TEACHER_MAX_TOKENS_BOARD` = 900.
- **Guard:** never drop middle lines. Safety ceiling = first 12 lines.
- **Loading:** new context loading is best-effort (log and continue) and runs in parallel. Budget: ≤ ~0.5 s added before the first words.
- **Streaming:** the streaming / board / SSE wire format is unchanged.
- **Eval:** runs only against `localhost`. No DB schema change.
- **Commits:** end every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A lesson with zero slides, or a `slideIndex` past the end.** The context builder returns a context with no slide lines; it must not throw. Test in Task 2.
2. **A Hinglish question inside a Science lesson.** Must be answered in English, including canned lines (off-topic, greeting) and the `pending.language` carried into re-explain. Test in Task 4.
3. **"ok but why is it green?" while a check is pending.** Must be treated as a new question, not "understood". Test in Task 4.
4. **A book load that throws, or a lesson that doesn't belong to the user.** The answer still comes back, without book text. Test in Task 4 with stubs.
5. **A `max_tokens` cut mid-sentence.** The spoken/shown text ends at the last full sentence, never mid-word. Test in Task 5.

---

### Task 1: Local quality eval + baseline

**Files:**
- Create: `server/eval/doubts.json` (golden cases)
- Create: `server/scripts/eval-doubts.js`
- Test: `server/tests/evalDoubts.test.js`

**Interfaces:**
- Produces:
  - `assertLocalBase(url: string): void`. Throws unless the host is `localhost` or `127.0.0.1`.
  - `summarise(results: Array<{id, scores:{correct,onTopic,rules,teaching}}>) -> {cases, total, max, byCriterion}`.
  - Both are exported from `server/scripts/eval-doubts.js`. The CLI runs only when the file is `require.main`.

- [ ] **Step 1: Write failing tests** `assertLocalBase rejects non-local`:
  - `assert.throws(() => assertLocalBase('https://api.ailernova.in'))`
  - `assert.doesNotThrow(() => assertLocalBase('http://localhost:5000'))`

  `summarise totals`:
  - two results with scores `{2,2,1,0}` and `{2,1,2,2}`
  - expect `total === 12`, `max === 16`, `byCriterion.correct === 4`
- [ ] **Step 2: Run** `node --test tests/evalDoubts.test.js`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement `server/scripts/eval-doubts.js`.**
  - **CLI:** `node scripts/eval-doubts.js --label baseline [--base http://localhost:5000]`.
  - **Auth:**
    - Load `.env` via `dotenv`.
    - For each lesson in `doubts.json`, sign a 30-min JWT `{ sub: ownerId }` with `JWT_SECRET`.
  - **Request:** POST `/api/ai/ask` with `{ text, subject, lessonId, slideIndex, history, pending }`.
  - **Judge:**
    - Call `new Anthropic().messages.create` with `model: process.env.AI_KNOWLEDGE_MODEL || process.env.AI_DOUBT_MODEL` and `max_tokens: 400`.
    - The system prompt is a rubric: score 0–2 for `correct`, `onTopic`, `rules`, `teaching`; return JSON only, as `{"correct":n,"onTopic":n,"rules":n,"teaching":n,"note":"…"}`.
    - Give it the case's `mustDo` / `mustNot`, the class, the expected language, and the answer.
    - Parse the first `{…}`. On a parse failure, score all four as 0 with the note `judge-parse-failed`.
  - **Output:** write `server/eval/results/<label>.json` and `<label>.md`. The md has a totals table plus every Q/A/score.
  - **Gitignore:** add `server/eval/results/` to `.gitignore`.
- [ ] **Step 4: Write `server/eval/doubts.json`.**
  - **Shape:** `{ lessons: { photo: {id, ownerId, subject, classLevel}, hindi?: {...}, book?: {...} }, cases: [{ id, lesson, slide, q, history?, pending?, expectLang, mustDo, mustNot }] }`.
  - **Cases:** ≈40, including the 14 from `scratchpad/doubt-eval.js` (same questions).
  - **Also cover:**
    - an above-class term ("NADPH kya hai?" → Class 9 simplification);
    - "ok but why is it green?" with `pending: {kind:'understanding', topic:'Chlorophyll green kyu dikhta hai?', subject:'Science', language:'hinglish', attempts:0}`;
    - "samajh nahi aaya" with the same pending;
    - "why?" with the history of a previous answer;
    - a multi-step numerical;
    - an exam-guarantee question;
    - a homework dump.
  - **Photo lesson:** `0326f06e-792f-4e67-9c42-fe16e7eefcdd`, owner `1566e6d8-fa6c-493f-b99e-24dd87b62e47`, Class 9.
  - **Hindi lesson:** find one in the local DB:

    ```sql
    select id,"userId",subject from lessons where status='READY' and (subject ilike '%hindi%' or subject like '%हिंदी%' or subject ilike '%sanskrit%') limit 1
    ```

    If none exists, generate one for the Class 9 owner with `POST /api/ai/lesson/generate {topic:"संज्ञा", subject:"हिंदी"}`.
  - **Textbook lesson:** add one only if a lesson with `bookChapterId` exists locally.
  - Hindi-lesson cases expect `expectLang:'hi'`; all others expect `'en'`.
- [ ] **Step 5: Run** `node --test tests/evalDoubts.test.js`. Expected: PASS.
- [ ] **Step 6: Run the baseline** against the current code. The local server must be running, and Docker `ailernova-pg` must be up.
  - Run: `node scripts/eval-doubts.js --label baseline`.
  - Expected: `eval/results/baseline.md` is written, with totals printed.
- [ ] **Step 7: Commit** `doubts.json`, the script, the test and the `.gitignore` line, with the message "eval: local golden-set judge for in-lesson doubts".

---

### Task 2: Lesson context + reply language module

**Files:**
- Create: `server/src/services/lessonContext.js`
- Test: `server/tests/lessonContext.test.js`

**Interfaces:**
- Produces:
  - `replyLanguageFor(subject?: string) -> 'en' | 'hi'`
  - `pickBookPassages(topics: Array<{number, title, text}>, query: string, cap = 4000) -> string`. Ranks by count of shared words (lower-cased, length ≥ 3) with `query`, then keeps whole passages, formatted `[number title]\ntext`, until `cap`. If the first passage alone exceeds `cap`, it is sliced to `cap`.
  - `buildLessonContext({ lesson, slides, slideIndex, bookText }) -> string`. Returns `''` when there is no lesson.

    Format:

    ```
    LESSON: <lessonTitle||topic>
    CURRENT SLIDE (n of N): <title>
    <explanation>
    <narrationText>
    Key points: <visualData.keyPoints joined by '; '>   (only if array)
    PREVIOUS SLIDE: <title> — <explanation>             (if exists)
    NEXT SLIDE: <title> — <explanation>                 (if exists)
    ```

    - The slide part is capped at 3000 chars (slice).
    - If `bookText` is present, append `\nTEXTBOOK PASSAGES:\n<bookText>` (already capped by `pickBookPassages`).
    - Slides are matched by array position `slideIndex`, which is 0-based, same as the app.

- [ ] **Step 1: Write failing tests:**
  - `replyLanguageFor`:
    - `'Science'` → `'en'`
    - `'हिंदी (मल्हार)'` → `'hi'`
    - `'Old - हिंदी ए'` → `'hi'`
    - `'Sanskrit'` → `'hi'`
    - `undefined` → `'en'`
  - `buildLessonContext`:
    - with 3 slides and `slideIndex:1` it contains `CURRENT SLIDE (2 of 3)`, `PREVIOUS SLIDE:` and `NEXT SLIDE:`;
    - with `slideIndex: 99` or `slides: []` it doesn't throw and contains `LESSON:` but not `CURRENT SLIDE`;
    - with a 10k-char narration, the result length is ≤ 3000 + header slack (assert `< 3200`);
    - `lesson: null` → `''`.
  - `pickBookPassages`: of the topics `[{number:'1.1', title:'Chlorophyll', text:'green pigment ...'}, {number:'1.2', title:'Respiration', text:'...'}]` with query `'why is chlorophyll green'`, the chlorophyll passage comes first; the result length is ≤ cap.
- [ ] **Step 2: Run** `node --test tests/lessonContext.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** the three functions as specified (pure, no I/O).
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** "lessonContext: slide/book context builder and subject-based reply language".

---

### Task 3: Teacher prompt rules

**Files:**
- Modify: `server/src/prompts/teacherResponse.prompt.js` (`buildTeacherSystemPrompt`, `languageBlock`, `studentMemoryBlock`, `INTENT_SHAPE`, the rule list)
- Test: `server/tests/teacherPrompt.rules.test.js` (new). Also re-run `tests/teacherPrompt.board.test.js` and `tests/teacherMemory.test.js`.

**Interfaces:**
- Consumes: the `lessonContext` string from Task 2, passed in.
- Produces: `buildTeacherSystemPrompt({ …existing, lessonContext = '' })`. It is the same function with one new optional param, so existing callers are unchanged.

- [ ] **Step 1: Write failing tests:**
  - with `lessonContext:'LESSON: X'`, the prompt contains `LESSON CONTEXT` and `LESSON: X`, and `LESSON CONTEXT` appears before `GROUNDING`;
  - ungrounded prompt (`contexts:[]`) does **not** contain `with confidence from general knowledge`, and contains `not sure`;
  - the prompt contains each of these rules (check substrings, case-insensitive): `gender`, `false assumption`, `homework`, `never promise`, the depth-precedence phrase `class level`;
  - the prompt does not contain `Your reasoning has really been improving`;
  - `language:'hinglish'` → contains the English LANGUAGE line, not `Hinglish`;
  - `language:'hi'` → contains `Hindi (Devanagari)`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Prompt content to include:
  - **LESSON CONTEXT block** (only when non-empty): "This is what is on the student's screen; answer about it. If the slide uses terms above the student's class, explain at the class level and simplify those terms; never raise the depth to match the slide."
  - **New ungrounded GROUNDING text:** answer briefly and correctly; if not sure, say so plainly and suggest checking the textbook; never claim certainty.
  - **New rules in "HOW A REAL TEACHER ANSWERS":**
    - gender-neutral (never assume the student's gender; in Hindi use neutral or plural forms);
    - only reference memories listed in STUDENT MEMORY, never invent progress or compliments;
    - if the question contains a false assumption, correct it in the first line;
    - homework / "write it for me": give the plan or the first step and ask the student to try the next part;
    - never promise exam questions or results; say what is commonly asked;
    - don't talk about seeing or not seeing slides;
    - end, when it fits, with one tiny question about the idea instead of only "Clear?".
  - **Length:** "MAX 5 short lines" becomes "about 5 short lines; up to 8 for a worked numerical or step-by-step".
  - **Memory example:** in `studentMemoryBlock`, replace the example `"Your reasoning has really been improving, so let's build on that —"` with one tied to listed memory only.
  - **`languageBlock(language)`:** `'hi'` returns the existing Hindi block; anything else returns the English block. Keep the Hinglish text in a `HINGLISH_BLOCK` const marked "unused (owner 2026-11-18: English only)".
  - **Mirroring:** remove "Mirror the student" from the closing line; keep "never switch language mid-answer".
- [ ] **Step 4: Run** the new test, `teacherPrompt.board.test.js` and `teacherMemory.test.js`.
  - Expected: all PASS.
  - Where an old test asserted the removed example line or Hinglish mirroring, update that assertion to the new rule and say so in the commit message.
- [ ] **Step 5: Commit** "teacher prompt: lesson context, honest fallback, gender-neutral, premise/homework/exam rules, English-unless-Hindi-subject".

---

### Task 4: Agent wiring + understanding check

**Files:**
- Modify: `server/src/services/agent.service.js`:
  - `classifyUnderstanding` (175–183)
  - `prepareTurn` (193–210)
  - `reExplain` (325–365)
  - `ask` (452–578)
  - `askStream` (581–684)
  - `greetingReply` (126)
- Modify: `server/src/providers/ai/AnthropicProvider.js`. Pass `lessonContext` through in `generateTeacherResponse` / `streamTeacherResponse` (258, 279).
- Test: `server/tests/agentGrounding.test.js` (new)

**Interfaces:**
- Consumes:
  - `buildLessonContext`, `pickBookPassages` and `replyLanguageFor` (Task 2);
  - `buildTeacherSystemPrompt({…, lessonContext})` (Task 3);
  - `lessonService.getLessonById`, `lessonService.getLessonWithSlides`;
  - `booksService.loadSource` from `./textbooks.service`.
- Produces:
  - `prepareTurn` returns `{ lesson, subject, gradeLevel, intentRes, retrieval, lessonContext }`;
  - `intentRes.language` is already replaced by `replyLanguageFor(lesson?.subject || subject)`;
  - `classifyUnderstanding(text) -> 'understood' | 'not_understood' | 'other'` (same name and values).

- [ ] **Step 1: Write failing tests** in `agentGrounding.test.js`.

  `classifyUnderstanding`:

  | Input | Expected |
  |---|---|
  | `'haan'` | `understood` |
  | `'samajh gaya'` | `understood` |
  | `'ok'` | `understood` |
  | `'nahi samjha'` | `not_understood` |
  | `'phir se'` | `not_understood` |
  | `'not clear'` | `not_understood` |
  | `'ok but why is it green?'` | `other` |
  | `'right angle kyun hota hai'` | `other` |
  | `'why is it not zero?'` | `other` |
  | `'no, what about respiration'` | `other` |

  `prepareTurn` (stubs for `lessonService`, `booksService`, the retriever and the intent classifier; export it for tests as `module.exports._test = { prepareTurn }`):
  - a Science lesson with 3 slides, `slideIndex` 1, question in Hinglish → `intentRes.language === 'en'` and `lessonContext` contains `CURRENT SLIDE (2 of 3)`;
  - lesson subject `'हिंदी'` → `language === 'hi'`;
  - `bookChapterId` set and `loadSource` rejects → resolves, `lessonContext` has no `TEXTBOOK PASSAGES`;
  - `bookChapterId` set with lesson `gradeLevel '10'` and passed `gradeLevel '9'` → returns `gradeLevel '10'`.

  `prepareTurn` must take `slideIndex` (new param).
- [ ] **Step 2: Run** `node --test tests/agentGrounding.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement:**
  - **`classifyUnderstanding`:**
    - Normalise (trim, lower-case, strip trailing punctuation except `?`).
    - Return `other` if the text has more than 5 words, contains `?`, or matches `\b(why|how|what|which|when|kyun|kyu|kaise|kya|kaun)\b`.
    - Otherwise match **whole-message** patterns (anchored `^…$`). Keep the existing word lists, with not-understood checked first.
  - **`prepareTurn({ userId, question, subject, gradeLevel, lessonId, slideIndex })`:**
    - In parallel with intent and retrieval, load:
      - `getLessonById`;
      - `getLessonWithSlides` (use `.slides`);
      - then, if `lesson.bookChapterId`, `booksService.loadSource({ chapterId: Number(...), kind: ids.length ? 'topics' : 'summary', topicIds: ids })` → `pickBookPassages(src.topics, question + ' ' + currentSlideTitle)`.
    - Each load is wrapped in `.catch(e => { console.error('[agent] …', e?.message); return null })`.
    - If `lesson.bookChapterId && lesson.gradeLevel`, set `gradeLevel = lesson.gradeLevel` **before** retrieval. Retrieval must start after the lesson read; keep intent in parallel.
    - Set `intentRes.language = replyLanguageFor((lesson && lesson.subject) || subject)`.
    - Return `lessonContext = buildLessonContext({ lesson, slides, slideIndex, bookText })`.
  - **`ask` / `askStream`:** pass `slideIndex` into `prepareTurn`, and `lessonContext` into `generateTeacherResponse` / `streamTeacherResponse`.
  - **`reExplain`:**
    - accepts `{ …, history, lessonId, slideIndex, gradeLevel, subject }`;
    - calls `prepareTurn` for context, using `pending.topic` as the question;
    - passes `lesson`, `history.slice(-8)`, `gradeLevel` and `lessonContext` to `generateTeacherResponse`;
    - the call site in `ask` passes `history`, `params.gradeLevel` and `params.subject`.
  - **`greetingReply`:** use the passed `language`; drop the remembered `pref`, since the language is now decided by the subject.
  - **Provider:** add `lessonContext` to both method signatures and forward it into `buildTeacherSystemPrompt`.
- [ ] **Step 4: Run** `node --test tests/agentGrounding.test.js` and then `npm test`.
  - Expected: the new tests PASS.
  - The full suite has the same 4 pre-existing failures as before (`lesson.source` ×3 and `personalization` ×1), and nothing new.
- [ ] **Step 5: Commit** "agent: ground doubts in the current slide/book, subject-based reply language, book class for textbook lessons, stricter understanding check".

---

### Task 5: Never cut an answer

**Files:**
- Modify: `server/src/utils/responseGuard.js` (`capLines`, `MAX_LINES`)
- Modify: `server/src/providers/ai/AnthropicProvider.js` (consts at 77/80, `generateTeacherResponse`, `streamTeacherResponse`)
- Test: `server/tests/responseGuard.test.js` (new)

**Interfaces:**
- Produces:
  - `capLines(text) -> { text, truncated }` (same shape). `MAX_LINES = 12`, keeping the **first** 12 lines.
  - `trimToLastSentence(text: string) -> string`, exported from `responseGuard.js`. Returns the text up to and including the last `.`, `!`, `?` or `।` that is followed by whitespace or end of text. If there is none, it returns the text unchanged.

- [ ] **Step 1: Write failing tests:**
  - `capLines` on 7 lines returns all 7 in order, with `truncated:false`;
  - on 15 lines it returns lines 1–12, with `truncated:true`;
  - `trimToLastSentence('One. Two is cut mi')` → `'One.'`;
  - `trimToLastSentence('ऑक्सीजन पानी से आती है। फिर')` → `'ऑक्सीजन पानी से आती है।'`;
  - `trimToLastSentence('no stop here')` → unchanged.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** both functions, and in the provider:
  - set `TEACHER_MAX_TOKENS = 700` and `TEACHER_MAX_TOKENS_BOARD = 900`;
  - in both teacher methods, if `final/message.stop_reason === 'max_tokens'`, set `answer = trimToLastSentence(answer)`.
  - For the stream path, the already-streamed text stays as streamed. Only the returned (shown and saved) text is trimmed. Note this in a comment.
- [ ] **Step 4: Run** the new test and `npm test`. Expected: PASS, with no new failures.
- [ ] **Step 5: Commit** "guard: never drop middle lines; more room for teacher answers; trim max_tokens cuts to a full sentence".

---

### Task 6: After-eval and handover

**Files:**
- Use: `server/scripts/eval-doubts.js` (Task 1)

- [ ] **Step 1: Restart the local server** (code changed), then run `node scripts/eval-doubts.js --label after`.
- [ ] **Step 2: Compare** `eval/results/baseline.md` and `after.md`: totals per criterion, and the cases that went down.
  - If any case drops on `correct`, read it. Fix the prompt in Task 3's file, re-run, and commit "teacher prompt: <fix>".
- [ ] **Step 3: Check latency.** From the `ms` field of both runs, the median added time must be ≤ ~500 ms.
  - If it's over, look at the slide/book loads (they must be in parallel) before anything else.
- [ ] **Step 4: Report to the owner** in plain words:
  - before/after totals and three example answers (before vs after);
  - what was not changed (the follow-ups listed in the spec);
  - the deploy steps: server only, `git pull` + restart. No app change, no DB change.
