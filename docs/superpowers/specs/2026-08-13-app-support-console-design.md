# In-app support console (Expo) — design

**Date:** 2026-08-13
**Branch:** `feat/onboarding-intro`
**Status:** shipped — and since 2026-08-14 this is the *only* support console. The web
portal's `/support` was deleted, so every "web console" reference below is history, not a
thing you can still open. Read it as the parity target this design was measured against.

## Problem

Support tickets can only be worked from the web admin console
(`admin/app/(portal)/support/`). An agent away from a laptop can see nothing and
answer nobody. The Expo app already carries an admin section — the console
belongs in it.

The goal is **parity with the web console**, not a redesign. Anything the web
console cannot do, this does not do either.

## What already exists

Three facts shape the whole design:

1. **The server needs almost nothing.** `/api/support/*` is mounted behind the
   plain `authenticate` middleware, not `requireAdmin`; the staff-only handlers
   check `admin_role` inside the controller
   (`server/src/routes/support.js`). The app's own token therefore reaches
   `queue`, `call-log` and `resolve` exactly as the console's does.
2. **The socket already knows about staff.** `attachRealtime` joins a socket to
   `staff:queue` when the user holds `support.view`
   (`server/src/realtime/index.js:48-72`). The app's socket module simply never
   listens for the queue events.
3. **The app has an admin area.** `src/navigation/AdminNavigator.js` is a bottom
   tab navigator with six tabs, each wrapping its own stack.

The one gap: the app knows *that* a user is an admin, but not *which*
permissions they hold. `deriveScope` yields `{ role, classNum, … }` only.

## Scope

**In:** queue with status/team filters and client-side search, unread and stale
indicators, unread badge on the tab, ticket thread with attachments, reply
composer, call logging, resolve-with-summary, live updates, permission gating.

**Out, deliberately:** push notifications for new tickets, agent-side attachment
upload, typing indicator, ticket reassignment. None of these exist in the web
console.

## Architecture

### Navigation

A seventh tab in `AdminNavigator`, wrapping a two-screen stack. The web
console's two-pane grid does not survive a phone; list and thread become
separate screens.

```
Tab "Support"  (badge = unreadCount from /support/queue?status=open)
  └─ SupportQueueScreen  ──push──>  SupportThreadScreen
                                      ├─ CallLogSheet
                                      └─ ResolveSheet
```

The tab renders only when the user holds `support.view`.

### New files

| File | Responsibility |
|---|---|
| `src/screens/admin/support/SupportQueueScreen.js` | Search box, status tabs, team chips, `FlatList` of tickets, pull-to-refresh |
| `src/screens/admin/support/SupportThreadScreen.js` | Ticket header, message list, attachments, composer, call/resolve actions |
| `src/screens/admin/support/CallLogSheet.js` | Outcome chips + internal note |
| `src/screens/admin/support/ResolveSheet.js` | User-visible resolution summary |
| `src/components/support/threadParts.js` | `EventChip`, `CallChip`, `mapServerMessage` lifted from `ChatScreen.js` |

### Changed files

| File | Change |
|---|---|
| `src/api/supportApi.js` | add `getSupportQueue`, `logCall`, `resolveTicket` |
| `src/realtime/supportSocket.js` | add `subscribeStaffQueue` |
| `src/navigation/AdminNavigator.js` | `SupportStackNav` + seventh tab + badge |
| `src/context/AuthContext.js` | expose `permissions` and `can(p)` |
| `server/src/controllers/auth.controller.js` | `me()` returns `permissions` |

### Why a separate thread screen

`ChatScreen.js` is 1181 lines of student-side flow: an optimistic send queue
with per-message retry, a typing indicator, `ContextCard`, CTA handling. An
`asAgent` prop would guard most of that file with `if (!asAgent)` and put a
never-device-tested student chat at risk for no gain. The agent thread is a
different, smaller job.

What genuinely is shared — `EventChip`, `CallChip`, and the server-message
mapper — moves to `threadParts.js` and both screens import it. Nothing else is
extracted; a full shared `<SupportThread>` would mean rewriting working student
code, which this work does not need.

### Theme

`S` from `src/theme/studentTheme`, and components from the admin kit the other
admin screens already use — `src/screens/admin/ui/kit.js` (`AdminScreen`,
`AdminHeader`, `AdminSearchBar`, `AdminSegmented`, `ChipRow`, `AdminBadge`,
`AdminEmptyState`, `AdminErrorState`) plus `timeAgo`/`apiError` from
`src/screens/admin/ui/format.js`. The two sheets copy the container of
`src/screens/admin/ui/ActionSheet.js`.

**Not** the dark `D` tokens from `src/components/support/theme.js`: those belong
to the student chat flow, and reaching for them here would drop one dark screen
into a light admin app.

The app has no toast system, so the web console's toasts become `Alert.alert`
with `apiError(e)` for the message.

## Data flow

