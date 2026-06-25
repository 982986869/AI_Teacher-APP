import axiosInstance from './axiosInstance';

// Resources (PYQ & other sections) — backend wraps responses as
// { success, message, data }; we unwrap to the inner `data`.

export const getSubjects = async () =>
  (await axiosInstance.get('/api/resources/subjects')).data.data;

// classLevel (9–12) selects the grade; defaults to 11 for back-compat.
export const getChapters = async (subjectSlug, sectionType, classLevel = 11) =>
  (await axiosInstance.get(`/api/resources/subjects/${subjectSlug}/chapters`, {
    params: { class: classLevel, ...(sectionType ? { section: sectionType } : {}) },
  })).data.data;

export const getSections = async (chapterId) =>
  (await axiosInstance.get(`/api/resources/chapters/${chapterId}/sections`)).data.data;

export const getQuestions = async (sectionId) =>
  (await axiosInstance.get(`/api/resources/sections/${sectionId}/questions`)).data.data;

// Convenience: questions straight from slugs (matches the screen navigation).
export const getQuestionsByPath = async (subjectSlug, chapterSlug, sectionType, classLevel = 11) =>
  (await axiosInstance.get(
    `/api/resources/content/${subjectSlug}/${chapterSlug}/${sectionType}`,
    { params: { class: classLevel } }
  )).data.data;

// MCQ Practice: real MCQs for a chapter, shaped for McqTestScreen
// ({ cat, question, options: string[], correct: index }).
export const getMcqByPath = async (subjectSlug, chapterSlug, classLevel = 11) =>
  (await axiosInstance.get(`/api/resources/mcq/${subjectSlug}/${chapterSlug}`,
    { params: { class: classLevel } })).data.data;

// Exemplar Solutions (DB-backed). Returns { subject, className, chapter, sections }
// where sections = [{ label, questions: [{ q, text, options, solutionLabel,
// solution, questionImages, solutionImages }] }] — the SAME shape the screen used
// from the old static getExemplarSections(), so rendering stays unchanged.
export const getExemplarSolutions = async ({ subject, className, chapter }) =>
  (await axiosInstance.get('/api/resources/exemplar', {
    params: { subject, class: className, chapter },
  })).data.data;

// NCERT Solutions (DB-backed). Same shapes the old static helpers returned:
//   getNcertSolutions -> { part, subject, className, chapter, sections: [{ key, label, html }] }
//   getNcertChapters  -> { part, subject, className, chapters: [name, ...] }
export const getNcertSolutions = async ({ part = 2, subject, className, chapter }) =>
  (await axiosInstance.get('/api/resources/ncert', {
    params: { part, subject, class: className, chapter },
  })).data.data;

export const getNcertChapters = async ({ part = 2, subject, className }) =>
  (await axiosInstance.get('/api/resources/ncert/chapters', {
    params: { part, subject, class: className },
  })).data.data;
