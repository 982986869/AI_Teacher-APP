// src/screens/teacher/teacherTime.js
// India-time formatting and lesson state for the teacher dashboard. Pure (no React
// Native) so it is unit-tested. IST has no daylight saving, so a fixed +05:30 is exact —
// and doing the arithmetic by hand avoids depending on the JS engine's time-zone data.
const IST_MS = 330 * 60 * 1000;
const JOIN_EARLY_MS = 10 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── time, in IST ──────────────────────────────────────────────────────────────────
export const istParts = (iso) => { const d = new Date(new Date(iso).getTime() + IST_MS); return { h: d.getUTCHours(), m: d.getUTCMinutes(), day: d.getUTCDay(), date: d.getUTCDate(), month: d.getUTCMonth() }; };
export const timeIST = (iso) => {
  const { h, m } = istParts(iso);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
export const dateIST = (iso) => { const p = istParts(iso); return `${p.date} ${MONTHS[p.month]}`; };
export const longDateIST = (ms) => { const p = istParts(new Date(ms).toISOString()); return `${DAYS_LONG[p.day]}, ${p.date} ${MONTHS[p.month]}`; };
export const greeting = (ms) => { const { h } = istParts(new Date(ms).toISOString()); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

// The lesson's state now, recomputed on the phone so Join opens on time even if the
// dashboard was loaded a while ago.
export function lessonState(l, now) {
  const start = new Date(l.startsAt).getTime();
  const end = new Date(l.endsAt).getTime();
  if (now >= end) return 'over';
  if (now >= start - JOIN_EARLY_MS) return 'joinable';
  return 'upcoming';
}

// "in 25 minutes" / "in 2 h 10 min" / "started 5 min ago" / "Tomorrow, 4:00 PM" / "Mon 1 Dec, 5:00 PM"
export function whenText(l, now) {
  const start = new Date(l.startsAt).getTime();
  const diff = Math.round((start - now) / 60000);
  if (diff <= 0) return diff === 0 ? 'starting now' : `started ${-diff} min ago`;
  if (diff < 60) return `in ${diff} minute${diff === 1 ? '' : 's'}`;
  const sameDay = new Date(start + IST_MS).toISOString().slice(0, 10) === new Date(now + IST_MS).toISOString().slice(0, 10);
  if (sameDay && diff < 12 * 60) return `in ${Math.floor(diff / 60)} h ${diff % 60} min`;
  const tomorrow = new Date(start + IST_MS).toISOString().slice(0, 10) === new Date(now + IST_MS + 86400000).toISOString().slice(0, 10);
  if (sameDay) return `today, ${timeIST(l.startsAt)}`;
  if (tomorrow) return `tomorrow, ${timeIST(l.startsAt)}`;
  const p = istParts(l.startsAt);
  return `${DAYS_LONG[p.day].slice(0, 3)} ${dateIST(l.startsAt)}, ${timeIST(l.startsAt)}`;
}


// ── due dates (homework) — 'YYYY-MM-DD' IST calendar days ─────────────────────────
// Today's IST calendar day.
export const istKey = (ms) => new Date(ms + IST_MS).toISOString().slice(0, 10);
export const addDaysKey = (key, n) => new Date(Date.parse(`${key}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
// "Mon 30 Nov"
export const shortDateKey = (key) => {
  const d = new Date(`${key}T00:00:00Z`);
  return `${DAYS_LONG[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};
// { text, tone } for a homework item. tone: done | overdue | today | soon | later
export function dueLabel(hw, now) {
  if (hw.status === 'done') return { text: 'Done', tone: 'done' };
  const d = daysBetween(istKey(now), hw.dueOn);
  if (d < 0) return { text: d === -1 ? 'Overdue · was due yesterday' : `Overdue · was due ${shortDateKey(hw.dueOn)}`, tone: 'overdue' };
  if (d === 0) return { text: 'Due today', tone: 'today' };
  if (d === 1) return { text: 'Due tomorrow', tone: 'soon' };
  return { text: `Due ${shortDateKey(hw.dueOn)}`, tone: d <= 3 ? 'soon' : 'later' };
}
