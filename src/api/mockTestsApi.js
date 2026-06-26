import axiosInstance from './axiosInstance';

// Mock tests API client. Responses are wrapped as { success, message, data };
// we return res.data.data. JWT is attached by the axios interceptor.

// GET /api/mock-tests?subject=Physics&class=12 → { tests, total }
// classLevel (9–12) separates Class 12 mocks from Class 11; defaults to 11.
export const listMockTests = async (subject = 'Physics', classLevel = 11) => {
  const res = await axiosInstance.get('/api/mock-tests', { params: { ...(subject ? { subject } : {}), class: classLevel } });
  return res.data.data;
};

// GET /api/mock-tests/attempts?subject=Physics&class=12 → { attempts:[{ testId, attempts, bestScore, total }] }
export const listMockAttempts = async (subject, classLevel = 11) => {
  const res = await axiosInstance.get('/api/mock-tests/attempts', { params: { ...(subject ? { subject } : {}), class: classLevel } });
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
