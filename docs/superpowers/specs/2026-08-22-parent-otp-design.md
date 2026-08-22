# Parent-side OTP verification — design

**Date:** 2026-08-22
**Status:** design agreed; awaiting Resend account + DNS records before implementation
**Scope:** email (Resend) first, for the free-trial booking flow. SMS is designed
for and deliberately deferred — see Non-goals.

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
state."* Verifying a contact and then losing the lead is pointless, so booking
persistence is part of this work.

## What already exists

- `phone_otps` model in `prisma/schema.prisma` (`phone, otpHash, purpose,
  expiresAt, attempts, consumedAt`) — right shape, wrong dimensions (see below).
  No `.sql` file for it in `prisma/sql/`, so it probably does not exist in the
  live database.
- MSG91 config block in `src/config/env.js`. **The credentials in the local
  `.env` are placeholders** — `MSG91_TEMPLATE_ID` is the literal string
  `YOUR_TEMPLATE_ID` and `MSG91_SENDER_ID` is `YOUR_SENDER_ID`. The auth key is
  a 46-character string with dashes, which does not match MSG91's ~25-character
  alphanumeric format either.
- `users.phone` is `String? @unique` and `passwordHash` is nullable, so a
  phone-only account is already representable.
- Both OTP entry UIs (auth and trial booking).
- No mail library, no mail config, no mail environment variable anywhere in
  `server/`. Email is being built from zero.

### Bug to fix along the way

`env.js:64` reads:

```js
enabled: !!(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID)
```

A placeholder is a non-empty string, so `enabled` is currently **true**. Any
provider gate written this way reports "configured" for an unconfigured system,
disables the dev fallback, and sends every message into a provider that rejects
it — silently. The mail gate must validate the shape of the values (key prefix,
a from-address that parses), not merely their presence, and the same fix applies
to the SMS gate when it is next touched.

## Non-goals

- **SMS OTP — deferred, not cancelled.** India requires DLT registration before
  any transactional SMS is deliverable: Principal Entity registration on an
  operator portal (~₹5,000 + GST, 1–3 days), a 6-character header approval, and
  a content-template approval. Four to seven working days of process that has
  not been started. Email needs none of it and can ship this week. `otp_codes`
  carries a `channel` column so SMS later is a new sender function against an
  unchanged service.
- Parent–child link consent. `purpose = 'link_child'` is reserved; the screen
  and flow are a later change.
- `BookDemo.js`. A second, parallel booking screen with no OTP and no
  persistence — and, unlike `BookTrial.js`, it *does* collect an email. Out of
  scope here; it must later be either wired up or removed.
- Admin-portal listing of trial bookings.

## Domain and mail infrastructure

Verified from public DNS on 2026-08-22:

| Fact | Value |
|---|---|
| Registrar / DNS host | **Hostinger** — `ns1/ns2.dns-parking.com`, SOA responsible `dns.hostinger.com`, confirmed against the `.com` registry |
| Business mail | **Microsoft 365** — MX `ailernova-com.mail.protection.outlook.com` (a Google MX sits at priority 1 and looks like a leftover) |
| SPF | `v=spf1 include:spf.protection.outlook.com -all` |
| DMARC | **absent** — no `_dmarc.ailernova.com` record |

Two consequences drive the design:

**The SPF record ends in `-all`, a hard fail.** Any sender not covered by
Outlook's SPF is rejected outright, not filed as spam. Adding Resend without
touching this record would mean zero delivered mail.

**Therefore transactional mail is sent from a subdomain, `send.ailernova.com`,
not the root domain.** The record carrying live business email is never edited —
a typo there takes down company mail — and the OTP sender's reputation is
isolated from `@ailernova.com`. The cost is a visible `no-reply@send.ailernova.com`
in the From line, which is normal for transactional mail and worth the safety.

Note for whoever adds the records: Hostinger's DNS editor takes the *prefix* in
its Name field, not the full hostname. `send.ailernova.com` is entered as
`send`. Entering the full name produces `send.ailernova.com.ailernova.com` and
verification never passes.

**No mailbox needs to be created.** A From address requires no inbox once the
domain is verified at the provider. Reply-To points at `saurabh@ailernova.com`,
which exists. A `support@` alias or shared mailbox (both free on Microsoft 365)
is a later convenience, and only changes an environment variable.

## Data layer

A new table replaces `phone_otps`:

