# Ailernova — How the AI Teacher Works

**25 September 2026** · `server/src/services/agent.service.js`

The AI teacher is a **stateful tutoring agent**, not a chat wrapper around an LLM.
Each turn it decides what kind of message it received, whether the syllabus covers
it, who is asking, and what to do next — and it writes back what it learned so the
next turn starts better informed.

Diagrams are Mermaid, so they render on GitHub.

---

## Contents

1. [The whole turn, end to end](#1-the-whole-turn-end-to-end)
2. [Stage 1 — Is this a reply to something?](#2-stage-1--is-this-a-reply-to-something)
3. [Stage 2 — Understand and retrieve, in parallel](#3-stage-2--understand-and-retrieve-in-parallel)
4. [Stage 3 — The cheap exits](#4-stage-3--the-cheap-exits)
5. [Stage 4 — Build the student's context](#5-stage-4--build-the-students-context)
6. [Stage 5 — Generate, guard, and close the loop](#6-stage-5--generate-guard-and-close-the-loop)
7. [The re-explanation ladder](#7-the-re-explanation-ladder)
8. [Why it is built this way](#8-why-it-is-built-this-way)

---

## 1. The whole turn, end to end

```mermaid
flowchart TD
    IN["📱 Student sends a message"]

    P{"Waiting on<br/>something?"}
    PQ["Grade the quiz answer"]
    PU["Understood? → continue<br/>Not understood? → re-explain"]
    PD["'ok' → teach the<br/>topic we parked"]

    PREP["<b>prepareTurn</b><br/>classify intent + search the syllabus<br/><i>both at the same time</i>"]

    G{"intent?"}
    GREET["Warm greeting"]
    STOP["End the lesson"]
    OFF["Redirect to the topic"]
    DEFER["Park it — finish<br/>this topic first"]

    CTX["<b>Build student context</b><br/>mastery · weak chapters · past mistakes<br/>preferred language · lesson position"]
    GEN["<b>Generate</b> — streamed to the app"]
    GUARD["<b>applyGuard</b><br/>strip filler and TTS-unfriendly markup"]
    ASK["End with 'Clear?'<br/><i>sets pending = understanding</i>"]
    WRITE[("Write back<br/>mastery · engagement · language · mistakes")]
    OUT["📱 Reply appears"]

    IN --> P
    P -- "quiz" --> PQ --> WRITE
    P -- "understanding" --> PU
    P -- "deferred topic" --> PD --> PREP
    P -- "nothing / something else" --> PREP

    PREP --> G
    G -- "greeting" --> GREET --> OUT
    G -- "stop" --> STOP --> OUT
    G -- "off-topic" --> OFF --> OUT
    G -- "other subject,<br/>mid-lesson" --> DEFER --> OUT
    G -- "doubt · concept ·<br/>formula · example" --> CTX

    CTX --> GEN --> GUARD --> ASK --> WRITE --> OUT
    PU --> GEN
```

The four cheap exits on the right matter: a greeting, a goodbye, an off-topic
message and a subject switch are all answered **before** any retrieval, any student
lookup, and any LLM call.

---

## 2. Stage 1 — Is this a reply to something?

The agent carries a `pending` object between turns. Before doing any work it asks
what it was waiting for — this is what makes it an agent rather than a chatbot.

```mermaid
flowchart LR
    M["Student message"] --> K{"pending.kind"}
    K -- "quiz" --> A["handleQuizAnswer<br/><i>grade it, update mastery</i>"]
    K -- "understanding" --> B{"Did they<br/>understand?"}
    K -- "deferred_topic" --> C{"Did they say<br/>'ok / yes / haan'?"}
    K -- "none" --> N["Treat as a new question"]

    B -- "yes" --> B1["Move on"]
    B -- "no" --> B2["Re-explain, one level down"]
    B -- "something else" --> N

    C -- "yes" --> C1["Teach the parked topic"]
    C -- "no" --> N
```

> **The escape hatch.** In every branch, "something else" falls through to a normal
> new question. A student who changes the subject is never trapped in a loop waiting
> to answer a quiz they have lost interest in.

---

## 3. Stage 2 — Understand and retrieve, in parallel

```mermaid
flowchart TD
    Q["The question"] --> SPLIT(( ))

    SPLIT --> I{"quickIntent<br/>rules match?"}
    I -- "yes — free, instant" --> IR["intent, via: 'rules'"]
    I -- "no" --> IL["Ask Claude to classify<br/><i>via: 'llm'</i>"] --> IR

    SPLIT --> R["Vector search over<br/>knowledge_chunks (pgvector)<br/>scoped to subject + grade"]
    R --> S{"top similarity<br/>≥ 0.4?"}
    S -- "yes" --> GR["grounded — teach from the syllabus"]
    S -- "no" --> NG["not grounded — answer from<br/>general knowledge, and say so"]

    IR --> JOIN(( ))
    GR --> JOIN
    NG --> JOIN
    JOIN --> NEXT["Continue the turn"]
```

Two deliberate choices live here:

- **Rules before the LLM.** `quickIntent()` catches greetings, thanks, stop and the
  obvious cases for free. Only genuinely ambiguous messages cost a classification call.
- **A grounding floor of 0.4**, raised from the config default of 0.2. Below it the
  agent admits the curriculum does not cover the question rather than dressing a weak
  match up as the textbook.

---

## 4. Stage 3 — The cheap exits

Checked in this order, each returning before any expensive work:

| # | Condition | Reply |
|---|---|---|
| 1 | `intent = greeting` | A warm line in the student's language |
| 2 | `intent = stop_lesson` | Ends the lesson, carries `action: 'end_lesson'` so the player closes |
| 3 | A **different subject** named mid-lesson | Parks the request, promises to return to it, sets `pending = deferred_topic` |
| 4 | `intent = off_topic` | Redirects to the lesson |

Every one of these is answered from canned lines in English, Hindi or Hinglish — no
retrieval, no LLM, no cost.

> The stop reply is the one early return that deliberately carries **no** resume cue.
> Every other exit offers "let's continue"; the one thing a goodbye must not say is
> "let's continue".

---

## 5. Stage 4 — Build the student's context

Only the teaching intents reach this stage. Several independent reads are overlapped.

```mermaid
flowchart LR
    subgraph gather["What the agent knows about this student"]
        M1["mastery.service<br/><i>per-concept scores,<br/>what needs revision</i>"]
        M2["memory.service<br/><i>weak and strong chapters,<br/>streak, recent activity</i>"]
        M3["mistakeBook<br/><i>questions they got<br/>wrong before</i>"]
        M4["preferred language<br/><i>en · hi · hinglish</i>"]
        M5["lesson + slide position"]
    end

    gather --> PROMPT["<b>The prompt</b><br/>not 'explain capacitance'<br/>but 'explain capacitance <i>to this student</i>'"]
    RET["Retrieved chapter text"] --> PROMPT
```

This is the difference between an LLM answering a question and a tutor teaching a
person. The retrieved syllabus text says *what* is true; the student context decides
*how* it should be said.

---

## 6. Stage 5 — Generate, guard, and close the loop

```mermaid
flowchart TD
    P["Prompt"] --> C["Claude — streamed"]
    C -- "tokens as they are written (SSE)" --> APP["📱 Text appears live"]
    C --> G["<b>applyGuard</b> — deterministic, no second LLM call"]
    G --> G1["strip AI filler and AI tone"]
    G --> G2["strip **, #, bullets<br/><i>TTS would read them aloud</i>"]
    G --> G3["cap length"]
    G --> G4["flag a language mismatch"]
    G1 & G2 & G3 & G4 --> CHK{"Teaching intent?"}
    CHK -- "yes" --> ASK["Append 'Clear?'<br/>pending = understanding"]
    CHK -- "no" --> DONE["Send"]
    ASK --> DONE
    DONE --> W[("mastery · engagement ·<br/>language · mistakes")]
```

`applyGuard` is deliberately **not** an LLM pass. It is a set of deterministic rules,
so cleanup costs nothing and cannot itself hallucinate.

---

## 7. The re-explanation ladder

When a student says they did not understand, the agent does not repeat itself. It
moves one step down a fixed ladder:

```mermaid
flowchart LR
    S1["1 · simpler"] -- "still not clear" --> S2["2 · analogy"]
    S2 -- "still not clear" --> S3["3 · example"]
    S3 -- "still not clear" --> S4["4 · step_by_step"]
    S4 -- "still not clear" --> GU["Offer to move on<br/>and come back to it"]
```

```js
STRATEGY_ORDER = ['simpler', 'analogy', 'example', 'step_by_step']
```

Four genuinely different attempts, each a different teaching strategy rather than the
same explanation restated.

---

## 8. Why it is built this way

| Decision | Reason |
|---|---|
| **Rules before the LLM** for intent | Most turns are greetings, confirmations or obvious questions. Paying for a classification call on "ok" is waste |
| **Grounding floor at 0.4**, not the default 0.2 | A weak match presented as curriculum is worse than an honest general answer |
| **Cheap exits before retrieval** | A goodbye should not trigger a vector search and four student lookups |
| **Deterministic guard, not a second LLM** | Cleanup is rules-shaped. A second model call would add cost, latency and a new way to be wrong |
| **Pending state with an escape hatch** | Continuity matters, but a student who changes their mind must never be stuck |
| **Write back every turn** | The agent's job is to get better at teaching *this* student, which requires remembering |

### In one sentence, for an interview

> It is a stateful tutoring agent: each turn it checks whether the message continues a
> pending quiz or understanding check, classifies intent with rules before paying for
> an LLM, retrieves from the curriculum with a similarity floor so it can admit when
> something is not covered, builds the prompt from that student's mastery and mistake
> history, streams the answer, runs a deterministic cleanup, closes the loop by
> checking understanding — escalating through four re-explanation strategies — and
> writes back what it learned.
