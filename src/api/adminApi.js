// src/api/adminApi.js
// Thin client for the EXISTING /api/admin/* backend (the same endpoints the Next.js
// portal used — unchanged). Every call goes through the shared axiosInstance, so the
// signed-in admin's JWT is attached automatically and 401/retry handling is inherited.
// The backend wraps responses as { success, data }; we unwrap to `.data`.
import axiosInstance from './axiosInstance';

const unwrap = (res) => res.data?.data;

// Build a query string, dropping empty/undefined/null values (mirrors the web api()).
const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

// ── Admin identity ───────────────────────────────────────────────────────────
export const getAdminMe = () => axiosInstance.get('/api/admin/auth/me').then(unwrap);

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const getAdminDashboard = () => axiosInstance.get('/api/admin/dashboard').then(unwrap);
export const getAdminModules = () => axiosInstance.get('/api/admin/modules').then(unwrap);

// ── Sessions (admin manages the same rows the Student Sessions tab reads) ────────
export const getAdminSessions = (params) => axiosInstance.get(`/api/admin/sessions${qs(params)}`).then(unwrap);
export const getAdminSession = (id) => axiosInstance.get(`/api/admin/sessions/${id}`).then(unwrap);
export const createAdminSession = (body) => axiosInstance.post('/api/admin/sessions', body).then(unwrap);
export const updateAdminSession = (id, body) => axiosInstance.patch(`/api/admin/sessions/${id}`, body).then(unwrap);
export const setAdminSessionStatus = (id, status) => axiosInstance.post(`/api/admin/sessions/${id}/status`, { status }).then(unwrap);
export const deleteAdminSession = (id) => axiosInstance.delete(`/api/admin/sessions/${id}`).then(unwrap);

// ── Users (students / team) ──────────────────────────────────────────────────────
export const getAdminUsers = (params) => axiosInstance.get(`/api/admin/users${qs(params)}`).then(unwrap);
export const getAdminUsersMeta = () => axiosInstance.get('/api/admin/users/meta').then(unwrap);
export const getAdminUser = (id) => axiosInstance.get(`/api/admin/users/${id}`).then(unwrap);
export const setAdminUserStatus = (id, isActive) => axiosInstance.patch(`/api/admin/users/${id}/status`, { isActive }).then(unwrap);
export const setAdminUserRole = (id, adminRole) => axiosInstance.patch(`/api/admin/users/${id}/role`, { adminRole }).then(unwrap);
export const resetAdminUserPassword = (id) => axiosInstance.post(`/api/admin/users/${id}/reset-password`, {}).then(unwrap);
export const deleteAdminUser = (id) => axiosInstance.delete(`/api/admin/users/${id}`).then(unwrap);

// ── Learning / CMS content tree (cms_nodes: board→class→subject→chapter→topic→lesson) ──
// All of these already exist server-side (controllers/admin/cms.controller.js). The tree
// is generic — `level` is derived from the parent on create, so one set of calls manages
// every level. Publishing writes an immutable version snapshot and flips status→published.
export const getCmsMeta = () => axiosInstance.get('/api/admin/cms/meta').then(unwrap);
export const getCmsNodes = (params) => axiosInstance.get(`/api/admin/cms/nodes${qs(params)}`).then(unwrap);
export const getCmsNode = (id) => axiosInstance.get(`/api/admin/cms/nodes/${id}`).then(unwrap);
export const getCmsNodeVersions = (id) => axiosInstance.get(`/api/admin/cms/nodes/${id}/versions`).then(unwrap);
export const createCmsNode = (body) => axiosInstance.post('/api/admin/cms/nodes', body).then(unwrap);
export const updateCmsNode = (id, body) => axiosInstance.patch(`/api/admin/cms/nodes/${id}`, body).then(unwrap);
export const reorderCmsNodes = (parentId, orderedIds) => axiosInstance.post('/api/admin/cms/nodes/reorder', { parentId, orderedIds }).then(unwrap);
export const setCmsNodeStatus = (id, status, changeSummary) => axiosInstance.post(`/api/admin/cms/nodes/${id}/status`, { status, changeSummary }).then(unwrap);
export const deleteCmsNode = (id, cascade) => axiosInstance.delete(`/api/admin/cms/nodes/${id}${cascade ? '?cascade=true' : ''}`).then(unwrap);
export const duplicateCmsNode = (id) => axiosInstance.post(`/api/admin/cms/nodes/${id}/duplicate`, {}).then(unwrap);
export const getCmsSubtree = (id) => axiosInstance.get(`/api/admin/cms/nodes/${id}/subtree`).then(unwrap);

