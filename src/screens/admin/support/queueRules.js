// src/screens/admin/support/queueRules.js
// The queue's read/stale rules, kept out of the screen so they can be read in one sitting
// and checked against the web console's copy of them (admin/components/support/QueueList.tsx).
// Pure functions only — no React, no tokens.
import { PARENT_CATEGORIES, STUDENT_CATEGORIES } from '../../../components/support/supportConfig';

// 'open' is the SERVER's word for work-not-yet-resolved and matches both `open` and
// `assigned`. There is deliberately no separate Assigned tab: "somebody's name is on it"
// is not a different pile of work, it is the same pile.
export const STATUS_TABS = [
  { k: 'open', l: 'Open' },
  { k: 'pending_confirmation', l: 'Pending' },
  { k: 'closed', l: 'Closed' },
  { k: 'all', l: 'All' },
];

// Derived from the topic config rather than typed out again, so a team added to a category
// becomes a filter here without anybody remembering a second list exists.
export const SUPPORT_TEAMS = Array.from(
  new Set([...PARENT_CATEGORIES, ...STUDENT_CATEGORIES].map((c) => c.team).filter(Boolean)),
);

export const isUnread = (t) =>
  !t.staffReadAt || new Date(t.staffReadAt) < new Date(t.updatedAt);

// The one instant staleness is measured from, and therefore the one the row must show.
// Printing `createdAt` while colouring by a clock that runs from `staffReadAt` produced a
// red "3 days ago" on a ticket read 25 hours ago — which reads as three days ignored. The
// number and the colour have to answer the same question.
export const staleSince = (t) => t.staffReadAt || t.createdAt;

const STALE_MS = 24 * 60 * 60 * 1000;

// A ticket unread for over a day is the failure this console exists to prevent — with one
// person on support there is no colleague to notice it. Marked red, not merely sorted first.
export function isStale(t) {
  if (t.status === 'closed' || !isUnread(t)) return false;
  return Date.now() - new Date(staleSince(t)).getTime() > STALE_MS;
}

// Client-side: the server's /queue takes no search parameter, and it caps at 200 rows, so
// this filters what is already in hand rather than triggering a refetch per keystroke.
export function matchesQuery(t, q) {
  const s = (q || '').trim().toLowerCase();
  if (!s) return true;
  const by = t.raisedBy || {};
  return (t.ref || '').toLowerCase().includes(s)
    || (by.name || '').toLowerCase().includes(s)
    || (by.phone || '').includes(s);
}
