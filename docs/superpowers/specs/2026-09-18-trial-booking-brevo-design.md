# Trial booking in-house, confirmed by Brevo email

**Date:** 2026-09-18
**Status:** implemented on feat/trial-booking (2026-09-18). Pending for production: run `prisma/sql/trial_bookings.sql` on Render's DB. `TRIAL_MEET_LINK` defaults to the placeholder `https://meet.google.com/new` (2026-09-19) until a real room is set on Render. Sender = `MAIL_FROM` (the already-verified forgot-password sender); `TRIAL_MAIL_FROM` is an optional override. Also: Cancel on web uses `window.confirm` because react-native-web's `Alert.alert` is a stub.
**Replaces:** the Calendly embed (`TrialBookingEmbed.js`, commits aafba62 / 066295d)

## Goal

A parent books a free demo class inside the app, and immediately receives an
email from `kids@ailernova.com` with the date, time and Google Meet link. The
booking is stored on our server and a copy of the email reaches the team. No
third party in the loop.

## What the parent sees

The four existing "Book a FREE trial" buttons (Home card, Sessions hero, Chat
tab, program page CTA) open the same full-screen modal they do today. The modal
content changes from a Calendly frame to a three-step flow:

1. **Pick a slot.** A row of the next 7 days as chips (dow + date). Under it, a
   Morning / Afternoon / Evening segment and the slots in that period as pills
   (`8:00 – 9:00 AM` …). Days and slots come from the existing
   `demoConfig.js` (`buildDays`, `buildSlots`); a couple of days and slots read
   as taken so the disabled state is real. Past slots and anything within the
   2-hour lead time are disabled. Today is skipped when nothing in it is left.
2. **Details.** Parent name and email prefilled from the login and editable;
   phone (required, 10+ digits); child's class (chip list, `CLASSES`); subject
   (chip list, `SUBJECTS`). Child name is prefilled from the linked child when
   there is one.
3. **Done.** A confirmation screen: date, time, the Meet link as a tappable
   row, and "We've emailed this to <email>". A "Back to dashboard" button
   closes the modal.

After booking, the dashboard's existing `UpcomingDemoCard` (Home and Sessions
tabs) renders with the booking: countdown, "Join" opens the Meet link, "Cancel"
cancels on the server. "Reschedule" is dropped from the card for this version —
cancel and book again covers it.

On the next app open the card is still there: `ParentApp` fetches the parent's
upcoming booking on load.

## Server

### Table `trial_bookings` (new, hand-run SQL, `prisma/sql/trial_bookings.sql`)

| column         | type        | notes                                             |
|----------------|-------------|---------------------------------------------------|
| id             | uuid pk     |                                                   |
| user_id        | uuid        | the logged-in account; not a FK, users may purge  |
| parent_name    | text        |                                                   |
| parent_email   | text        | where the confirmation went                       |
| parent_phone   | text        |                                                   |
| child_name     | text null   |                                                   |
| child_class    | text        | 'Class 8'                                         |
| subject        | text        | 'Maths'                                           |
| slot_at        | timestamptz | class start                                       |
| duration_min   | int         | 45 (`DEMO_DURATION_MIN`)                          |
| meet_link      | text        | the link that was emailed, frozen at booking time |
| status         | text        | 'booked' \| 'cancelled'                           |
| mail_status    | text        | 'sent' \| 'failed' — for the team to chase         |
| created_at     | timestamptz |                                                   |
| cancelled_at   | timestamptz null |                                              |

Index on `(user_id, slot_at)`. Written and read with raw SQL like `support_tickets`,
so the Prisma client need not be regenerated on Render.

### Routes (`routes/parent.js`, behind the existing `authenticate`)

- `POST /api/parent/trial-bookings` — body: `parentName, parentEmail, parentPhone,
  childName?, childClass, subject, slotAt`. Validates with express-validator
  (email, phone digits ≥ 10, `slotAt` a future ISO timestamp, class and subject
  from the allowed lists). Refuses a second active booking for the same user
  (409, "You already have a demo booked"). Inserts the row, sends the two emails,
  records `mail_status`, returns the booking (`201`). Mail failure does **not**
  fail the request — the row is the source of truth and the team copy or the
  admin can follow up; the response carries `mailSent: false` so the app can say
  "we couldn't email you, here's the link".
- `GET /api/parent/trial-bookings/upcoming` — the user's one `status='booked'`
  booking whose class has not ended yet, or `null`.
- `POST /api/parent/trial-bookings/:id/cancel` — sets `status='cancelled'`,
  `cancelled_at`. Only the owning user. No email on cancel.

