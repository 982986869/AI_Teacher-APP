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

// POST /api/ai/ask → the unified AI Teacher agent. Returns
// { intent, language, grounded, confidence, sources, answer, resumeCue, ... }.
// Used for in-lesson doubts and free-form questions (intent + RAG + teacher style).
export const askAgent = async ({ text, subject, gradeLevel, lessonId, slideIndex, history, level, pending }) => {
  const body = { text };
  if (subject) body.subject = subject;
  if (gradeLevel) body.gradeLevel = gradeLevel;
  if (lessonId) body.lessonId = lessonId;
  if (slideIndex !== undefined && slideIndex !== null) body.slideIndex = slideIndex;
  if (Array.isArray(history) && history.length) body.history = history;
  if (level) body.level = level;
  if (pending) body.pending = pending; // carries quiz / understanding-check state forward
  const res = await axiosInstance.post('/api/ai/ask', body, { timeout: 30000 });
  return res.data.data;
};

// GET /api/ai/plan → { action, subject, chapter, reason, weakChapters }
// "What should I study next?" — the existing planner (revise vs learn vs review).
export const getStudyPlan = async (subject) => {
  const res = await axiosInstance.get('/api/ai/plan', {
    params: subject ? { subject } : undefined,
  });
  return res.data.data;
};

// POST /api/ai/revision → generated weak-topic revision (recap + a quick-check quiz).
// Returns { mode, focus, weakChapters, recap, answer, pending, ... }.
export const startRevision = async (subject) => {
  const body = subject ? { subject } : {};
  const res = await axiosInstance.post('/api/ai/revision', body, { timeout: 30000 });
  return res.data.data;
};

// POST /api/ai/lesson/:id/progress → records position, study time & current concept.
// Best-effort telemetry from the live player; failures never block playback.
export const updateLessonProgress = async (lessonId, { slideIndex, total, studyTimeSeconds, concept }) => {
  const body = { slideIndex };
  if (total != null) body.total = total;
  if (studyTimeSeconds != null) body.studyTimeSeconds = studyTimeSeconds;
  if (concept) body.concept = concept;
  const res = await axiosInstance.post(`/api/ai/lesson/${lessonId}/progress`, body);
  return res.data.data;
};

// GET /api/ai/lessons/progress → user's lessons merged with progress (completed/resume).
export const getLessonsProgress = async () => {
  const res = await axiosInstance.get('/api/ai/lessons/progress');
  return res.data.data;
};

// ── AI Teacher lesson library (admin-authored, published catalog) ──────────────
// Browse Subjects → Chapters → Lessons, then play a lesson on the real player.
const clsParam = (cls) => (cls != null && cls !== '' ? { params: { class: cls } } : undefined);
export const getCatalogSubjects = async (cls) => {
  const res = await axiosInstance.get('/api/ai/catalog/subjects', clsParam(cls));
  return res.data.data;
};
export const getCatalogChapters = async (subjectId, cls) => {
  const res = await axiosInstance.get(`/api/ai/catalog/subjects/${subjectId}/chapters`, clsParam(cls));
  return res.data.data;
};
export const getCatalogLessons = async (chapterId, cls) => {
  const res = await axiosInstance.get(`/api/ai/catalog/chapters/${chapterId}/lessons`, clsParam(cls));
  return res.data.data;
};
export const getCatalogLesson = async (id, cls) => {
  const res = await axiosInstance.get(`/api/ai/catalog/lessons/${id}`, clsParam(cls));
  return res.data.data;
};
export const getCatalogResume = async (cls) => {
  const res = await axiosInstance.get('/api/ai/catalog/resume', clsParam(cls));
  return res.data.data;
};

// GET /api/ai/chapters/progress → per-chapter completion %, weak/strong, recommended.
export const getChapterProgress = async (subject) => {
  const res = await axiosInstance.get('/api/ai/chapters/progress', {
    params: subject ? { subject } : undefined,
  });
  return res.data.data;
};

// GET /api/ai/session/resume → "Welcome back" continuity snapshot.
// { hasHistory, name, daysSince, last:{subject,chapter,at}, focusConcept, greeting, suggestion }.
export const getResumeContext = async (subject) => {
  const res = await axiosInstance.get('/api/ai/session/resume', {
    params: subject ? { subject } : undefined,
  });
  return res.data.data;
};

// GET /api/ai/memory/summary → progress snapshot.
// { chaptersEngaged, totalDoubts, totalMistakes, quizAccuracy, quiz,
//   weakChapters, strongChapters, recentActivity }.
export const getMemorySummary = async () => {
  const res = await axiosInstance.get('/api/ai/memory/summary');
  return res.data.data;
};

// Streaming agent call (SSE over XHR — RN-compatible, no extra library). Calls
// onMeta/onDelta as events arrive and resolves with the final `done` payload
// (same shape as askAgent). Lets the teacher start speaking sentence-by-sentence.
export const askAgentStream = ({ text, subject, gradeLevel, lessonId, slideIndex, history, level, pending }, { onMeta, onDelta } = {}) =>
  new Promise((resolve, reject) => {
    (async () => {
      const token = await getToken().catch(() => null);
      const body = { text };
      if (subject) body.subject = subject;
      if (gradeLevel) body.gradeLevel = gradeLevel;
      if (lessonId) body.lessonId = lessonId;
      if (slideIndex !== undefined && slideIndex !== null) body.slideIndex = slideIndex;
      if (Array.isArray(history) && history.length) body.history = history;
      if (level) body.level = level;
      if (pending) body.pending = pending;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${STREAM_BASE}/api/ai/ask/stream`);
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
      xhr.timeout = 45000;
      xhr.send(JSON.stringify(body));
    })().catch(reject);
  });
