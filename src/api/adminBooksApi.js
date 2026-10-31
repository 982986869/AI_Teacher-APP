// src/api/adminBooksApi.js
// Admin side of the personalized section (uploaded books), for the phone.
//
// The same /api/admin/books/* endpoints the web portal uses — nothing new on the
// server. Every call goes through the shared axiosInstance, so the signed-in
// admin's JWT rides along and 401 handling is inherited.
//
// Three gates stand between generated content and a student, and all three
// default closed:
//   1. the book's own `published` switch
//   2. the chapter's `visible` switch
//   3. each section's `status` (draft | published)
// The server checks all three in one query, so a switch shown here is a switch
// that actually holds.
import axiosInstance from './axiosInstance';

const unwrap = (res) => res.data?.data;

export const KINDS = ['notes', 'resource', 'practice', 'quiz'];

// ── Reads ────────────────────────────────────────────────────────────────────
export const getBooks = () => axiosInstance.get('/api/admin/books').then(unwrap);
export const getBooksMeta = () => axiosInstance.get('/api/admin/books/meta').then(unwrap);
export const getBookChapters = (bookId) =>
  axiosInstance.get(`/api/admin/books/${bookId}/chapters`).then(unwrap);
export const getBookReads = (bookId) =>
  axiosInstance.get(`/api/admin/books/${bookId}/reads`).then(unwrap);
export const getContent = (id) =>
  axiosInstance.get(`/api/admin/books/content/${id}`).then(unwrap);
export const getChapterConcepts = (chapterId) =>
  axiosInstance.get(`/api/admin/books/chapter/${chapterId}/concepts`).then(unwrap);

// ── Upload ───────────────────────────────────────────────────────────────────
/**
 * Send a PDF picked on the device. Multipart, matching the web portal's call.
 *
 * `onProgress` reports bytes sent, which only covers the upload — once the last
 * byte lands the server parses the PDF and finds its chapters, and no further
 * event arrives. The caller says so rather than leaving a bar stuck at 100%.
 *
 * The timeout is generous because a 40 MB file on Indian mobile data is a slow
 * minute, and axios' default would abort a transfer that was going to succeed.
 */
export const uploadBook = (file, { title, classLevel, subjectId } = {}, onProgress) => {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name || 'book.pdf',
    type: file.mimeType || 'application/pdf',
  });
  if (title) form.append('title', title);
  if (classLevel) form.append('classLevel', String(classLevel));
  if (subjectId) form.append('subjectId', String(subjectId));

  return axiosInstance
    .post('/api/admin/books', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
      onUploadProgress: (e) => {
        if (!onProgress || !e.total) return;
        onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
      },
    })
    .then(unwrap);
};

// ── Generation ───────────────────────────────────────────────────────────────
// One section at a time. The caller sequences a whole chapter rather than firing
// four at once: four parallel model calls is a spend burst and a rate-limit risk,
// and nobody can read four spinners anyway.
export const generateSection = (chapterId, kind) =>
  axiosInstance.post(`/api/admin/books/chapter/${chapterId}/generate`, { kind }).then(unwrap);

export const relinkConcepts = (chapterId) =>
  axiosInstance.post(`/api/admin/books/chapter/${chapterId}/concepts/relink`).then(unwrap);

// ── The three gates ──────────────────────────────────────────────────────────
export const setBookPublished = (bookId, published) =>
  axiosInstance.post(`/api/admin/books/${bookId}/publish`, { published }).then(unwrap);
export const setChapterVisible = (chapterId, visible) =>
  axiosInstance.post(`/api/admin/books/chapter/${chapterId}/visible`, { visible }).then(unwrap);
export const setContentStatus = (contentId, status) =>
  axiosInstance.post(`/api/admin/books/content/${contentId}/status`, { status }).then(unwrap);

// ── Edits ────────────────────────────────────────────────────────────────────
export const editChapter = (chapterId, body) =>
  axiosInstance.patch(`/api/admin/books/chapter/${chapterId}`, body).then(unwrap);
export const deleteBook = (bookId) =>
  axiosInstance.delete(`/api/admin/books/${bookId}`).then(unwrap);
