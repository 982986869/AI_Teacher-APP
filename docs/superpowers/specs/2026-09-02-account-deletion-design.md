# In-app account deletion — design

**Date:** 2026-09-02
**Status:** approved, not implemented
**Closes:** bug list row 1 / `docs/PLAY_STORE_READINESS.md` blocker 1 — "No in-app account deletion"

## Why

Google Play requires any app that lets a user create an account to offer deletion
from inside the app. No such flow exists anywhere in `src/` today. The only related
feature is admin-side deactivation (`PATCH /api/admin/users/:id/status`), which is
staff-initiated and reversible — a different thing.

## What "delete" means here

Two distinct operations, not one lifecycle. These definitions come from the product
owner and everything below follows from them:

- **Soft delete** — the row and its data stay in the database. The user is logged
  out and cannot log in again. To return they create a *new* account from scratch.
  Triggered by the student, from Profile.
- **Hard delete** — the account and its dependent data are removed for good, after
  an anonymous statistics row is written. Triggered by staff, from the admin
  console. There is no timer.

### Decisions recorded

| Question | Decision |
|---|---|
| What happens on the button | Soft delete only |
| Can the user log back in | No. They must create a new account |
| Email/phone after soft delete | Released, so the same address can register again |
| What survives a hard delete | An anonymous stats row — no name, email, phone, or user id |
| Who triggers hard delete | Staff, from the admin console. No scheduled job |
| Popup | Two-step confirmation |

`PRIVACY_POLICY.md` §6 says personal data is removed within 30 days of deletion.
With hard delete staff-triggered and untimed, that sentence is not automatically
satisfied. This was raised and the product owner chose to proceed; it is recorded
here so a later reader knows it was a decision and not an oversight.

## Data model

### `users` — two new columns

```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS users_is_deleted ON "users" (is_deleted) WHERE is_deleted;
```

`is_deleted` is the requested 0/1 flag; `boolean` is how Postgres spells that. Named
to match the `is_active` column beside it.

`deleted_at` is not optional extra. Hard delete is a manual action, so the admin
console has to show how long each account has been waiting and sort by it. A 0/1
flag cannot answer "when".

These are separate from `is_active` / `deactivated_at`, which stay exactly as they
are: staff suspension, reversible, audit-logged. A user can be suspended without
being deleted and the two must not be conflated.

### Releasing the unique slots

`users.email` and `users.phone` are both `@unique`. A soft-deleted row keeps holding
them, so the same person could not register again — which the chosen behaviour
requires. On soft delete both are rewritten in place:

```
email  'asha@example.com'  ->  'deleted+<uuid>+asha@example.com'
phone  '9876543210'        ->  'del:<uuid>:9876543210'
```

The original stays readable inside the archived value, so support can still answer
"which account did this address belong to" without a second column. `<uuid>` is the
user's own id, which guarantees uniqueness even if the same address is deleted twice.

### `deleted_user_stats` — what survives a hard delete

```sql
CREATE TABLE IF NOT EXISTS "deleted_user_stats" (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signed_up_at      timestamptz NOT NULL,
  deleted_at        timestamptz NOT NULL,
  purged_at         timestamptz NOT NULL DEFAULT now(),
  grade             text,
  board             text,
  account_type      text,
  lessons_count     integer NOT NULL DEFAULT 0,
  sessions_count    integer NOT NULL DEFAULT 0,
  questions_count   integer NOT NULL DEFAULT 0
);
```

No name, email, phone, photo, school, date of birth — and deliberately **not** the
original user id, because keeping it would let the row be re-identified against
anything that outlives the purge.

## Flow 1 — soft delete (student)

`DELETE /api/auth/me`, authenticated, acts only on the caller. One transaction:

1. `is_deleted = true`, `deleted_at = now()`
2. archive `email` and `phone` as above
3. return 200

`is_active` is deliberately left alone. Flipping it too would make a self-deleted
student show up under the admin console's "deactivated" filter, which is meant to
mean "staff suspended this person" — and would make the new "deleted" filter
ambiguous. Blocking the way back in is `is_deleted`'s job, enforced below.

The app calls `signOut()` on success. That already clears storage and closes the
support socket, which matters — the socket's room membership is fixed at handshake
and cannot be revoked server-side.

