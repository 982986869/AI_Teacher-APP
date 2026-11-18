# AI Teacher: better answers to in-lesson doubts

Date: 2026-11-18 · Owner request: "find the AI Teacher's flaws (live chat answers) and fix them"

## Intent

During a lesson a student asks the AI Teacher a question (typed or by voice). Today the
answers are often generic, sometimes scientifically wrong, and occasionally strange. The
owner wants the in-lesson answers to be correct, about what is on the student's screen,
and in the voice of a good teacher. The owner also wants a way to *measure* answer
quality, so future prompt changes can be judged.

### Evidence (live test, 2026-11-18, local server, model claude-haiku-4-5)

14 questions asked inside a Class 9 "Photosynthesis" lesson through `POST /api/ai/ask`.
8 were good, 6 were wrong or poor:

- "Dark reaction raat ko hoti hai na?" gave a contradictory answer ("happens day AND night", then "stops at night"), plus a nonsense line ("raat matlab rat").
- "Why 6O₂ and not 3O₂?" was explained by carbon count, which is wrong. The correct reason is oxygen-atom balancing.
- The homework request was answered as if the student were a girl ("kar rahi ho"), with an invented compliment ("you are improving your application") and an outline cut off after line 1.
- "Exam mein kya pakka aayega?" was answered with "pakka aayega" (a false promise) and Class 11 content, and the model claimed "I can see slide 9".
- The Hinglish "stress" question was answered in Devanagari.
- The follow-up "samajh nahi aaya" lost the topic.

## Root causes (verified in code)

1. **The model cannot see the lesson.**
   - The live chat path (`agent.service.ask` / `askStream` → `teacherResponse.prompt.js`) passes only the lesson title, subject and grade.
   - No slide content and no textbook text reach it. The textbook path (`ai.service.answerDoubt`) exists but the app never calls it.
   - For ungrounded turns the prompt says "Answer with confidence from general knowledge" (`teacherResponse.prompt.js:164`).
2. **The understanding check misfires.**
   - When a check is pending, `classifyUnderstanding` (`agent.service.js:175`) treats any message containing "not/nahi/no" as "didn't understand", and any message starting with "ok/right/yes/good" as "understood". The real question is dropped.
   - `reExplain` (`:325`) then calls the model with `lesson: null, history: []` and no grade.
3. **Answers are cut silently.**
   - `capLines` (`utils/responseGuard.js`) keeps the first 4 lines plus the last line and drops the middle, which deletes steps.
   - `max_tokens` is 450 (700 with board), and a `max_tokens` stop is never detected (`AnthropicProvider.js:264, 283`).
4. **Prompt problems.**
   - Nothing about gendered Hindi verb forms.
   - An example line ("Your reasoning has really been improving") that the model repeats as a made-up compliment.
   - No rules for wrong premises, homework dumping, or exam guarantees.
5. **Grade for textbook lessons.** The server pitches doubts at the student's profile class, not the book's class. `ai.controller.js` takes `req.scope.classNum` and ignores the body's `gradeLevel`, and `prepareTurn` only falls back to `lesson.gradeLevel` when no grade is set. (The app's `user?.grade || '8'` fallback is ignored by the server, so it is harmless and not a root cause.)
6. **No measurement.** There is no test set for answer quality.

## Goals

- In-lesson answers use the **current slide (and neighbours)** and, for textbook lessons, the **book passages**.
- When the material does not cover the question, the model answers simply and says so honestly, instead of bluffing.
- "Didn't understand" leads to a different, simpler re-explanation **of the same thing**, still in lesson context.
- A real question is never mistaken for "ok/understood".
- Answers are never cut mid-way. Longer answers (numericals, steps) get room.
- Gender-neutral wording, no invented compliments, wrong premises corrected first, homework guided rather than dumped, no exam guarantees.
- **Replies in English** (owner decision, 2026-11-18): simple English for school students, even when the question is in Hindi or Hinglish. **Exception: language subjects.** In Hindi and Sanskrit lessons the teacher replies in simple Hindi (owner decision 1a).
- **Class level wins over the slide** (owner decision 2a): when a slide is above the student's class, the answer still explains at the class level and simplifies the advanced terms.
- A repeatable **quality eval** (golden questions + rubric judge) with before/after numbers.

## Non-goals

