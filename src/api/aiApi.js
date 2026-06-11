import axiosInstance from './axiosInstance';

// All AI endpoints require a valid JWT — the token is attached automatically by
// the axiosInstance request interceptor, so nothing auth-related is needed here.
//
// The backend wraps every response as { success, message, data }, so we unwrap
// `res.data.data` and return the payload directly to callers.

// POST /api/ai/lesson/generate → { lessonId, lesson }
export const generateLesson = async ({ topic, subject, gradeLevel }) => {
  const res = await axiosInstance.post('/api/ai/lesson/generate', {
    topic,
    subject,
    gradeLevel,
  });
  return res.data.data;
};

// POST /api/ai/lesson/:lessonId/doubt → { answer, sessionId, messageId }
export const askDoubt = async (lessonId, { question, slideIndex }) => {
  const body = { question };
  if (slideIndex !== undefined && slideIndex !== null) body.slideIndex = slideIndex;
  const res = await axiosInstance.post(`/api/ai/lesson/${lessonId}/doubt`, body);
  return res.data.data;
};
