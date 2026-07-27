import axiosInstance from './axiosInstance';

// Parent (read-only) — link to a child and fetch the child's progress report.
export const linkChild = async ({ email, phone }) => {
  const res = await axiosInstance.post('/api/parent/link-child', { email, phone });
  return res.data.data;
};

export const getParentReport = async () => {
  const res = await axiosInstance.get('/api/parent/report');
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
    console.log('[Parent] calendar fetch failed', err.response?.status || err.message);
    return { days: [], firstActivity: null };
  }
};

export const getProgressDay = async (date) => {
  try {
    const res = await axiosInstance.get('/api/parent/progress/day', { params: { date } });
    return res.data.data;
  } catch (err) {
    console.log('[Parent] day fetch failed', err.response?.status || err.message);
    return null;
  }
};
