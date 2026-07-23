import axiosInstance from './axiosInstance';

// "My Progress" dashboard for the signed-in student — overview totals, activity
// hours, per-subject breakdown, and recent tests. All real data, scoped to the
// user (and their class) on the server.
//   period = 'week' | 'month' | 'all'
//   offset = 0 (current) | 1 (previous period) | 2 … (further back)
export const getResults = async (period = 'week', offset = 0) => {
  const res = await axiosInstance.get('/api/learning/results', { params: { period, offset } });
  return res.data.data;
};

// Section-wise breakdown for one mock-test attempt → { sections: [...] }.
export const getAttemptDetail = async (id) => {
  const res = await axiosInstance.get(`/api/learning/results/attempt/${id}`);
  return res.data.data;
};

// "Your learning" — the per-concept mastery profile the AI Teacher now remembers
// and personalises lessons from. { totalConcepts, averageMastery, averageRetention,
// byState, mastered[], strong[], needsRevision[], weak[], highlights[] }.
export const getLearningProfile = async (subject) => {
  const res = await axiosInstance.get('/api/learning/profile', { params: subject ? { subject } : {} });
  return res.data.data;
};

// Composed learning snapshot (concept states, mastered, revision-due, streak,
// accuracy, recommended next) — used for the header/summary of the screen.
export const getLearningAnalytics = async () => {
  const res = await axiosInstance.get('/api/learning/analytics');
  return res.data.data;
};
