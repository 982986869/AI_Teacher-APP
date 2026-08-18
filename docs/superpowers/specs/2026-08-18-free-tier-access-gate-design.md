# Free tier and the content access gate — design

**Date:** 2026-08-18
**Branch:** `main`
**Status:** designed, not built

## Problem

The app has to reach parents and students before there is anything to sell them.
Today an account is all-or-nothing: whoever logs in gets the whole app. That
leaves no way to hand the app out widely and still have something to charge for.

The shape we want is a free tier: anyone who signs up can play Brain Gym, the
Arena and the games, and can see the Home dashboard. The moment they reach for
content — lessons, practice, resources, tests, the AI teacher — they hit a lock
with a way to unlock it. Who is unlocked is an **admin** decision.

Money is deliberately **not** in scope. There is no payment SDK in this repo and
adding one is its own project (gateway, plans, receipts, webhooks, refunds, store
review for digital goods). The lock, the gate and the admin control are the work;
when real payment arrives, the only thing that changes is *who* sets `full`.

## What already exists

- **Roles**: `student`, `parent`, `admin`, `teacher` — `AppNavigator.js:85-92`.
  There is no "child" role and this design does not add one.
- **`users.is_active` + `setStatus`** — `admin/users.controller.js:156`. A per-user
  boolean an admin flips, with an audit entry. This gate is modelled on it exactly.
- **`deriveScope(user)`** — `services/personalization/scope.js:43`. Builds the
  object that becomes `req.scope` on the server and the app's `scope`. The natural
  place for `accessLevel`.
- **`requireAdmin`** — `middleware/auth.js:71`. The gate pattern to copy.
- **`account_type`** — flips the student↔parent dual view. Unrelated to access;
  not reused here.
- **`supportLinks()`** — `support/supportConfig.js:295`. Already returns
  `phone: tel ? 'tel:'+tel : null`, so setting `SUPPORT.phone` makes a Call
  button appear on its own.
- **Support ticketing** — `support_tickets` / `support_messages`, the queue
  (`admin/support/SupportQueueScreen.js`) and the thread
  (`admin/support/SupportThreadScreen.js`). Raising, assigning and resolving all
  work today. The unlock request rides on this rather than growing a second queue.
- **Feature flags** — `feature_flags` table, resolved per *environment* in
  `config.controller.js`. Global, never per-user, so they cannot express this.
  Not touched.

## Scope

**In:** one access level per user; a server gate on content routes; a lock sheet
in the app; an admin toggle with audit.

**Out:** payments of any kind. Per-feature granularity (a `user_features` grid was
considered and rejected — see Alternatives). Parent-managed access. Trials,
expiry dates, promo codes. A dedicated access-request queue — the support system
carries it (see Unlock request).

## Architecture

### Data model

```sql
ALTER TABLE users ADD COLUMN access_level text NOT NULL DEFAULT 'free'
  CHECK (access_level IN ('free', 'full'));
```

Raw SQL in `server/prisma/sql/`, matching how the other tables here are managed,
plus the field on `model User` in `schema.prisma`.

A column and not a table because there is exactly one line to draw. If access ever
needs to vary per feature, that is a new table and a new design — not a widening
of this one.

**Migration**: existing accounts are set to `full` in the same migration. There
are 22 users today (20 students, 1 admin, 1 parent); defaulting them to `free`
would lock out the accounts we test with for no gain.

### Server gate

This is the actual lock. The app-side sheet is presentation.

1. `middleware/auth.js` — add `access_level` to the raw select that already loads
   `is_active` and `admin_role`.
2. `deriveScope` — return `accessLevel`, beside `role` and `classNum`.
3. New `requireFullAccess`, next to `requireAdmin`. On a `free` account it fails
   with **403 and a machine-readable `code: 'LOCKED'`** — the app has to tell a
   lock apart from an expired session, and a bare 403 cannot say which.
   Admins and testers bypass it.

Routes:

| Gated | Open |
|---|---|
| `/api/resources` | `/api/brain-gym` |
| `/api/mcq-practice` | `/api/arena` |
| `/api/online-tests`, `/api/offline-tests`, `/api/mock-tests` | `/api/support` |
| `/api/ai` | `/api/auth`, `/api/config`, `/api/health` |
| `/api/knowledge` | `/api/parent` |
| `/api/tts` | `/api/cms` |
| `/api/sessions` | |

Gating `/api/tts` also keeps the ElevenLabs bill off free accounts, which is a
real saving now that the teacher voice is a paid per-character API.

**`/api/learning` needs endpoint-level care and is the one loose end here.** Home
is free and appears to source its streak, goal and recent activity from it, so the
router cannot be gated wholesale. Each endpoint under it has to be read and
labelled: dashboard aggregates stay open, anything returning lesson or question
content is gated. Whoever implements this should expect to find at least one
endpoint that does both and needs splitting.

### App

`AuthContext` carries `accessLevel` through the existing scope.

- **Open**: the post-login Brain Gym flow, `BrainGymFlow`, Arena, games, Home,
  Profile, Support.