### API surface

All three follow the existing `supportApi.js` shape — `axiosInstance`, unwrap
`res.data.data`, rethrow through `tag(err)`.

```js
getSupportQueue({ status, team })  // GET  /api/support/queue?status&team
                                   //   → { tickets: [...], unreadCount }
logCall(id, { outcome, note })     // POST /api/support/tickets/:id/call-log
resolveTicket(id, { summary })     // PATCH /api/support/tickets/:id/resolve
```

`getTicket` and `markTicketRead` already exist and are reused unchanged.

Two server behaviours the client must respect:

- `status=open` means **work not yet resolved** — the server matches both `open`
  and `assigned`. There is no separate "Assigned" tab.
- The queue only returns tickets carrying at least one user message, and caps at
  200 rows.

### Liveness

The socket is an accelerator, never the source of truth. Every event triggers a
REST refetch rather than a local patch, so a dropped event can never leave the
screen disagreeing with the server.

```
ticket:new       → refetch queue
ticket:touched   → refetch queue
status           → refetch queue (+ open ticket, if any)
message          → refetch that ticket, if it is the one on screen
```

Three mobile-specific refetch triggers on top of the web console's one:

| Trigger | Why it is needed |
|---|---|
| socket `connect` | The web console's reconnect hook; events fired while disconnected are never replayed. |
| `AppState` → `active` | A backgrounded phone can have a dead socket that never fires `connect`. This is the only trigger that catches it. |
| `useFocusEffect` on the queue | Returning from a thread must not show a stale row for the ticket just answered. |

Search stays client-side over `rawTickets` — the server takes no search
parameter. Debounce 300ms, matching `ref`, `raisedBy.name` and
`raisedBy.phone`.

The console's `selectedIdRef` stale-response guard is **not** needed here. Each
ticket occupies its own screen, so a late detail response has no other ticket's
thread to land on.

### Unread and stale

Identical rules to `QueueList.tsx`:

- **Unread:** `!staffReadAt || staffReadAt < updatedAt`.
- **Stale:** unread, not closed, and more than 24h since `staffReadAt || createdAt`.
- The row prints `timeAgo(staffReadAt || createdAt)` — the same instant the
  colour is computed from, so the number and the colour answer one question.

The tab badge uses `unreadCount` from the `status=open` queue response.

## Permissions

`server/src/services/admin/permissions.js` already exports `permissionsFor(role)`.

```js
// auth.controller.js — me(), after `const user = await ensurePhoto(req.user)`
// requires a new `permissionsFor` import from ../services/admin/permissions
return ApiResponse.success(res, {
  user, scope: req.scope, permissions: permissionsFor(user.admin_role),
})
```

`AuthContext` stores the array and exposes `can(p)`. Gating:

| Permission | Effect when absent |
|---|---|
| `support.view` | Support tab is not rendered at all |
| `support.reply` | Composer and "Log a call" disabled |
| `support.resolve` | "Mark Resolved" hidden |

Client gating is presentation only. The server keeps its own checks; a client
that gets it wrong gets a 403, not access.

## Error handling

Every write toasts its own failure and then **rethrows**. The caller owns the
text the user typed and decides whether to stay open:

- Reply fails → text stays in the composer, not cleared as though it sent.
- Call log fails → sheet stays open, note intact. A note written straight after
  a call is the one thing nobody can reconstruct.
- Resolve fails → sheet stays open, summary intact. Closing would leave the
  ticket looking resolved when the PATCH was refused.

`markTicketRead` keeps its existing silent-failure behaviour — a read receipt is
not worth an error in the user's face.

The queue's `notDeployed` tag (404/405/501) is surfaced as "support console not
available on this build" rather than a generic error.

## Testing

Server tests already cover the endpoints — `support.access.test.js`,
`support.lifecycle.test.js`, `support.socket.test.js`. One new server test:
`/api/auth/me` returns the correct `permissions` array per `admin_role`, and an
empty array for a student.

The app has no component test setup, so app-side verification is manual on a
device or simulator:

1. Log in as a `support`-role account → Support tab visible, badge shows unread count
2. Open queue → filters and search behave; a >24h unread ticket shows red
3. Open a ticket → thread renders, attachments open, badge decrements
4. Reply → appears in thread; confirm it lands in the student's app
5. Log a call → chip appears in thread, note not visible to the student
6. Resolve → ticket moves to Pending, student sees the confirm card
7. Background the app for a minute, send a message from the student side,
   foreground → thread and queue both update
8. Log in as a `content_manager` account → no Support tab

## Risks

The entire support system lives on `feat/onboarding-intro`, is unmerged, and has
never been run on a physical device. This work adds to that untested surface
rather than validating it. The manual pass above is the first real exercise of
the student side too.

Seven bottom tabs is tight on a small phone. If it reads badly on device, the
fallback is folding a low-traffic tab (Results) into the Home stack rather than
dropping Support.
