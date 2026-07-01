# Arena — developer documentation

The **Arena** is BrainGym's 1‑v‑1 battle mode. A player spins the Arena wheel, taps
**START**, is matched with an opponent, races them through a puzzle ("No Attack"),
and gets a win/loss/draw with XP and an Elo rating change.

This document covers the **backend** (`server/src/services/arena`, `controllers`,
`routes`) and how the React‑Native client (`src/screens/braingym`, `src/api/arenaApi.js`)
consumes it.

---

## 1. Architecture

```
ArenaWheel  ──START──►  ArenaBattle (orchestrator)
                          │  GET /arena/active        ← resume an in‑progress match?
                          │  POST /arena/matchmake    ← find opponent + puzzle
                          ▼
                       Finding (radar)  ──►  ArenaGameBoard (play)  ──►  Result
                                                   │  POST /arena/result   (authoritative)
                                                   └  POST /arena/abandon  (quit / cleanup)
```

**Matchmaking is asynchronous, not real‑time PvP.** Two students are almost never
online in the same instant, and the backend is plain request/response (no websockets).
So a player is paired with either:

- a **ghost** — a real other student's recorded solve of the same game, or
- a **bot** — a synthetic opponent calibrated to the player's rating.

Both feel identical to the player and neither requires the other human to be online.
This is the standard model for casual competitive games (chess "puzzle rush", QuizUp).

Persistence is **one row per match** in `arena_matches`, accessed with **raw SQL**
(`db.$queryRawUnsafe`) so no Prisma client regeneration is needed (avoids Windows
EPERM locks). The table also feeds the ghost pool, history, leaderboard and rating.

Code map:

| File | Responsibility |
|------|----------------|
| `services/arena/game.js` | Pure rules: puzzle gen, knight attacks, validation, **score, Elo, XP, anti‑cheat time clamp**. No I/O. |
| `services/arena/opponent.js` | Ghost lookup + calibrated bot generation. |
| `services/arena/arena.service.js` | Orchestration over `arena_matches` (matchmake / active / abandon / result / history / leaderboard). |
| `controllers/arena.controller.js` | HTTP glue, validation result handling, status‑code mapping. |
| `routes/arena.js` | Auth + `express-validator` rules + route table. |
| `src/api/arenaApi.js` (client) | Retry/backoff wrapper + graceful offline fallback. |
| `src/screens/braingym/arenaLogic.js` (client) | Mirror of the rules for live highlighting + a full offline match. |

---

## 2. Matchmaking  (`POST /api/arena/matchmake`)

1. **Retire orphans** — any of the caller's `pending` matches are set to `abandoned`
   first, guaranteeing a single active match per player and zero orphan accumulation.
2. Read the player's **current rating** (the `ratingAfter` of their last finished match,
   default `1000`).
3. **Generate a puzzle** sized to the rating's difficulty tier.
4. **Pick an opponent** (ghost → else bot) and pre‑compute their score.
5. `INSERT` a `pending` row and return the client‑safe payload.

Returned: `{ matchId, game, rating, startedAt, puzzle, opponent }`. The opponent's
**time** is revealed (so the client can animate a live "ghost" race) but their **score
is never sent** — it is computed and compared server‑side only.

---

## 3. The game — "No Attack" (turn-based duel)

A **turn-based duel** on an irregular board (random `blocked` cells). The player and
the opponent **alternate** placing **queens** (a queen attacks along its row, column
and both diagonals — `game.js` is piece-generic: `ATTACKS = { queen, rook, knight }`).
A piece may not be placed where it attacks any piece already down. **The player who
cannot move loses.** The opponent (bot) plays a **random legal square** each turn.

Key functions (`game.js`):

- `generatePuzzle(rating, rng)` → `{ gridN, blocked, piece, target, mode:'duel' }`
  (random blocked cells give every match a fresh shape).
- `legalMoves(puzzle, placed)` → squares the next piece may occupy (drives the
  player's highlights AND the bot's random pick).
- `replayDuel(puzzle, moves)` → replays the ordered move list, validates every move
  was legal and turns alternated, confirms the game truly ended, and returns the
  authoritative `winner` (server anti-cheat — see §6).

Difficulty tiers (by rating): easy `5×5`, medium `5×5`, hard `6×6` (more blocked
cells at higher tiers). `target` is retained for compatibility/display only.

The legacy **solo race** (place N non-attacking pieces fastest, scored vs a ghost
time) still exists in `game.js`/`submitResult` for backward compatibility, but the
shipped game is the duel.

---

## 4. Scoring  (`game.score`)

```
solved   → 100 + round((MAX_TIME_MS - effTime) / MAX_TIME_MS * 100)   // 100..200
unsolved → round(min(count, target) / target * 60)                    // 0..60 (time‑independent)
```

`MAX_TIME_MS = 90000`. A solved board always beats any unsolved board; faster solves
beat slower ones.