Refuses with 409 if the account is already soft-deleted.

## Flow 2 — blocking the way back in

Two enforcement points. Both are required; either alone leaves a hole.

- **`server/src/middleware/auth.js`** — reject with 401 when `is_deleted`. Without
  this, a token issued before deletion keeps working until it expires.
- **login controller** — exclude soft-deleted rows so a password login cannot match
  one.

> Noted, not fixed here: `middleware/auth.js` already selects `is_active` and never
> checks it, so a suspended student's existing token still works. That is a separate
> pre-existing bug. This work adds the `is_deleted` check beside it and leaves the
> other one alone rather than widening scope silently.

Signup needs no change. The email is free, so registering again simply creates a new
row with no relationship to the old one.

## Flow 3 — hard delete (staff)

`DELETE /api/admin/users/:id/permanent`, permission-gated and audit-logged the same
way `PATCH /api/admin/users/:id/status` already is. Refuses unless the target is
already soft-deleted — hard delete is never the first step.

One transaction:

1. compute the counts and insert the `deleted_user_stats` row
2. delete dependent rows (see below)
3. delete the `users` row
4. write the audit log entry

The admin console's existing status filter (`active` / `deactivated`) gains
`deleted`, listing soft-deleted accounts oldest first with their `deleted_at`.

### Dependent data — must be enumerated, not guessed

Four relations cascade through Prisma today: `Lesson`, `DoubtSession`,
`BrainGymSession`, `knowledge_sources`. Many other tables carry a user id without a
declared relation — `question_progress`, `question_bookmarks`, `mistake_book`,
`student_memory`, `student_events`, `student_concepts`, `question_attempts`,
`student_mastery`, `lesson_progress`, `mock_test_attempts`, and the support ticket
tables among them.

The first implementation task is to derive the real list from the database:

```sql
SELECT c.table_name, c.column_name
  FROM information_schema.columns c
 WHERE c.column_name IN ('user_id','userId','uploadedById','student_id','created_by')
 ORDER BY 1;
```

then confirm which already cascade via `information_schema.referential_constraints`.
Writing the delete from memory would leave orphans or hit a foreign-key error.

## Flow 4 — the app

- **`src/screens/profile/ProfileHome.js`** — a destructive "Delete account" row below
  "Log out".
- **`src/screens/ProfileScreen.js`** — the handler, following the existing
  `handleLogout` pattern.

Two steps, because the outcome is unusual enough that a generic "Are you sure?"
would mislead:

1. *Delete account* — "You will be logged out and will not be able to log in to this
   account again. To use Ailernova later you will need to create a new account."
   Buttons: Cancel / Delete account (destructive).
2. *This cannot be undone* — "Delete your account?" Buttons: Cancel / Delete.

On success: `signOut()`.

## Parent and student accounts

`users` carries `account_type` and `linked_student_id`. When either side is deleted,
**the link is broken and the other account is left alone** — a parent deleting their
own account must not delete their child's.

## Testing

The app has no test runner; the server uses `node --test "tests/*.test.js"`.

- Unit, no database: the email/phone archiving helper — round-trips an address,
  stays unique for the same address deleted twice, leaves the original readable.
- Server, against the test database: soft delete sets the flags and frees the email;
  an existing token is rejected afterwards; login fails; registering with the freed
  email succeeds and produces a different user id; hard delete refuses on an account
  that is not soft-deleted; hard delete writes exactly one stats row carrying no
  identifying column, and leaves no row behind in any dependent table.
- Manual, in Expo: both popups, the sign-out, and that the app returns to the login
  screen rather than a half-authenticated state.

## Migration hazard

`server/prisma/sql/*.sql` files are applied **by hand**, and some never were — the
symptom is a production 500 reading "column does not exist". Both statements above go
in a new `server/prisma/sql/account_deletion.sql`, and the implementation plan must
include running it against the deployed database and verifying the columns exist
before the server code that reads them is deployed.

## Out of scope

- **Web deletion URL.** Play asks for a publicly reachable deletion request page at
  submission. It is a web page, not app code, and is tracked separately.
- Fixing the `is_active` enforcement gap noted above.
- Any change to admin deactivation.