// ── Tests (Mock Tests — admin manages the same rows the Student Practice flow reads) ──
export const getAdminTests = (params) => axiosInstance.get(`/api/admin/tests${qs(params)}`).then(unwrap);
export const getAdminTestSubjects = (params) => axiosInstance.get(`/api/admin/tests/subjects${qs(params)}`).then(unwrap);
export const getAdminTestClasses = () => axiosInstance.get('/api/admin/tests/classes').then(unwrap);
export const getAdminTest = (id) => axiosInstance.get(`/api/admin/tests/${id}`).then(unwrap);
export const createAdminTest = (body) => axiosInstance.post('/api/admin/tests', body).then(unwrap);
export const updateAdminTest = (id, body) => axiosInstance.patch(`/api/admin/tests/${id}`, body).then(unwrap);
export const setAdminTestStatus = (id, status) => axiosInstance.post(`/api/admin/tests/${id}/status`, { status }).then(unwrap);
export const duplicateAdminTest = (id) => axiosInstance.post(`/api/admin/tests/${id}/duplicate`, {}).then(unwrap);
export const deleteAdminTest = (id) => axiosInstance.delete(`/api/admin/tests/${id}`).then(unwrap);
export const addAdminTestQuestion = (id, body) => axiosInstance.post(`/api/admin/tests/${id}/questions`, body).then(unwrap);
export const updateAdminTestQuestion = (id, qid, body) => axiosInstance.patch(`/api/admin/tests/${id}/questions/${qid}`, body).then(unwrap);
export const duplicateAdminTestQuestion = (id, qid) => axiosInstance.post(`/api/admin/tests/${id}/questions/${qid}/duplicate`, {}).then(unwrap);
export const reorderAdminTestQuestions = (id, orderedIds) => axiosInstance.post(`/api/admin/tests/${id}/questions/reorder`, { orderedIds }).then(unwrap);
export const removeAdminTestQuestion = (id, qid) => axiosInstance.delete(`/api/admin/tests/${id}/questions/${qid}`).then(unwrap);