- **No model change.** The AI Teacher keeps `AI_DOUBT_MODEL` / the configured models. No new model env var, no stronger "reasoning" model, no thinking mode (owner: cannot change model now).
- No Citations API, no prompt caching, no calculator/code-execution tool (later candidates).
- No change to lesson *generation* (including the Class 9 lesson carrying Class 11 content). That is noted as a follow-up.
- No DB schema change.
- No change to quiz grading, greetings, stop-lesson, subject-defer behaviour (except where noted below).

## Anti-goals (a failure even if it "works")

- Answers get noticeably slower (target: no more than about 0.5 s added before the first spoken words).
- Answers get long and lecture-like. The short, spoken teacher style stays.
- The student hears something different from what is shown (no new divergence).
- A broken DB read or book load blocks the answer. All new context loading is best-effort.

## Approaches considered

- **A. Ground the existing agent path** *(chosen)*. Load the slides (and book text) inside `prepareTurn`, pass them into `buildTeacherSystemPrompt`, and fix the understanding check, guard and prompt in place. Keeps streaming, board drawing, memory and voice exactly as they are.
- **B. Route live doubts to the old `answerDoubt` path**, which already loads slides and the book. Rejected: it has no streaming, no board, no memory or intent handling, and it persists its own session. The app would lose voice streaming.
- **C. Stronger model for hard questions.** Rejected by the owner for now (cannot change model).

## Design (chosen approach A)

### 1. Lesson grounding: server, `agent.service.prepareTurn`

- With a `lessonId`, load the lesson **with slides** (`lessonService.getLessonWithSlides`). Today it loads only `getLessonById`.
- Build a compact **LESSON CONTEXT** block for the prompt:
  - the lesson title;
  - the **current slide** in full: title, explanation, narration, key points / visual description where text exists;
  - the **previous and next slide**, title and explanation only.
- Total cap about 3,000 characters.
- For a **textbook lesson** (`lesson.bookChapterId`), also load the book passages exactly as `ai.service.answerDoubt` does (`booksService.loadSource`). Keep only the passages most relevant to the question: simple keyword overlap with the question and the current slide title. Cap about 4,000 characters.
- Both loads are **best-effort**. On error, log and continue without them. They run **in parallel** with the existing intent and retrieval calls, not after.
- The textbook lesson's **grade** is the book's class: when the lesson has a `bookChapterId`, use `lesson.gradeLevel` over the profile grade the controller sends.

### 2. Prompt: `teacherResponse.prompt.js`

- New **LESSON CONTEXT** section (from step 1), placed before GROUNDING. The instruction: "This is what is on the student's screen; answer about it."
- **Precedence (owner 2a):** the CLASS DEPTH line wins. If the slide uses terms above the class, explain at the class level and simplify those terms (e.g. "ATP is the cell's energy packet"). Never raise the depth to match the slide.
- The ungrounded rule changes from "answer with confidence from general knowledge" to: answer briefly and correctly from general knowledge. If you are not sure, say so plainly and suggest checking the textbook. Never claim certainty you don't have.
- Add these rules:
  - **Gender-neutral**: never assume the student's gender. Use neutral forms.
  - **No invented memories or compliments**: only reference what is in STUDENT MEMORY. Remove the "Your reasoning has really been improving" example line.
  - **Wrong premise**: if the question contains a false assumption, correct it in the first line, then explain.
  - **Homework / "write it for me"**: give the plan or the first step and ask the student to try the next part. Do not write the whole thing.
  - **No guarantees**: never promise exam questions or results. Say what is commonly asked instead.
  - **Do not say you can or cannot "see" slides**: just use the LESSON CONTEXT.
  - **End with a real check** when it fits: one tiny question about the idea (e.g. "So which gas comes out?") rather than only "Clear?".