---

## 5. Rating  (Elo, `game.elo`)

Standard Elo, `K = 24`:

```
expected    = 1 / (1 + 10^((oppRating - before) / 400))
actual      = win ? 1 : draw ? 0.5 : 0
ratingAfter = round(before + K * (actual - expected))
```

Beating a stronger opponent gains more than beating a weaker one. Rating persists via
each row's `ratingAfter`; "current rating" is the most recent finished row's value.

## XP  (`game.computeXp`)

`win 50 / draw 30 / loss 15`, plus a `+20` **solved bonus** if the player solved the
board. Arena XP is stored on the match row and is **independent** of the BrainGym
quiz‑XP leaderboard (which aggregates `brain_gym_sessions`). Arena ranking uses its own
rating‑based `GET /arena/leaderboard`.

---

## 6. Anti‑cheat (server is authoritative)

The client is never trusted with the outcome:

- **Solution re‑validated** server‑side from the submitted placements (`game.validate`)
  — a client claiming "solved" with an attacking/blocked/incomplete board is scored as
  unsolved.
- **Time is server‑authoritative** (`game.effectiveTime`):
  - *ceiling* = wall‑clock since the row was created (+1.5 s grace) — you cannot claim
    to have played longer than the match has existed.
  - *floor* = `target × 350 ms` — a forged `0 ms` "instant solve" is clamped up, so it
    can never buy a perfect 200.
- **Replay / duplicate submits** — the result write is a conditional
  `UPDATE … WHERE status = 'pending'`. The first writer flips the row; any later submit
  finds it `done` and **idempotently replays the recorded result** (`duplicate: true`),
  so a retried network call can never double‑score or change a score.
- **Ownership** — every query is scoped to `userId` from the JWT; another user's match
  is simply "not found" (404).
- **Payload validation** — `express-validator` rejects non‑UUID match ids, non‑array or
  malformed placements, and out‑of‑range timers before the service runs.

---

## 7. State recovery & cleanup

- **Resume after restart** — `GET /arena/active` returns the caller's `pending` match
  (puzzle, opponent, server‑measured elapsed). The client also keeps local placements in
  `AsyncStorage`; on relaunch it resumes the *same* match so the result still counts.
- **Abandon** — `POST /arena/abandon` sets a pending match to `abandoned` (neutral, no
  rating change). The client calls it when the player quits mid‑battle.
- **No orphans** — matchmake retires prior pending matches; `GET /active` retires any
  pending match older than `MAX_TIME_MS + 60 s`.

---

## 8. Database schema — `arena_matches`

Migration: `server/prisma/sql/arena_matches.sql` (also modelled in `schema.prisma`).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `userId` | uuid | owner (FK to users by convention) |
| `game` | text | `no_attack` |
| `puzzle` | jsonb | `{ gridN, target, blocked, piece, tier, opponentRating }` |
| `status` | text | `pending` \| `done` \| `abandoned` |
| `opponentName / opponentIsBot / opponentSolved / opponentTimeMs / opponentScore` | | the rival |
| `userSolved / userTimeMs / userScore` | | filled on result |
| `result` | text | `win` \| `loss` \| `draw` |
| `xpEarned` | int | |
| `ratingBefore / ratingAfter` | int | Elo |
| `createdAt / completedAt` | timestamptz | |

Indexes: `(userId, createdAt desc)` for history; `(game, status, userSolved)` for the
ghost pool.

---

## 9. API endpoints  (all require a Bearer JWT)

| Method | Path | Body / Query | Returns |
|--------|------|--------------|---------|
| POST | `/api/arena/matchmake` | `{ game? }` | `{ matchId, puzzle, opponent, rating, startedAt }` |
| GET  | `/api/arena/active` | – | `{ active: {…} \| null }` |
| POST | `/api/arena/abandon` | `{ matchId? }` | `{ abandoned }` |
| POST | `/api/arena/result` | duel: `{ matchId, moves:[{r,c,by}], timeMs }` · solo: `{ matchId, placements:[{r,c}], timeMs }` | `{ result, xpEarned, ratingDelta, ratingAfter, … }` |
| GET  | `/api/arena/history` | `?limit` | `{ rating, played, wins, losses, matches }` |
| GET  | `/api/arena/leaderboard` | `?limit` | `{ totalPlayers, me, top }` |

---

## 10. Tests

- `server/tests/arena.test.js` — pure logic (attacks, solvability, scoring, decide,
  XP, Elo, anti‑cheat clamp, bot shape).
- `server/tests/arena.integration.test.js` — live DB (matchmake/auto‑abandon, win,
  draw/loss, idempotent duplicate, abandon→409, ownership→404, anti‑cheat clamp,
  history, leaderboard). Skips without `DATABASE_URL`; cleans up every row it creates.

Run: `node --test tests/arena.test.js tests/arena.integration.test.js`
