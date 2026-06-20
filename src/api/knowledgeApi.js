import axiosInstance from './axiosInstance';

// Knowledge (RAG) API client. The JWT is attached automatically by the
// axiosInstance request interceptor. The backend wraps every response as
// { success, message, data }, so we return `res.data.data` to callers.
//
// The Voyage embedding key lives ONLY on the backend — the app never sees it.

// POST /api/ai/knowledge-answer
//   → { grounded, chunksUsed, confidence, sources: [{ sourceId, title, similarity }], answer }
// Answers a student question STRICTLY from uploaded material (or refuses).
export const askKnowledge = async ({ question, subject, gradeLevel, topK, sourceIds }) => {
  const body = { question };
  if (subject) body.subject = subject;
  if (gradeLevel) body.gradeLevel = gradeLevel;
  if (topK) body.topK = topK;
  if (Array.isArray(sourceIds) && sourceIds.length) body.sourceIds = sourceIds;
  const res = await axiosInstance.post('/api/ai/knowledge-answer', body);
  return res.data.data;
};

// GET /api/knowledge/sources → { sources, total }
export const listKnowledgeSources = async (params = {}) => {
  const res = await axiosInstance.get('/api/knowledge/sources', { params });
  return res.data.data;
};

// POST /api/knowledge/upload  (TEACHER/ADMIN)
// Pasted notes / plain text path — sends JSON (no file). → { source }
export const uploadKnowledgeText = async ({ title, description, subject, gradeLevel, text, type }) => {
  const res = await axiosInstance.post('/api/knowledge/upload', {
    title,
    description,
    subject,
    gradeLevel,
    text,
    type: type || 'text',
  });
  return res.data.data;
};

// DELETE /api/knowledge/sources/:id  (TEACHER/ADMIN) → { id }
export const deleteKnowledgeSource = async (id) => {
  const res = await axiosInstance.delete(`/api/knowledge/sources/${id}`);
  return res.data.data;
};
