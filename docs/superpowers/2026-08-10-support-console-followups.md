# Support ticket console — deploy notes and carried follow-ups

**Date:** 2026-08-10
**Branch:** `feat/onboarding-intro`
**Spec:** `specs/2026-08-10-support-ticket-console-design.md`
**Plan:** `plans/2026-08-10-support-ticket-console.md`

Everything in the plan shipped and each task was reviewed. This file records what was
consciously *not* fixed, so it is a decision rather than an oversight.

## Before deploying

1. **Run the SQL with the deploy.** `server/prisma/sql/support_tickets.sql` is idempotent
   and safe to re-run — but only once the current controller is also live. Its
   `resolved` → `closed` migration would force-close anything an older build left at
   `resolved`, skipping the user-confirmation step this feature exists to add.

   ```bash
   cd server && npx prisma db execute --file prisma/sql/support_tickets.sql --schema prisma/schema.prisma
   ```

2. **Add the portal's production origin to `ALLOWED_ORIGINS`.** REST is proxied
   same-origin by Next, but the socket connects directly to `NEXT_PUBLIC_SOCKET_URL`,
   so it is a cross-origin WebSocket. `server/src/config/env.js` refuses to default this
   in production. Only localhost is documented today.

3. **Register the real agent** (already done for `saurabh@ailernova.com`; repeat for
   anyone added):

   ```bash
   cd server && npm run support:setup -- <email>
   ```

   `support_agents` starts empty on purpose — with no rows the app says "team ka member
   aapse contact karega" instead of naming someone who does not exist.

4. **Never point `npm test` at the production database.** `autoCloseExpired()` is a
   table-wide `UPDATE`. The tests that call it directly are gated behind
   `SUPPORT_TEST_DB=1`, but `support.access.test.js` still reaches it indirectly through
   `queue` / `getOne` / `listMine`, which every read calls by design.

## Manual verification still owed

None of this was possible without a device and a browser:

1. Student raises a billing issue → it appears live in the console.
2. Admin replies → it appears live in the app, with the agent's name.
3. Admin logs a call → visible in the console, **invisible in the app**.
4. Admin marks resolved → the confirmation card appears live in the app.
5. Student taps **Issue Resolved** → resolved screen; console shows Closed.
6. Student reopens from their ticket list → back to Open in the console.
7. Airplane mode during (2): the missed reply must appear once the socket reconnects.
   This is the refetch-on-reconnect path and the easiest thing to have got wrong.

## Carried follow-ups

Ordered by how likely they are to matter.

- **The socket `status` event carries a partial ticket** — `shape()` only, so no
  `messages` and no `attachments`. The app dodges this by holding attachments in their
  own state. The honest fix is a REST refetch on `status`, consistent with how every
  other client path already treats the socket as an accelerator rather than truth.
- **Every ticket shows an unread dot until it is opened from the list.** `userReadAt` is
  stamped only by `SupportSheet.openExisting`, never at creation and never while
  ChatScreen is open, so a ticket the user raised a minute ago — and every ticket they
  read live in the chat — carries a dot next time the sheet opens.
- **`typing` is dead end to end.** The server relays it; no client emits or listens, and
  `joinTicket` has no `onTyping` slot. Either wire it up or delete the relay.
- **`shape().unread` means the *user's* read state but is shipped in the staff queue
  response.** The portal correctly ignores it and computes its own staff-side unread, but
  the field is a trap for the next reader. Drop it from `queue`, or name the two apart.
- **Two socket connections per admin tab on `/support`** — `layout.tsx` and `page.tsx`
  each call `useSupportSocket`. Harmless with one admin; a shared provider would be
  tidier.
- **The doubt CTA overpromises.** It reads "AI Teacher kholein" but only switches to the
  Home tab — `AITeacherScreen` has no route, it is local state inside `HomeScreen.js`.
  Either soften the copy or give the screen a route.
- **`SupportSheet` still holds a demo-driven route to `ResolvedScreen`,** keyed off a
  `ticketContexts` prop no real mount site passes, so it is unreachable today. If anyone
  ever wires that prop, it would mask the real status-driven route in `ChatScreen`.
  `DEMO_TICKET_CONTEXT` / `DEMO_RESOLVED_CONTEXT` render a ₹4,800 refund card with a
  "Confirm Refund" button — they must never reach a shipped screen.
- **`onReconnect` fires on the first connect too,** costing one redundant `getTicket` on
  mount. It errs in the safe direction.
- **The status comment at `support_tickets.sql:20`** still lists the retired `resolved`
  value. The file is append-only; the v2 block below it documents the real vocabulary.

## Not built, by design

Push notifications · FAQ content and its editor · email alerts on a new ticket · ticket
priority · multi-agent claim/assign · CSAT reporting.

The single-admin setup has no second person to notice a missed ticket. Phase 1 surfaces
that with the unread badge and the 24h staleness marker only. If tickets start slipping,
email alerts are the next thing to build.
