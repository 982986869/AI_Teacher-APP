import axiosInstance from './axiosInstance';
import { API_BASE_URL } from '../constants/config';

// Textbooks for the student's class (the server reads the class from the JWT scope).
// Backend wraps responses as { success, message, data }; we unwrap to `data`.

// GET /api/books → [{ id, code, title, subject, subjectSlug, edition, coverUrl, chapterCount }]
export const getBooks = async () => (await axiosInstance.get('/api/books')).data.data;

// GET /api/books/:bookId/chapters → { book, chapters:[{ id, number, title, topicCount }] }
export const getBookChapters = async (bookId) => (await axiosInstance.get(`/api/books/${bookId}/chapters`)).data.data;

// GET /api/books/chapters/:chapterId → { book, chapter:{id,number,title}, topics:[{ id, number, title, charCount }] }
export const getBookChapter = async (chapterId) => (await axiosInstance.get(`/api/books/chapters/${chapterId}`)).data.data;

// Cover images are served statically from the API host (server/public/books).
const HOST = String(API_BASE_URL || '').replace(/\/+$/, '').replace(/\/api$/i, '');
export const coverUri = (coverUrl) => (coverUrl ? `${HOST}${coverUrl}` : null);
