// src/api/booksApi.js
// Books an admin uploaded and published for this student's class.
//
// Read-only by construction: there is no upload or edit endpoint here because the
// server has none for students. Authoring lives entirely under /api/admin/books.
import axiosInstance from './axiosInstance';

const unwrap = (res) => res.data?.data ?? res.data;
const classParam = (classLevel) => {
  const n = parseInt(String(classLevel || '').replace(/\D/g, ''), 10);
  return n ? { class: n } : {};
};

// [{ id, title, subject, page_count, chapters }] — already filtered to published
// books for the class. A failure is an empty shelf, never a thrown error: a book
// list is the last thing that should break Home.
export const getBooks = async (classLevel) => {
  try {
    const list = unwrap(await axiosInstance.get('/api/books', { params: classParam(classLevel) }));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

// [{ id, position, title, kinds: ['notes','quiz',…] }] — only chapters with at
// least one published section, so no row leads to an empty screen.
export const getBookChapters = async (bookId) =>
  unwrap(await axiosInstance.get(`/api/books/${bookId}/chapters`));

// kind: 'notes' | 'resource' | 'practice' | 'quiz'
export const getBookContent = async (chapterId, kind) =>
  unwrap(await axiosInstance.get(`/api/books/chapter/${chapterId}/${kind}`));
