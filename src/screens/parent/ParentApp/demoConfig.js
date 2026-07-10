// src/screens/parent/ParentApp/demoConfig.js
// Shared, pure config + helpers for the free demo-class flow. One home for the
// option lists, slot generation, availability, formatting, countdown and join-window
// logic — so the booking flow and the dashboard card never drift apart. No UI, no deps.

export const DEMO_DURATION_MIN = 45;

export const CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
export const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB'];
export const SUBJECTS = ['Maths', 'Physics', 'Chemistry', 'Biology', 'Science', 'English'];
export const GOALS = [
  'Build confidence', 'Improve school grades', 'Board exam prep',
  'Competitive exams (JEE/NEET)', 'Clear the basics', 'Get ahead',
];

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Period → the 1-hour slot start hours (24h). Kept small + realistic.
export const PERIODS = [
  { key: 'Morning', hours: [8, 9, 10, 11] },
  { key: 'Afternoon', hours: [12, 13, 14, 15, 16] },
  { key: 'Evening', hours: [17, 18, 19, 20] },
];

// Next `count` calendar days, each with availability. A deterministic couple of days
// read as "fully booked" so the disabled state is real, not decorative.
export function buildDays(count = 14, now = new Date()) {
  const out = [];
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const fullyBooked = i === 2 || i === 6; // simulated capacity
    // today is only bookable if any slot is still ahead of now (+2h lead time)
    const anySlotLeft = PERIODS.some((p) => p.hours.some((h) => slotIsFuture(d, h, now)));
    out.push({
      key: d.toISOString().slice(0, 10),
      date: d,
      dow: DOW[d.getDay()],
      dayNum: d.getDate(),
      month: MON[d.getMonth()],
      label: `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`,
      available: !fullyBooked && anySlotLeft,
    });
  }
  return out;
}

function slotIsFuture(date, hour24, now) {
  const dt = new Date(date);
  dt.setHours(hour24, 0, 0, 0);
  return dt.getTime() > now.getTime() + 120 * 60000; // 2-hour booking lead time
}

// Slots for a chosen day + period, with availability + a display label.
export function buildSlots(day, periodKey, now = new Date()) {
  const period = PERIODS.find((p) => p.key === periodKey) || PERIODS[1];
  return period.hours.map((h) => {
    const start = new Date(day.date);
    start.setHours(h, 0, 0, 0);
    // deterministic "taken" slots so some show greyed out, plus real past-time gating
    const taken = (day.dayNum + h) % 4 === 0;
    const available = day.available && slotIsFuture(day.date, h, now) && !taken;
    return { hour: h, iso: start.toISOString(), label: fmtSlotLabel(h), available };
  });
}

function pad(n) { return n < 10 ? `0${n}` : `${n}`; }
function ampm(h) { return h < 12 ? 'AM' : 'PM'; }
function h12(h) { const x = h % 12; return x === 0 ? 12 : x; }

// "8:00 – 9:00 AM"
export function fmtSlotLabel(h) {
  const end = (h + 1) % 24;
  const sameHalf = ampm(h) === ampm(end);
  return sameHalf
    ? `${h12(h)}:00 – ${h12(end)}:00 ${ampm(end)}`
    : `${h12(h)}:00 ${ampm(h)} – ${h12(end)}:00 ${ampm(end)}`;
}

export function fmtTime(dateLike) {
  const d = new Date(dateLike);
  return `${h12(d.getHours())}:${pad(d.getMinutes())} ${ampm(d.getHours())}`;
}
export function fmtDateLong(dateLike) {
  const d = new Date(dateLike);
  return `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
}
export function fmtDateShort(dateLike) {
  const d = new Date(dateLike);
  return { dow: DOW[d.getDay()], day: d.getDate(), month: MON[d.getMonth()] };
}

// Join opens 10 min before start; stays open until the class ends.
export function joinWindow(booking, now = new Date()) {
  const start = new Date(booking.date).getTime();
  const end = start + (booking.durationMin || DEMO_DURATION_MIN) * 60000;
  const t = now.getTime();
  const canJoin = t >= start - 10 * 60000 && t <= end;
  const isLive = t >= start && t <= end;
  const ended = t > end;
  return { canJoin, isLive, ended };
}

// Human countdown to the class ("in 2 days", "in 3h 20m", "Starting now").
export function countdown(booking, now = new Date()) {
  const start = new Date(booking.date).getTime();
  const diff = start - now.getTime();
  if (diff <= 0) {
    const { isLive, ended } = joinWindow(booking, now);
    return isLive ? 'Live now' : ended ? 'Completed' : 'Starting now';
  }
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (days >= 1) return `in ${days} day${days > 1 ? 's' : ''}`;
  if (hours >= 1) return `in ${hours}h ${m}m`;
  return `in ${m} min`;
}
