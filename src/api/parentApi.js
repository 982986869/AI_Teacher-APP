import axiosInstance from './axiosInstance';
import { reportWarn } from '../utils/errorLog';

// Parent (read-only) — link to a child and fetch the child's progress report.
export const linkChild = async ({ email, phone }) => {
  const res = await axiosInstance.post('/api/parent/link-child', { email, phone });
  return res.data.data;
};

// A parent account may hold more than one child. `children` lists them (with the
// active one flagged), `setActiveChild` chooses which one the app shows, and
// `unlinkChild` removes one — the server picks a remaining child as the new active
// if the removed one was on screen.
export const getChildren = async () => {
  const res = await axiosInstance.get('/api/parent/children');
  return res.data.data || { children: [], activeChildId: null };
};

export const setActiveChild = async (childId) => {
  const res = await axiosInstance.post('/api/parent/active-child', { childId });
  return res.data.data;
};

export const unlinkChild = async (childId) => {
  const res = await axiosInstance.delete(`/api/parent/children/${childId}`);
  return res.data.data;
};

// `fresh` (pull-to-refresh) bypasses the server's short-lived report cache.
export const getParentReport = async (fresh = false) => {
  const res = await axiosInstance.get('/api/parent/report', fresh ? { params: { fresh: 1 } } : undefined);
  return res.data.data;
};

// GET /api/parent/progress/day?date=YYYY-MM-DD — what the child actually did on one
// day. Returns null on failure so the day view can show its empty state instead of
// breaking the whole Progress tab.
// GET /api/parent/progress/calendar?from=&to= — the days in a visible range that had
// any activity (the dots), plus the child's first-ever activity date, which bounds
// how far back the month picker goes.
export const getProgressCalendar = async (from, to) => {
  try {
    const res = await axiosInstance.get('/api/parent/progress/calendar', { params: { from, to } });
    const d = res.data.data || {};
    return { days: d.days || [], firstActivity: d.firstActivity || null };
  } catch (err) {
    reportWarn('api/parentApi.js:getProgressCalendar', err, { from, to });
    return { days: [], firstActivity: null };
  }
};

export const getProgressDay = async (date) => {
  try {
    const res = await axiosInstance.get('/api/parent/progress/day', { params: { date } });
    return res.data.data;
  } catch (err) {
    reportWarn('api/parentApi.js:getProgressDay', err, { date });
    return null;
  }
};

// ── Free demo-class booking ──────────────────────────────────────────────────
// The server row is snake_case-free already (toApi), but the dashboard card, the
// countdown helpers and the device-calendar sync all read `date` / `durationMin` /
// `meetingUrl`, so the API shape is adapted once here rather than at each reader.
export const toAppBooking = (b) => (b ? {
  id: b.id,
  date: b.slotAt,
  durationMin: b.durationMin,
  meetingUrl: b.meetLink,
  subject: b.subject,
  childName: b.childName,
  childClass: b.childClass,
  board: b.board,
  parentEmail: b.parentEmail,
  mailStatus: b.mailStatus,
} : null);

// POST /api/parent/trial-bookings. Throws on failure with `status` and the server's
// own message, so the flow can say "already booked" / "not set up yet" verbatim.
export const createTrialBooking = async (input) => {
  try {
    const res = await axiosInstance.post('/api/parent/trial-bookings', input);
    const d = res.data.data || {};
    return { booking: toAppBooking(d.booking), mailSent: d.mailSent !== false };
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.error || "Couldn't book the slot — please try again.";
    const e = new Error(message);
    e.status = status;
    throw e;
  }
};

export const getUpcomingTrialBooking = async () => {
  try {
    const res = await axiosInstance.get('/api/parent/trial-bookings/upcoming');
    return toAppBooking(res.data.data?.booking || null);
  } catch (err) {
    reportWarn('api/parentApi.js:getUpcomingTrialBooking', err);
    return null;
  }
};

export const cancelTrialBooking = async (id) => {
  try {
    await axiosInstance.post(`/api/parent/trial-bookings/${encodeURIComponent(id)}/cancel`);
    return true;
  } catch (err) {
    reportWarn('api/parentApi.js:cancelTrialBooking', err, { id });
    return false;
  }
};

// ── The CHILD's side of linking ──────────────────────────────────────────────
// A parent linking is something that happens TO a student: until now they only
// found out by email, which is not a notification for someone who reads the app
// and not their inbox. These two let the student app say so, once.
//
// Neither throws: a missed notice must never cost a student their Home screen.
export const getLinkNotices = async () => {
  try {
    const res = await axiosInstance.get('/api/parent/link-notices');
    const d = res.data?.data ?? res.data;
    return Array.isArray(d?.notices) ? d.notices : [];
  } catch { return []; }
};

// Acknowledged separately from the read, so a notice is never lost to a request
// that arrived while the response did not — a repeat costs a second popup, a
// premature mark costs the student the only notice they get.
export const ackLinkNotices = async (ids) => {
  try { await axiosInstance.post('/api/parent/link-notices/ack', { ids }); } catch { /* retried next launch */ }
};
