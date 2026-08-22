# Parent-side OTP verification — design

**Date:** 2026-08-22
**Status:** approved, ready for implementation plan
**Scope:** SMS (MSG91) only. Email is designed for but deliberately not built.

## Problem

Three places in the parent experience ask for a phone number or an identity and
verify none of them:

1. **Free-trial booking** — `src/screens/parent/ParentApp/BookTrial.js` has a
   complete OTP step whose code is the hardcoded constant `DEV_OTP = '123456'`.
   Nothing is texted; anyone can "verify" any number. The screen even renders a
   yellow hint telling the user to type `123456`.
2. **Phone login / signup** — `LoginScreen.js` and `OTPScreen.js` are fully
   built and call `POST /api/auth/send-otp`, `/verify-otp` and
   `/complete-phone-signup`. **None of those routes exist on the server.**
   `auth.controller.js` exports only `register, login, googleAuth, me,
   updateProfile, uploadPhoto`. In production the "Send OTP" button returns 404.
3. **Child linking** — `POST /api/parent/link-child` links a parent to a student
   on nothing but a known email address, with no consent from the child.

Additionally, a trial booking is never persisted anywhere. `BookTrial.js` says
so directly: *"No backend/persistence yet — the booking lives in the parent's
state."* Verifying a phone number and then losing the lead is pointless, so
booking persistence is part of this work.

## What already exists

- `phone_otps` model in `prisma/schema.prisma` (`phone, otpHash, purpose,
  expiresAt, attempts, consumedAt`) — right shape, wrong dimensions (see below).
  No `.sql` file for it in `prisma/sql/`, so it probably does not exist in the
  live database.
- MSG91 config block in `src/config/env.js` (`sms.authKey`, `templateId`,
  `senderId`, `otpExpiryMinutes`, `enabled`), with credentials filled in the
  local `.env`.
- `users.phone` is `String? @unique` and `passwordHash` is nullable, so a
  phone-only account is already representable.
- Both OTP entry UIs (auth and trial booking).

Missing: the service layer, the routes, the SMS provider call, and persistence
for bookings.

## Non-goals

- Email OTP. The schema carries a `channel` column so adding it later is a new
  sender function, not a redesign. It is not built now because the server has no
  mail library, no provider account, and no SPF/DKIM records — that is a
  separate 1–2 day setup with its own deliverability risk.
- Parent–child link consent. `purpose = 'link_child'` is reserved; the screen
  and flow are a later change.
- `BookDemo.js`. A second, parallel booking screen with no OTP and no
  persistence. Out of scope here; it must later be either wired up or removed.
- Admin-portal listing of trial bookings.

## Data layer

A new table replaces `phone_otps`:

```sql
CREATE TABLE otp_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination  text        NOT NULL,   -- '+919876543210' or 'a@b.com'
  channel      text        NOT NULL,   -- 'sms' | 'email'
  purpose      text        NOT NULL,   -- 'login'|'signup'|'trial_booking'|'link_child'
  code_hash    text        NOT NULL,   -- bcrypt; the code is never stored in clear
  expires_at   timestamptz NOT NULL,
  attempts     int         NOT NULL DEFAULT 0,
  consumed_at  timestamptz,
  ip           text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_codes_lookup ON otp_codes (destination, purpose, created_at DESC);
CREATE INDEX otp_codes_ip     ON otp_codes (ip, created_at DESC);
```

`phone_otps` is dropped from `schema.prisma`. It hardcodes `phone`, its
`OtpPurpose` enum has only `LOGIN` and `SIGNUP` (so trial booking needs a
migration regardless), and it is probably not in the live database — there is
nothing to preserve.

`purpose` and `channel` are `text`, not Postgres enums, so adding a purpose is a
code change rather than a hand-run `ALTER TYPE` on a database whose migrations
are applied by hand.

And a table for the leads the OTP is protecting:

```sql
CREATE TABLE trial_bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id),   -- nullable: logged-out parents book too
  parent_name   text NOT NULL,
  phone         text NOT NULL,
  country_iso   text,
  child_name    text,
  board         text,
  grade         text,
  slot_day      date NOT NULL,
  slot_time     text NOT NULL,
  survey_level  text,
  survey_focus  jsonb,
  status        text NOT NULL DEFAULT 'booked',  -- booked|cancelled|done
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX trial_bookings_phone ON trial_bookings (phone, created_at DESC);
```

Both live in one hand-run file, `prisma/sql/otp_and_trial_bookings.sql`, with
matching models in `schema.prisma`.

## Service layer

`server/src/services/otp.service.js` owns every rule. Two functions:

- `issue({ destination, channel, purpose, ip })` — enforces the limits below,
  generates a 6-digit code, stores its bcrypt hash, dispatches via the channel's
  sender, returns `{ resendIn }` (plus `devOtp` in development only).
- `verify({ destination, purpose, code })` — loads the newest unconsumed row,
  checks expiry, increments `attempts`, compares the hash, marks `consumed_at`.
  Returns a boolean; callers decide what a success means.

| Rule | Value |
|---|---|
| Resend cooldown | 30 s per destination + purpose |
| Sends per destination | 5 / hour |
| Sends per IP | 20 / hour |
| Wrong attempts per code | 5, then the code is dead |
| Expiry | `MSG91_OTP_EXPIRY_MIN`, default 5 min |
| Re-use | single-use via `consumed_at` |

