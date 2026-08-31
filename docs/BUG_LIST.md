# Ailernova — bug list

**Compiled 31 August 2026**

| | |
|---|---|
| Deployed app | `fed845f` — **version code 6**, 21 Aug |
| Current `main` | `d541318` — 31 Aug |
| Gap | **43 commits** |
| Deployed backend | `30fa1f5` — current (reported by `/api/health`) |

Both versions are confirmed, not inferred: the Play testing link ends in `/6`, and
the backend reports its own commit. Fix status was checked with `git merge-base`,
not by reading commit messages.

---

## Live in the deployed app · already fixed in `main`

One upload of build 9 clears every row in this table.

| # | Bug | What the user sees | Severity | Fixed in |
|---|---|---|---|---|
| 1 | Teacher photos are wrong | 9 of 10 faculty cards show one colleague's face above another's name, qualification and experience | Critical | `0eed8d4`, `1bf4a94` |
| 2 | Blank faculty cards | 3 cards show a photo with no name, subject or bio — Dr. Pooja Pandey, Jayapriya K, Yogita Solanki | Critical | `0eed8d4` |
| 3 | Cuemath trademark on screen | "MathFit™ Summer Adventure '26" on the Events card | Critical | `454e280` |
| 4 | Consent to non-existent Terms | Sign-up blocks until you agree to "Terms & Privacy Policy"; no terms document exists and neither link opened | Critical | `c1964cb`, `d635fb8` |
| 5 | Privacy row denies the feature | Profile → Privacy & Security answers "this isn't part of the app yet" | Critical | `fffc6f1` |
| 6 | Faculty photos cut at the head | Portrait photos in a landscape box; 46–106px removed from the top | High | `cd5faa5`, `44f3506` |
| 7 | Brain Gym opens the website | Parent Resources row goes to ailernova.in instead of the in-app gym | High | `aa526f6`, `2053f1d` |
| 8 | Whiteboard content clipped | Later points of a scene unreachable — card clips, no scroll | High | `94d3d4c` |
| 9 | Cold start parses everything | 72.8 MB across 476 modules before the first frame; 82% question-bank JSON | High | `62c3449` |
| 10 | Login looks broken on cold backend | API timeout shorter than the ~50s server wake-up | High | `e482a2c` |
| 11 | Arena label disappears | Selecting Logic Puzzle or Matchsticks renders its name near-black on a dark segment | Medium | `7b8f73c` |
| 12 | Chapters offered with no content | Sections listed chapters that never had them, then said "coming soon" inside | High | `d541318` |
| 13 | Parents grid, globe, timeline | Uneven tiles, colliding labels, photo cropped through the subject | Medium | `ef7eb59`, `bbe10e3`, `94e2345` |

---

## Open — not fixed anywhere

Uploading a build does not help. These are unwritten, not unshipped.

| # | Bug | Impact | Estimate |
|---|---|---|---|
| 14 | **No in-app account deletion** | Google Play requires it for any app allowing account creation, and asks for the URL at submission. The privacy policy promises deletion in 30 days, so the app states something it cannot do. **Blocks approval.** | 4–6 h |
| 15 | Missing section content | Only 133 of 1,582 chapters have revision notes, 285 have PYQ, 221 have practice. #12 stops the app *promising* them; the content itself is still absent | 1–2 days (import) |
| 16 | Support chat implies a person | Code states it is "a scripted auto-responder, NOT a person". The "avg 4 min" reply time is taken from the design, not measured | 15 min (copy) or 1 wk (real backend) |

---

## Dead code — looks like a feature, is not reachable

| File | State |
|---|---|
| `src/screens/mockTestScreen.js` | Never imported. Its own comment: "Wire that in onStartMock when ready" |
| `src/components/teacher/StreamingAnswerCard.js` | Never imported. Would throw `TypeError` if used — `onActionSelect` has no default |
| `src/screens/ChapterListScreen.js` | Imported by PracticeScreen but never rendered; `onSelectChapter` defaults to a no-op |
| `src/data` — 52 of 56 folders | Never imported. ~200 MB of repo weight, not shipped in the app |

---

## Verified clean

A scope-aware pass over 312 source files.

| Check | Result |
|---|---|
| Undeclared identifiers (`ReferenceError`) | none |
| Missing stylesheet keys | none — 13 first-pass hits were all shadowed variables |
| Undefined palette colours | none |
| Unparseable files | none |

---

## Also worth fixing

| Item | Detail |
|---|---|
| Hardcoded chapter registry | `ResourcesScreen.js` carries 107 chapter names in a `SUBJECTS` literal. **All 107 are already in the database** — the hardcode is legacy from before it was populated, and is now a second source of truth that can drift |
| 50 empty `catch {}` blocks | Errors swallowed silently — this is why #12 took so long to trace |
| 15 `console.log` calls | Left in shipping code |
| 136 TODO/FIXME markers | Several describe known-wrong behaviour rather than future work |

---

## Order of work

| Step | Action | Time | Clears |
|---|---|---|---|
| 1 | Upload build 9 to Play internal testing | ~10 min | rows 1–13 |
| 2 | Reword support chat, drop "avg 4 min" | ~15 min | 16 |
| 3 | Build in-app account deletion | 4–6 h | 14 — unblocks Play |
| 4 | Import the missing sections | 1–2 days | 15 |