- **Length**: the 5-line rule becomes about 5 short lines for explanations, and up to about 8 for worked numericals / step-by-step. Keep "spoken, no markdown, maths in words".
- **Language: English, except language subjects (owner 1a).** The reply language comes from the **lesson's subject**, not from the detected language of the question.
  - If the subject name contains "hindi", "हिंदी", "sanskrit" or "संस्कृत" (case-insensitive), use the simple-Hindi block.
  - Otherwise, or with no lesson, use the English block.
  - The Hinglish block stays in the file, unused, so mirroring can be switched back later.
  - Canned lines (`LINES` in `agent.service.js`) follow the same choice.
  - *(Builder's call: the subject-name match; a missing subject means English.)*

### 3. Understanding check: `agent.service.classifyUnderstanding` / `reExplain`

- Classify as understood or not understood **only for short replies**: at most about 5 words, matched against whole-message patterns ("haan", "ok", "samajh gaya", "nahi samjha", "not clear", "phir se", …).
- Anything longer, or ending in "?", or containing a question word (why/how/what/kyun/kaise/kya) → `other`, so it is handled as a new question.
- `reExplain` receives and passes on `lesson` (with the LESSON CONTEXT), `history` and `gradeLevel`. The strategy rotation stays.

### 4. Never cut an answer: `responseGuard.capLines` + provider

- `capLines` **never drops middle lines**. It only trims whitespace and empty lines. Length is the prompt's job. A safety ceiling of about 12 lines keeps the **first** 12 (never first-plus-last).
- `TEACHER_MAX_TOKENS` 450 → 700, and board 700 → 900, so numericals fit. The model and everything else stay the same.
- In both `generateTeacherResponse` and `streamTeacherResponse`, if `stop_reason === 'max_tokens'`, end the text at the last complete sentence before guarding.

### 5. App: no change

- The `user?.grade || '8'` fallback in `AITeacherScreen.js` is ignored by the server: the controller uses `req.scope.classNum` and returns 422 `PROFILE_INCOMPLETE` without it. So it is left alone.
- Students with no profile class still cannot ask doubts. That is unchanged and out of scope.
- RAG retrieval uses whatever grade `prepareTurn` settles on, i.e. the book's class for textbook lessons *(builder's call)*.

### 6. Quality eval: `server/scripts/eval-doubts.js` + `server/eval/doubts.json`

- About **40 golden cases**: the 14 from the live test plus ones covering misconceptions, numericals (simple and multi-step), balancing, wrong premises, an above-class slide term, Hindi/Hinglish/English input (expect English output, except in the Hindi/Sanskrit lesson), off-topic, homework, exam-guarantee, emotional, "ok", short follow-ups ("why?"), and "didn't understand" with a pending check.
- Each case has a question, a slide index, an optional history/pending, and **what a good answer must and must not do**.
- It runs **only against the local server and local DB, never AWS.** Every `/api/ai/ask` call writes language memory, doubt events and mastery for the asking student, so the eval must never touch a real account.
  - It signs a short-lived token for the **owner of the test lesson** with the local `JWT_SECRET`. That student needs a profile class, or the server returns 422.
  - Lessons used:
    - the 2026-11-18 Photosynthesis lesson (`0326f06e-…`, owner `1566e6d8-…`, Class 9);
    - one **Hindi or Sanskrit** lesson, for the language rule (generate one locally if none exists);
    - one **textbook** lesson, if one exists locally.
  - The script refuses to run when the base URL is not localhost. *(Builder's call: no server-side "eval mode" flag; running locally is the guard.)*
- Expected answers follow the owner's decisions: English everywhere, Hindi only inside the Hindi/Sanskrit lesson (1a); class-level depth with advanced slide terms simplified (2a).
- A **judge** (Claude, using the server's existing `AI_KNOWLEDGE_MODEL` or `AI_DOUBT_MODEL`, so no new model) scores each answer 0–2 on: correct · on-topic/uses lesson · follows the rules (English, neutral, no bluff, length) · teaches well. It writes a JSON + markdown report with totals.
- It is run **before** the changes (baseline) and **after**, and the comparison goes in the handover. The judge model is weaker than ideal (same family as the answerer), so the report also lists every answer for a human skim.

## Constraints

- Server is a single AWS EC2 process; deploy = `git pull` + restart. The app ships via EAS update.
- Streaming voice + board must keep working byte-for-byte except for the prompt content.
- No DB migration.

## Left to the builder

- The exact relevance scoring for book passages (keyword overlap is fine).
- The exact wording of the new prompt rules (must cover the points above).
- Golden-case wording beyond the 14 existing ones.
- Unit tests: the new `classifyUnderstanding` cases, `capLines` never dropping middle lines, the lesson-context builder (caps, missing slides), and the language choice (English for a Science lesson even with a Hindi question; Hindi for a Hindi/Sanskrit lesson).

## Follow-ups (not in this change)

- Lesson generation is above level for the class (Class 9 got ATP/NADPH/Calvin cycle).
- Science (combined subject) deferring "physics/chemistry/biology" mid-lesson.
- Streamed doubts don't update mastery. Raw provider errors are shown to students.
- Re-enable Hindi/Hinglish replies. Consider a stronger model, prompt caching and Citations once the eval exists.
