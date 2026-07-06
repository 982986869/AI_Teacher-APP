import axiosInstance from './axiosInstance';

// Resources (PYQ & other sections) — backend wraps responses as
// { success, message, data }; we unwrap to the inner `data`.

export const getSubjects = async () =>
  (await axiosInstance.get('/api/resources/subjects')).data.data;

// Subjects available for a class + per-feature flags, derived from the DB (no
// hardcoded per-class lists). Each item:
//   { name, slug, parts:[2,4,5,8], importantQuestions, pyq, practice, online, mock }
export const getClassSubjects = async (classLevel) =>
  (await axiosInstance.get('/api/resources/class-subjects', { params: { class: classLevel } })).data.data;

// Which classes currently have content in the DB, e.g. ['Class 6','Class 11','Class 12'].
// Drives the "show content vs coming-soon" gate — no hardcoded class list needed.
export const getContentClasses = async () =>
  (await axiosInstance.get('/api/resources/classes')).data.data.classes;

// classLevel (9–12) selects the grade; defaults to 11 for back-compat.
export const getChapters = async (subjectSlug, sectionType, classLevel) =>
  (await axiosInstance.get(`/api/resources/subjects/${subjectSlug}/chapters`, {
    params: { class: classLevel, ...(sectionType ? { section: sectionType } : {}) },
  })).data.data;

export const getSections = async (chapterId) =>
  (await axiosInstance.get(`/api/resources/chapters/${chapterId}/sections`)).data.data;

export const getQuestions = async (sectionId) =>
  (await axiosInstance.get(`/api/resources/sections/${sectionId}/questions`)).data.data;

// Convenience: questions straight from slugs (matches the screen navigation).
export const getQuestionsByPath = async (subjectSlug, chapterSlug, sectionType, classLevel) =>
  (await axiosInstance.get(
    `/api/resources/content/${subjectSlug}/${chapterSlug}/${sectionType}`,
    { params: { class: classLevel } }
  )).data.data;

// Revision Notes for a chapter (DB-backed). Returns { intro, blocks } where
// blocks = [{ title, html }] — the flashcard-grouped notes the importer stored.
export const getNotesByPath = async (subjectSlug, chapterSlug, classLevel) =>
  (await axiosInstance.get(`/api/resources/notes/${subjectSlug}/${chapterSlug}`,
    { params: { class: classLevel } })).data.data;

// Last Year Papers (DB-backed). List returns [{ code, year, setLabel, name }];
// getPaper returns one paper's { code, year, setLabel, name, questionPaperHtml,
// answerKeyHtml }. code carries slashes (55/1/1) so it goes as a query param.
// `year` disambiguates the code — CBSE reuses the same code across years. No class
// fallback: the backend uses the student's saved class regardless of what we send.
export const getPapers = async (subjectSlug, classLevel) =>
  (await axiosInstance.get(`/api/resources/papers/${subjectSlug}`,
    { params: { class: classLevel } })).data.data;

export const getPaper = async (subjectSlug, code, classLevel, year) =>
  (await axiosInstance.get(`/api/resources/paper/${subjectSlug}`,
    { params: { class: classLevel, code, ...(year != null ? { year } : {}) } })).data.data;

// MCQ Practice: real MCQs for a chapter, shaped for McqTestScreen
// ({ cat, question, options: string[], correct: index }).
export const getMcqByPath = async (subjectSlug, chapterSlug, classLevel) =>
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