// ── Resources (browse subjects; manage chapters + previous-year papers) ─────────
export const getAdminResourceSubjects = (params) => axiosInstance.get(`/api/admin/resources/subjects${qs(params)}`).then(unwrap);
export const getAdminResourceClasses = () => axiosInstance.get('/api/admin/resources/classes').then(unwrap);
export const renameAdminSubject = (id, name) => axiosInstance.patch(`/api/admin/resources/subjects/${id}`, { name }).then(unwrap);
export const getAdminSubjectChapters = (slug, params) => axiosInstance.get(`/api/admin/resources/subjects/${slug}/chapters${qs(params)}`).then(unwrap);
export const createAdminChapter = (slug, body) => axiosInstance.post(`/api/admin/resources/subjects/${slug}/chapters`, body).then(unwrap);
export const updateAdminChapter = (id, body) => axiosInstance.patch(`/api/admin/resources/chapters/${id}`, body).then(unwrap);
export const setAdminChapterStatus = (id, status) => axiosInstance.post(`/api/admin/resources/chapters/${id}/status`, { status }).then(unwrap);
export const reorderAdminChapters = (orderedIds) => axiosInstance.post('/api/admin/resources/chapters/reorder', { orderedIds }).then(unwrap);
export const deleteAdminChapter = (id) => axiosInstance.delete(`/api/admin/resources/chapters/${id}`).then(unwrap);
export const getAdminChapterNotes = (id) => axiosInstance.get(`/api/admin/resources/chapters/${id}/notes`).then(unwrap);
export const saveAdminChapterNotes = (id, body) => axiosInstance.put(`/api/admin/resources/chapters/${id}/notes`, body).then(unwrap);
export const getAdminChapterQuestions = (id, type) => axiosInstance.get(`/api/admin/resources/chapters/${id}/questions/${type}`).then(unwrap);
export const saveAdminChapterQuestions = (id, type, body) => axiosInstance.put(`/api/admin/resources/chapters/${id}/questions/${type}`, body).then(unwrap);
// Upload a question/option image (from expo-image-picker). asset = { uri, mimeType?, fileName? }.
// Returns the public URL to embed as <img> in the question/option HTML.
export const uploadContentImage = (asset) => {
  const uri = asset?.uri || asset;
  const mime = asset?.mimeType || 'image/jpeg';
  const name = asset?.fileName || `image.${(mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`;
  const form = new FormData();
  form.append('file', { uri, name, type: mime });
  return axiosInstance
    .post('/api/admin/resources/upload-image', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
    .then(unwrap);
};
// ── Online Tests (imported examin8 MCQ tests) ──────────────────────────────────
export const getAdminOnlineTestClasses = () => axiosInstance.get('/api/admin/online-tests/classes').then(unwrap);
export const getAdminOnlineTestSubjects = (cls) => axiosInstance.get(`/api/admin/online-tests/subjects${qs({ class: cls })}`).then(unwrap);
export const getAdminOnlineTestChapters = (slug, cls) => axiosInstance.get(`/api/admin/online-tests/subjects/${slug}/chapters${qs({ class: cls })}`).then(unwrap);
export const getAdminOnlineTests = (params) => axiosInstance.get(`/api/admin/online-tests/tests${qs(params)}`).then(unwrap);
export const getAdminOnlineTest = (id) => axiosInstance.get(`/api/admin/online-tests/${id}`).then(unwrap);
export const reorderAdminOnlineTests = (orderedIds) => axiosInstance.post('/api/admin/online-tests/reorder', { orderedIds }).then(unwrap);
export const deleteAdminOnlineTest = (id) => axiosInstance.delete(`/api/admin/online-tests/${id}`).then(unwrap);

export const getAdminSubjectPapers = (slug, params) => axiosInstance.get(`/api/admin/resources/subjects/${slug}/papers${qs(params)}`).then(unwrap);
export const reorderAdminPapers = (slug, classLevel, orderedExtUids) => axiosInstance.post(`/api/admin/resources/subjects/${slug}/papers/reorder`, { classLevel, orderedExtUids }).then(unwrap);
export const deleteAdminPaper = (slug, extUid, classLevel) => axiosInstance.delete(`/api/admin/resources/subjects/${slug}/papers${qs({ extUid, class: classLevel })}`).then(unwrap);
export const getAdminPaper = (slug, extUid) => axiosInstance.get(`/api/admin/resources/subjects/${slug}/papers/${extUid}`).then(unwrap);
export const createAdminPaper = (slug, body) => axiosInstance.post(`/api/admin/resources/subjects/${slug}/papers`, body).then(unwrap);
export const updateAdminPaper = (slug, extUid, body) => axiosInstance.put(`/api/admin/resources/subjects/${slug}/papers/${extUid}`, body).then(unwrap);

// ── Student Results (admin views any student's Results — same payload as the student's own) ──
export const getAdminStudentResults = (id, params) => axiosInstance.get(`/api/admin/students/${id}/results${qs(params)}`).then(unwrap);
export const getAdminStudentAttemptDetail = (id, attemptId) => axiosInstance.get(`/api/admin/students/${id}/results/attempt/${attemptId}`).then(unwrap);

// ── AI Teacher (monitor real lessons; watch any lesson in the real student player) ──
export const getAdminAiOverview = () => axiosInstance.get('/api/admin/ai-teacher/overview').then(unwrap);
export const getAdminAiLessons = (params) => axiosInstance.get(`/api/admin/ai-teacher/lessons${qs(params)}`).then(unwrap);
export const getAdminAiLesson = (id) => axiosInstance.get(`/api/admin/ai-teacher/lessons/${id}`).then(unwrap);
export const getAdminAiLessonAnalytics = (id) => axiosInstance.get(`/api/admin/ai-teacher/lessons/${id}/analytics`).then(unwrap);

// ── Parents ────────────────────────────────────────────────────────────────────
export const getAdminParents = (params) => axiosInstance.get(`/api/admin/parents${qs(params)}`).then(unwrap);
export const getAdminParent = (id) => axiosInstance.get(`/api/admin/parents/${id}`).then(unwrap);
export const linkAdminParent = (id, body) => axiosInstance.post(`/api/admin/parents/${id}/link`, body).then(unwrap);
export const unlinkAdminParent = (id) => axiosInstance.post(`/api/admin/parents/${id}/unlink`, {}).then(unwrap);
