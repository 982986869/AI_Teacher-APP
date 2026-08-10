-- Support tickets — an issue raised from the in-app support chat, routed to a team so a
-- member of that team picks it up and calls the user back. WhatsApp/email stay as the
-- alternative contact routes, not the delivery mechanism.
-- Idempotent/additive; safe to re-run.
--   npx prisma db execute --file prisma/sql/support_tickets.sql --schema prisma/schema.prisma

-- Human-facing reference (#AL-2291). A sequence, deliberately: the app used to mint refs
-- on the device, which can collide across phones and means the number the user reads out
-- exists nowhere. One server-side counter fixes both.
CREATE SEQUENCE IF NOT EXISTS "support_ticket_ref_seq" START WITH 1000 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
  "ref"               TEXT NOT NULL,                        -- 'AL-2291'
  "userId"            UUID NOT NULL,
  "role"              TEXT NOT NULL,                        -- student | parent
  "topicId"           TEXT NOT NULL,                        -- billing | tutor | class | …
  "topicLabel"        TEXT NOT NULL DEFAULT '',
  "team"              TEXT NOT NULL,                        -- 'Accounts team', 'Tutor operations', …
  "status"            TEXT NOT NULL DEFAULT 'open',         -- open | assigned | resolved
  "phone"             TEXT,                                 -- callback number, as given at raise time
  "childName"         TEXT,                                 -- parent tickets: whose learning it concerns
  "assignedToId"      UUID,
  "assignedToName"    TEXT,
  "assignedAt"        TIMESTAMPTZ,
  "resolutionSummary" TEXT,
  "resolvedByName"    TEXT,
  "resolvedAt"        TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "support_tickets_ref_uq"    ON "support_tickets" ("ref");
CREATE INDEX        IF NOT EXISTS "support_tickets_user_idx"  ON "support_tickets" ("userId", "createdAt" DESC);
-- The queue view: open tickets for one team, oldest first.
CREATE INDEX        IF NOT EXISTS "support_tickets_queue_idx" ON "support_tickets" ("team", "status", "createdAt");

CREATE TABLE IF NOT EXISTS "support_messages" (
  "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticketId"   UUID NOT NULL,
  "authorId"   UUID,                                        -- null for system events
  "authorRole" TEXT NOT NULL DEFAULT 'user',                -- user | agent | system
  "text"       TEXT NOT NULL DEFAULT '',
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "support_messages_ticket_idx" ON "support_messages" ("ticketId", "createdAt");

CREATE TABLE IF NOT EXISTS "support_attachments" (
  "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticketId"  UUID NOT NULL,
  "name"      TEXT NOT NULL DEFAULT 'attachment',
  "url"       TEXT NOT NULL,
  "mimeType"  TEXT,
  "sizeBytes" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "support_attachments_ticket_idx" ON "support_attachments" ("ticketId", "createdAt");

-- Who is on a team. Ticket assignment picks the active member of the ticket's team with
-- the fewest open tickets. Starts EMPTY on purpose: with no rows, tickets are created
-- unassigned and the app says "team ka member aapse contact karega" instead of naming
-- someone who does not exist. Add real people and the app starts naming them.
--   INSERT INTO "support_agents" ("team", "userId", "name")
--   VALUES ('Accounts team', '<admin-user-uuid>', 'Rhea S.');
CREATE TABLE IF NOT EXISTS "support_agents" (
  "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
  "team"      TEXT NOT NULL,
  "userId"    UUID NOT NULL,
  "name"      TEXT NOT NULL,
  "active"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "support_agents_uq"      ON "support_agents" ("team", "userId");
CREATE INDEX        IF NOT EXISTS "support_agents_team_idx" ON "support_agents" ("team", "active");