```sql
CREATE TABLE otp_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination  text        NOT NULL,   -- 'a@b.com' or '+919876543210'
  channel      text        NOT NULL,   -- 'email' | 'sms'
  purpose      text        NOT NULL,   -- 'trial_booking'|'login'|'signup'|'link_child'
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
`OtpPurpose` enum has only `LOGIN` and `SIGNUP`, and it is probably not in the
live database — there is nothing to preserve. The `DROP` is written as
`DROP TABLE IF EXISTS` so it is a no-op either way.

`purpose` and `channel` are `text`, not Postgres enums, so adding a value is a
code change rather than a hand-run `ALTER TYPE` on a database whose migrations
are applied by hand.

And a table for the leads the OTP is protecting:

```sql
CREATE TABLE trial_bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id),   -- nullable: logged-out parents book too
  parent_name   text NOT NULL,
  email         text NOT NULL,               -- the verified address
  phone         text,                        -- collected, NOT verified (see below)
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
CREATE INDEX trial_bookings_email ON trial_bookings (email, created_at DESC);
```

`phone` stays on the booking and stays unverified. The sales team calls that
number, and email OTP says nothing about whether it is real. This is a known,
accepted gap that closes when SMS lands — it is recorded here so nobody later
reads a verified booking as a verified phone number.

Both tables live in one hand-run file, `prisma/sql/otp_and_trial_bookings.sql`,
with matching models in `schema.prisma`.

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
| Expiry | `OTP_EXPIRY_MIN`, default 5 min |
| Re-use | single-use via `consumed_at` |

Limits are counted with `SELECT count(*)` over `otp_codes`. No new dependency
(`express-rate-limit` is not installed), it survives a restart, and the server
runs as a single Render instance so an in-process counter would buy nothing.

Verification failures return one generic message. Distinguishing "expired" from
"wrong" from "no such code" tells an attacker which addresses are in the system.

### Email provider

`server/src/providers/email/resend.js` exposes `send(destination, code)`, built
on the `resend` package — the first mail dependency in `server/`.

The message carries **both** an HTML part and a plain-text part. HTML-only mail
scores worse with spam filters, and the plain-text part is what a screen reader
or a text client shows.

Configuration, in `server/.env` and on Render:

```
RESEND_API_KEY=re_...
MAIL_FROM=no-reply@send.ailernova.com
MAIL_FROM_NAME=AILERNOVA
MAIL_REPLY_TO=saurabh@ailernova.com
OTP_EXPIRY_MIN=5
```

`env.js` gains a `mail` block whose `enabled` **validates the values**, not just
their presence (see the bug above): the key must carry Resend's `re_` prefix and
`MAIL_FROM` must parse as an address.

When mail is not configured the sender is skipped and, in development only, the
route returns the code as `devOtp` — so the whole flow is buildable and testable
before the DNS records exist. `devOtp` is never returned when
`NODE_ENV === 'production'`, regardless of configuration.

## Routes

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

The three auth routes the app already calls (`/api/auth/send-otp`,
`/verify-otp`, `/complete-phone-signup`) are **not** built here — they are the
SMS login path, deferred with SMS. See Open items for what to do about the
button that currently calls them.

## Frontend

`BookTrial.js`:

- Add an **email field** to the form. The screen currently collects name, board,
  grade, country and mobile only; the booking object has an `email` slot
  (line ~180) with no input behind it. Validate with the same regex
  `BookDemo.js` already uses.
- Delete `DEV_OTP` and the "no SMS is sent" hint block (lines ~419-424).
- `sendOtp`/`resendOtp` call `POST /api/otp/send`; `verifyOtp` calls
  `POST /api/otp/verify` and holds the returned `otpToken`; the confirm step
  POSTs the booking with it.
- The OTP step's copy changes from "Verify your number" to the email wording,
  and shows the address the code went to.
- The resend cooldown follows the server's `resendIn` rather than the local
  `RESEND_SECONDS` constant.

Layout, styling and step machine are otherwise unchanged.

`LoginScreen.js` / `OTPScreen.js` — untouched in this change.

## Error handling

- Every OTP failure the user sees is one generic "That code isn't valid" plus
  the remaining attempts, never the reason.
- A rate-limited send returns 429 with `resendIn`; the client shows the timer it
  already renders instead of an error.
- If Resend fails, the row is deleted so the attempt does not consume the user's
  hourly budget, and the client is told to retry.
- `POST /api/trial-bookings` with an expired `otpToken` returns 401 and the
  client sends the parent back to the OTP step with their form intact.

## Testing

`server/tests/otp.test.js`, following the existing convention there: `node:test`
with `npm test`, hitting a real database and skipping itself when
`DATABASE_URL` is unset (see `tests/auth.permissions.test.js`).

Cases: expiry, attempt exhaustion, single-use, resend cooldown, per-destination
and per-IP caps, and that a wrong code never consumes a valid one. The Resend
provider is stubbed.

Route tests: one happy path per endpoint, a rate-limit rejection, an expired
`otpToken` against `POST /api/trial-bookings`, and a `purpose` outside the
allow-list.

## Rollout

Implementation can start immediately — the `devOtp` path makes every step
testable without a provider. Steps 2–4 are manual and gate production only.

1. Run `prisma/sql/otp_and_trial_bookings.sql` **by hand** against the Render
   database. Migrations in this repo are not automatic; skipping this produces
   "column does not exist" 500s at runtime.
2. Create a Resend account and add the domain **`send.ailernova.com`**.
3. Add the records Resend generates to **Hostinger hPanel** → Domains →
   `ailernova.com` → DNS records — MX, SPF, DKIM, plus a `_dmarc` TXT the domain
   is currently missing. Prefix-only in the Name field. The existing root-domain
   SPF is not edited.
4. Set `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_FROM_NAME`, `MAIL_REPLY_TO` and
   `OTP_EXPIRY_MIN` in the Render dashboard as well as locally.
5. Send a real test mail to a Gmail address and confirm it lands in the inbox,
   not spam, with SPF and DKIM passing in the message headers.
6. Warm up gently — tens of messages a day for the first few days. A new
   subdomain that suddenly sends thousands gets filtered.

## Open items

- **`LoginScreen`'s phone-OTP tab 404s in production today.** It is unrelated to
  this change but ships in the same app. Recommendation: hide the phone tab
  until the SMS path exists, rather than leaving a button that fails. Needs a
  decision.
- DLT registration for SMS has not been started. Starting it in parallel is
  cheap and removes 4–7 days from whenever SMS is scheduled.
- The `MSG91_AUTH_KEY` in `.env` is an unidentified 46-character credential. It
  is not MSG91-shaped. Worth finding out what it belongs to before it is assumed
  dead — and rotating it if it is a live key for something else.
