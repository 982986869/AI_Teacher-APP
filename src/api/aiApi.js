import axiosInstance from './axiosInstance';

// All AI endpoints require a valid JWT — the token is attached automatically by
// the axiosInstance request interceptor, so nothing auth-related is needed here.
//
// The backend wraps every response as { success, message, data }, so we unwrap
// `res.data.data` and return the payload directly to callers.

// POST /api/ai/lesson/generate → { lessonId, lesson }
export const generateLesson = async ({ topic, subject, gradeLevel }) => {
  // Full lesson generation by Opus can take 30–90s — allow up to 2 minutes.
  const res = await axiosInstance.post('/api/ai/lesson/generate', {
    topic,
    subject,
    gradeLevel,
  }, { timeout: 120000 });
  return res.data.data;
};

// GET /api/ai/lesson/:lessonId → { lesson }
export const getLesson = async (lessonId) => {
  const res = await axiosInstance.get(`/api/ai/lesson/${lessonId}`);
  return res.data.data;
};

// POST /api/ai/lesson/:lessonId/doubt → { answer, sessionId, messageId }
export const askDoubt = async (lessonId, { question, slideIndex }) => {
  const body = { question };
  if (slideIndex !== undefined && slideIndex !== null) body.slideIndex = slideIndex;
  const res = await axiosInstance.post(`/api/ai/lesson/${lessonId}/doubt`, body);
  return res.data.data;
};
