import axiosInstance from './axiosInstance';

// Online Tests API client. Responses are wrapped as { success, message, data };
// we return res.data.data. JWT is attached by the axios interceptor.

// GET /api/online-tests/chapters?subject=Physics → { chapters:[{ chapterId, chapterName, testCount, questionCount }], total }
export const listOnlineChapters = async (subject) => {
  const res = await axiosInstance.get('/api/online-tests/chapters', { params: subject ? { subject } : {} });
  return res.data.data;
};

// GET /api/online-tests/chapters/:chapterId/tests → { tests:[{ id, name, questionCount }], total }
export const listOnlineTests = async (chapterId) => {
  const res = await axiosInstance.get(`/api/online-tests/chapters/${chapterId}/tests`);
  return res.data.data;
};

// GET /api/online-tests/tests/:testId/questions
//   → { test, questions:[{ id, text, options:[{ key, label }], correctAnswer, explanation }], total }
export const getOnlineTestQuestions = async (testId) => {
  const res = await axiosInstance.get(`/api/online-tests/tests/${testId}/questions`);
  return res.data.data;
};

// POST /api/online-tests/tests/:testId/submit  body { answers: { [questionId]: <letter> } }
export const submitOnlineTest = async (testId, { answers } = {}) => {
  const res = await axiosInstance.post(`/api/online-tests/tests/${testId}/submit`, { answers: answers || {} });
  return res.data.data;
};
