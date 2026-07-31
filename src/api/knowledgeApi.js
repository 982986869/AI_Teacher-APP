import axiosInstance from './axiosInstance';
import { API_BASE_URL } from '../constants/config';
import { getToken } from '../utils/storage';

// Server base URL, normalised like axiosInstance (no trailing slash / "/api").
const STREAM_BASE = String(API_BASE_URL || '').replace(/\/+$/, '').replace(/\/api$/i, '');

// Parse one SSE record ("event: x\ndata: {...}") into { event, data }.
function parseSSE(raw) {
  let event = 'message';
  let data = '';
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  let parsed = {};
  try { parsed = data ? JSON.parse(data) : {}; } catch (e) { parsed = {}; }
  return { event, data: parsed };
}

// Knowledge (RAG) API client. The JWT is attached automatically by the
// axiosInstance request interceptor. The backend wraps every response as
// { success, message, data }, so we return `res.data.data` to callers.
//
// The Voyage embedding key lives ONLY on the backend — the app never sees it.

// POST /api/ai/knowledge-answer
//   → { grounded, chunksUsed, confidence, sources: [{ sourceId, title, similarity }], answer }
// Answers a student question STRICTLY from uploaded material (or refuses).
export const askKnowledge = async ({ question, subject, gradeLevel, topK, sourceIds, history }) => {
  const body = { question };
  if (subject) body.subject = subject;
  if (gradeLevel) body.gradeLevel = gradeLevel;
  if (topK) body.topK = topK;
  if (Array.isArray(sourceIds) && sourceIds.length) body.sourceIds = sourceIds;
  // Prior chat turns (role: 'USER' | 'ASSISTANT'), so the AI can ask + resolve
  // clarifying questions across turns.
  if (Array.isArray(history) && history.length) body.history = history.slice(-20);
  const res = await axiosInstance.post('/api/ai/knowledge-answer', body);
  return res.data.data;
};

// POST /api/ai/knowledge-answer/structured
//   → { grounded, confidence, sources, teaching: { title, intro, steps, formula,
//        example, quickCheck, diagram, gaps } }
// Grounded answer as a structured "teaching" object so the app can draw a
// whiteboard diagram + render math. Non-streaming (the payload is small JSON).
export const askKnowledgeStructured = async ({ question, subject, gradeLevel, topK, sourceIds, history }) => {
  const body = { question };
  if (subject) body.subject = subject;
  if (gradeLevel) body.gradeLevel = gradeLevel;
  if (topK) body.topK = topK;
  if (Array.isArray(sourceIds) && sourceIds.length) body.sourceIds = sourceIds;
  if (Array.isArray(history) && history.length) body.history = history.slice(-20);
  const res = await axiosInstance.post('/api/ai/knowledge-answer/structured', body);
  return res.data.data;
};

// POST /api/ai/knowledge-answer/extend
//   → { beyondMaterial: true, sources, teaching: {...} }
// On-demand gap-filling — general knowledge IS allowed here (worked example /
// full solution / who-gave-this). `gapKind` steers the task. The UI MUST label
// the result clearly as "beyond your material".
export const extendKnowledge = async ({ question, gapKind, subject, gradeLevel, topK, sourceIds, history }) => {
  const body = { question };
  if (gapKind) body.gapKind = gapKind;
  if (subject) body.subject = subject;
  if (gradeLevel) body.gradeLevel = gradeLevel;
  if (topK) body.topK = topK;
  if (Array.isArray(sourceIds) && sourceIds.length) body.sourceIds = sourceIds;
  if (Array.isArray(history) && history.length) body.history = history.slice(-20);
  const res = await axiosInstance.post('/api/ai/knowledge-answer/extend', body);
  return res.data.data;
};

// Streaming version of askKnowledge (SSE over XHR — RN-compatible). Calls
// onMeta({ grounded, confidence, sources }) once retrieval finishes, then
// onDelta(textChunk) as the answer streams. Resolves with the final payload.
export const askKnowledgeStream = ({ question, subject, gradeLevel, topK, sourceIds, history }, { onMeta, onDelta } = {}) =>
  new Promise((resolve, reject) => {
    (async () => {
      const token = await getToken().catch(() => null);
      const body = { question };
      if (subject) body.subject = subject;
      if (gradeLevel) body.gradeLevel = gradeLevel;
      if (topK) body.topK = topK;
      if (Array.isArray(sourceIds) && sourceIds.length) body.sourceIds = sourceIds;
      if (Array.isArray(history) && history.length) body.history = history.slice(-20);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${STREAM_BASE}/api/ai/knowledge-answer/stream`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'text/event-stream');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      let seen = 0;
      let buffer = '';
      let final = null;
      let failed = null;

      const drain = () => {
        const full = xhr.responseText || '';
        buffer += full.slice(seen);
        seen = full.length;
        let idx;
        while ((idx = buffer.indexOf('\n\n')) >= 0) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          if (!raw.trim()) continue;
          const { event, data } = parseSSE(raw);
          if (event === 'meta') { if (onMeta) onMeta(data); }
          else if (event === 'delta') { if (onDelta && data && data.t) onDelta(data.t); }
          else if (event === 'done') { final = data; }
          else if (event === 'error') { failed = new Error(data.error || 'stream error'); }
        }
      };

      xhr.onprogress = drain;
      xhr.onload = () => { drain(); if (failed) reject(failed); else resolve(final || {}); };
      xhr.onerror = () => reject(new Error('stream connection failed'));
      xhr.ontimeout = () => reject(new Error('stream timed out'));
      xhr.timeout = 60000;
      xhr.send(JSON.stringify(body));
    })().catch(reject);
  });

// POST /api/knowledge/solve-photo  (multipart image + optional `hint` text)
//   → { fromPhoto: true, teaching: {...} }
// Reads a homework question from a photo and returns a step-by-step solution.
// `file` is an RN file object { uri, name, type }; `hint` is the student's typed
// instruction (which question / how they want it), sent alongside the image.
export const solvePhoto = async ({ file, hint }) => {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name || `question-${Date.now()}.jpg`,
    type: file.type || 'image/jpeg',
  });
  if (hint && hint.trim()) form.append('hint', hint.trim());
  const res = await axiosInstance.post('/api/knowledge/solve-photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // vision read + solve can take a few seconds
  });
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

// POST /api/knowledge/upload  (any authenticated user)
// File path — sends multipart/form-data. `file` is a React Native file object
// { uri, name, type } from expo-document-picker or expo-image-picker. PDFs and
// images are transcribed server-side (Claude vision) before indexing, so this
// request can take several seconds. → { source }
export const uploadKnowledgeFile = async ({ file, title, subject, gradeLevel, description }) => {
  const form = new FormData();
  // RN FormData needs the file as { uri, name, type }.
  form.append('file', {
    uri: file.uri,
    name: file.name || 'upload',
    type: file.type || 'application/octet-stream',
  });
  form.append('title', title);
  if (subject) form.append('subject', subject);
  if (gradeLevel) form.append('gradeLevel', gradeLevel);
  if (description) form.append('description', description);

  const res = await axiosInstance.post('/api/knowledge/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Transcription + embedding of a multi-page PDF can be slow.
    timeout: 120000,
  });
  return res.data.data;
};

// DELETE /api/knowledge/sources/:id  → { id }  (own material, or teacher/admin)
export const deleteKnowledgeSource = async (id) => {
  const res = await axiosInstance.delete(`/api/knowledge/sources/${id}`);
  return res.data.data;
};
