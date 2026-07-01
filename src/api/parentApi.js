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
