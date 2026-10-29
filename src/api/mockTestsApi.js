import axiosInstance from './axiosInstance';

// Mock tests API client. Responses are wrapped as { success, message, data };
// we return res.data.data. JWT is attached by the axios interceptor.

// GET /api/mock-tests?subject=Physics&class=12 → { tests, total }
// classLevel (9–12) separates Class 12 mocks from Class 11; defaults to 11.
export const listMockTests = async (subject = 'Physics', classLevel) => {
  const res = await axiosInstance.get('/api/mock-tests', { params: { ...(subject ? { subject } : {}), class: classLevel } });
  return res.data.data;
};

// GET /api/mock-tests/attempts?subject=Physics&class=12 → { attempts:[{ testId, attempts, bestScore, total }] }
export const listMockAttempts = async (subject, classLevel) => {
  const res = await axiosInstance.get('/api/mock-tests/attempts', { params: { ...(subject ? { subject } : {}), class: classLevel } });
  return res.data.data;
};

// GET /api/mock-tests/:id/questions?class=9
//   → { test, questions:[{ id, question, options:[strings], correct, cat, explanation }], total }
// classLevel is the class being viewed: without it the server checks the test against
// the student's saved class, so opening a mock while browsing another class was refused.
export const getMockTestQuestions = async (id, classLevel) => {
  const res = await axiosInstance.get(`/api/mock-tests/${id}/questions`,
    { params: classLevel ? { class: classLevel } : undefined });
  return res.data.data;
};

// POST /api/mock-tests/:id/submit?class=9  body { answers:{ [questionId]: selectedIndex }, timeTakenSec }
export const submitMockTest = async (id, { answers, timeTakenSec } = {}, classLevel) => {
  const res = await axiosInstance.post(`/api/mock-tests/${id}/submit`,
    { answers: answers || {}, timeTakenSec: timeTakenSec || 0 },
    { params: classLevel ? { class: classLevel } : undefined });
  return res.data.data;
};