### Config (`config/env.js`)

- `TRIAL_MEET_LINK` — the standing Google Meet room. **Required for booking**:
  without it the POST answers 503 "Demo booking is not set up yet" rather than
  emailing a blank link. Added to `render.yaml` as `sync: false`.
- `TRIAL_MAIL_FROM` — optional. Unset (the default), booking mails go out from
  `MAIL_FROM`, the sender Brevo already accepts for forgot-password. Set only to a
  separately verified address; passed as a per-message `from` to `sendMail`.
- `TRIAL_NOTIFY_EMAIL` — default `kids@ailernova.com`; gets the team copy.

### Email (`services/mailTemplates.js`)

Two new templates in the existing `layout()`:

- `trialBooked({ parentName, childName, childClass, subject, slotAt, durationMin,
  meetLink })` → subject "Your free demo class is booked — <Day, D Mon> at <time>".
  Body: greeting, the class line ("Maths for Aarav, Class 8"), date + time in
  IST, a prominent "Join on Google Meet" button plus the bare link in text, a
  line saying join 10 minutes early, and how to reach us (`kids@ailernova.com`).
  Plain-text part carries the same facts.
- `trialBookedTeam({ ...same, parentEmail, parentPhone, bookingId })` → subject
  "New demo booking: <subject> · <Day D Mon, time> · <parent name>". A compact
  fact list so whoever staffs the Meet room knows who is coming.

Times are rendered in `Asia/Kolkata` explicitly; Render runs in UTC.

## App

- `TrialBookingEmbed.js` is replaced by `TrialBookingFlow.js` (same props:
  `visible`, `onClose`, plus `onBooked(booking)`). Same header and modal shell.
  Steps are local state; no navigation stack.
- `src/api/parentApi.js` gains `createTrialBooking`, `getUpcomingTrialBooking`,
  `cancelTrialBooking`.
- `ParentApp.js`: `booking` is loaded via `getUpcomingTrialBooking` inside the
  existing `load()`; `onBooked` sets it; `handleJoinDemo` opens `booking.meetLink`
  with `Linking.openURL`; `handleCancelDemo` calls the API then clears state.
  `rescheduleMode` and `handleRescheduleDemo` are removed, and the reschedule
  button is removed from `UpcomingDemoCard`. Device-calendar sync (`calendar.js`)
  stays as it is — the flow calls `addDemoToCalendar` after a successful booking,
  as the old wizard did, and failure there is silent.
- `ClassesTab.js` stops accepting the unused `onBookTrial` prop.
- Web: the flow is plain RN views, so it works in the deployed web build without
  the iframe/WebView split. No `autoFocus` on inputs (the react-native-web Modal
  focus-trap race noted in aafba62).

## Errors

| case                          | parent sees                                                |
|-------------------------------|------------------------------------------------------------|
| network / 5xx on POST         | inline error under the button, "Try again"; nothing saved  |
| 409 already booked            | "You already have a demo booked" + close → card is visible |
| 503 no Meet link configured   | "Demo booking isn't open yet — please try later"           |
| mail failed, row saved        | Done screen with a yellow note: "We couldn't send the email — save this link" |

## Testing

- `server/tests/trialBooking.test.js`: validation rejects bad phone / past slot /
  unknown class; second active booking → 409; POST without `TRIAL_MEET_LINK` →
  503; cancel by a different user → 404; templates render the Meet link, IST
  time and subject line (`tests/mail.test.js` pattern).
- App: `demoConfig` helpers already pure; add a test that `buildDays` never
  returns a day with zero available slots marked available.
- Manual: `npm run web` → parent view → book → check the inbox at the parent
  email and at `kids@ailernova.com`; `GET /api/health` mail check confirms the
  Brevo transport before the first real booking.

## Deploy

1. Run `prisma/sql/trial_bookings.sql` against production by hand (see the
   manual-migrations note — the column-does-not-exist 500 is the symptom of
   skipping this).
2. Set `TRIAL_MEET_LINK` on Render. Verify `kids@ailernova.com` as a sender in
   Brevo (or set `TRIAL_MAIL_FROM` to the address that is verified).
3. Deploy server, then ship the app.

## Out of scope

- Per-booking Meet links (Google Calendar API + service account).
- Real availability / double-booking across parents: the standing room is one
  room, and the team confirms by looking at the inbox. If two parents pick the
  same slot, the team reschedules one of them by phone.
- Reminder emails before the class.
- Admin-console list of bookings (the team copy email is the record for now).
