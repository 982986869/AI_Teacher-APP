# Ailernova — bug list as a task plan

**31 August 2026** · deployed `fed845f` (version code 6) · `main` `0c42958` · gap 44 commits

Hours are developer time. Rows marked **⚠ >3h** need scheduling rather than
squeezing into a gap between other work.

---

## All tasks

| # | Task | Bug it fixes | Priority | Hours | ⚠ >3h |
|---|---|---|---|---|---|
| 1 | **Upload build 9 to Play internal testing** | 13 bugs at once — teacher photos, blank cards, trademark, consent links, head crop, Brain Gym link, whiteboard clipping, cold start, API timeout, Arena label, chapter lists, parents grid, globe | **P0** | 0.2 | |
| 2 | Reword support chat; drop the "avg 4 min" claim | Chat implies a person is replying; reply time is invented | **P0** | 0.25 | |
| 3 | Fill in Grievance Officer name in the privacy policy | Required under Indian law; currently a `[NAME]` placeholder | **P0** | 0.1 | |
| 4 | **Build in-app account deletion** | Blocks Play approval. Policy promises 30-day deletion the app cannot perform | **P0** | **5** | ⚠ |
| 5 | **Import missing section content** | Only 133/1,582 chapters have revision notes, 285 PYQ, 221 practice | **P1** | **12** | ⚠ |
| 6 | Delete the hardcoded chapter registry | 107 chapter names in `ResourcesScreen.js`, all already in the DB — a second source of truth that caused task 1's chapter-list bug | **P1** | 2 | |
| 7 | Move bundled question banks to the API | 54.8 MB parsed at every cold start; biology 100% and physics 95% already in the DB | **P1** | **8** | ⚠ |
| 8 | Publish a Terms of Use page | No terms document exists; sign-up no longer claims one | **P1** | 3 | |
| 9 | Delete dead code | 52 unused `src/data` folders (~200 MB), 3 unreachable components | **P2** | 1 | |
| 10 | Replace 50 empty `catch {}` blocks with logging | Errors swallowed silently — why the chapter-list bug took so long to trace | **P2** | 2 | |
| 11 | Remove 15 `console.log` calls | Left in shipping code | **P2** | 0.5 | |
| 12 | Confirm AI providers' no-training terms; file the DPAs | Privacy policy and Data Safety form both assert this | **P2** | 1 | |
| 13 | Set up `eas submit` with a Play service account | Every release so far uploaded by hand; the cause of the 44-commit gap | **P2** | 1 | |
| 14 | Age gate + verifiable parental consent | DPDP Act requires it for under-18s; most users are children | **P2** | **10** | ⚠ |
| 15 | Real support-agent backend | Only needed if the chat should reach a person; task 2 makes it honest without this | **P3** | **40** | ⚠ |

---

## The five over 3 hours

| # | Task | Hours | Why it is not shorter |
|---|---|---|---|
| 4 | In-app account deletion | **5** | 42 tables reference a user. 20 relations already cascade, but **12 do not** and need either a migration or explicit cleanup. Plus a confirmation flow, a server endpoint, and the web deletion URL Play asks for |
| 5 | Import missing sections | **12** | Not code — content. 1,449 chapters lack revision notes, 1,297 lack PYQ. Needs a source, a mapping to `sections.type_key`, and an importer. Estimate is wide because the source material has not been located |
| 7 | Question banks → API | **8** | Migration plus changes to `OnlineTestsScreen`, `PracticeScreen`, `ChapterListScreen`. Complicated by maths: only **29%** of `maths_questions` is in the DB, so it must be imported first or that subject breaks |
| 14 | Parental consent | **10** | A product change, not a setting: age capture, a parent contact step, verification, and a record of consent. Needs legal input on what counts as verifiable |
| 15 | Support backend | **40** | Agent console, ticket routing, presence, notifications. Genuine feature work |

---

## Suggested sequence

| Session | Tasks | Hours | Result |
|---|---|---|---|
| Today, 35 min | 1, 2, 3 | 0.55 | 13 bugs cleared for users; two false claims removed |
| Next | 4 | 5 | Play approval unblocked |
| Then | 6, 9, 11, 13 | 4.5 | Duplicate source of truth gone; releases automated |
| Then | 7, 10 | 10 | Cold start fixed; errors stop being silent |
| Scheduled | 5, 8, 12, 14 | 26 | Content, legal and compliance |
| Optional | 15 | 40 | Only if support must reach a person |

**Total excluding task 15: 46 hours.** The first 35 minutes carry most of the
user-visible value, because the work is already done and only the upload is
missing.

---

## Estimate confidence

| | |
|---|---|
| Firm | 1, 2, 3, 6, 9, 10, 11, 13 — scope is fully known |
| Reasonable | 4, 7, 12 — scope known, some discovery expected |
| Wide | 5 — depends on source material not yet located |
| Rough | 14, 15 — need product and legal decisions before they can be estimated properly |
