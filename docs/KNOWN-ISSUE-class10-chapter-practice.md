# Known issue: Class 10 Chapter practice has no questions

Status: **fixed locally 2026-10-29, not yet on AWS.** Found 2026-10-28.

## Resolution (2026-10-29)

The owner chose to collect the answers by submitting each question once on the
examin8 account (batch 21885). `scripts/seedClass10McqPractice.js` fetched 9,100
practice MCQs across 15 subjects, every one with an answer, and seeded them into
`subtopics` + `mcq_questions` (class_level 10) on the local `ailernova_aws` copy.
Subjects the account is not subscribed to (Hindi A/B, IT, AI, Computer
Applications, NTSE, Reasoning, the Hindi-medium ones) only gave their 10 free
questions per chapter.

Class 10 online tests were seeded the same day by `scripts/seedBiologyOnlineTests.js`
(`CLASS=10 … --seed --live --drop-deleted`): 246 tests, 3,735 questions, chapters
examin8 marks "(Deleted)" left out. Fresh testpapers only expose answers after one
submit, so the script submits each once.

To put both on AWS: point `server/.env` `DATABASE_URL` at the AWS database and run the
two `--seed --live` commands from the saved checkpoints in `src/data/class10Practice/`
and `src/data/class10OnlineTests/`. No examin8 login is needed for that step.

The rest of this note is the original analysis.

## What the student sees

Practice tab → Class 10 → Chapter practice shows "No practice subjects yet."

Before 2026-10-28 it listed Physics, Chemistry, Mathematics and Biology with Class 11
chapter names, and every subject ended in "No chapters available yet." That list was a
hardcoded fallback, not Class 10 content. It was replaced with the DB-driven subject list
in `src/screens/Class11PracticeTests.js` (`DYNAMIC_CLASSES` now includes 10), which is
empty for Class 10, so the screen says so honestly.

## Why there is nothing to show

Chapter practice is a graded MCQ test. It reads `subtopics` + `mcq_questions` and needs a
correct answer for every question. Class 10 has no rows there.

Class 10 does have practice MCQs, but only in the Resources store
(`sections.type_key = 'practice'` → `questions`), and none of them have answers:

| Class | Practice MCQs in `questions` | With `correct_option` | Rows in `mcq_questions` |
|---|---|---|---|
| 7 | 18,869 | 18,869 | 18,884 |
| 8 | 17,224 | 17,224 | 17,230 |
| 9 | 17,199 | 17,066 | 17,208 |
| **10** | **16,251** | **0** | **0** |
| 12 | 19,407 | 12,503 | 19,451 |

Counts from a dump of the AWS database taken 2026-10-28. No solutions either
(`solution_html` empty for all 16,251).

Classes 6–9 were loaded by `scripts/seedClass*McqPractice.js`. There is no Class 10
equivalent.

## Why the answers were never fetched

examin8 only reveals a practice question's answer after the question is submitted
(`POST /v1/practice/attempted/`). Each submission is recorded on the examin8 account, and
Class 10 would need about 16,000 of them. `scripts/examin8/README.md`, Phase 2F, records
the decision not to harvest answers that way and to import Class 10 practice answer-less,
shown read-only in Resources with scoring disabled.

The Class 7/8/9 seeders predate that decision and did use the submit route.

## What would fix it

1. Get a fresh examin8 login (cookies `mcsrftoken`, `msessionid` and the CSRF token; the
   session rotates within minutes).
2. Check whether a read-only endpoint returns practice answers, the way
   `GET /v1/quiz/testpaper/attempt/:id/` does for online tests
   (see `scripts/seedBiologyOnlineTests.js`). Nobody has checked this yet.
3. If one exists, write `scripts/seedClass10McqPractice.js` modelled on
   `scripts/seedClass9McqPractice.js`, but reading answers from that endpoint instead of
   submitting. Class 10 examin8 subject ids: Maths 1202, Science 1176, Social Science 1896,
   English 1903, IT 7595, AI 21489, Computer Applications 1909, NTSE 1836.
4. If no read-only route exists, the team has to decide whether to revisit Phase 2F.
   Do not invent answers.

Once `mcq_questions` has Class 10 rows, `GET /api/resources/class-subjects?class=10` will
mark those subjects `practice: true` and they will appear in Chapter practice with no
further app change. One caveat: `usesApiChapters` in `Class11PracticeTests.js` does not
include Class 10, so its chapter names would still come from the static `MCQ_DATA` bank.
Add 10 there when the content lands.

## Related

The same 16,251 answer-less questions are what Resources → Class 10 → Practice Questions
shows. That screen is meant to be read-only, so it is not broken by this, but students
cannot check their answers there either.