- **Gated**: Practice, Resources, Sessions, Results. Tapping the tab opens a
  `LockSheet` instead of navigating. Home's "Current lesson" / "Next up" cards do
  the same.

Profile and Support stay open on purpose. A locked Profile means the user cannot
log out or change class — a trap, not a paywall. A locked Support means they
cannot ask how to unlock, which works directly against the point of the tier.

**Home is free but not content-free.** Its cards advertise lessons the user cannot
open. That is deliberate — it shows what is behind the lock — but it means Home
will be the most common place the sheet appears, so the sheet has to read as an
invitation rather than an error.

Alongside the entry-point checks, the API layer handles `403 LOCKED` centrally and
raises the same sheet. Entry-point checks alone will miss something; this makes
the miss harmless instead of a content leak.

### Unlock request — a support ticket

The lock sheet does not dial anyone and does not open a web form. It raises a
**support ticket**, because that system already exists end to end and already
routes to the right people.

`support_tickets` carries `topicId`, `team`, `status`, a `ref` (`AL-2291`) and a
callback `phone`. `PARENT_CATEGORIES` already has a `sales` topic — team
`'Sales team'`, blurb *"Plans, pricing, upgrades or starting a new course"* —
which is this request almost word for word. The agent console, assignment,
resolution and liveness are all built and running.

Flow:

1. Student taps a gated tab or a Home lesson card → `LockSheet`.
2. "Request access" opens the existing support chat with the topic preselected.
   Name, class and phone come from the account; the student adds a note if they want.
3. A ticket is raised against the Sales team and appears in the admin console.
4. An admin grants access from the ticket (below).

**What is actually new**: one entry in `STUDENT_CATEGORIES` (students today get
doubt / class / test / tech / other — no sales topic), and the grant action. Everything
else is reuse.

This also disposes of the phone-number problem the earlier draft was blocked on.
`SUPPORT.phone` is still `null` and the one number we have is an unconfirmed
WhatsApp line — but nothing here dials it. The ticket already captures a callback
number, so an admin can ring the user rather than the other way round.

**Tradeoff**: unlock requests land in the same queue as real support. The queue is
already segmented by team, so they sort themselves, but the Sales team column will
be doing double duty as a sales pipeline. If that queue gets noisy, splitting it is
a later problem and does not change anything in this design.

### Admin control

- `PATCH /api/admin/users/:id/access`, beside `setStatus`: same permission check,
  same `audit.record` entry, same self-protection guards. One endpoint, two callers.
- `StudentProfileScreen` — a toggle under Status. Works for any student, whether or
  not they ever asked.
- `SupportThreadScreen` — a **Grant access** action on an unlock ticket, so the admin
  acts where the request is instead of navigating to People and searching for the
  student. It calls the same endpoint and writes the same audit entry.
- `StudentsListScreen` — show the level, so an admin can see at a glance who is
  paid without opening every profile.

## Alternatives considered

**Per-user feature table** (`user_features`: userId, feature, enabled). More
flexible, and wrong for this: the product has one line — free versus paid — and a
grid invites per-student states nobody asked for, each needing its own gate and
its own admin control.

**Client-only gating.** Fastest, and it would not be a paywall. The content APIs
would stay open and anyone could pull the whole syllabus with a token. The thing
being sold has to be locked on the server.

**Named tiers** (`games_only` / `games_plus_practice` / `full`). Premature. There
is one product to sell; tiers can be added to the column later without moving
anything else.

## Risks

- **Every gated route is a place to forget.** The central `403 LOCKED` handler is
  the safety net, but a route mounted later with no gate leaks silently. Worth a
  test that walks the router table and asserts each mount is classified.
- **`/api/learning` is not cleanly separable.** See above. If splitting proves
  messy, the fallback is to gate it and give Home its own narrow dashboard
  endpoint — more work, but a clean line.
- **Free accounts still cost money.** Brain Gym and the Arena hit the AI routes if
  they generate questions. If they do, either those calls need their own budget or
  the free tier needs a cap. Unverified — check before launch.
- **Unlock requests share the support queue.** They are separated by team, not by
  system, so a busy support day and a busy sales day land in the same place. Watch
  whether Sales-team tickets start starving real support ones.
- **Store policy.** The app will show a purchase path for digital content. Selling
  digital goods off-store can breach Play/App Store rules. This design keeps money
  entirely out of the app, which is the safer side of that line, but confirm the
  rules before any in-app payment lands.

## Testing

- `requireFullAccess`: `free` → 403 `LOCKED`; `full` → through; admin → through.
- `deriveScope` returns `accessLevel` for each role.
- Migration: existing users end at `full`, a fresh insert defaults to `free`.
- Admin endpoint: writes the column, records audit, honours permissions.
- A router-table test asserting every mount is either gated or explicitly open.
- Raising an unlock ticket routes to the Sales team and carries the account's phone.
- Grant-from-ticket and grant-from-profile hit the same endpoint and both audit.

App-side gating is UI and this repo has no UI test setup; it needs checking on a
device — free account sees the sheet on all four tabs and on the Home cards, and a
`full` account sees none of it.
