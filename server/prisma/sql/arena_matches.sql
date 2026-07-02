-- Arena battles — one row per asynchronous match (player vs bot/ghost).
-- Powers matchmaking ghosts, result history, leaderboard and Elo rating.
-- Idempotent/additive.
--   npx prisma db execute --file prisma/sql/arena_matches.sql --schema prisma/schema.prisma

CREATE TABLE IF NOT EXISTS "arena_matches" (
  "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId"         UUID NOT NULL,
  "game"           TEXT NOT NULL DEFAULT 'no_attack',
  "puzzle"         JSONB NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'pending',   -- pending | done | abandoned
  "opponentName"   TEXT NOT NULL,
  "opponentIsBot"  BOOLEAN NOT NULL DEFAULT true,
  "opponentSolved" BOOLEAN NOT NULL DEFAULT false,
  "opponentTimeMs" INTEGER NOT NULL DEFAULT 0,
  "opponentScore"  INTEGER NOT NULL DEFAULT 0,
  "userSolved"     BOOLEAN NOT NULL DEFAULT false,
  "userTimeMs"     INTEGER NOT NULL DEFAULT 0,
  "userScore"      INTEGER NOT NULL DEFAULT 0,
  "result"         TEXT,                              -- win | loss | draw
  "xpEarned"       INTEGER NOT NULL DEFAULT 0,
  "ratingBefore"   INTEGER NOT NULL DEFAULT 1000,
  "ratingAfter"    INTEGER NOT NULL DEFAULT 1000,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "completedAt"    TIMESTAMPTZ,
  PRIMARY KEY ("id")
);

-- recent battles for a player
CREATE INDEX IF NOT EXISTS "arena_user_idx"  ON "arena_matches" ("userId", "createdAt" DESC);
-- ghost pool: another player's finished, solved match for the same game
CREATE INDEX IF NOT EXISTS "arena_ghost_idx" ON "arena_matches" ("game", "status", "userSolved");
