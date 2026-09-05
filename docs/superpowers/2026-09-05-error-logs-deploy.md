# Error logs — what has to happen before this works

**5 September 2026.** Closes bug list item 15 ("errors swallowed silently").

## The one blocking step

```bash
cd server && npm run logs:setup
```

Idempotent — safe to re-run — and it verifies the table exists afterwards rather than
trusting that `CREATE TABLE IF NOT EXISTS` did anything. It reads `DATABASE_URL` from
`server/.env`, so it applies to whichever database that points at.

Equivalents, if you would rather not run the script: `psql "$DATABASE_URL" -f
server/prisma/sql/error_logs.sql`, or paste that file into the Supabase SQL editor.

**Why by hand at all:** this project does not use `prisma migrate`. The Render build
command is `npm ci && npx prisma generate`, which regenerates the client and never
touches the schema — so every file in `prisma/sql/` is applied manually, once. That is
the existing convention (`admin_portal.sql`, `support_tickets.sql`, and the rest all
work this way), not something new here.

**Nothing warns you if you skip it.** Every write in this feature is best-effort by
design — a logger that can throw is worse than the `catch {}` it replaced — so a
missing table means logging silently does nothing, which is the exact failure this
feature exists to remove. The one guard against that: the admin screen detects the
missing table and shows a red "Logging is not switched on" banner instead of an empty
list. If you see that banner, the SQL has not been run.

`prisma generate` is **not** needed. The service uses `$queryRawUnsafe` /
`$executeRawUnsafe` throughout; the model added to `schema.prisma` is documentation and
keeps the schema honest. (The locally generated client is stale anyway — see the
pre-existing `accessLevel` failure in `tests/auth.permissions.test.js`.)

## The size budget — read this before raising anything

The database sits at **~482 MB of the free tier's 500 MB**. That ~17.6 MB of headroom
is already spoken for by the pending content imports (bug list items 7, 8, 12, 13).

So `error_logs` is capped by **row count**, not just by age:

| Knob | Value | Where |
|---|---|---|
| `MAX_ROWS` | 5,000 | `server/src/services/errorLog.service.js` |
| `RETENTION_DAYS` | 14 | same file |
| Ceiling | ~2.5 MB | 5,000 rows × ~500 B |

Trimming is amortised into the insert path (every 200th insert, at most once per
10 minutes) rather than run from a cron — the Render free instance sleeps, so a cron
would not fire reliably.

**Raise `MAX_ROWS` to 20,000 only after the Supabase plan is upgraded.** It is the one
number to change; the SQL file needs no edit.

## Permissions

Two new grants, `logs.view` and `logs.manage`, held by `super_admin` and `admin` only.
Deliberately withheld from `support` and `content_manager`: an audit entry says which
admin changed what, which support staff legitimately need, while an error log is a
stack trace naming internal files and routes, which they do not.

Existing admins pick these up automatically — the grants come from the role map in
`services/admin/permissions.js`, not from a per-user column, so there is no backfill.

## What ships where

| Piece | Reaches users when |
|---|---|
| `error_logs` table | the SQL above is run |
| Server 5xx capture, `POST /api/logs/client`, admin read endpoints | the next Render deploy |
| App-side `reportError`, the 23 rewritten catch blocks, the admin Error Logs screen | the next AAB (bug list item 1) |

The app half is invisible until a build ships. Until then the screen will show only
server-side 5xx entries.

## Known gaps

- **7 empty catches remain**, all inside HTML strings injected into WebViews
  (`avatarViewerHtml.js`, `MathHtmlPreview.js`, `pyqDocument.js`, `ResourcesScreen.js`,
  `Ncert2Screen.js`). They run in the WebView's JS context where `reportError` does not
  exist; reaching it needs a `postMessage` bridge, and in `avatarViewerHtml.js:63` the
  catch is *around* that very bridge. They now carry a comment saying so.
- **58 `.catch(() => {})` call sites** across app and server are the same anti-pattern in
  promise form and were not in this pass's scope.
- Nothing here has been run on a device. The screen, the ingest endpoint and the flush
  path need one pass on real hardware.