Limits are counted with `SELECT count(*)` over `otp_codes`. No new dependency
(`express-rate-limit` is not installed), it survives a restart, and the server
runs as a single Render instance so an in-process counter would buy nothing.

Verification failures return one generic message. Distinguishing "expired" from
"wrong" from "no such code" tells an attacker which numbers are in the system.

### SMS provider

`server/src/providers/sms/msg91.js` exposes `send(destination, code)`.

We generate the code and ask MSG91 only to deliver it, rather than using MSG91's
own send-and-verify OTP API. Verification state stays in our database, which
means the email channel later reuses this exact code path instead of needing a
second, provider-shaped verification flow.

When `env.sms.enabled` is false the sender is skipped. In development the route
returns the code as `devOtp` so local work costs no SMS credits — as the comment
at `env.js:56-58` already anticipates. `devOtp` is never returned when
`NODE_ENV === 'production'`, regardless of `enabled`.

## Routes

Auth — these three names are what `src/api/authApi.js` already calls, so no
frontend change is needed and `OTPScreen` starts working as-is:

```
POST /api/auth/send-otp               { phone }               -> { sent, resendIn }
POST /api/auth/verify-otp             { phone, otp }          -> { token, isNewUser }
POST /api/auth/complete-phone-signup  { phone, name, grade }  -> { token, user }
```

`verify-otp` looks the phone up in `users`. Found -> `isNewUser: false` and a
normal session token from `signToken`. Not found -> `isNewUser: true` and a
short-lived token that authorises only `complete-phone-signup`, which creates
the user with `provider = PHONE` and no password.

General-purpose OTP, for flows that are not authentication:

```
POST /api/otp/send        { destination, purpose }        -> { sent, resendIn }
POST /api/otp/verify      { destination, purpose, code }  -> { otpToken }
POST /api/trial-bookings  { otpToken, ...booking }        -> { booking }
```

`purpose` is validated against an allow-list; only `trial_booking` is accepted
initially, so this endpoint cannot be used to mint login codes.

`otpToken` is a 10-minute JWT naming the verified destination and purpose.
Verification and booking are two separate requests — the parent picks a day and
a slot in between — so without a token anyone could skip verification and POST a
booking directly, and a server-side pending-verification store would add state
for no benefit. The token also stops one verification from creating unlimited
bookings, because `POST /api/trial-bookings` consumes it.

## Frontend

- `BookTrial.js` — delete `DEV_OTP` and the "no SMS is sent" hint block
  (lines ~419-424). `sendOtp`/`resendOtp` call `POST /api/otp/send`; `verifyOtp`
  calls `POST /api/otp/verify` and holds the returned `otpToken`; the confirm
  step POSTs the booking with it. The resend cooldown follows the server's
  `resendIn` rather than the local `RESEND_SECONDS` constant. Layout unchanged.
- `LoginScreen.js` / `OTPScreen.js` — no changes. They begin working once the
  routes exist.

## Error handling

- Every OTP failure the user sees is one generic "That code isn't valid" plus
  the remaining attempts, never the reason.
- A rate-limited send returns 429 with `resendIn`; the client shows the timer it
  already renders instead of an error.
- If MSG91 fails, the row is deleted so the attempt does not consume the user's
  hourly budget, and the client is told to retry.
- `POST /api/trial-bookings` with an expired `otpToken` returns 401 and the
  client sends the parent back to the OTP step with their form intact.

## Testing

`server/tests/otp.test.js`, following the existing convention there: `node:test`
with `npm test`, hitting a real database and skipping itself when
`DATABASE_URL` is unset (see `tests/auth.permissions.test.js`).

Cases: expiry, attempt exhaustion, single-use, resend cooldown, per-destination
and per-IP caps, and that a wrong code never consumes a valid one. The MSG91
provider is stubbed.

Route tests: one happy path per endpoint, a rate-limit rejection, an expired
`otpToken` against `POST /api/trial-bookings`, and a `purpose` outside the
allow-list.

## Rollout

Ordered, because the last two are manual and the code is inert without them.

1. Run `prisma/sql/otp_and_trial_bookings.sql` **by hand** against the Render
   database. Migrations in this repo are not automatic; skipping this produces
   "column does not exist" 500s at runtime.
2. Set `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `MSG91_SENDER_ID` and
   `MSG91_OTP_EXPIRY_MIN` in the Render dashboard. They are currently in the
   local `.env` only, so production would run with `sms.enabled === false` and
   silently send nothing.
3. Confirm on the MSG91 dashboard, before implementation starts:
   - the DLT **Sender ID** is approved — the value in `.env` is 14 characters
     and a DLT header is 6, so it may be in the wrong field;
   - the OTP **template** is approved, and its exact body and variable token
     (`##OTP##` vs `{{otp}}`) — the request must match it or MSG91 rejects the
     send;
   - the wallet has balance.
4. End-to-end test against a real handset before release.

## Open items

- The MSG91 sender ID length discrepancy in item 3 above.
- Whether `phone_otps` exists in the live database. If it does, the migration
  drops it; if not, the `DROP` is a no-op. Written as `DROP TABLE IF EXISTS`
  either way.
