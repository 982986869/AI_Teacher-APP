import axiosInstance from './axiosInstance';

// Parent (read-only) — link to a child and fetch the child's progress report.
export const linkChild = async ({ email, phone }) => {
  const res = await axiosInstance.post('/api/parent/link-child', { email, phone });
  return res.data.data;
};

// `fresh` (pull-to-refresh) bypasses the server's short-lived report cache.
export const getParentReport = async (fresh = false) => {
  const res = await axiosInstance.get('/api/parent/report', fresh ? { params: { fresh: 1 } } : undefined);
  return res.data.data;
};
