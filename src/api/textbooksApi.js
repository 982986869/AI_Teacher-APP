import axiosInstance from './axiosInstance';
import { API_BASE_URL } from '../constants/config';

// Textbooks for the student's class (the server reads the class from the JWT scope).
// Backend wraps responses as { success, message, data }; we unwrap to `data`.

// GET /api/textbooks?class=9 → [{ id, code, title, subject, subjectSlug, edition, coverUrl, chapterCount }]
// `classLevel` is the class being browsed (the home page's chip); without it the
// server uses the profile class.
export const getBooks = async (classLevel) =>
  (await axiosInstance.get('/api/textbooks', { params: classLevel ? { class: classLevel } : {} })).data.data;

// GET /api/textbooks/:bookId/chapters → { book, chapters:[{ id, number, title, topicCount }] }
export const getBookChapters = async (bookId) => (await axiosInstance.get(`/api/textbooks/${bookId}/chapters`)).data.data;

// GET /api/textbooks/chapters/:chapterId → { book, chapter:{id,number,title}, topics:[{ id, number, title, charCount }] }
export const getBookChapter = async (chapterId) => (await axiosInstance.get(`/api/textbooks/chapters/${chapterId}`)).data.data;

// Cover images are served statically from the API host (server/public/books).
const HOST = String(API_BASE_URL || '').replace(/\/+$/, '').replace(/\/api$/i, '');
export const coverUri = (coverUrl) => (coverUrl ? `${HOST}${coverUrl}` : null);
