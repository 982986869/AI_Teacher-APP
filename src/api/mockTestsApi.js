import axiosInstance from './axiosInstance';

// Mock tests API client. Responses are wrapped as { success, message, data };
// we return res.data.data. JWT is attached by the axios interceptor.

// GET /api/mock-tests?subject=Physics → { tests, total }
export const listMockTests = async (subject = 'Physics') => {
  const res = await axiosInstance.get('/api/mock-tests', { params: subject ? { subject } : {} });
  return res.data.data;
};

// GET /api/mock-tests/attempts?subject=Physics → { attempts:[{ testId, attempts, bestScore, total }] }
export const listMockAttempts = async (subject) => {
  const res = await axiosInstance.get('/api/mock-tests/attempts', { params: subject ? { subject } : {} });
  return res.data.data;
};

// GET /api/mock-tests/:id/questions
//   → { test, questions:[{ id, question, options:[strings], correct, cat, explanation }], total }
export const getMockTestQuestions = async (id) => {
  const res = await axiosInstance.get(`/api/mock-tests/${id}/questions`);
  return res.data.data;
};

// POST /api/mock-tests/:id/submit  body { answers:{ [questionId]: selectedIndex }, timeTakenSec }
export const submitMockTest = async (id, { answers, timeTakenSec } = {}) => {
  const res = await axiosInstance.post(`/api/mock-tests/${id}/submit`, { answers: answers || {}, timeTakenSec: timeTakenSec || 0 });
  return res.data.data;
};
